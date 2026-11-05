/**
 * Santa's Christmas Eve journey, worked out from the clock alone, so the sleigh is in the
 * same place for everyone in the same time zone (deterministic, no network).
 *
 *  - He visits each city at its own local midnight on December 25 (the arrival order of
 *    midnight.ts). Cities that share an instant (all of UTC+8, say) are visited inside the
 *    hour after their midnight, so the sleigh never has to be in two places and every visit
 *    is after bedtime. Each zone is swept as a "snake": north → south or south → north,
 *    whichever end is nearer to where he just was, which keeps the trail from zig-zagging
 *    back across the planet every hour.
 *  - The viewer's own city (the one for their device zone) is visited first in its zone,
 *    exactly at midnight, so "Santa reaches your house at midnight" matches the globe.
 *  - Within each hour the sleigh flies at a steady speed: stop times are spaced by distance,
 *    including the hop to the next zone's first stop, which lands exactly at that midnight.
 *  - He takes off from the North Pole half an hour before the first midnight (UTC+14 meets
 *    December 25 at 10:00 UTC on the 24th) and lands back home when December 25 reaches
 *    UTC−12, at 12:00 UTC on the 25th.
 *  - Between stops the sleigh follows the great circle (`slerp`) by time fraction.
 *  - Presents are a fun estimate: 2.6 per person (pop is in millions), growing smoothly
 *    on the way to each stop.
 *
 * Outside his flight the phase is 'workshop' (or 'done' on 24–December 25 device-local
 * time after he is home) and the sleigh sits on the pole.
 */
import { addDays, type CivilDate } from '../dates/civil';
import { NORTH_POLE, type City } from './data/cities';
import { distanceKm, slerp, type LonLat } from './geo';
import { midnightIn, westOfStart } from './midnight';
import { cityForZone, deviceZone as currentZone, isSupportedZone, localDate } from './zones';

export interface SantaStop {
  readonly id: string;
  readonly name: string;
  readonly lon: number;
  readonly lat: number;
  /** Epoch ms of the visit (departure/landing for the pole). */
  readonly at: number;
  /** null for the North Pole. */
  readonly city: City | null;
}

export interface SantaRoute {
  readonly year: number;
  /** Pole, every city in visiting order, pole. */
  readonly stops: readonly SantaStop[];
  readonly departs: number;
  readonly returns: number;
}

export type SantaPhase = 'workshop' | 'flying' | 'done';

