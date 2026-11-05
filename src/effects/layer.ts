/**
 * layer.ts — EffectLayer: one living sky. It owns the canvas, the fixed-step loop, sizing (ResizeObserver +
 * device-pixel ratio), the particle budget (width tier × quality × density), the quality controller,
 * pause/resume (document.hidden, IntersectionObserver), pointer/keyboard input and the motion mode.
 *
 *   const layer = new EffectLayer(canvas, host, { seed: 7 });
 *   layer.setEffect('snow', meta.effectParams ?? {}, theme);      // 'cut' (default) or 'crossfade'
 *   layer.setMotion(ctx.motion);                                  // 'full' | 'reduced' | 'off'
 *   layer.start();                                                // rAF loop (full) / one still frame (reduced)
 *   …
 *   layer.destroy();                                              // in the view's destroy()
 *
 * Motion: 'full' runs the loop; 'reduced' arranges `effect.still()` once and redraws only on resize or
 * setParams — a tap then shows one gentle frame (no auto-play); 'off' hides the canvas (aria-hidden) and
 * leaves the CSS sky gradient alone. Input: pointerdown/up on the host → `effect.press`; a click (or
 * Space/Enter with the host focused) → `burst`, which calls `effect.tap`, rate-limited to 3 per second.
 * A press held longer than 350 ms is a hold, not a tap, so releasing it does not burst as well.
 * Intensity: `setIntensity(k)` × the host's intersection ratio, so content scrolling over the hero calms it.
 * The pure pieces (accumulator, quality EMA, rate limiter, budget/dpr formulas) live in timing.ts and are
 * re-exported here for tests.
 */
import type { Theme } from '../theme/themes';
import { DESCRIBE } from './describe';
import { loadEffect, loadedEffect } from './registry';
import { mulberry32 } from './rng';
import { createSpriteCache, type SpriteCacheImpl } from './sprites';
import {
  BURSTS_PER_SECOND, DEFAULT_BUDGET, FixedStepAccumulator, QualityController, RateLimiter, STEP, budgetFor, dprFor,
  type BudgetTiers,
} from './timing';
import type { Effect, EffectFactory, EffectId, EffectParams, MotionMode, Pointer } from './types';

export {
  BURSTS_PER_SECOND, DEFAULT_BUDGET, FixedStepAccumulator, MAX_ACCUMULATED, MAX_DT, PHONE_MAX_WIDTH, QUALITY_DEFAULTS,
  QualityController, RateLimiter, STEP, budgetFor, dprFor,
} from './timing';
export type { BudgetTiers, QualityOptions } from './timing';

export interface EffectLayerOptions {
  /** Cap on devicePixelRatio (default 2). */
  readonly maxDpr?: number;
  readonly budget?: BudgetTiers;
  /** RNG seed (default 1); the same seed replays the same sky. */
  readonly seed?: number;
  /** Wire pointer and keyboard input on the host (default true). */
  readonly input?: boolean;
}

export interface LayerStats {
  fps: number;
  alive: number;
  budget: number;
  quality: number;
}

export type Transition = 'cut' | 'crossfade';

/** Steps simulated before a new effect is first drawn, so the sky is never empty on arrival. */
const PREWARM_STEPS = 120;
const CROSSFADE_SECONDS = 0.5;
/** A press held this long is a hold-to-grow gesture, not a tap. */
const HOLD_SECONDS = 0.35;
/** Steps simulated after a tap under reduced motion: one gentle frame, no auto-play. */
const STILL_TAP_STEPS = 18;
/** Intersection thresholds: ten steps so the ratio (= intensity) follows the scroll. */
const THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

interface MutableInput {
  w: number;
  h: number;
  dt: number;
  t: number;
  pointer: Pointer | null;
  intensity: number;
  motion: MotionMode;
  rand: () => number;
  params: EffectParams;
  theme: Theme;
  budget: number;
}

interface MutablePointer {
  x: number;
  y: number;
  down: boolean;
}

interface Fade {
  readonly effect: Effect;
  left: number;
}

function nowSeconds(): number {
  return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
}

export class EffectLayer {
  readonly stats: LayerStats = { fps: 0, alive: 0, budget: 0, quality: 1 };

  private readonly canvas: HTMLCanvasElement;
  private readonly host: HTMLElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly sprites: SpriteCacheImpl;
  private readonly maxDpr: number;
  private readonly tiers: BudgetTiers;
  private readonly accumulator = new FixedStepAccumulator();
  private readonly qualityCtl = new QualityController();
  private readonly limiter = new RateLimiter(BURSTS_PER_SECOND, 1);
  private readonly pointer: MutablePointer = { x: 0, y: 0, down: false };
  private readonly disposers: (() => void)[] = [];

