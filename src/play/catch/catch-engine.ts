/**
 * catch-engine.ts — Mode A, Catch: pure game state, no DOM, no canvas, so it steps in Node tests.
 *
 * A basket slides along the ground (spring-follows a finger, or accelerates with ←/→). Holiday items
 * fall with a gentle sway; crossing the basket mouth inside a generous reach catches them. Sleepy
 * "oops" things (a cloud, a pebble) just boing off the rim — nothing is lost, there are no lives.
 * Missed items plop onto the ground and fade. Rounds last 45 s; the ramp (spawn rate and fall speed)
 * is seeded and gentle, and Easy makes the basket wider and everything slower.
 *
 * Objects are preallocated (`MAX_ITEMS` falling items, an 8-slot pile ring) so a frame allocates
 * nothing. The UI listens through one callback for catches, boings, plops, milestones and the end.
 */
import { mulberry32 } from '../../effects/rng';

export const ROUND_SECONDS = 45;
export const MAX_ITEMS = 40;
export const PILE_SLOTS = 8;
export const MILESTONE_EVERY = 10;

/** Item classes: a regular treat, the golden special (worth 3), or an oops thing that bounces off. */
export const GOOD = 0;
export const SPECIAL = 1;
export const OOPS = 2;

/** Item states. */
export const FALLING = 0;
export const BOUNCING = 1;
export const CAUGHT = 2;
export const LANDED = 3;

export interface FallingItem {
  active: boolean;
  cls: number;
  /** Index into the skin's items (GOOD) or oops list (OOPS); 0 for SPECIAL. */
  def: number;
  state: number;
  x: number;
  y: number;
  baseX: number;
  vx: number;
  vy: number;
  rot: number;
  rotV: number;
  size: number;
  phase: number;
  sway: number;
  /** Seconds in the current state. */
  t: number;
}

export type CatchEvent = 'catch' | 'bounce' | 'land' | 'milestone' | 'end';
export type CatchListener = (ev: CatchEvent, x: number, y: number, item: FallingItem | null) => void;

export interface CatchOptions {
  readonly easy: boolean;
  readonly reduced: boolean;
  readonly seed: number;
  /** How many regular item kinds and oops kinds the skin has. */
  readonly goodKinds: number;
  readonly oopsKinds: number;
  readonly duration?: number;
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

export class CatchGame {
  readonly items: FallingItem[] = [];
  /** Last caught items for the pile drawn inside the basket: `def + cls * 64`, -1 = empty. */
  readonly pile = new Int16Array(PILE_SLOTS).fill(-1);
  pileHead = 0;

  w = 360;
  h = 640;
  groundY = 580;
  basketX = 180;
  basketV = 0;
  basketW = 120;
  basketH = 66;
  /** Finger target x, or NaN when the keyboard (or nothing) drives the basket. */
  target = Number.NaN;
  keyDir = 0;

  score = 0;
  caught = 0;
  time = 0;
  running = false;
  over = false;
  /** Demo mode behind the start card: the basket plays itself and nothing is counted. */
  attract = true;

  /** Face cues for the renderer: where the eyes look (-1..1), anticipation, joy and surprise timers. */
  look = 0;
  expecting = 0;
  happy = 0;
  surprised = 0;
  squash = 0;
  shake = 0;

  listener: CatchListener | null = null;

  private opts: CatchOptions;
  private rand: () => number;
  private spawnIn = 0.6;
  private specialIn = 8;
  private lastOops = false;
  private showerLeft = 0;
  private showerIn = 0;
  private showerX = 0;
  private showerDX = 0;

  constructor(opts: CatchOptions) {
    this.opts = opts;
    this.rand = mulberry32(opts.seed);
    for (let i = 0; i < MAX_ITEMS; i++) {
      this.items.push({ active: false, cls: 0, def: 0, state: 0, x: 0, y: 0, baseX: 0, vx: 0, vy: 0, rot: 0, rotV: 0, size: 40, phase: 0, sway: 0, t: 0 });
    }
  }

