# Jubilee content guide

How to write a holiday for 5–12-year-olds that a parent is happy to leave on the kitchen tablet. One file per holiday in
`src/content/holidays/<holiday-id>.ts`, default-exporting a `HolidayContent` (types in `src/content/types.ts`). Copy
`src/content/_template.ts`; `holidays/halloween.ts` is the finished reference. Everything in **bold** below is checked by
`test/content.test.ts` — run `npx vitest run test/content.test.ts` before you hand a file over.

## 1. Tone

- **Present tense**, plain words, short sentences. Body text is read aloud by six-year-olds and skimmed by twelve-year-olds.
- One sentence per `story` element, **≤ 260 characters**. The lint counts sentences by looking for `. A` patterns, so
  avoid abbreviations with full stops ("St Nicholas" reads better than "St. Nicholas"); Dr., Mr., Mrs., Ms., St., Jr.,
  Sr., Mt., No. and vs. are excused because names like "Martin Luther King Jr. Day" need them.
- Delight without hype: no "amazing!!!", no "the best holiday ever". Let the fact be the wow.
- No commercial language: no brands, shops, products, "deals". A doughnut is a doughnut, not a brand name.
- Nothing scary for a five-year-old: Halloween is bedsheet ghosts; Day of the Dead is remembering, not death.
- Never mention a URL, a website, an app or "search for…". **No `http`, `www.` or `.com` in any string, anywhere.**

## 2. Cultural respect

- Say what the holiday means to the people who celebrate it: "Many families who celebrate Diwali…", "Some families…".
  Never "they" vs "we"; never "exotic", "strange", "mysterious"; never food as costume.
- Religious stories are short and factual: who, when, what people do today. No theology, no "the one true…".
- Use the names people use: `alsoCalled` is on the meta (registry.ts) — Lunar New Year / Chinese New Year / Tết /
  Seollal; Diwali / Deepavali; Hanukkah / Chanukah — and the story may use them too.
- Observational dates (Eid, Ramadan) are "expected"; the UI adds that label, but your `parentNote` should say that the
  day depends on the sighting of the new moon where you live. Diwali and Holi `alt` days and Passover's 7 days in Israel
  belong in `parentNote`, not in the story.
- Greetings are verified, never guessed (see §5). A wrong greeting is worse than none.
- Sources are real publications you checked: encyclopaedias, museums, cultural institutes, national observatories.

## 3. Per-tier requirements (spec §6)

| | tier 1 | tier 2 | tier 3 (silly, inline in `silly.ts`) |
|---|---|---|---|
| story sentences | **3–5** | **2–4** | **1** |
| facts | **4–6, ≥ 1 `wow`, ≥ 1 `bigKids`** | **2–3** | **1** |
| greetings | **≥ 3** (languages per spec §6) | **≥ 1** (one native language) | **0** |
| recipes | **≥ 2, first one `noHeat`** (titles per spec §6 are binding) | optional (✚ in spec §2.2) | **0** |
| crafts | **≥ 1** | optional | **0** |
| `advent` | Christmas only: **24 doors, days 1..24, 12 facts / 8 jokes / 4 crafts** | — | — |
| `parentNote` | recommended | recommended for faith/observational dates | — |
| `sources` | required in practice (one per fact you could be asked about) | recommended | — |

Spec §6 recipe/craft titles and allergen minimums per tier-1 holiday:

