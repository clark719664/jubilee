/**
 * doors/logic.ts — the pure rules behind Countdown Doors (no DOM, tested in Node).
 *
 * Every door carries `opensAt`: the number of sleeps before the main day at which it unlocks. A countdown
 * door for "3 sleeps" opens when 3 or fewer sleeps are left; Christmas advent door d opens on 1…24 December,
 * i.e. at 25 − d sleeps before Christmas Day. So one comparison drives every holiday:
 *
 *   unlocked  ⇔  sleepsToMain ≤ opensAt
 *
 * During the holiday and for a fortnight afterwards every door is open. Outside the countdown window the
 * board is shown with every door shut and "The first door opens in N sleeps". Nothing is ever lost: doors
 * opened on earlier days stay open, missed days are simply ready to open, and doors opened last time keep a
 * star so they can be peeked at again all year.
 */
import type { DoorKind, Greeting, HolidayContent, HolidayMeta } from '../../content/types';
import { toDayNumber, type CivilDate } from '../../dates/civil';
import type { NextResult, Occurrence } from '../../dates/occurrences';

/** Christmas Day: advent door d opens at (25 − d) sleeps. */
export const ADVENT_MAIN_DAY = 25;
/** Countdown doors shown before a holiday (Christmas keeps its 24). */
export const MAX_COUNTDOWN_DOORS = 12;
/** Days after the holiday ends during which the whole board stays open on its own. */
export const JUST_AFTER_DAYS = 14;
/** Fewest doors that make a board worth showing (fallback boards built from facts and greetings). */
export const MIN_DOORS = 6;

export interface BoardDoor {
  /** The number painted on the door: the advent day (Christmas) or the sleeps count. */
  readonly n: number;
  /** Unlocks when sleepsToMain ≤ opensAt. */
  readonly opensAt: number;
  readonly kind: DoorKind;
  readonly text: string;
  /** Resolved greeting for 'say' doors. */
  readonly greeting?: Greeting;
}

const clampIndex = (i: number | undefined, len: number): number => (i !== undefined && i >= 0 && i < len ? Math.floor(i) : 0);

/**
 * The doors for a holiday, first-to-open first. Christmas uses its 24 advent doors; others use `doors`
 * (sleeps 12…1, one per sleep). A tier-1 holiday whose doors are not written yet gets a board built from its
 * facts, greetings and crafts, so the ritual never has a gap. Returns [] when there is nothing to show.
 */
export function boardDoors(meta: HolidayMeta, content: HolidayContent): BoardDoor[] {
  const greetings = content.greetings;
  if (content.advent && content.advent.length > 0) {
    const byDay = new Map<number, BoardDoor>();
    for (const d of content.advent) {
      if (Number.isInteger(d.day) && d.day >= 1 && d.day <= 24 && !byDay.has(d.day)) {
        byDay.set(d.day, { n: d.day, opensAt: ADVENT_MAIN_DAY - d.day, kind: d.kind, text: d.text });
      }
    }
    return [...byDay.values()].sort((a, b) => b.opensAt - a.opensAt);
  }
  if (content.doors && content.doors.length > 0) {
    const seen = new Set<number>();
    const out: BoardDoor[] = [];
    for (const d of content.doors) {
      if (!Number.isInteger(d.sleeps) || d.sleeps < 1 || d.sleeps > MAX_COUNTDOWN_DOORS || seen.has(d.sleeps)) continue;
      seen.add(d.sleeps);
      if (d.kind === 'say' && greetings.length > 0) {
        out.push({ n: d.sleeps, opensAt: d.sleeps, kind: 'say', text: d.text, greeting: greetings[clampIndex(d.greeting, greetings.length)]! });
      } else {
        // A 'say' door with no greetings to teach still has its words; it reads as a fact.
        out.push({ n: d.sleeps, opensAt: d.sleeps, kind: d.kind === 'say' ? 'fact' : d.kind, text: d.text });
      }
    }
    return out.sort((a, b) => b.opensAt - a.opensAt);
  }
  return meta.tier === 1 ? fallbackDoors(content) : [];
}

