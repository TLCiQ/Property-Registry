#!/usr/bin/env node
/**
 * Backfill property_registry.hero_image_url: download external URLs to Cloudinary,
 * update row, append provenance to enrichment_sources.
 *
 * Env: REGISTRY_IQ_SUPABASE_URL, REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY
 *      CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
 *
 * Usage:
 *   node scripts/backfill-images-to-cloudinary.mjs --dry-run
 *   node scripts/backfill-images-to-cloudinary.mjs --apply
 *   node scripts/backfill-images-to-cloudinary.mjs --apply --limit=50
 *   node scripts/backfill-images-to-cloudinary.mjs --apply --source=corespaces_prismic
 *   node scripts/backfill-images-to-cloudinary.mjs --apply --source=enriched --gallery
 */

import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

for (const envFile of ['.env.local', '.env']) {
  config({ path: resolve(__dirname, '..', envFile) });
  config({ path: resolve(__dirname, '../../Derived State/dale-chat', envFile) });
}

const argv = process.argv.slice(2);
const DRY = !argv.includes('--apply');
const GALLERY = argv.includes('--gallery');
const limitArg = argv.find((a) => a.startsWith('--limit='))?.split('=')[1];
const limit = limitArg ? parseInt(limitArg, 10) : 5000;
const sourceFilter = argv.find((a) => a.startsWith('--source='))?.split('=')[1] || null;

const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;

function configureCloudinaryFromEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    return true;
  }
  const url = process.env.CLOUDINARY_URL;
  if (!url) return false;
  const match = url.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (!match) return false;
  cloudinary.config({ api_key: match[1], api_secret: match[2], cloud_name: match[3] });
  return true;
}

function matchesSource(row, source) {
  if (!source) return true;
  if (source === 'corespaces_prismic') {
    const sources = Array.isArray(row.enrichment_sources) ? row.enrichment_sources : [];
    return sources.some((s) => s.type === 'corespaces_prismic') || row.external_ids?.prismic_id;
  }
  if (source === 'enriched') {
    const sources = Array.isArray(row.enrichment_sources) ? row.enrichment_sources : [];
    return sources.some((s) => ['portfolio_project_team', 'corespaces_project_team', 'corespaces_prismic', 'website_image_ingest'].includes(s.type))
      || row.external_ids?.prismic_id;
  }
  return true;
}

async function fetchCandidates(client, max, source) {
  const pageSize = 500;
  let all = [];
  let from = 0;
  for (;;) {
    const { data, error } = await client
      .from('property_registry')
      .select('id, hero_image_url, enrichment_sources, external_ids')
      .not('hero_image_url', 'is', null)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    const ext = data.filter((r) => {
      const u = r.hero_image_url;
      if (typeof u !== 'string' || !u.startsWith('http') || u.includes('res.cloudinary.com')) return false;
      return matchesSource(r, source);
    });
    all = all.concat(ext);
    if (all.length >= max || data.length < pageSize) break;
    from += pageSize;
  }
  return all.slice(0, max);
}

