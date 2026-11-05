/**
 * Sticker Memory (activity id 'memory') — the matching-pairs game, skinned by whichever holiday opens it.
 *
 * The deck is this holiday's sticker plus its season-mates (deck.ts) or the stickers the child has
 * earned. Boards are 3×4, 4×4 or 4×5, picked up front with big picture buttons (setup.ts). Cards are
 * buttons in a roving-tabindex grid: arrows move, Home/End jump along a row, Enter/Space flips.
 * A pair pops with the holiday's own effect sprites (burst.ts) and flies into the tray; a finished
 * board gets a shower, Jubi in a party hat and "Play again". No timer, no score against the child:
 * flips are only counted when a big kid switches "Count my flips" on.
 *
 * Motion: full → springy 3D flips, a dealt-in board, flying stickers; anything else → the faces
 * cross-fade in place (no 3D, no travel), bursts become one still ring that fades.
 */
import './memory.css';
import { stickerUrl } from '../../art/index';
import { mulberry32 } from '../../effects/rng';
import { applyTheme } from '../../theme/apply';
import { h, trapFocus } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { mascot } from '../../ui/mascot';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { Burst } from './burst';
import { cardEl, setCardState, stickerArt, type CardEls } from './card';
import { COPY, fill } from './copy';
import { deal, earnedHolidays, myDeck, MY_DECK_MIN, seasonDeck, type BoardSize, type DealtCard, type MemorySticker } from './deck';
import { flip, hintPair, isWon, moveFocus, newGame, settle, type GameState } from './game';
import { fitBoard, sizeBoard, type Fit } from './layout';
import { setupPanel, type SetupOptions } from './setup';

export { BOARDS, deal, earnedHolidays, myDeck, pickDistinct, seasonDeck, seasonMates, SEASON_WINDOW } from './deck';
export { flip, hintPair, moveFocus, newGame, settle } from './game';
export { fitBoard, sizeBoard } from './layout';

/** How long two different stickers stay face up before turning back (a tap turns them sooner). */
export const MISS_MS = 1300;
const WIN_PAUSE_MS = 650;
const HINT_MS = 1700;
const KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);

/** Remembered for the session, so "Play again" from another holiday keeps the child's choices. */
const lastOptions: SetupOptions = { deck: 'season', countFlips: false };
let dealCount = 0;

export const memoryActivity: Activity = {
  id: 'memory',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  // Every holiday has a sticker, and season-mates always fill the board.
  available: (meta) => meta.sticker.emoji.length > 0,
  mount: (env) => mountMemory(env),
};

