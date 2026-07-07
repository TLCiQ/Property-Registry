#!/usr/bin/env node
/**
 * Batch Counts Workbook SKU bridge for CSMX Hub jobs with MW*.xls in Box.
 *
 * Usage:
 *   node scripts/batch-ingest-csmx-skus.mjs --dry-run
 *   node scripts/batch-ingest-csmx-skus.mjs --apply
 *   node scripts/batch-ingest-csmx-skus.mjs --apply --jobs=25322,25328
 */
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

// Jobs known to have MW xls in Box (Jul 2026 discovery pass)
const DEFAULT_JOBS = ['25322', '25323', '25325', '25326', '25328', '25331', '25337'];

async function main() {
  const jobs = ONLY_JOBS.size ? [...ONLY_JOBS] : DEFAULT_JOBS;
  console.log(`CSMX SKU batch — ${jobs.length} jobs (${DRY ? 'DRY' : 'APPLY'})`);
  const report = [];

  for (const projectId of jobs) {
    console.log(`\n${'='.repeat(60)}\n${projectId}`);
    const row = { project_id: projectId, status: 'ok', error: null };
    try {
      execSync(`node scripts/ingest-bsi-counts-workbook-skus.mjs --project-id=${projectId} ${flag}`, {
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
  const out = resolve(ROOT, '.firecrawl/csmx-sku-batch-report.json');
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), dry: DRY, jobs: report }, null, 2));
  console.log(`\nBatch report: ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
