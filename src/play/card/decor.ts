/**
 * decor.ts — what the child can stick on a card.
 *
 * Two kinds, both drawn in the house style rather than as clip-art:
 *  - DECORATIONS: the effects engine's vector sprites (snowflakes, lanterns, marigolds, dreidels,
 *    pumpkins…), the same art that falls across the holiday's sky. Each holiday gets a hand-picked set
 *    chosen from its effect (plus a few per-holiday extras), colored from its theme.
 *  - HOLIDAY STICKERS: every holiday's die-cut sticker (the illustrated one when it exists, else its emoji
 *    on a disc in that holiday's own colors). Ones the child has earned wear a gold edge; nothing is locked.
 *
 * Respect (ART_BRIEF): sacred objects (menorah, kinara, diya, crescent) appear only as themselves on their
 * own holiday's card, never with faces and never as jokes.
 */
import { PAINTERS } from '../../effects/painters/index';
import { bigHeart, bunnyEars, clover4, daisy, grassTuft, holiSplash0, holiSplash1, holiSplash2, poppy, potOfGold, springLeaf, tulip } from '../../effects/painters/extra-day';
import { booBubble, corn, diya, ghost, kente, kinaraBody, kinaraCandle, menorahBody, pumpkin, skyLantern, skyline, sparkle } from '../../effects/painters/extra-night';
import { arrowWheel, cake, dragonBoat, greenLeaf, lilyPad, moonDisc, moonRabbit, paperPlane, ribbonBow, roundLantern, softCloud, stripedCandle, waterDrop } from '../../effects/painters/extra-whimsy';
import { glyphPainter } from '../../effects/sprites';
import type { EffectId, SpritePainter } from '../../effects/types';
import type { HolidayMeta } from '../../content/types';
import type { Theme } from '../../theme/themes';

/** Every painter a card may use, by the name stored in the card JSON. */
const NAMED: Readonly<Record<string, SpritePainter>> = {
  ...PAINTERS,
  bigHeart, bunnyEars, clover4, daisy, grassTuft, holiSplash0, holiSplash1, holiSplash2, poppy, potOfGold, springLeaf, tulip,
  booBubble, corn, diya, ghost, kente, kinaraBody, kinaraCandle, menorahBody, pumpkin, skyLantern, skyline, sparkle,
  arrowWheel, cake, dragonBoat, greenLeaf, lilyPad, moonDisc, moonRabbit, paperPlane, ribbonBow, roundLantern, softCloud, stripedCandle, waterDrop,
};

/** Emoji glyphs are stored as `glyph:<text>` (a holiday's own effect glyphs, e.g. 🥞 on Pancake Day). */
export function painterFor(name: string): SpritePainter | null {
  if (name.startsWith('glyph:')) {
    const text = name.slice(6);
    return text.length > 0 && text.length <= 16 ? glyphPainter(text) : null;
  }
  return Object.prototype.hasOwnProperty.call(NAMED, name) ? NAMED[name]! : null;
}

export const isDecorName = (name: string): boolean => painterFor(name) !== null;

/**
 * How much of the sticker box a painter fills. Painters draw within about ±size/2 of the center and a few
 * overhang a little (rims, steam, ribbons), so they are painted at ~74% of the box to keep every edge in.
 */
export const PAINT_FILL = 0.74;

type Tone = 'accent' | 'accent2' | 'glow' | 'ink';
interface Pick { readonly p: string; readonly c: string | Tone; readonly label: string }

const P = (p: string, c: string | Tone, label: string): Pick => ({ p, c, label });

const GOLD = '#ffd166';
const WHITE = '#ffffff';

/** Shared extras every holiday can use. */
const BASICS: readonly Pick[] = [P('star', GOLD, 'Gold star'), P('sparkle', GOLD, 'Sparkle'), P('heart', '#ff4d6d', 'Heart'), P('balloon', 'accent2', 'Balloon')];

