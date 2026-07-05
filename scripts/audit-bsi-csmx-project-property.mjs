#!/usr/bin/env node
/**
 * Audit Box BSI millwork jobs (25xxx / 253xx) vs project_registry ↔ property_registry 1:1.
 *
 * Usage:
 *   node scripts/audit-bsi-csmx-project-property.mjs
 *   node scripts/audit-bsi-csmx-project-property.mjs --band=25001-25026
 */
import { readdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(ROOT, f) });
  config({ path: resolve(ROOT, '../Derived State/dale-chat', f), override: true });
}

const BAND = process.argv.find((a) => a.startsWith('--band='))?.split('=')[1] || 'all';
const BOX_ROOT = '/Users/geoffreyjackson/Library/CloudStorage/Box-Box/Team Folder/Projects';
const REPORT = resolve(ROOT, '.firecrawl/bsi-csmx-project-property-audit.json');

/** Full Box folder name → canonical project_id when folder job prefix collides. */
const FOLDER_PROJECT_ALIASES = {
  '25015-Madison, WI - HUB - J+B': '25315',
};

function parseBand(band) {
  if (band === 'all') return null;
  const m = band.match(/^(\d{5})-(\d{5})$/);
  if (!m) throw new Error(`Invalid --band=${band} (use e.g. 25001-25026)`);
  return { min: parseInt(m[1], 10), max: parseInt(m[2], 10) };
}

function loadBoxJobs(bandRange) {
  const folders = readdirSync(BOX_ROOT).filter((n) => /^25\d{3}/.test(n));
  return folders
    .map((folder) => {
      const job = folder.match(/^(25\d{3})/)[1];
      const projectId = FOLDER_PROJECT_ALIASES[folder] || job;
      const jobNum = parseInt(job, 10);
      if (bandRange && (jobNum < bandRange.min || jobNum > bandRange.max)) return null;
      return {
        folder,
        box_job_prefix: job,
        project_id: projectId,
        alias_from: FOLDER_PROJECT_ALIASES[folder] ? job : null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.project_id.localeCompare(b.project_id));
}

async function fetchAll(sb, table, select) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb.from(table).select(select).range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

async function main() {
  const sb = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const bandRange = parseBand(BAND);
  const boxJobs = loadBoxJobs(bandRange);
  const projects = await fetchAll(
    sb,
    'project_registry',
    'id,project_id,project_name,property_id,brand,division,project_status,external_ids,site_address',
  );
  const byProjectId = new Map();
  for (const p of projects) {
    if (!p.project_id) continue;
    if (!byProjectId.has(p.project_id)) byProjectId.set(p.project_id, []);
    byProjectId.get(p.project_id).push(p);
  }

  const rows = [];
  const gaps = [];
  const extras = [];

  for (const box of boxJobs) {
    const matches = byProjectId.get(box.project_id) || [];
    const row = {
      box_folder: box.folder,
      box_job_prefix: box.box_job_prefix,
      project_id: box.project_id,
      project_rows: matches.length,
      project_registry_ids: matches.map((m) => m.id),
      property_id: matches[0]?.property_id || null,
      property_ids: [...new Set(matches.map((m) => m.property_id).filter(Boolean))],
      status:
        matches.length === 0
          ? 'missing_project'
          : matches.length > 1
            ? 'duplicate_project_rows'
            : !matches[0].property_id
              ? 'missing_property'
              : matches.filter((m) => m.property_id).length > 1
                ? 'multiple_properties'
                : 'ok',
    };
    rows.push(row);
    if (row.status !== 'ok') gaps.push(row);
  }

  // Extra project_registry rows for box-band IDs not in Box listing
  const boxProjectIds = new Set(boxJobs.map((b) => b.project_id));
  for (const [pid, arr] of byProjectId) {
    if (!/^25\d{3}$/.test(pid)) continue;
    if (!boxProjectIds.has(pid)) {
      extras.push({ project_id: pid, project_name: arr[0]?.project_name, property_id: arr[0]?.property_id });
    }
  }

  // Mis-ingested BSI projects as properties (archaeology artifact)
  const props = await fetchAll(sb, 'property_registry', 'id,property_name,external_ids,property_status');
  const bogusProps = props.filter(
    (p) => p.external_ids?.bsi_project_id && /^Findorff|Construction\s*:/i.test(p.property_name || ''),
  );

  const summary = {
    band: BAND,
    box_folders: boxJobs.length,
    ok: rows.filter((r) => r.status === 'ok').length,
    gaps: gaps.length,
    extras_in_registry: extras.length,
    bogus_bsi_properties: bogusProps.length,
    generated_at: new Date().toISOString(),
  };

  const report = { summary, rows, gaps, extras, bogus_bsi_properties: bogusProps };
  writeFileSync(REPORT, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(summary, null, 2));
  console.log(`Report: ${REPORT.replace(`${ROOT}/`, '')}`);
  if (gaps.length) {
    console.log('\nGaps:');
    for (const g of gaps) console.log(`  ${g.status} ${g.project_id} (${g.box_folder.slice(0, 50)})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
