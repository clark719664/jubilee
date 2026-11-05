/**
 * generic — stand-in preset for effects that are not written yet (see PENDING_PRESETS in index.ts).
 * Ambient: a gentle rain of theme-colored dots — or `params.glyphs` as outlined emoji — in two depth
 *   layers (far: small, slow, faint → near: bigger, quicker, brighter).
 * Behaviors: constant fall by depth + sway (dots) / flutter (glyphs, which also rock as they fall).
 * Tap: a soft puff of 14 pieces that drifts outward under drag and fades within a second.
 * Still: pieces scattered across the sky, alpha by depth.
 * Params: palette (dot colors; default accent/accent2/glow), glyphs (switches to emoji rain), density.
 */
import {
  Emitter, TAU, drag, envelope, expired, flutter, integrate, range, spawnEdge, steadyRate, sway,
  type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { GlyphSet, Palette, PooledEffect, calm, festivePalette } from './shared';

const DROP = 0;
const PUFF = 1;

export class GenericEffect extends PooledEffect {
  readonly describe: string;
  private readonly glyphs = new GlyphSet();
  private readonly palette = new Palette();
  private readonly rain = new Emitter();
  private started = false;

  constructor(sprites: SpriteCache, describe: string) {
    super(sprites);
    this.describe = describe;
  }

  private readonly initDrop: ParticleInit = (pool, i, rand) => {
    const depth = range(rand, 0.35, 1);
    const glyph = this.glyphs.active;
    pool.kind[i] = DROP;
    pool.depth[i] = depth;
    pool.size[i] = glyph ? 14 + 16 * depth : 3 + 5 * depth;
    pool.vy[i] = (glyph ? 22 : 18) + 40 * depth;
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.3, 0.7);
    pool.color[i] = glyph ? this.glyphs.pick(rand) : this.palette.pick(rand);
    pool.alpha[i] = 0.5 + 0.5 * depth;
  };

  private readonly initPuff: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const speed = range(rand, 50, 140);
    const glyph = this.glyphs.active;
    pool.kind[i] = PUFF;
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed - 30;
    pool.size[i] = glyph ? range(rand, 12, 20) : range(rand, 3, 7);
    pool.maxLife[i] = range(rand, 0.7, 1.1);
    pool.color[i] = glyph ? this.glyphs.pick(rand) : this.palette.pick(rand);
  };

  private sync(input: EffectInput): void {
    this.budget.frame(input.budget);
    this.palette.sync(input, festivePalette);
    this.glyphs.sync(input);
  }

  step(input: EffectInput): void {
    const { w, h, dt, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.5), rand, this.initDrop);
    }
    const rate = steadyRate(input.budget, h / 45, 0.7) * calm(input.intensity);
    this.rain.spawn(pool, 'top', w, h, rate, dt, rand, this.initDrop, this.budget.room());
    const glyph = this.glyphs.active;
    for (let i = pool.count - 1; i >= 0; i--) {
      if (pool.kind[i] === PUFF) {
        drag(pool, i, dt, 2.5);
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.05, 0.5);
        if (expired(pool, i)) pool.kill(i);
        continue;
      }
      if (glyph) flutter(pool, i, dt, 6, pool.aux[i]!);
      else sway(pool, i, dt, 5 * pool.depth[i]!, pool.aux[i]!);
      integrate(pool, i, dt);
      if (pool.y[i]! > h + pool.size[i]!) pool.kill(i);
    }
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    spawnEdge(this.pool, 'point', input.w, input.h, this.budget.take(14), input.rand, this.initPuff, x, y);
  }

  still(input: EffectInput): void {
    this.pool.clear();
    this.sync(input);
    spawnEdge(this.pool, 'area', input.w, input.h, this.budget.take(input.budget * 0.5), input.rand, this.initDrop);
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const glyph = this.glyphs.active;
    const ink = input.theme.ink;
    for (let i = 0; i < pool.count; i++) {
      ctx.globalAlpha = pool.alpha[i]!;
      if (glyph) sprites.draw(ctx, this.glyphs.name(pool.color[i]!), pool.size[i]!, ink, pool.x[i]!, pool.y[i]!, Math.cos(pool.phase[i]!) * 0.25);
      else sprites.draw(ctx, 'circle', pool.size[i]!, this.palette.color(pool.color[i]!), pool.x[i]!, pool.y[i]!);
    }
    ctx.globalAlpha = 1;
  }
}

/** Factory-of-factories: each pending preset gets its own aria description. */
export function generic(describe: string): EffectFactory {
  return (sprites) => new GenericEffect(sprites, describe);
}
