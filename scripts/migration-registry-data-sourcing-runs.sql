-- Registry-iQ: audit table for weekly data sourcing checklist runs.
-- Apply to project xhafhdaugmgdxckhdfov (Registry-iQ).

CREATE TABLE IF NOT EXISTS public.registry_data_sourcing_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('cron', 'manual', 'cli')),
  triggered_by text,
  schedule_years integer[] NOT NULL DEFAULT '{2025,2026,2027}',
  family_count integer NOT NULL DEFAULT 0,
  project_count integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '[]'::jsonb,
  legend jsonb NOT NULL DEFAULT '[]'::jsonb,
  families jsonb NOT NULL DEFAULT '[]'::jsonb,
  markdown text NOT NULL DEFAULT '',
  duration_ms integer,
  ok boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registry_data_sourcing_runs_run_at
  ON public.registry_data_sourcing_runs (run_at DESC);

CREATE INDEX IF NOT EXISTS idx_registry_data_sourcing_runs_ok_run_at
  ON public.registry_data_sourcing_runs (ok, run_at DESC);

COMMENT ON TABLE public.registry_data_sourcing_runs IS
  'Audit history for Property Registry data sourcing checklist (live citation report). Rows are append-only.';
