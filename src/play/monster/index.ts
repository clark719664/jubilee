/**
 * Monster Maker (activity id 'monster') — build a cuddly monster and give it a name.
 *
 * Six tabs (body, color, eyes, mouth, top, pattern) open rows of choices; tapping one changes the
 * monster with a bounce. "Surprise me" deals a whole new monster, "New name" rolls a silly name, and
 * "Keep it" puts it on the Fridge as data ({ kind: 'monster', data: MonsterSpec }), redrawn anywhere
 * with `drawMonster`. Tapping the monster makes it say hello. Every monster is friendly.
 *
 * Keyboard: Tab to the tabs; arrows move along tabs and options; Enter/Space chooses; Esc goes back.
 * Motion: full → bounce and wiggle; otherwise the monster just changes.
 */
import { playClip } from '../../ui/voice';
import './monster.css';
import { mulberry32 } from '../../effects/rng';
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { createShell, keepOnFridge, pick, wireGroup } from '../spooky/kit';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import {
  BODIES, COLORS, DEFAULT_MONSTER, EYES, MOUTHS, PATTERNS, TOPS, describeMonster, drawMonster, monsterName, monsterTitle, partPreview, randomMonster, withPart,
  type MonsterSpec, type Part, type Slot,
} from './parts';

export { BODIES, COLORS, DEFAULT_MONSTER, EYES, MOUTHS, PATTERNS, TOPS, describeMonster, drawMonster, monsterName, monsterTitle, randomMonster, sanitizeMonster, withPart } from './parts';
export type { MonsterSpec } from './parts';

export const COPY = {
  title: 'Monster Maker',
  emoji: '👾',
  blurb: 'Build a cuddly monster',
  sub: 'Pick, mix and name your very own!',
  tabs: { body: 'Body', color: 'Color', eyes: 'Eyes', mouth: 'Mouth', top: 'On top', pattern: 'Pattern' } as Readonly<Record<Slot, string>>,
  surprise: 'Surprise me',
  rename: 'New name',
  keep: 'Keep it',
  monsterLabel: 'Your monster. Tap it to say hello.',
  hellos: ['Hello! I’m {name}!', 'Rawr! …I mean, hi!', 'Wanna be friends?', 'I love Halloween!', 'Do you have any candy?', 'Hee hee hee!'],
} as const;

export const monsterActivity: Activity = {
  id: 'monster',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  available: (meta) => meta.id === 'halloween',
  mount: (env) => mountMonster(env),
};

const LISTS: Readonly<Record<Slot, readonly Part[]>> = { body: BODIES, color: COLORS, eyes: EYES, mouth: MOUTHS, top: TOPS, pattern: PATTERNS };
const SLOTS: readonly Slot[] = ['body', 'color', 'eyes', 'mouth', 'top', 'pattern'];

