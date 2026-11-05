/**
 * Pure helpers behind the Holiday World page and Step Mode — no DOM, so test/holiday-view.test.ts runs in Node:
 * which sections (pills) a holiday shows, the Play links and the countdown-doors teaser, the per-day panel copy
 * ("Night 4 of 8 — tonight we light 4 candles"), advent door states, timer arithmetic, the ingredient checklist,
 * the US/metric switch, the "how we know" rule sentence, and the small bits of session memory the page and
 * Step Mode share (content cache, return focus).
 */
import { formatMeasure, pluralSleeps, type Units } from '../app/format';
import { SECTIONS, type Section } from '../app/router';
import { loadContent, hasContent } from '../content/loader';
import type { HolidayContent, HolidayId, HolidayMeta, Ingredient } from '../content/types';
import { toDayNumber, type CivilDate, type DayNumber } from '../dates/civil';
import { candlesLit, spanProgress } from '../dates/countdown';
import type { Occurrence, Status } from '../dates/occurrences';
import type { DateRule, Region } from '../dates/rules';
import type { ActivityId } from '../play/types';
import { COPY, fmt } from './copy';

// ───────────────────────────────────────────────────────── sections & pills

/**
 * The page's sections in pill order: Play (the activity links) leads, then the spec's seven. `play` is not a
 * router `Section` yet, so a shared `?s=play` link simply opens the page at the top, where Play already sits.
 */
export type PageSection = 'play' | Section;
export const PAGE_SECTIONS: readonly PageSection[] = ['play', ...SECTIONS];

/**
 * The sections that have something to show, in pill order. Every holiday gets Play; silly days (tier 3) are
 * otherwise a story and a fact, nothing else.
 */
export function sectionsFor(
  meta: Pick<HolidayMeta, 'tier'>,
  content: Pick<HolidayContent, 'story' | 'facts' | 'greetings' | 'recipes' | 'crafts'>,
): PageSection[] {
  const has: Record<PageSection, boolean> = {
    play: true,
    story: content.story.length > 0,
    make: content.recipes.length > 0,
    craft: content.crafts.length > 0,
    facts: content.facts.length > 0,
    say: content.greetings.length > 0,
    dates: true,
    sticker: true,
  };
  const allowed = meta.tier === 3 ? new Set<PageSection>(['play', 'story', 'facts']) : null;
  return PAGE_SECTIONS.filter((s) => has[s] && (allowed === null || allowed.has(s)));
}

/** `?s=` only scrolls to a section the page actually has; anything else stays at the top. */
export function initialSection(requested: string | undefined, available: readonly PageSection[]): PageSection | null {
  const hit = available.find((s) => s === requested);
  return hit ?? null;
}

/** DOM id of a section (also its pill's scroll target). */
export function sectionDomId(section: PageSection): string {
  return `sec-${section}`;
}

// ───────────────────────────────────────────────────────── Play: activity links + countdown-doors teaser

/** The activities every holiday page links to (the play view wires `#/h/:id/play/:activity`). */
export type PlayLinkId = Extract<ActivityId, 'doors' | 'seek' | 'colour' | 'card' | 'wish' | 'memory' | 'catch' | 'dressup' | 'quiz' | 'path' | 'story' | 'pumpkin' | 'treats' | 'monster' | 'potion' | 'peekaboo'>;

export interface PlayLink {
  readonly id: PlayLinkId;
  /** Short enough to sit under a round button in a four-across grid on a phone. */
  readonly label: string;
  readonly emoji: string;
  /** The holidays the activity exists for; absent means every holiday. */
  readonly only?: readonly string[];
}

/** The holidays with a Story Time book (kept in step with src/play/story/books by a test). */
export const STORY_HOLIDAYS: readonly string[] = [
  'christmas', 'hanukkah', 'diwali', 'eid-al-fitr', 'lunar-new-year', 'halloween', 'thanksgiving', 'holi',
  'day-of-the-dead', 'kwanzaa', 'nowruz', 'mid-autumn-festival',
];

