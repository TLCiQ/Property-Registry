#!/usr/bin/env node
/**
 * Ingest BSI subcontract contract → project_milestones + pacing fields on project_registry.
 *
 * Usage:
 *   node scripts/ingest-bsi-contract.mjs --project-id=25001 --apply
 *   node scripts/ingest-bsi-contract.mjs --config=scripts/config/troubadour-lubbock-bsi-csmx.json --apply
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getBoxAccessToken, downloadBoxFile } from './lib/box-api-download.mjs';
import {
  loadLocalBoxFolders,
  findProjectFolder,
  findContractPdf,
  findScheduleMtoXlsx,
} from './lib/box-project-browser.mjs';
import {
  pdfToText,
  parseContractText,
  parseScheduleMtoViaPython,
  mergeMilestones,
} from './lib/bsi-contract-parse.mjs';
import { loadBsiCsmxConfig } from './lib/bsi-csmx-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(ROOT, f) });
  config({ path: resolve(ROOT, '../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');
const PROJECT_ID = process.argv.find((a) => a.startsWith('--project-id='))?.split('=')[1];
const CONFIG_ARG = process.argv.find((a) => a.startsWith('--config='))?.split('=')[1];

async function resolveJob() {
  if (CONFIG_ARG) {
    const cfg = loadBsiCsmxConfig(resolve(ROOT, CONFIG_ARG));
    const folder = cfg.box?.rel || cfg.box?.root?.split('/').pop();
    return {
      project_id: cfg.parent_bsi_job_id || cfg.project_id,
      folder_name: folder,
      property_id: cfg.property_id,
    };
  }
  if (!PROJECT_ID) throw new Error('Provide --project-id=25xxx or --config=...');
  const box = loadLocalBoxFolders().find((b) => b.project_id === PROJECT_ID);
  if (!box) throw new Error(`No local Box folder for project ${PROJECT_ID}`);
  return { project_id: PROJECT_ID, folder_name: box.folder, property_id: null };
}

async function main() {
  const reg = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const job = await resolveJob();
  const { data: project, error: pErr } = await reg
    .from('project_registry')
    .select('id,project_id,project_name,property_id,external_ids,documents,schedule_year,install_start_date,estimated_completion_date')
    .eq('project_id', job.project_id)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!project) throw new Error(`No project_registry row for ${job.project_id}`);

  console.log(`BSI contract ingest — ${job.project_id} ${project.project_name} (${DRY ? 'DRY' : 'APPLY'})`);

  const token = await getBoxAccessToken();
  const folder = await findProjectFolder(token, job.folder_name);
  if (!folder) throw new Error(`Box folder not found: ${job.folder_name}`);

  const contractFile = await findContractPdf(token, folder.id);
  if (!contractFile) {
    console.warn('  No Contract Received PDF found — skipping');
    return { project_id: job.project_id, status: 'no_contract' };
  }

  const cacheDir = resolve(ROOT, '.firecrawl/contracts');
  mkdirSync(cacheDir, { recursive: true });
  const pdfPath = resolve(cacheDir, `${job.project_id}-contract.pdf`);
  await downloadBoxFile(token, contractFile.id, pdfPath);
  console.log(`  Contract: ${contractFile.name}`);

  const text = pdfToText(pdfPath);
  writeFileSync(resolve(cacheDir, `${job.project_id}-contract.txt`), text);
  const parsed = parseContractText(text);

  let mtoMilestones = [];
  let trucks = [];
  const mtoFile = await findScheduleMtoXlsx(token, folder.id);
  if (mtoFile) {
    const mtoPath = resolve(cacheDir, `${job.project_id}-schedule-mto.xlsx`);
    await downloadBoxFile(token, mtoFile.id, mtoPath);
    console.log(`  SCHEDULE_MTO: ${mtoFile.name}`);
    const mto = parseScheduleMtoViaPython(mtoPath);
    trucks = mto.trucks;
    mtoMilestones = mto.milestones;
  }

  const milestones = mergeMilestones(parsed.milestones, mtoMilestones);
  console.log(`  Milestones: ${milestones.length}`);
  for (const m of milestones) console.log(`    ${m.milestone_name}: ${m.target_date} (${m.source_field_path})`);

  const external = {
    ...(typeof project.external_ids === 'object' && project.external_ids ? project.external_ids : {}),
    box_project_folder: job.folder_name,
    contract_pdf: contractFile.name,
    contract_box_file_id: contractFile.id,
    contract_parsed_at: new Date().toISOString(),
    contract_pacing: parsed.pacing,
    delivery_trucks: trucks.length ? trucks : undefined,
  };

  const projectPatch = {
    schedule_year: parsed.meta.schedule_year || project.schedule_year || null,
    install_start_date: parsed.meta.install_start_date || parsed.pacing.work_commence || project.install_start_date || null,
    estimated_completion_date:
      parsed.meta.estimated_completion_date || project.estimated_completion_date || null,
    external_ids: external,
    documents: mergeContractDoc(project.documents, {
      name: contractFile.name,
      type: 'subcontract',
      storage: 'box',
      box_file_id: contractFile.id,
      box_path: `${job.folder_name}/PROJECT MANAGING/CONTRACT DOCUMENTS/${contractFile.name}`,
      parsed_at: new Date().toISOString(),
      milestone_count: milestones.length,
    }),
  };

  if (DRY) {
    console.log('  Would update project_registry + replace contract milestones');
    return { project_id: job.project_id, milestones: milestones.length, status: 'dry_run' };
  }

  const { error: uErr } = await reg.from('project_registry').update(projectPatch).eq('id', project.id);
  if (uErr) throw uErr;

  await reg
    .from('project_milestones')
    .delete()
    .eq('project_id', project.id)
    .in('milestone_category', ['contract', 'delivery', 'install']);

  if (milestones.length) {
    const rows = milestones.map((m) => ({
      project_id: project.id,
      milestone_name: m.milestone_name,
      milestone_category: m.milestone_category,
      target_date: m.target_date,
      status: m.status || 'pending',
      source_field_path: m.source_field_path,
      notes: `Source: ${m.source_field_path}`,
    }));
    const { error: mErr } = await reg.from('project_milestones').insert(rows);
    if (mErr) throw mErr;
  }

  console.log('  Done.');
  return { project_id: job.project_id, milestones: milestones.length, status: 'ok' };
}

function mergeContractDoc(existing, doc) {
  const docs = Array.isArray(existing) ? [...existing] : [];
  const idx = docs.findIndex((d) => d.type === 'subcontract' && d.name === doc.name);
  if (idx >= 0) docs[idx] = { ...docs[idx], ...doc };
  else docs.push(doc);
  return docs;
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
