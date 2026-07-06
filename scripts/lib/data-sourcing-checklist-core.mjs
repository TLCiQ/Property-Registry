/**
 * Core data sourcing checklist generator (shared with dale-chat cron/UI).
 * Canonical copy: Property_Registry/scripts/lib/data-sourcing-checklist-core.mjs
 * Mirror: dale-chat/lib/data-sourcing-checklist-core.mjs — keep in sync.
 */
export const DEFAULT_YEARS = [2025, 2026, 2027];

const BU_ALIASES = {
  'TLC Hospitality': 'TLCH',
  'TLC Student Housing': 'UF',
  'TLC Interiors': 'BSI',
  University: 'UF',
  WEB: 'Web',
  web: 'Web',
};

export const SOURCE_LEGEND = [
  {
    code: 'DALE-IS',
    system: 'DALE-Demand `install_schedules`',
    provides: 'Project identity, D365 fields, install dates, warehouse/contacts, schedule_year',
    script: 'scripts/sync-install-schedules-to-registry.mjs',
    doc: 'docs/INSTALL_SCHEDULES_REGISTRY_LINK.md',
  },
  {
    code: 'TLCIQ-PROD',
    system: 'TLCiQ-Production Supabase (`deals`, `unit_types`, `requirements`)',
    provides: 'Unit types, units, floors, FF&E SKUs (`property_unit_type_skus.source=tlciq_production`)',
    script: 'scripts/sync-production-to-registry.mjs',
    doc: 'docs/PRODUCTION_REGISTRY_UNIT_PIPELINE.md',
  },
  {
    code: 'SAGE-PACE',
    system: 'DALE-Demand `sage_orders` (Sage 300 pacing xlsx ETL)',
    provides: 'Order/deal crosswalk, ship-to, division, property_key hints',
    script: 'scripts/sync-sage-shipto-project-property.mjs',
    doc: 'docs/SAGE_SHIPTO_PROJECT_PROPERTY_LINK.md',
  },
  {
    code: 'NETSUITE',
    system: 'NetSuite jobs portfolio (DALE-Demand / Vantage)',
    provides: 'Job revenue, developer, builder, subsidiary (`external_ids.netsuite_*`)',
    script: 'scripts/ingest-troubadour-phase3.mjs (property-specific); NS backfill jobs',
    doc: 'docs/BSI_CSMX_PROPERTY_ENRICH.md',
  },
  {
    code: 'BOX-BSI',
    system: 'Box Projects folder (`25xxx-…`) via Box-iQ CCG API',
    provides: 'Subcontract PDFs, SCHEDULE_MTO, matrix xlsx, shop drawings, floor plans',
    script: 'scripts/ingest-bsi-contract.mjs, ingest-bsi-matrix-structure.mjs, ingest-bsi-csmx-property.mjs',
    doc: 'docs/BSI_CSMX_PROPERTY_ENRICH.md',
  },
  {
    code: 'AIRTABLE-ARCH',
    system: 'Airtable archaeology (`BSI_ProjectSetup`, legacy deals)',
    provides: 'Legacy property fields, BSI customer/developer IDs',
    script: 'scripts/ingest-property-archaeology.mjs',
    doc: 'docs/ACCESS_2013_INGEST.md',
  },
  {
    code: 'ACCESS-2013',
    system: 'Access 2013 SQLite export',
    provides: 'Historical units/types/SKUs (`legacy_access_*` columns)',
    script: 'scripts/ingest-access-2013-sqlite.mjs',
    doc: 'docs/ACCESS_2013_INGEST.md',
  },
  {
    code: 'CORESPACES',
    system: 'Core Spaces Prismic CMS',
    provides: 'Community identity, hero/gallery, brand (`source=corespaces_prismic`)',
    script: 'scripts/ingest-corespaces-prismic.mjs',
    doc: 'PROJECT_CONTEXT_Property_Registry.md',
  },
  {
    code: 'CHAIN-IQ',
    system: 'Chain-iQ Supabase `container_loads`',
    provides: 'Container logistics ↔ project_registry link',
    script: 'scripts/ingest-morganhill-project-links.mjs, ingest-troubadour-25198-complete.mjs',
    doc: 'docs/BSI_CSMX_PROPERTY_ENRICH.md',
  },
  {
    code: 'FIRECRAWL',
    system: 'Firecrawl website scrape + Cloudinary',
    provides: 'Leasing site images, address resolve, brand gap-fill (`enrichment_sources`)',
    script: 'scripts/enrich-bsi-csmx-website.mjs, site-address scripts',
    doc: 'docs/SITE_ADDRESS_WEB_RESOLVE.md',
  },
  {
    code: 'PIPELINE',
    system: 'DALE-Demand pipeline / opportunities',
    provides: 'Property stubs from CRM pipeline (`source=pipeline_opportunities`)',
    script: 'seed / sync pipeline scripts',
    doc: 'docs/PRODUCTION_REGISTRY_UNIT_PIPELINE.md',
  },
  {
    code: 'LAYOUT-IQ',
    system: 'Layout-iQ site registry',
    provides: 'Site IDs, layout crosswalk (`external_ids.layout_iq_site_id`)',
    script: 'Layout-iQ ingest (external)',
    doc: null,
  },
];

