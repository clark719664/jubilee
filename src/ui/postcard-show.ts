/**
 * The tracker postcards on screen: the pop-up that flips in over the globe when Santa or
 * midnight reaches a headline city, the album (a section of the Sticker Book, and a dialog
 * behind the World view's "Album" buttons), and their words.
 *
 *   const show = postcardShow({ stage, globe, live, motion, album });
 *   show.push('santa', arrivals, 2026);   // from LiveLayers' onArrive
 *
 * One card at a time: the globe eases to a close zoom on the city (it snaps under reduced
 * motion), the card flips in (fades, under reduced motion) and stays about six seconds. A tap
 * (or Enter) keeps it; a second tap, the × or Escape puts it away. While a card is up the
 * running show's clock is held, so the sleigh waits over the city and nothing is skipped.
 * Every card shown goes into the album (localStorage, or memory while pretending).
 */
import './postcards.css';
import type { MotionMode } from '../effects/types';
import { albumEntries, albums, albumTitle, type AlbumSave, type AlbumStorage, type PostcardArrival, type PostcardKind } from '../world/album';
import { CITIES } from '../world/data/cities';
import { countryName } from '../world/data/countries';
import { postcardFor } from '../world/data/postcards';
import type { ShowKind } from '../world/live';
import { drawPostcard, postcardWords, type PostcardView } from '../world/postcards';
import { h, trapFocus } from './dom';
import { icon } from './icons';

export const POSTCARD_COPY = {
  arrived: 'A postcard from {city}, {country}!',
  greetingIs: 'They say {greeting}.',
  keep: 'Tap to keep it',
  kept: 'Kept! Tap again to put it away',
  close: 'Put the postcard away',
  album: 'Album',
  albumAria: 'Open the postcard album',
  albumTitle: 'Postcard album',
  sectionTitle: 'Postcards',
  count: '{n} of {total}',
  empty: 'No postcards yet. Watch Santa’s route or the New Year wave on the World page, and every city they reach sends you one.',
  emptyCta: 'Go to the World',
  pretendNote: 'Postcards collected while pretending are kept until you close the page.',
} as const;

