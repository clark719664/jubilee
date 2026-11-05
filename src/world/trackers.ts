/**
 * Tracker "cards" for the World view, as plain data: the UI renders them, the tests read
 * them. Every function takes `now` (and the device zone) explicitly, so the pretend shows
 * ("Watch the New Year arrive", "Peek at last year's route") are the same code running on
 * a pretend clock.
 */
import { commaNumber, pluralSleeps } from '../app/format';
import { diffDays, formatIso, type CivilDate } from '../dates/civil';
import { CITIES, SHOWCASE_CITY_IDS, type City } from './data/cities';
import { durationWords, wfmt } from './copy';
import { normLon } from './geo';
import {
  arrivalOrder, arrivedCount, midnightMeridian, nextArrivals, utcDayStart, yourTurn, type Arrival, type YourTurn,
} from './midnight';
import { moonPhase, sleepsUntil, type MoonPhase } from './moon';
import { santaStatus, sleepsToChristmasEve, type SantaStatus } from './santa';
import { countryAt } from './shapes';
import { subsolarPoint, type SubsolarPoint } from './sun';
import { formatClock, localClock } from './zones';

const DEG = Math.PI / 180;

export interface WorldHoliday { readonly id: string; readonly name: string; readonly emoji: string }
export type HolidaysOn = (civil: CivilDate) => readonly WorldHoliday[];

/** Sun altitude (degrees) at a place for a precomputed subsolar point. */
export function altitudeAt(sub: SubsolarPoint, lon: number, lat: number): number {
  const φ = lat * DEG;
  const δ = sub.lat * DEG;
  const h = (lon - sub.lon) * DEG;
  return Math.asin(Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(h)) / DEG;
}

function cityLabel(c: City): string {
  return c.emoji ? `${c.name} ${c.emoji}` : c.name;
}

// ───────────────────────────────────────────────────────── ☀️ day & night

export interface SunCard {
  readonly subsolar: SubsolarPoint;
  readonly daylight: number;
  readonly total: number;
  readonly rising: City | null;
  readonly setting: City | null;
  readonly status: string;
  readonly detail: string;
}

/** How many cities have the sun up, and where it is rising and setting right now. */
export function sunCard(now: Date, cities: readonly City[] = CITIES): SunCard {
  const sub = subsolarPoint(now);
  let daylight = 0;
  let rising: City | null = null;
  let setting: City | null = null;
  let riseScore = Infinity;
  let setScore = Infinity;
  for (const c of cities) {
    const alt = altitudeAt(sub, c.lon, c.lat);
    if (alt > -0.833) daylight++;
    if (alt < -4 || alt > 14) continue;
    // Closest to the horizon wins; mornings have the sun east of the meridian.
    const score = Math.abs(alt - 2);
    if (normLon(c.lon - sub.lon) < 0) {
      if (score < riseScore) { riseScore = score; rising = c; }
    } else if (score < setScore) { setScore = score; setting = c; }
  }
  const status = wfmt('sunStatus', { n: daylight, total: cities.length });
  let detail = '';
  if (rising) detail = wfmt('sunRising', { city: cityLabel(rising) });
  if (setting) detail = detail ? `${detail} ${wfmt('sunSetting', { city: cityLabel(setting) })}` : wfmt('sunSetting', { city: cityLabel(setting) });
  else if (detail) detail += '.';
  return { subsolar: sub, daylight, total: cities.length, rising, setting, status, detail };
}

// ───────────────────────────────────────────────────────── 🌙 moon

/** Which part of the moon's cycle a holiday is tied to. */
export type LunarKind = 'full' | 'new' | 'crescent' | 'moon';

export const LUNAR_HOLIDAYS: Readonly<Record<string, LunarKind>> = {
  'mid-autumn-festival': 'full', chuseok: 'full', 'lantern-festival': 'full', holi: 'full', passover: 'full',
  'lunar-new-year': 'new', diwali: 'new', 'rosh-hashanah': 'new',
  ramadan: 'crescent', 'eid-al-fitr': 'crescent',
  'eid-al-adha': 'moon', hanukkah: 'moon', 'dragon-boat-festival': 'moon', purim: 'moon',
};

export interface LunarHint {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly sleeps: number;
  readonly kind: LunarKind;
}

/** The nearest moon-timed holiday within `withinDays`, from the catalogue and a next-date lookup. */
export function lunarHintFor(
  metas: readonly { readonly id: string; readonly name: string; readonly emoji: string }[],
  nextMain: (id: string) => CivilDate | null,
  today: CivilDate,
  withinDays = 40,
): LunarHint | null {
  let best: LunarHint | null = null;
  for (const m of metas) {
    const kind = LUNAR_HOLIDAYS[m.id];
    if (!kind) continue;
    const main = nextMain(m.id);
    if (!main) continue;
    const sleeps = diffDays(today, main);
    if (sleeps < 0 || sleeps > withinDays) continue;
    if (!best || sleeps < best.sleeps) best = { id: m.id, name: m.name, emoji: m.emoji, sleeps, kind };
  }
  return best;
}

