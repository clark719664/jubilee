/**
 * home-view.test.ts — the pure parts of Home, the hero, Celebration Mode and the Parade: the counter model
 * (milestones, moon row, sundown nights, multi-day spans), the New Year's Eve clock and its throttled
 * announcements, the stacked "Today is Christmas… and tonight Hanukkah begins!" copy, per-night effect params,
 * the hello and name-card rules, and the Parade's filtering,
 * sorting, badges, variants, "we just celebrated" ribbon and roving-grid geometry. Node only (no DOM).
 */
import { describe, expect, it } from 'vitest';
import { HOLIDAYS, byId } from '../src/content/registry';
import type { HolidayMeta } from '../src/content/types';
import { civil, toDayNumber, type CivilDate } from '../src/dates/civil';
import {
  customToMeta, nextOccurrence, stackedToday, statusOf, type Occurrence, type Status, type Upcoming,
} from '../src/dates/occurrences';
import { cannonKey, earnedText, nextWhen } from '../src/ui/celebrate';
import { COPY } from '../src/ui/copy';
import {
  MOONS_MAX, clockAnnounceKey, clockSpeech, counterModel, formatClock, happyNewYear, isNewYearsEveClock, moonRow,
  nyeBreakdown, sleepsLabel, totalSeconds,
} from '../src/ui/countdown';
import {
  ARTBOARD, PARALLAX_PX, effectParamsFor, layerShift, mascotSleeps, observedDayOff, pointerRatio, sceneFitHeight,
  seedFor, sleepsToMain, stackedCopy,
} from '../src/ui/hero';
import {
  helloDue, helloHi, isCelebration, latestStickers, nameCardDue, pickGreeting,
} from '../src/ui/home';
import {
  PARADE_CHIPS, chipMatches, groupByMonth, justCelebrated, monthKey, nextIndex, paradeEntries, sortParade, stripBadge,
  variantRegion, verticalNeighbor, whenBadge, type Box, type ParadeEntry,
} from '../src/ui/parade';

const meta = (id: string): HolidayMeta => {
  const m = byId(id);
  if (!m) throw new Error(`no holiday ${id}`);
  return m;
};

/** The current/next occurrence of a holiday on a given day (US). */
function at(id: string, y: number, m: number, d: number): Upcoming {
  const r = nextOccurrence(HOLIDAYS, id, civil(y, m, d), 'US');
  if ('beyondCoverage' in r) throw new Error(`${id} beyond coverage`);
  return r;
}

function model(id: string, y: number, m: number, d: number) {
  const u = at(id, y, m, d);
  return counterModel(meta(id), u.occ, u.status);
}

// ───────────────────────────────────────────────────────── counter

describe('moon row', () => {
  it('draws one moon per sleep, at most 30, and says +N beyond', () => {
    expect(moonRow(0)).toEqual({ shown: 0, more: 0 });
    expect(moonRow(1)).toEqual({ shown: 1, more: 0 });
    expect(moonRow(7)).toEqual({ shown: 7, more: 0 });
    expect(moonRow(MOONS_MAX)).toEqual({ shown: 30, more: 0 });
    expect(moonRow(31)).toEqual({ shown: 30, more: 1 });
    expect(moonRow(1096)).toEqual({ shown: 30, more: 1066 });
  });
  it('never draws negative or broken rows', () => {
    expect(moonRow(-3)).toEqual({ shown: 0, more: 0 });
    expect(moonRow(Number.NaN)).toEqual({ shown: 0, more: 0 });
    expect(moonRow(2.7)).toEqual({ shown: 2, more: 0 });
  });
});