const BY_EFFECT: Readonly<Record<EffectId, readonly Pick[]>> = {
  snow: [P('snowflake', '#eaf6ff', 'Snowflake'), P('ribbonBow', '#e63946', 'Red bow'), P('star', GOLD, 'Gold star'), P('snowflake', '#9fd3ff', 'Blue snowflake'), P('softCloud', WHITE, 'Snow cloud'), P('stripedCandle', '#e63946', 'Candy stripe')],
  confetti: [P('confettiStreamer', 'accent', 'Streamer'), P('balloon', 'accent2', 'Balloon'), P('star8', GOLD, 'Star burst'), P('confettiStreamer', 'accent2', 'Wiggly streamer'), P('ribbonBow', 'accent', 'Bow')],
  fireworks: [P('star8', GOLD, 'Star burst'), P('sparkle', WHITE, 'Firework sparkle'), P('star', 'accent2', 'Star'), P('sparkle', 'accent2', 'Sparkle'), P('confettiStreamer', 'accent', 'Streamer')],
  bats: [P('pumpkin', '#ff8c1a', 'Pumpkin'), P('ghost', '#f4f1ff', 'Friendly ghost'), P('batA', '#3b1a5a', 'Bat'), P('booBubble', '#ff8c1a', 'Boo!'), P('moon', '#fff1b8', 'Moon'), P('star', GOLD, 'Star')],
  hearts: [P('bigHeart', '#ff4d6d', 'Big heart'), P('heart', '#ff8fb8', 'Pink heart'), P('ribbonBow', '#c2185b', 'Bow'), P('blossom', '#ffb3c6', 'Blossom'), P('tulip', '#ff4d6d', 'Tulip'), P('envelope', '#e63946', 'Love letter')],
  holi: [P('holiSplash0', '#d61a8c', 'Pink splash'), P('holiSplash1', '#00a3c4', 'Blue splash'), P('holiSplash2', '#ffb703', 'Yellow splash'), P('holiSplash0', '#2bb673', 'Green splash'), P('marigold', '#ff9f1c', 'Marigold'), P('balloon', '#d61a8c', 'Water balloon')],
  lanterns: [P('lantern', '#e63946', 'Red lantern'), P('envelope', '#d62828', 'Red envelope'), P('coin', GOLD, 'Gold coin'), P('blossom', '#ffb3c6', 'Plum blossom'), P('roundLantern', '#ff4d5e', 'Round lantern'), P('skyLantern', '#ffb703', 'Sky lantern')],
  diyas: [P('diya', '#ffb703', 'Diya lamp'), P('marigold', '#ff9f1c', 'Marigold'), P('marigold', '#ffd166', 'Yellow marigold'), P('sparkle', GOLD, 'Sparkle'), P('star8', '#ff4d9d', 'Rangoli star'), P('flame', '#ffb703', 'Little flame')],
  leaves: [P('leafMaple', '#d65a12', 'Maple leaf'), P('leafOak', '#a84f1a', 'Oak leaf'), P('leafGinkgo', '#ffb703', 'Ginkgo leaf'), P('corn', '#ffd166', 'Corn'), P('pie', '#e0a050', 'Pie'), P('pumpkin', '#ff8c1a', 'Pumpkin')],
  shamrocks: [P('shamrock', '#2bb673', 'Shamrock'), P('clover4', '#1f9d55', 'Lucky clover'), P('potOfGold', GOLD, 'Pot of gold'), P('coin', GOLD, 'Gold coin'), P('shamrock', '#9be7d3', 'Mint shamrock')],
  eggs: [P('eggPattern1', '#ff8fb8', 'Spotty egg'), P('eggPattern2', '#9be7d3', 'Zigzag egg'), P('eggPattern3', '#b79bff', 'Stripy egg'), P('bunnyEars', WHITE, 'Bunny ears'), P('tulip', '#ff8fb8', 'Tulip'), P('daisy', WHITE, 'Daisy'), P('springLeaf', '#5cc46b', 'Leaf')],
  menorah: [P('menorahBody', GOLD, 'Menorah'), P('dreidel', '#5b8def', 'Dreidel'), P('coin', GOLD, 'Gelt'), P('dreidel', '#cfd8ff', 'Silver dreidel'), P('star', '#cfd8ff', 'Star'), P('snowflake', '#eaf6ff', 'Snowflake')],
  kinara: [P('kinaraBody', '#a0662b', 'Kinara'), P('kente', '#d62828', 'Kente cloth'), P('corn', '#ffd166', 'Ear of corn'), P('kinaraCandle', '#d62828', 'Red candle'), P('kinaraCandle', '#2a9d8f', 'Green candle'), P('kinaraCandle', '#1d1b26', 'Black candle')],
  petals: [P('marigold', '#ff9f1c', 'Marigold'), P('blossom', '#ff8fb8', 'Blossom'), P('daisy', WHITE, 'Daisy'), P('tulip', '#ff4d6d', 'Tulip'), P('poppy', '#e63946', 'Poppy'), P('petal', '#ffb3c6', 'Petal')],
  crescent: [P('crescent', GOLD, 'Crescent moon'), P('star8', GOLD, 'Eight-point star'), P('fanous', GOLD, 'Fanous lantern'), P('roundLantern', '#9be7d3', 'Lantern'), P('star', '#fff4c2', 'Star'), P('skyline', '#0b3d3a', 'Domes and towers')],
  moon: [P('moonDisc', '#fff1b8', 'Full moon'), P('moonRabbit', WHITE, 'Moon rabbit'), P('roundLantern', '#ff8fb8', 'Round lantern'), P('lantern', '#e63946', 'Red lantern'), P('softCloud', WHITE, 'Cloud'), P('blossom', '#ffd166', 'Osmanthus')],
  sabzeh: [P('goldfish', '#ff8c1a', 'Goldfish'), P('grassTuft', '#3fae5a', 'Sabzeh sprouts'), P('blossom', '#ffb3c6', 'Blossom'), P('tulip', '#e63946', 'Tulip'), P('eggPattern2', '#2a9d8f', 'Painted egg'), P('springLeaf', '#5cc46b', 'Leaf')],
  'glyph-rain': [P('star', GOLD, 'Gold star'), P('sparkle', GOLD, 'Sparkle')],
  balloons: [P('balloon', '#e63946', 'Red balloon'), P('balloon', '#5b8def', 'Blue balloon'), P('cake', '#ff8fb8', 'Cake'), P('ribbonBow', 'accent', 'Bow'), P('stripedCandle', '#5b3df5', 'Candle'), P('confettiStreamer', 'accent2', 'Streamer')],
  bubbles: [P('bubble', '#9be7ff', 'Bubble'), P('waterDrop', '#4cc9f0', 'Water drop'), P('greenLeaf', '#3fae5a', 'Leaf'), P('lilyPad', '#3fae5a', 'Lily pad'), P('goldfish', '#ff8c1a', 'Fish'), P('softCloud', WHITE, 'Cloud')],
  planes: [P('paperPlane', '#5b8def', 'Paper plane'), P('plane', 'accent', 'Plane'), P('softCloud', WHITE, 'Cloud'), P('star', GOLD, 'Star'), P('arrowWheel', WHITE, 'Pinwheel')],
};

