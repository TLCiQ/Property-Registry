/**
 * Parse BSI subcontract PDF text + SCHEDULE_MTO xlsx into plan milestones and pacing.
 */
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const MONTHS =
  'january|february|march|april|may|june|july|august|september|october|november|december';

export function parseFlexibleDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim().replace(/\s+/g, ' ');
  if (!s) return null;

  let m = s.match(new RegExp(`^(${MONTHS})\\s+(\\d{1,2}),?\\s+(\\d{4})$`, 'i'));
  if (m) {
    const d = new Date(`${m[1]} ${m[2]}, ${m[3]} UTC`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let y = parseInt(m[3], 10);
    if (y < 100) y += y >= 70 ? 1900 : 2000;
    const d = new Date(Date.UTC(y, parseInt(m[1], 10) - 1, parseInt(m[2], 10)));
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

function addMilestone(map, name, date, category, source) {
  const iso = parseFlexibleDate(date);
  if (!iso) return;
  const key = name.toLowerCase();
  if (!map.has(key)) {
    map.set(key, {
      milestone_name: name,
      target_date: iso,
      milestone_category: category,
      source_field_path: source,
      status: 'pending',
    });
  }
}

export function parseContractText(text) {
  const milestones = new Map();
  const pacing = {};
  const meta = {};

  const contractDate =
    text.match(new RegExp(`Date:\\s*(\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|(?:${MONTHS})\\s+\\d{1,2},?\\s+\\d{4})`, 'i'))?.[1] ||
    text.match(/made this\s+\d{1,2}(?:st|nd|rd|th)?\s+day of\s+([A-Za-z]+)\s*,?\s*(\d{4})/i);
  if (contractDate) {
    const iso = parseFlexibleDate(Array.isArray(contractDate) ? `${contractDate[1]} 1, ${contractDate[2]}` : contractDate);
    if (iso) {
      meta.contract_date = iso;
      addMilestone(milestones, 'Contract Executed', iso, 'contract', 'contract:executed_date');
    }
  }

  const labelPatterns = [
    ['Plans Dated', /Plans\s+Dated[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/gi, 'contract'],
    ['First Delivery (Truck 1)', /First\s+Delivery(?:\s*\([^)]+\))?[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/gi, 'delivery'],
    ['ROSD', /(?:ROSD|Required\s+On[- ]Site\s+Date)[:\s(]*(?:Truck\s*\d+)?[):\s]*(\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/gi, 'delivery'],
    ['Last Delivery', /Last\s+Delivery[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/gi, 'delivery'],
    ['Install Start', /Install\s+Start[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/gi, 'install'],
    ['Install Complete', /Install\s+Complete[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/gi, 'install'],
    ['Substantial Completion', /Substantial\s+Completion[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/gi, 'contract'],
  ];
  for (const [name, re, category] of labelPatterns) {
    for (const m of text.matchAll(re)) addMilestone(milestones, name, m[1], category, `contract:${name}`);
  }

  const commence = text.match(/commence on or about\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  if (commence) {
    addMilestone(milestones, 'Work Commencement (Contract)', commence[1], 'install', 'contract:exhibit_b1_commence');
    pacing.work_commence = parseFlexibleDate(commence[1]);
  }

  const fab = text.match(/Fabrication time.*?(\d+)\s+Calendar Days/i);
  if (fab) pacing.fabrication_calendar_days = parseInt(fab[1], 10);

  const shopWeeks = text.match(/Shop drawings.*?within\s+(?:two\s+\(2\)|(\d+))\s*weeks/i);
  if (shopWeeks) {
    pacing.shop_drawings_weeks = shopWeeks[1] ? parseInt(shopWeeks[1], 10) : 2;
  }

  const installRate = text.match(/Installation\s*=\s*(?:Five\s+\(5\)|(\d+))\s+units per day/i);
  if (installRate) pacing.install_units_per_day = installRate[1] ? parseInt(installRate[1], 10) : 5;

  // MS Project schedule rows (IBG Exhibit D)
  for (const m of text.matchAll(
    /\n\s*\d+\s+.*?(Millwork Complete|Cabinet(?:ry)? Complete|Countertops? Complete|Cabinets.*?Complete|Millwork.*?Complete).*?\s(\d{1,2}\/\d{1,2}\/\d{2,4})/gi,
  )) {
    addMilestone(milestones, m[1].replace(/\s+/g, ' '), m[2], 'contract', `contract:exhibit_d:${m[1]}`);
  }

  // Drawing log → Plans Dated if not already set (CD Permit revision dates)
  if (![...milestones.keys()].some((k) => k.includes('plans dated'))) {
    const archDates = [];
    for (const m of text.matchAll(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b\s+CD Permit/gi)) {
      const iso = parseFlexibleDate(m[1]);
      if (!iso) continue;
      const y = parseInt(iso.slice(0, 4), 10);
      if (y >= 2020 && y <= 2035) archDates.push(iso);
    }
    if (archDates.length) {
      archDates.sort();
      // Earliest CD Permit date = original plan issue (drawing logs often repeat with layout artifacts)
      addMilestone(milestones, 'Plans Dated', archDates[0], 'contract', 'contract:drawing_log_cd_permit');
    }
  }

  const dates = [...milestones.values()].map((x) => x.target_date).filter(Boolean).sort();
  if (dates.length) {
    meta.schedule_year = parseInt(dates[0].slice(0, 4), 10);
    meta.estimated_completion_date = dates[dates.length - 1];
    if (pacing.work_commence) meta.install_start_date = pacing.work_commence;
  }

  return {
    milestones: [...milestones.values()],
    pacing,
    meta,
  };
}

export function pdfToText(pdfPath) {
  return execSync(`pdftotext -layout "${pdfPath}" -`, {
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  });
}

export function parseScheduleMtoViaPython(xlsxPath) {
  const script = resolve(dirname(fileURLToPath(import.meta.url)), 'parse-schedule-mto.py');
  const out = execSync(`python3 "${script}" "${xlsxPath}"`, {
    encoding: 'utf8',
    maxBuffer: 5 * 1024 * 1024,
  });
  const trucks = JSON.parse(out.trim());
  const milestones = [];
  if (trucks.length) {
    milestones.push({
      milestone_name: 'First Delivery (Truck 1)',
      target_date: trucks[0].truck_date,
      milestone_category: 'delivery',
      source_field_path: 'schedule_mto:truck_1',
      status: 'pending',
    });
    milestones.push({
      milestone_name: 'Last Delivery',
      target_date: trucks[trucks.length - 1].truck_date,
      milestone_category: 'delivery',
      source_field_path: 'schedule_mto:last_truck',
      status: 'pending',
    });
    const rosd = trucks.find((t) => t.rosd)?.rosd;
    if (rosd) {
      milestones.push({
        milestone_name: 'ROSD',
        target_date: rosd,
        milestone_category: 'delivery',
        source_field_path: 'schedule_mto:rosd',
        status: 'pending',
      });
    }
  }
  return { trucks, milestones };
}

export function mergeMilestones(...groups) {
  const map = new Map();
  for (const group of groups) {
    for (const m of group || []) {
      const key = m.milestone_name.toLowerCase();
      if (!map.has(key) || m.source_field_path?.startsWith('schedule_mto')) {
        map.set(key, m);
      }
    }
  }
  return [...map.values()].sort((a, b) => a.target_date.localeCompare(b.target_date));
}
