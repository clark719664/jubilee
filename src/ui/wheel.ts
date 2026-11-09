/**
 * Year Wheel (§9 item 17): the year as a Canvas 2D ring you can spin.
 *
 *   ring        season arcs (pastel, by month) with month labels; Jan 1 starts at the top
 *   dots        one per holiday main day, filled with the theme accent, ringed with its sky
 *   marker      "you are here" star on today's day (only in the current year)
 *   pointer     a fixed notch at 12 o'clock; whatever sits under it is "selected"
 *
 * Drag or flick to spin: the wheel coasts with friction, then settles on the nearest
 * holiday and the mini card below links to it. ←/→ step holidays, Home/End jump,
 * Enter opens. Reduced motion snaps instead of coasting. The canvas is role=img with a
 * descriptive label; the year view's list is the full accessible equivalent.
 *
 * Nothing runs while idle: a rAF loop only exists between a release and the settle.
 */
import { fill, plural, t } from '../i18n/index';
import { daysInMonth } from '../dates/civil';
import type { MotionMode } from '../effects/types';
import { h } from './dom';

export interface WheelItem {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  /** Day of the year, 0-based (Jan 1 = 0). */
  readonly doy: number;
  readonly fill: string;
  readonly ring: string;
  readonly href: string;
  readonly dateText: string;
}

export interface WheelOptions {
  readonly year: number;
  readonly daysInYear: number;
  /** Sorted by doy. */
  readonly items: readonly WheelItem[];
  /** Today's 0-based day of the year when today falls in `year`. */
  readonly todayDoy: number | null;
  /** Index to start on (e.g. the next holiday from today). */
  readonly initial: number;
  readonly locale: string;
  readonly motion: () => MotionMode;
  readonly onOpen: (item: WheelItem) => void;
  readonly label: string;
}

export interface WheelInstance {
  readonly el: HTMLElement;
  destroy(): void;
}

const TAU = Math.PI * 2;

// ───────────────────────────────────────────────────────── pure geometry (tested)

/** Angle of a day on the ring (radians, 0 = Jan 1 at the top, clockwise); the day's center. */
export function dayAngle(doy: number, daysInYear: number): number {
  return ((doy + 0.5) / daysInYear) * TAU;
}

/** Wraps any angle into (−π, π]. */
export function wrapAngle(a: number): number {
  let x = a % TAU;
  if (x <= -Math.PI) x += TAU;
  if (x > Math.PI) x -= TAU;
  return x;
}

