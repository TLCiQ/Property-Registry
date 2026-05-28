-- ============================================================================
-- Registry-iQ — standard image columns across all entity registries
-- Target: Registry-iQ Supabase (xhafhdaugmgdxckhdfov)
--
-- Brings every entity registry to a consistent image-column shape so the
-- generic RegistryImageGallery component (dale-chat) can target any type:
--
--   images          jsonb NOT NULL DEFAULT '[]'::jsonb     -- gallery array
--   logo_image_url  text                                    -- top-left brand box
--   hero_image_url  text                                    -- banner
--
-- Status before this migration (2026-05-28 chat):
--   property:    images ✓  logo_image_url ✓  hero_image_url ✓
--   project:     images ✓  logo_image_url ✗  hero_image_url ✓
--   vendor:      images ✗  logo_image_url ✗  hero_image_url ✗
--   stakeholder: images ✗  logo_image_url ✗  hero_image_url ✗  (has legacy logo_url)
--   facility:    images ✗  logo_image_url ✗  hero_image_url ✗
--   contact:     (intentionally excluded — photo_url is a person headshot)
--
-- Stakeholder additionally: any existing logo_url is migrated to
-- logo_image_url + a synthesized role='logo' entry in images[]. Legacy
-- logo_url column is kept (marked deprecated) so existing callers don't break.
-- ============================================================================

-- project_registry already has images + hero_image_url; add logo_image_url
ALTER TABLE public.project_registry     ADD COLUMN IF NOT EXISTS logo_image_url text;

ALTER TABLE public.vendor_registry      ADD COLUMN IF NOT EXISTS images         jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.vendor_registry      ADD COLUMN IF NOT EXISTS logo_image_url text;
ALTER TABLE public.vendor_registry      ADD COLUMN IF NOT EXISTS hero_image_url text;

ALTER TABLE public.stakeholder_registry ADD COLUMN IF NOT EXISTS images         jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.stakeholder_registry ADD COLUMN IF NOT EXISTS logo_image_url text;
ALTER TABLE public.stakeholder_registry ADD COLUMN IF NOT EXISTS hero_image_url text;

ALTER TABLE public.facility_registry    ADD COLUMN IF NOT EXISTS images         jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.facility_registry    ADD COLUMN IF NOT EXISTS logo_image_url text;
ALTER TABLE public.facility_registry    ADD COLUMN IF NOT EXISTS hero_image_url text;

-- Stakeholder logo_url -> logo_image_url + images[role=logo] backfill
UPDATE public.stakeholder_registry s
SET
  logo_image_url = coalesce(s.logo_image_url, s.logo_url),
  images = CASE
    WHEN s.logo_url IS NOT NULL AND s.logo_url <> ''
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(coalesce(s.images, '[]'::jsonb)) AS img
        WHERE jsonb_typeof(img) = 'object' AND img->>'role' = 'logo'
      )
    THEN coalesce(s.images, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'id',          gen_random_uuid()::text,
      'url',         s.logo_url,
      'public_id',   coalesce(substring(s.logo_url FROM 'image/upload/(?:[^/]+/)*v[0-9]+/(.+)\.[^./]+$'), ''),
      'label',       'Logo',
      'role',        'logo',
      'focal_x',     0.5,
      'focal_y',     0.5,
      'zoom',        1,
      'width',       0,
      'height',      0,
      'format',      lower(coalesce(substring(s.logo_url FROM '\.([a-zA-Z0-9]+)$'), '')),
      'bytes',       0,
      'uploaded_at', now()
    ))
    ELSE s.images
  END
WHERE s.logo_url IS NOT NULL AND s.logo_url <> '';

COMMENT ON COLUMN public.stakeholder_registry.logo_url IS
  'DEPRECATED — use logo_image_url + images[role=logo] entry. Kept for backward compatibility.';
