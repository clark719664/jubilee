import { describe, expect, it } from 'vitest';
import { defaultProgress, load, migrate, save, Store, STORAGE_KEY, type Progress, type StorageLike } from '../src/app/state';

function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  let writes = 0;
  const storage: StorageLike = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => { writes += 1; data.set(k, v); },
    removeItem: (k) => { data.delete(k); },
  };
  return { storage, data, get writes() { return writes; } };
}

const throwingStorage: StorageLike = {
  getItem: () => { throw new Error('SecurityError'); },
  setItem: () => { throw new Error('QuotaExceededError'); },
  removeItem: () => { throw new Error('SecurityError'); },
};

const today = { y: 2026, m: 11, d: 8 };

describe('state: migrate', () => {
  it('returns defaults for empty or garbage input', () => {
    expect(migrate(null)).toEqual(defaultProgress());
    expect(migrate(undefined, 'US').units).toBe('us');
    expect(migrate('{"nope"', 'GB').units).toBe('metric');
    expect(migrate(42)).toEqual(defaultProgress());
    expect(migrate([1, 2, 3])).toEqual(defaultProgress());
  });

  it('salvages valid fields from unknown versions and drops invalid ones', () => {
    const p = migrate({
      version: 7, name: '  Maya  ', region: 'GB', motion: 'sideways', units: 'metric', everywhere: 'yes',
      stickers: { 'diwali:2026': '2026-11-08', 'bad key': '2026-11-08', 'holi:2026': 'not a date' },
      badges: { 'early-bird': '2026-01-05', 'night-owl': '2026-01-05' },
      visited: { diwali: '2026-11-08', 'x y': '2026-11-08' },
      recipesDone: ['diwali/ladoo', 'diwali/ladoo', 'noslash', 7],
      factsFlipped: 3.9, openDays: ['2026-11-07', '2026-11-07', 'junk', '2026-11-08'],
      custom: [{ id: 'custom-1', name: 'Nana', emoji: '🎂', month: 2, day: 29 }, { id: 'custom-2', name: '', emoji: '', month: 13, day: 1 }],
      adventOpened: { '2026-3': true, '2026-4': 'yes', nope: true },
      scheme: 'dark', greetedToday: '2026-11-08',
    });
    expect(p.version).toBe(1);
    expect(p.name).toBe('Maya');
    expect(p.region).toBe('GB');
    expect(p.motion).toBe('auto');
    expect(p.units).toBe('metric');
    expect(p.everywhere).toBe(false);
    expect(p.stickers).toEqual({ 'diwali:2026': '2026-11-08' });
    expect(p.badges).toEqual({ 'early-bird': '2026-01-05' });
    expect(p.visited).toEqual({ diwali: '2026-11-08' });
    expect(p.recipesDone).toEqual(['diwali/ladoo']);
    expect(p.factsFlipped).toBe(3);
    expect(p.openDays).toEqual(['2026-11-07', '2026-11-08']);
    expect(p.custom).toEqual([{ id: 'custom-1', name: 'Nana', emoji: '🎂', month: 2, day: 29 }]);
    expect(p.adventOpened).toEqual({ '2026-3': true });
    expect(p.scheme).toBe('dark');
    expect(p.greetedToday).toBe('2026-11-08');
  });

  it('keeps only the newest 30 open days', () => {
    const days = Array.from({ length: 40 }, (_, i) => `2026-01-${String(i % 28 + 1).padStart(2, '0')}`);
    expect(migrate({ openDays: days }).openDays.length).toBe(28); // distinct first
    const many = Array.from({ length: 35 }, (_, i) => `2026-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String(i % 28 + 1).padStart(2, '0')}`);
    const p = migrate({ openDays: many });
    expect(p.openDays.length).toBe(30);
    expect(p.openDays.at(-1)).toBe(many.at(-1));
  });
});

describe('state: load / save', () => {
  it('round-trips through storage', () => {
    const mem = memoryStorage();
    const p: Progress = { ...defaultProgress('US'), name: 'Theo', factsFlipped: 2 };
    expect(save(p, mem.storage)).toBe(true);
    expect(JSON.parse(mem.data.get(STORAGE_KEY)!).name).toBe('Theo');
    expect(load(mem.storage, 'US')).toEqual(p);
  });

  it('falls back to defaults (and never throws) when storage throws or is missing', () => {
    expect(load(throwingStorage, 'US')).toEqual(defaultProgress('US'));
    expect(load(null)).toEqual(defaultProgress());
    expect(load(memoryStorage({ [STORAGE_KEY]: '{not json' }).storage)).toEqual(defaultProgress());
    expect(save(defaultProgress(), throwingStorage)).toBe(false);
    expect(save(defaultProgress(), null)).toBe(false);
  });
});

