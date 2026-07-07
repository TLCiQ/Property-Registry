/**
 * Registry unit lookup helpers for BSI matrix ↔ property_units joins.
 */

export function normalizeUnitKey(raw) {
  if (raw == null || raw === '') return null;
  let s = String(raw).trim();
  if (!s || s === '.' || s.toLowerCase().startsWith('level ')) return null;

  // Excel float artifacts
  if (/^\d+\.0$/.test(s)) s = s.replace(/\.0$/, '');

  // Hub Broom lower-level suffixes in matrix: "133 -LL" → "133"
  s = s.replace(/\s*-?\s*LL$/i, '').trim();

  // Collapse tier spacing: "TIER  53N-L1" → "TIER 53N-L1"; "TIER 34S- L1" → "TIER 34S-L1"
  if (/^TIER\s+/i.test(s)) {
    s = s.replace(/^TIER\s+/i, 'TIER ').replace(/\s+/g, ' ');
    s = s.replace(/\s+-/g, '-').replace(/-\s+/g, '-');
  }

  return s;
}

export function buildUnitLookup(registryUnits) {
  /** @type {Map<string, typeof registryUnits[0]>} */
  const lookup = new Map();

  for (const unit of registryUnits) {
    const primary = normalizeUnitKey(unit.unit_number);
    if (primary) lookup.set(primary, unit);

    // Building prefix alias: matrix "601" ↔ registry "1-601" when unambiguous
    if (/^\d+$/.test(primary)) {
      for (const prefix of ['1-', '2-']) {
        const aliased = `${prefix}${primary}`;
        if (!lookup.has(aliased)) lookup.set(aliased, unit);
      }
    }

    // Reverse alias: registry "2-601" also reachable as "601" if unique
    const m = primary?.match(/^([12])-(\d+)$/);
    if (m) {
      const bare = m[2];
      if (!lookup.has(bare)) lookup.set(bare, unit);
    }
  }

  return lookup;
}

export function resolveRegistryUnit(lookup, matrixUnitNumber) {
  const key = normalizeUnitKey(matrixUnitNumber);
  if (!key) return null;
  if (lookup.has(key)) return lookup.get(key);

  // Last-resort numeric bare match when matrix uses building-prefixed form
  const bare = key.match(/^[12]-(\d+)$/)?.[1];
  if (bare && lookup.has(bare)) return lookup.get(bare);

  return null;
}
