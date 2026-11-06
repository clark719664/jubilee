import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/effects/rng';
import { COPY, lanternsActivity } from '../src/play/lanterns';
import {
  EASY_LANTERNS, GAP_MS, GLOW_MS, HARD_LANTERNS, LANTERN_COLORS, MAX_LENGTH, ROUNDS, START_LENGTH, makeSequence, newGame, roundOf, shown, tap, type Game,
} from '../src/play/lanterns/logic';
import type { HolidayMeta } from '../src/content/types';

const meta = (id: string): HolidayMeta => ({ id }) as unknown as HolidayMeta;

describe('lantern sequences', () => {
  it('stay in range and never repeat a lantern back to back', () => {
    for (const n of [EASY_LANTERNS, 5, HARD_LANTERNS]) {
      for (let seed = 1; seed < 40; seed++) {
        const s = makeSequence(mulberry32(seed), n);
        expect(s).toHaveLength(MAX_LENGTH);
        s.forEach((v, k) => {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThan(n);
          if (k > 0) expect(v).not.toBe(s[k - 1]);
        });
      }
    }
  });

  it('are the same for the same seed', () => {
    expect(makeSequence(mulberry32(5), 4)).toEqual(makeSequence(mulberry32(5), 4));
  });
});

describe('lantern rounds', () => {
  const play = (g: Game): Game => {
    let cur = g;
    for (const i of shown(g)) cur = tap(cur, i).game;
    return cur;
  };

  it('start at two and grow by one per right round', () => {
    let g = newGame(mulberry32(3), 4);
    expect(shown(g)).toHaveLength(START_LENGTH);
    expect(roundOf(g)).toBe(1);
    for (let want = START_LENGTH + 1; want <= MAX_LENGTH; want++) {
      g = play(g);
      expect(shown(g)).toHaveLength(want);
    }
    expect(ROUNDS).toBe(MAX_LENGTH - START_LENGTH + 1);
  });

  it('the pattern only grows: earlier lights keep their order', () => {
    const g = newGame(mulberry32(9), 6);
    const next = play(g);
    expect(shown(next).slice(0, START_LENGTH)).toEqual(shown(g));
  });

  it('reports ok mid-round, round at the end of a round, and win after eight', () => {
    let g = newGame(mulberry32(4), 4);
    const first = tap(g, shown(g)[0]!);
    expect(first.result).toBe('ok');
    g = first.game;
    expect(tap(g, shown(g)[1]!).result).toBe('round');
    let last: ReturnType<typeof tap> | null = null;
    g = newGame(mulberry32(4), 4);
    while (!last || last.result !== 'win') {
      const s = shown(g);
      for (let k = 0; k < s.length; k++) { last = tap(g, s[k]!); g = last.game; }
    }
    expect(g.length).toBe(MAX_LENGTH);
  });

  it('a wrong tap restarts the same round with the same pattern and no lost progress', () => {
    const g = play(newGame(mulberry32(8), 4));
    const s = shown(g);
    const mid = tap(g, s[0]!).game;
    const wrong = [0, 1, 2, 3].find((i) => i !== s[1])!;
    const r = tap(mid, wrong);
    expect(r.result).toBe('wrong');
    expect(r.game.length).toBe(g.length);
    expect(shown(r.game)).toEqual(s);
    expect(r.game.pos).toBe(0);
    expect(tap(r.game, s[0]!).result).toBe('ok');
  });

  it('a wrong first tap changes nothing but the position', () => {
    const g = newGame(mulberry32(2), 4);
    const wrong = [0, 1, 2, 3].find((i) => i !== g.seq[0])!;
    expect(tap(g, wrong).game).toEqual(g);
  });
});

describe('lantern safety and copy', () => {
  it('every glow lasts at least 400ms with a gap, so well under 3 Hz', () => {
    expect(GLOW_MS).toBeGreaterThanOrEqual(400);
    expect(GAP_MS).toBeGreaterThan(0);
    expect(1000 / (GLOW_MS + GAP_MS)).toBeLessThan(3);
  });

  it('has a distinct color for each of up to six lanterns', () => {
    expect(new Set(LANTERN_COLORS.map((c) => c.body)).size).toBeGreaterThanOrEqual(HARD_LANTERNS);
  });

  it('is offered for the Eid and Ramadan holidays only', () => {
    expect(lanternsActivity.id).toBe('lanterns');
    for (const id of ['eid-al-fitr', 'ramadan', 'eid-al-adha']) expect(lanternsActivity.available(meta(id), {} as never)).toBe(true);
    for (const id of ['halloween', 'christmas', 'diwali']) expect(lanternsActivity.available(meta(id), {} as never)).toBe(false);
  });

  it('keeps kid-facing words in COPY, short and in American English', () => {
    expect(COPY.title).toBe('Lantern Lights');
    for (const v of Object.values(COPY)) expect(v).not.toMatch(/colour|favourite|\bgrey\b/i);
  });
});
