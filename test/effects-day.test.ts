/**
 * effects-day.test.ts — the "day" presets (hearts, holi, leaves, shamrocks, eggs, petals): every variant
 * steps deterministically from a seed, stays within the particle budget, arranges a finite non-empty
 * still frame, survives taps, and each preset's signature interaction does what its header promises.
 */
import { describe, expect, it } from 'vitest';
import { EggsEffect, isEgg } from '../src/effects/fx/eggs';
import { HeartsEffect, heartbeat } from '../src/effects/fx/hearts';
import { HoliEffect, PUFF, resetHoliSession } from '../src/effects/fx/holi';
import { LeavesEffect, isFalling, isResting } from '../src/effects/fx/leaves';
import { CANDLE, FLOWER, PetalsEffect, lookFor } from '../src/effects/fx/petals';
import { PooledEffect } from '../src/effects/fx/shared';
import { COIN, ShamrocksEffect } from '../src/effects/fx/shamrocks';
import { mulberry32 } from '../src/effects/rng';
import { STEP } from '../src/effects/timing';
import type { Effect, EffectFactory, EffectInput, EffectParams, SpriteCache } from '../src/effects/types';
import { THEMES, type Theme } from '../src/theme/themes';
import { eggs } from '../src/effects/fx/eggs';
import { hearts } from '../src/effects/fx/hearts';
import { holi } from '../src/effects/fx/holi';
import { leaves } from '../src/effects/fx/leaves';
import { petals } from '../src/effects/fx/petals';
import { shamrocks } from '../src/effects/fx/shamrocks';

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

/** Every preset × every variant/palette the registry uses (plus the plain default). */
const CASES: readonly Case[] = [
  { name: 'hearts valentine', factory: hearts, params: {}, theme: THEMES.valentine },
  { name: 'hearts grandparents', factory: hearts, params: { palette: ['#ffb703', '#ff8fb8', '#c8442e'] }, theme: THEMES.mothers },
  { name: 'hearts night', factory: hearts, params: {}, theme: THEMES.newyear },
  { name: 'holi', factory: holi, params: {}, theme: THEMES.holi },
  { name: 'leaves thanksgiving', factory: leaves, params: {}, theme: THEMES.harvest },
  { name: 'leaves indigenous', factory: leaves, params: { palette: ['#c8102e', '#ff8c1a', '#ffd166', '#7a3e13'] }, theme: THEMES.harvest },
  { name: 'shamrocks', factory: shamrocks, params: {}, theme: THEMES.stpatricks },
  { name: 'eggs easter', factory: eggs, params: {}, theme: THEMES.easter },
  { name: 'eggs orthodox', factory: eggs, params: { palette: ['#c8102e', '#b3121b', '#ffd166'] }, theme: THEMES.dawn },
  { name: 'petals marigold', factory: petals, params: { variant: 'marigold' }, theme: THEMES.muertos },
  { name: 'petals bloom', factory: petals, params: { variant: 'bloom' }, theme: THEMES.mothers },
  { name: 'petals poppies', factory: petals, params: { variant: 'poppies' }, theme: THEMES.usa },
  { name: 'petals spring', factory: petals, params: { variant: 'spring', palette: ['#9be7d3', '#2a7f4f', '#ffffff'] }, theme: THEMES.passover },
  { name: 'petals default', factory: petals, params: {}, theme: THEMES.silly },
];

