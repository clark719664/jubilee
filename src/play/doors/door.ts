/**
 * doors/door.ts — one door button, shared by the full board and the holiday-page strip.
 *
 *   button.dr-door[data-state][data-kind][data-tone]
 *     span.dr-deco      skin extras (the lantern string's swag)
 *     span.dr-frame     the opening, with what is inside (glow, diya, prize emoji)
 *     span.dr-leaf      the door itself: swings on a CSS 3D hinge (reduced motion: fades)
 *     span.dr-base      eggs only: the bottom half of the shell, which stays
 *     span.dr-badge     "Today!" ribbon or the star for a door opened last time
 */
import { h } from '../../ui/dom';
import { insideArt } from './boards';
import { plural } from '../../i18n/index';
import { COPY, COUNTS, KIND_EMOJI, KIND_NAME, fill } from './copy';
import type { BoardDoor, DoorView, Skin } from './logic';

export function makeDoor(door: BoardDoor, skin: Skin, index: number): HTMLButtonElement {
  const inside = insideArt(skin);
  return h('button', { type: 'button', class: 'dr-door', 'data-kind': door.kind, 'data-tone': String(index % 4), 'data-n': String(door.n) },
    h('span', { class: 'dr-deco', 'aria-hidden': 'true' }),
    h('span', { class: 'dr-frame', 'aria-hidden': 'true' },
      h('span', { class: 'dr-glow' }),
      inside,
      h('span', { class: 'dr-prize emoji' }, KIND_EMOJI[door.kind])),
    h('span', { class: 'dr-leaf', 'aria-hidden': 'true' }, h('span', { class: 'dr-num' }, String(door.n))),
    skin === 'eggs' ? h('span', { class: 'dr-base', 'aria-hidden': 'true' }, h('span', { class: 'dr-num' }, String(door.n))) : null,
    h('span', { class: 'dr-badge', 'aria-hidden': 'true' }),
  );
}

export function doorLabel(door: BoardDoor, v: DoorView): string {
  const vars = { n: door.n, w: v.wait, kind: KIND_NAME[door.kind] };
  if (v.state === 'locked') {
    if (v.fromLastTime) return fill(COPY.labelStar, vars);
    if (v.wait <= 0) return `${fill(COPY.doorLabel, vars)}. ${COPY.shut}`;
    return v.wait === 1 ? fill(COPY.labelLockedOne, vars) : plural(v.wait, COUNTS.labelLocked, { door: door.n });
  }
  if (v.state === 'today') return fill(COPY.labelToday, vars);
  if (v.state === 'ready') return fill(COPY.labelReady, vars);
  return fill(COPY.labelOpened, vars);
}

/** Reflects a door's state on its button (classes drive every visual; no layout is rebuilt). */
export function paintDoor(btn: HTMLButtonElement, door: BoardDoor, v: DoorView): void {
  btn.dataset.state = v.state;
  btn.classList.toggle('is-star', v.fromLastTime);
  btn.setAttribute('aria-label', doorLabel(door, v));
  const badge = btn.querySelector<HTMLElement>('.dr-badge');
  if (badge) badge.textContent = v.state === 'today' ? COPY.today : v.state === 'ready' ? '✦' : v.fromLastTime ? '★' : '';
}

/** "Not yet!" wiggle. No wiggle unless motion is full; the bubble text still appears. */
export function wiggle(btn: HTMLElement, motionFull: boolean): void {
  if (!motionFull) return;
  btn.classList.remove('is-wiggling');
  void btn.offsetWidth; // restart the animation
  btn.classList.add('is-wiggling');
  btn.addEventListener('animationend', () => btn.classList.remove('is-wiggling'), { once: true });
}

/** A handful of sparkles flying out of a door that was just opened for the first time (full motion only). */
export function sparkleBurst(host: HTMLElement, from: HTMLElement): void {
  const hb = host.getBoundingClientRect();
  const fb = from.getBoundingClientRect();
  const cx = fb.left - hb.left + fb.width / 2;
  const cy = fb.top - hb.top + fb.height / 2;
  const glyphs = ['✦', '★', '●', '✦', '♥', '●'];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + (i % 2) * 0.2;
    const dist = 46 + (i % 3) * 18;
    const s = h('span', {
      class: 'dr-spark', 'aria-hidden': 'true', 'data-tone': String(i % 3),
      style: `left:${cx.toFixed(0)}px;top:${cy.toFixed(0)}px;--dx:${(Math.cos(a) * dist).toFixed(0)}px;--dy:${(Math.sin(a) * dist).toFixed(0)}px;--d:${i * 12}ms`,
    }, glyphs[i % glyphs.length]!);
    s.addEventListener('animationend', () => s.remove(), { once: true });
    host.appendChild(s);
  }
}
