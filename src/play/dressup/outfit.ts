/**
 * outfit.ts — what Jubi is wearing, how it is kept, and how holidays pick items. Pure (no DOM).
 *
 * The outfit is a handful of item ids, one per slot, kept under its own localStorage key so the main
 * Progress record stays small and every view (Home, Celebration Mode, cards, the sleigh) can read it
 * with `loadOutfit()`. Nothing is written while the app is pretending a date: the outfit then lives in
 * memory for the session, so dressing up still works, it just is not kept.
 */
import type { HolidayId, HolidayMeta, Tag } from '../../content/types';
import { mulberry32 } from '../../effects/rng';
import { fill, list } from '../../i18n/index';
import type { ThemeId } from '../../theme/themes';
import { ITEMS, SEASON_TAGS, SLOTS, itemById, itemsFor, type Item, type Slot } from './catalog';

export interface Outfit {
  readonly hat?: string;
  readonly glasses?: string;
  readonly neck?: string;
  readonly held?: string;
  readonly glow?: string;
  readonly pattern?: string;
}

export const OUTFIT_KEY = 'jubilee.jubi.v1';

export interface OutfitStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Keeps only known ids in their own slot; anything else is dropped (old saves, hand-edited storage). */
export function normalizeOutfit(raw: unknown): Outfit {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  const out: Partial<Record<Slot, string>> = {};
  for (const slot of SLOTS) {
    const v = o[slot];
    if (typeof v === 'string' && itemById(v)?.slot === slot) out[slot] = v;
  }
  return out;
}

export function isEmptyOutfit(o: Outfit): boolean {
  return SLOTS.every((s) => o[s] === undefined);
}

export function sameOutfit(a: Outfit, b: Outfit): boolean {
  return SLOTS.every((s) => a[s] === b[s]);
}

/** Puts an item on, or takes it off when it is already on (tapping a worn item again). */
export function toggleItem(o: Outfit, id: string): Outfit {
  const it = itemById(id);
  if (!it) return o;
  return o[it.slot] === id ? without(o, it.slot) : { ...o, [it.slot]: id };
}

export function without(o: Outfit, slot: Slot): Outfit {
  const next: Partial<Record<Slot, string>> = { ...o };
  delete next[slot];
  return next;
}

function browserStorage(): OutfitStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Session copy used while pretending, or when storage is unavailable. */
let memory: Outfit | null = null;

