#!/usr/bin/env node
/**
 * Link contact_registry people to stakeholder_registry companies via email domain.
 *
 * 1. Build domain index from stakeholder website + email + external_ids.domains
 * 2. Link contacts whose email domain matches an existing stakeholder
 * 3. For unmatched domains: resolve company name (homepage meta → Firecrawl → heuristic)
 * 4. Create stakeholder_registry rows when no match; link contact_stakeholder_associations
 *
 * Usage:
 *   node scripts/link-contacts-by-domain.mjs --dry-run
 *   node scripts/link-contacts-by-domain.mjs --apply
 *   node scripts/link-contacts-by-domain.mjs --apply --limit=50   # cap web lookups
 *   node scripts/link-contacts-by-domain.mjs --apply --no-web     # skip HTTP/Firecrawl
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

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
const LIMIT = parseInt(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0', 10) || 0;

const registryIq = createClient(
  process.env.REGISTRY_IQ_SUPABASE_URL || '',
  process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY || '',
);

const CACHE_PATH = resolve(__dirname, '../.cache/domain-company-cache.json');

const GENERIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'msn.com', 'protonmail.com', 'proton.me',
  'comcast.net', 'att.net', 'sbcglobal.net', 'verizon.net', 'bellsouth.net',
  'mail.com', 'ymail.com', 'rocketmail.com', 'zoho.com',
]);

/** TLC / personal — do not create external stakeholder rows */
const SKIP_STAKEHOLDER_DOMAINS = new Set([
  'thelivingcompany.com', 'tlciq.com', 'tlc-iq.com', 'universityfurnishings.net',
  'blueskyinteriors.com', 'tlchospitality.com', 'corespaces.com',
]);

const KNOWN_DOMAIN_COMPANIES = {
  'goarmstrong.com': { name: 'Armstrong Transport Group', type: 'other' },
  'chipmanrelo.com': { name: 'Chipman Relocation', type: 'other' },
  'chipmenrelo.com': { name: 'Chipman Relocation', type: 'other' },
  'dircks.com': { name: 'Dircks Moving & Logistics', type: 'other' },
};

const stats = {
  contacts_with_email: 0,
  linked_existing_domain: 0,
  domains_resolved: 0,
  stakeholders_created: 0,
  stakeholders_matched_by_name: 0,
  associations_created: 0,
  associations_skipped_duplicate: 0,
  domains_skipped_generic: 0,
  domains_skipped_internal: 0,
  web_lookups: 0,
};

function log(msg) {
  console.log(`  ${msg}`);
}
function heading(msg) {
  console.log(`\n${'═'.repeat(60)}\n  ${msg}\n${'═'.repeat(60)}`);
}

function extractDomainFromEmail(email) {
  if (!email) return null;
  const first = email.split(/[\r\n,;]/)[0].trim().toLowerCase();
  const m = first.match(/@([a-z0-9.-]+\.[a-z]{2,})/i);
  if (!m) return null;
  return m[1].replace(/^www\./, '').toLowerCase();
}

function extractDomainFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function normalizeCompanyName(name) {
  return (name || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*[\|·–—-]\s*(Home|Welcome|Official Site|Homepage).*$/i, '')
    .replace(/\s+(LLC|Inc\.?|Corp\.?|Ltd\.?|Co\.?)$/i, '')
    .trim();
}

function heuristicCompanyFromDomain(domain) {
  const base = domain.split('.')[0] || domain;
  if (base.length < 3) return null;
  const spaced = base
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])(relo|moving|logistics|group|transport)/gi, '$1 $2');
  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function inferStakeholderType(companyName, contactTags = []) {
  const tags = (contactTags || []).map((t) => t.toLowerCase());
  if (tags.includes('gc')) return 'gc';
  if (tags.includes('developer')) return 'developer';
  if (tags.includes('designer')) return 'design_firm';
  if (tags.includes('vendor') || tags.includes('logistics')) return 'other';
  const n = (companyName || '').toLowerCase();
  if (/\b(general contractor|construction|builders?)\b/.test(n)) return 'gc';
  if (/\b(developer|development)\b/.test(n)) return 'developer';
  if (/\b(design|interior|architect)\b/.test(n)) return 'design_firm';
  if (/\b(relocation|moving|logistics|transport)\b/.test(n)) return 'other';
  return 'other';
}

