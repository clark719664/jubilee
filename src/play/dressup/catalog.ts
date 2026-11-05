/**
 * catalog.ts — everything Jubi can wear, as data (no DOM, so the respect rules and the season math are
 * tested in Node). The drawings live in art-*.ts, keyed by the same ids.
 *
 * Six slots: a hat (or a hair clip), glasses, something round the neck, something held in Jubi's
 * right hand, a glow color and a body pattern. Every item is always available: holidays only decide
 * which items sparkle and come first ("in season"), never which ones a child may use.
 *
 * Respect (ART_BRIEF, competitive plan do_not_copy): no religious garments or sacred symbols as
 * costumes. `DENY_WORDS` is checked against every id and name by the test, and any wearable item tagged
 * with a faith holiday must carry a `respect` note saying why it is a folk or festive thing (Santa,
 * the Easter bunny, a lion-dance headband), so a reviewer sees the reasoning next to the data.
 */
import type { HolidayId, Tag } from '../../content/types';

export type Slot = 'hat' | 'glasses' | 'neck' | 'held' | 'glow' | 'pattern';
export const SLOTS: readonly Slot[] = ['hat', 'glasses', 'neck', 'held', 'glow', 'pattern'];
/** Slots that are things Jubi puts on (the respect rule for garments applies to these). */
export const WEARABLE_SLOTS: readonly Slot[] = ['hat', 'glasses', 'neck'];

/** Tags that may put an item in season; 'sweets', 'faith', 'national', 'family' and 'world' are too broad. */
export const SEASON_TAGS: readonly Tag[] = ['lights', 'spooky', 'spring', 'silly', 'harvest', 'new-year'];

export interface Item {
  readonly id: string;
  readonly slot: Slot;
  /** Kid-facing name, "Santa hat". */
  readonly name: string;
  /** Holidays this item belongs to (exact ids). */
  readonly holidays: readonly HolidayId[];
  /** Holiday tags that also put it in season (from SEASON_TAGS). */
  readonly tags?: readonly Tag[];
  /** What Jubi says when putting it on. */
  readonly says?: string;
  /** Hats that cover the top point: the lantern cap and the party hat step aside. */
  readonly coversTop?: boolean;
  /** Why a wearable tagged with a faith holiday is a festive, not a religious, thing. */
  readonly respect?: string;
  /** Glow and pattern swatches: the colors that draw them. */
  readonly colors?: readonly string[];
}

const hat = (id: string, name: string, holidays: HolidayId[], more: Partial<Item> = {}): Item =>
  ({ id, slot: 'hat', name, holidays, coversTop: true, ...more });
const clip = (id: string, name: string, holidays: HolidayId[], more: Partial<Item> = {}): Item =>
  ({ id, slot: 'hat', name, holidays, ...more });
const item = (slot: Slot, id: string, name: string, holidays: HolidayId[], more: Partial<Item> = {}): Item =>
  ({ id, slot, name, holidays, ...more });

