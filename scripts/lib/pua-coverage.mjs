/**
 * project_unit_assignments (PUA) coverage resolver — single-home guard for
 * unit-grain truck / phase / construction-area facts.
 *
 * WHY THIS EXISTS
 * ---------------
 * `public.project_unit_assignments` is the project-grain source of truth for
 * unit-grain final-mile + millwork facts (truck_no, phase_no, construction_area,
 * ROSD, MW run code, elevations) with full Box/matrix provenance.
 *
 * `public.property_units` is property-grain and historically carried a COPY of
 * truck_no / phase_no / construction_area stamped from whatever matrix revision
 * happened to be loaded at the time. That second home had no sync, so it went
 * silently stale, and property-keying collides the moment a property hosts two
 * jobs. Resolved 2026-07-29 (see scripts/migration-resolve-unit-grain-dual-home.sql):
 *   - property_units.truck_no was DROPPED outright.
 *   - property_units.phase_no / construction_area were nulled for every unit PUA
 *     already covers, and are RETAINED only for legacy properties PUA has not
 *     ingested yet (Troubadour 14th St, HUB Broom, HUB Clemson II).
 *   - A DB trigger (property_units_block_dual_home) now REJECTS writes of
 *     phase_no / construction_area for any unit PUA covers.
 *
 * So any ingest that still wants to stamp those legacy columns must ask first.
 * That is what this module is for: call `getPuaCoveredUnits()` once per property,
 * then run every property_units patch through `stripCoveredUnitGrainFields()`.
 * Writes for genuinely-uncovered legacy properties keep working unchanged; writes
 * that would recreate the dual home are dropped locally with a reason, instead of
 * hitting the trigger and aborting a long ingest mid-run.
 *
 * NOTE on multi-project properties: a property can host several projects. We
 * resolve coverage by (property -> its projects -> PUA unit_number) and we NEVER
 * "pick the first project". If a single unit_number at one property is claimed by
 * more than one project's PUA rows, that is a real ambiguity — `getPuaCoveredUnits`
 * surfaces it in `ambiguous` so the caller can fail loudly rather than guess.
 */

/** Legacy property-grain columns that PUA supersedes once it covers a unit. */
export const PUA_SUPERSEDED_COLUMNS = ['phase_no', 'construction_area'];

/**
 * Which unit_numbers at `propertyId` already have a project-grain PUA row?
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} reg Registry-iQ client (service role).
 * @param {string} propertyId property_registry.id
 * @returns {Promise<{covered: Set<string>, ambiguous: Map<string, string[]>, projectIds: string[]}>}
 *   covered    — unit_numbers with at least one PUA row (compare as String()).
 *   ambiguous  — unit_number -> [project_id, ...] when >1 project claims it.
 *   projectIds — the property's project_registry ids that were consulted.
 */
export async function getPuaCoveredUnits(reg, propertyId) {
  const covered = new Set();
  const ambiguous = new Map();

  if (!propertyId) return { covered, ambiguous, projectIds: [] };

  const { data: projects, error: projErr } = await reg
    .from('project_registry')
    .select('id')
    .eq('property_id', propertyId);
  if (projErr) throw new Error(`pua-coverage: project lookup failed for property ${propertyId}: ${projErr.message}`);

  const projectIds = (projects ?? []).map((p) => p.id).filter(Boolean);
  if (projectIds.length === 0) return { covered, ambiguous, projectIds };

  // unit_number -> Set(project_id), so a genuine multi-project claim is visible.
  const byUnit = new Map();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await reg
      .from('project_unit_assignments')
      .select('unit_number, project_id')
      .in('project_id', projectIds)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`pua-coverage: PUA lookup failed for property ${propertyId}: ${error.message}`);
    for (const row of data ?? []) {
      const key = String(row.unit_number);
      covered.add(key);
      if (!byUnit.has(key)) byUnit.set(key, new Set());
      byUnit.get(key).add(row.project_id);
    }
    if (!data || data.length < PAGE) break;
  }

  for (const [unit, projSet] of byUnit) {
    if (projSet.size > 1) ambiguous.set(unit, [...projSet]);
  }

  return { covered, ambiguous, projectIds };
}

/**
 * Remove PUA-superseded columns from a property_units patch when PUA already
 * owns that unit. Returns a NEW object; the input is not mutated.
 *
 * @param {Record<string, unknown>} patch          property_units insert/update payload.
 * @param {Set<string>} covered                    from getPuaCoveredUnits().covered
 * @param {{ onStrip?: (unitNumber: string, columns: string[]) => void }} [opts]
 * @returns {Record<string, unknown>}
 */
export function stripCoveredUnitGrainFields(patch, covered, opts = {}) {
  if (!patch || !covered || covered.size === 0) return patch;
  const unitNumber = patch.unit_number == null ? null : String(patch.unit_number);
  if (!unitNumber || !covered.has(unitNumber)) return patch;

  const stripped = [];
  const out = { ...patch };
  for (const col of PUA_SUPERSEDED_COLUMNS) {
    // Only report columns that were actually carrying a value.
    if (Object.hasOwn(out, col)) {
      if (out[col] !== null && out[col] !== undefined) stripped.push(col);
      delete out[col];
    }
  }
  if (stripped.length && typeof opts.onStrip === 'function') opts.onStrip(unitNumber, stripped);
  return out;
}

/**
 * Fail loudly on a multi-project unit_number collision. Call once after
 * getPuaCoveredUnits() — "pick the first project" is never acceptable.
 *
 * @param {Map<string, string[]>} ambiguous from getPuaCoveredUnits().ambiguous
 * @param {string} propertyId
 */
export function assertNoAmbiguousCoverage(ambiguous, propertyId) {
  if (!ambiguous || ambiguous.size === 0) return;
  const sample = [...ambiguous.entries()]
    .slice(0, 5)
    .map(([unit, projects]) => `${unit} -> ${projects.join(', ')}`)
    .join('; ');
  throw new Error(
    `pua-coverage: ${ambiguous.size} unit_number(s) at property ${propertyId} are claimed by more than one project in project_unit_assignments (${sample}). ` +
      'Resolve which project owns these units before ingesting -- do not guess.',
  );
}
