/**
 * questions.ts — builds a five-question round from data, never from hand-written answer keys.
 *
 *   const round = buildRound({ scope: 'diwali', metas, contents, now, rand: mulberry32(seed) });
 *
 * Four kinds of question:
 *   map    tap a country on the globe (places.ts, or "Tap a country where people celebrate …" from
 *          CELEBRATED), or, on the flat map, one of two city pins (clocks.ts: New Year first, night now)
 *   fact   a True-or-silly flip card: a real fact from the holiday's content, or one of Jubi's jokes
 *   greet  "Which holiday do people say this on?" with the greeting and three holidays to pick from
 *
 * A holiday round mixes its own places, one fact card, one greeting and a time question; the
 * Everything mix draws places from three different holidays. A seeded shuffle (mulberry32) picks
 * them, and keys the child has just seen are put to the back, so rounds rarely repeat. Pure: tested
 * in Node (Intl zone data is the only outside input).
 */
import type { Greeting, HolidayContent, HolidayMeta } from '../../content/types';
import { CELEBRATED, isWorldwide } from '../../world/data/celebrated';
import { COUNTRY_NAMES, hasOutline } from '../../world/data/countries';
import { hoursPhrase, newYearPair, nightPair } from './clocks';
import { COPY, fill } from './copy';
import { countryLabel, countryPhrase, countryPhraseStart, hasPlainQuestion, PLACES, WELL_KNOWN, type PlaceKind } from './places';

export const ROUND_LENGTH = 5;
export const LIST_SIZE = 6;
const MAX_FACT = 170;

export interface Choice {
  readonly iso: string;
  readonly label: string;
  /** City pins: the country under the city name. */
  readonly sub?: string;
}

export interface Pin {
  readonly iso: string;
  readonly lon: number;
  readonly lat: number;
  readonly label: string;
  readonly tz: string;
}

export interface MapQuestion {
  readonly kind: 'map';
  readonly key: string;
  /** Holiday id the question is about ('' for the time questions). */
  readonly holiday: string;
  readonly place: PlaceKind | 'new-year' | 'night';
  readonly view: 'globe' | 'map';
  readonly prompt: string;
  /** Every right answer; `primary` is the one the globe turns to. Empty with `any`. */
  readonly answers: readonly string[];
  readonly primary: string;
  /** Every outlined country is right (Earth Day). */
  readonly any: boolean;
  readonly reveal: string;
  /** "Choose from a list": big buttons, at least one of them right. */
  readonly choices: readonly Choice[];
  /** Time questions: the two cities to tap. */
  readonly pins: readonly Pin[];
  /** Degrees east of the answer the globe starts at, so finding it takes a spin (0 = start on it). */
  readonly startOffset: number;
}

export interface FactQuestion {
  readonly kind: 'fact';
  readonly key: string;
  readonly holiday: string;
  readonly text: string;
  readonly truth: boolean;
  /** Silly cards: what is really true. */
  readonly back: string;
}

export interface GreetOption {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
}

export interface GreetQuestion {
  readonly kind: 'greet';
  readonly key: string;
  readonly holiday: string;
  readonly greeting: Greeting;
  /** What to show big: the romanisation when the text is not Latin script. */
  readonly display: string;
  readonly options: readonly GreetOption[];
}

export type Question = MapQuestion | FactQuestion | GreetQuestion;

export type Scope = string;
export const EVERYTHING = 'everything';

export interface RoundInput {
  /** A holiday id, or EVERYTHING. */
  readonly scope: Scope;
  /** Registry metas (tier 1–3; customs are ignored). */
  readonly metas: readonly HolidayMeta[];
  /** Content the round may draw facts and greetings from (the holiday's own, plus any loaded). */
  readonly contents: ReadonlyMap<string, HolidayContent>;
  readonly now: Date;
  readonly rand: () => number;
  /** Keys seen recently: used only when nothing fresh is left. */
  readonly avoid?: ReadonlySet<string>;
}

// ───────────────────────────────────────────── helpers

export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Shuffled, with anything in `avoid` moved to the back (still usable when nothing else is left). */
function fresh<T extends { readonly key: string }>(items: readonly T[], rand: () => number, avoid?: ReadonlySet<string>): T[] {
  const s = shuffle(items, rand);
  return avoid ? [...s.filter((x) => !avoid.has(x.key)), ...s.filter((x) => avoid.has(x.key))] : s;
}

