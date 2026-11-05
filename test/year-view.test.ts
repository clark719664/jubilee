import { describe, expect, it } from 'vitest';
import { defaultProgress, type Progress } from '../src/app/state';
import { HOLIDAYS } from '../src/content/registry';
import { customToMeta } from '../src/dates/occurrences';
import { formatIso, fromDayNumber, toDayNumber, type CivilDate } from '../src/dates/civil';
import { fmt } from '../src/ui/copy';
import { REGION_NAMES, nextLeapYear, tableUsers, validateCustom } from '../src/ui/grownups';
import { badgeRows, seasonOfMonth, stickerBook, stickerYears } from '../src/ui/sticker-book';
import { dayAngle, monthStarts, nearestIndex, wrapAngle } from '../src/ui/wheel';
import {
  assignLanes, barRuns, clampYear, firstDayOfWeek, holidayColor, monthGrid, usesTable, weekdayHeaders, weekendDays, yearModel,
} from '../src/ui/year';
import { THEMES } from '../src/theme/themes';

const dn = (y: number, m: number, d: number): number => toDayNumber({ y, m, d });
const iso = (n: number): string => formatIso(fromDayNumber(n));
const progress = (patch: Partial<Progress>): Progress => ({ ...defaultProgress('US'), ...patch });

describe('year view: month grid with weekday offsets', () => {
  it('starts each month on the right weekday column for Sunday-first and Monday-first weeks', () => {
    // 1 February 2026 is a Sunday.
    const sun = monthGrid(2026, 2, 0);
    expect(sun.offset).toBe(0);
    expect(sun.rows).toBe(4);
    expect(sun.cells).toHaveLength(28);
    const mon = monthGrid(2026, 2, 1);
    expect(mon.offset).toBe(6);
    expect(mon.rows).toBe(5);
    // 1 January 2026 is a Thursday; the 31st is a Saturday in the last column of row 4.
    const jan = monthGrid(2026, 1, 0);
    expect(jan.offset).toBe(4);
    expect(jan.cells[30]).toMatchObject({ d: 31, weekday: 6, row: 4, col: 6 });
    expect(monthGrid(2024, 2, 0).cells).toHaveLength(29);
    // August 2026 starts on a Saturday: six rows in a Sunday-first grid.
    expect(monthGrid(2026, 8, 0)).toMatchObject({ offset: 6, rows: 6 });
  });

  it('every cell lands on its own weekday column', () => {
    for (const first of [0, 1, 6] as const) {
      for (let m = 1; m <= 12; m++) {
        for (const c of monthGrid(2027, m, first).cells) expect((c.col + first) % 7).toBe(c.weekday);
      }
    }
  });

  it('reads the first day of the week and headers from Intl', () => {
    expect(firstDayOfWeek('en-US')).toBe(0);
    expect(firstDayOfWeek('en-GB')).toBe(1);
    expect(firstDayOfWeek('not a locale!!')).toBe(0);
    expect(weekendDays('en-US').sort()).toEqual([0, 6]);
    expect(weekdayHeaders('en-US', 0, 'short')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(weekdayHeaders('en-GB', 1, 'short')[0]).toBe('Mon');
    expect(weekdayHeaders('en-GB', 1, 'short')[6]).toBe('Sun');
  });

  it('clamps route years to 2024–2035', () => {
    expect(clampYear(2019)).toBe(2024);
    expect(clampYear(2040)).toBe(2035);
    expect(clampYear(2030)).toBe(2030);
  });
});

describe('year view: multi-day bars across month and year boundaries', () => {
  it('Kwanzaa 2026 splits at the year end; the Jan 1 tail belongs to 2027', () => {
    const start = dn(2026, 12, 26);
    const end = dn(2027, 1, 1);
    expect(barRuns(start, end, 2026)).toEqual([{ month: 12, from: 26, to: 31, capStart: true, capEnd: false }]);
    expect(barRuns(start, end, 2027)).toEqual([{ month: 1, from: 1, to: 1, capStart: false, capEnd: true }]);
    expect(barRuns(start, end, 2025)).toEqual([]);
  });

  it('Lunar New Year 2026 (15 days) splits at the month end', () => {
    const start = dn(2026, 2, 17);
    expect(barRuns(start, start + 14, 2026)).toEqual([
      { month: 2, from: 17, to: 28, capStart: true, capEnd: false },
      { month: 3, from: 1, to: 3, capStart: false, capEnd: true },
    ]);
  });

  it('Ramadan 2030 (second) runs from late December into 2031', () => {
    const model = yearModel(HOLIDAYS, 2030, 'US');
    const ramadans = model.list.filter((e) => e.meta.id === 'ramadan');
    expect(ramadans.map((e) => iso(e.occ.main))).toEqual(['2030-01-05', '2030-12-26']);
    const second = ramadans[1]!;
    const runs = barRuns(second.occ.start, second.occ.end, 2030);
    expect(runs).toEqual([{ month: 12, from: 26, to: 31, capStart: true, capEnd: false }]);
  });

  it('assigns the lowest free lane to overlapping spans', () => {
    expect(assignLanes([{ start: 1, end: 5 }, { start: 3, end: 8 }, { start: 6, end: 9 }, { start: 2, end: 3 }])).toEqual([0, 2, 0, 1]);
    expect(assignLanes([])).toEqual([]);
  });

  it('year model: dots on main days, bars for long spans, spill-over from the previous year', () => {
    const m2027 = yearModel(HOLIDAYS, 2027, 'US');
    expect(m2027.dots.get(dn(2027, 12, 25))?.map((e) => e.meta.id)).toContain('christmas');
    const barIds = new Set(m2027.bars.map((b) => b.entry.meta.id));
    for (const id of ['hanukkah', 'diwali', 'kwanzaa', 'lunar-new-year', 'ramadan']) expect(barIds.has(id)).toBe(true);
    // Kwanzaa 2026 ends on 1 Jan 2027: a bar in 2027, but its dot (main 26 Dec 2026) is not.
    const kwanzaaBars = m2027.bars.filter((b) => b.entry.meta.id === 'kwanzaa').map((b) => iso(b.entry.occ.start));
    expect(kwanzaaBars).toEqual(['2026-12-26', '2027-12-26']);
    expect(m2027.list.filter((e) => e.meta.id === 'kwanzaa')).toHaveLength(1);
    // List is in date order.
    const mains = m2027.list.map((e) => e.occ.main);
    expect([...mains].sort((a, b) => a - b)).toEqual(mains);
    expect(m2027.missing).toEqual([]);
    expect(m2027.bars.every((b) => b.lane < 3)).toBe(true);
  });

  it('silly days can be hidden; custom days join', () => {
    const custom = customToMeta({ id: 'custom-maya', name: 'Maya’s birthday', emoji: '🎂', month: 5, day: 9 });
    const m = yearModel([...HOLIDAYS, custom], 2027, 'GB', { silly: false });
    expect(m.list.some((e) => e.meta.tier === 3)).toBe(false);
    expect(m.dots.get(dn(2027, 5, 9))?.[0]?.meta.id).toBe('custom-maya');
  });

  it('table holidays beyond coverage are reported, never approximated', () => {
    const m = yearModel(HOLIDAYS, 2036, 'US');
    const ids = m.missing.map((x) => x.id);
    expect(ids).toContain('lunar-new-year');
    expect(ids).toContain('lantern-festival'); // relative to a table
    expect(ids).not.toContain('halloween');
    expect(m.list.some((e) => e.meta.id === 'halloween')).toBe(true);
    const ruleOf = (id: string) => HOLIDAYS.find((x) => x.id === id)?.rule;
    expect(usesTable(HOLIDAYS.find((x) => x.id === 'chuseok')!, ruleOf)).toBe(true);
    expect(usesTable(HOLIDAYS.find((x) => x.id === 'mothers-day')!, ruleOf)).toBe(false);
  });

  it('bar colours avoid the pale gold accents', () => {
    expect(holidayColor(THEMES.christmas)).toBe(THEMES.christmas.bg2);
    expect(holidayColor(THEMES.kwanzaa)).toBe(THEMES.kwanzaa.accent);
  });
});

describe('sticker book', () => {
  const today: CivilDate = { y: 2026, m: 12, d: 26 };
  const tier12 = HOLIDAYS.filter((m) => m.tier !== 3).length;

  it('groups shelves by the month of the main day', () => {
    expect([12, 1, 2].map(seasonOfMonth)).toEqual(['winter', 'winter', 'winter']);
    expect([3, 5, 6, 8, 9, 11].map(seasonOfMonth)).toEqual(['spring', 'spring', 'summer', 'summer', 'autumn', 'autumn']);
    const book = stickerBook(HOLIDAYS, new Set(), progress({}), 2026, today, 'US');
    const ids = (s: 'winter' | 'spring' | 'summer' | 'autumn') => book.shelves[s].map((e) => e.meta.id);
    expect(ids('autumn')).toEqual(expect.arrayContaining(['diwali', 'halloween', 'thanksgiving']));
    expect(ids('winter')).toEqual(expect.arrayContaining(['christmas', 'kwanzaa', 'lunar-new-year', 'hanukkah']));
    expect(ids('spring')).toEqual(expect.arrayContaining(['easter', 'holi', 'nowruz']));
    expect(ids('summer')).toEqual(expect.arrayContaining(['juneteenth', 'independence-day-us']));
    // Winter reads in date order: January first, December last.
    expect(book.shelves.winter[0]!.occ.main).toBeLessThan(book.shelves.winter.at(-1)!.occ.main);
  });

  it('counts tier 1–2 only: silly days, custom days and other years do not count', () => {
    const custom = customToMeta({ id: 'custom-maya', name: 'Maya', emoji: '🎂', month: 3, day: 2 });
    const p = progress({
      stickers: {
        'diwali:2026': '2026-11-08', 'halloween:2026': '2026-10-31', 'pizza-day:2026': '2026-02-09',
        'custom-maya:2026': '2026-03-02', 'diwali:2025': '2025-10-20',
      },
    });
    const book = stickerBook([...HOLIDAYS, custom], new Set(['custom-maya']), p, 2026, today, 'US');
    expect(book.have).toBe(2);
    expect(book.total).toBe(tier12 - 1); // no Leap Day in 2026
    expect(fmt('stickerCount', { have: book.have, total: book.total })).toBe(`2 of ${tier12 - 1} this year`);
    expect(stickerBook(HOLIDAYS, new Set(), p, 2028, { y: 2028, m: 1, d: 1 }, 'US').total).toBe(tier12);
    expect(book.birthdays).toHaveLength(1);
    expect(book.birthdays[0]).toMatchObject({ state: 'earned', custom: true });
  });

  it('missed is "see you next year", ongoing and upcoming look forward', () => {
    const book = stickerBook(HOLIDAYS, new Set(), progress({ stickers: { 'diwali:2026': '2026-11-08' } }), 2026, today, 'US');
    const all = [...book.shelves.winter, ...book.shelves.spring, ...book.shelves.summer, ...book.shelves.autumn];
    const by = (id: string) => all.find((e) => e.meta.id === id)!;
    expect(by('diwali')).toMatchObject({ state: 'earned', earned: '2026-11-08' });
    expect(by('halloween').state).toBe('missed');
    expect(by('kwanzaa').state).toBe('ongoing'); // Dec 26 is day 1
    expect(by('new-years-eve')).toMatchObject({ state: 'upcoming', sleeps: 5 });
  });

  it('offers this year plus past years with stickers', () => {
    const p = progress({ stickers: { 'diwali:2024': '2024-10-31', 'easter:2025': '2025-04-20', 'halloween:2026': '2026-10-31' } });
    expect(stickerYears(p, 2026)).toEqual([2024, 2025, 2026]);
    expect(stickerYears(progress({}), 2026)).toEqual([2026]);
  });

  it('badge meters fill toward the threshold and are full once earned', () => {
    const rows = badgeRows(progress({
      openDays: ['2026-10-01', '2026-10-02', '2026-10-03'], factsFlipped: 30, badges: { 'fact-finder': '2026-10-02' },
    }), 0);
    const by = (id: string) => rows.find((r) => r.id === id)!;
    expect(by('early-bird')).toMatchObject({ percent: 60, meter: { have: 3, need: 5 } });
    expect(by('fact-finder')).toMatchObject({ percent: 100, earned: '2026-10-02' });
    expect(by('little-chef').percent).toBe(0);
    expect(rows).toHaveLength(5);
  });
});

describe('grown-ups: custom holiday form', () => {
  const ok = { name: 'Maya’s birthday', emoji: '🎂', month: '5', day: '9', year: '' };

  it('accepts a plain birthday, with or without a birth year', () => {
    expect(validateCustom(ok, 2026)).toEqual({ ok: true, value: { name: 'Maya’s birthday', emoji: '🎂', month: 5, day: 9 } });
    expect(validateCustom({ ...ok, year: '2019' }, 2026)).toMatchObject({ ok: true, value: { year: 2019 } });
  });

  it('allows 29 February with a leap-year note, and checks the birth year had one', () => {
    const leap = validateCustom({ ...ok, month: 2, day: 29 }, 2026);
    expect(leap.ok).toBe(true);
    expect(leap.ok && leap.note).toContain('2028');
    expect(validateCustom({ ...ok, month: 2, day: 29, year: '2020' }, 2026).ok).toBe(true);
    const bad = validateCustom({ ...ok, month: 2, day: 29, year: '2019' }, 2026);
    expect(bad.ok).toBe(false);
    expect(!bad.ok && bad.errors.year).toContain('2019');
    expect(nextLeapYear(2028)).toBe(2028);
    expect(nextLeapYear(2029)).toBe(2032);
  });

  it('rejects impossible days, empty names, future or junk years', () => {
    const r1 = validateCustom({ ...ok, month: 2, day: 30 }, 2026);
    expect(!r1.ok && r1.errors.day).toBe('February only has 29 days.');
    const r2 = validateCustom({ ...ok, month: 4, day: 31 }, 2026);
    expect(!r2.ok && r2.errors.day).toBe('April only has 30 days.');
    const r3 = validateCustom({ ...ok, name: '   ' }, 2026);
    expect(!r3.ok && r3.errors.name).toBeTruthy();
    const r4 = validateCustom({ ...ok, year: '2030' }, 2026);
    expect(!r4.ok && r4.errors.year).toBeTruthy();
    expect(validateCustom({ ...ok, year: '19' }, 2026).ok).toBe(false);
    expect(validateCustom({ ...ok, month: '13' }, 2026).ok).toBe(false);
    expect(validateCustom({ ...ok, emoji: '💣' }, 2026).ok).toBe(false);
    expect(validateCustom({ ...ok, name: 'x'.repeat(25) }, 2026).ok).toBe(false);
  });

  it('names every region and every table', () => {
    expect(Object.keys(REGION_NAMES)).toHaveLength(8);
    const users = tableUsers(HOLIDAYS);
    expect(users.get('mid-autumn')).toEqual(expect.arrayContaining(['Mid-Autumn Festival', 'Chuseok']));
    expect(users.get('eid-al-fitr')?.some((n) => n.startsWith('Ramadan'))).toBe(true);
    expect(users.size).toBe(13);
  });
});

describe('year wheel geometry', () => {
  it('places days around the ring and finds the nearest holiday', () => {
    expect(dayAngle(0, 365)).toBeCloseTo(Math.PI / 365);
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(wrapAngle(-0.5)).toBeCloseTo(-0.5);
    const angles = [10, 100, 300].map((d) => dayAngle(d, 365));
    expect(nearestIndex(angles, dayAngle(90, 365))).toBe(1);
    expect(nearestIndex(angles, dayAngle(360, 365))).toBe(0); // wraps past New Year
    expect(nearestIndex([], 0)).toBe(-1);
    expect(monthStarts(2028)[2]).toBe(60);
    expect(monthStarts(2027)[2]).toBe(59);
  });
});
