#!/usr/bin/env node
/**
 * Generate data sourcing checklist / citation list for property-project families.
 *
 * Scope: schedule years 2025, 2026, 2027 × all business units (Tier-1 BUs + division aliases).
 *
 * Usage:
 *   node scripts/generate-data-sourcing-checklist.mjs
 *   node scripts/generate-data-sourcing-checklist.mjs --years=2025,2026,2027
 *   node scripts/generate-data-sourcing-checklist.mjs --persist
 */
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_YEARS,
  generateDataSourcingChecklist,
  persistDataSourcingRun,
} from './lib/data-sourcing-checklist-core.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(ROOT, f) });
  config({ path: resolve(ROOT, '../Derived State/dale-chat', f), override: true });
}

const years = (process.argv.find((a) => a.startsWith('--years='))?.split('=')[1] || DEFAULT_YEARS.join(','))
  .split(',')
  .map((s) => parseInt(s.trim(), 10));
const persist = process.argv.includes('--persist');

async function main() {
  const sb = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const result = await generateDataSourcingChecklist(sb, { years });
  const { payload, markdown } = result;

  mkdirSync(resolve(ROOT, '.firecrawl'), { recursive: true });
  const jsonPath = resolve(ROOT, '.firecrawl/data-sourcing-checklist-2025-2027.json');
  const mdPath = resolve(ROOT, 'docs/DATA_SOURCING_CHECKLIST_2025-2027.md');
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
  writeFileSync(mdPath, markdown);

  console.log(`Wrote ${mdPath}`);
  console.log(`Wrote ${jsonPath}`);
  console.log(`Families: ${payload.family_count}, projects in scope: ${payload.project_count}`);
  for (const row of payload.summary) {
    console.log(`  ${row.bu} ${row.year}: ${row.families} families, ${row.projects} projects`);
  }

  if (persist) {
    const saved = await persistDataSourcingRun(sb, result, { trigger_type: 'cli' });
    console.log(`Persisted run ${saved.id} at ${saved.run_at}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
