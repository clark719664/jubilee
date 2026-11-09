/**
 * The Dates section: this occurrence (with a day-by-day breakdown for multi-day holidays), the next three, the
 * day-off chip where the region gets one, the alternative day some calendars use, "we just celebrated", and the
 * honest "my calendar ends in 2035" when a table runs out. Nothing past the tables is ever guessed. `howWeKnow`
 * (the computed rule in words, or the table's source and confidence) goes in the page's grown-ups fold.
 */
import type { AppContext } from '../app/context';
import type { HolidayMeta } from '../content/types';
import { formatLong, fromDayNumber, type CivilDate, type DayNumber } from '../dates/civil';
import { labelFor } from '../dates/countdown';
import type { NextResult, Occurrence } from '../dates/occurrences';
import { TABLES } from '../dates/tables/index';
import { fill, t } from '../i18n/index';
import { COPY, fmt } from './copy';
import { append, h } from './dom';
import { icon } from './icons';
import { compactLines, justCelebratedDays, observedFor, ruleInWords, spanLines } from './sections';

export interface DatesInput {
  readonly next: NextResult;
  readonly previous: Occurrence | undefined;
  readonly following: readonly Occurrence[];
  readonly today: CivilDate;
}

const dayText = (n: DayNumber, locale: string, year = false): string => formatLong(fromDayNumber(n), locale, { year });

/** "Fri, Dec 4 – Sat, Dec 12, 2026" for a multi-day span. */
function rangeText(start: DayNumber, end: DayNumber, locale: string): string {
  const a = fromDayNumber(start);
  const b = fromDayNumber(end);
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .formatRange(new Date(a.y, a.m - 1, a.d, 12), new Date(b.y, b.m - 1, b.d, 12));
}

function shortDay(n: DayNumber, locale: string): string {
  const c = fromDayNumber(n);
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(c.y, c.m - 1, c.d, 12));
}

/** The table behind a holiday's date, following `byRegion` to the variant in use (tables are never region-split today). */
function tableOf(meta: HolidayMeta): keyof typeof TABLES | null {
  return meta.rule.kind === 'table' ? meta.rule.table : null;
}

/** The longest note the hero shows under the date; anything longer is for grown-ups and lives in "How we know". */
const HERO_NOTE_MAX = 32;

/**
 * The part of a date note a child sees in the hero: its first phrase (before any bracketed aside), when it is short —
 * "Year of the Goat" from "Year of the Goat (Korea celebrates Seollal on …)". Long explanations return null.
 */
export function heroNote(note: string | undefined): string | null {
  if (note === undefined) return null;
  const head = note.split(' (')[0]!.trim();
  return head.length > 0 && head.length <= HERO_NOTE_MAX ? head : null;
}

/** For grown-ups: "We work this date out with a rule: …" or "This date comes from a calendar table (…)", plus the honesty notes. */
export function howWeKnow(ctx: AppContext, meta: HolidayMeta, occ: Occurrence | null): HTMLElement {
  const table = tableOf(meta);
  const lines: string[] = [];
  if (table) {
    const t = TABLES[table];
    // The copy already wraps the source in brackets, so a source's own trailing bracket becomes a dash.
    lines.push(fmt('howWeKnowTable', { source: t.source.replace(/\s*\(([^()]*)\)\s*$/, ' — $1') }));
    lines.push(t.confidence === 'sighting' ? COPY.expectedLong : fill('It covers {from} to {to}.', { from: t.coverage.from, to: t.coverage.to }));
  } else {
    const nameOf = (id: string): string | undefined => ctx.metaOf(id)?.name;
    lines.push(fmt('howWeKnowRule', { rule: ruleInWords(meta.rule, ctx.region, nameOf, ctx.locale) }));
  }
  if (occ?.note !== undefined && heroNote(occ.note) !== occ.note) lines.push(/[.!?]$/.test(occ.note) ? occ.note : `${occ.note}.`);
  if (occ?.alt !== undefined) lines.push(`${capital(t(fmt('altDay', { date: dayText(occ.alt, ctx.locale) })))}.`);
  return h('p', {}, lines.join(' '));
}

const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

function chips(ctx: AppContext, meta: HolidayMeta, occ: Occurrence): HTMLElement | null {
  const observed = observedFor(meta, occ, ctx.region);
  const items: HTMLElement[] = [];
  if (occ.approx) items.push(h('span', { class: 'dates-chip' }, icon('moon', 16), COPY.expected));
  if (observed !== null) items.push(h('span', { class: 'dates-chip' }, icon('bed', 16), fmt('dayOff', { date: dayText(observed, ctx.locale) })));
  if (occ.alt !== undefined) items.push(h('span', { class: 'dates-chip' }, fmt('altDay', { date: shortDay(occ.alt, ctx.locale) })));
  return items.length > 0 ? h('div', { class: 'row wrap dates-chips' }, ...items) : null;
}

/** Every day of a multi-day span (long spans keep only the days worth naming), today marked. */
function breakdown(ctx: AppContext, meta: HolidayMeta, occ: Occurrence, today: CivilDate): HTMLElement | null {
  if (occ.end === occ.start) return null;
  const lines = compactLines(spanLines(meta, occ, today));
  return h('ol', { class: 'dates-breakdown', 'aria-label': fill('The days of {name}', { name: meta.name }) },
    ...lines.map((l) => h('li', { class: l.today ? 'dates-day is-today' : 'dates-day' },
      h('span', { class: 'dates-date' }, shortDay(l.n, ctx.locale)),
      ' ',
      h('span', { class: 'dates-what' }, l.name, l.today ? h('span', { class: 'today-tag' }, 'Today') : null),
    )));
}

export function datesBody(ctx: AppContext, meta: HolidayMeta, input: DatesInput): HTMLElement {
  const { next, previous, following, today } = input;
  const out = h('div', { class: 'dates' });
  const celebrated = justCelebratedDays(previous, today);
  if (previous && celebrated !== null) {
    out.append(h('p', { class: 'dates-row just-celebrated' },
      h('span', { 'aria-hidden': 'true' }, '🎉 '),
      h('span', { class: 'dates-what' }, `${capital(t(COPY.justCelebrated))} (${dayText(previous.main, ctx.locale)})`)));
  }
  if ('beyondCoverage' in next) {
    out.append(h('p', { class: 'dates-row is-this' }, icon('year', 20), ' ', COPY.beyondCoverage));
    return out;
  }
  const occ = next.occ;
  append(out, [
    h('div', { class: 'dates-row is-this' },
      h('span', { class: 'dates-date' }, occ.end > occ.start ? rangeText(occ.start, occ.end, ctx.locale) : dayText(occ.main, ctx.locale, true)),
      next.status.kind === 'ongoing' ? h('span', { class: 'dates-what' }, labelFor(next.status, meta)) : null,
    ),
    chips(ctx, meta, occ),
    breakdown(ctx, meta, occ, today),
  ]);
  if (following.length > 0) {
    out.append(
      h('h3', { class: 'h3 sub-title' }, 'Next'),
      h('ul', { class: 'dates-list' }, ...following.map((o) => h('li', { class: 'dates-row' },
        h('span', { class: 'dates-date' }, dayText(o.main, ctx.locale, true)),
        o.approx ? h('span', { class: 'dates-what' }, COPY.expected) : null,
      ))),
    );
  } else if (tableOf(meta)) {
    out.append(h('p', { class: 'dates-row' }, COPY.beyondCoverage));
  }
  return out;
}