export const PLAY_LINKS: readonly PlayLink[] = [
  { id: 'doors', label: 'Doors', emoji: '🚪' },
  { id: 'seek', label: 'Seek & Find', emoji: '🔍' },
  { id: 'colour', label: 'Colour-in', emoji: '🖍️' },
  { id: 'card', label: 'Make a card', emoji: '💌' },
  { id: 'wish', label: 'Wish Post', emoji: '📮' },
  { id: 'memory', label: 'Memory', emoji: '🃏' },
  { id: 'catch', label: 'Catch & Stack', emoji: '🧺' },
  { id: 'dressup', label: 'Dress up Jubi', emoji: '🎩' },
  { id: 'quiz', label: 'Globe Quiz', emoji: '🌍' },
  { id: 'path', label: "Jubi's Path", emoji: '🧭' },
  { id: 'story', label: 'Story Time', emoji: '📖', only: STORY_HOLIDAYS },
];

/** A row of games made for one holiday (its own heading under the everyday activities). */
export interface HolidayGames {
  readonly holiday: string;
  readonly heading: string;
  readonly links: readonly PlayLink[];
}

export const HOLIDAY_GAMES: readonly HolidayGames[] = [
  {
    holiday: 'halloween',
    heading: 'Halloween games',
    links: [
      { id: 'pumpkin', label: 'Pumpkin Carver', emoji: '🎃' },
      { id: 'treats', label: 'Trick-or-Treat', emoji: '🏘️' },
      { id: 'monster', label: 'Monster Maker', emoji: '👾' },
      { id: 'potion', label: 'Cauldron Colours', emoji: '🧪' },
      { id: 'peekaboo', label: 'Peekaboo Ghosts', emoji: '👻' },
    ],
  },
];

/** The holiday-only games row for a holiday, if it has one. */
export function holidayGamesFor(holidayId: string): HolidayGames | undefined {
  return HOLIDAY_GAMES.find((g) => g.holiday === holidayId);
}

/** The play links a holiday page shows: every activity that exists for that holiday. */
export function playLinksFor(holidayId: string): readonly PlayLink[] {
  return PLAY_LINKS.filter((p) => !p.only || p.only.includes(holidayId));
}

/** `#/h/:id/play/:activity` — written here until the router learns the play route. */
export function playHref(holidayId: HolidayId, activity: PlayLinkId): string {
  return `#/h/${encodeURIComponent(holidayId)}/play/${activity}`;
}

/** Hero mode for the page: the celebration sky on the main day and on the first evening of a sundown holiday. */
export function heroModeFor(status: Status): 'holiday' | 'celebrate' {
  return status.kind === 'ongoing' && (status.sleepsToMain === 0 || status.tonight) ? 'celebrate' : 'holiday';
}

/** The content a page needs when a holiday ships none (a birthday or custom day): its tagline as the story. */
export function emptyContent(story: readonly string[] = []): HolidayContent {
  return { story, facts: [], greetings: [], recipes: [], crafts: [] };
}

// ───────────────────────────────────────────────────────── content cache (session memory)

const CONTENT = new Map<HolidayId, HolidayContent>();

/** Already-loaded content, so Back to a holiday page renders in the same frame and scroll restore lands. */
export function cachedContent(id: HolidayId): HolidayContent | undefined {
  return CONTENT.get(id);
}

/** Loads (once per session) the content for a holiday; custom days get their tagline as a one-line story. */
export async function contentFor(meta: Pick<HolidayMeta, 'id' | 'tagline'>): Promise<HolidayContent> {
  const hit = CONTENT.get(meta.id);
  if (hit) return hit;
  const content = hasContent(meta.id) ? await loadContent(meta.id) : emptyContent([meta.tagline]);
  CONTENT.set(meta.id, content);
  return content;
}

// ───────────────────────────────────────────────────────── Step Mode ↔ page hand-off

let opener: { key: string; at: number } | null = null;
let returnTo: { key: string; at: number } | null = null;
/** A hand-off older than this belongs to some earlier navigation and is ignored. */
const HANDOFF_MS = 1500;

const handoffKey = (holidayId: HolidayId, recipeId: string): string => `${holidayId}/${recipeId}`;

/** The page's "Start Step Mode" link was clicked: closing Step Mode can go Back instead of replacing history. */
export function markStepModeOpener(holidayId: HolidayId, recipeId: string, now: number): void {
  opener = { key: handoffKey(holidayId, recipeId), at: now };
}

