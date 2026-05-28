-- ============================================================================
-- Registry-iQ — re-categorize legacy floorplan URLs to unit_layout
-- Target: Registry-iQ Supabase (xhafhdaugmgdxckhdfov)
--
-- The 33 Raleigh floorplan URLs got defaulted to role='exterior' by the
-- initial backfill (migration-property-image-categories.sql) because we
-- didn't have category-aware URL parsing in that step.
--
-- Now we know better: URLs containing /floorplans/ or _fp_ are per-unit-type
-- floorplans, which the chat-locked taxonomy (8 categories, framing A)
-- classifies as 'unit_layout'. Reviewer can manually re-bucket any specific
-- asset to 'floorplan' (building-level) or 'site_plan' (whole site) in the
-- gallery UI.
--
-- Idempotent: only updates objects currently role='exterior' that match the
-- known floorplan URL patterns.
-- ============================================================================

UPDATE public.property_registry p
SET images = (
  SELECT jsonb_agg(
    CASE
      WHEN jsonb_typeof(img) = 'object'
        AND img->>'role' = 'exterior'
        AND ((img->>'url') ~* '/floorplans/' OR (img->>'url') ~* '_fp_')
      THEN jsonb_set(img, '{role}', '"unit_layout"')
      ELSE img
    END
    ORDER BY ordinality
  )
  FROM jsonb_array_elements(p.images) WITH ORDINALITY AS t(img, ordinality)
)
WHERE jsonb_typeof(p.images) = 'array'
  AND jsonb_array_length(p.images) > 0
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(p.images) AS img
    WHERE jsonb_typeof(img) = 'object'
      AND img->>'role' = 'exterior'
      AND ((img->>'url') ~* '/floorplans/' OR (img->>'url') ~* '_fp_')
  );
