/**
 * The Holiday Parade (`#/holidays?tag=lights&sort=az`, §3.1): a chip row [All, Lights, Sweets, Spooky,
 * Spring, Silly, Family, Faith, National, Around the world, My holidays], a sort switch [Soonest, A–Z,
 * By month] and a grid of sticker tiles — each with its holiday's own little sky, its emoji, a badge
 * ("in 12 sleeps", "today!", "next in 2028"), the region variant ("Thanksgiving · Canada") and a
 * "we just celebrated!" ribbon for a week afterward. Tier-3 silly days appear only under Silly; birthdays
 * and custom days under All, Family and My holidays.
 *
 * Chips and sort live in the route, so Back walks through them and every combination is a shareable link;
 * main.ts re-mounts the view on each change and the parade puts focus back on the chip or sort button the
 * child pressed. The grid is one tab stop with a roving tabindex: arrows move, Home/End jump, Enter opens.
 *
 * `tileElement` is shared with Home's "After that…" and "Happening now" strips.
 */
import type { AppContext, ViewFactory } from '../app/context';
import { pluralSleeps } from '../app/format';
import { formatRoute, PARADE_SORTS, type ParadeSort, type Route } from '../app/router';
import { TAG_LABELS } from '../content/registry';
import type { HolidayMeta, Tag } from '../content/types';
import { fromDayNumber, toDayNumber, type CivilDate } from '../dates/civil';
import { labelFor } from '../dates/countdown';
import { allOccurrences, statusOf, type Occurrence, type Upcoming } from '../dates/occurrences';
import type { Region } from '../dates/rules';
import { applyTheme } from '../theme/apply';
import { THEMES } from '../theme/themes';
import { COPY, fmt, SORT_LABELS, VIEW_NAMES } from './copy';
import { h } from './dom';
import { icon } from './icons';

export type ParadeChip = Tag | 'mine' | undefined;

/** The chip row, in order (`undefined` = All). Harvest and New Year are tags but not chips. */
export const PARADE_CHIPS: readonly ParadeChip[] = [
  undefined, 'lights', 'sweets', 'spooky', 'spring', 'silly', 'family', 'faith', 'national', 'world', 'mine',
];

/** How a region-variant tile names its variant ("Mother's Day · UK"). */
export const REGION_NAMES: Record<Region, string> = {
  US: 'US', GB: 'UK', CA: 'Canada', AU: 'Australia', MX: 'Mexico', IN: 'India', FR: 'France', OTHER: 'Everywhere',
};

/** A tile's badge when the holiday is on today. */
export const TODAY_BADGE = 'today!';

export interface ParadeEntry {
  readonly meta: HolidayMeta;
  /** The current or next occurrence; null once a lookup table runs out (after 2035). */
  readonly next: Upcoming | null;
  /** The most recent occurrence that has already ended. */
  readonly prev: Occurrence | null;
  readonly custom: boolean;
}

// ───────────────────────────────────────────────────────── pure helpers (tested)

/** Every holiday's current/next and previous occurrence around `today`, from one pass over the calendar. */
export function paradeEntries(
  metas: readonly HolidayMeta[], today: CivilDate, region: Region, isCustom: (id: string) => boolean = () => false,
): ParadeEntry[] {
  const t = toDayNumber(today);
  const byId = new Map<string, Occurrence[]>();
  for (const occ of allOccurrences(metas, [], today, region)) {
    const list = byId.get(occ.holidayId);
    if (list) list.push(occ);
    else byId.set(occ.holidayId, [occ]);
  }
  return metas.map((meta) => {
    const list = byId.get(meta.id) ?? [];
    const nextOcc = list.find((o) => o.end >= t);
    let prev: Occurrence | null = null;
    for (const o of list) if (o.end < t && (prev === null || o.end > prev.end)) prev = o;
    return { meta, next: nextOcc ? { occ: nextOcc, status: statusOf(nextOcc, today) } : null, prev, custom: isCustom(meta.id) };
  });
}

/** Does this tile belong under this chip? Silly days only under Silly; customs under All, Family and Mine. */
export function chipMatches(entry: Pick<ParadeEntry, 'meta' | 'custom'>, chip: ParadeChip): boolean {
  const { meta } = entry;
  if (chip === 'mine') return entry.custom;
  if (chip === 'silly') return meta.tags.includes('silly');
  if (meta.tier === 3) return false;
  return chip === undefined || meta.tags.includes(chip);
}

const byName = (a: ParadeEntry, b: ParadeEntry): number =>
  a.meta.name.localeCompare(b.meta.name, 'en', { sensitivity: 'base' }) || a.meta.id.localeCompare(b.meta.id);

/** Month × 100 + day of the next headline day (13xx when the calendar has run out). */
export function monthKey(entry: ParadeEntry): number {
  if (!entry.next) return 1300;
  const c = fromDayNumber(entry.next.occ.main);
  return c.m * 100 + c.d;
}

