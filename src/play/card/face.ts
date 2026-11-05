/**
 * face.ts — one face of the card in the editor, at the screen's size.
 *
 *   base canvas   background + scene layers + words   (painted by raster.paintPanel, so it matches print)
 *   sticker layer one element per placed sticker      (real buttons: draggable, focusable, labelled)
 *   ink canvas    the pen strokes, on top              (repainted while drawing)
 *   ghost layer   dashed "Who is it for?" hints on an empty inside (editor only, never printed)
 *
 * Positions are panel units times `--u` (CSS px per unit), set by `setSize`. Canvases are painted at the
 * device pixel ratio (capped at 3) so lines stay crisp when a grown-up zooms in.
 */
import { stickerUrl } from '../../art/index';
import type { ThemeId } from '../../theme/themes';
import { h } from '../../ui/dom';
import { COPY, fill } from './copy';
import { faceOf, PANEL_H, PANEL_W, type CardSpec, type FaceId, type Placed, type StickerArt, type Stroke } from './model';
import { decorCanvas, paintEmojiDisc, paintStrokes } from './paint';
import { paintPanel, type Assets, type CardEnv } from './raster';

export interface StickerEl {
  readonly el: HTMLElement;
  readonly art: HTMLElement;
  /** Pixel bucket the decoration canvas was painted at. */
  px: number;
  key: string;
}

/** A holiday sticker's emoji disc painted at `px` device pixels (the same painter print uses). */
export function discCanvas(emoji: string, themeId: ThemeId, gold: boolean, px: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const side = Math.max(16, Math.min(1024, Math.round(px)));
  const c = h('canvas', { class: 'cm-dcanvas' });
  c.width = side;
  c.height = side;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(1, 0, 0, 1, side / 2, side / 2);
  paintEmojiDisc(ctx, side, { emoji, theme: themeId }, gold);
  return c;
}

/**
 * Art for any sticker at `px` device pixels: a decoration or emoji disc as a canvas, or the illustrated
 * holiday sticker as an <img> (which falls back to the disc if the file is missing or broken).
 */
export function artEl(art: StickerArt, px: number, env: Pick<CardEnv, 'holidayInfo' | 'earned'>): HTMLElement {
  const wrap = h('span', { class: 'cm-art', 'aria-hidden': 'true' });
  if (art.t === 'decor') {
    const c = decorCanvas(art.p, art.c, px);
    if (c) { c.className = 'cm-dcanvas'; wrap.append(c); }
    return wrap;
  }
  const info = env.holidayInfo(art.h, art.e);
  const gold = env.earned(art.h);
  const disc = (): void => { const c = discCanvas(info.emoji, info.theme, gold, px); if (c) wrap.replaceChildren(c); };
  const url = stickerUrl(art.h);
  if (!url) { disc(); return wrap; }
  if (gold) wrap.classList.add('is-gold');
  const img = h('img', { src: url, alt: '', draggable: 'false', decoding: 'async', class: 'cm-himg' });
  img.addEventListener('error', () => { wrap.classList.remove('is-gold'); disc(); });
  wrap.append(img);
  return wrap;
}

const bucket = (px: number): number => Math.min(1024, Math.max(64, Math.ceil(px / 64) * 64));

export interface FaceOptions {
  readonly face: FaceId;
  readonly env: CardEnv;
  readonly labelFor: (p: Placed) => string;
  readonly onGhost?: (field: 'to' | 'message' | 'from') => void;
}

export class FaceView {
  readonly el: HTMLElement;
  readonly layer: HTMLElement;
  readonly ink: HTMLCanvasElement;
  private readonly base: HTMLCanvasElement;
  private readonly ghosts: HTMLElement;
  private readonly els = new Map<string, StickerEl>();
  private u = 1;
  private dpr = 1;
  private card: CardSpec | null = null;
  private assets: Assets = { scene: [], stickers: new Map() };

  constructor(private readonly opts: FaceOptions) {
    this.base = h('canvas', { class: 'cm-base', 'aria-hidden': 'true' });
    this.layer = h('div', { class: 'cm-layer' });
    this.ink = h('canvas', { class: 'cm-ink', 'aria-hidden': 'true' });
    this.ghosts = h('div', { class: 'cm-ghosts' });
    this.el = h('div', { class: `cm-face cm-face-${opts.face}`, role: 'group', tabindex: -1, 'aria-label': opts.face === 'front' ? COPY.frontLabel : COPY.insideLabel },
      this.base, this.ghosts, this.layer, this.ink);
  }

  get unit(): number { return this.u; }

  setAssets(a: Assets): void {
    this.assets = a;
    if (this.card) this.paintBase(this.card);
  }

  setSize(u: number, dpr: number): void {
    if (Math.abs(u - this.u) < 1e-4 && dpr === this.dpr) return;
    this.u = u;
    this.dpr = Math.min(3, Math.max(1, dpr));
    this.el.style.setProperty('--u', String(u));
    for (const c of [this.base, this.ink]) {
      c.width = Math.round(PANEL_W * u * this.dpr);
      c.height = Math.round(PANEL_H * u * this.dpr);
    }
    if (this.card) this.render(this.card, null, true);
  }

