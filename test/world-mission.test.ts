/** Santa Mission Control's math: speed, altitude, logs, the home countdown, the team, the checklist, the report and treats. */
import { describe, expect, it } from 'vitest';
import { WORLD_COPY } from '../src/world/copy';
import { CITIES, cityById } from '../src/world/data/cities';
import { distanceKm } from '../src/world/geo';
import {
  CLOSE_MS, CRUISE_FT, MISSION_COPY, REINDEER, TREATS_KEY, comingUp, dialScale, flightLog, flightReport, homeInfo, liveStats,
  missionStage, parseTreats, preflight, reindeerRoster, treatsStorage,
} from '../src/world/mission';
import { homeCityId, santaRoute, santaStatus } from '../src/world/santa';

const HOUR = 3_600_000;
const ZONE = 'America/New_York';
const home = cityById('new-york')!;
const route = santaRoute(2026, CITIES, homeCityId(ZONE, 2026));
const at = (iso: string): number => new Date(iso).getTime();
const midLeg = (k: number): number => Math.round((route.stops[k]!.at + route.stops[k + 1]!.at) / 2);
const status = (t: number) => santaStatus(new Date(t), CITIES, ZONE);
const stats = (t: number) => liveStats(route, status(t), t);

describe('mission stage and live stats', () => {
  it('knows before, during and after the flight', () => {
    expect(missionStage(route, route.departs - 1)).toBe('pre');
    expect(missionStage(route, route.departs)).toBe('flying');
    expect(missionStage(route, route.returns)).toBe('landed');
  });

  it('works out speed from the real leg distance and time', () => {
    const k = 40;
    const t = midLeg(k);
    const a = route.stops[k]!;
    const b = route.stops[k + 1]!;
    const expected = Math.round(distanceKm(a, b) / ((b.at - a.at) / HOUR));
    const s = stats(t);
    expect(s.speedKmh).toBe(expected);
    expect(s.speedMph).toBe(Math.round(expected / 1.609344));
    expect(s.speedKmh).toBeGreaterThan(0);
  });

  it('keeps altitude at or under the cruising ceiling, and at rooftops beside a stop', () => {
    for (let k = 5; k < 80; k++) {
      for (const f of [0.2, 0.35, 0.5, 0.65, 0.8]) {
        const a = route.stops[k]!;
        const b = route.stops[k + 1]!;
        const t = Math.round(a.at + (b.at - a.at) * f);
        const s = stats(t);
        expect(s.altitudeFt).toBeLessThanOrEqual(CRUISE_FT.max);
        expect(s.altitudeFt).toBeGreaterThan(0);
        expect(stats(t).altitudeFt).toBe(s.altitudeFt);
      }
    }
    expect(stats(route.stops[30]!.at + 1000).altitudeFt).toBeLessThan(CRUISE_FT.min);
    const cruising = [0, 0.25, 0.5, 0.75].map((f) => { const t = Math.round(route.stops[30]!.at + (route.stops[31]!.at - route.stops[30]!.at) * (0.3 + f * 0.4)); return stats(t).altitudeFt; });
    expect(new Set(cruising).size).toBeGreaterThan(1);
    for (const ft of cruising) expect(ft).toBeGreaterThanOrEqual(CRUISE_FT.min);
  });

  it('counts distance, stops, presents and the bag as the flight goes', () => {
    const early = stats(midLeg(3));
    const late = stats(midLeg(90));
    expect(late.distanceKm).toBeGreaterThan(early.distanceKm);
    expect(early.stopsDone).toBe(3);
    expect(late.stopsDone).toBe(90);
    expect(late.stopsTotal).toBe(CITIES.length);
    expect(late.presents).toBeGreaterThan(early.presents);
    expect(late.percentLeft).toBeLessThan(early.percentLeft);
    expect(early.cookies).toBe(9);
    expect(early.carrots).toBe(24);
    expect(late.zonesCrossed).toBeGreaterThan(early.zonesCrossed);
  });

  it('is empty before takeoff and full after landing', () => {
    expect(stats(route.departs - HOUR)).toMatchObject({ speedKmh: 0, altitudeFt: 0, distanceKm: 0, stopsDone: 0, presents: 0, percentLeft: 100 });
    const done = stats(route.returns + 5 * 60_000);
    expect(done.stopsDone).toBe(CITIES.length);
    expect(done.percentLeft).toBe(0);
    expect(done.bagLeft).toBe(0);
    expect(done.distanceKm).toBe(flightReport(route, home).distanceKm);
  });

  it('puts the dial top above the fastest leg', () => {
    expect(stats(midLeg(10)).dialMaxKmh).toBeGreaterThanOrEqual(flightReport(route, home).topKmh);
    expect(dialScale(27_000)).toEqual({ max: 30_000, step: 5000 });
    expect(dialScale(900).max).toBe(1000);
  });
});

describe('flight log and coming up', () => {
  it('lists the last six visits newest first, each with local time', () => {
    const log = flightLog(route, midLeg(50), 'en-US');
    expect(log).toHaveLength(6);
    expect(log[0]!.city.id).toBe(route.stops[50]!.city!.id);
    expect(log[5]!.city.id).toBe(route.stops[45]!.city!.id);
    for (let i = 1; i < log.length; i++) expect(log[i]!.at).toBeLessThanOrEqual(log[i - 1]!.at);
    expect(log[0]!.time).toMatch(/\d:\d\d/);
    expect(flightLog(route, route.departs, 'en-US')).toEqual([]);
    expect(flightLog(route, midLeg(2), 'en-US')).toHaveLength(2);
  });

  it('lists the next three stops with ETAs', () => {
    const t = midLeg(50);
    const next = comingUp(route, t, 'en-US');
    expect(next.map((n) => n.city.id)).toEqual([51, 52, 53].map((k) => route.stops[k]!.city!.id));
    expect(next[0]!.etaMs).toBe(route.stops[51]!.at - t);
    expect(comingUp(route, route.returns + 1)).toEqual([]);
    expect(comingUp(route, route.departs - 1)[0]!.city.id).toBe(route.stops[1]!.city!.id);
  });
});

