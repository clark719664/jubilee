/**
 * Small, pure formatting helpers shared by every view: ordinals, "sleeps",
 * minutes, thousands separators and the US ↔ metric ingredient conversion.
 *
 * Rounding is deliberately "kitchen friendly" (240 ml, 225 g, 1½ cups) rather
 * than exact; a child measuring 7 ml instead of 7.5 ml is still making the recipe.
 */
import type { Ingredient, Measure, Unit } from '../content/types';

export type Units = 'us' | 'metric';

/** 1st, 2nd, 3rd, 4th … 11th, 12th, 13th … 21st, 101st, 112th. */
export function ordinal(n: number): string {
  const abs = Math.abs(Math.round(n));
  const mod100 = abs % 100;
  const last = abs % 10;
  const suffix = mod100 >= 11 && mod100 <= 13 ? 'th' : last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th';
  return `${Math.round(n)}${suffix}`;
}

/** 1,096 — grouped with commas regardless of locale, so copy keys read the same everywhere. */
export function commaNumber(n: number): string {
  const sign = n < 0 ? '-' : '';
  const [int = '0', frac] = Math.abs(n).toString().split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return sign + grouped + (frac ? `.${frac}` : '');
}

/** "1 sleep", "2 sleeps", "1,096 sleeps". */
export function pluralSleeps(n: number): string {
  return `${commaNumber(n)} ${n === 1 ? 'sleep' : 'sleeps'}`;
}

/** "5 min", "45 min", "1 hour", "1 hour 30 min", "2 hours". */
export function minutesToText(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  const hours = `${h} ${h === 1 ? 'hour' : 'hours'}`;
  return rest === 0 ? hours : `${hours} ${rest} min`;
}

// ───────────────────────────────────────────────────────────── measures

const VOLUME_ML: Partial<Record<Unit, number>> = { cup: 240, tbsp: 15, tsp: 5, ml: 1 };
const WEIGHT_G: Partial<Record<Unit, number>> = { oz: 28, lb: 454, g: 1 };

export type UnitKind = 'volume' | 'weight' | 'count';

export function unitKind(unit: Unit): UnitKind {
  if (VOLUME_ML[unit] !== undefined) return 'volume';
  if (WEIGHT_G[unit] !== undefined) return 'weight';
  return 'count';
}

export function isMetricUnit(unit: Unit): boolean {
  return unit === 'ml' || unit === 'g';
}

export function isUsUnit(unit: Unit): boolean {
  return unit === 'cup' || unit === 'tbsp' || unit === 'tsp' || unit === 'oz' || unit === 'lb';
}

/**
 * Friendly metric rounding: whole numbers below 20 (a half rounds *down*, so
 * 1½ tsp is "7 ml", never "8 ml"), the nearest 5 above that (224 g → 225 g).
 */
export function roundFriendly(value: number): number {
  if (value < 20) return Math.max(1, Math.ceil(value - 0.5));
  return Math.round(value / 5) * 5;
}

function snap(x: number, step: number): number {
  return Math.round(x / step) * step;
}

/** Nearest "kitchen" fraction: quarters or thirds, whichever is closer (ties → quarters). */
function snapCups(cups: number): number {
  const q = snap(cups, 0.25);
  const t = snap(cups, 1 / 3);
  return Math.abs(t - cups) < Math.abs(q - cups) - 1e-9 ? t : q;
}

/** US → metric; metric and count units pass through untouched. */
export function toMetric(m: Measure): Measure {
  if (!isUsUnit(m.unit)) return m;
  const ml = VOLUME_ML[m.unit];
  if (ml !== undefined) return { qty: roundFriendly(m.qty * ml), unit: 'ml' };
  const g = WEIGHT_G[m.unit] ?? 1;
  return { qty: roundFriendly(m.qty * g), unit: 'g' };
}

/** Metric → US with friendly fractions; US and count units pass through untouched. */
export function toUs(m: Measure): Measure {
  if (m.unit === 'ml') {
    if (m.qty >= 60) return { qty: Math.max(0.25, snapCups(m.qty / 240)), unit: 'cup' };
    if (m.qty >= 15) return { qty: Math.max(0.5, snap(m.qty / 15, 0.5)), unit: 'tbsp' };
    return { qty: Math.max(0.25, snap(m.qty / 5, 0.25)), unit: 'tsp' };
  }
  if (m.unit === 'g') {
    if (m.qty >= 454) return { qty: Math.max(0.25, snap(m.qty / 454, 0.25)), unit: 'lb' };
    return { qty: Math.max(0.5, snap(m.qty / 28, 0.5)), unit: 'oz' };
  }
  return m;
}

export function convertMeasure(m: Measure, to: Units): Measure {
  return to === 'metric' ? toMetric(m) : toUs(m);
}

const FRACTIONS: readonly [number, string][] = [
  [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'],
];

/** 0.5 → "½", 1.5 → "1½", 2 → "2", 2.3 → "2.3". */
export function fractionText(qty: number): string {
  const whole = Math.floor(qty);
  const frac = qty - whole;
  if (frac < 0.01) return String(whole);
  const glyph = FRACTIONS.find(([v]) => Math.abs(v - frac) < 0.02)?.[1];
  if (!glyph) return String(Math.round(qty * 10) / 10);
  return whole === 0 ? glyph : `${whole}${glyph}`;
}

/** Unit word for a quantity; pieces are implied ("2 bananas"), so 'piece' returns ''. */
export function unitLabel(unit: Unit, qty: number): string {
  const one = qty <= 1;
  switch (unit) {
    case 'cup': return one ? 'cup' : 'cups';
    case 'piece': return '';
    case 'pinch': return one ? 'pinch' : 'pinches';
    case 'slice': return one ? 'slice' : 'slices';
    case 'can': return one ? 'can' : 'cans';
    case 'sheet': return one ? 'sheet' : 'sheets';
    default: return unit;
  }
}

/** "1½ cups", "240 ml", "2", "1 pinch". */
export function formatMeasureText(m: Measure): string {
  const qty = isMetricUnit(m.unit) ? String(Math.round(m.qty)) : fractionText(m.qty);
  const label = unitLabel(m.unit, m.qty);
  return label ? `${qty} ${label}` : qty;
}

/** The ingredient's measure in the requested system, deriving the missing side when only one was authored. '' when none. */
export function formatMeasure(ing: Ingredient, units: Units): string {
  const m = pickMeasure(ing, units);
  return m ? formatMeasureText(m) : '';
}

export function pickMeasure(ing: Ingredient, units: Units): Measure | null {
  if (units === 'us') return ing.us ?? (ing.metric ? toUs(ing.metric) : null);
  return ing.metric ?? (ing.us ? toMetric(ing.us) : null);
}