function fetchWithTimeout(url, ms = 10000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(
      url,
      {
        timeout: ms,
        headers: {
          'User-Agent': 'TLC-iQ-Registry-Bot/1.0 (+domain-linker)',
          Accept: 'text/html',
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchWithTimeout(res.headers.location, ms).then(resolve).catch(reject);
          return;
        }
        let body = '';
        res.on('data', (c) => {
          body += c;
          if (body.length > 120_000) res.destroy();
        });
        res.on('end', () => resolve(body));
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

function parseCompanyFromHtml(html) {
  if (!html) return null;
  const og =
    html.match(/property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i)?.[1];
  const title = html.match(/<title[^>]*>([^<]{2,120})<\/title>/i)?.[1];
  const raw = og || title;
  return normalizeCompanyName(raw?.replace(/&amp;/g, '&').replace(/&#039;/g, "'"));
}

async function firecrawlCompanyName(domain) {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key || NO_WEB) return null;

  const url = `https://${domain}`;
  const body = JSON.stringify({
    url,
    formats: ['markdown'],
    timeout: 12000,
  });

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
            const name = normalizeCompanyName(
              meta?.ogSiteName || meta?.title || meta?.description?.split('.')[0],
            );
            resolve(name || null);
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
    req.on('timeout', () => {
      clearTimeout(hardStop);
      req.destroy();
      resolve(null);
    });
    req.write(body);
    req.end();
  });
}

async function resolveCompanyForDomain(domain, cache) {
  if (cache[domain]?.company_name) {
    return { ...cache[domain], source: cache[domain].source || 'cache' };
  }

  if (KNOWN_DOMAIN_COMPANIES[domain]) {
    const hit = { company_name: KNOWN_DOMAIN_COMPANIES[domain].name, stakeholder_type: KNOWN_DOMAIN_COMPANIES[domain].type, source: 'known' };
    cache[domain] = hit;
    return hit;
  }

  let company_name = null;
  let source = null;

  if (!NO_WEB) {
    stats.web_lookups++;
    for (const url of [`https://${domain}`, `https://www.${domain}`]) {
      try {
        const html = await Promise.race([
          fetchWithTimeout(url, 6000),
          sleep(6500).then(() => {
            throw new Error('timeout');
          }),
        ]);
        company_name = parseCompanyFromHtml(html);
        if (company_name && company_name.length > 2) {
          source = 'homepage';
          break;
        }
      } catch {
        /* try next */
      }
    }

    if (!company_name) {
      company_name = await firecrawlCompanyName(domain);
      if (company_name) source = 'firecrawl';
    }

    await sleep(200);
  }

  if (!company_name) {
    company_name = heuristicCompanyFromDomain(domain);
    source = 'heuristic';
  }

  const stakeholder_type = inferStakeholderType(company_name);
  const entry = { company_name, stakeholder_type, source, resolved_at: new Date().toISOString() };
  cache[domain] = entry;
  stats.domains_resolved++;
  return entry;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchAllPages(table, select) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await registryIq.from(table).select(select).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

function buildStakeholderDomainIndex(stakeholders) {
  const domainToStakeholder = new Map();

  function addDomain(domain, stakeholder) {
    if (!domain) return;
    const d = domain.toLowerCase().replace(/^www\./, '');
    if (!domainToStakeholder.has(d)) domainToStakeholder.set(d, stakeholder);
  }

  for (const s of stakeholders) {
    addDomain(extractDomainFromUrl(s.website), s);
    addDomain(extractDomainFromEmail(s.email), s);
    const ext = s.external_ids || {};
    if (Array.isArray(ext.domains)) {
      for (const d of ext.domains) addDomain(d, s);
    }
    if (typeof ext.primary_domain === 'string') addDomain(ext.primary_domain, s);
  }

  return domainToStakeholder;
}

function normalizeNameKey(name) {
  return (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function hasAssociation(contactId, stakeholderId) {
  const { data } = await registryIq
    .from('contact_stakeholder_associations')
    .select('id')
    .eq('contact_id', contactId)
    .eq('stakeholder_id', stakeholderId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function ensureAssociation(contactId, stakeholderId, roleTitle, isPrimary) {
  if (await hasAssociation(contactId, stakeholderId)) {
    stats.associations_skipped_duplicate++;
    return false;
  }

  if (DRY_RUN) {
    stats.associations_created++;
    return true;
  }

  const { error } = await registryIq.from('contact_stakeholder_associations').insert({
    contact_id: contactId,
    stakeholder_id: stakeholderId,
    role_title: roleTitle || 'contact',
    is_primary_contact: isPrimary ?? false,
  });

  if (!error) {
    stats.associations_created++;
    return true;
  }
  if (VERBOSE) log(`  assoc error: ${error.message}`);
  return false;
}

async function upsertStakeholderDomain(stakeholder, domain) {
  const ext = { ...(stakeholder.external_ids || {}) };
  const domains = new Set([...(Array.isArray(ext.domains) ? ext.domains : []), domain]);
  ext.domains = [...domains];
  if (!ext.primary_domain) ext.primary_domain = domain;
  if (!DRY_RUN) {
    await registryIq
      .from('stakeholder_registry')
      .update({ external_ids: ext, updated_at: new Date().toISOString() })
      .eq('id', stakeholder.id);
  }
}

async function createStakeholder(companyName, domain, stakeholderType) {
  const website = `https://${domain}`;
  const row = {
    stakeholder_name: companyName,
    stakeholder_type: stakeholderType || 'other',
    website,
    external_ids: {
      domains: [domain],
      primary_domain: domain,
      source: 'domain_linker',
      resolved_at: new Date().toISOString(),
    },
    is_active: true,
  };

  if (DRY_RUN) {
    stats.stakeholders_created++;
    return { id: `dry-run-${domain}`, ...row };
  }

  const { data: byName } = await registryIq
    .from('stakeholder_registry')
    .select('id, stakeholder_name, website, external_ids')
    .ilike('stakeholder_name', companyName)
    .limit(1);

  if (byName?.length) {
    stats.stakeholders_matched_by_name++;
    await upsertStakeholderDomain(byName[0], domain);
    return byName[0];
  }

  const { data, error } = await registryIq
    .from('stakeholder_registry')
    .insert(row)
    .select('id, stakeholder_name, website, external_ids')
    .single();

  if (error) {
    if (VERBOSE) log(`  create stakeholder failed ${companyName}: ${error.message}`);
    return null;
  }

  stats.stakeholders_created++;
  return data;
}

async function main() {
  if (!process.env.REGISTRY_IQ_SUPABASE_URL) {
    console.error('REGISTRY_IQ_SUPABASE_URL missing');
    process.exit(1);
  }

  heading(`Domain linker (${DRY_RUN ? 'DRY RUN' : 'APPLY'})${NO_WEB ? ' [no-web]' : ''}`);

  let cache = {};
  if (existsSync(CACHE_PATH)) {
    try {
      cache = JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
    } catch {
      cache = {};
    }
  }

  const contacts = await fetchAllPages(
    'contact_registry',
    'id,first_name,last_name,email,tags,external_ids,is_active',
  );
  const activeContacts = contacts.filter((c) => c.is_active !== false && c.email);

  const stakeholders = await fetchAllPages(
    'stakeholder_registry',
    'id,stakeholder_name,stakeholder_type,website,email,external_ids',
  );

  const domainIndex = buildStakeholderDomainIndex(stakeholders);
  const nameIndex = new Map();
  for (const s of stakeholders) {
    nameIndex.set(normalizeNameKey(s.stakeholder_name), s);
  }

  const contactsByDomain = new Map();
  for (const c of activeContacts) {
    const domain = extractDomainFromEmail(c.email);
    if (!domain) continue;
    stats.contacts_with_email++;
    if (!contactsByDomain.has(domain)) contactsByDomain.set(domain, []);
    contactsByDomain.get(domain).push(c);
  }

  log(`Contacts with email: ${stats.contacts_with_email}, unique domains: ${contactsByDomain.size}`);

  const unresolvedDomains = [];

  for (const [domain, domainContacts] of contactsByDomain) {
    if (GENERIC_EMAIL_DOMAINS.has(domain)) {
      stats.domains_skipped_generic++;
      continue;
    }
    if (SKIP_STAKEHOLDER_DOMAINS.has(domain)) {
      stats.domains_skipped_internal++;
      continue;
    }

    let stakeholder = domainIndex.get(domain);

    if (stakeholder) {
      for (const c of domainContacts) {
        const linked = await ensureAssociation(
          c.id,
          stakeholder.id,
          (c.tags || [])[0] || 'contact',
          false,
        );
        if (linked) stats.linked_existing_domain++;
      }
      await upsertStakeholderDomain(stakeholder, domain);
      continue;
    }

    unresolvedDomains.push({ domain, contacts: domainContacts });
  }

  log(`Matched existing stakeholder by domain: ${stats.linked_existing_domain}`);
  log(`Unresolved domains to research: ${unresolvedDomains.length}`);

  let processed = 0;
  for (const { domain, contacts: domainContacts } of unresolvedDomains) {
    if (LIMIT > 0 && processed >= LIMIT && !cache[domain]) {
      if (VERBOSE) log(`  skip limit: ${domain}`);
      continue;
    }
    processed++;

    const resolved = await resolveCompanyForDomain(domain, cache);
    const companyName = resolved.company_name;
    if (!companyName) continue;

    let stakeholder = domainIndex.get(domain);
    const nameKey = normalizeNameKey(companyName);
    if (!stakeholder && nameIndex.has(nameKey)) {
      stakeholder = nameIndex.get(nameKey);
      stats.stakeholders_matched_by_name++;
      await upsertStakeholderDomain(stakeholder, domain);
      domainIndex.set(domain, stakeholder);
    }

    if (!stakeholder) {
      stakeholder = await createStakeholder(companyName, domain, resolved.stakeholder_type);
      if (stakeholder) {
        domainIndex.set(domain, stakeholder);
        nameIndex.set(nameKey, stakeholder);
      }
    }

    if (!stakeholder) continue;

    for (const c of domainContacts) {
      await ensureAssociation(c.id, stakeholder.id, (c.tags || [])[0] || 'contact', false);
    }

    if (VERBOSE) log(`  ${domain} → ${companyName} (${resolved.source}) [${domainContacts.length} contacts]`);
  }

  if (!DRY_RUN) {
    mkdirSync(dirname(CACHE_PATH), { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  }

  heading('Summary');
  console.log(JSON.stringify(stats, null, 2));
  if (DRY_RUN) console.log('\nPass --apply to write associations and new stakeholders.\n');
  process.stdout.write('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
