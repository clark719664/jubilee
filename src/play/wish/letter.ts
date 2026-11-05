/**
 * letter.ts — what a wish is, how it is kept on the Fridge, and when Santa's reply is ready (pure logic).
 *
 * A wish is tiny JSON: the chips the child picked, what they wrote (≤ 600 characters in all, split
 * between the free text and the "kind by…" line), an optional "To:" pick for love notes, the first
 * name already stored on the device (never asked for here) and the year. Letters and Santa's replies
 * are both Fridge items of kind 'wish'; `data.type` tells them apart.
 */
import { compare, parseIso, type CivilDate } from '../../dates/civil';
import type { FridgeItem } from '../fridge';
import { SKIN_IDS, type Skin, type SkinId } from './skins';

/** All free text on one paper together. */
export const TEXT_MAX = 600;
/** Of which the "I've been kind by…" line may use this much. */
export const KIND_MAX = 120;
export const TEXT_BODY_MAX = TEXT_MAX - KIND_MAX;

export interface WishLetter {
  readonly v: 1;
  readonly type: 'letter';
  readonly skin: SkinId;
  readonly chips: readonly string[];
  readonly text: string;
  readonly kind: string;
  readonly to?: string;
  readonly name?: string;
  readonly year: number;
}

export interface WishReply {
  readonly v: 1;
  readonly type: 'reply';
  /** Fridge id of the letter it answers. */
  readonly letterId: string;
  readonly greeting: string;
  readonly paragraphs: readonly string[];
  readonly signoff: string;
  readonly ps: string;
  readonly year: number;
}

export type WishData = WishLetter | WishReply;

/** Trims, collapses runs of blank lines and caps the length; never throws on odd input. */
export function cleanText(s: unknown, max: number): string {
  if (typeof s !== 'string') return '';
  return s.replace(/\r\n?/g, '\n').replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}

export interface Draft {
  chips: string[];
  text: string;
  kind: string;
  to: string;
}

export function emptyDraft(): Draft {
  return { chips: [], text: '', kind: '', to: '' };
}

/** A paper is ready to send once it has a picture or a few letters on it. */
export function canSend(d: Draft): boolean {
  return d.chips.length > 0 || cleanText(d.text, TEXT_BODY_MAX).length > 0 || cleanText(d.kind, KIND_MAX).length > 0;
}

/** Toggles a chip, keeping pick order and the skin's cap. Returns the new list and whether it changed. */
export function toggleChip(chips: readonly string[], id: string, max: number): { readonly chips: string[]; readonly changed: boolean; readonly full: boolean } {
  if (chips.includes(id)) return { chips: chips.filter((x) => x !== id), changed: true, full: false };
  if (chips.length >= max) return { chips: [...chips], changed: false, full: true };
  return { chips: [...chips, id], changed: true, full: false };
}

export function makeLetter(skin: Skin, d: Draft, year: number, name: string | undefined): WishLetter {
  const known = new Set(skin.chips.map((x) => x.id));
  const chips = [...new Set(d.chips)].filter((x) => known.has(x)).slice(0, skin.maxChips);
  const to = cleanText(d.to, 40);
  const nm = cleanText(name, 40);
  return {
    v: 1, type: 'letter', skin: skin.id, chips,
    text: cleanText(d.text, TEXT_BODY_MAX),
    kind: skin.kindLabel ? cleanText(d.kind, KIND_MAX) : '',
    ...(to ? { to } : {}),
    ...(nm ? { name: nm } : {}),
    year,
  };
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

/** Reads Fridge data defensively (storage may hold anything). */
export function asLetter(data: unknown): WishLetter | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (o.type !== 'letter' || !SKIN_IDS.includes(o.skin as SkinId) || !isStringArray(o.chips) || typeof o.year !== 'number') return null;
  return {
    v: 1, type: 'letter', skin: o.skin as SkinId, chips: o.chips.slice(0, 12),
    text: cleanText(o.text, TEXT_BODY_MAX), kind: cleanText(o.kind, KIND_MAX), year: o.year,
    ...(typeof o.to === 'string' && o.to ? { to: cleanText(o.to, 40) } : {}),
    ...(typeof o.name === 'string' && o.name ? { name: cleanText(o.name, 40) } : {}),
  };
}

export function asReply(data: unknown): WishReply | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (o.type !== 'reply' || typeof o.letterId !== 'string' || !isStringArray(o.paragraphs)) return null;
  return {
    v: 1, type: 'reply', letterId: o.letterId, paragraphs: o.paragraphs,
    greeting: typeof o.greeting === 'string' ? o.greeting : '', signoff: typeof o.signoff === 'string' ? o.signoff : '',
    ps: typeof o.ps === 'string' ? o.ps : '', year: typeof o.year === 'number' ? o.year : 0,
  };
}

export interface KeptLetter { readonly item: FridgeItem; readonly letter: WishLetter }
export interface KeptReply { readonly item: FridgeItem; readonly reply: WishReply }

/** This holiday's letters (oldest first) and replies from the Fridge's wish items. */
export function kept(items: readonly FridgeItem[], holidayId: string): { readonly letters: KeptLetter[]; readonly replies: KeptReply[] } {
  const letters: KeptLetter[] = [];
  const replies: KeptReply[] = [];
  for (const item of items) {
    if (item.kind !== 'wish' || item.holidayId !== holidayId) continue;
    const l = asLetter(item.data);
    if (l) { letters.push({ item, letter: l }); continue; }
    const r = asReply(item.data);
    if (r) replies.push({ item, reply: r });
  }
  return { letters, replies };
}

/**
 * Santa's reply is ready from the morning after the letter was written, by the device's own date.
 * Never while pretending a date (a pretend day must not make the real reply arrive early or late).
 */
export function replyReady(made: string, today: CivilDate, pretending: boolean): boolean {
  if (pretending) return false;
  const m = parseIso(made);
  return m !== null && compare(m, today) < 0;
}

/** The fridge items a full Fridge could give up, oldest first (wishes before other things is not our call). */
export function takeDownCandidates(items: readonly FridgeItem[], n = 6): FridgeItem[] {
  return [...items].sort((a, b) => (a.made < b.made ? -1 : a.made > b.made ? 1 : 0)).slice(0, n);
}
