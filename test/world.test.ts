/**
 * The World view's math and data: projections and hemisphere clipping, the sun and the
 * moon, time zones, the New Year wave, Santa's flight, and the hand-made city and
 * "celebrated in" tables. Everything here is pure and runs in Node; the canvas and the DOM
 * are reviewed with screenshots instead. Nothing depends on the process time zone (the
 * suite runs in New York and again in Kiritimati).
 */
import { describe, expect, it } from 'vitest';
import { CELEBRATED, holidaysCelebratedIn } from '../src/world/data/celebrated';
import { CITIES, SHOWCASE_CITY_IDS, cityById, flagEmoji, type City } from '../src/world/data/cities';
import { COUNTRY_NAMES, EXTRA_COUNTRY_NAMES } from '../src/world/data/countries';
import { durationClock, durationWords } from '../src/world/copy';
import {
  angularDistance, bearing, distanceKm, lonlatToVec3, normLon, slerp, smallCircleRing, vec3ToLonlat, type LonLat,
} from '../src/world/geo';
import {
  arrivalOrder, arrivedCount, midnightMeridian, nextArrivals, newYearShowStart, newYearTarget, utcDayStart, yourTurn,
} from '../src/world/midnight';
import { moonPhase, nextPhase, previousPhase } from '../src/world/moon';
import { Equirectangular, Orthographic, clipRingToHemisphere } from '../src/world/projection';
import { homeCityId, santaPosition, santaRoute, santaStatus, trailStops } from '../src/world/santa';
import { countryAt, countryCenter, prepareShapes } from '../src/world/shapes';
import { isDay, subsolarPoint, sunAltitude, terminatorRing } from '../src/world/sun';
import { celebratingNowCard, midnightCard, moonCard, santaCard, showTime, sunCard } from '../src/world/trackers';
import { cityForZone, isSupportedZone, localClock, offsetMinutes, zoneMidnight } from '../src/world/zones';
import { GlobeCamera, MAX_LAT, MAX_ZOOM, MIN_ZOOM } from '../src/world/globe-camera';
import { DEFAULT_COLORS, globePalette, highlightFor } from '../src/world/palette';
import { THEMES } from '../src/theme/themes';

const utc = (iso: string): Date => new Date(iso);
const city = (id: string): City => {
  const c = cityById(id);
  if (!c) throw new Error(`no city ${id}`);
  return c;
};

/** Spec §2: all 76 holiday ids (22 tier-1, 30 tier-2, 24 silly days). */
const HOLIDAY_IDS = [
  'christmas', 'hanukkah', 'diwali', 'eid-al-fitr', 'lunar-new-year', 'halloween', 'thanksgiving', 'easter', 'holi',
  'day-of-the-dead', 'kwanzaa', 'juneteenth', 'nowruz', 'mid-autumn-festival', 'st-patricks-day', 'valentines-day',
  'mothers-day', 'fathers-day', 'independence-day-us', 'earth-day', 'pi-day', 'new-years-eve',
  'new-years-day', 'three-kings-day', 'mlk-day', 'groundhog-day', 'lantern-festival', 'pancake-day', 'leap-day', 'purim',
  'passover', 'ramadan', 'orthodox-easter', 'april-fools-day', 'songkran', 'cinco-de-mayo', 'childrens-day-japan',
  'eid-al-adha', 'dragon-boat-festival', 'memorial-day', 'canada-day', 'bastille-day', 'independence-day-india',
  'labor-day', 'grandparents-day', 'independence-day-mexico', 'chuseok', 'rosh-hashanah', 'indigenous-peoples-day',
  'bonfire-night', 'st-nicholas-day', 'boxing-day',
  'squirrel-day', 'puzzle-day', 'pizza-day', 'kind-acts-day', 'tooth-fairy-day', 'wildlife-day', 'happiness-day',
  'book-day', 'star-wars-day', 'bee-day', 'childrens-day', 'donut-day', 'oceans-day', 'emoji-day', 'ice-cream-day',
  'pi-approximation-day', 'friendship-day', 'left-handers-day', 'dot-day', 'pirate-day', 'smile-day', 'animal-day',
  'kindness-day', 'hello-day',
] as const;

// ───────────────────────────────────────────────────────── geometry

describe('geo', () => {
  it('normalizes longitudes into (−180, 180]', () => {
    expect(normLon(190)).toBe(-170);
    expect(normLon(-180)).toBe(180);
    expect(normLon(540)).toBe(180);
    expect(normLon(-725)).toBe(-5);
  });

  it('round-trips unit vectors and measures great circles', () => {
    for (const [lon, lat] of [[0, 0], [139.69, 35.68], [-74.01, 40.71], [178.4, -18.1], [-157.4, 1.9]] as const) {
      const back = vec3ToLonlat(lonlatToVec3(lon, lat));
      expect(back.lon).toBeCloseTo(lon, 9);
      expect(back.lat).toBeCloseTo(lat, 9);
    }
    // London → Paris is about 344 km; New York → London about 5,570 km.
    expect(distanceKm(city('london'), city('paris'))).toBeGreaterThan(330);
    expect(distanceKm(city('london'), city('paris'))).toBeLessThan(355);
    expect(Math.abs(distanceKm(city('new-york'), city('london')) - 5570)).toBeLessThan(40);
    expect(bearing({ lon: 0, lat: 0 }, { lon: 0, lat: 10 })).toBeCloseTo(0, 6);
    expect(bearing({ lon: 0, lat: 0 }, { lon: 10, lat: 0 })).toBeCloseTo(90, 6);
  });

  it('slerps along the great circle, across the date line', () => {
    const a: LonLat = { lon: 170, lat: 0 };
    const b: LonLat = { lon: -170, lat: 0 };
    const mid = slerp(a, b, 0.5);
    expect(Math.abs(mid.lon)).toBeCloseTo(180, 6);
    expect(mid.lat).toBeCloseTo(0, 6);
    expect(slerp(a, b, 0)).toEqual(a);
    expect(slerp(a, b, 1)).toEqual(b);
    // A quarter of the way covers a quarter of the angle.
    const q = slerp(city('tokyo'), city('los-angeles'), 0.25);
    expect(angularDistance(city('tokyo'), q) / angularDistance(city('tokyo'), city('los-angeles'))).toBeCloseTo(0.25, 6);
  });
});

