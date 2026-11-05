/**
 * cards.ts — the instruction cards as chunky, colour-coded buttons (the same look in the palette and in
 * the program strip). Each card kind has its own colour and a bold white pictogram, so a pre-reader can
 * tell "step" from "turn" from "repeat" at a glance; the short word under it is for early readers and
 * the button's accessible name says the whole thing ("Turn left", "Repeat 3 times").
 */
import { h, svg } from '../../ui/dom';
import { COPY } from './copy';
import type { Card } from './model';

const W = { fill: 'none', stroke: '#ffffff', 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } as const;

function pictogram(card: Card): SVGSVGElement {
  const s = svg('svg', { viewBox: '0 0 32 32', class: 'pth-pic', 'aria-hidden': 'true', focusable: 'false' });
  switch (card) {
    case 'step':
      s.append(svg('path', { d: 'M16 27V7M8 14l8-8 8 8', ...W }));
      break;
    case 'left':
      s.append(svg('path', { d: 'M22 27V16a5 5 0 0 0-5-5H8M13 5l-6 6 6 6', ...W }));
      break;
    case 'right':
      s.append(svg('path', { d: 'M10 27V16a5 5 0 0 1 5-5h9M19 5l6 6-6 6', ...W }));
      break;
    case 'jump':
      s.append(svg('rect', { x: 12, y: 20, width: 8, height: 8, rx: 2, fill: '#ffffff', opacity: 0.55 }));
      s.append(svg('path', { d: 'M4 27C6 10 26 10 28 24M22 21l6 4 2-7', ...W }));
      break;
    case 'rep2':
    case 'rep3':
      s.append(svg('path', { d: 'M25 13a10 10 0 1 0 1 7M25 5v8h-8', ...W }));
      break;
    case 'ifRight':
      s.append(svg('rect', { x: 4, y: 4, width: 24, height: 6, rx: 2, fill: '#ffffff', opacity: 0.6 }));
      s.append(svg('path', { d: 'M12 28V20a4 4 0 0 1 4-4h8M20 12l5 4-5 4', ...W }));
      break;
    case 'end':
      s.append(svg('path', { d: 'M10 6h8a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4h-8', ...W }));
      break;
  }
  return s;
}

export function cardName(card: Card): string {
  return COPY.cards[card][1];
}

/** The face of a card: pictogram, ×n badge for repeats, short word. */
export function cardFace(card: Card): HTMLElement[] {
  const times = card === 'rep2' ? '×2' : card === 'rep3' ? '×3' : null;
  return [
    h('span', { class: 'pth-card-pic', 'aria-hidden': 'true' }, pictogram(card), times ? h('b', { class: 'pth-times' }, times) : null),
    h('span', { class: 'pth-card-word', 'aria-hidden': 'true' }, COPY.cards[card][0]),
  ];
}

/** Colour family for CSS (`data-kind`). */
export function cardKind(card: Card): string {
  if (card === 'rep2' || card === 'rep3') return 'repeat';
  if (card === 'left' || card === 'right') return 'turn';
  return card;
}
