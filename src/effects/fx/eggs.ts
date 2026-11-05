/**
 * eggs — patterned eggs hopping through spring grass.
 * Ambient: a meadow of grass tufts in two rows (back darker, front brighter) sways along the bottom;
 *   pastel eggs with bands, dots, zigzags or stripes waddle along it, nestled between the rows, and hop
 *   now and then with a squash on landing, wrapping round the edges. Blossom petals flutter down from
 *   the top. Every ~9 s a pair of bunny ears peeks up from behind the grass, wiggles, and ducks again.
 * Behaviors: gravity + hop timer + squash (eggs); gravity + flutter + spin (petals, confetti, shells).
 * Tap an egg: it cracks — the top of the shell pops off and spins away, a burst of pastel confetti flies
 *   up, and a chick (🐥 glyph sprite) jumps out, hops about and fades; a new egg hops in from the edge a
 *   few seconds later. Tapping the meadow elsewhere throws a ring of petals and makes nearby eggs hop.
 *   `cracked` counts cracks so the UI may show a fun-fact toast.
 * Still: eggs resting in the grass, petals frozen mid-air, the bunny ears up.
 * Params: palette (egg colors; Orthodox Easter passes red and gold), density.
 */
import type { Theme } from '../../theme/themes';
import { bunnyEars, eggHalf, grassTuft } from '../painters/extra-day';
import {
  Emitter, TAU, clamp, drag, envelope, expired, flutter, gravity, integrate, range, spawnEdge, steadyRate,
  type ParticleInit,
} from '../particles';
import type { EffectFactory, EffectInput, SpriteCache } from '../types';
import { Palette, PooledEffect, calm } from './shared';

export const PETAL = 0;
export const SHELL = 1;
export const CHICK = 2;
export const CONFETTI = 3;
/** Eggs are EGG + pattern (0–3). */
export const EGG = 10;

export const PASTELS: readonly string[] = ['#ffafcc', '#a2d2ff', '#b9fbc0', '#fdffb6', '#cdb4db', '#ffd6a5'];
const PETALS_DAY = ['#ffb3c6', '#ffffff', '#ffd6e0', '#e9ddff'] as const;
const PATTERNS = ['eggPattern0', 'eggPattern1', 'eggPattern2', 'eggPattern3'] as const;
const CHICK_GLYPH = 'glyph:🐥';
const EAR_PERIOD = 9;
const GRASS_BACK = '#4caf50';
const GRASS_FRONT = '#7ed957';

export function isEgg(kind: number): boolean {
  return kind >= EGG && kind < EGG + 4;
}

function pastels(_theme: Theme): readonly string[] {
  return PASTELS;
}

export class EggsEffect extends PooledEffect {
  readonly describe = 'Patterned eggs hopping through spring grass';
  /** Eggs cracked by taps (the UI may react with a fact toast). */
  cracked = 0;

  private readonly palette = new Palette();
  private readonly petals = new Emitter();
  private started = false;
  private still0 = false;
  private respawnAt = 0;
  private tuft = 50;
  private eggSize = 56;
  private eggGround = 0;
  private emitX = 0;
  private emitY = 0;
  private emitColor = 0;
  private ringAngle = 0;

  constructor(sprites: SpriteCache) {
    super(sprites);
    if (!sprites.has('eggs:grass')) sprites.register('eggs:grass', grassTuft);
    if (!sprites.has('eggs:half')) sprites.register('eggs:half', eggHalf);
    if (!sprites.has('eggs:ears')) sprites.register('eggs:ears', bunnyEars);
  }

