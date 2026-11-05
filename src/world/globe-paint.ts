/**
 * One-off painters for the globe's caches: the deep-space backdrop (gradient, nebula clouds
 * in the theme's colours, a faint milky band and seeded soft stars), the atmosphere glow,
 * sticker emoji with a white paper outline, label pills and the graticule. Each runs only
 * when its size or colours change; the renderer then blits the result with one drawImage.
 */
import { mulberry32 } from '../effects/rng';
import { withAlpha } from '../effects/painters/color';
import { lonlatToVec3, type MVec3 } from './geo';

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", system-ui, sans-serif';
const LABEL_FONT = '700 12px ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif';

export function makeCanvas(w: number, h: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

/**
 * Grows an image's silhouette into a white die-cut "paper" edge with a soft navy shadow,
 * the sticker look used all over Jubilee. Colour emoji and composite sprites have no outline
 * to stroke, so the silhouette is stamped round a small circle and painted white.
 */
export function stickerize(src: HTMLCanvasElement, edge: number, shadowDy: number): HTMLCanvasElement | null {
  const pad = Math.ceil(edge + Math.abs(shadowDy) + 1);
  const w = src.width + pad * 2;
  const h = src.height + pad * 2;
  const paper = makeCanvas(w, h);
  const out = makeCanvas(w, h);
  const p = paper?.getContext('2d');
  const o = out?.getContext('2d');
  if (!paper || !out || !p || !o) return null;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    p.drawImage(src, pad + Math.cos(a) * edge, pad + Math.sin(a) * edge);
  }
  p.globalCompositeOperation = 'source-in';
  p.fillStyle = '#ffffff';
  p.fillRect(0, 0, w, h);
  // Shadow: the paper silhouette in navy, offset down, drawn faintly under everything.
  o.drawImage(paper, 0, shadowDy);
  o.globalCompositeOperation = 'source-in';
  o.fillStyle = 'rgba(11, 16, 48, 0.32)';
  o.fillRect(0, 0, w, h);
  o.globalCompositeOperation = 'source-over';
  o.drawImage(paper, 0, 0);
  o.drawImage(src, pad, pad);
  return out;
}

