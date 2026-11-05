import { describe, expect, it } from 'vitest';
import { formatIso, parseIso, toDayNumber } from '../src/dates/civil';
import { TABLES } from '../src/dates/tables/index';
import type { TableId } from '../src/dates/tables/types';
import {
  DHU_AL_HIJJAH, MUHARRAM, RAMADAN, SHAWWAL, civilToIslamic, fixedFromIslamic, islamicFromFixed, islamicLeapYear, islamicToCivil,
} from './oracles/islamic';

const FIRST_AH = 1445;

describe('Islamic (tabular) oracle self-checks', () => {
  it('has 11 leap years per 30-year cycle and 354/355-day years', () => {
    let leaps = 0;
    for (let y = 1441; y <= 1470; y++) {
      if (islamicLeapYear(y)) leaps++;
      const len = fixedFromIslamic(y + 1, MUHARRAM, 1) - fixedFromIslamic(y, MUHARRAM, 1);
      expect(len).toBe(islamicLeapYear(y) ? 355 : 354);
    }
    expect(leaps).toBe(11);
  });

  it('round-trips fixed ↔ islamic and knows 1 Muharram AH 1 = Julian 622-07-16 (Gregorian 622-07-19)', () => {
    expect(islamicToCivil(1, MUHARRAM, 1)).toEqual({ y: 622, m: 7, d: 19 });
    for (let rd = 738_000; rd < 743_000; rd += 97) {
      const d = islamicFromFixed(rd);
      expect(fixedFromIslamic(d.year, d.month, d.day)).toBe(rd);
      expect(d.month).toBeGreaterThanOrEqual(1);
      expect(d.month).toBeLessThanOrEqual(12);
      expect(d.day).toBeGreaterThanOrEqual(1);
      expect(d.day).toBeLessThanOrEqual(30);
    }
  });

  it('places 1 Ramadan 1445 on 2024-03-11, matching Umm al-Qura that year', () => {
    expect(formatIso(islamicToCivil(1445, RAMADAN, 1))).toBe('2024-03-11');
    expect(civilToIslamic(parseIso('2024-03-11')!)).toEqual({ year: 1445, month: RAMADAN, day: 1 });
  });
});

describe('sighting tables are within 2 days of the tabular calendar (AH 1445–1457)', () => {
  const check = (id: TableId, month: number, day: number): void => {
    const rows = TABLES[id].rows;
    rows.forEach((row, i) => {
      const ah = FIRST_AH + i;
      const expected = toDayNumber(islamicToCivil(ah, month, day));
      const actual = toDayNumber(parseIso(row.date)!);
      expect(Math.abs(actual - expected), `${id} ${row.date} vs tabular AH ${ah} (${formatIso(islamicToCivil(ah, month, day))})`).toBeLessThanOrEqual(2);
    });
    expect(FIRST_AH + rows.length - 1).toBeLessThanOrEqual(1457);
  };

  it('ramadan-start ≈ 1 Ramadan', () => check('ramadan-start', RAMADAN, 1));
  it('eid-al-fitr ≈ 1 Shawwal', () => check('eid-al-fitr', SHAWWAL, 1));
  it('eid-al-adha ≈ 10 Dhu al-Hijjah', () => check('eid-al-adha', DHU_AL_HIJJAH, 10));

  it('each row really is in the expected Islamic month once shifted by the tolerance', () => {
    for (const [id, month] of [['ramadan-start', RAMADAN], ['eid-al-fitr', SHAWWAL], ['eid-al-adha', DHU_AL_HIJJAH]] as const) {
      TABLES[id].rows.forEach((row, i) => {
        const d = civilToIslamic(parseIso(row.date)!);
        // A sighting a day or two early can land on the last days of the previous month.
        const inMonth = d.month === month || (d.month === month - 1 && d.day >= 28);
        expect(inMonth, `${id} ${row.date} → AH ${d.year}-${d.month}-${d.day}`).toBe(true);
        expect(d.year).toBe(d.month === month ? FIRST_AH + i : FIRST_AH + i);
      });
    }
  });
});
