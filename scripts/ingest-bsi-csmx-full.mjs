#!/usr/bin/env node
/**
 * Full BSI detail pipeline for one millwork job (generic CSMX/BSI).
 *
 * Steps: contract → matrix structure → floors → shop drawings → website enrich
 *
 * Usage:
 *   node scripts/ingest-bsi-csmx-full.mjs --project-id=25322 --dry-run
 *   node scripts/ingest-bsi-csmx-full.mjs --project-id=25322 --apply
 *   node scripts/ingest-bsi-csmx-full.mjs --project-id=25322 --apply --skip=website
 */
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { buildBsiCsmxConfigFromRegistry, writeBsiCsmxConfigFile } from './lib/bsi-csmx-auto-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(ROOT, f) });
  config({ path: resolve(ROOT, '../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');
const PROJECT_ID = process.argv.find((a) => a.startsWith('--project-id='))?.split('=')[1];
const SKIP = new Set(
  (process.argv.find((a) => a.startsWith('--skip='))?.split('=')[1] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);
if (!PROJECT_ID) {
  console.error('Usage: node scripts/ingest-bsi-csmx-full.mjs --project-id=25xxx [--apply] [--skip=website]');
  process.exit(1);
}

const flag = DRY ? '--dry-run' : '--apply';
const report = { project_id: PROJECT_ID, steps: {} };

function runStep(name, cmd) {
  console.log(`\n>>> ${name}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
  report.steps[name] = 'ok';
}

async function main() {
  const sb = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  console.log(`BSI full detail — ${PROJECT_ID} (${DRY ? 'DRY' : 'APPLY'})`);

  try {
    runStep('contract', `node scripts/ingest-bsi-contract.mjs --project-id=${PROJECT_ID} ${flag}`);
  } catch (e) {
    report.steps.contract = String(e.message).slice(0, 200);
    console.error('  contract failed (continuing):', e.message);
  }

  try {
    runStep('structure', `node scripts/ingest-bsi-matrix-structure.mjs --project-id=${PROJECT_ID} ${flag}`);
  } catch (e) {
    report.steps.structure = String(e.message).slice(0, 200);
    throw e;
  }

  try {
    runStep('floors', `node scripts/ingest-bsi-floors.mjs --project-id=${PROJECT_ID} ${flag}`);
  } catch (e) {
    report.steps.floors = String(e.message).slice(0, 200);
    console.error('  floors failed (continuing):', e.message);
  }

    try {
      runStep('shop_drawings', `node scripts/ingest-bsi-shop-drawings.mjs --project-id=${PROJECT_ID} ${flag}`);
    } catch (e) {
      report.steps.shop_drawings = String(e.message).slice(0, 200);
      console.error('  shop drawings failed (continuing):', e.message);
    }

    if (!SKIP.has('skus')) {
      try {
        runStep('skus', `node scripts/ingest-bsi-counts-workbook-skus.mjs --project-id=${PROJECT_ID} ${flag}`);
      } catch (e) {
        report.steps.skus = String(e.message).slice(0, 200);
        console.error('  SKU bridge failed (continuing):', e.message);
      }
    }

    if (!SKIP.has('website')) {
    const { cfg } = await buildBsiCsmxConfigFromRegistry(sb, PROJECT_ID);
    if (!cfg.website.leasing_url) {
      report.steps.website = 'skipped — no property_url';
      console.log('\n>>> website — SKIPPED (no property_url on property_registry)');
    } else {
      const configRel = writeBsiCsmxConfigFile(PROJECT_ID, cfg);
      try {
        runStep('website', `node scripts/enrich-bsi-csmx-website.mjs --config=${configRel} ${flag}`);
      } catch (e) {
        report.steps.website = String(e.message).slice(0, 200);
        console.error('  website failed (continuing):', e.message);
      }
    }
  }

  mkdirSync(resolve(ROOT, '.firecrawl'), { recursive: true });
  const out = resolve(ROOT, `.firecrawl/${PROJECT_ID}-full-detail-report.json`);
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), dry: DRY, ...report }, null, 2));
  console.log(`\nReport: ${out}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
