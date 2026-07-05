/**
 * Box project folder navigation for BSI millwork jobs (Box API, not Drive hydration).
 */
import { readdirSync } from 'fs';

export const BOX_ROOT = '/Users/geoffreyjackson/Library/CloudStorage/Box-Box/Team Folder/Projects';

export const FOLDER_PROJECT_ALIASES = {
  '25015-Madison, WI - HUB - J+B': '25315',
};

export function loadLocalBoxFolders() {
  return readdirSync(BOX_ROOT)
    .filter((n) => /^25\d{3}/.test(n))
    .map((folder) => ({
      folder,
      project_id: FOLDER_PROJECT_ALIASES[folder] || folder.match(/^(25\d{3})/)[1],
    }))
    .sort((a, b) => a.project_id.localeCompare(b.project_id));
}

async function listItems(token, folderId) {
  const items = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `https://api.box.com/2.0/folders/${folderId}/items?limit=1000&offset=${offset}&fields=id,name,type,size`,
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

export async function findProjectFolder(token, folderName) {
  const res = await fetch(
    `https://api.box.com/2.0/search?${new URLSearchParams({
      query: folderName,
      type: 'folder',
      fields: 'id,name,path_collection',
      limit: '20',
    })}`,
    { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(120000) },
  );
  if (!res.ok) throw new Error(`Box folder search failed (${res.status})`);
  const entries = (await res.json()).entries || [];
  return entries.find((e) => e.name === folderName) || entries.find((e) => e.name?.startsWith(folderName.slice(0, 8)));
}

export async function findProjectManaging(token, projectFolderId) {
  const top = await listItems(token, projectFolderId);
  return top.find((i) => i.type === 'folder' && /project managing/i.test(i.name));
}

function scoreContractPdf(name) {
  const n = name.toLowerCase();
  let score = 0;
  if (/contract received/i.test(n)) score += 100;
  if (/revised contract received/i.test(n)) score += 95;
  if (/fully executed/i.test(n)) score += 80;
  if (/subcontract agreement/i.test(n)) score += 60;
  if (/master subcontractor agreement/i.test(n)) score += 40;
  if (/\d{6,8}/.test(n)) score += 10;
  if (/sample|old|template|checklist|coi|insurance|assignment/i.test(n)) score -= 50;
  return score;
}

async function collectContractPdfs(token, projectFolderId) {
  const pdfs = [];
  async function walk(folderId, depth = 0) {
    if (depth > 5) return;
    for (const i of await listItems(token, folderId)) {
      if (
        i.type === 'file' &&
        /\.pdf$/i.test(i.name) &&
        (/contract received|revised contract received|fully executed subcontract|subcontract agreement|master subcontractor agreement/i.test(
          i.name,
        ) ||
          (/subcontract/i.test(i.name) && /executed|agreement|received|updated/i.test(i.name)))
      ) {
        pdfs.push(i);
      }
      if (i.type === 'folder' && depth < 5 && /contract|install|project managing|execution|received|workbook/i.test(i.name)) {
        await walk(i.id, depth + 1);
      }
    }
  }
  await walk(projectFolderId);
  return pdfs.sort((a, b) => scoreContractPdf(b.name) - scoreContractPdf(a.name));
}

export async function findContractPdf(token, projectFolderId) {
  const pdfs = await collectContractPdfs(token, projectFolderId);
  return pdfs[0] || null;
}

export async function findAllContractPdfs(token, projectFolderId, limit = 3) {
  return (await collectContractPdfs(token, projectFolderId)).slice(0, limit);
}

async function walkMatchingFiles(token, folderId, matcher, depth = 0, out = []) {
  if (depth > 5) return out;
  for (const i of await listItems(token, folderId)) {
    if (i.type === 'file' && matcher(i.name)) out.push(i);
    if (i.type === 'folder' && depth < 5) await walkMatchingFiles(token, i.id, matcher, depth + 1, out);
  }
  return out;
}

export async function findGcValuesWorkbook(token, projectFolderId) {
  const hits = await walkMatchingFiles(
    token,
    projectFolderId,
    (n) => /gc values workbook|values workbook/i.test(n) && /\.xlsx$/i.test(n),
  );
  hits.sort((a, b) => scoreContractPdf(b.name) - scoreContractPdf(a.name));
  return hits[0] || null;
}

export async function findSupplementalSchedulePdfs(token, projectFolderId) {
  const hits = await walkMatchingFiles(
    token,
    projectFolderId,
    (n) =>
      /\.pdf$/i.test(n) &&
      (/master schedule|full schedule|lookahead schedule|project schedule|fabrication.*install.*delivery/i.test(n) ||
        (/schedule/i.test(n) && /student housing|parallel|gc cabinet transmittal/i.test(n))),
  );
  const ranked = hits.sort((a, b) => {
    const score = (n) =>
      (/master schedule/i.test(n) ? 30 : 0) +
      (/full schedule/i.test(n) ? 28 : 0) +
      (/lookahead/i.test(n) ? 20 : 0) +
      (/fabrication.*delivery/i.test(n) ? 5 : 0) -
      (/door.?schedule|panel schedule|mechanical schedule|electrical/i.test(n) ? 40 : 0);
    return score(b.name) - score(a.name);
  });
  return ranked.slice(0, 2);
}

export async function findShopDrawingsFolder(token, projectFolderId) {
  const pm = await findProjectManaging(token, projectFolderId);
  if (!pm) return null;
  const pmItems = await listItems(token, pm.id);
  return pmItems.find((i) => i.type === 'folder' && /shop drawings/i.test(i.name));
}

export async function findScheduleMtoXlsx(token, projectFolderId) {
  const sd = await findShopDrawingsFolder(token, projectFolderId);
  if (!sd) return null;
  const items = await listItems(token, sd.id);
  return (
    items.find((i) => i.type === 'file' && /schedule_mto/i.test(i.name) && /\.xlsx$/i.test(i.name)) ||
    items.find((i) => i.type === 'file' && /schedule.*mto/i.test(i.name) && /\.xlsx$/i.test(i.name))
  );
}

export async function findMatrixXlsx(token, projectFolderId) {
  const sd = await findShopDrawingsFolder(token, projectFolderId);
  if (!sd) return null;
  const items = await listItems(token, sd.id);

  const ranked = items
    .filter((i) => i.type === 'file' && /\.xlsx$/i.test(i.name) && /matrix/i.test(i.name))
    .sort((a, b) => {
      const score = (n) =>
        (/matrix/i.test(n) ? 2 : 0) +
        (/new/i.test(n) ? 1 : 0) -
        (/old|backup|copy/i.test(n) ? 3 : 0);
      return score(b.name) - score(a.name);
    });
  return ranked[0] || null;
}
