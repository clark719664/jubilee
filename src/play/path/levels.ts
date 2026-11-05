/**
 * levels.ts — the 30 handmade puzzles every holiday shares, plus two themed bonus puzzles each for
 * Christmas, Diwali, Lunar New Year, Halloween and Easter. Levels are plain data: an ASCII map, the cards
 * on offer, a card limit, a short name, and one known solution (tests prove the solution works and a
 * solver proves nothing cheaper is needed than the limit allows).
 *
 * Map key: `.` open ground · `#` obstacle (snowman, lantern, tree… by skin) · `*` item to collect/light/
 * deliver · `G` goal · `^ > v <` Jubi's start and facing. Grids are 5×5 to 7×7.
 *
 * The ramp: 1–10 first steps (step, turns, going around, jumping), 11–20 repeats, 21–25 repeats inside
 * repeats, 26–30 "if blocked, turn right". Cards appear one at a time, each with a one-line tip.
 */
import type { HolidayId } from '../../content/types';
import { COPY, fill } from './copy';
import type { Board, Card, Dir, Pos } from './model';

export interface Level {
  /** Stable id for the stars record: 'L01'…'L30', or '<holidayId>-1'/'-2' for bonus puzzles. */
  readonly id: string;
  readonly name: string;
  readonly map: readonly string[];
  /** Cards on offer, in palette order. */
  readonly cards: readonly Card[];
  /** Card limit (a repeat and its end count as one). */
  readonly max: number;
  /** One known solution, compact ("S S R [3 S ]"); the tests run it. */
  readonly solution: string;
  /** A new card's introduction, shown when the level opens. */
  readonly tip?: string;
  /** Only shown for this holiday. */
  readonly bonus?: HolidayId;
}

const WALK: readonly Card[] = ['step', 'left', 'right'];
const HOP: readonly Card[] = ['step', 'left', 'right', 'jump'];
const LOOP: readonly Card[] = ['step', 'left', 'right', 'jump', 'rep2', 'rep3'];
const SMART: readonly Card[] = ['step', 'left', 'right', 'jump', 'rep2', 'rep3', 'ifRight'];

