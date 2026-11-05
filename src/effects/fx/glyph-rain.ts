/**
 * glyph-rain — little pictures (`params.glyphs`) drifting down, with two special variants.
 * Default: a gentle rain of outlined emoji in three depths (far: small, slow, faint), each rocking on its
 *   own flutter; soft twinkling motes on night skies. Tap: a little fountain of glyphs pops up from the
 *   finger and drifts down with the rest.
 * Variant 'chalk' (Pi Day): a chalkboard — eraser smudges and faint chalk formulas as the ambient
 *   texture; the digits of π fall in reading order, a row at a time (3 . 1 4 1 5 9 2 6 …), in chalk
 *   with the odd colored digit; π symbols tumble; lattice pies drift down, slowly rotating.
 *   Tap: "3.14159…" bursts out along a spiral from the finger. Secret: three taps within 1.6 s rains
 *   100 digits of π.
 * Variant 'hop' (Leap Day): frogs drift down; now and then one leaps mid-air. Tap: the nearest frog
 *   (or a new one, if none is close) hops away from the finger in three bouncy arcs, squashing as it
 *   lands and stretching as it takes off.
 * Behaviors: flutter + terminal fall (glyphs, digits), spin (pies, π), ballistic arcs (hops, puffs),
 *   spiral (π burst), twinkle (motes).
 * Still: glyphs scattered across the sky — on the chalkboard, rows of π digits, pies and the formulas.
 * Scene mode (`params.stage`): the scene is the board and the bake sale, so the chalk variant keeps only its
 *   falling digits (the smudges, formulas, corner circle and drifting pies go).
 * Params: glyphs, variant ('chalk' | 'hop'), stage, density.
 */