describe('counter model', () => {
  it('counts sleeps to an upcoming holiday', () => {
    const m = model('halloween', 2026, 10, 24);
    expect(m).toMatchObject({ kind: 'sleeps', sleeps: 7, label: 'sleeps until Halloween', todayIs: null, milestone: null });
    expect(m.speech).toBe('7 sleeps until Halloween');
  });

  it('uses the singular for one sleep', () => {
    expect(sleepsLabel(1, 'Halloween')).toBe('sleep until Halloween');
    expect(model('halloween', 2026, 10, 30)).toMatchObject({ label: 'sleep until Halloween', milestone: 'ONE MORE SLEEP!!!' });
  });

  it('adds milestone copy at 100, 50, 10, 3, 1', () => {
    expect(model('halloween', 2026, 7, 23)).toMatchObject({ sleeps: 100, milestone: COPY['milestone.100'] });
    expect(model('halloween', 2026, 9, 11)).toMatchObject({ sleeps: 50, milestone: 'Halfway-ish!' });
    expect(model('halloween', 2026, 10, 21)).toMatchObject({ sleeps: 10, milestone: 'Ten sleeps. Start the wiggles.' });
    expect(model('halloween', 2026, 10, 28)).toMatchObject({ sleeps: 3, milestone: 'THREE. Deep breaths.' });
    expect(model('halloween', 2026, 10, 12)).toMatchObject({ sleeps: 19, milestone: null });
  });

  it('names the day while a span is under way before its headline day (Diwali 2025, Dhanteras)', () => {
    const m = model('diwali', 2025, 10, 18);
    expect(m).toMatchObject({ kind: 'sleeps', sleeps: 2, todayIs: 'Today is Dhanteras!' });
    expect(m.speech).toBe('2 sleeps until Diwali. Today is Dhanteras!');
  });

  it("says IT'S TODAY! with the day's own name on the headline day", () => {
    expect(model('christmas', 2026, 12, 25)).toMatchObject({ kind: 'today', tonight: false, word: "IT'S TODAY!", dayLabel: 'Christmas Day' });
    expect(model('halloween', 2026, 10, 31)).toMatchObject({ kind: 'today', dayLabel: null });
    expect(model('eid-al-fitr', 2026, 3, 20)).toMatchObject({ kind: 'today', dayLabel: 'Day 1 of 3' });
  });

  it('says "Tonight at sundown!" on the eve of a sundown holiday', () => {
    expect(model('hanukkah', 2024, 12, 25)).toMatchObject({
      kind: 'today', tonight: true, word: 'Tonight at sundown!', dayLabel: 'First candle tonight!',
    });
  });

  it('counts nights for sundown holidays and names their last day', () => {
    expect(model('hanukkah', 2024, 12, 28)).toMatchObject({ kind: 'day', day: 4, label: 'Night 4 of 8', dayName: null });
    expect(model('hanukkah', 2025, 1, 2)).toMatchObject({ kind: 'day', day: null, label: 'Last day of Hanukkah' });
  });

  it('counts days for other spans, with the day name when there is one', () => {
    expect(model('kwanzaa', 2024, 12, 28)).toMatchObject({ kind: 'day', day: 3, label: 'Day 3 of 7', dayName: 'Ujima (Working Together)' });
    expect(model('lunar-new-year', 2026, 2, 27)).toMatchObject({ kind: 'day', day: 11, label: 'Day 11 of 15', dayName: null });
  });

  it("switches to the clock on New Year's Eve only", () => {
    const u = at('new-years-eve', 2026, 12, 31);
    expect(isNewYearsEveClock(meta('new-years-eve'), u.status)).toBe(true);
    expect(model('new-years-eve', 2026, 12, 31).kind).toBe('clock');
    expect(model('new-years-eve', 2026, 12, 30)).toMatchObject({ kind: 'sleeps', sleeps: 1 });
  });

  it('describes a passed occurrence without a number', () => {
    const u = at('halloween', 2026, 10, 1);
    expect(counterModel(meta('halloween'), u.occ, { kind: 'passed', daysAgo: 2 })).toMatchObject({ kind: 'passed', label: 'we just celebrated!' });
  });
});

