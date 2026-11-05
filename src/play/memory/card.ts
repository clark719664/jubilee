/**
 * card.ts — the DOM for one memory card and for a sticker on its own (setup fan, progress tray,
 * finish panel). A card is a real <button>: aria-pressed says whether it is face up and the label only
 * names the sticker once it is showing, so a screen reader never gives the game away.
 *
 * Face down, a card wears the holiday's sky and pattern with the holiday emoji as an emblem. Face up it
 * shows the die-cut sticker: the illustrated art when it exists, otherwise the sticker's emoji on a
 * disc in that sticker's own holiday colors (a Diwali sticker in a Christmas deck is still Diwali-pink).
 */
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { THEMES } from '../../theme/themes';
import type { MemorySticker } from './deck';
import { COPY, fill } from './copy';

/** A die-cut sticker disc (or the illustrated sticker) for `s`. Decorative: callers label it. */
export function stickerArt(s: MemorySticker, cls = ''): HTMLElement {
  const t = THEMES[s.theme];
  const style = `--s-bg1:${t.bg1};--s-bg2:${t.bg2};--s-glow:${t.glow};--s-accent:${t.accent}`;
  const emoji = (): HTMLElement => h('span', { class: 'mem-disc', 'aria-hidden': 'true', style }, h('span', { class: 'mem-emoji emoji' }, s.emoji));
  if (!s.url) return h('span', { class: `mem-art ${cls}`.trim(), 'aria-hidden': 'true' }, emoji());
  const wrap = h('span', { class: `mem-art has-img ${cls}`.trim(), 'aria-hidden': 'true' });
  const img = h('img', { src: s.url, alt: '', draggable: 'false', decoding: 'async', class: 'mem-img' });
  // Missing or broken art falls back to the emoji disc.
  img.addEventListener('error', () => { wrap.classList.remove('has-img'); wrap.replaceChildren(emoji()); });
  wrap.append(img);
  return wrap;
}

export interface CardEls {
  readonly button: HTMLButtonElement;
  readonly inner: HTMLElement;
  readonly front: HTMLElement;
  readonly back: HTMLElement;
  readonly art: HTMLElement;
}

export function cardEl(index: number, s: MemorySticker, backEmoji: string): CardEls {
  const art = stickerArt(s);
  const front = h('span', { class: 'mem-face mem-front' },
    art,
    h('span', { class: 'mem-label', 'aria-hidden': 'true' }, s.label),
    s.mine ? h('span', { class: 'mem-mine', 'aria-hidden': 'true', title: COPY.mine }, '★') : null,
    h('span', { class: 'mem-check', 'aria-hidden': 'true' }, icon('check', 18)),
  );
  const back = h('span', { class: 'mem-face mem-back sky' },
    h('span', { class: 'mem-emblem', 'aria-hidden': 'true' }, h('span', { class: 'emoji' }, backEmoji)),
  );
  const inner = h('span', { class: 'mem-inner' }, back, front);
  const button = h('button', {
    type: 'button', class: 'mem-card', 'data-i': index, tabindex: -1, 'aria-pressed': 'false',
    'aria-label': fill(COPY.faceDown, { n: index + 1 }),
  }, inner);
  return { button, inner, front, back, art };
}

/** Sync a card's state attributes (the CSS does the turning). */
export function setCardState(c: CardEls, index: number, s: MemorySticker, up: boolean, matched: boolean): void {
  c.button.setAttribute('aria-pressed', up ? 'true' : 'false');
  c.button.classList.toggle('is-up', up);
  c.button.classList.toggle('is-matched', matched);
  const label = s.mine ? `${s.label}, ${COPY.mine}` : s.label;
  c.button.setAttribute('aria-label', matched ? fill(COPY.found, { label }) : up ? label : fill(COPY.faceDown, { n: index + 1 }));
  if (matched) c.button.setAttribute('aria-disabled', 'true'); else c.button.removeAttribute('aria-disabled');
}
