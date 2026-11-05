/**
 * Civil (proleptic Gregorian) date arithmetic on plain integers.
 *
 * Nothing in here touches Date milliseconds: DST days are 23 or 25 hours long,
 * so `ms / 86_400_000` is wrong twice a year. `Date` appears only in the two
 * boundary helpers at the bottom (today in local time, local midnight) and in
 * Intl formatting.
 */
export interface CivilDate {
  readonly y: number;
  /** 1–12 */
  readonly m: number;
  /** 1–31 */
  readonly d: number;
}

/** Integer days since 1970-01-01 (proleptic Gregorian). */
export type DayNumber = number;

/** 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 'YYYY-MM-DD'. Parsed by `parseIso`, never by `new Date(string)`. */
export type IsoDate = `${number}-${number}-${number}`;

export const SUNDAY: Weekday = 0;
export const MONDAY: Weekday = 1;
export const TUESDAY: Weekday = 2;
export const WEDNESDAY: Weekday = 3;
export const THURSDAY: Weekday = 4;
export const FRIDAY: Weekday = 5;
export const SATURDAY: Weekday = 6;

export function civil(y: number, m: number, d: number): CivilDate {
  return { y, m, d };
}

export function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  if (m === 2) return isLeap(y) ? 29 : 28;
  return m === 4 || m === 6 || m === 9 || m === 11 ? 30 : 31;
}

export function isValid(c: CivilDate): boolean {
  return (
    Number.isInteger(c.y) && Number.isInteger(c.m) && Number.isInteger(c.d) &&
    c.m >= 1 && c.m <= 12 && c.d >= 1 && c.d <= daysInMonth(c.y, c.m)
  );
}

/** Howard Hinnant's days_from_civil. */
export function toDayNumber(c: CivilDate): DayNumber {
  const y = c.m <= 2 ? c.y - 1 : c.y;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400; // [0, 399]
  const mp = (c.m + 9) % 12; // March = 0
  const doy = Math.floor((153 * mp + 2) / 5) + c.d - 1; // [0, 365]
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy; // [0, 146096]
  return era * 146097 + doe - 719468;
}

/** Howard Hinnant's civil_from_days. */
export function fromDayNumber(n: DayNumber): CivilDate {
  const z = n + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097; // [0, 146096]
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365); // [0, 399]
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100)); // [0, 365]
  const mp = Math.floor((5 * doy + 2) / 153); // [0, 11]
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1; // [1, 31]
  const m = mp < 10 ? mp + 3 : mp - 9; // [1, 12]
  return { y: m <= 2 ? y + 1 : y, m, d };
}

/** 1970-01-01 was a Thursday (4). */
export function weekdayOf(n: DayNumber): Weekday {
  return ((((n + 4) % 7) + 7) % 7) as Weekday;
}

export function weekday(c: CivilDate): Weekday {
  return weekdayOf(toDayNumber(c));
}

export function addDays(c: CivilDate, days: number): CivilDate {
  return fromDayNumber(toDayNumber(c) + days);
}

/** b − a in days. */
export function diffDays(a: CivilDate, b: CivilDate): number {
  return toDayNumber(b) - toDayNumber(a);
}

export function compare(a: CivilDate, b: CivilDate): -1 | 0 | 1 {
  const x = toDayNumber(a);
  const y = toDayNumber(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

export function sameDay(a: CivilDate, b: CivilDate): boolean {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Strict 'YYYY-MM-DD' parser; rejects impossible dates such as 2025-02-30. */
export function parseIso(s: string): CivilDate | null {
  const m = ISO_RE.exec(s);
  if (!m) return null;
  const c = { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  return isValid(c) ? c : null;
}

export function formatIso(c: CivilDate): IsoDate {
  const mm = String(c.m).padStart(2, '0');
  const dd = String(c.d).padStart(2, '0');
  return `${c.y}-${mm}-${dd}` as IsoDate;
}

/** Day-number → ISO, convenience for tables and sticker keys. */
export function isoOf(n: DayNumber): IsoDate {
  return formatIso(fromDayNumber(n));
}

/** "Thursday, 27 November" (or "Thursday, November 27" in en-US). Never raw mm/dd. */
export function formatLong(c: CivilDate, locale?: string, opts: { year?: boolean } = {}): string {
  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: 'long', day: 'numeric', month: 'long', ...(opts.year ? { year: 'numeric' } : {}),
  });
  // Noon UTC-independent construction: build a local Date for the civil day.
  return fmt.format(new Date(c.y, c.m - 1, c.d, 12, 0, 0, 0));
}

/** "27 Nov" / "Nov 27" short form for tiles and strips. */
export function formatShort(c: CivilDate, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(c.y, c.m - 1, c.d, 12));
}

/** The civil date in the device's local time zone. Uses getters, never toISOString. */
export function todayLocal(now: Date): CivilDate {
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

/** Local midnight at the start of the given civil day (Date normalizes DST). */
export function localMidnight(c: CivilDate): Date {
  return new Date(c.y, c.m - 1, c.d, 0, 0, 0, 0);
}
