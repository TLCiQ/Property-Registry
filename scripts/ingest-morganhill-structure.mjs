#!/usr/bin/env node
/**
 * Apply Morgan Hill structure enrichment derived from Matrix NEW MASTER.
 * Consumes .firecrawl/mh-structure.json (produced by scripts/extract-mh-structure.py):
 *   { units: [[unit_number, area, truck, phase, color_code], ...],
 *     type_bath: { unit_type_name: bath_count, ... },
 *     inconsistent: { unit_type_name: [counts] } }
 *
 * Writes:
 *   - property_units.color_code                               (per unit)
 *   - property_unit_types.bathrooms                           (per type, matched on unit_type_name)
 *
 * DOES NOT write truck_no / phase_no / construction_area any more (2026-07-29).
 * Those are unit-grain final-mile facts and their single home is now
 * `public.project_unit_assignments`, loaded from the Matrix NEW_SCHEME workbook by
 * Chain-iQ `scripts/ingest_mh_matrix_master.py` with full Box provenance.
 * This script used to stamp a second, unsynced copy onto property_units from an
 * older matrix revision — exactly the dual home resolved by
 * scripts/migration-resolve-unit-grain-dual-home.sql:
 *   - property_units.truck_no was dropped (writing it now errors: no such column);
 *   - property_units.phase_no / construction_area are rejected by trigger
 *     property_units_block_dual_home for any unit project_unit_assignments covers.
 * color_code stays here deliberately: it is property-grain, project_unit_assignments
 * does not carry it, and dale-chat's property-registry floors-summary + units routes
 * read it from property_units.
 *
 * Building/floor placement is handled separately by migration-reconcile-morganhill-buildings.sql.
 *
 * Usage:
 *   node scripts/ingest-morganhill-structure.mjs --dry-run
 *   node scripts/ingest-morganhill-structure.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const envFile of ['.env.local', '.env']) {
  config({ path: resolve(__dirname, '..', envFile) });
  config({ path: resolve(__dirname, '../../Derived State/dale-chat', envFile) });
}

const DRY = !process.argv.includes('--apply');
const PROPERTY_ID = 'a30d446c-ee4a-4fe0-a76e-e4f9bed0e3b0';
const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!regUrl || !regKey) {
    console.error('Missing REGISTRY_IQ_SUPABASE_URL or REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(resolve(__dirname, '..', '.firecrawl', 'mh-structure.json'), 'utf8'));
  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });

  console.log(`Morgan Hill structure enrichment (${DRY ? 'DRY-RUN' : 'APPLY'})`);
  console.log(`  units: ${data.units.length}, unit types w/ bath: ${Object.keys(data.type_bath).length}`);
  if (data.inconsistent && Object.keys(data.inconsistent).length) {
    console.log('  GAP - inconsistent bath counts (used max):', JSON.stringify(data.inconsistent));
  }
  if (DRY) {
    console.log('  sample unit:', data.units[0]);
    console.log('  sample type_bath:', Object.entries(data.type_bath).slice(0, 5));
    console.log('Dry-run only. Re-run with --apply to write.');
    return;
  }

  // 1) per-unit colorway. area/truck/phase are deliberately NOT written here —
  //    project_unit_assignments owns them (see header).
  let u_ok = 0, u_miss = 0;
  for (const row of data.units) {
    const [unit_number, , , , color_code] = row;
    const { error, count } = await reg
      .from('property_units')
      .update({ color_code: color_code ?? null }, { count: 'exact' })
      .eq('property_id', PROPERTY_ID)
      .eq('unit_number', String(unit_number));
    if (error) { console.error('unit update failed', unit_number, error.message); }
    else if ((count ?? 0) === 0) { u_miss++; }
    else { u_ok += 1; }
  }
  console.log(`  units updated (color_code): ${u_ok}, unmatched: ${u_miss}`);
  console.log('  note: construction_area / truck_no / phase_no intentionally skipped —');
  console.log('        project_unit_assignments is the source of truth for those.');

  // 2) per-type bathrooms
  let t_ok = 0, t_miss = 0;
  for (const [name, baths] of Object.entries(data.type_bath)) {
    const { error, count } = await reg
      .from('property_unit_types')
      .update({ bathrooms: baths }, { count: 'exact' })
      .eq('property_id', PROPERTY_ID)
      .eq('unit_type_name', name);
    if (error) { console.error('type update failed', name, error.message); }
    else if ((count ?? 0) === 0) { t_miss++; }
    else { t_ok += 1; }
  }
  console.log(`  unit types bathrooms set: ${t_ok}, unmatched: ${t_miss}`);
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
