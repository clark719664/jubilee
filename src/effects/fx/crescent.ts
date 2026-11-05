/**
 * crescent — Ramadan and Eid nights.
 * Ambient: the moon rises into place over the first few seconds wrapped in a soft halo, drawn from new to
 *   full by `moonPhase` (Ramadan progress; Eid shows the thin new crescent), with a little gold star by
 *   its horns; a faint tessellation of eight-pointed stars shimmers across the upper sky in a slow wave;
 *   small stars twinkle; a silhouette of domes and minarets with warm windows stands along the bottom.
 * Variant 'lanterns' (Eid al-Adha): fanous lanterns hang on cords along the top and swing as pendulums;
 *   some start dark.
 * Behaviors: eased rise (moon), pendulum swing + eased glow (lanterns), twinkle (stars), drag + spin +
 *   envelope (star burst).
 * Tap: on a dark lantern it lights up (its glow ramps in over half a second); anywhere else, a burst of
 *   little gold stars.
 * Still: the moon in place, every lantern lit, stars and tessellation steady.
 * Scene mode (`params.stage`): the scene draws its own town, so the skyline of domes and minarets gives way to
 *   the art; the moon, the stars, the lattice, the lanterns and the taps stay.
 * Params: moonPhase (0..1, new → full; default thin crescent), variant, stage, density.
 */
