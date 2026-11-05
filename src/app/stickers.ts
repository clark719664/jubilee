/**
 * Sticker and badge earning rules (§9 item 10), evaluated as pure functions
 * against today + Progress + occurrences. No DOM, no storage: the views call
 * these and then `store.earnSticker` / `store.awardBadge` with the result.
 *
 * Nothing here is ever a penalty: a missed day is a silhouette with
 * "see you next year", and there are no streaks to lose.
 */
import { toDayNumber, type CivilDate, type DayNumber } from '../dates/civil';
import type { Occurrence } from '../dates/occurrences';
import type { HolidayId, HolidayMeta, Tradition } from '../content/types';
import type { BadgeId, Progress } from './state';

export interface StickerAward {
  readonly holidayId: HolidayId;
  readonly year: number;
  /** `${holidayId}:${year}` — the Progress.stickers key. */
  readonly key: string;
}

export function stickerKey(holidayId: HolidayId, year: number): string {
  return `${holidayId}:${year}`;
}

/** The sticker a visit earns today: any civil day of the span counts (Hanukkah night 4 included), not the day after. */
export function stickerFor(occ: Occurrence, today: CivilDate | DayNumber): StickerAward | null {
  const day = typeof today === 'number' ? today : toDayNumber(today);
  if (day < occ.start || day > occ.end) return null;
  return { holidayId: occ.holidayId, year: occ.year, key: stickerKey(occ.holidayId, occ.year) };
}

export function hasSticker(progress: Progress, holidayId: HolidayId, year: number): boolean {
  return progress.stickers[stickerKey(holidayId, year)] !== undefined;
}

/** First Footer is only for opening Jubilee on New Year's Day itself. */
export function isFirstFootingDay(today: CivilDate): boolean {
  return today.m === 1 && today.d === 1;
}

export const BADGE_THRESHOLDS = {
  earlyBirdDays: 5,
  worldTravelerPages: 10,
  worldTravelerTraditions: 5,
  littleChefRecipes: 3,
  factFinderFacts: 25,
} as const;

/** Distinct holiday pages visited and distinct traditions among them. */
export function countTraditions(visitedIds: readonly HolidayId[], metas: readonly HolidayMeta[]): { pages: number; traditions: number } {
  const byId = new Map(metas.map((m) => [m.id, m] as const));
  const seen = new Set<Tradition>();
  let pages = 0;
  for (const id of visitedIds) {
    const meta = byId.get(id);
    if (!meta) continue;
    pages += 1;
    for (const t of meta.traditions) seen.add(t);
  }
  return { pages, traditions: seen.size };
}

export function traditionsVisited(progress: Progress, metas: readonly HolidayMeta[]): number {
  return countTraditions(Object.keys(progress.visited), metas).traditions;
}

export interface BadgeMeter { readonly have: number; readonly need: number }

/** Progress toward a badge, for the meters on the sticker page. */
export function badgeMeter(id: BadgeId, progress: Progress, traditions: number): BadgeMeter {
  switch (id) {
    case 'early-bird': return { have: progress.openDays.length, need: BADGE_THRESHOLDS.earlyBirdDays };
    case 'world-traveler': return { have: Math.min(Object.keys(progress.visited).length, traditions * 2), need: BADGE_THRESHOLDS.worldTravelerPages };
    case 'little-chef': return { have: progress.recipesDone.length, need: BADGE_THRESHOLDS.littleChefRecipes };
    case 'fact-finder': return { have: progress.factsFlipped, need: BADGE_THRESHOLDS.factFinderFacts };
    case 'first-footer': return { have: progress.badges['first-footer'] ? 1 : 0, need: 1 };
  }
}

function earned(id: BadgeId, progress: Progress, today: CivilDate, traditions: number): boolean {
  switch (id) {
    case 'early-bird': return progress.openDays.length >= BADGE_THRESHOLDS.earlyBirdDays;
    case 'world-traveler':
      return Object.keys(progress.visited).length >= BADGE_THRESHOLDS.worldTravelerPages && traditions >= BADGE_THRESHOLDS.worldTravelerTraditions;
    case 'little-chef': return progress.recipesDone.length >= BADGE_THRESHOLDS.littleChefRecipes;
    case 'fact-finder': return progress.factsFlipped >= BADGE_THRESHOLDS.factFinderFacts;
    case 'first-footer': return isFirstFootingDay(today);
  }
}

/**
 * Badges earned now that are not yet in `progress.badges`, in a stable order.
 * `traditionsVisited` is the number of distinct traditions among visited pages
 * (see `traditionsVisited()`); it is passed in so this stays free of registry imports.
 */
export function evaluateBadges(progress: Progress, today: CivilDate, traditionsVisited: number): BadgeId[] {
  const ids: readonly BadgeId[] = ['first-footer', 'early-bird', 'little-chef', 'fact-finder', 'world-traveler'];
  return ids.filter((id) => !progress.badges[id] && earned(id, progress, today, traditionsVisited));
}
