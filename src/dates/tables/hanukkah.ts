import type { HolidayTable } from './types';

/** First full day = 25 Kislev; the first candle is lit the evening before (derived by beginsAtSundown). */
export const HANUKKAH: HolidayTable = {
  id: 'hanukkah',
  calendar: 'hebrew',
  convention: 'First full day (25 Kislev); the first candle is lit the evening before, derived by beginsAtSundown',
  source: 'Hebcal, Jewish holidays 2024–2035 (first day listed; the holiday begins the evening before)',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'exact',
  rows: [
    { date: '2024-12-26' },
    { date: '2025-12-15' },
    { date: '2026-12-05' },
    { date: '2027-12-25' },
    { date: '2028-12-13' },
    { date: '2029-12-02' },
    { date: '2030-12-21' },
    { date: '2031-12-10' },
    { date: '2032-11-28' },
    { date: '2033-12-17' },
    { date: '2034-12-07' },
    { date: '2035-12-26' },
  ],
};
