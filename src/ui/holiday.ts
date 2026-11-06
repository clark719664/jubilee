/**
 * Holiday World (`#/h/:id`, `#/h/:id?s=make`): the holiday's own sky and hero, a sticky pill bar of anchor links,
 * then the sections — Play (the Countdown Doors teaser and round buttons into every activity), Story (with the
 * per-day panel and, for Lunar New Year, the zodiac animal), Make, Craft, Facts, Say it, Dates and Sticker — plus
 * the advent strip on the Christmas page from December 1 to 24.
 *
 * Content loads lazily (one chunk per holiday) behind a loading card and is cached for the session, so Back to a
 * page renders in one frame and the router's scroll restore lands. Visiting during the holiday's span earns its
 * sticker (the Store keeps pretend days in memory only); every visit counts toward World Traveler.
 */
import { santaLink } from './santa-link';
import { customMeta, type AppContext, type ViewFactory, type ViewInstance } from '../app/context';
import type { Units } from '../app/format';
import { formatRoute } from '../app/router';
import { stickerFor } from '../app/stickers';
import { stickerUrl } from '../art/index';
import { stickerLabel } from '../content/registry';
import type { HolidayContent, HolidayMeta } from '../content/types';
import { fromDayNumber, type CivilDate, type DayNumber } from '../dates/civil';
import { nextOccurrence, nextThree, previousOccurrence, type NextResult, type Occurrence, type Status } from '../dates/occurrences';
import { kinaraLit } from '../effects/kinara-order';
import { THEMES } from '../theme/themes';
import { adventStrip } from './advent';
import { COPY, SECTION_LABELS, VIEW_NAMES, fmt } from './copy';
import { craftCard } from './craft';
import { datesBody, howWeKnow } from './dates';
import { h, type Child } from './dom';
import { factsGrid } from './facts';
import { greetingsGrid } from './greetings';
import { mountHero, type HeroInstance } from './hero';
import { icon, type IconName } from './icons';
import { mascot } from './mascot';
import { recipeCard, type RecipeCard } from './recipe';
import {
  playLinksFor, holidayGamesFor, adventVisible, cachedContent, contentFor, dayPanel, heroModeFor,
  initialSection, playHref, sectionDomId, sectionsFor, stickerState, takeReturnFocus, zodiacInfo, type DayPanel,
  type PageSection, type PlayLink,
} from './sections';

type Current = { readonly occ: Occurrence; readonly status: Status };

const SECTION_ICONS: Record<PageSection, IconName> = {
  play: 'play', story: 'heart', make: 'chefHat', craft: 'scissors', facts: 'sparkle', say: 'speaker', dates: 'year', sticker: 'stickers',
};
const SECTION_NAMES: Record<PageSection, string> = { play: 'Play', ...SECTION_LABELS };
/** Sections drawn as one card; the others hold their own cards (recipes, crafts, flip cards, greetings). */
const CARD_SECTIONS = new Set<PageSection>(['play', 'story', 'dates', 'sticker']);

/** The pill's shareable link; `?s=play` is ignored by the router for now, which lands on the top of the page. */
function sectionHref(id: string, section: PageSection): string {
  return section === 'play' ? `${formatRoute({ view: 'holiday', id })}?s=play` : formatRoute({ view: 'holiday', id, section });
}

function shortDay(n: DayNumber, locale: string): string {
  const c = fromDayNumber(n);
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(c.y, c.m - 1, c.d, 12));
}

// ───────────────────────────────────────────────────────── small cards

function unknownHoliday(ctx: AppContext): ViewInstance {
  ctx.setTheme(null);
  return {
    el: h('section', { class: 'placeholder' },
      h('div', { class: 'card card-pad stack center' },
        mascot('curious', 120),
        h('h1', { class: 'h1' }, 'That holiday is hiding'),
        h('p', { class: 'lead' }, COPY['error.holiday']),
        h('a', { class: 'btn', href: formatRoute({ view: 'parade' }) }, icon('all', 20), VIEW_NAMES.parade),
      )),
  };
}

function loadingCard(meta: HolidayMeta): HTMLElement {
  return h('div', { class: 'card card-pad stack center holiday-loading', role: 'status' },
    mascot('curious', 84), h('p', { class: 'lead' }, `Opening the ${meta.name} page…`));
}

