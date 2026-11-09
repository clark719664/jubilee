/**
 * Jubi's Path (activity id 'path') — tiny sequencing puzzles for 6–12-year-olds, skinned by whichever
 * holiday opens it. Line up instruction cards (step, turn, jump, repeat ×2/×3, and later "if blocked,
 * turn right") in the program strip, press Go, and Jubi walks it with the running card lit up, lighting
 * the diyas / delivering the presents / gathering the eggs on her way to the goal.
 *
 * 30 shared puzzles ramp from two-card programs to loops inside loops (levels.ts); Christmas, Diwali,
 * Lunar New Year, Halloween and Easter add two bonus puzzles each. Every puzzle is always open. A program
 * that stops early just ends with Jubi shrugging and a friendly idea (copy.ts); a solved puzzle earns a
 * star, kept on this device (stars.ts). Nothing is timed, scored against the child or locked.
 *
 * Motion: full → Jubi tweens and hops on the spring curve, items pop, sparkles burst; anything else →
 * Jubi moves square by square without tweening, items just change, the finale is one still ring.
 */
import './path.css';
import { applyTheme } from '../../theme/apply';
import { h, svg, trapFocus } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { mascot } from '../../ui/mascot';
import { Burst } from '../memory/burst';
import { plural } from '../../i18n/index';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { BoardView } from './board';
import { COPY, COUNTS, fill, goalLine, hintFor } from './copy';
import { ProgramEditor } from './editor';
import { boardOf, CHAPTERS, freshCards, levelLabel, levelsFor, type Level } from './levels';
import { cardCount, cardsOf, run, type Board, type Card, type Dir, type Pos } from './model';
import { focusColor, skinFor, type Skin } from './skins';
import { pathStars } from './stars';

export { BONUS, boardOf, CHAPTERS, freshCards, levelLabel, LEVELS, levelsFor, type Level } from './levels';
export { cardsOf, run } from './model';
export { solve } from './solver';
export { skinFor } from './skins';

const GAP_MS = 60;

export const pathActivity: Activity = {
  id: 'path',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  // The puzzles are shared and every holiday has a skin (its own, its theme's, or the mood's).
  available: () => true,
  mount: (env) => mountPath(env),
};

