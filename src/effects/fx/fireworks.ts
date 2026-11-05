/**
 * fireworks — rockets that climb on a trail and bloom.
 * Ambient: a field of twinkling stars (≤ 1 Hz each) and a rocket every second or so that rises from the
 *   bottom, sheds a sparkling trail and, at its apex, bursts into 60–120 sparks: a peony (shell with a
 *   bright rim), a ring, a willow (slow gold sparks that droop) or, in the 'star' variant, a five-pointed
 *   star. Every bloom has a soft flash disc at its heart; sparks and flashes ramp up over 300 ms (never a
 *   pop) and fade out slowly, so nothing on screen flashes. At most 3 blooms per second.
 * Behaviors: gravity + drag per pattern, twinkle (≤ 2.4 Hz per spark), alpha envelopes.
 * Draw: cores in source-over, then one 'lighter' pass of glow sprites so overlapping sparks bloom white.
 * Tap: launches a rocket that bursts exactly where the finger is.
 * Still: three frozen blooms at different heights over the star field.
 * Params: palette (burst colors; default glow/accent/accent2/white), density; variant 'star'
 *   (Juneteenth): star-shaped bursts and, now and then, a big gold star that rises and bursts.
 */
import { Emitter, TAU, clamp, drag, envelope, expired, gravity, integrate, range, spawnEdge, twinkle, type ParticleInit } from '../particles';
import { RateLimiter } from '../timing';
import type { EffectFactory, EffectInput } from '../types';
import { Palette, PooledEffect, calm } from './shared';

export const STAR = 0;
export const ROCKET = 1;
export const TRAIL = 2;
export const FLASH = 3;
export const RISER = 4;
/** Spark kinds: 10 + pattern. */
export const SPARK = 10;
export const PEONY = 0;
export const RING = 1;
export const WILLOW = 2;
export const STARBURST = 3;

/** Luminance ramp of every bloom (seconds) — the accessibility floor is 0.3. */
export const BLOOM_RAMP = 0.3;
const ROCKET_GRAVITY = 420;
const GOLD = '#ffd166';
const SPARK_GRAVITY = [75, 60, 190, 65] as const;
const SPARK_DRAG = [1.4, 1.3, 0.55, 1.4] as const;

export function isSpark(kind: number): boolean {
  return kind >= SPARK;
}

/** Point on the outline of a five-pointed star (outer radius 1, inner 0.45) at perimeter fraction u. */
function starOutline(u: number, out: { x: number; y: number }): void {
  const f = (u - Math.floor(u)) * 10;
  const seg = Math.floor(f);
  const k = f - seg;
  const a0 = -Math.PI / 2 + (seg * Math.PI) / 5;
  const a1 = a0 + Math.PI / 5;
  const r0 = seg % 2 === 0 ? 1 : 0.45;
  const r1 = seg % 2 === 0 ? 0.45 : 1;
  out.x = Math.cos(a0) * r0 + (Math.cos(a1) * r1 - Math.cos(a0) * r0) * k;
  out.y = Math.sin(a0) * r0 + (Math.sin(a1) * r1 - Math.sin(a0) * r0) * k;
}

export class FireworksEffect extends PooledEffect {
  readonly describe = 'Fireworks blooming in the night sky';
  /** Blooms so far (tests: ≤ 3 per second). */
  bursts = 0;

  private readonly palette = new Palette();
  private readonly limiter = new RateLimiter(3, 1);
  private readonly trail = new Emitter();
  private readonly scratch = { x: 0, y: 0 };
  private variant = '';
  private started = false;
  private nextLaunch = 0;
  private nextRiser = 0;
  private launches = 0;
  // Burst parameters, read by the init closures.
  private burstColor = 0;
  private burstColor2 = 0;
  private burstPattern = PEONY;
  private burstScale = 1;
  private rocketTarget = 0;
  private rocketPattern = PEONY;
  private rocketColor = 0;

