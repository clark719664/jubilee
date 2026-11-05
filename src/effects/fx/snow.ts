/**
 * snow — soft snow with real depth.
 * Ambient: three depth layers of round flakes (far: tiny, slow, faint · mid: crisp · near: big, soft,
 *   out-of-focus bokeh) plus the odd crystalline flake that spins as it falls. All layers share one slow
 *   wind that gusts, and sway on their own; near flakes feel the wind most (parallax).
 * Behaviours: gravity to a per-flake terminal speed, sway, wind, spin (crystals), horizontal wrap.
 * Tap: a puff of powder snow thrown from the finger that drifts, slows and settles back into the fall.
 * Still: flakes frozen mid-air in every layer and a band of flakes settled along the ground.
 * Params: density; variant 'shadow' (Groundhog Day): a groundhog peeks from a snow mound; a tap toggles
 *   between a sunny sky with the groundhog's long shadow (six more weeks of winter — it snows harder)
 *   and a cloudy one with no shadow. Flakes are white on night skies and a soft blue on pale day skies.
 * Scene mode (`params.stage`): the scene draws its own groundhog, burrow and sky, so the mound, the groundhog,
 *   the sun and the cloud give way to the art; the tap still toggles the shadow, and with it how hard it snows.
 */
import type { Theme } from '../../theme/themes';
import { mixColor } from '../painters';
import {
  Emitter, TAU, clamp, drag, envelope, expired, gravity, integrate, range, spawnEdge, steadyRate, sway,
  type ParticleInit, type ParticlePool,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { PooledEffect, calm } from './shared';

export const FLAKE = 0;
export const CRYSTAL = 1;
export const PUFF = 2;

/** Share of the budget, fall speed (px/s) and sprite size range per depth layer (far → near). */
const LAYER_SHARE = [0.5, 0.32, 0.18] as const;
const LAYER_SPEED = [16, 34, 68] as const;
const LAYER_SIZE: readonly (readonly [number, number])[] = [[2, 3], [3, 5.5], [7, 13]];
const LAYER_ALPHA: readonly (readonly [number, number])[] = [[0.3, 0.5], [0.55, 0.85], [0.5, 0.75]];
const WRAP_MARGIN = 40;

/** Slow, gusty wind in px/s: three incommensurate sines so it never visibly repeats. */
export function windAt(t: number): number {
  return 16 * Math.sin(t * 0.21) + 10 * Math.sin(t * 0.53 + 1.7) + 6 * Math.sin(t * 1.3 + 0.4);
}

function swayFreq(depth: number): number {
  const f = depth * 9.17;
  return 0.1 + 0.3 * (f - Math.floor(f));
}

export class SnowEffect extends PooledEffect {
  readonly describe = 'Snowflakes drifting down over the sky';
  /** 'shadow' variant: true while the groundhog sees its shadow. */
  shadow = false;

  private readonly emitters = [new Emitter(), new Emitter(), new Emitter()];
  private readonly inits: readonly ParticleInit[];
  private flakeColor = '#ffffff';
  private lastTheme: Theme | null = null;
  private variant = '';
  private started = false;

  constructor(sprites: SpriteCache) {
    super(sprites);
    this.inits = [this.initFor(0), this.initFor(1), this.initFor(2)];
  }

  private initFor(layer: 0 | 1 | 2): ParticleInit {
    return (pool, i, rand) => {
      const depth = (layer + rand()) / 3;
      const speed = LAYER_SPEED[layer] * range(rand, 0.8, 1.2);
      pool.depth[i] = depth;
      pool.vy[i] = speed;
      pool.aux[i] = speed;
      pool.phase[i] = rand() * TAU;
      if (layer > 0 && rand() < 0.045) {
        pool.kind[i] = CRYSTAL;
        pool.size[i] = range(rand, 10, 18);
        pool.rot[i] = rand() * TAU;
        pool.rotV[i] = range(rand, -0.7, 0.7);
        pool.alpha[i] = 0.85;
      } else {
        const [s0, s1] = LAYER_SIZE[layer]!;
        const [a0, a1] = LAYER_ALPHA[layer]!;
        pool.kind[i] = FLAKE;
        pool.size[i] = range(rand, s0, s1);
        pool.alpha[i] = range(rand, a0, a1);
      }
    };
  }

  private readonly initPuff: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const speed = range(rand, 40, 170);
    pool.kind[i] = PUFF;
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed - 55;
    pool.size[i] = range(rand, 3, 6.5);
    pool.aux[i] = range(rand, 28, 46);
    pool.maxLife[i] = range(rand, 1.2, 2.1);
    pool.depth[i] = 0.8;
    pool.alpha[i] = 0.9;
  };

  private groundY = 0;

  private readonly initGround: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = FLAKE;
    pool.depth[i] = 0.6;
    pool.size[i] = range(rand, 2, 4.5);
    pool.alpha[i] = range(rand, 0.7, 0.95);
    pool.y[i] = this.groundY - 18 * rand() * rand();
  };

  private sync(input: EffectInput): void {
    this.budget.frame(input.budget);
    this.variant = input.params.variant ?? '';
    if (input.theme !== this.lastTheme) {
      this.lastTheme = input.theme;
      this.flakeColor = input.theme.mood === 'night' ? '#ffffff' : mixColor('#ffffff', input.theme.accent2, 0.42);
    }
  }

  /** Fills the whole sky at once (steady-state proportions), so the first frame is never thin. */
  private prefill(input: EffectInput, share: number): void {
    const air = input.budget * share;
    for (let layer = 0; layer < 3; layer++) {
      spawnEdge(this.pool, 'area', input.w, input.h, this.budget.take(air * LAYER_SHARE[layer]!), input.rand, this.inits[layer]!);
    }
  }

  step(input: EffectInput): void {
    const { w, h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      this.prefill(input, 0.8);
    }
    const k = calm(input.intensity) * (this.variant === 'shadow' && this.shadow ? 1.4 : 1);
    for (let layer = 0; layer < 3; layer++) {
      const rate = steadyRate(input.budget * LAYER_SHARE[layer]!, h / LAYER_SPEED[layer]!, 0.85) * k;
      this.emitters[layer]!.spawn(pool, 'top', w, h, rate, dt, rand, this.inits[layer]!, this.budget.room());
    }
    const gust = windAt(t);
    const span = w + 2 * WRAP_MARGIN;
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i];
      if (kind === PUFF) {
        gravity(pool, i, dt, 160, pool.aux[i]!);
        drag(pool, i, dt, 1.8);
        integrate(pool, i, dt);
        pool.alpha[i] = 0.9 * envelope(pool, i, 0.04, 0.7);
        if (expired(pool, i) || pool.y[i]! > h + 8) pool.kill(i);
        continue;
      }
      const depth = pool.depth[i]!;
      gravity(pool, i, dt, 120, pool.aux[i]!);
      sway(pool, i, dt, 3 + 9 * depth, swayFreq(depth));
      pool.x[i]! += gust * (0.25 + 0.95 * depth) * dt;
      if (kind === CRYSTAL) pool.rot[i]! += pool.rotV[i]! * dt;
      integrate(pool, i, dt);
      const x = pool.x[i]!;
      if (x < -WRAP_MARGIN) pool.x[i] = x + span;
      else if (x > w + WRAP_MARGIN) pool.x[i] = x - span;
      if (pool.y[i]! > h + pool.size[i]!) pool.kill(i);
    }
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    if (this.variant === 'shadow') this.shadow = !this.shadow;
    spawnEdge(this.pool, 'point', input.w, input.h, this.budget.take(28), input.rand, this.initPuff, x, y);
  }

  still(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.prefill(input, 0.55);
    this.groundY = h - 2;
    spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.3), rand, this.initGround);
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const color = this.flakeColor;
    if (this.variant === 'shadow' && !input.params.stage) this.drawGroundhog(ctx, input);
    for (let i = 0; i < pool.count; i++) {
      ctx.globalAlpha = pool.alpha[i]!;
      const kind = pool.kind[i];
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      const size = pool.size[i]!;
      if (kind === CRYSTAL) sprites.draw(ctx, 'snowflake', size, color, x, y, pool.rot[i]!);
      else if (kind === FLAKE && pool.depth[i]! > 0.66) sprites.draw(ctx, 'glow', size * 1.9, color, x, y);
      else sprites.draw(ctx, 'circle', size, color, x, y);
    }
    ctx.globalAlpha = 1;
  }

  /** Groundhog Day: snow mound, groundhog, and either sun + long shadow or a cloud. */
  private drawGroundhog(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const { w, h, t, theme } = input;
    const sprites = this.sprites;
    const s = clamp(h * 0.17, 72, 128);
    const gx = w * 0.74;
    const ground = h - s * 0.1;
    const fur = '#8b5a2b';
    if (this.shadow) {
      ctx.globalAlpha = 0.85;
      sprites.draw(ctx, 'glow', s * 3.4, '#ffd166', w * 0.15, h * 0.14);
      ctx.globalAlpha = 1;
      sprites.draw(ctx, 'circle', s * 0.5, '#ffe9a3', w * 0.15, h * 0.14);
    } else {
      ctx.globalAlpha = 0.95;
      const cloud = mixColor('#ffffff', theme.ink, 0.12);
      sprites.draw(ctx, 'cloud', s * 1.7, cloud, w * 0.15, h * 0.15);
      sprites.draw(ctx, 'cloud', s * 1.2, cloud, w * 0.25, h * 0.12);
    }
    ctx.globalAlpha = 0.95;
    sprites.draw(ctx, 'circle', s * 2.1, '#ffffff', gx, ground + s * 0.18, 0, 1, 0.3);
    if (this.shadow) {
      // The silhouette is the groundhog sprite laid down to the right: rotated ~66°, squashed, lengthened.
      const th = 1.15;
      const sx = 1.3;
      const sy = 0.55;
      const feetX = -Math.sin(th) * sy * s * 0.5;
      const feetY = Math.cos(th) * sy * s * 0.5;
      ctx.globalAlpha = 0.3;
      sprites.draw(ctx, 'groundhog', s, theme.ink, gx - feetX, ground - feetY, th, sx, sy);
    }
    const bob = Math.sin(t * 1.7) * s * 0.015;
    ctx.globalAlpha = 1;
    sprites.draw(ctx, 'groundhog', s, fur, gx, ground - s * 0.5 + bob);
  }
}

export const snow: EffectFactory = (sprites) => new SnowEffect(sprites);

/** For tests: true when particle `i` is an ambient flake (not a puff). */
export function isFlake(pool: ParticlePool, i: number): boolean {
  return pool.kind[i] !== PUFF;
}
