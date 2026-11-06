/**
 * Fireworks Show (activity id 'fireworks') — a dark sky over a city skyline. Pick a shape (burst, ring,
 * heart, star, willow) and a color set, then tap the sky: a rocket rises to that spot and bursts. Up to 24
 * fireworks make a show; "Show time!" replays them in order and "Clear" starts over. Nothing can be lost.
 *
 * Keyboard: focus the sky, arrow keys move the aim mark, Enter or Space launches. Tab reaches the shape
 * and color buttons (arrows move within them), Show time! and Clear.
 * Motion: full → rockets rise and sparks fly and fall; otherwise the finished burst appears as a still
 * picture and slowly fades. Bursts are small and never closer than 0.6 seconds, so nothing flashes.
 * No sound, nothing saved.
 */
import './fireworks.css';
import { h, svg } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { createShell, fill, wireGroup } from '../spooky/kit';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import {
  BURST_RADIUS, COLOR_SETS, MAX_FIREWORKS, MIN_GAP_MS, RISE_MS, SHAPES,
  addFirework, colorSetById, emptyShow, isFull, nudge, shapeById, showLength, showSchedule, skyPoint, sparkAt, sparks,
  type Firework, type ShapeId,
} from './logic';

export { COLOR_SETS, MAX_FIREWORKS, SHAPES, addFirework, nudge, showSchedule, skyPoint, sparks } from './logic';

export const COPY = {
  title: 'Fireworks Show',
  emoji: '🎆',
  blurb: 'Light up the night sky',
  sub: 'Pick a shape and colors, then tap the sky. Arrow keys and Enter work too.',
  sky: 'Night sky. Use the arrow keys to move the aim mark, then press Enter to launch a firework.',
  shapesLabel: 'Firework shape',
  colorsLabel: 'Firework colors',
  showTime: 'Show time!',
  clear: 'Clear',
  count: '{n} of {max} in your show',
  added: '{shape} added. {n} of {max} in your show.',
  full: 'Your show is full! Press Show time!',
  playing: 'Here comes the show!',
  over: 'What a show!',
  cleared: 'Sky cleared. Start a new show!',
} as const;

export const fireworksActivity: Activity = {
  id: 'fireworks',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  available: (meta) => ['independence-day-us', 'new-years-eve', 'canada-day', 'bastille-day'].includes(meta.id),
  mount: (env) => mountFireworks(env),
};

const FADE_MS = 1600;
const STILL_AT = 0.5;
const GROUND_Y = 0.84;

interface Live {
  readonly fw: Firework;
  readonly start: number;
  readonly still: boolean;
}

