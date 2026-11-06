/**
 * logic.ts — Fireworks Show's rules, with no DOM. The child picks a shape and a color set and taps the
 * sky; a rocket rises there and bursts. Up to 24 fireworks make a show that can be replayed. Nothing can
 * be lost. Bursts are spaced at least MIN_GAP_MS apart so nothing ever flashes faster than 2 times a second.
 */
export type ShapeId = 'burst' | 'ring' | 'heart' | 'star' | 'willow';

export interface Shape {
  readonly id: ShapeId;
  readonly name: string;
  readonly count: number;
  /** How far the sparks droop as they fall, in burst radii. */
  readonly droop: number;
  readonly lifeMs: number;
}

export const SHAPES: readonly Shape[] = [
  { id: 'burst', name: 'Burst', count: 56, droop: 0.25, lifeMs: 1500 },
  { id: 'ring', name: 'Ring', count: 40, droop: 0.15, lifeMs: 1500 },
  { id: 'heart', name: 'Heart', count: 48, droop: 0.15, lifeMs: 1600 },
  { id: 'star', name: 'Star', count: 50, droop: 0.15, lifeMs: 1600 },
  { id: 'willow', name: 'Willow', count: 48, droop: 0.8, lifeMs: 2400 },
];

export interface ColorSet {
  readonly id: string;
  readonly name: string;
  readonly colors: readonly string[];
}

export const COLOR_SETS: readonly ColorSet[] = [
  { id: 'patriot', name: 'Red, white and blue', colors: ['#ff4d5e', '#ffffff', '#5aa0ff'] },
  { id: 'gold', name: 'Gold', colors: ['#ffd24a', '#ffb347', '#fff1b8'] },
  { id: 'rainbow', name: 'Rainbow', colors: ['#ff5d6c', '#ffb347', '#ffe14a', '#5de08a', '#5aa0ff', '#b583ff'] },
  { id: 'sunset', name: 'Pink and orange', colors: ['#ff6fb5', '#ff9a4a', '#ffd0e6'] },
  { id: 'ice', name: 'Ice', colors: ['#bdeaff', '#7ccbff', '#ffffff'] },
];

export const MAX_FIREWORKS = 24;
export const MIN_GAP_MS = 600;
export const SHOW_GAP_MS = 900;
export const RISE_MS = 750;
export const SKY_TOP = 0.1;
export const SKY_BOTTOM = 0.62;
export const BURST_RADIUS = 0.2;

export interface Firework {
  readonly shape: ShapeId;
  readonly colors: string;
  /** 0–1 across the sky, 0 at the left. */
  readonly x: number;
  /** 0–1 down the sky, 0 at the top. */
  readonly y: number;
}

export interface Spark {
  readonly dx: number;
  readonly dy: number;
  readonly color: number;
}

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

export const shapeById = (id: string): Shape => SHAPES.find((s) => s.id === id) ?? SHAPES[0]!;
export const colorSetById = (id: string): ColorSet => COLOR_SETS.find((c) => c.id === id) ?? COLOR_SETS[0]!;

/** Keeps a tap inside the sky, above the skyline. */
export function skyPoint(x: number, y: number): { readonly x: number; readonly y: number } {
  return { x: clamp(x, 0.05, 0.95), y: clamp(y, SKY_TOP, SKY_BOTTOM) };
}

function outline(shape: ShapeId, t: number): { x: number; y: number } {
  const a = t * Math.PI * 2;
  if (shape === 'heart') {
    const x = 16 * Math.sin(a) ** 3;
    const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    return { x: x / 20, y: (y - 2.5) / 20 };
  }
  if (shape === 'star') {
    const seg = t * 10;
    const i = Math.floor(seg);
    const u = seg - i;
    const p = (k: number): { x: number; y: number } => {
      const r = k % 2 === 0 ? 1 : 0.42;
      const ang = (k * Math.PI) / 5 - Math.PI / 2;
      return { x: Math.cos(ang) * r, y: Math.sin(ang) * r };
    };
    const s = p(i);
    const e = p(i + 1);
    return { x: s.x + (e.x - s.x) * u, y: s.y + (e.y - s.y) * u };
  }
  return { x: Math.cos(a), y: Math.sin(a) };
}

/** Where each spark of a shape ends up, as an offset from the burst center (all within radius 1). */
export function sparks(shape: ShapeId, colorCount: number): readonly Spark[] {
  const n = shapeById(shape).count;
  const cc = Math.max(1, colorCount);
  const out: Spark[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    let p: { x: number; y: number };
    if (shape === 'burst' || shape === 'willow') {
      const a = t * Math.PI * 2;
      const r = shape === 'willow' ? 0.55 + 0.45 * ((i * 7) % 5) / 4 : 0.45 + 0.55 * ((i * 5) % 4) / 3;
      p = { x: Math.cos(a) * r, y: Math.sin(a) * r };
    } else {
      p = outline(shape, t);
    }
    out.push({ dx: p.x, dy: p.y, color: i % cc });
  }
  return out;
}

/** A spark's place and brightness `p` (0–1) of the way through a burst, in burst radii from the center. */
export function sparkAt(s: Spark, p: number, droop: number): { readonly x: number; readonly y: number; readonly alpha: number } {
  const q = clamp(p, 0, 1);
  const e = 1 - (1 - q) * (1 - q);
  return { x: s.dx * e, y: s.dy * e + droop * q * q, alpha: q < 0.15 ? 1 : 1 - (q - 0.15) / 0.85 };
}

export const emptyShow = (): readonly Firework[] => [];
export const isFull = (show: readonly Firework[]): boolean => show.length >= MAX_FIREWORKS;

export function addFirework(show: readonly Firework[], fw: Firework): readonly Firework[] {
  if (isFull(show)) return show;
  const { x, y } = skyPoint(fw.x, fw.y);
  return [...show, { shape: shapeById(fw.shape).id, colors: colorSetById(fw.colors).id, x, y }];
}

/** The show plays in the order it was made; each launch is `gap` apart, never closer than MIN_GAP_MS. */
export function showSchedule(show: readonly Firework[], gap = SHOW_GAP_MS): readonly { readonly at: number; readonly fw: Firework }[] {
  const step = Math.max(gap, MIN_GAP_MS);
  return show.slice(0, MAX_FIREWORKS).map((fw, i) => ({ at: i * step, fw }));
}

export const showLength = (show: readonly Firework[], gap = SHOW_GAP_MS): number =>
  show.length === 0 ? 0 : (show.length - 1) * Math.max(gap, MIN_GAP_MS) + RISE_MS + shapeById(show[show.length - 1]!.shape).lifeMs;

/** Moves the aim mark by arrow keys; stays in the sky. */
export function nudge(aim: { readonly x: number; readonly y: number }, key: string, step = 0.05): { readonly x: number; readonly y: number } {
  const dx = key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0;
  const dy = key === 'ArrowUp' ? -step : key === 'ArrowDown' ? step : 0;
  return skyPoint(aim.x + dx, aim.y + dy);
}