function mountMemory(env: PlayEnv): ActivityInstance {
  const { ctx, meta, theme } = env;
  const full = (): boolean => ctx.motion === 'full';
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number): number => {
    const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  };
  const cancel = (id: number | null): void => { if (id !== null) { window.clearTimeout(id); timers.delete(id); } };

  // ── decks (computed once; the dates engine is not free) ──
  const input = { center: meta, metas: ctx.allMetas(), today: ctx.clock.today(), region: ctx.region, urlFor: stickerUrl };
  const season = seasonDeck(input);
  const earned = earnedHolidays(ctx.store.progress.stickers);
  const mineAvailable = earned.length >= MY_DECK_MIN;
  const mine = mineAvailable ? myDeck(input, earned, (id) => ctx.metaOf(id)) : season;
  if (!mineAvailable) lastOptions.deck = 'season';
  const deckFor = (c: SetupOptions['deck']): readonly MemorySticker[] => (c === 'mine' ? mine : season);
  const deckName = (): string => (lastOptions.deck === 'mine' ? COPY.deckMine : fill(COPY.deckSeason, { holiday: meta.name }));

  // ── chrome ──
  const sub = h('p', { class: 'mem-sub' }, deckName());
  const flipsChip = h('span', { class: 'mem-flips', hidden: true });
  const hintBtn = h('button', { type: 'button', class: 'btn btn-secondary mem-tool', 'aria-label': COPY.hintLabel, onclick: () => hint() },
    icon('sparkle', 22), h('span', { class: 'mem-tool-text' }, COPY.hint));
  const againBtn = h('button', { type: 'button', class: 'btn btn-secondary mem-tool', 'aria-label': COPY.newBoard, onclick: () => { if (board) start(board); } },
    icon('shuffle', 22), h('span', { class: 'mem-tool-text' }, COPY.newBoard));
  const tools = h('div', { class: 'mem-tools', hidden: true }, hintBtn, againBtn);
  const header = h('header', { class: 'mem-head' },
    h('button', { type: 'button', class: 'btn btn-secondary btn-icon mem-close', 'aria-label': fill(COPY.close, { holiday: meta.name }), onclick: () => env.close() }, icon('close', 22)),
    h('div', { class: 'mem-titles' }, h('h1', { class: 'mem-h1', id: 'mem-h1' }, COPY.title), sub),
    tools,
  );
  const trayCount = h('span', { class: 'mem-tray-count' });
  const slots = h('ol', { class: 'mem-slots', 'aria-hidden': 'true' });
  // The flips counter lives in the tray so the phone header never has to squeeze the title.
  const tray = h('div', { class: 'mem-tray', hidden: true }, slots, trayCount, flipsChip);
  const stage = h('div', { class: 'mem-stage' });
  const root = h('section', { class: 'mem sky', 'aria-labeledby': 'mem-h1' }, header, tray, stage);
  applyTheme(root, theme);
  const burst = new Burst(root, { effect: meta.effect, ...(meta.effectParams ? { params: meta.effectParams } : {}), theme, motion: () => ctx.motion });
  root.append(burst.canvas);
  const syncMotion = (): void => { root.classList.toggle('mem-calm', !full()); };
  syncMotion();
  const offMotion = ctx.onMotionChange(syncMotion);

  // ── game state ──
  let board: BoardSize | null = null;
  let cards: DealtCard[] = [];
  let els: CardEls[] = [];
  let game: GameState = newGame([]);
  let fit: Fit | null = null;
  let grid: HTMLElement | null = null;
  let focusIdx = 0;
  let missTimer: number | null = null;
  let streak = 0;
  let donePanel: HTMLElement | null = null;
  let untrap: (() => void) | null = null;
  const filled: HTMLElement[] = [];

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => layout(false)) : null;
  ro?.observe(stage);

  function showSetup(focus = false): void {
    closeDone();
    board = null;
    root.classList.remove('is-playing');
    tools.hidden = true;
    tray.hidden = true;
    const view = setupPanel({
      holidayName: meta.name, holidayEmoji: meta.emoji, mineAvailable, options: lastOptions, deckFor,
      onPick: (b) => start(b),
    });
    stage.replaceChildren(view.el);
    grid = null;
    if (focus) view.focusFirst();
  }

  function start(b: BoardSize): void {
    closeDone();
    cancel(missTimer);
    missTimer = null;
    board = b;
    streak = 0;
    const deck = deckFor(lastOptions.deck);
    cards = deal(deck, Math.min(b.pairs, deck.length), mulberry32((Date.now() + ++dealCount * 7919) >>> 0));
    game = newGame(cards.map((c) => c.key));
    sub.textContent = deckName();
    root.classList.add('is-playing');
    tools.hidden = false;
    tray.hidden = false;
    flipsChip.hidden = !lastOptions.countFlips;
    tray.setAttribute('data-pairs', String(game.pairs));
    slots.replaceChildren(...Array.from({ length: game.pairs }, () => h('li', { class: 'mem-slot' })));
    filled.length = 0;
    updateCounts();

    els = cards.map((c) => cardEl(c.index, c.sticker, meta.emoji));
    els.forEach((e, i) => e.button.addEventListener('click', () => onFlip(i)));
    grid = h('div', { class: 'mem-grid', role: 'group', 'aria-label': fill(COPY.cardsGroup, { pairs: game.pairs }) }, ...els.map((e) => e.button));
    grid.addEventListener('keydown', onKey);
    stage.replaceChildren(h('div', { class: 'mem-board' }, grid));
    fit = null;
    layout(true);
    // The board button that started the game is gone; carry focus to the first card so keys keep working.
    setRoving(0);
    if (full() && typeof grid.animate === 'function') {
      // Deal the cards in, row by row: quick and springy, never blocking a tap.
      els.forEach((e, i) => e.button.animate(
        [{ transform: 'translateY(26px) scale(.7) rotate(-6deg)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 420, delay: i * 28, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' },
      ));
    }
    ctx.announce(fill(COPY.sayStart, { pairs: game.pairs }));
  }

  function layout(fresh: boolean): void {
    if (!board || !grid) return;
    // Leave room for the cards' drop shadows and the focus ring.
    const w = stage.clientWidth - 12;
    const hgt = stage.clientHeight - 18;
    if (w <= 0 || hgt <= 0) return;
    // Orientation is picked once per deal; afterward only the card size follows the screen.
    fit = fresh || !fit ? fitBoard(board.cols, board.rows, w, hgt) : sizeBoard(fit.cols, fit.rows, w, hgt);
    grid.style.setProperty('--cols', String(fit.cols));
    grid.style.setProperty('--card-w', `${fit.cardW}px`);
    grid.style.setProperty('--card-h', `${fit.cardH}px`);
    grid.style.setProperty('--gap', `${fit.gap}px`);
  }

  function setRoving(i: number, quiet = false): void {
    els.forEach((e, k) => e.button.setAttribute('tabindex', k === i ? '0' : '-1'));
    focusIdx = i;
    if (!quiet) els[i]?.button.focus({ preventScroll: true });
  }

  function onKey(e: KeyboardEvent): void {
    if (!KEYS.has(e.key) || !fit) return;
    e.preventDefault();
    setRoving(moveFocus(focusIdx, e.key, fit.cols, els.length));
  }

  function render(i: number, fade: boolean): void {
    const e = els[i];
    const c = cards[i];
    if (!e || !c) return;
    const up = game.matched[i] === true || game.up.includes(i);
    setCardState(e, i, c.sticker, up, game.matched[i] === true);
    if (fade && !full() && ctx.motion !== 'off' && typeof e.front.animate === 'function') {
      // Reduced motion: a soft cross-fade in place instead of the 3D turn.
      (up ? e.front : e.back).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
    }
  }

  function onFlip(i: number): void {
    if (!board || donePanel) return;
    setRoving(i, true);
    const out = flip(game, i);
    if (out.turnedDown.length > 0) { cancel(missTimer); missTimer = null; }
    game = out.state;
    for (const k of out.turnedDown) render(k, true);
    const r = out.result;
    if (r.kind === 'ignored') return;
    updateCounts();
    if (r.kind === 'first') {
      render(r.index, true);
      ctx.announce(cards[r.index]?.sticker.label ?? '');
    } else if (r.kind === 'miss') {
      streak = 0;
      render(r.b, true);
      ctx.announce(fill(COPY.sayMiss));
      missTimer = later(() => {
        missTimer = null;
        game = settle(game);
        render(r.a, true);
        render(r.b, true);
      }, MISS_MS);
    } else {
      streak++;
      render(r.b, true);
      render(r.a, true);
      const s = cards[r.a]!.sticker;
      celebratePair(r.a, r.b, s);
      ctx.announce(fill(COPY.sayMatch, { label: s.label, n: game.pairsFound, total: game.pairs }));
      if (r.won) later(finish, WIN_PAUSE_MS);
    }
  }

  function updateCounts(): void {
    trayCount.textContent = `${game.pairsFound}/${game.pairs}`;
    tray.setAttribute('aria-label', fill(COPY.progress, { n: game.pairsFound, total: game.pairs }));
    flipsChip.textContent = game.flips === 1 ? COPY.flip1 : fill(COPY.flips, { n: game.flips });
  }

  function centerOf(i: number): { x: number; y: number } {
    const r = els[i]!.button.getBoundingClientRect();
    const o = root.getBoundingClientRect();
    return { x: r.left - o.left + r.width / 2, y: r.top - o.top + r.height / 2 };
  }

  function celebratePair(a: number, b: number, s: MemorySticker): void {
    const pa = centerOf(a);
    const pb = centerOf(b);
    burst.pop(pa.x, pa.y, 16);
    later(() => burst.pop(pb.x, pb.y, 16), 120);
    const text = COPY.streak[streak] ?? COPY.cheers[(game.pairsFound + dealCount) % COPY.cheers.length]!;
    cheer(text, (pa.x + pb.x) / 2, Math.min(pa.y, pb.y) - 10);
    flyToTray(b, s);
  }

  function cheer(text: string, x: number, y: number): void {
    const el = h('span', { class: 'mem-cheer', 'aria-hidden': 'true', style: `left:${x}px;top:${y}px` }, text);
    root.append(el);
    const frames = full()
      ? [{ transform: 'translate(-50%,-50%) scale(.4) rotate(-8deg)', opacity: 0, easing: 'cubic-bezier(.2,.8,.2,1)' }, { transform: 'translate(-50%,-60%) scale(1.12) rotate(3deg)', opacity: 1, offset: 0.2 },
        { transform: 'translate(-50%,-80%) scale(1) rotate(-2deg)', opacity: 1, offset: 0.7 }, { transform: 'translate(-50%,-110%) scale(.96)', opacity: 0 }]
      : [{ transform: 'translate(-50%,-50%)', opacity: 0 }, { transform: 'translate(-50%,-50%)', opacity: 1, offset: 0.15 }, { transform: 'translate(-50%,-50%)', opacity: 1, offset: 0.75 }, { transform: 'translate(-50%,-50%)', opacity: 0 }];
    if (typeof el.animate !== 'function' || ctx.motion === 'off') { later(() => el.remove(), 900); return; }
    // Linear overall so the bubble actually holds still and readable between its pop-in and fade-out.
    el.animate(frames, { duration: 1300, easing: 'linear', fill: 'forwards' }).onfinish = () => el.remove();
  }

  function flyToTray(i: number, s: MemorySticker): void {
    const slot = slots.children[filled.length] as HTMLElement | undefined;
    if (!slot) return;
    filled.push(slot);
    const land = (): void => {
      slot.replaceChildren(stickerArt(s));
      slot.classList.add('is-filled');
    };
    const from = els[i]?.art.getBoundingClientRect();
    const to = slot.getBoundingClientRect();
    if (!full() || !from || from.width === 0 || typeof document.body.animate !== 'function') { land(); return; }
    const ghost = stickerArt(s, 'mem-ghost');
    ghost.style.cssText = `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px`;
    document.body.append(ghost);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const k = to.width / from.width;
    ghost.animate([
      { transform: 'translate(0,0) scale(1) rotate(0)' },
      { transform: `translate(${dx * 0.45}px,${dy * 0.45 - 40}px) scale(${(1 + k) / 2 + 0.15}) rotate(-10deg)`, offset: 0.45 },
      { transform: `translate(${dx}px,${dy}px) scale(${k}) rotate(0)` },
    ], { duration: 700, delay: 260, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }).onfinish = () => { ghost.remove(); land(); };
  }

  function hint(): void {
    if (!board || donePanel) return;
    const pair = hintPair(game);
    if (!pair) return;
    for (const k of pair) {
      const b = els[k]?.button;
      if (!b) continue;
      b.classList.remove('is-hint');
      void b.offsetWidth;
      b.classList.add('is-hint');
      later(() => b.classList.remove('is-hint'), HINT_MS);
    }
    ctx.announce(COPY.sayHint);
  }

  function finish(): void {
    if (!board || !isWon(game)) return;
    const timersFromBurst = burst.finale();
    for (const t of timersFromBurst) timers.add(t);
    root.classList.add('is-done');
    const name = ctx.store.progress.name;
    const perfect = game.flips === game.pairs * 2;
    const playAgain = h('button', { type: 'button', class: 'btn btn-lg mem-again', onclick: () => { if (board) start(board); } }, icon('shuffle', 22), COPY.playAgain);
    const panel = h('div', { class: 'mem-done', role: 'dialog', 'aria-modal': 'true', 'aria-labeledby': 'mem-done-title' },
      h('div', { class: 'mem-done-card' },
        h('div', { class: 'mem-done-jubi' }, mascot('party', 96)),
        h('h2', { class: 'h2 mem-done-title', id: 'mem-done-title' }, name ? fill(COPY.doneName, { name }) : COPY.doneTitle),
        h('p', { class: 'mem-done-sub' }, COPY.doneSub),
        h('ul', { class: 'mem-done-stickers', 'aria-hidden': 'true' },
          ...uniqueStickers().map((s, k) => h('li', { style: `--k:${k}` }, stickerArt(s)))),
        lastOptions.countFlips ? h('p', { class: 'mem-done-flips' }, fill(perfect ? COPY.donePerfect : COPY.doneFlips, { n: game.flips })) : null,
        h('div', { class: 'mem-done-actions' },
          playAgain,
          h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => showSetup(true) }, COPY.otherBoard),
          h('button', { type: 'button', class: 'btn btn-ghost mem-done-back', onclick: () => env.close() }, icon('arrowLeft', 20), fill(COPY.close, { holiday: meta.name }))),
      ));
    donePanel = panel;
    root.append(panel);
    untrap = trapFocus(panel);
    playAgain.focus({ preventScroll: true });
    ctx.announce(fill(COPY.sayDone, { total: game.pairs }));
  }

  function uniqueStickers(): MemorySticker[] {
    const seen = new Set<string>();
    return cards.filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true))).map((c) => c.sticker);
  }

  function closeDone(): void {
    untrap?.();
    untrap = null;
    donePanel?.remove();
    donePanel = null;
    root.classList.remove('is-done');
  }

  const onRootKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    env.close();
  };
  root.addEventListener('keydown', onRootKey);

  showSetup();

  return {
    el: root,
    destroy() {
      for (const t of timers) window.clearTimeout(t);
      timers.clear();
      ro?.disconnect();
      offMotion();
      untrap?.();
      burst.destroy();
      root.removeEventListener('keydown', onRootKey);
      for (const g of document.querySelectorAll('.mem-ghost')) g.remove();
    },
  };
}
