/**
 * best.ts — the arcade's tiny memory: best score per holiday and mode, plus the last mode and the
 * Easy switch, under its own localStorage key `jubilee.arcade.v1` (not the Fridge, not Progress).
 * Every access is wrapped in try/catch (private mode, blocked storage) and falls back to memory for
 * the session. Nothing is written while the app is pretending a date (`?today=`).
 */
export const ARCADE_KEY = 'jubilee.arcade.v1';

export type ArcadeMode = 'catch' | 'stack';

export interface ArcadeRecord {
  readonly version: 1;
  /** best[holidayId]['catch' | 'stack' | 'catch-easy' | 'stack-easy'] */
  readonly best: Readonly<Record<string, Readonly<Record<string, number>>>>;
  readonly mode?: ArcadeMode;
  readonly easy?: boolean;
}

export interface ArcadeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const EMPTY: ArcadeRecord = { version: 1, best: {} };

export function bestKey(mode: ArcadeMode, easy: boolean): string {
  return easy ? `${mode}-easy` : mode;
}

function sanitize(raw: unknown): ArcadeRecord {
  if (!raw || typeof raw !== 'object') return EMPTY;
  const o = raw as Record<string, unknown>;
  const best: Record<string, Record<string, number>> = {};
  if (o.best && typeof o.best === 'object') {
    for (const [id, v] of Object.entries(o.best as Record<string, unknown>)) {
      if (!v || typeof v !== 'object') continue;
      const row: Record<string, number> = {};
      for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
        if (typeof n === 'number' && Number.isFinite(n) && n >= 0) row[k] = Math.floor(n);
      }
      best[id] = row;
    }
  }
  const out: { version: 1; best: typeof best; mode?: ArcadeMode; easy?: boolean } = { version: 1, best };
  if (o.mode === 'catch' || o.mode === 'stack') out.mode = o.mode;
  if (typeof o.easy === 'boolean') out.easy = o.easy;
  return out;
}

export class ArcadeMemory {
  private rec: ArcadeRecord;
  private readonly storage: ArcadeStorage | null;
  readonly pretending: boolean;

  constructor(opts: { storage?: ArcadeStorage | null; pretending?: boolean } = {}) {
    this.pretending = opts.pretending ?? false;
    this.storage = opts.storage === undefined ? browserStorage() : opts.storage;
    this.rec = EMPTY;
    try {
      const raw = this.storage?.getItem(ARCADE_KEY);
      if (raw) this.rec = sanitize(JSON.parse(raw));
    } catch {
      this.rec = EMPTY;
    }
  }

  best(holidayId: string, mode: ArcadeMode, easy: boolean): number {
    return this.rec.best[holidayId]?.[bestKey(mode, easy)] ?? 0;
  }

  get mode(): ArcadeMode { return this.rec.mode ?? 'catch'; }
  get easy(): boolean { return this.rec.easy ?? false; }

  /** Records a finished round; returns true when it beat the previous best (and was > 0). */
  submit(holidayId: string, mode: ArcadeMode, easy: boolean, score: number): boolean {
    const prev = this.best(holidayId, mode, easy);
    const beat = score > prev && score > 0;
    if (beat) {
      const row = { ...(this.rec.best[holidayId] ?? {}), [bestKey(mode, easy)]: Math.floor(score) };
      this.rec = { ...this.rec, best: { ...this.rec.best, [holidayId]: row } };
      this.persist();
    }
    return beat;
  }

  setPrefs(mode: ArcadeMode, easy: boolean): void {
    if (this.rec.mode === mode && this.rec.easy === easy) return;
    this.rec = { ...this.rec, mode, easy };
    this.persist();
  }

  private persist(): void {
    if (this.pretending) return;
    try { this.storage?.setItem(ARCADE_KEY, JSON.stringify(this.rec)); } catch { /* memory only */ }
  }
}

function browserStorage(): ArcadeStorage | null {
  try {
    const s = globalThis.localStorage;
    return s ?? null;
  } catch {
    return null;
  }
}
