/**
 * The globe's live layers, driven by the clock: the sun over the subsolar point, the New Year
 * wave (a golden tint over everywhere already in the new year, the glowing midnight line,
 * party poppers on the cities that just made it, a pulsing dot on the next one) and Santa's
 * sleigh with its glowing trail. Each runs on real time or on its pretend show's fast clock
 * ("Watch the New Year arrive", "Peek at last year's route"), and during a show the camera
 * follows the action until the child grabs the globe.
 *
 * `sync()` is cheap: it runs every frame during a show and once a second otherwise.
 */
import type { CivilDate } from '../dates/civil';
import type { City } from './data/cities';
import type { Globe, GlobeMarker } from './globe';
import { arrivalOrder, inNewYearWindow, midnightMeridian, newYearShowStart, newYearTarget, utcDayStart } from './midnight';
import { santaArrivals, waveArrivals, type Arrival } from './album';
import { WORLD_COPY, wfmt } from './copy';
import { homeCityId, santaPosition, santaRoute, type SantaRoute } from './santa';
import { subsolarPoint } from './sun';
import { showTime } from './trackers';

export type ShowKind = 'wave' | 'santa';

interface Show { readonly kind: ShowKind; readonly start: number; readonly end: number; t0: number }

/** Show clock: how long the camera waits after the child lets go before following again. */
const FOLLOW_PAUSE_MS = 8000;
/** How far ahead the sleigh looks to decide which way it faces. */
const LOOK_AHEAD_MS = 8 * 60_000;

export interface LiveOptions {
  readonly globe: Globe;
  readonly cities: readonly City[];
  /** The device's IANA zone: Santa visits its city first in its zone, exactly at midnight. */
  readonly zone: string;
  readonly now: () => Date;
  /** Called when the set of markers changes (the view adds its own and pushes them). */
  readonly onMarkers: () => void;
  /**
   * Called when Santa or midnight reaches cities (live or in a show), with the visit instants and
   * the album year (Christmas Eve's year, or the year the wave brings). Never on the first sync
   * after opening or starting a show, so old stops are not replayed.
   */
  readonly onArrive?: (kind: ShowKind, reached: readonly Arrival[], year: number) => void;
}

export class LiveLayers {
  private show: Show | null = null;
  private showRoute: SantaRoute | null = null;
  private followPausedUntil = 0;
  /** While a postcard is up, the show's clock stands still (performance.now() when it stopped). */
  private heldAt: number | null = null;
  private waveOn = false;
  private santaOn = false;
  private lastArrived = -1;
  private lastLeg = -2;
  private lastSunAt = 0;
  private lastSunFrame = 0;
  private waveMarkers: GlobeMarker[] = [];
  private waveCache: { key: number; cities: City[]; times: number[] } | null = null;
  private readonly sun: GlobeMarker = { id: 'sun', lon: 0, lat: 0, sprite: 'sun' };
  private readonly sleigh: GlobeMarker = { id: 'santa', lon: 0, lat: 90, sprite: 'sleigh', toward: null, label: 'Santa' };

  constructor(private readonly o: LiveOptions) {}

  /** Which pretend show is running, if any. */
  get showing(): ShowKind | null { return this.show?.kind ?? null; }
  /** Whether the wave tint / the sleigh are on the globe right now (for the legend and label). */
  get wave(): boolean { return this.waveOn; }
  get santa(): boolean { return this.santaOn; }
  /** How many cities the wave has reached. */
  get arrived(): number { return Math.max(0, this.lastArrived); }

  /** The clock a tracker runs on: real time, or its show's fast pretend clock. */
  clock(kind: ShowKind): Date {
    const s = this.show;
    if (s && s.kind === kind) return new Date(Math.min(s.end, showTime(s.start, (this.heldAt ?? performance.now()) - s.t0)));
    return this.o.now();
  }

  /** The markers this layer owns, sun first and the sleigh last (on top). */
  markers(): GlobeMarker[] {
    const list: GlobeMarker[] = [this.sun, ...this.waveMarkers];
    if (this.santaOn) list.push(this.sleigh);
    return list;
  }

  /**
   * Holds the running show's clock (a postcard is showing: the sleigh waits over the city and
   * the camera stops following), or lets it run on from where it stood.
   */
  hold(on: boolean): void {
    if (on) {
      if (this.heldAt === null) this.heldAt = performance.now();
      return;
    }
    if (this.heldAt === null) return;
    if (this.show) this.show.t0 += performance.now() - this.heldAt;
    this.heldAt = null;
  }

  /** Whether the show clock is held. */
  get held(): boolean { return this.heldAt !== null; }

  /** The child took hold of the globe: stop following for a few seconds. */
  pauseFollow(): void {
    this.followPausedUntil = performance.now() + FOLLOW_PAUSE_MS;
  }

  /** Starts a show, or stops it if it is the one running. Returns the show now running. */
  toggle(kind: ShowKind, today: CivilDate): ShowKind | null {
    if (this.show?.kind === kind) {
      this.show = null;
      this.showRoute = null;
    } else if (kind === 'wave') {
      const target = newYearTarget(today);
      const times = this.waveData(target).times;
      this.show = { kind, start: newYearShowStart(target) - 60_000, end: (times[times.length - 1] ?? 0) + 3_600_000, t0: performance.now() };
      this.showRoute = null;
    } else {
      const year = today.m === 12 && today.d >= 25 ? today.y : today.y - 1;
      this.showRoute = santaRoute(year, this.o.cities, homeCityId(this.o.zone, year));
      this.show = { kind, start: this.showRoute.departs - 60_000, end: this.showRoute.returns + 600_000, t0: performance.now() };
    }
    this.followPausedUntil = 0;
    this.heldAt = null;
    this.lastArrived = -1;
    this.lastLeg = -2;
    this.lastSunAt = 0;
    if (!this.show) this.o.globe.setTime(this.o.now());
    return this.showing;
  }

