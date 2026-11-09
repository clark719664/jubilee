/**
 * editor.ts — the card palette and the program strip.
 *
 * The strip is one ordered list of cards with an insertion caret (a dashed "next card goes here" slot).
 * Tapping a palette card drops it at the caret; tapping a strip card moves the caret just after it, so a
 * child can build inside a repeat (adding a repeat puts the caret inside it, before its End card) and
 * step out by tapping End. Cards can also be dragged in from the palette, dragged along the strip, or
 * dragged off it to remove them.
 *
 * Keyboard: palette cards are buttons (Enter adds at the caret). Strip cards are a roving-tabindex list:
 * ←/→ (or ↑/↓) move between cards (and the caret with them), Home/End jump, Shift+arrow moves the card
 * itself, Space or Enter picks a card up so plain arrows move it (Enter or Space puts it down, Esc puts
 * it back where it was), Delete/Backspace removes. The program always stays well formed: a move that
 * would leave an End before its Repeat (or nest too deep) is refused, said out loud and the card shakes.
 *
 * Nothing in the strip moves under a finger: focusing a card never moves the caret (only a tap or the
 * arrow keys do), and while dragging, the drop point is a thin marker over a frozen layout.
 */
import { h } from '../../ui/dom';
import { cardFace, cardKind, cardName } from './cards';
import { plural } from '../../i18n/index';
import { COPY, COUNTS, fill } from './copy';
import { balanced, cardCount, depths, insertCard, isRepeat, MAX_DEPTH, maxDepth, moveCard, moveCardTo, partners, removeCard, type Card, type LoopMark } from './model';

export interface EditorOptions {
  /** Called after every change to the program. */
  readonly onChange: (cards: readonly Card[]) => void;
  readonly announce: (text: string) => void;
  readonly full: () => boolean;
}

const DRAG_START = 8;

/** A drop point while dragging: the index it would land at and the marker's place (client px). */
interface DropSpot { readonly index: number; readonly x: number; readonly top: number; readonly height: number }

interface Drag {
  readonly from: 'palette' | 'strip';
  readonly card: Card;
  readonly index: number;
  readonly source: HTMLElement;
  readonly x0: number;
  readonly y0: number;
  ghost: HTMLElement | null;
  drop: number | null;
  /** The strip's item boxes when the drag began (the layout does not change while dragging). */
  rects: DOMRect[];
  box: DOMRect | null;
}

export class ProgramEditor {
  readonly palette: HTMLElement;
  readonly strip: HTMLElement;
  readonly tools: HTMLElement;
  readonly meter: HTMLElement;
  readonly note: HTMLElement;
  private readonly list: HTMLOListElement;
  private readonly caretEl: HTMLLIElement;
  private readonly dropMark: HTMLElement;
  private readonly empty: HTMLElement;
  private readonly btnEarlier: HTMLButtonElement;
  private readonly btnLater: HTMLButtonElement;
  private readonly btnRemove: HTMLButtonElement;
  private readonly btnClear: HTMLButtonElement;
  private max = 1;
  private cards: Card[] = [];
  private caret = 0;
  private focusIdx = 0;
  private grabbed: number | null = null;
  /** The program and index when a card was picked up, so Esc can put it back. */
  private grabStart: { cards: Card[]; index: number } | null = null;
  private locked = false;
  private items: HTMLLIElement[] = [];
  private drag: Drag | null = null;
  private swallowClick = false;
  private paletteButtons: HTMLButtonElement[] = [];

