/**
 * compose.ts — the live paper and the tray of picture wishes.
 *
 * The paper holds the salutation, the wishes picked so far (as stickers; tap one to take it off), a
 * free-text box, the "I've been kind by…" line on Santa's letter and the sign-off with the child's
 * stored first name. The tray is a grid of toggle buttons with a roving tabindex: arrows move, Home/End
 * jump, Enter/Space picks. With full motion a picked picture hops from the tray onto the paper.
 */
import type { MotionMode } from '../../effects/types';
import { h } from '../../ui/dom';
import { chipIcon } from './chip-icons';
import { COPY, fill } from './copy';
import { KIND_MAX, TEXT_BODY_MAX, toggleChip, type Draft } from './letter';
import { salutationOf } from './paper';
import type { Skin, WishChip } from './skins';
import { stampArt } from './art';

export interface ComposeOptions {
  readonly skin: Skin;
  readonly name: string | undefined;
  readonly draft: Draft;
  readonly motion: () => MotionMode;
  readonly announce: (text: string) => void;
  readonly onChange: () => void;
}

export interface ComposeView {
  readonly paper: HTMLElement;
  readonly tray: HTMLElement;
  /** Focus the first wish picture (or the text box when the tray is empty). */
  focusFirst(): void;
  /** Wipe the paper for a new wish. */
  reset(): void;
}

const ARROWS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

