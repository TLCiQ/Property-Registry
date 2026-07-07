/**
 * Build BSI-CSMX enrich config from live Registry-iQ + local Box folder.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BOX_ROOT, loadLocalBoxFolders } from './box-project-browser.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

export async function buildBsiCsmxConfigFromRegistry(sb, projectId) {
  const { data: project, error: pErr } = await sb
    .from('project_registry')
    .select('id, project_id, project_name, property_id, brand, division, external_ids')
    .eq('project_id', projectId)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if (!project?.property_id) throw new Error(`Project ${projectId} has no property_id`);

  const { data: property, error: propErr } = await sb
    .from('property_registry')
    .select('id, property_name, property_url, brand_name, developer_name, city, state_province, address_line1')
    .eq('id', project.property_id)
    .single();
  if (propErr) throw new Error(propErr.message);

  const boxEntry = loadLocalBoxFolders().find((b) => b.project_id === projectId);
  if (!boxEntry) throw new Error(`No local Box folder for ${projectId}`);

  const propertyKey = (property.property_name || project.project_name || projectId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);

  const siteAddress =
    [property.address_line1, property.city, property.state_province].filter(Boolean).join(', ') || null;

  const cfg = {
    property_id: property.id,
    property_key: propertyKey,
    property_name: property.property_name || project.project_name,
    division: project.division || 'CSMX',
    brand: property.brand_name || project.brand || 'CSMX',
    developer: property.developer_name || null,
    site_address: siteAddress,
    box: {
      root: `${BOX_ROOT}/${boxEntry.folder}`,
      rel: boxEntry.folder,
    },
    parent_bsi_job_id: projectId,
    parent_project_registry_id: project.id,
    factory_orders: [],
    matrix: {
      json: `.firecrawl/matrices/${projectId}-matrix.json`,
    },
    website: {
      leasing_url: property.property_url || null,
      developer_url: null,
      extra_pages: ['/amenities/', '/floor-plans/', '/gallery/'],
      role_classifier: 'generic',
      map_floorplans_to_unit_types: true,
      max_images: 20,
    },
    steps: {},
    step_flags: {
      floor_plans_metadata_only: true,
      skip_skus: true,
    },
  };

  return { cfg, project, property, boxFolder: boxEntry.folder };
}

export function writeBsiCsmxConfigFile(projectId, cfg) {
  const dir = resolve(ROOT, '.firecrawl/csmx-configs');
  mkdirSync(dir, { recursive: true });
  const rel = `.firecrawl/csmx-configs/${projectId}.json`;
  const abs = resolve(ROOT, rel);
  writeFileSync(abs, JSON.stringify(cfg, null, 2));
  return rel;
}
