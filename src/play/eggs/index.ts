/**
 * Egg Painter (activity id 'eggs') — Easter and Orthodox Easter. One big egg in five curved bands.
 * Pick a color and a pattern (plain, stripes, dots, zigzag, stars), tap a band to paint it. "Surprise" paints
 * every band at random, "Undo" steps back, and "Put it in the basket" keeps a little copy of the egg in the
 * row at the bottom (the last six) and brings a fresh egg. There is no way to lose. Nothing is saved: the
 * Fridge only takes pumpkins and monsters, and widening it would mean changing shared files.
 *
 * Keyboard: Tab to the colors, patterns and bands; Enter/Space paints. No sound.
 * Motion: full → a painted band pops and a basketed egg bounces in; otherwise they just appear.
 */
import './eggs.css';
import { plural, visible } from '../../i18n/index';
import { mulberry32 } from '../../effects/rng';
import { svg, h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { createShell, fill } from '../spooky/kit';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { CREAM, eggSvg, motifs, nextEggId } from './art';
import {
  BAND_COUNT, BASKET_MAX, COLORS, PATTERNS, isEmpty, newPainter, paint, paintedCount, surprise, toBasket, undo,
  type Band, type Egg, type Painter,
} from './logic';

export const COPY = {
  title: 'Egg Painter',
  emoji: '🥚',
  blurb: 'Paint your own eggs',
  sub: 'Pick a color and a pattern, then tap a stripe of the egg.',
  colorsLabel: 'Colors',
  patternsLabel: 'Patterns',
  colorLabel: '{name}',
  patternLabel: '{name} pattern',
  bandLabel: 'Stripe {n} of {total}, {where}: {state}. Paint it.',
  where: visible(['top', 'upper middle', 'middle', 'lower middle', 'bottom']),
  empty: 'not painted yet',
  painting: 'Painting with {painted}',
  surprise: 'Surprise',
  undo: 'Undo',
  basket: 'Put it in the basket',
  announceSurprise: 'Surprise! Every stripe is painted.',
  announceUndo: 'Undone.',
  announceBasket: 'Into the basket! Here is a fresh egg.',
} as const;

const PAINTED = {
  plain: '{color} plain',
  stripes: '{color} stripes',
  dots: '{color} dots',
  zigzag: '{color} zigzag',
  stars: '{color} stars',
} as const;

const COUNTS = {
  eggLabel: { one: 'Your egg, {n} of {total} stripe painted', other: 'Your egg, {n} of {total} stripes painted' },
  basketLabel: { one: 'Basket: {n} of {max} egg', other: 'Basket: {n} of {max} eggs' },
  announceFresh: { one: 'Basket: {n} of {max} egg.', other: 'Basket: {n} of {max} eggs.' },
} as const;

export const eggsActivity: Activity = {
  id: 'eggs',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  available: (meta) => meta.id === 'easter' || meta.id === 'orthodox-easter',
  mount: (env) => mountEggs(env),
};

function mountEggs(env: PlayEnv): ActivityInstance {
  const { ctx } = env;
  const shell = createShell(env, { game: 'eg', title: COPY.title, sub: COPY.sub });
  const rand = mulberry32((Date.now() ^ 0x510e527f) >>> 0);
  let state: Painter = newPainter();
  let color = 0;
  let pattern = 1;

  const stage = h('div', { class: 'eg-stage' });
  const status = h('p', { class: 'eg-status' });
  const colorBtns = COLORS.map((c, i) => h('button', {
    type: 'button', class: 'eg-swatch eg-color', style: `--eg-c: ${c.hex}`, 'aria-label': fill(COPY.colorLabel, { name: c.name }), onclick: () => { color = i; syncPicks(); },
  }));
  const patternBtns = PATTERNS.map((p, i) => h('button', {
    type: 'button', class: 'eg-swatch eg-pattern', 'aria-label': fill(COPY.patternLabel, { name: p.name }), onclick: () => { pattern = i; syncPicks(); },
  }));
  const surpriseBtn = h('button', { type: 'button', class: 'btn btn-secondary eg-act', onclick: () => commit(surprise(state, rand), COPY.announceSurprise) }, icon('shuffle', 20), COPY.surprise);
  const undoBtn = h('button', { type: 'button', class: 'btn btn-secondary eg-act', onclick: () => commit(undo(state), COPY.announceUndo) }, icon('back', 20), COPY.undo);
  const basketBtn = h('button', { type: 'button', class: 'btn eg-act eg-put', onclick: putInBasket }, icon('check', 20), COPY.basket);
  const tray = h('ol', { class: 'eg-basket', role: 'img', 'aria-label': '' });

  shell.body.append(h('div', { class: 'eg-layout' },
    stage,
    status,
    h('div', { class: 'eg-pick', role: 'group', 'aria-label': COPY.colorsLabel }, ...colorBtns),
    h('div', { class: 'eg-pick', role: 'group', 'aria-label': COPY.patternsLabel }, ...patternBtns),
    h('div', { class: 'eg-actions' }, surpriseBtn, undoBtn, basketBtn),
    tray));

  const current = (): Band => ({ color, pattern });

  function patternThumb(i: number): SVGSVGElement {
    const id = nextEggId();
    const g = svg('g', { 'clip-path': `url(#${id})` }, svg('rect', { width: 44, height: 44, fill: i === 0 ? COLORS[color]!.hex : CREAM }));
    g.append(...motifs(PATTERNS[i]!.id, COLORS[color]!.hex, 0, 0, 44, 44, 0.5));
    return svg('svg', { viewBox: '0 0 44 44', 'aria-hidden': 'true', focusable: 'false' },
      svg('defs', {}, svg('clipPath', { id }, svg('circle', { cx: 22, cy: 22, r: 20 }))), g,
      svg('circle', { cx: 22, cy: 22, r: 20, fill: 'none', stroke: '#1f1a3d', 'stroke-width': 2 }));
  }

  function syncPicks(): void {
    colorBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === color)));
    patternBtns.forEach((b, i) => { b.setAttribute('aria-pressed', String(i === pattern)); b.replaceChildren(patternThumb(i)); });
    status.textContent = fill(COPY.painting, { painted: paintedAs(current()) });
  }

  const paintedAs = (b: Band): string => fill(PAINTED[PATTERNS[b.pattern]!.id as keyof typeof PAINTED], { color: COLORS[b.color]!.name });
  const bandState = (b: Band | null): string => (b ? paintedAs(b) : COPY.empty);

  function renderEgg(popped: number | null): void {
    const focused = stage.querySelector<SVGElement>('.eg-hit:focus');
    const keep = focused ? Number(focused.dataset['band']) : null;
    const art = eggSvg(state.egg, nextEggId(), 'eg-egg', true);
    art.svg.setAttribute('role', 'group');
    art.svg.setAttribute('aria-label', plural(BAND_COUNT, COUNTS.eggLabel, { n: paintedCount(state.egg), total: BAND_COUNT }));
    art.hits.forEach((hit, i) => {
      hit.dataset['band'] = String(i);
      hit.setAttribute('aria-label', fill(COPY.bandLabel, { n: i + 1, total: BAND_COUNT, where: COPY.where[i]!, state: bandState(state.egg[i] ?? null) }));
      hit.addEventListener('click', () => commit(paint(state, i, current()), null, i));
      hit.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        commit(paint(state, i, current()), null, i);
      });
    });
    stage.replaceChildren(art.svg);
    if (popped !== null && shell.full()) art.svg.querySelectorAll('.eg-painted')[paintedIndex(popped)]?.classList.add('is-new');
    if (keep !== null) art.hits[keep]?.focus({ preventScroll: true });
  }

  /** Which `.eg-painted` group is band `i` (empty bands have none). */
  const paintedIndex = (i: number): number => state.egg.slice(0, i).filter((b) => b !== null).length;

  function renderBasket(newest: boolean): void {
    const n = state.basket.length;
    tray.setAttribute('aria-label', plural(BASKET_MAX, COUNTS.basketLabel, { n, max: BASKET_MAX }));
    tray.replaceChildren(...Array.from({ length: BASKET_MAX }, (_, k) => {
      const egg: Egg | undefined = state.basket[k];
      const last = newest && k === n - 1;
      return h('li', { class: `eg-slot${egg ? ' is-filled' : ''}${last && shell.full() ? ' is-new' : ''}` }, egg ? eggSvg(egg, nextEggId(), 'eg-mini').svg : null);
    }));
  }

  function renderControls(): void {
    undoBtn.disabled = state.undo.length === 0;
    basketBtn.disabled = isEmpty(state.egg);
  }

  function commit(next: Painter, say: string | null, popped: number | null = null): void {
    if (next === state) return;
    state = next;
    renderEgg(popped);
    renderControls();
    if (say) ctx.announce(say);
  }

  function putInBasket(): void {
    const next = toBasket(state);
    if (next === state) return;
    state = next;
    renderEgg(null);
    renderBasket(true);
    renderControls();
    ctx.announce(`${COPY.announceBasket} ${plural(BASKET_MAX, COUNTS.announceFresh, { n: state.basket.length, max: BASKET_MAX })}`);
    (stage.querySelector<SVGElement>('.eg-hit'))?.focus({ preventScroll: true });
  }

  syncPicks();
  renderEgg(null);
  renderBasket(false);
  renderControls();
  return { el: shell.root, destroy: () => shell.destroy() };
}
