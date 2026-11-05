import type { HolidayTable } from './types';

/** 10 Dhu al-Hijjah. 12 rows for AH 1445–1456 (Dhu al-Hijjah 1457 falls in 2036). */
export const EID_AL_ADHA: HolidayTable = {
  id: 'eid-al-adha',
  calendar: 'islamic',
  convention: 'First day of Eid (10 Dhu al-Hijjah), expected date; depends on the sighting of the new moon',
  source: 'Umm al-Qura calendar (Saudi Arabia), 10 Dhu al-Hijjah AH 1445–1456',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'sighting',
  rows: [
    { date: '2024-06-16' },
    { date: '2025-06-06' },
    { date: '2026-05-27' },
    { date: '2027-05-16' },
    { date: '2028-05-05' },
    { date: '2029-04-24' },
    { date: '2030-04-13' },
    { date: '2031-04-02' },
    { date: '2032-03-22' },
    { date: '2033-03-11' },
    { date: '2034-03-01' },
    { date: '2035-02-18' },
  ],
};
