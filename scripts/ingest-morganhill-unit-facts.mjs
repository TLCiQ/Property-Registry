#!/usr/bin/env node
/**
 * Morgan Hill: apply full Matrix per-unit facts + unit-type sqft from UNIT PLANS.
 *
 * Prereq: scripts/migration-property-units-matrix-metadata.sql applied
 * Prereq: python3 scripts/extract-mh-unit-facts.py
 * Prereq: python3 scripts/extract-mh-unit-sqft.py
 *
 * Usage: node scripts/ingest-morganhill-unit-facts.mjs --dry-run | --apply
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(__dirname, '..', f) });
  config({ path: resolve(__dirname, '../../Derived State/dale-chat', f) });
}

const DRY = !process.argv.includes('--apply');
const PID = 'a30d446c-ee4a-4fe0-a76e-e4f9bed0e3b0';
const FACTS_JSON = resolve(__dirname, '..', '.firecrawl', 'mh-unit-facts.json');
const SQFT_JSON = resolve(__dirname, '..', '.firecrawl', 'mh-unit-sqft.json');

const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;

function ensureExtract(script, outPath) {
  if (existsSync(outPath)) return;
  execSync(`python3 "${resolve(__dirname, script)}"`, { stdio: 'inherit' });
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
  if (!regUrl || !regKey) {
    console.error('Missing REGISTRY_IQ creds');
    process.exit(1);
  }

  ensureExtract('extract-mh-unit-facts.py', FACTS_JSON);
  ensureExtract('extract-mh-unit-sqft.py', SQFT_JSON);

  const facts = JSON.parse(readFileSync(FACTS_JSON, 'utf8'));
  const sqft = JSON.parse(readFileSync(SQFT_JSON, 'utf8'));
  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });

  console.log(`Morgan Hill unit facts (${DRY ? 'DRY-RUN' : 'APPLY'})`);
  console.log(`  Matrix units: ${facts.count}, sqft types: ${sqft.count}`);

  const [registryUnits, unitTypes] = await Promise.all([
    fetchAll(reg, 'property_units', 'id, unit_number', { property_id: PID }),
    fetchAll(reg, 'property_unit_types', 'id, unit_type_name, unit_count, notes, documents', { property_id: PID }),
  ]);
  const unitByNumber = new Map(registryUnits.map((u) => [String(u.unit_number), u]));
  const typeByName = new Map(unitTypes.map((t) => [t.unit_type_name, t]));

  let unitsUpdated = 0;
  let unitsMiss = 0;
  for (const row of facts.units) {
    const ru = unitByNumber.get(String(row.unit_number));
    if (!ru) {
      unitsMiss++;
      continue;
    }
    const metadata = {
      source: 'morgan_hill_matrix',
      ...row,
      rooms: {
        kitchen: {
          kitchen_cab: row.kitchen_cab,
          top_opp: row.top_opp,
          run_elev: row.kitchen_run_elev,
          run_elev_2: row.kitchen_run_elev_2,
          island_elev: row.kitchen_island_elev,
          desk_elev: row.desk_elev,
        },
        bath_1: row.vanity_1_elev ? { vanity_elev: row.vanity_1_elev } : null,
        bath_2: row.vanity_2_elev ? { vanity_elev: row.vanity_2_elev } : null,
      },
    };
    if (DRY) {
      unitsUpdated++;
      continue;
    }
    const { error } = await reg.from('property_units').update({ metadata }).eq('id', ru.id);
    if (error) throw new Error(`unit ${row.unit_number}: ${error.message}`);
    unitsUpdated++;
  }

  let typesUpdated = 0;
  let typesMissSqft = 0;
  let propertyNetSqft = 0;
  for (const ut of unitTypes) {
    const spec = sqft.types?.[ut.unit_type_name];
    if (!spec) {
      typesMissSqft++;
      continue;
    }
    propertyNetSqft += Number(spec.net_sqft) * Number(ut.unit_count || 0);
    if (DRY) {
      typesUpdated++;
      continue;
    }
    const { error } = await reg
      .from('property_unit_types')
      .update({
        total_sqft: spec.net_sqft,
        documents: {
          ...(typeof ut.documents === 'object' && ut.documents ? ut.documents : {}),
          sqft: {
            net_sqft: spec.net_sqft,
            gross_sqft: spec.gross_sqft,
            source: spec.source,
            source_page: spec.source_page,
          },
        },
      })
      .eq('id', ut.id);
    if (error) throw new Error(`type ${ut.unit_type_name}: ${error.message}`);
    typesUpdated++;
  }

  if (!DRY && propertyNetSqft > 0) {
    const { data: prop } = await reg.from('property_registry').select('notes, external_ids').eq('id', PID).single();
    const externalIds = {
      ...(typeof prop?.external_ids === 'object' && prop.external_ids ? prop.external_ids : {}),
      morgan_hill_net_sqft_total: propertyNetSqft,
      sqft_source: 'UNIT PLANS_5.2025.pdf (net, sum of unit_type × unit_count)',
    };
    const noteLine = `Net rentable sqft total (UNIT PLANS): ${propertyNetSqft.toLocaleString()} sf`;
    const notes = prop?.notes ? `${prop.notes}\n${noteLine}` : noteLine;
    const { error } = await reg.from('property_registry').update({ external_ids: externalIds, notes }).eq('id', PID);
    if (error) throw new Error(`property sqft rollup: ${error.message}`);
  }

  // Fix canonical building count (was 11 from bad parse; Matrix = 3 buildings)
  if (!DRY) {
    const { data: prop } = await reg.from('property_registry').select('external_ids').eq('id', PID).single();
    await reg.from('property_registry').update({
      total_buildings: 3,
      total_residential_floors: 5,
      external_ids: {
        ...(prop?.external_ids || {}),
        morgan_hill_construction_area: {
          note: 'Matrix Area column populated for Building 1 only (324 units). Buildings 2 and 3 (66 units) have no Area codes in source Matrix — not a registry gap.',
          building_1_with_area: 324,
          building_2_blank: 30,
          building_3_blank: 36,
        },
      },
    }).eq('id', PID);
  }

  console.log(`  Units metadata written: ${unitsUpdated} (missing registry: ${unitsMiss})`);
  console.log(`  Unit types sqft written: ${typesUpdated} (no UNIT PLANS match: ${typesMissSqft})`);
  console.log(`  Property total_sqft (net sum): ${propertyNetSqft}`);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
