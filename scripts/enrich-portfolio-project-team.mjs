#!/usr/bin/env node
/**
 * PT-01: Enrich portfolio operator properties with GC, architect, interior designer.
 * Operators: 908, Lincoln Ventures, Subtext, Yugo, Parallel, ACC, Greystar.
 *
 * Usage:
 *   node scripts/enrich-portfolio-project-team.mjs --dry-run
 *   node scripts/enrich-portfolio-project-team.mjs --apply
 *   node scripts/enrich-portfolio-project-team.mjs --apply --enrich-stakeholders
 *   node scripts/enrich-portfolio-project-team.mjs --apply --operators=908,subtext,acc
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import {
  lookupCurated,
  OPERATOR_DEFAULTS,
  isBlockedGc,
  STAKEHOLDER_TYPE_HINTS,
} from './data/portfolio-project-team-curated.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

for (const f of ['.env.local', '.env']) {
  const p = resolve(ROOT, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
  }
}
for (const f of ['.env.local', '.env']) {
  const p = resolve(ROOT, '../Derived State/dale-chat', f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
  }
}

const DRY = !process.argv.includes('--apply');
const ENRICH_STAKEHOLDERS = process.argv.includes('--enrich-stakeholders');
const ENRICH_LIMIT = parseInt(process.argv.find((a) => a.startsWith('--enrich-limit='))?.split('=')[1] || '0', 10) || null;
const AIRTABLE_PAT = process.env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY || '';
const LAYOUT_IQ_BASE = 'appG8wJwYkvtj4rFN';
const OPERATOR_ARG = process.argv.find((a) => a.startsWith('--operators='))?.split('=')[1];

const OPERATOR_RULES = {
  '908': /\b908\b|908 development|908 group/i,
  'lincoln-ventures': /lincoln ventures|lv collective|\brambler\b/i,
  subtext: /subtext|\bverve\b|ever knoxville|collegiate development/i,
  yugo: /\byugo\b/i,
  parallel: /parallel|\blumen on 9th\b|\blumen birmingham\b|401fs/i,
  acc: /american campus communities|\bacc\b/i,
  greystar: /greystar/i,
};

const ALL_OPERATORS = Object.keys(OPERATOR_RULES);
const ACTIVE_OPERATORS = OPERATOR_ARG
  ? OPERATOR_ARG.split(',').map((s) => s.trim().toLowerCase()).filter((k) => OPERATOR_RULES[k])
  : ALL_OPERATORS;

const GC_CANONICAL = {
  'LAYTON CONSTRUCTION': 'Layton Construction Company',
  'LAYTON': 'Layton Construction Company',
  'KRAUS-ANDERSON': 'Kraus-Anderson Construction',
  'KRAUS ANDERSON CONSTRUCTION': 'Kraus-Anderson Construction',
  'ROGERS-O\'BRIEN': "Rogers-O'Brien Construction",
  'ROGERS O\'BRIEN CONSTRUCTION': "Rogers-O'Brien Construction",
  'ARCO MURRAY CONSTRUCTION CO': 'ARCO Murray',
  'FORUM ARCHITECTURE & INTERIOR DESIGN': 'Forum Architecture',
  'HUMPHREYS & PARTNERS': 'Humphreys & Partners Architects',
  'NILES BOLTON ARCHITECTS': 'Niles Bolton Associates',
  'NILES BOLTON ARCHITECTURE': 'Niles Bolton Associates',
  'BRINKMANN CONSTRUCTORS INC': 'Brinkmann Constructors',
  'MARK BARON CONSTRUCTION, INC.': 'Mark Baron Construction',
};

const stats = {
  properties: 0,
  fields_updated: 0,
  stakeholder_links: 0,
  stakeholders_created: 0,
  stakeholders_enriched: 0,
  contacts_created: 0,
  web_profiles_enriched: 0,
  skipped_gc_blocklist: 0,
  bad_links_removed: 0,
};

function log(...args) { console.log(...args); }

function normalizeNameKey(raw) {
  if (!raw) return '';
  return raw.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()
    .replace(/^THE\s+/, '').replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function canonicalizeTeamName(name) {
  if (!name) return name;
  const key = name.trim().toUpperCase();
  return GC_CANONICAL[key] || name.trim();
}

function inferStakeholderType(name, role) {
  if (STAKEHOLDER_TYPE_HINTS[name]) return STAKEHOLDER_TYPE_HINTS[name];
  if (role === 'gc') return 'gc';
  if (role === 'architect') return 'architect';
  if (role === 'designer' || role === 'interior_designer') return 'interior_designer';
  return 'other';
}

function detectOperators(prop, links) {
  const hay = [
    prop.developer_name,
    prop.owner_name,
    prop.property_manager_name,
    prop.brand_name,
    prop.property_name,
    ...(links || []).map((l) => l.stakeholder_name),
  ].filter(Boolean).join(' ');
  return ACTIVE_OPERATORS.filter((k) => OPERATOR_RULES[k].test(hay));
}

function propertyInScope(prop, linksByProp) {
  const links = linksByProp.get(prop.id) || [];
  return detectOperators(prop, links).length > 0;
}

async function fetchAirtable(baseId, tableName) {
  if (!AIRTABLE_PAT) return [];
  const rows = [];
  let offset = null;
  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);
    const page = await new Promise((resolve, reject) => {
      https.get(url, { headers: { Authorization: `Bearer ${AIRTABLE_PAT}` } }, (resp) => {
        let body = '';
        resp.on('data', (c) => { body += c; });
        resp.on('end', () => {
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        });
      }).on('error', reject);
    });
    if (page.error) throw new Error(page.error.message || JSON.stringify(page.error));
    rows.push(...(page.records || []));
    offset = page.offset || null;
  } while (offset);
  return rows;
}

function layoutIqIndex(records) {
  const byKey = new Map();
  for (const rec of records) {
    const f = rec.fields || {};
    const name = f.Property_Name?.trim();
    if (!name) continue;
    byKey.set(normalizeNameKey(name), {
      gc_name: f['General Contractor']?.trim() || null,
      designer_name: f['Interior Design Firm']?.trim() || null,
      architect_name: f.Architect?.trim() || f['Architect of Record']?.trim() || null,
    });
  }
  return byKey;
}

function layoutLookup(byKey, propertyName) {
  return byKey.get(normalizeNameKey(propertyName)) || null;
}

function pickBestFromLinks(links, role) {
  const names = links
    .filter((l) => l.role === role)
    .map((l) => canonicalizeTeamName(l.stakeholder_name?.trim()))
    .filter(Boolean)
    .filter((n) => role !== 'gc' || !isBlockedGc(n));
  if (!names.length) return null;
  const scored = [...new Set(names)].sort((a, b) => {
    const score = (n) => {
      let s = n.length;
      if (/construction|builders|contractors|moriarty|favergray/i.test(n)) s += 20;
      return s;
    };
    return score(b) - score(a);
  });
  return scored[0];
}

function mergeTeam(propertyName, layout, links, operatorKeys) {
  const team = { gc: null, architect: null, designer: null, sources: [] };
  const add = (field, value, source, url) => {
    if (!value || team[field]) return;
    value = canonicalizeTeamName(value);
    if (field === 'gc' && isBlockedGc(value)) return;
    team[field] = value;
    team.sources.push({ field, value, source, url: url || null });
  };

  const cur = lookupCurated(propertyName);
  if (cur) {
    add('gc', cur.gc, cur.source, cur.url);
    add('architect', cur.architect, cur.source, cur.url);
    add('designer', cur.designer, cur.source, cur.url);
  }

  if (layout) {
    add('gc', layout.gc_name, 'Layout-iQ Property List');
    add('architect', layout.architect_name, 'Layout-iQ Property List');
    add('designer', layout.designer_name, 'Layout-iQ Property List');
  }

  add('gc', pickBestFromLinks(links, 'gc'), 'property_stakeholders');
  add('architect', pickBestFromLinks(links, 'architect'), 'property_stakeholders');
  add('designer', pickBestFromLinks(links, 'interior_designer') || pickBestFromLinks(links, 'designer'), 'property_stakeholders');

  for (const op of operatorKeys) {
    const def = OPERATOR_DEFAULTS[op];
    if (!def) continue;
    add('gc', def.gc, def.source, def.url);
    add('architect', def.architect, def.source, def.url);
    add('designer', def.designer, def.source, def.url);
  }

  return team;
}

async function upsertStakeholder(sb, index, name, role, sourceMeta) {
  name = canonicalizeTeamName(name);
  const key = name.toUpperCase().trim();
  let row = index.get(key);
  const stakeholder_type = inferStakeholderType(name, role);

  if (row) {
    const updates = {};
    for (const [f, src] of [
      ['website', 'website'], ['description', 'description'], ['hq_city', 'hq_city'],
      ['hq_state', 'hq_state'], ['hq_address_line1', 'hq_address_line1'], ['hq_postal_code', 'hq_postal_code'],
      ['phone', 'phone'], ['email', 'email'], ['logo_url', 'logo_url'], ['linkedin_url', 'linkedin_url'],
      ['portfolio_size', 'portfolio_size'],
    ]) {
      if (!row[f] && sourceMeta?.[src]) updates[f] = sourceMeta[src];
    }
    if (Object.keys(updates).length) {
      if (!DRY) await sb.from('stakeholder_registry').update(updates).eq('id', row.id);
      stats.stakeholders_enriched++;
      Object.assign(row, updates);
    }
    return row.id;
  }

  const insert = {
    stakeholder_name: name,
    stakeholder_type,
    is_active: true,
    notes: sourceMeta?.notes || null,
    website: sourceMeta?.website || null,
    description: sourceMeta?.description || null,
    hq_address_line1: sourceMeta?.hq_address_line1 || null,
    hq_city: sourceMeta?.hq_city || null,
    hq_state: sourceMeta?.hq_state || null,
    hq_postal_code: sourceMeta?.hq_postal_code || null,
    phone: sourceMeta?.phone || null,
    email: sourceMeta?.email || null,
    logo_url: sourceMeta?.logo_url || null,
    linkedin_url: sourceMeta?.linkedin_url || null,
    portfolio_size: sourceMeta?.portfolio_size || null,
  };
  if (sourceMeta?.enrichment_sources) {
    insert.external_ids = { portfolio_project_team: sourceMeta.enrichment_sources };
  }

  if (DRY) {
    stats.stakeholders_created++;
    const fake = { id: `dry-${key}`, ...insert };
    index.set(key, fake);
    return fake.id;
  }

  const { data, error } = await sb.from('stakeholder_registry').insert(insert).select('id').single();
  if (error) {
    log(`  ERROR stakeholder insert ${name}:`, error.message);
    return null;
  }
  stats.stakeholders_created++;
  index.set(key, { id: data.id, ...insert });
  return data.id;
}

async function linkPropertyStakeholder(sb, propertyId, stakeholderId, name, role) {
  name = canonicalizeTeamName(name);
  const mappedRole = role === 'designer' ? 'interior_designer' : role;
  const { data: existing } = await sb
    .from('property_stakeholders')
    .select('id, role')
    .eq('property_id', propertyId)
    .ilike('stakeholder_name', name)
    .maybeSingle();
  if (existing) {
    if (existing.role !== mappedRole && !DRY) {
      await sb.from('property_stakeholders').update({ role: mappedRole }).eq('id', existing.id);
    }
    return;
  }
  if (DRY) { stats.stakeholder_links++; return; }
  const { error } = await sb.from('property_stakeholders').insert({
    property_id: propertyId,
    stakeholder_id: stakeholderId,
    stakeholder_name: name,
    company_name: name,
    role: mappedRole,
    is_primary: true,
    notes: 'Portfolio project team enrichment PT-01',
  });
  if (!error) stats.stakeholder_links++;
}

async function firecrawlSearch(query, limit = 2) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return { web: '', results: [] };
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ query, limit, scrapeOptions: { formats: ['markdown'] } }),
    });
    if (!res.ok) return { web: '', results: [] };
    const json = await res.json();
    const results = json?.data || [];
    const web = results.map((r) => `URL: ${r.url || ''}\n${r.markdown || r.description || ''}`).join('\n\n---\n\n').slice(0, 12000);
    return { web, results };
  } catch {
    return { web: '', results: [] };
  }
}

function extractProfileHeuristic(name, results, web) {
  const profile = {
    website: null, hq_address_line1: null, hq_city: null, hq_state: null, hq_postal_code: null,
    phone: null, email: null, logo_url: null, linkedin_url: null, description: null,
    portfolio_size: null, notable_properties: [], key_people: [],
  };
  const first = results[0];
  if (first?.url && !/linkedin|facebook|instagram|twitter/i.test(first.url)) {
    try { profile.website = new URL(first.url).origin; } catch { /* ignore */ }
  }
  if (first?.description) profile.description = first.description.slice(0, 500);
  const linkedin = web.match(/https?:\/\/(?:www\.)?linkedin\.com\/company\/[^\s)"']+/i);
  if (linkedin) profile.linkedin_url = linkedin[0].replace(/[)\],.]+$/, '');
  const phone = web.match(/(?:\+1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
  if (phone) profile.phone = phone[0];
  const email = web.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (email && !/example\.com|wixpress/i.test(email[0])) profile.email = email[0];
  return (profile.website || profile.description || profile.linkedin_url) ? profile : null;
}

async function webEnrichStakeholder(name, role) {
  const query = `"${name}" ${role === 'gc' ? 'general contractor' : role === 'architect' ? 'architecture firm' : 'interior design'} headquarters contact`;
  const { web, results } = await firecrawlSearch(query, 3);
  if (!web || web.length < 120) return null;
  return extractProfileHeuristic(name, results, web);
}

async function cleanupBadGcLinks(sb, propertyIds) {
  const { data: bad } = await sb
    .from('property_stakeholders')
    .select('id, stakeholder_name')
    .in('property_id', propertyIds)
    .eq('role', 'gc');
  for (const row of bad || []) {
    if (!isBlockedGc(row.stakeholder_name)) continue;
    if (DRY) { stats.bad_links_removed++; continue; }
    const { error } = await sb.from('property_stakeholders').delete().eq('id', row.id);
    if (!error) stats.bad_links_removed++;
  }
}

async function fetchAllRows(sb, table, select, pageSize = 1000) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb.from(table).select(select).range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function main() {
  const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
  const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;
  if (!regUrl || !regKey) throw new Error('Missing Registry-iQ env');

  log(`Portfolio project team enrichment — ${DRY ? 'DRY-RUN' : 'APPLY'} [${ACTIVE_OPERATORS.join(', ')}]${ENRICH_STAKEHOLDERS ? ' + web profiles' : ''}`);

  const sb = createClient(regUrl, regKey, { auth: { persistSession: false } });

  const allProps = await fetchAllRows(
    sb,
    'property_registry',
    'id, property_name, brand_name, developer_name, owner_name, property_manager_name, gc_name, architect_name, designer_name, enrichment_sources',
  );

  const allLinks = await fetchAllRows(sb, 'property_stakeholders', 'property_id, role, stakeholder_name');
  const linksByProp = new Map();
  for (const l of allLinks || []) {
    if (!linksByProp.has(l.property_id)) linksByProp.set(l.property_id, []);
    linksByProp.get(l.property_id).push(l);
  }

  const properties = allProps.filter((p) => propertyInScope(p, linksByProp)).sort((a, b) => a.property_name.localeCompare(b.property_name));
  stats.properties = properties.length;
  log(`  Matched properties: ${stats.properties}`);

  let layoutRecords = [];
  if (AIRTABLE_PAT) {
    layoutRecords = await fetchAirtable(LAYOUT_IQ_BASE, 'Property List');
    log(`  Layout-iQ Property List: ${layoutRecords.length} records`);
  }
  const layoutByKey = layoutIqIndex(layoutRecords);

  const propIds = properties.map((p) => p.id);
  await cleanupBadGcLinks(sb, propIds);
  if (stats.bad_links_removed) log(`  Removed ${stats.bad_links_removed} blocked developer-as-GC links`);

  const { data: stakeholders } = await sb
    .from('stakeholder_registry')
    .select('id, stakeholder_name, stakeholder_type, website, description, hq_address_line1, hq_city, hq_state, hq_postal_code, phone, email, logo_url, linkedin_url, portfolio_size');
  const stakeholderIndex = new Map();
  for (const s of stakeholders || []) {
    stakeholderIndex.set(s.stakeholder_name.toUpperCase().trim(), s);
  }

  const report = [];
  const companiesToEnrich = new Set();

  for (const prop of properties) {
    const propLinks = linksByProp.get(prop.id) || [];
    const operatorKeys = detectOperators(prop, propLinks);
    const layout = layoutLookup(layoutByKey, prop.property_name);
    const team = mergeTeam(prop.property_name, layout, propLinks, operatorKeys);

    const patch = {};
    const sourceEntry = {
      type: 'portfolio_project_team',
      at: new Date().toISOString(),
      operators: operatorKeys,
      fields: team.sources,
    };
    if (team.gc && team.gc !== prop.gc_name) patch.gc_name = team.gc;
    if (team.architect && team.architect !== prop.architect_name) patch.architect_name = team.architect;
    if (team.designer && team.designer !== prop.designer_name) patch.designer_name = team.designer;

    if (Object.keys(patch).length) {
      const prev = Array.isArray(prop.enrichment_sources) ? prop.enrichment_sources : [];
      patch.enrichment_sources = [...prev.filter((s) => s.type !== 'portfolio_project_team'), sourceEntry];
      if (!DRY) {
        const { error } = await sb.from('property_registry').update(patch).eq('id', prop.id);
        if (error) log(`  ERROR property ${prop.property_name}:`, error.message);
      }
      stats.fields_updated++;
    }

    for (const [role, name] of [['gc', team.gc], ['architect', team.architect], ['designer', team.designer]]) {
      if (!name) continue;
      companiesToEnrich.add(name);
      const sid = await upsertStakeholder(sb, stakeholderIndex, name, role, null);
      if (sid) await linkPropertyStakeholder(sb, prop.id, sid, name, role);
    }

    report.push({
      property_name: prop.property_name,
      operators: operatorKeys,
      gc: team.gc,
      architect: team.architect,
      designer: team.designer,
    });
  }

  if (ENRICH_STAKEHOLDERS && companiesToEnrich.size) {
    log(`\n  Web-enriching ${companiesToEnrich.size} stakeholders...`);
    let n = 0;
    const cap = ENRICH_LIMIT || companiesToEnrich.size;
    for (const name of companiesToEnrich) {
      if (n >= cap) break;
      const key = name.toUpperCase().trim();
      const existing = stakeholderIndex.get(key);
      if (existing?.website && existing?.description) continue;
      const role = inferStakeholderType(name, 'gc');
      log(`  Research: ${name}`);
      const profile = await webEnrichStakeholder(name, role);
      if (!profile) continue;
      await upsertStakeholder(sb, stakeholderIndex, name, role, {
        ...profile,
        enrichment_sources: [{ type: 'portfolio_web_research', at: new Date().toISOString() }],
      });
      stats.web_profiles_enriched++;
      n++;
    }
  }

  writeFileSync(
    resolve(ROOT, '.firecrawl/portfolio-project-team-report.json'),
    JSON.stringify({ stats, operators: ACTIVE_OPERATORS, report, generated_at: new Date().toISOString() }, null, 2),
  );

  log('\nSummary:', JSON.stringify(stats, null, 2));
  log('Report: .firecrawl/portfolio-project-team-report.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
