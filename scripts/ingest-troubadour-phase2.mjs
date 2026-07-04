#!/usr/bin/env node
/**
 * Troubadour phase 2:
 *   - Create/enrich project_registry 25199 (Overage factory order)
 *   - Dedupe duplicate Teinert GC property_stakeholders
 *
 * Usage:
 *   node scripts/ingest-troubadour-phase2.mjs --dry-run
 *   node scripts/ingest-troubadour-phase2.mjs --apply
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

const PROPERTY_ID = '095960e3-5b22-4a0c-9528-e3843fed3ede';
const PARENT_25019 = '65fa6c13-4596-464f-ae39-5979c0984317';
const MAIN_25198 = 'bb23dbce-bf26-4c71-af4f-55e2c110db26';
const PROJECT_ID_25199 = '25199';
const CHAIN_PROJECT_NAME = '25199- Lubbock, TX - Troubador 14th St. Overage';
const BOX_REL = '25019-Lubbock, TX - 14th Street SH';
const SITE_ADDRESS = '2413 14th St, Lubbock, TX 79401';

const PROJECT_DOCS = [
  {
    name: 'Sanyang PI Contract — Overage 25199',
    type: 'factory_contract',
    box_path: 'PROJECT MANAGING/VENDOR QUOTES-CI-PL-LD/Sanyang/PI-CONTRACT-25199- Lubbock, TX - Troubador 14th St. Overage-SY.pdf',
  },
  {
    name: 'Sanyang Overage workbook',
    type: 'factory_quote',
    box_path: 'PROJECT MANAGING/VENDOR QUOTES-CI-PL-LD/Sanyang/25199- Lubbock, TX - Troubador 14th St. Overage-SY.xlsx',
  },
  {
    name: 'Factory cabinet drawings — Main 25198/25199 FINAL',
    type: 'shop_drawing',
    box_path:
      'PROJECT MANAGING/SHOP DRAWINGS/Cabinets/Factory sds/25198-25199 Lubbock TX - Troubador - Main Cabinet - Final Drawings-5-14-26 FINAL.pdf',
  },
];

function mergeDocs(existing, additions) {
  const byKey = new Map((Array.isArray(existing) ? existing : []).map((d) => [`${d.type}|${d.name}`, d]));
  for (const doc of additions) {
    const key = `${doc.type}|${doc.name}`;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      name: doc.name,
      type: doc.type,
      storage: 'box',
      box_path: `${BOX_REL}/${doc.box_path}`,
    });
  }
  return [...byKey.values()];
}

async function main() {
  const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
  const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;
  const chainUrl = process.env.CHAIN_IQ_SUPABASE_URL;
  const chainKey = process.env.CHAIN_IQ_SUPABASE_SERVICE_ROLE_KEY;
  if (!regUrl || !regKey) {
    console.error('Missing REGISTRY_IQ credentials');
    process.exit(1);
  }

  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });
  const chain = chainUrl && chainKey ? createClient(chainUrl, chainKey, { auth: { persistSession: false } }) : null;

  console.log(`Troubadour phase 2 (${DRY ? 'DRY-RUN' : 'APPLY'})`);

  // ── Project 25199 ───────────────────────────────────────────────────
  const { data: existing25199 } = await reg
    .from('project_registry')
    .select('id, external_ids, documents')
    .eq('project_id', PROJECT_ID_25199)
    .maybeSingle();

  let chainTotal = 0;
  let chainUnlinked = 0;
  if (chain) {
    const { count: total } = await chain
      .from('container_loads')
      .select('*', { count: 'exact', head: true })
      .ilike('project_name', '%25199%');
    const { count: unlinked } = await chain
      .from('container_loads')
      .select('*', { count: 'exact', head: true })
      .ilike('project_name', '%25199%')
      .is('project_registry_id', null);
    chainTotal = total ?? 0;
    chainUnlinked = unlinked ?? 0;
  }

  const payload25199 = {
    project_id: PROJECT_ID_25199,
    project_name: CHAIN_PROJECT_NAME,
    brand: 'BSI',
    division: 'BSI',
    property_id: PROPERTY_ID,
    parent_project_registry_id: MAIN_25198,
    project_sub_type: 'overage',
    project_status: 'active',
    project_type: 'new_dev',
    product_scope: 'Millwork (cabinets)',
    product_sub_scope: 'Factory overage order — Sanyang',
    fulfillment_mode: 'dropship',
    site_address: SITE_ADDRESS,
    warehouse_address: 'GARLAND, TX 75041',
    delivery_year: 2026,
    notes:
      'BSI factory Overage PO 25199 for Troubadour 14th St Lubbock. Sibling to Main Order 25198 under parent job 25019.',
    documents: mergeDocs(existing25199?.documents, PROJECT_DOCS),
    external_ids: {
      ...(typeof existing25199?.external_ids === 'object' && existing25199.external_ids ? existing25199.external_ids : {}),
      bsi_job_id: '25199',
      parent_bsi_job_id: '25019',
      parent_main_order_id: '25198',
      parent_project_registry_id: MAIN_25198,
      parent_base_project_registry_id: PARENT_25019,
      netsuite_brand: 'BSI',
      netsuite_project_id: '25199',
      factory_vendor: 'Sanyang',
      factory_po: '25199',
      registry_property_id: PROPERTY_ID,
      box_project_folder: BOX_REL,
      chain_iq_project_name: CHAIN_PROJECT_NAME,
      troubadour_phase2_synced_at: new Date().toISOString(),
    },
  };

  let project25199Id = existing25199?.id;
  if (existing25199?.id) {
    if (!DRY) {
      const { error } = await reg.from('project_registry').update(payload25199).eq('id', existing25199.id);
      if (error) throw new Error(`25199 update: ${error.message}`);
    }
    console.log(`  project 25199: updated ${existing25199.id}`);
  } else if (DRY) {
    console.log('  project 25199: would create');
    project25199Id = 'dry-run-25199';
  } else {
    const { data: ins, error } = await reg.from('project_registry').insert(payload25199).select('id').single();
    if (error) throw new Error(`25199 insert: ${error.message}`);
    project25199Id = ins.id;
    console.log(`  project 25199: created ${project25199Id}`);
  }

  if (chain && project25199Id && !String(project25199Id).startsWith('dry-run')) {
    const { data: unlinked } = await chain
      .from('container_loads')
      .select('id')
      .ilike('project_name', '%25199%')
      .is('project_registry_id', null);
    console.log(`  chain-iQ 25199: ${chainTotal} total, ${unlinked?.length ?? 0} to link`);
    if (!DRY && unlinked?.length) {
      const ids = unlinked.map((r) => r.id);
      const { error } = await chain
        .from('container_loads')
        .update({ project_registry_id: project25199Id, property_registry_id: PROPERTY_ID })
        .in('id', ids);
      if (error) throw new Error(error.message);
    }
    if (!DRY) {
      const { data: prj } = await reg.from('project_registry').select('external_ids').eq('id', project25199Id).single();
      await reg
        .from('project_registry')
        .update({
          external_ids: {
            ...(prj?.external_ids || {}),
            chain_iq: {
              project_name: CHAIN_PROJECT_NAME,
              container_loads_total: chainTotal,
              container_loads_linked: chainTotal,
              project_registry_id: project25199Id,
              property_id: PROPERTY_ID,
              synced_at: new Date().toISOString(),
            },
          },
        })
        .eq('id', project25199Id);
    }
  }

  // Patch 25198 external_ids to reference 25199
  if (!DRY && project25199Id && !String(project25199Id).startsWith('dry-run')) {
    const { data: p25198 } = await reg.from('project_registry').select('external_ids').eq('id', MAIN_25198).single();
    await reg
      .from('project_registry')
      .update({
        external_ids: {
          ...(p25198?.external_ids || {}),
          related_factory_orders: ['25199'],
          overage_project_registry_id: project25199Id,
        },
      })
      .eq('id', MAIN_25198);
  }

  // ── Dedupe Teinert GC stakeholders ──────────────────────────────────
  const { data: gcRows, error: gcErr } = await reg
    .from('property_stakeholders')
    .select('id, stakeholder_id, stakeholder_name, role, is_primary, created_at, notes')
    .eq('property_id', PROPERTY_ID)
    .eq('role', 'gc')
    .ilike('company_name', '%Teinert%');
  if (gcErr) throw new Error(gcErr.message);

  console.log(`  GC Teinert rows before dedupe: ${gcRows?.length ?? 0}`);
  if (gcRows && gcRows.length > 1) {
    const sorted = [...gcRows].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const keep = sorted[0];
    const remove = sorted.slice(1);
    console.log(`  keeping ${keep.id.slice(0, 8)}… (created ${keep.created_at}), removing ${remove.length}`);
    if (!DRY) {
      const { error } = await reg
        .from('property_stakeholders')
        .delete()
        .in(
          'id',
          remove.map((r) => r.id),
        );
      if (error) throw new Error(`dedupe delete: ${error.message}`);
    }
  }

  console.log('Done.');
  if (project25199Id && !String(project25199Id).startsWith('dry-run')) {
    console.log(`  Project 25199 id: ${project25199Id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
