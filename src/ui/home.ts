/**
 * Home — "Next up" (§3.1, §3.5, §9.1–9.4, §9.12–9.14):
 *
 *   Hero               the next holiday counting down — or Celebration Mode on the day itself (celebrate.ts)
 *   [Hello]            one greeting a day from the next-up holiday, with "Hear it" when a voice exists
 *   [Name card]        first launch only: "What should we call you?"
 *   [Happening now]    everything else on today (only when there is something)
 *   After that…        the next three holidays as mini tiles
 *   Sticker book       the last three stickers earned and this year's count
 *
 * The pretend banner belongs to the shell. main.ts re-mounts this view on every route change and when the
 * MidnightTicker sees a new day, so the view renders "today" once and tidies up in destroy().
 */
import type { AppContext, ViewFactory } from '../app/context';
import { NAME_MAX, type Progress } from '../app/state';
import { loadContent } from '../content/loader';
import { stickerLabel } from '../content/registry';
import type { Greeting, HolidayMeta } from '../content/types';
import { formatIso, toDayNumber, type CivilDate } from '../dates/civil';
import {
  afterThat, happeningNow, isOnForRegion, nextUp, stackedToday, statusOf, type Occurrence, type Status, type Upcoming,
} from '../dates/occurrences';
import { THEMES } from '../theme/themes';
import { mountCelebration } from './celebrate';
import { COPY, fmt, VIEW_NAMES } from './copy';
import { h } from './dom';
import { canHear, onVoicesChanged, speak } from './greetings';
import { mountHero } from './hero';
import { icon } from './icons';
import { mascot } from './mascot';
import { stripBadge, tileElement } from './parade';
import { stickerBook } from './sticker-book';

/** "After that…" shows this many holidays. */
const AFTER_COUNT = 3;
/** The sticker teaser shows the most recent few. */
const TEASER_COUNT = 3;
/** How far down the next-up list the morning hello looks for a holiday with greetings. */
const HELLO_LOOKAHEAD = 5;

// ───────────────────────────────────────────────────────── pure helpers (tested)

/** Celebration Mode (§9.3): the hero's headline day is today, or it begins at sundown tonight. */
export function isCelebration(status: Status): boolean {
  return status.kind === 'ongoing' && (status.sleepsToMain === 0 || status.tonight);
}

/** The morning hello shows on the first Home visit of the day (and stays for the rest of that session). */
export function helloDue(greetedToday: string | undefined, todayIso: string, shownThisSession: string | null): boolean {
  return greetedToday !== todayIso || shownThisSession === todayIso;
}

/** The first-launch name card: no name yet, nothing but today in the open-days log, not skipped this session. */
export function nameCardDue(p: Pick<Progress, 'name' | 'openDays'>, todayIso: string, skipped: boolean): boolean {
  return !skipped && !p.name && p.openDays.every((d) => d === todayIso);
}

/** Today's greeting: the same one all day, a different one tomorrow. */
export function pickGreeting<T>(greetings: readonly T[], day: number): T | null {
  const n = greetings.length;
  return n === 0 ? null : greetings[((day % n) + n) % n] ?? null;
}

/** "Good morning, Maya!" before noon, "Hello, Maya!" after. */
export function helloHi(hour: number, name: string | undefined): string {
  return `${hour < 12 ? 'Good morning' : 'Hello'}${name ? `, ${name}` : ''}!`;
}

export interface EarnedSticker { readonly holidayId: string; readonly year: number; readonly date: string }

/** The `n` most recently earned stickers (`${holidayId}:${year}` → ISO date), newest first. */
export function latestStickers(stickers: Readonly<Record<string, string>>, n: number): EarnedSticker[] {
  const out: EarnedSticker[] = [];
  for (const [key, date] of Object.entries(stickers)) {
    const at = key.lastIndexOf(':');
    const year = Number(key.slice(at + 1));
    if (at <= 0 || !Number.isInteger(year)) continue;
    out.push({ holidayId: key.slice(0, at), year, date });
  }
  out.sort((a, b) => (a.date === b.date ? b.year - a.year || a.holidayId.localeCompare(b.holidayId) : a.date < b.date ? 1 : -1));
  return out.slice(0, Math.max(0, n));
}

// ───────────────────────────────────────────────────────── session memory

/** The day the morning hello first appeared in this session (it stays up for the rest of the visit). */
let helloShownOn: string | null = null;
/** "Skip" on the name card lasts for the session; the card only ever appears on the first day anyway. */
let nameCardSkipped = false;

// ───────────────────────────────────────────────────────── pieces

interface Piece { readonly el: HTMLElement; destroy(): void }

