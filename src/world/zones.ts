/**
 * Time-zone helpers built on Intl.DateTimeFormat, the only zone database the app has
 * (no network, no bundled tz tables). Formatters are cached per zone because building
 * one is slow and the "right now" row re-reads a dozen zones every second.
 */
import { weekday, type CivilDate, type Weekday } from '../dates/civil';
import { CITIES, type City } from './data/cities';

export interface LocalClock extends CivilDate {
  /** 0–23 */
  readonly h: number;
  readonly min: number;
  readonly s: number;
  readonly weekday: Weekday;
}

const formatters = new Map<string, Intl.DateTimeFormat>();
const support = new Map<string, boolean>();
const clockFormatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
      });
    } catch {
      throw new Error(`Unknown time zone: ${tz}`);
    }
    formatters.set(tz, f);
  }
  return f;
}

/** True when this engine knows the IANA zone. */
export function isSupportedZone(tz: string): boolean {
  const known = support.get(tz);
  if (known !== undefined) return known;
  let ok: boolean;
  try {
    partsFormatter(tz);
    ok = true;
  } catch {
    ok = false;
  }
  support.set(tz, ok);
  return ok;
}

/** Wall-clock date and time in `tz` at the instant `now`. Throws on an unknown zone. */
export function localClock(tz: string, now: Date): LocalClock {
  const parts = partsFormatter(tz).formatToParts(now);
  let y = 0, m = 0, d = 0, h = 0, min = 0, s = 0;
  for (const p of parts) {
    switch (p.type) {
      case 'year': y = Number(p.value); break;
      case 'month': m = Number(p.value); break;
      case 'day': d = Number(p.value); break;
      case 'hour': h = Number(p.value) % 24; break;
      case 'minute': min = Number(p.value); break;
      case 'second': s = Number(p.value); break;
      default: break;
    }
  }
  return { y, m, d, h, min, s, weekday: weekday({ y, m, d }) };
}

/** The civil date in `tz` at `now`. */
export function localDate(tz: string, now: Date): CivilDate {
  const c = localClock(tz, now);
  return { y: c.y, m: c.m, d: c.d };
}

/** UTC offset of `tz` at `now`, in minutes east of Greenwich (Kolkata +330, New York −300/−240). */
export function offsetMinutes(tz: string, now: Date): number {
  const c = localClock(tz, now);
  const asUtc = Date.UTC(c.y, c.m - 1, c.d, c.h, c.min, c.s);
  const whole = Math.floor(now.getTime() / 1000) * 1000;
  return Math.round((asUtc - whole) / 60_000);
}

/** The device's IANA zone, or 'UTC' when the engine will not say. */
export function deviceZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * The instant when the wall clock in `tz` reaches 00:00 on the civil day `c`. Across a
 * DST gap that skips midnight, this is the moment the date changes.
 */
export function zoneMidnight(tz: string, c: CivilDate): Date {
  const utcMidnight = Date.UTC(c.y, c.m - 1, c.d);
  const guess = new Date(utcMidnight - offsetMinutes(tz, new Date(utcMidnight)) * 60_000);
  const off = offsetMinutes(tz, guess);
  const refined = new Date(utcMidnight - off * 60_000);
  const at = localClock(tz, refined);
  if (at.y === c.y && at.m === c.m && at.d === c.d && at.h === 0 && at.min === 0) return refined;
  // Gap or ambiguity: step back until the previous day, then forward to the first instant on day c.
  let t = refined.getTime() - 3 * 3_600_000;
  for (let i = 0; i < 6 * 60; i++, t += 60_000) {
    const l = localClock(tz, new Date(t));
    if (l.y === c.y && l.m === c.m && l.d === c.d) return new Date(t);
  }
  return refined;
}

/** The city whose zone matches exactly (largest first), else the nearest by current offset. */
export function cityForZone(tz: string, now: Date = new Date()): City {
  let best: City | null = null;
  for (const c of CITIES) {
    if (c.tz === tz && (best === null || c.pop > best.pop)) best = c;
  }
  if (best) return best;
  const target = isSupportedZone(tz) ? offsetMinutes(tz, now) : 0;
  let bestDiff = Infinity;
  for (const c of CITIES) {
    const diff = Math.abs(offsetMinutes(c.tz, now) - target);
    if (diff < bestDiff || (diff === bestDiff && best !== null && c.pop > best.pop)) { bestDiff = diff; best = c; }
  }
  return best ?? CITIES[0]!;
}

/** "14:05" / "2:05 PM" in the viewer's locale for the wall clock in `tz`. */
export function formatClock(tz: string, now: Date, locale?: string): string {
  const key = `${locale ?? ''}|${tz}`;
  let f = clockFormatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { timeZone: tz, hour: 'numeric', minute: '2-digit' });
    clockFormatters.set(key, f);
  }
  return f.format(now);
}

/** "h:mm" from parts, locale-free (for countdowns and tests). */
export function hhmm(h: number, min: number): string {
  return `${h}:${min < 10 ? '0' : ''}${min}`;
}