function errorCard(retry: () => void): HTMLElement {
  return h('div', { class: 'card card-pad stack center holiday-loading', role: 'alert' },
    mascot('sleepy', 84),
    h('p', { class: 'lead' }, 'This page got stuck. Shall we try again?'),
    h('button', { class: 'btn', type: 'button', onclick: retry }, icon('shuffle', 20), 'Try again'));
}

/** The header for a table holiday past the end of its calendar: no countdown, never a guess. */
function beyondHeader(meta: HolidayMeta): HTMLElement {
  return h('header', { class: 'hero hero-bleed sky holiday-beyond' },
    h('div', { class: 'hero-scrim' }),
    h('div', { class: 'hero-body' },
      h('p', { class: 'hero-kicker' }, VIEW_NAMES.holiday),
      h('h1', { class: 'hero-title' }, h('span', { class: 'hero-emoji emoji', 'aria-hidden': 'true' }, meta.emoji), meta.name),
      h('p', { class: 'hero-note' }, COPY.beyondCoverage),
    ));
}

// ───────────────────────────────────────────────────────── story pieces

function candle(lit: boolean, cls: string): HTMLElement {
  return h('span', { class: `candle ${cls}${lit ? ' is-lit' : ''}` }, icon('candle', 28));
}

/**
 * Menorah: night n lights the n right-most candles plus the raised helper (shamash). Kinara: the black candle
 * first, then red and green alternating — in the same order as the hero's kinara (`kinaraLit`), so the page
 * never shows two different candle patterns for the same night.
 */
function candleRow(panel: NonNullable<DayPanel['candles']>): HTMLElement {
  const row = h('div', { class: 'candles', role: 'img', 'aria-label': `${panel.lit} of ${panel.of} candles lit` });
  if (panel.of === 8) {
    for (let i = 0; i < 8; i++) {
      if (i === 4) row.append(candle(true, 'c-shamash'));
      row.append(candle(i >= 8 - panel.lit, 'c-gold'));
    }
    return row;
  }
  const colors = ['c-red', 'c-red', 'c-red', 'c-black', 'c-green', 'c-green', 'c-green'];
  colors.forEach((c, slot) => row.append(candle(kinaraLit(slot, panel.lit), c)));
  return row;
}

function meter(progress: number, label: string): HTMLElement {
  const pct = Math.round(progress * 100);
  const fill = h('i', {});
  fill.style.setProperty('--p', `${pct}%`);
  return h('div', { class: 'meter', role: 'progressbar', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct }, fill);
}

function dayPanelBlock(meta: HolidayMeta, panel: DayPanel): HTMLElement {
  return h('div', { class: 'daypanel card-tint' },
    h('h3', { class: 'daypanel-headline' }, panel.headline),
    panel.candles ? candleRow(panel.candles) : null,
    panel.detail ? h('p', { class: 'daypanel-detail' }, panel.detail) : null,
    panel.progress !== null ? meter(panel.progress, `How far through ${meta.name}`) : null,
  );
}

/** Lunar New Year: the year's animal, large, with its name in Mandarin, Korean and Vietnamese. */
function zodiacBlock(meta: HolidayMeta, year: number): HTMLElement {
  const z = zodiacInfo(year);
  return h('div', { class: 'zodiac card-tint' },
    h('span', { class: 'zodiac-emoji emoji', 'aria-hidden': 'true' }, z.emoji),
    h('div', { class: 'grow' },
      h('h3', { class: 'zodiac-title' }, stickerLabel(meta, year)),
      h('ul', { class: 'zodiac-names' },
        h('li', {}, h('span', { class: 'zodiac-word', lang: 'zh-Hans' }, z.zh), ' ', h('span', { lang: 'zh-Latn' }, z.zhRoman), h('span', { class: 'muted' }, ' · Mandarin')),
        h('li', {}, h('span', { class: 'zodiac-word', lang: 'ko' }, z.ko), ' ', h('span', { lang: 'ko-Latn' }, z.koRoman), h('span', { class: 'muted' }, ' · Korean')),
        h('li', {}, h('span', { class: 'zodiac-word', lang: 'vi' }, z.vi), h('span', { class: 'muted' }, ' · Vietnamese')),
      ),
    ),
  );
}

