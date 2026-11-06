/**
 * Santa Mission Control: the numbers behind the panel, worked out from the route, the status
 * and the clock alone (no network, no DOM), so the practice flight replays all of it.
 *
 * Speed is real: the current leg's great-circle distance over the time the route gives it.
 * Altitude, cookies, carrots and the reindeer's moods are playful and deterministic.
 */
import type { CivilDate } from '../dates/civil';
import type { City } from './data/cities';
import { distanceKm } from './geo';
import { formatClock, offsetMinutes } from './zones';
import { PRESENTS_PER_PERSON, santaPosition, type SantaRoute, type SantaStatus } from './santa';

export type MissionStage = 'pre' | 'flying' | 'landed';
export type HomeStage = 'far' | 'close' | 'visited';

const MIN = 60_000;
const HOUR = 60 * MIN;
const KM_PER_MILE = 1.609344;
const FEET_PER_METER = 3.28084;
/** Under this long to go the panel raises its bedtime alert. */
export const CLOSE_MS = 2 * HOUR;
/** The sleigh cruises between these heights (feet) and drops to rooftop height at each stop. */
export const CRUISE_FT = { min: 2000, max: 6000 } as const;
const ROOFTOP_FT = 40;
/** Fun estimates, not data: about three cookies per stop, one carrot for each reindeer. */
const COOKIES_PER_STOP = 3;
const CARROTS_PER_STOP = 8;

/** The eight reindeer of the 1823 poem, in the order it names them. */
export const REINDEER = ['Dasher', 'Dancer', 'Prancer', 'Vixen', 'Comet', 'Cupid', 'Donder', 'Blitzen'] as const;
export type ReindeerName = (typeof REINDEER)[number];

export const MISSION_COPY = {
  flyingMoods: [
    'Pulling hard', 'Sniffing the wind', 'Checking the map', 'Munching a carrot',
    'Stretching hooves', 'Keeping the beat', 'Watching for clouds', 'Doing a little hop',
  ],
  restingMoods: ['Eating oats', 'Getting brushed', 'Warming up', 'Jingling bells', 'Eating oats', 'Getting brushed', 'Warming up', 'Jingling bells'],
  landedMoods: ['Snoozing', 'Munching hay', 'Dreaming of snow', 'Snoozing', 'Munching hay', 'Dreaming of snow', 'Snoozing', 'Munching hay'],
  jobs: [
    'Polish the sleigh', 'Check the list', 'Feed the reindeer', 'Sharpen the sleigh runners', 'Check the list twice',
    'Brush the reindeer', 'Fill the cocoa thermos', 'Sort the presents by street', 'Shine the lantern', 'Update the map',
    'Pack the spare mittens', 'Wrap the last gifts', 'Stretch the reindeer', 'Taste-test the cookies', 'Practice the chimney slide',
    'Check the harnesses', 'Read the weather report', 'Warm up the sleigh', 'Load the big red bag', 'Tie on the jingle bells',
    'Pack carrots for the trip', 'Take a test hop around the workshop', 'Wave goodbye to the elves', 'Put on the red suit',
  ],
} as const;

interface RouteFacts {
  /** Great-circle km of each leg (stops[k] to stops[k + 1]). */
  readonly legKm: number[];
  readonly legKmh: number[];
  /** Km flown on arriving at stops[k]. */
  readonly cumKm: number[];
  readonly totalKm: number;
  readonly topKmh: number;
  readonly cities: number;
  readonly totalPresents: number;
  /** Distinct UTC offsets passed once stops[k] is reached. */
  readonly zonesAt: number[];
}

const facts = new WeakMap<SantaRoute, RouteFacts>();