  get duration(): number { return this.opts.duration ?? ROUND_SECONDS; }
  get easy(): boolean { return this.opts.easy; }
  get progress(): number { return clamp(this.time / this.duration, 0, 1); }
  get remaining(): number { return Math.max(0, this.duration - this.time); }
  /** The rim line items must cross to be caught. */
  get mouthY(): number { return this.groundY - this.basketH * 0.8; }
  get itemSize(): number { return clamp(Math.min(this.w, this.h) * 0.11, 36, 56); }

  setOptions(next: Partial<CatchOptions>): void {
    this.opts = { ...this.opts, ...next };
    this.resize(this.w, this.h);
  }

  resize(w: number, h: number): void {
    this.w = Math.max(200, w);
    this.h = Math.max(240, h);
    this.groundY = this.h - clamp(this.h * 0.07, 28, 56);
    this.basketW = clamp(this.w * 0.28, 112, 190) * (this.opts.easy ? 1.35 : 1);
    this.basketH = this.basketW * 0.56;
    this.basketX = clamp(this.basketX, this.basketW / 2, this.w - this.basketW / 2);
  }

  /** Starts a fresh counted round. */
  start(seed?: number): void {
    if (seed !== undefined) this.rand = mulberry32(seed);
    for (const it of this.items) it.active = false;
    this.pile.fill(-1);
    this.pileHead = 0;
    this.score = 0;
    this.caught = 0;
    this.time = 0;
    this.running = true;
    this.over = false;
    this.attract = false;
    this.spawnIn = 0.5;
    this.specialIn = 6 + this.rand() * 4;
    this.lastOops = false;
    this.showerLeft = 0;
    this.basketX = this.w / 2;
    this.basketV = 0;
    this.target = Number.NaN;
  }

  /** Back to the self-playing demo. */
  demo(): void {
    this.running = false;
    this.over = false;
    this.attract = true;
  }

  /** Finger position (CSS px) or NaN to let go. */
  setTarget(x: number): void { this.target = x; }
  setKey(dir: number): void {
    this.keyDir = dir;
    if (dir !== 0) this.target = Number.NaN;
  }

  /** Speed multiplier for falling items at the current point of the round. */
  speedMul(): number {
    const p = this.attract ? 0 : this.progress;
    const k = this.opts.easy ? lerp(0.72, 1.02, p) : lerp(1, 1.6, p);
    return k * (this.opts.reduced ? 0.62 : 1) * (this.attract ? 0.7 : 1);
  }

  private interval(): number {
    const p = this.attract ? 0 : this.progress;
    const base = this.opts.easy ? lerp(1.15, 0.8, p) : lerp(0.95, 0.5, p);
    return base * (this.opts.reduced ? 1.25 : 1) * (this.attract ? 1.3 : 1);
  }

  private free(): FallingItem | null {
    for (const it of this.items) if (!it.active) return it;
    return null;
  }

  private spawn(cls: number, x: number): void {
    const it = this.free();
    if (!it) return;
    const r = this.rand;
    const size = this.itemSize * (cls === SPECIAL ? 1.2 : cls === OOPS ? 1.1 : 1);
    it.active = true;
    it.cls = cls;
    it.def = cls === GOOD ? Math.floor(r() * Math.max(1, this.opts.goodKinds)) : cls === OOPS ? Math.floor(r() * Math.max(1, this.opts.oopsKinds)) : 0;
    it.state = FALLING;
    it.size = size;
    it.baseX = clamp(x, size * 0.6, this.w - size * 0.6);
    it.x = it.baseX;
    it.y = -size;
    it.vx = 0;
    it.vy = (105 + 40 * r()) * this.speedMul() * (cls === OOPS ? 0.85 : cls === SPECIAL ? 0.9 : 1);
    it.rot = (r() - 0.5) * 0.6;
    it.rotV = (r() - 0.5) * 1.2;
    it.phase = r() * Math.PI * 2;
    it.sway = 6 + r() * 16;
    it.t = 0;
  }