export const ITEMS: readonly Item[] = [
  // ── hats and hair clips ──
  hat('santa-hat', 'Santa hat', ['christmas', 'st-nicholas-day', 'boxing-day'], { says: 'Ho ho ho!', respect: 'Santa is folklore, not a religious figure.' }),
  hat('elf-hat', 'Elf hat', ['christmas', 'boxing-day'], { says: 'Elf on duty!', respect: 'Elves are Christmas folklore.' }),
  hat('antlers', 'Reindeer antlers', ['christmas'], { says: 'Ready to fly!', respect: 'Reindeer belong to the Santa folk story.' }),
  hat('witch-hat', 'Witch hat', ['halloween'], { tags: ['spooky'], says: 'Abracadabra!' }),
  hat('paper-crown', 'Paper crown', ['christmas', 'three-kings-day', 'boxing-day', 'purim'], { says: 'Your Majesty Jubi!', respect: 'A paper party crown from a cracker or a cake, not a religious garment.' }),
  hat('party-hat', 'Party hat', ['new-years-eve', 'new-years-day', 'childrens-day', 'happiness-day', 'friendship-day', 'emoji-day', 'leap-day'], { tags: ['silly', 'new-year'], says: 'Party time!' }),
  hat('flower-crown', 'Flower crown', ['mothers-day', 'nowruz', 'earth-day'], { tags: ['spring'], says: 'I smell like spring!' }),
  hat('top-hat', 'Tiny top hat', ['new-years-eve', 'groundhog-day', 'fathers-day', 'grandparents-day', 'purim', 'leap-day'], { says: 'How do you do?', respect: 'A party top hat, the Purim costume fun kind.' }),
  hat('leprechaun-hat', 'Leprechaun hat', ['st-patricks-day'], { says: 'Top o’ the morning!', respect: 'Leprechauns are Irish folklore.' }),
  hat('beanie', 'Bobble beanie', ['new-years-day', 'groundhog-day', 'christmas', 'mlk-day'], { says: 'Cozy toes!', respect: 'A chunky winter bobble hat, ordinary winter clothes.' }),
  hat('sun-hat', 'Sun hat', ['independence-day-us', 'juneteenth', 'canada-day', 'memorial-day', 'labor-day', 'songkran', 'oceans-day'], { says: 'Sunshine!', respect: 'Sun clothes for a hot day of water fights.' }),
  hat('bunny-ears', 'Bunny ears', ['easter'], { tags: ['spring'], says: 'Hop hop!', respect: 'The Easter bunny is folklore.' }),
  hat('lion-headband', 'Lion-dance headband', ['lunar-new-year', 'lantern-festival'], { says: 'Rawr! Happy New Year!', respect: 'Lion dancing is a festive folk performance; this is a party headband.' }),
  hat('grad-cap', 'Thinking cap', ['pi-day', 'book-day', 'puzzle-day', 'pi-approximation-day'], { says: 'I know 3.14 things!' }),
  hat('pirate-hat', 'Pirate hat', ['pirate-day'], { says: 'Arr, matey!' }),
  hat('chef-hat', 'Chef hat', ['pancake-day', 'pizza-day', 'donut-day', 'thanksgiving'], { says: 'Yum yum!', respect: 'Kitchen clothes for cooking the feast.' }),
  hat('bee-boppers', 'Bee boppers', ['bee-day', 'wildlife-day', 'animal-day'], { says: 'Bzzzz!' }),
  clip('shamrock-clip', 'Shamrock clip', ['st-patricks-day'], { says: 'Lucky me!', respect: 'A shamrock is the festive leaf of the day.' }),
  clip('marigold-clip', 'Marigold clip', ['diwali', 'day-of-the-dead'], { says: 'So bright!', respect: 'A flower for the hair; marigolds decorate homes for both festivals.' }),
  clip('heart-bow', 'Heart bow', ['valentines-day', 'kindness-day', 'smile-day'], { says: 'Love you!' }),

  // ── glasses ──
  item('glasses', 'heart-glasses', 'Heart glasses', ['valentines-day', 'smile-day', 'kindness-day', 'friendship-day'], { says: 'Everything looks lovely!' }),
  item('glasses', 'star-glasses', 'Star glasses', ['new-years-eve', 'independence-day-us', 'happiness-day', 'star-wars-day'], { tags: ['new-year'], says: 'Superstar!' }),
  item('glasses', 'round-glasses', 'Round glasses', ['book-day', 'pi-day', 'puzzle-day', 'grandparents-day'], { says: 'Very clever!' }),
  item('glasses', 'sunglasses', 'Sunglasses', ['juneteenth', 'canada-day', 'songkran', 'ice-cream-day', 'memorial-day', 'labor-day', 'oceans-day', 'emoji-day'], { says: 'Too cool!', respect: 'Sun clothes for a hot day of water fights.' }),
  item('glasses', 'rainbow-glasses', 'Rainbow glasses', ['holi', 'happiness-day', 'dot-day'], { tags: ['silly'], says: 'So many colors!', respect: 'Party glasses for the festival of colors.' }),

  // ── round the neck ──
  item('neck', 'scarf', 'Stripy scarf', ['christmas', 'hanukkah', 'new-years-day', 'groundhog-day', 'thanksgiving', 'bonfire-night'], { says: 'Snug as a bug!', respect: 'A winter scarf, ordinary winter clothes.' }),
  item('neck', 'bow-tie', 'Bow tie', ['fathers-day', 'new-years-eve', 'grandparents-day', 'childrens-day'], { says: 'Very smart!' }),
  item('neck', 'lei', 'Flower garland', ['oceans-day', 'friendship-day', 'happiness-day', 'mothers-day'], { tags: ['spring'], says: 'Aloha, flowers!' }),
  item('neck', 'medal', 'Gold medal', ['kindness-day', 'smile-day', 'mothers-day', 'fathers-day', 'grandparents-day'], { says: 'Best friend award!' }),
  item('neck', 'snowflake-necklace', 'Snowflake necklace', ['christmas', 'hanukkah', 'new-years-day', 'groundhog-day'], { says: 'Sparkly and frosty!', respect: 'A snowflake is winter weather, not a religious symbol.' }),
  item('neck', 'tinsel', 'Tinsel boa', ['new-years-eve', 'christmas'], { tags: ['new-year'], says: 'Shimmer shimmer!', respect: 'Party tinsel.' }),
  item('neck', 'bandana', 'Pirate bandana', ['pirate-day'], { says: 'Yo ho ho!' }),

  // ── held in Jubi's hand ──
  item('held', 'paper-lantern', 'Paper lantern', ['lunar-new-year', 'lantern-festival', 'mid-autumn-festival'], { tags: ['lights'], says: 'Glow glow!' }),
  item('held', 'fanous', 'Ramadan lantern', ['ramadan', 'eid-al-fitr', 'eid-al-adha'], { says: 'What a pretty light!' }),
  item('held', 'diya', 'Diya lamp', ['diwali'], { tags: ['lights'], says: 'Careful, little flame!' }),
  item('held', 'dreidel', 'Dreidel', ['hanukkah'], { says: 'Spin spin spin!' }),
  item('held', 'balloon', 'Balloon', ['childrens-day', 'happiness-day', 'friendship-day', 'smile-day', 'emoji-day', 'leap-day', 'new-years-day'], { tags: ['silly'], says: 'Up, up and away!' }),
  item('held', 'pumpkin-pail', 'Pumpkin pail', ['halloween'], { tags: ['spooky'], says: 'Trick or treat!' }),
  item('held', 'pinwheel', 'Pinwheel', ['childrens-day-japan', 'earth-day', 'nowruz'], { tags: ['spring'], says: 'Whoosh!' }),
  item('held', 'kite', 'Kite', ['independence-day-india', 'earth-day'], { tags: ['spring'], says: 'Fly high!' }),
  item('held', 'paper-plane', 'Paper plane', ['fathers-day', 'hello-day'], { says: 'Neeeyoom!' }),
  item('held', 'present', 'Wrapped present', ['christmas', 'hanukkah', 'three-kings-day', 'boxing-day', 'st-nicholas-day', 'eid-al-fitr', 'mothers-day', 'fathers-day', 'kindness-day'], { says: 'It’s for you!' }),
  item('held', 'mooncake', 'Mooncake', ['mid-autumn-festival'], { says: 'Nom nom!' }),
  item('held', 'red-envelope', 'Red envelope', ['lunar-new-year'], { says: 'Lucky red!' }),
  item('held', 'paintbrush', 'Paintbrush', ['dot-day', 'book-day', 'emoji-day'], { says: 'Let’s make art!' }),
  item('held', 'color-bowl', 'Bowl of colors', ['holi'], { says: 'Splash of color!' }),
  item('held', 'umbrella', 'Umbrella', ['songkran', 'dragon-boat-festival'], { says: 'Splish splash!' }),
  item('held', 'magic-wand', 'Magic wand', ['tooth-fairy-day', 'purim', 'halloween', 'april-fools-day'], { says: 'Ta-da!' }),
  item('held', 'egg-basket', 'Egg basket', ['easter', 'orthodox-easter', 'nowruz'], { tags: ['spring'], says: 'I found eggs!' }),
  item('held', 'flower-bunch', 'Bunch of flowers', ['mothers-day', 'valentines-day', 'grandparents-day'], { tags: ['spring'], says: 'These are for you!' }),
  item('held', 'heart-lolly', 'Heart lollipop', ['valentines-day'], { says: 'Sweet!' }),
  item('held', 'ice-cream', 'Ice cream', ['ice-cream-day', 'independence-day-us', 'juneteenth'], { says: 'Brain freeze!' }),
  item('held', 'fall-leaf', 'Autumn leaf', ['thanksgiving', 'indigenous-peoples-day', 'chuseok'], { tags: ['harvest'], says: 'Crunch crunch!' }),
  item('held', 'fruit-basket', 'Fruit basket', ['kwanzaa', 'thanksgiving', 'chuseok'], { tags: ['harvest'], says: 'Fresh fruit for everyone!' }),

  // ── glow colors (the halo behind Jubi) ──
  item('glow', 'glow-sunny', 'Sunny glow', ['diwali', 'hanukkah', 'mid-autumn-festival'], { colors: ['#ffd166', '#ffb703'] }),
  item('glow', 'glow-rose', 'Rose glow', ['valentines-day', 'mothers-day'], { colors: ['#ff8fb8', '#ff4d9d'] }),
  item('glow', 'glow-mint', 'Mint glow', ['st-patricks-day', 'eid-al-fitr', 'earth-day'], { colors: ['#9be7d3', '#2ec4a6'] }),
  item('glow', 'glow-ocean', 'Ocean glow', ['hanukkah', 'songkran', 'oceans-day'], { colors: ['#8fd3ff', '#3a86ff'] }),
  item('glow', 'glow-grape', 'Grape glow', ['halloween', 'purim'], { colors: ['#c3a6ff', '#7b4dff'] }),
  item('glow', 'glow-ember', 'Ember glow', ['bonfire-night', 'thanksgiving', 'day-of-the-dead'], { colors: ['#ffb37a', '#ff6b1a'] }),
  item('glow', 'glow-rainbow', 'Rainbow glow', ['holi', 'happiness-day'], { tags: ['silly'], colors: ['#ff5e7e', '#ffb703', '#ffe066', '#5ed27a', '#4cc9f0', '#9b6bff'] }),

  // ── patterns on Jubi's body ──
  item('pattern', 'stripes', 'Stripes', ['christmas'], { colors: ['#ffffff', '#ff5e7e'] }),
  item('pattern', 'dots', 'Polka dots', ['dot-day', 'childrens-day'], { tags: ['silly'], colors: ['#ff8fb8', '#ffffff'] }),
  item('pattern', 'stars', 'Little stars', ['new-years-eve', 'independence-day-us'], { colors: ['#ffffff', '#fff3c4'] }),
  item('pattern', 'rainbow', 'Rainbow', ['holi', 'happiness-day'], { colors: ['#ff5e7e', '#ffb703', '#ffe066', '#5ed27a', '#4cc9f0', '#9b6bff'] }),
  item('pattern', 'hearts', 'Hearts', ['valentines-day', 'kindness-day'], { colors: ['#ff4d6d', '#ffffff'] }),
];

/** Words that must never name a dress-up item (religious garments, sacred objects and figures). */
export const DENY_WORDS: readonly string[] = [
  'hijab', 'niqab', 'burqa', 'veil', 'kippah', 'yarmulke', 'kippa', 'tallit', 'tefillin', 'turban', 'dastar', 'patka', 'kufi',
  'taqiyah', 'skullcap', 'mitre', 'miter', 'habit', 'nun', 'priest', 'monk', 'robe', 'rosary', 'crucifix', 'cross', 'halo',
  'angel', 'saint', 'prophet', 'deity', 'god', 'bindi', 'tilak', 'sindoor', 'kara', 'kirpan', 'menorah', 'kinara', 'shofar',
  'prayer', 'sacred', 'holy', 'crescent', 'tikka', 'headdress', 'war bonnet', 'feather bonnet',
];

export const ITEM_BY_ID: ReadonlyMap<string, Item> = new Map(ITEMS.map((i) => [i.id, i]));

export function itemsFor(slot: Slot): readonly Item[] {
  return ITEMS.filter((i) => i.slot === slot);
}

export function itemById(id: string | undefined): Item | undefined {
  return id === undefined ? undefined : ITEM_BY_ID.get(id);
}
