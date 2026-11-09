/**
 * Wish Post (activity id 'wish') — write a wish, watch it fly away, keep it forever on this device.
 *
 * One engine, holiday skins (skins.ts): a letter to Santa at Christmas, a sky lantern at Lantern
 * Festival and Mid-Autumn, a wish lamp at Diwali, a hopes jar at New Year and Nowruz, a thank-you leaf
 * at Thanksgiving, a love note on Valentine's/Mother's/Father's Day, a wish star everywhere else.
 * The child taps picture wishes onto the paper (and may write ≤ 600 characters), then sends it: the
 * paper folds into an envelope or becomes a lantern/lamp/slip/leaf/star and goes (send.ts). It is kept
 * on the Fridge (kind 'wish'). At Christmas, from the next real morning, Santa's reply waits in the
 * mailbox, written on the device (reply.ts). Nothing leaves the device and no copy says otherwise.
 *
 * Keys: Tab moves between areas; arrows/Home/End move in the picture tray, Enter/Space picks; Esc skips
 * a flight, closes a letter, leaves the mailbox, then leaves the activity.
 */
import './wish.css';
import { sceneFor } from '../../art/index';
import { formatIso } from '../../dates/civil';
import { fill as i18nFill } from '../../i18n/index';
import { applyTheme } from '../../theme/apply';
import { h, trapFocus } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { mascot } from '../../ui/mascot';
import { fridge, type FridgeItem } from '../fridge';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { compose } from './compose';
import { COPY, fill } from './copy';
import { canSend, emptyDraft, kept, makeLetter, replyReady, takeDownCandidates, type KeptLetter, type WishLetter } from './letter';
import { keepView, type ReplyState } from './keep';
import { letterPaper, replyPaper } from './paper';
import { readDialog, type ReadDialog } from './read';
import { writeReply } from './reply';
import { fly, sceneBackdrop, type Flight } from './send';
import { hasReply, skinOf } from './skins';

export { skinFor, skinOf, hasReply, SANTA_CHIPS, HOPE_CHIPS, THANKS_CHIPS, LOVE_CHIPS } from './skins';
export { writeReply, hashString, seedFor } from './reply';
export { makeLetter, replyReady, kept, canSend, toggleChip, TEXT_MAX } from './letter';

export const wishActivity: Activity = {
  id: 'wish',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  // Every holiday has a skin (the wish star is the fallback), and nothing here needs art to work.
  available: () => true,
  mount: (env) => mountWish(env),
};

