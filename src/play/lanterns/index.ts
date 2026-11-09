/**
 * Lantern Lights (activity id 'lanterns') — a row of paper lanterns hangs under the crescent moon. They
 * glow a short pattern; tap them in the same order. The pattern starts at two and grows by one each round,
 * up to eight. A wrong tap just shows the pattern again, kindly: nothing is lost or timed. Nothing is saved.
 *
 * Keyboard: Tab to a lantern, Enter/Space taps it (keys 1–6 tap too). Every glow lasts 600 ms with a
 * 300 ms gap, well under 3 flashes a second.
 * Motion: full → lanterns glow softly; otherwise the lantern shown gets a static ring and its step number.
 */
import './lanterns.css';
import { plural } from '../../i18n/index';
import { mulberry32 } from '../../effects/rng';
import { h, svg } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { createShell, fill, wireGroup } from '../spooky/kit';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import {
  EASY_LANTERNS, GAP_MS, GLOW_MS, HARD_LANTERNS, LANTERN_COLORS, ROUNDS, newGame, roundOf, shown, tap, type Game,
} from './logic';

export { EASY_LANTERNS, HARD_LANTERNS, MAX_LENGTH, START_LENGTH, makeSequence, newGame, shown, tap } from './logic';

export const COPY = {
  title: 'Lantern Lights',
  emoji: '🏮',
  blurb: 'Tap the lanterns in order',
  sub: 'Watch the lights, then tap them the same way.',
  watch: 'Round {n} of {total}. Watch the lanterns…',
  yourTurn: 'Your turn! Tap the lights.',
  good: 'Yes! Here comes a longer one.',
  tryAgain: 'Almost! Watch once more, then try again.',
  lanternLabel: 'The {color} lantern, number {n}',
  stepLabel: 'Lantern {n} glows, step {step}',
  levelLabel: 'How many lanterns',
  replay: 'Watch again',
  doneTitle: 'All the lanterns are shining!',
  doneLine: 'You remembered every light. What a bright night!',
  again: 'Play again',
} as const;

const COUNTS = { lanterns: { one: '{n} lantern', other: '{n} lanterns' } } as const;

export const lanternsActivity: Activity = {
  id: 'lanterns',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  available: (meta) => meta.id === 'eid-al-fitr' || meta.id === 'ramadan' || meta.id === 'eid-al-adha',
  mount: (env) => mountLanterns(env),
};

const BODY = 'M18 22H46L56 62L46 100H18L8 62Z';

