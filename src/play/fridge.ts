/**
 * fridge.ts — the child's gallery of things they made (cards, colored pages, letters, puzzles solved),
 * kept only on this device under its own localStorage key so the main Progress record stays small.
 *
 * Items are tiny JSON descriptions, never images: a colored page is { pageId, fills }, a card is its
 * layout. The Fridge holds at most 60 items; when full, `add` refuses and tells the caller so the UI can
 * offer to take an old one down. Nothing is ever deleted silently. Nothing is written while the app is
 * pretending a date (`?today=`). Storage failures fall back to memory for the session.
 */
export const FRIDGE_KEY = 'jubilee.fridge.v1';
export const FRIDGE_CAP = 60;

export type FridgeKind = 'card' | 'color' | 'wish' | 'path' | 'story' | 'dressup' | 'pumpkin' | 'monster';

export interface FridgeItem<T = unknown> {
  readonly id: string;
  readonly kind: FridgeKind;
  readonly holidayId: string;
  /** ISO date the child made it. */
  readonly made: string;
  /** Short label for the gallery, e.g. "Card for Grandma". */
  readonly title: string;
  readonly data: T;
}

export interface FridgeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function browserStorage(): FridgeStorage | null {
  try {
    const s = globalThis.localStorage;
    const probe = '__jubilee_fridge_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

function isItem(v: unknown): v is FridgeItem {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.kind === 'string' && typeof o.holidayId === 'string'
    && typeof o.made === 'string' && typeof o.title === 'string' && 'data' in o;
}

export type AddResult = { readonly ok: true; readonly item: FridgeItem } | { readonly ok: false; readonly reason: 'full' | 'pretending' };

export class Fridge {
  private items: FridgeItem[];
  private readonly storage: FridgeStorage | null;
  private readonly listeners = new Set<(items: readonly FridgeItem[]) => void>();
  pretending: boolean;

  constructor(opts: { storage?: FridgeStorage | null; pretending?: boolean } = {}) {
    this.storage = opts.storage === undefined ? browserStorage() : opts.storage;
    this.pretending = opts.pretending ?? false;
    this.items = this.load();
  }

  get storageOk(): boolean {
    return this.storage !== null;
  }

  list(kind?: FridgeKind): readonly FridgeItem[] {
    return kind ? this.items.filter((i) => i.kind === kind) : this.items.slice();
  }

  get(id: string): FridgeItem | undefined {
    return this.items.find((i) => i.id === id);
  }

  add<T>(item: Omit<FridgeItem<T>, 'id'> & { id?: string }): AddResult {
    if (this.pretending) return { ok: false, reason: 'pretending' };
    if (this.items.length >= FRIDGE_CAP) return { ok: false, reason: 'full' };
    const full: FridgeItem = { ...item, id: item.id ?? newId() } as FridgeItem;
    this.items = [...this.items, full];
    this.persist();
    return { ok: true, item: full };
  }

  /** Replace an item the child edited again (same id). */
  update<T>(id: string, data: T, title?: string): boolean {
    if (this.pretending) return false;
    const i = this.items.findIndex((x) => x.id === id);
    if (i < 0) return false;
    const prev = this.items[i]!;
    const next: FridgeItem = { ...prev, data, ...(title !== undefined ? { title } : {}) };
    this.items = this.items.map((x, k) => (k === i ? next : x));
    this.persist();
    return true;
  }

  remove(id: string): void {
    if (this.pretending) return;
    this.items = this.items.filter((i) => i.id !== id);
    this.persist();
  }

  clear(): void {
    this.items = [];
    try { this.storage?.removeItem(FRIDGE_KEY); } catch { /* memory only */ }
    this.emit();
  }

  subscribe(cb: (items: readonly FridgeItem[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private load(): FridgeItem[] {
    try {
      const raw = this.storage?.getItem(FRIDGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : (parsed as { items?: unknown })?.items;
      return Array.isArray(list) ? list.filter(isItem).slice(0, FRIDGE_CAP) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try { this.storage?.setItem(FRIDGE_KEY, JSON.stringify({ version: 1, items: this.items })); } catch { /* memory only */ }
    this.emit();
  }

  private emit(): void {
    for (const cb of this.listeners) cb(this.items);
  }
}

function newId(): string {
  const a = Math.floor(Math.random() * 0xffffffff).toString(36);
  const b = Date.now().toString(36);
  return `f-${b}-${a}`;
}

/** One shared Fridge for the app (created lazily so tests can build their own). */
let shared: Fridge | null = null;
export function fridge(pretending = false): Fridge {
  if (!shared) shared = new Fridge({ pretending });
  shared.pretending = pretending;
  return shared;
}