  constructor(private readonly opts: EditorOptions) {
    this.palette = h('div', { class: 'pth-palette', role: 'group', 'aria-label': COPY.palette });
    this.caretEl = h('li', { class: 'pth-caret', 'aria-hidden': 'true' }, h('span', { class: 'pth-caret-slot' }));
    this.list = h('ol', { class: 'pth-list', 'aria-label': COPY.strip, 'aria-describedby': 'pth-strip-keys' });
    this.empty = h('p', { class: 'pth-empty' }, COPY.stripEmpty);
    this.dropMark = h('span', { class: 'pth-dropmark', 'aria-hidden': 'true', hidden: true });
    this.strip = h('div', { class: 'pth-strip' }, this.list, this.empty, this.dropMark, h('p', { class: 'sr-only', id: 'pth-strip-keys' }, COPY.stripKeys));
    this.strip.addEventListener('click', (e) => {
      if (this.locked || this.swallow()) return;
      // A tap on the strip's empty space moves the caret to the end.
      if (!(e.target as Element).closest('.pth-card')) this.setCaret(this.cards.length);
    });
    this.list.addEventListener('keydown', (e) => this.onKey(e));
    this.list.addEventListener('focusin', (e) => {
      // Focus only moves the tab stop. Moving the caret here would shift the cards between a touch and
      // its click, so the tap would land on the wrong card; a tap moves it in the card's click handler.
      const li = (e.target as Element).closest('li');
      const i = li ? this.items.indexOf(li as HTMLLIElement) : -1;
      if (i >= 0 && this.grabbed === null) { this.focusIdx = i; this.roving(); }
    });
    this.list.addEventListener('focusout', () => {
      // Leaving the list puts a picked-up card down.
      window.setTimeout(() => { if (!this.list.contains(document.activeElement)) this.ungrab(false); }, 0);
    });
    // Tools are aria-disabled rather than disabled, so a focused tool keeps focus when it stops applying
    // (e.g. after moving the first card earlier or removing the last one).
    const tool = (label: string, text: string, glyph: string, fn: () => void): HTMLButtonElement => {
      const b: HTMLButtonElement = h('button', { type: 'button', class: 'btn btn-secondary pth-tool', 'aria-label': label, onclick: () => { if (!this.locked && b.getAttribute('aria-disabled') !== 'true') fn(); } },
        h('span', { class: 'pth-tool-glyph', 'aria-hidden': 'true' }, glyph), text ? h('span', { class: 'pth-tool-text' }, text) : null);
      return b;
    };
    this.btnEarlier = tool(COPY.moveEarlier, '', '◀', () => this.move(this.caret - 1, -1));
    this.btnLater = tool(COPY.moveLater, '', '▶', () => this.move(this.caret - 1, 1));
    this.btnRemove = tool(COPY.remove, '', '✕', () => this.remove(this.caret - 1));
    this.btnClear = tool(COPY.clearLabel, COPY.clear, '↺', () => this.clear());
    this.tools = h('div', { class: 'pth-tools' }, this.btnEarlier, this.btnLater, this.btnRemove, this.btnClear);
    this.meter = h('span', { class: 'pth-meter' });
    this.note = h('p', { class: 'pth-note', 'aria-live': 'off' });
  }

  get program(): readonly Card[] { return this.cards; }

  /** A new level: its cards on offer, its limit, and an empty strip. `fresh` cards get a "new" badge. */
  setLevel(offered: readonly Card[], max: number, fresh: ReadonlySet<Card>): void {
    this.max = max;
    this.paletteButtons = offered.map((card) => {
      const b = h('button', {
        type: 'button', class: `pth-card pth-pal${fresh.has(card) ? ' is-fresh' : ''}`, 'data-kind': cardKind(card),
        'aria-label': fill(COPY.add, { card: cardName(card) }),
      }, ...cardFace(card));
      b.addEventListener('click', () => { if (!this.swallow()) this.add(card); });
      b.addEventListener('pointerdown', (e) => this.pointerDown(e, 'palette', card, -1, b));
      return b;
    });
    this.palette.replaceChildren(...this.paletteButtons);
    this.setCards([], 0);
  }

  /** Replaces the program (e.g. after a level change). */
  setCards(cards: readonly Card[], caret = cards.length): void {
    this.cards = [...cards];
    this.caret = Math.max(0, Math.min(caret, this.cards.length));
    this.render();
  }

  /** Locks editing while Jubi walks. */
  lock(on: boolean): void {
    this.locked = on;
    this.ungrab(false);
    for (const b of this.paletteButtons) b.setAttribute('aria-disabled', String(on));
    this.strip.classList.toggle('is-locked', on);
    this.palette.classList.toggle('is-locked', on);
    if (!on) this.highlight(null, []);
    this.placeCaret(this.caret);
    this.syncTools();
  }

  /** Lights the running card (and the loop counters around it). */
  highlight(at: number | null, loops: readonly LoopMark[]): void {
    this.items.forEach((li, i) => {
      li.classList.toggle('is-running', i === at);
      const iter = li.querySelector<HTMLElement>('.pth-iter');
      const mark = loops.find((l) => l.at === i);
      if (iter) {
        iter.textContent = mark ? `${mark.iter}/${mark.of}` : '';
        iter.hidden = !mark;
      }
    });
  }

