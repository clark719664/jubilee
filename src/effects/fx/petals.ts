/**
 * petals — flower petals on the breeze, with a variant per holiday.
 * Ambient (all variants): petals (and some whole flowers) flutter down in continuous depth, flipping
 *   (width·|cos φ|) and spinning on a slow breeze.
 *   'marigold' (Día de los Muertos): orange and gold marigold petals and pompoms; a papel-picado banner
 *     sways along the top; a row of little ofrenda candles flickers along the bottom with warm glows, and
 *     glow dots drift up from them like candle sparks.
 *   'bloom' (Mother's Day): a border of daisies, tulips and blossoms grows from the bottom edge on arrival
 *     — stems rise and heads unfurl over 2 s, one after another — then sways on a springy breeze while
 *     pink petals drift.
 *   'poppies' (Memorial Day): a calm field of red poppies at the bottom and slow, sparse red petals.
 *   'spring' (Passover): green leaves and white blossoms drift; white blossoms and daisies grow below.
 *   default: petals in the palette (or the theme's colors).
 * Behaviors: gravity + flutter + drag + breeze + spin (petals); spring-damped sway (flowers);
 *   flame flicker (candles, ≤ 2 Hz); rise + twinkle (glow dots).
 * Tap: a petal burst — a ring of petals springs from the finger and drifts down; flowers nearby bow away.
 * Still: blooms fully open (and candles lit, banner hung), petals frozen mid-air.
 * Scene mode (`params.stage`): the scene draws its own garden and ofrenda, so the flower border and the candle
 *   row give way to the art; falling petals, the banner and taps stay.
 * Params: variant ('marigold' | 'bloom' | 'poppies' | 'spring'), palette (petal colors; for 'spring' the
 *   leaf greens, white entries become blossoms), stage, density.
 */