/** Shoelace area of projected polygons (screen y points down, so CCW-on-screen is negative). */
function polyArea(polys: readonly { x: number; y: number }[][]): number {
  let total = 0;
  for (const p of polys) {
    let a = 0;
    for (let i = 0; i < p.length; i++) {
      const q = p[i]!;
      const r = p[(i + 1) % p.length]!;
      a += q.x * r.y - r.x * q.y;
    }
    total += Math.abs(a) / 2;
  }
  return total;
}

/** Area of the disc whose unprojected point passes `inside`, by sampling a grid of pixels. */
function sampledArea(proj: Orthographic, inside: (p: LonLat) => boolean, step = 0.5): number {
  let n = 0;
  for (let y = step / 2; y < proj.h; y += step) {
    for (let x = step / 2; x < proj.w; x += step) {
      const p = proj.unproject(x, y);
      if (p && inside(p)) n++;
    }
  }
  return n * step * step;
}

/** Distance (km) from a place to the nearest edge of a lon/lat ring, in a local flat approximation. */
function edgeKm(p: LonLat, ll: Float32Array): number {
  const k = Math.cos((p.lat * Math.PI) / 180);
  let best = Infinity;
  for (let i = 0; i + 3 < ll.length; i += 2) {
    const ax = (ll[i]! - p.lon) * k, ay = ll[i + 1]! - p.lat;
    const bx = (ll[i + 2]! - p.lon) * k, by = ll[i + 3]! - p.lat;
    const dx = bx - ax, dy = by - ay;
    const len = dx * dx + dy * dy;
    const t = len > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len)) : 0;
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy) * 111.2);
  }
  return best;
}

function globe(lon: number, lat: number, R = 100): Orthographic {
  const o = new Orthographic(lon, lat);
  o.setSize(2 * R + 20, 2 * R + 20);
  o.setScale(R);
  return o;
}

