-- ============================================================================
-- Registry-iQ (xhafhdaugmgdxckhdfov) — applied 2026-07-29 as Supabase migration
-- `resolve_unit_grain_dual_home`. This file is the checked-in copy of record.
--
-- WHY: resolve the dual home for unit-grain truck/phase data.
--
-- Two tables answered "which truck is unit X on" with no sync between them:
--   * public.project_unit_assignments (PUA) -- project-grain, UNIQUE(project_id,
--     unit_number), loaded 2026-07-28 from the BSI Matrix NEW_SCHEME workbook
--     with full provenance (source_file / source_box_file_id / source_row /
--     source_modified_at). This is the declared SoT.
--   * public.property_units -- property-grain, carried truck_no / phase_no /
--     construction_area stamped from an EARLIER matrix revision. Silently
--     stale-able, and property-keying collides if a property ever hosts two jobs.
--
-- EVIDENCE GATHERED BEFORE CHOOSING (2026-07-29):
--   * ZERO application readers of truck_no / phase_no / construction_area in
--     either dale-chat or Chain-iQ (binary-safe LC_ALL=C grep -a sweeps), and
--     zero in Property_Registry / MyApps/RITA beyond the ingest WRITERS.
--   * ZERO DB dependants: no view/matview, no function, no RLS policy, no
--     generated-column or index expression references these three columns.
--   * property_units RLS is enabled with 0 policies (deny-all for anon and
--     authenticated); every read is service_role. PUA is strictly MORE
--     permissive (authenticated SELECT). So no read path is lost.
--   * Coverage is NOT uniform, which is why this is scoped rather than blanket:
--       Morgan Hill Apartments  390 units  truck 390  phase 390  area 324  -> PUA covers 390/390, 1 project
--       Troubadour 14th St SH   276 units  truck   0  phase 275  area 276  -> PUA covers 0, 3 projects
--       HUB Broom               474 units  truck   0  phase   0  area 474  -> PUA covers 0, 5 projects
--       HUB Clemson II           50 units  truck   0  phase   0  area  50  -> PUA covers 0, 1 project
--
-- DECISION:
--   truck_no            -> DROP. Only Morgan Hill ever had it, PUA covers it
--                          100% at byte-identical values, and Morgan Hill's
--                          property has exactly one project so there is no
--                          property->project resolution ambiguity. Clean
--                          single-home per platform doctrine.
--   phase_no,
--   construction_area   -> KEEP THE COLUMN, but null the rows PUA already
--                          covers. Dropping them outright would destroy 275
--                          Troubadour phase values and 800 construction_area
--                          values across three properties that have NO
--                          project-grain home, two of which are multi-project
--                          (Troubadour 3, HUB Broom 5) -- there is no honest
--                          project to migrate them to. Empty over wrong.
--   color_code,
--   install_date        -> UNTOUCHED. color_code has live readers in
--                          dale-chat (property-registry floors-summary + units
--                          routes) and PUA does not carry it. install_date is
--                          frozen by the open three-way delivery-date conflict
--                          pending BSI/Jim.
--
-- Divergence cannot silently return: a guard trigger rejects any write of
-- phase_no / construction_area onto a unit whose property already has a
-- project-grain PUA row, naming PUA in the error. The ingest-side counterpart is
-- scripts/lib/pua-coverage.mjs (shared resolver used by the matrix ingests).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Assert no property_units row resolves to MORE THAN ONE project's PUA row.
--    "Pick first" is never acceptable; if this ever trips, the multi-project
--    case must be resolved deliberately, not by this migration.
-- ---------------------------------------------------------------------------
do $$
declare n_ambiguous integer;
begin
  select count(*) into n_ambiguous
  from (
    select p.property_id, pu.unit_number
    from public.property_units pu
    join public.project_registry p on p.property_id = pu.property_id
    join public.project_unit_assignments a
      on a.project_id = p.id and a.unit_number = pu.unit_number
    group by 1, 2
    having count(distinct a.project_id) > 1
  ) amb;

  if n_ambiguous > 0 then
    raise exception
      'ABORT: % (property, unit_number) pair(s) resolve to multiple projects in project_unit_assignments. Resolve the multi-project case explicitly before de-duplicating.',
      n_ambiguous;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Assert the values we are about to discard are genuinely redundant.
--    We only null where PUA holds the SAME value; a real divergence must be
--    investigated, never silently overwritten by the "winner".
-- ---------------------------------------------------------------------------
do $$
declare n_divergent integer;
begin
  select count(*) into n_divergent
  from public.property_units pu
  join public.project_registry p on p.property_id = pu.property_id
  join public.project_unit_assignments a
    on a.project_id = p.id and a.unit_number = pu.unit_number
  where pu.truck_no          is distinct from a.truck_no
     or pu.phase_no          is distinct from a.phase_no
     or pu.construction_area is distinct from a.construction_area;

  if n_divergent > 0 then
    raise exception
      'ABORT: % covered unit(s) disagree between property_units and project_unit_assignments. Reconcile first -- do not let this migration pick a winner.',
      n_divergent;
  end if;
end $$;
-- NOTE: step 1 references pu.truck_no, so it only runs before step 2. Re-running
-- this file after the column is dropped will fail here; that is intentional --
-- the migration is not idempotent past the drop and should not be re-applied.

