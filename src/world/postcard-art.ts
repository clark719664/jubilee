/**
 * The drawing kit behind the tracker postcards: a palette set by local time, a seeded random
 * source, and small shape helpers (blocks of lit windows, palms, spruces, hills, water) that the
 * city skylines in postcard-skylines.ts are built from. Everything draws into a 560 × 320 picture
 * whose ground line is y 262; the card frame, text and postmark live in postcards.ts.
 *
 * Style (docs/ART.md): chunky rounded shapes, three planes (hazy far, crisp mid, darkest front),
 * one light story (night: warm windows and floodlit landmarks under a cool sky).
 */
import { svg } from '../ui/dom';

export const PIC_W = 560;
export const PIC_H = 320;
/** Where the land (or the water's edge) starts. */
export const GY = 262;

export interface Palette {
  /** 0 = full day, 1 = deep night. */
  readonly night: number;
  readonly skyTop: string;
  readonly skyBottom: string;
  /** Warm city glow along the horizon. */
  readonly glow: string;
  readonly far: string;
  readonly far2: string;
  readonly mid: string;
  readonly mid2: string;
  readonly near: string;
  readonly win: string;
  readonly winOff: string;
  readonly water: string;
  readonly water2: string;
  readonly ground: string;
  readonly snow: string;
  readonly snowShade: string;
  readonly starAlpha: number;
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Per-channel blend of two #rrggbb colors. */
export function mix(a: string, b: string, t: number): string {
  const x = hex(a);
  const y = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * k).toString(16).padStart(2, '0')).join('')}`;
}

const DAY = {
  skyTop: '#5fb4f0', skyBottom: '#d6f0ff', glow: '#fff1c9', far: '#a9c7e8', far2: '#90b3dc', mid: '#6d86bd', mid2: '#5b74ad',
  near: '#3d4f86', win: '#cfe4ff', winOff: '#a9c3e8', water: '#5aa6dc', water2: '#3f86c4', ground: '#6fa86a', snow: '#f7fbff', snowShade: '#cfdcf2',
};
const DUSK = {
  skyTop: '#3d3f93', skyBottom: '#f6a07a', glow: '#ffc27a', far: '#8a6fa8', far2: '#76609c', mid: '#4d4a86', mid2: '#433f7a',
  near: '#2a2858', win: '#ffd98a', winOff: '#8f84b8', water: '#5a5598', water2: '#3e3a7c', ground: '#4c5a6e', snow: '#f3e9f5', snowShade: '#c9b9da',
};
const NIGHT = {
  skyTop: '#0b1038', skyBottom: '#4a3f8c', glow: '#f2a46a', far: '#3a3d85', far2: '#33357a', mid: '#23275e', mid2: '#2b3070',
  near: '#14173a', win: '#ffd98a', winOff: '#3a3f7c', water: '#1d2460', water2: '#10153f', ground: '#1d2148', snow: '#e6eeff', snowShade: '#aebbe6',
};

/** How dark the sky is at a local hour (0–24, fractional): 1 from 20:30 to 05:00, 0 from 08:00 to 17:00. */
export function nightness(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  if (h < 5 || h >= 20.5) return 1;
  if (h < 8) return 1 - (h - 5) / 3;
  if (h < 17) return 0;
  return (h - 17) / 3.5;
}

/** The palette for a local hour: night ↔ dusk ↔ day. */
export function paletteFor(hour: number): Palette {
  const k = nightness(hour);
  // 0 → day, 0.5 → dusk, 1 → night.
  const pick = (key: keyof typeof DAY): string => (k <= 0.5 ? mix(DAY[key], DUSK[key], k * 2) : mix(DUSK[key], NIGHT[key], (k - 0.5) * 2));
  return {
    night: k,
    skyTop: pick('skyTop'), skyBottom: pick('skyBottom'), glow: pick('glow'), far: pick('far'), far2: pick('far2'),
    mid: pick('mid'), mid2: pick('mid2'), near: pick('near'), win: pick('win'), winOff: pick('winOff'),
    water: pick('water'), water2: pick('water2'), ground: pick('ground'), snow: pick('snow'), snowShade: pick('snowShade'),
    starAlpha: Math.max(0, (k - 0.55) / 0.45),
  };
}

/** Small seeded RNG (mulberry32) so every card draws the same way every time. */
export function seeded(seed: string): () => number {
  let a = 2166136261;
  for (let i = 0; i < seed.length; i++) a = Math.imul(a ^ seed.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Art {
  /** The group shapes are appended to. */
  g: SVGGElement;
  readonly defs: SVGDefsElement;
  /** Prefix for gradient ids (unique per card on the page). */
  readonly uid: string;
  readonly pal: Palette;
  readonly rnd: () => number;
  readonly snowy: boolean;
}

type Attrs = Record<string, string | number>;

const r1 = (v: number): number => Math.round(v * 10) / 10;

export function add<K extends keyof SVGElementTagNameMap>(a: Art, tag: K, attrs: Attrs): SVGElementTagNameMap[K] {
  const el = svg(tag, attrs);
  a.g.append(el);
  return el;
}

export function P(a: Art, d: string, fill: string, extra: Attrs = {}): SVGPathElement {
  return add(a, 'path', { d, fill, ...extra });
}

export function R(a: Art, x: number, y: number, w: number, h: number, fill: string, rx = 0, extra: Attrs = {}): SVGRectElement {
  return add(a, 'rect', { x: r1(x), y: r1(y), width: r1(w), height: r1(h), ...(rx ? { rx } : {}), fill, ...extra });
}

export function C(a: Art, cx: number, cy: number, r: number, fill: string, extra: Attrs = {}): SVGCircleElement {
  return add(a, 'circle', { cx: r1(cx), cy: r1(cy), r: r1(r), fill, ...extra });
}

export function E(a: Art, cx: number, cy: number, rx: number, ry: number, fill: string, extra: Attrs = {}): SVGEllipseElement {
  return add(a, 'ellipse', { cx: r1(cx), cy: r1(cy), rx: r1(rx), ry: r1(ry), fill, ...extra });
}

/** A stroked line or curve with round caps and joins. */
export function L(a: Art, d: string, stroke: string, width: number, extra: Attrs = {}): SVGPathElement {
  return add(a, 'path', { d, fill: 'none', stroke, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra });
}

/** Starts a nested group (returns a function that restores the previous one). */
export function group(a: Art, attrs: Attrs = {}): () => void {
  const prev = a.g;
  const g = svg('g', attrs);
  prev.append(g);
  a.g = g;
  return () => { a.g = prev; };
}

export function linear(a: Art, name: string, stops: readonly [number, string, number?][], vertical = true): string {
  const id = `${a.uid}-${name}`;
  const grad = svg('linearGradient', vertical ? { id, x1: 0, y1: 0, x2: 0, y2: 1 } : { id, x1: 0, y1: 0, x2: 1, y2: 0 });
  for (const [o, c, op] of stops) grad.append(svg('stop', { offset: o, 'stop-color': c, ...(op !== undefined ? { 'stop-opacity': op } : {}) }));
  a.defs.append(grad);
  return `url(#${id})`;
}

