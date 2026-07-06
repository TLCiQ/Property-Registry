# Data Sourcing Checklist — Property-Project Families (2025–2027)

**Generated:** 2026-07-06T17:33:19.515Z
**Registry-iQ project:** `xhafhdaugmgdxckhdfov`
**Scope:** Schedule years 2025, 2026, 2027 · Tier-1 BUs (UF, Web, CSL, BSI, CSMX, TLCH) + division aliases

> This checklist is generated from **live Registry-iQ rows** — not PROJECT_CONTEXT summaries.  
> Re-run: `node scripts/generate-data-sourcing-checklist.mjs`  

---

## 1. Source system legend (citation codes)

| Code | System of record | Provides | Ingest script | Doc |
|------|------------------|----------|---------------|-----|
| **DALE-IS** | DALE-Demand `install_schedules` | Project identity, D365 fields, install dates, warehouse/contacts, schedule_year | `scripts/sync-install-schedules-to-registry.mjs` | [docs/INSTALL_SCHEDULES_REGISTRY_LINK.md](docs/INSTALL_SCHEDULES_REGISTRY_LINK.md) |
| **TLCIQ-PROD** | TLCiQ-Production Supabase (`deals`, `unit_types`, `requirements`) | Unit types, units, floors, FF&E SKUs (`property_unit_type_skus.source=tlciq_production`) | `scripts/sync-production-to-registry.mjs` | [docs/PRODUCTION_REGISTRY_UNIT_PIPELINE.md](docs/PRODUCTION_REGISTRY_UNIT_PIPELINE.md) |
| **SAGE-PACE** | DALE-Demand `sage_orders` (Sage 300 pacing xlsx ETL) | Order/deal crosswalk, ship-to, division, property_key hints | `scripts/sync-sage-shipto-project-property.mjs` | [docs/SAGE_SHIPTO_PROJECT_PROPERTY_LINK.md](docs/SAGE_SHIPTO_PROJECT_PROPERTY_LINK.md) |
| **NETSUITE** | NetSuite jobs portfolio (DALE-Demand / Vantage) | Job revenue, developer, builder, subsidiary (`external_ids.netsuite_*`) | `scripts/ingest-troubadour-phase3.mjs (property-specific); NS backfill jobs` | [docs/BSI_CSMX_PROPERTY_ENRICH.md](docs/BSI_CSMX_PROPERTY_ENRICH.md) |
| **BOX-BSI** | Box Projects folder (`25xxx-…`) via Box-iQ CCG API | Subcontract PDFs, SCHEDULE_MTO, matrix xlsx, shop drawings, floor plans | `scripts/ingest-bsi-contract.mjs, ingest-bsi-matrix-structure.mjs, ingest-bsi-csmx-property.mjs` | [docs/BSI_CSMX_PROPERTY_ENRICH.md](docs/BSI_CSMX_PROPERTY_ENRICH.md) |
| **AIRTABLE-ARCH** | Airtable archaeology (`BSI_ProjectSetup`, legacy deals) | Legacy property fields, BSI customer/developer IDs | `scripts/ingest-property-archaeology.mjs` | [docs/ACCESS_2013_INGEST.md](docs/ACCESS_2013_INGEST.md) |
| **ACCESS-2013** | Access 2013 SQLite export | Historical units/types/SKUs (`legacy_access_*` columns) | `scripts/ingest-access-2013-sqlite.mjs` | [docs/ACCESS_2013_INGEST.md](docs/ACCESS_2013_INGEST.md) |
| **CORESPACES** | Core Spaces Prismic CMS | Community identity, hero/gallery, brand (`source=corespaces_prismic`) | `scripts/ingest-corespaces-prismic.mjs` | [PROJECT_CONTEXT_Property_Registry.md](PROJECT_CONTEXT_Property_Registry.md) |
| **CHAIN-IQ** | Chain-iQ Supabase `container_loads` | Container logistics ↔ project_registry link | `scripts/ingest-morganhill-project-links.mjs, ingest-troubadour-25198-complete.mjs` | [docs/BSI_CSMX_PROPERTY_ENRICH.md](docs/BSI_CSMX_PROPERTY_ENRICH.md) |
| **FIRECRAWL** | Firecrawl website scrape + Cloudinary | Leasing site images, address resolve, brand gap-fill (`enrichment_sources`) | `scripts/enrich-bsi-csmx-website.mjs, site-address scripts` | [docs/SITE_ADDRESS_WEB_RESOLVE.md](docs/SITE_ADDRESS_WEB_RESOLVE.md) |
| **PIPELINE** | DALE-Demand pipeline / opportunities | Property stubs from CRM pipeline (`source=pipeline_opportunities`) | `seed / sync pipeline scripts` | [docs/PRODUCTION_REGISTRY_UNIT_PIPELINE.md](docs/PRODUCTION_REGISTRY_UNIT_PIPELINE.md) |
| **LAYOUT-IQ** | Layout-iQ site registry | Site IDs, layout crosswalk (`external_ids.layout_iq_site_id`) | `Layout-iQ ingest (external)` | — |

---

## 2. Coverage summary (BU × schedule year)

| BU | Year | Families | Projects | w/ Property | w/ Milestones | w/ Unit Types | w/ SKUs | w/ Box Contract |
|----|------|----------|----------|-------------|---------------|---------------|---------|-----------------|
| BSI | 2025 | 26 | 26 | 26 | 26 | 22 | 4 | 26 |
| CSMX | 2025 | 4 | 4 | 4 | 4 | 3 | 0 | 4 |
| TLCH | 2025 | 107 | 120 | 102 | 0 | 6 | 0 | 0 |
| UF | 2025 | 192 | 229 | 179 | 0 | 130 | 109 | 0 |
| BSI | 2026 | 11 | 11 | 11 | 8 | 6 | 1 | 8 |
| CSL | 2026 | 2 | 3 | 2 | 0 | 2 | 0 | 0 |
| CSMX | 2026 | 3 | 3 | 3 | 3 | 3 | 0 | 3 |
| TLCH | 2026 | 39 | 50 | 39 | 0 | 2 | 0 | 0 |
| UF | 2026 | 72 | 74 | 66 | 2 | 26 | 11 | 0 |
| BSI | 2027 | 1 | 1 | 1 | 1 | 1 | 0 | 1 |
| CSL | 2027 | 1 | 2 | 1 | 0 | 1 | 0 | 0 |
| TLCH | 2027 | 1 | 1 | 1 | 0 | 0 | 0 | 0 |
| UF | 2027 | 4 | 4 | 3 | 0 | 0 | 0 | 0 |

---

## 3. Property-project families — per-family citation tables

Families are grouped by **`property_id` + `schedule_year` + primary BU**.  
Orphan projects (no `property_id`) appear as separate rows.

### BSI · 2025

#### 12 Mile

- **Property ID:** `4a4f42c8-adc7-45f5-a5cb-ce1f8d506e97`
- **Projects (1):** `25014`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25014 | **BOX-BSI** | Box: 25014-St. Augustine, FL - Madison 12 Mile |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 2 contract PDF(s): Contract Received 042425.pdf; Subcontract Agreement Updated 02.26.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 8840 |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### 1221 Wadsworth

- **Property ID:** `e032af0d-55f5-4ec8-b840-c04b0e1b4950`
- **Projects (1):** `25013`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25013 | **BOX-BSI** | Box: 25013-Lakewood, CO - 1221 Wadsworth |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received 041825.pdf; Subcontract Agreement.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 8711 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### 250 Church

- **Property ID:** `3b63aabf-e4a1-4b31-89c8-d5f16b5f03a0`
- **Projects (1):** `25033`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH+PIPELINE+FIRECRAWL** | bsi_project_setup |
| Project identity | project_registry 25033 | **BOX-BSI** | Box: 25033 - College Station, TX - 250 Church (201Boyett) |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 1 contract PDF(s): Contract Received 081925.pdf |
| Unit types | 18 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 148 property_units | **BOX-BSI** | Unit & Shop Drawing Matrix Template_250 Church.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 11580 |
| Stakeholders / contacts | 10 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### 50 South SH

- **Property ID:** `e6fd71d1-f73e-418f-88c7-eeeb2f627a7d`
- **Projects (1):** `25002`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25002 | **BOX-BSI** | Box: 25002 - Orlando, FL - 50 South Student Housing |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received 021325.pdf; Contract Received.pdf · GC Values Workbook: GC Values Workbook.xlsx · 1 GC schedule PDF(s): Orlando, FL - 50 South Student Housing - Unit Finish Schedules.pdf |
| Unit types | 17 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 166 property_units | **BOX-BSI** | 50 Student Housing Matrix.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 7858 |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### 965 Flats Phase 3

- **Property ID:** `72696496-336e-461f-8006-7ede1e13c8a0`
- **Projects (1):** `25041`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 25041 | **BOX-BSI** | Box: 25041 - Coralville, IA - 965 Flats Phase 3 |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 2 contract PDF(s): Contract Received 093025.pdf; Subcontract Agreement.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 6 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 42 property_units | **BOX-BSI** | Coralville, IA 968 Flats Matrix.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 11806 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Astor Club and Residences

