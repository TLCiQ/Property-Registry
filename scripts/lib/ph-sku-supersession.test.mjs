#!/usr/bin/env node
/**
 * Smoke test: PH phantom supersession matching rules (no DB).
 */
import {
  phantomsSupersededByActual,
  isPhantomSkuSource,
  buildActualSkuMetadata,
} from './ph-sku-supersession.mjs';

const pool = [
  {
    id: '1',
    unit_type_id: 'ut-a',
    sku: 'VN1234',
    room_label: '',
    source: 'ph_csl_workbook',
    metadata: { deal_number: '27-006', phantom: true },
  },
  {
    id: '2',
    unit_type_id: 'ut-a',
    sku: 'PH_wb_row_42',
    room_label: '',
    source: 'ph_csl_workbook',
    metadata: { deal_number: '27-006', canonical_sku: 'VN1234' },
  },
  {
    id: '3',
    unit_type_id: 'ut-a',
    sku: 'VN9999',
    room_label: '',
    source: 'ph_csl_workbook',
    metadata: { deal_number: '26-008' },
  },
];

const ctx = { unitTypeId: 'ut-a', actualSku: 'VN1234', roomLabel: '', dealNumber: '27-006' };
const hit = phantomsSupersededByActual(pool, ctx);
console.assert(hit.length === 2 && hit.map((h) => h.id).sort().join() === '1,2', 'direct + PH_ alias');
console.assert(!phantomsSupersededByActual(pool, { ...ctx, dealNumber: '26-009' }).length, 'deal scope');

const meta = buildActualSkuMetadata({
  existingRow: pool[0],
  dealNumber: '27-006',
  productionLineKey: 'req-uuid',
});
console.assert(meta.ph_supersession?.prior_phantom?.source === 'ph_csl_workbook', 'prior phantom audit');
console.assert(isPhantomSkuSource('ph_csl_workbook'), 'source check');

console.log('ph-sku-supersession: ok');
