/**
 * list.ts — "Choose from a list": the globe's choices as big buttons, so the quiz is fully playable
 * without pointing (and easier for anyone who finds the globe fiddly). Each button carries the
 * country's own outline, drawn from the globe's data, so the list still teaches the shape.
 *
 * Keys: arrows (and Home/End) move between buttons, Enter or Space picks, Esc goes back to the globe.
 */
import { h, svg, trapFocus } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { COPY } from './copy';
import type { Choice } from './questions';
import { silhouettePath } from './silhouette';

export function shapeIcon(iso: string, size = 48, cls = 'quiz-shape'): SVGSVGElement {
  const d = silhouettePath(iso, 48, 4);
  return svg('svg', { viewBox: '0 0 48 48', width: size, height: size, class: cls, 'aria-hidden': 'true' },
    ...(d ? [svg('path', { d, 'fill-rule': 'evenodd' })] : [svg('circle', { cx: 24, cy: 24, r: 14 })]));
}

export interface ListPanel {
  readonly el: HTMLElement;
  destroy(): void;
}

/** A sheet over the stage; `onPick` with an ISO code, `onClose` to return to the globe. */
export function listPanel(choices: readonly Choice[], onPick: (iso: string) => void, onClose: () => void): ListPanel {
  const buttons = choices.map((c) => h('button', {
    type: 'button', class: 'quiz-choice', 'data-iso': c.iso, onclick: () => onPick(c.iso),
  }, shapeIcon(c.iso), h('span', { class: 'quiz-choice-text' },
    h('span', { class: 'quiz-choice-name' }, c.label),
    c.sub ? h('span', { class: 'quiz-choice-sub' }, c.sub) : null)));
  const grid = h('div', { class: 'quiz-choices', role: 'group', 'aria-labelledby': 'quiz-list-title' }, ...buttons);
  const el = h('div', { class: 'quiz-list', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'quiz-list-title' },
    h('div', { class: 'quiz-list-card' },
      h('div', { class: 'quiz-list-head' },
        h('h2', { class: 'quiz-list-title', id: 'quiz-list-title' }, COPY.listTitle),
        h('button', { type: 'button', class: 'btn btn-secondary quiz-list-back', onclick: () => onClose() }, icon('arrowLeft', 20), COPY.listBack)),
      grid));

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); return; }
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const cols = Math.max(1, Math.round(grid.clientWidth / Math.max(1, buttons[0]!.offsetWidth)));
    let j = i;
    if (e.key === 'ArrowRight') j = i + 1;
    else if (e.key === 'ArrowLeft') j = i - 1;
    else if (e.key === 'ArrowDown') j = i + cols;
    else if (e.key === 'ArrowUp') j = i - cols;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = buttons.length - 1;
    else return;
    e.preventDefault();
    buttons[Math.max(0, Math.min(buttons.length - 1, j))]?.focus();
  };
  el.addEventListener('keydown', onKey);
  const untrap = trapFocus(el);
  queueMicrotask(() => buttons[0]?.focus({ preventScroll: true }));
  return {
    el,
    destroy() {
      untrap();
      el.removeEventListener('keydown', onKey);
      el.remove();
    },
  };
}
