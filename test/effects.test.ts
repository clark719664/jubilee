/**
 * effects.test.ts — the Canvas-free contract of the effects engine: presets step deterministically from
 * a seed, never exceed the particle budget, produce a finite non-empty still frame, draw without a real
 * canvas, and the layer's pure helpers (rate limiter, quality EMA, fixed-step accumulator) behave.
 */
import { describe, expect, it } from 'vitest';
import { DESCRIBE, EFFECTS, PENDING_PRESETS } from '../src/effects';
import { BLOOM_RAMP, FLASH, FireworksEffect, isSpark } from '../src/effects/fx/fireworks';
import { SnowEffect } from '../src/effects/fx/snow';
import { PooledEffect } from '../src/effects/fx/shared';
import {
  FixedStepAccumulator, QualityController, RateLimiter, STEP, budgetFor, dprFor,
} from '../src/effects/layer';
import { PAINTER_NAMES } from '../src/effects/painters';
import { mulberry32 } from '../src/effects/rng';
import { createSpriteCache } from '../src/effects/sprites';
import { EFFECT_IDS, type Effect, type EffectId, type EffectInput, type EffectParams, type SpriteCache } from '../src/effects/types';
import { THEMES, type Theme } from '../src/theme/themes';

/** A SpriteCache that never paints: what Node gets, and what effects must cope with. */
const stubSprites: SpriteCache = {
  get: () => ({ width: 1, height: 1 } as unknown as CanvasImageSource),
  register: () => undefined,
  has: () => true,
  draw: () => undefined,
};

