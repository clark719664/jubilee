/**
 * stack-engine.ts — Mode B, Stack: pure state for the wobbly tower (no DOM, steps in Node tests).
 *
 * World units are CSS px with x = 0 at the middle of the screen and y measured UP from the top of the
 * base (a plate, a table…). A piece swings on a ribbon above the tower; tap (or Space/Enter/↓) drops it,
 * or drag it into place and let go. Physics is simple AABB with damping:
 *  - the falling piece lands on the top piece when their x ranges overlap; its offset `dx` decides
 *    whether it stays (centre over the support) or slides off the edge with a giggle;
 *  - landings kick a damped angular wobble; a fresh top piece whose offset plus the lean pushes its
 *    centre past the edge below slides off too (only the top piece ever goes — the tower never falls);
 *  - Easy pulls near-misses toward the middle (a gentle magnet) and swings slower.
 * Nothing is lost: sliding pieces just leave, and the next one is already swinging.
 */
import { mulberry32 } from '../../effects/rng';

export const MAX_PIECES = 160;
export const MAX_SLIDERS = 6;

export interface Piece {
  x: number;
  /** Bottom edge, world y (up). */
  y: number;
  w: number;
  h: number;
  color: number;
  /** Seconds since it landed (drives the squash and the tip window). */
  t: number;
}

export interface Slider {
  active: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  vx: number;
  vy: number;
  rot: number;
  rotV: number;
  t: number;
}

export type StackEvent = 'land' | 'perfect' | 'slide' | 'miss' | 'milestone' | 'end';
export type StackListener = (ev: StackEvent, x: number, y: number, n: number) => void;

export interface StackOptions {
  readonly easy: boolean;
  readonly reduced: boolean;
  readonly seed: number;
  /** Piece height ÷ width for this skin's piece kind. */
  readonly aspect: number;
  readonly colors: number;
  readonly duration?: number;
}

/** Heights (in pieces) that earn a "taller than…" cheer; the UI owns the words. */
export const HEIGHT_MILESTONES: readonly number[] = [5, 10, 15, 20, 30, 40, 60];

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const GRAVITY = 2000;
const TIP_WINDOW = 1.4;

export class StackGame {
  readonly pieces: Piece[] = [];
  count = 0;
  readonly sliders: Slider[] = [];

  w = 360;
  h = 640;
  /** Screen y of the ground line and of the top of the base when the camera is at 0. */
  groundY = 600;
  baseW = 200;
  baseH = 28;

  /** The piece on the ribbon. */
  hangX = 0;
  hangW = 140;
  hangH = 60;
  hangColor = 0;
  hangReady = true;
  /** Seconds until the next piece pops onto the ribbon. */
  private hangIn = 0;
  private phase = 0;
  manualFor = 0;
  keyDir = 0;
  dragging = false;

  /** The dropped piece, world coords. */
  fallActive = false;
  fallX = 0;
  fallY = 0;
  fallVy = 0;
  fallW = 0;
  fallH = 0;
  fallColor = 0;

  theta = 0;
  omega = 0;
  camY = 0;

  score = 0;
  time = 0;
  running = false;
  over = false;
  attract = true;
  listener: StackListener | null = null;

  private opts: StackOptions;
  private rand: () => number;
  private demoIn = 1.2;

  constructor(opts: StackOptions) {
    this.opts = opts;
    this.rand = mulberry32(opts.seed);
    for (let i = 0; i < MAX_PIECES; i++) this.pieces.push({ x: 0, y: 0, w: 0, h: 0, color: 0, t: 0 });
    for (let i = 0; i < MAX_SLIDERS; i++) this.sliders.push({ active: false, x: 0, y: 0, w: 0, h: 0, color: 0, vx: 0, vy: 0, rot: 0, rotV: 0, t: 0 });
    this.nextPiece();
  }

  get duration(): number { return this.opts.duration ?? 45; }
  get easy(): boolean { return this.opts.easy; }
  get progress(): number { return clamp(this.time / this.duration, 0, 1); }
  get remaining(): number { return Math.max(0, this.duration - this.time); }
  /** Screen y of the ribbon's piece bottom. */
  get hangScreenY(): number { return clamp(this.h * 0.2, 96, 170) + this.hangH; }
  /** World y of the tower top. */
  get top(): number {
    const p = this.count > 0 ? this.pieces[this.count - 1]! : null;
    return p ? p.y + p.h : 0;
  }
  get pieceH(): number { return clamp(this.baseW * this.opts.aspect, 18, 64); }

  setOptions(next: Partial<StackOptions>): void {
    this.opts = { ...this.opts, ...next };
    this.resize(this.w, this.h);
  }

