#!/usr/bin/env node
/**
 * Morgan Hill (25048) asset ingestion: floor plans + shop drawings -> Cloudinary -> registry-iQ.
 *
 * - Floor plans: Building 1 Levels 1-5 = per-level "OVERALL PLAN LEVEL n" PDFs;
 *   Buildings 2 & 3 = the combined SCHEME building PDF on each of their floors.
 *   Writes property_floors.floor_plan_url + images.
 * - Shop drawings: cabinet config PDFs (KM PDFs/MWxx.pdf) + interior-elevation sheets (A70x).
 *   Inserts/updates property_shop_drawings. unit_type_code left null (M:N rollups deferred).
 *
 * NO SURROGATES: cabinet configs referenced by the Matrix but lacking a PDF (MW04.5/MW05/MW06)
 * are skipped and recorded in the gap report.
 *
 * Usage: node scripts/ingest-morganhill-assets.mjs --dry-run | --apply
 */
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(__dirname, '..', f) });
  config({ path: resolve(__dirname, '../../Derived State/dale-chat', f) });
}

const DRY = !process.argv.includes('--apply');
const PID = 'a30d446c-ee4a-4fe0-a76e-e4f9bed0e3b0';
const BOX = '/Users/geoffreyjackson/Library/CloudStorage/Box-Box/Team Folder/Projects/25048 - Carrollton, TX - Morgan Hill/PROJECT MANAGING/SHOP DRAWINGS';
const VERSION = '2026-04-06'; // FOR INSTALL drawing set date

const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;

function configureCloudinary() {
  const m = (process.env.CLOUDINARY_URL || '').match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (m) { cloudinary.config({ api_key: m[1], api_secret: m[2], cloud_name: m[3] }); return true; }
  return false;
}

const CABINET_BASE = ['MW01','MW02','MW03','MW04','MW07','MW07.5','MW08','MW09','MW10','MW11','MW12','MW13','MW14','MW15','MW16','MW17','MW18'];
const CABINET_GAP = ['MW04.5','MW05','MW06']; // referenced by Matrix, no PDF
const ELEVATIONS = [
  { sheet: 'A701', file: 'A701 - TYPICAL UNIT INTERIOR ELEVATIONS AND DETAILS.pdf', type: 'kitchen_cabs' },
  { sheet: 'A702', file: 'A702 - TYPICAL ANSI TYPE A UNIT INTERIOR ELEVATIONS AND DETAILS.pdf', type: 'kitchen_cabs' },
  { sheet: 'A703', file: 'A703 - INTERIOR ELEVATIONS.pdf', type: 'kitchen_cabs' },
  { sheet: 'A704', file: 'A704 - INTERIOR ELEVATIONS.pdf', type: 'kitchen_cabs' },
  { sheet: 'A705', file: 'A705 - INTERIOR ELEVATIONS.pdf', type: 'vanity' },
  { sheet: 'A706', file: 'A706 - INTERIOR ELEVATIONS.pdf', type: 'vanity' },
];

function pngUrl(publicId) {
  return cloudinary.url(publicId, { resource_type: 'image', format: 'png', transformation: [{ page: 1, width: 600, crop: 'fit' }] });
}

async function uploadPdf(localPath, publicId) {
  const r = await cloudinary.uploader.upload(localPath, {
    folder: undefined, public_id: publicId, overwrite: true, resource_type: 'image',
  });
  return { pdf_url: r.secure_url, pages: r.pages ?? null, png_url: pngUrl(publicId) };
}

