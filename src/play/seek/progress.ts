/**
 * progress.ts — what Seek & Find remembers, in its own localStorage key `jubilee.seek.v1`.
 *
 * Per holiday scene: the ids found so far in the current round (so closing mid-search loses nothing),
 * the first day every detail was found and how many times. A finished scene starts a fresh round next
 * time with a "Found them all!" ribbon. Nothing is saved while pretending (`?today=`), storage errors
 * (private mode, quota) are swallowed, and anything unreadable is treated as a fresh start.
 */

export const SEEK_KEY = 'jubilee.seek.v1';

export interface SceneProgress {
  /** Found in the current round. */
  readonly found: readonly string[];
  /** ISO day (YYYY-MM-DD) of the first full round. */
  readonly done?: string;
  /** Full rounds finished. */
  readonly rounds?: number;
}

export interface SeekSave {
  readonly v: 1;
  readonly scenes: Readonly<Record<string, SceneProgress>>;
}

export const EMPTY_SAVE: SeekSave = { v: 1, scenes: {} };

const ID = /^[a-z0-9-]{1,64}$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Tolerant parse: unknown keys dropped, bad entries skipped, never throws. */
export function parseSave(raw: string | null): SeekSave {
  if (!raw) return EMPTY_SAVE;
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return EMPTY_SAVE; }
  if (!data || typeof data !== 'object') return EMPTY_SAVE;
  const scenes = (data as { scenes?: unknown }).scenes;
  if (!scenes || typeof scenes !== 'object') return EMPTY_SAVE;
  const out: Record<string, SceneProgress> = {};
  for (const [id, entry] of Object.entries(scenes as Record<string, unknown>)) {
    if (!ID.test(id) || !entry || typeof entry !== 'object') continue;
    const e = entry as { found?: unknown; done?: unknown; rounds?: unknown };
    const found = Array.isArray(e.found) ? [...new Set(e.found.filter((x): x is string => typeof x === 'string' && ID.test(x)))].slice(0, 32) : [];
    const p: { found: string[]; done?: string; rounds?: number } = { found };
    if (typeof e.done === 'string' && ISO.test(e.done)) p.done = e.done;
    if (typeof e.rounds === 'number' && Number.isInteger(e.rounds) && e.rounds > 0) p.rounds = Math.min(e.rounds, 9999);
    out[id] = p;
  }
  return { v: 1, scenes: out };
}

export function sceneProgress(save: SeekSave, id: string): SceneProgress {
  return save.scenes[id] ?? { found: [] };
}

function withScene(save: SeekSave, id: string, p: SceneProgress): SeekSave {
  return { v: 1, scenes: { ...save.scenes, [id]: p } };
}

/** Records the ids found so far this round (only ids that belong to the scene). */
export function withFound(save: SeekSave, id: string, found: Iterable<string>, valid: readonly string[]): SeekSave {
  const ok = new Set(valid);
  const list = [...new Set(found)].filter((f) => ok.has(f));
  return withScene(save, id, { ...sceneProgress(save, id), found: list });
}

/** A finished round: keep the first completion day, count the round, clear `found` for next time. */
export function withRoundDone(save: SeekSave, id: string, isoDay: string): SeekSave {
  const prev = sceneProgress(save, id);
  const p: { found: string[]; done: string; rounds: number } = { found: [], done: prev.done ?? isoDay, rounds: (prev.rounds ?? 0) + 1 };
  return withScene(save, id, p);
}

/** The ids to restore when the scene opens: the saved round, minus ids the scene no longer has. */
export function resumeFound(save: SeekSave, id: string, valid: readonly string[]): string[] {
  const ok = new Set(valid);
  const found = sceneProgress(save, id).found.filter((f) => ok.has(f));
  // A round saved as complete (all found) is a finished round, not something to resume.
  return found.length >= valid.length ? [] : found;
}

export interface SeekStorage {
  read(): SeekSave;
  /** No-op while pretending; returns whether it was written. */
  write(save: SeekSave): boolean;
}

/** localStorage wrapper; every access in try/catch, nothing written while pretending. */
export function seekStorage(pretending: boolean, storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeLocalStorage()): SeekStorage {
  let memory: SeekSave | null = null;
  return {
    read() {
      if (memory) return memory;
      try { return parseSave(storage ? storage.getItem(SEEK_KEY) : null); } catch { return EMPTY_SAVE; }
    },
    write(save) {
      // While pretending, keep the round in memory so the current visit still feels continuous.
      memory = save;
      if (pretending || !storage) return false;
      try { storage.setItem(SEEK_KEY, JSON.stringify(save)); memory = null; return true; } catch { return false; }
    },
  };
}

function safeLocalStorage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}