const fill = (s: string, vars: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/** How long a card stays up unless kept. */
export const POSTCARD_MS = 6000;
/** How close the camera zooms on the city. */
export const POSTCARD_ZOOM = 2.5;

export const kindOf = (show: ShowKind): PostcardKind => (show === 'santa' ? 'christmas' : 'newyear');

/** What a screen reader hears when a card arrives. */
export function arrivalText(v: PostcardView): string {
  const w = postcardWords(v);
  const roman = w.roman ? ` (${w.roman})` : '';
  const said = fill(POSTCARD_COPY.greetingIs, { greeting: `“${w.greeting}”${roman}` }).replace(/([!?.])”\./, '$1”');
  return `${fill(POSTCARD_COPY.arrived, { city: v.city.name, country: countryName(v.city.country) })} ${said}`;
}

// ───────────────────────────────────────────────────────── the pop-up

export interface PostcardCamera {
  readonly mode: 'globe' | 'map';
  spinTo(lon: number, lat: number, ms?: number): void;
  getZoom(): number;
  zoomBy(f: number): void;
}

export interface PostcardShowDeps {
  /** The globe's stage (position: relative): the card pops over it. */
  readonly stage: HTMLElement;
  readonly globe: PostcardCamera;
  /** Holds the show clock while a card is up. */
  readonly live: { hold(on: boolean): void };
  readonly motion: () => MotionMode;
  readonly album: AlbumStorage;
  /** A card went into the album (refresh counts). */
  readonly onCollect?: () => void;
  /** Stops the globe's idle spin and follow (the child is looking at a card). */
  readonly quiet?: () => void;
}

export interface PostcardShow {
  /** Queues the postcards a step reached. */
  push(kind: ShowKind, items: readonly PostcardArrival[], year: number): void;
  /** Whether a card is up (or about to be). */
  readonly busy: boolean;
  /** Puts the current card away (Escape). Returns false when none was up. */
  dismiss(): boolean;
  destroy(): void;
}

interface Queued { readonly kind: PostcardKind; readonly year: number; readonly item: PostcardArrival }

export function postcardShow(d: PostcardShowDeps): PostcardShow {
  const queue: Queued[] = [];
  const live = h('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  d.stage.append(live);
  let current: { el: HTMLElement; kept: boolean; timer: number; zoomed: number; hint: HTMLElement; button: HTMLButtonElement } | null = null;
  let pending = 0;
  let busy = false;
  let destroyed = false;

  const full = (): boolean => d.motion() === 'full';

  function fit(el: HTMLElement, ratio: number): void {
    const w = d.stage.clientWidth;
    const hgt = d.stage.clientHeight;
    const narrow = w < 560;
    const maxW = Math.min(narrow ? w - 16 : Math.max(300, w * 0.46), 440, (hgt - 16 - 52) / ratio);
    el.style.width = `${Math.max(180, Math.floor(maxW))}px`;
  }

  function next(): void {
    if (destroyed) return;
    const q = queue.shift();
    if (!q) {
      busy = false;
      d.live.hold(false);
      return;
    }
    busy = true;
    d.live.hold(true);
    d.quiet?.();
    const { city, at, card } = q.item;
    const isNew = d.album.add({ kind: q.kind, year: q.year, cityId: city.id, at });
    if (isNew) d.onCollect?.();
    // Ease in close on the city (a snap under reduced motion).
    const z0 = d.globe.getZoom();
    const zoomed = z0 < POSTCARD_ZOOM ? POSTCARD_ZOOM / z0 : 1;
    d.globe.spinTo(city.lon, d.globe.mode === 'globe' ? city.lat : 0, 1200);
    if (zoomed !== 1) d.globe.zoomBy(zoomed);
    const view: PostcardView = { kind: q.kind, city, card, at };
    pending = window.setTimeout(() => open(view, zoomed), full() ? 1000 : 0);
  }

  function open(view: PostcardView, zoomed: number): void {
    pending = 0;
    if (destroyed) return;
    const art = drawPostcard(view);
    // The card's shape, from its viewBox ("x y w h"): it is as tall as its words need.
    const [, , vbW, vbH] = (art.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
    const ratio = vbW && vbH ? vbH / vbW : 1.1;
    art.setAttribute('aria-hidden', 'true');
    art.removeAttribute('role');
    const hint = h('span', { class: 'postcard-pop-hint' }, POSTCARD_COPY.keep);
    const button = h('button', {
      type: 'button', class: 'postcard-pop-card',
      'aria-label': `${arrivalText(view)} ${POSTCARD_COPY.keep}.`,
      onclick: () => tap(),
    }, art);
    const close = h('button', { type: 'button', class: 'btn btn-secondary btn-icon postcard-pop-x', 'aria-label': POSTCARD_COPY.close, onclick: () => dismiss() }, icon('close', 20));
    const el = h('div', { class: `postcard-pop${full() ? '' : ' is-calm'}`, 'data-city': view.city.id }, button, h('div', { class: 'postcard-pop-foot' }, hint, close));
    el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dismiss(); } });
    fit(el, ratio);
    d.stage.append(el);
    live.textContent = arrivalText(view);
    const timer = window.setTimeout(() => { if (current && !current.kept) dismiss(); }, POSTCARD_MS + (full() ? 600 : 0));
    current = { el, kept: false, timer, zoomed, hint, button };
  }

  function tap(): void {
    if (!current) return;
    if (!current.kept) {
      current.kept = true;
      window.clearTimeout(current.timer);
      current.hint.textContent = POSTCARD_COPY.kept;
      current.el.classList.add('is-kept');
      current.button.setAttribute('aria-label', `${current.button.getAttribute('aria-label')?.replace(`${POSTCARD_COPY.keep}.`, '') ?? ''}${POSTCARD_COPY.kept}.`);
      return;
    }
    dismiss();
  }

  function dismiss(): boolean {
    if (pending) {
      window.clearTimeout(pending);
      pending = 0;
    }
    const c = current;
    if (!c) {
      if (busy) next();
      return false;
    }
    current = null;
    window.clearTimeout(c.timer);
    const hadFocus = c.el.contains(document.activeElement);
    const gone = (): void => {
      c.el.remove();
      if (c.zoomed !== 1) d.globe.zoomBy(1 / c.zoomed);
      if (hadFocus) d.stage.focus({ preventScroll: true });
      next();
    };
    if (full()) {
      c.el.classList.add('is-leaving');
      window.setTimeout(gone, 260);
    } else {
      gone();
    }
    return true;
  }

  return {
    push(kind, items, year) {
      for (const item of items) queue.push({ kind: kindOf(kind), year, item });
      // Never let a backlog build up (a sleeping tab): at most four waiting.
      while (queue.length > 4) queue.shift();
      if (!busy && items.length > 0) next();
    },
    get busy() { return busy; },
    dismiss,
    destroy() {
      destroyed = true;
      window.clearTimeout(pending);
      if (current) { window.clearTimeout(current.timer); current.el.remove(); }
      current = null;
      queue.length = 0;
      d.live.hold(false);
      live.remove();
    },
  };
}

