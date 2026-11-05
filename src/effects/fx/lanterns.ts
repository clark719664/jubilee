/**
 * lanterns — Lunar New Year and the Lantern Festival.
 * Variant 'hanging' (default; Lunar New Year):
 *   Ambient: red lanterns hang on gold cords from the top edge and swing as real pendulums (period from
 *   the cord length, each with its own phase), each in a warm halo; gold coins and red envelopes flutter
 *   down; now and then a small firecracker pops low in the sky (a soft glow that ramps over 300 ms, a
 *   spray of sparks and a few red paper shreds), never more than 3 pops a second.
 *   Tap: a firecracker string — a chain of 5 small pops over 1 s running down from the finger; lanterns
 *   near the finger get a push and swing higher.
 *   Still: lanterns hanging at rest, coins and envelopes caught mid-air.
 * Variant 'rising' (Lantern Festival):
 *   Ambient: warm sky lanterns rise and sway in three depths (far: small, dim, slow), each with a halo.
 *   Press-and-hold: a lantern grows under the finger (and follows it); release and it floats up.
 *   Tap: a lantern lifts off from the finger. Still: lanterns afloat at every height.
 * Behaviours: pendulum (hanging), flutter + gravity + spin (coins, envelopes, shreds), drag + gravity +
 *   envelope (sparks), rise + sway (sky lanterns), twinkle (gold motes).
 * Params: density, variant.
 */
import { frameKeeping, quantize, skyLantern } from '../painters/extra-night';
import {
  Emitter, TAU, clamp, drag, envelope, expired, flutter, gravity, integrate, range, spawnEdge, steadyRate, sway,
  twinkle, type ParticleInit,
} from '../particles';
import { RateLimiter } from '../timing';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { PooledEffect, calm } from './shared';

export const LANTERN = 0;
const SCENERY_END = 1;
export const COIN = 1;
export const ENVELOPE = 2;
export const POP = 3;
export const SPARK = 4;
export const SHRED = 5;
export const MOTE = 6;
export const SKY = 7;
export const GROW = 8;

/** Firecracker glows ramp up over at least this long (no flashing). */
export const POP_RAMP = 0.3;
const CHAIN = 5;
const CHAIN_SECONDS = 1;
const LANTERN_COLORS = ['#e8202a', '#e8202a', '#ff4d2e', '#ffb703'] as const;
const SKY_COLORS = ['#ff9f1c', '#ffb703', '#ff7a2e'] as const;
const SPARK_COLORS = ['#ffd166', '#ffffff', '#ff6b4a'] as const;
const GOLD = '#ffd166';
const ENVELOPE_RED = '#f0262f';

export class LanternsEffect extends PooledEffect {
  readonly describe: string = 'Red lanterns swinging while gold coins and lucky envelopes flutter down';
  /** Pops so far (tests: ambient pops stay within 3 per second). */
  pops = 0;

  private readonly limiter = new RateLimiter(3, 1);
  private readonly fall = new Emitter();
  private readonly sky = new Emitter();
  private readonly chainT = new Float64Array(CHAIN);
  private readonly chainX = new Float32Array(CHAIN);
  private readonly chainY = new Float32Array(CHAIN);
  private chainLeft = 0;
  private variant = 'hanging';
  private started = false;
  private nextPop = 0;
  private pressing = false;
  private releasedAt = -10;
  private releasedX = 0;
  private releasedY = 0;
  private skyDepth = 0;
  private skyPlace = false;

  constructor(sprites: SpriteCache) {
    super(sprites, 768);
    if (!sprites.has('lanterns:sky')) sprites.register('lanterns:sky', skyLantern);
  }

  get rising(): boolean {
    return this.variant === 'rising';
  }

  // ---------------------------------------------------------------- particle inits

