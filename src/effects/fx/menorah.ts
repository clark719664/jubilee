/**
 * menorah — Hanukkah, eight nights of light.
 * Ambient: a golden nine-branch menorah (painted on the canvas) with tonight's candles set from the right,
 *   as they are placed, plus the raised shamash; every flame flickers on its own and glows; dreidels
 *   drift across the sky, bobbing and turning slowly (their four faces נ ג ה ש come round as they turn);
 *   chocolate gelt in gold and silver foil flutters slowly down; stars twinkle.
 * Behaviors: flame (flicker), drift + bob + wrap + spin with exponential spin-down (dreidels), flutter +
 *   gravity (gelt), twinkle (stars), drag + envelope (sparkles), rise + envelope (letters).
 * Tap: tap a dreidel and it spins fast, slows, wobbles and settles on a letter, which pops up above it
 *   (`lastLetter` holds it so the UI can toast its meaning — see DREIDEL_MEANINGS). Tapping the sky
 *   instead tosses a little shower of gelt and gold sparkles.
 * Still: tonight's candles lit, dreidels resting in the air showing their letters, gelt caught mid-fall.
 * Scene mode (`params.stage`): the scene draws its own menorah, so there is no menorah here; with
 *   `stage.wicks` (9 points: the shamash, then the 8 candles left to right) tonight's flames burn on the
 *   art's wicks, in the same order — the candles nearest the right end, newest lit first, plus the shamash
 *   whenever any candle is lit. Dreidels drift in the scene's sky, stars stay above its sky line.
 * Params: candles (0–8 lit tonight, plus the shamash; default 8), stage, density.
 */