export function compose(opts: ComposeOptions): ComposeView {
  const { skin, draft } = opts;
  const full = (): boolean => opts.motion() === 'full';

  // ── the tray ──
  const chipEls = new Map<string, HTMLButtonElement>();
  const counter = h('span', { class: 'wish-tray-count', 'aria-live': 'off' });
  const grid = h('div', { class: 'wish-chips', role: 'group', 'aria-label': fill(COPY.chipsGroup, { title: skin.pickTitle, n: skin.chips.length }) });
  let roving = 0;
  skin.chips.forEach((c, i) => {
    const b = h('button', {
      type: 'button', class: 'wish-chip', 'aria-pressed': 'false', tabindex: i === 0 ? '0' : '-1', 'data-chip': c.id,
      onclick: () => pick(c, b),
    }, h('span', { class: 'wish-chip-art' }, chipIcon(c.icon, 48)), h('span', { class: 'wish-chip-label' }, c.label),
    h('span', { class: 'wish-chip-check', 'aria-hidden': 'true' }));
    chipEls.set(c.id, b);
    grid.append(b);
  });
  grid.addEventListener('keydown', (e) => {
    if (!ARROWS.has(e.key)) return;
    e.preventDefault();
    const items = [...chipEls.values()];
    const top = items[0]?.offsetTop ?? 0;
    const cols = Math.max(1, items.filter((x) => x.offsetTop === top).length);
    const n = items.length;
    let i = roving;
    if (e.key === 'ArrowLeft') i = Math.max(0, i - 1);
    else if (e.key === 'ArrowRight') i = Math.min(n - 1, i + 1);
    else if (e.key === 'ArrowUp') i = i - cols >= 0 ? i - cols : i;
    else if (e.key === 'ArrowDown') i = i + cols < n ? i + cols : i;
    else if (e.key === 'Home') i = 0;
    else i = n - 1;
    setRoving(i, true);
  });
  const tray = h('section', { class: 'wish-tray', 'aria-labeledby': 'wish-tray-title' },
    h('div', { class: 'wish-tray-head' }, h('h2', { class: 'wish-tray-title', id: 'wish-tray-title' }, skin.pickTitle), counter),
    grid);

  function setRoving(i: number, focus: boolean): void {
    roving = i;
    [...chipEls.values()].forEach((b, k) => b.setAttribute('tabindex', k === i ? '0' : '-1'));
    if (focus) [...chipEls.values()][i]?.focus({ preventScroll: false });
  }

  // ── the paper ──
  const list = h('ul', { class: 'wish-list', 'aria-label': COPY.wishList });
  // The empty wish zone is a shortcut to the tray (on a phone the tray sits below the paper).
  const empty = h('button', {
    type: 'button', class: 'wish-list-empty',
    onclick: () => {
      tray.scrollIntoView({ behavior: full() ? 'smooth' : 'auto', block: 'start' });
      [...chipEls.values()][roving]?.focus({ preventScroll: true });
    },
  }, skin.listEmpty);
  const listWrap = h('div', { class: 'wish-list-wrap' }, h('p', { class: 'wish-lead' }, skin.listLead), list, empty);
  const textId = 'wish-text';
  const left = h('span', { class: 'wish-left', 'aria-live': 'polite' });
  const text = h('textarea', {
    id: textId, class: 'wish-textarea', rows: 3, maxLength: TEXT_BODY_MAX, placeholder: skin.textPlaceholder, spellcheck: true,
    oninput: () => { draft.text = text.value; updateLeft(); opts.onChange(); },
  });
  const kindInput = skin.kindLabel ? h('input', {
    type: 'text', id: 'wish-kind', class: 'wish-kind-input', maxLength: KIND_MAX, autocomplete: 'off', enterKeyHint: 'done',
    oninput: () => { draft.kind = kindInput!.value; opts.onChange(); },
  }) : null;
  const salutation = h('p', { class: 'wish-salutation', id: 'wish-salutation' }, salutationOf(skin, draft.to ? { to: draft.to } : {}));
  const toRow = skin.toPicks && skin.toPicks.length > 0 ? h('div', { class: 'wish-to', role: 'group', 'aria-label': COPY.toLabel },
    ...skin.toPicks.map((who) => {
      const b = h('button', {
        type: 'button', class: 'wish-to-pick', 'aria-pressed': 'false',
        onclick: () => {
          draft.to = draft.to === who ? '' : who;
          for (const x of toRow!.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x.textContent === draft.to));
          salutation.textContent = salutationOf(skin, draft.to ? { to: draft.to } : {});
          opts.onChange();
        },
      }, who);
      return b;
    })) : null;

  const paper = h('article', { class: 'wish-paper', 'data-skin': skin.id, 'aria-labeledby': 'wish-salutation' },
    skin.id === 'santa' ? h('div', { class: 'wish-paper-stamp', 'aria-hidden': 'true' }, stampArt()) : null,
    salutation,
    toRow ? h('p', { class: 'wish-to-label' }, COPY.toLabel) : null,
    toRow,
    listWrap,
    h('label', { class: 'wish-label', for: textId }, skin.textLabel),
    text,
    left,
    kindInput ? h('label', { class: 'wish-label wish-kind-label', for: 'wish-kind' }, skin.kindLabel ?? '') : null,
    kindInput,
    h('p', { class: 'wish-sign' }, skin.signoff, h('br'), h('span', { class: 'wish-sign-name' }, opts.name ?? COPY.me)),
  );

  function updateLeft(): void {
    const n = TEXT_BODY_MAX - text.value.length;
    left.textContent = n <= 80 ? fill(COPY.charsLeft, { n }) : '';
  }

  function stickerFor(c: WishChip): HTMLElement {
    const b = h('button', {
      type: 'button', class: 'wish-sticker', 'aria-label': fill(COPY.remove, { label: c.label }), 'data-chip': c.id,
      onclick: () => { const src = chipEls.get(c.id); if (src) pick(c, src, true); },
    }, chipIcon(c.icon, 56), h('span', { class: 'wish-sticker-label', 'aria-hidden': 'true' }, c.label));
    return h('li', {}, b);
  }

  function renderList(added: string | null): void {
    list.replaceChildren(...draft.chips.map((id) => {
      const c = skin.chips.find((x) => x.id === id)!;
      const li = stickerFor(c);
      if (id === added) li.classList.add('is-new');
      return li;
    }));
    empty.hidden = draft.chips.length > 0;
    list.hidden = draft.chips.length === 0;
    counter.textContent = fill(COPY.chosen, { n: draft.chips.length, max: skin.maxChips });
    for (const [id, b] of chipEls) {
      const on = draft.chips.includes(id);
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('is-picked', on);
    }
    grid.classList.toggle('is-full', draft.chips.length >= skin.maxChips);
  }

  function pick(c: WishChip, from: HTMLButtonElement, fromPaper = false): void {
    const out = toggleChip(draft.chips, c.id, skin.maxChips);
    if (out.full) {
      from.classList.remove('is-nope');
      void from.offsetWidth;
      from.classList.add('is-nope');
      opts.announce(COPY.chipFull);
      flashHint(COPY.chipFull);
      return;
    }
    const adding = out.chips.length > draft.chips.length;
    draft.chips = out.chips;
    renderList(adding ? c.id : null);
    if (adding) hop(c, from);
    opts.announce(adding ? fill(COPY.sayAdded, { label: c.label, n: draft.chips.length }) : fill(COPY.sayRemoved, { label: c.label }));
    if (fromPaper) {
      // The sticker that was tapped is gone; keep focus somewhere sensible on the paper.
      const next = list.querySelector<HTMLButtonElement>('button') ?? text;
      next.focus({ preventScroll: true });
    }
    opts.onChange();
  }

  /** The picture hops from the tray onto the paper (full motion, and only when both are on screen). */
  function hop(c: WishChip, from: HTMLElement): void {
    const target = list.querySelector<HTMLElement>(`[data-chip="${c.id}"]`);
    if (!full() || !target || typeof document.body.animate !== 'function') return;
    const a = from.querySelector('svg')?.getBoundingClientRect();
    const b = target.querySelector('svg')?.getBoundingClientRect();
    if (!a || !b || b.top < 0 || b.bottom > window.innerHeight) return;
    const ghost = chipIcon(c.icon, 48);
    ghost.classList.add('wish-ghost');
    ghost.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`;
    document.body.append(ghost);
    target.style.opacity = '0';
    const dx = b.left - a.left;
    const dy = b.top - a.top;
    const k = b.width / a.width;
    ghost.animate([
      { transform: 'translate(0,0) scale(1) rotate(0)' },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 70}px) scale(${(1 + k) / 2 + 0.25}) rotate(-12deg)`, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(${k}) rotate(0)` },
    ], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => { ghost.remove(); target.style.opacity = ''; };
  }

  let hintTimer = 0;
  const hint = h('p', { class: 'wish-hint', role: 'status' });
  tray.append(hint);
  function flashHint(s: string): void {
    hint.textContent = s;
    hint.classList.add('is-on');
    window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => hint.classList.remove('is-on'), 2600);
  }

  renderList(null);
  updateLeft();

  return {
    paper,
    tray,
    focusFirst() {
      const first = [...chipEls.values()][roving];
      (first ?? text).focus({ preventScroll: true });
    },
    reset() {
      draft.chips = [];
      draft.text = '';
      draft.kind = '';
      draft.to = '';
      text.value = '';
      if (kindInput) kindInput.value = '';
      if (toRow) for (const x of toRow.querySelectorAll('button')) x.setAttribute('aria-pressed', 'false');
      salutation.textContent = salutationOf(skin, {});
      setRoving(0, false);
      renderList(null);
      updateLeft();
    },
  };
}
