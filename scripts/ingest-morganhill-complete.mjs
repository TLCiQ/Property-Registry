#!/usr/bin/env node
/**
 * Morgan Hill: run full populate pipeline (actuals only).
 *
 *   1. Shop drawings + floor plans (Box → Cloudinary → registry)
 *   2. Matrix layouts + room drawing links
 *   3. Per-unit Matrix facts + UNIT PLANS sqft
 *   4. Kitchen SKU bridge (Counts Workbook)
 *   5. Property images rollup (site plan from shop drawings)
 *
 * Usage: node scripts/ingest-morganhill-complete.mjs --dry-run
 *        node scripts/ingest-morganhill-complete.mjs --apply
 */
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(__dirname, '..', f) });
  config({ path: resolve(__dirname, '../../Derived State/dale-chat', f) });
}

const DRY = !process.argv.includes('--apply');
const PID = 'a30d446c-ee4a-4fe0-a76e-e4f9bed0e3b0';
const flag = DRY ? '--dry-run' : '--apply';

function run(label, cmd) {
  console.log(`\n=== ${label} ===`);
  execSync(cmd, { stdio: 'inherit', cwd: resolve(__dirname, '..') });
}

async function rollupPropertyImages() {
  if (DRY) {
    console.log('\n=== Property images rollup (DRY) ===');
    return;
  }
  const reg = createClient(process.env.REGISTRY_IQ_SUPABASE_URL, process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY);
  const { data: prop } = await reg.from('property_registry').select('images').eq('id', PID).single();
  const { data: site } = await reg
    .from('property_shop_drawings')
    .select('drawing_no, title, pdf_url, thumbnail_url')
    .eq('property_id', PID)
    .eq('drawing_no', '0-A002')
    .maybeSingle();
  const { data: appliances } = await reg
    .from('property_shop_drawings')
    .select('drawing_no, title, pdf_url, thumbnail_url, drawing_type')
    .eq('property_id', PID)
    .eq('drawing_type', 'appliance');

  const existing = Array.isArray(prop?.images) ? prop.images : [];
  const byRole = new Map(existing.map((i) => [i.role || i.label, i]));
  if (site?.pdf_url) {
    byRole.set('site_plan', {
      role: 'site_plan',
      label: site.title,
      url: site.pdf_url,
      png_url: site.thumbnail_url,
      source: 'box_0-A002',
    });
  }
  for (const a of appliances || []) {
    byRole.set(`appliance_${a.drawing_no}`, {
      role: 'appliance_cut_sheet',
      label: a.title,
      url: a.pdf_url,
      png_url: a.thumbnail_url,
      drawing_no: a.drawing_no,
    });
  }
  const merged = [...byRole.values()];
  await reg.from('property_registry').update({ images: merged }).eq('id', PID);
  console.log(`  property_registry.images: ${merged.length} entries`);
}

async function main() {
  console.log(`Morgan Hill complete populate (${DRY ? 'DRY-RUN' : 'APPLY'})`);

  if (!DRY) {
    console.log('  metadata column migration applied separately (migration-property-units-matrix-metadata.sql)');
  }

  execSync('python3 scripts/extract-mh-matrix-mappings.py', { stdio: 'inherit', cwd: resolve(__dirname, '..') });
  run('Assets', `node scripts/ingest-morganhill-assets.mjs ${flag}`);
  run('Matrix layouts + room drawings', `node scripts/ingest-morganhill-matrix.mjs ${flag}`);
  run('Unit facts + sqft', `node scripts/ingest-morganhill-unit-facts.mjs ${flag}`);
  run('Kitchen SKUs', `node scripts/ingest-morganhill-skus.mjs ${flag}`);
  await rollupPropertyImages();
  console.log('\nComplete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
