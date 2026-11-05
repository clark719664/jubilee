/**
 * balloons — birthdays and Children's Day.
 * Ambient: balloons rise in three depths with parallax (far: small, slow, a little faded · near: big and
 *   quick), each swaying on its own and trailing a string that wiggles and lags behind as it sways.
 *   With `candles` (a birthday age), a two-tier cake sits on the ground with that many striped candles,
 *   their flames flickering in a warm glow (up to 30 drawn; two rows past 12).
 * Variant 'koinobori' (Children's Day): instead of balloons, a pole topped by a spinning arrow-wheel flies
 *   a family of carp streamers that ripple in a sine wind (each streamer is drawn in slices, so the cloth
 *   really undulates from mouth to tail), while smaller carp swim free across the sky.
 * Behaviors: rise + sway (balloons), flame (candles), traveling-wave undulation (carp), flutter +
 *   gravity + spin + envelope (confetti).
 * Tap: the nearest balloon pops into confetti in its color (or, with none close, a new balloon floats up
 *   from the finger). Koinobori: a gust ripples the streamers harder and a little carp swims off from the
 *   finger.
 * Still: balloons at rest at every height with strings hanging, the cake's candles lit; the streamers
 *   frozen mid-ripple.
 * Scene mode (`params.stage`, koinobori): the scene draws its own pole and streamers, so only the little carp
 *   swim free across the sky, and a tap still sends one off from the finger.
 * Params: candles (age), palette (balloon colors), variant ('koinobori'), stage, density.
 */
