/**
 * effects-night.test.ts — the night presets (bats, lanterns, diyas, menorah, kinara, crescent) in Node:
 * deterministic from a seed, within budget while tapping, finite non-empty still frames, params that
 * really change the scene, and each preset's own tap/press behaviour.
 */
import { describe, expect, it } from 'vitest';
import { BAT, BatsEffect, bats } from '../src/effects/fx/bats';
import { crescent, CrescentEffect, MOON, litFraction, phaseStep } from '../src/effects/fx/crescent';
import { DIYA, RING, diyas, diyaCount, ringReveal } from '../src/effects/fx/diyas';
import { kinara, KinaraEffect, LIGHTING_ORDER, CANDLE as KINARA_CANDLE, kinaraLit } from '../src/effects/fx/kinara';
import { GROW, LANTERN, LanternsEffect, POP, POP_RAMP, SKY, lanterns } from '../src/effects/fx/lanterns';
import {
  CANDLE, DREIDEL, DREIDEL_LETTERS, DREIDEL_MEANINGS, MenorahEffect, litBranches, menorah,
} from '../src/effects/fx/menorah';
import { PooledEffect } from '../src/effects/fx/shared';
import { STEP } from '../src/effects/layer';
import { mulberry32 } from '../src/effects/rng';
import type { Effect, EffectFactory, EffectInput, EffectParams, SpriteCache, SpritePainter } from '../src/effects/types';
import { THEMES, type Theme } from '../src/theme/themes';

/** A SpriteCache that records registrations and never paints. */
function recordingSprites(): SpriteCache & { names: Set<string> } {
  const names = new Set<string>();
  return {
    names,
    get: () => ({ width: 1, height: 1 } as unknown as CanvasImageSource),
    register: (name: string, _p: SpritePainter) => { names.add(name); },
    has: (name: string) => names.has(name) || name.startsWith('glyph:') || !name.includes(':'),
    draw: () => undefined,
  };
}

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

type MutableInput = { -readonly [K in keyof EffectInput]: EffectInput[K] };

interface Case {
  readonly name: string;
  readonly factory: EffectFactory;
  readonly params: EffectParams;
  readonly theme: Theme;
}

const CASES: readonly Case[] = [
  { name: 'bats', factory: bats, params: {}, theme: THEMES.halloween },
  { name: 'lanterns hanging', factory: lanterns, params: { variant: 'hanging' }, theme: THEMES.lunar },
  { name: 'lanterns rising', factory: lanterns, params: { variant: 'rising' }, theme: THEMES.lunar },
  { name: 'diyas', factory: diyas, params: {}, theme: THEMES.diwali },
  { name: 'diyas growth 0.3', factory: diyas, params: { growth: 0.3 }, theme: THEMES.diwali },
  { name: 'menorah', factory: menorah, params: {}, theme: THEMES.hanukkah },
  { name: 'menorah 3 candles', factory: menorah, params: { candles: 3 }, theme: THEMES.hanukkah },
  { name: 'kinara', factory: kinara, params: {}, theme: THEMES.kwanzaa },
  { name: 'kinara 4 candles', factory: kinara, params: { candles: 4 }, theme: THEMES.kwanzaa },
  { name: 'crescent', factory: crescent, params: {}, theme: THEMES.eid },
  { name: 'crescent ramadan', factory: crescent, params: { moonPhase: 0.5 }, theme: THEMES.ramadan },
  { name: 'crescent lanterns', factory: crescent, params: { variant: 'lanterns' }, theme: THEMES.eid },
];

function makeInput(seed: number, c: Case, budget: number, w = 800, h = 600): MutableInput {
  return {
    w, h, dt: STEP, t: 0, pointer: null, intensity: 1, motion: 'full', rand: mulberry32(seed),
    params: c.params, theme: c.theme, budget,
  };
}

function poolOf(effect: Effect): PooledEffect {
  expect(effect).toBeInstanceOf(PooledEffect);
  return effect as PooledEffect;
}

/** Steps `steps` frames; taps (and, for hold-to-grow, presses) every `tapEvery` steps. */
function run(c: Case, o: { seed?: number; steps?: number; budget?: number; tapEvery?: number; onStep?: (fx: Effect, input: MutableInput) => void } = {}): { effect: Effect; input: MutableInput } {
  const effect = c.factory(recordingSprites());
  const input = makeInput(o.seed ?? 7, c, o.budget ?? 200);
  const steps = o.steps ?? 240;
  for (let k = 0; k < steps; k++) {
    input.t += STEP;
    effect.step(input);
    if (o.tapEvery && k % o.tapEvery === 0) {
      const x = 120 + ((k * 37) % 560);
      const y = 80 + ((k * 53) % 420);
      effect.tap?.(x, y, input);
      if (k % (o.tapEvery * 3) === 0) effect.press?.(x, y, true, input);
      else effect.press?.(x, y, false, input);
    }
    o.onStep?.(effect, input);
  }
  return { effect, input };
}

