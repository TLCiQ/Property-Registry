-- Registry-iQ: per-unit Matrix facts (actuals only; no inferred attributes)
ALTER TABLE property_units
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN property_units.metadata IS
  'Per-unit facts from source systems (e.g. Morgan Hill Matrix: kitchen_cab, top_opp, elevations, soffit).';

CREATE INDEX IF NOT EXISTS idx_property_units_metadata_gin
  ON property_units USING gin (metadata);
