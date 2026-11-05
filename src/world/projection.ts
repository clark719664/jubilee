/**
 * Projections for the World view: an orthographic globe and an equirectangular flat
 * map behind one small interface, plus the hemisphere clipper the globe needs.
 *
 * Why clip in 3D: a country ring that disappears round the limb must stay a closed,
 * filled shape. We run Sutherland–Hodgman against the plane through the globe's center
 * perpendicular to the view vector, and wherever the ring leaves the hemisphere we walk
 * the horizon arc from the exit to the matching re-entry. Which re-entry? The next
 * crossing along the rim in the ring's winding direction (d3-geo's "rejoin" rule): the
 * crossings alternate exit/entry along the rim for any simple polygon, so this links
 * nested lobes correctly where "the ring's own re-entry" would not. Rings must be
 * counter-clockwise (interior on the left when seen from outside); `shapes.ts`
 * normalizes the data once.
 *
 * Output goes into a reusable `PolyBuffer` so a frame allocates nothing after warm-up.
 */
import { DEG, normLon, clampLat, vec3ToLonlat, type LonLat, type MVec3 } from './geo';

export interface Projected { x: number; y: number; visible: boolean }

export interface Projection {
  readonly kind: 'globe' | 'map';
  readonly w: number;
  readonly h: number;
  readonly scale: number;
  readonly center: LonLat;
  setSize(w: number, h: number): void;
  setScale(scale: number): void;
  setCenter(lon: number, lat: number): void;
  project(lon: number, lat: number, out?: Projected): Projected;
  unproject(x: number, y: number): LonLat | null;
}

function fresh(): Projected { return { x: 0, y: 0, visible: false }; }

/** Orthographic globe. `scale` is the globe radius in CSS pixels; the disc sits at the canvas center. */
export class Orthographic implements Projection {
  readonly kind = 'globe' as const;
  w = 1;
  h = 1;
  scale = 1;
  private lon0 = 0;
  private lat0 = 0;
  /** View vector (toward the viewer), screen-right and screen-up unit vectors. */
  readonly c: MVec3 = [1, 0, 0];
  readonly u: MVec3 = [0, 1, 0];
  readonly v: MVec3 = [0, 0, 1];

  constructor(lon = 0, lat = 0) { this.setCenter(lon, lat); }

  get center(): LonLat { return { lon: this.lon0, lat: this.lat0 }; }
  /** The center without allocating (per-frame callers). */
  get centerLon(): number { return this.lon0; }
  get centerLat(): number { return this.lat0; }

  setSize(w: number, h: number): void { this.w = w; this.h = h; }
  setScale(scale: number): void { this.scale = scale; }

  setCenter(lon: number, lat: number): void {
    this.lon0 = normLon(lon);
    this.lat0 = clampLat(lat);
    const λ = this.lon0 * DEG;
    const φ = this.lat0 * DEG;
    const cλ = Math.cos(λ), sλ = Math.sin(λ), cφ = Math.cos(φ), sφ = Math.sin(φ);
    this.c[0] = cφ * cλ; this.c[1] = cφ * sλ; this.c[2] = sφ;
    this.u[0] = -sλ; this.u[1] = cλ; this.u[2] = 0;
    this.v[0] = -sφ * cλ; this.v[1] = -sφ * sλ; this.v[2] = cφ;
  }

  project(lon: number, lat: number, out: Projected = fresh()): Projected {
    const φ = lat * DEG;
    const λ = lon * DEG;
    const cφ = Math.cos(φ);
    return this.projectVec(cφ * Math.cos(λ), cφ * Math.sin(λ), Math.sin(φ), out);
  }

  /** Projects a unit vector; `visible` is "on the front hemisphere". */
  projectVec(x: number, y: number, z: number, out: Projected = fresh()): Projected {
    const { c, u, v } = this;
    out.x = this.w / 2 + this.scale * (x * u[0] + y * u[1] + z * u[2]);
    out.y = this.h / 2 - this.scale * (x * v[0] + y * v[1] + z * v[2]);
    out.visible = x * c[0] + y * c[1] + z * c[2] >= 0;
    return out;
  }

