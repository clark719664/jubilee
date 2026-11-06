/**
 * render.ts — draws the catch and stack games onto a 2D canvas (DPR ≤ 2) from engine state, plus a
 * pooled particle layer for sparkles, confetti, plops and "+1" pops. Every sprite comes from the
 * shared sprite cache or the RasterCache, so a frame is mostly `drawImage` calls and allocates nothing.
 * Reduced motion: no particles (only a static "+1" that fades in place) and no shake.
 */
import { t } from '../../i18n/index';
import { ParticlePool } from '../../effects/particles';
import { mulberry32 } from '../../effects/rng';
import type { SpriteCacheImpl } from '../../effects/sprites';
import type { Theme } from '../../theme/themes';
import { roundRectPath } from '../../effects/painters/shapes';
import { RasterCache, basketBox, drawFace, paintBasketBack, paintBasketFront, paintPiece, PIECE_PAD } from './art';
import { BOUNCING, CAUGHT, type CatchGame, type FallingItem, LANDED, OOPS, PILE_SLOTS, SPECIAL } from './catch-engine';
import { spriteName } from './painters';
import { blend, type ItemDef, type Skin } from './skins';
import type { StackGame } from './stack-engine';

const SPARK = 0;
const CONFETTI = 1;
const PUFF = 2;
const TEXT = 3;
const RING = 4;
const TEXTS = ['+1', '+3'] as const;
const INK = '#1f1a3d';

export class Renderer {
  readonly fx = new ParticlePool(220);
  readonly raster: RasterCache;
  private readonly palette: string[];
  private readonly rand = mulberry32(99);
  private readonly items: readonly ItemDef[];
  private readonly oops: readonly ItemDef[];
  private readonly dark: boolean;
  private blinkT = 0;
  w = 0;
  h = 0;

  constructor(
    private readonly g: CanvasRenderingContext2D,
    private readonly sprites: SpriteCacheImpl,
    private readonly skin: Skin,
    private readonly theme: Theme,
    public dpr: number,
    public reduced: boolean,
  ) {
    this.raster = new RasterCache(dpr);
    this.items = skin.items;
    this.oops = skin.oops;
    this.dark = theme.mood === 'night';
    this.palette = [...new Set([...skin.items.map((d) => d.color), skin.special.color, '#ffd166', '#ffffff', theme.accent, theme.accent2])].slice(0, 12);
  }

  setScale(dpr: number): void {
    this.dpr = dpr;
    this.raster.setScale(dpr);
    this.sprites.setScale(dpr);
  }

  private colorIndex(c: string): number {
    const i = this.palette.indexOf(c);
    return i < 0 ? 0 : i;
  }

  // ---------------------------------------------------------------- particles

  sparkle(x: number, y: number, color: string, n = 9): void {
    if (this.reduced) return;
    const ci = this.colorIndex(color);
    for (let k = 0; k < n; k++) {
      const i = this.fx.alloc();
      if (i < 0) return;
      const a = (k / n) * Math.PI * 2 + this.rand() * 0.4;
      const v = 140 + this.rand() * 160;
      this.fx.x[i] = x; this.fx.y[i] = y;
      this.fx.vx[i] = Math.cos(a) * v; this.fx.vy[i] = Math.sin(a) * v - 120;
      this.fx.size[i] = 10 + this.rand() * 10;
      this.fx.rotV[i] = (this.rand() - 0.5) * 8;
      this.fx.maxLife[i] = 0.55 + this.rand() * 0.25;
      this.fx.kind[i] = k % 3 === 0 ? RING : SPARK;
      if (k % 3 === 0) { this.fx.size[i] = 22; this.fx.vx[i] *= 0.5; this.fx.vy[i] *= 0.5; }
      this.fx.color[i] = k % 2 ? ci : this.colorIndex('#ffd166');
    }
  }

