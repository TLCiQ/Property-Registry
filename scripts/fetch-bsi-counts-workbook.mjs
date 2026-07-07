#!/usr/bin/env node
/**
 * Download MW*.xls Counts Workbook takeoff files from Box → local cache.
 *
 * Usage: node scripts/fetch-bsi-counts-workbook.mjs --project-id=25322
 */
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
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

const PROJECT_ID = process.argv.find((a) => a.startsWith('--project-id='))?.split('=')[1];
if (!PROJECT_ID) {
  console.error('Usage: node scripts/fetch-bsi-counts-workbook.mjs --project-id=25xxx');
  process.exit(1);
}

async function listItems(token, folderId, depth = 0, out = []) {
  if (depth > 5) return out;
  let offset = 0;
  while (true) {
    const res = await fetch(
      `https://api.box.com/2.0/folders/${folderId}/items?limit=1000&offset=${offset}&fields=id,name,type`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(120000) },
    );
    if (!res.ok) throw new Error(`Box list failed (${res.status})`);
    const json = await res.json();
    for (const i of json.entries || []) {
      if (i.type === 'file' && /^MW[\d.]+.*\.xls$/i.test(i.name)) out.push(i);
      if (i.type === 'folder' && depth < 5 && /cabinet|counts|workbook|takeoff|shop/i.test(i.name)) {
        await listItems(token, i.id, depth + 1, out);
      }
    }
    if (!json.entries?.length || offset + 1000 >= (json.total_count || 0)) break;
    offset += 1000;
  }
  return out;
}

async function main() {
  const box = loadLocalBoxFolders().find((b) => b.project_id === PROJECT_ID);
  if (!box) throw new Error(`No Box folder for ${PROJECT_ID}`);

  const token = await getBoxAccessToken();
  const folder = await findProjectFolder(token, box.folder);
  if (!folder) throw new Error(`Box folder not found: ${box.folder}`);
  const sd = await findShopDrawingsFolder(token, folder.id);
  if (!sd) throw new Error(`No SHOP DRAWINGS folder for ${PROJECT_ID}`);

  const files = [...new Map((await listItems(token, sd.id)).map((f) => [f.name, f])).values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const cacheDir = resolve(ROOT, `.cache/bsi-counts-workbook/${PROJECT_ID}`);
  mkdirSync(cacheDir, { recursive: true });

  console.log(`Fetching ${files.length} MW*.xls for ${PROJECT_ID} → ${cacheDir}`);
  const manifest = [];
  for (const f of files) {
    const dest = resolve(cacheDir, f.name);
    await downloadBoxFile(token, f.id, dest);
    manifest.push({ name: f.name, id: f.id, path: dest });
  }

  const manifestPath = resolve(cacheDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({ project_id: PROJECT_ID, files: manifest }, null, 2));
  console.log(`Wrote ${manifestPath}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