  /** Puts keyboard focus on the first palette card (after a new level, or when the strip empties). */
  focusPalette(): void {
    this.paletteButtons[0]?.focus({ preventScroll: true });
  }

  destroy(): void {
    this.drag?.ghost?.remove();
    this.drag = null;
  }

  // ── editing ──

  add(card: Card, at = this.caret): void {
    if (this.locked) return;
    if (cardCount(this.cards) >= this.max) {
      this.say(plural(this.max, COUNTS.sayFull, { max: this.max }));
      this.bumpMeter();
      return;
    }
    const { cards, focus } = insertCard(this.cards, card, at - 1);
    if (maxDepth(cards) > MAX_DEPTH) {
      this.say(COPY.tooDeep);
      return;
    }
    this.cards = cards;
    this.caret = focus + 1;
    this.render(focus);
    this.opts.onChange(this.cards);
    const n = cardCount(this.cards);
    this.say(isRepeat(card) ? fill(COPY.sayAddedRepeat, { card: cardName(card) }) : plural(this.max, COUNTS.sayAdded, { card: cardName(card), n, max: this.max }));
  }

  private remove(i: number): void {
    const card = this.cards[i];
    if (card === undefined) return;
    // Removing an End removes its Repeat (and vice versa); name the Repeat either way.
    const target = card === 'end' ? partners(this.cards)[i] ?? i : i;
    const named = this.cards[target] ?? card;
    const before = this.cards.length;
    this.cards = removeCard(this.cards, target);
    const removed = before - this.cards.length;
    this.caret = Math.max(0, Math.min(target, this.cards.length));
    const refocus = this.list.contains(document.activeElement);
    this.render();
    if (refocus) {
      if (this.cards.length > 0) this.focusCard(Math.min(target, this.cards.length - 1));
      else this.focusPalette();
    }
    this.opts.onChange(this.cards);
    if (removed > 0) this.say(plural(this.max, COUNTS.sayRemoved, { card: cardName(named), n: cardCount(this.cards), max: this.max }));
  }

  private move(i: number, by: -1 | 1): boolean {
    const next = moveCard(this.cards, i, by);
    if (!next) {
      // Off either end of the strip is just a no-op; anything else is a refused move, said and shown.
      if (i >= 0 && i < this.cards.length && i + by >= 0 && i + by < this.cards.length) {
        const tried = [...this.cards];
        [tried[i], tried[i + by]] = [tried[i + by]!, tried[i]!];
        this.refuse(i, tried);
      }
      return false;
    }
    this.cards = next;
    this.caret = i + by + 1;
    const refocus = this.list.contains(document.activeElement);
    this.render();
    if (refocus) this.focusCard(i + by);
    this.opts.onChange(this.cards);
    this.say(fill(COPY.dropped, { card: this.nameAt(i + by), n: i + by + 1, total: this.cards.length }));
    return true;
  }

  /** A move that would break the program: say why, and give the card a little shake. */
  private refuse(i: number, tried: readonly Card[]): void {
    this.say(balanced(tried) ? COPY.tooDeep : COPY.cantMove);
    const li = this.items[i];
    if (!li) return;
    li.classList.remove('is-refused');
    void li.offsetWidth;
    li.classList.add('is-refused');
    window.setTimeout(() => li.classList.remove('is-refused'), 600);
  }

  /** A card's spoken name; an End card names the Repeat it closes ("End of Repeat 3 times"). */
  private nameAt(i: number): string {
    const card = this.cards[i];
    if (card === undefined) return '';
    if (card !== 'end') return cardName(card);
    const open = this.cards[partners(this.cards)[i] ?? -1];
    return open ? fill(COPY.endOf, { repeat: cardName(open) }) : cardName(card);
  }

  private clear(): void {
    if (this.cards.length === 0) return;
    this.setCards([], 0);
    this.opts.onChange(this.cards);
    this.say(COPY.sayCleared);
  }

  private setCaret(c: number): void {
    this.caret = Math.max(0, Math.min(c, this.cards.length));
    this.placeCaret(this.caret);
    this.items.forEach((li, i) => li.classList.toggle('is-selected', i === this.caret - 1));
    // While focus is elsewhere, the strip's tab stop follows the selected card.
    if (!this.list.contains(document.activeElement) && this.items.length > 0) {
      this.focusIdx = Math.max(0, Math.min(this.caret - 1, this.items.length - 1));
      this.roving();
    }
    this.syncTools();
  }