import type { Theme } from '../../theme/themes';
import { candle, daisy, poppy, springLeaf, tulip } from '../painters/extra-day';
import {
  Emitter, TAU, clamp, drag, envelope, expired, flame, flutter, gravity, integrate, range, spawnEdge, steadyRate,
  twinkle, type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { PooledEffect, calm, festivePalette } from './shared';

export const PETAL = 0;
export const WHOLE = 1;
export const LEAF = 2;
export const FLOWER = 3;
export const CANDLE = 4;
export const SPIRIT = 5;

export const VARIANTS = ['marigold', 'bloom', 'poppies', 'spring'] as const;
const HEADS = ['petals:daisy', 'petals:tulip', 'blossom', 'petals:poppy'] as const;
const DAISY = 0;
const TULIP = 1;
const BLOSSOM = 2;
const POPPY = 3;
const MARIGOLDS = ['#ff9f1c', '#ffb703', '#ff7b00', '#ffd166', '#e85d04'] as const;
const PICADO = ['#ff4d9d', '#ff9f1c', '#9b5de5', '#00b4d8', '#5ad27a', '#ffd166'] as const;
const PINKS = ['#ff8fb8', '#ffb3c6', '#ffd6e0', '#ffffff', '#ffc8a2'] as const;
const TULIPS = ['#ff5d8f', '#ff8fb8', '#c8442e', '#ffb703', '#b388eb'] as const;
const REDS = ['#d62828', '#c1121f', '#e63946'] as const;
const GREENS = ['#7ccf8a', '#2a7f4f', '#9be7d3'] as const;
const STEM = '#3f8f4a';
const WAX = '#fff4dc';
/** Flowers unfurl over this long (s), staggered by up to STAGGER. */
const GROW = 2;
const STAGGER = 0.8;

interface Look {
  petals: readonly string[];
  /** Sprite of the whole flowers that fall with the petals. */
  whole: string;
  wholeColor: string;
  wholeShare: number;
  leafShare: number;
  leaves: readonly string[];
  /** Flower heads along the bottom (empty = no flower border). */
  heads: readonly number[];
  headColors: readonly string[];
  rate: number;
  speed: number;
}

function isWhite(c: string): boolean {
  const s = c.toLowerCase();
  return s === '#fff' || s === '#ffffff' || s === 'white';
}

/** The variant's colors and furniture; `palette` overrides the petal colors (or the leaves in 'spring'). */
export function lookFor(variant: string, palette: readonly string[] | undefined, theme: Theme): Look {
  const p = palette && palette.length > 0 ? palette : null;
  switch (variant) {
    case 'marigold':
      return { petals: p ?? MARIGOLDS, whole: 'marigold', wholeColor: '#ff9f1c', wholeShare: 0.12, leafShare: 0, leaves: GREENS, heads: [], headColors: [], rate: 1, speed: 1 };
    case 'bloom':
      return { petals: p ?? PINKS, whole: 'blossom', wholeColor: '#ffb3c6', wholeShare: 0.1, leafShare: 0, leaves: GREENS, heads: [DAISY, TULIP, BLOSSOM, TULIP], headColors: TULIPS, rate: 0.85, speed: 0.9 };
    case 'poppies':
      return { petals: p ?? REDS, whole: 'petals:poppy', wholeColor: '#d62828', wholeShare: 0.16, leafShare: 0, leaves: GREENS, heads: [POPPY], headColors: REDS, rate: 0.5, speed: 0.75 };
    case 'spring': {
      const greens = p ? p.filter((c) => !isWhite(c)) : [];
      return { petals: ['#ffffff', '#fdfcf5'], whole: 'blossom', wholeColor: '#ffffff', wholeShare: 0.3, leafShare: 0.4, leaves: greens.length > 0 ? greens : GREENS, heads: [BLOSSOM, DAISY], headColors: ['#ffffff', '#fdfcf5'], rate: 0.85, speed: 0.9 };
    }
    default:
      return { petals: p ?? festivePalette(theme), whole: 'blossom', wholeColor: theme.accent2, wholeShare: 0.08, leafShare: 0, leaves: GREENS, heads: [], headColors: [], rate: 1, speed: 1 };
  }
}

const EMPTY_LOOK: Look = {
  petals: PINKS, whole: 'blossom', wholeColor: '#ffffff', wholeShare: 0, leafShare: 0, leaves: GREENS, heads: [], headColors: [], rate: 1, speed: 1,
};

function easeOutBack(u: number): number {
  const c = 1.7;
  const v = u - 1;
  return 1 + (c + 1) * v * v * v + c * v * v;
}

export class PetalsEffect extends PooledEffect {
  readonly describe: string = 'Flower petals drifting down';

  private readonly fall = new Emitter();
  private readonly sparks = new Emitter();
  private look: Look = EMPTY_LOOK;
  private lastVariant: string | null = null;
  private lastPalette: readonly string[] | undefined;
  private lastTheme: Theme | null = null;
  private variant = '';
  private started = false;
  /** Over an illustrated scene: no flower border or candle row. */
  private onScene = false;
  private night = false;
  private candleSize = 32;
  private ringAngle = 0;
  private flowerX = 0;
  private flowerDelay = 0;
  private groundH = 0;
  private portrait = false;

  constructor(sprites: SpriteCache) {
    super(sprites);
    const extra = [['petals:daisy', daisy], ['petals:tulip', tulip], ['petals:poppy', poppy], ['petals:leaf', springLeaf], ['petals:candle', candle]] as const;
    for (const [name, painter] of extra) if (!sprites.has(name)) sprites.register(name, painter);
  }

  private readonly initFall: ParticleInit = (pool, i, rand) => {
    const look = this.look;
    const depth = rand();
    const r = rand();
    pool.depth[i] = depth;
    pool.phase[i] = rand() * TAU;
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -1.8, 1.8);
    pool.aux[i] = (16 + 30 * depth) * look.speed;
    pool.vy[i] = pool.aux[i]!;
    pool.alpha[i] = 0.55 + 0.45 * depth;
    if (r < look.leafShare) {
      pool.kind[i] = LEAF;
      pool.size[i] = 12 + 14 * depth;
      pool.color[i] = Math.floor(rand() * look.leaves.length);
    } else if (r < look.leafShare + look.wholeShare) {
      pool.kind[i] = WHOLE;
      pool.size[i] = 17 + 21 * depth;
    } else {
      pool.kind[i] = PETAL;
      pool.size[i] = 11 + 16 * depth;
      pool.color[i] = Math.floor(rand() * look.petals.length);
    }
  };

  private readonly initRing: ParticleInit = (pool, i, rand) => {
    this.initFall(pool, i, rand);
    const a = this.ringAngle;
    const speed = range(rand, 160, 230);
    pool.depth[i] = 1;
    pool.size[i]! += 4;
    pool.alpha[i] = 1;
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed - 40;
    pool.rot[i] = a + Math.PI / 2;
  };

  /** FLOWER: x = root, vx = sway angle, vy = angular velocity, aux = stem length, rotV = head type, life = growth clock. */
  private readonly initFlower: ParticleInit = (pool, i, rand) => {
    const look = this.look;
    const h = this.groundH;
    pool.kind[i] = FLOWER;
    pool.x[i] = this.flowerX;
    pool.y[i] = h + 4;
    pool.vx[i] = range(rand, -0.05, 0.05);
    pool.vy[i] = 0;
    pool.rotV[i] = look.heads[Math.floor(rand() * look.heads.length)] ?? DAISY;
    // Taller stems on portrait heroes so the heads clear the text scrim along the bottom.
    pool.aux[i] = h * (this.portrait ? range(rand, 0.3, 0.5) : range(rand, 0.2, 0.4));
    pool.size[i] = clamp(h * 0.075, 28, 58) * range(rand, 0.85, 1.2) * (pool.rotV[i] === TULIP ? 1.1 : 1);
    pool.phase[i] = rand() * TAU;
    pool.life[i] = -this.flowerDelay;
    pool.depth[i] = rand();
    pool.color[i] = pool.rotV[i] === DAISY && this.variant === 'bloom' ? 250 : Math.floor(rand() * look.headColors.length);
  };

  private readonly initCandle: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = CANDLE;
    pool.size[i] = this.candleSize * range(rand, 0.85, 1.15);
    pool.phase[i] = rand() * TAU;
    pool.alpha[i] = 1;
  };

  private readonly initSpirit: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = SPIRIT;
    pool.vx[i] = range(rand, -6, 6);
    pool.vy[i] = -range(rand, 14, 30);
    pool.size[i] = range(rand, 6, 12);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.3, 0.9);
    pool.maxLife[i] = range(rand, 4, 7);
    pool.color[i] = Math.floor(rand() * 3);
  };

  private sync(input: EffectInput): void {
    this.budget.frame(input.budget);
    const variant = input.params.variant ?? '';
    if (variant !== this.lastVariant || input.params.palette !== this.lastPalette || input.theme !== this.lastTheme) {
      this.lastVariant = variant;
      this.lastPalette = input.params.palette;
      this.lastTheme = input.theme;
      this.variant = variant;
      this.look = lookFor(variant, input.params.palette, input.theme);
    }
    const onScene = input.params.stage !== undefined;
    if (onScene !== this.onScene) {
      this.onScene = onScene;
      this.started = false;
      this.pool.clear();
    }
    this.night = input.theme.mood === 'night';
    this.candleSize = Math.round(clamp(input.h * 0.065, 24, 44));
    this.groundH = input.h;
    this.portrait = input.h > input.w * 1.1;
  }

  private flowerCount(w: number): number {
    return this.look.heads.length === 0 || this.onScene ? 0 : clamp(Math.round(w / 85), 6, 16);
  }

  private candleCount(w: number): number {
    return this.variant === 'marigold' && !this.onScene ? clamp(Math.round(w / 120), 4, 11) : 0;
  }

  /** Plants the flower border and the candle row (only what is missing, so a budget trim heals). */
  private furnish(input: EffectInput, grown: boolean): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    let flowers = 0;
    let candles = 0;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] === FLOWER) flowers++;
      else if (pool.kind[i] === CANDLE) candles++;
    }
    const nf = this.flowerCount(w);
    for (let k = flowers; k < nf; k++) {
      this.flowerX = w * ((k + range(rand, 0.15, 0.85)) / nf);
      this.flowerDelay = grown ? -GROW - STAGGER : (k / Math.max(1, nf - 1)) * STAGGER * (k % 2 === 0 ? 1 : 0.6);
      if (spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initFlower, this.flowerX, h) === 0) break;
    }
    const nc = this.candleCount(w);
    for (let k = candles; k < nc; k++) {
      const x = w * ((k + 0.5) / nc) + range(rand, -12, 12);
      if (spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initCandle, x, h - this.candleSize * 0.42) === 0) break;
    }
  }

  step(input: EffectInput): void {
    const { w, h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      this.furnish(input, false);
      spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.35 * this.look.rate), rand, this.initFall);
    } else if (pool.count < this.budget.limit) {
      this.furnish(input, true);
    }
    const k = calm(input.intensity);
    const reserve = this.flowerCount(w) + this.candleCount(w) + 4;
    const life = h / (34 * this.look.speed);
    this.fall.spawn(pool, 'top', w, h, steadyRate(input.budget * 0.6 * this.look.rate, life, 0.85) * k, dt, rand, this.initFall, this.budget.take(99, reserve));
    if (this.variant === 'marigold') {
      const n = this.sparks.due(3 * k, dt);
      for (let s = 0; s < n; s++) {
        const x = range(rand, 0.05, 0.95) * w;
        spawnEdge(pool, 'point', w, h, this.budget.take(1, 2), rand, this.initSpirit, x, h - this.candleSize * 1.1);
      }
    }
    const breeze = 10 + 8 * Math.sin(t * 0.23) + 5 * Math.sin(t * 0.71 + 1);
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === PETAL || kind === WHOLE || kind === LEAF) {
        const depth = pool.depth[i]!;
        gravity(pool, i, dt, 70, pool.aux[i]!);
        drag(pool, i, dt, 0.6);
        flutter(pool, i, dt, pool.size[i]! * 0.7, 0.35 + 0.35 * depth);
        pool.x[i]! += breeze * (0.3 + 0.8 * depth) * dt;
        pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        const x = pool.x[i]!;
        if (x > w + 40) pool.x[i] = x - w - 80;
        else if (x < -40) pool.x[i] = x + w + 80;
        if (pool.y[i]! > h + pool.size[i]!) pool.kill(i);
      } else if (kind === FLOWER) {
        pool.life[i]! += dt;
        // Spring-damped sway: vx is the lean angle, vy its angular velocity.
        const torque = 0.05 * Math.sin(t * 0.8 + pool.x[i]! * 0.013) + 0.002 * breeze;
        pool.vy[i]! += (-7 * pool.vx[i]! + torque) * dt;
        pool.vy[i]! *= Math.max(0, 1 - 1.6 * dt);
        pool.vx[i]! += pool.vy[i]! * dt;
      } else if (kind === CANDLE) {
        flame(pool, i, dt, 0.5, rand);
      } else {
        integrate(pool, i, dt);
        pool.x[i]! += Math.sin(pool.life[i]! * 1.3 + pool.phase[i]!) * 8 * dt;
        twinkle(pool, i, pool.aux[i]!, 0.5, envelope(pool, i, 0.6, 1.5));
        if (expired(pool, i)) pool.kill(i);
      }
    }
  }

  tap(x: number, y: number, input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    this.sync(input);
    const n = this.budget.take(14);
    for (let k = 0; k < n; k++) {
      this.ringAngle = (k / n) * TAU;
      spawnEdge(pool, 'point', w, h, 1, rand, this.initRing, x, y);
    }
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== FLOWER) continue;
      const dx = pool.x[i]! - x;
      const d = Math.abs(dx);
      if (d < 220) pool.vy[i]! += (dx >= 0 ? 1 : -1) * 1.6 * (1 - d / 220);
    }
  }

  still(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.started = true;
    this.furnish(input, true);
    spawnEdge(pool, 'area', w, h * 0.8, this.budget.take(input.budget * 0.4 * Math.max(0.6, this.look.rate)), rand, this.initFall);
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] === CANDLE) pool.alpha[i] = 0.9;
    }
    if (this.variant === 'marigold') {
      const n = this.budget.take(10);
      for (let s = 0; s < n; s++) {
        spawnEdge(pool, 'point', w, h, 1, rand, this.initSpirit, range(rand, 0.05, 0.95) * w, h * range(rand, 0.45, 0.85));
        const i = pool.count - 1;
        pool.life[i] = 1.5;
        pool.alpha[i] = 0.7;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    if (this.variant === 'marigold') this.drawBanner(ctx, input);
    this.drawFalling(ctx, 0, 0.5);
    this.drawFlowers(ctx, input);
    this.drawCandles(ctx);
    this.drawFalling(ctx, 0.5, 1.01);
    if (this.night || this.variant === 'marigold') {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < pool.count; i++) {
        const kind = pool.kind[i]!;
        if (kind === SPIRIT) {
          ctx.globalAlpha = pool.alpha[i]! * 0.8;
          this.sprites.draw(ctx, 'glow', pool.size[i]!, pool.color[i] === 0 ? '#ffd166' : pool.color[i] === 1 ? '#ff9f1c' : '#ff7b9c', pool.x[i]!, pool.y[i]!);
        } else if (kind === CANDLE) {
          const s = pool.size[i]!;
          ctx.globalAlpha = pool.alpha[i]! * 0.55;
          this.sprites.draw(ctx, 'glow', s * 2.6, '#ffb703', pool.x[i]!, pool.y[i]! - s * 0.42);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  private drawFalling(ctx: CanvasRenderingContext2D, d0: number, d1: number): void {
    const pool = this.pool;
    const look = this.look;
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind !== PETAL && kind !== WHOLE && kind !== LEAF) continue;
      const depth = pool.depth[i]!;
      if (depth < d0 || depth >= d1) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      const flip = 0.25 + 0.75 * Math.abs(Math.cos(pool.phase[i]!));
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      if (kind === PETAL) this.sprites.draw(ctx, 'petal', pool.size[i]!, look.petals[pool.color[i]! % look.petals.length]!, x, y, pool.rot[i]!, flip, 1);
      else if (kind === LEAF) this.sprites.draw(ctx, 'petals:leaf', pool.size[i]!, look.leaves[pool.color[i]! % look.leaves.length]!, x, y, pool.rot[i]!, flip, 1);
      else this.sprites.draw(ctx, look.whole, pool.size[i]!, look.wholeColor, x, y, pool.rot[i]!, flip, 1);
    }
  }

  /** Stems in one stroked path, then leaves and heads; heads unfurl (scale + twirl) as they grow. */
  private drawFlowers(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const look = this.look;
    if (look.heads.length === 0) return;
    let any = false;
    ctx.beginPath();
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== FLOWER) continue;
      const g = clamp(pool.life[i]! / (GROW * 0.6), 0, 1);
      if (g <= 0) continue;
      const len = pool.aux[i]! * (1 - (1 - g) * (1 - g));
      const a = pool.vx[i]!;
      const x0 = pool.x[i]!;
      const y0 = pool.y[i]!;
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0, y0 - len * 0.5, x0 + Math.sin(a) * len, y0 - Math.cos(a) * len);
      any = true;
    }
    if (any) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = STEM;
      ctx.lineWidth = clamp(input.h * 0.006, 2.5, 4.5);
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== FLOWER) continue;
      const life = pool.life[i]!;
      const g = clamp(life / (GROW * 0.6), 0, 1);
      if (g <= 0) continue;
      const len = pool.aux[i]! * (1 - (1 - g) * (1 - g));
      const a = pool.vx[i]!;
      const x0 = pool.x[i]!;
      const y0 = pool.y[i]!;
      const size = pool.size[i]!;
      const leafK = clamp((life - 0.3) / 0.8, 0, 1);
      if (leafK > 0) {
        const lx = x0 + Math.sin(a) * len * 0.35;
        const ly = y0 - len * 0.35;
        const side = pool.depth[i]! < 0.5 ? -1 : 1;
        ctx.globalAlpha = 1;
        this.sprites.draw(ctx, 'petals:leaf', Math.round(size * 0.6), STEM, lx + side * size * 0.18 * leafK, ly, side * 0.9 + a, leafK, leafK);
      }
      const open = clamp((life - GROW * 0.3) / (GROW * 0.7), 0, 1);
      if (open <= 0) continue;
      const s = Math.max(0.05, easeOutBack(open));
      const hx = x0 + Math.sin(a) * len;
      const hy = y0 - Math.cos(a) * len;
      const type = pool.rotV[i]! | 0;
      const c = pool.color[i]!;
      const color = c === 250 ? '#ffffff' : look.headColors[c % Math.max(1, look.headColors.length)] ?? '#ffffff';
      const twirl = (1 - open) * 1.4 + a * 0.6;
      const yOff = type === TULIP ? -size * 0.3 * s : 0;
      ctx.globalAlpha = 1;
      this.sprites.draw(ctx, HEADS[type]!, Math.round(size), color, hx, hy + yOff, type === TULIP ? a : twirl, s, s);
    }
  }

  private drawCandles(ctx: CanvasRenderingContext2D): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== CANDLE) continue;
      const s = pool.size[i]!;
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      ctx.globalAlpha = 1;
      this.sprites.draw(ctx, 'petals:candle', Math.round(s), WAX, x, y);
      ctx.globalAlpha = pool.alpha[i]!;
      const lean = Math.sin(pool.phase[i]!) * 0.12;
      this.sprites.draw(ctx, 'flame', Math.round(s * 0.42), '#ffb703', x, y - s * 0.42, lean, 1, 0.9 + 0.1 * pool.alpha[i]!);
    }
  }

  /** Papel picado: a sagging string of punched-paper pennants that sway one after another. */
  private drawBanner(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const { w, h, t } = input;
    const count = Math.max(4, Math.round(w / 80));
    const sag = Math.min(24, h * 0.045);
    const y0 = 10;
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.quadraticCurveTo(w / 2, y0 + 2 * sag, w, y0);
    ctx.stroke();
    const size = Math.round(clamp((w / count) * 0.8, 34, 62));
    ctx.globalAlpha = 0.95;
    for (let k = 0; k < count; k++) {
      const u = (k + 0.5) / count;
      const x = u * w;
      const y = y0 + 4 * sag * u * (1 - u);
      const rot = 0.1 * Math.sin(t * 1.2 + k * 0.8);
      this.sprites.draw(ctx, 'papelPicado', size, PICADO[k % PICADO.length]!, x - Math.sin(rot) * size * 0.5, y + Math.cos(rot) * size * 0.5, rot);
    }
  }
}

export const petals: EffectFactory = (sprites) => new PetalsEffect(sprites);
