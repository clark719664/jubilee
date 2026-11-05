import type { HolidayTable } from './types';

/** 5th day of the 5th lunar month (Duanwu). */
export const DRAGON_BOAT: HolidayTable = {
  id: 'dragon-boat',
  calendar: 'chinese',
  convention: '5th day of the 5th lunar month (Chinese calendar, UTC+8)',
  source: 'Hong Kong Observatory, Gregorian-Lunar Calendar Conversion Table (2024–2035)',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'exact',
  rows: [
    { date: '2024-06-10' },
    { date: '2025-05-31' },
    { date: '2026-06-19' },
    { date: '2027-06-09' },
    { date: '2028-05-28' },
    { date: '2029-06-16' },
    { date: '2030-06-05' },
    { date: '2031-06-24' },
    { date: '2032-06-12' },
    { date: '2033-06-01' },
    { date: '2034-06-20' },
    { date: '2035-06-10' },
  ],
};
