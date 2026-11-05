/**
 * Where the sun is: the subsolar point for any instant (Meeus-lite — mean longitude,
 * equation of centre, obliquity and sidereal time, good to about a quarter of a degree),
 * the terminator ring and simple day/night tests. Good enough to shade the night side
 * of a kids' globe and to say which cities are having breakfast.
 */
import { DEG, RAD, normLon, smallCircleRing, type LonLat, type MVec3 } from './geo';

const J2000_MS = Date.UTC(2000, 0, 1, 12);
const DAY_MS = 86_400_000;

export interface SubsolarPoint extends LonLat {
  /** Solar declination, degrees. */
  readonly declination: number;
  /** Equation of time, minutes (apparent − mean solar time). */
  readonly eot: number;
}

function norm360(d: number): number {
  const x = d % 360;
  return x < 0 ? x + 360 : x;
}

/** The point on Earth where the sun is straight overhead at `date`. */
export function subsolarPoint(date: Date): SubsolarPoint {
  const n = (date.getTime() - J2000_MS) / DAY_MS;
  const L = norm360(280.460 + 0.9856474 * n);
  const g = (357.528 + 0.9856003 * n) * DEG;
  const λ = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG;
  const ε = (23.439 - 0.0000004 * n) * DEG;
  const sinλ = Math.sin(λ);
  const declination = Math.asin(Math.sin(ε) * sinλ) * RAD;
  const α = norm360(Math.atan2(Math.cos(ε) * sinλ, Math.cos(λ)) * RAD);
  const gmst = norm360(280.46061837 + 360.98564736629 * n);
  const eot = 4 * normLon(L - α);
  return { lon: normLon(α - gmst), lat: declination, declination, eot };
}

/** Unit vector of the subsolar point. */
export function sunVector(date: Date, out: MVec3 = [0, 0, 0]): MVec3 {
  const s = subsolarPoint(date);
  const φ = s.lat * DEG;
  const λ = s.lon * DEG;
  out[0] = Math.cos(φ) * Math.cos(λ);
  out[1] = Math.cos(φ) * Math.sin(λ);
  out[2] = Math.sin(φ);
  return out;
}

/** Sun altitude above the horizon at a place, degrees (no refraction). */
export function sunAltitude(lon: number, lat: number, date: Date): number {
  const s = subsolarPoint(date);
  const φ = lat * DEG;
  const δ = s.lat * DEG;
  const h = (lon - s.lon) * DEG;
  return Math.asin(Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(h)) * RAD;
}

/** Sun hour angle at a place in (−180, 180]: negative before local solar noon. */
export function hourAngle(lon: number, date: Date): number {
  return normLon(lon - subsolarPoint(date).lon);
}

/** Daylight, counting the sun as up until its top edge dips (−0.833° like almanacs). */
export function isDay(lon: number, lat: number, date: Date): boolean {
  return sunAltitude(lon, lat, date) > -0.833;
}

/**
 * The terminator as a closed CCW ring of `n` unit vectors: the great circle 90° from
 * the subsolar point, wound so the night hemisphere is its interior.
 */
export function terminatorRing(date: Date, n = 120): Float32Array {
  const s = sunVector(date);
  return smallCircleRing([-s[0], -s[1], -s[2]], 90, n);
}

/**
 * Rings for soft twilight: the night cap shrunk by `depthsDeg` (e.g. 90, 87, 84 → the
 * sun 0°, 3° and 6° below the horizon), each wound with the dark side inside.
 */
export function nightRings(date: Date, depthsDeg: readonly number[] = [90, 87, 84], n = 120): Float32Array[] {
  const s = sunVector(date);
  const anti: MVec3 = [-s[0], -s[1], -s[2]];
  return depthsDeg.map((r) => smallCircleRing(anti, r, n));
}

/**
 * For the flat map: the latitude band in night at longitude `lon`, where "night" means the
 * sun more than `depthDeg` below the horizon. Returns [south, north] limits in degrees,
 * or null when that meridian is fully lit. The band is one interval because the sun's
 * altitude along a meridian is a single cosine wave.
 */
export function nightBandAt(lon: number, sub: SubsolarPoint, depthDeg = 0): [number, number] | null {
  const δ = sub.lat * DEG;
  const A = Math.sin(δ);
  const B = Math.cos(δ) * Math.cos((lon - sub.lon) * DEG);
  const R = Math.hypot(A, B);
  const target = -Math.sin(depthDeg * DEG);
  if (R < 1e-9) return target >= 0 ? null : [-90, 90];
  // altitude(φ) = asin(R·cos(φ − α)); night where R·cos(φ − α) < target.
  const α = Math.atan2(A, B) * RAD;
  const ratio = target / R;
  if (ratio >= 1) return [-90, 90];
  if (ratio <= -1) return null;
  const β = Math.acos(ratio) * RAD;
  // cos(φ − α) < ratio  ⇔  φ ∈ (α + β, α + 360 − β) modulo 360; find the copy that meets [−90, 90].
  let lo = α + β;
  let hi = α + 360 - β;
  while (lo > 90) { lo -= 360; hi -= 360; }
  while (hi < -90) { lo += 360; hi += 360; }
  const s = Math.max(-90, lo);
  const nth = Math.min(90, hi);
  return nth > s ? [s, nth] : null;
}
