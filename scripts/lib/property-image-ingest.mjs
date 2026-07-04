/**
 * Shared helpers: Cloudinary config, registry image shape, URL classification.
 */

import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';

export function loadEnvFiles(readFileSync, existsSync, resolve, paths) {
  for (const p of paths) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
    }
  }
}

export function configureCloudinaryFromEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    return true;
  }
  const url = process.env.CLOUDINARY_URL;
  if (!url) return false;
  const match = url.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (!match) return false;
  cloudinary.config({ api_key: match[1], api_secret: match[2], cloud_name: match[3] });
  return true;
}

export { cloudinary };

const SKIP_HOSTS = [
  'zillow.com', 'rebusinessonline.com', 'multihousingnews.com', 'prnewswire.com',
  'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'youtube.com',
  'google.com', 'bing.com', 'wikipedia.org', 'yieldpro.com', 'studenthousingbusiness.com',
];

const PRESS_PATH = /\/(news|press|blog|subtext-breaks|announces|celebrates|article)\//i;

const NON_PROPERTY_HOSTS = [
  'rhodepartners.com', 'nilesbolton.com', 'wdgarch.com', 'brinkmannconstructors.com',
  'laytonconstruction.com', 'rabren.com', 'modusstudio.com', 'forumarch.com',
  'shepleybulfinch.com', 'krywicki.com', 'bkvgroup.com', 'culpepperconstruction.com',
];

export function normalizeWebsiteUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let u = raw.trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const url = new URL(u);
    if (SKIP_HOSTS.some((h) => url.hostname.includes(h))) return null;
    if (NON_PROPERTY_HOSTS.some((h) => url.hostname.includes(h))) return null;
    if (PRESS_PATH.test(url.pathname)) return null;
    const path = url.pathname !== '/' ? url.pathname : undefined;
    return { origin: url.origin, path, source: u };
  } catch {
    return null;
  }
}

export function resolvePropertyWebsite(prop) {
  if (prop.property_url) {
    const resolved = normalizeWebsiteUrl(prop.property_url);
    if (resolved) return resolved;
  }
  const name = (prop.property_name || '').toLowerCase();
  const city = (prop.city || '').toLowerCase().replace(/[^a-z]/g, '');
  if (/verve/.test(name) && city) {
    return { origin: `https://subtextliving.com`, source: 'subtext-brand', path: `/p/verve-${city}/` };
  }
  if (/rambler/.test(name) && city) {
    return { origin: `https://rambler${city}.com`, source: 'rambler-guess' };
  }
  if (/hub on campus/.test(name) && city) {
    const slug = city.replace(/\s+/g, '');
    return { origin: `https://hub${slug}.com`, source: 'hub-guess' };
  }
  if (/^yugo /i.test(prop.property_name || '')) {
    return { origin: 'https://yugo.com', source: 'yugo-brand' };
  }
  return null;
}

export const GALLERY_PATHS = [
  '', '/gallery', '/photos', '/photo-gallery', '/media', '/images',
  '/amenities', '/our-amenities', '/community', '/floorplans', '/floor-plans',
  '/floor-plan', '/units', '/models', '/model-units', '/interiors', '/virtual-tour',
];