  private readonly initPetal: ParticleInit = (pool, i, rand) => {
    const depth = rand();
    pool.kind[i] = PETAL;
    pool.depth[i] = depth;
    // About one in eight is a whole blossom (color index + 50), the rest single petals.
    pool.size[i] = 11 + 15 * depth;
    pool.vy[i] = 16 + 26 * depth;
    pool.aux[i] = 16 + 26 * depth;
    pool.phase[i] = rand() * TAU;
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -1.5, 1.5);
    pool.alpha[i] = 0.6 + 0.4 * depth;
    pool.color[i] = Math.floor(rand() * PETALS_DAY.length);
    if (rand() < 0.12) {
      pool.color[i] += 50;
      pool.size[i]! += 8;
    }
  };

  private readonly initEgg: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = EGG + Math.floor(rand() * 4);
    pool.size[i] = Math.round(this.eggSize * range(rand, 0.88, 1.12));
    pool.vx[i] = (rand() < 0.5 ? -1 : 1) * range(rand, 16, 30);
    pool.vy[i] = 0;
    pool.aux[i] = this.eggGround - pool.size[i]! * 0.5;
    pool.y[i] = pool.aux[i]!;
    pool.phase[i] = range(rand, 0.3, 2.2);
    pool.depth[i] = rand() * TAU;
    pool.rotV[i] = 0;
    pool.color[i] = this.palette.pick(rand);
  };

  private readonly initShell: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = SHELL;
    pool.size[i] = this.eggSize;
    pool.vx[i] = range(rand, -90, 90);
    pool.vy[i] = -range(rand, 300, 380);
    pool.rotV[i] = range(rand, -6, 6);
    pool.maxLife[i] = 1.6;
    pool.color[i] = this.emitColor;
  };

  private readonly initChick: ParticleInit = (pool, i, rand) => {
    pool.kind[i] = CHICK;
    pool.size[i] = Math.round(this.eggSize * 0.85);
    pool.vx[i] = range(rand, -30, 30);
    pool.vy[i] = -260;
    pool.aux[i] = this.emitY;
    pool.phase[i] = 0.5;
    pool.maxLife[i] = 4;
  };

  private readonly initConfetti: ParticleInit = (pool, i, rand) => {
    const a = -Math.PI / 2 + range(rand, -1.1, 1.1);
    const speed = range(rand, 200, 420);
    pool.kind[i] = CONFETTI;
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed;
    pool.size[i] = range(rand, 7, 11);
    pool.phase[i] = rand() * TAU;
    pool.rot[i] = rand() * TAU;
    pool.rotV[i] = range(rand, -6, 6);
    pool.maxLife[i] = range(rand, 1.6, 2.4);
    pool.color[i] = rand() < 0.5 ? this.emitColor : Math.floor(rand() * 6) + 100;
  };

  private readonly initRing: ParticleInit = (pool, i, rand) => {
    const a = this.ringAngle;
    const speed = range(rand, 150, 210);
    this.initPetal(pool, i, rand);
    pool.depth[i] = 1;
    pool.size[i] = range(rand, 14, 20);
    pool.vx[i] = Math.cos(a) * speed;
    pool.vy[i] = Math.sin(a) * speed;
    pool.rot[i] = a + Math.PI / 2;
    pool.alpha[i] = 1;
  };

  private sync(input: EffectInput): void {
    const h = input.h;
    this.budget.frame(input.budget);
    this.palette.sync(input, pastels);
    this.tuft = Math.round(clamp(h * 0.09, 34, 64));
    this.eggSize = Math.round(clamp(h * 0.1, 38, 76));
    this.eggGround = h - this.tuft * 0.32;
  }

  private wantedEggs(w: number): number {
    return clamp(Math.round(w / 160), 3, 9);
  }

  private countEggs(): number {
    const pool = this.pool;
    let n = 0;
    for (let i = 0; i < pool.count; i++) if (isEgg(pool.kind[i]!)) n++;
    return n;
  }

  private colorOf(index: number): string {
    return index >= 100 ? PASTELS[(index - 100) % PASTELS.length]! : this.palette.color(index);
  }

  step(input: EffectInput): void {
    const { w, h, dt, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    const wanted = this.wantedEggs(w);
    if (!this.started) {
      this.started = true;
      const n = this.budget.take(wanted);
      for (let k = 0; k < n; k++) spawnEdge(pool, 'point', w, h, 1, rand, this.initEgg, w * (k + range(rand, 0.2, 0.8)) / n, 0);
      spawnEdge(pool, 'area', w, h, this.budget.take(input.budget * 0.3), rand, this.initPetal);
    }
    let eggs = this.countEggs();
    if (eggs < wanted && t >= this.respawnAt) {
      const fromLeft = rand() < 0.5;
      if (spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initEgg, fromLeft ? -this.eggSize : w + this.eggSize, 0) > 0) {
        const i = pool.count - 1;
        pool.vx[i] = Math.abs(pool.vx[i]!) * (fromLeft ? 1 : -1);
        eggs++;
      }
      this.respawnAt = t + 1.2;
    }
    const k = calm(input.intensity);
    this.petals.spawn(pool, 'top', w, h, steadyRate(input.budget * 0.6, h / 32, 0.8) * k, dt, rand, this.initPetal, this.budget.take(99, wanted - eggs + 4));
    for (let i = pool.count - 1; i >= 0; i--) {
      const kind = pool.kind[i]!;
      if (isEgg(kind)) {
        this.stepEgg(i, input);
      } else if (kind === PETAL) {
        const depth = pool.depth[i]!;
        gravity(pool, i, dt, 60, pool.aux[i]!);
        drag(pool, i, dt, 0.25);
        flutter(pool, i, dt, pool.size[i]! * 0.8, 0.4 + 0.3 * depth);
        pool.x[i]! += (8 + 10 * Math.sin(t * 0.25)) * depth * dt;
        pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        if (pool.y[i]! > h + 20 || pool.x[i]! < -40 || pool.x[i]! > w + 40) pool.kill(i);
      } else if (kind === CHICK) {
        gravity(pool, i, dt, 800);
        integrate(pool, i, dt);
        if (pool.y[i]! >= pool.aux[i]! && pool.vy[i]! > 0) {
          pool.y[i] = pool.aux[i]!;
          pool.vy[i] = 0;
          pool.phase[i]! -= dt;
          if (pool.phase[i]! <= 0) {
            pool.vy[i] = -range(rand, 140, 200);
            pool.vx[i] = range(rand, -50, 50);
            pool.phase[i] = range(rand, 0.4, 0.9);
          } else {
            pool.vx[i] = 0;
          }
        }
        pool.alpha[i] = envelope(pool, i, 0, 0.8);
        if (expired(pool, i)) pool.kill(i);
      } else {
        gravity(pool, i, dt, kind === SHELL ? 700 : 380, kind === SHELL ? 900 : 140);
        drag(pool, i, dt, kind === SHELL ? 0.2 : 0.9);
        if (kind === CONFETTI) flutter(pool, i, dt, pool.size[i]! * 0.5, 1.6);
        pool.rot[i]! += pool.rotV[i]! * dt;
        integrate(pool, i, dt);
        pool.alpha[i] = envelope(pool, i, 0, 0.6);
        if (expired(pool, i) || pool.y[i]! > h + 30) pool.kill(i);
      }
    }
  }

  private stepEgg(i: number, input: EffectInput): void {
    const { w, dt, rand } = input;
    const pool = this.pool;
    const base = this.eggGround - pool.size[i]! * 0.5;
    pool.aux[i] = base;
    pool.life[i]! += dt;
    pool.rotV[i] = Math.max(0, pool.rotV[i]! - dt);
    const airborne = pool.y[i]! < base - 0.5 || pool.vy[i]! < 0;
    if (airborne) {
      gravity(pool, i, dt, 760);
      pool.y[i]! += pool.vy[i]! * dt;
      pool.x[i]! += pool.vx[i]! * 1.8 * dt;
      if (pool.y[i]! >= base && pool.vy[i]! > 0) {
        pool.y[i] = base;
        pool.vy[i] = 0;
        pool.rotV[i] = 0.2;
      }
      pool.rot[i] = pool.vx[i]! * 0.006;
    } else {
      pool.y[i] = base;
      pool.x[i]! += pool.vx[i]! * dt;
      pool.rot[i] = 0.1 * Math.sin(pool.life[i]! * 4 + pool.depth[i]!);
      pool.phase[i]! -= dt;
      if (pool.phase[i]! <= 0) {
        pool.vy[i] = -range(rand, 170, 250);
        pool.phase[i] = range(rand, 0.8, 2.6);
      }
    }
    const m = pool.size[i]!;
    if (pool.x[i]! > w + m) pool.x[i] = -m;
    else if (pool.x[i]! < -m) pool.x[i] = w + m;
  }

  tap(x: number, y: number, input: EffectInput): void {
    const { w, h, t, rand } = input;
    const pool = this.pool;
    this.sync(input);
    let hit = -1;
    let best = Infinity;
    for (let i = 0; i < pool.count; i++) {
      if (!isEgg(pool.kind[i]!)) continue;
      const d = Math.hypot(pool.x[i]! - x, pool.y[i]! - y);
      if (d < Math.max(36, pool.size[i]! * 0.75) && d < best) {
        best = d;
        hit = i;
      }
    }
    if (hit >= 0) {
      this.emitX = pool.x[hit]!;
      this.emitY = pool.aux[hit]!;
      this.emitColor = pool.color[hit]!;
      const top = pool.y[hit]! - pool.size[hit]! * 0.25;
      pool.kill(hit);
      this.cracked++;
      this.respawnAt = t + 3;
      spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initShell, this.emitX, top);
      spawnEdge(pool, 'point', w, h, this.budget.take(1), rand, this.initChick, this.emitX, this.emitY);
      spawnEdge(pool, 'point', w, h, this.budget.take(26), rand, this.initConfetti, this.emitX, top);
      return;
    }
    const n = this.budget.take(12);
    for (let k = 0; k < n; k++) {
      this.ringAngle = (k / n) * TAU;
      spawnEdge(pool, 'point', w, h, 1, rand, this.initRing, x, y);
    }
    for (let i = 0; i < pool.count; i++) {
      if (!isEgg(pool.kind[i]!) || pool.vy[i]! < 0) continue;
      if (Math.abs(pool.x[i]! - x) < 240) {
        pool.vy[i] = -range(rand, 230, 300);
        pool.phase[i] = range(rand, 0.8, 2);
      }
    }
  }

  still(input: EffectInput): void {
    const { w, h, rand } = input;
    const pool = this.pool;
    pool.clear();
    this.sync(input);
    this.started = true;
    this.still0 = true;
    const n = this.budget.take(this.wantedEggs(w));
    for (let k = 0; k < n; k++) {
      spawnEdge(pool, 'point', w, h, 1, rand, this.initEgg, w * (k + range(rand, 0.25, 0.75)) / n, 0);
      const i = pool.count - 1;
      pool.rot[i] = range(rand, -0.15, 0.15);
    }
    spawnEdge(pool, 'area', w, h * 0.85, this.budget.take(input.budget * 0.35), rand, this.initPetal);
  }

  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const pool = this.pool;
    const sprites = this.sprites;
    const { w, h, t } = input;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== PETAL || pool.depth[i]! >= 0.5) continue;
      this.drawPetal(ctx, i);
    }
    this.drawEars(ctx, input);
    this.drawGrass(ctx, w, h, t, 0);
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (!isEgg(kind)) continue;
      const squash = pool.rotV[i]! > 0 ? Math.sin((pool.rotV[i]! / 0.2) * Math.PI) * 0.12 : 0;
      const size = pool.size[i]!;
      ctx.globalAlpha = 0.18;
      sprites.draw(ctx, 'circle', size * 0.8, '#1f3d1f', pool.x[i]!, pool.aux[i]! + size * 0.48, 0, 1, 0.22);
      ctx.globalAlpha = 1;
      sprites.draw(ctx, PATTERNS[kind - EGG]!, size, this.palette.color(pool.color[i]!), pool.x[i]!, pool.y[i]! + squash * size * 0.5, pool.rot[i]!, 1 + squash, 1 - squash);
    }
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind === CHICK) {
        ctx.globalAlpha = pool.alpha[i]!;
        const lean = pool.vx[i]! * 0.004;
        sprites.draw(ctx, CHICK_GLYPH, pool.size[i]!, '#ffd166', pool.x[i]!, pool.y[i]! - pool.size[i]! * 0.1, lean);
      } else if (kind === SHELL) {
        ctx.globalAlpha = pool.alpha[i]!;
        sprites.draw(ctx, 'eggs:half', pool.size[i]!, this.palette.color(pool.color[i]!), pool.x[i]!, pool.y[i]!, pool.rot[i]!);
      }
    }
    this.drawGrass(ctx, w, h, t, 1);
    for (let i = 0; i < pool.count; i++) {
      const kind = pool.kind[i]!;
      if (kind === CONFETTI) {
        ctx.globalAlpha = pool.alpha[i]!;
        const flip = 0.2 + 0.8 * Math.abs(Math.cos(pool.phase[i]!));
        sprites.draw(ctx, 'confettiRect', pool.size[i]!, this.colorOf(pool.color[i]!), pool.x[i]!, pool.y[i]!, pool.rot[i]!, flip, 1);
      } else if (kind === PETAL && pool.depth[i]! >= 0.5) {
        this.drawPetal(ctx, i);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawPetal(ctx: CanvasRenderingContext2D, i: number): void {
    const pool = this.pool;
    ctx.globalAlpha = pool.alpha[i]!;
    const c = pool.color[i]!;
    const flip = 0.25 + 0.75 * Math.abs(Math.cos(pool.phase[i]!));
    const name = c >= 50 ? 'blossom' : 'petal';
    this.sprites.draw(ctx, name, pool.size[i]!, PETALS_DAY[c % 50 % PETALS_DAY.length]!, pool.x[i]!, pool.y[i]!, pool.rot[i]!, flip, 1);
  }

  /** Two rows of swaying tufts; the back row is offset by half a tuft so the meadow looks dense. */
  private drawGrass(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, row: 0 | 1): void {
    const s = this.tuft;
    const step = s * 0.5;
    const n = Math.ceil(w / step) + 2;
    const y = h - s * (row === 0 ? 0.42 : 0.3);
    const color = row === 0 ? GRASS_BACK : GRASS_FRONT;
    ctx.globalAlpha = 1;
    for (let k = 0; k < n; k++) {
      const x = (k - 0.5 + row * 0.5) * step;
      const sway = 0.07 * Math.sin(t * 1.3 + k * 0.55 + row);
      const size = s * (0.85 + 0.3 * (((k * 7 + row * 3) % 5) / 5));
      this.sprites.draw(ctx, 'eggs:grass', Math.round(size), color, x, y, sway);
    }
  }

  /** Bunny ears rise from behind the back row, wiggle, and duck (fixed at full height in still frames). */
  private drawEars(ctx: CanvasRenderingContext2D, input: EffectInput): void {
    const { w, h, t } = input;
    const s = Math.round(this.tuft * 1.7);
    let up: number;
    let x: number;
    if (this.still0 && input.motion !== 'full') {
      up = 1;
      x = w * 0.78;
    } else {
      const cycle = t / EAR_PERIOD;
      const p = (cycle - Math.floor(cycle)) * EAR_PERIOD;
      x = Math.floor(cycle) % 2 === 0 ? w * 0.78 : w * 0.42;
      up = p < 3 ? 0 : p < 3.6 ? (p - 3) / 0.6 : p < 6.4 ? 1 : p < 7 ? 1 - (p - 6.4) / 0.6 : 0;
      up = up * up * (3 - 2 * up);
    }
    if (up <= 0) return;
    const wiggle = 0.08 * Math.sin(t * 6) * up;
    ctx.globalAlpha = 1;
    this.sprites.draw(ctx, 'eggs:ears', s, '#ffafcc', x, h - this.tuft * 0.45 - s * 0.5 * up + s * 0.15, wiggle);
  }
}

export const eggs: EffectFactory = (sprites) => new EggsEffect(sprites);
