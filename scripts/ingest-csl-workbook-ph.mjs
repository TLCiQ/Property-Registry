#!/usr/bin/env node
/**
 * CSL Sales workbook → Registry-iQ phantom SKU ingest (`source = ph_csl_workbook`).
 *
 * Primary source: Sales / Sales - Student Housing / … / {year} Project Workbooks / CSL
 *   UF-CSL Quote Rev.* or Quote - * sheets (see scripts/extract-csl-workbook-ph.py)
 *
 * Interim (Lincoln II until Sales xlsx uploaded): Tricia Production Sage invoice PDFs.
 *
 * Usage:
 *   node scripts/ingest-csl-workbook-ph.mjs --dry-run
 *   node scripts/ingest-csl-workbook-ph.mjs --apply --only=27-006-I,27-007-I
 *   node scripts/ingest-csl-workbook-ph.mjs --apply --local=.firecrawl/csl-workbooks/26-006-I-Hub-Boulder.xlsx --only=26-006-I
 *
 * @see docs/PRODUCTION_REGISTRY_UNIT_PIPELINE.md § PH phantom supersession
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { downloadBoxFile, getBoxAccessToken } from './lib/box-api-download.mjs';
import { listJobs, SALES_CSL_WORKBOOK_PATH } from './lib/csl-workbook-ph-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(ROOT, f) });
  config({ path: resolve(ROOT, '../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1];
const LOCAL = process.argv.find((a) => a.startsWith('--local='))?.split('=').slice(1).join('=');
const CACHE_DIR = resolve(ROOT, '.cache/csl-workbook-ph');

const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;
const prodUrl = process.env.PRODUCTION_SUPABASE_URL;
const prodKey = process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY;

if (!regUrl || !regKey) {
  console.error('Missing REGISTRY_IQ_SUPABASE_URL or REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });
const prod = prodUrl && prodKey
  ? createClient(prodUrl, prodKey, { auth: { persistSession: false } })
  : null;

function extractWorkbook(sourcePath, format) {
  const fmtFlag = format && format !== 'auto' ? `--format=${format}` : '';
  const out = execSync(
    `python3 scripts/extract-csl-workbook-ph.py --xlsx "${sourcePath}" ${fmtFlag}`.trim(),
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  );
  const parsed = JSON.parse(out);
  if (parsed.error) throw new Error(parsed.error);
  return parsed;
}

async function searchBoxWorkbook(token, job) {
  const query = job.boxSearchSalesCsl || job.registryProjectId;
  const pathIncludes = job.salesPathMustInclude || [];
  const params = new URLSearchParams({
    query,
    type: 'file',
    fields: 'id,name,path_collection,extension',
    limit: '25',
  });
  const res = await fetch(`https://api.box.com/2.0/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Box search failed (${res.status})`);
  const json = await res.json();
  const hits = (json.entries || []).filter((e) => {
    if (!/\.(xlsx|xlsm)$/i.test(e.name || '')) return false;
    const dealToken = job.registryProjectId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(dealToken, 'i').test(e.name || '');
  });
  const scored = hits.map((h) => {
    const path = (h.path_collection?.entries || []).map((p) => p.name).join(' / ');
    let score = 0;
    if (path.includes(SALES_CSL_WORKBOOK_PATH)) score += 20;
    if (pathIncludes.every((frag) => path.includes(frag))) score += 10;
    if (/project workbooks/i.test(path)) score += 5;
    if (/\.xlsx$/i.test(h.name)) score += 2;
    return { ...h, path, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0] || null;
}

async function resolveSourceFile(job, token) {
  if (LOCAL) {
    const p = resolve(ROOT, LOCAL);
    if (!existsSync(p)) throw new Error(`--local file not found: ${p}`);
    return { path: p, boxMeta: { source: 'local', name: basename(p) }, format: 'auto' };
  }

  mkdirSync(CACHE_DIR, { recursive: true });
  const cacheName = `${job.registryProjectId}-${job.scope}`;
  const tryDownload = async (fileId, fileName, format, sourceLabel) => {
    const ext = fileName.match(/\.[^.]+$/)?.[0] || '.xlsx';
    const dest = resolve(CACHE_DIR, `${cacheName}${ext}`);
    await downloadBoxFile(token, fileId, dest);
    return {
      path: dest,
      boxMeta: { source: sourceLabel, boxFileId: fileId, name: fileName },
      format,
    };
  };

  if (job.boxFileId) {
    return tryDownload(
      job.boxFileId,
      job.boxFileName || `${job.registryProjectId}.xlsx`,
      job.workbookFormat || 'auto',
      'boxFileId',
    );
  }

  const salesHit = await searchBoxWorkbook(token, job);
  if (salesHit?.score >= 15) {
    console.log(`  Box Sales CSL hit: ${salesHit.name} (${salesHit.path})`);
    return tryDownload(salesHit.id, salesHit.name, 'quote_rev', 'sales_csl_workbook');
  }

  if (job.fallbackBoxFileId) {
    console.warn(
      `  ⚠ No Sales CSL xlsx for ${job.registryProjectId} — using interim ${job.fallbackBoxFileName}`,
    );
    return tryDownload(
      job.fallbackBoxFileId,
      job.fallbackBoxFileName,
      job.workbookFormat || 'sage_invoice_pdf',
      'fallback_production_pdf',
    );
  }

  throw new Error(
    `No CSL Sales workbook found for ${job.registryProjectId}. Upload xlsx under Sales …/Project Workbooks/CSL or pass --local=`,
  );
}

async function productionHasRequirements(dealNumber) {
  if (!prod || !dealNumber) return false;
  const { data: deal } = await prod.from('deals').select('id').eq('deal_number', dealNumber).maybeSingle();
  if (!deal?.id) return false;
  const { count } = await prod
    .from('requirements')
    .select('id', { count: 'exact', head: true })
    .eq('deal_id', deal.id);
  return (count || 0) > 0;
}

async function fetchAllUnitTypes(propertyId) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await reg
      .from('property_unit_types')
      .select('id, unit_type_name, unit_count')
      .eq('property_id', propertyId)
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

function buildSkuRows({
  lines,
  unitTypes,
  totalUnits,
  propertyId,
  job,
  boxMeta,
  extracted,
}) {
  const now = new Date().toISOString();
  const rows = [];
  const denom = totalUnits > 0 ? totalUnits : unitTypes.length;

  for (const line of lines) {
    const sku = String(line.sku || '').toUpperCase();
    if (!sku) continue;
    const qtyTotal = Number(line.qty_total) || 0;
    if (qtyTotal <= 0) continue;
    const qtyPerUnit = Math.round((qtyTotal / denom) * 10000) / 10000;
    if (qtyPerUnit <= 0) continue;

    for (const ut of unitTypes) {
      rows.push({
        property_id: propertyId,
        unit_type_id: ut.id,
        sku,
        description: line.description || null,
        qty_per_unit: qtyPerUnit,
        room_label: job.roomLabel || '',
        source: 'ph_csl_workbook',
        production_line_key: line.workbook_line_key,
        metadata: {
          phantom: true,
          deal_number: job.prodDealNumber,
          registry_project_id: job.registryProjectId,
          workbook_line_key: line.workbook_line_key,
          workbook_source: boxMeta.source,
          box_file_id: boxMeta.boxFileId || null,
          box_file_name: boxMeta.name || null,
          ingest_format: extracted.format,
          qty_total: qtyTotal,
          allocation_method: 'project_total_over_property_units',
          property_unit_total: denom,
          ingested_at: now,
        },
      });
    }
  }
  return rows;
}

async function deletePriorPhantoms(propertyId, job) {
  const { data, error } = await reg
    .from('property_unit_type_skus')
    .select('id, room_label, metadata')
    .eq('property_id', propertyId)
    .eq('source', 'ph_csl_workbook');
  if (error) throw new Error(error.message);

  const ids = (data || [])
    .filter((row) => {
      const m = row.metadata || {};
      const dealMatch =
        m.deal_number === job.prodDealNumber ||
        m.registry_project_id === job.registryProjectId;
      if (!dealMatch) return false;
      if (job.roomLabel && (row.room_label ?? '') !== job.roomLabel) return false;
      return true;
    })
    .map((r) => r.id);

  if (!ids.length || DRY) return ids.length;
  const { error: delErr } = await reg.from('property_unit_type_skus').delete().in('id', ids);
  if (delErr) throw new Error(delErr.message);
  return ids.length;
}

async function upsertRows(rows) {
  let written = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    if (DRY) {
      written += batch.length;
      continue;
    }
    const { error } = await reg.from('property_unit_type_skus').upsert(batch, {
      onConflict: 'unit_type_id,sku,room_label',
    });
    if (error) throw new Error(error.message);
    written += batch.length;
  }
  return written;
}

async function runJob(job, token) {
  console.log(`\n── ${job.label} (${job.registryProjectId}) ──`);

  const { data: pr } = await reg
    .from('project_registry')
    .select('property_id, project_id')
    .eq('project_id', job.registryProjectId)
    .maybeSingle();
  if (!pr?.property_id) {
    console.error(`  Skip: project_registry row missing for ${job.registryProjectId}`);
    return { skipped: true };
  }

  if (await productionHasRequirements(job.prodDealNumber)) {
    console.log(`  Skip: Production already has requirements for ${job.prodDealNumber}`);
    return { skipped: true, reason: 'production_exists' };
  }

  const { path, boxMeta, format } = await resolveSourceFile(job, token);
  const extracted = extractWorkbook(path, format);
  console.log(
    `  Parsed ${extracted.line_count} lines (${extracted.format}) from ${basename(path)}`,
  );
  if (!extracted.lines?.length) {
    console.error('  Skip: zero lines extracted');
    return { skipped: true };
  }

  writeFileSync(
    resolve(CACHE_DIR, `${job.registryProjectId}-extract.json`),
    JSON.stringify({ boxMeta, extracted }, null, 2),
  );

  const unitTypes = await fetchAllUnitTypes(pr.property_id);
  if (!unitTypes.length) {
    console.error('  Skip: no property_unit_types on property');
    return { skipped: true };
  }

  const totalUnits =
    unitTypes.reduce((s, ut) => s + (Number(ut.unit_count) || 0), 0) ||
    unitTypes.length;

  const rows = buildSkuRows({
    lines: extracted.lines,
    unitTypes,
    totalUnits,
    propertyId: pr.property_id,
    job,
    boxMeta,
    extracted,
  });

  const removed = await deletePriorPhantoms(pr.property_id, job);
  console.log(`  Prior ph_csl_workbook rows removed: ${removed}`);
  console.log(`  Upsert rows: ${rows.length} (${DRY ? 'dry-run' : 'apply'})`);

  const written = await upsertRows(rows);
  const skuDistinct = new Set(rows.map((r) => r.sku)).size;
  console.log(`  Done: ${written} rows, ${skuDistinct} distinct SKUs, ${unitTypes.length} unit types`);

  return {
    skipped: false,
    lines: extracted.line_count,
    rows: rows.length,
    skus: skuDistinct,
    sample: rows.slice(0, 3).map((r) => ({
      sku: r.sku,
      qty_per_unit: r.qty_per_unit,
      unit_type_id: r.unit_type_id,
      room_label: r.room_label,
    })),
  };
}

async function main() {
  console.log(DRY ? 'DRY RUN — pass --apply to write' : 'APPLY — writing ph_csl_workbook rows');
  const jobs = listJobs(ONLY);
  if (!jobs.length) {
    console.error('No jobs matched --only filter');
    process.exit(1);
  }

  const token = LOCAL ? null : await getBoxAccessToken();
  const results = [];
  for (const job of jobs) {
    try {
      results.push({ job: job.registryProjectId, ...(await runJob(job, token)) });
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
      results.push({ job: job.registryProjectId, error: e.message });
    }
  }

  console.log('\nSummary:', JSON.stringify(results, null, 2));
  if (results.some((r) => r.error)) process.exit(1);
}

main();
