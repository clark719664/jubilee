import { describe, expect, it } from 'vitest';
import { HOLIDAYS, byId } from '../src/content/registry';
import { civil, toDayNumber } from '../src/dates/civil';
import { mulberry32 } from '../src/effects/rng';
import {
  BOARDS, MAX_PAIRS, SEASON_WINDOW, deal, earnedHolidays, myDeck, pickDistinct, seasonDeck, seasonMates, toSticker,
  type MemorySticker,
} from '../src/play/memory/deck';
import { flip, hintPair, isFaceUp, isWon, moveFocus, newGame, settle } from '../src/play/memory/game';
import { fitBoard, sizeBoard, MIN_CARD } from '../src/play/memory/layout';
import { paletteFor, spritesFor } from '../src/play/memory/burst';
import { THEMES } from '../src/theme/themes';

const noArt = (): string | null => null;
const today = civil(2026, 10, 22);
const christmas = byId('christmas')!;

describe('season-mates', () => {
  it('ranks holidays within ±45 days of the main day first', () => {
    const mates = seasonMates(HOLIDAYS, 'christmas', today, 'US');
    expect(mates.some((m) => m.meta.id === 'christmas')).toBe(false);
    const inWindow = mates.filter((m) => m.distance <= SEASON_WINDOW);
    expect(inWindow.length).toBeGreaterThan(3);
    // Everything in the window comes before anything outside it.
    const firstOut = mates.findIndex((m) => m.distance > SEASON_WINDOW);
    expect(firstOut).toBe(inWindow.length);
    const ids = inWindow.map((m) => m.meta.id);
    expect(ids).toContain('hanukkah');
    expect(ids).toContain('new-years-eve');
    expect(ids).not.toContain('easter');
  });

  it('uses the dates engine for moving feasts (Easter mates are spring holidays)', () => {
    const ids = seasonMates(HOLIDAYS, 'easter', civil(2026, 1, 10), 'US').filter((m) => m.distance <= SEASON_WINDOW).map((m) => m.meta.id);
    expect(ids).not.toContain('christmas');
    expect(ids).not.toContain('halloween');
  });

  it('a season deck starts with the holiday and fills every board with distinct stickers', () => {
    for (const meta of HOLIDAYS.filter((m) => m.tier === 1)) {
      const deck = seasonDeck({ centre: meta, metas: HOLIDAYS, today, region: 'US', urlFor: noArt });
      expect(deck[0]!.holidayId).toBe(meta.id);
      expect(deck.length).toBe(MAX_PAIRS);
      expect(new Set(deck.map((s) => s.holidayId)).size).toBe(deck.length);
      expect(new Set(deck.map((s) => s.emoji)).size).toBe(deck.length);
    }
  });

  it('fills the zodiac label and carries art urls when they exist', () => {
    const lny = byId('lunar-new-year')!;
    const s = toSticker(lny, 2026, (id) => (id === 'lunar-new-year' ? '/x.svg' : null));
    expect(s.label).toBe('Year of the Horse');
    expect(s.url).toBe('/x.svg');
    expect('url' in toSticker(christmas, 2026, noArt)).toBe(false);
  });
});

describe('my stickers', () => {
  it('lists earned holidays newest first, one per holiday', () => {
    const earned = earnedHolidays({ 'christmas:2025': '2025-12-25', 'halloween:2026': '2026-10-31', 'christmas:2024': '2024-12-24', bad: '2026-01-01' });
    expect(earned).toEqual([{ id: 'halloween', year: 2026 }, { id: 'christmas', year: 2025 }]);
  });

  it('puts earned stickers first, marked as mine, and tops up the board', () => {
    const earned = [{ id: 'diwali', year: 2025 }, { id: 'easter', year: 2026 }, { id: 'nope', year: 2026 }];
    const deck = myDeck({ centre: christmas, metas: HOLIDAYS, today, region: 'US', urlFor: noArt }, earned, byId);
    expect(deck.slice(0, 2).map((s) => [s.holidayId, s.mine])).toEqual([['diwali', true], ['easter', true]]);
    expect(deck.length).toBe(MAX_PAIRS);
    expect(deck[2]!.mine).toBeUndefined();
  });

  it('pickDistinct skips repeated holidays and look-alike emoji', () => {
    const a: MemorySticker = { holidayId: 'a', holidayName: 'A', emoji: '🌙', label: 'A', theme: 'eid' };
    const b: MemorySticker = { ...a, holidayId: 'b' };
    const c: MemorySticker = { ...a, holidayId: 'c', emoji: '⭐' };
    expect(pickDistinct([a, a, b, c], 5).map((s) => s.holidayId)).toEqual(['a', 'c']);
  });
});

describe('deal', () => {
  const deck = seasonDeck({ centre: christmas, metas: HOLIDAYS, today, region: 'US', urlFor: noArt });
  it('deals two of each sticker for every board size, reproducibly per seed', () => {
    for (const b of BOARDS) {
      expect(b.cols * b.rows).toBe(b.pairs * 2);
      const cards = deal(deck, b.pairs, mulberry32(5));
      expect(cards.length).toBe(b.pairs * 2);
      const counts = new Map<string, number>();
      for (const c of cards) counts.set(c.key, (counts.get(c.key) ?? 0) + 1);
      expect([...counts.values()].every((n) => n === 2)).toBe(true);
      expect(cards.map((c) => c.index)).toEqual(cards.map((_, i) => i));
    }
    expect(deal(deck, 6, mulberry32(9)).map((c) => c.key)).toEqual(deal(deck, 6, mulberry32(9)).map((c) => c.key));
  });
});

