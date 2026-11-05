import { parseIso, sameDay, todayLocal, type CivilDate } from '../dates/civil';

export interface Clock {
  now(): Date;
  today(): CivilDate;
  /** true when a `?today=` pretend date is active (stickers are not saved). */
  readonly pretending: boolean;
}

/** The device clock: civil dates come from local-time getters, never from toISOString. */
export function localClock(): Clock {
  return {
    now: () => new Date(),
    today: () => todayLocal(new Date()),
    pretending: false,
  };
}

/** A clock pinned to `day` (the `?today=` flag). `now()` keeps the real time of day on that day, for the NYE clock. */
export function pretendClock(day: CivilDate): Clock {
  return {
    now: () => {
      const real = new Date();
      return new Date(day.y, day.m - 1, day.d, real.getHours(), real.getMinutes(), real.getSeconds(), real.getMilliseconds());
    },
    today: () => day,
    pretending: true,
  };
}

/** Years the pretend flag may point at: the tables' coverage. */
export const TODAY_FLAG_YEARS = { from: 2024, to: 2035 } as const;

/** `?today=YYYY-MM-DD` → a real civil date inside 2024-01-01…2035-12-31, else null (ignored). */
export function parseTodayFlag(s: string | null): CivilDate | null {
  if (s === null) return null;
  const c = parseIso(s.trim());
  if (!c) return null;
  return c.y >= TODAY_FLAG_YEARS.from && c.y <= TODAY_FLAG_YEARS.to ? c : null;
}

/**
 * Milliseconds from `now` to the next local midnight. `Date` normalizes the day overflow and the
 * DST change, so a 23-hour or 25-hour day gives its true length.
 */
export function msUntilLocalMidnight(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime() - now.getTime();
}

/** Fired a little after midnight so the timer never lands a hair early. */
const MIDNIGHT_SLACK_MS = 500;
/** Mobile browsers suspend timers in the background, so the day is also re-checked on a slow heartbeat. */
const HEARTBEAT_MS = 60_000;

/**
 * Calls `onDayChange` when the clock's civil day moves past the day last rendered: a timer armed
 * at local midnight (+500 ms, re-armed each day), a 60 s heartbeat, and visibilitychange/pageshow
 * (where a `document` exists). A pretend clock never changes day, so the ticker is quiet.
 */
export class MidnightTicker {
  private rendered: CivilDate;
  private midnightTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private readonly onWake = (): void => { this.check(); };

  constructor(private readonly clock: Clock, private readonly onDayChange: (today: CivilDate) => void) {
    this.rendered = clock.today();
  }

  start(): void {
    this.stop();
    this.rendered = this.clock.today();
    this.arm();
    this.heartbeat = setInterval(this.onWake, HEARTBEAT_MS);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.onWake);
    if (typeof window !== 'undefined') window.addEventListener('pageshow', this.onWake);
  }

  stop(): void {
    if (this.midnightTimer !== null) clearTimeout(this.midnightTimer);
    if (this.heartbeat !== null) clearInterval(this.heartbeat);
    this.midnightTimer = null;
    this.heartbeat = null;
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.onWake);
    if (typeof window !== 'undefined') window.removeEventListener('pageshow', this.onWake);
  }

  /** Compares the clock's day with the rendered one; returns true (after notifying) when it moved. */
  check(): boolean {
    const today = this.clock.today();
    if (sameDay(today, this.rendered)) return false;
    this.rendered = today;
    this.onDayChange(today);
    return true;
  }

  private arm(): void {
    if (this.midnightTimer !== null) clearTimeout(this.midnightTimer);
    this.midnightTimer = setTimeout(() => {
      this.midnightTimer = null;
      this.check();
      this.arm();
    }, msUntilLocalMidnight(this.clock.now()) + MIDNIGHT_SLACK_MS);
  }
}