  /** Full sync with the card: base canvas, sticker elements (diffed by id) and ink. */
  render(card: CardSpec, selected: string | null, force = false): void {
    const prev = this.card;
    this.card = card;
    const f = faceOf(card, this.opts.face);
    const baseChanged = force || !prev || prev.bg !== card.bg || prev.greeting !== card.greeting || prev.wordsAt !== card.wordsAt
      || prev.to !== card.to || prev.message !== card.message || prev.from !== card.from;
    if (baseChanged) { this.paintBase(card); this.syncGhosts(card); }
    this.syncStickers(f.stickers, selected);
    if (force || !prev || faceOf(prev, this.opts.face).strokes !== f.strokes) this.paintInk(f.strokes, null);
  }

  paintBase(card: CardSpec): void {
    const ctx = this.base.getContext('2d');
    if (!ctx) return;
    const k = this.u * this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.base.width, this.base.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    paintPanel(ctx, this.opts.face, card, this.opts.env, this.assets, k, { stickers: false, strokes: false });
  }

  paintInk(strokes: readonly Stroke[], live: Stroke | null): void {
    const ctx = this.ink.getContext('2d');
    if (!ctx) return;
    const k = this.u * this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.ink.width, this.ink.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    paintStrokes(ctx, strokes, live);
  }

  stickerEl(id: string): HTMLElement | null {
    return this.els.get(id)?.el ?? null;
  }

  /** Moves one sticker element without a full sync (live drag frames). */
  place(p: Placed): void {
    const s = this.els.get(p.id);
    if (!s) return;
    this.position(s, p);
  }

  private position(s: StickerEl, p: Placed): void {
    const st = s.el.style;
    st.setProperty('--x', String(p.x));
    st.setProperty('--y', String(p.y));
    st.setProperty('--s', String(p.s));
    st.setProperty('--r', String(p.r));
    const want = bucket(p.s * this.u * this.dpr);
    if (want > s.px && s.art.querySelector('canvas')) {
      s.px = want;
      s.art.replaceChildren(...artEl(p.art, want, this.opts.env).childNodes);
    }
  }

  private syncStickers(list: readonly Placed[], selected: string | null): void {
    const keep = new Set(list.map((p) => p.id));
    for (const [id, s] of this.els) if (!keep.has(id)) { s.el.remove(); this.els.delete(id); }
    list.forEach((p, i) => {
      const key = p.art.t === 'decor' ? `d|${p.art.p}|${p.art.c}` : `h|${p.art.h}|${this.opts.env.earned(p.art.h) ? 1 : 0}`;
      let s = this.els.get(p.id);
      if (s && s.key !== key) { s.el.remove(); this.els.delete(p.id); s = undefined; }
      if (!s) s = this.make(p, key);
      s.el.setAttribute('aria-label', this.opts.labelFor(p));
      s.el.classList.toggle('is-selected', p.id === selected);
      s.el.setAttribute('aria-pressed', p.id === selected ? 'true' : 'false');
      s.el.style.zIndex = String(i + 1);
      this.position(s, p);
      // Keep DOM order = paint order so Tab follows the pile from bottom to top.
      if (this.layer.children[i] !== s.el) this.layer.insertBefore(s.el, this.layer.children[i] ?? null);
    });
  }

  private make(p: Placed, key: string): StickerEl {
    const px = bucket(p.s * this.u * this.dpr);
    const art = artEl(p.art, px, this.opts.env);
    const el = h('button', { type: 'button', class: 'cm-st', 'data-id': p.id, 'aria-describedby': 'cm-st-help' }, art);
    const s: StickerEl = { el, art, px, key };
    this.els.set(p.id, s);
    return s;
  }

  private syncGhosts(card: CardSpec): void {
    if (this.opts.face !== 'inside' || !this.opts.onGhost) { this.ghosts.replaceChildren(); return; }
    const ghost = (field: 'to' | 'message' | 'from', text: string, y: number, hgt: number): HTMLElement =>
      h('button', { type: 'button', class: 'cm-ghost', style: `--gy:${y};--gh:${hgt}`, onclick: () => this.opts.onGhost?.(field) }, text);
    const list: HTMLElement[] = [];
    if (!card.to.trim()) list.push(ghost('to', COPY.ghostTo, 118, 64));
    if (!card.message.trim()) list.push(ghost('message', COPY.ghostMsg, 350, 120));
    if (!card.from.trim()) list.push(ghost('from', COPY.ghostFrom, 600, 64));
    this.ghosts.replaceChildren(...list);
  }
}

export function stickerLabel(p: Placed, labelOf: (p: Placed) => string): string {
  return fill(COPY.stickerLabel, { label: labelOf(p) });
}
