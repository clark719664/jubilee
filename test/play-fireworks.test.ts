/**
 * play-fireworks.test.ts — Fireworks Show's rules (no DOM): shapes, color sets, the 24-firework limit,
 * show order and spacing, and where the aim mark may go.
 */
import { describe, expect, it } from 'vitest';
import { byId } from '../src/content/registry';
import { fireworksActivity } from '../src/play/fireworks';
import {
  BURST_RADIUS, COLOR_SETS, MAX_FIREWORKS, MIN_GAP_MS, SHAPES, SKY_BOTTOM, SKY_TOP,
  addFirework, emptyShow, isFull, nudge, showSchedule, skyPoint, sparkAt, sparks, type Firework,
} from '../src/play/fireworks/logic';

const fw = (x = 0.5, y = 0.3, shape: Firework['shape'] = 'star'): Firework => ({ shape, colors: 'gold', x, y });

describe('Fireworks shapes', () => {
  it('has the five shapes and several color sets', () => {
    expect(SHAPES.map((s) => s.id)).toEqual(['burst', 'ring', 'heart', 'star', 'willow']);
    expect(COLOR_SETS.length).toBeGreaterThanOrEqual(4);
  });

  it('gives every shape sparks inside the burst and every color a turn', () => {
    for (const s of SHAPES) {
      const set = sparks(s.id, 3);
      expect(set).toHaveLength(s.count);
      for (const p of set) {
        expect(Math.hypot(p.dx, p.dy)).toBeLessThanOrEqual(1.01);
        expect(p.color).toBeLessThan(3);
      }
      expect(new Set(set.map((p) => p.color)).size).toBe(3);
    }
  });

  it('draws a ring as a circle and a heart wider at the top', () => {
    for (const p of sparks('ring', 1)) expect(Math.hypot(p.dx, p.dy)).toBeCloseTo(1, 5);
    const heart = sparks('heart', 1);
    const top = Math.max(...heart.filter((p) => p.dy < 0).map((p) => Math.abs(p.dx)));
    const bottom = Math.max(...heart.filter((p) => p.dy > 0.6).map((p) => Math.abs(p.dx)));
    expect(top).toBeGreaterThan(bottom);
  });

  it('flies sparks outward, fades them, and lets willow droop most', () => {
    const s = sparks('burst', 1)[3]!;
    expect(sparkAt(s, 0, 0.25)).toMatchObject({ x: 0, y: 0, alpha: 1 });
    const end = sparkAt(s, 1, 0);
    expect(Math.hypot(end.x, end.y)).toBeCloseTo(Math.hypot(s.dx, s.dy), 5);
    expect(sparkAt(s, 1, 0.25).alpha).toBe(0);
    expect(SHAPES.find((x) => x.id === 'willow')!.droop).toBe(Math.max(...SHAPES.map((x) => x.droop)));
    expect(BURST_RADIUS).toBeLessThan(0.5);
  });
});

describe('Fireworks show', () => {
  it('adds in order and stops at 24 without losing anything', () => {
    let show = emptyShow();
    for (let i = 0; i < 40; i++) show = addFirework(show, fw(0.1 + (i % 8) * 0.1));
    expect(show).toHaveLength(MAX_FIREWORKS);
    expect(isFull(show)).toBe(true);
    expect(addFirework(show, fw())).toBe(show);
    expect(show[0]!.x).toBeCloseTo(0.1);
  });

  it('keeps taps in the sky and falls back from bad ids', () => {
    expect(skyPoint(-3, 9)).toEqual({ x: 0.05, y: SKY_BOTTOM });
    expect(skyPoint(NaN, 0).y).toBe(SKY_TOP);
    const [a] = addFirework(emptyShow(), { shape: 'nope' as never, colors: 'nope', x: 2, y: 0 });
    expect(a).toEqual({ shape: 'burst', colors: COLOR_SETS[0]!.id, x: 0.95, y: SKY_TOP });
  });

  it('schedules launches in order, never closer than the safe gap', () => {
    let show = emptyShow();
    for (let i = 0; i < 5; i++) show = addFirework(show, fw(0.2 + i * 0.1));
    const plan = showSchedule(show, 50);
    expect(plan.map((p) => p.fw)).toEqual(show);
    for (let i = 1; i < plan.length; i++) expect(plan[i]!.at - plan[i - 1]!.at).toBeGreaterThanOrEqual(MIN_GAP_MS);
    expect(1000 / MIN_GAP_MS).toBeLessThan(3);
    expect(showSchedule(emptyShow())).toEqual([]);
  });

  it('moves the aim mark with arrow keys and keeps it in the sky', () => {
    const a = { x: 0.5, y: 0.3 };
    expect(nudge(a, 'ArrowRight').x).toBeCloseTo(0.55);
    expect(nudge(a, 'ArrowUp').y).toBeCloseTo(0.25);
    expect(nudge(a, 'Enter')).toEqual(a);
    let p = a;
    for (let i = 0; i < 40; i++) p = nudge(p, 'ArrowDown');
    expect(p.y).toBe(SKY_BOTTOM);
  });
});

describe('Fireworks activity', () => {
  it('is for the four fireworks holidays only', () => {
    expect(fireworksActivity.id).toBe('fireworks');
    expect(fireworksActivity.title).toBe('Fireworks Show');
    for (const id of ['independence-day-us', 'new-years-eve', 'canada-day', 'bastille-day']) {
      expect(fireworksActivity.available(byId(id)!, undefined as never)).toBe(true);
    }
    expect(fireworksActivity.available(byId('halloween')!, undefined as never)).toBe(false);
  });
});
