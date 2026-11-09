/**
 * Spin the Dreidel (activity id 'dreidel') — the real game, played against Jubi. Both start with 10
 * chocolate coins and add one to the pot each round. Nun: nothing. Gimel: take the whole pot. Hei: take
 * half (rounded up). Shin: put one in. Jubi spins by itself after you. When someone runs out of coins the
 * game ends kindly and "Play again" starts fresh; nothing is timed, judged or saved.
 *
 * Keyboard: Tab to Spin; Space or Enter spins. Esc goes back. Motion: full → the dreidel wobbles for about
 * a second; otherwise the letter just shows. Nothing flashes.
 */
import './dreidel.css';
import { mulberry32 } from '../../effects/rng';
import { plural } from '../../i18n/index';
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { createShell, fill } from '../spooky/kit';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { drawDreidel } from './art';
import { ante, isOver, newGame, play, spinLetter, type Game, type Letter, type Who } from './logic';

export { LETTERS, START_COINS, ante, isOver, newGame, play, potShare, spinLetter } from './logic';

export const COPY = {
  title: 'Spin the Dreidel',
  emoji: '🪙',
  blurb: 'Spin for chocolate coins',
  sub: 'Play with Jubi. Win the pot!',
  you: 'You',
  jubi: 'Jubi',
  pot: 'Pot',
  scoreLabel: 'You have {you}. Jubi has {jubi}. The pot has {pot}.',
  spin: 'Spin',
  spinning: 'Spinning…',
  start: 'Tap Spin to start!',
  yourTurn: 'Your turn. Tap Spin!',
  jubiSpins: 'Jubi is spinning…',
  refill: 'The pot is empty, so you and Jubi each add a coin.',
  spun: '{who} spun {name}',
  means: {
    nun: 'Nothing happens. Pass it along!',
    gimel: 'Take the whole pot!',
    hei: 'Take half the pot. If it is odd, you get the extra coin.',
    shin: 'Put one coin in the pot.',
  },
  result: {
    you: {
      nun: 'Nothing happens this time.',
      gimel: 'You take the whole pot: {n}!',
      hei: 'You take half the pot: {n}!',
      shin: 'You put 1 coin in the pot.',
    },
    jubi: {
      nun: 'Nothing happens for Jubi.',
      gimel: 'Jubi takes the whole pot: {n}!',
      hei: 'Jubi takes half the pot: {n}!',
      shin: 'Jubi puts 1 coin in the pot.',
    },
  },
  help: 'How to play',
  helpTitle: 'How to play',
  helpRules: [
    'You and Jubi each start with 10 chocolate coins.',
    'Every round, you each put 1 coin in the pot.',
    'Tap Spin. The dreidel lands on a letter.',
    'Nun: nothing happens. Gimel: take the whole pot. Hei: take half the pot. Shin: put 1 coin in.',
    'The game ends when someone runs out of coins.',
  ],
  gotIt: 'Got it',
  endYouTitle: 'You ran out of coins!',
  endYou: 'Great game! Jubi has the coins this time. Want to play again?',
  endJubiTitle: 'Jubi ran out of coins!',
  endJubi: 'You have the coins. Great spinning! Want to play again?',
  again: 'Play again',
} as const;

export const dreidelActivity: Activity = {
  id: 'dreidel',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  available: (meta) => meta.id === 'hanukkah',
  mount: (env) => mountDreidel(env),
};

export const SPIN_MS = 1300;
export const PAUSE_MS = 1700;

const coinWord = (n: number): string => plural(n, { one: '{n} coin', other: '{n} coins' });

