import { describe, expect, it } from 'vitest';
import { COPY, presentsActivity } from '../src/play/presents';
import { AGAIN_LINES, CALM_STEP, CHIMNEY_COUNT, CHIMNEY_X, IN_LINES, MISS_LINES, REACH, advance, chimneyAt, count, drop, isDone, newStreet, wrap } from '../src/play/presents/logic';

describe('presents logic', () => {
  it('starts with every chimney empty', () => {
    const s = newStreet();
    expect(s.filled).toHaveLength(CHIMNEY_COUNT);
    expect(count(s)).toBe(0);
    expect(isDone(s)).toBe(false);
  });

  it('wraps the sleigh back to the left edge', () => {
    expect(wrap(1.25)).toBeCloseTo(0.25);
    expect(wrap(-0.1)).toBeCloseTo(0.9);
    expect(advance(0.95, 1, 0.1)).toBeCloseTo(0.05);
    expect(advance(0.2, 0)).toBeCloseTo(0.2);
  });

  it('finds the chimney under the sleigh, and none in the gaps', () => {
    CHIMNEY_X.forEach((cx, i) => {
      expect(chimneyAt(cx)).toBe(i);
      expect(chimneyAt(cx + REACH * 0.9)).toBe(i);
    });
    expect(chimneyAt(0.2)).toBeNull();
    expect(chimneyAt(0.0)).toBeNull();
  });

  it('lets the calm hop land both over and between chimneys', () => {
    let x = 0;
    const seen = new Set<boolean>();
    for (let k = 0; k < 10; k++) { seen.add(chimneyAt(x) !== null); x = wrap(x + CALM_STEP); }
    expect(seen.size).toBe(2);
  });

  it('lights a chimney on a hit and leaves the old street untouched', () => {
    const s = newStreet();
    const r = drop(s, 0.3);
    expect(r.outcome).toBe('in');
    expect(r.index).toBe(1);
    expect(r.street.filled[1]).toBe(true);
    expect(count(r.street)).toBe(1);
    expect(count(s)).toBe(0);
  });

  it('treats a miss as harmless', () => {
    const s = newStreet();
    const r = drop(s, 0.2);
    expect(r.outcome).toBe('miss');
    expect(r.index).toBeNull();
    expect(r.street).toBe(s);
  });

  it('bounces a present aimed at a chimney that already has one', () => {
    const r1 = drop(newStreet(), 0.5);
    const r2 = drop(r1.street, 0.5);
    expect(r2.outcome).toBe('again');
    expect(count(r2.street)).toBe(1);
  });

  it('finishes when every chimney has a present', () => {
    let s = newStreet();
    for (const cx of CHIMNEY_X) s = drop(s, cx).street;
    expect(isDone(s)).toBe(true);
  });

  it('has friendly lines with no leftover placeholders', () => {
    for (const line of [...IN_LINES, ...MISS_LINES, ...AGAIN_LINES]) expect(line).not.toMatch(/[{}]/);
  });
});

describe('presents activity', () => {
  it('is only for Christmas', () => {
    const meta = (id: string) => ({ id }) as never;
    expect(presentsActivity.id).toBe('presents');
    expect(presentsActivity.title).toBe('Present Drop');
    expect(presentsActivity.available(meta('christmas'), {} as never)).toBe(true);
    expect(presentsActivity.available(meta('halloween'), {} as never)).toBe(false);
    expect(COPY.title).toBe(presentsActivity.title);
  });
});
