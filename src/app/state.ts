import { formatIso, isValid, parseIso, type CivilDate, type IsoDate } from '../dates/civil';
import { REGIONS, type Region } from '../dates/rules';
import type { CustomHoliday, HolidayId } from '../content/types';
import { COPY } from '../ui/copy';

export const STORAGE_KEY = 'jubilee.v1';

export type BadgeId = 'early-bird' | 'world-traveler' | 'little-chef' | 'fact-finder' | 'first-footer';
export const BADGE_IDS: readonly BadgeId[] = ['early-bird', 'world-traveler', 'little-chef', 'fact-finder', 'first-footer'];

export interface Progress {
  readonly version: 1;
  name?: string;
  region?: Region;
  motion: 'auto' | 'on' | 'off';
  units: 'us' | 'metric';
  /** Ignore regions for the hero rotation. */
  everywhere: boolean;
  /** `${holidayId}:${year}` → date earned. */
  stickers: Record<string, IsoDate>;
  badges: Partial<Record<BadgeId, IsoDate>>;
  visited: Record<HolidayId, IsoDate>;
  /** `${holidayId}/${recipeId}` */
  recipesDone: string[];
  factsFlipped: number;
  /** Distinct, max 30, newest last. */
  openDays: IsoDate[];
  custom: CustomHoliday[];
  greetedToday?: IsoDate;
  /** `${year}-${day}` */
  adventOpened: Record<string, true>;
  /** Shell colour scheme override; undefined follows the OS. */
  scheme?: 'light' | 'dark';
}

/*
 * ───────────────────────────────────────────────────────────── persistence
 *
 * Everything a child does lives in one JSON blob under `jubilee.v1`. Reads and
 * writes are wrapped so a blocked or full storage (private mode, cookies off)
 * degrades to an in-memory session instead of an error. `migrate` accepts
 * anything — empty, garbage, a future version — and always returns a valid
 * Progress, keeping whatever fields still make sense.
 */

/** The subset of Storage we use, so tests can inject a fake and the browser can pass localStorage. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const OPEN_DAYS_CAP = 30;
export const NAME_MAX = 24;

export function defaultProgress(region?: Region): Progress {
  return {
    version: 1,
    motion: 'auto',
    units: region === 'US' ? 'us' : 'metric',
    everywhere: false,
    stickers: {},
    badges: {},
    visited: {},
    recipesDone: [],
    factsFlipped: 0,
    openDays: [],
    custom: [],
    adventOpened: {},
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isIso = (v: unknown): v is IsoDate => typeof v === 'string' && parseIso(v) !== null;
const isRegion = (v: unknown): v is Region => typeof v === 'string' && (REGIONS as readonly string[]).includes(v);
const isBadge = (v: string): v is BadgeId => (BADGE_IDS as readonly string[]).includes(v);

function isoRecord(v: unknown, keyOk: (k: string) => boolean): Record<string, IsoDate> {
  const out: Record<string, IsoDate> = {};
  if (!isRecord(v)) return out;
  for (const [k, d] of Object.entries(v)) if (keyOk(k) && isIso(d)) out[k] = d;
  return out;
}

function distinctStrings(v: unknown, ok: (s: string) => boolean): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const s of v) if (typeof s === 'string' && ok(s) && !out.includes(s)) out.push(s);
  return out;
}

export function isCustomHoliday(v: unknown): v is CustomHoliday {
  if (!isRecord(v)) return false;
  const { id, name, emoji, month, day, year } = v;
  if (typeof id !== 'string' || !id || typeof name !== 'string' || !name.trim() || typeof emoji !== 'string') return false;
  if (typeof month !== 'number' || typeof day !== 'number') return false;
  // Validate against a leap year so Feb 29 birthdays are allowed.
  if (!isValid({ y: 2024, m: month, d: day })) return false;
  return year === undefined || (typeof year === 'number' && Number.isInteger(year) && year >= 1900 && year <= 2100);
}

/** Builds a valid Progress from whatever was in storage. Unknown versions are salvaged field by field. */
export function migrate(raw: unknown, region?: Region): Progress {
  const base = defaultProgress(region);
  if (!isRecord(raw)) return base;
  const p: Progress = { ...base };
  if (typeof raw.name === 'string' && raw.name.trim()) p.name = raw.name.trim().slice(0, NAME_MAX);
  if (isRegion(raw.region)) p.region = raw.region;
  if (raw.motion === 'auto' || raw.motion === 'on' || raw.motion === 'off') p.motion = raw.motion;
  if (raw.units === 'us' || raw.units === 'metric') p.units = raw.units;
  if (typeof raw.everywhere === 'boolean') p.everywhere = raw.everywhere;
  p.stickers = isoRecord(raw.stickers, (k) => /^[\w-]+:\d{4}$/.test(k));
  p.badges = isoRecord(raw.badges, isBadge) as Partial<Record<BadgeId, IsoDate>>;
  p.visited = isoRecord(raw.visited, (k) => /^[\w-]+$/.test(k));
  p.recipesDone = distinctStrings(raw.recipesDone, (s) => s.includes('/'));
  if (typeof raw.factsFlipped === 'number' && Number.isFinite(raw.factsFlipped) && raw.factsFlipped > 0) p.factsFlipped = Math.floor(raw.factsFlipped);
  p.openDays = (distinctStrings(raw.openDays, isIso) as IsoDate[]).slice(-OPEN_DAYS_CAP);
  p.custom = Array.isArray(raw.custom) ? raw.custom.filter(isCustomHoliday) : [];
  if (isIso(raw.greetedToday)) p.greetedToday = raw.greetedToday;
  if (isRecord(raw.adventOpened)) {
    for (const [k, v] of Object.entries(raw.adventOpened)) if (/^\d{4}-\d{1,2}$/.test(k) && v === true) p.adventOpened[k] = true;
  }
  if (raw.scheme === 'light' || raw.scheme === 'dark') p.scheme = raw.scheme;
  return p;
}

