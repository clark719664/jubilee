import type { HolidayTable } from './types';

/**
 * Nowruz falls on the day of the March equinox in Tehran: if the equinox instant (converted to
 * UTC+3:30; Iran dropped DST in 2022) is before 12:00, that day; otherwise the next day.
 */
export const NOWRUZ: HolidayTable = {
  id: 'nowruz',
  calendar: 'astronomical',
  convention: 'March equinox instant in Tehran time (UTC+3:30): before noon → that day, otherwise the next day',
  source: 'US Naval Observatory / timeanddate March equinox instants 2024–2035, converted to UTC+3:30',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'exact',
  rows: [
    { date: '2024-03-20' },
    { date: '2025-03-21' },
    { date: '2026-03-21' },
    { date: '2027-03-21' },
    { date: '2028-03-20' },
    { date: '2029-03-20' },
    { date: '2030-03-21' },
    { date: '2031-03-21' },
    { date: '2032-03-20' },
    { date: '2033-03-20' },
    { date: '2034-03-21' },
    { date: '2035-03-21' },
  ],
};
