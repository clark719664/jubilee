/**
 * Trick-or-Treat Street (activity id 'treats') — knock on six doors and see who answers.
 *
 * Six little houses, numbered 1–6. Tap one: "Knock knock!", the door swings open and a friendly
 * ghost, witch, cat, bat, mummy or pumpkin kid offers two treats. Pick one and it drops into the pumpkin
 * pail. "Count my treats" tallies the pail by kind (a counting game for the youngest) and can tip it out.
 * Nothing is timed, scored against the child or locked; the pail never fills up for good, and nothing
 * is saved (it's a game of the moment).
 *
 * Keyboard: Tab to a house, Enter/Space knocks; the visitor's dialog traps focus, Tab picks a treat, Esc
 * says "maybe next time" and closes the door. Esc on the street goes back.
 * Motion: full → the door swings, the treat hops into the pail, the pail wobbles; otherwise the door is
 * simply open and the count changes.
 */
import { playClip } from '../../ui/voice';
import './treats.css';
import { mulberry32 } from '../../effects/rng';
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { createShell } from '../spooky/kit';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { drawHouse, drawPail, drawVisitor, LOOKS } from './art';
import { HOUSES, addToBag, bagSummary, bagTotal, countLine, milestone, pickOffer, pickVisitor, type Bag, type Treat } from './logic';

export { HOUSES, TREATS, VISITORS, addToBag, bagSummary, bagTotal, countLine, milestone, pickOffer, pickVisitor } from './logic';

export const COPY = {
  title: 'Trick-or-Treat Street',
  emoji: '🏘️',
  blurb: 'Knock on doors, collect treats',
  sub: 'Knock on a door and say “Trick or treat!”',
  knock: 'Knock knock!',
  houseLabel: 'House {n}. Knock on the door.',
  pick: 'Pick a treat for your pail',
  skip: 'Maybe next time!',
  count: 'Count my treats',
  empty: 'Tip out the pail',
  keep: 'Keep collecting',
  countTitle: 'Your treats',
  pailLabel: 'Your treat pail',
  added: '{name} in the pail! {line}',
} as const;

export const treatsActivity: Activity = {
  id: 'treats',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  available: (meta) => meta.id === 'halloween',
  mount: (env) => mountTreats(env),
};

