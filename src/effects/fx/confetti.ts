/**
 * confetti — paper that really flutters.
 * Ambient: a gentle rain of rectangles, dots and streamers in the theme palette (or `params.glyphs` as
 *   outlined emoji); every piece tumbles on its own flutter frequency, so it rocks sideways, slows while
 *   flat and flips (drawn as width = size·|cos phase|, no save/rotate/restore), and spins slowly.
 * Behaviors: gravity to a per-piece terminal speed, horizontal drag (cannon shots slow into a drift),
 *   flutter, spin.
 * Tap: two cannons fire from the bottom corners toward the finger and cross there.
 * Still: confetti scattered on the ground, lying at every angle, with a few pieces frozen mid-air.
 * Params: palette, glyphs, density; variant 'cannon' (New Year's Eve): a big double cannon on load;
 *   variant 'banner' (Cinco de Mayo, Pancake Day): a papel-picado banner sways across the top;
 *   variant 'fools' (April Fools'): for the first two seconds the confetti falls UP — then it remembers
 *   how gravity works. The hero's upside-down flip is the UI's job (`.hero.flipped`).
 */
import type { Theme } from '../../theme/themes';
import { mixColor } from '../painters';
import {
  Emitter, TAU, clamp, flutter, integrate, range, spawnEdge, spin, steadyRate, type ParticleInit, type ParticlePool,
} from '../particles';
import type { EffectFactory, EffectInput } from '../types';
import { GlyphSet, Palette, PooledEffect, calm } from './shared';

export const RECT = 0;
export const DOT = 1;
export const STREAMER = 2;
export const GLYPH = 3;

const GRAVITY = 260;
const FOOLS_SECONDS = 2.2;

/** Confetti colors that read on this sky: accent, accent2, then white/glow at night or ink by day. */
export function confettiPalette(theme: Theme): readonly string[] {
  return theme.mood === 'night'
    ? [theme.accent, theme.accent2, theme.glow, '#ffffff']
    : [theme.accent, theme.accent2, theme.ink, mixColor(theme.accent, theme.accent2, 0.5)];
}

function terminalOf(kind: number, depth: number): number {
  switch (kind) {
    case DOT: return 70 + 80 * depth;
    case STREAMER: return 45 + 45 * depth;
    case GLYPH: return 60 + 60 * depth;
    default: return 55 + 65 * depth;
  }
}

export class ConfettiEffect extends PooledEffect {
  readonly describe = 'Confetti tumbling through the air';

  private readonly palette = new Palette();
  private readonly glyphs = new GlyphSet();
  private readonly rain = new Emitter();
  private variant = '';
  private started = false;
  private t0 = 0;
  /** April Fools': gravity points up for a moment. */
  private upside = false;
  // Cannon aim, read by initShot (closures allocate nothing per shot).
  private srcX = 0;
  private srcY = 0;
  private aimX = 0;
  private aimY = 0;

