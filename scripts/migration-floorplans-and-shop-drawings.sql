-- Registry-iQ: image/asset layer for floor plans + a light shop-drawing entity.
-- Additive only. No changes to existing building/floor/unit data.

-- 1) Floor-plan image per floor
ALTER TABLE property_floors
  ADD COLUMN IF NOT EXISTS floor_plan_url text,
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN property_floors.floor_plan_url IS 'Cloudinary delivery URL of the floor plan PDF (thumbnail derived via pg_1,f_png).';
COMMENT ON COLUMN property_floors.images IS 'Additional floor images: [{role,url,png_url,label,source_path}].';

-- 2) Light shop-drawing entity (drawing # + type + version + state + asset)
CREATE TABLE IF NOT EXISTS property_shop_drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES property_registry(id) ON DELETE CASCADE,
  drawing_no text NOT NULL,
  title text,
  drawing_type text CHECK (drawing_type IN (
    'kitchen_cabs','kitchen_tops','vanity','vanity_tops',
    'shower_panels_accy','shower_doors','mirror_units',
    'fixed_furniture','loose_furniture'
  )),
  version text,
  state text NOT NULL DEFAULT 'not_started' CHECK (state IN (
    'not_started','in_process','sent_for_review','revising','approved'
  )),
  thumbnail_url text,
  pdf_url text,
  page_count integer,
  unit_type_code text,
  source_path text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_shop_drawings_uniq UNIQUE (property_id, drawing_no, version)
);

CREATE INDEX IF NOT EXISTS idx_shop_drawings_property ON property_shop_drawings (property_id);
CREATE INDEX IF NOT EXISTS idx_shop_drawings_type ON property_shop_drawings (drawing_type);
CREATE INDEX IF NOT EXISTS idx_shop_drawings_unit_type_code ON property_shop_drawings (unit_type_code);

COMMENT ON TABLE property_shop_drawings IS 'Shop drawings (kitchen/vanity/countertop/furniture) with Cloudinary assets; linked to unit types via unit_type_code. Richer building/floor/unit/room cross-links deferred.';

CREATE OR REPLACE FUNCTION property_shop_drawings_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_shop_drawings_updated ON property_shop_drawings;
CREATE TRIGGER trg_shop_drawings_updated
  BEFORE UPDATE ON property_shop_drawings
  FOR EACH ROW EXECUTE FUNCTION property_shop_drawings_set_updated_at();