/** While a multi-day holiday is on, "what is today" leads the section (before it starts, Dates lists the days). */
function storyBody(meta: HolidayMeta, content: HolidayContent, current: Current | null, today: CivilDate): Child[] {
  const panel = current ? dayPanel(meta, current.occ, current.status, today) : null;
  return [
    current && meta.sticker.label.includes('{animal}') ? zodiacBlock(meta, current.occ.year) : null,
    panel ? dayPanelBlock(meta, panel) : null,
    h('div', { class: 'story prose' }, ...content.story.map((p) => h('p', {}, p))),
  ];
}

// ───────────────────────────────────────────────────────── sticker

function stickerBody(ctx: AppContext, meta: HolidayMeta, current: Current | null, previous: Occurrence | undefined, today: CivilDate, fresh: boolean): Child[] {
  const state = stickerState(meta.id, ctx.store.progress.stickers, current?.occ ?? null, previous, today);
  const year = state.kind === 'earned' ? state.year : current?.occ.year ?? today.y;
  const earned = state.kind === 'earned';
  // The illustrated die-cut sticker once the art lands; the emoji on a paper disc until then.
  const art = stickerUrl(meta.id);
  const sticker = h('a', {
    class: `sticker sticker-hero ${earned ? 'is-earned' : 'is-locked'}${earned && fresh ? ' is-new' : ''}`, href: formatRoute({ view: 'stickers' }),
  },
    h('span', { class: art ? 'sticker-emoji has-art' : 'sticker-emoji', 'aria-hidden': 'true' },
      art ? h('img', { class: 'sticker-art', src: art, alt: '', width: 132, height: 132 }) : meta.sticker.emoji),
    h('span', { class: 'sticker-label' }, stickerLabel(meta, year)),
  );
  const when = state.kind === 'waiting'
    ? state.occ.start === state.occ.end ? shortDay(state.occ.start, ctx.locale) : `${shortDay(state.occ.start, ctx.locale)} – ${shortDay(state.occ.end, ctx.locale)}`
    : state.kind === 'earned' ? null : COPY.beyondCoverage;
  return [
    h('div', { class: 'sticker-stage' }, sticker),
    when ? h('p', { class: 'center sticker-when' }, when) : null,
  ];
}

// ───────────────────────────────────────────────────────── play

/** Play: a round button into every activity. Links only: the play view decides what each holiday can do. */
function playBody(meta: HolidayMeta): Child[] {
  if (meta.id === 'christmas') return [santaLink(), ...playTiles(meta)];
  return playTiles(meta);
}

function playTiles(meta: HolidayMeta): Child[] {
  const button = (p: PlayLink): HTMLElement => h('li', { class: 'hp-item' },
    h('a', { class: 'hp-btn', href: playHref(meta.id, p.id), 'data-activity': p.id },
      h('span', { class: 'hp-disc', 'aria-hidden': 'true' }, h('span', { class: 'hp-emoji emoji' }, p.emoji)),
      h('span', { class: 'hp-label' }, p.label)));
  const special = holidayGamesFor(meta.id);
  return [
    h('ul', { class: 'hp-grid', 'aria-label': `Games and toys for ${meta.name}` }, ...playLinksFor(meta.id).map(button)),
    special ? h('h3', { class: 'hp-games-title' }, special.heading) : null,
    special ? h('ul', { class: 'hp-grid hp-games', 'aria-label': special.heading }, ...special.links.map(button)) : null,
  ];
}

// ───────────────────────────────────────────────────────── notes for grown-ups

/** A closed fold under a section, for the grown-ups: "How we know" under Dates, "Sources" under Facts. */
function notes(summary: string, ...children: Child[]): HTMLElement | null {
  const body = children.filter((c) => c !== null && c !== undefined && c !== false);
  return body.length > 0 ? h('details', { class: 'notes' }, h('summary', {}, summary), ...body) : null;
}

// ───────────────────────────────────────────────────────── page scaffolding

function sectionShell(section: PageSection, ...children: Child[]): HTMLElement {
  const id = sectionDomId(section);
  return h('section', {
    id, class: `${CARD_SECTIONS.has(section) ? 'section holiday-sec' : 'holiday-sec holiday-sec-plain'} sec-${section}`,
    'data-section': section, 'aria-labeledby': `${id}-title`,
  },
  h('h2', { class: 'section-title', id: `${id}-title`, tabindex: -1 }, icon(SECTION_ICONS[section], 28), SECTION_NAMES[section]),
  ...children);
}