describe('projection', () => {
  it('orthographic project/unproject round-trips every visible point', () => {
    for (const [clon, clat] of [[0, 0], [78, 22], [-100, 45], [170, -40], [0, 89]] as const) {
      const o = globe(clon, clat);
      for (let lat = -80; lat <= 80; lat += 20) {
        for (let lon = -180; lon < 180; lon += 20) {
          const p = o.project(lon, lat);
          const ang = angularDistance({ lon: clon, lat: clat }, { lon, lat });
          // Points exactly on the limb may round either way.
          if (Math.abs(ang - Math.PI / 2) > 1e-6) expect(p.visible).toBe(ang < Math.PI / 2);
          if (!p.visible || ang > Math.PI / 2 - 0.01) continue;
          const back = o.unproject(p.x, p.y)!;
          expect(angularDistance(back, { lon, lat })).toBeLessThan(1e-8);
        }
      }
      expect(o.unproject(1, 1)).toBeNull();
      const center = o.project(clon, clat);
      expect(center.x).toBeCloseTo(o.w / 2, 9);
      expect(center.y).toBeCloseTo(o.h / 2, 9);
    }
  });

  it('north is up and east is right', () => {
    const o = globe(0, 0);
    const north = o.project(0, 30);
    const east = o.project(30, 0);
    expect(north.y).toBeLessThan(o.h / 2);
    expect(east.x).toBeGreaterThan(o.w / 2);
  });

  it('equirectangular round-trips and wraps to the copy nearest the center', () => {
    const m = new Equirectangular(150, 0);
    m.setSize(720, 360);
    m.setScale(2);
    for (const [lon, lat] of [[150, 0], [-170, 40], [100, -60], [179, 10]] as const) {
      const p = m.project(lon, lat);
      const back = m.unproject(p.x, p.y)!;
      expect(back.lon).toBeCloseTo(lon, 9);
      expect(back.lat).toBeCloseTo(lat, 9);
    }
    // −170 is 40° east of 150 across the date line, so it lands right of center.
    expect(m.project(-170, 0).x).toBeCloseTo(360 + 40 * 2, 9);
    expect(m.unproject(10, -5)).toBeNull();
  });

  it('keeps a ring that is fully in front as one polygon inside the disc', () => {
    const o = globe(10, 20);
    const ring = smallCircleRing(lonlatToVec3(10, 20), 30, 90);
    const polys = clipRingToHemisphere(ring, o);
    expect(polys).toHaveLength(1);
    expect(polys[0]).toHaveLength(90);
  });

  it('drops a ring that is fully behind', () => {
    const o = globe(0, 0);
    expect(clipRingToHemisphere(smallCircleRing(lonlatToVec3(180, 0), 30), o)).toHaveLength(0);
  });

  it('clips rings across the limb into closed polygons inside the disc with the right area', () => {
    const cases: { view: [number, number]; center: [number, number]; radius: number }[] = [
      { view: [0, 0], center: [90, 0], radius: 30 },     // half a cap, on the right limb
      { view: [0, 0], center: [90, 0], radius: 90 },     // the hemisphere east of the view: half the disc
      { view: [20, 30], center: [120, 10], radius: 50 },
      { view: [-60, -20], center: [-60, 70], radius: 75 },
      { view: [0, 0], center: [0, 0], radius: 120 },     // bigger than a hemisphere: the whole disc
    ];
    for (const k of cases) {
      const o = globe(k.view[0], k.view[1], 100);
      const c = { lon: k.center[0], lat: k.center[1] };
      const ring = smallCircleRing(lonlatToVec3(c.lon, c.lat), k.radius, 240);
      const polys = clipRingToHemisphere(ring, o);
      expect(polys.length).toBeGreaterThan(0);
      for (const p of polys) {
        expect(p.length).toBeGreaterThanOrEqual(3);
        for (const q of p) expect(Math.hypot(q.x - o.w / 2, q.y - o.h / 2)).toBeLessThanOrEqual(100 + 1e-3);
        // Closed: the rim walk ends within one step of where the polygon started.
        const first = p[0]!;
        const last = p[p.length - 1]!;
        expect(Math.hypot(first.x - last.x, first.y - last.y)).toBeLessThan(100 * 0.21);
      }
      const expected = sampledArea(o, (p) => angularDistance(p, c) <= (k.radius * Math.PI) / 180);
      expect(Math.abs(polyArea(polys) - expected) / expected).toBeLessThan(0.03);
    }
  });

  it('never paints a country bigger than its bounding cap, even where a simplified outline crosses itself at the limb', () => {
    const world = prepareShapes();
    // The first two views used to fill the whole disc with Sudan and Western Sahara.
    const views: [number, number][] = [[120.7523, 38.0312], [-85.5888, -30.3129]];
    for (let lon = -180; lon < 180; lon += 11.3) for (let lat = -66; lat <= 66; lat += 12.7) views.push([lon, lat]);
    for (const [lon, lat] of views) {
      const o = globe(lon, lat, 100);
      for (const country of world.countries) {
        for (const r of country.rings) {
          const cosR = r.cap[3]!;
          if (cosR <= 0) continue;
          const polys = clipRingToHemisphere(r.vec, o, Math.PI);
          // A cap of angular radius ρ projects to at most a disc of radius R·sin ρ.
          const bound = Math.PI * 100 * 100 * (1 - cosR * cosR);
          expect(polyArea(polys)).toBeLessThanOrEqual(bound * 1.02 + 1);
        }
      }
    }
  });

  it('prepares every outline once, counterclockwise from outside, with sensible centers', () => {
    const world = prepareShapes();
    expect(prepareShapes()).toBe(world);
    expect(world.countries.length).toBeGreaterThan(150);
    for (const country of world.countries) {
      for (const r of country.rings) {
        const v = r.vec;
        const n = v.length / 3;
        let sx = 0, sy = 0, sz = 0, mx = 0, my = 0, mz = 0;
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          sx += v[3 * i + 1]! * v[3 * j + 2]! - v[3 * i + 2]! * v[3 * j + 1]!;
          sy += v[3 * i + 2]! * v[3 * j]! - v[3 * i]! * v[3 * j + 2]!;
          sz += v[3 * i]! * v[3 * j + 1]! - v[3 * i + 1]! * v[3 * j]!;
          mx += v[3 * i]!; my += v[3 * i + 1]!; mz += v[3 * i + 2]!;
        }
        expect(sx * mx + sy * my + sz * mz).toBeGreaterThan(0);
      }
    }
    const india = countryCenter('IN')!;
    expect(countryAt(india.lon, india.lat)?.iso).toBe('IN');
    expect(countryAt(78.9, 21)?.iso).toBe('IN');
    expect(countryAt(-100, 40)?.iso).toBe('US');
    expect(countryAt(-30, 0)).toBeNull(); // mid-Atlantic
    expect(countryAt(10.4, 52.5)?.iso).toBe('DE');
  });
});

// ───────────────────────────────────────────────────────── sun and moon

describe('sun', () => {
  it('puts the subsolar point on the tropics at the solstices and the equator at the equinox', () => {
    expect(Math.abs(subsolarPoint(utc('2026-06-21T12:00:00Z')).lat - 23.44)).toBeLessThan(0.5);
    expect(Math.abs(subsolarPoint(utc('2026-12-21T12:00:00Z')).lat + 23.44)).toBeLessThan(0.5);
    expect(Math.abs(subsolarPoint(utc('2026-03-20T12:00:00Z')).lat)).toBeLessThan(0.5);
    expect(Math.abs(subsolarPoint(utc('2024-09-22T12:00:00Z')).lat)).toBeLessThan(0.5);
  });

  it('puts the sun over Greenwich near 12:00 UTC, off by the equation of time', () => {
    // Almanac equation of time (apparent − mean), minutes.
    const fixtures: [string, number][] = [
      ['2026-02-11T12:00:00Z', -14.2], ['2026-05-14T12:00:00Z', 3.6], ['2026-07-26T12:00:00Z', -6.5], ['2026-11-03T12:00:00Z', 16.4],
    ];
    for (const [iso, eot] of fixtures) {
      const s = subsolarPoint(utc(iso));
      expect(Math.abs(s.eot - eot)).toBeLessThan(0.5);
      // A fast sun (eot > 0) has already crossed Greenwich at 12:00 UTC, so it is west of it.
      expect(Math.abs(s.lon + s.eot / 4)).toBeLessThan(0.05);
    }
  });

  it('draws the terminator 90° from the sun and tells day from night', () => {
    const at = utc('2026-12-24T15:00:00Z');
    const s = subsolarPoint(at);
    const ring = terminatorRing(at);
    expect(ring.length).toBe(120 * 3);
    for (let i = 0; i < 120; i++) {
      const p = vec3ToLonlat([ring[3 * i]!, ring[3 * i + 1]!, ring[3 * i + 2]!]);
      expect(Math.abs(angularDistance(p, s) * (180 / Math.PI) - 90)).toBeLessThan(0.01);
    }
    expect(isDay(s.lon, s.lat, at)).toBe(true);
    expect(isDay(normLon(s.lon + 180), -s.lat, at)).toBe(false);
    expect(sunAltitude(s.lon, s.lat, at)).toBeGreaterThan(89.9);
    // Midsummer midnight sun at the North Pole, polar night at the South Pole.
    expect(isDay(0, 89, utc('2026-06-21T00:00:00Z'))).toBe(true);
    expect(isDay(0, -89, utc('2026-06-21T00:00:00Z'))).toBe(false);
  });
});

