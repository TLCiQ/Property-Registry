#!/usr/bin/env node
/**
 * Scrape property / leasing websites for hero, floor plans, unit layouts, unit photos;
 * upload all to Cloudinary; merge into property_registry.images + hero_image_url.
 *
 * Targets properties enriched by CS-09 / PT-01 (portfolio + Core Spaces project team).
 *
 * Usage:
 *   node scripts/enrich-property-website-images.mjs --dry-run --limit=10
 *   node scripts/enrich-property-website-images.mjs --apply --limit=50
 *   node scripts/enrich-property-website-images.mjs --apply --property-id=<uuid>
 *   node scripts/enrich-property-website-images.mjs --apply --force
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadEnvFiles,
  configureCloudinaryFromEnv,
  resolvePropertyWebsite,
  normalizeWebsiteUrl,
  GALLERY_PATHS,
  extractMarkdownImages,
  classifyImageRole,
  toRegistryImage,
  uploadRemoteImage,
  isEnrichedProperty,
  needsImageWork,
  fetchAllRows,
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
const LIMIT = parseInt(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0', 10) || null;
const PROPERTY_ID = process.argv.find((a) => a.startsWith('--property-id='))?.split('=')[1] || null;

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1';

const stats = {
  candidates: 0,
  scraped: 0,
  images_found: 0,
  images_uploaded: 0,
  properties_updated: 0,
  heroes_set: 0,
  skipped_no_site: 0,
  errors: 0,
};

function log(...args) { console.log(...args); }

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
        formats: ['markdown', 'links'],
        onlyMainContent: false,
      }),
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || json;
  } catch (e) {
    log(`    scrape error: ${e.message}`);
    return null;
  }
}

async function firecrawlSearch(query, limit = 3) {
  if (!FIRECRAWL_KEY) return [];
  try {
    const res = await fetch(`${FIRECRAWL_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
      },
      body: JSON.stringify({ query, limit, scrapeOptions: { formats: ['markdown'] } }),
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch (e) {
    log(`    search error: ${e.message}`);
    return [];
  }
}

async function discoverLeasingSite(prop) {
  const resolved = resolvePropertyWebsite(prop);
  if (resolved?.origin) return resolved;

  const city = prop.city && prop.city !== 'Unknown' ? prop.city : '';
  const state = prop.state_province && prop.state_province !== 'Unknown' ? prop.state_province : '';
  const q = `"${prop.property_name}" ${city} ${state} student housing apartments floor plans`;
  const results = await firecrawlSearch(q, 5);
  for (const r of results) {
    const hit = normalizeWebsiteUrl(r.url);
    if (hit) return hit;
  }
  return null;
}

async function collectImagesFromSite(site, propName) {
  const found = new Map(); // url -> { role, alt, pageUrl }

  const base = site.origin.replace(/\/$/, '');
  const paths = site.path ? [site.path] : GALLERY_PATHS.slice(0, 12);

  for (const path of paths) {
    const url = `${base}${path.startsWith('/') || path === '' ? path : `/${path}`}`;
    const data = await firecrawlScrape(url);
    if (!data?.markdown && !data?.metadata) continue;
    stats.scraped++;

    const pageUrl = data.metadata?.sourceURL || url;
    if (data.metadata?.ogImage) {
      const role = classifyImageRole(data.metadata.ogImage, 'og hero', pageUrl);
      found.set(data.metadata.ogImage, { role: role === 'exterior' ? 'hero' : role, alt: 'og:image', pageUrl });
    }

    for (const img of extractMarkdownImages(data.markdown || '')) {
      const role = classifyImageRole(img, '', pageUrl);
      if (!found.has(img)) found.set(img, { role, alt: '', pageUrl });
    }

    for (const link of data.links || []) {
      if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(link)) continue;
      const role = classifyImageRole(link, '', pageUrl);
      if (!found.has(link)) found.set(link, { role, alt: '', pageUrl });
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  return found;
}

function mergeImages(existing, incoming) {
  const byUrl = new Map();
  for (const img of existing || []) {
    if (img?.url) byUrl.set(img.url, img);
  }
  for (const img of incoming) {
    byUrl.set(img.url, img);
  }
  return [...byUrl.values()];
}

function pickHero(images, existingHero) {
  if (existingHero?.includes('res.cloudinary.com')) return existingHero;
  const hero = images.find((i) => i.role === 'hero')
    || images.find((i) => i.role === 'exterior')
    || images[0];
  return hero?.url || existingHero || null;
}

async function processProperty(sb, prop) {
  const site = await discoverLeasingSite(prop);
  if (!site?.origin) {
    stats.skipped_no_site++;
    log(`  SKIP no site: ${prop.property_name}`);
    return;
  }

  log(`  Site: ${site.origin} (${prop.property_name})`);
  const imageMap = await collectImagesFromSite(site, prop.property_name);
  stats.images_found += imageMap.size;

  if (imageMap.size === 0) {
    log(`  No images found`);
    return;
  }

  const existing = Array.isArray(prop.images) ? prop.images : [];
  const uploaded = [];
  let idx = 0;

  for (const [sourceUrl, meta] of imageMap) {
    if (uploaded.length >= 25) break;
    const role = meta.role || 'exterior';
    const label = sourceUrl.split('/').pop()?.replace(/\?.*$/, '').replace(/\.[^.]+$/, '') || role;
    const publicId = `${prop.id.slice(0, 8)}_${role}_${idx}`;

    if (DRY) {
      log(`    [DRY] ${role}: ${sourceUrl.slice(0, 90)}`);
      uploaded.push(toRegistryImage(
        { secure_url: sourceUrl, public_id: publicId, width: 0, height: 0, format: 'jpg', bytes: 0 },
        role,
        label,
        sourceUrl,
      ));
      idx++;
      continue;
    }

    try {
      const isPdf = /\.pdf(\?|$)/i.test(sourceUrl);
      const result = await uploadRemoteImage(sourceUrl, {
        folder: `property-registry/${prop.id}`,
        publicId,
        resourceType: isPdf ? 'image' : 'image',
      });
      uploaded.push(toRegistryImage(result, role, label, sourceUrl));
      stats.images_uploaded++;
      idx++;
    } catch (e) {
      stats.errors++;
      log(`    upload fail: ${sourceUrl.slice(0, 60)}… ${e.message}`);
    }
  }

  if (!uploaded.length) return;

  const merged = mergeImages(existing, uploaded);
  const hero = pickHero(merged, prop.hero_image_url);
  if (hero?.includes('cloudinary')) stats.heroes_set++;

  const sourceEntry = {
    type: 'website_image_ingest',
    at: new Date().toISOString(),
    site: site.origin,
    uploaded: uploaded.length,
    roles: [...new Set(uploaded.map((i) => i.role))],
  };

  if (DRY) {
    stats.properties_updated++;
    log(`  [DRY] would save ${uploaded.length} images, hero=${!!hero}`);
    return;
  }

  const prev = Array.isArray(prop.enrichment_sources) ? prop.enrichment_sources : [];
  const patch = {
    images: merged,
    hero_image_url: hero,
    enrichment_sources: [...prev.filter((s) => s.type !== 'website_image_ingest'), sourceEntry],
  };
  if (site.source && !prop.property_url) patch.property_url = site.origin;

  const { error } = await sb.from('property_registry').update(patch).eq('id', prop.id);

  if (error) {
    stats.errors++;
    log(`  UPDATE FAIL: ${error.message}`);
  } else {
    stats.properties_updated++;
    log(`  Saved ${uploaded.length} images (${uploaded.map((i) => i.role).join(', ')})`);
  }
}

async function main() {
  if (!process.env.REGISTRY_IQ_SUPABASE_URL || !process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Registry-iQ env');
  }
  if (!FIRECRAWL_KEY) throw new Error('Missing FIRECRAWL_API_KEY');
  if (!DRY && !configureCloudinaryFromEnv()) throw new Error('Missing Cloudinary configuration');

  log(`Website image ingest — ${DRY ? 'DRY-RUN' : 'APPLY'}${FORCE ? ' (force)' : ''}`);

  const sb = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  let props = await fetchAllRows(
    sb,
    'property_registry',
    'id, property_name, city, state_province, property_url, hero_image_url, images, enrichment_sources, external_ids',
  );

  if (PROPERTY_ID) {
    props = props.filter((p) => p.id === PROPERTY_ID);
  } else {
    props = props.filter((p) => isEnrichedProperty(p) && (FORCE || needsImageWork(p)));
  }

  stats.candidates = props.length;
  log(`  Candidates: ${stats.candidates}`);

  let n = 0;
  for (const prop of props.sort((a, b) => {
    const aHas = resolvePropertyWebsite(a) ? 0 : 1;
    const bHas = resolvePropertyWebsite(b) ? 0 : 1;
    if (aHas !== bHas) return aHas - bHas;
    return a.property_name.localeCompare(b.property_name);
  })) {
    if (LIMIT && n >= LIMIT) break;
    log(`\n[${n + 1}] ${prop.property_name}`);
    try {
      await processProperty(sb, prop);
    } catch (e) {
      stats.errors++;
      log(`  ERROR: ${e.message}`);
    }
    n++;
  }

  const reportPath = resolve(ROOT, '.firecrawl/website-image-ingest-report.json');
  writeFileSync(reportPath, JSON.stringify({ stats, generated_at: new Date().toISOString() }, null, 2));

  log('\nSummary:', JSON.stringify(stats, null, 2));
  log(`Report: .firecrawl/website-image-ingest-report.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
