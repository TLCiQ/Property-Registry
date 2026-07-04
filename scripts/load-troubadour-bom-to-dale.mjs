#!/usr/bin/env node
/**
 * Mirror Troubadour Counts Workbook BOM (kitchen + vanity) → DALE-Demand millwork_mw_package_sku.
 *
 * Prereq: python3 scripts/extract-troubadour-bom.py
 * Prereq: python3 scripts/extract-troubadour-vanity-bom.py
 *
 * Usage: node scripts/load-troubadour-bom-to-dale.mjs --dry-run | --apply
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
const PROJECT_NAME = 'Lubbock, TX - 14th Street SH';
const PROJECT_DEAL = '25019';
const KITCHEN_JSON = resolve(__dirname, '..', '.firecrawl', 'troubadour-bom.json');
const VANITY_JSON = resolve(__dirname, '..', '.firecrawl', 'troubadour-vanity-bom.json');

function ensureJson(script, out) {
  if (existsSync(out)) return;
  execSync(`python3 "${resolve(__dirname, script)}"`, { stdio: 'inherit' });
}

function toDaleRow(row) {
  return {
    project_name: PROJECT_NAME,
    project_deal: PROJECT_DEAL,
    scheme: row.scheme || '1',
    mw_base: row.mw_base,
    top_opp: row.top_opp,
    sku: row.sku,
    qty_per_unit: row.qty_per_unit,
    sku_role: row.sku_role,
    source_file: row.source_path?.split('/').pop() || row.source_file || null,
    source_sheet: row.sheet_name || row.source_sheet || null,
  };
}

async function main() {
  const daleUrl = process.env.DALE_DEMAND_SUPABASE_URL;
  const daleKey =
    process.env.DALE_DEMAND_SUPABASE_SERVICE_ROLE_KEY || process.env.DALE_DEMAND_SUPABASE_KEY;
  if (!daleUrl || !daleKey) {
    console.error('Missing DALE_DEMAND credentials');
    process.exit(1);
  }

  ensureJson('extract-troubadour-bom.py', KITCHEN_JSON);
  ensureJson('extract-troubadour-vanity-bom.py', VANITY_JSON);

  const kitchen = JSON.parse(readFileSync(KITCHEN_JSON, 'utf8'));
  const vanity = JSON.parse(readFileSync(VANITY_JSON, 'utf8'));

  const skuMap = new Map();
  for (const row of kitchen.rows || []) {
    const key = `${row.scheme || '1'}|${row.mw_base}|${row.top_opp}|${row.sku}`;
    const d = toDaleRow(row);
    if (skuMap.has(key)) skuMap.get(key).qty_per_unit += d.qty_per_unit;
    else skuMap.set(key, d);
  }
  for (const row of vanity.lines || []) {
    const key = `${row.scheme || '1'}|${row.mw_base}|${row.top_opp}|${row.sku}`;
    const d = toDaleRow(row);
    if (skuMap.has(key)) {
      const prev = skuMap.get(key);
      prev.qty_per_unit = Math.max(prev.qty_per_unit, d.qty_per_unit);
      prev.sku_role = 'vanity';
    } else {
      skuMap.set(key, d);
    }
  }
  const rows = [...skuMap.values()];

  const dale = createClient(daleUrl, daleKey, { auth: { persistSession: false } });
  const { count: before } = await dale
    .from('millwork_mw_package_sku')
    .select('*', { count: 'exact', head: true })
    .eq('project_name', PROJECT_NAME);

  console.log(`DALE BOM mirror (${DRY ? 'DRY-RUN' : 'APPLY'})`);
  console.log(`  rows to load: ${rows.length} (replacing ${before ?? 0} existing for ${PROJECT_NAME})`);
  console.log(
    `  roles: cabinet=${rows.filter((r) => r.sku_role === 'cabinet').length}, vanity=${rows.filter((r) => r.sku_role === 'vanity').length}, hardware=${rows.filter((r) => r.sku_role === 'hardware').length}`,
  );

  if (DRY) return;

  const { error: delErr } = await dale.from('millwork_mw_package_sku').delete().eq('project_name', PROJECT_NAME);
  if (delErr) throw new Error(`delete: ${delErr.message}`);

  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const { error } = await dale.from('millwork_mw_package_sku').insert(batch);
    if (error) throw new Error(`insert @${i}: ${error.message}`);
  }

  const { count: after } = await dale
    .from('millwork_mw_package_sku')
    .select('*', { count: 'exact', head: true })
    .eq('project_name', PROJECT_NAME);
  console.log(`  Live DALE count: ${after}`);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
