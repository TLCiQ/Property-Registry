#!/usr/bin/env node
/**
 * Generic BSI matrix Level → buildings + floors + unit placement.
 *
 * Prereq: ingest-bsi-matrix-structure.mjs (writes .firecrawl/matrices/{id}-matrix.json)
 *
 * Usage:
 *   node scripts/ingest-bsi-floors.mjs --project-id=25322 --apply
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(ROOT, f) });
  config({ path: resolve(ROOT, '../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');
const PROJECT_ID = process.argv.find((a) => a.startsWith('--project-id='))?.split('=')[1];
if (!PROJECT_ID) {
  console.error('Usage: node scripts/ingest-bsi-floors.mjs --project-id=25xxx [--apply]');
  process.exit(1);
}

const MATRIX_JSON = resolve(ROOT, `.firecrawl/matrices/${PROJECT_ID}-matrix.json`);

function normLevel(level) {
  if (level == null || level === '') return null;
  const n = Number(level);
  if (Number.isFinite(n) && Number.isInteger(n) && n > 0) return n;
  const m = String(level).trim().match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

async function fetchAll(sb, table, select, filters = {}) {
  const rows = [];
  let from = 0;
  while (true) {
    let q = sb.from(table).select(select).range(from, from + 999);
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

async function main() {
  if (!existsSync(MATRIX_JSON)) {
    throw new Error(`Matrix JSON missing — run ingest-bsi-matrix-structure.mjs first: ${MATRIX_JSON}`);
  }
  const matrix = JSON.parse(readFileSync(MATRIX_JSON, 'utf8'));
  const reg = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { data: project } = await reg
    .from('project_registry')
    .select('id, property_id')
    .eq('project_id', PROJECT_ID)
    .single();
  if (!project?.property_id) throw new Error(`No property for ${PROJECT_ID}`);
  const PROPERTY_ID = project.property_id;

  const levels = matrix.units.map((u) => normLevel(u.level)).filter((n) => n != null);
  const maxLevel = levels.length ? Math.max(...levels) : 0;
  const uniqueLevels = [...new Set(levels)].sort((a, b) => a - b);

  const floorsByType = new Map();
  for (const u of matrix.units) {
    const lvl = normLevel(u.level);
    if (!u.unit_type || !lvl) continue;
    if (!floorsByType.has(u.unit_type)) floorsByType.set(u.unit_type, new Set());
    floorsByType.get(u.unit_type).add(String(lvl));
  }

  console.log(`BSI floors — ${PROJECT_ID} (${DRY ? 'DRY' : 'APPLY'}) levels: ${uniqueLevels.join(', ') || 'none'}`);

  if (!uniqueLevels.length) {
    console.log('  No level data in matrix — skip floors');
    return { status: 'no_levels' };
  }

  if (DRY) {
    console.log(`  would create up to ${uniqueLevels.length} floors, max level ${maxLevel}`);
    return { status: 'dry' };
  }

  const { data: prop } = await reg.from('property_registry').select('property_name').eq('id', PROPERTY_ID).single();
  let buildings = await fetchAll(reg, 'property_buildings', 'id, building_number, total_floors', {
    property_id: PROPERTY_ID,
  });

  let buildingId;
  if (buildings.length === 0) {
    const { data: ins, error } = await reg
      .from('property_buildings')
      .insert({
        property_id: PROPERTY_ID,
        building_number: 1,
        building_name: prop?.property_name ? `${prop.property_name} (main)` : 'Main Building',
        total_floors: maxLevel,
        lowest_residential_floor: uniqueLevels[0],
        highest_residential_floor: maxLevel,
        skip_13th_floor: false,
        notes: `Floors from BSI matrix Level column (${new Date().toISOString().slice(0, 10)}).`,
      })
      .select('id')
      .single();
    if (error) throw error;
    buildingId = ins.id;
  } else {
    buildingId = buildings[0].id;
    await reg
      .from('property_buildings')
      .update({
        total_floors: maxLevel,
        lowest_residential_floor: uniqueLevels[0],
        highest_residential_floor: maxLevel,
      })
      .eq('id', buildingId);
  }

  const floorRows = await fetchAll(reg, 'property_floors', 'id, floor_number', { building_id: buildingId });
  const floorByNumber = new Map(floorRows.map((f) => [f.floor_number, f]));
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
    if (error) throw error;
    floorByNumber.set(n, ins);
  }

  const typeRows = await fetchAll(reg, 'property_unit_types', 'id, unit_type_name', { property_id: PROPERTY_ID });
  const typeByName = new Map(typeRows.map((t) => [t.unit_type_name, t.id]));
  let typesUpdated = 0;
  for (const [name, levelSet] of floorsByType) {
    const typeId = typeByName.get(name);
    if (!typeId) continue;
    const floors_present = [...levelSet].sort((a, b) => Number(a) - Number(b));
    await reg.from('property_unit_types').update({ floors_present }).eq('id', typeId);
    typesUpdated++;
  }

  let unitsPlaced = 0;
  for (const u of matrix.units) {
    const lvl = normLevel(u.level);
    const floor = lvl != null ? floorByNumber.get(lvl) : null;
    if (!floor) continue;
    const { count } = await reg
      .from('property_units')
      .update({ building_id: buildingId, floor_id: floor.id }, { count: 'exact' })
      .eq('property_id', PROPERTY_ID)
      .eq('unit_number', String(u.unit_number));
    if ((count ?? 0) > 0) unitsPlaced++;
  }

  await reg
    .from('property_registry')
    .update({ total_buildings: 1, total_residential_floors: maxLevel })
    .eq('id', PROPERTY_ID);

  mkdirSync(resolve(ROOT, '.firecrawl'), { recursive: true });
  const report = { project_id: PROJECT_ID, floors: floorByNumber.size, typesUpdated, unitsPlaced };
  writeFileSync(resolve(ROOT, `.firecrawl/${PROJECT_ID}-floors-report.json`), JSON.stringify(report, null, 2));
  console.log(`  floors: ${floorByNumber.size}, types floors_present: ${typesUpdated}, units placed: ${unitsPlaced}`);
  return report;
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
