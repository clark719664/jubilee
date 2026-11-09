/**
 * The postcard album and the rules for which stop sends which postcard. Pure apart from the
 * storage wrapper, so it runs in the Node tests.
 *
 *  - Santa: when the sleigh's leg index moves from `prev` to `leg`, the stops `prev+1 … leg` have
 *    just been reached (leg k runs from stops[k] to stops[k+1]). The first sync after the view
 *    opens (prev < 0) reaches nothing, so opening the tracker mid-flight never replays old stops.
 *  - The New Year wave: when the arrived count moves from `prev` to `count`, cities
 *    `prev … count-1` have just reached midnight (again nothing on the first sync).
 *  - Every reached city with a postcard sends it, in order (the World view shows them one at a
 *    time); a step that reaches more than four only happens after the tab slept, and then only
 *    the latest one is sent.
 *
 * The album lives in its own localStorage key, `jubilee.postcards.v1`: `{ v: 1, cards: { "christmas:2026:tokyo":
 * <epoch ms of the visit>, … } }`. Every access is in try/catch, anything unreadable is a fresh
 * album, and nothing is written while pretending (`?today=`): those cards are kept in memory for
 * the visit only.
 */
import type { City } from './data/cities';
import { fill } from '../i18n/index';
import { postcardFor, type PostcardCity } from './data/postcards';

export type PostcardKind = 'christmas' | 'newyear';

export const POSTCARD_KEY = 'jubilee.postcards.v1';

export interface AlbumEntry {
  readonly kind: PostcardKind;
  /** Christmas Eve's year, or the year the New Year wave arrives in. */
  readonly year: number;
  readonly cityId: string;
  /** Epoch ms of the visit (the postmark). */
  readonly at: number;
}

export interface AlbumSave {
  readonly v: 1;
  readonly cards: Readonly<Record<string, number>>;
}

export const EMPTY_ALBUM: AlbumSave = { v: 1, cards: {} };

const KEY_RE = /^(christmas|newyear):(\d{4}):([a-z0-9-]{1,48})$/;
/** Plenty for 28 cities × 2 kinds over many years, and a cap against junk. */
const MAX_CARDS = 600;

export function albumKey(kind: PostcardKind, year: number, cityId: string): string {
  return `${kind}:${year}:${cityId}`;
}

/** Tolerant parse: bad keys and values are dropped, never throws. */
export function parseAlbum(raw: string | null): AlbumSave {
  if (!raw) return EMPTY_ALBUM;
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return EMPTY_ALBUM; }
  if (!data || typeof data !== 'object') return EMPTY_ALBUM;
  const cards = (data as { cards?: unknown }).cards;
  if (!cards || typeof cards !== 'object' || Array.isArray(cards)) return EMPTY_ALBUM;
  const out: Record<string, number> = {};
  let n = 0;
  for (const [k, v] of Object.entries(cards as Record<string, unknown>)) {
    const m = KEY_RE.exec(k);
    if (!m || !postcardFor(m[3]!) || typeof v !== 'number' || !Number.isFinite(v) || v <= 0) continue;
    out[k] = Math.round(v);
    if (++n >= MAX_CARDS) break;
  }
  return { v: 1, cards: out };
}

/** Adds a card; the first visit's postmark is kept when the same card arrives again. */
export function withCard(save: AlbumSave, e: AlbumEntry): AlbumSave {
  const key = albumKey(e.kind, e.year, e.cityId);
  if (save.cards[key] !== undefined || !postcardFor(e.cityId)) return save;
  return { v: 1, cards: { ...save.cards, [key]: Math.round(e.at) } };
}

/** The cards in the album, in the order they arrived; optionally only one kind and year. */
export function albumEntries(save: AlbumSave, kind?: PostcardKind, year?: number): AlbumEntry[] {
  const out: AlbumEntry[] = [];
  for (const [k, at] of Object.entries(save.cards)) {
    const m = KEY_RE.exec(k);
    if (!m) continue;
    const e: AlbumEntry = { kind: m[1] as PostcardKind, year: Number(m[2]), cityId: m[3]!, at };
    if ((kind === undefined || e.kind === kind) && (year === undefined || e.year === year)) out.push(e);
  }
  return out.sort((a, b) => a.at - b.at || a.cityId.localeCompare(b.cityId));
}