function mountMonster(env: PlayEnv): ActivityInstance {
  const { ctx } = env;
  const shell = createShell(env, { game: 'mm', title: COPY.title, sub: COPY.sub });
  const rand = mulberry32((Date.now() ^ 0x51ed270b) >>> 0);
  let spec: MonsterSpec = { ...DEFAULT_MONSTER, name: monsterName(rand) };
  let slot: Slot = 'body';
  let sayTimer: number | null = null;

  const art = h('div', { class: 'mm-art-host' });
  const nameTag = h('p', { class: 'mm-name' });
  const say = h('p', { class: 'sp-say mm-say', 'aria-hidden': 'true' });
  const monsterBtn = h('button', { type: 'button', class: 'mm-monster', 'aria-label': COPY.monsterLabel, 'aria-describedby': 'mm-desc', onclick: () => hello() }, art);
  const stage = h('div', { class: 'mm-stage' }, h('div', { class: 'mm-halo', 'aria-hidden': 'true' }), monsterBtn, nameTag, say);
  const description = h('p', { class: 'sr-only', id: 'mm-desc' });

  const tabs = h('div', { class: 'sp-tabs', role: 'tablist', 'aria-label': 'Parts' });
  const tabEls = SLOTS.map((s) => h('button', { type: 'button', class: 'sp-tab', role: 'tab', 'aria-selected': 'false', tabindex: -1, 'aria-controls': 'mm-opts', onclick: () => select(s) }, COPY.tabs[s]));
  tabs.append(...tabEls);
  wireGroup(tabs, () => tabEls);
  tabs.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
      const i = tabEls.indexOf(document.activeElement as HTMLButtonElement);
      if (i >= 0) select(SLOTS[i]!);
    }
  });
  const opts = h('div', { class: 'sp-opts', id: 'mm-opts', role: 'radiogroup', 'aria-label': COPY.tabs.body });
  let optEls: HTMLElement[] = [];
  wireGroup(opts, () => optEls);

  const surpriseBtn = h('button', { type: 'button', class: 'btn btn-secondary', 'aria-label': COPY.surprise, onclick: () => surprise() }, icon('shuffle', 22), h('span', { class: 'sp-act-text' }, COPY.surprise));
  const renameBtn = h('button', { type: 'button', class: 'btn btn-secondary', 'aria-label': COPY.rename, onclick: () => rename() }, icon('sparkle', 22), h('span', { class: 'sp-act-text' }, COPY.rename));
  const keepBtn = h('button', { type: 'button', class: 'btn btn-lg', onclick: () => keep() }, icon('heart', 22), COPY.keep);
  const panel = h('div', { class: 'sp-panel mm-panel' }, tabs, opts, h('div', { class: 'sp-actions' }, keepBtn, surpriseBtn, renameBtn));
  shell.body.append(h('div', { class: 'mm-layout' }, stage, panel), description);

  function redraw(): void {
    art.replaceChildren(drawMonster(spec));
    nameTag.textContent = spec.name;
    description.textContent = describeMonster(spec);
  }

  function renderOptions(focusSelected = false): void {
    const current = spec[slot];
    opts.setAttribute('aria-label', COPY.tabs[slot]);
    optEls = LISTS[slot].map((p) => {
      const on = p.id === current;
      return h('button', { type: 'button', class: 'sp-opt', role: 'radio', 'aria-checked': String(on), 'aria-label': p.name, tabindex: on ? 0 : -1, onclick: () => choose(p) },
        partPreview(spec, slot, p.id), h('span', { class: 'sp-opt-name' }, p.name));
    });
    if (!optEls.some((b) => b.tabIndex === 0)) optEls[0]?.setAttribute('tabindex', '0');
    opts.replaceChildren(...optEls);
    if (focusSelected) (optEls.find((b) => b.tabIndex === 0) ?? optEls[0])?.focus({ preventScroll: true });
  }

  function select(s: Slot): void {
    slot = s;
    tabEls.forEach((t, i) => {
      t.setAttribute('aria-selected', String(SLOTS[i] === s));
      t.tabIndex = SLOTS[i] === s ? 0 : -1;
    });
    renderOptions();
  }

  function bounce(cls: string, ms: number): void {
    if (!shell.full()) return;
    monsterBtn.classList.remove(cls);
    void monsterBtn.offsetWidth;
    monsterBtn.classList.add(cls);
    shell.later(() => monsterBtn.classList.remove(cls), ms);
  }

  function choose(p: Part): void {
    spec = withPart(spec, slot, p.id);
    redraw();
    renderOptions(true);
    bounce('is-bounce', 520);
    ctx.announce(`${p.name} chosen`);
  }

  function speak(text: string): void {
    playClip(text);
    say.textContent = text;
    say.classList.add('is-on');
    shell.cancel(sayTimer);
    sayTimer = shell.later(() => say.classList.remove('is-on'), 2400);
    ctx.announce(text);
  }

  function hello(): void {
    speak(pick(COPY.hellos, rand).replace('{name}', spec.name));
    bounce('is-wiggle', 700);
  }

  function surprise(): void {
    spec = randomMonster(rand);
    redraw();
    renderOptions();
    bounce('is-bounce', 520);
    speak(`Meet ${spec.name}!`);
  }

  function rename(): void {
    spec = { ...spec, name: monsterName(rand) };
    redraw();
    speak(`Call me ${spec.name}!`);
  }

  function keep(): void {
    const kept = spec;
    keepOnFridge(env, shell, { kind: 'monster', title: monsterTitle(kept), data: kept, preview: () => drawMonster(kept) }, () => keepBtn.focus({ preventScroll: true }));
  }

  redraw();
  select('body');
  return { el: shell.root, destroy: () => shell.destroy() };
}