export const LEVELS: readonly Level[] = [
  // ── 1–10: first steps ──
  { id: 'L01', name: 'First steps', cards: ['step'], max: 3, solution: 'S S',
    tip: 'Tap Step twice, then press Go!',
    map: ['.....', '.....', '>*G..', '.....', '.....'] },
  { id: 'L02', name: 'Straight ahead', cards: ['step'], max: 5, solution: 'S S S S',
    map: ['.....', '.....', '>.*.G', '.....', '.....'] },
  { id: 'L03', name: 'Turn right', cards: ['step', 'right'], max: 4, solution: 'S R S',
    tip: 'Turn right spins Jubi on the spot. Watch the little arrow!',
    map: ['.....', '.>*..', '..G..', '.....', '.....'] },
  { id: 'L04', name: 'Turn left', cards: ['step', 'left'], max: 6, solution: 'S S L S S',
    tip: 'Turn left spins Jubi the other way.',
    map: ['.....', '...G.', '...*.', '.>.*.', '.....'] },
  { id: 'L05', name: 'Left, then right', cards: WALK, max: 7, solution: 'S S L S R S',
    map: ['.....', '.....', '..*G.', '>.*..', '.....'] },
  { id: 'L06', name: 'Something in the way', cards: WALK, max: 7, solution: 'R S L S R S',
    tip: 'Jubi cannot walk through things. Go around!',
    map: ['.....', '.#*G.', '.^...', '.....', '.....'] },
  { id: 'L07', name: 'Round the bend', cards: WALK, max: 9, solution: 'S S R S S R S S',
    map: ['.....', '.*.*.', '.*#*.', '.^#G.', '.....'] },
  { id: 'L08', name: 'Hop!', cards: ['step', 'jump'], max: 4, solution: 'J S S',
    tip: 'Jump hops over one square, even if something is in the way.',
    map: ['.....', '.....', '>#*.G', '.....', '.....'] },
  { id: 'L09', name: 'Hop and turn', cards: HOP, max: 5, solution: 'J L S J',
    map: ['..G..', '..#..', '..*..', '>#*..', '.....'] },
  { id: 'L10', name: 'Pick them all', cards: HOP, max: 8, solution: 'S S R J R S S',
    map: ['.....', '.*#*.', '.*.*.', '.^.G.', '.....'] },

  // ── 11–20: repeats ──
  { id: 'L11', name: 'Again and again', cards: ['step', 'rep3'], max: 3, solution: '[3 S S ]',
    tip: 'Repeat ×3 does the cards inside it three times. Put cards between Repeat and End.',
    map: ['.......', '.......', '.......', '>.*.*.G', '.......'] },
  { id: 'L12', name: 'Two long sides', cards: ['step', 'right', 'rep2'], max: 7, solution: '[2 S S S S R ]',
    tip: 'Repeat ×2 does its cards twice.',
    map: ['*.*.G', '.....', '*....', '.....', '^....'] },
  { id: 'L13', name: 'Up the stairs', cards: ['step', 'left', 'right', 'rep3'], max: 6, solution: '[3 S L S R ]',
    map: ['.....', '...G.', '..*..', '.*...', '>....'] },
  { id: 'L14', name: 'Round the tree', cards: ['step', 'right', 'rep3'], max: 6, solution: '[3 S S R ] S',
    map: ['.....', '.*.*.', '..#..', '.^G*.', '.....'] },
  { id: 'L15', name: 'Hop, hop, hop', cards: ['step', 'jump', 'rep3'], max: 2, solution: '[3 J ]',
    map: ['.......', '.......', '.......', '>#*#*#G', '.......', '.......', '.......'] },
  { id: 'L16', name: 'Down the stairs', cards: LOOP, max: 6, solution: '[3 S R S L ]',
    map: ['>*....', '..*...', '...*..', '...G..', '......', '......'] },
  { id: 'L17', name: 'Hop the fence', cards: LOOP, max: 3, solution: '[2 S J ]',
    map: ['.......', '.......', '.......', '>*#.*#G', '.......', '.......', '.......'] },
  { id: 'L18', name: 'Zigzag', cards: LOOP, max: 7, solution: '[2 S S R S S L ]',
    map: ['>.*...', '..*...', '..*.*.', '....*.', '....G.', '......'] },
  { id: 'L19', name: 'All the way round', cards: LOOP, max: 7, solution: '[3 S S S R ] S S',
    map: ['......', '.*..*.', '..##..', '..##..', '.^G.*.', '......'] },
  { id: 'L20', name: 'Lucky stripes', cards: LOOP, max: 5, solution: '[2 J J S R ]',
    map: ['......', '>#*#*.', '.....#', '.....*', '.....#', '.....G'] },

  // ── 21–25: repeats inside repeats ──
  { id: 'L21', name: 'Loop in a loop', cards: ['step', 'right', 'rep2', 'rep3'], max: 4, solution: '[2 [3 S ] R ]',
    tip: 'You can put a Repeat inside a Repeat!',
    map: ['.....', '*.*G.', '.....', '.....', '^....'] },
  { id: 'L22', name: 'Big square', cards: LOOP, max: 5, solution: '[3 [3 S S ] R ]',
    map: ['...*...', '.......', '.......', '*.....*', '.......', '.......', '^.....G'] },
  { id: 'L23', name: 'Tall stairs', cards: LOOP, max: 6, solution: '[2 [3 S ] R S L ]',
    map: ['>**....', '....**.', '......G', '.......', '.......'] },
  { id: 'L24', name: 'Fence posts', cards: LOOP, max: 6, solution: '[2 [3 J ] R S R ]',
    map: ['.......', '>#*#*#*', 'G#*#*#.', '.......', '.......'] },
  // No Jump here: hopping the pond's edge would let one Repeat do the whole lap.
  { id: 'L25', name: 'Round the pond', cards: ['step', 'left', 'right', 'rep2', 'rep3'], max: 7, solution: '[3 [2 S S ] R ] S S',
    map: ['.......', '.*...*.', '..#.#..', '...#...', '..#.#..', '.^.G.*.', '.......'] },

  // ── 26–30: if blocked, turn right ──
  { id: 'L26', name: 'If blocked…', cards: ['step', 'ifRight', 'rep2', 'rep3'], max: 4, solution: '[2 [3 ? S ] ]',
    tip: 'If blocked, turn right: when something is in front of Jubi, she turns right. If not, nothing happens.',
    map: ['.*.G.', '.....', '*....', '^....', '.....'] },
  { id: 'L27', name: 'Follow the wall', cards: SMART, max: 4, solution: '[3 [3 ? S ] ]',
    map: ['#....', '*.*#.', '.....', 'G.*..', '^.#..'] },
  { id: 'L28', name: 'Big loop', cards: SMART, max: 6, solution: '[3 [3 ? S ? S ] ]',
    map: ['*..*..*', '.......', '.......', '*.....*', '....G..', '......#', '^......'] },
  { id: 'L29', name: 'Clever hops', cards: SMART, max: 5, solution: '[3 [3 ? S ] ] J',
    map: ['.*.*#', '.....', '.*...', '.....', '.^.#.', '...G.'] },
  { id: 'L30', name: 'The grand tour', cards: SMART, max: 8, solution: '[3 [3 ? S ? S ? S ] ]',
    map: ['...*...', '..#....', '...G...', '*.....*', '..*....', '.......', '^#..*..'] },
];

