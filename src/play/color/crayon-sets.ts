/**
 * crayon-sets.ts — the big box beyond the 12 basics: mixed shades, blends, glitter, shiny foils and
 * patterns. Pure data. Ids are stored in saved pictures, so a crayon's id must never change.
 */
import type { Crayon, GradientStop, Texture } from './crayons';

const shade = (name: string, color: string): Crayon => ({
  id: `c-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`, kind: 'shade', name, color,
});

export const SHADES: readonly Crayon[] = [
  ['Cherry', '#c8102e'], ['Tomato', '#f2542d'], ['Coral', '#ff7f6e'], ['Watermelon', '#fc6c85'], ['Ruby', '#9b111e'], ['Salmon', '#fa8d7a'],
  ['Pumpkin', '#f47a1f'], ['Tangerine', '#ff9f1c'], ['Apricot', '#ffbe7b'], ['Cinnamon', '#b5541c'], ['Mango', '#ffb000'], ['Cantaloupe', '#ffcf9e'],
  ['Lemon', '#fff44f'], ['Butter', '#ffe89a'], ['Banana', '#ffe135'], ['Honey', '#e8a317'], ['Mustard', '#c9a227'], ['Marigold', '#f6a800'],
  ['Mint', '#98e8c1'], ['Seafoam', '#6fdcb0'], ['Apple', '#6cc24a'], ['Kiwi', '#a4c639'], ['Olive', '#7a8b2e'], ['Forest', '#1f6f3f'],
  ['Pine', '#14523f'], ['Emerald', '#0fa36b'], ['Sage', '#a3b899'], ['Jade', '#00a878'],
  ['Aqua', '#4fe0d8'], ['Teal', '#0f8b8d'], ['Turquoise', '#2ec4d6'], ['Lagoon', '#00a6a6'],
  ['Baby blue', '#b9e3ff'], ['Cornflower', '#6e9cf0'], ['Denim', '#3e5f8a'], ['Navy', '#1b2a6b'], ['Ocean', '#0b6fb8'], ['Periwinkle', '#a3a8ff'],
  ['Cobalt', '#0047ab'], ['Ice', '#d6f3ff'],
  ['Lavender', '#c8b3ff'], ['Lilac', '#d9a7ea'], ['Violet', '#6a3fd4'], ['Grape', '#5a2a82'], ['Plum', '#8e3a8c'], ['Orchid', '#c957c9'],
  ['Bubblegum', '#ff9ecb'], ['Cotton candy', '#ffc4e1'], ['Hot pink', '#ff2e93'], ['Rose', '#e8476b'], ['Magenta', '#d6178c'], ['Blush', '#ffd1d6'],
  ['Cocoa', '#5c3a21'], ['Chocolate', '#6f4321'], ['Caramel', '#c68642'], ['Sand', '#e9cfa3'], ['Tan', '#d2a679'], ['Almond', '#eed5b7'],
  ['Mahogany', '#4a2514'], ['Walnut', '#7b4b2a'],
  ['Black', '#15131f'], ['Slate', '#5c6275'], ['Stone', '#a9aeb9'], ['Cloud', '#e4e7ee'], ['Cream', '#fff5dc'],
  ['Neon pink', '#ff1fa8'], ['Neon orange', '#ff6a13'], ['Neon yellow', '#f3ff1a'], ['Neon green', '#39ff14'], ['Neon blue', '#18c7ff'], ['Neon purple', '#b026ff'],
].map(([name, color]) => shade(name!, color!));

const stops = (colors: readonly string[]): GradientStop[] =>
  colors.map((color, i) => ({ offset: colors.length === 1 ? 0 : i / (colors.length - 1), color }));

const blend = (name: string, ...colors: string[]): Crayon => ({
  id: `x-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`, kind: 'blend', name,
  color: colors[Math.floor(colors.length / 2)]!, gradient: { type: 'linear', stops: stops(colors) },
});

export const BLENDS: readonly Crayon[] = [
  blend('Rainbow', '#e63946', '#ff8c1a', '#ffd23f', '#2a9d4b', '#3166d6', '#8a5cf5'),
  blend('Sunset', '#ff5e62', '#ffb347', '#ffd23f'),
  blend('Ocean waves', '#00c6ff', '#0072ff'),
  blend('Northern lights', '#39ff9f', '#18c7ff', '#a45cff'),
  blend('Cotton candy swirl', '#ff9ecb', '#9ed8ff'),
  blend('Watermelon slice', '#ff5a7a', '#ffc4d0', '#7ce06c'),
  blend('Campfire', '#ffd23f', '#ff7a1a', '#d7263d'),
  blend('Galaxy', '#1b1464', '#7b2ff7', '#ff5ec4'),
  blend('Berry', '#d6178c', '#5a2a82'),
  blend('Mermaid', '#18c7ff', '#38e0a6', '#a45cff'),
  blend('Unicorn', '#ff9ecb', '#c8b3ff', '#9ed8ff'),
  blend('Tropical', '#ffd23f', '#ff6f91', '#18c7ff'),
  blend('Forest floor', '#b7e04b', '#1f6f3f'),
  blend('Lemon lime', '#fff44f', '#6cc24a'),
  blend('Sherbet', '#ffb347', '#ff9ecb'),
  blend('Storm', '#3b3a7a', '#8ea4d2'),
  blend('Sunrise', '#ffd1d6', '#ffe89a', '#b9e3ff'),
  blend('Fall leaves', '#d7263d', '#ff9f1c', '#c9a227'),
  blend('Icicle', '#ffffff', '#9edfff'),
  blend('Lava', '#4a0d0d', '#e8320c', '#ffd23f'),
  blend('Grape soda', '#c957c9', '#3f1d78'),
  blend('Candy corn', '#fff5dc', '#ffb000', '#ff6a13'),
  blend('Peacock', '#0f8b8d', '#0047ab', '#6fdcb0'),
  blend('Bubble', '#ffc4e1', '#d6f3ff', '#c8b3ff'),
];

