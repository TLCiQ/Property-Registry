#!/usr/bin/env node
/**
 * Repair known BSI Box-band project ↔ property gaps and bogus property rows.
 *
 * Fixes:
 *   - 25321 HUB Boulder → property HUB Boulder
 *   - 25015 Ann Arbor HUB → property HUB ANN ARBOR
 *   - 25315 Madison J+B (Box folder 25015-Madison) → Hub Madison acquisition property
 *   - Deactivate mis-ingested property row (BSI project_id as property)
 *
 * Usage:
 *   node scripts/repair-bsi-csmx-project-property.mjs --dry-run
 *   node scripts/repair-bsi-csmx-project-property.mjs --apply
 */
import { writeFileSync } from 'fs';
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

const DRY = !process.argv.includes('--apply');
const REPORT = resolve(ROOT, '.firecrawl/bsi-csmx-project-property-repair.json');

const REPAIRS = [
  {
    action: 'link_project',
    project_id: '25321',
    property_id: 'd2b6391a-b619-468f-be73-2fb434cff731',
    property_name: 'HUB Boulder',
    patch: {
      project_name: 'HUB Boulder',
      brand: 'BSI',
      division: 'BSI',
      product_scope: 'Millwork (cabinets)',
      external_ids: {
        bsi_job_id: '25321',
        box_project_folder: '25321 - Boulder, CO - HUB',
      },
    },
  },
  {
    action: 'upsert_project',
    project_id: '25015',
    property_id: 'd7aea0dc-a7b1-4bb2-a2fa-20e873ec4621',
    property_name: 'HUB ANN ARBOR',
    payload: {
      project_id: '25015',
      project_name: 'HUB Ann Arbor (25015)',
      brand: 'BSI',
      division: 'BSI',
      property_id: 'd7aea0dc-a7b1-4bb2-a2fa-20e873ec4621',
      project_status: 'active',
      project_type: 'new_dev',
      product_scope: 'Millwork (cabinets)',
      site_address: '333 East William Street, Ann Arbor, MI',
      external_ids: {
        bsi_job_id: '25015',
        box_project_folder: '25015-Ann Arbor, MI - HUB',
        box_collision_note: 'Box shares job prefix 25015 with Madison J+B folder; Madison mapped to project 25315',
      },
    },
  },
  {
    action: 'upsert_project',
    project_id: '25315',
    property_id: 'afe73b66-f042-4d6c-9085-91d5f07f366e',
    property_name: 'Hub Madison, WI - 2024 Acquisition',
    payload: {
      project_id: '25315',
      project_name: 'HUB Madison J+B (25315)',
      brand: 'BSI',
      division: 'BSI',
      property_id: 'afe73b66-f042-4d6c-9085-91d5f07f366e',
      project_status: 'active',
      project_type: 'new_dev',
      product_scope: 'Millwork (cabinets)',
      site_address: 'Madison, WI',
      external_ids: {
        bsi_job_id: '25315',
        box_project_folder: '25015-Madison, WI - HUB - J+B',
        box_job_prefix_collision: '25015',
      },
    },
  },
  {
    action: 'deactivate_property',
    property_id: '14fa14c5-624f-41c2-b68e-c8f7540cc9f1',
    merge_into_property_id: 'd7aea0dc-a7b1-4bb2-a2fa-20e873ec4621',
    reason: 'Mis-ingested BSI project 25316 as property row (Power Construction prefix); RITA flagged dup of HUB ANN ARBOR',
  },
];

async function main() {
  const sb = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const applied = [];
  console.log(`BSI project-property repair (${DRY ? 'DRY-RUN' : 'APPLY'})`);

  for (const repair of REPAIRS) {
    if (repair.action === 'link_project') {
      const { data: existing } = await sb.from('project_registry').select('id,property_id,external_ids').eq('project_id', repair.project_id).maybeSingle();
      if (!existing) {
        console.log(`  SKIP link ${repair.project_id}: project row not found`);
        continue;
      }
      const patch = {
        property_id: repair.property_id,
        ...repair.patch,
        external_ids: { ...(existing.external_ids || {}), ...repair.patch.external_ids },
      };
      console.log(`  ${DRY ? '[DRY]' : 'APPLY'} link ${repair.project_id} → ${repair.property_name}`);
      if (!DRY) {
        const { error } = await sb.from('project_registry').update(patch).eq('id', existing.id);
        if (error) throw new Error(error.message);
      }
      applied.push({ ...repair, mode: 'link' });
      continue;
    }

    if (repair.action === 'upsert_project') {
      const { data: existing } = await sb.from('project_registry').select('id').eq('project_id', repair.project_id).maybeSingle();
      console.log(`  ${DRY ? '[DRY]' : 'APPLY'} upsert project ${repair.project_id} → ${repair.property_name}`);
      if (!DRY) {
        if (existing?.id) {
          const { error } = await sb.from('project_registry').update(repair.payload).eq('id', existing.id);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await sb.from('project_registry').insert(repair.payload);
          if (error) throw new Error(error.message);
        }
      }
      applied.push({ ...repair, mode: existing ? 'update' : 'insert' });
      continue;
    }

    if (repair.action === 'deactivate_property') {
      const { data: prop } = await sb.from('property_registry').select('id,property_name,property_status,external_ids').eq('id', repair.property_id).maybeSingle();
      if (!prop) {
        console.log(`  SKIP deactivate ${repair.property_id}: not found`);
        continue;
      }
      const patch = {
        property_status: 'inactive',
        external_ids: {
          ...(prop.external_ids || {}),
          dedupe_merged_into: repair.merge_into_property_id,
          dedupe_reason: repair.reason,
          dedupe_at: new Date().toISOString(),
        },
      };
      console.log(`  ${DRY ? '[DRY]' : 'APPLY'} deactivate bogus property ${prop.property_name.slice(0, 50)}`);
      if (!DRY) {
        const { error } = await sb.from('property_registry').update(patch).eq('id', repair.property_id);
        if (error) throw new Error(error.message);
      }
      applied.push({ ...repair, mode: 'deactivate' });
    }
  }

  writeFileSync(REPORT, JSON.stringify({ dry_run: DRY, applied, at: new Date().toISOString() }, null, 2));
  console.log(`Report: ${REPORT.replace(`${ROOT}/`, '')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