  private readonly initLantern: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = LANTERN;
    pool.aux[i] = pool.x[i]!;
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.06, 0.12);
    pool.depth[i] = range(rand, 0.15, 0.36);
    pool.color[i] = rand() < 0.2 ? 3 : Math.floor(rand() * 3) % 3;
  };

  private readonly initFalling: ParticleInit = (pool, i, rand) => {
    const coin = rand() < 0.6;
    pool.kind[i] = coin ? COIN : ENVELOPE;
    pool.depth[i] = range(rand, 0.4, 1);
    pool.size[i] = quantize((coin ? 14 : 20) + (coin ? 12 : 16) * pool.depth[i]!, 2);
    pool.aux[i] = range(rand, 35, 60) * (0.6 + 0.6 * pool.depth[i]!);
    pool.vy[i] = pool.aux[i]!;
    pool.phase[i] = rand() * TAU;
    pool.rot[i] = range(rand, -0.5, 0.5);
    pool.rotV[i] = range(rand, 0.4, 1.1);
    pool.alpha[i] = 0.75 + 0.25 * pool.depth[i]!;
  };

  private readonly initMote: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = MOTE;
    pool.size[i] = range(rand, 2, 4);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.2, 0.7);
    pool.vy[i] = range(rand, -8, -3);
    pool.vx[i] = range(rand, -4, 4);
  };

  private readonly initPop: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = POP;
    pool.size[i] = range(rand, 56, 80);
    pool.maxLife[i] = 1;
    pool.alpha[i] = 0;
  };

  private readonly initSpark: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const v = range(rand, 70, 210);
    pool.kind[i] = SPARK;
    pool.vx[i] = Math.cos(a) * v;
    pool.vy[i] = Math.sin(a) * v;
    pool.size[i] = range(rand, 2.5, 4);
    pool.maxLife[i] = range(rand, 0.6, 1);
    pool.color[i] = Math.floor(rand() * 3) % 3;
    pool.alpha[i] = 0;
  };

  private readonly initShred: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const v = range(rand, 40, 120);
    pool.kind[i] = SHRED;
    pool.vx[i] = Math.cos(a) * v;
    pool.vy[i] = Math.sin(a) * v - 40;
    pool.size[i] = range(rand, 6, 9);
    pool.phase[i] = rand() * TAU;
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -5, 5);
    pool.maxLife[i] = range(rand, 1.6, 2.4);
  };

  private readonly initSky: ParticleInit = (pool, i, rand) => {
    const depth = this.skyDepth > 0 ? this.skyDepth : rand();
    pool.kind[i] = SKY;
    pool.depth[i] = depth;
    pool.size[i] = quantize(18 + 48 * depth * depth, 4);
    pool.aux[i] = 10 + 30 * depth;
    pool.vy[i] = -pool.aux[i]!;
    pool.phase[i] = rand() * TAU;
    pool.color[i] = Math.floor(rand() * 3) % 3;
    pool.alpha[i] = 0.55 + 0.45 * depth;
    pool.rotV[i] = range(rand, 0.08, 0.2);
    if (this.skyPlace) pool.y[i] = pool.y[i]! * 0.95;
  };

  private readonly initGrow: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = GROW;
    pool.depth[i] = 1;
    pool.size[i] = 16;
    pool.phase[i] = rand() * TAU;
    pool.color[i] = Math.floor(rand() * 3) % 3;
    pool.alpha[i] = 1;
    pool.rotV[i] = 0.12;
  };

  // ---------------------------------------------------------------- setup

  private sync(input: EffectInput): void {
    frameKeeping(this.budget, input.budget, SCENERY_END);
    const v = input.params.variant === 'rising' ? 'rising' : 'hanging';
    if (v !== this.variant) {
      this.variant = v;
      this.started = false;
      this.pool.clear();
    }
  }

  private lanternCount(w: number): number {
    return w < 520 ? 4 : w < 900 ? 5 : 7;
  }

  private build(input: EffectInput, still: boolean): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    const k = calm(input.intensity);
    if (this.rising) {
      this.skyPlace = true;
      this.skyDepth = 0;
      spawnEdge(pool, 'area', w, h, this.budget.take(this.skyTarget(input.budget) * (still ? 1 : 0.8)), rand, this.initSky);
      this.skyPlace = false;
    } else {
      const n = this.lanternCount(w);
      for (let s = 0; s < n; s++) spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initLantern, s, 0);
      this.layout(input);
      spawnEdge(pool, 'area', w, h, this.budget.take(this.fallTarget(input.budget) * (still ? 0.9 : 0.7) * k), rand, this.initFalling);
    }
    spawnEdge(pool, 'area', w, h, this.budget.take(clamp(input.budget * 0.06, 6, 20)), rand, this.initMote);
  }

  private fallTarget(budget: number): number {
    return clamp(budget * 0.25, 12, 60);
  }

  private skyTarget(budget: number): number {
    return clamp(budget * 0.14, 10, 34);
  }

  /** Re-places the hanging lanterns for the current width (anchors evenly spread, cords of varied length). */
  private layout(input: EffectInput): void {
    const { w, h } = input;
    const pool = this.pool;
    const n = this.lanternCount(w);
    const size = quantize(clamp(Math.min(w / (n + 1.5), h * 0.14), 44, 96), 4);
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== LANTERN) continue;
      const slot = pool.aux[i]!;
      // The anchor on the top edge lives in vx (lanterns never integrate).
      pool.vx[i] = (w * (slot + 0.5)) / n + (slot % 2 === 0 ? -0.08 : 0.08) * (w / n);
      pool.size[i] = slot % 3 === 1 ? size * 0.82 : size;
    }
  }

  /** Pendulum: the lantern hangs on a cord of depth·h px from its anchor (vx, 0); period grows with the cord. */
  private swing(i: number, h: number, t: number): void {
    const pool = this.pool;
    const L = h * pool.depth[i]!;
    const omega = Math.sqrt(9.8 / Math.max(0.6, L / 120)) * 0.55;
    const theta = pool.rotV[i]! * Math.sin(omega * t + pool.phase[i]!);
    const R = L + pool.size[i]! * 0.5;
    pool.rot[i] = -theta;
    pool.x[i] = pool.vx[i]! + Math.sin(theta) * R;
    pool.y[i] = Math.cos(theta) * R;
  }

  // ---------------------------------------------------------------- step

  step(input: EffectInput): void {
    const { w, h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      this.nextPop = t + 1.2;
      this.chainLeft = 0;
      this.build(input, false);
    }
    const k = calm(input.intensity);
    if (this.rising) {
      const rate = steadyRate(this.skyTarget(input.budget), (h + 80) / 26, 1) * k;
      this.skyDepth = 0;
      this.sky.spawn(pool, 'bottom', w, h, rate, dt, rand, this.initSky, this.budget.room());
    } else {
      this.layout(input);
      const rate = steadyRate(this.fallTarget(input.budget), (h + 40) / 55, 0.9) * k;
      this.fall.spawn(pool, 'top', w, h, rate, dt, rand, this.initFalling, this.budget.take(4, 20));
      if (t >= this.nextPop && this.chainLeft === 0) {
        this.nextPop = t + range(rand, 1.4, 3.2) / k;
        this.pop(range(rand, 0.12, 0.88) * w, range(rand, 0.5, 0.8) * h, input, true);
      }
      this.runChain(input);
    }
    const span = w + 80;
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === LANTERN) {
        pool.life[i]! += dt;
        if (pool.rotV[i]! > 0.11) pool.rotV[i]! -= 0.03 * dt;
        this.swing(i, h, t);
      } else if (kind === COIN || kind === ENVELOPE) {
        gravity(pool, i, dt, 60, pool.aux[i]!);
        flutter(pool, i, dt, kind === COIN ? 10 : 16, kind === COIN ? 0.7 : 0.45);
        pool.rot[i]! += Math.sin(pool.phase[i]! * 0.5) * pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        if (pool.y[i]! > h + 30) pool.kill(i);
      } else if (kind === MOTE) {
        integrate(pool, i, dt);
        twinkle(pool, i, pool.aux[i]!, 0.7, 0.8);
        if (pool.y[i]! < -10) pool.y[i] = h + 10;
      } else if (kind === POP) {
        pool.life[i]! += dt;
        pool.alpha[i] = 0.7 * envelope(pool, i, POP_RAMP, 0.6);
        if (expired(pool, i)) pool.kill(i);
      } else if (kind === SPARK) {
        drag(pool, i, dt, 3);
        gravity(pool, i, dt, 90);
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.18, 0.45);
        if (expired(pool, i)) pool.kill(i);
      } else if (kind === SHRED) {
        drag(pool, i, dt, 1.6);
        gravity(pool, i, dt, 120, 50);
        flutter(pool, i, dt, 8, 1.2);
        pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.1, 0.6);
        if (expired(pool, i) || pool.y[i]! > h + 10) pool.kill(i);
      } else if (kind === SKY) {
        const target = -pool.aux[i]!;
        pool.vy[i]! += (target - pool.vy[i]!) * 0.8 * dt;
        sway(pool, i, dt, 4 + 10 * pool.depth[i]!, pool.rotV[i]!);
        integrate(pool, i, dt);
        const x = pool.x[i]!;
        if (x < -40) pool.x[i] = x + span;
        else if (x > w + 40) pool.x[i] = x - span;
        if (pool.y[i]! < -pool.size[i]! - 30) pool.kill(i);
      } else if (kind === GROW) {
        this.grow(i, input);
      }
    }
  }

  private grow(i: number, input: EffectInput): void {
    const pool = this.pool;
    const dt = input.dt;
    pool.life[i]! += dt;
    pool.size[i] = 16 + 64 * Math.min(1, pool.life[i]! / 1.8);
    pool.phase[i]! += dt * 2;
    const p = input.pointer;
    if (p && p.down) {
      pool.x[i]! += (p.x - pool.x[i]!) * Math.min(1, 10 * dt);
      pool.y[i]! += (p.y - pool.y[i]!) * Math.min(1, 10 * dt);
    }
    if (!this.pressing) this.release(i, input);
  }

  /** A grown (or growing) lantern lets go and floats up as a near sky lantern. */
  private release(i: number, input: EffectInput): void {
    const pool = this.pool;
    pool.kind[i] = SKY;
    pool.size[i] = quantize(Math.max(36, pool.size[i]!), 4);
    pool.depth[i] = 1;
    pool.aux[i] = 30 + pool.size[i]! * 0.25;
    pool.vy[i] = -6;
    pool.alpha[i] = 1;
    this.releasedAt = input.t;
    this.releasedX = pool.x[i]!;
    this.releasedY = pool.y[i]!;
  }

  // ---------------------------------------------------------------- firecrackers

  /** One small pop: a soft glow that ramps over 300 ms, sparks and paper shreds. */
  private pop(x: number, y: number, input: EffectInput, limited: boolean): void {
    if (limited && !this.limiter.allow(input.t)) return;
    this.pops++;
    const pool = this.pool;
    spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initPop, x, y);
    spawnEdge(pool, 'point', input.w, input.h, this.budget.take(10, 1), input.rand, this.initSpark, x, y);
    spawnEdge(pool, 'point', input.w, input.h, this.budget.take(4, 1), input.rand, this.initShred, x, y);
  }

  private runChain(input: EffectInput): void {
    while (this.chainLeft > 0) {
      const k = CHAIN - this.chainLeft;
      if (input.t < this.chainT[k]!) break;
      this.pop(this.chainX[k]!, this.chainY[k]!, input, false);
      this.chainLeft--;
    }
  }

  // ---------------------------------------------------------------- input

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    if (!this.started) this.step(input);
    const pool = this.pool;
    if (this.rising) {
      const recent = input.t - this.releasedAt < 0.6 && Math.hypot(x - this.releasedX, y - this.releasedY) < 60;
      if (recent) return;
      this.skyDepth = 1;
      const n = spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initSky, x, y);
      this.skyDepth = 0;
      if (n > 0) {
        const i = pool.count - 1;
        pool.size[i] = 56;
        pool.vy[i] = -4;
      }
      return;
    }
    // A firecracker string running down from the finger; ambient pops wait for it to finish.
    const gap = CHAIN_SECONDS / CHAIN;
    for (let k = 0; k < CHAIN; k++) {
      this.chainT[k] = input.t + k * gap;
      this.chainX[k] = x + (k % 2 === 0 ? -6 : 6);
      this.chainY[k] = Math.min(input.h - 20, y + k * 26);
    }
    this.chainLeft = CHAIN;
    this.nextPop = Math.max(this.nextPop, input.t + CHAIN_SECONDS + 1);
    this.runChain(input);
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== LANTERN) continue;
      if (Math.abs(pool.x[i]! - x) < 160 && y < pool.y[i]! + 200) pool.rotV[i] = Math.min(0.32, pool.rotV[i]! + 0.12);
    }
  }

  press(x: number, y: number, down: boolean, input: EffectInput): void {
    if (!this.rising) return;
    this.sync(input);
    const pool = this.pool;
    if (down) {
      this.pressing = true;
      for (let i = 0; i < pool.count; i++) if (pool.kind[i] === GROW) return;
      spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initGrow, x, y);
    } else {
      this.pressing = false;
      for (let i = 0; i < pool.count; i++) if (pool.kind[i] === GROW) this.release(i, input);
    }
  }

  still(input: EffectInput): void {
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.started = true;
    this.chainLeft = 0;
    this.build(input, true);
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind === LANTERN) {
        pool.rotV[i] = 0.05;
        this.swing(i, input.h, 0.4);
      } else if (kind === MOTE) {
        pool.alpha[i] = 0.5;
      }
    }
  }

  // ---------------------------------------------------------------- draw

  draw(ctx: CanvasRenderingContext2D, _input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const n = pool.count;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i]!;
      if (kind === LANTERN) {
        ctx.globalAlpha = 0.5;
        sprites.draw(ctx, 'glow', pool.size[i]! * 2.6, GOLD, pool.x[i]!, pool.y[i]!);
      } else if (kind === SKY || kind === GROW) {
        ctx.globalAlpha = 0.25 + 0.4 * pool.depth[i]!;
        sprites.draw(ctx, 'glow', quantize(pool.size[i]! * 2.8, 8), '#ffb347', pool.x[i]!, pool.y[i]! + pool.size[i]! * 0.15);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    if (!this.rising) this.drawCords(ctx);
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i]!;
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      if (kind === LANTERN) {
        ctx.globalAlpha = 1;
        sprites.draw(ctx, 'lantern', pool.size[i]!, LANTERN_COLORS[pool.color[i]! % 4]!, x, y, pool.rot[i]!);
      } else if (kind === COIN) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'coin', pool.size[i]!, GOLD, x, y, pool.rot[i]!, Math.max(0.15, Math.abs(Math.cos(pool.phase[i]!))), 1);
      } else if (kind === ENVELOPE) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'envelope', pool.size[i]!, ENVELOPE_RED, x, y, pool.rot[i]!, Math.max(0.2, Math.abs(Math.cos(pool.phase[i]!))), 1);
      } else if (kind === SHRED) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'confettiRect', 8, '#ff3b30', x, y, pool.rot[i]!, Math.max(0.2, Math.abs(Math.cos(pool.phase[i]!))), 1);
      } else if (kind === SKY || kind === GROW) {
        ctx.globalAlpha = pool.alpha[i]!;
        const lean = 0.06 * Math.sin(pool.phase[i]!);
        sprites.draw(ctx, 'lanterns:sky', kind === GROW ? quantize(pool.size[i]!, 4) : pool.size[i]!, SKY_COLORS[pool.color[i]! % 3]!, x, y, lean);
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i]!;
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      if (kind === POP) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'glow', pool.size[i]!, '#ffcf6b', x, y);
      } else if (kind === SPARK) {
        const c = SPARK_COLORS[pool.color[i]! % 3]!;
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'circle', pool.size[i]!, c, x, y);
        ctx.globalAlpha = pool.alpha[i]! * 0.5;
        sprites.draw(ctx, 'glow', 14, c, x, y);
      } else if (kind === MOTE) {
        ctx.globalAlpha = pool.alpha[i]! * 0.6;
        sprites.draw(ctx, 'glow', pool.size[i]! * 3, GOLD, x, y);
      } else if (kind === SKY || kind === GROW) {
        ctx.globalAlpha = 0.5 * pool.alpha[i]!;
        sprites.draw(ctx, 'glow', quantize(pool.size[i]! * 0.7, 4), '#fff1b8', x, y + pool.size[i]! * 0.22);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /** Gold cords from the top edge to each lantern's hanger, in one path. */
  private drawCords(ctx: CanvasRenderingContext2D): void {
    const pool = this.pool;
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== LANTERN) continue;
      const theta = -pool.rot[i]!;
      const half = pool.size[i]! * 0.5;
      ctx.moveTo(pool.vx[i]!, 0);
      ctx.lineTo(pool.x[i]! - Math.sin(theta) * half, pool.y[i]! - Math.cos(theta) * half);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export const lanterns: EffectFactory = (sprites) => new LanternsEffect(sprites);
