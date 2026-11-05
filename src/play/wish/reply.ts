/**
 * reply.ts — Santa's letter back, written on the device the morning after (pure, deterministic).
 *
 * The reply is assembled from templated paragraphs in five slots (opening, wishes, kindness, North
 * Pole news, closing) plus a greeting, a sign-off and an elf's P.S. The choice is made by mulberry32
 * seeded with a hash of the letter (its words, wish chips, name) and the year, so the same letter
 * always gets the same reply and two siblings get different ones. It mentions up to two of the chips
 * the child picked and their first name when one is stored.
 *
 * House rules for every template (checked by the test): warm, never judging (no naughty-or-nice,
 * nothing about being "good enough"), never promising a present ("I'll see what the elves can do"
 * is as far as Santa goes), never mentions money, shops, email or the internet.
 */
import { mulberry32 } from '../../effects/rng';
import type { WishLetter, WishReply } from './letter';
import { chipById, skinById } from './skins';

/** FNV-1a over UTF-16 code units: tiny, stable across engines, good enough to spread seeds. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function seedFor(letter: WishLetter): number {
  return hashString(`${letter.text}\u0001${letter.kind}\u0001${letter.chips.join(',')}\u0001${letter.name ?? ''}\u0001${letter.year}`);
}

export const GREETINGS_NAMED: readonly string[] = [
  'Dear {name},', 'Ho ho ho, {name}!', 'Hello, hello, {name}!', 'My dear friend {name},', 'Warm wishes from the snow, {name}!',
];
export const GREETINGS_PLAIN: readonly string[] = [
  'Dear friend,', 'Ho ho ho, my friend!', 'Hello, hello, little letter-writer!', 'My dear friend,',
];

export const OPENINGS: readonly string[] = [
  'Your letter landed in my workshop this morning with a happy little bump, right next to my cocoa. I read it twice!',
  'The reindeer found your letter fluttering over the snowy hills and carried it straight to my big armchair by the fire.',
  'Thank you for your wonderful letter, {name}! Mrs. Claus says it is one of the cheeriest letters she has ever seen.',
  'What a treat to open your letter! The elves gathered round to look at your wishes, and their bells jingled with excitement.',
  'Your letter arrived just as the snow began to fall, and I read every word with my reading glasses on the tip of my nose.',
  'I keep the very best letters in a basket by the fireplace, and yours went right on top, {name}.',
  'A snowy owl tapped on my window this morning, and there was your letter! I opened it straight away.',
  'Rudolph spotted your letter first. His nose glowed extra bright, which is how I know a letter is special.',
];

/** Two wishes: {w1} and {w2}. */
export const WISHES_TWO: readonly string[] = [
  'I see you are wishing for {w1} and {w2}. What splendid wishes! I have written them in my big book, and I will see what the elves can do.',
  'The elves were very interested in {w1}, and someone in the workshop got quite giggly about {w2}. I have pinned both wishes to my map.',
  '{W1} and {w2}! Those are lovely things to wish for. Wishes are funny and wonderful, and I will see what my helpers can do.',
  'I read about {w1} and {w2}, and I smiled so wide my beard wiggled. Every wish tells me a little bit about you, and I like what I learned.',
  'You wished for {w1} and {w2}. I have tucked those wishes safely into my pocket, right beside my lucky peppermint.',
];

/** One wish: {w1}. */
export const WISHES_ONE: readonly string[] = [
  'You wished for {w1}. What a wish! I have written it in my big book in my very best handwriting.',
  'I see you are dreaming about {w1}. The elves and I will see what we can do, and either way, it is a wonderful thing to wish for.',
  '{W1}! That is a wish full of sparkle. I have pinned it to the big map in my workshop.',
  'Your wish for {w1} made the reindeer prance about in the stable. I will see what the elves can do.',
];

/** No chips: the child wrote words instead (or only the kindness line). */
export const WISHES_WORDS: readonly string[] = [
  'I read all {words} of your letter by the fire. Thank you for telling me what is in your heart.',
  'You wrote me such interesting things! I read all {words} of your letter, then read the best bits aloud to the reindeer.',
  'Thank you for writing to me in your own words. Letters written from the heart are my very favorite kind.',
];

