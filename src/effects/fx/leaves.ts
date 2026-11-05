/**
 * leaves — fall leaves on a gusty wind, piling up along the ground.
 * Ambient: maple, oak and ginkgo leaves in continuous depth (far: small, faint, slow · near: big, quick)
 *   tumble down on a slow gusting wind; each flutters on its own frequency (drawn as width·|cos φ|, the
 *   flip fake) and spins. Leaves that reach the ground lie down in a growing pile; the oldest fade away.
 *   Warm motes of dust drift in a 'lighter' pass. On Thanksgiving (theme 'harvest' with no custom palette,
 *   or variant 'turkey') a turkey struts along the bottom, stopping now and then to peck.
 * Behaviors: gravity to a depth terminal + flutter + horizontal drag + wind + spin; settle into the pile.
 * Tap: a gust — leaves near the finger are blown outward and swirled round it, leaves in the pile are
 *   kicked back up into the air, the whole sky leans with the wind for a moment, and the leaf closest to
 *   the finger changes color with a little sparkle. Tapping the turkey makes it hop.
 * Still: a leaf pile along the bottom with leaves frozen mid-air (and the turkey standing by).
 * Params: palette (leaf colors; default crimson, orange, amber, gold, rust, mustard), density;
 *   variant 'turkey' forces the turkey, 'noturkey' hides it.
 */
import type { Theme } from '../../theme/themes';
import {
  Emitter, TAU, clamp, drag, envelope, expired, flutter, gravity, integrate, range, spawnEdge, steadyRate, twinkle,
  type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput } from '../types';
import { Palette, PooledEffect, calm } from './shared';

/** Falling leaf kinds are the shape index (0 maple, 1 oak, 2 ginkgo); resting leaves are REST + shape. */
export const MAPLE = 0;
export const OAK = 1;
export const GINKGO = 2;
export const REST = 10;
export const MOTE = 20;
export const SPARK = 21;

const SHAPES = ['leafMaple', 'leafOak', 'leafGinkgo'] as const;
export const AUTUMN: readonly string[] = ['#c8102e', '#e85d04', '#f48c06', '#ffb703', '#b5461a', '#d4a017'];
const REST_LIFE = 28;
const TURKEY_COLOR = '#8b5a2b';

export function isFalling(kind: number): boolean {
  return kind < REST;
}

export function isResting(kind: number): boolean {
  return kind >= REST && kind < MOTE;
}

/** Slow gusty breeze in px/s (positive = to the right). */
export function breeze(t: number): number {
  return 22 + 18 * Math.sin(t * 0.17) + 12 * Math.sin(t * 0.61 + 1.3) + 7 * Math.sin(t * 1.7 + 0.2);
}

function autumnPalette(_theme: Theme): readonly string[] {
  return AUTUMN;
}

export class LeavesEffect extends PooledEffect {
  readonly describe = 'Autumn leaves tumbling in the wind';
  /** Turkey state (x in px, facing ±1, hop height/velocity, peck timer). */
  turkeyX = 0;
  turkeyDir = 1;
  turkeyHop = 0;
  private turkeyVy = 0;
  private turkeyPause = 0;
  private turkeyNextPause = 4;
  private turkeyStep = 0;
  private turkey = false;
  /** Extra wind from taps, px/s; decays. */
  gust = 0;
  /** Leaves recolored by taps (tests). */
  recolored = 0;

  private readonly palette = new Palette();
  private readonly fall = new Emitter();
  private readonly motes = new Emitter();
  private started = false;
  private sparkX = 0;
  private sparkY = 0;
  private groundY = 0;

