/**
 * sticker-book.ts — the Sticker Book's pure helpers (seasons, which sticker each holiday shows this year,
 * badge meters). The home page's sticker strip uses them too, so they live apart from the Sticker Book view
 * and its chunk.
 */
import { BADGE_IDS, type BadgeId, type Progress } from '../app/state';
import { badgeMeter, stickerKey, type BadgeMeter } from '../app/stickers';
import type { HolidayMeta } from '../content/types';
import { fromDayNumber, toDayNumber, type CivilDate, type IsoDate } from '../dates/civil';
import { allOccurrences, type Occurrence } from '../dates/occurrences';
import type { Region } from '../dates/rules';
import { BADGES, SEASON_LABELS, type BadgeCopy } from './copy';

export type Season = keyof typeof SEASON_LABELS;
export const SEASONS: readonly Season[] = ['winter', 'spring', 'summer', 'fall'];
export const SEASON_EMOJI: Record<Season, string> = { winter: '❄️', spring: '🌷', summer: '☀️', fall: '🍂' };

/** Season of a month (1–12), northern-hemisphere shelves as the spec names them. */
export function seasonOfMonth(month: number): Season {
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'fall';
}

export type StickerState = 'earned' | 'ongoing' | 'upcoming' | 'missed';

export interface StickerEntry {
  readonly meta: HolidayMeta;
  readonly occ: Occurrence;
  readonly key: string;
  readonly state: StickerState;
  /** ISO date the sticker was earned. */
  readonly earned?: IsoDate;
  /** Sleeps until the main day, for upcoming stickers. */
  readonly sleeps?: number;
  readonly custom: boolean;
}

export interface StickerBook {
  readonly year: number;
  readonly shelves: Readonly<Record<Season, readonly StickerEntry[]>>;
  /** Birthday Stars for custom days. */
  readonly birthdays: readonly StickerEntry[];
  /** Earned tier 1–2 catalog stickers this year. */
  readonly have: number;
  /** Tier 1–2 catalog holidays that happen this year (Leap Day only in leap years). */
  readonly total: number;
}

/**
 * The shelves for `year`. `metas` should include the custom days (ctx.allMetas()); `customIds`
 * says which ones they are. A holiday with two occurrences in one year (Ramadan 2030) keeps one
 * sticker, shown against the occurrence that is still to come, else the latest one.
 */
export function stickerBook(
  metas: readonly HolidayMeta[], customIds: ReadonlySet<string>, progress: Progress, year: number, today: CivilDate, region: Region,
): StickerBook {
  const t = toDayNumber(today);
  const byId = new Map(metas.map((m) => [m.id, m] as const));
  const chosen = new Map<string, Occurrence>();
  for (const occ of allOccurrences(metas, [], { y: year, m: 7, d: 1 }, region)) {
    if (occ.year !== year) continue;
    const meta = byId.get(occ.holidayId);
    if (!meta || meta.tier === 3) continue;
    const prev = chosen.get(occ.holidayId);
    // Keep the first occurrence still to come; otherwise the latest one.
    if (!prev || prev.end < t) chosen.set(occ.holidayId, occ);
  }
  const shelves: Record<Season, StickerEntry[]> = { winter: [], spring: [], summer: [], fall: [] };
  const birthdays: StickerEntry[] = [];
  let have = 0;
  let total = 0;
  const entries = [...chosen.values()].sort((a, b) => a.main - b.main);
  for (const occ of entries) {
    const meta = byId.get(occ.holidayId)!;
    const key = stickerKey(meta.id, year);
    const earned = progress.stickers[key];
    const custom = customIds.has(meta.id);
    const base = { meta, occ, key, custom };
    let entry: StickerEntry;
    if (earned) entry = { ...base, state: 'earned', earned };
    else if (t >= occ.start && t <= occ.end) entry = { ...base, state: 'ongoing' };
    else if (t < occ.start) entry = { ...base, state: 'upcoming', sleeps: occ.main - t };
    else entry = { ...base, state: 'missed' };
    if (custom) {
      birthdays.push(entry);
      continue;
    }
    total += 1;
    if (entry.state === 'earned') have += 1;
    shelves[seasonOfMonth(fromDayNumber(occ.main).m)].push(entry);
  }
  // Winter reads Jan → Feb → Dec in date order, which is how the year actually goes.
  return { year, shelves, birthdays, have, total };
}

/** Years the switcher offers: this year plus every past year with at least one sticker, newest last. */
export function stickerYears(progress: Progress, thisYear: number): number[] {
  const years = new Set<number>([thisYear]);
  for (const key of Object.keys(progress.stickers)) {
    const y = Number(key.slice(key.lastIndexOf(':') + 1));
    if (Number.isInteger(y) && y < thisYear) years.add(y);
  }
  return [...years].sort((a, b) => a - b);
}

export interface BadgeRow {
  readonly id: BadgeId;
  readonly copy: BadgeCopy;
  readonly earned?: IsoDate;
  readonly meter: BadgeMeter;
  /** 0–100, full when earned. */
  readonly percent: number;
}

/** Every badge with its meter. `traditions` = distinct traditions among visited pages. */
export function badgeRows(progress: Progress, traditions: number): BadgeRow[] {
  return BADGE_IDS.map((id) => {
    const meter = badgeMeter(id, progress, traditions);
    const earned = progress.badges[id];
    const percent = earned ? 100 : Math.max(0, Math.min(100, Math.round((meter.have / meter.need) * 100)));
    return { id, copy: BADGES[id], meter, percent, ...(earned ? { earned } : {}) };
  });
}
