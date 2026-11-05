/**
 * deck.ts — which stickers go into a Sticker Memory board, and how they are dealt. Pure (no DOM), so the
 * season-mate maths and the shuffle are tested in Node.
 *
 * A deck is the holiday's own sticker plus its "season-mates": holidays whose main day falls within
 * ±45 days of this holiday's next main day, found with the dates engine rather than month numbers so
 * moving feasts (Easter, Diwali, Eid) land in the right season every year. When a season is quiet the
 * nearest holidays further out top the deck up, so every board can always be dealt. "My stickers" is
 * the same idea built from the stickers the child has earned, topped up with season-mates.
 *
 * Two different holidays can share an emoji (fireworks, a heart…). While the illustrated stickers are
 * still being drawn the emoji is what the child matches, so a deck never holds two cards that look the
 * same but are not a pair.
 */
import { stickerLabel } from '../../content/registry';
import type { HolidayId, HolidayMeta } from '../../content/types';
import { fromDayNumber, toDayNumber, type CivilDate, type DayNumber, type IsoDate } from '../../dates/civil';
import { allOccurrences, isOnForRegion, nextOccurrence } from '../../dates/occurrences';
import type { Region } from '../../dates/rules';
import type { ThemeId } from '../../theme/themes';

/** Days either side of the holiday's main day that count as "the same season". */
export const SEASON_WINDOW = 45;

export interface BoardSize {
  readonly id: 'small' | 'medium' | 'big';
  /** Columns × rows in portrait; the board turns sideways on wide screens. */
  readonly cols: number;
  readonly rows: number;
  readonly pairs: number;
}

/** 3×4 for five-year-olds, 4×4, and 4×5 for big kids. */
export const BOARDS: readonly BoardSize[] = [
  { id: 'small', cols: 3, rows: 4, pairs: 6 },
  { id: 'medium', cols: 4, rows: 4, pairs: 8 },
  { id: 'big', cols: 4, rows: 5, pairs: 10 },
];

export const MAX_PAIRS = Math.max(...BOARDS.map((b) => b.pairs));

export interface MemorySticker {
  readonly holidayId: HolidayId;
  readonly holidayName: string;
  readonly emoji: string;
  readonly label: string;
  /** The sticker's own holiday theme, so a Diwali sticker sits on a Diwali-coloured disc. */
  readonly theme: ThemeId;
  /** Illustrated die-cut sticker, once the art exists; otherwise the emoji on a theme disc. */
  readonly url?: string;
  /** True when the child earned this sticker (the "My stickers" deck marks them with a star). */
  readonly mine?: boolean;
}

export interface Mate {
  readonly meta: HolidayMeta;
  /** |main day − this holiday's main day| in days. */
  readonly distance: number;
  /** Gregorian year of that main day (for year-dependent labels such as the zodiac animal). */
  readonly year: number;
}

export type UrlFor = (holidayId: HolidayId) => string | null;

export function toSticker(meta: HolidayMeta, year: number, urlFor: UrlFor, mine = false): MemorySticker {
  const url = urlFor(meta.id);
  return {
    holidayId: meta.id,
    holidayName: meta.name,
    emoji: meta.sticker.emoji,
    label: stickerLabel(meta, year),
    theme: meta.theme,
    ...(url ? { url } : {}),
    ...(mine ? { mine: true } : {}),
  };
}

/** The holiday's next (or current) main day, or today when the calendar has run out. */
export function centreDay(metas: readonly HolidayMeta[], id: HolidayId, today: CivilDate, region: Region): DayNumber {
  const next = nextOccurrence(metas, id, today, region);
  return 'occ' in next ? next.occ.main : toDayNumber(today);
}

/**
 * Every other holiday, nearest season first: those inside ±SEASON_WINDOW days come first (holidays on
 * for the child's region before the rest, silly days after the real ones), then everything else by distance.
 */
