import { describe, expect, it } from 'vitest';
import {
  addDays, civil, compare, daysInMonth, diffDays, formatIso, formatLong, formatShort, fromDayNumber, isLeap, isValid, isoOf,
  localMidnight, parseIso, sameDay, toDayNumber, todayLocal, weekday, weekdayOf,
} from '../src/dates/civil';

const TZ = process.env.TZ;

describe('civil: day numbers', () => {
  it('round-trips the epoch and a leap day', () => {
    expect(toDayNumber({ y: 1970, m: 1, d: 1 })).toBe(0);
    expect(fromDayNumber(0)).toEqual({ y: 1970, m: 1, d: 1 });
    expect(weekday({ y: 2024, m: 2, d: 29 })).toBe(4);
    expect(isLeap(2100)).toBe(false);
    expect(parseIso('2025-02-30')).toBeNull();
  });

  it('round-trips every day from 1900 to 2100 with consecutive day numbers', () => {
    let n = toDayNumber({ y: 1900, m: 1, d: 1 });
    for (let y = 1900; y <= 2100; y++) {
      for (let m = 1; m <= 12; m++) {
        const len = daysInMonth(y, m);
        for (let d = 1; d <= len; d++) {
          const c = { y, m, d };
          if (toDayNumber(c) !== n) throw new Error(`toDayNumber(${formatIso(c)}) = ${toDayNumber(c)}, expected ${n}`);
          const back = fromDayNumber(n);
          if (!sameDay(back, c)) throw new Error(`fromDayNumber(${n}) = ${formatIso(back)}, expected ${formatIso(c)}`);
          n++;
        }
      }
    }
    expect(n).toBe(toDayNumber({ y: 2101, m: 1, d: 1 }));
  });

  it('knows weekdays of famous dates (0 = Sunday)', () => {
    expect(weekday({ y: 1970, m: 1, d: 1 })).toBe(4); // Thursday
    expect(weekday({ y: 2000, m: 1, d: 1 })).toBe(6); // Saturday
    expect(weekday({ y: 2024, m: 2, d: 29 })).toBe(4); // Thursday
    expect(weekday({ y: 2026, m: 10, d: 22 })).toBe(4); // Thursday
    expect(weekday({ y: 2026, m: 7, d: 4 })).toBe(6); // Saturday (observed Friday)
    expect(weekdayOf(-1)).toBe(3); // 1969-12-31 was a Wednesday: negative day numbers wrap correctly
  });

  it('applies the Gregorian leap rules', () => {
    expect(isLeap(1900)).toBe(false);
    expect(isLeap(2000)).toBe(true);
    expect(isLeap(2024)).toBe(true);
    expect(isLeap(2100)).toBe(false);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2025, 4)).toBe(30);
    expect(daysInMonth(2025, 12)).toBe(31);
  });

  it('adds and diffs days across month and year ends', () => {
    expect(addDays(civil(2024, 12, 31), 1)).toEqual(civil(2025, 1, 1));
    expect(addDays(civil(2025, 1, 1), -1)).toEqual(civil(2024, 12, 31));
    expect(addDays(civil(2024, 2, 28), 1)).toEqual(civil(2024, 2, 29));
    expect(addDays(civil(2023, 2, 28), 1)).toEqual(civil(2023, 3, 1));
    expect(addDays(civil(2024, 12, 25), 365)).toEqual(civil(2025, 12, 25));
    expect(diffDays(civil(2026, 3, 7), civil(2026, 3, 14))).toBe(7);
    expect(diffDays(civil(2025, 2, 28), civil(2028, 2, 29))).toBe(1096);
    expect(compare(civil(2024, 1, 1), civil(2024, 1, 2))).toBe(-1);
    expect(compare(civil(2024, 1, 2), civil(2024, 1, 2))).toBe(0);
    expect(compare(civil(2025, 1, 1), civil(2024, 12, 31))).toBe(1);
  });
});

describe('civil: ISO parsing and formatting', () => {
  it('parses only strict, real YYYY-MM-DD dates', () => {
    expect(parseIso('2024-02-29')).toEqual({ y: 2024, m: 2, d: 29 });
    expect(parseIso('2023-02-29')).toBeNull();
    expect(parseIso('2025-02-30')).toBeNull();
    expect(parseIso('2024-13-01')).toBeNull();
    expect(parseIso('2024-00-10')).toBeNull();
    expect(parseIso('2024-1-1')).toBeNull();
    expect(parseIso('')).toBeNull();
    expect(parseIso('yesterday')).toBeNull();
    expect(parseIso('2024-02-29T00:00')).toBeNull();
    expect(isValid({ y: 2024, m: 2, d: 29.5 })).toBe(false);
  });

  it('formats ISO with zero padding and from day numbers', () => {
    expect(formatIso({ y: 2026, m: 3, d: 4 })).toBe('2026-03-04');
    expect(isoOf(toDayNumber({ y: 2030, m: 12, d: 26 }))).toBe('2030-12-26');
  });

  it('formats long dates by locale, never raw mm/dd', () => {
    const c = civil(2025, 11, 27);
    expect(formatLong(c, 'en-US')).toBe('Thursday, November 27');
    expect(formatLong(c, 'en-GB')).toMatch(/^Thursday,? 27 November$/);
    expect(formatLong(c, 'en-GB', { year: true })).toMatch(/^Thursday,? 27 November 2025$/);
    expect(formatShort(c, 'en-US')).toBe('Nov 27');
    expect(formatShort(c, 'en-GB')).toBe('27 Nov');
  });
});

describe('civil: Date boundary helpers (TZ pinned by test/setup.ts)', () => {
  it('reads the local civil day with getters, one second before and after midnight', () => {
    const before = new Date(2026, 2, 8, 23, 59, 59);
    expect(todayLocal(before)).toEqual({ y: 2026, m: 3, d: 8 });
    expect(todayLocal(new Date(before.getTime() + 1000))).toEqual({ y: 2026, m: 3, d: 9 });
    expect(todayLocal(new Date(2026, 0, 1, 0, 0, 0))).toEqual({ y: 2026, m: 1, d: 1 });
  });

  it('local midnight is 00:00:00.000 and a DST day is 23 hours long where DST applies', () => {
    const m8 = localMidnight(civil(2026, 3, 8));
    const m9 = localMidnight(civil(2026, 3, 9));
    expect([m8.getHours(), m8.getMinutes(), m8.getSeconds(), m8.getMilliseconds()]).toEqual([0, 0, 0, 0]);
    expect(todayLocal(m8)).toEqual(civil(2026, 3, 8));
    const hours = (m9.getTime() - m8.getTime()) / 3_600_000;
    // 2026-03-08 is the US spring-forward day; Pacific/Kiritimati (second run) has no DST.
    expect(hours).toBe(TZ === 'America/New_York' ? 23 : 24);
    const n1 = localMidnight(civil(2026, 11, 1));
    const n2 = localMidnight(civil(2026, 11, 2));
    expect((n2.getTime() - n1.getTime()) / 3_600_000).toBe(TZ === 'America/New_York' ? 25 : 24);
  });
});
