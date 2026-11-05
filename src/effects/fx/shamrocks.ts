/**
 * shamrocks — a lucky sky: shamrocks on the breeze and a rainbow that ends in a pot of gold.
 * Ambient: a soft rainbow arc draws itself across the sky on arrival (1.8 s), rising out of a little cloud
 *   on the left and ending at a pot of gold on the right; gold coins hop out of the pot, spin (|cos φ|
 *   flip), bounce on the grass and fade. Shamrocks — now and then a lucky four-leaf clover with a glint —
 *   flutter down in continuous depth. Gold motes twinkle near the rainbow in a 'lighter' pass.
 * Behaviors: gravity + flutter + spin + slow wind (shamrocks); gravity + bounce + spin (coins); twinkle.
 * Tap: tap a coin to collect it — it flies up to a little counter (a coin, "×" and digits drawn as glyph
 *   sprites) that bumps and sparkles; the count is cosmetic and lasts as long as the effect. Tapping
 *   anywhere else throws a lucky ring of shamrocks and gold sparkles.
 * Still: the full rainbow, the pot with coins resting on the grass around it, shamrocks frozen mid-air.
 * Params: palette (shamrock greens; default four light greens that read on a dark green sky), density.
 */
import type { Theme } from '../../theme/themes';
import { mixColor } from '../painters';
import { clover4, labelPainter, potOfGold } from '../painters/extra-day';
import {
  Emitter, TAU, clamp, drag, envelope, expired, flutter, gravity, integrate, range, spawnEdge, steadyRate, twinkle,
  type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { Palette, PooledEffect, calm } from './shared';

export const SHAMROCK = 0;
export const CLOVER = 1;
export const COIN = 2;
export const FLY = 3;
export const SPARK = 4;
export const RING = 5;

const GOLD = '#ffd166';
const RAINBOW = ['#ff5a5f', '#ff9f1c', '#ffd166', '#5ad27a', '#4cc9f0', '#4361ee', '#9b5de5'] as const;
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => `shamrocks:digit${d}`);
const TIMES = 'shamrocks:times';
const DIGIT_INK = '#7a4a00';
const COIN_CAP = 9;
const REVEAL = 1.8;
const FLY_TIME = 0.75;

function greens(theme: Theme): readonly string[] {
  return theme.mood === 'night'
    ? ['#8ee89a', '#5ad27a', '#c6f6cd', mixColor('#5ad27a', '#ffffff', 0.25)]
    : ['#2fa35a', '#1f8a4c', '#5ad27a', '#7ddc8a'];
}

export class ShamrocksEffect extends PooledEffect {
  readonly describe = 'Shamrocks drifting under a rainbow';
  /** Coins collected by tapping (cosmetic counter). */
  collected = 0;

  private readonly palette = new Palette();
  private readonly fall = new Emitter();
  private readonly coins = new Emitter();
  private readonly motes = new Emitter();
  private started = false;
  private t0 = 0;
  private reveal = 0;
  private bump = 0;
  // Layout (CSS px), recomputed in sync.
  private cx = 0;
  private cy = 0;
  private R = 100;
  private band = 6;
  private potX = 0;
  private potY = 0;
  private potW = 90;
  private ground = 0;
  private portrait = false;
  private ringAngle = 0;
  private emitX = 0;
  private emitY = 0;

  constructor(sprites: SpriteCache) {
    super(sprites);
    if (!sprites.has('shamrocks:clover4')) sprites.register('shamrocks:clover4', clover4);
    if (!sprites.has('shamrocks:pot')) sprites.register('shamrocks:pot', potOfGold);
    for (let d = 0; d < 10; d++) if (!sprites.has(DIGITS[d]!)) sprites.register(DIGITS[d]!, labelPainter(String(d)));
    if (!sprites.has(TIMES)) sprites.register(TIMES, labelPainter('×'));
  }

