/** Kid-facing words for Countdown Doors (kept here, not in ui/copy.ts, per the play brief). */
import type { DoorKind } from '../../content/types';
import { plural } from '../../i18n/index';

export const COPY = {
  title: 'Countdown Doors',
  blurb: 'A little door to open every sleep',
  back: 'Back to {name}',
  countdown: '{n} sleeps until {name}!',
  countdownOne: 'ONE more sleep until {name}!',
  todayReady: 'Today’s door is ready. Tap it!',
  todayOpened: 'You opened today’s door. A new one opens tomorrow!',
  missedReady: 'Some doors are waiting for you to peek inside.',
  celebrating: 'It’s {name}! Every door is open.',
  after: 'We just celebrated {name}! Every door is still open.',
  farTitleOne: 'The first door opens tomorrow!',
  farLastTime: 'Doors with a star are the ones you opened last time. You can peek again!',
  beyond: 'My calendar for this holiday ends in 2035.',
  notYetOne: 'Not yet! 1 more sleep',
  shut: 'This door is shut for now.',
  doorN: 'Door {n}',
  doorLabel: 'Door {n}',
  labelLockedOne: 'Door {n}, opens tomorrow',
  labelToday: 'Door {n}, today’s door! Open it',
  labelReady: 'Door {n}, ready to open',
  labelOpened: 'Door {n}, open: {kind}',
  labelStar: 'Door {n}, you opened it last time: {kind}',
  today: 'Today!',
  boardLabel: '{name} countdown doors',
  tellMe: 'Tell me!',
  playSeek: 'Let’s play Seek & Find',
  playColor: 'Let’s color it in',
  stillPainting: 'Jubi is still painting this one. Peek again soon!',
  craftNote: 'Ask a grown-up to help you get things ready.',
  backToDoors: 'Back to the doors',
  closeCard: 'Close',
  stripTitle: 'Countdown Doors',
  stripToday: 'Today’s door',
  stripNext: 'Next door',
  stripTomorrow: 'Tomorrow',
  stripAllOpen: 'Every door is open! Come and peek inside.',
  stripOpenAll: 'See all the doors',
  jubi: 'Jubi the star lantern. Tap for a spin!',
} as const;

export const KIND_EMOJI: Readonly<Record<DoorKind, string>> = { fact: '💡', joke: '😂', craft: '✂️', say: '💬', seek: '🔍', color: '🖍️' };
export const KIND_TITLE: Readonly<Record<DoorKind, string>> = {
  fact: 'A fun fact!', joke: 'A joke!', craft: 'A tiny craft', say: 'Say it!', seek: 'Seek & Find', color: 'Coloring time',
};
export const KIND_NAME: Readonly<Record<DoorKind, string>> = {
  fact: 'a fact', joke: 'a joke', craft: 'a tiny craft', say: 'a greeting to say', seek: 'a Seek & Find game', color: 'a coloring page',
};

/** "{n} sleeps" → "3 sleeps". Unknown keys stay as they are. */
export function fill(template: string, vars: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Counts of sleeps and doors; plural() picks the grammatical form for the reader's language. */
export const COUNTS = {
  countdown: { one: '{n} sleep until {name}!', other: '{n} sleeps until {name}!' },
  farTitle: { one: 'The first door opens in {n} sleep', other: 'The first door opens in {n} sleeps' },
  farSub: { one: '{name} is {n} sleep away. The doors are waiting!', other: '{name} is {n} sleeps away. The doors are waiting!' },
  notYet: { one: 'Not yet! {n} more sleep', other: 'Not yet! {n} more sleeps' },
  labelLocked: { one: 'Door {door}, opens in {n} sleep', other: 'Door {door}, opens in {n} sleeps' },
  stripInN: { one: 'In {n} sleep', other: 'In {n} sleeps' },
  stripFirst: { one: 'The first door opens in {n} sleep', other: 'The first door opens in {n} sleeps' },
  garland: { one: 'You’ve peeked inside {k} of {n} door', other: 'You’ve peeked inside {k} of {n} doors' },
  garlandNone: { one: '{n} door waiting for you', other: '{n} doors waiting for you' },
} as const;

export function notYetText(wait: number): string {
  return plural(wait, COUNTS.notYet);
}
