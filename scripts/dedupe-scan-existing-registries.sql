-- ============================================================================
-- Registry-iQ — one-time dedupe scan of existing rows
-- Target: Registry-iQ Supabase (xhafhdaugmgdxckhdfov)
--
-- For each externally-sourced registry (property, project, vendor, stakeholder,
-- contact, facility), find pairwise candidates whose normalized_name trigram
-- similarity is >= 0.75 and INSERT them into public.registry_dedupe_review.
--
-- Idempotent via the unordered-pair unique index on
-- (entity_type, LEAST(left_id, right_id), GREATEST(left_id, right_id)) —
-- we always insert with left_id < right_id so re-runs don't double-stage.
--
-- match_score = trigram similarity of normalized_name.
-- match_reason captures supporting signals (city/state/external_ids/etc.)
-- so the AI pre-pass and human reviewer have full context.
-- ============================================================================

BEGIN;

-- Help the GIN index probe surface enough candidates. Filter to >= 0.75 in WHERE.
SET LOCAL pg_trgm.similarity_threshold = 0.75;

-- Helper: do two jsonb external_ids share any (key, non-empty value) pair?
CREATE OR REPLACE FUNCTION public.iqid_external_ids_overlap(a jsonb, b jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_each_text(coalesce(a, '{}'::jsonb)) ka
    JOIN jsonb_each_text(coalesce(b, '{}'::jsonb)) kb
      ON ka.key = kb.key
    WHERE ka.value IS NOT NULL
      AND ka.value <> ''
      AND ka.value = kb.value
  );
$$;

