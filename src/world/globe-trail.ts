/**
 * Santa's trail as light. The legs flown so far are densified once (great-circle samples
 * ≤ 3° apart, as unit vectors for the globe and lon/lat for the map) whenever a leg is
 * completed; the live "head" from the last stop to the sleigh is rewritten every frame into
 * fixed buffers. Older legs are drawn faint and the latest bright, so the eye follows the
 * sleigh rather than the whole night's zig-zag, and every stop already visited sparkles.
 */
import { lonlatToVec3, type LonLat, type MVec3 } from './geo';
import { Overlay, type SceneView } from './globe-overlay';
import { clipLineInto, type Equirectangular, type Projected } from './projection';

const RAD = 180 / Math.PI;
const HEAD_SAMPLES = 24;
/** Legs drawn bright; older ones fade back. */
const RECENT_LEGS = 3;
const headA: MVec3 = [0, 0, 0];
const headB: MVec3 = [0, 0, 0];
const scratch: MVec3 = [0, 0, 0];

/** Great-circle samples (≤ 3° apart) through points[from..to], as unit vectors and lon/lat. */
function densifyStops(points: readonly LonLat[], from: number, to: number): [Float32Array, Float32Array] {
  const vec: number[] = [];
  const ll: number[] = [];
  const push = (x: number, y: number, z: number): void => {
    vec.push(x, y, z);
    ll.push(Math.atan2(y, x) * RAD, Math.atan2(z, Math.hypot(x, y)) * RAD);
  };
  for (let i = from + 1; i <= to; i++) {
    const a = lonlatToVec3(points[i - 1]!.lon, points[i - 1]!.lat);
    const b = lonlatToVec3(points[i]!.lon, points[i]!.lat);
    const ω = Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
    const steps = Math.max(1, Math.ceil(ω / (3 / RAD)));
    for (let s = i === from + 1 ? 0 : 1; s <= steps; s++) {
      if (ω < 1e-6) { push(a[0], a[1], a[2]); continue; }
      const ka = Math.sin((1 - s / steps) * ω) / Math.sin(ω);
      const kb = Math.sin((s / steps) * ω) / Math.sin(ω);
      push(ka * a[0] + kb * b[0], ka * a[1] + kb * b[1], ka * a[2] + kb * b[2]);
    }
  }
  // On the flat map the pole is a whole edge: give pole points their neighbour's longitude.
  const n = ll.length / 2;
  for (let i = 0; i < n; i++) {
    if (Math.abs(ll[2 * i + 1]!) < 89.9) continue;
    const j = i + 1 < n ? i + 1 : i - 1;
    if (j >= 0) ll[2 * i] = ll[2 * j]!;
  }
  return [new Float32Array(vec), new Float32Array(ll)];
}

/** Adds a lon/lat polyline to the current path in all three map copies, breaking at the date line. */
export function traceMapLine(ctx: CanvasRenderingContext2D, f: Equirectangular, ll: Float32Array, n: number, tmp: Projected): void {
  const W = f.wrapWidth();
  for (let k = -1; k <= 1; k++) {
    let prevLon = 0;
    for (let i = 0; i < n; i++) {
      const lon = ll[2 * i]!;
      f.projectRaw(lon, ll[2 * i + 1]!, tmp);
      if (i === 0 || Math.abs(lon - prevLon) > 180) ctx.moveTo(tmp.x + k * W, tmp.y);
      else ctx.lineTo(tmp.x + k * W, tmp.y);
      prevLon = lon;
    }
  }
}

export class TrailLayer {
  private oldVec: Float32Array | null = null;
  private oldLL: Float32Array | null = null;
  private vec: Float32Array | null = null;
  private ll: Float32Array | null = null;
  private stops: Float32Array | null = null;
  private readonly headVec = new Float32Array(HEAD_SAMPLES * 3);
  private readonly headLL = new Float32Array(HEAD_SAMPLES * 2);
  private headN = 0;

  /** The stops flown so far (pole first); null or [] clears the trail. */
  set(points: readonly LonLat[] | null): void {
    this.headN = 0;
    this.oldVec = null;
    this.oldLL = null;
    if (!points || points.length === 0) { this.vec = null; this.ll = null; this.stops = null; return; }
    const stops: number[] = [];
    for (const p of points) { const v = lonlatToVec3(p.lon, p.lat, scratch); stops.push(v[0], v[1], v[2]); }
    this.stops = new Float32Array(stops);
    if (points.length === 1) {
      // Nothing to draw yet, but the live head still needs somewhere to start from.
      this.vec = null;
      this.ll = new Float32Array([points[0]!.lon, points[0]!.lat]);
      return;
    }
    const split = Math.max(0, points.length - 1 - RECENT_LEGS);
    if (split > 0) [this.oldVec, this.oldLL] = densifyStops(points, 0, split);
    [this.vec, this.ll] = densifyStops(points, split, points.length - 1);
  }

