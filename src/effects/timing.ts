/**
 * timing.ts — the pure, Node-testable helpers behind EffectLayer. No DOM, no globals, no allocation
 * after construction:
 *
 *   FixedStepAccumulator  wall-clock elapsed seconds → whole 1/60 s simulation steps (accumulator clamped
 *                         to 0.1 s so a hitch or a background tab never causes a catch-up storm)
 *   QualityController     EMA of frame time → quality 0.3..1 (60 slow frames −0.15, 300 fast frames +0.05)
 *   RateLimiter           at most N events per window (bursts and firework blooms: 3 per second)
 *   budgetFor / dprFor    the alive-particle budget and the device-pixel ratio for a width and quality
 */

/** Simulation step in seconds; `dt` handed to `Effect.step` is always this (≤ 0.05 as the contract requires). */
export const STEP = 1 / 60;
/** The accumulator never holds more than this many seconds of pending simulation. */
export const MAX_ACCUMULATED = 0.1;
/** Hard cap on `dt` (the contract in types.ts). */
export const MAX_DT = 0.05;
/** Bursts (taps, rockets, firecrackers) per second, app-wide. */
export const BURSTS_PER_SECOND = 3;
/** Hosts narrower than this use the phone budget. */
export const PHONE_MAX_WIDTH = 720;

export interface BudgetTiers {
  readonly phone: number;
  readonly desktop: number;
}

export const DEFAULT_BUDGET: BudgetTiers = { phone: 150, desktop: 350 };

export class FixedStepAccumulator {
  private pending = 0;

  constructor(readonly step = STEP, readonly max = MAX_ACCUMULATED) {}

  /** Adds `elapsed` seconds and returns how many whole steps are now due (0..max/step). */
  advance(elapsed: number): number {
    const add = Number.isFinite(elapsed) && elapsed > 0 ? elapsed : 0;
    this.pending = Math.min(this.max, this.pending + add);
    // The epsilon keeps 1/60 s frames from alternating between 0 and 2 steps through float noise.
    const n = Math.floor(this.pending / this.step + 1e-6);
    this.pending = Math.max(0, this.pending - n * this.step);
    return n;
  }

  reset(): void {
    this.pending = 0;
  }
}

export interface QualityOptions {
  /** A frame slower than this (ms) counts as slow. */
  readonly slowMs: number;
  /** A frame faster than this (ms) counts as fast. */
  readonly fastMs: number;
  readonly slowFrames: number;
  readonly fastFrames: number;
  readonly down: number;
  readonly up: number;
  readonly min: number;
  readonly max: number;
  /** EMA weight of the newest sample. */
  readonly smoothing: number;
}

export const QUALITY_DEFAULTS: QualityOptions = {
  slowMs: 24, fastMs: 12, slowFrames: 60, fastFrames: 300, down: 0.15, up: 0.05, min: 0.3, max: 1, smoothing: 0.2,
};

/**
 * Tracks an exponential moving average of the frame time and nudges `quality` down after `slowFrames`
 * consecutive slow frames or up after `fastFrames` consecutive fast frames. The first sample seeds the
 * average so the controller reacts after exactly `slowFrames` slow frames from a cold start.
 */
export class QualityController {
  quality: number;
  /** Smoothed frame time in ms (0 before the first sample). */
  ema = 0;
  private slow = 0;
  private fast = 0;
  private samples = 0;

  constructor(readonly opts: QualityOptions = QUALITY_DEFAULTS) {
    this.quality = opts.max;
  }

  /** Feeds one frame time in milliseconds and returns the (possibly updated) quality. */
  sample(frameMs: number): number {
    const o = this.opts;
    // A 250 ms clamp keeps a single stall (tab switch, GC) from poisoning the average for seconds.
    const ms = Number.isFinite(frameMs) ? Math.min(250, Math.max(0, frameMs)) : o.fastMs;
    this.ema = this.samples === 0 ? ms : this.ema + (ms - this.ema) * o.smoothing;
    this.samples++;
    if (this.ema > o.slowMs) {
      this.fast = 0;
      if (++this.slow >= o.slowFrames) {
        this.slow = 0;
        this.quality = Math.max(o.min, this.quality - o.down);
      }
    } else if (this.ema < o.fastMs) {
      this.slow = 0;
      if (++this.fast >= o.fastFrames) {
        this.fast = 0;
        this.quality = Math.min(o.max, this.quality + o.up);
      }
    } else {
      this.slow = 0;
      this.fast = 0;
    }
    return this.quality;
  }

  /** Frames per second implied by the smoothed frame time. */
  get fps(): number {
    return this.ema > 0 ? 1000 / this.ema : 0;
  }

  reset(): void {
    this.quality = this.opts.max;
    this.ema = 0;
    this.slow = 0;
    this.fast = 0;
    this.samples = 0;
  }
}

/**
 * Sliding-window limiter: `allow(now)` is true when fewer than `max` events were allowed in the last
 * `window` seconds. Times are in seconds on any monotonic clock (the layer uses performance.now()/1000,
 * effects use `input.t`). A ring of the last `max` timestamps is all the state it needs.
 */
export class RateLimiter {
  private readonly times: Float64Array;
  private head = 0;
  private count = 0;

  constructor(readonly max = BURSTS_PER_SECOND, readonly window = 1) {
    this.times = new Float64Array(Math.max(1, Math.floor(max)));
  }

  allow(now: number): boolean {
    const size = this.times.length;
    if (this.count < size) {
      this.times[(this.head + this.count) % size] = now;
      this.count++;
      return true;
    }
    const oldest = this.times[this.head]!;
    if (now - oldest < this.window) return false;
    this.times[this.head] = now;
    this.head = (this.head + 1) % size;
    return true;
  }

  reset(): void {
    this.head = 0;
    this.count = 0;
  }
}

/** Alive-particle budget: tier by width × quality × density, never below 20. */
export function budgetFor(width: number, quality: number, density = 1, tiers: BudgetTiers = DEFAULT_BUDGET): number {
  const base = width < PHONE_MAX_WIDTH ? tiers.phone : tiers.desktop;
  const q = Number.isFinite(quality) ? Math.min(1, Math.max(0, quality)) : 1;
  const d = Number.isFinite(density) && density > 0 ? density : 1;
  return Math.max(20, Math.floor(base * q * d));
}

/** Device-pixel ratio: min(dpr, maxDpr), dropping to 1.5 below quality 0.6 and to 1 below 0.45. */
export function dprFor(devicePixelRatio: number, maxDpr: number, quality: number): number {
  const dpr = Math.min(Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1, Math.max(1, maxDpr));
  if (quality < 0.45) return 1;
  if (quality < 0.6) return Math.min(dpr, 1.5);
  return dpr;
}
