-- ============================================================================
-- Registry-iQ — block merge when project rows have different project_id
-- Target: Registry-iQ Supabase (xhafhdaugmgdxckhdfov)
--
-- Business rule: two project_registry rows with different non-null project_id
-- values are distinct deals — never merge candidates (manual or auto-sweep).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.iqid_project_ids_block_merge(
  p_row_a uuid,
  p_row_b uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_registry a
    JOIN public.project_registry b ON b.id = p_row_b
    WHERE a.id = p_row_a
      AND a.project_id IS NOT NULL
      AND b.project_id IS NOT NULL
      AND trim(a.project_id) <> ''
      AND trim(b.project_id) <> ''
      AND trim(a.project_id) <> trim(b.project_id)
  );
$$;

COMMENT ON FUNCTION public.iqid_project_ids_block_merge(uuid, uuid) IS
  'True when both project_registry rows have non-null, non-empty project_id values that differ.';

-- Backfill match_reason on existing project pairs (unordered left/right ids).
UPDATE public.registry_dedupe_review r
SET match_reason = coalesce(r.match_reason, '{}'::jsonb) || jsonb_build_object(
  'project_id_left',  pl.project_id,
  'project_id_right', pr.project_id,
  'project_id_match',
    (pl.project_id IS NOT NULL AND pr.project_id IS NOT NULL AND trim(pl.project_id) = trim(pr.project_id)),
  'project_id_conflict', public.iqid_project_ids_block_merge(r.left_id, r.right_id),
  'merge_blocked', public.iqid_project_ids_block_merge(r.left_id, r.right_id)
)
FROM public.project_registry pl,
     public.project_registry pr
WHERE r.entity_type = 'project'
  AND pl.id = r.left_id
  AND pr.id = r.right_id;

-- Guard iqid_apply_merge (defense in depth).
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
  v_ext_merge        jsonb;
  v_scalar_combine   jsonb;
  v_survivor_iqid    text;
  v_loser_name       text;
  v_actions          jsonb := '[]'::jsonb;
  v_total_rows       int   := 0;
  v_minted_iqid      boolean := false;
  fk_row             record;
  uq_row             record;
  v_loser_fk_value   text;
  v_survivor_fk_value text;
  v_updated          int;
  v_deleted          int;
  v_uq_other_cols    text[];
  v_join_conds       text;
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
  v_left_project_id  text;
  v_right_project_id text;
