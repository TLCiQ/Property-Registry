# TLC iQ Platform — Property Registry Master Backlog

**Last reviewed:** Jul 6, 2026

## Priority Legend
- **NOW** — User wants this done in the current or next session
- **NEXT** — High priority, tackle when current NOW items are clear
- **LATER** — Deferred; revisit when user indicates
- **BLOCKED** — Waiting on external input, access, or a dependency
- **DONE** — Completed (keep for 2 weeks as audit trail, then archive)
- **WONT** — User explicitly declined this item

## Items
| ID | Status | Category | Description | Added | Updated |
|----|--------|----------|-------------|-------|---------|
| CSMX-01 | DONE | pipeline | Full BSI detail batch for 8 CSMX Box jobs (`batch-ingest-csmx-full.mjs`): contract + matrix structure + floors + shop drawings + website. Scripts: `ingest-bsi-csmx-full.mjs`, `ingest-bsi-floors.mjs`, `ingest-bsi-shop-drawings.mjs`, `lib/bsi-csmx-auto-config.mjs`. Report: `.firecrawl/csmx-full-detail-batch-report.json`. Gaps: SKUs still require Counts Workbook (per-property); `25332` amenity matrix has no types; `25331` matrix has duplicate unit# rows (50 unique units). | Jul 7 | Jul 7 |
| MH-02 | DONE | data-gap | Morgan Hill: `beds_per_unit` aligned to `bedrooms_structural` when no specialty fields (26 B-types fixed). Total beds = 479. Beds column UI only for divider/shared/pod/murphy/super-murphy. | Jun 19 | Jun 19 |
| MH-03 | DONE | assets | Unit-type finish layouts from `UNIT PLANS_5.2025.pdf` — 86/86 types mapped + Cloudinary; sheet thumbnail per page (multi-unit sheets). | Jun 19 | Jun 20 |
| MH-14 | DONE | data-gap | Morgan Hill full populate (`ingest-morganhill-complete.mjs`): 390 unit metadata, 86/86 sqft, 34 shop drawings, kitchen_variants, property net sqft 342,682 sf. | Jul 4 | Jul 4 |
| MH-09 | DONE | enrichment | `total_sqft` backfilled from UNIT PLANS (net per type; property rollup in `external_ids.morgan_hill_net_sqft_total`). | Jun 19 | Jul 4 |
| MH-04 | DONE | assets | MW04.5/MW05/MW06 MTO PDFs ingested (Jun 2026 Box root). MW01.5/01.6 resolve to MW01 shop drawing link. | Jun 19 | Jul 4 |
| MH-05 | DONE | ontology | Matrix kitchen/vanity → `property_unit_types.room_drawings` + Kitchen/Bath 1/Bath 2 columns on Unit Type Matrix. | Jun 19 | Jun 20 |
| MH-06 | LATER | ontology | Finish→Furnish taxonomy split (`property_furnish_unit_types` + finish→furnish FK) + the mapping (no furnish column in Matrix). | Jun 19 | Jun 19 |
| MH-07 | LATER | ontology | Materialize rooms as LOCATION rows (kitchen/living/bath_x/bed_x…) per the broader ontology vision. | Jun 19 | Jun 19 |
| MH-15 | DONE | data-gap | Vanity SKUs bridged from Counts Workbook MW tabs → 708 rows (`morgan_hill_counts_workbook_vanity`, BATH1/BATH2 room labels). Chain-iQ 134/134 containers linked; project_registry IFC doc index + chain_iq external_ids. | Jul 4 | Jul 4 |
| MH-08 | DONE | rollups | Documented Matrix Area gap: B2/B3 (66 units) have no Area codes in source; B1 only. `external_ids.morgan_hill_construction_area`. Unit `metadata.rooms` materialized. | Jul 4 | Jul 4 |
| UI-01 | LATER | ui | Optionally relocate the 3 transient RITA run-status banners (no-results, staged-run, findings review) to the bottom too (currently kept near the RITA action button by design). | Jun 19 | Jun 19 |
| MH-10 | DONE | campaign | Morgan Hill `MH-REGISTRY-ENRICH-001`: deployed + reseeded (7 items, simplified if/then survey). | Jun 20 | Jun 21 |
| MH-12 | DONE | data-gap | Morgan Hill SKU bridge redo: **actuals only** — 149 room-layout variants (type×THUS/OPP×kitchen_cab), 6,833 rows / 184 SKUs, 390/390 Matrix units; `metadata.actual_unit_count`; dale-chat extended_qty fix. No majority vote. | Jun 22 | Jun 22 |
| MH-13 | DONE | campaign | Admin **Campaign monitor** on property page + SYNC-iQ `/sync/registry-enrich`: sent/opened/submitted/files, active link copy, event log. APIs: property status route + Registry-iQ read in Enrich-iQ. | Jun 20 | Jun 20 |
| MH-11 | DONE | campaign | Full Matrix unit-facts ingest → `property_units.metadata` (390/390). Image annotation on enrich review still NEXT separately. | Jun 20 | Jul 4 |
| CS-01 | DONE | ingest | Core Spaces Prismic ingest: 89 communities → Registry-iQ (`ingest-corespaces-prismic.mjs`). | May 20 | May 20 |
| CS-02 | DONE | enrichment | Sold Core Spaces portfolio (10): press-release research → current owner + PM stakeholders. 9/10 assigned; Minneapolis unresolved. | May 20 | Jun 27 |
| CS-03 | DONE | dedupe | Merge legacy Bloomington Hub rows (`HUB Bloomington`, `Hub Bloomington Lincoln (II)`) into canonical Prismic records. | May 20 | Jun 27 |
| CS-04 | DONE | assets | Cloudinary backfill for Core Spaces Prismic hero/gallery images (91 heroes). | May 20 | Jun 27 |
| CS-05 | DONE | pipeline | Align coming-soon Prismic communities to project_registry deals (14 linked; 7 no open deal). | May 20 | Jun 27 |
| CS-06 | NEXT | enrichment | Hub Minneapolis sold-portfolio: identify current owner/PM (press research inconclusive). | Jun 27 | Jun 27 |
| CS-07 | LATER | pipeline | Coming-soon with no pipeline deal: William, Ann Arbor State, Madison Bassett, Oxenfree Liberty Hill/Parklin/Stonebriar/Rowlett — create deals or wait for CRM. | Jun 27 | Jun 27 |
| CS-08 | DONE | assets | Core Spaces Prismic gallery Cloudinary backfill re-run (`backfill-images-to-cloudinary.mjs --apply --source=corespaces_prismic --gallery`); Jun 28 batch in progress/completed. | Jun 27 | Jun 28 |
| CS-09 | DONE | enrichment | Core Spaces GC/architect/designer: curated research + Layout-iQ + brand defaults → `property_registry` + `stakeholder_registry` + `property_stakeholders`; removed 31 bogus Core Spaces GC links; Firecrawl web profiles for 19 firms. Script: `enrich-corespaces-project-team.mjs`. Report: `.firecrawl/cs-project-team-report.json`. Coverage: architect 85/89, designer 55/89, GC 36/89. | Jun 27 | Jun 27 |
| CS-10 | NEXT | enrichment | Per-property GC research for remaining 53 Hub/Collective/Rive communities without verified GC (many pre-sold or coming-soon). | Jun 27 | Jun 27 |
| PT-01 | DONE | enrichment | Portfolio operators (908, Lincoln Ventures, Subtext, Yugo, Parallel, ACC, Greystar): GC/architect/designer for **280** matched properties; removed **171** developer-as-GC links; **154** property field updates; **40** stakeholder web profiles. Script: `enrich-portfolio-project-team.mjs` (paginated full registry fetch). Report: `.firecrawl/portfolio-project-team-report.json`. | Jun 27 | Jun 27 |
| PT-02 | NEXT | enrichment | Per-property GC for ACC/Greystar acquisition assets + Yugo/GSA per-asset construction teams; tighten ACC operator filter if `\bacc\b` false positives appear. | Jun 27 | Jun 27 |
| IMG-01 | NEXT | assets | Website image ingest: **132/304** website-ingested, **135** Cloudinary heroes, **3,554** gallery imgs, **72** w/ floor plans, **47** w/ unit photos; **213** still need work (missing URLs or unit/floorplan roles). Re-run: `enrich-property-website-images.mjs --apply --limit=50`. | Jun 28 | Jun 28 |
| UI-02 | DONE | ui | Expandable image lightbox (`ImageLightbox` + `ExpandableImage`) wired into registry galleries, list heroes, enrich review, team headshots, My Lists. Deploy dale-chat for prod. | Jul 4 | Jul 4 |
| UI-03 | LATER | ui | Extend `ExpandableImage` to SKU registry grid, stakeholder list logos, cascade org chart avatars (skipped in UI-02 pass). | Jul 4 | Jul 4 |
| TB-01 | DONE | enrichment | Troubadour Lubbock **25198 Main Order**: property address/branding, 276 units + 23 types from Matrix, project_registry 25198 + parent 25019 docs, 49 MW shop drawings, Chain-iQ 13/13 containers. Script: `ingest-troubadour-25198-complete.mjs`. | Jul 4 | Jul 4 |
| TB-02 | DONE | enrichment | Troubadour phase 2: Counts Workbook SKU bridge (640 rows), project **25199** Overage + 10 Chain-iQ containers, Teinert GC dedupe 7→1. | Jul 4 | Jul 4 |
| TB-03 | DONE | enrichment | Troubadour phase 3: vanity SKU bridge (237 rows), DALE `millwork_mw_package_sku` mirror (592 rows), NetSuite portfolio on 25019 (job 9271); 25198/25199 clarified as factory POs (no NS job). | Jul 4 | Jul 4 |
| TB-04 | DONE | assets | Troubadour website images: livetroubadour.com + Parallel dev page → Cloudinary; 24 images (hero, amenities, floor plans, exterior renders, unit Enscape). Script: `ingest-troubadour-website-images.mjs`. | Jul 4 | Jul 4 |
| BSI-01 | DONE | pipeline | BSI-CSMX property enrich path formalized: orchestrator + config + website-last Firecrawl step. Docs: `docs/BSI_CSMX_PROPERTY_ENRICH.md`. Scripts: `ingest-bsi-csmx-property.mjs`, `enrich-bsi-csmx-website.mjs`, `config/troubadour-lubbock-bsi-csmx.json`. | Jul 5 | Jul 5 |
| BSI-02 | NEXT | pipeline | Generalize Troubadour hardcoded ingest scripts to read from BSI-CSMX config (property_id, Box paths, matrix sheet) so new millwork jobs need config-only wiring. | Jul 5 | Jul 5 |
| BSI-03 | DONE | data-gap | Box BSI job ↔ property 1:1 audit + repair: 48/48 Box folders linked; fixed 25321, 25015, 25315; deactivated bogus Findorff property row. Scripts: `audit-bsi-csmx-project-property.mjs`, `repair-bsi-csmx-project-property.mjs`. Doc: `docs/BSI_CSMX_PROPERTY_ENRICH.md` expanded. | Jul 5 | Jul 5 |
| BSI-04 | DONE | data-gap | Zero-milestone 14-job remediation: parser + Box discovery fixes → **47/48** jobs with ≥1 milestone (was 34). Only `25024` Verve TLO still empty (no contract PDFs in Box). Audit: `audit-bsi-zero-milestone-sources.mjs`. | Jul 5 | Jul 5 |
| BSI-05 | BLOCKED | data-gap | `25024` Verve TLO — Box project folder has zero subcontract/schedule files; milestones blocked until PM uploads Contract Received or SCHEDULE_MTO. | Jul 5 | Jul 5 |

