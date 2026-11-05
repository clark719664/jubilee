/**
 * geometry.ts — the pure math behind Seek & Find's pan/zoom picture (no DOM, unit-tested).
 *
 * Every scene layer shares one 1600×900 artboard. The hero shows it with `object-fit: cover;
 * object-position: 50% 100%` (bottom-anchored), and Seek & Find starts from exactly that framing so the
 * picture a child already knows from the holiday page is the one they search. On top of it the child can
 * pan and zoom. The whole state is one affine map, artboard → screen:
 *
 *   screen = (ox + s·ax, oy + s·ay)        and back:  art = ((sx − ox) / s, (sy − oy) / s)
 *
 * `s` is CSS px per artboard unit (cover scale × zoom). The viewport knows the stage size and the insets
 * covered by the top bar and the card strip, so a child can drag the bottom of the picture up above the
 * strip and never loses a findable behind chrome. Hit-testing works in artboard units with a generous
 * finger slop that grows as the picture shrinks, so a wobbly tap still counts.
 */

export const ART_W = 1600;
export const ART_H = 900;
/** How far past the cover framing a child may zoom in. */
export const MAX_ZOOM = 4;
/** A fingertip is about this many CSS px across; half of it is added to every findable's radius. */
export const FINGER_PX = 26;
/** Never less than this many artboard units of slop, even when zoomed right in. */
export const MIN_SLOP = 14;
/** Inertia: velocity decays by e^(−FRICTION·t); below STOP_SPEED px/s it stops. */
export const FRICTION = 4.5;
export const STOP_SPEED = 18;
/** A press that moves less than this (px) and lifts within TAP_MS is a tap, not a drag. */
export const TAP_MOVE_PX = 10;
export const TAP_MS = 600;

export interface Point { readonly x: number; readonly y: number }

/** The stage in CSS px; `top`/`bottom` are the heights covered by the title bar and the card strip. */
export interface Viewport { readonly w: number; readonly h: number; readonly top: number; readonly bottom: number }

/** Artboard → screen: screen = (ox + s·x, oy + s·y). */
export interface View { readonly s: number; readonly ox: number; readonly oy: number }

export interface Circle { readonly x: number; readonly y: number; readonly r: number }

export const clampNum = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** `object-fit: cover` scale for the full stage. */
export function coverScale(vp: Viewport): number {
  return Math.max(vp.w / ART_W, vp.h / ART_H, 1e-6);
}

/** The hero framing: cover, centred horizontally, bottom edge on the stage's bottom edge. */
export function coverView(vp: Viewport): View {
  const s = coverScale(vp);
  return { s, ox: (vp.w - ART_W * s) / 2, oy: vp.h - ART_H * s };
}

/**
 * Where Seek & Find opens: the hero's cover framing, lifted so the ground sits on top of the card strip
 * instead of hiding behind it (the empty sky at the top gives way, never the details at the bottom).
 */
export function startView(vp: Viewport): View {
  const v = coverView(vp);
  return clampView({ s: v.s, ox: v.ox, oy: v.oy - vp.bottom }, vp);
}

/**
 * Zoom limits. `min` lets the child zoom out until the whole picture fits between the bars (on a phone
 * the cover framing shows only the middle third, so this is how they see everything at once).
 */
export function scaleLimits(vp: Viewport): { readonly min: number; readonly cover: number; readonly max: number } {
  const cover = coverScale(vp);
  const band = Math.max(1, vp.h - vp.top - vp.bottom);
  const fit = Math.min(vp.w / ART_W, band / ART_H);
  return { min: Math.min(cover, fit), cover, max: cover * MAX_ZOOM };
}

/** Clamp one axis: keep `o` in [lo, hi]; when the picture is smaller than the room, centre it. */
function clampAxis(o: number, lo: number, hi: number): number {
  return lo > hi ? (lo + hi) / 2 : clampNum(o, lo, hi);
}

/**
 * Keeps the picture covering the stage: no gaps at the sides; vertically the picture's bottom may rise
 * to the top of the card strip and its top may drop to the bottom of the title bar.
 */
export function clampView(v: View, vp: Viewport): View {
  const lim = scaleLimits(vp);
  const s = clampNum(v.s, lim.min, lim.max);
  const ox = clampAxis(v.ox, vp.w - ART_W * s, 0);
  const oy = clampAxis(v.oy, vp.h - vp.bottom - ART_H * s, vp.top);
  return { s, ox, oy };
}

export function screenToArt(v: View, p: Point): Point {
  return { x: (p.x - v.ox) / v.s, y: (p.y - v.oy) / v.s };
}

