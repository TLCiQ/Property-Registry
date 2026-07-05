#!/usr/bin/env node
/**
 * BSI-CSMX property website enrich — final step of ingest-bsi-csmx-property.mjs.
 *
 * Firecrawl-scrapes leasing + developer pages; uploads missing images to Cloudinary;
 * fills gaps in property_registry (url, hero, logo, brand, developer) and optionally
 * maps floorplan/unit images → property_unit_types.layout_asset_urls.
 *
 * Usage:
 *   node scripts/enrich-bsi-csmx-website.mjs --config=scripts/config/troubadour-lubbock-bsi-csmx.json --dry-run
 *   node scripts/enrich-bsi-csmx-website.mjs --config=scripts/config/troubadour-lubbock-bsi-csmx.json --apply
 *   node scripts/enrich-bsi-csmx-website.mjs --config=... --apply --force
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadBsiCsmxConfig } from './lib/bsi-csmx-config.mjs';
import {
  loadEnvFiles,
  configureCloudinaryFromEnv,
  classifyImageRole,
  extractMarkdownImages,
  toRegistryImage,
  uploadRemoteImage,
  normalizeWebsiteUrl,
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
const FORCE = process.argv.includes('--force');
const CONFIG_ARG = process.argv.find((a) => a.startsWith('--config='))?.split('=')[1];
if (!CONFIG_ARG) {
  console.error('Usage: node scripts/enrich-bsi-csmx-website.mjs --config=scripts/config/<property>.json [--apply] [--force]');
  process.exit(1);
}

const cfg = loadBsiCsmxConfig(resolve(ROOT, CONFIG_ARG));
const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1';

const SKIP_PATTERN =
  /outline-type|wordmark|logo|icon|favicon|1x1|spacer|pixel|badge|cdninstagram|scontent-/i;

function normalizeWpUrl(url) {
  return url
    .replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/i, '')
    .replace(/-aspect-ratio-\d+-\d+(?:-\d+x\d+)?(?=\.(jpg|jpeg|png|webp))/i, '')
    .replace(/-web-20x11(?=\.(jpg|jpeg|png|webp))/i, '-web');
}

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

function resolveRole(url, pageUrl, classifier) {
  if (classifier === 'troubadour') return troubadourRole(url, pageUrl);
  return classifyImageRole(url, '', pageUrl);
}

async function firecrawlScrape(url) {
  if (!FIRECRAWL_KEY) return null;
  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'markdown', 'links'],
        onlyMainContent: false,
      }),
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (e) {
    console.log(`    scrape error (${url}): ${e.message}`);
    return null;
  }
}

function extractHtmlImages(html, origin, pageUrl) {
  const found = new Map();
  if (!html) return found;
  const host = origin.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const re = new RegExp(
    `(https://${host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[^"'\\s>]+\\.(?:jpg|jpeg|png|webp))`,
    'gi',
  );
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1];
    if (SKIP_PATTERN.test(raw)) continue;
    const url = normalizeWpUrl(raw);
    if (!found.has(url)) found.set(url, { url, pageUrl });
  }
  return found;
}

async function extractDeveloperImages(developerUrl) {
  const found = new Map();
  if (!developerUrl) return found;
  try {
    const res = await fetch(developerUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TLC-PropertyRegistry/1.0)' },
      signal: AbortSignal.timeout(30000),
    });
    const html = await res.text();
    const sqRe = /(https:\/\/images\.squarespace-cdn\.com\/content\/v1\/[^"'\s>]+\.(?:jpg|jpeg|png|webp))(?:\?format=[^"'\s>]*)?/gi;
    let m;
    while ((m = sqRe.exec(html))) {
      const raw = m[1];
      if (/wordmark|logo/i.test(raw)) {
        found.set(normalizeSquarespaceUrl(raw), {
          url: normalizeSquarespaceUrl(raw),
          pageUrl: developerUrl,
          logo: true,
        });
        continue;
      }
      if (SKIP_PATTERN.test(raw)) continue;
      const url = normalizeSquarespaceUrl(raw);
      if (!found.has(url)) found.set(url, { url, pageUrl: developerUrl });
    }
    const genericRe = /(https?:\/\/[^"'\s>]+\.(?:jpg|jpeg|png|webp))(?:\?[^"'\s>]*)?/gi;
    while ((m = genericRe.exec(html))) {
      if (/squarespace|livetroubadour|cloudinary|gravatar|facebook|instagram/i.test(m[1])) continue;
      if (SKIP_PATTERN.test(m[1])) continue;
      if (!found.has(m[1])) found.set(m[1], { url: m[1], pageUrl: developerUrl });
    }
  } catch (e) {
    console.log(`  developer page fetch fail: ${e.message}`);
  }
  return found;
}

async function collectImages(websiteCfg) {
  const leasing = websiteCfg.leasing_url;
  if (!leasing) throw new Error('website.leasing_url required in config');
  const site = normalizeWebsiteUrl(leasing);
  if (!site?.origin) throw new Error(`Invalid leasing_url: ${leasing}`);

  const paths = websiteCfg.extra_pages?.length
    ? websiteCfg.extra_pages
    : ['/', '/amenities/', '/floor-plans/', '/gallery/'];
  const merged = new Map();

  for (const path of paths) {
    const url = path.startsWith('http') ? path : `${site.origin}${path.startsWith('/') ? path : `/${path}`}`;
    const data = await firecrawlScrape(url);
    if (data?.metadata?.ogImage && !SKIP_PATTERN.test(data.metadata.ogImage)) {
      const og = normalizeWpUrl(data.metadata.ogImage);
      merged.set(og, { url: og, pageUrl: url });
    }
    for (const [imgUrl, meta] of extractHtmlImages(data?.html || '', site.origin, url)) {
      merged.set(imgUrl, meta);
    }
    for (const raw of extractMarkdownImages(data?.markdown || '')) {
      if (SKIP_PATTERN.test(raw)) continue;
      const normalized = raw.includes('wp-content') ? normalizeWpUrl(raw) : raw;
      merged.set(normalized, { url: normalized, pageUrl: url });
    }
    for (const link of data?.links || []) {
      if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(link)) continue;
      if (SKIP_PATTERN.test(link)) continue;
      merged.set(link, { url: link, pageUrl: url });
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  for (const [url, meta] of await extractDeveloperImages(websiteCfg.developer_url)) {
    merged.set(url, meta);
  }

  return { site, merged };
}

function mergeImages(existing, incoming) {
  const byUrl = new Map();
  for (const img of existing || []) {
    if (img?.url) byUrl.set(img.url, img);
    if (img?.source_url) byUrl.set(img.source_url, img);
  }
  for (const img of incoming) {
    byUrl.set(img.url, img);
  }
  return [...byUrl.values()];
}

function pickHero(images, existingHero) {
  if (!FORCE && existingHero?.includes('res.cloudinary.com')) return existingHero;
  const hero =
    images.find((i) => i.role === 'hero') ||
    images.find((i) => i.role === 'exterior') ||
    images[0];
  return hero?.url || existingHero || null;
}

function pickLogo(candidates, existingLogo) {
  if (!FORCE && existingLogo?.includes('res.cloudinary.com')) return existingLogo;
  for (const [, meta] of candidates) {
    if (meta.logo) return meta.url;
  }
  return existingLogo || null;
}

function matchUnitType(unitTypes, hay) {
  if (!hay) return null;
  const sorted = [...unitTypes].sort(
    (a, b) => (b.unit_type_name || '').length - (a.unit_type_name || '').length,
  );
  for (const ut of sorted) {
    const name = (ut.unit_type_name || '').trim();
    if (!name) continue;
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${esc}\\b`, 'i').test(hay)) return ut;
  }
  return null;
}

function existingSourceUrls(images) {
  const s = new Set();
  for (const img of images || []) {
    if (img?.source_url) s.add(img.source_url);
    if (img?.url) s.add(img.url);
  }
  return s;
}

async function mapLayoutsToUnitTypes(reg, propertyId, uploaded, unitTypes, dryRun) {
  const layoutRoles = new Set(['floorplan', 'unit_layout', 'units']);
  const updates = [];

  for (const img of uploaded) {
    if (!layoutRoles.has(img.role)) continue;
    const hay = `${img.label || ''} ${img.source_url || ''} ${img.url || ''}`;
    const ut = matchUnitType(unitTypes, hay);
    if (!ut) continue;
    const existing = Array.isArray(ut.layout_asset_urls) ? ut.layout_asset_urls : [];
    if (!FORCE && existing.length > 0) continue;
    if (existing.includes(img.url)) continue;
    updates.push({ id: ut.id, unit_type_name: ut.unit_type_name, url: img.url });
  }

  if (!updates.length) {
    console.log('  Unit-type layout map: no new matches');
    return { mapped: 0 };
  }

  console.log(`  Unit-type layout map: ${updates.length} candidate(s)`);
  if (dryRun) {
    for (const u of updates) console.log(`    [DRY] ${u.unit_type_name} ← ${u.url.slice(0, 70)}…`);
    return { mapped: updates.length };
  }

  let mapped = 0;
  for (const u of updates) {
    const { error } = await reg
      .from('property_unit_types')
      .update({ layout_asset_urls: [u.url] })
      .eq('id', u.id);
    if (error) console.log(`    FAIL ${u.unit_type_name}: ${error.message}`);
    else mapped++;
  }
  return { mapped };
}

async function main() {
  if (!process.env.REGISTRY_IQ_SUPABASE_URL || !process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Registry-iQ env');
  }
  if (!FIRECRAWL_KEY) throw new Error('Missing FIRECRAWL_API_KEY');
  if (!DRY && !configureCloudinaryFromEnv()) throw new Error('Missing Cloudinary configuration');

  const website = cfg.website || {};
  const maxImages = website.max_images || 25;
  const classifier = website.role_classifier || 'generic';

  console.log(`BSI-CSMX website enrich — ${cfg.property_name || cfg.property_key} (${DRY ? 'DRY-RUN' : 'APPLY'})`);

  const reg = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { data: prop, error: pErr } = await reg
    .from('property_registry')
    .select(
      'id, property_name, property_url, hero_image_url, logo_image_url, brand_name, developer_name, images, enrichment_sources, external_ids',
    )
    .eq('id', cfg.property_id)
    .single();
  if (pErr || !prop) throw new Error(pErr?.message || 'property not found');

  const { data: unitTypes } = await reg
    .from('property_unit_types')
    .select('id, unit_type_name, layout_asset_urls')
    .eq('property_id', cfg.property_id);

  const { site, merged } = await collectImages(website);
  console.log(`  Discovered ${merged.size} unique source URLs from ${site.origin}`);

  const known = existingSourceUrls(prop.images);
  const uploaded = [];
  let idx = 0;
  const roleCounts = {};

  for (const [sourceUrl, meta] of merged) {
    if (meta.logo) continue;
    if (!FORCE && known.has(sourceUrl)) continue;
    if (uploaded.length >= maxImages) break;

    const role = resolveRole(sourceUrl, meta.pageUrl, classifier);
    roleCounts[role] = (roleCounts[role] || 0) + 1;
    const label = decodeURIComponent(sourceUrl.split('/').pop()?.replace(/\?.*$/, '') || role).slice(0, 80);
    const publicId = `${cfg.property_key.slice(0, 24)}_${role}_${idx}`.replace(/[^a-zA-Z0-9_-]/g, '_');

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
        folder: `property-registry/${cfg.property_id}`,
        publicId,
      });
      uploaded.push(toRegistryImage(result, role, label, sourceUrl));
      idx++;
    } catch (e) {
      console.log(`  FAIL ${role}: ${sourceUrl.slice(0, 70)}… — ${e.message}`);
    }
  }

  const logoSource = pickLogo(merged, prop.logo_image_url);
  let logoCloudinary = prop.logo_image_url;
  if (logoSource && !logoSource.includes('res.cloudinary.com') && !DRY) {
    try {
      const r = await uploadRemoteImage(logoSource, {
        folder: `property-registry/${cfg.property_id}`,
        publicId: `${cfg.property_key.slice(0, 20)}_logo`.replace(/[^a-zA-Z0-9_-]/g, '_'),
      });
      logoCloudinary = r.secure_url;
    } catch (e) {
      console.log(`  logo upload fail: ${e.message}`);
    }
  }

  const mergedImages = mergeImages(prop.images, uploaded);
  const hero = pickHero(mergedImages, prop.hero_image_url);

  const layoutResult = website.map_floorplans_to_unit_types !== false
    ? await mapLayoutsToUnitTypes(reg, cfg.property_id, uploaded, unitTypes || [], DRY)
    : { mapped: 0 };

  const sourceEntry = {
    type: 'bsi_csmx_website_enrich',
    at: new Date().toISOString(),
    config: CONFIG_ARG,
    site: site.origin,
    developer_page: website.developer_url || null,
    uploaded: uploaded.length,
    roles: [...new Set(uploaded.map((i) => i.role))],
    role_counts: roleCounts,
    layout_mapped: layoutResult.mapped,
  };

  const report = {
    property_id: cfg.property_id,
    property_key: cfg.property_key,
    discovered: merged.size,
    uploaded: uploaded.length,
    skipped_existing: merged.size - uploaded.length,
    role_counts: roleCounts,
    layout_mapped: layoutResult.mapped,
    hero,
    logo: logoCloudinary,
    dry_run: DRY,
    generated_at: new Date().toISOString(),
  };
  const reportPath = resolve(ROOT, `.firecrawl/${cfg.property_key}-website-enrich-report.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('  Roles:', roleCounts);
  console.log(`  Report: ${reportPath.replace(`${ROOT}/`, '')}`);

  if (DRY) {
    console.log(`  Would upload ${uploaded.length} new images; hero=${hero?.slice(0, 60) || 'unchanged'}…`);
    return;
  }

  const prevSources = Array.isArray(prop.enrichment_sources) ? prop.enrichment_sources : [];
  const patch = {
    enrichment_sources: [...prevSources.filter((s) => s.type !== 'bsi_csmx_website_enrich'), sourceEntry],
    external_ids: {
      ...(typeof prop.external_ids === 'object' && prop.external_ids ? prop.external_ids : {}),
      leasing_website: website.leasing_url || prop.external_ids?.leasing_website,
      developer_page: website.developer_url || prop.external_ids?.developer_page,
      website_images_synced_at: new Date().toISOString(),
    },
  };

  if (uploaded.length) patch.images = mergedImages;
  if (hero) patch.hero_image_url = hero;
  if (logoCloudinary) patch.logo_image_url = logoCloudinary;
  if (!prop.property_url && website.leasing_url) patch.property_url = website.leasing_url;
  if (!prop.brand_name && cfg.brand) patch.brand_name = cfg.brand;
  if (!prop.developer_name && cfg.developer) patch.developer_name = cfg.developer;

  const { error } = await reg.from('property_registry').update(patch).eq('id', cfg.property_id);
  if (error) throw new Error(error.message);

  console.log(`  Saved ${uploaded.length} new images (${Object.keys(patch).join(', ')})`);
  console.log(`  Admin: https://tlciq-platform.vercel.app/property-registry/${cfg.property_id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
