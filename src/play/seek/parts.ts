/**
 * parts.ts — the small DOM pieces of Seek & Find: mystery strip cards, scene stamps,
 * sparkles, the miss ripple, the hint glow and confetti. Everything is built with h()/svg(); positions
 * and per-piece randomness go through CSSOM custom properties.
 */
import type { Findable } from '../../art/index';
import { h, svg } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { capital, say, thing } from './copy';
import { cropFor } from './geometry';

/** Card thumbnail size in CSS px (the crop is computed for this box). */
export const THUMB = 64;

const setVars = (el: HTMLElement | SVGElement, vars: Record<string, string | number>): void => {
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, typeof v === 'number' ? `${v}px` : v);
};

export interface CardParts {
  readonly li: HTMLLIElement;
  readonly button: HTMLButtonElement;
}

/**
 * A die-cut strip card: a "?" until found, because any crop of mid.svg also shows what the thing is
 * sitting on, which is the answer. Once found, the crop blooms in under a little stamp.
 */
export function buildCard(f: Findable, midUrl: string | null, index: number): CardParts {
  const window = h('span', { class: 'seek-thumb', 'aria-hidden': 'true' }, h('span', { class: 'seek-thumb-q' }, '?'));
  if (midUrl) {
    const c = cropFor(f, THUMB);
    const img = h('img', { class: 'seek-thumb-img', src: midUrl, alt: '', decoding: 'async' });
    img.setAttribute('draggable', 'false');
    setVars(img, { width: c.width, height: c.height, left: c.left, top: c.top });
    window.append(img);
  }
  const tick = h('span', { class: 'seek-tick', 'aria-hidden': 'true' }, icon('check', 18));
  const button = h('button', {
    class: 'seek-card', type: 'button', 'data-id': f.id, 'aria-label': say('card', { thing: thing(f.label) }),
  }, window, h('span', { class: 'seek-card-label' }, capital(thing(f.label))), tick);
  button.style.setProperty('--tilt', `${[-3, 2, -1.5, 3, -2.5, 1.5][index % 6]}deg`);
  return { li: h('li', { class: 'seek-cards-item' }, button), button };
}

/** The stamp left on the picture where something was found (screen-space, follows pan/zoom). */
export function buildStamp(): HTMLElement {
  return h('span', { class: 'seek-stamp' }, h('span', { class: 'seek-stamp-ring' }), h('span', { class: 'seek-stamp-badge' }, icon('check', 20)));
}

const STAR = 'M12 2l2.4 6.9L21 10l-5.4 4.3L17.5 21 12 17.3 6.5 21l1.9-6.7L3 10l6.6-1.1L12 2z';

/** A burst of eight little stars from (x, y); removed when it is done. */
export function sparkle(host: HTMLElement, x: number, y: number, colors: readonly string[]): void {
  const burst = h('span', { class: 'seek-sparkle' });
  setVars(burst, { left: x, top: y });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + (i % 2) * 0.3;
    const dist = 46 + (i % 3) * 18;
    const star = svg('svg', { class: 'seek-spark', viewBox: '0 0 24 24', width: 22, height: 22 }, svg('path', { d: STAR, fill: colors[i % colors.length] ?? '#ffd166' }));
    setVars(star, { '--dx': Math.cos(a) * dist, '--dy': Math.sin(a) * dist, '--rot': `${(i * 47) % 180}deg`, '--d': `${(i % 4) * 30}ms` });
    burst.append(star);
  }
  host.append(burst);
  window.setTimeout(() => burst.remove(), 1000);
}

/**
 * The found thing "jumps out of the picture": a round window onto mid.svg exactly over the find (same
 * scale, so it lines up pixel for pixel) that swells, tilts and settles back. Full motion only.
 * `s`/`ox`/`oy` are the current artboard → screen transform.
 */
export function popOut(host: HTMLElement, midUrl: string, f: Findable, s: number, ox: number, oy: number): void {
  const d = Math.max(44, (f.r * 2 + 16) * s);
  const cx = ox + f.x * s;
  const cy = oy + f.y * s;
  const img = h('img', { class: 'seek-pop-img', src: midUrl, alt: '', decoding: 'async' });
  img.setAttribute('draggable', 'false');
  setVars(img, { width: 1600 * s, height: 900 * s, left: d / 2 - f.x * s, top: d / 2 - f.y * s });
  const pop = h('span', { class: 'seek-pop' }, img);
  setVars(pop, { left: cx, top: cy, '--d': d });
  // Beneath the stamps, so the stamp ring slams down on top of the swelling thing.
  host.prepend(pop);
  window.setTimeout(() => pop.remove(), 1100);
}

/** The soft "not there" ripple: a ring that spreads and fades. Never a penalty. */
export function ripple(host: HTMLElement, x: number, y: number): void {
  const r = h('span', { class: 'seek-ripple' });
  setVars(r, { left: x, top: y });
  host.append(r);
  window.setTimeout(() => r.remove(), 700);
}

/** A cheer bubble that floats up from the find ("Eagle eyes!"). */
export function cheer(host: HTMLElement, x: number, y: number, text: string): void {
  const c = h('span', { class: 'seek-cheer' }, text);
  setVars(c, { left: x, top: y });
  host.append(c);
  window.setTimeout(() => c.remove(), 1500);
}

/** Paper confetti for the finish (full motion only). */
export function confetti(host: HTMLElement, colors: readonly string[], seed: number): void {
  const box = h('div', { class: 'seek-confetti', 'aria-hidden': 'true' });
  let s = seed >>> 0 || 1;
  const rnd = (): number => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 44; i++) {
    const bit = h('i');
    setVars(bit, {
      '--x': `${Math.round(rnd() * 100)}%`, '--drift': Math.round((rnd() - 0.5) * 160), '--spin': `${Math.round(360 + rnd() * 540)}deg`,
      '--delay': `${Math.round(rnd() * 500)}ms`, '--dur': `${Math.round(1700 + rnd() * 1200)}ms`, '--c': colors[i % colors.length] ?? '#ffd166',
      '--w': Math.round(8 + rnd() * 8), '--h': Math.round(10 + rnd() * 10),
    });
    box.append(bit);
  }
  host.append(box);
  window.setTimeout(() => box.remove(), 3600);
}

/** Positions a screen-space mark centered on (x, y) with diameter d. */
export function place(el: HTMLElement, x: number, y: number, d?: number): void {
  el.style.setProperty('left', `${Math.round(x)}px`);
  el.style.setProperty('top', `${Math.round(y)}px`);
  if (d !== undefined) el.style.setProperty('--d', `${Math.round(d)}px`);
}
