#!/usr/bin/env node
/**
 * Morgan Hill vanity SKUs → property_unit_type_skus (actuals only).
 * Source: Counts Workbook MW tabs (vanity SKUs on same package as kitchen).
 * room_label: BATH1|THUS|MW01_SCH1 (and BATH2 when unit has second vanity in Matrix).
 *
 * Usage: node scripts/ingest-morganhill-vanity-skus.mjs --dry-run | --apply
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(__dirname, '..', f) });
  config({ path: resolve(__dirname, '../../Derived State/dale-chat', f) });
}

const DRY = !process.argv.includes('--apply');
const PROPERTY_ID = 'a30d446c-ee4a-4fe0-a76e-e4f9bed0e3b0';
const SOURCE = 'morgan_hill_counts_workbook_vanity';
const VANITY_JSON = resolve(__dirname, '..', '.firecrawl', 'mh-vanity-bom.json');

function resolveMwBase(kitchenCab, workbookBases) {
  const raw = kitchenCab.replace(/_SCH\d+$/i, '');
  if (workbookBases.has(raw)) return raw;
  const dot = raw.match(/^(MW\d+)\.(\d+)$/);
  if (dot && workbookBases.has(dot[1])) return dot[1];
  if (raw.endsWith('A')) {
    const stripped = raw.slice(0, -1);
    if (workbookBases.has(stripped)) return stripped;
  }
  return raw;
}

function bomKey(scheme, mwBase, topOpp) {
  return `${scheme}|${mwBase}|${topOpp}`;
}

function roomLabel(bathNo, topOpp, kitchenCab) {
  return `BATH${bathNo}|${topOpp}|${kitchenCab}`;
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
  const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
  const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;
  if (!regUrl || !regKey) process.exit(1);

  if (!existsSync(VANITY_JSON)) {
    execSync(`python3 "${resolve(__dirname, 'extract-mh-vanity-bom.py')}"`, { stdio: 'inherit' });
  }
  const vanity = JSON.parse(readFileSync(VANITY_JSON, 'utf8'));
  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });

  const bomIndex = new Map();
  const workbookBases = new Set();
  for (const line of vanity.lines || []) {
    workbookBases.add(line.mw_base);
    const mw = line.mw_base;
    const k = bomKey(line.scheme, mw, line.top_opp);
    if (!bomIndex.has(k)) bomIndex.set(k, []);
    bomIndex.get(k).push(line);
  }

  const units = await fetchAll(reg, 'property_units', 'id, unit_number, unit_type_id, metadata', {
    property_id: PROPERTY_ID,
  });

  /** @type {Map<string, { unit_type_id, top_opp, kitchen_cab, scheme, mw_base, bom_key, bath_no, unit_numbers: string[] }>} */
  const variants = new Map();

  for (const u of units) {
    const m = u.metadata || {};
    if (!m.kitchen_cab || !m.top_opp) continue;
    const mw = resolveMwBase(m.kitchen_cab, workbookBases);
    const scheme = String(m.scheme || '');
    const bk = bomKey(scheme, mw, m.top_opp);
    if (!bomIndex.has(bk)) continue;

    const baths = [1];
    if (m.vanity_2_elev) baths.push(2);
    for (const bathNo of baths) {
      const rl = roomLabel(bathNo, m.top_opp, m.kitchen_cab);
      const vk = `${u.unit_type_id}|${rl}`;
      if (!variants.has(vk)) {
        variants.set(vk, {
          unit_type_id: u.unit_type_id,
          top_opp: m.top_opp,
          kitchen_cab: m.kitchen_cab,
          scheme,
          mw_base: mw,
          bom_key: bk,
          bath_no: bathNo,
          unit_numbers: [],
        });
      }
      variants.get(vk).unit_numbers.push(String(u.unit_number));
    }
  }

  const inserts = [];
  for (const v of variants.values()) {
    const skuMap = new Map();
    for (const line of bomIndex.get(v.bom_key) || []) {
      const rl = roomLabel(v.bath_no, v.top_opp, v.kitchen_cab);
      const dedupeKey = `${line.sku}|${rl}`;
      if (skuMap.has(dedupeKey)) {
        skuMap.get(dedupeKey).qty_per_unit += Number(line.qty_per_unit ?? 0);
      } else {
        skuMap.set(dedupeKey, {
          property_id: PROPERTY_ID,
          unit_type_id: v.unit_type_id,
          sku: line.sku,
          qty_per_unit: Number(line.qty_per_unit ?? 0),
          room_label: rl,
          source: SOURCE,
          metadata: {
            sku_role: 'vanity',
            bath_number: v.bath_no,
            top_opp: v.top_opp,
            kitchen_cab: v.kitchen_cab,
            bom_key: v.bom_key,
            actual_unit_count: v.unit_numbers.length,
          },
        });
      }
    }
    inserts.push(...skuMap.values());
  }

  console.log(`Vanity SKU bridge (${DRY ? 'DRY-RUN' : 'APPLY'})`);
  console.log(`  variants: ${variants.size}, rows: ${inserts.length}, skus: ${new Set(inserts.map((r) => r.sku)).size}`);

  if (DRY) return;

  await reg.from('property_unit_type_skus').delete().eq('property_id', PROPERTY_ID).eq('source', SOURCE);
  for (let i = 0; i < inserts.length; i += 200) {
    const batch = inserts.slice(i, i + 200);
    const { error } = await reg.from('property_unit_type_skus').upsert(batch, {
      onConflict: 'unit_type_id,sku,room_label',
    });
    if (error) throw new Error(error.message);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
