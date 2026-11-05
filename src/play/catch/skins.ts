/**
 * skins.ts — the holiday skins for Catch & Stack. One engine, many holidays: a skin is pure data
 * (basket, falling items, the golden special, the sleepy "oops" things, the stack piece and its
 * colours, and the words we cheer with). `skinFor(meta, theme)` merges a hand-made entry from
 * `SKINS` over a default built from the holiday's theme and its effect, so every holiday — including
 * silly days, which fall back to their effect glyphs — gets a playable, on-theme game.
 *
 * Respect (ART_BRIEF): no sacred objects fall or get caught (no diyas, menorahs, kinara candles,
 * crescents or scripture); we catch food, flowers, coins, lanterns, leaves and weather instead.
 */
import type { HolidayMeta } from '../../content/types';
import type { Theme } from '../../theme/themes';

export type BasketKind = 'basket' | 'sleigh' | 'pail' | 'pouch' | 'bowl';
export type PieceKind = 'present' | 'mooncake' | 'latke' | 'book' | 'pie' | 'cake' | 'bar' | 'pancake' | 'macaron';

export interface ItemDef {
  /** A painter name (effects PAINTERS or this activity's ITEM_PAINTERS) or `glyph:<emoji>`. */
  readonly sprite: string;
  readonly color: string;
  /** Size multiplier, default 1. */
  readonly scale?: number;
}

export interface Skin {
  readonly basket: BasketKind;
  readonly basketColor: string;
  readonly items: readonly ItemDef[];
  readonly special: ItemDef;
  readonly oops: readonly ItemDef[];
  readonly piece: PieceKind;
  readonly pieceColors: readonly string[];
  /** "snowflakes and presents" — used in "You caught 23 snowflakes and presents!" */
  readonly catchNoun: string;
  /** Plural: "presents" — "Your tower is 9 presents tall!" */
  readonly stackNoun: string;
  /** Ground colour under the basket and the tower. */
  readonly ground: string;
  /** Holiday-flavoured cheer for milestones: "Snow-tastic!" */
  readonly cheer: string;
}

/** Stack piece proportions (height ÷ width at the default width). */
export const PIECE_ASPECT: Readonly<Record<PieceKind, number>> = {
  present: 0.55, mooncake: 0.36, latke: 0.24, book: 0.22, pie: 0.3, cake: 0.42, bar: 0.26, pancake: 0.17, macaron: 0.38,
};

const SLEEPY: readonly ItemDef[] = [
  { sprite: 'sleepyCloud', color: '#f4f6ff', scale: 1.25 },
  { sprite: 'pebble', color: '#9aa3b5', scale: 0.85 },
];

const g = (emoji: string, scale = 1): ItemDef => ({ sprite: `glyph:${emoji}`, color: '#ffffff', scale });
const GOLD = '#ffd166';

