/**
 * The giant counter inside every hero (§9.1, §9.11, §11):
 *
 *   sleeps   the number (springs in, pops when it changes) + "sleeps until Halloween", a row of tiny moons
 *            (one per sleep, at most 30 drawn, "+N" beyond, the last one asleep), milestone microcopy, and
 *            "Today is Dhanteras!" while a multi-day holiday is under way before its headline day
 *   today    "IT'S TODAY!" / "Tonight at sundown!" as a big wobbly word, plus the day's own name
 *   day      later days of a span: "Night 4 of 8", "Day 3 of 7 · Ujima (Working Together)"
 *   clock    New Year's Eve: hh:mm:ss to local midnight, the last ten seconds giant, then
 *            "Happy New Year, Maya!" (the hero fires the confetti cannon through `onMidnight`)
 *
 * Screen readers get one polite aria-live mirror of the counter in plain words. It changes only when the
 * counter does, and the New Year's clock speaks once a minute and at 10, 3, 2 and 1 seconds — never every tick.
 * Tapping the number makes the moons do a wave (the secret in §9.1).
 *
 * The model functions are pure (tested in Node); `mountCounter` is the DOM part the hero uses.
 */
import { msUntilLocalMidnight } from '../app/clock';
import type { AppContext } from '../app/context';
import { commaNumber, pluralSleeps } from '../app/format';
import type { HolidayMeta } from '../content/types';
import { finalDayBreakdown, labelFor, type Breakdown } from '../dates/countdown';
import type { Occurrence, Status } from '../dates/occurrences';
import { COPY, fmt, milestoneCopy } from './copy';
import { h, svg } from './dom';
import { icon } from './icons';

/** Moons drawn under the counter before the row says "+N". */
export const MOONS_MAX = 30;
/** The holiday whose final day counts down in hours, minutes and seconds. */
export const NYE_ID = 'new-years-eve';
/** Seconds (besides the minute marks) at which the New Year's clock speaks. */
const SPOKEN_SECONDS: ReadonlySet<number> = new Set([10, 3, 2, 1]);
/** The last seconds that are drawn giant. */
const GIANT_SECONDS = 10;
const WAVE_MS = 1600;
/** "Tonight at sundown!" gets a smaller word than "IT'S TODAY!" so it stays on one or two lines. */
const LONG_WORD = 12;
const UNTIL_MIDNIGHT = 'until midnight!';

export interface MoonRow {
  /** Moons actually drawn (≤ MOONS_MAX). */
  readonly shown: number;
  /** The "+N" beyond the drawn row (0 = none). */
  readonly more: number;
}

/** One moon per sleep, at most 30 drawn; the rest become "+N". */
export function moonRow(sleeps: number): MoonRow {
  const n = Number.isFinite(sleeps) ? Math.max(0, Math.floor(sleeps)) : 0;
  return { shown: Math.min(n, MOONS_MAX), more: Math.max(0, n - MOONS_MAX) };
}

export type CounterModel =
  | {
    readonly kind: 'sleeps'; readonly sleeps: number; readonly label: string;
    /** "Today is Dhanteras!" while a span is under way before its headline day. */
    readonly todayIs: string | null;
    readonly milestone: string | null; readonly speech: string;
  }
  | {
    readonly kind: 'today'; readonly tonight: boolean;
    /** "IT'S TODAY!" or "Tonight at sundown!" */
    readonly word: string;
    /** The day's own name ("Christmas Day", "First candle tonight!") or "Day 1 of 3". */
    readonly dayLabel: string | null; readonly speech: string;
  }
  | {
    readonly kind: 'day';
    /** The big number (null on the last day of a sundown holiday, which has no night of its own). */
    readonly day: number | null; readonly label: string; readonly dayName: string | null; readonly speech: string;
  }
  | { readonly kind: 'clock'; readonly label: string; readonly speech: string }
  | { readonly kind: 'passed'; readonly label: string; readonly speech: string };

/** New Year's Eve shows the hh:mm:ss clock all day on 31 December. */
export function isNewYearsEveClock(meta: Pick<HolidayMeta, 'id'>, status: Status): boolean {
  return meta.id === NYE_ID && status.kind === 'ongoing';
}