async function uploadHero(externalUrl, propertyId) {
  const result = await cloudinary.uploader.upload(externalUrl, {
    folder: 'property-registry',
    public_id: `hero_${propertyId}`,
    overwrite: true,
    resource_type: 'image',
    context: `source_url=${String(externalUrl).replace(/\|/g, '_')}|uploaded_by=backfill|entity_id=${propertyId}`,
    transformation: [{ width: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  });
  return result;
}

async function uploadGalleryImage(externalUrl, propertyId, index) {
  const result = await cloudinary.uploader.upload(externalUrl, {
    folder: 'property-registry/gallery',
    public_id: `gallery_${propertyId}_${index}`,
    overwrite: true,
    resource_type: 'image',
    context: `source_url=${String(externalUrl).replace(/\|/g, '_')}|uploaded_by=backfill|entity_id=${propertyId}`,
    transformation: [{ width: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  });
  return result;
}

async function fetchGalleryCandidates(client, max, source) {
  const pageSize = 200;
  let all = [];
  let from = 0;
  for (;;) {
    const { data, error } = await client
      .from('property_registry')
      .select('id, property_name, images, enrichment_sources, external_ids')
      .not('images', 'is', null)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    const ext = data.filter((r) => {
      if (!matchesSource(r, source)) return false;
      const imgs = Array.isArray(r.images) ? r.images : [];
      return imgs.some((img) => typeof img?.url === 'string' && img.url.startsWith('http') && !img.url.includes('res.cloudinary.com'));
    });
    all = all.concat(ext);
    if (all.length >= max || data.length < pageSize) break;
    from += pageSize;
  }
  return all.slice(0, max);
}

function normalizeGalleryImage(img, uploaded, role) {
  return {
    id: img.id || randomUUID(),
    url: uploaded.secure_url,
    public_id: uploaded.public_id,
    label: img.label || role,
    role: img.role || role,
    focal_x: img.focal_x ?? 0.5,
    focal_y: img.focal_y ?? 0.5,
    zoom: img.zoom ?? 1,
    width: uploaded.width || img.width || 0,
    height: uploaded.height || img.height || 0,
    format: uploaded.format || img.format || 'jpg',
    bytes: uploaded.bytes || img.bytes || 0,
    uploaded_at: new Date().toISOString(),
  };
}

async function main() {
  if (!regUrl || !regKey) {
    console.error('Missing REGISTRY_IQ_SUPABASE_URL or REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!configureCloudinaryFromEnv()) {
    console.error('Missing Cloudinary configuration');
    process.exit(1);
  }

  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });
  const rows = await fetchCandidates(reg, limit, sourceFilter);
  console.log(`Backfill hero images (${DRY ? 'DRY-RUN' : 'APPLY'}): ${rows.length} candidate(s), limit=${limit}${sourceFilter ? ` source=${sourceFilter}` : ''}`);

  let ok = 0;
  for (const row of rows) {
    const sourceUrl = row.hero_image_url;
    if (DRY) {
      console.log(`[DRY] would upload hero ${row.id.slice(0, 8)}… ${sourceUrl?.slice(0, 72)}…`);
      continue;
    }
    try {
      const uploaded = await uploadHero(sourceUrl, row.id);
      const secure = uploaded.secure_url;
      const prev = Array.isArray(row.enrichment_sources) ? row.enrichment_sources : [];
      const nextSources = [
        ...prev,
        {
          type: 'hero_cloudinary_backfill',
          source_url: sourceUrl,
          cloudinary_url: secure,
          at: new Date().toISOString(),
        },
      ];
      const { error } = await reg
        .from('property_registry')
        .update({ hero_image_url: secure, enrichment_sources: nextSources })
        .eq('id', row.id);
      if (error) console.error('update failed', row.id, error.message);
      else ok++;
    } catch (e) {
      console.error('upload failed', row.id, e?.message ?? e);
    }
  }

  console.log(`Hero done. updated=${ok} dryRun=${DRY}`);

  if (!GALLERY) return;

  const galleryRows = await fetchGalleryCandidates(reg, limit, sourceFilter);
  console.log(`Backfill gallery images (${DRY ? 'DRY-RUN' : 'APPLY'}): ${galleryRows.length} candidate(s)`);
  let galleryOk = 0;
  for (const row of galleryRows) {
    const imgs = Array.isArray(row.images) ? row.images : [];
    if (DRY) {
      const pending = imgs.filter((i) => i.url && !i.url.includes('res.cloudinary.com')).length;
      console.log(`[DRY] would upload ${pending} gallery image(s) for ${row.property_name}`);
      continue;
    }
    const nextImages = [];
    let changed = false;
    for (let idx = 0; idx < imgs.length; idx++) {
      const img = imgs[idx];
      if (!img?.url || img.url.includes('res.cloudinary.com')) {
        nextImages.push(img);
        continue;
      }
      try {
        const uploaded = await uploadGalleryImage(img.url, row.id, idx);
        const role = img.role || (idx === 0 ? 'hero' : 'exterior');
        nextImages.push(normalizeGalleryImage(img, uploaded, role));
        changed = true;
      } catch (e) {
        console.error('gallery upload failed', row.id, idx, e?.message ?? e);
        nextImages.push(img);
      }
    }
    if (!changed) continue;
    const { error } = await reg.from('property_registry').update({ images: nextImages }).eq('id', row.id);
    if (error) console.error('gallery update failed', row.id, error.message);
    else galleryOk++;
  }
  console.log(`Gallery done. updated=${galleryOk} dryRun=${DRY}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