/** Hand-made skins by holiday id; anything missing comes from `defaultSkin`. */
export const SKINS: Readonly<Record<string, Partial<Skin>>> = {
  christmas: {
    basket: 'sleigh', basketColor: '#e63946',
    items: [
      { sprite: 'snowflake', color: '#eaf6ff' }, { sprite: 'present', color: '#ff4d5e' },
      { sprite: 'present', color: '#2a9d8f' }, { sprite: 'candyCane', color: '#e63946' }, { sprite: 'snowflake', color: '#cfe8ff', scale: 0.8 },
    ],
    special: { sprite: 'goldStar', color: GOLD, scale: 1.15 },
    piece: 'present', pieceColors: ['#e63946', '#2a9d8f', '#ffd166', '#5b8def', '#ff8fb8'],
    catchNoun: 'snowflakes and presents', stackNoun: 'presents', ground: '#f4fbff', cheer: 'Snow-tastic!',
  },
  'st-nicholas-day': {
    basket: 'sleigh', basketColor: '#c8102e',
    items: [{ sprite: 'coin', color: GOLD }, { sprite: 'tangerine', color: '#ff8c1a' }, { sprite: 'candyCane', color: '#e63946' }, { sprite: 'snowflake', color: '#eaf6ff' }],
    piece: 'present', pieceColors: ['#c8102e', '#ffd166', '#2a9d8f'],
    catchNoun: 'treats', stackNoun: 'presents', ground: '#f4fbff', cheer: 'Boots full!',
  },
  'boxing-day': {
    basket: 'sleigh', basketColor: '#2a9d8f',
    items: [{ sprite: 'present', color: '#ff4d5e' }, { sprite: 'present', color: '#5b8def' }, { sprite: 'snowflake', color: '#eaf6ff' }],
    piece: 'present', pieceColors: ['#e63946', '#2a9d8f', '#ffd166'],
    catchNoun: 'presents', stackNoun: 'boxes', ground: '#f4fbff', cheer: 'Box-tastic!',
  },
  hanukkah: {
    basket: 'basket', basketColor: '#5b8def',
    items: [{ sprite: 'coin', color: GOLD }, { sprite: 'dreidel', color: '#cfd8ff' }, { sprite: 'sufganiyah', color: '#e63946' }, { sprite: 'coin', color: '#e9ecef', scale: 0.85 }],
    special: { sprite: 'coin', color: '#ffc43d', scale: 1.35 },
    piece: 'latke', pieceColors: ['#e0a040', '#d4932f', '#eab05a'],
    catchNoun: 'gelt and doughnuts', stackNoun: 'latkes', ground: '#16327f', cheer: 'Gelt-tastic!',
  },
  diwali: {
    basket: 'bowl', basketColor: '#ffb703',
    items: [{ sprite: 'laddoo', color: '#ffa62b' }, { sprite: 'barfi', color: '#f6e7c8' }, { sprite: 'marigold', color: '#ff9f1c' }, { sprite: 'laddoo', color: '#ffcf56', scale: 0.85 }],
    piece: 'present', pieceColors: ['#ff4d9d', '#ffb703', '#7b2cbf', '#2a9d8f'],
    catchNoun: 'sweets and marigolds', stackNoun: 'sweet boxes', ground: '#3a0b49', cheer: 'Sweet as laddoo!',
  },
  'eid-al-fitr': {
    basket: 'basket', basketColor: '#2a9d8f',
    items: [{ sprite: 'date', color: '#8b4a1c' }, { sprite: 'maamoul', color: '#f0d29b' }, { sprite: 'fanous', color: GOLD }, { sprite: 'star8', color: '#9be7d3', scale: 0.8 }],
    piece: 'present', pieceColors: ['#2a9d8f', '#ffd166', '#9be7d3', '#ff8fb8'],
    catchNoun: 'dates and sweets', stackNoun: 'gift boxes', ground: '#0a4a45', cheer: 'Sweet Eid!',
  },
  'eid-al-adha': {
    basket: 'basket', basketColor: '#2a9d8f',
    items: [{ sprite: 'date', color: '#8b4a1c' }, { sprite: 'maamoul', color: '#f0d29b' }, { sprite: 'fanous', color: GOLD }],
    piece: 'present', pieceColors: ['#2a9d8f', '#ffd166', '#9be7d3'],
    catchNoun: 'dates and sweets', stackNoun: 'gift boxes', ground: '#0a4a45', cheer: 'Eid Mubarak!',
  },
  ramadan: {
    basket: 'basket', basketColor: '#0e7490',
    items: [{ sprite: 'date', color: '#8b4a1c' }, { sprite: 'fanous', color: GOLD }, { sprite: 'star8', color: '#9be7d3', scale: 0.8 }],
    piece: 'present', pieceColors: ['#0e7490', '#ffd166', '#9be7d3'],
    catchNoun: 'dates and lanterns', stackNoun: 'gift boxes', ground: '#04202f', cheer: 'Lantern-tastic!',
  },
  'lunar-new-year': {
    basket: 'pouch', basketColor: '#e63946',
    items: [{ sprite: 'envelope', color: '#e63946' }, { sprite: 'coin', color: GOLD }, { sprite: 'tangerine', color: '#ff8c1a' }, { sprite: 'lantern', color: '#e63946', scale: 1.1 }],
    special: { sprite: 'coin', color: '#ffc43d', scale: 1.35 },
    piece: 'present', pieceColors: ['#e63946', '#ffd166', '#c8102e'],
    catchNoun: 'red envelopes and coins', stackNoun: 'lucky boxes', ground: '#6e0b12', cheer: 'Lucky you!',
  },
  'lantern-festival': {
    basket: 'pouch', basketColor: '#e63946',
    items: [{ sprite: 'lantern', color: '#e63946' }, { sprite: 'envelope', color: '#e63946' }, { sprite: 'tangerine', color: '#ff8c1a' }],
    piece: 'mooncake', pieceColors: ['#d99a3d', '#c98a2e'],
    catchNoun: 'lanterns and envelopes', stackNoun: 'sweet cakes', ground: '#6e0b12', cheer: 'Glow-tastic!',
  },
  'mid-autumn-festival': {
    basket: 'basket', basketColor: '#e07a3f',
    items: [{ sprite: 'mooncake', color: '#d99a3d' }, { sprite: 'lantern', color: '#ff6b6b' }, { sprite: 'blossom', color: GOLD, scale: 0.8 }, { sprite: 'tangerine', color: '#ff8c1a' }],
    special: { sprite: 'goldStar', color: '#fff4c2', scale: 1.1 },
    piece: 'mooncake', pieceColors: ['#d99a3d', '#c98a2e', '#e6ab52'],
    catchNoun: 'mooncakes and lanterns', stackNoun: 'mooncakes', ground: '#071733', cheer: 'Over the moon!',
  },
  chuseok: {
    basket: 'basket', basketColor: '#e07a3f',
    items: [{ sprite: 'tangerine', color: '#ff7b00' }, { sprite: 'apple', color: '#e63946' }, { sprite: 'mooncake', color: '#c9e4b4', scale: 0.8 }],
    piece: 'mooncake', pieceColors: ['#d99a3d', '#c9e4b4', '#f4b6c2'],
    catchNoun: 'persimmons and rice cakes', stackNoun: 'rice cakes', ground: '#071733', cheer: 'Full-moon fun!',
  },
  halloween: {
    basket: 'pail', basketColor: '#ff8c1a',
    items: [{ sprite: 'candy', color: '#a855f7' }, { sprite: 'candyCorn', color: '#ff8c1a' }, { sprite: 'lollipop', color: '#a8ff5e' }, { sprite: 'candy', color: '#ff4d9d' }],
    special: { sprite: 'pumpkin', color: '#ff8c1a', scale: 1.2 },
    piece: 'bar', pieceColors: ['#7a4a2a', '#a855f7', '#ff8c1a', '#2a9d8f'],
    catchNoun: 'sweets', stackNoun: 'chocolate bars', ground: '#140822', cheer: 'Spook-tacular!',
  },
  thanksgiving: {
    basket: 'basket', basketColor: '#a0522d',
    items: [{ sprite: 'leafMaple', color: '#e85d04' }, { sprite: 'leafOak', color: '#d00000' }, { sprite: 'corn', color: '#ffb703' }, { sprite: 'apple', color: '#c8102e' }, { sprite: 'leafMaple', color: '#ffb703' }],
    special: { sprite: 'pie', color: '#e9a23b', scale: 1.15 },
    piece: 'pie', pieceColors: ['#e07a1f', '#b5442b', '#e9a23b'],
    catchNoun: 'leaves and apples', stackNoun: 'pies', ground: '#5a2c0d', cheer: 'Gobble-tastic!',
  },
  'indigenous-peoples-day': {
    basket: 'basket', basketColor: '#a0522d',
    items: [{ sprite: 'corn', color: '#ffb703' }, { sprite: 'leafMaple', color: '#e85d04' }, { sprite: 'leafOak', color: '#c8102e' }],
    piece: 'book', pieceColors: ['#c8102e', '#2a9d8f', '#ffb703', '#7a3e13'],
    catchNoun: 'corn and leaves', stackNoun: 'books', ground: '#5a2c0d', cheer: 'Harvest hooray!',
  },
  easter: {
    basket: 'basket', basketColor: '#c8a26b',
    items: [{ sprite: 'eggPattern0', color: '#ff8fb8' }, { sprite: 'eggPattern1', color: '#7cc4ff' }, { sprite: 'eggPattern2', color: '#b8f2a0' }, { sprite: 'eggPattern3', color: '#ffd166' }, { sprite: 'blossom', color: '#ffffff', scale: 0.75 }],
    special: { sprite: 'eggPattern1', color: '#ffc43d', scale: 1.3 },
    piece: 'cake', pieceColors: ['#ffb3c6', '#b8e0ff', '#d4f5c4', '#fff1a8'],
    catchNoun: 'eggs', stackNoun: 'cakes', ground: '#bfe8a6', cheer: 'Egg-cellent!',
  },
  'orthodox-easter': {
    basket: 'basket', basketColor: '#c8a26b',
    items: [{ sprite: 'eggPattern0', color: '#c8102e' }, { sprite: 'eggPattern2', color: '#b3121b' }, { sprite: 'blossom', color: '#ffffff', scale: 0.75 }],
    special: { sprite: 'eggPattern1', color: '#ffc43d', scale: 1.3 },
    piece: 'cake', pieceColors: ['#f3d9a4', '#ffffff', '#e8c98a'],
    catchNoun: 'red eggs', stackNoun: 'sweet breads', ground: '#bfe8a6', cheer: 'Egg-cellent!',
  },
  holi: {
    basket: 'bowl', basketColor: '#d4a017',
    items: [{ sprite: 'colourBall', color: '#ff4d9d' }, { sprite: 'colourBall', color: '#00a3c4' }, { sprite: 'colourBall', color: '#ffb703' }, { sprite: 'colourBall', color: '#4cd964' }, { sprite: 'colourBall', color: '#9b5de5' }],
    special: { sprite: 'balloon', color: '#ff4d9d', scale: 1.2 },
    piece: 'cake', pieceColors: ['#ff4d9d', '#00a3c4', '#ffb703', '#4cd964', '#9b5de5'],
    catchNoun: 'colour balls', stackNoun: 'rainbow cakes', ground: '#ffe2bf', cheer: 'Colour-tastic!',
  },
  'day-of-the-dead': {
    basket: 'basket', basketColor: '#ff9f1c',
    items: [{ sprite: 'marigold', color: '#ff9f1c' }, { sprite: 'marigold', color: '#ffd166', scale: 0.85 }, { sprite: 'candy', color: '#00b4d8' }, { sprite: 'candy', color: '#ff4d9d' }],
    piece: 'cake', pieceColors: ['#f7b267', '#ff8fb8', '#ffd166'],
    catchNoun: 'marigolds and sweets', stackNoun: 'sweet breads', ground: '#22072e', cheer: '¡Qué bonito!',
  },
  kwanzaa: {
    basket: 'basket', basketColor: '#2a9d8f',
    items: [{ sprite: 'corn', color: '#ffb703' }, { sprite: 'apple', color: '#d62828' }, { sprite: 'apple', color: '#2a9d8f' }],
    piece: 'book', pieceColors: ['#d62828', '#111111', '#2a9d8f', '#ffd166'],
    catchNoun: 'corn and fruit', stackNoun: 'books', ground: '#1a120a', cheer: 'Harambee!',
  },
  juneteenth: {
    basket: 'basket', basketColor: '#c8102e',
    items: [{ sprite: 'star', color: GOLD }, g('🍓'), g('🍉')],
    piece: 'cake', pieceColors: ['#c8102e', '#ffffff', '#7a1f2b'],
    catchNoun: 'stars and red treats', stackNoun: 'red velvet cakes', ground: '#081534', cheer: 'Freedom shines!',
  },
  nowruz: {
    basket: 'basket', basketColor: '#2a9d8f',
    items: [{ sprite: 'eggPattern2', color: '#4cd964' }, { sprite: 'eggPattern0', color: '#ff6b6b' }, { sprite: 'blossom', color: '#ffb3c6' }, { sprite: 'apple', color: '#e63946' }, { sprite: 'coin', color: GOLD, scale: 0.8 }],
    piece: 'present', pieceColors: ['#2a9d8f', '#d65a12', '#ffd166'],
    catchNoun: 'painted eggs and blossoms', stackNoun: 'gift boxes', ground: '#a8e0b4', cheer: 'Happy new day!',
  },
  'st-patricks-day': {
    basket: 'pail', basketColor: '#2b2b2b',
    items: [{ sprite: 'shamrock', color: '#2f9e44' }, { sprite: 'coin', color: GOLD }, { sprite: 'shamrock', color: '#69db7c', scale: 0.8 }],
    special: { sprite: 'clover4', color: '#2f9e44', scale: 1.2 },
    piece: 'bar', pieceColors: ['#ffd166', '#f4c430'],
    catchNoun: 'shamrocks and coins', stackNoun: 'gold bars', ground: '#085a40', cheer: 'Lucky duck!',
  },
  'valentines-day': {
    basket: 'basket', basketColor: '#c2185b',
    items: [{ sprite: 'shinyHeart', color: '#e63946' }, { sprite: 'shinyHeart', color: '#ff8fb8' }, { sprite: 'candy', color: '#ff4d9d' }, { sprite: 'shinyHeart', color: '#b5179e', scale: 0.8 }],
    special: { sprite: 'shinyHeart', color: '#ffc43d', scale: 1.3 },
    piece: 'macaron', pieceColors: ['#ff8fb8', '#ffffff', '#e63946', '#f7c6d9'],
    catchNoun: 'hearts', stackNoun: 'macarons', ground: '#ff9fb7', cheer: 'Heart-tastic!',
  },
  'mothers-day': {
    basket: 'basket', basketColor: '#c8442e',
    items: [{ sprite: 'tulip', color: '#ff6b8b' }, { sprite: 'daisy', color: '#ffffff' }, { sprite: 'shinyHeart', color: '#ff8fb8' }],
    piece: 'cake', pieceColors: ['#ffb3c6', '#fff1a8', '#ffd0c2'],
    catchNoun: 'flowers and hearts', stackNoun: 'cakes', ground: '#f6b8a5', cheer: 'Blooming lovely!',
  },
  'groundhog-day': {
    basket: 'basket', basketColor: '#8a5a2b',
    items: [{ sprite: 'snowflake', color: '#eaf6ff' }, g('🥕'), { sprite: 'snowflake', color: '#cfe8ff', scale: 0.8 }, g('🌰', 0.9)],
    special: { sprite: 'goldStar', color: GOLD, scale: 1.15 },
    piece: 'pancake', pieceColors: ['#e9b26b', '#dda15e'],
    catchNoun: 'snowflakes and snacks', stackNoun: 'pancakes', cheer: 'Shadow-tastic!',
  },
  'grandparents-day': {
    basket: 'basket', basketColor: '#c8442e',
    items: [{ sprite: 'shinyHeart', color: '#ff8fb8' }, { sprite: 'daisy', color: '#ffffff' }, { sprite: 'apple', color: '#e63946' }],
    piece: 'book', pieceColors: ['#c8442e', '#ffb703', '#2a9d8f'],
    catchNoun: 'hearts and flowers', stackNoun: 'story books', ground: '#f6b8a5', cheer: 'Grand!',
  },
  'fathers-day': {
    basket: 'basket', basketColor: '#1f5fbf',
    items: [{ sprite: 'plane', color: '#ffffff' }, { sprite: 'star', color: GOLD }, { sprite: 'shinyHeart', color: '#ff6b6b', scale: 0.85 }],
    piece: 'pancake', pieceColors: ['#e9b26b', '#dda15e', '#e6a85c'],
    catchNoun: 'planes and stars', stackNoun: 'pancakes', ground: '#7fb6ef', cheer: 'Top-notch!',
  },
  'pancake-day': {
    items: [g('🍓'), g('🫐'), g('🍋'), g('🍫', 0.9)],
    piece: 'pancake', pieceColors: ['#e9b26b', '#dda15e'],
    catchNoun: 'toppings', stackNoun: 'pancakes', cheer: 'Flipping great!',
  },
  'canada-day': {
    basket: 'basket', basketColor: '#ffffff',
    items: [{ sprite: 'leafMaple', color: '#e63946' }, { sprite: 'leafMaple', color: '#ff6b6b', scale: 0.8 }, { sprite: 'star', color: '#ffffff' }],
    piece: 'pancake', pieceColors: ['#e9b26b', '#dda15e'],
    catchNoun: 'maple leaves', stackNoun: 'pancakes', ground: '#7a0c12', cheer: 'Eh-mazing!',
  },
  'independence-day-us': {
    basket: 'basket', basketColor: '#ff4d5e',
    items: [{ sprite: 'star', color: '#ffffff' }, { sprite: 'star', color: '#ff4d5e' }, { sprite: 'star', color: '#7cc4ff' }, { sprite: 'balloon', color: '#ff4d5e' }],
    piece: 'cake', pieceColors: ['#ff4d5e', '#ffffff', '#5b8def'],
    catchNoun: 'stars', stackNoun: 'cakes', ground: '#081534', cheer: 'Star-spangled!',
  },
  'bastille-day': {
    basket: 'basket', basketColor: '#5b8def',
    items: [g('🥐'), { sprite: 'star', color: '#ffffff' }, { sprite: 'balloon', color: '#e63946' }],
    piece: 'macaron', pieceColors: ['#7cc4ff', '#ffffff', '#ff6b6b', '#ffd166'],
    catchNoun: 'croissants and stars', stackNoun: 'macarons', ground: '#081534', cheer: 'Magnifique!',
  },
  'earth-day': {
    basket: 'basket', basketColor: '#2f9e44',
    items: [{ sprite: 'drop', color: '#4dabf7' }, { sprite: 'leafOak', color: '#2f9e44' }, { sprite: 'blossom', color: '#ffd166', scale: 0.8 }, { sprite: 'apple', color: '#e63946' }],
    piece: 'book', pieceColors: ['#2f9e44', '#4dabf7', '#ffd166'],
    catchNoun: 'raindrops and leaves', stackNoun: 'books', ground: '#16502f', cheer: 'Planet hero!',
  },
  'pi-day': {
    basket: 'bowl', basketColor: '#9be7d3',
    items: [{ sprite: 'pie', color: '#e9a23b' }, g('π', 1.1), g('3'), g('1'), g('4')],
    piece: 'pie', pieceColors: ['#e07a1f', '#b5442b', '#7b3fa0'],
    catchNoun: 'pies and digits', stackNoun: 'pies', ground: '#122828', cheer: 'Pi-rrific!',
  },
  purim: {
    items: [{ sprite: 'hamantasch', color: '#7b2cbf' }, { sprite: 'hamantasch', color: '#e63946' }, g('🎭')],
    piece: 'present', pieceColors: ['#ffd166', '#ff8fb8', '#6a4cf0'],
    catchNoun: 'cookies', stackNoun: 'treat boxes', cheer: 'Hooray for Purim!',
  },
  passover: {
    items: [{ sprite: 'blossom', color: '#ffffff' }, { sprite: 'apple', color: '#3fae49' }, { sprite: 'drop', color: '#7cc4ff', scale: 0.8 }],
    piece: 'book', pieceColors: ['#2a7f4f', '#c8442e', '#ffd166'],
    catchNoun: 'blossoms and apples', stackNoun: 'books', ground: '#a9d79a', cheer: 'Spring-tastic!',
  },
  'rosh-hashanah': {
    items: [{ sprite: 'apple', color: '#e63946' }, { sprite: 'apple', color: '#ffd43b' }, g('🍯')],
    piece: 'cake', pieceColors: ['#b5651d', '#c97b2c'],
    catchNoun: 'apples and honey', stackNoun: 'honey cakes', cheer: 'Sweet new year!',
  },
  songkran: {
    items: [{ sprite: 'drop', color: '#4dabf7' }, { sprite: 'blossom', color: '#ffb3c6' }, { sprite: 'drop', color: '#74c0fc', scale: 0.8 }],
    piece: 'present', pieceColors: ['#0077b6', '#ffb703', '#ff8fb8'],
    catchNoun: 'splashes and flowers', stackNoun: 'boxes', cheer: 'Splash-tastic!',
  },
  'memorial-day': {
    items: [{ sprite: 'poppy', color: '#e63946' }, { sprite: 'star', color: '#ffffff' }],
    piece: 'book', pieceColors: ['#5b8def', '#ffffff', '#e63946'],
    catchNoun: 'poppies and stars', stackNoun: 'books', cheer: 'Lovely!',
  },
  'new-years-eve': {
    items: [{ sprite: 'star', color: GOLD }, { sprite: 'balloon', color: '#ff8fb8' }, { sprite: 'balloon', color: '#7cc4ff' }, { sprite: 'present', color: '#9b5de5' }],
    piece: 'present', pieceColors: ['#ffd166', '#ff8fb8', '#9b5de5', '#7cc4ff'],
    catchNoun: 'stars and balloons', stackNoun: 'party boxes', ground: '#05050c', cheer: 'Happy New You!',
  },
  'new-years-day': {
    items: [{ sprite: 'star', color: GOLD }, { sprite: 'balloon', color: '#ff8fb8' }, { sprite: 'balloon', color: '#7cc4ff' }],
    piece: 'present', pieceColors: ['#ffd166', '#ff8fb8', '#9b5de5'],
    catchNoun: 'stars and balloons', stackNoun: 'party boxes', ground: '#05050c', cheer: 'Fresh start!',
  },
  'three-kings-day': {
    items: [{ sprite: 'star', color: GOLD }, { sprite: 'coin', color: GOLD }, g('👑', 1.1)],
    piece: 'present', pieceColors: ['#ffd166', '#ff8fb8', '#9b5de5'],
    catchNoun: 'stars and crowns', stackNoun: 'gifts', cheer: 'Royally done!',
  },
  'mlk-day': {
    items: [{ sprite: 'shinyHeart', color: '#ff8fb8' }, { sprite: 'star', color: GOLD }, g('🕊️')],
    piece: 'book', pieceColors: ['#ffd166', '#ff8fb8', '#7cc4ff'],
    catchNoun: 'hearts and stars', stackNoun: 'books', cheer: 'Dream big!',
  },
};