describe('moon', () => {
  const fixtures: [string, 'new' | 'full'][] = [
    ['2024-01-11T11:57:00Z', 'new'],
    ['2024-01-25T17:54:00Z', 'full'],
    ['2024-04-08T18:21:00Z', 'new'], // the total solar eclipse
    ['2025-09-07T18:09:00Z', 'full'], // the total lunar eclipse
  ];
  it.each(fixtures)('finds the %s %s moon within ±0.6 day', (iso, which) => {
    const at = utc(iso).getTime();
    const found = nextPhase(new Date(at - 5 * 86_400_000), which).getTime();
    expect(Math.abs(found - at) / 86_400_000).toBeLessThan(0.6);
    expect(Math.abs(previousPhase(new Date(at + 5 * 86_400_000), which).getTime() - at) / 86_400_000).toBeLessThan(0.6);
    const p = moonPhase(utc(iso));
    expect(p.phase).toBe(which);
    if (which === 'new') expect(p.fraction).toBeLessThan(0.02); else expect(p.fraction).toBeGreaterThan(0.98);
  });

  it('waxes through the quarters', () => {
    const first = moonPhase(utc('2024-01-18T03:53:00Z'));
    expect(first.phase).toBe('first-quarter');
    expect(first.fraction).toBeGreaterThan(0.4);
    expect(first.fraction).toBeLessThan(0.6);
    expect(moonPhase(utc('2024-01-14T12:00:00Z')).phase).toBe('waxing-crescent');
    expect(moonPhase(utc('2024-01-29T12:00:00Z')).phase).toBe('waning-gibbous');
    const month = moonPhase(utc('2024-03-01T00:00:00Z'));
    expect((month.nextNew.getTime() - month.lastNew.getTime()) / 86_400_000).toBeGreaterThan(29.2);
    expect((month.nextNew.getTime() - month.lastNew.getTime()) / 86_400_000).toBeLessThan(29.9);
  });
});

// ───────────────────────────────────────────────────────── time zones

describe('zones', () => {
  it('reads wall clocks through Intl', () => {
    const t = localClock('Asia/Tokyo', utc('2026-12-31T15:30:00Z'));
    expect([t.y, t.m, t.d, t.h, t.min]).toEqual([2027, 1, 1, 0, 30]);
    expect(t.weekday).toBe(5); // Friday
  });

  it('measures offsets, including half- and quarter-hour zones and DST', () => {
    expect(offsetMinutes('Pacific/Kiritimati', utc('2026-12-31T00:00:00Z'))).toBe(840);
    expect(offsetMinutes('America/New_York', utc('2026-01-15T12:00:00Z'))).toBe(-300);
    expect(offsetMinutes('America/New_York', utc('2026-07-15T12:00:00Z'))).toBe(-240);
    expect(offsetMinutes('Asia/Kolkata', utc('2026-07-15T12:00:00Z'))).toBe(330);
    expect(offsetMinutes('Asia/Kathmandu', utc('2026-07-15T12:00:00Z'))).toBe(345);
    expect(offsetMinutes('Australia/Eucla', utc('2026-07-15T12:00:00Z'))).toBe(525);
    expect(offsetMinutes('Pacific/Chatham', utc('2026-12-25T00:00:00Z'))).toBe(825);
    expect(offsetMinutes('Pacific/Pago_Pago', utc('2026-12-25T00:00:00Z'))).toBe(-660);
  });

  it('rejects unknown zones clearly', () => {
    expect(isSupportedZone('Mars/Olympus_Mons')).toBe(false);
    expect(isSupportedZone('Europe/London')).toBe(true);
    expect(() => localClock('Mars/Olympus_Mons', new Date(0))).toThrow(/Unknown time zone/);
  });

  it('finds the first instant of a day, even when DST skips midnight', () => {
    expect(zoneMidnight('Asia/Tokyo', { y: 2027, m: 1, d: 1 }).toISOString()).toBe('2026-12-31T15:00:00.000Z');
    expect(zoneMidnight('America/New_York', { y: 2027, m: 1, d: 1 }).toISOString()).toBe('2027-01-01T05:00:00.000Z');
    // Chile springs forward at midnight: 6 September 2026 starts at 01:00.
    const chile = zoneMidnight('America/Santiago', { y: 2026, m: 9, d: 6 });
    const wall = localClock('America/Santiago', chile);
    expect([wall.m, wall.d]).toEqual([9, 6]);
    const before = localClock('America/Santiago', new Date(chile.getTime() - 60_000));
    expect(before.d).toBe(5);
  });

  it('maps a device zone to a listed city', () => {
    expect(cityForZone('Asia/Tokyo').id).toBe('tokyo');
    expect(cityForZone('Asia/Kolkata').id).toBe('delhi');
    const detroit = cityForZone('America/Detroit', utc('2026-01-10T00:00:00Z'));
    expect(offsetMinutes(detroit.tz, utc('2026-01-10T00:00:00Z'))).toBe(-300);
  });
});

