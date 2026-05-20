#!/usr/bin/env node
/**
 * Contact Registry remediation — normalize archaeology rows + re-harvest structured contacts.
 *
 * Phase A: Parse phones out of last_name, clean emails, deactivate junk, merge tags.
 * Phase B: Re-harvest iQ Property Registry + Layout-iQ customer contacts (structured fields).
 *
 * Usage:
 *   node scripts/remediate-contact-registry.mjs --dry-run
 *   node scripts/remediate-contact-registry.mjs --apply
 *   node scripts/remediate-contact-registry.mjs --apply --normalize-only
 *   node scripts/remediate-contact-registry.mjs --apply --reharvest-only
 *   node scripts/remediate-contact-registry.mjs --apply --domain-only
 *
 * Domain linking (Phase C) also runs standalone:
 *   node scripts/link-contacts-by-domain.mjs --apply
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, '../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const APPLY = process.argv.includes('--apply');
const DRY_RUN = !APPLY;
const NORMALIZE_ONLY = process.argv.includes('--normalize-only');
const REHARVEST_ONLY = process.argv.includes('--reharvest-only');
const DOMAIN_ONLY = process.argv.includes('--domain-only');
const VERBOSE = process.argv.includes('--verbose');

const registryIq = createClient(
  process.env.REGISTRY_IQ_SUPABASE_URL || '',
  process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY || '',
);

const AIRTABLE_PAT = process.env.AIRTABLE_PAT || '';
const IQ_PR_BASE = 'appz0l9XP1SiwQQ6c';
const LAYOUT_IQ_BASE = 'appG8wJwYkvtj4rFN';

const PHONE_RE = /(?:\+?1[-.\s]*)?(?:\(?\d{3}\)?[-.\s]*)?\d{3}[-.\s]*\d{4}/g;

const ROLE_TAGS = {
  developer_contact: ['developer'],
  property_contact: ['customer'],
  customer: ['customer'],
  purchasing_agent: ['vendor'],
  gc_contact: ['gc'],
  designer_contact: ['designer'],
  warehouse_contact: ['vendor', 'logistics'],
};

const stats = {
  contacts_scanned: 0,
  normalized: 0,
  deactivated: 0,
  phones_extracted: 0,
  emails_cleaned: 0,
  reharvest_contacts: 0,
  associations_created: 0,
  property_hints: 0,
};

function log(msg) {
  console.log(`  ${msg}`);
}
function heading(msg) {
  console.log(`\n${'═'.repeat(60)}\n  ${msg}\n${'═'.repeat(60)}`);
}

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw.trim();
}

function extractPhones(text) {
  if (!text) return [];
  const found = [];
  for (const m of text.matchAll(PHONE_RE)) {
    found.push(normalizePhone(m[0]));
  }
  return [...new Set(found)];
}

function stripPhonesFromText(text) {
  return text
    .replace(PHONE_RE, ' ')
    .replace(/\b(cell|office|direct|home|mobile|fax)\b[-:]?\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseEmails(raw) {
  if (!raw) return { primary: null, alts: [] };
  const parts = raw.split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean);
  const emails = parts.filter((p) => /@/.test(p) && !/\s/.test(p));
  return { primary: emails[0] || null, alts: emails.slice(1) };
}

function isJunkContact(first, last) {
  const full = `${first} ${last}`.toLowerCase();
  if (full.length < 4) return true;
  if (/^(warehouse|dock|shipping|receiving|advise|tbd|n\/a|unknown)$/i.test(first.trim())) return true;
  if (/^(warehouse|dock|shipping|receiving|advise)$/i.test(last.trim())) return true;
  if (last.length > 120) return true;
  return false;
}

function mergeTags(existing, add) {
  const set = new Set([...(Array.isArray(existing) ? existing : []), ...add]);
  return [...set];
}

function parseNameFields(first, last, emailRaw) {
  const combined = `${first || ''} ${last || ''}`.trim();
  const phonesFromAll = extractPhones(combined);
  if (emailRaw) phonesFromAll.push(...extractPhones(emailRaw));

  let cleaned = stripPhonesFromText(combined);
  const parts = cleaned.split(/\s+/).filter(Boolean);

  let newFirst = first;
  let newLast = last;

  if (parts.length >= 1) {
    newFirst = parts[0];
    newLast = parts.slice(1).join(' ') || '';
  }

  if (newLast.length > 60) {
    const subParts = newLast.split(/\s+/);
    newLast = subParts.slice(0, 4).join(' ');
  }

  const phone = phonesFromAll[0] || null;
  const mobile = phonesFromAll[1] || null;

  return { first_name: newFirst, last_name: newLast, phone, mobile, phonesFound: phonesFromAll.length };
}

async function fetchAllPages(table, select = '*') {
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

async function airtableFetchAll(baseId, tableName) {
  if (!AIRTABLE_PAT) throw new Error('AIRTABLE_PAT required for reharvest');
  const records = [];
  let offset;
  do {
    const path = `/v0/${baseId}/${encodeURIComponent(tableName)}?pageSize=100${offset ? `&offset=${offset}` : ''}`;
    const body = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.airtable.com',
          path,
          method: 'GET',
          headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            if (res.statusCode !== 200) {
              reject(new Error(`Airtable ${res.statusCode}: ${data.slice(0, 200)}`));
              return;
            }
            resolve(JSON.parse(data));
          });
        },
      );
      req.on('error', reject);
      req.end();
    });
    records.push(...(body.records || []));
    offset = body.offset;
    if (offset) await new Promise((r) => setTimeout(r, 220));
  } while (offset);
  return records;
}

function normalizeForMatch(raw) {
  if (!raw) return '';
  return raw
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/^THE\s+/, '')
    .replace(/-[A-Z\s]+$/i, '')
    .replace(/-/g, ' ')
    .trim();
}

async function phaseNormalize() {
  heading(`Phase A: Normalize existing contacts (${DRY_RUN ? 'DRY RUN' : 'APPLY'})`);

  const contacts = await fetchAllPages(
    'contact_registry',
    'id,first_name,last_name,email,phone,mobile,title,tags,external_ids,is_active',
  );
  stats.contacts_scanned = contacts.length;
  log(`Loaded ${contacts.length} contacts`);

  for (const c of contacts) {
    if (!c.is_active) continue;

    const parsed = parseNameFields(c.first_name, c.last_name, c.email);
    const { primary, alts } = parseEmails(c.email);

    const updates = {};
    let changed = false;

    if (parsed.first_name !== c.first_name) {
      updates.first_name = parsed.first_name;
      changed = true;
    }
    if (parsed.last_name !== c.last_name) {
      updates.last_name = parsed.last_name;
      changed = true;
    }
    if (parsed.phonesFound > 0) {
      if (!c.phone && parsed.phone) {
        updates.phone = parsed.phone;
        changed = true;
        stats.phones_extracted++;
      }
      if (!c.mobile && parsed.mobile) {
        updates.mobile = parsed.mobile;
        changed = true;
      }
    }
    if (primary && primary !== c.email) {
      updates.email = primary;
      changed = true;
      stats.emails_cleaned++;
    } else if (primary === c.email && alts.length > 0) {
      changed = true;
      stats.emails_cleaned++;
    }

    const ext = { ...(c.external_ids || {}) };
    if (alts.length > 0) {
      ext.alt_emails = alts;
      changed = true;
    }
    if (changed && Object.keys(ext).length > 0) {
      updates.external_ids = ext;
    }

    if (isJunkContact(parsed.first_name, parsed.last_name)) {
      if (DRY_RUN) {
        stats.deactivated++;
        if (VERBOSE) log(`  DEACTIVATE (junk): ${c.first_name} ${c.last_name}`);
      } else {
        await registryIq.from('contact_registry').update({ is_active: false }).eq('id', c.id);
        stats.deactivated++;
      }
      continue;
    }

    if (changed) {
      updates.updated_by = 'remediate-contact-registry';
      stats.normalized++;
      if (VERBOSE) log(`  UPDATE ${parsed.first_name} ${parsed.last_name}`);
      if (!DRY_RUN) {
        await registryIq.from('contact_registry').update(updates).eq('id', c.id);
      }
    }
  }

  log(`Normalized: ${stats.normalized}, deactivated junk: ${stats.deactivated}, phones extracted: ${stats.phones_extracted}`);
}

async function findContactByStructured(contactIndex, name, email) {
  const nameParts = name.trim().split(/\s+/);
  const first = nameParts[0];
  const last = nameParts.slice(1).join(' ') || '';
  const key = `${first} ${last}`.toUpperCase().trim();
  if (contactIndex.has(key)) return contactIndex.get(key);

  if (email) {
    const ek = email.toLowerCase().trim();
    if (contactIndex.byEmail?.has(ek)) return contactIndex.byEmail.get(ek);
  }

  const parsed = parseNameFields(first, last, null);
  const key2 = `${parsed.first_name} ${parsed.last_name}`.toUpperCase().trim();
  return contactIndex.get(key2) || null;
}

async function upsertStructuredContact(contactIndex, stakeholderIndex, contactData, propertyId, propertyName) {
  const { name, email, phone, role, title, stakeholderName } = contactData;
  if (!name || name.trim().length < 2) return null;

  const nameParts = name.trim().split(/\s+/);
  const first = nameParts[0];
  const last = nameParts.slice(1).join(' ') || '';
  const parsed = parseNameFields(first, last, null);
  const tags = ROLE_TAGS[role] || ['customer'];

  let existing = await findContactByStructured(contactIndex, name, email);

  const row = {
    first_name: parsed.first_name,
    last_name: parsed.last_name || '(unknown)',
    email: email || null,
    phone: phone || parsed.phone || null,
    mobile: parsed.mobile || null,
    title: title || null,
    tags: mergeTags(existing?.tags, tags),
    updated_by: 'remediate-contact-registry',
  };

  let contactId;

  if (existing?.id) {
    contactId = existing.id;
    const updates = {};
    for (const [k, v] of Object.entries(row)) {
      if (k === 'tags') {
        updates.tags = mergeTags(existing.tags, tags);
      } else if (v && !existing[k]) {
        updates[k] = v;
      }
    }
    const ext = { ...(existing.external_ids || {}) };
    const hints = Array.isArray(ext.property_hints) ? ext.property_hints : [];
    if (propertyId && !hints.some((h) => h.property_id === propertyId)) {
      hints.push({ property_id: propertyId, property_name: propertyName, role });
      ext.property_hints = hints;
      updates.external_ids = ext;
      stats.property_hints++;
    }
    if (Object.keys(updates).length > 0) {
      if (!DRY_RUN) await registryIq.from('contact_registry').update(updates).eq('id', contactId);
      stats.reharvest_contacts++;
    }
    Object.assign(existing, updates);
  } else {
    if (DRY_RUN) {
      stats.reharvest_contacts++;
      contactId = null;
    } else {
      const ext = {};
      if (propertyId) {
        ext.property_hints = [{ property_id: propertyId, property_name: propertyName, role }];
        stats.property_hints++;
      }
      const { data, error } = await registryIq
        .from('contact_registry')
        .insert({
          ...row,
          external_ids: ext,
          is_active: true,
          created_by: 'remediate-contact-registry',
        })
        .select('id,first_name,last_name,email,phone,mobile,title,tags,external_ids')
        .single();
      if (error) {
        if (VERBOSE) log(`  insert error ${name}: ${error.message}`);
        return null;
      }
      contactId = data.id;
      existing = data;
      const key = `${parsed.first_name} ${parsed.last_name}`.toUpperCase().trim();
      contactIndex.set(key, data);
      if (email) contactIndex.byEmail.set(email.toLowerCase(), data);
      stats.reharvest_contacts++;
    }
  }

  if (stakeholderName && contactId) {
    const stkKey = stakeholderName.toUpperCase().trim();
    const stk = stakeholderIndex.get(stkKey);
    if (stk?.id) {
      if (!DRY_RUN) {
        const { error } = await registryIq.from('contact_stakeholder_associations').insert({
          contact_id: contactId,
          stakeholder_id: stk.id,
          role_title: role?.replace(/_/g, ' ') || null,
          is_primary_contact: role === 'developer_contact' || role === 'property_contact',
        });
        if (!error) stats.associations_created++;
        else if (VERBOSE && !error.message.includes('duplicate')) log(`  assoc: ${error.message}`);
      } else {
        stats.associations_created++;
      }
    }
  }

  return contactId;
}

async function phaseReharvest() {
  heading(`Phase B: Re-harvest structured contacts (${DRY_RUN ? 'DRY RUN' : 'APPLY'})`);

  const contacts = await fetchAllPages(
    'contact_registry',
    'id,first_name,last_name,email,phone,mobile,title,tags,external_ids',
  );
  const contactIndex = new Map();
  const byEmail = new Map();
  for (const c of contacts) {
    const key = `${c.first_name} ${c.last_name}`.toUpperCase().trim();
    contactIndex.set(key, c);
    if (c.email) byEmail.set(c.email.toLowerCase().trim(), c);
  }
  contactIndex.byEmail = byEmail;

  const stakeholders = await fetchAllPages('stakeholder_registry', 'id,stakeholder_name');
  const stakeholderIndex = new Map();
  for (const s of stakeholders) {
    stakeholderIndex.set(s.stakeholder_name.toUpperCase().trim(), s);
  }

  const properties = await fetchAllPages('property_registry', 'id,property_name');
  const propIndex = new Map();
  for (const p of properties) {
    propIndex.set(normalizeForMatch(p.property_name), p);
  }

  const iqPR = await airtableFetchAll(IQ_PR_BASE, 'Properties');
  log(`iQ Property Registry: ${iqPR.length} records`);

  for (const rec of iqPR) {
    const f = rec.fields;
    const propName = f.Prprty_Name?.trim();
    if (!propName) continue;

    const prop = propIndex.get(normalizeForMatch(propName));
    const propId = prop?.id || null;
    const ownerName = f.Prprty_Ownership?.trim() || null;

    if (f.Developer_Contact_Name) {
      await upsertStructuredContact(
        contactIndex,
        stakeholderIndex,
        {
          name: f.Developer_Contact_Name.trim(),
          email: f.Developer_Contact_Email || null,
          phone: f.Developer_Contact_Phone || null,
          role: 'developer_contact',
          stakeholderName: ownerName,
        },
        propId,
        propName,
      );
    }

    if (f.Prprty_ContactName) {
      await upsertStructuredContact(
        contactIndex,
        stakeholderIndex,
        {
          name: f.Prprty_ContactName.trim(),
          email: f.Prprty_ContactEmail || null,
          phone: f.Prprty_ContactPhone || null,
          role: 'property_contact',
          stakeholderName: ownerName,
        },
        propId,
        propName,
      );
    }
  }

  const layoutCustomers = await airtableFetchAll(LAYOUT_IQ_BASE, 'Customer List');
  log(`Layout-iQ Customer List: ${layoutCustomers.length} records`);

  for (const rec of layoutCustomers) {
    const f = rec.fields;
    const company = f.Customer_Name?.trim();
    const contactName = f.Contact_Name?.trim();
    if (!contactName) continue;

    await upsertStructuredContact(
      contactIndex,
      stakeholderIndex,
      {
        name: contactName,
        email: f.Contact_Email || f.Email || null,
        phone: f.Contact_Phone || f.Phone || null,
        role: 'customer',
        title: f.Contact_Title || null,
        stakeholderName: company,
      },
      null,
      null,
    );
  }

  log(`Reharvest updates: ${stats.reharvest_contacts}, associations: ${stats.associations_created}, property_hints: ${stats.property_hints}`);
}

async function main() {
  if (!process.env.REGISTRY_IQ_SUPABASE_URL) {
    console.error('REGISTRY_IQ_SUPABASE_URL missing');
    process.exit(1);
  }

  console.log(DRY_RUN ? '\n*** DRY RUN — pass --apply to write ***\n' : '\n*** APPLY MODE ***\n');

  if (DOMAIN_ONLY) {
    const { spawnSync } = await import('child_process');
    const extra = process.argv.filter((a) => a.startsWith('--limit=') || a === '--no-web');
    const r = spawnSync(
      process.execPath,
      [resolve(__dirname, 'link-contacts-by-domain.mjs'), APPLY ? '--apply' : '--dry-run', ...extra],
      { stdio: 'inherit', cwd: resolve(__dirname, '..') },
    );
    process.exit(r.status ?? 1);
  }

  if (!REHARVEST_ONLY) await phaseNormalize();
  if (!NORMALIZE_ONLY) await phaseReharvest();

  if (!NORMALIZE_ONLY && !REHARVEST_ONLY) {
    const { spawnSync } = await import('child_process');
    const mode = APPLY ? '--apply' : '--dry-run';
    spawnSync(
      process.execPath,
      [resolve(__dirname, 'link-contacts-by-domain.mjs'), mode, '--no-web'],
      { stdio: 'inherit', cwd: resolve(__dirname, '..') },
    );
    spawnSync(
      process.execPath,
      [resolve(__dirname, 'link-contacts-by-property.mjs'), mode],
      { stdio: 'inherit', cwd: resolve(__dirname, '..') },
    );
  }

  heading('Summary');
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