/** Kindness in the child's own words, quoted as a whole sentence: {kind}. */
export const KIND_SAID: readonly string[] = [
  'You wrote, “{kind}” That warmed me up more than a mug of cocoa. Kindness is the best magic there is.',
  'I loved this bit of your letter: “{kind}” Little kind things are like twinkly lights. They make everything brighter.',
  'When I read “{kind}” out loud, the elves cheered! Kindness travels all the way to the North Pole, you know.',
  '“{kind}” Now that is just the sort of thing that makes the world a cosier place. Thank you for telling me.',
];

/** Kindness without words from the child: a gentle, non-judging thought. */
export const KIND_GENTLE: readonly string[] = [
  'Here at the North Pole we have a saying: a kind word is like a warm mitten. I hope you find lots of chances to share warm mittens this winter.',
  'Mrs. Claus asked me to tell you that the best thing about this time of year is being together and being kind. She is very wise.',
  'Did you know a smile is the smallest present in the world? It fits in any pocket, and you can give away as many as you like.',
  'The elves have a game this year: every time one of them does something kind, they hang a little star in the workshop. It is getting very twinkly in here!',
];

export const NEWS: readonly string[] = [
  'Here is some news from the North Pole: Dasher has learned to do a twirl in the air, and Comet keeps trying to copy him.',
  'The elves built a snow-castle so tall this week that we had to put a little flag on top so the owls would not bump into it.',
  'Mrs. Claus has been baking gingerbread all week. The whole workshop smells of cinnamon, and the reindeer keep peeking in the kitchen window.',
  'Last night the northern lights danced green and pink over the workshop, and all the elves lay on their backs in the snow to watch.',
  'Our youngest elf, Pip, tried to wrap a present and wrapped himself up by mistake. We laughed until our tummies hurt (Pip laughed too).',
  'A family of snowy hares has moved in next to the stables. They like to race the reindeer, and they usually win.',
  'The elves held a snowball contest yesterday. Nobody kept score, so everybody won, which is the North Pole way.',
  'I have been practicing my "ho ho ho" every morning. Mrs. Claus says it is getting so jolly that it shakes the icicles.',
  'Blitzen has a new favorite snack: carrot slices with a sprinkle of snow. He says it is crunchy and refreshing.',
  'The elves painted every door in the workshop a different color this year, so now it looks like a rainbow made of gingerbread.',
];

export const CLOSINGS: readonly string[] = [
  'Have the cosiest, happiest holidays, {name}. Remember to look up at the stars on Christmas Eve!',
  'Thank you for writing to me. Keep being exactly you, {name}. The world is brighter with you in it.',
  'I hope your holidays are full of hugs, giggles and warm socks. Until next time, {name}!',
  'Now I must get back to the workshop before the elves eat all the cookies. Wishing you a magical Christmas, {name}!',
  'Sleep tight on Christmas Eve, {name}, and give your family a big hug from me.',
  'Your letter is safe in my basket by the fire. Merry Christmas, {name}, from all of us at the North Pole!',
];

export const SIGNOFFS: readonly string[] = ['With love and a jolly ho ho ho,', 'Your friend at the North Pole,', 'Warmly, from my armchair by the fire,', 'Love and snowflakes,'];

export const PS: readonly string[] = [
  'P.S. Pip the elf says hello and wants you to know he can now wrap a present without wrapping himself. Mostly.',
  'P.S. The reindeer say thank you in advance for any carrots. Prancer especially likes the crunchy ones.',
  'P.S. Mrs. Claus says to wear your warmest socks. She knits about a hundred pairs a year, so she knows.',
  'P.S. Rudolph wanted to sign this letter too, but his hoof was too big for the pen. He sends a glowing hello!',
  'P.S. Look out of your window tonight. If you see a star twinkling twice, that is the elves waving.',
  'P.S. The snowy hares asked me to say they would beat you in a race. They are very cheeky hares.',
];

