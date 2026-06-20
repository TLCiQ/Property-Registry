-- Reconcile Morgan Hill (a30d446c-ee4a-4fe0-a76e-e4f9bed0e3b0) building/floor structure.
--
-- Background: a prior ingestion mis-parsed Matrix NEW MASTER "Level/Building" tokens,
-- creating 11 "buildings" that are really the 11 FLOORS of 3 buildings.
-- Unit numbers encode the truth: D1 = building (1/2/3), D2 = level. Verified for all 390 units.
--   Building 1: levels 1-5 (324 units); Building 2: levels 1-3 (30); Building 3: levels 1-3 (36).
--
-- Idempotent-ish: removes existing buildings (units.building_id/floor_id FK ON DELETE SET NULL),
-- recreates 3 canonical buildings + 11 floors, and re-places all units by unit-number decode.

DO $$
DECLARE
  pid uuid := 'a30d446c-ee4a-4fe0-a76e-e4f9bed0e3b0';
BEGIN
  -- 1) Clear mis-parsed buildings (units' FK columns null out automatically)
  DELETE FROM property_buildings WHERE property_id = pid;

  -- 2) 3 canonical buildings
  INSERT INTO property_buildings
    (property_id, building_number, building_name, total_floors, lowest_residential_floor, highest_residential_floor, notes)
  VALUES
    (pid, 1, 'Building 1', 5, 1, 5, 'Canonical. Reconciled from unit-number decode (D1=building, D2=level) 2026-06-19; replaces mis-parsed Level/Building rows.'),
    (pid, 2, 'Building 2', 3, 1, 3, 'Canonical. Reconciled from unit-number decode 2026-06-19.'),
    (pid, 3, 'Building 3', 3, 1, 3, 'Canonical. Reconciled from unit-number decode 2026-06-19.');

  -- 3) Floors per building (B1: 1-5, B2/B3: 1-3)
  INSERT INTO property_floors (building_id, floor_number, floor_label, floor_type)
  SELECT b.id, gs.n, 'Level ' || gs.n, 'residential'
  FROM property_buildings b
  CROSS JOIN LATERAL generate_series(1, b.total_floors) AS gs(n)
  WHERE b.property_id = pid;

  -- 4) Place every unit by decoding unit_number
  UPDATE property_units u
  SET building_id = b.id, floor_id = f.id
  FROM property_buildings b
  JOIN property_floors f ON f.building_id = b.id
  WHERE u.property_id = pid
    AND b.property_id = pid
    AND b.building_number = substr(u.unit_number, 1, 1)::int
    AND f.floor_number   = substr(u.unit_number, 2, 1)::int;
END $$;