const glitter = (name: string, base: string, ...flecks: string[]): Crayon => ({
  id: `g-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`, kind: 'glitter', name: `${name} glitter`, color: base,
  texture: { type: 'glitter', base, flecks },
});

export const GLITTERS: readonly Crayon[] = [
  glitter('Gold', '#d9a520', '#fff2a8', '#ffffff', '#ffd23f'),
  glitter('Silver', '#a9b2c3', '#ffffff', '#e4e7ee', '#d6f3ff'),
  glitter('Rose gold', '#d98f8a', '#ffe3dc', '#ffffff', '#ffc4b5'),
  glitter('Red', '#c8102e', '#ff9aa6', '#ffffff', '#ffd23f'),
  glitter('Pink', '#ff5fa8', '#ffd1e6', '#ffffff', '#ffe89a'),
  glitter('Orange', '#ff8c1a', '#ffe0a8', '#ffffff'),
  glitter('Sunny', '#ffd23f', '#ffffff', '#fff5dc', '#ff9f1c'),
  glitter('Green', '#1f9d55', '#b6f5c9', '#ffffff', '#ffd23f'),
  glitter('Lime', '#8bd346', '#f3ffb0', '#ffffff'),
  glitter('Teal', '#0f8b8d', '#a8f5f0', '#ffffff'),
  glitter('Blue', '#3166d6', '#b9d4ff', '#ffffff', '#5ec8f2'),
  glitter('Purple', '#7a3fe0', '#dcc8ff', '#ffffff', '#ff9ecb'),
  glitter('Snow', '#eaf4ff', '#ffffff', '#9edfff', '#c8b3ff'),
  glitter('Midnight', '#15131f', '#ffffff', '#ffd23f', '#9edfff'),
  glitter('Rainbow', '#fff8ec', '#e63946', '#ff8c1a', '#ffd23f', '#2a9d4b', '#3166d6', '#8a5cf5'),
];

const shiny = (name: string, ...colors: string[]): Crayon => ({
  id: `s-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`, kind: 'shiny', name,
  color: colors[1] ?? colors[0]!, gradient: { type: 'linear', stops: stops([...colors, colors[0]!, ...colors]) },
});

export const SHINIES: readonly Crayon[] = [
  shiny('Shiny gold', '#a87a0c', '#ffe27a', '#d9a520'),
  shiny('Shiny silver', '#8d96a8', '#f5f8ff', '#b6bfd0'),
  shiny('Bronze', '#7a4a1e', '#e0a868', '#a86b32'),
  shiny('Copper', '#8f3f1c', '#ffb48a', '#c8602e'),
  shiny('Rose foil', '#b5656b', '#ffd9d4', '#dd9892'),
  shiny('Pearl', '#f3e8ff', '#ffffff', '#d6f3ff'),
  shiny('Chrome', '#5c6275', '#ffffff', '#8d96a8'),
  shiny('Ruby foil', '#7d0a1e', '#ff6b7f', '#c8102e'),
  shiny('Emerald foil', '#0a5c3f', '#6fe3b4', '#0fa36b'),
  shiny('Sapphire foil', '#0a2f7d', '#7fb0ff', '#1b56c8'),
  shiny('Amethyst foil', '#3f1d78', '#cfa8ff', '#7a3fe0'),
];

const pattern = (name: string, type: Texture['type'], base: string, ink: string): Crayon => ({
  id: `p-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`, kind: 'pattern', name, color: base,
  texture: { type, base, flecks: [ink] },
});

export const PATTERNS: readonly Crayon[] = [
  pattern('Polka dots', 'dots', '#ff7ab6', '#ffffff'),
  pattern('Blue dots', 'dots', '#5ec8f2', '#ffffff'),
  pattern('Stripes', 'stripes', '#ffd23f', '#ff8c1a'),
  pattern('Sailor stripes', 'stripes', '#ffffff', '#3166d6'),
  pattern('Candy cane', 'diagonal', '#ffffff', '#e63946'),
  pattern('Bumblebee', 'diagonal', '#ffd23f', '#15131f'),
  pattern('Checkers', 'checks', '#ffffff', '#15131f'),
  pattern('Picnic', 'checks', '#ffffff', '#e63946'),
  pattern('Starry', 'stars', '#1b2a6b', '#ffd23f'),
  pattern('Lucky stars', 'stars', '#2a9d4b', '#ffffff'),
  pattern('Love hearts', 'hearts', '#ffc4e1', '#e63946'),
  pattern('Zigzag', 'zigzag', '#8a5cf5', '#ffd23f'),
];
