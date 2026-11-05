/**
 * Sticker Book (§3.1 `#/stickers`, §9 item 10): one shelf per season for the chosen
 * year (Winter Dec–Feb, Spring Mar–May, Summer Jun–Aug, Autumn Sep–Nov, by the month
 * of each holiday's main day). Earned stickers are in colour with "You were here on
 * Diwali 2026"; the rest are soft silhouettes that only ever look forward — "in 12
 * sleeps", "see you next year" — never a penalty. Birthdays and custom days get their
 * own shelf of Birthday Stars. The badges row shows a meter toward each badge.
 *
 * The count ("14 of 52 this year") counts the catalogue's tier 1–2 holidays only:
 * silly days have no sticker, and custom days are a bonus shelf on top.
 */
import type { ViewFactory } from '../app/context';
import { pluralSleeps } from '../app/format';
import { formatRoute } from '../app/router';
import { traditionsVisited } from '../app/stickers';
import { stickerLabel } from '../content/registry';
import { formatIso, formatLong, parseIso, type IsoDate } from '../dates/civil';
import { COPY, fmt, SEASON_LABELS, VIEW_NAMES } from './copy';
import { h } from './dom';
import { icon } from './icons';
import { albumStorage } from '../world/album';
import { albumBody, POSTCARD_COPY } from './postcard-show';
import { SEASONS, SEASON_EMOJI, stickerBook, stickerYears, badgeRows, type StickerEntry, type BadgeRow } from './sticker-book';

// ───────────────────────────────────────────────────────── view

