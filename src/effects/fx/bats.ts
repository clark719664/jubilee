/**
 * bats — a friendly Halloween night.
 * Ambient: a big moon with a soft halo, twinkling stars, a bare branch reaching in from the top-left with
 *   bats hanging from it, three jack-o'-lanterns on the ground whose candle glow breathes (3 s period), a
 *   fog band of wide soft puffs drifting along the bottom, and a little flock of bats flapping (two-frame
 *   flap) after a slowly roaming attractor, each on its own orbit so the flock loops and tumbles rather
 *   than clumping. Every ~20 s a friendly ghost peeks in from the right edge and says "boo!".
 * Behaviours: steering toward the attractor + wander + speed cap (bats), horizontal drift + wrap (fog),
 *   twinkle (stars), alpha breathing (pumpkin glows), drag + envelope (sparkles).
 * Tap: bats near the finger scatter away from it (and stay skittish for a moment), a few green and orange
 *   sparkles puff out, then the flock regroups on its own.
 * Still: bats hanging from the branch with two caught mid-flap by the moon, fog frozen, pumpkins glowing,
 *   the ghost peeking.
 * Scene mode (`params.stage`): the scene draws its own pumpkins, trees and lane, so the branch, the pumpkins,
 *   the fog and the peeking ghost give way to it. The moon (the art leaves it to the effect) rises in the
 *   scene's open sky at a fixed artboard point up and to the right of the words, peeking in from the right
 *   edge where the hero is too narrow to show it whole; the flock and the stars keep to the sky above the
 *   rooftops.
 * Params: stage, density. Bats are dark silhouettes with a faint moonlit rim so they read on any night sky.
 */