BEGIN
  IF p_entity_type = 'project'
     AND public.iqid_project_ids_block_merge(p_loser_id, p_survivor_id) THEN
    SELECT project_id INTO v_left_project_id  FROM public.project_registry WHERE id = p_loser_id;
    SELECT project_id INTO v_right_project_id FROM public.project_registry WHERE id = p_survivor_id;
    RAISE EXCEPTION
      'Cannot merge projects with different project_id values (% vs %)',
      coalesce(v_left_project_id, '?'),
      coalesce(v_right_project_id, '?');
  END IF;

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

  IF v_loser_row    IS NULL THEN RAISE EXCEPTION 'Loser % not found in %',    p_loser_id,    v_registry_table; END IF;
  IF v_survivor_row IS NULL THEN RAISE EXCEPTION 'Survivor % not found in %', p_survivor_id, v_registry_table; END IF;

  v_loser_name := v_loser_row->>v_name_column;

  v_survivor_iqid := v_survivor_row->>'iqid';
  IF v_survivor_iqid IS NULL THEN
    SELECT public.iqid_mint(p_entity_type) INTO v_survivor_iqid;
    EXECUTE format('UPDATE public.%I SET iqid = $1 WHERE id = $2', v_registry_table)
      USING v_survivor_iqid, p_survivor_id;
    v_minted_iqid := true;
  END IF;

  v_loser_ext    := coalesce(v_loser_row->'external_ids',    '{}'::jsonb);
  v_survivor_ext := coalesce(v_survivor_row->'external_ids', '{}'::jsonb);
  v_ext_merge    := public.iqid_merge_external_ids(v_survivor_ext, v_loser_ext);
  v_merged_ext   := v_ext_merge->'merged';

  v_scalar_combine := public.iqid_combine_scalar_identifiers(
    p_entity_type, v_survivor_row, v_loser_row, v_merged_ext
  );
  v_merged_ext := v_scalar_combine->'ext';

  IF v_merged_ext <> v_survivor_ext THEN
    EXECUTE format('UPDATE public.%I SET external_ids = $1 WHERE id = $2', v_registry_table)
      USING v_merged_ext, p_survivor_id;
  END IF;

  v_actions := v_actions || jsonb_build_array(jsonb_build_object(
    'kind',               'external_ids_merge',
    'keys_added',         v_ext_merge->'keys_added',
    'combined_conflicts', v_ext_merge->'combined_conflicts',
    'merge_policy',       'additive keys; conflicts combined in merged_refs[key][]'
  ));

  IF jsonb_array_length(coalesce(v_scalar_combine->'combined', '[]'::jsonb)) > 0 THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'kind',     'combine_identifiers',
      'combined', v_scalar_combine->'combined',
      'merge_policy', 'survivor column primary; loser in alternate_* arrays'
    ));
  END IF;

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
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'kind',          'coalesce_fields',
      'fields_filled', '[]'::jsonb,
      'merge_policy',  'no NULL survivor columns had loser values to fill'
    ));
  END IF;

  FOR fk_row IN
    SELECT
      conrelid::regclass::text AS source_table,
      a.attname                AS source_column,
      format_type(a.atttypid, a.atttypmod) AS source_col_type,
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

    FOR uq_row IN
      SELECT
        c.conname,
        array_agg(a.attname ORDER BY u.ord) AS cols
      FROM pg_constraint c
      JOIN unnest(c.conkey) WITH ORDINALITY AS u(attnum, ord) ON true
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = u.attnum
      WHERE c.contype = 'u'
        AND c.conrelid = fk_row.source_table::regclass
      GROUP BY c.conname
    LOOP
      IF NOT (fk_row.source_column = ANY(uq_row.cols)) THEN
        CONTINUE;
      END IF;

      SELECT array_agg(col)
        INTO v_uq_other_cols
      FROM unnest(uq_row.cols) AS col
      WHERE col <> fk_row.source_column;

      IF v_uq_other_cols IS NULL OR cardinality(v_uq_other_cols) = 0 THEN
        CONTINUE;
      END IF;

      SELECT string_agg(format('l.%I = s.%I', oc, oc), ' AND ')
        INTO v_join_conds
      FROM unnest(v_uq_other_cols) AS oc;

      EXECUTE format(
        'DELETE FROM %s l USING %s s
         WHERE l.%I = $1::%s
           AND s.%I = $2::%s
           AND %s',
        fk_row.source_table,
        fk_row.source_table,
        fk_row.source_column,
        fk_row.source_col_type,
        fk_row.source_column,
        fk_row.source_col_type,
        v_join_conds
      ) USING v_loser_fk_value, v_survivor_fk_value;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;

      IF v_deleted > 0 THEN
        v_actions := v_actions || jsonb_build_array(jsonb_build_object(
          'kind',            'fk_dedupe_delete',
          'source_table',    fk_row.source_table,
          'constraint_name', uq_row.conname,
          'rows_deleted',    v_deleted
        ));
        v_total_rows := v_total_rows + v_deleted;
      END IF;
    END LOOP;

    EXECUTE format(
      'UPDATE %s SET %I = $1::%s WHERE %I = $2::%s',
      fk_row.source_table,
      fk_row.source_column,
      fk_row.source_col_type,
      fk_row.source_column,
      fk_row.source_col_type
    ) USING v_survivor_fk_value, v_loser_fk_value;
    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated > 0 THEN
      v_actions := v_actions || jsonb_build_array(jsonb_build_object(
        'kind',           'fk_repoint',
        'source_table',   fk_row.source_table,
        'source_column',  fk_row.source_column,
        'source_col_type', fk_row.source_col_type,
        'target_column',  fk_row.target_column,
        'constraint_name', fk_row.constraint_name,
        'rows_updated',   v_updated
      ));
      v_total_rows := v_total_rows + v_updated;
    END IF;
  END LOOP;

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

