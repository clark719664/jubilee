/**
 * Spherical geometry helpers for the World view: degrees↔radians, unit vectors,
 * great-circle distance/bearing/interpolation. Everything is pure and small so the
 * globe renderer, the sun/moon math and Santa's flight path share one vocabulary.
 *
 * Conventions: longitude east-positive in (−180, 180], latitude north-positive.
 * Unit vectors are [x, y, z] with x toward (lon 0, lat 0), y toward lon 90°E and
 * z toward the north pole, so `cross(east, north) === up` is right-handed.
 */
export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;
export const EARTH_RADIUS_KM = 6371;

export interface LonLat { readonly lon: number; readonly lat: number }
export type Vec3 = readonly [number, number, number];
export type MVec3 = [number, number, number];

export function deg2rad(d: number): number { return d * DEG; }
export function rad2deg(r: number): number { return r * RAD; }

/** Wraps a longitude into (−180, 180]. */
export function normLon(lon: number): number {
  let l = lon % 360;
  if (l > 180) l -= 360;
  else if (l <= -180) l += 360;
  return l;
}

export function clampLat(lat: number): number {
  return lat > 90 ? 90 : lat < -90 ? -90 : lat;
}

export function lonlatToVec3(lon: number, lat: number, out: MVec3 = [0, 0, 0]): MVec3 {
  const φ = lat * DEG;
  const λ = lon * DEG;
  const c = Math.cos(φ);
  out[0] = c * Math.cos(λ);
  out[1] = c * Math.sin(λ);
  out[2] = Math.sin(φ);
  return out;
}

export function vec3ToLonlat(v: Vec3): LonLat {
  const lat = Math.atan2(v[2], Math.hypot(v[0], v[1])) * RAD;
  const lon = Math.atan2(v[1], v[0]) * RAD;
  return { lon: normLon(lon), lat };
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3, out: MVec3 = [0, 0, 0]): MVec3 {
  const x = a[1] * b[2] - a[2] * b[1];
  const y = a[2] * b[0] - a[0] * b[2];
  const z = a[0] * b[1] - a[1] * b[0];
  out[0] = x; out[1] = y; out[2] = z;
  return out;
}

export function normalize(v: Vec3, out: MVec3 = [0, 0, 0]): MVec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  out[0] = v[0] / len; out[1] = v[1] / len; out[2] = v[2] / len;
  return out;
}

/** Central angle between two points, in radians (haversine; stable for tiny distances). */
export function angularDistance(a: LonLat, b: LonLat): number {
  const φ1 = a.lat * DEG;
  const φ2 = b.lat * DEG;
  const dφ = (b.lat - a.lat) * DEG;
  const dλ = (b.lon - a.lon) * DEG;
  const s = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(s), Math.sqrt(Math.max(0, 1 - s)));
}

export function distanceKm(a: LonLat, b: LonLat): number {
  return angularDistance(a, b) * EARTH_RADIUS_KM;
}

