-- One-time retry for registry_dedupe_review rows marked merged but never applied
-- (apply_error set during the uuid/text FK cast bug). Safe to re-run: idempotent
-- on already-inactive losers.
--
-- Usage (Registry-iQ Supabase xhafhdaugmgdxckhdfov):
--   Run via Supabase SQL editor or apply_migration / execute_sql

DO $$
DECLARE
  r record;
  v_survivor uuid;
  v_loser uuid;
  v_result jsonb;
BEGIN
  FOR r IN
    SELECT id, entity_type, left_id, right_id
    FROM public.registry_dedupe_review
    WHERE review_status = 'merged'
      AND applied_at IS NULL
      AND apply_error IS NOT NULL
  LOOP
    BEGIN
      v_survivor := public.iqid_pick_survivor(r.entity_type, r.left_id, r.right_id);
      v_loser := CASE WHEN v_survivor = r.left_id THEN r.right_id ELSE r.left_id END;
      v_result := public.iqid_apply_merge(r.entity_type, v_loser, v_survivor, 'retry-stuck-applies');

      UPDATE public.registry_dedupe_review SET
        applied_at     = now(),
        apply_report   = v_result,
        apply_error    = NULL,
        resolved_iqid  = v_result->>'survivor_iqid',
        reviewer_notes = coalesce(reviewer_notes || E'\n', '') ||
          '[retry apply ' || to_char(now(), 'YYYY-MM-DD HH24:MI') || ']'
      WHERE id = r.id;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.registry_dedupe_review SET apply_error = SQLERRM WHERE id = r.id;
    END;
  END LOOP;
END $$;
