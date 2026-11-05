/**
 * keep.ts — putting a finished story on the Fridge (kind 'story': { bookId, name?, friend? }), and the
 * friendly "The Fridge is full!" dialog that offers to take one thing down. Nothing is ever removed
 * unless the child presses "Take down" on that item and then "Yes, take it down" (a card or a coloured
 * page is gone for good), and nothing is written while pretending a date.
 */
import { formatIso } from '../../dates/civil';
import { h, trapFocus } from '../../ui/dom';
import { icon } from '../../ui/icons';
import type { AddResult, Fridge, FridgeItem } from '../fridge';
import { COPY, fill } from './copy';
import { keepFor, sameKeep, sanitizeKeep, type Who } from './text';
import type { StoryKeep } from './types';
import type { CivilDate } from '../../dates/civil';

export function storyTitle(holiday: string, w: Who): string {
  return w.friend ? fill(COPY.itemTitleWith, { holiday, friend: w.friend }) : fill(COPY.itemTitle, { holiday });
}

/** The Fridge item already holding this exact story (same book, same names), if any. */
export function keptItem(f: Fridge, bookId: string, w: Who): FridgeItem | undefined {
  const want = keepFor(bookId, w);
  return f.list('story').find((it) => {
    const k = sanitizeKeep(it.data, (id) => id === bookId);
    return k !== null && sameKeep(k, want);
  });
}

export function keepStory(f: Fridge, opts: { holidayId: string; holiday: string; bookId: string; who: Who; today: CivilDate }): AddResult {
  return f.add<StoryKeep>({
    kind: 'story',
    holidayId: opts.holidayId,
    made: formatIso(opts.today),
    title: storyTitle(opts.holiday, opts.who),
    data: keepFor(opts.bookId, opts.who),
  });
}

const KIND_EMOJI: Readonly<Record<string, string>> = { card: '💌', colour: '🎨', wish: '✉️', path: '🧭', story: '📖', dressup: '👗' };

export interface Dialog { close(): void }

/** What one tap on a "Take down" row does: `asking` is the row now asking "Yes, take it down", `remove` the item to take down. */
export interface TakeDownStep {
  readonly asking: string | null;
  readonly remove: string | null;
}

/**
 * One tap on a row of the full-Fridge dialog (pure, so the rule is tested in Node). The first tap on a row only
 * asks; a second tap on the same row takes that item down; a tap on another row moves the question there. A
 * child's card or coloured page is gone for good once taken down, so one tap never removes anything.
 */
export function takeDownTap(asking: string | null, id: string): TakeDownStep {
  return asking === id ? { asking: null, remove: id } : { asking: id, remove: null };
}

/**
 * The Fridge is full: what is on it, oldest first, each with "Take down"; "Keep them all" closes without
 * changing anything. Esc and a tap outside also keep everything. Taking down is two taps on the same
 * button: "Take down" turns it into "Yes, take it down" (any other row asking goes back to "Take down").
 */
export function fridgeFullDialog(host: HTMLElement, items: readonly FridgeItem[], onTakeDown: (item: FridgeItem) => void, onKeepAll: () => void): Dialog {
  const id = `st-dlg-${Math.random().toString(36).slice(2, 8)}`;
  let open = true;
  const back = document.activeElement as HTMLElement | null;
  const close = (then?: () => void): void => {
    if (!open) return;
    open = false;
    untrap();
    el.remove();
    back?.focus?.({ preventScroll: true });
    then?.();
  };
  let asking: { btn: HTMLButtonElement; it: FridgeItem } | null = null;
  const label = (it: FridgeItem): string => `${COPY.fridgeTakeDown}: ${it.title}`;
  const unask = (): void => {
    if (!asking) return;
    const { btn, it } = asking;
    asking = null;
    btn.textContent = COPY.fridgeTakeDown;
    btn.setAttribute('aria-label', label(it));
    btn.classList.remove('is-asking');
  };
  const say = h('p', { class: 'sr-only', 'aria-live': 'polite' });
  const rows = items.map((it) => {
    const btn: HTMLButtonElement = h('button', {
      type: 'button', class: 'btn btn-secondary st-full-btn', 'aria-label': label(it),
      onclick: () => {
        if (takeDownTap(asking?.it.id ?? null, it.id).remove !== null) { close(() => onTakeDown(it)); return; }
        unask();
        asking = { btn, it };
        btn.textContent = COPY.fridgeTakeDownSure;
        btn.setAttribute('aria-label', `${COPY.fridgeTakeDownSure}: ${it.title}`);
        btn.classList.add('is-asking');
        say.textContent = fill(COPY.fridgeTakeDownAsk, { title: it.title });
      },
    }, COPY.fridgeTakeDown);
    return h('li', { class: 'st-full-row' },
      h('span', { class: 'emoji st-full-emoji', 'aria-hidden': 'true' }, KIND_EMOJI[it.kind] ?? '⭐'),
      h('span', { class: 'st-full-title' }, it.title),
      btn);
  });
  const keepAll = h('button', { type: 'button', class: 'btn st-full-keep', onclick: () => close(onKeepAll) }, COPY.fridgeKeepAll);
  const card = h('div', { class: 'st-dlg-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': id },
    h('div', { class: 'st-dlg-head' },
      h('h2', { class: 'h3', id }, COPY.fridgeFullTitle),
      h('button', { type: 'button', class: 'btn btn-secondary btn-icon', 'aria-label': COPY.fridgeKeepAll, onclick: () => close(onKeepAll) }, icon('close', 22))),
    h('p', { class: 'st-dlg-body' }, COPY.fridgeFullBody),
    h('ul', { class: 'st-full' }, ...rows),
    say,
    h('div', { class: 'st-dlg-actions' }, keepAll));
  const el = h('div', { class: 'st-dlg' }, card);
  el.addEventListener('pointerdown', (e) => { if (e.target === el) close(onKeepAll); });
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    close(onKeepAll);
  });
  host.append(el);
  const untrap = trapFocus(card);
  keepAll.focus({ preventScroll: true });
  return { close: () => close() };
}