  /** Depth of a unit vector along the view axis (≥ 0 is the front hemisphere). */
  depth(x: number, y: number, z: number): number {
    return x * this.c[0] + y * this.c[1] + z * this.c[2];
  }

  unproject(x: number, y: number): LonLat | null {
    const px = (x - this.w / 2) / this.scale;
    const py = -(y - this.h / 2) / this.scale;
    const r2 = px * px + py * py;
    if (r2 > 1) return null;
    const pz = Math.sqrt(1 - r2);
    const { c, u, v } = this;
    return vec3ToLonlat([
      px * u[0] + py * v[0] + pz * c[0],
      px * u[1] + py * v[1] + pz * c[1],
      px * u[2] + py * v[2] + pz * c[2],
    ]);
  }
}

/**
 * Equirectangular flat map. `scale` is pixels per degree; the map is centered on
 * `center` and may pan. `project` wraps longitudes to the copy nearest the center;
 * ring drawing uses `projectRaw` plus `wrapWidth()` offsets instead so no ring is torn.
 */
export class Equirectangular implements Projection {
  readonly kind = 'map' as const;
  w = 1;
  h = 1;
  scale = 1;
  private lon0 = 0;
  private lat0 = 0;

  constructor(lon = 0, lat = 0) { this.setCenter(lon, lat); }

  get center(): LonLat { return { lon: this.lon0, lat: this.lat0 }; }
  get centerLon(): number { return this.lon0; }
  get centerLat(): number { return this.lat0; }

  setSize(w: number, h: number): void { this.w = w; this.h = h; }
  setScale(scale: number): void { this.scale = scale; }
  setCenter(lon: number, lat: number): void { this.lon0 = normLon(lon); this.lat0 = clampLat(lat); }

  /** Width of one full copy of the world in pixels. */
  wrapWidth(): number { return 360 * this.scale; }

  project(lon: number, lat: number, out: Projected = fresh()): Projected {
    out.x = this.w / 2 + normLon(lon - this.lon0) * this.scale;
    out.y = this.h / 2 - (lat - this.lat0) * this.scale;
    out.visible = out.x >= 0 && out.x <= this.w && out.y >= 0 && out.y <= this.h;
    return out;
  }

  /** Same as project but without wrapping, so consecutive ring points stay consecutive. */
  projectRaw(lon: number, lat: number, out: Projected = fresh()): Projected {
    out.x = this.w / 2 + (lon - this.lon0) * this.scale;
    out.y = this.h / 2 - (lat - this.lat0) * this.scale;
    out.visible = true;
    return out;
  }

  unproject(x: number, y: number): LonLat | null {
    const lat = this.lat0 - (y - this.h / 2) / this.scale;
    if (lat > 90 || lat < -90) return null;
    return { lon: normLon(this.lon0 + (x - this.w / 2) / this.scale), lat };
  }
}

/** Growable buffer of 2D polygons/polylines (x,y pairs) that is reused frame after frame. */
export class PolyBuffer {
  pts = new Float32Array(8192);
  /** Floats in use. */
  n = 0;
  /** Start float index of each polygon; polygon i spans starts[i] … (starts[i + 1] ?? n). */
  readonly starts: number[] = [];

  reset(): void { this.n = 0; this.starts.length = 0; }
  begin(): void { this.starts.push(this.n); }

  push(x: number, y: number): void {
    if (this.n + 2 > this.pts.length) {
      const bigger = new Float32Array(this.pts.length * 2);
      bigger.set(this.pts);
      this.pts = bigger;
    }
    this.pts[this.n++] = x;
    this.pts[this.n++] = y;
  }

  /** Closes the current polygon, dropping it when it has fewer than `min` points. */
  end(min = 3): void {
    const start = this.starts[this.starts.length - 1];
    if (start === undefined) return;
    if (this.n - start < min * 2) { this.n = start; this.starts.pop(); }
  }

