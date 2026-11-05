import type { CustomHoliday, HolidayMeta } from '../content/types';
import { fromDayNumber, toDayNumber, type CivilDate, type DayNumber } from './civil';
import { NO_RULES, observedDay, resolveRule, ruleContextFor, type HolidayId, type Region, type RuleContext } from './rules';
import { dayOf, rowAfter } from './tables/index';

export interface Occurrence {
  readonly holidayId: HolidayId;
  /** First civil day of the span (the eve for beginsAtSundown holidays). */
  readonly start: DayNumber;
  /** Inclusive. */
  readonly end: DayNumber;
  /** Headline day the countdown targets (start + mainDayOffset). */
  readonly main: DayNumber;
  /** Gregorian year of `main` (sticker key). */
  readonly year: number;
  readonly beginsAtSundown: boolean;
  /** Table confidence 'sighting'. */
  readonly approx: boolean;
  /** Widely used alternative main day. */
  readonly alt?: DayNumber;
  /** Kid-safe note ('Year of the Horse'). */
  readonly note?: string;
  /** Day-off date when observedShift moved it (never the countdown target). */
  readonly observed?: DayNumber;
}

export type Status =
  /** today < start; sleeps = main − today. */
  | { readonly kind: 'upcoming'; readonly sleeps: number }
  /**
   * 1-based day within the span; tonight = beginsAtSundown && today === start.
   * `sleepsToMain` is 0 on the main day and negative once it has passed (Diwali's Bhai Dooj = −2).
   */
  | { readonly kind: 'ongoing'; readonly day: number; readonly of: number; readonly sleepsToMain: number; readonly tonight: boolean }
  /** daysAgo counts from the last day of the span (1 = yesterday was the last day). */
  | { readonly kind: 'passed'; readonly daysAgo: number };

export type NextResult = { readonly occ: Occurrence; readonly status: Status } | { readonly beyondCoverage: true };

export interface Upcoming { readonly occ: Occurrence; readonly status: Status }

export type Today = CivilDate;

// ───────── custom holidays (birthdays) ─────────

/** Age reached on the custom day in `year`, when a birth year was given. */
export function ageOn(c: CustomHoliday, year: number): number | undefined {
  return c.year === undefined ? undefined : Math.max(0, year - c.year);
}

/**
 * A parent-added day as a tier-2 holiday: birthday theme, balloons, family tag.
 * Pass `inYear` (the occurrence's year) to light `candles = age` when a birth year is known.
 */
export function customToMeta(c: CustomHoliday, inYear?: number): HolidayMeta {
  const age = inYear === undefined ? undefined : ageOn(c, inYear);
  return {
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    tagline: 'A special day just for our family',
    tier: 2,
    tags: ['family'],
    traditions: ['secular'],
    rule: { kind: 'fixed', month: c.month, day: c.day },
    priority: 5,
    theme: 'birthday',
    effect: 'balloons',
    ...(age !== undefined ? { effectParams: { candles: age } } : {}),
    sticker: { id: c.id, emoji: '🎂', label: 'Birthday Star' },
  };
}

/** The catalog plus the custom days, for the functions that take a single list of metas. */
export function withCustoms(metas: readonly HolidayMeta[], customs: readonly CustomHoliday[]): HolidayMeta[] {
  return customs.length === 0 ? [...metas] : [...metas, ...customs.map((c) => customToMeta(c))];
}

// ───────── expansion ─────────

/** Span length in full days (after the eve), or undefined when an `untilTable` span runs past the table. */
function spanDays(meta: HolidayMeta, anchor: DayNumber): number | undefined {
  const d = meta.days;
  if (d === undefined) return 1;
  if (typeof d === 'number') return d;
  const next = rowAfter(d.untilTable, anchor);
  return next ? dayOf(next.date) - anchor : undefined;
}

/**
 * Every occurrence of `meta` anchored in Gregorian `year` (0, 1 or 2).
 * start = anchor + startOffset − eve; end = start + eve + days − 1; main = start + mainDayOffset.
 * A span that runs "until the next table row" is omitted once the table ends (Ramadan in the last
 * covered year) rather than guessed, which is why coverage must always reach a year ahead.
 */