/** Reads and migrates; never throws. `storage` null = no persistence. */
export function load(storage: StorageLike | null | undefined, region?: Region): Progress {
  try {
    const text = storage?.getItem(STORAGE_KEY);
    return migrate(text ? JSON.parse(text) : null, region);
  } catch {
    return defaultProgress(region);
  }
}

/** Writes; returns false (and stays quiet) when storage is missing or throws. */
export function save(p: Progress, storage: StorageLike | null | undefined): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

/** window.localStorage when it exists and actually works (probe write), else null. */
export function browserStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const probe = `${STORAGE_KEY}.probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/*
 * ───────────────────────────────────────────────────────────── Store
 *
 * The single mutable owner of Progress. Views read `store.progress` (treat it
 * as immutable: every change produces a new object) and call the helpers,
 * which persist and notify subscribers. While `pretending` (?today=) nothing
 * is written to storage — the session is a sandbox, so a parent previewing
 * Diwali sees the sticker peel but the child's real shelf is untouched.
 */

export interface StoreOptions {
  storage?: StorageLike | null;
  pretending?: boolean;
  /** Region used for `reset()` defaults (units). */
  defaultRegion?: Region;
}

export type Subscriber = (p: Progress) => void;

export class Store {
  private p: Progress;
  private readonly storage: StorageLike | null;
  private readonly subs = new Set<Subscriber>();
  private readonly defaultRegion: Region | undefined;
  /** False when storage is missing or threw: the grown-ups page shows a one-line note. */
  readonly storageOk: boolean;
  /** When true, writes to storage are skipped (in-memory changes still happen). */
  pretending: boolean;

  constructor(initial: Progress, opts: StoreOptions = {}) {
    this.p = initial;
    this.storage = opts.storage ?? null;
    this.pretending = opts.pretending ?? false;
    this.storageOk = this.storage !== null;
    if (opts.defaultRegion) this.defaultRegion = opts.defaultRegion;
  }

  get progress(): Progress {
    return this.p;
  }

  /** Applies `fn`; when it returns a different object the change is persisted and announced. */
  update(fn: (p: Progress) => Progress): boolean {
    const next = fn(this.p);
    if (next === this.p) return false;
    this.p = next;
    if (!this.pretending) save(next, this.storage);
    for (const cb of this.subs) cb(next);
    return true;
  }

  subscribe(cb: Subscriber): () => void {
    this.subs.add(cb);
    return () => { this.subs.delete(cb); };
  }

  // ── progress a child earns ──

  /** True when the sticker was new. Idempotent per (holiday, year). */
  earnSticker(holidayId: HolidayId, year: number, today: CivilDate): boolean {
    const key = `${holidayId}:${year}`;
    return this.update((p) => (p.stickers[key] ? p : { ...p, stickers: { ...p.stickers, [key]: formatIso(today) } }));
  }

  awardBadge(id: BadgeId, today: CivilDate): boolean {
    return this.update((p) => (p.badges[id] ? p : { ...p, badges: { ...p.badges, [id]: formatIso(today) } }));
  }

  /** Records the first visit date of a holiday page. */
  markVisited(holidayId: HolidayId, today: CivilDate): boolean {
    return this.update((p) => (p.visited[holidayId] ? p : { ...p, visited: { ...p.visited, [holidayId]: formatIso(today) } }));
  }

  markRecipeDone(holidayId: HolidayId, recipeId: string): boolean {
    const key = `${holidayId}/${recipeId}`;
    return this.update((p) => (p.recipesDone.includes(key) ? p : { ...p, recipesDone: [...p.recipesDone, key] }));
  }

  /** Distinct days, capped at the newest 30. True when today was new. */
  markOpenDay(today: CivilDate): boolean {
    const iso = formatIso(today);
    return this.update((p) => (p.openDays.includes(iso) ? p : { ...p, openDays: [...p.openDays, iso].slice(-OPEN_DAYS_CAP) }));
  }

  bumpFacts(n = 1): void {
    this.update((p) => ({ ...p, factsFlipped: p.factsFlipped + n }));
  }

  setGreeted(today: CivilDate): void {
    const iso = formatIso(today);
    this.update((p) => (p.greetedToday === iso ? p : { ...p, greetedToday: iso }));
  }

  openAdvent(year: number, day: number): boolean {
    const key = `${year}-${day}`;
    return this.update((p) => (p.adventOpened[key] ? p : { ...p, adventOpened: { ...p.adventOpened, [key]: true } }));
  }

  // ── settings ──

  setName(name: string | undefined): void {
    const clean = name?.trim().slice(0, NAME_MAX) || undefined;
    this.update((p) => {
      if (clean === p.name) return p;
      const next = { ...p };
      if (clean) next.name = clean; else delete next.name;
      return next;
    });
  }

  setRegion(region: Region | undefined): void {
    this.update((p) => {
      if (region === p.region) return p;
      const next = { ...p };
      if (region) next.region = region; else delete next.region;
      return next;
    });
  }

  setMotion(motion: Progress['motion']): void {
    this.update((p) => (p.motion === motion ? p : { ...p, motion }));
  }

  setUnits(units: Progress['units']): void {
    this.update((p) => (p.units === units ? p : { ...p, units }));
  }

  setEverywhere(everywhere: boolean): void {
    this.update((p) => (p.everywhere === everywhere ? p : { ...p, everywhere }));
  }

  setScheme(scheme: Progress['scheme']): void {
    this.update((p) => {
      if (scheme === p.scheme) return p;
      const next = { ...p };
      if (scheme) next.scheme = scheme; else delete next.scheme;
      return next;
    });
  }

  /** Adds a birthday/custom day; an id is generated unless given. Returns the stored entry. */
  addCustom(c: Omit<CustomHoliday, 'id'> & { id?: string }): CustomHoliday {
    const { id: given, year, ...rest } = c;
    const entry: CustomHoliday = { id: given ?? newCustomId(), ...rest, ...(year !== undefined ? { year } : {}) };
    this.update((p) => ({ ...p, custom: [...p.custom.filter((x) => x.id !== entry.id), entry] }));
    return entry;
  }

  removeCustom(id: string): boolean {
    return this.update((p) => (p.custom.some((x) => x.id === id) ? { ...p, custom: p.custom.filter((x) => x.id !== id) } : p));
  }

  /** Forgets everything on this device. */
  reset(): void {
    this.p = defaultProgress(this.defaultRegion);
    if (!this.pretending) {
      try { this.storage?.removeItem(STORAGE_KEY); } catch { /* storage may be gone; nothing to clear */ }
    }
    for (const cb of this.subs) cb(this.p);
  }

  /** Plain-language inventory for the grown-ups page: exactly what is in the blob, nothing hidden. */
  whatWeStore(): string[] {
    const p = this.p;
    const lines: string[] = [];
    if (p.name) lines.push(`Name: ${p.name}`);
    if (p.region) lines.push(`Region: ${p.region}`);
    lines.push(`Moving skies: ${p.motion}`);
    lines.push(`Measurements: ${p.units === 'us' ? COPY.unitsUs : COPY.unitsMetric}`);
    lines.push(`Holidays from everywhere: ${p.everywhere ? 'on' : 'off'}`);
    if (p.scheme) lines.push(`Colours: ${p.scheme}`);
    lines.push(`Stickers earned: ${Object.keys(p.stickers).length}`);
    lines.push(`Badges: ${Object.keys(p.badges).length}`);
    lines.push(`Holiday pages visited: ${Object.keys(p.visited).length}`);
    lines.push(`Recipes finished: ${p.recipesDone.length}`);
    lines.push(`Facts flipped: ${p.factsFlipped}`);
    lines.push(`Days opened (last ${OPEN_DAYS_CAP}): ${p.openDays.length}`);
    lines.push(`Birthdays and custom days: ${p.custom.length}`);
    if (Object.keys(p.adventOpened).length > 0) lines.push(`Advent doors opened: ${Object.keys(p.adventOpened).length}`);
    if (p.greetedToday) lines.push(`Last morning hello: ${p.greetedToday}`);
    return lines;
  }
}

let customSeq = 0;

/** `custom-<time><seq>` — unique enough for one device, no crypto needed. */
export function newCustomId(): string {
  customSeq += 1;
  return `custom-${Date.now().toString(36)}${customSeq.toString(36)}`;
}