function count(effect: Effect, kind: number): number {
  const pool = poolOf(effect).pool;
  let n = 0;
  for (let i = 0; i < pool.count; i++) if (pool.kind[i] === kind) n++;
  return n;
}

describe('night presets: contract', () => {
  for (const c of CASES) {
    it(`${c.name}: two runs from the same seed hold identical pools`, () => {
      const a = run(c, { seed: 11, tapEvery: 50 });
      const b = run(c, { seed: 11, tapEvery: 50 });
      expect(poolOf(a.effect).pool.count).toBeGreaterThan(0);
      expect(poolOf(a.effect).pool.equals(poolOf(b.effect).pool)).toBe(true);
    });

    for (const budget of [150, 350]) {
      it(`${c.name}: alive() stays within a budget of ${budget} over 600 steps of tapping`, () => {
        let max = 0;
        const { effect, input } = run(c, {
          budget, steps: 600, tapEvery: 7,
          onStep: (fx) => { max = Math.max(max, fx.alive()); },
        });
        expect(max).toBeGreaterThan(10);
        expect(max).toBeLessThanOrEqual(budget);
        expect(poolOf(effect).pool.finite()).toBe(true);
        input.budget = 40;
        input.t += STEP;
        effect.step(input);
        expect(effect.alive()).toBeLessThanOrEqual(40);
        expect(() => effect.draw(fakeContext(), input)).not.toThrow();
      });
    }

    it(`${c.name}: still() leaves a finite, non-empty pool that draws, then taps within budget`, () => {
      const effect = c.factory(recordingSprites());
      const input = makeInput(3, c, 150);
      input.motion = 'reduced';
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
      effect.tap?.(400, 200, input);
      expect(effect.alive()).toBeLessThanOrEqual(150);
      for (let k = 0; k < 18; k++) {
        input.t += STEP;
        effect.step(input);
      }
      expect(effect.alive()).toBeLessThanOrEqual(150);
      expect(pool.finite()).toBe(true);
      expect(() => effect.draw(fakeContext(), input)).not.toThrow();
    });
  }

  it('registers prefixed sprites only, each once', () => {
    const sprites = recordingSprites();
    for (const f of [bats, lanterns, diyas, menorah, kinara, crescent]) {
      const fx = f(sprites);
      fx.still(makeInput(1, { name: '', factory: f, params: {}, theme: THEMES.eid }, 150));
    }
    f2: for (const name of sprites.names) {
      for (const prefix of ['bats:', 'lanterns:', 'diyas:', 'menorah:', 'kinara:', 'crescent:']) if (name.startsWith(prefix)) continue f2;
      throw new Error(`unprefixed sprite ${name}`);
    }
    expect(sprites.names.has('menorah:dreidel3')).toBe(true);
    expect(sprites.names.has('diyas:ring4')).toBe(true);
    expect(sprites.names.has('kinara:kente')).toBe(true);
  });
});

