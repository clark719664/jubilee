/**
 * shared.ts — the base class and small helpers every preset uses.
 *
 *   class HeartsEffect extends PooledEffect {
 *     readonly describe = 'Hearts floating up through the sky';
 *     step(input)  { this.budget.frame(input.budget); …spawn with this.budget.take(n)…; loop behaviours }
 *     draw(ctx, input) { …this.sprites.draw(…) per particle, globalAlpha from pool.alpha… }
 *     still(input) { this.pool.clear(); this.budget.frame(input.budget); …arrange one settled frame… }
 *   }
 *   export const hearts: EffectFactory = (sprites) => new HeartsEffect(sprites);
 *
 * `Palette` resolves `params.palette` (or a theme fallback) into a colour table once, so `pool.color[i]`
 * is an index and `draw` never builds strings. `GlyphSet` does the same for `params.glyphs` → sprite names.
 *
 * Scene mode (`params.stage` present: the hero shows an illustrated scene): `this.scene.sync(input)` in a
 * preset's own sync tells it so, maps artboard points onto the canvas and gives the sky line. Presets then
 * keep their ambient, sky-friendly particles and taps, drop the set pieces drawn to fill a bare sky
 * (moons, skylines, meadows, centrepieces), and draw what belongs on the art at its stage points.
 */
import type { Theme } from '../../theme/themes';
import { Budgeter, ParticlePool, clamp } from '../particles';
import { SceneView } from '../stage';
import type { Effect, EffectInput, SpriteCache } from '../types';

export abstract class PooledEffect implements Effect {
  readonly pool: ParticlePool;
  readonly budget: Budgeter;
  /** The hero's illustrated scene, when there is one (see stage.ts). */
  readonly scene = new SceneView();
  protected readonly sprites: SpriteCache;
  abstract readonly describe: string;

  constructor(sprites: SpriteCache, capacity = 1024) {
    this.sprites = sprites;
    this.pool = new ParticlePool(capacity);
    this.budget = new Budgeter(this.pool);
  }

  abstract step(input: EffectInput): void;
  abstract draw(ctx: CanvasRenderingContext2D, input: EffectInput): void;
  abstract still(input: EffectInput): void;

  alive(): number {
    return this.pool.count;
  }
}

/** Colour table from `params.palette` or a theme fallback; rebuilt only when either identity changes. */
export class Palette {
  colors: readonly string[] = [];
  private lastPalette: readonly string[] | undefined;
  private lastTheme: Theme | null = null;

  sync(input: EffectInput, fallback: (theme: Theme) => readonly string[]): readonly string[] {
    const p = input.params.palette;
    if (p === this.lastPalette && input.theme === this.lastTheme && this.colors.length > 0) return this.colors;
    this.lastPalette = p;
    this.lastTheme = input.theme;
    this.colors = p && p.length > 0 ? p : fallback(input.theme);
    return this.colors;
  }

  /** Random colour index for a new particle (store it in `pool.color[i]`). */
  pick(rand: () => number): number {
    return this.colors.length === 0 ? 0 : Math.floor(rand() * this.colors.length) % 256;
  }

  color(index: number): string {
    return this.colors.length === 0 ? '#ffffff' : this.colors[index % this.colors.length]!;
  }
}

/** `params.glyphs` → `glyph:<text>` sprite names, rebuilt only when the array identity changes. */
export class GlyphSet {
  names: readonly string[] = [];
  private last: readonly string[] | undefined;

  sync(input: EffectInput): readonly string[] {
    const g = input.params.glyphs;
    if (g !== this.last) {
      this.last = g;
      this.names = g ? g.map((t) => `glyph:${t}`) : [];
    }
    return this.names;
  }

  get active(): boolean {
    return this.names.length > 0;
  }

  pick(rand: () => number): number {
    return this.names.length === 0 ? 0 : Math.floor(rand() * this.names.length) % 256;
  }

  name(index: number): string {
    return this.names.length === 0 ? 'circle' : this.names[index % this.names.length]!;
  }
}

/** Accent, accent2, glow, plus white on night skies or the ink colour on day skies. */
export function festivePalette(theme: Theme): readonly string[] {
  return [theme.accent, theme.accent2, theme.glow, theme.mood === 'night' ? '#ffffff' : theme.ink];
}

/** A single tint that reads on this sky: white at night, the secondary accent by day. */
export function skyTint(theme: Theme): string {
  return theme.mood === 'night' ? '#ffffff' : theme.accent2;
}

/** Scroll intensity → ambient spawn multiplier (never fully silent while visible). */
export function calm(intensity: number): number {
  return 0.15 + 0.85 * clamp(intensity, 0, 1);
}

/** Scene mode: a wick flame is about this many artboard units tall (the art's candles are drawn to match). */
export const WICK_FLAME_UNITS = 13;
const WICK_FLAME = '#ffb703';

/**
 * Scene mode: flames standing on the scene's own wicks. Particles of `kind` sit at their wick tip (x, y)
 * and flicker with `flame()` (phase, alpha); each is drawn `fs` px tall with its base just over the tip,
 * then wrapped in a warm halo in one 'lighter' pass.
 */
export function drawWickFlames(ctx: CanvasRenderingContext2D, sprites: SpriteCache, pool: ParticlePool, kind: number, fs: number): void {
  const n = pool.count;
  for (let i = 0; i < n; i++) {
    if (pool.kind[i] !== kind) continue;
    const ph = pool.phase[i]!;
    const a = pool.alpha[i]!;
    ctx.globalAlpha = 0.85 + 0.15 * a;
    sprites.draw(ctx, 'flame', fs, WICK_FLAME, pool.x[i]! + Math.sin(ph) * fs * 0.06, pool.y[i]! - fs * 0.42, 0.07 * Math.sin(ph * 0.7), 1, 0.9 + 0.14 * a);
  }
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    if (pool.kind[i] !== kind) continue;
    const a = pool.alpha[i]!;
    const x = pool.x[i]!;
    const fy = pool.y[i]! - fs * 0.45;
    ctx.globalAlpha = 0.55 * a;
    sprites.draw(ctx, 'glow', fs * 4.2, WICK_FLAME, x, fy);
    ctx.globalAlpha = 0.6 * a;
    sprites.draw(ctx, 'glow', fs * 1.2, '#fff1b8', x, fy);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
