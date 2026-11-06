/**
 * logic.ts — Egg Painter's rules, with no DOM. An egg has five bands; each is empty or painted with a
 * color and a pattern. Painting is never wrong, Undo steps back, Surprise paints every band, and a
 * finished egg goes into the basket (the last six are kept). Nothing can be lost.
 */
export const BAND_COUNT = 5;
export const BASKET_MAX = 6;
export const UNDO_MAX = 40;

export interface Swatch {
  readonly id: string;
  readonly name: string;
  readonly hex: string;
}

export const COLORS: readonly Swatch[] = [
  { id: 'red', name: 'red', hex: '#e03a45' }, { id: 'orange', name: 'orange', hex: '#f0872a' },
  { id: 'yellow', name: 'yellow', hex: '#f7c60f' }, { id: 'green', name: 'green', hex: '#3f9f4d' },
  { id: 'teal', name: 'teal', hex: '#17a99b' }, { id: 'blue', name: 'blue', hex: '#2f7be0' },
  { id: 'purple', name: 'purple', hex: '#8d56c8' }, { id: 'pink', name: 'pink', hex: '#f26aa8' },
];

export const PATTERNS: readonly Swatch[] = [
  { id: 'plain', name: 'plain', hex: '' }, { id: 'stripes', name: 'stripes', hex: '' }, { id: 'dots', name: 'dots', hex: '' },
  { id: 'zigzag', name: 'zigzag', hex: '' }, { id: 'stars', name: 'stars', hex: '' },
];

export interface Band {
  readonly color: number;
  readonly pattern: number;
}

export type Egg = readonly (Band | null)[];

export interface Painter {
  readonly egg: Egg;
  readonly undo: readonly Egg[];
  readonly basket: readonly Egg[];
}

export const newEgg = (): Egg => Array.from({ length: BAND_COUNT }, () => null);
export const newPainter = (): Painter => ({ egg: newEgg(), undo: [], basket: [] });
export const isEmpty = (egg: Egg): boolean => egg.every((b) => b === null);
export const paintedCount = (egg: Egg): number => egg.filter((b) => b !== null).length;
export const sameBand = (a: Band | null, b: Band | null): boolean => (a === null || b === null ? a === b : a.color === b.color && a.pattern === b.pattern);

function pushUndo(p: Painter): readonly Egg[] {
  return [...p.undo, p.egg].slice(-UNDO_MAX);
}

/** Paints band `i`. Painting a band the way it already is changes nothing and adds no Undo step. */
export function paint(p: Painter, i: number, band: Band): Painter {
  if (i < 0 || i >= BAND_COUNT || sameBand(p.egg[i] ?? null, band)) return p;
  return { ...p, egg: p.egg.map((b, k) => (k === i ? band : b)), undo: pushUndo(p) };
}

export function undo(p: Painter): Painter {
  const prev = p.undo[p.undo.length - 1];
  return prev ? { ...p, egg: prev, undo: p.undo.slice(0, -1) } : p;
}

/** Fills every band at random; neighboring bands never share a color, so it always looks lively. */
export function surprise(p: Painter, rand: () => number): Painter {
  const bands: Band[] = [];
  let last = -1;
  for (let i = 0; i < BAND_COUNT; i++) {
    let color = Math.floor(rand() * COLORS.length) % COLORS.length;
    if (color === last) color = (color + 1) % COLORS.length;
    last = color;
    bands.push({ color, pattern: Math.floor(rand() * PATTERNS.length) % PATTERNS.length });
  }
  return { ...p, egg: bands, undo: pushUndo(p) };
}

/** Puts the egg in the basket and starts a fresh one; the oldest egg makes room after six. */
export function toBasket(p: Painter): Painter {
  if (isEmpty(p.egg)) return p;
  return { egg: newEgg(), undo: [], basket: [...p.basket, p.egg].slice(-BASKET_MAX) };
}
