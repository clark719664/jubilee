import { describe, expect, it } from 'vitest';
import { msUntilLocalMidnight } from '../src/app/clock';
import { parseIso, toDayNumber, todayLocal, type CivilDate } from '../src/dates/civil';
import { candlesLit, closeness, finalDayBreakdown, labelFor, milestoneKey, pluralSleeps, sleeps, spanProgress } from '../src/dates/countdown';
import type { Occurrence, Status } from '../src/dates/occurrences';

const TZ = process.env.TZ;
const day = (s: string): CivilDate => {
  const c = parseIso(s);
  if (!c) throw new Error(`bad fixture ${s}`);
  return c;
};
const occ = (start: string, days: number, mainOffset = 0): Occurrence => {
  const s = toDayNumber(day(start));
  return { holidayId: 'x', start: s, end: s + days - 1, main: s + mainOffset, year: day(start).y, beginsAtSundown: false, approx: false };
};

describe('sleeps', () => {
  it('is pure day arithmetic across DST changes', () => {
    expect(sleeps(toDayNumber(day('2026-03-14')), day('2026-03-07'))).toBe(7); // US DST starts 03-08
    expect(sleeps(toDayNumber(day('2026-10-31')), day('2026-10-25'))).toBe(6); // EU change 10-25
    expect(sleeps(toDayNumber(day('2026-10-31')), day('2026-10-31'))).toBe(0);
    expect(sleeps(toDayNumber(day('2028-02-29')), day('2025-02-28'))).toBe(1096);
  });
});

describe('milestoneKey', () => {
  it('fires only on exact milestones', () => {
    expect(milestoneKey(100)).toBe('100');
    expect(milestoneKey(50)).toBe('50');
    expect(milestoneKey(10)).toBe('10');
    expect(milestoneKey(3)).toBe('3');
    expect(milestoneKey(1)).toBe('1');
    expect(milestoneKey(0)).toBe('0');
    for (const n of [99, 51, 11, 4, 2, -1, 1096]) expect(milestoneKey(n)).toBeNull();
  });
});

describe('labelFor', () => {
  const noNames = {};
  const up = (n: number): Status => ({ kind: 'upcoming', sleeps: n });

  it('counts sleeps with a plural and thousands separator', () => {
    expect(labelFor(up(1), noNames)).toBe('1 sleep');
    expect(labelFor(up(2), noNames)).toBe('2 sleeps');
    expect(labelFor(up(12), noNames)).toBe('12 sleeps');
    expect(labelFor(up(1096), noNames)).toBe('1,096 sleeps');
    expect(pluralSleeps(0)).toBe('0 sleeps');
  });

  it('uses the generic ongoing copy', () => {
    expect(labelFor({ kind: 'ongoing', day: 1, of: 9, sleepsToMain: 0, tonight: true }, noNames)).toBe('Tonight at sundown!');
    expect(labelFor({ kind: 'ongoing', day: 1, of: 1, sleepsToMain: 0, tonight: false }, noNames)).toBe("IT'S TODAY!");
    expect(labelFor({ kind: 'ongoing', day: 3, of: 8, sleepsToMain: -2, tonight: false }, noNames)).toBe('Day 3 of 8');
    expect(labelFor({ kind: 'ongoing', day: 1, of: 5, sleepsToMain: 2, tonight: false }, noNames)).toBe('2 sleeps');
  });

  it('prefers the holiday\'s own day names, and labels passed days', () => {
    const names = { dayNames: ['Eve', 'Big day', 'Day after'] };
    expect(labelFor({ kind: 'ongoing', day: 1, of: 3, sleepsToMain: 1, tonight: true }, names)).toBe('Eve');
    expect(labelFor({ kind: 'ongoing', day: 2, of: 3, sleepsToMain: 0, tonight: false }, names)).toBe('Big day');
    expect(labelFor({ kind: 'ongoing', day: 3, of: 3, sleepsToMain: -1, tonight: false }, names)).toBe('Day after');
    expect(labelFor({ kind: 'passed', daysAgo: 1 }, names)).toBe('we just celebrated!');
    expect(labelFor({ kind: 'passed', daysAgo: 7 }, names)).toBe('we just celebrated!');
    expect(labelFor({ kind: 'passed', daysAgo: 30 }, names)).toBe('30 days ago');
  });
});

