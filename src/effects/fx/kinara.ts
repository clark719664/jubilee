/**
 * kinara — Kwanzaa, seven nights and seven principles.
 * Ambient: a kente-cloth band slides slowly along the top edge; a cardboard-craft kinara holds seven
 *   candles — three red on the left, the black candle in the middle, three green on the right — and
 *   tonight's `candles` are lit in the traditional order: the black candle first, then red and green
 *   alternating outward. Each flame flickers and glows; ears of corn (muhindi) drift down turning
 *   slowly; a few gold stars twinkle.
 * Behaviors: flame (flicker), gravity + sway + spin (corn), twinkle (stars), drag + envelope (sparkles).
 * Tap: a burst of red, green and gold sparkles from the finger.
 * Still: the kinara with tonight's candles lit, corn resting mid-air, the kente band still.
 * Scene mode (`params.stage`): the scene draws its own kinara, so there is none here; with `stage.wicks`
 *   (7 points left to right) tonight's flames burn on the art's wicks, lit in LIGHTING_ORDER. The scene has
 *   its own cloth, so the kente band goes too; the corn and the stars (above the scene's sky line) stay.
 * Params: candles (0–7 lit; default 7), stage, density.
 */
import { KINARA_CUPS, corn, frameKeeping, kente, kinaraBody, kinaraCandle, quantize, sparkle } from '../painters/extra-night';
import {
  TAU, clamp, drag, envelope, expired, flame, gravity, integrate, range, spawnEdge, sway, twinkle, type ParticleInit,
} from '../particles';
import { LIGHTING_ORDER, kinaraLit } from '../kinara-order';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { PooledEffect, WICK_FLAME_UNITS, calm, drawWickFlames } from './shared';

export { LIGHTING_ORDER, kinaraLit } from '../kinara-order';

export const CANDLE = 0;
/** Scene mode: a flame on one of the scene's own wicks (aux = its index in `stage.wicks`, 0 = leftmost). */
export const WICK = 1;
const SCENERY_END = 2;
export const CORN = 2;
export const STAR = 3;
export const SPARK = 4;

/** Scene mode: the `stage.wicks` indices (left to right) that burn on a night with `n` candles, in lighting order. */
export function kinaraWicks(n: number): readonly number[] {
  const k = Math.min(7, Math.max(0, Math.round(Number.isFinite(n) ? n : 7)));
  return LIGHTING_ORDER.slice(0, k);
}

/** Candle colors left to right: red ×3, black, green ×3. */
export const KINARA_COLORS = ['#d62828', '#d62828', '#d62828', '#1b1b1b', '#1f8a4c', '#1f8a4c', '#1f8a4c'] as const;


const WOOD = '#8a4b22';
const FLAME = '#ffb703';
const CORN_COLOR = '#ffcf3f';
const SPARK_COLORS = ['#e63946', '#2ec27e', '#ffd166'] as const;

export class KinaraEffect extends PooledEffect {
  readonly describe = 'A kinara glowing with candles under a kente-cloth band';

  private started = false;
  private candles = 7;
  private cx = 0;
  private cy = 0;
  private size = 400;
  private tile = 32;
  private bandShift = 0;
  /** Scene mode: wick flame height, px. */
  private flameSize = 10;
  /** Stars are scattered over the top `starK` of the sky (plus 50 px), or down to the scene's sky line. */
  private starK = 0.65;
  private starTop = 50;

  constructor(sprites: SpriteCache) {
    super(sprites, 512);
    if (!sprites.has('kinara:body')) sprites.register('kinara:body', kinaraBody);
    if (!sprites.has('kinara:candle')) sprites.register('kinara:candle', kinaraCandle);
    if (!sprites.has('kinara:kente')) sprites.register('kinara:kente', kente);
    if (!sprites.has('kinara:corn')) sprites.register('kinara:corn', corn);
    if (!sprites.has('kinara:sparkle')) sprites.register('kinara:sparkle', sparkle);
  }

