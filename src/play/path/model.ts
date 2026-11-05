/**
 * model.ts — the little language Jubi understands, and the interpreter that walks it.
 *
 * A program is a flat list of cards (tokens), exactly what the child sees in the strip: a repeat card
 * opens a group and an "end repeat" card closes it, matched innermost-first like brackets. Keeping the
 * program flat means the strip is one ordered list (reorder with arrow keys, delete removes) and nesting
 * is just "a repeat inside a repeat". An unclosed repeat runs to the end of the program, so a half-built
 * program still does something sensible.
 *
 * The interpreter turns (level, cards) into a list of frames — one per thing Jubi does, each pointing at
 * the card that caused it and the loop counters around it — plus an outcome. It never throws and always
 * stops: there are no unbounded loops in the language (repeat ×3 at most, finite nesting).
 */

export type Card = 'step' | 'left' | 'right' | 'jump' | 'ifRight' | 'rep2' | 'rep3' | 'end';
/** 0 = up (north), 1 = right, 2 = down, 3 = left — clockwise, so a right turn is +1. */
export type Dir = 0 | 1 | 2 | 3;

export interface Pos { readonly x: number; readonly y: number }

/** A parsed level: a grid of open ground with blocking obstacles, things to collect and a goal. */
export interface Board {
  readonly cols: number;
  readonly rows: number;
  readonly start: Pos;
  readonly dir: Dir;
  readonly goal: Pos;
  readonly items: readonly Pos[];
  readonly blocks: readonly Pos[];
}

export const DX: readonly number[] = [0, 1, 0, -1];
export const DY: readonly number[] = [-1, 0, 1, 0];

/** Cards a child can place (the end card is added and removed together with its repeat). */
export const PLACEABLE: readonly Card[] = ['step', 'left', 'right', 'jump', 'rep2', 'rep3', 'ifRight'];

export const isRepeat = (c: Card): c is 'rep2' | 'rep3' => c === 'rep2' || c === 'rep3';
export const repeatTimes = (c: 'rep2' | 'rep3'): number => (c === 'rep2' ? 2 : 3);

/** Cards counted against a level's limit: a repeat and its end are one card. */
export function cardCount(cards: readonly Card[]): number {
  return cards.filter((c) => c !== 'end').length;
}

// ── structure ──────────────────────────────────────────────────────────────

export type Block =
  | { readonly k: 'do'; readonly card: 'step' | 'left' | 'right' | 'jump' | 'ifRight'; readonly at: number }
  | { readonly k: 'repeat'; readonly n: number; readonly body: readonly Block[]; readonly at: number };

/** Brackets: every repeat matched by a later end, innermost first. Stray ends are ignored. */
export function parse(cards: readonly Card[]): Block[] {
  const root: Block[] = [];
  const stack: { n: number; at: number; body: Block[] }[] = [];
  const top = (): Block[] => stack[stack.length - 1]?.body ?? root;
  cards.forEach((c, at) => {
    if (isRepeat(c)) stack.push({ n: repeatTimes(c), at, body: [] });
    else if (c === 'end') {
      const open = stack.pop();
      if (open) top().push({ k: 'repeat', n: open.n, body: open.body, at: open.at });
    } else top().push({ k: 'do', card: c, at });
  });
  // Unclosed repeats run to the end of the program.
  while (stack.length > 0) {
    const open = stack.pop()!;
    top().push({ k: 'repeat', n: open.n, body: open.body, at: open.at });
  }
  return root;
}

/** For every repeat card, the index of its end card (or -1 while unclosed); and vice versa. */
export function partners(cards: readonly Card[]): number[] {
  const out = cards.map(() => -1);
  const stack: number[] = [];
  cards.forEach((c, i) => {
    if (isRepeat(c)) stack.push(i);
    else if (c === 'end') {
      const open = stack.pop();
      if (open !== undefined) { out[open] = i; out[i] = open; }
    }
  });
  return out;
}

/** How many repeats surround each card (a repeat card itself sits at its outer depth). */
export function depths(cards: readonly Card[]): number[] {
  let d = 0;
  return cards.map((c) => {
    if (c === 'end') { d = Math.max(0, d - 1); return d; }
    const here = d;
    if (isRepeat(c)) d++;
    return here;
  });
}