  private readonly initStar: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = STAR;
    pool.y[i]! *= 0.72;
    pool.size[i] = range(rand, 1.6, 3.2);
    pool.depth[i] = rand();
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.25, 0.9);
    pool.alpha[i] = 0.6;
  };

  private readonly initRocket: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = ROCKET;
    pool.size[i] = 4;
    pool.vx[i] = range(rand, -25, 25);
    pool.vy[i] = -Math.sqrt(2 * ROCKET_GRAVITY * Math.max(40, pool.y[i]! - this.rocketTarget));
    pool.aux[i] = this.rocketTarget;
    pool.color[i] = this.rocketColor;
    pool.rot[i] = this.rocketPattern;
    pool.maxLife[i] = 4;
  };

  private readonly initRiser: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = RISER;
    pool.size[i] = range(rand, 24, 32);
    pool.vx[i] = range(rand, -12, 12);
    pool.vy[i] = -Math.sqrt(2 * ROCKET_GRAVITY * 0.45 * Math.max(40, pool.y[i]! - this.rocketTarget));
    pool.aux[i] = this.rocketTarget;
    pool.rotV[i] = range(rand, -1.2, 1.2);
    pool.color[i] = this.rocketColor;
    pool.maxLife[i] = 6;
  };

  private readonly initTrail: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = TRAIL;
    pool.size[i] = range(rand, 2, 3.4);
    pool.vx[i] = range(rand, -22, 22);
    pool.vy[i] = range(rand, 20, 70);
    pool.maxLife[i] = range(rand, 0.3, 0.6);
    pool.color[i] = this.burstColor;
  };

  private readonly initSpark: ParticleInit = (pool, i, rand) => {
    const pattern = this.burstPattern;
    const scale = this.burstScale;
    pool.kind[i] = SPARK + pattern;
    pool.size[i] = range(rand, 2.5, 4.5);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 1.4, 2.4);
    pool.color[i] = rand() < 0.72 ? this.burstColor : this.burstColor2;
    pool.alpha[i] = 0;
    pool.maxLife[i] = pattern === WILLOW ? range(rand, 2.4, 3.2) : range(rand, 1.3, 2);
    let a = rand() * TAU;
    let speed: number;
    if (pattern === RING) {
      speed = 230 * scale * range(rand, 0.95, 1.05);
    } else if (pattern === WILLOW) {
      speed = range(rand, 90, 170) * scale;
    } else if (pattern === STARBURST) {
      starOutline(rand(), this.scratch);
      a = Math.atan2(this.scratch.y, this.scratch.x);
      speed = 250 * scale * Math.hypot(this.scratch.x, this.scratch.y) * range(rand, 0.96, 1.04);
    } else {
      speed = (0.35 + 0.65 * Math.sqrt(rand())) * 265 * scale;
    }
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed * (pattern === RING ? 0.8 : 1);
  };

  private readonly initFlash: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = FLASH;
    pool.size[i] = range(rand, 110, 150) * this.burstScale;
    pool.maxLife[i] = 1.1;
    pool.alpha[i] = 0;
    pool.color[i] = this.burstColor;
  };

  private sync(input: EffectInput): void {
    this.budget.frame(input.budget);
    this.palette.sync(input, (theme) => [theme.glow, theme.accent, theme.accent2, '#ffffff']);
    this.variant = input.params.variant ?? '';
  }

  private spawnStars(input: EffectInput): void {
    const n = this.budget.take(Math.min(clamp((input.w * input.h) / 22000, 20, 60), input.budget * 0.15));
    spawnEdge(this.pool, 'area', input.w, input.h, n, input.rand, this.initStar);
  }

  private pickPattern(rand: () => number): number {
    const r = rand();
    if (this.variant === 'star') return r < 0.45 ? STARBURST : r < 0.75 ? PEONY : r < 0.9 ? RING : WILLOW;
    return r < 0.5 ? PEONY : r < 0.75 ? RING : WILLOW;
  }

  /** Launches one rocket from the bottom at x that bursts around targetY. */
  private launch(x: number, targetY: number, input: EffectInput): void {
    if (this.budget.take(1) < 1) return;
    this.rocketTarget = targetY;
    this.rocketColor = this.palette.pick(input.rand);
    this.rocketPattern = this.pickPattern(input.rand);
    this.launches++;
    spawnEdge(this.pool, 'point', input.w, input.h, 1, input.rand, this.initRocket, x, input.h + 6);
  }

  /**
   * Blooms at (x, y) unless three already happened this second. Sparks take about a third of the budget,
   * clamped to 60–120; with fewer than 24 free slots only the flash appears.
   */
  private burst(x: number, y: number, color: number, pattern: number, scale: number, input: EffectInput): boolean {
    if (!this.limiter.allow(input.t)) return false;
    this.bursts++;
    this.burstColor = color;
    this.burstColor2 = this.palette.pick(input.rand);
    this.burstPattern = pattern;
    this.burstScale = scale;
    const wanted = clamp(input.budget * 0.34, 60, 120) * scale;
    const n = this.budget.take(wanted, 1);
    if (n >= 24) spawnEdge(this.pool, 'point', input.w, input.h, n, input.rand, this.initSpark, x, y);
    spawnEdge(this.pool, 'point', input.w, input.h, 1, input.rand, this.initFlash, x, y);
    return true;
  }

  step(input: EffectInput): void {
    const { w, h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      this.nextLaunch = t + 0.25;
      this.nextRiser = t + 3;
      this.spawnStars(input);
    }
    const k = calm(input.intensity);
    if (t >= this.nextLaunch) {
      this.launch(range(rand, 0.15, 0.85) * w, range(rand, 0.16, 0.5) * h, input);
      this.nextLaunch = t + (rand() < 0.3 ? 0.22 : range(rand, 0.75, 1.6)) / k;
    }
    if (this.variant === 'star' && t >= this.nextRiser) {
      this.nextRiser = t + range(rand, 4, 7) / k;
      if (this.budget.take(1) > 0) {
        this.rocketTarget = range(rand, 0.22, 0.4) * h;
        this.rocketColor = this.palette.pick(rand);
        spawnEdge(pool, 'point', w, h, 1, rand, this.initRiser, range(rand, 0.3, 0.7) * w, h + 20);
      }
    }
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === STAR) {
        pool.life[i]! += dt;
        twinkle(pool, i, pool.aux[i]!, 0.55, 0.45 + 0.5 * pool.depth[i]!);
        continue;
      }
      if (kind === ROCKET || kind === RISER) {
        gravity(pool, i, dt, kind === ROCKET ? ROCKET_GRAVITY : ROCKET_GRAVITY * 0.45);
        if (kind === RISER) pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        this.burstColor = pool.color[i]!;
        this.trail.spawn(pool, 'point', w, h, kind === ROCKET ? 55 : 40, dt, rand, this.initTrail, this.budget.take(3, 2), pool.x[i]!, pool.y[i]! + 4);
        const vy = pool.vy[i]!;
        if (vy >= -60 || pool.y[i]! <= pool.aux[i]!) {
          const pattern = kind === RISER ? STARBURST : pool.rot[i]!;
          if (this.burst(pool.x[i]!, pool.y[i]!, pool.color[i]!, pattern, kind === RISER ? 1.3 : 1, input)) pool.kill(i);
          else if (vy > 140 || expired(pool, i)) pool.kill(i);
        }
        continue;
      }
      if (kind === TRAIL) {
        gravity(pool, i, dt, 120);
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.02, 0.3);
        if (expired(pool, i)) pool.kill(i);
        continue;
      }
      if (kind === FLASH) {
        pool.life[i]! += dt;
        pool.alpha[i] = 0.55 * envelope(pool, i, BLOOM_RAMP, 0.7);
        if (expired(pool, i)) pool.kill(i);
        continue;
      }
      this.stepSpark(i, dt);
      if (expired(pool, i) || pool.y[i]! > h + 20) pool.kill(i);
    }
  }

  private stepSpark(i: number, dt: number): void {
    const pool = this.pool;
    const pattern = pool.kind[i]! - SPARK;
    gravity(pool, i, dt, SPARK_GRAVITY[pattern] ?? 75, 260);
    drag(pool, i, dt, SPARK_DRAG[pattern] ?? 1.4);
    integrate(pool, i, dt);
    const env = envelope(pool, i, BLOOM_RAMP, 0.55);
    twinkle(pool, i, pool.aux[i]!, 0.4, env);
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    this.launch(x, Math.min(y, input.h - 40), input);
  }

  still(input: EffectInput): void {
    const { w, h } = input;
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.spawnStars(input);
    this.frozenBloom(w * 0.25, h * 0.42, this.variant === 'star' ? STARBURST : PEONY, 0, 0.75, input);
    this.frozenBloom(w * 0.56, h * 0.26, RING, 1, 0.55, input);
    this.frozenBloom(w * 0.8, h * 0.46, WILLOW, 2, 1.0, input);
  }

  /** A bloom advanced `age` seconds in fixed steps so still frames use the live physics. */
  private frozenBloom(x: number, y: number, pattern: number, color: number, age: number, input: EffectInput): void {
    const pool = this.pool;
    this.burstColor = color;
    this.burstColor2 = (color + 1) % 4;
    this.burstPattern = pattern;
    this.burstScale = 1;
    const first = pool.count;
    const n = this.budget.take(Math.min(100, input.budget * 0.28), 2);
    spawnEdge(pool, 'point', input.w, input.h, n, input.rand, this.initSpark, x, y);
    spawnEdge(pool, 'point', input.w, input.h, 1, input.rand, this.initFlash, x, y);
    const flash = pool.count - 1;
    const steps = Math.round(age * 60);
    for (let k = 0; k < steps; k++) {
      for (let i = first; i < flash; i++) this.stepSpark(i, 1 / 60);
    }
    pool.life[flash] = Math.min(age, 0.55);
    pool.alpha[flash] = 0.55 * envelope(pool, flash, BLOOM_RAMP, 0.7);
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const starColor = input.theme.glow;
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      if (kind === STAR) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'circle', pool.size[i]!, starColor, x, y);
      } else if (kind === ROCKET) {
        ctx.globalAlpha = 1;
        sprites.draw(ctx, 'circle', 4, '#ffffff', x, y);
      } else if (kind === TRAIL) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'circle', pool.size[i]!, this.palette.color(pool.color[i]!), x, y);
      } else if (kind === RISER) {
        ctx.globalAlpha = 1;
        sprites.draw(ctx, 'star', pool.size[i]!, GOLD, x, y, pool.rot[i]!);
      } else if (isSpark(kind)) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'circle', pool.size[i]!, this.palette.color(pool.color[i]!), x, y);
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      if (kind === ROCKET) {
        ctx.globalAlpha = 0.7;
        sprites.draw(ctx, 'glow', 18, this.palette.color(pool.color[i]!), x, y);
      } else if (kind === RISER) {
        ctx.globalAlpha = 0.8;
        sprites.draw(ctx, 'glow', pool.size[i]! * 2.4, GOLD, x, y);
      } else if (kind === FLASH) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'glow', pool.size[i]!, this.palette.color(pool.color[i]!), x, y);
      } else if (isSpark(kind)) {
        ctx.globalAlpha = pool.alpha[i]! * 0.6;
        sprites.draw(ctx, 'glow', pool.size[i]! * 3.4, this.palette.color(pool.color[i]!), x, y);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}

export const fireworks: EffectFactory = (sprites) => new FireworksEffect(sprites);