function parse(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blends two #rrggbb colours (k = 0 → a). */
export function blend(a: string, b: string, k: number): string {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return a;
  const c = pa.map((v, i) => Math.round(v + (pb[i]! - v) * k));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Items that fit the holiday's effect when no hand-made skin exists. */
function effectItems(meta: HolidayMeta, theme: Theme): ItemDef[] {
  const p = meta.effectParams ?? {};
  const palette = p.palette && p.palette.length > 0 ? p.palette : [theme.accent, theme.accent2, theme.glow];
  const glyphs = p.glyphs && p.glyphs.length > 0 ? p.glyphs : null;
  if (glyphs) return glyphs.map((e) => g(e));
  switch (meta.effect) {
    case 'snow': return [{ sprite: 'snowflake', color: '#eaf6ff' }, { sprite: 'present', color: theme.accent2 }];
    case 'hearts': return palette.map((c) => ({ sprite: 'shinyHeart', color: c }));
    case 'leaves': return palette.slice(0, 3).map((c, i) => ({ sprite: i % 2 ? 'leafOak' : 'leafMaple', color: c }));
    case 'fireworks': return palette.map((c) => ({ sprite: 'star', color: c }));
    case 'lanterns': return [{ sprite: 'lantern', color: '#e63946' }, { sprite: 'envelope', color: '#e63946' }, { sprite: 'coin', color: GOLD }];
    case 'petals': return [{ sprite: 'marigold', color: '#ff9f1c' }, { sprite: 'blossom', color: '#ffffff' }, { sprite: 'tulip', color: '#ff6b8b' }];
    case 'eggs': return palette.map((c, i) => ({ sprite: `eggPattern${i % 4}`, color: c }));
    case 'bubbles': return [{ sprite: 'drop', color: '#4dabf7' }, { sprite: 'bubble', color: '#bde0fe' }];
    case 'balloons': return palette.map((c) => ({ sprite: 'balloon', color: c }));
    case 'planes': return [{ sprite: 'plane', color: '#ffffff' }, { sprite: 'star', color: GOLD }];
    case 'shamrocks': return [{ sprite: 'shamrock', color: '#2f9e44' }, { sprite: 'coin', color: GOLD }];
    case 'crescent': return [{ sprite: 'date', color: '#8b4a1c' }, { sprite: 'fanous', color: GOLD }, { sprite: 'star8', color: theme.accent2 }];
    case 'moon': return [{ sprite: 'mooncake', color: '#d99a3d' }, { sprite: 'lantern', color: '#ff6b6b' }];
    default: return [g(meta.emoji), { sprite: 'star', color: theme.glow }];
  }
}

/** The skin built from the holiday's theme and effect alone. */
export function defaultSkin(meta: HolidayMeta, theme: Theme): Skin {
  const night = theme.mood === 'night';
  return {
    basket: 'basket',
    basketColor: theme.accent,
    items: effectItems(meta, theme),
    special: { sprite: 'goldStar', color: GOLD, scale: 1.15 },
    oops: SLEEPY,
    piece: 'present',
    pieceColors: [theme.accent, theme.accent2, theme.glow].filter((c, i, a) => a.indexOf(c) === i),
    catchNoun: 'treats',
    stackNoun: 'presents',
    ground: night ? blend(theme.bg1, '#000000', 0.25) : blend(theme.bg2, '#ffffff', 0.35),
    cheer: 'Hooray!',
  };
}

/** The full skin for a holiday: a hand-made entry over the theme default. */
export function skinFor(meta: HolidayMeta, theme: Theme): Skin {
  const base = defaultSkin(meta, theme);
  const own = SKINS[meta.id];
  if (!own) return base;
  const merged: Skin = { ...base, ...own };
  return merged.items.length > 0 ? merged : { ...merged, items: base.items };
}

/** Every sprite a skin draws (for registration and the lint test). */
export function skinSprites(skin: Skin): string[] {
  return [...new Set([...skin.items, skin.special, ...skin.oops].map((d) => d.sprite))];
}