/** Holiday-specific extras, shown first. */
const BY_HOLIDAY: Readonly<Record<string, readonly Pick[]>> = {
  thanksgiving: [P('turkey', '#a84f1a', 'Turkey')],
  'groundhog-day': [P('groundhog', '#a0662b', 'Groundhog')],
  'pi-day': [P('pie', '#e0a050', 'Pie')],
  'childrens-day-japan': [P('koinobori', '#c81d3c', 'Carp streamer'), P('koinobori', '#1f5fbf', 'Blue carp')],
  'dragon-boat-festival': [P('dragonBoat', '#c8102e', 'Dragon boat')],
  'cinco-de-mayo': [P('papelPicado', '#ff4d9d', 'Papel picado'), P('papelPicado', '#2a9d8f', 'Green papel picado')],
  'day-of-the-dead': [P('papelPicado', '#ff9f1c', 'Papel picado')],
  'st-patricks-day': [P('potOfGold', GOLD, 'Pot of gold')],
  'earth-day': [P('greenLeaf', '#3fae5a', 'Leaf'), P('sphereShade', '#4cc9f0', 'Blue marble')],
  'lantern-festival': [P('skyLantern', '#ffb703', 'Sky lantern')],
  'mothers-day': [P('bigHeart', '#ff4d6d', 'Big heart')],
  'fathers-day': [P('bigHeart', '#1f5fbf', 'Blue heart')],
  'grandparents-day': [P('daisy', WHITE, 'Daisy')],
  'bonfire-night': [P('flame', '#ff7a00', 'Bonfire flame')],
  'leap-day': [P('frog', '#3fae5a', 'Leaping frog')],
  'songkran': [P('waterDrop', '#4cc9f0', 'Splash')],
};

export interface DecorChoice {
  readonly key: string;
  readonly p: string;
  readonly c: string;
  readonly label: string;
}

function resolve(c: string | Tone, theme: Theme): string {
  switch (c) {
    case 'accent': return theme.accent;
    case 'accent2': return theme.accent2;
    case 'glow': return theme.glow;
    case 'ink': return theme.ink;
    default: return c;
  }
}

/** The decorations offered for a holiday: its own extras, its effect's set, its effect glyphs, then the basics. */
export function decorFor(meta: HolidayMeta, theme: Theme, max = 12): DecorChoice[] {
  const glyphs = (meta.effectParams?.glyphs ?? []).filter((g) => /\p{Extended_Pictographic}/u.test(g)).map((g) => P(`glyph:${g}`, WHITE, g));
  const picks = [...(BY_HOLIDAY[meta.id] ?? []), ...BY_EFFECT[meta.effect], ...glyphs, ...BASICS];
  const out: DecorChoice[] = [];
  const seen = new Set<string>();
  for (const pick of picks) {
    const c = resolve(pick.c, theme).toLowerCase();
    const key = `${pick.p}|${c}`;
    if (seen.has(key) || !isDecorName(pick.p) || !/^#[0-9a-f]{6}$/.test(c)) continue;
    seen.add(key);
    out.push({ key, p: pick.p, c, label: pick.label });
    if (out.length >= max) break;
  }
  return out;
}

/** Holiday ids the child has earned a sticker for (any year): `${id}:${year}` keys in Progress.stickers. */
export function earnedIds(stickers: Readonly<Record<string, string>>): Set<string> {
  const out = new Set<string>();
  for (const k of Object.keys(stickers)) {
    const i = k.lastIndexOf(':');
    if (i > 0) out.add(k.slice(0, i));
  }
  return out;
}

/** All holiday stickers, the opened holiday first, then earned ones, then the rest in registry order. */
export function holidayStickerOrder<M extends { readonly id: string }>(metas: readonly M[], openedId: string, earned: ReadonlySet<string>): M[] {
  const rank = (m: M): number => (m.id === openedId ? 0 : earned.has(m.id) ? 1 : 2);
  return metas.map((m, i) => ({ m, i })).sort((a, b) => rank(a.m) - rank(b.m) || a.i - b.i).map((x) => x.m);
}
