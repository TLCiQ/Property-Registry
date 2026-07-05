#!/usr/bin/env node
/**
 * BSI-CSMX millwork property enrich orchestrator.
 *
 * Runs Box/matrix/registry pipeline steps in order; website Firecrawl enrich is always last.
 *
 * Usage:
 *   node scripts/ingest-bsi-csmx-property.mjs --config=scripts/config/troubadour-lubbock-bsi-csmx.json --dry-run
 *   node scripts/ingest-bsi-csmx-property.mjs --config=scripts/config/troubadour-lubbock-bsi-csmx.json --apply
 *   node scripts/ingest-bsi-csmx-property.mjs --config=... --apply --only=website
 *   node scripts/ingest-bsi-csmx-property.mjs --config=... --apply --from=floors
 */
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadBsiCsmxConfig, scriptPath } from './lib/bsi-csmx-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CONFIG_ARG = process.argv.find((a) => a.startsWith('--config='))?.split('=')[1];
if (!CONFIG_ARG) {
  console.error('Usage: node scripts/ingest-bsi-csmx-property.mjs --config=scripts/config/<property>.json [--apply] [--only=step1,step2] [--from=step]');
  process.exit(1);
}

const DRY = !process.argv.includes('--apply');
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',').map((s) => s.trim()).filter(Boolean);
const FROM = process.argv.find((a) => a.startsWith('--from='))?.split('=')[1]?.trim();
const flag = DRY ? '--dry-run' : '--apply';

const cfg = loadBsiCsmxConfig(resolve(ROOT, CONFIG_ARG));

const STEP_DEFS = [
  {
    id: 'contract',
    label: 'Contract parse (plan dates + pacing milestones)',
    type: 'contract',
  },
  {
    id: 'extract_matrix',
    label: 'Extract Matrix (Python)',
    type: 'python',
    resolve: () => {
      const rel = cfg.matrix?.extract_script;
      return rel ? resolve(ROOT, rel) : null;
    },
  },
  { id: 'core', label: 'Core ingest (property, units, types, shop drawings)', scriptKey: 'core_ingest' },
  { id: 'matrix_drawings', label: 'Matrix room drawings (kitchen/bath PDFs)', scriptKey: 'matrix_drawings' },
  { id: 'bathrooms', label: 'Backfill bathrooms from matrix', scriptKey: 'bathrooms' },
  { id: 'floors', label: 'Buildings + floors from matrix Level', scriptKey: 'floors' },
  {
    id: 'floor_plans',
    label: 'Architectural floor plans (Box → Cloudinary)',
    scriptKey: 'floor_plans',
    extraArgs: () => (cfg.step_flags?.floor_plans_metadata_only ? ['--metadata-only'] : []),
  },
  {
    id: 'skus_phase2',
    label: 'SKU bridge phase 2 (Counts Workbook / factory PO)',
    scriptKey: 'skus_phase2',
    skip: () => cfg.step_flags?.skip_skus,
  },
  {
    id: 'skus_phase3',
    label: 'SKU bridge phase 3 (vanity / NetSuite mirror)',
    scriptKey: 'skus_phase3',
    skip: () => cfg.step_flags?.skip_skus,
  },
  {
    id: 'website',
    label: 'Website enrich (Firecrawl — fills gaps last)',
    type: 'website',
    always: 'scripts/enrich-bsi-csmx-website.mjs',
  },
];

function shouldRun(stepId, orderIndex) {
  if (ONLY?.length) return ONLY.includes(stepId);
  if (FROM) {
    const fromIdx = STEP_DEFS.findIndex((s) => s.id === FROM);
    if (fromIdx < 0) throw new Error(`Unknown --from step: ${FROM}. Valid: ${STEP_DEFS.map((s) => s.id).join(', ')}`);
    return orderIndex >= fromIdx;
  }
  return true;
}

function runNode(label, scriptRel, extraArgs = []) {
  const script = resolve(ROOT, scriptRel);
  if (!existsSync(script)) throw new Error(`Script not found: ${script}`);
  const args = [script, flag, ...extraArgs].join(' ');
  console.log(`\n=== ${label} ===`);
  console.log(`  node ${scriptRel} ${flag}${extraArgs.length ? ` ${extraArgs.join(' ')}` : ''}`);
  execSync(`node ${script} ${flag}${extraArgs.length ? ` ${extraArgs.join(' ')}` : ''}`, {
    stdio: 'inherit',
    cwd: ROOT,
  });
}

function runPython(label, scriptPathAbs) {
  if (!existsSync(scriptPathAbs)) throw new Error(`Script not found: ${scriptPathAbs}`);
  console.log(`\n=== ${label} ===`);
  execSync(`python3 "${scriptPathAbs}"`, { stdio: 'inherit', cwd: ROOT });
}

function main() {
  console.log(`BSI-CSMX property enrich — ${cfg.property_name || cfg.property_key}`);
  console.log(`  Config: ${CONFIG_ARG}`);
  console.log(`  Property: ${cfg.property_id}`);
  console.log(`  Mode: ${DRY ? 'DRY-RUN' : 'APPLY'}`);
  if (ONLY?.length) console.log(`  Only: ${ONLY.join(', ')}`);
  if (FROM) console.log(`  From: ${FROM}`);

  for (let i = 0; i < STEP_DEFS.length; i++) {
    const step = STEP_DEFS[i];
    if (!shouldRun(step.id, i)) continue;
    if (step.skip?.()) {
      console.log(`\n=== ${step.label} — SKIPPED (step_flags) ===`);
      continue;
    }

    if (step.type === 'contract') {
      runNode(step.label, 'scripts/ingest-bsi-contract.mjs', [`--config="${resolve(ROOT, CONFIG_ARG)}"`]);
      continue;
    }

    if (step.type === 'python') {
      const py = step.resolve();
      if (!py) {
        console.log(`\n=== ${step.label} — SKIPPED (no matrix.extract_script) ===`);
        continue;
      }
      runPython(step.label, py);
      continue;
    }

    if (step.type === 'website') {
      console.log(`\n=== ${step.label} ===`);
      const websiteScript = resolve(ROOT, step.always);
      execSync(
        `node "${websiteScript}" --config="${resolve(ROOT, CONFIG_ARG)}" ${flag}`,
        { stdio: 'inherit', cwd: ROOT },
      );
      continue;
    }

    const rel = scriptPath(cfg, step.scriptKey);
    if (!rel) {
      console.log(`\n=== ${step.label} — SKIPPED (not in config.steps.${step.scriptKey}) ===`);
      continue;
    }
    const relFromRoot = rel.replace(`${ROOT}/`, '');
    const extra = step.extraArgs?.() || [];
    runNode(step.label, relFromRoot, extra);
  }

  console.log('\nBSI-CSMX enrich pipeline complete.');
  console.log(`  Admin: https://tlciq-platform.vercel.app/property-registry/${cfg.property_id}`);
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
