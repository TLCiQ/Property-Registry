-- Property Registry — Migration 002: Drop leasing_url
-- Consolidated on property_url as the single web presence field.
-- Preserves any existing leasing_url values in external_ids.legacy_leasing_url.

BEGIN;

UPDATE public.property_registry
SET external_ids = COALESCE(external_ids, '{}'::jsonb) || jsonb_build_object('legacy_leasing_url', leasing_url)
WHERE leasing_url IS NOT NULL
  AND btrim(leasing_url) <> ''
  AND NOT (COALESCE(external_ids, '{}'::jsonb) ? 'legacy_leasing_url');

ALTER TABLE public.property_registry
    DROP COLUMN IF EXISTS leasing_url;

COMMIT;