export function seasonMates(metas: readonly HolidayMeta[], id: HolidayId, today: CivilDate, region: Region): Mate[] {
  const centre = centreDay(metas, id, today, region);
  const nearest = new Map<HolidayId, { distance: number; main: DayNumber }>();
  for (const occ of allOccurrences(metas, [], fromDayNumber(centre), region)) {
    if (occ.holidayId === id) continue;
    const distance = Math.abs(occ.main - centre);
    const best = nearest.get(occ.holidayId);
    if (!best || distance < best.distance) nearest.set(occ.holidayId, { distance, main: occ.main });
  }
  const byId = new Map(metas.map((m) => [m.id, m] as const));
  const mates: Mate[] = [];
  for (const [hid, { distance, main }] of nearest) {
    const meta = byId.get(hid);
    if (meta) mates.push({ meta, distance, year: fromDayNumber(main).y });
  }
  // Inside the window: region-on before elsewhere, real holidays before silly days. Outside: one bucket.
  const rank = (m: Mate): number => (m.distance > SEASON_WINDOW ? 4
    : (isOnForRegion(m.meta, region, false) ? 0 : 1) + (m.meta.tier === 3 ? 2 : 0));
  return mates.sort((a, b) => rank(a) - rank(b) || a.distance - b.distance || a.meta.name.localeCompare(b.meta.name));
}

/** First `count` stickers, skipping repeats of a holiday or of an emoji. */
export function pickDistinct(candidates: readonly MemorySticker[], count: number): MemorySticker[] {
  const ids = new Set<string>();
  const looks = new Set<string>();
  const out: MemorySticker[] = [];
  for (const s of candidates) {
    if (out.length >= count) break;
    if (ids.has(s.holidayId) || looks.has(s.emoji)) continue;
    ids.add(s.holidayId);
    looks.add(s.emoji);
    out.push(s);
  }
  return out;
}

/** Holiday ids the child has stickers for, newest first (`Progress.stickers` keys are `${id}:${year}`). */
export function earnedHolidays(stickers: Readonly<Record<string, IsoDate>>): { id: HolidayId; year: number }[] {
  const latest = new Map<HolidayId, { year: number; date: string }>();
  for (const [key, date] of Object.entries(stickers)) {
    const cut = key.lastIndexOf(':');
    if (cut <= 0) continue;
    const id = key.slice(0, cut);
    const year = Number(key.slice(cut + 1));
    if (!Number.isFinite(year)) continue;
    const prev = latest.get(id);
    if (!prev || date > prev.date) latest.set(id, { year, date });
  }
  return [...latest.entries()]
    .sort((a, b) => (a[1].date < b[1].date ? 1 : a[1].date > b[1].date ? -1 : a[0].localeCompare(b[0])))
    .map(([id, v]) => ({ id, year: v.year }));
}

export interface DeckInput {
  readonly centre: HolidayMeta;
  readonly metas: readonly HolidayMeta[];
  readonly today: CivilDate;
  readonly region: Region;
  readonly urlFor: UrlFor;
}

/** "{Holiday} & friends": the holiday's own sticker first, then its season-mates. */
export function seasonDeck(input: DeckInput, count = MAX_PAIRS): MemorySticker[] {
  const { centre, metas, today, region, urlFor } = input;
  const year = fromDayNumber(centreDay(metas, centre.id, today, region)).y;
  const own = toSticker(centre, year, urlFor);
  const mates = seasonMates(metas, centre.id, today, region).map((m) => toSticker(m.meta, m.year, urlFor));
  return pickDistinct([own, ...mates], count);
}

/** "My stickers": the earned ones (newest first), topped up with season-mates so every board fills. */
export function myDeck(input: DeckInput, earned: readonly { id: HolidayId; year: number }[], metaOf: (id: HolidayId) => HolidayMeta | undefined, count = MAX_PAIRS): MemorySticker[] {
  const mine: MemorySticker[] = [];
  for (const e of earned) {
    const meta = metaOf(e.id);
    if (meta) mine.push(toSticker(meta, e.year, input.urlFor, true));
  }
  return pickDistinct([...mine, ...seasonDeck(input, count + mine.length)], count);
}

/** How many distinct earned stickers make "My stickers" worth offering. */
export const MY_DECK_MIN = 3;

export interface DealtCard {
  /** Position on the board. */
  readonly index: number;
  /** Pair key (the holiday id). */
  readonly key: string;
  readonly sticker: MemorySticker;
}

/** Two of each of the first `pairs` stickers, Fisher–Yates shuffled with the given seeded RNG. */
export function deal(stickers: readonly MemorySticker[], pairs: number, rand: () => number): DealtCard[] {
  const chosen = stickers.slice(0, pairs);
  const cards = chosen.flatMap((s) => [s, s]);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = cards[i]!;
    cards[i] = cards[j]!;
    cards[j] = t;
  }
  return cards.map((sticker, index) => ({ index, key: sticker.holidayId, sticker }));
}