/**
 * The same feast kept on another date by another calendar. "Tap a country where families celebrate
 * Easter" must accept Greece and Russia, whose Easter is the World map's 'orthodox-easter'.
 */
const SAME_FEAST: Readonly<Record<string, readonly string[]>> = {
  easter: ['orthodox-easter'],
  'orthodox-easter': ['easter'],
};

/** Every country that keeps the holiday, its same-feast siblings included. */
export function celebratingCountries(id: string): string[] {
  const all = [id, ...(SAME_FEAST[id] ?? [])].flatMap((x) => CELEBRATED[x]?.countries ?? []);
  return all.filter((iso, i) => all.indexOf(iso) === i);
}

/** Outlined countries that celebrate a holiday (what a child can tap). */
export function celebratedOutlined(id: string): string[] {
  return celebratingCountries(id).filter(hasOutline);
}

// ───────────────────────────────────────────── map questions

/** Every place question a holiday has (curated first, then the plain one when it has no 'doing'). */
export function placeQuestions(meta: HolidayMeta, rand: () => number): MapQuestion[] {
  const c = CELEBRATED[meta.id];
  if (!c) return [];
  const out: MapQuestion[] = [];
  const curated = PLACES.filter((p) => p.holiday === meta.id);
  curated.forEach((p, i) => {
    const any = p.kind === 'doing' && p.answers.length === 0 && isWorldwide(meta.id);
    const answers = any ? [] : p.answers.length > 0 ? p.answers.filter(hasOutline) : celebratedOutlined(meta.id);
    if (!any && answers.length === 0) return;
    const reveal = p.reveal ?? kidNote(c.note) ?? countReveal(meta, answers.length, any);
    out.push(mapQ(`place:${meta.id}:${i}`, meta.id, p.kind, p.prompt, answers, any, reveal, rand));
  });
  const hasDoing = curated.some((p) => p.kind === 'doing');
  if (!hasDoing && hasPlainQuestion(meta.id) && !isWorldwide(meta.id) && meta.tier !== 3) {
    const answers = celebratedOutlined(meta.id);
    if (answers.length > 0) {
      out.push(mapQ(`place:${meta.id}:plain`, meta.id, 'doing', `Tap a country where people celebrate ${meta.name}.`, answers, false, kidNote(c.note) ?? countReveal(meta, answers.length, false), rand));
    }
  }
  return out;
}

/**
 * The World map's note when it reads well aloud for a seven-year-old: asides in brackets dropped,
 * and no stretch longer than 22 words between full stops or dashes. Otherwise null.
 */
export function kidNote(note: string): string | null {
  const text = note.replace(/\s*\([^)]*\)/g, '').replace(/\s+([.!?,])/g, '$1').trim();
  const long = text.split(/(?<=[.!?])\s+|\s+—\s+/).some((t) => t.split(/\s+/).filter(Boolean).length > 22);
  return long || text.length > 170 ? null : text;
}

function countReveal(meta: HolidayMeta, n: number, any: boolean): string {
  if (any) return `Everyone on Earth is invited to ${meta.name}!`;
  return n === 1 ? `${meta.name} is celebrated in one country on this globe.` : `${n} countries on this globe celebrate ${meta.name}. Look, they are all lit up!`;
}

function mapQ(key: string, holiday: string, place: PlaceKind, prompt: string, answers: readonly string[], any: boolean, reveal: string, rand: () => number): MapQuestion {
  const primary = answers[0] ?? '';
  // Named-country questions start the globe a third of the way round, so finding it is a spin;
  // "tap any of these" questions start over the celebrating countries.
  const startOffset = place === 'doing' ? 0 : Math.round(70 + rand() * 60) * (rand() < 0.5 ? -1 : 1);
  return {
    kind: 'map', key, holiday, place, view: 'globe', prompt, answers, primary, any, reveal,
    choices: listChoices(answers, any, rand), pins: [], startOffset,
  };
}

