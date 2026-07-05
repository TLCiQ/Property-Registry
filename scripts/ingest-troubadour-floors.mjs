#!/usr/bin/env node
/**
 * Troubadour: matrix Level column → single building, floors 1–N, unit placement, floors_present on types.
 *
 * Prereq: scripts/extract-troubadour-matrix.py → .firecrawl/troubadour-matrix.json
 * Prereq: units already in property_units (ingest-troubadour-25198-complete.mjs)
 *
 * Usage:
 *   node scripts/ingest-troubadour-floors.mjs --dry-run
 *   node scripts/ingest-troubadour-floors.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFiles } from './lib/property-image-ingest.mjs';

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
const MATRIX_JSON = resolve(ROOT, '.firecrawl/troubadour-matrix.json');
const REPORT_JSON = resolve(ROOT, '.firecrawl/troubadour-floors-report.json');

function ensureMatrixJson() {
  if (existsSync(MATRIX_JSON)) return;
  execSync('python3 scripts/extract-troubadour-matrix.py', { cwd: ROOT, stdio: 'inherit' });
}

function normLevel(level) {
  if (level == null || level === '') return null;
  const n = Number(level);
  if (Number.isFinite(n) && Number.isInteger(n) && n > 0) return n;
  const s = String(level).trim();
  const m = s.match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

async function fetchAll(sb, table, select, filters = {}) {
  const rows = [];
  let from = 0;
  const page = 1000;
  for (;;) {
    let q = sb.from(table).select(select).range(from, from + page - 1);
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return rows;
}

async function main() {
  const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
  const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;
  if (!regUrl || !regKey) {
    console.error('Missing REGISTRY_IQ credentials');
    process.exit(1);
  }

  ensureMatrixJson();
  const matrix = JSON.parse(readFileSync(MATRIX_JSON, 'utf8'));
  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });

  const levels = matrix.units
    .map((u) => normLevel(u.level))
    .filter((n) => n != null);
  const maxLevel = levels.length ? Math.max(...levels) : 0;
  const uniqueLevels = [...new Set(levels)].sort((a, b) => a - b);

  const floorsByType = new Map();
  for (const u of matrix.units) {
    const lvl = normLevel(u.level);
    if (!u.unit_type || !lvl) continue;
    if (!floorsByType.has(u.unit_type)) floorsByType.set(u.unit_type, new Set());
    floorsByType.get(u.unit_type).add(String(lvl));
  }

  console.log(`Troubadour floors ingest (${DRY ? 'DRY-RUN' : 'APPLY'})`);
  console.log(`  matrix units: ${matrix.units.length}, levels: ${uniqueLevels.join(', ')} (max ${maxLevel})`);
  console.log(`  unit types w/ floor spread: ${floorsByType.size}`);

  if (DRY) {
    const sample = [...floorsByType.entries()].slice(0, 5).map(([name, set]) => ({
      unit_type_name: name,
      floors_present: [...set].sort((a, b) => Number(a) - Number(b)),
    }));
    writeFileSync(REPORT_JSON, JSON.stringify({ dry_run: true, maxLevel, uniqueLevels, sample }, null, 2));
    console.log(`  sample floors_present:`, sample);
    console.log('Dry-run only. Re-run with --apply to write.');
    return;
  }

  const { data: prop } = await reg.from('property_registry').select('property_name,total_buildings').eq('id', PROPERTY_ID).single();

  let buildings = await fetchAll(reg, 'property_buildings', 'id, building_number, building_name, total_floors', {
    property_id: PROPERTY_ID,
  });

  let buildingId;
  if (buildings.length === 0) {
    const { data: ins, error } = await reg
      .from('property_buildings')
      .insert({
        property_id: PROPERTY_ID,
        building_number: 1,
        building_name: prop?.property_name ? `${prop.property_name} (single building)` : 'Main Building',
        total_floors: maxLevel,
        lowest_residential_floor: uniqueLevels[0] ?? 1,
        highest_residential_floor: maxLevel,
        skip_13th_floor: false,
        notes: 'Single-building property. Floors from Unit & Shop Drawing Matrix Level column (2026-07-05).',
      })
      .select('id, building_number, building_name, total_floors')
      .single();
    if (error) throw new Error(`building insert: ${error.message}`);
    buildingId = ins.id;
    buildings = [ins];
    console.log(`  created building 1 (${maxLevel} floors)`);
  } else if (buildings.length === 1) {
    buildingId = buildings[0].id;
    const { error } = await reg
      .from('property_buildings')
      .update({
        total_floors: maxLevel,
        lowest_residential_floor: uniqueLevels[0] ?? 1,
        highest_residential_floor: maxLevel,
      })
      .eq('id', buildingId);
    if (error) throw new Error(`building update: ${error.message}`);
    console.log(`  using existing building 1`);
  } else {
    throw new Error(`Expected 0 or 1 buildings for Troubadour; found ${buildings.length}. Reconcile manually.`);
  }

  const { data: floorRows, error: fErr } = await reg
    .from('property_floors')
    .select('id, floor_number, floor_label')
    .eq('building_id', buildingId)
    .order('floor_number');
  if (fErr) throw new Error(fErr.message);

  const floorByNumber = new Map((floorRows || []).map((f) => [f.floor_number, f]));
  let floorsCreated = 0;
  for (const n of uniqueLevels) {
    if (floorByNumber.has(n)) continue;
    const { data: ins, error } = await reg
      .from('property_floors')
      .insert({
        building_id: buildingId,
        floor_number: n,
        floor_label: `Level ${n}`,
        floor_type: 'residential',
      })
      .select('id, floor_number')
      .single();
    if (error) throw new Error(`floor insert ${n}: ${error.message}`);
    floorByNumber.set(n, ins);
    floorsCreated++;
  }
  console.log(`  floors: ${floorByNumber.size} total (+${floorsCreated} created)`);

  const typeRows = await fetchAll(reg, 'property_unit_types', 'id, unit_type_name', { property_id: PROPERTY_ID });
  const typeByName = new Map(typeRows.map((t) => [t.unit_type_name, t.id]));

  let typesUpdated = 0;
  for (const [name, levelSet] of floorsByType) {
    const typeId = typeByName.get(name);
    if (!typeId) continue;
    const floors_present = [...levelSet].sort((a, b) => Number(a) - Number(b));
    const { error } = await reg.from('property_unit_types').update({ floors_present }).eq('id', typeId);
    if (error) throw new Error(`floors_present ${name}: ${error.message}`);
    typesUpdated++;
  }
  console.log(`  unit types floors_present: ${typesUpdated}`);

  let unitsPlaced = 0;
  let unitsMissed = 0;
  for (const u of matrix.units) {
    const lvl = normLevel(u.level);
    const floor = lvl != null ? floorByNumber.get(lvl) : null;
    if (!floor) {
      unitsMissed++;
      continue;
    }
    const { error, count } = await reg
      .from('property_units')
      .update({ building_id: buildingId, floor_id: floor.id }, { count: 'exact' })
      .eq('property_id', PROPERTY_ID)
      .eq('unit_number', String(u.unit_number));
    if (error) throw new Error(`unit ${u.unit_number}: ${error.message}`);
    if ((count ?? 0) > 0) unitsPlaced++;
    else unitsMissed++;
  }
  console.log(`  units placed on floors: ${unitsPlaced}, missed: ${unitsMissed}`);

  const { error: pErr } = await reg
    .from('property_registry')
    .update({
      total_buildings: 1,
      total_residential_floors: maxLevel,
    })
    .eq('id', PROPERTY_ID);
  if (pErr) throw new Error(`property update: ${pErr.message}`);

  const report = {
    building_id: buildingId,
    max_level: maxLevel,
    unique_levels: uniqueLevels,
    floors: floorByNumber.size,
    types_updated: typesUpdated,
    units_placed: unitsPlaced,
    units_missed: unitsMissed,
  };
  writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  console.log(`  report: ${REPORT_JSON}`);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