export function expand(meta: HolidayMeta, year: number, region: Region, ctx: RuleContext = NO_RULES): Occurrence[] {
  const out: Occurrence[] = [];
  for (const r of resolveRule(meta.rule, year, region, ctx)) {
    const anchor = toDayNumber(r.date);
    const days = spanDays(meta, anchor);
    if (days === undefined) continue;
    const eve = meta.beginsAtSundown ? 1 : 0;
    const start = anchor + (meta.startOffset ?? 0) - eve;
    const end = start + eve + days - 1;
    const main = start + (meta.mainDayOffset ?? 0);
    const observed = observedDay(main, meta.observedShift ?? 'none');
    out.push({
      holidayId: meta.id,
      start,
      end,
      main,
      year: fromDayNumber(main).y,
      beginsAtSundown: eve === 1,
      approx: r.approx,
      ...(r.alt ? { alt: toDayNumber(r.alt) + (main - anchor) } : {}),
      ...(r.note !== undefined ? { note: r.note } : {}),
      ...(observed !== main ? { observed } : {}),
    });
  }
  return out;
}

/** Leap Day only exists every fourth year, so its window is scanned further ahead. */
function yearsAhead(meta: HolidayMeta): number {
  const r = meta.rule;
  return r.kind === 'fixed' && r.month === 2 && r.day === 29 ? 4 : 1;
}

interface Catalog {
  readonly metas: readonly HolidayMeta[];
  readonly byId: ReadonlyMap<HolidayId, HolidayMeta>;
  readonly ctx: RuleContext;
}

function catalogOf(metas: readonly HolidayMeta[], customs: readonly CustomHoliday[], ctx?: RuleContext): Catalog {
  const all = withCustoms(metas, customs);
  return { metas: all, byId: new Map(all.map((m) => [m.id, m])), ctx: ctx ?? ruleContextFor(all) };
}

function priorityOf(cat: Catalog, occ: Occurrence): number {
  return cat.byId.get(occ.holidayId)?.priority ?? 0;
}

function nameOf(cat: Catalog, occ: Occurrence): string {
  return cat.byId.get(occ.holidayId)?.name ?? occ.holidayId;
}

/** Same-day tie-break: higher priority first, then name, then id (stable for tests). */
function byPriorityThenName(cat: Catalog): (a: Occurrence, b: Occurrence) => number {
  return (a, b) =>
    priorityOf(cat, b) - priorityOf(cat, a) ||
    nameOf(cat, a).localeCompare(nameOf(cat, b)) ||
    a.holidayId.localeCompare(b.holidayId);
}