-- Exclude conflicting project_id pairs from auto-merge sweep.
CREATE OR REPLACE FUNCTION public.iqid_sweep_auto_merge(
  p_entity_type public.iqid_entity_type DEFAULT NULL,
  p_max_count   int DEFAULT 50,
  p_reviewer    text DEFAULT NULL,
  p_dry_run     boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_pair         record;
  v_processed    int := 0;
  v_succeeded    int := 0;
  v_failed       int := 0;
  v_results      jsonb := '[]'::jsonb;
  v_survivor_id  uuid;
  v_loser_id     uuid;
  v_apply_result jsonb;
  v_err          text;
  v_resolution   text;
  v_qualifying   int;
BEGIN
  SELECT count(*) INTO v_qualifying
  FROM public.registry_dedupe_review r
  WHERE r.review_status = 'needs_review'
    AND r.applied_at IS NULL
    AND r.match_score >= 0.98
    AND (p_entity_type IS NULL OR r.entity_type = p_entity_type)
    AND NOT (
      r.entity_type = 'project'
      AND public.iqid_project_ids_block_merge(r.left_id, r.right_id)
    )
    AND (
      ((r.match_reason->>'city_match')::boolean AND (r.match_reason->>'state_match')::boolean)
      OR (r.match_reason->>'external_ids_overlap')::boolean
      OR (r.entity_type = 'contact'     AND (r.match_reason->>'email_match')::boolean)
      OR (r.entity_type = 'stakeholder' AND (r.match_reason->>'website_match')::boolean)
    );

  IF p_dry_run THEN
    RETURN jsonb_build_object(
      'dry_run',     true,
      'qualifying',  v_qualifying,
      'would_apply', LEAST(v_qualifying, p_max_count),
      'rule',        'score >= 0.98 AND corroborating signal AND NOT (project with conflicting project_id)'
    );
  END IF;

  FOR v_pair IN
    SELECT id, entity_type, left_id, right_id, match_reason, match_score
    FROM public.registry_dedupe_review r
    WHERE r.review_status = 'needs_review'
      AND r.applied_at IS NULL
      AND r.match_score >= 0.98
      AND (p_entity_type IS NULL OR r.entity_type = p_entity_type)
      AND NOT (
        r.entity_type = 'project'
        AND public.iqid_project_ids_block_merge(r.left_id, r.right_id)
      )
      AND (
        ((r.match_reason->>'city_match')::boolean AND (r.match_reason->>'state_match')::boolean)
        OR (r.match_reason->>'external_ids_overlap')::boolean
        OR (r.entity_type = 'contact'     AND (r.match_reason->>'email_match')::boolean)
        OR (r.entity_type = 'stakeholder' AND (r.match_reason->>'website_match')::boolean)
      )
    ORDER BY match_score DESC, created_at ASC
    LIMIT p_max_count
  LOOP
    BEGIN
      v_survivor_id := public.iqid_pick_survivor(v_pair.entity_type, v_pair.left_id, v_pair.right_id);
      v_loser_id    := CASE WHEN v_survivor_id = v_pair.left_id THEN v_pair.right_id ELSE v_pair.left_id END;
      v_resolution  := CASE WHEN v_survivor_id = v_pair.right_id
                              THEN 'merge_left_into_right'
                            ELSE 'merge_right_into_left' END;

      v_apply_result := public.iqid_apply_merge(
        v_pair.entity_type, v_loser_id, v_survivor_id,
        coalesce(p_reviewer, 'auto-sweep')
      );

      UPDATE public.registry_dedupe_review SET
        review_status   = 'merged',
        resolution      = v_resolution,
        resolved_iqid   = v_apply_result->>'survivor_iqid',
        reviewed_by     = coalesce(p_reviewer, 'auto-sweep'),
        reviewed_at     = now(),
        applied_at      = now(),
        apply_report    = v_apply_result,
        apply_error     = NULL,
        reviewer_notes  = coalesce(reviewer_notes || E'\n', '') ||
                          '[auto-merge sweep at ' || to_char(now(), 'YYYY-MM-DD HH24:MI') ||
                          '] resolution=' || v_resolution
      WHERE id = v_pair.id;

      v_succeeded := v_succeeded + 1;
      v_results := v_results || jsonb_build_array(jsonb_build_object(
        'pair_id',       v_pair.id,
        'entity_type',   v_pair.entity_type,
        'status',        'applied',
        'survivor_id',   v_survivor_id,
        'loser_id',      v_loser_id,
        'survivor_iqid', v_apply_result->>'survivor_iqid',
        'rows_affected', (v_apply_result->>'total_rows_affected')::int,
        'minted_iqid',   (v_apply_result->>'minted_iqid')::boolean
      ));

    EXCEPTION WHEN OTHERS THEN
      v_err := SQLERRM;
      UPDATE public.registry_dedupe_review
      SET apply_error = v_err
      WHERE id = v_pair.id;

      v_failed := v_failed + 1;
      v_results := v_results || jsonb_build_array(jsonb_build_object(
        'pair_id',     v_pair.id,
        'entity_type', v_pair.entity_type,
        'status',      'failed',
        'error',       v_err
      ));
    END;
    v_processed := v_processed + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'dry_run',    false,
    'qualifying', v_qualifying,
    'processed',  v_processed,
    'succeeded',  v_succeeded,
    'failed',     v_failed,
    'remaining',  GREATEST(v_qualifying - v_processed, 0),
    'results',    v_results
  );
END;
$$;