function mountTreats(env: PlayEnv): ActivityInstance {
  const { ctx } = env;
  const shell = createShell(env, { game: 'tt', title: COPY.title, sub: COPY.sub });
  const rand = mulberry32((Date.now() ^ 0x2545f491) >>> 0);
  let bag: Bag = {};
  let lastVisitor: string | null = null;

  const street = h('div', { class: 'tt-street' });
  const houses: HTMLButtonElement[] = [];
  const renderHouse = (i: number, open: boolean): void => {
    houses[i]!.replaceChildren(drawHouse(i + 1, LOOKS[i % LOOKS.length]!, open));
  };
  for (let i = 0; i < HOUSES; i++) {
    const b = h('button', { type: 'button', class: 'tt-house', 'aria-label': COPY.houseLabel.replace('{n}', String(i + 1)), onclick: () => knock(i) });
    houses.push(b);
    street.append(h('div', { class: 'tt-lot' }, b));
    renderHouse(i, false);
  }

  const total = h('span', { class: 'tt-total' }, '0');
  const pail = h('div', { class: 'tt-pail', role: 'img', 'aria-label': COPY.pailLabel }, drawPail(), total);
  const treatRow = h('div', { class: 'tt-treats', 'aria-hidden': 'true' });
  const countBtn = h('button', { type: 'button', class: 'btn btn-lg', onclick: () => showCount() }, icon('sparkle', 22), COPY.count);
  const bar = h('div', { class: 'tt-bar' }, pail, treatRow, countBtn);
  const say = h('p', { class: 'sp-say tt-say', 'aria-hidden': 'true' });
  shell.body.append(h('div', { class: 'tt-layout' }, street, bar), say);

  let sayTimer: number | null = null;
  function speak(text: string): void {
    if (playClip(text)) return;
    say.textContent = text;
    say.classList.add('is-on');
    shell.cancel(sayTimer);
    sayTimer = shell.later(() => say.classList.remove('is-on'), 2600);
    ctx.announce(text);
  }

  function renderBag(): void {
    const n = bagTotal(bag);
    total.textContent = String(n);
    const emojis: string[] = [];
    for (const { treat, count } of bagSummary(bag)) for (let k = 0; k < count; k++) emojis.push(treat.emoji);
    const bits = emojis.slice(-14).map((e) => h('span', { class: 'emoji tt-bit' }, e));
    if (emojis.length > 14) bits.push(h('span', { class: 'tt-more' }, `+${emojis.length - 14}`));
    treatRow.replaceChildren(...bits);
    countBtn.disabled = n === 0;
  }

  function knock(i: number): void {
    const visitor = pickVisitor(rand, lastVisitor);
    lastVisitor = visitor.id;
    const [a, b] = pickOffer(rand);
    const house = houses[i]!;
    house.classList.add('is-knocking');
    ctx.announce(COPY.knock);
    const open = (): void => {
      house.classList.remove('is-knocking');
      renderHouse(i, true);
      const choose = (t: Treat): void => {
        d.close();
        bag = addToBag(bag, t.id);
        renderBag();
        pail.classList.remove('is-wobble');
        if (shell.full()) {
          void pail.offsetWidth;
          pail.classList.add('is-wobble');
          shell.later(() => pail.classList.remove('is-wobble'), 600);
        }
        const n = bagTotal(bag);
        speak(milestone(n) ?? `${visitor.thanks}`);
        ctx.announce(COPY.added.replace('{name}', t.name).replace('{line}', countLine(n)));
      };
      const treatBtn = (t: Treat): HTMLElement => h('button', { type: 'button', class: 'tt-treat', 'aria-label': t.name, onclick: () => choose(t) },
        h('span', { class: 'emoji tt-treat-emoji', 'aria-hidden': 'true' }, t.emoji), h('span', { class: 'tt-treat-name' }, t.name));
      const d = shell.dialog(`House ${i + 1}`, [
        h('div', { class: 'tt-visitor' }, drawVisitor(visitor.id)),
        h('p', { class: 'tt-line' }, visitor.line),
        h('p', { class: 'tt-pick' }, COPY.pick),
        h('div', { class: 'tt-offer' }, treatBtn(a), treatBtn(b)),
        h('button', { type: 'button', class: 'btn btn-ghost tt-skip', onclick: () => d.close() }, COPY.skip),
      ], () => { shell.later(() => renderHouse(i, false), shell.full() ? 500 : 0); house.focus({ preventScroll: true }); });
      ctx.announce(`${visitor.name} opens the door. ${visitor.line}`);
    };
    if (shell.full()) shell.later(open, 600); else open();
  }

  function showCount(): void {
    const n = bagTotal(bag);
    const rows = bagSummary(bag).map(({ treat, count }) => h('li', { class: 'tt-tally-row' },
      h('span', { class: 'emoji tt-tally-emoji', 'aria-hidden': 'true' }, treat.emoji), h('span', { class: 'tt-tally-name' }, treat.name),
      h('span', { class: 'tt-tally-dots', 'aria-hidden': 'true' }, ...Array.from({ length: Math.min(count, 12) }, () => h('i', {}))), h('b', { class: 'tt-tally-n' }, String(count))));
    const d = shell.dialog(COPY.countTitle, [
      h('p', { class: 'tt-count-line' }, countLine(n)),
      h('ul', { class: 'tt-tally' }, ...rows),
      h('div', { class: 'sp-dlg-actions' },
        h('button', { type: 'button', class: 'btn btn-lg', onclick: () => d.close() }, COPY.keep),
        h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => { bag = {}; renderBag(); d.close(); speak('All tipped out! Ready for more?'); } }, COPY.empty)),
    ], () => countBtn.focus({ preventScroll: true }));
    ctx.announce(`${countLine(n)} ${bagSummary(bag).map((r) => `${r.count} ${r.treat.name}`).join(', ')}`);
  }

  renderBag();
  return { el: shell.root, destroy: () => shell.destroy() };
}
