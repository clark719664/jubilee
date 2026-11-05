import { parseIso, toDayNumber, type DayNumber, type IsoDate } from '../civil';
import { DIWALI } from './diwali';
import { DRAGON_BOAT } from './dragon-boat';
import { EID_AL_ADHA } from './eid-al-adha';
import { EID_AL_FITR } from './eid-al-fitr';
import { HANUKKAH } from './hanukkah';
import { HOLI } from './holi';
import { LUNAR_NEW_YEAR } from './lunar-new-year';
import { MID_AUTUMN } from './mid-autumn';
import { NOWRUZ } from './nowruz';
import { PASSOVER } from './passover';
import { PURIM } from './purim';
import { RAMADAN_START } from './ramadan-start';
import { ROSH_HASHANAH } from './rosh-hashanah';
import type { HolidayTable, TableId, TableRow } from './types';

export type { CalendarKind, HolidayTable, TableId, TableRow } from './types';

/** Every lookup table, keyed by id. Rows are ordered lists, never year-keyed (2030 has two Ramadans). */
export const TABLES: Record<TableId, HolidayTable> = {
  'lunar-new-year': LUNAR_NEW_YEAR,
  'mid-autumn': MID_AUTUMN,
  'dragon-boat': DRAGON_BOAT,
  diwali: DIWALI,
  holi: HOLI,
  'rosh-hashanah': ROSH_HASHANAH,
  hanukkah: HANUKKAH,
  passover: PASSOVER,
  purim: PURIM,
  'ramadan-start': RAMADAN_START,
  'eid-al-fitr': EID_AL_FITR,
  'eid-al-adha': EID_AL_ADHA,
  nowruz: NOWRUZ,
};

export const TABLE_IDS: readonly TableId[] = Object.keys(TABLES) as TableId[];

/** Day number of a table ISO date. Tables are validated by tests, so a bad literal is a programming error. */
export function dayOf(iso: IsoDate): DayNumber {
  const c = parseIso(iso);
  if (!c) throw new Error(`table date is not a valid ISO date: ${iso}`);
  return toDayNumber(c);
}

/** Day numbers per table, computed once (rows are tiny; this keeps the hot paths allocation-free). */
const DAYS = new Map<TableId, readonly DayNumber[]>();

function daysOf(id: TableId): readonly DayNumber[] {
  let days = DAYS.get(id);
  if (!days) {
    days = TABLES[id].rows.map((r) => dayOf(r.date));
    DAYS.set(id, days);
  }
  return days;
}

/** Rows whose civil date falls in the Gregorian `year` (0, 1 or 2 of them). */
export function rowsInYear(id: TableId, year: number): readonly TableRow[] {
  return TABLES[id].rows.filter((r) => Number(r.date.slice(0, 4)) === year);
}

/** The first row strictly after `dayNumber`, or undefined when the table ends first. */
export function rowAfter(id: TableId, dayNumber: DayNumber): TableRow | undefined {
  const days = daysOf(id);
  for (let i = 0; i < days.length; i++) {
    if (days[i]! > dayNumber) return TABLES[id].rows[i];
  }
  return undefined;
}

/** Day number of the first row strictly after `dayNumber`. Throws beyond coverage: nothing is approximated. */
export function nextRowAfter(id: TableId, dayNumber: DayNumber): DayNumber {
  const row = rowAfter(id, dayNumber);
  if (!row) {
    throw new RangeError(`table ${id} has no row after day ${dayNumber}; coverage ends in ${TABLES[id].coverage.to}`);
  }
  return dayOf(row.date);
}

/** True while the table still reaches a year past `currentYear`, so it is extended a year early. */
export function coverageOk(id: TableId, currentYear: number): boolean {
  return TABLES[id].coverage.to >= currentYear + 1;
}