/** Every prefix has at least as many repeats as ends (so each end closes something). */
export function balanced(cards: readonly Card[]): boolean {
  let open = 0;
  for (const c of cards) {
    if (isRepeat(c)) open++;
    else if (c === 'end' && --open < 0) return false;
  }
  return true;
}

export const MAX_DEPTH = 2;

/** Deepest repeat nesting in a program. */
export function maxDepth(cards: readonly Card[]): number {
  let d = 0;
  let max = 0;
  for (const c of cards) {
    if (isRepeat(c)) max = Math.max(max, ++d);
    else if (c === 'end') d = Math.max(0, d - 1);
  }
  return max;
}

// ── running ────────────────────────────────────────────────────────────────

export interface LoopMark { readonly at: number; readonly iter: number; readonly of: number }

export type Action = 'step' | 'left' | 'right' | 'jump' | 'check' | 'bump' | 'bumpJump';

export interface Frame {
  /** Index of the card that produced this frame. */
  readonly at: number;
  /** Repeats around it, outermost first, with the pass they are on (1-based). */
  readonly loops: readonly LoopMark[];
  readonly action: Action;
  /** Jubi after the frame (a bump leaves Jubi where she was). */
  readonly pos: Pos;
  readonly dir: Dir;
  /** Item index collected on this frame. */
  readonly collected?: number;
  /** For 'check': whether the way ahead was blocked (and Jubi turned right). */
  readonly blocked?: boolean;
  /** For bumps: the cell Jubi tried to reach (may be off the board). */
  readonly toward?: Pos;
}

export type Outcome =
  | { readonly kind: 'win' }
  | { readonly kind: 'empty' }
  | { readonly kind: 'bump'; readonly into: 'block' | 'edge'; readonly at: Pos }
  | { readonly kind: 'jump'; readonly into: 'block' | 'edge'; readonly at: Pos }
  | { readonly kind: 'short'; readonly left: number }
  | { readonly kind: 'notHome' };

export interface Run { readonly frames: readonly Frame[]; readonly outcome: Outcome }

/** The live state Jubi carries while walking. */
export interface Walker { x: number; y: number; dir: Dir; done: boolean[] }

export const MAX_ACTIONS = 600;

export function inBounds(b: Board, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < b.cols && y < b.rows;
}

export function blockedAt(b: Board, x: number, y: number): boolean {
  return b.blocks.some((p) => p.x === x && p.y === y);
}

/** Open ground: on the board and not an obstacle. */
export function open(b: Board, x: number, y: number): boolean {
  return inBounds(b, x, y) && !blockedAt(b, x, y);
}

export const turn = (d: Dir, by: 1 | -1): Dir => (((d + by) % 4 + 4) % 4) as Dir;

export function allDone(w: Walker): boolean {
  return w.done.every(Boolean);
}

export function atGoal(b: Board, w: Walker): boolean {
  return w.x === b.goal.x && w.y === b.goal.y;
}

/**
 * One primitive card from a walker state. Mutates `w`; returns the frame fields, or a stop reason.
 * Shared by the interpreter and the solver so they can never disagree.
 */
export function act(b: Board, w: Walker, card: 'step' | 'left' | 'right' | 'jump' | 'ifRight'):
  { action: Action; collected?: number; blocked?: boolean; stop?: Outcome; toward?: Pos } {
  if (card === 'left' || card === 'right') {
    w.dir = turn(w.dir, card === 'right' ? 1 : -1);
    return { action: card };
  }
  const ax = w.x + DX[w.dir]!;
  const ay = w.y + DY[w.dir]!;
  if (card === 'ifRight') {
    const blocked = !open(b, ax, ay);
    if (blocked) w.dir = turn(w.dir, 1);
    return { action: 'check', blocked };
  }
  const reach = card === 'jump' ? 2 : 1;
  const tx = w.x + DX[w.dir]! * reach;
  const ty = w.y + DY[w.dir]! * reach;
  if (!open(b, tx, ty)) {
    const into = inBounds(b, tx, ty) ? 'block' : 'edge';
    const at = { x: tx, y: ty };
    return card === 'jump'
      ? { action: 'bumpJump', stop: { kind: 'jump', into, at }, toward: at }
      : { action: 'bump', stop: { kind: 'bump', into, at }, toward: at };
  }
  w.x = tx;
  w.y = ty;
  const i = b.items.findIndex((p, k) => p.x === tx && p.y === ty && !w.done[k]);
  if (i >= 0) { w.done[i] = true; return { action: card, collected: i }; }
  return { action: card };
}

