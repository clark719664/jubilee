/**
 * sprites.ts — the sprite cache: each (name, size, color) is painted once into an offscreen canvas
 * and then drawn with a single `drawImage` per particle (plus `globalAlpha`). It replaces every use of
 * `shadowBlur`, `ctx.filter` and per-frame path/text drawing.
 *
 *   const sprites = createSpriteCache({ scale: dpr });
 *   sprites.draw(ctx, 'heart', 24, '#ff4d9d', x, y);                 // centered at (x, y)
 *   sprites.draw(ctx, 'confettiRect', 10, c, x, y, rot, |cos φ|, 1);  // rotated + squashed (flip fake)
 *   sprites.draw(ctx, 'diyas:ring2', 60, c, x, y, rot, 2, 2, 0.3);    // turning, then laid flat (perspective)
 *   sprites.draw(ctx, 'glyph:🎃', 28, '#fff', x, y);                  // emoji/text with a white outline
 *
 * Names: everything in `painters/index.ts` (glow, circle, snowflake, confettiRect, confettiStreamer,
 * heart, star, star8, petal, marigold, blossom, bubble, cloud, moon, crescent, flame, coin, shamrock,
 * batA, batB, goldfish, frog, turkey, groundhog, koinobori, leafMaple, leafOak, leafGinkgo, lantern,
 * fanous, eggPattern0–3, balloon, dreidel, envelope, plane, pie) and `glyph:<text>`; `register(name,
 * painter)` adds more. `size` is rounded to whole px for the key, so keep sizes discrete (a handful per
 * preset) or scale with scaleX/scaleY. LRU-capped at 256 entries; `setScale(dpr)` clears and re-rasters.
 *
 * Node / tests: with no `document` or `OffscreenCanvas` the cache still constructs; `get` returns a
 * 1×1 stub and `draw` is a no-op, so effects can be stepped without a canvas.
 *
 * Transform contract: `draw` with rotation/scale uses `setTransform` and restores the base transform
 * `(scale, 0, 0, scale, 0, 0)`; the layer guarantees that base, so never leave another transform set.
 */
import { PAINTERS } from './painters';
import type { SpriteCache, SpritePainter } from './types';

/** Offscreen canvas side relative to the sprite size, so strokes and outlines can overhang. */
const EXTENT = 1.5;
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", system-ui, sans-serif';

interface Entry {
  readonly img: CanvasImageSource;
  /** Drawn side in CSS px. */
  readonly side: number;
  readonly stub: boolean;
  used: number;
}

export interface SpriteCacheImpl extends SpriteCache {
  /** Rasterisation scale (the layer's dpr). Changing it clears the cache. */
  readonly scale: number;
  setScale(scale: number): void;
  /** True when no canvas is available (Node): every sprite is a 1×1 stub and `draw` does nothing. */
  readonly stub: boolean;
  readonly count: number;
  clear(): void;
}

export interface SpriteCacheOptions {
  readonly scale?: number;
  readonly capacity?: number;
}

function makeCanvas(px: number): { img: CanvasImageSource; ctx: CanvasRenderingContext2D } | null {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const c = document.createElement('canvas');
    c.width = px;
    c.height = px;
    const ctx = c.getContext('2d');
    return ctx ? { img: c, ctx } : null;
  }
  if (typeof OffscreenCanvas !== 'undefined') {
    const c = new OffscreenCanvas(px, px);
    const ctx = c.getContext('2d');
    // OffscreenCanvasRenderingContext2D has the same drawing surface as the 2D context the painters use.
    return ctx ? { img: c, ctx: ctx as unknown as CanvasRenderingContext2D } : null;
  }
  return null;
}