  get count(): number { return this.starts.length; }

  /** Float index one past polygon i's last coordinate. */
  endOf(i: number): number { return this.starts[i + 1] ?? this.n; }

  /** Copies the polygons out as plain arrays (tests and one-off callers only). */
  toArrays(): { x: number; y: number }[][] {
    const out: { x: number; y: number }[][] = [];
    for (let i = 0; i < this.starts.length; i++) {
      const poly: { x: number; y: number }[] = [];
      for (let j = this.starts[i]!; j < this.endOf(i); j += 2) poly.push({ x: this.pts[j]!, y: this.pts[j + 1]! });
      out.push(poly);
    }
    return out;
  }
}

// ── hemisphere clipping ──────────────────────────────────────────────────────────

let depths = new Float32Array(1024);
const MAX_RUNS = 64;
const runStart = new Int32Array(MAX_RUNS);
const runLen = new Int32Array(MAX_RUNS);
const entryX = new Float32Array(MAX_RUNS);
const entryY = new Float32Array(MAX_RUNS);
const entryT = new Float32Array(MAX_RUNS);
const exitX = new Float32Array(MAX_RUNS);
const exitY = new Float32Array(MAX_RUNS);
const exitT = new Float32Array(MAX_RUNS);
const linkOf = new Int32Array(MAX_RUNS);
const visited = new Uint8Array(MAX_RUNS);
const TWO_PI = Math.PI * 2;

/** Crossing of edge a→b (opposite depth signs) with the horizon plane, projected to the rim. */
function crossing(ring: Float32Array, ia: number, ib: number, da: number, db: number, proj: Orthographic, out: Projected): number {
  const t = da / (da - db);
  const x = ring[ia]! + t * (ring[ib]! - ring[ia]!);
  const y = ring[ia + 1]! + t * (ring[ib + 1]! - ring[ia + 1]!);
  const z = ring[ia + 2]! + t * (ring[ib + 2]! - ring[ia + 2]!);
  const len = Math.hypot(x, y, z) || 1;
  const { u, v } = proj;
  const px = (x * u[0] + y * u[1] + z * u[2]) / len;
  const py = (x * v[0] + y * v[1] + z * v[2]) / len;
  // Snap to the rim exactly so adjacent polygons share the same edge pixels.
  const ang = Math.atan2(py, px);
  out.x = proj.w / 2 + proj.scale * Math.cos(ang);
  out.y = proj.h / 2 - proj.scale * Math.sin(ang);
  return ang;
}

/**
 * Signed turning of a ring about the axis `c` (radians): +2π when the CCW ring winds round
 * `c` (its interior holds the view center), −2π when it winds round −c, 0 when neither.
 */
function windingAbout(ring: Float32Array, c: Readonly<MVec3>): number {
  const n = ring.length / 3;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ax = ring[3 * i]!, ay = ring[3 * i + 1]!, az = ring[3 * i + 2]!;
    const bx = ring[3 * j]!, by = ring[3 * j + 1]!, bz = ring[3 * j + 2]!;
    // Components perpendicular to the axis.
    const da = ax * c[0] + ay * c[1] + az * c[2];
    const db = bx * c[0] + by * c[1] + bz * c[2];
    const px = ax - da * c[0], py = ay - da * c[1], pz = az - da * c[2];
    const qx = bx - db * c[0], qy = by - db * c[1], qz = bz - db * c[2];
    const cr = (py * qz - pz * qy) * c[0] + (pz * qx - px * qz) * c[1] + (px * qy - py * qx) * c[2];
    total += Math.atan2(cr, px * qx + py * qy + pz * qz);
  }
  return total;
}