import { DREIDEL_LETTERS, MENORAH_CUPS, dreidelFace, frameKeeping, menorahBody, menorahCandle, quantize, sparkle } from '../painters/extra-night';
import {
  TAU, clamp, drag, envelope, expired, flame, flutter, gravity, integrate, range, spawnEdge, twinkle, type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { PooledEffect, WICK_FLAME_UNITS, calm, drawWickFlames } from './shared';

export const CANDLE = 0;
export const DREIDEL = 1;
/** Scene mode: a flame on one of the scene's own wicks (aux = its index in `stage.wicks`). */
export const WICK = 2;
const SCENERY_END = 3;
export const GELT = 3;
export const STAR = 4;
export const SPARK = 5;
export const LETTER = 6;

export { DREIDEL_LETTERS };
/** What each dreidel letter means in the game, and the miracle the four letters spell. */
export const DREIDEL_MEANINGS: Readonly<Record<string, string>> = {
  'נ': 'Nun: nothing happens, next player!',
  'ג': 'Gimel: you win the whole pot!',
  'ה': 'Hei: you win half the pot.',
  'ש': 'Shin: put one in the pot.',
};

/** Branch indices (left to right, 4 = shamash) that hold a candle on a night with `n` candles: set from the right. */
export function litBranches(n: number): readonly number[] {
  const arms = [0, 1, 2, 3, 5, 6, 7, 8];
  const k = clamp(Math.round(Number.isFinite(n) ? n : 8), 0, 8);
  return arms.slice(8 - k);
}

/**
 * Scene mode: the `stage.wicks` indices (0 = the shamash, then 1–8 left to right) that burn on a night
 * with `n` candles, in lighting order — the shamash, then the newest candle first. None on a night with
 * no candles.
 */
export function menorahWicks(n: number): readonly number[] {
  const branches = litBranches(n);
  return branches.length === 0 ? [] : [0, ...branches.map((b) => (b < 4 ? b + 1 : b))];
}

const BODY = '#ffcf4d';
const CANDLE_COLORS = ['#5b8cff', '#f2f4ff', '#9cc8ff'] as const;
const SHAMASH_COLOR = '#fff1c4';
const DREIDEL_COLORS = ['#3d7bff', '#b8c4dc', '#f2b632'] as const;
const GELT_COLORS = ['#ffd166', '#dfe6f5'] as const;
const FLAME = '#ffb703';
const QUARTER = Math.PI / 2;
const SPIN_AMBIENT = 1.2;
const SPIN_SETTLE = 2.2;
const DREIDEL_SPRITES = ['menorah:dreidel0', 'menorah:dreidel1', 'menorah:dreidel2', 'menorah:dreidel3'] as const;
const LETTER_SPRITES = DREIDEL_LETTERS.map((l) => `glyph:${l}`);

export class MenorahEffect extends PooledEffect {
  readonly describe = 'A menorah with candles flickering while dreidels spin and gelt drifts down';
  /** The letter the last tapped dreidel landed on ('' until one lands). */
  lastLetter = '';

  private started = false;
  private candles = 8;
  private cx = 0;
  private cy = 0;
  private size = 400;
  private letterIndex = 0;
  /** Scene mode: wick flame height, px. */
  private flameSize = 10;
  /** Stars are scattered over the top `starK` of the sky. */
  private starK = 0.7;

  constructor(sprites: SpriteCache) {
    super(sprites, 512);
    if (!sprites.has('menorah:body')) sprites.register('menorah:body', menorahBody);
    if (!sprites.has('menorah:candle')) sprites.register('menorah:candle', menorahCandle);
    if (!sprites.has('menorah:sparkle')) sprites.register('menorah:sparkle', sparkle);
    for (let k = 0; k < 4; k++) {
      if (!sprites.has(DREIDEL_SPRITES[k]!)) sprites.register(DREIDEL_SPRITES[k]!, dreidelFace(k));
    }
  }

  private readonly initCandle: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = CANDLE;
    pool.aux[i] = pool.x[i]!;
    pool.phase[i] = rand() * TAU;
    pool.color[i] = pool.aux[i] === 4 ? 255 : Math.floor(rand() * 3) % 3;
    pool.alpha[i] = 1;
  };

  private readonly initWick: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = WICK;
    pool.aux[i] = pool.x[i]!;
    pool.phase[i] = rand() * TAU;
    pool.alpha[i] = 1;
  };

  private readonly initDreidel: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = DREIDEL;
    pool.size[i] = quantize(range(rand, 60, 84), 4);
    pool.vx[i] = range(rand, 9, 18) * (rand() < 0.5 ? -1 : 1);
    pool.depth[i] = pool.y[i]!;
    pool.phase[i] = rand() * TAU;
    pool.rot[i] = 0;
    pool.rotV[i] = SPIN_AMBIENT * range(rand, 0.7, 1.2);
    pool.aux[i] = 0;
    pool.color[i] = Math.floor(rand() * 3) % 3;
    pool.life[i] = rand() * 10;
  };

  private readonly initGelt: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = GELT;
    pool.size[i] = quantize(range(rand, 16, 26), 2);
    pool.aux[i] = range(rand, 22, 38);
    pool.vy[i] = pool.aux[i]!;
    pool.phase[i] = rand() * TAU;
    pool.rot[i] = range(rand, -0.4, 0.4);
    pool.color[i] = rand() < 0.65 ? 0 : 1;
    pool.alpha[i] = range(rand, 0.8, 1);
  };

  private readonly initStar: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = STAR;
    pool.y[i] = pool.y[i]! * this.starK;
    pool.size[i] = range(rand, 1.5, 3);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.2, 0.7);
    pool.depth[i] = rand();
  };

  private readonly initSpark: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const v = range(rand, 50, 190);
    pool.kind[i] = SPARK;
    pool.vx[i] = Math.cos(a) * v;
    pool.vy[i] = Math.sin(a) * v - 40;
    pool.size[i] = range(rand, 8, 14);
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -3, 3);
    pool.maxLife[i] = range(rand, 0.8, 1.3);
    pool.alpha[i] = 0;
  };

  private readonly initLetter: ParticleInit = (pool, i) => {
    pool.kind[i] = LETTER;
    pool.size[i] = 44;
    pool.vy[i] = -16;
    pool.maxLife[i] = 2.6;
    pool.color[i] = this.letterIndex;
    pool.alpha[i] = 0;
  };

  private sync(input: EffectInput): void {
    frameKeeping(this.budget, input.budget, SCENERY_END);
    const scene = this.scene;
    scene.sync(input);
    this.starK = scene.on && input.h > 0 ? (scene.sky * 0.95) / input.h : 0.7;
    this.flameSize = quantize(scene.len(WICK_FLAME_UNITS), 2);
    const n = clamp(Math.round(input.params.candles ?? 8), 0, 8);
    if (n !== this.candles || scene.changed) {
      this.candles = n;
      if (this.started) this.placeCandles(input);
    }
    this.layout(input);
  }

  private layout(input: EffectInput): void {
    const { w, h } = input;
    const narrow = w < 720;
    this.size = quantize(narrow ? Math.min(w * 0.9, h * 0.44) : Math.min(w * 0.44, h * 0.7, 600), 16);
    this.cx = narrow ? w * 0.5 : w * 0.68;
    // Phones keep the menorah in the upper half, clear of the countdown text.
    this.cy = (narrow ? h * 0.52 : h * 0.84) - this.size * 0.38;
    const S = this.size;
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
      const cup = MENORAH_CUPS[pool.aux[i]!]!;
      const ch = this.candleHeight();
      pool.size[i] = ch;
      pool.x[i] = this.cx + cup[0] * S;
      pool.y[i] = this.cy + (cup[1] - 0.012) * S - ch / 2;
    }
  }

  private candleHeight(): number {
    return quantize(this.size * 0.13, 2);
  }

  /** Tonight's candles (set from the right) plus the shamash; in scene mode, their flames on the art's wicks. */
  private placeCandles(input: EffectInput): void {
    const pool = this.pool;
    for (let i = pool.count - 1; i >= 0; i--) if (pool.kind[i] === CANDLE || pool.kind[i] === WICK) pool.kill(i);
    if (this.scene.on) {
      const wicks = this.scene.stage.wicks;
      for (const k of wicks ? menorahWicks(this.candles) : []) {
        if (wicks?.[k]) spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initWick, k, 0);
      }
    } else {
      spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initCandle, 4, 0);
      for (const b of litBranches(this.candles)) {
        spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initCandle, b, 0);
      }
    }
    this.layout(input);
  }

  private build(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    this.placeCandles(input);
    const narrow = w < 720;
    // In scene mode the dreidels keep to the picture's sky.
    const sky = this.scene.on ? this.scene.sky : 0;
    const bands = this.scene.on ? [0.3 * sky, 0.55 * sky, 0.8 * sky] : narrow ? [0.1 * h, 0.2 * h, 0.3 * h] : [0.16 * h, 0.34 * h, 0.52 * h];
    for (let k = 0; k < 3; k++) {
      const x = narrow ? w * (0.2 + 0.3 * k) : w * (0.08 + 0.15 * k);
      spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initDreidel, x, bands[k]!);
    }
    spawnEdge(pool, 'area', w, h, this.budget.take(clamp(input.budget * 0.1, 10, 34)), rand, this.initStar);
    spawnEdge(pool, 'area', w, h, this.budget.take(clamp(input.budget * 0.05, 5, 16)), rand, this.initGelt);
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
    const geltRate = clamp(input.budget * 0.05, 5, 16) / ((h + 40) / 30);
    if (rand() < geltRate * k * dt) spawnEdge(pool, 'top', w, h, this.budget.take(1, 12), rand, this.initGelt);
    const span = w + 160;
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === CANDLE || kind === WICK) {
        flame(pool, i, dt, 0.45, rand);
      } else if (kind === DREIDEL) {
        this.stepDreidel(i, input, span);
      } else if (kind === GELT) {
        gravity(pool, i, dt, 40, pool.aux[i]!);
        flutter(pool, i, dt, 9, 0.5);
        integrate(pool, i, dt);
        if (pool.y[i]! > h + 30) pool.kill(i);
      } else if (kind === STAR) {
        pool.life[i]! += dt;
        twinkle(pool, i, pool.aux[i]!, 0.6, 0.4 + 0.5 * pool.depth[i]!);
      } else if (kind === SPARK) {
        drag(pool, i, dt, 2);
        pool.vy[i]! += 50 * dt;
        pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.15, 0.6);
        if (expired(pool, i)) pool.kill(i);
      } else if (kind === LETTER) {
        drag(pool, i, dt, 1.2);
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.3, 0.8);
        if (expired(pool, i)) pool.kill(i);
      }
    }
  }

  /**
   * Dreidel: drifts and bobs; `phase` is the turn angle (a face every quarter turn), `rotV` the spin rate.
   * A tapped dreidel (rotV > SPIN_SETTLE) spins down exponentially, then eases onto the nearest face,
   * shows its letter and rests (`aux` counts the rest down) before turning lazily again.
   */
  private stepDreidel(i: number, input: EffectInput, span: number): void {
    const pool = this.pool;
    const { dt, w } = input;
    pool.life[i]! += dt;
    const spinning = pool.rotV[i]! > SPIN_SETTLE;
    pool.x[i]! += pool.vx[i]! * dt * (spinning ? 0.3 : 1);
    pool.y[i] = pool.depth[i]! + Math.sin(pool.life[i]! * 0.8) * 10;
    const x = pool.x[i]!;
    if (x < -80) pool.x[i] = x + span;
    else if (x > w + 80) pool.x[i] = x - span;
    if (spinning) {
      pool.phase[i]! += pool.rotV[i]! * dt;
      pool.rotV[i]! *= Math.exp(-0.9 * dt);
      pool.rot[i] = 0.18 * Math.sin(pool.life[i]! * 9) * Math.min(1, 6 / pool.rotV[i]!);
      if (pool.rotV[i]! <= SPIN_SETTLE) this.land(i, input);
      return;
    }
    if (pool.aux[i]! > 0) {
      // Resting on a face: ease the turn onto it, then count the rest down.
      const target = Math.round(pool.phase[i]! / QUARTER) * QUARTER;
      pool.phase[i]! += (target - pool.phase[i]!) * Math.min(1, 6 * dt);
      pool.rot[i]! *= Math.max(0, 1 - 4 * dt);
      pool.aux[i] = Math.max(0, pool.aux[i]! - dt);
      if (pool.aux[i] === 0) pool.rotV[i] = SPIN_AMBIENT;
      return;
    }
    pool.phase[i]! += pool.rotV[i]! * dt;
    pool.rot[i] = 0.08 * Math.sin(pool.life[i]! * 1.3);
  }

  private land(i: number, input: EffectInput): void {
    const pool = this.pool;
    const face = ((Math.round(pool.phase[i]! / QUARTER) % 4) + 4) % 4;
    pool.rotV[i] = 0;
    pool.aux[i] = 3;
    this.letterIndex = face;
    this.lastLetter = DREIDEL_LETTERS[face]!;
    const x = pool.x[i]!;
    const y = pool.y[i]! - pool.size[i]! * 0.95;
    spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initLetter, x, y);
    spawnEdge(pool, 'point', input.w, input.h, this.budget.take(10, 1), input.rand, this.initSpark, x, y);
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    if (!this.started) this.step(input);
    const pool = this.pool;
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== DREIDEL) continue;
      const d = Math.hypot(pool.x[i]! - x, pool.y[i]! - y);
      if (d < pool.size[i]! * 1.1 && d < bestD) {
        best = i;
        bestD = d;
      }
    }
    if (best >= 0) {
      pool.rotV[best] = range(input.rand, 26, 36);
      pool.aux[best] = 0;
      return;
    }
    spawnEdge(pool, 'point', input.w, input.h, this.budget.take(12, 2), input.rand, this.initSpark, x, y);
    const n = spawnEdge(pool, 'point', input.w, input.h, this.budget.take(5, 2), input.rand, this.initGelt, x, y);
    for (let i = pool.count - n; i < pool.count; i++) {
      pool.vy[i] = range(input.rand, -160, -60);
      pool.x[i]! += range(input.rand, -30, 30);
    }
  }

  still(input: EffectInput): void {
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.started = true;
    this.build(input);
    let face = 3;
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind === CANDLE || kind === WICK) pool.alpha[i] = 0.92;
      else if (kind === STAR) pool.alpha[i] = 0.4 + 0.4 * pool.depth[i]!;
      else if (kind === DREIDEL) {
        pool.phase[i] = face * QUARTER;
        pool.rot[i] = (face - 2) * 0.12;
        pool.rotV[i] = SPIN_AMBIENT;
        face = (face + 1) % 4;
      } else if (kind === GELT) {
        pool.y[i] = Math.min(pool.y[i]!, input.h * 0.8);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, _input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const n = pool.count;
    const S = this.size;
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== STAR) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'circle', pool.size[i]!, '#fff8e0', pool.x[i]!, pool.y[i]!);
    }
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i]!;
      if (kind === GELT) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'coin', pool.size[i]!, GELT_COLORS[pool.color[i]! % 2]!, pool.x[i]!, pool.y[i]!, pool.rot[i]!, Math.max(0.15, Math.abs(Math.cos(pool.phase[i]!))), 1);
      } else if (kind === DREIDEL) {
        const ph = pool.phase[i]!;
        const q = Math.round(ph / QUARTER);
        const face = ((q % 4) + 4) % 4;
        const turn = Math.cos(ph - q * QUARTER);
        ctx.globalAlpha = 1;
        sprites.draw(ctx, DREIDEL_SPRITES[face]!, pool.size[i]!, DREIDEL_COLORS[pool.color[i]! % 3]!, pool.x[i]!, pool.y[i]!, pool.rot[i]!, turn, 1);
      }
    }
    const fs = quantize(S * 0.075, 2);
    if (this.scene.on) {
      // Scene mode: the scene draws the menorah; tonight's flames burn on its wicks.
      drawWickFlames(ctx, sprites, pool, WICK, this.flameSize);
    } else {
      // The menorah: painted once at ≤ 384 px and drawn scaled; candles stand in the cups; flames above.
      const P = Math.min(S, 384);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.2;
      sprites.draw(ctx, 'glow', S * 1.3, '#ffe9a3', this.cx, this.cy - S * 0.22);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      sprites.draw(ctx, 'menorah:body', P, BODY, this.cx, this.cy, 0, S / P, S / P);
      for (let i = 0; i < n; i++) {
        if (pool.kind[i] !== CANDLE) continue;
        const c = pool.color[i] === 255 ? SHAMASH_COLOR : CANDLE_COLORS[pool.color[i]! % 3]!;
        ctx.globalAlpha = 1;
        sprites.draw(ctx, 'menorah:candle', pool.size[i]!, c, pool.x[i]!, pool.y[i]!);
      }
      for (let i = 0; i < n; i++) {
        if (pool.kind[i] !== CANDLE) continue;
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
      if (kind === CANDLE) {
        const fy = y - pool.size[i]! * 0.5 - fs * 0.45;
        ctx.globalAlpha = 0.55 * pool.alpha[i]!;
        sprites.draw(ctx, 'glow', fs * 4.2, FLAME, x, fy);
        ctx.globalAlpha = 0.6 * pool.alpha[i]!;
        sprites.draw(ctx, 'glow', fs * 1.2, '#fff1b8', x, fy);
      } else if (kind === SPARK) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'menorah:sparkle', quantize(pool.size[i]!, 2), '#ffd166', x, y, pool.rot[i]!);
        ctx.globalAlpha = pool.alpha[i]! * 0.4;
        sprites.draw(ctx, 'glow', 26, '#ffd166', x, y);
      } else if (kind === LETTER) {
        ctx.globalAlpha = pool.alpha[i]! * 0.5;
        sprites.draw(ctx, 'glow', 110, '#ffe9a3', x, y);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== LETTER) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, LETTER_SPRITES[pool.color[i]! % 4]!, pool.size[i]!, '#1e3fa8', pool.x[i]!, pool.y[i]!);
    }
    ctx.globalAlpha = 1;
  }
}

export const menorah: EffectFactory = (sprites) => new MenorahEffect(sprites);
