/**
 * bubbles — soap bubbles, plus three water-and-earth variants.
 * Ambient: iridescent bubbles rise in three depths (far: small, slow, faint · near: big and quick), each
 *   swaying and wobbling as it goes (the sprite squashes and stretches a little), with a pastel rim and a
 *   window highlight; on night skies the big ones carry a faint glow.
 * Variant 'earth' (Earth Day): a globe turns slowly on the right (continents and cloud wisps slide across
 *   the disc, foreshortening toward the limb, under a soft atmosphere glow); fresh green leaves flutter
 *   down. Tap: every bubble near the finger pops in a cascade (nearest first), and a sprout pushes up
 *   from the ground under the finger and unfurls two leaves (the six newest sprouts stay).
 * Variant 'water' (Songkran): bowls of water are thrown across the sky in sparkling arcs (each throw a
 *   stream of droplets that turn along their path) and splash into a shallow band of water with ripples.
 *   Tap: a splash crown bursts from the finger with a ring.
 * Variant 'waves' (Dragon Boat): a three-layer wave ribbon rolls along the bottom; dragon boats glide on it,
 *   their crews paddling in time and throwing up little splashes at every stroke. Tap: a splash (from the
 *   river surface when the finger is on the water, else from the finger) and a ripple.
 * Behaviors: rise + sway (bubbles), flutter + gravity + spin (leaves), ballistic arcs (drops), envelope
 *   (pops, ripples), wave-following (boats, ripples).
 * Still: bubbles frozen mid-rise; the globe, grown sprouts; water arcs frozen mid-throw; boats on the waves.
 * Scene mode (`params.stage`): the scene draws its own ground and water, so the globe, the sprouts, the water
 *   band and the wave ribbon with its boats give way to the art; bubbles, leaves, throws and splashes stay.
 * Params: variant ('earth' | 'water' | 'waves'), stage, density.
 */
import type { Theme } from '../../theme/themes';
import { mixColor } from '../painters';
import {
  dragonBoat, frameScenery, greenLeaf, landBlob, ocean, quant, rippleRing, sphereShade, waterDrop,
} from '../painters/extra-whimsy';
import {
  Emitter, TAU, clamp, envelope, expired, flutter, gravity, integrate, range, spawnEdge, spin, steadyRate, sway,
  type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache, SpritePainter } from '../types';
import { LAND_NAMES, ROWERS, drawBoat, drawGlobe, drawSprouts, easeOut, iridescentBubble, popBurst, rowerX } from './bubbles-scene';
import { PooledEffect, calm } from './shared';

export const GLOBE = 0;
export const SPROUT = 1;
export const BOAT = 2;
const SCENERY_END = 3;
export const BUBBLE = 3;
export const LEAF = 4;
export const DROP = 5;
export const RIPPLE = 6;
export const POP = 7;

/** Sprouts kept on the ground (the oldest gives way to a new one). */
export const MAX_SPROUTS = 6;
const LEAF_COLORS = ['#3fae4f', '#7bc96f', '#2a9d8f', '#a7d65a'] as const;
const POP_SECONDS = 0.4;
const SPROUT_GROW = 1.8;

/** Globe diameter and center for this sky. */
export function globeLayout(w: number, h: number): { d: number; x: number; y: number } {
  const phone = w < 600;
  const d = Math.max(0, phone ? Math.min(w * 0.5, h * 0.36) : Math.min(h * 0.56, w * 0.34, 440));
  return { d, x: phone ? w * 0.72 : w * 0.76, y: phone ? h * 0.3 : h * 0.44 };
}

export class BubblesEffect extends PooledEffect {
  /** Bubbles popped (tests). */
  popped = 0;
  /** Sprouts planted by taps (tests). */
  planted = 0;
  /** Splashes made by taps (tests). */
  splashes = 0;

  private readonly rise = new Emitter();
  private readonly fall = new Emitter();
  private readonly stream = new Emitter();
  private variant = '';
  private started = false;
  /** Over an illustrated scene: no globe, sprouts, water band or boats. */
  private onScene = false;
  private bubbleTint = '#ffffff';
  private dropTint = '#bdf3ff';
  private waveTints: readonly string[] = ['#000', '#000', '#000'];
  private crestTint = '#ffffff';
  private night = true;
  private w = 0;
  private h = 0;
  private t = 0;
  private spotX = 0;
  private spotY = 0;
  private fromY = -1;
  private lastTheme: Theme | null = null;
  // The current thrown arc (water): drops left, launch point and velocity.
  private arcLeft = 0;
  private arcWait = 0.6;
  private arcX = 0;
  private arcY = 0;
  private arcVx = 0;
  private arcVy = 0;

