#!/usr/bin/env node
/**
 * Reparse DALE-Demand install_schedules → contact_registry + stakeholder_registry.
 *
 * Extracts:
 *   - warehouse_contact (+ warehouse_email) → people, tags: vendor, logistics
 *   - warehouse_address line 1 → warehouse vendor company (stakeholder)
 *   - on_site_installer → install crew / vendor contact, tags: vendor
 *
 * Then resolves company names from email domains (homepage + Firecrawl API).
 *
 * Usage:
 *   node scripts/reparse-install-schedules-contacts.mjs --dry-run
 *   node scripts/reparse-install-schedules-contacts.mjs --apply
 *   node scripts/reparse-install-schedules-contacts.mjs --apply --no-web
 *   node scripts/reparse-install-schedules-contacts.mjs --apply --firecrawl-limit=40
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnvFile(resolve(__dirname, '../.env.local'));
loadEnvFile(resolve(__dirname, '../../Derived State/dale-chat/.env.local'));

const APPLY = process.argv.includes('--apply');
const DRY_RUN = !APPLY;
const NO_WEB = process.argv.includes('--no-web');
const VERBOSE = process.argv.includes('--verbose');
const FIRECRAWL_LIMIT =
  parseInt(process.argv.find((a) => a.startsWith('--firecrawl-limit='))?.split('=')[1] || '0', 10) || 0;

const demand = createClient(
  process.env.DALE_DEMAND_SUPABASE_URL || '',
  process.env.DALE_DEMAND_SUPABASE_SERVICE_ROLE_KEY || process.env.DALE_DEMAND_SUPABASE_KEY || '',
  { auth: { persistSession: false } },
);

const registryIq = createClient(
  process.env.REGISTRY_IQ_SUPABASE_URL || '',
  process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY || '',
);

const CACHE_PATH = resolve(__dirname, '../.cache/domain-company-cache.json');
const PHONE_RE = /(?:\+?1[-.\s]*)?(?:\(?\d{3}\)?[-.\s]*)?\d{3}[-.\s]*\d{4}/g;

const stats = {
  schedule_rows: 0,
  rows_with_warehouse: 0,
  rows_with_installer: 0,
  contacts_upserted: 0,
  stakeholders_upserted: 0,
  associations_created: 0,
  associations_skipped: 0,
  property_hints_added: 0,
  domains_for_firecrawl: 0,
  firecrawl_resolved: 0,
};

function log(msg) {
  console.log(`  ${msg}`);
}
function heading(msg) {
  console.log(`\n${'═'.repeat(60)}\n  ${msg}\n${'═'.repeat(60)}`);
}

/* ─── Contact blob parsing (from sync-install-schedules-to-registry.mjs) ─── */

function extractEmailFromSegment(segment) {
  const m = String(segment).match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : null;
}

function isNoiseLine(s) {
  const t = String(s).trim();
  if (t.length < 2) return true;
  if (!/[a-zA-Z]/.test(t) && /^\d[\d\s.\-()]{6,}$/.test(t.replace(/\s/g, ''))) return true;
  if (/^[\d\s.\-/]{4,}$/.test(t) && !/[a-zA-Z]/.test(t)) return true;
  return false;
}

function cleanContactLine(line) {
  let s = String(line).trim();
  if (!s) return '';
  s = s.replace(/^Ops\s*Mgr\s*|^CSMgr\s*|^CSTeam\s*/gi, '');
  s = s.replace(/^O:\s*|^C:\s*|^D:\s*/i, '');
  s = s.replace(/\s+\d{3}[-.]?\d{3}[-.]?\d{4}\s*$/g, '').trim();
  return s.trim();
}