/** The item whose angle is closest to `rot` (the angle under the pointer). −1 for no items. */
export function nearestIndex(angles: readonly number[], rot: number): number {
  let best = -1;
  let bestD = Infinity;
  angles.forEach((a, i) => {
    const d = Math.abs(wrapAngle(a - rot));
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

// ───────────────────────────────────────────────────────── drawing

const SEASONS: readonly { readonly from: number; readonly to: number; readonly color: string }[] = [
  // Months are 1-based and inclusive; Winter wraps the year end, so it is two arcs.
  { from: 12, to: 12, color: '#cfe3ff' }, { from: 1, to: 2, color: '#cfe3ff' },
  { from: 3, to: 5, color: '#cdf2d4' }, { from: 6, to: 8, color: '#fff1a8' }, { from: 9, to: 11, color: '#ffd8b8' },
];

/** 0-based day of the year on which each month starts. */
export function monthStarts(year: number): number[] {
  const out: number[] = [];
  let doy = 0;
  for (let m = 1; m <= 12; m++) {
    out.push(doy);
    doy += daysInMonth(year, m);
  }
  return out;
}

function cssVar(el: Element, name: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

export function mountWheel(opts: WheelOptions): WheelInstance {
  const { items, daysInYear, year } = opts;
  const angles = items.map((it) => dayAngle(it.doy, daysInYear));
  const starts = monthStarts(year);
  const monthFmt = new Intl.DateTimeFormat(opts.locale, { month: 'short' });
  const monthNames = Array.from({ length: 12 }, (_, i) => monthFmt.format(new Date(year, i, 15, 12)));

  let selected = Math.max(0, Math.min(items.length - 1, opts.initial));
  let rot = angles[selected] ?? 0;
  let velocity = 0;
  let target: number | null = null;
  let raf = 0;
  let last = 0;
  let size = 0;

  const canvas = h('canvas', { role: 'img', 'aria-label': opts.label });
  const cardEmoji = h('span', { class: 'wheel-card-emoji emoji', 'aria-hidden': 'true' });
  const cardName = h('span', { class: 'wheel-card-name' });
  const cardDate = h('span', { class: 'wheel-card-date small muted' });
  const cardLink = h('a', { class: 'btn' }, 'Visit');
  const card = h('div', { class: 'card wheel-card', 'aria-live': 'polite', id: `wheel-card-${year}` },
    cardEmoji, h('span', { class: 'wheel-card-text' }, cardName, cardDate), cardLink);
  const stage = h('div', {
    class: 'wheel-stage', tabindex: 0,
    'aria-label': `${opts.label}. ${t('Use the left and right arrow keys to pick a holiday and Enter to open it.')}`,
    'aria-describedby': card.id,
  }, canvas);
  const el = h('div', { class: 'wheel' }, stage, card);

  const ctx2d = canvas.getContext('2d');

  function syncCard(): void {
    const it = items[selected];
    if (!it) {
      cardName.textContent = 'No holidays here';
      cardLink.hidden = true;
      return;
    }
    cardEmoji.textContent = it.emoji;
    cardName.textContent = it.name;
    cardDate.textContent = it.dateText;
    cardLink.hidden = false;
    cardLink.href = it.href;
    cardLink.setAttribute('aria-label', fill('Visit {name}', { name: it.name }));
  }

  function draw(): void {
    if (!ctx2d || size === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(size * dpr);
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    const g = ctx2d;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, size, size);
    const c = size / 2;
    const R = c - 12; // room for the "you are here" star on the rim
    const ink = cssVar(el, '--ink', '#1f1a3d');
    const card = cssVar(el, '--card', '#ffffff');
    const font = cssVar(el, '--font-display', 'system-ui, sans-serif');
    // Screen angle of a ring angle: rotate so `rot` sits at 12 o'clock.
    const scr = (a: number): number => a - rot - Math.PI / 2;

    // Disc
    g.beginPath(); g.arc(c, c, R, 0, TAU); g.fillStyle = card; g.fill();
    g.lineWidth = 3; g.strokeStyle = ink; g.stroke();

    // Season arcs (outer band) + month ticks and labels
    const bandOut = R - 3;
    const bandIn = R * 0.74;
    for (const s of SEASONS) {
      const a0 = (starts[s.from - 1]! / daysInYear) * TAU;
      const a1 = s.to === 12 ? TAU : (starts[s.to]! / daysInYear) * TAU;
      g.beginPath();
      g.arc(c, c, bandOut, scr(a0), scr(a1));
      g.arc(c, c, bandIn, scr(a1), scr(a0), true);
      g.closePath();
      g.fillStyle = s.color; g.fill();
    }
    g.strokeStyle = ink; g.lineWidth = 1.5; g.globalAlpha = 0.5;
    for (let m = 0; m < 12; m++) {
      const a = scr((starts[m]! / daysInYear) * TAU);
      g.beginPath();
      g.moveTo(c + Math.cos(a) * bandIn, c + Math.sin(a) * bandIn);
      g.lineTo(c + Math.cos(a) * bandOut, c + Math.sin(a) * bandOut);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.fillStyle = '#1f1a3d'; // season pastels are light in both schemes
    g.font = `700 ${Math.max(11, Math.round(R * 0.07))}px ${font}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const labelR = (bandIn + bandOut) / 2;
    for (let m = 0; m < 12; m++) {
      const mid = ((starts[m]! + (starts[m + 1] ?? daysInYear)) / 2 / daysInYear) * TAU;
      const a = scr(mid);
      g.fillText(monthNames[m]!, c + Math.cos(a) * labelR, c + Math.sin(a) * labelR);
    }

    // Holiday dots just inside the band; same-day holidays stack inward
    const dotR = Math.max(4, R * 0.026);
    let prevDoy = -1;
    let stack = 0;
    items.forEach((it, i) => {
      stack = it.doy === prevDoy ? stack + 1 : 0;
      prevDoy = it.doy;
      const a = scr(angles[i]!);
      const r = bandIn - dotR * 2 - stack * dotR * 2.4;
      const isSel = i === selected;
      g.beginPath();
      g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, isSel ? dotR * 1.6 : dotR, 0, TAU);
      g.fillStyle = it.fill; g.fill();
      g.lineWidth = isSel ? 3 : 2; g.strokeStyle = isSel ? ink : it.ring; g.stroke();
    });

    // You are here
    if (opts.todayDoy !== null) {
      const a = scr(dayAngle(opts.todayDoy, daysInYear));
      const r = R + 1;
      const x = c + Math.cos(a) * r;
      const y = c + Math.sin(a) * r;
      g.beginPath(); g.arc(x, y, 9, 0, TAU);
      g.fillStyle = '#ffd166'; g.fill(); g.lineWidth = 3; g.strokeStyle = ink; g.stroke();
      g.fillStyle = ink;
      g.font = `700 ${Math.max(11, Math.round(R * 0.06))}px ${font}`;
      const tr = bandIn - dotR * 7;
      g.fillText(t('You are here'), c + Math.cos(a) * tr, c + Math.sin(a) * tr);
    }

    // Pointer notch at 12 o'clock
    g.beginPath();
    g.moveTo(c - 11, 2); g.lineTo(c + 11, 2); g.lineTo(c, 22); g.closePath();
    g.fillStyle = cssVar(el, '--accent', '#d6336c'); g.fill();
    g.lineWidth = 2.5; g.strokeStyle = ink; g.stroke();

    // Center: the selected holiday, big
    const it = items[selected];
    if (it) {
      g.font = `${Math.round(R * 0.34)}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
      g.fillText(it.emoji, c, c - R * 0.06);
      g.fillStyle = ink;
      g.font = `700 ${Math.max(13, Math.round(R * 0.075))}px ${font}`;
      g.fillText(fitText(g, t(it.name), R * 1.0), c, c + R * 0.22);
    }
  }

  function fitText(g: CanvasRenderingContext2D, text: string, max: number): string {
    if (g.measureText(text).width <= max) return text;
    let t = text;
    while (t.length > 3 && g.measureText(`${t}…`).width > max) t = t.slice(0, -1);
    return `${t}…`;
  }

  // ── animation ──

  const reduced = (): boolean => opts.motion() !== 'full';

  function select(i: number, animate: boolean): void {
    if (items.length === 0) return;
    selected = ((i % items.length) + items.length) % items.length;
    syncCard();
    const goal = rot + wrapAngle(angles[selected]! - rot);
    velocity = 0;
    if (!animate || reduced()) {
      rot = goal;
      target = null;
      stop();
      draw();
    } else {
      target = goal;
      start();
    }
  }

  function frame(t: number): void {
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 1 / 60);
    last = t;
    if (target === null) {
      rot += velocity * dt;
      velocity *= Math.exp(-2.6 * dt);
      if (Math.abs(velocity) < 0.5) {
        const i = nearestIndex(angles, rot);
        if (i >= 0) { selected = i; syncCard(); target = rot + wrapAngle(angles[i]! - rot); } else velocity = 0;
      }
    } else {
      const diff = target - rot;
      rot += diff * Math.min(1, dt * 9);
      if (Math.abs(diff) < 0.0015) { rot = target; target = null; velocity = 0; draw(); raf = 0; last = 0; return; }
    }
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start(): void {
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }

  function stop(): void {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  }

  // ── input ──

  let dragging = false;
  let moved = 0;
  let prevAngle = 0;
  let prevTime = 0;

  const pointerAngle = (e: PointerEvent): number => {
    const rect = stage.getBoundingClientRect();
    return Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2));
  };

  const onDown = (e: PointerEvent): void => {
    if (items.length === 0) return;
    dragging = true;
    moved = 0;
    prevAngle = pointerAngle(e);
    prevTime = e.timeStamp;
    velocity = 0;
    target = null;
    stop();
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('is-dragging');
  };

  const onMove = (e: PointerEvent): void => {
    if (!dragging) return;
    const a = pointerAngle(e);
    const d = wrapAngle(a - prevAngle);
    const dt = Math.max(1, e.timeStamp - prevTime) / 1000;
    rot -= d;
    moved += Math.abs(d);
    velocity = 0.6 * velocity + 0.4 * (-d / dt);
    prevAngle = a;
    prevTime = e.timeStamp;
    const i = nearestIndex(angles, rot);
    if (i >= 0 && i !== selected) { selected = i; syncCard(); }
    draw();
  };

  const onUp = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    if (moved < 0.03) {
      // A tap: the center opens the selected holiday; anywhere else picks the nearest dot.
      const rect = stage.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const it = items[selected];
      if (Math.hypot(dx, dy) < rect.width * 0.22 && it) { opts.onOpen(it); return; }
      const a = Math.atan2(dy, dx) + Math.PI / 2 + rot;
      select(nearestIndex(angles, a), true);
      return;
    }
    if (reduced() || e.timeStamp - prevTime > 120) velocity = 0;
    if (reduced()) { select(nearestIndex(angles, rot), false); return; }
    start();
  };

  const onKey = (e: KeyboardEvent): void => {
    if (items.length === 0) return;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': select(selected + 1, true); break;
      case 'ArrowLeft': case 'ArrowUp': select(selected - 1, true); break;
      case 'Home': select(0, true); break;
      case 'End': select(items.length - 1, true); break;
      case 'Enter': case ' ': { const it = items[selected]; if (it) opts.onOpen(it); break; }
      default: return;
    }
    e.preventDefault();
  };

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  stage.addEventListener('keydown', onKey);

  const ro = new ResizeObserver(() => {
    const w = Math.floor(stage.clientWidth);
    if (w !== size) { size = w; draw(); }
  });
  ro.observe(stage);

  // Dark/light flips change the card and ink colors drawn into the canvas.
  const scheme = window.matchMedia('(prefers-color-scheme: dark)');
  const redraw = (): void => draw();
  scheme.addEventListener('change', redraw);
  const themeObs = new MutationObserver(redraw);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  syncCard();

  return {
    el,
    destroy() {
      stop();
      ro.disconnect();
      themeObs.disconnect();
      scheme.removeEventListener('change', redraw);
    },
  };
}

/** For the year view: a short descriptive label for the canvas. */
export function wheelLabel(year: number, count: number, todayDoy: number | null): string {
  const dots = plural(count, {
    one: 'Year wheel for {year}: the seasons in a circle with {n} holiday as colored dots.',
    other: 'Year wheel for {year}: the seasons in a circle with {n} holidays as colored dots.',
  }, { year });
  return todayDoy === null ? dots : `${dots} ${t('A star marks today.')}`;
}
