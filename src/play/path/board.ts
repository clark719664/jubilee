/**
 * board.ts — the puzzle board: a grid of ground tiles in the holiday's texture, the items, obstacles and
 * goal as sticker sprites, footprints where Jubi has walked, and Jubi herself on a layer above, with a
 * little arrow showing which way she faces.
 *
 * Jubi is moved with transforms only (translate for the cell, a hop or a nudge on an inner element, the
 * facing arrow rotated the short way round). Full motion tweens on the spring curve; any other motion
 * snaps straight to the new cell. The board itself is one labelled image for screen readers, with a
 * plain-words description of where everything is (kept current after every run).
 */
import type { MotionMode } from '../../effects/types';
import { h, svg } from '../../ui/dom';
import { mascot, type MascotState } from '../../ui/mascot';
import { COPY, fill } from './copy';
import type { Board, Dir, Frame, Pos } from './model';
import type { Skin } from './skins';
import { blockSprite, goalSprite, itemSprite, LIGHTS } from './sprites';

const SPRING = 'cubic-bezier(.2,.8,.2,1)';
/** Frame timings (ms) in full motion; other modes hold each frame for STILL_MS. */
export const TIMING = { step: 360, jump: 560, turn: 280, check: 420, bump: 520, bumpJump: 600 } as const;
export const STILL_MS = 420;

export class BoardView {
  readonly el: HTMLElement;
  private readonly grid: HTMLElement;
  private readonly layer: HTMLElement;
  private readonly jubi: HTMLElement;
  private readonly hopper: HTMLElement;
  private readonly arrow: HTMLElement;
  private readonly bubble: HTMLElement;
  /** Screen-reader description of the board; the view puts it next to the board. */
  readonly desc: HTMLElement;
  private cells: HTMLElement[] = [];
  private items: HTMLElement[] = [];
  private board: Board | null = null;
  private skin: Skin | null = null;
  private angle = 90;
  private pos: Pos = { x: 0, y: 0 };
  private cell = 56;
  private gap = 3;
  private face: MascotState = 'curious';
  private anims: Animation[] = [];

  constructor(private readonly motion: () => MotionMode) {
    this.grid = h('div', { class: 'pth-grid', 'aria-hidden': 'true' });
    this.arrow = h('div', { class: 'pth-facing', 'aria-hidden': 'true' },
      svg('svg', { viewBox: '0 0 20 14', class: 'pth-arrow' }, svg('path', { d: 'M2 12L10 2L18 12Z', fill: '#ffffff', stroke: '#2a1d3d', 'stroke-width': 2.4, 'stroke-linejoin': 'round' })));
    this.bubble = h('span', { class: 'pth-bubble', 'aria-hidden': 'true' }, '?');
    this.hopper = h('div', { class: 'pth-hopper' }, mascot('curious', 64));
    this.jubi = h('div', { class: 'pth-jubi', 'aria-hidden': 'true' }, this.arrow, this.hopper, this.bubble);
    this.layer = h('div', { class: 'pth-layer', 'aria-hidden': 'true' }, this.jubi);
    this.desc = h('p', { class: 'sr-only', id: 'pth-board-desc' });
    this.el = h('div', { class: 'pth-board', role: 'img', 'aria-label': COPY.board, 'aria-describedby': 'pth-board-desc' }, this.grid, this.layer);
  }

  /** Lays out a new level. */
  build(board: Board, skin: Skin): void {
    this.board = board;
    this.skin = skin;
    this.el.setAttribute('data-ground', skin.ground);
    this.el.style.setProperty('--cols', String(board.cols));
    this.el.style.setProperty('--rows', String(board.rows));
    this.cells = [];
    const kids: HTMLElement[] = [];
    for (let y = 0; y < board.rows; y++) {
      for (let x = 0; x < board.cols; x++) {
        const c = h('div', { class: `pth-cell${(x + y) % 2 ? ' is-alt' : ''}`, style: `grid-area:${y + 1}/${x + 1}` });
        this.cells.push(c);
        kids.push(c);
      }
    }
    const at = (p: Pos): string => `grid-area:${p.y + 1}/${p.x + 1}`;
    this.cellAt(board.start)?.classList.add('is-start');
    this.cellAt(board.goal)?.classList.add('is-goal');
    // Tiles under a sprite drop their ground texture (no stray dot beside a house or a hay bale).
    for (const p of [board.start, board.goal, ...board.blocks, ...board.items]) this.cellAt(p)?.classList.add('is-occupied');
    kids.push(h('div', { class: 'pth-thing pth-goal', style: at(board.goal) }, goalSprite(skin.goal)));
    for (const b of board.blocks) kids.push(h('div', { class: 'pth-thing pth-block', style: at(b) }, blockSprite(skin.block)));
    this.items = board.items.map((p, i) => h('div', {
      class: `pth-thing pth-item${LIGHTS.has(skin.item) ? ' is-light' : ' is-pickup'}`, style: `${at(p)};--i:${i}`,
    }, itemSprite(skin.item)));
    kids.push(...this.items);
    this.grid.replaceChildren(...kids);
    this.reset();
  }

