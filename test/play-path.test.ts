import { describe, expect, it } from 'vitest';
import { HOLIDAYS, byId } from '../src/content/registry';
import { COPY, goalLine, hintFor } from '../src/play/path/copy';
import { BONUS, CHAPTERS, LEVELS, boardOf, freshCards, levelLabel, levelsFor, type Level } from '../src/play/path/levels';
import {
  MAX_DEPTH, balanced, cardCount, cardsOf, depths, insertCard, maxDepth, moveCard, moveCardTo, parse, partners, removeCard, run,
  type Board, type Card,
} from '../src/play/path/model';
import { SKINNED, focusColor, ringSurfaces, skinFor } from '../src/play/path/skins';
import { contrastRatio } from '../src/theme/contrast';
import { solve } from '../src/play/path/solver';
import { PATH_KEY, forgetSessionStars, pathStars, readSolved } from '../src/play/path/stars';
import { PLAY_STORAGE } from '../src/play/storage';
import { THEMES } from '../src/theme/themes';

const ALL: readonly Level[] = [...LEVELS, ...BONUS];
const PLACEABLE_ALL: readonly Card[] = ['step', 'left', 'right', 'jump', 'rep2', 'rep3', 'ifRight'];

/** A board from a map, for interpreter tests. */
const b = (...map: string[]): Board => boardOf({ id: 'test', map });

describe('levels', () => {
  it('has 30 shared puzzles and two bonus puzzles each for five holidays', () => {
    expect(LEVELS).toHaveLength(30);
    const byHoliday = new Map<string, number>();
    for (const l of BONUS) byHoliday.set(l.bonus!, (byHoliday.get(l.bonus!) ?? 0) + 1);
    expect(Object.fromEntries(byHoliday)).toEqual({ christmas: 2, diwali: 2, 'lunar-new-year': 2, halloween: 2, easter: 2 });
    for (const id of byHoliday.keys()) expect(byId(id), id).toBeDefined();
    expect(new Set(ALL.map((l) => l.id)).size).toBe(ALL.length);
  });

  it('every map is 5×5 to 7×7, rectangular, with one start, one goal and items only on open ground', () => {
    for (const l of ALL) {
      const board = boardOf(l);
      expect(board.cols, l.id).toBeGreaterThanOrEqual(5);
      expect(board.rows, l.id).toBeGreaterThanOrEqual(5);
      expect(board.cols, l.id).toBeLessThanOrEqual(7);
      expect(board.rows, l.id).toBeLessThanOrEqual(7);
      const text = l.map.join('');
      expect(text.match(/[\^>v<]/g), l.id).toHaveLength(1);
      expect(text.match(/G/g), l.id).toHaveLength(1);
      const blocked = new Set(board.blocks.map((p) => `${p.x},${p.y}`));
      for (const it of board.items) expect(blocked.has(`${it.x},${it.y}`), `${l.id} item on a wall`).toBe(false);
      expect(blocked.has(`${board.goal.x},${board.goal.y}`)).toBe(false);
      expect(blocked.has(`${board.start.x},${board.start.y}`)).toBe(false);
    }
  });

  it('every known solution wins, uses only offered cards and fits the card limit', () => {
    for (const l of ALL) {
      const cards = cardsOf(l.solution);
      expect(balanced(cards), l.id).toBe(true);
      expect(maxDepth(cards), l.id).toBeLessThanOrEqual(MAX_DEPTH);
      for (const c of cards) if (c !== 'end') expect(l.cards, `${l.id} uses ${c}`).toContain(c);
      expect(cardCount(cards), l.id).toBeLessThanOrEqual(l.max);
      expect(run(boardOf(l), cards).outcome, l.id).toEqual({ kind: 'win' });
    }
  });

  it('the solver finds a program within every level’s card limit, using only the level’s cards', () => {
    for (const l of ALL) {
      const board = boardOf(l);
      const s = solve(board, { cards: l.cards, budget: l.max });
      expect(s, `${l.id} solvable in ≤ ${l.max} cards`).not.toBeNull();
      expect(s!.cost).toBeLessThanOrEqual(l.max);
      expect(cardCount(s!.cards)).toBe(s!.cost);
      expect(run(board, s!.cards).outcome, l.id).toEqual({ kind: 'win' });
      for (const c of s!.cards) if (c !== 'end') expect(l.cards).toContain(c);
    }
  }, 60_000);

  it('every "repeats inside repeats" puzzle really needs a repeat inside a repeat', () => {
    for (const l of LEVELS.slice(CHAPTERS[2], CHAPTERS[3])) {
      const flat = solve(boardOf(l), { cards: l.cards, budget: l.max, maxDepth: 1 });
      expect(flat, `${l.id} has a ${flat?.cost}-card program without nesting`).toBeNull();
    }
  }, 60_000);

  it('ramps gently: the first puzzle needs two cards, loops arrive in chapter two, the if card last', () => {
    expect(cardCount(cardsOf(LEVELS[0]!.solution))).toBe(2);
    expect(LEVELS[0]!.cards).toEqual(['step']);
    const firstWith = (c: Card): number => LEVELS.findIndex((l) => l.cards.includes(c));
    expect(firstWith('right')).toBeLessThan(firstWith('jump'));
    expect(firstWith('jump')).toBeLessThan(CHAPTERS[1]!);
    expect(Math.min(firstWith('rep2'), firstWith('rep3'))).toBe(CHAPTERS[1]);
    expect(firstWith('ifRight')).toBe(CHAPTERS[3]);
    // Every new card is introduced with a tip.
    for (const c of PLACEABLE_ALL) expect(LEVELS[firstWith(c)]!.tip, c).toBeTruthy();
    // Nested repeats first appear in chapter three.
    const nested = LEVELS.findIndex((l) => maxDepth(cardsOf(l.solution)) === 2);
    expect(nested).toBe(CHAPTERS[2]);
  });

  it('labels, chapters, fresh cards and holiday sets', () => {
    expect(levelsFor('christmas')).toHaveLength(32);
    expect(levelsFor('valentines-day')).toHaveLength(30);
    const xmas = levelsFor('christmas');
    expect(levelLabel(xmas, 0)).toBe('Puzzle 1');
    expect(levelLabel(xmas, 31)).toBe('Bonus 2');
    expect([...freshCards(LEVELS, 0)]).toEqual(['step']);
    expect([...freshCards(LEVELS, 2)]).toEqual(['right']);
    expect([...freshCards(LEVELS, 21)]).toEqual([]);
    expect(freshCards(xmas, 30).size).toBe(0);
    expect(COPY.chapters).toHaveLength(CHAPTERS.length);
  });

  it('level text is plain words: no URLs, short names and tips', () => {
    for (const l of ALL) {
      const text = `${l.name} ${l.tip ?? ''}`;
      expect(text).not.toMatch(/http|www\.|\.com/);
      expect(l.name.length, l.id).toBeLessThanOrEqual(24);
      expect((l.tip ?? '').length, l.id).toBeLessThanOrEqual(140);
    }
  });
});

