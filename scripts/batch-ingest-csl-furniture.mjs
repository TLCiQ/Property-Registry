#!/usr/bin/env node
/**
 * Batch CSL fixed/loose FF&E enrichment via TLCiQ-Production → Registry-iQ.
 *
 * Production deal_number often differs from project_registry.project_id (e.g. 26-001 → 26-001-I).
 * This runner resolves property_id from the registry project row and invokes
 * sync-production-to-registry.mjs per mapped pair.
 *
 * Usage:
 *   node scripts/batch-ingest-csl-furniture.mjs --dry-run
 *   node scripts/batch-ingest-csl-furniture.mjs --apply
 *   node scripts/batch-ingest-csl-furniture.mjs --apply --only=26-001,26-003
 */
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

for (const envFile of ['.env.local', '.env']) {
  config({ path: resolve(ROOT, envFile) });
  config({ path: resolve(ROOT, '../Derived State/dale-chat', envFile) });
}

const DRY = !process.argv.includes('--apply');
const ONLY = new Set(
  process.argv
    .find((a) => a.startsWith('--only='))
    ?.split('=')[1]
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) || [],
);

/** prod deal_number → registry project_registry.project_id */
const CSL_FURNITURE_JOBS = [
  { prodDeal: '26-001', registryProjectId: '26-001-I', label: 'Hub Raleigh fixed' },
  { prodDeal: '26-003', registryProjectId: '26-025-I', label: 'Hub Madison fixed' },
  { prodDeal: '26-008', registryProjectId: '26-008', label: 'Ann Arbor loose' },
  { prodDeal: '26-009', registryProjectId: '26-009-I', label: 'Ann Arbor fixed' },
];

const reg = createClient(
  process.env.REGISTRY_IQ_SUPABASE_URL,
  process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const prod = createClient(
  process.env.PRODUCTION_SUPABASE_URL,
  process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

function runSync(prodDeal, propertyId) {
  const flag = DRY ? '--dry-run' : '';
  execSync(
    `node scripts/sync-production-to-registry.mjs --deal=${prodDeal} --property=${propertyId} ${flag}`.trim(),
    { stdio: 'inherit', cwd: ROOT },
  );
}

async function stampExternalIds(registryProjectId, prodDealId, prodDealUuid) {
  if (DRY) return;
  const { data: row } = await reg
    .from('project_registry')
    .select('external_ids')
    .eq('project_id', registryProjectId)
    .maybeSingle();
  const external_ids = {
    ...(row?.external_ids || {}),
    tlciq_deal_number: prodDealId,
    tlciq_deal_id: prodDealUuid,
    tlciq_production_synced_at: new Date().toISOString(),
  };
  await reg.from('project_registry').update({ external_ids }).eq('project_id', registryProjectId);
}

async function main() {
  console.log(`CSL furniture Production sync (${DRY ? 'DRY RUN' : 'LIVE'})\n`);

  let jobs = CSL_FURNITURE_JOBS;
  if (ONLY.size) jobs = jobs.filter((j) => ONLY.has(j.prodDeal) || ONLY.has(j.registryProjectId));

  for (const job of jobs) {
    const { data: proj } = await reg
      .from('project_registry')
      .select('project_id, project_name, property_id')
      .eq('project_id', job.registryProjectId)
      .maybeSingle();

    if (!proj?.property_id) {
      console.warn(`SKIP ${job.prodDeal}: no registry row ${job.registryProjectId} or missing property_id`);
      continue;
    }

    const { data: deal } = await prod
      .from('deals')
      .select('id, deal_number, project_name')
      .eq('deal_number', job.prodDeal)
      .maybeSingle();

    if (!deal) {
      console.warn(`SKIP ${job.prodDeal}: not found in Production`);
      continue;
    }

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`${job.label}: ${job.prodDeal} → ${job.registryProjectId} (${proj.project_name})`);
    console.log(`${'─'.repeat(60)}`);

    runSync(job.prodDeal, proj.property_id);
    await stampExternalIds(job.registryProjectId, job.prodDeal, deal.id);
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
