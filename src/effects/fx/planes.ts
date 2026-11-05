/**
 * planes — Father's Day paper airplanes.
 * Ambient: folded paper planes glide across the sky in three depths (far: small, pale, slow · near: big
 *   and quick), each on its own gentle sine path, nose turned along the path and banking into the turns
 *   (the sprite squashes as it tips). Now and then a nearer plane shows off: a full loop-the-loop or a
 *   barrel roll (the sprite flips over and back). Near planes leave a dotted pencil trail. Soft clouds
 *   drift in two layers — some behind the planes, a few in front — under a warm sun glow.
 * Behaviours: sine glide + heading (planes), parametric loop, roll flip, ease to cruise speed after a throw,
 *   drift with wrap (clouds), envelope (trail dots, whoosh puffs).
 * Tap: a plane is thrown from the finger toward the open side of the sky with a little whoosh, climbing
 *   fast and settling to a glide.
 * Still: planes mid-flight with their trails, clouds at rest.
 * Params: palette (paper colours), density.
 */
import type { Theme } from '../../theme/themes';
import { mixColor } from '../painters';
import { frameScenery, paperPlane, quant, softCloud } from '../painters/extra-whimsy';
import { TAU, clamp, envelope, expired, integrate, range, spawnEdge, type ParticleInit } from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { Palette, PooledEffect, calm } from './shared';

export const CLOUD = 0;
const SCENERY_END = 1;
export const PLANE = 1;
export const LOOP = 2;
export const ROLL = 3;
export const TRAIL = 4;
export const PUFF = 5;

const PAPER = ['#ffffff', '#ffd166', '#ff8fb8', '#9be7d3', '#ffb703', '#b197fc', '#ffffff'] as const;
const LOOP_SECONDS = 2.4;
const ROLL_SECONDS = 1.3;
/** Planes beyond the ambient target that taps may add before the oldest gives way. */
const EXTRA_PLANES = 5;

function smooth(u: number): number {
  const k = clamp(u, 0, 1);
  return k * k * (3 - 2 * k);
}

/** Cruise speed (px/s) for a plane at this depth. */
export function cruise(depth: number): number {
  return 38 + 52 * depth;
}

function amplitude(depth: number): number {
  return 12 + 24 * depth;
}

export class PlanesEffect extends PooledEffect {
  readonly describe = 'Paper airplanes gliding and looping through the clouds';
  /** Planes thrown by taps (tests). */
  launched = 0;
  /** Loops and rolls started (tests). */
  stunts = 0;

  private readonly palette = new Palette();
  private started = false;
  private spawnWait = 0;
  private planes = 0;
  private cloudTint = '#ffffff';
  private trailTint = '#ffffff';
  private sunTint = '#ffd166';
  private shadowTint = '#0f2a4a';
  private night = false;
  private lastTheme: Theme | null = null;
  private placeArea = false;
  private nextDir = 0;

  constructor(sprites: SpriteCache) {
    super(sprites, 640);
    if (!sprites.has('planes:plane')) sprites.register('planes:plane', paperPlane);
    if (!sprites.has('planes:cloud')) sprites.register('planes:cloud', softCloud);
  }

  // ---------------------------------------------------------------- particle inits