function skyline(): SVGSVGElement {
  const blocks = [[0, 30, 38], [38, 22, 56], [60, 26, 44], [86, 18, 70], [104, 30, 50], [134, 24, 36], [158, 20, 64], [178, 34, 46], [212, 22, 58], [234, 28, 40], [262, 18, 72], [280, 30, 48], [310, 24, 60], [334, 26, 42]];
  const art = svg('svg', { class: 'fw-city', viewBox: '0 0 360 90', preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' });
  for (const [x, w, top] of blocks) art.append(svg('rect', { x: x!, y: 90 - top!, width: w! + 1, height: top!, fill: 'currentColor' }));
  art.append(svg('rect', { x: 111, y: 20, width: 3, height: 14, fill: 'currentColor' }), svg('rect', { x: 268, y: 6, width: 3, height: 12, fill: 'currentColor' }));
  return art;
}

function shapePreview(id: ShapeId): SVGSVGElement {
  const art = svg('svg', { class: 'fw-shape-art', viewBox: '-1.2 -1.2 2.4 2.4', 'aria-hidden': 'true', focusable: 'false' });
  const set = sparks(id, 1);
  for (let i = 0; i < set.length; i += 2) {
    const p = sparkAt(set[i]!, 1, shapeById(id).droop * 0.4);
    art.append(svg('circle', { cx: p.x.toFixed(2), cy: p.y.toFixed(2), r: 0.14, fill: 'currentColor' }));
  }
  return art;
}

function mountFireworks(env: PlayEnv): ActivityInstance {
  const { ctx } = env;
  const shell = createShell(env, { game: 'fw', title: COPY.title, sub: COPY.sub });
  let show: readonly Firework[] = emptyShow();
  let shapeId: ShapeId = 'burst';
  let colorsId = COLOR_SETS[0]!.id;
  let aim = skyPoint(0.5, 0.35);
  let live: Live[] = [];
  let raf = 0;
  let lastLaunch = -Infinity;
  let playing = false;
  let showTimers: number[] = [];

  const canvas = h('canvas', { class: 'fw-canvas', 'aria-hidden': 'true' });
  const g = canvas.getContext?.('2d') ?? null;
  const aimMark = h('div', { class: 'fw-aim', 'aria-hidden': 'true' });
  const stage = h('div', { class: 'fw-stage', tabindex: 0, role: 'group', 'aria-label': COPY.sky }, canvas, skyline(), aimMark);
  const count = h('p', { class: 'fw-count', 'aria-live': 'polite' });

  const shapeBtns = SHAPES.map((s) => h('button', {
    type: 'button', role: 'radio', class: 'fw-pick', 'aria-label': s.name, onclick: () => { shapeId = s.id; syncPicks(); },
  }, shapePreview(s.id), h('span', { class: 'fw-pick-name' }, s.name)));
  const colorBtns = COLOR_SETS.map((c) => h('button', {
    type: 'button', role: 'radio', class: 'fw-pick', 'aria-label': c.name, onclick: () => { colorsId = c.id; syncPicks(); },
  }, h('span', { class: 'fw-swatches', 'aria-hidden': 'true' }, ...c.colors.slice(0, 4).map((hex) => h('i', { style: `background:${hex}` }))),
  h('span', { class: 'fw-pick-name' }, c.name)));
  const shapeGroup = h('div', { class: 'fw-row', role: 'radiogroup', 'aria-label': COPY.shapesLabel }, ...shapeBtns);
  const colorGroup = h('div', { class: 'fw-row', role: 'radiogroup', 'aria-label': COPY.colorsLabel }, ...colorBtns);
  wireGroup(shapeGroup, () => shapeBtns);
  wireGroup(colorGroup, () => colorBtns);

  const showBtn = h('button', { type: 'button', class: 'btn btn-lg fw-show', onclick: () => playShow() }, icon('play', 22), COPY.showTime);
  const clearBtn = h('button', { type: 'button', class: 'btn btn-secondary btn-lg fw-clear', onclick: () => clear() }, icon('close', 22), COPY.clear);
  shell.body.append(stage, shapeGroup, colorGroup, h('div', { class: 'fw-actions' }, count, showBtn, clearBtn));

  function syncPicks(): void {
    shapeBtns.forEach((b, i) => {
      const on = SHAPES[i]!.id === shapeId;
      b.setAttribute('aria-checked', String(on));
      b.setAttribute('tabindex', on ? '0' : '-1');
    });
    colorBtns.forEach((b, i) => {
      const on = COLOR_SETS[i]!.id === colorsId;
      b.setAttribute('aria-checked', String(on));
      b.setAttribute('tabindex', on ? '0' : '-1');
    });
  }

  function syncShow(): void {
    count.textContent = fill(COPY.count, { n: show.length, max: MAX_FIREWORKS });
    showBtn.disabled = show.length === 0 || playing;
    clearBtn.disabled = show.length === 0 && live.length === 0;
  }

  function moveAim(): void {
    aimMark.style.left = `${(aim.x * 100).toFixed(1)}%`;
    aimMark.style.top = `${(aim.y * 100).toFixed(1)}%`;
  }

  function fit(): { w: number; h: number; dpr: number } {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, canvas.clientWidth);
    const hh = Math.max(1, canvas.clientHeight);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hh * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(hh * dpr);
    }
    return { w, h: hh, dpr };
  }

  function dot(x: number, y: number, r: number, color: string, alpha: number): void {
    if (!g || alpha <= 0) return;
    g.globalAlpha = Math.min(1, alpha);
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  function frame(now: number): void {
    raf = 0;
    if (!g) { live = []; syncShow(); return; }
    const { w, h: hh, dpr } = fit();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, hh);
    const radius = BURST_RADIUS * Math.min(w, hh * 1.6);
    live = live.filter((f) => {
      const shape = shapeById(f.fw.shape);
      const colors = colorSetById(f.fw.colors).colors;
      const el = now - f.start;
      const cx = f.fw.x * w;
      const cy = f.fw.y * hh;
      if (f.still) {
        if (el >= FADE_MS) return false;
        const fade = 1 - el / FADE_MS;
        for (const s of sparks(shape.id, colors.length)) {
          const p = sparkAt(s, STILL_AT, shape.droop);
          dot(cx + p.x * radius, cy + p.y * radius, 3, colors[s.color]!, fade);
        }
        return true;
      }
      if (el < RISE_MS) {
        const k = el / RISE_MS;
        const ease = 1 - (1 - k) * (1 - k);
        const y0 = GROUND_Y * hh;
        for (let t = 0; t < 4; t++) {
          const kk = Math.max(0, ease - t * 0.03);
          dot(cx, y0 + (cy - y0) * kk, 3 - t * 0.5, '#ffe9a8', 1 - t * 0.25);
        }
        return true;
      }
      const p = (el - RISE_MS) / shape.lifeMs;
      if (p >= 1) return false;
      for (const s of sparks(shape.id, colors.length)) {
        for (let t = 0; t < 3; t++) {
          const a = sparkAt(s, p - t * 0.03, shape.droop);
          dot(cx + a.x * radius, cy + a.y * radius, 3.2 - t, colors[s.color]!, a.alpha * (1 - t * 0.35));
        }
      }
      return true;
    });
    g.globalAlpha = 1;
    if (live.length > 0) raf = requestAnimationFrame(frame);
    else syncShow();
  }

  function launch(fw: Firework): void {
    live.push({ fw, start: performance.now(), still: !shell.full() });
    if (raf === 0) raf = requestAnimationFrame(frame);
  }

  function place(x: number, y: number): void {
    if (playing) return;
    aim = skyPoint(x, y);
    moveAim();
    const now = performance.now();
    if (now - lastLaunch < MIN_GAP_MS) return;
    if (isFull(show)) { ctx.announce(COPY.full); count.textContent = COPY.full; return; }
    lastLaunch = now;
    show = addFirework(show, { shape: shapeId, colors: colorsId, x: aim.x, y: aim.y });
    launch(show[show.length - 1]!);
    syncShow();
    ctx.announce(fill(COPY.added, { shape: shapeById(shapeId).name, n: show.length, max: MAX_FIREWORKS }));
  }

  function playShow(): void {
    if (playing || show.length === 0) return;
    playing = true;
    live = [];
    syncShow();
    ctx.announce(COPY.playing);
    showTimers = showSchedule(show).map(({ at, fw }) => shell.later(() => launch(fw), at + 300));
    showTimers.push(shell.later(() => {
      playing = false;
      showTimers = [];
      syncShow();
      ctx.announce(COPY.over);
    }, showLength(show) + 300));
  }

  function clear(): void {
    for (const t of showTimers) shell.cancel(t);
    showTimers = [];
    playing = false;
    show = emptyShow();
    live = [];
    g?.clearRect(0, 0, canvas.width, canvas.height);
    syncShow();
    ctx.announce(COPY.cleared);
  }

  stage.addEventListener('pointerdown', (e) => {
    const r = stage.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    e.preventDefault();
    place((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });
  stage.addEventListener('keydown', (e) => {
    if (e.target !== stage) return;
    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      aim = nudge(aim, e.key);
      moveAim();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      place(aim.x, aim.y);
    }
  });

  syncPicks();
  syncShow();
  moveAim();
  return {
    el: shell.root,
    destroy: () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      raf = 0;
      live = [];
      shell.destroy();
    },
  };
}