const T = {
  pastCount: '{have} of {total} in {year}',
  onNow: 'On now! Visit to collect it',
  today: 'New today!',
  badges: 'Badges',
  badgeOf: '{have} of {need}',
  badgeEarned: 'Earned {date}',
  prevYear: 'Show {year}',
} as const;
const t = (s: string, vars: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

function statusText(e: StickerEntry, year: number): string {
  switch (e.state) {
    case 'earned': return fmt('youWereHere', { name: e.meta.name, year });
    case 'ongoing': return T.onNow;
    case 'upcoming': return fmt('inSleeps', { sleeps: pluralSleeps(e.sleeps ?? 0) });
    case 'missed': return COPY.seeYouNextYear;
  }
}

function stickerEl(e: StickerEntry, year: number, todayIso: IsoDate, locale: string): HTMLElement {
  const label = e.custom ? e.meta.name : stickerLabel(e.meta, year);
  const status = statusText(e, year);
  const cls = ['sticker', e.state === 'earned' ? 'is-earned' : 'is-locked'];
  if (e.state === 'ongoing') cls.push('is-on');
  if (e.earned === todayIso) cls.push('is-new');
  const when = e.earned ? parseIso(e.earned) : null;
  return h('a', {
    class: cls.join(' '), href: formatRoute({ view: 'holiday', id: e.meta.id }),
    'aria-label': `${label}, ${e.meta.name}: ${status}`,
    ...(when ? { title: formatLong(when, locale, { year: true }) } : {}),
  },
    h('span', { class: 'sticker-emoji emoji', 'aria-hidden': 'true' }, e.meta.sticker.emoji),
    h('span', { class: 'sticker-label', 'aria-hidden': 'true' }, label),
    e.earned === todayIso ? h('span', { class: 'sticker-date', 'aria-hidden': 'true' }, T.today) : null,
  );
}

function shelf(title: string, emoji: string, entries: readonly StickerEntry[], year: number, todayIso: IsoDate, locale: string): HTMLElement {
  return h('section', { class: 'shelf' },
    h('h2', { class: 'shelf-title' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, emoji), title),
    h('div', { class: 'shelf-row' }, ...entries.map((e) => stickerEl(e, year, todayIso, locale))),
  );
}

function badgeEl(row: BadgeRow, locale: string): HTMLElement {
  const when = row.earned ? parseIso(row.earned) : null;
  const meterText = when
    ? t(T.badgeEarned, { date: formatLong(when, locale) })
    : t(T.badgeOf, { have: Math.min(row.meter.have, row.meter.need), need: row.meter.need });
  return h('div', { class: row.earned ? 'badge is-earned' : 'badge' },
    h('span', { class: 'badge-emoji emoji', 'aria-hidden': 'true' }, row.copy.emoji),
    h('h3', { class: 'badge-name' }, row.copy.name),
    h('p', { class: 'badge-desc' }, row.copy.description),
    h('div', {
      class: 'meter', role: 'progressbar', 'aria-label': `${row.copy.name} progress`,
      'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': row.percent, 'aria-valuetext': meterText,
    }, h('i', { style: `--p:${row.percent}%` })),
    h('p', { class: 'small' }, meterText),
  );
}

const stickers: ViewFactory<'stickers'> = (ctx) => {
  ctx.setTheme(null);
  const today = ctx.clock.today();
  const todayIso = formatIso(today);
  let year = today.y;

  const countEl = h('p', { class: 'lead sticker-count', 'aria-live': 'polite' });
  const switchHost = h('div');
  const body = h('div');

  const render = (): void => {
    const p = ctx.store.progress;
    const customIds = new Set(p.custom.map((c) => c.id));
    const book = stickerBook(ctx.allMetas(), customIds, p, year, today, ctx.region);
    countEl.textContent = year === today.y
      ? fmt('stickerCount', { have: book.have, total: book.total })
      : t(T.pastCount, { have: book.have, total: book.total, year });

    const years = stickerYears(p, today.y);
    if (years.length > 1) {
      const i = years.indexOf(year);
      const btn = (to: number | undefined, dir: 'arrowLeft' | 'arrowRight'): HTMLElement =>
        h('button', {
          class: 'btn btn-secondary btn-icon', type: 'button', disabled: to === undefined,
          'aria-label': to === undefined ? 'No more years' : t(T.prevYear, { year: to }),
          onclick: () => { if (to !== undefined) { year = to; render(); } },
        }, icon(dir, 24));
      switchHost.replaceChildren(h('div', { class: 'year-switch' },
        btn(years[i - 1], 'arrowLeft'),
        h('span', { class: 'year-num', 'aria-live': 'polite' }, String(year)),
        btn(years[i + 1], 'arrowRight'),
      ));
    } else {
      switchHost.replaceChildren();
    }

    const parts: HTMLElement[] = [];
    for (const s of SEASONS) {
      const list = book.shelves[s];
      if (list.length > 0) parts.push(shelf(SEASON_LABELS[s], SEASON_EMOJI[s], list, year, todayIso, ctx.locale));
    }
    if (book.birthdays.length > 0) parts.push(shelf(COPY['grownups.custom'], '🎂', book.birthdays, year, todayIso, ctx.locale));
    const rows = badgeRows(p, traditionsVisited(p, ctx.metas));
    parts.push(h('section', { class: 'shelf' },
      h('h2', { class: 'shelf-title' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, '🏅'), T.badges),
      h('div', { class: 'badges' }, ...rows.map((r) => badgeEl(r, ctx.locale))),
    ));
    // Tracker postcards: every album Santa's route and the New Year wave have sent, newest first.
    parts.push(h('section', { class: 'shelf', id: 'postcards' },
      h('h2', { class: 'shelf-title' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, '💌'), POSTCARD_COPY.sectionTitle),
      albumBody(albumStorage(ctx.clock.pretending).read(), { pretending: ctx.clock.pretending, worldHref: formatRoute({ view: 'world' }) }),
    ));
    body.replaceChildren(...parts);
  };

  render();
  const unsubscribe = ctx.store.subscribe(render);
  const el = h('section', { class: 'stickers-view' },
    h('h1', { class: 'h1' }, VIEW_NAMES.stickers),
    countEl,
    switchHost,
    body,
  );
  return { el, destroy: unsubscribe };
};

export const stickersView = stickers;
