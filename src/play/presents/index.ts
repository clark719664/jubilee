/**
 * Present Drop (activity id 'presents') — Santa's sleigh glides over a row of rooftops and the child
 * drops presents down the chimneys.
 *
 * The sleigh loops left to right. Tap anywhere (or press Space, or the big button) and a present falls;
 * if the sleigh is over a chimney it drops in and that window lights up. A miss bounces softly in the
 * snow. Light all five windows to finish; "Play again" starts a fresh street. No timer, no lives, no
 * sound, nothing saved.
 *
 * Motion: full → the sleigh glides and presents fall; otherwise the sleigh hops a step at a time (well
 * under 3 Hz) and presents appear where they land.
 */
import './presents.css';
import { mulberry32 } from '../../effects/rng';
import { h, svg } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { createShell, fill, pick } from '../spooky/kit';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { AGAIN_LINES, CALM_STEP, CHIMNEY_COUNT, CHIMNEY_X, IN_LINES, MISS_LINES, advance, count, drop, isDone, newStreet, wrap, type Street } from './logic';

export { CHIMNEY_COUNT, CHIMNEY_X, advance, chimneyAt, count, drop, isDone, newStreet } from './logic';

export const COPY = {
  title: 'Present Drop',
  emoji: '🎁',
  blurb: 'Drop presents down the chimneys',
  sub: 'Tap to drop a present when the sleigh is over a chimney.',
  dropButton: 'Drop a present',
  stageLabel: 'Santa’s sleigh flying over five rooftops. Tap anywhere to drop a present.',
  houseLabel: 'Rooftop {n}: {state}',
  lit: 'window is lit',
  dark: 'waiting for a present',
  progress: '{n} of {total} chimneys have presents',
  doneTitle: 'Every chimney has a present!',
  doneLine: 'The whole street is glowing. Happy holidays!',
  again: 'Play again',
} as const;

export const presentsActivity: Activity = {
  id: 'presents',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  available: (meta) => meta.id === 'christmas',
  mount: (env) => mountPresents(env),
};

/** Shortest gap between drops, so a flurry of taps never makes anything flash. */
const GAP_MS = 400;
const CALM_HOP_MS = 1500;

function drawHouse(): { readonly art: SVGSVGElement; readonly window: SVGElement; readonly hole: SVGElement } {
  const window = svg('rect', { class: 'pr-window', x: 22, y: 42, width: 16, height: 16, rx: 3 });
  const hole = svg('rect', { class: 'pr-hole', x: 25, y: 5, width: 10, height: 4, rx: 1 });
  const art = svg('svg', { class: 'pr-house-svg', viewBox: '0 0 60 70', 'aria-hidden': 'true', focusable: 'false' },
    svg('rect', { class: 'pr-chimney', x: 25, y: 6, width: 10, height: 16, rx: 1 }),
    hole,
    svg('rect', { class: 'pr-wall', x: 8, y: 30, width: 44, height: 38, rx: 2 }),
    svg('polygon', { class: 'pr-roof', points: '2,32 14,18 46,18 58,32' }),
    svg('polygon', { class: 'pr-snow', points: '14,18 46,18 49,22 11,22' }),
    window);
  return { art, window, hole };
}

