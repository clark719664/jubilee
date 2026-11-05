/**
 * Test-only oracle: the arithmetic Hebrew calendar after Dershowitz & Reingold, *Calendrical
 * Calculations* (molad, elapsed days, dehiyyot, year-length corrections, variable Cheshvan/Kislev).
 * The app never ships this; the lookup tables must agree with it for every row.
 *
 * Dates are Rata Die (R.D.; Gregorian 0001-01-01 = 1), converted at the edge to civil dates.
 */
import { fromDayNumber, type CivilDate } from '../../src/dates/civil';

export const NISAN = 1;
export const IYYAR = 2;
export const SIVAN = 3;
export const TAMMUZ = 4;
export const AV = 5;
export const ELUL = 6;
export const TISHRI = 7;
export const MARHESHVAN = 8;
export const KISLEV = 9;
export const TEVET = 10;
export const SHEVAT = 11;
export const ADAR = 12;
export const ADAR_II = 13;

/** R.D. of 1970-01-01, our DayNumber epoch. */
const RD_OF_EPOCH = 719163;
/** fixed-from-julian(-3761, 10, 7). */
export const HEBREW_EPOCH_RD = -1373427;

/** Leap years are 3, 6, 8, 11, 14, 17 and 19 of the 19-year cycle: (7y + 1) mod 19 < 7. */
export function hebrewLeapYear(year: number): boolean {
  return mod(7 * year + 1, 19) < 7;
}

export function lastMonthOfHebrewYear(year: number): number {
  return hebrewLeapYear(year) ? ADAR_II : ADAR;
}

function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

/**
 * Moment (R.D. with fraction) of the molad of `month` in `year`: the mean conjunction, counted in
 * months of 29d 12h 793p from the epoch's first molad (which fell 876 parts before day start).
 */
export function molad(month: number, year: number): number {
  const y = month < TISHRI ? year + 1 : year;
  const monthsElapsed = month - TISHRI + Math.floor((235 * y - 234) / 19);
  return HEBREW_EPOCH_RD - 876 / 25920 + monthsElapsed * (29 + 12 / 24 + 793 / 25920);
}

/**
 * Days from the epoch to the (possibly postponed) new year of `year`. The parts arithmetic folds
 * the molad of Tishri together with the dehiyyot "molad zaken" (noon) and "lo ADU rosh"
 * (never Sunday, Wednesday, Friday) into one integer test: `(3 (days + 1)) mod 7 < 3`.
 */
export function hebrewCalendarElapsedDays(year: number): number {
  const monthsElapsed = Math.floor((235 * year - 234) / 19);
  const partsElapsed = 12084 + 13753 * monthsElapsed;
  const days = 29 * monthsElapsed + Math.floor(partsElapsed / 25920);
  return mod(3 * (days + 1), 7) < 3 ? days + 1 : days;
}

/** The remaining two dehiyyot (GaTaRaD, BeTU'TaKPaT) expressed as a year-length correction. */
export function hebrewYearLengthCorrection(year: number): number {
  const ny0 = hebrewCalendarElapsedDays(year - 1);
  const ny1 = hebrewCalendarElapsedDays(year);
  const ny2 = hebrewCalendarElapsedDays(year + 1);
  if (ny2 - ny1 === 356) return 2;
  if (ny1 - ny0 === 382) return 1;
  return 0;
}

/** R.D. of 1 Tishri of `year`. */
export function hebrewNewYear(year: number): number {
  return HEBREW_EPOCH_RD + hebrewCalendarElapsedDays(year) + hebrewYearLengthCorrection(year);
}

/** 353, 354, 355 (common) or 383, 384, 385 (leap). */
export function daysInHebrewYear(year: number): number {
  return hebrewNewYear(year + 1) - hebrewNewYear(year);
}

export function longMarheshvan(year: number): boolean {
  const n = daysInHebrewYear(year);
  return n === 355 || n === 385;
}

export function shortKislev(year: number): boolean {
  const n = daysInHebrewYear(year);
  return n === 353 || n === 383;
}

/** Month lengths alternate 30/29, with Cheshvan and Kislev absorbing the year's deficiency/abundance. */
export function lastDayOfHebrewMonth(month: number, year: number): number {
  if (
    month === IYYAR || month === TAMMUZ || month === ELUL || month === TEVET || month === ADAR_II ||
    (month === ADAR && !hebrewLeapYear(year)) ||
    (month === MARHESHVAN && !longMarheshvan(year)) ||
    (month === KISLEV && shortKislev(year))
  ) {
    return 29;
  }
  return 30;
}

/** R.D. of a Hebrew date. Months are counted from Tishri (the civil new year), wrapping after the last month. */
export function fixedFromHebrew(year: number, month: number, day: number): number {
  let days = hebrewNewYear(year) + day - 1;
  if (month < TISHRI) {
    for (let m = TISHRI; m <= lastMonthOfHebrewYear(year); m++) days += lastDayOfHebrewMonth(m, year);
    for (let m = NISAN; m < month; m++) days += lastDayOfHebrewMonth(m, year);
  } else {
    for (let m = TISHRI; m < month; m++) days += lastDayOfHebrewMonth(m, year);
  }
  return days;
}

export function rdToCivil(rd: number): CivilDate {
  return fromDayNumber(rd - RD_OF_EPOCH);
}

/** Gregorian civil date of a Hebrew date. */
export function hebrewToCivil(year: number, month: number, day: number): CivilDate {
  return rdToCivil(fixedFromHebrew(year, month, day));
}

/** The Hebrew year that begins (1 Tishri) in Gregorian `gregorianYear`. */
export function hebrewYearStartingIn(gregorianYear: number): number {
  return gregorianYear + 3761;
}

/** Purim is 14 Adar, or 14 Adar II in a leap year. */
export function purimMonth(year: number): number {
  return hebrewLeapYear(year) ? ADAR_II : ADAR;
}
