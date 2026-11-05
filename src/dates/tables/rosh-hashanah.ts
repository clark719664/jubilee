import type { HolidayTable } from './types';

/**
 * The Hebrew calendar is arithmetic, but its postponement rules (dehiyyot) are a bug farm, so the
 * app ships a table and the arithmetic lives in a test-only oracle that must agree with every row.
 */
export const ROSH_HASHANAH: HolidayTable = {
  id: 'rosh-hashanah',
  calendar: 'hebrew',
  convention: 'First full day (1 Tishrei); the eve (Erev Rosh Hashanah) is derived by beginsAtSundown',
  source: 'Hebcal, Jewish holidays 2024–2035 (first day listed; the holiday begins the evening before)',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'exact',
  rows: [
    { date: '2024-10-03' },
    { date: '2025-09-23' },
    { date: '2026-09-12' },
    { date: '2027-10-02' },
    { date: '2028-09-21' },
    { date: '2029-09-10' },
    { date: '2030-09-28' },
    { date: '2031-09-18' },
    { date: '2032-09-06' },
    { date: '2033-09-24' },
    { date: '2034-09-14' },
    { date: '2035-10-04' },
  ],
};
