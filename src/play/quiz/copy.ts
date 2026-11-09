/**
 * copy.ts — every "Where in the World?" string, kept in the activity's folder. Plain words a
 * seven-year-old can read; nothing says "wrong", nothing is scored. A tap on the wrong country is a
 * chance to visit another place: "That's Brazil! Here's Mexico."
 */
export const COPY = {
  title: 'Where in the World?',
  emoji: '🧭',
  blurb: 'Spin the globe and find where people celebrate',
  close: 'Back to {holiday}',
  pick: 'Spin the globe, tap the country. Five questions, no hurry!',
  scopeHoliday: '{holiday} questions',
  scopeHolidaySub: 'All about {holiday}',
  scopeAll: 'Everything mix',
  scopeAllSub: 'Holidays from all over the world',
  loading: 'Packing the suitcase…',
  progress: 'Question {n} of {total}',
  // globe
  hostLabel: 'Globe. Drag to spin it and tap a country. With the keyboard, arrow keys spin it and Enter picks the country in the middle.',
  spinHint: 'Drag to spin, then tap a country',
  middle: 'In the middle: {name}',
  middleSea: 'In the middle: the sea',
  middleNone: 'Spin with the arrow keys',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  list: 'Choose from a list',
  listTitle: 'Which one is it?',
  listBack: 'Back to the globe',
  sea: "That's the sea! Try tapping on land.",
  pinsOnly: 'Tap one of the two pins: {a} or {b}.',
  spinTo: 'Spinning to {name}',
  // answers
  cheers: ['Yes!', 'You found it!', 'Awesome!', 'Spot on!', 'Hooray!', 'Great spotting!'],
  rightPlace: '{cheer} {Country}!',
  anyPlace: '{cheer} {Country} joins in too!',
  otherPlace: "That's {Country}. Here's {answer}!",
  otherPlaceMany: "That's {Country}. Here are the places, all lit up!",
  next: 'Next question',
  finish: 'See my trip',
  // time
  newYear: 'New Year travels around the world! Who says “Happy New Year” first: {a} or {b}?',
  newYearReveal: '{first} gets to midnight {hours} before {second}. New Year starts near the Pacific Ocean and travels west.',
  night: "Right now it's night-time in one of these places. Which one: {a} or {b}?",
  nightReveal: "It's {nightTime} in {night} and {dayTime} in {day}. The dark part of the map is where it's night.",
  // fact cards
  factAsk: 'True or silly?',
  factTrue: 'True!',
  factSilly: 'Silly!',
  factTrueYes: "Yes, it's true!",
  factTrueNo: "It sounds silly, but it's true!",
  factSillyYes: "Yes, that one's silly!",
  factSillyNo: 'Jubi made that one up!',
  factFrom: 'A {holiday} fact',
  factSillyFrom: 'A Jubi joke',
  cardLabel: 'Fact card. {text}',
  // greetings
  greetAsk: 'Which holiday do people say this on?',
  greetYes: '{cheer} People say it on {holiday}.',
  greetShow: 'People say it on {holiday}!',
  greetMeans: 'It means “{meaning}”.',
  greetLang: 'in {lang}',
  // done
  doneTitle: 'What a trip!',
  doneName: 'What a trip, {name}!',
  doneSub0: 'You answered all five questions!',
  stamps: 'Your passport stamps',
  again: 'Play again',
  // announcements
  sayQuestion: 'Question {n} of {total}. {prompt}',
  sayMiddle: '{name} is in the middle.',
} as const;

export function fill(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
