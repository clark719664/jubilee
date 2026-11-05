/**
 * Pumpkin Carver (activity id 'pumpkin') — carve a friendly jack-o'-lantern, then light it.
 *
 * A big pumpkin on the porch; five tabs (eyes, nose, mouth, hat, colour) open rows of little pumpkins
 * showing each choice; tapping one carves it (a spray of soft chips and a squish). "Light it" puts the
 * candle in and the carving glows. "Surprise me" deals a random pumpkin. "Keep it" puts it on the
 * Fridge as data ({ kind: 'pumpkin', data: PumpkinSpec }), redrawn anywhere with `drawPumpkin`.
 * Tapping the pumpkin makes it giggle. No knife, no blood, nothing to get wrong.
 *
 * Keyboard: Tab to the tabs; arrows move along tabs and options; Enter/Space chooses; Esc goes back.
 * Motion: full → squish, chips, flicker; otherwise the pumpkin just changes and the glow holds still.
 */
import './pumpkin.css';
import { mulberry32 } from '../../effects/rng';
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { KIT_COPY, createShell, keepOnFridge, pick, wireGroup, type Shell } from '../spooky/kit';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import {
  COLOURS, DEFAULT_PUMPKIN, EYES, HATS, MOUTHS, NOSES, describePumpkin, drawPumpkin, partPreview, pumpkinTitle, randomPumpkin, withPart,
  type Part, type PumpkinSpec, type Slot,
} from './parts';

export { COLOURS, DEFAULT_PUMPKIN, EYES, HATS, MOUTHS, NOSES, describePumpkin, drawPumpkin, pumpkinTitle, randomPumpkin, sanitizePumpkin, withPart } from './parts';
export type { PumpkinSpec } from './parts';

export const COPY = {
  title: 'Pumpkin Carver',
  emoji: '🎃',
  blurb: 'Carve a friendly jack-o’-lantern',
  sub: 'Pick a face, then light it up!',
  tabs: { eyes: 'Eyes', nose: 'Nose', mouth: 'Mouth', hat: 'Hat', colour: 'Colour' } as Readonly<Record<Slot, string>>,
  light: 'Light it',
  blowOut: 'Blow it out',
  surprise: 'Surprise me',
  keep: 'Keep it',
  pumpkinLabel: 'Your pumpkin. Tap it to make it giggle.',
  carved: '{part}: carved!',
  lit: 'Your pumpkin is glowing!',
  dark: 'Your pumpkin is resting in the dark.',
  giggles: ['Hee hee, that tickles!', 'Boo! …just kidding.', 'I feel so handsome!', 'Happy Halloween!', 'Ooh, spooky and sweet!', 'Giggle, giggle!'],
  lights: ['Ooh, it glows!', 'So warm and cosy!', 'Look at me shine!'],
} as const;

export const pumpkinActivity: Activity = {
  id: 'pumpkin',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  // Halloween only; the engine is plain data, so another holiday could re-skin it later.
  available: (meta) => meta.id === 'halloween',
  mount: (env) => mountPumpkin(env),
};

const LISTS: Readonly<Record<Slot, readonly Part[]>> = { eyes: EYES, nose: NOSES, mouth: MOUTHS, hat: HATS, colour: COLOURS };
const SLOTS: readonly Slot[] = ['eyes', 'nose', 'mouth', 'hat', 'colour'];

