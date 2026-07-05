#!/usr/bin/env node
/**
 * Batch BSI-CSMX ingest across all Box millwork jobs.
 *
 * Phases (in order):
 *   1. contract — parse subcontract + SCHEDULE_MTO → milestones + pacing
 *   2. structure — generic matrix → unit types + units (when matrix xlsx exists)
 *   3. full — property-specific orchestrator when scripts/config/<job>.json exists
 *
 * Usage:
 *   node scripts/batch-ingest-bsi-csmx.mjs --dry-run
 *   node scripts/batch-ingest-bsi-csmx.mjs --apply
 *   node scripts/batch-ingest-bsi-csmx.mjs --apply --only=contract
 *   node scripts/batch-ingest-bsi-csmx.mjs --apply --band=25001-25026
 *   node scripts/batch-ingest-bsi-csmx.mjs --apply --skip=25019,25048
 */
import { execSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadLocalBoxFolders } from './lib/box-project-browser.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DRY = !process.argv.includes('--apply');
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1] || 'all';
const BAND = process.argv.find((a) => a.startsWith('--band='))?.split('=')[1];
const SKIP = new Set(
  process.argv
    .find((a) => a.startsWith('--skip='))
    ?.split('=')[1]
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) || [],
);

const FULL_CONFIGS = {
  '25019': 'scripts/config/troubadour-lubbock-bsi-csmx.json',
};

function parseBand(band) {
  const m = band.match(/^(\d{5})-(\d{5})$/);
  if (!m) throw new Error(`Invalid --band=${band}`);
  return { min: parseInt(m[1], 10), max: parseInt(m[2], 10) };
}

function run(label, cmd) {
  console.log(`\n>>> ${label}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

function shouldRun(phase) {
  if (ONLY === 'all') return true;
  return ONLY.split(',').map((s) => s.trim()).includes(phase);
}

function filterJobs(jobs) {
  let list = jobs.filter((j) => !SKIP.has(j.project_id));
  if (BAND) {
    const { min, max } = parseBand(BAND);
    list = list.filter((j) => {
      const n = parseInt(j.project_id, 10);
      return n >= min && n <= max;
    });
  }
  return list;
}

function main() {
  const jobs = filterJobs(loadLocalBoxFolders());
  const flag = DRY ? '--dry-run' : '--apply';
  const report = [];

  console.log(`BSI batch ingest — ${jobs.length} jobs (${DRY ? 'DRY' : 'APPLY'}) only=${ONLY}`);
  if (SKIP.size) console.log(`  skip: ${[...SKIP].join(', ')}`);
  if (BAND) console.log(`  band: ${BAND}`);

  for (const job of jobs) {
    console.log(`\n${'='.repeat(60)}\n${job.project_id} — ${job.folder}`);
    const row = { project_id: job.project_id, folder: job.folder, contract: null, structure: null, full: null };

    if (shouldRun('contract')) {
      try {
        run('contract', `node scripts/ingest-bsi-contract.mjs --project-id=${job.project_id} ${flag}`);
        row.contract = 'ok';
      } catch (e) {
        row.contract = `err: ${e.message?.slice(0, 120)}`;
        console.error(`  contract failed: ${e.message}`);
      }
    }

    if (shouldRun('structure') || shouldRun('all')) {
      if (ONLY === 'contract') {
        /* skip */
      } else {
        try {
          run('structure', `node scripts/ingest-bsi-matrix-structure.mjs --project-id=${job.project_id} ${flag}`);
          row.structure = 'ok';
        } catch (e) {
          row.structure = `err: ${e.message?.slice(0, 120)}`;
          console.error(`  structure failed: ${e.message}`);
        }
      }
    }

    const cfg = FULL_CONFIGS[job.project_id];
    if (cfg && existsSync(resolve(ROOT, cfg)) && (shouldRun('full') || shouldRun('all')) && ONLY !== 'contract' && ONLY !== 'structure') {
      try {
        run('full orchestrator', `node scripts/ingest-bsi-csmx-property.mjs --config=${cfg} ${flag}`);
        row.full = 'ok';
      } catch (e) {
        row.full = `err: ${e.message?.slice(0, 120)}`;
      }
    }

    report.push(row);
  }

  mkdirSync(resolve(ROOT, '.firecrawl'), { recursive: true });
  const out = resolve(ROOT, '.firecrawl/bsi-batch-ingest-report.json');
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), dry: DRY, only: ONLY, jobs: report }, null, 2));
  console.log(`\nReport: ${out}`);
}

main();