  private spawnTick(dt: number): void {
    const r = this.rand;
    const margin = this.itemSize;
    if (this.showerLeft > 0) {
      this.showerIn -= dt;
      if (this.showerIn <= 0) {
        this.spawn(GOOD, this.showerX);
        this.showerX += this.showerDX;
        this.showerLeft--;
        this.showerIn = 0.17;
      }
      return;
    }
    if (!this.attract && this.opts.goodKinds > 0) {
      this.specialIn -= dt;
      if (this.specialIn <= 0) {
        this.spawn(SPECIAL, margin + r() * (this.w - 2 * margin));
        this.specialIn = 7 + r() * 5;
      }
    }
    this.spawnIn -= dt;
    if (this.spawnIn > 0) return;
    this.spawnIn = this.interval() * (0.7 + 0.6 * r());
    const x = margin + r() * (this.w - 2 * margin);
    const p = this.attract ? 0 : this.progress;
    // A little shower: three or four treats in a sweeping line, fun to chase.
    if (!this.attract && p > 0.12 && r() < 0.12) {
      this.showerLeft = 3 + (r() < 0.4 ? 1 : 0);
      this.showerDX = (x < this.w / 2 ? 1 : -1) * this.itemSize * 1.1;
      this.showerX = x;
      this.showerIn = 0;
      this.lastOops = false;
      return;
    }
    const oopsChance = this.opts.oopsKinds > 0 && this.time > 3 ? (this.opts.easy ? 0.1 : 0.15) : 0;
    const oops = !this.lastOops && r() < oopsChance;
    this.lastOops = oops;
    this.spawn(oops ? OOPS : GOOD, x);
  }

  private moveBasket(dt: number): void {
    const half = this.basketW / 2;
    let goal = this.target;
    if (this.attract) {
      // Demo: drift under the lowest treat that is still falling.
      let best: FallingItem | null = null;
      for (const it of this.items) if (it.active && it.state === FALLING && it.cls !== OOPS && (!best || it.y > best.y)) best = it;
      goal = best ? best.x : this.w / 2;
    }
    if (!Number.isNaN(goal)) {
      const k = this.attract ? 60 : 420;
      const c = 2 * Math.sqrt(k) * 0.92;
      this.basketV += (k * (clamp(goal, half, this.w - half) - this.basketX) - c * this.basketV) * dt;
    } else if (this.keyDir !== 0) {
      const max = this.opts.easy ? 430 : 560;
      this.basketV = clamp(this.basketV + this.keyDir * 3200 * dt, -max, max);
    } else {
      this.basketV *= Math.exp(-12 * dt);
    }
    this.basketX += this.basketV * dt;
    if (this.basketX < half) { this.basketX = half; this.basketV = 0; }
    if (this.basketX > this.w - half) { this.basketX = this.w - half; this.basketV = 0; }
  }

  private emit(ev: CatchEvent, x: number, y: number, item: FallingItem | null): void {
    this.listener?.(ev, x, y, item);
  }

  private catchItem(it: FallingItem): void {
    it.state = CAUGHT;
    it.t = 0;
    this.happy = 1;
    this.squash = 1;
    if (this.attract) { this.emit('catch', it.x, this.mouthY, it); return; }
    this.caught++;
    this.score += it.cls === SPECIAL ? 3 : 1;
    this.pile[this.pileHead] = it.def + it.cls * 64;
    this.pileHead = (this.pileHead + 1) % PILE_SLOTS;
    if (it.cls === SPECIAL && !this.opts.reduced) this.shake = 1;
    this.emit('catch', it.x, this.mouthY, it);
    if (this.caught % MILESTONE_EVERY === 0) this.emit('milestone', this.basketX, this.mouthY, it);
  }