function makeInput(seed: number, c: Case, budget: number, w = 800, h = 600): MutableInput {
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

describe('day presets: contract', () => {
  for (const c of CASES) {
    it(`${c.name}: same seed → identical pools; different seed → different`, () => {
      resetHoliSession();
      const a = c.factory(stubSprites);
      const b = c.factory(stubSprites);
      const ia = makeInput(11, c, 250);
      const ib = makeInput(11, c, 250);
      advance(a, ia, 300, 45);
      advance(b, ib, 300, 45);
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
        expect(max).toBeGreaterThan(15);
        expect(max).toBeLessThanOrEqual(budget);
        input.budget = 40;
        input.t += STEP;
        fx.step(input);
        expect(fx.alive()).toBeLessThanOrEqual(40);
        expect(poolOf(fx).pool.finite()).toBe(true);
        expect(() => fx.draw(fakeContext(), input)).not.toThrow();
      });
    }

    it(`${c.name}: still() is a finite, non-empty settled frame inside the canvas; tap and draw work after`, () => {
      const fx = c.factory(stubSprites);
      const input = makeInput(3, c, 150);
      input.motion = 'reduced';
      fx.still(input);
      const pool = poolOf(fx).pool;
      expect(pool.count).toBeGreaterThan(10);
      expect(pool.count).toBeLessThanOrEqual(150);
      expect(pool.finite()).toBe(true);
      for (let i = 0; i < pool.count; i++) {
        expect(pool.x[i]!).toBeGreaterThanOrEqual(-60);
        expect(pool.x[i]!).toBeLessThanOrEqual(input.w + 60);
        expect(pool.y[i]!).toBeLessThanOrEqual(input.h + 6);
      }
      expect(() => fx.draw(fakeContext(), input)).not.toThrow();
      fx.tap?.(input.w / 2, input.h / 2, input);
      expect(fx.alive()).toBeLessThanOrEqual(150);
      advance(fx, input, 30);
      expect(pool.finite()).toBe(true);
      expect(() => fx.draw(fakeContext(), input)).not.toThrow();
    });

    it(`${c.name}: a zero-sized canvas does not produce NaN`, () => {
      const fx = c.factory(stubSprites);
      const input = makeInput(9, c, 150, 0, 0);
      advance(fx, input, 20, 5);
      fx.still(input);
      expect(poolOf(fx).pool.finite()).toBe(true);
    });
  }

  it('registers its own sprites under preset prefixes', () => {
    for (const c of CASES) c.factory(stubSprites);
    for (const name of ['hearts:big', 'holi:splash0', 'shamrocks:pot', 'shamrocks:clover4', 'eggs:grass', 'eggs:half', 'eggs:ears', 'petals:poppy', 'petals:daisy', 'petals:tulip', 'petals:leaf', 'petals:candle']) {
      expect(registered).toContain(name);
    }
  });
});

describe('hearts', () => {
  it('beats lub-dub at 60 bpm and a tap on the big heart kicks it', () => {
    expect(heartbeat(0.08)).toBeGreaterThan(0.9);
    expect(heartbeat(0.32)).toBeGreaterThan(0.5);
    expect(heartbeat(0.7)).toBe(0);
    const c = CASES[0]!;
    const fx = c.factory(stubSprites) as HeartsEffect;
    const input = makeInput(1, c, 300, 1280, 800);
    advance(fx, input, 10);
    const before = fx.alive();
    fx.tap(1280 * 0.74, 800 * 0.38, input);
    expect(fx.kick).toBe(1);
    expect(fx.alive() - before).toBeGreaterThanOrEqual(20);
  });
});

describe('holi', () => {
  it('a tap throws a puff and queues stamps; puffs stamp again as they fade', () => {
    resetHoliSession();
    const c = CASES[3]!;
    const fx = c.factory(stubSprites) as HoliEffect;
    const input = makeInput(2, c, 300);
    advance(fx, input, 5);
    const stamped = fx.stamped;
    fx.tap(400, 300, input);
    expect(fx.stamped).toBe(stamped + 2);
    let puffs = 0;
    for (let i = 0; i < fx.pool.count; i++) if (fx.pool.kind[i] === PUFF) puffs++;
    expect(puffs).toBeGreaterThan(15);
    advance(fx, input, 200);
    expect(fx.stamped).toBeGreaterThan(stamped + 15);
  });
});

describe('leaves', () => {
  it('builds a pile, and a tap kicks resting leaves back into the air and recolours one', () => {
    const c = CASES[4]!;
    const fx = c.factory(stubSprites) as LeavesEffect;
    const input = makeInput(4, c, 300);
    input.motion = 'reduced';
    fx.still(input);
    const pool = fx.pool;
    let resting = 0;
    for (let i = 0; i < pool.count; i++) if (isResting(pool.kind[i]!)) resting++;
    expect(resting).toBeGreaterThan(40);
    fx.tap(400, 590, input);
    let kicked = 0;
    for (let i = 0; i < pool.count; i++) if (isFalling(pool.kind[i]!) && pool.vy[i]! < -50) kicked++;
    expect(kicked).toBeGreaterThan(5);
    expect(fx.recoloured).toBe(1);
    expect(fx.gust).not.toBe(0);
  });

  it('the turkey struts only on Thanksgiving (harvest without a custom palette)', () => {
    const thanks = CASES[4]!;
    const indigenous = CASES[5]!;
    const a = thanks.factory(stubSprites) as LeavesEffect;
    const ia = makeInput(4, thanks, 200);
    advance(a, ia, 2);
    const x0 = a.turkeyX;
    advance(a, ia, 60);
    expect(a.turkeyX).not.toBe(x0);
    const b = indigenous.factory(stubSprites) as LeavesEffect;
    const ib = makeInput(4, indigenous, 200);
    advance(b, ib, 2);
    const y0 = b.turkeyX;
    advance(b, ib, 60);
    expect(b.turkeyX).toBe(y0);
  });
});

