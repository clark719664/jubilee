/**
 * stage.ts — big Jubi on a little podium: idle bob and blink (mascot.ts CSS), eyes that follow the
 * child's finger, a speech bubble, and the "put it on" moment (the item drops, swings or pops in, Jubi
 * squashes happily and sparkles fly). Motion 'full' only; otherwise items simply fade in and Jubi
 * holds still. Nothing here flashes: every effect is a single short movement.
 */
import type { MotionMode } from '../../effects/types';
import { h, svg } from '../../ui/dom';
import { mascot, spin, type MascotState } from '../../ui/mascot';
import { twinkleD, GRIP, INK } from './art-kit';
import type { Slot } from './catalog';
import { dressMascot, DRESS_VIEWBOX } from './dress';
import type { Outfit } from './outfit';

const SPRING = 'cubic-bezier(.2,.8,.2,1)';
/** Where Jubi's eyes sit inside DRESS_VIEWBOX (-14 -18 128 128), as fractions of the box. */
const EYES = { x: (50 + 14) / 128, y: (52 + 18) / 128 };

export interface Stage {
  readonly el: HTMLElement;
  readonly jubi: HTMLButtonElement;
  dress(outfit: Outfit, changed?: Slot | null): void;
  say(text: string): void;
  /** Change face for a while ('excited' after putting something on), then back to curious. */
  mood(state: MascotState, ms?: number): void;
  wiggle(): void;
  lookAt(x: number, y: number): void;
  destroy(): void;
}

export interface StageOptions {
  readonly label: string;
  readonly motion: () => MotionMode;
  readonly sparkleColors: readonly string[];
  readonly onTap: () => void;
}

