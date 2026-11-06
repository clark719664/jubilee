/** art.ts — the geometric egg: five curved bands clipped to an egg shape. Ids are unique per egg. */
import { svg } from '../../ui/dom';
import { BAND_COUNT, COLORS, PATTERNS, type Egg } from './logic';

export const EGG_W = 200;
export const EGG_H = 262;
export const EGG_PATH = 'M100 8 C152 8 188 100 188 164 C188 224 150 254 100 254 C50 254 12 224 12 164 C12 100 48 8 100 8 Z';
export const CREAM = '#fffaf0';
const INK = '#1f1a3d';
const SAG = 14;
const EDGES = [0, 62, 108, 154, 200, EGG_H] as const;

let uid = 0;
export const nextEggId = (): string => `egg${++uid}`;

const edge = (y: number): string => `M-10 ${y} Q100 ${y + (y === 0 || y === EGG_H ? 0 : SAG * 2)} 210 ${y}`;

export function bandPath(i: number): string {
  const top = EDGES[i]!;
  const bot = EDGES[i + 1]!;
  const lower = bot === EGG_H ? `L210 ${bot} L-10 ${bot}` : `L210 ${bot} Q100 ${bot + SAG * 2} -10 ${bot}`;
  return `${edge(top)} ${lower} Z`;
}

const star = (cx: number, cy: number, r: number): string => {
  const pts: string[] = [];
  for (let k = 0; k < 10; k++) {
    const a = (Math.PI / 5) * k - Math.PI / 2;
    const rr = k % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return pts.join(' ');
};

/** Pattern marks inside the box, in `color`; `s` scales spacing and size (the swatches are small). */
export function motifs(pattern: string, color: string, x0: number, y0: number, x1: number, y1: number, s = 1): SVGElement[] {
  const out: SVGElement[] = [];
  const mid = (y0 + y1) / 2;
  if (pattern === 'stripes') {
    for (let x = x0 + 4 * s; x < x1; x += 24 * s) out.push(svg('rect', { x, y: y0, width: 11 * s, height: y1 - y0, fill: color }));
  } else if (pattern === 'dots') {
    let row = 0;
    for (let y = y0 + 8 * s; y < y1 + 8 * s; y += 18 * s, row++) {
      for (let x = x0 + (row % 2 ? 20 : 9) * s; x < x1; x += 22 * s) out.push(svg('circle', { cx: x, cy: y, r: 5 * s, fill: color }));
    }
  } else if (pattern === 'zigzag') {
    const pts: string[] = [];
    let up = false;
    for (let x = x0 - 8 * s; x < x1 + 16 * s; x += 14 * s, up = !up) pts.push(`${x},${mid + (up ? -11 : 11) * s}`);
    out.push(svg('polyline', { points: pts.join(' '), fill: 'none', stroke: color, 'stroke-width': 6 * s, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  } else if (pattern === 'stars') {
    for (let x = x0 + 14 * s, k = 0; x < x1 + 10 * s; x += 28 * s, k++) out.push(svg('polygon', { points: star(x, mid + (k % 2 ? 8 : -8) * s, 11 * s), fill: color }));
  }
  return out;
}

export interface EggArt {
  readonly svg: SVGSVGElement;
  /** The clickable/focusable band shapes (interactive eggs only), top to bottom. */
  readonly hits: readonly SVGPathElement[];
}

/** The whole egg. `idBase` must be unique per rendered egg, because clip-path ids are document-wide. */
export function eggSvg(egg: Egg, idBase: string, cls: string, interactive = false): EggArt {
  const root = svg('svg', { class: cls, viewBox: `0 0 ${EGG_W} ${EGG_H}`, focusable: 'false', ...(interactive ? {} : { 'aria-hidden': 'true' }) });
  const defs = svg('defs', {}, svg('clipPath', { id: `${idBase}-egg` }, svg('path', { d: EGG_PATH })));
  const clipped = svg('g', { 'clip-path': `url(#${idBase}-egg)` }, svg('rect', { x: 0, y: 0, width: EGG_W, height: EGG_H, fill: CREAM }));
  root.append(defs, clipped);
  const hits: SVGPathElement[] = [];
  for (let i = 0; i < BAND_COUNT; i++) {
    const b = egg[i];
    if (b) {
      const color = COLORS[b.color]!.hex;
      const pattern = PATTERNS[b.pattern]!.id;
      const clipId = `${idBase}-b${i}`;
      defs.append(svg('clipPath', { id: clipId }, svg('path', { d: bandPath(i) })));
      const g = svg('g', { class: 'eg-painted', 'clip-path': `url(#${clipId})` });
      g.append(svg('rect', { x: 0, y: EDGES[i]!, width: EGG_W, height: EDGES[i + 1]! - EDGES[i]! + SAG * 2, fill: pattern === 'plain' ? color : CREAM }));
      g.append(...motifs(pattern, color, 0, EDGES[i]!, EGG_W, EDGES[i + 1]! + SAG));
      clipped.append(g);
    }
    if (interactive) {
      const hit = svg('path', { d: bandPath(i), class: 'eg-hit', 'clip-path': `url(#${idBase}-egg)`, role: 'button', tabindex: 0, fill: 'transparent' });
      hits.push(hit);
      clipped.append(hit);
    }
  }
  for (let i = 1; i < BAND_COUNT; i++) {
    clipped.append(svg('path', { d: edge(EDGES[i]!), fill: 'none', stroke: INK, 'stroke-opacity': 0.35, 'stroke-width': 2, 'pointer-events': 'none' }));
  }
  root.append(svg('path', { d: EGG_PATH, fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round', 'pointer-events': 'none' }));
  return { svg: root, hits };
}