function factsFor(route: SantaRoute): RouteFacts {
  const hit = facts.get(route);
  if (hit) return hit;
  const stops = route.stops;
  const legKm: number[] = [];
  const legKmh: number[] = [];
  const cumKm: number[] = [0];
  const zonesAt: number[] = [0];
  const seen = new Set<number>();
  let top = 0;
  let presents = 0;
  let cities = 0;
  for (let k = 0; k < stops.length - 1; k++) {
    const a = stops[k]!;
    const b = stops[k + 1]!;
    const km = distanceKm(a, b);
    const kmh = km / (Math.max(1, b.at - a.at) / HOUR);
    legKm.push(km);
    legKmh.push(kmh);
    top = Math.max(top, kmh);
    cumKm.push((cumKm[k] ?? 0) + km);
    if (b.city) {
      cities++;
      presents += b.city.pop * 1e6 * PRESENTS_PER_PERSON;
      seen.add(offsetMinutes(b.city.tz, new Date(b.at)));
    }
    zonesAt.push(seen.size);
  }
  const made: RouteFacts = { legKm, legKmh, cumKm, totalKm: cumKm[cumKm.length - 1] ?? 0, topKmh: top, cities, totalPresents: presents, zonesAt };
  facts.set(route, made);
  return made;
}

export function missionStage(route: SantaRoute, now: number): MissionStage {
  if (now < route.departs) return 'pre';
  return now >= route.returns ? 'landed' : 'flying';
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const smooth = (x: number): number => { const t = clamp01(x); return t * t * (3 - 2 * t); };

export const kmToMiles = (km: number): number => km / KM_PER_MILE;
export const feetToMeters = (ft: number): number => ft / FEET_PER_METER;

export interface LiveStats {
  readonly stage: MissionStage;
  readonly speedKmh: number;
  readonly speedMph: number;
  readonly altitudeFt: number;
  readonly altitudeM: number;
  readonly distanceKm: number;
  readonly distanceMi: number;
  readonly stopsDone: number;
  readonly stopsTotal: number;
  readonly presents: number;
  readonly presentsTotal: number;
  /** Share of the bag still full, 0..1. */
  readonly bagLeft: number;
  readonly percentLeft: number;
  readonly cookies: number;
  readonly carrots: number;
  readonly zonesCrossed: number;
  /** The speedometer's top mark, from the fastest leg of the whole route. */
  readonly dialMaxKmh: number;
}

/** A tidy top mark for the dial: a 1, 2 or 5 step, with at most six steps up to the fastest leg. */
export function dialScale(topKmh: number): { readonly max: number; readonly step: number } {
  const raw = Math.max(1, topKmh) / 6;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? mag * 10;
  return { max: Math.ceil(topKmh / step) * step || step, step };
}

export function liveStats(route: SantaRoute, status: SantaStatus, now: number): LiveStats {
  const f = factsFor(route);
  const stage = missionStage(route, now);
  const { leg } = santaPosition(route, now);
  const flying = stage === 'flying';
  const from = route.stops[leg];
  const to = route.stops[leg + 1];
  const progress = flying && from && to ? clamp01((now - from.at) / Math.max(1, to.at - from.at)) : 0;
  const speedKmh = flying ? Math.round(f.legKmh[leg] ?? 0) : 0;

  // A wave of three swells per leg, easing down to rooftop height as he nears a city.
  let altitudeFt = 0;
  if (flying) {
    const swell = 0.5 + 0.5 * Math.sin(2 * Math.PI * (progress * 3 + (leg % 7) / 7));
    const cruise = CRUISE_FT.min + (CRUISE_FT.max - CRUISE_FT.min) * swell;
    const edge = Math.min(from?.city ? progress : 1, to?.city ? 1 - progress : 1);
    altitudeFt = Math.round((ROOFTOP_FT + (cruise - ROOFTOP_FT) * smooth(edge / 0.12)) / 10) * 10;
  }

  const distance = stage === 'landed' ? f.totalKm : flying ? (f.cumKm[leg] ?? 0) + progress * (f.legKm[leg] ?? 0) : 0;
  const stopsDone = stage === 'landed' ? f.cities : flying ? Math.min(leg, f.cities) : 0;
  const presents = stage === 'landed' ? Math.round(f.totalPresents) : Math.min(status.presents, Math.round(f.totalPresents));
  const bagLeft = f.totalPresents > 0 ? clamp01(1 - presents / f.totalPresents) : 1;
  const percentLeft = bagLeft === 0 ? 0 : Math.max(1, Math.ceil(bagLeft * 100));
  return {
    stage, speedKmh, speedMph: Math.round(kmToMiles(speedKmh)),
    altitudeFt, altitudeM: Math.round(feetToMeters(altitudeFt)),
    distanceKm: Math.round(distance), distanceMi: Math.round(kmToMiles(distance)),
    stopsDone, stopsTotal: f.cities, presents, presentsTotal: Math.round(f.totalPresents), bagLeft, percentLeft,
    cookies: stopsDone * COOKIES_PER_STOP, carrots: stopsDone * CARROTS_PER_STOP,
    zonesCrossed: stage === 'landed' ? (f.zonesAt[f.zonesAt.length - 1] ?? 0) : flying ? (f.zonesAt[leg] ?? 0) : 0,
    dialMaxKmh: dialScale(f.topKmh).max,
  };
}

export interface LogEntry {
  readonly city: City;
  readonly at: number;
  /** The city's wall clock at the visit. */
  readonly time: string;
}

export interface UpcomingStop extends LogEntry {
  readonly etaMs: number;
}

/** The latest `limit` cities Santa has visited, newest first. */
export function flightLog(route: SantaRoute, now: number, locale?: string, limit = 6): LogEntry[] {
  const out: LogEntry[] = [];
  for (let k = route.stops.length - 1; k >= 1 && out.length < limit; k--) {
    const s = route.stops[k]!;
    if (s.city && s.at <= now) out.push({ city: s.city, at: s.at, time: formatClock(s.city.tz, new Date(s.at), locale) });
  }
  return out;
}

/** The next `limit` stops with their countdowns. */
export function comingUp(route: SantaRoute, now: number, locale?: string, limit = 3): UpcomingStop[] {
  const out: UpcomingStop[] = [];
  for (let k = 1; k < route.stops.length && out.length < limit; k++) {
    const s = route.stops[k]!;
    if (s.city && s.at > now) out.push({ city: s.city, at: s.at, etaMs: s.at - now, time: formatClock(s.city.tz, new Date(s.at), locale) });
  }
  return out;
}

export interface HomeInfo {
  readonly stage: HomeStage;
  readonly distanceKm: number;
  readonly distanceMi: number;
  /** Until Santa gets there (0 once he has). */
  readonly etaMs: number;
  /** When he gets or got there; null when the city is not on the route. */
  readonly at: number | null;
}

export function homeInfo(route: SantaRoute, status: SantaStatus, now: number, home: City): HomeInfo {
  const stop = route.stops.find((s) => s.city?.id === home.id) ?? null;
  const km = distanceKm(status.lonlat, home);
  const at = stop?.at ?? null;
  const etaMs = at === null ? Infinity : Math.max(0, at - now);
  const stage: HomeStage = at !== null && at <= now ? 'visited' : etaMs < CLOSE_MS ? 'close' : 'far';
  return { stage, distanceKm: Math.round(km), distanceMi: Math.round(kmToMiles(km)), etaMs, at };
}

export interface ReindeerState {
  readonly name: ReindeerName;
  readonly mood: string;
  readonly lead: boolean;
}

/** Moods rotate with the leg, and the lead steps down the team one reindeer per leg. */
export function reindeerRoster(route: SantaRoute, now: number): ReindeerState[] {
  const stage = missionStage(route, now);
  const leg = Math.max(0, santaPosition(route, now).leg);
  const moods = stage === 'flying' ? MISSION_COPY.flyingMoods : stage === 'pre' ? MISSION_COPY.restingMoods : MISSION_COPY.landedMoods;
  return REINDEER.map((name, i) => ({
    name,
    mood: moods[(stage === 'flying' ? i + leg : i) % moods.length]!,
    lead: stage === 'flying' && leg % REINDEER.length === i,
  }));
}

export interface PreflightJob {
  readonly day: number;
  readonly text: string;
  readonly done: boolean;
}

/** One job a day from December 1 to 24, ticked up to and including `today`. */
export function preflight(today: CivilDate): { jobs: PreflightJob[]; done: number } {
  const upTo = today.m === 12 ? today.d : 0;
  const jobs = MISSION_COPY.jobs.map((text, i) => ({ day: i + 1, text, done: i + 1 <= upTo }));
  return { jobs, done: jobs.filter((j) => j.done).length };
}

export interface FlightReport {
  readonly distanceKm: number;
  readonly distanceMi: number;
  readonly stops: number;
  readonly presents: number;
  readonly topKmh: number;
  readonly topMph: number;
  readonly flightMs: number;
  /** When he reached the viewer's city; null if it is not on the route. */
  readonly homeAt: number | null;
}

export function flightReport(route: SantaRoute, home: City): FlightReport {
  const f = factsFor(route);
  const topKmh = Math.round(f.topKmh);
  return {
    distanceKm: Math.round(f.totalKm), distanceMi: Math.round(kmToMiles(f.totalKm)), stops: f.cities,
    presents: Math.round(f.totalPresents), topKmh, topMph: Math.round(kmToMiles(topKmh)),
    flightMs: route.returns - route.departs,
    homeAt: route.stops.find((s) => s.city?.id === home.id)?.at ?? null,
  };
}

// ── treats left out for Santa ──

export type TreatKey = 'cookies' | 'milk' | 'carrots';
export type Treats = Readonly<Record<TreatKey, boolean>>;
export const TREAT_KEYS: readonly TreatKey[] = ['cookies', 'milk', 'carrots'];
export const TREATS_KEY = 'jubilee.santa.v1';
const NO_TREATS: Treats = { cookies: false, milk: false, carrots: false };

type KeyStore = Pick<Storage, 'getItem' | 'setItem'>;

function safeLocalStorage(): KeyStore | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

/** Treats are saved per Christmas year: `{ v: 1, years: { "2026": { cookies, milk, carrots } } }`. */
export function parseTreats(raw: string | null, year: number): Treats {
  try {
    const data = JSON.parse(raw ?? 'null') as { v?: unknown; years?: Record<string, Partial<Record<TreatKey, unknown>>> } | null;
    const mine = data?.v === 1 ? data.years?.[String(year)] : undefined;
    if (!mine) return NO_TREATS;
    return { cookies: mine.cookies === true, milk: mine.milk === true, carrots: mine.carrots === true };
  } catch {
    return NO_TREATS;
  }
}

export interface TreatsStorage {
  read(year: number): Treats;
  set(year: number, key: TreatKey, on: boolean): Treats;
}

/** While pretending (or when storage is blocked) treats live in memory only. */
export function treatsStorage(pretending: boolean, storage: KeyStore | null = safeLocalStorage()): TreatsStorage {
  const memory = new Map<number, Treats>();
  const stored = (year: number): Treats => {
    try { return parseTreats(storage ? storage.getItem(TREATS_KEY) : null, year); } catch { return NO_TREATS; }
  };
  return {
    read: (year) => memory.get(year) ?? stored(year),
    set(year, key, on) {
      const next: Treats = { ...(memory.get(year) ?? stored(year)), [key]: on };
      if (pretending || !storage) { memory.set(year, next); return next; }
      try {
        const data = JSON.parse(storage.getItem(TREATS_KEY) ?? 'null') as { v?: unknown; years?: Record<string, Treats> } | null;
        const years = data?.v === 1 && data.years ? data.years : {};
        storage.setItem(TREATS_KEY, JSON.stringify({ v: 1, years: { ...years, [String(year)]: next } }));
      } catch {
        memory.set(year, next);
      }
      return next;
    },
  };
}