  private readonly initLeaf: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    const r = rand();
    pool.kind[i] = r < 0.5 ? MAPLE : r < 0.8 ? OAK : GINKGO;
    pool.depth[i] = depth;
    pool.size[i] = 15 + 30 * depth + 6 * rand();
    pool.vy[i] = 20 + 30 * depth;
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.35, 0.9);
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -1.6, 1.6);
    pool.alpha[i] = 0.55 + 0.45 * depth;
    pool.color[i] = this.palette.pick(rand);
  };

  private readonly initRest: ParticleInit = (pool, i, rand) => {
    this.initLeaf(pool, i, rand);
    pool.kind[i] = REST + pool.kind[i]!;
    // A mound: denser and higher in the middle of each heap.
    pool.y[i] = this.groundY - 22 * rand() * rand();
    pool.depth[i] = 0.5 + 0.5 * rand();
    pool.size[i] = 18 + 16 * pool.depth[i]!;
    pool.alpha[i] = 0.92;
    pool.vy[i] = 0;
    pool.rotV[i] = 0;
    pool.life[i] = rand() * REST_LIFE * 0.5;
    pool.maxLife[i] = REST_LIFE;
  };

  private readonly initMote: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = MOTE;
    pool.size[i] = range(rand, 4, 9);
    pool.vx[i] = range(rand, 4, 16);
    pool.vy[i] = range(rand, -6, 6);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.2, 0.6);
    pool.depth[i] = rand();
  };

  private readonly initSpark: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const speed = range(rand, 40, 110);
    pool.kind[i] = SPARK;
    pool.x[i] = this.sparkX;
    pool.y[i] = this.sparkY;
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed;
    pool.size[i] = range(rand, 8, 14);
    pool.maxLife[i] = range(rand, 0.6, 0.9);
    pool.alpha[i] = 0;
  };

  private sync(input: EffectInput): void {
    this.budget.frame(input.budget);
    this.palette.sync(input, autumnPalette);
    const v = input.params.variant ?? '';
    this.turkey = v === 'turkey' || (v !== 'noturkey' && input.theme.id === 'harvest' && !input.params.palette);
    this.groundY = input.h - 3;
  }

  private turkeySize(input: EffectInput): number {
    return Math.round(clamp(input.h * 0.18, 64, 120));
  }

  private countRest(): number {
    const pool = this.pool;
    let n = 0;
    for (let i = 0; i < pool.count; i++) if (isResting(pool.kind[i]!)) n++;
    return n;
  }

  step(input: EffectInput): void {
    const { w, h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      this.turkeyX = w * 0.62;
      spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.4), rand, this.initLeaf);
      spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.12), rand, this.initRest);
    }
    const k = calm(input.intensity);
    this.fall.spawn(pool, 'top', w, h, steadyRate(input.budget * 0.6, h / 45, 0.8) * k, dt, rand, this.initLeaf, this.budget.take(99, 8));
    this.motes.spawn(pool, 'left', w, h, 0.6 * k, dt, rand, this.initMote, this.budget.take(1, 4));
    if (this.turkey) this.stepTurkey(input);
    this.gust *= Math.max(0, 1 - 1.1 * dt);
    const wind = breeze(t) + this.gust;
    const restCap = Math.floor(input.budget * 0.28);
    let rest = this.countRest();
    const hdrag = 1.1;
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (isFalling(kind)) {
        const depth = pool.depth[i]!;
        gravity(pool, i, dt, 70, 26 + 44 * depth);
        pool.vx[i]! *= Math.max(0, 1 - hdrag * dt);
        flutter(pool, i, dt, pool.size[i]! * 0.7, pool.aux[i]!);
        pool.x[i]! += wind * (0.35 + 0.85 * depth) * dt;
        pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        const x = pool.x[i]!;
        if (x < -40) pool.x[i] = x + w + 80;
        else if (x > w + 40) pool.x[i] = x - w - 80;
        const ground = this.groundY - 20 * ((pool.phase[i]! * 7.3) % 1 + 1) * 0.5;
        if (pool.y[i]! >= ground && pool.vy[i]! > 0 && depth > 0.35 && rest < restCap) {
          pool.kind[i] = REST + kind;
          pool.y[i] = ground;
          pool.vx[i] = 0;
          pool.vy[i] = 0;
          pool.life[i] = 0;
          pool.maxLife[i] = REST_LIFE;
          rest++;
        } else if (pool.y[i]! > h + pool.size[i]!) {
          pool.kill(i);
        }
      } else if (isResting(kind)) {
        pool.life[i]! += dt;
        pool.alpha[i] = 0.92 * envelope(pool, i, 0, 3);
        if (expired(pool, i)) {
          pool.kill(i);
          rest--;
        }
      } else if (kind === MOTE) {
        pool.vx[i]! += (wind * 0.4 - pool.vx[i]!) * 0.5 * dt;
        integrate(pool, i, dt);
        pool.y[i]! += Math.sin(pool.life[i]! * 0.7 + pool.phase[i]!) * 6 * dt;
        twinkle(pool, i, pool.aux[i]!, 0.6, 0.55);
        if (pool.x[i]! > w + 20 || pool.x[i]! < -30) pool.kill(i);
      } else {
        drag(pool, i, dt, 2.5);
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.15, 0.4);
        if (expired(pool, i)) pool.kill(i);
      }
    }
  }

  private stepTurkey(input: EffectInput): void {
    const { w, dt, rand } = input;
    const s = this.turkeySize(input);
    if (this.turkeyHop > 0 || this.turkeyVy < 0) {
      this.turkeyVy += 900 * dt;
      this.turkeyHop = Math.max(0, this.turkeyHop - this.turkeyVy * dt);
      if (this.turkeyHop === 0) this.turkeyVy = 0;
    }
    if (this.turkeyPause > 0) {
      this.turkeyPause -= dt;
      return;
    }
    this.turkeyNextPause -= dt;
    if (this.turkeyNextPause <= 0) {
      this.turkeyPause = range(rand, 1.2, 2.4);
      this.turkeyNextPause = range(rand, 4, 8);
    }
    this.turkeyStep += dt * 2.2 * TAU;
    this.turkeyX += this.turkeyDir * 42 * dt;
    const margin = s * 0.6;
    if (this.turkeyX > w - margin) {
      this.turkeyX = w - margin;
      this.turkeyDir = -1;
    } else if (this.turkeyX < margin) {
      this.turkeyX = margin;
      this.turkeyDir = 1;
    }
  }

  tap(x: number, y: number, input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (this.turkey) {
      const s = this.turkeySize(input);
      if (Math.abs(x - this.turkeyX) < s * 0.6 && y > h - s * 1.2 && this.turkeyHop === 0) {
        this.turkeyVy = -330;
        this.turkeyHop = 0.01;
        this.turkeyPause = 0;
      }
    }
    this.gust = clamp(this.gust + (x < w / 2 ? 140 : -140), -260, 260);
    const R = clamp(Math.min(w, h) * 0.4, 140, 260);
    let nearest = -1;
    let best = 80;
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind >= MOTE) continue;
      const dx = pool.x[i]! - x;
      const dy = pool.y[i]! - y;
      const d = Math.hypot(dx, dy);
      if (d >= R) continue;
      const f = (1 - d / R) * (1 - d / R);
      const ux = d > 0.5 ? dx / d : 0;
      const uy = d > 0.5 ? dy / d : -1;
      if (d < best) {
        best = d;
        nearest = i;
      }
      if (isResting(kind)) {
        pool.kind[i] = kind - REST;
        pool.maxLife[i] = 0;
        pool.life[i] = 0;
        pool.alpha[i] = 0.55 + 0.45 * pool.depth[i]!;
        pool.rotV[i] = range(rand, -4, 4);
        pool.vx[i] = ux * 260 * f + range(rand, -40, 40);
        pool.vy[i] = -range(rand, 220, 420) * (0.4 + 0.6 * f);
        continue;
      }
      // Outward push plus a swirl (counter-clockwise tangent) and a little lift.
      pool.vx[i]! += (ux * 380 - uy * 240) * f;
      pool.vy[i]! += (uy * 380 + ux * 240) * f - 120 * f;
      pool.rotV[i]! += (rand() < 0.5 ? -3 : 3) * f;
    }
    if (nearest >= 0) {
      const n = Math.max(1, this.palette.colors.length);
      pool.color[nearest] = (pool.color[nearest]! + 1 + Math.floor(rand() * (n - 1))) % n;
      this.recolored++;
      this.sparkX = pool.x[nearest]!;
      this.sparkY = pool.y[nearest]!;
      spawnEdge(pool, 'point', w, h, this.budget.take(8), rand, this.initSpark, this.sparkX, this.sparkY);
    }
  }

  still(input: EffectInput): void {
    const { h, rand } = input;
    const w = Math.max(1, input.w);
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.started = true;
    this.turkeyX = w * 0.7;
    this.turkeyHop = 0;
    this.turkeyVy = 0;
    const pile = this.budget.take(input.budget * 0.38);
    for (let n = 0; n < pile; n++) {
      // Two heaps: x is the mean of two uniforms around a heap center, so leaves bunch into mounds.
      const cx = n % 3 === 0 ? 0.28 : 0.66;
      const x = w * clamp(cx + (rand() + rand() - 1) * 0.3, 0, 1);
      spawnEdge(pool, 'point', w, h, 1, rand, this.initRest, x, 0);
      const i = pool.count - 1;
      const heap = 1 - Math.min(1, Math.abs(x / w - cx) / 0.3);
      pool.y[i] = this.groundY - (48 * heap + 8) * rand();
      pool.life[i] = 0;
    }
    spawnEdge(pool, 'area', w, h * 0.85, this.budget.take(input.budget * 0.22), rand, this.initLeaf);
    spawnEdge(pool, 'area', w, h * 0.7, this.budget.take(6), rand, this.initMote);
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const pal = this.palette;
    const night = input.theme.mood === 'night';
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== MOTE) continue;
      ctx.globalAlpha = pool.alpha[i]! * (night ? 0.6 : 0.35);
      sprites.draw(ctx, 'glow', pool.size[i]!, input.theme.glow, pool.x[i]!, pool.y[i]!);
    }
    ctx.globalCompositeOperation = 'source-over';
    this.drawLeaves(ctx, 0, 0.5);
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (!isResting(kind)) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, SHAPES[kind - REST]!, pool.size[i]!, pal.color(pool.color[i]!), pool.x[i]!, pool.y[i]!, pool.rot[i]!, 1, 0.7);
    }
    if (this.turkey) this.drawTurkey(ctx, input);
    this.drawLeaves(ctx, 0.5, 1.01);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== SPARK) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'glow', pool.size[i]!, '#ffe9a3', pool.x[i]!, pool.y[i]!);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  private drawLeaves(ctx: CanvasRenderingContext2D, d0: number, d1: number): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (!isFalling(kind)) continue;
      const depth = pool.depth[i]!;
      if (depth < d0 || depth >= d1) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      const flip = 0.2 + 0.8 * Math.abs(Math.cos(pool.phase[i]!));
      this.sprites.draw(ctx, SHAPES[kind]!, pool.size[i]!, this.palette.color(pool.color[i]!), pool.x[i]!, pool.y[i]!, pool.rot[i]!, flip, 1);
    }
  }

  private drawTurkey(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const s = this.turkeySize(input);
    const walking = this.turkeyPause <= 0;
    const bob = walking ? Math.abs(Math.sin(this.turkeyStep)) * s * 0.05 : 0;
    const peck = walking ? 0 : Math.max(0, Math.sin(input.t * 5)) * 0.25;
    const tilt = (walking ? Math.sin(this.turkeyStep) * 0.06 : peck) * this.turkeyDir;
    const y = input.h - s * 0.36 - bob - this.turkeyHop;
    ctx.globalAlpha = 0.25;
    this.sprites.draw(ctx, 'circle', s * 0.8, '#000000', this.turkeyX, input.h - 4, 0, 1, 0.16);
    ctx.globalAlpha = 1;
    this.sprites.draw(ctx, 'turkey', s, TURKEY_COLOR, this.turkeyX, y, tilt, this.turkeyDir, 1);
  }
}

export const leaves: EffectFactory = (sprites) => new LeavesEffect(sprites);