/** A chip with a careful extra line (pets and weather are big wishes; peace and family are deep ones). */
export const ASIDES: Readonly<Record<string, string>> = {
  puppy: 'A puppy is a very big wish, because puppies need walks, cuddles and lots of looking after for a long time. That is a wish to talk about with your grown-ups, too.',
  kitten: 'A kitten is a very big wish, because kittens need cuddles and lots of looking after for a long time. That is a wish to talk about with your grown-ups, too.',
  snow: 'Snow is tricky, even for me: the clouds are in charge of that. But I will put in a good word with them.',
  peace: 'Wishing for peace is one of the biggest, bravest wishes there is. Every kind thing anyone does helps it grow a little.',
  grandma: 'Time with Grandma is one of the most precious presents of all. It does not fit in a sleigh, but it fits in a heart.',
  family: 'A happy family is a beautiful wish. Hugs, kind words and silly jokes help it come true every day.',
  friend: 'New friends often start with a smile and a "Do you want to play?" I have a feeling you would be a wonderful friend.',
  planet: 'The elves love our planet too. They turn off the workshop lights when they leave and feed the birds every morning.',
  hugs: 'Hugs are my favorite thing to give and to get. Here is a big one, coming all the way from the North Pole!',
};

/** Picks one element; `rand` is the seeded stream. */
function pick<T>(list: readonly T[], rand: () => number): T {
  return list[Math.floor(rand() * list.length) % list.length]!;
}

function fill(t: string, vars: Record<string, string>): string {
  return t.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

const upperFirst = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/**
 * The "I've been kind by…" line as a whole sentence in the child's voice, for quoting:
 * "helping my mom" → "I've been kind by helping my mom." and "I shared my toys" stays as written.
 */
export function kindQuote(kind: string): string {
  let s = kind.replace(/\s+/g, ' ').trim().slice(0, 120);
  if (!s) return '';
  if (!/^(I|I'm|I've|I'd|I'll|Me|My|We)\b/i.test(s)) s = `I've been kind by ${s[0]!.toLowerCase()}${s.slice(1)}`;
  else s = s[0]!.toUpperCase() + s.slice(1);
  return /[.!?…]$/u.test(s) ? s : `${s}.`;
}

export function wordCount(s: string): number {
  return s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Santa's reply to `letter` (whose Fridge id is `letterId`). Same input, same reply, every time. */
export function writeReply(letter: WishLetter, letterId: string): WishReply {
  const rand = mulberry32(seedFor(letter));
  const name = letter.name ?? '';
  const vars: Record<string, string> = { name: name || 'my friend' };
  const skin = skinById('santa');
  const chips = letter.chips.map((id) => chipById(skin, id)).filter((x) => x !== undefined);

  const greeting = fill(pick(name ? GREETINGS_NAMED : GREETINGS_PLAIN, rand), vars);
  const paragraphs: string[] = [fill(pick(OPENINGS, rand), vars)];

  // Wishes: two of the chips the child picked (seeded choice when there are more), else their words.
  if (chips.length > 0) {
    const pool = [...chips];
    const a = pool.splice(Math.floor(rand() * pool.length), 1)[0]!;
    const b = pool.length > 0 ? pool.splice(Math.floor(rand() * pool.length), 1)[0]! : null;
    const t = b ? pick(WISHES_TWO, rand) : pick(WISHES_ONE, rand);
    paragraphs.push(fill(t, { ...vars, w1: a.phrase, W1: upperFirst(a.phrase), w2: b?.phrase ?? '' }));
    const aside = [a, b].map((x) => (x ? ASIDES[x.id] : undefined)).find((x) => x !== undefined);
    if (aside) paragraphs.push(aside);
  } else {
    const n = wordCount(letter.text);
    if (n > 0) paragraphs.push(fill(pick(WISHES_WORDS, rand), { ...vars, words: n === 1 ? 'one word' : `${n} words` }));
  }

  const kind = kindQuote(letter.kind);
  paragraphs.push(kind ? fill(pick(KIND_SAID, rand), { ...vars, kind }) : fill(pick(KIND_GENTLE, rand), vars));
  paragraphs.push(fill(pick(NEWS, rand), vars));
  paragraphs.push(fill(pick(CLOSINGS, rand), vars));

  return { v: 1, type: 'reply', letterId, greeting, paragraphs, signoff: pick(SIGNOFFS, rand), ps: pick(PS, rand), year: letter.year };
}

/** Every template string, for the content test (house rules) and the grown-ups page. */
export function allTemplates(): string[] {
  return [
    ...GREETINGS_NAMED, ...GREETINGS_PLAIN, ...OPENINGS, ...WISHES_TWO, ...WISHES_ONE, ...WISHES_WORDS,
    ...KIND_SAID, ...KIND_GENTLE, ...NEWS, ...CLOSINGS, ...SIGNOFFS, ...PS, ...Object.values(ASIDES),
  ];
}
