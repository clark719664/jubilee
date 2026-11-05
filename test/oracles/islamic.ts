/**
 * Test-only oracle: the tabular (arithmetic) Islamic calendar after Dershowitz & Reingold:
 * a 30-year cycle with 11 leap years of 355 days, months alternating 30/29.
 * Real Islamic dates follow the sighting of the crescent, so the sighting-based tables
 * (Umm al-Qura) are only expected to agree with this oracle to within a couple of days.
 *
 * Dates are Rata Die (R.D.; Gregorian 0001-01-01 = 1), converted at the edge to civil dates.
 */
import { fromDayNumber, toDayNumber, type CivilDate } from '../../src/dates/civil';

export const MUHARRAM = 1;
export const RAMADAN = 9;
export const SHAWWAL = 10;
export const DHU_AL_HIJJAH = 12;

/** R.D. of 1970-01-01, our DayNumber epoch. */
const RD_OF_EPOCH = 719163;
/** fixed-from-julian(622, 7, 16): 1 Muharram AH 1. */
export const ISLAMIC_EPOCH_RD = 227015;

function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

/** Leap years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29 of the 30-year cycle. */
export function islamicLeapYear(year: number): boolean {
  return mod(14 + 11 * year, 30) < 11;
}

/** R.D. of an Islamic date. */
export function fixedFromIslamic(year: number, month: number, day: number): number {
  return (
    ISLAMIC_EPOCH_RD - 1 + (year - 1) * 354 + Math.floor((3 + 11 * year) / 30) +
    29 * (month - 1) + Math.floor(month / 2) + day
  );
}

export interface IslamicDate { readonly year: number; readonly month: number; readonly day: number }

export function islamicFromFixed(rd: number): IslamicDate {
  const year = Math.floor((30 * (rd - ISLAMIC_EPOCH_RD) + 10646) / 10631);
  const priorDays = rd - fixedFromIslamic(year, 1, 1);
  const month = Math.floor((11 * priorDays + 330) / 325);
  const day = rd - fixedFromIslamic(year, month, 1) + 1;
  return { year, month, day };
}

export function rdToCivil(rd: number): CivilDate {
  return fromDayNumber(rd - RD_OF_EPOCH);
}

export function civilToRd(c: CivilDate): number {
  return toDayNumber(c) + RD_OF_EPOCH;
}

/** Gregorian civil date of a tabular Islamic date. */
export function islamicToCivil(year: number, month: number, day: number): CivilDate {
  return rdToCivil(fixedFromIslamic(year, month, day));
}

export function civilToIslamic(c: CivilDate): IslamicDate {
  return islamicFromFixed(civilToRd(c));
}