/** "sleeps until Halloween" (the number sits beside it). */
export function sleepsLabel(sleeps: number, name: string): string {
  return fmt('sleepsUntil', { sleeps: sleeps === 1 ? COPY.sleepsOne : COPY.sleepsMany, name });
}

function dayNameOf(meta: Pick<HolidayMeta, 'dayNames'>, day: number): string | null {
  return meta.dayNames?.[day - 1] ?? null;
}

function sentence(...parts: (string | null)[]): string {
  return parts.filter((p): p is string => p !== null && p !== '').join('. ').replace(/([!?.…])\./g, '$1');
}

function sleepsModel(meta: HolidayMeta, sleeps: number, todayName: string | null): CounterModel {
  const todayIs = todayName === null ? null : fmt('ribbon.today', { name: todayName });
  const milestone = milestoneCopy(sleeps);
  return {
    kind: 'sleeps', sleeps, label: sleepsLabel(sleeps, meta.name), todayIs, milestone,
    speech: sentence(fmt('sleepsUntil', { sleeps: pluralSleeps(sleeps), name: meta.name }), todayIs, milestone),
  };
}

/**
 * What the counter says for a holiday on `status`. Sundown holidays count nights ("Night 4 of 8": the eve
 * is night 1, so a nine-day Hanukkah span has eight nights) and name their last civil day; other spans
 * count days ("Day 3 of 7") and add the day's own name when it has one.
 */
export function counterModel(meta: HolidayMeta, occ: Occurrence, status: Status): CounterModel {
  if (isNewYearsEveClock(meta, status)) {
    return { kind: 'clock', label: UNTIL_MIDNIGHT, speech: `${meta.name}: ${COPY.itsToday}` };
  }
  switch (status.kind) {
    case 'upcoming':
      return sleepsModel(meta, status.sleeps, null);
    case 'passed': {
      const label = labelFor(status, meta);
      return { kind: 'passed', label, speech: `${meta.name}: ${label}` };
    }
    case 'ongoing': {
      const name = dayNameOf(meta, status.day);
      if (status.tonight || status.sleepsToMain === 0) {
        const word = status.tonight ? COPY.tonight : COPY.itsToday;
        const dayLabel = name ?? (status.of > 1 ? fmt('dayOf', { day: status.day, of: status.of }) : null);
        return { kind: 'today', tonight: status.tonight, word, dayLabel, speech: sentence(`${meta.name}: ${word}`, dayLabel) };
      }
      if (status.sleepsToMain > 0) return sleepsModel(meta, status.sleepsToMain, name ?? fmt('dayOf', { day: status.day, of: status.of }));
      if (occ.beginsAtSundown) {
        if (status.day >= status.of) {
          const label = name ?? fmt('lastDay', { name: meta.name });
          return { kind: 'day', day: null, label, dayName: null, speech: `${meta.name}: ${label}` };
        }
        const label = fmt('nightOf', { night: status.day, of: status.of - 1 });
        const dayName = name !== null && name !== `Night ${status.day}` ? name : null;
        return { kind: 'day', day: status.day, label, dayName, speech: sentence(`${meta.name}: ${label}`, dayName) };
      }
      const label = fmt('dayOf', { day: status.day, of: status.of });
      return { kind: 'day', day: status.day, label, dayName: name, speech: sentence(`${meta.name}: ${label}`, name) };
    }
  }
}

// ───────────────────────────────────────────────────────── New Year's Eve clock

/** Hours/minutes/seconds from `now` to the next local midnight (a 23- or 25-hour day keeps its real length). */
export function nyeBreakdown(now: Date): Breakdown {
  return finalDayBreakdown(now, new Date(now.getTime() + msUntilLocalMidnight(now)));
}