  private initPiece(pool: ParticlePool, i: number, rand: () => number): void {
    const depth = range(rand, 0.45, 1);
    pool.depth[i] = depth;
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 1.1, 2.3);
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -3, 3);
    pool.alpha[i] = 0.75 + 0.25 * depth;
    if (this.glyphs.active) {
      pool.kind[i] = GLYPH;
      pool.size[i] = range(rand, 18, 30);
      pool.color[i] = this.glyphs.pick(rand);
      return;
    }
    const r = rand();
    if (r < 0.55) {
      pool.kind[i] = RECT;
      pool.size[i] = range(rand, 7, 12);
    } else if (r < 0.8) {
      pool.kind[i] = DOT;
      pool.size[i] = range(rand, 5, 8);
    } else {
      pool.kind[i] = STREAMER;
      pool.size[i] = range(rand, 14, 22);
    }
    pool.color[i] = this.palette.pick(rand);
  }

  private readonly initRain: ParticleInit = (pool, i, rand) => {
    this.initPiece(pool, i, rand);
    const v = terminalOf(pool.kind[i]!, pool.depth[i]!) * 0.6;
    pool.vy[i] = this.upside ? -v : v;
  };

  private readonly initShot: ParticleInit = (pool, i, rand) => {
    this.initPiece(pool, i, rand);
    const dx = this.aimX - this.srcX;
    const dy = this.aimY - this.srcY;
    const dist = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx) + range(rand, -0.3, 0.3);
    const speed = clamp(dist * 1.5, 350, 1100) * range(rand, 0.55, 1.05);
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed;
  };

  private groundY = 0;

  private readonly initGround: ParticleInit = (pool, i, rand) => {
    this.initPiece(pool, i, rand);
    pool.y[i] = this.groundY - 24 * rand() * rand();
    pool.alpha[i] = 0.9;
  };

  private sync(input: EffectInput): void {
    this.budget.frame(input.budget);
    this.palette.sync(input, confettiPalette);
    this.glyphs.sync(input);
    this.variant = input.params.variant ?? '';
  }

  /** Fires `share` of the budget from both bottom corners toward (tx, ty). */
  private cannons(tx: number, ty: number, input: EffectInput, share: number): void {
    const { w, h, rand } = input;
    const n = this.budget.take(input.budget * share);
    const left = Math.floor(n / 2);
    this.aimX = tx;
    this.aimY = ty;
    this.srcX = 0;
    this.srcY = h;
    spawnEdge(this.pool, 'point', w, h, left, rand, this.initShot, 0, h);
    this.srcX = w;
    spawnEdge(this.pool, 'point', w, h, n - left, rand, this.initShot, w, h);
  }

  step(input: EffectInput): void {
    const { w, h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      this.t0 = t;
      if (this.variant === 'cannon') this.cannons(w * 0.5, h * 0.3, input, 0.5);
      else if (this.variant !== 'fools') spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.35), rand, this.initRain);
    }
    this.upside = this.variant === 'fools' && t - this.t0 < FOOLS_SECONDS;
    const rate = steadyRate(input.budget * 0.6, h / 90, 0.8) * calm(input.intensity);
    this.rain.spawn(pool, this.upside ? 'bottom' : 'top', w, h, rate, dt, rand, this.initRain, this.budget.room());
    const g = this.upside ? -GRAVITY : GRAVITY;
    const hdrag = Math.max(0, 1 - 0.8 * dt);
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      const term = terminalOf(kind, pool.depth[i]!);
      let vy = pool.vy[i]! + g * dt;
      if (this.upside ? vy < -term : vy > term) vy = this.upside ? -term : term;
      pool.vy[i] = vy;
      pool.vx[i]! *= hdrag;
      flutter(pool, i, dt, pool.size[i]! * 0.9, pool.aux[i]!);
      spin(pool, i, dt);
      integrate(pool, i, dt);
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      const m = pool.size[i]! * 2;
      if ((this.upside ? y < -m : y > h + m) || x < -80 || x > w + 80) pool.kill(i);
    }
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    this.cannons(x, y, input, 0.35);
  }

  still(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.groundY = h - 4;
    spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.6), rand, this.initGround);
    spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.15), rand, this.initRain);
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    if (this.variant === 'banner') this.drawBanner(ctx, input);
    const ink = input.theme.ink;
    for (let i = 0; i < pool.count; i++) {
      ctx.globalAlpha = pool.alpha[i]!;
      const kind = pool.kind[i];
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      const size = pool.size[i]!;
      const flip = 0.18 + 0.82 * Math.abs(Math.cos(pool.phase[i]!));
      if (kind === GLYPH) sprites.draw(ctx, this.glyphs.name(pool.color[i]!), size, ink, x, y, Math.sin(pool.phase[i]!) * 0.3);
      else if (kind === DOT) sprites.draw(ctx, 'circle', size, this.palette.color(pool.color[i]!), x, y, 0, flip, 1);
      else if (kind === STREAMER) sprites.draw(ctx, 'confettiStreamer', size, this.palette.color(pool.color[i]!), x, y, pool.rot[i]!, 1, flip);
      else sprites.draw(ctx, 'confettiRect', size, this.palette.color(pool.color[i]!), x, y, pool.rot[i]!, flip, 1);
    }
    ctx.globalAlpha = 1;
  }

  /** Papel picado: a sagging string with punched-paper pennants that sway one after another. */
  private drawBanner(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const { w, h, t } = input;
    const colors = this.palette.colors;
    const count = Math.max(3, Math.round(w / 76));
    const sag = Math.min(26, h * 0.05);
    const y0 = 12;
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.quadraticCurveTo(w / 2, y0 + 2 * sag, w, y0);
    ctx.stroke();
    const size = clamp((w / count) * 0.78, 34, 60);
    ctx.globalAlpha = 0.96;
    for (let k = 0; k < count; k++) {
      const u = (k + 0.5) / count;
      const x = u * w;
      const y = y0 + 4 * sag * u * (1 - u);
      const rot = 0.09 * Math.sin(t * 1.4 + k * 0.7);
      const color = colors.length > 0 ? colors[k % colors.length]! : '#ffffff';
      this.sprites.draw(ctx, 'papelPicado', size, color, x - Math.sin(rot) * size * 0.5, y + Math.cos(rot) * size * 0.5, rot);
    }
    ctx.globalAlpha = 1;
  }
}

export const confetti: EffectFactory = (sprites) => new ConfettiEffect(sprites);
