/**
 * effects-stage.test.ts — scene mode: the artboard → canvas mapping matches the hero's scene layers, and
 * presets over an illustrated scene drop their bare-sky set pieces and draw on the stage's points.
 */
import { describe, expect, it } from 'vitest';
import { BAT, BatsEffect, FOG, HANGING, PUMPKIN, SCENE_MOON, STAR, bats } from '../src/effects/fx/bats';
import { KinaraEffect, WICK as KINARA_WICK, CANDLE as KINARA_CANDLE, kinara, kinaraWicks } from '../src/effects/fx/kinara';
import { CANDLE, MenorahEffect, WICK, menorah, menorahWicks } from '../src/effects/fx/menorah';
import { PooledEffect } from '../src/effects/fx/shared';
import { snow } from '../src/effects/fx/snow';
import { crescent } from '../src/effects/fx/crescent';
import { BOAT, GLOBE, SPROUT, bubbles } from '../src/effects/fx/bubbles';
import { CARP, FREE, POLE, balloons } from '../src/effects/fx/balloons';
import { CANDLE as MARIGOLD_CANDLE, FLOWER, petals } from '../src/effects/fx/petals';
import { STEP } from '../src/effects/layer';
import { mulberry32 } from '../src/effects/rng';
import { ARTBOARD, OVERSCAN, SceneView, stageMap, stagePoint } from '../src/effects/stage';
import type { Effect, EffectFactory, EffectInput, EffectParams, SpriteCache, SpritePainter, Stage, StagePoint } from '../src/effects/types';
import { THEMES, type Theme } from '../src/theme/themes';

function sprites(): SpriteCache {
  const names = new Set<string>();
  return {
    get: () => ({ width: 1, height: 1 } as unknown as CanvasImageSource),
    register: (name: string, _p: SpritePainter) => { names.add(name); },
    has: (name: string) => names.has(name) || !name.includes(':'),
    draw: () => undefined,
  };
}

type MutableInput = { -readonly [K in keyof EffectInput]: EffectInput[K] };

function input(params: EffectParams, theme: Theme, w = 1048, h = 716): MutableInput {
  return { w, h, dt: STEP, t: 0, pointer: null, intensity: 1, motion: 'full', rand: mulberry32(11), params, theme, budget: 240 };
}

function run(factory: EffectFactory, inp: MutableInput, steps = 240): Effect {
  const fx = factory(sprites());
  for (let k = 0; k < steps; k++) {
    inp.t += STEP;
    fx.step(inp);
  }
  return fx;
}

function kinds(fx: Effect): Map<number, number> {
  expect(fx).toBeInstanceOf(PooledEffect);
  const pool = (fx as PooledEffect).pool;
  const m = new Map<number, number>();
  for (let i = 0; i < pool.count; i++) m.set(pool.kind[i]!, (m.get(pool.kind[i]!) ?? 0) + 1);
  return m;
}

/** The scene layers' box (styles.css .hero-layer + object-fit: cover; object-position: 50% 100%). */
function cssCover(w: number, h: number): { s: number; left: number; top: number } {
  const W = w + 2 * OVERSCAN.x;
  const H = h + 2 * OVERSCAN.y;
  const s = Math.max(W / ARTBOARD.w, H / ARTBOARD.h);
  return { s, left: -OVERSCAN.x + (W - ARTBOARD.w * s) / 2, top: -OVERSCAN.y + (H - ARTBOARD.h * s) };
}

