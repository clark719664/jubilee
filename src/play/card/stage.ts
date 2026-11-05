/**
 * stage.ts — the card on screen and everything fingers and keys do to it.
 *
 * The card is a little book: the FRONT is a cover hinged on its left edge whose back is the "info" page
 * (what the greeting means), and the INSIDE page lies under it. Turning to the inside swings the cover
 * open (full motion) or cross-fades (reduced motion). On wide screens the open card shows both inside
 * pages side by side; on a phone the cover swings away and the inside page fills the stage.
 *
 * Stickers: drag with one finger, pinch with two to resize and turn, or use the corner handle (one
 * finger turns and resizes). Keyboard: Tab to a sticker, arrows move (Shift: further), + and − resize,
 * R / Shift+R turn, [ and ] change the pile, Delete takes it off, Escape lets go.
 * Pen: in drawing mode the ink canvas takes the pointer; with keys, arrows move a pen cursor and Space
 * puts the pen down or lifts it.
 */
import { h } from '../../ui/dom';
import { COPY } from './copy';
import { glyph } from './glyphs';
import { FaceView } from './face';
import { applyNudge, findSticker, finishStroke, fromHandle, fromPinch, nudgeFor, PANEL_H, PANEL_W, clamp, type CardSpec, type FaceId, type Placed, type Stroke } from './model';
import { panelCanvas, type Assets, type CardEnv } from './raster';

export interface StageCtl {
  card(): CardSpec;
  face(): FaceId;
  selected(): string | null;
  select(id: string | null, quiet?: boolean): void;
  /** A finished change to one sticker (end of a drag / a key press). */
  commitSticker(face: FaceId, p: Placed): void;
  removeSelected(): void;
  restackSelected(by: number): void;
  commitStroke(face: FaceId, s: Stroke): void;
  pen(): { readonly on: boolean; readonly color: string; readonly width: number };
  penOff(): void;
  labelFor(p: Placed): string;
  announce(text: string): void;
  motion(): boolean;
  onGhost(field: 'to' | 'message' | 'from'): void;
}

interface Pointer { x: number; y: number; x0: number; y0: number }

export class Stage {
  readonly el: HTMLElement;
  readonly front: FaceView;
  readonly inside: FaceView;
  private readonly book: HTMLElement;
  private readonly cover: HTMLElement;
  private readonly info: HTMLElement;
  private readonly handle: HTMLElement;
  private readonly cursor: HTMLElement;
  private readonly ro: ResizeObserver | null;
  private u = 1;
  private wide = false;
  private assets: Assets = { scene: [], stickers: new Map() };
  // gesture state
  private readonly pointers = new Map<number, Pointer>();
  private drag: { id: string; face: FaceId; start: Placed; live: Placed; mode: 'move' | 'pinch' | 'handle'; moved: boolean; pinch?: { a: number; b: number; a0: Pointer; b0: Pointer } } | null = null;
  private stroke: { face: FaceId; raw: number[]; color: string; width: number } | null = null;
  private keyPen = { x: PANEL_W / 2, y: PANEL_H / 2, down: false };

