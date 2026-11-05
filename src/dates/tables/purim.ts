import type { HolidayTable } from './types';

/** Purim day = 14 Adar (14 Adar II in leap years); the Megillah is first read the evening before. */
export const PURIM: HolidayTable = {
  id: 'purim',
  calendar: 'hebrew',
  convention: 'Purim day (14 Adar, or 14 Adar II in a leap year); the Megillah reading the evening before is derived by beginsAtSundown',
  source: 'Hebcal, Jewish holidays 2024–2035 (Purim day listed)',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'exact',
  rows: [
    { date: '2024-03-24' },
    { date: '2025-03-14' },
    { date: '2026-03-03' },
    { date: '2027-03-23' },
    { date: '2028-03-12' },
    { date: '2029-03-01' },
    { date: '2030-03-19' },
    { date: '2031-03-09' },
    { date: '2032-02-26' },
    { date: '2033-03-15' },
    { date: '2034-03-05' },
    { date: '2035-03-25' },
  ],
};