  // ── rendering ──

  private render(focusNew?: number): void {
    const d = depths(this.cards);
    const mates = partners(this.cards);
    this.items = this.cards.map((card, i) => {
      const depth = d[i] ?? 0;
      const label = fill(depth > 1 ? COPY.cardInside2 : depth > 0 ? COPY.cardInside : COPY.cardAt, { card: this.nameAt(i), n: i + 1, total: this.cards.length });
      const b = h('button', {
        type: 'button', class: 'pth-card pth-prog', 'data-kind': cardKind(card), tabindex: '-1', 'aria-label': label,
        onclick: () => { if (!this.locked && !this.swallow()) this.setCaret(i + 1); },
      }, ...(card === 'end' ? [h('span', { class: 'pth-card-word', 'aria-hidden': 'true' }, COPY.cards.end[0])] : cardFace(card)),
      isRepeat(card) ? h('span', { class: 'pth-iter', hidden: true, 'aria-hidden': 'true' }) : null);
      b.addEventListener('pointerdown', (e) => this.pointerDown(e, 'strip', card, i, b));
      const li = h('li', {
        class: `pth-step${isRepeat(card) ? ' is-open' : ''}${card === 'end' ? ' is-close' : ''}${isRepeat(card) && mates[i] === -1 ? ' is-unclosed' : ''}`,
        'data-depth': String(depth),
      }, b);
      if (focusNew === i && this.opts.full()) li.classList.add('is-new');
      return li;
    });
    this.list.replaceChildren(...this.items);
    this.empty.hidden = this.cards.length > 0;
    this.focusIdx = Math.min(this.focusIdx, Math.max(0, this.items.length - 1));
    this.roving();
    this.setCaret(this.caret);
    const n = cardCount(this.cards);
    this.meter.replaceChildren(
      h('span', { 'aria-hidden': 'true' }, plural(this.max, COUNTS.cardsUsed, { n, max: this.max })),
      h('span', { class: 'sr-only' }, plural(this.max, COUNTS.cardsUsedLabel, { n, max: this.max })));
    this.meter.classList.toggle('is-full', n >= this.max);
    this.list.setAttribute('aria-label', plural(this.max, COUNTS.stripLabel, { n, max: this.max }));
    this.note.textContent = n >= this.max ? plural(this.max, COUNTS.stripFull, { max: this.max }) : '';
    this.palette.classList.toggle('is-full', n >= this.max);
  }

  private placeCaret(at: number): void {
    const full = cardCount(this.cards) >= this.max;
    this.caretEl.hidden = full || this.locked;
    const ref = this.items[at] ?? null;
    if (this.caretEl.nextSibling !== ref || this.caretEl.parentNode !== this.list) this.list.insertBefore(this.caretEl, ref);
    const d = depths(this.cards);
    // The slot sits at the depth a card dropped there would have.
    const prev = this.cards[at - 1];
    const depth = prev === undefined ? 0 : (d[at - 1] ?? 0) + (isRepeat(prev) ? 1 : 0);
    this.caretEl.setAttribute('data-depth', String(depth));
  }

  private roving(): void {
    this.items.forEach((li, i) => li.querySelector('button')?.setAttribute('tabindex', i === this.focusIdx ? '0' : '-1'));
  }

  /** Keyboard focus to card `i`; the caret follows (just after it), as a tap would put it. */
  private focusCard(i: number): void {
    if (i < 0 || i >= this.items.length) return;
    this.focusIdx = i;
    this.roving();
    this.items[i]?.querySelector('button')?.focus({ preventScroll: false });
    if (this.grabbed === null) this.setCaret(i + 1);
  }

  private syncTools(): void {
    const sel = this.caret - 1;
    const has = sel >= 0 && sel < this.cards.length && !this.locked;
    const off = (b: HTMLButtonElement, v: boolean): void => b.setAttribute('aria-disabled', String(v));
    off(this.btnEarlier, !has || moveCard(this.cards, sel, -1) === null);
    off(this.btnLater, !has || moveCard(this.cards, sel, 1) === null);
    off(this.btnRemove, !has);
    off(this.btnClear, this.cards.length === 0 || this.locked);
  }

  private bumpMeter(): void {
    this.meter.classList.remove('is-bump');
    void this.meter.offsetWidth;
    this.meter.classList.add('is-bump');
  }

