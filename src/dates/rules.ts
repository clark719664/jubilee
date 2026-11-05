import { SUNDAY, addDays, fromDayNumber, isValid, parseIso, toDayNumber, weekdayOf, type CivilDate, type DayNumber, type Weekday } from './civil';
import { gregorianEaster, julianEaster } from './easter';
import { lastWeekday, nthWeekday } from './nth';
import { TABLES, rowsInYear } from './tables/index';
import type { TableId } from './tables/types';

export type Region = 'US' | 'GB' | 'CA' | 'AU' | 'MX' | 'IN' | 'FR' | 'OTHER';
export const REGIONS: readonly Region[] = ['US', 'GB', 'CA', 'AU', 'MX', 'IN', 'FR', 'OTHER'];

/** Last Sunday of May, or the 1st Sunday of June when that Sunday is Pentecost. */
export type CustomRuleId = 'mothers-day-fr';

/** Kebab-case, unique, used in URLs. */
export type HolidayId = string;

export type DateRule =
  /** Feb 29 → no date in non-leap years. */
  | { readonly kind: 'fixed'; readonly month: number; readonly day: number }
  | { readonly kind: 'nthWeekday'; readonly month: number; readonly weekday: Weekday; readonly n: 1 | 2 | 3 | 4 }
  | { readonly kind: 'lastWeekday'; readonly month: number; readonly weekday: Weekday }
  | { readonly kind: 'easter'; readonly offset: number; readonly calendar: 'gregorian' | 'julian' }
  /** e.g. lantern-festival = lunar-new-year + 14 */
  | { readonly kind: 'relative'; readonly to: HolidayId; readonly offset: number }
  | { readonly kind: 'table'; readonly table: TableId }
  | { readonly kind: 'byRegion'; readonly variants: Partial<Record<Region, DateRule>>; readonly fallback: DateRule }
  | { readonly kind: 'custom'; readonly id: CustomRuleId };

/** 'us-federal': Sat→Fri, Sun→Mon. 'next-monday': Sat/Sun→Mon. */
export type ObservedShift = 'none' | 'us-federal' | 'next-monday';

export interface Resolved {
  readonly date: CivilDate;
  /** true when the source table's confidence is 'sighting'. */
  readonly approx: boolean;
  readonly alt?: CivilDate;
  readonly note?: string;
}

/** What `resolveRule` needs from the outside world (so the dates engine stays free of content imports). */
export interface RuleContext {
  /** Resolve another holiday's rule (for `relative`). */
  readonly ruleOf: (id: HolidayId) => DateRule | undefined;
}

// ───────── resolution ─────────

/** The minimum a `RuleContext` needs; `HolidayMeta` satisfies it structurally. */
export interface RuleSource { readonly id: HolidayId; readonly rule: DateRule }

/** A `RuleContext` over a catalog, for `relative` rules. The engine never imports the registry itself. */
export function ruleContextFor(sources: readonly RuleSource[]): RuleContext {
  const rules = new Map<HolidayId, DateRule>();
  for (const s of sources) rules.set(s.id, s.rule);
  return { ruleOf: (id) => rules.get(id) };
}

/** A context with no other holidays in it: every `relative` rule resolves to nothing. */
export const NO_RULES: RuleContext = { ruleOf: () => undefined };

/** French Mother's Day: last Sunday of May, or the 1st Sunday of June when that Sunday is Pentecost. */
function mothersDayFr(year: number): CivilDate {
  const last = lastWeekday(year, 5, SUNDAY);
  const pentecost = addDays(gregorianEaster(year), 49);
  return toDayNumber(last) === toDayNumber(pentecost) ? nthWeekday(year, 6, SUNDAY, 1) : last;
}

function customRule(id: CustomRuleId, year: number): CivilDate[] {
  switch (id) {
    case 'mothers-day-fr':
      return [mothersDayFr(year)];
  }
}

function exact(date: CivilDate): Resolved {
  return { date, approx: false };
}

/** Table rows are validated by tests, so an unparsable literal is a programming error, not a runtime case. */
function rowDate(iso: string): CivilDate {
  const c = parseIso(iso);
  if (!c) throw new Error(`table row is not a valid date: ${iso}`);
  return c;
}

/**
 * Resolves a rule to the 0, 1 or 2 dates it yields in `year` (Gregorian).
 * `stack` holds the holiday ids being resolved through `relative` rules, so a cycle throws
 * instead of recursing forever.
 */
function resolve(rule: DateRule, year: number, region: Region, ctx: RuleContext, stack: readonly HolidayId[]): Resolved[] {
  switch (rule.kind) {
    case 'fixed': {
      const date = { y: year, m: rule.month, d: rule.day };
      return isValid(date) ? [exact(date)] : [];
    }
    case 'nthWeekday':
      return [exact(nthWeekday(year, rule.month, rule.weekday, rule.n))];
    case 'lastWeekday':
      return [exact(lastWeekday(year, rule.month, rule.weekday))];
    case 'easter': {
      const easter = rule.calendar === 'julian' ? julianEaster(year) : gregorianEaster(year);
      return [exact(addDays(easter, rule.offset))];
    }
    case 'table': {
      const approx = TABLES[rule.table].confidence === 'sighting';
      return rowsInYear(rule.table, year).map((row) => ({
        date: rowDate(row.date),
        approx,
        ...(row.alt !== undefined ? { alt: rowDate(row.alt) } : {}),
        ...(row.note !== undefined ? { note: row.note } : {}),
      }));
    }
    case 'byRegion':
      return resolve(rule.variants[region] ?? rule.fallback, year, region, ctx, stack);
    case 'custom':
      return customRule(rule.id, year).map(exact);
    case 'relative': {
      if (stack.includes(rule.to)) {
        throw new Error(`relative rule cycle: ${[...stack, rule.to].join(' -> ')}`);
      }
      const target = ctx.ruleOf(rule.to);
      if (!target) return [];
      const next = [...stack, rule.to];
      // The anchor may sit in a neighboring year once the offset is added (Christmas + 10 → January).
      const out: Resolved[] = [];
      const seen = new Set<DayNumber>();
      for (const y of [year - 1, year, year + 1]) {
        for (const r of resolve(target, y, region, ctx, next)) {
          const n = toDayNumber(r.date) + rule.offset;
          const date = fromDayNumber(n);
          if (date.y !== year || seen.has(n)) continue;
          seen.add(n);
          // The note belongs to the anchor holiday ('Year of the Horse'); an alt day shifts with the offset.
          out.push({ date, approx: r.approx, ...(r.alt ? { alt: addDays(r.alt, rule.offset) } : {}) });
        }
      }
      return out;
    }
  }
}

/**
 * The 0, 1 or 2 dates a rule yields in `year`.
 * `fixed` Feb 29 → [] in non-leap years; `table` → [] beyond coverage (never an approximation);
 * `relative` → the target's dates for year−1…year+1 plus the offset, kept when they land in `year`.
 */
export function resolveRule(rule: DateRule, year: number, region: Region, ctx: RuleContext = NO_RULES): Resolved[] {
  return resolve(rule, year, region, ctx, []);
}

/**
 * The day-off date for a holiday that falls on a weekend.
 * `us-federal`: Saturday → Friday, Sunday → Monday. `next-monday`: Saturday and Sunday → Monday.
 */
export function observedDay(main: DayNumber, shift: ObservedShift): DayNumber {
  const wd = weekdayOf(main);
  if (shift === 'us-federal') return wd === 6 ? main - 1 : wd === 0 ? main + 1 : main;
  if (shift === 'next-monday') return wd === 6 ? main + 2 : wd === 0 ? main + 1 : main;
  return main;
}
