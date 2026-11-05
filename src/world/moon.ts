/**
 * Moon phases for the "Moon tonight" card. Phase instants come from the mean synodic
 * month (29.530588853 days from the 2000-01-06 18:14 UTC new moon) corrected with the
 * main periodic terms of Meeus' "Phases of the Moon" (ch. 49), which brings a new or
 * full moon to within a few minutes rather than the ±14 hours of the mean alone.
 * The age and illuminated fraction are then measured from the surrounding new moons.
 */
export type MoonPhaseName =
  | 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous'
  | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';

export interface MoonPhase {
  /** Days since the last new moon. */
  readonly age: number;
  /** Illuminated fraction 0..1. */
  readonly fraction: number;
  readonly phase: MoonPhaseName;
  readonly emoji: string;
  readonly label: string;
  readonly lastNew: Date;
  readonly nextNew: Date;
  readonly nextFull: Date;
}

export const SYNODIC_MONTH = 29.530588853;
/** Reference new moon: 2000-01-06 18:14 UTC. */
export const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

const PHASES: readonly { name: MoonPhaseName; emoji: string; label: string }[] = [
  { name: 'new', emoji: '🌑', label: 'New moon' },
  { name: 'waxing-crescent', emoji: '🌒', label: 'Waxing crescent' },
  { name: 'first-quarter', emoji: '🌓', label: 'First quarter' },
  { name: 'waxing-gibbous', emoji: '🌔', label: 'Waxing gibbous' },
  { name: 'full', emoji: '🌕', label: 'Full moon' },
  { name: 'waning-gibbous', emoji: '🌖', label: 'Waning gibbous' },
  { name: 'last-quarter', emoji: '🌗', label: 'Last quarter' },
  { name: 'waning-crescent', emoji: '🌘', label: 'Waning crescent' },
];

const DEG = Math.PI / 180;
const DAY_MS = 86_400_000;
/** Julian day of the Unix epoch. */
const JD_EPOCH = 2440587.5;
/** Mean new moon of lunation 0 (Meeus 49.1), in Julian days. */
const JDE0 = 2451550.09766;
const MEAN_MONTH = 29.530588861;

/** Instant of the new (k integer) or full (k + 0.5) moon of lunation k, in ms since the epoch. */
function phaseInstant(k: number, full: boolean): number {
  const kk = full ? k + 0.5 : k;
  const T = kk / 1236.85;
  const T2 = T * T;
  let jde = JDE0 + MEAN_MONTH * kk + 0.00015437 * T2 - 0.00000015 * T2 * T + 0.00000000073 * T2 * T2;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = (2.5534 + 29.10535670 * kk - 0.0000014 * T2) * DEG;
  const Mp = (201.5643 + 385.81693528 * kk + 0.0107582 * T2 + 0.00001238 * T2 * T) * DEG;
  const F = (160.7108 + 390.67050284 * kk - 0.0016118 * T2 - 0.00000227 * T2 * T) * DEG;
  const Ω = (124.7746 - 1.56375588 * kk + 0.0020672 * T2) * DEG;
  const s = Math.sin;
  const c1 = full ? -0.40614 : -0.40720;
  const c2 = full ? 0.17302 : 0.17241;
  const c3 = full ? 0.01614 : 0.01608;
  const c4 = full ? 0.01043 : 0.01039;
  const c5 = full ? 0.00734 : 0.00739;
  const c7 = full ? 0.00209 : 0.00208;
  jde += c1 * s(Mp)
    + c2 * E * s(M)
    + c3 * s(2 * Mp)
    + c4 * s(2 * F)
    + c5 * E * s(Mp - M)
    - 0.00514 * E * s(Mp + M)
    + c7 * E * E * s(2 * M)
    - 0.00111 * s(Mp - 2 * F)
    - 0.00057 * s(Mp + 2 * F)
    + 0.00056 * E * s(2 * Mp + M)
    - 0.00042 * s(3 * Mp)
    + 0.00042 * E * s(M + 2 * F)
    + 0.00038 * E * s(M - 2 * F)
    - 0.00024 * E * s(2 * Mp - M)
    - 0.00017 * s(Ω)
    - 0.00007 * s(Mp + 2 * M)
    + 0.00004 * s(2 * Mp - 2 * F)
    + 0.00004 * s(3 * M)
    + 0.00003 * s(Mp + M - 2 * F)
    + 0.00003 * s(2 * Mp + 2 * F)
    - 0.00003 * s(Mp + M + 2 * F)
    + 0.00003 * s(Mp - M + 2 * F)
    - 0.00002 * s(Mp - M - 2 * F)
    - 0.00002 * s(3 * Mp + M)
    + 0.00002 * s(4 * Mp);
  return (jde - JD_EPOCH) * DAY_MS;
}

/** Approximate lunation number containing `ms`. */
function lunationOf(ms: number): number {
  return Math.floor((ms / DAY_MS + JD_EPOCH - JDE0) / MEAN_MONTH);
}

/** The first new or full moon strictly after `date`. */
export function nextPhase(date: Date, which: 'new' | 'full'): Date {
  const t = date.getTime();
  const full = which === 'full';
  let k = lunationOf(t) - 1;
  for (let i = 0; i < 4; i++, k++) {
    const at = phaseInstant(k, full);
    if (at > t) return new Date(at);
  }
  return new Date(phaseInstant(k, full));
}

/** The last new or full moon at or before `date`. */
export function previousPhase(date: Date, which: 'new' | 'full'): Date {
  const t = date.getTime();
  const full = which === 'full';
  let k = lunationOf(t) + 1;
  for (let i = 0; i < 4; i++, k--) {
    const at = phaseInstant(k, full);
    if (at <= t) return new Date(at);
  }
  return new Date(phaseInstant(k, full));
}

export function moonPhase(date: Date): MoonPhase {
  const lastNew = previousPhase(date, 'new');
  const nextNew = nextPhase(date, 'new');
  const nextFull = nextPhase(date, 'full');
  const age = (date.getTime() - lastNew.getTime()) / DAY_MS;
  const month = (nextNew.getTime() - lastNew.getTime()) / DAY_MS;
  const x = Math.min(0.999999, Math.max(0, age / month));
  const fraction = (1 - Math.cos(x * Math.PI * 2)) / 2;
  const index = Math.round(x * 8) % 8;
  const p = PHASES[index]!;
  return { age, fraction, phase: p.name, emoji: p.emoji, label: p.label, lastNew, nextNew, nextFull };
}

/** Whole sleeps (local calendar days) from `now` until `at`; never negative. */
export function sleepsUntil(now: Date, at: Date): number {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / DAY_MS));
}