  private say(text: string): void {
    this.opts.announce(text);
  }

  // ── keyboard ──

  private onKey(e: KeyboardEvent): void {
    if (this.locked) return;
    // Ctrl/Cmd/Alt+Enter (run) belongs to the activity, not to the card under focus.
    if ((e.key === 'Enter' || e.key === ' ') && (e.ctrlKey || e.metaKey || e.altKey)) return;
    const i = this.focusIdx;
    const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
    const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    if (back || fwd) {
      e.preventDefault();
      const by = back ? -1 : 1;
      if (this.grabbed !== null || e.shiftKey || e.altKey) {
        const was = this.grabbed;
        if (this.move(i, by)) {
          if (was !== null) { this.grabbed = i + by; this.markGrab(); }
        }
        return;
      }
      this.focusCard(Math.max(0, Math.min(this.items.length - 1, i + by)));
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      if (this.grabbed === null) this.focusCard(e.key === 'Home' ? 0 : this.items.length - 1);
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (this.grabbed === null) {
        if (this.cards[i] === undefined) return;
        this.grabbed = i;
        this.grabStart = { cards: [...this.cards], index: i };
        this.markGrab();
        this.say(fill(COPY.grabbed, { card: this.nameAt(i) }));
      } else this.ungrab(true);
      return;
    }
    if (e.key === 'Escape' && this.grabbed !== null) {
      e.preventDefault();
      e.stopPropagation();
      this.putBack();
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.ungrab(false);
      this.remove(i);
    }
  }

  private markGrab(): void {
    this.items.forEach((li, k) => li.classList.toggle('is-grabbed', k === this.grabbed));
  }

  private ungrab(speak: boolean): void {
    if (this.grabbed === null) return;
    const i = this.grabbed;
    this.grabbed = null;
    this.grabStart = null;
    this.markGrab();
    this.setCaret(i + 1);
    if (speak) this.say(fill(COPY.dropped, { card: this.nameAt(i), n: i + 1, total: this.cards.length }));
  }

  /** Esc while carrying a card: the program goes back to how it was when the card was picked up. */
  private putBack(): void {
    const start = this.grabStart;
    this.grabbed = null;
    this.grabStart = null;
    if (!start) { this.markGrab(); return; }
    const changed = start.cards.length !== this.cards.length || start.cards.some((c, k) => c !== this.cards[k]);
    this.cards = start.cards;
    this.caret = start.index + 1;
    this.render();
    this.focusCard(start.index);
    if (changed) this.opts.onChange(this.cards);
    this.say(fill(COPY.putBack, { card: this.nameAt(start.index) }));
  }

  // ── dragging ──

  private swallow(): boolean {
    if (!this.swallowClick) return false;
    this.swallowClick = false;
    return true;
  }

  private pointerDown(e: PointerEvent, from: 'palette' | 'strip', card: Card, index: number, source: HTMLElement): void {
    if (this.locked || e.button !== 0) return;
    this.drag = { from, card, index, source, x0: e.clientX, y0: e.clientY, ghost: null, drop: null, rects: [], box: null };
    const move = (ev: PointerEvent): void => this.pointerMove(ev);
    const up = (ev: PointerEvent): void => {
      source.removeEventListener('pointermove', move);
      source.removeEventListener('pointerup', up);
      source.removeEventListener('pointercancel', up);
      this.pointerUp(ev, ev.type === 'pointercancel');
    };
    try { source.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    source.addEventListener('pointermove', move);
    source.addEventListener('pointerup', up);
    source.addEventListener('pointercancel', up);
  }

  private pointerMove(e: PointerEvent): void {
    const d = this.drag;
    if (!d) return;
    if (!d.ghost) {
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < DRAG_START) return;
      const r = d.source.getBoundingClientRect();
      d.ghost = d.source.cloneNode(true) as HTMLElement;
      d.ghost.classList.add('pth-ghost');
      d.ghost.removeAttribute('id');
      d.ghost.setAttribute('aria-hidden', 'true');
      d.ghost.style.width = `${r.width}px`;
      d.ghost.style.height = `${r.height}px`;
      document.body.append(d.ghost);
      if (d.from === 'strip') this.items[d.index]?.classList.add('is-dragging');
      // The caret slot only goes invisible (it keeps its room), so the cards stay exactly where they are
      // for the whole drag and the boxes taken now stay true.
      this.strip.classList.add('is-dropping');
      d.box = this.strip.getBoundingClientRect();
      d.rects = this.items.map((li) => li.getBoundingClientRect());
    }
    d.ghost.style.left = `${e.clientX}px`;
    d.ghost.style.top = `${e.clientY}px`;
    const spot = this.dropSpot(d, e.clientX, e.clientY);
    d.drop = spot?.index ?? null;
    this.showDropMark(d, spot);
    this.strip.classList.toggle('is-over', d.drop !== null);
    d.ghost.classList.toggle('is-away', d.from === 'strip' && d.drop === null);
  }

