#!/usr/bin/env node
/**
 * Morgan Hill project_registry cross-links:
 *   - Chain-iQ container_loads.project_registry_id (remaining unlinked)
 *   - external_ids.chain_iq summary on project_registry
 *   - Architectural / IFC Box document index on project_registry.documents
 *
 * Usage: node scripts/ingest-morganhill-project-links.mjs --dry-run | --apply
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
const PROPERTY_ID = 'a30d446c-ee4a-4fe0-a76e-e4f9bed0e3b0';
const PROJECT_REGISTRY_ID = 'dda5d934-df27-446c-86d2-cdd5851ef8b1';
const BOX_ROOT =
  '/Users/geoffreyjackson/Library/CloudStorage/Box-Box/Team Folder/Projects/25048 - Carrollton, TX - Morgan Hill';
const PROJECT_NAME_PATTERN = '%Morgan Hill%';

const ARCH_DOCS = [
  {
    name: 'IFC Combined Set',
    type: 'architectural_ifc',
    box_path: 'PROJECT MANAGING/SHOP DRAWINGS/DRAWING SET/Drawings & Specs/02. IFC/Combined IFC SET',
  },
  {
    name: 'IFC — Architectural',
    type: 'architectural_ifc',
    box_path: 'PROJECT MANAGING/SHOP DRAWINGS/DRAWING SET/Drawings & Specs/02. IFC/ARCH',
  },
  {
    name: 'IFC — Interior Design',
    type: 'architectural_ifc',
    box_path: 'PROJECT MANAGING/SHOP DRAWINGS/DRAWING SET/Drawings & Specs/02. IFC/INTERIOR DESIGN',
  },
  {
    name: 'IFC — Mechanical',
    type: 'architectural_ifc',
    box_path: 'PROJECT MANAGING/SHOP DRAWINGS/DRAWING SET/Drawings & Specs/02. IFC/MECHANICAL',
  },
  {
    name: 'IFC — Electrical',
    type: 'architectural_ifc',
    box_path: 'PROJECT MANAGING/SHOP DRAWINGS/DRAWING SET/Drawings & Specs/02. IFC/ELECTRICAL',
  },
  {
    name: 'IFC — Plumbing',
    type: 'architectural_ifc',
    box_path: 'PROJECT MANAGING/SHOP DRAWINGS/DRAWING SET/Drawings & Specs/02. IFC/PLUMBING',
  },
  {
    name: 'Site Plan (0-A002 turn sequence)',
    type: 'site_plan',
    box_path: 'PROJECT MANAGING/SHOP DRAWINGS/DRAWING SET/Drawings & Specs/0-A002_SITE PLAN_TURN SEQ..pdf',
    file: true,
  },
  {
    name: 'Stamped Permit Set (06.23.25)',
    type: 'architectural_permit',
    box_path: 'PROJECT MANAGING/SHOP DRAWINGS/DRAWING SET/Drawings & Specs/00. Stamped Permit Set 06.23.25',
  },
];

async function main() {
  const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
  const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;
  const chainUrl = process.env.CHAIN_IQ_SUPABASE_URL;
  const chainKey = process.env.CHAIN_IQ_SUPABASE_SERVICE_ROLE_KEY;
  if (!regUrl || !regKey || !chainUrl || !chainKey) {
    console.error('Missing REGISTRY_IQ_* or CHAIN_IQ_* credentials');
    process.exit(1);
  }

  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });
  const chain = createClient(chainUrl, chainKey, { auth: { persistSession: false } });

  const { data: unlinked, error: uErr } = await chain
    .from('container_loads')
    .select('id, container_number, project_name')
    .ilike('project_name', PROJECT_NAME_PATTERN)
    .is('project_registry_id', null);
  if (uErr) throw new Error(uErr.message);

  const { count: total } = await chain
    .from('container_loads')
    .select('*', { count: 'exact', head: true })
    .ilike('project_name', PROJECT_NAME_PATTERN);
  const { count: linkedBefore } = await chain
    .from('container_loads')
    .select('*', { count: 'exact', head: true })
    .ilike('project_name', PROJECT_NAME_PATTERN)
    .eq('project_registry_id', PROJECT_REGISTRY_ID);

  console.log(`Project links (${DRY ? 'DRY-RUN' : 'APPLY'})`);
  console.log(`  containers total: ${total}, linked: ${linkedBefore}, to link: ${unlinked?.length ?? 0}`);

  if (!DRY && unlinked?.length) {
    const ids = unlinked.map((r) => r.id);
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const { error } = await chain
        .from('container_loads')
        .update({ project_registry_id: PROJECT_REGISTRY_ID })
        .in('id', batch);
      if (error) throw new Error(error.message);
    }
  }

  const { data: prj } = await reg.from('project_registry').select('external_ids, documents').eq('id', PROJECT_REGISTRY_ID).single();
  const externalIds = {
    ...(typeof prj?.external_ids === 'object' && prj.external_ids ? prj.external_ids : {}),
    chain_iq: {
      project_name_pattern: 'Carrolton, TX - Morgan Hill',
      container_loads_total: total,
      container_loads_linked: (linkedBefore ?? 0) + (unlinked?.length ?? 0),
      project_registry_id: PROJECT_REGISTRY_ID,
      property_id: PROPERTY_ID,
      synced_at: new Date().toISOString(),
    },
    registry_property_id: PROPERTY_ID,
  };

  const existingDocs = Array.isArray(prj?.documents) ? prj.documents : [];
  const byKey = new Map(existingDocs.map((d) => [d.type + '|' + d.name, d]));
  for (const doc of ARCH_DOCS) {
    const key = doc.type + '|' + doc.name;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      name: doc.name,
      type: doc.type,
      storage: 'box',
      box_path: `${BOX_ROOT}/${doc.box_path}`.replace(BOX_ROOT + '/', ''),
    });
  }

  if (!DRY) {
    const { error } = await reg
      .from('project_registry')
      .update({ external_ids: externalIds, documents: [...byKey.values()] })
      .eq('id', PROJECT_REGISTRY_ID);
    if (error) throw new Error(error.message);
  }

  console.log(`  project_registry.documents: ${byKey.size} entries`);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