/** Six big buttons: one or two right answers (well-known ones first) and well-known others. */
export function listChoices(answers: readonly string[], any: boolean, rand: () => number): Choice[] {
  const right = new Set(answers);
  const pool = any ? WELL_KNOWN : WELL_KNOWN.filter((iso) => !right.has(iso));
  let rightPicks: string[] = [];
  if (!any) {
    const known = shuffle(answers.filter((iso) => WELL_KNOWN.includes(iso)), rand);
    const other = shuffle(answers.filter((iso) => !WELL_KNOWN.includes(iso)), rand);
    // The answer the globe will point at is always in the list, so the list and the reveal agree.
    const primary = answers[0];
    const ordered = [...(primary ? [primary] : []), ...known, ...other].filter((iso, i, a) => a.indexOf(iso) === i);
    rightPicks = ordered.slice(0, answers.length > 2 ? 2 : answers.length);
  }
  let others = shuffle(pool, rand).slice(0, LIST_SIZE - rightPicks.length);
  if (others.length < LIST_SIZE - rightPicks.length) {
    // A holiday celebrated nearly everywhere: borrow less famous places to keep six buttons.
    const rest = shuffle(Object.keys(COUNTRY_NAMES).filter((iso) => !right.has(iso) && !others.includes(iso) && iso !== 'AQ' && iso !== 'TF'), rand);
    others = [...others, ...rest].slice(0, LIST_SIZE - rightPicks.length);
  }
  return shuffle([...rightPicks, ...others], rand).map((iso) => ({ iso, label: countryLabel(iso) }));
}

/** "Who says Happy New Year first?" on the flat map. */
export function newYearQuestion(rand: () => number, now: Date): MapQuestion | null {
  const p = newYearPair(rand, now.getUTCFullYear());
  if (!p) return null;
  const [a, b] = rand() < 0.5 ? [p.first, p.second] : [p.second, p.first];
  const pins = [a, b].map((c) => ({ iso: c.country, lon: c.lon, lat: c.lat, label: c.name, tz: c.tz }));
  return {
    kind: 'map', key: `ny:${p.first.id}:${p.second.id}`, holiday: '', place: 'new-year', view: 'map',
    prompt: fill(COPY.newYear, { a: a.name, b: b.name }),
    answers: [p.first.country], primary: p.first.country, any: false,
    reveal: fill(COPY.newYearReveal, { first: p.first.name, second: p.second.name, hours: hoursPhrase(p.minutes) }),
    choices: pins.map((x) => ({ iso: x.iso, label: x.label, sub: countryLabel(x.iso) })), pins, startOffset: 0,
  };
}

/**
 * "Which place is having night-time right now?" The reveal names both local times, which the view
 * fills in with the child's locale (`{nightTime}`, `{dayTime}` stay as placeholders here).
 */
export function nightQuestion(rand: () => number, now: Date): MapQuestion | null {
  const p = nightPair(rand, now);
  if (!p) return null;
  const [a, b] = rand() < 0.5 ? [p.night, p.day] : [p.day, p.night];
  const pins = [a, b].map((c) => ({ iso: c.country, lon: c.lon, lat: c.lat, label: c.name, tz: c.tz }));
  return {
    kind: 'map', key: `night:${p.night.id}:${p.day.id}`, holiday: '', place: 'night', view: 'map',
    prompt: fill(COPY.night, { a: a.name, b: b.name }),
    answers: [p.night.country], primary: p.night.country, any: false,
    reveal: fill(COPY.nightReveal, { night: p.night.name, day: p.day.name }),
    choices: pins.map((x) => ({ iso: x.iso, label: x.label, sub: countryLabel(x.iso) })), pins, startOffset: 0,
  };
}

// ───────────────────────────────────────────── fact cards

