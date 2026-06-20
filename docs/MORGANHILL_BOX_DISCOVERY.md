# Morgan Hill (25048) — Box Discovery Inventory

Property: Morgan Hill Apartments (`a30d446c-ee4a-4fe0-a76e-e4f9bed0e3b0`), Carrollton TX.
Box root: `Box-Box/Team Folder/Projects/25048 - Carrollton, TX - Morgan Hill/`
Discovery date: 2026-06-19.

## Assets found (what we can apply)

### Floor plans
- `PROJECT MANAGING/SHOP DRAWINGS/DRAWING SET/1-A210..1-A253` — Building 1, Levels 1-5, overall + per-area (A/B/C/D) plans.
- `.../DRAWING SET/SCHEME/` — combined unit/corridor finish plans: `Building 1 Level 1-5`, `Building 2 Level 1-3`, `Building 3 Level 1-3` (3 PDFs).
- `.../DRAWING SET/Drawings & Specs/02. IFC/` + `01. CD Permit/` + `00. Stamped Permit Set 06.23.25/` — full architectural sets (all buildings).
- `.../DRAWING SET/0-A020` (Bldg 1 address plan), `0-A021` (Bldgs 2 & 3 address plan).

### Site plan / exterior
- Site plan: `.../DRAWING SET/Drawings & Specs/0-A002_SITE PLAN_TURN SEQ..pdf`.
- Renderings: `.../DRAWING SET/Drawings & Specs/Renderings/` (plus website renderings already loaded as property hero).

### Unit-type finish layouts
- `.../DRAWING SET/UNIT PLANS_5.2025.pdf` — per-unit-type plans.
- Interior elevations: `A701` (typical unit), `A702` (ANSI Type A), `A703`-`A706` (interior elevations) — referenced by the Matrix kitchen/vanity codes (e.g. `13/A705`).

### Shop drawings
- Cabinets (per config): `.../SHOP DRAWINGS/Cabinets/KM PDFs/MW01.pdf, MW01a, MW01b, MW02..., MW07.5...` (multi-sheet per config).
- Consolidated: `.../Cabinets/Carrolton, TX - Morgan Hill - DRAWING SET - 4.06.26_FOR INSTALL.pdf`.
- Countertops: `.../SHOP DRAWINGS/Countertops/`.
- Cut sheets (appliances): `.../SHOP DRAWINGS/Cut Sheets/` (LG specs).

### Matrix (parseable data)
`.../SHOP DRAWINGS/Morgan Hill Matrix NEW.xlsx`, sheet `MASTER` (390 data rows):
- Columns: `Unit #`, `Level/Building`, `Area`, `New TRUCK`, `NEW PHASE`, `Unit Type` (finish), `Thus/Opp`, `Kitchen Cab`, `Scheme`, `Soffit`, `Notes`, `Kitchen Run Elev.`, `Kitchen Run Elev. 2nd`, `Kitchen Island Elev.`, `Desk Elev.`, `Vanity 1 Elev.`, `Vanity 2 Elev.`.
- 390 distinct Unit #s, 86 distinct finish Unit Types, 19 Kitchen Cab configs.

## Data derivable from the Matrix (matches registry exactly: 390 units, 86 unit types)

### Building + floor placement (RESOLVES the prior "0 floors / 0 placement" gap)
`Level/Building` token decodes to building + level:
- Building 1: Levels 1-5 -> 324 units (35/79/86/86/38 by level)
- Building 2: Levels 1-3 (`x-2B`) -> 30 units (10/10/10)
- Building 3: Levels 1-3 (`x-3B`) -> 36 units (12/12/12)
- Total 390.

### Bathrooms per unit (derivable from vanity columns)
- 1 vanity/bath: 301 units; 2 vanities/baths: 89 units.

### Unit type -> finish drawing references (consistent within a type)
- Kitchen Cab config (MWxx_SCHy), Kitchen Run/Island/Desk elevations, Vanity 1/2 elevations.

## Key discrepancy
- Registry `property_buildings` has 11 rows for Morgan Hill; the drawings + Matrix show 3 buildings (B1 L1-5, B2 L1-3, B3 L1-3). NEEDS RECONCILIATION.

## Parser rules (reusable — build into the discovery path / RITA)

These rules let a future parser reconstruct building/floor/unit structure WITHOUT manual mapping.

### Unit-number decode (authoritative for placement)
Morgan Hill unit numbers are 5-digit `D1 D2 D3D4D5`:
- `D1` = building number (1, 2, or 3).
- `D2` = level/floor within that building.
- `D3D4D5` = unit sequence on the floor.
- Verified across all 390 units. Building 1 has levels 1-5; Buildings 2 and 3 have levels 1-3.