describe('interpreter', () => {
  it('steps, turns both ways and collects items on the way to the goal', () => {
    const board = b('.....', '.....', '>*.G.', '.....', '.....');
    const r = run(board, cardsOf('S S S'));
    expect(r.outcome).toEqual({ kind: 'win' });
    expect(r.frames.map((f) => f.action)).toEqual(['step', 'step', 'step']);
    expect(r.frames[0]!.collected).toBe(0);
    const turned = run(board, cardsOf('L L R'));
    expect(turned.frames.map((f) => f.dir)).toEqual([0, 3, 0]);
    expect(turned.outcome).toEqual({ kind: 'short', left: 1 });
  });

  it('stops at walls and edges with a bump, leaving Jubi where she was', () => {
    const board = b('.....', '.....', '>#.G.', '.....', '.....');
    const r = run(board, cardsOf('S S'));
    expect(r.outcome).toEqual({ kind: 'bump', into: 'block', at: { x: 1, y: 2 } });
    expect(r.frames).toHaveLength(1);
    expect(r.frames[0]!.pos).toEqual({ x: 0, y: 2 });
    expect(r.frames[0]!.toward).toEqual({ x: 1, y: 2 });
    const edge = run(board, cardsOf('L L S'));
    expect(edge.outcome).toEqual({ kind: 'bump', into: 'edge', at: { x: -1, y: 2 } });
  });

  it('jumps over exactly one obstacle, never onto one or off the board', () => {
    const over = b('.....', '.....', '>#.G.', '.....', '.....');
    expect(run(over, cardsOf('J S')).outcome).toEqual({ kind: 'win' });
    const onto = b('.....', '.....', '>.#G.', '.....', '.....');
    expect(run(onto, cardsOf('J')).outcome).toEqual({ kind: 'jump', into: 'block', at: { x: 2, y: 2 } });
    const off = b('.....', '.....', '...G>', '.....', '.....');
    expect(run(off, cardsOf('J')).outcome).toEqual({ kind: 'jump', into: 'edge', at: { x: 6, y: 2 } });
    // Jumping over an item does not collect it; landing on one does.
    const items = b('.....', '.....', '>**.G', '.....', '.....');
    const r = run(items, cardsOf('J J'));
    expect(r.frames.map((f) => f.collected)).toEqual([1, undefined]);
    expect(r.outcome).toEqual({ kind: 'short', left: 1 });
  });

  it('repeats nest, report their pass, and an unclosed repeat runs to the end', () => {
    const board = b('.......', '.......', '.......', '>.....G', '.......');
    const r = run(board, cardsOf('[2 [3 S ] ]'));
    expect(r.outcome).toEqual({ kind: 'win' });
    expect(r.frames).toHaveLength(6);
    expect(r.frames[4]!.loops).toEqual([{ at: 0, iter: 2, of: 2 }, { at: 1, iter: 2, of: 3 }]);
    expect(run(board, cardsOf('[3 S S')).outcome).toEqual({ kind: 'win' });
    expect(parse(cardsOf('[2 S ] ]'))).toEqual([{ k: 'repeat', n: 2, at: 0, body: [{ k: 'do', card: 'step', at: 1 }] }]);
  });

  it('"if blocked, turn right" turns only when the way ahead is blocked or off the board', () => {
    const board = b('.....', '.....', '..#..', '..^..', '....G');
    const r = run(board, cardsOf('?'));
    expect(r.frames[0]).toMatchObject({ action: 'check', blocked: true, dir: 1 });
    const clear = b('.....', '.....', '.....', '..^..', '....G');
    expect(run(clear, cardsOf('?')).frames[0]).toMatchObject({ action: 'check', blocked: false, dir: 0 });
    const edge = b('..^..', '.....', '.....', '..G..', '.....');
    expect(run(edge, cardsOf('?')).frames[0]).toMatchObject({ blocked: true, dir: 1 });
  });

  it('reports an empty program, items left, and arriving without reaching the goal', () => {
    const board = b('.....', '.....', '>*.G.', '.....', '.....');
    expect(run(board, []).outcome).toEqual({ kind: 'empty' });
    expect(run(board, cardsOf('S S')).outcome).toEqual({ kind: 'notHome' });
    expect(run(board, cardsOf('R')).outcome).toEqual({ kind: 'short', left: 1 });
  });

  it('wins the moment everything is collected on the goal, ignoring later cards', () => {
    const board = b('.....', '.....', '>G...', '.....', '.....');
    const r = run(board, cardsOf('S S S S'));
    expect(r.outcome).toEqual({ kind: 'win' });
    expect(r.frames).toHaveLength(1);
  });
});