/** Jubi's jokes: plainly untrue, never about anyone's faith or customs, each with what is really true. */
export const SILLY: readonly { readonly text: string; readonly back: string }[] = [
  { text: 'The Moon is made of cheese.', back: 'The Moon is made of rock and dust. Astronauts even brought some home!' },
  { text: 'Penguins live at the North Pole.', back: 'Wild penguins live in the southern half of the world. None live at the North Pole!' },
  { text: 'When it is breakfast time for you, it is breakfast time everywhere in the world.', back: 'When you eat breakfast, children on the other side of the world are getting ready for bed!' },
  { text: 'The Earth is flat, like a pancake.', back: 'The Earth is round, like a ball. That is why we use a globe!' },
  { text: 'There are only three countries in the whole world.', back: 'There are about 200 countries in the world!' },
  { text: 'Rainbows are made of jelly.', back: 'Rainbows are sunlight shining through tiny drops of rain.' },
  { text: 'Clouds are made of cotton wool.', back: 'Clouds are made of tiny drops of water or little bits of ice.' },
  { text: 'Wild kangaroos hop around in Iceland.', back: 'Wild kangaroos live in Australia, where it is much warmer than Iceland!' },
  { text: 'The Sun goes to sleep under the sea every night.', back: 'The Sun stays put. The Earth spins, so your side of it turns away from the Sun at night.' },
  { text: 'Elephants can fly if they flap their ears.', back: 'Elephants flap their big ears to keep cool, but they cannot fly.' },
  { text: 'The sea is made of lemonade.', back: 'The sea is salty water. Better not drink it!' },
  { text: 'Every country has winter at the same time.', back: 'When it is winter in the north of the world, it is summer in the south!' },
  { text: 'The North Pole is the hottest place on Earth.', back: 'The North Pole is one of the coldest places on Earth. Brrr!' },
  { text: 'Giraffes have short necks.', back: 'Giraffes have the longest necks of any animal!' },
];

/** Real facts short enough to read on a card, for younger children (bigKids wording skipped). */
export function factCandidates(id: string, content: HolidayContent | undefined): FactQuestion[] {
  if (!content) return [];
  return content.facts
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => !f.bigKids && f.text.length <= MAX_FACT && !/http|www\./i.test(f.text))
    .map(({ f, i }) => ({ kind: 'fact' as const, key: `fact:${id}:${i}`, holiday: id, text: f.text, truth: true, back: '' }));
}

export function sillyCards(): FactQuestion[] {
  return SILLY.map((s, i) => ({ kind: 'fact' as const, key: `silly:${i}`, holiday: '', text: s.text, truth: false, back: s.back }));
}

/** A real fact (about three times in five) or a joke; always returns a card. */
export function factQuestion(ids: readonly string[], contents: ReadonlyMap<string, HolidayContent>, rand: () => number, avoid?: ReadonlySet<string>): FactQuestion {
  const real = ids.flatMap((id) => factCandidates(id, contents.get(id)));
  const useReal = real.length > 0 && rand() < 0.6;
  return fresh(useReal ? real : sillyCards(), rand, avoid)[0]!;
}

// ───────────────────────────────────────────── greetings

/** Lower-case letters only, accents removed: "Día" → "dia". */
function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function nameTokens(meta: HolidayMeta): string[] {
  const words = [meta.name, ...(meta.alsoCalled ?? [])].join(' ');
  return norm(words).split(/[^a-z]+/).filter((w) => w.length >= 4 && w !== 'happy' && w !== 'festival' && w !== 'night' && w !== 'with');
}

/** The holiday's name is not in the greeting ("Happy Diwali" would give it away). */
function giveaway(display: string, meta: HolidayMeta): boolean {
  const d = norm(display);
  return d.includes(norm(meta.name)) || nameTokens(meta).some((t) => d.includes(t));
}

/** Greetings that make a fair question: not the holiday's own name, not a generic "happy holidays". */
export function usableGreetings(meta: HolidayMeta, content: HolidayContent | undefined): { g: Greeting; i: number; display: string }[] {
  if (!content || meta.id === 'memorial-day') return [];
  return content.greetings
    .map((g, i) => ({ g, i, display: g.roman ?? g.text }))
    .filter(({ g, display }) => display.length <= 32 && !/^happy holidays?\b/i.test(g.meaning) && !giveaway(display, meta));
}

/** Faiths that share greetings are one family (Christos Anesti is said at both Easters). */
function family(meta: HolidayMeta): string[] {
  return meta.traditions.map((t) => (t === 'orthodox' ? 'christian' : t)).filter((t) => t !== 'secular' && t !== 'civic');
}

function newYearish(meta: HolidayMeta, g?: Greeting): boolean {
  return meta.tags.includes('new-year') || (g !== undefined && /new year/i.test(g.meaning));
}

