import { describe, expect, it } from 'vitest';
import { formatIso, parseIso, toDayNumber } from '../src/dates/civil';
import { TABLES } from '../src/dates/tables/index';
import {
  ADAR, ADAR_II, KISLEV, NISAN, TISHRI, daysInHebrewYear, hebrewLeapYear, hebrewNewYear, hebrewToCivil,
  hebrewYearStartingIn, lastDayOfHebrewMonth, molad, purimMonth, rdToCivil,
} from './oracles/hebrew';

const yearOf = (iso: string): number => Number(iso.slice(0, 4));

describe('Hebrew oracle self-checks', () => {
  it('knows leap years of the 19-year cycle and year lengths', () => {
    // 5784 (2023–24) and 5787 (2026–27) are leap years; 5785, 5786 are common.
    expect(hebrewLeapYear(5784)).toBe(true);
    expect(hebrewLeapYear(5785)).toBe(false);
    expect(hebrewLeapYear(5786)).toBe(false);
    expect(hebrewLeapYear(5787)).toBe(true);
    for (let y = 5780; y <= 5800; y++) {
      const n = daysInHebrewYear(y);
      expect(hebrewLeapYear(y) ? [383, 384, 385] : [353, 354, 355], `year ${y}`).toContain(n);
      expect(lastDayOfHebrewMonth(TISHRI, y)).toBe(30);
      expect(lastDayOfHebrewMonth(ADAR, y)).toBe(hebrewLeapYear(y) ? 30 : 29);
      if (hebrewLeapYear(y)) expect(lastDayOfHebrewMonth(ADAR_II, y)).toBe(29);
    }
  });

  it('Rosh Hashanah never falls on Sunday, Wednesday or Friday (lo ADU rosh)', () => {
    for (let y = 5700; y <= 5900; y++) {
      const wd = ((toDayNumber(rdToCivil(hebrewNewYear(y))) + 4) % 7 + 7) % 7;
      expect([0, 3, 5], `5${y} new year weekday ${wd}`).not.toContain(wd);
    }
  });

  it('the molad of Tishri lies within a few days before the (possibly postponed) new year', () => {
    for (let y = 5780; y <= 5800; y++) {
      const gap = hebrewNewYear(y) - Math.floor(molad(TISHRI, y));
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThanOrEqual(2);
    }
  });

  it('converts a known date: 1 Tishri 5785 = 2024-10-03, 15 Nisan 5784 = 2024-04-23', () => {
    expect(formatIso(hebrewToCivil(5785, TISHRI, 1))).toBe('2024-10-03');
    expect(formatIso(hebrewToCivil(5784, NISAN, 15))).toBe('2024-04-23');
    expect(hebrewYearStartingIn(2024)).toBe(5785);
  });
});

describe('Hebrew tables agree with the oracle on every row', () => {
  it('rosh-hashanah = 1 Tishri', () => {
    for (const row of TABLES['rosh-hashanah'].rows) {
      const hy = hebrewYearStartingIn(yearOf(row.date));
      expect(formatIso(hebrewToCivil(hy, TISHRI, 1)), `5${hy}`).toBe(row.date);
    }
  });

  it('hanukkah = 25 Kislev', () => {
    for (const row of TABLES.hanukkah.rows) {
      const hy = hebrewYearStartingIn(yearOf(row.date));
      expect(formatIso(hebrewToCivil(hy, KISLEV, 25)), `${hy}`).toBe(row.date);
    }
  });

  it('passover = 15 Nisan (of the Hebrew year that began the previous fall)', () => {
    for (const row of TABLES.passover.rows) {
      const hy = hebrewYearStartingIn(yearOf(row.date) - 1);
      expect(formatIso(hebrewToCivil(hy, NISAN, 15)), `${hy}`).toBe(row.date);
    }
  });

  it('purim = 14 Adar, or 14 Adar II in a leap year', () => {
    for (const row of TABLES.purim.rows) {
      const hy = hebrewYearStartingIn(yearOf(row.date) - 1);
      expect(formatIso(hebrewToCivil(hy, purimMonth(hy), 14)), `${hy}`).toBe(row.date);
    }
    // 5784 and 5787 are leap years → Purim in Adar II.
    expect(purimMonth(5784)).toBe(ADAR_II);
    expect(purimMonth(5785)).toBe(ADAR);
  });

  it('table rows parse to the same day numbers the oracle produces (no off-by-one in conversion)', () => {
    for (const row of TABLES['rosh-hashanah'].rows) {
      const hy = hebrewYearStartingIn(yearOf(row.date));
      expect(toDayNumber(hebrewToCivil(hy, TISHRI, 1))).toBe(toDayNumber(parseIso(row.date)!));
    }
  });
});
