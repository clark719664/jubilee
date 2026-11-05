/**
 * Year view (§3.1 `#/year`, `#/year/:year`): twelve little month calendars with a
 * holiday emoji on each main day, coloured bars under the several-day holidays,
 * today's square, weekend tint, a ◀ ▶ switcher clamped to 2024–2035,
 * the optional Year Wheel, and "All holidays in 2027" — the same information as an
 * ordinary list for screen readers and keyboard users (the grid itself is aria-hidden).
 *
 * Every holiday shows here whatever the region (§5.9); the region only changes dates.
 * The pure helpers at the top are what test/year-view.test.ts pins.
 */
import type { ViewFactory } from '../app/context';
import { formatRoute, YEAR_MAX, YEAR_MIN } from '../app/router';
import type { HolidayMeta } from '../content/types';
import {
  daysInMonth, formatLong, formatShort, fromDayNumber, isLeap, toDayNumber, weekdayOf, type DayNumber, type Weekday,
} from '../dates/civil';
import { allOccurrences, type Occurrence } from '../dates/occurrences';
import type { DateRule, Region } from '../dates/rules';
import { relativeLuminance } from '../theme/contrast';
import { THEMES, type Theme } from '../theme/themes';
import { COPY } from './copy';
import { h } from './dom';
import { icon } from './icons';
import { mountWheel, wheelLabel, type WheelInstance, type WheelItem } from './wheel';

// ───────────────────────────────────────────────────────── pure helpers

/** First day of the week for a locale (Sunday in en-US, Monday in en-GB); Sunday when Intl cannot say. */
export function firstDayOfWeek(locale: string): Weekday {
  const info = weekInfo(locale);
  return info ? ((info.firstDay % 7) as Weekday) : 0;
}

/** Weekend days for a locale (Sat + Sun when Intl cannot say). */
export function weekendDays(locale: string): Weekday[] {
  const info = weekInfo(locale);
  return info ? info.weekend.map((d) => (d % 7) as Weekday) : [6, 0];
}

interface WeekInfo { readonly firstDay: number; readonly weekend: readonly number[] }

function weekInfo(locale: string): WeekInfo | null {
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => WeekInfo; weekInfo?: WeekInfo };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    return info && info.firstDay >= 1 && info.firstDay <= 7 ? info : null;
  } catch {
    return null;
  }
}

/** Seven weekday headings starting at `firstDow`, from Intl in the child's locale ("S M T W T F S"). */
export function weekdayHeaders(locale: string, firstDow: Weekday, style: 'narrow' | 'short' | 'long' = 'narrow'): string[] {
  const f = new Intl.DateTimeFormat(locale, { weekday: style });
  // 1 January 2023 was a Sunday, so 1 + w January 2023 is weekday w.
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(2023, 0, 1 + ((firstDow + i) % 7), 12)));
}

export interface MonthCell { readonly d: number; readonly day: DayNumber; readonly weekday: Weekday; readonly row: number; readonly col: number }
export interface MonthGrid { readonly year: number; readonly month: number; readonly offset: number; readonly rows: number; readonly cells: readonly MonthCell[] }

/** A month laid out in a 7-column grid: `offset` blank cells before the 1st, then one cell per day. */
export function monthGrid(year: number, month: number, firstDow: Weekday): MonthGrid {
  const first = toDayNumber({ y: year, m: month, d: 1 });
  const offset = (weekdayOf(first) - firstDow + 7) % 7;
  const n = daysInMonth(year, month);
  const cells: MonthCell[] = [];
  for (let d = 1; d <= n; d++) {
    const idx = offset + d - 1;
    cells.push({ d, day: first + d - 1, weekday: weekdayOf(first + d - 1), row: Math.floor(idx / 7), col: idx % 7 });
  }
  return { year, month, offset, rows: Math.ceil((offset + n) / 7), cells };
}

/** One month's piece of a several-day bar. capStart/capEnd = the span really starts/ends here (rounded ends). */
export interface BarRun { readonly month: number; readonly from: number; readonly to: number; readonly capStart: boolean; readonly capEnd: boolean }