describe("New Year's Eve clock", () => {
  it('breaks the time to local midnight into h:m:s', () => {
    expect(nyeBreakdown(new Date(2026, 11, 31, 23, 59, 30))).toEqual({ h: 0, m: 0, s: 30 });
    expect(nyeBreakdown(new Date(2026, 11, 31, 15, 45, 4))).toEqual({ h: 8, m: 14, s: 56 });
    expect(nyeBreakdown(new Date(2026, 11, 31, 23, 59, 59, 999))).toEqual({ h: 0, m: 0, s: 0 });
  });

  it('formats hh:mm:ss', () => {
    expect(formatClock({ h: 7, m: 5, s: 9 })).toBe('07:05:09');
    expect(formatClock({ h: 0, m: 0, s: 0 })).toBe('00:00:00');
    expect(totalSeconds({ h: 1, m: 2, s: 3 })).toBe(3723);
  });

  it('speaks once a minute, then at 10, 3, 2 and 1 seconds and at midnight — never every tick', () => {
    expect(clockAnnounceKey(3600)).toBe('m60');
    expect(clockAnnounceKey(3541)).toBe('m60');
    expect(clockAnnounceKey(3540)).toBe('m59');
    expect(clockAnnounceKey(60)).toBe('m1');
    expect(clockAnnounceKey(59)).toBeNull();
    expect(clockAnnounceKey(10)).toBe('s10');
    expect(clockAnnounceKey(9)).toBeNull();
    expect(clockAnnounceKey(3)).toBe('s3');
    expect(clockAnnounceKey(1)).toBe('s1');
    expect(clockAnnounceKey(0)).toBe('midnight');
    // Replaying the last two hours second by second: 120 minute marks, four seconds, then midnight.
    let last: string | null = null;
    let spoken = 0;
    for (let total = 7200; total >= 0; total--) {
      const key = clockAnnounceKey(total);
      if (key !== null && key !== last) { last = key; spoken++; }
    }
    expect(spoken).toBe(125);
  });

  it('says it in words', () => {
    expect(clockSpeech({ h: 7, m: 12, s: 0 })).toBe('7 hours and 12 minutes until midnight');
    expect(clockSpeech({ h: 7, m: 11, s: 30 })).toBe('7 hours and 12 minutes until midnight');
    expect(clockSpeech({ h: 1, m: 0, s: 0 })).toBe('1 hour until midnight');
    expect(clockSpeech({ h: 0, m: 59, s: 0 })).toBe('59 minutes until midnight');
    expect(clockSpeech({ h: 0, m: 0, s: 45 })).toBe('45 seconds until midnight');
    expect(clockSpeech({ h: 0, m: 0, s: 10 })).toBe('10 seconds to midnight!');
    expect(clockSpeech({ h: 0, m: 0, s: 3 })).toBe('3!');
    expect(clockSpeech({ h: 0, m: 0, s: 0 }, 'Maya')).toBe('Happy New Year, Maya!');
    expect(happyNewYear()).toBe('Happy New Year!');
  });
});

// ───────────────────────────────────────────────────────── hero

describe('stacked copy', () => {
  const items = (day: CivilDate): { name: string; occ: Occurrence }[] =>
    stackedToday(HOLIDAYS, [], day, 'US').map((occ) => ({ name: meta(occ.holidayId).name, occ }));

  it('Christmas 2024 and the first Hanukkah candle', () => {
    const day = civil(2024, 12, 25);
    expect(stackedCopy(items(day), toDayNumber(day))).toBe('Today is Christmas… and tonight Hanukkah begins!');
    expect(stackedCopy([...items(day)].reverse(), toDayNumber(day))).toBe('Today is Christmas… and tonight Hanukkah begins!');
  });

  it('two holidays on the same day', () => {
    const day = civil(2025, 4, 20);
    expect(stackedCopy(items(day), toDayNumber(day))).toBe('Today is Easter and Orthodox Easter!');
  });

  it('nothing to stack on an ordinary holiday', () => {
    const day = civil(2026, 10, 31);
    expect(stackedCopy(items(day), toDayNumber(day))).toBeNull();
  });
});

