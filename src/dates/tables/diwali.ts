import type { HolidayTable } from './types';

/**
 * Hindu festivals depend on the tithi at sunrise or pradosh and on adhik (leap) months, with
 * regional variation; `alt` records the other widely observed day when major calendars differ.
 */
export const DIWALI: HolidayTable = {
  id: 'diwali',
  calendar: 'hindu',
  convention: 'Lakshmi Puja day (Kartik Amavasya, pradosh rule) for New Delhi; alt = other widely used day',
  source: 'Drik Panchang, Diwali / Lakshmi Puja dates for New Delhi (2024–2035)',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'exact',
  rows: [
    { date: '2024-10-31', alt: '2024-11-01' },
    { date: '2025-10-20', alt: '2025-10-21' },
    { date: '2026-11-08' },
    { date: '2027-10-29' },
    { date: '2028-10-17' },
    { date: '2029-11-05' },
    { date: '2030-10-26' },
    { date: '2031-11-14' },
    { date: '2032-11-02' },
    { date: '2033-10-22' },
    { date: '2034-11-10' },
    { date: '2035-10-30', alt: '2035-10-31' },
  ],
};
