/**
 * Peekaboo Ghosts (activity id 'peekaboo') — eight little ghosts are hiding in the yard. Find them!
 *
 * Eight hiding places (a window, a tombstone, a bush, a pumpkin, a tree stump, a barrel, a door, a
 * haystack). One ghost at a time peeks out and giggles; tap where it is and it pops up, says "Peekaboo!"
 * and floats into your tray of found ghosts, each wearing something different. Tapping an empty spot
 * just says nobody is there. If a ghost waits a while, its spot starts to glow. Nothing is timed or lost;
 * finding all eight ends the round and "Play again" hides them anew. Nothing is saved.
 *
 * Keyboard: Tab through the hiding places; Enter/Space looks. A screen reader hears where each ghost peeks
 * out. Esc goes back. Made for the youngest players: big targets, no reading needed.
 * Motion: full → ghosts rise with a spring, float away when found; otherwise they appear and vanish.
 */
import { playClip } from '../../ui/voice';
import './peekaboo.css';
import { mulberry32 } from '../../effects/rng';
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { createShell, pick, shuffled } from '../spooky/kit';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { drawSpot, ghostIcon, type SpotEls } from './art';
import { EMPTY_LINES, FOUND_LINES, GHOSTS, GHOST_COUNT, PLACES, hide, isDone, newRound, tap, type Round } from './logic';

export { EMPTY_LINES, FOUND_LINES, GHOSTS, GHOST_COUNT, PLACES, hide, isDone, newRound, nextPlace, tap } from './logic';

export const COPY = {
  title: 'Peekaboo Ghosts',
  emoji: '👻',
  blurb: 'Find the hiding ghosts',
  sub: 'Eight ghosts are hiding. Can you find them all?',
  spotLabel: 'Hiding place: {place}. Look behind it.',
  peek: 'A ghost is peeking out from {place}!',
  trayLabel: 'Ghosts found: {n} of {total}',
  doneTitle: 'You found every ghost!',
  doneLine: 'All eight are giggling. Great looking!',
  again: 'Play again',
  hear: 'I hear giggling…',
} as const;

export const peekabooActivity: Activity = {
  id: 'peekaboo',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  available: (meta) => meta.id === 'halloween',
  mount: (env) => mountPeekaboo(env),
};

/** How long a ghost waits before its spot starts to glow (a gentle hint, never a penalty). */
export const HINT_MS = 7000;

function mountPeekaboo(env: PlayEnv): ActivityInstance {
  const { ctx } = env;
  const shell = createShell(env, { game: 'pb', title: COPY.title, sub: COPY.sub });
  const rand = mulberry32((Date.now() ^ 0xbb67ae85) >>> 0);
  let round: Round = newRound();
  let order: readonly number[] = shuffled(GHOSTS.map((_, i) => i), rand);
  let hideTimer: number | null = null;
  let hintTimer: number | null = null;
  let sayTimer: number | null = null;

  // ── the yard ──
  const spots: { readonly el: HTMLButtonElement; readonly art: SpotEls }[] = PLACES.map((p, i) => {
    const art = drawSpot(p.id, 'plain');
    const el = h('button', { type: 'button', class: `pb-spot pb-spot-${p.id}`, 'aria-label': COPY.spotLabel.replace('{place}', p.name), onclick: () => look(i) }, art.svg);
    return { el, art };
  });
  const yard = h('div', { class: 'pb-yard' }, ...spots.map((s) => h('div', { class: 'pb-cell' }, s.el)));
  const tray = h('ol', { class: 'pb-tray', role: 'img', 'aria-label': '' });
  const say = h('p', { class: 'sp-say pb-say', 'aria-hidden': 'true' });
  shell.body.append(h('div', { class: 'pb-layout' }, yard, tray), say);

  function speak(text: string, announce = true): void {
    if (playClip(text)) return;
    say.textContent = text;
    say.classList.add('is-on');
    shell.cancel(sayTimer);
    sayTimer = shell.later(() => say.classList.remove('is-on'), 2300);
    if (announce) ctx.announce(text);
  }

  function renderTray(): void {
    tray.setAttribute('aria-label', COPY.trayLabel.replace('{n}', String(round.found)).replace('{total}', String(GHOST_COUNT)));
    tray.replaceChildren(...Array.from({ length: GHOST_COUNT }, (_, k) => h('li', { class: `pb-slot${k < round.found ? ' is-found' : ''}` },
      ghostIcon(GHOSTS[order[k]!]!.id, k < round.found))));
  }

  /** Dress the ghost that will peek from spot `i` in whatever the next find wears. */
  function dress(i: number): void {
    const hat = GHOSTS[order[round.found]!]!.id;
    const fresh = drawSpot(PLACES[i]!.id, hat);
    spots[i]!.el.replaceChildren(fresh.svg);
    spots[i] = { el: spots[i]!.el, art: fresh };
  }

  function startHide(): void {
    shell.cancel(hideTimer);
    hideTimer = shell.later(() => {
      round = hide(round, rand);
      if (round.at === null) return;
      const i = round.at;
      dress(i);
      const s = spots[i]!;
      void s.el.getBoundingClientRect();
      s.el.classList.add('has-ghost');
      ctx.announce(COPY.peek.replace('{place}', PLACES[i]!.name));
      shell.cancel(hintTimer);
      hintTimer = shell.later(() => { s.el.classList.add('is-hint'); speak(COPY.hear, false); }, HINT_MS);
    }, shell.full() ? 800 : 300);
  }

  function look(i: number): void {
    const { round: next, hit } = tap(round, i);
    const s = spots[i]!;
    if (!hit) {
      if (shell.full()) {
        s.el.classList.remove('is-shake');
        void s.el.offsetWidth;
        s.el.classList.add('is-shake');
        shell.later(() => s.el.classList.remove('is-shake'), 500);
      }
      speak(pick(EMPTY_LINES, rand).replace('{place}', PLACES[i]!.name));
      return;
    }
    round = next;
    shell.cancel(hintTimer);
    s.el.classList.remove('is-hint');
    s.el.classList.add('is-found');
    renderTray();
    speak(pick(FOUND_LINES, rand));
    shell.later(() => { s.el.classList.remove('has-ghost', 'is-found'); }, shell.full() ? 700 : 400);
    if (isDone(round)) shell.later(finish, shell.full() ? 1100 : 600);
    else startHide();
  }

  function finish(): void {
    const again = h('button', { type: 'button', class: 'btn btn-lg', onclick: () => { d.close(); restart(); } }, icon('shuffle', 22), COPY.again);
    const row = h('div', { class: 'pb-done-row', 'aria-hidden': 'true' }, ...order.map((k) => ghostIcon(GHOSTS[k]!.id, true)));
    const d = shell.dialog(COPY.doneTitle, [row, h('p', { class: 'pb-done-line' }, COPY.doneLine), h('div', { class: 'sp-dlg-actions' }, again)], () => again.isConnected && restart());
    ctx.announce(COPY.doneTitle);
  }

  function restart(): void {
    round = newRound();
    order = shuffled(GHOSTS.map((_, i) => i), rand);
    for (const s of spots) s.el.classList.remove('has-ghost', 'is-hint', 'is-found');
    renderTray();
    startHide();
  }

  renderTray();
  startHide();
  return { el: shell.root, destroy: () => shell.destroy() };
}
