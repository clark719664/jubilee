import type { HolidayTable } from './types';

/**
 * Chinese lunisolar months begin at astronomical new moons reckoned in UTC+8, and leap months are
 * placed by solar terms, so the first day of the year is looked up rather than computed.
 */
export const LUNAR_NEW_YEAR: HolidayTable = {
  id: 'lunar-new-year',
  calendar: 'chinese',
  convention: 'First day of the first lunar month (new moon in UTC+8); the zodiac animal of the year that begins',
  source: 'Hong Kong Observatory, Gregorian-Lunar Calendar Conversion Table (2024–2035)',
  retrieved: '2026-10-22',
  coverage: { from: 2024, to: 2035 },
  confidence: 'exact',
  rows: [
    { date: '2024-02-10', note: 'Year of the Dragon' },
    { date: '2025-01-29', note: 'Year of the Snake' },
    { date: '2026-02-17', note: 'Year of the Horse' },
    { date: '2027-02-06', alt: '2027-02-07', note: 'Year of the Goat (Korea celebrates Seollal on 7 February: the new moon falls at 23:56 Beijing time)' },
    { date: '2028-01-26', alt: '2028-01-27', note: 'Year of the Monkey (Korea celebrates Seollal on 27 January)' },
    { date: '2029-02-13', note: 'Year of the Rooster' },
    { date: '2030-02-03', note: 'Year of the Dog (Vietnam may celebrate Tết on 2 February)' },
    { date: '2031-01-23', note: 'Year of the Pig' },
    { date: '2032-02-11', note: 'Year of the Rat' },
    { date: '2033-01-31', note: 'Year of the Ox' },
    { date: '2034-02-19', note: 'Year of the Tiger' },
    { date: '2035-02-08', note: 'Year of the Rabbit' },
  ],
};
