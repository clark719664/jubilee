import type { HolidayTable } from './types';

/** Rangwali Holi (Dhulandi), the color day after Holika Dahan. */
export const HOLI: HolidayTable = {
  id: 'holi',
  calendar: 'hindu',
  convention: 'Rangwali Holi / Dhulandi (the day after Holika Dahan on Phalguna Purnima) for New Delhi; alt = other widely used day',
  source: 'Drik Panchang, Holi (Rangwali Holi) dates for New Delhi (2024–2035)',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'exact',
  rows: [
    { date: '2024-03-25' },
    { date: '2025-03-14' },
    { date: '2026-03-04', alt: '2026-03-03' },
    {
      date: '2027-03-23',
      alt: '2027-03-22',
      note: 'Contested: the full-moon tithi runs from the evening of 21 March into the afternoon of the 22nd with Bhadra past midnight, the same shape as 2023, so most calendars put Holika Dahan on the 22nd and colors on the 23rd; some regions celebrate a day earlier',
    },
    { date: '2028-03-11' },
    { date: '2029-03-01' },
    { date: '2030-03-20' },
    { date: '2031-03-09' },
    { date: '2032-03-27' },
    { date: '2033-03-16' },
    { date: '2034-03-05' },
    { date: '2035-03-24' },
  ],
};
