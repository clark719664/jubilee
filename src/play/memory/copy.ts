/**
 * copy.ts — every Sticker Memory string (kept here, not in ui/copy.ts, so the activity is one folder).
 * Plain words a five-year-old can follow; nothing says "wrong", nothing scores the child.
 */
export const COPY = {
  title: 'Sticker Memory',
  emoji: '🃏',
  blurb: 'Flip two cards and find the matching stickers',
  tagline: 'Flip two cards. Find the pairs!',
  close: 'Back to {holiday}',
  deckTitle: 'Which stickers?',
  deckSeason: '{holiday} & friends',
  deckMine: 'My stickers',
  countFlips: 'Count my flips',
  pickBoard: 'Pick a board to start',
  boards: {
    small: { name: 'Little', note: 'Great for starting' },
    medium: { name: 'Middle', note: 'A bit trickier' },
    big: { name: 'Big', note: 'For memory masters' },
  },
  pairsN: '{n} pairs',
  boardLabel: '{name} board, {pairs} pairs, {cols} by {rows} cards',
  cardsGroup: '{pairs} pairs of sticker cards',
  progress: '{n} of {total} pairs found',
  flips: '{n} flips',
  flip1: '1 flip',
  hint: 'Hint',
  hintLabel: 'Hint: wiggle two cards that match',
  newBoard: 'New board',
  faceDown: 'Card {n}, face down',
  found: '{label}, found',
  mine: 'one of my stickers',
  sayFirst: '{label}',
  sayMatch: 'A pair! {label}. {n} of {total} found.',
  sayMiss: 'Not a pair this time. They will turn back over. Remember where they are!',
  sayHint: 'Look at the two wiggling cards. They match!',
  sayStart: '{pairs} pairs to find. Use the arrow keys to move and Enter to flip.',
  cheers: ['Pair!', 'Snap!', 'Got it!', 'Yes!', 'Match!', 'Awesome!', 'Woohoo!'],
  streak: { 2: 'Two in a row!', 3: 'Three in a row!', 4: 'On a roll!', 5: 'Super memory!' } as Record<number, string>,
  doneTitle: 'You found them all!',
  doneName: 'You found them all, {name}!',
  doneSub: 'Every sticker has its partner.',
  doneFlips: 'You did it in {n} flips.',
  donePerfect: 'Wow, {n} flips, not one extra!',
  playAgain: 'Play again',
  otherBoard: 'Change board',
  sayDone: 'You found all {total} pairs!',
} as const;

export function fill(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