function mountPresents(env: PlayEnv): ActivityInstance {
  const { ctx } = env;
  const shell = createShell(env, { game: 'pr', title: COPY.title, sub: COPY.sub });
  const rand = mulberry32((Date.now() ^ 0x3c6ef372) >>> 0);
  let street: Street = newStreet();
  let x = 0.02;
  let last = 0;
  let lastDrop = -Infinity;
  let frame: number | null = null;
  let hop: number | null = null;
  let done = false;

  const sleigh = h('div', { class: 'pr-sleigh', 'aria-hidden': 'true' }, h('span', { class: 'pr-santa' }, '🎅'), h('span', { class: 'pr-sled' }, '🛷'));
  const parts = CHIMNEY_X.map(() => drawHouse());
  const houses = parts.map((p, i) => h('div', { class: 'pr-house', style: `left:${CHIMNEY_X[i]! * 100}%`, role: 'img', 'aria-label': '' }, p.art));
  const ground = h('div', { class: 'pr-ground', 'aria-hidden': 'true' });
  const stage = h('div', { class: 'pr-stage' }, sleigh, ...houses, ground);
  const progress = h('p', { class: 'pr-progress', 'aria-live': 'polite' });
  const say = h('p', { class: 'pr-say', 'aria-live': 'polite' });
  const dropBtn = h('button', { type: 'button', class: 'btn btn-lg pr-drop', 'aria-label': `${COPY.dropButton}. ${COPY.stageLabel}`, onclick: () => release() }, COPY.emoji, ' ', COPY.dropButton);
  shell.body.append(stage, h('div', { class: 'pr-controls' }, progress, say, dropBtn));

  function place(): void { sleigh.style.left = `${x * 100}%`; }

  function render(): void {
    houses.forEach((el, i) => {
      const on = street.filled[i]!;
      parts[i]!.window.classList.toggle('is-lit', on);
      el.setAttribute('aria-label', fill(COPY.houseLabel, { n: i + 1, state: on ? COPY.lit : COPY.dark }));
    });
    progress.textContent = fill(COPY.progress, { n: count(street), total: CHIMNEY_COUNT });
  }

  function tick(now: number): void {
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    x = advance(x, dt);
    place();
    frame = requestAnimationFrame(tick);
  }

  function stopSleigh(): void {
    if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
    shell.cancel(hop);
    hop = null;
  }

  function startSleigh(): void {
    stopSleigh();
    if (shell.full()) {
      last = 0;
      frame = requestAnimationFrame(tick);
    } else {
      const step = (): void => { x = wrap(x + CALM_STEP); place(); hop = shell.later(step, CALM_HOP_MS); };
      hop = shell.later(step, CALM_HOP_MS);
    }
  }

  const offMotion = ctx.onMotionChange(() => { if (!done) startSleigh(); });

  function release(): void {
    if (done) return;
    const now = performance.now();
    if (now - lastDrop < GAP_MS) return;
    lastDrop = now;
    const res = drop(street, x);
    const box = stage.getBoundingClientRect();
    const from = sleigh.getBoundingClientRect();
    const gift = h('span', { class: 'pr-gift', 'aria-hidden': 'true', style: `left:${x * 100}%;top:${from.bottom - box.top - 14}px` }, '🎁');
    stage.append(gift);
    const snowY = ground.getBoundingClientRect().top - box.top - 18;
    const mouth = res.outcome === 'in' && res.index !== null ? parts[res.index]!.hole.getBoundingClientRect().top - box.top - 10 : snowY;
    const land = (): void => {
      if (res.outcome === 'in') {
        gift.remove();
        street = res.street;
        render();
        say.textContent = pick(IN_LINES, rand);
        ctx.announce(say.textContent);
        if (isDone(street)) { done = true; stopSleigh(); shell.later(finish, shell.full() ? 700 : 300); }
      } else {
        gift.classList.add('is-rest');
        say.textContent = pick(res.outcome === 'again' ? AGAIN_LINES : MISS_LINES, rand);
        ctx.announce(say.textContent);
        shell.later(() => gift.remove(), 1800);
      }
    };
    if (shell.full()) {
      void gift.offsetWidth;
      gift.style.top = `${mouth}px`;
      shell.later(land, 650);
    } else {
      gift.style.top = `${mouth}px`;
      shell.later(land, 250);
    }
  }

  function finish(): void {
    const again = h('button', { type: 'button', class: 'btn btn-lg', onclick: () => { d.close(); restart(); } }, icon('shuffle', 22), COPY.again);
    const d = shell.dialog(COPY.doneTitle, [h('p', { class: 'pr-done-line' }, COPY.doneLine), h('div', { class: 'sp-dlg-actions' }, again)], () => again.isConnected && restart());
    ctx.announce(COPY.doneTitle);
  }

  function restart(): void {
    street = newStreet();
    done = false;
    x = 0.02;
    say.textContent = '';
    render();
    startSleigh();
    dropBtn.focus({ preventScroll: true });
  }

  stage.addEventListener('pointerdown', (e) => { e.preventDefault(); release(); });
  shell.root.addEventListener('keydown', (e) => {
    if (e.key !== ' ' && e.code !== 'Space') return;
    if ((e.target as HTMLElement).closest('button, a, [role="dialog"]')) return;
    e.preventDefault();
    release();
  });

  render();
  place();
  startSleigh();
  return {
    el: shell.root,
    destroy: () => { stopSleigh(); offMotion(); shell.destroy(); },
  };
}
