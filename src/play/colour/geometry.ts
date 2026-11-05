/**
 * geometry.ts — the pure maths behind the page: two-finger/wheel zoom and pan, and the keyboard's
 * reading order of regions. No DOM, so it is unit-tested.
 *
 * The paper is transformed with `translate(tx, ty) scale(s)` and transform-origin 0 0 inside a
 * viewport of size w × h (the paper fills the viewport at s = 1), so a paper point p appears at
 * screen t + s·p. Pan is clamped so the paper always covers the viewport: you can never lose it.
 */
export interface View { readonly s: number; readonly tx: number; readonly ty: number }

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const IDENTITY: View = { s: 1, tx: 0, ty: 0 };

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Keep scale in range and the paper covering the viewport. */
export function clampView(v: View, w: number, h: number): View {
  const s = clamp(Number.isFinite(v.s) ? v.s : 1, MIN_ZOOM, MAX_ZOOM);
  const tx = clamp(Number.isFinite(v.tx) ? v.tx : 0, w - s * w, 0);
  const ty = clamp(Number.isFinite(v.ty) ? v.ty : 0, h - s * h, 0);
  return { s, tx: tx === 0 ? 0 : tx, ty: ty === 0 ? 0 : ty };
}

/** Zoom by `factor` keeping the screen point (x, y) (viewport pixels) over the same bit of paper. */
export function zoomAt(v: View, factor: number, x: number, y: number, w: number, h: number): View {
  const s = clamp(v.s * factor, MIN_ZOOM, MAX_ZOOM);
  const px = (x - v.tx) / v.s;
  const py = (y - v.ty) / v.s;
  return clampView({ s, tx: x - s * px, ty: y - s * py }, w, h);
}

export function panBy(v: View, dx: number, dy: number, w: number, h: number): View {
  return clampView({ s: v.s, tx: v.tx + dx, ty: v.ty + dy }, w, h);
}

/**
 * One step of a two-finger gesture: the pinch started at view `start` with fingers `a0`,`b0`;
 * they are now at `a1`,`b1`. Scale follows the finger spread, and the paper point that was under
 * the fingers' midpoint stays under the new midpoint (so pinch and two-finger pan are one motion).
 */
export function pinch(start: View, a0: Pt, b0: Pt, a1: Pt, b1: Pt, w: number, h: number): View {
  const d0 = Math.max(1, Math.hypot(b0.x - a0.x, b0.y - a0.y));
  const d1 = Math.hypot(b1.x - a1.x, b1.y - a1.y);
  const m0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
  const m1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };
  const s = clamp(start.s * (d1 / d0), MIN_ZOOM, MAX_ZOOM);
  const px = (m0.x - start.tx) / start.s;
  const py = (m0.y - start.ty) / start.s;
  return clampView({ s, tx: m1.x - s * px, ty: m1.y - s * py }, w, h);
}

/** Smallest pan that brings the paper-space box fully into view (keyboard focus while zoomed). */
export function reveal(v: View, box: Box, w: number, h: number, margin = 16): View {
  const left = v.tx + v.s * box.x, right = v.tx + v.s * (box.x + box.w);
  const top = v.ty + v.s * box.y, bottom = v.ty + v.s * (box.y + box.h);
  let dx = 0, dy = 0;
  if (right - left > w - 2 * margin) dx = w / 2 - (left + right) / 2;
  else if (left < margin) dx = margin - left;
  else if (right > w - margin) dx = w - margin - right;
  if (bottom - top > h - 2 * margin) dy = h / 2 - (top + bottom) / 2;
  else if (top < margin) dy = margin - top;
  else if (bottom > h - margin) dy = h - margin - bottom;
  return panBy(v, dx, dy, w, h);
}

export interface Pt { readonly x: number; readonly y: number }
export interface Box { readonly x: number; readonly y: number; readonly w: number; readonly h: number }

/** Row height (in artboard units of an 800-unit page) within which regions count as one row. */
export const ROW_BAND = 70;

/**
 * Keyboard order: top-left to bottom-right by bounding box. Regions are sorted by their top edge and
 * cut into rows (a region starts a new row when its top is more than `band` below the row's first
 * top); each row then reads left to right. Big background shapes (the sky) come first.
 */
export function readingOrder(boxes: readonly (Box & { readonly id: string })[], band = ROW_BAND): string[] {
  const byTop = [...boxes].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: (Box & { readonly id: string })[][] = [];
  for (const b of byTop) {
    const row = rows[rows.length - 1];
    if (row && b.y - row[0]!.y <= band) row.push(b);
    else rows.push([b]);
  }
  return rows.flatMap((row) => row.sort((a, b) => a.x - b.x || a.y - b.y).map((b) => b.id));
}
