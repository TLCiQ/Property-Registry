/**
 * Box Content API helpers — download files without Box Drive hydration.
 * Uses CCG: BOX_CLIENT_ID, BOX_CLIENT_SECRET, BOX_ENTERPRISE_ID.
 */
import { createWriteStream } from 'fs';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export async function getBoxAccessToken() {
  const sets = [
    {
      clientId: process.env.BOX_CLIENT_ID,
      clientSecret: process.env.BOX_CLIENT_SECRET,
      label: 'BOX_CLIENT_*',
    },
    {
      clientId: process.env.BOX_IQ_CLIENT_ID,
      clientSecret: process.env.BOX_IQ_CLIENT_SECRET,
      label: 'BOX_IQ_CLIENT_*',
    },
  ];
  const enterpriseId = process.env.BOX_ENTERPRISE_ID;
  if (!enterpriseId) throw new Error('Missing BOX_ENTERPRISE_ID');

  let lastErr = null;
  for (const { clientId, clientSecret, label } of sets) {
    if (!clientId || !clientSecret) continue;
    try {
      return await requestBoxToken(clientId, clientSecret, enterpriseId);
    } catch (e) {
      lastErr = new Error(`${label}: ${e.message}`);
    }
  }
  throw lastErr || new Error('Missing BOX_CLIENT_ID/SECRET or BOX_IQ_CLIENT_ID/SECRET');
}

async function requestBoxToken(clientId, clientSecret, enterpriseId) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    box_subject_type: 'enterprise',
    box_subject_id: enterpriseId,
  });

  const res = await fetch('https://api.box.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Box auth failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  if (!json.access_token) throw new Error('Box auth returned no access_token');
  return json.access_token;
}

function boxPath(entry) {
  const parts = entry?.path_collection?.entries || [];
  return parts.map((p) => p.name).join(' / ');
}

export async function searchBoxPdf(token, query, { limit = 10 } = {}) {
  const params = new URLSearchParams({
    query,
    type: 'file',
    fields: 'id,name,size,path_collection,extension',
    limit: String(limit),
  });
  const res = await fetch(`https://api.box.com/2.0/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Box search failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json.entries || [])
    .filter((e) => /\.pdf$/i.test(e.name || '') || e.extension === 'pdf')
    .map((e) => ({
      id: e.id,
      name: e.name,
      size: e.size,
      path: boxPath(e),
    }));
}

export async function downloadBoxFile(token, fileId, destPath) {
  mkdirSync(dirname(destPath), { recursive: true });
  const res = await fetch(`https://api.box.com/2.0/files/${fileId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: 'follow',
    signal: AbortSignal.timeout(300000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Box download failed (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.body) throw new Error('Box download returned empty body');
  await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath));
  return destPath;
}

/**
 * Resolve a floor-plan PDF by exact filename search; prefer hits under 25019 project path.
 */
export async function resolveFloorPlanFile(token, fileName, projectHint = '25019') {
  const hits = await searchBoxPdf(token, fileName.replace(/\.pdf$/i, ''), { limit: 20 });
  const exact = hits.filter((h) => h.name === fileName);
  const pool = exact.length ? exact : hits.filter((h) => h.name?.includes(fileName.split(' ')[0]));
  if (!pool.length) return null;
  pool.sort((a, b) => {
    const aScore = (a.path.includes(projectHint) ? 10 : 0) + (a.name === fileName ? 5 : 0);
    const bScore = (b.path.includes(projectHint) ? 10 : 0) + (b.name === fileName ? 5 : 0);
    return bScore - aScore;
  });
  return pool[0];
}
