/**
 * copy.ts — every Dress-up Jubi string (kept here, not in ui/copy.ts, so the activity is one folder).
 * Plain words a five-year-old can follow; nothing is locked, nothing is judged.
 */
import type { Slot } from './catalog';

export const COPY = {
  title: 'Dress up Jubi',
  emoji: '🎩',
  blurb: 'Hats, glasses and glow: give Jubi a holiday look',
  sub: 'Tap to try it on. Tap again to take it off.',
  close: 'Back to {holiday}',
  slots: {
    hat: 'Hats',
    glasses: 'Glasses',
    neck: 'Neck',
    held: 'Hold',
    glow: 'Glow',
    pattern: 'Pattern',
  } satisfies Record<Slot, string>,
  slotLabel: '{slot}: {worn}',
  nothing: 'nothing yet',
  drawer: '{slot} to try on',
  inSeason: 'for {holiday}',
  itemLabel: '{name}',
  itemSeason: '{name}, for {holiday}',
  dressFor: 'Dress for {holiday}',
  dressForToday: 'Dress for today: {holiday}',
  surprise: 'Surprise me',
  undress: 'Take it all off',
  picture: 'Take a picture',
  jubiLabel: 'Jubi. Tap to say hello.',
  sayWear: 'Jubi is wearing the {name}.',
  sayOff: 'Jubi took off the {name}.',
  sayDressed: 'Jubi is dressed for {holiday}!',
  saySurprise: 'Surprise! {outfit}.',
  sayUndress: 'Jubi took everything off.',
  sayKeys: 'Use the arrow keys to look through the {slot}, and Enter to try one on.',
  giggles: ['Hee hee!', 'That tickles!', 'Do I look fancy?', 'Ta-da!', 'Twinkle twinkle!', 'Again! Again!', 'I feel so shiny!'],
  undressLine: 'Just me, Jubi!',
  surpriseLines: ['Ooh, what a look!', 'Fancy!', 'Surprise!', 'Magic!'],
  cheese: 'Say cheese!',
  pictureTitle: 'Snap!',
  pictureCaption: '{who}, {date}',
  fridgeSaved: 'Stuck on the Fridge!',
  fridgeSavedSub: 'Your picture of Jubi is kept on this device.',
  fridgePretend: 'Pretend days don’t keep pictures',
  fridgePretendSub: 'You can still dress Jubi up as much as you like!',
  fridgeFull: 'The Fridge is full!',
  fridgeFullSub: 'Take one thing down to make room for this picture?',
  takeDown: 'Take down “{title}”',
  keepAll: 'Keep everything',
  keepDressing: 'Keep dressing',
  sayPicture: 'Snap! The picture of Jubi is on the Fridge.',
  sayPretend: 'Snap! Pretend days don’t keep pictures.',
  sayFull: 'The Fridge is full. Take something down to make room?',
} as const;

export function fill(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