import { mixColor } from '../painters';
import { arrowWheel, cake, frameScenery, quant, softCloud, stripedCandle } from '../painters/extra-whimsy';
import {
  Emitter, TAU, clamp, envelope, expired, flame, flutter, gravity, integrate, range, spawnEdge, spin, steadyRate,
  sway, type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { Palette, PooledEffect, calm } from './shared';

export const CAKE = 0;
export const FLAME = 1;
export const POLE = 2;
export const CARP = 3;
const SCENERY_END = 4;
export const BALLOON = 4;
export const CONFETTI = 5;
export const FREE = 6;
export const CLOUD = 7;

const BALLOON_COLORS = ['#ff4d6d', '#ffd166', '#5b3df5', '#2ec4b6', '#ff8fb8', '#4cc9f0', '#ff8c1a'] as const;
const CANDLE_COLORS = ['#ff8fb8', '#4cc9f0', '#ffd166', '#2ec4b6', '#b197fc'] as const;
const CARP_COLORS = ['#2b2b3a', '#c81d3c', '#1f5fbf', '#2a9d8f', '#ff8c1a'] as const;
/** Most candles drawn on the cake (a 90th birthday still gets a lovely cake, not a bonfire). */
export const MAX_CANDLES = 30;
const SLICES = 28;
const GUST_SECONDS = 2.2;

export class BalloonsEffect extends PooledEffect {
  readonly describe: string = 'Balloons floating up into the sky';
  /** Balloons popped by taps (tests). */
  pops = 0;
  /** Carp released by taps (tests). */
  released = 0;

  private readonly palette = new Palette();
  private readonly rise = new Emitter();
  private variant = '';
  private started = false;
  /** Over an illustrated scene: the koinobori pole and its streamers give way to the art. */
  private onScene = false;
  private candles = 0;
  private gust = 0;
  private popColor = 0;
  private placeArea = false;
  private stringTint = '#ffffff';
  private h = 0;

  constructor(sprites: SpriteCache) {
    super(sprites, 640);
    if (!sprites.has('balloons:cake')) sprites.register('balloons:cake', cake);
    if (!sprites.has('balloons:candle')) sprites.register('balloons:candle', stripedCandle);
    if (!sprites.has('balloons:wheel')) sprites.register('balloons:wheel', arrowWheel);
    if (!sprites.has('balloons:cloud')) sprites.register('balloons:cloud', softCloud);
  }

  get koinobori(): boolean {
    return this.variant === 'koinobori';
  }

  // ---------------------------------------------------------------- particle inits

  private readonly initBalloon: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    pool.kind[i] = BALLOON;
    pool.depth[i] = depth;
    pool.size[i] = quant(30 + 54 * depth * depth, 4);
    pool.aux[i] = 18 + 40 * depth;
    pool.vy[i] = -pool.aux[i]!;
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.12, 0.3);
    pool.color[i] = this.palette.pick(rand);
    pool.alpha[i] = 0.72 + 0.28 * depth;
    pool.life[i] = this.placeArea ? 2 : 0;
  };

  private readonly initConfetti: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const v = range(rand, 60, 260);
    pool.kind[i] = CONFETTI;
    pool.vx[i] = Math.cos(a) * v;
    pool.vy[i] = Math.sin(a) * v - 60;
    pool.size[i] = quant(range(rand, 6, 11), 2);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 1.2, 2.2);
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -6, 6);
    pool.maxLife[i] = range(rand, 1.8, 2.8);
    pool.color[i] = rand() < 0.5 ? this.popColor : this.palette.pick(rand);
  };

  private readonly initFree: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = FREE;
    pool.depth[i] = range(rand, 0.3, 1);
    pool.size[i] = quant(70 + 70 * pool.depth[i]!, 8);
    pool.vx[i] = 30 + 40 * pool.depth[i]!;
    pool.aux[i] = pool.y[i]!;
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.15, 0.3);
    pool.color[i] = 1 + (Math.floor(rand() * 4) % 4);
    pool.alpha[i] = 0.8 + 0.2 * pool.depth[i]!;
  };

  private readonly initCloud: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    pool.kind[i] = CLOUD;
    pool.depth[i] = depth;
    pool.size[i] = quant(120 + 180 * depth, 20);
    pool.vx[i] = 6 + 12 * depth;
    pool.alpha[i] = 0.55 + 0.35 * depth;
  };

  // ---------------------------------------------------------------- setup

  private sync(input: EffectInput): void {
    frameScenery(this.budget, input.budget, SCENERY_END);
    this.palette.sync(input, () => BALLOON_COLORS);
    const v = input.params.variant === 'koinobori' ? 'koinobori' : '';
    const candles = this.koinobori ? 0 : clamp(Math.round(input.params.candles ?? 0), 0, MAX_CANDLES);
    const onScene = input.params.stage !== undefined;
    if (v !== this.variant || candles !== this.candles || onScene !== this.onScene) {
      this.variant = v;
      this.candles = candles;
      this.onScene = onScene;
      this.started = false;
    }
    this.stringTint = input.theme.mood === 'night' ? '#ffffff' : mixColor(input.theme.ink, '#ffffff', 0.35);
  }

  private cakeWidth(w: number): number {
    return quant(clamp(Math.min(w * (w < 600 ? 0.48 : 0.3), this.h * 0.5), 150, 380), 16);
  }

  /** The cake and its candle flames (top tier: one row up to 12, then a staggered second row). */
  private buildCake(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    this.h = h;
    const cw = this.cakeWidth(w);
    const cx = w < 600 ? w * 0.68 : w * 0.8;
    // Set well above the bottom edge so the candles clear the hero's text scrim (it darkens the lower third).
    const cy = h * (w < 600 ? 0.8 : 0.86) - cw * 0.33;
    spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, (p, i) => {
      p.kind[i] = CAKE;
      p.size[i] = cw;
    }, cx, cy);
    const n = this.candles;
    const back = n > 12 ? Math.floor(n / 2) : 0;
    const front = n - back;
    const top = cy - cw * 0.16;
    const span = cw * 0.5;
    const candleH = quant(cw * 0.13, 2);
    for (let k = 0; k < n; k++) {
      const inBack = k < back;
      const count = inBack ? back : front;
      const j = inBack ? k : k - back;
      const x = cx - span / 2 + ((j + 0.5) / count) * span + (inBack ? span / count / 2 - span / count / 4 : 0);
      const baseY = top + (inBack ? -cw * 0.015 : cw * 0.03);
      const m = spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, (p, i, r) => {
        p.kind[i] = FLAME;
        p.size[i] = candleH;
        p.depth[i] = inBack ? 0.5 : 1;
        p.color[i] = k % CANDLE_COLORS.length;
        p.phase[i] = r() * TAU;
        p.aux[i] = baseY;
      }, x, baseY - candleH * 1.05);
      if (m === 0) break;
    }
  }

  private carpCount(w: number): number {
    return w < 600 ? 3 : 4;
  }

  /** The pole on the left and its streamers, biggest at the top. */
  private buildPole(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    const px = w < 600 ? w * 0.12 : w * 0.16;
    spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, (p, i) => {
      p.kind[i] = POLE;
      p.size[i] = Math.max(40, h * 0.08);
    }, px, h * 0.09);
    const n = this.carpCount(w);
    const len = clamp(w * 0.24, 130, 320);
    for (let k = 0; k < n; k++) {
      spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, (p, i, r) => {
        p.kind[i] = CARP;
        p.size[i] = quant(len * (1 - k * 0.13), 8);
        p.color[i] = k % CARP_COLORS.length;
        p.phase[i] = r() * TAU;
        p.aux[i] = k;
      }, px, h * 0.09 + len * 0.22 + k * len * 0.36);
    }
    spawnEdge(pool, 'area', w, h * 0.75, this.budget.take(w < 600 ? 3 : 5), rand, this.initCloud);
    spawnEdge(pool, 'area', w, h * 0.7, this.budget.take(w < 600 ? 2 : 3), rand, this.initFree);
  }

  private start(input: EffectInput, still: boolean): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    this.started = true;
    pool.clear();
    if (this.koinobori) {
      if (this.onScene) spawnEdge(pool, 'area', w, h * 0.6, this.budget.take(w < 600 ? 3 : 4), rand, this.initFree);
      else this.buildPole(input);
      return;
    }
    if (this.candles > 0) this.buildCake(input);
    this.placeArea = true;
    spawnEdge(pool, 'area', w, h, this.budget.take(this.balloonTarget(input.budget) * (still ? 0.85 : 0.75)), rand, this.initBalloon);
    this.placeArea = false;
  }

  private balloonTarget(budget: number): number {
    return Math.max(4, Math.min(48, budget * 0.3));
  }

  // ---------------------------------------------------------------- loop

  step(input: EffectInput): void {
    const { w, h, dt, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) this.start(input, false);
    this.gust = Math.max(0, this.gust - dt);
    if (!this.koinobori) {
      const rate = steadyRate(this.balloonTarget(input.budget), h / 34, 0.9) * calm(input.intensity);
      this.rise.spawn(pool, 'bottom', w, h, rate, dt, rand, this.initBalloon, this.budget.room());
    }
    const wind = 1 + this.gust / GUST_SECONDS;
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === BALLOON) {
        sway(pool, i, dt, 8 + 14 * pool.depth[i]!, pool.rotV[i]!);
        integrate(pool, i, dt);
        if (pool.y[i]! < -pool.size[i]! * 2.6) pool.kill(i);
      } else if (kind === FLAME) {
        flame(pool, i, dt, 0.6, rand);
      } else if (kind === CARP) {
        pool.phase[i]! += dt * (2.4 + 0.3 * pool.aux[i]!) * wind;
      } else if (kind === POLE) {
        pool.rot[i]! += dt * (1.6 + 2.5 * (wind - 1));
      } else if (kind === FREE) {
        pool.phase[i]! += dt * 3.2;
        pool.x[i]! += pool.vx[i]! * wind * dt;
        pool.life[i]! += dt;
        pool.y[i] = pool.aux[i]! + Math.sin(pool.life[i]! * TAU * pool.rotV[i]!) * 16;
        if (pool.x[i]! > w + pool.size[i]!) {
          pool.x[i] = -pool.size[i]!;
          pool.aux[i] = h * range(rand, 0.1, 0.62);
        }
      } else if (kind === CLOUD) {
        pool.x[i]! += pool.vx[i]! * (0.6 + 0.4 * wind) * dt;
        if (pool.x[i]! > w + pool.size[i]! * 0.6) pool.x[i] = -pool.size[i]! * 0.6;
      } else if (kind === CONFETTI) {
        gravity(pool, i, dt, 220, 90);
        pool.vx[i]! *= Math.max(0, 1 - 1.4 * dt);
        flutter(pool, i, dt, pool.size[i]! * 0.8, pool.aux[i]!);
        spin(pool, i, dt);
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0, 0.6);
        if (expired(pool, i) || pool.y[i]! > h + 20) pool.kill(i);
      }
    }
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    if (!this.started) this.start(input, false);
    const pool = this.pool;
    const { w, h, rand } = input;
    if (this.koinobori) {
      this.gust = GUST_SECONDS;
      if (spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initFree, x, y) > 0) this.released++;
      return;
    }
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== BALLOON) continue;
      const r = pool.size[i]! * 0.6 + 50;
      const dx = pool.x[i]! - x;
      const dy = pool.y[i]! - pool.size[i]! * 0.05 - y;
      const d = dx * dx + dy * dy;
      if (d < r * r && d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best < 0) {
      spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initBalloon, x, y);
      return;
    }
    const bx = pool.x[best]!;
    const by = pool.y[best]!;
    this.popColor = pool.color[best]!;
    pool.kill(best);
    this.pops++;
    spawnEdge(pool, 'point', w, h, this.budget.take(24), rand, this.initConfetti, bx, by);
  }

  still(input: EffectInput): void {
    const pool = this.pool;
    this.sync(input);
    this.start(input, true);
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] === FLAME) pool.alpha[i] = 1;
      else if (pool.kind[i] === BALLOON) pool.phase[i] = 0;
    }
  }

  // ---------------------------------------------------------------- drawing

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    if (this.koinobori) {
      this.drawKoinobori(ctx, input);
      return;
    }
    this.drawBalloons(ctx, input, 0, 0.45);
    this.drawCake(ctx);
    this.drawBalloons(ctx, input, 0.45, 2);
    this.drawConfetti(ctx);
    ctx.globalAlpha = 1;
  }

  private drawBalloons(ctx: CanvasRenderingContext2D, input: EffectInput, lo: number, hi: number): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const n = pool.count;
    const t = input.t;
    // Strings first, one path per depth band: knot → a lazy S that lags behind the sway.
    ctx.strokeStyle = this.stringTint;
    ctx.lineWidth = lo > 0 ? 1.4 : 1;
    ctx.globalAlpha = lo > 0 ? 0.7 : 0.45;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== BALLOON) continue;
      const depth = pool.depth[i]!;
      if (depth < lo || depth >= hi) continue;
      const s = pool.size[i]!;
      const x = pool.x[i]!;
      const y0 = pool.y[i]! + s * 0.47;
      const len = s * 1.7;
      const lag = -Math.cos(pool.phase[i]!) * s * 0.25;
      const wig = Math.sin(t * 3.1 + pool.phase[i]! * 2) * s * 0.12;
      ctx.moveTo(x, y0);
      ctx.bezierCurveTo(x + wig, y0 + len * 0.33, x + lag - wig, y0 + len * 0.66, x + lag * 1.4, y0 + len);
    }
    ctx.stroke();
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== BALLOON) continue;
      const depth = pool.depth[i]!;
      if (depth < lo || depth >= hi) continue;
      ctx.globalAlpha = pool.alpha[i]! * Math.min(1, pool.life[i]! * 1.5);
      const tilt = Math.cos(pool.phase[i]!) * 0.08;
      sprites.draw(ctx, 'balloon', pool.size[i]!, this.palette.color(pool.color[i]!), pool.x[i]!, pool.y[i]!, tilt);
    }
  }

  private drawCake(ctx: CanvasRenderingContext2D): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const n = pool.count;
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== CAKE) continue;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35;
      sprites.draw(ctx, 'glow', quant(pool.size[i]! * 1.6, 32), '#ffd166', pool.x[i]!, pool.y[i]! - pool.size[i]! * 0.3);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const paint = Math.min(320, pool.size[i]!);
      sprites.draw(ctx, 'balloons:cake', paint, '#ffffff', pool.x[i]!, pool.y[i]!, 0, pool.size[i]! / paint, pool.size[i]! / paint);
    }
    // Back row of candles, then front row; each candle under its flame.
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        if (pool.kind[i] !== FLAME || (pool.depth[i]! < 1) !== (pass === 0)) continue;
        const s = pool.size[i]!;
        ctx.globalAlpha = 1;
        sprites.draw(ctx, 'balloons:candle', s, CANDLE_COLORS[pool.color[i]! % CANDLE_COLORS.length]!, pool.x[i]!, pool.aux[i]! - s * 0.5);
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== FLAME) continue;
      ctx.globalAlpha = 0.5 * pool.alpha[i]!;
      sprites.draw(ctx, 'glow', quant(pool.size[i]! * 2.2, 4), '#ffb347', pool.x[i]!, pool.y[i]!);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== FLAME) continue;
      ctx.globalAlpha = 0.85 + 0.15 * pool.alpha[i]!;
      const lean = Math.sin(pool.phase[i]!) * 0.12;
      sprites.draw(ctx, 'flame', quant(pool.size[i]! * 0.6, 2), '#ffb703', pool.x[i]!, pool.y[i]!, lean, 1, 0.9 + 0.1 * pool.alpha[i]!);
    }
  }

  private drawConfetti(ctx: CanvasRenderingContext2D): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== CONFETTI) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      const flip = 0.2 + 0.8 * Math.abs(Math.cos(pool.phase[i]!));
      this.sprites.draw(ctx, 'confettiRect', pool.size[i]!, this.palette.color(pool.color[i]!), pool.x[i]!, pool.y[i]!, pool.rot[i]!, flip, 1);
    }
  }

  // ---------------------------------------------------------------- koinobori

  private drawKoinobori(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const { h } = input;
    const n = pool.count;
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== CLOUD) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'balloons:cloud', pool.size[i]!, '#ffffff', pool.x[i]!, pool.y[i]!);
    }
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== FREE) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      this.drawCarp(ctx, pool.size[i]!, CARP_COLORS[pool.color[i]! % CARP_COLORS.length]!, pool.x[i]!, pool.y[i]!, pool.phase[i]!, 0.06);
    }
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== POLE) continue;
      const x = pool.x[i]!;
      const top = pool.y[i]!;
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#7a4a22';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, h + 10);
      ctx.stroke();
      ctx.strokeStyle = mixColor('#7a4a22', '#ffffff', 0.35);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 1.5, top);
      ctx.lineTo(x - 1.5, h + 10);
      ctx.stroke();
      sprites.draw(ctx, 'balloons:wheel', quant(pool.size[i]!, 8), '#c81d3c', x, top - pool.size[i]! * 0.15, pool.rot[i]!);
      sprites.draw(ctx, 'circle', 16, '#ffd166', x, top - pool.size[i]! * 0.72);
    }
    const strength = 1 + 0.6 * (this.gust / GUST_SECONDS);
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== CARP) continue;
      const s = pool.size[i]!;
      ctx.globalAlpha = 1;
      // The mouth ring is tied at the pole; the body streams out to the right.
      this.drawCarp(ctx, s, CARP_COLORS[pool.color[i]! % CARP_COLORS.length]!, pool.x[i]! + s * 0.48, pool.y[i]!, pool.phase[i]!, 0.09 * strength);
    }
    ctx.globalAlpha = 1;
  }

  /**
   * A carp streamer as SLICES vertical strips of its cached sprite, each shifted by a traveling sine
   * wave whose amplitude grows from the mouth (fixed) to the tail: the cloth ripples in the wind.
   */
  private drawCarp(ctx: CanvasRenderingContext2D, size: number, color: string, x: number, y: number, phase: number, amp: number): void {
    const img = this.sprites.get('koinobori', size, color) as CanvasImageSource & { width: number; height: number };
    const side = Math.ceil(Math.round(size) * 1.5) + 2;
    const iw = img.width;
    const ih = img.height;
    if (!(iw > 1) || !(ih > 1)) return;
    const left = x - side / 2;
    const top = y - side / 2;
    const sw = iw / SLICES;
    const dw = side / SLICES;
    for (let k = 0; k < SLICES; k++) {
      const u = k / (SLICES - 1);
      const dy = Math.sin(phase - u * 4.2) * amp * size * u;
      ctx.drawImage(img, k * sw, 0, sw + 0.5, ih, left + k * dw, top + dy, dw + 0.6, side);
    }
  }
}

export const balloons: EffectFactory = (sprites) => new BalloonsEffect(sprites);
