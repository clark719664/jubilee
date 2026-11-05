/**
 * Country and lake outlines prepared once for drawing and hit testing.
 *
 * The source rings (Natural Earth, see data/countries.ts) are clockwise in lon/lat, i.e.
 * clockwise seen from outside the globe. The hemisphere clipper wants them anticlockwise
 * (interior on the left), so each ring's orientation is measured in 3D — the vector area
 * Σ vᵢ × vᵢ₊₁ against the ring's mean direction — and flipped when needed. That test is
 * also right for Antarctica, whose ring runs round the South Pole. Points on the poles are
 * dropped from the 3D copy: in lon/lat they make the flat map's bottom edge, but on the
 * sphere they collapse into a zero-width spike that would draw a line to the pole.
 *
 * Every ring also gets a bounding cap (centre + angular radius) so the globe can skip
 * rings on the far side, and a lon/lat bbox for the flat map and for point-in-polygon.
 * `prepareShapes()` runs once and is memoised; nothing here allocates per frame.
 */
import { COUNTRIES, LAKES, countryName } from './data/countries';
import { DEG, RAD, normLon, type LonLat } from './geo';

export interface PreparedRing {
  /** Unit vectors, x y z per point, anticlockwise seen from outside, pole points dropped. */
  readonly vec: Float32Array;
  /** Degrees, lon lat per point, in source order (closed: last point repeats the first). */
  readonly lonlat: Float32Array;
  /** [minLon, minLat, maxLon, maxLat] in degrees. */
  readonly bbox: Float32Array;
  /** Bounding cap: centre unit vector, then cos and sin of its angular radius. */
  readonly cap: Float32Array;
  /** Rough area in steradians (|vector area|), for picking a country's main ring. */
  readonly area: number;
}

export interface PreparedCountry {
  readonly iso: string;
  readonly name: string;
  readonly rings: readonly PreparedRing[];
  /** Area-weighted centre of the largest ring: where "spin to India" points the globe. */
  readonly center: LonLat;
  /** Union of the rings' boxes. */
  readonly bbox: Float32Array;
}

export interface PreparedWorld {
  readonly countries: readonly PreparedCountry[];
  readonly lakes: readonly PreparedRing[];
  readonly byIso: ReadonlyMap<string, PreparedCountry>;
}

const POLE_LAT = 89.99;

function prepareRing(tenths: readonly number[]): PreparedRing {
  const n = tenths.length / 2;
  const lonlat = new Float32Array(n * 2);
  const bbox = new Float32Array([Infinity, Infinity, -Infinity, -Infinity]);
  for (let i = 0; i < n; i++) {
    const lon = tenths[2 * i]! / 10;
    const lat = tenths[2 * i + 1]! / 10;
    lonlat[2 * i] = lon;
    lonlat[2 * i + 1] = lat;
    if (lon < bbox[0]!) bbox[0] = lon;
    if (lat < bbox[1]!) bbox[1] = lat;
    if (lon > bbox[2]!) bbox[2] = lon;
    if (lat > bbox[3]!) bbox[3] = lat;
  }

  // 3D copy: no pole points, no repeated neighbours, no closing duplicate.
  const xyz: number[] = [];
  for (let i = 0; i < n; i++) {
    const lat = lonlat[2 * i + 1]!;
    if (Math.abs(lat) >= POLE_LAT) continue;
    const φ = lat * DEG;
    const λ = lonlat[2 * i]! * DEG;
    const x = Math.cos(φ) * Math.cos(λ);
    const y = Math.cos(φ) * Math.sin(λ);
    const z = Math.sin(φ);
    const k = xyz.length;
    if (k >= 3 && Math.abs(xyz[k - 3]! - x) + Math.abs(xyz[k - 2]! - y) + Math.abs(xyz[k - 1]! - z) < 1e-7) continue;
    xyz.push(x, y, z);
  }
  if (xyz.length >= 6 && Math.abs(xyz[0]! - xyz[xyz.length - 3]!) + Math.abs(xyz[1]! - xyz[xyz.length - 2]!) + Math.abs(xyz[2]! - xyz[xyz.length - 1]!) < 1e-7) {
    xyz.length -= 3;
  }
  const m = xyz.length / 3;

  // Vector area and mean direction decide the winding.
  let sx = 0, sy = 0, sz = 0, mx = 0, my = 0, mz = 0;
  for (let i = 0; i < m; i++) {
    const j = (i + 1) % m;
    const ax = xyz[3 * i]!, ay = xyz[3 * i + 1]!, az = xyz[3 * i + 2]!;
    const bx = xyz[3 * j]!, by = xyz[3 * j + 1]!, bz = xyz[3 * j + 2]!;
    sx += ay * bz - az * by;
    sy += az * bx - ax * bz;
    sz += ax * by - ay * bx;
    mx += ax; my += ay; mz += az;
  }
  const reverse = sx * mx + sy * my + sz * mz < 0;
  const vec = new Float32Array(m * 3);
  for (let i = 0; i < m; i++) {
    const src = reverse ? m - 1 - i : i;
    vec[3 * i] = xyz[3 * src]!;
    vec[3 * i + 1] = xyz[3 * src + 1]!;
    vec[3 * i + 2] = xyz[3 * src + 2]!;
  }

  const ml = Math.hypot(mx, my, mz) || 1;
  const cx = mx / ml, cy = my / ml, cz = mz / ml;
  let cosR = 1;
  for (let i = 0; i < m; i++) {
    const d = vec[3 * i]! * cx + vec[3 * i + 1]! * cy + vec[3 * i + 2]! * cz;
    if (d < cosR) cosR = d;
  }
  // A hair of slack so rounding never culls a ring that grazes the limb.
  cosR = Math.max(-1, cosR - 1e-4);
  const cap = new Float32Array([cx, cy, cz, cosR, Math.sqrt(Math.max(0, 1 - cosR * cosR))]);
  return { vec, lonlat, bbox, cap, area: Math.hypot(sx, sy, sz) / 2 };
}