/** The whole visible disc as one polygon (a ring that is all behind us but surrounds the view center). */
function pushDisc(proj: Orthographic, out: PolyBuffer): void {
  const steps = Math.max(48, Math.min(256, Math.round(proj.scale / 3)));
  out.begin();
  for (let s = 0; s < steps; s++) {
    const a = (s / steps) * TWO_PI;
    out.push(proj.w / 2 + proj.scale * Math.cos(a), proj.h / 2 - proj.scale * Math.sin(a));
  }
  out.end();
}

/**
 * Clips one closed CCW ring (unit-vector triples) to the front hemisphere of `proj` and
 * appends the visible polygon(s) to `out` as projected points.
 *
 * `maxWalk` caps a single rim walk (radians). A ring inside a cap smaller than a hemisphere
 * can never need more than π of rim, so callers pass π for those: a simplified outline that
 * crosses itself near the limb then closes with a short chord instead of wrapping the whole
 * disc in land.
 */
export function clipRingInto(
  ring: Float32Array, proj: Orthographic, out: PolyBuffer, tmp: Projected = fresh(), maxWalk = TWO_PI,
): void {
  const n = ring.length / 3;
  if (n < 3) return;
  if (depths.length < n) depths = new Float32Array(n * 2);
  const { c } = proj;
  let allFront = true;
  let anyFront = false;
  let firstBack = -1;
  for (let i = 0; i < n; i++) {
    const d = ring[3 * i]! * c[0] + ring[3 * i + 1]! * c[1] + ring[3 * i + 2]! * c[2];
    depths[i] = d;
    if (d < 0) { allFront = false; if (firstBack < 0) firstBack = i; }
    else anyFront = true;
  }
  if (!anyFront) {
    // Every vertex is behind us; the ring can still hold the whole front (a cap bigger than a hemisphere).
    if (windingAbout(ring, c) > Math.PI) pushDisc(proj, out);
    return;
  }
  if (allFront) {
    out.begin();
    for (let i = 0; i < n; i++) {
      proj.projectVec(ring[3 * i]!, ring[3 * i + 1]!, ring[3 * i + 2]!, tmp);
      out.push(tmp.x, tmp.y);
    }
    out.end();
    return;
  }

  // Start the walk just after a back vertex so every run begins with an entry crossing.
  let runs = 0;
  for (let k = 1; k <= n; k++) {
    const i = (firstBack + k) % n;
    const prev = (i + n - 1) % n;
    const d = depths[i]!;
    const dp = depths[prev]!;
    if (d >= 0) {
      if (dp < 0) {
        if (runs === MAX_RUNS) break;
        entryT[runs] = crossing(ring, 3 * prev, 3 * i, dp, d, proj, tmp);
        entryX[runs] = tmp.x; entryY[runs] = tmp.y;
        runStart[runs] = i; runLen[runs] = 0;
        runs++;
      }
      runLen[runs - 1]!++;
    } else if (dp >= 0 && runs > 0) {
      exitT[runs - 1] = crossing(ring, 3 * prev, 3 * i, dp, d, proj, tmp);
      exitX[runs - 1] = tmp.x; exitY[runs - 1] = tmp.y;
    }
  }
  if (runs === 0) return;

  // Link each exit to the next entry counterclockwise along the rim.
  for (let r = 0; r < runs; r++) {
    let best = r;
    let bestDelta = TWO_PI + 1;
    for (let s = 0; s < runs; s++) {
      let delta = entryT[s]! - exitT[r]!;
      delta -= Math.floor(delta / TWO_PI) * TWO_PI;
      if (delta < bestDelta) { bestDelta = delta; best = s; }
    }
    linkOf[r] = best;
    visited[r] = 0;
  }

  const step = Math.min(0.2, Math.max(0.02, 6 / proj.scale));
  const cx = proj.w / 2;
  const cy = proj.h / 2;
  const R = proj.scale;
  for (let r0 = 0; r0 < runs; r0++) {
    if (visited[r0]) continue;
    out.begin();
    let r = r0;
    for (let guard = 0; guard <= runs; guard++) {
      visited[r] = 1;
      out.push(entryX[r]!, entryY[r]!);
      const start = runStart[r]!;
      const len = runLen[r]!;
      for (let j = 0; j < len; j++) {
        const i = (start + j) % n;
        proj.projectVec(ring[3 * i]!, ring[3 * i + 1]!, ring[3 * i + 2]!, tmp);
        out.push(tmp.x, tmp.y);
      }
      out.push(exitX[r]!, exitY[r]!);
      const link = linkOf[r]!;
      let delta = entryT[link]! - exitT[r]!;
      delta -= Math.floor(delta / TWO_PI) * TWO_PI;
      const steps = delta > maxWalk ? 0 : Math.floor(delta / step);
      for (let s = 1; s <= steps; s++) {
        const a = exitT[r]! + s * step;
        out.push(cx + R * Math.cos(a), cy - R * Math.sin(a));
      }
      if (link === r0 || visited[link]) break;
      r = link;
    }
    out.end();
  }
}

