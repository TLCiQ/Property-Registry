/**
 * PH phantom SKU supersession when TLCiQ-Production actuals land in Registry-iQ.
 *
 * Doctrine: ph_ = modeled demand (e.g. CSL Sales workbook) superseded by
 * tlciq_production requirements. Unique key is (unit_type_id, sku, room_label).
 *
 * @see docs/PRODUCTION_REGISTRY_UNIT_PIPELINE.md § PH phantom supersession
 */

/** Registry `property_unit_type_skus.source` values treated as phantom / pre-actual */
export const PHANTOM_SKU_SOURCES = Object.freeze([
  'ph_csl_workbook',
  'csl_sales_workbook', // legacy alias if used before rename
]);

const PH_SKU_PREFIX = 'PH_';

export function isPhantomSkuSource(source) {
  return PHANTOM_SKU_SOURCES.includes(source);
}

export function isPhPrefixedSku(sku) {
  return String(sku || '').startsWith(PH_SKU_PREFIX);
}

/**
 * Whether a phantom row is in scope for this Production deal.
 * Phantoms without deal metadata match any deal on the property (legacy) — caller may log.
 */
export function phantomInDealScope(metadata, dealNumber) {
  if (!dealNumber) return true;
  const m = metadata || {};
  const scoped = [
    m.deal_number,
    m.tlciq_deal_number,
    m.prod_deal_number,
    m.registry_project_id,
  ].filter(Boolean);
  if (!scoped.length) return true;
  return scoped.some((v) => String(v) === String(dealNumber) || String(v).startsWith(`${dealNumber}`));
}

/**
 * Phantom rows to remove when an actual (unit_type, sku, room) is written from Production.
 */
export function phantomsSupersededByActual(phantomRows, { unitTypeId, actualSku, roomLabel, dealNumber }) {
  const room = roomLabel ?? '';
  return (phantomRows || []).filter((p) => {
    if (p.unit_type_id !== unitTypeId) return false;
    if ((p.room_label ?? '') !== room) return false;
    if (!isPhantomSkuSource(p.source)) return false;
    if (!phantomInDealScope(p.metadata, dealNumber)) return false;

    const meta = p.metadata || {};
    if (p.sku === actualSku) return true;
    if (isPhPrefixedSku(p.sku) && meta.canonical_sku === actualSku) return true;
    if (isPhPrefixedSku(p.sku) && meta.phantom_key && meta.phantom_key === actualSku) return true;
  });
}

export function buildActualSkuMetadata({ existingRow, dealNumber, productionLineKey }) {
  const prior = existingRow && isPhantomSkuSource(existingRow.source)
    ? {
        source: existingRow.source,
        production_line_key: existingRow.production_line_key,
        workbook_line_key: existingRow.metadata?.workbook_line_key,
        ingested_at: existingRow.metadata?.ingested_at,
      }
    : null;

  const metadata = {
    ...(existingRow?.metadata && typeof existingRow.metadata === 'object' ? existingRow.metadata : {}),
    ph_supersession: {
      at: new Date().toISOString(),
      deal_number: dealNumber,
      production_requirement_id: productionLineKey,
      ...(prior ? { prior_phantom: prior } : {}),
    },
  };
  delete metadata.phantom;
  return metadata;
}

/**
 * Load phantom SKU rows for property + unit types (paginated).
 */
export async function fetchPhantomSkusForProperty(reg, propertyId, unitTypeIds) {
  if (!unitTypeIds?.length) return [];
  const ids = [...new Set(unitTypeIds)];
  const all = [];
  const CHUNK = 100;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { data, error } = await reg
      .from('property_unit_type_skus')
      .select('id, unit_type_id, sku, room_label, source, metadata, production_line_key')
      .eq('property_id', propertyId)
      .in('unit_type_id', chunk)
      .in('source', [...PHANTOM_SKU_SOURCES]);
    if (error) throw new Error(`fetchPhantomSkus: ${error.message}`);
    all.push(...(data || []));
  }
  return all;
}

/**
 * Delete phantom rows superseded by one Production line.
 * @returns {{ deleted: number, ids: string[] }}
 */
export async function supersedePhantomsForActual(reg, phantomPool, ctx, { dry = false } = {}) {
  const { unitTypeId, actualSku, roomLabel, dealNumber } = ctx;
  const targets = phantomsSupersededByActual(phantomPool, {
    unitTypeId,
    actualSku,
    roomLabel,
    dealNumber,
  });
  if (!targets.length) return { deleted: 0, ids: [] };
  const ids = targets.map((t) => t.id);
  if (dry) return { deleted: ids.length, ids };

  const { error } = await reg.from('property_unit_type_skus').delete().in('id', ids);
  if (error) throw new Error(`supersedePhantoms delete: ${error.message}`);
  return { deleted: ids.length, ids };
}