export function extractMarkdownImages(md) {
  const imgs = new Set();
  if (!md) return [];
  const skip = /svg|icon|logo|badge|pixel|spacer|1x1|cdninstagram|scontent-|instagram\.com/i;
  const re = /!\[([^\]]*)\]\((https?:\/\/[^\s")]+)\)/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    if (!skip.test(m[2])) imgs.add(m[2]);
  }
  const srcRe = /(?:src|href)=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi;
  while ((m = srcRe.exec(md)) !== null) {
    if (!skip.test(m[1])) imgs.add(m[1]);
  }
  return [...imgs];
}

export function classifyImageRole(url, alt = '', pageUrl = '') {
  const hay = `${url} ${alt} ${pageUrl}`.toLowerCase();
  const page = (pageUrl || '').toLowerCase();
  if (/floor\s*plan|floorplan|floor-plan|site\s*plan|blueprint|layout\.(?:pdf|png|jpg)|unit.?layout|bedroom.?plan/.test(hay)) {
    if (/site.?plan|master.?plan|aerial/.test(hay)) return 'site_plan';
    if (/unit.?layout|bedroom|bath|kitchen.?plan|2x2|3x3|4x4|studio|1x1/.test(hay)) return 'unit_layout';
    return 'floorplan';
  }
  if (/\/(floor-?plans?|floorplans|site-?plan|layouts?)(\/|$)/.test(page)) return 'floorplan';
  if (/model.?unit|furnished|interior|bedroom|living.?room|kitchen|bathroom|unit.?photo|furniture|sofa|desk|model.?room|dinette|closet/.test(hay)) {
    return 'units';
  }
  if (/\/(models?|model-units|interiors|furnished|units|virtual-tour|gallery)(\/|$)/.test(page)
    && !/floor.?plan|amenity|pool|fitness|exterior|building|logo|map|icon/.test(hay)) {
    return 'units';
  }
  if (/amenity|pool|fitness|gym|clubhouse|lobby|study|rooftop|lounge|game.?room|spa/.test(hay)) {
    return 'common_amenity';
  }
  if (/hero|banner|header|exterior|building|aerial|drone|render|elevation|facade|campus/.test(hay)) {
    return /render|exterior|building|facade|aerial|drone|elevation/.test(hay) ? 'exterior' : 'hero';
  }
  if (/exterior|building|outside|street/.test(hay)) return 'exterior';
  return 'exterior';
}

export function toRegistryImage(uploaded, role, label, sourceUrl) {
  return {
    id: randomUUID(),
    url: uploaded.secure_url,
    public_id: uploaded.public_id,
    label: label || role,
    role,
    focal_x: 0.5,
    focal_y: 0.5,
    zoom: 1,
    width: uploaded.width || 0,
    height: uploaded.height || 0,
    format: uploaded.format || 'jpg',
    bytes: uploaded.bytes || 0,
    uploaded_at: new Date().toISOString(),
    source_url: sourceUrl,
  };
}

export async function uploadRemoteImage(sourceUrl, { folder, publicId, resourceType = 'image' }) {
  if (!sourceUrl || sourceUrl.includes('res.cloudinary.com')) {
    return { secure_url: sourceUrl, public_id: publicId || '', width: 0, height: 0, format: 'jpg', bytes: 0 };
  }
  const opts = {
    folder,
    overwrite: true,
    resource_type: resourceType,
    context: `source_url=${String(sourceUrl).replace(/\|/g, '_').slice(0, 200)}`,
    transformation: [{ width: 2000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  };
  if (publicId) opts.public_id = publicId;
  return cloudinary.uploader.upload(sourceUrl, opts);
}

export function isEnrichedProperty(row) {
  const sources = Array.isArray(row.enrichment_sources) ? row.enrichment_sources : [];
  if (sources.some((s) => ['portfolio_project_team', 'corespaces_project_team', 'corespaces_prismic'].includes(s.type))) {
    return true;
  }
  return !!row.external_ids?.prismic_id;
}

export function needsImageWork(row) {
  const imgs = Array.isArray(row.images) ? row.images : [];
  const heroOk = row.hero_image_url?.includes('res.cloudinary.com');
  const cloudCount = imgs.filter((i) => i?.url?.includes('res.cloudinary.com')).length;
  const hasRoles = new Set(imgs.map((i) => i?.role).filter(Boolean));
  const needsHero = !heroOk;
  const needsGallery = cloudCount < 3 || !hasRoles.has('units') && !hasRoles.has('floorplan') && !hasRoles.has('unit_layout');
  return needsHero || needsGallery;
}

export async function fetchAllRows(sb, table, select) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb.from(table).select(select).range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}