export interface MoonCard {
  readonly phase: MoonPhase;
  readonly pct: number;
  readonly waxing: boolean;
  readonly sleepsToFull: number;
  readonly sleepsToNew: number;
  readonly status: string;
  readonly detail: string;
  readonly hint: string | null;
}

export function moonCard(now: Date, hint: LunarHint | null = null): MoonCard {
  const phase = moonPhase(now);
  const month = (phase.nextNew.getTime() - phase.lastNew.getTime()) / 86_400_000;
  const waxing = phase.age < month / 2;
  const pct = Math.round(phase.fraction * 100);
  const sleepsToFull = sleepsUntil(now, phase.nextFull);
  const sleepsToNew = sleepsUntil(now, phase.nextNew);
  const status = wfmt('moonStatus', { phase: phase.label });
  let detail: string;
  if (phase.phase === 'full' || sleepsToFull === 0) detail = wfmt('moonFullTonight');
  else if (phase.phase === 'new' || sleepsToNew === 0) detail = `${wfmt('moonNewTonight')} ${wfmt('moonNextFull', { sleeps: pluralSleeps(sleepsToFull) })}`;
  else detail = waxing
    ? wfmt('moonNextFull', { sleeps: pluralSleeps(sleepsToFull) })
    : `${wfmt('moonNextNew', { sleeps: pluralSleeps(sleepsToNew) })} · ${wfmt('moonNextFull', { sleeps: pluralSleeps(sleepsToFull) })}`;
  let hintText: string | null = null;
  if (hint) {
    const when = hint.sleeps === 0 ? wfmt('isToday') : wfmt('inSleeps', { sleeps: pluralSleeps(hint.sleeps) });
    const key = hint.kind === 'full' ? 'moonHintFull' : hint.kind === 'new' ? 'moonHintNew' : hint.kind === 'crescent' ? 'moonHintCrescent' : 'moonHintMoon';
    hintText = wfmt(key, { emoji: hint.emoji, name: hint.name, when });
  }
  return { phase, pct, waxing, sleepsToFull, sleepsToNew, status, detail, hint: hintText };
}

// ───────────────────────────────────────────────────────── 🎆 the New Year wave

export interface MidnightCard {
  readonly target: CivilDate;
  readonly order: readonly Arrival[];
  readonly arrived: number;
  readonly total: number;
  readonly next: readonly Arrival[];
  /** The most recent arrival, if any. */
  readonly latest: Arrival | null;
  readonly yours: YourTurn;
  /** Region east of this meridian (to 180°) is already in the new day (mean solar time). */
  readonly meridian: number;
  readonly status: string;
  readonly yourText: string;
}

export function midnightCard(now: Date, cities: readonly City[], deviceZone: string, target: CivilDate, name?: string): MidnightCard {
  const order = arrivalOrder(cities, now, target);
  const arrived = arrivedCount(order);
  const total = order.length;
  const yours = yourTurn(deviceZone, now, target);
  const first = order[0];
  let status: string;
  if (arrived === 0 && first) status = wfmt('waveStartsIn', { time: durationWords(first.msUntil), city: cityLabel(first.city) });
  else if (arrived === total) status = wfmt('waveAll', { year: target.y });
  else status = wfmt('waveStatus', { n: arrived, total, year: target.y });
  const time = durationWords(yours.msUntil);
  const yourText = yours.arrived
    ? wfmt('waveYourDone', { year: target.y })
    : name ? wfmt('waveYourTurnName', { name, time }) : wfmt('waveYourTurn', { time });
  return {
    target, order, arrived, total,
    next: nextArrivals(order, 5),
    latest: arrived > 0 ? order[arrived - 1]! : null,
    yours,
    meridian: midnightMeridian(now, utcDayStart(target)),
    status, yourText,
  };
}

// ───────────────────────────────────────────────────────── 🎅 Santa

export interface SantaCard {
  readonly status: SantaStatus;
  /** 1–26 December on the device. */
  readonly season: boolean;
  readonly headline: string;
  readonly lines: readonly string[];
  /** "96,200,000 presents delivered" while flying or done, else null. */
  readonly presents: string | null;
  /** "over Japan" style phrase for the canvas label. */
  readonly where: string;
}

/** What the sleigh is over: a country name, the sea, or the pole legs. */
export function santaWhere(s: SantaStatus): string {
  if (s.phase === 'workshop' || s.phase === 'done') return 'at the North Pole';
  if (!s.from.city) return 'leaving the North Pole';
  if (!s.to.city) return 'heading home to the North Pole';
  const c = countryAt(s.lonlat.lon, s.lonlat.lat);
  return c ? `over ${c.name}` : 'over the sea';
}