export interface SantaStatus {
  readonly phase: SantaPhase;
  readonly lonlat: LonLat;
  readonly from: SantaStop;
  readonly to: SantaStop;
  /** 0..1 along the current leg. */
  readonly progress: number;
  readonly visited: readonly City[];
  readonly next: City | null;
  readonly presents: number;
  /** Until midnight on December 25 in the device's zone (≤ 0 once it has passed). */
  readonly msUntilYourHouse: number;
  readonly msUntilNextStop: number;
  readonly route: SantaRoute;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
/** Takeoff this long before the first midnight. */
const TAKEOFF_LEAD = 30 * MIN;
/** Presents per person. */
export const PRESENTS_PER_PERSON = 2.6;

const POLE_STOP = (at: number): SantaStop => ({ id: 'north-pole', name: 'the North Pole', lon: NORTH_POLE.lon, lat: NORTH_POLE.lat, at, city: null });

const routes = new WeakMap<readonly City[], Map<string, SantaRoute>>();

interface Zone { readonly at: number; readonly cities: City[] }

/** Cities grouped by the instant December 25 reaches them, earliest first. */
function zonesFor(year: number, cities: readonly City[]): Zone[] {
  const day: CivilDate = { y: year, m: 12, d: 25 };
  const timed = cities.map((city) => ({ city, at: midnightIn(city.tz, day) }));
  timed.sort((a, b) => a.at - b.at || westOfStart(a.city.lon) - westOfStart(b.city.lon));
  const zones: Zone[] = [];
  for (const t of timed) {
    const last = zones[zones.length - 1];
    if (last && last.at === t.at) last.cities.push(t.city);
    else zones.push({ at: t.at, cities: [t.city] });
  }
  return zones;
}

/** One zone's visiting order: a north/south snake from `prev`, or from the viewer's city when it is here. */
function zoneOrder(cities: readonly City[], prev: LonLat, homeId: string): City[] {
  const byLat = (list: City[]): City[] => list.sort((a, b) => b.lat - a.lat || westOfStart(a.lon) - westOfStart(b.lon));
  const home = cities.find((c) => c.id === homeId);
  const rest = byLat(cities.filter((c) => c !== home));
  const from = home ?? prev;
  const first = rest[0];
  const last = rest[rest.length - 1];
  if (first && last && distanceKm(from, last) < distanceKm(from, first)) rest.reverse();
  return home ? [home, ...rest] : rest;
}

/**
 * The whole route for Christmas `year`, memoised per city list, year and home city.
 * `homeId` is the viewer's city (see `homeCityId`); '' plans the plain snake.
 */
export function santaRoute(year: number, cities: readonly City[], homeId = ''): SantaRoute {
  let memo = routes.get(cities);
  if (!memo) { memo = new Map(); routes.set(cities, memo); }
  const key = `${year}|${homeId}`;
  const hit = memo.get(key);
  if (hit) return hit;

  const zones = zonesFor(year, cities);
  const orders: City[][] = [];
  let prev: LonLat = NORTH_POLE;
  for (const z of zones) {
    const order = zoneOrder(z.cities, prev, homeId);
    orders.push(order);
    prev = order[order.length - 1] ?? prev;
  }

  // Steady speed inside each hour: times spaced by distance, the hop to the next zone included.
  const stops: SantaStop[] = [];
  zones.forEach((z, zi) => {
    const order = orders[zi]!;
    const nextFirst = orders[zi + 1]?.[0] ?? null;
    const span = Math.min(HOUR, (zones[zi + 1]?.at ?? z.at + HOUR) - z.at);
    const legs = order.map((c, k) => (k === 0 ? 0 : distanceKm(order[k - 1]!, c)));
    const inside = legs.reduce((s, d) => s + d, 0);
    const total = inside + (nextFirst ? distanceKm(order[order.length - 1]!, nextFirst) : 0);
    let walked = 0;
    order.forEach((c, k) => {
      walked += legs[k]!;
      const at = z.at + (total > 0 ? (span * walked) / total : (span * k) / order.length);
      stops.push({ id: c.id, name: c.name, lon: c.lon, lat: c.lat, at, city: c });
    });
  });

  const first = stops[0]?.at ?? Date.UTC(year, 11, 24, 10);
  const departs = first - TAKEOFF_LEAD;
  // Home when December 25 reaches UTC−12, or a little after the last stop if that is later.
  const last = stops[stops.length - 1]?.at ?? departs;
  const returns = Math.max(Date.UTC(year, 11, 25, 12), last + 20 * MIN);
  const route: SantaRoute = { year, stops: [POLE_STOP(departs), ...stops, POLE_STOP(returns)], departs, returns };
  memo.set(key, route);
  return route;
}

const homes = new Map<string, string>();

/** The listed city Santa treats as the viewer's home: the device zone's city on Christmas Eve (memoised). */
export function homeCityId(zone: string, year: number): string {
  const key = `${zone}|${year}`;
  let id = homes.get(key);
  if (id === undefined) {
    id = isSupportedZone(zone) ? cityForZone(zone, new Date(Date.UTC(year, 11, 24, 12))).id : '';
    homes.set(key, id);
  }
  return id;
}

/** Index of the leg [stops[k], stops[k+1]] containing t (binary search; route.departs ≤ t < route.returns). */
function legAt(stops: readonly SantaStop[], t: number): number {
  let lo = 0;
  let hi = stops.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (stops[mid]!.at <= t) lo = mid; else hi = mid - 1;
  }
  return lo;
}

function presentsFor(pop: number): number {
  return pop * 1e6 * PRESENTS_PER_PERSON;
}

/**
 * Where Santa is at `now`. `deviceZone` only decides the "your house" countdown and whether
 * a finished flight shows as 'done' (24–December 25 where the viewer is) or 'workshop'.
 */