/** The child's saved outfit (empty when nothing was ever saved). Never throws. */
export function loadOutfit(storage: OutfitStorage | null = browserStorage()): Outfit {
  if (memory) return memory;
  try {
    const raw = storage?.getItem(OUTFIT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { outfit?: unknown } | null;
    return normalizeOutfit(parsed?.outfit);
  } catch {
    return {};
  }
}

/**
 * Keeps the outfit. Returns true when it reached storage. While pretending it stays in memory only
 * (and the next real visit shows the last real outfit again).
 */
export function saveOutfit(o: Outfit, opts: { pretending: boolean; storage?: OutfitStorage | null }): boolean {
  const clean = normalizeOutfit(o);
  if (opts.pretending) {
    memory = clean;
    return false;
  }
  memory = null;
  const storage = opts.storage === undefined ? browserStorage() : opts.storage;
  try {
    if (!storage) { memory = clean; return false; }
    storage.setItem(OUTFIT_KEY, JSON.stringify({ version: 1, outfit: clean }));
    return true;
  } catch {
    memory = clean;
    return false;
  }
}

/** Test hook: forget the session copy. */
export function resetOutfitMemory(): void {
  memory = null;
}

// ── seasons ──

/** What a holiday needs for matching: its id and tags (a HolidayMeta fits). */
export type SeasonHoliday = Pick<HolidayMeta, 'id' | 'tags'>;

/** 3 for an item made for this holiday, 1 for a shared festive tag (lights, spooky, spring…), else 0. */
export function seasonScore(it: Item, holiday: SeasonHoliday): number {
  if (it.holidays.includes(holiday.id)) return 3;
  const tags: readonly Tag[] = it.tags ?? [];
  return tags.some((t) => SEASON_TAGS.includes(t) && holiday.tags.includes(t)) ? 1 : 0;
}

/** Best score against any of the in-season holidays. */
export function inSeason(it: Item, season: readonly SeasonHoliday[]): number {
  let best = 0;
  for (const h of season) best = Math.max(best, seasonScore(it, h));
  return best;
}

/**
 * A slot's items with in-season ones first: the first season holiday's own items (the next holiday),
 * then the next holiday's, then shared-tag matches; the rest in catalog order.
 */
export function sortForSeason(slot: Slot, season: readonly SeasonHoliday[]): { item: Item; score: number }[] {
  const rank = (it: Item): number => {
    let best = 0;
    season.forEach((h, k) => {
      const s = seasonScore(it, h);
      if (s > 0) best = Math.max(best, s * 10 - k);
    });
    return best;
  };
  return itemsFor(slot)
    .map((item, i) => ({ item, score: inSeason(item, season), rank: rank(item), i }))
    .sort((a, b) => b.rank - a.rank || a.i - b.i)
    .map(({ item, score }) => ({ item, score }));
}

/** Theme accent hue → the glow that suits it, for holidays with no glow of their own. */
const GLOW_BY_THEME: Partial<Record<ThemeId, string>> = {
  christmas: 'glow-sunny', lunar: 'glow-sunny', usa: 'glow-sunny', newyear: 'glow-sunny', juneteenth: 'glow-sunny',
  silly: 'glow-rainbow', birthday: 'glow-rainbow', holi: 'glow-rainbow', carnival: 'glow-grape', purim: 'glow-grape',
  kwanzaa: 'glow-ember', muertos: 'glow-ember', harvest: 'glow-ember', bonfire: 'glow-ember',
  easter: 'glow-grape', nowruz: 'glow-mint', eid: 'glow-mint', ramadan: 'glow-mint', stpatricks: 'glow-mint', earth: 'glow-mint',
  valentine: 'glow-rose', mothers: 'glow-rose', fathers: 'glow-ocean', splash: 'glow-ocean', river: 'glow-ocean',
  koinobori: 'glow-ocean', hanukkah: 'glow-ocean', midautumn: 'glow-sunny', diwali: 'glow-sunny',
};

/**
 * "Dress for today": the holiday's best item in each wearable slot plus a glow to match. `turn` picks
 * among equally good items, so pressing the button again tries another look. Slots with nothing for
 * the holiday are left empty; the pattern the child chose stays.
 */
export function dressFor(holiday: SeasonHoliday & { theme?: ThemeId }, current: Outfit, turn = 0): Outfit {
  const out: Partial<Record<Slot, string>> = {};
  for (const slot of ['hat', 'glasses', 'neck', 'held', 'glow'] as const) {
    const ranked = sortForSeason(slot, [holiday]).filter((r) => r.score > 0);
    const top = ranked.filter((r) => r.score === ranked[0]?.score);
    const pick = top[turn % Math.max(1, top.length)];
    if (pick) out[slot] = pick.item.id;
  }
  if (!out.glow && holiday.theme) {
    const g = GLOW_BY_THEME[holiday.theme];
    if (g) out.glow = g;
  }
  if (current.pattern) out.pattern = current.pattern;
  return out;
}

/** How many items a holiday has across the wearable and held slots (the "Dress for" button needs ≥ 1). */
export function holidayItemCount(holiday: SeasonHoliday): number {
  return ITEMS.filter((i) => i.slot !== 'glow' && i.slot !== 'pattern' && seasonScore(i, holiday) > 0).length;
}

/**
 * "Surprise me": a random look that always has a hat and a held item, and sometimes glasses, a neck
 * item, a glow and a pattern, so it is never empty and rarely overloaded.
 */
export function surpriseOutfit(seed: number): Outfit {
  const rnd = mulberry32(seed >>> 0);
  const pick = (slot: Slot): string => {
    const list = itemsFor(slot);
    return list[Math.floor(rnd() * list.length)]!.id;
  };
  const out: Partial<Record<Slot, string>> = { hat: pick('hat'), held: pick('held') };
  if (rnd() < 0.55) out.glasses = pick('glasses');
  if (rnd() < 0.6) out.neck = pick('neck');
  if (rnd() < 0.8) out.glow = pick('glow');
  if (rnd() < 0.45) out.pattern = pick('pattern');
  return out;
}

/** Each item name again in lower case, for the middle of a sentence. */
const LOWER: Readonly<Record<string, string>> = {
  'Santa hat': 'santa hat', 'Elf hat': 'elf hat', 'Reindeer antlers': 'reindeer antlers', 'Witch hat': 'witch hat',
  'Paper crown': 'paper crown', 'Party hat': 'party hat', 'Flower crown': 'flower crown',
  'Tiny top hat': 'tiny top hat', 'Leprechaun hat': 'leprechaun hat', 'Bobble beanie': 'bobble beanie',
  'Sun hat': 'sun hat', 'Bunny ears': 'bunny ears', 'Lion-dance headband': 'lion-dance headband',
  'Thinking cap': 'thinking cap', 'Pirate hat': 'pirate hat', 'Chef hat': 'chef hat', 'Bee boppers': 'bee boppers',
  'Shamrock clip': 'shamrock clip', 'Marigold clip': 'marigold clip', 'Heart bow': 'heart bow',
  'Heart glasses': 'heart glasses', 'Star glasses': 'star glasses', 'Round glasses': 'round glasses',
  'Sunglasses': 'sunglasses', 'Rainbow glasses': 'rainbow glasses', 'Stripy scarf': 'stripy scarf',
  'Bow tie': 'bow tie', 'Flower garland': 'flower garland', 'Gold medal': 'gold medal',
  'Snowflake necklace': 'snowflake necklace', 'Tinsel boa': 'tinsel boa', 'Pirate bandana': 'pirate bandana',
  'Paper lantern': 'paper lantern', 'Ramadan lantern': 'ramadan lantern', 'Diya lamp': 'diya lamp',
  'Dreidel': 'dreidel', 'Balloon': 'balloon', 'Pumpkin pail': 'pumpkin pail', 'Pinwheel': 'pinwheel', 'Kite': 'kite',
  'Paper plane': 'paper plane', 'Wrapped present': 'wrapped present', 'Mooncake': 'mooncake',
  'Red envelope': 'red envelope', 'Paintbrush': 'paintbrush', 'Bowl of colors': 'bowl of colors',
  'Umbrella': 'umbrella', 'Magic wand': 'magic wand', 'Egg basket': 'egg basket',
  'Bunch of flowers': 'bunch of flowers', 'Heart lollipop': 'heart lollipop', 'Ice cream': 'ice cream',
  'Autumn leaf': 'autumn leaf', 'Fruit basket': 'fruit basket', 'Sunny glow': 'sunny glow', 'Rose glow': 'rose glow',
  'Mint glow': 'mint glow', 'Ocean glow': 'ocean glow', 'Grape glow': 'grape glow', 'Ember glow': 'ember glow',
  'Rainbow glow': 'rainbow glow', 'Stripes': 'stripes', 'Polka dots': 'polka dots', 'Little stars': 'little stars',
  'Rainbow': 'rainbow', 'Hearts': 'hearts',
};

/** Each item name as a noun phrase; pairs and plurals (glasses, ears, antlers) take no article. */
const WITH_ARTICLE: Readonly<Record<string, string>> = {
  'Santa hat': 'a santa hat', 'Elf hat': 'an elf hat', 'Reindeer antlers': 'reindeer antlers',
  'Witch hat': 'a witch hat', 'Paper crown': 'a paper crown', 'Party hat': 'a party hat',
  'Flower crown': 'a flower crown', 'Tiny top hat': 'a tiny top hat', 'Leprechaun hat': 'a leprechaun hat',
  'Bobble beanie': 'a bobble beanie', 'Sun hat': 'a sun hat', 'Bunny ears': 'bunny ears',
  'Lion-dance headband': 'a lion-dance headband', 'Thinking cap': 'a thinking cap', 'Pirate hat': 'a pirate hat',
  'Chef hat': 'a chef hat', 'Bee boppers': 'bee boppers', 'Shamrock clip': 'a shamrock clip',
  'Marigold clip': 'a marigold clip', 'Heart bow': 'a heart bow', 'Heart glasses': 'heart glasses',
  'Star glasses': 'star glasses', 'Round glasses': 'round glasses', 'Sunglasses': 'sunglasses',
  'Rainbow glasses': 'rainbow glasses', 'Stripy scarf': 'a stripy scarf', 'Bow tie': 'a bow tie',
  'Flower garland': 'a flower garland', 'Gold medal': 'a gold medal', 'Snowflake necklace': 'a snowflake necklace',
  'Tinsel boa': 'a tinsel boa', 'Pirate bandana': 'a pirate bandana', 'Paper lantern': 'a paper lantern',
  'Ramadan lantern': 'a ramadan lantern', 'Diya lamp': 'a diya lamp', 'Dreidel': 'a dreidel', 'Balloon': 'a balloon',
  'Pumpkin pail': 'a pumpkin pail', 'Pinwheel': 'a pinwheel', 'Kite': 'a kite', 'Paper plane': 'a paper plane',
  'Wrapped present': 'a wrapped present', 'Mooncake': 'a mooncake', 'Red envelope': 'a red envelope',
  'Paintbrush': 'a paintbrush', 'Bowl of colors': 'bowl of colors', 'Umbrella': 'an umbrella',
  'Magic wand': 'a magic wand', 'Egg basket': 'an egg basket', 'Bunch of flowers': 'bunch of flowers',
  'Heart lollipop': 'a heart lollipop', 'Ice cream': 'an ice cream', 'Autumn leaf': 'an autumn leaf',
  'Fruit basket': 'a fruit basket', 'Sunny glow': 'a sunny glow', 'Rose glow': 'a rose glow',
  'Mint glow': 'a mint glow', 'Ocean glow': 'an ocean glow', 'Grape glow': 'a grape glow',
  'Ember glow': 'an ember glow', 'Rainbow glow': 'a rainbow glow', 'Stripes': 'stripes', 'Polka dots': 'polka dots',
  'Little stars': 'little stars', 'Rainbow': 'a rainbow', 'Hearts': 'hearts',
};

export const lowerItemName = (name: string): string => LOWER[name] ?? name.toLowerCase();

/** "Jubi in a Santa hat and a stripy scarf" — the Fridge picture's title. */
export function describeOutfit(o: Outfit, holidayName?: string): string {
  const names = (['hat', 'glasses', 'neck', 'held'] as const)
    .map((s) => itemById(o[s])?.name)
    .filter((n): n is string => n !== undefined);
  if (names.length === 0) return holidayName ? fill('Jubi on {holiday}', { holiday: holidayName }) : 'Jubi';
  const items = list(names.slice(0, 2).map((n) => WITH_ARTICLE[n] ?? lowerItemName(n)));
  return fill(names.length > 2 ? 'Jubi in {items} and more' : 'Jubi in {items}', { items });
}

/** The ids of the holidays an item belongs to that exist in a catalog (for tests and labels). */
export function knownHolidays(it: Item, ids: ReadonlySet<HolidayId>): HolidayId[] {
  return it.holidays.filter((h) => ids.has(h));
}
