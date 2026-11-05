import { describe, expect, it } from 'vitest';
import { addDays, formatIso, fromDayNumber, toDayNumber } from '../src/dates/civil';
import { gregorianEaster, julianEaster, julianToDayNumber } from '../src/dates/easter';

const GREGORIAN: Record<number, string> = {
  2024: '2024-03-31', 2025: '2025-04-20', 2026: '2026-04-05', 2027: '2027-03-28', 2028: '2028-04-16', 2029: '2029-04-01',
  2030: '2030-04-21', 2031: '2031-04-13', 2032: '2032-03-28', 2033: '2033-04-17', 2034: '2034-04-09', 2035: '2035-03-25',
  1943: '1943-04-25', 1954: '1954-04-18', 2000: '2000-04-23', 2049: '2049-04-18', 2076: '2076-04-19',
};

const ORTHODOX: Record<number, string> = {
  2024: '2024-05-05', 2025: '2025-04-20', 2026: '2026-04-12', 2027: '2027-05-02', 2028: '2028-04-16', 2029: '2029-04-08',
  2030: '2030-04-28', 2031: '2031-04-13', 2032: '2032-05-02', 2033: '2033-04-24', 2034: '2034-04-09', 2035: '2035-04-29',
  1943: '1943-04-25', 1954: '1954-04-25', 2000: '2000-04-30',
};

describe('gregorianEaster (Meeus / Jones / Butcher)', () => {
  it('matches the verified fixtures', () => {
    for (const [y, expected] of Object.entries(GREGORIAN)) {
      expect(formatIso(gregorianEaster(Number(y)))).toBe(expected);
    }
  });

  it('is always a Sunday between 22 March and 25 April', () => {
    for (let y = 1900; y <= 2199; y++) {
      const e = gregorianEaster(y);
      expect(((toDayNumber(e) + 4) % 7 + 7) % 7).toBe(0);
      expect(e.m * 100 + e.d).toBeGreaterThanOrEqual(322);
      expect(e.m * 100 + e.d).toBeLessThanOrEqual(425);
    }
  });

  it('offsets: Pancake Day −47, Mothering Sunday −21, Good Friday −2, Pentecost +49', () => {
    const pancake: Record<number, string> = { 2024: '2024-02-13', 2025: '2025-03-04', 2026: '2026-02-17', 2027: '2027-02-09', 2028: '2028-02-29' };
    for (const [y, expected] of Object.entries(pancake)) {
      expect(formatIso(addDays(gregorianEaster(Number(y)), -47))).toBe(expected);
    }
    expect(formatIso(addDays(gregorianEaster(2026), -21))).toBe('2026-03-15');
    expect(formatIso(addDays(gregorianEaster(2026), -2))).toBe('2026-04-03');
    expect(formatIso(addDays(gregorianEaster(2034), 49))).toBe('2034-05-28');
  });
});

describe('julianEaster (Meeus Julian → Gregorian)', () => {
  it('matches the verified Orthodox fixtures, including 2035-04-29', () => {
    for (const [y, expected] of Object.entries(ORTHODOX)) {
      expect(formatIso(julianEaster(Number(y)))).toBe(expected);
    }
  });

  it('is always a Sunday on or after the Gregorian date', () => {
    for (let y = 1900; y <= 2099; y++) {
      const o = toDayNumber(julianEaster(y));
      expect(((o + 4) % 7 + 7) % 7).toBe(0);
      expect(o).toBeGreaterThanOrEqual(toDayNumber(gregorianEaster(y)));
    }
  });

  it('throws outside 1900–2099 instead of drifting', () => {
    expect(() => julianEaster(1899)).toThrow(RangeError);
    expect(() => julianEaster(2100)).toThrow(RangeError);
    expect(() => julianEaster(2000.5)).toThrow(RangeError);
  });
});

describe('julianToDayNumber (Dershowitz–Reingold fixed-from-julian)', () => {
  it('is 13 days behind the Gregorian calendar in 1900–2099', () => {
    expect(formatIso(fromDayNumber(julianToDayNumber(2024, 4, 22)))).toBe('2024-05-05');
    expect(formatIso(fromDayNumber(julianToDayNumber(2000, 1, 1)))).toBe('2000-01-14');
    expect(julianToDayNumber(1970, 1, 1)).toBe(toDayNumber({ y: 1970, m: 1, d: 14 }));
  });

  it('knows the Julian leap day of 1900 (Gregorian 1900 had none) and the 12-day gap before 1900-03-01', () => {
    expect(formatIso(fromDayNumber(julianToDayNumber(1900, 2, 29)))).toBe('1900-03-13');
    expect(formatIso(fromDayNumber(julianToDayNumber(1900, 2, 1)))).toBe('1900-02-13');
    expect(formatIso(fromDayNumber(julianToDayNumber(1582, 10, 5)))).toBe('1582-10-15');
  });
});