export function santaStatus(now: Date, cities: readonly City[], deviceZone: string = currentZone()): SantaStatus {
  const t = now.getTime();
  const zone = isSupportedZone(deviceZone) ? deviceZone : 'UTC';
  const local = localDate(zone, now);
  // Within a few days of Christmas the UTC year is the right Christmas; early January looks back.
  const year = local.m === 1 ? local.y - 1 : local.y;
  const route = santaRoute(year, cities, homeCityId(zone, year));
  const stops = route.stops;
  const home = stops[0]!;
  const yourMidnight = midnightIn(zone, { y: year, m: 12, d: 25 });
  const base = {
    msUntilYourHouse: yourMidnight - t,
    route,
  };

  if (t >= route.departs && t < route.returns) {
    const k = legAt(stops, t);
    const from = stops[k]!;
    const to = stops[k + 1]!;
    const span = Math.max(1, to.at - from.at);
    const progress = Math.min(1, Math.max(0, (t - from.at) / span));
    const visited: City[] = [];
    let presents = 0;
    for (let s = 1; s <= k; s++) {
      const c = stops[s]!.city;
      if (c) { visited.push(c); presents += presentsFor(c.pop); }
    }
    if (to.city) presents += progress * presentsFor(to.city.pop);
    return {
      ...base,
      phase: 'flying',
      lonlat: slerp(from, to, progress),
      from, to, progress, visited, next: to.city, presents: Math.floor(presents),
      msUntilNextStop: to.at - t,
    };
  }

  const christmasWindow = local.m === 12 && (local.d === 24 || local.d === 25);
  if (christmasWindow && t >= route.returns) {
    const all = stops.flatMap((s) => (s.city ? [s.city] : []));
    const presents = all.reduce((sum, c) => sum + presentsFor(c.pop), 0);
    const end = stops[stops.length - 1]!;
    return {
      ...base,
      phase: 'done', lonlat: { lon: end.lon, lat: end.lat }, from: end, to: end, progress: 1,
      visited: all, next: null, presents: Math.floor(presents), msUntilNextStop: 0,
    };
  }
  const first = stops[1]?.city ?? null;
  return {
    ...base,
    phase: 'workshop', lonlat: { lon: home.lon, lat: home.lat }, from: home, to: home, progress: 0,
    visited: [], next: first, presents: 0, msUntilNextStop: Math.max(0, route.departs - t),
  };
}

/**
 * Just the sleigh's position and current leg at epoch ms `t` — cheap enough to call every
 * animation frame (the full `santaStatus` builds lists and text). leg −1 = not yet left.
 */
export function santaPosition(route: SantaRoute, t: number): { readonly lon: number; readonly lat: number; readonly leg: number } {
  const stops = route.stops;
  const first = stops[0]!;
  const last = stops[stops.length - 1]!;
  if (t <= route.departs) return { lon: first.lon, lat: first.lat, leg: -1 };
  if (t >= route.returns) return { lon: last.lon, lat: last.lat, leg: stops.length - 1 };
  const k = legAt(stops, t);
  const from = stops[k]!;
  const to = stops[k + 1]!;
  const p = slerp(from, to, Math.min(1, Math.max(0, (t - from.at) / Math.max(1, to.at - from.at))));
  return { lon: p.lon, lat: p.lat, leg: k };
}

/** The flight as a list of visited stops up to `now`, for drawing the trail (pole first). */
export function trailStops(status: SantaStatus): LonLat[] {
  if (status.phase === 'workshop') return [];
  const out: LonLat[] = [];
  for (const s of status.route.stops) {
    if (s.at > (status.phase === 'done' ? Infinity : status.from.at)) break;
    out.push({ lon: s.lon, lat: s.lat });
  }
  return out;
}

/** Sleeps from a device date until Christmas Eve (0 on the 24th, negative after). */
export function sleepsToChristmasEve(today: CivilDate): number {
  let n = 0;
  let d = today;
  if (today.m === 12 && today.d > 24) return 24 - today.d;
  while (!(d.m === 12 && d.d === 24) && n < 400) { d = addDays(d, 1); n++; }
  return n;
}

/** The weeks the Santa card shows in full: 1–December 26. */
export function inSantaSeason(today: CivilDate): boolean {
  return today.m === 12 && today.d <= 26;
}
