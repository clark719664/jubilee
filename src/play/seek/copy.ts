/** Seek & Find's kid-facing words (kept here, not in ui/copy.ts). `{name}` slots are filled by `say`. */
export const COPY = {
  title: 'Seek & Find',
  blurb: 'Spot the hidden things in the picture!',
  back: 'Back to {holiday}',
  count: '{n} of {total} found',
  findHeading: 'Can you find…',
  stage: 'The {holiday} picture. Drag to look around, pinch or press plus and minus to zoom, and tap the things you spot. Keyboard: arrow keys move the ring, Enter picks what is in it.',
  coach: 'Drag to look around. Pinch to zoom!',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  hint: 'Hint',
  hintSay: 'It is somewhere in the glow!',
  card: 'Find the {thing}',
  cardFound: '{thing}: found!',
  lookFor: 'Look for the {thing}!',
  found: 'You found the {thing}!',
  left: '{n} more to find.',
  leftOne: 'Just one more to find!',
  already: 'You already found the {thing}. Great memory!',
  done: 'You found them all!',
  doneBody: 'Every hidden thing in the {holiday} picture. What a super seeker!',
  again: 'Play again',
  admire: 'Look at the picture',
  ribbon: 'Found them all before! Can you do it again?',
  stampWord: 'Found!',
  painting: 'The {holiday} picture is still being painted. Come back soon to spot its secrets!',
} as const;

export const CHEERS = ['Great spotting!', 'Eagle eyes!', 'You found it!', 'Super seeker!', 'Sharp eyes!', 'Awesome!', 'Woo-hoo!'] as const;

export type CopyKey = keyof typeof COPY;

export function say(key: CopyKey, vars: Record<string, string | number> = {}): string {
  return COPY[key].replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

/** "a sleepy cat" → "sleepy cat" so sentences can say "the sleepy cat". */
export function thing(label: string): string {
  return label.trim().replace(/^(a|an|the|some)\s+/i, '');
}

/** "sleepy cat" → "Sleepy cat" for card labels. */
export function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