function mountPumpkin(env: PlayEnv): ActivityInstance {
  const { ctx } = env;
  const shell = createShell(env, { game: 'pk', title: COPY.title, sub: COPY.sub });
  const rand = mulberry32((Date.now() ^ 0x9e3779b9) >>> 0);
  let spec: PumpkinSpec = DEFAULT_PUMPKIN;
  let slot: Slot = 'eyes';
  let sayTimer: number | null = null;

  // ── stage ──
  const art = h('div', { class: 'pk-art-host' });
  const chips = h('div', { class: 'pk-chips', 'aria-hidden': 'true' });
  const say = h('p', { class: 'sp-say pk-say', 'aria-hidden': 'true' });
  const pumpkinBtn = h('button', { type: 'button', class: 'pk-pumpkin', 'aria-label': COPY.pumpkinLabel, onclick: () => giggle() }, art);
  const stage = h('div', { class: 'pk-stage' }, h('div', { class: 'pk-halo', 'aria-hidden': 'true' }), pumpkinBtn, chips, say);
  const description = h('p', { class: 'sr-only', id: 'pk-desc' });
  pumpkinBtn.setAttribute('aria-describedby', 'pk-desc');

  // ── controls ──
  const tabs = h('div', { class: 'sp-tabs', role: 'tablist', 'aria-label': 'Parts' });
  const tabEls = SLOTS.map((s) => h('button', {
    type: 'button', class: 'sp-tab', role: 'tab', id: `pk-tab-${s}`, 'aria-selected': 'false', tabindex: -1, 'aria-controls': 'pk-opts',
    onclick: () => select(s),
  }, COPY.tabs[s]));
  tabs.append(...tabEls);
  wireGroup(tabs, () => tabEls);
  tabs.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
      const i = tabEls.indexOf(document.activeElement as HTMLButtonElement);
      if (i >= 0) select(SLOTS[i]!, false);
    }
  });
  const opts = h('div', { class: 'sp-opts', id: 'pk-opts', role: 'radiogroup', 'aria-label': COPY.tabs.eyes });
  let optEls: HTMLElement[] = [];
  wireGroup(opts, () => optEls);

  const lightBtn = h('button', { type: 'button', class: 'btn btn-lg pk-light', 'aria-pressed': 'false', onclick: () => toggleLight() });
  const surpriseBtn = h('button', { type: 'button', class: 'btn btn-secondary', 'aria-label': COPY.surprise, onclick: () => surprise() }, icon('shuffle', 22), h('span', { class: 'sp-act-text' }, COPY.surprise));
  const keepBtn = h('button', { type: 'button', class: 'btn btn-secondary sp-keep', onclick: () => keep() }, icon('heart', 22), COPY.keep);
  const actions = h('div', { class: 'sp-actions' }, lightBtn, surpriseBtn, keepBtn);
  const panel = h('div', { class: 'sp-panel pk-panel' }, tabs, opts, actions);

  shell.body.append(h('div', { class: 'pk-layout' }, stage, panel), description);

  // ── behaviour ──
  function redraw(): void {
    art.replaceChildren(drawPumpkin(spec));
    description.textContent = describePumpkin(spec);
    lightBtn.replaceChildren(icon(spec.lit ? 'close' : 'flame', 22), spec.lit ? COPY.blowOut : COPY.light);
    lightBtn.setAttribute('aria-pressed', String(spec.lit));
    stage.classList.toggle('is-lit', spec.lit);
  }

  function renderOptions(focusSelected = false): void {
    const list = LISTS[slot];
    const current = spec[slot];
    opts.setAttribute('aria-label', COPY.tabs[slot]);
    optEls = list.map((p) => {
      const on = p.id === current;
      const b = h('button', {
        type: 'button', class: 'sp-opt', role: 'radio', 'aria-checked': String(on), 'aria-label': p.name, tabindex: on ? 0 : -1,
        onclick: () => choose(p),
      }, partPreview(spec, slot, p.id), h('span', { class: 'sp-opt-name' }, p.name));
      return b;
    });
    if (!optEls.some((b) => b.tabIndex === 0)) optEls[0]?.setAttribute('tabindex', '0');
    opts.replaceChildren(...optEls);
    if (focusSelected) (optEls.find((b) => b.tabIndex === 0) ?? optEls[0])?.focus({ preventScroll: true });
  }

  function select(s: Slot, render = true): void {
    slot = s;
    tabEls.forEach((t, i) => {
      const on = SLOTS[i] === s;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (render) renderOptions();
    else renderOptions();
  }

  function choose(p: Part): void {
    spec = withPart(spec, slot, p.id);
    redraw();
    renderOptions(true);
    carveFx();
    const msg = `${p.name}: carved!`;
    ctx.announce(slot === 'colour' || slot === 'hat' ? `${p.name} chosen` : msg);
  }

  function carveFx(): void {
    if (!shell.full()) return;
    pumpkinBtn.classList.remove('is-squish');
    void pumpkinBtn.offsetWidth;
    pumpkinBtn.classList.add('is-squish');
    shell.later(() => pumpkinBtn.classList.remove('is-squish'), 480);
    chips.replaceChildren();
    for (let i = 0; i < 7; i++) {
      const a = (rand() * 0.9 + 0.05) * Math.PI;
      const d = 44 + rand() * 46;
      chips.append(h('i', { class: 'pk-chip', style: `--dx:${Math.round(Math.cos(a) * d * (rand() < 0.5 ? -1 : 1))}px;--dy:${Math.round(-Math.sin(a) * d)}px;--r:${Math.round(rand() * 240 - 120)}deg` }));
    }
    shell.later(() => chips.replaceChildren(), 700);
  }

  function speak(text: string): void {
    say.textContent = text;
    say.classList.add('is-on');
    shell.cancel(sayTimer);
    sayTimer = shell.later(() => say.classList.remove('is-on'), 2200);
    ctx.announce(text);
  }

  function giggle(): void {
    speak(pick(COPY.giggles, rand));
    if (shell.full()) {
      pumpkinBtn.classList.remove('is-wiggle');
      void pumpkinBtn.offsetWidth;
      pumpkinBtn.classList.add('is-wiggle');
      shell.later(() => pumpkinBtn.classList.remove('is-wiggle'), 700);
    }
  }

  function toggleLight(): void {
    spec = { ...spec, lit: !spec.lit };
    redraw();
    renderOptions();
    speak(spec.lit ? pick(COPY.lights, rand) : COPY.dark);
  }

  function surprise(): void {
    spec = randomPumpkin(rand, spec.lit);
    redraw();
    renderOptions();
    carveFx();
    speak(pick(COPY.giggles, rand));
  }

  function keep(): void {
    const kept: PumpkinSpec = spec;
    keepOnFridge(env, shell as Shell, { kind: 'pumpkin', title: pumpkinTitle(kept), data: kept, preview: () => drawPumpkin(kept) }, () => keepBtn.focus({ preventScroll: true }));
  }

  redraw();
  select('eyes');

  return { el: shell.root, destroy: () => shell.destroy() };
}

export { KIT_COPY };