/** Facts, greetings and crafts woven into up to 12 doors (fact, say, fact, craft, …). */
export function fallbackDoors(content: HolidayContent): BoardDoor[] {
  const facts = content.facts.map((f) => ({ kind: 'fact' as const, text: f.text }));
  const says = content.greetings.map((g, i) => ({ kind: 'say' as const, text: `Learn to say “${g.roman ?? g.text}” in ${g.langName}.`, greeting: i }));
  const crafts = content.crafts.map((c) => ({ kind: 'craft' as const, text: `${c.title}: ${c.blurb}` }));
  const lanes = [facts, says, facts, crafts];
  const picked: { kind: DoorKind; text: string; greeting?: number }[] = [];
  const cursor = new Map<unknown, number>();
  for (let guard = 0; picked.length < MAX_COUNTDOWN_DOORS && guard < 64; guard++) {
    const lane = lanes[guard % lanes.length]!;
    const i = cursor.get(lane) ?? 0;
    if (i < lane.length) { picked.push(lane[i]!); cursor.set(lane, i + 1); }
    if ([facts, says, crafts].every((l) => (cursor.get(l) ?? 0) >= l.length)) break;
  }
  if (picked.length < MIN_DOORS) return [];
  const total = picked.length;
  return picked.map((p, i) => {
    const n = total - i;
    return p.kind === 'say' && p.greeting !== undefined
      ? { n, opensAt: n, kind: 'say' as const, text: p.text, greeting: content.greetings[p.greeting]! }
      : { n, opensAt: n, kind: p.kind, text: p.text };
  });
}

// ───────── where we are in the countdown ─────────

export type Phase =
  /** Some doors are unlocked; `sleeps` to the main day. */
  | { readonly kind: 'countdown'; readonly sleeps: number; readonly year: number }
  /** The holiday is happening: every door is open. */
  | { readonly kind: 'celebrating'; readonly year: number }
  /** It ended `daysAgo` days ago: every door is still open. */
  | { readonly kind: 'after'; readonly year: number; readonly daysAgo: number }
  /** Too early: every door shut; the first opens in `firstIn` sleeps. `prevYear` = last time's board. */
  | { readonly kind: 'far'; readonly sleeps: number; readonly firstIn: number; readonly year: number; readonly prevYear?: number }
  /** The date tables end before the next occurrence. */
  | { readonly kind: 'beyond'; readonly prevYear?: number };

/**
 * Decides the board from the next occurrence (and the previous one, for "just after").
 * `firstOpensAt` is the largest `opensAt` on the board (12, or 24 for Christmas).
 */
export function phaseOf(next: NextResult, prev: Occurrence | undefined, today: CivilDate, firstOpensAt: number): Phase {
  const t = toDayNumber(today);
  const recent = prev && t - prev.end <= JUST_AFTER_DAYS && t > prev.end ? prev : undefined;
  if ('beyondCoverage' in next) {
    if (recent) return { kind: 'after', year: recent.year, daysAgo: t - recent.end };
    return prev ? { kind: 'beyond', prevYear: prev.year } : { kind: 'beyond' };
  }
  const { occ, status } = next;
  if (status.kind === 'ongoing') return { kind: 'celebrating', year: occ.year };
  if (status.kind === 'upcoming' && status.sleeps <= firstOpensAt) return { kind: 'countdown', sleeps: status.sleeps, year: occ.year };
  if (recent) return { kind: 'after', year: recent.year, daysAgo: t - recent.end };
  const sleeps = status.kind === 'upcoming' ? status.sleeps : 0;
  return {
    kind: 'far', sleeps, firstIn: Math.max(1, sleeps - firstOpensAt), year: occ.year,
    ...(prev ? { prevYear: prev.year } : {}),
  };
}

/** The year whose memory the board shows (null when nothing is open on this board). */
export function boardYear(phase: Phase): number | null {
  return phase.kind === 'beyond' ? null : phase.year;
}

export type DoorState = 'locked' | 'today' | 'ready' | 'opened';

export interface DoorView {
  readonly state: DoorState;
  /** Sleeps until a locked door opens ("Not yet! 3 more sleeps"). 0 when unlocked. */
  readonly wait: number;
  /** A shut door the child opened last time: it keeps a star and can still be peeked at. */
  readonly fromLastTime: boolean;
}

/**
 * One door's state. `opened(n)` is this board's memory; `openedLastTime(n)` the previous occurrence's
 * (only consulted while the board is shut, so last year's peeks stay reachable all year).
 */
