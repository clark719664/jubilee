/**
 * effects-whimsy.test.ts — the "whimsy" presets (moon, sabzeh, glyph-rain, balloons, bubbles, planes): every
 * variant steps deterministically from a seed, stays within the particle budget, arranges a finite
 * non-empty still frame, survives taps, and each preset's params and signature interaction do what its
 * header promises.
 */
import { describe, expect, it } from 'vitest';
import { BALLOON, BalloonsEffect, CARP, CONFETTI, FLAME, MAX_CANDLES, balloons } from '../src/effects/fx/balloons';
import { BOAT, BUBBLE, BubblesEffect, DROP, GLOBE, MAX_SPROUTS, SPROUT, bubbles, globeLayout } from '../src/effects/fx/bubbles';
import { DIGIT, GlyphRainEffect, HOP, PI_DIGITS, SPIRAL, charIndex, glyphRain } from '../src/effects/fx/glyph-rain';
import { HELD, LANTERN, MOON, MoonEffect, moon, moonDiameter } from '../src/effects/fx/moon';
import { LOOP, PLANE, PlanesEffect, planes } from '../src/effects/fx/planes';
import { CLUMP, DART, FISH, SabzehEffect, grassHeight, sabzeh } from '../src/effects/fx/sabzeh';
import { PooledEffect } from '../src/effects/fx/shared';
import { mulberry32 } from '../src/effects/rng';
import { STEP } from '../src/effects/timing';
import type { Effect, EffectFactory, EffectInput, EffectParams, SpriteCache } from '../src/effects/types';
import { THEMES, type Theme } from '../src/theme/themes';

const registered: string[] = [];
const stubSprites: SpriteCache = {
  get: () => ({ width: 1, height: 1 } as unknown as CanvasImageSource),
  register: (name) => { registered.push(name); },
  has: () => false,
  draw: () => undefined,
};

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

type MutableInput = { -readonly [K in keyof EffectInput]: EffectInput[K] };

interface Case {
  readonly name: string;
  readonly factory: EffectFactory;
  readonly params: EffectParams;
  readonly theme: Theme;
}

/** Every preset × every variant the registry uses, plus param extremes. */
const CASES: readonly Case[] = [
  { name: 'moon mid-autumn', factory: moon, params: {}, theme: THEMES.midautumn },
  { name: 'moon waxing', factory: moon, params: { moonPhase: 0.2, palette: ['#e8202a', '#ffd166'] }, theme: THEMES.midautumn },
  { name: 'sabzeh nowruz', factory: sabzeh, params: {}, theme: THEMES.nowruz },
  { name: 'sabzeh sprouting', factory: sabzeh, params: { growth: 0.1 }, theme: THEMES.nowruz },
  { name: 'glyph-rain pi', factory: glyphRain, params: { glyphs: ['π', '3', '1', '4', '1', '5', '9'], variant: 'chalk' }, theme: THEMES.pi },
  { name: 'glyph-rain three kings', factory: glyphRain, params: { glyphs: ['⭐', '👑'] }, theme: THEMES.threekings },
  { name: 'glyph-rain mlk', factory: glyphRain, params: { glyphs: ['🕊️', '❤️', '✊'] }, theme: THEMES.mlk },
  { name: 'glyph-rain rosh hashanah', factory: glyphRain, params: { glyphs: ['🍎', '🍯'] }, theme: THEMES.roshhashanah },
  { name: 'glyph-rain leap', factory: glyphRain, params: { glyphs: ['🐸'], variant: 'hop' }, theme: THEMES.leap },
  { name: 'balloons birthday', factory: balloons, params: { candles: 7 }, theme: THEMES.birthday },
  { name: 'balloons plain', factory: balloons, params: {}, theme: THEMES.silly },
  { name: 'balloons koinobori', factory: balloons, params: { variant: 'koinobori' }, theme: THEMES.koinobori },
  { name: 'bubbles plain', factory: bubbles, params: {}, theme: THEMES.silly },
  { name: 'bubbles earth', factory: bubbles, params: { variant: 'earth' }, theme: THEMES.earth },
  { name: 'bubbles water', factory: bubbles, params: { variant: 'water' }, theme: THEMES.splash },
  { name: 'bubbles waves', factory: bubbles, params: { variant: 'waves' }, theme: THEMES.river },
  { name: 'planes', factory: planes, params: {}, theme: THEMES.fathers },
  { name: 'planes night', factory: planes, params: { palette: ['#ffffff', '#ffd166'] }, theme: THEMES.newyear },
];

function makeInput(seed: number, c: Pick<Case, 'params' | 'theme'>, budget: number, w = 800, h = 600): MutableInput {
  return {
    w, h, dt: STEP, t: 0, pointer: null, intensity: 1, motion: 'full', rand: mulberry32(seed),
    params: c.params, theme: c.theme, budget,
  };
}