-- Helper: list the (key, value) pairs that two external_ids share.
CREATE OR REPLACE FUNCTION public.iqid_external_ids_shared(a jsonb, b jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(
    jsonb_object_agg(ka.key, ka.value),
    '{}'::jsonb
  )
  FROM jsonb_each_text(coalesce(a, '{}'::jsonb)) ka
  JOIN jsonb_each_text(coalesce(b, '{}'::jsonb)) kb
    ON ka.key = kb.key
  WHERE ka.value IS NOT NULL
    AND ka.value <> ''
    AND ka.value = kb.value;
$$;

-- ── 1. property ──────────────────────────────────────────────────────────────
INSERT INTO public.registry_dedupe_review (
  entity_type, left_id, right_id, match_score, match_reason
)
SELECT
  'property'::public.iqid_entity_type,
  a.id, b.id,
  ROUND(extensions.similarity(a.normalized_name, b.normalized_name)::numeric, 3),
  jsonb_build_object(
    'name_left',       a.property_name,
    'name_right',      b.property_name,
    'norm_left',       a.normalized_name,
    'norm_right',      b.normalized_name,
    'city_left',       a.city,
    'city_right',      b.city,
    'state_left',      a.state_province,
    'state_right',     b.state_province,
    'address_left',    a.address_line1,
    'address_right',   b.address_line1,
    'university_left', a.university_name,
    'university_right',b.university_name,
    'city_match',      (a.city IS NOT NULL AND lower(a.city) = lower(b.city)),
    'state_match',     (a.state_province IS NOT NULL AND a.state_province = b.state_province),
    'external_ids_overlap', public.iqid_external_ids_overlap(a.external_ids, b.external_ids),
    'shared_external_ids',  public.iqid_external_ids_shared(a.external_ids, b.external_ids)
  )
FROM public.property_registry a
JOIN public.property_registry b
  ON a.id < b.id
 AND a.normalized_name IS NOT NULL
 AND b.normalized_name IS NOT NULL
 AND a.normalized_name % b.normalized_name
WHERE extensions.similarity(a.normalized_name, b.normalized_name) >= 0.75
ON CONFLICT (
  entity_type,
  LEAST(left_id::text, right_id::text),
  GREATEST(left_id::text, right_id::text)
) DO NOTHING;

-- ── 2. project ──────────────────────────────────────────────────────────────
INSERT INTO public.registry_dedupe_review (
  entity_type, left_id, right_id, match_score, match_reason
)
SELECT
  'project'::public.iqid_entity_type,
  a.id, b.id,
  ROUND(extensions.similarity(a.normalized_name, b.normalized_name)::numeric, 3),
  jsonb_build_object(
    'name_left',           a.project_name,
    'name_right',          b.project_name,
    'norm_left',           a.normalized_name,
    'norm_right',          b.normalized_name,
    'project_id_left',     a.project_id,
    'project_id_right',    b.project_id,
    'project_id_match',    (a.project_id IS NOT NULL AND b.project_id IS NOT NULL AND trim(a.project_id) = trim(b.project_id)),
    'project_id_conflict', (
      a.project_id IS NOT NULL AND b.project_id IS NOT NULL
      AND trim(a.project_id) <> '' AND trim(b.project_id) <> ''
      AND trim(a.project_id) <> trim(b.project_id)
    ),
    'merge_blocked', (
      a.project_id IS NOT NULL AND b.project_id IS NOT NULL
      AND trim(a.project_id) <> '' AND trim(b.project_id) <> ''
      AND trim(a.project_id) <> trim(b.project_id)
    ),
    'd365_op_code_left',   a.d365_opportunity_code,
    'd365_op_code_right',  b.d365_opportunity_code,
    'sheet_name_left',     a.sheet_name,
    'sheet_name_right',    b.sheet_name,
    'd365_op_code_match',  (a.d365_opportunity_code IS NOT NULL AND a.d365_opportunity_code = b.d365_opportunity_code),
    'external_ids_overlap',public.iqid_external_ids_overlap(a.external_ids, b.external_ids),
    'shared_external_ids', public.iqid_external_ids_shared(a.external_ids, b.external_ids)
  )
FROM public.project_registry a
JOIN public.project_registry b
  ON a.id < b.id
 AND a.normalized_name IS NOT NULL
 AND b.normalized_name IS NOT NULL
 AND a.normalized_name % b.normalized_name
WHERE extensions.similarity(a.normalized_name, b.normalized_name) >= 0.75
  -- Different non-null project_id = distinct deals, not merge candidates.
  AND NOT (
    a.project_id IS NOT NULL AND b.project_id IS NOT NULL
    AND trim(a.project_id) <> '' AND trim(b.project_id) <> ''
    AND trim(a.project_id) <> trim(b.project_id)
  )
ON CONFLICT (
  entity_type,
  LEAST(left_id::text, right_id::text),
  GREATEST(left_id::text, right_id::text)
) DO NOTHING;

-- ── 3. vendor ───────────────────────────────────────────────────────────────
INSERT INTO public.registry_dedupe_review (
  entity_type, left_id, right_id, match_score, match_reason
)
SELECT
  'vendor'::public.iqid_entity_type,
  a.id, b.id,
  ROUND(extensions.similarity(a.normalized_name, b.normalized_name)::numeric, 3),
  jsonb_build_object(
    'name_left',           coalesce(a.vendor_legal_name, a.vendor_name),
    'name_right',          coalesce(b.vendor_legal_name, b.vendor_name),
    'dba_left',            a.vendor_dba_name,
    'dba_right',           b.vendor_dba_name,
    'norm_left',           a.normalized_name,
    'norm_right',          b.normalized_name,
    'city_left',           a.city,
    'city_right',          b.city,
    'state_left',          a.state,
    'state_right',         b.state,
    'website_left',        a.website,
    'website_right',       b.website,
    'city_match',          (a.city IS NOT NULL AND lower(a.city) = lower(b.city)),
    'state_match',         (a.state IS NOT NULL AND a.state = b.state),
    'website_match',       (a.website IS NOT NULL AND a.website = b.website),
    'external_ids_overlap',public.iqid_external_ids_overlap(a.external_ids, b.external_ids),
    'shared_external_ids', public.iqid_external_ids_shared(a.external_ids, b.external_ids)
  )
FROM public.vendor_registry a
JOIN public.vendor_registry b
  ON a.id < b.id
 AND a.normalized_name IS NOT NULL
 AND b.normalized_name IS NOT NULL
 AND a.normalized_name % b.normalized_name
WHERE extensions.similarity(a.normalized_name, b.normalized_name) >= 0.75
ON CONFLICT (
  entity_type,
  LEAST(left_id::text, right_id::text),
  GREATEST(left_id::text, right_id::text)
) DO NOTHING;

-- ── 4. stakeholder ──────────────────────────────────────────────────────────
INSERT INTO public.registry_dedupe_review (
  entity_type, left_id, right_id, match_score, match_reason
)
SELECT
  'stakeholder'::public.iqid_entity_type,
  a.id, b.id,
  ROUND(extensions.similarity(a.normalized_name, b.normalized_name)::numeric, 3),
  jsonb_build_object(
    'name_left',           coalesce(a.legal_name, a.dba_name, a.stakeholder_name),
    'name_right',          coalesce(b.legal_name, b.dba_name, b.stakeholder_name),
    'norm_left',           a.normalized_name,
    'norm_right',          b.normalized_name,
    'website_left',        a.website,
    'website_right',       b.website,
    'hq_city_left',        a.hq_city,
    'hq_city_right',       b.hq_city,
    'hq_state_left',       a.hq_state,
    'hq_state_right',      b.hq_state,
    'city_match',          (a.hq_city IS NOT NULL AND lower(a.hq_city) = lower(b.hq_city)),
    'state_match',         (a.hq_state IS NOT NULL AND a.hq_state = b.hq_state),
    'website_match',       (a.website IS NOT NULL AND a.website = b.website),
    'external_ids_overlap',public.iqid_external_ids_overlap(a.external_ids, b.external_ids),
    'shared_external_ids', public.iqid_external_ids_shared(a.external_ids, b.external_ids)
  )
FROM public.stakeholder_registry a
JOIN public.stakeholder_registry b
  ON a.id < b.id
 AND a.normalized_name IS NOT NULL
 AND b.normalized_name IS NOT NULL
 AND a.normalized_name % b.normalized_name
WHERE extensions.similarity(a.normalized_name, b.normalized_name) >= 0.75
ON CONFLICT (
  entity_type,
  LEAST(left_id::text, right_id::text),
  GREATEST(left_id::text, right_id::text)
) DO NOTHING;

-- ── 5. contact ──────────────────────────────────────────────────────────────
INSERT INTO public.registry_dedupe_review (
  entity_type, left_id, right_id, match_score, match_reason
)
SELECT
  'contact'::public.iqid_entity_type,
  a.id, b.id,
  ROUND(extensions.similarity(a.normalized_name, b.normalized_name)::numeric, 3),
  jsonb_build_object(
    'name_left',           a.display_name,
    'name_right',          b.display_name,
    'norm_left',           a.normalized_name,
    'norm_right',          b.normalized_name,
    'email_left',          a.email,
    'email_right',         b.email,
    'linkedin_left',       a.linkedin_url,
    'linkedin_right',      b.linkedin_url,
    'email_match',         (a.email IS NOT NULL AND lower(a.email) = lower(b.email)),
    'linkedin_match',      (a.linkedin_url IS NOT NULL AND a.linkedin_url = b.linkedin_url),
    'external_ids_overlap',public.iqid_external_ids_overlap(a.external_ids, b.external_ids),
    'shared_external_ids', public.iqid_external_ids_shared(a.external_ids, b.external_ids)
  )
FROM public.contact_registry a
JOIN public.contact_registry b
  ON a.id < b.id
 AND a.normalized_name IS NOT NULL
 AND b.normalized_name IS NOT NULL
 AND a.normalized_name % b.normalized_name
WHERE extensions.similarity(a.normalized_name, b.normalized_name) >= 0.75
ON CONFLICT (
  entity_type,
  LEAST(left_id::text, right_id::text),
  GREATEST(left_id::text, right_id::text)
) DO NOTHING;

-- ── 6. facility ─────────────────────────────────────────────────────────────
INSERT INTO public.registry_dedupe_review (
  entity_type, left_id, right_id, match_score, match_reason
)
SELECT
  'facility'::public.iqid_entity_type,
  a.id, b.id,
  ROUND(extensions.similarity(a.normalized_name, b.normalized_name)::numeric, 3),
  jsonb_build_object(
    'name_left',           a.facility_name,
    'name_right',          b.facility_name,
    'norm_left',           a.normalized_name,
    'norm_right',          b.normalized_name,
    'facility_code_left',  a.facility_code,
    'facility_code_right', b.facility_code,
    'city_left',           a.city,
    'city_right',          b.city,
    'state_left',          a.state_province,
    'state_right',         b.state_province,
    'address_left',        a.address_line1,
    'address_right',       b.address_line1,
    'operator_left',       a.operator_name,
    'operator_right',      b.operator_name,
    'city_match',          (a.city IS NOT NULL AND lower(a.city) = lower(b.city)),
    'state_match',         (a.state_province IS NOT NULL AND a.state_province = b.state_province),
    'code_match',          (a.facility_code IS NOT NULL AND a.facility_code = b.facility_code)
  )
FROM public.facility_registry a
JOIN public.facility_registry b
  ON a.id < b.id
 AND a.normalized_name IS NOT NULL
 AND b.normalized_name IS NOT NULL
 AND a.normalized_name % b.normalized_name
WHERE extensions.similarity(a.normalized_name, b.normalized_name) >= 0.75
ON CONFLICT (
  entity_type,
  LEAST(left_id::text, right_id::text),
  GREATEST(left_id::text, right_id::text)
) DO NOTHING;

COMMIT;