/** The parts of the inclusive span [start, end] inside Gregorian `year`, one run per month. */
export function barRuns(start: DayNumber, end: DayNumber, year: number): BarRun[] {
  const s = Math.max(start, toDayNumber({ y: year, m: 1, d: 1 }));
  const e = Math.min(end, toDayNumber({ y: year, m: 12, d: 31 }));
  const out: BarRun[] = [];
  for (let cur = s; cur <= e;) {
    const c = fromDayNumber(cur);
    const runEnd = Math.min(e, toDayNumber({ y: c.y, m: c.m, d: daysInMonth(c.y, c.m) }));
    out.push({ month: c.m, from: c.d, to: fromDayNumber(runEnd).d, capStart: cur === start, capEnd: runEnd === end });
    cur = runEnd + 1;
  }
  return out;
}

/** Greedy lanes for overlapping spans (lowest free lane), returned in input order. */
export function assignLanes(spans: readonly { readonly start: number; readonly end: number }[]): number[] {
  const order = spans.map((_, i) => i).sort((a, b) => spans[a]!.start - spans[b]!.start || spans[b]!.end - spans[a]!.end);
  const laneEnds: number[] = [];
  const lanes = new Array<number>(spans.length).fill(0);
  for (const i of order) {
    const sp = spans[i]!;
    let lane = laneEnds.findIndex((end) => end < sp.start);
    if (lane < 0) { lane = laneEnds.length; laneEnds.push(sp.end); } else laneEnds[lane] = sp.end;
    lanes[i] = lane;
  }
  return lanes;
}

/** Does this holiday's date come (directly or through `relative`/`byRegion`) from a lookup table? */
export function usesTable(meta: Pick<HolidayMeta, 'rule'>, ruleOf: (id: string) => DateRule | undefined): boolean {
  const seen = new Set<string>();
  const walk = (r: DateRule): boolean => {
    switch (r.kind) {
      case 'table': return true;
      case 'byRegion': return walk(r.fallback) || Object.values(r.variants).some((v) => v !== undefined && walk(v));
      case 'relative': {
        if (seen.has(r.to)) return false;
        seen.add(r.to);
        const to = ruleOf(r.to);
        return to !== undefined && walk(to);
      }
      default: return false;
    }
  };
  return walk(meta.rule);
}

/** Bars are drawn for spans of at least this many days (Eid, Hanukkah, Diwali, Kwanzaa, Lunar New Year, Ramadan…). */
export const BAR_MIN_DAYS = 3;
/** More than this many overlapping bars would cover the day numbers; the list still has them all. */
export const MAX_LANES = 3;

export interface YearEntry { readonly occ: Occurrence; readonly meta: HolidayMeta; readonly span: number }
export interface YearModel {
  readonly year: number;
  /** Main day → holidays on it, highest priority first. */
  readonly dots: ReadonlyMap<DayNumber, readonly YearEntry[]>;
  readonly bars: readonly { readonly entry: YearEntry; readonly lane: number }[];
  /** Every occurrence whose main day is in the year, by date then priority. */
  readonly list: readonly YearEntry[];
  /** Table-based holidays with no occurrence this year ("My calendar for this holiday ends in 2035"). */
  readonly missing: readonly HolidayMeta[];
}

/** Everything the year view draws for `year`. `metas` should already include the custom days. */
export function yearModel(metas: readonly HolidayMeta[], year: number, region: Region, opts: { silly: boolean } = { silly: true }): YearModel {
  const byId = new Map(metas.map((m) => [m.id, m] as const));
  const y0 = toDayNumber({ y: year, m: 1, d: 1 });
  const y1 = toDayNumber({ y: year, m: 12, d: 31 });
  // Mid-year "today" makes the engine expand year−1 … year+1, so spans crossing either edge are present.
  const entries: YearEntry[] = [];
  for (const occ of allOccurrences(metas, [], { y: year, m: 7, d: 1 }, region)) {
    if (occ.end < y0 || occ.start > y1) continue;
    const meta = byId.get(occ.holidayId);
    if (!meta || (!opts.silly && meta.tier === 3)) continue;
    entries.push({ occ, meta, span: occ.end - occ.start + 1 });
  }
  const prio = (e: YearEntry): number => e.meta.priority ?? 0;
  const list = entries
    .filter((e) => e.occ.main >= y0 && e.occ.main <= y1)
    .sort((a, b) => a.occ.main - b.occ.main || prio(b) - prio(a) || a.meta.name.localeCompare(b.meta.name));
  const dots = new Map<DayNumber, YearEntry[]>();
  for (const e of list) {
    const at = dots.get(e.occ.main);
    if (at) at.push(e); else dots.set(e.occ.main, [e]);
  }
  const long = entries.filter((e) => e.span >= BAR_MIN_DAYS);
  const lanes = assignLanes(long.map((e) => e.occ));
  const bars = long.map((entry, i) => ({ entry, lane: lanes[i]! })).filter((b) => b.lane < MAX_LANES);
  const shown = new Set(list.map((e) => e.meta.id));
  const ruleOf = (id: string): DateRule | undefined => byId.get(id)?.rule;
  const missing = metas.filter((m) => (opts.silly || m.tier !== 3) && !shown.has(m.id) && usesTable(m, ruleOf));
  return { year, dots, bars, list, missing };
}