function advance(effect: Effect, input: MutableInput, steps: number, tapEvery = 0, onStep?: (k: number) => void): void {
  for (let k = 0; k < steps; k++) {
    input.t += STEP;
    effect.step(input);
    if (tapEvery > 0 && k % tapEvery === 0) effect.tap?.(input.w * ((k * 37) % 100) / 100, input.h * (0.3 + ((k * 13) % 60) / 100), input);
    onStep?.(k);
  }
}

function poolOf(effect: Effect): PooledEffect {
  expect(effect).toBeInstanceOf(PooledEffect);
  return effect as PooledEffect;
}

function count(effect: Effect, kind: number): number {
  const pool = poolOf(effect).pool;
  let n = 0;
  for (let i = 0; i < pool.count; i++) if (pool.kind[i] === kind) n++;
  return n;
}

function first(effect: Effect, kind: number): number {
  const pool = poolOf(effect).pool;
  for (let i = 0; i < pool.count; i++) if (pool.kind[i] === kind) return i;
  return -1;
}

describe('whimsy presets: contract', () => {
  for (const c of CASES) {
    it(`${c.name}: same seed → identical pools; different seed → different`, () => {
      const a = c.factory(stubSprites);
      const b = c.factory(stubSprites);
      advance(a, makeInput(11, c, 250), 300, 45);
      advance(b, makeInput(11, c, 250), 300, 45);
      expect(poolOf(a).pool.count).toBeGreaterThan(0);
      expect(poolOf(a).pool.equals(poolOf(b).pool)).toBe(true);
      const d = c.factory(stubSprites);
      advance(d, makeInput(12, c, 250), 300, 45);
      expect(poolOf(a).pool.equals(poolOf(d).pool)).toBe(false);
    });

    for (const budget of [150, 350]) {
      it(`${c.name}: alive() ≤ ${budget} over 600 steps with taps, and shrinks with the budget`, () => {
        const fx = c.factory(stubSprites);
        const input = makeInput(5, c, budget, budget === 150 ? 380 : 1280, budget === 150 ? 640 : 800);
        let max = 0;
        advance(fx, input, 600, 9, () => { max = Math.max(max, fx.alive()); });
        expect(max).toBeGreaterThan(8);
        expect(max).toBeLessThanOrEqual(budget);
        input.budget = 40;
        input.t += STEP;
        fx.step(input);
        expect(fx.alive()).toBeLessThanOrEqual(40);
        expect(poolOf(fx).pool.finite()).toBe(true);
        expect(() => fx.draw(fakeContext(), input)).not.toThrow();
      });
    }

    it(`${c.name}: still() is a finite, non-empty settled frame; tap and draw work after`, () => {
      const fx = c.factory(stubSprites);
      const input = makeInput(3, c, 150);
      input.motion = 'reduced';
      fx.still(input);
      const pool = poolOf(fx).pool;
      expect(pool.count).toBeGreaterThan(5);
      expect(pool.count).toBeLessThanOrEqual(150);
      expect(pool.finite()).toBe(true);
      for (let i = 0; i < pool.count; i++) {
        expect(pool.x[i]!).toBeGreaterThanOrEqual(-80);
        expect(pool.x[i]!).toBeLessThanOrEqual(input.w + 80);
        expect(pool.y[i]!).toBeLessThanOrEqual(input.h + 40);
      }
      expect(() => fx.draw(fakeContext(), input)).not.toThrow();
      fx.tap?.(input.w / 2, input.h / 2, input);
      expect(fx.alive()).toBeLessThanOrEqual(150);
      advance(fx, input, 30);
      expect(pool.finite()).toBe(true);
      expect(() => fx.draw(fakeContext(), input)).not.toThrow();
      expect(fx.describe.length).toBeGreaterThan(10);
    });

    it(`${c.name}: a zero-sized canvas does not produce NaN`, () => {
      const fx = c.factory(stubSprites);
      const input = makeInput(9, c, 150, 0, 0);
      advance(fx, input, 20, 5);
      fx.still(input);
      expect(poolOf(fx).pool.finite()).toBe(true);
      expect(() => fx.draw(fakeContext(), input)).not.toThrow();
    });
  }

  it('registers its own sprites under preset prefixes', () => {
    for (const c of CASES) c.factory(stubSprites);
    for (const name of [
      'moon:disc', 'moon:rabbit', 'moon:lantern', 'moon:cloud', 'sabzeh:bow', 'glyph-rain:smudge', 'balloons:cake',
      'balloons:candle', 'balloons:wheel', 'bubbles:bubble', 'bubbles:ocean', 'bubbles:land0', 'bubbles:boat',
      'bubbles:drop', 'planes:plane', 'planes:cloud',
    ]) {
      expect(registered).toContain(name);
    }
  });
});

