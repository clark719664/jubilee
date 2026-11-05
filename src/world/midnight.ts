/**
 * The New Year wave: midnight on a civil date reaches each city at a different instant,
 * starting in Kiritimati (UTC+14) and ending in Pago Pago (UTC−11). Arrival instants come
 * from the zone rules (zones.ts → Intl), so DST and the odd half- and quarter-hour zones
 * are right; they are cached per (zone, date) because the card re-reads them every second.
 *
 * The shaded "already in the new day" region on the globe uses mean solar time instead
 * (λ = −15 × hours since UTC midnight): real zones are political and zig-zag, so a few
 * Pacific cities light up an hour or two before the shading reaches them — which is a
 * true and rather nice thing to notice.
 */
import type { CivilDate } from '../dates/civil';
import type { City } from './data/cities';
import { normLon } from './geo';
import { cityForZone, isSupportedZone, zoneMidnight } from './zones';

export interface Arrival {
  readonly city: City;
  /** The instant the wall clock in the city's zone reaches 00:00 on the target date. */
  readonly at: Date;
  /** Milliseconds from `now` until `at` (negative once it has arrived). */
  readonly msUntil: number;
  readonly arrived: boolean;
}

export interface YourTurn {
  readonly zone: string;
  readonly at: Date;
  readonly msUntil: number;
  readonly arrived: boolean;
  /** The listed city that shares (or is nearest to) the device's zone. */
  readonly city: City;
}

/** Longitude where the date line's "new day" starts, used to order cities sharing an instant east → west. */
const WAVE_START_LON = -150;
const HOUR = 3_600_000;

const cache = new Map<string, number>();

function keyOf(c: CivilDate): string {
  return `${c.y}-${c.m}-${c.d}`;
}

/** Cached `zoneMidnight` in epoch ms. */
export function midnightIn(tz: string, target: CivilDate): number {
  const key = `${tz}|${keyOf(target)}`;
  let at = cache.get(key);
  if (at === undefined) {
    at = zoneMidnight(tz, target).getTime();
    if (cache.size > 2000) cache.clear();
    cache.set(key, at);
  }
  return at;
}

/** Degrees west of the wave's start: smaller = reaches a new day sooner at the same instant. */
export function westOfStart(lon: number): number {
  const d = (WAVE_START_LON - lon) % 360;
  return d < 0 ? d + 360 : d;
}

/** Cities in the order midnight on `target` reaches them; ties go east → west, then biggest first. */
export function arrivalOrder(cities: readonly City[], now: Date, target: CivilDate): Arrival[] {
  const t = now.getTime();
  const out = cities.map((city): Arrival => {
    const at = midnightIn(city.tz, target);
    return { city, at: new Date(at), msUntil: at - t, arrived: at <= t };
  });
  out.sort((a, b) => a.at.getTime() - b.at.getTime()
    || westOfStart(a.city.lon) - westOfStart(b.city.lon)
    || b.city.pop - a.city.pop);
  return out;
}

export function arrivedCount(order: readonly Arrival[]): number {
  let n = 0;
  for (const a of order) if (a.arrived) n++;
  return n;
}

/** The next `n` cities still waiting for midnight, soonest first. */
export function nextArrivals(order: readonly Arrival[], n = 5): Arrival[] {
  const out: Arrival[] = [];
  for (const a of order) {
    if (a.arrived) continue;
    out.push(a);
    if (out.length === n) break;
  }
  return out;
}

/**
 * The meridian where mean local time is midnight. With `targetUtcDayStart` (epoch ms of
 * 00:00 UTC on the target date) the result is clamped to [−180, 180] and bounds the region
 * that has crossed into that day: every longitude from it east to the date line (180°).
 * 180 means nowhere yet, −180 means everywhere. Without it, the meridian is normalised.
 */
export function midnightMeridian(now: Date, targetUtcDayStart?: number): number {
  if (targetUtcDayStart === undefined) {
    const h = (now.getTime() % 86_400_000) / HOUR;
    return normLon(-15 * h);
  }
  const hours = (now.getTime() - targetUtcDayStart) / HOUR;
  return Math.max(-180, Math.min(180, -15 * hours));
}

/** Epoch ms of 00:00 UTC on a civil date. */
export function utcDayStart(c: CivilDate): number {
  return Date.UTC(c.y, c.m - 1, c.d);
}

/** When midnight on `target` reaches the device's own zone. */
export function yourTurn(deviceZone: string, now: Date, target: CivilDate): YourTurn {
  const zone = isSupportedZone(deviceZone) ? deviceZone : 'UTC';
  const at = midnightIn(zone, target);
  const msUntil = at - now.getTime();
  return { zone, at: new Date(at), msUntil, arrived: msUntil <= 0, city: cityForZone(zone, now) };
}

/** The New Year a device date is heading for (or has just had): Jan 1 of next year, or of this year in January. */
export function newYearTarget(today: CivilDate): CivilDate {
  return { y: today.m === 1 ? today.y : today.y + 1, m: 1, d: 1 };
}

/** The week the midnight-wave card is live: 26 December to 2 January. */
export function inNewYearWindow(today: CivilDate): boolean {
  return (today.m === 12 && today.d >= 26) || (today.m === 1 && today.d <= 2);
}

/**
 * The pretend instant for the "Watch the New Year arrive" show: 23:00 on 31 December in
 * UTC+13, an hour before Auckland and Tonga, the moment Kiritimati reaches the new year.
 */
export function newYearShowStart(target: CivilDate): number {
  return Date.UTC(target.y - 1, 11, 31, 10, 0, 0);
}