## Done (recent)
| ID | Status | Category | Description | Added | Updated |
|----|--------|----------|-------------|-------|---------|
| MH-D1 | DONE | assets | Ingest 23 shop drawings + 11 floor plans to Cloudinary + registry (no surrogates; gaps recorded). | Jun 19 | Jun 19 |
| MH-D2 | DONE | ui | "Unit Type Matrix" redesign (labels, Total Baths, clickable detail modal, dropped legacy Layout column). | Jun 19 | Jun 19 |
| MH-D3 | DONE | ui | New "Shop Drawings" tab (thumbnail grid, type/state filters, editable state, preview+download). | Jun 19 | Jun 19 |
| MH-D4 | DONE | ui | Floor-plan thumbnails on Floors + Buildings tabs (preview modal + Download PDF). | Jun 19 | Jun 19 |
| MH-D5 | DONE | fix | Decouple FF&E SKU estimate from floor rollups (relabel + fix help text). | Jun 19 | Jun 19 |
| MH-D6 | DONE | fix | Opening-year timezone fix (header shows 2027) + DB `opening_year` realigned 2026→2027. | Jun 19 | Jun 19 |
| MH-D7 | DONE | ui | Move persistent RITA surfaces (Proposals + Reads) to bottom of property page. | Jun 19 | Jun 19 |