/** Occurrences of one holiday for the years `from…to`, sorted by start. */
function occurrencesBetween(cat: Catalog, meta: HolidayMeta, from: number, to: number, region: Region): Occurrence[] {
  const out: Occurrence[] = [];
  const seen = new Set<DayNumber>();
  for (let y = from; y <= to; y++) {
    for (const occ of expand(meta, y, region, cat.ctx)) {
      if (seen.has(occ.start)) continue;
      seen.add(occ.start);
      out.push(occ);
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/**
 * Every occurrence of every holiday (and custom day) around `today`: years today.y − 1 … today.y + 1
 * (Leap Day: … + 4), deduped by (holidayId, start), sorted by start then priority then name.
 */
export function allOccurrences(
  metas: readonly HolidayMeta[], customs: readonly CustomHoliday[], today: Today, region: Region, ctx?: RuleContext,
): Occurrence[] {
  const cat = catalogOf(metas, customs, ctx);
  const out: Occurrence[] = [];
  for (const meta of cat.metas) {
    out.push(...occurrencesBetween(cat, meta, today.y - 1, today.y + yearsAhead(meta), region));
  }
  const tie = byPriorityThenName(cat);
  return out.sort((a, b) => a.start - b.start || tie(a, b));
}

export function statusOf(occ: Occurrence, today: Today): Status {
  const t = toDayNumber(today);
  if (t < occ.start) return { kind: 'upcoming', sleeps: occ.main - t };
  if (t > occ.end) return { kind: 'passed', daysAgo: t - occ.end };
  return {
    kind: 'ongoing',
    day: t - occ.start + 1,
    of: occ.end - occ.start + 1,
    sleepsToMain: occ.main - t,
    tonight: occ.beginsAtSundown && t === occ.start,
  };
}

/** Whether a holiday joins the hero rotation: everywhere-holidays always, region-tagged ones in their regions. */
export function isOnForRegion(meta: HolidayMeta, region: Region, everywhere: boolean): boolean {
  return meta.regions === undefined || meta.regions.includes(region) || everywhere;
}

/** How far ahead a single-holiday scan looks; Leap Day needs 4 years, tables simply run out. */
const SCAN_AHEAD = 4;

/**
 * The first occurrence whose span has not ended. Nothing found means the holiday depends on a
 * table that ends before the next occurrence → `beyondCoverage` (the UI says the calendar ends).
 */
export function nextOccurrence(metas: readonly HolidayMeta[], holidayId: HolidayId, today: Today, region: Region): NextResult {
  const cat = catalogOf(metas, []);
  const meta = cat.byId.get(holidayId);
  if (!meta) return { beyondCoverage: true };
  const t = toDayNumber(today);
  const occ = occurrencesBetween(cat, meta, today.y - 1, today.y + SCAN_AHEAD, region).find((o) => o.end >= t);
  return occ ? { occ, status: statusOf(occ, today) } : { beyondCoverage: true };
}

/** The most recent occurrence whose span has ended (for the "we just celebrated" ribbon). */
export function previousOccurrence(
  metas: readonly HolidayMeta[], holidayId: HolidayId, today: Today, region: Region,
): Occurrence | undefined {
  const cat = catalogOf(metas, []);
  const meta = cat.byId.get(holidayId);
  if (!meta) return undefined;
  const t = toDayNumber(today);
  const past = occurrencesBetween(cat, meta, today.y - SCAN_AHEAD, today.y, region).filter((o) => o.end < t);
  return past[past.length - 1];
}

/**
 * Hero candidates: tier 1–2 holidays and custom days that are on for the region, whose main day
 * is today or later, sorted by (main, start, −priority, name). Hero = [0]; "After that…" = `afterThat`.
 */
export function nextUp(
  metas: readonly HolidayMeta[], customs: readonly CustomHoliday[], today: Today, region: Region, everywhere: boolean,
): Upcoming[] {
  const cat = catalogOf(metas, customs);
  const t = toDayNumber(today);
  const tie = byPriorityThenName(cat);
  return allOccurrences(cat.metas, [], today, region, cat.ctx)
    .filter((occ) => {
      const meta = cat.byId.get(occ.holidayId);
      return meta !== undefined && meta.tier !== 3 && isOnForRegion(meta, region, everywhere) && occ.main >= t;
    })
    .sort((a, b) => a.main - b.main || a.start - b.start || tie(a, b))
    .map((occ) => ({ occ, status: statusOf(occ, today) }));
}

/** The next `n` distinct holidays after the hero (`list[0]`). */
export function afterThat(list: readonly Upcoming[], n = 3): Upcoming[] {
  const out: Upcoming[] = [];
  const seen = new Set<HolidayId>(list[0] ? [list[0].occ.holidayId] : []);
  for (const u of list.slice(1)) {
    if (seen.has(u.occ.holidayId)) continue;
    seen.add(u.occ.holidayId);
    out.push(u);
    if (out.length === n) break;
  }
  return out;
}

/** Every occurrence (all tiers, all regions) with start ≤ today ≤ end, sorted by (−priority, name). */
export function happeningNow(
  metas: readonly HolidayMeta[], customs: readonly CustomHoliday[], today: Today, region: Region,
): Occurrence[] {
  const cat = catalogOf(metas, customs);
  const t = toDayNumber(today);
  return allOccurrences(cat.metas, [], today, region, cat.ctx)
    .filter((occ) => occ.start <= t && t <= occ.end)
    .sort(byPriorityThenName(cat));
}

/** Occurrences whose main day is today, plus those that begin at sundown tonight (stacked hero copy). */
export function stackedToday(
  metas: readonly HolidayMeta[], customs: readonly CustomHoliday[], today: Today, region: Region,
): Occurrence[] {
  const cat = catalogOf(metas, customs);
  const t = toDayNumber(today);
  return allOccurrences(cat.metas, [], today, region, cat.ctx)
    .filter((occ) => occ.main === t || (occ.beginsAtSundown && occ.start === t))
    .sort(byPriorityThenName(cat));
}

/** The occurrences of one holiday anchored in `year` (two for Ramadan 2030 and Eid al-Fitr 2033). */
export function occurrencesForYear(metas: readonly HolidayMeta[], holidayId: HolidayId, year: number, region: Region): Occurrence[] {
  const cat = catalogOf(metas, []);
  const meta = cat.byId.get(holidayId);
  return meta ? occurrencesBetween(cat, meta, year, year, region) : [];
}

/**
 * Up to three occurrences after the current one (`nextOccurrence`), for the Dates section.
 * Fewer come back when a table runs out: nothing past coverage is ever invented.
 */
export function nextThree(metas: readonly HolidayMeta[], holidayId: HolidayId, today: Today, region: Region): Occurrence[] {
  const cat = catalogOf(metas, []);
  const meta = cat.byId.get(holidayId);
  if (!meta) return [];
  const t = toDayNumber(today);
  // Leap Day needs 4 years per occurrence; 17 years ahead covers the current one plus three more.
  const future = occurrencesBetween(cat, meta, today.y - 1, today.y + 17, region).filter((o) => o.end >= t);
  return future.slice(1, 4);
}
