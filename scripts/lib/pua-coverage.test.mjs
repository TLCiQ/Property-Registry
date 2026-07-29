#!/usr/bin/env node
/**
 * Smoke test: project_unit_assignments coverage resolver (no DB — fake client).
 *
 * Run: node scripts/lib/pua-coverage.test.mjs
 */
import {
  getPuaCoveredUnits,
  stripCoveredUnitGrainFields,
  assertNoAmbiguousCoverage,
  PUA_SUPERSEDED_COLUMNS,
} from './pua-coverage.mjs';

let failures = 0;
function check(label, cond) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    console.error(`  FAIL ${label}`);
    failures++;
  }
}

/**
 * Minimal stub of the supabase-js chain used by getPuaCoveredUnits:
 *   from('project_registry').select().eq()
 *   from('project_unit_assignments').select().in().range()
 */
function fakeClient({ projects = [], pua = [], failOn = null }) {
  return {
    from(table) {
      if (failOn === table) {
        return {
          select: () => ({
            eq: () => ({ data: null, error: { message: 'boom' } }),
            in: () => ({ range: () => ({ data: null, error: { message: 'boom' } }) }),
          }),
        };
      }
      if (table === 'project_registry') {
        return { select: () => ({ eq: (_c, v) => ({ data: projects.filter((p) => p.property_id === v), error: null }) }) };
      }
      if (table === 'project_unit_assignments') {
        return {
          select: () => ({
            in: (_c, ids) => ({
              range: (from, to) => {
                const rows = pua.filter((r) => ids.includes(r.project_id));
                return { data: rows.slice(from, to + 1), error: null };
              },
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

const PROP_A = 'prop-a';
const PROP_LEGACY = 'prop-legacy';

console.log('pua-coverage smoke test');

// ── 1. single-project property: coverage found, no ambiguity ────────────────
{
  const reg = fakeClient({
    projects: [{ id: 'proj-1', property_id: PROP_A }],
    pua: [
      { unit_number: '14001', project_id: 'proj-1' },
      { unit_number: '14003', project_id: 'proj-1' },
    ],
  });
  const { covered, ambiguous, projectIds } = await getPuaCoveredUnits(reg, PROP_A);
  check('single project: 2 units covered', covered.size === 2 && covered.has('14001'));
  check('single project: no ambiguity', ambiguous.size === 0);
  check('single project: projectIds consulted', projectIds.length === 1);
}

// ── 2. property with NO PUA rows: nothing covered, legacy writes survive ───
{
  const reg = fakeClient({ projects: [{ id: 'proj-9', property_id: PROP_LEGACY }], pua: [] });
  const { covered } = await getPuaCoveredUnits(reg, PROP_LEGACY);
  check('uncovered property: covered is empty', covered.size === 0);

  const patch = { unit_number: '101', phase_no: 4, construction_area: 'B', color_code: 'scheme1' };
  const out = stripCoveredUnitGrainFields(patch, covered);
  check('uncovered property: phase_no preserved', out.phase_no === 4);
  check('uncovered property: construction_area preserved', out.construction_area === 'B');
}

// ── 3. property with no projects at all ────────────────────────────────────
{
  const reg = fakeClient({ projects: [], pua: [{ unit_number: 'x', project_id: 'other' }] });
  const { covered, projectIds } = await getPuaCoveredUnits(reg, 'prop-orphan');
  check('no projects: covered empty', covered.size === 0);
  check('no projects: no project ids', projectIds.length === 0);
}

// ── 4. multi-project property claiming the SAME unit -> ambiguous, must throw ─
{
  const reg = fakeClient({
    projects: [
      { id: 'proj-1', property_id: PROP_A },
      { id: 'proj-2', property_id: PROP_A },
    ],
    pua: [
      { unit_number: '200', project_id: 'proj-1' },
      { unit_number: '200', project_id: 'proj-2' },
      { unit_number: '201', project_id: 'proj-1' },
    ],
  });
  const { covered, ambiguous } = await getPuaCoveredUnits(reg, PROP_A);
  check('multi-project: both units covered', covered.size === 2);
  check('multi-project: unit 200 flagged ambiguous', ambiguous.has('200') && ambiguous.get('200').length === 2);
  check('multi-project: unit 201 not ambiguous', !ambiguous.has('201'));

  let threw = false;
  try {
    assertNoAmbiguousCoverage(ambiguous, PROP_A);
  } catch (e) {
    threw = /more than one project/.test(e.message);
  }
  check('multi-project: assertNoAmbiguousCoverage throws (never pick first)', threw);
}

// ── 5. stripping behaviour on a covered unit ───────────────────────────────
{
  const covered = new Set(['14001']);
  const stripLog = [];
  const patch = {
    property_id: PROP_A,
    unit_number: '14001',
    unit_type_id: 'ut-1',
    phase_no: 7,
    construction_area: 'C1.2',
    color_code: 'scheme2',
    metadata: { source: 'bsi_matrix' },
  };
  const out = stripCoveredUnitGrainFields(patch, covered, {
    onStrip: (unit, cols) => stripLog.push([unit, cols]),
  });
  check('covered unit: phase_no removed', !Object.hasOwn(out, 'phase_no'));
  check('covered unit: construction_area removed', !Object.hasOwn(out, 'construction_area'));
  check('covered unit: color_code KEPT (has live readers)', out.color_code === 'scheme2');
  check('covered unit: unit_type_id kept', out.unit_type_id === 'ut-1');
  check('covered unit: metadata kept', out.metadata.source === 'bsi_matrix');
  check('covered unit: onStrip reported both columns', stripLog.length === 1 && stripLog[0][1].length === 2);
  check('covered unit: input not mutated', patch.phase_no === 7);
}

// ── 6. numeric unit_number must still match a string key ───────────────────
{
  const out = stripCoveredUnitGrainFields({ unit_number: 14001, phase_no: 3 }, new Set(['14001']));
  check('numeric unit_number coerced for match', !Object.hasOwn(out, 'phase_no'));
}

// ── 7. no-op paths ─────────────────────────────────────────────────────────
{
  const patch = { unit_number: '999', phase_no: 1 };
  check('empty covered set is a no-op', stripCoveredUnitGrainFields(patch, new Set()) === patch);
  check('unit not covered is a no-op', stripCoveredUnitGrainFields(patch, new Set(['111'])) === patch);
  check('null patch tolerated', stripCoveredUnitGrainFields(null, new Set(['1'])) === null);
  check('missing unit_number tolerated', stripCoveredUnitGrainFields({ phase_no: 1 }, new Set(['1'])).phase_no === 1);
  check('assertNoAmbiguousCoverage tolerates empty', (() => { assertNoAmbiguousCoverage(new Map(), PROP_A); return true; })());
}

// ── 8. null-valued legacy columns are dropped but not reported as stripped ──
{
  const stripLog = [];
  const out = stripCoveredUnitGrainFields(
    { unit_number: '1', phase_no: null, construction_area: null },
    new Set(['1']),
    { onStrip: (u, c) => stripLog.push([u, c]) },
  );
  check('null legacy values removed from patch', !Object.hasOwn(out, 'phase_no') && !Object.hasOwn(out, 'construction_area'));
  check('null legacy values not counted as stripped', stripLog.length === 0);
}

// ── 9. DB error surfaces, never silently "uncovered" ───────────────────────
{
  const reg = fakeClient({ projects: [{ id: 'p', property_id: PROP_A }], failOn: 'project_unit_assignments' });
  let threw = false;
  try {
    await getPuaCoveredUnits(reg, PROP_A);
  } catch (e) {
    threw = /PUA lookup failed/.test(e.message);
  }
  check('PUA query error throws (no false "uncovered")', threw);

  const reg2 = fakeClient({ failOn: 'project_registry' });
  let threw2 = false;
  try {
    await getPuaCoveredUnits(reg2, PROP_A);
  } catch (e) {
    threw2 = /project lookup failed/.test(e.message);
  }
  check('project query error throws', threw2);
}

// ── 10. exported column list is exactly the superseded pair ────────────────
check(
  'PUA_SUPERSEDED_COLUMNS is [phase_no, construction_area]',
  PUA_SUPERSEDED_COLUMNS.length === 2 &&
    PUA_SUPERSEDED_COLUMNS.includes('phase_no') &&
    PUA_SUPERSEDED_COLUMNS.includes('construction_area') &&
    !PUA_SUPERSEDED_COLUMNS.includes('color_code'),
);

console.log(failures === 0 ? '\nAll pua-coverage checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