describe('night presets: params change the still frame', () => {
  function stillOf(c: Case): Effect {
    const effect = c.factory(recordingSprites());
    effect.still(makeInput(5, c, 200));
    return effect;
  }

  it('diyas: lamps = 1 + round(growth·8); rangoli rings bloom with growth', () => {
    expect(diyaCount(0)).toBe(1);
    expect(diyaCount(0.5)).toBe(5);
    expect(diyaCount(1)).toBe(9);
    const low = stillOf({ ...CASES[3]!, params: { growth: 0 } });
    const high = stillOf({ ...CASES[3]!, params: { growth: 1 } });
    expect(count(low, DIYA)).toBe(1);
    expect(count(high, DIYA)).toBe(9);
    expect(count(low, RING)).toBeLessThan(count(high, RING));
    expect(count(high, RING)).toBe(5);
    expect(ringReveal(0, 0)).toBeGreaterThan(0);
    expect(ringReveal(0.5, 4)).toBe(0);
  });

  it('diyas: a growth change while running rebuilds the row', () => {
    const c = CASES[3]!;
    const { effect, input } = run({ ...c, params: { growth: 0.25 } }, { steps: 30 });
    expect(count(effect, DIYA)).toBe(3);
    input.params = { growth: 1 };
    input.t += STEP;
    effect.step(input);
    expect(count(effect, DIYA)).toBe(9);
  });

  it('menorah: candles set from the right, plus the shamash', () => {
    expect(litBranches(1)).toEqual([8]);
    expect(litBranches(3)).toEqual([6, 7, 8]);
    expect(litBranches(8)).toEqual([0, 1, 2, 3, 5, 6, 7, 8]);
    const two = stillOf({ ...CASES[5]!, params: { candles: 2 } });
    const eight = stillOf({ ...CASES[5]!, params: { candles: 8 } });
    expect(count(two, CANDLE)).toBe(3);
    expect(count(eight, CANDLE)).toBe(9);
    const pool = poolOf(two).pool;
    const slots: number[] = [];
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === CANDLE) slots.push(pool.aux[i]!);
    expect(slots.sort()).toEqual([4, 7, 8]);
    expect(count(stillOf({ ...CASES[5]!, params: {} }), CANDLE)).toBe(9);
  });

  it('kinara: black centre first, then red and green alternating outward', () => {
    expect(LIGHTING_ORDER).toEqual([3, 2, 4, 1, 5, 0, 6]);
    expect(kinaraLit(3, 1)).toBe(true);
    expect(kinaraLit(2, 1)).toBe(false);
    expect(kinaraLit(2, 2)).toBe(true);
    expect(kinaraLit(4, 2)).toBe(false);
    expect(kinaraLit(6, 7)).toBe(true);
    const one = stillOf({ ...CASES[7]!, params: { candles: 1 } }) as KinaraEffect;
    const seven = stillOf({ ...CASES[7]!, params: { candles: 7 } }) as KinaraEffect;
    expect(one.litCount()).toBe(1);
    expect(seven.litCount()).toBe(7);
    expect(count(one, KINARA_CANDLE)).toBe(7);
    const pool = one.pool;
    for (let i = 0; i < pool.count; i++) {
      if (pool.kind[i] === KINARA_CANDLE && pool.depth[i]! > 0) expect(pool.aux[i]).toBe(3);
    }
  });

  it('crescent: moonPhase draws the moon from new to full', () => {
    expect(litFraction(0)).toBeCloseTo(0.08, 6);
    expect(litFraction(1)).toBeCloseTo(1, 6);
    expect(litFraction(undefined)).toBeLessThan(0.2);
    const step = (p: number): number => {
      const fx = stillOf({ ...CASES[10]!, params: { moonPhase: p } });
      const pool = poolOf(fx).pool;
      for (let i = 0; i < pool.count; i++) if (pool.kind[i] === MOON) return pool.aux[i]!;
      return -1;
    };
    expect(step(0)).toBe(phaseStep(litFraction(0)));
    expect(step(1)).toBe(24);
    expect(step(0)).toBeLessThan(step(0.5));
    expect(step(0.5)).toBeLessThan(step(1));
  });

  it('lanterns: the variant decides between hanging pendulums and rising sky lanterns', () => {
    const hanging = stillOf(CASES[1]!);
    const rising = stillOf(CASES[2]!);
    expect(count(hanging, LANTERN)).toBeGreaterThan(2);
    expect(count(hanging, SKY)).toBe(0);
    expect(count(rising, SKY)).toBeGreaterThan(5);
    expect(count(rising, LANTERN)).toBe(0);
  });

  it('crescent lanterns: lanterns appear only in the lanterns variant', () => {
    expect(count(stillOf(CASES[9]!), 1)).toBe(0);
    expect(count(stillOf(CASES[11]!), 1)).toBeGreaterThan(2);
  });
});