  constructor(sprites: SpriteCache) {
    super(sprites, 640);
    const own: readonly (readonly [string, SpritePainter])[] = [
      ['bubbles:bubble', iridescentBubble], ['bubbles:pop', popBurst], ['bubbles:leaf', greenLeaf],
      ['bubbles:ocean', ocean], ['bubbles:shade', sphereShade], ['bubbles:drop', waterDrop],
      ['bubbles:ripple', rippleRing], ['bubbles:boat', dragonBoat],
      ...LAND_NAMES.map((name, k) => [name, landBlob(k)] as const),
    ];
    for (const [name, painter] of own) if (!sprites.has(name)) sprites.register(name, painter);
  }

  get describe(): string {
    switch (this.variant) {
      case 'earth': return 'Bubbles and green leaves floating past a slowly turning Earth';
      case 'water': return 'Splashes of water arcing through the air into rippling water';
      case 'waves': return 'Dragon boats paddling over rolling waves';
      default: return 'Bubbles rising through the air';
    }
  }

  get earth(): boolean { return this.variant === 'earth'; }
  get water(): boolean { return this.variant === 'water'; }
  get waves(): boolean { return this.variant === 'waves'; }

  // ---------------------------------------------------------------- water surface

  private waterTop(): number {
    return this.h * (this.waves ? 0.6 : 0.8);
  }

  /** Height of wave layer `layer` (0 back … 2 front) at x: two traveling sines on a base line. */
  surface(x: number, layer: number): number {
    const h = this.h;
    const a = h * 0.012 * (1 + 0.3 * layer);
    const base = this.waterTop() + layer * h * 0.055;
    const t = this.t;
    return base + a * Math.sin(x * 0.011 - t * (0.9 + 0.2 * layer) + layer * 1.7) + a * 0.5 * Math.sin(x * 0.027 + t * 1.3 + layer);
  }

  // ---------------------------------------------------------------- particle inits

