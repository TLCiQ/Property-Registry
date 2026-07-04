#!/usr/bin/env node
/**
 * CS-09: Enrich Core Spaces communities with GC, architect, and interior designer.
 *
 * Sources (priority):
 *   1. Curated public research (scripts/data/corespaces-project-team-curated.mjs)
 *   2. Layout-iQ Property List (Airtable)
 *   3. Existing property_stakeholders (excluding Core Spaces as GC)
 *   4. Hub brand default architect (DLR Group) when still empty
 *
 * Creates/updates stakeholder_registry + property_stakeholders; optional Firecrawl
 * profile enrichment for new/thin stakeholders.
 *
 * Usage:
 *   node scripts/enrich-corespaces-project-team.mjs --dry-run
 *   node scripts/enrich-corespaces-project-team.mjs --apply
 *   node scripts/enrich-corespaces-project-team.mjs --apply --enrich-stakeholders
 *   node scripts/enrich-corespaces-project-team.mjs --apply --enrich-stakeholders --limit=15
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import {
  lookupCurated,
  BRAND_DEFAULTS,
  GC_BLOCKLIST,
  STAKEHOLDER_TYPE_HINTS,
} from './data/corespaces-project-team-curated.mjs';

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
const LIMIT = parseInt(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0', 10) || null;
const ENRICH_LIMIT = parseInt(process.argv.find((a) => a.startsWith('--enrich-limit='))?.split('=')[1] || '0', 10) || null;
const AIRTABLE_PAT = process.env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY || '';
const LAYOUT_IQ_BASE = 'appG8wJwYkvtj4rFN';

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

function log(...args) {
  console.log(...args);
}

function normalizeNameKey(raw) {
  if (!raw) return '';
  return raw.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase()
    .replace(/^THE\s+/, '').replace(/Ō|Ō|ō/gi, 'O').replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isBlockedGc(name) {
  if (!name) return true;
  return GC_BLOCKLIST.has(name.trim().toUpperCase());
}

function inferStakeholderType(name, role) {
  if (STAKEHOLDER_TYPE_HINTS[name]) return STAKEHOLDER_TYPE_HINTS[name];
  if (role === 'gc') return 'gc';
  if (role === 'architect') return 'architect';
  if (role === 'designer' || role === 'interior_designer') return 'interior_designer';
  return 'other';
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
    const key = normalizeNameKey(name);
    byKey.set(key, {
      property_name: name,
      gc_name: f['General Contractor']?.trim() || null,
      designer_name: f['Interior Design Firm']?.trim() || null,
      architect_name: f.Architect?.trim() || f['Architect of Record']?.trim() || null,
      source: 'layout_iq',
    });
  }
  return byKey;
}

function pickBestFromLinks(links, role) {
  const names = links
    .filter((l) => l.role === role)
    .map((l) => l.stakeholder_name?.trim())
    .filter(Boolean)
    .filter((n) => role !== 'gc' || !isBlockedGc(n));
  if (!names.length) return null;
  // Prefer canonical longer names (Power Construction over PC Treehouse)
  const scored = [...new Set(names)].sort((a, b) => {
    const score = (n) => {
      let s = n.length;
      if (/construction|builders|contractors/i.test(n)) s += 20;
      if (/^pc /i.test(n)) s -= 10;
      return s;
    };
    return score(b) - score(a);
  });
  return scored[0];
}

function layoutLookup(byKey, propertyName) {
  let layout = byKey.get(normalizeNameKey(propertyName));
  if (layout) return layout;
  const hub = propertyName.match(/^Hub on Campus (.+)$/i);
  if (hub) {
    layout = byKey.get(normalizeNameKey(`HUB ${hub[1]}`));
    if (layout) return layout;
  }
  const oliv = propertyName.replace(/ō/gi, 'o').match(/^oLiv (.+)$/i);
  if (oliv) {
    layout = byKey.get(normalizeNameKey(`Oliv ${oliv[1]}`));
    if (layout) return layout;
  }
  return null;
}

function mergeTeam(propertyName, layout, links, brandName) {
  const team = { gc: null, architect: null, designer: null, sources: [] };

  const add = (field, value, source, url) => {
    if (!value || team[field]) return;
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

  const brandDefaults = brandName ? BRAND_DEFAULTS[brandName] : null;
  if (brandDefaults) {
    add('gc', brandDefaults.gc, brandDefaults.source, brandDefaults.url);
    add('architect', brandDefaults.architect, brandDefaults.source, brandDefaults.url);
    add('designer', brandDefaults.designer, brandDefaults.source, brandDefaults.url);
  }

  return team;
}

async function upsertStakeholder(sb, index, name, role, sourceMeta) {
  const key = name.toUpperCase().trim();
  let row = index.get(key);
  const stakeholder_type = inferStakeholderType(name, role);

  if (row) {
    const updates = {};
    if (!row.website && sourceMeta?.website) updates.website = sourceMeta.website;
    if (!row.description && sourceMeta?.description) updates.description = sourceMeta.description;
    if (!row.hq_city && sourceMeta?.hq_city) updates.hq_city = sourceMeta.hq_city;
    if (!row.hq_state && sourceMeta?.hq_state) updates.hq_state = sourceMeta.hq_state;
    if (!row.hq_address_line1 && sourceMeta?.hq_address_line1) updates.hq_address_line1 = sourceMeta.hq_address_line1;
    if (!row.hq_postal_code && sourceMeta?.hq_postal_code) updates.hq_postal_code = sourceMeta.hq_postal_code;
    if (!row.phone && sourceMeta?.phone) updates.phone = sourceMeta.phone;
    if (!row.email && sourceMeta?.email) updates.email = sourceMeta.email;
    if (!row.logo_url && sourceMeta?.logo_url) updates.logo_url = sourceMeta.logo_url;
    if (!row.linkedin_url && sourceMeta?.linkedin_url) updates.linkedin_url = sourceMeta.linkedin_url;
    if (!row.portfolio_size && sourceMeta?.portfolio_size) updates.portfolio_size = sourceMeta.portfolio_size;
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
    insert.external_ids = { corespaces_project_team: sourceMeta.enrichment_sources };
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
    notes: 'Core Spaces project team enrichment CS-09',
  });
  if (!error) stats.stakeholder_links++;
}

async function upsertContact(sb, stakeholderId, person) {
  if (!person?.name) return;
  const parts = person.name.trim().split(/\s+/);
  const first_name = parts[0];
  const last_name = parts.slice(1).join(' ') || 'Contact';
  if (person.email) {
    const { data: existing } = await sb.from('contact_registry')
      .select('id')
      .eq('email', person.email)
      .maybeSingle();
    if (existing?.id) return existing.id;
  }
  if (DRY) { stats.contacts_created++; return null; }
  const { data, error } = await sb.from('contact_registry').insert({
    first_name,
    last_name,
    email: person.email || null,
    phone: person.phone || null,
    title: person.title || null,
    is_active: true,
  }).select('id').single();
  if (error || !data) return null;
  stats.contacts_created++;
  if (stakeholderId && !String(stakeholderId).startsWith('dry-')) {
    await sb.from('contact_stakeholder_associations').insert({
      contact_id: data.id,
      stakeholder_id: stakeholderId,
      role_title: person.title || 'Leadership',
      is_primary: false,
    }).then(({ error: aErr }) => {
      if (aErr && !aErr.message?.includes('duplicate')) log(`  contact link warn: ${aErr.message}`);
    });
  }
  return data.id;
}

async function firecrawlSearch(query, limit = 2) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return { web: '', results: [] };
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query, limit, scrapeOptions: { formats: ['markdown'] } }),
    });
    if (!res.ok) return { web: '', results: [] };
    const json = await res.json();
    const results = json?.data || [];
    const web = results
      .map((r) => {
        const md = r.markdown || r.content || r.description || '';
        return `URL: ${r.url || r.metadata?.sourceURL || ''}\n${md}`;
      })
      .join('\n\n---\n\n')
      .slice(0, 12000);
    return { web, results };
  } catch {
    return { web: '', results: [] };
  }
}

function extractProfileHeuristic(name, results, web) {
  const profile = {
    website: null,
    hq_address_line1: null,
    hq_city: null,
    hq_state: null,
    hq_postal_code: null,
    phone: null,
    email: null,
    logo_url: null,
    linkedin_url: null,
    description: null,
    portfolio_size: null,
    notable_properties: [],
    key_people: [],
  };
  const first = results[0];
  if (first?.url && !/linkedin\.com|facebook\.com|instagram\.com|twitter\.com|youtube\.com/i.test(first.url)) {
    try {
      profile.website = new URL(first.url).origin;
    } catch { /* ignore */ }
  }
  if (first?.description) profile.description = first.description.slice(0, 500);

  const linkedin = web.match(/https?:\/\/(?:www\.)?linkedin\.com\/company\/[^\s)"']+/i);
  if (linkedin) profile.linkedin_url = linkedin[0].replace(/[)\],.]+$/, '');

  const phone = web.match(/(?:\+1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
  if (phone) profile.phone = phone[0];

  const email = web.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (email && !/example\.com|sentry\.io|wixpress/i.test(email[0])) profile.email = email[0];

  const logo = web.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp|svg)[^)]*)\)/i);
  if (logo && /logo|brand|primary/i.test(logo[0])) profile.logo_url = logo[1];

  const addr = web.match(/(\d{1,5}\s+[A-Za-z0-9.\s-]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Way|Ln|Lane)\.?)[,\s]+([A-Za-z .'-]+)[,\s]+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
  if (addr) {
    profile.hq_address_line1 = addr[1].trim();
    profile.hq_city = addr[2].trim();
    profile.hq_state = addr[3];
    profile.hq_postal_code = addr[4];
  }

  const offices = web.match(/offices?(?:\s+located)?(?:\s+in|\s+at)?\s+([^.!\n]{10,120})/i);
  if (offices && !profile.hq_city) {
    const cities = offices[1].match(/([A-Za-z .'-]+),\s*([A-Z]{2})/g);
    if (cities?.[0]) {
      const m = cities[0].match(/([A-Za-z .'-]+),\s*([A-Z]{2})/);
      if (m) { profile.hq_city = m[1].trim(); profile.hq_state = m[2]; }
    }
  }

  const hasData = profile.website || profile.description || profile.hq_city || profile.phone || profile.linkedin_url;
  return hasData ? profile : null;
}

async function webEnrichStakeholder(name, role) {
  const query = `"${name}" ${role === 'gc' ? 'general contractor' : role === 'architect' ? 'architecture firm' : 'interior design'} headquarters contact`;
  const { web, results } = await firecrawlSearch(query, 3);
  if (!web || web.length < 120) return null;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: `Extract company profile JSON from web content about "${name}". Only include facts stated in the text. Return JSON only:
{"website":null,"hq_address_line1":null,"hq_city":null,"hq_state":null,"hq_postal_code":null,"phone":null,"email":null,"logo_url":null,"linkedin_url":null,"description":null,"portfolio_size":null,"notable_properties":[],"key_people":[{"name":"","title":"","email":null,"phone":null}]}

WEB CONTENT:
${web.slice(0, 10000)}`,
        }],
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const text = json.content?.find((c) => c.type === 'text')?.text || '';
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(text.slice(start, end + 1));
        } catch { /* fall through */ }
      }
    }
  }

  return extractProfileHeuristic(name, results, web);
}

async function cleanupBadGcLinks(sb, propertyIds) {
  const { data: bad } = await sb
    .from('property_stakeholders')
    .select('id, stakeholder_name, role, property_id')
    .in('property_id', propertyIds)
    .eq('role', 'gc');
  for (const row of bad || []) {
    if (!isBlockedGc(row.stakeholder_name)) continue;
    if (DRY) { stats.bad_links_removed++; continue; }
    const { error } = await sb.from('property_stakeholders').delete().eq('id', row.id);
    if (!error) stats.bad_links_removed++;
  }
}

async function main() {
  const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
  const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;
  if (!regUrl || !regKey) throw new Error('Missing Registry-iQ env');

  log(`Core Spaces project team enrichment — ${DRY ? 'DRY-RUN' : 'APPLY'}${ENRICH_STAKEHOLDERS ? ' + web stakeholder profiles' : ''}`);

  const sb = createClient(regUrl, regKey, { auth: { persistSession: false } });

  const { data: properties, error: pErr } = await sb
    .from('property_registry')
    .select('id, property_name, brand_name, gc_name, architect_name, designer_name, external_ids, enrichment_sources')
    .not('external_ids->>prismic_id', 'is', null)
    .order('property_name');
  if (pErr) throw pErr;
  stats.properties = properties?.length || 0;
  log(`  Core Spaces properties: ${stats.properties}`);

  let layoutRecords = [];
  if (AIRTABLE_PAT) {
    layoutRecords = await fetchAirtable(LAYOUT_IQ_BASE, 'Property List');
    log(`  Layout-iQ Property List: ${layoutRecords.length} records`);
  } else {
    log('  WARN: No AIRTABLE_PAT — skipping Layout-iQ');
  }
  const layoutByKey = layoutIqIndex(layoutRecords);

  const propIds = (properties || []).map((p) => p.id);
  await cleanupBadGcLinks(sb, propIds);
  if (stats.bad_links_removed) log(`  Removed ${stats.bad_links_removed} blocked GC stakeholder links`);

  const { data: links } = await sb
    .from('property_stakeholders')
    .select('property_id, role, stakeholder_name')
    .in('property_id', propIds);
  const linksByProp = new Map();
  for (const l of links || []) {
    if (!linksByProp.has(l.property_id)) linksByProp.set(l.property_id, []);
    linksByProp.get(l.property_id).push(l);
  }

  const { data: stakeholders } = await sb
    .from('stakeholder_registry')
    .select('id, stakeholder_name, stakeholder_type, website, description, hq_address_line1, hq_city, hq_state, hq_postal_code, phone, email, logo_url, linkedin_url, portfolio_size');
  const stakeholderIndex = new Map();
  for (const s of stakeholders || []) {
    stakeholderIndex.set(s.stakeholder_name.toUpperCase().trim(), s);
  }

  const report = [];
  const companiesToEnrich = new Set();

  for (const prop of properties || []) {
    const layout = layoutLookup(layoutByKey, prop.property_name);
    const propLinks = linksByProp.get(prop.id) || [];
    const team = mergeTeam(prop.property_name, layout, propLinks, prop.brand_name);

    if (team.gc && isBlockedGc(team.gc)) {
      stats.skipped_gc_blocklist++;
      team.gc = null;
    }

    const patch = {};
    const sourceEntry = {
      type: 'corespaces_project_team',
      at: new Date().toISOString(),
      fields: team.sources,
    };
    if (team.gc && team.gc !== prop.gc_name) patch.gc_name = team.gc;
    if (team.architect && team.architect !== prop.architect_name) patch.architect_name = team.architect;
    if (team.designer && team.designer !== prop.designer_name) patch.designer_name = team.designer;

    if (Object.keys(patch).length) {
      const prev = Array.isArray(prop.enrichment_sources) ? prop.enrichment_sources : [];
      patch.enrichment_sources = [...prev.filter((s) => s.type !== 'corespaces_project_team'), sourceEntry];
      if (!DRY) {
        const { error } = await sb.from('property_registry').update(patch).eq('id', prop.id);
        if (error) log(`  ERROR property ${prop.property_name}:`, error.message);
      }
      stats.fields_updated++;
    }

    const roles = [
      ['gc', team.gc],
      ['architect', team.architect],
      ['designer', team.designer],
    ];
    for (const [role, name] of roles) {
      if (!name) continue;
      companiesToEnrich.add(name);
      const sid = await upsertStakeholder(sb, stakeholderIndex, name, role, null);
      if (sid) await linkPropertyStakeholder(sb, prop.id, sid, name, role);
    }

    report.push({
      property_name: prop.property_name,
      gc: team.gc,
      architect: team.architect,
      designer: team.designer,
      sources: team.sources.length,
    });
  }

  if (ENRICH_STAKEHOLDERS && companiesToEnrich.size) {
    log(`\n  Web-enriching up to ${ENRICH_LIMIT || LIMIT || companiesToEnrich.size} stakeholders...`);
    let n = 0;
    const enrichCap = ENRICH_LIMIT || LIMIT || companiesToEnrich.size;
    for (const name of companiesToEnrich) {
      if (n >= enrichCap) break;
      const key = name.toUpperCase().trim();
      const existing = stakeholderIndex.get(key);
      const needs = !existing?.website || !existing?.hq_city || !existing?.description;
      if (!needs) continue;
      const role = inferStakeholderType(name, 'gc');
      log(`  Research: ${name}`);
      const profile = await webEnrichStakeholder(name, role);
      if (!profile) continue;
      const meta = {
        ...profile,
        enrichment_sources: [{ type: 'rita_web_research', company: name, at: new Date().toISOString() }],
        notes: profile.notable_properties?.length
          ? `Portfolio mentions: ${profile.notable_properties.slice(0, 8).join('; ')}`
          : null,
      };
      const sid = await upsertStakeholder(sb, stakeholderIndex, name, role, meta);
      for (const person of (profile.key_people || []).slice(0, 3)) {
        await upsertContact(sb, sid, person);
      }
      stats.web_profiles_enriched++;
      n++;
    }
  }

  writeFileSync(
    resolve(ROOT, '.firecrawl/cs-project-team-report.json'),
    JSON.stringify({ stats, report, generated_at: new Date().toISOString() }, null, 2),
  );

  log('\nSummary:', JSON.stringify(stats, null, 2));
  log(`Report: .firecrawl/cs-project-team-report.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