  step(dt: number): void {
    dt = Math.min(dt, 0.05);
    if (this.running) {
      this.time += dt;
      if (this.time >= this.duration) {
        this.time = this.duration;
        this.running = false;
        this.over = true;
        this.keyDir = 0;
        this.target = Number.NaN;
        this.emit('end', this.basketX, this.mouthY, null);
      }
    }
    if (this.running || this.attract) this.spawnTick(dt);
    this.moveBasket(dt);

    const mouth = this.mouthY;
    const reachPad = this.opts.easy ? 14 : 4;
    let nearest = Number.POSITIVE_INFINITY;
    let lookX = this.basketX;
    let expecting = 0;
    for (const it of this.items) {
      if (!it.active) continue;
      it.t += dt;
      if (it.state === FALLING) {
        const prevBottom = it.y + it.size * 0.2;
        it.phase += dt * 1.8;
        it.y += it.vy * dt;
        it.x = it.baseX + Math.sin(it.phase) * it.sway;
        it.rot = Math.sin(it.phase * 0.8) * 0.35 + it.rotV * 0.2;
        const bottom = it.y + it.size * 0.2;
        const dx = Math.abs(it.x - this.basketX);
        const canCatch = this.running || this.attract;
        if (canCatch && prevBottom < mouth && bottom >= mouth && dx <= this.basketW * 0.5 + it.size * 0.4 + reachPad) {
          if (it.cls === OOPS) {
            it.state = BOUNCING;
            it.t = 0;
            it.vy = -360 - this.rand() * 80;
            it.vx = (it.x >= this.basketX ? 1 : -1) * (120 + this.rand() * 80);
            it.rotV = it.vx > 0 ? 5 : -5;
            this.surprised = 1;
            this.squash = 0.6;
            this.emit('bounce', it.x, mouth, it);
          } else {
            this.catchItem(it);
          }
          continue;
        }
        if (it.y + it.size * 0.35 >= this.groundY) {
          it.state = LANDED;
          it.t = 0;
          it.y = this.groundY - it.size * 0.35;
          this.emit('land', it.x, this.groundY, it);
          continue;
        }
        if (it.cls !== OOPS && it.y < mouth) {
          const d = mouth - it.y;
          if (d < nearest) { nearest = d; lookX = it.x; }
          if (d < 150 && dx < this.basketW * 0.6) expecting = 1;
        }
      } else if (it.state === BOUNCING) {
        it.vy += 1500 * dt;
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.rot += it.rotV * dt;
        if (it.y > this.h + it.size || it.x < -it.size * 2 || it.x > this.w + it.size * 2) it.active = false;
      } else if (it.state === CAUGHT) {
        // Tuck into the basket over 0.18 s, then hand over to the pile drawing.
        const k = Math.min(1, it.t / 0.18);
        it.x = lerp(it.x, this.basketX, k * 0.5);
        it.y = lerp(it.y, mouth + this.basketH * 0.2, k * 0.5);
        if (it.t >= 0.18) it.active = false;
      } else if (it.state === LANDED) {
        if (it.t >= 0.9) it.active = false;
      }
    }
    const lookGoal = clamp((lookX - this.basketX) / (this.basketW * 0.9), -1, 1);
    this.look += (lookGoal - this.look) * Math.min(1, dt * 10);
    this.expecting += (expecting - this.expecting) * Math.min(1, dt * 12);
    this.happy = Math.max(0, this.happy - dt * 2.2);
    this.surprised = Math.max(0, this.surprised - dt * 2);
    this.squash = Math.max(0, this.squash - dt * 4);
    this.shake = Math.max(0, this.shake - dt * 4);
  }

  /** Visual lean of the basket from its speed (radians). */
  get tilt(): number {
    return clamp(this.basketV * 0.0005, -0.22, 0.22);
  }

  activeCount(): number {
    let n = 0;
    for (const it of this.items) if (it.active) n++;
    return n;
  }
}