describe('editing the program', () => {
  it('a repeat arrives with its End and counts as one card', () => {
    const { cards, focus } = insertCard(['step'], 'rep2', 0);
    expect(cards).toEqual(['step', 'rep2', 'end']);
    expect(focus).toBe(1);
    expect(cardCount(cards)).toBe(2);
    expect(partners(cards)).toEqual([-1, 2, 1]);
    expect(depths(['rep2', 'step', 'rep3', 'left', 'end', 'end'])).toEqual([0, 1, 1, 2, 1, 0]);
  });

  it('removing a repeat or its End removes both and keeps the cards inside', () => {
    const p = cardsOf('[2 S L ] R');
    expect(removeCard(p, 0)).toEqual(['step', 'left', 'right']);
    expect(removeCard(p, 3)).toEqual(['step', 'left', 'right']);
    expect(removeCard(p, 1)).toEqual(['rep2', 'left', 'end', 'right']);
  });

  it('moves keep the program well formed and nesting at most two deep', () => {
    const p = cardsOf('[2 S ]');
    expect(moveCard(p, 1, -1)).toEqual(['step', 'rep2', 'end']);
    expect(moveCard(p, 0, 1)).toEqual(['step', 'rep2', 'end']);
    expect(moveCard(cardsOf('[2 ]'), 0, 1)).toBeNull();
    expect(moveCard(p, 0, -1)).toBeNull();
    expect(moveCard(p, 2, 1)).toBeNull();
    expect(moveCardTo(cardsOf('S [2 L ]'), 0, 3)).toEqual(['rep2', 'left', 'end', 'step']);
    expect(moveCardTo(cardsOf('[2 ] S'), 1, 0)).toBeNull();
    expect(moveCardTo(cardsOf('[2 [3 ] ] [2 ]'), 4, 2)).toBeNull();
  });
});

