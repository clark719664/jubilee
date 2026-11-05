/**
 * skins.ts — one Wish Post engine, many holiday skins (pure data, no DOM, unit-tested).
 *
 *   santa   Christmas: a letter to Santa with picture wish-chips, a "kind by…" line, and a reply next morning
 *   lantern Lantern Festival, Mid-Autumn, Chuseok: a wish written on a paper lantern that rises
 *   diya    Diwali: a wish beside a little lamp whose light floats up into the sky
 *   jar     New Year's Eve/Day, Lunar New Year, Nowruz, Rosh Hashanah: a hope rolled up into a hopes jar
 *   leaf    Thanksgiving: a thank-you leaf that flutters onto a gratitude tree
 *   love    Valentine's, Mother's, Father's, Grandparents' Day: a love note folded into an envelope to give
 *   star    every other holiday (and custom days): a wish star that floats up to twinkle
 *
 * Only `santa` ever gets a reply from a figure. Faith holidays are simply released (respect rules).
 */
export type SkinId = 'santa' | 'lantern' | 'diya' | 'jar' | 'leaf' | 'love' | 'star';
export const SKIN_IDS: readonly SkinId[] = ['santa', 'lantern', 'diya', 'jar', 'leaf', 'love', 'star'];

const BY_HOLIDAY: Readonly<Record<string, SkinId>> = {
  christmas: 'santa',
  'lantern-festival': 'lantern',
  'mid-autumn-festival': 'lantern',
  chuseok: 'lantern',
  diwali: 'diya',
  'new-years-eve': 'jar',
  'new-years-day': 'jar',
  'lunar-new-year': 'jar',
  nowruz: 'jar',
  'rosh-hashanah': 'jar',
  thanksgiving: 'leaf',
  'valentines-day': 'love',
  'mothers-day': 'love',
  'mothers-day-fr': 'love',
  'fathers-day': 'love',
  'grandparents-day': 'love',
};

export function skinFor(holidayId: string): SkinId {
  return BY_HOLIDAY[holidayId] ?? 'star';
}

/** Only Santa writes back. */
export function hasReply(skin: SkinId): boolean {
  return skin === 'santa';
}

/** Small vector pictures drawn in chip-icons.ts (all on a 48×48 board). */
export type IconId =
  | 'bike' | 'books' | 'puppy' | 'kitten' | 'art' | 'blocks' | 'teddy' | 'ball' | 'robot' | 'dino' | 'doll' | 'guitar'
  | 'kite' | 'puzzle' | 'train' | 'rocket' | 'sled' | 'snow' | 'grandma' | 'dove' | 'home' | 'friends' | 'planet' | 'hug'
  | 'sun' | 'apple' | 'giggle' | 'pie' | 'rainbow' | 'flower';

export interface WishChip {
  readonly id: string;
  /** On the chip (short, picture-book words). */
  readonly label: string;
  /** Inside a sentence of the reply or the letter: "a shiny bike", "time with Grandma". */
  readonly phrase: string;
  readonly icon: IconId;
}

const c = (id: string, label: string, phrase: string, icon: IconId = id as IconId): WishChip => ({ id, label, phrase, icon });

/** Christmas: 24 kid wishes, things and not-things, so a child can wish for snow or peace as easily as a bike. */
export const SANTA_CHIPS: readonly WishChip[] = [
  c('bike', 'A bike', 'a bike'),
  c('books', 'Books', 'some new books'),
  c('puppy', 'A puppy', 'a puppy'),
  c('kitten', 'A kitten', 'a kitten'),
  c('art', 'Art set', 'an art set'),
  c('blocks', 'Building blocks', 'building blocks'),
  c('teddy', 'A teddy', 'a cuddly teddy'),
  c('ball', 'A ball', 'a bouncy ball'),
  c('robot', 'A robot', 'a robot'),
  c('dino', 'A dinosaur', 'a dinosaur'),
  c('doll', 'A doll', 'a doll'),
  c('guitar', 'Music', 'music to play'),
  c('kite', 'A kite', 'a kite'),
  c('puzzle', 'A puzzle', 'a puzzle'),
  c('train', 'A train set', 'a train set'),
  c('rocket', 'A rocket', 'a rocket'),
  c('sled', 'A sled', 'a sled'),
  c('snow', 'Snow!', 'snow'),
  c('grandma', 'Time with Grandma', 'time with Grandma'),
  c('peace', 'Peace', 'peace in the world', 'dove'),
  c('family', 'A happy family', 'a happy family', 'home'),
  c('friend', 'A new friend', 'a new friend', 'friends'),
  c('planet', 'A happy planet', 'a happy planet'),
  c('hugs', 'Lots of hugs', 'lots of hugs', 'hug'),
];