describe('stage mapping', () => {
  it('draws the artboard where the scene layers are: centred across, bottom-anchored, covering', () => {
    for (const [w, h] of [[1048, 716], [390, 639], [320, 584], [812, 641], [736, 640], [10, 10]] as const) {
      const m = stageMap(w, h);
      const css = cssCover(w, h);
      expect(m.s).toBeCloseTo(css.s, 9);
      expect(m.left).toBeCloseTo(css.left, 9);
      expect(m.top).toBeCloseTo(css.top, 9);
      // The artboard's bottom edge sits on the layer box's bottom edge, its middle on the hero's middle.
      expect(stagePoint(m, ARTBOARD.w / 2, ARTBOARD.h).y).toBeCloseTo(h + OVERSCAN.y, 9);
      expect(stagePoint(m, ARTBOARD.w / 2, 0).x).toBeCloseTo(w / 2, 9);
      // Cover: the artboard never leaves a gap inside the layer box.
      expect(m.left).toBeLessThanOrEqual(-OVERSCAN.x + 1e-9);
      expect(m.left + ARTBOARD.w * m.s).toBeGreaterThanOrEqual(w + OVERSCAN.x - 1e-9);
    }
  });

  it('a zero or broken size maps to finite numbers', () => {
    for (const [w, h] of [[0, 0], [Number.NaN, 600], [-5, Number.POSITIVE_INFINITY]] as const) {
      const m = stageMap(w, h);
      expect(Number.isFinite(m.s) && Number.isFinite(m.left) && Number.isFinite(m.top)).toBe(true);
    }
  });

  it('SceneView knows scene mode, notices a new stage once, and keeps the sky line on the hero', () => {
    const view = new SceneView();
    const stage: Stage = {};
    const inp = input({}, THEMES.halloween);
    expect(view.sync(inp)).toBe(false);
    expect(view.changed).toBe(false);
    inp.params = { stage };
    expect(view.sync(inp)).toBe(true);
    expect(view.changed).toBe(true);
    expect(view.sync(inp)).toBe(true);
    expect(view.changed).toBe(false);
    expect(view.x(800)).toBeCloseTo(inp.w / 2, 9);
    expect(view.sky).toBeCloseTo(view.y(ARTBOARD.sky), 9);
    expect(view.skyBand(123)).toBe(view.sky);
    inp.params = {};
    view.sync(inp);
    expect(view.changed).toBe(true);
    expect(view.skyBand(123)).toBe(123);
  });
});

describe('bats over the Halloween scene', () => {
  const STAGE: Stage = {};

  it('keeps the flock and the stars but none of the bare-sky set pieces', () => {
    const fx = run(bats, input({ stage: STAGE }, THEMES.halloween));
    const k = kinds(fx);
    expect(k.get(PUMPKIN) ?? 0).toBe(0);
    expect(k.get(HANGING) ?? 0).toBe(0);
    expect(k.get(FOG) ?? 0).toBe(0);
    expect(k.get(BAT) ?? 0).toBeGreaterThan(3);
    expect(k.get(STAR) ?? 0).toBeGreaterThan(5);
    const bare = kinds(run(bats, input({}, THEMES.halloween)));
    expect(bare.get(PUMPKIN)).toBe(3);
    expect(bare.get(FOG) ?? 0).toBeGreaterThan(0);
  });

  it('scatters the stars over the picture sky only', () => {
    const inp = input({ stage: STAGE }, THEMES.halloween);
    const fx = run(bats, inp) as BatsEffect;
    const pool = fx.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] === STAR) expect(pool.y[i]!).toBeLessThanOrEqual(fx.scene.sky);
    }
  });

  it('a still frame over the scene has bats by the moon and no set pieces', () => {
    const fx = bats(sprites()) as BatsEffect;
    fx.still(input({ stage: STAGE }, THEMES.halloween));
    const k = kinds(fx);
    expect(k.get(PUMPKIN) ?? 0).toBe(0);
    expect(k.get(HANGING) ?? 0).toBe(0);
    expect(k.get(BAT)).toBe(4);
  });

  it('puts the moon at its artboard point in the open sky, peeking in on a narrow hero', () => {
    const wide = run(bats, input({ stage: STAGE }, THEMES.halloween), 2) as BatsEffect;
    const m = stageMap(1048, 716);
    const moon = (wide as unknown as { moon: { x: number; y: number; m: number } }).moon;
    expect(moon.x).toBeCloseTo(m.left + SCENE_MOON.x * m.s, 6);
    expect(moon.y).toBeCloseTo(m.top + SCENE_MOON.y * m.s, 6);
    // The whole moon is above the scene's sky line (no hill or roof can be in front of it).
    expect(SCENE_MOON.y + SCENE_MOON.d / 2).toBeLessThan(ARTBOARD.sky);
    const phone = run(bats, input({ stage: STAGE }, THEMES.halloween, 390, 639), 2) as BatsEffect;
    const pm = (phone as unknown as { moon: { x: number; y: number; m: number } }).moon;
    expect(pm.x).toBeGreaterThan(390);
    expect(pm.x - pm.m / 2).toBeLessThan(390);
  });

  it('brings the set pieces back when the scene goes away (a layer failed to load)', () => {
    const inp = input({ stage: STAGE }, THEMES.halloween);
    const fx = run(bats, inp, 60);
    inp.params = {};
    for (let k = 0; k < 4; k++) {
      inp.t += STEP;
      fx.step(inp);
    }
    expect(kinds(fx).get(PUMPKIN)).toBe(3);
  });
});

