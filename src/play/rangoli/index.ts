/**
 * Rangoli Maker (activity id 'rangoli', Diwali only) — a round floor pattern with 8-fold symmetry and five
 * rings of petals, dots and diamonds. Pick a powder color, tap a shape, and that shape and its seven
 * rotated twins fill together, so anything the child makes is symmetric. Three layouts, Undo, Clear.
 * There is no way to lose. Not kept on the Fridge: the shared Fridge kit only takes pumpkin and monster.
 *
 * Keyboard: Tab to a shape group, Enter/Space pours the chosen color; arrows move between colors and
 * layouts. Esc goes back. Motion: full → the powder puffs in; otherwise it just appears.
 */
import './rangoli.css';
import { visible } from '../../i18n/index';
import { h, svg } from '../../ui/dom';
import { createShell, fill, wireGroup } from '../spooky/kit';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import {
  DISC_RADIUS, LAYOUTS, SWATCHES, VIEW, buildGroups, canUndo, clear, filledCount, layoutById, newDesign, paint, setLayout, undo,
  type Design, type Group,
} from './logic';

export { FOLDS, LAYOUTS, SWATCHES, buildGroups, canUndo, clear, newDesign, paint, setLayout, undo } from './logic';

export const COPY = {
  title: 'Rangoli Maker',
  emoji: '🪔',
  blurb: 'Pour powder into a pattern',
  sub: 'Pick a color, then tap a shape. Every match fills too!',
  colorsLabel: 'Powder colors',
  layoutsLabel: 'Pattern layouts',
  swatchLabel: '{color} powder',
  layoutLabel: '{layout} pattern',
  groupLabel: 'Ring {ring} of 5, {shape} {n}, {state}. Press to pour {color}.',
  stateEmpty: visible({ empty: 'empty' }).empty,
  stateFilled: 'filled with {color}',
  poured: '{color} poured in all 8 places.',
  undo: 'Undo',
  clear: 'Clear',
  undone: 'Undone.',
  cleared: 'All clear. Start a new pattern!',
  shapeNames: visible({ petal: 'petal', dot: 'dot', diamond: 'diamond' }),
} as const;

export const rangoliActivity: Activity = {
  id: 'rangoli',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  available: (meta) => meta.id === 'diwali',
  mount: (env) => mountRangoli(env),
};