| holiday | recipe 1 (no heat) | recipe 2 | craft(s) | greetings |
|---|---|---|---|---|
| christmas | Snowman Marshmallow Pops [wheat, gluten, milk, soy] | Gingerbread Cookies (oven) [wheat, gluten, egg, milk] | Paper Snowflakes (scissors); Salt-Dough Ornaments (oven) | es, fr, de, tl, it |
| hanukkah | Jelly Doughnut Sandwiches [wheat, gluten] | Easy Latkes (stove, grater) [egg, wheat, gluten] | Paper Dreidel (scissors) | he, yi |
| diwali | Rainbow Fruit Chaat [] | Coconut Ladoo (stove) [milk] | Rice Rangoli (food-colour rice) | hi, gu, ta, pa |
| eid-al-fitr | Date & Seed Energy Balls [sesame; swap tree-nut] | Sheer Khurma (stove) [milk, wheat, gluten, tree-nut optional] | Paper Fanous Lantern (scissors) | ar, ur, tr, ms |
| lunar-new-year | Mandarin "Lantern" Fruit Cups [] | Lucky Dumplings (stove/boil) [wheat, gluten, soy] | Red Envelope Lanterns (scissors) | zh-Hans, yue, vi, ko |
| halloween | Banana Ghosts & Clementine Pumpkins [milk, soy] | Monster Mouth Apple Bites (knife) [peanut; swap sunflower butter] | Paper-Bag Puppet Monster | es, fr, de |
| thanksgiving | No-Bake Pumpkin Pie Cups [milk, wheat, gluten] | Cornbread Muffins (oven) [wheat, gluten, egg, milk] | Hand-Turkey Thank-You Cards | en, es, fr |
| easter | Bunny Fruit Pizza [wheat, gluten, milk] | Chocolate Cornflake Nests (microwave) [milk, soy, gluten] | Natural-Dye Eggs (stove, adult) | el, es, pl, de |
| holi | Rainbow Fruit Skewers with Natural Colour Powder [] | Mango Lassi (blender) [milk] | DIY Colour Powder | hi, gu, ne |
| day-of-the-dead | Marigold Orange Agua Fresca [] | Pan de Muerto Mini Rolls (oven) [wheat, gluten, egg, milk] | Papel Picado (scissors) | es, nah (optional) |
| kwanzaa | Fruit Kinara Plate [] | Sweet Potato Pie Cups (oven) [milk, egg, wheat, gluten] | Cardboard Kinara (battery tea lights) | sw |
| juneteenth | Strawberry Soda Floats [milk] | Red Velvet Cupcakes (oven) [wheat, gluten, egg, milk] | Freedom Star Banner | en, es |
| nowruz | Haft-Seen Fruit & Seed Plate [sesame; swap tree-nut] | Sholeh Zard Saffron Rice Pudding (stove) [tree-nut optional] | Sabzeh Sprouting Cup | fa, ku, prs, az |
| mid-autumn-festival | Mooncake-Stamped Cookie Sandwiches [wheat, gluten, milk, soy] | Sweet Tangyuan (stove/boil) [] | Paper Moon Lantern (scissors) | zh-Hans, yue, vi, ko |
| st-patricks-day | Rainbow Fruit & Cloud Dip [milk] | Irish Soda Bread Mini Loaves (oven) [wheat, gluten, milk] | Shamrock Potato-Stamp Prints (knife, adult) | ga, en |
| valentines-day | Heart Fruit Skewers with Yogurt Dip [milk] | Chocolate-Dipped Strawberries (microwave) [milk, soy] | Heart Pop-Up Card (scissors) | fr, es, ja, de |
| mothers-day | Breakfast-in-Bed Parfaits [milk, gluten] | Flower Pancakes (stove) [wheat, gluten, egg, milk] | Tissue-Paper Flower Bouquet | es, fr, zh-Hans, hi |
| fathers-day | Super Trail Mix [tree-nut, peanut; swap seeds; chokingNote] | Best-Ever Grilled Cheese (stove) [wheat, gluten, milk] | Paper Airplane Fleet | es, fr, de, pt |
| independence-day-us | Flag Fruit Platter [] | Sparkler Juice Popsicles (freezer) [] | Salad-Spinner Fireworks Painting | en, es |
| earth-day | Dirt Cups with Gummy Worms [milk, wheat, gluten, soy] | Rainbow Veggie Wraps (knife) [wheat, gluten, milk] | Seed Bombs | es, fr, sw, hi |
| pi-day | Pudding Pie Cups [milk, wheat, gluten] | Mini Fruit Hand Pies (oven) [wheat, gluten, egg, milk] | Pi Paper Chain | en, es, el |
| new-years-eve | Sparkling Mocktail Toast [] | Confetti Popcorn (microwave) [milk, soy; chokingNote] | Confetti Poppers (small-parts) | es, zh-Hans, ja, de, fr |