  resize(w: number, h: number): void {
    this.w = Math.max(200, w);
    this.h = Math.max(240, h);
    this.groundY = this.h - clamp(this.h * 0.07, 28, 56);
    this.baseW = clamp(this.w * 0.46, 150, 280) * (this.opts.easy ? 1.12 : 1);
    this.baseH = 26;
    if (!this.fallActive) this.sizeHanging();
  }

  /** Screen y for a world y. */
  screenY(y: number): number {
    return this.groundY - this.baseH - (y - this.camY);
  }

  /** World y for a screen y. */
  worldY(sy: number): number {
    return this.groundY - this.baseH - sy + this.camY;
  }

  private sizeHanging(): void {
    const r = this.rand;
    const k = this.opts.easy ? 0.82 + r() * 0.14 : 0.6 + r() * 0.32;
    this.hangW = Math.round(this.baseW * k);
    this.hangH = Math.round(this.pieceH * (0.9 + r() * 0.2));
  }

  private nextPiece(): void {
    this.sizeHanging();
    this.hangColor = Math.floor(this.rand() * Math.max(1, this.opts.colors));
    this.hangReady = true;
  }

  start(seed?: number): void {
    if (seed !== undefined) this.rand = mulberry32(seed);
    this.count = 0;
    for (const s of this.sliders) s.active = false;
    this.fallActive = false;
    this.theta = 0;
    this.omega = 0;
    this.camY = 0;
    this.score = 0;
    this.time = 0;
    this.running = true;
    this.over = false;
    this.attract = false;
    this.phase = 0;
    this.manualFor = 0;
    this.nextPiece();
  }

  demo(): void {
    this.running = false;
    this.over = false;
    this.attract = true;
    this.demoIn = 1;
  }

  private amplitude(): number {
    return Math.max(20, Math.min(this.w / 2 - this.hangW / 2 - 12, this.baseW * 1.05));
  }

  private swingSpeed(): number {
    const base = this.opts.easy ? 0.85 : 1.25;
    return base * (1 + Math.min(0.45, this.count * 0.022)) * (this.opts.reduced ? 0.8 : 1);
  }

  /** Arrow keys nudge the hanging piece and pause the swing for a moment. */
  setKey(dir: number): void { this.keyDir = dir; }

  /** Finger drag: the piece follows the finger (screen x). */
  dragTo(sx: number): void {
    this.dragging = true;
    const a = this.amplitude();
    this.hangX = clamp(sx - this.w / 2, -a, a);
    this.manualFor = 1.2;
  }

  endDrag(): void { this.dragging = false; }

  /** Drops the hanging piece; false when nothing is ready to drop. */
  drop(): boolean {
    if (!this.hangReady || this.fallActive || this.over) return false;
    this.fallActive = true;
    this.fallX = this.hangX;
    this.fallY = this.worldY(this.hangScreenY);
    this.fallVy = 0;
    this.fallW = this.hangW;
    this.fallH = this.hangH;
    this.fallColor = this.hangColor;
    this.hangReady = false;
    this.hangIn = 0.35;
    this.dragging = false;
    return true;
  }

  private emit(ev: StackEvent, x: number, y: number, n: number): void {
    this.listener?.(ev, x, y, n);
  }

  private slideOff(x: number, y: number, w: number, h: number, color: number, dir: number): void {
    const s = this.sliders.find((v) => !v.active);
    if (!s) return;
    s.active = true;
    s.x = x; s.y = y; s.w = w; s.h = h; s.color = color;
    s.vx = dir * (110 + this.rand() * 60);
    s.vy = 40;
    s.rot = 0;
    s.rotV = dir * 2.6;
    s.t = 0;
  }

  /** Support under x: the top piece, or the base when the tower is empty. */
  private support(): { x: number; w: number; top: number } {
    if (this.count === 0) return { x: 0, w: this.baseW, top: 0 };
    const p = this.pieces[this.count - 1]!;
    return { x: p.x, w: p.w, top: p.y + p.h };
  }

  private land(): void {
    const sup = this.support();
    let dx = this.fallX - sup.x;
    const half = sup.w / 2;
    if (this.opts.easy && Math.abs(dx) < half * 0.9) dx *= 0.4;
    const perfectTol = this.opts.easy ? 14 : 7;
    let perfect = false;
    if (Math.abs(dx) <= perfectTol) { dx = 0; perfect = true; }
    this.fallActive = false;
    if (Math.abs(dx) > half || this.count >= MAX_PIECES) {
      this.slideOff(sup.x + dx, sup.top, this.fallW, this.fallH, this.fallColor, dx >= 0 ? 1 : -1);
      this.emit('slide', sup.x + dx, sup.top, this.count);
      return;
    }
    const p = this.pieces[this.count++]!;
    p.x = sup.x + dx;
    p.y = sup.top;
    p.w = this.fallW;
    p.h = this.fallH;
    p.color = this.fallColor;
    p.t = 0;
    const kick = (dx / sup.w) * (this.opts.reduced ? 0.12 : 0.42) * (1 + this.count * 0.04);
    this.omega += kick / Math.max(1, Math.sqrt(this.count) * 0.6);
    if (this.running) this.score = this.count;
    this.emit(perfect ? 'perfect' : 'land', p.x, p.y + p.h, this.count);
    if (this.running && HEIGHT_MILESTONES.includes(this.count)) this.emit('milestone', p.x, p.y + p.h, this.count);
  }