/** Holidays that could not be confused with the answer: no shared faith, greeting or New Year. */
export function greetDistractors(answer: HolidayMeta, g: Greeting, metas: readonly HolidayMeta[], contents: ReadonlyMap<string, HolidayContent>): HolidayMeta[] {
  const fam = new Set(family(answer));
  const shown = norm(g.roman ?? g.text);
  const ny = newYearish(answer, g);
  return metas.filter((m) => {
    if (m.id === answer.id || m.tier === 3) return false;
    if (family(m).some((t) => fam.has(t))) return false;
    if (ny && newYearish(m)) return false;
    if (giveaway(g.roman ?? g.text, m) || giveaway(g.text, m)) return false;
    const c = contents.get(m.id);
    if (c && c.greetings.some((x) => norm(x.roman ?? x.text) === shown || norm(x.text) === norm(g.text))) return false;
    return true;
  });
}

export function greetQuestions(meta: HolidayMeta, metas: readonly HolidayMeta[], contents: ReadonlyMap<string, HolidayContent>, rand: () => number): GreetQuestion[] {
  const out: GreetQuestion[] = [];
  for (const { g, i, display } of usableGreetings(meta, contents.get(meta.id))) {
    const pool = greetDistractors(meta, g, metas, contents);
    // Tier-1 holidays first: a child is likelier to know them, so the choice is a real one.
    const famous = shuffle(pool.filter((m) => m.tier === 1), rand);
    const rest = shuffle(pool.filter((m) => m.tier !== 1), rand);
    const two = [...famous, ...rest].slice(0, 2);
    if (two.length < 2) continue;
    const options = shuffle([meta, ...two], rand).map((m) => ({ id: m.id, name: m.name, emoji: m.emoji }));
    out.push({ kind: 'greet', key: `greet:${meta.id}:${i}`, holiday: meta.id, greeting: g, display, options });
  }
  return out;
}

// ───────────────────────────────────────────── rounds

function timeQuestion(kind: 'new-year' | 'night', rand: () => number, now: Date): MapQuestion | null {
  return kind === 'new-year' ? newYearQuestion(rand, now) ?? nightQuestion(rand, now) : nightQuestion(rand, now) ?? newYearQuestion(rand, now);
}

/** Holidays the Everything mix can ask about (tier 1–2 with at least one place question). */
export function mixHolidays(metas: readonly HolidayMeta[]): HolidayMeta[] {
  return metas.filter((m) => m.tier !== 3 && CELEBRATED[m.id] !== undefined && PLACES.some((p) => p.holiday === m.id));
}

/** A holiday round needs at least one place question of its own. */
export function hasHolidayRound(meta: HolidayMeta): boolean {
  return placeQuestions(meta, () => 0.5).length > 0;
}

export function buildRound(input: RoundInput): Question[] {
  const { scope, metas, contents, now, rand, avoid } = input;
  const byId = new Map(metas.map((m) => [m.id, m] as const));
  const meta = scope === EVERYTHING ? undefined : byId.get(scope);
  return meta && hasHolidayRound(meta) ? holidayRound(meta, metas, contents, now, rand, avoid) : mixRound(metas, contents, now, rand, avoid, meta);
}

function holidayRound(meta: HolidayMeta, metas: readonly HolidayMeta[], contents: ReadonlyMap<string, HolidayContent>, now: Date, rand: () => number, avoid?: ReadonlySet<string>): Question[] {
  const places = fresh(placeQuestions(meta, rand), rand, avoid);
  const greet = fresh(greetQuestions(meta, metas, contents, rand), rand, avoid)[0] ?? null;
  const fact = factQuestion([meta.id], contents, rand, avoid);
  const time = timeQuestion(meta.tags.includes('new-year') ? 'new-year' : rand() < 0.5 ? 'night' : 'new-year', rand, now);
  // Two or three places, interleaved with the cards so the globe and the cards take turns; the
  // greeting and the time question swap places from round to round.
  const geo = places.slice(0, places.length >= 3 && rand() < 0.5 ? 3 : 2);
  const extras: Question[] = [fact, ...shuffle([...(greet ? [greet] : []), ...(time ? [time] : [])], rand)];
  // Too few places? A second time question, then a joke card, keep it at five.
  if (geo.length + extras.length < ROUND_LENGTH) {
    const other = timeQuestion(time?.place === 'night' ? 'new-year' : 'night', rand, now);
    if (other && other.key !== time?.key) extras.push(other);
  }
  const used = new Set(extras.map((q) => q.key));
  for (const s of fresh(sillyCards(), rand, avoid)) {
    if (geo.length + extras.length >= ROUND_LENGTH) break;
    if (!used.has(s.key)) extras.push(s);
  }
  return arrange([...geo, ...extras].slice(0, ROUND_LENGTH));
}