function mountRangoli(env: PlayEnv): ActivityInstance {
  const { ctx } = env;
  const shell = createShell(env, { game: 'rg', title: COPY.title, sub: COPY.sub });
  let design: Design = newDesign();
  let color = SWATCHES[0]!;
  const nodes = new Map<string, { readonly el: SVGGElement; readonly shapes: SVGElement[] }>();

  const stage = svg('svg', { class: 'rg-art', viewBox: `${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`, role: 'group', 'aria-label': COPY.title });
  const artWrap = h('div', { class: 'rg-stage' }, stage);

  const swatchBtns = SWATCHES.map((s, i) => h('button', {
    type: 'button', class: 'rg-swatch', role: 'radio', 'aria-checked': String(i === 0), tabindex: i === 0 ? '0' : '-1',
    'aria-label': fill(COPY.swatchLabel, { color: s.name }), style: `background:${s.hex}`, onclick: () => pick(i),
  }));
  const swatches = h('div', { class: 'rg-swatches', role: 'radiogroup', 'aria-label': COPY.colorsLabel }, ...swatchBtns);
  wireGroup(swatches, () => swatchBtns);
  swatches.addEventListener('keydown', () => queueMicrotask(() => {
    const i = swatchBtns.indexOf(document.activeElement as HTMLButtonElement);
    if (i >= 0 && SWATCHES[i] !== color) pick(i, false);
  }));

  const layoutBtns = LAYOUTS.map((l, i) => h('button', {
    type: 'button', class: 'btn btn-secondary rg-layout', role: 'radio', 'aria-checked': String(i === 0), tabindex: i === 0 ? '0' : '-1',
    'aria-label': fill(COPY.layoutLabel, { layout: l.name }), onclick: () => chooseLayout(i),
  }, l.name));
  const layouts = h('div', { class: 'rg-layouts', role: 'radiogroup', 'aria-label': COPY.layoutsLabel }, ...layoutBtns);
  wireGroup(layouts, () => layoutBtns);
  layouts.addEventListener('keydown', () => queueMicrotask(() => {
    const i = layoutBtns.indexOf(document.activeElement as HTMLButtonElement);
    if (i >= 0 && LAYOUTS[i]!.id !== design.layout) chooseLayout(i, false);
  }));

  const undoBtn = h('button', { type: 'button', class: 'btn btn-secondary rg-act', onclick: () => { design = undo(design); ctx.announce(COPY.undone); render(); } }, COPY.undo);
  const clearBtn = h('button', { type: 'button', class: 'btn btn-secondary rg-act', onclick: () => { design = clear(design); ctx.announce(COPY.cleared); render(); } }, COPY.clear);
  const actions = h('div', { class: 'rg-actions' }, undoBtn, clearBtn);

  shell.body.append(h('div', { class: 'rg-page' }, artWrap, swatches, layouts, actions));

  function pick(i: number, focus = true): void {
    color = SWATCHES[i]!;
    swatchBtns.forEach((b, k) => { b.setAttribute('aria-checked', String(k === i)); b.setAttribute('tabindex', k === i ? '0' : '-1'); });
    if (focus) swatchBtns[i]!.focus({ preventScroll: true });
    refreshLabels();
  }

  function chooseLayout(i: number, focus = true): void {
    design = setLayout(design, LAYOUTS[i]!.id);
    if (focus) layoutBtns[i]!.focus({ preventScroll: true });
    build();
  }

  function labelFor(g: Group): string {
    const owned = SWATCHES.find((s) => s.id === design.fills[g.id]);
    return fill(COPY.groupLabel, {
      ring: g.ring + 1, shape: COPY.shapeNames[g.kind], n: g.index + 1, color: color.name,
      state: owned ? fill(COPY.stateFilled, { color: owned.name }) : COPY.stateEmpty,
    });
  }

  function pour(g: Group): void {
    const before = design;
    design = paint(design, g.id, color.id);
    ctx.announce(fill(COPY.poured, { color: color.name }));
    render();
    if (before === design || !shell.full()) return;
    for (const s of nodes.get(g.id)!.shapes) {
      s.classList.remove('is-puff');
      void s.getBoundingClientRect();
      s.classList.add('is-puff');
    }
  }

  function build(): void {
    nodes.clear();
    const parts: SVGElement[] = [
      svg('circle', { class: 'rg-floor', r: DISC_RADIUS }),
      svg('circle', { class: 'rg-edge', r: DISC_RADIUS - 3 }),
    ];
    for (const g of buildGroups(layoutById(design.layout))) {
      const shapes: SVGElement[] = [];
      const kids = g.members.map((m) => {
        const shape = g.dot
          ? svg('circle', { class: 'rg-shape', cy: g.dot[0], r: g.dot[1] })
          : svg('path', { class: 'rg-shape', d: g.path });
        shapes.push(shape);
        return svg('g', { transform: `rotate(${m.angle})` }, shape);
      });
      const el = svg('g', { class: 'rg-group', role: 'button', tabindex: '0' }, ...kids);
      el.addEventListener('click', () => pour(g));
      el.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        pour(g);
      });
      nodes.set(g.id, { el, shapes });
      parts.push(el);
    }
    parts.push(svg('circle', { class: 'rg-heart', r: 5 }));
    stage.replaceChildren(...parts);
    layoutBtns.forEach((b, k) => {
      const on = LAYOUTS[k]!.id === design.layout;
      b.setAttribute('aria-checked', String(on));
      b.setAttribute('tabindex', on ? '0' : '-1');
    });
    render();
  }

  function render(): void {
    for (const g of buildGroups(layoutById(design.layout))) {
      const n = nodes.get(g.id)!;
      const hex = SWATCHES.find((s) => s.id === design.fills[g.id])?.hex;
      for (const s of n.shapes) {
        if (hex) { s.setAttribute('fill', hex); s.classList.remove('is-empty'); } else { s.removeAttribute('fill'); s.classList.add('is-empty'); }
      }
      n.el.setAttribute('aria-label', labelFor(g));
    }
    undoBtn.disabled = !canUndo(design);
    clearBtn.disabled = filledCount(design) === 0;
  }

  function refreshLabels(): void {
    for (const g of buildGroups(layoutById(design.layout))) nodes.get(g.id)!.el.setAttribute('aria-label', labelFor(g));
  }

  build();
  return { el: shell.root, destroy: () => shell.destroy() };
}
