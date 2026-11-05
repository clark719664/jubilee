import { beforeEach, describe, expect, it } from 'vitest';
import type { AppContext } from '../src/app/context';
import { loadContent } from '../src/content/loader';
import { HOLIDAYS, byId, tier1 } from '../src/content/registry';
import type { HolidayContent, HolidayMeta } from '../src/content/types';
import { civil, toDayNumber, type CivilDate } from '../src/dates/civil';
import { nextOccurrence, previousOccurrence } from '../src/dates/occurrences';
import { mulberry32 } from '../src/effects/rng';
import {
  ADVENT_MAIN_DAY, JUST_AFTER_DAYS, MAX_COUNTDOWN_DOORS, boardDoors, boardOrder, boardYear, canOpen, doorView, fallbackDoors, featured,
  moonFill, phaseOf, skinFor, splitJoke, unlockedCount, type BoardDoor, type Phase,
} from '../src/play/doors/logic';
import {
  DOORS_KEY, adventMemory, doorKey, forgetPretendPeeks, keyedMemory, readOpened, type KeyValueStorage,
} from '../src/play/doors/memory';
import { COPY, fill, notYetText } from '../src/play/doors/copy';

const meta = (id: string): HolidayMeta => byId(id)!;

/** The phase the board would show for a holiday on a given day (US). */
function phaseFor(id: string, today: CivilDate, firstOpensAt: number): Phase {
  return phaseOf(nextOccurrence(HOLIDAYS, id, today, 'US'), previousOccurrence(HOLIDAYS, id, today, 'US'), today, firstOpensAt);
}

const doorsOf = (n: number): BoardDoor[] =>
  Array.from({ length: n }, (_, i) => ({ n: n - i, opensAt: n - i, kind: 'fact' as const, text: `Door ${n - i}` }));

function memStorage(seed?: string): KeyValueStorage & { data: Map<string, string>; writes: number } {
  const data = new Map<string, string>();
  if (seed !== undefined) data.set(DOORS_KEY, seed);
  const s = {
    data, writes: 0,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { s.writes++; data.set(k, v); },
  };
  return s;
}