describe('candles on the scene’s own wicks', () => {
  const nine: StagePoint[] = [[800, 500], ...Array.from({ length: 8 }, (_, k): StagePoint => [640 + k * 40 + (k >= 4 ? 40 : 0), 520])];
  const seven: StagePoint[] = Array.from({ length: 7 }, (_, k): StagePoint => [680 + k * 40, 540]);

  it('menorah: the shamash and tonight’s candles, newest first, on the art’s wicks', () => {
    expect(menorahWicks(0)).toEqual([]);
    expect(menorahWicks(1)).toEqual([0, 8]);
    expect(menorahWicks(3)).toEqual([0, 6, 7, 8]);
    expect(menorahWicks(8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    const inp = input({ candles: 3, stage: { wicks: nine } }, THEMES.hanukkah);
    const fx = run(menorah, inp, 10) as MenorahEffect;
    const k = kinds(fx);
    expect(k.get(CANDLE) ?? 0).toBe(0);
    expect(k.get(WICK)).toBe(4);
    const pool = fx.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] !== WICK) continue;
      const tip = nine[pool.aux[i]!]!;
      expect(pool.x[i]).toBeCloseTo(fx.scene.x(tip[0]), 3);
      expect(pool.y[i]).toBeCloseTo(fx.scene.y(tip[1]), 3);
    }
  });

  it('menorah: a scene without wicks shows no menorah of its own; no scene brings it back', () => {
    const inp = input({ candles: 5, stage: {} }, THEMES.hanukkah);
    const fx = run(menorah, inp, 10);
    expect(kinds(fx).get(CANDLE) ?? 0).toBe(0);
    expect(kinds(fx).get(WICK) ?? 0).toBe(0);
    inp.params = { candles: 5 };
    inp.t += STEP;
    fx.step(inp);
    expect(kinds(fx).get(CANDLE)).toBe(6);
  });

  it('kinara: tonight’s flames in lighting order on the art’s wicks, and back to its own kinara without a scene', () => {
    expect(kinaraWicks(1)).toEqual([3]);
    expect(kinaraWicks(3)).toEqual([3, 2, 4]);
    const inp = input({ candles: 3, stage: { wicks: seven } }, THEMES.kwanzaa);
    const fx = run(kinara, inp, 10) as KinaraEffect;
    expect(kinds(fx).get(KINARA_WICK)).toBe(3);
    expect(kinds(fx).get(KINARA_CANDLE) ?? 0).toBe(0);
    inp.params = { candles: 3 };
    for (let k = 0; k < 3; k++) {
      inp.t += STEP;
      fx.step(inp);
    }
    expect(kinds(fx).get(KINARA_WICK) ?? 0).toBe(0);
    expect(kinds(fx).get(KINARA_CANDLE)).toBe(7);
  });
});

describe('groundhog snow over the Groundhog Day scene', () => {
  /** Draws one frame and returns the sprite names drawn. */
  function drawn(params: EffectParams): string[] {
    const names: string[] = [];
    const cache: SpriteCache = { ...sprites(), draw: (_ctx, name) => { names.push(name); } };
    const fx = snow(cache);
    const inp = input(params, THEMES.snowday);
    for (let k = 0; k < 60; k++) { inp.t += STEP; fx.step(inp); }
    fx.draw({ globalAlpha: 1 } as unknown as CanvasRenderingContext2D, inp);
    return names;
  }

  it('leaves the groundhog to the art, keeps the snow, and brings it back without a scene', () => {
    const scene = drawn({ variant: 'shadow', stage: {} });
    expect(scene).not.toContain('groundhog');
    expect(scene.length).toBeGreaterThan(5);
    expect(drawn({ variant: 'shadow' })).toContain('groundhog');
  });
});

