/**
 * play-dreidel.test.ts — Spin the Dreidel's rules (no DOM): every letter, pot rounding, the ante, game end.
 */
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/effects/rng';
import { LETTERS, START_COINS, ante, isOver, newGame, other, play, potShare, spinLetter, type Game } from '../src/play/dreidel/logic';

const g = (you: number, jubi: number, pot: number): Game => ({ you, jubi, pot, out: null });

describe('dreidel letters', () => {
  it('has the four letters in order', () => {
    expect(LETTERS.map((l) => l.glyph)).toEqual(['נ', 'ג', 'ה', 'ש']);
    expect(LETTERS.map((l) => l.name)).toEqual(['Nun', 'Gimel', 'Hei', 'Shin']);
  });

  it('spins every letter with a seeded random and never anything else', () => {
    const rand = mulberry32(7);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(spinLetter(rand).id);
    expect([...seen].sort()).toEqual(['gimel', 'hei', 'nun', 'shin']);
    expect(spinLetter(() => 0.999999).id).toBe('shin');
    expect(spinLetter(() => 0).id).toBe('nun');
  });
});

describe('dreidel rules', () => {
  it('starts each player with 10 coins and antes one each', () => {
    expect(newGame()).toEqual({ you: START_COINS, jubi: START_COINS, pot: 0, out: null });
    expect(ante(newGame())).toEqual(g(9, 9, 2));
  });

  it('Nun does nothing', () => {
    const t = play(g(5, 5, 4), 'you', 'nun');
    expect(t.game).toEqual(g(5, 5, 4));
    expect(t.gained).toBe(0);
  });

  it('Gimel takes the whole pot', () => {
    const t = play(g(5, 5, 7), 'jubi', 'gimel');
    expect(t.game).toEqual(g(5, 12, 0));
    expect(t.gained).toBe(7);
  });

  it('Hei takes half, rounded up', () => {
    expect(play(g(5, 5, 8), 'you', 'hei').game).toEqual(g(9, 5, 4));
    const odd = play(g(5, 5, 7), 'you', 'hei');
    expect(odd.gained).toBe(4);
    expect(odd.game).toEqual(g(9, 5, 3));
    expect(potShare(1, 'hei')).toBe(1);
    expect(potShare(0, 'hei')).toBe(0);
  });

  it('Shin puts one in', () => {
    const t = play(g(5, 5, 4), 'jubi', 'shin');
    expect(t.game).toEqual(g(5, 4, 5));
    expect(t.paid).toBe(1);
  });

  it('keeps the total number of coins the same', () => {
    const rand = mulberry32(42);
    let game = ante(newGame());
    for (let i = 0; i < 60 && !isOver(game); i++) {
      game = play(game, i % 2 ? 'jubi' : 'you', spinLetter(rand).id).game;
      if (game.pot === 0) game = ante(game);
      expect(game.you + game.jubi + game.pot).toBe(START_COINS * 2);
    }
  });
});

describe('dreidel game end', () => {
  it('ends when a Shin spends the last coin', () => {
    const t = play(g(1, 6, 3), 'you', 'shin');
    expect(t.game.out).toBe('you');
    expect(isOver(t.game)).toBe(true);
  });

  it('ends when someone cannot ante', () => {
    expect(ante(g(0, 4, 0)).out).toBe('you');
    expect(ante(g(4, 0, 0)).out).toBe('jubi');
    expect(ante(g(0, 0, 0)).out).toBe('you');
  });

  it('does not change a finished game', () => {
    const done: Game = { you: 0, jubi: 12, pot: 8, out: 'you' };
    expect(ante(done)).toBe(done);
    expect(play(done, 'jubi', 'gimel').game).toBe(done);
  });

  it('is not over while both have coins', () => {
    expect(isOver(play(g(2, 2, 2), 'you', 'shin').game)).toBe(false);
    expect(other('you')).toBe('jubi');
  });
});