/** The albums that have at least one card, newest first: [{ kind, year, entries }]. */
export function albums(save: AlbumSave): { kind: PostcardKind; year: number; entries: AlbumEntry[] }[] {
  const groups = new Map<string, { kind: PostcardKind; year: number; entries: AlbumEntry[] }>();
  for (const e of albumEntries(save)) {
    const k = `${e.kind}:${e.year}`;
    let g = groups.get(k);
    if (!g) { g = { kind: e.kind, year: e.year, entries: [] }; groups.set(k, g); }
    g.entries.push(e);
  }
  // Newest year first; within a season, Christmas Eve comes before the New Year it leads to.
  const order = (g: { kind: PostcardKind; year: number }): number => (g.kind === 'christmas' ? g.year + 0.5 : g.year);
  return [...groups.values()].sort((a, b) => order(b) - order(a));
}

export function albumTitle(kind: PostcardKind, year: number): string {
  return kind === 'christmas' ? fill('Postcards from Christmas Eve {year}', { year }) : fill('Postcards from New Year {year}', { year });
}

// ───────────────────────────────────────────────────────── which stop sends which card

/** A city reached by Santa or by midnight, and when (epoch ms: the postmark). */
export interface Arrival {
  readonly city: City;
  readonly at: number;
}

/** A reached city that has a postcard. */
export interface PostcardArrival extends Arrival {
  readonly card: PostcardCity;
}

/** Cities reached when Santa's leg index moves from `prev` to `leg` (see the file comment). */
export function santaArrivals(stops: readonly { readonly city: City | null; readonly at: number }[], prev: number, leg: number): Arrival[] {
  if (prev < 0 || leg <= prev) return [];
  const out: Arrival[] = [];
  for (let k = prev + 1; k <= Math.min(leg, stops.length - 1); k++) {
    const s = stops[k];
    if (s?.city) out.push({ city: s.city, at: s.at });
  }
  return out;
}

/** Cities reaching midnight when the wave's arrived count moves from `prev` to `count`. */
export function waveArrivals(order: readonly City[], times: readonly number[], prev: number, count: number): Arrival[] {
  if (prev < 0 || count <= prev) return [];
  const out: Arrival[] = [];
  for (let i = prev; i < Math.min(count, order.length); i++) out.push({ city: order[i]!, at: times[i] ?? 0 });
  return out;
}

/**
 * The postcards one step sends, in arrival order. A normal step reaches one or two cities (a
 * few more when a whole time zone strikes midnight together); a step that reaches more than
 * `max` postcard cities only happens after the tab slept, and then just the latest card is sent.
 */
export function postcardsReached(reached: readonly Arrival[], max = 4): PostcardArrival[] {
  const out: PostcardArrival[] = [];
  for (const r of reached) {
    const card = postcardFor(r.city.id);
    if (card) out.push({ ...r, card });
  }
  return out.length > max ? out.slice(-1) : out;
}

/** The latest reached city that has a postcard, or null. */
export function pickPostcard(reached: readonly Arrival[]): PostcardArrival | null {
  return postcardsReached(reached, 0)[0] ?? null;
}

// ───────────────────────────────────────────────────────── storage

export interface AlbumStorage {
  read(): AlbumSave;
  /** Adds a card; returns true when it is new to the album (saved, or kept in memory while pretending). */
  add(e: AlbumEntry): boolean;
}

/**
 * Cards that could not be written (pretending, private mode, a full disk) live here for the rest
 * of the visit, shared by the World view and the Sticker Book, and are never written back.
 */
let sessionMemory: AlbumSave | null = null;

type KeyStore = Pick<Storage, 'getItem' | 'setItem'>;

function safeLocalStorage(): KeyStore | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export function albumStorage(pretending: boolean, storage: KeyStore | null = safeLocalStorage()): AlbumStorage {
  const stored = (): AlbumSave => {
    try { return parseAlbum(storage ? storage.getItem(POSTCARD_KEY) : null); } catch { return EMPTY_ALBUM; }
  };
  const remember = (e: AlbumEntry): void => { sessionMemory = withCard(sessionMemory ?? EMPTY_ALBUM, e); };
  return {
    read() {
      const base = stored();
      const mem = sessionMemory;
      return mem ? { v: 1, cards: { ...mem.cards, ...base.cards } } : base;
    },
    add(e) {
      const before = this.read();
      if (withCard(before, e) === before) return false;
      if (pretending || !storage) { remember(e); return true; }
      try {
        storage.setItem(POSTCARD_KEY, JSON.stringify(withCard(stored(), e)));
      } catch {
        remember(e);
      }
      return true;
    },
  };
}

/** Tests only: forget the cards kept in memory. */
export function resetAlbumMemory(): void {
  sessionMemory = null;
}