export function doorView(
  door: BoardDoor, phase: Phase, opened: (n: number) => boolean, openedLastTime: (n: number) => boolean = () => false,
): DoorView {
  switch (phase.kind) {
    case 'countdown': {
      if (door.opensAt < phase.sleeps) return { state: 'locked', wait: phase.sleeps - door.opensAt, fromLastTime: openedLastTime(door.n) };
      if (opened(door.n)) return { state: 'opened', wait: 0, fromLastTime: false };
      return { state: door.opensAt === phase.sleeps ? 'today' : 'ready', wait: 0, fromLastTime: false };
    }
    case 'celebrating':
    case 'after':
      return { state: opened(door.n) ? 'opened' : 'ready', wait: 0, fromLastTime: false };
    case 'far':
      return { state: 'locked', wait: Math.max(1, phase.sleeps - door.opensAt), fromLastTime: openedLastTime(door.n) };
    case 'beyond':
      return { state: 'locked', wait: 0, fromLastTime: openedLastTime(door.n) };
  }
}

/** A door the child may open right now (unlocked, or remembered from last time). */
export function canOpen(v: DoorView): boolean {
  return v.state !== 'locked' || v.fromLastTime;
}

/** Today's door (newest unlocked) and the next one to unlock, for the holiday-page strip and initial focus. */
export function featured(doors: readonly BoardDoor[], phase: Phase): { readonly today?: BoardDoor; readonly next?: BoardDoor } {
  if (phase.kind === 'countdown') {
    const unlocked = doors.filter((d) => d.opensAt >= phase.sleeps);
    const locked = doors.filter((d) => d.opensAt < phase.sleeps);
    const today = unlocked.reduce<BoardDoor | undefined>((best, d) => (!best || d.opensAt < best.opensAt ? d : best), undefined);
    const next = locked.reduce<BoardDoor | undefined>((best, d) => (!best || d.opensAt > best.opensAt ? d : best), undefined);
    return { ...(today ? { today } : {}), ...(next ? { next } : {}) };
  }
  if (phase.kind === 'far') {
    const next = doors.reduce<BoardDoor | undefined>((best, d) => (!best || d.opensAt > best.opensAt ? d : best), undefined);
    return next ? { next } : {};
  }
  return {};
}

/** How many doors are unlocked (drives the waxing moon on the lantern board). */
export function unlockedCount(doors: readonly BoardDoor[], phase: Phase): number {
  if (phase.kind === 'celebrating' || phase.kind === 'after') return doors.length;
  if (phase.kind === 'countdown') return doors.filter((d) => d.opensAt >= phase.sleeps).length;
  return 0;
}

// ───────── skins ─────────

export type Skin = 'advent' | 'niches' | 'house' | 'lanterns' | 'haunted' | 'envelopes' | 'eggs' | 'doors';

const SKIN_BY_ID: Readonly<Record<string, Skin>> = {
  christmas: 'advent',
  diwali: 'niches',
  hanukkah: 'house',
  'eid-al-fitr': 'lanterns',
  'eid-al-adha': 'lanterns',
  ramadan: 'lanterns',
  halloween: 'haunted',
  'lunar-new-year': 'envelopes',
  easter: 'eggs',
  'orthodox-easter': 'eggs',
};

export function skinFor(meta: HolidayMeta): Skin {
  return SKIN_BY_ID[meta.id] ?? (meta.theme === 'eid' || meta.theme === 'ramadan' ? 'lanterns' : 'doors');
}

/**
 * The order doors sit on the board. A real advent calendar scatters its numbers (finding today's door is
 * half the fun), so Christmas is shuffled with a fixed seed; every other board counts down left to right.
 */
export function boardOrder(doors: readonly BoardDoor[], skin: Skin, rand: () => number): BoardDoor[] {
  const out = doors.slice();
  if (skin !== 'advent') return out;
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Splits "What do elves learn at school? The elf-abet!" into a riddle and its answer, when it is one. */
export function splitJoke(text: string): { readonly ask: string; readonly answer: string } | null {
  const i = text.indexOf('? ');
  if (i < 0) return null;
  const ask = text.slice(0, i + 1).trim();
  const answer = text.slice(i + 2).trim();
  return ask && answer ? { ask, answer } : null;
}

/** Moon fullness for the lantern board: a thin crescent at the start, full on the day. */
export function moonFill(unlocked: number, total: number): number {
  if (total <= 0) return 0.12;
  return 0.12 + 0.88 * Math.min(1, Math.max(0, unlocked / total));
}
