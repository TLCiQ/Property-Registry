#!/usr/bin/env node
/**
 * Troubadour: link Matrix kitchen MW configs + countertop D-sheet refs → property_unit_types.room_drawings.
 *
 * Prereq: python3 scripts/extract-troubadour-matrix-drawings.py
 * Prereq: scripts/migration-unit-type-room-drawings.sql applied
 * Prereq: MW shop drawings in property_shop_drawings (ingest-troubadour-25198-complete.mjs)
 *
 * Usage:
 *   node scripts/ingest-troubadour-matrix-drawings.mjs --dry-run
 *   node scripts/ingest-troubadour-matrix-drawings.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(__dirname, '..', f) });
  config({ path: resolve(__dirname, '../../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');
const PROPERTY_ID = '095960e3-5b22-4a0c-9528-e3843fed3ede';
const MAP_JSON = resolve(__dirname, '..', '.firecrawl', 'troubadour-matrix-drawings.json');

function configureCloudinary() {
  const m = (process.env.CLOUDINARY_URL || '').match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (m) {
    cloudinary.config({ api_key: m[1], api_secret: m[2], cloud_name: m[3] });
    return true;
  }
  return false;
}

function normalizeCab(raw) {
  if (!raw) return raw;
  let s = String(raw).trim();
  if (s.toUpperCase().startsWith('MUR_')) s = s.slice(4);
  const m = s.match(/^MW(\d+)\.(\d+)$/i);
  if (m) return `MW${Number(m[1]).toString().padStart(2, '0')}.${m[2]}`;
  return s;
}

function resolveCabDrawingNo(drawingNo) {
  const n = normalizeCab(drawingNo);
  if (!n) return n;
  if (n === 'MW01.5' || n === 'MW1.5') return 'MW01.5';
  const dot = String(n).match(/^(MW\d+)\.\d+$/i);
  if (dot) return dot[1];
  return n;
}

function linkShopDrawing(shopByNo, drawingNo) {
  const resolved = resolveCabDrawingNo(drawingNo);
  if (!resolved) return null;
  const row = shopByNo.get(resolved) || shopByNo.get(drawingNo);
  if (!row) {
    return {
      drawing_no: drawingNo,
      resolved_drawing_no: resolved !== drawingNo ? resolved : undefined,
      thumbnail_url: null,
      pdf_url: null,
      gap: 'not_in_shop_drawings',
    };
  }
  return {
    drawing_no: drawingNo,
    resolved_drawing_no: resolved !== drawingNo ? resolved : undefined,
    thumbnail_url: row.thumbnail_url,
    pdf_url: row.pdf_url,
    page_count: row.page_count,
  };
}

function linkCountertopSheet(masterPublicId, drawingNo, pageNum) {
  if (!masterPublicId || !pageNum) {
    return { drawing_no: drawingNo, thumbnail_url: null, pdf_url: null, gap: 'missing_page_index' };
  }
  return {
    drawing_no: drawingNo,
    source_ref: drawingNo,
    label: `${drawingNo} countertop`,
    sheet_page: pageNum,
    thumbnail_url: cloudinary.url(masterPublicId, {
      resource_type: 'image',
      format: 'png',
      transformation: [{ page: pageNum, width: 600, crop: 'fit' }],
    }),
    pdf_url: cloudinary.url(masterPublicId, {
      resource_type: 'image',
      format: 'pdf',
      page: pageNum,
    }),
    page_count: 1,
  };
}

async function uploadCountertopMaster(localPath) {
  const publicId = `property-registry/${PROPERTY_ID}/countertops/troubadour_countertop_final_51626`;
  const r = await cloudinary.uploader.upload(localPath, {
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
  });
  return { public_id: r.public_id, secure_url: r.secure_url, pages: r.pages ?? 1 };
}

async function main() {
  if (!process.env.REGISTRY_IQ_SUPABASE_URL || !process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Registry-iQ env');
  }
  if (!existsSync(MAP_JSON)) {
    execSync('python3 scripts/extract-troubadour-matrix-drawings.py', { cwd: resolve(__dirname, '..'), stdio: 'inherit' });
  }
  const map = JSON.parse(readFileSync(MAP_JSON, 'utf8'));
  const reg = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  if (!DRY && !configureCloudinary()) throw new Error('Missing Cloudinary config');

  const { data: shopRows } = await reg
    .from('property_shop_drawings')
    .select('drawing_no,thumbnail_url,pdf_url,page_count')
    .eq('property_id', PROPERTY_ID);
  const shopByNo = new Map((shopRows || []).map((r) => [r.drawing_no, r]));

  const { data: utRows, error: utErr } = await reg
    .from('property_unit_types')
    .select('id,unit_type_name,bathrooms')
    .eq('property_id', PROPERTY_ID);
  if (utErr) throw new Error(utErr.message);
  const utByName = new Map((utRows || []).map((u) => [u.unit_type_name, u]));

  let masterPublicId = null;
  if (existsSync(map.countertop_pdf)) {
    if (DRY) {
      console.log(`  [DRY] countertop master: ${map.countertop_pdf}`);
      masterPublicId = `dry://countertop-master`;
    } else {
      const up = await uploadCountertopMaster(map.countertop_pdf);
      masterPublicId = up.public_id;
      console.log(`  countertop master uploaded (${up.pages} pages)`);
    }
  } else {
    console.warn('  countertop PDF missing:', map.countertop_pdf);
  }

  let kitchenOk = 0;
  let bathOk = 0;
  let bath2Ok = 0;
  const gaps = { kitchen: [], bath: [], bath2: [], missing_d: map.missing_d_sheets || [] };

  for (const [typeName, spec] of Object.entries(map.types)) {
    const ut = utByName.get(typeName);
    if (!ut) {
      console.warn('  missing unit type in registry:', typeName);
      continue;
    }

    const roomDrawings = {};
    const variants = spec.kitchen_variants || [];

    const kitchenVariants = [];
    for (const v of variants) {
      const drawingNo = normalizeCab(v.kitchen_cab_raw || v.kitchen_cab);
      if (!drawingNo || drawingNo === '?') continue;
      const k = linkShopDrawing(shopByNo, drawingNo);
      kitchenVariants.push({
        kitchen_cab: v.kitchen_cab_raw || v.kitchen_cab,
        thus_opp: v.thus_opp,
        drawing_no: drawingNo,
        kitchen_top_sd: v.kitchen_top_sd,
        ...(k || {}),
        source_ref: v.kitchen_cab_raw || v.kitchen_cab,
        unit_count: v.unit_count,
      });
      if (k?.pdf_url) kitchenOk++;
      else gaps.kitchen.push(`${typeName}:${drawingNo}`);
    }

    if (kitchenVariants.length === 1 && kitchenVariants[0].pdf_url) {
      roomDrawings.kitchen = { ...kitchenVariants[0], note: 'Single kitchen cab variant for this unit type.' };
    } else if (kitchenVariants.length > 0) {
      roomDrawings.kitchen_variants = kitchenVariants;
      const primary = kitchenVariants.find((k) => k.pdf_url) || kitchenVariants[0];
      if (primary?.pdf_url) roomDrawings.kitchen = primary;
    }

    if (spec.bath_1_d && masterPublicId) {
      const page = map.d_sheet_pages?.[spec.bath_1_d];
      const b1 = DRY
        ? { drawing_no: spec.bath_1_d, thumbnail_url: 'dry', pdf_url: 'dry' }
        : linkCountertopSheet(masterPublicId, spec.bath_1_d, page);
      roomDrawings.bath_1 = { ...b1, label: 'Bath 1 vanity top' };
      if (b1.pdf_url && !b1.gap) bathOk++;
      else gaps.bath.push(`${typeName}:${spec.bath_1_d}`);
    }

    if (spec.bath_2_d && (ut.bathrooms ?? 0) >= 2 && masterPublicId) {
      const page = map.d_sheet_pages?.[spec.bath_2_d];
      const b2 = DRY
        ? { drawing_no: spec.bath_2_d, thumbnail_url: 'dry', pdf_url: 'dry' }
        : linkCountertopSheet(masterPublicId, spec.bath_2_d, page);
      roomDrawings.bath_2 = { ...b2, label: 'Bath 2 vanity top' };
      if (b2.pdf_url && !b2.gap) bath2Ok++;
      else gaps.bath2.push(`${typeName}:${spec.bath_2_d}`);
    }

    if (DRY) {
      console.log(
        `  [DRY] ${typeName} kitchen_variants=${kitchenVariants.length} bath1=${spec.bath_1_d || '—'} bath2=${spec.bath_2_d || '—'}`,
      );
      continue;
    }

    const { error } = await reg
      .from('property_unit_types')
      .update({ room_drawings: roomDrawings })
      .eq('id', ut.id);
    if (error) console.error('  update failed', typeName, error.message);
  }

  const report = {
    types: Object.keys(map.types).length,
    kitchen_links: kitchenOk,
    bath_1_links: bathOk,
    bath_2_links: bath2Ok,
    gaps,
  };
  writeFileSync(resolve(__dirname, '..', '.firecrawl', 'troubadour-matrix-drawings-report.json'), JSON.stringify(report, null, 2));
  console.log('\nSummary:', report);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