function mountDreidel(env: PlayEnv): ActivityInstance {
  const { ctx } = env;
  const shell = createShell(env, { game: 'dd', title: COPY.title, sub: COPY.sub });
  const rand = mulberry32((Date.now() ^ 0x510e527f) >>> 0);
  let game: Game = newGame();
  let busy = false;

  const helpBtn = h('button', { type: 'button', class: 'btn btn-secondary btn-icon', 'aria-label': COPY.help, onclick: () => showHelp() }, icon('info', 22));
  shell.tools.append(helpBtn);

  const cells = { you: h('span', { class: 'dd-coins' }), pot: h('span', { class: 'dd-coins' }), jubi: h('span', { class: 'dd-coins' }) };
  const cellEl = (key: 'you' | 'pot' | 'jubi', label: string): HTMLElement =>
    h('li', { class: `dd-cell dd-cell-${key}` }, h('span', { class: 'dd-who' }, label), cells[key]);
  const score = h('ul', { class: 'dd-score', role: 'group' }, cellEl('you', COPY.you), cellEl('pot', COPY.pot), cellEl('jubi', COPY.jubi));

  const art = drawDreidel();
  const stage = h('div', { class: 'dd-stage' }, art.svg);

  const letterEl = h('span', { class: 'dd-letter', lang: 'he', dir: 'rtl', 'aria-hidden': 'true' });
  const nameEl = h('p', { class: 'dd-name' });
  const meansEl = h('p', { class: 'dd-means' });
  const lineEl = h('p', { class: 'dd-line' });
  const result = h('div', { class: 'dd-result', hidden: true }, letterEl, nameEl, meansEl, lineEl);

  const status = h('p', { class: 'dd-status' }, COPY.start);
  const spinBtn = h('button', { type: 'button', class: 'btn btn-lg dd-spin', onclick: () => spin() }, COPY.spin);
  shell.body.append(h('div', { class: 'dd-layout' }, score, stage, result, status, spinBtn));

  function renderScore(turn: Who | null): void {
    cells.you.textContent = `🪙 ${game.you}`;
    cells.pot.textContent = `🪙 ${game.pot}`;
    cells.jubi.textContent = `🪙 ${game.jubi}`;
    score.setAttribute('aria-label', fill(COPY.scoreLabel, { you: game.you, jubi: game.jubi, pot: game.pot }));
    score.querySelector('.dd-cell-you')?.classList.toggle('is-turn', turn === 'you');
    score.querySelector('.dd-cell-jubi')?.classList.toggle('is-turn', turn === 'jubi');
  }

  function say(text: string): void {
    status.textContent = text;
    ctx.announce(text);
  }

  function setBusy(on: boolean): void {
    busy = on;
    spinBtn.disabled = on;
    spinBtn.textContent = on ? COPY.spinning : COPY.spin;
  }

  function reveal(who: Who, letter: Letter, next: () => void): void {
    const turn = play(game, who, letter.id);
    game = turn.game;
    art.svg.classList.remove('is-spinning');
    art.face(letter.glyph);
    letterEl.textContent = letter.glyph;
    nameEl.textContent = fill(COPY.spun, { who: who === 'you' ? COPY.you : COPY.jubi, name: letter.name });
    meansEl.textContent = COPY.means[letter.id];
    const line = fill(COPY.result[who][letter.id], { n: coinWord(turn.gained) });
    lineEl.textContent = line;
    result.hidden = false;
    renderScore(who);
    ctx.announce(`${nameEl.textContent}. ${meansEl.textContent} ${line}`);
    shell.later(next, PAUSE_MS);
  }

  function turnOf(who: Who, next: () => void): void {
    const letter = spinLetter(rand);
    if (shell.full()) {
      art.svg.classList.remove('is-spinning');
      void art.svg.getBoundingClientRect();
      art.svg.classList.add('is-spinning');
      shell.later(() => reveal(who, letter, next), SPIN_MS);
    } else reveal(who, letter, next);
  }

  function spin(): void {
    if (busy || isOver(game)) return;
    setBusy(true);
    turnOf('you', afterYou);
  }

  function afterYou(): void {
    if (isOver(game)) return finish();
    const refill = game.pot === 0;
    if (refill) {
      game = ante(game);
      if (isOver(game)) return finish();
      say(COPY.refill);
    } else say(COPY.jubiSpins);
    renderScore('jubi');
    shell.later(() => turnOf('jubi', afterJubi), refill ? PAUSE_MS : 400);
  }

  function afterJubi(): void {
    if (isOver(game)) return finish();
    game = ante(game);
    if (isOver(game)) return finish();
    renderScore('you');
    setBusy(false);
    say(COPY.yourTurn);
    spinBtn.focus({ preventScroll: true });
  }

  function finish(): void {
    renderScore(null);
    const youOut = game.out === 'you';
    const again = h('button', { type: 'button', class: 'btn btn-lg', onclick: () => { d.close(); restart(); } }, icon('shuffle', 22), COPY.again);
    const title = youOut ? COPY.endYouTitle : COPY.endJubiTitle;
    const d = shell.dialog(title, [h('p', { class: 'dd-help' }, youOut ? COPY.endYou : COPY.endJubi), h('div', { class: 'sp-dlg-actions' }, again)], () => again.isConnected && restart());
    ctx.announce(title);
  }

  function restart(): void {
    game = ante(newGame());
    result.hidden = true;
    art.face('');
    renderScore('you');
    setBusy(false);
    say(COPY.start);
    spinBtn.focus({ preventScroll: true });
  }

  function showHelp(): void {
    const ok = h('button', { type: 'button', class: 'btn btn-lg', onclick: () => d.close() }, COPY.gotIt);
    const d = shell.dialog(COPY.helpTitle, [h('ol', { class: 'dd-rules' }, ...COPY.helpRules.map((r) => h('li', {}, r))), h('div', { class: 'sp-dlg-actions' }, ok)]);
  }

  shell.root.addEventListener('keydown', (e) => {
    if (e.key !== ' ' || e.defaultPrevented) return;
    if ((e.target as HTMLElement).closest('button, .sp-dlg')) return;
    e.preventDefault();
    spin();
  });

  game = ante(game);
  renderScore('you');
  shell.later(() => spinBtn.focus({ preventScroll: true }), 50);
  return { el: shell.root, destroy: () => shell.destroy() };
}
