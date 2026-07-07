#!/usr/bin/env node
/**
 * Generic BSI cabinet shop drawings (MW*.pdf) via Box API → Cloudinary → property_shop_drawings.
 *
 * Usage:
 *   node scripts/ingest-bsi-shop-drawings.mjs --project-id=25322 --apply
 *   node scripts/ingest-bsi-shop-drawings.mjs --project-id=25322 --apply --limit=25
 */
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import { mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getBoxAccessToken, downloadBoxFile } from './lib/box-api-download.mjs';
import {
  findProjectFolder,
  findShopDrawingsFolder,
  loadLocalBoxFolders,
} from './lib/box-project-browser.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  config({ path: resolve(ROOT, f) });
  config({ path: resolve(ROOT, '../Derived State/dale-chat', f), override: true });
}

const DRY = !process.argv.includes('--apply');
const PROJECT_ID = process.argv.find((a) => a.startsWith('--project-id='))?.split('=')[1];
const LIMIT = parseInt(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '40', 10);
if (!PROJECT_ID) {
  console.error('Usage: node scripts/ingest-bsi-shop-drawings.mjs --project-id=25xxx [--apply] [--limit=N]');
  process.exit(1);
}

const VERSION = new Date().toISOString().slice(0, 10);
const CACHE = resolve(ROOT, '.cache/bsi-shop-drawings');

function configureCloudinary() {
  const m = (process.env.CLOUDINARY_URL || '').match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (!m) return false;
  cloudinary.config({ api_key: m[1], api_secret: m[2], cloud_name: m[3] });
  return true;
}

function pngUrl(publicId) {
  return cloudinary.url(publicId, {
    resource_type: 'image',
    format: 'png',
    transformation: [{ page: 1, width: 600, crop: 'fit' }],
  });
}

function drawingNoFromName(name) {
  const base = name.replace(/\.pdf$/i, '');
  const m = base.match(/^(MW[\d.]+)/i);
  if (m) return m[1].toUpperCase().replace(/^MW(\d)\./, 'MW0$1.');
  if (/^MW\d/i.test(base)) return base.match(/^MW[\d.]+/i)[0].toUpperCase();
  return base.slice(0, 32);
}

function isCabinetPdf(name) {
  return /^MW[\d.]+/i.test(name) && /\.pdf$/i.test(name);
}

async function listItems(token, folderId) {
  const items = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `https://api.box.com/2.0/folders/${folderId}/items?limit=1000&offset=${offset}&fields=id,name,type`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(120000) },
    );
    if (!res.ok) throw new Error(`Box list failed (${res.status})`);
    const json = await res.json();
    items.push(...(json.entries || []));
    if (!json.entries?.length || offset + 1000 >= (json.total_count || 0)) break;
    offset += 1000;
  }
  return items;
}

async function collectCabinetPdfs(token, folderId, depth = 0, out = []) {
  if (depth > 5) return out;
  for (const i of await listItems(token, folderId)) {
    if (i.type === 'file' && isCabinetPdf(i.name)) out.push(i);
    if (i.type === 'folder' && depth < 5 && /cabinet|km pdf|shop|drawing|mto/i.test(i.name)) {
      await collectCabinetPdfs(token, i.id, depth + 1, out);
    }
  }
  return out;
}

async function main() {
  if (!configureCloudinary()) throw new Error('Missing CLOUDINARY_URL');

  const box = loadLocalBoxFolders().find((b) => b.project_id === PROJECT_ID);
  if (!box) throw new Error(`No Box folder for ${PROJECT_ID}`);

  const reg = createClient(
    process.env.REGISTRY_IQ_SUPABASE_URL,
    process.env.REGISTRY_IQ_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  const { data: project } = await reg
    .from('project_registry')
    .select('property_id')
    .eq('project_id', PROJECT_ID)
    .single();
  if (!project?.property_id) throw new Error(`No property for ${PROJECT_ID}`);
  const propertyId = project.property_id;

  const token = await getBoxAccessToken();
  const folder = await findProjectFolder(token, box.folder);
  if (!folder) throw new Error(`Box folder not found: ${box.folder}`);
  const sd = await findShopDrawingsFolder(token, folder.id);
  if (!sd) {
    console.log(`  No SHOP DRAWINGS folder for ${PROJECT_ID} — skip`);
    return { status: 'no_shop_drawings' };
  }

  const pdfs = [...new Map((await collectCabinetPdfs(token, sd.id)).map((p) => [p.name, p])).values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, LIMIT);

  console.log(`BSI shop drawings — ${PROJECT_ID} (${DRY ? 'DRY' : 'APPLY'}) ${pdfs.length} MW PDF(s)`);
  mkdirSync(CACHE, { recursive: true });

  const gaps = [];
  let uploaded = 0;
  for (const pdf of pdfs) {
    const drawingNo = drawingNoFromName(pdf.name);
    if (DRY) {
      console.log(`  [DRY] ${drawingNo} — ${pdf.name}`);
      continue;
    }
    const localPath = resolve(CACHE, `${PROJECT_ID}-${pdf.id}.pdf`);
    try {
      await downloadBoxFile(token, pdf.id, localPath);
      const publicId = `property-registry/${propertyId}/shop-drawings/${drawingNo.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const r = await cloudinary.uploader.upload(localPath, {
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      });
      const row = {
        property_id: propertyId,
        drawing_no: drawingNo,
        title: pdf.name.replace(/\.pdf$/i, ''),
        drawing_type: /vanity|bath/i.test(pdf.name) ? 'vanity' : 'kitchen_cabs',
        version: VERSION,
        state: 'not_started',
        thumbnail_url: pngUrl(publicId),
        pdf_url: r.secure_url,
        page_count: r.pages ?? null,
        source_path: `Box:${box.folder}/…/${pdf.name}`,
        notes: `BSI generic shop drawing ingest ${VERSION}`,
      };
      const { error } = await reg
        .from('property_shop_drawings')
        .upsert(row, { onConflict: 'property_id,drawing_no,version' });
      if (error) gaps.push({ drawingNo, error: error.message });
      else uploaded++;
      unlinkSync(localPath);
    } catch (e) {
      gaps.push({ drawingNo, error: e.message });
    }
  }

  writeFileSync(
    resolve(ROOT, `.firecrawl/${PROJECT_ID}-shop-drawings-report.json`),
    JSON.stringify({ project_id: PROJECT_ID, found: pdfs.length, uploaded, gaps }, null, 2),
  );
  console.log(`  uploaded: ${uploaded}, gaps: ${gaps.length}`);
  return { uploaded, gaps };
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