  private effect: Effect | null = null;
  private id: EffectId | null = null;
  /** The preset most recently asked for, and its arguments while its chunk is still on the way. */
  private wanted: EffectId | null = null;
  private pending: { params: EffectParams; theme: Theme; transition: Transition; bursts: [number, number][] } | null = null;
  private destroyed = false;
  private input: MutableInput | null = null;
  private fade: Fade | null = null;
  private fadeCanvas: HTMLCanvasElement | null = null;
  private fadeCtx: CanvasRenderingContext2D | null = null;

  private motion: MotionMode = 'full';
  private manualIntensity = 1;
  private visibleRatio = 1;
  private visible = true;
  private running = false;
  private raf = 0;
  private last = 0;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private pointerOver = false;
  private pressedAt = -1;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private readonly seed: number;

  constructor(canvas: HTMLCanvasElement, host: HTMLElement, opts: EffectLayerOptions = {}) {
    this.canvas = canvas;
    this.host = host;
    this.maxDpr = opts.maxDpr ?? 2;
    this.tiers = opts.budget ?? DEFAULT_BUDGET;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.sprites = createSpriteCache({ scale: 1 });
    this.seed = opts.seed ?? 1;
    canvas.setAttribute('role', 'img');
    canvas.style.display = 'block';
    this.observe();
    if (opts.input !== false) this.listen();
    this.applySize();
  }

  get effectId(): EffectId | null {
    return this.id;
  }

  // ---------------------------------------------------------------- public API

  /**
   * Swaps in a preset. The new effect is prewarmed 120 steps so the sky arrives full. Presets are fetched
   * on first use: until the chunk arrives the old sky keeps going, and bursts asked for meanwhile are
   * replayed once it lands.
   */
  setEffect(id: EffectId, params: EffectParams, theme: Theme, transition: Transition = 'cut'): void {
    this.wanted = id;
    const factory = loadedEffect(id);
    if (factory) {
      this.pending = null;
      this.apply(id, factory, params, theme, transition);
      return;
    }
    this.pending = { params, theme, transition, bursts: this.pending?.bursts ?? [] };
    if (!this.effect) this.canvas.setAttribute('aria-label', DESCRIBE[id]);
    loadEffect(id).then((f) => {
      const p = this.pending;
      if (this.destroyed || this.wanted !== id || !p) return;
      this.pending = null;
      this.apply(id, f, p.params, p.theme, p.transition);
      for (const [x, y] of p.bursts) this.burst(x, y);
    }, (err: unknown) => console.error(err));
  }

  private apply(id: EffectId, factory: EffectFactory, params: EffectParams, theme: Theme, transition: Transition): void {
    const previous = this.effect;
    const effect = factory(this.sprites);
    const rand = mulberry32(this.seed);
    this.input = {
      w: this.w, h: this.h, dt: STEP, t: this.input?.t ?? 0, pointer: null, intensity: this.intensity(),
      motion: this.motion, rand, params, theme, budget: 0,
    };
    this.effect = effect;
    this.id = id;
    this.canvas.setAttribute('aria-label', effect.describe || DESCRIBE[id]);
    this.limiter.reset();
    this.syncBudget();
    if (this.motion === 'reduced') {
      this.fade = null;
      this.arrangeStill();
    } else if (this.motion === 'full') {
      for (let k = 0; k < PREWARM_STEPS; k++) this.stepEffect(effect);
      this.fade = transition === 'crossfade' && previous ? { effect: previous, left: CROSSFADE_SECONDS } : null;
      this.render();
      this.schedule();
    }
    this.updateStats();
  }

  setParams(params: EffectParams): void {
    if (this.pending) { this.pending.params = params; return; }
    if (!this.input) return;
    this.input.params = params;
    this.syncBudget();
    if (this.motion === 'reduced') this.arrangeStill();
  }

  /** 0..1 multiplier on the ambient activity (scroll-driven; the intersection ratio multiplies it). */
  setIntensity(k: number): void {
    this.manualIntensity = Number.isFinite(k) ? Math.min(1, Math.max(0, k)) : 1;
  }

  setMotion(mode: MotionMode): void {
    if (mode === this.motion) return;
    this.motion = mode;
    if (this.input) this.input.motion = mode;
    this.canvas.hidden = mode === 'off';
    this.canvas.setAttribute('aria-hidden', mode === 'off' ? 'true' : 'false');
    if (mode === 'off') {
      this.cancel();
      this.clear();
    } else if (mode === 'reduced') {
      this.cancel();
      this.fade = null;
      this.arrangeStill();
    } else {
      this.last = 0;
      this.accumulator.reset();
      this.render();
      this.schedule();
    }
  }