/** Emoji or short text with a white "sticker" outline, in `color` for plain text. */
export function glyphPainter(text: string): SpritePainter {
  return (ctx, size, color) => {
    ctx.font = `${Math.max(4, Math.round(size * 0.82))}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.12);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(text, 0, size * 0.04);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, size * 0.04);
  };
}

export function createSpriteCache(options: SpriteCacheOptions = {}): SpriteCacheImpl {
  const capacity = Math.max(8, options.capacity ?? 256);
  const painters = new Map<string, SpritePainter>(Object.entries(PAINTERS));
  const byName = new Map<string, Map<number, Map<string, Entry>>>();
  const stubEntry: Entry = { img: { width: 1, height: 1 } as unknown as CanvasImageSource, side: 1, stub: true, used: 0 };
  const stub = makeCanvas(1) === null;
  let scale = Math.max(0.5, options.scale ?? 1);
  let count = 0;
  let tick = 0;

  function evictOne(): void {
    let victim: { name: string; size: number; color: string; used: number } | null = null;
    for (const [name, sizes] of byName) {
      for (const [size, colors] of sizes) {
        for (const [color, e] of colors) {
          if (victim === null || e.used < victim.used) victim = { name, size, color, used: e.used };
        }
      }
    }
    if (!victim) return;
    const sizes = byName.get(victim.name);
    const colors = sizes?.get(victim.size);
    if (colors?.delete(victim.color)) count--;
    if (colors && colors.size === 0) sizes?.delete(victim.size);
    if (sizes && sizes.size === 0) byName.delete(victim.name);
  }

  function paint(name: string, size: number, color: string): Entry {
    let painter = painters.get(name);
    if (!painter && name.startsWith('glyph:')) {
      painter = glyphPainter(name.slice(6));
      painters.set(name, painter);
    }
    if (!painter || stub) return stubEntry;
    const side = Math.ceil(size * EXTENT) + 2;
    const px = Math.max(1, Math.ceil(side * scale));
    const made = makeCanvas(px);
    if (!made) return stubEntry;
    const ctx = made.ctx;
    ctx.setTransform(scale, 0, 0, scale, px / 2, px / 2);
    painter(ctx, size, color);
    return { img: made.img, side, stub: false, used: 0 };
  }

  function lookup(name: string, rawSize: number, color: string): Entry {
    const size = Math.max(1, Math.round(rawSize));
    let sizes = byName.get(name);
    let colors = sizes?.get(size);
    let entry = colors?.get(color);
    if (!entry) {
      entry = paint(name, size, color);
      if (entry.stub) return entry;
      if (count >= capacity) evictOne();
      if (!sizes) { sizes = new Map(); byName.set(name, sizes); }
      if (!colors) { colors = new Map(); sizes.set(size, colors); }
      colors.set(color, entry);
      count++;
    }
    entry.used = ++tick;
    return entry;
  }

  function clear(): void {
    byName.clear();
    count = 0;
  }

  return {
    get scale() { return scale; },
    get stub() { return stub; },
    get count() { return count; },
    setScale(next: number): void {
      const s = Math.max(0.5, next);
      if (s === scale) return;
      scale = s;
      clear();
    },
    clear,
    get(name, size, color): CanvasImageSource {
      return lookup(name, size, color).img;
    },
    register(name, painter): void {
      painters.set(name, painter);
      // Drop any stale rasters painted under the old definition.
      const sizes = byName.get(name);
      if (sizes) {
        for (const colors of sizes.values()) count -= colors.size;
        byName.delete(name);
      }
    },
    has(name): boolean {
      return painters.has(name) || name.startsWith('glyph:');
    },
    draw(ctx, name, size, color, x, y, rot = 0, scaleX = 1, scaleY = 1, squash = 1): void {
      const e = lookup(name, size, color);
      if (e.stub) return;
      const side = e.side;
      const half = side / 2;
      if (rot === 0 && scaleX === 1 && scaleY === 1 && squash === 1) {
        ctx.drawImage(e.img, x - half, y - half, side, side);
        return;
      }
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const k = scale;
      // squash(1, q) · rotate(rot) · scale(scaleX, scaleY), on the layer's base transform (k, 0, 0, k, 0, 0).
      ctx.setTransform(k * scaleX * c, k * scaleX * s * squash, -k * scaleY * s, k * scaleY * c * squash, k * x, k * y);
      ctx.drawImage(e.img, -half, -half, side, side);
      ctx.setTransform(k, 0, 0, k, 0, 0);
    },
  };
}