describe('game rules', () => {
  const keys = ['a', 'b', 'a', 'b'];
  it('matches pairs, never penalises, and wins', () => {
    let s = newGame(keys);
    let o = flip(s, 0);
    expect(o.result).toEqual({ kind: 'first', index: 0 });
    s = o.state;
    expect(flip(s, 0).result.kind).toBe('ignored');
    o = flip(s, 2);
    expect(o.result).toEqual({ kind: 'match', a: 0, b: 2, won: false });
    s = o.state;
    expect(isFaceUp(s, 0) && isFaceUp(s, 2)).toBe(true);
    s = flip(s, 1).state;
    o = flip(s, 3);
    expect(o.result).toEqual({ kind: 'match', a: 1, b: 3, won: true });
    expect(isWon(o.state)).toBe(true);
    expect(o.state.flips).toBe(4);
  });

  it('a miss waits face up; a third tap turns it back over first', () => {
    let s = flip(newGame(keys), 0).state;
    const miss = flip(s, 1);
    expect(miss.result).toEqual({ kind: 'miss', a: 0, b: 1 });
    s = miss.state;
    expect(s.up).toEqual([0, 1]);
    const next = flip(s, 3);
    expect(next.turnedDown).toEqual([0, 1]);
    expect(next.result).toEqual({ kind: 'first', index: 3 });
    expect(settle(s).up).toEqual([]);
    expect(next.state.matched.every((m) => !m)).toBe(true);
  });

  it('matched cards are ignored and flips only count real turns', () => {
    let s = newGame(keys);
    s = flip(flip(s, 0).state, 2).state;
    const o = flip(s, 0);
    expect(o.result.kind).toBe('ignored');
    expect(o.state.flips).toBe(2);
    expect(flip(s, 99).result.kind).toBe('ignored');
  });

  it('hints point at the open card\'s partner, else at a half-seen pair', () => {
    let s = newGame(['a', 'b', 'c', 'a', 'b', 'c']);
    expect(hintPair(s)).toEqual([0, 3]);
    s = flip(s, 4).state;
    expect(hintPair(s)).toEqual([1, 4]);
    s = flip(s, 2).state; // miss: b then c
    expect(hintPair(settle(s))).not.toBeNull();
    const done = flip(flip(flip(flip(flip(flip(newGame(['a', 'a', 'b', 'b', 'c', 'c']), 0).state, 1).state, 2).state, 3).state, 4).state, 5).state;
    expect(hintPair(done)).toBeNull();
  });
});

describe('keyboard and layout', () => {
  it('arrows move within the grid and stop at its edges', () => {
    expect(moveFocus(0, 'ArrowLeft', 4, 12)).toBe(0);
    expect(moveFocus(0, 'ArrowRight', 4, 12)).toBe(1);
    expect(moveFocus(3, 'ArrowRight', 4, 12)).toBe(3);
    expect(moveFocus(1, 'ArrowDown', 4, 12)).toBe(5);
    expect(moveFocus(9, 'ArrowDown', 4, 12)).toBe(9);
    expect(moveFocus(5, 'ArrowUp', 4, 12)).toBe(1);
    expect(moveFocus(6, 'Home', 4, 12)).toBe(4);
    expect(moveFocus(6, 'End', 4, 12)).toBe(7);
    expect(moveFocus(6, 'PageDown', 4, 12)).toBe(10);
    expect(moveFocus(6, 'PageUp', 4, 12)).toBe(2);
  });

  it('turns the board sideways on wide screens and keeps cards finger-sized', () => {
    const phone = fitBoard(3, 4, 360, 640);
    expect([phone.cols, phone.rows]).toEqual([3, 4]);
    const laptop = fitBoard(3, 4, 1100, 560);
    expect([laptop.cols, laptop.rows]).toEqual([4, 3]);
    for (const f of [phone, laptop, fitBoard(4, 5, 358, 600)]) {
      expect(f.cardW).toBeGreaterThanOrEqual(MIN_CARD);
      expect(f.cardW * f.cols + f.gap * (f.cols - 1)).toBeLessThanOrEqual(1100);
      expect(f.cardH).toBeGreaterThanOrEqual(f.cardW);
    }
    const tiny = sizeBoard(4, 5, 200, 200);
    expect(tiny.cardW).toBe(MIN_CARD);
  });
});

describe('burst skin', () => {
  it('uses the holiday effect sprites and palette', () => {
    expect(spritesFor('snow', undefined)).toContain('snowflake');
    expect(spritesFor('glyph-rain', { glyphs: ['🍎', '🍯'] }).slice(0, 2)).toEqual(['glyph:🍎', 'glyph:🍯']);
    expect(paletteFor(THEMES.christmas, undefined)).toContain(THEMES.christmas.glow);
    expect(paletteFor(THEMES.usa, { palette: ['#ff0000'] })[0]).toBe('#ff0000');
  });
});

it('uses integer day arithmetic for distances', () => {
  const mates = seasonMates(HOLIDAYS, 'christmas', today, 'US');
  expect(mates.every((m) => Number.isInteger(m.distance))).toBe(true);
  expect(toDayNumber(today)).toBeGreaterThan(0);
});
