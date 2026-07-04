#!/usr/bin/env node
/**
 * Morgan Hill: bridge Counts Workbook kitchen BOMs into Registry property_unit_type_skus.
 *
 * ONLY ACTUALS — no majority vote, no inferred attributes.
 * Each Matrix unit row supplies Kitchen Cab + Thus/Opp + Scheme for that physical unit.
 * Units sharing the same (unit_type_id, top_opp, kitchen_cab) are one room-layout variant.
 * room_label = `${top_opp}|${kitchen_cab}` (THUS/OPP = room-level layout difference).
 * metadata.actual_unit_count = count of physical units in that variant (not unit_type.unit_count).
 *
 * Usage:
 *   node scripts/ingest-morganhill-skus.mjs --dry-run
 *   node scripts/ingest-morganhill-skus.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(__dirname, '..', f) });
  config({ path: resolve(__dirname, '../../Derived State/dale-chat', f) });
}

const DRY = !process.argv.includes('--apply');
const PROPERTY_ID = 'a30d446c-ee4a-4fe0-a76e-e4f9bed0e3b0';
const DALE_PROJECT = 'Carrollton, TX - Morgan Hill';
const SOURCE = 'morgan_hill_counts_workbook';
const MATRIX_FLAG = process.argv.find((a) => a.startsWith('--matrix='))?.slice('--matrix='.length);

const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;
const daleUrl = process.env.DALE_DEMAND_SUPABASE_URL;
const daleKey =
  process.env.DALE_DEMAND_SUPABASE_SERVICE_ROLE_KEY || process.env.DALE_DEMAND_SUPABASE_KEY;

/** Normalize Matrix MW codes to Counts Workbook tab names. */
function resolveMwBase(mwBase, workbookBases) {
  if (workbookBases.has(mwBase)) return mwBase;
  if (mwBase.endsWith('A')) {
    const stripped = mwBase.slice(0, -1);
    if (workbookBases.has(stripped)) return stripped;
  }
  const dot = mwBase.match(/^(MW\d+)\.(\d+)$/);
  if (dot && workbookBases.has(dot[1])) return dot[1];
  return mwBase;
}

function bomKey(scheme, mwBase, topOpp) {
  return `${scheme}|${mwBase}|${topOpp}`;
}

function roomLabel(topOpp, kitchenCab) {
  return `${topOpp}|${kitchenCab}`;
}

