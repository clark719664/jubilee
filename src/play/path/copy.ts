/**
 * copy.ts — every Jubi's Path string (kept here, not in ui/copy.ts, so the activity is one folder).
 * Plain words a six-year-old can follow. Nothing says "wrong": a program that stops early is just Jubi
 * bumping into something, with a friendly idea for what to try next.
 */
import { DX, DY, open, type Board, type Card, type Dir, type Outcome, type Pos } from './model';
import type { Skin } from './skins';

export const COPY = {
  title: "Jubi's Path",
  emoji: '🧭',
  blurb: 'Line up cards to guide Jubi along the path',
  close: 'Back to {holiday}',
  puzzleN: 'Puzzle {n}',
  bonusN: 'Bonus {n}',
  puzzleOf: 'Puzzle {n} of {total}',
  starsLabel: '{n} of {total} puzzles solved',
  puzzles: 'Puzzles',
  prevPuzzle: 'Previous puzzle',
  nextPuzzle: 'Next puzzle',
  closeDialog: 'Close',
  puzzlesLabel: 'Choose a puzzle',
  pickTitle: 'Choose a puzzle',
  pickSub: 'Every puzzle is open. A star means you solved it!',
  chapters: ['First steps', 'Repeat cards', 'Repeats inside repeats', 'If blocked'],
  bonusChapter: '{holiday} bonus puzzles',
  levelButton: '{label}: {name}',
  levelSolved: '{label}: {name}, solved',
  goal: '{verb} {count} and get to {goal}!',
  goalOne: '{verb} the {one} and get to {goal}!',
  goalNone: 'Get Jubi to {goal}!',
  palette: 'Cards',
  paletteHelp: 'Tap a card to add it, or drag it into the path.',
  strip: 'Your path',
  stripLabel: "Jubi's program, {n} of {max} cards used",
  stripEmpty: 'Tap cards to build a path for Jubi.',
  stripFull: 'That’s all {max} cards. Press Go to try your path!',
  cardsUsed: '{n} / {max} cards',
  cardsUsedLabel: '{n} of {max} cards used',
  go: 'Go!',
  stop: 'Stop',
  again: 'Try again',
  clear: 'Clear',
  clearLabel: 'Clear the path',
  moveEarlier: 'Move card earlier',
  moveLater: 'Move card later',
  remove: 'Remove card',
  watch: 'Watch again',
  next: 'Next puzzle',
  choose: 'Choose a puzzle',
  // Cards (short label on the card; long name for screen readers).
  cards: {
    step: ['Step', 'Step forward'],
    left: ['Left', 'Turn left'],
    right: ['Right', 'Turn right'],
    jump: ['Jump', 'Jump over one square'],
    rep2: ['Repeat', 'Repeat 2 times'],
    rep3: ['Repeat', 'Repeat 3 times'],
    ifRight: ['If blocked', 'If blocked, turn right'],
    end: ['End', 'End of repeat'],
  } as Record<Card, readonly [string, string]>,
  add: 'Add {card}',
  // Strip positions count every card in the strip, End cards too ("position 6 of 6"); the limit
  // counts cards used ("5 of 6 cards used"), where a Repeat and its End are one card.
  cardAt: '{card}, position {n} of {total}',
  cardInside: '{card}, inside repeat, position {n} of {total}',
  cardInside2: '{card}, inside 2 repeats, position {n} of {total}',
  endOf: 'End of {repeat}',
  grabbed: 'Picked up {card}. Use the arrow keys to move it, then press Enter. Escape puts it back.',
  dropped: '{card} is now at position {n} of {total}.',
  putBack: '{card} put back.',
  cantMove: 'A Repeat card has to come before its End card.',
  sayAdded: '{card} added. {n} of {max} cards used.',
  sayAddedRepeat: '{card} added. The next cards go inside it until its End card.',
  sayRemoved: '{card} removed. {n} of {max} cards used.',
  sayCleared: 'The path is empty. Add some cards!',
  sayFull: 'All {max} cards are used.',
  tooDeep: 'Two repeats inside each other is the most Jubi can follow!',
  sayRun: 'Jubi is walking the path.',
  sayLevel: '{label}: {name}. {goal}',
  stripKeys: 'Arrow keys move between cards. Space picks a card up to move it, Escape puts it back. Delete removes it.',
  // Outcomes — gentle, specific, never "wrong".
  win: ['You did it!', 'Hooray!', 'Brilliant path!', 'Jubi made it!', 'Super coding!'],
  winName: 'You did it, {name}!',
  winAll: 'Every {one} is {done}!',
  winNoItems: 'Jubi made it to {goal}!',
  winFirst: 'You earned a star!',
  winAgain: 'Solved again. Nice!',
  winShort: 'Wow, only {n} cards!',
  hintEmpty: 'Add some cards to the path, then press Go!',
  hintBlock: 'Jubi bumped into {aBlock}. Try turning first!',
  hintBlockJump: 'Jubi bumped into {aBlock}. A Jump card hops right over it!',
  hintEdge: 'Whoa, that is the edge of {place}! Try turning first.',
  hintJumpBlock: 'Jubi can’t land on {aBlock}. Try a Step before the jump.',
  hintJumpBlockTurn: 'Jubi can’t land on {aBlock}. Try turning first!',
  hintJumpEdge: 'That jump would land off {place}! Try a Step or a turn instead.',
  hintJumpEdgeTurn: 'That jump would land off {place}! Try turning first.',
  hintShortOne: '1 more {one} to {verb}! Can Jubi reach it?',
  hintShort: '{n} more {many} to {verb}! Can Jubi reach them?',
  hintHome: 'Every {one} is {done}! Now walk Jubi to {goal}.',
  hintHomeNoItems: 'Nearly! Now walk Jubi all the way to {goal}.',
  hintLoopy: 'Jubi went round and round. Try fewer repeats!',
  board: 'The puzzle board',
  describe: '{cols} by {rows} squares. Jubi is in row {row}, column {col}, facing {facing}. {goal} is in row {grow}, column {gcol}.',
  describeItems: '{list}.',
  describeItem: 'A {one} in row {row}, column {col}',
  describeBlocks: '{Blocks} in: {list}.',
  rowCol: 'row {row} column {col}',
  facing: ['up', 'right', 'down', 'left'],
  tipTitle: 'New card!',
} as const;

