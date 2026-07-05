#!/usr/bin/env node
/**
 * Troubadour: per-level architectural overall floor plans → Cloudinary → property_floors.
 *
 * Sources (Box 25019):
 *   Levels 1–6: PROJECT PLANS/PR 09 PDF Files/A2-0N - LEVEL N - OVERALL FLOOR PLAN.pdf
 *   Level 7:    ESTIMATING/PRECON/Architectural/A2.07-LEVEL-7---OVERALL-FLOOR-PLAN-Rev.0.pdf
 *               (no A2-07 in PR 09 set)
 *
 * Usage:
 *   node scripts/ingest-troubadour-floor-plans.mjs --dry-run
 *   node scripts/ingest-troubadour-floor-plans.mjs --apply
 *   node scripts/ingest-troubadour-floor-plans.mjs --apply --via-box-api
 *   node scripts/ingest-troubadour-floor-plans.mjs --apply --staging-dir=/tmp/troubadour-floor-plans
 */
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { existsSync, readFileSync, statSync, writeFileSync, openSync, readSync, closeSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFiles } from './lib/property-image-ingest.mjs';
import {
  getBoxAccessToken,
  resolveFloorPlanFile,
  downloadBoxFile,
} from './lib/box-api-download.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
loadEnvFiles(readFileSync, existsSync, resolve, [
  resolve(ROOT, '.env.local'),
  resolve(ROOT, '.env'),
  resolve(ROOT, '../Derived State/dale-chat/.env.local'),
  resolve(ROOT, '../Derived State/dale-chat/.env'),
  resolve(ROOT, '../NetSuite-iQ/.env.local'),
]);
// Box-iQ app (CCG enterprise) — alternate to BOX_CLIENT_* which may lack subject authorization
const nsEnv = resolve(ROOT, '../NetSuite-iQ/.env.local');
if (existsSync(nsEnv)) {
  for (const line of readFileSync(nsEnv, 'utf8').split('\n')) {
    const id = line.match(/^Box client id\s+(\S+)/i);
    const sec = line.match(/^Box client secret\s+(\S+)/i);
    if (id) process.env.BOX_IQ_CLIENT_ID = id[1].trim();
    if (sec) process.env.BOX_IQ_CLIENT_SECRET = sec[1].trim();
  }
}

const DRY = !process.argv.includes('--apply');
const METADATA_ONLY = process.argv.includes('--metadata-only');
const STAGING_DIR = process.argv.find((a) => a.startsWith('--staging-dir='))?.split('=')[1] || null;
const VIA_BOX_API = process.argv.includes('--via-box-api');
const BOX_STAGING = resolve(STAGING_DIR || join(ROOT, '.cache/troubadour-floor-plans-box'));
const PROPERTY_ID = '095960e3-5b22-4a0c-9528-e3843fed3ede';
const REPORT_JSON = resolve(ROOT, '.firecrawl/troubadour-floor-plans-report.json');

const BOX = '/Users/geoffreyjackson/Library/CloudStorage/Box-Box/Team Folder/Projects/25019-Lubbock, TX - 14th Street SH';
const PLANS_DIR = `${BOX}/PROJECT MANAGING/SHOP DRAWINGS/PROJECT PLANS/PR 09 PDF Files`;
const PRECON_ARCH = `${BOX}/ESTIMATING/PRECON DOCUMENTS/060925/Architectural`;

const LEVEL_SOURCES = {
  1: { file: `${PLANS_DIR}/A2-01 - LEVEL 1 - OVERALL FLOOR PLAN.pdf`, sheet: 'A2-01', label: 'Level 1 — overall floor plan' },
  2: { file: `${PLANS_DIR}/A2-02 - LEVEL 2 - OVERALL FLOOR PLAN.pdf`, sheet: 'A2-02', label: 'Level 2 — overall floor plan' },
  3: { file: `${PLANS_DIR}/A2-03 - LEVEL 3 - OVERALL FLOOR PLAN.pdf`, sheet: 'A2-03', label: 'Level 3 — overall floor plan' },
  4: { file: `${PLANS_DIR}/A2-04 - LEVEL 4 - OVERALL FLOOR PLAN.pdf`, sheet: 'A2-04', label: 'Level 4 — overall floor plan' },
  5: { file: `${PLANS_DIR}/A2-05 - LEVEL 5 - OVERALL FLOOR PLAN.pdf`, sheet: 'A2-05', label: 'Level 5 — overall floor plan' },
  6: { file: `${PLANS_DIR}/A2-06 - LEVEL 6 - OVERALL FLOOR PLAN.pdf`, sheet: 'A2-06', label: 'Level 6 — overall floor plan' },
  7: {
    file: `${PRECON_ARCH}/A2.07-LEVEL-7---OVERALL-FLOOR-PLAN-Rev.0.pdf`,
    sheet: 'A2.07',
    label: 'Level 7 — overall floor plan (Precon Rev.0; not in PR-09 set)',
  },
};