export const BONUS: readonly Level[] = [
  { id: 'christmas-1', bonus: 'christmas', name: 'Sleigh run', cards: SMART, max: 7, solution: '[3 S S R S L ]',
    map: ['>.*#...', '..*.*#.', '....*.*', '......G', '.......'] },
  { id: 'christmas-2', bonus: 'christmas', name: 'Round the big tree', cards: SMART, max: 7, solution: '[3 S J S R ] S J',
    map: ['.......', '.*.#.*.', '.......', '.#...#.', '.......', '.^G#.*.', '.......'] },
  { id: 'diwali-1', bonus: 'diwali', name: 'Ring of lamps', cards: SMART, max: 6, solution: '[3 S S R ] S',
    map: ['.....', '.***.', '.*#*.', '.^G*.', '.....'] },
  { id: 'diwali-2', bonus: 'diwali', name: 'Festival lane', cards: SMART, max: 7, solution: '[3 [3 ? S ? S ] ]',
    map: ['..*..*', '......', '*.....', '.....*', '.G.*..', '^....#'] },
  { id: 'lunar-new-year-1', bonus: 'lunar-new-year', name: 'Lantern street', cards: SMART, max: 5, solution: 'S J J S',
    map: ['.......', '.#.#.#.', '>*#*#*G', '.#.#.#.', '.......'] },
  { id: 'lunar-new-year-2', bonus: 'lunar-new-year', name: 'Dragon dance', cards: SMART, max: 7, solution: '[2 [3 S L S R ] ]',
    map: ['......G', '.....*.', '....*.#', '...*.#.', '..*.#..', '.*.#...', '>.#....'] },
  { id: 'halloween-1', bonus: 'halloween', name: 'Trick-or-treat street', cards: SMART, max: 6, solution: '[3 [2 S S ] L ]',
    map: ['.......', '.v.#.G.', '...#...', '.*.#.*.', '.......', '.*.*.*.', '.......'] },
  { id: 'halloween-2', bonus: 'halloween', name: 'Moonlit maze', cards: SMART, max: 5, solution: '[3 [3 ? S ] ]',
    map: ['..#...', '#.....', '..*.*#', '*.....', '..#.G.', '^...#.'] },
  { id: 'easter-1', bonus: 'easter', name: 'Egg hunt', cards: SMART, max: 7, solution: 'S [3 J J R ] J',
    map: ['.......', '.*.*.*.', '.......', '.*...*.', '...#...', '.*.G.*.', '.^.....'] },
  { id: 'easter-2', bonus: 'easter', name: 'Bunny hops', cards: SMART, max: 6, solution: '[3 J J R ] J',
    map: ['.......', '.*#*#*.', '.#...#.', '.*...*.', '.#...#.', '.^.G#*.', '.......'] },
];

// ── parsing ──

const FACING: Record<string, Dir> = { '^': 0, '>': 1, v: 2, '<': 3 };

/** Turns a level's ASCII map into a Board. Throws on a malformed map (caught by the tests). */
export function boardOf(level: Pick<Level, 'id' | 'map'>): Board {
  const rows = level.map.length;
  const cols = level.map[0]?.length ?? 0;
  let start: Pos | null = null;
  let dir: Dir = 1;
  let goal: Pos | null = null;
  const items: Pos[] = [];
  const blocks: Pos[] = [];
  level.map.forEach((line, y) => {
    if (line.length !== cols) throw new Error(`${level.id}: ragged row ${y}`);
    [...line].forEach((ch, x) => {
      if (ch === '#') blocks.push({ x, y });
      else if (ch === '*') items.push({ x, y });
      else if (ch === 'G') goal = { x, y };
      else if (ch in FACING) { start = { x, y }; dir = FACING[ch]!; }
      else if (ch !== '.') throw new Error(`${level.id}: unknown map character ${ch}`);
    });
  });
  if (!start || !goal) throw new Error(`${level.id}: needs a start and a goal`);
  return { cols, rows, start, dir, goal, items, blocks };
}

/** The shared 30, then this holiday's bonus puzzles. */
export function levelsFor(holidayId: HolidayId): Level[] {
  return [...LEVELS, ...BONUS.filter((l) => l.bonus === holidayId)];
}

/** Chapter boundaries in the shared 30 (start indices), matching COPY.chapters. */
export const CHAPTERS: readonly number[] = [0, 10, 20, 25];

/** A level's label: "Puzzle 7" or "Bonus 1". */
export function levelLabel(levels: readonly Level[], i: number): string {
  const l = levels[i];
  if (!l) return '';
  return l.bonus ? fill(COPY.bonusN, { n: levels.slice(0, i + 1).filter((x) => x.bonus).length }) : fill(COPY.puzzleN, { n: i + 1 });
}

/** Cards a level offers that no earlier puzzle did (they get a "new" badge). */
export function freshCards(levels: readonly Level[], i: number): Set<Card> {
  const l = levels[i];
  if (!l || l.bonus) return new Set();
  const before = new Set(levels.slice(0, i).flatMap((x) => x.cards));
  return new Set(l.cards.filter((c) => !before.has(c)));
}
