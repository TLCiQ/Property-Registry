#!/usr/bin/env node
/**
 * Run full BSI detail pipeline for all CSMX Box millwork jobs (brand=CSMX, 25xxx).
 *
 * Usage:
 *   node scripts/batch-ingest-csmx-full.mjs --dry-run
 *   node scripts/batch-ingest-csmx-full.mjs --apply
 *   node scripts/batch-ingest-csmx-full.mjs --apply --jobs=25322,25323
 */
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(ROOT, f) });
  config({ path: resolve(ROOT, '../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');
const ONLY_JOBS = new Set(
  process.argv
    .find((a) => a.startsWith('--jobs='))
    ?.split('=')[1]
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) || [],
);
const flag = DRY ? '--dry-run' : '--apply';

async function main() {
  const sb = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { data, error } = await sb
    .from('project_registry')
    .select('project_id, project_name, property_id, external_ids')
    .eq('brand', 'CSMX')
    .not('project_id', 'is', null)
    .order('project_id');
  if (error) throw error;

  let jobs = (data || []).filter((p) => /^25\d{3}$/.test(p.project_id) && p.property_id);
  if (ONLY_JOBS.size) jobs = jobs.filter((j) => ONLY_JOBS.has(j.project_id));

  console.log(`CSMX full BSI detail batch — ${jobs.length} jobs (${DRY ? 'DRY' : 'APPLY'})`);
  const report = [];

  for (const job of jobs) {
    console.log(`\n${'='.repeat(70)}\n${job.project_id} — ${job.project_name}`);
    const row = { project_id: job.project_id, project_name: job.project_name, status: 'ok', error: null };
    try {
      execSync(`node scripts/ingest-bsi-csmx-full.mjs --project-id=${job.project_id} ${flag}`, {
        stdio: 'inherit',
        cwd: ROOT,
      });
    } catch (e) {
      row.status = 'error';
      row.error = e.message?.slice(0, 300);
    }
    report.push(row);
  }

  mkdirSync(resolve(ROOT, '.firecrawl'), { recursive: true });
  const out = resolve(ROOT, '.firecrawl/csmx-full-detail-batch-report.json');
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), dry: DRY, jobs: report }, null, 2));
  console.log(`\nBatch report: ${out}`);
  const failed = report.filter((r) => r.status === 'error');
  if (failed.length) {
    console.error(`\n${failed.length} job(s) failed:`, failed.map((f) => f.project_id).join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
