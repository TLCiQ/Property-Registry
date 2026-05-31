-- ============================================================================
-- Registry-iQ — allow project_status = 'inactive' for merge soft-delete
-- Target: Registry-iQ Supabase (xhafhdaugmgdxckhdfov)
--
-- iqid_apply_merge sets merged loser projects to project_status = 'inactive'
-- (mirroring property_registry). The soft-delete-row migration added 'deleted'
-- for junk rows but never added 'inactive' to project_registry.
-- ============================================================================

ALTER TABLE public.project_registry
  DROP CONSTRAINT IF EXISTS project_registry_project_status_check,
  ADD  CONSTRAINT project_registry_project_status_check
       CHECK (project_status = ANY (ARRAY[
         'prospect'::text,
         'planning'::text,
         'active'::text,
         'on_hold'::text,
         'completed'::text,
         'cancelled'::text,
         'inactive'::text,
         'deleted'::text
       ]));
