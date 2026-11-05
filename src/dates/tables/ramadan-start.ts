import type { HolidayTable } from './types';

/**
 * Islamic months begin with the sighting of the new crescent, so dates vary by country by about a
 * day; the Umm al-Qura calendar is the reference and the UI labels these "expected".
 * 13 rows: the Islamic year is ~11 days shorter, so 2030 holds two Ramadan starts.
 */
export const RAMADAN_START: HolidayTable = {
  id: 'ramadan-start',
  calendar: 'islamic',
  convention: 'First day of fasting (1 Ramadan); the span runs until the next eid-al-fitr row (exclusive)',
  source: 'Umm al-Qura calendar (Saudi Arabia), 1 Ramadan AH 1445–1457',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'sighting',
  rows: [
    { date: '2024-03-11' },
    { date: '2025-03-01' },
    { date: '2026-02-18' },
    { date: '2027-02-08' },
    { date: '2028-01-28' },
    { date: '2029-01-16' },
    { date: '2030-01-05' },
    { date: '2030-12-26' },
    { date: '2031-12-15' },
    { date: '2032-12-04' },
    { date: '2033-11-23' },
    { date: '2034-11-12' },
    { date: '2035-11-01' },
  ],
};
