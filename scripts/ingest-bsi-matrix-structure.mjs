#!/usr/bin/env node
/**
 * Generic matrix → property_unit_types + property_units (structure only).
 *
 * Usage:
 *   node scripts/ingest-bsi-matrix-structure.mjs --project-id=25001 --apply
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getBoxAccessToken, downloadBoxFile } from './lib/box-api-download.mjs';
import { loadLocalBoxFolders, findProjectFolder, findMatrixXlsx } from './lib/box-project-browser.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(ROOT, f) });
  config({ path: resolve(ROOT, '../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');
const PROJECT_ID = process.argv.find((a) => a.startsWith('--project-id='))?.split('=')[1];
if (!PROJECT_ID) {
  console.error('Usage: node scripts/ingest-bsi-matrix-structure.mjs --project-id=25xxx [--apply]');
  process.exit(1);
}

async function fetchAll(client, table, select, filters = {}) {
  const rows = [];
  let from = 0;
  while (true) {
    let q = client.from(table).select(select).range(from, from + 999);
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { data, error } = await q;
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

async function main() {
  const box = loadLocalBoxFolders().find((b) => b.project_id === PROJECT_ID);
  if (!box) throw new Error(`No Box folder for ${PROJECT_ID}`);

  const reg = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { data: project } = await reg
    .from('project_registry')
    .select('id,project_id,property_id,total_units,external_ids')
    .eq('project_id', PROJECT_ID)
    .single();
  if (!project?.property_id) throw new Error(`Project ${PROJECT_ID} has no property_id`);

  const token = await getBoxAccessToken();
  const folder = await findProjectFolder(token, box.folder);
  const matrixFile = await findMatrixXlsx(token, folder.id);
  if (!matrixFile) {
    console.log(`  No matrix xlsx for ${PROJECT_ID} — skip`);
    return { status: 'no_matrix' };
  }

  mkdirSync(resolve(ROOT, '.firecrawl/matrices'), { recursive: true });
  const xlsxPath = resolve(ROOT, `.firecrawl/matrices/${PROJECT_ID}-matrix.xlsx`);
  const jsonPath = resolve(ROOT, `.firecrawl/matrices/${PROJECT_ID}-matrix.json`);
  await downloadBoxFile(token, matrixFile.id, xlsxPath);
  execSync(
    `python3 "${resolve(__dirname, 'extract-bsi-matrix.py')}" --xlsx="${xlsxPath}" --out="${jsonPath}" --project-id="${PROJECT_ID}"`,
    { stdio: 'inherit' },
  );
  const matrix = JSON.parse(readFileSync(jsonPath, 'utf8'));
  console.log(`BSI matrix structure — ${PROJECT_ID} (${DRY ? 'DRY' : 'APPLY'}) ${matrix.unit_count} units`);

  const propertyId = project.property_id;
  const existingTypes = await fetchAll(reg, 'property_unit_types', 'id, unit_type_name', { property_id: propertyId });
  const typeByName = new Map(existingTypes.map((t) => [t.unit_type_name, t]));
  let typesCreated = 0;
  let typesUpdated = 0;

  for (const t of matrix.unit_types) {
    const row = {
      property_id: propertyId,
      unit_type_name: t.unit_type_name,
      unit_count: t.unit_count,
      beds_per_unit: t.beds_per_unit,
      standard_bedrooms: t.standard_bedrooms,
      bathrooms: t.bathrooms ?? 0,
      half_baths: 0,
      notes: `BSI matrix ingest ${new Date().toISOString().slice(0, 10)}`,
    };
    const existing = typeByName.get(t.unit_type_name);
    if (existing) {
      if (!DRY) await reg.from('property_unit_types').update(row).eq('id', existing.id);
      typesUpdated++;
    } else {
      if (!DRY) {
        const { data: ins, error } = await reg.from('property_unit_types').insert(row).select('id').single();
        if (error) throw error;
        typeByName.set(t.unit_type_name, ins);
      }
      typesCreated++;
    }
  }

  if (!DRY) {
    const refreshed = await fetchAll(reg, 'property_unit_types', 'id, unit_type_name', { property_id: propertyId });
    for (const t of refreshed) typeByName.set(t.unit_type_name, t);
  }

  const existingUnits = await fetchAll(reg, 'property_units', 'id, unit_number', { property_id: propertyId });
  const unitByNumber = new Map(existingUnits.map((u) => [String(u.unit_number), u]));
  let unitsCreated = 0;
  let unitsUpdated = 0;

  for (const u of matrix.units) {
    const ut = u.unit_type ? typeByName.get(u.unit_type) : null;
    const patch = {
      property_id: propertyId,
      unit_number: String(u.unit_number),
      unit_type_id: ut?.id ?? null,
      construction_area: u.construction_area,
      metadata: { source: 'bsi_matrix', level: u.level, unit_type: u.unit_type },
    };
    const existing = unitByNumber.get(String(u.unit_number));
    if (existing) {
      if (!DRY) await reg.from('property_units').update(patch).eq('id', existing.id);
      unitsUpdated++;
    } else {
      if (!DRY) {
        const { error } = await reg.from('property_units').insert(patch);
        if (error && !String(error.message).includes('duplicate')) throw error;
      }
      unitsCreated++;
    }
  }

  const projectPatch = {
    total_units: matrix.unit_count,
    external_ids: {
      ...(typeof project.external_ids === 'object' && project.external_ids ? project.external_ids : {}),
      bsi_matrix_source: matrixFile.name,
      bsi_matrix_synced_at: new Date().toISOString(),
    },
  };

  if (!DRY) {
    await reg.from('project_registry').update(projectPatch).eq('id', project.id);
    await reg.from('property_registry').update({ total_units: matrix.unit_count }).eq('id', propertyId);
  }

  console.log(`  types: +${typesCreated} ~${typesUpdated} | units: +${unitsCreated} ~${unitsUpdated}`);
  return { status: 'ok', units: matrix.unit_count, types: matrix.unit_type_count };
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