/** A strong, readable colour for a holiday's bar or legend swatch: the accent, unless it is a pale gold. */
export function holidayColor(theme: Theme): string {
  return relativeLuminance(theme.accent) > 0.55 ? theme.bg2 : theme.accent;
}

/** Clamp a route year into the covered range. */
export function clampYear(y: number): number {
  return Math.min(YEAR_MAX, Math.max(YEAR_MIN, y));
}

// ───────────────────────────────────────────────────────── view

const T = {
  prev: 'Go to {year}',
  spin: 'Spin the year',
  hideSpin: 'Hide the wheel',
  silly: 'Silly days',
  list: 'All holidays in {year}',
  days: '{n} days',
  range: '{from} to {to}',
  onDay: 'Holidays on {date}',
  clamped: 'My calendar shows the years {from} to {to}.',
  endsNote: '{names}: my calendar for these holidays ends in 2035.',
} as const;
const t = (s: string, vars: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/** Session memory: the wheel and the silly-days switch stay as the child left them. */
const session = { wheelOpen: false, silly: true };

const civilOf = fromDayNumber;
const holidayHref = (id: string): string => formatRoute({ view: 'holiday', id });

function yearLink(year: number, dir: 'prev' | 'next'): HTMLElement {
  const label = t(T.prev, { year });
  const ic = icon(dir === 'prev' ? 'arrowLeft' : 'arrowRight', 24);
  if (year < YEAR_MIN || year > YEAR_MAX) {
    return h('button', { class: 'btn btn-secondary btn-icon', type: 'button', disabled: true, 'aria-label': label }, ic);
  }
  return h('a', { class: 'btn btn-secondary btn-icon', href: formatRoute({ view: 'year', year }), 'aria-label': label }, ic);
}

interface MonthBuild {
  readonly model: YearModel;
  readonly firstDow: Weekday;
  readonly weekend: readonly Weekday[];
  readonly headers: readonly string[];
  readonly monthNames: readonly string[];
  readonly today: DayNumber;
  readonly bars: ReadonlyMap<DayNumber, { color: string; lane: number; capS: boolean; capE: boolean }[]>;
  readonly openDay: (day: DayNumber, entries: readonly YearEntry[]) => void;
}

/** Day → bar pieces for every run of every bar. */
function barPieces(model: YearModel): Map<DayNumber, { color: string; lane: number; capS: boolean; capE: boolean }[]> {
  const out = new Map<DayNumber, { color: string; lane: number; capS: boolean; capE: boolean }[]>();
  for (const { entry, lane } of model.bars) {
    const color = holidayColor(THEMES[entry.meta.theme]);
    for (const run of barRuns(entry.occ.start, entry.occ.end, model.year)) {
      for (let d = run.from; d <= run.to; d++) {
        const day = toDayNumber({ y: model.year, m: run.month, d });
        const list = out.get(day) ?? [];
        list.push({ color, lane, capS: run.capStart && d === run.from, capE: run.capEnd && d === run.to });
        out.set(day, list);
      }
    }
  }
  return out;
}

function monthCard(b: MonthBuild, month: number): HTMLElement {
  const grid = monthGrid(b.model.year, month, b.firstDow);
  const cells: HTMLElement[] = b.headers.map((w) => h('span', { class: 'ym-wd' }, w));
  for (let i = 0; i < grid.offset; i++) cells.push(h('span', { class: 'day is-out' }));
  for (const c of grid.cells) {
    const cls = ['day'];
    if (b.weekend.includes(c.weekday)) cls.push('is-weekend');
    if (c.day === b.today) cls.push('is-today');
    const entries = b.model.dots.get(c.day);
    const cell = h('span', { class: cls.join(' ') });
    if (entries && entries[0]) {
      const first = entries[0];
      if (entries.length > 1) cell.classList.add('has-more');
      const title = entries.map((e) => e.meta.name).join(', ');
      const dot = entries.length === 1
        ? h('a', { class: 'day-dot emoji', href: holidayHref(first.meta.id), tabindex: -1, title }, first.meta.emoji)
        : h('button', { class: 'day-dot emoji', type: 'button', tabindex: -1, title, onclick: () => b.openDay(c.day, entries) }, first.meta.emoji);
      cell.append(dot);
    } else {
      cell.append(String(c.d));
    }
    for (const p of b.bars.get(c.day) ?? []) {
      const pc = ['bar', 'ybar'];
      if (p.capS) pc.push('cap-s');
      if (p.capE) pc.push('cap-e');
      cell.append(h('i', { class: pc.join(' '), style: `--bar:${p.color};--lane:${p.lane}` }));
    }
    cells.push(cell);
  }
  return h('div', { class: 'ym' },
    h('div', { class: 'ym-name' }, b.monthNames[month - 1] ?? ''),
    h('div', { class: 'ym-grid' }, ...cells),
  );
}

function entryLine(e: YearEntry, locale: string): string {
  const main = formatLong(civilOf(e.occ.main), locale);
  const parts = [main];
  if (e.span > 1) {
    parts.push(`${t(T.days, { n: e.span })}, ${t(T.range, { from: formatShort(civilOf(e.occ.start), locale), to: formatShort(civilOf(e.occ.end), locale) })}`);
  }
  if (e.occ.approx) parts.push(COPY.expected);
  return parts.join(' · ');
}

function yearList(model: YearModel, locale: string): HTMLElement {
  const items = model.list.map((e) => h('li', {},
    h('a', { class: 'year-list-link', href: holidayHref(e.meta.id) },
      h('span', { class: 'emoji', 'aria-hidden': 'true' }, e.meta.emoji),
      h('span', { class: 'year-list-text' }, h('strong', {}, e.meta.name), h('span', { class: 'small muted' }, entryLine(e, locale))),
    )));
  return h('details', { class: 'year-list card' },
    h('summary', {}, t(T.list, { year: model.year })),
    h('ol', {}, ...items),
  );
}

const year: ViewFactory<'year'> = (ctx, route) => {
  ctx.setTheme(null);
  const todayCivil = ctx.clock.today();
  const today = toDayNumber(todayCivil);
  const wanted = route.year ?? todayCivil.y;
  const y = clampYear(wanted);
  const firstDow = firstDayOfWeek(ctx.locale);
  const monthFmt = new Intl.DateTimeFormat(ctx.locale, { month: 'long' });
  const monthNames = Array.from({ length: 12 }, (_, i) => monthFmt.format(new Date(y, i, 15, 12)));

  let wheel: WheelInstance | null = null;
  const dayCard = h('div', { class: 'card ydaycard', hidden: true, 'aria-live': 'polite' });
  const monthsHost = h('div', { class: 'months is-cal', 'aria-hidden': 'true' });
  const listHost = h('div');
  const noteHost = h('div');
  const wheelHost = h('div', { class: 'wheel-host', id: 'year-wheel', hidden: !session.wheelOpen });

  const closeDay = (): void => { dayCard.hidden = true; dayCard.replaceChildren(); };
  const openDay = (day: DayNumber, entries: readonly YearEntry[]): void => {
    dayCard.replaceChildren(
      h('div', { class: 'row' },
        h('p', { class: 'h3 grow' }, t(T.onDay, { date: formatLong(civilOf(day), ctx.locale) })),
        h('button', { class: 'btn btn-ghost btn-icon', type: 'button', 'aria-label': COPY.close, onclick: closeDay }, icon('close', 22)),
      ),
      h('div', { class: 'btn-group' }, ...entries.map((e) =>
        h('a', { class: 'btn btn-secondary', href: holidayHref(e.meta.id) }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, e.meta.emoji), e.meta.name))),
    );
    dayCard.hidden = false;
  };
  const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape' && !dayCard.hidden) closeDay(); };
  document.addEventListener('keydown', onKey);

  const render = (): void => {
    const model = yearModel(ctx.allMetas(), y, ctx.region, { silly: session.silly });
    const build: MonthBuild = {
      model, firstDow, weekend: weekendDays(ctx.locale), headers: weekdayHeaders(ctx.locale, firstDow), monthNames,
      today, bars: barPieces(model), openDay,
    };
    monthsHost.replaceChildren(...monthNames.map((_, i) => monthCard(build, i + 1)));
    listHost.replaceChildren(yearList(model, ctx.locale));
    const notes: HTMLElement[] = [];
    if (wanted !== y) notes.push(h('p', { class: 'small muted' }, t(T.clamped, { from: YEAR_MIN, to: YEAR_MAX }), ' ', COPY.beyondCoverage));
    if (model.missing.length > 0) {
      notes.push(h('p', { class: 'small muted' }, t(T.endsNote, { names: model.missing.map((m) => m.name).join(', ') })));
    } else if (y === YEAR_MAX) {
      notes.push(h('p', { class: 'small muted' }, COPY['empty.year']));
    }
    noteHost.replaceChildren(...notes);
    if (wheel) mountYearWheel(model);
  };

  const mountYearWheel = (model: YearModel): void => {
    wheel?.destroy();
    const y0 = toDayNumber({ y, m: 1, d: 1 });
    const items: WheelItem[] = model.list.map((e) => {
      const theme = THEMES[e.meta.theme];
      return {
        id: e.meta.id, name: e.meta.name, emoji: e.meta.emoji, doy: e.occ.main - y0,
        fill: theme.accent, ring: theme.bg1, href: holidayHref(e.meta.id), dateText: formatLong(civilOf(e.occ.main), ctx.locale),
      };
    });
    const todayDoy = todayCivil.y === y ? today - y0 : null;
    const next = items.findIndex((it) => todayDoy === null || it.doy >= todayDoy);
    wheel = mountWheel({
      year: y, daysInYear: isLeap(y) ? 366 : 365, items, todayDoy, initial: next < 0 ? items.length - 1 : next,
      locale: ctx.locale, motion: () => ctx.motion, label: wheelLabel(y, items.length, todayDoy),
      onOpen: (it) => ctx.router.navigate({ view: 'holiday', id: it.id }),
    });
    wheelHost.replaceChildren(wheel.el);
  };

  const spinBtn = h('button', {
    class: 'btn btn-secondary', type: 'button', 'aria-expanded': String(session.wheelOpen), 'aria-controls': 'year-wheel',
  }, icon('shuffle', 22), session.wheelOpen ? T.hideSpin : T.spin);
  spinBtn.addEventListener('click', () => {
    session.wheelOpen = !session.wheelOpen;
    spinBtn.setAttribute('aria-expanded', String(session.wheelOpen));
    spinBtn.lastChild!.textContent = session.wheelOpen ? T.hideSpin : T.spin;
    wheelHost.hidden = !session.wheelOpen;
    if (session.wheelOpen) mountYearWheel(yearModel(ctx.allMetas(), y, ctx.region, { silly: session.silly }));
    else { wheel?.destroy(); wheel = null; wheelHost.replaceChildren(); }
  });

  const sillyBox = h('input', { type: 'checkbox', checked: session.silly });
  sillyBox.addEventListener('change', () => { session.silly = sillyBox.checked; closeDay(); render(); });

  const el = h('section', { class: 'year-view' },
    h('div', { class: 'year-switch' },
      yearLink(y - 1, 'prev'),
      h('h1', { class: 'year-num' }, h('span', { class: 'sr-only' }, 'Holidays in '), String(y)),
      yearLink(y + 1, 'next'),
    ),
    h('div', { class: 'year-tools' },
      spinBtn,
      h('label', { class: 'switch' }, sillyBox, T.silly),
    ),
    wheelHost,
    monthsHost,
    noteHost,
    listHost,
    dayCard,
  );
  render();
  if (session.wheelOpen && !wheel) mountYearWheel(yearModel(ctx.allMetas(), y, ctx.region, { silly: session.silly }));

  return {
    el,
    destroy() {
      wheel?.destroy();
      document.removeEventListener('keydown', onKey);
    },
  };
};

export const yearView = year;