describe('skins and words', () => {
  it('every holiday gets a skin, with hand-made ones for the big holidays', () => {
    for (const m of HOLIDAYS) {
      const s = skinFor(m, THEMES[m.theme].mood);
      expect(s.one.length, m.id).toBeGreaterThan(0);
      expect(s.goalName.startsWith('the '), m.id).toBe(true);
    }
    for (const id of ['christmas', 'diwali', 'lunar-new-year', 'halloween', 'easter']) expect(SKINNED).toContain(id);
    for (const id of SKINNED) expect(byId(id), id).toBeDefined();
    expect(skinFor(byId('diwali')!, 'night')).toMatchObject({ item: 'diya', verb: 'light' });
    expect(skinFor(byId('christmas')!, 'night')).toMatchObject({ item: 'present', block: 'snowman', ground: 'snow' });
  });

  it('goal lines and hints read naturally and never say "wrong"', () => {
    const diwali = skinFor(byId('diwali')!, 'night');
    expect(goalLine(diwali, 3)).toBe('Light 3 diyas and get to the front door!');
    expect(goalLine(diwali, 1)).toBe('Light the diya and get to the front door!');
    const xmas = skinFor(byId('christmas')!, 'night');
    expect(hintFor({ kind: 'bump', into: 'block', at: { x: 1, y: 1 } }, xmas, { jumpOffered: false, items: 1 })).toBe('Jubi bumped into a snowman. Try turning first!');
    const all = [
      hintFor({ kind: 'empty' }, xmas, { jumpOffered: false, items: 1 }),
      hintFor({ kind: 'bump', into: 'edge', at: { x: -1, y: 1 } }, xmas, { jumpOffered: true, items: 1 }),
      hintFor({ kind: 'bump', into: 'block', at: { x: 1, y: 1 } }, xmas, { jumpOffered: true, items: 1 }),
      hintFor({ kind: 'jump', into: 'block', at: { x: 1, y: 1 } }, xmas, { jumpOffered: true, items: 1 }),
      hintFor({ kind: 'jump', into: 'edge', at: { x: 1, y: 1 } }, xmas, { jumpOffered: true, items: 1 }),
      hintFor({ kind: 'short', left: 1 }, xmas, { jumpOffered: true, items: 2 }),
      hintFor({ kind: 'short', left: 2 }, xmas, { jumpOffered: true, items: 2 }),
      hintFor({ kind: 'notHome' }, xmas, { jumpOffered: true, items: 2 }),
      hintFor({ kind: 'notHome' }, xmas, { jumpOffered: true, items: 0 }),
    ];
    for (const h of all) {
      expect(h.length).toBeGreaterThan(10);
      expect(h).not.toMatch(/wrong|fail|bad|lose|lost|\{/i);
    }
    expect(all[6]).toBe('2 more presents to deliver! Can Jubi reach them?');
  });

  it('hints only suggest a jump or a step when it would really work from where Jubi stopped', () => {
    const xmas = skinFor(byId('christmas')!, 'night');
    const l19 = LEVELS.find((l) => l.id === 'L19')!;
    const board = boardOf(l19);
    const hint = (src: string): string => {
      const r = run(board, cardsOf(src));
      const last = r.frames[r.frames.length - 1]!;
      return hintFor(r.outcome, xmas, { jumpOffered: true, items: board.items.length, stop: { board, pos: last.pos, dir: last.dir } });
    };
    // Bumps at (1,2) facing right; a jump would land on (3,2), another snowman.
    expect(hint('J R S J J J')).toBe('Jubi bumped into a snowman. Try turning first!');
    // One snowman with open ground behind it: the jump idea is right.
    const fence = b('.....', '.....', '>#.G.', '.....', '.....');
    const bumped = run(fence, cardsOf('S'));
    expect(hintFor(bumped.outcome, xmas, { jumpOffered: true, items: 0, stop: { board: fence, pos: { x: 0, y: 2 }, dir: 1 } })).toBe('Jubi bumped into a snowman. A Jump card hops right over it!');
    expect(hintFor(bumped.outcome, xmas, { jumpOffered: false, items: 0, stop: { board: fence, pos: { x: 0, y: 2 }, dir: 1 } })).toBe('Jubi bumped into a snowman. Try turning first!');
    // Lands on a snowman from (3,4) facing up; (3,3) and (3,2) are snowmen too, so no "Step first".
    expect(hint('R J L J L')).toBe('Jubi can’t land on a snowman. Try turning first!');
    // From (1,4) facing up the square ahead is a snowman too: a Step would only bump.
    const hop = b('.....', '..*..', '.#...', '.#...', '.^..G');
    const r = run(hop, cardsOf('J'));
    expect(r.outcome).toEqual({ kind: 'jump', into: 'block', at: { x: 1, y: 2 } });
    expect(hintFor(r.outcome, xmas, { jumpOffered: true, items: 1, stop: { board: hop, pos: { x: 1, y: 4 }, dir: 0 } })).toBe('Jubi can’t land on a snowman. Try turning first!');
    // Here (1,3) and (1,1) are open, so a Step and then the Jump lands.
    const hop2 = b('.....', '.....', '.#...', '.....', '.^..G');
    const r2 = run(hop2, cardsOf('J'));
    expect(hintFor(r2.outcome, xmas, { jumpOffered: true, items: 0, stop: { board: hop2, pos: { x: 1, y: 4 }, dir: 0 } })).toBe('Jubi can’t land on a snowman. Try a Step before the jump.');
  });

  it('focus rings and the caret slot stand out (3:1) on every theme’s sky and panels', () => {
    for (const t of Object.values(THEMES)) {
      const f = focusColor(t);
      for (const bg of ringSurfaces(t)) expect(contrastRatio(f, bg), `${t.id} ${f} on ${bg}`).toBeGreaterThanOrEqual(3);
    }
    // A white glow on a pale Easter sky falls back to the theme's ink.
    expect(focusColor(THEMES.easter)).toBe(THEMES.easter.ink);
    expect(focusColor(THEMES.christmas)).toBe(THEMES.christmas.glow);
  });

  it('every COPY string is URL-free', () => {
    expect(JSON.stringify(COPY)).not.toMatch(/http|www\.|\.com/);
  });
});

describe('stars', () => {
  const memory = (): { data: Map<string, string>; storage: { getItem(k: string): string | null; setItem(k: string, v: string): void } } => {
    const data = new Map<string, string>();
    return { data, storage: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) } };
  };

  it('keeps solved puzzles under jubilee.path.v1, listed for the grown-ups page', () => {
    forgetSessionStars();
    const { data, storage } = memory();
    const s = pathStars({ pretending: false, storage });
    expect(s.add('L01')).toBe(true);
    expect(s.add('L01')).toBe(false);
    s.add('christmas-1');
    expect(JSON.parse(data.get(PATH_KEY)!)).toEqual({ version: 1, items: ['L01', 'christmas-1'] });
    expect(pathStars({ pretending: false, storage }).count(['L01', 'L02', 'christmas-1'])).toBe(2);
    expect(PLAY_STORAGE.map((k) => k.key)).toContain(PATH_KEY);
  });

  it('writes nothing while pretending a date, and survives broken storage', () => {
    forgetSessionStars();
    const { data, storage } = memory();
    const s = pathStars({ pretending: true, storage });
    expect(s.add('L05')).toBe(true);
    expect(s.has('L05')).toBe(true);
    expect(data.size).toBe(0);
    data.set(PATH_KEY, '{not json');
    expect(readSolved(storage)).toEqual([]);
    data.set(PATH_KEY, JSON.stringify({ items: ['L01', 42, '<script>'] }));
    expect(readSolved(storage)).toEqual(['L01']);
    const throwing = { getItem: (): string => { throw new Error('blocked'); }, setItem: (): void => { throw new Error('blocked'); } };
    const t = pathStars({ pretending: false, storage: throwing });
    expect(t.add('L02')).toBe(true);
    expect(t.has('L02')).toBe(true);
    forgetSessionStars();
  });
});
