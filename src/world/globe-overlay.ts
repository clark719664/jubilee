/**
 * What floats over the planet: Santa's glowing trail, warm city lights on the night side,
 * markers (paper-outlined emoji stickers, dots, Santa's sleigh) with pulse rings, and label
 * pills. The renderer projects; this module only paints, from sprite caches, so a frame
 * allocates next to nothing.
 */
import { createSpriteCache, type SpriteCacheImpl } from '../effects/sprites';
import { withAlpha } from '../effects/painters/color';
import type { LonLat, MVec3 } from './geo';
import { labelSprite, paperGlyph, type LabelSprite } from './globe-paint';
import { nightAmount } from './night-draw';
import type { Equirectangular, Orthographic, PolyBuffer, Projected } from './projection';
import { SleighSprite } from './sleigh-draw';

/** What the layers painted over the planet need from the renderer: projections and scratch space. */
export interface SceneView {
  readonly mode: 'globe' | 'map';
  readonly ortho: Orthographic;
  readonly flat: Equirectangular;
  readonly lines: PolyBuffer;
  readonly tmp: Projected;
  readonly overlay: Overlay;
}

const RAD = 180 / Math.PI;

export interface GlobeMarker {
  readonly id?: string;
  lon: number;
  lat: number;
  /** Drawn as a paper-outlined sticker; otherwise a dot in `dot`. */
  readonly emoji?: string;
  readonly dot?: string;
  /** A painted sprite instead: Santa's sleigh (faces and tilts toward `toward`) or the sun. */
  readonly sprite?: 'sleigh' | 'sun';
  /** For sprites: a point a little further along the way. */
  toward?: LonLat | null;
  label?: string;
  /** CSS px (default 26 for emoji, 10 for dots, about a quarter of the globe for the sleigh). */
  readonly size?: number;
  /** Live markers get expanding rings (one still ring under reduced motion). */
  readonly pulse?: boolean;
}

/** A soft round light, gentler than the effects' `glow`: for glints, halos and lights. */
function softGlow(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  const r = size / 2;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, withAlpha(color, 1));
  g.addColorStop(0.3, withAlpha(color, 0.45));
  g.addColorStop(0.65, withAlpha(color, 0.12));
  g.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, size, size);
}

/** A smiling sun sticker: twelve rays, a warm disc and a white paper edge. */
function sunSticker(ctx: CanvasRenderingContext2D, size: number): void {
  const TAU = Math.PI * 2;
  const r = size * 0.25;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU - TAU / 4;
    const tip = i % 2 === 0 ? size * 0.47 : size * 0.39;
    ctx.moveTo(Math.cos(a - 0.2) * r, Math.sin(a - 0.2) * r);
    ctx.lineTo(Math.cos(a) * tip, Math.sin(a) * tip);
    ctx.lineTo(Math.cos(a + 0.2) * r, Math.sin(a + 0.2) * r);
    ctx.closePath();
  }
  ctx.moveTo(r, 0);
  ctx.arc(0, 0, r, 0, TAU);
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.1;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = '#ffb703';
  ctx.fill();
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 0, 0, 0, r);
  g.addColorStop(0, '#fff7d1');
  g.addColorStop(1, '#ffc93c');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = '#7a3e13';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * r * 0.36, -r * 0.12, r * 0.09, r * 0.13, 0, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, r * 0.08, r * 0.42, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#7a3e13';
  ctx.stroke();
}

const MAX_LABELS = 8;
const TILT_MAX = 0.45;

export class Overlay {
  readonly sprites: SpriteCacheImpl = createSpriteCache({ scale: 1, capacity: 128 });
  readonly sleigh: SleighSprite;
  private readonly labels = new Map<string, LabelSprite>();
  private dpr = 1;
  private ink = '#1f1a3d';
  /** Last screen heading of the sleigh, kept when it pauses on a stop. */
  private headingX = -1;
  private headingY = 0;

  constructor(onArt: () => void) {
    this.sleigh = new SleighSprite(onArt);
    this.sprites.register('world:soft', softGlow);
    this.sprites.register('world:sun', sunSticker);
  }

  setScale(dpr: number): void {
    if (dpr === this.dpr) return;
    this.dpr = dpr;
    this.sprites.setScale(dpr);
    this.labels.clear();
  }

  setInk(ink: string): void {
    if (ink === this.ink) return;
    this.ink = ink;
    this.labels.clear();
  }

  /** A soft light centred at (x, y); sizes snap to 4 px so zooming reuses rasters. */
  soft(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
    this.sprites.draw(ctx, 'world:soft', Math.max(4, Math.round(size / 4) * 4), color, x, y);
  }

  /**
   * Strokes whatever path the caller traced three times — a wide soft glow, a mid band and
   * a bright core — so a trail or the midnight line reads as light, not as a dashed rule.
   */
  glowStroke(ctx: CanvasRenderingContext2D, color: string, width: number, core = '#ffffff', intensity = 1, halo = 0): void {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = color;
    if (halo > 0) {
      // An extra-wide, faint band: the midnight line's "party happening here" glow.
      ctx.globalAlpha = 0.05 * intensity;
      ctx.lineWidth = width * halo;
      ctx.stroke();
    }
    ctx.globalAlpha = 0.12 * intensity;
    ctx.lineWidth = width * 4.5;
    ctx.stroke();
    ctx.globalAlpha = 0.28 * intensity;
    ctx.lineWidth = width * 2.2;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.95 * intensity;
    ctx.lineWidth = width * 0.8;
    ctx.strokeStyle = core;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
  }