export function createStage(opts: StageOptions): Stage {
  const full = (): boolean => opts.motion() === 'full';
  const wrap = h('div', { class: 'dz-jubi-wrap' });
  const jubi = h('button', { type: 'button', class: 'dz-jubi', 'aria-label': opts.label, onclick: () => opts.onTap() }, wrap);
  const bubble = h('p', { class: 'dz-say', 'aria-hidden': 'true' });
  const fx = h('div', { class: 'dz-fx', 'aria-hidden': 'true' });
  const podium = h('div', { class: 'dz-podium', 'aria-hidden': 'true' });
  const el = h('div', { class: 'dz-stage' }, h('div', { class: 'dz-spot', 'aria-hidden': 'true' }), podium, jubi, bubble, fx);

  let state: MascotState = 'curious';
  let outfit: Outfit = {};
  let art: SVGSVGElement = build();
  let look: SVGGElement | null = null;
  let moodTimer = 0;
  let sayTimer = 0;
  let lookTimer = 0;
  wrapEyes();

  function build(): SVGSVGElement {
    const s = mascot(state, 300);
    s.setAttribute('viewBox', DRESS_VIEWBOX);
    s.setAttribute('aria-hidden', 'true');
    s.removeAttribute('role');
    s.removeAttribute('width');
    s.removeAttribute('height');
    s.classList.add('dz-jubi-art');
    dressMascot(s, outfit);
    wrap.replaceChildren(s);
    return s;
  }

  /** Eyes go in their own group so they can glance without fighting the blink animation. */
  function wrapEyes(): void {
    const eyes = art.querySelectorAll('.jubi-eye');
    if (eyes.length === 0) { look = null; return; }
    look = svg('g', { class: 'dz-look' });
    eyes[0]!.before(look);
    look.append(...eyes);
  }

  function animateIn(slot: Slot): void {
    const target = slot === 'glow' || slot === 'pattern'
      ? art.querySelector<SVGGElement>(`[data-dz="${slot}"]`)
      : art.querySelector<SVGGElement>(`.dz-slot[data-slot="${slot}"]`);
    if (!target || typeof target.animate !== 'function' || opts.motion() === 'off') return;
    if (!full()) {
      target.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      return;
    }
    const st = target.style;
    let frames: Keyframe[];
    if (slot === 'hat') {
      st.transformBox = 'fill-box'; st.transformOrigin = '50% 100%';
      frames = [{ transform: 'translateY(-34px) rotate(-10deg)', opacity: 0 }, { transform: 'translateY(2px) scale(1.08,.88)', opacity: 1, offset: 0.55 }, { transform: 'translateY(-2px) scale(.97,1.05)', offset: 0.78 }, { transform: 'none' }];
    } else if (slot === 'glasses') {
      st.transformBox = 'fill-box'; st.transformOrigin = '50% 50%';
      frames = [{ transform: 'translateY(-14px) scale(.7)', opacity: 0 }, { transform: 'translateY(1px) scale(1.06)', opacity: 1, offset: 0.6 }, { transform: 'none' }];
    } else if (slot === 'held') {
      st.transformBox = 'view-box'; st.transformOrigin = `${GRIP.x}px ${GRIP.y}px`;
      frames = [{ transform: 'rotate(-55deg) scale(.4)', opacity: 0 }, { transform: 'rotate(12deg) scale(1.06)', opacity: 1, offset: 0.55 }, { transform: 'rotate(-5deg)', offset: 0.8 }, { transform: 'none' }];
    } else if (slot === 'neck') {
      st.transformBox = 'fill-box'; st.transformOrigin = '50% 30%';
      frames = [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: 0.6 }, { transform: 'none' }];
    } else {
      st.transformBox = 'fill-box'; st.transformOrigin = '50% 50%';
      frames = [{ transform: 'scale(.7)', opacity: 0 }, { transform: 'scale(1.04)', opacity: 1, offset: 0.6 }, { transform: 'none' }];
    }
    target.animate(frames, { duration: 560, easing: SPRING });
    // Jubi's happy squash, and sparkles where the thing landed.
    wrap.animate([{ transform: 'none' }, { transform: 'scale(1.07,.93)', offset: 0.35 }, { transform: 'scale(.97,1.04)', offset: 0.65 }, { transform: 'none' }], { duration: 480, delay: 160, easing: 'ease-out' });
    const r = target.getBoundingClientRect();
    const o = el.getBoundingClientRect();
    if (r.width > 0) sparkle(r.left - o.left + r.width / 2, r.top - o.top + r.height / 2, Math.max(r.width, r.height) / 2);
  }

  function sparkle(x: number, y: number, spread: number): void {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      const dist = spread * 0.7 + 26 + Math.random() * 22;
      const s = 7 + Math.random() * 7;
      const col = opts.sparkleColors[i % opts.sparkleColors.length] ?? '#fff';
      const star = svg('svg', { viewBox: '-10 -10 20 20', width: s * 2, height: s * 2, class: 'dz-spark' });
      star.append(svg('path', { d: twinkleD(0, 0, 9), fill: col, stroke: INK, 'stroke-width': 1.4 }));
      star.style.left = `${x - s}px`;
      star.style.top = `${y - s}px`;
      fx.append(star);
      const dx = Math.cos(a) * dist;
      const dy = Math.sin(a) * dist;
      star.animate([
        { transform: 'translate(0,0) scale(.2) rotate(0)', opacity: 0 },
        { transform: `translate(${dx * 0.7}px,${dy * 0.7}px) scale(1.1) rotate(60deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px,${dy}px) scale(.3) rotate(110deg)`, opacity: 0 },
      ], { duration: 720, delay: 120 + i * 18, easing: 'ease-out', fill: 'both' }).onfinish = () => star.remove();
    }
  }

  const stage: Stage = {
    el,
    jubi,
    dress(next, changed = null) {
      outfit = next;
      dressMascot(art, outfit);
      if (changed) animateIn(changed);
    },
    say(text) {
      window.clearTimeout(sayTimer);
      bubble.textContent = text;
      bubble.classList.remove('is-on');
      void bubble.offsetWidth;
      bubble.classList.add('is-on');
      sayTimer = window.setTimeout(() => bubble.classList.remove('is-on'), 2600);
    },
    mood(next, ms = 1500) {
      window.clearTimeout(moodTimer);
      if (next !== state) {
        state = next;
        art = build();
        wrapEyes();
      }
      if (next !== 'curious') moodTimer = window.setTimeout(() => stage.mood('curious'), ms);
    },
    wiggle() {
      if (full()) spin(art);
    },
    lookAt(x, y) {
      if (!look || !full()) return;
      const r = art.getBoundingClientRect();
      if (r.width === 0) return;
      const dx = x - (r.left + r.width * EYES.x);
      const dy = y - (r.top + r.height * EYES.y);
      const len = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, len / (r.width * 0.9));
      look.style.transform = `translate(${((dx / len) * 2.2 * k).toFixed(2)}px,${((dy / len) * 1.7 * k).toFixed(2)}px)`;
      window.clearTimeout(lookTimer);
      lookTimer = window.setTimeout(() => { if (look) look.style.transform = ''; }, 2600);
    },
    destroy() {
      window.clearTimeout(moodTimer);
      window.clearTimeout(sayTimer);
      window.clearTimeout(lookTimer);
    },
  };
  return stage;
}