// ───────────────────────────────────────────────────────── the album

/** A small card for the album grid (the whole postcard, scaled down). */
function albumCard(kind: PostcardKind, cityId: string, at: number): HTMLElement | null {
  const card = postcardFor(cityId);
  const city = CITIES.find((c) => c.id === cityId);
  if (!card || !city) return null;
  const art = drawPostcard({ kind, city, card, at });
  return h('li', { class: 'postcard-album-item' }, art);
}

/**
 * Every album with at least one card, newest first ("Postcards from Christmas Eve 2026"), each
 * with its cards in the order they arrived; or the friendly empty state. `kind` limits it to
 * Santa's or the wave's albums.
 */
export function albumBody(save: AlbumSave, opts: { kind?: PostcardKind; pretending?: boolean; worldHref?: string | null } = {}): HTMLElement {
  const groups = albums(save).filter((g) => opts.kind === undefined || g.kind === opts.kind);
  const total = CITIES.filter((c) => postcardFor(c.id)).length;
  if (groups.length === 0) {
    return h('div', { class: 'postcard-album-empty' },
      h('p', {}, POSTCARD_COPY.empty),
      opts.worldHref ? h('a', { class: 'btn btn-secondary', href: opts.worldHref }, POSTCARD_COPY.emptyCta) : null);
  }
  const body = h('div', { class: 'postcard-album' });
  for (const g of groups) {
    const items = g.entries.map((e) => albumCard(e.kind, e.cityId, e.at)).filter((x): x is HTMLElement => x !== null);
    body.append(h('section', { class: 'postcard-album-group' },
      h('h3', { class: 'postcard-album-title' }, albumTitle(g.kind, g.year),
        h('span', { class: 'postcard-album-count' }, fill(POSTCARD_COPY.count, { n: g.entries.length, total }))),
      h('ul', { class: 'postcard-album-grid' }, ...items)));
  }
  if (opts.pretending) body.append(h('p', { class: 'small muted' }, POSTCARD_COPY.pretendNote));
  return body;
}

/** How many cards an album holds (for the Album buttons). */
export function albumCount(save: AlbumSave, kind?: PostcardKind): number {
  return albumEntries(save, kind).length;
}

/** The album as a dialog over the World view. Escape, the × or a tap outside closes it. */
export function albumDialog(host: HTMLElement, save: AlbumSave, kind: PostcardKind | undefined, pretending: boolean, onClose: () => void = () => {}): { close(): void } {
  const id = `pc-album-${Math.random().toString(36).slice(2, 8)}`;
  const closeBtn = h('button', { type: 'button', class: 'btn btn-secondary btn-icon', 'aria-label': POSTCARD_COPY.close, onclick: () => close() }, icon('close', 22));
  const card = h('div', { class: 'postcard-dlg-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': id },
    h('div', { class: 'postcard-dlg-head' }, h('h2', { class: 'h3', id }, POSTCARD_COPY.albumTitle), closeBtn),
    albumBody(save, { ...(kind ? { kind } : {}), pretending }));
  const el = h('div', { class: 'postcard-dlg' }, card);
  el.addEventListener('pointerdown', (e) => { if (e.target === el) close(); });
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
  const back = document.activeElement as HTMLElement | null;
  host.append(el);
  const untrap = trapFocus(card);
  let open = true;
  function close(): void {
    if (!open) return;
    open = false;
    untrap();
    el.remove();
    onClose();
    back?.focus?.({ preventScroll: true });
  }
  closeBtn.focus({ preventScroll: true });
  return { close };
}