async function fetchAll(client, table, select, filters = {}) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];
  for (;;) {
    let q = client.from(table).select(select).range(from, from + pageSize - 1);
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function main() {
  if (!regUrl || !regKey) {
    console.error('Missing REGISTRY_IQ_SUPABASE_URL or REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!daleUrl || !daleKey) {
    console.error('Missing DALE_DEMAND_SUPABASE_URL or DALE_DEMAND_SUPABASE_KEY');
    process.exit(1);
  }

  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });
  const dale = createClient(daleUrl, daleKey, { auth: { persistSession: false } });

  console.log(`Morgan Hill SKU bridge (${DRY ? 'DRY-RUN' : 'APPLY'}) — actuals only`);

  const pyCmd = MATRIX_FLAG
    ? `python3 "${resolve(__dirname, 'extract-mh-bom-keys.py')}" "${MATRIX_FLAG}"`
    : `python3 "${resolve(__dirname, 'extract-mh-bom-keys.py')}"`;
  const matrixJson = JSON.parse(execSync(pyCmd, { encoding: 'utf8' }));
  if (matrixJson.error) {
    console.error(matrixJson.error);
    process.exit(1);
  }
  console.log(`  Matrix units w/ kitchen cab: ${matrixJson.count}`);

  const [registryUnits, unitTypes, bomRows] = await Promise.all([
    fetchAll(reg, 'property_units', 'id, unit_number, unit_type_id', { property_id: PROPERTY_ID }),
    fetchAll(reg, 'property_unit_types', 'id, unit_type_name, unit_count', { property_id: PROPERTY_ID }),
    fetchAll(dale, 'millwork_mw_package_sku', 'scheme, mw_base, top_opp, sku, qty_per_unit, sku_role', {
      project_name: DALE_PROJECT,
    }),
  ]);

  const unitByNumber = new Map(registryUnits.map((u) => [String(u.unit_number), u]));
  const typeNameById = new Map(unitTypes.map((t) => [t.id, t.unit_type_name]));

  const workbookBases = new Set(bomRows.map((r) => r.mw_base));
  const bomIndex = new Map();
  for (const row of bomRows) {
    const k = bomKey(String(row.scheme), row.mw_base, row.top_opp);
    if (!bomIndex.has(k)) bomIndex.set(k, []);
    bomIndex.get(k).push(row);
  }
  console.log(`  DALE BOM rows: ${bomRows.length}, keys: ${bomIndex.size}`);

  /** @type {Map<string, { unit_type_id, unit_type_name, top_opp, kitchen_cab, scheme, mw_base, bom_key, unit_numbers: string[] }>} */
  const variants = new Map();
  const gaps = { matrix_unit_missing_registry: [], no_bom_match: [] };

  for (const mu of matrixJson.units) {
    const ru = unitByNumber.get(String(mu.unit_number));
    if (!ru?.unit_type_id) {
      gaps.matrix_unit_missing_registry.push(mu.unit_number);
      continue;
    }
    const mwBase = resolveMwBase(mu.mw_base, workbookBases);
    const bk = bomKey(String(mu.scheme), mwBase, mu.top_opp);
    if (!bomIndex.has(bk)) {
      gaps.no_bom_match.push({
        unit_number: mu.unit_number,
        bom_key: bk,
        kitchen_cab: mu.kitchen_cab,
        top_opp: mu.top_opp,
      });
      continue;
    }
    const rl = roomLabel(mu.top_opp, mu.kitchen_cab);
    const vk = `${ru.unit_type_id}|${rl}`;
    if (!variants.has(vk)) {
      variants.set(vk, {
        unit_type_id: ru.unit_type_id,
        unit_type_name: typeNameById.get(ru.unit_type_id),
        top_opp: mu.top_opp,
        kitchen_cab: mu.kitchen_cab,
        scheme: String(mu.scheme),
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
    const lines = bomIndex.get(v.bom_key) || [];
    const actualUnitCount = v.unit_numbers.length;
    for (const line of lines) {
      inserts.push({
        property_id: PROPERTY_ID,
        unit_type_id: v.unit_type_id,
        sku: line.sku,
        description: null,
        qty_per_unit: line.qty_per_unit,
        room_label: v.room_label,
        source: SOURCE,
        metadata: {
          top_opp: v.top_opp,
          kitchen_cab: v.kitchen_cab,
          scheme: v.scheme,
          mw_base: v.mw_base,
          bom_key: v.bom_key,
          sku_role: line.sku_role,
          actual_unit_count: actualUnitCount,
        },
      });
    }
  }

  const variantCount = variants.size;
  const distinctSkus = new Set(inserts.map((r) => r.sku)).size;
  const unitsAssigned = [...variants.values()].reduce((s, v) => s + v.unit_numbers.length, 0);

  console.log(`  Room-layout variants (type × THUS/OPP × kitchen_cab): ${variantCount}`);
  console.log(`  Physical units with BOM: ${unitsAssigned} / ${matrixJson.count}`);
  console.log(`  SKU rows to write: ${inserts.length} (${distinctSkus} distinct SKUs)`);

  if (gaps.matrix_unit_missing_registry.length) {
    console.log(`  GAP missing registry units: ${gaps.matrix_unit_missing_registry.length}`);
  }
  if (gaps.no_bom_match.length) {
    console.log(`  GAP no BOM match: ${gaps.no_bom_match.length}`, gaps.no_bom_match.slice(0, 3));
  }

  const report = {
    property_id: PROPERTY_ID,
    source: SOURCE,
    method: 'actuals_only_per_unit_variant',
    matrix_units: matrixJson.count,
    units_with_bom: unitsAssigned,
    room_layout_variants: variantCount,
    sku_rows: inserts.length,
    distinct_skus: distinctSkus,
    gaps,
    sample_variants: [...variants.values()].slice(0, 5).map((v) => ({
      unit_type_name: v.unit_type_name,
      room_label: v.room_label,
      actual_unit_count: v.unit_numbers.length,
      sku_lines: (bomIndex.get(v.bom_key) || []).length,
    })),
  };
  writeFileSync(resolve(__dirname, '..', '.firecrawl', 'mh-sku-bridge-report.json'), JSON.stringify(report, null, 2));

  if (DRY) {
    console.log('  Wrote .firecrawl/mh-sku-bridge-report.json');
    console.log('Dry-run only. Re-run with --apply to write property_unit_type_skus.');
    return;
  }

  const { error: delErr } = await reg
    .from('property_unit_type_skus')
    .delete()
    .eq('property_id', PROPERTY_ID)
    .eq('source', SOURCE);
  if (delErr) throw new Error(`delete prior rows: ${delErr.message}`);

  let written = 0;
  const chunk = 200;
  for (let i = 0; i < inserts.length; i += chunk) {
    const batch = inserts.slice(i, i + chunk);
    const { error } = await reg.from('property_unit_type_skus').upsert(batch, {
      onConflict: 'unit_type_id,sku,room_label',
    });
    if (error) throw new Error(`upsert batch @${i}: ${error.message}`);
    written += batch.length;
  }

  const { count } = await reg
    .from('property_unit_type_skus')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', PROPERTY_ID)
    .eq('source', SOURCE);

  console.log(`  Upserted ${written} rows; live count source=${SOURCE}: ${count}`);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
