import { afterEach, describe, expect, it, vi } from 'vitest';
import { MidnightTicker, localClock, msUntilLocalMidnight, parseTodayFlag, pretendClock, type Clock } from '../src/app/clock';
import { todayLocal, type CivilDate } from '../src/dates/civil';

afterEach(() => {
  vi.useRealTimers();
});

describe('parseTodayFlag', () => {
  it('accepts real civil dates inside 2024–2035 only', () => {
    expect(parseTodayFlag('2024-01-01')).toEqual({ y: 2024, m: 1, d: 1 });
    expect(parseTodayFlag('2035-12-31')).toEqual({ y: 2035, m: 12, d: 31 });
    expect(parseTodayFlag(' 2030-10-31 ')).toEqual({ y: 2030, m: 10, d: 31 });
    expect(parseTodayFlag('2028-02-29')).toEqual({ y: 2028, m: 2, d: 29 });
  });

  it('rejects out-of-range, impossible and non-ISO values', () => {
    expect(parseTodayFlag('2023-12-31')).toBeNull();
    expect(parseTodayFlag('2036-01-01')).toBeNull();
    expect(parseTodayFlag('2025-02-30')).toBeNull();
    expect(parseTodayFlag('yesterday')).toBeNull();
    expect(parseTodayFlag('2025-2-3')).toBeNull();
    expect(parseTodayFlag('')).toBeNull();
    expect(parseTodayFlag(null)).toBeNull();
  });
});

describe('clocks', () => {
  it('pretendClock pins today(), flags pretending and keeps the real time of day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 22, 14, 30, 15, 250));
    const c = pretendClock({ y: 2030, m: 10, d: 31 });
    expect(c.today()).toEqual({ y: 2030, m: 10, d: 31 });
    expect(c.pretending).toBe(true);
    const now = c.now();
    expect(todayLocal(now)).toEqual({ y: 2030, m: 10, d: 31 });
    expect([now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()]).toEqual([14, 30, 15, 250]);
  });

  it('localClock reads the device day from local getters', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 8, 23, 59, 59));
    const c = localClock();
    expect(c.pretending).toBe(false);
    expect(c.today()).toEqual({ y: 2026, m: 3, d: 8 });
    vi.setSystemTime(new Date(2026, 2, 9, 0, 0, 0));
    expect(c.today()).toEqual({ y: 2026, m: 3, d: 9 });
  });
});

describe('MidnightTicker', () => {
  it('fires once when local midnight passes (DST night included), then re-arms for the next day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 7, 23, 0, 0));
    const seen: CivilDate[] = [];
    const t = new MidnightTicker(localClock(), (d) => seen.push(d));
    t.start();
    vi.advanceTimersByTime(msUntilLocalMidnight(new Date()) - 1);
    expect(seen).toEqual([]);
    vi.advanceTimersByTime(1 + 500);
    expect(seen).toEqual([{ y: 2026, m: 3, d: 8 }]);
    // The heartbeat keeps running but the day has not changed again.
    vi.advanceTimersByTime(10 * 60_000);
    expect(seen).toHaveLength(1);
    // Next midnight (23-hour day in America/New_York, 24 elsewhere): exactly one more callback.
    vi.advanceTimersByTime(msUntilLocalMidnight(new Date()) + 500);
    expect(seen).toEqual([{ y: 2026, m: 3, d: 8 }, { y: 2026, m: 3, d: 9 }]);
    t.stop();
    vi.advanceTimersByTime(48 * 3_600_000);
    expect(seen).toHaveLength(2);
  });

  it('the 60 s heartbeat and check() catch a day change the timer slept through', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 23, 58, 0));
    let today: CivilDate = { y: 2026, m: 12, d: 31 };
    const clock: Clock = { now: () => new Date(), today: () => today, pretending: false };
    const seen: CivilDate[] = [];
    const t = new MidnightTicker(clock, (d) => seen.push(d));
    t.start();
    today = { y: 2027, m: 1, d: 1 }; // the device clock moved while timers were suspended
    expect(t.check()).toBe(true);
    expect(seen).toEqual([{ y: 2027, m: 1, d: 1 }]);
    expect(t.check()).toBe(false);
    today = { y: 2027, m: 1, d: 2 };
    vi.advanceTimersByTime(60_000);
    expect(seen).toEqual([{ y: 2027, m: 1, d: 1 }, { y: 2027, m: 1, d: 2 }]);
    t.stop();
  });

  it('stays quiet with a pretend clock and tolerates being started twice', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 0));
    const seen: CivilDate[] = [];
    const t = new MidnightTicker(pretendClock({ y: 2030, m: 10, d: 31 }), (d) => seen.push(d));
    t.start();
    t.start();
    vi.advanceTimersByTime(3 * 24 * 3_600_000);
    expect(seen).toEqual([]);
    t.stop();
    t.stop();
  });
});