  /** The live end: the great circle from the last stop to (lon, lat), without allocating. */
  head(lon: number, lat: number): void {
    const ll = this.ll;
    if (!ll || ll.length < 2) { this.headN = 0; return; }
    const a = lonlatToVec3(ll[ll.length - 2]!, ll[ll.length - 1]!, headA);
    const b = lonlatToVec3(lon, lat, headB);
    const ω = Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
    const n = HEAD_SAMPLES;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      let x = a[0], y = a[1], z = a[2];
      if (ω > 1e-6) {
        const ka = Math.sin((1 - t) * ω) / Math.sin(ω);
        const kb = Math.sin(t * ω) / Math.sin(ω);
        x = ka * a[0] + kb * b[0]; y = ka * a[1] + kb * b[1]; z = ka * a[2] + kb * b[2];
      }
      this.headVec[3 * i] = x; this.headVec[3 * i + 1] = y; this.headVec[3 * i + 2] = z;
      this.headLL[2 * i] = Math.atan2(y, x) * RAD;
      this.headLL[2 * i + 1] = Math.atan2(z, Math.hypot(x, y)) * RAD;
    }
    if (Math.abs(this.headLL[1]!) >= 89.9) this.headLL[0] = this.headLL[2]!;
    if (Math.abs(this.headLL[2 * n - 1]!) >= 89.9) this.headLL[2 * n - 2] = this.headLL[2 * n - 4]!;
    this.headN = n;
  }

  private trace(ctx: CanvasRenderingContext2D, v: SceneView, vec: Float32Array, ll: Float32Array, n: number): void {
    if (v.mode === 'globe') {
      v.lines.reset();
      clipLineInto(vec, v.ortho, v.lines, false, v.tmp);
      Overlay.trace(ctx, v.lines, false);
    } else traceMapLine(ctx, v.flat, ll, n, v.tmp);
  }

  /**
   * Magic dust: a few soft sparkles scattered just behind the sleigh along the live head,
   * each twinkling slowly (well under 3 Hz, and still under reduced motion).
   */
  private dust(ctx: CanvasRenderingContext2D, v: SceneView, color: string, t: number, animate: boolean): void {
    const n = this.headN;
    for (let k = 0; k < 7; k++) {
      const i = n - 2 - k * 2;
      if (i < 0) break;
      if (v.mode === 'globe') {
        const x = this.headVec[3 * i]!, y = this.headVec[3 * i + 1]!, z = this.headVec[3 * i + 2]!;
        if (v.ortho.depth(x, y, z) < 0.05) continue;
        v.ortho.projectVec(x, y, z, v.tmp);
      } else v.flat.project(this.headLL[2 * i]!, this.headLL[2 * i + 1]!, v.tmp);
      const jx = ((k * 37) % 9) - 4;
      const jy = ((k * 53) % 9) - 4;
      const a = animate ? 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 2.2 + k * 1.9)) : 0.7;
      v.overlay.light(ctx, v.tmp.x + jx, v.tmp.y + jy, 2.5 + (k % 3), color, a * (1 - k / 9));
    }
  }

  /** Draws the trail; `t` (seconds) twinkles the magic dust behind the sleigh while `animate`. */
  draw(ctx: CanvasRenderingContext2D, v: SceneView, color: string, t = 0, animate = false): void {
    if (!this.oldVec && !this.vec && this.headN === 0) return;
    if (this.oldVec && this.oldLL) {
      ctx.beginPath();
      this.trace(ctx, v, this.oldVec, this.oldLL, this.oldLL.length / 2);
      v.overlay.glowStroke(ctx, color, 1.4, '#fff8e1', 0.42);
    }
    ctx.beginPath();
    if (this.vec && this.ll) this.trace(ctx, v, this.vec, this.ll, this.ll.length / 2);
    if (this.headN > 0) this.trace(ctx, v, this.headVec, this.headLL, this.headN);
    v.overlay.glowStroke(ctx, color, 2, '#fff8e1', 1);
    ctx.globalCompositeOperation = 'lighter';
    if (this.headN > 0) this.dust(ctx, v, color, t, animate);
    const stops = this.stops;
    if (!stops) { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; return; }
    for (let i = 0; i < stops.length; i += 3) {
      const x = stops[i]!, y = stops[i + 1]!, z = stops[i + 2]!;
      if (v.mode === 'globe') {
        if (v.ortho.depth(x, y, z) < 0.05) continue;
        v.ortho.projectVec(x, y, z, v.tmp);
      } else v.flat.project(Math.atan2(y, x) * RAD, Math.atan2(z, Math.hypot(x, y)) * RAD, v.tmp);
      v.overlay.light(ctx, v.tmp.x, v.tmp.y, 4, color, 0.7);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