  /** A plane flying in direction `nextDir` (0 = either way). */
  private readonly initPlane: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    const dir = this.nextDir !== 0 ? this.nextDir : rand() < 0.5 ? 1 : -1;
    pool.kind[i] = PLANE;
    pool.depth[i] = depth;
    pool.size[i] = quant(24 + 56 * depth * depth, 4);
    pool.vx[i] = dir * cruise(depth);
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.12, 0.24);
    pool.aux[i] = pool.y[i]!;
    pool.color[i] = this.palette.pick(rand);
    pool.alpha[i] = 0.72 + 0.28 * depth;
    pool.life[i] = this.placeArea ? 1 + rand() * 2 : 0;
  };

  private readonly initCloud: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    pool.kind[i] = CLOUD;
    pool.depth[i] = depth;
    pool.size[i] = quant(140 + 220 * depth, 20);
    pool.vx[i] = 4 + 10 * depth;
    pool.alpha[i] = 0.55 + 0.35 * depth;
  };

  private readonly initTrail: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = TRAIL;
    pool.size[i] = range(rand, 2.5, 4);
    pool.maxLife[i] = range(rand, 1.1, 1.6);
    pool.alpha[i] = 0.7;
  };

  private readonly initPuff: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const v = range(rand, 30, 90);
    pool.kind[i] = PUFF;
    pool.vx[i] = Math.cos(a) * v;
    pool.vy[i] = Math.sin(a) * v;
    pool.size[i] = quant(range(rand, 10, 22), 4);
    pool.maxLife[i] = range(rand, 0.5, 0.8);
    pool.alpha[i] = 0;
  };

  // ---------------------------------------------------------------- setup

  private sync(input: EffectInput): void {
    frameScenery(this.budget, input.budget, SCENERY_END);
    this.palette.sync(input, () => PAPER);
    const theme = input.theme;
    if (theme !== this.lastTheme) {
      this.lastTheme = theme;
      this.night = theme.mood === 'night';
      this.cloudTint = this.night ? mixColor(theme.bg2, '#c9d4ff', 0.4) : '#ffffff';
      this.trailTint = this.night ? '#ffffff' : mixColor('#ffffff', theme.ink, 0.3);
      this.sunTint = this.night ? '#fff1b8' : theme.glow;
      this.shadowTint = this.night ? '#000000' : theme.ink;
    }
  }

  private planeTarget(input: EffectInput): number {
    return clamp(Math.round(input.budget * 0.03), 3, input.w < 600 ? 5 : 9);
  }

  private start(input: EffectInput, still: boolean): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    this.started = true;
    pool.clear();
    spawnEdge(pool, 'area', w, h * 0.8, this.budget.take(w < 600 ? 4 : 7), rand, this.initCloud);
    const n = this.planeTarget(input);
    this.placeArea = true;
    for (let k = 0; k < n; k++) {
      // Spread across the width in slots, so the first frame is never a clump.
      const x = ((k + 0.25 + 0.5 * rand()) / n) * w;
      spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initPlane, Math.max(2, x), h * range(rand, 0.1, 0.62));
    }
    this.placeArea = false;
    this.spawnWait = 1;
    if (still) {
      for (let i = pool.count - 1; i >= 0; i--) if (pool.kind[i] === PLANE) this.trailBehind(i, input);
    }
    this.headings();
  }

  /** Still frame: a dotted trail laid along the path the plane has just flown. */
  private trailBehind(i: number, input: EffectInput): void {
    const pool = this.pool;
    if (pool.depth[i]! < 0.45) return;
    const vx = pool.vx[i]!;
    const amp = amplitude(pool.depth[i]!);
    const w0 = TAU * pool.rotV[i]!;
    const x = pool.x[i]!;
    const base = pool.aux[i]!;
    const ph = pool.phase[i]!;
    for (let k = 1; k <= 10; k++) {
      const back = k * 0.09;
      const n = spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initTrail, x - vx * back, base + amp * Math.sin(ph - w0 * back));
      if (n === 0) return;
      const j = pool.count - 1;
      pool.life[j] = back * 1.1;
    }
  }

  /** Sets each gliding plane's y and heading from its sine path. */
  private headings(): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i];
      if (kind !== PLANE && kind !== ROLL) continue;
      const amp = amplitude(pool.depth[i]!);
      const w0 = TAU * pool.rotV[i]!;
      pool.y[i] = pool.aux[i]! + amp * Math.sin(pool.phase[i]!);
      pool.vy[i] = amp * w0 * Math.cos(pool.phase[i]!);
      pool.rot[i] = Math.atan2(pool.vy[i]!, pool.vx[i]!);
    }
  }

  // ---------------------------------------------------------------- loop

  step(input: EffectInput): void {
    const { w, h, dt, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) this.start(input, false);
    const target = this.planeTarget(input);
    this.spawnWait -= dt * calm(input.intensity);
    if (this.planes < target && this.spawnWait <= 0) {
      this.spawnWait = range(rand, 1.2, 2.6);
      const left = rand() < 0.5;
      this.nextDir = left ? 1 : -1;
      spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initPlane, left ? -40 : w + 40, h * range(rand, 0.08, 0.6));
      this.nextDir = 0;
    }
    let planes = 0;
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === PLANE || kind === ROLL) {
        planes++;
        this.glide(i, input);
        const x = pool.x[i]!;
        if (pool.kind[i] !== LOOP && (pool.vx[i]! > 0 ? x > w + 80 : x < -80)) {
          pool.kill(i);
          planes--;
        }
      } else if (kind === LOOP) {
        planes++;
        this.loop(i, input);
      } else if (kind === CLOUD) {
        pool.x[i]! += pool.vx[i]! * dt;
        if (pool.x[i]! > w + pool.size[i]! * 0.6) pool.x[i] = -pool.size[i]! * 0.6;
      } else if (kind === TRAIL) {
        pool.life[i]! += dt;
        pool.alpha[i] = 0.7 * envelope(pool, i, 0, 0.9);
        if (expired(pool, i)) pool.kill(i);
      } else if (kind === PUFF) {
        pool.vx[i]! *= Math.max(0, 1 - 3 * dt);
        pool.vy[i]! *= Math.max(0, 1 - 3 * dt);
        integrate(pool, i, dt);
        pool.alpha[i] = 0.6 * envelope(pool, i, 0.05, 0.45);
        if (expired(pool, i)) pool.kill(i);
      }
    }
    this.planes = planes;
    if (planes > target + EXTRA_PLANES) this.retireOldest();
  }

  /** Too many thrown planes: the one that has been flying longest leaves (it is usually far off). */
  private retireOldest(): void {
    const pool = this.pool;
    let oldest = -1;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== PLANE) continue;
      if (oldest < 0 || pool.life[i]! > pool.life[oldest]!) oldest = i;
    }
    if (oldest >= 0) {
      pool.kill(oldest);
      this.planes--;
    }
  }

  /** Sine glide; ease back to cruise after a throw; maybe start a stunt; drop trail dots. */
  private glide(i: number, input: EffectInput): void {
    const pool = this.pool;
    const { dt, rand } = input;
    const depth = pool.depth[i]!;
    const dir = pool.vx[i]! < 0 ? -1 : 1;
    pool.vx[i]! += (dir * cruise(depth) - pool.vx[i]!) * Math.min(1, dt * 0.8);
    pool.x[i]! += pool.vx[i]! * dt;
    pool.phase[i]! += TAU * pool.rotV[i]! * dt;
    pool.life[i]! += dt;
    const amp = amplitude(depth);
    pool.y[i] = pool.aux[i]! + amp * Math.sin(pool.phase[i]!);
    pool.vy[i] = amp * TAU * pool.rotV[i]! * Math.cos(pool.phase[i]!);
    pool.rot[i] = Math.atan2(pool.vy[i]!, pool.vx[i]!);
    if (pool.kind[i] === ROLL) {
      if (pool.life[i]! >= ROLL_SECONDS) {
        pool.kind[i] = PLANE;
        pool.life[i] = 3;
      }
    } else if (depth > 0.35 && pool.life[i]! > 3 && rand() < dt * 0.05) {
      this.stunts++;
      const x = pool.x[i]!;
      const roomy = x > 120 && x < input.w - 120 && pool.y[i]! > 140;
      if (roomy && rand() < 0.6) {
        pool.kind[i] = LOOP;
        pool.aux[i] = pool.y[i]!;
        pool.vy[i] = x;
      } else {
        pool.kind[i] = ROLL;
      }
      pool.life[i] = 0;
    }
    if (depth > 0.45 && rand() < dt * 9 && this.budget.room() > 3) this.dot(i, input);
  }

  /** Loop-the-loop: a circle of radius R climbing from the entry point while drifting forward. */
  private loop(i: number, input: EffectInput): void {
    const pool = this.pool;
    const { dt, rand } = input;
    const depth = pool.depth[i]!;
    const dir = pool.vx[i]! < 0 ? -1 : 1;
    const speed = Math.abs(pool.vx[i]!);
    const R = 34 + 44 * depth;
    pool.life[i]! += dt;
    const life = pool.life[i]!;
    const u = life / LOOP_SECONDS;
    const th = TAU * smooth(u);
    const thV = (TAU * 6 * clamp(u, 0, 1) * (1 - clamp(u, 0, 1))) / LOOP_SECONDS;
    pool.x[i] = pool.vy[i]! + dir * (R * Math.sin(th) + speed * life);
    pool.y[i] = pool.aux[i]! - R * (1 - Math.cos(th));
    pool.rot[i] = Math.atan2(-R * Math.sin(th) * thV, dir * (R * Math.cos(th) * thV + speed));
    if (u >= 1) {
      pool.kind[i] = PLANE;
      pool.y[i] = pool.aux[i]!;
      pool.phase[i] = 0;
      pool.life[i] = 3;
    }
    if (rand() < dt * 24 && this.budget.room() > 3) this.dot(i, input);
  }

  private dot(i: number, input: EffectInput): void {
    const pool = this.pool;
    const back = pool.size[i]! * 0.45;
    const c = Math.cos(pool.rot[i]!);
    const s = Math.sin(pool.rot[i]!);
    spawnEdge(pool, 'point', input.w, input.h, 1, input.rand, this.initTrail, pool.x[i]! - c * back, pool.y[i]! - s * back);
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    if (!this.started) this.start(input, false);
    const pool = this.pool;
    const { w, h, rand } = input;
    if (this.budget.room() < 1) frameScenery(this.budget, Math.max(0, input.budget - 1), SCENERY_END);
    const dir = x < w / 2 ? 1 : -1;
    this.nextDir = dir;
    const n = spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initPlane, x, y);
    this.nextDir = 0;
    if (n > 0) {
      const i = pool.count - 1;
      pool.depth[i] = 1;
      pool.size[i] = 64;
      pool.alpha[i] = 1;
      pool.vx[i] = dir * 230;
      // Phase ¾π: the sine path is heading upward here, so the throw climbs first.
      pool.phase[i] = Math.PI * 0.75;
      pool.aux[i] = y - amplitude(1) * Math.sin(Math.PI * 0.75);
      pool.life[i] = 1;
      this.launched++;
    }
    spawnEdge(pool, 'point', w, h, this.budget.take(7), rand, this.initPuff, x, y);
    this.headings();
  }

  still(input: EffectInput): void {
    this.sync(input);
    this.start(input, true);
  }

  // ---------------------------------------------------------------- drawing

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const { w, h } = input;
    const sprites = this.sprites;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = this.night ? 0.25 : 0.5;
    const sun = quant(Math.max(w, h) * 0.6, 32);
    sprites.draw(ctx, 'glow', sun, this.sunTint, w * 0.88, h * 0.06);
    ctx.globalCompositeOperation = 'source-over';
    this.drawClouds(ctx, 0, 0.7);
    this.drawTrail(ctx);
    this.drawPlanes(ctx);
    this.drawClouds(ctx, 0.7, 2);
    ctx.globalAlpha = 1;
  }

  private drawClouds(ctx: CanvasRenderingContext2D, lo: number, hi: number): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== CLOUD) continue;
      const d = pool.depth[i]!;
      if (d < lo || d >= hi) continue;
      // Front clouds are a little see-through, so a plane passing behind them still shows.
      ctx.globalAlpha = hi > 1 ? pool.alpha[i]! * 0.6 : pool.alpha[i]!;
      this.sprites.draw(ctx, 'planes:cloud', pool.size[i]!, this.cloudTint, pool.x[i]!, pool.y[i]!);
    }
  }

  private drawTrail(ctx: CanvasRenderingContext2D): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i];
      if (kind === TRAIL) {
        ctx.globalAlpha = pool.alpha[i]!;
        this.sprites.draw(ctx, 'circle', pool.size[i]!, this.trailTint, pool.x[i]!, pool.y[i]!);
      } else if (kind === PUFF) {
        ctx.globalAlpha = pool.alpha[i]!;
        this.sprites.draw(ctx, 'glow', pool.size[i]!, '#ffffff', pool.x[i]!, pool.y[i]!);
      }
    }
  }

  /** Far to near; heading from `rot`; upright either way (flip vertically when flying left), banking. */
  private drawPlanes(ctx: CanvasRenderingContext2D): void {
    const pool = this.pool;
    for (let pass = 0; pass < 3; pass++) {
      const lo = pass / 3;
      const hi = pass === 2 ? 2 : (pass + 1) / 3;
      for (let i = 0; i < pool.count; i++) {
        const kind = pool.kind[i];
        if (kind !== PLANE && kind !== LOOP && kind !== ROLL) continue;
        const d = pool.depth[i]!;
        if (d < lo || d >= hi) continue;
        const dir = pool.vx[i]! < 0 ? -1 : 1;
        let sy = dir;
        if (kind === ROLL) {
          sy = dir * Math.cos(TAU * smooth(pool.life[i]! / ROLL_SECONDS));
        } else if (kind === PLANE) {
          // Bank into the turn: the wing tips toward the viewer as the path curves.
          const curve = Math.sin(pool.phase[i]!);
          sy = dir * (1 - 0.28 * Math.abs(curve));
        }
        if (Math.abs(sy) < 0.08) sy = sy < 0 ? -0.08 : 0.08;
        const a = pool.alpha[i]! * (kind === PLANE ? Math.min(1, pool.life[i]!) : 1);
        const size = pool.size[i]!;
        // A soft shadow on the sky below gives the paper some lift (and reads on pale skies).
        ctx.globalAlpha = a * 0.14 * d;
        this.sprites.draw(ctx, 'planes:plane', size, this.shadowTint, pool.x[i]! + size * 0.12, pool.y[i]! + size * 0.35, pool.rot[i]!, 1, sy * 0.7);
        ctx.globalAlpha = a;
        this.sprites.draw(ctx, 'planes:plane', pool.size[i]!, this.palette.color(pool.color[i]!), pool.x[i]!, pool.y[i]!, pool.rot[i]!, 1, sy);
      }
    }
  }
}

export const planes: EffectFactory = (sprites) => new PlanesEffect(sprites);