  constructor(private readonly env: CardEnv, private readonly ctl: StageCtl) {
    const common = { env, labelFor: (p: Placed) => ctl.labelFor(p) };
    this.front = new FaceView({ face: 'front', ...common });
    this.inside = new FaceView({ face: 'inside', ...common, onGhost: (f) => ctl.onGhost(f) });
    this.info = h('div', { class: 'cm-info', 'aria-hidden': 'true' });
    this.cover = h('div', { class: 'cm-cover' },
      h('div', { class: 'cm-side cm-side-front' }, this.front.el),
      h('div', { class: 'cm-side cm-side-back' }, this.info));
    this.book = h('div', { class: 'cm-book' }, h('div', { class: 'cm-page' }, this.inside.el), this.cover);
    this.handle = h('span', { class: 'cm-handle', 'aria-hidden': 'true', title: COPY.resizeHandle, hidden: true }, h('span', { class: 'cm-handle-dot' }, glyph('turnRight', 16)));
    this.cursor = h('span', { class: 'cm-pen-cursor', 'aria-hidden': 'true', hidden: true });
    this.el = h('div', { class: 'cm-stage' }, h('div', { class: 'cm-desk' }, this.book), this.handle,
      h('p', { class: 'sr-only', id: 'cm-st-help' }, COPY.stickerHelp));
    this.inside.el.append(this.cursor);

    for (const f of [this.front, this.inside]) {
      f.layer.addEventListener('pointerdown', (e) => this.onStickerDown(e, f));
      f.layer.addEventListener('focusin', (e) => this.onStickerFocus(e));
      f.layer.addEventListener('keydown', (e) => this.onStickerKey(e));
      f.ink.addEventListener('pointerdown', (e) => this.onPenDown(e, f));
      f.ink.addEventListener('keydown', (e) => this.onPenKey(e, f));
      f.el.addEventListener('pointerdown', (e) => {
        if (e.target === f.el || (e.target as HTMLElement).classList.contains('cm-base') || (e.target as HTMLElement).classList.contains('cm-layer')) ctl.select(null);
      });
    }
    this.handle.addEventListener('pointerdown', (e) => this.onHandleDown(e));
    this.el.addEventListener('pointerdown', (e) => this.onSecondFinger(e));
    this.el.addEventListener('pointermove', (e) => this.onMove(e));
    this.el.addEventListener('pointerup', (e) => this.onUp(e));
    this.el.addEventListener('pointercancel', (e) => this.onUp(e));
    this.ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.layout()) : null;
    this.ro?.observe(this.el);
  }

  destroy(): void {
    this.ro?.disconnect();
  }

  faceView(face: FaceId): FaceView {
    return face === 'front' ? this.front : this.inside;
  }

  setAssets(a: Assets): void {
    this.assets = a;
    this.front.setAssets(a);
    this.inside.setAssets(a);
    this.paintInfo();
  }

  /** Fits the card to the stage: one panel, or the open spread when there is room for it. */
  layout(): void {
    const W = this.el.clientWidth - 24;
    const H = this.el.clientHeight - 24;
    if (W <= 0 || H <= 0) return;
    const single = Math.min(W / PANEL_W, H / PANEL_H);
    const spread = Math.min(W / (PANEL_W * 2 + 8), H / PANEL_H);
    this.wide = spread >= single * 0.76;
    // The front gets the whole stage; the open card (both inside pages) gets the spread size.
    const u = this.wide && this.ctl.face() === 'inside' ? spread : single;
    this.u = u;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.el.style.setProperty('--u', String(u));
    this.el.classList.toggle('is-wide', this.wide);
    this.front.setSize(u, dpr);
    this.inside.setSize(u, dpr);
    this.paintInfo();
    this.syncHandle();
  }

  private infoTimer = 0;
  paintInfo(): void {
    // The info page is decoration only; repaint it lazily after words change.
    window.clearTimeout(this.infoTimer);
    this.infoTimer = window.setTimeout(() => {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const c = panelCanvas('info', this.ctl.card(), this.env, this.assets, this.u * dpr);
      c.className = 'cm-info-canvas';
      this.info.replaceChildren(c);
    }, 60);
  }

  /** Shows the front or the inside (turning the cover). */
  showFace(face: FaceId): void {
    this.book.classList.toggle('is-open', face === 'inside');
    this.front.el.inert = face !== 'front';
    this.inside.el.inert = face !== 'inside';
    this.layout();
  }

  render(card: CardSpec, selected: string | null, force = false): void {
    this.front.render(card, this.ctl.face() === 'front' ? selected : null, force);
    this.inside.render(card, this.ctl.face() === 'inside' ? selected : null, force);
    this.syncPen();
    this.syncHandle();
  }

  focusSelected(): void {
    const id = this.ctl.selected();
    if (id) this.faceView(this.ctl.face()).stickerEl(id)?.focus({ preventScroll: true });
  }

  // ─────────────────────────────────────────── geometry

  private toUnits(f: FaceView, clientX: number, clientY: number): { x: number; y: number } {
    const r = f.el.getBoundingClientRect();
    const u = r.width / PANEL_W || this.u;
    return { x: (clientX - r.left) / u, y: (clientY - r.top) / u };
  }

  private current(): Placed | null {
    const id = this.ctl.selected();
    if (!id) return null;
    if (this.drag && this.drag.id === id) return this.drag.live;
    return findSticker(this.ctl.card(), this.ctl.face(), id) ?? null;
  }

  /** Puts the corner handle on the selected sticker's bottom-right corner (rotated with it). */
  syncHandle(): void {
    const p = this.current();
    const f = this.faceView(this.ctl.face());
    if (!p || this.ctl.pen().on) { this.handle.hidden = true; return; }
    const fr = f.el.getBoundingClientRect();
    const sr = this.el.getBoundingClientRect();
    const u = fr.width / PANEL_W || this.u;
    const a = ((p.r + 45) * Math.PI) / 180;
    const d = (p.s / 2) * Math.SQRT2;
    const x = fr.left - sr.left + (p.x + Math.cos(a) * d) * u;
    const y = fr.top - sr.top + (p.y + Math.sin(a) * d) * u;
    this.handle.hidden = false;
    // The sticker toolbar moves to the other end of the stage so it never covers the sticker it edits.
    this.el.classList.toggle('sel-low', p.y > PANEL_H * 0.55);
    this.handle.style.left = `${x}px`;
    this.handle.style.top = `${y}px`;
  }

  // ─────────────────────────────────────────── sticker gestures

  private stickerFrom(e: Event): HTMLElement | null {
    return (e.target as HTMLElement | null)?.closest<HTMLElement>('.cm-st') ?? null;
  }

  private onStickerFocus(e: FocusEvent): void {
    const el = this.stickerFrom(e);
    const id = el?.dataset.id;
    if (id && id !== this.ctl.selected()) this.ctl.select(id, true);
  }

  private onStickerDown(e: PointerEvent, f: FaceView): void {
    const el = this.stickerFrom(e);
    const id = el?.dataset.id;
    if (!el || !id || this.ctl.pen().on) return;
    e.preventDefault();
    const face = this.ctl.face();
    const p = findSticker(this.ctl.card(), face, id);
    if (!p) return;
    // A second finger while dragging becomes a pinch (handled by the stage listener below).
    if (this.drag) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    try { this.el.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    if (id !== this.ctl.selected()) this.ctl.select(id, true);
    el.focus({ preventScroll: true });
    this.drag = { id, face, start: p, live: p, mode: 'move', moved: false };
    el.classList.add('is-dragging');
    void f;
  }

  /** Two fingers anywhere on the stage while one holds a sticker: pinch to resize and turn it. */
  private onSecondFinger(e: PointerEvent): void {
    const d = this.drag;
    if (!d || d.mode === 'handle' || this.pointers.has(e.pointerId) || this.pointers.size !== 1) return;
    e.preventDefault();
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    try { this.el.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    const [a, b] = [...this.pointers.keys()] as [number, number];
    this.drag = { ...d, start: d.live, mode: 'pinch', pinch: { a, b, a0: { ...this.pointers.get(a)! }, b0: { ...this.pointers.get(b)! } } };
  }

  private onHandleDown(e: PointerEvent): void {
    const p = this.current();
    if (!p) return;
    e.preventDefault();
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    try { this.el.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    this.drag = { id: p.id, face: this.ctl.face(), start: p, live: p, mode: 'handle', moved: false };
  }

  private onMove(e: PointerEvent): void {
    if (this.stroke) { this.extendStroke(e); return; }
    const ptr = this.pointers.get(e.pointerId);
    const d = this.drag;
    if (!ptr || !d) return;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    const f = this.faceView(d.face);
    const u = f.el.getBoundingClientRect().width / PANEL_W || this.u;
    let next = d.live;
    if (d.mode === 'move') {
      if (!d.moved && Math.hypot(ptr.x - ptr.x0, ptr.y - ptr.y0) < 4) return;
      d.moved = true;
      next = { ...d.start, x: d.start.x + (ptr.x - ptr.x0) / u, y: d.start.y + (ptr.y - ptr.y0) / u };
      next = applyNudge(next, {});
    } else if (d.mode === 'handle') {
      d.moved = true;
      const at = this.toUnits(f, ptr.x, ptr.y);
      next = { ...d.start, ...fromHandle(d.start.x, d.start.y, at.x, at.y) };
    } else if (d.pinch) {
      d.moved = true;
      const a = this.pointers.get(d.pinch.a);
      const b = this.pointers.get(d.pinch.b);
      if (!a || !b) return;
      const s = (q: Pointer): { x: number; y: number } => ({ x: q.x / u, y: q.y / u });
      next = fromPinch(d.start, s(d.pinch.a0), s(d.pinch.b0), s(a), s(b));
    }
    d.live = next;
    f.place(next);
    this.syncHandle();
  }

  private onUp(e: PointerEvent): void {
    if (this.stroke) { this.endStroke(); return; }
    this.pointers.delete(e.pointerId);
    const d = this.drag;
    if (!d) return;
    if (d.mode === 'pinch' && this.pointers.size === 1) {
      // One finger left: carry on dragging from here.
      const [id] = [...this.pointers.keys()] as [number];
      const q = this.pointers.get(id)!;
      q.x0 = q.x; q.y0 = q.y;
      this.drag = { ...d, start: d.live, mode: 'move', moved: true };
      return;
    }
    if (this.pointers.size > 0) return;
    this.drag = null;
    this.faceView(d.face).stickerEl(d.id)?.classList.remove('is-dragging');
    if (d.moved) this.ctl.commitSticker(d.face, d.live);
  }

  private onStickerKey(e: KeyboardEvent): void {
    const el = this.stickerFrom(e);
    const id = el?.dataset.id;
    if (!id) return;
    const face = this.ctl.face();
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this.ctl.removeSelected(); return; }
    if (e.key === ']' || e.key === '[') { e.preventDefault(); this.ctl.restackSelected(e.key === ']' ? 1 : -1); return; }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.ctl.select(null); this.faceView(face).el.closest<HTMLElement>('.cm-stage')?.focus({ preventScroll: true }); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const n = nudgeFor(e.key, e.shiftKey);
    if (!n) return;
    e.preventDefault();
    const p = findSticker(this.ctl.card(), face, id);
    if (p) this.ctl.commitSticker(face, applyNudge(p, n));
  }

  // ─────────────────────────────────────────── pen

  syncPen(): void {
    const pen = this.ctl.pen();
    const face = this.ctl.face();
    for (const f of [this.front, this.inside]) {
      const on = pen.on && f === this.faceView(face);
      f.el.classList.toggle('is-pen', on);
      f.ink.tabIndex = on ? 0 : -1;
      if (on) { f.ink.setAttribute('role', 'application'); f.ink.setAttribute('aria-label', COPY.penKeys); }
      else { f.ink.removeAttribute('role'); f.ink.removeAttribute('aria-label'); }
    }
    if (!pen.on) { this.keyPen.down = false; this.cursor.hidden = true; }
    this.el.classList.toggle('is-pen', pen.on);
  }

  focusPen(): void {
    const f = this.faceView(this.ctl.face());
    f.ink.focus({ preventScroll: true });
  }

  private onPenDown(e: PointerEvent, f: FaceView): void {
    const pen = this.ctl.pen();
    if (!pen.on) return;
    e.preventDefault();
    try { this.el.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    const at = this.toUnits(f, e.clientX, e.clientY);
    this.stroke = { face: this.ctl.face(), raw: [at.x, at.y], color: pen.color, width: pen.width };
    this.paintLive();
  }

  private extendStroke(e: PointerEvent): void {
    const s = this.stroke;
    if (!s) return;
    const f = this.faceView(s.face);
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    for (const ev of events.length > 0 ? events : [e]) {
      const at = this.toUnits(f, ev.clientX, ev.clientY);
      s.raw.push(clamp(at.x, -10, PANEL_W + 10), clamp(at.y, -10, PANEL_H + 10));
    }
    this.paintLive();
  }

  private paintLive(): void {
    const s = this.stroke;
    if (!s) return;
    const f = this.faceView(s.face);
    const face = s.face === 'front' ? this.ctl.card().front : this.ctl.card().inside;
    f.paintInk(face.strokes, { c: s.color, w: s.width, p: s.raw });
  }

  private endStroke(): void {
    const s = this.stroke;
    this.stroke = null;
    if (!s) return;
    const done = finishStroke(s.raw, s.color, s.width);
    if (done) this.ctl.commitStroke(s.face, done);
    else this.faceView(s.face).paintInk((s.face === 'front' ? this.ctl.card().front : this.ctl.card().inside).strokes, null);
  }

  private moveCursor(): void {
    const f = this.faceView(this.ctl.face());
    if (this.cursor.parentElement !== f.el) f.el.append(this.cursor);
    this.cursor.hidden = false;
    this.cursor.classList.toggle('is-down', this.keyPen.down);
    this.cursor.style.setProperty('--x', String(this.keyPen.x));
    this.cursor.style.setProperty('--y', String(this.keyPen.y));
    this.cursor.style.setProperty('--c', this.ctl.pen().color);
  }

  private onPenKey(e: KeyboardEvent, f: FaceView): void {
    if (!this.ctl.pen().on) return;
    const k = this.keyPen;
    const step = e.shiftKey ? 24 : 6;
    let dx = 0;
    let dy = 0;
    switch (e.key) {
      case 'ArrowLeft': dx = -step; break;
      case 'ArrowRight': dx = step; break;
      case 'ArrowUp': dy = -step; break;
      case 'ArrowDown': dy = step; break;
      case ' ': case 'Enter':
        e.preventDefault();
        if (k.down) { k.down = false; this.endStroke(); this.ctl.announce(COPY.sayPenUp); }
        else {
          const pen = this.ctl.pen();
          k.down = true;
          this.stroke = { face: this.ctl.face(), raw: [k.x, k.y], color: pen.color, width: pen.width };
          this.paintLive();
          this.ctl.announce(COPY.sayPenDown);
        }
        this.moveCursor();
        return;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        if (k.down) { k.down = false; this.endStroke(); }
        this.ctl.penOff();
        return;
      default: return;
    }
    e.preventDefault();
    k.x = clamp(k.x + dx, 0, PANEL_W);
    k.y = clamp(k.y + dy, 0, PANEL_H);
    if (k.down && this.stroke) { this.stroke.raw.push(k.x, k.y); this.paintLive(); }
    this.moveCursor();
    void f;
  }
}
