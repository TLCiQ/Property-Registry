#!/usr/bin/env node
/**
 * Troubadour phase 3: NetSuite portfolio enrichment + factory PO external_id hygiene.
 *
 * Verified: 25198/25199 are Sanyang factory POs — NOT separate NetSuite jobs.
 * Only 25019 exists in netsuite_jobs_portfolio (job_id 9271).
 *
 * Usage: node scripts/ingest-troubadour-phase3.mjs --dry-run | --apply
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(__dirname, '..', f) });
  config({ path: resolve(__dirname, '../../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');

const PROJECT_25019 = '65fa6c13-4596-464f-ae39-5979c0984317';
const PROJECT_25198 = 'bb23dbce-bf26-4c71-af4f-55e2c110db26';
const PROJECT_25199 = '135d526f-793f-4990-bc44-abe1ef72c3ff';

async function main() {
  const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
  const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;
  const daleUrl = process.env.DALE_DEMAND_SUPABASE_URL;
  const daleKey =
    process.env.DALE_DEMAND_SUPABASE_SERVICE_ROLE_KEY || process.env.DALE_DEMAND_SUPABASE_KEY;
  if (!regUrl || !regKey || !daleUrl || !daleKey) {
    console.error('Missing REGISTRY_IQ or DALE_DEMAND credentials');
    process.exit(1);
  }

  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });
  const dale = createClient(daleUrl, daleKey, { auth: { persistSession: false } });

  console.log(`Troubadour phase 3 — NetSuite (${DRY ? 'DRY-RUN' : 'APPLY'})`);

  const { data: nsRow, error: nsErr } = await dale
    .from('netsuite_jobs_portfolio')
    .select(
      'job_id, project_code, project_name, job_status_name, subsidiary_id, customer_company_name, developer_partner_name, fc_total_revenue_projected, fc_projected_costs, fc_actual_cost, fc_changeorders_amt, snapshot_date',
    )
    .eq('project_code', '25019')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (nsErr) throw new Error(nsErr.message);
  if (!nsRow) throw new Error('No netsuite_jobs_portfolio row for project_code 25019');

  console.log(`  NetSuite job ${nsRow.job_id} (${nsRow.project_name}) snapshot ${nsRow.snapshot_date}`);

  const { data: p25019 } = await reg.from('project_registry').select('external_ids').eq('id', PROJECT_25019).single();
  const ext25019 = {
    ...(p25019?.external_ids || {}),
    netsuite_job_id: nsRow.job_id,
    netsuite_project_id: nsRow.project_code,
    netsuite_job_status_name: nsRow.job_status_name,
    netsuite_subsidiary_id: String(nsRow.subsidiary_id),
    netsuite_customer_name: nsRow.customer_company_name,
    netsuite_developer_name: nsRow.developer_partner_name,
    netsuite_portfolio: {
      snapshot_date: nsRow.snapshot_date,
      fc_total_revenue_projected: nsRow.fc_total_revenue_projected,
      fc_projected_costs: nsRow.fc_projected_costs,
      fc_actual_cost: nsRow.fc_actual_cost,
      fc_changeorders_amt: nsRow.fc_changeorders_amt,
      source: 'dale_demand.netsuite_jobs_portfolio',
      synced_at: new Date().toISOString(),
    },
    troubadour_netsuite_synced_at: new Date().toISOString(),
  };

  const factoryPoBase = {
    netsuite_parent_job_id: nsRow.job_id,
    netsuite_parent_project_code: nsRow.project_code,
    netsuite_record_type: 'factory_po',
    netsuite_job_id: null,
    netsuite_note:
      'BSI factory PO (Sanyang) — not a separate NetSuite job; rolls up to parent job 9271 / project 25019.',
    troubadour_netsuite_synced_at: new Date().toISOString(),
  };

  const { data: p25198 } = await reg.from('project_registry').select('external_ids').eq('id', PROJECT_25198).single();
  const { data: p25199 } = await reg.from('project_registry').select('external_ids').eq('id', PROJECT_25199).single();

  const ext25198 = {
    ...(p25198?.external_ids || {}),
    ...factoryPoBase,
    factory_po: '25198',
    bsi_job_id: '25198',
  };
  delete ext25198.netsuite_project_id;

  const ext25199 = {
    ...(p25199?.external_ids || {}),
    ...factoryPoBase,
    factory_po: '25199',
    bsi_job_id: '25199',
  };
  delete ext25199.netsuite_project_id;

  if (DRY) {
    console.log('  would patch 25019 netsuite_portfolio + clarify 25198/25199 as factory POs');
    return;
  }

  for (const [id, ext] of [
    [PROJECT_25019, ext25019],
    [PROJECT_25198, ext25198],
    [PROJECT_25199, ext25199],
  ]) {
    const { error } = await reg.from('project_registry').update({ external_ids: ext }).eq('id', id);
    if (error) throw new Error(`project ${id}: ${error.message}`);
  }

  console.log('  Updated 25019/25198/25199 external_ids');
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
