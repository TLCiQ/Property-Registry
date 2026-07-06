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
  if (/executed.*cabinet|executed.*countertop|cabinets_and_countertop|task order.*executed|fully executed.*blake|subcontract package|subcontract_package/i.test(n)) score += 92;
  if (/subcontract -/i.test(n)) score += 88;
  if (/fully executed/i.test(n)) score += 80;
  if (/subcontract agreement/i.test(n)) score += 60;
  if (/master subcontractor agreement/i.test(n)) score += 40;
  if (/\d{6,8}/.test(n)) score += 10;
  if (/sample|old|template|checklist|coi|insurance|assignment/i.test(n)) score -= 50;
  return score;
}

function isContractPdfName(name) {
  const n = name.toLowerCase();
  if (/sample|old|template|checklist|coi|insurance|assignment|attachment f|req for payment|safety policy|competent person|valuation form|msa_|master subcontractor agreement/i.test(n)) {
    return false;
  }
  if (/mod [a-d]\s*-|modification|change order only/i.test(n)) return false;
  return (
    /contract received|revised contract received|fully executed subcontract|subcontract agreement|subcontract work order|subcontract -|subcontract package|subcontract_package|task order.*executed|executed.*cabinet|executed.*countertop|executed.*blake|cabinets_and_countertop|blake solutions_subcontract agreement_executed/i.test(
      n,
    ) ||
    (/subcontract/i.test(n) && /executed|agreement|received|updated|gateway|cabinet|countertop|work order|package|regional street|blake/i.test(n))
  );
}

const CONTRACT_WALK_FOLDERS =
  /contract|install|project managing|execution|received|workbook|subcontract|attachment|production|schedule|shop drawing|specification|pm\b/i;

async function collectContractPdfs(token, projectFolderId) {
  const pdfs = [];
  async function walk(folderId, depth = 0) {
    if (depth > 6) return;
    for (const i of await listItems(token, folderId)) {
      if (i.type === 'file' && /\.pdf$/i.test(i.name) && isContractPdfName(i.name)) {
        pdfs.push(i);
      }
      if (i.type === 'folder' && depth < 6 && (depth < 2 || CONTRACT_WALK_FOLDERS.test(i.name))) {
        await walk(i.id, depth + 1);
      }
    }
  }
  await walk(projectFolderId);
  const deduped = [...new Map(pdfs.map((p) => [p.id, p])).values()];
  return deduped.sort((a, b) => scoreContractPdf(b.name) - scoreContractPdf(a.name));
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

function isSupplementalSchedulePdf(name) {
  if (!/\.pdf$/i.test(name)) return false;
  const n = name.toLowerCase();
  if (/door.?schedule|window.?schedule|storefront.?schedule|panel schedule|mechanical schedule|electrical|lighting schedule|equipment schedule|dwelling panel|finish schedules\.pdf$/i.test(n)) {
    return false;
  }
  return (
    /master schedule|full schedule|lookahead schedule|project schedule|production schedule|subcontractor schedule|unit finish schedule|fabrication.*install.*delivery|gantt\.pdf/i.test(n) ||
    (/schedule/i.test(n) && /student housing|parallel|gc cabinet transmittal|attachment c|finish schedule|production/i.test(n))
  );
}

export async function findSupplementalSchedulePdfs(token, projectFolderId) {
  const hits = await walkMatchingFiles(token, projectFolderId, isSupplementalSchedulePdf);
  const ranked = hits.sort((a, b) => {
    const score = (n) =>
      (/production schedule/i.test(n) ? 35 : 0) +
      (/subcontractor schedule|attachment c/i.test(n) ? 34 : 0) +
      (/master schedule/i.test(n) ? 30 : 0) +
      (/full schedule/i.test(n) ? 28 : 0) +
      (/unit finish schedule/i.test(n) ? 26 : 0) +
      (/lookahead/i.test(n) ? 20 : 0) +
      (/fabrication.*delivery/i.test(n) ? 5 : 0) -
      (/door.?schedule|panel schedule|mechanical schedule|electrical/i.test(n) ? 40 : 0);
    return score(b.name) - score(a.name);
  });
  return ranked.slice(0, 3);
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