export function radial(a: Art, name: string, stops: readonly [number, string, number?][]): string {
  const id = `${a.uid}-${name}`;
  const grad = svg('radialGradient', { id, cx: 0.5, cy: 0.5, r: 0.5 });
  for (const [o, c, op] of stops) grad.append(svg('stop', { offset: o, 'stop-color': c, ...(op !== undefined ? { 'stop-opacity': op } : {}) }));
  a.defs.append(grad);
  return `url(#${id})`;
}

/** A landmark's own color as it looks at this hour: slightly sunk into the night and warmed by floodlights. */
export function lm(a: Art, c: string): string {
  const k = a.pal.night;
  return mix(mix(c, '#1b1f4a', 0.22 * k), '#ffd59a', 0.1 * k);
}

/** Whether a window is lit (most are at night, none by day). */
function lit(a: Art): boolean {
  return a.rnd() < 0.15 + 0.6 * a.pal.night;
}

/** A grid of windows on a facade: `cols` × `rows` inside the box, with margins. */
export function windows(a: Art, x: number, y: number, w: number, h: number, cols: number, rows: number, opts: { size?: number; tall?: number } = {}): void {
  const ww = opts.size ?? Math.max(3, Math.min(7, (w / cols) * 0.42));
  const wh = opts.tall ?? ww * 1.35;
  const gx = w / cols;
  const gy = h / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const on = lit(a);
      R(a, x + gx * i + (gx - ww) / 2, y + gy * j + (gy - wh) / 2, ww, wh, on ? a.pal.win : a.pal.winOff, 1, on ? {} : { opacity: 0.7 });
    }
  }
}