function scrollBehavior(ctx: AppContext): ScrollBehavior {
  return ctx.motion === 'full' ? 'smooth' : 'instant';
}

function goToSection(section: HTMLElement, behavior: ScrollBehavior): void {
  section.scrollIntoView({ behavior, block: 'start' });
  section.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
}

interface PillBar { readonly el: HTMLElement; watch(sections: readonly HTMLElement[]): () => void }

/** Anchor links (shareable `?s=` URLs) that scroll in place; the pill of the section on screen is marked current. */
function pillBar(ctx: AppContext, meta: HolidayMeta, available: readonly PageSection[]): PillBar {
  const pills = new Map<PageSection, HTMLAnchorElement>();
  const bar = h('nav', { class: 'pillbar', 'aria-label': `${meta.name}: sections` });
  for (const s of available) {
    const a = h('a', { class: 'pill', href: sectionHref(meta.id, s) }, icon(SECTION_ICONS[s], 18), SECTION_NAMES[s]);
    a.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = document.getElementById(sectionDomId(s));
      if (!target) return;
      e.preventDefault();
      goToSection(target, scrollBehavior(ctx));
    });
    pills.set(s, a);
    bar.append(a);
  }
  const setCurrent = (s: PageSection | null): void => {
    for (const [key, a] of pills) {
      if (key !== s) { a.removeAttribute('aria-current'); continue; }
      if (a.getAttribute('aria-current') === 'true') continue;
      a.setAttribute('aria-current', 'true');
      if (bar.scrollWidth > bar.clientWidth) {
        bar.scrollTo({ left: a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2, behavior: scrollBehavior(ctx) });
      }
    }
  };
  return {
    el: bar,
    watch(sections) {
      if (typeof IntersectionObserver !== 'function') return () => undefined;
      const visible = new Set<Element>();
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); }
        const first = sections.find((el) => visible.has(el));
        setCurrent((first?.dataset.section as PageSection | undefined) ?? null);
      }, { rootMargin: '-140px 0px -55% 0px', threshold: 0 });
      sections.forEach((el) => io.observe(el));
      return () => io.disconnect();
    },
  };
}

/** Records the visit, peels the sticker during the span (tier 1–2 only) and runs the badge check. True when a sticker is new. */
function bookkeeping(ctx: AppContext, meta: HolidayMeta, current: Current | null, today: CivilDate): boolean {
  ctx.store.markVisited(meta.id, today);
  let fresh = false;
  const award = current && meta.tier !== 3 ? stickerFor(current.occ, today) : null;
  if (award && ctx.store.earnSticker(award.holidayId, award.year, today)) {
    fresh = true;
    ctx.toast(fmt('stickerEarned', { label: stickerLabel(meta, award.year) }), meta.sticker.emoji);
  }
  ctx.checkBadges();
  return fresh;
}

// ───────────────────────────────────────────────────────── the view

