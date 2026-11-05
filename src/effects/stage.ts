/**
 * stage.ts — scene mode: where a holiday's illustrated scene lands on the effect canvas.
 *
 * A hero with a scene stacks sky → back.svg → mid.svg → effect canvas → front.svg. Every layer shares one
 * 1600×900 artboard and is drawn the same way (styles.css `.hero-layer`): a box overscanned by 14 px on
 * each side and 8 px top and bottom, filled with `object-fit: cover; object-position: 50% 100%`. For a
 * w×h hero, with W = w + 28 and H = h + 16, the artboard is drawn at s = max(W/1600, H/900), centered
 * across and bottom-anchored:
 *
 *   left = −14 + (W − 1600·s)/2        top = −8 + H − 900·s        (x, y) ↦ (left + x·s, top + y·s)
 *
 * The hero hands the effect `params.stage` (the scene's `stage` from scene.json, or {}) whenever it shows
 * a scene and moves the canvas with the mid layer as the picture leans, so anything drawn at a mapped
 * stage point stays on the art. Presets keep one `SceneView` (PooledEffect.scene), re-synced every step
 * and updated in place, so nothing is allocated per frame.
 */
import type { EffectInput, Stage } from './types';

/** The shared scene artboard; its top `sky` units are open sky, kept clear for the hero's words. */
export const ARTBOARD = { w: 1600, h: 900, sky: 430 } as const;

/** How far every scene layer overhangs the hero, CSS px (styles.css `.hero-layer`: left −14, top −8, +28 × +16). */
export const OVERSCAN = { x: 14, y: 8 } as const;

export interface StageMap {
  /** CSS px per artboard unit. */
  readonly s: number;
  /** Where the artboard's origin (0, 0) lands on the canvas, CSS px. */
  readonly left: number;
  readonly top: number;
}

function size(v: number): number {
  return Number.isFinite(v) && v > 0 ? v : 0;
}

/** The artboard → canvas mapping for a w×h hero (the same box, scale and anchoring as the scene layers). */
export function stageMap(w: number, h: number): StageMap {
  const W = size(w) + 2 * OVERSCAN.x;
  const H = size(h) + 2 * OVERSCAN.y;
  const s = Math.max(W / ARTBOARD.w, H / ARTBOARD.h);
  return { s, left: -OVERSCAN.x + (W - ARTBOARD.w * s) / 2, top: -OVERSCAN.y + H - ARTBOARD.h * s };
}

/** An artboard point on the canvas, CSS px. */
export function stagePoint(m: StageMap, x: number, y: number): { readonly x: number; readonly y: number } {
  return { x: m.left + x * m.s, y: m.top + y * m.s };
}

const EMPTY: Stage = {};

/**
 * One effect's view of the scene: whether the hero shows one (`on`), its stage, and the mapping for the
 * current canvas size. `sync` runs at the top of every step/tap/still; `changed` is true on the sync
 * where scene mode or the stage itself changed, so a preset can rebuild what it laid on the art.
 */
export class SceneView {
  on = false;
  stage: Stage = EMPTY;
  /** CSS px per artboard unit and the artboard origin on the canvas. */
  s = 1;
  left = 0;
  top = 0;
  /** Canvas y of the artboard's sky line (open sky above it), never less than a fifth of the hero. */
  sky = 0;
  /** True on the sync where scene mode switched or the stage changed. */
  changed = false;
  private w = -1;
  private h = -1;
  private last: Stage | undefined = undefined;

  sync(input: EffectInput): boolean {
    const st = input.params.stage;
    this.changed = st !== this.last;
    this.last = st;
    this.on = st !== undefined;
    this.stage = st ?? EMPTY;
    const w = size(input.w);
    const h = size(input.h);
    if (w !== this.w || h !== this.h) {
      this.w = w;
      this.h = h;
      const W = w + 2 * OVERSCAN.x;
      const H = h + 2 * OVERSCAN.y;
      this.s = Math.max(W / ARTBOARD.w, H / ARTBOARD.h);
      this.left = -OVERSCAN.x + (W - ARTBOARD.w * this.s) / 2;
      this.top = -OVERSCAN.y + H - ARTBOARD.h * this.s;
      this.sky = Math.min(h, Math.max(h * 0.2, this.top + ARTBOARD.sky * this.s));
    }
    return this.on;
  }

  /** Artboard x → canvas x. */
  x(u: number): number {
    return this.left + u * this.s;
  }

  /** Artboard y → canvas y. */
  y(u: number): number {
    return this.top + u * this.s;
  }

  /** An artboard length in CSS px. */
  len(u: number): number {
    return u * this.s;
  }

  /** How far down ambient sky things (stars, clouds) may sit: the sky line in scene mode, else `fallback`. */
  skyBand(fallback: number): number {
    return this.on ? this.sky : fallback;
  }
}