/**
 * Soonest: holidays happening now first, then by headline day; A–Z by name; By month in calendar order
 * (January first, whatever today is). Ties break by name. Holidays past the calendar's end go last.
 */
export function sortParade(entries: readonly ParadeEntry[], sort: ParadeSort): ParadeEntry[] {
  const list = [...entries];
  if (sort === 'az') return list.sort(byName);
  if (sort === 'month') return list.sort((a, b) => monthKey(a) - monthKey(b) || byName(a, b));
  const rank = (e: ParadeEntry): number => (e.next === null ? 2 : e.next.status.kind === 'ongoing' ? 0 : 1);
  const main = (e: ParadeEntry): number => (e.next === null ? 0 : e.next.occ.main);
  return list.sort((a, b) => rank(a) - rank(b) || main(a) - main(b) || byName(a, b));
}

/** Calendar-month groups of an already month-sorted list (month 13 = after the calendar ends). */
export function groupByMonth(entries: readonly ParadeEntry[]): { readonly month: number; readonly entries: ParadeEntry[] }[] {
  const groups: { month: number; entries: ParadeEntry[] }[] = [];
  for (const e of entries) {
    const month = Math.floor(monthKey(e) / 100);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.entries.push(e);
    else groups.push({ month, entries: [e] });
  }
  return groups;
}

export interface Badge {
  readonly text: string;
  /** True while the holiday is under way (the badge gets the sunny pill). */
  readonly now: boolean;
}

/** "in 12 sleeps", "today!", "Tonight at sundown!", "Day 3 of 7", "next in 2028" or the end-of-calendar line. */
export function whenBadge(next: Upcoming | null): Badge {
  if (!next) return { text: COPY.beyondCoverage, now: false };
  const s = next.status;
  if (s.kind === 'ongoing') {
    if (s.tonight) return { text: COPY.tonight, now: true };
    if (s.sleepsToMain === 0) return { text: TODAY_BADGE, now: true };
    if (s.sleepsToMain > 0) return { text: fmt('inSleeps', { sleeps: pluralSleeps(s.sleepsToMain) }), now: true };
    return { text: fmt('dayOf', { day: s.day, of: s.of }), now: true };
  }
  if (s.kind === 'upcoming') {
    // More than a year away only happens to Leap Day: name the year instead of a four-digit sleep count.
    if (s.sleeps > 366) return { text: fmt('nextIn', { year: fromDayNumber(next.occ.main).y }), now: false };
    return { text: fmt('inSleeps', { sleeps: pluralSleeps(s.sleeps) }), now: false };
  }
  return { text: labelFor(s, {}), now: false };
}

/**
 * The badge for a Home strip tile: like the parade's while upcoming, and the day's own label while it is
 * on ("Night 4", "Umoja (Unity)", "IT'S TODAY!").
 */
export function stripBadge(u: Upcoming, meta: Pick<HolidayMeta, 'dayNames'>): Badge {
  const s = u.status;
  if (s.kind === 'upcoming') return whenBadge(u);
  if (s.kind === 'ongoing' && s.sleepsToMain > 0 && !s.tonight) {
    return { text: fmt('inSleeps', { sleeps: pluralSleeps(s.sleepsToMain) }), now: true };
  }
  return { text: labelFor(s, meta), now: s.kind === 'ongoing' };
}

/** "Canada" when the holiday has its own date rule for this region (Thanksgiving, Mother's/Father's Day). */
export function variantRegion(meta: Pick<HolidayMeta, 'rule'>, region: Region): string | null {
  const rule = meta.rule;
  return rule.kind === 'byRegion' && rule.variants[region] !== undefined ? REGION_NAMES[region] : null;
}

/** The "we just celebrated!" ribbon: the last span ended one to seven days ago. */
export function justCelebrated(prev: Occurrence | null, today: CivilDate): boolean {
  if (!prev) return false;
  const daysAgo = toDayNumber(today) - prev.end;
  return daysAgo >= 1 && daysAgo <= 7;
}

/** Left/Right/Home/End in the roving grid (null for other keys; Up/Down use the tiles' geometry). */
export function nextIndex(key: string, i: number, count: number): number | null {
  if (count <= 0) return null;
  switch (key) {
    case 'ArrowRight': return Math.min(count - 1, i + 1);
    case 'ArrowLeft': return Math.max(0, i - 1);
    case 'Home': return 0;
    case 'End': return count - 1;
    default: return null;
  }
}

export interface Box { readonly left: number; readonly top: number; readonly width: number; readonly height: number }

/**
 * Up/Down: the tile in the nearest row above/below whose center is closest horizontally (rows are found
 * from the layout, so it works for any column count and across the month groups). Stays put at an edge.
 */
