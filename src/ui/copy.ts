/**
 * Every piece of microcopy in Jubilee, keyed so a Spanish UI can come later.
 * Strings are kid-level, present tense, never contain URLs, and never shame
 * (no streaks lost, no "locked", no red badges).
 *
 * Use `fmt(key, vars)` for strings with {placeholders} and `COPY[key]` or
 * `fmt(key)` for plain ones. Section-specific label maps live below.
 */
import type { Route } from '../app/router';
import type { BadgeId } from '../app/state';
import type { AdultHelp, Allergen, Hazard } from '../content/types';

export const COPY = {
  // ── sleeps counter milestones (§9.1) ──
  'milestone.100': "A hundred sleeps! That's a lot of pancakes.",
  'milestone.50': 'Halfway-ish!',
  'milestone.10': 'Ten sleeps. Start the wiggles.',
  'milestone.3': 'THREE. Deep breaths.',
  'milestone.1': 'ONE MORE SLEEP!!!',
  'milestone.0': "IT'S TODAY!",
  tonight: 'Tonight at sundown!',
  dayOf: 'Day {day} of {of}',
  nightOf: 'Night {night} of {of}',
  lastDay: 'Last day of {name}',
  sleepsUntil: '{sleeps} until {name}',
  sleepsOne: 'sleep',
  sleepsMany: 'sleeps',
  moonsMore: '+{n}',
  // ── tiles, ribbons, dates ──
  justCelebrated: 'we just celebrated!',
  nextIn: 'next in {year}',
  inSleeps: 'in {sleeps}',
  beyondCoverage: 'My calendar for this holiday ends in 2035',
  expected: 'expected — depends on the new moon',
  expectedLong: 'Expected — the exact day depends on the sighting of the new moon where you live.',
  altDay: 'some calendars say {date}',
  pretend: "Pretending it's {date}",
  pretendBack: 'Back to today',
  pretendNoSave: "Stickers and settings aren't saved while pretending.",
  dayOff: 'Day off: {date}',
  'ribbon.today': 'Today is {name}!',
  'ribbon.tonight': 'Tonight {name} begins!',
  stackedToday: 'Today is {a}… and tonight {b} begins!',
  happeningNow: 'Happening now',
  afterThat: 'After that…',
  peekInside: 'Peek inside',
  seeWhatsNext: 'See what’s next',
  howWeKnowRule: 'We work this date out with a rule: {rule}.',
  howWeKnowTable: 'This date comes from a calendar table ({source}).',
  // ── greetings ──
  meaning: 'It means “{meaning}”',
  hearIt: 'Hear it',
  // ── stickers & badges ──
  seeYouNextYear: 'see you next year',
  youWereHere: 'You were here on {name} {year}',
  stickerEarned: 'You earned a sticker: {label}!',
  badgeEarned: 'New badge: {name}!',
  stickerCount: '{have} of {total} this year',
  rare: 'this one is rare!',
  // ── recipes & crafts ──
  noAllergens: 'No major allergens',
  checkLabels: 'Always check your own labels.',
  mayContain: 'May contain {list}',
  swap: 'No {avoid}? Use {use}',
  grownUpNeeded: 'Grown-up needed',
  grownUpSome: 'A grown-up helps a bit',
  kidsCanDoIt: 'Kids can do it',
  noHeat: 'No heat',
  tasteTest: 'Taste test!',
  done: 'Done!',
  iMadeIt: 'I made it!',
  stepOf: 'Step {n} of {of}',
  timerDone: 'Ding! Time’s up',
  serves: 'Serves {n}',
  takes: 'Takes {time}',
  mess: 'Mess: {level}',
  printRecipe: 'Print',
  unitsUs: 'Cups',
  unitsMetric: 'Grams',
  // ── advent & gags ──
  notYet: 'Not yet! {n} more sleeps',
  justKidding: 'just kidding',
  adventDoor: 'Door {day}',
  // ── celebration ──
  itsToday: "IT'S TODAY!",
  happyNewYear: 'Happy New Year{name}!',
  // ── first launch ──
  whatShouldWeCallYou: 'What should we call you?',
  nameSave: 'That’s me',
  nameSkip: 'Skip',
  // ── shell ──
  skipToContent: 'Skip to content',
  forGrownUps: 'For grown-ups',
  sparkle: 'Sparkle',
  back: 'Back',
  close: 'Close',
  // ── world ──
  'world.title': 'Around the world',
  'world.celebratedIn': 'Celebrated in {n} places',
  'world.trackers': 'Trackers',
  'world.santa': 'Santa tracker',
  'world.newYear': 'New Year around the world',
  'world.flat': 'Flat map',
  'world.globe': 'Globe',
  // ── grown-ups ──
  'grownups.name': 'Child’s name',
  'grownups.region': 'Where we celebrate',
  'grownups.motion': 'Moving skies',
  'grownups.units': 'Recipe measurements',
  'grownups.everywhere': 'Count down to holidays from everywhere',
  'grownups.scheme': 'Colours',
  'grownups.custom': 'Birthdays and our own days',
  'grownups.store': 'What we store on this device',
  'grownups.storeNone': 'Nothing yet.',
  'grownups.storageOff': 'This browser can’t save, so everything resets when you close the page.',
  'grownups.dates': 'How we know',
  'grownups.datesText': 'Most holidays follow a rule we can compute (a fixed date, the fourth Thursday, Easter plus a number of days). Holidays that follow the moon or the stars come from calendar tables we checked by hand and cover 2024 to 2035. Dates are the civil dates in the holiday’s home region, shown in your device’s local day.',
  'grownups.reset': 'Reset everything',
  'grownups.resetConfirm': 'This forgets the name, settings, stickers and badges on this device. Are you sure?',
  'grownups.resetDone': 'All clear. Fresh start!',
  'grownups.addCustom': 'Add a day',
  'grownups.remove': 'Remove',
  // ── empty states ──
  'parade.all': 'All',
  'parade.mine': 'My holidays',
  'empty.parade': 'No holidays match that. Try another chip!',
  'empty.stickers': 'No stickers yet. Come back on a holiday and one peels onto the shelf.',
  'empty.custom': 'No birthdays or custom days yet.',
  'empty.year': 'The calendar for moon-based holidays ends in 2035.',
  // ── errors ──
  'error.title': "Jubilee couldn't start",
  'error.body': 'Try reloading the page. If it keeps happening, this message helps a grown-up fix it:',
  'error.holiday': 'We can’t find that holiday. Here are all of them instead.',
  'error.load.title': 'Oops, this page tripped over its shoelaces',
  'error.load.body': 'It didn’t load. Check the internet connection and try again.',
} as const;

