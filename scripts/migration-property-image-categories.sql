-- ============================================================================
-- Registry-iQ — property image category backfill
-- Target: Registry-iQ Supabase (xhafhdaugmgdxckhdfov)
--
-- Expands property_registry.images[].role from { 'hero' | 'gallery' } to
-- { 'logo' | 'hero' | 'exterior' | 'common_amenity' | 'units' }.
--
-- Two things this migration does:
--
-- 1. Normalize legacy string entries — 33 image entries today are stored as
--    raw URL strings (RITA-set floorplan URLs from before the gallery UI),
--    not full PropertyImage objects. Synthesize a complete object for each
--    so the UI can render them consistently.
--
-- 2. Backfill role values per chat decision (2026-05-28):
--      hero                                            → hero          (unchanged)
--      logo                                            → logo          (unchanged)
--      exterior / common_amenity / units               → unchanged
--      gallery / null / anything else                  → exterior      (default)
--      (string entries also default to exterior)
--
-- Idempotent: only touches rows whose images array still contains a
-- non-object entry or a role outside the canonical set.
-- ============================================================================

BEGIN;

UPDATE public.property_registry p
SET images = (
  SELECT jsonb_agg(
    CASE
      -- String entries (legacy floorplan URLs etc.) → full object
      WHEN jsonb_typeof(img) = 'string' THEN
        jsonb_build_object(
          'id',          gen_random_uuid()::text,
          'url',         img #>> '{}',
          'public_id',   '',
          'label',       regexp_replace(img #>> '{}', '^.*/([^/]+?)(\.[^./]+)?$', '\1'),
          'role',        'exterior',
          'focal_x',     0.5,
          'focal_y',     0.5,
          'zoom',        1,
          'width',       0,
          'height',      0,
          'format',      '',
          'bytes',       0,
          'uploaded_at', now()
        )
      -- Object entries with already-canonical role → unchanged
      WHEN img->>'role' IN ('logo', 'hero', 'exterior', 'common_amenity', 'units') THEN
        img
      -- Object entries with gallery / null / anything else → role=exterior
      ELSE
        jsonb_set(img, '{role}', '"exterior"')
    END
    ORDER BY ordinality
  )
  FROM jsonb_array_elements(p.images) WITH ORDINALITY AS t(img, ordinality)
)
WHERE jsonb_typeof(p.images) = 'array'
  AND jsonb_array_length(p.images) > 0
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p.images) AS img
    WHERE jsonb_typeof(img) <> 'object'
       OR img->>'role' IS NULL
       OR img->>'role' NOT IN ('logo', 'hero', 'exterior', 'common_amenity', 'units')
  );

COMMIT;

-- Verification:
-- SELECT img->>'role' AS role, COUNT(*) FROM public.property_registry,
--   jsonb_array_elements(images) AS img GROUP BY 1 ORDER BY 2 DESC;
--
-- SELECT jsonb_typeof(img) AS t, COUNT(*) FROM public.property_registry,
--   jsonb_array_elements(images) AS img GROUP BY 1;
