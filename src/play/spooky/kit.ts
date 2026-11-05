/**
 * kit.ts — what the five Halloween games share: the full-screen page (close button, h1, Esc, the
 * theme, motion, timers), a small dialog, and "keep it on the Fridge" with the same careful manners as
 * every other activity (pretend days keep nothing; a full Fridge offers to take ONE thing down, and only
 * after a second confirming tap).
 */
import './spooky.css';
import { formatIso } from '../../dates/civil';
import { applyTheme } from '../../theme/apply';
import { h, trapFocus, type Child } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { fridge, type FridgeItem, type FridgeKind } from '../fridge';
import type { PlayEnv } from '../types';

export const KIT_COPY = {
  close: 'Back to {holiday}',
  keep: 'Keep it on the Fridge',
  kept: 'Stuck on the Fridge!',
  keptSub: 'It is kept on this device only.',
  pretend: 'Pretend days don’t keep things',
  pretendSub: 'You can still make as many as you like!',
  full: 'The Fridge is full!',
  fullSub: 'Take one thing down to make room?',
  takeDown: 'Take down “{title}”',
  sure: 'Take down “{title}” for good?',
  yesTakeDown: 'Yes, take it down',
  keepAll: 'Keep everything',
  done: 'Done',
} as const;

export function fill(text: string, vars: Readonly<Record<string, string | number>>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

export interface Shell {
  readonly root: HTMLElement;
  /** Where the game puts its stage and controls (below the header). */
  readonly body: HTMLElement;
  readonly sub: HTMLElement;
  /** Right side of the header, for tool buttons. */
  readonly tools: HTMLElement;
  full(): boolean;
  later(fn: () => void, ms: number): number;
  cancel(id: number | null): void;
  /** Opens a modal over the game; Esc and the backdrop close it. */
  dialog(title: string, body: readonly Child[], onClose?: () => void): { readonly el: HTMLElement; close(): void };
  destroy(): void;
}

export interface ShellOptions {
  /** Short class suffix for this game's CSS: `.pk`, `.mm`, … */
  readonly game: string;
  readonly title: string;
  readonly sub: string;
}

export function createShell(env: PlayEnv, o: ShellOptions): Shell {
  const { ctx, meta, theme } = env;
  const timers = new Set<number>();
  const full = (): boolean => ctx.motion === 'full';
  const later = (fn: () => void, ms: number): number => {
    const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  };
  const cancel = (id: number | null): void => { if (id !== null) { window.clearTimeout(id); timers.delete(id); } };

  const h1Id = `${o.game}-h1`;
  const sub = h('p', { class: 'sp-sub' }, o.sub);
  const tools = h('div', { class: 'sp-tools' });
  const header = h('header', { class: 'sp-head' },
    h('button', { type: 'button', class: 'btn btn-secondary btn-icon sp-close', 'aria-label': fill(KIT_COPY.close, { holiday: meta.name }), onclick: () => env.close() }, icon('close', 22)),
    h('div', { class: 'sp-titles' }, h('h1', { class: 'sp-h1', id: h1Id }, o.title), sub),
    tools);
  const body = h('div', { class: 'sp-body' });
  const root = h('section', { class: `sp sky ${o.game}`, 'aria-labelledby': h1Id }, header, body);
  applyTheme(root, theme);
  const syncMotion = (): void => { root.classList.toggle('sp-calm', !full()); };
  syncMotion();
  const offMotion = ctx.onMotionChange(syncMotion);

  const open: { close(): void }[] = [];
  const onKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    const top = open[open.length - 1];
    if (top) top.close(); else env.close();
  };
  root.addEventListener('keydown', onKey);

  function dialog(title: string, kids: readonly Child[], onClose?: () => void): { readonly el: HTMLElement; close(): void } {
    const id = `${o.game}-dlg-${open.length}-${Math.random().toString(36).slice(2, 7)}`;
    const card = h('div', { class: 'sp-dlg-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': id },
      h('h2', { class: 'sp-dlg-title', id }, title), ...kids);
    const el = h('div', { class: 'sp-dlg' }, card);
    const back = document.activeElement as HTMLElement | null;
    root.append(el);
    const untrap = trapFocus(card);
    let live = true;
    const handle = {
      el,
      close(): void {
        if (!live) return;
        live = false;
        untrap();
        el.remove();
        const i = open.indexOf(handle);
        if (i >= 0) open.splice(i, 1);
        onClose?.();
        back?.focus?.({ preventScroll: true });
      },
    };
    open.push(handle);
    el.addEventListener('pointerdown', (e) => { if (e.target === el) handle.close(); });
    (card.querySelector<HTMLElement>('button, a') ?? card).focus({ preventScroll: true });
    return handle;
  }

  return {
    root, body, sub, tools, full, later, cancel, dialog,
    destroy() {
      for (const t of timers) window.clearTimeout(t);
      timers.clear();
      offMotion();
      root.removeEventListener('keydown', onKey);
      for (const d of [...open]) d.close();
    },
  };
}

