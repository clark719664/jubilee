/**
 * game.ts — the Sticker Memory rules as an immutable little state machine (pure, tested in Node).
 *
 * Flip one card, flip another: the same sticker stays face up as a pair; two different stickers wait
 * face up for a moment (the view decides how long) and then turn back over. Tapping a third card while
 * two are waiting turns them back straight away, so an eager finger is never ignored. There is no
 * score against the child: `flips` is only shown when a big kid asks to count them, and nothing is lost.
 */
export interface GameState {
  /** Pair key per board position. */
  readonly keys: readonly string[];
  /** Face-up positions that are not matched yet (0, 1 or 2). */
  readonly up: readonly number[];
  readonly matched: readonly boolean[];
  /** Positions the child has seen at least once (for gentle hints). */
  readonly seen: readonly boolean[];
  /** Cards turned face up so far. */
  readonly flips: number;
  readonly pairsFound: number;
  readonly pairs: number;
}

export type FlipResult =
  | { readonly kind: 'ignored' }
  | { readonly kind: 'first'; readonly index: number }
  | { readonly kind: 'match'; readonly a: number; readonly b: number; readonly won: boolean }
  | { readonly kind: 'miss'; readonly a: number; readonly b: number };

export interface FlipOutcome {
  readonly state: GameState;
  readonly result: FlipResult;
  /** Cards a waiting miss turned back over before this flip. */
  readonly turnedDown: readonly number[];
}

export function newGame(keys: readonly string[]): GameState {
  const n = keys.length;
  return {
    keys: keys.slice(),
    up: [],
    matched: new Array<boolean>(n).fill(false),
    seen: new Array<boolean>(n).fill(false),
    flips: 0,
    pairsFound: 0,
    pairs: Math.floor(n / 2),
  };
}

export function isFaceUp(s: GameState, i: number): boolean {
  return s.matched[i] === true || s.up.includes(i);
}

export function isWon(s: GameState): boolean {
  return s.pairs > 0 && s.pairsFound === s.pairs;
}

/** True while a miss is showing (two different stickers face up). */
export function isWaiting(s: GameState): boolean {
  return s.up.length === 2;
}

/** Turns a waiting miss back over. */
export function settle(s: GameState): GameState {
  return s.up.length === 0 ? s : { ...s, up: [] };
}

export function flip(s0: GameState, i: number): FlipOutcome {
  const turnedDown = isWaiting(s0) ? s0.up.slice() : [];
  const s = isWaiting(s0) ? settle(s0) : s0;
  if (i < 0 || i >= s.keys.length || isFaceUp(s, i)) {
    return { state: s, result: { kind: 'ignored' }, turnedDown };
  }
  const seen = s.seen.map((v, k) => v || k === i);
  const flips = s.flips + 1;
  const first = s.up[0];
  if (first === undefined) {
    return { state: { ...s, up: [i], seen, flips }, result: { kind: 'first', index: i }, turnedDown };
  }
  if (s.keys[first] === s.keys[i]) {
    const matched = s.matched.map((v, k) => v || k === i || k === first);
    const pairsFound = s.pairsFound + 1;
    const state: GameState = { ...s, up: [], matched, seen, flips, pairsFound };
    return { state, result: { kind: 'match', a: first, b: i, won: pairsFound === s.pairs }, turnedDown };
  }
  return { state: { ...s, up: [first, i], seen, flips }, result: { kind: 'miss', a: first, b: i }, turnedDown };
}

/**
 * A gentle hint: the two positions of one unmatched pair, preferring a pair the child has already
 * glimpsed half of (so the hint helps them remember rather than just giving the answer away), and the
 * partner of a card that is face up right now above all. Null when everything is matched.
 */
export function hintPair(s: GameState): readonly [number, number] | null {
  const open = s.up.length === 1 ? s.up[0] : undefined;
  const groups = new Map<string, number[]>();
  s.keys.forEach((k, idx) => {
    if (s.matched[idx]) return;
    const g = groups.get(k);
    if (g) g.push(idx); else groups.set(k, [idx]);
  });
  let best: readonly [number, number] | null = null;
  let bestScore = -1;
  for (const g of groups.values()) {
    const a = g[0];
    const b = g[1];
    if (a === undefined || b === undefined) continue;
    const score = (open === a || open === b ? 10 : 0) + (s.seen[a] ? 1 : 0) + (s.seen[b] ? 1 : 0);
    if (score > bestScore) { best = [a, b]; bestScore = score; }
  }
  return best;
}

/** Next focus position for an arrow key on a cols-wide grid (stays put at the edges; Home/End jump). */
export function moveFocus(index: number, key: string, cols: number, count: number): number {
  const row = Math.floor(index / cols);
  switch (key) {
    case 'ArrowLeft': return index % cols === 0 ? index : index - 1;
    case 'ArrowRight': return index % cols === cols - 1 || index + 1 >= count ? index : index + 1;
    case 'ArrowUp': return row === 0 ? index : index - cols;
    case 'ArrowDown': return index + cols >= count ? index : index + cols;
    case 'Home': return row * cols;
    case 'End': return Math.min(count - 1, row * cols + cols - 1);
    case 'PageUp': return index % cols;
    case 'PageDown': { const last = count - 1; const col = index % cols; return last - ((last % cols) - col + cols) % cols; }
    default: return index;
  }
}