  /** Arrival instants for the wave, computed once per target year. */
  private waveData(target: CivilDate): { cities: City[]; times: number[] } {
    if (!this.waveCache || this.waveCache.key !== target.y) {
      const order = arrivalOrder(this.o.cities, new Date(utcDayStart(target)), target);
      this.waveCache = { key: target.y, cities: order.map((a) => a.city), times: order.map((a) => a.at.getTime()) };
    }
    return this.waveCache;
  }

  /** Brings every layer up to date with its clock. */
  sync(today: CivilDate): void {
    const g = this.o.globe;
    const tNow = performance.now();
    const following = this.show !== null && tNow > this.followPausedUntil && this.heldAt === null;

    // The New Year wave: live in its week, or during its show.
    const waveLive = this.show?.kind === 'wave' || (this.show === null && inNewYearWindow(today));
    if (waveLive) {
      const now = this.clock('wave').getTime();
      const target = newYearTarget(today);
      const { cities, times } = this.waveData(target);
      let lo = 0;
      let hi = times.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (times[mid]! <= now) lo = mid + 1; else hi = mid; }
      g.setNewDay(midnightMeridian(new Date(now), utcDayStart(target)));
      if (lo !== this.lastArrived || !this.waveOn) {
        const prev = this.waveOn ? this.lastArrived : -1;
        this.lastArrived = lo;
        const reached = waveArrivals(cities, times, prev, lo);
        if (reached.length > 0) this.o.onArrive?.('wave', reached, target.y);
        this.waveOn = true;
        this.waveMarkers = cities.slice(0, lo).map((c, i): GlobeMarker => (i >= lo - 6
          ? { id: `wave:${c.id}`, lon: c.lon, lat: c.lat, emoji: '🎉', size: 24 }
          : { id: `wave:${c.id}`, lon: c.lon, lat: c.lat, dot: '#ffd166', size: 7 }));
        const next = cities[lo];
        if (next) this.waveMarkers.push({ id: `city:${next.id}`, lon: next.lon, lat: next.lat, dot: '#ffd166', size: 12, pulse: true, label: next.name });
        this.o.onMarkers();
      }
      const focus = cities[Math.min(lo, cities.length - 1)];
      // Most of the planet's cities are north of the tropics: aim a little north so the wave front sits mid-globe.
      if (following && this.show?.kind === 'wave' && focus) g.followTo(focus.lon, 22);
    } else if (this.waveOn) {
      this.waveOn = false;
      this.lastArrived = -1;
      this.waveMarkers = [];
      g.setNewDay(null);
      this.o.onMarkers();
    }

    // Santa: flying on Christmas Eve where you are, or during the replay.
    const year = today.m === 1 ? today.y - 1 : today.y;
    const route = this.showRoute ?? santaRoute(year, this.o.cities, homeCityId(this.o.zone, year));
    const t = this.clock('santa').getTime();
    const pos = this.show && this.show.kind !== 'santa' ? null : santaPosition(route, t);
    const flying = pos !== null && pos.leg >= 0 && pos.leg < route.stops.length - 1;
    if (pos && flying) {
      this.sleigh.lon = pos.lon;
      this.sleigh.lat = pos.lat;
      const ahead = santaPosition(route, t + LOOK_AHEAD_MS);
      this.sleigh.toward = { lon: ahead.lon, lat: ahead.lat };
      if (pos.leg !== this.lastLeg) {
        const prev = this.lastLeg;
        this.lastLeg = pos.leg;
        const reached = santaArrivals(route.stops, prev, pos.leg);
        if (reached.length > 0) this.o.onArrive?.('santa', reached, route.year);
        g.setTrail(route.stops.slice(0, pos.leg + 1));
        const next = route.stops[pos.leg + 1];
        this.sleigh.label = next?.city ? wfmt('santaNextShort', { city: next.city.name }) : WORLD_COPY.santaHomeShort;
      }
      if (!this.santaOn) { this.santaOn = true; this.o.onMarkers(); }
      g.setTrailHead(pos.lon, pos.lat);
      if (following && this.show?.kind === 'santa') g.followTo(pos.lon, Math.max(-35, Math.min(50, pos.lat)));
      g.invalidate();
    } else if (this.santaOn) {
      this.santaOn = false;
      this.lastLeg = -2;
      g.setTrail(null);
      this.o.onMarkers();
    }

    // The sun moves with whichever clock is on screen (shows run ten minutes a second).
    const sunClock = this.show ? this.clock(this.show.kind) : this.o.now();
    const due = this.show ? tNow - this.lastSunFrame > 90 : sunClock.getTime() - this.lastSunAt > 60_000 || this.lastSunAt === 0;
    if (due) {
      this.lastSunFrame = tNow;
      this.lastSunAt = sunClock.getTime();
      g.setTime(sunClock);
      const sp = subsolarPoint(sunClock);
      this.sun.lon = sp.lon;
      this.sun.lat = sp.lat;
    }
  }

  /** Where to point the camera first: at Santa while he is flying for real. */
  santaNow(): { lon: number; lat: number } | null {
    return this.santaOn && !this.show ? { lon: this.sleigh.lon, lat: this.sleigh.lat } : null;
  }

  /** …or at the next city the real New Year wave is about to reach. */
  waveNow(): { lon: number; lat: number } | null {
    if (!this.waveOn || this.show) return null;
    const next = this.waveMarkers.find((m) => m.pulse === true);
    return next ? { lon: next.lon, lat: 22 } : null;
  }
}
