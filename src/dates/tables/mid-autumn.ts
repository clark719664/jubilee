import type { HolidayTable } from './types';

/** 15th day of the 8th lunar month. Chuseok (Korea) reuses this table; identical through at least 2030 (KASI). */
export const MID_AUTUMN: HolidayTable = {
  id: 'mid-autumn',
  calendar: 'chinese',
  convention: '15th day of the 8th lunar month (Chinese calendar, UTC+8); the Mid-Autumn day itself',
  source: 'Hong Kong Observatory, Gregorian-Lunar Calendar Conversion Table (2024–2035)',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'exact',
  rows: [
    { date: '2024-09-17' },
    { date: '2025-10-06' },
    { date: '2026-09-25' },
    { date: '2027-09-15' },
    { date: '2028-10-03' },
    { date: '2029-09-22' },
    { date: '2030-09-12' },
    { date: '2031-10-01' },
    { date: '2032-09-19' },
    { date: '2033-09-08' },
    { date: '2034-09-27' },
    { date: '2035-09-16' },
  ],
};