/** Hopes for lanterns, lamps, jars and stars: nothing to buy, everything to hope for. */
export const HOPE_CHIPS: readonly WishChip[] = [
  c('peace', 'Peace', 'peace', 'dove'),
  c('family', 'Happy family', 'a happy family', 'home'),
  c('friend', 'Good friends', 'good friends', 'friends'),
  c('health', 'Good health', 'good health', 'apple'),
  c('learn', 'Learn new things', 'learning new things', 'books'),
  c('planet', 'A happy planet', 'a happy planet'),
  c('pets', 'Happy pets', 'happy pets', 'puppy'),
  c('adventure', 'Adventures', 'big adventures', 'rocket'),
  c('kindness', 'Kindness', 'kindness everywhere', 'hug'),
  c('sunshine', 'Sunny days', 'sunny days', 'sun'),
  c('giggles', 'Giggles', 'lots of giggles', 'giggle'),
  c('rainbow', 'Good luck', 'good luck', 'rainbow'),
];

export const THANKS_CHIPS: readonly WishChip[] = [
  c('family', 'My family', 'my family', 'home'),
  c('friends', 'My friends', 'my friends', 'friends'),
  c('food', 'Yummy food', 'yummy food', 'pie'),
  c('pets', 'My pets', 'my pets', 'puppy'),
  c('teachers', 'My teachers', 'my teachers', 'books'),
  c('nature', 'Nature', 'nature', 'flower'),
  c('planet', 'Our planet', 'our planet', 'planet'),
  c('hugs', 'Hugs', 'hugs', 'hug'),
  c('sunshine', 'Sunshine', 'sunshine', 'sun'),
  c('music', 'Music', 'music', 'guitar'),
  c('giggles', 'Giggles', 'giggles', 'giggle'),
  c('health', 'Being healthy', 'being healthy', 'apple'),
];

export const LOVE_CHIPS: readonly WishChip[] = [
  c('hugs', 'Your hugs', 'your hugs', 'hug'),
  c('stories', 'Bedtime stories', 'bedtime stories', 'books'),
  c('cooking', 'Your cooking', 'your cooking', 'pie'),
  c('giggles', 'Making me laugh', 'how you make me laugh', 'giggle'),
  c('singing', 'Singing together', 'singing together', 'guitar'),
  c('outside', 'Playing outside', 'playing outside', 'kite'),
  c('games', 'Playing games', 'playing games', 'ball'),
  c('helping', 'Helping me', 'how you help me', 'puzzle'),
  c('home', 'Our home', 'our home', 'home'),
  c('sunshine', "You're my sunshine", 'that you are my sunshine', 'sun'),
  c('flowers', 'Flowers', 'flowers', 'flower'),
  c('building', 'Building things', 'building things', 'blocks'),
];

export interface Skin {
  readonly id: SkinId;
  /** h1 of the compose screen. */
  readonly title: string;
  /** The top of the paper ("Dear Santa,"). */
  readonly salutation: string;
  /** Above the chip tray. */
  readonly pickTitle: string;
  /** Inside the empty wish-list zone. */
  readonly listEmpty: string;
  /** Lead-in above the picked chips on the paper. */
  readonly listLead: string;
  readonly textLabel: string;
  readonly textPlaceholder: string;
  /** The "I've been kind by…" line (santa only). */
  readonly kindLabel?: string;
  /** "To:" quick picks for love notes (never free personal info). */
  readonly toPicks?: readonly string[];
  readonly signoff: string;
  readonly send: string;
  /** Big line after the flight. */
  readonly flewTitle: string;
  readonly flewSub: string;
  /** Collection screen ("Postbox", "My lanterns"…). */
  readonly keepTitle: string;
  readonly keepEmpty: string;
  readonly another: string;
  /** Fridge title of one item. */
  readonly itemTitle: string;
  /** The chip set. */
  readonly chips: readonly WishChip[];
  /** Max chips on one paper (the paper stays tidy). */
  readonly maxChips: number;
}