function fileReady(path, minBytes = 1000) {
  try {
    const st = statSync(path);
    if (st.size < minBytes) return false;
    const fd = openSync(path, 'r');
    const buf = Buffer.alloc(5);
    readSync(fd, buf, 0, 5, 0);
    closeSync(fd);
    return buf[0] === 0x25; // %PDF
  } catch {
    return false;
  }
}

function configureCloudinary() {
  const m = (process.env.CLOUDINARY_URL || '').match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (m) {
    cloudinary.config({ api_key: m[1], api_secret: m[2], cloud_name: m[3] });
    return true;
  }
  return false;
}

function pngUrl(publicId, width) {
  return cloudinary.url(publicId, {
    resource_type: 'image',
    format: 'png',
    transformation: [{ page: 1, width, crop: 'fit' }],
  });
}

async function uploadPdf(localPath, publicId, attempt = 1) {
  try {
    const r = await cloudinary.uploader.upload(localPath, {
      public_id: publicId,
      overwrite: true,
      resource_type: 'image',
      timeout: 180000,
    });
    return {
      pdf_url: r.secure_url,
      pages: r.pages ?? null,
      png_url: pngUrl(publicId, 480),
      full_png_url: pngUrl(publicId, 1600),
    };
  } catch (e) {
    if (attempt < 3) {
      console.log(`    retry ${attempt + 1}/3 for ${publicId}…`);
      await new Promise((r) => setTimeout(r, 3000 * attempt));
      return uploadPdf(localPath, publicId, attempt + 1);
    }
    throw e;
  }
}

function resolveUploadPath(spec) {
  if (STAGING_DIR) {
    const staged = resolve(STAGING_DIR, spec.file.split('/').pop());
    if (existsSync(staged) && fileReady(staged)) return staged;
  }
  if (VIA_BOX_API) {
    const staged = join(BOX_STAGING, spec.file.split('/').pop());
    if (existsSync(staged) && fileReady(staged)) return staged;
  }
  return spec.file;
}

async function hydrateFromBoxApi(specs) {
  if (DRY || METADATA_ONLY) return { downloaded: 0, token_ok: true };
  console.log('  Box API: authenticating…');
  const token = await getBoxAccessToken();
  mkdirSync(BOX_STAGING, { recursive: true });
  let downloaded = 0;
  for (const spec of specs) {
    const dest = join(BOX_STAGING, spec.file.split('/').pop());
    if (existsSync(dest) && fileReady(dest)) {
      console.log(`  Box API: cached ${spec.sheet}`);
      continue;
    }
    const hit = await resolveFloorPlanFile(token, spec.file.split('/').pop());
    if (!hit) {
      console.log(`  Box API: not found ${spec.sheet} (${spec.file.split('/').pop()})`);
      continue;
    }
    console.log(`  Box API: downloading ${hit.name} (${hit.id})…`);
    await downloadBoxFile(token, hit.id, dest);
    downloaded++;
  }
  return { downloaded, token_ok: true };
}

