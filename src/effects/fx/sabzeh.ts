/**
 * sabzeh — Nowruz: spring sprouts, goldfish and blossom.
 * Ambient: a lawn of sabzeh grows up from the bottom edge (two rows of clumps, a few blades each) to a
 *   height set by `growth`, tied at the front with a red ribbon bow, and ripples in a slow traveling
 *   breeze; goldfish swim across the sky on gentle sine paths (tilting with their path, trailing the odd
 *   bubble); pink and white blossom petals flutter down; a soft spring sun warms the top-left corner.
 * Behaviors: grow-in (clumps ease to their height over ~2.5 s), sine swim (fish), flutter + gravity +
 *   spin (petals), rise + sway + envelope (bubbles), envelope (ripples).
 * Tap: the nearest goldfish darts to the finger, wiggles there and swims on; a ripple ring and a few
 *   bubbles mark the spot.
 * Still: the sabzeh fully grown to `growth`, fish mid-swim, petals caught mid-air.
 * Params: growth (0..1 closeness to Nowruz; default 1), palette (fish colors), density.
 */
import { mixColor } from '../painters';
import { frameScenery, quant, ribbonBow, rippleRing } from '../painters/extra-whimsy';
import {
  Emitter, TAU, clamp, envelope, expired, flutter, integrate, range, spawnEdge, spin, steadyRate, sway,
  type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { Palette, PooledEffect, calm } from './shared';

export const CLUMP = 0;
const SCENERY_END = 1;
export const FISH = 1;
export const DART = 2;
export const BUBBLE = 3;
export const PETAL = 4;
export const RING = 5;

const FISH_COLORS = ['#ff7a1a', '#ff9f1c', '#e8452a', '#ffb703'] as const;
const PETAL_COLORS = ['#ffb3c6', '#ffd6e0', '#ffffff', '#ff8fb8'] as const;
const GRASS_BACK = '#1f7a3e';
const GRASS_FRONT = '#3fae4f';
const GRASS_TIP = '#9be27f';
const BLADES = 6;
const GROW_SECONDS = 2.5;
const DART_SECONDS = 0.7;

/** Full sabzeh height in px for this sky and closeness (0 → a few millimeters of sprouts). */
export function grassHeight(h: number, growth: number | undefined): number {
  return h * (0.06 + 0.4 * clamp(growth ?? 1, 0, 1));
}

function easeOut(k: number): number {
  const u = clamp(k, 0, 1);
  return 1 - (1 - u) * (1 - u) * (1 - u);
}

export class SabzehEffect extends PooledEffect {
  readonly describe = 'Green sabzeh sprouts growing while goldfish swim through the spring sky';
  /** Taps that sent a fish darting (tests). */
  darts = 0;

  private readonly palette = new Palette();
  private readonly petals = new Emitter();
  private started = false;
  private grassH = 0;
  private ground = 0;
  private spotX = 0;
  private spotY = 0;
  private sunTint = '#ffd166';

  constructor(sprites: SpriteCache) {
    super(sprites, 640);
    if (!sprites.has('sabzeh:bow')) sprites.register('sabzeh:bow', ribbonBow);
    if (!sprites.has('sabzeh:ripple')) sprites.register('sabzeh:ripple', rippleRing);
  }

  // ---------------------------------------------------------------- particle inits

  private readonly initClump: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = CLUMP;
    pool.size[i] = range(rand, 0.75, 1.2);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, -1, 1);
  };

  private readonly initFish: ParticleInit = (pool, i, rand) => {
    const depth = range(rand, 0.3, 1);
    const dir = rand() < 0.5 ? -1 : 1;
    pool.kind[i] = FISH;
    pool.depth[i] = depth;
    pool.size[i] = quant(34 + 42 * depth, 4);
    pool.vx[i] = dir * (24 + 36 * depth);
    pool.aux[i] = this.ground * range(rand, 0.18, 0.62);
    pool.y[i] = pool.aux[i]!;
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.25, 0.5);
    pool.color[i] = this.palette.pick(rand);
    pool.alpha[i] = 0.75 + 0.25 * depth;
  };

  private readonly initPetal: ParticleInit = (pool, i, rand) => {
    const depth = range(rand, 0.3, 1);
    pool.kind[i] = PETAL;
    pool.depth[i] = depth;
    pool.size[i] = quant(rand() < 0.18 ? 18 + 10 * depth : 8 + 8 * depth, 2);
    pool.vy[i] = 22 + 26 * depth;
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.4, 0.9);
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -1.5, 1.5);
    pool.color[i] = Math.floor(rand() * PETAL_COLORS.length) % PETAL_COLORS.length;
    pool.alpha[i] = 0.7 + 0.3 * depth;
  };

  private readonly initBubble: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = BUBBLE;
    pool.x[i] = this.spotX + range(rand, -10, 10);
    pool.y[i] = this.spotY + range(rand, -6, 6);
    pool.size[i] = quant(range(rand, 5, 11), 2);
    pool.vy[i] = -range(rand, 18, 40);
    pool.phase[i] = rand() * TAU;
    pool.maxLife[i] = range(rand, 1.2, 2.2);
    pool.alpha[i] = 0;
  };

  private readonly initRing: ParticleInit = (pool, i) => {
    pool.kind[i] = RING;
    pool.size[i] = 64;
    pool.maxLife[i] = 1.1;
    pool.alpha[i] = 0;
  };

  // ---------------------------------------------------------------- setup

  private sync(input: EffectInput): void {
    frameScenery(this.budget, input.budget, SCENERY_END);
    this.palette.sync(input, () => FISH_COLORS);
    this.grassH = grassHeight(input.h, input.params.growth);
    this.ground = input.h;
    this.sunTint = input.theme.mood === 'night' ? '#fff1b8' : mixColor(input.theme.glow, '#ffffff', 0.2);
  }

  private clumpCount(input: EffectInput): number {
    return Math.max(4, Math.min(Math.round(input.w / 22), Math.floor(input.budget * 0.36)));
  }

  private fishCount(w: number): number {
    return w < 520 ? 3 : w < 900 ? 4 : 6;
  }

  /** The lawn (two interleaved rows, spaced evenly with a little jitter) and the fish. */
  private build(input: EffectInput, grown: boolean): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    const n = this.clumpCount(input);
    for (let k = 0; k < n; k++) {
      const m = spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initClump, ((k + 0.5) / n) * (w + 24) - 12, h);
      if (m > 0) {
        const i = pool.count - 1;
        pool.depth[i] = k % 2 === 0 ? 0.3 : 0.9;
        pool.life[i] = grown ? GROW_SECONDS + 1 : rand() * 0.4;
      }
    }
    spawnEdge(pool, 'area', w, h, this.budget.take(this.fishCount(w)), rand, this.initFish);
  }

  // ---------------------------------------------------------------- loop

  step(input: EffectInput): void {
    const { w, h, dt, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      pool.clear();
      this.build(input, false);
      spawnEdge(pool, 'area', w, h, this.budget.take(this.petalTarget(input.budget) * 0.6), rand, this.initPetal);
    }
    const rate = steadyRate(this.petalTarget(input.budget), h / 34, 0.85) * calm(input.intensity);
    this.petals.spawn(pool, 'top', w, h, rate, dt, rand, this.initPetal, this.budget.room());
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === CLUMP) {
        pool.life[i]! += dt;
      } else if (kind === FISH) {
        this.swim(i, input);
      } else if (kind === DART) {
        integrate(pool, i, dt);
        pool.phase[i]! += dt * 14;
        if (expired(pool, i)) {
          pool.kind[i] = FISH;
          pool.maxLife[i] = 0;
          pool.aux[i] = pool.y[i]!;
          pool.vx[i] = (pool.vx[i]! < 0 ? -1 : 1) * (24 + 36 * pool.depth[i]!);
          pool.vy[i] = 0;
          pool.phase[i] = 0;
        }
      } else if (kind === PETAL) {
        flutter(pool, i, dt, pool.size[i]! * 0.9, pool.aux[i]!);
        spin(pool, i, dt);
        integrate(pool, i, dt);
        if (pool.y[i]! > h + 20) pool.kill(i);
      } else if (kind === BUBBLE) {
        sway(pool, i, dt, 3, 1.2);
        integrate(pool, i, dt);
        pool.alpha[i] = 0.8 * envelope(pool, i, 0.3, 0.5);
        if (expired(pool, i)) pool.kill(i);
      } else if (kind === RING) {
        pool.life[i]! += dt;
        pool.alpha[i] = envelope(pool, i, 0.3, 0.7) * 0.8;
        if (expired(pool, i)) pool.kill(i);
      }
    }
  }

  /** Sine swim across the sky; off one side, the fish comes back from the other at a new height. */
  private swim(i: number, input: EffectInput): void {
    const pool = this.pool;
    const { w, dt, rand } = input;
    const amp = 10 + 16 * pool.depth[i]!;
    const w0 = TAU * pool.rotV[i]!;
    pool.phase[i]! += w0 * dt;
    pool.x[i]! += pool.vx[i]! * dt;
    pool.y[i] = pool.aux[i]! + Math.sin(pool.phase[i]!) * amp;
    pool.life[i]! += dt;
    // Tilt with the path: the derivative of the sine, signed by the swim direction.
    pool.rot[i] = Math.atan2(Math.cos(pool.phase[i]!) * amp * w0, Math.abs(pool.vx[i]!)) * 0.8;
    const margin = pool.size[i]!;
    const x = pool.x[i]!;
    if (x < -margin * 1.5 || x > w + margin * 1.5) {
      pool.x[i] = x < 0 ? w + margin : -margin;
      pool.aux[i] = this.ground * range(rand, 0.18, 0.62);
    }
    // Now and then a bubble rises from the mouth.
    if (rand() < dt * 0.35 && this.budget.room() > 2) {
      this.spotX = x + (pool.vx[i]! < 0 ? -1 : 1) * pool.size[i]! * 0.3;
      this.spotY = pool.y[i]!;
      spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), rand, this.initBubble, this.spotX, this.spotY);
    }
  }

  private petalTarget(budget: number): number {
    return Math.max(6, budget * 0.4);
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    const pool = this.pool;
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== FISH && pool.kind[i] !== DART) continue;
      const dx = pool.x[i]! - x;
      const dy = pool.y[i]! - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best >= 0) {
      const dx = x - pool.x[best]!;
      const dy = y - pool.y[best]!;
      pool.kind[best] = DART;
      pool.vx[best] = dx / DART_SECONDS;
      pool.vy[best] = dy / DART_SECONDS;
      pool.rot[best] = clamp(Math.atan2(dy, Math.abs(dx) + 1), -0.9, 0.9);
      pool.life[best] = 0;
      pool.maxLife[best] = DART_SECONDS;
      this.darts++;
    }
    this.spotX = x;
    this.spotY = y;
    spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initRing, x, y);
    spawnEdge(pool, 'point', input.w, input.h, this.budget.take(6), input.rand, this.initBubble, x, y);
  }

  still(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.started = true;
    this.build(input, true);
    spawnEdge(pool, 'area', w, h, this.budget.take(this.petalTarget(input.budget) * 0.5), rand, this.initPetal);
  }

  // ---------------------------------------------------------------- drawing

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const { w, h } = input;
    const n = pool.count;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = input.theme.mood === 'night' ? 0.25 : 0.45;
    const sun = quant(Math.max(w, h) * 0.7, 32);
    sprites.draw(ctx, 'glow', sun, this.sunTint, w * 0.08, h * 0.04);
    ctx.globalCompositeOperation = 'source-over';
    this.drawPetals(ctx, 0, 0.6);
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i];
      if (kind !== FISH && kind !== DART) continue;
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      const left = pool.vx[i]! < 0;
      const wiggle = kind === DART ? 0.12 * Math.sin(pool.phase[i]!) : 0.05 * Math.sin(pool.life[i]! * 6 + pool.phase[i]!);
      ctx.globalAlpha = pool.alpha[i]!;
      const rot = (left ? -pool.rot[i]! : pool.rot[i]!) + wiggle;
      sprites.draw(ctx, 'goldfish', pool.size[i]!, this.palette.color(pool.color[i]!), x, y, rot, left ? -1 : 1, 1);
    }
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i];
      if (kind === BUBBLE) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'bubble', pool.size[i]!, '#ffffff', pool.x[i]!, pool.y[i]!);
      } else if (kind === RING) {
        const k = 0.4 + 1.6 * clamp(pool.life[i]! / pool.maxLife[i]!, 0, 1);
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'sabzeh:ripple', 64, '#ffffff', pool.x[i]!, pool.y[i]!, 0, k, k);
      }
    }
    this.drawGrass(ctx, input, 0.3, GRASS_BACK, 1);
    this.drawPetals(ctx, 0.6, 2);
    this.drawGrass(ctx, input, 0.9, GRASS_FRONT, 0.92);
    ctx.globalAlpha = 1;
    const bow = quant(clamp(this.grassH * 0.45, 44, 120), 4);
    const grow = this.growK();
    if (grow > 0.05) {
      ctx.globalAlpha = grow;
      // Tied halfway up the lawn, so it sits above the hero's text scrim.
      sprites.draw(ctx, 'sabzeh:bow', bow, '#e8202a', w * 0.5, h - Math.max(bow * 0.45, this.grassH * grow * 0.5));
    }
    ctx.globalAlpha = 1;
  }

  /** How far the lawn has grown in (the oldest clump's life). */
  private growK(): number {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === CLUMP) return easeOut(pool.life[i]! / GROW_SECONDS);
    return 0;
  }

  private drawPetals(ctx: CanvasRenderingContext2D, lo: number, hi: number): void {
    const pool = this.pool;
    const sprites = this.sprites;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== PETAL) continue;
      const depth = pool.depth[i]!;
      if (depth < lo || depth >= hi) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      const size = pool.size[i]!;
      const color = PETAL_COLORS[pool.color[i]! % PETAL_COLORS.length]!;
      const flip = 0.25 + 0.75 * Math.abs(Math.cos(pool.phase[i]!));
      if (size >= 18) sprites.draw(ctx, 'blossom', size, color === '#ffffff' ? '#ffe3ec' : color, pool.x[i]!, pool.y[i]!, pool.rot[i]!, flip, 1);
      else sprites.draw(ctx, 'petal', size, color, pool.x[i]!, pool.y[i]!, pool.rot[i]!, flip, 1);
    }
  }

  /** One row of clumps as a single stroked path (plus a lighter path of blade tips for the front row). */
  private drawGrass(ctx: CanvasRenderingContext2D, input: EffectInput, row: number, color: string, alpha: number): void {
    const { w, h, t } = input;
    const n = this.clumpCount(input);
    const spacing = (w + 24) / Math.max(1, n);
    const front = row > 0.5;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = clamp(spacing * 0.16, 2.2, 4.5);
    ctx.beginPath();
    this.bladePaths(ctx, row, t, h, spacing, 1);
    ctx.stroke();
    if (front) {
      ctx.strokeStyle = GRASS_TIP;
      ctx.lineWidth = clamp(spacing * 0.07, 1, 2);
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      this.bladePaths(ctx, row, t, h, spacing, 0.45);
      ctx.stroke();
    }
  }

  /** Appends every blade of every clump in `row`; `part` < 1 draws only the top part (highlights). */
  private bladePaths(ctx: CanvasRenderingContext2D, row: number, t: number, h: number, spacing: number, part: number): void {
    const pool = this.pool;
    const base = this.grassH * (row > 0.5 ? 0.85 : 1);
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== CLUMP || Math.abs(pool.depth[i]! - row) > 0.01) continue;
      const grow = easeOut(pool.life[i]! / GROW_SECONDS);
      const cx = pool.x[i]!;
      const tall = base * pool.size[i]! * grow;
      if (tall < 1) continue;
      // A breeze traveling left to right, plus each clump's own sway.
      const breeze = Math.sin(t * 1.1 - cx * 0.008) * 0.6 + Math.sin(t * 2.3 + pool.phase[i]!) * 0.25;
      for (let b = 0; b < BLADES; b++) {
        const u = (b + 0.5) / BLADES - 0.5;
        const bx = cx + u * spacing * 1.1;
        const bh = tall * (0.7 + 0.3 * Math.cos(u * 3 + pool.aux[i]! * b));
        const lean = (u * 0.5 + breeze * 0.14 + pool.aux[i]! * 0.05) * bh;
        const y0 = h + 2;
        const sx = part < 1 ? bx + lean * (1 - part) * (1 - part) : bx;
        const sy = part < 1 ? y0 - bh * (1 - part) : y0;
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(bx + lean * 0.2, y0 - bh * 0.6, bx + lean, y0 - bh);
      }
    }
  }
}

export const sabzeh: EffectFactory = (sprites) => new SabzehEffect(sprites);