import type { Theme } from '../../theme/themes';
import { mixColor } from '../painters';
import { frameKeeping, phaseMoon, quantize, skyline, sparkle } from '../painters/extra-night';
import {
  TAU, clamp, drag, envelope, expired, integrate, range, spawnEdge, twinkle, type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { PooledEffect } from './shared';

export const MOON = 0;
export const LANTERN = 1;
const SCENERY_END = 2;
export const STAR = 2;
export const BURST = 3;

/** Moon phases are painted in 24 steps. */
export const PHASE_STEPS = 24;
const MOON_SPRITES: readonly string[] = Array.from({ length: PHASE_STEPS + 1 }, (_, k) => `crescent:moon${k}`);
const RISE_SECONDS = 6;
const MOON_TILT = 0.55;
const MOON_COLOR = '#fff4c2';
const GOLD = '#ffd166';
const GLASS = ['#ffb703', '#ff7b7b', '#5ad1f0', '#8be09b'] as const;
const GLASS_DARK = GLASS.map((c) => mixColor(c, '#1a1a2e', 0.65));

/** Lit fraction of the moon for a moonPhase param: new (a thin sliver) → full; default a young crescent. */
export function litFraction(moonPhase: number | undefined): number {
  if (moonPhase === undefined || !Number.isFinite(moonPhase)) return 0.14;
  return 0.08 + 0.92 * clamp(moonPhase, 0, 1);
}

/** Index of the painted phase sprite for a lit fraction. */
export function phaseStep(lit: number): number {
  return clamp(Math.round(lit * PHASE_STEPS), 1, PHASE_STEPS);
}

export class CrescentEffect extends PooledEffect {
  readonly describe: string = 'A crescent moon rising among twinkling stars';

  private started = false;
  private variant = '';
  private step0 = 3;
  private holdMoon = false;
  private lastTheme: Theme | null = null;
  private tessColor = '#ffd166';
  private skylineColor = '#04121c';
  private shadowColor = '#04121c';

  constructor(sprites: SpriteCache) {
    super(sprites, 512);
    if (!sprites.has('crescent:skyline')) sprites.register('crescent:skyline', skyline);
    if (!sprites.has('crescent:sparkle')) sprites.register('crescent:sparkle', sparkle);
  }

  get lanterns(): boolean {
    return this.variant === 'lanterns';
  }

  private readonly initMoon: ParticleInit = (pool, i) => {
    pool.kind[i] = MOON;
    pool.aux[i] = this.step0;
    pool.rot[i] = MOON_TILT;
  };

  private readonly initLantern: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = LANTERN;
    pool.aux[i] = pool.x[i]!;
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.05, 0.1);
    pool.depth[i] = range(rand, 0.1, 0.3);
    pool.color[i] = Math.floor(rand() * 4) % 4;
    // Every third lantern starts dark, waiting for a tap. vy holds the lit target, alpha the glow.
    const lit = pool.aux[i]! % 3 !== 1;
    pool.vy[i] = lit ? 1 : 0;
    pool.alpha[i] = lit ? 1 : 0;
  };

  private readonly initStar: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = STAR;
    pool.y[i] = pool.y[i]! * 0.72;
    pool.depth[i] = rand();
    pool.size[i] = pool.depth[i]! > 0.9 ? range(rand, 8, 12) : range(rand, 1.6, 3.2);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.2, 0.8);
  };

  private readonly initBurst: ParticleInit = (pool, i, rand) => {
    const a = rand() * TAU;
    const v = range(rand, 60, 220);
    pool.kind[i] = BURST;
    pool.vx[i] = Math.cos(a) * v;
    pool.vy[i] = Math.sin(a) * v;
    pool.size[i] = quantize(range(rand, 10, 20), 2);
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -3, 3);
    pool.maxLife[i] = range(rand, 1, 1.5);
    pool.color[i] = rand() < 0.75 ? 0 : 1;
    pool.alpha[i] = 0;
  };

  private sync(input: EffectInput): void {
    frameKeeping(this.budget, input.budget, SCENERY_END);
    const v = input.params.variant === 'lanterns' ? 'lanterns' : '';
    if (v !== this.variant) {
      this.variant = v;
      if (this.started) {
        this.pool.clear();
        this.started = false;
      }
    }
    if (input.theme !== this.lastTheme) {
      this.lastTheme = input.theme;
      this.tessColor = input.theme.glow;
      this.skylineColor = mixColor(input.theme.bg1, '#000000', 0.45);
      this.shadowColor = mixColor(input.theme.bg1, input.theme.bg2, 0.3);
    }
    this.step0 = phaseStep(litFraction(input.params.moonPhase));
    const name = MOON_SPRITES[this.step0]!;
    if (!this.sprites.has(name)) this.sprites.register(name, phaseMoon(this.step0 / PHASE_STEPS));
    this.layout(input);
  }

  private moonSize(w: number, h: number): number {
    return quantize(clamp(Math.min(w, h) * 0.26, 90, 220));
  }

  private layout(input: EffectInput): void {
    const { w, h } = input;
    const pool = this.pool;
    const n = this.lanternCount(w);
    const size = quantize(clamp(Math.min(w / (n + 2), h * 0.15), 44, 92), 4);
    const restY = w < 720 ? h * 0.22 : h * 0.27;
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind === MOON) {
        pool.aux[i] = this.step0;
        pool.size[i] = this.moonSize(w, h);
        pool.x[i] = w * (w < 720 ? 0.72 : 0.76);
        const k = this.holdMoon ? 1 : clamp(pool.life[i]! / RISE_SECONDS, 0, 1);
        const ease = 1 - (1 - k) * (1 - k) * (1 - k);
        pool.y[i] = h * 0.7 + (restY - h * 0.7) * ease;
      } else if (kind === LANTERN) {
        const slot = pool.aux[i]!;
        // Lanterns hang to the left of the moon so they never cover it.
        pool.vx[i] = w * (w < 720 ? 0.08 + (slot * 0.5) / Math.max(1, n - 1) : 0.05 + (slot * 0.55) / Math.max(1, n - 1));
        pool.size[i] = slot % 2 === 1 ? quantize(size * 0.84, 4) : size;
      }
    }
  }

  private lanternCount(w: number): number {
    return w < 520 ? 3 : w < 900 ? 4 : 5;
  }

  private swing(i: number, h: number, t: number): void {
    const pool = this.pool;
    const L = h * pool.depth[i]!;
    const omega = Math.sqrt(9.8 / Math.max(0.6, L / 120)) * 0.5;
    const theta = pool.rotV[i]! * Math.sin(omega * t + pool.phase[i]!);
    const R = L + pool.size[i]! * 0.5;
    pool.rot[i] = -theta;
    pool.x[i] = pool.vx[i]! + Math.sin(theta) * R;
    pool.y[i] = Math.cos(theta) * R;
  }

  private build(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initMoon, 0, 0);
    if (this.lanterns) {
      const n = this.lanternCount(w);
      for (let s = 0; s < n; s++) spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initLantern, s, 0);
    }
    this.layout(input);
    spawnEdge(pool, 'area', w, h, this.budget.take(clamp(input.budget * 0.16, 16, 60)), rand, this.initStar);
  }

  step(input: EffectInput): void {
    const { h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (input.motion === 'full') this.holdMoon = false;
    if (!this.started) {
      this.started = true;
      this.build(input);
    }
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === MOON) {
        pool.life[i]! += dt;
      } else if (kind === LANTERN) {
        pool.life[i]! += dt;
        if (pool.rotV[i]! > 0.1) pool.rotV[i]! -= 0.04 * dt;
        this.swing(i, h, t);
        const target = pool.vy[i]!;
        const a = pool.alpha[i]!;
        pool.alpha[i] = a < target ? Math.min(target, a + 2 * dt) : a;
      } else if (kind === STAR) {
        pool.life[i]! += dt;
        twinkle(pool, i, pool.aux[i]!, 0.6, 0.4 + 0.55 * pool.depth[i]!);
      } else if (kind === BURST) {
        drag(pool, i, dt, 2.2);
        pool.vy[i]! += 30 * dt;
        pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.15, 0.7);
        if (expired(pool, i)) pool.kill(i);
      }
    }
    // Now and then, top the stars back up (after a budget drop trimmed them).
    if (rand() < 0.01) {
      let stars = 0;
      for (let i = 0; i < pool.count; i++) if (pool.kind[i] === STAR) stars++;
      if (stars < clamp(input.budget * 0.16, 16, 60)) spawnEdge(pool, 'area', input.w, h, this.budget.take(1, 20), rand, this.initStar);
    }
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    if (!this.started) this.step(input);
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== LANTERN || pool.vy[i]! > 0) continue;
      if (Math.hypot(pool.x[i]! - x, pool.y[i]! - y) < pool.size[i]! * 0.9) {
        pool.vy[i] = 1;
        pool.rotV[i] = 0.2;
        return;
      }
    }
    spawnEdge(pool, 'point', input.w, input.h, this.budget.take(clamp(input.budget * 0.06, 10, 20), 2), input.rand, this.initBurst, x, y);
  }

  still(input: EffectInput): void {
    const pool = this.pool;
    pool.clear();
    this.holdMoon = true;
    this.sync(input);
    this.started = true;
    this.build(input);
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind === LANTERN) {
        pool.vy[i] = 1;
        pool.alpha[i] = 1;
        this.swing(i, input.h, 0.3);
      } else if (kind === STAR) {
        pool.alpha[i] = 0.4 + 0.5 * pool.depth[i]!;
      }
    }
    this.layout(input);
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const { w, h, t } = input;
    const pool = this.pool;
    const sprites = this.sprites;
    const n = pool.count;
    this.drawTessellation(ctx, w, h, t);
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== STAR) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      if (pool.size[i]! > 6) sprites.draw(ctx, 'crescent:sparkle', quantize(pool.size[i]!, 2), '#fff8e0', pool.x[i]!, pool.y[i]!);
      else sprites.draw(ctx, 'circle', pool.size[i]!, '#fff8e0', pool.x[i]!, pool.y[i]!);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i]!;
      if (kind === MOON) {
        const lit = pool.aux[i]! / PHASE_STEPS;
        ctx.globalAlpha = 0.3 + 0.3 * lit;
        sprites.draw(ctx, 'glow', pool.size[i]! * 3, MOON_COLOR, pool.x[i]!, pool.y[i]!);
      } else if (kind === LANTERN && pool.alpha[i]! > 0) {
        ctx.globalAlpha = 0.55 * pool.alpha[i]!;
        sprites.draw(ctx, 'glow', pool.size[i]! * 2.6, GLASS[pool.color[i]! % 4]!, pool.x[i]!, pool.y[i]!);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    this.drawCords(ctx);
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i]!;
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      if (kind === MOON) {
        const s = pool.size[i]!;
        ctx.globalAlpha = 1;
        // The moon's dark side hides the lattice behind it, as the real one hides the stars.
        ctx.globalAlpha = 0.9;
        sprites.draw(ctx, 'circle', s * 1.02, this.shadowColor, x, y);
        ctx.globalAlpha = 1;
        sprites.draw(ctx, MOON_SPRITES[pool.aux[i]! % (PHASE_STEPS + 1)]!, s, MOON_COLOR, x, y, pool.rot[i]!);
        sprites.draw(ctx, 'star8', quantize(s * 0.2, 2), GOLD, x - s * 0.62, y - s * 0.38, t * 0.2);
      } else if (kind === LANTERN) {
        const c = pool.color[i]! % 4;
        const a = pool.alpha[i]!;
        ctx.globalAlpha = 1;
        sprites.draw(ctx, 'fanous', pool.size[i]!, a > 0.5 ? GLASS[c]! : GLASS_DARK[c]!, x, y, pool.rot[i]!);
      }
    }
    // Skyline: three tiles along the bottom, the middle one larger (not over an illustrated scene).
    const U = quantize(clamp(w * 0.3, 200, 380), 8);
    ctx.globalAlpha = 1;
    for (let k = -1; k <= 1 && !input.params.stage; k++) {
      const s = k === 0 ? U : quantize(U * 0.78, 8);
      const x = w * (w < 720 ? 0.5 : 0.62) + k * U * 0.95;
      sprites.draw(ctx, 'crescent:skyline', s, this.skylineColor, x, h - s * 0.5 + 2, 0, k < 0 ? -1 : 1, 1);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== BURST) continue;
      const c = pool.color[i] === 0 ? GOLD : '#ffffff';
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'star8', pool.size[i]!, c, pool.x[i]!, pool.y[i]!, pool.rot[i]!);
      ctx.globalAlpha = pool.alpha[i]! * 0.45;
      sprites.draw(ctx, 'glow', 30, c, pool.x[i]!, pool.y[i]!);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /** Faint rub el hizb lattice over the upper sky; a slow diagonal wave lifts its alpha (never above 0.11). */
  private drawTessellation(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
    const G = quantize(clamp(w / 13, 64, 104), 8);
    const s = quantize(G * 0.46, 2);
    const rows = Math.ceil((h * 0.62) / (G * 0.5));
    for (let r = 0; r <= rows; r++) {
      const y = r * G * 0.5;
      const fade = 1 - y / (h * 0.66);
      if (fade <= 0) break;
      for (let x = r % 2 === 0 ? 0 : G / 2; x < w + G; x += G) {
        const wave = 0.5 + 0.5 * Math.sin(t * 0.5 - (x + y) * 0.006);
        ctx.globalAlpha = (0.035 + 0.075 * wave) * fade;
        this.sprites.draw(ctx, 'star8', s, this.tessColor, x, y);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawCords(ctx: CanvasRenderingContext2D): void {
    if (!this.lanterns) return;
    const pool = this.pool;
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== LANTERN) continue;
      const theta = -pool.rot[i]!;
      const half = pool.size[i]! * 0.5;
      ctx.moveTo(pool.vx[i]!, 0);
      ctx.lineTo(pool.x[i]! - Math.sin(theta) * half, pool.y[i]! - Math.cos(theta) * half);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export const crescent: EffectFactory = (sprites) => new CrescentEffect(sprites);
