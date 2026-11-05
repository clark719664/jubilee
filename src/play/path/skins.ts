/**
 * skins.ts — how each holiday dresses the shared puzzles: the ground Jubi walks on, the thing to collect
 * (and the verb for it), what stands in the way, and where the path ends. The levels never change; only
 * the words and the little vector sprites do, so "light the diyas" and "deliver the presents" are the
 * same puzzle in two outfits.
 *
 * Holidays without their own entry fall back by theme (a winter theme gets snow, a night sky gets the
 * starry ground) and then by mood, so every holiday — including a child's own custom day — has a skin.
 */
import type { HolidayMeta } from '../../content/types';
import { contrastRatio, hexToRgb } from '../../theme/contrast';
import type { Theme, ThemeId } from '../../theme/themes';

export type Ground = 'snow' | 'grass' | 'sand' | 'tiles' | 'night';
export type ItemKind = 'present' | 'diya' | 'egg' | 'envelope' | 'pumpkin' | 'lantern' | 'coin' | 'flower' | 'heart' | 'apple' | 'star';
export type BlockKind = 'snowman' | 'pine' | 'bush' | 'hay' | 'rock' | 'pot' | 'lanternPost';
export type GoalKind = 'house' | 'snowHouse' | 'gate' | 'basket';

export interface Skin {
  readonly ground: Ground;
  readonly item: ItemKind;
  readonly block: BlockKind;
  readonly goal: GoalKind;
  /** "diya" / "diyas". */
  readonly one: string;
  readonly many: string;
  /** What Jubi does to an item: "light", "deliver", "gather"… */
  readonly verb: string;
  /** Past tense for "every diya is lit". */
  readonly done: string;
  /** "a snowman" / "snowmen" (for hints and the board description). */
  readonly aBlock: string;
  readonly blocks: string;
  /** "the house", "the moon gate". */
  readonly goalName: string;
  /** Ground name for the edge hint: "the edge of the garden". */
  readonly place: string;
}

const SKINS: Partial<Record<string, Skin>> = {
  christmas: { ground: 'snow', item: 'present', block: 'snowman', goal: 'snowHouse', one: 'present', many: 'presents', verb: 'deliver', done: 'delivered', aBlock: 'a snowman', blocks: 'snowmen', goalName: 'the cosy house', place: 'the snowy field' },
  hanukkah: { ground: 'snow', item: 'coin', block: 'snowman', goal: 'snowHouse', one: 'chocolate coin', many: 'chocolate coins', verb: 'gather', done: 'gathered', aBlock: 'a snowman', blocks: 'snowmen', goalName: 'the house', place: 'the snowy yard' },
  diwali: { ground: 'tiles', item: 'diya', block: 'pot', goal: 'house', one: 'diya', many: 'diyas', verb: 'light', done: 'lit', aBlock: 'a flower pot', blocks: 'flower pots', goalName: 'the front door', place: 'the courtyard' },
  'lunar-new-year': { ground: 'tiles', item: 'envelope', block: 'lanternPost', goal: 'gate', one: 'red envelope', many: 'red envelopes', verb: 'hand out', done: 'handed out', aBlock: 'a lantern post', blocks: 'lantern posts', goalName: 'the moon gate', place: 'the street' },
  'lantern-festival': { ground: 'tiles', item: 'lantern', block: 'lanternPost', goal: 'gate', one: 'lantern', many: 'lanterns', verb: 'light', done: 'lit', aBlock: 'a lantern post', blocks: 'lantern posts', goalName: 'the moon gate', place: 'the street' },
  halloween: { ground: 'night', item: 'pumpkin', block: 'hay', goal: 'house', one: 'porch', many: 'porches', verb: 'put a pumpkin on', done: 'glowing', aBlock: 'a hay bale', blocks: 'hay bales', goalName: 'the front door', place: 'the street' },
  easter: { ground: 'grass', item: 'egg', block: 'bush', goal: 'basket', one: 'egg', many: 'eggs', verb: 'gather', done: 'found', aBlock: 'a bush', blocks: 'bushes', goalName: 'the basket', place: 'the garden' },
  'orthodox-easter': { ground: 'grass', item: 'egg', block: 'bush', goal: 'basket', one: 'egg', many: 'eggs', verb: 'gather', done: 'found', aBlock: 'a bush', blocks: 'bushes', goalName: 'the basket', place: 'the garden' },
  thanksgiving: { ground: 'grass', item: 'apple', block: 'hay', goal: 'house', one: 'apple', many: 'apples', verb: 'pick up', done: 'picked up', aBlock: 'a hay bale', blocks: 'hay bales', goalName: 'the house', place: 'the field' },
  'mid-autumn-festival': { ground: 'night', item: 'lantern', block: 'rock', goal: 'gate', one: 'lantern', many: 'lanterns', verb: 'light', done: 'lit', aBlock: 'a rock', blocks: 'rocks', goalName: 'the moon gate', place: 'the garden' },
  'day-of-the-dead': { ground: 'tiles', item: 'flower', block: 'pot', goal: 'house', one: 'marigold', many: 'marigolds', verb: 'gather', done: 'gathered', aBlock: 'a flower pot', blocks: 'flower pots', goalName: 'the house', place: 'the plaza' },
  holi: { ground: 'grass', item: 'flower', block: 'bush', goal: 'house', one: 'flower', many: 'flowers', verb: 'gather', done: 'gathered', aBlock: 'a bush', blocks: 'bushes', goalName: 'the house', place: 'the garden' },
  nowruz: { ground: 'grass', item: 'flower', block: 'bush', goal: 'house', one: 'hyacinth', many: 'hyacinths', verb: 'gather', done: 'gathered', aBlock: 'a bush', blocks: 'bushes', goalName: 'the house', place: 'the garden' },
  kwanzaa: { ground: 'night', item: 'apple', block: 'pot', goal: 'house', one: 'piece of fruit', many: 'pieces of fruit', verb: 'gather', done: 'gathered', aBlock: 'a big pot', blocks: 'big pots', goalName: 'the house', place: 'the yard' },
  'eid-al-fitr': { ground: 'tiles', item: 'lantern', block: 'pot', goal: 'gate', one: 'lantern', many: 'lanterns', verb: 'light', done: 'lit', aBlock: 'a flower pot', blocks: 'flower pots', goalName: 'the arch', place: 'the courtyard' },
  ramadan: { ground: 'tiles', item: 'lantern', block: 'pot', goal: 'gate', one: 'lantern', many: 'lanterns', verb: 'light', done: 'lit', aBlock: 'a flower pot', blocks: 'flower pots', goalName: 'the arch', place: 'the courtyard' },
  'eid-al-adha': { ground: 'tiles', item: 'lantern', block: 'pot', goal: 'gate', one: 'lantern', many: 'lanterns', verb: 'light', done: 'lit', aBlock: 'a flower pot', blocks: 'flower pots', goalName: 'the arch', place: 'the courtyard' },
  'valentines-day': { ground: 'grass', item: 'heart', block: 'bush', goal: 'house', one: 'heart', many: 'hearts', verb: 'gather', done: 'gathered', aBlock: 'a bush', blocks: 'bushes', goalName: 'the house', place: 'the garden' },
  'st-patricks-day': { ground: 'grass', item: 'coin', block: 'rock', goal: 'house', one: 'gold coin', many: 'gold coins', verb: 'gather', done: 'gathered', aBlock: 'a rock', blocks: 'rocks', goalName: 'the cottage', place: 'the meadow' },
  'rosh-hashanah': { ground: 'grass', item: 'apple', block: 'bush', goal: 'house', one: 'apple', many: 'apples', verb: 'pick up', done: 'picked up', aBlock: 'a bush', blocks: 'bushes', goalName: 'the house', place: 'the orchard' },
};