describe('moon', () => {
  it('moonPhase sizes the moon in the still frame (0.5 + 0.5·phase)', () => {
    const size = (moonPhase: number): number => {
      const fx = moon(stubSprites) as MoonEffect;
      fx.still(makeInput(1, { params: { moonPhase }, theme: THEMES.midautumn }, 200, 1280, 800));
      return fx.pool.size[first(fx, MOON)]!;
    };
    expect(size(1)).toBeCloseTo(moonDiameter(1280, 800, 1));
    expect(size(0) / size(1)).toBeCloseTo(0.5, 2);
    expect(size(0.5)).toBeGreaterThan(size(0));
  });

  it('press-and-hold grows a lantern under the finger and release floats it up', () => {
    const c = CASES[0]!;
    const fx = moon(stubSprites) as MoonEffect;
    const input = makeInput(2, c, 300, 1280, 800);
    advance(fx, input, 10);
    fx.press(500, 500, true, input);
    expect(count(fx, HELD)).toBe(1);
    input.pointer = { x: 520, y: 480, down: true };
    advance(fx, input, 90);
    const i = first(fx, HELD);
    expect(fx.pool.size[i]!).toBeGreaterThan(40);
    fx.press(520, 480, false, input);
    expect(count(fx, HELD)).toBe(0);
    expect(fx.released).toBe(1);
    // A tap straight after a release is the same gesture: glints only, no second lantern.
    const lanterns = count(fx, LANTERN);
    fx.tap(520, 480, input);
    expect(count(fx, LANTERN)).toBe(lanterns);
    expect(fx.released).toBe(1);
  });
});

describe('sabzeh', () => {
  it('growth sets the lawn height; a tap sends the nearest fish darting to the finger', () => {
    expect(grassHeight(800, 1)).toBeGreaterThan(grassHeight(800, 0.2) * 2);
    const c = CASES[2]!;
    const fx = sabzeh(stubSprites) as SabzehEffect;
    const input = makeInput(4, c, 300, 1280, 800);
    fx.still(input);
    expect(count(fx, CLUMP)).toBeGreaterThan(20);
    expect(count(fx, FISH)).toBeGreaterThan(2);
    advance(fx, input, 10);
    fx.tap(300, 300, input);
    expect(fx.darts).toBe(1);
    expect(count(fx, DART)).toBe(1);
    advance(fx, input, 120);
    expect(count(fx, DART)).toBe(0);
  });
});

describe('glyph-rain', () => {
  it('chalk: π digits fall in reading order; a tap spirals; three quick taps rain 100 digits', () => {
    const c = CASES[4]!;
    const fx = glyphRain(stubSprites) as GlyphRainEffect;
    const input = makeInput(6, c, 350, 1280, 800);
    fx.still(input);
    const digits: number[] = [];
    for (let i = 0; i < fx.pool.count; i++) if (fx.pool.kind[i] === DIGIT) digits.push(fx.pool.color[i]!);
    expect(digits.length).toBeGreaterThan(20);
    for (let k = 0; k < 8; k++) expect(digits[k]).toBe(charIndex(PI_DIGITS[k]!));
    advance(fx, input, 5);
    fx.tap(600, 400, input);
    expect(count(fx, SPIRAL)).toBeGreaterThan(10);
    input.t += 0.4;
    fx.tap(600, 400, input);
    input.t += 0.4;
    fx.tap(600, 400, input);
    expect(fx.secretRains).toBe(1);
    expect(fx.rainLeft).toBe(100);
    advance(fx, input, 240);
    expect(fx.rainLeft).toBeLessThan(100);
  });

  it('hop: a tap makes a frog leap and it rejoins the rain', () => {
    const c = CASES[8]!;
    const fx = glyphRain(stubSprites) as GlyphRainEffect;
    const input = makeInput(7, c, 300, 1280, 800);
    advance(fx, input, 30);
    fx.tap(640, 400, input);
    expect(fx.hops).toBe(1);
    expect(count(fx, HOP)).toBeGreaterThanOrEqual(1);
    advance(fx, input, 400);
    expect(fx.pool.finite()).toBe(true);
  });
});