describe('effect params per night', () => {
  const params = (id: string, y: number, m: number, d: number, mode: 'home' | 'celebrate' = 'home') => {
    const u = at(id, y, m, d);
    return effectParamsFor(meta(id), u.occ, u.status, civil(y, m, d), mode);
  };

  it('lights tonight’s menorah and kinara candles', () => {
    expect(params('hanukkah', 2024, 12, 20).candles).toBe(0);
    expect(params('hanukkah', 2024, 12, 25).candles).toBe(1);
    expect(params('hanukkah', 2024, 12, 28).candles).toBe(4);
    expect(params('kwanzaa', 2024, 12, 30).candles).toBe(5);
  });

  it('grows diyas and sabzeh and fills the moon as the day nears', () => {
    expect(params('diwali', 2025, 10, 18).growth).toBeCloseTo(1 - 2 / 30);
    expect(params('diwali', 2025, 10, 20).growth).toBe(1);
    expect(params('nowruz', 2026, 2, 19).growth).toBe(0);
    expect(params('nowruz', 2026, 3, 21).growth).toBe(1);
    expect(params('mid-autumn-festival', 2026, 9, 10).moonPhase).toBeCloseTo(0.5);
  });

  it('waxes the Ramadan crescent through the month (and leaves Eid alone)', () => {
    expect(params('ramadan', 2030, 12, 30).moonPhase).toBeCloseTo(4 / 28);
    expect(params('ramadan', 2026, 2, 10).moonPhase).toBe(0);
    expect(params('eid-al-fitr', 2026, 3, 20).moonPhase).toBeUndefined();
  });

  it('doubles density in Celebration Mode and keeps the registry params', () => {
    const p = params('juneteenth', 2026, 6, 19, 'celebrate');
    expect(p.density).toBe(2);
    expect(p.variant).toBe('star');
    expect(p.palette).toEqual(meta('juneteenth').effectParams?.palette);
    expect(params('juneteenth', 2026, 6, 19).density).toBeUndefined();
  });

  it('lights a birthday cake with the age', () => {
    const custom = customToMeta({ id: 'custom-maya', name: 'Maya’s birthday', emoji: '🎂', month: 5, day: 9, year: 2018 });
    const day = civil(2026, 5, 1);
    const occ: Occurrence = { holidayId: custom.id, start: toDayNumber(civil(2026, 5, 9)), end: toDayNumber(civil(2026, 5, 9)), main: toDayNumber(civil(2026, 5, 9)), year: 2026, beginsAtSundown: false, approx: false };
    expect(effectParamsFor(custom, occ, statusOf(occ, day), day, 'home', 8).candles).toBe(8);
  });
});

describe('hero helpers', () => {
  const up: Status = { kind: 'upcoming', sleeps: 12 };
  const before: Status = { kind: 'ongoing', day: 1, of: 5, sleepsToMain: 2, tonight: false };
  const after: Status = { kind: 'ongoing', day: 4, of: 5, sleepsToMain: -1, tonight: false };
  const passed: Status = { kind: 'passed', daysAgo: 3 };

  it('sleeps to the headline day and Jubi’s mood', () => {
    expect([sleepsToMain(up), sleepsToMain(before), sleepsToMain(after), sleepsToMain(passed)]).toEqual([12, 2, 0, 0]);
    expect(mascotSleeps(after)).toBe(0);
    expect(mascotSleeps(passed)).toBe(Number.POSITIVE_INFINITY);
  });

  it('shows the observed day off only where it applies', () => {
    const july4 = at('independence-day-us', 2026, 6, 1);
    expect(observedDayOff(meta('independence-day-us'), july4.occ, 'US')).toBe(toDayNumber(civil(2026, 7, 3)));
    expect(observedDayOff(meta('independence-day-us'), july4.occ, 'GB')).toBeNull();
    const canada = nextOccurrence(HOLIDAYS, 'canada-day', civil(2028, 6, 1), 'CA');
    if ('beyondCoverage' in canada) throw new Error('canada');
    expect(observedDayOff(meta('canada-day'), canada.occ, 'CA')).toBe(toDayNumber(civil(2028, 7, 3)));
    expect(observedDayOff(meta('halloween'), at('halloween', 2026, 10, 1).occ, 'US')).toBeNull();
  });

  it('seeds each sky the same way every time', () => {
    expect(seedFor('halloween')).toBe(seedFor('halloween'));
    expect(seedFor('halloween')).not.toBe(seedFor('christmas'));
    expect(seedFor('')).toBeGreaterThan(0);
  });

  it('reads the pointer as −1…1 across the hero, clamped', () => {
    const box = { left: 100, top: 50, width: 400, height: 200 };
    expect(pointerRatio(300, 150, box)).toEqual({ nx: 0, ny: 0 });
    expect(pointerRatio(100, 50, box)).toEqual({ nx: -1, ny: -1 });
    expect(pointerRatio(500, 250, box)).toEqual({ nx: 1, ny: 1 });
    expect(pointerRatio(-900, 9000, box)).toEqual({ nx: -1, ny: 1 });
    expect(pointerRatio(300, 150, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ nx: 0, ny: 0 });
  });

  it('drifts scene layers away from the pointer, nearer layers more, never past 12 px', () => {
    expect(layerShift(1, 1, 1)).toEqual({ x: -PARALLAX_PX, y: -PARALLAX_PX / 2 });
    expect(layerShift(-1, 0, 0.5)).toEqual({ x: 6, y: 0 });
    expect(layerShift(-1, -1, 0.2)).toEqual({ x: 2.4, y: 1.2 });
    expect(layerShift(0.3, -0.7, 0)).toEqual({ x: 0, y: 0 });
    expect(Math.abs(layerShift(1, 1, 5).x)).toBe(PARALLAX_PX);
    expect(layerShift(1, 1, Number.NaN)).toEqual({ x: 0, y: 0 });
  });

  it('grows a scene hero until the picture’s sky holds the copy', () => {
    const sky = ARTBOARD.sky / ARTBOARD.h;
    // Where the artboard's sky line lands in a hero of height H and width W (cover, bottom-anchored).
    const skyLine = (w: number, hgt: number): number => {
      const drawn = Math.max(hgt, (w * ARTBOARD.h) / ARTBOARD.w);
      return hgt - drawn * (1 - sky);
    };
    for (const [w, bottom] of [[390, 270], [390, 380], [1042, 298], [1042, 240], [736, 320]] as const) {
      const fit = sceneFitHeight(w, bottom);
      expect(skyLine(w, fit)).toBeGreaterThanOrEqual(bottom);
      expect(skyLine(w, fit - 2)).toBeLessThan(bottom + 14);
    }
    // A wide hero with little copy stays width-bound (the picture's top is cropped, not its sides).
    expect(sceneFitHeight(1042, 200)).toBeLessThan((1042 * ARTBOARD.h) / ARTBOARD.w);
    expect(sceneFitHeight(0, 300)).toBe(0);
    expect(sceneFitHeight(390, 0)).toBe(0);
  });
});

