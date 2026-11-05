import type { IsoDate } from '../civil';

export type TableId =
  | 'lunar-new-year' | 'mid-autumn' | 'dragon-boat'
  | 'diwali' | 'holi'
  | 'rosh-hashanah' | 'hanukkah' | 'passover' | 'purim'
  | 'ramadan-start' | 'eid-al-fitr' | 'eid-al-adha'
  | 'nowruz';

export type CalendarKind = 'chinese' | 'hindu' | 'hebrew' | 'islamic' | 'astronomical';

export interface TableRow {
  readonly date: IsoDate;
  /** A widely used alternative main day (e.g. Diwali when calendars differ). */
  readonly alt?: IsoDate;
  /** Kid-safe note shown with the occurrence ('Year of the Horse'). */
  readonly note?: string;
}

export interface HolidayTable {
  readonly id: TableId;
  readonly calendar: CalendarKind;
  /** e.g. 'first full day (25 Kislev); the eve is derived by beginsAtSundown' */
  readonly convention: string;
  readonly source: string;
  readonly retrieved: IsoDate;
  /** Inclusive Gregorian years the rows cover, e.g. { from: 2024, to: 2035 }. */
  readonly coverage: { readonly from: number; readonly to: number };
  /** 'sighting' → the UI says "expected". */
  readonly confidence: 'exact' | 'sighting';
  /** Sorted ascending; a Gregorian year may hold 0, 1 or 2 rows. */
  readonly rows: readonly TableRow[];
}
