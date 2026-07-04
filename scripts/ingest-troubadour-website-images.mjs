#!/usr/bin/env node
/**
 * Troubadour Lubbock — scrape livetroubadour.com + Parallel dev page;
 * upload hero, amenities, floor plans, unit renders to Cloudinary → property_registry.
 *
 * Usage:
 *   node scripts/ingest-troubadour-website-images.mjs --dry-run
 *   node scripts/ingest-troubadour-website-images.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadEnvFiles,
  configureCloudinaryFromEnv,
  classifyImageRole,
  extractMarkdownImages,
  toRegistryImage,
  uploadRemoteImage,
} from './lib/property-image-ingest.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

loadEnvFiles(readFileSync, existsSync, resolve, [
  resolve(ROOT, '.env.local'),
  resolve(ROOT, '.env'),
  resolve(ROOT, '../Derived State/dale-chat/.env.local'),
  resolve(ROOT, '../Derived State/dale-chat/.env'),
]);

const DRY = !process.argv.includes('--apply');
const PROPERTY_ID = '095960e3-5b22-4a0c-9528-e3843fed3ede';
const LEASING_SITE = 'https://livetroubadour.com';
const PARALLEL_PAGE = 'https://www.parallel-co.com/troubadour-student-living';
const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;

const SKIP_PATTERN =
  /outline-type|sing-your-story|cg_management|cardinal|7brew|chimy|cricket|monomyth|triple-j|bierhaus|wordmark|logo|icon|favicon|1x1|spacer|neighborhood-local/i;

/** Prefer full-size WordPress asset (drop WP size suffixes). */
function normalizeWpUrl(url) {
  return url
    .replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/i, '')
    .replace(/-aspect-ratio-\d+-\d+(?:-\d+x\d+)?(?=\.(jpg|jpeg|png|webp))/i, '')
    .replace(/-web-20x11(?=\.(jpg|jpeg|png|webp))/i, '-web');
}

/** Squarespace: canonical high-res variant. */
function normalizeSquarespaceUrl(url) {
  const base = url.split('?')[0];
  return `${base}?format=2500w`;
}

function troubadourRole(url, pageUrl = '') {
  const hay = `${url} ${pageUrl}`.toLowerCase();
  if (/streetexterior|1786e953|d57f6651e062b55ef6a26ab3aa1373ed475a4f52/.test(hay)) return 'hero';
  if (/enscape|renderings.*page\s*00[89]|renderings.*page\s*010|renderings.*page\s*011/.test(hay)) {
    return /enscape/.test(hay) ? 'units' : 'common_amenity';
  }
  if (/renderings.*page|renderings\+lighting/.test(hay)) return 'exterior';
  if (/pool|fitness|study|market|lounge|amenity|tbdr_|851-675|758-675|6b1bd3c8|805498df/.test(hay)) {
    if (/851-675|758-675|805498df|6b1bd3c8/.test(hay)) return 'floorplan';
    return 'common_amenity';
  }
  if (/floor.?plan|floorplan|layout|blueprint/.test(hay)) return 'floorplan';
  const generic = classifyImageRole(url, '', pageUrl);
  if (generic === 'exterior' && /aspect-ratio-600-799|508768788|61de35a1|66e47c42|978a0ebc|837460a1|83dcd0d7|1fb82dad|eba0125f/.test(hay)) {
    return 'common_amenity';
  }
  return generic;
}

