/**
 * clocks.ts — the time questions, built from the World view's cities and the device's Intl zone data.
 *
 *   "New Year travels around the world! Who says Happy New Year first: Tokyo or Paris?"
 *   "Right now it's night-time in one of these places. Which one: Sydney or London?"
 *
 * Offsets for the New Year question are read at noon UTC on December 31 of the current year, so
 * summer time in the southern hemisphere is counted the way it really is that night. Only cities in
 * countries the globe can outline are used (a child must be able to tap them), only well-known ones
 * (rough metro population ≥ 1 million), and only whole or half-hour offsets, so the answer sentence
 * reads "8 hours", never "5 hours and 45 minutes". Pure: tested in Node.
 */
import { plural } from '../../i18n/index';
import { CITIES, type City } from '../../world/data/cities';
import { hasOutline } from '../../world/data/countries';
import { localClock, offsetMinutes } from '../../world/zones';

/** Cities a child can tap and might have heard of. */
export function quizCities(): City[] {
  return CITIES.filter((c) => hasOutline(c.country) && c.pop >= 1);
}

export interface NewYearPair {
  /** Reaches midnight first. */
  readonly first: City;
  readonly second: City;
  /** How much earlier, in minutes (a multiple of 30, at least 3 hours). */
  readonly minutes: number;
}

/** The instant the offsets are read at: noon UTC on December 31 of `year`. */
export function newYearReference(year: number): Date {
  return new Date(Date.UTC(year, 11, 31, 12));
}

/** Two cities in different countries whose New Years are 3 to 15 hours apart; null if none (never, with the real list). */
export function newYearPair(rand: () => number, year: number): NewYearPair | null {
  const ref = newYearReference(year);
  const cities = quizCities()
    .map((c) => ({ c, off: offsetMinutes(c.tz, ref) }))
    .filter((x) => x.off % 30 === 0);
  const pairs: NewYearPair[] = [];
  for (let i = 0; i < cities.length; i++) {
    for (let j = 0; j < cities.length; j++) {
      const a = cities[i]!;
      const b = cities[j]!;
      const d = a.off - b.off;
      if (d < 180 || d > 15 * 60 || a.c.country === b.c.country) continue;
      pairs.push({ first: a.c, second: b.c, minutes: d });
    }
  }
  if (pairs.length === 0) return null;
  return pairs[Math.floor(rand() * pairs.length)]!;
}

export interface NightPair {
  readonly night: City;
  readonly day: City;
}

/** Night is 8 pm to 4:59 am; day is 9 am to 4:59 pm (a clear difference, no dusk or dawn). */
export function isNightHour(h: number): boolean {
  return h >= 20 || h < 5;
}

export function isDayHour(h: number): boolean {
  return h >= 9 && h < 17;
}

/** One city where it is night at `now` and one where it is day, in different countries. */
export function nightPair(rand: () => number, now: Date): NightPair | null {
  const cities = quizCities();
  const night = cities.filter((c) => isNightHour(localClock(c.tz, now).h));
  const day = cities.filter((c) => isDayHour(localClock(c.tz, now).h));
  if (night.length === 0 || day.length === 0) return null;
  const n = night[Math.floor(rand() * night.length)]!;
  const others = day.filter((c) => c.country !== n.country);
  if (others.length === 0) return null;
  return { night: n, day: others[Math.floor(rand() * others.length)]! };
}

/** "3 hours", "5 and a half hours", "one hour". */
export function hoursPhrase(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const half = minutes % 60 >= 30;
  if (h === 0) return 'half an hour';
  if (h === 1 && !half) return 'one hour';
  return half ? plural(h, { one: '{n} and a half hours', other: '{n} and a half hours' }) : plural(h, { one: '{n} hour', other: '{n} hours' });
}