import { booBubble, branch, branchY, frameKeeping, ghost, pumpkin, quantize, sparkle } from '../painters/extra-night';
import {
  TAU, clamp, drag, envelope, expired, integrate, range, spawnEdge, twinkle, wander, type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { PooledEffect, calm } from './shared';

/** Scenery kinds (kept when the budget drops) come first. */
export const PUMPKIN = 0;
export const HANGING = 1;
const SCENERY_END = 2;
export const FOG = 2;
export const BAT = 3;
export const STAR = 4;
export const SPARK = 5;

const BAT_COLOR = '#140a24';
const RIM = '#9b7bff';
const HANG_COLOR = '#2a1745';
const FOG_COLOR = '#cbb8ff';
const MOON = '#fff1c4';
const PUMPKIN_COLOR = '#ff8c1a';
const FOG_SIZES = [128, 176, 224] as const;
const GHOST_CYCLE = 20;
const GHOST_START = 3;
/** Pumpkin glow breathing period (seconds). */
export const BREATH_PERIOD = 3;
/** Where the bats hang along the branch (unit coords along its length). */
const HANG_U = [-0.2, 0.02, 0.2, -0.08, 0.12, 0.3] as const;
/**
 * Scene mode: the moon's centre and diameter in artboard units, in open sky above every scene's hills,
 * clear of the words (whose right edge sits near x 990 at every hero size).
 */
export const SCENE_MOON = { x: 1140, y: 230, d: 220 } as const;
/** Scene mode: extra still-frame bats around the moon (dx, dy in moon diameters, depth). */
const STILL_BATS = [[-0.32, -0.05, 0.9], [0.22, 0.2, 0.6]] as const;
const SCENE_STILL_BATS = [[-1.05, 0.5, 0.5], [-0.8, -0.32, 0.4]] as const;

/** Where the moon is drawn: centre and sprite size, CSS px. */
export interface MoonPlace {
  x: number;
  y: number;
  m: number;
}

export class BatsEffect extends PooledEffect {
  readonly describe = 'Bats flitting past the moon over glowing pumpkins and mist';

  private started = false;
  private ax = 0;
  private ay = 0;
  private ghostHold = false;
  private sparkColor = '#a8ff5e';
  /** Stars are scattered over the top `starK` of the sky. */
  private starK = 0.62;
  private readonly moon: MoonPlace = { x: 0, y: 0, m: 80 };

  constructor(sprites: SpriteCache) {
    super(sprites, 512);
    if (!sprites.has('bats:pumpkin')) sprites.register('bats:pumpkin', pumpkin);
    if (!sprites.has('bats:ghost')) sprites.register('bats:ghost', ghost);
    if (!sprites.has('bats:branch')) sprites.register('bats:branch', branch);
    if (!sprites.has('bats:boo')) sprites.register('bats:boo', booBubble);
    if (!sprites.has('bats:sparkle')) sprites.register('bats:sparkle', sparkle);
  }

  private readonly initPumpkin: ParticleInit = (pool, i) => {
    pool.kind[i] = PUMPKIN;
    pool.aux[i] = pool.x[i]!;
    pool.phase[i] = pool.aux[i]! * 2.1;
  };

  private readonly initHanging: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = HANGING;
    pool.aux[i] = pool.x[i]!;
    pool.size[i] = range(rand, 34, 44);
    pool.phase[i] = rand() * TAU;
  };

  private readonly initFog: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = FOG;
    pool.aux[i] = rand() * 130;
    pool.y[i] = this.fogTop + pool.aux[i]!;
    pool.size[i] = FOG_SIZES[Math.floor(rand() * 3) % 3]!;
    pool.vx[i] = range(rand, 6, 18) * (rand() < 0.5 ? -1 : 1);
    pool.alpha[i] = range(rand, 0.14, 0.26);
    pool.phase[i] = rand() * TAU;
    pool.depth[i] = range(rand, 2.2, 3.2);
  };

  private fogTop = 0;

  private readonly initBat: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = BAT;
    pool.y[i] = pool.y[i]! * 0.6 + 10;
    const depth = range(rand, 0.35, 1);
    pool.depth[i] = depth;
    pool.size[i] = 26 + 30 * depth;
    pool.alpha[i] = 0.75 + 0.25 * depth;
    pool.phase[i] = rand() * TAU;
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.5, 1.1) * (rand() < 0.5 ? -1 : 1);
    pool.maxLife[i] = 0;
    pool.aux[i] = 0;
    pool.vx[i] = range(rand, -40, 40);
    pool.vy[i] = range(rand, -20, 20);
  };

  private readonly initStar: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = STAR;
    pool.y[i] = pool.y[i]! * this.starK;
    pool.size[i] = range(rand, 1.5, 3);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.2, 0.8);
    pool.depth[i] = rand();
  };

  private readonly initSpark: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const v = range(rand, 60, 220);
    pool.kind[i] = SPARK;
    pool.vx[i] = Math.cos(a) * v;
    pool.vy[i] = Math.sin(a) * v - 30;
    pool.size[i] = range(rand, 10, 18);
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -4, 4);
    pool.maxLife[i] = range(rand, 0.8, 1.4);
    pool.color[i] = rand() < 0.5 ? 0 : 1;
    pool.alpha[i] = 0;
  };

  private sync(input: EffectInput): void {
    frameKeeping(this.budget, input.budget, SCENERY_END);
    const scene = this.scene;
    scene.sync(input);
    // Into or out of scene mode: start over with the right set (the next step builds it).
    if (scene.changed && this.started) {
      this.pool.clear();
      this.started = false;
    }
    this.starK = scene.on && input.h > 0 ? (scene.sky * 0.95) / input.h : 0.62;
    this.fogTop = input.h - 120;
    this.sparkColor = input.theme.accent2;
    this.placeMoon(input.w, input.h);
  }

  /** The moon: high on the right of the bare sky; in scene mode at its artboard point, peeking in when it would not fit. */
  private placeMoon(w: number, h: number): void {
    const moon = this.moon;
    const scene = this.scene;
    if (!scene.on) {
      moon.m = this.moonSize(w, h);
      moon.x = w * 0.8;
      moon.y = h * 0.24;
      return;
    }
    const m = quantize(scene.len(SCENE_MOON.d), 4);
    const x = scene.x(SCENE_MOON.x);
    moon.m = m;
    moon.x = x + m * 0.25 > w ? w + m * 0.125 : x;
    moon.y = Math.max(scene.y(SCENE_MOON.y), m * 0.6);
  }

  /** Bats in the flock for this budget. */
  private flockSize(budget: number): number {
    return clamp(Math.round(budget * 0.05), 5, 14);
  }

  private build(input: EffectInput, hang: number): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    // Scene mode: the art has its own pumpkins, trees and mist.
    const bare = !this.scene.on;
    if (bare) {
      for (let k = 0; k < 3; k++) spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initPumpkin, k, 0);
      for (let k = 0; k < hang; k++) spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initHanging, k, 0);
      this.layout(input);
    }
    spawnEdge(pool, 'area', w, h, this.budget.take(clamp(input.budget * 0.12, 12, 40)), rand, this.initStar);
    this.fogTop = h - 120;
    if (bare) spawnEdge(pool, 'area', w, h, this.budget.take(clamp(input.budget * 0.05, 6, 16)), rand, this.initFog);
    if (hang <= 2) spawnEdge(pool, 'area', w, h, this.budget.take(this.flockSize(input.budget)), rand, this.initBat);
  }

  /** Re-places the scenery for the current size (cheap; runs every step so resizes just work). */
  private layout(input: EffectInput): void {
    const { w, h } = input;
    const pool = this.pool;
    const narrow = w < 720;
    const L = this.branchLength(w);
    const by = this.branchTop(h);
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind === PUMPKIN) {
        const k = pool.aux[i]!;
        const s = this.pumpkinSize(k, h);
        const fx = narrow ? [0.56, 0.74, 0.9][k]! : [0.64, 0.76, 0.88][k]!;
        pool.size[i] = s;
        pool.x[i] = w * fx;
        pool.y[i] = h - s * 0.36;
      } else if (kind === HANGING) {
        const u = HANG_U[pool.aux[i]! % HANG_U.length]!;
        pool.x[i] = L * (0.46 + u);
        pool.y[i] = by + branchY(u) * L + pool.size[i]! * 0.42;
      }
    }
  }

  private pumpkinSize(k: number, h: number): number {
    return quantize(clamp(h * [0.15, 0.2, 0.13][k]!, 44, 150));
  }

  private branchLength(w: number): number {
    return quantize(clamp(w * 0.42, 220, 560), 16);
  }

  private branchTop(h: number): number {
    return clamp(h * 0.1, 30, 80);
  }

  private moonSize(w: number, h: number): number {
    return quantize(clamp(Math.min(w, h) * 0.24, 80, 210));
  }

  step(input: EffectInput): void {
    const { w, h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (input.motion === 'full') this.ghostHold = false;
    if (!this.started) {
      this.started = true;
      this.build(input, 2);
    }
    this.layout(input);
    const k = calm(input.intensity);
    const want = this.flockSize(input.budget);
    let bats = 0;
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === BAT) bats++;
    if (bats < want && rand() < 0.02 * k) {
      const side = rand() < 0.5 ? 'left' : 'right';
      spawnEdge(pool, side, w, h, this.budget.take(1), rand, this.initBat);
    }
    // Roaming attractor: a slow Lissajous over the upper sky (in scene mode, the sky above the rooftops).
    this.ax = w * (0.5 + 0.3 * Math.sin(t * 0.13) + 0.08 * Math.sin(t * 0.41));
    this.ay = this.scene.on ? this.scene.sky * (0.5 + 0.2 * Math.sin(t * 0.21 + 1)) : h * (0.36 + 0.14 * Math.sin(t * 0.21 + 1));
    const span = w + 400;
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === PUMPKIN) {
        pool.life[i]! += dt;
        pool.alpha[i] = 0.42 + 0.22 * Math.sin((TAU * pool.life[i]!) / BREATH_PERIOD + pool.phase[i]!);
      } else if (kind === HANGING) {
        pool.life[i]! += dt;
        pool.rot[i] = 0.08 * Math.sin(pool.life[i]! * 0.9 + pool.phase[i]!);
      } else if (kind === FOG) {
        integrate(pool, i, dt);
        const x = pool.x[i]!;
        if (x < -200) pool.x[i] = x + span;
        else if (x > w + 200) pool.x[i] = x - span;
        pool.y[i] = this.fogTop + pool.aux[i]!;
      } else if (kind === BAT) {
        this.steer(i, dt, rand);
        integrate(pool, i, dt);
        pool.phase[i]! += dt * (11 + 4 * pool.depth[i]!);
      } else if (kind === STAR) {
        pool.life[i]! += dt;
        twinkle(pool, i, pool.aux[i]!, 0.6, 0.4 + 0.5 * pool.depth[i]!);
      } else if (kind === SPARK) {
        drag(pool, i, dt, 2.2);
        pool.vy[i]! += 40 * dt;
        pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.12, 0.6);
        if (expired(pool, i)) pool.kill(i);
      }
    }
  }

  /** Flock steering: spring toward this bat's orbit point around the attractor, damped, capped. */
  private steer(i: number, dt: number, rand: () => number): void {
    const pool = this.pool;
    const orbit = pool.rot[i]! + pool.rotV[i]! * pool.life[i]! * 0.6;
    const r = 60 + 90 * pool.depth[i]!;
    const tx = this.ax + Math.cos(orbit) * r * 1.4;
    const ty = this.ay + Math.sin(orbit) * r * 0.6;
    const scared = pool.aux[i]!;
    const pull = scared > 0 ? 0.25 : 1.6;
    if (scared > 0) pool.aux[i] = Math.max(0, scared - dt);
    pool.vx[i]! += (tx - pool.x[i]!) * pull * dt;
    pool.vy[i]! += (ty - pool.y[i]!) * pull * dt;
    wander(pool, i, dt, 160, rand);
    drag(pool, i, dt, scared > 0 ? 0.6 : 0.9);
    const vx = pool.vx[i]!;
    const vy = pool.vy[i]!;
    const v = Math.hypot(vx, vy);
    const cap = scared > 0 ? 420 : 170;
    if (v > cap) {
      pool.vx[i] = (vx / v) * cap;
      pool.vy[i] = (vy / v) * cap;
    }
  }

  tap(x: number, y: number, input: EffectInput): void {
    const pool = this.pool;
    this.sync(input);
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== BAT) continue;
      const dx = pool.x[i]! - x;
      const dy = pool.y[i]! - y;
      const d = Math.max(12, Math.hypot(dx, dy));
      const reach = Math.max(260, Math.min(input.w, input.h) * 0.45);
      if (d > reach) continue;
      const push = 520 * (1 - d / reach) + 140;
      pool.vx[i]! += (dx / d) * push;
      pool.vy[i]! += (dy / d) * push - 60;
      pool.aux[i] = 1.4;
    }
    spawnEdge(pool, 'point', input.w, input.h, this.budget.take(20), input.rand, this.initSpark, x, y);
  }

  still(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.started = true;
    this.ghostHold = true;
    this.build(input, 5);
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] === STAR) pool.alpha[i] = 0.35 + 0.5 * pool.depth[i]!;
    }
    // Two bats caught mid-flap across the moon (in scene mode two more trail off toward the words).
    const { x: mx, y: my, m } = this.moon;
    const pts = this.scene.on ? [...STILL_BATS, ...SCENE_STILL_BATS] : STILL_BATS;
    for (const [dx, dy, depth] of pts) {
      const n = spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initBat, mx + dx * m, my + dy * m);
      if (n > 0) {
        const i = pool.count - 1;
        pool.y[i] = my + dy * m;
        pool.depth[i] = depth;
        pool.size[i] = 26 + 30 * depth;
        pool.vx[i] = 0;
        pool.vy[i] = 0;
        pool.phase[i] = depth > 0.8 ? 0.6 : 3.8;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const { w, h, t } = input;
    const pool = this.pool;
    const sprites = this.sprites;
    const bare = !this.scene.on;
    const { x: moonX, y: moonY, m } = this.moon;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5;
    // Over a scene the halo stays smaller, so it lights the sky rather than washing over the rooftops.
    sprites.draw(ctx, 'glow', quantize(m * (bare ? 2.6 : 2), 8), '#b39cff', moonX, moonY);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== STAR) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'circle', pool.size[i]!, '#fff4e0', pool.x[i]!, pool.y[i]!);
    }
    ctx.globalAlpha = 1;
    sprites.draw(ctx, 'moon', m, MOON, moonX, moonY);
    if (!bare) {
      // Over a scene the hero's top scrim dims the sky, so the moon gets a little light of its own.
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.4;
      sprites.draw(ctx, 'glow', quantize(m * 1.2, 8), MOON, moonX, moonY);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    if (bare) {
      const L = this.branchLength(w);
      sprites.draw(ctx, 'bats:branch', L, BAT_COLOR, L * 0.46, this.branchTop(h));
    }
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind === HANGING) {
        ctx.globalAlpha = 1;
        sprites.draw(ctx, 'batB', pool.size[i]!, HANG_COLOR, pool.x[i]!, pool.y[i]!, Math.PI + pool.rot[i]!, 0.62, 1);
      } else if (kind === BAT) {
        ctx.globalAlpha = pool.alpha[i]!;
        const frame = Math.sin(pool.phase[i]!) > 0 ? 'batA' : 'batB';
        const tilt = clamp(pool.vx[i]! * 0.0015, -0.35, 0.35);
        sprites.draw(ctx, frame, quantize(pool.size[i]!, 4), BAT_COLOR, pool.x[i]!, pool.y[i]!, tilt);
      }
    }
    if (bare) this.drawGhost(ctx, input);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== PUMPKIN) continue;
      const s = pool.size[i]!;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'glow', s * 2.6, PUMPKIN_COLOR, pool.x[i]!, pool.y[i]! + s * 0.05);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== PUMPKIN) continue;
      ctx.globalAlpha = 1;
      sprites.draw(ctx, 'bats:pumpkin', pool.size[i]!, PUMPKIN_COLOR, pool.x[i]!, pool.y[i]!);
    }
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== FOG) continue;
      ctx.globalAlpha = pool.alpha[i]! * (0.85 + 0.15 * Math.sin(t * 0.3 + pool.phase[i]!));
      sprites.draw(ctx, 'glow', pool.size[i]!, FOG_COLOR, pool.x[i]!, pool.y[i]!, 0, pool.depth[i]!, 0.7);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      if (kind === PUMPKIN) {
        const s = pool.size[i]!;
        ctx.globalAlpha = pool.alpha[i]! * 0.5;
        sprites.draw(ctx, 'glow', s * 0.5, '#ffd166', x, y + s * 0.12);
      } else if (kind === HANGING) {
        ctx.globalAlpha = 0.4;
        sprites.draw(ctx, 'glow', quantize(pool.size[i]! * 1.8, 8), RIM, x, y);
      } else if (kind === BAT) {
        ctx.globalAlpha = 0.22 * pool.alpha[i]!;
        sprites.draw(ctx, 'glow', quantize(pool.size[i]! * 1.8, 8), RIM, x, y);
      } else if (kind === SPARK) {
        const c = pool.color[i] === 0 ? this.sparkColor : PUMPKIN_COLOR;
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'bats:sparkle', quantize(pool.size[i]!, 3), c, x, y, pool.rot[i]!);
        ctx.globalAlpha = pool.alpha[i]! * 0.5;
        sprites.draw(ctx, 'glow', 32, c, x, y);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /** The ghost peeks from the right edge for ~4 s of every 20 s cycle (always, in a still frame). */
  private drawGhost(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const { w, h, t } = input;
    let peek = 1;
    if (!this.ghostHold) {
      const c = (t - GHOST_START) % GHOST_CYCLE;
      if (t < GHOST_START || c > 4.6) return;
      peek = c < 0.9 ? c / 0.9 : c > 3.7 ? (4.6 - c) / 0.9 : 1;
      peek = peek * peek * (3 - 2 * peek);
    }
    const s = quantize(clamp(h * 0.2, 60, 140));
    const x = w + s * 0.42 - peek * s * 0.62;
    const y = h * 0.5 + Math.sin(t * 1.6) * 6;
    ctx.globalAlpha = 0.92 * peek;
    this.sprites.draw(ctx, 'bats:ghost', s, '#f6f0ff', x, y, -0.25 * peek);
    if (peek > 0.7) {
      ctx.globalAlpha = (peek - 0.7) / 0.3;
      this.sprites.draw(ctx, 'bats:boo', quantize(s * 0.7, 4), '#4a2373', x - s * 0.66, y - s * 0.46);
    }
    ctx.globalAlpha = 1;
  }
}

export const bats: EffectFactory = (sprites) => new BatsEffect(sprites);
