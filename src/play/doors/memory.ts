/**
 * doors/memory.ts — which doors the child has opened.
 *
 * Christmas keeps using the Progress record (`store.openAdvent(year, day)` → `adventOpened["2026-7"]`), so the
 * advent strip on the Christmas page and this board agree. Every other holiday's doors are numbered 12…1 and
 * would collide in that record (Diwali's door 3 and Halloween's door 3 are both "2026-3", and so is Christmas
 * door 3), so they live under their own small key, namespaced by holiday: `jubilee.doors.v1` →
 * { version: 1, opened: ["diwali:2026:3", …] }. Nothing is written while the app is pretending a date: those
 * peeks are remembered for this session only. Storage failures fall back to memory, never to an error.
 */
import type { AppContext } from '../../app/context';

export const DOORS_KEY = 'jubilee.doors.v1';
/** Plenty for years of every holiday's doors (21 × 12 a year); the oldest fall off first. */
export const DOORS_CAP = 2000;

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface DoorMemory {
  has(year: number, n: number): boolean;
  /** Remembers a door; returns false when nothing new was stored (already open, or pretending). */
  open(year: number, n: number): boolean;
}

/** Peeks made while pretending a date, for this session only (keyed like the stored ones). */
const pretendOpened = new Set<string>();

export const doorKey = (holidayId: string, year: number, n: number): string => `${holidayId}:${year}:${n}`;

function browserStorage(): KeyValueStorage | null {
  try {
    const s = globalThis.localStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

/** Reads the opened-door list; anything malformed reads as empty. */
export function readOpened(storage: KeyValueStorage | null): string[] {
  try {
    const raw = storage?.getItem(DOORS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { opened?: unknown };
    const list = Array.isArray(parsed?.opened) ? parsed.opened : [];
    return list.filter((k): k is string => typeof k === 'string' && /^[\w-]+:\d{4}:\d{1,2}$/.test(k));
  } catch {
    return [];
  }
}

function writeOpened(storage: KeyValueStorage | null, list: readonly string[]): void {
  try { storage?.setItem(DOORS_KEY, JSON.stringify({ version: 1, opened: list.slice(-DOORS_CAP) })); } catch { /* memory only */ }
}

/** A holiday's door memory outside the Progress record (every holiday but Christmas). */
export function keyedMemory(holidayId: string, opts: { storage?: KeyValueStorage | null; pretending: boolean }): DoorMemory {
  const storage = opts.storage === undefined ? browserStorage() : opts.storage;
  let saved = new Set(readOpened(storage));
  return {
    has: (year, n) => saved.has(doorKey(holidayId, year, n)) || pretendOpened.has(doorKey(holidayId, year, n)),
    open(year, n) {
      const key = doorKey(holidayId, year, n);
      if (saved.has(key) || pretendOpened.has(key)) return false;
      if (opts.pretending) { pretendOpened.add(key); return false; }
      // Re-read first so two tabs (or the holiday-page strip) never overwrite each other's doors.
      saved = new Set(readOpened(storage));
      saved.add(key);
      writeOpened(storage, [...saved]);
      return true;
    },
  };
}

/** Christmas: the shared advent record in Progress (`${year}-${day}`). */
export function adventMemory(ctx: Pick<AppContext, 'store' | 'clock'>): DoorMemory {
  return {
    has: (year, n) => ctx.store.progress.adventOpened[`${year}-${n}`] === true || pretendOpened.has(doorKey('christmas', year, n)),
    open(year, n) {
      if (ctx.store.progress.adventOpened[`${year}-${n}`]) return false;
      if (ctx.clock.pretending) { pretendOpened.add(doorKey('christmas', year, n)); return false; }
      return ctx.store.openAdvent(year, n);
    },
  };
}

/** The memory a board uses: Christmas's advent record when the doors are advent days, else the keyed list. */
export function doorMemory(ctx: Pick<AppContext, 'store' | 'clock'>, holidayId: string, advent: boolean, storage?: KeyValueStorage | null): DoorMemory {
  return advent ? adventMemory(ctx) : keyedMemory(holidayId, { pretending: ctx.clock.pretending, ...(storage !== undefined ? { storage } : {}) });
}

/** Test hook: forget this session's pretend peeks. */
export function forgetPretendPeeks(): void {
  pretendOpened.clear();
}