describe('finalDayBreakdown', () => {
  it('splits the wall-clock remainder to midnight', () => {
    const midnight = new Date(2027, 0, 1, 0, 0, 0, 0);
    expect(finalDayBreakdown(new Date(2026, 11, 31, 23, 59, 30), midnight)).toEqual({ h: 0, m: 0, s: 30 });
    expect(finalDayBreakdown(new Date(2026, 11, 31, 20, 15, 5), midnight)).toEqual({ h: 3, m: 44, s: 55 });
    expect(finalDayBreakdown(new Date(2026, 11, 31, 23, 59, 59, 999), midnight)).toEqual({ h: 0, m: 0, s: 0 });
    expect(finalDayBreakdown(new Date(2027, 0, 1, 0, 0, 1), midnight)).toEqual({ h: 0, m: 0, s: 0 });
  });
});

describe('msUntilLocalMidnight (TZ pinned by test/setup.ts)', () => {
  it('is the true length of a 23-hour and a 25-hour day in America/New_York, 24 h elsewhere', () => {
    const spring = msUntilLocalMidnight(new Date(2026, 2, 8, 0, 0, 0, 0));
    const fall = msUntilLocalMidnight(new Date(2026, 10, 1, 0, 0, 0, 0));
    const plain = msUntilLocalMidnight(new Date(2026, 5, 15, 0, 0, 0, 0));
    if (TZ === 'America/New_York') {
      expect(spring).toBe(23 * 3_600_000);
      expect(fall).toBe(25 * 3_600_000);
    } else {
      expect(spring).toBe(24 * 3_600_000);
      expect(fall).toBe(24 * 3_600_000);
    }
    expect(plain).toBe(24 * 3_600_000);
    expect(msUntilLocalMidnight(new Date(2026, 11, 31, 23, 59, 59, 500))).toBe(500);
  });

  it('always lands exactly on the next civil day\'s midnight', () => {
    for (const now of [new Date(2026, 2, 7, 22, 30), new Date(2026, 2, 8, 1, 59, 59), new Date(2026, 10, 1, 1, 30), new Date(2026, 11, 31, 12)]) {
      const next = new Date(now.getTime() + msUntilLocalMidnight(now));
      expect([next.getHours(), next.getMinutes(), next.getSeconds(), next.getMilliseconds()]).toEqual([0, 0, 0, 0]);
      expect(toDayNumber(todayLocal(next)) - toDayNumber(todayLocal(now))).toBe(1);
    }
  });
});

describe('effect helpers', () => {
  it('candlesLit, spanProgress and closeness', () => {
    const hanukkah = occ('2024-12-25', 9);
    expect(candlesLit(hanukkah, day('2024-12-25'), 8)).toBe(1);
    expect(candlesLit(hanukkah, day('2024-12-28'), 8)).toBe(4);
    expect(candlesLit(hanukkah, day('2025-01-02'), 8)).toBe(8);
    expect(candlesLit(hanukkah, day('2024-12-01'), 8)).toBe(0);
    const ramadan = occ('2030-12-26', 29);
    expect(spanProgress(ramadan, day('2030-12-26'))).toBe(0);
    expect(spanProgress(ramadan, day('2031-01-23'))).toBe(1);
    expect(spanProgress(ramadan, day('2031-01-09'))).toBeCloseTo(0.5, 5);
    expect(spanProgress(occ('2026-10-31', 1), day('2026-10-31'))).toBe(1);
    expect(closeness(0)).toBe(1);
    expect(closeness(15)).toBeCloseTo(0.5, 5);
    expect(closeness(30)).toBe(0);
    expect(closeness(400)).toBe(0);
  });
});
