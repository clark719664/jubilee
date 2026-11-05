/**
 * The Christmas advent strip (1–24 December): today's and earlier doors open to a fact, a joke or a tiny craft
 * (remembered via `store.openAdvent`); later doors shake and say "Not yet! N more sleeps" — no shake when motion
 * is calm. A horizontal strip on phones, a grid on wider screens; the opened door's text shows underneath.
 */
import type { AppContext } from '../app/context';
import type { AdventDoor } from '../content/types';
import type { CivilDate } from '../dates/civil';
import { fmt } from './copy';
import { h } from './dom';
import { adventKey, doorState, sleepsUntilDoor, type DoorState } from './sections';

const KIND_EMOJI: Record<AdventDoor['kind'], string> = { fact: '💡', joke: '😂', craft: '✂️' };
const KIND_LABEL: Record<AdventDoor['kind'], string> = { fact: 'A fact', joke: 'A joke', craft: 'A tiny craft' };

function doorLabel(day: number, state: DoorState, isToday: boolean): string {
  const base = fmt('adventDoor', { day });
  if (state === 'locked') return `${base}, not yet`;
  if (state === 'opened') return `${base}, open`;
  return isToday ? `${base}, open it today!` : `${base}, ready to open`;
}

export function adventStrip(ctx: AppContext, doors: readonly AdventDoor[], today: CivilDate): HTMLElement {
  const byDay = new Map(doors.map((d) => [d.day, d] as const));
  const peek = h('div', { class: 'door-peek', id: 'advent-peek', role: 'status', 'aria-live': 'polite' },
    h('p', { class: 'muted' }, 'Tap today’s door to open it!'));
  const buttons: HTMLButtonElement[] = [];

  const show = (door: AdventDoor): void => {
    peek.replaceChildren(
      h('p', { class: 'door-peek-kind' }, h('span', { 'aria-hidden': 'true' }, KIND_EMOJI[door.kind], ' '), `${fmt('adventDoor', { day: door.day })} · ${KIND_LABEL[door.kind]}`),
      h('p', { class: 'door-peek-text' }, door.text),
    );
  };

  const paint = (btn: HTMLButtonElement, day: number): void => {
    const state = doorState(day, today, ctx.store.progress.adventOpened);
    const door = byDay.get(day);
    btn.className = `door${state === 'opened' ? ' is-open' : state === 'locked' ? ' is-locked' : ''}${day === today.d ? ' is-today' : ''}`;
    btn.setAttribute('aria-label', doorLabel(day, state, day === today.d));
    btn.replaceChildren(state === 'opened' && door
      ? h('span', { class: 'door-emoji', 'aria-hidden': 'true' }, KIND_EMOJI[door.kind])
      : h('span', { 'aria-hidden': 'true' }, String(day)));
  };

  for (let day = 1; day <= 24; day++) {
    const btn = h('button', { type: 'button', class: 'door', 'aria-controls': 'advent-peek' });
    btn.addEventListener('click', () => {
      const state = doorState(day, today, ctx.store.progress.adventOpened);
      const door = byDay.get(day);
      if (state === 'locked') {
        const n = sleepsUntilDoor(day, today);
        peek.replaceChildren(h('p', { class: 'door-peek-text' }, h('span', { 'aria-hidden': 'true' }, '🤫 '), fmt('notYet', { n })));
        if (ctx.motion === 'full') {
          btn.classList.remove('is-shaking');
          void btn.offsetWidth; // restart the shake
          btn.classList.add('is-shaking');
        }
        return;
      }
      if (state === 'ready') ctx.store.openAdvent(today.y, day);
      paint(btn, day);
      if (door) show(door);
    });
    btn.addEventListener('animationend', () => btn.classList.remove('is-shaking'));
    paint(btn, day);
    buttons.push(btn);
  }

  // Today's door, if already opened earlier, shows its text straight away.
  const todays = byDay.get(today.d);
  if (todays && ctx.store.progress.adventOpened[adventKey(today.y, today.d)]) show(todays);

  const strip = h('div', { class: 'advent advent-strip', role: 'group', 'aria-label': 'Advent calendar doors' }, ...buttons);
  // On phones the strip scrolls sideways: bring today's door to the middle once the page is laid out.
  window.setTimeout(() => {
    const door = buttons[today.d - 1];
    if (!door || strip.scrollWidth <= strip.clientWidth) return;
    const d = door.getBoundingClientRect();
    const s = strip.getBoundingClientRect();
    strip.scrollLeft += d.left - s.left - (s.width - d.width) / 2;
  }, 0);
  return h('div', { class: 'advent-wrap' }, strip, peek);
}