export const holidayView: ViewFactory<'holiday'> = (ctx, route): ViewInstance => {
  const found = ctx.metaOf(route.id);
  if (!found) return unknownHoliday(ctx);
  const today = ctx.clock.today();
  const metas = ctx.allMetas();
  const next: NextResult = nextOccurrence(metas, found.id, today, ctx.region);
  const current: Current | null = 'occ' in next ? next : null;
  // A birthday with a birth year lights its age in candles.
  const custom = ctx.customs.find((c) => c.id === found.id);
  const meta = custom && current ? customMeta(custom, current.occ.year) : found;
  const previous = previousOccurrence(metas, meta.id, today, ctx.region);
  const returnTo = takeReturnFocus(meta.id, Date.now());
  ctx.setTheme(THEMES[meta.theme]);
  const fresh = bookkeeping(ctx, meta, current, today);

  const disposers: (() => void)[] = [];
  let destroyed = false;
  const el = h('div', { class: 'holiday-page', 'data-holiday': meta.id });
  let hero: HeroInstance | null = null;
  if (current) {
    hero = mountHero(ctx, { meta, occ: current.occ, status: current.status, mode: heroModeFor(current.status), today });
    el.append(hero.el);
    // The page's one h1 is the holiday's name; supply it if the hero renders its title differently.
    if (!hero.el.querySelector('h1')) el.prepend(h('h1', { class: 'sr-only' }, meta.name));
  } else {
    el.append(beyondHeader(meta));
  }
  const body = h('div', { class: 'holiday-body' });
  el.append(body);

  const render = (content: HolidayContent): void => {
    if (destroyed) return;
    const available = sectionsFor(meta, content);
    const pills = pillBar(ctx, meta, available);
    const cards = new Map<string, RecipeCard>();
    let units: Units = ctx.units;
    const adventShown = content.advent !== undefined && content.advent.length > 0 && adventVisible(today);
    const build: Record<PageSection, () => Child[]> = {
      play: () => playBody(meta),
      story: () => storyBody(meta, content, current, today),
      make: () => {
        for (const r of content.recipes) {
          cards.set(r.id, recipeCard(r, { holidayId: meta.id, units, onUnits: (u) => ctx.store.setUnits(u) }));
        }
        return [h('div', { class: 'card-grid' }, ...[...cards.values()].map((c) => c.el))];
      },
      craft: () => [h('div', { class: 'card-grid' }, ...content.crafts.map((c) => craftCard(c, { holidayId: meta.id })))],
      facts: () => [
        factsGrid(ctx, meta.id, content.facts),
        notes('Sources', content.sources && content.sources.length > 0 ? h('ul', { class: 'sources-list' }, ...content.sources.map((x) => h('li', {}, x))) : null),
      ],
      say: () => {
        const grid = greetingsGrid(content.greetings);
        disposers.push(grid.destroy);
        return [grid.el];
      },
      dates: () => [
        datesBody(ctx, meta, { next, previous, following: current ? nextThree(metas, meta.id, today, ctx.region) : [], today }),
        notes('How we know', howWeKnow(ctx, meta, current?.occ ?? null), content.parentNote ? h('p', {}, content.parentNote) : null),
      ],
      sticker: () => stickerBody(ctx, meta, current, previous, today, fresh),
    };
    const sections = available.map((s) => sectionShell(s, ...build[s]()));
    const advent = content.advent && adventShown
      ? h('section', { class: 'section holiday-sec advent-sec', id: 'sec-advent', 'aria-labeledby': 'sec-advent-title' },
        h('h2', { class: 'section-title', id: 'sec-advent-title' }, icon('gift', 28), 'Advent calendar'),
        adventStrip(ctx, content.advent, today),
        h('p', { class: 'advent-more' },
          h('a', { class: 'btn btn-secondary', href: playHref(meta.id, 'doors') }, icon('gift', 20), `See all ${content.advent.length} doors`)))
      : null;
    body.replaceChildren(pills.el, ...(advent ? [advent] : []), ...sections);
    disposers.push(pills.watch(sections));

    // The Cups/Grams toggle is a saved setting, so every recipe card follows it.
    disposers.push(ctx.store.subscribe((p) => {
      if (p.units === units) return;
      units = p.units;
      for (const c of cards.values()) c.setUnits(units);
    }));

    // After the router has scrolled and focused the h1: back from Step Mode → its recipe card; `?s=` → that section.
    const settle = window.setTimeout(() => {
      if (destroyed) return;
      const card = returnTo ? cards.get(returnTo) : undefined;
      if (card?.start) {
        // Back restores the scroll the child left; only move when the Start button they pressed is off screen.
        const r = card.start.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) card.start.scrollIntoView({ block: 'center', behavior: 'instant' });
        card.start.focus({ preventScroll: true });
        return;
      }
      const target = initialSection(route.section, available);
      const section = target ? document.getElementById(sectionDomId(target)) : null;
      if (section) goToSection(section, 'instant');
    }, 0);
    disposers.push(() => window.clearTimeout(settle));
  };

  const load = (): void => {
    body.replaceChildren(loadingCard(meta));
    contentFor(meta).then(render, (err: unknown) => {
      if (destroyed) return;
      console.warn(err);
      body.replaceChildren(errorCard(load));
    });
  };
  const cached = cachedContent(meta.id);
  if (cached) render(cached); else load();

  return {
    el,
    destroy: () => {
      destroyed = true;
      hero?.destroy();
      for (const d of disposers) d();
      disposers.length = 0;
      ctx.setTheme(null);
    },
  };
};