describe('night presets: interactions', () => {
  it('bats: a tap scatters nearby bats away from the finger', () => {
    const { effect, input } = run(CASES[0]!, { steps: 240, budget: 300 });
    const fx = effect as BatsEffect;
    const pool = fx.pool;
    let target = -1;
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === BAT) { target = i; break; }
    expect(target).toBeGreaterThanOrEqual(0);
    const x = pool.x[target]! - 30;
    const y = pool.y[target]! - 10;
    const vx = pool.vx[target]!;
    fx.tap(x, y, input);
    expect(pool.vx[target]!).toBeGreaterThan(vx + 100);
    expect(pool.aux[target]!).toBeGreaterThan(0);
  });

  it('lanterns hanging: a tap sets off a string of 5 pops within ~1 s; glows ramp ≥ 300 ms', () => {
    const { effect, input } = run(CASES[1]!, { steps: 10, budget: 350 });
    const fx = effect as LanternsEffect;
    const before = fx.pops;
    fx.tap(400, 200, input);
    for (let k = 0; k < 66; k++) {
      input.t += STEP;
      fx.step(input);
      const pool = fx.pool;
      for (let i = 0; i < pool.count; i++) {
        if (pool.kind[i] === POP) expect(pool.alpha[i]!).toBeLessThanOrEqual(pool.life[i]! / POP_RAMP + 1e-3);
      }
    }
    expect(fx.pops - before).toBe(5);
  });

  it('lanterns hanging: ambient pops never exceed 3 per second', () => {
    const times: number[] = [];
    let seen = 0;
    run(CASES[1]!, {
      steps: 1800, budget: 350,
      onStep: (fx, input) => {
        const l = fx as LanternsEffect;
        while (seen < l.pops) { times.push(input.t); seen++; }
      },
    });
    expect(times.length).toBeGreaterThan(5);
    for (let a = 0; a < times.length; a++) {
      let n = 0;
      for (let b = a; b < times.length && times[b]! - times[a]! < 1; b++) n++;
      expect(n).toBeLessThanOrEqual(3);
    }
  });

  it('lanterns rising: press-and-hold grows a lantern under the finger; release floats it up', () => {
    const { effect, input } = run(CASES[2]!, { steps: 30, budget: 300 });
    const fx = effect as LanternsEffect;
    input.pointer = { x: 300, y: 400, down: true };
    fx.press(300, 400, true, input);
    expect(count(fx, GROW)).toBe(1);
    for (let k = 0; k < 90; k++) {
      input.t += STEP;
      fx.step(input);
    }
    const pool = fx.pool;
    let g = -1;
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === GROW) g = i;
    expect(pool.size[g]!).toBeGreaterThan(60);
    expect(Math.abs(pool.x[g]! - 300)).toBeLessThan(5);
    input.pointer = { x: 300, y: 400, down: false };
    fx.press(300, 400, false, input);
    expect(count(fx, GROW)).toBe(0);
    let s = -1;
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === SKY && Math.abs(pool.x[i]! - 300) < 5 && Math.abs(pool.y[i]! - 400) < 5) s = i;
    expect(s).toBeGreaterThanOrEqual(0);
    const y0 = pool.y[s]!;
    for (let k = 0; k < 120; k++) {
      input.t += STEP;
      fx.step(input);
    }
    let risen = false;
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === SKY && Math.abs(pool.x[i]! - 300) < 40 && pool.y[i]! < y0 - 20) risen = true;
    expect(risen).toBe(true);
    // The click that ends a short press does not launch a second lantern on top.
    const before = count(fx, SKY);
    fx.tap(300, pool.y[s] ?? 400, input);
    expect(count(fx, SKY)).toBeLessThanOrEqual(before + 1);
  });

  it('menorah: a tapped dreidel spins, settles on one of נ ג ה ש and shows it', () => {
    const { effect, input } = run(CASES[5]!, { steps: 20, budget: 300 });
    const fx = effect as MenorahEffect;
    const pool = fx.pool;
    let d = -1;
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === DREIDEL) d = i;
    expect(d).toBeGreaterThanOrEqual(0);
    expect(fx.lastLetter).toBe('');
    fx.tap(pool.x[d]!, pool.y[d]!, input);
    expect(pool.rotV[d]!).toBeGreaterThan(20);
    for (let k = 0; k < 60 * 6 && fx.lastLetter === ''; k++) {
      input.t += STEP;
      fx.step(input);
    }
    expect(DREIDEL_LETTERS).toContain(fx.lastLetter);
    expect(DREIDEL_MEANINGS[fx.lastLetter]).toBeTruthy();
  });

  it('menorah: a budget drop keeps the candles and dreidels', () => {
    const { effect, input } = run(CASES[5]!, { steps: 120, budget: 300 });
    input.budget = 20;
    input.t += STEP;
    effect.step(input);
    expect(count(effect, CANDLE)).toBe(9);
    expect(count(effect, DREIDEL)).toBe(3);
    expect(effect.alive()).toBeLessThanOrEqual(20);
  });

  it('crescent lanterns: a tap on a dark lantern lights it; elsewhere it bursts stars', () => {
    const { effect, input } = run(CASES[11]!, { steps: 30, budget: 300 });
    const fx = effect as CrescentEffect;
    const pool = fx.pool;
    let dark = -1;
    for (let i = 0; i < pool.count; i++) if (pool.kind[i] === 1 && pool.vy[i] === 0) dark = i;
    expect(dark).toBeGreaterThanOrEqual(0);
    fx.tap(pool.x[dark]!, pool.y[dark]!, input);
    expect(pool.vy[dark]).toBe(1);
    const before = fx.alive();
    fx.tap(10, input.h - 10, input);
    expect(fx.alive()).toBeGreaterThan(before + 5);
  });
});
