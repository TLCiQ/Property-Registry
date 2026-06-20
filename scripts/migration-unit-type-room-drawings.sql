-- Unit Type Matrix: per-type finish layout + kitchen/vanity drawing links.
ALTER TABLE property_unit_types
  ADD COLUMN IF NOT EXISTS room_drawings jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN property_unit_types.room_drawings IS
  'Finish shop-drawing links per room role: { kitchen: {drawing_no, source_ref, thumbnail_url, pdf_url}, bath_1: {drawing_no, detail, label, ...}, bath_2?: ... }. Empty object when unmapped; no surrogates.';