export function santaCard(now: Date, cities: readonly City[], deviceZone: string, today: CivilDate, name?: string): SantaCard {
  const s = santaStatus(now, cities, deviceZone);
  const season = today.m === 12 && today.d <= 26;
  const lines: string[] = [];
  let headline: string;
  if (s.phase === 'flying') {
    if (!s.from.city) headline = wfmt('santaLeaving');
    else if (!s.to.city) headline = wfmt('santaHeadingHome');
    else {
      const c = countryAt(s.lonlat.lon, s.lonlat.lat);
      headline = c ? wfmt('santaOver', { place: c.name }) : wfmt('santaOverSea');
    }
    if (s.next) lines.push(wfmt('santaNext', { city: cityLabel(s.next), time: durationWords(s.msUntilNextStop) }));
    const time = durationWords(s.msUntilYourHouse);
    lines.push(s.msUntilYourHouse > 0
      ? name ? wfmt('santaYourHouseName', { name, time }) : wfmt('santaYourHouse', { time })
      : wfmt('santaBeenHere'));
  } else if (s.phase === 'done') {
    headline = wfmt('santaDone');
  } else if (today.m === 12 && today.d === 24) {
    headline = wfmt('santaEve', { time: durationWords(s.route.departs - now.getTime()) });
  } else if (today.m === 12 && today.d < 24) {
    headline = wfmt('santaCountdown', { sleeps: pluralSleeps(sleepsToChristmasEve(today)) });
  } else if (today.m === 12 && today.d >= 25) {
    headline = wfmt('santaDone');
  } else {
    headline = wfmt('santaOffSeason');
  }
  const presents = s.phase === 'workshop' ? null : wfmt('santaPresents', { n: commaNumber(s.presents) });
  return { status: s, season, headline, lines, presents, where: santaWhere(s) };
}

// ───────────────────────────────────────────────────────── 🌍 right now around the world

export interface NowRow {
  readonly city: City;
  /** "9:41 PM" in the viewer's locale. */
  readonly time: string;
  readonly date: CivilDate;
  /** Local date minus the device's date: −1, 0 or +1. */
  readonly shift: number;
  readonly day: boolean;
  readonly holidays: readonly WorldHoliday[];
}

export interface NowCard {
  readonly rows: readonly NowRow[];
  /** "It's already New Year's Day in Sydney!" when a city is a day ahead into a holiday. */
  readonly headline: string | null;
}

export interface NowOptions {
  readonly locale?: string;
  /** The device's civil date (defaults to its local date at `now`). */
  readonly today?: CivilDate;
  /** Holidays worth a headline (big ones); defaults to all. */
  readonly isBig?: (id: string) => boolean;
  readonly ids?: readonly string[];
}

/** Caches `holidaysOn` by ISO date so a once-a-second refresh never re-expands the calendar. */
export function memoHolidays(holidaysOn: HolidaysOn, size = 16): HolidaysOn {
  const cache = new Map<string, readonly WorldHoliday[]>();
  return (civil) => {
    const key = formatIso(civil);
    let hit = cache.get(key);
    if (!hit) {
      hit = holidaysOn(civil);
      if (cache.size >= size) cache.delete(cache.keys().next().value as string);
      cache.set(key, hit);
    }
    return hit;
  };
}

export function celebratingNowCard(now: Date, cities: readonly City[], holidaysOn: HolidaysOn, opts: NowOptions = {}): NowCard {
  const ids = opts.ids ?? SHOWCASE_CITY_IDS;
  const byId = new Map(cities.map((c) => [c.id, c] as const));
  let picked = ids.map((id) => byId.get(id)).filter((c): c is City => c !== undefined);
  if (picked.length === 0) picked = cities.slice(0, 12);
  const today = opts.today ?? { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  const isBig = opts.isBig ?? (() => true);
  const sub = subsolarPoint(now);
  const todays = new Set(holidaysOn(today).map((x) => x.id));
  const rows: NowRow[] = picked.map((city) => {
    const lc = localClock(city.tz, now);
    const date: CivilDate = { y: lc.y, m: lc.m, d: lc.d };
    return {
      city,
      time: formatClock(city.tz, now, opts.locale),
      date,
      shift: Math.max(-1, Math.min(1, diffDays(today, date))),
      day: altitudeAt(sub, city.lon, city.lat) > -0.833,
      holidays: holidaysOn(date),
    };
  });
  let headline: string | null = null;
  for (const want of [1, -1]) {
    for (const r of rows) {
      if (r.shift !== want || headline) continue;
      const h = r.holidays.find((x) => isBig(x.id) && !todays.has(x.id));
      if (h) headline = wfmt(want === 1 ? 'nowAlready' : 'nowStill', { holiday: `${h.name} ${h.emoji}`, city: r.city.name });
    }
  }
  return { rows, headline };
}

// ───────────────────────────────────────────────────────── pretend shows

/**
 * Pretend clock for the replays: `leadMs` of show time at `leadSpeed`× (so a countdown is
 * visible before the first event), then `speed`× (600: ten minutes every second).
 */
export function showTime(startMs: number, elapsedMs: number, speed = 600, leadMs = 60_000, leadSpeed = 20): number {
  const leadReal = leadMs / leadSpeed;
  if (elapsedMs <= leadReal) return startMs + elapsedMs * leadSpeed;
  return startMs + leadMs + (elapsedMs - leadReal) * speed;
}