export type CopyKey = keyof typeof COPY;

/** Fills {placeholders}; unknown placeholders are left as-is so a typo is visible, not blank. */
export function fmt(key: CopyKey, vars: Record<string, string | number> = {}): string {
  return COPY[key].replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** Milestone copy for a sleeps count, or null when the number is not a milestone. */
export function milestoneCopy(sleeps: number): string | null {
  switch (sleeps) {
    case 100: return COPY['milestone.100'];
    case 50: return COPY['milestone.50'];
    case 10: return COPY['milestone.10'];
    case 3: return COPY['milestone.3'];
    case 1: return COPY['milestone.1'];
    case 0: return COPY['milestone.0'];
    default: return null;
  }
}

// ───────────────────────────────────────────────────────── views & tabs

export const VIEW_NAMES: Record<Route['view'], string> = {
  home: 'Next up',
  parade: 'All holidays',
  holiday: 'Holiday',
  recipe: 'Step mode',
  year: 'Year',
  stickers: 'Sticker book',
  grownups: 'For grown-ups',
  world: 'World',
  play: 'Play',
};

export type TabId = 'next' | 'all' | 'world' | 'year' | 'stickers';

export const TAB_LABELS: Record<TabId, string> = { next: 'Next', all: 'All', world: 'World', year: 'Year', stickers: 'Stickers' };

export const SECTION_LABELS = {
  story: 'Story', make: 'Make', craft: 'Craft', facts: 'Facts', say: 'Say it', dates: 'Dates', sticker: 'Sticker',
} as const;

export const SORT_LABELS = { soon: 'Soonest', az: 'A–Z', month: 'By month' } as const;

export const SEASON_LABELS = { winter: 'Winter', spring: 'Spring', summer: 'Summer', autumn: 'Autumn' } as const;

// ───────────────────────────────────────────────────────── badges

export interface BadgeCopy { readonly name: string; readonly emoji: string; readonly description: string }

export const BADGES: Record<BadgeId, BadgeCopy> = {
  'early-bird': { name: 'Early Bird', emoji: '🐦', description: 'Opened Jubilee on 5 different days' },
  'world-traveler': { name: 'World Traveler', emoji: '🌍', description: 'Visited 10 holidays from 5 different traditions' },
  'little-chef': { name: 'Little Chef', emoji: '👩‍🍳', description: 'Finished 3 recipes' },
  'fact-finder': { name: 'Fact Finder', emoji: '🔎', description: 'Flipped 25 fact cards' },
  'first-footer': { name: 'First Footer', emoji: '🥾', description: 'Opened Jubilee on New Year’s Day' },
};

// ───────────────────────────────────────────────────────── allergens & hazards

export const ALLERGEN_NAMES: Record<Allergen, string> = {
  milk: 'milk', egg: 'egg', wheat: 'wheat', gluten: 'gluten', peanut: 'peanuts', 'tree-nut': 'tree nuts',
  soy: 'soy', sesame: 'sesame', fish: 'fish', shellfish: 'shellfish',
};

export const HAZARD_NAMES: Record<Hazard, string> = {
  heat: 'hot oven or stove', sharp: 'sharp knife', 'hot-liquid': 'hot liquid', electric: 'blender or mixer',
  'small-parts': 'small parts', 'hot-glue': 'hot glue', 'raw-egg': 'raw egg', choking: 'choking risk', candle: 'candle',
};

export const ADULT_HELP_LABELS: Record<AdultHelp, string> = {
  none: COPY.kidsCanDoIt, some: COPY.grownUpSome, needed: COPY.grownUpNeeded,
};

export const MESS_LABELS: Record<1 | 2 | 3, string> = { 1: 'tidy', 2: 'a bit messy', 3: 'very messy' };
export const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = { 1: 'easy peasy', 2: 'a little tricky', 3: 'big-kid level' };

/** "milk, wheat and gluten" */
export function listJoin(items: readonly string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * The line under a recipe's allergen chips: "May contain peanuts" when there is a trace warning, the positive
 * "No major allergens" when there are no chips at all, and nothing when the chips already say it.
 */
export function allergenNote(allergens: readonly Allergen[], mayContain: readonly Allergen[] = []): string | null {
  if (mayContain.length > 0) return fmt('mayContain', { list: listJoin(mayContain.map((a) => ALLERGEN_NAMES[a])) });
  return allergens.length === 0 ? COPY.noAllergens : null;
}

/** "Grown-up step: hot oven or stove and sharp knife" / "Careful: small parts". */
export function hazardSentence(hazards: readonly Hazard[], adult = false): string {
  const names = listJoin(hazards.map((hz) => HAZARD_NAMES[hz]));
  if (adult && names) return `Grown-up step: ${names}`;
  if (adult) return 'Grown-up step';
  return names ? `Careful: ${names}` : '';
}