function mixRound(metas: readonly HolidayMeta[], contents: ReadonlyMap<string, HolidayContent>, now: Date, rand: () => number, avoid?: ReadonlySet<string>, from?: HolidayMeta): Question[] {
  const holidays = shuffle(mixHolidays(metas), rand);
  // A holiday whose own round is too thin (a silly day) still leads its mix with its own card.
  const geo: MapQuestion[] = [];
  const seen = new Set<string>();
  for (const h of holidays) {
    if (geo.length >= 3) break;
    const q = fresh(placeQuestions(h, rand), rand, avoid)[0];
    if (q && !seen.has(h.id)) { geo.push(q); seen.add(h.id); }
  }
  const cardIds = [...(from ? [from.id] : []), ...[...contents.keys()].filter((id) => id !== from?.id)];
  const greets = cardIds.flatMap((id) => {
    const m = metas.find((x) => x.id === id);
    return m ? greetQuestions(m, metas, contents, rand) : [];
  });
  const card: Question = from && contents.has(from.id) && factCandidates(from.id, contents.get(from.id)).length > 0
    ? factQuestion([from.id], contents, rand, avoid)
    : greets.length > 0 && rand() < 0.5 ? fresh(greets, rand, avoid)[0]! : factQuestion(cardIds, contents, rand, avoid);
  const time = timeQuestion(rand() < 0.5 ? 'new-year' : 'night', rand, now);
  const extras: Question[] = [card, ...(time ? [time] : [])];
  if (geo.length + extras.length < ROUND_LENGTH) extras.push(fresh(sillyCards().filter((s) => s.key !== card.key), rand, avoid)[0]!);
  return arrange([...geo, ...extras].slice(0, ROUND_LENGTH));
}

/**
 * Lays out a round so the globe and the cards take turns: the cards sit at evenly spaced places
 * among the map questions (m m c m m, m c m c m …), so there are never three map questions in a
 * row, and the time question (flat map) comes second among the maps, between two globe turns.
 */
export function arrange(items: readonly Question[]): Question[] {
  const maps = items.filter((q): q is MapQuestion => q.kind === 'map');
  const cards = items.filter((q) => q.kind !== 'map');
  const globe = maps.filter((q) => q.view === 'globe');
  const flat = maps.filter((q) => q.view === 'map');
  const orderedMaps = [...globe.slice(0, 1), ...flat, ...globe.slice(1)];
  const n = orderedMaps.length + cards.length;
  const cardAt = new Set(cards.map((_, k) => Math.round(((k + 1) * n) / (cards.length + 1)) - 1));
  const out: Question[] = [];
  let mi = 0;
  let ci = 0;
  for (let i = 0; i < n; i++) {
    const useCard = (cardAt.has(i) && ci < cards.length) || mi >= orderedMaps.length;
    out.push(useCard ? cards[ci++]! : orderedMaps[mi++]!);
  }
  return out;
}

/** Whether a tapped country answers a map question. */
export function isRight(q: MapQuestion, iso: string): boolean {
  return q.any ? hasOutline(iso) : q.answers.includes(iso);
}

/** "Yes! India!" / "That's Brazil. Here's Mexico!" — the first line of the answer card. */
export function answerLine(q: MapQuestion, tapped: string, cheer: string): string {
  if (isRight(q, tapped)) return fill(q.any ? COPY.anyPlace : COPY.rightPlace, { cheer, Country: q.view === 'map' ? pinName(q, tapped) : countryPhraseStart(tapped) });
  if (q.view === 'map') return fill(COPY.otherPlace, { Country: pinName(q, tapped), answer: pinName(q, q.primary) });
  if (q.answers.length > 3) return fill(COPY.otherPlaceMany, { Country: countryPhraseStart(tapped) });
  return fill(COPY.otherPlace, { Country: countryPhraseStart(tapped), answer: countryPhrase(q.primary) });
}

function pinName(q: MapQuestion, iso: string): string {
  return q.pins.find((p) => p.iso === iso)?.label ?? countryPhraseStart(iso);
}