function helloCard(ctx: AppContext, g: Greeting): Piece {
  const hear = h('button', { class: 'btn btn-secondary btn-icon hello-hear hidden', type: 'button', 'aria-label': `${COPY.hearIt}: ${g.text}` },
    icon('speaker', 20));
  hear.addEventListener('click', () => { speak(g.text, g.lang); });
  const refresh = (): void => { hear.classList.toggle('hidden', !canHear(g.text, g.lang)); };
  refresh();
  const stop = onVoicesChanged(refresh);
  const el = h('section', { class: 'hello card', 'aria-label': 'Today’s hello' },
    h('div', { class: 'hello-text' },
      h('p', { class: 'hello-hi' }, helloHi(ctx.clock.now().getHours(), ctx.store.progress.name)),
      h('p', { class: 'hello-word', lang: g.lang }, g.text),
      h('p', { class: 'hello-say' }, g.sayIt),
      h('p', { class: 'hello-mean' }, `“${g.meaning}”`),
    ),
    hear,
  );
  return { el, destroy: stop };
}

function nameCard(ctx: AppContext, done: (name: string | null) => void): HTMLElement {
  const inputId = 'home-name';
  const titleId = 'home-name-title';
  const input = h('input', {
    class: 'input', id: inputId, type: 'text', maxlength: NAME_MAX, autocomplete: 'given-name', placeholder: 'Your name',
  });
  const form = h('form', { class: 'name-card', 'aria-labeledby': titleId },
    h('div', { class: 'name-card-head' },
      h('span', { class: 'name-card-emoji emoji', 'aria-hidden': 'true' }, '🌟'),
      h('h2', { class: 'h3', id: titleId }, COPY.whatShouldWeCallYou),
    ),
    h('div', { class: 'name-row' },
      h('label', { class: 'sr-only', for: inputId }, 'Your name'),
      input,
      h('button', { class: 'btn', type: 'submit' }, COPY.nameSave),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => done(null) }, COPY.nameSkip),
    ),
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    ctx.store.setName(name);
    done(name);
  });
  return form;
}

function strip(title: string, tiles: readonly HTMLElement[], cls = ''): HTMLElement {
  return h('section', { class: `strip${cls ? ` ${cls}` : ''}` },
    h('h2', { class: 'strip-title' }, title),
    h('div', { class: 'strip-row' }, ...tiles),
  );
}

function stickerTeaser(ctx: AppContext, today: CivilDate): HTMLElement {
  const progress = ctx.store.progress;
  const customIds = new Set(ctx.customs.map((c) => c.id));
  const book = stickerBook(ctx.allMetas(), customIds, progress, today.y, today, ctx.region);
  const latest = latestStickers(progress.stickers, TEASER_COUNT)
    .map((s) => ({ s, meta: ctx.metaOf(s.holidayId) }))
    .filter((x): x is { s: EarnedSticker; meta: HolidayMeta } => x.meta !== undefined);
  const shelf = latest.length > 0
    ? h('div', { class: 'teaser-shelf' }, ...latest.map(({ s, meta }) => h('span', { class: 'sticker is-earned' },
      h('span', { class: 'sticker-emoji', 'aria-hidden': 'true' }, meta.sticker.emoji),
      h('span', { class: 'sticker-label' }, stickerLabel(meta, s.year)),
    )))
    : h('span', { class: 'teaser-empty' }, mascot('curious', 72), h('span', {}, COPY['empty.stickers']));
  return h('section', { class: 'strip home-stickers' },
    h('h2', { class: 'strip-title' }, VIEW_NAMES.stickers),
    h('a', { class: 'teaser card', href: '#/stickers' },
      shelf,
      h('span', { class: 'teaser-count' },
        h('strong', {}, fmt('stickerCount', { have: book.have, total: book.total })),
        h('span', { class: 'teaser-go' }, icon('chevron', 20)),
      ),
    ),
  );
}

// ───────────────────────────────────────────────────────── the view