function splitContactBlob(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const s = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const chunks = [];
  for (const line of s.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.includes(';') && trimmed.length > 40) {
      for (const part of trimmed.split(';')) {
        const p = part.trim();
        if (p) chunks.push(p);
      }
    } else if (
      trimmed.includes('/') &&
      trimmed.length < 150 &&
      !trimmed.includes('://') &&
      !trimmed.includes('@')
    ) {
      const parts = trimmed.split('/').map((x) => x.trim()).filter(Boolean);
      if (parts.length >= 2 && parts.every((p) => p.length < 80 && /[a-zA-Z]/.test(p))) {
        for (const p of parts) chunks.push(p);
      } else {
        chunks.push(trimmed);
      }
    } else {
      chunks.push(trimmed);
    }
  }
  const out = [];
  const seen = new Set();
  for (const chunk of chunks) {
    const cleaned = cleanContactLine(chunk);
    if (!cleaned || isNoiseLine(cleaned)) continue;
    const key = cleaned.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned.slice(0, 500));
    if (out.length >= 25) break;
  }
  return out;
}

function parsePersonName(raw, fallbackEmail) {
  const phones = [];
  for (const m of String(raw).matchAll(PHONE_RE)) phones.push(m[0]);
  let text = String(raw).replace(PHONE_RE, ' ').trim();
  const email = extractEmailFromSegment(text) || fallbackEmail || null;
  if (email) text = text.replace(email, '').trim();
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' ') || '(unknown)',
    email,
    phone: phones[0] || null,
    mobile: phones[1] || null,
  };
}