import { chalkSmudge, chalkText, frameScenery, quant } from '../painters/extra-whimsy';
import {
  Emitter, TAU, clamp, envelope, expired, flutter, integrate, range, spawnEdge, spin, steadyRate, twinkle,
  type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { GlyphSet, PooledEffect, calm } from './shared';

export const SMUDGE = 0;
export const FORMULA = 1;
const SCENERY_END = 2;
export const GLYPH = 2;
export const DIGIT = 3;
export const PIE = 4;
export const SPIRAL = 5;
export const MOTE = 6;
export const PUFF = 7;
export const HOP = 8;
export const TRAIL = 9;

/** π to 200 decimal places, the source of every falling digit. */
export const PI_DIGITS =
  '3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196';
const CHARS = '0123456789.π';
const FORMULAS = ['C = 2πr', 'A = πr²', 'π ≈ 22/7', 'π = C ÷ d'] as const;
const CHAR_NAMES: readonly string[] = Array.from(CHARS, (c) => `glyph-rain:chalk:${c}`);
const FORMULA_NAMES: readonly string[] = FORMULAS.map((f) => `glyph-rain:chalk:${f}`);
const CHALK = ['#f2f2e9', '#ffe9a3', '#9be7d3', '#ffb3c6'] as const;
const PIE_FILLINGS = ['#c8102e', '#5a4bc4', '#e9a23b'] as const;
/** Three taps within this window rain 100 digits. */
const SECRET_WINDOW = 1.6;
const SECRET_DIGITS = 100;
const ROW_SECONDS = 4.2;
const ROW_SPEED = 22;
const SPIRAL_DIGITS = 24;

export function charIndex(c: string): number {
  const k = CHARS.indexOf(c);
  return k < 0 ? 11 : k;
}

export class GlyphRainEffect extends PooledEffect {
  readonly describe: string = 'Little pictures raining gently from the sky';
  /** Next π digit to fall (wraps). */
  piCursor = 0;
  /** Times the secret 100-digit rain has fired (tests). */
  secretRains = 0;
  /** Frog hops started by taps (tests). */
  hops = 0;
  /** Digits still to rain from the secret. */
  rainLeft = 0;

  private readonly glyphs = new GlyphSet();
  private readonly rain = new Emitter();
  private readonly pies = new Emitter();
  private readonly secret = new Emitter();
  private readonly taps = new Float64Array(3);
  private tapCount = 0;
  private variant = '';
  private started = false;
  private nextRow = 0;
  private spotX = 0;
  private spotY = 0;
  private spiralK = 0;

  constructor(sprites: SpriteCache) {
    super(sprites, 768);
    if (!sprites.has('glyph-rain:smudge')) sprites.register('glyph-rain:smudge', chalkSmudge);
    for (const [k, c] of Array.from(CHARS).entries()) {
      if (!sprites.has(CHAR_NAMES[k]!)) sprites.register(CHAR_NAMES[k]!, chalkText(c));
    }
    for (const [k, f] of FORMULAS.entries()) {
      if (!sprites.has(FORMULA_NAMES[k]!)) sprites.register(FORMULA_NAMES[k]!, chalkText(f, 0.17));
    }
  }

  get chalk(): boolean {
    return this.variant === 'chalk';
  }

  get hop(): boolean {
    return this.variant === 'hop';
  }

  // ---------------------------------------------------------------- particle inits

  private readonly initGlyph: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    pool.kind[i] = GLYPH;
    pool.depth[i] = depth;
    pool.size[i] = this.chalk ? quant(26 + 22 * depth, 4) : quant(18 + 24 * depth, 4);
    pool.aux[i] = 20 + 34 * depth;
    pool.vy[i] = pool.aux[i]!;
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.35, 0.7);
    pool.rot[i] = range(rand, -0.4, 0.4);
    pool.alpha[i] = 0.6 + 0.4 * depth;
    pool.color[i] = this.glyphs.pick(rand);
  };

  private readonly initDigit: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = DIGIT;
    pool.depth[i] = 0.8;
    pool.size[i] = 28;
    pool.aux[i] = ROW_SPEED;
    pool.vy[i] = ROW_SPEED;
    pool.phase[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -0.12, 0.12);
    pool.alpha[i] = 0.92;
    pool.color[i] = charIndex(PI_DIGITS[this.piCursor % PI_DIGITS.length]!);
    pool.maxLife[i] = 0;
    // Digits never rotate, so `rot` holds the chalk color: mostly white, every seventh in a pastel.
    pool.rot[i] = this.piCursor % 7 === 3 ? 1 + (this.piCursor % 3) : 0;
    this.piCursor = (this.piCursor + 1) % PI_DIGITS.length;
  };

  private readonly initRainDigit: ParticleInit = (pool, i, rand) => {
    this.initDigit(pool, i, rand);
    pool.size[i] = quant(range(rand, 22, 38), 4);
    pool.aux[i] = range(rand, 70, 130);
    pool.vy[i] = pool.aux[i]!;
    pool.depth[i] = 0.9;
  };

  private readonly initPie: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    pool.kind[i] = PIE;
    pool.depth[i] = depth;
    pool.size[i] = quant(48 + 40 * depth, 8);
    pool.vy[i] = 14 + 16 * depth;
    pool.vx[i] = range(rand, -6, 6);
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, 0.25, 0.6) * (rand() < 0.5 ? -1 : 1);
    pool.color[i] = Math.floor(rand() * PIE_FILLINGS.length) % PIE_FILLINGS.length;
    pool.alpha[i] = 0.8 + 0.2 * depth;
  };

  private readonly initSpiral: ParticleInit = (pool, i) => {
    const k = this.spiralK++;
    pool.kind[i] = SPIRAL;
    pool.vx[i] = this.spotX;
    pool.vy[i] = this.spotY;
    pool.aux[i] = k;
    pool.size[i] = k === 0 ? 40 : 28;
    pool.color[i] = charIndex(PI_DIGITS[k % PI_DIGITS.length]!);
    pool.rot[i] = 1;
    pool.maxLife[i] = 3.2;
    pool.alpha[i] = 0;
  };

  private readonly initMote: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = MOTE;
    pool.size[i] = range(rand, 2, 4);
    pool.phase[i] = rand() * TAU;
    pool.aux[i] = range(rand, 0.2, 0.6);
    pool.vy[i] = range(rand, -6, 6);
    pool.vx[i] = range(rand, -5, 5);
    pool.depth[i] = range(rand, 0.4, 0.9);
  };

  private readonly initPuff: ParticleInit = (pool, i, rand) => {
    const a = -Math.PI / 2 + range(rand, -0.9, 0.9);
    const v = range(rand, 160, 300);
    pool.kind[i] = PUFF;
    pool.vx[i] = Math.cos(a) * v;
    pool.vy[i] = Math.sin(a) * v;
    pool.size[i] = quant(range(rand, 22, 34), 4);
    pool.rot[i] = range(rand, -0.5, 0.5);
    pool.rotV[i] = range(rand, -2, 2);
    pool.maxLife[i] = range(rand, 2.2, 3);
    pool.color[i] = this.glyphs.pick(rand);
    pool.depth[i] = 1;
  };

  private readonly initTrail: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = TRAIL;
    pool.size[i] = range(rand, 3, 5);
    pool.maxLife[i] = 0.7;
    pool.alpha[i] = 0;
  };

  private readonly initFormula: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = FORMULA;
    pool.size[i] = 168;
    pool.rot[i] = range(rand, -0.12, 0.12);
    pool.alpha[i] = range(rand, 0.2, 0.28);
  };

  private readonly initSmudge: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = SMUDGE;
    pool.size[i] = quant(range(rand, 220, 420), 40);
    pool.rot[i] = range(rand, -0.25, 0.25);
    pool.alpha[i] = range(rand, 0.18, 0.34);
  };

  // ---------------------------------------------------------------- setup

  private sync(input: EffectInput): void {
    frameScenery(this.budget, input.budget, SCENERY_END);
    this.glyphs.sync(input);
    const v = input.params.variant === 'chalk' || input.params.variant === 'hop' ? input.params.variant : '';
    if (v !== this.variant) {
      this.variant = v;
      this.started = false;
    }
    if (this.chalk) this.registerChalkGlyphs();
    // Into or out of scene mode: start over with the right set.
    if (this.scene.sync(input) !== this.sceneOn) {
      this.sceneOn = this.scene.on;
      this.started = false;
    }
  }
  private sceneOn = false;

  /** On the chalkboard the custom glyphs are written in chalk too (registered once per glyph set). */
  private registered: readonly string[] | null = null;
  /** `params.glyphs` as chalk sprite names (built when the glyph set changes, never per frame). */
  private chalkNames: readonly string[] = [];
  private registerChalkGlyphs(): void {
    const names = this.glyphs.names;
    if (names === this.registered) return;
    this.registered = names;
    this.chalkNames = names.map((name) => `glyph-rain:chalk:${name.slice(6)}`);
    for (const [k, name] of names.entries()) {
      const chalkName = this.chalkNames[k]!;
      if (!this.sprites.has(chalkName)) this.sprites.register(chalkName, chalkText(name.slice(6)));
    }
  }

  private chalkName(index: number): string {
    return this.chalkNames.length === 0 ? CHAR_NAMES[11]! : this.chalkNames[index % this.chalkNames.length]!;
  }

  /** The chalkboard: smudges and formulas, placed on a loose grid so they never pile up. */
  private board(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    const smudges = w < 600 ? 3 : 6;
    for (let k = 0; k < smudges; k++) {
      const x = ((k + 0.2 + 0.6 * rand()) / smudges) * w;
      spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initSmudge, x, h * range(rand, 0.1, 0.8));
    }
    const formulas = w < 600 ? 2 : 4;
    for (let k = 0; k < formulas; k++) {
      const x = ((k + 0.5) / formulas) * w + range(rand, -30, 30);
      const n = spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initFormula, x, h * (k % 2 === 0 ? 0.16 : 0.5) + range(rand, -20, 20));
      if (n > 0) pool.color[pool.count - 1] = k % FORMULAS.length;
    }
  }

  /** One row of π digits across the top, evenly spaced so it reads left to right. */
  private row(input: EffectInput, y: number): void {
    const { w, h, rand } = input;
    const n = Math.max(4, Math.min(11, Math.floor(w / 112)));
    const take = this.budget.take(n);
    const gap = w / (n + 1);
    for (let k = 0; k < take; k++) {
      spawnEdge(this.pool, 'point', w, h, 1, rand, this.initDigit, gap * (k + 1) + range(rand, -6, 6), y + range(rand, -5, 5));
    }
  }

  private start(input: EffectInput, still: boolean): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    this.started = true;
    pool.clear();
    this.piCursor = 0;
    if (this.chalk) {
      if (!this.scene.on) this.board(input);
      const gap = ROW_SPEED * ROW_SECONDS;
      const rows = Math.max(1, Math.floor((h * 0.85) / gap));
      for (let r = rows - 1; r >= 0; r--) this.row(input, h * 0.06 + r * gap);
      this.nextRow = ROW_SECONDS;
      if (!this.scene.on) spawnEdge(pool, 'area', w, h, this.budget.take(w < 600 ? 2 : 4), rand, this.initPie);
      if (this.glyphs.active) spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.08), rand, this.initGlyph);
    } else {
      spawnEdge(pool, 'area', w, h, this.budget.take(this.glyphTarget(input.budget) * (still ? 0.8 : 0.7)), rand, this.initGlyph);
    }
    if (input.theme.mood === 'night') spawnEdge(pool, 'area', w, h, this.budget.take(clamp(input.budget * 0.08, 4, 24)), rand, this.initMote);
  }

  private glyphTarget(budget: number): number {
    return Math.max(6, Math.min(budget * 0.5, this.hop ? 38 : 70));
  }

  // ---------------------------------------------------------------- loop

  step(input: EffectInput): void {
    const { w, h, dt, rand } = input;
    const pool = this.pool;
    this.sync(input);
    if (!this.started) this.start(input, false);
    const k = calm(input.intensity);
    if (this.chalk) {
      this.nextRow -= dt * k;
      if (this.nextRow <= 0) {
        this.nextRow += ROW_SECONDS;
        this.row(input, -20);
      }
      if (!this.scene.on) this.pies.spawn(pool, 'top', w, h, (w < 600 ? 0.05 : 0.1) * k, dt, rand, this.initPie, this.budget.room());
      if (this.glyphs.active) this.rain.spawn(pool, 'top', w, h, 0.25 * k, dt, rand, this.initGlyph, this.budget.room());
      if (this.rainLeft > 0) {
        const n = this.secret.spawn(pool, 'top', w, h, 45, dt, rand, this.initRainDigit, Math.min(this.rainLeft, this.budget.room()));
        this.rainLeft -= n;
      }
    } else {
      const rate = steadyRate(this.glyphTarget(input.budget), h / 38, 0.9) * k;
      this.rain.spawn(pool, 'top', w, h, rate, dt, rand, this.initGlyph, this.budget.room());
    }
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (kind === GLYPH) {
        flutter(pool, i, dt, 4 + 6 * pool.depth[i]!, pool.rotV[i]!);
        pool.vy[i] = pool.aux[i]!;
        integrate(pool, i, dt);
        if (this.hop && rand() < dt * 0.07) this.leap(i, rand);
        if (pool.y[i]! > h + pool.size[i]!) pool.kill(i);
      } else if (kind === DIGIT) {
        pool.phase[i]! += dt * 0.9;
        pool.x[i]! += Math.cos(pool.phase[i]!) * 3 * dt;
        integrate(pool, i, dt);
        if (pool.y[i]! > h + 30) pool.kill(i);
      } else if (kind === PIE) {
        spin(pool, i, dt);
        integrate(pool, i, dt);
        if (pool.y[i]! > h + pool.size[i]!) pool.kill(i);
      } else if (kind === SPIRAL) {
        pool.life[i]! += dt;
        this.spiralAt(i);
        pool.alpha[i] = envelope(pool, i, 0.3, 0.9);
        if (expired(pool, i)) pool.kill(i);
      } else if (kind === MOTE) {
        integrate(pool, i, dt);
        twinkle(pool, i, pool.aux[i]!, 0.7, pool.depth[i]!);
        if (pool.x[i]! < -10) pool.x[i] = w + 10;
        else if (pool.x[i]! > w + 10) pool.x[i] = -10;
        if (pool.y[i]! < -10) pool.y[i] = h + 10;
        else if (pool.y[i]! > h + 10) pool.y[i] = -10;
      } else if (kind === PUFF) {
        pool.vy[i] = Math.min(60, pool.vy[i]! + 260 * dt);
        pool.vx[i]! *= Math.max(0, 1 - 1.5 * dt);
        spin(pool, i, dt);
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0.05, 0.8);
        if (expired(pool, i) || pool.y[i]! > h + 40) pool.kill(i);
      } else if (kind === HOP) {
        this.hopStep(i, input);
      } else if (kind === TRAIL) {
        pool.life[i]! += dt;
        pool.alpha[i] = envelope(pool, i, 0, 0.6) * 0.8;
        if (expired(pool, i)) pool.kill(i);
      }
    }
  }

  /** Spiral burst: digit k sits on an Archimedean spiral that unwinds outward as it ages. */
  private spiralAt(i: number): void {
    const pool = this.pool;
    const k = pool.aux[i]!;
    const grow = 1 - Math.pow(1 - clamp(pool.life[i]! / 1.1, 0, 1), 3);
    const theta = k * 0.52 + pool.life[i]! * 0.35;
    const r = (14 + k * 6.5) * grow;
    pool.x[i] = pool.vx[i]! + Math.cos(theta) * r;
    pool.y[i] = pool.vy[i]! + Math.sin(theta) * r;
  }

  /** Starts a hop: three arcs, each landing back on the line it took off from (aux), away from x0. */
  private leap(i: number, rand: () => number, away = 0): void {
    const pool = this.pool;
    pool.kind[i] = HOP;
    const dir = away !== 0 ? away : rand() < 0.5 ? -1 : 1;
    pool.vx[i] = dir * range(rand, 70, 110);
    pool.vy[i] = -range(rand, 230, 290);
    pool.aux[i] = pool.y[i]!;
    pool.maxLife[i] = 3;
    pool.life[i] = 0;
    pool.phase[i] = 0;
  }

  private hopStep(i: number, input: EffectInput): void {
    const pool = this.pool;
    const { dt, h } = input;
    // A dotted trail of sparkles marks the arc while the frog is in the air.
    if (pool.phase[i]! <= 0 && input.rand() < dt * 18 && this.budget.room() > 4) {
      spawnEdge(pool, 'point', input.w, h, 1, input.rand, this.initTrail, pool.x[i]!, pool.y[i]! + pool.size[i]! * 0.3);
    }
    pool.vy[i]! += 520 * dt;
    pool.x[i]! += pool.vx[i]! * dt;
    pool.y[i]! += pool.vy[i]! * dt;
    pool.life[i]! += dt;
    pool.phase[i] = Math.max(0, pool.phase[i]! - dt * 4);
    pool.rot[i] = clamp(pool.vx[i]! * 0.002 * (pool.vy[i]! < 0 ? -1 : 1), -0.4, 0.4);
    if (pool.vy[i]! > 0 && pool.y[i]! >= pool.aux[i]!) {
      pool.y[i] = pool.aux[i]!;
      pool.maxLife[i]! -= 1;
      pool.phase[i] = 1;
      if (pool.maxLife[i]! <= 0) {
        // Back to drifting down with the rain.
        pool.kind[i] = GLYPH;
        pool.vx[i] = 0;
        pool.aux[i] = 30 + 24 * pool.depth[i]!;
        pool.vy[i] = pool.aux[i]!;
        pool.maxLife[i] = 0;
        pool.rot[i] = 0;
      } else {
        pool.vy[i] = -(200 + 40 * pool.maxLife[i]!);
      }
    }
    if (pool.y[i]! > h + 60) pool.kill(i);
  }

  tap(x: number, y: number, input: EffectInput): void {
    this.sync(input);
    if (!this.started) this.start(input, false);
    const pool = this.pool;
    const { w, h, rand } = input;
    if (this.chalk) {
      this.spotX = x;
      this.spotY = y;
      this.spiralK = 0;
      spawnEdge(pool, 'point', w, h, this.budget.take(SPIRAL_DIGITS), rand, this.initSpiral, x, y);
      this.taps[this.tapCount % 3] = input.t;
      this.tapCount++;
      const oldest = this.taps[this.tapCount % 3]!;
      if (this.tapCount >= 3 && input.t - oldest <= SECRET_WINDOW) {
        this.rainLeft = SECRET_DIGITS;
        this.secretRains++;
        this.tapCount = 0;
      }
      return;
    }
    if (this.hop) {
      let best = -1;
      let bestD = 150 * 150;
      for (let i = 0; i < pool.count; i++) {
        if (pool.kind[i] !== GLYPH) continue;
        const dx = pool.x[i]! - x;
        const dy = pool.y[i]! - y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best < 0 && spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initGlyph, x, y) > 0) {
        best = pool.count - 1;
        pool.depth[best] = 1;
        pool.size[best] = 44;
        pool.alpha[best] = 1;
      }
      if (best >= 0) {
        this.leap(best, rand, pool.x[best]! < x ? -1 : 1);
        this.hops++;
      }
      return;
    }
    spawnEdge(pool, 'point', w, h, this.budget.take(8), rand, this.initPuff, x, y);
  }

  still(input: EffectInput): void {
    const pool = this.pool;
    this.sync(input);
    this.start(input, true);
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === MOTE) twinkle(pool, i, pool.aux[i]!, 0.7, pool.depth[i]!);
  }

  // ---------------------------------------------------------------- drawing

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const n = pool.count;
    const ink = input.theme.ink;
    if (this.chalk && !this.scene.on) this.drawBoard(ctx, input);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      if (pool.kind[i] === MOTE) {
        ctx.globalAlpha = pool.alpha[i]! * 0.8;
        sprites.draw(ctx, 'glow', quant(pool.size[i]! * 4, 4), input.theme.glow, pool.x[i]!, pool.y[i]!);
      } else if (pool.kind[i] === TRAIL) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'glow', 12, '#d9ff8a', pool.x[i]!, pool.y[i]!);
      } else if (pool.kind[i] === SPIRAL) {
        ctx.globalAlpha = pool.alpha[i]! * 0.35;
        sprites.draw(ctx, 'glow', 40, '#ffd166', pool.x[i]!, pool.y[i]!);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < n; i++) {
      const kind = pool.kind[i];
      const x = pool.x[i]!;
      const y = pool.y[i]!;
      if (kind === GLYPH || kind === PUFF || kind === HOP) {
        ctx.globalAlpha = pool.alpha[i]!;
        const name = this.chalk ? this.chalkName(pool.color[i]!) : this.glyphs.name(pool.color[i]!);
        if (kind === HOP) {
          // Squash on landing, stretch while rising.
          const sq = pool.phase[i]!;
          const up = pool.vy[i]! < 0 ? 0.12 : 0;
          sprites.draw(ctx, name, pool.size[i]!, ink, x, y, pool.rot[i]!, 1 + 0.25 * sq - up, 1 - 0.3 * sq + up);
        } else {
          const rock = kind === GLYPH ? 0.25 * Math.sin(pool.phase[i]!) + pool.rot[i]! * 0.3 : pool.rot[i]!;
          sprites.draw(ctx, name, pool.size[i]!, this.chalk ? CHALK[0] : ink, x, y, rock);
        }
      } else if (kind === PIE) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'pie', pool.size[i]!, PIE_FILLINGS[pool.color[i]! % PIE_FILLINGS.length]!, x, y, pool.rot[i]!);
      } else if (kind === DIGIT || kind === SPIRAL) {
        ctx.globalAlpha = pool.alpha[i]!;
        const tint = CHALK[Math.round(pool.rot[i]!) % CHALK.length]!;
        const lean = kind === DIGIT ? Math.sin(pool.phase[i]!) * 0.08 : 0;
        sprites.draw(ctx, CHAR_NAMES[pool.color[i]! % CHAR_NAMES.length]!, pool.size[i]!, tint, x, y, lean);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawBoard(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i];
      if (kind === SMUDGE) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'glyph-rain:smudge', pool.size[i]!, '#f2f2e9', pool.x[i]!, pool.y[i]!, pool.rot[i]!);
      } else if (kind === FORMULA) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, FORMULA_NAMES[pool.color[i]! % FORMULA_NAMES.length]!, pool.size[i]!, '#f2f2e9', pool.x[i]!, pool.y[i]!, pool.rot[i]!);
      }
    }
    // A chalk circle with its diameter, sketched once in the corner of the board.
    const { w, h } = input;
    const r = clamp(Math.min(w, h) * 0.09, 26, 70);
    const cx = w - r * 1.6;
    const cy = h * 0.3;
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#f2f2e9';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0.15, TAU - 0.05);
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export const glyphRain: EffectFactory = (sprites) => new GlyphRainEffect(sprites);