export function verticalNeighbor(boxes: readonly Box[], i: number, dir: 1 | -1): number {
  const cur = boxes[i];
  if (!cur) return i;
  const half = cur.height / 2;
  const cx = cur.left + cur.width / 2;
  let rowTop: number | null = null;
  for (const b of boxes) {
    const beyond = dir === 1 ? b.top >= cur.top + half : b.top <= cur.top - half;
    if (!beyond) continue;
    if (rowTop === null || (dir === 1 ? b.top < rowTop : b.top > rowTop)) rowTop = b.top;
  }
  if (rowTop === null) return i;
  let best = i;
  let bestDx = Number.POSITIVE_INFINITY;
  boxes.forEach((b, k) => {
    if (Math.abs(b.top - rowTop!) >= half) return;
    const dx = Math.abs(b.left + b.width / 2 - cx);
    if (dx < bestDx) { bestDx = dx; best = k; }
  });
  return best;
}

// ───────────────────────────────────────────────────────── tiles

export interface TileOptions {
  readonly when: string;
  readonly now?: boolean;
  readonly variant?: string | null;
  readonly ribbon?: boolean;
  readonly earned?: boolean;
  readonly passed?: boolean;
  /** Home strips use the narrow mini tile. */
  readonly mini?: boolean;
}

/** A sticker tile: the holiday's own little sky (its --h-* vars on the tile), emoji, name and badge. */
export function tileElement(meta: HolidayMeta, opts: TileOptions): HTMLAnchorElement {
  const sky = h('div', { class: 'tile-sky sky' }, h('span', { class: 'tile-emoji emoji', 'aria-hidden': 'true' }, meta.emoji));
  applyTheme(sky, THEMES[meta.theme]);
  const cls = [opts.mini ? 'mini-tile' : 'tile', opts.passed ? 'is-passed' : ''].filter(Boolean).join(' ');
  return h('a', { class: cls, href: formatRoute({ view: 'holiday', id: meta.id }) },
    sky,
    h('span', { class: 'tile-body' },
      h('span', { class: 'tile-name' }, meta.name, opts.variant ? h('span', { class: 'tile-variant' }, ` · ${opts.variant}`) : null),
      h('span', { class: opts.now ? 'tile-when is-now' : 'tile-when' }, opts.when),
    ),
    opts.ribbon ? h('span', { class: 'tile-ribbon' }, COPY.justCelebrated) : null,
    opts.earned ? h('span', { class: 'tile-check' }, icon('check', 16), h('span', { class: 'sr-only' }, 'sticker earned')) : null,
  );
}

// ───────────────────────────────────────────────────────── view

/** Where focus goes after a chip or sort press re-mounts the view (consumed once, short-lived). */
let pendingFocus: { key: string; at: number } | null = null;
const FOCUS_TTL_MS = 2000;

function chipKey(chip: ParadeChip): string {
  return `chip:${chip ?? 'all'}`;
}

function paradeRoute(tag: ParadeChip, sort: ParadeSort): Route {
  return { view: 'parade', ...(tag !== undefined ? { tag } : {}), ...(sort !== 'soon' ? { sort } : {}) };
}

function monthName(month: number, locale: string): string {
  if (month > 12) return COPY.beyondCoverage;
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, month - 1, 1, 12));
}

/** Roving tabindex over every `a.tile` inside `host`; returns a disposer. */
function rove(host: HTMLElement): () => void {
  const tiles = (): HTMLAnchorElement[] => Array.from(host.querySelectorAll<HTMLAnchorElement>('a.tile'));
  tiles().forEach((t, i) => { t.tabIndex = i === 0 ? 0 : -1; });
  const onFocus = (e: FocusEvent): void => {
    const target = e.target;
    if (!(target instanceof HTMLAnchorElement) || !target.classList.contains('tile')) return;
    for (const t of tiles()) t.tabIndex = t === target ? 0 : -1;
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const list = tiles();
    const i = list.findIndex((t) => t === document.activeElement);
    if (i < 0) return;
    let j = nextIndex(e.key, i, list.length);
    if (j === null && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      j = verticalNeighbor(list.map((t) => t.getBoundingClientRect()), i, e.key === 'ArrowDown' ? 1 : -1);
    }
    if (j === null) return;
    e.preventDefault();
    const target = list[j];
    if (target && j !== i) target.focus();
  };
  host.addEventListener('focusin', onFocus);
  host.addEventListener('keydown', onKey);
  return () => {
    host.removeEventListener('focusin', onFocus);
    host.removeEventListener('keydown', onKey);
  };
}