  /** Adds every polyline in `buf` to the current path. */
  static trace(ctx: CanvasRenderingContext2D, buf: PolyBuffer, close: boolean): void {
    const p = buf.pts;
    for (let i = 0; i < buf.count; i++) {
      const s = buf.starts[i]!;
      const e = buf.endOf(i);
      ctx.moveTo(p[s]!, p[s + 1]!);
      for (let j = s + 2; j < e; j += 2) ctx.lineTo(p[j]!, p[j + 1]!);
      if (close) ctx.closePath();
    }
  }

  /** One city light: a warm halo with a bright core (call with 'lighter' compositing). */
  light(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number): void {
    ctx.globalAlpha = alpha * 0.85;
    this.soft(ctx, x, y, size * 2.2, color);
    ctx.globalAlpha = alpha;
    this.soft(ctx, x, y, size * 0.7, '#fff6dc');
  }

  /**
   * Warm lights for the listed cities on the night side, fading in through twilight. `lights`
   * holds unit vectors, `sizes` one base size per city, `sun` the subsolar unit vector.
   */
  cityLights(ctx: CanvasRenderingContext2D, v: SceneView, lights: Float32Array, sizes: Float32Array, sun: Readonly<MVec3>, color: string): void {
    if (lights.length === 0) return;
    const globe = v.mode === 'globe';
    const o = v.ortho;
    const W = v.flat.wrapWidth();
    const k = globe ? Math.max(0.75, Math.min(1.6, o.scale / 260)) : Math.max(0.6, Math.min(1.3, v.flat.scale / 3.2));
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < lights.length / 3; i++) {
      const x = lights[3 * i]!, y = lights[3 * i + 1]!, z = lights[3 * i + 2]!;
      const dark = nightAmount(x * sun[0] + y * sun[1] + z * sun[2]);
      if (dark < 0.05) continue;
      const size = sizes[i]! * k;
      if (globe) {
        const depth = o.depth(x, y, z);
        if (depth < 0.03) continue;
        o.projectVec(x, y, z, v.tmp);
        this.light(ctx, v.tmp.x, v.tmp.y, size, color, dark * Math.min(1, depth * 5));
      } else {
        v.flat.projectRaw(Math.atan2(y, x) * RAD, Math.atan2(z, Math.hypot(x, y)) * RAD, v.tmp);
        for (let c = -1; c <= 1; c++) {
          const px = v.tmp.x + c * W;
          if (px > -20 && px < v.flat.w + 20) this.light(ctx, px, v.tmp.y, size, color, dark);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /** Expanding rings for a live marker; `phase` 0..1 (a still ring when not animating). */
  pulse(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number, animate: boolean, seed: number, alpha: number, color = '#ffffff'): void {
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = color;
    const rings = animate ? 2 : 1;
    for (let k = 0; k < rings; k++) {
      const p = animate ? (t * 0.5 + seed + k / rings) % 1 : 0.35;
      ctx.globalAlpha = alpha * 0.9 * (1 - p) ** 1.4;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.5 + p * size * 1.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
  }

  /** An emoji sticker or a white-rimmed dot. */
  marker(ctx: CanvasRenderingContext2D, m: GlobeMarker, x: number, y: number, size: number, fallbackDot: string): void {
    if (m.emoji) {
      const name = `paper:${m.emoji}`;
      if (!this.sprites.has(name)) this.sprites.register(name, paperGlyph(m.emoji));
      this.sprites.draw(ctx, name, size, '#ffffff', x, y);
      return;
    }
    ctx.beginPath();
    ctx.arc(x, y + 1, size / 2 + 1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(11, 16, 48, 0.3)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = m.dot ?? fallbackDot;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }

  /**
   * Santa's sleigh at (x, y), `width` px wide, facing the screen direction (dx, dy) it is
   * heading in: mirrored when flying right, tilted along the way but never upside down.
   * A warm halo sits behind it; it bobs gently while animating.
   */
  sleighAt(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, dx: number, dy: number, t: number, animate: boolean, glow: string): void {
    if (Math.hypot(dx, dy) > 0.4) { this.headingX = dx; this.headingY = dy; }
    const hx = this.headingX;
    const hy = this.headingY;
    const flip = hx > 0;
    let angle = flip ? Math.atan2(hy, hx) : Math.atan2(-hy, -hx);
    angle = Math.max(-TILT_MAX, Math.min(TILT_MAX, angle));
    const bob = animate ? Math.sin(t * 2.6) * width * 0.02 : 0;
    const a = ctx.globalAlpha;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a * 0.55;
    this.soft(ctx, x, y + bob, width * 1.15, glow);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = a;
    this.sleigh.draw(ctx, x, y + bob, width, angle, flip, this.dpr);
  }

  /** The sun over the subsolar point, with a warm halo. */
  sunAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    const a = ctx.globalAlpha;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a * 0.5;
    this.soft(ctx, x, y, size * 2.4, '#ffd166');
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = a;
    this.sprites.draw(ctx, 'world:sun', size, '#ffffff', x, y);
  }

  /** A label pill above (or, near the top edge, below) a marker; returns false past the label budget. */
  label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, clearance: number, w: number, used: number): boolean {
    if (used >= MAX_LABELS) return false;
    let s = this.labels.get(text);
    if (!s) {
      s = labelSprite(text, this.dpr, this.ink) ?? undefined;
      if (!s) return false;
      if (this.labels.size > 48) this.labels.clear();
      this.labels.set(text, s);
    }
    const lx = Math.min(w - s.w - 2, Math.max(2, x - s.w / 2));
    const above = y - clearance - s.h - 2;
    ctx.drawImage(s.img, lx, above > 2 ? above : y + clearance + 2, s.w, s.h);
    return true;
  }
}