/** True once when Step Mode for this recipe was opened from its holiday page moments ago. */
export function takeStepModeOpener(holidayId: HolidayId, recipeId: string, now: number): boolean {
  const hit = opener !== null && opener.key === handoffKey(holidayId, recipeId) && now - opener.at < HANDOFF_MS;
  opener = null;
  return hit;
}

/** Step Mode is closing: the next holiday page for this holiday focuses the recipe card it came from. */
export function setReturnFocus(holidayId: HolidayId, recipeId: string, now: number): void {
  returnTo = { key: handoffKey(holidayId, recipeId), at: now };
}

/** The recipe id to focus on this holiday page, once, if Step Mode just closed. */
export function takeReturnFocus(holidayId: HolidayId, now: number): string | null {
  const hit = returnTo;
  returnTo = null;
  if (!hit || now - hit.at >= HANDOFF_MS || !hit.key.startsWith(`${holidayId}/`)) return null;
  return hit.key.slice(holidayId.length + 1);
}

// ───────────────────────────────────────────────────────── per-day panel

export interface DayLine {
  readonly n: DayNumber;
  /** 0-based index within the span. */
  readonly index: number;
  readonly name: string;
  readonly today: boolean;
  readonly main: boolean;
}

export interface DayPanel {
  /** "Today is Dhanteras", "Night 4 of 8 — tonight we light 4 candles". */
  readonly headline: string;
  readonly detail: string | null;
  /** Menorah / kinara candles burning tonight. */
  readonly candles: { readonly lit: number; readonly of: number } | null;
  /** 0..1 through a long span (Ramadan, Lunar New Year, Nowruz). */
  readonly progress: number | null;
}

/** "Night 3", "Day 5": a numbered placeholder rather than a real name. */
const GENERIC_NAME = /^(Day|Night) \d+$/;
/** Spans longer than this list only the named days, the main day, today, and the ends. */
const MAX_LINES = 9;
/** Spans at least this long show a progress bar while they are on. */
const PROGRESS_FROM = 10;

/** Every civil day of the span with its name (the holiday's `dayNames`, else "Day 3 of 8"). */
export function spanLines(meta: Pick<HolidayMeta, 'dayNames'>, occ: Occurrence, today: CivilDate): DayLine[] {
  const t = toDayNumber(today);
  const of = occ.end - occ.start + 1;
  const out: DayLine[] = [];
  for (let i = 0; i < of; i++) {
    const n = occ.start + i;
    out.push({ n, index: i, name: meta.dayNames?.[i] ?? fmt('dayOf', { day: i + 1, of }), today: n === t, main: n === occ.main });
  }
  return out;
}

/** Long spans keep the first and last day, the main day, today and any day with a real name. */
export function compactLines(lines: readonly DayLine[], max = MAX_LINES): DayLine[] {
  if (lines.length <= max) return [...lines];
  const last = lines.length - 1;
  return lines.filter((l) => l.index === 0 || l.index === last || l.main || l.today || !(GENERIC_NAME.test(l.name) || /^Day \d+ of \d+$/.test(l.name)));
}