export interface KeepSpec {
  readonly kind: Extract<FridgeKind, 'pumpkin' | 'monster'>;
  readonly title: string;
  readonly data: unknown;
  /** A fresh little picture of the thing being kept, shown in the dialog. */
  readonly preview: () => Node;
}

/** The oldest few things on the Fridge, offered (never removed without a confirming tap) when it is full. */
export function oldest(pretending: boolean, n = 3): readonly FridgeItem[] {
  return [...fridge(pretending).list()].sort((a, b) => a.made.localeCompare(b.made)).slice(0, n);
}

/** Puts a creation on the Fridge and tells the child what happened, in a dialog over the game. */
export function keepOnFridge(env: PlayEnv, shell: Shell, spec: KeepSpec, then?: () => void): void {
  const { ctx, meta } = env;
  const pretending = ctx.clock.pretending;
  const status = h('div', { class: 'sp-status', 'aria-live': 'polite' });
  const closeBtn = h('button', { type: 'button', class: 'btn btn-lg', onclick: () => d.close() }, KIT_COPY.done);
  const d = shell.dialog(spec.title, [h('div', { class: 'sp-keep-preview' }, spec.preview()), status, h('div', { class: 'sp-dlg-actions' }, closeBtn)], then);

  const attempt = (): void => {
    const res = fridge(pretending).add({ kind: spec.kind, holidayId: meta.id, made: formatIso(ctx.clock.today()), title: spec.title, data: spec.data });
    if (res.ok) {
      status.replaceChildren(h('p', { class: 'sp-stamp' }, KIT_COPY.kept), h('p', { class: 'sp-status-sub' }, KIT_COPY.keptSub));
      ctx.announce(KIT_COPY.kept);
      ctx.toast(KIT_COPY.kept, '🧲');
    } else if (res.reason === 'pretending') {
      status.replaceChildren(h('p', { class: 'sp-stamp is-soft' }, KIT_COPY.pretend), h('p', { class: 'sp-status-sub' }, KIT_COPY.pretendSub));
      ctx.announce(KIT_COPY.pretend);
    } else {
      const rows = oldest(pretending).map((it) => h('button', {
        type: 'button', class: 'btn btn-secondary sp-takedown', onclick: () => confirmDown(it),
      }, fill(KIT_COPY.takeDown, { title: it.title })));
      status.replaceChildren(h('p', { class: 'sp-stamp is-soft' }, KIT_COPY.full), h('p', { class: 'sp-status-sub' }, KIT_COPY.fullSub),
        h('div', { class: 'sp-takedowns' }, ...rows, h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => d.close() }, KIT_COPY.keepAll)));
      ctx.announce(KIT_COPY.full);
    }
  };
  // Two taps to take something down: the first only asks.
  const confirmDown = (it: FridgeItem): void => {
    const yes = h('button', { type: 'button', class: 'btn sp-takedown', onclick: () => { fridge(pretending).remove(it.id); attempt(); closeBtn.focus({ preventScroll: true }); } }, KIT_COPY.yesTakeDown);
    status.replaceChildren(h('p', { class: 'sp-stamp is-soft' }, fill(KIT_COPY.sure, { title: it.title })),
      h('div', { class: 'sp-takedowns' }, yes, h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => attempt() }, KIT_COPY.keepAll)));
    yes.focus({ preventScroll: true });
  };
  attempt();
  closeBtn.focus({ preventScroll: true });
}

/** Shuffled copy (Fisher–Yates) with an injected rng, so games stay testable. */
export function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export const pick = <T>(items: readonly T[], rand: () => number): T => items[Math.floor(rand() * items.length) % items.length]!;

/** A radio-like button group: arrows move and select, Home/End jump (roving tabindex). */
export function wireGroup(group: HTMLElement, items: () => readonly HTMLElement[]): void {
  group.addEventListener('keydown', (e) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    let n = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % list.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + list.length) % list.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = list.length - 1;
    else return;
    e.preventDefault();
    list.forEach((b, k) => b.setAttribute('tabindex', k === n ? '0' : '-1'));
    list[n]!.focus();
  });
}
