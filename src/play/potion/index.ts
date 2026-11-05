/**
 * Cauldron Colors (activity id 'potion') — brew colors in a bubbling cauldron.
 *
 * Tap the bottles to drop red, yellow, blue, white or night ink into the cauldron and watch the potion
 * change: red + yellow = orange, yellow + blue = green, red + blue = purple, all three = brown, white
 * makes it lighter, ink darker. A friend at the window asks for a color ("a pink potion, like candy
 * floss"); when the cauldron matches they cheer and "Bottle it!" puts the potion on the shelf. Free
 * mixing always works: any color can be bottled and gets its name. A hint says what to try. Nothing is
 * timed or wrong; "Pour it out" starts over, and nothing is saved.
 *
 * Keyboard: Tab to a bottle, Enter/Space drops it in; Esc goes back.
 * Motion: full → drops fall, bubbles rise, the liquid ripples; otherwise the color simply changes.
 */
import { playClip } from '../../ui/voice';
import './potion.css';
import { mulberry32 } from '../../effects/rng';
import { build, type Spec } from '../spooky/draw';
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { createShell, pick } from '../spooky/kit';
import { drawVisitor } from '../treats/art';
import { VISITORS } from '../treats/logic';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { DROPS, EMPTY, MAX_DROPS, addDrop, hex, hintFor, mixColor, mixFrom, nameOf, nextOrder, totalDrops, type Drop, type Mix, type Order } from './logic';

export { DROPS, ORDERS, addDrop, colorName, hex, hintFor, mixColor, mixFrom, nameOf, nextOrder, totalDrops } from './logic';

export const COPY = {
  title: 'Cauldron Colors',
  emoji: '🧪',
  blurb: 'Mix bubbling potions',
  sub: 'Drop, mix and brew!',
  bottle: 'Bottle it!',
  pour: 'Pour it out',
  hint: 'Hint',
  shelf: 'Your potion shelf',
  shelfEmpty: 'Bottle a potion and it goes on the shelf.',
  water: 'Plain water. Add a drop!',
  full: 'The cauldron is full! Bottle it or pour it out.',
  match: 'That’s the one! Bottle it!',
  thanks: 'Thank you! It’s perfect!',
  bottles: {
    red: { name: 'Ruby berries', label: 'red' }, yellow: { name: 'Sunbeam drops', label: 'yellow' }, blue: { name: 'Moon dew', label: 'blue' },
    white: { name: 'Cloud fluff', label: 'white' }, ink: { name: 'Night ink', label: 'dark' },
  } as Readonly<Record<Drop, { name: string; label: string }>>,
} as const;

const BOTTLE_COLOR: Readonly<Record<Drop, string>> = { red: '#ed1f33', yellow: '#ffdb1f', blue: '#295ed9', white: '#ffffff', ink: '#1f0f38' };

export const potionActivity: Activity = {
  id: 'potion',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  available: (meta) => meta.id === 'halloween',
  mount: (env) => mountPotion(env),
};

function bottleSvg(d: Drop): SVGSVGElement {
  const c = BOTTLE_COLOR[d];
  const spec: Spec = ['svg', { viewBox: '0 0 56 84', class: 'pc-bottle-svg', 'aria-hidden': 'true', focusable: 'false' },
    ['rect', { x: 20, y: 2, width: 16, height: 12, rx: 3, fill: '#a8703a' }],
    ['path', { d: 'M20 12H36V26Q52 36 52 56V70Q52 80 42 80H14Q4 80 4 70V56Q4 36 20 26z', fill: '#f3ecff' }],
    ['path', { d: 'M10 54Q10 40 24 32H32Q46 40 46 54V70Q46 76 40 76H16Q10 76 10 70z', fill: c }],
    ['ellipse', { cx: 16, cy: 56, rx: 3, ry: 9, fill: '#fff', opacity: d === 'white' ? 0.5 : 0.35 }],
    ['rect', { x: 14, y: 60, width: 28, height: 12, rx: 4, fill: '#fffdf8' }],
    ['circle', { cx: 28, cy: 66, r: 3.5, fill: d === 'white' ? '#cdbfe8' : c }]];
  return build(spec) as SVGSVGElement;
}

