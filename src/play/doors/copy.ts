/** Kid-facing words for Countdown Doors (kept here, not in ui/copy.ts, per the play brief). */
import type { DoorKind } from '../../content/types';

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
  farTitle: 'The first door opens in {n} sleeps',
  farTitleOne: 'The first door opens tomorrow!',
  farSub: '{name} is {m} sleeps away. The doors are waiting!',
  farLastTime: 'Doors with a star are the ones you opened last time. You can peek again!',
  beyond: 'My calendar for this holiday ends in 2035.',
  notYet: 'Not yet! {n} more sleeps',
  notYetOne: 'Not yet! 1 more sleep',
  shut: 'This door is shut for now.',
  doorN: 'Door {n}',
  doorLabel: 'Door {n}',
  labelLocked: 'Door {n}, opens in {w} sleeps',
  labelLockedOne: 'Door {n}, opens tomorrow',
  labelToday: 'Door {n}, today’s door! Open it',
  labelReady: 'Door {n}, ready to open',
  labelOpened: 'Door {n}, open: {kind}',
  labelStar: 'Door {n}, you opened it last time: {kind}',
  today: 'Today!',
  garland: 'You’ve peeked inside {k} of {t} doors',
  garlandNone: '{t} doors waiting for you',
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
  stripInN: 'In {n} sleeps',
  stripAllOpen: 'Every door is open! Come and peek inside.',
  stripFirst: 'The first door opens in {n} sleeps',
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

export function notYetText(wait: number): string {
  return wait === 1 ? COPY.notYetOne : fill(COPY.notYet, { n: wait });
}