export function artToScreen(v: View, p: Point): Point {
  return { x: v.ox + p.x * v.s, y: v.oy + p.y * v.s };
}

/** The CSS transform for a 1600×900 plane with `transform-origin: 0 0`. */
export function cssTransform(v: View): string {
  return `translate3d(${round(v.ox)}px, ${round(v.oy)}px, 0) scale(${v.s.toFixed(5)})`;
}

const round = (n: number): number => Math.round(n * 100) / 100;

export function panBy(v: View, vp: Viewport, dx: number, dy: number): View {
  return clampView({ s: v.s, ox: v.ox + dx, oy: v.oy + dy }, vp);
}

/** Zoom by `factor` keeping the artboard point under `anchor` (screen px) where it is. */
export function zoomAt(v: View, vp: Viewport, factor: number, anchor: Point): View {
  const lim = scaleLimits(vp);
  const s = clampNum(v.s * factor, lim.min, lim.max);
  const a = screenToArt(v, anchor);
  return clampView({ s, ox: anchor.x - a.x * s, oy: anchor.y - a.y * s }, vp);
}

/** Centre of the visible band between the bars, in screen px (where buttons zoom about). */
export function bandCentre(vp: Viewport): Point {
  return { x: vp.w / 2, y: (vp.top + vp.h - vp.bottom) / 2 };
}

/**
 * Two-finger pinch: from the view when both fingers landed (`start`), the scale follows the finger
 * distance and the artboard point under the starting midpoint follows the current midpoint.
 */
export function pinchView(start: View, vp: Viewport, a0: Point, b0: Point, a1: Point, b1: Point): View {
  const d0 = Math.max(1, Math.hypot(b0.x - a0.x, b0.y - a0.y));
  const d1 = Math.max(1, Math.hypot(b1.x - a1.x, b1.y - a1.y));
  const lim = scaleLimits(vp);
  const s = clampNum(start.s * (d1 / d0), lim.min, lim.max);
  const m0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
  const m1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };
  const art = screenToArt(start, m0);
  return clampView({ s, ox: m1.x - art.x * s, oy: m1.y - art.y * s }, vp);
}

/** Wheel / trackpad zoom factor for a wheel delta in px (ctrl+wheel pinches are finer, so they count more). */
export function wheelFactor(deltaY: number, pinch: boolean): number {
  const k = pinch ? 0.01 : 0.0018;
  return Math.exp(-clampNum(deltaY, -240, 240) * k);
}

/** A view that centres an artboard point in the visible band at scale `s` (then clamps). */
export function focusView(vp: Viewport, p: Point, s: number): View {
  const c = bandCentre(vp);
  return clampView({ s, ox: c.x - p.x * s, oy: c.y - p.y * s }, vp);
}

/** Whether an artboard point sits comfortably inside the visible band (with a margin in px). */
export function isVisible(v: View, vp: Viewport, p: Point, marginPx = 40): boolean {
  const s = artToScreen(v, p);
  return s.x >= marginPx && s.x <= vp.w - marginPx && s.y >= vp.top + marginPx && s.y <= vp.h - vp.bottom - marginPx;
}

/** Finger slop in artboard units at scale `s`: half a fingertip, never below MIN_SLOP. */
export function tapSlop(s: number): number {
  return Math.max(MIN_SLOP, FINGER_PX / 2 / Math.max(s, 1e-6) + 8);
}

export interface HitResult { readonly id: string; readonly already: boolean }

/**
 * Which findable a tap at artboard point `p` means: the nearest one whose circle (r + slop) contains it.
 * Unfound ones win over found ones, so two overlapping details never block each other.
 */
export function hitTest(items: readonly (Circle & { readonly id: string })[], p: Point, slop: number, found: ReadonlySet<string>): HitResult | null {
  let best: { id: string; d: number; already: boolean } | null = null;
  for (const f of items) {
    const d = Math.hypot(p.x - f.x, p.y - f.y);
    if (d > f.r + slop) continue;
    const already = found.has(f.id);
    // Rank by (already, distance relative to radius).
    const score = d / Math.max(1, f.r);
    if (!best || (best.already && !already) || (best.already === already && score < best.d)) best = { id: f.id, d: score, already };
  }
  return best ? { id: best.id, already: best.already } : null;
}

/** Inertia velocity after `dt` seconds of friction; zero once it is too slow to see. */
export function decay(vx: number, vy: number, dt: number): { readonly vx: number; readonly vy: number; readonly moving: boolean } {
  const k = Math.exp(-FRICTION * dt);
  const nx = vx * k;
  const ny = vy * k;
  const moving = Math.hypot(nx, ny) >= STOP_SPEED;
  return moving ? { vx: nx, vy: ny, moving } : { vx: 0, vy: 0, moving };
}

