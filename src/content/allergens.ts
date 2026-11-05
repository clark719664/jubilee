import type { Allergen, Hazard } from './types';
import { ALLERGENS } from './types';

/** Kid-friendly chip labels. */
export const ALLERGEN_LABELS: Record<Allergen, string> = {
  milk: 'Milk', egg: 'Eggs', wheat: 'Wheat', gluten: 'Gluten', peanut: 'Peanuts', 'tree-nut': 'Tree nuts',
  soy: 'Soy', sesame: 'Sesame', fish: 'Fish', shellfish: 'Shellfish',
};

/** Shown next to the adult icon on a step ("Grown-up: hot oven"). */
export const HAZARD_LABELS: Record<Hazard, string> = {
  heat: 'Hot oven or stove', sharp: 'Sharp knife or scissors', 'hot-liquid': 'Hot liquid', electric: 'Plug-in gadget',
  'small-parts': 'Small parts', 'hot-glue': 'Hot glue', 'raw-egg': 'Raw egg', choking: 'Choking risk', candle: 'Candle flame',
};

/** Icon ids for `src/ui/icons.ts`. */
export const HAZARD_ICON: Record<Hazard, string> = {
  heat: 'flame', sharp: 'knife', 'hot-liquid': 'steam', electric: 'plug', 'small-parts': 'beads',
  'hot-glue': 'glue-gun', 'raw-egg': 'egg', choking: 'warning', candle: 'candle',
};

export interface LexiconEntry { readonly pattern: RegExp; readonly allergen: Allergen }

const entry = (allergen: Allergen, pattern: RegExp): LexiconEntry => ({ pattern, allergen });

/** Breads, pastas and bakes that are wheat unless a lookbehind says otherwise (rice noodles, rice crackers…). */
const WHEATY_FOODS = /(?<!\b(?:rice|glass|corn|gluten-free|gf)\s)\b(?:bread|breadcrumbs?|pitt?a|naan|bagels?|croissants?|brioche|panko|crackers?|graham|cookies?|cookies?|pretzels?|pasta|spaghetti|macaroni|noodles?|couscous|semolina|seitan|wonton|dumpling wrappers?|filo|phyllo|pastry|cake mix|ladyfingers|sponge fingers|flour tortillas?|wafers?|waffle cones?|ice cream cones?)\b/i;

/**
 * Ingredient keywords → allergen. Used by the UI to suggest chips and by the content lint, which requires every match
 * to be declared in `allergens` or `mayContain`. Lookbehinds keep plant milks, nut butters and "cream of tartar" quiet.
 * Patterns never carry the `g` flag (a global regex keeps `lastIndex` state between `.test()` calls).
 */
export const ALLERGEN_LEXICON: readonly LexiconEntry[] = [
  // milk
  entry('milk', /(?<!\b(?:coconut|oat|almond|soy|soya|rice|cashew|hemp|pea|plant|nut|dairy-free)\s)\bmilk\b/i),
  entry('milk', /(?<!\b(?:peanut|sunflower|almond|cashew|nut|seed|cocoa|apple|pumpkin|shea)\s)\bbutter(?:milk)?\b(?!\s+beans?)/i),
  entry('milk', /(?<!\b(?:vegan|dairy-free)\s)\b(?:cheese|cheddar|mozzarella|parmesan|feta|ricotta|mascarpone|paneer|halloumi|brie)\b/i),
  entry('milk', /(?<!\b(?:coconut|soy|soya|oat|almond)\s)\byogh?urt\b/i),
  entry('milk', /(?<!\b(?:coconut|cashew)\s)\bcream\b(?!\s+of\s+tartar)/i),
  entry('milk', /\b(?:ghee|whey|custard|kefir|lassi|eggnog)\b/i),
  entry('milk', /(?<!\b(?:dairy-free|vegan)\s)\bchocolate\b/i),
  // egg
  // "chocolate eggs", "candy eggs" and "egg-shaped" are not egg.
  entry('egg', /(?<!\b(?:chocolate|candy|sugar|foil|plastic|easter|paper)\s)\b(?:eggs?|eggnog|mayonnaise|mayo|meringue|custard)\b(?!-(?:free|shaped))/i),
  // wheat + gluten (same keywords, both allergens)
  entry('wheat', /(?<!\b(?:almond|rice|corn|chickpea|gram|coconut|oat|buckwheat|tapioca|potato|cassava|gluten-free|gf)\s)\bflour\b/i),
  entry('gluten', /(?<!\b(?:almond|rice|corn|chickpea|gram|coconut|oat|buckwheat|tapioca|potato|cassava|gluten-free|gf)\s)\bflour\b/i),
  entry('wheat', /\bwheat\b(?!-free)/i),
  entry('gluten', /\bwheat\b(?!-free)/i),
  entry('wheat', WHEATY_FOODS),
  entry('gluten', WHEATY_FOODS),
  // gluten only (grains and products that may carry gluten without being wheat)
  entry('gluten', /\b(?:barley|rye|oats?|oatmeal|granola|malt|spelt|bulgur|farro|corn ?flakes)\b/i),
  // peanut
  entry('peanut', /\bpeanuts?\b/i),
  // tree nuts
  entry('tree-nut', /\b(?:almonds?|walnuts?|cashews?|pistachios?|pecans?|hazelnuts?|macadamias?|pine nuts?|brazil nuts?|marzipan|praline|frangipane|mixed nuts|tree nuts?|nut butter|chopped nuts|whole nuts)\b/i),
  // soy
  entry('soy', /\b(?:soy|soya|soybeans?|tofu|edamame|miso|tempeh|tamari)\b/i),
  entry('soy', /\bchocolate\b/i),
  // sesame
  entry('sesame', /\b(?:sesame|tahini|halva|halvah|gomashio)\b/i),
  // fish
  entry('fish', /(?<!\bswedish\s)\bfish\b(?![- ]shaped)/i),
  entry('fish', /\b(?:salmon|tuna|cod|anchov(?:y|ies)|sardines?|mackerel|trout|haddock|tilapia|worcestershire)\b/i),
  // shellfish
  entry('shellfish', /\b(?:shellfish|shrimps?|shrimp?|crab(?!\s*apple)|crabmeat|lobster|crayfish|crawfish|clams?|mussels?|oysters?|scallops?|squid|calamari)\b/i),
];


/** Allergens whose lexicon keywords appear in `text`, in canonical order, without duplicates. */
export function allergensIn(text: string): Allergen[] {
  const found = new Set<Allergen>();
  for (const { pattern, allergen } of ALLERGEN_LEXICON) if (pattern.test(text)) found.add(allergen);
  return ALLERGENS.filter((a) => found.has(a));
}

/** A step mentioning any of these needs `adult`, `hazards` or a `kidSafeOverride` (content lint). */
export const HAZARD_WORDS = /oven|stove|stovetop|boil|simmer|fry|bake|microwave|blender|knife|chop|slice|grate|peel|hot glue|scissors|candle|match|lighter/i;

/** A recipe whose ingredients mention any of these needs a `chokingNote` (content lint). */
export const CHOKING_WORDS = /whole (nuts|almonds)|popcorn|hard candy|grapes|marshmallow/i;