/** Winter themes walk on snow; sunny, summery ones on sand; the rest by mood below. */
const BY_THEME: Partial<Record<ThemeId, Pick<Skin, 'ground' | 'block'>>> = {
  christmas: { ground: 'snow', block: 'snowman' },
  snowday: { ground: 'snow', block: 'snowman' },
  threekings: { ground: 'sand', block: 'rock' },
  summer: { ground: 'sand', block: 'rock' },
  splash: { ground: 'sand', block: 'rock' },
};

const NIGHT: Skin = { ground: 'night', item: 'star', block: 'rock', goal: 'house', one: 'star', many: 'stars', verb: 'collect', done: 'collected', aBlock: 'a rock', blocks: 'rocks', goalName: 'the house', place: 'the path' };
const DAY: Skin = { ground: 'grass', item: 'star', block: 'bush', goal: 'house', one: 'star', many: 'stars', verb: 'collect', done: 'collected', aBlock: 'a bush', blocks: 'bushes', goalName: 'the house', place: 'the garden' };

const BLOCK_NAMES: Record<BlockKind, readonly [string, string]> = {
  snowman: ['a snowman', 'snowmen'], pine: ['a pine tree', 'pine trees'], bush: ['a bush', 'bushes'], hay: ['a hay bale', 'hay bales'],
  rock: ['a rock', 'rocks'], pot: ['a flower pot', 'flower pots'], lanternPost: ['a lantern post', 'lantern posts'],
};

/** The skin for a holiday: its own, else its theme's ground on the mood's default. */
export function skinFor(meta: Pick<HolidayMeta, 'id' | 'theme'>, mood: 'day' | 'night'): Skin {
  const own = SKINS[meta.id];
  if (own) return own;
  const base = mood === 'night' ? NIGHT : DAY;
  const t = BY_THEME[meta.theme];
  if (!t) return base;
  const [aBlock, blocks] = BLOCK_NAMES[t.block];
  return { ...base, ...t, aBlock, blocks, place: t.ground === 'snow' ? 'the snowy field' : t.ground === 'sand' ? 'the beach' : base.place };
}

/** Every holiday id with a hand-made skin (for tests). */
export const SKINNED: readonly string[] = Object.keys(SKINS);

// ── focus and selection colour ──

const hex = (rgb: readonly number[]): string => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
const mix = (a: string, b: string, t: number): string => {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return hex(x.map((c, i) => c + (y[i]! - c) * t));
};

/**
 * The surfaces a focus ring or the "next card goes here" slot sits on: the sky, and the panels tinted
 * over it (55% white on a day sky, 12% on a night one; see .pth-panel).
 */
export function ringSurfaces(theme: Theme): string[] {
  const tint = theme.mood === 'day' ? 0.55 : 0.12;
  return [theme.bg1, theme.bg2, mix(theme.bg1, '#ffffff', tint), mix(theme.bg2, '#ffffff', tint)];
}

/**
 * The colour for focus rings, the selected card, the running card and the caret slot: the theme's glow
 * when it stands out (≥ 3:1) on every surface it sits on, otherwise the theme's ink (≥ 4.5:1 on the sky
 * by construction). A white glow on a pale Easter sky is invisible; ink is not.
 */
export function focusColour(theme: Theme): string {
  const ok = (c: string): boolean => ringSurfaces(theme).every((bg) => contrastRatio(c, bg) >= 3);
  return ok(theme.glow) ? theme.glow : theme.ink;
}