  private readonly initLeaf: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    pool.kind[i] = rand() < 0.045 ? CLOVER : SHAMROCK;
    pool.depth[i] = depth;
    pool.size[i] = 12 + 24 * depth + 4 * rand();
    pool.vy[i] = 18 + 34 * depth;
    pool.aux[i] = 18 + 34 * depth;
    pool.phase[i] = rand() * TAU;
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -1.2, 1.2);
    pool.alpha[i] = 0.5 + 0.5 * depth;
    pool.color[i] = this.palette.pick(rand);
  };

  private readonly initCoin: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = COIN;
    pool.x[i] = this.potX + range(rand, -0.22, 0.22) * this.potW;
    pool.y[i] = this.potY - this.potW * 0.2;
    pool.vx[i] = range(rand, -150, 70) * (this.portrait ? 0.35 : 1);
    pool.vy[i] = -range(rand, 260, 420);
    pool.size[i] = Math.round(clamp(this.potW * 0.3, 20, 34));
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 6, 10);
    pool.aux[i] = 0;
    pool.maxLife[i] = range(rand, 3.5, 5);
    pool.depth[i] = 1;
  };

  private readonly initMote: ParticleInit = (pool, i, rand) => {
    const a = Math.PI + rand() * Math.PI;
    const r = this.R * range(rand, 0.75, 1.08);
    pool.kind[i] = SPARK;
    pool.x[i] = this.cx + Math.cos(a) * r;
    pool.y[i] = this.cy + Math.sin(a) * r;
    pool.vy[i] = range(rand, -8, -2);
    pool.size[i] = range(rand, 6, 12);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.4, 1.1);
    pool.maxLife[i] = range(rand, 3, 5);
  };

  private readonly initSpark: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const speed = range(rand, 50, 170);
    pool.kind[i] = SPARK;
    pool.x[i] = this.emitX;
    pool.y[i] = this.emitY;
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed;
    pool.size[i] = range(rand, 8, 16);
    pool.aux[i] = 0;
    pool.maxLife[i] = range(rand, 0.7, 1.1);
  };

  private readonly initRing: ParticleInit = (pool, i, rand) => {
    const a = this.ringAngle;
    const speed = range(rand, 170, 220);
    pool.kind[i] = RING;
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed;
    pool.rot[i] = a + Math.PI / 2;
    pool.rotV[i] = range(rand, -2, 2);
    pool.size[i] = range(rand, 18, 24);
    pool.maxLife[i] = range(rand, 1.1, 1.4);
    pool.alpha[i] = 0;
    pool.color[i] = this.palette.pick(rand);
  };

  private sync(input: EffectInput): void {
    const { w, h } = input;
    this.budget.frame(input.budget);
    this.palette.sync(input, greens);
    // Portrait heroes (phones) hang the rainbow in the upper sky with the pot on a cloud, clear of the
    // text scrim along the bottom; landscape plants its feet on the ground.
    this.portrait = h > w * 1.1;
    this.R = Math.max(40, this.portrait ? w * 0.42 : Math.min(w * 0.37, h * 0.78));
    this.cx = w * 0.5;
    this.cy = this.portrait ? h * 0.46 : h * 0.93;
    this.band = Math.max(3, this.R * 0.034);
    this.potW = Math.round(clamp(Math.min(h * 0.17, w * 0.24), 60, 130));
    this.potX = this.cx + this.R - this.band * 3;
    this.potY = this.portrait ? this.cy - this.potW * 0.22 : h - this.potW * 0.4 - 2;
    this.ground = this.portrait ? this.cy + this.potW * 0.2 : h - 6;
  }

  step(input: EffectInput): void {
    const { w, h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      this.t0 = t;
      spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.45), rand, this.initLeaf);
    }
    this.reveal = clamp((t - this.t0) / REVEAL, 0, 1);
    this.bump = Math.max(0, this.bump - dt * 2.5);
    const k = calm(input.intensity);
    this.fall.spawn(pool, 'top', w, h, steadyRate(input.budget * 0.62, h / 38, 0.85) * k, dt, rand, this.initLeaf, this.budget.take(99, 14));
    let coins = 0;
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === COIN) coins++;
    if (this.reveal >= 1 && coins < COIN_CAP) {
      this.coins.spawn(pool, 'point', w, h, 1.1 * k, dt, rand, this.initCoin, this.budget.take(1, 2));
    }
    if (this.reveal >= 0.5) this.motes.spawn(pool, 'point', w, h, 2.5 * k, dt, rand, this.initMote, this.budget.take(1, 2));
    const breeze = 10 * Math.sin(t * 0.3) + 6;
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === SHAMROCK || kind === CLOVER) {
        const depth = pool.depth[i]!;
        gravity(pool, i, dt, 60, pool.aux[i]!);
        pool.vx[i]! *= Math.max(0, 1 - dt);
        flutter(pool, i, dt, pool.size[i]! * 0.6, 0.35 + 0.3 * depth);
        pool.x[i]! += breeze * (0.4 + 0.8 * depth) * dt;
        pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        const x = pool.x[i]!;
        if (x > w + 30) pool.x[i] = x - w - 60;
        else if (x < -30) pool.x[i] = x + w + 60;
        if (pool.y[i]! > h + pool.size[i]!) pool.kill(i);
      } else if (kind === COIN) {
        pool.phase[i]! += pool.rotV[i]! * dt;
        if (pool.aux[i]! < 0) continue;
        gravity(pool, i, dt, 640);
        integrate(pool, i, dt);
        const floor = this.ground - pool.size[i]! * 0.5;
        // On a phone the pot stands on a cloud: coins that hop past its edge fall away.
        const onCloud = !this.portrait || Math.abs(pool.x[i]! - this.potX) < this.potW * 0.75;
        if (onCloud && pool.y[i]! > floor && pool.y[i]! < floor + 30 && pool.vy[i]! > 0) {
          pool.y[i] = floor;
          pool.vy[i] = -pool.vy[i]! * 0.5;
          pool.vx[i]! *= 0.7;
          pool.aux[i]! += 1;
          if (pool.aux[i]! >= 3) pool.vy[i] = 0;
        }
        pool.alpha[i] = envelope(pool, i, 0.08, 0.8);
        if (expired(pool, i) || pool.x[i]! < -30 || pool.x[i]! > w + 30 || pool.y[i]! > h + 30) pool.kill(i);
      } else if (kind === FLY) {
        pool.life[i]! += dt;
        pool.phase[i]! += 14 * dt;
        if (pool.life[i]! >= FLY_TIME) {
          this.collected++;
          this.bump = 1;
          this.emitX = this.counterX(w);
          this.emitY = this.counterY();
          pool.kill(i);
          spawnEdge(pool, 'point', w, h, this.budget.take(8), rand, this.initSpark, this.emitX, this.emitY);
        }
      } else if (kind === RING) {
        drag(pool, i, dt, 2.2);
        pool.vy[i]! += 40 * dt;
        pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.05, 0.6);
        if (expired(pool, i)) pool.kill(i);
      } else {
        drag(pool, i, dt, 2);
        integrate(pool, i, dt);
        const env = envelope(pool, i, 0.3, 0.6);
        if (pool.aux[i]! > 0) twinkle(pool, i, pool.aux[i]!, 0.6, env);
        else pool.alpha[i] = env;
        if (expired(pool, i)) pool.kill(i);
      }
    }
  }

  private counterX(w: number): number {
    return w - 92;
  }

  private counterY(): number {
    return 46;
  }

  tap(x: number, y: number, input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    this.sync(input);
    let hit = -1;
    let best = Infinity;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== COIN) continue;
      const d = Math.hypot(pool.x[i]! - x, pool.y[i]! - y);
      const reach = Math.max(40, pool.size[i]! * 1.6);
      if (d < reach && d < best) {
        best = d;
        hit = i;
      }
    }
    if (hit >= 0) {
      // FLY keeps its start point in vx/vy and uses life as the 0..FLY_TIME clock.
      pool.kind[hit] = FLY;
      pool.vx[hit] = pool.x[hit]!;
      pool.vy[hit] = pool.y[hit]!;
      pool.life[hit] = 0;
      pool.maxLife[hit] = 0;
      pool.alpha[hit] = 1;
      this.emitX = pool.x[hit]!;
      this.emitY = pool.y[hit]!;
      spawnEdge(pool, 'point', w, h, this.budget.take(6), rand, this.initSpark, this.emitX, this.emitY);
      return;
    }
    const n = this.budget.take(9);
    for (let k = 0; k < n; k++) {
      this.ringAngle = (k / n) * TAU;
      spawnEdge(pool, 'point', w, h, 1, rand, this.initRing, x, y);
    }
    this.emitX = x;
    this.emitY = y;
    spawnEdge(pool, 'point', w, h, this.budget.take(10), rand, this.initSpark, x, y);
  }

  still(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.started = true;
    this.t0 = -REVEAL;
    this.reveal = 1;
    const resting = this.budget.take(6);
    for (let k = 0; k < resting; k++) {
      spawnEdge(pool, 'point', w, h, 1, rand, this.initCoin, 0, 0);
      const i = pool.count - 1;
      const side = k % 2 === 0 ? -1 : 1;
      pool.x[i] = this.potX + side * this.potW * ((this.portrait ? 0.5 : 0.55) + (this.portrait ? 0.1 : 0.22) * Math.floor(k / 2)) + range(rand, -4, 4);
      pool.y[i] = this.ground - pool.size[i]! * 0.5;
      pool.vx[i] = 0;
      pool.vy[i] = 0;
      pool.aux[i] = -1;
      pool.maxLife[i] = 0;
      pool.alpha[i] = 1;
    }
    spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.45), rand, this.initLeaf);
    const motes = this.budget.take(10);
    for (let k = 0; k < motes; k++) {
      spawnEdge(pool, 'point', w, h, 1, rand, this.initMote, 0, 0);
      const i = pool.count - 1;
      pool.life[i] = 1;
      pool.alpha[i] = 0.7;
    }
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const night = input.theme.mood === 'night';
    this.drawRainbow(ctx, night);
    this.drawLeaves(ctx, 0, 0.5);
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== COIN) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      const flip = 0.15 + 0.85 * Math.abs(Math.cos(pool.phase[i]!));
      sprites.draw(ctx, 'coin', pool.size[i]!, GOLD, pool.x[i]!, pool.y[i]!, 0, flip, 1);
    }
    ctx.globalAlpha = Math.min(1, this.reveal * 2);
    if (this.portrait) sprites.draw(ctx, 'cloud', Math.round(this.potW * 1.6), '#ffffff', this.potX, this.ground + this.potW * 0.02);
    sprites.draw(ctx, 'shamrocks:pot', this.potW, GOLD, this.potX, this.potY);
    this.drawLeaves(ctx, 0.5, 1.01);
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind === RING) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'shamrock', pool.size[i]!, this.palette.color(pool.color[i]!), pool.x[i]!, pool.y[i]!, pool.rot[i]!);
      } else if (kind === FLY) {
        const u = clamp(pool.life[i]! / FLY_TIME, 0, 1);
        const e = u * u * (3 - 2 * u);
        const tx = this.counterX(input.w);
        const ty = this.counterY();
        const x = pool.vx[i]! + (tx - pool.vx[i]!) * e;
        const y = pool.vy[i]! + (ty - pool.vy[i]!) * e - Math.sin(Math.PI * u) * 80;
        const s = pool.size[i]! * (1 + 0.4 * Math.sin(Math.PI * u));
        ctx.globalAlpha = 1;
        sprites.draw(ctx, 'coin', s, GOLD, x, y, 0, 0.2 + 0.8 * Math.abs(Math.cos(pool.phase[i]!)), 1);
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind === SPARK) {
        ctx.globalAlpha = pool.alpha[i]! * (night ? 0.8 : 0.6);
        sprites.draw(ctx, 'glow', pool.size[i]!, GOLD, pool.x[i]!, pool.y[i]!);
      } else if (kind === COIN) {
        const glint = Math.max(0, Math.cos(pool.phase[i]!));
        ctx.globalAlpha = pool.alpha[i]! * 0.35 * glint * glint;
        sprites.draw(ctx, 'glow', pool.size[i]! * 2.4, GOLD, pool.x[i]!, pool.y[i]!);
      } else if (kind === CLOVER) {
        ctx.globalAlpha = pool.alpha[i]! * (0.25 + 0.2 * Math.sin(pool.phase[i]! * 0.5));
        sprites.draw(ctx, 'glow', pool.size[i]! * 2.2, GOLD, pool.x[i]!, pool.y[i]!);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    if (this.collected > 0) this.drawCounter(ctx, input);
    ctx.globalAlpha = 1;
  }

  private drawLeaves(ctx: CanvasRenderingContext2D, d0: number, d1: number): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind !== SHAMROCK && kind !== CLOVER) continue;
      const depth = pool.depth[i]!;
      if (depth < d0 || depth >= d1) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      const flip = 0.25 + 0.75 * Math.abs(Math.cos(pool.phase[i]!));
      if (kind === CLOVER) this.sprites.draw(ctx, 'shamrocks:clover4', pool.size[i]! * 1.1, '#a8f06a', pool.x[i]!, pool.y[i]!, pool.rot[i]!, flip, 1);
      else this.sprites.draw(ctx, 'shamrock', pool.size[i]!, this.palette.color(pool.color[i]!), pool.x[i]!, pool.y[i]!, pool.rot[i]!, flip, 1);
    }
  }

  /** Seven bands drawn as arcs (a handful of strokes per frame), revealed left to right on arrival. */
  private drawRainbow(ctx: CanvasRenderingContext2D, night: boolean): void {
    const e = this.reveal * this.reveal * (3 - 2 * this.reveal);
    if (e <= 0) return;
    const end = Math.PI + Math.PI * e;
    const band = this.band;
    ctx.lineWidth = band * 1.08;
    ctx.lineCap = 'butt';
    ctx.globalAlpha = night ? 0.62 : 0.5;
    for (let k = 0; k < RAINBOW.length; k++) {
      ctx.strokeStyle = RAINBOW[k]!;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, this.R - k * band, Math.PI, end);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = night ? 0.1 : 0.06;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = band * 10;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.R - 3 * band, Math.PI, end);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    const cloud = this.R * 0.55;
    ctx.globalAlpha = 0.92;
    this.sprites.draw(ctx, 'cloud', Math.round(cloud), '#ffffff', this.cx - this.R + band * 3, this.cy - cloud * 0.02);
    this.sprites.draw(ctx, 'cloud', Math.round(cloud * 0.7), '#f1f7f4', this.cx - this.R - cloud * 0.25, this.cy + cloud * 0.08);
  }

  private drawCounter(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const sprites = this.sprites;
    const x = this.counterX(input.w);
    const y = this.counterY();
    const s = 1 + 0.25 * this.bump;
    ctx.globalAlpha = 1;
    sprites.draw(ctx, 'coin', 30, GOLD, x, y, 0, s, s);
    sprites.draw(ctx, TIMES, 20, DIGIT_INK, x + 26, y + 2);
    // Digits most-significant first, without building a string.
    const n = this.collected;
    let div = 1;
    while (n >= div * 10) div *= 10;
    let dx = x + 46;
    while (div >= 1) {
      const d = Math.floor(n / div) % 10;
      sprites.draw(ctx, DIGITS[d]!, 28, DIGIT_INK, dx, y + 1, 0, s, s);
      dx += 18;
      div = Math.floor(div / 10);
      if (div === 0) break;
    }
  }
}

export const shamrocks: EffectFactory = (sprites) => new ShamrocksEffect(sprites);