function mountPotion(env: PlayEnv): ActivityInstance {
  const { ctx } = env;
  const shell = createShell(env, { game: 'pc', title: COPY.title, sub: COPY.sub });
  const rand = mulberry32((Date.now() ^ 0x6a09e667) >>> 0);
  let mix: Mix = EMPTY;
  let order: Order = nextOrder(rand, null);
  let visitorId = pick(VISITORS, rand).id;
  let sayTimer: number | null = null;
  const shelfItems: { readonly name: string; readonly color: string }[] = [];

  // ── the friend at the window ──
  const swatch = h('span', { class: 'pc-swatch', 'aria-hidden': 'true' });
  const ask = h('p', { class: 'pc-ask' });
  const friend = h('div', { class: 'pc-friend', 'aria-hidden': 'true' });
  const hintLine = h('p', { class: 'pc-hint', hidden: true });
  const hintBtn = h('button', { type: 'button', class: 'btn btn-secondary pc-hint-btn', onclick: () => { hintLine.hidden = false; hintLine.textContent = hintFor(order); ctx.announce(hintFor(order)); } }, icon('info', 20), COPY.hint);
  const orderCard = h('div', { class: 'pc-order' }, friend, h('div', { class: 'pc-order-text' }, ask, h('div', { class: 'pc-order-row' }, swatch, hintBtn), hintLine));

  // ── the cauldron ──
  const liquid = build(['ellipse', { cx: 100, cy: 70, rx: 66, ry: 15, fill: '#99d6e8', class: 'pc-liquid' }]);
  const pot = build(['svg', { viewBox: '0 0 200 170', class: 'pc-pot', 'aria-hidden': 'true', focusable: 'false' },
    ['ellipse', { cx: 100, cy: 160, rx: 70, ry: 8, fill: '#000', opacity: 0.25 }],
    ['path', { d: 'M52 150L44 164M148 150L156 164', stroke: '#1c1230', 'stroke-width': 8, 'stroke-linecap': 'round' }],
    ['path', { d: 'M24 70C20 120 46 154 100 154S180 120 176 70z', fill: '#2a1d44' }],
    ['path', { d: 'M30 90C34 126 56 146 84 150C52 140 38 118 36 90z', fill: '#4a3670' }],
    ['ellipse', { cx: 100, cy: 70, rx: 78, ry: 20, fill: '#1c1230' }]]) as SVGSVGElement;
  const bubbles = h('div', { class: 'pc-bubbles', 'aria-hidden': 'true' }, ...[0, 1, 2, 3].map((i) => h('i', { style: `--i:${i}` })));
  const rim = build(['path', { d: 'M22 70C22 52 56 50 100 50S178 52 178 70C178 60 140 66 100 66S22 60 22 70z', fill: '#4a3670' }]);
  pot.append(liquid, rim);
  const nameTag = h('p', { class: 'pc-name', 'aria-live': 'polite' });
  const pips = h('div', { class: 'pc-pips', 'aria-hidden': 'true' });
  const potWrap = h('div', { class: 'pc-potwrap' }, h('div', { class: 'pc-glow', 'aria-hidden': 'true' }), pot, bubbles);
  const say = h('p', { class: 'sp-say pc-say', 'aria-hidden': 'true' });
  const stage = h('div', { class: 'pc-stage' }, potWrap, nameTag, pips, say);

  // ── bottles and actions ──
  const bottles = h('div', { class: 'pc-bottles', role: 'group', 'aria-label': 'Ingredients' },
    ...DROPS.map((d) => h('button', {
      type: 'button', class: 'pc-bottle', 'aria-label': `Add a drop of ${COPY.bottles[d].label}: ${COPY.bottles[d].name}`, onclick: () => drop(d),
    }, bottleSvg(d), h('span', { class: 'pc-bottle-name' }, COPY.bottles[d].name))));
  const bottleBtn = h('button', { type: 'button', class: 'btn btn-lg pc-bottle-btn', onclick: () => bottleIt() }, icon('check', 22), COPY.bottle);
  const pourBtn = h('button', { type: 'button', class: 'btn btn-secondary', 'aria-label': COPY.pour, onclick: () => pourOut() }, icon('close', 22), h('span', { class: 'sp-act-text' }, COPY.pour));
  const actions = h('div', { class: 'sp-actions' }, bottleBtn, pourBtn);
  const shelf = h('ul', { class: 'pc-shelf', 'aria-label': COPY.shelf });
  const panel = h('div', { class: 'sp-panel pc-panel' }, bottles, actions, h('div', { class: 'pc-shelf-wrap' }, shelf));
  shell.body.append(h('div', { class: 'pc-layout' }, orderCard, stage, panel));

  // ── behavior ──
  const liquidEl = liquid as SVGElement;
  function setColor(): void {
    const c = hex(mixColor(mix));
    liquidEl.setAttribute('fill', c);
    potWrap.style.setProperty('--liquid', c);
    const n = totalDrops(mix);
    const name = nameOf(mix);
    nameTag.textContent = n === 0 ? COPY.water : `${name} potion`;
    pips.replaceChildren(...Array.from({ length: MAX_DROPS }, (_, i) => h('i', { class: i < n ? 'is-on' : '' })));
    const matched = n > 0 && name === order.color;
    bottleBtn.classList.toggle('is-ready', matched);
    bottleBtn.disabled = n === 0;
    pourBtn.disabled = n === 0;
    potWrap.classList.toggle('is-boiling', n > 0);
    orderCard.classList.toggle('is-matched', matched);
  }

  function renderOrder(): void {
    ask.textContent = `Can I have ${order.ask}, please?`;
    swatch.style.background = hex(mixColor(mixFrom(order.recipe)));
    swatch.textContent = order.color;
    friend.replaceChildren(drawVisitor(visitorId));
    hintLine.hidden = true;
    ctx.announce(`A friend asks for ${order.ask}.`);
  }

  function speak(text: string): void {
    playClip(text);
    say.textContent = text;
    say.classList.add('is-on');
    shell.cancel(sayTimer);
    sayTimer = shell.later(() => say.classList.remove('is-on'), 2400);
    ctx.announce(text);
  }

  function drop(d: Drop): void {
    if (totalDrops(mix) >= MAX_DROPS) { speak(COPY.full); return; }
    mix = addDrop(mix, d);
    if (shell.full()) {
      const el = h('i', { class: 'pc-drop', style: `background:${BOTTLE_COLOR[d]}` });
      potWrap.append(el);
      shell.later(() => el.remove(), 700);
      potWrap.classList.remove('is-splash');
      void potWrap.offsetWidth;
      potWrap.classList.add('is-splash');
    }
    setColor();
    const n = totalDrops(mix);
    const name = nameOf(mix);
    if (name === order.color) speak(COPY.match);
    ctx.announce(`${COPY.bottles[d].label} added. ${n} ${n === 1 ? 'drop' : 'drops'}. The potion is ${name.toLowerCase()}.`);
  }

  function bottleIt(): void {
    if (totalDrops(mix) === 0) return;
    const name = nameOf(mix);
    const color = hex(mixColor(mix));
    const wasOrder = name === order.color;
    shelfItems.push({ name: `${name} potion`, color });
    shelf.replaceChildren(...shelfItems.slice(-8).map((p) => h('li', { class: 'pc-shelf-item' }, h('i', { style: `background:${p.color}`, 'aria-hidden': 'true' }), h('span', {}, p.name))));
    mix = EMPTY;
    setColor();
    if (wasOrder) {
      speak(COPY.thanks);
      const next = nextOrder(rand, order.color);
      shell.later(() => { order = next; visitorId = pick(VISITORS.filter((v) => v.id !== visitorId), rand).id; renderOrder(); }, shell.full() ? 1500 : 800);
    } else speak(`A ${name.toLowerCase()} potion! On the shelf it goes.`);
  }

  function pourOut(): void {
    mix = EMPTY;
    setColor();
    speak('Whoosh! All poured out.');
  }

  renderOrder();
  setColor();
  shelf.append(h('li', { class: 'pc-shelf-empty' }, COPY.shelfEmpty));
  return { el: shell.root, destroy: () => shell.destroy() };
}
