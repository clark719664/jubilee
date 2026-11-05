import { describe, expect, it } from 'vitest';
import { MONDAY, SUNDAY, THURSDAY, formatIso, fromDayNumber, parseIso, toDayNumber, type CivilDate } from '../src/dates/civil';
import {
  NO_RULES, observedDay, resolveRule, ruleContextFor, type DateRule, type ObservedShift, type Region, type RuleContext,
} from '../src/dates/rules';

const d = (s: string): CivilDate => {
  const c = parseIso(s);
  if (!c) throw new Error(`bad fixture ${s}`);
  return c;
};
const dates = (rule: DateRule, year: number, region: Region = 'US', ctx: RuleContext = NO_RULES): string[] =>
  resolveRule(rule, year, region, ctx).map((r) => formatIso(r.date));

const MOTHERS: DateRule = {
  kind: 'byRegion',
  variants: {
    GB: { kind: 'easter', offset: -21, calendar: 'gregorian' },
    MX: { kind: 'fixed', month: 5, day: 10 },
    FR: { kind: 'custom', id: 'mothers-day-fr' },
  },
  fallback: { kind: 'nthWeekday', month: 5, weekday: SUNDAY, n: 2 },
};
const FATHERS: DateRule = {
  kind: 'byRegion',
  variants: { AU: { kind: 'nthWeekday', month: 9, weekday: SUNDAY, n: 1 } },
  fallback: { kind: 'nthWeekday', month: 6, weekday: SUNDAY, n: 3 },
};
const THANKSGIVING: DateRule = {
  kind: 'byRegion',
  variants: { CA: { kind: 'nthWeekday', month: 10, weekday: MONDAY, n: 2 } },
  fallback: { kind: 'nthWeekday', month: 11, weekday: THURSDAY, n: 4 },
};

describe('resolveRule: fixed', () => {
  it('Feb 29 yields nothing in 2025 and one date in 2028', () => {
    const leap: DateRule = { kind: 'fixed', month: 2, day: 29 };
    expect(dates(leap, 2025)).toEqual([]);
    expect(dates(leap, 2028)).toEqual(['2028-02-29']);
    expect(dates({ kind: 'fixed', month: 10, day: 31 }, 2026)).toEqual(['2026-10-31']);
    expect(resolveRule({ kind: 'fixed', month: 10, day: 31 }, 2026, 'US')[0]?.approx).toBe(false);
  });
});

describe('resolveRule: byRegion and custom', () => {
  it("Mother's Day 2026 per region", () => {
    expect(dates(MOTHERS, 2026, 'US')).toEqual(['2026-05-10']);
    expect(dates(MOTHERS, 2026, 'GB')).toEqual(['2026-03-15']);
    expect(dates(MOTHERS, 2026, 'MX')).toEqual(['2026-05-10']);
    expect(dates(MOTHERS, 2026, 'FR')).toEqual(['2026-05-31']);
    expect(dates(MOTHERS, 2026, 'AU')).toEqual(['2026-05-10']);
    expect(dates(MOTHERS, 2026, 'OTHER')).toEqual(['2026-05-10']);
  });

  it("French Mother's Day moves to June when the last Sunday of May is Pentecost", () => {
    const fr: Record<number, string> = {
      2024: '2024-05-26', 2025: '2025-05-25', 2026: '2026-05-31', 2033: '2033-05-29', 2034: '2034-06-04', 2035: '2035-05-27',
    };
    for (const [y, expected] of Object.entries(fr)) {
      expect(dates(MOTHERS, Number(y), 'FR')).toEqual([expected]);
    }
  });

  it("Father's Day AU and Thanksgiving CA/US", () => {
    expect(dates(FATHERS, 2026, 'AU')).toEqual(['2026-09-06']);
    expect(dates(FATHERS, 2026, 'US')).toEqual(['2026-06-21']);
    expect(dates(THANKSGIVING, 2026, 'CA')).toEqual(['2026-10-12']);
    expect(dates(THANKSGIVING, 2027, 'CA')).toEqual(['2027-10-11']);
    expect(dates(THANKSGIVING, 2026, 'US')).toEqual(['2026-11-26']);
    expect(dates(THANKSGIVING, 2026, 'GB')).toEqual(['2026-11-26']);
  });
});

describe('resolveRule: nthWeekday, lastWeekday, easter', () => {
  it('computes rule kinds directly', () => {
    expect(dates({ kind: 'nthWeekday', month: 1, weekday: MONDAY, n: 3 }, 2026)).toEqual(['2026-01-19']);
    expect(dates({ kind: 'lastWeekday', month: 5, weekday: MONDAY }, 2027)).toEqual(['2027-05-31']);
    expect(dates({ kind: 'easter', offset: 0, calendar: 'gregorian' }, 2025)).toEqual(['2025-04-20']);
    expect(dates({ kind: 'easter', offset: 0, calendar: 'julian' }, 2035)).toEqual(['2035-04-29']);
    expect(dates({ kind: 'easter', offset: -47, calendar: 'gregorian' }, 2028)).toEqual(['2028-02-29']);
  });
});

