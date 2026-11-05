/**
 * text.ts — turning a page template into the sentences the child reads (pure; tested in Node).
 *
 * The child's name comes from Progress (optional); without one the book says "our hero", which reads
 * naturally mid-sentence and is capitalized at the start of one ("Our hero sweeps the step"). A friend's
 * name is typed on the cover, kept only while the book is open (and on the Fridge if the child saves the
 * story), and cleaned to a single first name of letters.
 */
import type { StoryBook, StoryKeep, StoryPage } from './types';

export const NAME_FALLBACK = 'our hero';
export const TITLE_FALLBACK = 'Our Hero';
/** Longest friend's name the book uses (cleanFriend caps it, at a hyphen when it can). */
export const FRIEND_MAX = 20;
/**
 * How much the friend field lets a child type. Longer than FRIEND_MAX on purpose: the field never cuts a name
 * off mid-word while it is typed; the cover's "Starring …" line shows the name the book will use.
 */
export const FRIEND_INPUT_MAX = 40;
/** Matches Progress NAME_MAX (src/app/state.ts) so lints can try the longest name a child can save. */
export const NAME_MAX = 24;
export const SENTENCE_MAX = 180;

export interface Who {
  readonly name?: string;
  readonly friend?: string;
}

const TOKEN = /\{(name|friend)\}/g;
/** Letters (any script), combining marks, apostrophes and hyphens: "Zoë", "Mary-Jo", "D’Andre". */
const NOT_NAME = /[^\p{L}\p{M}'’-]+/gu;

/**
 * `s` in at most `max` characters, cut after the last whole word (at a space, or a hyphen inside a name) so a
 * long name never ends in half a word: "Ana Sofia Lopez Garcia Hernandez" → "Ana Sofia Lopez Garcia", not
 * "… Garcia H". Only a single word longer than `max` with nowhere to break is cut at `max`.
 */
export function capWords(s: string, max: number): string {
  if (s.length <= max) return s;
  const head = s.slice(0, max + 1);
  const at = Math.max(head.lastIndexOf(' '), head.lastIndexOf('-'));
  return (at > 0 ? s.slice(0, at) : s.slice(0, max)).replace(/[\s'’-]+$/u, '');
}

/** One first name, letters only, at most FRIEND_MAX characters; '' when nothing usable is left. */
export function cleanFriend(raw: string): string {
  const first = raw.trim().split(/\s+/)[0] ?? '';
  return capWords(first.replace(NOT_NAME, '').replace(/^['’-]+/, ''), FRIEND_MAX);
}

/** The saved name, trimmed and capped at a word boundary; undefined when empty. */
export function cleanName(raw: string | undefined): string | undefined {
  const s = capWords((raw ?? '').replace(/\s+/g, ' ').trim(), NAME_MAX);
  return s.length > 0 ? s : undefined;
}

/** Only the keys that hold something (exactOptionalPropertyTypes: never `name: undefined`). */
export function who(name: string | undefined, friend: string | undefined): Who {
  const n = cleanName(name);
  const f = friend ? cleanFriend(friend) : '';
  return { ...(n ? { name: n } : {}), ...(f ? { friend: f } : {}) };
}

export const usesFriend = (text: string): boolean => text.includes('{friend}');

/** The template this child reads on a page: the friend's version only when a friend is coming along. */
export function pageTemplate(page: StoryPage, w: Who): string {
  if (usesFriend(page.text) && !w.friend) return page.solo ?? page.text;
  return page.text;
}

/**
 * Splits text into sentences: a full stop, ! ? or … (plus any closing quote) followed by a space and
 * something that can start a sentence (a capital, an opening quote or a {token}).
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…][’”'")]*)\s+(?=[‘“'"(]?[\p{Lu}{])/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function capitalize(s: string): string {
  const m = /^([‘“'"(]*)(\p{Ll})/u.exec(s);
  return m ? `${m[1]}${m[2]!.toUpperCase()}${s.slice(m[0].length)}` : s;
}

/** Fills one sentence template. A friend token with no friend falls back to "a friend" (books avoid this). */
export function fillSentence(tpl: string, w: Who): string {
  const out = tpl.replace(TOKEN, (_m, k: string) => (k === 'name' ? w.name ?? NAME_FALLBACK : w.friend ?? 'a friend'));
  return capitalize(out);
}

/** The sentences of a page, ready to show and to read aloud. */
export function pageSentences(page: StoryPage, w: Who): string[] {
  return splitSentences(pageTemplate(page, w)).map((s) => fillSentence(s, w));
}

export function bookTitle(book: StoryBook, w: Who): string {
  return book.title.replace(TOKEN, (_m, k: string) => (k === 'name' ? w.name ?? TITLE_FALLBACK : w.friend ?? ''));
}

/** "Starring Maya and Sam" style credit line pieces for the cover and The End. */
export function starring(w: Who): string {
  const n = w.name ?? TITLE_FALLBACK;
  return w.friend ? `${n} and ${w.friend}` : n;
}

/** Word spans of a sentence (for read-along highlighting): [start, end) character offsets. */
export function wordSpans(sentence: string): { readonly start: number; readonly end: number }[] {
  const out: { start: number; end: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sentence)) !== null) out.push({ start: m.index, end: m.index + m[0].length });
  return out;
}

/** Index of the word a speech boundary at `charIndex` falls in (-1 before the first word). */
export function wordAt(spans: readonly { readonly start: number; readonly end: number }[], charIndex: number): number {
  let found = -1;
  for (let i = 0; i < spans.length; i++) {
    if (spans[i]!.start <= charIndex) found = i;
    else break;
  }
  return found;
}

/**
 * A Fridge item's data read back as a StoryKeep (for the Fridge gallery and re-reading): the book must be
 * one we have, and the names are cleaned again, since the stored JSON may have been edited by hand.
 */
export function sanitizeKeep(v: unknown, hasBook: (id: string) => boolean): StoryKeep | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (typeof o.bookId !== 'string' || !hasBook(o.bookId)) return null;
  const w = who(typeof o.name === 'string' ? o.name : undefined, typeof o.friend === 'string' ? o.friend : undefined);
  return { bookId: o.bookId, ...w };
}

/** What the Fridge keeps for this reading: the book and the names, nothing else. */
export function keepFor(bookId: string, w: Who): StoryKeep {
  return { bookId, ...(w.name ? { name: w.name } : {}), ...(w.friend ? { friend: w.friend } : {}) };
}

export function sameKeep(a: StoryKeep, b: StoryKeep): boolean {
  return a.bookId === b.bookId && (a.name ?? '') === (b.name ?? '') && (a.friend ?? '') === (b.friend ?? '');
}