function mountPath(env: PlayEnv): ActivityInstance {
  const { ctx, meta, theme } = env;
  const full = (): boolean => ctx.motion === 'full';
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number): number => {
    const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  };
  const levels = levelsFor(meta.id);
  const skin: Skin = skinFor(meta, theme.mood);
  const stars = pathStars({ pretending: ctx.clock.pretending });
  const ids = levels.map((l) => l.id);

  // ── chrome ──
  const starsText = h('span', { class: 'pth-stars-n' });
  const pickBtn = h('button', { type: 'button', class: 'btn btn-secondary pth-pick', 'aria-haspopup': 'dialog', onclick: () => openPicker() },
    icon('map', 22), h('span', { class: 'pth-pick-text' }, COPY.puzzles), h('span', { class: 'pth-stars', 'aria-hidden': 'true' }, starGlyph(), starsText));
  const levelName = h('span', { class: 'pth-level-name' });
  const levelNum = h('span', { class: 'pth-level-num' });
  const levelStar = h('span', { class: 'pth-level-star', 'aria-hidden': 'true' }, starGlyph());
  const prevBtn = h('button', { type: 'button', class: 'btn btn-secondary btn-icon pth-nav', 'aria-label': COPY.prevPuzzle, onclick: () => go(index - 1) }, icon('arrowLeft', 20));
  const nextBtn = h('button', { type: 'button', class: 'btn btn-secondary btn-icon pth-nav', 'aria-label': COPY.nextPuzzle, onclick: () => go(index + 1) }, icon('arrowRight', 20));
  const levelBar = h('div', { class: 'pth-levelbar' }, prevBtn, h('h2', { class: 'pth-level', id: 'pth-level' }, levelNum, levelName, levelStar), nextBtn);

  const header = h('header', { class: 'pth-head' },
    h('button', { type: 'button', class: 'btn btn-secondary btn-icon pth-close', 'aria-label': fill(COPY.close, { holiday: meta.name }), onclick: () => env.close() }, icon('close', 22)),
    h('h1', { class: 'pth-h1', id: 'pth-h1' }, COPY.title),
    levelBar,
    pickBtn,
  );

  const sayText = h('p', { class: 'pth-say-text' });
  const sayTip = h('p', { class: 'pth-say-tip' });
  const say = h('div', { class: 'pth-say' }, h('span', { class: 'pth-say-jubi', 'aria-hidden': 'true' }, mascot('curious', 44)), h('div', { class: 'pth-say-body' }, sayText, sayTip));

  const board = new BoardView(() => ctx.motion);
  const boardBox = h('div', { class: 'pth-boardbox' }, board.el);
  const stage = h('div', { class: 'pth-stage' }, say, boardBox, board.desc);

  const editor = new ProgramEditor({ onChange: () => onEdit(), announce: (t) => ctx.announce(t), full });
  const goBtn = h('button', { type: 'button', class: 'btn btn-lg pth-go', onclick: () => (running ? stop() : start()) });
  const side = h('div', { class: 'pth-side' },
    h('div', { class: 'pth-panel pth-panel-cards' },
      h('div', { class: 'pth-panel-head' }, h('h2', { class: 'pth-panel-title' }, COPY.palette), h('span', { class: 'pth-panel-help' }, COPY.paletteHelp)),
      editor.palette),
    h('div', { class: 'pth-panel pth-panel-strip' },
      h('div', { class: 'pth-panel-head' }, h('h2', { class: 'pth-panel-title' }, COPY.strip), editor.meter),
      editor.strip, editor.note),
    h('div', { class: 'pth-controls' }, editor.tools, goBtn),
  );
  const main = h('div', { class: 'pth-main' }, stage, side);
  const root = h('section', { class: 'pth sky', 'aria-labeledby': 'pth-h1', 'data-mood': theme.mood }, header, main);
  applyTheme(root, theme);
  root.style.setProperty('--pth-focus', focusColor(theme));
  const burst = new Burst(root, { effect: meta.effect, ...(meta.effectParams ? { params: meta.effectParams } : {}), theme, motion: () => ctx.motion, seed: 11 });
  root.append(burst.canvas);
  const syncMotion = (): void => { root.classList.toggle('pth-calm', !full()); };
  syncMotion();
  const offMotion = ctx.onMotionChange(syncMotion);

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => fit()) : null;
  ro?.observe(boardBox);
  function fit(): void {
    board.fit(boardBox.clientWidth, boardBox.clientHeight);
  }

  // ── state ──
  let index = Math.max(0, levels.findIndex((l) => !stars.has(l.id)));
  let level: Level = levels[index]!;
  let data: Board = boardOf(level);
  let running = false;
  let ranOnce = false;
  let ticker: number | null = null;
  let panel: HTMLElement | null = null;
  let untrap: (() => void) | null = null;
  let lastProgram: readonly Card[] = [];

  /** `fromDialog`: chosen in the picker or the win dialog, so focus moves to the new puzzle's cards. */
  function go(i: number, fromDialog = false): void {
    const n = levels.length;
    load(((i % n) + n) % n, true, fromDialog);
  }

  function load(i: number, announce: boolean, fromDialog = false): void {
    stop(true);
    closePanel();
    index = i;
    level = levels[i]!;
    data = boardOf(level);
    board.build(data, skin);
    boardBox.style.setProperty('--ar', String(data.rows / data.cols));
    fit();
    editor.setLevel(level.cards, level.max, freshCards(levels, i));
    const label = levelLabel(levels, i);
    levelNum.textContent = label;
    levelName.textContent = level.name;
    root.setAttribute('data-level', level.id);
    syncStars();
    sayGoal();
    ranOnce = false;
    if (announce) ctx.announce(fill(COPY.sayLevel, { label, name: level.name, goal: goalLine(skin, data.items.length) }));
    if (full() && typeof board.el.animate === 'function') {
      board.el.animate([{ transform: 'scale(.94)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    // The dialog that had focus is gone: start the child on the new puzzle's first card.
    if (fromDialog) editor.focusPalette();
  }

  function syncStars(): void {
    starsText.textContent = `${stars.count(ids)}/${ids.length}`;
    pickBtn.setAttribute('aria-label', `${COPY.puzzlesLabel}. ${plural(ids.length, COUNTS.starsLabel, { n: stars.count(ids), total: ids.length })}`);
    levelStar.hidden = !stars.has(level.id);
    root.classList.toggle('is-solved', stars.has(level.id));
  }

  function sayGoal(): void {
    say.classList.remove('is-hint', 'is-win');
    sayText.textContent = goalLine(skin, data.items.length);
    sayTip.textContent = level.tip ?? '';
    sayTip.hidden = !level.tip;
    setSayFace('curious');
  }

  function setSayFace(state: 'curious' | 'excited' | 'party' | 'sleepy'): void {
    say.querySelector('.pth-say-jubi')?.replaceChildren(mascot(state, 44));
  }

  function sayHint(text: string): void {
    say.classList.add('is-hint');
    say.classList.remove('is-win');
    sayText.textContent = text;
    sayTip.textContent = '';
    sayTip.hidden = true;
    setSayFace('curious');
    if (full() && typeof say.animate === 'function') {
      say.animate([{ transform: 'scale(.96)' }, { transform: 'scale(1.03)', offset: 0.5 }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  }

  function onEdit(): void {
    // Any change sends Jubi back to the start, so the board always matches the program.
    if (ranOnce) { board.reset(); sayGoal(); ranOnce = false; }
  }

  // ── running ──

  function start(): void {
    if (running) return;
    closePanel();
    board.reset();
    const program = editor.program;
    const r = run(data, program);
    if (r.outcome.kind === 'empty') { sayHint(hintFor(r.outcome, skin, { jumpOffered: false, items: data.items.length })); ctx.announce(sayText.textContent ?? ''); return; }
    lastProgram = [...program];
    running = true;
    ranOnce = true;
    editor.lock(true);
    syncGo();
    sayText.textContent = COPY.sayRun;
    sayTip.hidden = true;
    say.classList.remove('is-hint', 'is-win');
    setSayFace('excited');
    board.setFace('excited');
    ctx.announce(COPY.sayRun);
    let i = 0;
    let at: { pos: Pos; dir: Dir } = { pos: data.start, dir: data.dir };
    const done = data.items.map(() => false);
    const tick = (): void => {
      ticker = null;
      const f = r.frames[i];
      if (!f) { finish(r.outcome, at, done, program); return; }
      editor.highlight(f.at, f.loops);
      const ms = board.show(f, at);
      if (f.collected !== undefined) {
        done[f.collected] = true;
        const k = f.collected;
        later(() => popAt(k), full() ? ms * 0.6 : 0);
      }
      at = { pos: f.pos, dir: f.dir };
      i++;
      ticker = later(tick, ms + GAP_MS);
    };
    ticker = later(tick, full() ? 220 : 120);
  }

  function popAt(i: number): void {
    const c = board.centerOf(i);
    if (!c) return;
    const o = root.getBoundingClientRect();
    burst.pop(c.x - o.left, c.y - o.top, 12, 0.7);
  }

  function stop(silent = false): void {
    if (ticker !== null) { window.clearTimeout(ticker); timers.delete(ticker); ticker = null; }
    board.stop();
    if (!running) return;
    running = false;
    editor.lock(false);
    syncGo();
    if (!silent) { board.setFace('curious'); sayGoal(); }
  }

  function finish(outcome: ReturnType<typeof run>['outcome'], at: { pos: Pos; dir: Dir }, done: boolean[], program: readonly Card[]): void {
    running = false;
    editor.lock(false);
    syncGo();
    board.describe(at.pos, at.dir, done);
    if (outcome.kind === 'win') { win(program); return; }
    board.setFace('curious');
    board.shrug(true);
    const hint = hintFor(outcome, skin, { jumpOffered: level.cards.includes('jump'), items: data.items.length, stop: { board: data, pos: at.pos, dir: at.dir } });
    sayHint(hint);
    ctx.announce(hint);
  }

  function win(program: readonly Card[]): void {
    board.setFace('party');
    const fresh = stars.add(level.id);
    syncStars();
    const timersFromBurst = burst.finale();
    for (const t of timersFromBurst) timers.add(t);
    const name = ctx.store.progress.name;
    const cheer = name ? fill(COPY.winName, { name }) : COPY.win[(index + stars.count(ids)) % COPY.win.length]!;
    const sub = data.items.length > 0 ? fill(COPY.winAll, { one: skin.one, done: skin.done }) : fill(COPY.winNoItems, { goal: skin.goalName });
    say.classList.add('is-win');
    say.classList.remove('is-hint');
    sayText.textContent = `${cheer} ${sub}`;
    sayTip.hidden = true;
    setSayFace('party');
    ctx.announce(`${cheer} ${sub} ${fresh ? COPY.winFirst : ''}`);
    later(() => showWin(cheer, sub, fresh, cardCount(program)), full() ? 650 : 250);
  }

  function showWin(cheer: string, sub: string, fresh: boolean, used: number): void {
    closePanel();
    const nextB = h('button', { type: 'button', class: 'btn btn-lg pth-next', onclick: () => go(index + 1, true) }, COPY.next, icon('arrowRight', 22));
    const p = h('div', { class: 'pth-dialog pth-win', role: 'dialog', 'aria-modal': 'true', 'aria-labeledby': 'pth-win-title' },
      h('div', { class: 'pth-dialog-card' },
        h('div', { class: 'pth-win-jubi' }, mascot('party', 96)),
        h('h2', { class: 'pth-dialog-title', id: 'pth-win-title' }, cheer),
        h('p', { class: 'pth-dialog-sub' }, sub),
        h('p', { class: `pth-win-star${fresh ? ' is-new' : ''}` }, starGlyph(), h('span', {}, fresh ? COPY.winFirst : COPY.winAgain)),
        used < cardCount(cardsOf(level.solution)) ? h('p', { class: 'pth-dialog-sub' }, plural(used, { one: 'Wow, only {n} card!', other: 'Wow, only {n} cards!' })) : null,
        h('div', { class: 'pth-dialog-actions' },
          nextB,
          h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => { closePanel(); editor.setCards(lastProgram); start(); goBtn.focus({ preventScroll: true }); } }, COPY.watch),
          h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => openPicker() }, COPY.choose),
        )));
    showPanel(p, nextB);
  }

  function syncGo(): void {
    goBtn.replaceChildren(running ? stopGlyph() : icon('play', 24), running ? COPY.stop : COPY.go);
    goBtn.classList.toggle('is-stop', running);
  }

  // ── puzzle picker ──

  function openPicker(): void {
    stop();
    closePanel();
    const button = (l: Level, i: number): HTMLButtonElement => {
      const solved = stars.has(l.id);
      const label = levelLabel(levels, i);
      return h('button', {
        type: 'button', class: `pth-lv${solved ? ' is-solved' : ''}${i === index ? ' is-current' : ''}`,
        'aria-label': fill(solved ? COPY.levelSolved : COPY.levelButton, { label, name: l.name }),
        ...(i === index ? { 'aria-current': 'true' } : {}),
        onclick: () => load(i, true, true),
      }, h('span', { class: 'pth-lv-n' }, l.bonus ? `B${label.replace(/\D/g, '')}` : String(i + 1)), solved ? starGlyph() : null);
    };
    const sections: HTMLElement[] = [];
    CHAPTERS.forEach((from, k) => {
      const to = CHAPTERS[k + 1] ?? levels.filter((l) => !l.bonus).length;
      sections.push(h('section', { class: 'pth-chapter' },
        h('h3', { class: 'pth-chapter-title' }, COPY.chapters[k] ?? ''),
        h('div', { class: 'pth-lv-grid' }, ...levels.slice(from, to).map((l, j) => button(l, from + j)))));
    });
    const bonusStart = levels.findIndex((l) => l.bonus);
    if (bonusStart >= 0) {
      sections.push(h('section', { class: 'pth-chapter is-bonus' },
        h('h3', { class: 'pth-chapter-title' }, fill(COPY.bonusChapter, { holiday: meta.name })),
        h('div', { class: 'pth-lv-grid' }, ...levels.slice(bonusStart).map((l, j) => button(l, bonusStart + j)))));
    }
    const closeB = h('button', { type: 'button', class: 'btn btn-secondary btn-icon pth-dialog-close', 'aria-label': COPY.closeDialog, onclick: () => closePanel(true) }, icon('close', 22));
    const p = h('div', { class: 'pth-dialog pth-picker', role: 'dialog', 'aria-modal': 'true', 'aria-labeledby': 'pth-pick-title' },
      h('div', { class: 'pth-dialog-card' },
        h('div', { class: 'pth-picker-head' },
          h('div', {}, h('h2', { class: 'pth-dialog-title', id: 'pth-pick-title' }, COPY.pickTitle), h('p', { class: 'pth-dialog-sub' }, COPY.pickSub)),
          closeB),
        h('div', { class: 'pth-picker-body' }, ...sections)));
    showPanel(p, p.querySelector<HTMLElement>('.pth-lv.is-current') ?? closeB);
  }

  function showPanel(p: HTMLElement, focus: HTMLElement): void {
    panel = p;
    root.append(p);
    root.classList.add('has-dialog');
    untrap = trapFocus(p);
    focus.focus({ preventScroll: true });
  }

  function closePanel(refocus = false): void {
    untrap?.();
    untrap = null;
    if (!panel) return;
    panel.remove();
    panel = null;
    root.classList.remove('has-dialog');
    if (refocus) pickBtn.focus({ preventScroll: true });
  }

  const onRootKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (panel) closePanel(true);
      else if (running) stop();
      else env.close();
      return;
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !panel) {
      e.preventDefault();
      if (running) stop(); else start();
    }
  };
  root.addEventListener('keydown', onRootKey);

  syncGo();
  load(index, false);

  return {
    el: root,
    destroy() {
      for (const t of timers) window.clearTimeout(t);
      timers.clear();
      ro?.disconnect();
      offMotion();
      untrap?.();
      board.destroy();
      editor.destroy();
      burst.destroy();
      root.removeEventListener('keydown', onRootKey);
    },
  };
}

function starGlyph(): SVGSVGElement {
  return svg('svg', { viewBox: '0 0 24 24', class: 'pth-star', 'aria-hidden': 'true', focusable: 'false' },
    svg('path', { d: 'M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z', fill: '#ffd166', stroke: '#2a1d3d', 'stroke-width': 1.8, 'stroke-linejoin': 'round' }));
}

function stopGlyph(): HTMLElement {
  return h('span', { class: 'pth-stop-glyph', 'aria-hidden': 'true' });
}