/** A plain block building with windows and an optional cap, standing on `base`. */
export function block(a: Art, x: number, base: number, w: number, h: number, fill: string, opts: { win?: boolean; cap?: 'flat' | 'ledge' | 'antenna' | 'slope' } = {}): void {
  const top = base - h;
  R(a, x, top, w, h + 2, fill, 2);
  if (opts.cap === 'ledge') R(a, x - 2, top - 3, w + 4, 5, fill, 2);
  if (opts.cap === 'antenna') L(a, `M${r1(x + w / 2)} ${r1(top)}V${r1(top - 14)}`, fill, 2.5);
  if (opts.cap === 'slope') P(a, `M${r1(x)} ${r1(top + 1)}L${r1(x + w)} ${r1(top - w * 0.35)}V${r1(top + 1)}Z`, fill);
  if (opts.win !== false && w >= 12 && h >= 16) {
    const cols = Math.max(1, Math.round(w / 9));
    const rows = Math.max(1, Math.round((h - 8) / 11));
    windows(a, x + 3, top + 5, w - 6, h - 10, cols, rows);
  }
  if (a.snowy && opts.cap !== 'slope') R(a, x - 1.5, top - 2.5, w + 3, 5, a.pal.snow, 2.5);
}

/** A row of generic buildings filling x0…x1 (heights between hMin and hMax). */
export function blocks(a: Art, x0: number, x1: number, base: number, hMin: number, hMax: number, fill: string, opts: { win?: boolean; gap?: number; wMin?: number; wMax?: number } = {}): void {
  let x = x0;
  const caps = ['flat', 'ledge', 'flat', 'antenna', 'flat'] as const;
  while (x < x1) {
    const w = Math.min(x1 - x, (opts.wMin ?? 16) + a.rnd() * ((opts.wMax ?? 36) - (opts.wMin ?? 16)));
    if (w < 8) break;
    const h = hMin + a.rnd() * (hMax - hMin);
    block(a, x, base, w, h, fill, { win: opts.win ?? true, cap: caps[Math.floor(a.rnd() * caps.length)]! });
    x += w + (opts.gap ?? 1);
  }
}

