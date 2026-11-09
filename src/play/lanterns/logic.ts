/**
 * logic.ts — Lantern Lights' rules, with no DOM. The lanterns glow a short pattern and the child taps it
 * back. The pattern starts at two and grows by one after each right round, up to eight. A wrong tap only
 * replays the same pattern: nothing is lost, timed or scored.
 */
import { visible } from '../../i18n/index';

export const START_LENGTH = 2;
export const MAX_LENGTH = 8;
export const EASY_LANTERNS = 4;
export const HARD_LANTERNS = 6;

/** Each glow holds at least this long, then a gap, so nothing flashes above 3 Hz. */
export const GLOW_MS = 600;
export const GAP_MS = 300;

export interface Game {
  readonly lanterns: number;
  /** The whole pattern for the game, so a replay is always the same pattern. */
  readonly seq: readonly number[];
  /** Pattern length for this round. */
  readonly length: number;
  /** How many taps of this round are right so far. */
  readonly pos: number;
}

export type TapResult = 'ok' | 'round' | 'win' | 'wrong';

/** A pattern of `n` lantern indexes where no lantern glows twice in a row. */
export function makeSequence(rand: () => number, lanterns: number, n = MAX_LENGTH): number[] {
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    if (lanterns <= 1) { out.push(0); continue; }
    const last = out[k - 1];
    const pool: number[] = [];
    for (let i = 0; i < lanterns; i++) if (i !== last) pool.push(i);
    out.push(pool[Math.floor(rand() * pool.length) % pool.length]!);
  }
  return out;
}

export function newGame(rand: () => number, lanterns: number): Game {
  return { lanterns, seq: makeSequence(rand, lanterns), length: START_LENGTH, pos: 0 };
}

/** The lanterns to glow this round, in order. */
export const shown = (g: Game): readonly number[] => g.seq.slice(0, g.length);

export function tap(g: Game, i: number): { readonly game: Game; readonly result: TapResult } {
  if (g.seq[g.pos] !== i) return { game: { ...g, pos: 0 }, result: 'wrong' };
  const pos = g.pos + 1;
  if (pos < g.length) return { game: { ...g, pos }, result: 'ok' };
  if (g.length >= MAX_LENGTH) return { game: { ...g, pos: 0 }, result: 'win' };
  return { game: { ...g, length: g.length + 1, pos: 0 }, result: 'round' };
}

/** Pattern lengths run START_LENGTH..MAX_LENGTH, so this is how many rounds a game has. */
export const ROUNDS = MAX_LENGTH - START_LENGTH + 1;
export const roundOf = (g: Game): number => g.length - START_LENGTH + 1;

export const LANTERN_COLORS: readonly { readonly id: string; readonly name: string; readonly body: string; readonly lit: string }[] = visible([
  { id: 'red', name: 'red', body: '#c2334d', lit: '#ff8aa0' },
  { id: 'gold', name: 'gold', body: '#d99a1a', lit: '#ffe27a' },
  { id: 'green', name: 'green', body: '#1f9a6b', lit: '#8cf5c4' },
  { id: 'blue', name: 'blue', body: '#2f6fd0', lit: '#9cc7ff' },
  { id: 'purple', name: 'purple', body: '#7a48b8', lit: '#d3b0ff' },
  { id: 'orange', name: 'orange', body: '#e0672a', lit: '#ffb98a' },
]);
