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

export async function findContractPdf(token, projectFolderId) {
  const pm = await findProjectManaging(token, projectFolderId);
  if (!pm) return null;
  const pmItems = await listItems(token, pm.id);
  const cd = pmItems.find((i) => i.type === 'folder' && /contract documents/i.test(i.name));
  if (!cd) return null;

  let items = await listItems(token, cd.id);
  const received = items.find((i) => i.type === 'folder' && /contract received/i.test(i.name));
  if (received) items = [...items, ...(await listItems(token, received.id))];

  const pdfs = items.filter(
    (i) =>
      i.type === 'file' &&
      /\.pdf$/i.test(i.name) &&
      (/contract received|revised contract received|fully executed subcontract|subcontract agreement/i.test(i.name) ||
        (/subcontract/i.test(i.name) && /executed|agreement|received/i.test(i.name))),
  );
  if (!pdfs.length) return null;

  pdfs.sort((a, b) => {
    const aNum = a.name.match(/\d{6,8}/)?.[0] || '';
    const bNum = b.name.match(/\d{6,8}/)?.[0] || '';
    return bNum.localeCompare(aNum) || b.name.localeCompare(a.name);
  });
  return pdfs[0];
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
