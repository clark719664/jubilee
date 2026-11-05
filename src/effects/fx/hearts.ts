/**
 * hearts — a sky full of little hearts and one big beating one.
 * Ambient: hearts of every size rise from below in continuous depth (far: small, slow, faint · near: big,
 *   quick, bright), each swaying on its own slow sine and rocking gently as it sways; their opacity
 *   twinkles at ≤ 0.8 Hz. A big glossy heart sits in the upper right and beats a calm lub-dub (60 bpm),
 *   breathing out a tiny sparkle heart on every beat. Faint glow motes drift up in a 'lighter' pass.
 * Behaviours: rise + sway + twinkle (hearts), rise + twinkle (motes), drag + upward float (pop ring).
 * Tap: a heart-pop ring — two rings of hearts spring out from the finger, tips inward like a flower,
 *   slow, float up and fade, around a soft glow that ramps over 300 ms. Tapping the big heart makes it
 *   do a big happy double beat.
 * Still: hearts floating in place at every depth and the big heart at rest.
 * Params: palette (heart colours; default accent / glow / a pale glow / white), density. Grandparents Day
 *   passes a warm palette. The big heart is always the theme accent.
 */
import type { Theme } from '../../theme/themes';
import { mixColor } from '../painters';
import { bigHeart } from '../painters/extra-day';
import {
  Emitter, TAU, clamp, drag, envelope, expired, integrate, range, rise, spawnEdge, steadyRate, sway, twinkle,
  type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { Palette, PooledEffect, calm } from './shared';

export const HEART = 0;
export const MOTE = 1;
export const POP = 2;
export const PUFF = 3;
export const BEAT = 4;

const BIG = 'hearts:big';
/** Heartbeat period in seconds (60 bpm): lub at 0, dub at 0.24. */
const BEAT_PERIOD = 1;
const NEAR = 0.55;

export function heartsPalette(theme: Theme): readonly string[] {
  return theme.mood === 'night'
    ? [theme.accent, theme.accent2, theme.glow, '#ffffff']
    : [theme.accent, theme.glow, mixColor(theme.glow, '#ffffff', 0.5), '#ffffff'];
}

/** 0..1 lub-dub envelope at time t: a strong beat then a softer echo, resting the rest of the period. */
export function heartbeat(t: number): number {
  const p = (t / BEAT_PERIOD) % 1;
  const pulse = (start: number, len: number): number => {
    const u = (p - start) / len;
    return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u);
  };
  return pulse(0, 0.16) + 0.6 * pulse(0.24, 0.16);
}

export class HeartsEffect extends PooledEffect {
  readonly describe = 'Hearts floating up through the sky';
  /** Extra beat strength after a tap on the big heart (decays). */
  kick = 0;

  private readonly palette = new Palette();
  private readonly hearts = new Emitter();
  private readonly motes = new Emitter();
  private started = false;
  private night = false;
  private bigColor = '#ff4d9d';
  private lastBeat = -1;
  private bigX = 0;
  private bigY = 0;
  private bigSize = 120;
  // Tap ring parameters, read by initPop.
  private ringAngle = 0;
  private ringSpeed = 200;
  private ringSize = 16;

  constructor(sprites: SpriteCache) {
    super(sprites);
    if (!sprites.has(BIG)) sprites.register(BIG, bigHeart);
  }