  confetti(w: number): void {
    if (this.reduced) return;
    for (let k = 0; k < 60; k++) {
      const i = this.fx.alloc();
      if (i < 0) return;
      this.fx.x[i] = this.rand() * w; this.fx.y[i] = -10 - this.rand() * 120;
      this.fx.vx[i] = (this.rand() - 0.5) * 60; this.fx.vy[i] = 90 + this.rand() * 120;
      this.fx.size[i] = 9 + this.rand() * 6;
      this.fx.rot[i] = this.rand() * 6;
      this.fx.rotV[i] = (this.rand() - 0.5) * 10;
      this.fx.phase[i] = this.rand() * 6;
      this.fx.maxLife[i] = 2.4 + this.rand();
      this.fx.kind[i] = CONFETTI;
      this.fx.color[i] = Math.floor(this.rand() * this.palette.length);
    }
  }

  puff(x: number, y: number): void {
    if (this.reduced) return;
    for (let k = 0; k < 4; k++) {
      const i = this.fx.alloc();
      if (i < 0) return;
      this.fx.x[i] = x + (k - 1.5) * 8; this.fx.y[i] = y - 4;
      this.fx.vx[i] = (k - 1.5) * 30; this.fx.vy[i] = -20 - this.rand() * 20;
      this.fx.size[i] = 12 + this.rand() * 8;
      this.fx.maxLife[i] = 0.5;
      this.fx.kind[i] = PUFF;
      this.fx.color[i] = this.colorIndex('#ffffff');
    }
  }

  pop(x: number, y: number, three: boolean): void {
    const i = this.fx.alloc();
    if (i < 0) return;
    this.fx.x[i] = x; this.fx.y[i] = y;
    this.fx.vy[i] = this.reduced ? 0 : -70;
    this.fx.size[i] = three ? 40 : 30;
    this.fx.maxLife[i] = 0.8;
    this.fx.kind[i] = TEXT;
    this.fx.aux[i] = three ? 1 : 0;
  }

  stepFx(dt: number): void {
    const p = this.fx;
    for (let i = p.count - 1; i >= 0; i--) {
      const kind = p.kind[i]!;
      if (kind === CONFETTI) {
        p.phase[i]! += dt * 5;
        p.x[i]! += (p.vx[i]! + Math.sin(p.phase[i]!) * 40) * dt;
        p.y[i]! += p.vy[i]! * dt;
      } else if (kind === SPARK || kind === RING) {
        p.vy[i]! += 500 * dt;
        p.vx[i]! *= Math.exp(-3 * dt);
        p.x[i]! += p.vx[i]! * dt;
        p.y[i]! += p.vy[i]! * dt;
      } else {
        p.x[i]! += p.vx[i]! * dt;
        p.y[i]! += p.vy[i]! * dt;
        p.vy[i]! *= Math.exp(-2 * dt);
      }
      p.rot[i]! += p.rotV[i]! * dt;
      p.life[i]! += dt;
      if (p.life[i]! >= p.maxLife[i]! || p.y[i]! > this.h + 40) p.kill(i);
    }
  }

  private drawFx(ox: number, oy: number): void {
    const g = this.g;
    const p = this.fx;
    for (let i = 0; i < p.count; i++) {
      const k = p.life[i]! / p.maxLife[i]!;
      const kind = p.kind[i]!;
      const x = p.x[i]! + ox;
      const y = p.y[i]! + oy;
      const color = this.palette[p.color[i]!] ?? '#ffffff';
      if (kind === TEXT) {
        g.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
        const s = 1 + (this.reduced ? 0 : Math.max(0, 0.25 - k) * 2);
        this.popText(TEXTS[p.aux[i]! ? 1 : 0], x, y, p.size[i]! * s, p.aux[i]! ? '#ffd166' : '#ffffff');
      } else if (kind === CONFETTI) {
        g.globalAlpha = k > 0.8 ? (1 - k) * 5 : 1;
        this.sprites.draw(g, 'confettiRect', p.size[i]!, color, x, y, p.rot[i]!, Math.abs(Math.cos(p.phase[i]!)) + 0.15, 1);
      } else if (kind === PUFF) {
        g.globalAlpha = 0.7 * (1 - k);
        this.sprites.draw(g, 'circle', p.size[i]! * (1 + k), color, x, y);
      } else if (kind === RING) {
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.8 * (1 - k);
        this.sprites.draw(g, 'glow', p.size[i]! * (1 + k), color, x, y);
        g.globalCompositeOperation = 'source-over';
      } else {
        g.globalAlpha = 1 - k * k;
        this.sprites.draw(g, 'star', p.size[i]! * (1 - k * 0.5), color, x, y, p.rot[i]!);
      }
    }
    g.globalAlpha = 1;
  }