describe('crescent over the Eid and Ramadan scenes', () => {
  function drawn(params: EffectParams): string[] {
    const names: string[] = [];
    const cache: SpriteCache = { ...sprites(), draw: (_ctx, name) => { names.push(name); } };
    const fx = crescent(cache);
    const inp = input(params, THEMES.eid);
    for (let k = 0; k < 240; k++) { inp.t += STEP; fx.step(inp); }
    fx.draw({ globalAlpha: 1, globalCompositeOperation: 'source-over' } as unknown as CanvasRenderingContext2D, inp);
    return names;
  }

  it('leaves the town to the art but keeps the moon, and brings the skyline back without a scene', () => {
    const scene = drawn({ stage: {} });
    expect(scene).not.toContain('crescent:skyline');
    expect(scene.some((n) => n.startsWith('crescent:moon'))).toBe(true);
    expect(drawn({})).toContain('crescent:skyline');
  });
});

describe('bubbles over the Earth Day, Songkran and Dragon Boat scenes', () => {
  it('drops the globe and the boats over a scene and brings them back without one', () => {
    const earth = kinds(run(bubbles, input({ variant: 'earth', stage: {} }, THEMES.earth)));
    expect(earth.get(GLOBE) ?? 0).toBe(0);
    expect(kinds(run(bubbles, input({ variant: 'earth' }, THEMES.earth))).get(GLOBE)).toBe(1);
    const waves = kinds(run(bubbles, input({ variant: 'waves', stage: {} }, THEMES.river)));
    expect(waves.get(BOAT) ?? 0).toBe(0);
    expect(kinds(run(bubbles, input({ variant: 'waves' }, THEMES.river))).get(BOAT) ?? 0).toBeGreaterThan(0);
  });

  it('a tap over the Earth Day scene shakes leaves but plants no sprout on the art', () => {
    const inp = input({ variant: 'earth', stage: {} }, THEMES.earth);
    const fx = run(bubbles, inp, 30);
    fx.tap?.(400, 500, inp);
    expect(kinds(fx).get(SPROUT) ?? 0).toBe(0);
  });
});

describe('koinobori over the Children\'s Day scene', () => {
  it('leaves the pole and its streamers to the art, keeps the free carp, and brings the pole back without a scene', () => {
    const scene = kinds(run(balloons, input({ variant: 'koinobori', stage: {} }, THEMES.koinobori)));
    expect(scene.get(POLE) ?? 0).toBe(0);
    expect(scene.get(CARP) ?? 0).toBe(0);
    expect(scene.get(FREE) ?? 0).toBeGreaterThan(0);
    const bare = kinds(run(balloons, input({ variant: 'koinobori' }, THEMES.koinobori)));
    expect(bare.get(POLE)).toBe(1);
    expect(bare.get(CARP) ?? 0).toBeGreaterThan(0);
  });
});

describe('petals over the Mother\'s Day, Passover and Day of the Dead scenes', () => {
  it('grows no flower border or candle row over a scene, and brings them back without one', () => {
    for (const variant of ['bloom', 'spring', 'poppies']) {
      expect(kinds(run(petals, input({ variant, stage: {} }, THEMES.mothers))).get(FLOWER) ?? 0).toBe(0);
      expect(kinds(run(petals, input({ variant }, THEMES.mothers))).get(FLOWER) ?? 0).toBeGreaterThan(0);
    }
    expect(kinds(run(petals, input({ variant: 'marigold', stage: {} }, THEMES.muertos))).get(MARIGOLD_CANDLE) ?? 0).toBe(0);
    expect(kinds(run(petals, input({ variant: 'marigold' }, THEMES.muertos))).get(MARIGOLD_CANDLE) ?? 0).toBeGreaterThan(0);
  });
});