/** Sprite painter for an emoji sticker (white paper edge, soft shadow), for the shared SpriteCache. */
export function paperGlyph(text: string): (ctx: CanvasRenderingContext2D, size: number) => void {
  return (ctx, size) => {
    const k = ctx.getTransform().a || 1;
    // 1.1 × size for the glyph, plus the paper edge and shadow, stays inside the cache's 1.5 × size box.
    const px = Math.max(1, Math.ceil(size * 1.1 * k));
    const glyph = makeCanvas(px, px);
    const g = glyph?.getContext('2d');
    if (!glyph || !g) return;
    g.setTransform(k, 0, 0, k, px / 2, px / 2);
    g.font = `${Math.round(size * 0.78)}px ${EMOJI_FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 0, size * 0.06);
    const sticker = stickerize(glyph, Math.max(1.5, size * 0.09) * k, Math.max(1, size * 0.07 * k));
    if (!sticker) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // The sprite cache centres a canvas of ~1.5 × size; centre the sticker in it.
    const box = Math.ceil((Math.ceil(size * 1.5) + 2) * k);
    ctx.drawImage(sticker, (box - sticker.width) / 2, (box - sticker.height) / 2);
    ctx.restore();
  };
}

export interface LabelSprite { readonly img: HTMLCanvasElement; readonly w: number; readonly h: number }

/** A white sticker pill with ink text, sized to the text. */
export function labelSprite(text: string, dpr: number, ink: string): LabelSprite | null {
  const probe = makeCanvas(1, 1)?.getContext('2d');
  if (!probe) return null;
  probe.font = LABEL_FONT;
  const w = Math.ceil(probe.measureText(text).width) + 16;
  const h = 22;
  const img = makeCanvas((w + 4) * dpr, (h + 5) * dpr);
  const c = img?.getContext('2d');
  if (!img || !c) return null;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const pill = (dy: number): void => {
    const x = 2;
    const y = 1.5 + dy;
    const r = h / 2;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };
  pill(2);
  c.fillStyle = 'rgba(11, 16, 48, 0.35)';
  c.fill();
  pill(0);
  c.fillStyle = '#ffffff';
  c.fill();
  c.lineWidth = 1.5;
  c.strokeStyle = ink;
  c.stroke();
  c.font = LABEL_FONT;
  c.fillStyle = ink;
  c.textBaseline = 'middle';
  c.fillText(text, 10, 1.5 + h / 2 + 0.5);
  return { img, w: w + 4, h: h + 5 };
}

/** One star: a crisp core, a soft halo for the bright ones and four glints for the brightest. */
function star(b: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number): void {
  if (r > 0.85) {
    const halo = b.createRadialGradient(x, y, 0, x, y, r * 5);
    halo.addColorStop(0, withAlpha(color, 0.32 * alpha));
    halo.addColorStop(1, withAlpha(color, 0));
    b.fillStyle = halo;
    b.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
  }
  b.globalAlpha = alpha;
  b.fillStyle = color;
  b.beginPath();
  b.arc(x, y, r, 0, Math.PI * 2);
  b.fill();
  if (r > 1.4) {
    const len = r * 6.5;
    const hz = b.createLinearGradient(x - len, y, x + len, y);
    const vt = b.createLinearGradient(x, y - len, x, y + len);
    for (const g of [hz, vt]) {
      g.addColorStop(0, withAlpha(color, 0));
      g.addColorStop(0.5, withAlpha(color, 0.85));
      g.addColorStop(1, withAlpha(color, 0));
    }
    b.fillStyle = hz;
    b.fillRect(x - len, y - 0.4, len * 2, 0.8);
    b.fillStyle = vt;
    b.fillRect(x - 0.4, y - len, 0.8, len * 2);
  }
  b.globalAlpha = 1;
}

export interface SpaceColors {
  readonly top: string;
  readonly bottom: string;
  readonly nebula1: string;
  readonly nebula2: string;
}

/**
 * The sky behind the globe: a deep gradient, soft nebula clouds and a faint milky band dusted
 * with tiny stars. The brighter stars are a separate, tileable layer (`paintStars`) that drifts
 * a little as the globe turns, which makes spinning feel three-dimensional.
 */
export function paintSpace(w: number, h: number, dpr: number, c: SpaceColors): HTMLCanvasElement | null {
  const canvas = makeCanvas(w * dpr, h * dpr);
  const b = canvas?.getContext('2d');
  if (!canvas || !b) return null;
  b.setTransform(dpr, 0, 0, dpr, 0, 0);
  const base = b.createLinearGradient(0, 0, w * 0.35, h);
  base.addColorStop(0, c.top);
  base.addColorStop(1, c.bottom);
  b.fillStyle = base;
  b.fillRect(0, 0, w, h);

  const rand = mulberry32(20261224);
  const big = Math.max(w, h);
  // Clouds are screened on, so they can only lighten the sky, never muddy it.
  b.globalCompositeOperation = 'screen';
  const clouds: readonly (readonly [string, number])[] = [[c.nebula1, 0.3], [c.nebula2, 0.18], ['#3b5bdb', 0.2], [c.nebula1, 0.16], [c.nebula2, 0.1]];
  for (const [color, a] of clouds) {
    const x = rand() * w;
    const y = rand() * h;
    const r = big * (0.22 + rand() * 0.32);
    const g = b.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(color, a));
    g.addColorStop(0.45, withAlpha(color, a * 0.4));
    g.addColorStop(1, withAlpha(color, 0));
    b.fillStyle = g;
    b.fillRect(0, 0, w, h);
  }
  // The milky band: a long, soft, tilted glow with a dusting of extra stars along it.
  const tilt = -0.42;
  b.save();
  b.translate(w / 2, h / 2);
  b.rotate(tilt);
  b.scale(1, 0.16);
  const band = b.createRadialGradient(0, 0, 0, 0, 0, big * 0.75);
  band.addColorStop(0, 'rgba(220, 230, 255, 0.10)');
  band.addColorStop(0.6, 'rgba(200, 215, 255, 0.04)');
  band.addColorStop(1, 'rgba(200, 215, 255, 0)');
  b.fillStyle = band;
  b.fillRect(-big, -big * 5, big * 2, big * 10);
  b.restore();
  b.globalCompositeOperation = 'source-over';

  const dust = Math.round(Math.min(900, Math.max(100, (w * h) / 1600)));
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  for (let i = 0; i < dust; i++) {
    const along = (rand() * 2 - 1) * big * 0.7;
    const across = (rand() + rand() + rand() - 1.5) * big * 0.07;
    star(b, w / 2 + along * cos - across * sin, h / 2 + along * sin + across * cos, 0.25 + rand() ** 3 * 0.6, '#eef2ff', 0.2 + rand() * 0.45);
  }
  // Vignette: the corners fall away into deeper space.
  const v = b.createRadialGradient(w / 2, h / 2, big * 0.3, w / 2, h / 2, big * 0.78);
  v.addColorStop(0, 'rgba(0, 0, 10, 0)');
  v.addColorStop(1, 'rgba(0, 0, 10, 0.5)');
  b.fillStyle = v;
  b.fillRect(0, 0, w, h);
  return canvas;
}

/** Star drift while the globe turns, px per degree. */
const PARALLAX = 0.5;

/** The cached sky and star layer, drawn as one backdrop with the stars drifting with the camera. */
export class SpaceBackdrop {
  private sky: HTMLCanvasElement | null = null;
  private skyKey = '';
  private stars: HTMLCanvasElement | null = null;
  private starsKey = '';

  draw(
    ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number,
    c: { readonly space1: string; readonly space2: string; readonly nebula1: string; readonly nebula2: string },
    lon: number, lat: number,
  ): void {
    const key = `${w}x${h}@${dpr}|${c.space1}|${c.space2}|${c.nebula1}|${c.nebula2}`;
    if (key !== this.skyKey) {
      this.skyKey = key;
      this.sky = paintSpace(w, h, dpr, { top: c.space1, bottom: c.space2, nebula1: c.nebula1, nebula2: c.nebula2 });
    }
    if (this.sky) ctx.drawImage(this.sky, 0, 0, w, h);
    else {
      ctx.fillStyle = c.space1;
      ctx.fillRect(0, 0, w, h);
    }
    const skey = `${w}x${h}@${dpr}`;
    if (skey !== this.starsKey) {
      this.starsKey = skey;
      this.stars = paintStars(w, h, dpr);
    }
    const s = this.stars;
    if (!s) return;
    // Four blits of one tile cover the canvas wherever the drift has moved it.
    const ox = (((-lon * PARALLAX) % w) + w) % w;
    const oy = (((lat * PARALLAX) % h) + h) % h;
    ctx.drawImage(s, ox - w, oy - h, w, h);
    ctx.drawImage(s, ox, oy - h, w, h);
    ctx.drawImage(s, ox - w, oy, w, h);
    ctx.drawImage(s, ox, oy, w, h);
  }
}

/** Seeded stars on a transparent canvas that tiles seamlessly (stars near an edge wrap round). */
export function paintStars(w: number, h: number, dpr: number): HTMLCanvasElement | null {
  const canvas = makeCanvas(w * dpr, h * dpr);
  const b = canvas?.getContext('2d');
  if (!canvas || !b) return null;
  b.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rand = mulberry32(19691120);
  const n = Math.round(Math.min(1500, Math.max(160, (w * h) / 950)));
  const palette = ['#ffffff', '#ffffff', '#ffffff', '#cfe0ff', '#ffe9b8'];
  for (let i = 0; i < n; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 0.3 + rand() ** 5 * 1.7;
    const color = palette[Math.floor(rand() * palette.length)]!;
    const alpha = 0.3 + rand() * 0.7;
    const reach = r * 7;
    for (const dx of [-w, 0, w]) {
      for (const dy of [-h, 0, h]) {
        const px = x + dx;
        const py = y + dy;
        if (px < -reach || px > w + reach || py < -reach || py > h + reach) continue;
        star(b, px, py, r, color, alpha);
      }
    }
  }
  return canvas;
}

/**
 * The atmosphere for a globe of radius R: a bright rim right at the limb that fades out into
 * space. Painted once at this radius and rescaled while zooming (repainted past ±20%).
 */
export function paintAtmosphere(R: number, dpr: number, color: string): HTMLCanvasElement | null {
  const outer = R * 1.34;
  const side = Math.ceil(outer * 2 * dpr) + 2;
  const canvas = makeCanvas(side, side);
  const g = canvas?.getContext('2d');
  if (!canvas || !g) return null;
  g.setTransform(dpr, 0, 0, dpr, side / 2, side / 2);
  const inner = R * 0.96;
  const at = (r: number): number => (r - inner) / (outer - inner);
  const grad = g.createRadialGradient(0, 0, inner, 0, 0, outer);
  grad.addColorStop(0, withAlpha(color, 0));
  grad.addColorStop(at(R), withAlpha(color, 0.95));
  grad.addColorStop(at(R * 1.018), withAlpha(color, 0.55));
  grad.addColorStop(at(R * 1.06), withAlpha(color, 0.24));
  grad.addColorStop(at(R * 1.15), withAlpha(color, 0.08));
  grad.addColorStop(1, withAlpha(color, 0));
  g.fillStyle = grad;
  g.fillRect(-outer, -outer, outer * 2, outer * 2);
  return canvas;
}

/** Vec3 polylines for a 30° graticule (meridians stop short of the poles). */
export function graticule(): Float32Array[] {
  const out: Float32Array[] = [];
  const tmp: MVec3 = [0, 0, 0];
  for (let lon = -180; lon < 180; lon += 30) {
    const pts: number[] = [];
    for (let lat = -80; lat <= 80; lat += 4) { lonlatToVec3(lon, lat, tmp); pts.push(tmp[0], tmp[1], tmp[2]); }
    out.push(new Float32Array(pts));
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts: number[] = [];
    for (let lon = -180; lon <= 180; lon += 4) { lonlatToVec3(lon, lat, tmp); pts.push(tmp[0], tmp[1], tmp[2]); }
    out.push(new Float32Array(pts));
  }
  return out;
}
