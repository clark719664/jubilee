import type { HolidayTable } from './types';

/** First full day = 15 Nisan; the first seder is the evening before (derived by beginsAtSundown). */
export const PASSOVER: HolidayTable = {
  id: 'passover',
  calendar: 'hebrew',
  convention: 'First full day (15 Nisan); the first seder is the evening before, derived by beginsAtSundown',
  source: 'Hebcal, Jewish holidays 2024–2035 (first day listed; the holiday begins the evening before)',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'exact',
  rows: [
    { date: '2024-04-23' },
    { date: '2025-04-13' },
    { date: '2026-04-02' },
    { date: '2027-04-22' },
    { date: '2028-04-11' },
    { date: '2029-03-31' },
    { date: '2030-04-18' },
    { date: '2031-04-08' },
    { date: '2032-03-27' },
    { date: '2033-04-14' },
    { date: '2034-04-04' },
    { date: '2035-04-24' },
  ],
};
