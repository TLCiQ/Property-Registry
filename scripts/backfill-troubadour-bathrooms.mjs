#!/usr/bin/env node
/**
 * Backfill property_unit_types.bathrooms for Troubadour from matrix bath shop-drawing columns.
 *
 *   node scripts/backfill-troubadour-bathrooms.mjs --dry-run
 *   node scripts/backfill-troubadour-bathrooms.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFiles } from './lib/property-image-ingest.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DRY = !process.argv.includes('--apply');
const PROPERTY_ID = '095960e3-5b22-4a0c-9528-e3843fed3ede';
const MATRIX_JSON = resolve(ROOT, '.firecrawl/troubadour-matrix.json');

loadEnvFiles(readFileSync, existsSync, resolve, [
  resolve(ROOT, '.env.local'),
  resolve(ROOT, '.env'),
  resolve(ROOT, '../Derived State/dale-chat/.env.local'),
  resolve(ROOT, '../Derived State/dale-chat/.env'),
]);

async function main() {
  if (!process.env.REGISTRY_IQ_SUPABASE_URL || !process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Registry-iQ env');
  }

  execSync('python3 scripts/extract-troubadour-matrix.py', { cwd: ROOT, stdio: 'inherit' });
  const matrix = JSON.parse(readFileSync(MATRIX_JSON, 'utf8'));

  const reg = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  console.log(`Troubadour bathrooms (${DRY ? 'DRY-RUN' : 'APPLY'})`);
  if (matrix.type_bath_inconsistent && Object.keys(matrix.type_bath_inconsistent).length) {
    console.log('  WARN inconsistent bath counts (using max):', matrix.type_bath_inconsistent);
  }

  let updated = 0;
  let totalBaths = 0;
  for (const t of matrix.unit_types) {
    const baths = t.bathrooms ?? 0;
    totalBaths += baths * (t.unit_count ?? 0);
    console.log(`  ${t.unit_type_name}: ${baths} bath × ${t.unit_count} units`);
    if (DRY) continue;
    const { error } = await reg
      .from('property_unit_types')
      .update({ bathrooms: baths })
      .eq('property_id', PROPERTY_ID)
      .eq('unit_type_name', t.unit_type_name);
    if (error) throw new Error(`${t.unit_type_name}: ${error.message}`);
    updated++;
  }

  console.log(`  Total baths rollup: ${totalBaths}`);
  if (!DRY) console.log(`  Updated ${updated} unit types`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