/** Array-returning wrapper around `clipRingInto` for tests and one-off callers. */
export function clipRingToHemisphere(ring: Float32Array, proj: Orthographic, maxWalk = TWO_PI): { x: number; y: number }[][] {
  const buf = new PolyBuffer();
  clipRingInto(ring, proj, buf, fresh(), maxWalk);
  return buf.toArrays();
}

/**
 * Clips an open polyline (unit-vector triples) to the front hemisphere, appending each
 * visible piece to `out` as a separate polyline (no rim walking: lines are not filled).
 */
export function clipLineInto(line: Float32Array, proj: Orthographic, out: PolyBuffer, closed = false, tmp: Projected = fresh()): void {
  const n = line.length / 3;
  if (n < 2) return;
  const { c } = proj;
  let open = false;
  let dp = 0;
  const total = closed ? n + 1 : n;
  for (let k = 0; k < total; k++) {
    const i = k % n;
    const d = line[3 * i]! * c[0] + line[3 * i + 1]! * c[1] + line[3 * i + 2]! * c[2];
    if (k > 0) {
      const prev = (i + n - 1) % n;
      if (d >= 0 && dp < 0) {
        crossing(line, 3 * prev, 3 * i, dp, d, proj, tmp);
        out.begin();
        out.push(tmp.x, tmp.y);
        open = true;
      } else if (d < 0 && dp >= 0 && open) {
        crossing(line, 3 * prev, 3 * i, dp, d, proj, tmp);
        out.push(tmp.x, tmp.y);
        out.end(2);
        open = false;
      }
    } else if (d >= 0) {
      out.begin();
      open = true;
    }
    if (d >= 0 && open) {
      proj.projectVec(line[3 * i]!, line[3 * i + 1]!, line[3 * i + 2]!, tmp);
      out.push(tmp.x, tmp.y);
    }
    dp = d;
  }
  if (open) out.end(2);
}

/**
 * Projects a ring of lon/lat pairs (degrees) on the flat map without wrapping, shifted by
 * `offset` pixels, and appends it to `out`. Returns false (and appends nothing) when the
 * shifted bounding box misses the canvas.
 */
export function mapRingInto(
  lonlat: Float32Array, bbox: ArrayLike<number>, proj: Equirectangular, offset: number, out: PolyBuffer, tmp: Projected = fresh(),
): boolean {
  proj.projectRaw(bbox[0]!, bbox[3]!, tmp);
  const x0 = tmp.x + offset, y0 = tmp.y;
  proj.projectRaw(bbox[2]!, bbox[1]!, tmp);
  const x1 = tmp.x + offset, y1 = tmp.y;
  if (x1 < 0 || x0 > proj.w || y1 < 0 || y0 > proj.h) return false;
  out.begin();
  for (let i = 0; i < lonlat.length; i += 2) {
    proj.projectRaw(lonlat[i]!, lonlat[i + 1]!, tmp);
    out.push(tmp.x + offset, tmp.y);
  }
  out.end();
  return true;
}
