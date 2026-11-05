import type { HolidayTable } from './types';

/** 1 Shawwal. 13 rows: 2033 holds two Eid al-Fitr days (2 January and 23 December). */
export const EID_AL_FITR: HolidayTable = {
  id: 'eid-al-fitr',
  calendar: 'islamic',
  convention: 'First day of Eid (1 Shawwal), expected date; depends on the sighting of the new moon',
  source: 'Umm al-Qura calendar (Saudi Arabia), 1 Shawwal AH 1445–1457',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'sighting',
  rows: [
    { date: '2024-04-10' },
    { date: '2025-03-30' },
    { date: '2026-03-20' },
    { date: '2027-03-09' },
    { date: '2028-02-26' },
    { date: '2029-02-14' },
    { date: '2030-02-04' },
    { date: '2031-01-24' },
    { date: '2032-01-14' },
    { date: '2033-01-02' },
    { date: '2033-12-23' },
    { date: '2034-12-12' },
    { date: '2035-12-01' },
  ],
};