// ───────────────────────────────────────────────────────── data tables

describe('cities', () => {
  it('are sane: unique ids, real zones and countries, plausible coordinates', () => {
    const ids = new Set<string>();
    for (const c of CITIES) {
      expect(ids.has(c.id), c.id).toBe(false);
      ids.add(c.id);
      expect(isSupportedZone(c.tz), `${c.id} ${c.tz}`).toBe(true);
      expect(c.country in COUNTRY_NAMES || c.country in EXTRA_COUNTRY_NAMES, `${c.id} ${c.country}`).toBe(true);
      expect(Math.abs(c.lat), c.id).toBeLessThanOrEqual(72);
      expect(Math.abs(c.lon), c.id).toBeLessThanOrEqual(180);
      expect(Math.round(c.lat * 100) / 100).toBe(c.lat);
      expect(Math.round(c.lon * 100) / 100).toBe(c.lon);
      expect(c.pop).toBeGreaterThan(0);
      expect(c.emoji).toBe(flagEmoji(c.country));
    }
    expect(CITIES.length).toBeGreaterThanOrEqual(80);
    for (const id of SHOWCASE_CITY_IDS) expect(cityById(id), id).toBeDefined();
    expect(SHOWCASE_CITY_IDS).toHaveLength(12);
  });

  it('sit on (or right beside) their own country', () => {
    // Islands too small for the 1:110m outlines: the Chatham Islands, Efate (Port Vila) and O'ahu (Honolulu).
    const offOutline = new Set(['chatham', 'port-vila', 'honolulu']);
    const world = prepareShapes();
    for (const c of CITIES) {
      const shape = world.byIso.get(c.country);
      if (!shape) continue; // no outline at all (Singapore, Hong Kong, Kiritimati…)
      if (countryAt(c.lon, c.lat)?.iso === c.country) continue;
      if (offOutline.has(c.id)) {
        let nearest = Infinity;
        for (const r of shape.rings) {
          for (let i = 0; i < r.lonlat.length; i += 2) nearest = Math.min(nearest, distanceKm(c, { lon: r.lonlat[i]!, lat: r.lonlat[i + 1]! }));
        }
        expect(nearest, c.id).toBeLessThan(800);
        continue;
      }
      // Coastal and border cities may sit just off a simplified line, never far away.
      let nearest = Infinity;
      for (const r of shape.rings) nearest = Math.min(nearest, edgeKm(c, r.lonlat));
      expect(nearest, `${c.id} is ${Math.round(nearest)} km from ${c.country}`).toBeLessThan(40);
    }
  });

  it('cover every UTC offset from +14 to −11, including the odd half and quarter hours', () => {
    const at = utc('2026-12-31T12:00:00Z');
    const offsets = new Set(CITIES.map((c) => offsetMinutes(c.tz, at)));
    const want = [840, 825, 780, 720, 660, 630, 600, 570, 540, 525, 480, 420, 390, 360, 345, 330, 300, 270, 240, 210, 180,
      120, 60, 0, -60, -120, -180, -210, -240, -300, -360, -420, -480, -540, -570, -600, -660];
    for (const w of want) expect(offsets.has(w), `offset ${w / 60} h`).toBe(true);
    expect(Math.max(...offsets)).toBe(840);
    expect(Math.min(...offsets)).toBe(-660);
    // Both hemispheres and every inhabited continent.
    expect(CITIES.some((c) => c.lat < -30 && c.lon > 110)).toBe(true); // Australia
    expect(CITIES.some((c) => c.lat < -20 && c.lon < -40 && c.lon > -80)).toBe(true); // South America
    expect(CITIES.some((c) => c.lat < -20 && c.lon > 10 && c.lon < 40)).toBe(true); // southern Africa
  });
});

describe('celebrated', () => {
  it('has an entry for every holiday in the catalog, and nothing else', () => {
    expect(HOLIDAY_IDS).toHaveLength(76);
    for (const id of HOLIDAY_IDS) expect(CELEBRATED[id], id).toBeDefined();
    expect(Object.keys(CELEBRATED).sort()).toEqual([...HOLIDAY_IDS].sort());
  });

  it('uses only country codes that have an outline, with a kid-level note', () => {
    for (const [id, c] of Object.entries(CELEBRATED)) {
      expect(c.countries.length, id).toBeGreaterThan(0);
      for (const code of c.countries) expect(code in COUNTRY_NAMES, `${id}: ${code}`).toBe(true);
      expect(new Set(c.countries).size).toBe(c.countries.length);
      expect(c.note.length).toBeGreaterThan(20);
      expect(c.note).not.toMatch(/http|www\.|\.com/);
      if (c.focus) {
        expect(Math.abs(c.focus[0])).toBeLessThanOrEqual(180);
        expect(Math.abs(c.focus[1])).toBeLessThanOrEqual(90);
      }
    }
  });

  it('lights up the right places', () => {
    for (const code of ['IN', 'NP', 'LK', 'MY', 'FJ', 'TT', 'GY', 'SR', 'MM']) expect(CELEBRATED['diwali']!.countries).toContain(code);
    for (const code of ['CN', 'TW', 'VN', 'KR']) expect(CELEBRATED['lunar-new-year']!.countries).toContain(code);
    for (const code of ['IR', 'AF', 'AZ', 'KZ', 'TJ']) expect(CELEBRATED['nowruz']!.countries).toContain(code);
    for (const code of ['TH', 'LA', 'KH', 'MM']) expect(CELEBRATED['songkran']!.countries).toContain(code);
    expect(CELEBRATED['juneteenth']!.countries).toEqual(['US']);
    expect(CELEBRATED['thanksgiving']!.countries).toEqual(expect.arrayContaining(['US', 'CA']));
    expect(CELEBRATED['eid-al-fitr']!.countries.length).toBeGreaterThan(50);
    expect(CELEBRATED['hanukkah']!.countries[0]).toBe('IL');
    expect(holidaysCelebratedIn('IN')).toEqual(expect.arrayContaining(['diwali', 'holi', 'independence-day-india']));
    expect(holidaysCelebratedIn('MX')).toContain('day-of-the-dead');
  });
});