/** Area-weighted centre of a ring (triangle fan from its first vertex), as lon/lat. */
function ringCenter(ring: PreparedRing): LonLat {
  const v = ring.vec;
  const m = v.length / 3;
  if (m === 0) return { lon: 0, lat: 0 };
  const ox = v[0]!, oy = v[1]!, oz = v[2]!;
  let wx = 0, wy = 0, wz = 0, total = 0;
  const nx = ring.cap[0]!, ny = ring.cap[1]!, nz = ring.cap[2]!;
  for (let i = 1; i + 1 < m; i++) {
    const ax = v[3 * i]! - ox, ay = v[3 * i + 1]! - oy, az = v[3 * i + 2]! - oz;
    const bx = v[3 * i + 3]! - ox, by = v[3 * i + 4]! - oy, bz = v[3 * i + 5]! - oz;
    // Signed area of the fan triangle, measured along the ring's outward normal.
    const a = ((ay * bz - az * by) * nx + (az * bx - ax * bz) * ny + (ax * by - ay * bx) * nz) / 2;
    wx += a * (3 * ox + ax + bx) / 3;
    wy += a * (3 * oy + ay + by) / 3;
    wz += a * (3 * oz + az + bz) / 3;
    total += a;
  }
  const len = Math.hypot(wx, wy, wz);
  if (Math.abs(total) < 1e-12 || len < 1e-12) {
    return { lon: normLon(Math.atan2(ny, nx) * RAD), lat: Math.atan2(nz, Math.hypot(nx, ny)) * RAD };
  }
  const sgn = total < 0 ? -1 : 1;
  return {
    lon: normLon(Math.atan2(sgn * wy, sgn * wx) * RAD),
    lat: Math.atan2(sgn * wz, Math.hypot(wx, wy)) * RAD,
  };
}

let memo: PreparedWorld | null = null;

/** Every outline as typed arrays, built on first use and shared after that. */
export function prepareShapes(): PreparedWorld {
  if (memo) return memo;
  const countries: PreparedCountry[] = [];
  const byIso = new Map<string, PreparedCountry>();
  for (const shape of COUNTRIES) {
    const rings = shape.rings.map(prepareRing).filter((r) => r.vec.length >= 9);
    if (rings.length === 0) continue;
    let main = rings[0]!;
    const bbox = new Float32Array([Infinity, Infinity, -Infinity, -Infinity]);
    for (const r of rings) {
      if (r.area > main.area) main = r;
      bbox[0] = Math.min(bbox[0]!, r.bbox[0]!);
      bbox[1] = Math.min(bbox[1]!, r.bbox[1]!);
      bbox[2] = Math.max(bbox[2]!, r.bbox[2]!);
      bbox[3] = Math.max(bbox[3]!, r.bbox[3]!);
    }
    const country: PreparedCountry = {
      iso: shape.iso,
      name: shape.iso ? countryName(shape.iso) : shape.name,
      rings, center: ringCenter(main), bbox,
    };
    countries.push(country);
    if (shape.iso && !byIso.has(shape.iso)) byIso.set(shape.iso, country);
  }
  const lakes = LAKES.map(prepareRing).filter((r) => r.vec.length >= 9);
  memo = { countries, lakes, byIso };
  return memo;
}

/** Even-odd ray cast in lon/lat; rings are closed and never cross the antimeridian. */
export function ringContains(ring: PreparedRing, lon: number, lat: number): boolean {
  const b = ring.bbox;
  if (lon < b[0]! || lon > b[2]! || lat < b[1]! || lat > b[3]!) return false;
  const p = ring.lonlat;
  const n = p.length / 2;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = p[2 * i]!, yi = p[2 * i + 1]!;
    const xj = p[2 * j]!, yj = p[2 * j + 1]!;
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The country under a point, or null for the sea and the big lakes. */
export function countryAt(lon: number, lat: number): PreparedCountry | null {
  const world = prepareShapes();
  const l = normLon(lon);
  for (const lake of world.lakes) if (ringContains(lake, l, lat)) return null;
  for (const c of world.countries) {
    const b = c.bbox;
    if (l < b[0]! || l > b[2]! || lat < b[1]! || lat > b[3]!) continue;
    for (const r of c.rings) if (ringContains(r, l, lat)) return c;
  }
  return null;
}

/**
 * True when a list covers (nearly) every country with an outline: a holiday the whole planet
 * shares, which the globe shows as natural land rather than one colour everywhere.
 */
export function isEverywhere(isos: { readonly size: number } | readonly string[]): boolean {
  const n = 'size' in isos ? isos.size : isos.length;
  return n >= prepareShapes().byIso.size * 0.85;
}

/** Where to point the globe for a country code, if it has an outline. */
export function countryCenter(iso: string): LonLat | null {
  return prepareShapes().byIso.get(iso)?.center ?? null;
}