async function fetchAll(sb, table, select) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb.from(table).select(select).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

function normalizeBU(raw, projectId) {
  const d = (raw || '').trim();
  if (!d && /^25\d{3}$/.test(String(projectId || ''))) return 'BSI';
  if (!d) return 'UNASSIGNED';
  return BU_ALIASES[d] || d;
}

function inferScheduleYear(project) {
  if (project.schedule_year) return project.schedule_year;
  const id = String(project.project_id || '');
  let m = id.match(/^(\d{2})-/);
  if (m) return 2000 + parseInt(m[1], 10);
  m = id.match(/^(\d{4})-/);
  if (m) return parseInt(m[1], 10);
  return null;
}

function pickPrimaryBU(projects) {
  const counts = {};
  for (const p of projects) {
    const bu = normalizeBU(p.division || p.d365_division || p.brand, p.project_id);
    counts[bu] = (counts[bu] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'UNASSIGNED';
}

function citeProjectOrigin(p) {
  const ext = p.external_ids || {};
  if (p.dale_install_schedule_id || p.source_file) return 'DALE-IS';
  if (ext.contract_sources || ext.bsi_matrix_source || ext.box_project_folder || ext.bsi_job_id) return 'BOX-BSI';
  if (ext.seeded_via?.includes('production') || ext.tlciq_source === 'production') return 'TLCIQ-PROD';
  if (ext.netsuite_job_id || ext.netsuite_portfolio) return 'NETSUITE';
  if (ext.sage_order_number || ext.sage_deal || ext.sage_order) return 'SAGE-PACE';
  if (ext.corespaces_prismic_property_id) return 'CORESPACES';
  if (ext.source === 'install_schedules') return 'DALE-IS';
  if (typeof ext.source === 'string' && ext.source.includes('airtable')) return 'AIRTABLE-ARCH';
  if (ext.source) return String(ext.source).toUpperCase().slice(0, 12);
  return 'UNKNOWN';
}

function citePropertyOrigin(prop) {
  if (!prop) return { code: 'MISSING', detail: 'No property_registry row' };
  const src = prop.source || 'unknown';
  const codes = new Set();
  if (src === 'install_schedules') codes.add('DALE-IS');
  if (src === 'pipeline_opportunities') codes.add('PIPELINE');
  if (src === 'corespaces_prismic') codes.add('CORESPACES');
  if (src === 'bsi_project_setup') codes.add('AIRTABLE-ARCH');
  if (src === 'layout_iq') codes.add('LAYOUT-IQ');
  if (prop.external_ids?.layout_iq_site_id) codes.add('LAYOUT-IQ');
  if (prop.external_ids?.prismic_id) codes.add('CORESPACES');
  if (prop.external_ids?.deal_number) codes.add('DALE-IS');
  const enrich = prop.enrichment_sources;
  if (enrich) {
    const items = Array.isArray(enrich) ? enrich : Object.keys(enrich);
    for (const e of items) {
      const label = typeof e === 'string' ? e : e?.source || e?.type || '';
      if (/firecrawl|website|site_address/i.test(label)) codes.add('FIRECRAWL');
      if (/cloudinary|hero/i.test(label)) codes.add('FIRECRAWL');
      if (/prismic|corespaces/i.test(label)) codes.add('CORESPACES');
      if (/troubadour|bsi_csmx/i.test(label)) codes.add('BOX-BSI');
      if (/portfolio_project_team/i.test(label)) codes.add('PIPELINE');
    }
  }
  if (!codes.size) codes.add(src === 'unknown' ? 'UNKNOWN' : src.toUpperCase().slice(0, 12));
  return { code: [...codes].join('+'), detail: src };
}

function milestoneSourceSummary(milestones) {
  const prefixes = {};
  for (const m of milestones) {
    const p = (m.source_field_path || 'unknown').split(':').slice(0, 2).join(':');
    prefixes[p] = (prefixes[p] || 0) + 1;
  }
  return prefixes;
}

function documentSummary(docs) {
  if (!Array.isArray(docs) || !docs.length) return null;
  const types = {};
  for (const d of docs) {
    const key = `${d.storage || 'unknown'}:${d.type || 'doc'}`;
    types[key] = (types[key] || 0) + 1;
  }
  return types;
}

function buildFamilyRecord({
  familyKey,
  year,
  bu,
  property,
  projects,
  milestones,
  unitTypes,
  units,
  skus,
  shopDrawings,
  floors,
  stakeholders,
}) {
  const extProjects = projects.map((p) => p.external_ids || {});
  const layers = [];

  const propCite = citePropertyOrigin(property);
  layers.push({
    layer: 'Property identity',
    entities: 'property_registry (name, address, brand, units/beds)',
    source_code: propCite.code,
    citation: propCite.detail,
    verified: !!property,
  });

  for (const p of projects) {
    layers.push({
      layer: 'Project identity',
      entities: `project_registry ${p.project_id}`,
      source_code: citeProjectOrigin(p),
      citation: [
        p.source_file && `DALE sheet: ${p.source_file}`,
        p.external_ids?.box_project_folder && `Box: ${p.external_ids.box_project_folder}`,
        p.external_ids?.seeded_via && `seeded_via: ${p.external_ids.seeded_via}`,
        p.external_ids?.deal_number && `deal: ${p.external_ids.deal_number}`,
      ]
        .filter(Boolean)
        .join(' · ') || p.project_name,
      verified: true,
    });
  }

  if (milestones.length) {
    const msSummary = milestoneSourceSummary(milestones);
    layers.push({
      layer: 'Plan milestones / pacing',
      entities: `${milestones.length} project_milestones`,
      source_code: Object.keys(msSummary).some((k) => k.startsWith('schedule_mto'))
        ? 'BOX-BSI'
        : Object.keys(msSummary).some((k) => k.startsWith('gc_schedule'))
          ? 'BOX-BSI'
          : Object.keys(msSummary).some((k) => k.startsWith('contract'))
            ? 'BOX-BSI'
            : 'DALE-IS',
      citation: Object.entries(msSummary)
        .map(([k, n]) => `${k} (${n})`)
        .join(', '),
      verified: true,
    });
  } else if (projects.some((p) => p.install_start_date || p.estimated_completion_date)) {
    layers.push({
      layer: 'Install schedule dates',
      entities: 'project_registry.install_start_date / estimated_completion_date',
      source_code: 'DALE-IS',
      citation: 'From install_schedules sync (no parsed contract milestones)',
      verified: true,
    });
  }

  const contractSrc = extProjects.find((e) => e.contract_sources);
  if (contractSrc?.contract_sources) {
    const cs = contractSrc.contract_sources;
    const contractNames = (cs.contracts || []).map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
    layers.push({
      layer: 'Contract / pacing artifacts',
      entities: 'project_registry.external_ids.contract_sources',
      source_code: 'BOX-BSI',
      citation: [
        contractNames.length && `${contractNames.length} contract PDF(s): ${contractNames.slice(0, 2).join('; ')}`,
        cs.schedule_mto && `SCHEDULE_MTO: ${cs.schedule_mto}`,
        cs.gc_workbook && `GC Values Workbook: ${cs.gc_workbook}`,
        cs.gc_schedules?.length && `${cs.gc_schedules.length} GC schedule PDF(s): ${cs.gc_schedules.slice(0, 2).join('; ')}`,
      ]
        .filter(Boolean)
        .join(' · '),
      verified: true,
    });
  }

  if (unitTypes.length) {
    const hasProduction = unitTypes.some((u) => u.production_unit_type_key);
    const hasMatrix = unitTypes.some((u) => u.room_drawings || u.legacy_access_unit_type_id);
    layers.push({
      layer: 'Unit types',
      entities: `${unitTypes.length} property_unit_types`,
      source_code: hasMatrix ? 'BOX-BSI' : hasProduction ? 'TLCIQ-PROD' : unitTypes[0]?.legacy_access_unit_type_id ? 'ACCESS-2013' : 'UNKNOWN',
      citation: [
        hasProduction && 'production_unit_type_key present',
        hasMatrix && 'room_drawings / matrix ingest',
        unitTypes.some((u) => u.layout_asset_urls) && 'layout_asset_urls populated',
      ]
        .filter(Boolean)
        .join(' · ') || 'structure present — origin not tagged',
      verified: true,
    });
  }

  if (units.length) {
    layers.push({
      layer: 'Units',
      entities: `${units.length} property_units`,
      source_code: extProjects.some((e) => e.bsi_matrix_source) ? 'BOX-BSI' : units.some((u) => u.legacy_access_project_id) ? 'ACCESS-2013' : 'TLCIQ-PROD',
      citation: extProjects.find((e) => e.bsi_matrix_source)?.bsi_matrix_source || 'unit rows linked to types',
      verified: true,
    });
  }

  if (skus.length) {
    const skuSources = [...new Set(skus.map((s) => s.source || 'null'))];
    layers.push({
      layer: 'Scoped SKUs (FF&E / millwork)',
      entities: `${skus.length} property_unit_type_skus`,
      source_code: skuSources.includes('tlciq_production') ? 'TLCIQ-PROD' : skuSources.includes('morgan_hill_counts_workbook') ? 'BOX-BSI' : skuSources[0]?.toUpperCase()?.slice(0, 12) || 'UNKNOWN',
      citation: `source values: ${skuSources.join(', ')}`,
      verified: true,
    });
  }

  if (shopDrawings.length) {
    layers.push({
      layer: 'Shop drawings',
      entities: `${shopDrawings.length} property_shop_drawings`,
      source_code: 'BOX-BSI',
      citation: shopDrawings
        .slice(0, 3)
        .map((d) => d.source_path || d.drawing_no)
        .join('; '),
      verified: true,
    });
  }

  if (floors.some((f) => f.floor_plan_url)) {
    layers.push({
      layer: 'Floor plans',
      entities: `${floors.filter((f) => f.floor_plan_url).length} property_floors with plan URL`,
      source_code: 'BOX-BSI',
      citation: 'Cloudinary URLs from Box architectural PDFs',
      verified: true,
    });
  }

  if (extProjects.some((e) => e.chain_iq || e.chain_iq_project_name)) {
    layers.push({
      layer: 'Container logistics',
      entities: 'Chain-iQ container_loads link',
      source_code: 'CHAIN-IQ',
      citation: JSON.stringify(extProjects.find((e) => e.chain_iq)?.chain_iq || extProjects.find((e) => e.chain_iq_project_name)?.chain_iq_project_name).slice(0, 120),
      verified: true,
    });
  }

  if (extProjects.some((e) => e.netsuite_job_id || e.netsuite_portfolio)) {
    layers.push({
      layer: 'NetSuite job economics',
      entities: 'external_ids.netsuite_*',
      source_code: 'NETSUITE',
      citation: `job_id: ${extProjects.find((e) => e.netsuite_job_id)?.netsuite_job_id || 'portfolio mirror'}`,
      verified: true,
    });
  }

  if (extProjects.some((e) => e.sage_order_number || e.sage_deal)) {
    layers.push({
      layer: 'Sage order crosswalk',
      entities: 'external_ids.sage_*',
      source_code: 'SAGE-PACE',
      citation: `order/deal refs on ${extProjects.filter((e) => e.sage_order_number || e.sage_deal).length} project(s)`,
      verified: true,
    });
  }

  if (stakeholders.length) {
    layers.push({
      layer: 'Stakeholders / contacts',
      entities: `${stakeholders.length} property_stakeholders`,
      source_code: projects.some((p) => p.dale_install_schedule_id) ? 'DALE-IS' : 'UNKNOWN',
      citation: 'Install schedule contact fields → stakeholder rows',
      verified: true,
    });
  }

  const docTypes = projects.flatMap((p) => {
    const s = documentSummary(p.documents);
    return s ? Object.keys(s) : [];
  });
  if (docTypes.length) {
    layers.push({
      layer: 'Project documents index',
      entities: 'project_registry.documents JSONB',
      source_code: docTypes.some((d) => d.startsWith('box:')) ? 'BOX-BSI' : 'UNKNOWN',
      citation: [...new Set(docTypes)].join(', '),
      verified: true,
    });
  }

  if (property?.hero_image_url || (property?.images?.length > 0)) {
    layers.push({
      layer: 'Property imagery',
      entities: 'hero_image_url / images[]',
      source_code: (propCite.code.includes('CORESPACES') && 'CORESPACES') || (propCite.code.includes('FIRECRAWL') && 'FIRECRAWL') || 'UNKNOWN',
      citation: property.hero_image_url ? 'Cloudinary hero' : `${property.images?.length || 0} gallery images`,
      verified: true,
    });
  }

  return {
    family_key: familyKey,
    schedule_year: year,
    business_unit: bu,
    property_id: property?.id || null,
    property_name: property?.property_name || '(orphan — no property link)',
    project_ids: projects.map((p) => p.project_id).filter(Boolean),
    project_count: projects.length,
    layers,
    gaps: layers.filter((l) => !l.verified).map((l) => l.layer),
  };
}

function renderMarkdown({ generated_at, years, legend, summary, families }) {
  const lines = [];
  lines.push('# Data Sourcing Checklist — Property-Project Families (2025–2027)');
  lines.push('');
  lines.push(`**Generated:** ${generated_at}`);
  lines.push(`**Registry-iQ project:** \`xhafhdaugmgdxckhdfov\``);
  lines.push(`**Scope:** Schedule years ${years.join(', ')} · Tier-1 BUs (UF, Web, CSL, BSI, CSMX, TLCH) + division aliases`);
  lines.push('');
  lines.push('> This checklist is generated from **live Registry-iQ rows** — not PROJECT_CONTEXT summaries.  ');
  lines.push('> Re-run: `node scripts/generate-data-sourcing-checklist.mjs`  ');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 1. Source system legend (citation codes)');
  lines.push('');
  lines.push('| Code | System of record | Provides | Ingest script | Doc |');
  lines.push('|------|------------------|----------|---------------|-----|');
  for (const s of legend) {
    lines.push(`| **${s.code}** | ${s.system} | ${s.provides} | \`${s.script}\` | ${s.doc ? `[${s.doc}](${s.doc})` : '—'} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 2. Coverage summary (BU × schedule year)');
  lines.push('');
  lines.push('| BU | Year | Families | Projects | w/ Property | w/ Milestones | w/ Unit Types | w/ SKUs | w/ Box Contract |');
  lines.push('|----|------|----------|----------|-------------|---------------|---------------|---------|-----------------|');
  for (const row of summary) {
    lines.push(
      `| ${row.bu} | ${row.year} | ${row.families} | ${row.projects} | ${row.with_property} | ${row.with_milestones} | ${row.with_unit_types} | ${row.with_skus} | ${row.with_box_contract} |`,
    );
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 3. Property-project families — per-family citation tables');
  lines.push('');
  lines.push('Families are grouped by **`property_id` + `schedule_year` + primary BU**.  ');
  lines.push('Orphan projects (no `property_id`) appear as separate rows.');
  lines.push('');

  let currentSection = '';
  for (const f of families) {
    const section = `${f.business_unit} · ${f.schedule_year}`;
    if (section !== currentSection) {
      currentSection = section;
      lines.push(`### ${section}`);
      lines.push('');
    }
    lines.push(`#### ${f.property_name}`);
    lines.push('');
    lines.push(`- **Property ID:** \`${f.property_id || 'null'}\``);
    lines.push(`- **Projects (${f.project_count}):** ${f.project_ids.map((id) => `\`${id}\``).join(', ') || '—'}`);
    lines.push('');
    lines.push('| Data layer | Entities | Source code | Citation / artifact |');
    lines.push('|------------|----------|-------------|---------------------|');
    if (!f.layers.length) {
      lines.push('| — | — | — | No sourced layers detected |');
    } else {
      for (const l of f.layers) {
        lines.push(`| ${l.layer} | ${l.entities} | **${l.source_code}** | ${l.citation.replace(/\|/g, '\\|')} |`);
      }
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## 4. Known gaps & authority rules');
  lines.push('');
  lines.push('- **BSI millwork authority:** Box matrix + shop drawings > Chain-iQ > NetSuite > website (see `docs/BSI_CSMX_PROPERTY_ENRICH.md`).');
  lines.push('- **UF/CSL FF&E authority:** TLCiQ-Production requirements > install_schedules > Sage pacing crosswalk.');
  lines.push('- **Projects without `property_id`:** Usually install-schedule stubs awaiting Rosetta / property match.');
  lines.push('- **`25024` Verve TLO:** Box folder empty — contract milestones blocked (BSI-05 in BACKLOG.md).');
  lines.push('- **Web BU:** No projects tagged `division=Web` in the 2025–2027 cohort — webstore orders typically roll under **UF** in install_schedules / Sage TYPE. Use Sage `(WEBSTORE)` suffix or deal notes to isolate Web when needed.');
  lines.push('- **Full detail (room layouts + scoped SKUs):** Only Troubadour (`25019`) and Morgan Hill (`25048`) at Jul 2026 — all other BSI jobs have structure and/or contract pacing only.');
  lines.push('');
  return lines.join('\n');
}

export function renderMarkdownReport(opts) {
  return renderMarkdown(opts);
}

export async function generateDataSourcingChecklist(sb, { years = DEFAULT_YEARS } = {}) {
  const started = Date.now();
  const [projects, properties, milestones, unitTypes, units, skus, shopDrawings, buildings, floors, stakeholders] =
    await Promise.all([
      fetchAll(
        sb,
        'project_registry',
        'id,project_id,project_name,property_id,division,brand,d365_division,schedule_year,external_ids,documents,install_start_date,estimated_completion_date,dale_install_schedule_id,source_file,sheet_name,d365_opportunity_code,fulfillment_mode',
      ),
      fetchAll(sb, 'property_registry', 'id,property_name,source,external_ids,enrichment_sources,documents,images,hero_image_url,city,state_province'),
      fetchAll(sb, 'project_milestones', 'project_id,milestone_name,target_date,source_field_path,milestone_category'),
      fetchAll(sb, 'property_unit_types', 'id,property_id,unit_type_code,production_unit_type_key,room_drawings,layout_asset_urls,legacy_access_unit_type_id'),
      fetchAll(sb, 'property_units', 'id,property_id,unit_type_id,legacy_access_project_id,metadata'),
      fetchAll(sb, 'property_unit_type_skus', 'property_id,unit_type_id,sku,source'),
      fetchAll(sb, 'property_shop_drawings', 'property_id,drawing_no,source_path,pdf_url'),
      fetchAll(sb, 'property_buildings', 'id,property_id,building_name'),
      fetchAll(sb, 'property_floors', 'id,building_id,floor_plan_url,floor_label'),
      fetchAll(sb, 'property_stakeholders', 'property_id,stakeholder_name,role'),
    ]);

  const buildingToProperty = Object.fromEntries(buildings.map((b) => [b.id, b.property_id]));
  const floorsByProperty = floors.reduce((acc, f) => {
    const pid = buildingToProperty[f.building_id];
    if (!pid) return acc;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(f);
    return acc;
  }, {});

  const propById = Object.fromEntries(properties.map((p) => [p.id, p]));
  const msByProject = new Map();
  for (const m of milestones) {
    if (!msByProject.has(m.project_id)) msByProject.set(m.project_id, []);
    msByProject.get(m.project_id).push(m);
  }

  function bucketByProperty(list, propertyId) {
    return list.filter((r) => r.property_id === propertyId);
  }

  const yearProjects = projects.filter((p) => {
    const y = inferScheduleYear(p);
    return y && years.includes(y);
  });

  const familyMap = new Map();
  for (const p of yearProjects) {
    const year = inferScheduleYear(p) || p.schedule_year;
    const propId = p.property_id || `orphan:${p.id}`;
    const bu = normalizeBU(p.division || p.d365_division || p.brand, p.project_id);
    const key = `${year}|${propId}|${bu}`;
    if (!familyMap.has(key)) familyMap.set(key, { year, property_id: p.property_id, bu, projects: [] });
    familyMap.get(key).projects.push(p);
  }

  // Recompute primary BU per family from all projects in group
  const families = [];
  for (const [key, group] of familyMap) {
    const bu = pickPrimaryBU(group.projects);
    const property = group.property_id ? propById[group.property_id] : null;
    const projectIds = group.projects.map((p) => p.id);
    const allMs = projectIds.flatMap((id) => msByProject.get(id) || []);
    families.push(
      buildFamilyRecord({
        familyKey: key,
        year: group.year,
        bu,
        property,
        projects: group.projects,
        milestones: allMs,
        unitTypes: group.property_id ? bucketByProperty(unitTypes, group.property_id) : [],
        units: group.property_id ? bucketByProperty(units, group.property_id) : [],
        skus: group.property_id ? bucketByProperty(skus, group.property_id) : [],
        shopDrawings: group.property_id ? bucketByProperty(shopDrawings, group.property_id) : [],
        floors: group.property_id ? floorsByProperty[group.property_id] || [] : [],
        stakeholders: group.property_id ? bucketByProperty(stakeholders, group.property_id) : [],
      }),
    );
  }

  families.sort((a, b) => a.business_unit.localeCompare(b.business_unit) || a.schedule_year - b.schedule_year || a.property_name.localeCompare(b.property_name));

  const summaryMap = new Map();
  for (const f of families) {
    const sk = `${f.business_unit}|${f.schedule_year}`;
    if (!summaryMap.has(sk)) {
      summaryMap.set(sk, {
        bu: f.business_unit,
        year: f.schedule_year,
        families: 0,
        projects: 0,
        with_property: 0,
        with_milestones: 0,
        with_unit_types: 0,
        with_skus: 0,
        with_box_contract: 0,
      });
    }
    const s = summaryMap.get(sk);
    s.families += 1;
    s.projects += f.project_count;
    if (f.property_id) s.with_property += 1;
    if (f.layers.some((l) => l.layer.includes('milestone') || l.layer.includes('Contract'))) s.with_milestones += 1;
    if (f.layers.some((l) => l.layer === 'Unit types')) s.with_unit_types += 1;
    if (f.layers.some((l) => l.layer.includes('SKU'))) s.with_skus += 1;
    if (f.layers.some((l) => l.source_code === 'BOX-BSI' && l.layer.includes('Contract'))) s.with_box_contract += 1;
  }

  const summary = [...summaryMap.values()].sort((a, b) => a.year - b.year || a.bu.localeCompare(b.bu));
  const generated_at = new Date().toISOString();
  const payload = {
    generated_at,
    years,
    legend: SOURCE_LEGEND,
    summary,
    family_count: families.length,
    project_count: yearProjects.length,
    families,
  };
  const markdown = renderMarkdown({ generated_at, years, legend: SOURCE_LEGEND, summary, families });
  return { payload, markdown, duration_ms: Date.now() - started };
}

export async function persistDataSourcingRun(sb, result, meta = {}) {
  const { payload, markdown, duration_ms } = result;
  const row = {
    run_at: payload.generated_at,
    trigger_type: meta.trigger_type || 'cli',
    triggered_by: meta.triggered_by || null,
    schedule_years: payload.years,
    family_count: payload.family_count,
    project_count: payload.project_count,
    summary: payload.summary,
    legend: payload.legend,
    families: payload.families,
    markdown,
    duration_ms,
    ok: true,
    error_message: null,
  };
  const { data, error } = await sb.from('registry_data_sourcing_runs').insert(row).select('id, run_at').single();
  if (error) throw new Error(error.message);
  return data;
}