describe('boardDoors', () => {
  it('gives Christmas its 24 advent doors, door d opening at 25 − d sleeps', async () => {
    const content = await loadContent('christmas');
    const doors = boardDoors(meta('christmas'), content);
    expect(doors).toHaveLength(24);
    expect(doors.map((d) => d.n).sort((a, b) => a - b)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    for (const d of doors) expect(d.opensAt).toBe(ADVENT_MAIN_DAY - d.n);
    // First to open first.
    expect(doors[0]!.n).toBe(1);
    expect(doors[23]!.n).toBe(24);
  });

  it('gives every tier-1 holiday a full board (12 countdown doors, or Christmas’s 24)', async () => {
    for (const m of tier1()) {
      const content = await loadContent(m.id);
      const doors = boardDoors(m, content);
      expect(doors.length, m.id).toBe(m.id === 'christmas' ? 24 : MAX_COUNTDOWN_DOORS);
      expect(new Set(doors.map((d) => d.n)).size, m.id).toBe(doors.length);
      for (const d of doors) {
        expect(d.text.length, `${m.id} door ${d.n}`).toBeGreaterThan(0);
        if (d.kind === 'say') expect(d.greeting, `${m.id} door ${d.n}`).toBeDefined();
      }
    }
  });

  it('resolves say doors to the greeting they name, clamping a bad index', () => {
    const base: HolidayContent = {
      summary: 's', facts: [], recipes: [], crafts: [], greetings: [
        { lang: 'fr', langName: 'French', text: 'Bonjour', sayIt: 'bon-ZHOOR', meaning: 'Hello' },
        { lang: 'es', langName: 'Spanish', text: 'Hola', sayIt: 'OH-lah', meaning: 'Hello' },
      ],
      doors: [
        { sleeps: 3, kind: 'say', text: 'Say it', greeting: 1 },
        { sleeps: 2, kind: 'say', text: 'Say it again', greeting: 9 },
        { sleeps: 1, kind: 'joke', text: 'Why? Because!' },
        { sleeps: 1, kind: 'fact', text: 'duplicate sleeps is dropped' },
        { sleeps: 40, kind: 'fact', text: 'out of range is dropped' },
      ],
    } as unknown as HolidayContent;
    const doors = boardDoors(meta('diwali'), base);
    expect(doors.map((d) => d.n)).toEqual([3, 2, 1]);
    expect(doors[0]!.greeting?.text).toBe('Hola');
    expect(doors[1]!.greeting?.text).toBe('Bonjour');
  });

  it('turns a say door with no greetings into a fact', () => {
    const c = { summary: 's', facts: [], recipes: [], crafts: [], greetings: [], doors: [{ sleeps: 1, kind: 'say', text: 'Hi' }] } as unknown as HolidayContent;
    expect(boardDoors(meta('diwali'), c)[0]!.kind).toBe('fact');
  });

  it('builds a fallback board from facts, greetings and crafts for a tier-1 holiday without doors', async () => {
    const content = await loadContent('diwali');
    const bare = { ...content, doors: undefined } as unknown as HolidayContent;
    const doors = boardDoors(meta('diwali'), bare);
    expect(doors.length).toBeGreaterThanOrEqual(6);
    expect(doors.length).toBeLessThanOrEqual(MAX_COUNTDOWN_DOORS);
    expect(doors[0]!.n).toBe(doors.length);
    expect(doors[doors.length - 1]!.n).toBe(1);
    expect(fallbackDoors({ ...bare, facts: [], greetings: [], crafts: [] }, 'Diwali')[0]?.text).toContain('Diwali');
  });

  it('still fills a board for a holiday with almost no content', () => {
    const lower = HOLIDAYS.find((m) => m.tier !== 1)!;
    const c = { story: ['s'], facts: [{ text: 'a' }], recipes: [], crafts: [], greetings: [] } as unknown as HolidayContent;
    expect(boardDoors(lower, c).length).toBeGreaterThanOrEqual(6);
  });
});

describe('phaseOf (real dates)', () => {
  it('Christmas on 7 December: countdown, 18 sleeps, doors 1–7 open', async () => {
    const doors = boardDoors(meta('christmas'), await loadContent('christmas'));
    const phase = phaseFor('christmas', civil(2026, 12, 7), 24);
    expect(phase).toEqual({ kind: 'countdown', sleeps: 18, year: 2026 });
    expect(unlockedCount(doors, phase)).toBe(7);
    const f = featured(doors, phase);
    expect(f.today?.n).toBe(7);
    expect(f.next?.n).toBe(8);
  });

  it('Christmas in October: far, the first door opens on 1 December', () => {
    const today = civil(2026, 10, 22);
    const phase = phaseFor('christmas', today, 24);
    expect(phase.kind).toBe('far');
    if (phase.kind !== 'far') return;
    expect(phase.sleeps).toBe(toDayNumber(civil(2026, 12, 25)) - toDayNumber(today));
    expect(toDayNumber(today) + phase.firstIn).toBe(toDayNumber(civil(2026, 12, 1)));
    expect(phase.prevYear).toBe(2025);
  });

  it('Christmas Day is celebrating; Boxing week is "after"; February is far again', () => {
    expect(phaseFor('christmas', civil(2026, 12, 25), 24)).toEqual({ kind: 'celebrating', year: 2026 });
    const after = phaseFor('christmas', civil(2026, 12, 30), 24);
    expect(after.kind).toBe('after');
    expect(boardYear(after)).toBe(2026);
    const later = phaseFor('christmas', civil(2027, 1, 25), 24);
    expect(later.kind).toBe('far');
    expect(boardYear(later)).toBe(2027);
  });

  it('Halloween 2026 on 22 October: countdown with 9 sleeps (doors 12…9 open)', async () => {
    const doors = boardDoors(meta('halloween'), await loadContent('halloween'));
    const phase = phaseFor('halloween', civil(2026, 10, 22), 12);
    expect(phase).toEqual({ kind: 'countdown', sleeps: 9, year: 2026 });
    expect(unlockedCount(doors, phase)).toBe(4);
  });

  it('beyond the date tables says so instead of guessing', () => {
    const phase = phaseOf({ beyondCoverage: true }, undefined, civil(2040, 1, 1), 12);
    expect(phase).toEqual({ kind: 'beyond' });
    expect(boardYear(phase)).toBeNull();
  });

  it('stays "after" for a two weeks, then lets go', () => {
    const end = toDayNumber(civil(2026, 3, 1));
    const prev = { holidayId: 'x', year: 2026, start: end, main: end, end } as never;
    const next = (sleeps: number): never => ({ occ: { holidayId: 'x', year: 2027, start: end + 365, main: end + 365, end: end + 365 }, status: { kind: 'upcoming', sleeps } }) as never;
    expect(JUST_AFTER_DAYS).toBe(14);
    expect(phaseOf(next(351), prev, civil(2026, 3, 15), 12)).toEqual({ kind: 'after', year: 2026, daysAgo: 14 });
    expect(phaseOf(next(350), prev, civil(2026, 3, 16), 12).kind).toBe('far');
  });
});

describe('doorView', () => {
  const doors = doorsOf(12);
  const none = (): boolean => false;
  const countdown: Phase = { kind: 'countdown', sleeps: 5, year: 2026 };

  it('locks doors with fewer sleeps than are left, and says how long', () => {
    const v = doorView(doors.find((d) => d.n === 3)!, countdown, none);
    expect(v).toEqual({ state: 'locked', wait: 2, fromLastTime: false });
    expect(canOpen(v)).toBe(false);
    expect(notYetText(v.wait)).toBe('Not yet! 2 more sleeps');
    expect(notYetText(1)).toBe(COPY.notYetOne);
  });

  it('marks today’s door, missed doors as ready, and opened ones as opened', () => {
    const opened = (n: number): boolean => n === 12;
    expect(doorView(doors.find((d) => d.n === 5)!, countdown, opened).state).toBe('today');
    expect(doorView(doors.find((d) => d.n === 9)!, countdown, opened).state).toBe('ready');
    expect(doorView(doors.find((d) => d.n === 12)!, countdown, opened).state).toBe('opened');
  });

  it('opens everything while celebrating and just after', () => {
    for (const phase of [{ kind: 'celebrating', year: 2026 }, { kind: 'after', year: 2026, daysAgo: 3 }] as Phase[]) {
      for (const d of doors) expect(canOpen(doorView(d, phase, none))).toBe(true);
    }
  });

  it('shuts the board when far away but keeps last time’s doors peekable', () => {
    const far: Phase = { kind: 'far', sleeps: 40, firstIn: 28, year: 2027, prevYear: 2026 };
    const lastTime = (n: number): boolean => n === 4;
    const v1 = doorView(doors.find((d) => d.n === 12)!, far, none, lastTime);
    expect(v1).toEqual({ state: 'locked', wait: 28, fromLastTime: false });
    const v4 = doorView(doors.find((d) => d.n === 4)!, far, none, lastTime);
    expect(v4.fromLastTime).toBe(true);
    expect(canOpen(v4)).toBe(true);
    expect(featured(doors, far).next?.n).toBe(12);
    expect(unlockedCount(doors, far)).toBe(0);
  });
});

describe('board helpers', () => {
  it('skins each holiday', () => {
    expect(skinFor(meta('christmas'))).toBe('advent');
    expect(skinFor(meta('diwali'))).toBe('niches');
    expect(skinFor(meta('hanukkah'))).toBe('house');
    expect(skinFor(meta('eid-al-fitr'))).toBe('lanterns');
    expect(skinFor(meta('halloween'))).toBe('haunted');
    expect(skinFor(meta('lunar-new-year'))).toBe('envelopes');
    expect(skinFor(meta('easter'))).toBe('eggs');
    expect(skinFor(meta('thanksgiving'))).toBe('doors');
  });

  it('scatters only the advent calendar, deterministically, without losing a door', () => {
    const doors = doorsOf(24);
    const a = boardOrder(doors, 'advent', mulberry32(7));
    const b = boardOrder(doors, 'advent', mulberry32(7));
    expect(a.map((d) => d.n)).toEqual(b.map((d) => d.n));
    expect(a.map((d) => d.n)).not.toEqual(doors.map((d) => d.n));
    expect([...a].sort((x, y) => x.n - y.n).map((d) => d.n)).toEqual([...doors].sort((x, y) => x.n - y.n).map((d) => d.n));
    expect(boardOrder(doors, 'niches', mulberry32(7))).toEqual(doors);
  });

  it('splits riddles from their answers', () => {
    expect(splitJoke('What do elves learn at school? The elf-abet!')).toEqual({ ask: 'What do elves learn at school?', answer: 'The elf-abet!' });
    expect(splitJoke('Just a sentence.')).toBeNull();
    expect(splitJoke('Ends with a question?')).toBeNull();
  });

  it('waxes the moon from a crescent to full', () => {
    expect(moonFill(0, 12)).toBeCloseTo(0.12);
    expect(moonFill(12, 12)).toBe(1);
    expect(moonFill(6, 12)).toBeGreaterThan(moonFill(3, 12));
    expect(moonFill(1, 0)).toBeCloseTo(0.12);
  });

  it('fills copy templates', () => {
    expect(fill(COPY.countdown, { n: 3, name: 'Diwali' })).toBe('3 sleeps until Diwali!');
    expect(fill('{missing}', {})).toBe('{missing}');
  });
});

describe('door memory', () => {
  beforeEach(() => forgetPretendPeeks());

  it('remembers doors per holiday so numbers never collide', () => {
    const storage = memStorage();
    const diwali = keyedMemory('diwali', { storage, pretending: false });
    const halloween = keyedMemory('halloween', { storage, pretending: false });
    expect(diwali.open(2026, 3)).toBe(true);
    expect(diwali.has(2026, 3)).toBe(true);
    expect(halloween.has(2026, 3)).toBe(false);
    expect(diwali.has(2025, 3)).toBe(false);
    expect(diwali.open(2026, 3)).toBe(false);
    expect(readOpened(storage)).toEqual([doorKey('diwali', 2026, 3)]);
    // A second board (or the holiday-page strip) sees it and keeps both.
    expect(keyedMemory('halloween', { storage, pretending: false }).open(2026, 7)).toBe(true);
    expect(readOpened(storage).sort()).toEqual(['diwali:2026:3', 'halloween:2026:7']);
  });

  it('never writes while pretending, but remembers the peek for the session', () => {
    const storage = memStorage();
    const m = keyedMemory('holi', { storage, pretending: true });
    expect(m.open(2027, 5)).toBe(false);
    expect(m.has(2027, 5)).toBe(true);
    expect(storage.writes).toBe(0);
  });

  it('reads garbage as nothing opened and survives a broken storage', () => {
    expect(readOpened(memStorage('not json'))).toEqual([]);
    expect(readOpened(memStorage('{"opened":["ok:2026:1", 4, "bad key", "x:26:1"]}'))).toEqual(['ok:2026:1']);
    const throwing: KeyValueStorage = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    const m = keyedMemory('holi', { storage: throwing, pretending: false });
    expect(() => m.open(2026, 1)).not.toThrow();
    expect(keyedMemory('holi', { storage: null, pretending: false }).has(2026, 1)).toBe(false);
  });

  it('Christmas shares the advent record in Progress and never writes while pretending', () => {
    const calls: [number, number][] = [];
    const progress = { adventOpened: {} as Record<string, true> };
    const store = { progress, openAdvent: (y: number, d: number) => { calls.push([y, d]); progress.adventOpened[`${y}-${d}`] = true; return true; } };
    const real = adventMemory({ store, clock: { pretending: false } } as unknown as AppContext);
    expect(real.open(2026, 7)).toBe(true);
    expect(real.has(2026, 7)).toBe(true);
    expect(real.open(2026, 7)).toBe(false);
    const pretend = adventMemory({ store, clock: { pretending: true } } as unknown as AppContext);
    expect(pretend.open(2026, 8)).toBe(false);
    expect(pretend.has(2026, 8)).toBe(true);
    expect(calls).toEqual([[2026, 7]]);
  });
});