  /** Sizes the board to fit (w × h) px. */
  fit(w: number, hgt: number): void {
    if (!this.board) return;
    const { cols, rows } = this.board;
    const gap = w < 420 ? 3 : 4;
    // 8px padding + 3px border on each side of the grid.
    const cell = Math.floor(Math.max(34, Math.min(104, (w - 24 - gap * (cols - 1)) / cols, (hgt - 26 - gap * (rows - 1)) / rows)));
    this.cell = cell;
    this.gap = gap;
    this.el.style.setProperty('--cell', `${cell}px`);
    this.el.style.setProperty('--gap', `${gap}px`);
    const size = Math.round(cell * 0.92);
    const m = this.hopper.querySelector('svg');
    if (m) { m.setAttribute('width', String(size)); m.setAttribute('height', String(size)); }
    this.place(this.pos, false);
  }

  /** Jubi back on the start, every item waiting, no footprints. */
  reset(): void {
    if (!this.board) return;
    this.stop();
    for (const c of this.cells) c.classList.remove('is-trail', 'is-bumped', 'is-hopped', 'is-checked');
    for (const it of this.items) it.classList.remove('is-done');
    this.angle = this.board.dir * 90;
    this.arrow.style.transform = `rotate(${this.angle}deg)`;
    this.setFace('curious');
    this.shrug(false);
    this.place(this.board.start, false);
    this.describe(this.board.start, this.board.dir, this.board.items.map(() => false));
  }

  /** Cancels any running tween (Stop, a new run, a new level). */
  stop(): void {
    for (const a of this.anims) a.cancel();
    this.anims = [];
  }

  setFace(state: MascotState): void {
    if (state === this.face) return;
    this.face = state;
    const size = Math.round(this.cell * 0.92);
    this.hopper.replaceChildren(mascot(state, size));
  }

  shrug(on: boolean): void {
    this.jubi.classList.toggle('is-shrug', on);
  }

  /** Plays one frame from `before`; returns how long to wait before the next. */
  show(f: Frame, before: { pos: Pos; dir: Dir }): number {
    const full = this.motion() === 'full';
    if (f.action === 'left' || f.action === 'right') {
      this.angle += f.action === 'right' ? 90 : -90;
      this.arrow.style.transform = `rotate(${this.angle}deg)`;
      this.arrow.classList.toggle('is-tween', full);
      return full ? TIMING.turn : STILL_MS;
    }
    if (f.action === 'check') {
      // A quick look ahead: the square in front blinks once (well under 3 Hz).
      const ahead = this.cellAhead(before.pos, before.dir);
      ahead?.classList.remove('is-checked');
      void ahead?.offsetWidth;
      ahead?.classList.add('is-checked');
      if (f.blocked) {
        this.angle += 90;
        this.arrow.style.transform = `rotate(${this.angle}deg)`;
        this.arrow.classList.toggle('is-tween', full);
      }
      return full ? TIMING.check : STILL_MS;
    }
    if (f.action === 'bump' || f.action === 'bumpJump') {
      if (f.toward) this.cellAt(f.toward)?.classList.add('is-bumped');
      if (full) {
        const dx = f.toward ? (f.toward.x - before.pos.x) : 0;
        const dy = f.toward ? (f.toward.y - before.pos.y) : 0;
        const k = f.action === 'bumpJump' ? 0.18 : 0.26;
        const nudge = `translate(${dx * k * this.cell}px, ${dy * k * this.cell}px)`;
        this.track(this.hopper.animate([
          { transform: 'none' },
          { transform: `${nudge}${f.action === 'bumpJump' ? ' translateY(-30%)' : ''} scale(1.06, .94)`, offset: 0.35 },
          { transform: 'translate(0,0) rotate(-6deg)', offset: 0.65 },
          { transform: 'rotate(4deg)', offset: 0.82 },
          { transform: 'none' },
        ], { duration: f.action === 'bumpJump' ? TIMING.bumpJump : TIMING.bump, easing: 'ease-out' }));
      }
      return full ? (f.action === 'bumpJump' ? TIMING.bumpJump : TIMING.bump) : STILL_MS;
    }
    // step or jump
    const ms = f.action === 'jump' ? TIMING.jump : TIMING.step;
    this.cellAt(before.pos)?.classList.add('is-trail');
    if (f.action === 'jump') {
      const mid = { x: (before.pos.x + f.pos.x) / 2, y: (before.pos.y + f.pos.y) / 2 };
      this.cellAt(mid)?.classList.add('is-hopped');
    }
    this.place(f.pos, full, ms);
    if (full) {
      this.track(this.hopper.animate(f.action === 'jump'
        ? [{ transform: 'none' }, { transform: 'translateY(-55%) scale(.96,1.06)', offset: 0.45 }, { transform: 'translateY(0) scale(1.08,.9)', offset: 0.85 }, { transform: 'none' }]
        : [{ transform: 'none' }, { transform: 'translateY(-10%)', offset: 0.45 }, { transform: 'none' }],
      { duration: ms, easing: 'ease-in-out' }));
    }
    if (f.collected !== undefined) this.collect(f.collected, full ? ms * 0.6 : 0);
    return full ? ms : STILL_MS;
  }