describe('state: Store', () => {
  it('persists and notifies on change, in-memory fallback when storage throws', () => {
    const mem = memoryStorage();
    const store = new Store(defaultProgress(), { storage: mem.storage });
    const seen: number[] = [];
    store.subscribe((p) => seen.push(p.factsFlipped));
    store.bumpFacts();
    store.bumpFacts(2);
    expect(seen).toEqual([1, 3]);
    expect(mem.writes).toBe(2);
    expect(JSON.parse(mem.data.get(STORAGE_KEY)!).factsFlipped).toBe(3);

    const fragile = new Store(defaultProgress(), { storage: throwingStorage });
    expect(() => fragile.bumpFacts()).not.toThrow();
    expect(fragile.progress.factsFlipped).toBe(1);
    expect(() => fragile.reset()).not.toThrow();
    expect(fragile.progress.factsFlipped).toBe(0);
  });

  it('earnSticker and awardBadge are idempotent', () => {
    const mem = memoryStorage();
    const store = new Store(defaultProgress(), { storage: mem.storage });
    expect(store.earnSticker('diwali', 2026, today)).toBe(true);
    expect(store.earnSticker('diwali', 2026, { y: 2026, m: 11, d: 9 })).toBe(false);
    expect(store.progress.stickers).toEqual({ 'diwali:2026': '2026-11-08' });
    expect(store.earnSticker('diwali', 2027, today)).toBe(true);
    expect(store.awardBadge('little-chef', today)).toBe(true);
    expect(store.awardBadge('little-chef', today)).toBe(false);
    expect(mem.writes).toBe(3);
  });

  it('openDays are distinct and capped at 30, newest last', () => {
    const store = new Store(defaultProgress(), { storage: null });
    expect(store.markOpenDay(today)).toBe(true);
    expect(store.markOpenDay(today)).toBe(false);
    for (let i = 1; i <= 40; i++) store.markOpenDay({ y: 2027, m: 1 + Math.floor((i - 1) / 28), d: ((i - 1) % 28) + 1 });
    expect(store.progress.openDays.length).toBe(30);
    expect(store.progress.openDays.at(-1)).toBe('2027-02-12');
    expect(new Set(store.progress.openDays).size).toBe(30);
  });

  it('never writes while pretending but still updates in memory', () => {
    const mem = memoryStorage();
    const store = new Store(defaultProgress(), { storage: mem.storage, pretending: true });
    store.earnSticker('halloween', 2030, { y: 2030, m: 10, d: 31 });
    store.markVisited('halloween', { y: 2030, m: 10, d: 31 });
    store.setName('Maya');
    expect(store.progress.stickers['halloween:2030']).toBe('2030-10-31');
    expect(store.progress.name).toBe('Maya');
    expect(mem.writes).toBe(0);
    store.reset();
    expect(mem.data.size).toBe(0);
    store.pretending = false;
    store.bumpFacts();
    expect(mem.writes).toBe(1);
  });

  it('settings setters omit undefined keys (exactOptionalPropertyTypes-safe)', () => {
    const store = new Store(defaultProgress(), { storage: null });
    store.setName('  Theo ');
    expect(store.progress.name).toBe('Theo');
    store.setName('   ');
    expect('name' in store.progress).toBe(false);
    store.setRegion('CA');
    store.setRegion(undefined);
    expect('region' in store.progress).toBe(false);
    store.setScheme('dark');
    expect(store.progress.scheme).toBe('dark');
    store.setScheme(undefined);
    expect('scheme' in store.progress).toBe(false);
    store.setMotion('off');
    store.setUnits('us');
    store.setEverywhere(true);
    expect(store.progress).toMatchObject({ motion: 'off', units: 'us', everywhere: true });
  });

  it('custom holidays, visits, recipes, advent and reset', () => {
    const store = new Store(defaultProgress(), { storage: null, defaultRegion: 'US' });
    const nana = store.addCustom({ name: 'Nana’s birthday', emoji: '🎂', month: 3, day: 9, year: 1950 });
    expect(nana.id.startsWith('custom-')).toBe(true);
    expect(nana.year).toBe(1950);
    const given = store.addCustom({ id: 'custom-x', name: 'Dog day', emoji: '🐶', month: 6, day: 1 });
    expect('year' in given).toBe(false);
    expect(store.progress.custom.map((c) => c.id)).toEqual([nana.id, 'custom-x']);
    expect(store.removeCustom('custom-x')).toBe(true);
    expect(store.removeCustom('custom-x')).toBe(false);
    expect(store.markVisited('holi', today)).toBe(true);
    expect(store.markVisited('holi', { y: 2027, m: 1, d: 1 })).toBe(false);
    expect(store.progress.visited.holi).toBe('2026-11-08');
    expect(store.markRecipeDone('holi', 'lassi')).toBe(true);
    expect(store.markRecipeDone('holi', 'lassi')).toBe(false);
    expect(store.openAdvent(2026, 3)).toBe(true);
    expect(store.openAdvent(2026, 3)).toBe(false);
    store.setGreeted(today);
    expect(store.progress.greetedToday).toBe('2026-11-08');
    expect(store.whatWeStore()).toContain('Recipes finished: 1');
    expect(store.whatWeStore()).toContain('Birthdays and custom days: 1');
    store.reset();
    expect(store.progress).toEqual(defaultProgress('US'));
  });
});
