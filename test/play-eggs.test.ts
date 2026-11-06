import { describe, expect, it } from 'vitest';
import { byId, HOLIDAYS } from '../src/content/registry';
import { mulberry32 } from '../src/effects/rng';
import { bandPath, nextEggId } from '../src/play/eggs/art';
import { COPY, eggsActivity } from '../src/play/eggs/index';
import {
  BAND_COUNT, BASKET_MAX, COLORS, PATTERNS, UNDO_MAX, isEmpty, newPainter, paint, paintedCount, surprise, toBasket, undo,
  type Band,
} from '../src/play/eggs/logic';

const red: Band = { color: 0, pattern: 0 };
const dots: Band = { color: 3, pattern: 2 };

describe('egg painter logic', () => {
  it('starts with an empty egg of five bands', () => {
    const p = newPainter();
    expect(p.egg).toHaveLength(BAND_COUNT);
    expect(isEmpty(p.egg)).toBe(true);
    expect(p.basket).toHaveLength(0);
  });

  it('paints one band and leaves the rest', () => {
    const p = paint(newPainter(), 2, dots);
    expect(p.egg[2]).toEqual(dots);
    expect(paintedCount(p.egg)).toBe(1);
  });

  it('repaints a band and ignores bad indexes and repeats', () => {
    const a = paint(newPainter(), 1, red);
    const b = paint(a, 1, dots);
    expect(b.egg[1]).toEqual(dots);
    expect(paint(b, 1, dots)).toBe(b);
    expect(paint(b, -1, red)).toBe(b);
    expect(paint(b, BAND_COUNT, red)).toBe(b);
  });

  it('undoes step by step, then does nothing', () => {
    let p = paint(paint(newPainter(), 0, red), 1, dots);
    p = undo(p);
    expect(p.egg[1]).toBeNull();
    expect(p.egg[0]).toEqual(red);
    p = undo(p);
    expect(isEmpty(p.egg)).toBe(true);
    expect(undo(p)).toBe(p);
  });

  it('caps the undo history', () => {
    let p = newPainter();
    for (let i = 0; i < UNDO_MAX + 10; i++) p = paint(p, 0, { color: i % COLORS.length, pattern: Math.floor(i / COLORS.length) % PATTERNS.length });
    expect(p.undo.length).toBeLessThanOrEqual(UNDO_MAX);
  });

  it('surprise fills every band with valid choices, deterministically, and can be undone', () => {
    const a = surprise(newPainter(), mulberry32(5));
    const b = surprise(newPainter(), mulberry32(5));
    expect(a.egg).toEqual(b.egg);
    expect(paintedCount(a.egg)).toBe(BAND_COUNT);
    for (const band of a.egg) {
      expect(band!.color).toBeGreaterThanOrEqual(0);
      expect(band!.color).toBeLessThan(COLORS.length);
      expect(band!.pattern).toBeLessThan(PATTERNS.length);
    }
    for (let i = 1; i < BAND_COUNT; i++) expect(a.egg[i]!.color).not.toBe(a.egg[i - 1]!.color);
    expect(isEmpty(undo(a).egg)).toBe(true);
  });

  it('surprise never leaves a band empty for extreme random values', () => {
    for (const v of [0, 0.999999]) expect(paintedCount(surprise(newPainter(), () => v).egg)).toBe(BAND_COUNT);
  });

  it('puts a painted egg in the basket and starts fresh', () => {
    const p = toBasket(paint(newPainter(), 0, red));
    expect(p.basket).toHaveLength(1);
    expect(isEmpty(p.egg)).toBe(true);
    expect(p.undo).toHaveLength(0);
  });

  it('will not basket a blank egg', () => {
    const p = newPainter();
    expect(toBasket(p)).toBe(p);
  });

  it('keeps only the newest six eggs', () => {
    let p = newPainter();
    for (let i = 0; i < BASKET_MAX + 3; i++) p = toBasket(paint(p, 0, { color: i % COLORS.length, pattern: 0 }));
    expect(p.basket).toHaveLength(BASKET_MAX);
    expect(p.basket[BASKET_MAX - 1]![0]!.color).toBe((BASKET_MAX + 2) % COLORS.length);
    expect(p.basket[0]![0]!.color).toBe(3 % COLORS.length);
  });

  it('never mutates earlier states', () => {
    const a = paint(newPainter(), 0, red);
    paint(a, 1, dots);
    expect(a.egg[1]).toBeNull();
  });
});

describe('egg painter page', () => {
  it('is available only for the two Easters', () => {
    for (const m of HOLIDAYS) {
      expect(eggsActivity.available(m, undefined as never)).toBe(m.id === 'easter' || m.id === 'orthodox-easter');
    }
    expect(eggsActivity.available(byId('easter')!, undefined as never)).toBe(true);
    expect(eggsActivity.id).toBe('eggs');
  });

  it('has a path for every band and fresh ids for every egg', () => {
    for (let i = 0; i < BAND_COUNT; i++) expect(bandPath(i)).toMatch(/^M-10 /);
    expect(nextEggId()).not.toBe(nextEggId());
  });

  it('keeps the words kid-friendly and in American English', () => {
    expect(COPY.title).toBe('Egg Painter');
    expect(COPY.where).toHaveLength(BAND_COUNT);
    const all = JSON.stringify(COPY) + COLORS.map((c) => c.name).join(' ');
    expect(all).not.toMatch(/colour|favourite|grey/i);
    expect(COLORS.length).toBeGreaterThanOrEqual(6);
    expect(PATTERNS.map((p) => p.id)).toEqual(['plain', 'stripes', 'dots', 'zigzag', 'stars']);
  });
});