Tier-2 greeting languages (one native language each): three-kings es/fr, lantern zh-Hans, purim he, passover he, ramadan
ar, orthodox-easter el/ru, songkran th, cinco es, kodomo ja, eid-al-adha ar/ur, dragon-boat zh-Hans, canada en/fr,
bastille fr, india hi, mexico es, chuseok ko, rosh-hashanah he, bonfire en, st-nicholas de/nl, boxing en, others en.

## 4. Facts

- `wow: true` = surprising and concrete ("bats aren't blind"). `bigKids: true` = 9–12 wording: a date, a number, a why.
- One idea per fact, ≤ 300 characters. A number beats an adjective. Round numbers honestly ("more than 1,200 kg").
- Every fact must be checkable against an entry in `sources`. If you cannot find a source, cut the fact.

## 5. Greetings

- `lang`: BCP-47 — `es`, `fr`, `zh-Hans`, `yue`, `es-MX`. **Pattern `^[a-z]{2,3}(-[A-Za-z]{2,4})?$`.**
- `text`: native script with the language's own punctuation (`¡Feliz Halloween!`, `Joyeux Halloween !`). No emoji.
- **`roman` is required whenever `text` is not Latin script** (Hebrew, Arabic, Devanagari, Chinese, Korean, Thai…).
  The lint detects non-Latin characters with `/[^\u0000-ɏḀ-ỿ\s\p{P}\p{N}]/u`.
- `sayIt`: a kid respelling, hyphenated syllables, CAPITALS on the stressed syllable: `nah-mas-TAY`.
- `meaning`: plain English; add the literal meaning in brackets when it is charming ("literally 'sweet or trick'").
- Verification rule: check every greeting against an authoritative written source (a published dictionary, a cultural
  institute, a university language page) and listen to a native recording if you can. Never machine-translate.
  When two spellings are common, use the one a child would see on a card in that country.

## 6. Recipes

Safety rules (spec §10.3), all enforced:

- **`allergens` is required**; `[]` is a positive statement and renders "No major allergens — always check your own
  labels". Declare the *minimum* set from spec §6 and add anything your ingredients bring in.
- **Every ingredient keyword the lexicon recognises must be in `allergens` or `mayContain`.** The lexicon
  (`src/content/allergens.ts`) maps: milk/butter/cheese/yogurt/cream/ghee/paneer/chocolate → milk; egg/mayonnaise/
  meringue/custard → egg; flour/wheat/bread/pasta/cracker/graham/cookie/biscuit/flour tortilla/couscous/semolina/
  breadcrumb/pretzel/noodles → wheat **and** gluten; barley/rye/oats/granola/cornflakes/malt → gluten; peanut → peanut;
  almond/walnut/cashew/pistachio/pecan/hazelnut/macadamia/pine nut → tree-nut; soy/tofu/edamame/miso/chocolate → soy;
  sesame/tahini → sesame; fish/salmon/tuna/anchovy → fish; shrimp/prawn/crab/lobster → shellfish. Plant milks, nut
  butters and "cream of tartar" are excluded by lookbehinds; "oat milk" still flags gluten (put it in `mayContain`).
  Soy sauce usually contains wheat: declare wheat and gluten too.
- `mayContain` is for cross-contact you cannot rule out (nut lines, oats). `swaps` is one line per allergen you can
  design out: `{ avoid: 'peanut', use: 'sunflower seed butter' }`.
- **`chokingNote` is required** when an ingredient mentions whole nuts/almonds, popcorn, hard candy, grapes or
  marshmallows. Say who it is for and what to do ("cut grapes lengthways for under-fours").
- Honey: never in a recipe aimed at babies; if a recipe uses honey, the `parentNote` or the ingredient `note` says
  "not for children under one".