export function fill(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** The level's goal line: "Light 3 diyas and get to the front door!" */
export function goalLine(skin: Skin, items: number): string {
  if (items === 0) return fill(COPY.goalNone, { goal: skin.goalName });
  if (items === 1) return fill(COPY.goalOne, { verb: cap(skin.verb), one: skin.one, goal: skin.goalName });
  return fill(COPY.goal, { verb: cap(skin.verb), count: `${items} ${skin.many}`, goal: skin.goalName });
}

/** Where Jubi stopped: the board, her square and the way she faces. */
export interface Stop { readonly board: Board; readonly pos: Pos; readonly dir: Dir }

/**
 * The hint after a run that did not finish. `jumpOffered` says whether the jump card is on offer, and
 * `stop` where Jubi ended up: an idea (jump over it, step first) is only offered when it would really
 * work from there; otherwise the hint suggests turning.
 */
export function hintFor(outcome: Outcome, skin: Skin, opts: { jumpOffered: boolean; items: number; loopy?: boolean; stop?: Stop }): string {
  const v = { aBlock: skin.aBlock, place: skin.place, one: skin.one, many: skin.many, verb: skin.verb, done: skin.done, goal: skin.goalName };
  // Open ground `k` squares ahead of where Jubi stopped (unknown → no).
  const clear = (k: number): boolean => {
    const s = opts.stop;
    return !!s && open(s.board, s.pos.x + DX[s.dir]! * k, s.pos.y + DY[s.dir]! * k);
  };
  switch (outcome.kind) {
    case 'empty': return COPY.hintEmpty;
    case 'bump':
      if (outcome.into === 'edge') return fill(COPY.hintEdge, v);
      return fill(opts.jumpOffered && clear(2) ? COPY.hintBlockJump : COPY.hintBlock, v);
    case 'jump':
      // "Step first" only helps when the square ahead is open and the jump from there lands.
      if (outcome.into === 'edge') return fill(clear(1) ? COPY.hintJumpEdge : COPY.hintJumpEdgeTurn, v);
      return fill(clear(1) && clear(3) ? COPY.hintJumpBlock : COPY.hintJumpBlockTurn, v);
    case 'short':
      if (opts.loopy) return COPY.hintLoopy;
      return fill(outcome.left === 1 ? COPY.hintShortOne : COPY.hintShort, { ...v, n: outcome.left });
    case 'notHome': return fill(opts.items > 0 ? COPY.hintHome : COPY.hintHomeNoItems, v);
    case 'win': return '';
  }
}
