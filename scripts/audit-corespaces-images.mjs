#!/usr/bin/env node
/**
 * Audit Core Spaces Prismic image coverage in property_registry.
 *
 * Usage:
 *   node scripts/audit-corespaces-images.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

for (const f of ['.env.local', '.env']) {
  const p = resolve(ROOT, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
  }
}

function normalizeForMatch(raw) {
  if (!raw) return '';
  return raw
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/^THE\s+/, '')
    .replace(/Ō|Ō|ō/gi, 'O')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMatchParts(name, city, stateProvince) {
  let c = String(city || '').trim();
  let s = String(stateProvince || '').trim().toUpperCase();
  const comma = c.match(/^([^,]+),\s*([A-Z]{2})\b/i);
  if (comma) {
    c = comma[1].trim();
    if (s.length !== 2 || s === 'UNKNOWN') s = comma[2].toUpperCase();
  }
  const cityNorm = !c || /^unknown$|^tbd$/i.test(c) ? null : normalizeForMatch(c);
  const stateNorm = s.length === 2 && s !== 'UNKNOWN' ? s : null;
  return {
    nameNorm: normalizeForMatch(name),
    cityNorm,
    stateNorm,
    exact: `${(name || '').trim().toLowerCase()}|${String(city || '').trim().toLowerCase()}|${s}`,
  };
}

async function main() {
  const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
  const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;
  if (!regUrl || !regKey) throw new Error('Missing Registry-iQ env');

  const normPath = resolve(ROOT, '.firecrawl/corespaces-prismic-normalized.json');
  const norm = JSON.parse(readFileSync(normPath, 'utf8'));
  const sb = createClient(regUrl, regKey, { auth: { persistSession: false } });

  const existingRows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from('property_registry')
      .select('id, property_name, city, state_province, external_ids, hero_image_url, images')
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    existingRows.push(...data);
    if (data.length < 1000) break;
  }

  const byPrismic = new Map();
  const byExact = new Map();
  const byFull = new Map();
  const byNameState = new Map();
  for (const row of existingRows) {
    const pid = row.external_ids?.prismic_id;
    if (pid) byPrismic.set(pid, row);
    const parts = extractMatchParts(row.property_name, row.city, row.state_province);
    if (!byExact.has(parts.exact)) byExact.set(parts.exact, row);
    if (parts.cityNorm && parts.stateNorm) {
      const k = `${parts.nameNorm}|${parts.cityNorm}|${parts.stateNorm}`;
      if (!byFull.has(k)) byFull.set(k, row);
    }
    if (parts.stateNorm) {
      const k = `${parts.nameNorm}|${parts.stateNorm}`;
      if (!byNameState.has(k)) byNameState.set(k, row);
    }
  }

  const linkedIds = new Set(
    existingRows.filter((r) => r.external_ids?.prismic_id).map((r) => r.external_ids.prismic_id),
  );

  let missingLink = 0;
  let missingHero = 0;
  let missingGalleryRole = 0;
  let galleryNotCloudinary = 0;
  const unlinked = [];

  for (const incoming of norm.properties) {
    let row = byPrismic.get(incoming.prismic_id);
    if (!row) {
      const parts = extractMatchParts(incoming.property_name, incoming.city, incoming.state_province);
      row = byExact.get(parts.exact);
      if (!row && parts.cityNorm && parts.stateNorm) {
        row = byFull.get(`${parts.nameNorm}|${parts.cityNorm}|${parts.stateNorm}`);
      }
      if (!row && parts.stateNorm) {
        row = byNameState.get(`${parts.nameNorm}|${parts.stateNorm}`);
      }
    }

    const linked = Boolean(row?.external_ids?.prismic_id);
    if (!linked) {
      missingLink++;
      unlinked.push(incoming.property_name);
    }

    if (row && !row.hero_image_url && (incoming.images?.length || 0) > 0) missingHero++;

    const imgs = Array.isArray(row?.images) ? row.images : [];
    if (linked && imgs.length > 0 && !imgs.some((i) => i.role)) missingGalleryRole++;
    if (linked && imgs.some((i) => i.url && !i.url.includes('res.cloudinary.com'))) galleryNotCloudinary++;
  }

  const summary = {
    prismic_total: norm.properties.length,
    linked_by_prismic_id: linkedIds.size,
    missing_link: missingLink,
    missing_hero_on_linked: missingHero,
    gallery_missing_role: missingGalleryRole,
    gallery_not_cloudinary: galleryNotCloudinary,
    unlinked_names: unlinked,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
