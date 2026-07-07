#!/usr/bin/env node
/**
 * Generic BSI Counts Workbook → property_unit_type_skus bridge (actuals only).
 *
 * Prereqs:
 *   - Matrix xlsx cached at .firecrawl/matrices/{projectId}-matrix.xlsx
 *   - MW*.xls in .cache/bsi-counts-workbook/{projectId}/ (run fetch-bsi-counts-workbook.mjs)
 *
 * Usage:
 *   node scripts/ingest-bsi-counts-workbook-skus.mjs --project-id=25322 --dry-run
 *   node scripts/ingest-bsi-counts-workbook-skus.mjs --project-id=25322 --apply
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildUnitLookup, normalizeUnitKey, resolveRegistryUnit } from './lib/bsi-unit-match.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(ROOT, f) });
  config({ path: resolve(ROOT, '../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');
const PROJECT_ID = process.argv.find((a) => a.startsWith('--project-id='))?.split('=')[1];
if (!PROJECT_ID) {
  console.error('Usage: node scripts/ingest-bsi-counts-workbook-skus.mjs --project-id=25xxx [--apply]');
  process.exit(1);
}

const SOURCE = 'bsi_counts_workbook';
const MATRIX_XLSX = resolve(ROOT, `.firecrawl/matrices/${PROJECT_ID}-matrix.xlsx`);
const BOM_KEYS_JSON = resolve(ROOT, `.firecrawl/matrices/${PROJECT_ID}-bom-keys.json`);
const BOM_JSON = resolve(ROOT, `.firecrawl/matrices/${PROJECT_ID}-counts-bom.json`);
const CACHE_DIR = resolve(ROOT, `.cache/bsi-counts-workbook/${PROJECT_ID}`);

function normMw(code) {
  if (!code) return null;
  let c = String(code).trim().toUpperCase();
  if (c.startsWith('MUR_')) c = c.slice(4);
  const m = c.match(/^(MW[\d.]+)/);
  return m ? m[1] : c;
}

function resolveMwBase(mwBase, workbookBases) {
  if (workbookBases.has(mwBase)) return mwBase;
  const dot = mwBase.match(/^(MW\d+)\.(\d+)$/);
  if (dot && workbookBases.has(dot[1])) return dot[1];
  const alpha = mwBase.match(/^(MW\d+)[A-Z]$/);
  if (alpha && workbookBases.has(alpha[1])) return alpha[1];
  if (mwBase.endsWith('A') && workbookBases.has(mwBase.slice(0, -1))) return mwBase.slice(0, -1);
  if (mwBase.endsWith('a') && workbookBases.has(mwBase.slice(0, -1))) return mwBase.slice(0, -1);
  return mwBase;
}

function parseTopOpp(raw) {
  const s = (raw || '').toUpperCase();
  return s.startsWith('T') ? 'THUS' : 'OPP';
}

function bomKey(mwBase, topOpp) {
  return `${mwBase}|${topOpp}`;
}

function roomLabel(topOpp, kitchenCab) {
  return `${topOpp}|${kitchenCab}`;
}

function baseTypeName(name) {
  return String(name || '')
    .replace(/\s*-\s*TYPE.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function resolveMwFromUnitType(unitTypeName, kitchenType, kitLabels) {
  if (!unitTypeName || !kitLabels || !Object.keys(kitLabels).length) return null;
  const bt = baseTypeName(unitTypeName);
  let candidates = Object.entries(kitLabels).filter(([, kit]) => {
    const bk = baseTypeName(kit);
    return bk === bt || kit.toUpperCase().includes(bt) || bt.includes(bk.split(' ')[0]);
  });
  if (kitchenType) {
    const kt = String(kitchenType).trim().toLowerCase();
    const ktFiltered = candidates.filter(
      ([, kit]) => kit.toLowerCase().startsWith(kt) || kit.toLowerCase().includes(`${kt} type`),
    );
    if (ktFiltered.length === 1) return ktFiltered[0][0];
    if (ktFiltered.length > 1) candidates = ktFiltered;
  }
  if (candidates.length === 1) return candidates[0][0];
  return null;
}

function resolveMatrixMw(mu, workbookBases, kitLabels) {
  let mwBase = mu.mw_base ? resolveMwBase(normMw(mu.mw_base), workbookBases) : null;
  if (!mwBase && mu.kitchen_type && kitLabels) {
    mwBase = resolveMwFromUnitType(mu.unit_type_name, mu.kitchen_type, kitLabels);
  }
  if (mwBase) mwBase = resolveMwBase(normMw(mwBase), workbookBases);
  return mwBase;
}

async function fetchAll(client, table, select, filters = {}) {
  const rows = [];
  let from = 0;
  while (true) {
    let q = client.from(table).select(select).range(from, from + 999);
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

async function main() {
  const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
  const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;
  if (!regUrl || !regKey) throw new Error('Missing REGISTRY_IQ credentials');

  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });
  const { data: project } = await reg
    .from('project_registry')
    .select('id, project_id, project_name, property_id')
    .eq('project_id', PROJECT_ID)
    .single();
  if (!project?.property_id) throw new Error(`No property for ${PROJECT_ID}`);
  const PROPERTY_ID = project.property_id;
  const projectName = project.project_name || PROJECT_ID;

  console.log(`BSI Counts Workbook SKU bridge — ${PROJECT_ID} (${DRY ? 'DRY' : 'APPLY'})`);

  if (!existsSync(MATRIX_XLSX)) {
    throw new Error(`Matrix xlsx missing: ${MATRIX_XLSX} — run ingest-bsi-matrix-structure first`);
  }

  if (!existsSync(CACHE_DIR) || !existsSync(resolve(CACHE_DIR, 'manifest.json'))) {
    execSync(`node scripts/fetch-bsi-counts-workbook.mjs --project-id=${PROJECT_ID}`, {
      stdio: 'inherit',
      cwd: ROOT,
    });
  }

  execSync(
    `python3 "${resolve(__dirname, 'extract-bsi-bom-keys.py')}" --xlsx="${MATRIX_XLSX}" --out="${BOM_KEYS_JSON}"`,
    { stdio: 'inherit' },
  );
  execSync(
    `python3 "${resolve(__dirname, 'extract-bsi-counts-workbook-bom.py')}" --dir="${CACHE_DIR}" --project-name="${projectName.replace(/"/g, '')}" --out="${BOM_JSON}"`,
    { stdio: 'inherit' },
  );

  const matrix = JSON.parse(readFileSync(BOM_KEYS_JSON, 'utf8'));
  const bomPayload = JSON.parse(readFileSync(BOM_JSON, 'utf8'));

  if (!matrix.count) {
    console.log('  No matrix units with MW BOM keys — skip');
    writeFileSync(
      resolve(ROOT, `.firecrawl/${PROJECT_ID}-sku-bridge-report.json`),
      JSON.stringify({ project_id: PROJECT_ID, status: 'no_matrix_bom_keys', bom_files: bomPayload.file_count }, null, 2),
    );
    return;
  }
  if (!bomPayload.row_count) {
    throw new Error(`No BOM rows extracted from ${CACHE_DIR}`);
  }

  const bomIndex = new Map();
  const workbookBases = new Set();
  for (const row of bomPayload.rows || []) {
    workbookBases.add(row.mw_base);
    const k = bomKey(row.mw_base, row.top_opp);
    if (!bomIndex.has(k)) bomIndex.set(k, new Map());
    const skuMap = bomIndex.get(k);
    const prev = skuMap.get(row.sku);
    if (prev) prev.qty_per_unit += row.qty_per_unit;
    else skuMap.set(row.sku, { ...row });
  }

  console.log(`  Matrix BOM keys: ${matrix.count}, MW xls files: ${bomPayload.file_count}, BOM lines: ${bomPayload.row_count}`);

  const [registryUnits, unitTypes] = await Promise.all([
    fetchAll(reg, 'property_units', 'id, unit_number, unit_type_id', { property_id: PROPERTY_ID }),
    fetchAll(reg, 'property_unit_types', 'id, unit_type_name', { property_id: PROPERTY_ID }),
  ]);
  const unitLookup = buildUnitLookup(registryUnits);
  const typeByName = new Map(unitTypes.map((t) => [t.unit_type_name, t]));
  const typeById = new Map(unitTypes.map((t) => [t.id, t.unit_type_name]));
  const kitLabels = bomPayload.kit_labels || {};

  const variants = new Map();
  const gaps = { matrix_unit_missing_registry: [], no_bom_match: [], no_mw_resolve: [] };

  for (const mu of matrix.units) {
    let ru = resolveRegistryUnit(unitLookup, mu.unit_number);

    // Clemson-style: registry stores unit type names as unit_number
    if (!ru && mu.join_mode === 'unit_type_key') {
      const typeKey = normalizeUnitKey(mu.unit_number);
      ru = unitLookup.get(typeKey);
      if (!ru && typeByName.has(mu.unit_number)) {
        ru = registryUnits.find((u) => typeById.get(u.unit_type_id) === mu.unit_number);
      }
    }

    // Fallback: match by unit_type_name when matrix unit# differs from registry
    if (!ru && mu.unit_type_name && typeByName.has(mu.unit_type_name)) {
      ru = registryUnits.find((u) => typeById.get(u.unit_type_id) === mu.unit_type_name);
    }

    if (!ru?.unit_type_id) {
      gaps.matrix_unit_missing_registry.push(mu.unit_number);
      continue;
    }

    const mwBase = resolveMatrixMw(mu, workbookBases, kitLabels);
    if (!mwBase) {
      gaps.no_mw_resolve.push({ unit_number: mu.unit_number, kitchen_type: mu.kitchen_type, unit_type: mu.unit_type_name });
      continue;
    }

    const topOpp = parseTopOpp(mu.thus_opp);
    const bk = bomKey(mwBase, topOpp);
    if (!bomIndex.has(bk)) {
      gaps.no_bom_match.push({ unit_number: mu.unit_number, bom_key: bk, kitchen_cab: mu.kitchen_cab || mu.kitchen_type });
      continue;
    }
    const kitchenCab = mu.kitchen_cab || mu.kitchen_type || mwBase;
    const rl = roomLabel(topOpp, kitchenCab);
    const vk = `${ru.unit_type_id}|${rl}`;
    if (!variants.has(vk)) {
      variants.set(vk, {
        unit_type_id: ru.unit_type_id,
        unit_type_name: typeById.get(ru.unit_type_id),
        top_opp: topOpp,
        kitchen_cab: kitchenCab,
        mw_base: mwBase,
        bom_key: bk,
        room_label: rl,
        unit_numbers: [],
      });
    }
    variants.get(vk).unit_numbers.push(String(mu.unit_number));
  }

  const inserts = [];
  for (const v of variants.values()) {
    const lines = [...(bomIndex.get(v.bom_key)?.values() || [])];
    const actualUnitCount = v.unit_numbers.length;
    for (const line of lines) {
      inserts.push({
        property_id: PROPERTY_ID,
        unit_type_id: v.unit_type_id,
        sku: line.sku,
        qty_per_unit: line.qty_per_unit,
        room_label: v.room_label,
        source: SOURCE,
        metadata: {
          top_opp: v.top_opp,
          kitchen_cab: v.kitchen_cab,
          mw_base: v.mw_base,
          bom_key: v.bom_key,
          sku_role: line.sku_role,
          actual_unit_count: actualUnitCount,
          bsi_job_id: PROJECT_ID,
        },
      });
    }
  }

  const report = {
    project_id: PROJECT_ID,
    property_id: PROPERTY_ID,
    source: SOURCE,
    matrix_bom_units: matrix.count,
    units_with_bom: [...variants.values()].reduce((s, v) => s + v.unit_numbers.length, 0),
    room_layout_variants: variants.size,
    sku_rows: inserts.length,
    distinct_skus: new Set(inserts.map((r) => r.sku)).size,
    gaps,
  };
  mkdirSync(resolve(ROOT, '.firecrawl'), { recursive: true });
  writeFileSync(resolve(ROOT, `.firecrawl/${PROJECT_ID}-sku-bridge-report.json`), JSON.stringify(report, null, 2));

  console.log(
    `  Variants: ${variants.size}, SKU rows: ${inserts.length}, gaps no_bom: ${gaps.no_bom_match.length}, missing unit: ${gaps.matrix_unit_missing_registry.length}, no_mw: ${gaps.no_mw_resolve.length}`,
  );

  if (DRY) return;

  const { error: delErr } = await reg
    .from('property_unit_type_skus')
    .delete()
    .eq('property_id', PROPERTY_ID)
    .eq('source', SOURCE);
  if (delErr) throw new Error(`delete prior: ${delErr.message}`);

  for (let i = 0; i < inserts.length; i += 200) {
    const batch = inserts.slice(i, i + 200);
    const { error } = await reg.from('property_unit_type_skus').upsert(batch, {
      onConflict: 'unit_type_id,sku,room_label',
    });
    if (error) throw new Error(`upsert @${i}: ${error.message}`);
  }

  const { count } = await reg
    .from('property_unit_type_skus')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', PROPERTY_ID)
    .eq('source', SOURCE);
  console.log(`  Live SKU rows (source=${SOURCE}): ${count}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
