/**
 * shelf.ts — the Fridge side of the Card Maker: "My cards" (this holiday's saved cards as little
 * pictures, tap one to keep editing it) and the friendly "The Fridge is full!" dialog, which offers to
 * take something down. Nothing is ever deleted without the child pressing "Take down" on that item.
 */
import type { FridgeItem } from '../fridge';
import { h, trapFocus } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { COPY, fill } from './copy';
import { sanitizeCard, type CardSpec } from './model';
import { isDecorName } from './decor';
import { loadAssets, panelCanvas, type CardEnv } from './raster';

export interface Dialog {
  readonly el: HTMLElement;
  close(): void;
}

function dialog(host: HTMLElement, titleText: string, body: HTMLElement[], onClose: () => void): Dialog {
  const id = `cm-dlg-${Math.random().toString(36).slice(2, 8)}`;
  const closeBtn = h('button', { type: 'button', class: 'btn btn-secondary btn-icon cm-dlg-x', 'aria-label': COPY.cancel, onclick: () => close() }, icon('close', 22));
  const card = h('div', { class: 'cm-dlg-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': id },
    h('div', { class: 'cm-dlg-head' }, h('h2', { class: 'h3', id }, titleText), closeBtn), ...body);
  const el = h('div', { class: 'cm-dlg' }, card);
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
  (card.querySelector<HTMLElement>('.cm-dlg-body button, .cm-dlg-body a') ?? closeBtn).focus({ preventScroll: true });
  return { el, close };
}

/** Saved cards for this holiday as thumbnails; picking one calls `onOpen`. */
export function myCardsDialog(host: HTMLElement, items: readonly FridgeItem[], env: CardEnv, onOpen: (item: FridgeItem, card: CardSpec) => void, onClose: () => void): Dialog {
  const cards = items.map((it) => ({ it, card: sanitizeCard(it.data, isDecorName) })).filter((x): x is { it: FridgeItem; card: CardSpec } => x.card !== null);
  const list = h('ul', { class: 'cm-shelf' });
  let d: Dialog | null = null;
  for (const { it, card } of cards.slice().reverse()) {
    const thumb = h('span', { class: 'cm-shelf-thumb', 'aria-hidden': 'true' });
    const b = h('button', { type: 'button', class: 'cm-shelf-card', 'aria-label': fill(COPY.openCard, { title: it.title }), onclick: () => { d?.close(); onOpen(it, card); } },
      thumb, h('span', { class: 'cm-shelf-title' }, it.title));
    list.append(h('li', {}, b));
    void loadAssets(card).then((assets) => {
      const k = (Math.min(3, window.devicePixelRatio || 1) * 120) / 500;
      thumb.append(panelCanvas('front', card, env, assets, k));
    });
  }
  const body = h('div', { class: 'cm-dlg-body' }, cards.length > 0 ? list : h('p', { class: 'cm-help' }, COPY.noCards));
  d = dialog(host, fill(COPY.myCardsTitle, { holiday: env.holidayName }), [body], onClose);
  return d;
}

const KIND_EMOJI: Readonly<Record<string, string>> = { card: '💌', colour: '🎨', wish: '✉️', path: '🧭', story: '📖', dressup: '👗' };

/** The Fridge is full: list what is on it (oldest first) with a "Take down" button for each. */
export function fridgeFullDialog(host: HTMLElement, items: readonly FridgeItem[], onTakeDown: (item: FridgeItem) => void, onClose: () => void): Dialog {
  let d: Dialog | null = null;
  const rows = items.map((it) => h('li', { class: 'cm-full-row' },
    h('span', { class: 'emoji cm-full-emoji', 'aria-hidden': 'true' }, KIND_EMOJI[it.kind] ?? '⭐'),
    h('span', { class: 'cm-full-title' }, it.title),
    h('button', { type: 'button', class: 'btn btn-secondary cm-full-btn', 'aria-label': fill(COPY.takeDownLabel, { title: it.title }), onclick: () => { d?.close(); onTakeDown(it); } }, COPY.takeDown)));
  const body = h('div', { class: 'cm-dlg-body' }, h('p', {}, COPY.fridgeFullBody), h('ul', { class: 'cm-full' }, ...rows));
  d = dialog(host, COPY.fridgeFull, [body], onClose);
  return d;
}
