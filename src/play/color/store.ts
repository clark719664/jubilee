/**
 * store.ts — what Color-in keeps, and nothing else.
 *
 * 1. Finished pictures go on the Fridge (src/play/fridge.ts) as kind 'color' with ColorItemData:
 *    `{ v: 1, pageId, theme, fills }` where fills maps region id → crayon id. A few hundred bytes,
 *    never an image. Pressing Done again on a reopened picture updates the same Fridge item.
 * 2. Work in progress is kept as a draft per page in its own key `jubilee.color.v1`, so closing the
 *    page mid-picture loses nothing ("nothing is ever lost"). The draft remembers which Fridge item it
 *    is editing, if any.
 * Nothing is written while pretending (`?today=`); storage errors fall back to memory; anything
 * unreadable is treated as a fresh start.
 */
import type { ThemeId } from '../../theme/themes';
import type { Fills } from './history';

export const COLOR_KEY = 'jubilee.color.v1';

export interface ColorItemData {
  readonly v: 1;
  readonly pageId: string;
  readonly theme: ThemeId;
  readonly fills: Fills;
}

export interface Draft {
  readonly fills: Fills;
  /** Fridge item being edited (absent for a new picture). */
  readonly itemId?: string;
}

export interface ColorSave {
  readonly v: 1;
  readonly drafts: Readonly<Record<string, Draft>>;
}

export const EMPTY_SAVE: ColorSave = { v: 1, drafts: {} };

const ID = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const CRAYON = /^(k|t|m)-[a-z0-9]{1,16}$/;
const MAX_REGIONS = 600;

/** Keeps only well-formed region → crayon pairs. */
export function cleanFills(raw: unknown): Fills {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  let n = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (n >= MAX_REGIONS) break;
    if (ID.test(k) && typeof v === 'string' && CRAYON.test(v)) { out[k] = v; n++; }
  }
  return out;
}

export function isColorData(v: unknown): v is ColorItemData {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return o.v === 1 && typeof o.pageId === 'string' && ID.test(o.pageId) && typeof o.theme === 'string'
    && !!o.fills && typeof o.fills === 'object' && !Array.isArray(o.fills);
}

export function itemData(pageId: string, theme: ThemeId, fills: Fills): ColorItemData {
  return { v: 1, pageId, theme, fills: { ...fills } };
}

/** Tolerant parse: unknown keys dropped, bad entries skipped, never throws. */
export function parseSave(raw: string | null): ColorSave {
  if (!raw) return EMPTY_SAVE;
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return EMPTY_SAVE; }
  const drafts = (data as { drafts?: unknown } | null)?.drafts;
  if (!drafts || typeof drafts !== 'object') return EMPTY_SAVE;
  const out: Record<string, Draft> = {};
  for (const [id, entry] of Object.entries(drafts as Record<string, unknown>)) {
    if (!ID.test(id) || !entry || typeof entry !== 'object') continue;
    const e = entry as { fills?: unknown; itemId?: unknown };
    const d: { fills: Fills; itemId?: string } = { fills: cleanFills(e.fills) };
    if (typeof e.itemId === 'string' && e.itemId.length <= 64) d.itemId = e.itemId;
    out[id] = d;
  }
  return { v: 1, drafts: out };
}

/** The save with `pageId`'s draft replaced (null removes it: a fresh, untouched page needs no draft). */
export function withDraft(save: ColorSave, pageId: string, draft: Draft | null): ColorSave {
  const drafts: Record<string, Draft> = { ...save.drafts };
  if (draft === null || (Object.keys(draft.fills).length === 0 && draft.itemId === undefined)) delete drafts[pageId];
  else drafts[pageId] = draft;
  return { v: 1, drafts };
}

export interface ColorStorage {
  read(): ColorSave;
  /** No-op while pretending (kept in memory for this visit); returns whether it was written. */
  write(save: ColorSave): boolean;
}

export function colorStorage(pretending: boolean, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null = safeLocalStorage()): ColorStorage {
  let memory: ColorSave | null = null;
  return {
    read() {
      if (memory) return memory;
      try { return parseSave(storage ? storage.getItem(COLOR_KEY) : null); } catch { return EMPTY_SAVE; }
    },
    write(save) {
      memory = save;
      if (pretending || !storage) return false;
      try {
        if (Object.keys(save.drafts).length === 0) storage.removeItem(COLOR_KEY);
        else storage.setItem(COLOR_KEY, JSON.stringify(save));
        memory = null;
        return true;
      } catch { return false; }
    },
  };
}

function safeLocalStorage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}