export function totalSeconds(b: Breakdown): number {
  return b.h * 3600 + b.m * 60 + b.s;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** "07:05:09" */
export function formatClock(b: Breakdown): string {
  return `${pad2(b.h)}:${pad2(b.m)}:${pad2(b.s)}`;
}

/**
 * When the clock should speak: once per minute (the key changes as the minute does) and at 10, 3, 2 and
 * 1 seconds, then at midnight. Null inside the last minute between those marks (nothing new to say).
 */
export function clockAnnounceKey(total: number): string | null {
  if (total <= 0) return 'midnight';
  if (SPOKEN_SECONDS.has(total)) return `s${total}`;
  if (total < 60) return null;
  return `m${Math.ceil(total / 60)}`;
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/** The words the live region says for the clock ("7 hours and 12 minutes until midnight", "3!"). */
export function clockSpeech(b: Breakdown, name?: string): string {
  const total = totalSeconds(b);
  if (total <= 0) return happyNewYear(name);
  if (total === GIANT_SECONDS) return `${GIANT_SECONDS} seconds to midnight!`;
  if (total < GIANT_SECONDS) return `${total}!`;
  if (total < 60) return `${plural(total, 'second', 'seconds')} until midnight`;
  const minutes = Math.ceil(total / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts = [hours > 0 ? plural(hours, 'hour', 'hours') : '', rest > 0 ? plural(rest, 'minute', 'minutes') : ''].filter(Boolean);
  return `${parts.join(' and ')} until midnight`;
}

/** "Happy New Year, Maya!" */
export function happyNewYear(name?: string): string {
  return fmt('happyNewYear', { name: name ? `, ${name}` : '' });
}

// ───────────────────────────────────────────────────────── DOM

export interface CounterProps {
  readonly meta: HolidayMeta;
  readonly occ: Occurrence;
  readonly status: Status;
}

export interface CounterHooks {
  /** New Year's Eve: the clock just reached 00:00:00 (the hero fires the cannon). */
  readonly onMidnight?: () => void;
}

export interface CounterInstance {
  readonly el: HTMLElement;
  update(props: CounterProps): void;
  /** The secret: the moons do a wave (also what tapping the number does). */
  wave(): void;
  destroy(): void;
}

type Item = Node | null | false | undefined;

/** The real nodes of a list with optional entries, for `replaceChildren` (which takes no nulls). */
export function nodes(...items: Item[]): Node[] {
  return items.filter((n): n is Node => n instanceof Node);
}

/** Restarts a one-shot CSS animation class (pop, wave). */
export function replay(el: Element, cls: string): void {
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
}

/** The last moon of the row: the night before the holiday, fast asleep. */
function sleepyMoon(): SVGSVGElement {
  const el = svg('svg', { viewBox: '0 0 24 24', width: 14, height: 14, class: 'icon moon-face', 'aria-hidden': 'true', focusable: 'false' });
  el.append(
    svg('path', { d: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z' }),
    svg('path', { d: 'M6.9 12.3q1.6 1.7 3.2 0', fill: 'none', stroke: '#1f1a3d', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    svg('path', { d: 'M8.4 16.4q1.2.9 2.4 0', fill: 'none', stroke: '#1f1a3d', 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
  );
  return el;
}

function moonsEl(sleeps: number): HTMLElement {
  const { shown, more } = moonRow(sleeps);
  const row = h('div', { class: 'moons', 'aria-hidden': 'true' });
  for (let i = 0; i < shown; i++) {
    const last = i === shown - 1;
    const moon = h('span', { class: last ? 'moon moon-sleepy' : 'moon' }, last ? sleepyMoon() : icon('moon', 14));
    moon.style.setProperty('--i', String(i));
    row.append(moon);
  }
  if (more > 0) row.append(h('span', { class: 'moons-more' }, fmt('moonsMore', { n: commaNumber(more) })));
  return row;
}

export function mountCounter(ctx: AppContext, initial: CounterProps, hooks: CounterHooks = {}): CounterInstance {
  const view = h('div', { class: 'hero-slot' });
  const live = h('p', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const el = h('div', { class: 'hero-count' }, view, live);

  let props = initial;
  let model = counterModel(props.meta, props.occ, props.status);
  let num: HTMLElement | null = null;
  let moons: HTMLElement | null = null;
  let tick = 0;
  let waveTimer = 0;
  let lastKey: string | null = null;
  let midnight = false;

  const say = (text: string): void => {
    if (live.textContent !== text) live.textContent = text;
  };

  const wave = (): void => {
    if (num) replay(num, 'is-popping');
    if (!moons) return;
    replay(moons, 'is-waving');
    window.clearTimeout(waveTimer);
    const row = moons;
    waveTimer = window.setTimeout(() => row.classList.remove('is-waving'), WAVE_MS);
  };

  const number = (text: string, cls = 'counter-num'): HTMLElement => {
    const span = h('span', { class: cls, 'aria-hidden': 'true' }, text);
    span.addEventListener('click', wave);
    span.addEventListener('animationend', () => span.classList.remove('is-popping'));
    return span;
  };

  const stopClock = (): void => {
    window.clearTimeout(tick);
    tick = 0;
  };

  /** One New Year's Eve tick, then re-armed on the next whole second of the (possibly pretend) clock. */
  const clockTick = (label: HTMLElement): void => {
    tick = 0;
    const name = ctx.store.progress.name;
    const b = nyeBreakdown(ctx.clock.now());
    const total = totalSeconds(b);
    const key = clockAnnounceKey(total);
    if (key !== null && key !== lastKey) {
      lastKey = key;
      say(clockSpeech(b, name));
    }
    if (total <= 0) {
      if (midnight) return;
      midnight = true;
      num = null;
      view.replaceChildren(h('p', { class: 'counter-word', 'aria-hidden': 'true' }, happyNewYear(name)));
      hooks.onMidnight?.();
      return; // the MidnightTicker re-mounts the view on the new day; a pretend day just stays at midnight
    }
    if (num) {
      if (total <= GIANT_SECONDS) {
        num.className = 'counter-num counter-ten';
        num.textContent = String(total);
        label.hidden = true;
        replay(num, 'is-popping');
      } else {
        num.className = 'counter-num counter-clock';
        num.textContent = formatClock(b);
        label.hidden = false;
      }
    }
    const ms = ctx.clock.now().getMilliseconds();
    tick = window.setTimeout(() => clockTick(label), 1000 - ms + 20);
  };

  const render = (pop: boolean): void => {
    stopClock();
    num = null;
    moons = null;
    switch (model.kind) {
      case 'sleeps':
        num = number(commaNumber(model.sleeps));
        moons = moonsEl(model.sleeps);
        view.replaceChildren(...nodes(
          h('div', { class: 'counter' }, num, h('span', { class: 'counter-label', 'aria-hidden': 'true' }, model.label)),
          model.todayIs !== null && h('p', { class: 'counter-sub', 'aria-hidden': 'true' }, model.todayIs),
          moons,
          model.milestone !== null && h('p', { class: 'milestone', 'aria-hidden': 'true' }, model.milestone),
        ));
        break;
      case 'today':
        view.replaceChildren(...nodes(
          h('p', { class: model.word.length > LONG_WORD ? 'counter-word is-long' : 'counter-word', 'aria-hidden': 'true' }, model.word),
          model.dayLabel !== null && h('p', { class: 'counter-sub', 'aria-hidden': 'true' }, model.dayLabel),
        ));
        break;
      case 'day':
        num = model.day === null ? null : number(String(model.day));
        view.replaceChildren(...nodes(
          h('div', { class: 'counter' }, num, h('span', { class: 'counter-label', 'aria-hidden': 'true' }, model.label)),
          model.dayName !== null && h('p', { class: 'counter-sub', 'aria-hidden': 'true' }, model.dayName),
        ));
        break;
      case 'clock': {
        const label = h('span', { class: 'counter-label', 'aria-hidden': 'true' }, model.label);
        num = number('', 'counter-num counter-clock');
        view.replaceChildren(h('div', { class: 'counter is-clock' }, num, label));
        lastKey = null;
        clockTick(label);
        return;
      }
      case 'passed':
        view.replaceChildren(h('p', { class: 'counter-sub', 'aria-hidden': 'true' }, model.label));
        break;
    }
    say(model.speech);
    if (pop && num) replay(num, 'is-popping');
  };

  render(true);

  return {
    el,
    update(next) {
      const before = model;
      props = next;
      model = counterModel(props.meta, props.occ, props.status);
      const changed = before.kind !== model.kind || before.speech !== model.speech;
      if (!changed && model.kind !== 'clock') return;
      if (before.kind === 'clock' && model.kind === 'clock') return; // the clock keeps ticking by itself
      render(changed);
    },
    wave,
    destroy() {
      stopClock();
      window.clearTimeout(waveTimer);
    },
  };
}