async function main() {
  const regUrl = process.env.REGISTRY_IQ_SUPABASE_URL;
  const regKey = process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY;
  if (!regUrl || !regKey) {
    console.error('Missing REGISTRY_IQ credentials');
    process.exit(1);
  }
  if (!configureCloudinary() && !METADATA_ONLY) {
    console.error('Missing Cloudinary config');
    process.exit(1);
  }

  const reg = createClient(regUrl, regKey, { auth: { persistSession: false } });
  const gaps = [];
  const applied = [];

  const { data: floors, error: fErr } = await reg
    .from('property_floors')
    .select('id, floor_number, floor_label, building_id, property_buildings!inner(property_id, building_number)')
    .eq('property_buildings.property_id', PROPERTY_ID)
    .order('floor_number');
  if (fErr) throw new Error(fErr.message);

  console.log(`Troubadour floor plans (${DRY ? 'DRY-RUN' : 'APPLY'}${METADATA_ONLY ? ', metadata-only' : ''}${VIA_BOX_API ? ', box-api' : ''}${STAGING_DIR ? `, staging=${STAGING_DIR}` : ''}) — ${floors?.length ?? 0} registry floors`);

  const specList = Object.values(LEVEL_SOURCES);
  if (VIA_BOX_API && !METADATA_ONLY) {
    try {
      const api = await hydrateFromBoxApi(specList);
      console.log(`  Box API: ${api.downloaded} file(s) downloaded to ${BOX_STAGING}`);
    } catch (e) {
      console.error(`  Box API failed: ${e.message}`);
      console.error('  Fix BOX_CLIENT_* CCG credentials or use --staging-dir with offline copies.');
      if (!DRY) process.exit(1);
    }
  }

  for (const fl of floors || []) {
    const lvl = fl.floor_number;
    const spec = LEVEL_SOURCES[lvl];
    if (!spec) {
      gaps.push({ floor: lvl, reason: 'no source mapping' });
      continue;
    }
    if (!existsSync(spec.file)) {
      gaps.push({ floor: lvl, sheet: spec.sheet, reason: 'file missing', path: spec.file });
      console.log(`  MISSING L${lvl} ${spec.sheet}`);
      continue;
    }
    const uploadPath = resolveUploadPath(spec);
    const hydrated = METADATA_ONLY || DRY ? true : fileReady(uploadPath);
    if (!METADATA_ONLY && !hydrated) {
      gaps.push({
        floor: lvl,
        sheet: spec.sheet,
        reason: uploadPath === spec.file
          ? 'box file not hydrated (0 bytes or unreadable)'
          : 'staging file missing or unreadable',
        path: uploadPath,
      });
      console.log(`  NOT HYDRATED L${lvl} ${spec.sheet} — open in Box Drive, copy to --staging-dir, or use --metadata-only`);
    }

    if (DRY) {
      const via = uploadPath !== spec.file ? ' (staging)' : '';
      console.log(`  [DRY] L${lvl} <- ${spec.sheet} (${uploadPath.split('/').pop()})${via}`);
      applied.push({ floor: lvl, sheet: spec.sheet, dry: true });
      continue;
    }

    if (METADATA_ONLY || !hydrated) {
      const images = [{
        role: 'floor_plan',
        label: spec.label,
        sheet: spec.sheet,
        source_path: spec.file,
      }];
      const { error } = await reg.from('property_floors').update({ images }).eq('id', fl.id);
      if (error) throw new Error(error.message);
      console.log(`  indexed L${lvl} ${spec.sheet} (metadata${METADATA_ONLY ? '' : ', pending hydrate'})`);
      applied.push({ floor: lvl, sheet: spec.sheet, metadata_only: true, floor_id: fl.id });
      continue;
    }

    const publicId = `property-registry/${PROPERTY_ID}/floor-plans/level_${lvl}_${spec.sheet.replace(/[^a-zA-Z0-9]/g, '_')}`;
    try {
      const up = await uploadPdf(uploadPath, publicId);
      const images = [{
        role: 'floor_plan',
        url: up.pdf_url,
        png_url: up.png_url,
        full_png_url: up.full_png_url,
        label: spec.label,
        sheet: spec.sheet,
        source_path: spec.file.replace(BOX, '...25019...'),
      }];
      const { error } = await reg
        .from('property_floors')
        .update({ floor_plan_url: up.pdf_url, images })
        .eq('id', fl.id);
      if (error) throw new Error(error.message);
      console.log(`  ok L${lvl} ${spec.sheet} pages=${up.pages}`);
      applied.push({ floor: lvl, sheet: spec.sheet, pages: up.pages, floor_id: fl.id });
    } catch (e) {
      gaps.push({ floor: lvl, sheet: spec.sheet, reason: e?.message ?? String(e) });
      console.error(`  failed L${lvl}`, e?.message ?? e);
    }
  }

  const report = { applied, gaps, floor_count: floors?.length ?? 0 };
  writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
  console.log(`  report: ${REPORT_JSON}`);
  console.log(`  applied: ${applied.length}, gaps: ${gaps.length}`);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
