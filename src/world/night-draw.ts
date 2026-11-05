/**
 * Sunlight and night as two small textures instead of polygons, so the terminator is a
 * smooth gradient rather than the steps you get from stacking caps:
 *
 *  - `light` is drawn with 'multiply': white-ish on the day side (gently dimmer toward the
 *    terminator, like a lit ball), the night tint on the dark side. Multiplying keeps the
 *    land and sea colors rich (green turns deep teal, blue turns ink) instead of graying
 *    them under a translucent veil.
 *  - `glow` is drawn with 'screen': a warm sunset band along the terminator, on land only
 *    (over open sea a warm band just reads as murk).
 *
 * Each texture is tiny (≈160² for the globe, 1° per texel for the map) and drawn scaled up
 * with smoothing, clipped to the disc on the globe. Globe textures live in screen space and
 * are rebuilt only when the view center or the sun moves (zoom just rescales them); map
 * textures live in lon/lat space and are rebuilt only when the sun moves.
 */
import { parseColor } from '../effects/painters/color';
import type { MVec3 } from './geo';
import type { Equirectangular, Orthographic } from './projection';

export interface NightColors {
  readonly night: string;
  readonly twilight: string;
}

/** How dark (0..1) a point is, from d = sun · point (the sine of the sun's altitude there). */
export function nightAmount(d: number): number {
  // Day above +3°, full night from −12° (sin −12° ≈ −0.21).
  const t = Math.min(1, Math.max(0, (0.05 - d) / 0.26));
  return t * t * (3 - 2 * t);
}

/** The warm band: strongest just as the sun sets, gone a few degrees either side. */
export function twilightAmount(d: number): number {
  const x = (d + 0.015) / 0.05;
  return Math.exp(-x * x);
}

function rgbOf(color: string, fallback: readonly [number, number, number]): [number, number, number] {
  const p = parseColor(color);
  return p ? [p[0], p[1], p[2]] : [fallback[0], fallback[1], fallback[2]];
}

/** How far the night side goes toward the tint (1 = all the way). */
const NIGHT_DEPTH = 0.94;
/** The day side dims by this much from the subsolar point to the terminator. */
const DAY_FALLOFF = 0.2;
const TWILIGHT_ALPHA = 0.2;

interface Tex { canvas: HTMLCanvasElement; img: ImageData }

function texture(old: Tex | null, w: number, h: number): Tex | null {
  if (old && old.canvas.width === w && old.canvas.height === h) return old;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  return c ? { canvas, img: c.createImageData(w, h) } : null;
}

export class NightShade {
  private gLight: Tex | null = null;
  private gGlow: Tex | null = null;
  private gKey = '';
  private mLight: Tex | null = null;
  private mGlow: Tex | null = null;
  private mKey = '';
  private tint: [number, number, number] = [74, 88, 168];
  private warm: [number, number, number] = [255, 154, 92];

  setColors(c: NightColors): void {
    this.tint = rgbOf(c.night, [74, 88, 168]);
    this.warm = rgbOf(c.twilight, [255, 154, 92]);
    this.gKey = '';
    this.mKey = '';
  }

  /** Writes one texel of each texture from d = sun · point. */
  private texel(light: Uint8ClampedArray, glow: Uint8ClampedArray, k: number, d: number): void {
    const night = nightAmount(d) * NIGHT_DEPTH;
    const lit = 1 - DAY_FALLOFF * (1 - Math.sqrt(Math.max(0, d)));
    const t = this.tint;
    light[k] = 255 * lit * (1 - night) + t[0] * night;
    light[k + 1] = 255 * lit * (1 - night) + t[1] * night;
    light[k + 2] = 255 * lit * (1 - night) + t[2] * night;
    light[k + 3] = 255;
    const w = this.warm;
    glow[k] = w[0];
    glow[k + 1] = w[1];
    glow[k + 2] = w[2];
    glow[k + 3] = 255 * TWILIGHT_ALPHA * twilightAmount(d);
  }

