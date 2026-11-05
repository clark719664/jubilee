/**
 * history.ts — the picture as data: which crayon fills which region, plus undo and redo.
 *
 * Pure and immutable so every step can be tested and nothing is ever lost: a fill, an eraser rub
 * and a whole "Surprise!" are each ONE step, and undo walks them back exactly (a surprise undoes in
 * one go, bringing the child's own colours back). A new step clears redo, like every drawing app.
 */
export type Fills = Readonly<Record<string, string>>;

export interface Change {
  readonly region: string;
  /** Crayon id before / after; null = blank (white). */
  readonly before: string | null;
  readonly after: string | null;
}

export interface Doc {
  readonly fills: Fills;
  readonly undo: readonly (readonly Change[])[];
  readonly redo: readonly (readonly Change[])[];
}

/** Undo depth: plenty for a page of a few dozen shapes, and bounded for memory. */
export const MAX_UNDO = 200;

export function newDoc(fills: Fills = {}): Doc {
  return { fills: { ...fills }, undo: [], redo: [] };
}

function applyChanges(fills: Fills, changes: readonly Change[], dir: 'after' | 'before'): Fills {
  const next: Record<string, string> = { ...fills };
  for (const c of changes) {
    const v = c[dir];
    if (v === null) delete next[c.region];
    else next[c.region] = v;
  }
  return next;
}

/** Record a step that sets each listed region (null erases). No-op changes are skipped; an empty step is not recorded. */
export function commit(doc: Doc, target: Readonly<Record<string, string | null>>): Doc {
  const changes: Change[] = [];
  for (const [region, after] of Object.entries(target)) {
    const before = doc.fills[region] ?? null;
    if (before !== after) changes.push({ region, before, after });
  }
  if (changes.length === 0) return doc;
  const undo = [...doc.undo, changes];
  return { fills: applyChanges(doc.fills, changes, 'after'), undo: undo.slice(Math.max(0, undo.length - MAX_UNDO)), redo: [] };
}

/** Fill one region with a crayon (null = eraser). */
export function paint(doc: Doc, region: string, crayon: string | null): Doc {
  return commit(doc, { [region]: crayon });
}

/** Replace the whole picture in one step (Surprise!, fresh page). Regions not in `next` become blank. */
export function replaceAll(doc: Doc, regions: readonly string[], next: Fills): Doc {
  const target: Record<string, string | null> = {};
  for (const r of new Set([...regions, ...Object.keys(doc.fills)])) target[r] = next[r] ?? null;
  return commit(doc, target);
}

export function undo(doc: Doc): Doc {
  const step = doc.undo[doc.undo.length - 1];
  if (!step) return doc;
  return { fills: applyChanges(doc.fills, [...step].reverse(), 'before'), undo: doc.undo.slice(0, -1), redo: [...doc.redo, step] };
}

export function redo(doc: Doc): Doc {
  const step = doc.redo[doc.redo.length - 1];
  if (!step) return doc;
  return { fills: applyChanges(doc.fills, step, 'after'), undo: [...doc.undo, step], redo: doc.redo.slice(0, -1) };
}

export const canUndo = (doc: Doc): boolean => doc.undo.length > 0;
export const canRedo = (doc: Doc): boolean => doc.redo.length > 0;

/** Regions whose crayon differs between two fill maps (what the page has to repaint). */
export function diffRegions(a: Fills, b: Fills): string[] {
  const out: string[] = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[k] !== b[k]) out.push(k);
  return out;
}

/** How many of `regions` have a colour (for the gentle "every shape has colour" note). */
export function filledCount(fills: Fills, regions: readonly string[]): number {
  return regions.reduce((n, r) => n + (fills[r] ? 1 : 0), 0);
}
