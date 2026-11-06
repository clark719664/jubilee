/**
 * logic.ts — Present Drop's rules, with no DOM. Santa's sleigh loops across the sky at a position `x`
 * (0 to 1, left to right); a dropped present goes down the chimney under it, if there is one. Nothing is
 * timed or lost: a miss just bounces in the snow, and filling every chimney ends the round.
 */
export const CHIMNEY_X: readonly number[] = [0.1, 0.3, 0.5, 0.7, 0.9];
export const CHIMNEY_COUNT = CHIMNEY_X.length;

/** How far (as a share of the width) the sleigh may be from a chimney's middle and still score. */
export const REACH = 0.09;
/** Sleigh speed in widths per second, and the hop used when motion is calm. */
export const SPEED = 0.1;
export const CALM_STEP = 0.1;

export interface Street {
  readonly filled: readonly boolean[];
}

export type Outcome = 'in' | 'again' | 'miss';

export const newStreet = (): Street => ({ filled: CHIMNEY_X.map(() => false) });
export const count = (s: Street): number => s.filled.filter(Boolean).length;
export const isDone = (s: Street): boolean => count(s) >= CHIMNEY_COUNT;

export const wrap = (x: number): number => ((x % 1) + 1) % 1;

/** Slides the sleigh along, looping back to the left edge. */
export const advance = (x: number, seconds: number, speed = SPEED): number => wrap(x + seconds * speed);

/** The chimney a present dropped at `x` would fall into, or null. */
export function chimneyAt(x: number): number | null {
  let best: number | null = null;
  let gap = REACH + 1e-9;
  CHIMNEY_X.forEach((cx, i) => {
    const d = Math.abs(cx - x);
    if (d <= gap) { gap = d; best = i; }
  });
  return best;
}

/** Drops a present at `x`. A chimney that already has one just lets the present bounce, like a miss. */
export function drop(s: Street, x: number): { readonly street: Street; readonly outcome: Outcome; readonly index: number | null } {
  const index = chimneyAt(x);
  if (index === null) return { street: s, outcome: 'miss', index: null };
  if (s.filled[index]) return { street: s, outcome: 'again', index };
  return { street: { filled: s.filled.map((f, i) => f || i === index) }, outcome: 'in', index };
}

export const IN_LINES: readonly string[] = ['Down it goes!', 'Right in the chimney!', 'Hooray, a light is on!', 'What a great drop!'];
export const MISS_LINES: readonly string[] = ['Boing! Soft snow.', 'Plop! Try again.', 'Missed the chimney. That’s okay!'];
export const AGAIN_LINES: readonly string[] = ['That house already has one!', 'This chimney is all set.'];
