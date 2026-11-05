/**
 * copy.ts — every Story Time string (kept here, not in ui/copy.ts, so the activity is one folder).
 * The book text itself lives in books/<id>.ts.
 */
export const COPY = {
  title: 'Story Time',
  emoji: '📖',
  blurb: 'A picture book where you are the star',
  close: 'Back to {holiday}',
  starring: 'Starring {who}',
  friendLabel: 'Who is coming with you?',
  friendHelp: 'Type a friend’s first name, or leave it empty.',
  friendPlaceholder: 'A first name',
  start: 'Open the book',
  startWith: 'Read with {friend}',
  navLabel: 'Turn the pages',
  prev: 'Back a page',
  next: 'Next page',
  pageOf: 'Page {n} of {total}',
  coverLabel: 'Cover',
  endLabel: 'The End',
  readToMe: 'Read to me',
  stopReading: 'Stop reading',
  readingNote: 'Reading aloud',
  sayPage: 'Page {n} of {total}. {text}',
  sayCover: '{title}. {starring}.',
  sayEnd: 'The End. You made this story!',
  theEnd: 'The End',
  youMadeIt: 'You made this story!',
  endSub: 'Starring {who}.',
  fridge: 'Put it on the Fridge',
  fridgeSaved: 'It’s on your Fridge!',
  fridgeAgain: 'On the Fridge',
  fridgePretend: 'Pretend days don’t save to the Fridge, but you can still print it.',
  fridgeFullTitle: 'The Fridge is full!',
  fridgeFullBody: 'Take one thing down to make room, or keep them all.',
  fridgeTakeDown: 'Take down',
  fridgeTakeDownSure: 'Yes, take it down',
  fridgeTakeDownAsk: 'Take down {title}? Press again to take it down.',
  fridgeKeepAll: 'Keep them all',
  fridgeNotKept: 'Okay! Everything stays where it is.',
  itemTitle: '{holiday} story',
  itemTitleWith: '{holiday} story with {friend}',
  print: 'Print a little book',
  printHow: 'Print, cut along the dotted lines, stack the pages in order and staple the left edge.',
  readAgain: 'Read it again',
  swipeHint: 'Swipe or use the arrow keys to turn the page',
  printPage: 'Page {n}',
  printMadeBy: 'A Jubilee story made by {who}',
} as const;

export function fill(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