  /** Centre of item `i` (or Jubi) in client coordinates, for the sparkle burst. */
  centreOf(i: number | 'jubi'): { x: number; y: number } | null {
    const el = i === 'jubi' ? this.jubi : this.items[i];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /** Updates the screen-reader description to match where Jubi is now. */
  describe(pos: Pos, dir: Dir, done: readonly boolean[]): void {
    const b = this.board;
    const s = this.skin;
    if (!b || !s) return;
    const parts = [fill(COPY.describe, {
      cols: b.cols, rows: b.rows, row: pos.y + 1, col: pos.x + 1, facing: COPY.facing[dir] ?? '',
      goal: s.goalName.charAt(0).toUpperCase() + s.goalName.slice(1), grow: b.goal.y + 1, gcol: b.goal.x + 1,
    })];
    const waiting = b.items.filter((_, i) => !done[i]);
    if (waiting.length > 0) {
      parts.push(fill(COPY.describeItems, { list: waiting.map((p) => fill(COPY.describeItem, { one: s.one, row: p.y + 1, col: p.x + 1 })).join('; ') }));
    }
    if (b.blocks.length > 0) {
      const blocks = s.blocks.charAt(0).toUpperCase() + s.blocks.slice(1);
      parts.push(fill(COPY.describeBlocks, { Blocks: blocks, list: b.blocks.map((p) => fill(COPY.rowCol, { row: p.y + 1, col: p.x + 1 })).join(', ') }));
    }
    this.desc.textContent = parts.join(' ');
  }

  destroy(): void {
    this.stop();
  }

  // ── internals ──

  private collect(i: number, delay: number): void {
    const it = this.items[i];
    if (!it) return;
    if (delay > 0) window.setTimeout(() => it.classList.add('is-done'), delay);
    else it.classList.add('is-done');
  }

  private cellAt(p: Pos): HTMLElement | undefined {
    const b = this.board;
    if (!b || p.x < 0 || p.y < 0 || p.x >= b.cols || p.y >= b.rows) return undefined;
    return this.cells[p.y * b.cols + p.x];
  }

  private cellAhead(p: Pos, dir: Dir): HTMLElement | undefined {
    const dx = [0, 1, 0, -1][dir]!;
    const dy = [-1, 0, 1, 0][dir]!;
    return this.cellAt({ x: p.x + dx, y: p.y + dy });
  }

  private xy(p: Pos): string {
    const step = this.cell + this.gap;
    return `translate(${p.x * step}px, ${p.y * step}px)`;
  }

  private place(p: Pos, tween: boolean, ms: number = TIMING.step): void {
    const from = this.xy(this.pos);
    const to = this.xy(p);
    this.pos = p;
    this.jubi.style.transform = to;
    if (tween && typeof this.jubi.animate === 'function') {
      this.track(this.jubi.animate([{ transform: from }, { transform: to }], { duration: ms, easing: SPRING }));
    }
  }

  private track(a: Animation | undefined): void {
    if (!a) return;
    this.anims.push(a);
    a.onfinish = () => { this.anims = this.anims.filter((x) => x !== a); };
  }
}