describe('shamrocks', () => {
  it('coins hop out of the pot; tapping one collects it into the counter', () => {
    const c = CASES[6]!;
    const fx = c.factory(stubSprites) as ShamrocksEffect;
    const input = makeInput(6, c, 300, 1280, 800);
    let coin = -1;
    for (let k = 0; k < 600 && coin < 0; k++) {
      input.t += STEP;
      fx.step(input);
      for (let i = 0; i < fx.pool.count; i++) if (fx.pool.kind[i] === COIN) coin = i;
    }
    expect(coin).toBeGreaterThanOrEqual(0);
    fx.tap(fx.pool.x[coin]!, fx.pool.y[coin]!, input);
    advance(fx, input, 60);
    expect(fx.collected).toBe(1);
  });
});

describe('eggs', () => {
  it('keeps a row of eggs; tapping one cracks it and a new one hops in later', () => {
    const c = CASES[7]!;
    const fx = c.factory(stubSprites) as EggsEffect;
    const input = makeInput(8, c, 300, 960, 600);
    advance(fx, input, 30);
    const count = (): number => {
      let n = 0;
      for (let i = 0; i < fx.pool.count; i++) if (isEgg(fx.pool.kind[i]!)) n++;
      return n;
    };
    const n0 = count();
    expect(n0).toBe(6);
    let egg = -1;
    for (let i = 0; i < fx.pool.count; i++) if (isEgg(fx.pool.kind[i]!)) egg = i;
    fx.tap(fx.pool.x[egg]!, fx.pool.y[egg]!, input);
    expect(fx.cracked).toBe(1);
    expect(count()).toBe(n0 - 1);
    advance(fx, input, 60 * 4);
    expect(count()).toBe(n0);
  });
});

describe('petals', () => {
  it('bloom flowers unfurl over ~2 s and still() shows them open; marigold lights candles', () => {
    const bloom = CASES[10]!;
    const fx = bloom.factory(stubSprites) as PetalsEffect;
    const input = makeInput(10, bloom, 300);
    advance(fx, input, 1);
    let flowers = 0;
    let youngest = Infinity;
    for (let i = 0; i < fx.pool.count; i++) {
      if (fx.pool.kind[i] !== FLOWER) continue;
      flowers++;
      youngest = Math.min(youngest, fx.pool.life[i]!);
    }
    expect(flowers).toBeGreaterThanOrEqual(6);
    expect(youngest).toBeLessThan(0.1);
    const still = bloom.factory(stubSprites) as PetalsEffect;
    still.still(makeInput(10, bloom, 300));
    for (let i = 0; i < still.pool.count; i++) if (still.pool.kind[i] === FLOWER) expect(still.pool.life[i]!).toBeGreaterThanOrEqual(2);

    const mari = CASES[9]!;
    const m = mari.factory(stubSprites) as PetalsEffect;
    m.still(makeInput(10, mari, 300));
    let candles = 0;
    for (let i = 0; i < m.pool.count; i++) if (m.pool.kind[i] === CANDLE) candles++;
    expect(candles).toBeGreaterThanOrEqual(4);
  });

  it('variants change what still() produces; spring takes leaf greens from the palette', () => {
    const kinds = (c: Case): string => {
      const fx = c.factory(stubSprites) as PetalsEffect;
      fx.still(makeInput(10, c, 300));
      const seen = new Set<number>();
      for (let i = 0; i < fx.pool.count; i++) seen.add(fx.pool.kind[i]!);
      return [...seen].sort().join(',');
    };
    expect(kinds(CASES[9]!)).not.toBe(kinds(CASES[10]!));
    expect(kinds(CASES[13]!)).not.toBe(kinds(CASES[10]!));
    const spring = lookFor('spring', ['#9be7d3', '#2a7f4f', '#ffffff'], THEMES.passover);
    expect(spring.leaves).toEqual(['#9be7d3', '#2a7f4f']);
    expect(spring.leafShare).toBeGreaterThan(0);
  });
});
