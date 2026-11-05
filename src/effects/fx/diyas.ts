/**
 * diyas — Diwali, the festival of lights.
 * Ambient: an arc of clay diyas cupping the rangoli whose count is 1 + round(growth·8) (one more lamp each
 *   day closer), each flame flickering on its own and wrapped in a warm glow; above them a rangoli — a
 *   procedural 8-fold pattern of five rings (petals, lotus scallops, dots) that blooms ring by ring as
 *   `growth` rises, each ring turning slowly the opposite way to its neighbour; gold and pink sparkles
 *   drift up from the lamps; a few faint stars.
 * Behaviours: flame (flicker), rise + sway + twinkle (sparkles), drag + gravity + trails (sparkler).
 * Tap: a sparkler burst — bright sparks spray out from the finger, each leaving a short fading trail.
 * Still: every diya lit, the rangoli fully drawn for today's growth, sparkles hanging in the air.
 * Params: growth (0..1; default 1), palette (rangoli lead colour first; default theme accent2), density.
 */
import { diya, frameKeeping, quantize, rangoliRing, sparkle } from '../painters/extra-night';
import {
  Emitter, TAU, clamp, drag, envelope, expired, flame, gravity, integrate, range, spawnEdge, sway, twinkle,
  type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { PooledEffect, calm } from './shared';

export const DIYA = 0;
export const RING = 1;
const SCENERY_END = 2;
export const SPARKLE = 2;
export const SPARK = 3;
export const TRAIL = 4;
export const STAR = 5;

export const RINGS = 5;
const RING_SPRITES = ['diyas:ring0', 'diyas:ring1', 'diyas:ring2', 'diyas:ring3', 'diyas:ring4'] as const;
const CLAY = '#c8642a';
const FLAME = '#ffb703';
const SPARKLE_COLORS = ['#ffd166', '#ff8fb8', '#ffffff'] as const;
const SPARK_COLORS = ['#fff3c4', '#ffd166', '#ffb703'] as const;

/** Diyas lit for a growth value: 1 + round(growth·8). */
export function diyaCount(growth: number): number {
  return 1 + Math.round(clamp(Number.isFinite(growth) ? growth : 1, 0, 1) * 8);
}

/** How much of rangoli ring k is drawn (0..1) for a growth value: the rings bloom one after another. */
export function ringReveal(growth: number, k: number): number {
  const g = clamp(Number.isFinite(growth) ? growth : 1, 0, 1);
  return clamp(0.4 + g * RINGS - k, 0, 1);
}

export class DiyasEffect extends PooledEffect {
  readonly describe = 'A row of little oil lamps flickering under a blooming rangoli';

  private readonly trail = new Emitter();
  private started = false;
  private growth = 1;
  private lead = '#ff4d9d';
  private cx = 0;
  private cy = 0;
  private radius = 100;
  private diyaSize = 60;
  private sparkColor = 0;

  constructor(sprites: SpriteCache) {
    super(sprites, 640);
    if (!sprites.has('diyas:diya')) sprites.register('diyas:diya', diya);
    if (!sprites.has('diyas:sparkle')) sprites.register('diyas:sparkle', sparkle);
    for (let k = 0; k < RINGS; k++) {
      if (!sprites.has(RING_SPRITES[k]!)) sprites.register(RING_SPRITES[k]!, rangoliRing(k));
    }
  }

  private readonly initDiya: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = DIYA;
    pool.aux[i] = pool.x[i]!;
    pool.phase[i] = rand() * TAU;
    pool.alpha[i] = 1;
  };

  private readonly initRing: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = RING;
    pool.aux[i] = pool.x[i]!;
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = (pool.aux[i]! % 2 === 0 ? 1 : -1) * (0.04 + 0.015 * pool.aux[i]!);
    pool.alpha[i] = 0;
  };

  private readonly initSparkle: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = SPARKLE;
    pool.size[i] = range(rand, 5, 10);
    pool.vy[i] = -range(rand, 10, 26);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.3, 0.9);
    pool.color[i] = Math.floor(rand() * 3) % 3;
    pool.rot[i] = rand() * TAU;
    pool.maxLife[i] = range(rand, 5, 9);
  };

  private readonly initStar: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = STAR;
    pool.y[i] = pool.y[i]! * 0.55;
    pool.size[i] = range(rand, 1.5, 2.8);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.2, 0.7);
  };

  private readonly initSpark: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const v = range(rand, 140, 360);
    pool.kind[i] = SPARK;
    pool.vx[i] = Math.cos(a) * v;
    pool.vy[i] = Math.sin(a) * v;
    pool.size[i] = range(rand, 4, 6.5);
    pool.maxLife[i] = range(rand, 0.8, 1.3);
    pool.color[i] = Math.floor(rand() * 3) % 3;
    pool.alpha[i] = 0;
  };

  private readonly initTrail: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = TRAIL;
    pool.size[i] = range(rand, 2.4, 3.6);
    pool.vx[i] = range(rand, -12, 12);
    pool.vy[i] = range(rand, 10, 40);
    pool.maxLife[i] = range(rand, 0.25, 0.45);
    pool.color[i] = this.sparkColor;
  };

  private sync(input: EffectInput): void {
    frameKeeping(this.budget, input.budget, SCENERY_END);
    const p = input.params.palette;
    this.lead = p && p.length > 0 ? p[0]! : input.theme.accent2;
    const g = input.params.growth ?? 1;
    const growth = clamp(Number.isFinite(g) ? g : 1, 0, 1);
    if (growth !== this.growth) {
      this.growth = growth;
      if (this.started) this.rebuildScenery(input, false);
    }
    this.layout(input);
  }

  private layout(input: EffectInput): void {
    const { w, h } = input;
    const narrow = w < 720;
    this.cx = narrow ? w * 0.5 : w * 0.68;
    this.cy = narrow ? h * 0.32 : h * 0.38;
    this.radius = quantize(narrow ? Math.min(w * 0.36, h * 0.24) : Math.min(w * 0.2, h * 0.28), 8);
    const n = diyaCount(this.growth);
    const R = this.radius;
    this.diyaSize = quantize(clamp(R * 0.26, 34, 72), 2);
    // Lamps sit on an arc cupping the rangoli (as diyas ring a real one), filled evenly from the bottom.
    const step = Math.min(0.36, (Math.PI * 0.92) / Math.max(1, n - 1));
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== DIYA) continue;
      const a = Math.PI / 2 + (pool.aux[i]! - (n - 1) / 2) * step;
      pool.x[i] = this.cx + Math.cos(a) * R * 1.28;
      pool.y[i] = this.cy + Math.sin(a) * R * 1.12 + this.diyaSize * 0.2;
      pool.size[i] = this.diyaSize;
    }
  }

  /** (Re)creates the lamps and rangoli rings for the current growth; ambient particles are untouched. */
  private rebuildScenery(input: EffectInput, revealNow: boolean): void {
    const pool = this.pool;
    for (let i = pool.count - 1; i >= 0; i--) if (pool.kind[i]! < SCENERY_END) pool.kill(i);
    const n = diyaCount(this.growth);
    for (let s = 0; s < n; s++) spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initDiya, s, 0);
    for (let k = 0; k < RINGS; k++) {
      if (ringReveal(this.growth, k) <= 0) continue;
      const got = spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initRing, k, 0);
      if (got > 0 && revealNow) pool.alpha[pool.count - 1] = ringReveal(this.growth, k);
    }
    this.layout(input);
  }

  step(input: EffectInput): void {
    const { w, h, dt, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      this.rebuildScenery(input, false);
      spawnEdge(pool, 'area', w, h, this.budget.take(clamp(input.budget * 0.08, 8, 26)), rand, this.initStar);
    }
    const k = calm(input.intensity);
    const n = diyaCount(this.growth);
    if (rand() < (0.9 + 0.15 * n) * k * dt && this.budget.take(1, 30) > 0) {
      // Rise from a random lamp.
      let pick = Math.floor(rand() * n);
      for (let i = 0; i < pool.count; i++) {
        if (pool.kind[i] !== DIYA || pick-- > 0) continue;
        spawnEdge(pool, 'point', w, h, 1, rand, this.initSparkle, pool.x[i]! + range(rand, -16, 16), pool.y[i]! - this.diyaSize * 0.6);
        break;
      }
    }
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === DIYA) {
        flame(pool, i, dt, 0.5, rand);
      } else if (kind === RING) {
        pool.life[i]! += dt;
        pool.rot[i]! += pool.rotV[i]! * dt;
        const target = ringReveal(this.growth, pool.aux[i]!);
        // Rings bloom in from the centre after arrival: ring k waits k·0.35 s, then grows over ~1 s.
        if (pool.life[i]! > pool.aux[i]! * 0.35) pool.alpha[i] = Math.min(target, pool.alpha[i]! + dt);
      } else if (kind === SPARKLE) {
        sway(pool, i, dt, 6, 0.3);
        integrate(pool, i, dt);
        pool.rot[i]! += dt;
        twinkle(pool, i, pool.aux[i]!, 0.6, envelope(pool, i, 0.8, 1.5));
        if (expired(pool, i) || pool.y[i]! < -10) pool.kill(i);
      } else if (kind === STAR) {
        pool.life[i]! += dt;
        twinkle(pool, i, pool.aux[i]!, 0.6, 0.6);
      } else if (kind === SPARK) {
        drag(pool, i, dt, 2.4);
        gravity(pool, i, dt, 110);
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.15, 0.5);
        this.sparkColor = pool.color[i]!;
        if (pool.life[i]! < 0.7) {
          this.trail.spawn(pool, 'point', w, h, 9, dt, rand, this.initTrail, this.budget.take(1, 24), pool.x[i]!, pool.y[i]!);
        }
        if (expired(pool, i)) pool.kill(i);
      } else if (kind === TRAIL) {
        integrate(pool, i, dt);
        pool.alpha[i] = 0.8 * envelope(pool, i, 0.03, 0.3);
        if (expired(pool, i)) pool.kill(i);
      }
    }
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    if (!this.started) this.step(input);
    const n = this.budget.take(clamp(input.budget * 0.12, 18, 40), 4);
    spawnEdge(this.pool, 'point', input.w, input.h, n, input.rand, this.initSpark, x, y);
  }

  still(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.started = true;
    this.rebuildScenery(input, true);
    spawnEdge(pool, 'area', w, h, this.budget.take(clamp(input.budget * 0.08, 8, 26)), rand, this.initStar);
    const first = pool.count;
    spawnEdge(pool, 'area', w, h, this.budget.take(clamp(input.budget * 0.08, 8, 24)), rand, this.initSparkle);
    for (let i = first; i < pool.count; i++) {
      pool.y[i] = h * 0.35 + pool.y[i]! * 0.55;
      pool.life[i] = 2;
      pool.alpha[i] = 0.7;
    }
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] === STAR) pool.alpha[i] = 0.45;
      if (pool.kind[i] === DIYA) pool.alpha[i] = 0.92;
    }
  }

  draw(ctx: CanvasRenderingContext2D, _input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const n = pool.count;
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== STAR) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'circle', pool.size[i]!, '#fff4e0', pool.x[i]!, pool.y[i]!);
    }
    // Rangoli: each ring is painted at half its diameter and drawn ×2 (powder art forgives the softness).
    const R = this.radius;
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== RING) continue;
      const k = pool.aux[i]!;
      const a = pool.alpha[i]!;
      if (a <= 0.01) continue;
      const grow = 0.6 + 0.4 * a;
      const d = quantize((R * (k + 1)) / RINGS, 4);
      ctx.globalAlpha = Math.min(1, a * 1.2) * 0.92;
      sprites.draw(ctx, RING_SPRITES[k % RINGS]!, d, this.lead, this.cx, this.cy, pool.rot[i]!, 2 * grow, 2 * grow);
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.18;
    sprites.draw(ctx, 'glow', R * 2.6, '#ffb703', this.cx, this.cy);
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== DIYA) continue;
      const s = pool.size[i]!;
      ctx.globalAlpha = 0.55 * pool.alpha[i]!;
      sprites.draw(ctx, 'glow', s * 2.8, FLAME, pool.x[i]!, pool.y[i]! - s * 0.3);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== DIYA) continue;
      const s = pool.size[i]!;
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      const ph = pool.phase[i]!;
      ctx.globalAlpha = 1;
      sprites.draw(ctx, 'diyas:diya', s, CLAY, x, y);
      const f = quantize(s * 0.46, 2);
      ctx.globalAlpha = 0.85 + 0.15 * pool.alpha[i]!;
      sprites.draw(ctx, 'flame', f, FLAME, x + Math.sin(ph) * 1.2, y - s * 0.12 - f * 0.45, 0.07 * Math.sin(ph * 0.7), 1, 0.9 + 0.14 * pool.alpha[i]!);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i]!;
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      if (kind === DIYA) {
        const s = pool.size[i]!;
        ctx.globalAlpha = 0.6 * pool.alpha[i]!;
        sprites.draw(ctx, 'glow', s * 0.9, '#fff1b8', x, y - s * 0.32);
      } else if (kind === SPARKLE) {
        const c = SPARKLE_COLORS[pool.color[i]! % 3]!;
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'diyas:sparkle', quantize(pool.size[i]!, 2), c, x, y, pool.rot[i]!);
        ctx.globalAlpha = pool.alpha[i]! * 0.4;
        sprites.draw(ctx, 'glow', 22, c, x, y);
      } else if (kind === SPARK) {
        const c = SPARK_COLORS[pool.color[i]! % 3]!;
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'circle', pool.size[i]!, c, x, y);
        ctx.globalAlpha = pool.alpha[i]! * 0.7;
        sprites.draw(ctx, 'glow', 30, c, x, y);
      } else if (kind === TRAIL) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'circle', pool.size[i]!, SPARK_COLORS[pool.color[i]! % 3]!, x, y);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}

export const diyas: EffectFactory = (sprites) => new DiyasEffect(sprites);
