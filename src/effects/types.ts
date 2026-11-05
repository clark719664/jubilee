import type { Theme } from '../theme/themes';

export type EffectId =
  | 'snow' | 'confetti' | 'fireworks' | 'bats' | 'hearts' | 'holi' | 'lanterns' | 'diyas' | 'leaves' | 'shamrocks'
  | 'eggs' | 'menorah' | 'kinara' | 'petals' | 'crescent' | 'moon' | 'sabzeh' | 'glyph-rain' | 'balloons' | 'bubbles' | 'planes';

export const EFFECT_IDS: readonly EffectId[] = [
  'snow', 'confetti', 'fireworks', 'bats', 'hearts', 'holi', 'lanterns', 'diyas', 'leaves', 'shamrocks',
  'eggs', 'menorah', 'kinara', 'petals', 'crescent', 'moon', 'sabzeh', 'glyph-rain', 'balloons', 'bubbles', 'planes',
];

/** A point on the scene artboard (1600×900 units): [x, y]. */
export type StagePoint = readonly [number, number];

/** An ellipse on the scene artboard: a patch of ground or water seen in perspective. */
export interface StageEllipse {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
}

/** A sabzeh dish on the scene artboard: center x, the soil line y at the rim, half the inner width. */
export interface StageDish {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
}

/**
 * Where an illustrated scene leaves room for its effect, in artboard units (scene.json `stage`; stage.ts
 * maps them onto the canvas). Every field is optional.
 */
export interface Stage {
  /** A clear ellipse of ground for a ground piece (Diwali: the rangoli and its ring of lamps). */
  readonly floor?: StageEllipse;
  /**
   * Wick tips of the scene's own unlit candles. Menorah: 9, the shamash first, then the 8 candles left to
   * right. Kinara: 7 left to right (red ×3, black, green ×3).
   */
  readonly wicks?: readonly StagePoint[];
  /** A sabzeh dish whose sprouts grow up from the soil line. */
  readonly dish?: StageDish;
  /** Open water where fish may swim. */
  readonly water?: StageEllipse;
}

export interface EffectParams {
  readonly palette?: readonly string[];
  readonly glyphs?: readonly string[];
  /** menorah 0–8, kinara 0–7, balloons = birthday age. */
  readonly candles?: number;
  /** 0..1 (crescent: Ramadan progress; moon: fullness). */
  readonly moonPhase?: number;
  /** 0..1 closeness (sabzeh height, diya count, moon size). */
  readonly growth?: number;
  readonly variant?: string;
  /** Density multiplier, default 1 (celebration = 2). */
  readonly density?: number;
  /**
   * Scene mode: present only when the hero shows an illustrated scene (it may be empty). The set pieces
   * drawn to fill a bare sky (a menorah, a moon, a skyline, a meadow…) give way to the art; ambient
   * particles and taps stay, and what belongs on the art is drawn at the stage's points.
   */
  readonly stage?: Stage;
}

export type MotionMode = 'full' | 'reduced' | 'off';

export interface Pointer { readonly x: number; readonly y: number; readonly down: boolean }

export interface EffectInput {
  /** CSS px. */
  readonly w: number;
  readonly h: number;
  /** Seconds; dt clamped ≤ 0.05. */
  readonly dt: number;
  readonly t: number;
  readonly pointer: Pointer | null;
  /** 0..1 from scroll / intersection. */
  readonly intensity: number;
  readonly motion: MotionMode;
  /** Seeded. */
  readonly rand: () => number;
  readonly params: EffectParams;
  readonly theme: Theme;
  /** Max alive particles. */
  readonly budget: number;
}

/** A sprite painter renders one sprite at `size` px in `color` onto a context positioned at the origin. */
export type SpritePainter = (ctx: CanvasRenderingContext2D, size: number, color: string) => void;

export interface SpriteCache {
  /** Returns an offscreen canvas for (name, size, color), painting it once. */
  get(name: string, size: number, color: string): CanvasImageSource;
  /** Registers a painter under a name (glyphs are registered as `glyph:<text>`). */
  register(name: string, painter: SpritePainter): void;
  has(name: string): boolean;
  /**
   * Draw a cached sprite centered at (x, y) with optional rotation and scale; `squash` scales the result
   * vertically after the rotation (a flat thing lying on the ground, seen in perspective).
   */
  draw(
    ctx: CanvasRenderingContext2D, name: string, size: number, color: string, x: number, y: number, rot?: number, scaleX?: number,
    scaleY?: number, squash?: number,
  ): void;
}

export interface Effect {
  /** Pure w.r.t. input + internal pool; testable without a canvas. */
  step(input: EffectInput): void;
  draw(ctx: CanvasRenderingContext2D, input: EffectInput): void;
  /** Reduced-motion: arrange one settled frame. */
  still(input: EffectInput): void;
  tap?(x: number, y: number, input: EffectInput): void;
  /** Hold-to-grow (lanterns). */
  press?(x: number, y: number, down: boolean, input: EffectInput): void;
  /** aria-label for the canvas. */
  readonly describe: string;
  /** Number of alive particles (for tests and stats). */
  alive(): number;
}

export type EffectFactory = (sprites: SpriteCache) => Effect;
