import { describe, expect, it } from 'vitest';
import { toDayNumber } from '../src/dates/civil';
import type { Occurrence } from '../src/dates/occurrences';
import type { HolidayMeta } from '../src/content/types';
import { defaultProgress, type Progress } from '../src/app/state';
import { badgeMeter, countTraditions, evaluateBadges, isFirstFootingDay, stickerFor, stickerKey } from '../src/app/stickers';

const d = (y: number, m: number, day: number) => toDayNumber({ y, m, d: day });

/** Hanukkah 2024: first candle Dec 25 (eve) → last day Jan 2 2025. */
const hanukkah2024: Occurrence = {
  holidayId: 'hanukkah', start: d(2024, 12, 25), end: d(2025, 1, 2), main: d(2024, 12, 26), year: 2024, beginsAtSundown: true, approx: false,
};

describe('stickers: visit-on-day', () => {
  it('awards on any day of the span, including the eve and the last day', () => {
    expect(stickerFor(hanukkah2024, { y: 2024, m: 12, d: 28 })).toEqual({ holidayId: 'hanukkah', year: 2024, key: 'hanukkah:2024' });
    expect(stickerFor(hanukkah2024, { y: 2024, m: 12, d: 25 })?.key).toBe('hanukkah:2024');
    expect(stickerFor(hanukkah2024, { y: 2025, m: 1, d: 2 })?.key).toBe('hanukkah:2024');
    expect(stickerFor(hanukkah2024, d(2024, 12, 30))?.year).toBe(2024);
  });

  it('does not award the day before or the day after', () => {
    expect(stickerFor(hanukkah2024, { y: 2024, m: 12, d: 24 })).toBeNull();
    expect(stickerFor(hanukkah2024, { y: 2025, m: 1, d: 3 })).toBeNull();
    expect(stickerKey('halloween', 2030)).toBe('halloween:2030');
  });
});

function withProgress(patch: Partial<Progress>): Progress {
  return { ...defaultProgress(), ...patch };
}

describe('stickers: badges', () => {
  const notJan1 = { y: 2026, m: 3, d: 14 };

  it('First Footer on Jan 1 only, and only once', () => {
    expect(isFirstFootingDay({ y: 2027, m: 1, d: 1 })).toBe(true);
    expect(isFirstFootingDay({ y: 2027, m: 1, d: 2 })).toBe(false);
    expect(evaluateBadges(defaultProgress(), { y: 2027, m: 1, d: 1 }, 0)).toEqual(['first-footer']);
    expect(evaluateBadges(defaultProgress(), { y: 2027, m: 12, d: 31 }, 0)).toEqual([]);
    expect(evaluateBadges(withProgress({ badges: { 'first-footer': '2026-01-01' } }), { y: 2027, m: 1, d: 1 }, 0)).toEqual([]);
  });

  it('Early Bird = 5 distinct open days (not a streak)', () => {
    const four = withProgress({ openDays: ['2026-01-03', '2026-01-09', '2026-02-01', '2026-03-01'] });
    expect(evaluateBadges(four, notJan1, 0)).toEqual([]);
    const five = withProgress({ openDays: [...four.openDays, '2026-03-14'] });
    expect(evaluateBadges(five, notJan1, 0)).toEqual(['early-bird']);
    expect(badgeMeter('early-bird', four, 0)).toEqual({ have: 4, need: 5 });
  });

  it('Little Chef = 3 recipes, Fact Finder = 25 facts', () => {
    expect(evaluateBadges(withProgress({ recipesDone: ['a/1', 'a/2'] }), notJan1, 0)).toEqual([]);
    expect(evaluateBadges(withProgress({ recipesDone: ['a/1', 'a/2', 'b/1'] }), notJan1, 0)).toEqual(['little-chef']);
    expect(evaluateBadges(withProgress({ factsFlipped: 24 }), notJan1, 0)).toEqual([]);
    expect(evaluateBadges(withProgress({ factsFlipped: 25 }), notJan1, 0)).toEqual(['fact-finder']);
  });

  it('World Traveler needs 10 pages AND 5 traditions', () => {
    const visited: Record<string, `${number}-${number}-${number}`> = {};
    for (let i = 0; i < 10; i++) visited[`h${i}`] = '2026-01-01';
    const ten = withProgress({ visited });
    expect(evaluateBadges(ten, notJan1, 4)).toEqual([]);
    expect(evaluateBadges(ten, notJan1, 5)).toEqual(['world-traveler']);
    const nine = withProgress({ visited: Object.fromEntries(Object.entries(visited).slice(0, 9)) });
    expect(evaluateBadges(nine, notJan1, 7)).toEqual([]);
  });

  it('countTraditions counts distinct traditions over known metas only', () => {
    const meta = (id: string, traditions: HolidayMeta['traditions']): HolidayMeta => ({
      id, name: id, emoji: '✨', tagline: '', tier: 2, tags: ['family'], traditions, rule: { kind: 'fixed', month: 1, day: 1 },
      theme: 'silly', effect: 'confetti', sticker: { id: `${id}-sticker`, emoji: '✨', label: id },
    });
    const metas = [meta('a', ['christian']), meta('b', ['jewish']), meta('c', ['hindu', 'sikh']), meta('d', ['christian'])];
    expect(countTraditions(['a', 'b', 'c', 'd', 'zzz'], metas)).toEqual({ pages: 4, traditions: 4 });
  });

  it('reports several newly earned badges at once, already-earned ones excluded', () => {
    const p = withProgress({ recipesDone: ['a/1', 'a/2', 'b/1'], factsFlipped: 30, badges: { 'fact-finder': '2026-02-02' } });
    expect(evaluateBadges(p, { y: 2027, m: 1, d: 1 }, 0)).toEqual(['first-footer', 'little-chef']);
  });
});
