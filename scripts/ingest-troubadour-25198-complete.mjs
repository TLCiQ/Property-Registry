#!/usr/bin/env node
/**
 * Troubadour Lubbock (25198 Main Order) — full property + project registry enrichment.
 *
 * Same physical site as BSI job 25019 / property 14th Street SH.
 * 25198 = Sanyang factory Main Order (cabinet production) linked via Chain-iQ.
 *
 * Usage:
 *   node scripts/ingest-troubadour-25198-complete.mjs --dry-run
 *   node scripts/ingest-troubadour-25198-complete.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(__dirname, '..', f) });
  config({ path: resolve(__dirname, '../../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');

const PROPERTY_ID = '095960e3-5b22-4a0c-9528-e3843fed3ede';
const PARENT_PROJECT_ID = '65fa6c13-4596-464f-ae39-5979c0984317'; // 25019
const PROJECT_ID_25198 = '25198';
const CHAIN_PROJECT_NAME = '25198- Lubbock, TX - Troubador 14th St. Main Order';

const BOX_ROOT =
  '/Users/geoffreyjackson/Library/CloudStorage/Box-Box/Team Folder/Projects/25019-Lubbock, TX - 14th Street SH';
const BOX_REL = '25019-Lubbock, TX - 14th Street SH';
const MATRIX_JSON = resolve(__dirname, '..', '.firecrawl', 'troubadour-matrix.json');

const SITE_ADDRESS = '2413 14th St, Lubbock, TX 79401';

const PROJECT_DOCS = [
  {
    name: 'Sanyang PI Contract — Main Order 25198',
    type: 'factory_contract',
    box_path: 'PROJECT MANAGING/VENDOR QUOTES-CI-PL-LD/Sanyang/PI-CONTRACT-25198- Lubbock, TX - Troubador 14th St. Main  Order-SY.pdf',
  },
  {
    name: 'Factory cabinet drawings — Main 25198/25199 FINAL',
    type: 'shop_drawing',
    box_path:
      'PROJECT MANAGING/SHOP DRAWINGS/Cabinets/Factory sds/25198-25199 Lubbock TX - Troubador - Main Cabinet - Final Drawings-5-14-26 FINAL.pdf',
  },
  {
    name: 'Cabinet drawing set FINAL 5.19.26',
    type: 'shop_drawing',
    box_path: "PROJECT MANAGING/SHOP DRAWINGS/Cabinets/Lubbock TX - '26 14th Street SH - Drawing Set - 5.19.26_FINAL SET.pdf",
  },
  {
    name: 'Unit & Shop Drawing Matrix',
    type: 'matrix',
    box_path: 'PROJECT MANAGING/SHOP DRAWINGS/Unit & Shop Drawing Matrix Troubadour.xlsx',
  },
  {
    name: 'Construction phasing areas',
    type: 'site_plan',
    box_path: 'PROJECT MANAGING/SHOP DRAWINGS/Parallel Student Housing - Construction Phasing Areas 2-26-2026_01.pdf',
  },
  {
    name: 'BSI Transmittal — 14th St Lubbock',
    type: 'transmittal',
    box_path: 'BSI Transmittal_14th ST_Lubbock, TX.docx',
  },
];

const PARENT_PROJECT_DOCS = [
  {
    name: 'Budget and SOV',
    type: 'accounting',
    box_path: 'PROJECT MANAGING/ACCOUNTING/Lubbock, TX - 14th Street SH Budget and SOV.pdf',
  },
  {
    name: 'Cabinet shop drawing package 7.23.25',
    type: 'shop_drawing',
    box_path: 'PROJECT MANAGING/SHOP DRAWINGS/Cabinets/14TH LUBBOCK STUDENT HOUSING_CABINET SHOP DRAWING PACKAGE_7.23.25.pdf',
  },
];

function configureCloudinary() {
  const m = (process.env.CLOUDINARY_URL || '').match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (!m) return false;
  cloudinary.config({ api_key: m[1], api_secret: m[2], cloud_name: m[3] });
  return true;
}

function pngUrl(publicId) {
  return cloudinary.url(publicId, {
    resource_type: 'image',
    format: 'png',
    transformation: [{ page: 1, width: 600, crop: 'fit' }],
  });
}

async function uploadPdf(localPath, publicId) {
  const r = await cloudinary.uploader.upload(localPath, {
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
  });
  return { pdf_url: r.secure_url, pages: r.pages ?? null, png_url: pngUrl(publicId) };
}

function ensureMatrixJson() {
  if (existsSync(MATRIX_JSON)) return;
  execSync(`python3 "${resolve(__dirname, 'extract-troubadour-matrix.py')}"`, { stdio: 'inherit' });
}

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

async function fetchAll(client, table, select, filters = {}) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];
  for (;;) {
    let q = client.from(table).select(select).range(from, from + pageSize - 1);
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
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

  ensureMatrixJson();
  const matrix = JSON.parse(readFileSync(MATRIX_JSON, 'utf8'));
  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });
  const chain = chainUrl && chainKey ? createClient(chainUrl, chainKey, { auth: { persistSession: false } }) : null;
  const hasCloudinary = configureCloudinary();

  console.log(`Troubadour 25198 enrichment (${DRY ? 'DRY-RUN' : 'APPLY'})`);
  console.log(`  Matrix: ${matrix.unit_count} units, ${matrix.unit_type_count} types`);

  // ── 1. Property cleanup ───────────────────────────────────────────
  const { data: prop } = await reg.from('property_registry').select('*').eq('id', PROPERTY_ID).single();
  const propExternal = {
    ...(typeof prop?.external_ids === 'object' && prop.external_ids ? prop.external_ids : {}),
    box_project_folder: BOX_REL,
    brand: 'Troubadour',
    parallel_portfolio: true,
    bsi_job_ids: ['25019', '25198', '25199'],
    troubadour_matrix_source: matrix.source,
    troubadour_matrix_synced_at: new Date().toISOString(),
  };

  const propertyPatch = {
    property_name: 'Troubadour — 14th Street SH',
    address_line1: '2413 14th St',
    address_line2: null,
    city: 'Lubbock',
    state_province: 'TX',
    postal_code: '79401',
    country: 'US',
    latitude: 33.5824426,
    longitude: -101.8695213,
    total_units: matrix.unit_count,
    total_buildings: 1,
    brand_name: 'Troubadour',
    developer_name: 'Parallel Group',
    gc_name: 'Teinert Construction',
    architect_name: 'Rhode Partners',
    property_type: 'student_housing',
    last_enrichment_at: new Date().toISOString(),
    external_ids: propExternal,
    enrichment_sources: [
      ...(Array.isArray(prop?.enrichment_sources) ? prop.enrichment_sources : []),
      {
        at: new Date().toISOString(),
        type: 'troubadour_25198_complete',
        fields: [
          { field: 'address', value: SITE_ADDRESS, source: 'Box matrix + BSI project folder' },
          { field: 'total_units', value: String(matrix.unit_count), source: 'Unit & Shop Drawing Matrix Troubadour.xlsx' },
          { field: 'developer', value: 'Parallel Group', source: 'property_stakeholders + Parallel portfolio' },
        ],
        operators: ['box_matrix', 'chain_iq'],
      },
    ],
  };

  if (!DRY) {
    const { error } = await reg.from('property_registry').update(propertyPatch).eq('id', PROPERTY_ID);
    if (error) throw new Error(`property update: ${error.message}`);
  }
  console.log('  property: address + 276 units + Troubadour branding');

  // ── 2. Unit types + units from matrix ───────────────────────────────
  const existingTypes = await fetchAll(reg, 'property_unit_types', 'id, unit_type_name', { property_id: PROPERTY_ID });
  const typeByName = new Map(existingTypes.map((t) => [t.unit_type_name, t]));
  let typesCreated = 0;
  let typesUpdated = 0;

  for (const t of matrix.unit_types) {
    const row = {
      property_id: PROPERTY_ID,
      unit_type_name: t.unit_type_name,
      unit_count: t.unit_count,
      beds_per_unit: t.beds_per_unit,
      standard_bedrooms: t.standard_bedrooms,
      bathrooms: t.bathrooms ?? 0,
      half_baths: 0,
      divider_bedrooms: 0,
      shared_bedrooms: 0,
      pod_bedrooms: 0,
      murphy_bedrooms: 0,
      super_murphy_living_rooms: 0,
      upgrade_tier: 'standard',
      unit_features: [],
      notes: 'Troubadour Matrix ingest 2026-07-04',
    };
    const existing = typeByName.get(t.unit_type_name);
    if (existing) {
      if (!DRY) {
        const { error } = await reg.from('property_unit_types').update(row).eq('id', existing.id);
        if (error) throw new Error(`unit type update ${t.unit_type_name}: ${error.message}`);
      }
      typesUpdated++;
    } else {
      if (!DRY) {
        const { data: ins, error } = await reg.from('property_unit_types').insert(row).select('id').single();
        if (error) throw new Error(`unit type insert ${t.unit_type_name}: ${error.message}`);
        typeByName.set(t.unit_type_name, ins);
      }
      typesCreated++;
    }
  }

  if (!DRY) {
    const refreshed = await fetchAll(reg, 'property_unit_types', 'id, unit_type_name', { property_id: PROPERTY_ID });
    for (const t of refreshed) typeByName.set(t.unit_type_name, t);
  }

  const existingUnits = await fetchAll(reg, 'property_units', 'id, unit_number', { property_id: PROPERTY_ID });
  const unitByNumber = new Map(existingUnits.map((u) => [String(u.unit_number), u]));
  let unitsCreated = 0;
  let unitsUpdated = 0;

  for (const u of matrix.units) {
    const ut = u.unit_type ? typeByName.get(u.unit_type) : null;
    const metadata = {
      source: 'troubadour_matrix',
      level: u.level,
      unit_type: u.unit_type,
      construction_area: u.construction_area,
      thus_opp: u.thus_opp,
      kitchen_cab: u.kitchen_cab,
      drawings: u.drawings,
      phase_no: u.phase_no,
    };
    const patch = {
      property_id: PROPERTY_ID,
      unit_number: String(u.unit_number),
      unit_type_id: ut?.id ?? null,
      construction_area: u.construction_area,
      phase_no: u.phase_no ? Number(u.phase_no) : null,
      metadata,
    };
    const existing = unitByNumber.get(String(u.unit_number));
    if (existing) {
      if (!DRY) {
        const { error } = await reg.from('property_units').update(patch).eq('id', existing.id);
        if (error) throw new Error(`unit update ${u.unit_number}: ${error.message}`);
      }
      unitsUpdated++;
    } else {
      if (!DRY) {
        const { error } = await reg.from('property_units').insert(patch);
        if (error && !error.message.includes('duplicate')) {
          throw new Error(`unit insert ${u.unit_number}: ${error.message}`);
        }
      }
      unitsCreated++;
    }
  }
  console.log(`  unit types: +${typesCreated} created, ${typesUpdated} updated`);
  console.log(`  units: +${unitsCreated} created, ${unitsUpdated} updated`);

  // ── 3. Project 25198 create/update ──────────────────────────────────
  const { data: parentProj } = await reg
    .from('project_registry')
    .select('id, external_ids, documents, project_name')
    .eq('id', PARENT_PROJECT_ID)
    .single();

  let project25198Id;
  const { data: existing25198 } = await reg
    .from('project_registry')
    .select('id, external_ids, documents')
    .eq('project_id', PROJECT_ID_25198)
    .maybeSingle();

  const project25198Payload = {
    project_id: PROJECT_ID_25198,
    project_name: CHAIN_PROJECT_NAME,
    brand: 'BSI',
    division: 'BSI',
    property_id: PROPERTY_ID,
    parent_project_registry_id: PARENT_PROJECT_ID,
    project_sub_type: 'base_order',
    project_status: 'active',
    project_type: 'new_dev',
    product_scope: 'Millwork (cabinets)',
    product_sub_scope: 'Main factory order — Sanyang cabinet production',
    fulfillment_mode: 'dropship',
    total_units: matrix.unit_count,
    site_address: SITE_ADDRESS,
    warehouse_address: 'GARLAND, TX 75041',
    delivery_year: 2026,
    schedule_year: 2026,
    notes:
      'BSI factory Main Order PO 25198 for Troubadour 14th St Lubbock cabinet production. Parent NetSuite/BSI job 25019.',
    documents: mergeDocs(existing25198?.documents, PROJECT_DOCS),
    external_ids: {
      ...(typeof existing25198?.external_ids === 'object' && existing25198.external_ids ? existing25198.external_ids : {}),
      bsi_job_id: '25198',
      parent_bsi_job_id: '25019',
      parent_project_registry_id: PARENT_PROJECT_ID,
      netsuite_brand: 'BSI',
      netsuite_project_id: '25198',
      factory_vendor: 'Sanyang',
      factory_po: '25198',
      chain_iq_project_name: CHAIN_PROJECT_NAME,
      registry_property_id: PROPERTY_ID,
      box_project_folder: BOX_REL,
      troubadour_matrix_synced_at: new Date().toISOString(),
    },
  };

  if (existing25198?.id) {
    project25198Id = existing25198.id;
    if (!DRY) {
      const { error } = await reg.from('project_registry').update(project25198Payload).eq('id', project25198Id);
      if (error) throw new Error(`project 25198 update: ${error.message}`);
    }
    console.log(`  project 25198: updated ${project25198Id}`);
  } else {
    if (DRY) {
      project25198Id = 'dry-run-25198';
      console.log('  project 25198: would create');
    } else {
      const { data: ins, error } = await reg
        .from('project_registry')
        .insert(project25198Payload)
        .select('id')
        .single();
      if (error) throw new Error(`project 25198 insert: ${error.message}`);
      project25198Id = ins.id;
      console.log(`  project 25198: created ${project25198Id}`);
    }
  }

  // ── 4. Enrich parent project 25019 ──────────────────────────────────
  const parentPatch = {
    project_name: '14th Street — Troubadour',
    product_scope: 'Millwork',
    site_address: SITE_ADDRESS,
    fulfillment_mode: 'install',
    total_units: matrix.unit_count,
    documents: mergeDocs(parentProj?.documents, PARENT_PROJECT_DOCS),
    external_ids: {
      ...(typeof parentProj?.external_ids === 'object' && parentProj.external_ids ? parentProj.external_ids : {}),
      registry_property_id: PROPERTY_ID,
      box_project_folder: BOX_REL,
      related_factory_orders: ['25198', '25199'],
      troubadour_matrix_synced_at: new Date().toISOString(),
    },
  };
  if (!DRY) {
    const { error } = await reg.from('project_registry').update(parentPatch).eq('id', PARENT_PROJECT_ID);
    if (error) throw new Error(`parent project update: ${error.message}`);
  }
  console.log('  project 25019: site address + documents enriched');

  // ── 5. Chain-iQ container links ─────────────────────────────────────
  if (chain) {
    const { data: unlinked, error: uErr } = await chain
      .from('container_loads')
      .select('id, container_number, project_name')
      .eq('project_name', CHAIN_PROJECT_NAME)
      .is('project_registry_id', null);
    if (uErr) throw new Error(uErr.message);

    const { count: total } = await chain
      .from('container_loads')
      .select('*', { count: 'exact', head: true })
      .eq('project_name', CHAIN_PROJECT_NAME);

    console.log(`  chain-iQ: ${total} containers, ${unlinked?.length ?? 0} to link`);

    if (!DRY && unlinked?.length && project25198Id && !String(project25198Id).startsWith('dry-run')) {
      const ids = unlinked.map((r) => r.id);
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const { error } = await chain
          .from('container_loads')
          .update({ project_registry_id: project25198Id, property_registry_id: PROPERTY_ID })
          .in('id', batch);
        if (error) throw new Error(error.message);
      }
    }

    if (!DRY && project25198Id && !String(project25198Id).startsWith('dry-run')) {
      const { data: prj } = await reg.from('project_registry').select('external_ids').eq('id', project25198Id).single();
      const ext = {
        ...(typeof prj?.external_ids === 'object' && prj.external_ids ? prj.external_ids : {}),
        chain_iq: {
          project_name: CHAIN_PROJECT_NAME,
          container_loads_total: total,
          container_loads_linked: total,
          project_registry_id: project25198Id,
          property_id: PROPERTY_ID,
          synced_at: new Date().toISOString(),
        },
      };
      await reg.from('project_registry').update({ external_ids: ext }).eq('id', project25198Id);
    }
  } else {
    console.log('  chain-iQ: skipped (no credentials)');
  }

  // ── 6. Shop drawings (MW configs from Factory sds) ─────────────────
  const factoryDir = `${BOX_ROOT}/PROJECT MANAGING/SHOP DRAWINGS/Cabinets/DS PDFs`;
  let shopUploaded = 0;
  let shopIndexed = 0;
  if (existsSync(factoryDir)) {
    const mwFiles = readdirSync(factoryDir).filter((f) => /^MW/i.test(f) && f.endsWith('.pdf'));
    console.log(`  shop drawings: ${mwFiles.length} MW PDFs in DS PDFs`);
    for (const file of mwFiles) {
      const drawingNo = file.replace(/\.pdf$/i, '');
      const localPath = `${factoryDir}/${file}`;
      if (DRY) {
        shopIndexed++;
        continue;
      }
      if (hasCloudinary) {
        try {
          const publicId = `property-registry/${PROPERTY_ID}/shop-drawings/troubadour_${drawingNo.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const up = await uploadPdf(localPath, publicId);
          const { error } = await reg.from('property_shop_drawings').upsert(
            {
              property_id: PROPERTY_ID,
              drawing_no: drawingNo,
              title: `Troubadour cabinet config ${drawingNo}`,
              drawing_type: 'kitchen_cabs',
              version: '2026-05-14',
              state: 'not_started',
              thumbnail_url: up.png_url,
              pdf_url: up.pdf_url,
              page_count: up.pages,
              source_path: `${BOX_REL}/PROJECT MANAGING/SHOP DRAWINGS/Cabinets/DS PDFs/${file}`,
              notes: 'Troubadour 25198 Main Order — DS PDFs MW config',
            },
            { onConflict: 'property_id,drawing_no,version' },
          );
          if (error) console.error(`    shop drawing ${drawingNo}:`, error.message);
          else shopUploaded++;
        } catch (e) {
          console.error(`    upload failed ${drawingNo}:`, e?.message ?? e);
        }
      } else {
        const { error } = await reg.from('property_shop_drawings').upsert(
          {
            property_id: PROPERTY_ID,
            drawing_no: drawingNo,
            title: `Troubadour cabinet config ${drawingNo}`,
            drawing_type: 'kitchen_cabs',
            version: '2026-05-14',
            state: 'not_started',
            source_path: `${BOX_REL}/PROJECT MANAGING/SHOP DRAWINGS/Cabinets/DS PDFs/${file}`,
            notes: 'Box path only (Cloudinary unavailable)',
          },
          { onConflict: 'property_id,drawing_no,version' },
        );
        if (!error) shopIndexed++;
      }
    }
  }
  console.log(`  shop drawings: ${hasCloudinary ? shopUploaded + ' uploaded' : shopIndexed + ' indexed (box only)'}`);

  // ── Summary ─────────────────────────────────────────────────────────
  console.log('\nDone.');
  console.log(`  Property admin: https://tlciq-platform.vercel.app/property-registry/${PROPERTY_ID}`);
  if (project25198Id && !String(project25198Id).startsWith('dry-run')) {
    console.log(`  Project 25198 id: ${project25198Id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
