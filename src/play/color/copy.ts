/**
 * copy.ts — every Coloring string (kept here, not in ui/copy.ts, so the activity is one folder).
 * Plain words a five-year-old can follow. Nothing judges the picture, nothing says "wrong", and
 * nothing pretends the picture was sent anywhere: it goes on the Fridge, on this device.
 */
export const COPY = {
  title: 'Coloring',
  pickTitle: 'Pick one of {n} pages',
  pickOne: 'Coloring page {n} of {total}',
  pickStarted: 'Started',
  holidayGlitter: '{holiday} glitter',
  drawerHoliday: 'Holiday', drawerBasics: 'Basics', drawerMixed: 'Mixed', drawerBlends: 'Blends',
  drawerGlitter: 'Glitter', drawerShiny: 'Shiny', drawerPatterns: 'Patterns',
  emoji: '🖍️',
  blurb: 'Tap a shape to fill it with your crayon',
  sub: 'My {holiday} picture',
  close: 'Back to {holiday}',
  page: '{holiday} coloring page. Tab to a shape, Enter fills it.',
  regionBlank: '{name}, not colored yet',
  regionFilled: '{name}, {color}',
  crayonBox: 'Crayons',
  crayonsHint: 'Pick a crayon. The [ and ] keys change crayon too.',
  themeCrayon: '{holiday} {color}',
  magicGlow: 'Magic glow',
  magicSwirl: 'Magic swirl',
  eraser: 'Eraser',
  eraserLabel: 'Eraser: rub a shape back to white',
  picked: '{color} crayon',
  pickedEraser: 'Eraser',
  filled: '{name} is {color} now',
  erased: '{name} is white again',
  undo: 'Undo',
  redo: 'Redo',
  undone: 'Undone',
  redone: 'Redone',
  surprise: 'Surprise!',
  surpriseLabel: 'Surprise me: color everything with a happy mix',
  surprised: 'Ta-da! A surprise mix of colors. Undo brings your colors back.',
  done: 'Done!',
  doneLabel: 'Done: put my picture on the Fridge',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  zoomReset: 'Show the whole page',
  print: 'Print',
  printTitle: 'Print your page',
  printColors: 'With my colors',
  printBlank: 'Blank, for real crayons',
  printCancel: 'Not now',
  printCaption: 'My {holiday} coloring page',
  mine: 'My pictures',
  mineCount: 'My pictures ({n})',
  mineTitle: 'My {holiday} pictures',
  mineEmpty: 'Press Done and your picture goes here, on the Fridge.',
  mineOpen: 'Color more of picture {n}',
  mineNew: 'Start a fresh page',
  mineClose: 'Close',
  savedTitle: 'On the Fridge!',
  savedBody: 'Your picture is kept on this device. Come back any time to color more.',
  updatedTitle: 'Fridge picture updated!',
  keepGoing: 'Keep coloring',
  freshPage: 'Fresh page',
  backTo: 'Back to {holiday}',
  pretendTitle: 'Looking good!',
  pretendBody: 'We are pretending it is a different day, so pictures are not kept today.',
  fullTitle: 'The Fridge is full!',
  fullBody: 'Take one picture down to make room for this one.',
  takeDown: 'Take down',
  takeDownLabel: 'Take down {title}',
  welcomeBack: 'Welcome back! Your picture is just how you left it.',
  allDone: 'Every shape has color! Tap Done when you’re happy.',
  itemTitle: '{holiday} coloring',
  stamp: 'Done!',
  failed: 'This page is still being drawn. Try another game for now!',
} as const;

/** Fills `{name}` placeholders. */
export function fill(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** "star-2" → "star 2", "lantern_glass" → "lantern glass": the spoken name of a region id. */
export function regionName(id: string): string {
  return id.replace(/[-_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim().toLowerCase();
}