async function main() {
  if (!regUrl || !regKey) { console.error('Missing REGISTRY_IQ creds'); process.exit(1); }
  if (!configureCloudinary()) { console.error('Missing Cloudinary config'); process.exit(1); }
  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });
  const gaps = { cabinet_configs_missing_pdf: CABINET_GAP, floor_plans: [], unit_type_finish_layouts: 'No per-type unit-plan page mapping in UNIT PLANS_5.2025.pdf; left empty (gap).' };

  // ---- Shop drawings ----
  const drawings = [];
  for (const cfg of CABINET_BASE) {
    drawings.push({ drawing_no: cfg, file: `${BOX}/Cabinets/KM PDFs/${cfg}.pdf`, type: 'kitchen_cabs', title: `Cabinet config ${cfg}` });
  }
  for (const e of ELEVATIONS) {
    drawings.push({ drawing_no: e.sheet, file: `${BOX}/DRAWING SET/${e.file}`, type: e.type, title: e.file.replace(/\.pdf$/, '') });
  }

  console.log(`Shop drawings (${DRY ? 'DRY' : 'APPLY'}): ${drawings.length} | cabinet gaps: ${CABINET_GAP.join(', ')}`);
  for (const d of drawings) {
    if (!existsSync(d.file)) { console.log(`  MISSING FILE -> gap: ${d.drawing_no}`); gaps.floor_plans.push(`shopdrawing ${d.drawing_no}: file missing`); continue; }
    if (DRY) { console.log(`  [DRY] ${d.drawing_no} (${d.type})`); continue; }
    const publicId = `property-registry/${PID}/shop-drawings/${d.drawing_no.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    try {
      const up = await uploadPdf(d.file, publicId);
      const { error } = await reg.from('property_shop_drawings').upsert({
        property_id: PID, drawing_no: d.drawing_no, title: d.title, drawing_type: d.type,
        version: VERSION, state: 'not_started', thumbnail_url: up.png_url, pdf_url: up.pdf_url,
        page_count: up.pages, source_path: d.file.replace(BOX, '...25048/.../SHOP DRAWINGS'),
        notes: 'Ingested from Box 2026-06-19. State unverified (default).',
      }, { onConflict: 'property_id,drawing_no,version' });
      if (error) console.error('  insert failed', d.drawing_no, error.message);
      else console.log(`  ok ${d.drawing_no} pages=${up.pages}`);
    } catch (e) { console.error('  upload failed', d.drawing_no, e?.message ?? e); }
  }

  // ---- Floor plans ----
  const { data: floors, error: fErr } = await reg
    .from('property_floors')
    .select('id, floor_number, building_id, property_buildings!inner(building_number, property_id)')
    .eq('property_buildings.property_id', PID);
  if (fErr) { console.error('floors fetch failed', fErr.message); }
  const floorRows = (floors || []).map((f) => ({ id: f.id, floor_number: f.floor_number, building_number: f.property_buildings.building_number }));
  console.log(`\nFloor plans (${DRY ? 'DRY' : 'APPLY'}): ${floorRows.length} floors`);

  function floorPlanFile(bldg, lvl) {
    if (bldg === 1) return { file: `${BOX}/DRAWING SET/1-A2${lvl}0 - BLDG 1 - OVERALL PLAN LEVEL ${lvl}.pdf`, label: `Building 1 - Level ${lvl} overall plan` };
    if (bldg === 2) return { file: `${BOX}/DRAWING SET/SCHEME/25.02.24-MH-Building 2 - Level 1-3-Unit-Corridor Finish_Combined.pdf`, label: `Building 2 - combined Level 1-3 finish plan`, combined: true };
    if (bldg === 3) return { file: `${BOX}/DRAWING SET/SCHEME/25.02.24-MH-Building 3 - Level 1-3 - Unit-Corridor Finish_Combined.pdf`, label: `Building 3 - combined Level 1-3 finish plan`, combined: true };
    return null;
  }

  for (const f of floorRows) {
    const spec = floorPlanFile(f.building_number, f.floor_number);
    if (!spec || !existsSync(spec.file)) { console.log(`  no plan -> gap: B${f.building_number} L${f.floor_number}`); gaps.floor_plans.push(`B${f.building_number} L${f.floor_number}: no source`); continue; }
    if (DRY) { console.log(`  [DRY] B${f.building_number} L${f.floor_number} <- ${spec.label}`); continue; }
    const publicId = `property-registry/${PID}/floor-plans/b${f.building_number}_l${f.floor_number}`;
    try {
      const up = await uploadPdf(spec.file, publicId);
      const images = [{ role: 'floor_plan', url: up.pdf_url, png_url: up.png_url, label: spec.label, source_path: spec.file.replace(BOX, '...'), combined: !!spec.combined }];
      const { error } = await reg.from('property_floors').update({ floor_plan_url: up.pdf_url, images }).eq('id', f.id);
      if (error) console.error('  floor update failed', f.id, error.message);
      else console.log(`  ok B${f.building_number} L${f.floor_number} pages=${up.pages}`);
    } catch (e) { console.error('  floor upload failed', f.id, e?.message ?? e); }
  }

  if (!DRY) { writeFileSync(resolve(__dirname, '..', '.firecrawl', 'mh-asset-gaps.json'), JSON.stringify(gaps, null, 2)); console.log('\nWrote .firecrawl/mh-asset-gaps.json'); }
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