  /** Calls `effect.tap` at (x, y) in host CSS px; rate-limited to 3 per second. */
  burst(x: number, y: number): void {
    if (this.pending) {
      if (this.pending.bursts.length < BURSTS_PER_SECOND) this.pending.bursts.push([x, y]);
      return;
    }
    const effect = this.effect;
    const input = this.input;
    if (!effect || !input || this.motion === 'off' || !effect.tap) return;
    if (!this.limiter.allow(nowSeconds())) return;
    this.refreshInput();
    effect.tap(x, y, input);
    if (this.motion === 'reduced') {
      for (let k = 0; k < STILL_TAP_STEPS; k++) this.stepEffect(effect);
      this.render();
    } else if (!this.raf) {
      this.render();
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.accumulator.reset();
    if (this.motion === 'reduced') this.arrangeStill();
    else this.schedule();
  }

  stop(): void {
    this.running = false;
    this.cancel();
  }

  destroy(): void {
    this.destroyed = true;
    this.pending = null;
    this.stop();
    for (const dispose of this.disposers) dispose();
    this.disposers.length = 0;
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.resizeObserver = null;
    this.intersectionObserver = null;
    this.effect = null;
    this.fade = null;
    this.input = null;
    this.clear();
    this.sprites.clear();
  }

  /** Re-reads the host size (the ResizeObserver calls this; call it yourself after a programmatic resize). */
  resize(): void {
    this.applySize();
  }

  // ---------------------------------------------------------------- loop

  private schedule(): void {
    if (this.raf || !this.running || this.motion !== 'full' || !this.visible || !this.effect) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (typeof requestAnimationFrame !== 'function') return;
    this.raf = requestAnimationFrame(this.frame);
  }

  private cancel(): void {
    if (this.raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.last = 0;
  }

  private readonly frame = (now: number): void => {
    this.raf = 0;
    const effect = this.effect;
    if (!effect || !this.input) return;
    const elapsed = this.last > 0 ? (now - this.last) / 1000 : STEP;
    this.last = now;
    this.qualityCtl.sample(elapsed * 1000);
    this.syncQuality();
    const steps = this.accumulator.advance(elapsed);
    if (steps > 0) {
      this.refreshInput();
      for (let k = 0; k < steps; k++) {
        this.stepEffect(effect);
        const fade = this.fade;
        if (fade) {
          this.stepEffect(fade.effect);
          fade.left -= STEP;
          if (fade.left <= 0) this.fade = null;
        }
      }
      this.render();
    }
    this.updateStats();
    this.schedule();
  };

  private stepEffect(effect: Effect): void {
    const input = this.input;
    if (!input) return;
    input.dt = STEP;
    input.t += STEP;
    effect.step(input);
  }

  private refreshInput(): void {
    const input = this.input;
    if (!input) return;
    input.w = this.w;
    input.h = this.h;
    input.pointer = this.pointerOver ? this.pointer : null;
    input.intensity = this.intensity();
    input.motion = this.motion;
    this.syncBudget();
  }

  private intensity(): number {
    return this.manualIntensity * this.visibleRatio;
  }

  private syncBudget(): void {
    const input = this.input;
    if (!input) return;
    input.budget = budgetFor(this.w, this.qualityCtl.quality, input.params.density ?? 1, this.tiers);
  }

  private syncQuality(): void {
    const dpr = this.wantedDpr();
    if (dpr !== this.dpr) this.applySize();
  }

  private wantedDpr(): number {
    const device = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    return dprFor(device, this.maxDpr, this.qualityCtl.quality);
  }

  private updateStats(): void {
    this.stats.fps = this.qualityCtl.fps;
    this.stats.alive = this.effect ? this.effect.alive() : 0;
    this.stats.budget = this.input ? this.input.budget : 0;
    this.stats.quality = this.qualityCtl.quality;
  }

  private arrangeStill(): void {
    const effect = this.effect;
    if (!effect || !this.input || this.motion !== 'reduced') return;
    this.refreshInput();
    effect.still(this.input);
    this.render();
    this.updateStats();
  }

  // ---------------------------------------------------------------- drawing

  private render(): void {
    const ctx = this.ctx;
    const effect = this.effect;
    const input = this.input;
    if (!ctx || !effect || !input || this.motion === 'off' || this.w === 0 || this.h === 0) return;
    const k = this.dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, this.w, this.h);
    const fade = this.fade;
    if (fade) {
      const fctx = this.fadeContext();
      if (fctx && this.fadeCanvas) {
        fctx.setTransform(k, 0, 0, k, 0, 0);
        fctx.globalAlpha = 1;
        fctx.globalCompositeOperation = 'source-over';
        fctx.clearRect(0, 0, this.w, this.h);
        fade.effect.draw(fctx, input);
        fctx.globalAlpha = 1;
        fctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = Math.min(1, Math.max(0, fade.left / CROSSFADE_SECONDS));
        ctx.drawImage(this.fadeCanvas, 0, 0, this.w, this.h);
        ctx.globalAlpha = 1;
      }
    }
    effect.draw(ctx, input);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private clear(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private fadeContext(): CanvasRenderingContext2D | null {
    if (!this.fadeCanvas) {
      if (typeof document === 'undefined') return null;
      this.fadeCanvas = document.createElement('canvas');
      this.fadeCtx = this.fadeCanvas.getContext('2d');
    }
    if (this.fadeCanvas.width !== this.canvas.width || this.fadeCanvas.height !== this.canvas.height) {
      this.fadeCanvas.width = this.canvas.width;
      this.fadeCanvas.height = this.canvas.height;
    }
    return this.fadeCtx;
  }

  // ---------------------------------------------------------------- sizing & observers

  private applySize(): void {
    const rect = this.host.getBoundingClientRect();
    const w = Math.max(0, Math.round(rect.width || this.host.clientWidth));
    const h = Math.max(0, Math.round(rect.height || this.host.clientHeight));
    const dpr = this.wantedDpr();
    if (w === this.w && h === this.h && dpr === this.dpr) return;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.sprites.setScale(dpr);
    if (this.input) {
      this.input.w = w;
      this.input.h = h;
      this.syncBudget();
    }
    if (this.motion === 'reduced') this.arrangeStill();
    else this.render();
  }

  private observe(): void {
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(() => this.applySize());
      this.resizeObserver.observe(this.host);
    }
    if (typeof IntersectionObserver === 'function') {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        this.visibleRatio = entry.isIntersecting ? Math.max(0.05, entry.intersectionRatio) : 0;
        this.visible = entry.isIntersecting;
        if (this.visible) {
          this.last = 0;
          this.schedule();
        } else {
          this.cancel();
        }
      }, { threshold: THRESHOLDS });
      this.intersectionObserver.observe(this.host);
    }
    if (typeof document !== 'undefined') {
      const onVisibility = (): void => {
        if (document.hidden) this.cancel();
        else {
          this.last = 0;
          this.accumulator.reset();
          this.schedule();
        }
      };
      document.addEventListener('visibilitychange', onVisibility);
      this.disposers.push(() => document.removeEventListener('visibilitychange', onVisibility));
    }
  }

