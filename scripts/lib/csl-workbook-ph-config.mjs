/**
 * CSL PH workbook ingest job definitions.
 *
 * Resolution order (see ingest-csl-workbook-ph.mjs):
 *   1. --local=path
 *   2. boxFileId (Sales CSL xlsx when uploaded)
 *   3. boxSearchSalesCsl (Sales …/Project Workbooks/CSL)
 *   4. fallbackBoxFileId (interim: Production Sage invoice PDF until Sales xlsx exists)
 */
export const CSL_PH_JOBS = [
  {
    registryProjectId: '27-006-I',
    prodDealNumber: '27-006',
    label: 'Hub Bloomington Lincoln II — fixed',
    scope: 'fixed',
    roomLabel: 'FIXED',
    /** Sales CSL xlsx not uploaded yet (Jul 2026) — only contract PDF in 2027 folder */
    boxFileId: null,
    boxSearchSalesCsl: '27-006-I Hub Bloomington',
    salesPathMustInclude: ['Project Workbooks', 'CSL'],
    fallbackBoxFileId: '2247592607653',
    fallbackBoxFileName: '27-006-I FIXED.pdf',
    workbookFormat: 'sage_invoice_pdf',
  },
  {
    registryProjectId: '27-007-I',
    prodDealNumber: '27-007',
    label: 'Hub Bloomington Lincoln II — loose',
    scope: 'loose',
    roomLabel: 'LOOSE',
    boxFileId: null,
    boxSearchSalesCsl: '27-007-I Hub Bloomington',
    salesPathMustInclude: ['Project Workbooks', 'CSL'],
    fallbackBoxFileId: '2247587282236',
    fallbackBoxFileName: '27-007-I LOOSE.pdf',
    workbookFormat: 'sage_invoice_pdf',
    /** Partial Asia PO (island tops only) — not used for PH BOM */
    supplementBoxFileId: '2263851128994',
  },
];

/** Sales folder path fragment for canonical Quote Rev project workbooks */
export const SALES_CSL_WORKBOOK_PATH = 'Sales - Student Housing - Projects';

export function getJob(filter) {
  if (!filter) return null;
  return CSL_PH_JOBS.find(
    (j) =>
      j.registryProjectId === filter ||
      j.prodDealNumber === filter ||
      j.scope === filter,
  );
}

export function listJobs(onlyFilter) {
  if (!onlyFilter) return CSL_PH_JOBS;
  const set = new Set(onlyFilter.split(',').map((s) => s.trim()).filter(Boolean));
  return CSL_PH_JOBS.filter(
    (j) => set.has(j.registryProjectId) || set.has(j.prodDealNumber) || set.has(j.scope),
  );
}