  /** "+1" in the display face: a light fill inside a thick ink rim, readable on any sky or scene. */
  private popText(text: string, x: number, y: number, size: number, fill: string): void {
    const g = this.g;
    g.font = `700 ${Math.round(size)}px Fredoka, ui-rounded, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = Math.max(4, size * 0.2);
    g.strokeStyle = INK;
    g.strokeText(t(text), x, y);
    g.fillStyle = fill;
    g.fillText(t(text), x, y);
  }

  // ---------------------------------------------------------------- shared

  clear(): void {
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /** A soft rolling ground with a lighter crest line. */
  private ground(top: number): void {
    if (top > this.h + 10) return;
    const g = this.g;
    const w = this.w;
    const col = this.skin.ground;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, top + 10);
    g.bezierCurveTo(w * 0.25, top - 10, w * 0.4, top + 14, w * 0.6, top + 4);
    g.bezierCurveTo(w * 0.78, top - 6, w * 0.9, top + 10, w, top);
    g.lineTo(w, this.h + 2);
    g.lineTo(0, this.h + 2);
    g.closePath();
    g.fill();
    g.strokeStyle = blend(col, '#ffffff', 0.35);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, top + 10);
    g.bezierCurveTo(w * 0.25, top - 10, w * 0.4, top + 14, w * 0.6, top + 4);
    g.bezierCurveTo(w * 0.78, top - 6, w * 0.9, top + 10, w, top);
    g.stroke();
  }

  private itemDef(it: FallingItem): ItemDef {
    if (it.cls === SPECIAL) return this.skin.special;
    const list = it.cls === OOPS ? this.oops : this.items;
    return list[it.def % Math.max(1, list.length)] ?? this.skin.special;
  }

  private drawItem(it: FallingItem, ox: number, oy: number, alpha = 1, scale = 1): void {
    const d = this.itemDef(it);
    const size = Math.round(it.size * (d.scale ?? 1) / 4) * 4;
    const g = this.g;
    if (it.cls === SPECIAL && !this.reduced) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.55 * alpha;
      this.sprites.draw(g, 'glow', size * 2, '#ffd166', it.x + ox, it.y + oy);
      g.globalCompositeOperation = 'source-over';
    }
    g.globalAlpha = alpha;
    this.sprites.draw(g, spriteName(d.sprite), size, d.color, it.x + ox, it.y + oy, it.rot, scale, scale);
    g.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- catch

  drawCatch(game: CatchGame, dt: number): void {
    this.w = game.w;
    this.h = game.h;
    this.clear();
    const g = this.g;
    const shake = this.reduced ? 0 : game.shake;
    const ox = shake > 0 ? Math.sin(performance.now() * 0.07) * 5 * shake : 0;
    const oy = shake > 0 ? Math.cos(performance.now() * 0.09) * 3 * shake : 0;
    this.ground(game.groundY + oy);

    const bw = game.basketW;
    const bh = game.basketH;
    const { bw: rw, bh: rh, ax, ay } = basketBox(bw, bh);
    const kind = this.skin.basket;
    const key = `${kind}|${Math.round(bw)}|${this.skin.basketColor}`;
    const back = this.raster.get(`b|${key}`, rw, rh, ax, ay, (c) => paintBasketBack(c, kind, bw, bh, this.skin.basketColor));
    const front = this.raster.get(`f|${key}`, rw, rh, ax, ay, (c) => paintBasketFront(c, kind, bw, bh, this.skin.basketColor));
    const bx = game.basketX + ox;
    const by = game.groundY + 6 + oy;
    const sq = this.reduced ? 0 : game.squash;
    const sx = 1 + sq * 0.08;
    const sy = 1 - sq * 0.1;
    const tilt = this.reduced ? 0 : game.tilt;
    const k = this.dpr;
    const c = Math.cos(tilt);
    const s = Math.sin(tilt);
    const basketAt = (img: CanvasImageSource): void => {
      g.setTransform(k * sx * c, k * sx * s, -k * sy * s, k * sy * c, k * bx, k * by);
      g.drawImage(img, -ax, -ay, rw, rh);
      g.setTransform(k, 0, 0, k, 0, 0);
    };

    // Shadow under the basket.
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.beginPath();
    g.ellipse(bx, by + 2, bw * 0.45, bh * 0.08, 0, 0, Math.PI * 2);
    g.fill();

    if (back) basketAt(back.img);
    // The pile: the last few caught things peeking over the rim.
    const mouth = game.mouthY + oy;
    for (let slot = 0; slot < PILE_SLOTS; slot++) {
      const code = game.pile[(game.pileHead + slot) % PILE_SLOTS]!;
      if (code < 0) continue;
      const cls = Math.floor(code / 64);
      const def = code % 64;
      const d = cls === SPECIAL ? this.skin.special : this.items[def % Math.max(1, this.items.length)];
      if (!d) continue;
      const col = slot % 4;
      const row = slot < 4 ? 1 : 0;
      const px = bx + (col - 1.5) * bw * 0.2 + (row ? bw * 0.08 : 0) + tilt * 40;
      const py = mouth + bh * 0.1 - row * bh * 0.16 + (slot % 2) * 3;
      this.sprites.draw(g, spriteName(d.sprite), Math.round(bw * 0.26 / 4) * 4, d.color, px, py, (slot - 3.5) * 0.12);
    }
    for (const it of game.items) {
      if (!it.active || it.state === BOUNCING) continue;
      if (it.state === CAUGHT) this.drawItem(it, ox, oy, 1, 1 - Math.min(1, it.t / 0.18) * 0.35);
      else if (it.state === LANDED) {
        const fade = Math.max(0, 1 - Math.max(0, it.t - 0.4) / 0.5);
        const squish = this.reduced ? 1 : 1 - Math.exp(-it.t * 10) * 0.25;
        this.drawItem(it, ox, oy, fade, squish);
      } else this.drawItem(it, ox, oy);
    }
    if (front) basketAt(front.img);

    // Face (follows the tilt a little; blinks every few seconds).
    this.blinkT += dt;
    const cyc = this.blinkT % 3.6;
    const blink = cyc > 3.45 ? Math.sin(((cyc - 3.45) / 0.15) * Math.PI) : 0;
    const fy = by - bh * (kind === 'sleigh' ? 0.46 : 0.42);
    drawFace(g, bx + tilt * bh * 0.4, fy, bw, { look: game.look, expecting: game.expecting, happy: game.happy, surprised: game.surprised, blink }, kind === 'pail');

    for (const it of game.items) if (it.active && it.state === BOUNCING) this.drawItem(it, ox, oy);
    this.drawFx(ox, oy);
  }

  // ---------------------------------------------------------------- stack

  private piece(w: number, h: number, colorIdx: number): { img: CanvasImageSource; w: number; h: number } | null {
    const color = this.skin.pieceColors[colorIdx % Math.max(1, this.skin.pieceColors.length)] ?? this.theme.accent;
    const kind = this.skin.piece;
    const qw = Math.round(w / 2) * 2;
    const qh = Math.round(h);
    const r = this.raster.get(`p|${kind}|${qw}|${qh}|${color}`, qw + PIECE_PAD * 2, qh + PIECE_PAD * 2, PIECE_PAD, PIECE_PAD, (c) => paintPiece(c, kind, qw, qh, color));
    return r ? { img: r.img, w: r.w, h: r.h } : null;
  }

  /** Draws a piece whose bottom-center is at (x, y) screen, rotated by rot. */
  private drawPiece(x: number, y: number, w: number, h: number, color: number, rot: number, sy = 1): void {
    const p = this.piece(w, h, color);
    if (!p) return;
    const g = this.g;
    const k = this.dpr;
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    g.setTransform(k * c, k * s, -k * s * sy, k * c * sy, k * x, k * y);
    g.drawImage(p.img, -p.w / 2, -p.h + PIECE_PAD, p.w, p.h);
    g.setTransform(k, 0, 0, k, 0, 0);
  }

  drawStack(game: StackGame, t: number, bestCount: number): void {
    this.w = game.w;
    this.h = game.h;
    this.clear();
    const g = this.g;
    const cx = game.w / 2;
    const floor = game.screenY(0);
    this.ground(game.groundY + game.camY);

    // Best-height flag: a friendly goal, never a judgement.
    if (bestCount > 0) {
      const by = game.screenY(bestCount * game.pieceH);
      if (by > 40 && by < game.h) {
        g.strokeStyle = this.dark ? 'rgba(255,255,255,0.5)' : 'rgba(31,26,61,0.4)';
        g.setLineDash([8, 8]);
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(cx - game.baseW * 0.9, by);
        g.lineTo(cx + game.baseW * 0.9, by);
        g.stroke();
        g.setLineDash([]);
        this.sprites.draw(g, 'glyph:🚩', 26, '#fff', cx + game.baseW * 0.9 + 14, by - 8);
      }
    }

    // Base: a cake stand / table in the basket color.
    if (floor < game.h + 40) {
      const bc = this.skin.basketColor;
      g.fillStyle = blend(bc, '#000000', 0.25);
      g.strokeStyle = INK;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx - game.baseW * 0.12, floor + game.baseH);
      g.lineTo(cx - game.baseW * 0.2, game.groundY + game.camY + 8);
      g.lineTo(cx + game.baseW * 0.2, game.groundY + game.camY + 8);
      g.lineTo(cx + game.baseW * 0.12, floor + game.baseH);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = bc;
      roundRectPath(g, cx - game.baseW / 2, floor, game.baseW, game.baseH, 13);
      g.fill();
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.3)';
      g.fillRect(cx - game.baseW / 2 + 12, floor + 5, game.baseW - 24, 5);
    }

    const breeze = this.reduced ? 0 : Math.sin(t * 1.3) * 0.004 * Math.min(1, game.count / 8);
    const lean = game.theta + breeze;
    for (let i = 0; i < game.count; i++) {
      const p = game.pieces[i]!;
      const sy = game.screenY(p.y);
      if (sy - p.h > game.h + 20 || sy < -80) continue;
      const shift = lean * (p.y + p.h / 2);
      const squash = this.reduced ? 1 : 1 - 0.18 * Math.exp(-p.t * 14);
      this.drawPiece(cx + p.x + shift, sy, p.w, p.h, p.color, lean, squash);
    }
    // A little face on the top piece: delighted when it lands, "whoa" when it leans.
    if (game.count > 0) {
      const p = game.pieces[game.count - 1]!;
      const shift = lean * (p.y + p.h / 2);
      const wob = Math.min(1, Math.abs(game.omega) * 8);
      drawFace(g, cx + p.x + shift, game.screenY(p.y) - p.h * 0.5, Math.min(p.w, p.h * 3.2), {
        look: Math.max(-1, Math.min(1, (game.hangX - p.x) / 120)), expecting: wob, happy: p.t < 0.6 ? 1 - p.t / 0.6 : 0, surprised: wob * 0.8, blink: 0,
      }, false);
    }

    for (const s of game.sliders) {
      if (!s.active) continue;
      g.globalAlpha = Math.max(0, 1 - Math.max(0, s.t - 1.4));
      this.drawPiece(cx + s.x, game.screenY(s.y), s.w, s.h, s.color, s.rot);
      g.globalAlpha = 1;
    }

    // Ribbon, drop guide and the hanging (or falling) piece.
    const hy = game.hangScreenY;
    if (game.hangReady) {
      const hx = cx + game.hangX;
      const top = game.screenY(game.top);
      g.strokeStyle = this.dark ? 'rgba(255,255,255,0.35)' : 'rgba(31,26,61,0.3)';
      g.setLineDash([4, 8]);
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(hx, hy + 6);
      g.lineTo(hx, Math.max(hy + 6, top - 6));
      g.stroke();
      g.setLineDash([]);
      g.strokeStyle = this.dark ? '#ffffff' : INK;
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(cx + game.hangX * 0.25, -4);
      g.quadraticCurveTo(cx + game.hangX * 0.7, hy * 0.5, hx, hy - game.hangH - 4);
      g.stroke();
      this.sprites.draw(g, 'glyph:🎀', 26, '#fff', hx, hy - game.hangH - 6);
      this.drawPiece(hx, hy, game.hangW, game.hangH, game.hangColor, this.reduced ? 0 : Math.sin(t * 2.4) * 0.03);
    }
    if (game.fallActive) {
      this.drawPiece(cx + game.fallX, game.screenY(game.fallY), game.fallW, game.fallH, game.fallColor, 0);
    }
    this.drawFx(0, 0);
  }
}

/** Small still pictures for the two mode buttons on the start card. */
export function paintPreview(canvas: HTMLCanvasElement, sprites: SpriteCacheImpl, skin: Skin, mode: 'catch' | 'stack', dpr: number): void {
  const w = 120;
  const h = 84;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const g = canvas.getContext('2d');
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (mode === 'catch') {
    const bw = 64;
    const bh = bw * 0.56;
    const { bw: rw, bh: rh, ax, ay } = basketBox(bw, bh);
    const raster = new RasterCache(dpr, 4);
    const back = raster.get('b', rw, rh, ax, ay, (c) => paintBasketBack(c, skin.basket, bw, bh, skin.basketColor));
    const front = raster.get('f', rw, rh, ax, ay, (c) => paintBasketFront(c, skin.basket, bw, bh, skin.basketColor));
    const bx = 60;
    const by = 80;
    if (back) g.drawImage(back.img, bx - ax, by - ay, rw, rh);
    const a = skin.items[0];
    const b = skin.items[1] ?? skin.special;
    if (a) sprites.draw(g, spriteName(a.sprite), 24, a.color, bx - 8, by - bh * 0.85, -0.2);
    if (front) g.drawImage(front.img, bx - ax, by - ay, rw, rh);
    sprites.draw(g, spriteName(b.sprite), 24, b.color, 26, 22, 0.3);
    sprites.draw(g, spriteName(skin.special.sprite), 24, skin.special.color, 96, 14, -0.2);
  } else {
    const raster = new RasterCache(dpr, 6);
    // Thin enough that three pieces plus the one on the ribbon fit with a clear gap between them
    // (overlapping pieces looked like a glitch at 3× zoom).
    const ph = 64 * (skin.piece === 'present' ? 0.28 : 0.24);
    const widths = [74, 62, 54];
    const offs = [0, -6, 5];
    let y = 82;
    widths.forEach((pw, i) => {
      const color = skin.pieceColors[i % skin.pieceColors.length] ?? '#ffd166';
      const qh = Math.round(ph);
      const r = raster.get(`p${i}`, pw + PIECE_PAD * 2, qh + PIECE_PAD * 2, PIECE_PAD, PIECE_PAD, (c) => paintPiece(c, skin.piece, pw, qh, color));
      if (r) g.drawImage(r.img, 60 + offs[i]! - r.w / 2, y - qh - PIECE_PAD, r.w, r.h);
      y -= qh;
    });
    const top = skin.pieceColors[3 % skin.pieceColors.length] ?? '#ffd166';
    const r = raster.get('hang', 52 + PIECE_PAD * 2, Math.round(ph) + PIECE_PAD * 2, PIECE_PAD, PIECE_PAD, (c) => paintPiece(c, skin.piece, 52, Math.round(ph), top));
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(92, 0);
    g.lineTo(92, 4);
    g.stroke();
    if (r) g.drawImage(r.img, 92 - r.w / 2, 4 - PIECE_PAD, r.w, r.h);
  }
}
