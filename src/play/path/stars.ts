/**
 * stars.ts — which Jubi's Path puzzles the child has solved (a star each). Nothing is locked by it: every
 * puzzle is always open, the star is just a happy mark. Stored on this device only, under
 * `jubilee.path.v1` → { version: 1, items: ['L01', 'christmas-1', …] } ("items" so the grown-ups page can
 * say "3 saved"). Nothing is written while the app is pretending a date; those stars last for the session.
 * Storage failures fall back to memory, never to an error.
 */
export const PATH_KEY = 'jubilee.path.v1';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PathStars {
  has(levelId: string): boolean;
  count(ids: readonly string[]): number;
  /** Adds a star; returns true when it is new. */
  add(levelId: string): boolean;
}

function browserStorage(): KeyValueStorage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

/** The solved list; anything malformed reads as empty. */
export function readSolved(storage: KeyValueStorage | null): string[] {
  try {
    const raw = storage?.getItem(PATH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: unknown };
    const list = Array.isArray(parsed?.items) ? parsed.items : [];
    return list.filter((k): k is string => typeof k === 'string' && /^[\w-]{1,40}$/.test(k));
  } catch {
    return [];
  }
}

/** Stars made while pretending a date: kept for this session only. */
const sessionStars = new Set<string>();

export function pathStars(opts: { pretending: boolean; storage?: KeyValueStorage | null }): PathStars {
  const storage = opts.storage === undefined ? browserStorage() : opts.storage;
  let saved = new Set(readSolved(storage));
  const has = (id: string): boolean => saved.has(id) || sessionStars.has(id);
  return {
    has,
    count: (ids) => ids.filter(has).length,
    add(id) {
      if (has(id)) return false;
      if (opts.pretending || !storage) { sessionStars.add(id); return true; }
      // Re-read first so a second tab never overwrites the other's stars.
      saved = new Set(readSolved(storage));
      saved.add(id);
      try { storage.setItem(PATH_KEY, JSON.stringify({ version: 1, items: [...saved] })); } catch { sessionStars.add(id); }
      return true;
    },
  };
}

/** Test hook. */
export function forgetSessionStars(): void {
  sessionStars.clear();
}