  private readonly initHeart: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    pool.kind[i] = HEART;
    pool.depth[i] = depth;
    pool.size[i] = 9 + 26 * depth * depth + 4 * rand();
    pool.vy[i] = 0;
    pool.aux[i] = 20 + 46 * depth;
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.12, 0.35);
    pool.maxLife[i] = 0;
    pool.color[i] = this.palette.pick(rand);
    pool.alpha[i] = 0.5 + 0.45 * depth;
  };

  private readonly initMote: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = MOTE;
    pool.depth[i] = rand();
    pool.size[i] = range(rand, 5, 11);
    pool.aux[i] = range(rand, 8, 22);
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.3, 0.8);
    pool.color[i] = this.palette.pick(rand);
  };

  private readonly initPop: ParticleInit = (pool, i, rand) => {
    const a = this.ringAngle + range(rand, -0.06, 0.06);
    const speed = this.ringSpeed * range(rand, 0.92, 1.08);
    pool.kind[i] = POP;
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed;
    pool.rot[i] = a + Math.PI / 2;
    pool.size[i] = this.ringSize;
    pool.maxLife[i] = range(rand, 1.1, 1.5);
    pool.depth[i] = 1;
    pool.alpha[i] = 0;
    pool.color[i] = this.palette.pick(rand);
  };

  private readonly initPuff: ParticleInit = (pool, i) => {
    pool.kind[i] = PUFF;
    pool.size[i] = 120;
    pool.maxLife[i] = 1.1;
    pool.alpha[i] = 0;
  };

  private readonly initBeat: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = BEAT;
    pool.size[i] = range(rand, 10, 15);
    pool.vx[i] = range(rand, -30, 30);
    pool.vy[i] = range(rand, -70, -45);
    pool.phase[i] = rand() * TAU;
    pool.maxLife[i] = range(rand, 2.2, 3);
    pool.depth[i] = 1;
    pool.alpha[i] = 0;
    pool.color[i] = this.palette.pick(rand);
  };

  private sync(input: EffectInput): void {
    this.budget.frame(input.budget);
    this.palette.sync(input, heartsPalette);
    this.night = input.theme.mood === 'night';
    this.bigColor = input.theme.accent;
    const phone = input.w < 720;
    this.bigSize = Math.round(clamp(Math.min(input.w, input.h) * (phone ? 0.3 : 0.36), 80, 300));
    this.bigX = input.w * (phone ? 0.72 : 0.74);
    this.bigY = input.h * (phone ? 0.3 : 0.38);
  }

  private prefill(input: EffectInput, share: number): void {
    const { w, h, rand } = input;
    spawnEdge(this.pool, 'area', w, h, this.budget.take(input.budget * share), rand, this.initHeart);
    spawnEdge(this.pool, 'area', w, h, this.budget.take(input.budget * 0.08), rand, this.initMote);
  }

  step(input: EffectInput): void {
    const { w, h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) {
      this.started = true;
      this.prefill(input, 0.5);
    }
    const k = calm(input.intensity);
    const life = (h + 60) / 42;
    this.hearts.spawn(pool, 'bottom', w, h, steadyRate(input.budget * 0.62, life, 0.85) * k, dt, rand, this.initHeart, this.budget.take(99, 6));
    this.motes.spawn(pool, 'bottom', w, h, steadyRate(input.budget * 0.08, h / 15, 0.9) * k, dt, rand, this.initMote, this.budget.take(99, 4));
    // One sparkle heart breathed out on each "lub".
    const beatIndex = Math.floor(t / BEAT_PERIOD);
    if (beatIndex !== this.lastBeat) {
      this.lastBeat = beatIndex;
      spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initBeat, this.bigX + range(rand, -0.2, 0.2) * this.bigSize, this.bigY - this.bigSize * 0.25);
    }
    this.kick = Math.max(0, this.kick - dt * 0.9);
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === HEART) {
        const depth = pool.depth[i]!;
        rise(pool, i, dt, pool.aux[i]!);
        sway(pool, i, dt, 5 + 14 * depth, pool.rotV[i]!);
        pool.life[i]! += dt;
        pool.rot[i] = 0.22 * Math.sin(pool.phase[i]!);
        twinkle(pool, i, 0.25 + 0.5 * pool.rotV[i]!, 0.22, 0.5 + 0.45 * depth);
        if (pool.y[i]! < -pool.size[i]! - 4) pool.kill(i);
      } else if (kind === MOTE) {
        rise(pool, i, dt, pool.aux[i]!);
        sway(pool, i, dt, 8, 0.15);
        pool.life[i]! += dt;
        twinkle(pool, i, pool.rotV[i]!, 0.6, 0.8);
        if (pool.y[i]! < -12) pool.kill(i);
      } else if (kind === POP) {
        drag(pool, i, dt, 2.4);
        pool.vy[i]! -= 26 * dt;
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.06, 0.6);
        if (expired(pool, i)) pool.kill(i);
      } else if (kind === BEAT) {
        drag(pool, i, dt, 0.6);
        sway(pool, i, dt, 6, 0.4);
        integrate(pool, i, dt);
        pool.alpha[i] = 0.9 * envelope(pool, i, 0.3, 1);
        if (expired(pool, i)) pool.kill(i);
      } else {
        pool.life[i]! += dt;
        pool.alpha[i] = (this.night ? 0.55 : 0.4) * envelope(pool, i, 0.3, 0.7);
        if (expired(pool, i)) pool.kill(i);
      }
    }
  }

  tap(x: number, y: number, input: EffectInput): void {
    const { w, h, rand } = input;
    this.sync(input);
    const r = this.bigSize * 0.5;
    if (Math.hypot(x - this.bigX, y - this.bigY) < r) this.kick = 1;
    spawnEdge(this.pool, 'point', w, h, this.budget.take(1), rand, this.initPuff, x, y);
    const outer = Math.min(14, this.budget.take(14));
    for (let n = 0; n < outer; n++) {
      this.ringAngle = (n / outer) * TAU;
      this.ringSpeed = 250;
      this.ringSize = 23;
      spawnEdge(this.pool, 'point', w, h, 1, rand, this.initPop, x, y);
    }
    const inner = Math.min(7, this.budget.take(7));
    for (let n = 0; n < inner; n++) {
      this.ringAngle = ((n + 0.5) / inner) * TAU;
      this.ringSpeed = 130;
      this.ringSize = 15;
      spawnEdge(this.pool, 'point', w, h, 1, rand, this.initPop, x, y);
    }
  }

  still(input: EffectInput): void {
    this.pool.clear();
    this.sync(input);
    this.started = true;
    this.kick = 0;
    this.prefill(input, 0.55);
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] === HEART) pool.rot[i] = 0.22 * Math.sin(pool.phase[i]!);
    }
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const pal = this.palette;
    // Far hearts sit behind the big heart, near ones in front of it.
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== HEART || pool.depth[i]! >= NEAR) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'heart', pool.size[i]!, pal.color(pool.color[i]!), pool.x[i]!, pool.y[i]!, pool.rot[i]!);
    }
    const beat = heartbeat(input.t) + this.kick * heartbeat(input.t * 2);
    const scale = 1 + 0.065 * beat;
    const size = this.bigSize;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (this.night ? 0.5 : 0.32) * (0.8 + 0.2 * Math.min(1, beat));
    sprites.draw(ctx, 'glow', size * 2.1, this.night ? this.bigColor : '#ffffff', this.bigX, this.bigY);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    sprites.draw(ctx, BIG, size, this.bigColor, this.bigX, this.bigY, 0, scale, scale);
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind === MOTE || kind === PUFF || (kind === HEART && pool.depth[i]! < NEAR)) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      const color = kind === BEAT ? '#ffffff' : pal.color(pool.color[i]!);
      sprites.draw(ctx, 'heart', pool.size[i]!, color, pool.x[i]!, pool.y[i]!, pool.rot[i]!);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind === MOTE) {
        ctx.globalAlpha = pool.alpha[i]! * (this.night ? 0.7 : 0.5);
        sprites.draw(ctx, 'glow', pool.size[i]!, this.night ? pal.color(pool.color[i]!) : '#ffffff', pool.x[i]!, pool.y[i]!);
      } else if (kind === PUFF) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'glow', pool.size[i]!, this.night ? this.bigColor : '#ffffff', pool.x[i]!, pool.y[i]!);
      } else if (kind === POP) {
        ctx.globalAlpha = pool.alpha[i]! * (this.night ? 0.45 : 0.35);
        sprites.draw(ctx, 'glow', pool.size[i]! * 2.2, this.night ? pal.color(pool.color[i]!) : '#ffffff', pool.x[i]!, pool.y[i]!);
      } else if (kind === BEAT) {
        ctx.globalAlpha = pool.alpha[i]! * 0.6;
        sprites.draw(ctx, 'glow', pool.size[i]! * 2.6, this.night ? this.bigColor : '#ffffff', pool.x[i]!, pool.y[i]!);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}

export const hearts: EffectFactory = (sprites) => new HeartsEffect(sprites);