  private listen(): void {
    const host = this.host;
    const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void): void => {
      host.addEventListener(type, fn);
      this.disposers.push(() => host.removeEventListener(type, fn));
    };
    on('pointermove', (e) => {
      this.track(e);
      this.pointerOver = true;
    });
    on('pointerenter', (e) => {
      this.track(e);
      this.pointerOver = true;
    });
    on('pointerleave', () => {
      this.pointerOver = false;
      this.pointer.down = false;
    });
    on('pointerdown', (e) => {
      this.track(e);
      this.pointerOver = true;
      this.pointer.down = true;
      this.pressedAt = nowSeconds();
      this.press(true);
    });
    const release = (): void => {
      if (!this.pointer.down) return;
      this.pointer.down = false;
      this.press(false);
    };
    on('pointerup', release);
    on('pointercancel', release);
    on('click', (e) => {
      const held = this.pressedAt >= 0 && nowSeconds() - this.pressedAt > HOLD_SECONDS;
      this.pressedAt = -1;
      if (held) return;
      this.track(e);
      this.burst(this.pointer.x, this.pointer.y);
    });
    on('keydown', (e) => {
      if (e.target !== host) return;
      if (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'Spacebar') return;
      e.preventDefault();
      this.burst(this.w / 2, this.h / 2);
    });
  }

  private track(e: MouseEvent): void {
    const rect = this.host.getBoundingClientRect();
    this.pointer.x = e.clientX - rect.left;
    this.pointer.y = e.clientY - rect.top;
  }

  private press(down: boolean): void {
    const effect = this.effect;
    const input = this.input;
    if (!effect || !input || !effect.press || this.motion === 'off') return;
    this.refreshInput();
    effect.press(this.pointer.x, this.pointer.y, down, input);
    if (this.motion === 'reduced') this.render();
  }
}
