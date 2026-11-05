import type { HolidayContent } from './types';

/**
 * TEMPLATE for a holiday content file. Copy to `holidays/<holiday-id>.ts` (the file name IS the holiday id from
 * registry.ts), fill every field, delete the comments you no longer need, then run:
 *
 *   npx vitest run test/content.test.ts
 *
 * The leading underscore keeps this file out of the content glob and out of the lint. Read docs/CONTENT_GUIDE.md first;
 * `holidays/halloween.ts` is the finished reference. Rules in brackets are enforced by the lint.
 */
const template: HolidayContent = {
  /**
   * STORY — one sentence per array element [tier 1: 3–5, tier 2: 2–4, tier 3: 1]. Present tense, kid-level,
   * ≤ 220 characters each, no abbreviations with full stops ("St Nicholas", not "St. Nicholas").
   * Say what the holiday means to the people who celebrate it: "Many families who celebrate…", "Some families…".
   */
  story: [
    'Sentence one says what the holiday is and who celebrates it.',
    'Sentence two says where it comes from, briefly and factually.',
    'Sentence three says what families do on the day.',
  ],

  /**
   * FACTS — [tier 1: 4–6 with ≥ 1 `wow` and ≥ 1 `bigKids`; tier 2: 2–3; tier 3: 1]. ≤ 300 characters each.
   * `wow: true` sparkles on the flip card (surprising, concrete). `bigKids: true` uses 9–12 wording (history, numbers).
   * Every fact must be checkable against something listed in `sources`.
   */
  facts: [
    { text: 'A surprising, concrete fact a five-year-old can repeat at dinner.', wow: true },
    { text: 'A fact with a date or a number, worded for 9–12 year olds.', bigKids: true },
    { text: 'A plain fact.' },
    { text: 'Another plain fact.' },
  ],

  /**
   * GREETINGS — [tier 1: ≥ 3; tier 2: ≥ 1; tier 3: none]. `lang` is a BCP-47 tag [/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/]:
   * 'es', 'zh-Hans', 'yue', 'es-MX'. `text` is the native script; add `roman` whenever `text` is not Latin script
   * [required by the lint]. `sayIt` is a kid respelling with CAPITALS on the stressed syllable. `meaning` is the plain
   * English. Verify every greeting against an authoritative source (a dictionary, a cultural institute) — never guess.
   */
  greetings: [
    { lang: 'es', langName: 'Spanish', text: '¡Feliz día!', sayIt: 'feh-LEES DEE-ah', meaning: 'Happy day!' },
    { lang: 'hi', langName: 'Hindi', text: 'शुभ दिन', roman: 'Shubh din', sayIt: 'shoob DIN', meaning: 'Good day' },
    { lang: 'fr', langName: 'French', text: 'Bonne fête !', sayIt: 'bun FET', meaning: 'Happy holiday!' },
  ],

  /**
   * RECIPES — [tier 1: ≥ 2, the first one `noHeat: true`; tier 2: optional; tier 3: none]. Titles are the ones in
   * spec §6 — they are binding. `id` is kebab-case and unique within the holiday.
   */
  recipes: [
    {
      id: 'no-heat-example',
      title: 'Rainbow Fruit Cups',
      emoji: '🍓',
      blurb: 'One sentence that makes a child want to make it.',
      minutes: 15, // total, including waiting
      serves: 4,
      difficulty: 1, // 1 easy, 2 some skill, 3 fiddly
      adultHelp: 'none', // 'none' | 'some' | 'needed' — [noHeat recipes may not be 'needed']
      noHeat: true, // [no step may carry 'heat' | 'hot-liquid' | 'electric' hazards]
      /**
       * `allergens` is REQUIRED; [] is a positive statement ("no major allergens"). Every ingredient keyword the
       * ALLERGEN_LEXICON recognizes (milk, butter, cheese, yogurt, cream, chocolate, egg, flour, bread, pasta, oats,
       * peanut, almond…, soy, sesame, fish, shrimp…) must appear here or in `mayContain` [lint].
       */
      allergens: [],
      mayContain: ['tree-nut'], // cross-contact you cannot rule out (nut-processing lines, oats and gluten)
      swaps: [{ avoid: 'tree-nut', use: 'sunflower seeds' }], // one line per allergen you can design out
      // chokingNote: REQUIRED when an ingredient mentions whole nuts, popcorn, hard candy, grapes or marshmallows [lint]
      equipment: ['Small cups', 'Spoon'], // plain strings; the hazard lint does not read these
      ingredients: [
        // Give BOTH `us` and `metric` with friendly numbers (1 cup / 240 ml, 1 tbsp / 15 ml, 1 tsp / 5 ml, 1 oz / 28 g).
        // Units: 'cup' | 'tbsp' | 'tsp' | 'oz' | 'lb' | 'g' | 'ml' | 'piece' | 'pinch' | 'slice' | 'can' | 'sheet'.
        { item: 'Strawberries', us: { qty: 1, unit: 'cup' }, metric: { qty: 150, unit: 'g' }, note: 'hulled' },
        { item: 'Sunflower seeds', us: { qty: 2, unit: 'tbsp' }, metric: { qty: 20, unit: 'g' }, optional: true },
        // Per-ingredient `allergens` lets the UI mark the chip next to the ingredient; keep it ⊆ the recipe's list.
      ],
      steps: [
        // One action per step, kid-readable. The LAST step always starts with "Taste test!" [lint] and may add a flourish.
        { text: 'Hull the strawberries and drop them into the cups.' },
        // A step mentioning oven/stove/stovetop/boil/simmer/fry/bake/microwave/blender/knife/chop/slice/grate/peel/hot glue/
        // scissors/candle/match/lighter MUST have `adult: true`, non-empty `hazards`, or a `kidSafeOverride` [lint].
        { text: 'Peel a banana and break it into chunks.', kidSafeOverride: 'Peeling a banana by hand: no peeler, no knife.' },
        { text: 'Sprinkle the seeds on top and wait 5 minutes for the juice to run.', timerMinutes: 5, tip: 'Patience is the secret ingredient.' },
        { text: 'Taste test! Which fruit is the juiciest?' },
      ],
      tip: 'One optional closing tip for the whole recipe.',
    },
    {
      id: 'heat-example',
      title: 'Warm Something (oven)',
      emoji: '🔥',
      blurb: 'The cooked recipe comes second.',
      minutes: 40,
      serves: 6,
      difficulty: 2,
      adultHelp: 'needed',
      noHeat: false,
      allergens: ['wheat', 'gluten', 'egg', 'milk'],
      equipment: ['Mixing bowl', 'Baking sheet', 'Oven gloves'],
      ingredients: [
        { item: 'All-purpose flour', us: { qty: 1, unit: 'cup' }, metric: { qty: 125, unit: 'g' }, allergens: ['wheat', 'gluten'] },
        { item: 'Egg', us: { qty: 1, unit: 'piece' }, metric: { qty: 1, unit: 'piece' }, allergens: ['egg'] },
        { item: 'Butter', us: { qty: 4, unit: 'tbsp' }, metric: { qty: 60, unit: 'g' }, allergens: ['milk'] },
      ],
      steps: [
        { text: 'A grown-up heats the oven to 180 °C (350 °F).', adult: true, hazards: ['heat'] },
        { text: 'Stir the flour, egg and butter together until it looks like wet sand.' },
        // Hazards: 'heat' | 'sharp' | 'hot-liquid' | 'electric' | 'small-parts' | 'hot-glue' | 'raw-egg' | 'choking' | 'candle'.
        // In a recipe, any step with heat / sharp / hot-liquid / electric hazards must also be `adult: true` [lint].
        { text: 'A grown-up slides the tray into the oven. Bake for 12 minutes.', adult: true, hazards: ['heat'], timerMinutes: 12 },
        { text: 'Taste test! Let them cool first: hot sugar bites back.' },
      ],
    },
  ],

  /**
   * CRAFTS — [tier 1: ≥ 1; tier 2: optional; tier 3: none]. `mess` 1 tidy … 3 very messy. `hazards` is required
   * ([] when there are none). Scissors in `materials` ⇒ 'sharp' in hazards; hot glue ⇒ 'hot-glue' [lint].
   * Candle crafts use battery tea lights, never real flames.
   */
  crafts: [
    {
      id: 'paper-example',
      title: 'Paper Something',
      emoji: '✂️',
      blurb: 'One sentence that says what you end up with.',
      minutes: 30,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'Colored paper', qty: '3 sheets' },
        { item: 'Scissors', substitute: 'ask a grown-up to pre-cut the shapes' },
        { item: 'Googly eyes', optional: true, substitute: 'paper circles' }, // small parts for under-3s: say so in a step tip
      ],
      steps: [
        { text: 'Fold the paper in half.' },
        { text: 'Use scissors to cut along the fold.', hazards: ['sharp'] }, // step-level hazards show the icon on that step
        { text: 'Glue the pieces together and give it a name.' },
      ],
      learn: 'Optional: the sneaky skill or idea inside the craft (symmetry, fractions, patience).',
    },
  ],

  // advent: Christmas only — exactly 24 doors, days 1..24, kinds 'fact' (12), 'joke' (8), 'craft' (4). Omit elsewhere.

  /** PARENT NOTE — optional, one or two sentences for the grown-up: date conventions, sensitivity, what to check. */
  parentNote: 'Dates depend on the sighting of the new moon, so the day may differ by one where you live.',

  /** SOURCES — plain-text citations (publisher + title), NO URLs. The lint rejects "http", "www." and ".com" anywhere. */
  sources: ["Encyclopaedia Britannica, 'Example Holiday'", "The British Museum, 'Festivals of light' (exhibition guide)"],
};

export default template;
