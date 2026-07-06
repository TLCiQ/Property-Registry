#!/usr/bin/env node
/**
 * Audit Box contract/schedule sources for BSI jobs with zero milestones.
 * Dry-run parse only — no DB writes.
 */
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getBoxAccessToken } from './lib/box-api-download.mjs';
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
} from './lib/bsi-contract-parse.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(ROOT, f) });
  config({ path: resolve(ROOT, '../Derived State/dale-chat', f), override: true });
}

const ZERO_MS = process.argv
  .find((a) => a.startsWith('--jobs='))
  ?.split('=')[1]
  ?.split(',')
  .map((s) => s.trim()) || [
  '25004', '25006', '25015', '25018', '25020', '25024', '25027',
  '25031', '25036', '25040', '25042', '25045', '25046', '25321',
];

const cacheDir = resolve(ROOT, '.firecrawl/contracts-audit');
mkdirSync(cacheDir, { recursive: true });

async function auditJob(token, job) {
  const out = {
    project_id: job.project_id,
    folder: job.folder,
    sources: { contracts: [], schedule_mto: null, gc_workbook: null, gc_schedules: [] },
    parse_results: [],
    merged_milestones: 0,
    error: null,
  };

  try {
    const folder = await findProjectFolder(token, job.folder);
    if (!folder) {
      out.error = 'box_folder_not_found';
      return out;
    }

    const groups = [];

    const contractFiles = await findAllContractPdfs(token, folder.id, 5);
    for (const cf of contractFiles) {
      out.sources.contracts.push(cf.name);
      try {
        const { downloadBoxFile } = await import('./lib/box-api-download.mjs');
        const pdfPath = resolve(cacheDir, `${job.project_id}-contract-${cf.id}.pdf`);
        await downloadBoxFile(token, cf.id, pdfPath);
        const text = pdfToText(pdfPath);
        writeFileSync(resolve(cacheDir, `${job.project_id}-contract-${cf.id}.txt`), text.slice(0, 50000));
        const parsed = parseContractText(text);
        groups.push(parsed.milestones);
        out.parse_results.push({
          file: cf.name,
          type: 'contract',
          milestones: parsed.milestones.length,
          names: parsed.milestones.map((m) => `${m.milestone_name}=${m.target_date}`),
          text_len: text.length,
          sample: text.slice(0, 400).replace(/\s+/g, ' '),
        });
      } catch (e) {
        out.parse_results.push({ file: cf.name, type: 'contract', error: e.message });
      }
    }

    const mto = await findScheduleMtoXlsx(token, folder.id);
    if (mto) {
      out.sources.schedule_mto = mto.name;
      try {
        const { downloadBoxFile } = await import('./lib/box-api-download.mjs');
        const mtoPath = resolve(cacheDir, `${job.project_id}-mto.xlsx`);
        await downloadBoxFile(token, mto.id, mtoPath);
        const parsed = parseScheduleMtoViaPython(mtoPath);
        groups.push(parsed.milestones);
        out.parse_results.push({
          file: mto.name,
          type: 'schedule_mto',
          milestones: parsed.milestones.length,
          trucks: parsed.trucks.length,
        });
      } catch (e) {
        out.parse_results.push({ file: mto.name, type: 'schedule_mto', error: e.message });
      }
    }

    const gcWb = await findGcValuesWorkbook(token, folder.id);
    if (gcWb) {
      out.sources.gc_workbook = gcWb.name;
      try {
        const { downloadBoxFile } = await import('./lib/box-api-download.mjs');
        const wbPath = resolve(cacheDir, `${job.project_id}-gcwb.xlsx`);
        await downloadBoxFile(token, gcWb.id, wbPath);
        const ms = parseGcValuesWorkbookViaPython(wbPath);
        groups.push(ms);
        out.parse_results.push({ file: gcWb.name, type: 'gc_workbook', milestones: ms.length });
      } catch (e) {
        out.parse_results.push({ file: gcWb.name, type: 'gc_workbook', error: e.message });
      }
    }

    const schedPdfs = await findSupplementalSchedulePdfs(token, folder.id);
    for (const sf of schedPdfs) {
      out.sources.gc_schedules.push(sf.name);
      try {
        const { downloadBoxFile } = await import('./lib/box-api-download.mjs');
        const pdfPath = resolve(cacheDir, `${job.project_id}-gc-${sf.id}.pdf`);
        await downloadBoxFile(token, sf.id, pdfPath);
        const text = pdfToText(pdfPath);
        writeFileSync(resolve(cacheDir, `${job.project_id}-gc-${sf.id}.txt`), text.slice(0, 50000));
        const parsed = parseGcScheduleText(text);
        groups.push(parsed.milestones);
        out.parse_results.push({
          file: sf.name,
          type: 'gc_schedule',
          milestones: parsed.milestones.length,
          names: parsed.milestones.map((m) => `${m.milestone_name}=${m.target_date}`),
          text_len: text.length,
          sample: text.slice(0, 400).replace(/\s+/g, ' '),
        });
      } catch (e) {
        out.parse_results.push({ file: sf.name, type: 'gc_schedule', error: e.message });
      }
    }

    out.merged_milestones = mergeMilestones(...groups).length;
  } catch (e) {
    out.error = e.message;
  }
  return out;
}

async function main() {
  const token = await getBoxAccessToken();
  const folders = loadLocalBoxFolders().filter((b) => ZERO_MS.includes(b.project_id));
  const report = [];
  for (const job of folders) {
    console.log(`Auditing ${job.project_id}…`);
    report.push(await auditJob(token, job));
  }
  const missing = ZERO_MS.filter((id) => !folders.some((f) => f.project_id === id));
  const outPath = resolve(ROOT, '.firecrawl/bsi-zero-ms-audit.json');
  writeFileSync(outPath, JSON.stringify({ at: new Date().toISOString(), missing_local_folders: missing, jobs: report }, null, 2));
  console.log(`\nWrote ${outPath}`);
  for (const r of report) {
    console.log(
      `${r.project_id}: contracts=${r.sources.contracts.length} mto=${r.sources.schedule_mto ? 'Y' : 'N'} gc=${r.sources.gc_schedules.length} merged=${r.merged_milestones}${r.error ? ` ERR=${r.error}` : ''}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