describe('resolveRule: table', () => {
  it('maps rows with alt, note and approx', () => {
    const diwali = resolveRule({ kind: 'table', table: 'diwali' }, 2024, 'US');
    expect(diwali).toHaveLength(1);
    expect(formatIso(diwali[0]!.date)).toBe('2024-10-31');
    expect(formatIso(diwali[0]!.alt!)).toBe('2024-11-01');
    expect(diwali[0]!.approx).toBe(false);
    expect(diwali[0]!.note).toBeUndefined();

    const lny = resolveRule({ kind: 'table', table: 'lunar-new-year' }, 2026, 'US');
    expect(lny.map((r) => formatIso(r.date))).toEqual(['2026-02-17']);
    expect(lny[0]!.note).toBe('Year of the Horse');
    expect('alt' in lny[0]!).toBe(false);

    const eid = resolveRule({ kind: 'table', table: 'eid-al-fitr' }, 2033, 'US');
    expect(eid.map((r) => formatIso(r.date))).toEqual(['2033-01-02', '2033-12-23']);
    expect(eid.every((r) => r.approx)).toBe(true);
  });

  it('yields nothing beyond coverage, never an approximation', () => {
    expect(dates({ kind: 'table', table: 'lunar-new-year' }, 2036)).toEqual([]);
    expect(dates({ kind: 'table', table: 'hanukkah' }, 2023)).toEqual([]);
  });
});

describe('resolveRule: relative', () => {
  const ctx = ruleContextFor([
    { id: 'lunar-new-year', rule: { kind: 'table', table: 'lunar-new-year' } },
    { id: 'labor-day', rule: { kind: 'nthWeekday', month: 9, weekday: MONDAY, n: 1 } },
    { id: 'christmas', rule: { kind: 'fixed', month: 12, day: 25 } },
    { id: 'diwali', rule: { kind: 'table', table: 'diwali' } },
    { id: 'a', rule: { kind: 'relative', to: 'b', offset: 1 } },
    { id: 'b', rule: { kind: 'relative', to: 'a', offset: 1 } },
    { id: 'self', rule: { kind: 'relative', to: 'self', offset: 0 } },
  ]);
  const lantern: DateRule = { kind: 'relative', to: 'lunar-new-year', offset: 14 };

  it('Lantern Festival = Lunar New Year + 14 for all 12 years', () => {
    const expected = [
      '2024-02-24', '2025-02-12', '2026-03-03', '2027-02-20', '2028-02-09', '2029-02-27',
      '2030-02-17', '2031-02-06', '2032-02-25', '2033-02-14', '2034-03-05', '2035-02-22',
    ];
    for (let i = 0; i < 12; i++) {
      const lny = resolveRule({ kind: 'table', table: 'lunar-new-year' }, 2024 + i, 'US')[0]!;
      expect(formatIso(fromDayNumber(toDayNumber(lny.date) + 14))).toBe(expected[i]);
      expect(dates(lantern, 2024 + i, 'US', ctx)).toEqual([expected[i]]);
    }
    // The anchor's note is not inherited; approx and alt are.
    expect(resolveRule(lantern, 2026, 'US', ctx)[0]!.note).toBeUndefined();
    const dayAfterDiwali = resolveRule({ kind: 'relative', to: 'diwali', offset: 1 }, 2024, 'US', ctx)[0]!;
    expect(formatIso(dayAfterDiwali.alt!)).toBe('2024-11-02');
  });

  it('Grandparents Day = Labor Day + 6 and a year-crossing offset lands in the right year', () => {
    expect(dates({ kind: 'relative', to: 'labor-day', offset: 6 }, 2026, 'US', ctx)).toEqual(['2026-09-13']);
    expect(dates({ kind: 'relative', to: 'christmas', offset: 10 }, 2027, 'US', ctx)).toEqual(['2027-01-04']);
    expect(dates({ kind: 'relative', to: 'christmas', offset: -360 }, 2026, 'US', ctx)).toEqual(['2026-12-30']);
  });

  it('resolves to nothing for an unknown target and throws on a cycle', () => {
    expect(dates({ kind: 'relative', to: 'nope', offset: 1 }, 2026, 'US', ctx)).toEqual([]);
    expect(dates(lantern, 2026, 'US')).toEqual([]);
    expect(() => resolveRule({ kind: 'relative', to: 'a', offset: 0 }, 2026, 'US', ctx)).toThrow(/cycle/);
    expect(() => resolveRule({ kind: 'relative', to: 'self', offset: 0 }, 2026, 'US', ctx)).toThrow(/cycle/);
  });
});

describe('observedDay', () => {
  const obs = (s: string, shift: ObservedShift): string => formatIso(fromDayNumber(observedDay(toDayNumber(d(s)), shift)));

  it('us-federal: Saturday → Friday, Sunday → Monday', () => {
    expect(obs('2026-07-04', 'us-federal')).toBe('2026-07-03');
    expect(obs('2027-12-25', 'us-federal')).toBe('2027-12-24');
    expect(obs('2028-01-01', 'us-federal')).toBe('2027-12-31');
    expect(obs('2033-06-19', 'us-federal')).toBe('2033-06-20');
    expect(obs('2033-12-25', 'us-federal')).toBe('2033-12-26');
    expect(obs('2026-12-25', 'us-federal')).toBe('2026-12-25'); // a Friday stays put
  });

  it('next-monday: Saturday and Sunday → Monday; none: unchanged', () => {
    expect(obs('2028-07-01', 'next-monday')).toBe('2028-07-03');
    expect(obs('2029-07-01', 'next-monday')).toBe('2029-07-02');
    expect(obs('2026-07-01', 'next-monday')).toBe('2026-07-01');
    expect(obs('2026-07-04', 'none')).toBe('2026-07-04');
  });
});