/** "Today is Dhanteras", but day names that already talk about tonight stand on their own. */
export function headlineForName(name: string, holidayName: string): string {
  if (GENERIC_NAME.test(name)) return `${holidayName} — ${name}`;
  return /tonight/i.test(name) ? name : `Today is ${name}`;
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/**
 * The Story section's per-day panel while a multi-day holiday is on: what today is, the candles burning tonight
 * (Hanukkah 8 + Kwanzaa 7, via `candlesLit`) and progress through long spans. Null before it starts (Dates lists
 * the days) and for single-day holidays (the hero already says "IT'S TODAY!").
 */
export function dayPanel(meta: HolidayMeta, occ: Occurrence, status: Status, today: CivilDate): DayPanel | null {
  const span = occ.end - occ.start + 1;
  const named = meta.dayNames !== undefined && meta.dayNames.length === span;
  if (status.kind !== 'ongoing' || span <= 1) return null;
  const name = named ? meta.dayNames?.[status.day - 1] : undefined;
  const dayOf = fmt('dayOf', { day: status.day, of: status.of });
  const progress = span >= PROGRESS_FROM ? spanProgress(occ, today) : null;

  if (meta.effect === 'menorah') {
    const lit = candlesLit(occ, today, 8);
    if (status.day <= 8) {
      const headline = `${fmt('nightOf', { night: lit, of: 8 })} — tonight we light ${plural(lit, 'candle', 'candles')}`;
      return { headline, detail: name !== undefined && !GENERIC_NAME.test(name) ? name : null, candles: { lit, of: 8 }, progress: null };
    }
    return { headline: name ?? fmt('lastDay', { name: meta.name }), detail: 'All eight candles shone last night.', candles: { lit: 8, of: 8 }, progress: null };
  }
  if (meta.effect === 'kinara') {
    const lit = candlesLit(occ, today, 7);
    const headline = name !== undefined ? `${fmt('dayOf', { day: status.day, of: 7 })} — today's principle is ${name}` : dayOf;
    return { headline, detail: `${plural(lit, 'candle', 'candles')} glow on the kinara tonight.`, candles: { lit, of: 7 }, progress: null };
  }
  if (name !== undefined) {
    const mainName = meta.dayNames?.[occ.main - occ.start];
    const detail = status.sleepsToMain > 0
      ? `${pluralSleeps(status.sleepsToMain)} until ${mainName !== undefined && !GENERIC_NAME.test(mainName) ? mainName : meta.name}`
      : GENERIC_NAME.test(name) ? null : dayOf;
    return { headline: headlineForName(name, meta.name), detail, candles: null, progress };
  }
  return { headline: `${meta.name} — ${dayOf}`, detail: null, candles: null, progress };
}

// ───────────────────────────────────────────────────────── Lunar New Year zodiac

export interface Zodiac {
  readonly animal: string;
  readonly emoji: string;
  /** Mandarin (simplified) + pinyin, Korean + romanisation, Vietnamese (which has its own animals for two years). */
  readonly zh: string; readonly zhRoman: string;
  readonly ko: string; readonly koRoman: string;
  readonly vi: string; readonly viNote: string | null;
}

const ZODIAC: readonly Zodiac[] = [
  { animal: 'Rat', emoji: '🐀', zh: '鼠', zhRoman: 'shǔ', ko: '쥐', koRoman: 'jwi', vi: 'Chuột', viNote: null },
  { animal: 'Ox', emoji: '🐂', zh: '牛', zhRoman: 'niú', ko: '소', koRoman: 'so', vi: 'Trâu', viNote: 'In Vietnam it is the Year of the Water Buffalo.' },
  { animal: 'Tiger', emoji: '🐅', zh: '虎', zhRoman: 'hǔ', ko: '호랑이', koRoman: 'horangi', vi: 'Hổ', viNote: null },
  { animal: 'Rabbit', emoji: '🐇', zh: '兔', zhRoman: 'tù', ko: '토끼', koRoman: 'tokki', vi: 'Mèo', viNote: 'In Vietnam it is the Year of the Cat!' },
  { animal: 'Dragon', emoji: '🐉', zh: '龙', zhRoman: 'lóng', ko: '용', koRoman: 'yong', vi: 'Rồng', viNote: null },
  { animal: 'Snake', emoji: '🐍', zh: '蛇', zhRoman: 'shé', ko: '뱀', koRoman: 'baem', vi: 'Rắn', viNote: null },
  { animal: 'Horse', emoji: '🐎', zh: '马', zhRoman: 'mǎ', ko: '말', koRoman: 'mal', vi: 'Ngựa', viNote: null },
  { animal: 'Goat', emoji: '🐐', zh: '羊', zhRoman: 'yáng', ko: '양', koRoman: 'yang', vi: 'Dê', viNote: null },
  { animal: 'Monkey', emoji: '🐒', zh: '猴', zhRoman: 'hóu', ko: '원숭이', koRoman: 'wonsungi', vi: 'Khỉ', viNote: null },
  { animal: 'Rooster', emoji: '🐓', zh: '鸡', zhRoman: 'jī', ko: '닭', koRoman: 'dak', vi: 'Gà', viNote: null },
  { animal: 'Dog', emoji: '🐕', zh: '狗', zhRoman: 'gǒu', ko: '개', koRoman: 'gae', vi: 'Chó', viNote: null },
  { animal: 'Pig', emoji: '🐖', zh: '猪', zhRoman: 'zhū', ko: '돼지', koRoman: 'dwaeji', vi: 'Lợn', viNote: null },
];

/** The animal of the lunar year that begins in Gregorian `year` (2020 = Rat), same cycle as `zodiacFor`. */
export function zodiacInfo(year: number): Zodiac {
  return ZODIAC[(((year - 2020) % 12) + 12) % 12]!;
}

// ───────────────────────────────────────────────────────── stickers & dates

/** Day-off date to show, if any: the US federal shift only matters in the US, the Monday rule only in Canada. */
export function observedFor(meta: Pick<HolidayMeta, 'observedShift'>, occ: Occurrence, region: Region): DayNumber | null {
  if (occ.observed === undefined) return null;
  const shift = meta.observedShift ?? 'none';
  if (shift === 'us-federal' && region === 'US') return occ.observed;
  if (shift === 'next-monday' && region === 'CA') return occ.observed;
  return null;
}

/** Days since the last occurrence ended, when that was within a week ("we just celebrated!"); else null. */
export function justCelebratedDays(previous: Occurrence | undefined, today: CivilDate): number | null {
  if (!previous) return null;
  const ago = toDayNumber(today) - previous.end;
  return ago >= 1 && ago <= 7 ? ago : null;
}

export type StickerState =
  | { readonly kind: 'earned'; readonly year: number; readonly on: string }
  | { readonly kind: 'waiting'; readonly occ: Occurrence; readonly nextYear: boolean }
  | { readonly kind: 'unknown' };

/**
 * What the Sticker section shows: the sticker earned for the current or most recent occurrence, otherwise a
 * silhouette waiting for the next one (never a penalty: "see you next year").
 */
export function stickerState(
  holidayId: HolidayId, stickers: Readonly<Record<string, string>>, current: Occurrence | null,
  previous: Occurrence | undefined, today: CivilDate,
): StickerState {
  for (const occ of [current, previous]) {
    if (!occ) continue;
    const on = stickers[`${holidayId}:${occ.year}`];
    if (on !== undefined) return { kind: 'earned', year: occ.year, on };
  }
  if (!current) return { kind: 'unknown' };
  return { kind: 'waiting', occ: current, nextYear: current.year > today.y };
}

// ───────────────────────────────────────────────────────── advent doors

export type DoorState = 'opened' | 'ready' | 'locked';

/** The Christmas advent strip lives on the page from 1 to 24 December. */
export function adventVisible(today: CivilDate): boolean {
  return today.m === 12 && today.d >= 1 && today.d <= 24;
}

export function adventKey(year: number, day: number): string {
  return `${year}-${day}`;
}

/** Today's and earlier doors open (and stay open once opened); later doors wait. */
export function doorState(day: number, today: CivilDate, opened: Readonly<Record<string, true>>): DoorState {
  if (today.m !== 12 || day > today.d) return 'locked';
  return opened[adventKey(today.y, day)] ? 'opened' : 'ready';
}

/** Sleeps until a December door may open ("Not yet! 3 more sleeps"). */
export function sleepsUntilDoor(day: number, today: CivilDate): number {
  return toDayNumber({ y: today.y, m: 12, d: day }) - toDayNumber(today);
}

// ───────────────────────────────────────────────────────── timers

export interface TimerView {
  readonly remainingMs: number;
  /** 0 at the start → 1 when the time is up. */
  readonly progress: number;
  readonly done: boolean;
  /** "9:59", "1:00:00". */
  readonly label: string;
}

/** "10:00", "0:05", "1:30:00": whole seconds rounded up, so a fresh 10-minute timer reads 10:00 and ends on 0:00. */
export function formatTimer(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export function timerView(totalMs: number, elapsedMs: number): TimerView {
  const total = Math.max(0, totalMs);
  const remainingMs = Math.max(0, total - Math.max(0, elapsedMs));
  const progress = total === 0 ? 1 : Math.min(1, Math.max(0, 1 - remainingMs / total));
  return { remainingMs, progress, done: remainingMs === 0, label: formatTimer(remainingMs) };
}

/** Spoken form for the timer button: "9 minutes 59 seconds left". */
export function timerWords(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(plural(h, 'hour', 'hours'));
  if (m > 0) parts.push(plural(m, 'minute', 'minutes'));
  if (s > 0 || parts.length === 0) parts.push(plural(s, 'second', 'seconds'));
  return `${parts.join(' ')} left`;
}

// ───────────────────────────────────────────────────────── ingredient checklist & units

/** A new set with `index` flipped (the checklist state is immutable so each card can keep its own copy). */
export function toggleChecked(checked: ReadonlySet<number>, index: number): Set<number> {
  const next = new Set(checked);
  if (next.has(index)) next.delete(index); else next.add(index);
  return next;
}

/** "3 of 11 ready" / "Everything is ready!" */
export function checklistSummary(checked: number, total: number): string {
  if (total > 0 && checked >= total) return 'Everything is ready!';
  return `${Math.min(checked, total)} of ${total} ready`;
}

/** Session memory of ticked ingredients and materials, keyed `${holidayId}/${itemId}`, so Step Mode and Back keep them. */
const CHECKED = new Map<string, ReadonlySet<number>>();

export function checkedFor(key: string): ReadonlySet<number> {
  return CHECKED.get(key) ?? new Set<number>();
}

export function setChecked(key: string, checked: ReadonlySet<number>): void {
  CHECKED.set(key, checked);
}

export function otherUnits(units: Units): Units {
  return units === 'us' ? 'metric' : 'us';
}

export interface IngredientParts {
  readonly qty: string;
  readonly item: string;
  readonly note: string | null;
  readonly optional: boolean;
}

/** One checklist line in the chosen units; the missing system is derived by format.ts. */
export function ingredientParts(ing: Ingredient, units: Units): IngredientParts {
  return { qty: formatMeasure(ing, units), item: ing.item, note: ing.note ?? null, optional: ing.optional === true };
}

/** Step Mode always ends on "Taste test!": content steps that already say so are kept, otherwise one is added. */
export function withTasteTest<T extends { readonly text: string }>(steps: readonly T[], make: (text: string) => T): T[] {
  const last = steps[steps.length - 1];
  if (last && /^taste test/i.test(last.text.trim())) return [...steps];
  return [...steps, make(COPY.tasteTest)];
}

// ───────────────────────────────────────────────────────── "how we know" in words

const NTH = ['first', 'second', 'third', 'fourth'] as const;

function monthDay(month: number, day: number, locale: string | undefined): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(new Date(2024, month - 1, day, 12));
}

function monthName(month: number, locale: string | undefined): string {
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, month - 1, 1, 12));
}