- **`noHeat: true` recipes** have no step with `heat`, `hot-liquid` or `electric` hazards and `adultHelp` is not
  `'needed'`. A knife step (`sharp`) is allowed in a no-heat recipe when it is marked `adult: true`.
- **Hazard words.** A step whose text matches `oven|stove|hob|boil|simmer|fry|bake|microwave|blender|knife|chop|slice|
  grate|peel|hot glue|scissors|candle|match|lighter` must have `adult: true`, a non-empty `hazards` list, or a
  `kidSafeOverride` explaining why it is safe ("peeling a banana by hand"). Prefer rewording over overriding:
  "snap the celery" instead of "slice the celery".
- **In a recipe, any step with `heat`, `sharp`, `hot-liquid` or `electric` hazards is also `adult: true`.** The UI shows
  the adult icon and the hazard name on that step.
- **The last step of every recipe starts with "Taste test!"** and no earlier step does. Step Mode ends on it (spec §9.8);
  add a flourish after it if you like ("Taste test! Dip a wedge in the honey and say Shanah Tovah"). The UI's
  `copy.tasteTest` string is only a fallback for recipes without one, so it never doubles up.
- Steps are one action each, in the order a child does them; `timerMinutes` on any waiting/baking step;
  `tip` for the trick that makes it work.

Measures: give **both** `us` and `metric` for every ingredient, in friendly numbers: 1 cup → 240 ml, ½ cup → 120 ml,
1 tbsp → 15 ml, 1 tsp → 5 ml, 1 oz → 28 g, 8 oz → 225 g, 1 lb → 454 g (450 g is fine). Use `piece` for whole items
(2 bananas), `pinch` for seasoning, `slice`, `can`, `sheet` where natural. Fractions as decimals (`0.25`, `0.5`); the UI
formats them. Quantities are for the stated `serves`.

## 7. Crafts

- `hazards` is required (`[]` when none). **Scissors in materials ⇒ `'sharp'`; hot glue ⇒ `'hot-glue'`.** Googly eyes,
  beads and balloons are `'small-parts'`; say the age in a tip. Candle crafts (kinara, menorah) use battery tea
  lights, never flames — `'candle'` is only for a real one, which we do not do.
- `mess` 1 = paper and glue stick, 2 = paint or flour, 3 = dye, glitter, food colouring on hands.
- `adultHelp` is `'some'` whenever any step has a hazard; `'needed'` for ovens, irons, craft knives.
- Steps follow the recipe rules above (hazard words need `hazards`, `adult` or an override). `materials` list
  `substitute`s for anything a family may not have; mark `optional` items.
- `learn` (optional): the sneaky skill inside the craft, one sentence.

## 8. Dates in text

Never write a Gregorian date for a table-based holiday ("Diwali is on 8 November") — it changes every year and the UI
shows the right one. "Diwali falls in October or November" is fine. Fixed holidays may say the date.

## 9. The lint in plain English (`test/content.test.ts`)

Registry: 76 metas; unique ids and sticker ids; tier counts 22/30/24; every `relative.to`, `untilTable`, theme and
effect id resolves; `dayNames.length` equals the span length; `days` is present whenever `startOffset` or
`mainDayOffset` is; `mainDayOffset` is inside the span; regions are valid; priority follows the tag rule
(faith/national 10, family 5, silly −10, else 0); taglines ≤ 60 characters.

Coverage: every tier-1 and tier-2 id has a file in `src/content/holidays/` (red until every author has delivered).

Each content file: the tier requirements above; story sentences 1–260 characters, one sentence each, ending in
punctuation; facts ≤ 300 characters; greetings valid; recipe and craft rules above (including "the last step starts
with Taste test!"); recipe/craft ids unique and kebab-case; `minutes`, `serves` positive; ingredients have a `us` or
`metric` measure; Christmas advent doors; no `http`/`www.`/`.com` in any string in the whole object graph; `sources`
are plain text.

Silly days: one story sentence, one fact, no recipes, greetings or crafts, and the loader serves them inline.
