/**
 * Registry unit lookup helpers for BSI matrix ↔ property_units joins.
 */

export function normalizeUnitKey(raw) {
  if (raw == null || raw === '') return null;
  let s = String(raw).trim();
  if (!s || s === '.' || s.toLowerCase().startsWith('level ')) return null;

  // Excel float artifacts
  if (/^\d+\.0$/.test(s)) s = s.replace(/\.0$/, '');

  // Hub Broom matrix uses suffix form "109 -LL" for lower-level units; registry uses "LL1-109"
  const llSuffix = s.match(/^(\d+)\s*-?\s*LL$/i);
  if (llSuffix) s = `LL1-${llSuffix[1]}`;

  // Collapse tier spacing: "TIER  53N-L1" → "TIER 53N-L1"; "TIER 34S- L1" → "TIER 34S-L1"
  if (/^TIER\s+/i.test(s)) {
    s = s.replace(/^TIER\s+/i, 'TIER ').replace(/\s+/g, ' ');
    s = s.replace(/\s+-/g, '-').replace(/-\s+/g, '-');
  }

  return s;
}

export function matrixUnitAliases(registryUnitNumber) {
  const aliases = new Set();
  const primary = normalizeUnitKey(registryUnitNumber);
  if (!primary) return aliases;

  // Registry LL1-109 ↔ matrix "109 -LL"
  const llPref = primary.match(/^LL1-(\d+)$/i);
  if (llPref) {
    aliases.add(`${llPref[1]} -LL`);
    aliases.add(`${llPref[1]}-LL`);
  }

  return aliases;
}

export function buildUnitLookup(registryUnits) {
  /** @type {Map<string, typeof registryUnits[0]>} */
  const lookup = new Map();

  for (const unit of registryUnits) {
    const primary = normalizeUnitKey(unit.unit_number);
    if (primary) lookup.set(primary, unit);
    for (const alias of matrixUnitAliases(unit.unit_number)) {
      if (!lookup.has(alias)) lookup.set(alias, unit);
    }

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