/** A CanvasRenderingContext2D stand-in: every method is a no-op, every property is writable. */
function fakeContext(): CanvasRenderingContext2D {
  const store: Record<string | symbol, unknown> = {};
  return new Proxy(store, {
    get: (target, key) => (key in target ? target[key] : () => undefined),
    set: (target, key, value) => {
      target[key] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

interface RunOptions {
  readonly seed?: number;
  readonly steps?: number;
  readonly budget?: number;
  readonly params?: EffectParams;
  readonly theme?: Theme;
  readonly w?: number;
  readonly h?: number;
  readonly tapEvery?: number;
  readonly onStep?: (effect: Effect, input: EffectInput, k: number) => void;
}

type MutableInput = { -readonly [K in keyof EffectInput]: EffectInput[K] };

function makeInput(rand: () => number, o: RunOptions): MutableInput {
  return {
    w: o.w ?? 800, h: o.h ?? 600, dt: STEP, t: 0, pointer: null, intensity: 1, motion: 'full', rand,
    params: o.params ?? {}, theme: o.theme ?? THEMES.newyear, budget: o.budget ?? 200,
  };
}

function run(id: EffectId, o: RunOptions = {}): { effect: Effect; input: MutableInput } {
  const rand = mulberry32(o.seed ?? 7);
  const effect = EFFECTS[id](stubSprites);
  const input = makeInput(rand, o);
  const steps = o.steps ?? 240;
  for (let k = 0; k < steps; k++) {
    input.t += STEP;
    effect.step(input);
    if (o.tapEvery && k % o.tapEvery === 0 && effect.tap) effect.tap(input.w * 0.5, input.h * 0.4, input);
    o.onStep?.(effect, input, k);
  }
  return { effect, input };
}

function poolOf(effect: Effect): PooledEffect {
  expect(effect).toBeInstanceOf(PooledEffect);
  return effect as PooledEffect;
}

const CORE: readonly EffectId[] = ['snow', 'confetti', 'fireworks'];
const GENERIC: EffectId = 'hearts';
const SAMPLE: readonly EffectId[] = [...CORE, GENERIC];

describe('effects registry', () => {
  it('registers every EffectId with a description', () => {
    for (const id of EFFECT_IDS) {
      expect(typeof EFFECTS[id]).toBe('function');
      expect(DESCRIBE[id].length).toBeGreaterThan(8);
      const effect = EFFECTS[id](stubSprites);
      expect(effect.describe.length).toBeGreaterThan(8);
      expect(effect.alive()).toBe(0);
    }
  });

  it('keeps the real presets out of PENDING_PRESETS', () => {
    for (const id of CORE) expect(PENDING_PRESETS).not.toContain(id);
    for (const id of PENDING_PRESETS) expect(EFFECT_IDS).toContain(id);
  });

  it('ships the sprite painters presets rely on', () => {
    for (const name of ['glow', 'circle', 'snowflake', 'confettiRect', 'confettiStreamer', 'star', 'groundhog', 'cloud', 'papelPicado']) {
      expect(PAINTER_NAMES).toContain(name);
    }
    const cache = createSpriteCache();
    expect(cache.stub).toBe(true);
    expect(cache.has('glyph:🎃')).toBe(true);
    expect(() => cache.draw(fakeContext(), 'heart', 20, '#fff', 1, 2)).not.toThrow();
  });
});

describe('presets: determinism with a seeded RNG', () => {
  for (const id of SAMPLE) {
    it(`${id}: two runs from the same seed hold identical pools`, () => {
      const a = run(id, { seed: 11, tapEvery: 50 });
      const b = run(id, { seed: 11, tapEvery: 50 });
      expect(poolOf(a.effect).pool.count).toBeGreaterThan(0);
      expect(poolOf(a.effect).pool.equals(poolOf(b.effect).pool)).toBe(true);
    });

    it(`${id}: a different seed gives a different sky`, () => {
      const a = run(id, { seed: 11 });
      const c = run(id, { seed: 12 });
      expect(poolOf(a.effect).pool.equals(poolOf(c.effect).pool)).toBe(false);
    });
  }
});

describe('presets: alive never exceeds the budget', () => {
  for (const id of SAMPLE) {
    it(`${id}: stays within budget while raining and tapping, and shrinks when the budget drops`, () => {
      const budget = 120;
      let max = 0;
      const { effect, input } = run(id, {
        budget, steps: 600, tapEvery: 7,
        onStep: (fx) => { max = Math.max(max, fx.alive()); },
      });
      expect(max).toBeGreaterThan(20);
      expect(max).toBeLessThanOrEqual(budget);
      const smaller = { ...input, budget: 40, t: input.t + STEP };
      effect.step(smaller);
      expect(effect.alive()).toBeLessThanOrEqual(40);
      expect(poolOf(effect).pool.finite()).toBe(true);
    });
  }
});

describe('presets: still frames', () => {
  const variants: readonly (readonly [EffectId, EffectParams, Theme])[] = [
    ['snow', {}, THEMES.christmas],
    ['snow', { variant: 'shadow' }, THEMES.snowday],
    ['confetti', {}, THEMES.newyear],
    ['confetti', { glyphs: ['🍕', '🐿️'] }, THEMES.silly],
    ['confetti', { variant: 'banner' }, THEMES.carnival],
    ['confetti', { variant: 'cannon' }, THEMES.newyear],
    ['confetti', { variant: 'fools' }, THEMES.carnival],
    ['fireworks', {}, THEMES.usa],
    ['fireworks', { variant: 'star', palette: ['#ff4d5e', '#7cc4ff', '#ffffff'] }, THEMES.juneteenth],
    [GENERIC, { palette: ['#ffb703', '#ff8fb8'] }, THEMES.mothers],
    ['glyph-rain', { glyphs: ['🕊️', '❤️'] }, THEMES.mlk],
  ];
  for (const [id, params, theme] of variants) {
    it(`${id} ${JSON.stringify(params)}: still() leaves a non-empty, finite pool that draws without a canvas`, () => {
      const effect = EFFECTS[id](stubSprites);
      const input = makeInput(mulberry32(3), { params, theme, budget: 150 });
      effect.still(input);
      const pool = poolOf(effect).pool;
      expect(pool.count).toBeGreaterThan(10);
      expect(pool.count).toBeLessThanOrEqual(150);
      expect(pool.finite()).toBe(true);
      for (let i = 0; i < pool.count; i++) {
        expect(pool.x[i]!).toBeGreaterThanOrEqual(-60);
        expect(pool.x[i]!).toBeLessThanOrEqual(input.w + 60);
        expect(pool.y[i]!).toBeLessThanOrEqual(input.h + 1);
      }
      expect(() => effect.draw(fakeContext(), input)).not.toThrow();
      // And the live loop draws too (banners, groundhog, lighter pass).
      for (let k = 0; k < 30; k++) {
        input.t += STEP;
        effect.step(input);
      }
      effect.tap?.(100, 100, input);
      expect(() => effect.draw(fakeContext(), input)).not.toThrow();
      expect(pool.finite()).toBe(true);
    });
  }
});

describe('snow', () => {
  it('fills three depth layers and wraps horizontally in the wind', () => {
    const { effect } = run('snow', { steps: 900, budget: 300, theme: THEMES.christmas });
    const pool = poolOf(effect).pool;
    let far = 0;
    let mid = 0;
    let near = 0;
    for (let i = 0; i < pool.count; i++) {
      const d = pool.depth[i]!;
      if (d < 1 / 3) far++;
      else if (d < 2 / 3) mid++;
      else near++;
      expect(pool.x[i]!).toBeGreaterThanOrEqual(-41);
      expect(pool.x[i]!).toBeLessThanOrEqual(841);
    }
    expect(far).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(near);
    expect(near).toBeGreaterThan(5);
  });

  it("variant 'shadow': a tap toggles the groundhog's shadow", () => {
    const { effect, input } = run('snow', { params: { variant: 'shadow' }, theme: THEMES.snowday, steps: 10 });
    const snow = effect as SnowEffect;
    expect(snow.shadow).toBe(false);
    snow.tap(10, 10, input);
    expect(snow.shadow).toBe(true);
    snow.tap(10, 10, input);
    expect(snow.shadow).toBe(false);
  });
});

describe('confetti', () => {
  it('a tap fires cannons from both bottom corners', () => {
    const { effect, input } = run('confetti', { steps: 5, budget: 200 });
    const pool = poolOf(effect).pool;
    const before = pool.count;
    effect.tap!(400, 200, input);
    expect(pool.count - before).toBeGreaterThan(40);
    let left = 0;
    let right = 0;
    for (let i = before; i < pool.count; i++) {
      if (pool.x[i]! < 1) left++;
      if (pool.x[i]! > input.w - 1) right++;
      expect(pool.vy[i]!).toBeLessThan(0);
    }
    expect(left).toBeGreaterThan(10);
    expect(right).toBeGreaterThan(10);
  });

  it("variant 'fools' rains upward for two seconds, then falls", () => {
    const { effect, input } = run('confetti', { params: { variant: 'fools' }, theme: THEMES.carnival, steps: 60, budget: 200 });
    const pool = poolOf(effect).pool;
    let rising = 0;
    for (let i = 0; i < pool.count; i++) if (pool.vy[i]! < 0) rising++;
    expect(rising).toBe(pool.count);
    for (let k = 0; k < 200; k++) {
      input.t += STEP;
      effect.step(input);
    }
    let falling = 0;
    for (let i = 0; i < pool.count; i++) if (pool.vy[i]! > 0) falling++;
    expect(falling).toBeGreaterThan(pool.count * 0.8);
  });
});

describe('fireworks', () => {
  it('never blooms more than 3 times in any second, even under tap spam', () => {
    const times: number[] = [];
    let seen = 0;
    run('fireworks', {
      steps: 600, tapEvery: 1, budget: 350,
      onStep: (fx, input) => {
        const f = fx as FireworksEffect;
        while (seen < f.bursts) {
          times.push(input.t);
          seen++;
        }
      },
    });
    expect(times.length).toBeGreaterThan(6);
    expect(times.length).toBeLessThanOrEqual(31);
    for (let a = 0; a < times.length; a++) {
      let n = 0;
      for (let b = a; b < times.length && times[b]! - times[a]! < 1; b++) n++;
      expect(n).toBeLessThanOrEqual(3);
    }
  });

  it('ramps every spark and flash up over at least 300 ms (no pops)', () => {
    expect(BLOOM_RAMP).toBeGreaterThanOrEqual(0.3);
    let sparks = 0;
    run('fireworks', {
      steps: 420, budget: 350,
      onStep: (fx) => {
        const pool = poolOf(fx).pool;
        for (let i = 0; i < pool.count; i++) {
          const kind = pool.kind[i]!;
          if (!isSpark(kind) && kind !== FLASH) continue;
          sparks++;
          expect(pool.alpha[i]!).toBeLessThanOrEqual(pool.life[i]! / BLOOM_RAMP + 1e-3);
          expect(pool.alpha[i]!).toBeLessThanOrEqual(1);
        }
      },
    });
    expect(sparks).toBeGreaterThan(1000);
  });

  it('a tap launches a rocket that bursts near the finger', () => {
    const { effect, input } = run('fireworks', { steps: 2, budget: 350 });
    const f = effect as FireworksEffect;
    const before = f.bursts;
    f.tap(300, 200, input);
    let burstAt = -1;
    for (let k = 0; k < 240 && burstAt < 0; k++) {
      input.t += STEP;
      f.step(input);
      if (f.bursts > before) burstAt = k;
    }
    expect(burstAt).toBeGreaterThan(10);
    const pool = f.pool;
    let near = 0;
    for (let i = 0; i < pool.count; i++) {
      if (isSpark(pool.kind[i]!) && Math.abs(pool.x[i]! - 300) < 60 && Math.abs(pool.y[i]! - 200) < 60) near++;
    }
    expect(near).toBeGreaterThan(20);
  });
});

describe('layer helpers', () => {
  it('RateLimiter allows 3 per second and then refuses until the window moves on', () => {
    const limiter = new RateLimiter(3, 1);
    expect(limiter.allow(0)).toBe(true);
    expect(limiter.allow(0.1)).toBe(true);
    expect(limiter.allow(0.2)).toBe(true);
    expect(limiter.allow(0.3)).toBe(false);
    expect(limiter.allow(0.99)).toBe(false);
    expect(limiter.allow(1.0)).toBe(true);
    expect(limiter.allow(1.05)).toBe(false);
    expect(limiter.allow(1.1)).toBe(true);
    expect(limiter.allow(1.2)).toBe(true);
    expect(limiter.allow(1.3)).toBe(false);
    limiter.reset();
    expect(limiter.allow(1.3)).toBe(true);
  });

  it('QualityController lowers quality (and the budget) after 60 slow frames, recovers after 300 fast ones', () => {
    const q = new QualityController();
    for (let k = 0; k < 59; k++) q.sample(40);
    expect(q.quality).toBe(1);
    expect(q.sample(40)).toBeCloseTo(0.85, 6);
    expect(budgetFor(1280, q.quality)).toBeLessThan(budgetFor(1280, 1));
    expect(budgetFor(1280, q.quality)).toBe(Math.floor(350 * 0.85));
    for (let k = 0; k < 60 * 4; k++) q.sample(40);
    expect(q.quality).toBeCloseTo(0.3, 6);
    for (let k = 0; k < 20; k++) q.sample(8);
    expect(q.quality).toBeCloseTo(0.3, 6);
    for (let k = 0; k < 300; k++) q.sample(8);
    expect(q.quality).toBeCloseTo(0.35, 6);
    expect(q.fps).toBeGreaterThan(100);
  });

  it('FixedStepAccumulator clamps a hitch to 0.1 s of simulation and hands out 1/60 s steps', () => {
    const acc = new FixedStepAccumulator();
    expect(acc.advance(2)).toBe(6);
    expect(acc.advance(0)).toBe(0);
    expect(acc.advance(1 / 60)).toBe(1);
    expect(acc.advance(1 / 120)).toBe(0);
    expect(acc.advance(1 / 120)).toBe(1);
    expect(acc.advance(NaN)).toBe(0);
    expect(acc.advance(-5)).toBe(0);
    let total = 0;
    for (let k = 0; k < 600; k++) total += acc.advance(1 / 60);
    expect(total).toBeGreaterThanOrEqual(599);
    expect(total).toBeLessThanOrEqual(601);
    expect(STEP).toBeLessThanOrEqual(0.05);
  });

  it('budgetFor and dprFor follow the spec tiers', () => {
    expect(budgetFor(360, 1)).toBe(150);
    expect(budgetFor(1280, 1)).toBe(350);
    expect(budgetFor(1280, 1, 2)).toBe(700);
    expect(budgetFor(360, 0.3)).toBe(45);
    expect(budgetFor(100, 0.01)).toBe(20);
    expect(dprFor(3, 2, 1)).toBe(2);
    expect(dprFor(2, 2, 0.5)).toBe(1.5);
    expect(dprFor(2, 2, 0.3)).toBe(1);
    expect(dprFor(1, 2, 0.5)).toBe(1);
  });
});
