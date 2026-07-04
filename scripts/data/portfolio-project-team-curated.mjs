/**
 * Curated GC / architect / interior designer for portfolio operators:
 * 908, Lincoln Ventures, Subtext, Yugo (GSA-developed), Parallel, ACC, Greystar.
 */

/** Developers/operators that must never be stored as GC. */
export const PORTFOLIO_GC_BLOCKLIST = new Set([
  '908 DEVELOPMENT',
  '908 GROUP',
  '908 DEVELOPMENT GROUP',
  'SUBTEXT',
  'SUBTEXT (COLLEGIATE DEVELOPMENT GROUP)',
  'LINCOLN VENTURES',
  'LV COLLECTIVE',
  'PARALLEL COMPANY',
  'PARALLEL GROUP',
  'AMERICAN CAMPUS COMMUNITIES',
  'GREYSTAR',
  'GREYSTAR STUDENT LIVING',
  'GREYSTAR - CALIFORNIA',
  'GREYSTAR - DESERT REGION',
  'GREYSTAR - SEATTLE',
  'YUGO',
  'GSA',
  'GLOBAL STUDENT ACCOMMODATION',
  'CORE SPACES',
]);

/** @type {Record<string, { gc?: string, architect?: string, designer?: string, source: string, url?: string }>} */
export const CURATED_BY_PROPERTY = {
  // ── 908 Development ──────────────────────────────────────────────
  'The Nine at Gainesville 18-014 - 908 Development': {
    gc: 'ARCO Murray',
    architect: 'Forum Architecture',
    source: 'BCDC / citybuzz — The NINE @ Gainesville (908 Group + BCDC)',
    url: 'https://batsoncookdev.com/projects/the-nine-gainesville/',
  },
  'West University Gainesville FL': {
    gc: 'ARCO Murray',
    architect: 'Forum Architecture',
    source: '908 Group Gainesville delivery — same Nine @ Gainesville team',
    url: 'https://batsoncookdev.com/projects/the-nine-gainesville/',
  },
  'West University Gainesville FL II': {
    gc: 'ARCO Murray',
    architect: 'Forum Architecture',
    source: '908 Group Gainesville Phase II — Nine portfolio',
    url: 'https://908group.com/the-nine-gainesville',
  },
  'Sweetberries': {
    gc: 'ARCO Murray',
    architect: 'Forum Architecture',
    source: '908 Gainesville portfolio — adjacent Nine @ Gainesville delivery',
    url: 'https://908group.com/the-nine-gainesville',
  },
  'The Hall Tallahassee FL': {
    gc: 'FaverGray',
    source: 'REBusinessOnline — The Hall FSU (908 Group JV, FaverGray GC)',
    url: 'https://rebusinessonline.com/joint-venture-breaks-ground-on-674-bed-student-housing-community-near-florida-state-university/',
  },
  'The Tribe Tallahassee': {
    gc: 'Culpepper Construction Company',
    architect: 'Humphreys & Partners Architects',
    source: '908 Group / BCDC — The Tribe FSU (Culpepper GC, Humphreys architect)',
    url: 'https://yieldpro.com/2026/01/chapter-house-fsu/',
  },
  'ST. AUGUSTINE - 908 DEVELOPMENT': {
    gc: 'Culpepper Construction Company',
    architect: 'Humphreys & Partners Architects',
    source: '908 StateHouse St Augustine — same FSU-area team as Tribe/Chapter House',
    url: 'https://908group.com/portfolio',
  },
  'St. Augustine Tallahassee': {
    gc: 'Culpepper Construction Company',
    architect: 'Humphreys & Partners Architects',
    source: '908 StateHouse St Augustine FSU market',
    url: 'https://908group.com/portfolio',
  },
  'NOLE QUARTERS - 908 DEVELOPMENT': {
    gc: 'Culpepper Construction Company',
    architect: 'Forum Architecture',
    source: '908 FSU market — Culpepper/Forum Nine Tallahassee pattern',
    url: 'https://culpepperconstruction.com/construction/the-nine-at-tallahassee/',
  },
  'THE NINE AT CENTRAL - 908 Development': {
    gc: 'FaverGray',
    architect: 'Humphreys & Partners Architects',
    source: '908 Group portfolio — Nine @ Central Orlando',
    url: 'https://908group.com/the-nine-central',
  },
  'Nine at College Park Maryland': {
    gc: 'FaverGray',
    architect: 'Humphreys & Partners Architects',
    source: '908 Group portfolio — Nine @ College Park',
    url: 'https://908group.com/portfolio',
  },

  // ── Lincoln Ventures / Rambler ─────────────────────────────────────
  'RAMBLER TEMPE': {
    gc: 'Layton Construction Company',
    architect: 'Shepley Bulfinch',
    designer: 'Variant Collaborative',
    source: 'LV Collective Rambler Tempe press — Layton GC, Shepley Bulfinch architect',
    url: 'https://www.laytonconstruction.com/rambler-tempe-groundbreaking/',
  },
  'RAMBLER ATHENS': {
    gc: 'Rabren General Contractors',
    architect: 'Niles Bolton Associates',
    designer: 'Krywicki Interior Design',
    source: 'LV Collective Rambler Athens delivery press release',
    url: 'https://lvcollective.com/press/lv-collective-delivers-luxury-student-housing-project-at-university-of-georgia/',
  },
  'RAMBLER ATLANTA': {
    gc: 'Layton Construction Company',
    architect: 'Niles Bolton Associates',
    source: 'LV Collective Rambler brand — repeat Layton/Niles Bolton student housing team',
    url: 'https://lvcollective.com/',
  },
  'RAMBLER COLUMBUS': {
    gc: 'Layton Construction Company',
    architect: 'Niles Bolton Associates',
    source: 'LV Collective Rambler brand development pattern',
    url: 'https://lvcollective.com/',
  },
  'SWEETWATER': {
    gc: 'Rabren General Contractors',
    architect: 'Niles Bolton Associates',
    source: 'Lincoln Ventures Gainesville — LV Collective regional GC/architect pattern',
  },

  // ── Subtext / Verve ────────────────────────────────────────────────
  'MX-006 Verve Knoxville': {
    gc: 'Brinkmann Constructors',
    architect: 'Dynamik Design',
    source: 'Subtext VERVE Knoxville groundbreaking press release',
    url: 'https://subtextliving.com/subtext-breaks-ground-verve-knoxville-student-housing-development-near-university-of-tennessee/',
  },
  'VERVE ANN ARBOR': {
    gc: 'Brinkmann Constructors',
    architect: 'WDG Architecture',
    designer: 'ESG Architecture & Design',
    source: 'Subtext VERVE Ann Arbor grand opening',
    url: 'https://subtextliving.com/subtext-celebrates-grand-opening-of-verve-ann-arbor-an-elevated-student-living-community-at-university-of-michigan/',
  },
  'VERVE ANN ARBOR SUBTEXT': {
    gc: 'Brinkmann Constructors',
    architect: 'WDG Architecture',
    designer: 'ESG Architecture & Design',
    source: 'Subtext VERVE Ann Arbor — same delivery as VERVE Ann Arbor',
    url: 'https://subtextliving.com/subtext-celebrates-grand-opening-of-verve-ann-arbor-an-elevated-student-living-community-at-university-of-michigan/',
  },
  'VERVE ANN ARBORSUBTEXT': {
    gc: 'Brinkmann Constructors',
    architect: 'WDG Architecture',
    designer: 'ESG Architecture & Design',
    source: 'Subtext VERVE Ann Arbor duplicate record',
  },
  'VERVE FAYETTEVILLE': {
    gc: 'Brinkmann Constructors',
    architect: 'Modus Studio',
    designer: 'Vida Design',
    source: 'MHN — Subtext VERVE Fayetteville Arkansas',
    url: 'https://www.multihousingnews.com/subtext-plans-first-arkansas-student-housing-development/',
  },
  'VERVE WEST LAFAYETTE': {
    gc: 'Brinkmann Constructors',
    architect: 'WDG Architecture',
    designer: 'Ankrom Moisan',
    source: 'Subtext VERVE West Lafayette grand opening',
    url: 'https://subtextliving.com/subtext-announces-grand-opening-of-verve-west-lafayette-its-first-student-housing-development-near-purdue-university/',
  },
  'VERVE COLUMBUS': {
    gc: 'Brinkmann Constructors',
    architect: 'WDG Architecture',
    source: 'Subtext Verve portfolio — Brinkmann repeat GC partner',
    url: 'https://subtextliving.com/',
  },
  'VERVE BOISE': {
    gc: 'Brinkmann Constructors',
    architect: 'WDG Architecture',
    source: 'Subtext Verve portfolio — Brinkmann/WDG pattern',
  },
  'VERVE MADISON': {
    gc: 'Stevens Construction Corp',
    architect: 'WDG Architecture',
    source: 'Registry stakeholder link Stevens GC + Subtext Brinkmann portfolio',
  },
  'VERVE TEMPE': {
    gc: 'Brinkmann Constructors',
    architect: 'WDG Architecture',
    source: 'Registry Brinkmann GC link + Subtext portfolio',
  },
  'EVER KNOXVILLE': {
    gc: 'Brinkmann Constructors',
    architect: 'WDG Architecture',
    source: 'Subtext Knoxville market — TENN/VERVE development team',
  },
  'VERVE NEW BRUNSWICK': {
    gc: 'Brinkmann Constructors',
    architect: 'WDG Architecture',
    source: 'Subtext Verve portfolio default team',
  },
  'VERVE ORLANDO': {
    gc: 'Brinkmann Constructors',
    architect: 'ESG Architecture & Design',
    source: 'Subtext Verve portfolio',
  },

  // ── Parallel ─────────────────────────────────────────────────────
  '250 Church': {
    gc: "Rogers-O'Brien Construction",
    architect: 'Rhode Partners',
    designer: 'A Royal Interiors',
    source: 'Parallel PR — 250 Church College Station (Rogers-O\'Brien GC, Rhode Partners architect)',
    url: 'https://www.newswire.com/news/parallel-announces-23-story-student-housing-development-in-college-22593848',
  },
  'COLLEGE MAIN PARALLEL': {
    gc: "Rogers-O'Brien Construction",
    architect: 'Rhode Partners',
    source: 'Parallel College Station Rev/Otto portfolio — Rogers-O\'Brien + Rhode Partners',
    url: 'https://www.prnewswire.com/news-releases/parallel-announces-a-new-student-housing-development-in-college-station-texas-301365426.html',
  },
  '401FS OTTO LEASING CENTER': {
    gc: "Rogers-O'Brien Construction",
    architect: 'BOKA Powell',
    source: 'Parallel Otto College Station — BOKA Powell architect per Parallel portfolio',
    url: 'https://www.parallel-co.com/david-pierce',
  },
  '401FS OTTO': {
    gc: "Rogers-O'Brien Construction",
    architect: 'BOKA Powell',
    source: 'Parallel Otto College Station',
  },
  '401FS College Station': {
    gc: "Rogers-O'Brien Construction",
    architect: 'Rhode Partners',
    source: 'Parallel College Station portfolio',
  },
  'LUMEN ON 9TH AVENUE COLUMBUS': {
    gc: "Rogers-O'Brien Construction",
    architect: 'Rhode Partners',
    source: 'Columbus Business First — Lumen on Ninth designed by Rhode Partners',
    url: 'https://www.bizjournals.com/columbus/news/2024/02/21/ohio-state-area-housing-apartments-lumen-ninth.html',
  },
  'LUMEN BIRMINGHAM': {
    gc: "Rogers-O'Brien Construction",
    architect: 'Rhode Partners',
    source: 'Parallel Lumen brand — Rhode Partners architect',
    url: 'https://www.parallel-co.com/',
  },
  '14th Street SH': {
    gc: 'Teinert Construction',
    architect: 'Rhode Partners',
    source: 'Registry Teinert GC link + Parallel Lubbock portfolio',
  },

  // ── American Campus Communities ──────────────────────────────────
  'FLAMINGO CROSSING': {
    gc: 'FaverGray',
    architect: 'Niles Bolton Associates',
    designer: 'Niles Bolton Associates',
    source: 'FaverGray / ACC — Flamingo Crossings Village delivery',
    url: 'https://favergray.com/favergray-announces-delivery-of-flamingo-crossings-village-10440-bed-development-for-disney-internships-programs-participants/',
  },
  'ACC Flamingo Crossing (main)': {
    gc: 'FaverGray',
    architect: 'Niles Bolton Associates',
    designer: 'Niles Bolton Associates',
    source: 'ACC Flamingo Crossings Village case study',
    url: 'https://www.americancampus.com/flamingo-crossings-village',
  },
  'Emory Student Housing': {
    gc: 'Juneau Construction Company',
    architect: 'Niles Bolton Associates',
    source: 'Registry Juneau GC link — Emory ACC student housing',
  },
  'GRANVILLE TOWERS': {
    gc: 'Clancy & Theys Construction Company',
    architect: 'Niles Bolton Associates',
    source: 'ACC Chapel Hill Granville Towers historic redevelopment pattern',
  },
  'MIT-ACC': {
    gc: 'Lee Kennedy Company',
    architect: 'Goody Clancy',
    source: 'ACC MIT on-campus partnership projects',
  },
  'TLO EMORY': {
    gc: 'Juneau Construction Company',
    architect: 'Niles Bolton Associates',
    source: 'ACC Emory market — Juneau student housing GC',
  },

  // ── Greystar Student Living ────────────────────────────────────────
  'THE MARSHALL': {
    gc: 'Kraus-Anderson Construction',
    architect: 'BKV Group',
    designer: 'BKV Group',
    source: 'BKV Group / Finance & Commerce — The Marshall Minneapolis (Greystar client)',
    url: 'https://bkvgroup.com/projects/the-marshall/',
  },
  'Union on Knox': {
    gc: 'John Moriarty & Associates',
    architect: 'WDG Architecture',
    source: 'WDG Architecture + JMA portfolio — Union on Knox (Greystar)',
    url: 'https://www.wdgarch.com/projects/union-on-knox',
  },
  'UNION ON KNOX LEASING OFFICE': {
    gc: 'John Moriarty & Associates',
    architect: 'WDG Architecture',
    source: 'Union on Knox same development',
  },
  'THE POINTE AT STATE COLLEGE': {
    gc: 'Poole Anderson Construction',
    architect: 'WDG Architecture',
    source: 'Greystar State College PA — WDG student housing portfolio',
  },
  'The Pointe State College PA': {
    gc: 'Poole Anderson Construction',
    architect: 'WDG Architecture',
    source: 'Greystar Pointe State College',
  },
  'UNION KNOXVILLE': {
    gc: 'Hoar Construction',
    architect: 'WDG Architecture',
    source: 'Greystar Union Knoxville — WDG architect pattern',
  },
  'HILLSIDE VILLAGE - 1791 SHATTUCK': {
    gc: 'Nibbi Brothers',
    architect: 'MBH Architects',
    source: 'Greystar Berkeley Hillside Village student housing',
  },
  'HILLSIDE VILLAGE LEASING CENTER': {
    gc: 'Nibbi Brothers',
    architect: 'MBH Architects',
    source: 'Greystar Hillside Village Berkeley',
  },
  'THE LOFTS - ORLANDO': {
    gc: 'Balfour Beatty Construction',
    architect: 'Humphreys & Partners Architects',
    source: 'Greystar UCF Lofts Orlando student housing delivery',
  },

  // ── Yugo / GSA-developed (construction teams, not operator) ───────
  'YUGO Salt Lake City': {
    gc: 'Willmeng Construction',
    architect: 'Niles Bolton Associates',
    source: 'Willmeng — Yugo Landing Salt Lake City renovation (GSA/WILL Group)',
    url: 'https://willmeng.com/pf/yugo-landing/',
  },
};

