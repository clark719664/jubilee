/**
 * camera.ts — page cameras over the 1600×900 scene artboard (pure; tested in Node).
 *
 * A camera names the point a page is about and a zoom. A picture box of any shape shows the largest
 * window of its own shape that fits in the camera's 16:9 window (1600/zoom wide), centered on the point
 * and then slid back inside the artboard, so a subject near the edge (the Christmas snowman at x≈105)
 * stays in view and no box ever reveals an edge, a gap or the empty margin past x 1600. Layers are placed with
 * percentages of the box (left/top/width/height), so the browser rasterizes each SVG at its real size
 * (crisp at any zoom) and nothing needs re-measuring until the box changes shape.
 */
import { ARTBOARD, ZOOM_MAX, ZOOM_MIN, type Camera } from './types';

export interface View {
  readonly x0: number;
  readonly y0: number;
  readonly vw: number;
  readonly vh: number;
}

/** The camera's own 16:9 window in artboard units, before it is slid inside the artboard. */
export function cameraWindow(c: Camera): View {
  const vw = ARTBOARD.w / c.zoom;
  const vh = ARTBOARD.h / c.zoom;
  return { x0: c.x - vw / 2, y0: c.y - vh / 2, vw, vh };
}

/** True when the camera's point lies on the artboard and its zoom is in range (viewFor does the rest). */
export function insideArtboard(c: Camera): boolean {
  return c.zoom >= ZOOM_MIN && c.zoom <= ZOOM_MAX && c.x >= 0 && c.x <= ARTBOARD.w && c.y >= 0 && c.y <= ARTBOARD.h;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** What a box of `aspect` (width / height) shows for a camera: cover-fitted, clamped to the artboard. */
export function viewFor(c: Camera, aspect: number): View {
  const zoom = clamp(c.zoom, ZOOM_MIN, ZOOM_MAX);
  const ww = ARTBOARD.w / zoom;
  const wh = ARTBOARD.h / zoom;
  const a = aspect > 0 && Number.isFinite(aspect) ? aspect : ARTBOARD.w / ARTBOARD.h;
  const vw = a >= ww / wh ? ww : wh * a;
  const vh = vw / a;
  return {
    x0: clamp(c.x - vw / 2, 0, ARTBOARD.w - vw),
    y0: clamp(c.y - vh / 2, 0, ARTBOARD.h - vh),
    vw, vh,
  };
}

/** Where a full-artboard layer sits inside the box for a view, in percent of the box. */
export function layerBox(v: View): { readonly left: number; readonly top: number; readonly width: number; readonly height: number } {
  return {
    left: (-v.x0 / v.vw) * 100,
    top: (-v.y0 / v.vh) * 100,
    width: (ARTBOARD.w / v.vw) * 100,
    height: (ARTBOARD.h / v.vh) * 100,
  };
}

export function layerStyle(v: View): string {
  const b = layerBox(v);
  const f = (n: number): string => `${Math.round(n * 1000) / 1000}%`;
  return `left:${f(b.left)};top:${f(b.top)};width:${f(b.width)};height:${f(b.height)}`;
}

/**
 * A transform (origin 0 0) that moves a layer laid out for view `to` so it shows view `at` instead.
 * Used for page-turn pans: the layer is laid out at its final place and animated from where it was.
 */
export function relTransform(to: View, at: View): string {
  const r = to.vw / at.vw;
  const tx = ((-at.x0 / at.vw) - (-to.x0 / to.vw)) / (ARTBOARD.w / to.vw) * 100;
  const ty = ((-at.y0 / at.vh) - (-to.y0 / to.vh)) / (ARTBOARD.h / to.vh) * 100;
  const n = (v: number, d = 3): number => Math.round(v * 10 ** d) / 10 ** d;
  return `translate(${n(tx)}%, ${n(ty)}%) scale(${n(r, 5)})`;
}

/**
 * The camera of one layer part-way (t 0..1) through a pan from `a` to `b`. Nearer layers (depth → 1) run
 * ahead and farther ones (depth → 0) lag behind, and all meet exactly at both ends, so the planes slide
 * apart mid-turn (parallax) and the composition the artist drew is back in register when the page lands.
 */
export function panCamera(a: Camera, b: Camera, t: number, depth: number, strength = 0.32): Camera {
  const k = clamp(t, 0, 1);
  const bulge = Math.sin(Math.PI * k) * (depth - 0.5) * strength;
  return {
    x: a.x + (b.x - a.x) * (k + bulge),
    y: a.y + (b.y - a.y) * (k + bulge),
    zoom: a.zoom * (b.zoom / a.zoom) ** k,
  };
}