async function firecrawlScrape(url) {
  if (!FIRECRAWL_KEY) return null;
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FIRECRAWL_KEY}`,
    },
    body: JSON.stringify({ url, formats: ['html', 'markdown', 'links'], onlyMainContent: false }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data || null;
}

function extractWpImages(html, pageUrl) {
  const found = new Map();
  if (!html) return found;
  const re = /(https:\/\/livetroubadour\.com\/wp-content\/uploads\/[^"'\s>]+\.(?:jpg|jpeg|png|webp))/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1];
    if (SKIP_PATTERN.test(raw)) continue;
    const url = normalizeWpUrl(raw);
    if (!found.has(url)) found.set(url, { url, pageUrl });
  }
  return found;
}

async function extractParallelImages() {
  const res = await fetch(PARALLEL_PAGE, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TLC-PropertyRegistry/1.0)' },
    signal: AbortSignal.timeout(30000),
  });
  const html = await res.text();
  const found = new Map();
  const re = /(https:\/\/images\.squarespace-cdn\.com\/content\/v1\/[^"'\s>]+\.(?:jpg|jpeg|png|webp))(?:\?format=[^"'\s>]*)?/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1];
    if (/wordmark|logo/i.test(raw)) {
      found.set(normalizeSquarespaceUrl(raw), { url: normalizeSquarespaceUrl(raw), pageUrl: PARALLEL_PAGE, logo: true });
      continue;
    }
    if (SKIP_PATTERN.test(raw)) continue;
    const url = normalizeSquarespaceUrl(raw);
    if (!found.has(url)) found.set(url, { url, pageUrl: PARALLEL_PAGE });
  }
  return found;
}

async function collectAllImages() {
  const pages = [
    `${LEASING_SITE}/`,
    `${LEASING_SITE}/amenities/`,
    `${LEASING_SITE}/floor-plans/`,
    `${LEASING_SITE}/gallery/`,
    `${LEASING_SITE}/virtual-tour/`,
  ];
  const merged = new Map();

  for (const page of pages) {
    const data = await firecrawlScrape(page);
    if (data?.metadata?.ogImage && !SKIP_PATTERN.test(data.metadata.ogImage)) {
      const url = normalizeWpUrl(data.metadata.ogImage);
      merged.set(url, { url, pageUrl: page });
    }
    for (const [url, meta] of extractWpImages(data?.html || '', page)) {
      merged.set(url, meta);
    }
    for (const raw of extractMarkdownImages(data?.markdown || '')) {
      if (!raw.includes('livetroubadour.com/wp-content')) continue;
      if (SKIP_PATTERN.test(raw)) continue;
      const url = normalizeWpUrl(raw);
      merged.set(url, { url, pageUrl: page });
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  for (const [url, meta] of await extractParallelImages()) {
    merged.set(url, meta);
  }

  return merged;
}

function pickHero(images, candidates) {
  const hero =
    images.find((i) => i.role === 'hero') ||
    images.find((i) => /streetexterior|1786e953/i.test(i.source_url || i.url || '')) ||
    images.find((i) => i.role === 'exterior') ||
    images[0];
  return hero?.url || null;
}

function pickLogo(candidates) {
  for (const [, meta] of candidates) {
    if (meta.logo) return meta.url;
  }
  return null;
}

async function main() {
  if (!process.env.REGISTRY_IQ_SUPABASE_URL || !process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Registry-iQ env');
  }
  if (!FIRECRAWL_KEY) throw new Error('Missing FIRECRAWL_API_KEY');
  if (!DRY && !configureCloudinaryFromEnv()) throw new Error('Missing Cloudinary configuration');

  console.log(`Troubadour website images (${DRY ? 'DRY-RUN' : 'APPLY'})`);

  const reg = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { data: prop, error: pErr } = await reg
    .from('property_registry')
    .select('id, property_name, property_url, hero_image_url, logo_image_url, images, enrichment_sources, external_ids')
    .eq('id', PROPERTY_ID)
    .single();
  if (pErr || !prop) throw new Error(pErr?.message || 'property not found');

  const imageMap = await collectAllImages();
  console.log(`  Discovered ${imageMap.size} unique source URLs`);

  const uploaded = [];
  let idx = 0;
  const roleCounts = {};

  for (const [sourceUrl, meta] of imageMap) {
    if (meta.logo) continue;
    const role = troubadourRole(sourceUrl, meta.pageUrl);
    roleCounts[role] = (roleCounts[role] || 0) + 1;
    const label = decodeURIComponent(sourceUrl.split('/').pop()?.replace(/\?.*$/, '') || role).slice(0, 80);
    const publicId = `troubadour_${role}_${idx}`;

    if (DRY) {
      console.log(`  [DRY] ${role}: ${sourceUrl.slice(0, 100)}`);
      uploaded.push(
        toRegistryImage(
          { secure_url: sourceUrl, public_id: publicId, width: 0, height: 0, format: 'jpg', bytes: 0 },
          role,
          label,
          sourceUrl,
        ),
      );
      idx++;
      continue;
    }

    try {
      const result = await uploadRemoteImage(sourceUrl, {
        folder: `property-registry/${PROPERTY_ID}`,
        publicId,
      });
      uploaded.push(toRegistryImage(result, role, label, sourceUrl));
      idx++;
    } catch (e) {
      console.log(`  FAIL ${role}: ${sourceUrl.slice(0, 70)}… — ${e.message}`);
    }
  }

  const logoUrl = pickLogo(imageMap);
  let logoCloudinary = prop.logo_image_url;
  if (logoUrl && !DRY) {
    try {
      const r = await uploadRemoteImage(logoUrl, {
        folder: `property-registry/${PROPERTY_ID}`,
        publicId: 'troubadour_logo',
      });
      logoCloudinary = r.secure_url;
    } catch (e) {
      console.log(`  logo upload fail: ${e.message}`);
    }
  }

  const hero = pickHero(uploaded, imageMap);
  const sourceEntry = {
    type: 'website_image_ingest',
    at: new Date().toISOString(),
    site: LEASING_SITE,
    parallel_page: PARALLEL_PAGE,
    uploaded: uploaded.length,
    roles: [...new Set(uploaded.map((i) => i.role))],
    role_counts: roleCounts,
  };

  const report = {
    property_id: PROPERTY_ID,
    discovered: imageMap.size,
    uploaded: uploaded.length,
    role_counts: roleCounts,
    hero,
    logo: logoCloudinary,
    dry_run: DRY,
  };
  writeFileSync(resolve(ROOT, '.firecrawl/troubadour-website-images-report.json'), JSON.stringify(report, null, 2));

  console.log('  Roles:', roleCounts);

  if (DRY) {
    console.log(`  Would upload ${uploaded.length} images; hero=${hero?.slice(0, 60)}…`);
    return;
  }

  const prevSources = Array.isArray(prop.enrichment_sources) ? prop.enrichment_sources : [];
  const patch = {
    property_url: LEASING_SITE,
    hero_image_url: hero,
    logo_image_url: logoCloudinary || prop.logo_image_url,
    images: uploaded,
    enrichment_sources: [...prevSources.filter((s) => s.type !== 'website_image_ingest'), sourceEntry],
    external_ids: {
      ...(typeof prop.external_ids === 'object' && prop.external_ids ? prop.external_ids : {}),
      leasing_website: LEASING_SITE,
      developer_page: PARALLEL_PAGE,
      website_images_synced_at: new Date().toISOString(),
    },
  };

  const { error } = await reg.from('property_registry').update(patch).eq('id', PROPERTY_ID);
  if (error) throw new Error(error.message);

  console.log(`  Saved ${uploaded.length} images to property_registry`);
  console.log(`  Hero: ${hero}`);
  console.log(`  Admin: https://tlciq-platform.vercel.app/property-registry/${PROPERTY_ID}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