export function startWalker(b: Board): Walker {
  return { x: b.start.x, y: b.start.y, dir: b.dir, done: b.items.map(() => false) };
}

/** Runs a program to the end, a bump, or the win (all collected and standing on the goal). */
export function run(b: Board, cards: readonly Card[]): Run {
  const frames: Frame[] = [];
  const w = startWalker(b);
  const program = parse(cards);
  if (program.length === 0) return { frames, outcome: { kind: 'empty' } };
  let stop: Outcome | null = null;
  const loops: LoopMark[] = [];

  const exec = (blocks: readonly Block[]): void => {
    for (const bl of blocks) {
      if (stop) return;
      if (bl.k === 'repeat') {
        for (let i = 1; i <= bl.n && !stop; i++) {
          loops.push({ at: bl.at, iter: i, of: bl.n });
          exec(bl.body);
          loops.pop();
        }
        continue;
      }
      if (frames.length >= MAX_ACTIONS) { stop = { kind: 'short', left: w.done.filter((d) => !d).length }; return; }
      const r = act(b, w, bl.card);
      frames.push({
        at: bl.at, loops: [...loops], action: r.action, pos: { x: w.x, y: w.y }, dir: w.dir,
        ...(r.collected !== undefined ? { collected: r.collected } : {}),
        ...(r.blocked !== undefined ? { blocked: r.blocked } : {}),
        ...(r.toward ? { toward: r.toward } : {}),
      });
      if (r.stop) { stop = r.stop; return; }
      if (allDone(w) && atGoal(b, w)) { stop = { kind: 'win' }; return; }
    }
  };
  exec(program);
  if (stop) return { frames, outcome: stop };
  const left = w.done.filter((d) => !d).length;
  return { frames, outcome: left > 0 ? { kind: 'short', left } : { kind: 'notHome' } };
}

// ── editing (pure; the strip UI calls these) ──────────────────────────────

/** Inserts a card after `after` (-1 = at the front). A repeat brings its end card along. */
export function insertCard(cards: readonly Card[], card: Card, after: number): { cards: Card[]; focus: number } {
  const at = Math.max(0, Math.min(cards.length, after + 1));
  const add: Card[] = isRepeat(card) ? [card, 'end'] : [card];
  return { cards: [...cards.slice(0, at), ...add, ...cards.slice(at)], focus: at };
}

/** Removes a card; a repeat and its end always leave together (the cards inside stay). */
export function removeCard(cards: readonly Card[], i: number): Card[] {
  const mate = partners(cards)[i] ?? -1;
  return cards.filter((_, k) => k !== i && k !== mate);
}

/**
 * Moves one card a place left (-1) or right (+1). Returns null when the move would leave an end card
 * before its repeat (or push past the ends of the list), so the program always stays well formed.
 */
export function moveCard(cards: readonly Card[], i: number, by: -1 | 1): Card[] | null {
  const j = i + by;
  if (i < 0 || i >= cards.length || j < 0 || j >= cards.length) return null;
  const next = [...cards];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return balanced(next) && maxDepth(next) <= MAX_DEPTH ? next : null;
}

/** Moves a card to a new index (drag and drop). Null when the result would not be well formed. */
export function moveCardTo(cards: readonly Card[], from: number, to: number): Card[] | null {
  if (from < 0 || from >= cards.length) return null;
  const next = [...cards];
  const [c] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, c!);
  return balanced(next) && maxDepth(next) <= MAX_DEPTH ? next : null;
}

/** Parses a compact solution string ("S S R [3 S J ]") into cards; used by levels and tests. */
export function cardsOf(src: string): Card[] {
  const map: Record<string, Card> = { S: 'step', L: 'left', R: 'right', J: 'jump', '?': 'ifRight', '[2': 'rep2', '[3': 'rep3', ']': 'end' };
  return src.trim().split(/\s+/).filter(Boolean).map((t) => {
    const c = map[t];
    if (!c) throw new Error(`unknown card ${t}`);
    return c;
  });
}
