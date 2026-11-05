/**
 * season.ts — which holidays make items "in season" right now. Pure (the dates engine, no DOM).
 *
 * "For today" is the holiday happening today (a big one before a silly day), or else the next one
 * coming up: that is what the "Dress for …" button dresses Jubi for. The holiday page the child came
 * from is in season too, so opening Dress-up from Diwali in October puts Diwali's items up front even
 * when Halloween comes first. Only holidays that have at least one item count.
 */
import type { CustomHoliday, HolidayMeta } from '../../content/types';
import type { CivilDate } from '../../dates/civil';
import { happeningNow, nextUp } from '../../dates/occurrences';
import type { Region } from '../../dates/rules';
import { holidayItemCount } from './outfit';

export interface SeasonInput {
  readonly metas: readonly HolidayMeta[];
  readonly customs: readonly CustomHoliday[];
  readonly today: CivilDate;
  readonly region: Region;
  readonly everywhere: boolean;
  /** The holiday page this was opened from. */
  readonly page?: HolidayMeta;
}

export interface Season {
  /** The holiday "Dress for …" dresses for (today's, else the next with items). */
  readonly forToday: HolidayMeta | null;
  /** True when forToday is happening today. */
  readonly isToday: boolean;
  /** Every holiday whose items sparkle and come first. */
  readonly holidays: readonly HolidayMeta[];
}

export function seasonFor(input: SeasonInput): Season {
  const { metas, customs, today, region, everywhere, page } = input;
  const byId = new Map(metas.map((m) => [m.id, m] as const));
  const hasItems = (m: HolidayMeta | undefined): m is HolidayMeta => m !== undefined && holidayItemCount(m) > 0;

  let forToday: HolidayMeta | null = null;
  let isToday = false;
  try {
    // happeningNow is sorted by priority, so a big holiday beats a silly day on the same date.
    const now = happeningNow(metas, customs, today, region).map((o) => byId.get(o.holidayId)).find(hasItems);
    if (now) { forToday = now; isToday = true; }
    else {
      const next = nextUp(metas, customs, today, region, everywhere).map((u) => byId.get(u.occ.holidayId)).find(hasItems);
      forToday = next ?? null;
    }
  } catch {
    // The calendar can run past its tables; dressing up must still work.
    forToday = null;
  }
  const holidays: HolidayMeta[] = [];
  if (forToday) holidays.push(forToday);
  if (page && hasItems(page) && page.id !== forToday?.id) holidays.push(page);
  return { forToday, isToday, holidays };
}
