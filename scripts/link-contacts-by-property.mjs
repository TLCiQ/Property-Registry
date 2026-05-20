#!/usr/bin/env node
/**
 * Link contacts to stakeholders via property graph (no email required).
 *
 * 1. contact.external_ids.property_hints → property_stakeholders on that property
 * 2. property_registry.developer_name / gc_name / owner_name → stakeholder_registry by name
 *
 * Usage:
 *   node scripts/link-contacts-by-property.mjs --dry-run
 *   node scripts/link-contacts-by-property.mjs --apply
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
const VERBOSE = process.argv.includes('--verbose');

const registryIq = createClient(
  process.env.REGISTRY_IQ_SUPABASE_URL || '',
  process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY || '',
);

const ROLE_PRIORITY = ['developer', 'owner', 'pe_firm', 'gc', 'property_manager', 'architect', 'designer', 'brand', 'other'];

const stats = {
  contacts_scanned: 0,
  contacts_without_assoc: 0,
  hints_processed: 0,
  associations_created: 0,
  associations_skipped: 0,
};

function log(msg) {
  console.log(`  ${msg}`);
}
function heading(msg) {
  console.log(`\n${'═'.repeat(60)}\n  ${msg}\n${'═'.repeat(60)}`);
}

function normalizeNameKey(name) {
  return (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
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

async function loadContactAssociationSet() {
  const assocs = await fetchAllPages('contact_stakeholder_associations', 'contact_id');
  return new Set(assocs.map((a) => a.contact_id));
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

async function ensureAssociation(contactId, stakeholderId, roleTitle) {
  if (await hasAssociation(contactId, stakeholderId)) {
    stats.associations_skipped++;
    return false;
  }
  if (DRY_RUN) {
    stats.associations_created++;
    return true;
  }
  const { error } = await registryIq.from('contact_stakeholder_associations').insert({
    contact_id: contactId,
    stakeholder_id: stakeholderId,
    role_title: roleTitle || 'property_link',
    is_primary_contact: false,
  });
  if (!error) {
    stats.associations_created++;
    return true;
  }
  if (VERBOSE) log(`  assoc err: ${error.message}`);
  return false;
}

function pickStakeholderForProperty(psRows, stakeholderById) {
  const ranked = psRows
    .map((ps) => ({ ps, stk: stakeholderById.get(ps.stakeholder_id) }))
    .filter((x) => x.stk)
    .sort((a, b) => {
      const ai = ROLE_PRIORITY.indexOf(a.ps.role || 'other');
      const bi = ROLE_PRIORITY.indexOf(b.ps.role || 'other');
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  return ranked[0] || null;
}

async function main() {
  if (!process.env.REGISTRY_IQ_SUPABASE_URL) {
    console.error('REGISTRY_IQ_SUPABASE_URL missing');
    process.exit(1);
  }

  heading(`Property graph linker (${DRY_RUN ? 'DRY RUN' : 'APPLY'})`);

  const linkedContacts = await loadContactAssociationSet();
  const contacts = await fetchAllPages(
    'contact_registry',
    'id,first_name,last_name,email,external_ids,is_active',
  );
  const active = contacts.filter((c) => c.is_active !== false);
  stats.contacts_scanned = active.length;

  const unlinked = active.filter((c) => !linkedContacts.has(c.id));
  stats.contacts_without_assoc = unlinked.length;
  log(`Unlinked contacts: ${unlinked.length} / ${active.length}`);

  const stakeholders = await fetchAllPages(
    'stakeholder_registry',
    'id,stakeholder_name,stakeholder_type,is_active',
  );
  const stakeholderById = new Map(stakeholders.map((s) => [s.id, s]));
  const propertyStakeholders = await fetchAllPages(
    'property_stakeholders',
    'property_id,stakeholder_id,role',
  );
  const psByProperty = new Map();
  for (const ps of propertyStakeholders) {
    if (!psByProperty.has(ps.property_id)) psByProperty.set(ps.property_id, []);
    psByProperty.get(ps.property_id).push(ps);
  }

  for (const c of unlinked) {
    const hints = c.external_ids?.property_hints;
    if (Array.isArray(hints) && hints.length > 0) {
      for (const h of hints) {
        if (!h?.property_id) continue;
        stats.hints_processed++;
        const psRows = psByProperty.get(h.property_id) || [];
        const pick = pickStakeholderForProperty(psRows, stakeholderById);
        if (pick) {
          const linked = await ensureAssociation(
            c.id,
            pick.stk.id,
            h.role || pick.ps.role || 'property_contact',
          );
          if (linked && VERBOSE) {
            log(`  hint ${c.first_name} ${c.last_name} → ${pick.stk.stakeholder_name}`);
          }
        }
      }
      continue;
    }
  }

  heading('Summary');
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