-- ---------------------------------------------------------------------------
-- 2. Drop the fully-superseded column.
-- ---------------------------------------------------------------------------
alter table public.property_units drop column if exists truck_no;

-- ---------------------------------------------------------------------------
-- 3. Null the covered duplicates, leaving legacy uncovered properties intact.
--    Scoped by an EXISTS on the project the unit actually belongs to -- never
--    a blanket wipe of the column.
-- ---------------------------------------------------------------------------
update public.property_units pu
   set phase_no          = null,
       construction_area = null
 where (pu.phase_no is not null or pu.construction_area is not null)
   and exists (
     select 1
     from public.project_registry p
     join public.project_unit_assignments a
       on a.project_id = p.id and a.unit_number = pu.unit_number
     where p.property_id = pu.property_id
   );

-- ---------------------------------------------------------------------------
-- 4. Declare the source of truth in the schema itself.
-- ---------------------------------------------------------------------------
comment on column public.property_units.phase_no is
  'LEGACY property-grain phase. NOT the source of truth. public.project_unit_assignments.phase_no is canonical for any unit that has a project-grain row; this column is retained only for properties not yet migrated (Troubadour 14th St). A guard trigger rejects writes here once PUA covers the unit.';

comment on column public.property_units.construction_area is
  'LEGACY property-grain construction area. NOT the source of truth. public.project_unit_assignments.construction_area is canonical for any unit that has a project-grain row; this column is retained only for properties not yet migrated (Troubadour 14th St, HUB Broom, HUB Clemson II). A guard trigger rejects writes here once PUA covers the unit.';

comment on column public.property_units.color_code is
  'Property-grain finish/scheme code. Lives here deliberately: read by dale-chat property-registry floors-summary and units routes, and project_unit_assignments does not carry it. Not part of the truck/phase single-home consolidation.';

-- ---------------------------------------------------------------------------
-- 5. Guard: make the dual home unrecreatable.
--    Fires when a write MENTIONS phase_no / construction_area, and also when a
--    row is re-parented (property_id changes) -- RITA's property-merge path
--    (MyApps/RITA cwb_sow_propagation/registry_iq_property_apply.sql) moves units
--    with `UPDATE property_units SET property_id = <target>`, which could
--    otherwise carry a legacy phase_no INTO a PUA-covered property without ever
--    naming the column. Unrelated updates (unit_type_id, floor_id, color_code,
--    install_date, ...) and merges of null-legacy rows are unaffected.
--
--    Verified 2026-07-29 in a rolled-back transaction:
--      legacy write on covered unit ................. BLOCKED
--      legacy write on uncovered property ........... ALLOWED
--      re-parent with null legacy columns ........... ALLOWED
--      re-parent legacy row into covered property ... BLOCKED
-- ---------------------------------------------------------------------------
create or replace function public.property_units_block_dual_home()
returns trigger
language plpgsql
as $$
declare
  v_project_id uuid;
  v_reparented boolean := false;
begin
  -- Clearing the legacy columns is always allowed (that is the desired direction).
  if new.phase_no is null and new.construction_area is null then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_reparented := new.property_id is distinct from old.property_id;

    -- Unchanged values on an unrelated UPDATE must not be blocked -- unless the
    -- row is being re-parented, which can newly expose it to PUA coverage.
    if not v_reparented
       and new.phase_no is not distinct from old.phase_no
       and new.construction_area is not distinct from old.construction_area then
      return new;
    end if;
  end if;

  select a.project_id
    into v_project_id
  from public.project_registry p
  join public.project_unit_assignments a
    on a.project_id = p.id and a.unit_number = new.unit_number
  where p.property_id = new.property_id
  limit 1;

  if v_project_id is not null then
    if v_reparented then
      raise exception
        'property_units unit % cannot be re-parented to property % while carrying legacy phase_no / construction_area: project_unit_assignments (project %) already owns unit-grain truck/phase/area facts there.',
        new.unit_number, new.property_id, v_project_id
        using hint = 'Null property_units.phase_no / construction_area on these rows before the merge, and let project_unit_assignments carry the facts.';
    else
      raise exception
        'property_units.phase_no / construction_area is deprecated for unit % : project_unit_assignments (project %) is the source of truth for unit-grain truck/phase/area facts.',
        new.unit_number, v_project_id
        using hint = 'Write unit-grain truck/phase/area facts to public.project_unit_assignments (see scripts/ingest_mh_matrix_master.py). Leave property_units.phase_no / construction_area null for migrated properties.';
    end if;
  end if;

  return new;
end $$;

comment on function public.property_units_block_dual_home() is
  'Prevents re-creating the unit-grain dual home resolved 2026-07-29: rejects writes of property_units.phase_no / construction_area for any unit already covered by public.project_unit_assignments, and rejects re-parenting a legacy-carrying unit into a covered property (RITA property-merge path).';

drop trigger if exists property_units_block_dual_home on public.property_units;

create trigger property_units_block_dual_home
  before insert or update of phase_no, construction_area, property_id
  on public.property_units
  for each row
  execute function public.property_units_block_dual_home();