const SKINS: Readonly<Record<SkinId, Skin>> = {
  santa: {
    id: 'santa', title: 'Letter to Santa', salutation: 'Dear Santa,', pickTitle: 'Tap your wishes',
    listEmpty: 'Tap pictures to add wishes to your letter', listLead: 'This year I wish for…',
    textLabel: 'Anything else to tell Santa?', textPlaceholder: 'Hello Santa! I want to tell you…',
    kindLabel: "I've been kind by…", signoff: 'Love from', send: 'Fold & send',
    flewTitle: 'Whoosh! Off it flies!', flewSub: 'Your letter is flying to the North Pole. Peek in the postbox tomorrow morning!',
    keepTitle: 'My postbox', keepEmpty: 'No letters yet. Write one to Santa!', another: 'Write another letter',
    itemTitle: 'Letter to Santa', chips: SANTA_CHIPS, maxChips: 8,
  },
  lantern: {
    id: 'lantern', title: 'Wish lantern', salutation: 'My wish', pickTitle: 'Pick wishes for your lantern',
    listEmpty: 'Tap pictures to paint them on your lantern', listLead: 'I wish for…',
    textLabel: 'Write your wish', textPlaceholder: 'I wish…', signoff: 'Wished by', send: 'Light it up',
    flewTitle: 'Up, up it floats!', flewSub: 'Your lantern is drifting up to the moon and stars.',
    keepTitle: 'My lantern sky', keepEmpty: 'No lanterns yet. Light the first one!', another: 'Make another lantern',
    itemTitle: 'Wish lantern', chips: HOPE_CHIPS, maxChips: 4,
  },
  diya: {
    id: 'diya', title: 'Wish lamp', salutation: 'My wish', pickTitle: 'Pick wishes for your lamp',
    listEmpty: 'Tap pictures to add your wishes', listLead: 'I wish for…',
    textLabel: 'Write your wish', textPlaceholder: 'I wish…', signoff: 'Wished by', send: 'Light the lamp',
    flewTitle: 'What a glow!', flewSub: 'Your wish floated up with the light, like a little star.',
    keepTitle: 'My wish lights', keepEmpty: 'No lamps lit yet. Light the first one!', another: 'Light another lamp',
    itemTitle: 'Wish lamp', chips: HOPE_CHIPS, maxChips: 4,
  },
  jar: {
    id: 'jar', title: 'Hopes jar', salutation: 'My hope for the new year', pickTitle: 'Pick your hopes',
    listEmpty: 'Tap pictures to add your hopes', listLead: 'This year I hope for…',
    textLabel: 'Write your hope', textPlaceholder: 'This year I hope…', signoff: 'Hoped by', send: 'Pop it in the jar',
    flewTitle: 'Plink! Into the jar!', flewSub: 'Your hope is rolled up safe in the jar, ready for the new year.',
    keepTitle: 'My hopes jar', keepEmpty: 'The jar is empty. Add your first hope!', another: 'Add another hope',
    itemTitle: 'Hope for the new year', chips: HOPE_CHIPS, maxChips: 4,
  },
  leaf: {
    id: 'leaf', title: 'Thank-you leaf', salutation: 'Thank you for', pickTitle: 'What are you thankful for?',
    listEmpty: 'Tap pictures to add your thank-yous', listLead: "I'm thankful for…",
    textLabel: 'Write your thank-you', textPlaceholder: "I'm thankful for…", signoff: 'From', send: 'Hang it on the tree',
    flewTitle: 'Flutter, flutter!', flewSub: 'Your leaf landed on the gratitude tree.',
    keepTitle: 'My gratitude tree', keepEmpty: 'The tree is waiting for its first leaf!', another: 'Add another leaf',
    itemTitle: 'Thank-you leaf', chips: THANKS_CHIPS, maxChips: 4,
  },
  love: {
    id: 'love', title: 'Love note', salutation: 'Dear', pickTitle: 'Things I love about you',
    listEmpty: 'Tap pictures to add what you love', listLead: 'I love…',
    textLabel: 'Write your note', textPlaceholder: 'You are the best because…', signoff: 'Love from', send: 'Fold it up',
    flewTitle: 'Ta-da! A love note!', flewSub: "It's folded and waiting on your Fridge. Print it and give it with a hug!",
    keepTitle: 'My love notes', keepEmpty: 'No notes yet. Write the first one!', another: 'Write another note',
    itemTitle: 'Love note', chips: LOVE_CHIPS, maxChips: 6,
    toPicks: [],
  },
  star: {
    id: 'star', title: 'Wish star', salutation: 'My wish', pickTitle: 'Pick wishes for your star',
    listEmpty: 'Tap pictures to add your wishes', listLead: 'I wish for…',
    textLabel: 'Write your wish', textPlaceholder: 'I wish…', signoff: 'Wished by', send: 'Send it to the sky',
    flewTitle: 'Twinkle, twinkle!', flewSub: 'Your wish star floated up to shine with the others.',
    keepTitle: 'My wish sky', keepEmpty: 'No stars yet. Make the first one!', another: 'Make another star',
    itemTitle: 'Wish star', chips: HOPE_CHIPS, maxChips: 4,
  },
};

/** Who a love note is for: quick picks only, chosen per holiday. */
const TO_PICKS: Readonly<Record<string, readonly string[]>> = {
  'valentines-day': ['My family', 'My friend', 'My teacher', 'Mom', 'Dad'],
  'mothers-day': ['Mom', 'Mum', 'Mama', 'Grandma'],
  'mothers-day-fr': ['Maman', 'Mum', 'Mamie'],
  'fathers-day': ['Dad', 'Papa', 'Grandpa'],
  'grandparents-day': ['Grandma', 'Grandpa', 'Nana', 'Grandad'],
};

export function skinOf(holidayId: string): Skin {
  const skin = SKINS[skinFor(holidayId)];
  if (skin.id !== 'love') return skin;
  return { ...skin, toPicks: TO_PICKS[holidayId] ?? TO_PICKS['valentines-day']! };
}

export function skinById(id: SkinId): Skin {
  return SKINS[id];
}

export function chipById(skin: Skin, id: string): WishChip | undefined {
  return skin.chips.find((x) => x.id === id);
}
