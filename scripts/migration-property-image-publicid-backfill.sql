-- ============================================================================
-- Registry-iQ — backfill public_id + format from Cloudinary URLs
-- Target: Registry-iQ Supabase (xhafhdaugmgdxckhdfov)
--
-- After migration-property-image-categories.sql normalized 33 legacy URL
-- strings into image objects, those objects have url= filled but
-- public_id='' (because we can't know the public_id at synthesis time).
-- Without a public_id, the DELETE route can't issue a Cloudinary destroy
-- and the assets won't appear in Cloudinary tag-based queries.
--
-- Cloudinary URLs are deterministic — no API call needed. Pattern:
--   https://res.cloudinary.com/{cloud}/image/upload/[transforms/]v{N}/{public_id}.{format}
--
-- Idempotent: only touches objects where public_id='' and url matches the
-- Cloudinary upload pattern.
-- ============================================================================

UPDATE public.property_registry p
SET images = (
  SELECT jsonb_agg(
    CASE
      WHEN jsonb_typeof(img) = 'object'
        AND coalesce(img->>'public_id', '') = ''
        AND (img->>'url') LIKE 'https://res.cloudinary.com/%'
        AND substring(img->>'url' FROM 'image/upload/(?:[^/]+/)*v[0-9]+/(.+)\.[^./]+$') IS NOT NULL
      THEN
        img || jsonb_build_object(
          'public_id', substring(img->>'url' FROM 'image/upload/(?:[^/]+/)*v[0-9]+/(.+)\.[^./]+$'),
          'format',    lower(coalesce(nullif(img->>'format', ''), substring(img->>'url' FROM '\.([a-zA-Z0-9]+)$')))
        )
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
      AND coalesce(img->>'public_id', '') = ''
      AND (img->>'url') LIKE 'https://res.cloudinary.com/%'
      AND substring(img->>'url' FROM 'image/upload/(?:[^/]+/)*v[0-9]+/(.+)\.[^./]+$') IS NOT NULL
  );
