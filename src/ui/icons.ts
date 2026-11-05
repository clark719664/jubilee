/**
 * Inline SVG icon set, built with `svg()` (never innerHTML). Every icon is
 * 24×24, stroke-based in `currentColor`, and `aria-hidden` — the label always
 * comes from the surrounding control (`aria-label` or visible text).
 *
 * Usage: `button.append(icon('print'), ' Print')`.
 */
import { svg } from './dom';
import type { Allergen, Hazard } from '../content/types';

type Shape =
  | { readonly t: 'path'; readonly d: string; readonly fill?: boolean }
  | { readonly t: 'circle'; readonly cx: number; readonly cy: number; readonly r: number; readonly fill?: boolean }
  | { readonly t: 'rect'; readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly rx?: number }
  | { readonly t: 'line'; readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number };

const P = (d: string, fill = false): Shape => ({ t: 'path', d, fill });
const C = (cx: number, cy: number, r: number, fill = false): Shape => ({ t: 'circle', cx, cy, r, fill });
const R = (x: number, y: number, w: number, h: number, rx = 2): Shape => ({ t: 'rect', x, y, w, h, rx });
const L = (x1: number, y1: number, x2: number, y2: number): Shape => ({ t: 'line', x1, y1, x2, y2 });

const ICONS = {
  // ── sleeps & time ──
  moon: [P('M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z')],
  bed: [P('M3 18V8'), P('M3 13h18v5'), P('M3 13V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4'), P('M21 18v-5a3 3 0 0 0-3-3h-7')],
  // ── kitchen & craft ──
  chefHat: [P('M7 11a4 4 0 0 1 .5-8A5 5 0 0 1 16.5 3 4 4 0 0 1 17 11v8H7v-8z'), L(7, 15, 17, 15)],
  scissors: [C(6, 6, 3), C(6, 18, 3), L(20, 4, 8.5, 15.5), L(14.5, 10, 20, 20), L(8.5, 8.5, 12, 12)],
  adultHand: [P('M18 11V6a1.5 1.5 0 0 0-3 0v5'), P('M15 10V4.5a1.5 1.5 0 0 0-3 0V11'), P('M12 10.5V5.5a1.5 1.5 0 0 0-3 0V12'), P('M9 12v-1.5a1.5 1.5 0 0 0-3 0V15a7 7 0 0 0 14 0v-4a1.5 1.5 0 0 0-3 0v1')],
  // ── hazards ──
  flame: [P('M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-6-3-8-1 3-4 6-5 9-1 4 2 10 7 10z'), P('M12 22c-2 0-3-1.5-3-3.5S11 15 12 14c1 1 3 2.5 3 4.5S14 22 12 22z')],
  knife: [P('M21 3 9 15'), P('M7 17l-3 4 4-3'), P('M12 12l4 4a3 3 0 0 0 4-4l-2-2')],
  hotLiquid: [P('M5 10h12v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5v-6z'), P('M17 12h2a2 2 0 0 1 0 4h-2'), P('M8 3c0 1.5 1.5 1.5 1.5 3S8 7.5 8 7'), P('M12 3c0 1.5 1.5 1.5 1.5 3S12 7.5 12 7')],
  electric: [P('M13 2 4 14h7l-1 8 9-12h-7l1-8z')],
  smallParts: [C(7, 7, 2.5), C(17, 8, 2), C(9, 17, 2), R(14, 14, 5, 5, 1.5)],
  hotGlue: [P('M4 9h12l3 3-3 3H4V9z'), P('M16 15v5a1 1 0 0 1-2 0v-5'), L(2, 12, 4, 12), P('M9 15v3')],
  rawEgg: [P('M12 3c-3.5 0-7 5-7 10a7 7 0 0 0 14 0c0-5-3.5-10-7-10z'), C(12, 13, 2.5)],
  choking: [C(12, 12, 9), L(8, 8, 16, 16), L(16, 8, 8, 16)],
  candle: [R(9, 10, 6, 11, 1.5), P('M12 3c-1.5 2-2 3-2 4.5a2 2 0 0 0 4 0C14 6 13.5 5 12 3z'), L(12, 7.5, 12, 10)],
  // ── allergens ──
  milk: [P('M8 2h8v3l2 4v12H6V9l2-4V2z'), L(8, 5, 16, 5), P('M6 14h12')],
  egg: [P('M12 3c-3.5 0-7 5-7 10a7 7 0 0 0 14 0c0-5-3.5-10-7-10z')],
  wheat: [P('M12 22V8'), P('M12 8c-3 0-4-2-4-4 2 0 4 1 4 4z'), P('M12 8c3 0 4-2 4-4-2 0-4 1-4 4z'), P('M12 13c-3 0-4-2-4-4 2 0 4 1 4 4z'), P('M12 13c3 0 4-2 4-4-2 0-4 1-4 4z'), P('M12 18c-3 0-4-2-4-4 2 0 4 1 4 4z'), P('M12 18c3 0 4-2 4-4-2 0-4 1-4 4z')],
  gluten: [P('M12 22V8'), P('M12 8c-3 0-4-2-4-4 2 0 4 1 4 4z'), P('M12 8c3 0 4-2 4-4-2 0-4 1-4 4z'), P('M12 14c-3 0-4-2-4-4 2 0 4 1 4 4z'), P('M12 14c3 0 4-2 4-4-2 0-4 1-4 4z'), L(4, 20, 20, 4)],
  peanut: [P('M8 4a4 4 0 0 1 4 4 4 4 0 0 0 4 4 4 4 0 1 1-4 4 4 4 0 0 0-4-4 4 4 0 1 1 0-8z'), L(9, 9, 11, 11), L(13, 13, 15, 15)],
  treeNut: [P('M12 21c-4 0-6-3-6-7s2-6 6-11c4 5 6 7 6 11s-2 7-6 7z'), P('M8 11c1 1 3 1.5 4 1.5s3-.5 4-1.5')],
  soy: [P('M6 18c-2-4 0-10 5-13 5 3 7 9 5 13-2 3-8 3-10 0z'), C(10, 9, 1.2, true), C(12, 13, 1.2, true), C(10, 16.5, 1.2, true)],
  sesame: [P('M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9z'), L(12, 3, 12, 21)],
  fish: [P('M3 12c3-4 7-6 11-6 2 0 4 .5 6 1.5L17 12l3 4.5C18 17.5 16 18 14 18c-4 0-8-2-11-6z'), P('M3 12 6 8'), P('M3 12l3 4'), C(15, 11, 1, true)],
  shellfish: [P('M4 14c0-5 3.5-9 8-9s8 4 8 9H4z'), P('M8 14v-6'), P('M12 14V5'), P('M16 14V8'), P('M5 14c0 3 2 5 7 5s7-2 7-5')],
  // ── tabs ──
  next: [C(12, 12, 9), P('M12 7v5l3 3')],
  all: [R(3, 3, 7, 7), R(14, 3, 7, 7), R(3, 14, 7, 7), R(14, 14, 7, 7)],
  year: [R(3, 5, 18, 16), L(3, 10, 21, 10), L(8, 3, 8, 7), L(16, 3, 16, 7), C(12, 15, 1.2, true)],
  stickers: [P('M12 3l2.6 5.5 6 .7-4.4 4.1 1.2 6-5.4-3-5.4 3 1.2-6L3.4 9.2l6-.7L12 3z')],
  world: [C(12, 12, 9), L(3, 12, 21, 12), P('M12 3c3 2.8 4.5 5.8 4.5 9S15 18.2 12 21'), P('M12 3c-3 2.8-4.5 5.8-4.5 9S9 18.2 12 21')],
  // ── world view ──
  map: [P('M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z'), L(9, 4, 9, 18), L(15, 6, 15, 20)],
  pin: [P('M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z'), C(12, 10, 2.5)],
  sleigh: [P('M3 15h2l2-7h11l1 4h2a2 2 0 0 1 0 4H3z'), P('M5 19h14'), P('M7 15v4'), P('M17 15v4'), P('M11 8V5h4')],
  // ── controls ──
  sparkle: [P('M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z'), P('M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z'), P('M5 15l.6 1.4L7 17l-1.4.6L5 19l-.6-1.4L3 17l1.4-.6L5 15z')],
  print: [P('M6 9V3h12v6'), R(3, 9, 18, 8), P('M6 14h12v7H6v-7z')],
  back: [P('M15 5l-7 7 7 7')],
  close: [L(6, 6, 18, 18), L(18, 6, 6, 18)],
  check: [P('M4 12.5l5 5L20 7')],
  lock: [R(4, 11, 16, 10, 3), P('M8 11V7a4 4 0 0 1 8 0v4'), C(12, 16, 1.2, true)],
  chevron: [P('M9 5l7 7-7 7')],
  plus: [L(12, 5, 12, 19), L(5, 12, 19, 12)],
  minus: [L(5, 12, 19, 12)],
  play: [P('M7 4l13 8-13 8V4z')],
  speaker: [P('M4 9v6h4l5 4V5L8 9H4z'), P('M16 9a4 4 0 0 1 0 6'), P('M18.5 6.5a7.5 7.5 0 0 1 0 11')],
  gift: [R(3, 10, 18, 11), P('M3 7h18v3H3z'), L(12, 7, 12, 21), P('M12 7c-2-4-6-4-6-1s4 1 6 1z'), P('M12 7c2-4 6-4 6-1s-4 1-6 1z')],
  arrowLeft: [P('M19 12H5'), P('M11 6l-6 6 6 6')],
  arrowRight: [P('M5 12h14'), P('M13 6l6 6-6 6')],
  home: [P('M3 11l9-8 9 8'), P('M5 10v10h14V10'), P('M10 20v-6h4v6')],
  info: [C(12, 12, 9), L(12, 11, 12, 16), C(12, 8, 0.9, true)],
  heart: [P('M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z')],
  timer: [C(12, 13, 8), P('M12 9v4l2.5 2'), L(9, 2, 15, 2), L(12, 2, 12, 5)],
  shuffle: [P('M3 7h4l10 10h4'), P('M3 17h4l3-3'), P('M14 7l3-0h4'), P('M18 4l3 3-3 3'), P('M18 14l3 3-3 3')],
} satisfies Record<string, readonly Shape[]>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

