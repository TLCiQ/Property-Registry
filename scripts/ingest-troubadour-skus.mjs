#!/usr/bin/env node
/**
 * Troubadour: bridge Counts Workbook kitchen BOMs → property_unit_type_skus.
 * Actuals only — per Matrix unit (kitchen_cab + THUS/OPP) joined to local BOM JSON.
 *
 * Prereq: python3 scripts/extract-troubadour-bom.py
 * Prereq: .firecrawl/troubadour-matrix.json (extract-troubadour-matrix.py)
 *
 * Usage:
 *   node scripts/ingest-troubadour-skus.mjs --dry-run
 *   node scripts/ingest-troubadour-skus.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(__dirname, '..', f) });
  config({ path: resolve(__dirname, '../../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');
const PROPERTY_ID = '095960e3-5b22-4a0c-9528-e3843fed3ede';
const SOURCE = 'troubadour_counts_workbook';
const MATRIX_JSON = resolve(__dirname, '..', '.firecrawl', 'troubadour-matrix.json');
const BOM_JSON = resolve(__dirname, '..', '.firecrawl', 'troubadour-bom.json');

const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;

function normMw(code) {
  if (!code) return null;
  let c = String(code).trim().toUpperCase();
  if (c.startsWith('MUR_')) c = c.slice(4);
  const m = c.match(/^MW(\d+(?:\.\d+)?)$/i);
  if (!m) return c;
  let num = m[1];
  if (num.includes('.')) {
    const [a, b] = num.split('.');
    num = `${parseInt(a, 10).toString().padStart(2, '0')}.${b}`;
  } else {
    num = parseInt(num, 10).toString().padStart(2, '0');
  }
  return `MW${num}`;
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

function ensureJson(script, outPath) {
  if (existsSync(outPath)) return;
  execSync(`python3 "${resolve(__dirname, script)}"`, { stdio: 'inherit' });
}

async function main() {
  if (!regUrl || !regKey) {
    console.error('Missing REGISTRY_IQ credentials');
    process.exit(1);
  }

  ensureJson('extract-troubadour-matrix.py', MATRIX_JSON);
  ensureJson('extract-troubadour-bom.py', BOM_JSON);

  const matrix = JSON.parse(readFileSync(MATRIX_JSON, 'utf8'));
  const bomPayload = JSON.parse(readFileSync(BOM_JSON, 'utf8'));
  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });

  console.log(`Troubadour SKU bridge (${DRY ? 'DRY-RUN' : 'APPLY'}) — actuals only`);

  const bomIndex = new Map();
  for (const row of bomPayload.rows || []) {
    const k = bomKey(row.mw_base, row.top_opp);
    if (!bomIndex.has(k)) bomIndex.set(k, new Map());
    const skuMap = bomIndex.get(k);
    const prev = skuMap.get(row.sku);
    if (prev) {
      prev.qty_per_unit += row.qty_per_unit;
    } else {
      skuMap.set(row.sku, { ...row });
    }
  }
  console.log(`  BOM lines: ${bomPayload.row_count}, keys: ${bomIndex.size}`);

  const [registryUnits, unitTypes] = await Promise.all([
    fetchAll(reg, 'property_units', 'id, unit_number, unit_type_id', { property_id: PROPERTY_ID }),
    fetchAll(reg, 'property_unit_types', 'id, unit_type_name, unit_count', { property_id: PROPERTY_ID }),
  ]);
  const unitByNumber = new Map(registryUnits.map((u) => [String(u.unit_number), u]));
  const typeNameById = new Map(unitTypes.map((t) => [t.id, t.unit_type_name]));

  const variants = new Map();
  const gaps = { matrix_unit_missing_registry: [], no_bom_match: [] };

  for (const mu of matrix.units) {
    if (!mu.kitchen_cab) continue;
    const ru = unitByNumber.get(String(mu.unit_number));
    if (!ru?.unit_type_id) {
      gaps.matrix_unit_missing_registry.push(mu.unit_number);
      continue;
    }
    const mwBase = normMw(mu.kitchen_cab);
    const topOpp = parseTopOpp(mu.thus_opp);
    const bk = bomKey(mwBase, topOpp);
    if (!bomIndex.has(bk)) {
      gaps.no_bom_match.push({
        unit_number: mu.unit_number,
        bom_key: bk,
        kitchen_cab: mu.kitchen_cab,
        top_opp: topOpp,
      });
      continue;
    }
    const rl = roomLabel(topOpp, mu.kitchen_cab);
    const vk = `${ru.unit_type_id}|${rl}`;
    if (!variants.has(vk)) {
      variants.set(vk, {
        unit_type_id: ru.unit_type_id,
        unit_type_name: typeNameById.get(ru.unit_type_id),
        top_opp: topOpp,
        kitchen_cab: mu.kitchen_cab,
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
        description: null,
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
        },
      });
    }
  }

  const variantCount = variants.size;
  const distinctSkus = new Set(inserts.map((r) => r.sku)).size;
  const unitsAssigned = [...variants.values()].reduce((s, v) => s + v.unit_numbers.length, 0);
  const matrixWithCab = matrix.units.filter((u) => u.kitchen_cab).length;

  console.log(`  Room-layout variants: ${variantCount}`);
  console.log(`  Physical units with BOM: ${unitsAssigned} / ${matrixWithCab}`);
  console.log(`  SKU rows to write: ${inserts.length} (${distinctSkus} distinct SKUs)`);
  if (gaps.no_bom_match.length) {
    console.log(`  GAP no BOM match: ${gaps.no_bom_match.length}`, gaps.no_bom_match.slice(0, 5));
  }

  const report = {
    property_id: PROPERTY_ID,
    source: SOURCE,
    matrix_units_with_cab: matrixWithCab,
    units_with_bom: unitsAssigned,
    room_layout_variants: variantCount,
    sku_rows: inserts.length,
    distinct_skus: distinctSkus,
    gaps,
  };
  writeFileSync(resolve(__dirname, '..', '.firecrawl', 'troubadour-sku-bridge-report.json'), JSON.stringify(report, null, 2));

  if (DRY) {
    console.log('  Wrote .firecrawl/troubadour-sku-bridge-report.json');
    return;
  }

  const { error: delErr } = await reg
    .from('property_unit_type_skus')
    .delete()
    .eq('property_id', PROPERTY_ID)
    .eq('source', SOURCE);
  if (delErr) throw new Error(`delete prior rows: ${delErr.message}`);

  let written = 0;
  for (let i = 0; i < inserts.length; i += 200) {
    const batch = inserts.slice(i, i + 200);
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