function warehouseCompanyFromAddress(addr) {
  if (!addr || typeof addr !== 'string') return null;
  const lines = addr.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const first = lines[0];
  if (/^\d+\s/.test(first) && first.length > 40) return null;
  if (/^(suite|ste|unit|#)\s/i.test(first)) return null;
  return first.slice(0, 200);
}

function extractDomain(email) {
  if (!email) return null;
  const m = String(email).split(/[\r\n,;]/)[0].trim().toLowerCase().match(/@([a-z0-9.-]+\.[a-z]{2,})/i);
  return m ? m[1].replace(/^www\./, '') : null;
}

function normalizeNameKey(name) {
  return (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function fetchAllDemand(table) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await demand.from(table).select('*').range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

async function fetchAllRegistry(table, select) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await registryIq.from(table).select(select).range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

async function fetchInstallSchedules() {
  try {
    return { rows: await fetchAllDemand('install_schedules_enriched'), table: 'install_schedules_enriched' };
  } catch {
    return { rows: await fetchAllDemand('install_schedules'), table: 'install_schedules' };
  }
}

async function buildProjectIndex() {
  const projects = await fetchAllRegistry('project_registry', 'id,project_id,property_id,project_name');
  const byDeal = new Map();
  for (const p of projects) {
    if (p.project_id) byDeal.set(String(p.project_id).trim(), p);
    const base = String(p.project_id || '').replace(/-I$/i, '').replace(/-D$/i, '');
    if (base && !byDeal.has(base)) byDeal.set(base, p);
  }
  return byDeal;
}

const contactByKey = new Map();
const stakeholderByName = new Map();
const stakeholderByDomain = new Map();
const pendingDomains = new Set();

function mergeTags(existing, add) {
  return [...new Set([...(Array.isArray(existing) ? existing : []), ...add])];
}

async function findOrCreateContact(person, role, dealContext) {
  const key = `${person.first_name}|${person.last_name}|${person.email || ''}`.toUpperCase();
  let existing = contactByKey.get(key);

  if (!existing && person.email) {
    const { data } = await registryIq
      .from('contact_registry')
      .select('id,first_name,last_name,email,phone,mobile,tags,external_ids')
      .eq('email', person.email)
      .limit(1)
      .maybeSingle();
    if (data) existing = data;
  }

  const tags = role === 'warehouse_contact' ? ['vendor', 'logistics'] : ['vendor'];
  const hint =
    dealContext?.property_id
      ? {
          property_id: dealContext.property_id,
          property_name: dealContext.project_name || dealContext.project_id,
          role,
          deal_number: dealContext.deal_number,
        }
      : null;

  if (existing) {
    const updates = {};
    if (!existing.phone && person.phone) updates.phone = person.phone;
    if (!existing.mobile && person.mobile) updates.mobile = person.mobile;
    if (!existing.email && person.email) updates.email = person.email;
    updates.tags = mergeTags(existing.tags, tags);
    if (hint) {
      const ext = { ...(existing.external_ids || {}) };
      const hints = Array.isArray(ext.property_hints) ? ext.property_hints : [];
      if (!hints.some((h) => h.property_id === hint.property_id && h.role === role)) {
        hints.push(hint);
        ext.property_hints = hints;
        updates.external_ids = ext;
        stats.property_hints_added++;
      }
    }
    if (Object.keys(updates).length > 0 && !DRY_RUN) {
      await registryIq.from('contact_registry').update(updates).eq('id', existing.id);
      Object.assign(existing, updates);
    }
    contactByKey.set(key, existing);
    return existing.id;
  }

  const ext = hint ? { property_hints: [hint], source: 'install_schedules_reparse' } : { source: 'install_schedules_reparse' };
  const row = {
    first_name: person.first_name,
    last_name: person.last_name,
    email: person.email,
    phone: person.phone,
    mobile: person.mobile,
    tags,
    external_ids: ext,
    is_active: true,
    created_by: 'reparse-install-schedules-contacts',
  };

  if (DRY_RUN) {
    stats.contacts_upserted++;
    const fake = { id: `dry-${key}`, ...row };
    contactByKey.set(key, fake);
    if (person.email) pendingDomains.add(extractDomain(person.email));
    return fake.id;
  }

  const { data, error } = await registryIq.from('contact_registry').insert(row).select('id,email,tags,external_ids').single();
  if (error) {
    if (VERBOSE) log(`contact insert: ${error.message}`);
    return null;
  }
  stats.contacts_upserted++;
  contactByKey.set(key, data);
  if (person.email) pendingDomains.add(extractDomain(person.email));
  if (hint) stats.property_hints_added++;
  return data.id;
}

async function findOrCreateStakeholder(companyName, domain, type = 'other') {
  const name = companyName?.trim();
  if (!name || name.length < 2) return null;

  const nk = normalizeNameKey(name);
  let stk = stakeholderByName.get(nk);

  if (!stk && domain) stk = stakeholderByDomain.get(domain);

  if (!stk && !DRY_RUN) {
    const { data } = await registryIq
      .from('stakeholder_registry')
      .select('id,stakeholder_name,external_ids')
      .ilike('stakeholder_name', name)
      .limit(1)
      .maybeSingle();
    if (data) stk = data;
  }

  const extBase = {
    source: 'install_schedules_reparse',
    ...(domain ? { domains: [domain], primary_domain: domain } : {}),
  };

  if (stk) {
    if (domain && !DRY_RUN) {
      const ext = { ...(stk.external_ids || {}), ...extBase };
      const domains = new Set([...(ext.domains || []), domain]);
      ext.domains = [...domains];
      await registryIq.from('stakeholder_registry').update({ external_ids: ext }).eq('id', stk.id);
    }
    stakeholderByName.set(nk, stk);
    if (domain) stakeholderByDomain.set(domain, stk);
    return stk.id;
  }

  if (DRY_RUN) {
    stats.stakeholders_upserted++;
    const fake = { id: `dry-stk-${nk}`, stakeholder_name: name };
    stakeholderByName.set(nk, fake);
    if (domain) stakeholderByDomain.set(domain, fake);
    return fake.id;
  }

  const { data, error } = await registryIq
    .from('stakeholder_registry')
    .insert({
      stakeholder_name: name,
      stakeholder_type: type,
      website: domain ? `https://${domain}` : null,
      external_ids: extBase,
      is_active: true,
    })
    .select('id,stakeholder_name,external_ids')
    .single();

  if (error) {
    if (VERBOSE) log(`stakeholder insert ${name}: ${error.message}`);
    return null;
  }
  stats.stakeholders_upserted++;
  stakeholderByName.set(nk, data);
  if (domain) stakeholderByDomain.set(domain, data);
  return data.id;
}

async function ensureAssociation(contactId, stakeholderId, roleTitle) {
  if (!contactId || !stakeholderId || String(contactId).startsWith('dry-')) {
    if (DRY_RUN) stats.associations_created++;
    return;
  }

  const { data } = await registryIq
    .from('contact_stakeholder_associations')
    .select('id')
    .eq('contact_id', contactId)
    .eq('stakeholder_id', stakeholderId)
    .limit(1);

  if (data?.length) {
    stats.associations_skipped++;
    return;
  }

  if (DRY_RUN) {
    stats.associations_created++;
    return;
  }

  const { error } = await registryIq.from('contact_stakeholder_associations').insert({
    contact_id: contactId,
    stakeholder_id: stakeholderId,
    role_title: roleTitle,
    is_primary_contact: false,
  });
  if (!error) stats.associations_created++;
}

async function processScheduleRow(row, projectByDeal) {
  const deal = row.deal_number?.trim();
  if (!deal) return;

  const proj =
    projectByDeal.get(deal) ||
    projectByDeal.get(deal.replace(/-I$/i, '').replace(/-D$/i, ''));
  const ctx = proj
    ? {
        deal_number: deal,
        project_id: proj.project_id,
        property_id: proj.property_id,
        project_name: proj.project_name,
      }
    : { deal_number: deal };

  const whEmail = row.warehouse_email?.trim() || null;
  const whAddr = row.warehouse_address?.trim() || null;
  const whContactRaw = row.warehouse_contact?.trim() || null;
  const installerRaw = row.on_site_installer?.trim() || null;

  if (whContactRaw || whEmail || whAddr) stats.rows_with_warehouse++;
  if (installerRaw) stats.rows_with_installer++;

  let warehouseStkId = null;
  const whCompany = warehouseCompanyFromAddress(whAddr);
  const domain = extractDomain(whEmail);

  if (whCompany) {
    warehouseStkId = await findOrCreateStakeholder(whCompany, domain, 'other');
  } else if (domain) {
    pendingDomains.add(domain);
  }

  if (whContactRaw || whEmail) {
    const segments = whContactRaw ? splitContactBlob(whContactRaw) : [];
    const list = segments.length ? segments : whEmail ? [whEmail] : [];
    for (let i = 0; i < list.length; i++) {
      const seg = list[i];
      const email = extractEmailFromSegment(seg) || (list.length === 1 ? whEmail : null);
      const person = parsePersonName(seg, email);
      if (!person || person.first_name.length < 2) continue;
      const cid = await findOrCreateContact(person, 'warehouse_contact', ctx);
      if (cid && warehouseStkId) await ensureAssociation(cid, warehouseStkId, 'warehouse_contact');
      else if (cid && domain && !warehouseStkId) pendingDomains.add(domain);
    }
  }

  if (installerRaw) {
    const segments = splitContactBlob(installerRaw);
    const list = segments.length ? segments : [installerRaw];
    for (const seg of list) {
      const email = extractEmailFromSegment(seg);
      const person = parsePersonName(seg, email);
      if (!person || person.first_name.length < 2) continue;
      const cid = await findOrCreateContact(person, 'on_site_installer', ctx);
      if (email) {
        const d = extractDomain(email);
        if (d) pendingDomains.add(d);
        const stkId = await findOrCreateStakeholder(
          heuristicCompanyFromDomain(d) || d,
          d,
          'other',
        );
        if (cid && stkId) await ensureAssociation(cid, stkId, 'on_site_installer');
      }
    }
  }
}

function heuristicCompanyFromDomain(domain) {
  const base = domain.split('.')[0] || domain;
  return base
    .replace(/[-_]/g, ' ')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* Firecrawl helpers (subset of link-contacts-by-domain.mjs) */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchWithTimeout(url, ms = 8000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: ms, headers: { 'User-Agent': 'TLC-iQ-Registry/1.0' } }, (res) => {
      let body = '';
      res.on('data', (c) => {
        body += c;
        if (body.length > 100000) res.destroy();
      });
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

function parseCompanyFromHtml(html) {
  const title = html?.match(/<title[^>]*>([^<]{2,120})<\/title>/i)?.[1];
  return title?.replace(/\s*[\|·–-].*$/, '').trim() || null;
}

async function firecrawlCompanyName(domain) {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key || NO_WEB) return null;
  const body = JSON.stringify({ url: `https://${domain}`, formats: ['markdown'], timeout: 12000 });
  return new Promise((resolve) => {
    let req;
    const hardStop = setTimeout(() => {
      req?.destroy();
      resolve(null);
    }, 14000);
    req = https.request(
      {
        hostname: 'api.firecrawl.dev',
        path: '/v1/scrape',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 12000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          clearTimeout(hardStop);
          try {
            const json = JSON.parse(data);
            const meta = json?.data?.metadata || json?.metadata;
            resolve(meta?.ogSiteName || meta?.title || null);
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.on('error', () => {
      clearTimeout(hardStop);
      resolve(null);
    });
    req.write(body);
    req.end();
  });
}

async function resolveDomainsWithFirecrawl() {
  heading(`Domain → company (${NO_WEB ? 'heuristic only' : 'homepage + Firecrawl'})`);

  let cache = {};
  if (existsSync(CACHE_PATH)) {
    try {
      cache = JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
    } catch {
      cache = {};
    }
  }

  const domains = [...pendingDomains].filter(Boolean);
  stats.domains_for_firecrawl = domains.length;
  log(`Unique domains to resolve: ${domains.length}`);

  let fcCount = 0;
  for (const domain of domains) {
    if (stakeholderByDomain.has(domain)) continue;
    if (FIRECRAWL_LIMIT > 0 && fcCount >= FIRECRAWL_LIMIT) break;

    let company = cache[domain]?.company_name || null;
    let source = cache[domain]?.source;

    if (!company && !NO_WEB) {
      fcCount++;
      try {
        const html = await fetchWithTimeout(`https://${domain}`, 6000);
        company = parseCompanyFromHtml(html);
        if (company) source = 'homepage';
      } catch {
        /* */
      }
      if (!company) {
        company = await firecrawlCompanyName(domain);
        if (company) source = 'firecrawl';
      }
      await sleep(250);
    }

    if (!company) {
      company = heuristicCompanyFromDomain(domain);
      source = 'heuristic';
    }

    cache[domain] = { company_name: company, source, resolved_at: new Date().toISOString() };
    await findOrCreateStakeholder(company, domain, 'other');
    stats.firecrawl_resolved++;
    if (VERBOSE) log(`  ${domain} → ${company} (${source})`);
  }

  if (!DRY_RUN) {
    mkdirSync(dirname(CACHE_PATH), { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  }

  if (!NO_WEB && domains.length > 0) {
    log('Running link-contacts-by-domain for email↔company associations…');
    spawnSync(
      process.execPath,
      [
        resolve(__dirname, 'link-contacts-by-domain.mjs'),
        APPLY ? '--apply' : '--dry-run',
        ...(NO_WEB ? ['--no-web'] : []),
      ],
      { stdio: 'inherit', cwd: resolve(__dirname, '..') },
    );
  }
}

async function main() {
  if (!process.env.DALE_DEMAND_SUPABASE_URL || !process.env.REGISTRY_IQ_SUPABASE_URL) {
    console.error('Missing DALE_DEMAND or REGISTRY_IQ env');
    process.exit(1);
  }

  heading(`Install schedule contact reparse (${DRY_RUN ? 'DRY RUN' : 'APPLY'})`);

  const stakeholders = await fetchAllRegistry('stakeholder_registry', 'id,stakeholder_name,website,email,external_ids');
  for (const s of stakeholders) {
    stakeholderByName.set(normalizeNameKey(s.stakeholder_name), s);
    const d = extractDomain(s.email);
    if (d) stakeholderByDomain.set(d, s);
    for (const dom of s.external_ids?.domains || []) {
      stakeholderByDomain.set(dom, s);
    }
  }

  const { rows, table } = await fetchInstallSchedules();
  log(`Source: ${table}, rows=${rows.length}`);
  stats.schedule_rows = rows.length;

  const projectByDeal = await buildProjectIndex();
  log(`Project index: ${projectByDeal.size} deal keys`);

  for (const row of rows) {
    await processScheduleRow(row, projectByDeal);
  }

  heading('Pass 1 summary');
  console.log(JSON.stringify(stats, null, 2));

  await resolveDomainsWithFirecrawl();

  heading('Final');
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
