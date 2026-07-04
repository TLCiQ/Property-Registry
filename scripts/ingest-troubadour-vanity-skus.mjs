#!/usr/bin/env node
/**
 * Troubadour vanity SKUs → property_unit_type_skus (actuals only).
 * room_label: BATH{n}|THUS|MW04
 *
 * Usage: node scripts/ingest-troubadour-vanity-skus.mjs --dry-run | --apply
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(__dirname, '..', f) });
  config({ path: resolve(__dirname, '../../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');
const PROPERTY_ID = '095960e3-5b22-4a0c-9528-e3843fed3ede';
const SOURCE = 'troubadour_counts_workbook_vanity';
const VANITY_JSON = resolve(__dirname, '..', '.firecrawl', 'troubadour-vanity-bom.json');

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

function roomLabel(bathNo, topOpp, kitchenCab) {
  return `BATH${bathNo}|${topOpp}|${kitchenCab}`;
}

function bathNumbers(drawings) {
  if (!drawings || typeof drawings !== 'object') return [1];
  const baths = [];
  if (drawings['BATH TOP SD']) baths.push(1);
  if (drawings['BATH 2 TOP SD']) baths.push(2);
  if (drawings['BATH 3 TOP SD2']) baths.push(3);
  if (drawings['BATH 4 TOP SD3']) baths.push(4);
  if (drawings['BATH 5 TOP SD4']) baths.push(5);
  return baths.length ? baths : [1];
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
    execSync(`python3 "${resolve(__dirname, 'extract-troubadour-vanity-bom.py')}"`, { stdio: 'inherit' });
  }
  const vanity = JSON.parse(readFileSync(VANITY_JSON, 'utf8'));
  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });

  const bomIndex = new Map();
  for (const line of vanity.lines || []) {
    const k = bomKey(line.mw_base, line.top_opp);
    if (!bomIndex.has(k)) bomIndex.set(k, new Map());
    const skuMap = bomIndex.get(k);
    const prev = skuMap.get(line.sku);
    if (prev) prev.qty_per_unit += line.qty_per_unit;
    else skuMap.set(line.sku, { ...line });
  }

  const units = await fetchAll(reg, 'property_units', 'id, unit_number, unit_type_id, metadata', {
    property_id: PROPERTY_ID,
  });

  const variants = new Map();
  const gaps = { no_vanity_bom: 0 };

  for (const u of units) {
    const m = u.metadata || {};
    if (!m.kitchen_cab) continue;
    const mw = normMw(m.kitchen_cab);
    const topOpp = parseTopOpp(m.thus_opp);
    const bk = bomKey(mw, topOpp);
    const lines = bomIndex.get(bk);
    if (!lines?.size) {
      gaps.no_vanity_bom++;
      continue;
    }
    for (const bathNo of bathNumbers(m.drawings)) {
      const rl = roomLabel(bathNo, topOpp, m.kitchen_cab);
      const vk = `${u.unit_type_id}|${rl}`;
      if (!variants.has(vk)) {
        variants.set(vk, {
          unit_type_id: u.unit_type_id,
          top_opp: topOpp,
          kitchen_cab: m.kitchen_cab,
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
    for (const line of bomIndex.get(v.bom_key)?.values() || []) {
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
            mw_base: v.mw_base,
            bom_key: v.bom_key,
            actual_unit_count: v.unit_numbers.length,
          },
        });
      }
    }
    inserts.push(...skuMap.values());
  }

  console.log(`Troubadour vanity SKU bridge (${DRY ? 'DRY-RUN' : 'APPLY'})`);
  console.log(`  variants: ${variants.size}, rows: ${inserts.length}, skus: ${new Set(inserts.map((r) => r.sku)).size}`);
  if (gaps.no_vanity_bom) console.log(`  units w/o vanity BOM: ${gaps.no_vanity_bom}`);

  if (DRY) return;

  const { error: delErr } = await reg
    .from('property_unit_type_skus')
    .delete()
    .eq('property_id', PROPERTY_ID)
    .eq('source', SOURCE);
  if (delErr) throw new Error(delErr.message);

  for (let i = 0; i < inserts.length; i += 200) {
    const batch = inserts.slice(i, i + 200);
    const { error } = await reg.from('property_unit_type_skus').upsert(batch, {
      onConflict: 'unit_type_id,sku,room_label',
    });
    if (error) throw new Error(error.message);
  }

  const { count } = await reg
    .from('property_unit_type_skus')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', PROPERTY_ID)
    .eq('source', SOURCE);
  console.log(`  Live count source=${SOURCE}: ${count}`);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