// ───────────────────────────────────────────────────────── home

describe('home rules', () => {
  const iso = '2026-10-24';

  it('Celebration Mode on the headline day or tonight', () => {
    expect(isCelebration({ kind: 'ongoing', day: 2, of: 2, sleepsToMain: 0, tonight: false })).toBe(true);
    expect(isCelebration({ kind: 'ongoing', day: 1, of: 2, sleepsToMain: 1, tonight: true })).toBe(true);
    expect(isCelebration({ kind: 'ongoing', day: 1, of: 5, sleepsToMain: 2, tonight: false })).toBe(false);
    expect(isCelebration({ kind: 'upcoming', sleeps: 1 })).toBe(false);
    expect(isCelebration(at('christmas', 2026, 12, 25).status)).toBe(true);
    expect(isCelebration(at('christmas', 2026, 12, 24).status)).toBe(false);
  });

  it('the morning hello comes once a day (and stays for that visit)', () => {
    expect(helloDue(undefined, iso, null)).toBe(true);
    expect(helloDue('2026-10-23', iso, null)).toBe(true);
    expect(helloDue(iso, iso, null)).toBe(false);
    expect(helloDue(iso, iso, iso)).toBe(true);
  });

  it('the name card only on the first day, without a name, unless skipped', () => {
    expect(nameCardDue({ openDays: [] }, iso, false)).toBe(true);
    expect(nameCardDue({ openDays: [iso] }, iso, false)).toBe(true);
    expect(nameCardDue({ openDays: ['2026-10-23', iso] }, iso, false)).toBe(false);
    expect(nameCardDue({ name: 'Maya', openDays: [] }, iso, false)).toBe(false);
    expect(nameCardDue({ openDays: [] }, iso, true)).toBe(false);
  });

  it('one greeting per day, the same all day', () => {
    expect(pickGreeting(['a', 'b', 'c'], 4)).toBe('b');
    expect(pickGreeting(['a', 'b', 'c'], 4)).toBe(pickGreeting(['a', 'b', 'c'], 7));
    expect(pickGreeting(['a', 'b', 'c'], -1)).toBe('c');
    expect(pickGreeting([], 1)).toBeNull();
  });

  it('says hello by the clock, with the name when there is one', () => {
    expect(helloHi(9, 'Maya')).toBe('Good morning, Maya!');
    expect(helloHi(9, undefined)).toBe('Good morning!');
    expect(helloHi(15, 'Maya')).toBe('Hello, Maya!');
  });

  it('the newest stickers first', () => {
    const latest = latestStickers({
      'halloween:2026': '2026-10-31', 'diwali:2026': '2026-11-08', 'christmas:2025': '2025-12-25', broken: '2026-12-01',
    }, 2);
    expect(latest).toEqual([
      { holidayId: 'diwali', year: 2026, date: '2026-11-08' },
      { holidayId: 'halloween', year: 2026, date: '2026-10-31' },
    ]);
    expect(latestStickers({}, 3)).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────── parade

describe('parade', () => {
  const feb27 = civil(2026, 2, 27);
  const entries = paradeEntries(HOLIDAYS, feb27, 'US');
  const ids = (list: readonly ParadeEntry[]): string[] => list.map((e) => e.meta.id);

  it('has the eleven chips in spec order', () => {
    expect(PARADE_CHIPS).toEqual([undefined, 'lights', 'sweets', 'spooky', 'spring', 'silly', 'family', 'faith', 'national', 'world', 'mine']);
  });

  it('All shows every tier-1/2 holiday; silly days only under Silly', () => {
    const all = entries.filter((e) => chipMatches(e, undefined));
    expect(all).toHaveLength(52);
    expect(all.every((e) => e.meta.tier !== 3)).toBe(true);
    const silly = entries.filter((e) => chipMatches(e, 'silly'));
    expect(silly.filter((e) => e.meta.tier === 3)).toHaveLength(24);
    expect(ids(silly)).toEqual(expect.arrayContaining(['st-patricks-day', 'pi-day', 'leap-day', 'april-fools-day']));
    expect(silly.every((e) => e.meta.tags.includes('silly'))).toBe(true);
    const lights = entries.filter((e) => chipMatches(e, 'lights'));
    expect(ids(lights)).toEqual(expect.arrayContaining(['christmas', 'hanukkah', 'diwali', 'kwanzaa']));
    expect(entries.filter((e) => chipMatches(e, 'mine'))).toEqual([]);
  });

  it('custom days live under All, Family and My holidays', () => {
    const custom = customToMeta({ id: 'custom-1', name: 'Grandma Day', emoji: '👵', month: 3, day: 3 });
    const list = paradeEntries([...HOLIDAYS, custom], feb27, 'US', (id) => id === 'custom-1');
    const e = list.find((x) => x.meta.id === 'custom-1')!;
    expect(e.next?.occ.main).toBe(toDayNumber(civil(2026, 3, 3)));
    expect([chipMatches(e, undefined), chipMatches(e, 'family'), chipMatches(e, 'mine'), chipMatches(e, 'silly')]).toEqual([true, true, true, false]);
  });

  it('Soonest: what is happening now first, then by headline day', () => {
    const soon = sortParade(entries.filter((e) => chipMatches(e, undefined)), 'soon');
    expect(ids(soon).slice(0, 2)).toEqual(['lunar-new-year', 'ramadan']);
    const rest = soon.slice(2).map((e) => e.next!.occ.main);
    expect(rest).toEqual([...rest].sort((a, b) => a - b));
    expect(soon[soon.length - 1]!.meta.id).toBe('leap-day');
  });

  it('A–Z and By month', () => {
    const az = sortParade(entries, 'az').map((e) => e.meta.name);
    expect(az).toEqual([...az].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })));
    const month = sortParade(entries, 'month');
    const keys = month.map(monthKey);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    const groups = groupByMonth(month);
    expect(groups.map((g) => g.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const g of groups) expect(g.entries.every((e) => Math.floor(monthKey(e) / 100) === g.month)).toBe(true);
  });

  it('badges: sleeps, today, tonight, day of span, next year, end of calendar', () => {
    expect(whenBadge(at('halloween', 2026, 10, 24))).toEqual({ text: 'in 7 sleeps', now: false });
    expect(whenBadge(at('tooth-fairy-day', 2026, 2, 27))).toEqual({ text: 'in 1 sleep', now: false });
    expect(whenBadge(at('leap-day', 2026, 2, 27))).toEqual({ text: 'next in 2028', now: false });
    expect(whenBadge(at('christmas', 2026, 12, 25))).toEqual({ text: 'today!', now: true });
    expect(whenBadge(at('hanukkah', 2026, 12, 4))).toEqual({ text: COPY.tonight, now: true });
    expect(whenBadge(at('kwanzaa', 2026, 12, 28))).toEqual({ text: 'Day 3 of 7', now: true });
    expect(whenBadge(at('diwali', 2025, 10, 18))).toEqual({ text: 'in 2 sleeps', now: true });
    expect(whenBadge(null)).toEqual({ text: COPY.beyondCoverage, now: false });
    const late = paradeEntries(HOLIDAYS, civil(2035, 12, 30), 'US').find((e) => e.meta.id === 'lunar-new-year')!;
    expect(late.next).toBeNull();
  });

  it('strip badges use the day’s own name', () => {
    expect(stripBadge(at('kwanzaa', 2024, 12, 28), meta('kwanzaa')).text).toBe('Ujima (Working Together)');
    expect(stripBadge(at('halloween', 2026, 10, 24), meta('halloween')).text).toBe('in 7 sleeps');
  });

  it('names the region variant', () => {
    expect(variantRegion(meta('thanksgiving'), 'CA')).toBe('Canada');
    expect(variantRegion(meta('thanksgiving'), 'US')).toBeNull();
    expect(variantRegion(meta('mothers-day'), 'GB')).toBe('UK');
    expect(variantRegion(meta('mothers-day'), 'MX')).toBe('Mexico');
    expect(variantRegion(meta('fathers-day'), 'AU')).toBe('Australia');
    expect(variantRegion(meta('halloween'), 'GB')).toBeNull();
  });

  it('"we just celebrated" for a week afterwards', () => {
    const prev = (y: number, m: number, d: number) =>
      paradeEntries(HOLIDAYS, civil(y, m, d), 'US').find((e) => e.meta.id === 'halloween')!.prev;
    expect(justCelebrated(prev(2026, 11, 1), civil(2026, 11, 1))).toBe(true);
    expect(justCelebrated(prev(2026, 11, 7), civil(2026, 11, 7))).toBe(true);
    expect(justCelebrated(prev(2026, 11, 8), civil(2026, 11, 8))).toBe(false);
    expect(justCelebrated(prev(2026, 10, 31), civil(2026, 10, 31))).toBe(false);
    expect(justCelebrated(null, civil(2026, 11, 1))).toBe(false);
  });

  it('roving grid: arrows, Home/End and rows from the layout', () => {
    expect(nextIndex('ArrowRight', 0, 5)).toBe(1);
    expect(nextIndex('ArrowRight', 4, 5)).toBe(4);
    expect(nextIndex('ArrowLeft', 0, 5)).toBe(0);
    expect(nextIndex('Home', 3, 5)).toBe(0);
    expect(nextIndex('End', 0, 5)).toBe(4);
    expect(nextIndex('a', 0, 5)).toBeNull();
    expect(nextIndex('End', 0, 0)).toBeNull();
    // Three columns, seven tiles: the last row holds one tile under the first column.
    const boxes: Box[] = Array.from({ length: 7 }, (_, i) => ({ left: (i % 3) * 110, top: Math.floor(i / 3) * 110, width: 100, height: 100 }));
    expect(verticalNeighbor(boxes, 1, 1)).toBe(4);
    expect(verticalNeighbor(boxes, 4, 1)).toBe(6);
    expect(verticalNeighbor(boxes, 5, 1)).toBe(6);
    expect(verticalNeighbor(boxes, 6, -1)).toBe(3);
    expect(verticalNeighbor(boxes, 0, -1)).toBe(0);
    expect(verticalNeighbor(boxes, 6, 1)).toBe(6);
  });
});

// ───────────────────────────────────────────────────────── celebration

describe('celebration helpers', () => {
  it('fires the cannon once per holiday, year and day', () => {
    expect(cannonKey('halloween', 2026, civil(2026, 10, 31))).toBe('cannon:halloween:2026:2026-10-31');
  });

  it('never doubles the exclamation mark', () => {
    expect(earnedText('Boo!')).toBe('You earned a sticker: Boo!');
    expect(earnedText('Eight Nights')).toBe('You earned a sticker: Eight Nights!');
    expect(earnedText('3.14159')).toBe('You earned a sticker: 3.14159!');
  });

  it('says when the next holiday is', () => {
    expect(nextWhen(at('diwali', 2026, 10, 31))).toBe('in 8 sleeps');
    expect(nextWhen(at('diwali', 2025, 10, 18))).toBe('in 2 sleeps');
  });
});
