-- ============================================================================
-- Registry-iQ — coalesce loser values into NULL survivor columns on merge
-- Target: Registry-iQ Supabase (xhafhdaugmgdxckhdfov)
--
-- Updates BOTH iqid_dry_run_merge and iqid_apply_merge to add a new step:
-- for every data column on the registry, if the survivor's value is NULL
-- and the loser's value is NOT NULL, fill the survivor from the loser.
--
-- Before this migration, "Merge L into R" kept R verbatim — even when R had
-- a NULL column that L had data for. Reviewers complained (correctly) that
-- they had to edit-then-merge to bring values across, which defeats the
-- point of a merge. New semantics:
--
--   - Survivor wins where survivor is NOT NULL (no change vs. old behavior).
--   - Loser fills the gaps where survivor IS NULL (NEW).
--   - external_ids: still additive (survivor wins on key collision; loser
--     keys not on survivor get added). Unchanged from before.
--   - Soft-delete / FK repoint / alias insert / iqid mint: unchanged.
--
-- Blacklist (columns NEVER coalesced — they have their own merge logic or
-- shouldn't be touched):
--   id, iqid, external_ids, notes, geo_point,
--   created_at, updated_at, created_by, updated_by,
--   normalized_name, display_name (both generated columns),
--   property_status, project_status, is_active (soft-delete fields)
--
-- The blacklist is applied per-table — if a column doesn't exist on a given
-- registry, the ANY() check is a no-op. New columns added to any registry
-- automatically participate in coalesce — opt-out via blacklist if needed.
-- ============================================================================

-- ─────────────────────── dry-run companion ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.iqid_dry_run_merge(
  p_entity_type public.iqid_entity_type,
  p_loser_id    uuid,
  p_survivor_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_registry_table text := p_entity_type::text || '_registry';
  v_name_column    text;
  v_status_column  text;
  v_loser_row      jsonb;
  v_survivor_row   jsonb;
  v_actions        jsonb := '[]'::jsonb;
  v_total_rows     int   := 0;
  v_warnings       text[] := ARRAY[]::text[];
  fk_row           record;
  v_loser_fk_value text;
  v_count          int;
  v_loser_ext      jsonb;
  v_survivor_ext   jsonb;
  v_conflicts      jsonb;
  v_coalesce_fields jsonb;
  v_blacklist      text[] := ARRAY[
    'id', 'iqid', 'external_ids', 'notes', 'geo_point',
    'created_at', 'updated_at', 'created_by', 'updated_by',
    'normalized_name', 'display_name',
    'property_status', 'project_status', 'is_active'
  ];
BEGIN
  v_name_column := CASE p_entity_type
    WHEN 'property'    THEN 'property_name'
    WHEN 'project'     THEN 'project_name'
    WHEN 'vendor'      THEN 'vendor_name'
    WHEN 'stakeholder' THEN 'stakeholder_name'
    WHEN 'contact'     THEN 'display_name'
    WHEN 'facility'    THEN 'facility_name'
  END;
  v_status_column := CASE p_entity_type
    WHEN 'property'    THEN 'property_status'
    WHEN 'project'     THEN 'project_status'
    ELSE 'is_active'
  END;

  IF p_loser_id = p_survivor_id THEN
    RAISE EXCEPTION 'Loser and survivor cannot be the same';
  END IF;

  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id = $1', v_registry_table)
    INTO v_loser_row USING p_loser_id;
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id = $1', v_registry_table)
    INTO v_survivor_row USING p_survivor_id;

  IF v_loser_row IS NULL THEN
    RAISE EXCEPTION 'Loser % not found in %', p_loser_id, v_registry_table;
  END IF;
  IF v_survivor_row IS NULL THEN
    RAISE EXCEPTION 'Survivor % not found in %', p_survivor_id, v_registry_table;
  END IF;

  -- ────────── FK repoints (count only, no mutations) ──────────
  FOR fk_row IN
    SELECT
      conrelid::regclass::text AS source_table,
      a.attname                AS source_column,
      af.attname               AS target_column,
      conname                  AS constraint_name,
      CASE confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
                       WHEN 'c' THEN 'CASCADE'   WHEN 'n' THEN 'SET NULL'
                       WHEN 'd' THEN 'SET DEFAULT' END AS on_delete
    FROM pg_constraint c
    JOIN pg_attribute a  ON a.attrelid  = c.conrelid  AND a.attnum  = c.conkey[1]
    JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = c.confkey[1]
    WHERE c.contype = 'f'
      AND confrelid::regclass::text = v_registry_table
  LOOP
    EXECUTE format('SELECT (%I)::text FROM public.%I WHERE id = $1',
                   fk_row.target_column, v_registry_table)
      INTO v_loser_fk_value USING p_loser_id;
    IF v_loser_fk_value IS NULL THEN CONTINUE; END IF;
    EXECUTE format('SELECT COUNT(*) FROM %s WHERE (%I)::text = $1',
                   fk_row.source_table, fk_row.source_column)
      INTO v_count USING v_loser_fk_value;
    IF v_count > 0 THEN
      v_actions := v_actions || jsonb_build_array(jsonb_build_object(
        'kind',           'fk_repoint',
        'source_table',   fk_row.source_table,
        'source_column',  fk_row.source_column,
        'target_column',  fk_row.target_column,
        'constraint_name', fk_row.constraint_name,
        'on_delete',      fk_row.on_delete,
        'row_count',      v_count,
        'self_referential', fk_row.source_table = v_registry_table
      ));
      v_total_rows := v_total_rows + v_count;
    END IF;
  END LOOP;

  -- ────────── external_ids merge diff (unchanged) ──────────
  v_loser_ext    := coalesce(v_loser_row->'external_ids',    '{}'::jsonb);
  v_survivor_ext := coalesce(v_survivor_row->'external_ids', '{}'::jsonb);
  v_conflicts := (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'key', l.key, 'loser', l.value, 'survivor', s.value
    )), '[]'::jsonb)
    FROM jsonb_each(v_loser_ext) l
    JOIN jsonb_each(v_survivor_ext) s ON l.key = s.key
    WHERE l.value <> s.value
  );
  v_actions := v_actions || jsonb_build_array(jsonb_build_object(
    'kind',         'external_ids_merge',
    'loser_keys',   (SELECT jsonb_agg(k) FROM jsonb_object_keys(v_loser_ext) AS k),
    'survivor_keys',(SELECT jsonb_agg(k) FROM jsonb_object_keys(v_survivor_ext) AS k),
    'conflicts',    v_conflicts,
    'merge_policy', 'loser keys not on survivor get copied; conflicts keep survivor value (loser conflict recorded)'
  ));

  -- ────────── NEW: coalesce fields preview ──────────
  -- Every loser column where loser has a value and survivor is NULL.
  -- jsonb-null semantics: to_jsonb(NULL_col) yields the JSON null literal,
  -- so we have to test jsonb_typeof rather than IS NULL.
  v_coalesce_fields := (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'col',   l.key,
      'value', l.value
    ) ORDER BY l.key), '[]'::jsonb)
    FROM jsonb_each(v_loser_row) l
    WHERE l.value IS NOT NULL
      AND jsonb_typeof(l.value) <> 'null'
      AND NOT (l.key = ANY(v_blacklist))
      AND (
        (v_survivor_row -> l.key) IS NULL
        OR jsonb_typeof(v_survivor_row -> l.key) = 'null'
      )
  );
  v_actions := v_actions || jsonb_build_array(jsonb_build_object(
    'kind',          'coalesce_fields',
    'fields_filled', v_coalesce_fields,
    'merge_policy',  'survivor wins when NOT NULL; loser fills NULL survivor columns'
  ));

  -- ────────── soft delete descriptor ──────────
  v_actions := v_actions || jsonb_build_array(jsonb_build_object(
    'kind',          'soft_delete',
    'status_column', v_status_column,
    'method',        CASE p_entity_type
                       WHEN 'property' THEN 'property_status := inactive'
                       WHEN 'project'  THEN 'project_status := inactive'
                       ELSE 'is_active := false'
                     END,
    'target_id',     p_loser_id
  ));

  -- ────────── alias insert descriptor ──────────
  v_actions := v_actions || jsonb_build_array(jsonb_build_object(
    'kind',       'alias_insert',
    'alias_name', v_loser_row->>v_name_column,
    'iqid',       v_survivor_row->>'iqid'
  ));

  -- ────────── warnings ──────────
  IF (v_survivor_row->>'iqid') IS NULL THEN
    v_warnings := v_warnings || ARRAY['survivor has no iqid; apply worker will mint one before alias insert'];
  END IF;
  IF (v_loser_row->>'iqid') IS NOT NULL THEN
    v_warnings := v_warnings || ARRAY['loser already has iqid ' || (v_loser_row->>'iqid') ||
                                       '; will be orphaned (kept on the soft-deleted row for audit)'];
  END IF;

  RETURN jsonb_build_object(
    'entity_type', p_entity_type,
    'loser', jsonb_build_object(
      'id',           p_loser_id,
      'iqid',         v_loser_row->>'iqid',
      'name',         v_loser_row->>v_name_column,
      'status',       v_loser_row->>v_status_column,
      'external_ids', v_loser_ext
    ),
    'survivor', jsonb_build_object(
      'id',           p_survivor_id,
      'iqid',         v_survivor_row->>'iqid',
      'name',         v_survivor_row->>v_name_column,
      'status',       v_survivor_row->>v_status_column,
      'external_ids', v_survivor_ext
    ),
    'actions',             v_actions,
    'total_rows_affected', v_total_rows,
    'warnings',            to_jsonb(v_warnings)
  );