- **Property ID:** `49c36015-e4a8-4ecb-bee6-d3499fbf9d44`
- **Projects (1):** `25035`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25035 | **BOX-BSI** | Box: 25035 - Franklin, TN - Astor Club and Residences |
| Plan milestones / pacing | 2 project_milestones | **BOX-BSI** | contract:executed_date (1), contract:Substantial Completion (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Fully Executed Subcontract Agreement - Franklin, TN - Westhaven Astor Club.pdf; Contract Received 081325.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 15 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 107 property_units | **BOX-BSI** | Franklin - Astor Club Matrix.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 11585 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Britta Ridge Apartments

- **Property ID:** `4a237c5e-5ca4-49ff-a630-503f92dfd5e6`
- **Projects (1):** `25036`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25036 | **BOX-BSI** | Box: 25036 - Bend, OR - Britta Ridge Apts |
| Plan milestones / pacing | 2 project_milestones | **BOX-BSI** | contract:progress_schedule_dated (1), contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received 082525.pdf; Subcontract Agreement - Bend, OR - Britta Ridge.pdf · GC Values Workbook: GC Values Workbook.xlsx · 1 GC schedule PDF(s): Bend, OR - Britta Ridge Apts - Unit Finish Schedule 010625.pdf |
| Unit types | 9 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 66 property_units | **BOX-BSI** | Bend, OR - Britta Ridge Apts Matrix Vicostone Sequence.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 11587 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Century Restorative Care Village 1

- **Property ID:** `6ec9fd09-fcf7-44cf-b671-fdeed9d67a26`
- **Projects (1):** `25046`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 25046 | **BOX-BSI** | Box: 25046 - Los Angeles, CA - Century Restorative Care |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received 100925.pdf; Subcontract Agreement - Los Angeles, CA - Century Restorative Care.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 19 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 153 property_units | **BOX-BSI** | Century Restorative Care Matrix ZCU.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 12835 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### CMC SH Edwards Phase 3

- **Property ID:** `77634ba7-bc2f-449c-838b-9876b93e2f81`
- **Projects (1):** `25029`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 25029 | **BOX-BSI** | Box: 25029 - Edwards, CO - CMC SH - Edwards Phase 3 |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received 071525.pdf; Fully Executed Subcontract - Edwards CO - CMC Edwards Phase 3.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 10638 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Deven UCF Quadrangle SH

- **Property ID:** `076c7d27-3ff0-4d2e-8f6f-149460037b44`
- **Projects (1):** `25044`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 25044 | **BOX-BSI** | Box: 25044 - Orlando, FL - Deven UCF |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 2 contract PDF(s): Contract Received 102425.pdf; Subcontract Agreement - Orlando, FL -  UCF Deven.pdf · GC Values Workbook: GC Values Workbook.xlsx · 2 GC schedule PDF(s): 2024-09-09 DEVEN UCF Quadrangle Student Housing - Project Schedule.pdf; 2024-09-09 DEVEN UCF Quadrangle Student Housing - Project Schedule.pdf |
| Unit types | 27 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 177 property_units | **BOX-BSI** | Orlando, FL - UCF Quadrangle - Unit SD Matrix.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 12833 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Ever Building

- **Property ID:** `177838da-3dd4-4431-aa1f-58774330df67`
- **Projects (1):** `25038`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25038 | **BOX-BSI** | Box: 25038 - College Station, TX - Ever Building |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 2 contract PDF(s): Contract Received 101625.pdf; Subcontract Agreement - College Station, TX - Ever Bldg.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 26 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 176 property_units | **BOX-BSI** | Unit & Shop Drawing Matrix Template_EVER (molivares@blakesolutions.com).xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 11701 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### HUB ANN ARBOR

- **Property ID:** `d7aea0dc-a7b1-4bb2-a2fa-20e873ec4621`
- **Projects (1):** `25015`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25015 | **BOX-BSI** | Box: 25015-Ann Arbor, MI - HUB |
| Plan milestones / pacing | 2 project_milestones | **BOX-BSI** | gc_schedule:Cabinet Install (GC Schedule) (1), contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 1 contract PDF(s): Subcontract Agreement.pdf · GC Values Workbook: GC Values Workbook.xlsx · 1 GC schedule PDF(s): HUB Ann Arbor - Subcontractor Schedule - DD2025.05.14.pdf |
| Unit types | 88 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 228 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 530 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### HUB Boulder

- **Property ID:** `d2b6391a-b619-468f-be73-2fb434cff731`
- **Projects (1):** `25321`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25321 | **BOX-BSI** | Box: 25321 - Boulder, CO - HUB |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Executed Subcontract Agreement - Boulder, CO - Hub Boulder.pdf; Subcontract Agreement - Boulder, CO - Hub Boulder.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Legacy Newton Building 1 + 2

- **Property ID:** `7d2c553e-7374-430d-80b3-c7089ff48af0`
- **Projects (1):** `25020`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25020 | **BOX-BSI** | Box: 25020 - Newton, IA - Legacy Newton Bldgs 1 & 2 |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 5 contract PDF(s): Contract Received 061325.pdf; Executed Subcontract Agreement - Newton, IA - Legacy Newton Bldg 1& 2.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 24 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 49 property_units | **BOX-BSI** | Newton, IA - Legacy Matrix.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 9802 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Morgan Hill Apartments

- **Property ID:** `a30d446c-ee4a-4fe0-a76e-e4f9bed0e3b0`
- **Projects (1):** `25048`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_RESEARC** | rita_research |
| Project identity | project_registry 25048 | **DALE-IS** | DALE sheet: PROJECT MANAGING/PROPOSAL PER CONTRACT/Carrollton, TX - Morgan Hill PPC.xlsx · Box: 25048 - Carrollton, TX - Morgan Hill |
| Plan milestones / pacing | 6 project_milestones | **BOX-BSI** | contract:drawing_log_cd_permit (1), contract:executed_date (1), contract:exhibit_b1_commence (1), schedule_mto:truck_1 (1), schedule_mto:rosd (1), schedule_mto:last_truck (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received 112125.pdf; Contract Received.pdf · SCHEDULE_MTO: Morgan Hill SCHEDULE_MTO.xlsx · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 86 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 390 property_units | **BOX-BSI** | Morgan Hill Matrix NEW.xlsx |
| Scoped SKUs (FF&E / millwork) | 7541 property_unit_type_skus | **BOX-BSI** | source values: morgan_hill_counts_workbook, morgan_hill_counts_workbook_vanity |
| Shop drawings | 34 property_shop_drawings | **BOX-BSI** | ...25048/.../SHOP DRAWINGS/Cabinets/KM PDFs/MW03.pdf; ...25048/.../SHOP DRAWINGS/Cabinets/KM PDFs/MW04.pdf; ...25048/.../SHOP DRAWINGS/Cabinets/KM PDFs/MW07.pdf |
| Floor plans | 11 property_floors with plan URL | **BOX-BSI** | Cloudinary URLs from Box architectural PDFs |
| Container logistics | Chain-iQ container_loads link | **CHAIN-IQ** | {"synced_at":"2026-07-04T13:54:59.588Z","property_id":"a30d446c-ee4a-4fe0-a76e-e4f9bed0e3b0","project_registry_id":"dda5 |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 12950 |
| Stakeholders / contacts | 5 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | cloudinary:rendering, box:proposal_per_contract, box:unit_matrix, box:construction_schedule, box:schedule_of_values, box:contract, box:shop_drawings, box:packing_lists, box:photos, box:architectural_ifc, box:site_plan, box:architectural_permit, box:subcontract |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### Northwood Ravin Apartments

- **Property ID:** `2b3632ec-8f2a-4459-8118-213d572d4b6a`
- **Projects (1):** `25030`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 25030 | **BOX-BSI** | Box: 25030 - Tampa, FL - Northwood Ravin Apartments |
| Plan milestones / pacing | 2 project_milestones | **BOX-BSI** | contract:Plans Dated (1), contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received 091025.pdf; Contract Received 090825.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 28 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 380 property_units | **BOX-BSI** | Tampa FL - Independence Park_Unit  Shop Drawing Matrix ZCU New.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 10640 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Pearl St. Parcel N11

- **Property ID:** `3c8d8194-a4d2-449e-9392-f4706185e910`
- **Projects (1):** `25018`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 25018 | **BOX-BSI** | Box: 25018-Jacksonville, FL - N11 Gateway Jax |
| Plan milestones / pacing | 2 project_milestones | **BOX-BSI** | contract:executed_date (1), gc_schedule:Cabinet Install (GC Schedule) (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 4 contract PDF(s): Fully Executed Subcontract Agreement - Jacksonville, FL - N11.pdf; Executed 24207FL-N11-Gateway_Jax-021-Cabinets_and_Countertops-2025-02-04.pdf · GC Values Workbook: GC Values Workbook.xlsx · 2 GC schedule PDF(s): Gateway Jax N11 Production Schedule - Revision 6 - 2025-08-26 ISSUED.ppx - Gantt.pdf; Attachment C - Subcontractor Schedule.pdf |
| Unit types | 33 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 205 property_units | **BOX-BSI** | JAX- GATEWAY  UNIT MATRIX .xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 9166 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Regional Street Senior APTS

- **Property ID:** `ff54026f-2801-430d-bd78-9babee731d51`
- **Projects (1):** `25006`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 25006 | **BOX-BSI** | Box: 25006 - Dublin, CA - Regional Street Senior |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Fully Executed_Regional_Street_Apartments_-_Blake_.pdf; Blake_Solutions_-_Subcontract_package_-_Regional_Street_Apartments.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 5 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 113 property_units | **BOX-BSI** | DUBLIN,CA REGINAL ST.APTS  UNIT & DRWG MATRIX.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 8083 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### The Ellie Townhomes

- **Property ID:** `4ef6046b-85c8-49ca-98f9-77a1e5cd3a69`
- **Projects (1):** `25017`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25017 | **BOX-BSI** | Box: 25017 - Fort Collins, CO - Ellie Townhomes |
| Plan milestones / pacing | 2 project_milestones | **BOX-BSI** | gc_schedule:Cabinet Install (GC Schedule) (1), gc_schedule:Countertop Install (GC Schedule) (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received 050625.pdf; Subcontract Agreement - Fort Collins, CO - Ellie Townhomes.pdf · GC Values Workbook: GC Values Workbook.xlsx · 1 GC schedule PDF(s): 8.28 Full schedule - The Ellie.pdf |
| Unit types | 4 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 26 property_units | **BOX-BSI** | Ellie Townhomes Matrix.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 8863 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### The Ellis

- **Property ID:** `11b507c5-9505-430b-aebb-eba83b9e6fd1`
- **Projects (1):** `25039`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25039 | **BOX-BSI** | Box: 25039 - Eugene, OR - The Ellis |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received wd.pdf; Contract Received.pdf · 2 GC schedule PDF(s): Ellis Master Schedule with two added florrs 8-7-25.pdf; - Ellis Master Schedule 5-28-26.pdf |
| Unit types | 23 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 306 property_units | **BOX-BSI** | The Ellis - Matrix.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 11804 |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Troubadour — 14th Street SH

- **Property ID:** `095960e3-5b22-4a0c-9528-e3843fed3ede`
- **Projects (1):** `25019`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH+PIPELINE+BOX-BSI+FIRECRAWL** | bsi_project_setup |
| Project identity | project_registry 25019 | **BOX-BSI** | Box: 25019-Lubbock, TX - 14th Street SH |
| Plan milestones / pacing | 6 project_milestones | **BOX-BSI** | gc_schedule:Executed Contract / NTP (1), gc_schedule:Install Cabinets and Countertops (GC Schedule) (1), gc_schedule:First Delivery (GC Schedule) (1), gc_schedule:Building Structure Top Out (1), gc_schedule:Install Cabinets (GC Schedule) (1), gc_schedule:Install Countertops (GC Schedule) (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 2 contract PDF(s): Subcontract Agreement Updated 02.26.pdf; Master Subcontractor Agreement.pdf · GC Values Workbook: GC Values Workbook.xlsx · 2 GC schedule PDF(s): Parallel Student Housing - Master Schedule 2-4-2026.pdf; Parallel - Lookahead Schedule 4-22-2026.pdf |
| Unit types | 23 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 276 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 790 property_unit_type_skus | **TROUBADOUR_C** | source values: troubadour_counts_workbook_vanity, troubadour_counts_workbook |
| Shop drawings | 49 property_shop_drawings | **BOX-BSI** | 25019-Lubbock, TX - 14th Street SH/PROJECT MANAGING/SHOP DRAWINGS/Cabinets/DS PDFs/MW01.5.pdf; 25019-Lubbock, TX - 14th Street SH/PROJECT MANAGING/SHOP DRAWINGS/Cabinets/DS PDFs/MW01.5a.pdf; 25019-Lubbock, TX - 14th Street SH/PROJECT MANAGING/SHOP DRAWINGS/Cabinets/DS PDFs/MW01.pdf |
| Floor plans | 7 property_floors with plan URL | **BOX-BSI** | Cloudinary URLs from Box architectural PDFs |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 9271 |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:accounting, box:shop_drawing, box:subcontract |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### UU P3 Housing

- **Property ID:** `5f38e2c7-8952-4948-89b5-daaf14dab8f7`
- **Projects (1):** `25010`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH+PIPELINE+FIRECRAWL** | bsi_project_setup |
| Project identity | project_registry 25010 | **BOX-BSI** | Box: 25010 - Salt LakeCity, UT - UU P3 Housing |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Fully Executed Subcontract Agreement - SLC UT P3 Housing - Scenic View Contracting.pdf; Executed Subcontract Agreement - SLC UT P3 Housing-Scenic View Contracting.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 26 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 339 property_units | **BOX-BSI** | Salt Lake City Shop Drawing Matrix_9.25.25.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 8650 |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### Verve Knoxville

- **Property ID:** `27277d94-7026-4be7-a7a7-c6786d5ffe5e`
- **Projects (1):** `25008`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH+PIPELINE+FIRECRAWL** | bsi_project_setup |
| Project identity | project_registry 25008 | **BOX-BSI** | Box: 25008 - Knoxville, TN - Verve Knoxville |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received 022525.pdf; Subcontract Agreement.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 161 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 757 property_units | **BOX-BSI** | Knoxville Verve Matrix_Truck Sequence.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 8313 |
| Stakeholders / contacts | 6 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### VERVE ORLANDO

- **Property ID:** `12b38935-0876-4f44-9192-f338560f81c1`
- **Projects (1):** `25001`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 25001 | **BOX-BSI** | Box: 25001 - Orlando, FL - Verve Orlando |
| Plan milestones / pacing | 2 project_milestones | **BOX-BSI** | contract:executed_date (1), contract:exhibit_d (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received 011525.pdf; Contract Received.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 40 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 200 property_units | **BOX-BSI** | Orlando Verve - Matrix_Unit Sequence.xlsx |
| Scoped SKUs (FF&E / millwork) | 373 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 7854 |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### VERVE TEMPE

- **Property ID:** `f241f8dc-96de-4dc3-a09c-823c4eeb848c`
- **Projects (1):** `25009`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 25009 | **BOX-BSI** | Box: 25009 - Tempe, AZ - Verve Tempe |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received 030625.pdf; Fully Executed Subcontract - Tempe AZ - Verve.pdf · GC Values Workbook: GC Values Workbook.xlsx · 2 GC schedule PDF(s): 1571 - Verve Tempe Project Schedule - 2.10.25.pdf; 1571 - Verve Tempe Project Schedule - 2.10.25.pdf |
| Unit types | 75 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 240 property_units | **BOX-BSI** | Tempe, AZ - Verve Tempe Matrix.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 8540 |
| Stakeholders / contacts | 6 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### Westminster Tower Renovation

- **Property ID:** `578f4938-7468-46ad-8d4d-9d35427e37a1`
- **Projects (1):** `25027`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25027 | **BOX-BSI** | Box: 25027 - Santa Monica, CA - Westminster Tower Renovation |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 1 contract PDF(s): Contract Received 070325.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 5 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 285 property_units | **BOX-BSI** | Santa Monica, CA - Westminister Matrix.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 10068 |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

### BSI · 2026

#### 505 S Fifth

- **Property ID:** `371b2856-f17d-4ae5-bf77-de729410a906`
- **Projects (1):** `25012`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25012 | **BOX-BSI** | Box: 25012 - Champaign, IL - 505 S Fifth |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:Substantial Completion (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Fully Executed Subcontract Agreement - Champaign, IL - 505 S 5th Street.pdf; Contract Received 041525.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 4 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 86 property_units | **BOX-BSI** | 505 S Fith Matrix.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 8710 |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### 515 Walnut Tower

- **Property ID:** `73082594-9194-404a-9e4b-5f05c7248833`
- **Projects (1):** `25007`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25007 | **BOX-BSI** | Box: 25007- Des Moines, IA - 515 Walnut |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Fully Executed - Subcontract Agreement - Des Moines IA - 515 Walnut Tower.pdf; Contract Received 021325.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 8204 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### 711 New Hampshire Cabs

- **Property ID:** `43927d73-2a37-4a82-983b-5292658922e1`
- **Projects (1):** `25034`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 25034 | **BOX-BSI** | Box: 25034 - Los Angeles, CA - 711 New Hampshire |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Fully Executed Subcontract Agreement - Los Angeles, CA - 711 New Hampshire.pdf; Contract Received 081825.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 11582 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Evans and Gilpin

- **Property ID:** `5dca2f70-8c1c-48b4-b52f-55fea4393642`
- **Projects (1):** `25031`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25031 | **BOX-BSI** | Box: 25031 - Denver, CO - Evans and Gilpin |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 2 contract PDF(s): 01 - Task Order_Blake Solutions - BSI Executed.pdf; Subcontract Agreement - Denver, CO - Evans and Gilpin.pdf · GC Values Workbook: GC Values Workbook.xlsx · 3 GC schedule PDF(s): 2025.08.11 Evans and Gilpin Full Schedule.pdf; 2025.09.07 Evans & Gilpin Full Schedule.pdf |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 10642 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Gateway Jax N4

- **Property ID:** `5713a845-939b-4e75-a29b-95f6633ac2c6`
- **Projects (1):** `25045`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 25045 | **BOX-BSI** | Box: 25045 Jacksonville, FL - Gateway Jax N4 |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | gc_schedule:Cabinet Install (GC Schedule) (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 1 contract PDF(s): Subcontract Agreement.pdf · GC Values Workbook: GC Values Workbook.xlsx · 3 GC schedule PDF(s): Gateway Jax - N4 Production Schedule Rev 6   1-26-26 Issued.ppx - Gantt.pdf; Attachment C - Subcontractor Schedule.pdf |
| Unit types | 52 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 286 property_units | **BOX-BSI** | Jacksonville, FL_Gateway_Drawing Matrix.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 12834 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### HUB III 5 Five Corners

- **Property ID:** `6f4bcc8a-423b-4ca4-be37-195917f9e2a1`
- **Projects (1):** `26-BSI-a0ee74`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 26-BSI-a0ee74 | **UNKNOWN** | HUB III 5 Five Corners |
| Unit types | 51 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 368 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hub Madison, WI - 2024 Acquisition

- **Property ID:** `afe73b66-f042-4d6c-9085-91d5f07f366e`
- **Projects (1):** `25315`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25315 | **BOX-BSI** | Box: 25015-Madison, WI - HUB - J+B |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 2 contract PDF(s): Fully Executed Subcontract - Madison, WI - The Hub - J+B..pdf; Subcontract Agreement.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Hub on Campus Raleigh

- **Property ID:** `e0f01ab5-a1da-42fd-a358-a4c67db29d4c`
- **Projects (1):** `26-BSI-c44f66`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+CORESPACES+FIRECRAWL** | install_schedules |
| Project identity | project_registry 26-BSI-c44f66 | **UNKNOWN** | 24015 - HUB on Campus - Raleigh |
| Unit types | 194 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 9 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### Toyon Gardens

- **Property ID:** `666cff68-044c-41f7-b256-c61e3e70386a`
- **Projects (1):** `25040`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 25040 | **BOX-BSI** | Box: 25040 - Gardena, CA - Toyon Gardens |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 1 contract PDF(s): Subcontract Agreement - Gardena, CA - Toyon Gardens.pdf · GC Values Workbook: GC Values Workbook.xlsx · 2 GC schedule PDF(s): A64-01 _ FINISH SCHEDULE AND LEGEND.pdf; Toyon Gardens - Finish Schedule - Apartments (12-12-25).pdf |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 11805 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Troubadour — 14th Street SH

- **Property ID:** `095960e3-5b22-4a0c-9528-e3843fed3ede`
- **Projects (1):** `25198`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH+PIPELINE+BOX-BSI+FIRECRAWL** | bsi_project_setup |
| Project identity | project_registry 25198 | **BOX-BSI** | Box: 25019-Lubbock, TX - 14th Street SH |
| Unit types | 23 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 276 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 790 property_unit_type_skus | **TROUBADOUR_C** | source values: troubadour_counts_workbook_vanity, troubadour_counts_workbook |
| Shop drawings | 49 property_shop_drawings | **BOX-BSI** | 25019-Lubbock, TX - 14th Street SH/PROJECT MANAGING/SHOP DRAWINGS/Cabinets/DS PDFs/MW01.5.pdf; 25019-Lubbock, TX - 14th Street SH/PROJECT MANAGING/SHOP DRAWINGS/Cabinets/DS PDFs/MW01.5a.pdf; 25019-Lubbock, TX - 14th Street SH/PROJECT MANAGING/SHOP DRAWINGS/Cabinets/DS PDFs/MW01.pdf |
| Floor plans | 7 property_floors with plan URL | **BOX-BSI** | Cloudinary URLs from Box architectural PDFs |
| Container logistics | Chain-iQ container_loads link | **CHAIN-IQ** | {"synced_at":"2026-07-04T14:47:38.506Z","property_id":"095960e3-5b22-4a0c-9528-e3843fed3ede","project_name":"25198- Lubb |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:factory_contract, box:shop_drawing, box:matrix, box:site_plan, box:transmittal |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### VERVE FAYETTEVILLE

- **Property ID:** `78145c1f-7a15-44cb-9ed4-8257bc70c478`
- **Projects (1):** `25042`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 25042 | **BOX-BSI** | Box: 25042 - Fayetteville, AR - VERVE Fayetteville |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 1 contract PDF(s): Subcontract Agreement - Fayetteveille, AR - Verve.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 25 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 272 property_units | **BOX-BSI** | Fayetteville, AR - Verve Matrix ZCU_TR 3.5.26.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 11807 |
| Stakeholders / contacts | 5 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

### BSI · 2027

#### The Blume on Ivy UP Campus

- **Property ID:** `2cb2d133-1ce3-4d00-84f9-dd17b11bf0e4`
- **Projects (1):** `25011`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25011 | **BOX-BSI** | Box: 25011 - Charlottesville, VA - 2117 Ivy Road UP Campus |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Contract Received Executed 051625.pdf; Contract Received 041025.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 31 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 231 property_units | **BOX-BSI** | Charlottesville, VA - 2117 Ivy Road UP Campus Matrix - Countertop.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 8709 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

### CSL · 2026

#### Hub East Lansing

- **Property ID:** `0fe0f7a0-42bc-474a-bf04-f71015dce468`
- **Projects (1):** `26-1093-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **LAYOUT-IQ** | layout_iq |
| Project identity | project_registry 26-1093-D | **UNKNOWN** | deal: 26-1093-D |
| Unit types | 12 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 6 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hub on Campus Bloomington

- **Property ID:** `845827d4-a9a4-49b3-81f2-416c1c5d666a`
- **Projects (2):** `26-1468-D`, `26-179-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **CORESPACES+FIRECRAWL** | corespaces_prismic |
| Project identity | project_registry 26-1468-D | **UNKNOWN** | HUB Bloomington - Webstore Replenishment (26-1468-D) |
| Project identity | project_registry 26-179-I | **UNKNOWN** | HUB Bloomington - Fill-in Order (26-179-I) |
| Unit types | 16 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 6 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

### CSL · 2027

#### Hub on Campus Bloomington Lincoln

- **Property ID:** `8d192192-ea5e-48b3-bde9-79978a3104b5`
- **Projects (2):** `27-006-I`, `27-007-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **CORESPACES+FIRECRAWL** | corespaces_prismic |
| Project identity | project_registry 27-006-I | **CORESPACES** | HUB BLOOMINGTON II |
| Project identity | project_registry 27-007-I | **CORESPACES** | HUB BLOOMINGTON II |
| Unit types | 35 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 236 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 5 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

### CSMX · 2025

#### HUB Broom

- **Property ID:** `042bdab1-f440-4239-b7fd-e849bc061ff6`
- **Projects (1):** `25323`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 25323 | **BOX-BSI** | Box: 25323 - Madison, WI - Hub Broom St |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): Fully Executed Subcontract Agreement - Madison, WI Hub Broom Street..pdf; Contract Received 072225 WD.pdf · GC Values Workbook: GC Values Workbook.xlsx · 2 GC schedule PDF(s): G1.10 - UNIT MASTER SCHEDULE.pdf; 241115 MJB Unit Master Schedule & Plans.pdf |
| Unit types | 20 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 474 property_units | **BOX-BSI** | Madison WI - Hub Broom Matrix - MASTER.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 10309 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### HUB Clemson II

- **Property ID:** `eed1e0c3-e2a1-415e-bf31-fd612abe064f`
- **Projects (1):** `25331`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25331 | **BOX-BSI** | Box: 25331 - Clemson, SC - HUB Clemson |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 2 contract PDF(s): Contract Received 010626.pdf; Subcontract Agreement - Clemson, SC - Hub Clemson.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 50 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 50 property_units | **BOX-BSI** | CLEMSON UNIT& DWG MATRIX - 032026.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 10643 |
| Stakeholders / contacts | 6 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### HUB IV Knoxvile

- **Property ID:** `613b18c4-e9ec-4905-96a9-94369052b182`
- **Projects (1):** `25328`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **AIRTABLE-ARCH** | bsi_project_setup |
| Project identity | project_registry 25328 | **BOX-BSI** | Box: 25328 - Knoxville, TN - HUB Building 4 |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 1 contract PDF(s): Contract Received 103125.pdf |
| Unit types | 40 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 126 property_units | **BOX-BSI** | Knoxville, TN_Unit Matrix.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 10636 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |

#### Oxenfree Clear Creek

- **Property ID:** `e135a015-4d45-41c1-b6c9-4f8306dc89e8`
- **Projects (1):** `25332`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **CORESPACES+DALE-IS+FIRECRAWL** | install_iq_deal |
| Project identity | project_registry 25332 | **BOX-BSI** | Box: 25332 - Arvada, CO - Clear Creek Amenity Center |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 3 contract PDF(s): SUBCONTRACTOR AGREEMENT - Blake Solutions 09032025 - fully executed 9.3.25.pdf; Subcontract Agreement Updated 02.26.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 11579 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

### CSMX · 2026

#### Hub on Campus Bloomington Lincoln

- **Property ID:** `8d192192-ea5e-48b3-bde9-79978a3104b5`
- **Projects (1):** `25326`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **CORESPACES+FIRECRAWL** | corespaces_prismic |
| Project identity | project_registry 25326 | **BOX-BSI** | Box: 25326 - Bloomington, IN - HUB 2 Bloomington |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 2 contract PDF(s): Fully Executed Subcontract Agreement - Bloomington, IN - Hub 2.pdf; Subcontract Agreement - Bloomington, IN - Hub 2.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 35 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 236 property_units | **BOX-BSI** | Bloomington, IN - Hub 2 Bloomington Matrix_Phases II-VII_TR 2.6.26.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 10201 |
| Stakeholders / contacts | 5 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### Hub on Campus Tampa

- **Property ID:** `e07235fa-9922-43b0-86ae-70a6e3a216fe`
- **Projects (1):** `25337`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+CORESPACES+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25337 | **BOX-BSI** | Box: 25337 - Tampa, FL - HUB Tampa II |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 2 contract PDF(s): Fully Executed Subcontract Agreement - Tampa, FL - Hub Tampa 2.pdf; Subcontract Agreement - Tampa, FL - Hub Tampa 2.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 14 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 108 property_units | **BOX-BSI** | TAMPA TOWER DRWG MATRIX.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 11699 |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### Hub on Campus West Lafayette Chauncey

- **Property ID:** `e6e1f877-12c4-4294-9d80-a3d06267e240`
- **Projects (1):** `25325`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **CORESPACES+FIRECRAWL** | corespaces_prismic |
| Project identity | project_registry 25325 | **BOX-BSI** | Box: 25325-West Lafayette, IN - Hub Chauncey |
| Plan milestones / pacing | 1 project_milestones | **BOX-BSI** | contract:executed_date (1) |
| Contract / pacing artifacts | project_registry.external_ids.contract_sources | **BOX-BSI** | 2 contract PDF(s): Fully Executed - Subcontract - West Lafayette IN - Hub Chauncey.pdf; Subcontract Agreement.pdf · GC Values Workbook: GC Values Workbook.xlsx |
| Unit types | 99 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 681 property_units | **BOX-BSI** | Unit & Shop Drawing Matrix Bath 123 Dim.xlsx |
| NetSuite job economics | external_ids.netsuite_* | **NETSUITE** | job_id: 10199 |
| Stakeholders / contacts | 6 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Project documents index | project_registry.documents JSONB | **BOX-BSI** | box:subcontract |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

### TLCH · 2025

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-2102-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-2102-D | **UNKNOWN** | deal: 25-2102-D |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-1847-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-1847-D | **UNKNOWN** | deal: 25-1847-D |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-1166-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-1166-D | **UNKNOWN** | deal: 25-1166-D |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-1904-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-1904-D | **SAGE-PACE** | deal: 25-1904-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-1923-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-1923-D | **UNKNOWN** | deal: 25-1923-D |

#### Bishop Paiute Tribe Hotel

- **Property ID:** `26759ca2-8c0c-4f5f-b46b-c7cac06dde1c`
- **Projects (3):** `25-1868-D`, `25-1030-D`, `25-1907-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-1868-D | **UNKNOWN** | deal: 25-1868-D |
| Project identity | project_registry 25-1030-D | **UNKNOWN** | deal: 25-1030-D |
| Project identity | project_registry 25-1907-D | **UNKNOWN** | deal: 25-1907-D |

#### Chaminade Resort & Spa

- **Property ID:** `431f5cd5-f1e8-436c-bd13-3462071eaca9`
- **Projects (1):** `25-1116-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-1116-D | **UNKNOWN** | deal: 25-1116-D |

#### Courtyard Aberdeen Nc

- **Property ID:** `2c40529d-f93f-45eb-aba9-924ff7992008`
- **Projects (1):** `25-1893-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-1893-D | **UNKNOWN** | deal: 25-1893-D |

#### Courtyard Beckley WV

- **Property ID:** `67e56255-5184-4440-82bd-aace6d0bc3e7`
- **Projects (1):** `25-2023-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25-2023-D | **UNKNOWN** | deal: 25-2023-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Carolina Beach

- **Property ID:** `24860183-b34f-457d-9c72-2574417cabbf`
- **Projects (1):** `25-1952-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-1952-D | **UNKNOWN** | deal: 25-1952-D |

#### Courtyard Carson City, NV

- **Property ID:** `35cafa05-c52d-431c-b1c4-33da45758181`
- **Projects (1):** `25-1082`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1082 | **UNKNOWN** | deal: 25-1082 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Chandler Phoenix

- **Property ID:** `a604b6f1-fd63-4b55-abbe-1a7a02038e93`
- **Projects (2):** `25-1855-D`, `25-1808-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25-1855-D | **UNKNOWN** | deal: 25-1855-D |
| Project identity | project_registry 25-1808-D | **UNKNOWN** | deal: 25-1808-D |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Chicago Midway Airport - Side Tables

- **Property ID:** `a73c025b-8955-4534-84a9-1e26b145875a`
- **Projects (1):** `25-1084-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1084-D | **UNKNOWN** | deal: 25-1084-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Ft. Myers, FL

- **Property ID:** `cfd35600-6ec1-48d3-bd0d-0c0b8a20bd80`
- **Projects (1):** `25-1046-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25-1046-D | **UNKNOWN** | deal: 25-1046-D |

#### Courtyard Jacksonville Beach, FL

- **Property ID:** `329380d2-c3d1-46ab-9a9c-5780f9acb159`
- **Projects (1):** `25-1852-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1852-D | **UNKNOWN** | deal: 25-1852-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Jacksonville Beach, FL

- **Property ID:** `81a32394-0f4c-421b-b168-feef481b6247`
- **Projects (1):** `25-1857`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1857 | **UNKNOWN** | deal: 25-1857 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Kansas City Shawnee - Feb '25 Delivery

- **Property ID:** `b93d79c7-359c-4cf4-9cc4-090d2f0854f3`
- **Projects (1):** `25-1034`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1034 | **UNKNOWN** | deal: 25-1034 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Kansas City Shawnee - Luggage Trunks

- **Property ID:** `40da1fc3-192f-4022-8fe3-4474a4e166b2`
- **Projects (1):** `25-1122-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1122-D | **UNKNOWN** | deal: 25-1122-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Kansas City Shawnee - Mar '25 Delivery

- **Property ID:** `36c22292-a83c-4bb8-aecc-a4931b199538`
- **Projects (1):** `25-1035-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1035-D | **UNKNOWN** | deal: 25-1035-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Lewiston, ID

- **Property ID:** `441e2e3a-90b5-4a76-ad01-fa931d2355b8`
- **Projects (1):** `25-1036`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1036 | **SAGE-PACE** | deal: 25-1036 |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Redwood City, CA

- **Property ID:** `ef555c41-a341-4262-965e-b27ced06e368`
- **Projects (1):** `25-1042-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1042-D | **SAGE-PACE** | deal: 25-1042-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard San Diego - Little Italy

- **Property ID:** `248d52fb-9d74-45d6-b79c-4040d7ad0153`
- **Projects (1):** `25-1029-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25-1029-D | **UNKNOWN** | deal: 25-1029-D |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard San Diego - Little Italy - Model Room

- **Property ID:** `1b9e0f52-796a-4145-96a8-a41df7f3c806`
- **Projects (1):** `25-2166-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-2166-D | **SAGE-PACE** | deal: 25-2166-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Shreveport Bossier City

- **Property ID:** `e415f31e-3a11-4ef5-a90b-c18216e4234c`
- **Projects (1):** `25-1525-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-1525-D | **UNKNOWN** | deal: 25-1525-D |

#### Courtyard Stamford, CT

- **Property ID:** `5d20fafa-ade6-4683-9a6a-5b0a23c278d5`
- **Projects (2):** `25-2058-D`, `25-1017-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-2058-D | **UNKNOWN** | Courtyard Stamford 25-2058-D |
| Project identity | project_registry 25-1017-D | **UNKNOWN** | deal: 25-1017-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Willow Grove Pa

- **Property ID:** `88db218b-33d3-4ce9-9a9a-dc98fba64434`
- **Projects (1):** `25-2105-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-2105-D | **UNKNOWN** | deal: 25-2105-D |

#### Disney Alligator Bayou Resort

- **Property ID:** `028b1892-6535-4cbb-9235-2960926574af`
- **Projects (1):** `25-1926-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-1926-D | **UNKNOWN** | deal: 25-1926-D |

#### Disney Port Orleans Magnolia Bend - Case Goods - 2025

- **Property ID:** `ea5a06dc-4a77-433a-aa7e-c9d26226c9f1`
- **Projects (1):** `25-1019-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1019-D | **UNKNOWN** | deal: 25-1019-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Disney Royal Rooms

- **Property ID:** `f7277bd9-4005-49ab-a049-771fec1ce32a`
- **Projects (1):** `25-1027-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-1027-D | **UNKNOWN** | deal: 25-1027-D |

#### Disney Worldwide

- **Property ID:** `89fb02c6-e9f8-47cb-af76-f9078b25312a`
- **Projects (2):** `25-2100-D`, `25-2078-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-2100-D | **UNKNOWN** | deal: 25-2100-D |
| Project identity | project_registry 25-2078-D | **UNKNOWN** | deal: 25-2078-D |

#### Domus Flats Miami - Casegoods

- **Property ID:** `b9b77fb7-1ad1-4a52-9d29-9b204d203b72`
- **Projects (1):** `25-1848-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1848-D | **UNKNOWN** | deal: 25-1848-D |

#### DoubleTree Redington Beach - Tampa, FL

- **Property ID:** `78774683-fc60-4857-af2a-54e5ccec5da8`
- **Projects (1):** `25-1039-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1039-D | **UNKNOWN** | deal: 25-1039-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### DUNDEE RESIDENCE HALL

- **Property ID:** `bfd26b75-4698-4ad5-9908-b512fdf06ff7`
- **Projects (1):** `25-1984-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-1984-D | **UNKNOWN** | deal: 25-1984-D |
| Unit types | 8 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 8 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Embassy Suites Airport San Antonio Model Room

- **Property ID:** `bd6b9943-9f67-4989-9d7a-d906427cc9e3`
- **Projects (1):** `25-1866-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1866-D | **SAGE-PACE** | deal: 25-1866-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Embassy Suites Bloomington Public Space

- **Property ID:** `3263212f-fa3d-45a9-b391-86c4455b0d0d`
- **Projects (1):** `25-1977-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1977-D | **UNKNOWN** | deal: 25-1977-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Embassy Suites Bloomington, MN

- **Property ID:** `46cd9289-fd0e-4382-98c3-e4833cf2753e`
- **Projects (1):** `25-1933-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1933-D | **UNKNOWN** | 25-1933-D EMBASSY SUITES BLOOMINGTON |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hale Mahana - Honolulu, HI

- **Property ID:** `c4031697-2220-4c52-be26-35ab16d87325`
- **Projects (1):** `25-1649-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25-1649-D | **UNKNOWN** | deal: 25-1649-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hampton Inn New York

- **Property ID:** `07687960-056f-411d-8be8-52230edac546`
- **Projects (1):** `25-1072-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-1072-D | **SAGE-PACE** | deal: 25-1072-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Hilltop Austin

- **Property ID:** `b3b80bf4-23f9-4db0-ad49-4187569f024d`
- **Projects (1):** `25-1682-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_student |
| Project identity | project_registry 25-1682-D | **UNKNOWN** | deal: 25-1682-D |

#### Hilton Anatole

- **Property ID:** `09ed4011-1ea2-4f4a-873a-beecb8243979`
- **Projects (2):** `25-1805-D`, `25-1898-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **TLCH_MANUAL** | tlch_manual |
| Project identity | project_registry 25-1805-D | **UNKNOWN** | deal: 25-1805-D |
| Project identity | project_registry 25-1898-D | **UNKNOWN** | deal: 25-1898-D |
| Stakeholders / contacts | 10 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### Hilton Canopy - El Paso, TX - Model Room

- **Property ID:** `b5044e3e-9ca9-4740-8911-400bb8337eec`
- **Projects (1):** `25-1053-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1053-D | **SAGE-PACE** | deal: 25-1053-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hilton Garden Inn - Casper, WY - Replacements

- **Property ID:** `ca308162-274d-477f-9b8e-8acc6f6f3da5`
- **Projects (1):** `25-1049-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1049-D | **UNKNOWN** | deal: 25-1049-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Homewood Suites by Hilton University City Philadelphia, PA

- **Property ID:** `1f38655a-52c6-4458-a558-67bc9d3b6acd`
- **Projects (1):** `25-1529-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1529-D | **UNKNOWN** | deal: 25-1529-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hotel Indigo Asheville

- **Property ID:** `a60a3c47-5394-4cfd-8911-01e17b44073a`
- **Projects (1):** `25-1058-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25-1058-D | **UNKNOWN** | deal: 25-1058-D |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hub at Cincinnati

- **Property ID:** `4c16d356-b568-48d0-af42-115483a7974a`
- **Projects (2):** `25-1795-D`, `25-2117-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25-1795-D | **UNKNOWN** | deal: 25-1795-D |
| Project identity | project_registry 25-2117-D | **UNKNOWN** | deal: 25-2117-D |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hub Coliseum

- **Property ID:** `211bfa4c-94cf-4a1e-b51c-47202f22c7bb`
- **Projects (1):** `25-1652-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+LAYOUT-IQ+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1652-D | **UNKNOWN** | deal: 25-1652-D |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### HUB Figueroa

- **Property ID:** `fd570737-df7b-42fe-a884-a46020df2e4e`
- **Projects (1):** `25-1596-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_student |
| Project identity | project_registry 25-1596-D | **UNKNOWN** | deal: 25-1596-D |

#### Hub on Campus Champaign

- **Property ID:** `500247ab-4132-489e-b46c-b3e98554fe0a`
- **Projects (1):** `25-1657-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+CORESPACES+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25-1657-D | **UNKNOWN** | deal: 25-1657-D |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### Hub on Campus Tampa Fowler

- **Property ID:** `2557947e-3a11-41db-87b6-e831fdb5a30a`
- **Projects (1):** `25-1631-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **CORESPACES+FIRECRAWL** | corespaces_prismic |
| Project identity | project_registry 25-1631-D | **CORESPACES** | deal: 25-1631-D |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### Hyatt Driskill Hotel - Austin, TX - Tower Rooms

- **Property ID:** `62b9c371-bd2c-443c-879b-e362adad8ff2`
- **Projects (2):** `25-1995-D`, `25-1542-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1995-D | **UNKNOWN** | deal: 25-1995-D |
| Project identity | project_registry 25-1542-D | **UNKNOWN** | deal: 25-1542-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt Driskill Hotel - Austin, TX - Tower Rooms 25-1542-AC

- **Property ID:** `1325610d-7986-4d67-befd-ff8311a39c3e`
- **Projects (1):** `25-1157-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25-1157-D | **UNKNOWN** | deal: 25-1157-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt House - Monroe, NJ

- **Property ID:** `30e99c6e-f17e-4632-addd-f75298e409b4`
- **Projects (1):** `25-1892-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1892-D | **UNKNOWN** | deal: 25-1892-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt House - Monroe, NJ Model Room

- **Property ID:** `19a9b952-aa7c-42fc-b277-7fd35a08bcc7`
- **Projects (1):** `25-1891-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1891-D | **UNKNOWN** | deal: 25-1891-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt Place - Kansas City

- **Property ID:** `490cb772-8f21-43cc-a746-af504fdefd24`
- **Projects (1):** `25-1080-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1080-D | **UNKNOWN** | deal: 25-1080-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt Place - Zion Springdale, UT

- **Property ID:** `bba457a0-ce07-473a-bb46-c86dacd9b76a`
- **Projects (2):** `25-2022-D`, `25-1102-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-2022-D | **UNKNOWN** | deal: 25-2022-D |
| Project identity | project_registry 25-1102-D | **UNKNOWN** | deal: 25-1102-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt Place - Zion Springdale, UT - Model Room

- **Property ID:** `4f1d5e72-96d4-412d-922d-d99a3ccc690b`
- **Projects (1):** `25-1047-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1047-D | **UNKNOWN** | deal: 25-1047-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt Place - Zion Springdale, UT - Production

- **Property ID:** `6cf8c892-9e61-4f96-bfb5-601981667daa`
- **Projects (1):** `25-1048`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1048 | **UNKNOWN** | deal: 25-1048 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt Regency - Bellevue, WA

- **Property ID:** `f4839f11-dd33-4725-b8f1-b8816b1095a1`
- **Projects (1):** `25-1821-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1821-D | **UNKNOWN** | deal: 25-1821-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt Regency - Bellevue, WA M Model Room

- **Property ID:** `7099f16a-5a72-487f-87d8-88422b4f89c0`
- **Projects (1):** `25-1820-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1820-D | **UNKNOWN** | deal: 25-1820-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt Regency - Tysons Corner, VA - Suites

- **Property ID:** `2c6b231a-98b3-462b-a95d-d594ff83d07d`
- **Projects (1):** `25-1954-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1954-D | **UNKNOWN** | deal: 25-1954-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt Regency Houston Model Room

- **Property ID:** `780d990e-e462-48c3-9254-9b0cf7337c56`
- **Projects (1):** `25-2089-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-2089-D | **UNKNOWN** | deal: 25-2089-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt Select

- **Property ID:** `5e98bb03-158e-4ee2-8282-994c305c8caf`
- **Projects (1):** `25-2063-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-2063-D | **UNKNOWN** | deal: 25-2063-D |

#### Hyatt Studios Corporate Office - Wardrobe

- **Property ID:** `ecf39011-c763-44d9-be4f-57af62c93134`
- **Projects (1):** `25-1070-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | cwb_ingest |
| Project identity | project_registry 25-1070-D | **SAGE-PACE** | deal: 25-1070-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Hyatt Studios Huntsville

- **Property ID:** `297149ef-692f-41c2-a3e1-c81a2f341cd8`
- **Projects (1):** `25-1842-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1842-D | **UNKNOWN** | deal: 25-1842-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt Studios Jacksonville

- **Property ID:** `26895a9b-1b5c-4d25-a856-f6096e992956`
- **Projects (1):** `25-1961-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1961-D | **SAGE-PACE** | deal: 25-1961-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### ISLANDER HOUSING T MIRAMAR CAMPUS

- **Property ID:** `949761cd-80db-4978-8797-0c1cccc9cf84`
- **Projects (1):** `25-1812-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-1812-D | **UNKNOWN** | deal: 25-1812-D |
| Unit types | 49 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 49 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### JW Marriott Tucson Starr Pass

- **Property ID:** `5e396216-7a28-57e1-a827-434376bf3a5b`
- **Projects (2):** `25-1121`, `25-1908-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 25-1121 | **UNKNOWN** | deal: 25-1121 |
| Project identity | project_registry 25-1908-D | **UNKNOWN** | deal: 25-1908-D |
| Stakeholders / contacts | 5 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### KINETIC sTUDENT HOUSING

- **Property ID:** `3d2e431a-d1c2-4892-bd43-f33dcffabb8b`
- **Projects (1):** `25-1632-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-1632-D | **SAGE-PACE** | deal: 25-1632-D |
| Unit types | 27 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 239 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Loews Miami Beach

- **Property ID:** `6b6ddf1a-c414-4610-87f6-385e8f0a7baf`
- **Projects (1):** `25-2056-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25-2056-D | **UNKNOWN** | deal: 25-2056-D |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### LOEWS MIAMI BEACH GUESTROOMS

- **Property ID:** `14881d16-350a-40ab-94f2-8140400d193f`
- **Projects (1):** `25-1824-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1824-D | **UNKNOWN** | deal: 25-1824-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Loews Miami Beach Hotel - Attic Stock

- **Property ID:** `58abe0b8-e739-4998-811c-bbf3127a159f`
- **Projects (1):** `25-1666-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | cwb_ingest |
| Project identity | project_registry 25-1666-D | **CWB_INGEST** | deal: 25-1666-D |

#### Loews Miami Beach Hotel - Case Goods

- **Property ID:** `bc03c49b-6da7-4245-878b-ee183f13dfdc`
- **Projects (1):** `25-1173`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1173 | **UNKNOWN** | deal: 25-1173 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Lumina Hollywood

- **Property ID:** `21ceadac-1d71-4f5f-9e18-1b7cae01e8d0`
- **Projects (1):** `25-1998-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_student |
| Project identity | project_registry 25-1998-D | **UNKNOWN** | deal: 25-1998-D |

#### Marriott

- **Property ID:** `fe5ea12a-7003-4633-a8cf-1e72b97b49a5`
- **Projects (1):** `25-2099-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25-2099-D | **UNKNOWN** | deal: 25-2099-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Marriott Baltimore Waterfront

- **Property ID:** `c09b9eb6-c659-4827-b1f3-64b891551c75`
- **Projects (1):** `25-1634-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1634-D | **UNKNOWN** | deal: 25-1634-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Marriott Baltimore Waterfront - Concierge Lounge

- **Property ID:** `1152fa4a-295e-471a-b55d-4a570a68bc9d`
- **Projects (1):** `25-1759-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1759-D | **UNKNOWN** | deal: 25-1759-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Marriott Courtyard South Boston

- **Property ID:** `67c17798-e0eb-4f7f-b802-c07aa2c32efc`
- **Projects (1):** `25-2030-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-2030-D | **UNKNOWN** | deal: 25-2030-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Marriott Tribute Rouge - Dallas Model Room

- **Property ID:** `0688b83b-ad61-4980-a8f9-23be6b057896`
- **Projects (1):** `25-1994-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1994-D | **UNKNOWN** | deal: 25-1994-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Marriott's Grand Chateau Las Vegas

- **Property ID:** `967d7b07-843e-58f8-b64b-1e292f2d31a2`
- **Projects (1):** `25-1916-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 25-1916-D | **CWB_INGEST** | deal: 25-1916-D |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Mgm Cosmopolitan

- **Property ID:** `192c70ab-b015-46e6-80a0-208d7c7dfc52`
- **Projects (1):** `25-1537`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-1537 | **UNKNOWN** | deal: 25-1537 |

#### MONATCH

- **Property ID:** `a6eaf22f-58af-4d35-a028-07423bcdccef`
- **Projects (1):** `25-1993-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-1993-D | **UNKNOWN** | deal: 25-1993-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### ōLiv Madison

- **Property ID:** `ce4c4afd-6ff6-40f6-a03a-294df74e673c`
- **Projects (1):** `25-1667-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **CORESPACES+FIRECRAWL** | corespaces_prismic |
| Project identity | project_registry 25-1667-D | **UNKNOWN** | deal: 25-1667-D |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### oLiv State College Hetzel

- **Property ID:** `657eb9c0-4a4f-4752-abc7-9106cda48b80`
- **Projects (1):** `25-1563-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25-1563-D | **UNKNOWN** | deal: 25-1563-D |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Omni Amelia Island, FL

- **Property ID:** `c5823376-0426-4d49-a635-5fc428fbbce0`
- **Projects (1):** `25-1083-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25-1083-D | **CWB_INGEST** | deal: 25-1083-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Onera Fredericksburg

- **Property ID:** `31949edc-7008-4619-8d44-06a1dce4add3`
- **Projects (1):** `25-1153`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1153 | **UNKNOWN** | deal: 25-1153 |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Orleans Hotel Casino Las Vegas

- **Property ID:** `334af14b-d13f-542a-85ce-f0d6a2280519`
- **Projects (2):** `25-1927-D`, `25-1991-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 25-1927-D | **SAGE-PACE** | deal: 25-1927-D |
| Project identity | project_registry 25-1991-D | **UNKNOWN** | deal: 25-1991-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Ourpost San Marcos

- **Property ID:** `50806ed7-07a8-4b07-a4c5-ff173f1f6ef5`
- **Projects (1):** `25-1992-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_student |
| Project identity | project_registry 25-1992-D | **UNKNOWN** | deal: 25-1992-D |

#### Paloma Kent

- **Property ID:** `f2fe82e3-ac92-44f0-8258-6026e039cf5b`
- **Projects (1):** `25-2074-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_student |
| Project identity | project_registry 25-2074-D | **UNKNOWN** | deal: 25-2074-D |

#### Prince Michael Hotel

- **Property ID:** `048b27c3-cf9b-401c-80b3-dd46577c310a`
- **Projects (1):** `25-1578-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-1578-D | **UNKNOWN** | deal: 25-1578-D |

#### Quad at York

- **Property ID:** `fa40da5e-26ba-42be-be0c-19859adb70e7`
- **Projects (1):** `25-1776-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_student |
| Project identity | project_registry 25-1776-D | **UNKNOWN** | deal: 25-1776-D |

#### R-W Purchasing Partners HH San Diego

- **Property ID:** `1124b78f-1a8c-4b20-8529-4fbde6ee9023`
- **Projects (1):** `25-1859-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1859-D | **UNKNOWN** | deal: 25-1859-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Renaissance Boston

- **Property ID:** `eab8f3e6-744b-4bc5-a751-14377a40a5b6`
- **Projects (2):** `25-1870-D`, `25-1951-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25-1870-D | **UNKNOWN** | deal: 25-1870-D |
| Project identity | project_registry 25-1951-D | **UNKNOWN** | deal: 25-1951-D |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Sheraton Anchorage Hotel & Spa

- **Property ID:** `7e2e3a20-504f-4c9d-b684-d985adfced75`
- **Projects (1):** `25-1018-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1018-D | **UNKNOWN** | deal: 25-1018-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### Springhill - Townplace Suites - Springs, CO - Model Room

- **Property ID:** `42069376-3621-447b-b3dc-166bde3836dc`
- **Projects (1):** `25-1129-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1129-D | **SAGE-PACE** | deal: 25-1129-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Springhill Suites Appleton Wi

- **Property ID:** `6ce96e94-aa34-4c63-b1c9-e05a4bfd576f`
- **Projects (1):** `25-2069-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-2069-D | **UNKNOWN** | deal: 25-2069-D |

#### Summit Hotels

- **Property ID:** `ddd25422-2f73-46a1-85f1-27c6bc94eb02`
- **Projects (1):** `25-1829-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-1829-D | **UNKNOWN** | deal: 25-1829-D |

#### THE 87TH AT NOTRE DAME

- **Property ID:** `a08ce3fb-6b7b-400c-a34b-558464bed4cc`
- **Projects (2):** `25-1718-D`, `25-1850-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-1718-D | **UNKNOWN** | deal: 25-1718-D |
| Project identity | project_registry 25-1850-D | **UNKNOWN** | deal: 25-1850-D |
| Unit types | 13 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 334 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Collective Clemson

- **Property ID:** `ebf09677-c2cd-4329-8140-332fee99d040`
- **Projects (1):** `25-1978-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-1978-D | **UNKNOWN** | deal: 25-1978-D |
| Unit types | 38 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 72 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Edge Student Quarters - Lubbock

- **Property ID:** `2a14e97d-31b1-4ffa-bc53-fa16dab21141`
- **Projects (1):** `25-1164-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_student |
| Project identity | project_registry 25-1164-D | **TLCIQ_PRODUC** | deal: 25-1164-D |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### The Grove Hotel

- **Property ID:** `f3acc403-7ae8-4335-87ec-ec19c0806600`
- **Projects (1):** `25-1715-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 25-1715-D | **UNKNOWN** | deal: 25-1715-D |

#### The Pier Clemson

- **Property ID:** `7b02c638-c517-4380-9319-50fe1ab9de65`
- **Projects (1):** `25-1665-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25-1665-D | **UNKNOWN** | deal: 25-1665-D |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Westin Galleria Dallas - Production Vanities

- **Property ID:** `a899f924-499a-4887-9434-643d8662b5ba`
- **Projects (1):** `25-1051-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1051-D | **UNKNOWN** | deal: 25-1051-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Westin Galleria Dallas - Public Area Members Lounge

- **Property ID:** `21324031-5973-47f1-bdc4-c74c8b3a1cc5`
- **Projects (1):** `25-1052-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1052-D | **UNKNOWN** | deal: 25-1052-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Westin Galleria Dallas Case Goods - Re-Quoted

- **Property ID:** `c51000cb-3490-4ac5-8155-17150120f678`
- **Projects (1):** `25-1057-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25-1057-D | **SAGE-PACE** | deal: 25-1057-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Tribute San Rafael

- **Property ID:** `aedc76c1-1b2e-4e0f-8b5c-387ec1350ee3`
- **Projects (1):** `25-1014`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-1014 | **UNKNOWN** | deal: 25-1014 |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Uncommon Auburn

- **Property ID:** `3663127e-b8a9-4b65-862b-b5325ea4af6b`
- **Projects (1):** `25-1162-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_student |
| Project identity | project_registry 25-1162-D | **UNKNOWN** | deal: 25-1162-D |

#### UNIVERSITY GROVE

- **Property ID:** `0b3480ea-9975-4c83-9354-30e82b49039b`
- **Projects (1):** `25-1099-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-1099-D | **TLCIQ_PRODUC** | deal: 25-1099-D |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 2 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 126 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

### TLCH · 2026

#### Bantr Grand Hotel

- **Property ID:** `0df34790-47b9-4fc2-bad4-271ee4706a67`
- **Projects (1):** `26-1787-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | cwb_ingest |
| Project identity | project_registry 26-1787-D | **CWB_INGEST** | deal: 26-1787-D |

#### Charlotte South End Hotel

- **Property ID:** `a201804d-6ade-4761-b299-c29db7dc976b`
- **Projects (1):** `26-1609-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1609-D | **DALE-IS** | DALE sheet: Current_26-1609-D King Model Room Charlotte South End Hotel 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Courtyard Beckley WV

- **Property ID:** `67e56255-5184-4440-82bd-aace6d0bc3e7`
- **Projects (1):** `26-1014-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 26-1014-D | **UNKNOWN** | deal: 26-1014-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Charlotte Lake Norman Nc

- **Property ID:** `19cfa0d4-a218-4eb2-bfcb-10e8539c63df`
- **Projects (1):** `26-1578-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1578-D | **DALE-IS** | DALE sheet: Current_26-1678-D Courtyard Charlotte Lake Norman NC CWB less factory tariff W FRT 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Courtyard Coatesville, Pa

- **Property ID:** `00eb010f-ada3-4b2f-912f-132078a5997b`
- **Projects (1):** `26-1817-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1817-D | **DALE-IS** | DALE sheet: Current_26-1817-D Courtyard Coatesville PA CWB REVISED dims 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Courtyard Gretna, La

- **Property ID:** `95932fc4-954e-4eab-8307-7505d3a6c2e2`
- **Projects (1):** `26-1067-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1067-D | **UNKNOWN** | deal: 26-1067-D |

#### Courtyard Jacksonville, Nc

- **Property ID:** `91387433-2d31-49c5-9873-df02b5af031b`
- **Projects (1):** `26-1084-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1084-D | **UNKNOWN** | deal: 26-1084-D |

#### Courtyard Monroe Airport La

- **Property ID:** `a760f9bb-1b03-44a6-9fad-c3dd0dd60dbe`
- **Projects (1):** `26-1052-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1052-D | **UNKNOWN** | deal: 26-1052-D |

#### Courtyard Niagara Falls, Ny

- **Property ID:** `19579f03-aa5b-4b7a-a857-8ebf5c6aee8f`
- **Projects (1):** `26-1088-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1088-D | **DALE-IS** | DALE sheet: Current_Courtyard Niagara Falls NY CWB  w cost 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Courtyard Norcross, Ga

- **Property ID:** `eb5e6f92-f697-40e3-9ae8-bd85935d187c`
- **Projects (1):** `26-1875-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1875-D | **SAGE-PACE** | COURTYARD NORCROSS, GA |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### COURTYARD Orlando Lake Mary, FL

- **Property ID:** `f618d1b1-a095-4a55-b335-39d156233aae`
- **Projects (1):** `26-1087-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-1087-D | **UNKNOWN** | deal: 26-1087-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Courtyard Stuart, Fl

- **Property ID:** `9a429d38-6550-414c-9176-df01135c6411`
- **Projects (1):** `26-1777-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1777-D | **DALE-IS** | DALE sheet: Current_26-1777-D Courtyard Stuart FL CHANGES CWB PO W Revised Freight  06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Courtyard Thousand Oaks

- **Property ID:** `7213a038-3a88-4c02-bf54-3fb7b9876615`
- **Projects (1):** `26-1020-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-1020-D | **UNKNOWN** | deal: 26-1020-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Crowne Plaza - Arlington, TX

- **Property ID:** `dc810100-a0e3-4f39-be7f-44f8f3cdda2a`
- **Projects (1):** `26-1008-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-1008-D | **UNKNOWN** | deal: 26-1008-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Disney Old Key West

- **Property ID:** `dac926ba-e615-4f42-a607-dbbbd7572850`
- **Projects (1):** `26-1048-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1048-D | **UNKNOWN** | deal: 26-1048-D |

#### Disney Sparrow

- **Property ID:** `d1b806e0-cca2-459d-9c64-8deadd5fc799`
- **Projects (2):** `26-1002-D`, `26-1001-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | cwb_ingest |
| Project identity | project_registry 26-1002-D | **UNKNOWN** | Disney Sparrow Villas |
| Project identity | project_registry 26-1001-D | **CWB_INGEST** | deal: 26-1001-D |

#### Doubletree At The Entrance To Universal Studios

- **Property ID:** `58c01d95-a96b-4149-adde-c72d4f68648e`
- **Projects (1):** `26-1840-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1840-D | **DALE-IS** | DALE sheet: Current_26-1840-D  Model Room CWB DoubleTree Orlando 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Hard Rock Hotel Athens Greece

- **Property ID:** `0d347348-a2c2-5b33-a85f-9286f4bbc977`
- **Projects (1):** `26-1865-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 26-1865-D | **SAGE-PACE** | HARD ROCK HOTEL ATHENS |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Hard Rock Hotel San Juan PR

- **Property ID:** `83e4829c-7da1-52a6-a3a6-bb14ebc6a17a`
- **Projects (1):** `26-1070-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 26-1070-D | **DALE-IS** | DALE sheet: Current_(26-1070-D) Hard Rock Hotel - San Juan - Model Room CWB 06 01 2026.xlsx |
| Unit types | 2 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### Hilton Anatole

- **Property ID:** `09ed4011-1ea2-4f4a-873a-beecb8243979`
- **Projects (4):** `26-1023-D`, `26-1053-D`, `26-1532-D`, `26-1022-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **TLCH_MANUAL** | tlch_manual |
| Project identity | project_registry 26-1023-D | **UNKNOWN** | deal: 26-1023-D |
| Project identity | project_registry 26-1053-D | **SAGE-PACE** | deal: 26-1053-D |
| Project identity | project_registry 26-1532-D | **SAGE-PACE** | deal: 26-1532-D |
| Project identity | project_registry 26-1022-D | **UNKNOWN** | deal: 26-1022-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 2 project(s) |
| Stakeholders / contacts | 10 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### Hyatt Centric Wynwood, Fl

- **Property ID:** `bfa9a430-bf69-4a76-88b0-2ca034129693`
- **Projects (1):** `26-1639-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1639-D | **DALE-IS** | DALE sheet: Current_26-1639-D QQ MODEL ROOM Hyatt Centric Wynwood, FL 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Hyatt Driskill Hotel - Austin, TX - Tower Rooms

- **Property ID:** `62b9c371-bd2c-443c-879b-e362adad8ff2`
- **Projects (1):** `26-1901-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-1901-D | **SAGE-PACE** | DRISKILL HOTEL |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hyatt House Blemont

- **Property ID:** `e57d2f90-4212-4d4b-9a1d-7d6589d19e9f`
- **Projects (1):** `26-1054-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1054-D | **UNKNOWN** | deal: 26-1054-D |

#### Hyatt House Branchburg, Nj

- **Property ID:** `1bfc862e-7e60-4a6e-8437-df0a1f373fcf`
- **Projects (1):** `26-1861-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1861-D | **DALE-IS** | DALE sheet: Current_26-1861-D-PO-17925-Hyatt House-Branchburg, NJ 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Hyatt House Morrisville Raleigh Nc

- **Property ID:** `3a3780ae-51a8-413c-b538-9f8cb4221feb`
- **Projects (1):** `26-1862-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1862-D | **SAGE-PACE** | HYATT HOUSE-MORRISVILLE RALEIGH NC |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Hyatt House Sterling Dulles, Va

- **Property ID:** `3a405056-340f-4c27-a81f-37e103c889a7`
- **Projects (1):** `26-1857-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1857-D | **DALE-IS** | DALE sheet: Current_26-1857-D-PO-17927-Hyatt House-Sterling Dulles, VA 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Hyatt Regency Houston

- **Property ID:** `ebba2fc8-65a7-46c1-86c9-b7d0df04d927`
- **Projects (1):** `26-TLCH-56cd0a`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **FIRECRAWL** | rita_upload_quick_create |
| Project identity | project_registry 26-TLCH-56cd0a | **UNKNOWN** | Hyatt Regency Houston |

#### Hyatt Select Flowood MS

- **Property ID:** `e2c90f01-c9a5-5bc6-a53a-132273c61a1c`
- **Projects (1):** `26-1895-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 26-1895-D | **SAGE-PACE** | Hyatt Select - Flowood MS |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Hyatt Select Opryland Nashville TN

- **Property ID:** `d2ddc45d-3a2d-5b8f-bd78-0c38e0265523`
- **Projects (1):** `26-1897-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 26-1897-D | **UNKNOWN** | Hyatt Select Nashville, TN - Additional Hooks |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### JW Marriott Tucson Starr Pass

- **Property ID:** `5e396216-7a28-57e1-a827-434376bf3a5b`
- **Projects (3):** `26-1899-D`, `26-1848-D`, `26-1814-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 26-1899-D | **SAGE-PACE** | JW MARRIOTT TUCSON STARR PASS - PUBLIC SPACE LOBBY |
| Project identity | project_registry 26-1848-D | **DALE-IS** | DALE sheet: Current_(26-1848-D) JW Marriott Tucson Starr Pass - Public Space Market 06 01 2026.xlsx |
| Project identity | project_registry 26-1814-D | **DALE-IS** | DALE sheet: Current_(26-1814-D) JW Marriott Tucson Starr Pass - Public Space Add On 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 3 project(s) |
| Stakeholders / contacts | 5 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Marriott

- **Property ID:** `fe5ea12a-7003-4633-a8cf-1e72b97b49a5`
- **Projects (1):** `26-1853-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 26-1853-D | **DALE-IS** | DALE sheet: Current_26-1853-D AC Hotel Overland, KS - Casegoods 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Marriott's Grand Chateau Las Vegas

- **Property ID:** `967d7b07-843e-58f8-b64b-1e292f2d31a2`
- **Projects (1):** `26-1092-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 26-1092-D | **UNKNOWN** | deal: 26-1092-D |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### MGM Borgata Atlantic City

- **Property ID:** `432c6b53-713b-534a-8a6d-a62f266ea131`
- **Projects (2):** `26-1044-D`, `26-1043-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 26-1044-D | **UNKNOWN** | deal: 26-1044-D |
| Project identity | project_registry 26-1043-D | **CWB_INGEST** | deal: 26-1043-D |

#### Ocean Reef Club Inn Key Largo

- **Property ID:** `c008a5cf-9d70-539b-93cc-5ca8b3298f5d`
- **Projects (1):** `26-1105-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 26-1105-D | **DALE-IS** | DALE sheet: Current_(26-1105-D) - Ocean Reef Club Inn - CWB 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Omni Mt. Washington

- **Property ID:** `8cd3581e-b6ff-40fb-b51f-d65a76e36ebe`
- **Projects (1):** `26-1784-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1784-D | **DALE-IS** | DALE sheet: Current_26-1784-D_OMNI Mt Washington Staff Housing_CWB 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Orleans Hotel Casino Las Vegas

- **Property ID:** `334af14b-d13f-542a-85ce-f0d6a2280519`
- **Projects (4):** `26-1006-D`, `26-1004-D`, `26-1009-D`, `26-1005-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 26-1006-D | **UNKNOWN** | deal: 26-1006-D |
| Project identity | project_registry 26-1004-D | **UNKNOWN** | deal: 26-1004-D |
| Project identity | project_registry 26-1009-D | **UNKNOWN** | deal: 26-1009-D |
| Project identity | project_registry 26-1005-D | **UNKNOWN** | deal: 26-1005-D |

#### Tcolv

- **Property ID:** `f4e25b99-55c7-4416-8257-4f5787689817`
- **Projects (1):** `26-1351-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_TLC** | netsuite_tlch_consolidation |
| Project identity | project_registry 26-1351-D | **DALE-IS** | DALE sheet: Current_26-1351-D - MGM Cosmopolitan Suites - Day 2 Refresh Items - CWB 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

#### Tribute San Rafael

- **Property ID:** `aedc76c1-1b2e-4e0f-8b5c-387ec1350ee3`
- **Projects (2):** `26-1765-D`, `26-1638-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-1765-D | **DALE-IS** | DALE sheet: Current_(26-1765-D) - TRIBUTE - SAN RAFAEL CA PUBLIC SPACE ADDITIONS 2 - CWB 06 01 2026.xlsx |
| Project identity | project_registry 26-1638-D | **DALE-IS** | DALE sheet: Current_(26-1638-D) TRIBUTE - SAN RAFAEL CA PUBLIC SPACE ADD ON - CWB 06 01 2026.xlsx |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 2 project(s) |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### VERVE TEMPE

- **Property ID:** `f241f8dc-96de-4dc3-a09c-823c4eeb848c`
- **Projects (1):** `26-1210-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 26-1210-D | **UNKNOWN** | deal: 26-1210-D |
| Unit types | 75 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 240 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 6 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

### TLCH · 2027

#### Westgate Branson Lakes

- **Property ID:** `d45ff84d-bb71-5869-a11d-912a312ffd1c`
- **Projects (1):** `27-1001-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 27-1001-D | **SAGE-PACE** | WESTGATE BRANSON LAKES |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |

### UF · 2025

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-211-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-211-I | **UNKNOWN** | deal: 25-211-I |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-5085`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-5085 | **TLCIQ_PRODUC** | I-TAL-SS-TOWER 2 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-5088`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-5088 | **TLCIQ_PRODUC** | I-TAL-SS-TOWER 5 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-5087`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-5087 | **TLCIQ_PRODUC** | I-TAL-SS-TOWER 4 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-5086`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-5086 | **TLCIQ_PRODUC** | I-TAL-SS-TOWER 3 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-198-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-198-I | **UNKNOWN** | deal: 25-198-I |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-5089`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-5089 | **TLCIQ_PRODUC** | I-TAL-SS-TOWER 6 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-508`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-508 | **TLCIQ_PRODUC** | 4-I-TAL-SS-TOWER 1 |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-5084`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-5084 | **TLCIQ_PRODUC** | I-TAL-SS-TOWER 1 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-2025`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-2025 | **UNKNOWN** | deal: 25-2025 |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-1910-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-1910-D | **UNKNOWN** | deal: 25-1910-D |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-210-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-210-I | **UNKNOWN** | deal: 25-210-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `25-234-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 25-234-I | **UNKNOWN** | deal: 25-234-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### 101 Center

- **Property ID:** `0c4273d4-c1dd-44b8-8785-1ad3825873a3`
- **Projects (1):** `25-150`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-150 | **TLCIQ_PRODUC** | 101 Center |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 48 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 263 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 66 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 114 EARLE

- **Property ID:** `ccd966b5-e666-4c07-bec5-18ad5f0665b2`
- **Projects (1):** `25-050`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-050 | **TLCIQ_PRODUC** | 114 EARLE |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 152 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 153 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 50 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 1540 PLACE

- **Property ID:** `180e28e2-94f1-458b-aef7-41f7953718ed`
- **Projects (1):** `25-144`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-144 | **TLCIQ_PRODUC** | 1540 Place |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 304 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 309 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 91 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 21 Pearl - Austin, TX

- **Property ID:** `8ffa74aa-6773-40c2-806b-6d075dc72f38`
- **Projects (1):** `25-154-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-154-I | **TLCIQ_PRODUC** | deal: 25-154-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 2125 Franklin

- **Property ID:** `3ed2dafc-615a-4fd6-8643-ab1d54282c1a`
- **Projects (1):** `25-191-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 25-191-I | **TLCIQ_PRODUC** | deal: 25-191-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 8 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 191 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### 2480 BANCROFT

- **Property ID:** `69478e77-9907-4bc4-acfb-374a5edff693`
- **Projects (2):** `25-017`, `25-017-BERKLEY`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-017 | **TLCIQ_PRODUC** | 2480 BANCROFT |
| Project identity | project_registry 25-017-BERKLEY | **UNKNOWN** | deal: 25-017-BERKLEY |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 13 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 27 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 212 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 2909 OLIVER

- **Property ID:** `9883a9b5-bbbd-4aec-a04a-adc7e197136f`
- **Projects (1):** `25-1363`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-1363 | **TLCIQ_PRODUC** | 2909 Oliver |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 275 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 395 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 96 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 3030 TELEGRAPH

- **Property ID:** `485e10c0-818f-47ee-b659-1e0316d4398f`
- **Projects (1):** `25-230-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-230-I | **UNKNOWN** | deal: 25-230-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 8 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### 5 TWENTY FOUR ANGLIANA

- **Property ID:** `6b69b712-fef0-4938-aa03-d60988583f69`
- **Projects (1):** `25-185`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-185 | **TLCIQ_PRODUC** | 524 ANGLIANA |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 11 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 229 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 132 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 525 Angliana

- **Property ID:** `d5fdc434-2d6b-4665-9e60-186aa7f5131e`
- **Projects (1):** `25-186-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-186-I | **TLCIQ_PRODUC** | deal: 25-186-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### AGGIE SQUARE

- **Property ID:** `cbf1c7f5-8f7e-4d6f-90db-c4bd15443767`
- **Projects (1):** `25-023-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-023-I | **TLCIQ_PRODUC** | deal: 25-023-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Altitude At Baton Rouge

- **Property ID:** `2cee0845-b7ef-4137-b149-74b32ee5efc4`
- **Projects (1):** `25-196`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-196 | **TLCIQ_PRODUC** | Altitude at Baton Rouge |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 132 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 133 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 70 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |

#### ALTITUDE AT UNIVERSITY HOUSTON

- **Property ID:** `f7244e6d-0286-4e95-aa33-d4c1796ff213`
- **Projects (1):** `25-1552`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-1552 | **TLCIQ_PRODUC** | Altitude at University Houston |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 176 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 177 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 294 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### API-SAXBYS-DREXEL UNIVERSITY

- **Property ID:** `4eb3e06e-97a3-403b-ad49-ab1acae1c49c`
- **Projects (2):** `25-201`, `25-200`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-201 | **TLCIQ_PRODUC** | API 3410 - Drexel Univ |
| Project identity | project_registry 25-200 | **TLCIQ_PRODUC** | API - Drexel Univ. |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 8 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 8 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 76 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### ARTISTRY

- **Property ID:** `4eb3fe96-3510-4c7b-919d-1c5753ed7cad`
- **Projects (1):** `25-173-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-173-I | **TLCIQ_PRODUC** | deal: 25-173-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### ASU HERBERGER - ACC

- **Property ID:** `0d68b102-97e1-4a4e-b1b6-a02ca429fdfe`
- **Projects (1):** `25-037-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 25-037-I | **TLCIQ_PRODUC** | deal: 25-037-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### Athens Ridge

- **Property ID:** `e33ba719-0981-4cfa-971e-8179e00b0e88`
- **Projects (1):** `25-057-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-057-I | **SAGE-PACE** | deal: 25-057-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### AVERY FRESNO

- **Property ID:** `b7b5ae05-5623-420a-a853-8ee91ea55bcd`
- **Projects (1):** `25-044`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-044 | **TLCIQ_PRODUC** | Avery Fresno |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 212 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 245 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 85 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### AXIS WEST CAMPUS

- **Property ID:** `f5aa6309-1f5c-4a75-9efd-2a02125f9cba`
- **Projects (1):** `25-121`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-121 | **TLCIQ_PRODUC** | Axis West Campus |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 212 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 211 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 125 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### BALLPARK NORTH

- **Property ID:** `e83aa602-9ad5-41c7-9319-dcc8137840f5`
- **Projects (1):** `25-136`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-136 | **TLCIQ_PRODUC** | Ballpark North |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 568 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 597 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 106 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### BRIDGES @ 11TH

- **Property ID:** `8e02c45b-d037-4f4b-92f5-72d1ff29468a`
- **Projects (1):** `25-184`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-184 | **TLCIQ_PRODUC** | Bridges @ 11th |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 25 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 33 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 150 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Cabana Beach

- **Property ID:** `895b87cd-cc7e-4191-823c-79b5b463cad7`
- **Projects (1):** `25-231-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25-231-I | **SAGE-PACE** | deal: 25-231-I |
| Unit types | 145 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 236 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### CAMBRIDGE CREEK COURT

- **Property ID:** `e83ba57b-aa95-4531-bb0c-b5582cc522f3`
- **Projects (2):** `25-161`, `25-1606`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-161 | **TLCIQ_PRODUC** | The Hue |
| Project identity | project_registry 25-1606 | **TLCIQ_PRODUC** | Cambridge Creek Court |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 126 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 133 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 146 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Campus Crossing at Abbey West

- **Property ID:** `d4e2907f-de2e-4632-8edc-23513ee24a7d`
- **Projects (1):** `25-047`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-047 | **TLCIQ_PRODUC** | Campus Crossing at Abbey West |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 117 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 136 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 103 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### CAMPUS CROSSING AT COLLEGE ROW

- **Property ID:** `8a379b18-7924-4a71-b1b6-16ba213d251e`
- **Projects (1):** `25-175`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-175 | **TLCIQ_PRODUC** | CAMPUS CROSSING AT COLEGE ROW |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 109 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 109 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 104 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Campus Crossing at Rams Pointe

- **Property ID:** `fb622352-6273-4589-a9b3-efde0f1f5c5c`
- **Projects (1):** `25-076`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-076 | **TLCIQ_PRODUC** | Campus Crossing at Rams Pointe |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 115 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 116 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 103 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### CAMPUS CROSSING AT STAR PASS

- **Property ID:** `0bcd84de-7782-4989-a6f6-ad210d190faa`
- **Projects (1):** `25-075`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-075 | **TLCIQ_PRODUC** | Campus Crossing at Star Pass |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 129 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 130 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 210 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### CAMPUS CROSSING AT UNIVERSITY HEIGHTS

- **Property ID:** `8a849a60-4fcf-4cee-b94f-52db3c8ab69a`
- **Projects (2):** `25-074`, `25-164-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-074 | **TLCIQ_PRODUC** | Campus Crossing at University Heights |
| Project identity | project_registry 25-164-I | **SAGE-PACE** | deal: 25-164-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 54 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 55 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 24 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### CAMPUS CROSSING ON 8th STREET

- **Property ID:** `6e438d84-2f59-475e-8237-718d3e58bf98`
- **Projects (1):** `25-073`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-073 | **TLCIQ_PRODUC** | Campus Crossings on 8th Street |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 138 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 177 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 41 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### CAMPUS CROSSING ON ALAFAYA

- **Property ID:** `c4d496b0-469e-4c38-8b91-75c2e927e7bc`
- **Projects (1):** `25-070`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-070 | **TLCIQ_PRODUC** | Campus Crossing on Alafaya |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 150 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 220 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 121 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### CAMPUSWALK-CONWAY

- **Property ID:** `b1a3d8e7-d48b-4725-9e05-74536baaee20`
- **Projects (1):** `25-100`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-100 | **TLCIQ_PRODUC** | Campus Walk - Conway |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 51 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 51 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 72 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### CITYSPACE 2555

- **Property ID:** `7da9eaea-59c8-493a-b0b2-bf5f89b570bc`
- **Projects (1):** `25-038`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-038 | **TLCIQ_PRODUC** | CITYSPACE 2555 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 5 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 12 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 20 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Clemson 2

- **Property ID:** `0c813719-3afc-43d3-852c-ee6a2f31132c`
- **Projects (1):** `25-126-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-126-I | **UNKNOWN** | deal: 25-126-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### COBALT ROW

- **Property ID:** `0e64e69a-0121-44d0-b03e-67eb5f050339`
- **Projects (1):** `25-129`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-129 | **TLCIQ_PRODUC** | Cobalt Row |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 148 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 149 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 208 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### COLLECTIVE AT NORMAN

- **Property ID:** `59cc6acc-43e5-42a0-ab7b-2cc89741376d`
- **Projects (1):** `25-054`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-054 | **TLCIQ_PRODUC** | The Collective at Norman |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 239 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 241 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 188 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### College Station - Florida

- **Property ID:** `7593ba7a-d045-4cd1-9fda-03c3f8bcb2c5`
- **Projects (1):** `25-056`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-056 | **TLCIQ_PRODUC** | College Station - Florida |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 47 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 47 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 123 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Crossing Place Apartments

- **Property ID:** `553208b1-605d-406f-ade5-c4112c0e3a7a`
- **Projects (1):** `25-149`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-149 | **TLCIQ_PRODUC** | Crossing Place Apts |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 55 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 55 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 29 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Crossroads Village - Fresno, CA

- **Property ID:** `03025f5a-63f3-4882-afbd-fe7b3c105be9`
- **Projects (1):** `25-018`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-018 | **TLCIQ_PRODUC** | Crossroads Village |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 32 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 144 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 338 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### CULLEN OAKS

- **Property ID:** `d217421a-ce3c-45b6-bf34-fe42ee3ef396`
- **Projects (1):** `25-212`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-212 | **TLCIQ_PRODUC** | Cullen Oaks |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 129 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 153 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 130 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### ELARA AT THE SAWMILL

- **Property ID:** `fddddc8b-b116-405c-8fe0-cf82c503aafd`
- **Projects (1):** `25-133`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+CORESPACES+FIRECRAWL** | install_schedules |
| Project identity | project_registry 25-133 | **TLCIQ_PRODUC** | Elara at Saw Mill |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 155 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 469 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 51 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### EVER KNOXVILLE

- **Property ID:** `9cf29913-9c8f-4500-a051-c755ec14cb50`
- **Projects (1):** `25-064-KNOX`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 25-064-KNOX | **UNKNOWN** | deal: 25-064-KNOX |
| Unit types | 25 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### FLATS AT CARRS HILL

- **Property ID:** `d61f8ac5-562f-45b9-90ec-63b7f6bfb136`
- **Projects (1):** `25-114`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-114 | **TLCIQ_PRODUC** | Flats at Carrs Hill |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 196 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 196 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 139 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### FLATS AT NORMAN

- **Property ID:** `2072f239-a112-469d-b617-d4b0c47c574d`
- **Projects (1):** `25-030`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-030 | **TLCIQ_PRODUC** | FLATS AT NORMAN |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 30 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 30 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 60 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### GATEWAY AT HUNTSVILLE

- **Property ID:** `54462d72-b81f-46e3-b8d3-d979dabb08c2`
- **Projects (1):** `25-078`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-078 | **TLCIQ_PRODUC** | Gateway at Huntsville |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 328 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 333 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 40 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### GATEWAY AT TEMPE

- **Property ID:** `a8e99cc2-f646-4c87-9700-40aee5d3fa82`
- **Projects (1):** `25-104-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-104-I | **SAGE-PACE** | deal: 25-104-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 88 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 200 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Georgetown - Athlete Units

- **Property ID:** `2252728e-8bda-4ccf-9766-0b435b9347f8`
- **Projects (1):** `25-035-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-035-I | **UNKNOWN** | deal: 25-035-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Georgetown Henle Washington DC

- **Property ID:** `3b664bf8-95ca-403c-9d23-254df691734c`
- **Projects (1):** `25-034-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-034-I | **TLCIQ_PRODUC** | deal: 25-034-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Georgetown Little Henle Washington DC

- **Property ID:** `b6c2f9ea-f4bc-4ed8-8e0e-8e4fb6501f54`
- **Projects (1):** `25-036`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 25-036 | **TLCIQ_PRODUC** | Georgetown Little Henle |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 1 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 8 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 8 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### GRANVILLE TOWERS

- **Property ID:** `96c3b15c-4caf-46a7-8be4-52f42369e459`
- **Projects (1):** `25-137`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-137 | **TLCIQ_PRODUC** | Granville Towers |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 14 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 121 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 8 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Greene Crossing

- **Property ID:** `c9f2b0c5-6bb8-438a-b90d-2a6f445862fe`
- **Projects (1):** `25-084`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-084 | **TLCIQ_PRODUC** | Greene Crossing |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 37 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 37 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 48 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### HART SQUARE FIFTH LLC.

- **Property ID:** `efc3954f-0d6b-46e2-8672-2bed61a1654f`
- **Projects (1):** `25-122`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-122 | **TLCIQ_PRODUC** | Square on 5th |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 134 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 134 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 18 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### HILLCREST

- **Property ID:** `de1f6abf-89b5-4138-bdff-e2e6ce1718d0`
- **Projects (1):** `25-202`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-202 | **TLCIQ_PRODUC** | HILLCREST |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 10 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 10 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 75 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### HOLLEMAN CROSSING

- **Property ID:** `8a3db563-967b-4ec2-81a3-61cb63c0b064`
- **Projects (1):** `25-107`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-107 | **TLCIQ_PRODUC** | Holleman Crossing |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 58 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 58 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 183 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### HOT SPRINGS PHASE 2-SERVITAS

- **Property ID:** `ad279783-e0e7-46a8-a82f-7821cdb9d056`
- **Projects (1):** `25-028-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-028-I | **TLCIQ_PRODUC** | deal: 25-028-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### HUB ATHENS

- **Property ID:** `84143a56-5316-4937-8315-000bb556fdcf`
- **Projects (1):** `25-006-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+LAYOUT-IQ** | install_schedules |
| Project identity | project_registry 25-006-I | **SAGE-PACE** | deal: 25-006-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 4 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 12 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### HUB FULLERTON

- **Property ID:** `c112acca-02a7-44d6-874f-1592127d24b7`
- **Projects (1):** `25-008-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-008-I | **TLCIQ_PRODUC** | deal: 25-008-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 7 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hub Knoxville III - Phase 2-Bldg 3

- **Property ID:** `173bcfe7-6599-49bb-9e85-a10818a61d0d`
- **Projects (1):** `25-025-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-025-I | **TLCIQ_PRODUC** | deal: 25-025-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hub on Campus Bloomington

- **Property ID:** `845827d4-a9a4-49b3-81f2-416c1c5d666a`
- **Projects (1):** `25-007-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **CORESPACES+FIRECRAWL** | corespaces_prismic |
| Project identity | project_registry 25-007-I | **TLCIQ_PRODUC** | deal: 25-007-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 16 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 6 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### Hub on Campus Knoxville 18th

- **Property ID:** `f43fb8a1-8ca3-48e1-a28b-50abc3f9a5fc`
- **Projects (1):** `25-005-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **CORESPACES+FIRECRAWL** | corespaces_prismic |
| Project identity | project_registry 25-005-I | **CORESPACES** | deal: 25-005-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### Hub on Campus Tallahassee

- **Property ID:** `c0492328-5fd4-4c36-a199-c028e6ca00c5`
- **Projects (1):** `25-071-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **CORESPACES+FIRECRAWL** | corespaces_prismic |
| Project identity | project_registry 25-071-I | **CORESPACES** | deal: 25-071-I |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### HUB on Campus Tucson

- **Property ID:** `32a0922d-1065-4e69-8e16-a6a03ef06a31`
- **Projects (1):** `25-009-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+CORESPACES+FIRECRAWL** | install_schedules |
| Project identity | project_registry 25-009-I | **TLCIQ_PRODUC** | deal: 25-009-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 5 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### ICONIC ON ALVARADO

- **Property ID:** `7d99d69f-6638-434f-a215-3f9d4f0f7c8d`
- **Projects (1):** `25-128`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-128 | **TLCIQ_PRODUC** | Iconic on Alvarado |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 204 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 204 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 89 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Identity Dinkytown

- **Property ID:** `d598fa1e-bc39-44cb-bb9a-9d9db38581f1`
- **Projects (1):** `25-092`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-092 | **TLCIQ_PRODUC** | Identity Dinkytown |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 1 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 1 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 13 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Jessie St Apartments - Santa Cruz

- **Property ID:** `06f22706-58f8-4494-b734-7698413aee20`
- **Projects (1):** `25-032`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25-032 | **TLCIQ_PRODUC** | JESSIE ST APARTMENTS |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 2 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 45 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 12 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### K14 Campus Flats

- **Property ID:** `b8d900e9-8b40-4bc7-ac88-16e83bfe0ae1`
- **Projects (1):** `25-190`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-190 | **TLCIQ_PRODUC** | K14 Campus Flats |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 5 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 5 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 49 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Knights Circle

- **Property ID:** `e6011e63-8015-4d69-af3b-94eb2776ce9a`
- **Projects (1):** `25-069-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-069-I | **TLCIQ_PRODUC** | deal: 25-069-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 1525 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 1998 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Lions Gate Apartments

- **Property ID:** `4d1fe6a5-bf7b-4b5b-8674-b50ee5aa6bbe`
- **Projects (1):** `25-111`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-111 | **TLCIQ_PRODUC** | Lions Gate Apts |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 3 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 11 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 15 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### LOCAL ON DELMAR LEASING SPACE

- **Property ID:** `8116fce7-8ce5-4990-b76f-971e66baa5b3`
- **Projects (1):** `25-178-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-178-I | **UNKNOWN** | deal: 25-178-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Logan Square Apts

- **Property ID:** `55f2f9b7-c699-4661-8d94-62c241331336`
- **Projects (1):** `25-067`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-067 | **TLCIQ_PRODUC** | Logan Square Apts |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 43 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 42 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 101 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### MERCED STATION

- **Property ID:** `ca1b6482-c040-4cdc-a2e1-2f25c8e1dfda`
- **Projects (1):** `25-151`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-151 | **TLCIQ_PRODUC** | Merced Station |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 46 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 46 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 317 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### MIAMI CITY BALLET

- **Property ID:** `85ae3e45-8968-4e58-a2e4-b26bf05b89be`
- **Projects (2):** `25-020`, `25-902`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-020 | **TLCIQ_PRODUC** | 25-174  MIAMI CITY BALLET - SERVITAS |
| Project identity | project_registry 25-902 | **TLCIQ_PRODUC** | SO6036 Miami City Ballet ladders |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 30 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 30 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 177 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### MIDTOWN 905

- **Property ID:** `15b31400-840a-4c1e-b1ad-bc53bbbe4526`
- **Projects (1):** `25-187-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-187-I | **TLCIQ_PRODUC** | deal: 25-187-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### MONATCH

- **Property ID:** `a6eaf22f-58af-4d35-a028-07423bcdccef`
- **Projects (2):** `25-2084`, `25-208`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-2084 | **TLCIQ_PRODUC** | 2085 Monarch |
| Project identity | project_registry 25-208 | **TLCIQ_PRODUC** | 4 - 2085 Monarch |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### NICHOLSON GATEWAY LSU

- **Property ID:** `4c957a91-63c7-41cc-93a0-5996534a52e6`
- **Projects (1):** `25-197`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-197 | **TLCIQ_PRODUC** | Nicholson Gateway |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 7 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 764 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 9 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Nordheim

- **Property ID:** `5fd919ef-2509-42e9-a73b-7447c2556ebd`
- **Projects (1):** `25-193-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-193-I | **TLCIQ_PRODUC** | deal: 25-193-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Nova Knoxville

- **Property ID:** `3f367739-fb20-43bf-93f0-03b63eba01e2`
- **Projects (1):** `25-049`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-049 | **TLCIQ_PRODUC** | NOVA KNOXVILLE |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 1 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 1 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 16 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### OAKS ON THE SQUARE

- **Property ID:** `1bb728dd-4c62-460e-8161-ccade85f25b3`
- **Projects (1):** `25-227`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-227 | **TLCIQ_PRODUC** | The Oaks on the Square |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 17 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 40 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 12 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Oaks on the Square - 2025

- **Property ID:** `c5bf6950-d803-4707-a06c-f825d59a9061`
- **Projects (1):** `25-055`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-055 | **TLCIQ_PRODUC** | Oaks on the Square |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 5 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 5 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 60 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### OCEAN MEADOW

- **Property ID:** `b24e74a6-ee71-4375-b921-c0a5865b4671`
- **Projects (2):** `25-013-I`, `25-229-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-013-I | **TLCIQ_PRODUC** | deal: 25-013-I |
| Project identity | project_registry 25-229-I | **TLCIQ_PRODUC** | deal: 25-229-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### OKTIV

- **Property ID:** `af3afdd5-6607-4293-931d-b6b81b44aa61`
- **Projects (1):** `25-131`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-131 | **TLCIQ_PRODUC** | Oktiv |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 81 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 81 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 135 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### OLD ROW

- **Property ID:** `79cc501b-103c-427e-9ed9-ced28e73ba5f`
- **Projects (1):** `25-207`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-207 | **UNKNOWN** | deal: 25-207 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### oLiv Auburn - Glenn

- **Property ID:** `037b8231-1713-4131-8f05-eb8077063dfa`
- **Projects (1):** `25-141-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-141-I | **UNKNOWN** | deal: 25-141-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### ONSHORE DAYTONA

- **Property ID:** `17061ef5-6d60-45a3-8c1d-172d8ba7be2b`
- **Projects (1):** `25-1104`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-1104 | **TLCIQ_PRODUC** | Onshore Daytona |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 64 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 65 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 153 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### OUTPOST-SAN MARCOS

- **Property ID:** `3dbcf7df-5103-4622-bb1c-2e4d181bd2d5`
- **Projects (1):** `25-123`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-123 | **TLCIQ_PRODUC** | Outpost San Marcos |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 326 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 331 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 47 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### PLAZA 2555

- **Property ID:** `898da2b0-8e68-429d-8d7d-05a9a688c3ef`
- **Projects (1):** `25-012-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-012-I | **TLCIQ_PRODUC** | deal: 25-012-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Pointe San Marcos

- **Property ID:** `0ac955cf-fc85-4ced-b78c-15188d7af07b`
- **Projects (1):** `25-127`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-127 | **TLCIQ_PRODUC** | Pointe San Marcos |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 26 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 107 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 13 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### PROVENANCE WEST LAFAYETTE

- **Property ID:** `163ffc71-ff3b-4ba6-8df6-a9bc5f54a113`
- **Projects (1):** `25-039-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+LAYOUT-IQ** | install_schedules |
| Project identity | project_registry 25-039-I | **TLCIQ_PRODUC** | deal: 25-039-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### RAMBLER ATLANTA

- **Property ID:** `6e0d4504-05c1-48cf-8c9f-c6a92d78a8f7`
- **Projects (1):** `25-010-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+LAYOUT-IQ+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 25-010-I | **TLCIQ_PRODUC** | deal: 25-010-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 5 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### RAMBLER COLUMBUS

- **Property ID:** `8826af39-4f4b-449e-a2c3-6546c641b4e7`
- **Projects (1):** `25-004-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+LAYOUT-IQ+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 25-004-I | **SAGE-PACE** | deal: 25-004-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 25 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 5 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### REVEL

- **Property ID:** `19a5d2e5-a8e9-4196-9cfa-d97bc4789332`
- **Projects (1):** `25-106`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-106 | **TLCIQ_PRODUC** | Revel |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 65 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 65 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 615 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### SHELTER - BISHOP ARTS

- **Property ID:** `c85ce00d-64c3-4b16-bc26-905cc709bb71`
- **Projects (2):** `25-132`, `25-026`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-132 | **TLCIQ_PRODUC** | Shelter Bishop Arts models |
| Project identity | project_registry 25-026 | **TLCIQ_PRODUC** | Shelter Bishop Arts |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 94 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 94 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 204 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Signature 1505

- **Property ID:** `8e4e519e-ef3a-4240-b3c4-f367688c4897`
- **Projects (2):** `25-088`, `25-220-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-088 | **TLCIQ_PRODUC** | Signature 1505 |
| Project identity | project_registry 25-220-I | **UNKNOWN** | deal: 25-220-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 6 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 7 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 19 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### SIGNATURE 1909

- **Property ID:** `6c929c47-5110-4cec-8c54-85fd2535bab2`
- **Projects (1):** `25-072`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-072 | **TLCIQ_PRODUC** | Signature 1909 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 61 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 62 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 58 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### SIGNATURE HARTWELL VILLAGE

- **Property ID:** `de110f48-2b61-4117-9dda-a3bd23bb73e2`
- **Projects (1):** `25-087`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-087 | **TLCIQ_PRODUC** | Signature Hartwell Village |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 16 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 191 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 102 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### SOCIAL 28 APARTMENTS

- **Property ID:** `991e8463-da99-43e4-9baf-46b58acaaa08`
- **Projects (1):** `25-181-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-181-I | **TLCIQ_PRODUC** | deal: 25-181-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### SOLIS IV -TRIGO

- **Property ID:** `1e3568e9-95ec-4a02-9447-9f061ee9823d`
- **Projects (1):** `25-170`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-170 | **UNKNOWN** | deal: 25-170 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 15 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 19 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 140 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### STATEHOUSE HIGHLINE ON 9TH

- **Property ID:** `c7bb9bfa-23ec-4687-ab5c-a6fb9ede2fe5`
- **Projects (2):** `25-189-I`, `25-002`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-189-I | **UNKNOWN** | deal: 25-189-I |
| Project identity | project_registry 25-002 | **TLCIQ_PRODUC** | 25-189 STATEHOUSE HIGHLINE ON 9TH |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 78 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 190 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 593 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### STRAKE JESUIT RETREAT AND LEADERSHIP CENTER

- **Property ID:** `eced4904-9147-4dd2-b348-942a34a57a86`
- **Projects (1):** `25-226`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-226 | **TLCIQ_PRODUC** | STRAKE JESUIT |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 9 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 9 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 18 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### SUBTEXT - Ann Arbor

- **Property ID:** `b224593d-74b0-4832-ac98-9dfc54767b38`
- **Projects (1):** `25-022-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-022-I | **TLCIQ_PRODUC** | deal: 25-022-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### SUBTEXT - EVER West Lafayette

- **Property ID:** `6c10aea4-a8a1-4215-9e05-a6343018dda3`
- **Projects (1):** `25-033-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25-033-I | **TLCIQ_PRODUC** | deal: 25-033-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### Summit and Jacob Heights

- **Property ID:** `c3a11c77-0fc5-4954-892e-f9af73c30fbd`
- **Projects (1):** `25-046-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-046-I | **TLCIQ_PRODUC** | deal: 25-046-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Sweetberries

- **Property ID:** `e7c55034-8d6c-4b62-9006-3d0fca779b17`
- **Projects (1):** `25-053`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-053 | **TLCIQ_PRODUC** | Sweetberries |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 17 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 151 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 5 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### TCU LEASING OFFICE

- **Property ID:** `3a36492e-7581-4287-91a2-c41a9e58cdb9`
- **Projects (1):** `25-233-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-233-I | **UNKNOWN** | deal: 25-233-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### TESSERA

- **Property ID:** `21631121-0afa-4dcb-90e2-17c5309be1cc`
- **Projects (1):** `25-043`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-043 | **TLCIQ_PRODUC** | TESSERA |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Texan Villas - Stephenville, TX

- **Property ID:** `4ef679a9-228e-4e4b-b078-f766dee5ff1b`
- **Projects (1):** `25-027-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-027-I | **TLCIQ_PRODUC** | deal: 25-027-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE ARCH-CONWAY

- **Property ID:** `08b07810-5354-4441-805f-4824943ce115`
- **Projects (1):** `25-099`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-099 | **TLCIQ_PRODUC** | The Arch - Conway |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 131 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 123 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 130 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE ASCENT

- **Property ID:** `31851ad6-eeeb-4894-bde9-8971bf50d242`
- **Projects (1):** `25-101`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-101 | **TLCIQ_PRODUC** | The Ascent |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 54 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 77 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 2 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE AVE AT NORMAN

- **Property ID:** `d89a9327-eff6-4b24-9332-b9eefb709fce`
- **Projects (1):** `25-134`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-134 | **TLCIQ_PRODUC** | The Ave at Norman |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 507 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 506 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 343 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Block - Austin, TX

- **Property ID:** `f7a6b4eb-24df-4f2e-bd33-5ee807b3e823`
- **Projects (1):** `25-110-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-110-I | **TLCIQ_PRODUC** | deal: 25-110-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Collective Auburn - 2025

- **Property ID:** `0f59ecd6-ac99-47c4-bfeb-a7e08287f082`
- **Projects (1):** `25-041`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25-041 | **TLCIQ_PRODUC** | Collective Auburn |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 4 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 18 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 40 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Collective Columbia

- **Property ID:** `af57470a-55b1-48a0-8e55-4d45ecee2f10`
- **Projects (18):** `25-5090`, `25-095`, `25-062-I`, `25-051`, `25-5092`, `25-5094`, `25-509`, `25-1025-D`, `25-1775-DTHE`, `25-5091`, `25-094`, `25-096`, `25-5095`, `25-5093`, `25-1937`, `25-113-I`, `25-213`, `25-085`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-5090 | **TLCIQ_PRODUC** | I-TAL-GSD-TOWER 1 |
| Project identity | project_registry 25-095 | **TLCIQ_PRODUC** | Academy Campustown - 501 S. 6th |
| Project identity | project_registry 25-062-I | **UNKNOWN** | deal: 25-062-I |
| Project identity | project_registry 25-051 | **TLCIQ_PRODUC** | The Lyndon |
| Project identity | project_registry 25-5092 | **TLCIQ_PRODUC** | I-TAL-GSD-TOWER 3 |
| Project identity | project_registry 25-5094 | **TLCIQ_PRODUC** | I-TAL-GSD-TOWER 5 |
| Project identity | project_registry 25-509 | **TLCIQ_PRODUC** | 0-I-TAL-GSD-TOWER 1 |
| Project identity | project_registry 25-1025-D | **UNKNOWN** | deal: 25-1025-D |
| Project identity | project_registry 25-1775-DTHE | **UNKNOWN** | deal: 25-1775-DTHE |
| Project identity | project_registry 25-5091 | **TLCIQ_PRODUC** | I-TAL-GSD-TOWER 2 |
| Project identity | project_registry 25-094 | **TLCIQ_PRODUC** | Academy Campustown - 1008 S. 4th |
| Project identity | project_registry 25-096 | **TLCIQ_PRODUC** | Academy Campustown - 908 S. First |
| Project identity | project_registry 25-5095 | **TLCIQ_PRODUC** | I-TAL-GSD-TOWER 6 |
| Project identity | project_registry 25-5093 | **TLCIQ_PRODUC** | I-TAL-GSD-TOWER 4 |
| Project identity | project_registry 25-1937 | **TLCIQ_PRODUC** | deal: 25-113-I |
| Project identity | project_registry 25-113-I | **TLCIQ_PRODUC** | deal: 25-113-I |
| Project identity | project_registry 25-213 | **TLCIQ_PRODUC** | The Collective Columbia |
| Project identity | project_registry 25-085 | **TLCIQ_PRODUC** | EAST EDGE APTS |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 41 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 41 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 44 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Cottages at Hillside Ranch

- **Property ID:** `2fe0955b-f2ec-44c1-b7d1-fd117d2b2035`
- **Projects (2):** `25-145`, `25-146`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-145 | **TLCIQ_PRODUC** | The Cottages at Hillside Ranch |
| Project identity | project_registry 25-146 | **TLCIQ_PRODUC** | The Cottages at Hillside Ranch |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 214 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 233 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 221 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE COTTAGES AT SAN MARCOS

- **Property ID:** `972ea5dc-8c1b-4b49-961b-3beea2239855`
- **Projects (1):** `25-177`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-177 | **TLCIQ_PRODUC** | The Cottages of San Marcos |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 58 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 58 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 268 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Dean Campustown

- **Property ID:** `4f3004f3-0c62-49d9-ad64-5b4961d2a441`
- **Projects (2):** `25-097`, `25-098`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-097 | **TLCIQ_PRODUC** | Academy Campustown - 307 E. DANIEL |
| Project identity | project_registry 25-098 | **TLCIQ_PRODUC** | The Dean Campustown |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 259 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 260 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 58 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE EDEN

- **Property ID:** `51ffc788-5980-43b9-bcb3-20c2bf1e5a7a`
- **Projects (1):** `25-120-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-120-I | **TLCIQ_PRODUC** | deal: 25-120-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE FORUM AT SAM HOUSTON

- **Property ID:** `2783dd9e-7730-4803-9ad3-8d5b3d7430f6`
- **Projects (1):** `25-083`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-083 | **TLCIQ_PRODUC** | The Forum at Sam Houston |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 100 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 237 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 90 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE HUDSON

- **Property ID:** `31b555c4-298b-47b4-ab74-a1ee63b5b334`
- **Projects (1):** `25-048-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-048-I | **TLCIQ_PRODUC** | deal: 25-048-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 72 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 72 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE IKON

- **Property ID:** `85ae8478-3857-4e66-93f1-760789a4d392`
- **Projects (1):** `25-061`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-061 | **TLCIQ_PRODUC** | The Ikon |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 19 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 19 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Jones Tower Apartments

- **Property ID:** `cdadd553-e48d-4c8c-b252-e3e731f4ace2`
- **Projects (1):** `25-222-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-222-I | **TLCIQ_PRODUC** | deal: 25-222-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Lofts Orlando - 2025

- **Property ID:** `6d0642b1-39f1-4a9a-97e3-cc8db6e3b91e`
- **Projects (1):** `25-082`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-082 | **TLCIQ_PRODUC** | The Lofts |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 1 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 55 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 4 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE MARSHALL

- **Property ID:** `81b5446c-cad1-4499-b6bd-214319b88c65`
- **Projects (2):** `25-180`, `25-147-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-180 | **TLCIQ_PRODUC** | THE MARSHALL do not use |
| Project identity | project_registry 25-147-I | **TLCIQ_PRODUC** | deal: 25-147-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 168 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 257 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 862 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE OASIS SAN ANTONIO

- **Property ID:** `aad357e4-8f88-4c2a-9ed0-f0fbe70daf91`
- **Projects (1):** `25-188-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-188-I | **TLCIQ_PRODUC** | deal: 25-188-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 48 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 48 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE PARK ON MORTON

- **Property ID:** `d88d159e-cc1e-4a0b-a2ef-f54b8c588aad`
- **Projects (1):** `25-203-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-203-I | **UNKNOWN** | deal: 25-203-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 15 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 15 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE PARLOR LOFTS 1

- **Property ID:** `940b6bd4-a6e9-4267-bb4b-7460517bccf8`
- **Projects (1):** `25-143-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-143-I | **TLCIQ_PRODUC** | deal: 25-143-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE PIER-COTTON AND TINY HOMES 2025

- **Property ID:** `4f0627de-8b4f-4f87-aa5f-620140bd5bff`
- **Projects (1):** `25-138-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-138-I | **TLCIQ_PRODUC** | deal: 25-138-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 13 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 181 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Point - Cincinnati, OH

- **Property ID:** `99694533-07c0-496d-833e-2f0c18f71aae`
- **Projects (1):** `25-031-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-031-I | **SAGE-PACE** | deal: 25-031-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE POINTE AT CENTRAL

- **Property ID:** `efcba5d5-ebed-4597-b5bf-88ae0d691770`
- **Projects (1):** `25-059`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-059 | **TLCIQ_PRODUC** | The Pointe at Central |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 321 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 369 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 64 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE POINTE CINCINNATI

- **Property ID:** `1c60c690-6f19-4041-9d48-dae3b8023549`
- **Projects (1):** `25-31`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-31 | **UNKNOWN** | deal: 25-31 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Province Greensboro

- **Property ID:** `d531de48-8a95-474c-8518-a9b1d2691658`
- **Projects (1):** `25-086`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-086 | **TLCIQ_PRODUC** | The Province Greensboro |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 85 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 85 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 112 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE QUATRERS-STERLING HOUSE

- **Property ID:** `18e13033-f7fb-4060-97e3-fd40bac38f46`
- **Projects (1):** `25-215`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-215 | **TLCIQ_PRODUC** | /216/217 THE QUARTERS |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 25 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 52 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 325 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Rowe

- **Property ID:** `6cf825c2-c346-43ca-9c45-101f5fbb1dec`
- **Projects (1):** `25-140`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-140 | **TLCIQ_PRODUC** | The Rowe |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 186 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 187 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 243 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Timbers - San Marcos, TX

- **Property ID:** `ab8a5bb7-2188-4486-bfad-5778eada317b`
- **Projects (1):** `25-029`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25-029 | **TLCIQ_PRODUC** | THE TIMBERS |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 4 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 4 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 72 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE TRIBE GAINES

- **Property ID:** `ad3b5760-86ef-4192-96f2-0357f5ca4c03`
- **Projects (1):** `25-903`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-903 | **TLCIQ_PRODUC** | SO6106 THE TRIBE GAINES 908 Dev. Replacments |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 6 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 6 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 6 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Tribe Tallahassee

- **Property ID:** `e5bce44b-2f67-403d-b053-95916abfb2ea`
- **Projects (1):** `25-024-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-024-I | **TLCIQ_PRODUC** | deal: 25-024-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The View Apartments

- **Property ID:** `23a13468-1e88-4d1c-b8a2-7089e3d51963`
- **Projects (1):** `25-112`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-112 | **TLCIQ_PRODUC** | The View Apts |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 134 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 135 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 69 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Wyatt Lubbock

- **Property ID:** `41503c71-1db9-478a-9db9-07c179c3d9b0`
- **Projects (1):** `25-021-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-021-I | **TLCIQ_PRODUC** | deal: 25-021-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### TLO HUB AT RALEIGH

- **Property ID:** `37e804c6-bc7e-468d-a132-9a66af044c8b`
- **Projects (1):** `25-901`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-901 | **TLCIQ_PRODUC** | 5735  Hub at Raleigh  TLO |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 2 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 2 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 41 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### Torre Student Living Austin

- **Property ID:** `19594d24-10a2-4ff4-94ed-6c8359f5ace2`
- **Projects (1):** `25-080`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-080 | **TLCIQ_PRODUC** | Torre Student Living Austin |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 159 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 159 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 74 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Town Lake Student Apartments

- **Property ID:** `8051a084-b42d-4df9-b041-c12b88746b9a`
- **Projects (1):** `25-135`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-135 | **TLCIQ_PRODUC** | Town Lake Student Apts |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 355 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 355 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 73 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### TRAILSIDE PHOENIX PROPERTY PHASE 2

- **Property ID:** `36079370-f843-4937-b15d-599aa4ec1b48`
- **Projects (1):** `25-001-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-001-I | **TLCIQ_PRODUC** | deal: 25-001-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Travelers Motel - Modesto, CA

- **Property ID:** `9445887e-3d42-43f8-a77d-38ec5226bb79`
- **Projects (1):** `25-011`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 25-011 | **TLCIQ_PRODUC** | TRAVELERS INN |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 3 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 54 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 24 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### TREEHOUSE

- **Property ID:** `a62ac2c4-4488-424b-9bb4-62b25c59757d`
- **Projects (1):** `25-142`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-142 | **TLCIQ_PRODUC** | Treehouse San Marcos |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 14 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 14 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 47 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### TWELVE AT U DISTRICT

- **Property ID:** `e04ed6fb-f9d7-483b-a5ae-c3d8b64a13c8`
- **Projects (1):** `25-052`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-052 | **TLCIQ_PRODUC** | Twelve at U District |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 59 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 116 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 272 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### TWENTY TWO 15

- **Property ID:** `c0987bb3-434e-404f-b501-cf0a77768510`
- **Projects (1):** `25-130`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-130 | **TLCIQ_PRODUC** | TWENTY TWO 15 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 94 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 137 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 174 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### U Centre at Fry St.

- **Property ID:** `46b73a9e-a07f-459f-82f9-43cf973f5dfe`
- **Projects (1):** `25-091`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-091 | **TLCIQ_PRODUC** | U Centre at Fry St. |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 175 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 173 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 60 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### U Club Binghamton

- **Property ID:** `e036d06e-775c-48a0-8b07-ed4620476d31`
- **Projects (1):** `25-1318-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_GAP** | netsuite_gap_fill |
| Project identity | project_registry 25-1318-D | **UNKNOWN** | deal: 25-1318-D |

#### U CLub on 28th

- **Property ID:** `d3f1b260-ab8c-4072-a601-c29b2da2b0af`
- **Projects (1):** `25-089`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-089 | **TLCIQ_PRODUC** | U Club on 28th |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 37 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 125 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 96 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### U Village Boulder

- **Property ID:** `4608919a-e263-4ed3-bad5-64102dd6cfe4`
- **Projects (1):** `25-090`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-090 | **TLCIQ_PRODUC** | UNIV VILLAGE BOULDER CREEK |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 17 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 17 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 144 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### U-LAKE

- **Property ID:** `494c99b4-f196-4174-99e6-4b5015a3a3ca`
- **Projects (1):** `25-003-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-003-I | **TLCIQ_PRODUC** | deal: 25-003-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### UNION BASELINE

- **Property ID:** `6015cb77-43a9-471c-b3a6-a67d8e6cdc71`
- **Projects (1):** `25-081-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-081-I | **TLCIQ_PRODUC** | deal: 25-081-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 5 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 67 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Union on Alley/ Lokal

- **Property ID:** `2214e0cf-2838-4384-b8b3-0b37590bf0db`
- **Projects (1):** `25-060`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-060 | **TLCIQ_PRODUC** | Union on Alley-Lokal |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 4 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 26 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 9 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Union Tempe

- **Property ID:** `a424deed-95f3-4c97-9218-17216c6b084b`
- **Projects (1):** `25-103`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-103 | **TLCIQ_PRODUC** | Union Tempe |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 97 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 190 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 13 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### University Apartments at Ettrick

- **Property ID:** `56abe653-8de0-4703-af16-cc3cb5731cae`
- **Projects (1):** `25-224`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-224 | **TLCIQ_PRODUC** | University Apartments at Ettrick |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 52 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 52 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 112 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### UNIVERSITY GATEWAY

- **Property ID:** `64a5d9f1-5cd2-4693-83bf-f610eaec6f8a`
- **Projects (1):** `25-063-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-063-I | **TLCIQ_PRODUC** | deal: 25-063-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### UNIVERSITY GROVE

- **Property ID:** `0b3480ea-9975-4c83-9354-30e82b49039b`
- **Projects (1):** `25-109`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-109 | **TLCIQ_PRODUC** | 9-D UNIVERSITY GROVE  trucks |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 2 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 126 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### UNIVERSITY OF HAWAII MANOA

- **Property ID:** `51eeefbe-6460-43dc-ae9a-cc8375eeeef3`
- **Projects (1):** `25-019-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-019-I | **TLCIQ_PRODUC** | deal: 25-019-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### UNIVERSITY TRAILS - COLLEGE STATION

- **Property ID:** `9f763aa5-2b06-40a8-b912-ba0d69470d95`
- **Projects (1):** `25-148`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-148 | **TLCIQ_PRODUC** | UNIV. TRAILS COLLEGE STATION |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 320 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 525 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 64 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Uptown Square

- **Property ID:** `829f9379-3162-4817-8a80-45d5a0db1541`
- **Projects (1):** `25-124-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-124-I | **TLCIQ_PRODUC** | deal: 25-124-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 22 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 22 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### US OLYMPIC & PARALYMPICS COMMITS

- **Property ID:** `fb446b75-f2ff-4921-abbd-fd6c7581d8e1`
- **Projects (1):** `25-205`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-205 | **TLCIQ_PRODUC** | 232 Colorado Springs |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 34 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 178 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 34 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### UTD Northside III

- **Property ID:** `51cd154f-9b23-48e0-8fdb-f7722de28379`
- **Projects (4):** `25-159-I`, `25-160`, `25-158`, `25-157`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-159-I | **TLCIQ_PRODUC** | deal: 25-159-I |
| Project identity | project_registry 25-160 | **TLCIQ_PRODUC** | Northside UTD 4 |
| Project identity | project_registry 25-158 | **TLCIQ_PRODUC** | UTD Northside II |
| Project identity | project_registry 25-157 | **TLCIQ_PRODUC** | UTD Northside |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 209 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 225 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 156 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### VALENTINE COMMONS

- **Property ID:** `e2bbd255-8f2e-4919-aec5-7b403753eaf9`
- **Projects (2):** `25-077`, `25-155-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-077 | **TLCIQ_PRODUC** | Valentine Commons |
| Project identity | project_registry 25-155-I | **TLCIQ_PRODUC** | deal: 25-155-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 57 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 241 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 10 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Venue at Guadalupe

- **Property ID:** `e2c20cb1-ae01-4d19-a1aa-3848143dd4ee`
- **Projects (2):** `25-115`, `25-116`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-115 | **TLCIQ_PRODUC** | Venue at Guadalupe |
| Project identity | project_registry 25-116 | **TLCIQ_PRODUC** | Venue at Guadalupe |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 129 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 130 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 133 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### VERVE ORLANDO

- **Property ID:** `12b38935-0876-4f44-9192-f338560f81c1`
- **Projects (1):** `25-179-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 25-179-I | **UNKNOWN** | deal: 25-179-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 40 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 200 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 373 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### Villas On Guadalupe

- **Property ID:** `d07f8979-07ba-4c67-9a9b-5e0f7f8f8882`
- **Projects (2):** `25-117`, `25-118`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-117 | **TLCIQ_PRODUC** | VILLAS ON GUADALUPE - VACANT UNITS |
| Project identity | project_registry 25-118 | **TLCIQ_PRODUC** | Villas on Guadalupe - 2025 Turn |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 62 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 62 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 94 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### VON WALD YOUTH SHELTER

- **Property ID:** `05c73cbd-4fde-4a04-a24b-843ca766efd5`
- **Projects (1):** `25-194`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-194 | **TLCIQ_PRODUC** | Von Wald Youth Center |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 1 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 16 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 7 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### WEST 22

- **Property ID:** `4141a48c-0fef-415a-b9dc-263437403e8a`
- **Projects (1):** `25-093`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-093 | **TLCIQ_PRODUC** | West 22 |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 7 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 7 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### WHISTLER

- **Property ID:** `5198eb0d-9fe1-4757-8409-5dff57c672da`
- **Projects (1):** `25-195-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 25-195-I | **TLCIQ_PRODUC** | deal: 25-195-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 17 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 168 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 5 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Willowtree Apartments and Tower - Ann Arbor, MI

- **Property ID:** `9195dd85-8fe6-4056-94e0-2e9a91db31ce`
- **Projects (1):** `25-068-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-068-I | **TLCIQ_PRODUC** | deal: 25-068-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### WRIGHT CAMPIS CENTER

- **Property ID:** `6a0faf59-6c84-4381-85ed-536e6bf96623`
- **Projects (2):** `25-108`, `25-1081`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-108 | **TLCIQ_PRODUC** | Cabana Beach Apts |
| Project identity | project_registry 25-1081 | **TLCIQ_PRODUC** | AUSTIN COLLEGE |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 66 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 65 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 112 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### YMCA Apartments

- **Property ID:** `07f38559-7055-49ab-9105-666a0632c327`
- **Projects (1):** `25-119`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-119 | **TLCIQ_PRODUC** | The Square & YMCA Apartments |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 12 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 12 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 144 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### YUGO CHARLESTON

- **Property ID:** `fde3e545-d359-4bbb-b449-e10c3f21cab9`
- **Projects (1):** `25-165-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-165-I | **TLCIQ_PRODUC** | deal: 25-165-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### YUGO EUGENE COURTSIDE

- **Property ID:** `62596133-0cbf-4705-a177-38f1c38fc176`
- **Projects (1):** `25-183`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-183 | **TLCIQ_PRODUC** | YUGO EUGENE COURTSIDE |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 17 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 31 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 243 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Yugo Eugene Skybox - 2025

- **Property ID:** `c6c2d9d2-eff4-4804-9368-a972558543b6`
- **Projects (1):** `25-182-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-182-I | **TLCIQ_PRODUC** | deal: 25-182-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### YUGO FORT COLLINS GROVE

- **Property ID:** `76abe260-d3fd-4191-b914-45a2aa349c66`
- **Projects (1):** `25-167-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-167-I | **TLCIQ_PRODUC** | deal: 25-167-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 5 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 134 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### YUGO LEXINGTON CAMPUS COURT

- **Property ID:** `624ac3ad-3ab1-4cf9-84c3-ee0c3de6ad51`
- **Projects (1):** `25-168`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 25-168 | **TLCIQ_PRODUC** | Yugo Lexington Campus |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 47 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 75 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 12 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### YUGO Salt Lake City

- **Property ID:** `f46901fc-a7f9-48c9-b882-dfe832b0bc97`
- **Projects (1):** `25-235-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 25-235-I | **UNKNOWN** | deal: 25-235-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 20 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 109 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 270 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### Yugo Tucson Campus - 2025

- **Property ID:** `929909d0-d267-4efc-966d-9ec9e957c2fc`
- **Projects (1):** `25-169`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-169 | **TLCIQ_PRODUC** | YUGO TUCSON CAMPUS |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 48 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 48 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 256 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |

#### Yugo Tucson Campus - Mattresses

- **Property ID:** `aa5eaa57-2500-4587-b32a-886c3192f3f0`
- **Projects (1):** `25-218`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-218 | **TLCIQ_PRODUC** | YUGO TUCSON CAMPUS |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 20 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 20 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 20 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |

#### Yugo West Lafayette River Market- 2025

- **Property ID:** `c7912dc7-334d-4860-ae04-5a192f8afbc6`
- **Projects (1):** `25-166-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 25-166-I | **TLCIQ_PRODUC** | deal: 25-166-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

### UF · 2026

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `26-1042-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 26-1042-D | **UNKNOWN** | deal: 26-1042-D |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `26-012`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 26-012 | **TLCIQ_PRODUC** | Wingate |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `26-1085-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 26-1085-D | **UNKNOWN** | deal: 26-1085-D |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `26-2025`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 26-2025 | **UNKNOWN** | deal: 26-2025 |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `26-1587-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 26-1587-D | **UNKNOWN** | deal: 26-1587-D |

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `26-1063-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 26-1063-D | **UNKNOWN** | deal: 26-1063-D |

#### 2230 Haste

- **Property ID:** `089cf4cd-9122-48d8-be55-9ce1c37816c4`
- **Projects (1):** `26-1559-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-1559-D | **SAGE-PACE** | deal: 26-1559-D |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 2311 LeConte

- **Property ID:** `d8bff587-b07f-46e9-8b1b-700a63355036`
- **Projects (1):** `26-1562-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 26-1562-D | **UNKNOWN** | deal: 26-1562-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 2315 College Ave

- **Property ID:** `fe21e380-01a5-4faf-a216-54d4c19da00b`
- **Projects (1):** `26-1561-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 26-1561-D | **UNKNOWN** | deal: 26-1561-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 2411 Durant

- **Property ID:** `5667bc83-3d5e-480f-a0f1-be7e783286b3`
- **Projects (1):** `26-1560-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-1560-D | **UNKNOWN** | deal: 26-1560-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 2419 Durant

- **Property ID:** `26307b9f-4cbb-4ce7-8c3b-ad53a78a1017`
- **Projects (1):** `26-1557-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-1557-D | **UNKNOWN** | deal: 26-1557-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 2514 PIedmont

- **Property ID:** `790370a1-0e8c-4741-9ed3-059af1c21d56`
- **Projects (1):** `26-1556-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-1556-D | **UNKNOWN** | deal: 26-1556-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 2525 Durant

- **Property ID:** `28b16f32-d3bf-46b5-b415-d4691e2abfa3`
- **Projects (1):** `26-1558-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-1558-D | **UNKNOWN** | deal: 26-1558-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### 2929 DWIGHT WAY

- **Property ID:** `07fba44b-4b33-4000-9075-751de3e76dbf`
- **Projects (1):** `26-045`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-045 | **TLCIQ_PRODUC** | 2129 Dwight |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 13 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 55 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 209 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### 3030 TELEGRAPH

- **Property ID:** `485e10c0-818f-47ee-b659-1e0316d4398f`
- **Projects (1):** `26-043-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-043-I | **TLCIQ_PRODUC** | deal: 26-043-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 8 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### 3765 LINDELL OZ

- **Property ID:** `406ab5d4-088c-4818-aeab-3e0de50491a3`
- **Projects (1):** `26-035-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-035-I | **UNKNOWN** | deal: 26-035-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### AXIS WEST CAMPUS

- **Property ID:** `f5aa6309-1f5c-4a75-9efd-2a02125f9cba`
- **Projects (1):** `26-107-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-107-I | **UNKNOWN** | deal: 26-107-I |
| Plan milestones / pacing | 2 project_milestones | **DALE-IS** | unknown (2) |
| Unit types | 212 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 211 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 125 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Blanding-Kirwan

- **Property ID:** `b3eb8c15-f4cd-472b-9a90-bc9218da6ace`
- **Projects (1):** `26-005-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-005-I | **TLCIQ_PRODUC** | deal: 26-005-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 7 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### CABANA BEACH APTS.

- **Property ID:** `8b681f1a-ed67-463f-979b-13fb8c733969`
- **Projects (1):** `26-044-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-044-I | **TLCIQ_PRODUC** | deal: 26-044-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### Cabana Beach Gainesville

- **Property ID:** `f58b468b-4544-40b2-b190-4d689bb53255`
- **Projects (1):** `26-031-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-031-I | **SAGE-PACE** | deal: 26-031-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 182 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 352 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### CAMPUS CROSSING AT COLLEGE ROW

- **Property ID:** `8a379b18-7924-4a71-b1b6-16ba213d251e`
- **Projects (1):** `26-1047-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-1047-D | **UNKNOWN** | deal: 26-1047-D |
| Unit types | 109 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 109 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 104 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### CITYSPACE 1752

- **Property ID:** `fe697f5f-8ada-40df-8b6c-4ab7828d4f27`
- **Projects (1):** `26-016-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-016-I | **TLCIQ_PRODUC** | deal: 26-016-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 5 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### Collective Norman '26

- **Property ID:** `bb3d5d01-b732-4644-8b78-76013ac41351`
- **Projects (1):** `26-015-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 26-015-I | **UNKNOWN** | deal: 26-015-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Crowne Plaza - Arlington, TX - Case Goods

- **Property ID:** `ed6a5a52-5447-49e2-aea4-ac49b3a191ef`
- **Projects (1):** `26-1021-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-1021-D | **UNKNOWN** | deal: 26-1021-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### DURANT

- **Property ID:** `d861df09-5bb2-4192-bfd3-3c6926aa66a4`
- **Projects (1):** `26-010`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-010 | **TLCIQ_PRODUC** | THE VALIANT |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 22 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 75 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 283 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### ELM CROSSING

- **Property ID:** `47b5e6d4-99e5-4378-99a6-fd7c47a53214`
- **Projects (1):** `26-052-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-052-I | **TLCIQ_PRODUC** | deal: 26-052-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 1 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### EVER KNOXVILLE

- **Property ID:** `9cf29913-9c8f-4500-a051-c755ec14cb50`
- **Projects (1):** `26-024-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 26-024-I | **TLCIQ_PRODUC** | deal: 26-024-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 25 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### Friends Association

- **Property ID:** `cf60a526-9742-4992-9505-27c987f1e0cf`
- **Projects (1):** `26-030`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-030 | **TLCIQ_PRODUC** | Friends Assoc |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 11 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 11 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 105 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### Gateway Tempe '26 - Reno

- **Property ID:** `627ad927-17f6-4302-b780-2cd66bc63edf`
- **Projects (1):** `26-095-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-095-I | **UNKNOWN** | deal: 26-095-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### HUB ANN ARBOR

- **Property ID:** `d7aea0dc-a7b1-4bb2-a2fa-20e873ec4621`
- **Projects (2):** `26-008`, `26-009-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-008 | **TLCIQ_PRODUC** | Ann Arbor loose |
| Project identity | project_registry 26-009-I | **TLCIQ_PRODUC** | deal: 26-009-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 88 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 228 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 530 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### Hub Madison

- **Property ID:** `3da116a4-5f7b-45a9-a630-08a09b6ac9f4`
- **Projects (1):** `26-025-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_GAP** | netsuite_gap_fill |
| Project identity | project_registry 26-025-I | **UNKNOWN** | deal: 26-025-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |

#### Hub on Campus Boulder

- **Property ID:** `3aba3e9e-edca-4194-9db4-9b3c5a7bbece`
- **Projects (1):** `26-006-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **CORESPACES+FIRECRAWL** | corespaces_prismic |
| Project identity | project_registry 26-006-I | **CORESPACES** | deal: 26-006-I |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### Hub on Campus Clemson

- **Property ID:** `a28cf476-c62f-4728-bb9d-d9a72c688001`
- **Projects (1):** `26-002-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **CORESPACES+FIRECRAWL** | corespaces_prismic |
| Project identity | project_registry 26-002-I | **CORESPACES** | deal: 26-002-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### Hub on Campus Raleigh

- **Property ID:** `e0f01ab5-a1da-42fd-a358-a4c67db29d4c`
- **Projects (1):** `26-001-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+CORESPACES+FIRECRAWL** | install_schedules |
| Project identity | project_registry 26-001-I | **CORESPACES** | deal: 26-001-I |
| Plan milestones / pacing | 2 project_milestones | **DALE-IS** | unknown (2) |
| Unit types | 194 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 9 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **CORESPACES** | Cloudinary hero |

#### Hub Tallahassee - Loose Furniture

- **Property ID:** `63dc59dc-1a10-4992-abc5-6f447150f17b`
- **Projects (1):** `26-004-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-004-I | **TLCIQ_PRODUC** | deal: 26-004-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Hub Tampa-Tampa

- **Property ID:** `be8e3def-b0e6-453f-8120-c134203a3e6b`
- **Projects (1):** `26-1030-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **IQ_PROPERTY_** | iq_property_registry |
| Project identity | project_registry 26-1030-D | **UNKNOWN** | deal: 26-1030-D |

#### Hyatt Select Opryland Nashville TN

- **Property ID:** `d2ddc45d-3a2d-5b8f-bd78-0c38e0265523`
- **Projects (1):** `26-1060-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 26-1060-D | **UNKNOWN** | deal: 26-1060-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Jefferson Commons

- **Property ID:** `c3164680-966a-4620-96f0-61290c047cc2`
- **Projects (1):** `26-092-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-092-I | **SAGE-PACE** | deal: 26-092-I |
| Sage order crosswalk | external_ids.sage_* | **SAGE-PACE** | order/deal refs on 1 project(s) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Lincoln Alexander Hall (McMaster University)

- **Property ID:** `5abbd0be-a524-4bff-966e-b25f352f504b`
- **Projects (1):** `26-038-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_GAP** | netsuite_gap_fill |
| Project identity | project_registry 26-038-I | **UNKNOWN** | deal: 26-038-I |

#### Lotus Boulder

- **Property ID:** `cce3d6ea-b776-412e-918b-61b50416dca9`
- **Projects (1):** `26-023`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-023 | **UNKNOWN** | deal: 26-023 |
| Unit types | 2 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 17 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 13 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### MADISON J&B

- **Property ID:** `0f535b7e-632e-40d5-adb8-63182515272c`
- **Projects (1):** `26-011-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-011-I | **UNKNOWN** | deal: 26-011-I |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Marriott's Grand Chateau Las Vegas

- **Property ID:** `967d7b07-843e-58f8-b64b-1e292f2d31a2`
- **Projects (1):** `26-1058-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **RITA_CWB_CAN** | rita_cwb_canonical |
| Project identity | project_registry 26-1058-D | **UNKNOWN** | deal: 26-1058-D |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Marshall Tempe

- **Property ID:** `9988272b-f1e5-41df-978f-2f88d60a38f4`
- **Projects (1):** `26-018-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-018-I | **TLCIQ_PRODUC** | deal: 26-018-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 16 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### Nordheim

- **Property ID:** `5fd919ef-2509-42e9-a73b-7447c2556ebd`
- **Projects (1):** `26-070-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 26-070-I | **UNKNOWN** | deal: 26-070-I |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### PERLA AT THE ENCLAVE

- **Property ID:** `705d159c-85ad-42df-94bb-57e8655d53da`
- **Projects (1):** `26-007-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-007-I | **TLCIQ_PRODUC** | deal: 26-007-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **UNKNOWN** | Cloudinary hero |

#### RAMBLER TEMPE

- **Property ID:** `8fd807f6-3735-4c33-8c0b-c3fbec077e91`
- **Projects (1):** `26-048-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 26-048-I | **TLCIQ_PRODUC** | deal: 26-048-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 46 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 7 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### Rise at State College

- **Property ID:** `9ac7835a-480f-4872-ae7b-464d5c4f8317`
- **Projects (1):** `26-1198-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_GAP** | netsuite_gap_fill |
| Project identity | project_registry 26-1198-D | **UNKNOWN** | deal: 26-1198-D |

#### Signature 1505

- **Property ID:** `8e4e519e-ef3a-4240-b3c4-f367688c4897`
- **Projects (1):** `26-055-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-055-I | **UNKNOWN** | deal: 26-055-I |
| Unit types | 6 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 7 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 19 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### SIGNATURE AT VARSITY LEASING OFFICE

- **Property ID:** `b9c54ec7-6638-467f-bd2a-88439ad83ca5`
- **Projects (1):** `26-017-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-017-I | **UNKNOWN** | deal: 26-017-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### SIGNATURE ON GRANS LEASING OFFICE

- **Property ID:** `71df15c4-47fd-4f7a-86fd-a05f673373ce`
- **Projects (1):** `26-034-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-034-I | **UNKNOWN** | deal: 26-034-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Sugar House North

- **Property ID:** `e4f1edcc-56c2-4cd0-90b1-c1cdf2b3df60`
- **Projects (1):** `26-051-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-051-I | **UNKNOWN** | deal: 26-051-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Sugar House South

- **Property ID:** `746c2e23-41be-426d-b8ae-186d3b106c8a`
- **Projects (1):** `26-053-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-053-I | **UNKNOWN** | deal: 26-053-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE ARC

- **Property ID:** `30a83f9f-5118-49d7-96fa-741536b6d123`
- **Projects (1):** `26-036-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-036-I | **UNKNOWN** | deal: 26-036-I |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Collective Columbia

- **Property ID:** `af57470a-55b1-48a0-8e55-4d45ecee2f10`
- **Projects (1):** `26-tbd-d orleans hotel & casino-north tower phase 2`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-tbd-d orleans hotel & casino-north tower phase 2 | **UNKNOWN** | 26-TBD-D ORLEANS HOTEL & CASINO-NORTH TOWER PHASE 2 |
| Unit types | 41 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 41 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 44 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Hall Tallahassee FL

- **Property ID:** `15c4ac8b-00e5-4729-ba7b-dc70ea039614`
- **Projects (1):** `26-020-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-020-I | **TLCIQ_PRODUC** | deal: 26-020-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE HEIGHTS

- **Property ID:** `638c50fc-c709-47a7-9eda-1b00b3f5ec81`
- **Projects (1):** `26-027-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-027-I | **UNKNOWN** | deal: 26-027-I |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Outpost San Marcos

- **Property ID:** `3ad157d7-29fd-4b0e-976d-e27ed15b03b0`
- **Projects (1):** `26-041-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+FIRECRAWL** | pipeline_opportunities |
| Project identity | project_registry 26-041-I | **UNKNOWN** | deal: 26-041-I |
| Unit types | 3 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 92 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### THE PARK ON MORTON

- **Property ID:** `d88d159e-cc1e-4a0b-a2ef-f54b8c588aad`
- **Projects (1):** `26-042-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-042-I | **UNKNOWN** | deal: 26-042-I |
| Unit types | 15 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 15 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The province Greenville Apartments

- **Property ID:** `994343f8-724d-4725-bc7b-65400cbf20cb`
- **Projects (1):** `26-083-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-083-I | **UNKNOWN** | deal: 26-083-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### The Rook (50 South)

- **Property ID:** `866ee38e-475e-405c-94a7-8307e6bdf6f1`
- **Projects (1):** `26-039-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_GAP** | netsuite_gap_fill |
| Project identity | project_registry 26-039-I | **UNKNOWN** | deal: 26-039-I |

#### TheBerkelyGroup-2430 Prospect

- **Property ID:** `dd8db938-cd61-45c2-bb77-da026a8af942`
- **Projects (1):** `26-1563-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-1563-D | **UNKNOWN** | deal: 26-1563-D |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### University College

- **Property ID:** `747ba450-3967-48e7-aae6-3d90f2ff8257`
- **Projects (1):** `26-098-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE** | install_schedules |
| Project identity | project_registry 26-098-I | **UNKNOWN** | deal: 26-098-I |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### UNIVERSITY PARK

- **Property ID:** `b27ee10a-8c20-4ef6-811b-63c422b9e52a`
- **Projects (2):** `26-040-I`, `26-028-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-040-I | **UNKNOWN** | deal: 26-040-I |
| Project identity | project_registry 26-028-I | **UNKNOWN** | deal: 26-028-I |
| Unit types | 57 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 75 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 3 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### US OLYMPIC PARALYMPIC COMMITTS

- **Property ID:** `002d5a0f-c096-46bd-8740-b005a29c0b8e`
- **Projects (1):** `26-1622-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-1622-D | **UNKNOWN** | deal: 26-1622-D |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Utah A25

- **Property ID:** `f3b067d7-2385-40f0-9bc7-0f68653b93c4`
- **Projects (1):** `26-049-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE+DALE-IS** | pipeline_opportunities |
| Project identity | project_registry 26-049-I | **UNKNOWN** | deal: 26-049-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### VERVE COLUMBIA

- **Property ID:** `8434748a-41ad-4326-a2b2-862a7229fdd4`
- **Projects (1):** `26-022-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 26-022-I | **TLCIQ_PRODUC** | deal: 26-022-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 51 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Stakeholders / contacts | 8 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### VERVE ORLANDO

- **Property ID:** `12b38935-0876-4f44-9192-f338560f81c1`
- **Projects (1):** `26-029`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 26-029 | **TLCIQ_PRODUC** | VERVE Orlando |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 40 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 200 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 373 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### VERVE TEMPE

- **Property ID:** `f241f8dc-96de-4dc3-a09c-823c4eeb848c`
- **Projects (1):** `26-026-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 26-026-I | **TLCIQ_PRODUC** | deal: 26-026-I |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 75 property_unit_types | **BOX-BSI** | room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 240 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 6 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

#### VILLAGE EAST TCU

- **Property ID:** `19f22174-c632-45e2-9fe0-a4ab42ec07a3`
- **Projects (1):** `26-1482-D`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-1482-D | **UNKNOWN** | deal: 26-1482-D |
| Unit types | 67 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 93 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Wertland Square

- **Property ID:** `fbfa2080-ad1d-4c24-a930-a41f92c2b6df`
- **Projects (1):** `26-093-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 26-093-I | **UNKNOWN** | deal: 26-093-I |
| Stakeholders / contacts | 2 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Willowtree

- **Property ID:** `df122408-8ef2-4539-bc59-4e5f9aff0bc2`
- **Projects (1):** `26-088-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **PIPELINE** | pipeline_opportunities |
| Project identity | project_registry 26-088-I | **UNKNOWN** | deal: 26-088-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### YUGO Salt Lake City

- **Property ID:** `f46901fc-a7f9-48c9-b882-dfe832b0bc97`
- **Projects (1):** `26-021`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS+PIPELINE+FIRECRAWL** | install_schedules |
| Project identity | project_registry 26-021 | **TLCIQ_PRODUC** | Yugo Salt Lake City |
| Install schedule dates | project_registry.install_start_date / estimated_completion_date | **DALE-IS** | From install_schedules sync (no parsed contract milestones) |
| Unit types | 20 property_unit_types | **BOX-BSI** | production_unit_type_key present · room_drawings / matrix ingest · layout_asset_urls populated |
| Units | 109 property_units | **TLCIQ-PROD** | unit rows linked to types |
| Scoped SKUs (FF&E / millwork) | 270 property_unit_type_skus | **TLCIQ-PROD** | source values: tlciq_production |
| Stakeholders / contacts | 4 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |
| Property imagery | hero_image_url / images[] | **FIRECRAWL** | Cloudinary hero |

### UF · 2027

#### (orphan — no property link)

- **Property ID:** `null`
- **Projects (1):** `27-2025`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **MISSING** | No property_registry row |
| Project identity | project_registry 27-2025 | **UNKNOWN** | deal: 27-2025 |

#### SIGNATURE AT VARSITY LEASING OFFICE

- **Property ID:** `b9c54ec7-6638-467f-bd2a-88439ad83ca5`
- **Projects (1):** `27-002-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **DALE-IS** | install_schedules |
| Project identity | project_registry 27-002-I | **UNKNOWN** | deal: 27-002-I |
| Stakeholders / contacts | 1 property_stakeholders | **UNKNOWN** | Install schedule contact fields → stakeholder rows |

#### Signature on Grand

- **Property ID:** `9396aac9-e10b-4cfb-b8b7-f4730620fef3`
- **Projects (1):** `27-003-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_GAP** | netsuite_gap_fill |
| Project identity | project_registry 27-003-I | **UNKNOWN** | deal: 27-003-I |

#### The Caroline at University Commons

- **Property ID:** `bea4cbc0-a5fc-4cb5-948b-a06f789d5a2e`
- **Projects (1):** `27-001-I`

| Data layer | Entities | Source code | Citation / artifact |
|------------|----------|-------------|---------------------|
| Property identity | property_registry (name, address, brand, units/beds) | **NETSUITE_GAP** | netsuite_gap_fill |
| Project identity | project_registry 27-001-I | **UNKNOWN** | deal: 27-001-I |

---

## 4. Known gaps & authority rules

- **BSI millwork authority:** Box matrix + shop drawings > Chain-iQ > NetSuite > website (see `docs/BSI_CSMX_PROPERTY_ENRICH.md`).
- **UF/CSL FF&E authority:** TLCiQ-Production requirements > install_schedules > Sage pacing crosswalk.
- **Projects without `property_id`:** Usually install-schedule stubs awaiting Rosetta / property match.
- **`25024` Verve TLO:** Box folder empty — contract milestones blocked (BSI-05 in BACKLOG.md).
- **Web BU:** No projects tagged `division=Web` in the 2025–2027 cohort — webstore orders typically roll under **UF** in install_schedules / Sage TYPE. Use Sage `(WEBSTORE)` suffix or deal notes to isolate Web when needed.
- **Full detail (room layouts + scoped SKUs):** Only Troubadour (`25019`) and Morgan Hill (`25048`) at Jul 2026 — all other BSI jobs have structure and/or contract pacing only.