export const paradeView: ViewFactory<'parade'> = (ctx: AppContext, route) => {
  ctx.setTheme(null);
  const today = ctx.clock.today();
  const tag: ParadeChip = route.tag;
  const sort: ParadeSort = route.sort ?? 'soon';
  const customIds = new Set(ctx.customs.map((c) => c.id));
  const stickers = ctx.store.progress.stickers;
  const entries = sortParade(
    paradeEntries(ctx.allMetas(), today, ctx.region, (id) => customIds.has(id)).filter((e) => chipMatches(e, tag)),
    sort,
  );

  const tileFor = (e: ParadeEntry): HTMLElement => {
    const badge = whenBadge(e.next);
    const ribbon = justCelebrated(e.prev, today);
    // The check mark: the sticker of the occurrence happening now, or else of the last one.
    const year = e.next?.status.kind === 'ongoing' ? e.next.occ.year : e.prev?.year;
    const earned = year !== undefined && stickers[`${e.meta.id}:${year}`] !== undefined;
    return h('li', {}, tileElement(e.meta, {
      when: badge.text, now: badge.now, variant: variantRegion(e.meta, ctx.region), ribbon, earned,
      passed: ribbon && !badge.now,
    }));
  };

  // ── chips (links: Back walks through them) ──
  const chipLinks = PARADE_CHIPS.map((chip) => {
    const active = chip === tag;
    const href = formatRoute(paradeRoute(chip, sort));
    const label = chip === undefined ? COPY['parade.all'] : chip === 'mine' ? COPY['parade.mine'] : TAG_LABELS[chip];
    return h('a', {
      class: active ? 'chip is-active' : 'chip', href, 'data-focus': chipKey(chip), 'aria-current': active ? 'true' : false,
      onclick: () => { if (!active) pendingFocus = { key: chipKey(chip), at: Date.now() }; },
    }, label);
  });
  const chips = h('div', { class: 'chips parade-chips', role: 'group', 'aria-label': 'Show' }, ...chipLinks);

  // ── sort (buttons that navigate) ──
  const sortButtons = PARADE_SORTS.map((s) => h('button', {
    type: 'button', 'aria-pressed': String(s === sort), 'data-focus': `sort:${s}`,
    onclick: () => {
      if (s === sort) return;
      pendingFocus = { key: `sort:${s}`, at: Date.now() };
      ctx.router.navigate(paradeRoute(tag, s));
    },
  }, SORT_LABELS[s]));
  const sorter = h('div', { class: 'parade-sort' },
    h('div', { class: 'segmented', role: 'group', 'aria-label': 'Sort' }, ...sortButtons),
  );

  // ── the grid ──
  const count = `${entries.length} ${entries.length === 1 ? 'holiday' : 'holidays'}`;
  let grid: HTMLElement;
  if (entries.length === 0) {
    grid = h('div', { class: 'card card-pad stack center parade-empty' },
      h('p', { class: 'lead' }, tag === 'mine' ? COPY['empty.custom'] : COPY['empty.parade']),
      tag === 'mine' ? h('a', { class: 'btn', href: formatRoute({ view: 'grownups' }) }, icon('plus', 20), COPY['grownups.addCustom']) : null,
    );
  } else if (sort === 'month') {
    grid = h('div', { class: 'parade-months' }, ...groupByMonth(entries).map((g) => h('section', { class: 'parade-month' },
      h('h2', { class: 'h3 parade-month-title' }, monthName(g.month, ctx.locale)),
      h('ul', { class: 'tiles' }, ...g.entries.map(tileFor)),
    )));
  } else {
    grid = h('ul', { class: 'tiles', 'aria-label': count }, ...entries.map(tileFor));
  }

  const el = h('section', { class: 'parade' },
    h('h1', { class: 'h1' }, VIEW_NAMES.parade),
    h('div', { class: 'parade-controls' }, chips, sorter),
    h('p', { class: 'sr-only' }, count),
    grid,
  );
  const stopRove = rove(el);

  // After the router settles (focus to the h1, scroll), put focus back where the child was and keep the
  // active chip in view in its scrolling row.
  const pf = pendingFocus;
  pendingFocus = null;
  const settle = window.setTimeout(() => {
    const active = chipLinks.find((a) => a.classList.contains('is-active'));
    if (active && chips.scrollWidth > chips.clientWidth) {
      chips.scrollLeft = Math.max(0, active.offsetLeft - (chips.clientWidth - active.offsetWidth) / 2);
    }
    if (pf && Date.now() - pf.at < FOCUS_TTL_MS) {
      const target = el.querySelector<HTMLElement>(`[data-focus="${pf.key}"]`);
      target?.focus({ preventScroll: true });
      ctx.announce(`${tag === undefined ? COPY['parade.all'] : tag === 'mine' ? COPY['parade.mine'] : TAG_LABELS[tag]}: ${count}`);
    }
  }, 0);

  return {
    el,
    destroy() {
      window.clearTimeout(settle);
      stopRove();
    },
  };
};