END;
$$;

-- ─────────────────────── apply worker (mutating) ────────────────────────────

CREATE OR REPLACE FUNCTION public.iqid_apply_merge(
  p_entity_type public.iqid_entity_type,
  p_loser_id    uuid,
  p_survivor_id uuid,
  p_reviewer    text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_registry_table   text := p_entity_type::text || '_registry';
  v_name_column      text;
  v_status_column    text;
  v_status_to_set    text;
  v_loser_row        jsonb;
  v_survivor_row     jsonb;
  v_loser_ext        jsonb;
  v_survivor_ext     jsonb;
  v_merged_ext       jsonb;
  v_survivor_iqid    text;
  v_loser_name       text;
  v_actions          jsonb := '[]'::jsonb;
  v_total_rows       int   := 0;
  v_minted_iqid      boolean := false;
  fk_row             record;
  v_loser_fk_value   text;
  v_survivor_fk_value text;
  v_updated          int;
  v_notes_existing   text;
  v_warnings         text[] := ARRAY[]::text[];
  v_coalesce_set     text[] := ARRAY[]::text[];
  v_coalesce_fields  jsonb;
  v_blacklist        text[] := ARRAY[
    'id', 'iqid', 'external_ids', 'notes', 'geo_point',
    'created_at', 'updated_at', 'created_by', 'updated_by',
    'normalized_name', 'display_name',
    'property_status', 'project_status', 'is_active'
  ];
BEGIN
  v_name_column := CASE p_entity_type
    WHEN 'property'    THEN 'property_name'
    WHEN 'project'     THEN 'project_name'
    WHEN 'vendor'      THEN 'vendor_name'
    WHEN 'stakeholder' THEN 'stakeholder_name'
    WHEN 'contact'     THEN 'display_name'
    WHEN 'facility'    THEN 'facility_name'
  END;
  v_status_column := CASE p_entity_type
    WHEN 'property'    THEN 'property_status'
    WHEN 'project'     THEN 'project_status'
    ELSE 'is_active'
  END;

  IF p_loser_id = p_survivor_id THEN
    RAISE EXCEPTION 'Loser and survivor cannot be the same';
  END IF;

  -- Snapshot both rows
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id = $1', v_registry_table)
    INTO v_loser_row USING p_loser_id;
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id = $1', v_registry_table)
    INTO v_survivor_row USING p_survivor_id;

  IF v_loser_row    IS NULL THEN RAISE EXCEPTION 'Loser % not found in %',    p_loser_id,    v_registry_table; END IF;
  IF v_survivor_row IS NULL THEN RAISE EXCEPTION 'Survivor % not found in %', p_survivor_id, v_registry_table; END IF;

  v_loser_name := v_loser_row->>v_name_column;

  -- 1. Mint survivor iqid if missing
  v_survivor_iqid := v_survivor_row->>'iqid';
  IF v_survivor_iqid IS NULL THEN
    SELECT public.iqid_mint(p_entity_type) INTO v_survivor_iqid;
    EXECUTE format('UPDATE public.%I SET iqid = $1 WHERE id = $2', v_registry_table)
      USING v_survivor_iqid, p_survivor_id;
    v_minted_iqid := true;
  END IF;

  -- 2. Merge external_ids — additive only (survivor wins on conflict)
  v_loser_ext    := coalesce(v_loser_row->'external_ids',    '{}'::jsonb);
  v_survivor_ext := coalesce(v_survivor_row->'external_ids', '{}'::jsonb);
  v_merged_ext := v_survivor_ext;
  SELECT v_merged_ext || jsonb_object_agg(l.key, l.value)
    INTO v_merged_ext
  FROM jsonb_each(v_loser_ext) l
  WHERE NOT (v_survivor_ext ? l.key);
  IF v_merged_ext IS NULL THEN v_merged_ext := v_survivor_ext; END IF;
  IF v_merged_ext <> v_survivor_ext THEN
    EXECUTE format('UPDATE public.%I SET external_ids = $1 WHERE id = $2', v_registry_table)
      USING v_merged_ext, p_survivor_id;
  END IF;
  v_actions := v_actions || jsonb_build_array(jsonb_build_object(
    'kind',          'external_ids_merge',
    'keys_added',    (SELECT coalesce(jsonb_agg(l.key), '[]'::jsonb)
                       FROM jsonb_each(v_loser_ext) l
                       WHERE NOT (v_survivor_ext ? l.key)),
    'conflicts',     (SELECT coalesce(jsonb_agg(jsonb_build_object(
                                'key', l.key, 'loser', l.value, 'survivor', s.value
                              )), '[]'::jsonb)
                       FROM jsonb_each(v_loser_ext) l
                       JOIN jsonb_each(v_survivor_ext) s ON l.key = s.key
                       WHERE l.value <> s.value)
  ));

  -- 2.5 NEW: coalesce data columns — loser fills NULL survivor columns
  -- Build the audit payload + the SET clauses from the same snapshot.
  v_coalesce_fields := (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'col',   l.key,
      'value', l.value
    ) ORDER BY l.key), '[]'::jsonb)
    FROM jsonb_each(v_loser_row) l
    WHERE l.value IS NOT NULL
      AND jsonb_typeof(l.value) <> 'null'
      AND NOT (l.key = ANY(v_blacklist))
      AND (
        (v_survivor_row -> l.key) IS NULL
        OR jsonb_typeof(v_survivor_row -> l.key) = 'null'
      )
  );

  IF jsonb_array_length(v_coalesce_fields) > 0 THEN
    -- One SET piece per column to fill, using COALESCE so we're race-safe
    -- in the (unlikely) case that the survivor was updated between the
    -- snapshot and now.
    SELECT array_agg(format('%I = COALESCE(s.%I, l.%I)',
                            elem->>'col', elem->>'col', elem->>'col'))
      INTO v_coalesce_set
    FROM jsonb_array_elements(v_coalesce_fields) AS elem;

    EXECUTE format(
      'UPDATE public.%I s SET %s FROM public.%I l WHERE s.id = $1 AND l.id = $2',
      v_registry_table,
      array_to_string(v_coalesce_set, ', '),
      v_registry_table
    ) USING p_survivor_id, p_loser_id;

    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'kind',          'coalesce_fields',
      'fields_filled', v_coalesce_fields,
      'merge_policy',  'survivor wins when NOT NULL; loser filled NULL survivor columns'
    ));
  ELSE
    -- Still emit the action so the audit trail shows we considered it
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'kind',          'coalesce_fields',
      'fields_filled', '[]'::jsonb,
      'merge_policy',  'no NULL survivor columns had loser values to fill'
    ));
  END IF;

  -- 3. FK repoints
  FOR fk_row IN
    SELECT
      conrelid::regclass::text AS source_table,
      a.attname                AS source_column,
      af.attname               AS target_column,
      conname                  AS constraint_name
    FROM pg_constraint c
    JOIN pg_attribute a  ON a.attrelid  = c.conrelid  AND a.attnum  = c.conkey[1]
    JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = c.confkey[1]
    WHERE c.contype = 'f'
      AND confrelid::regclass::text = v_registry_table
  LOOP
    EXECUTE format('SELECT (%I)::text FROM public.%I WHERE id = $1',
                   fk_row.target_column, v_registry_table)
      INTO v_loser_fk_value USING p_loser_id;
    EXECUTE format('SELECT (%I)::text FROM public.%I WHERE id = $1',
                   fk_row.target_column, v_registry_table)
      INTO v_survivor_fk_value USING p_survivor_id;

    IF v_loser_fk_value IS NULL OR v_survivor_fk_value IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('UPDATE %s SET %I = $1 WHERE (%I)::text = $2',
                   fk_row.source_table, fk_row.source_column, fk_row.source_column)
      USING v_survivor_fk_value, v_loser_fk_value;
    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated > 0 THEN
      v_actions := v_actions || jsonb_build_array(jsonb_build_object(
        'kind',           'fk_repoint',
        'source_table',   fk_row.source_table,
        'source_column',  fk_row.source_column,
        'target_column',  fk_row.target_column,
        'constraint_name', fk_row.constraint_name,
        'rows_updated',   v_updated
      ));
      v_total_rows := v_total_rows + v_updated;
    END IF;
  END LOOP;

  -- 4. Insert alias (loser name → survivor iqid)
  IF v_loser_name IS NOT NULL AND v_loser_name <> '' THEN
    BEGIN
      INSERT INTO public.registry_alias (entity_type, iqid, registry_id, alias_name, source, notes)
      VALUES (p_entity_type, v_survivor_iqid, p_survivor_id, v_loser_name,
              'iqid_apply_merge',
              'Merged loser ' || p_loser_id::text || ' (registry row soft-deleted)');
      v_actions := v_actions || jsonb_build_array(jsonb_build_object(
        'kind', 'alias_insert', 'alias_name', v_loser_name, 'iqid', v_survivor_iqid
      ));
    EXCEPTION WHEN unique_violation THEN
      v_actions := v_actions || jsonb_build_array(jsonb_build_object(
        'kind', 'alias_insert_skipped', 'alias_name', v_loser_name,
        'reason', 'already-known alias'
      ));
    END;
  END IF;

  -- 5. Soft delete the loser
  v_status_to_set := CASE p_entity_type
    WHEN 'property' THEN 'inactive'
    WHEN 'project'  THEN 'inactive'
    ELSE NULL
  END;

  EXECUTE format('SELECT notes FROM public.%I WHERE id = $1', v_registry_table)
    INTO v_notes_existing USING p_loser_id;

  IF p_entity_type IN ('property','project') THEN
    EXECUTE format(
      'UPDATE public.%I SET %I = $1, notes = $2 WHERE id = $3',
      v_registry_table, v_status_column
    ) USING v_status_to_set,
            coalesce(v_notes_existing || E'\n\n', '') ||
            '[MERGED ' || to_char(now(), 'YYYY-MM-DD HH24:MI') ||
            '] Merged into ' || p_survivor_id::text ||
            ' (iqid=' || v_survivor_iqid || ')' ||
            CASE WHEN p_reviewer IS NOT NULL THEN ' by ' || p_reviewer ELSE '' END,
            p_loser_id;
  ELSE
    EXECUTE format(
      'UPDATE public.%I SET %I = false, notes = $1 WHERE id = $2',
      v_registry_table, v_status_column
    ) USING coalesce(v_notes_existing || E'\n\n', '') ||
            '[MERGED ' || to_char(now(), 'YYYY-MM-DD HH24:MI') ||
            '] Merged into ' || p_survivor_id::text ||
            ' (iqid=' || v_survivor_iqid || ')' ||
            CASE WHEN p_reviewer IS NOT NULL THEN ' by ' || p_reviewer ELSE '' END,
            p_loser_id;
  END IF;

  v_actions := v_actions || jsonb_build_array(jsonb_build_object(
    'kind', 'soft_delete', 'status_column', v_status_column,
    'value', CASE WHEN v_status_to_set IS NOT NULL THEN to_jsonb(v_status_to_set)
                  ELSE to_jsonb(false) END
  ));

  IF v_minted_iqid THEN
    v_warnings := v_warnings || ARRAY['minted survivor iqid: ' || v_survivor_iqid];
  END IF;

  RETURN jsonb_build_object(
    'ok',                  true,
    'entity_type',         p_entity_type,
    'loser_id',            p_loser_id,
    'survivor_id',         p_survivor_id,
    'survivor_iqid',       v_survivor_iqid,
    'minted_iqid',         v_minted_iqid,
    'actions',             v_actions,
    'total_rows_affected', v_total_rows,
    'warnings',            to_jsonb(v_warnings),
    'applied_at',          now()
  );
END;
$$;

COMMENT ON FUNCTION public.iqid_apply_merge(public.iqid_entity_type, uuid, uuid, text) IS
  'Executes a merge decision atomically — mints survivor iqid if needed, merges external_ids (additive), coalesces data columns (loser fills NULL survivor columns), repoints every FK to the survivor, inserts the loser name as an alias, soft-deletes the loser. Returns a jsonb report with actual rows affected. Companion: iqid_dry_run_merge.';

COMMENT ON FUNCTION public.iqid_dry_run_merge(public.iqid_entity_type, uuid, uuid) IS
  'Returns a jsonb plan describing what an apply-merge would change — FK repoints (with counts), external_ids merge with conflicts, coalesce fields preview (which NULL survivor columns will be filled from loser), soft-delete action, and alias insert. No mutations. Used by the registry-review apply preview and admin sweep.';
