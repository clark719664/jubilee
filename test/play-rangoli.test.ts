import { describe, expect, it } from 'vitest';
import type { HolidayMeta } from '../src/content/types';
import { COPY, rangoliActivity } from '../src/play/rangoli';
import {
  FOLDS, LAYOUTS, RING_COUNT, SWATCHES, buildGroups, canUndo, clear, filledCount, layoutById, newDesign, paint, setLayout, shapePath, undo,
} from '../src/play/rangoli/logic';

const meta = (id: string): HolidayMeta => ({ id }) as HolidayMeta;

describe('rangoli geometry', () => {
  it('has three layouts of five rings', () => {
    expect(LAYOUTS).toHaveLength(3);
    for (const l of LAYOUTS) expect(l.rings).toHaveLength(RING_COUNT);
  });

  it('gives every group eight evenly turned twins', () => {
    for (const l of LAYOUTS) {
      for (const g of buildGroups(l)) {
        expect(g.members).toHaveLength(FOLDS);
        const a = g.members.map((m) => m.angle);
        for (let k = 1; k < FOLDS; k++) expect((a[k]! - a[0]! + 360) % 360).toBeCloseTo(k * 45, 1);
      }
    }
  });

  it('keeps ids unique and never stacks two groups on one spot', () => {
    for (const l of LAYOUTS) {
      const groups = buildGroups(l);
      expect(new Set(groups.map((g) => g.id)).size).toBe(groups.length);
      const spots = groups.map((g) => `${g.ring}:${g.members[0]!.angle}`);
      expect(new Set(spots).size).toBe(spots.length);
    }
  });

  it('draws closed paths and dots', () => {
    expect(shapePath('petal', 30, 10, 5)).toMatch(/^M.*Z$/);
    expect(shapePath('diamond', 30, 10, 5)).toMatch(/^M.*Z$/);
    const dot = buildGroups(layoutById('garden')).find((g) => g.kind === 'dot')!;
    expect(dot.dot).not.toBeNull();
    expect(dot.path).toBe('');
  });

  it('offers about ten distinct colors', () => {
    expect(SWATCHES.length).toBeGreaterThanOrEqual(10);
    expect(new Set(SWATCHES.map((s) => s.hex)).size).toBe(SWATCHES.length);
  });
});

describe('rangoli fills', () => {
  it('fills one symmetric group at a time', () => {
    const d = paint(newDesign(), '0-0', 'rose');
    expect(d.fills).toEqual({ '0-0': 'rose' });
    expect(filledCount(d)).toBe(1);
  });

  it('ignores unknown groups and repeat colors', () => {
    const d = newDesign();
    expect(paint(d, '9-9', 'rose')).toBe(d);
    const p = paint(d, '1-0', 'rose');
    expect(paint(p, '1-0', 'rose')).toBe(p);
  });

  it('undoes step by step, then stops', () => {
    let d = paint(paint(newDesign(), '0-0', 'rose'), '1-0', 'teal');
    expect(canUndo(d)).toBe(true);
    d = undo(d);
    expect(d.fills).toEqual({ '0-0': 'rose' });
    d = undo(d);
    expect(d.fills).toEqual({});
    expect(canUndo(d)).toBe(false);
    expect(undo(d)).toBe(d);
  });

  it('clears everything and can undo the clear', () => {
    const d = paint(paint(newDesign(), '0-0', 'rose'), '1-0', 'teal');
    const c = clear(d);
    expect(c.fills).toEqual({});
    expect(clear(c)).toBe(c);
    expect(undo(c).fills).toEqual(d.fills);
  });

  it('keeps colors that still fit when the layout changes', () => {
    const d = paint(paint(newDesign('lotus'), '0-0', 'rose'), '2-1', 'teal');
    const s = setLayout(d, 'garden');
    expect(s.layout).toBe('garden');
    expect(s.fills['0-0']).toBe('rose');
    expect(setLayout(s, 'garden')).toBe(s);
    expect(undo(s).fills).toEqual(d.fills);
  });

  it('drops colors with no place to go', () => {
    const d = paint(newDesign('lotus'), '2-1', 'teal');
    const s = setLayout(d, 'star');
    const ids = new Set(buildGroups(layoutById('star')).map((g) => g.id));
    expect(Object.keys(s.fills).every((id) => ids.has(id))).toBe(true);
  });
});

describe('rangoli activity', () => {
  it('is Diwali only', () => {
    expect(rangoliActivity.id).toBe('rangoli');
    expect(rangoliActivity.title).toBe(COPY.title);
    expect(rangoliActivity.available(meta('diwali'), {} as never)).toBe(true);
    expect(rangoliActivity.available(meta('halloween'), {} as never)).toBe(false);
  });
});