// ───────────────────────────────────────────────────────── the New Year wave

describe('midnight wave', () => {
  const target = { y: 2027, m: 1, d: 1 };

  it('reaches Kiritimati first and Pago Pago last', () => {
    const order = arrivalOrder(CITIES, utc('2026-12-31T00:00:00Z'), target);
    expect(order[0]!.city.id).toBe('kiritimati');
    expect(order[order.length - 1]!.city.id).toBe('pago-pago');
    expect(order[0]!.at.toISOString()).toBe('2026-12-31T10:00:00.000Z');
    expect(order[order.length - 1]!.at.toISOString()).toBe('2027-01-01T11:00:00.000Z');
    for (let i = 1; i < order.length; i++) expect(order[i]!.at.getTime()).toBeGreaterThanOrEqual(order[i - 1]!.at.getTime());
    expect(arrivedCount(order)).toBe(0);
    expect(order.find((a) => a.city.id === 'london')!.at.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('counts who is already in the new year', () => {
    const order = arrivalOrder(CITIES, utc('2026-12-31T12:00:00Z'), target);
    const arrived = new Set(order.filter((a) => a.arrived).map((a) => a.city.id));
    for (const id of ['kiritimati', 'chatham', 'apia', 'nukualofa', 'auckland', 'suva']) expect(arrived.has(id), id).toBe(true);
    expect(arrived.has('sydney')).toBe(false);
    expect(arrivedCount(order)).toBe(arrived.size);
    const next = nextArrivals(order, 5);
    expect(next).toHaveLength(5);
    expect(next.every((a) => !a.arrived)).toBe(true);
  });

  it('moves the midnight meridian west, one degree every four minutes', () => {
    const start = utcDayStart(target);
    expect(midnightMeridian(new Date(start), start)).toBeCloseTo(0, 9);
    expect(midnightMeridian(utc('2026-12-31T12:00:00Z'), start)).toBe(180);
    expect(midnightMeridian(utc('2026-12-31T18:00:00Z'), start)).toBeCloseTo(90, 9);
    expect(midnightMeridian(utc('2027-01-01T06:00:00Z'), start)).toBeCloseTo(-90, 9);
    expect(midnightMeridian(utc('2027-01-01T13:00:00Z'), start)).toBe(-180);
  });

  it('tells you when it is your turn', () => {
    const tokyo = yourTurn('Asia/Tokyo', utc('2026-12-31T14:00:00Z'), target);
    expect(tokyo.msUntil).toBe(3_600_000);
    expect(tokyo.city.id).toBe('tokyo');
    expect(yourTurn('Asia/Tokyo', utc('2026-12-31T16:00:00Z'), target).arrived).toBe(true);
    expect(yourTurn('Not/AZone', utc('2026-12-31T23:00:00Z'), target).zone).toBe('UTC');
    expect(newYearTarget({ y: 2026, m: 12, d: 28 })).toEqual(target);
    expect(newYearTarget({ y: 2027, m: 1, d: 1 })).toEqual(target);
    expect(new Date(newYearShowStart(target)).toISOString()).toBe('2026-12-31T10:00:00.000Z');
  });

  it('builds the card', () => {
    const card = midnightCard(utc('2026-12-31T12:00:00Z'), CITIES, 'America/New_York', target);
    expect(card.arrived).toBeGreaterThan(0);
    expect(card.status).toContain('2027');
    expect(card.next).toHaveLength(5);
    expect(card.yours.msUntil).toBe(17 * 3_600_000);
    expect(card.meridian).toBe(180);
  });
});

// ───────────────────────────────────────────────────────── Santa

describe('Santa', () => {
  const NY = 'America/New_York';
  const near = (p: LonLat, id: string, km: number): boolean => distanceKm(p, city(id)) < km;

  it('is in the workshop before Christmas Eve', () => {
    const s = santaStatus(utc('2026-12-20T12:00:00Z'), CITIES, NY);
    expect(s.phase).toBe('workshop');
    expect(s.lonlat.lat).toBe(90);
    expect(s.presents).toBe(0);
    expect(trailStops(s)).toEqual([]);
  });

  it('starts over the Pacific by Kiritimati and New Zealand', () => {
    const s = santaStatus(utc('2026-12-24T10:30:00Z'), CITIES, NY);
    expect(s.phase).toBe('flying');
    expect(near(s.lonlat, 'auckland', 1500) || near(s.lonlat, 'kiritimati', 1500)).toBe(true);
    expect(s.visited.map((c) => c.id)).toContain('kiritimati');
  });

  it('is over Japan and Korea at 15:00 UTC on Christmas Eve', () => {
    const s = santaStatus(utc('2026-12-24T15:00:00Z'), CITIES, NY);
    expect(near(s.lonlat, 'tokyo', 800) || near(s.lonlat, 'seoul', 800)).toBe(true);
    expect(['JP', 'KR', 'KP']).toContain(countryAt(s.lonlat.lon, s.lonlat.lat)?.iso);
  });

  it('is over New York at its midnight (05:00 UTC on the 25th)', () => {
    const s = santaStatus(utc('2026-12-25T05:00:00Z'), CITIES, NY);
    expect(near(s.lonlat, 'new-york', 50)).toBe(true);
    expect(s.msUntilYourHouse).toBe(0);
    const before = santaStatus(utc('2026-12-24T23:00:00Z'), CITIES, NY);
    expect(before.msUntilYourHouse).toBe(6 * 3_600_000);
  });

  it('is home by 13:00 UTC on Christmas Day', () => {
    const s = santaStatus(utc('2026-12-25T13:00:00Z'), CITIES, NY);
    expect(s.phase).toBe('done');
    expect(s.visited).toHaveLength(CITIES.length);
    const all = CITIES.reduce((sum, c) => sum + c.pop * 1e6 * 2.6, 0);
    expect(Math.abs(s.presents - all)).toBeLessThan(2);
  });

  it('visits every city once, in midnight order, within the hour after its midnight', () => {
    const route = santaRoute(2026, CITIES, homeCityId(NY, 2026));
    const cityStops = route.stops.filter((s) => s.city);
    expect(cityStops).toHaveLength(CITIES.length);
    expect(new Set(cityStops.map((s) => s.id)).size).toBe(CITIES.length);
    expect(route.stops[0]!.city).toBeNull();
    expect(route.stops[route.stops.length - 1]!.city).toBeNull();
    for (let i = 1; i < route.stops.length; i++) expect(route.stops[i]!.at).toBeGreaterThanOrEqual(route.stops[i - 1]!.at);
    const day = { y: 2026, m: 12, d: 25 };
    for (const s of cityStops) {
      const midnight = zoneMidnight(s.city!.tz, day).getTime();
      expect(s.at, s.id).toBeGreaterThanOrEqual(midnight);
      expect(s.at, s.id).toBeLessThan(midnight + 3_600_000);
    }
    expect(new Date(route.departs).toISOString()).toBe('2026-12-24T09:30:00.000Z');
    expect(new Date(route.returns).toISOString()).toBe('2026-12-25T12:00:00.000Z');
  });

  it('visits the viewer’s own city exactly at their midnight', () => {
    for (const [zone, id] of [['Europe/Paris', 'paris'], ['Asia/Tokyo', 'tokyo'], ['Australia/Sydney', 'sydney'], [NY, 'new-york']] as const) {
      const home = homeCityId(zone, 2026);
      expect(home).toBe(id);
      const stop = santaRoute(2026, CITIES, home).stops.find((s) => s.id === id)!;
      expect(stop.at).toBe(zoneMidnight(zone, { y: 2026, m: 12, d: 25 }).getTime());
    }
  });

  it('is deterministic, and the presents only ever go up', () => {
    const a = santaStatus(utc('2026-12-24T20:17:00Z'), CITIES, NY);
    const b = santaStatus(utc('2026-12-24T20:17:00Z'), CITIES, NY);
    expect(a.lonlat).toEqual(b.lonlat);
    expect(a.presents).toBe(b.presents);
    let last = -1;
    const route = santaRoute(2026, CITIES, homeCityId(NY, 2026));
    for (let t = route.departs; t <= route.returns; t += 7 * 60_000) {
      const s = santaStatus(new Date(t), CITIES, NY);
      expect(s.presents).toBeGreaterThanOrEqual(last);
      last = s.presents;
      const p = santaPosition(route, t);
      expect(distanceKm(p, s.lonlat)).toBeLessThan(1);
    }
  });

  it('builds the card for each part of the season', () => {
    const today = { y: 2026, m: 12, d: 10 };
    const early = santaCard(utc('2026-12-10T12:00:00Z'), CITIES, NY, today);
    expect(early.season).toBe(true);
    expect(early.headline).toMatch(/14 sleeps/);
    const flying = santaCard(utc('2026-12-24T15:00:00Z'), CITIES, NY, { y: 2026, m: 12, d: 24 }, 'Maya');
    expect(flying.headline).toMatch(/Now over (Japan|South Korea|North Korea)/);
    expect(flying.presents).toMatch(/presents delivered/);
    expect(flying.lines.join(' ')).toMatch(/Maya/);
    const off = santaCard(utc('2026-10-22T12:00:00Z'), CITIES, NY, { y: 2026, m: 10, d: 22 });
    expect(off.season).toBe(false);
    expect(off.status.phase).toBe('workshop');
  });
});

// ───────────────────────────────────────────────────────── the other cards

describe('tracker cards', () => {
  it('counts the cities in daylight', () => {
    const c = sunCard(utc('2026-06-21T12:00:00Z'));
    expect(c.total).toBe(CITIES.length);
    expect(c.daylight).toBeGreaterThan(CITIES.length / 3);
    expect(c.daylight).toBeLessThan(CITIES.length);
    expect(c.status).toContain(String(c.daylight));
  });

  it('describes the moon tonight and ties it to a lunar holiday', () => {
    const c = moonCard(utc('2025-09-07T18:09:00Z'), { id: 'mid-autumn-festival', name: 'Mid-Autumn Festival', emoji: '🥮', sleeps: 3, kind: 'full' });
    expect(c.pct).toBeGreaterThan(97);
    expect(c.detail).toMatch(/full moon/i);
    expect(c.hint).toMatch(/Mid-Autumn Festival is in 3 sleeps/);
  });

  it('notices that it is already a holiday somewhere else', () => {
    const holidaysOn = (d: { y: number; m: number; d: number }) => (d.m === 1 && d.d === 1 ? [{ id: 'new-years-day', name: "New Year's Day", emoji: '🎊' }] : []);
    const card = celebratingNowCard(utc('2026-12-31T14:00:00Z'), CITIES, holidaysOn, { today: { y: 2026, m: 12, d: 31 }, locale: 'en-US' });
    expect(card.rows).toHaveLength(12);
    expect(card.headline).toMatch(/It’s already New Year's Day 🎊 in (Auckland|Sydney|Tokyo)!/);
    const sydney = card.rows.find((r) => r.city.id === 'sydney')!;
    expect(sydney.shift).toBe(1);
    expect(sydney.holidays.map((h) => h.id)).toEqual(['new-years-day']);
    expect(card.rows.find((r) => r.city.id === 'honolulu')!.shift).toBe(0);
  });

  it('runs the pretend shows on a fast clock', () => {
    expect(showTime(1000, 0)).toBe(1000);
    expect(showTime(0, 3000)).toBe(60_000); // 20× for the first minute of show time
    expect(showTime(0, 4000)).toBe(60_000 + 1000 * 600);
  });

  it('speaks kid-sized durations', () => {
    expect(durationWords(3 * 86_400_000)).toBe('3 days');
    expect(durationWords(86_400_000 + 4 * 3_600_000)).toBe('1 day 4 h');
    expect(durationWords(5 * 3_600_000 + 12 * 60_000)).toBe('5 h 12 min');
    expect(durationWords(12 * 60_000 + 5000)).toBe('12 min');
    expect(durationWords(-5)).toBe('0 s');
    expect(durationClock(26 * 3_600_000 + 4 * 60_000 + 9000)).toBe('26:04:09');
  });
});

// ───────────────────────────────────────────────────────── palette and camera

describe('globe palette', () => {
  it('gives every theme a complete palette with a highlight that is never white', () => {
    for (const theme of Object.values(THEMES)) {
      const p = globePalette(theme);
      for (const key of Object.keys(DEFAULT_COLORS) as (keyof typeof DEFAULT_COLORS)[]) expect(p[key], `${theme.id}.${key}`).toBeTruthy();
      expect(p.highlight.toLowerCase()).not.toBe('#ffffff');
      expect([theme.accent, theme.accent2, theme.glow, '#ffd166']).toContain(p.highlight);
    }
    expect(highlightFor(THEMES.diwali)).toBe('#ffb703');
    expect(highlightFor(THEMES.halloween)).toBe('#ff8c1a');
    expect(highlightFor(THEMES.canada)).not.toBe('#ffffff');
  });
});

describe('globe camera', () => {
  /** Drags west 2° every 16 ms (125 °/s) for `frames` frames from t = 0. */
  function dragWest(cam: GlobeCamera, frames: number): number {
    cam.beginDrag(0);
    let t = 0;
    for (let i = 0; i < frames; i++) cam.dragBy(-2, 0, (t += 16));
    return t;
  }

  function settle(cam: GlobeCamera, from: number): void {
    let ts = from;
    for (let i = 0; i < 2000 && cam.step((ts += 16), 0.016); i++) { /* run the glide out */ }
  }

  it('flings with the speed of the end of the drag and glides to a stop', () => {
    const cam = new GlobeCamera();
    cam.setCenter(0, 0);
    const end = dragWest(cam, 10);
    expect(cam.lon).toBeCloseTo(-20, 9);
    cam.release(end + 10, true);
    expect(cam.gliding).toBe(true);
    settle(cam, end + 10);
    expect(cam.gliding).toBe(false);
    // An exponential glide covers about v × τ = 125 °/s × 0.6 s = 75°.
    expect(cam.lon).toBeGreaterThan(-20 - 80);
    expect(cam.lon).toBeLessThan(-20 - 70);
  });

  it('does not fling when the finger came to rest before letting go', () => {
    const cam = new GlobeCamera();
    const end = dragWest(cam, 10);
    cam.release(end + 200, true);
    expect(cam.gliding).toBe(false);
  });

  it('clamps the tilt and the zoom, and eases zoom steps', () => {
    const cam = new GlobeCamera();
    cam.setCenter(10, 89);
    expect(cam.center().lat).toBe(MAX_LAT);
    cam.setZoom(100);
    expect(cam.zoom()).toBe(MAX_ZOOM);
    cam.setZoom(1);
    cam.zoomBy(2);
    expect(cam.zoom()).toBe(2);
    expect(cam.zoomGlobe).toBe(1);
    settle(cam, 0);
    expect(cam.zoomGlobe).toBe(2);
    cam.zoomBy(1e-6);
    settle(cam, 0);
    expect(cam.zoomGlobe).toBe(MIN_ZOOM);
  });

  it('eases spins, and snaps them under reduced motion', () => {
    const cam = new GlobeCamera();
    cam.setCenter(0, 0);
    cam.spinTo(90, 20, 1000);
    cam.step(0, 0.016);
    cam.step(500, 0.016);
    expect(cam.lon).toBeGreaterThan(10);
    expect(cam.lon).toBeLessThan(80);
    cam.step(1000, 0.016);
    expect(cam.lon).toBeCloseTo(90, 9);
    expect(cam.center().lat).toBeCloseTo(20, 9);
    cam.motion = 'reduced';
    cam.spinTo(-45, 10, 1000);
    expect(cam.lon).toBe(-45);
    cam.zoomBy(3);
    expect(cam.zoomGlobe).toBe(3);
  });
});