  private readonly initBubble: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    pool.kind[i] = BUBBLE;
    pool.depth[i] = depth;
    pool.size[i] = quant(10 + 44 * depth * depth, 4);
    pool.aux[i] = 18 + 44 * depth;
    pool.vy[i] = -pool.aux[i]!;
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.18, 0.42);
    pool.alpha[i] = 0.55 + 0.45 * depth;
    if (this.fromY >= 0) {
      pool.y[i] = this.fromY;
      pool.life[i] = 0;
    }
  };

  private readonly initLeaf: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    pool.kind[i] = LEAF;
    pool.depth[i] = depth;
    pool.size[i] = quant(12 + 16 * depth, 2);
    pool.vy[i] = 20 + 22 * depth;
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.3, 0.7);
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -1.4, 1.4);
    pool.color[i] = Math.floor(rand() * LEAF_COLORS.length) % LEAF_COLORS.length;
    pool.alpha[i] = 0.7 + 0.3 * depth;
  };

  /** A drop leaving (spotX, spotY); the caller sets its velocity and landing layer (aux). */
  private readonly initDrop: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = DROP;
    pool.size[i] = quant(range(rand, 11, 21), 2);
    pool.maxLife[i] = 4;
    pool.alpha[i] = range(rand, 0.75, 1);
    pool.aux[i] = this.waves ? 1 : 0;
  };

  private readonly initRipple: ParticleInit = (pool, i) => {
    pool.kind[i] = RIPPLE;
    pool.size[i] = 48;
    pool.maxLife[i] = 1.2;
    pool.depth[i] = 0.3;
    pool.aux[i] = -1;
    pool.alpha[i] = 0;
  };

  private readonly initPop: ParticleInit = (pool, i) => {
    pool.kind[i] = POP;
    pool.maxLife[i] = POP_SECONDS;
    pool.alpha[i] = 1;
  };

  // ---------------------------------------------------------------- setup

  private sync(input: EffectInput): void {
    frameScenery(this.budget, input.budget, SCENERY_END);
    this.w = input.w;
    this.h = input.h;
    this.t = input.t;
    const v = input.params.variant;
    const variant = v === 'earth' || v === 'water' || v === 'waves' ? v : '';
    const onScene = input.params.stage !== undefined;
    if (variant !== this.variant || onScene !== this.onScene) {
      this.variant = variant;
      this.onScene = onScene;
      this.started = false;
    }
    const theme = input.theme;
    if (theme !== this.lastTheme) {
      this.lastTheme = theme;
      this.night = theme.mood === 'night';
      this.bubbleTint = this.night ? '#ffffff' : mixColor('#ffffff', theme.accent, 0.6);
      this.dropTint = this.night ? '#c9f6ff' : mixColor(theme.accent, '#48cae4', 0.25);
      this.waveTints = this.night
        ? [mixColor(theme.bg2, '#9be7d3', 0.32), mixColor(theme.bg1, '#2a9d8f', 0.4), mixColor(theme.bg1, '#03141d', 0.35)]
        : [mixColor(theme.bg2, '#4cc9f0', 0.45), mixColor(theme.bg1, '#0096c7', 0.55), mixColor(theme.bg1, '#0077b6', 0.7)];
      this.crestTint = '#ffffff';
    }
  }

  private bubbleTarget(budget: number): number {
    const share = this.waves ? 0.12 : this.water ? 0.2 : this.earth ? 0.3 : 0.4;
    return Math.max(4, Math.min(budget * share, this.earth ? 40 : 70));
  }

  private leafTarget(budget: number): number {
    return Math.max(3, Math.min(budget * 0.14, 22));
  }

  private start(input: EffectInput, still: boolean): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    this.started = true;
    pool.clear();
    this.arcLeft = 0;
    this.arcWait = 0.4;
    if (this.earth && !this.onScene) {
      const g = globeLayout(w, h);
      spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, (p, i) => {
        p.kind[i] = GLOBE;
        p.size[i] = g.d;
        p.rot[i] = 0.6;
      }, g.x, g.y);
      if (still) for (let k = 0; k < 3; k++) this.plant(w * (0.12 + 0.2 * k) + range(rand, -20, 20), input, true);
    }
    if (this.earth) spawnEdge(pool, 'area', w, h, this.budget.take(this.leafTarget(input.budget) * 0.7), rand, this.initLeaf);
    if (this.waves && !this.onScene) {
      const n = w < 600 ? 1 : 2;
      for (let k = 0; k < n; k++) {
        const near = k === 0;
        const s = quant(clamp(w * (near ? 0.34 : 0.22), 180, near ? 420 : 280), 16);
        spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, (p, i, r) => {
          p.kind[i] = BOAT;
          p.size[i] = s;
          p.depth[i] = near ? 1 : 0.5;
          p.vx[i] = -(near ? 38 : 26);
          p.phase[i] = r() * TAU;
          p.rotV[i] = 0;
        }, near ? w * 0.62 : w * 0.25, 0);
      }
    }
    this.fromY = -1;
    spawnEdge(pool, 'area', w, this.waves ? h * 0.75 : h, this.budget.take(this.bubbleTarget(input.budget) * (still ? 0.85 : 0.7)), rand, this.initBubble);
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === BUBBLE) pool.life[i] = 2;
    if (still && this.water) this.frozenArcs(input);
    this.layoutBoats(0);
  }

  /** Still frame for Songkran: two throws frozen mid-flight, each a curve of drops. */
  private frozenArcs(input: EffectInput): void {
    const { w, rand } = input;
    for (let a = 0; a < 2; a++) {
      this.launchArc(input, a === 0 ? -1 : 1);
      for (let k = 0; k < 12; k++) {
        const tt = 0.35 + k * 0.045 + 0.4 * a;
        const n = spawnEdge(this.pool, 'point', w, this.h, this.budget.take(1), rand, this.initDrop, this.arcX, this.arcY);
        if (n === 0) break;
        const i = this.pool.count - 1;
        const vx = this.arcVx + range(rand, -12, 12);
        const vy = this.arcVy + range(rand, -15, 15);
        this.pool.x[i] = this.arcX + vx * tt;
        this.pool.y[i] = this.arcY + vy * tt + 210 * tt * tt;
        this.pool.vx[i] = vx;
        this.pool.vy[i] = vy + 420 * tt;
      }
    }
    this.arcLeft = 0;
  }

  /** Picks a new throw: from a side (a long arc across the sky) or from the bottom (a fountain). */
  private launchArc(input: EffectInput, side = 0): void {
    const { w, h, rand } = input;
    const fromSide = side !== 0 || rand() < 0.6;
    if (fromSide) {
      const dir = side !== 0 ? side : rand() < 0.5 ? -1 : 1;
      this.arcX = dir < 0 ? -10 : w + 10;
      this.arcY = h * range(rand, 0.45, 0.7);
      this.arcVx = -dir * w * range(rand, 0.32, 0.46);
      this.arcVy = -range(rand, 230, 330);
    } else {
      this.arcX = w * range(rand, 0.3, 0.9);
      this.arcY = this.waterTop();
      this.arcVx = range(rand, -90, 90);
      this.arcVy = -Math.min(520, Math.sqrt(2 * 420 * h * range(rand, 0.4, 0.6)));
    }
    this.arcLeft = Math.round(range(rand, 18, 26));
    this.stream.reset();
  }

  /** Earth: a sprout under x, on the ground; the oldest goes when there are too many. */
  private plant(x: number, input: EffectInput, grown: boolean): void {
    const pool = this.pool;
    let n = 0;
    let oldest = -1;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== SPROUT) continue;
      n++;
      if (oldest < 0 || pool.life[i]! > pool.life[oldest]!) oldest = i;
    }
    if (n >= MAX_SPROUTS && oldest >= 0) pool.kill(oldest);
    if (this.budget.room() < 1) frameScenery(this.budget, Math.max(0, input.budget - 1), SCENERY_END);
    spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, (p, i, r) => {
      p.kind[i] = SPROUT;
      p.size[i] = clamp(input.h * 0.2, 60, 170) * range(r, 0.8, 1.2);
      p.phase[i] = r() * TAU;
      p.rot[i] = range(r, -0.15, 0.15);
      p.life[i] = grown ? SPROUT_GROW + 1 + r() : 0;
    }, clamp(x, 16, input.w - 16), input.h - 2);
  }

  private layoutBoats(dt: number): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== BOAT) continue;
      const s = pool.size[i]!;
      const layer = pool.depth[i]! > 0.8 ? 1 : 0;
      pool.x[i]! += pool.vx[i]! * dt;
      if (pool.x[i]! < -s * 0.6) pool.x[i] = this.w + s * 0.6;
      const x = pool.x[i]!;
      pool.y[i] = this.surface(x, layer) - s * 0.035;
      pool.rot[i] = Math.atan2(this.surface(x + s * 0.3, layer) - this.surface(x - s * 0.3, layer), s * 0.6);
    }
  }

  // ---------------------------------------------------------------- loop

  step(input: EffectInput): void {
    const { w, h, dt, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) this.start(input, false);
    const k = calm(input.intensity);
    this.fromY = this.waves || this.water ? this.waterTop() : -1;
    const rate = steadyRate(this.bubbleTarget(input.budget), (h + 60) / 40, 0.85) * k;
    this.rise.spawn(pool, 'bottom', w, h, rate, dt, rand, this.initBubble, this.budget.room());
    this.fromY = -1;
    if (this.earth) {
      this.fall.spawn(pool, 'top', w, h, steadyRate(this.leafTarget(input.budget), h / 30, 0.85) * k, dt, rand, this.initLeaf, this.budget.room());
    }
    if (this.water) this.throwStep(input, k);
    this.layoutBoats(dt);
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === BUBBLE) {
        sway(pool, i, dt, 5 + 12 * pool.depth[i]!, pool.rotV[i]!);
        integrate(pool, i, dt);
        if (expired(pool, i)) this.pop(i, input);
        else if (pool.y[i]! < -pool.size[i]!) pool.kill(i);
      } else if (kind === LEAF) {
        flutter(pool, i, dt, pool.size[i]! * 0.8, pool.aux[i]!);
        spin(pool, i, dt);
        integrate(pool, i, dt);
        if (pool.y[i]! > h + 20) pool.kill(i);
      } else if (kind === DROP) {
        gravity(pool, i, dt, 420);
        integrate(pool, i, dt);
        const layer = pool.aux[i]!;
        const x = pool.x[i]!;
        if (pool.vy[i]! > 0 && (this.water || this.waves) && pool.y[i]! > this.surface(x, layer)) {
          // Most drops just vanish into the water; a few leave a ripple.
          if (rand() < 0.22 && this.budget.room() > 2) {
            spawnEdge(pool, 'point', w, h, 1, rand, this.initRipple, x, this.surface(x, layer));
            pool.aux[pool.count - 1] = layer;
            pool.size[pool.count - 1] = quant(range(rand, 36, 64), 8);
          }
          pool.kill(i);
        } else if (expired(pool, i) || pool.y[i]! > h + 20 || x < -40 || x > w + 40) pool.kill(i);
      } else if (kind === RIPPLE) {
        pool.life[i]! += dt;
        if (pool.aux[i]! >= 0) pool.y[i] = this.surface(pool.x[i]!, pool.aux[i]!);
        pool.alpha[i] = envelope(pool, i, 0.3, 0.8) * 0.75;
        if (expired(pool, i)) pool.kill(i);
      } else if (kind === POP) {
        pool.life[i]! += dt;
        pool.alpha[i] = 1 - clamp(pool.life[i]! / POP_SECONDS, 0, 1);
        if (expired(pool, i)) pool.kill(i);
      } else if (kind === GLOBE) {
        pool.rot[i]! += dt * 0.12;
      } else if (kind === SPROUT) {
        pool.life[i]! += dt;
      } else if (kind === BOAT) {
        this.paddle(i, input);
      }
    }
  }

  /** Songkran: wait, then stream the current throw's drops out at 40 per second. */
  private throwStep(input: EffectInput, k: number): void {
    const { w, h, dt, rand } = input;
    if (this.arcLeft <= 0) {
      this.arcWait -= dt * k;
      if (this.arcWait > 0) return;
      this.arcWait = range(rand, 0.7, 1.3);
      this.launchArc(input);
    }
    const n = this.stream.spawn(this.pool, 'point', w, h, 40, dt, rand, this.initDrop, Math.min(this.arcLeft, this.budget.room()), this.arcX, this.arcY);
    for (let j = this.pool.count - n; j < this.pool.count; j++) {
      this.pool.vx[j] = this.arcVx + range(rand, -14, 14);
      this.pool.vy[j] = this.arcVy + range(rand, -18, 18);
    }
    this.arcLeft -= n;
  }

  /** Dragon boat crews stroke about once a second; each catch flicks up a few drops. */
  private paddle(i: number, input: EffectInput): void {
    const pool = this.pool;
    const { w, h, dt, rand } = input;
    const prev = Math.sin(pool.phase[i]!);
    pool.phase[i]! += dt * TAU * (pool.depth[i]! > 0.8 ? 1.1 : 0.95);
    if (prev < 0 && Math.sin(pool.phase[i]!) >= 0 && this.budget.room() > 6) {
      const s = pool.size[i]!;
      const layer = pool.depth[i]! > 0.8 ? 1 : 0;
      for (let r = 0; r < ROWERS; r += 2) {
        const x = pool.x[i]! + rowerX(r, s) + s * 0.05;
        const n = spawnEdge(pool, 'point', w, h, 1, rand, this.initDrop, x, this.surface(x, layer) - 2);
        if (n === 0) break;
        const j = pool.count - 1;
        pool.size[j] = quant(s * 0.03, 2);
        pool.vx[j] = range(rand, 30, 80);
        pool.vy[j] = -range(rand, 70, 130);
        pool.aux[j] = layer;
      }
    }
  }

  private pop(i: number, input: EffectInput): void {
    const pool = this.pool;
    const x = pool.x[i]!;
    const y = pool.y[i]!;
    const s = pool.size[i]!;
    pool.kill(i);
    this.popped++;
    if (spawnEdge(pool, 'point', input.w, input.h, this.budget.take(1), input.rand, this.initPop, x, y) > 0) {
      pool.size[pool.count - 1] = quant(s * 1.3, 4);
    }
  }

  /** Marks bubbles within `radius` to pop in a cascade, nearest first (0.06 s per 40 px). */
  private cascade(x: number, y: number, radius: number): number {
    const pool = this.pool;
    let n = 0;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== BUBBLE || pool.maxLife[i]! > 0) continue;
      const d = Math.hypot(pool.x[i]! - x, pool.y[i]! - y);
      if (d > radius + pool.size[i]! * 0.5) continue;
      pool.maxLife[i] = pool.life[i]! + 0.02 + (d / 40) * 0.06;
      n++;
    }
    return n;
  }

  /** A splash crown from (x, y): drops fanning upward, a ring, and they land on `layer`. */
  private splash(x: number, y: number, input: EffectInput, layer: number, round: boolean): void {
    const pool = this.pool;
    const { w, h, rand } = input;
    const n = spawnEdge(pool, 'point', w, h, this.budget.take(18), rand, this.initDrop, x, y);
    for (let j = pool.count - n; j < pool.count; j++) {
      const a = -Math.PI / 2 + range(rand, -1.2, 1.2);
      const v = range(rand, 140, 320);
      pool.vx[j] = Math.cos(a) * v;
      pool.vy[j] = Math.sin(a) * v;
      pool.aux[j] = layer;
    }
    if (spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initRipple, x, y) > 0) {
      const j = pool.count - 1;
      pool.size[j] = 72;
      pool.depth[j] = round ? 1 : 0.3;
      pool.aux[j] = round ? -1 : layer;
    }
    this.splashes++;
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    if (!this.started) this.start(input, false);
    const pool = this.pool;
    if (this.earth) {
      this.cascade(x, y, 170);
      if (!this.onScene) {
        this.plant(x, input, false);
        this.planted++;
      }
      return;
    }
    if (this.water) {
      this.splash(x, y, input, 0, true);
      return;
    }
    if (this.waves && !this.onScene) {
      const surf = this.surface(x, 2);
      if (y > this.surface(x, 0) - 40) this.splash(x, surf, input, 2, false);
      else this.splash(x, y, input, 2, true);
      return;
    }
    this.cascade(x, y, 110);
    this.spotX = x;
    this.spotY = y;
    const n = spawnEdge(pool, 'point', input.w, input.h, this.budget.take(6), input.rand, this.initBubble, x, y);
    for (let j = pool.count - n; j < pool.count; j++) {
      pool.x[j] = this.spotX + range(input.rand, -24, 24);
      pool.y[j] = this.spotY + range(input.rand, -10, 18);
      pool.vy[j]! *= 1.5;
      pool.life[j] = 0.3;
    }
  }

  still(input: EffectInput): void {
    const pool = this.pool;
    this.sync(input);
    this.start(input, true);
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === BUBBLE) pool.phase[i] = 0;
  }

  // ---------------------------------------------------------------- drawing

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    this.t = input.t;
    this.w = input.w;
    this.h = input.h;
    if (this.waves) {
      if (!this.onScene) {
        this.drawWave(ctx, 0);
        this.drawBoats(ctx, 0);
        this.drawWave(ctx, 1);
        this.drawBoats(ctx, 1);
        this.drawWave(ctx, 2);
      }
      this.drawSplashes(ctx);
      this.drawBubbles(ctx, 0, 2);
      this.drawPops(ctx);
      ctx.globalAlpha = 1;
      return;
    }
    this.drawBubbles(ctx, 0, 0.45);
    if (this.earth) this.drawGlobes(ctx);
    if (this.earth) this.drawLeaves(ctx);
    if (this.water && !this.onScene) {
      this.drawWave(ctx, 0);
      this.drawWave(ctx, 1);
    }
    this.drawBubbles(ctx, 0.45, 2);
    if (this.earth) drawSprouts(ctx, this.sprites, this.pool, SPROUT, this.t, this.h, SPROUT_GROW);
    this.drawSplashes(ctx);
    this.drawPops(ctx);
    ctx.globalAlpha = 1;
  }

  private drawBubbles(ctx: CanvasRenderingContext2D, lo: number, hi: number): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const n = pool.count;
    if (this.night) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const d = pool.depth[i]!;
        if (pool.kind[i] !== BUBBLE || d < lo || d >= hi || d < 0.5) continue;
        ctx.globalAlpha = 0.12 * d * this.fade(i);
        sprites.draw(ctx, 'glow', quant(pool.size[i]! * 1.8, 8), '#bdefff', pool.x[i]!, pool.y[i]!);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    for (let i = 0; i < n; i++) {
      const d = pool.depth[i]!;
      if (pool.kind[i] !== BUBBLE || d < lo || d >= hi) continue;
      ctx.globalAlpha = pool.alpha[i]! * this.fade(i);
      const wob = 0.06 * Math.sin(pool.life[i]! * 3.1 + pool.phase[i]! * 2);
      sprites.draw(ctx, 'bubbles:bubble', pool.size[i]!, this.bubbleTint, pool.x[i]!, pool.y[i]!, 0.3 * wob, 1 + wob, 1 - wob);
    }
  }

  private fade(i: number): number {
    return Math.min(1, this.pool.life[i]!);
  }

  private drawPops(ctx: CanvasRenderingContext2D): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== POP) continue;
      const k = 0.7 + 0.6 * (1 - pool.alpha[i]!);
      ctx.globalAlpha = pool.alpha[i]! * 0.9;
      this.sprites.draw(ctx, 'bubbles:pop', pool.size[i]!, this.bubbleTint, pool.x[i]!, pool.y[i]!, 0, k, k);
    }
  }

  private drawLeaves(ctx: CanvasRenderingContext2D): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== LEAF) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      const flip = 0.3 + 0.7 * Math.abs(Math.cos(pool.phase[i]!));
      this.sprites.draw(ctx, 'bubbles:leaf', pool.size[i]!, LEAF_COLORS[pool.color[i]! % LEAF_COLORS.length]!, pool.x[i]!, pool.y[i]!, pool.rot[i]!, flip, 1);
    }
  }

  /** Drops (turned along their flight), their glints on night skies, then ripples. */
  private drawSplashes(ctx: CanvasRenderingContext2D): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const n = pool.count;
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== DROP) continue;
      ctx.globalAlpha = pool.alpha[i]!;
      const v = Math.hypot(pool.vx[i]!, pool.vy[i]!);
      const stretch = 0.8 + Math.min(0.6, v / 600);
      sprites.draw(ctx, 'bubbles:drop', pool.size[i]!, this.dropTint, pool.x[i]!, pool.y[i]!, Math.atan2(pool.vy[i]!, pool.vx[i]!), stretch, 1);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== DROP || (i & 3) !== 0) continue;
      ctx.globalAlpha = this.night ? 0.45 : 0.3;
      sprites.draw(ctx, 'glow', 14, '#ffffff', pool.x[i]!, pool.y[i]!);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] !== RIPPLE) continue;
      const u = clamp(pool.life[i]! / pool.maxLife[i]!, 0, 1);
      const k = 0.3 + 1.2 * easeOut(u);
      ctx.globalAlpha = pool.alpha[i]!;
      sprites.draw(ctx, 'bubbles:ripple', pool.size[i]!, '#ffffff', pool.x[i]!, pool.y[i]!, 0, k, k * pool.depth[i]!);
    }
  }

  /** One wave layer as a filled ribbon plus a crest highlight. */
  private drawWave(ctx: CanvasRenderingContext2D, layer: number): void {
    const { w, h } = this;
    if (w < 1 || h < 1) return;
    ctx.globalAlpha = this.water ? 0.55 + 0.2 * layer : 0.7 + 0.15 * layer;
    ctx.fillStyle = this.waveTints[layer]!;
    ctx.beginPath();
    ctx.moveTo(-10, h + 10);
    for (let x = -10; x <= w + 26; x += 16) ctx.lineTo(x, this.surface(x, layer));
    ctx.lineTo(w + 26, h + 10);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.3 + 0.1 * layer;
    ctx.strokeStyle = this.crestTint;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = -10; x <= w + 26; x += 16) {
      const y = this.surface(x, layer) + 1;
      if (x === -10) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  /** Boats on wave layer `layer`. */
  private drawBoats(ctx: CanvasRenderingContext2D, layer: number): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== BOAT || (pool.depth[i]! > 0.8 ? 1 : 0) !== layer) continue;
      drawBoat(ctx, this.sprites, pool.x[i]!, pool.y[i]!, pool.size[i]!, pool.rot[i]!, pool.phase[i]!);
    }
  }

  private drawGlobes(ctx: CanvasRenderingContext2D): void {
    const pool = this.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] === GLOBE) drawGlobe(ctx, this.sprites, pool.x[i]!, pool.y[i]!, pool.size[i]!, pool.rot[i]!);
    }
  }
}

export const bubbles: EffectFactory = (sprites) => new BubblesEffect(sprites);