/** Operator-level fallbacks when property-specific team unknown. */
export const OPERATOR_DEFAULTS = {
  subtext: {
    gc: 'Brinkmann Constructors',
    architect: 'WDG Architecture',
    source: 'Subtext portfolio — Brinkmann Constructors repeat GC (11+ projects with Subtext)',
    url: 'https://subtextliving.com/',
  },
  parallel: {
    gc: "Rogers-O'Brien Construction",
    architect: 'Rhode Partners',
    source: 'Parallel portfolio — Rogers-O\'Brien + Rhode Partners College Station pattern',
    url: 'https://www.parallel-co.com/',
  },
  acc: {
    architect: 'Niles Bolton Associates',
    source: 'ACC portfolio — Niles Bolton repeat architect on major ACC deliveries',
    url: 'https://www.nilesbolton.com/',
  },
  greystar: {
    architect: 'WDG Architecture',
    source: 'Greystar student housing portfolio — WDG Architecture repeat partner',
    url: 'https://www.wdgarch.com/',
  },
};

export const STAKEHOLDER_TYPE_HINTS = {
  'Brinkmann Constructors': 'gc',
  'Layton Construction Company': 'gc',
  'Rabren General Contractors': 'gc',
  'ARCO Murray': 'gc',
  'FaverGray': 'gc',
  'Culpepper Construction Company': 'gc',
  "Rogers-O'Brien Construction": 'gc',
  'Teinert Construction': 'gc',
  'Kraus-Anderson Construction': 'gc',
  'John Moriarty & Associates': 'gc',
  'Poole Anderson Construction': 'gc',
  'Hoar Construction': 'gc',
  'Willmeng Construction': 'gc',
  'Stevens Construction Corp': 'gc',
  'Juneau Construction Company': 'gc',
  'Clancy & Theys Construction Company': 'gc',
  'Lee Kennedy Company': 'gc',
  'Nibbi Brothers': 'gc',
  'Balfour Beatty Construction': 'gc',
  'WDG Architecture': 'architect',
  'Rhode Partners': 'architect',
  'Shepley Bulfinch': 'architect',
  'Niles Bolton Associates': 'architect',
  'Forum Architecture': 'architect',
  'Humphreys & Partners Architects': 'architect',
  'Dynamik Design': 'architect',
  'Modus Studio': 'architect',
  'BOKA Powell': 'architect',
  'BKV Group': 'architect',
  'MBH Architects': 'architect',
  'Goody Clancy': 'architect',
  'ESG Architecture & Design': 'interior_designer',
  'Variant Collaborative': 'interior_designer',
  'Krywicki Interior Design': 'interior_designer',
  'Ankrom Moisan': 'interior_designer',
  'Vida Design': 'interior_designer',
  'A Royal Interiors': 'interior_designer',
};

export function lookupCurated(propertyName) {
  if (!propertyName) return null;
  if (CURATED_BY_PROPERTY[propertyName]) return CURATED_BY_PROPERTY[propertyName];
  const norm = propertyName.replace(/\s+/g, ' ').trim().toUpperCase();
  for (const [k, v] of Object.entries(CURATED_BY_PROPERTY)) {
    if (k.toUpperCase() === norm) return v;
  }
  return null;
}

export function isBlockedGc(name) {
  if (!name) return true;
  const u = name.trim().toUpperCase();
  if (PORTFOLIO_GC_BLOCKLIST.has(u)) return true;
  if (/^908\b|908 DEVELOPMENT|908 GROUP/.test(u)) return true;
  if (/^GREYSTAR|^ACC\b|AMERICAN CAMPUS/.test(u)) return true;
  if (/^SUBTEXT|^LINCOLN VENTURES|^PARALLEL|^YUGO$|^GSA$/.test(u)) return true;
  return false;
}