  /** Light and night over the globe disc; `land` traces the land outlines that get the sunset glow. */
  paintGlobe(ctx: CanvasRenderingContext2D, o: Orthographic, sun: MVec3, dpr: number, land: ((c: CanvasRenderingContext2D) => void) | null): void {
    const R = o.scale;
    const n = Math.max(64, Math.min(200, Math.round((R * dpr) / 5)));
    const { c, u, v } = o;
    const key = `${n}|${c[0].toFixed(4)},${c[1].toFixed(4)},${c[2].toFixed(4)}|${sun[0].toFixed(4)},${sun[1].toFixed(4)},${sun[2].toFixed(4)}`;
    this.gLight = texture(this.gLight, n, n);
    this.gGlow = texture(this.gGlow, n, n);
    const L = this.gLight;
    const G = this.gGlow;
    if (!L || !G) return;
    if (key !== this.gKey) {
      this.gKey = key;
      const ld = L.img.data;
      const gd = G.img.data;
      for (let j = 0; j < n; j++) {
        const rowY = 1 - ((j + 0.5) / n) * 2;
        for (let i = 0; i < n; i++) {
          let px = ((i + 0.5) / n) * 2 - 1;
          let py = rowY;
          let r2 = px * px + py * py;
          // Texels just outside the disc copy the limb so smoothing never darkens the edge.
          if (r2 > 1) { const r = Math.sqrt(r2); px /= r; py /= r; r2 = 1; }
          const pz = Math.sqrt(1 - r2);
          const x = px * u[0] + py * v[0] + pz * c[0];
          const y = px * u[1] + py * v[1] + pz * c[1];
          const z = px * u[2] + py * v[2] + pz * c[2];
          this.texel(ld, gd, 4 * (j * n + i), x * sun[0] + y * sun[1] + z * sun[2]);
        }
      }
      L.canvas.getContext('2d')?.putImageData(L.img, 0, 0);
      G.canvas.getContext('2d')?.putImageData(G.img, 0, 0);
    }
    const cx = o.w / 2;
    const cy = o.h / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(L.canvas, cx - R, cy - R, 2 * R, 2 * R);
    if (land) {
      ctx.beginPath();
      land(ctx);
      ctx.clip();
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(G.canvas, cx - R, cy - R, 2 * R, 2 * R);
    }
    ctx.restore();
  }

  /** Light and night over the flat map (one copy per offset); `land` as for the globe. */
  paintMap(
    ctx: CanvasRenderingContext2D, f: Equirectangular, sun: MVec3, offsets: readonly number[], top: number, bottom: number,
    land: ((c: CanvasRenderingContext2D) => void) | null,
  ): void {
    const W = 360;
    const H = 180;
    const key = `${sun[0].toFixed(4)},${sun[1].toFixed(4)},${sun[2].toFixed(4)}`;
    this.mLight = texture(this.mLight, W, H);
    this.mGlow = texture(this.mGlow, W, H);
    const L = this.mLight;
    const G = this.mGlow;
    if (!L || !G) return;
    if (key !== this.mKey) {
      this.mKey = key;
      const ld = L.img.data;
      const gd = G.img.data;
      for (let j = 0; j < H; j++) {
        const φ = (90 - (j + 0.5) * (180 / H)) * (Math.PI / 180);
        const cφ = Math.cos(φ);
        const sφ = Math.sin(φ);
        for (let i = 0; i < W; i++) {
          const λ = (-180 + (i + 0.5) * (360 / W)) * (Math.PI / 180);
          this.texel(ld, gd, 4 * (j * W + i), cφ * Math.cos(λ) * sun[0] + cφ * Math.sin(λ) * sun[1] + sφ * sun[2]);
        }
      }
      L.canvas.getContext('2d')?.putImageData(L.img, 0, 0);
      G.canvas.getContext('2d')?.putImageData(G.img, 0, 0);
    }
    const x0 = f.w / 2 + (-180 - f.center.lon) * f.scale;
    const span = 360 * f.scale;
    const blit = (tex: Tex): void => {
      for (const off of offsets) {
        const x = x0 + off;
        if (x > f.w || x + span < 0) continue;
        ctx.drawImage(tex.canvas, x, top, span, bottom - top);
      }
    };
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'multiply';
    blit(L);
    if (land) {
      ctx.beginPath();
      land(ctx);
      ctx.clip();
      ctx.globalCompositeOperation = 'screen';
      blit(G);
    }
    ctx.restore();
  }
}
