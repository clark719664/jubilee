/**
 * moon — the Mid-Autumn / Chuseok harvest moon.
 * Ambient: a huge warm moon (diameter ∝ 0.5 + 0.5·moonPhase) in a soft halo, with the jade rabbit
 *   pounding its mortar on the moon's face; thin clouds drift across it in two depths; stars twinkle
 *   around it; round paper lanterns rise from below in three depths (far: small, dim, slow), each lit
 *   from inside with a warm halo; a garland of lanterns hangs from a sagging cord along the top left and
 *   swings as real pendulums.
 * Behaviors: rise + sway (lanterns), pendulum (hung lanterns), horizontal drift with wrap (clouds),
 *   twinkle (stars, glints), drag + envelope (glints).
 * Press-and-hold: a lantern grows under the finger and follows it; release and it floats up.
 * Tap: a lantern lifts off from the finger in a puff of glints (a tap right after a release just adds
 *   glints, so a press never makes two lanterns).
 * Still: the moon (size from moonPhase), the hung lanterns at rest, lanterns afloat, clouds and stars.
 * Params: moonPhase (0..1 closeness to the festival; default full), palette (lantern colors), density.
 */
import { mixColor } from '../painters';
import { frameScenery, moonDisc, moonPestle, moonRabbit, quant, roundLantern, softCloud } from '../painters/extra-whimsy';
import {
  Emitter, TAU, clamp, drag, envelope, expired, integrate, range, spawnEdge, steadyRate, sway, twinkle,
  type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { Palette, PooledEffect, calm } from './shared';

export const MOON = 0;
export const HUNG = 1;
const SCENERY_END = 2;
export const CLOUD = 2;
export const STAR = 3;
export const LANTERN = 4;
export const HELD = 5;
export const GLINT = 6;

const LANTERN_COLORS = ['#e8202a', '#ff8c1a', '#ff8fb8', '#ffd166'] as const;
const MOON_FACE = '#ffe9a8';
const HALO = '#fff1b8';
const WARM = '#ffb347';
/** A press that ends within this long of a tap is the same gesture (no second lantern). */
const RELEASE_GRACE = 0.4;
const HOLD_MIN = 18;
const HOLD_MAX = 64;
/** The moon is painted at most this big and scaled up (keeps the raster small). */
const MOON_PAINT_MAX = 384;

/** Moon diameter for this sky: 0.5 + 0.5·moonPhase of a "huge" base size. */
export function moonDiameter(w: number, h: number, moonPhase: number | undefined): number {
  const phase = clamp(moonPhase ?? 1, 0, 1);
  const base = Math.max(0, Math.min(h * 0.82, w * 0.6));
  return base * (0.5 + 0.5 * phase);
}

export class MoonEffect extends PooledEffect {
  readonly describe = 'A big golden moon with the jade rabbit, drifting clouds and lanterns rising';
  /** Lanterns released by press-and-hold or tap (tests). */
  released = 0;

  private readonly palette = new Palette();
  private readonly rise = new Emitter();
  private started = false;
  private releasedAt = -10;
  private placeArea = false;
  private glintX = 0;
  private glintY = 0;
  private cloudTint = '#5a6aa8';
  private cordY = 0;
  private cordSag = 0;
  private cordW = 0;

  constructor(sprites: SpriteCache) {
    super(sprites, 640);
    if (!sprites.has('moon:disc')) sprites.register('moon:disc', moonDisc);
    if (!sprites.has('moon:rabbit')) sprites.register('moon:rabbit', moonRabbit);
    if (!sprites.has('moon:pestle')) sprites.register('moon:pestle', moonPestle);
    if (!sprites.has('moon:cloud')) sprites.register('moon:cloud', softCloud);
    if (!sprites.has('moon:lantern')) sprites.register('moon:lantern', roundLantern);
  }

  // ---------------------------------------------------------------- particle inits

  private readonly initHung: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = HUNG;
    pool.aux[i] = pool.x[i]!;
    pool.depth[i] = range(rand, 0.2, 0.9);
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.05, 0.1);
    pool.color[i] = this.palette.pick(rand);
  };

  private readonly initCloud: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    pool.kind[i] = CLOUD;
    pool.depth[i] = depth;
    pool.size[i] = quant(140 + 220 * depth, 20);
    pool.vx[i] = 5 + 14 * depth;
    pool.alpha[i] = 0.32 + 0.4 * depth;
  };

  private readonly initStar: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = STAR;
    pool.size[i] = range(rand, 1.5, 3.5);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.15, 0.55);
    pool.depth[i] = range(rand, 0.4, 0.9);
  };

  private readonly initLantern: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    pool.kind[i] = LANTERN;
    pool.depth[i] = depth;
    pool.size[i] = quant(18 + 44 * depth * depth, 4);
    pool.aux[i] = 12 + 30 * depth;
    pool.vy[i] = -pool.aux[i]!;
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.12, 0.25);
    pool.color[i] = this.palette.pick(rand);
    pool.alpha[i] = 0.82 + 0.18 * depth;
    // Prefilled lanterns are already lit; new ones fade in over their first second.
    if (this.placeArea) {
      pool.y[i] = pool.y[i]! * 0.92;
      pool.life[i] = 1 + rand();
    }
  };

  private readonly initHeld: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = HELD;
    pool.depth[i] = 1;
    pool.size[i] = HOLD_MIN;
    pool.aux[i] = 40;
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = 0.18;
    pool.color[i] = this.palette.pick(rand);
    pool.alpha[i] = 1;
  };

  private readonly initGlint: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const v = range(rand, 20, 90);
    pool.kind[i] = GLINT;
    pool.x[i] = this.glintX;
    pool.y[i] = this.glintY;
    pool.vx[i] = Math.cos(a) * v;
    pool.vy[i] = Math.sin(a) * v - 25;
    pool.size[i] = range(rand, 2, 4);
    pool.phase[i] = rand() * TAU;
    pool.maxLife[i] = range(rand, 0.9, 1.6);
    pool.alpha[i] = 0;
  };

  // ---------------------------------------------------------------- setup

  private sync(input: EffectInput): void {
    frameScenery(this.budget, input.budget, SCENERY_END);
    this.palette.sync(input, () => LANTERN_COLORS);
    this.cloudTint = mixColor(input.theme.bg2, '#c9d4ff', input.theme.mood === 'night' ? 0.35 : 0.75);
    this.cordW = input.w * (input.w < 600 ? 0.62 : 0.5);
    this.cordY = Math.max(10, input.h * 0.03);
    this.cordSag = Math.min(46, input.h * 0.07);
  }

  private hungCount(w: number): number {
    return w < 520 ? 3 : w < 900 ? 4 : 5;
  }

  /** The moon, the garland, clouds and stars: everything that is not a rising lantern. */
  private build(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    const d = moonDiameter(w, h, input.params.moonPhase);
    const m = spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, (p, i) => {
      p.kind[i] = MOON;
      p.size[i] = d;
    }, 0, 0);
    if (m > 0) this.placeMoon(input);
    const n = this.hungCount(w);
    for (let k = 0; k < n; k++) {
      spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initHung, (this.cordW * (k + 0.6)) / (n + 0.2), 0);
    }
    const clouds = Math.min(w < 600 ? 4 : 6, Math.floor(input.budget * 0.05));
    spawnEdge(pool, 'area', w, h * 0.75, this.budget.take(clouds), rand, this.initCloud);
    spawnEdge(pool, 'area', w, h * 0.7, this.budget.take(clamp(input.budget * 0.14, 6, 40)), rand, this.initStar);
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] === STAR && this.insideMoon(pool.x[i]!, pool.y[i]!, 1.15)) pool.y[i] = pool.y[i]! * 0.3 + h * 0.62;
    }
    this.layoutHung(input.t);
  }

  private placeMoon(input: EffectInput): void {
    const { w, h } = input;
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== MOON) continue;
      const d = moonDiameter(w, h, input.params.moonPhase);
      pool.size[i] = d;
      const phone = w < 600;
      pool.x[i] = Math.min(w * (phone ? 0.64 : 0.7), w - d * 0.42);
      pool.y[i] = h * (phone ? 0.3 : 0.4);
    }
  }

  private insideMoon(x: number, y: number, k: number): boolean {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== MOON) continue;
      const r = (pool.size[i]! / 2) * k;
      const dx = x - pool.x[i]!;
      const dy = y - pool.y[i]!;
      return dx * dx + dy * dy < r * r;
    }
    return false;
  }

  private cordAt(x: number): number {
    const u = clamp(x / Math.max(1, this.cordW), 0, 1);
    return this.cordY + 4 * this.cordSag * u * (1 - u);
  }

  /** Hung lanterns: pendulums from the cord, length by depth, a slow swing each. */
  private layoutHung(t: number): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== HUNG) continue;
      const size = quant(30 + 18 * pool.depth[i]!, 4);
      pool.size[i] = size;
      const len = size * (0.5 + 0.9 * pool.depth[i]!);
      const theta = pool.rotV[i]! * Math.sin(t * (1.6 / Math.sqrt(len / 40)) + pool.phase[i]!);
      pool.rot[i] = theta;
      const ax = pool.aux[i]!;
      const ay = this.cordAt(ax);
      pool.x[i] = ax + Math.sin(theta) * (len + size * 0.5);
      pool.y[i] = ay + Math.cos(theta) * (len + size * 0.5);
    }
  }

  // ---------------------------------------------------------------- loop

  step(input: EffectInput): void {
    const { w, h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      pool.clear();
      this.build(input);
      this.placeArea = true;
      spawnEdge(pool, 'area', w, h, this.budget.take(this.lanternTarget(input.budget) * 0.75), rand, this.initLantern);
      this.placeArea = false;
    }
    this.placeMoon(input);
    this.layoutHung(t);
    const k = calm(input.intensity);
    const target = this.lanternTarget(input.budget);
    const rate = steadyRate(target, h / 26, 0.9) * k;
    this.rise.spawn(pool, 'bottom', w, h, rate, dt, rand, this.initLantern, this.budget.room());
    const pointer = input.pointer;
    const span = w + 400;
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === CLOUD) {
        pool.x[i]! += pool.vx[i]! * dt;
        if (pool.x[i]! > w + pool.size[i]! * 0.6) pool.x[i] = pool.x[i]! - span - pool.size[i]!;
      } else if (kind === STAR) {
        pool.life[i]! += dt;
        twinkle(pool, i, pool.aux[i]!, 0.6, pool.depth[i]!);
      } else if (kind === LANTERN) {
        const depth = pool.depth[i]!;
        sway(pool, i, dt, 6 + 10 * depth, pool.rotV[i]!);
        pool.rot[i] = 0.07 * Math.sin(pool.phase[i]!);
        integrate(pool, i, dt);
        if (pool.y[i]! < -pool.size[i]! * 2) pool.kill(i);
      } else if (kind === HELD) {
        pool.size[i] = Math.min(HOLD_MAX, pool.size[i]! + 26 * dt);
        if (pointer) {
          pool.x[i]! += (pointer.x - pool.x[i]!) * Math.min(1, 10 * dt);
          pool.y[i]! += (pointer.y - pool.y[i]!) * Math.min(1, 10 * dt);
        }
        pool.phase[i]! += dt * 2;
        pool.rot[i] = 0.05 * Math.sin(pool.phase[i]!);
        pool.life[i]! += dt;
      } else if (kind === GLINT) {
        drag(pool, i, dt, 1.4);
        pool.vy[i]! -= 12 * dt;
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.3, 0.6) * (0.7 + 0.3 * Math.sin(pool.life[i]! * 9 + pool.phase[i]!));
        if (expired(pool, i)) pool.kill(i);
      }
    }
  }

  private lanternTarget(budget: number): number {
    return Math.max(4, Math.min(60, budget * 0.4));
  }

  private glints(x: number, y: number, n: number, input: EffectInput): void {
    this.glintX = x;
    this.glintY = y;
    spawnEdge(this.pool, 'point', input.w, input.h, this.budget.take(n), input.rand, this.initGlint, x, y);
  }

  press(x: number, y: number, down: boolean, input: EffectInput): void {
    this.sync(input);
    const pool = this.pool;
    if (down) {
      for (let i = 0; i < pool.count; i++) if (pool.kind[i] === HELD) return;
      if (this.budget.room() < 1) frameScenery(this.budget, Math.max(0, input.budget - 1), SCENERY_END);
      spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initHeld, x, y);
      return;
    }
    for (let i = pool.count - 1; i >= 0; i--) {
      if (pool.kind[i] !== HELD) continue;
      pool.kind[i] = LANTERN;
      pool.size[i] = quant(pool.size[i]!, 4);
      pool.vy[i] = -(28 + pool.size[i]! * 0.3);
      pool.rotV[i] = 0.2;
      pool.life[i] = 1;
      this.released++;
      this.releasedAt = input.t;
      this.glints(pool.x[i]!, pool.y[i]!, 6, input);
    }
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    if (input.t - this.releasedAt < RELEASE_GRACE) {
      this.glints(x, y, 6, input);
      return;
    }
    if (this.budget.room() < 1) frameScenery(this.budget, Math.max(0, input.budget - 1), SCENERY_END);
    const n = spawnEdge(this.pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initLantern, x, y);
    if (n > 0) {
      const i = this.pool.count - 1;
      this.pool.depth[i] = 1;
      this.pool.size[i] = 48;
      this.pool.vy[i] = -42;
      this.pool.alpha[i] = 1;
      this.pool.life[i] = 1;
      this.released++;
    }
    this.glints(x, y, 10, input);
  }

  still(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.started = true;
    this.build(input);
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === HUNG) pool.rotV[i] = 0;
    this.layoutHung(0);
    this.placeArea = true;
    spawnEdge(pool, 'area', w, h * 0.85, this.budget.take(this.lanternTarget(input.budget) * 0.7), rand, this.initLantern);
    this.placeArea = false;
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i];
      if (kind === STAR) twinkle(pool, i, pool.aux[i]!, 0.6, pool.depth[i]!);
      else if (kind === LANTERN) pool.life[i] = 2;
    }
  }

  // ---------------------------------------------------------------- drawing

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const n = pool.count;
    const t = input.t;
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== STAR) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'circle', pool.size[i]!, '#fffbe6', pool.x[i]!, pool.y[i]!);
    }
    for (let i = 0; i < n; i++) if (pool.kind[i] === MOON) this.drawMoon(ctx, i, t);
    this.drawLanterns(ctx, 0, 0.5);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== CLOUD) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'moon:cloud', pool.size[i]!, this.cloudTint, pool.x[i]!, pool.y[i]!);
    }
    this.drawGarland(ctx);
    this.drawLanterns(ctx, 0.5, 2);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== GLINT) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'glow', 14, '#ffe9a3', pool.x[i]!, pool.y[i]!);
      sprites.draw(ctx, 'circle', pool.size[i]!, '#ffffff', pool.x[i]!, pool.y[i]!);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  private drawMoon(ctx: CanvasRenderingContext2D, i: number, t: number): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const x = pool.x[i]!;
    const y = pool.y[i]!;
    const d = pool.size[i]!;
    if (d < 2) return;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.28 + 0.04 * Math.sin(t * 0.8);
    const halo = quant(Math.min(d * 2.1, 900), 32);
    sprites.draw(ctx, 'glow', halo, HALO, x, y, 0, (d * 2.1) / halo, (d * 2.1) / halo);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    const paint = Math.min(MOON_PAINT_MAX, quant(d, 16));
    const k = d / paint;
    sprites.draw(ctx, 'moon:disc', paint, MOON_FACE, x, y, 0, k, k);
    // The rabbit sits a little low and right of center; its pestle pounds about twice a second.
    const rs = d * 0.38;
    const rp = Math.min(256, quant(rs, 16));
    const rk = rs / rp;
    const rx = x + d * 0.04;
    const ry = y + d * 0.08;
    ctx.globalAlpha = 0.24;
    sprites.draw(ctx, 'moon:rabbit', rp, '#a8742a', rx, ry, 0, rk, rk);
    const pound = Math.abs(Math.sin(t * 2.2));
    const ps = rs * 0.34;
    const pp = Math.min(128, quant(ps, 8));
    sprites.draw(ctx, 'moon:pestle', pp, '#a8742a', rx - rs * 0.31, ry - rs * 0.05 - pound * rs * 0.1, -0.35, ps / pp, ps / pp);
    ctx.globalAlpha = 1;
  }

  private drawGarland(ctx: CanvasRenderingContext2D): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const w = this.cordW;
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, this.cordAt(0) - 4);
    ctx.quadraticCurveTo(w / 2, this.cordY + 2 * this.cordSag, w + 10, this.cordY - 4);
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== HUNG) continue;
      const ax = pool.aux[i]!;
      ctx.moveTo(ax, this.cordAt(ax));
      ctx.lineTo(pool.x[i]! - Math.sin(pool.rot[i]!) * pool.size[i]! * 0.5, pool.y[i]! - Math.cos(pool.rot[i]!) * pool.size[i]! * 0.5);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== HUNG) continue;
      ctx.globalAlpha = 0.45;
      sprites.draw(ctx, 'glow', quant(pool.size[i]! * 2.6, 8), WARM, pool.x[i]!, pool.y[i]!);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== HUNG) continue;
      sprites.draw(ctx, 'moon:lantern', pool.size[i]!, this.palette.color(pool.color[i]!), pool.x[i]!, pool.y[i]!, pool.rot[i]!);
    }
  }

  /** Rising and held lanterns with depth in [lo, hi): halo (lighter), body, then an inner glow. */
  private drawLanterns(ctx: CanvasRenderingContext2D, lo: number, hi: number): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const n = pool.count;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i];
      const depth = pool.depth[i]!;
      if ((kind !== LANTERN && kind !== HELD) || depth < lo || depth >= hi) continue;
      ctx.globalAlpha = (0.2 + 0.35 * depth) * this.fade(i);
      sprites.draw(ctx, 'glow', quant(pool.size[i]! * 2.8, 8), WARM, pool.x[i]!, pool.y[i]!);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i];
      const depth = pool.depth[i]!;
      if ((kind !== LANTERN && kind !== HELD) || depth < lo || depth >= hi) continue;
      ctx.globalAlpha = pool.alpha[i]! * this.fade(i);
      const size = kind === HELD ? quant(pool.size[i]!, 4) : pool.size[i]!;
      sprites.draw(ctx, 'moon:lantern', size, this.palette.color(pool.color[i]!), pool.x[i]!, pool.y[i]!, pool.rot[i]!);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i];
      const depth = pool.depth[i]!;
      if ((kind !== LANTERN && kind !== HELD) || depth < lo || depth >= hi) continue;
      ctx.globalAlpha = 0.35 * pool.alpha[i]! * this.fade(i);
      sprites.draw(ctx, 'glow', quant(pool.size[i]! * 0.8, 4), '#fff1b8', pool.x[i]!, pool.y[i]!);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /** Lanterns fade in over their first second (no pop-in at the bottom edge). */
  private fade(i: number): number {
    return Math.min(1, this.pool.life[i]!);
  }
}

export const moon: EffectFactory = (sprites) => new MoonEffect(sprites);
