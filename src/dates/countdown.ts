import type { HolidayMeta } from '../content/types';
import { fill, plural } from '../i18n/index';
import { toDayNumber, type CivilDate, type DayNumber } from './civil';
import type { Occurrence, Status } from './occurrences';

/** Sleeps until `main` (0 = today, negative once it has passed). Pure day-number arithmetic: DST-proof. */
export function sleeps(main: DayNumber, today: CivilDate): number {
  return main - toDayNumber(today);
}

export type MilestoneKey = '100' | '50' | '10' | '3' | '1' | '0';

/** The milestone a sleeps count lands on exactly (copy lives in ui/copy.ts), else null. */
export function milestoneKey(sleeps: number): MilestoneKey | null {
  switch (sleeps) {
    case 100: return '100';
    case 50: return '50';
    case 10: return '10';
    case 3: return '3';
    case 1: return '1';
    case 0: return '0';
    default: return null;
  }
}

export interface Breakdown { readonly h: number; readonly m: number; readonly s: number }

/**
 * Whole hours/minutes/seconds from `now` until `midnight` (the New Year's Eve clock).
 * Both are wall-clock instants, so a 23- or 25-hour DST day shows its real remainder. Never negative.
 */
export function finalDayBreakdown(now: Date, midnight: Date): Breakdown {
  const total = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

/** "1 sleep" / "12 sleeps" / "1,096 sleeps". */
export function pluralSleeps(n: number): string {
  return plural(n, { one: '{n} sleep', other: '{n} sleeps' });
}

/**
 * The short label under the counter. A holiday's own `dayNames` win ("Night 4", "Dhanteras");
 * otherwise the generic copy: sleeps, "Tonight at sundown!", "IT'S TODAY!", "Day 3 of 8".
 */
export function labelFor(status: Status, meta: Pick<HolidayMeta, 'dayNames'>): string {
  switch (status.kind) {
    case 'upcoming':
      return pluralSleeps(status.sleeps);
    case 'ongoing': {
      const named = meta.dayNames?.[status.day - 1];
      if (named !== undefined) return named;
      if (status.tonight) return 'Tonight at sundown!';
      if (status.sleepsToMain === 0) return "IT'S TODAY!";
      if (status.sleepsToMain > 0) return pluralSleeps(status.sleepsToMain);
      return fill('Day {day} of {total}', { day: status.day, total: status.of });
    }
    case 'passed':
      return status.daysAgo <= 7 ? 'we just celebrated!' : plural(status.daysAgo, { one: '{n} day ago', other: '{n} days ago' });
  }
}

/** Candles lit on civil day `today`: min(max, today − start + 1); Hanukkah max 8, Kwanzaa max 7. 0 before the span. */
export function candlesLit(occ: Occurrence, today: CivilDate, max: number): number {
  const d = toDayNumber(today) - occ.start + 1;
  return d < 1 ? 0 : Math.min(max, d);
}

/** 0..1 progress through a span (Ramadan's waxing moon): 0 on the first day, 1 on the last. */
export function spanProgress(occ: Occurrence, today: CivilDate): number {
  const of = occ.end - occ.start;
  if (of <= 0) return 1;
  const d = toDayNumber(today) - occ.start;
  return Math.min(1, Math.max(0, d / of));
}

/** 0..1 closeness for growth effects (sabzeh, diyas, moon): 1 on the day, 0 at `horizon` sleeps or more. */
export function closeness(sleepsLeft: number, horizon = 30): number {
  if (sleepsLeft <= 0) return 1;
  return 1 - Math.min(sleepsLeft, horizon) / horizon;
}