  private readonly initCandle: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = CANDLE;
    pool.aux[i] = pool.x[i]!;
    pool.phase[i] = rand() * TAU;
    pool.color[i] = pool.aux[i]!;
    pool.alpha[i] = 1;
  };

  private readonly initWick: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = WICK;
    pool.aux[i] = pool.x[i]!;
    pool.phase[i] = rand() * TAU;
    pool.alpha[i] = 1;
  };

  private readonly initCorn: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = CORN;
    pool.depth[i] = range(rand, 0.4, 1);
    pool.size[i] = quantize(24 + 22 * pool.depth[i]!, 4);
    pool.aux[i] = 14 + 22 * pool.depth[i]!;
    pool.vy[i] = pool.aux[i]!;
    pool.phase[i] = rand() * TAU;
    pool.rot[i] = range(rand, -1, 1);
    pool.rotV[i] = range(rand, -0.5, 0.5);
    pool.alpha[i] = 0.7 + 0.3 * pool.depth[i]!;
  };

  private readonly initStar: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = STAR;
    pool.y[i] = pool.y[i]! * this.starK + this.starTop;
    pool.size[i] = range(rand, 1.6, 3.2);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.2, 0.7);
    pool.depth[i] = rand();
  };

  private readonly initSpark: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const v = range(rand, 60, 230);
    pool.kind[i] = SPARK;
    pool.vx[i] = Math.cos(a) * v;
    pool.vy[i] = Math.sin(a) * v - 30;
    pool.size[i] = range(rand, 10, 18);
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -3, 3);
    pool.maxLife[i] = range(rand, 0.9, 1.4);
    pool.color[i] = Math.floor(rand() * 3) % 3;
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
    const n = clamp(Math.round(input.params.candles ?? 7), 0, 7);
    const candles = Number.isFinite(n) ? n : 7;
    const relight = candles !== this.candles || scene.changed;
    this.candles = candles;
    this.flameSize = quantize(scene.len(WICK_FLAME_UNITS), 2);
    // Below the kente band; in scene mode no lower than the picture's sky line.
    this.starTop = scene.on ? 0 : this.tile * 1.5;
    this.starK = input.h > 0 ? Math.max(0, (scene.on ? scene.sky * 0.95 : input.h * 0.65 + 50) - this.starTop) / input.h : 0.65;
    if (relight && this.started) this.placeWicks(input);
    this.layout(input);
  }

  /** Scene mode: tonight's flames on the art's own wicks, in lighting order (none outside scene mode). */
  private placeWicks(input: EffectInput): void {
    const pool = this.pool;
    for (let i = pool.count - 1; i >= 0; i--) if (pool.kind[i] === WICK) pool.kill(i);
    const wicks = this.scene.on ? this.scene.stage.wicks : undefined;
    if (!wicks) return;
    for (const k of kinaraWicks(this.candles)) {
      if (wicks[k]) spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initWick, k, 0);
    }
  }

  private layout(input: EffectInput): void {
    const { w, h } = input;
    const narrow = w < 720;
    this.tile = quantize(clamp(h * 0.055, 22, 40), 2);
    this.size = quantize(narrow ? Math.min(w * 0.92, h * 0.5) : Math.min(w * 0.46, h * 0.78, 620), 16);
    this.cx = narrow ? w * 0.5 : w * 0.68;
    // Phones keep the kinara in the upper half, clear of the countdown text.
    this.cy = (narrow ? h * 0.5 : h * 0.8) - this.size * 0.24;
    const S = this.size;
    const ch = this.candleHeight();
    const pool = this.pool;
    const wicks = this.scene.stage.wicks;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] === WICK) {
        const tip = wicks?.[pool.aux[i]!];
        if (!tip) continue;
        pool.x[i] = this.scene.x(tip[0]);
        pool.y[i] = this.scene.y(tip[1]);
        pool.size[i] = this.flameSize;
        continue;
      }
      if (pool.kind[i] !== CANDLE) continue;
      const cup = KINARA_CUPS[pool.aux[i]!]!;
      pool.size[i] = ch;
      pool.x[i] = this.cx + cup[0] * S;
      pool.y[i] = this.cy + cup[1] * S - ch / 2 + 1;
      pool.depth[i] = kinaraLit(pool.aux[i]!, this.candles) ? 1 : 0;
    }
  }

  private candleHeight(): number {
    return quantize(this.size * 0.15, 2);
  }

  private build(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    if (this.scene.on) this.placeWicks(input);
    else for (let s = 0; s < 7; s++) spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initCandle, s, 0);
    this.layout(input);
    spawnEdge(pool, 'area', w, h, this.budget.take(clamp(input.budget * 0.08, 8, 26)), rand, this.initStar);
    spawnEdge(pool, 'area', w, h, this.budget.take(clamp(input.budget * 0.04, 5, 12)), rand, this.initCorn);
  }

  step(input: EffectInput): void {
    const { w, h, dt, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      this.build(input);
    }
    const k = calm(input.intensity);
    this.bandShift = (this.bandShift + 7 * k * dt) % this.tile;
    const cornRate = clamp(input.budget * 0.04, 5, 12) / ((h + 60) / 28);
    if (rand() < cornRate * k * dt) spawnEdge(pool, 'top', w, h, this.budget.take(1, 20), rand, this.initCorn);
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === CANDLE || kind === WICK) {
        flame(pool, i, dt, 0.45, rand);
      } else if (kind === CORN) {
        gravity(pool, i, dt, 30, pool.aux[i]!);
        sway(pool, i, dt, 14, 0.18);
        pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        if (pool.y[i]! > h + 40) pool.kill(i);
      } else if (kind === STAR) {
        pool.life[i]! += dt;
        twinkle(pool, i, pool.aux[i]!, 0.6, 0.35 + 0.5 * pool.depth[i]!);
      } else if (kind === SPARK) {
        drag(pool, i, dt, 2);
        pool.vy[i]! += 60 * dt;
        pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.15, 0.6);
        if (expired(pool, i)) pool.kill(i);
      }
    }
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    if (!this.started) this.step(input);
    spawnEdge(this.pool, 'point', input.w, input.h, this.budget.take(clamp(input.budget * 0.08, 12, 24), 2), input.rand, this.initSpark, x, y);
  }

  still(input: EffectInput): void {
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.started = true;
    this.bandShift = 0;
    this.build(input);
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] === CANDLE || pool.kind[i] === WICK) pool.alpha[i] = 0.92;
      else if (pool.kind[i] === STAR) pool.alpha[i] = 0.35 + 0.45 * pool.depth[i]!;
      else if (pool.kind[i] === CORN) pool.y[i] = Math.max(pool.y[i]!, this.tile * 2.4);
    }
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const n = pool.count;
    const S = this.size;
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== STAR) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'circle', pool.size[i]!, '#ffe9a3', pool.x[i]!, pool.y[i]!);
    }
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== CORN) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'kinara:corn', pool.size[i]!, CORN_COLOR, pool.x[i]!, pool.y[i]!, pool.rot[i]!);
    }
    // Kente band: whole tiles from just off the left edge, shifted slowly (the scene has its own cloth).
    const T = this.tile;
    ctx.globalAlpha = 1;
    if (!this.scene.on) {
      for (let x = -T + this.bandShift; x < input.w + T; x += T) {
        sprites.draw(ctx, 'kinara:kente', T, '#ffd166', x + T / 2, T / 2);
      }
    }
    const fs = quantize(S * 0.075, 2);
    if (this.scene.on) {
      // Scene mode: the scene draws the kinara; tonight's flames burn on its wicks.
      drawWickFlames(ctx, sprites, pool, WICK, this.flameSize);
    } else {
      let lit = 0;
      for (let i = 0; i < n; i++) if (pool.kind[i] === CANDLE && pool.depth[i]! > 0) lit++;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.04 + 0.03 * lit;
      sprites.draw(ctx, 'glow', S * 1.4, '#ffb703', this.cx, this.cy - S * 0.15);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const P = Math.min(S, 384);
      for (let i = 0; i < n; i++) {
        if (pool.kind[i] !== CANDLE) continue;
        sprites.draw(ctx, 'kinara:candle', pool.size[i]!, KINARA_COLORS[pool.color[i]! % 7]!, pool.x[i]!, pool.y[i]!);
      }
      sprites.draw(ctx, 'kinara:body', P, WOOD, this.cx, this.cy, 0, S / P, S / P);
      for (let i = 0; i < n; i++) {
        if (pool.kind[i] !== CANDLE || pool.depth[i]! === 0) continue;
        const ph = pool.phase[i]!;
        const a = pool.alpha[i]!;
        ctx.globalAlpha = 0.85 + 0.15 * a;
        sprites.draw(ctx, 'flame', fs, FLAME, pool.x[i]! + Math.sin(ph) * 0.8, pool.y[i]! - pool.size[i]! * 0.5 - fs * 0.42, 0.07 * Math.sin(ph * 0.7), 1, 0.9 + 0.14 * a);
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i]!;
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      if (kind === CANDLE && pool.depth[i]! > 0) {
        const fy = y - pool.size[i]! * 0.5 - fs * 0.45;
        ctx.globalAlpha = 0.55 * pool.alpha[i]!;
        sprites.draw(ctx, 'glow', fs * 4.2, FLAME, x, fy);
        ctx.globalAlpha = 0.6 * pool.alpha[i]!;
        sprites.draw(ctx, 'glow', fs * 1.2, '#fff1b8', x, fy);
      } else if (kind === SPARK) {
        const c = SPARK_COLORS[pool.color[i]! % 3]!;
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'kinara:sparkle', quantize(pool.size[i]!, 2), c, x, y, pool.rot[i]!);
        ctx.globalAlpha = pool.alpha[i]! * 0.45;
        sprites.draw(ctx, 'glow', 30, c, x, y);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /** Tests: how many candles are lit right now. */
  litCount(): number {
    let lit = 0;
    for (let i = 0; i < this.pool.count; i++) if (this.pool.kind[i] === CANDLE && this.pool.depth[i]! > 0) lit++;
    return lit;
  }
}

export const kinara: EffectFactory = (sprites) => new KinaraEffect(sprites);
