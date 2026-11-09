/**
 * Catch & Stack — one arcade engine, many holiday skins (competitive gap 8).
 *
 *   Catch: drag (or ←/→, A/D) a holiday basket to catch falling treats drawn with the effects sprite
 *          painters; sleepy clouds and pebbles just boing off. No lives, nothing to lose.
 *   Stack: a piece swings on a ribbon; tap / Space / ↓ drops it (or drag it and let go) onto a gently
 *          wobbling tower; a wobble that tips only slides the top piece off with a giggle.
 *
 * Rounds last 45 s and end on a soft "Time for cocoa!" card with a local best per holiday (own key
 * `jubilee.arcade.v1`, no writes while pretending). Easy mode is for 5-year-olds. Canvas 2D, DPR ≤ 2,
 * pooled objects, cached sprites, a fixed 60 Hz step, paused when the tab is hidden. Reduced motion:
 * slower falling, no shake, no particles, a still demo behind the start card.
 *
 * Keyboard: ←/→ or A/D move · Space/Enter/↓/S drop (Stack) · P pause · Esc pauses a round, or leaves
 * from a card. Everything else is ordinary buttons.
 */
import { sceneFor } from '../../art';
import { createSpriteCache } from '../../effects/sprites';
import { h, svg } from '../../ui/dom';
import { icon } from '../../ui/icons';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { paintBackdrop } from './backdrop';
import { ArcadeMemory, type ArcadeMode } from './best';
import { CatchGame, OOPS, SPECIAL } from './catch-engine';
import { plural } from '../../i18n/index';
import { CAUGHT, COPY, fill, TOWER_ANY, TOWERS } from './copy';
import { registerSprites } from './painters';
import { paintPreview, Renderer } from './render';
import { PIECE_ASPECT, skinFor, skinSprites } from './skins';
import { StackGame } from './stack-engine';
import './catch.css';

export { skinFor, SKINS, defaultSkin } from './skins';
export { CatchGame } from './catch-engine';
export { StackGame } from './stack-engine';
export { ArcadeMemory, ARCADE_KEY } from './best';

type Phase = 'menu' | 'play' | 'paused' | 'end';
const STEP = 1 / 60;

function seedFrom(text: string, round: number): number {
  let x = 2166136261 ^ round;
  for (let i = 0; i < text.length; i++) x = Math.imul(x ^ text.charCodeAt(i), 16777619);
  return x >>> 0;
}

function pick<T>(list: readonly T[], n: number): T {
  return list[Math.abs(n) % list.length]!;
}