  private showDropMark(d: Drag, spot: DropSpot | null): void {
    const m = this.dropMark;
    if (!spot || !d.box) { m.hidden = true; return; }
    m.hidden = false;
    m.style.left = `${Math.round(spot.x - d.box.left)}px`;
    m.style.top = `${Math.round(spot.top - d.box.top)}px`;
    m.style.height = `${Math.round(spot.height)}px`;
  }

  private pointerUp(_e: PointerEvent, canceled: boolean): void {
    const d = this.drag;
    this.drag = null;
    if (!d || !d.ghost) return;
    d.ghost.remove();
    this.dropMark.hidden = true;
    this.strip.classList.remove('is-dropping', 'is-over');
    this.items[d.index]?.classList.remove('is-dragging');
    this.swallowClick = true;
    window.setTimeout(() => { this.swallowClick = false; }, 0);
    if (canceled) { this.placeCaret(this.caret); return; }
    if (d.from === 'palette') {
      if (d.drop === null) { this.placeCaret(this.caret); return; }
      this.add(d.card, d.drop);
      return;
    }
    if (d.drop === null) { this.remove(d.index); return; }
    if (d.drop === d.index) { this.placeCaret(this.caret); return; }
    const next = moveCardTo(this.cards, d.index, d.drop);
    if (!next) {
      const tried = [...this.cards];
      const [c] = tried.splice(d.index, 1);
      tried.splice(d.drop, 0, c!);
      this.placeCaret(this.caret);
      this.refuse(d.index, tried);
      return;
    }
    this.cards = next;
    this.caret = d.drop + 1;
    this.render();
    this.opts.onChange(this.cards);
    this.say(fill(COPY.dropped, { card: this.nameAt(d.drop), n: d.drop + 1, total: this.cards.length }));
  }

  /**
   * Where a card dropped at (x, y) would land: its index in the list without the dragged card, and where
   * to draw the marker; null when off the strip. Hit-tests the boxes taken when the drag began, in the
   * row nearest the pointer (so crossing the strip's top edge never jumps to the front).
   */
  private dropSpot(d: Drag, x: number, y: number): DropSpot | null {
    const box = d.box;
    if (!box) return null;
    const pad = 28;
    if (x < box.left - pad || x > box.right + pad || y < box.top - pad || y > box.bottom + pad) return null;
    const skip = d.from === 'strip' ? d.index : -1;
    const cards = d.rects.map((r, i) => ({ r, i })).filter((c) => c.i !== skip);
    if (cards.length === 0) return { index: 0, x: box.left + 8, top: box.top + 12, height: 60 };
    // Rows of cards, top to bottom.
    const rows: { top: number; bottom: number; cards: { r: DOMRect; k: number }[] }[] = [];
    cards.forEach(({ r }, k) => {
      const row = rows.find((w) => Math.abs(w.top - r.top) < r.height / 2);
      if (row) { row.cards.push({ r, k }); row.bottom = Math.max(row.bottom, r.bottom); } else rows.push({ top: r.top, bottom: r.bottom, cards: [{ r, k }] });
    });
    const dist = (w: { top: number; bottom: number }): number => (y < w.top ? w.top - y : y > w.bottom ? y - w.bottom : 0);
    const row = rows.reduce((a, w) => (dist(w) < dist(a) ? w : a));
    const inset = 4;
    const cardTop = (r: DOMRect): number => r.top + inset;
    const cardH = (r: DOMRect): number => Math.max(20, r.height - 21);
    for (const c of row.cards) {
      if (x < c.r.left + c.r.width / 2) return { index: c.k, x: c.r.left, top: cardTop(c.r), height: cardH(c.r) };
    }
    const last = row.cards[row.cards.length - 1]!;
    return { index: last.k + 1, x: last.r.right, top: cardTop(last.r), height: cardH(last.r) };
  }
}