/** Initial compass bearing from a to b, degrees clockwise from north in [0, 360). */
export function bearing(a: LonLat, b: LonLat): number {
  const φ1 = a.lat * DEG;
  const φ2 = b.lat * DEG;
  const dλ = (b.lon - a.lon) * DEG;
  const y = Math.sin(dλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
  const θ = Math.atan2(y, x) * RAD;
  return (θ + 360) % 360;
}

/**
 * Point a fraction `t` along the great circle from a to b (t = 0 → a, t = 1 → b).
 * Antipodal inputs have no unique great circle; we nudge through the north pole so
 * Santa still gets somewhere rather than dividing by zero.
 */
export function slerp(a: LonLat, b: LonLat, t: number): LonLat {
  if (t <= 0) return { lon: a.lon, lat: a.lat };
  if (t >= 1) return { lon: b.lon, lat: b.lat };
  const va = lonlatToVec3(a.lon, a.lat);
  const vb = lonlatToVec3(b.lon, b.lat);
  const cosω = Math.min(1, Math.max(-1, dot(va, vb)));
  const ω = Math.acos(cosω);
  if (ω < 1e-9) return { lon: a.lon, lat: a.lat };
  if (Math.PI - ω < 1e-6) {
    // Antipodal: go via the pole in two legs.
    const pole: LonLat = { lon: 0, lat: 90 };
    return t < 0.5 ? slerp(a, pole, t * 2) : slerp(pole, b, (t - 0.5) * 2);
  }
  const sinω = Math.sin(ω);
  const ka = Math.sin((1 - t) * ω) / sinω;
  const kb = Math.sin(t * ω) / sinω;
  return vec3ToLonlat([
    ka * va[0] + kb * vb[0],
    ka * va[1] + kb * vb[1],
    ka * va[2] + kb * vb[2],
  ]);
}

/** Spherical centroid (normalized mean vector); `weights` default to 1. */
export function centroid(points: readonly LonLat[], weights?: readonly number[]): LonLat {
  const sum: MVec3 = [0, 0, 0];
  const tmp: MVec3 = [0, 0, 0];
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    const w = weights?.[i] ?? 1;
    lonlatToVec3(p.lon, p.lat, tmp);
    sum[0] += tmp[0] * w; sum[1] += tmp[1] * w; sum[2] += tmp[2] * w;
  }
  if (Math.hypot(sum[0], sum[1], sum[2]) < 1e-9) return { lon: 0, lat: 0 };
  return vec3ToLonlat(normalize(sum));
}

/** Shortest signed longitude difference b − a in (−180, 180]. */
export function lonDelta(a: number, b: number): number {
  return normLon(b - a);
}

/**
 * Closed ring of `n` unit vectors on the small circle `radiusDeg` from `center`, going
 * counterclockwise about the center as seen from outside, so the cap is the ring's interior
 * (the convention the hemisphere clipper expects). 90° gives a great circle.
 */
export function smallCircleRing(center: Vec3, radiusDeg: number, n = 120): Float32Array {
  const a = normalize(center);
  // Any vector not parallel to the axis seeds a perpendicular basis.
  const seed: Vec3 = Math.abs(a[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const u = normalize(cross(seed, a));
  const v = cross(a, u);
  const r = radiusDeg * DEG;
  const cr = Math.cos(r);
  const sr = Math.sin(r);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const ct = Math.cos(t) * sr;
    const st = Math.sin(t) * sr;
    out[3 * i] = cr * a[0] + ct * u[0] + st * v[0];
    out[3 * i + 1] = cr * a[1] + ct * u[1] + st * v[1];
    out[3 * i + 2] = cr * a[2] + ct * u[2] + st * v[2];
  }
  return out;
}

/** Unit-vector triples for a list of lon/lat points (a ring or a polyline). */
export function ringFromLonLat(points: readonly LonLat[]): Float32Array {
  const out = new Float32Array(points.length * 3);
  const tmp: MVec3 = [0, 0, 0];
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    lonlatToVec3(p.lon, p.lat, tmp);
    out[3 * i] = tmp[0]; out[3 * i + 1] = tmp[1]; out[3 * i + 2] = tmp[2];
  }
  return out;
}

/**
 * Great-circle polyline through `stops`, with at most `stepDeg` between samples, so a
 * trail drawn as straight projected segments still follows the sphere.
 */
export function densify(stops: readonly LonLat[], stepDeg = 4): LonLat[] {
  const out: LonLat[] = [];
  for (let i = 0; i < stops.length; i++) {
    const a = stops[i]!;
    if (i === 0) { out.push(a); continue; }
    const prev = stops[i - 1]!;
    const steps = Math.max(1, Math.ceil(angularDistance(prev, a) * RAD / stepDeg));
    for (let s = 1; s <= steps; s++) out.push(slerp(prev, a, s / steps));
  }
  return out;
}
