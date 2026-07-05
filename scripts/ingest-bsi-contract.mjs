#!/usr/bin/env node
/**
 * Ingest BSI subcontract + supplemental schedules → project_milestones + pacing.
 *
 * Sources (merged by priority):
 *   1. Contract Received / Subcontract Agreement PDF(s)
 *   2. SCHEDULE_MTO.xlsx (shop drawings)
 *   3. GC Values Workbook xlsx (Install Sub Contract Workbook)
 *   4. GC Master / Full / Lookahead schedule PDFs
 *
 * Usage:
 *   node scripts/ingest-bsi-contract.mjs --project-id=25001 --apply
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getBoxAccessToken, downloadBoxFile } from './lib/box-api-download.mjs';
import {
  loadLocalBoxFolders,
  findProjectFolder,
  findAllContractPdfs,
  findScheduleMtoXlsx,
  findGcValuesWorkbook,
  findSupplementalSchedulePdfs,
} from './lib/box-project-browser.mjs';
import {
  pdfToText,
  parseContractText,
  parseGcScheduleText,
  parseScheduleMtoViaPython,
  parseGcValuesWorkbookViaPython,
  mergeMilestones,
  mergeParsedMeta,
  mergePacing,
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
    };
  }
  if (!PROJECT_ID) throw new Error('Provide --project-id=25xxx or --config=...');
  const box = loadLocalBoxFolders().find((b) => b.project_id === PROJECT_ID);
  if (!box) throw new Error(`No local Box folder for project ${PROJECT_ID}`);
  return { project_id: PROJECT_ID, folder_name: box.folder };
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
    .select(
      'id,project_id,project_name,property_id,external_ids,documents,schedule_year,install_start_date,estimated_completion_date',
    )
    .eq('project_id', job.project_id)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!project) throw new Error(`No project_registry row for ${job.project_id}`);

  console.log(`BSI contract ingest — ${job.project_id} ${project.project_name} (${DRY ? 'DRY' : 'APPLY'})`);

  const token = await getBoxAccessToken();
  const folder = await findProjectFolder(token, job.folder_name);
  if (!folder) throw new Error(`Box folder not found: ${job.folder_name}`);

  const cacheDir = resolve(ROOT, '.firecrawl/contracts');
  mkdirSync(cacheDir, { recursive: true });

  const sources = { contracts: [], schedule_mto: null, gc_workbook: null, gc_schedules: [] };
  const milestoneGroups = [];
  const metaGroups = [];
  const pacingGroups = [];
  let trucks = [];

  const contractFiles = await findAllContractPdfs(token, folder.id, 3);
  if (!contractFiles.length) console.warn('  No subcontract PDF found');
  for (const cf of contractFiles) {
    const pdfPath = resolve(cacheDir, `${job.project_id}-contract-${cf.id}.pdf`);
    await downloadBoxFile(token, cf.id, pdfPath);
    console.log(`  Contract PDF: ${cf.name}`);
    sources.contracts.push({ name: cf.name, box_file_id: cf.id });
    const text = pdfToText(pdfPath);
    writeFileSync(resolve(cacheDir, `${job.project_id}-contract-${cf.id}.txt`), text);
    const parsed = parseContractText(text);
    milestoneGroups.push(parsed.milestones);
    metaGroups.push(parsed.meta);
    pacingGroups.push(parsed.pacing);
  }

  const mtoFile = await findScheduleMtoXlsx(token, folder.id);
  if (mtoFile) {
    const mtoPath = resolve(cacheDir, `${job.project_id}-schedule-mto.xlsx`);
    await downloadBoxFile(token, mtoFile.id, mtoPath);
    console.log(`  SCHEDULE_MTO: ${mtoFile.name}`);
    sources.schedule_mto = mtoFile.name;
    const mto = parseScheduleMtoViaPython(mtoPath);
    trucks = mto.trucks;
    milestoneGroups.push(mto.milestones);
  }

  const gcWb = await findGcValuesWorkbook(token, folder.id);
  if (gcWb) {
    const wbPath = resolve(cacheDir, `${job.project_id}-gc-values.xlsx`);
    await downloadBoxFile(token, gcWb.id, wbPath);
    console.log(`  GC Values Workbook: ${gcWb.name}`);
    sources.gc_workbook = gcWb.name;
    try {
      milestoneGroups.push(parseGcValuesWorkbookViaPython(wbPath));
    } catch (e) {
      console.warn(`  GC workbook parse skipped: ${e.message}`);
    }
  }

  const schedPdfs = await findSupplementalSchedulePdfs(token, folder.id);
  for (const sf of schedPdfs) {
    const pdfPath = resolve(cacheDir, `${job.project_id}-gc-sched-${sf.id}.pdf`);
    await downloadBoxFile(token, sf.id, pdfPath);
    console.log(`  GC schedule PDF: ${sf.name}`);
    sources.gc_schedules.push(sf.name);
    const text = pdfToText(pdfPath);
    const parsed = parseGcScheduleText(text);
    milestoneGroups.push(parsed.milestones);
    metaGroups.push(parsed.meta);
    pacingGroups.push(parsed.pacing);
  }

  const milestones = mergeMilestones(...milestoneGroups);
  const meta = mergeParsedMeta(...metaGroups);
  const pacing = mergePacing(...pacingGroups);

  console.log(`  Milestones: ${milestones.length}`);
  for (const m of milestones) console.log(`    ${m.milestone_name}: ${m.target_date} (${m.source_field_path})`);

  if (!milestones.length && !contractFiles.length) {
    return { project_id: job.project_id, status: 'no_sources' };
  }

  const dates = milestones.map((m) => m.target_date).filter(Boolean).sort();
  const projectPatch = {
    schedule_year: meta.schedule_year || (dates[0] ? parseInt(dates[0].slice(0, 4), 10) : project.schedule_year) || null,
    install_start_date:
      meta.install_start_date || pacing.work_commence || project.install_start_date || null,
    estimated_completion_date:
      meta.estimated_completion_date || (dates.length ? dates[dates.length - 1] : project.estimated_completion_date) || null,
    external_ids: {
      ...(typeof project.external_ids === 'object' && project.external_ids ? project.external_ids : {}),
      box_project_folder: job.folder_name,
      contract_sources: sources,
      contract_parsed_at: new Date().toISOString(),
      contract_pacing: Object.keys(pacing).length ? pacing : undefined,
      delivery_trucks: trucks.length ? trucks : undefined,
    },
    documents: mergeContractDoc(project.documents, {
      name: sources.contracts[0]?.name || sources.gc_schedules[0] || 'contract sources',
      type: 'subcontract',
      storage: 'box',
      parsed_at: new Date().toISOString(),
      milestone_count: milestones.length,
      sources,
    }),
  };

  if (DRY) return { project_id: job.project_id, milestones: milestones.length, status: 'dry_run' };

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
  const idx = docs.findIndex((d) => d.type === 'subcontract');
  if (idx >= 0) docs[idx] = { ...docs[idx], ...doc };
  else docs.push(doc);
  return docs;
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