export function mountCatch(env: PlayEnv): ActivityInstance {
  const { ctx, meta, theme } = env;
  const skin = skinFor(meta, theme);
  const memory = new ArcadeMemory({ pretending: ctx.clock.pretending });
  let mode: ArcadeMode = memory.mode;
  let easy = memory.easy;
  let reduced = ctx.motion !== 'full';
  let phase: Phase = 'menu';
  let round = 0;
  let dpr = Math.min(2, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
  const sprites = createSpriteCache({ scale: dpr });
  registerSprites(sprites, skinSprites(skin));

  const catchGame = new CatchGame({ easy, reduced, seed: seedFrom(meta.id, 0), goodKinds: skin.items.length, oopsKinds: skin.oops.length });
  const stackGame = new StackGame({ easy, reduced, seed: seedFrom(meta.id, 1), aspect: PIECE_ASPECT[skin.piece], colors: skin.pieceColors.length });

  // ------------------------------------------------------------ DOM
  const canvas = h('canvas', { class: 'catch-canvas', role: 'img', 'aria-label': fill(COPY.canvas, { holiday: meta.name }) });
  const g = canvas.getContext('2d', { alpha: true });
  const scoreNum = h('span', { class: 'catch-score-num' }, '0');
  const scoreLabel = h('span', { class: 'catch-score-label' }, COPY.scoreCatch);
  const score = h('div', { class: 'catch-score', 'aria-live': 'off' }, h('span', { class: 'emoji catch-score-emoji', 'aria-hidden': 'true' }, meta.emoji), scoreNum, scoreLabel);
  const cocoa = h('span', { class: 'catch-cocoa' });
  const mug = h('div', { class: 'catch-mug', role: 'img', 'aria-label': COPY.mug }, h('span', { class: 'catch-mug-cup' }, cocoa), h('span', { class: 'catch-steam', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')));
  const pauseBtn = h('button', { class: 'btn btn-icon btn-secondary catch-pause', type: 'button', 'aria-label': COPY.pause, onclick: () => pause() }, pauseIcon());
  const hud = h('div', { class: 'catch-hud' }, score, mug, pauseBtn);
  const backBtn = h('button', { class: 'btn btn-icon btn-secondary catch-back', type: 'button', 'aria-label': COPY.back, onclick: () => env.close() }, icon('back'));
  const bar = h('header', { class: 'catch-bar' }, backBtn,
    h('div', { class: 'catch-titles' }, h('h1', { class: 'catch-h1', id: 'catch-h1' }, COPY.title), h('span', { class: 'catch-sub' }, `${meta.emoji} ${meta.name}`)),
    hud);
  const bubbles = [0, 1, 2].map(() => h('span', { class: 'catch-bubble', 'aria-hidden': 'true' }));
  let bubbleNext = 0;
  const bubbleTimers: number[] = [0, 0, 0];
  const hint = h('p', { class: 'catch-hint', 'aria-hidden': 'true' });
  const overlay = h('div', { class: 'catch-overlay' });
  const stage = h('div', { class: 'catch-stage', tabindex: 0, role: 'application', 'aria-label': COPY.stageCatch });
  // The far layer: the holiday's illustrated scene (minus the front plane, which would hide the
  // basket), or a painted landscape in the theme colors until that art exists. It drifts with the
  // Stack camera at half speed for a little parallax; it never moves in Catch.
  const far = h('div', { class: 'catch-far', 'aria-hidden': 'true' });
  const layers = sceneFor(meta.id);
  let backdrop: HTMLCanvasElement | null = null;
  if (layers) {
    for (const l of layers) {
      if (l.name === 'front') continue;
      far.appendChild(h('img', { class: `catch-scene catch-scene-${l.name}`, src: l.url, alt: '', draggable: false }));
    }
    stage.classList.add('has-scene');
  } else {
    backdrop = h('canvas', { class: 'catch-backdrop' });
    far.appendChild(backdrop);
  }
  stage.append(far, canvas, ...bubbles, hint, overlay);
  const root = h('section', { class: 'catch-play sky', 'aria-labeledby': 'catch-h1', 'data-phase': 'menu' }, bar, stage);

  // ------------------------------------------------------------ rendering
  let raf = 0;
  let last = 0;
  let acc = 0;
  let clock = 0;
  let settleFor = 0;
  let slowFrames = 0;
  let shownScore = -1;
  let shownFill = -1;
  const renderer = g ? new Renderer(g, sprites, skin, theme, dpr, reduced) : null;
  let w = 0;
  let hgt = 0;

  function resize(): void {
    const r = stage.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    hgt = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(hgt * dpr);
    catchGame.resize(w, hgt);
    stackGame.resize(w, hgt);
    if (backdrop) paintBackdrop(backdrop, { theme, holidayId: meta.id, ground: skin.ground, w, h: hgt, groundY: catchGame.groundY, dpr, seed: seedFrom(meta.id, 7) });
    shownCam = Number.NaN;
    draw(0);
  }

  let shownCam = Number.NaN;
  function draw(dt: number): void {
    if (!renderer) return;
    if (mode === 'catch') renderer.drawCatch(catchGame, dt);
    else renderer.drawStack(stackGame, clock, memory.best(meta.id, 'stack', easy));
    const cam = mode === 'stack' ? Math.round(stackGame.camY * 0.5) : 0;
    if (cam !== shownCam) {
      shownCam = cam;
      far.style.setProperty('transform', `translate3d(0, ${cam}px, 0)`);
    }
  }

  // ------------------------------------------------------------ loop

  function wantsLoop(): boolean {
    if (document.hidden) return false;
    if (phase === 'play') return true;
    if (phase === 'end') return settleFor > 0;
    if (phase === 'menu') return !reduced;
    return false;
  }

  function frame(now: number): void {
    raf = 0;
    const ms = last ? now - last : 16;
    last = now;
    acc = Math.min(acc + ms / 1000, 0.1);
    let stepped = 0;
    while (acc >= STEP) {
      acc -= STEP;
      stepped += STEP;
      clock += STEP;
      if (mode === 'catch') catchGame.step(STEP); else stackGame.step(STEP);
      renderer?.stepFx(STEP);
      if (phase === 'end') settleFor -= STEP;
    }
    adapt(ms);
    draw(stepped);
    updateHud();
    if (wantsLoop()) raf = requestAnimationFrame(frame);
  }

  /** Drops the resolution a notch when frames stay slow (old tablets), never above DPR 2. */
  function adapt(ms: number): void {
    slowFrames = ms > 24 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames > 60 && dpr > 1) {
      dpr = Math.max(1, dpr - 0.5);
      slowFrames = 0;
      renderer?.setScale(dpr);
      resize();
    }
  }

  function kick(): void {
    if (raf || !wantsLoop()) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function halt(): void {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function updateHud(): void {
    const game = mode === 'catch' ? catchGame : stackGame;
    if (game.score !== shownScore) {
      const grew = game.score > shownScore && shownScore >= 0;
      shownScore = game.score;
      scoreNum.textContent = String(game.score);
      if (grew && !reduced) {
        score.classList.remove('is-popping');
        void score.offsetWidth;
        score.classList.add('is-popping');
      }
    }
    const f = Math.round(game.progress * 40) / 40;
    if (f !== shownFill) {
      shownFill = f;
      cocoa.style.setProperty('transform', `scaleY(${f})`);
      mug.classList.toggle('is-steaming', f >= 0.85);
    }
  }

  // ------------------------------------------------------------ feedback
  function bubble(text: string, x: number, y: number, tone: 'good' | 'soft' | 'big' = 'good'): void {
    const i = bubbleNext;
    bubbleNext = (bubbleNext + 1) % bubbles.length;
    const el = bubbles[i]!;
    el.textContent = text;
    el.className = `catch-bubble is-${tone}`;
    const bx = Math.max(70, Math.min(w - 70, x));
    const by = Math.max(110, Math.min(hgt - 60, y));
    el.style.setProperty('left', `${bx}px`);
    el.style.setProperty('top', `${by}px`);
    void el.offsetWidth;
    el.classList.add('is-on');
    window.clearTimeout(bubbleTimers[i]);
    bubbleTimers[i] = window.setTimeout(() => el.classList.remove('is-on'), tone === 'big' ? 1500 : 900);
  }

  let n = 0;
  catchGame.listener = (ev, x, y, item) => {
    if (!renderer) return;
    if (ev === 'catch' && item) {
      const special = item.cls === SPECIAL;
      if (catchGame.attract) { renderer.sparkle(x, y, '#ffd166', 4); return; }
      renderer.sparkle(x, y, special ? '#ffd166' : (skin.items[item.def % skin.items.length]?.color ?? '#ffffff'), special ? 14 : 8);
      renderer.pop(x, y - 34, special);
      if (special) bubble(pick(COPY.special, n++), x, y - 80, 'big');
    } else if (ev === 'bounce' && item && item.cls === OOPS) {
      if (!catchGame.attract) bubble(pick(COPY.boing, n++), x, y - 70, 'soft');
    } else if (ev === 'land') {
      renderer.puff(x, y);
    } else if (ev === 'milestone') {
      renderer.confetti(w);
      const text = fill(COPY.milestone, { n: catchGame.caught, cheer: skin.cheer });
      bubble(text, w / 2, hgt * 0.38, 'big');
      ctx.announce(text);
    } else if (ev === 'end') {
      finish();
    }
  };
  stackGame.listener = (ev, x, y, count) => {
    if (!renderer) return;
    const sx = w / 2 + x;
    const sy = stackGame.screenY(y);
    if (ev === 'perfect') {
      renderer.sparkle(sx, sy, '#ffd166', 10);
      if (!stackGame.attract) bubble(pick(COPY.perfect, n++), sx, sy - 60, 'good');
    } else if (ev === 'land') {
      renderer.puff(sx - 30, sy);
      renderer.puff(sx + 30, sy);
    } else if (ev === 'slide' || ev === 'miss') {
      if (!stackGame.attract) bubble(pick(COPY.giggle, n++), Math.max(90, Math.min(w - 90, sx)), Math.max(140, sy - 50), 'soft');
    } else if (ev === 'milestone') {
      renderer.confetti(w);
      const text = COPY.heights[count] ?? fill(COPY.milestone, { n: count, cheer: skin.cheer });
      bubble(text, w / 2, hgt * 0.42, 'big');
      ctx.announce(text);
    } else if (ev === 'end') {
      finish();
    }
  };

  // ------------------------------------------------------------ phases
  function setPhase(p: Phase): void {
    phase = p;
    root.setAttribute('data-phase', p);
    // The play field is only a tab stop while there is something to steer.
    stage.tabIndex = p === 'play' ? 0 : -1;
  }

  function setMode(m: ArcadeMode): void {
    mode = m;
    root.setAttribute('data-mode', m);
    scoreLabel.textContent = m === 'catch' ? COPY.scoreCatch : COPY.scoreStack;
    stage.setAttribute('aria-label', m === 'catch' ? COPY.stageCatch : COPY.stageStack);
    canvas.setAttribute('aria-label', m === 'catch' ? fill(COPY.canvas, { holiday: meta.name }) : fill(COPY.canvasStack, { noun: skin.stackNoun }));
    shownScore = -1;
    shownFill = -1;
    memory.setPrefs(mode, easy);
  }

  function warmDemo(): void {
    // Reduced motion shows a still demo, so give it a moment of play first.
    const game = mode === 'catch' ? catchGame : stackGame;
    game.demo();
    if (reduced) for (let i = 0; i < 150; i++) game.step(STEP);
  }

  function showMenu(): void {
    setPhase('menu');
    renderer?.fx.clear();
    warmDemo();
    overlay.replaceChildren(menuCard());
    overlay.hidden = false;
    draw(0);
    kick();
    overlay.querySelector<HTMLElement>('.catch-go')?.focus({ preventScroll: true });
  }

  function start(): void {
    round++;
    const seed = seedFrom(meta.id, round);
    catchGame.setOptions({ easy, reduced });
    stackGame.setOptions({ easy, reduced });
    if (mode === 'catch') catchGame.start(seed); else stackGame.start(seed);
    renderer?.fx.clear();
    overlay.hidden = true;
    overlay.replaceChildren();
    setPhase('play');
    shownScore = -1;
    shownFill = -1;
    updateHud();
    hint.textContent = mode === 'catch' ? COPY.hintCatch : COPY.hintStack;
    hint.classList.remove('is-gone');
    window.setTimeout(() => hint.classList.add('is-gone'), 4000);
    bubble(COPY.ready, w / 2, hgt * 0.4, 'big');
    ctx.announce(fill(COPY.started, { hint: mode === 'catch' ? COPY.hintCatch : COPY.hintStack }));
    stage.focus({ preventScroll: true });
    kick();
  }

  function pause(): void {
    if (phase !== 'play') return;
    setPhase('paused');
    halt();
    keys.clear();
    catchGame.setKey(0);
    catchGame.setTarget(Number.NaN);
    stackGame.setKey(0);
    overlay.replaceChildren(pausedCard());
    overlay.hidden = false;
    overlay.querySelector<HTMLElement>('.catch-go')?.focus({ preventScroll: true });
  }

  function resume(): void {
    if (phase !== 'paused') return;
    overlay.hidden = true;
    overlay.replaceChildren();
    setPhase('play');
    stage.focus({ preventScroll: true });
    kick();
  }

  let endTimer = 0;
  function finish(): void {
    setPhase('end');
    settleFor = 1.2;
    keys.clear();
    const s = mode === 'catch' ? catchGame.score : stackGame.score;
    const prev = memory.best(meta.id, mode, easy);
    const beat = memory.submit(meta.id, mode, easy, s);
    window.clearTimeout(endTimer);
    endTimer = window.setTimeout(() => {
      overlay.replaceChildren(endCard(s, beat, Math.max(prev, s)));
      overlay.hidden = false;
      overlay.querySelector<HTMLElement>('.catch-go')?.focus({ preventScroll: true });
    }, reduced ? 200 : 700);
  }

  // ------------------------------------------------------------ cards
  function modeButton(m: ArcadeMode): HTMLButtonElement {
    const pic = h('canvas', { class: 'catch-mode-pic', 'aria-hidden': 'true' });
    paintPreview(pic, sprites, skin, m, dpr);
    const best = memory.best(meta.id, m, easy);
    const btn = h('button', {
      class: 'catch-mode', type: 'button', 'aria-pressed': String(mode === m),
      onclick: () => { setMode(m); showMenu(); },
    }, pic,
    h('span', { class: 'catch-mode-name' }, m === 'catch' ? COPY.modeCatch : COPY.modeStack),
    h('span', { class: 'catch-mode-hint' }, m === 'catch' ? COPY.modeCatchHint : COPY.modeStackHint),
    best > 0 ? h('span', { class: 'catch-mode-best' }, `🏅 ${fill(COPY.bestShort, { n: best })}`) : null);
    return btn;
  }

  function menuCard(): HTMLElement {
    const easyBox = h('input', { type: 'checkbox', class: 'catch-easy-input' });
    easyBox.checked = easy;
    easyBox.addEventListener('change', () => {
      easy = easyBox.checked;
      memory.setPrefs(mode, easy);
      catchGame.setOptions({ easy });
      stackGame.setOptions({ easy });
      showMenu();
      overlay.querySelector<HTMLElement>('.catch-easy-input')?.focus({ preventScroll: true });
    });
    return h('div', { class: 'card catch-card catch-menu', role: 'group', 'aria-label': COPY.title },
      h('div', { class: 'catch-modes' }, modeButton('catch'), modeButton('stack')),
      h('label', { class: 'switch catch-easy' }, easyBox, h('span', {}, h('b', {}, COPY.easy), h('small', {}, COPY.easyHint))),
      h('button', { class: 'btn btn-lg catch-go', type: 'button', onclick: () => start() }, icon('play'), COPY.play),
      h('p', { class: 'catch-note' }, mode === 'catch' ? COPY.sleepy : COPY.hintStack));
  }

  function pausedCard(): HTMLElement {
    return h('div', { class: 'card catch-card catch-paused', role: 'group', 'aria-label': COPY.paused },
      h('p', { class: 'catch-big' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, '☕'), ' ', COPY.paused),
      h('p', { class: 'catch-note' }, COPY.pausedNote),
      h('button', { class: 'btn btn-lg catch-go', type: 'button', onclick: () => resume() }, icon('play'), COPY.resume),
      h('button', { class: 'btn btn-ghost catch-leave', type: 'button', onclick: () => env.close() }, COPY.back));
  }

  function endCard(s: number, beat: boolean, best: number): HTMLElement {
    // Stack is played by hammering Space, so a press that was meant for the last piece must not
    // restart the round before the child has seen the card.
    const shownAt = performance.now();
    const again = (): void => { if (performance.now() - shownAt > 900) start(); };
    const line = mode === 'catch'
      ? (s > 0 ? plural(s, CAUGHT, { noun: skin.catchNoun }) : COPY.caughtNone)
      : (s > 0 ? plural(s, TOWERS[skin.stackNoun] ?? TOWER_ANY) : COPY.towerNone);
    ctx.announce(fill(COPY.ended, { line }));
    const other: ArcadeMode = mode === 'catch' ? 'stack' : 'catch';
    return h('div', { class: 'card catch-card catch-end', role: 'group', 'aria-label': COPY.cocoa },
      h('div', { class: 'catch-cocoa-cup', 'aria-hidden': 'true' }, '☕'),
      h('h2', { class: 'catch-cocoa-title' }, COPY.cocoa),
      h('p', { class: 'catch-line' }, line),
      beat ? h('p', { class: 'catch-newbest' }, `⭐ ${COPY.newBest}`) : (best > 0 ? h('p', { class: 'catch-best' }, fill(COPY.best, { n: best })) : null),
      h('div', { class: 'catch-actions' },
        h('button', { class: 'btn btn-lg catch-go', type: 'button', onclick: again }, icon('play'), COPY.again),
        h('button', { class: 'btn btn-secondary', type: 'button', onclick: () => { setMode(other); showMenu(); } }, other === 'catch' ? COPY.tryCatch : COPY.tryStack),
        h('button', { class: 'btn btn-ghost catch-leave', type: 'button', onclick: () => env.close() }, COPY.back)));
  }

  // ------------------------------------------------------------ input
  const keys = new Set<string>();
  function keyDir(): number {
    const l = keys.has('left') ? 1 : 0;
    const r = keys.has('right') ? 1 : 0;
    return r - l;
  }
  function setDir(): void {
    if (mode === 'catch') catchGame.setKey(keyDir()); else stackGame.setKey(keyDir());
  }

  function onKeyDown(e: KeyboardEvent): void {
    const t = e.target as HTMLElement | null;
    const onControl = !!t && t !== stage && (t.tagName === 'BUTTON' || t.tagName === 'INPUT');
    const k = e.key;
    if (k === 'Escape') {
      e.preventDefault();
      if (phase === 'play') pause(); else env.close();
      return;
    }
    if (k === 'p' || k === 'P') {
      if (phase === 'play') pause(); else if (phase === 'paused') resume();
      return;
    }
    if (phase !== 'play') return;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.add('left'); setDir(); e.preventDefault(); return; }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.add('right'); setDir(); e.preventDefault(); return; }
    if (onControl) return;
    if (mode === 'stack' && (k === ' ' || k === 'Enter' || k === 'ArrowDown' || k === 's' || k === 'S')) {
      e.preventDefault();
      if (!e.repeat) stackGame.drop();
    }
  }

  function onKeyUp(e: KeyboardEvent): void {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.delete('left');
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.delete('right');
    else return;
    setDir();
  }

  let pointerId = -1;
  let downX = 0;
  let dragged = false;
  function localX(e: PointerEvent): number {
    return e.clientX - stage.getBoundingClientRect().left;
  }
  function onPointerDown(e: PointerEvent): void {
    if (phase !== 'play' || (e.target as HTMLElement).closest('.catch-overlay')) return;
    pointerId = e.pointerId;
    try { stage.setPointerCapture(e.pointerId); } catch { /* old browsers */ }
    downX = localX(e);
    dragged = false;
    if (mode === 'catch') catchGame.setTarget(downX);
    e.preventDefault();
  }
  function onPointerMove(e: PointerEvent): void {
    if (phase !== 'play') return;
    const x = localX(e);
    if (mode === 'catch') {
      if (e.pointerId === pointerId || e.pointerType === 'mouse') catchGame.setTarget(x);
      return;
    }
    if (e.pointerId !== pointerId) return;
    if (dragged || Math.abs(x - downX) > 8) {
      dragged = true;
      stackGame.dragTo(x);
    }
  }
  function onPointerUp(e: PointerEvent): void {
    if (e.pointerId !== pointerId) return;
    pointerId = -1;
    if (phase !== 'play') return;
    if (mode === 'catch') {
      if (e.pointerType !== 'mouse') catchGame.setTarget(Number.NaN);
      return;
    }
    stackGame.endDrag();
    stackGame.drop();
  }
  function onPointerCancel(e: PointerEvent): void {
    if (e.pointerId !== pointerId) return;
    pointerId = -1;
    catchGame.setTarget(Number.NaN);
    stackGame.endDrag();
  }

  function onVisibility(): void {
    if (document.hidden) { halt(); if (phase === 'play') pause(); }
    else kick();
  }

  const offMotion = ctx.onMotionChange((m) => {
    reduced = m !== 'full';
    if (renderer) renderer.reduced = reduced;
    catchGame.setOptions({ reduced });
    stackGame.setOptions({ reduced });
    if (phase === 'menu') showMenu(); else kick();
  });

  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('keyup', onKeyUp);
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerCancel);
  document.addEventListener('visibilitychange', onVisibility);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => resize()) : null;
  ro?.observe(stage);

  setMode(mode);
  // Mount after the element is in the document so the first measurement is real.
  requestAnimationFrame(() => { resize(); showMenu(); });

  return {
    el: root,
    destroy(): void {
      halt();
      ro?.disconnect();
      offMotion();
      window.clearTimeout(endTimer);
      for (const t of bubbleTimers) window.clearTimeout(t);
      document.removeEventListener('visibilitychange', onVisibility);
      catchGame.listener = null;
      stackGame.listener = null;
      sprites.clear();
    },
  };
}

/** Two rounded bars; ui/icons has no pause glyph and that file belongs to another lane. */
function pauseIcon(): SVGSVGElement {
  const bar = (x: number): SVGRectElement => svg('rect', { x, y: 5, width: 4.5, height: 14, rx: 2, fill: 'currentColor' });
  return svg('svg', { viewBox: '0 0 24 24', width: 24, height: 24, 'aria-hidden': 'true' }, bar(6), bar(14));
}

export const catchActivity: Activity = {
  id: 'catch',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  // Every holiday can play: hand-made skins for most, and a theme + effect-glyph skin for the rest.
  available: () => true,
  mount: mountCatch,
};