export const HAZARD_ICON: Record<Hazard, IconName> = {
  heat: 'flame', sharp: 'knife', 'hot-liquid': 'hotLiquid', electric: 'electric', 'small-parts': 'smallParts',
  'hot-glue': 'hotGlue', 'raw-egg': 'rawEgg', choking: 'choking', candle: 'candle',
};

export const ALLERGEN_ICON: Record<Allergen, IconName> = {
  milk: 'milk', egg: 'egg', wheat: 'wheat', gluten: 'gluten', peanut: 'peanut', 'tree-nut': 'treeNut',
  soy: 'soy', sesame: 'sesame', fish: 'fish', shellfish: 'shellfish',
};

/** An aria-hidden 24×24 stroke icon in `currentColor`; `size` sets both width and height in px. */
export function icon(name: IconName, size = 24): SVGSVGElement {
  const el = svg('svg', {
    viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor',
    'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    class: `icon icon-${name}`, 'aria-hidden': 'true', focusable: 'false',
  });
  for (const s of ICONS[name]) el.append(shape(s));
  return el;
}

function shape(s: Shape): SVGElement {
  switch (s.t) {
    case 'path': return svg('path', { d: s.d, ...(s.fill ? { fill: 'currentColor', stroke: 'none' } : {}) });
    case 'circle': return svg('circle', { cx: s.cx, cy: s.cy, r: s.r, ...(s.fill ? { fill: 'currentColor', stroke: 'none' } : {}) });
    case 'rect': return svg('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: s.rx ?? 2 });
    case 'line': return svg('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 });
  }
}