export const homeView: ViewFactory<'home'> = (ctx) => {
  const today = ctx.clock.today();
  const t = toDayNumber(today);
  const iso = formatIso(today);
  const disposers: (() => void)[] = [];
  let destroyed = false;

  const list = nextUp(ctx.metas, ctx.customs, today, ctx.region, ctx.everywhere);
  const lead = list[0];
  const leadMeta = lead ? ctx.metaOf(lead.occ.holidayId) : undefined;
  ctx.setTheme(leadMeta ? THEMES[leadMeta.theme] : null);

  const el = h('div', { class: 'home' });

  // ── hero, or Celebration Mode on the day ──
  if (lead && leadMeta) {
    const stacked = stackedToday(ctx.metas, ctx.customs, today, ctx.region)
      .filter((o) => !(o.holidayId === lead.occ.holidayId && o.start === lead.occ.start))
      .map((occ) => ({ occ, meta: ctx.metaOf(occ.holidayId) }))
      .filter((x): x is { occ: Occurrence; meta: HolidayMeta } =>
        x.meta !== undefined && x.meta.tier !== 3 && isOnForRegion(x.meta, ctx.region, ctx.everywhere));
    const base = { meta: leadMeta, occ: lead.occ, status: lead.status, today, ...(stacked.length > 0 ? { stacked } : {}) };
    if (isCelebration(lead.status)) {
      const following = afterThat(list, 1)[0];
      const followingMeta = following ? ctx.metaOf(following.occ.holidayId) : undefined;
      const party = mountCelebration(ctx, {
        ...base, ...(following && followingMeta ? { next: { meta: followingMeta, upcoming: following } } : {}),
      });
      el.append(party.hero.el, party.sheet);
      disposers.push(party.destroy);
    } else {
      const hero = mountHero(ctx, { ...base, mode: 'home', showPeek: true });
      el.append(hero.el);
      disposers.push(hero.destroy);
    }
  } else {
    // Only reachable at the very end of the tables' coverage: say so, never guess.
    el.append(h('section', { class: 'card card-pad stack center home-beyond' },
      mascot('sleepy', 120),
      h('h1', { class: 'h1' }, VIEW_NAMES.home),
      h('p', { class: 'lead' }, COPY.beyondCoverage),
    ));
  }

  // ── morning hello (filled in when the holiday's content chunk arrives) and the first-launch name card ──
  const cards = h('div', { class: 'home-cards' });
  el.append(cards);
  let hello: Piece | null = null;
  let card: HTMLElement | null = null;
  const showHello = (): void => {
    if (!helloDue(ctx.store.progress.greetedToday, iso, helloShownOn)) return;
    const candidates = list.slice(0, HELLO_LOOKAHEAD)
      .map((u) => ctx.metaOf(u.occ.holidayId))
      .filter((m, i, all): m is HolidayMeta => m !== undefined && all.findIndex((x) => x?.id === m.id) === i);
    const tryNext = (i: number): void => {
      const meta = candidates[i];
      if (!meta || destroyed) return;
      loadContent(meta.id)
        .then((content) => {
          if (destroyed) return;
          const g = pickGreeting(content.greetings, t);
          if (!g) { tryNext(i + 1); return; }
          hello?.destroy();
          hello = helloCard(ctx, g);
          cards.prepend(hello.el);
          helloShownOn = iso;
          ctx.store.setGreeted(today);
        })
        .catch(() => tryNext(i + 1));
    };
    tryNext(0);
  };
  showHello();
  disposers.push(() => hello?.destroy());

  if (nameCardDue(ctx.store.progress, iso, nameCardSkipped)) {
    card = nameCard(ctx, (name) => {
      if (name === null) nameCardSkipped = true;
      else ctx.toast(`Hi, ${name}!`, '👋');
      card?.remove();
      card = null;
      // Re-greet with the new name, and leave focus somewhere sensible (the hello, or the page title).
      if (name !== null && hello) {
        const g = hello.el;
        hello.destroy();
        hello = null;
        g.remove();
        showHello();
      }
      const heading = el.querySelector<HTMLElement>('h1');
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
    cards.append(card);
  }

  // ── Happening now ──
  const now = happeningNow(ctx.metas, ctx.customs, today, ctx.region)
    .filter((occ) => !(lead && occ.holidayId === lead.occ.holidayId && occ.start === lead.occ.start))
    .map((occ) => ({ u: { occ, status: statusOf(occ, today) }, meta: ctx.metaOf(occ.holidayId) }))
    .filter((x): x is { u: Upcoming; meta: HolidayMeta } => x.meta !== undefined);
  if (now.length > 0) {
    el.append(strip(COPY.happeningNow, now.map(({ u, meta }) => {
      const badge = stripBadge(u, meta);
      return tileElement(meta, { when: badge.text, now: badge.now, mini: true });
    }), 'strip-now'));
  }

  // ── After that… ──
  const after = afterThat(list, AFTER_COUNT)
    .map((u) => ({ u, meta: ctx.metaOf(u.occ.holidayId) }))
    .filter((x): x is { u: Upcoming; meta: HolidayMeta } => x.meta !== undefined);
  if (after.length > 0) {
    el.append(strip(COPY.afterThat, after.map(({ u, meta }) => {
      const badge = stripBadge(u, meta);
      return tileElement(meta, { when: badge.text, now: badge.now, mini: true });
    })));
  }

  // ── sticker book teaser (on the holiday itself the peeled sticker's sheet already leads there) ──
  if (!(lead && isCelebration(lead.status))) el.append(stickerTeaser(ctx, today));

  return {
    el,
    destroy() {
      destroyed = true;
      for (const d of disposers.splice(0)) {
        try { d(); } catch (err) { console.error(err); }
      }
      ctx.setTheme(null);
    },
  };
};