describe('distance to home', () => {
  const arrives = route.stops.find((s) => s.city?.id === home.id)!.at;

  it('is far, then close inside two hours, then visited', () => {
    const info = (t: number) => homeInfo(route, status(t), t, home);
    expect(info(arrives - CLOSE_MS - 60_000).stage).toBe('far');
    expect(info(arrives - CLOSE_MS + 60_000).stage).toBe('close');
    expect(info(arrives - 1).stage).toBe('close');
    expect(info(arrives + 1000).stage).toBe('visited');
  });

  it('measures kilometers and miles to the viewer city', () => {
    const t = arrives - 30 * 60_000;
    const h = homeInfo(route, status(t), t, home);
    expect(h.distanceKm).toBe(Math.round(distanceKm(status(t).lonlat, home)));
    expect(h.distanceMi).toBe(Math.round(h.distanceKm / 1.609344));
    expect(h.etaMs).toBe(30 * 60_000);
    expect(h.at).toBe(arrives);
  });

  it('reaches New York at its own midnight', () => {
    expect(arrives).toBe(at('2026-12-25T00:00:00-05:00'));
  });
});

describe('reindeer', () => {
  it('names exactly the eight from the 1823 poem and never Rudolph', () => {
    expect([...REINDEER]).toEqual(['Dasher', 'Dancer', 'Prancer', 'Vixen', 'Comet', 'Cupid', 'Donder', 'Blitzen']);
    expect(JSON.stringify([WORLD_COPY, MISSION_COPY, REINDEER])).not.toMatch(/rudolph|red-nosed/i);
  });

  it('rotates moods and the lead by leg, deterministically', () => {
    const a = reindeerRoster(route, midLeg(10));
    const b = reindeerRoster(route, midLeg(11));
    expect(a).toHaveLength(8);
    expect(a.filter((r) => r.lead)).toHaveLength(1);
    expect(a.find((r) => r.lead)!.name).toBe(REINDEER[10 % 8]);
    expect(b.find((r) => r.lead)!.name).toBe(REINDEER[11 % 8]);
    expect(a[0]!.mood).not.toBe(b[0]!.mood);
    expect(reindeerRoster(route, midLeg(10))).toEqual(a);
    expect(reindeerRoster(route, route.departs - 1).some((r) => r.lead)).toBe(false);
  });
});

describe('pre-flight checklist', () => {
  it('has 24 jobs and ticks those up to today', () => {
    expect(MISSION_COPY.jobs).toHaveLength(24);
    expect(preflight({ y: 2026, m: 12, d: 10 }).done).toBe(10);
    expect(preflight({ y: 2026, m: 12, d: 1 }).jobs.filter((j) => j.done).map((j) => j.day)).toEqual([1]);
    expect(preflight({ y: 2026, m: 12, d: 24 }).done).toBe(24);
    expect(preflight({ y: 2026, m: 12, d: 26 }).done).toBe(24);
    expect(preflight({ y: 2026, m: 11, d: 30 }).done).toBe(0);
  });
});

describe('flight report', () => {
  it('totals the whole flight and when he reached home', () => {
    const r = flightReport(route, home);
    expect(r.stops).toBe(CITIES.length);
    expect(r.distanceKm).toBeGreaterThan(50_000);
    expect(r.topKmh).toBeGreaterThan(0);
    expect(r.topMph).toBe(Math.round(r.topKmh / 1.609344));
    expect(r.flightMs).toBe(route.returns - route.departs);
    expect(r.homeAt).toBe(at('2026-12-25T00:00:00-05:00'));
    expect(r.presents).toBe(stats(route.returns).presentsTotal);
  });
});

describe('treats', () => {
  const store = () => {
    const data = new Map<string, string>();
    return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } };
  };

  it('saves under jubilee.santa.v1 per year', () => {
    const s = store();
    const t = treatsStorage(false, s);
    expect(t.read(2026)).toEqual({ cookies: false, milk: false, carrots: false });
    t.set(2026, 'cookies', true);
    t.set(2026, 'milk', true);
    expect(s.data.has(TREATS_KEY)).toBe(true);
    expect(treatsStorage(false, s).read(2026)).toEqual({ cookies: true, milk: true, carrots: false });
    expect(treatsStorage(false, s).read(2027).cookies).toBe(false);
    t.set(2026, 'milk', false);
    expect(treatsStorage(false, s).read(2026).milk).toBe(false);
  });

  it('saves nothing while pretending, but remembers for the visit', () => {
    const s = store();
    const t = treatsStorage(true, s);
    t.set(2026, 'carrots', true);
    expect(s.data.size).toBe(0);
    expect(t.read(2026).carrots).toBe(true);
  });

  it('survives broken storage and junk', () => {
    const broken = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    const t = treatsStorage(false, broken);
    expect(t.read(2026).cookies).toBe(false);
    expect(t.set(2026, 'cookies', true).cookies).toBe(true);
    expect(t.read(2026).cookies).toBe(true);
    expect(parseTreats('{nope', 2026).milk).toBe(false);
    expect(parseTreats('{"v":2}', 2026).milk).toBe(false);
    expect(treatsStorage(false, null).set(2026, 'milk', true).milk).toBe(true);
  });
});
