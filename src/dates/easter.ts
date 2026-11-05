import { fromDayNumber, type CivilDate, type DayNumber } from './civil';

/** Gregorian Easter Sunday (Meeus / Jones / Butcher). Valid for every Gregorian year. */
export function gregorianEaster(y: number): CivilDate {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { y, m: month, d: day };
}

/** Rata Die (R.D.; 0001-01-01 Gregorian = 1) of our DayNumber epoch 1970-01-01. */
const RD_OF_EPOCH = 719163;
/** Dershowitz–Reingold: the Julian epoch (Julian 0001-01-01) is R.D. −1 = Gregorian 0000-12-30. */
const JULIAN_EPOCH_RD = -1;

function julianLeap(y: number): boolean {
  // No year 0 in the Julian count: BCE years are leap when y mod 4 = 3.
  return (((y % 4) + 4) % 4) === (y > 0 ? 0 : 3);
}

/** Dershowitz–Reingold `fixed-from-julian`, shifted onto the 1970 day-number epoch. */
export function julianToDayNumber(y: number, m: number, d: number): DayNumber {
  const yy = y < 0 ? y + 1 : y;
  const rd =
    JULIAN_EPOCH_RD - 1 + 365 * (yy - 1) + Math.floor((yy - 1) / 4) + Math.floor((367 * m - 362) / 12) +
    (m <= 2 ? 0 : julianLeap(y) ? -1 : -2) + d;
  return rd - RD_OF_EPOCH;
}

/**
 * Orthodox (Julian-calendar) Easter, returned as the Gregorian civil date.
 * Meeus's Julian algorithm yields a Julian date; `julianToDayNumber` converts it (+13 days in
 * 1900–2099). Outside that window the Julian/Gregorian gap is different and our fixtures stop,
 * so the function refuses rather than silently drifting.
 */
export function julianEaster(y: number): CivilDate {
  if (!Number.isInteger(y) || y < 1900 || y > 2099) {
    throw new RangeError(`julianEaster: year ${y} is outside the supported range 1900–2099`);
  }
  const a = y % 4;
  const b = y % 7;
  const c = y % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return fromDayNumber(julianToDayNumber(y, month, day));
}