### Matrix `Level/Building` token decode (cross-check)
The Matrix MASTER `Level/Building` column uses two token shapes:
- Bare `1`..`5` => Building 1, that level.
- `{level}-{n}B` (e.g. `1-2B`, `3-3B`) => Building `n`, that `{level}`. The `B` suffix denotes the building id.
- DO NOT treat each distinct token as a separate building (that bug created 11 phantom "buildings").

### Construction-sequence dimensions (for PM custom rollups; cross floors)
From Matrix MASTER, per unit:
- `Area` (col 2): A1, A2, A2.2, A3, B, C1.1, C1.2, C2, D, E (66 rows blank => gap).
- `New TRUCK` (col 3): shipment grouping 1-21.
- `NEW PHASE` (col 4): install sequence 1-46.
Stored on `property_units.construction_area / truck_no / phase_no`.

### Bathrooms decode
Bath count per unit = number of populated Vanity columns (`Vanity 1 Elev.`, `Vanity 2 Elev.`). Per unit type, take the max across its units (and FLAG types with mixed counts).

### Finish drawing references (per unit type)
`Kitchen Cab` (MWxx_SCHy), `Kitchen Run Elev.`, `Kitchen Run Elev. 2nd`, `Kitchen Island Elev.`, `Desk Elev.`, `Vanity 1/2 Elev.` (format `detail#/sheet` e.g. `13/A705`).

### RITA / enrichment note
Bring RITA up to speed with: (1) the unit-number decode, (2) the Level/Building token decode, (3) Area/Truck/Phase as construction-zone rollup dimensions, (4) bathrooms-from-vanity, (5) the gaps below (finish->furnish, beds_per_unit). These should inform future property structure ingestion + enrichment proposals.

## Reconciliation applied (2026-06-19)
- Collapsed 11 mis-parsed "buildings" -> 3 canonical buildings + 11 floors (B1 L1-5, B2/B3 L1-3).
- Placed all 390 units on building+floor via unit-number decode (0 unplaced).
- Tagged units with Area (324; 66 blank=gap) / Truck (21) / Phase (46).
- Set `property_unit_types.bathrooms` for all 86 types (59 one-bath, 27 two-bath; sum 113). FLAG: `B4.1B` had mixed vanity counts (1 and 2) -> used 2.
- Migrations: `scripts/migration-floorplans-and-shop-drawings.sql`, `scripts/migration-reconcile-morganhill-buildings.sql`, `property_units_sequencing` (applied via MCP). Enrichment script: `scripts/ingest-morganhill-structure.mjs` (consumes `.firecrawl/mh-structure.json`).

## Asset ingestion applied (2026-06-19) — `scripts/ingest-morganhill-assets.mjs`
- **23 shop drawings** → `property_shop_drawings` + Cloudinary. 17 cabinet configs (`MW01..MW18` with a `KM PDFs/MWxx.pdf`) as `kitchen_cabs`; 6 interior-elevation sheets `A701–A706` (A705/A706→`vanity`, rest→`kitchen_cabs`). `version='2026-04-06'`, `state='not_started'` (unverified), `unit_type_code` null (M:N deferred).
- **11/11 floor plans** → `property_floors.floor_plan_url` + `images`. B1 L1–5 = per-level `1-A2x0 OVERALL PLAN` PDFs; B2/B3 = combined SCHEME building PDF on each floor (`combined:true`). Thumbnails verified HTTP 200.
- Cloudinary paths: `property-registry/<id>/shop-drawings/<drawing_no>`, `.../floor-plans/b<n>_l<n>`. Gap report: `.firecrawl/mh-asset-gaps.json`.

## Gaps (no source found — for the gaps discussion / enrichment, NO surrogates)
- **Cabinet configs `MW04.5`, `MW05`, `MW06`**: referenced by the Matrix but no `KM PDFs/` file → no shop drawing (empty).
- **Unit-type finish layouts**: `UNIT PLANS_5.2025.pdf` has no per-type page map → `layout_asset_urls` empty for all 86 types. Matrix Layout column shows the empty placeholder.
- **Bedrooms backfilled (2026-06-19, user-confirmed):** `A*` prefix → `standard_bedrooms=1`; `B*` → `2`. `bedrooms_structural` GENERATED. Structural bed sum across units = 479. **`total_sqft` still NULL** (gap).
- `beds_per_unit`: uniformly `1` (a default, not verified). Total Beds therefore mirrors unit count (390). Needs confirmation.
- FINISH -> FURNISH mapping: no furnish-type column in the Matrix; furnish taxonomy unresolved.
- Per-floor unit-type splits beyond the Level/Building token (Area codes exist but need a key).
- Countertop / appliance drawings not yet tied to specific unit types.
- Shop-drawing cross-link rollups (building/floor/unit/room counts) + M:N link tables deferred.
