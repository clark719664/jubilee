/**
 * holi — a cream sky that a child paints by throwing gulal.
 * Ambient: tiny motes of colour powder hang and wander in the air, twinkling softly; every few seconds
 *   a faint wisp of colour drifts up from somewhere low, as if someone just off-screen threw a handful.
 * Behaviours: wander + slow sink + twinkle (motes); radial burst + drag + a gentle settle + scale-up and
 *   fade (puffs and wisps); gravity + drag (flung specks).
 * Tap: throws a gulal puff at the finger — two dozen soft discs of one bright colour (with a second
 *   colour mixed in) bloom outward and grow as they slow, plus a spray of specks. The throw also stamps a
 *   low-alpha splash into a persistent offscreen stain layer, and every disc stamps a faint print where it
 *   fades, so the sky keeps every colour thrown for the whole session (the stain canvas outlives the
 *   effect instance, so leaving the page and coming back keeps the painting).
 * Still: a few static splashes on the stain layer and motes frozen in the air.
 * Params: palette (gulal colours; default magenta, saffron, green, blue, orange, violet, pink), density.
 *   Draws in plain source-over: on a pale sky 'lighter' would bleach colour to white.
 */
import { holiSplash0, holiSplash1, holiSplash2 } from '../painters/extra-day';
import {
  Emitter, TAU, clamp, drag, envelope, expired, gravity, integrate, range, spawnEdge, steadyRate, twinkle, wander,
  type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { Palette, PooledEffect, calm } from './shared';

export const MOTE = 0;
export const PUFF = 1;
export const WISP = 2;
export const SPECK = 3;

export const GULAL: readonly string[] = ['#e6007e', '#ffb000', '#1fb35a', '#1e88e5', '#ff6a00', '#8e3fd6', '#ff4fa3'];
const SPLASHES = ['holi:splash0', 'holi:splash1', 'holi:splash2'] as const;
/** Discrete stamp sizes keep the sprite cache small. */
const STAMP_SIZES = [48, 72, 96, 144, 192] as const;
const PUFF_SPRITE = 96;
/** Pending stamps between a step and the next draw (ring; the oldest is overwritten). */
const STAMP_RING = 160;
/** Stain canvas resolution relative to CSS px: stains are soft, half resolution is plenty. */
const STAIN_RES = 0.5;

/** Session-wide stain layer: survives effect instances (navigation) for the life of the page. */
interface Stain {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
}
let sessionStain: Stain | null = null;
/** Stamps ever painted this session (0 → the sky is still clean). */
let sessionStamps = 0;

function stampSize(px: number): number {
  for (const s of STAMP_SIZES) if (px <= s) return s;
  return STAMP_SIZES[STAMP_SIZES.length - 1]!;
}

export class HoliEffect extends PooledEffect {
  readonly describe = 'Puffs of bright colour powder in the air';
  /** Throws so far (tests). */
  throws = 0;
  /** Stamps queued so far (tests). */
  stamped = 0;

  private readonly palette = new Palette();
  private readonly motes = new Emitter();
  private started = false;
  private nextWisp = 0;
  // Pending stamps: x, y, size, colour index, splash shape (0–2) or 3 = soft disc, alpha.
  private readonly ring = new Float32Array(STAMP_RING * 6);
  private ringHead = 0;
  private ringCount = 0;
  // Burst parameters, read by the inits.
  private c1 = 0;
  private c2 = 1;
  private burstScale = 1;

  constructor(sprites: SpriteCache) {
    super(sprites);
    const painters = [holiSplash0, holiSplash1, holiSplash2];
    for (let k = 0; k < SPLASHES.length; k++) if (!sprites.has(SPLASHES[k]!)) sprites.register(SPLASHES[k]!, painters[k]!);
  }

  private readonly initMote: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = MOTE;
    pool.depth[i] = rand();
    pool.size[i] = 3 + 6 * pool.depth[i]! * rand();
    pool.vx[i] = range(rand, -8, 8);
    pool.vy[i] = range(rand, -10, 4);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.2, 0.6);
    pool.color[i] = this.palette.pick(rand);
  };

  private readonly initPuff: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const speed = range(rand, 40, 250) * this.burstScale;
    pool.kind[i] = PUFF;
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed * 0.8 - 40;
    pool.aux[i] = range(rand, 0.55, 1.25) * this.burstScale;
    pool.size[i] = PUFF_SPRITE;
    pool.maxLife[i] = range(rand, 1.4, 2.4);
    pool.alpha[i] = 0;
    pool.color[i] = rand() < 0.7 ? this.c1 : this.c2;
  };

  private readonly initWisp: ParticleInit = (pool, i, rand) => {
    const a = -Math.PI / 2 + range(rand, -1, 1);
    const speed = range(rand, 20, 70);
    pool.kind[i] = WISP;
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed;
    pool.aux[i] = range(rand, 0.6, 1.3);
    pool.size[i] = PUFF_SPRITE;
    pool.maxLife[i] = range(rand, 2.5, 3.5);
    pool.alpha[i] = 0;
    pool.color[i] = rand() < 0.75 ? this.c1 : this.c2;
  };

  private readonly initSpeck: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const speed = range(rand, 150, 420);
    pool.kind[i] = SPECK;
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed - 80;
    pool.size[i] = range(rand, 2.5, 5);
    pool.maxLife[i] = range(rand, 0.8, 1.4);
    pool.color[i] = rand() < 0.6 ? this.c1 : this.c2;
  };

  private sync(input: EffectInput): void {
    this.budget.frame(input.budget);
    this.palette.sync(input, () => GULAL);
  }

  private queueStamp(x: number, y: number, size: number, color: number, shape: number, alpha: number): void {
    const slot = ((this.ringHead + this.ringCount) % STAMP_RING) * 6;
    if (this.ringCount < STAMP_RING) this.ringCount++;
    else this.ringHead = (this.ringHead + 1) % STAMP_RING;
    const r = this.ring;
    r[slot] = x;
    r[slot + 1] = y;
    r[slot + 2] = stampSize(size);
    r[slot + 3] = color;
    r[slot + 4] = shape;
    r[slot + 5] = alpha;
    this.stamped++;
  }

  private pickPair(rand: () => number): void {
    const n = Math.max(1, this.palette.colors.length);
    this.c1 = this.throws % n;
    this.c2 = (this.c1 + 1 + Math.floor(rand() * (n - 1))) % n;
  }

  /** A handful of settled splashes, for the first frame of a clean session and for still(). */
  private seedSplashes(input: EffectInput, count: number, alpha: number): void {
    const { w, h, rand } = input;
    for (let k = 0; k < count; k++) {
      const x = w * (0.12 + 0.76 * ((k + range(rand, 0.1, 0.9)) / count));
      const y = h * range(rand, 0.15, 0.6);
      this.queueStamp(x, y, range(rand, 120, 200), this.palette.pick(rand), k % 3, alpha);
    }
  }

  step(input: EffectInput): void {
    const { w, h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      this.nextWisp = t + 0.8;
      if (sessionStamps === 0 && this.stamped === 0) this.seedSplashes(input, 3, 0.1);
      spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.4), rand, this.initMote);
    }
    const k = calm(input.intensity);
    this.motes.spawn(pool, 'bottom', w, h, steadyRate(input.budget * 0.45, h / 12, 0.6) * k, dt, rand, this.initMote, this.budget.take(99, 30));
    if (t >= this.nextWisp) {
      this.nextWisp = t + range(rand, 2.5, 4.5) / k;
      this.pickPair(rand);
      this.throws++;
      spawnEdge(pool, 'point', w, h, this.budget.take(7), rand, this.initWisp, range(rand, 0.05, 0.95) * w, h * range(rand, 0.75, 1));
    }
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === MOTE) {
        wander(pool, i, dt, 14, rand);
        drag(pool, i, dt, 0.4);
        pool.vy[i]! -= 2 * dt;
        integrate(pool, i, dt);
        twinkle(pool, i, pool.aux[i]!, 0.45, 0.55 + 0.35 * pool.depth[i]!);
        const x = pool.x[i]!;
        if (x < -10) pool.x[i] = x + w + 20;
        else if (x > w + 10) pool.x[i] = x - w - 20;
        if (pool.y[i]! < -12 || pool.y[i]! > h + 12) pool.kill(i);
      } else if (kind === PUFF || kind === WISP) {
        drag(pool, i, dt, kind === PUFF ? 2.6 : 0.8);
        gravity(pool, i, dt, kind === PUFF ? 22 : -6);
        integrate(pool, i, dt);
        pool.alpha[i] = (kind === PUFF ? 0.62 : 0.24) * envelope(pool, i, 0.12, kind === PUFF ? 1 : 1.6);
        if (expired(pool, i)) {
          if (kind === PUFF) this.queueStamp(pool.x[i]!, pool.y[i]!, PUFF_SPRITE * this.puffScale(i) * 1.1, pool.color[i]!, 3, 0.1);
          pool.kill(i);
        }
      } else {
        gravity(pool, i, dt, 260);
        drag(pool, i, dt, 1.2);
        integrate(pool, i, dt);
        pool.alpha[i] = 0.9 * envelope(pool, i, 0, 0.5);
        if (expired(pool, i)) pool.kill(i);
      }
    }
  }

  /** Puffs grow as they slow: a quarter of their size at birth, full size by the end. */
  private puffScale(i: number): number {
    const pool = this.pool;
    const u = clamp(pool.life[i]! / Math.max(0.01, pool.maxLife[i]!), 0, 1);
    return pool.aux[i]! * (0.3 + 0.9 * (1 - (1 - u) * (1 - u)));
  }

  tap(x: number, y: number, input: EffectInput): void {
    const { w, h, rand } = input;
    this.sync(input);
    this.pickPair(rand);
    this.throws++;
    this.burstScale = clamp(Math.min(w, h) / 600, 0.6, 1.2);
    spawnEdge(this.pool, 'point', w, h, this.budget.take(24), rand, this.initPuff, x, y);
    spawnEdge(this.pool, 'point', w, h, this.budget.take(18), rand, this.initSpeck, x, y);
    this.queueStamp(x, y, range(rand, 150, 200) * this.burstScale, this.c1, this.throws % 3, 0.34);
    this.queueStamp(x + range(rand, -40, 40), y + range(rand, -30, 30), 96, this.c2, (this.throws + 1) % 3, 0.24);
  }

  still(input: EffectInput): void {
    const { w, h, rand } = input;
    this.pool.clear();
    this.sync(input);
    this.started = true;
    if (sessionStamps === 0 && this.ringCount === 0) this.seedSplashes(input, 5, 0.3);
    spawnEdge(this.pool, 'area', w, h, this.budget.take(input.budget * 0.45), rand, this.initMote);
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) twinkle(pool, i, pool.aux[i]!, 0.45, 0.55 + 0.35 * pool.depth[i]!);
  }

  /** Paints pending stamps into the session stain canvas (created or resized here; never per frame). */
  private flushStamps(input: EffectInput): void {
    if (typeof document === 'undefined' || input.w <= 0 || input.h <= 0) {
      this.ringCount = 0;
      return;
    }
    let stain = sessionStain;
    if (!stain || stain.w !== input.w || stain.h !== input.h) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(input.w * STAIN_RES));
      canvas.height = Math.max(1, Math.round(input.h * STAIN_RES));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        this.ringCount = 0;
        return;
      }
      if (stain) ctx.drawImage(stain.canvas, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(STAIN_RES, 0, 0, STAIN_RES, 0, 0);
      stain = { canvas, ctx, w: input.w, h: input.h };
      sessionStain = stain;
    }
    const sctx = stain.ctx;
    const r = this.ring;
    for (let n = 0; n < this.ringCount; n++) {
      const slot = ((this.ringHead + n) % STAMP_RING) * 6;
      const shape = r[slot + 4]!;
      sctx.globalAlpha = r[slot + 5]!;
      const name = shape >= 3 ? 'glow' : SPLASHES[shape | 0]!;
      // Unrotated, unscaled draws only: they work under the stain canvas's own transform.
      this.sprites.draw(sctx, name, r[slot + 2]!, this.palette.color(r[slot + 3]!), r[slot]!, r[slot + 1]!);
    }
    sctx.globalAlpha = 1;
    sessionStamps += this.ringCount;
    this.ringHead = 0;
    this.ringCount = 0;
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const pal = this.palette;
    if (this.ringCount > 0) this.flushStamps(input);
    if (sessionStain && sessionStamps > 0) {
      ctx.globalAlpha = 1;
      ctx.drawImage(sessionStain.canvas, 0, 0, input.w, input.h);
    }
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind !== PUFF && kind !== WISP) continue;
      const s = this.puffScale(i);
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'glow', PUFF_SPRITE, pal.color(pool.color[i]!), pool.x[i]!, pool.y[i]!, 0, s, s);
    }
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind !== MOTE && kind !== SPECK) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'circle', pool.size[i]!, pal.color(pool.color[i]!), pool.x[i]!, pool.y[i]!);
    }
    ctx.globalAlpha = 1;
  }
}

export const holi: EffectFactory = (sprites) => new HoliEffect(sprites);

/** Tests: forget the session stain (a fresh page). */
export function resetHoliSession(): void {
  sessionStain = null;
  sessionStamps = 0;
}