export interface Sample { readonly t: number; readonly x: number; readonly y: number }

/** Release velocity (px/s) from the last ~100 ms of pointer samples (t in ms); capped so a flick stays sane. */
export function releaseVelocity(samples: readonly Sample[], windowMs = 100, cap = 3000): { readonly vx: number; readonly vy: number } {
  const last = samples[samples.length - 1];
  if (!last) return { vx: 0, vy: 0 };
  let first = last;
  for (let i = samples.length - 1; i >= 0; i--) {
    const s = samples[i]!;
    if (last.t - s.t > windowMs) break;
    first = s;
  }
  const dt = (last.t - first.t) / 1000;
  if (dt <= 0.008) return { vx: 0, vy: 0 };
  const vx = (last.x - first.x) / dt;
  const vy = (last.y - first.y) / dt;
  const speed = Math.hypot(vx, vy);
  const k = speed > cap ? cap / speed : 1;
  return { vx: vx * k, vy: vy * k };
}

/** Spring-ish ease that matches cubic-bezier(.2,.8,.2,1) closely enough for pans. */
export function easeOut(t: number): number {
  const u = 1 - clampNum(t, 0, 1);
  return 1 - u * u * u * u;
}

export function lerpView(a: View, b: View, t: number): View {
  // Interpolate the scale geometrically so zooms feel even, and the offsets linearly.
  const s = a.s * Math.pow(b.s / a.s, t);
  return { s, ox: a.ox + (b.ox - a.ox) * t, oy: a.oy + (b.oy - a.oy) * t };
}

/**
 * The window of mid.svg shown on a strip card (a square crop around the findable), as the size and
 * offset (CSS px) of the full artboard image inside a `box`-px square.
 */
export function cropFor(f: Circle, box: number): { readonly width: number; readonly height: number; readonly left: number; readonly top: number } {
  const side = Math.max(f.r * 2.2, 56);
  const k = box / side;
  return { width: ART_W * k, height: ART_H * k, left: -(f.x - side / 2) * k, top: -(f.y - side / 2) * k };
}

/** Hint glow radius in artboard px: a neighbourhood, not a spot. */
export const HINT_RADIUS = 220;
/** How far off-centre the thing sits in the glow, as a share of the glow's radius. */
const HINT_OFFSET = 0.55;

/**
 * Where a hint glows: a pool that only says "somewhere round here", with the thing off-centre in a
 * seeded direction so the middle of the glow is never the answer.
 */
export function hintCircle(f: Circle, seed: number): Circle {
  const angle = ((Math.imul(seed | 0, 2654435761) >>> 0) % 360) * (Math.PI / 180);
  const r = Math.max(HINT_RADIUS, f.r * 2.4);
  const off = r * HINT_OFFSET;
  return { x: f.x + Math.cos(angle) * off, y: f.y + Math.sin(angle) * off, r };
}

/**
 * Ambient effect opacity by zoom: the canvas only lines up with the art at the hero framing, and when a
 * child zooms in to search, falling snow should get out of the way. 1 at cover, 0 by ±60 % zoom.
 */
export function fxOpacity(v: View, vp: Viewport): number {
  const z = v.s / coverScale(vp);
  return clampNum(1 - Math.abs(z - 1) / 0.6, 0, 1);
}

/** Keeps the same artboard point at the band centre (and the same zoom ratio) when the stage resizes. */
export function refit(v: View, from: Viewport, to: Viewport): View {
  const zoom = v.s / coverScale(from);
  const centreArt = screenToArt(v, bandCentre(from));
  return focusView(to, centreArt, coverScale(to) * zoom);
}

/**
 * Where and how big the hint glow is drawn on screen. Zoomed in, the hint circle would swallow the
 * screen, so it is capped to the visible band, never below what still fits the thing. It stays just
 * as off-centre when capped, so zooming in cannot turn the glow into a pointer.
 */
export function hintDisc(v: View, vp: Viewport, hint: Circle, target: Circle): { readonly x: number; readonly y: number; readonly d: number } {
  const cap = Math.max(0.9 * Math.min(vp.w, vp.h - vp.top - vp.bottom), target.r * 4.6 * v.s);
  const d = Math.min(hint.r * 2 * v.s, cap);
  const p = artToScreen(v, target);
  const dist = Math.hypot(hint.x - target.x, hint.y - target.y) || 1;
  const off = (d / 2) * HINT_OFFSET;
  return { x: p.x + ((hint.x - target.x) / dist) * off, y: p.y + ((hint.y - target.y) / dist) * off, d };
}
