import { describe, expect, it } from 'vitest';
import { FRIDAY, MONDAY, SUNDAY, THURSDAY, formatIso, weekday } from '../src/dates/civil';
import { lastWeekday, nthWeekday } from '../src/dates/nth';

const iso = (y: number, m: number, wd: 0 | 1 | 2 | 3 | 4 | 5 | 6, n: 1 | 2 | 3 | 4): string => formatIso(nthWeekday(y, m, wd, n));

describe('nthWeekday', () => {
  it('US Thanksgiving: 4th Thursday of November, 2024–2035', () => {
    const expected = [
      '2024-11-28', '2025-11-27', '2026-11-26', '2027-11-25', '2028-11-23', '2029-11-22',
      '2030-11-28', '2031-11-27', '2032-11-25', '2033-11-24', '2034-11-23', '2035-11-22',
    ];
    expect(expected.map((_, i) => iso(2024 + i, 11, THURSDAY, 4))).toEqual(expected);
  });

  it("Mother's Day: 2nd Sunday of May, 2024–2035", () => {
    const expected = [
      '2024-05-12', '2025-05-11', '2026-05-10', '2027-05-09', '2028-05-14', '2029-05-13',
      '2030-05-12', '2031-05-11', '2032-05-09', '2033-05-08', '2034-05-14', '2035-05-13',
    ];
    expect(expected.map((_, i) => iso(2024 + i, 5, SUNDAY, 2))).toEqual(expected);
  });

  it("Father's Day: 3rd Sunday of June, 2024–2035, and AU 1st Sunday of September", () => {
    const expected = [
      '2024-06-16', '2025-06-15', '2026-06-21', '2027-06-20', '2028-06-18', '2029-06-17',
      '2030-06-16', '2031-06-15', '2032-06-20', '2033-06-19', '2034-06-18', '2035-06-17',
    ];
    expect(expected.map((_, i) => iso(2024 + i, 6, SUNDAY, 3))).toEqual(expected);
    expect(iso(2026, 9, SUNDAY, 1)).toBe('2026-09-06');
  });

  it('MLK Day, Labor Day, Canadian Thanksgiving / Indigenous Peoples Day', () => {
    expect(iso(2026, 1, MONDAY, 3)).toBe('2026-01-19');
    expect(iso(2027, 1, MONDAY, 3)).toBe('2027-01-18');
    expect(iso(2026, 9, MONDAY, 1)).toBe('2026-09-07');
    expect(iso(2026, 10, MONDAY, 2)).toBe('2026-10-12');
    expect(iso(2027, 10, MONDAY, 2)).toBe('2027-10-11');
  });

  it('silly days: Donut Day, Ice Cream Day, World Smile Day', () => {
    expect(iso(2026, 6, FRIDAY, 1)).toBe('2026-06-05');
    expect(iso(2026, 7, SUNDAY, 3)).toBe('2026-07-19');
    expect(iso(2026, 10, FRIDAY, 1)).toBe('2026-10-02');
  });

  it('always lands on the requested weekday inside the month', () => {
    for (let y = 2024; y <= 2035; y++) {
      for (let m = 1; m <= 12; m++) {
        for (const wd of [0, 1, 2, 3, 4, 5, 6] as const) {
          for (const n of [1, 2, 3, 4] as const) {
            const c = nthWeekday(y, m, wd, n);
            expect(c.m).toBe(m);
            expect(weekday(c)).toBe(wd);
            expect(c.d).toBe(nthWeekday(y, m, wd, 1).d + 7 * (n - 1));
          }
        }
      }
    }
  });
});

describe('lastWeekday', () => {
  it('Memorial Day: last Monday of May', () => {
    const cases: Record<number, string> = {
      2024: '2024-05-27', 2025: '2025-05-26', 2026: '2026-05-25', 2027: '2027-05-31',
      2028: '2028-05-29', 2032: '2032-05-31', 2035: '2035-05-28',
    };
    for (const [y, expected] of Object.entries(cases)) {
      expect(formatIso(lastWeekday(Number(y), 5, MONDAY))).toBe(expected);
    }
  });

  it('is the last such weekday of the month for every month 2024–2035', () => {
    for (let y = 2024; y <= 2035; y++) {
      for (let m = 1; m <= 12; m++) {
        for (const wd of [0, 1, 2, 3, 4, 5, 6] as const) {
          const c = lastWeekday(y, m, wd);
          expect(c.m).toBe(m);
          expect(weekday(c)).toBe(wd);
          expect(c.d + 7).toBeGreaterThan(28);
        }
      }
    }
  });
});
