/**
 * copy.ts — every Colour-in string (kept here, not in ui/copy.ts, so the activity is one folder).
 * Plain words a five-year-old can follow. Nothing judges the picture, nothing says "wrong", and
 * nothing pretends the picture was sent anywhere: it goes on the Fridge, on this device.
 */
export const COPY = {
  title: 'Colour-in',
  emoji: '🖍️',
  blurb: 'Tap a shape to fill it with your crayon',
  sub: 'My {holiday} picture',
  close: 'Back to {holiday}',
  page: '{holiday} colouring page. Tab to a shape, Enter fills it.',
  regionBlank: '{name}, not coloured yet',
  regionFilled: '{name}, {colour}',
  crayonBox: 'Crayons',
  crayonsHint: 'Pick a crayon. The [ and ] keys change crayon too.',
  themeCrayon: '{holiday} {colour}',
  magicGlow: 'Magic glow',
  magicSwirl: 'Magic swirl',
  eraser: 'Eraser',
  eraserLabel: 'Eraser: rub a shape back to white',
  picked: '{colour} crayon',
  pickedEraser: 'Eraser',
  filled: '{name} is {colour} now',
  erased: '{name} is white again',
  undo: 'Undo',
  redo: 'Redo',
  undone: 'Undone',
  redone: 'Redone',
  surprise: 'Surprise!',
  surpriseLabel: 'Surprise me: colour everything with a happy mix',
  surprised: 'Ta-da! A surprise mix of colours. Undo brings your colours back.',
  done: 'Done!',
  doneLabel: 'Done: put my picture on the Fridge',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  zoomReset: 'Show the whole page',
  print: 'Print',
  printTitle: 'Print your page',
  printColours: 'With my colours',
  printBlank: 'Blank, for real crayons',
  printCancel: 'Not now',
  printCaption: 'My {holiday} colouring page',
  mine: 'My pictures',
  mineCount: 'My pictures ({n})',
  mineTitle: 'My {holiday} pictures',
  mineEmpty: 'Press Done and your picture goes here, on the Fridge.',
  mineOpen: 'Colour more of picture {n}',
  mineNew: 'Start a fresh page',
  mineClose: 'Close',
  savedTitle: 'On the Fridge!',
  savedBody: 'Your picture is kept on this device. Come back any time to colour more.',
  updatedTitle: 'Fridge picture updated!',
  keepGoing: 'Keep colouring',
  freshPage: 'Fresh page',
  backTo: 'Back to {holiday}',
  pretendTitle: 'Looking good!',
  pretendBody: 'We are pretending it is a different day, so pictures are not kept today.',
  fullTitle: 'The Fridge is full!',
  fullBody: 'Take one picture down to make room for this one.',
  takeDown: 'Take down',
  takeDownLabel: 'Take down {title}',
  welcomeBack: 'Welcome back! Your picture is just how you left it.',
  allDone: 'Every shape has colour! Tap Done when you’re happy.',
  itemTitle: '{holiday} colouring',
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