describe('balloons', () => {
  const flames = (candles: number): number => {
    const fx = balloons(stubSprites) as BalloonsEffect;
    fx.still(makeInput(1, { params: { candles }, theme: THEMES.birthday }, 350, 1280, 800));
    return count(fx, FLAME);
  };

  it('candles draws a cake with that many lit candles (capped)', () => {
    expect(flames(0)).toBe(0);
    expect(flames(7)).toBe(7);
    expect(flames(16)).toBe(16);
    expect(flames(90)).toBe(MAX_CANDLES);
  });

  it('a tap on a balloon pops it into confetti', () => {
    const c = CASES[9]!;
    const fx = balloons(stubSprites) as BalloonsEffect;
    const input = makeInput(3, c, 350, 1280, 800);
    advance(fx, input, 30);
    const i = first(fx, BALLOON);
    fx.tap(fx.pool.x[i]!, fx.pool.y[i]!, input);
    expect(fx.pops).toBe(1);
    expect(count(fx, CONFETTI)).toBeGreaterThan(10);
  });

  it('koinobori flies carp streamers; a tap sets a little carp free', () => {
    const c = CASES[11]!;
    const fx = balloons(stubSprites) as BalloonsEffect;
    const input = makeInput(3, c, 300, 1280, 800);
    advance(fx, input, 10);
    expect(count(fx, CARP)).toBeGreaterThanOrEqual(3);
    expect(count(fx, BALLOON)).toBe(0);
    fx.tap(700, 300, input);
    expect(fx.released).toBe(1);
  });
});

describe('bubbles', () => {
  it('plain: a tap pops the bubbles around the finger in a cascade', () => {
    const c = CASES[12]!;
    const fx = bubbles(stubSprites) as BubblesEffect;
    const input = makeInput(8, c, 350, 1280, 800);
    advance(fx, input, 120);
    const i = first(fx, BUBBLE);
    fx.tap(fx.pool.x[i]!, fx.pool.y[i]!, input);
    advance(fx, input, 30);
    expect(fx.popped).toBeGreaterThanOrEqual(1);
  });

  it('earth: a globe turns, and taps plant sprouts (never more than MAX_SPROUTS)', () => {
    const c = CASES[13]!;
    const fx = bubbles(stubSprites) as BubblesEffect;
    const input = makeInput(8, c, 350, 1280, 800);
    advance(fx, input, 5);
    const g = first(fx, GLOBE);
    expect(fx.pool.size[g]!).toBeCloseTo(globeLayout(1280, 800).d);
    const r0 = fx.pool.rot[g]!;
    advance(fx, input, 60);
    expect(fx.pool.rot[first(fx, GLOBE)]!).toBeGreaterThan(r0);
    for (let k = 0; k < 10; k++) {
      fx.tap(100 + k * 100, 500, input);
      advance(fx, input, 20);
    }
    expect(fx.planted).toBe(10);
    expect(count(fx, SPROUT)).toBe(MAX_SPROUTS);
    fx.still(input);
    expect(count(fx, SPROUT)).toBeGreaterThan(0);
  });

  it('water: throws arc drops across the sky; a tap splashes', () => {
    const c = CASES[14]!;
    const fx = bubbles(stubSprites) as BubblesEffect;
    const input = makeInput(8, c, 350, 1280, 800);
    let maxDrops = 0;
    advance(fx, input, 300, 0, () => { maxDrops = Math.max(maxDrops, count(fx, DROP)); });
    expect(maxDrops).toBeGreaterThan(8);
    fx.tap(640, 300, input);
    expect(fx.splashes).toBe(1);
    fx.still(input);
    expect(count(fx, DROP)).toBeGreaterThan(10);
  });

  it('waves: dragon boats ride the waves and their paddles splash', () => {
    const c = CASES[15]!;
    const fx = bubbles(stubSprites) as BubblesEffect;
    const input = makeInput(8, c, 350, 1280, 800);
    let drops = 0;
    advance(fx, input, 240, 0, () => { drops = Math.max(drops, count(fx, DROP)); });
    expect(count(fx, BOAT)).toBe(2);
    expect(drops).toBeGreaterThan(0);
    const b = first(fx, BOAT);
    const layer = fx.pool.depth[b]! > 0.8 ? 1 : 0;
    expect(Math.abs(fx.pool.y[b]! - fx.surface(fx.pool.x[b]!, layer))).toBeLessThan(fx.pool.size[b]! * 0.1);
    fx.tap(640, 760, input);
    expect(fx.splashes).toBe(1);
  });
});

describe('planes', () => {
  it('a tap throws a plane from the finger toward the open sky, and planes perform stunts', () => {
    const c = CASES[16]!;
    const fx = planes(stubSprites) as PlanesEffect;
    const input = makeInput(10, c, 350, 1280, 800);
    advance(fx, input, 30);
    const before = count(fx, PLANE);
    fx.tap(200, 500, input);
    expect(fx.launched).toBe(1);
    expect(count(fx, PLANE)).toBe(before + 1);
    let thrown = 0;
    for (let i = 0; i < fx.pool.count; i++) if (fx.pool.kind[i] === PLANE && fx.pool.vx[i]! > 100) thrown++;
    expect(thrown).toBe(1);
    let loops = 0;
    advance(fx, input, 3600, 0, () => { loops = Math.max(loops, count(fx, LOOP)); });
    expect(fx.stunts).toBeGreaterThan(0);
    expect(loops).toBeGreaterThan(0);
    expect(fx.pool.finite()).toBe(true);
  });
});