function drawLantern(i: number): { readonly svg: SVGSVGElement; readonly num: SVGTextElement } {
  const c = LANTERN_COLORS[i % LANTERN_COLORS.length]!;
  const num = svg('text', { class: 'ln-num', x: 32, y: 70 });
  const art = svg('svg', { viewBox: '0 0 64 120', 'aria-hidden': 'true', focusable: 'false' },
    svg('line', { x1: 32, y1: 0, x2: 32, y2: 14, stroke: '#6b4a1e', 'stroke-width': 3 }),
    svg('rect', { x: 20, y: 13, width: 24, height: 9, rx: 3, fill: '#8a5a14' }),
    svg('path', { d: BODY, fill: c.body, stroke: '#2b1a4d', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
    svg('g', { class: 'ln-glow' },
      svg('path', { d: BODY, fill: c.lit }),
      svg('ellipse', { cx: 32, cy: 62, rx: 14, ry: 26, fill: '#fff8d6', opacity: 0.8 })),
    svg('path', { d: 'M32 22V100M25 22Q18 62 25 100M39 22Q46 62 39 100', fill: 'none', stroke: '#2b1a4d', 'stroke-width': 2, opacity: 0.45 }),
    svg('path', { d: BODY, class: 'ln-ring' }),
    svg('rect', { x: 20, y: 99, width: 24, height: 8, rx: 3, fill: '#8a5a14' }),
    svg('line', { x1: 32, y1: 107, x2: 32, y2: 115, stroke: '#8a5a14', 'stroke-width': 3 }),
    svg('circle', { cx: 32, cy: 116, r: 3.5, fill: '#ffcf3f' }),
    num);
  return { svg: art, num };
}

function drawMoon(): SVGSVGElement {
  return svg('svg', { class: 'ln-moon', viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false' },
    svg('path', { d: 'M60 10A41.2 41.2 0 1 0 60 90A50 50 0 0 1 60 10Z', fill: '#fff2b8' }),
    svg('circle', { cx: 82, cy: 24, r: 2.5, fill: '#fff' }),
    svg('circle', { cx: 90, cy: 54, r: 1.8, fill: '#fff' }));
}

function mountLanterns(env: PlayEnv): ActivityInstance {
  const { ctx } = env;
  const shell = createShell(env, { game: 'ln', title: COPY.title, sub: COPY.sub });
  const rand = mulberry32((Date.now() ^ 0x9e3779b9) >>> 0);
  let count = EASY_LANTERNS;
  let game: Game = newGame(rand, count);
  let listening = false;
  let run = 0;
  let litTimer: number | null = null;
  let lanterns: { readonly el: HTMLButtonElement; readonly num: SVGTextElement }[] = [];

  const status = h('p', { class: 'ln-status', 'aria-live': 'polite' });
  const row = h('ul', { class: 'ln-row' });
  const sizes = [{ n: EASY_LANTERNS, text: plural(EASY_LANTERNS, COUNTS.lanterns) }, { n: HARD_LANTERNS, text: plural(HARD_LANTERNS, COUNTS.lanterns) }];
  const levels = sizes.map((l) => h('button', {
    type: 'button', class: 'ln-opt', role: 'radio', 'aria-checked': String(l.n === count), tabindex: l.n === count ? 0 : -1,
    onclick: () => chooseCount(l.n),
  }, l.text));
  const pick = h('div', { class: 'ln-pick', role: 'radiogroup', 'aria-label': COPY.levelLabel }, ...levels);
  wireGroup(pick, () => levels);
  const replayBtn = h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => play() }, icon('shuffle', 22), COPY.replay);

  const hang = h('div', { class: 'ln-hang' }, h('div', { class: 'ln-string', 'aria-hidden': 'true' }), row);
  shell.body.append(h('div', { class: 'ln-layout' }, drawMoon(), hang, status, h('div', { class: 'ln-controls' }, pick, replayBtn)));

  function build(): void {
    lanterns = Array.from({ length: count }, (_, i) => {
      const art = drawLantern(i);
      const c = LANTERN_COLORS[i % LANTERN_COLORS.length]!;
      const el = h('button', {
        type: 'button', class: 'ln-lantern', style: `--ln-lit:${c.lit}`,
        'aria-label': fill(COPY.lanternLabel, { color: c.name, n: i + 1 }), onclick: () => press(i),
      }, art.svg);
      return { el, num: art.num };
    });
    row.replaceChildren(...lanterns.map((l) => h('li', {}, l.el)));
    row.style.maxWidth = `${count * 100}px`;
  }

  /** One lantern lit at a time (or none). Reduced motion gets a static ring and the step number instead of a glow. */
  function setLit(i: number | null, step = 0): void {
    lanterns.forEach((l, k) => {
      const on = k === i;
      l.el.classList.toggle('is-lit', on && shell.full());
      l.el.classList.toggle('is-step', on && !shell.full());
      l.num.textContent = on && !shell.full() && step > 0 ? String(step) : '';
    });
  }

  function say(text: string, announce = true): void {
    status.textContent = text;
    if (announce) ctx.announce(text);
  }

  /** Glows this round's pattern one lantern at a time, then hands over to the child. */
  function play(): void {
    const id = ++run;
    shell.cancel(litTimer);
    listening = false;
    replayBtn.disabled = true;
    setLit(null);
    say(fill(COPY.watch, { n: roundOf(game), total: ROUNDS }), false);
    const seq = shown(game);
    let k = 0;
    const next = (): void => {
      if (id !== run) return;
      if (k >= seq.length) {
        setLit(null);
        listening = true;
        replayBtn.disabled = false;
        say(COPY.yourTurn);
        return;
      }
      const i = seq[k]!;
      k++;
      setLit(i, k);
      litTimer = shell.later(() => { setLit(null); litTimer = shell.later(next, GAP_MS); }, GLOW_MS);
    };
    litTimer = shell.later(next, 600);
  }

  function press(i: number): void {
    if (!listening) return;
    const { game: after, result } = tap(game, i);
    game = after;
    setLit(i);
    shell.cancel(litTimer);
    litTimer = shell.later(() => setLit(null), 450);
    if (result === 'ok') return;
    listening = false;
    if (result === 'wrong') { say(COPY.tryAgain); shell.later(play, 1400); }
    else if (result === 'round') { say(COPY.good); shell.later(play, 1400); }
    else shell.later(finish, 900);
  }

  function finish(): void {
    const again = h('button', { type: 'button', class: 'btn btn-lg', onclick: () => { d.close(); restart(); } }, icon('shuffle', 22), COPY.again);
    const d = shell.dialog(COPY.doneTitle, [h('p', { class: 'ln-done-line' }, COPY.doneLine), h('div', { class: 'sp-dlg-actions' }, again)], () => again.isConnected && restart());
    ctx.announce(COPY.doneTitle);
  }

  function restart(): void {
    game = newGame(rand, count);
    build();
    play();
  }

  function chooseCount(n: number): void {
    if (n === count) return;
    count = n;
    levels.forEach((b, k) => {
      const on = sizes[k]!.n === n;
      b.setAttribute('aria-checked', String(on));
      b.setAttribute('tabindex', on ? '0' : '-1');
    });
    restart();
  }

  const onKey = (e: KeyboardEvent): void => {
    const n = Number(e.key);
    if (e.ctrlKey || e.metaKey || e.altKey || !Number.isInteger(n) || n < 1 || n > count) return;
    press(n - 1);
  };
  shell.root.addEventListener('keydown', onKey);

  build();
  play();
  return { el: shell.root, destroy: () => { run++; shell.root.removeEventListener('keydown', onKey); shell.destroy(); } };
}