/** A smooth ridge through points, closed down to the bottom of the picture. */
export function hills(a: Art, pts: readonly [number, number][], fill: string, extra: Attrs = {}): SVGPathElement {
  const first = pts[0]!;
  let d = `M${first[0]} ${PIC_H + 4}L${first[0]} ${first[1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!;
    const q = pts[i + 1]!;
    d += `Q${p[0]} ${p[1]} ${r1((p[0] + q[0]) / 2)} ${r1((p[1] + q[1]) / 2)}`;
  }
  const last = pts[pts.length - 1]!;
  d += `L${last[0]} ${last[1]}L${last[0]} ${PIC_H + 4}Z`;
  return P(a, d, fill, extra);
}

/** Water from `y` to the bottom, with soft light reflections at night. */
export function water(a: Art, y: number, reflect: readonly number[] = []): void {
  R(a, -4, y, PIC_W + 8, PIC_H - y + 6, linear(a, `water${Math.round(y)}`, [[0, a.pal.water], [1, a.pal.water2]]));
  // A thin bright edge where the water meets the land.
  R(a, -4, y, PIC_W + 8, 2.5, mix(a.pal.water, '#ffffff', 0.18), 0, { opacity: 0.8 });
  for (const x of reflect) {
    for (let i = 0; i < 4; i++) {
      const yy = y + 8 + i * 9 + a.rnd() * 3;
      const w = 18 - i * 3 + a.rnd() * 6;
      R(a, x - w / 2 + (a.rnd() - 0.5) * 6, yy, w, 3, a.pal.win, 1.5, { opacity: r1(0.55 - i * 0.1) });
    }
  }
  // Gentle wave dashes.
  for (let i = 0; i < 14; i++) {
    const wx = a.rnd() * PIC_W;
    const wy = y + 10 + a.rnd() * (PIC_H - y - 14);
    L(a, `M${r1(wx)} ${r1(wy)}h${r1(8 + a.rnd() * 10)}`, mix(a.pal.water, '#ffffff', 0.22), 2.5, { opacity: 0.45 });
  }
}

/** Flat ground from `y` to the bottom (snowy when it is a snowy city). */
export function ground(a: Art, y: number, fill?: string): void {
  const f = fill ?? (a.snowy ? a.pal.snow : a.pal.ground);
  R(a, -4, y, PIC_W + 8, PIC_H - y + 6, f);
  if (a.snowy && !fill) R(a, -4, y, PIC_W + 8, 4, a.pal.snowShade, 0, { opacity: 0.6 });
}

/** A coconut palm: curved trunk and drooping fronds, base at (x, base). */
export function palm(a: Art, x: number, base: number, h: number, lean: number, fill: string): void {
  const tx = x + lean;
  const ty = base - h;
  L(a, `M${r1(x)} ${r1(base)}Q${r1(x + lean * 0.15)} ${r1(base - h * 0.55)} ${r1(tx)} ${r1(ty)}`, fill, Math.max(4, h * 0.05));
  const fronds: [number, number][] = [[-1, 0.35], [-0.75, -0.2], [-0.25, -0.5], [0.3, -0.5], [0.8, -0.15], [1, 0.4]];
  const s = h * 0.36;
  for (const [dx, dy] of fronds) {
    const ex = tx + dx * s;
    const ey = ty + dy * s * 0.6 + s * 0.35;
    const cx = tx + dx * s * 0.55;
    const cy = ty + dy * s * 0.9 - s * 0.12;
    // A leaf: a fat curved blade from the crown to its tip.
    P(a, `M${r1(tx)} ${r1(ty)}Q${r1(cx)} ${r1(cy - 5)} ${r1(ex)} ${r1(ey)}Q${r1(cx)} ${r1(cy + 4)} ${r1(tx)} ${r1(ty + 3)}Z`, fill);
  }
  C(a, tx, ty + 2, Math.max(2.5, h * 0.035), fill);
}

/** A spruce (snowy when the city is): stacked rounded tiers. */
export function spruce(a: Art, x: number, base: number, h: number, fill: string): void {
  R(a, x - 2.5, base - h * 0.16, 5, h * 0.16 + 2, mix(fill, '#000000', 0.25), 1.5);
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const tb = base - h * 0.12 - i * h * 0.26;
    const tw = (h * 0.42) * (1 - i * 0.24);
    const tt = tb - h * 0.42;
    P(a, `M${r1(x - tw)} ${r1(tb)}Q${r1(x)} ${r1(tb + 4)} ${r1(x + tw)} ${r1(tb)}L${r1(x + 2)} ${r1(tt + 2)}Q${r1(x)} ${r1(tt - 1)} ${r1(x - 2)} ${r1(tt + 2)}Z`, fill);
    if (a.snowy) P(a, `M${r1(x - tw * 0.55)} ${r1(tt + (tb - tt) * 0.55)}L${r1(x)} ${r1(tt + 2)}L${r1(x + tw * 0.55)} ${r1(tt + (tb - tt) * 0.55)}Q${r1(x)} ${r1(tt + (tb - tt) * 0.38)} ${r1(x - tw * 0.55)} ${r1(tt + (tb - tt) * 0.55)}Z`, a.pal.snow, { opacity: 0.9 });
  }
}

/** A round-crowned tree on a short trunk. */
export function roundTree(a: Art, x: number, base: number, r: number, fill: string, trunk?: string): void {
  R(a, x - 2.5, base - r * 1.2, 5, r * 1.2 + 1, trunk ?? mix(fill, '#000000', 0.3), 1.5);
  C(a, x, base - r * 1.5, r, fill);
  C(a, x - r * 0.6, base - r * 1.2, r * 0.7, fill);
  C(a, x + r * 0.62, base - r * 1.15, r * 0.66, fill);
}

/** Bright night stars (seeded). Skips the box the moon sits in. */
export function stars(a: Art, n: number, avoid: { x: number; y: number; r: number } | null): void {
  if (a.pal.starAlpha <= 0) return;
  for (let i = 0; i < n; i++) {
    const x = 10 + a.rnd() * (PIC_W - 20);
    const y = 8 + a.rnd() * 150;
    if (avoid && Math.hypot(x - avoid.x, y - avoid.y) < avoid.r) continue;
    const big = a.rnd() < 0.18;
    if (big) {
      // A four-point twinkle with arms that taper to nothing.
      const s = 5 + a.rnd() * 2;
      P(a, `M${r1(x)} ${r1(y - s)}Q${r1(x + 1)} ${r1(y - 1)} ${r1(x + s)} ${r1(y)}Q${r1(x + 1)} ${r1(y + 1)} ${r1(x)} ${r1(y + s)}Q${r1(x - 1)} ${r1(y + 1)} ${r1(x - s)} ${r1(y)}Q${r1(x - 1)} ${r1(y - 1)} ${r1(x)} ${r1(y - s)}Z`, '#fff6d8', { opacity: r1(0.95 * a.pal.starAlpha) });
    } else {
      C(a, x, y, 1.3 + a.rnd() * 1.1, '#fff6d8', { opacity: r1((0.45 + a.rnd() * 0.5) * a.pal.starAlpha) });
    }
  }
}

/** Falling snow over the whole picture. */
export function snowfall(a: Art, n: number): void {
  for (let i = 0; i < n; i++) {
    C(a, a.rnd() * PIC_W, a.rnd() * PIC_H, 1.6 + a.rnd() * 1.6, '#ffffff', { opacity: r1(0.55 + a.rnd() * 0.4) });
  }
}

/** A string of lights or lanterns hung between two anchor points (a quadratic that sags by `sag`). */
export function swag(a: Art, x0: number, y0: number, x1: number, y1: number, sag: number, color: string, n: number, bulb: (x: number, y: number) => void): void {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2 + 2 * sag;
  L(a, `M${r1(x0)} ${r1(y0)}Q${r1(cx)} ${r1(cy)} ${r1(x1)} ${r1(y1)}`, color, 2);
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    bulb(x, y);
  }
}

/** A soft round glow (radial gradient that reaches zero at its edge). */
export function glowAt(a: Art, name: string, cx: number, cy: number, rx: number, ry: number, color: string, alpha = 0.55): void {
  E(a, cx, cy, rx, ry, radial(a, name, [[0, color, alpha], [0.35, color, alpha * 0.4], [1, color, 0]]));
}

/** Street lamps standing on the ground line `base`: a post, a warm lamp, its halo and a pool of light. */
export function lamps(a: Art, xs: readonly number[], base: number, h = 34): void {
  const post = mix(a.pal.near, '#000000', 0.25);
  for (const x of xs) {
    E(a, x, base + 2, 22, 5, a.pal.win, { opacity: r1(0.18 + 0.3 * a.pal.night) });
    glowAt(a, `lamp${Math.round(x)}`, x, base - h, 18, 18, '#ffd98a', 0.25 + 0.45 * a.pal.night);
    L(a, `M${x} ${base + 1}V${base - h + 4}`, post, 3);
    R(a, x - 5, base - h - 3, 10, 9, a.pal.win, 4);
    R(a, x - 6, base - h - 5, 12, 3.5, post, 1.5);
  }
}
