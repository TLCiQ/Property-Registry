-- ============================================================================
-- Registry-iQ — iqid_sweep_auto_merge + iqid_pick_survivor
-- Target: Registry-iQ Supabase (xhafhdaugmgdxckhdfov)
--
-- Bulk decide-and-apply for dedupe pairs that satisfy the compound
-- auto-merge rule (decided in chat 2026-05-28):
--
--   match_score >= 0.98
--   AND (
--     (city_match AND state_match)
--     OR external_ids_overlap
--     OR (entity_type='contact'     AND email_match)
--     OR (entity_type='stakeholder' AND website_match)
--   )
--
-- For each qualifying pair the sweep:
--   1. Picks a survivor via iqid_pick_survivor — prefer the row that
--      already has an iqid; tie-break by external_ids key count; final
--      tie-break by created_at (older wins).
--   2. Calls iqid_apply_merge to actually move data.
--   3. Marks registry_dedupe_review row merged + applied + resolution +
--      apply_report. apply_error captured on failure with the row left in
--      its prior state for human triage.
--
-- Each pair is wrapped in its own EXCEPTION block so a single bad pair
-- doesn't abort the sweep.
-- ============================================================================

-- Heuristic survivor picker
CREATE OR REPLACE FUNCTION public.iqid_pick_survivor(
  p_entity_type public.iqid_entity_type,
  p_left_id     uuid,
  p_right_id    uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_registry_table text := p_entity_type::text || '_registry';
  v_left_keys      int;
  v_right_keys     int;
  v_left_iqid      text;
  v_right_iqid     text;
  v_left_created   timestamptz;
  v_right_created  timestamptz;
BEGIN
  EXECUTE format($q$
    SELECT
      (SELECT count(*) FROM jsonb_object_keys(coalesce(external_ids, '{}'::jsonb))),
      iqid,
      created_at
    FROM public.%I WHERE id = $1
  $q$, v_registry_table)
  INTO v_left_keys, v_left_iqid, v_left_created
  USING p_left_id;

  EXECUTE format($q$
    SELECT
      (SELECT count(*) FROM jsonb_object_keys(coalesce(external_ids, '{}'::jsonb))),
      iqid,
      created_at
    FROM public.%I WHERE id = $1
  $q$, v_registry_table)
  INTO v_right_keys, v_right_iqid, v_right_created
  USING p_right_id;

  -- iqid already minted → wins
  IF v_left_iqid  IS NOT NULL AND v_right_iqid IS NULL     THEN RETURN p_left_id;  END IF;
  IF v_right_iqid IS NOT NULL AND v_left_iqid  IS NULL     THEN RETURN p_right_id; END IF;

  -- More external_ids keys → wins
  IF v_left_keys  > v_right_keys  THEN RETURN p_left_id;  END IF;
  IF v_right_keys > v_left_keys   THEN RETURN p_right_id; END IF;

  -- Final tie-break: older row wins (longer-standing canonical)
  IF v_left_created <= v_right_created THEN RETURN p_left_id; END IF;
  RETURN p_right_id;
END;
$$;

COMMENT ON FUNCTION public.iqid_pick_survivor(public.iqid_entity_type, uuid, uuid) IS
  'Pick the survivor for an auto-merge: prefer existing iqid, then more external_ids keys, then older created_at.';


-- The sweep
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
  -- Count qualifying pairs (for both dry-run and final report)
  SELECT count(*) INTO v_qualifying
  FROM public.registry_dedupe_review
  WHERE review_status = 'needs_review'
    AND applied_at IS NULL
    AND match_score >= 0.98
    AND (p_entity_type IS NULL OR entity_type = p_entity_type)
    AND (
      ((match_reason->>'city_match')::boolean AND (match_reason->>'state_match')::boolean)
      OR (match_reason->>'external_ids_overlap')::boolean
      OR (entity_type = 'contact'     AND (match_reason->>'email_match')::boolean)
      OR (entity_type = 'stakeholder' AND (match_reason->>'website_match')::boolean)
    );

  IF p_dry_run THEN
    RETURN jsonb_build_object(
      'dry_run',     true,
      'qualifying',  v_qualifying,
      'would_apply', LEAST(v_qualifying, p_max_count),
      'rule',        'score >= 0.98 AND (city+state match OR external_ids_overlap OR per-entity match)'
    );
  END IF;

  FOR v_pair IN
    SELECT id, entity_type, left_id, right_id, match_reason, match_score
    FROM public.registry_dedupe_review
    WHERE review_status = 'needs_review'
      AND applied_at IS NULL
      AND match_score >= 0.98
      AND (p_entity_type IS NULL OR entity_type = p_entity_type)
      AND (
        ((match_reason->>'city_match')::boolean AND (match_reason->>'state_match')::boolean)
        OR (match_reason->>'external_ids_overlap')::boolean
        OR (entity_type = 'contact'     AND (match_reason->>'email_match')::boolean)
        OR (entity_type = 'stakeholder' AND (match_reason->>'website_match')::boolean)
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

COMMENT ON FUNCTION public.iqid_sweep_auto_merge(public.iqid_entity_type, int, text, boolean) IS
  'Auto-decide and auto-apply dedupe pairs that satisfy the compound auto-merge rule. Each pair runs in its own EXCEPTION block; a single failure does not abort the sweep. Pass p_dry_run=true for a count-only preview.';
