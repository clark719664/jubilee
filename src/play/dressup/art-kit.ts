/**
 * art-kit.ts — tiny SVG helpers and the coordinates of Jubi's artboard that every item is drawn on.
 *
 * Jubi (src/ui/mascot.ts) lives in a 100×100 viewBox: a five-point star centered at (50, 54), outer
 * radius 40, inner 17, so the top point is (50, 14), the arms end at (12, 41.6) and (88, 41.6), the
 * feet at (26.5, 86.4) and (73.5, 86.4). The eyes sit at (42, 52) and (58, 52), the mouth ends by
 * y 67. Hats sit on the top point (brim around y 29), glasses on the eyes, neck things just under the
 * mouth, and held things in a round mitten at Jubi's right arm tip (GRIP). Outlines use Jubi's own ink
 * and weights (2.2–2.6), so items read as part of the same sticker at any size.
 */
import { svg } from '../../ui/dom';

export const INK = '#1f1a3d';
export const BODY = '#ffd166';
export const LINE = 2.2;
/** Where Jubi holds things: just inside the right arm tip. */
export const GRIP = { x: 84, y: 44, r: 4.4 } as const;
/** Half-width of Jubi's top point at height y (for headbands that hug it). */
export const armHalf = (y: number): number => (10 * (y - 14)) / 26.25;

type Attrs = Record<string, string | number>;

/** A group (optionally transformed). */
export function g(attrs: Attrs, ...kids: SVGElement[]): SVGGElement {
  const el = svg('g', attrs);
  el.append(...kids);
  return el;
}

/** A filled shape with Jubi's ink outline. */
export function p(d: string, fill: string, more: Attrs = {}): SVGPathElement {
  return svg('path', { d, fill, stroke: INK, 'stroke-width': LINE, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...more });
}

/** A line with no fill. */
export function line(d: string, stroke: string, width = LINE, more: Attrs = {}): SVGPathElement {
  return svg('path', { d, fill: 'none', stroke, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...more });
}

/** A thick stick: an ink line with a colored core, so it keeps its outline at any zoom. */
export function stick(d: string, color: string, width = 2.6): SVGGElement {
  return g({}, line(d, INK, width + 2.4), line(d, color, width));
}

export function c(cx: number, cy: number, r: number, fill: string, more: Attrs = {}): SVGCircleElement {
  return svg('circle', { cx, cy, r, fill, stroke: INK, 'stroke-width': LINE, ...more });
}

export function e(cx: number, cy: number, rx: number, ry: number, fill: string, more: Attrs = {}): SVGEllipseElement {
  return svg('ellipse', { cx, cy, rx, ry, fill, stroke: INK, 'stroke-width': LINE, ...more });
}

/** A shape with no outline (highlights, shading, glints). */
export function flat(d: string, fill: string, more: Attrs = {}): SVGPathElement {
  return svg('path', { d, fill, ...more });
}

/** Jubi's mitten closing round a handle. Drawn over the handle (or under a thing resting on it). */
export function hand(): SVGCircleElement {
  return c(GRIP.x, GRIP.y, GRIP.r, BODY, { 'stroke-width': 2.4, class: 'dz-hand' });
}

/** A five-point star path centered at (cx, cy). */
export function starD(cx: number, cy: number, outer: number, inner: number, rot = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5 + (rot * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** A heart centered at (cx, cy), about 2s wide. */
export function heartD(cx: number, cy: number, s: number): string {
  const k = (n: number): string => n.toFixed(2);
  return `M${k(cx)} ${k(cy + s * 0.9)}C${k(cx - s * 1.5)} ${k(cy - s * 0.1)} ${k(cx - s * 0.75)} ${k(cy - s * 1.25)} ${k(cx)} ${k(cy - s * 0.45)}`
    + `C${k(cx + s * 0.75)} ${k(cy - s * 1.25)} ${k(cx + s * 1.5)} ${k(cy - s * 0.1)} ${k(cx)} ${k(cy + s * 0.9)}Z`;
}

/** A five-petal flower (petals, then a center) at (cx, cy). */
export function flower(cx: number, cy: number, r: number, petal: string, center: string, rot = 0): SVGGElement {
  const out = g({});
  for (let i = 0; i < 5; i++) {
    const a = ((rot + i * 72 - 90) * Math.PI) / 180;
    out.append(c(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.5, petal, { 'stroke-width': 1.6 }));
  }
  out.append(c(cx, cy, r * 0.36, center, { 'stroke-width': 1.6 }));
  return out;
}

/** A strip that hugs Jubi's top point between heights y0 and y1 (headbands), `over` units past the outline. */
export function bandD(y0: number, y1: number, over = 1.4, sag = 1.2): string {
  const a0 = armHalf(y0) + over;
  const a1 = armHalf(y1) + over;
  return `M${50 - a0} ${y0}Q50 ${y0 + sag} ${50 + a0} ${y0}L${50 + a1} ${y1}Q50 ${y1 + sag} ${50 - a1} ${y1}Z`;
}

/** Four-point twinkle (sparkles on wands, glasses and in-season badges). */
export function twinkleD(x: number, y: number, s: number): string {
  return `M${x} ${y - s}Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y}Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s}`
    + `Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y}Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s}Z`;
}