  /** The lean at the tower top in px (wobble only, used for drawing and tipping). */
  get lean(): number {
    return this.theta * this.top;
  }

  private tipCheck(): void {
    if (this.count < 2) return;
    const p = this.pieces[this.count - 1]!;
    if (p.t > TIP_WINDOW) return;
    const below = this.pieces[this.count - 2]!;
    const dx = p.x - below.x;
    const lean = this.theta * (p.y + p.h / 2);
    if (Math.sign(lean) !== Math.sign(dx) || dx === 0) return;
    if (Math.abs(dx) + Math.abs(lean) * 0.6 <= below.w * 0.5) return;
    this.count--;
    if (this.running) this.score = this.count;
    this.slideOff(p.x + lean, p.y, p.w, p.h, p.color, dx > 0 ? 1 : -1);
    this.omega *= 0.4;
    this.emit('slide', p.x, p.y, this.count);
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
        this.dragging = false;
        this.emit('end', 0, this.top, this.score);
      }
    }

    // The ribbon: auto-swing unless a finger or the arrows are steering.
    if (!this.hangReady && !this.fallActive && !this.over) {
      this.hangIn -= dt;
      if (this.hangIn <= 0) this.nextPiece();
    }
    const a = this.amplitude();
    if (this.keyDir !== 0) {
      this.hangX = clamp(this.hangX + this.keyDir * (this.opts.easy ? 220 : 300) * dt, -a, a);
      this.manualFor = 1.2;
    } else if (!this.dragging) {
      this.manualFor = Math.max(0, this.manualFor - dt);
      if (this.manualFor === 0 && !this.over) {
        this.phase += dt * this.swingSpeed();
        const goal = Math.sin(this.phase) * a;
        // Ease back into the swing instead of snapping to it.
        this.hangX += (goal - this.hangX) * Math.min(1, dt * 6);
      } else {
        this.phase = Math.asin(clamp(this.hangX / a, -1, 1));
      }
    }

    if (this.attract) {
      this.demoIn -= dt;
      if (this.demoIn <= 0 && this.hangReady) {
        const sup = this.support();
        if (Math.abs(this.hangX - sup.x) < 18) { this.drop(); this.demoIn = 1.1; }
      }
      if (this.count >= 6 && !this.fallActive) { this.count = 0; this.camY = 0; }
    }

    if (this.fallActive) {
      this.fallVy += GRAVITY * (this.opts.reduced ? 0.6 : 1) * dt;
      const sup = this.support();
      const nextY = this.fallY - this.fallVy * dt;
      const overlaps = Math.abs(this.fallX - sup.x) < (this.fallW + sup.w) / 2;
      if (overlaps && this.fallY >= sup.top && nextY <= sup.top) {
        this.fallY = sup.top;
        this.land();
      } else {
        this.fallY = nextY;
        if (this.screenY(this.fallY) > this.h + 80 || this.fallY < -this.baseH - this.fallH * 2) {
          this.fallActive = false;
          this.emit('miss', this.fallX, this.fallY, this.count);
        }
      }
    }

    // Damped wobble: θ'' = −kθ − cθ'. Reduced motion damps it almost at once.
    const k = 16;
    const c = this.opts.reduced ? 10 : 1.7;
    this.omega += (-k * this.theta - c * this.omega) * dt;
    this.theta += this.omega * dt;
    this.theta = clamp(this.theta, -0.08, 0.08);
    for (let i = 0; i < this.count; i++) this.pieces[i]!.t += dt;
    this.tipCheck();

    for (const s of this.sliders) {
      if (!s.active) continue;
      s.t += dt;
      s.vy += GRAVITY * 0.7 * dt;
      s.x += s.vx * dt;
      s.y -= s.vy * dt;
      s.rot += s.rotV * dt;
      if (this.screenY(s.y) > this.h + 120 || s.t > 4) s.active = false;
    }

    // Camera: keep the tower top a comfortable gap under the ribbon.
    const gap = clamp(this.h * 0.3, 150, 260);
    const want = Math.max(0, this.top - this.worldY(this.hangScreenY + gap) + this.camY);
    this.camY += (want - this.camY) * Math.min(1, dt * 3);
  }
}