function weekdayName(weekday: number, locale: string | undefined): string {
  // 7 January 2024 was a Sunday (weekday 0).
  return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(new Date(2024, 0, 7 + weekday, 12));
}

const days = (n: number): string => plural(Math.abs(n), 'day', 'days');

/**
 * A computed rule as a short phrase for the Dates section: "the fourth Thursday of November", "47 days before
 * Easter Sunday", "14 days after Lunar New Year". Table rules are described by their source instead.
 */
export function ruleInWords(rule: DateRule, region: Region, nameOf: (id: HolidayId) => string | undefined, locale?: string): string {
  switch (rule.kind) {
    case 'fixed':
      return rule.month === 2 && rule.day === 29 ? '29 February, which only exists in leap years' : `${monthDay(rule.month, rule.day, locale)} every year`;
    case 'nthWeekday':
      return `the ${NTH[rule.n - 1] ?? `${rule.n}th`} ${weekdayName(rule.weekday, locale)} of ${monthName(rule.month, locale)}`;
    case 'lastWeekday':
      return `the last ${weekdayName(rule.weekday, locale)} of ${monthName(rule.month, locale)}`;
    case 'easter': {
      const easter = rule.calendar === 'julian' ? 'Orthodox Easter Sunday (worked out on the old Julian calendar)' : 'Easter Sunday';
      if (rule.offset === 0) {
        return rule.calendar === 'julian'
          ? 'the Orthodox Easter rule: the first Sunday after the spring full moon, worked out on the old Julian calendar'
          : 'the first Sunday after the first full moon of spring (the Easter rule)';
      }
      return `${days(rule.offset)} ${rule.offset < 0 ? 'before' : 'after'} ${easter}`;
    }
    case 'relative':
      return `${days(rule.offset)} ${rule.offset < 0 ? 'before' : 'after'} ${nameOf(rule.to) ?? rule.to}`;
    case 'byRegion':
      return ruleInWords(rule.variants[region] ?? rule.fallback, region, nameOf, locale);
    case 'custom':
      return 'the last Sunday of May, or the first Sunday of June when that day is Pentecost';
    case 'table':
      return 'a calendar table';
  }
}

