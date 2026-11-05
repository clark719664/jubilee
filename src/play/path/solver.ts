/**
 * solver.ts — finds the shortest program (fewest cards) for a board, so the tests can prove every level
 * is solvable within its card limit, and so level design can see how many cards a puzzle really needs.
 *
 * Programs are searched as a shortest path over Jubi's states (cell, facing, which items are done):
 * from a state, every "block" — one card, or a repeat around a sequence of blocks — is an edge whose cost
 * is its card count. Executing a block is deterministic, so Dijkstra over (state, cost) finds the
 * cheapest program without enumerating every program. Blocks are enumerated once up to the budget, with
 * repeat nesting capped at MAX_DEPTH and a few pointless sequences ("left right") skipped.
 */
import { act, allDone, atGoal, isRepeat, MAX_DEPTH, startWalker, type Board, type Card, type Walker } from './model';

type Prim = 'step' | 'left' | 'right' | 'jump' | 'ifRight';
type SBlock = { readonly prim: Prim; readonly depth: 0; readonly cost: 1 } | { readonly n: number; readonly body: readonly SBlock[]; readonly depth: number; readonly cost: number };

export interface SolveOptions {
  /** Cards the level offers (repeats and the if card included). */
  readonly cards: readonly Card[];
  /** Largest program to look for, in cards. */
  readonly budget: number;
  /** Longest repeat body, in cards (keeps the search small; level bodies are short). */
  readonly maxBody?: number;
  /** Deepest repeat nesting to try (default MAX_DEPTH); 1 finds the best program without a repeat inside a repeat. */
  readonly maxDepth?: number;
}

export interface Solution { readonly cards: Card[]; readonly cost: number }

const isPrim = (b: SBlock): b is Extract<SBlock, { prim: Prim }> => 'prim' in b;

function pointless(seq: readonly SBlock[]): boolean {
  for (let i = 1; i < seq.length; i++) {
    const a = seq[i - 1]!;
    const b = seq[i]!;
    if (isPrim(a) && isPrim(b) && ((a.prim === 'left' && b.prim === 'right') || (a.prim === 'right' && b.prim === 'left'))) return true;
  }
  return false;
}

/** Every block up to `budget` cards, cheapest first. */
export function enumerateBlocks(cards: readonly Card[], budget: number, maxBody: number, maxDepth: number = MAX_DEPTH): SBlock[] {
  const prims = cards.filter((c): c is Prim => !isRepeat(c) && c !== 'end');
  const reps = cards.filter(isRepeat).map((c) => (c === 'rep2' ? 2 : 3));
  const byCost: SBlock[][] = [[]];
  byCost[1] = prims.map((prim) => ({ prim, depth: 0, cost: 1 }) as SBlock);
  // seqs[k][d] = sequences of total cost k whose deepest block has depth ≤ d (we only need d < MAX_DEPTH).
  const seqs = new Map<string, SBlock[][]>();
  const seqsOf = (k: number, d: number): SBlock[][] => {
    const key = `${k}:${d}`;
    const hit = seqs.get(key);
    if (hit) return hit;
    const out: SBlock[][] = [];
    for (let j = 1; j <= k; j++) {
      for (const first of byCost[j] ?? []) {
        if (first.depth > d) continue;
        if (j === k) { out.push([first]); continue; }
        for (const rest of seqsOf(k - j, d)) {
          const s = [first, ...rest];
          if (!pointless(s)) out.push(s);
        }
      }
    }
    seqs.set(key, out);
    return out;
  };
  for (let c = 2; c <= budget; c++) {
    const list: SBlock[] = [];
    const bodyCost = c - 1;
    if (bodyCost <= maxBody) {
      for (const n of reps) {
        for (const body of seqsOf(bodyCost, maxDepth - 1)) {
          const depth = 1 + Math.max(...body.map((b) => b.depth));
          if (depth <= maxDepth) list.push({ n, body, depth, cost: c });
        }
      }
    }
    // Cached sequences of cost < c only use blocks cheaper than c, so they stay valid.
    byCost[c] = list;
  }
  return byCost.flat();
}

type Step = 'win' | 'stop' | 'ok';

function execBlock(b: Board, w: Walker, bl: SBlock): Step {
  if (isPrim(bl)) {
    const r = act(b, w, bl.prim);
    if (r.stop) return 'stop';
    return allDone(w) && atGoal(b, w) ? 'win' : 'ok';
  }
  for (let i = 0; i < bl.n; i++) {
    for (const inner of bl.body) {
      const r = execBlock(b, w, inner);
      if (r !== 'ok') return r;
    }
  }
  return 'ok';
}

const keyOf = (w: Walker): string => `${w.x},${w.y},${w.dir},${w.done.map((d) => (d ? 1 : 0)).join('')}`;

function flatten(bl: SBlock): Card[] {
  if (isPrim(bl)) return [bl.prim];
  return [bl.n === 2 ? 'rep2' : 'rep3', ...bl.body.flatMap(flatten), 'end'];
}

/** The cheapest program within the budget, or null when there is none. */
export function solve(board: Board, opts: SolveOptions): Solution | null {
  const blocks = enumerateBlocks(opts.cards, opts.budget, opts.maxBody ?? opts.budget - 1, opts.maxDepth ?? MAX_DEPTH);
  // Bucket queue by cost: states first reached at the lowest cost win.
  const best = new Map<string, number>();
  const buckets: { w: Walker; path: SBlock[] }[][] = Array.from({ length: opts.budget + 1 }, () => []);
  const start = startWalker(board);
  best.set(keyOf(start), 0);
  buckets[0]!.push({ w: start, path: [] });
  let win: Solution | null = null;
  for (let cost = 0; cost <= opts.budget; cost++) {
    if (win && cost >= win.cost) break;
    for (const { w, path } of buckets[cost]!) {
      if (best.get(keyOf(w))! < cost) continue;
      for (const bl of blocks) {
        const c = cost + bl.cost;
        // Blocks are cheapest first, so nothing after this one can do better.
        if (c > opts.budget || (win && c >= win.cost)) break;
        const next: Walker = { x: w.x, y: w.y, dir: w.dir, done: [...w.done] };
        const r = execBlock(board, next, bl);
        if (r === 'stop') continue;
        const p = [...path, bl];
        if (r === 'win') { win = { cards: p.flatMap(flatten), cost: c }; break; }
        const k = keyOf(next);
        const seen = best.get(k);
        if (seen !== undefined && seen <= c) continue;
        best.set(k, c);
        buckets[c]!.push({ w: next, path: p });
      }
    }
  }
  return win;
}
