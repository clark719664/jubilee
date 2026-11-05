/**
 * setup.ts — the "pick a board" screen: a fanned hand of this deck's stickers, which stickers to play
 * with, a "count my flips" switch for big kids, and three big picture buttons (3×4, 4×4, 4×5) that
 * start the game straight away. Every control is a ≥ 48 px button with a visible label.
 */
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { stickerArt } from './card';
import { COPY, fill } from './copy';
import { BOARDS, type BoardSize, type MemorySticker } from './deck';

export type DeckChoice = 'season' | 'mine';

export interface SetupOptions {
  deck: DeckChoice;
  countFlips: boolean;
}

export interface SetupProps {
  readonly holidayName: string;
  readonly holidayEmoji: string;
  readonly mineAvailable: boolean;
  readonly options: SetupOptions;
  readonly deckFor: (choice: DeckChoice) => readonly MemorySticker[];
  readonly onPick: (board: BoardSize) => void;
}

export interface SetupView {
  readonly el: HTMLElement;
  focusFirst(): void;
}

/** A fanned hand of three face-up stickers with one face-down card peeking from behind. */
function fan(stickers: readonly MemorySticker[], backEmoji: string): HTMLElement {
  // The holiday's own sticker sits in the middle, in front.
  const hand = [stickers[1], stickers[0], stickers[2]].filter((s): s is MemorySticker => s !== undefined);
  const cards = hand.map((s, k) => h('span', { class: `mem-fan-card mem-fan-${k}` }, stickerArt(s)));
  return h('div', { class: 'mem-fan', 'aria-hidden': 'true' },
    h('span', { class: 'mem-fan-card mem-fan-back sky' }, h('span', { class: 'mem-emblem' }, h('span', { class: 'emoji' }, backEmoji))),
    ...cards,
  );
}

/** Tiny picture of a board: cols × rows card backs, two of them peeking face up. */
function miniBoard(b: BoardSize, stickers: readonly MemorySticker[], backEmoji: string): HTMLElement {
  const n = b.cols * b.rows;
  const peeks = new Map<number, MemorySticker | undefined>([[1, stickers[0]], [n - 2, stickers[1]]]);
  const cells: HTMLElement[] = [];
  for (let i = 0; i < n; i++) {
    const s = peeks.get(i);
    cells.push(s
      ? h('span', { class: 'mem-mini-card is-up' }, h('span', { class: 'emoji' }, s.emoji))
      : h('span', { class: 'mem-mini-card sky' }, i === 0 ? h('span', { class: 'emoji mem-mini-emblem' }, backEmoji) : null));
  }
  return h('span', { class: 'mem-mini', style: `--cols:${b.cols}`, 'aria-hidden': 'true' }, ...cells);
}

export function setupPanel(p: SetupProps): SetupView {
  const opts = p.options;
  const fanHost = h('div', { class: 'mem-fan-host' });
  const boardsRow = h('div', { class: 'mem-boards' });
  const boardButtons: HTMLButtonElement[] = [];

  const renderPreview = (): void => {
    const deck = p.deckFor(opts.deck);
    fanHost.replaceChildren(fan(deck, p.holidayEmoji));
    boardsRow.replaceChildren();
    boardButtons.length = 0;
    for (const b of BOARDS) {
      const copy = COPY.boards[b.id];
      const btn = h('button', {
        type: 'button', class: `mem-board-btn mem-board-${b.id}`,
        'aria-label': fill(COPY.boardLabel, { name: copy.name, pairs: b.pairs, cols: b.cols, rows: b.rows }),
        onclick: () => p.onPick(b),
      },
      miniBoard(b, deck, p.holidayEmoji),
      h('span', { class: 'mem-board-name' }, copy.name),
      h('span', { class: 'mem-board-pairs' }, fill(COPY.pairsN, { n: b.pairs })),
      h('span', { class: 'mem-board-note' }, copy.note));
      boardButtons.push(btn);
      boardsRow.append(btn);
    }
  };

  const deckButtons: HTMLButtonElement[] = [];
  const deckBtn = (choice: DeckChoice, emoji: string, text: string): HTMLButtonElement => {
    const b = h('button', {
      type: 'button', class: 'mem-choice', 'aria-pressed': opts.deck === choice ? 'true' : 'false',
      onclick: () => {
        opts.deck = choice;
        for (const d of deckButtons) d.setAttribute('aria-pressed', d === b ? 'true' : 'false');
        renderPreview();
      },
    }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, emoji), h('span', {}, text));
    deckButtons.push(b);
    return b;
  };

  const flipsSwitch = h('button', {
    type: 'button', role: 'switch', class: 'mem-switch', 'aria-checked': opts.countFlips ? 'true' : 'false',
    onclick: () => {
      opts.countFlips = !opts.countFlips;
      flipsSwitch.setAttribute('aria-checked', opts.countFlips ? 'true' : 'false');
    },
  }, h('span', { class: 'mem-switch-track', 'aria-hidden': 'true' }, h('span', { class: 'mem-switch-knob' })), h('span', {}, COPY.countFlips));

  const deckRow = p.mineAvailable
    ? h('div', { class: 'mem-choices', role: 'group', 'aria-label': COPY.deckTitle },
      deckBtn('season', p.holidayEmoji, fill(COPY.deckSeason, { holiday: p.holidayName })),
      deckBtn('mine', '⭐', COPY.deckMine))
    : null;

  renderPreview();

  const el = h('div', { class: 'mem-setup' },
    h('div', { class: 'mem-setup-hero' },
      fanHost,
      h('p', { class: 'mem-tagline' }, COPY.tagline)),
    h('div', { class: 'mem-options' }, deckRow, flipsSwitch),
    h('h2', { class: 'mem-pick h3' }, icon('play', 20), COPY.pickBoard),
    boardsRow,
  );
  return { el, focusFirst: () => boardButtons[0]?.focus() };
}