function mountWish(env: PlayEnv): ActivityInstance {
  const { ctx, meta, theme } = env;
  const skin = skinOf(meta.id);
  const scene = sceneFor(meta.id);
  const box = fridge(ctx.clock.pretending);
  const name = ctx.store.progress.name;
  const draft = emptyDraft();
  const full = (): boolean => ctx.motion === 'full';

  // ── chrome ──
  const keepCount = h('span', { class: 'wish-keep-count' });
  const keepDot = h('span', { class: 'wish-keep-dot', hidden: true, 'aria-hidden': 'true' });
  const keepBtn = h('button', { type: 'button', class: 'btn btn-secondary wish-keep-btn', onclick: () => showKeep(true) },
    icon(skin.id === 'santa' ? 'gift' : 'heart', 22), h('span', { class: 'wish-keep-label' }, skin.keepTitle), keepCount, keepDot);
  const writeBtn = h('button', { type: 'button', class: 'btn btn-secondary wish-keep-btn', hidden: true, onclick: () => showWrite(true) },
    icon('arrowLeft', 22), h('span', { class: 'wish-keep-label' }, COPY.backToWrite));
  const header = h('header', { class: 'wish-head' },
    h('button', { type: 'button', class: 'btn btn-secondary btn-icon wish-close', 'aria-label': fill(COPY.close, { holiday: meta.name }), onclick: () => env.close() }, icon('close', 22)),
    h('div', { class: 'wish-titles' }, h('h1', { class: 'wish-h1', id: 'wish-h1' }, skin.title), h('p', { class: 'wish-sub' }, `${meta.emoji} ${meta.name}`)),
    keepBtn, writeBtn);

  const view = compose({ skin, name, draft, motion: () => ctx.motion, announce: (t) => ctx.announce(t), onChange: () => syncSend() });
  const sendHint = h('p', { class: 'wish-send-hint', role: 'status' });
  const sendBtn = h('button', { type: 'button', class: 'btn btn-lg wish-send', onclick: () => send() },
    h('span', { class: 'wish-send-icon', 'aria-hidden': 'true' }, skin.id === 'santa' || skin.id === 'love' ? '✉' : '✦'), skin.send);
  const bar = h('div', { class: 'wish-bar' }, sendHint, sendBtn);
  const desk = h('div', { class: 'wish-desk' }, view.paper, view.tray);
  const writeArea = h('div', { class: 'wish-write' }, desk, bar);
  const stage = h('main', { class: 'wish-stage' }, writeArea);
  const root = h('section', { class: 'wish sky', 'data-skin': skin.id, 'aria-labeledby': 'wish-h1' },
    sceneBackdrop(scene, 'is-bg'), header, stage);
  applyTheme(root, theme);
  const syncMotion = (): void => { root.classList.toggle('wish-calm', !full()); };
  syncMotion();
  const offMotion = ctx.onMotionChange(syncMotion);

  let flight: Flight | null = null;
  let dialog: ReadDialog | null = null;
  let keepEl: HTMLElement | null = null;
  let untrapDone: (() => void) | null = null;
  let hintTimer = 0;

  function mine(): ReturnType<typeof kept> {
    return kept(box.list('wish'), meta.id);
  }

  function replyState(l: KeptLetter): ReplyState {
    const { replies } = mine();
    if (replies.some((r) => r.reply.letterId === l.item.id)) return 'opened';
    if (ctx.clock.pretending) return 'pretend';
    return replyReady(l.item.made, ctx.clock.today(), false) ? 'ready' : 'waiting';
  }

  function syncKeep(): void {
    const { letters } = mine();
    keepCount.textContent = letters.length > 0 ? String(letters.length) : '';
    keepCount.hidden = letters.length === 0;
    const waiting = hasReply(skin.id) && letters.some((l) => replyState(l) === 'ready');
    keepDot.hidden = !waiting;
    const keepVars = { title: skin.keepTitle, count: fill(COPY.keepCount, { n: letters.length }), reply: COPY.replyWaiting };
    keepBtn.setAttribute('aria-label', letters.length
      ? (waiting ? i18nFill('{title}, {count}. {reply}', keepVars) : i18nFill('{title}, {count}', keepVars))
      : (waiting ? i18nFill('{title}. {reply}', keepVars) : skin.keepTitle));
    keepBtn.classList.toggle('has-mail', waiting);
  }
  const offFridge = box.subscribe(() => { syncKeep(); if (keepEl) showKeep(false); });

  function syncSend(): void {
    sendBtn.classList.toggle('is-ready', canSend(draft));
    if (canSend(draft)) sendHint.textContent = '';
  }

  // ── send ──
  function send(): void {
    if (flight) return;
    if (!canSend(draft)) {
      sendHint.textContent = COPY.hintEmpty;
      sendHint.classList.remove('is-on');
      void sendHint.offsetWidth;
      sendHint.classList.add('is-on');
      window.clearTimeout(hintTimer);
      hintTimer = window.setTimeout(() => sendHint.classList.remove('is-on'), 2800);
      view.focusFirst();
      return;
    }
    const today = ctx.clock.today();
    const letter = makeLetter(skin, draft, today.y, name);
    const previous = mine().letters.length;
    const added = box.add({ kind: 'wish', holidayId: meta.id, made: formatIso(today), title: letter.to ? i18nFill('{title} for {name}', { title: skin.itemTitle, name: letter.to }) : skin.itemTitle, data: letter });
    root.classList.add('is-flying');
    const f = fly({ root, skin, letter, motion: () => ctx.motion, previous, scene, effect: meta.effect, theme, keepTarget: keepBtn });
    flight = f;
    f.overlay.addEventListener('click', () => f.skip());
    ctx.announce(skin.id === 'santa' ? COPY.sending : skin.flewTitle);
    void f.done.then(() => {
      if (flight !== f) return;
      doneCard(f.overlay, added.ok ? 'saved' : added.reason, letter);
      ctx.announce(fill(COPY.sayFlew, { title: skin.flewTitle, sub: skin.flewSub }));
    });
  }

  function doneCard(overlay: HTMLElement, saved: 'saved' | 'full' | 'pretending', letter: WishLetter): void {
    const paper = letterPaper(letter);
    const again = h('button', { type: 'button', class: 'btn btn-lg wish-again', onclick: () => endFlight(false) }, icon('plus', 22), skin.another);
    const fridgeNote = h('p', { class: 'wish-done-note' }, saved === 'saved' ? COPY.fridgeSaved : saved === 'pretending' ? COPY.fridgeNotSaved : '');
    const card = h('div', { class: 'wish-done', role: 'dialog', 'aria-modal': 'true', 'aria-labeledby': 'wish-done-title' },
      h('div', { class: 'wish-done-jubi' }, mascot('party', 76)),
      h('h2', { class: 'wish-done-title', id: 'wish-done-title' }, skin.flewTitle),
      h('p', { class: 'wish-done-sub' }, skin.flewSub),
      fridgeNote,
      saved === 'full' ? fullFridge(letter) : null,
      h('div', { class: 'wish-done-actions' },
        again,
        h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => endFlight(true) }, icon(skin.id === 'santa' ? 'gift' : 'heart', 20), skin.id === 'santa' ? COPY.openPostbox : COPY.seeKeep),
        h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => printFrom(paper) }, icon('print', 20), skin.id === 'santa' ? COPY.printLetter : COPY.print),
        h('button', { type: 'button', class: 'btn btn-ghost wish-done-back', onclick: () => env.close() }, icon('arrowLeft', 20), fill(COPY.close, { holiday: meta.name }))));
    card.addEventListener('click', (e) => e.stopPropagation());
    overlay.append(card);
    overlay.classList.add('is-done');
    untrapDone = trapFocus(card);
    if (full() && typeof card.animate === 'function') {
      card.animate([{ transform: 'translateY(60px) scale(.9)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    again.focus({ preventScroll: true });
  }

  /** The Fridge is full: offer to take one thing down so this wish can stay. Never removes anything by itself. */
  function fullFridge(letter: WishLetter): HTMLElement {
    const wrap = h('div', { class: 'wish-full' });
    const render = (): void => {
      const items = takeDownCandidates(box.list());
      wrap.replaceChildren(
        h('p', { class: 'wish-full-title' }, COPY.fridgeFullTitle),
        h('p', { class: 'wish-full-body' }, COPY.fridgeFullBody),
        h('ul', { class: 'wish-full-list' }, ...items.map((it: FridgeItem) => h('li', {},
          h('span', { class: 'wish-full-name' }, it.title),
          h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => takeDown(it.id) }, COPY.fridgeTakeDown)))),
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => { wrap.replaceChildren(h('p', { class: 'wish-done-note' }, COPY.fridgeNotKept)); } }, COPY.fridgeKeepAll));
    };
    const takeDown = (id: string): void => {
      box.remove(id);
      const r = box.add({ kind: 'wish', holidayId: meta.id, made: formatIso(ctx.clock.today()), title: letter.to ? i18nFill('{title} for {name}', { title: skin.itemTitle, name: letter.to }) : skin.itemTitle, data: letter });
      wrap.replaceChildren(h('p', { class: 'wish-done-note' }, r.ok ? COPY.fridgeSaved : COPY.fridgeNotKept));
    };
    render();
    return wrap;
  }

  function endFlight(toKeep: boolean): void {
    untrapDone?.();
    untrapDone = null;
    flight?.destroy();
    flight = null;
    root.classList.remove('is-flying');
    keepBtn.classList.remove('is-bump');
    view.reset();
    syncSend();
    if (toKeep) showKeep(true);
    else { showWrite(false); view.focusFirst(); }
  }

  function printFrom(paper: HTMLElement): void {
    const d = readDialog({ host: root, title: skin.itemTitle, paper, printLabel: COPY.print, motion: () => ctx.motion, onClose: () => { dialog = null; } });
    dialog = d;
  }

  // ── keep (mailbox / sky / jar / tree) ──
  function showKeep(focus: boolean): void {
    const { letters, replies } = mine();
    const next = keepView({
      skin, letters, replies, replyState, locale: ctx.locale, scene,
      onRead: (l) => openLetter(l),
      onReply: (l) => openReply(l),
      onWrite: () => showWrite(true),
    });
    if (keepEl) keepEl.replaceWith(next); else writeArea.replaceWith(next);
    keepEl = next;
    keepBtn.hidden = true;
    writeBtn.hidden = false;
    root.classList.add('is-keep');
    if (focus) {
      const title = next.querySelector<HTMLElement>('h2');
      title?.setAttribute('tabindex', '-1');
      (next.querySelector<HTMLElement>('.wish-row.is-new') ?? title)?.focus({ preventScroll: true });
    }
  }

  function showWrite(focus: boolean): void {
    if (keepEl) { keepEl.replaceWith(writeArea); keepEl = null; }
    keepBtn.hidden = false;
    writeBtn.hidden = true;
    root.classList.remove('is-keep');
    syncKeep();
    if (focus) view.focusFirst();
  }

  function openLetter(l: KeptLetter): void {
    dialog?.close();
    dialog = readDialog({ host: root, title: COPY.readLetter, paper: letterPaper(l.letter), printLabel: skin.id === 'santa' ? COPY.printLetter : COPY.print, motion: () => ctx.motion, onClose: () => { dialog = null; } });
  }

  function openReply(l: KeptLetter): void {
    const st = replyState(l);
    if (st !== 'ready' && st !== 'opened') return;
    const existing = mine().replies.find((r) => r.reply.letterId === l.item.id);
    const reply = existing?.reply ?? writeReply(l.letter, l.item.id);
    if (!existing) {
      // Kept on the Fridge when there is room; it is the same letter every time it is written anyway.
      box.add({ kind: 'wish', holidayId: meta.id, made: formatIso(ctx.clock.today()), title: COPY.readReply, data: reply });
    }
    dialog?.close();
    dialog = readDialog({
      host: root, title: COPY.readReply, paper: replyPaper(reply, l.letter.name), printLabel: COPY.printReply, motion: () => ctx.motion,
      sealed: st === 'ready', onClose: () => { dialog = null; },
    });
    ctx.announce(fill(COPY.sayReply, { greeting: reply.greeting }));
  }

  // ── keys ──
  const onKey = (e: KeyboardEvent): void => {
    if (flight && !untrapDone && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) {
      e.preventDefault();
      flight.skip();
      return;
    }
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    if (dialog) { dialog.close(); return; }
    if (flight) { endFlight(false); return; }
    if (keepEl) { showWrite(true); return; }
    env.close();
  };
  root.addEventListener('keydown', onKey);

  syncKeep();
  syncSend();
  queueMicrotask(() => ctx.announce(COPY.sayOpen.replace('{title}', skin.title)));

  return {
    el: root,
    destroy() {
      window.clearTimeout(hintTimer);
      flight?.destroy();
      untrapDone?.();
      dialog?.close();
      offFridge();
      offMotion();
      root.removeEventListener('keydown', onKey);
      for (const g of document.querySelectorAll('.wish-ghost, .wish-print-sheet')) g.remove();
    },
  };
}
