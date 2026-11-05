import { civil, daysInMonth, weekday, type CivilDate, type Weekday } from './civil';

/**
 * The n-th `wd` of month `m` in year `y` (n = 1 is the first one).
 * `first = 1 + ((wd − weekday(y,m,1) + 7) % 7)`, then `+ 7(n − 1)`.
 */
export function nthWeekday(y: number, m: number, wd: Weekday, n: 1 | 2 | 3 | 4): CivilDate {
  const first = 1 + ((wd - weekday(civil(y, m, 1)) + 7) % 7);
  return civil(y, m, first + 7 * (n - 1));
}

/** The last `wd` of month `m` in year `y`: step back from the month's last day. */
export function lastWeekday(y: number, m: number, wd: Weekday): CivilDate {
  const last = daysInMonth(y, m);
  const back = (weekday(civil(y, m, last)) - wd + 7) % 7;
  return civil(y, m, last - back);
}
