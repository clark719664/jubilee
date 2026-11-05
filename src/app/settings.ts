/**
 * Settings resolution: region from the browser language, motion from
 * `?motion=` > saved setting > OS preference, units and colour scheme.
 * Pure functions; the media-query helpers at the bottom are the only DOM touch
 * and are guarded so the module loads under Node for tests.
 */
import type { Region } from '../dates/rules';
import type { MotionMode } from '../effects/types';
import type { Units } from './format';

export type MotionSetting = 'auto' | 'on' | 'off';
export type Scheme = 'light' | 'dark';

/** en-GB→GB, en-CA→CA, en-AU→AU, es-MX→MX, en-IN/hi-IN→IN, fr*→FR, en-US→US, else OTHER. */
export function detectRegion(lang: string | null | undefined): Region {
  const tag = (lang ?? '').trim().toLowerCase().replace(/_/g, '-');
  if (!tag) return 'OTHER';
  const parts = tag.split('-');
  const language = parts[0] ?? '';
  // The region subtag is the last two-letter part (en-GB, en-Latn-GB both → GB).
  const region = [...parts.slice(1)].reverse().find((p) => p.length === 2) ?? '';
  if (language === 'fr') return 'FR';
  if (language === 'en') {
    if (region === 'gb' || region === 'uk') return 'GB';
    if (region === 'ca') return 'CA';
    if (region === 'au') return 'AU';
    if (region === 'in') return 'IN';
    if (region === 'us') return 'US';
    return 'OTHER';
  }
  if (language === 'es' && region === 'mx') return 'MX';
  if (language === 'hi' && region === 'in') return 'IN';
  return 'OTHER';
}

/** Query flag beats the saved setting, which beats the OS preference. */
export function resolveMotion(query: 'on' | 'off' | undefined, saved: MotionSetting, prefersReduced: boolean): MotionMode {
  if (query === 'on') return 'full';
  if (query === 'off') return 'off';
  if (saved === 'on') return 'full';
  if (saved === 'off') return 'off';
  return prefersReduced ? 'reduced' : 'full';
}

/** Saved choice, else US → cups, everyone else → grams and millilitres. */
export function resolveUnits(saved: Units | undefined, region: Region): Units {
  return saved ?? (region === 'US' ? 'us' : 'metric');
}

export function resolveScheme(saved: Scheme | undefined, prefersDark: boolean): Scheme {
  return saved ?? (prefersDark ? 'dark' : 'light');
}

// ───────────────────────────────────────────────────────── media queries (DOM)

export function mediaMatches(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try { return window.matchMedia(query).matches; } catch { return false; }
}

export function prefersReducedMotion(): boolean {
  return mediaMatches('(prefers-reduced-motion: reduce)');
}

export function prefersDarkScheme(): boolean {
  return mediaMatches('(prefers-color-scheme: dark)');
}

export function prefersMoreContrast(): boolean {
  return mediaMatches('(prefers-contrast: more)');
}

/** Calls `cb(matches)` whenever the media query flips; returns a disposer. No-op without matchMedia. */
export function watchMedia(query: string, cb: (matches: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined;
  let mql: MediaQueryList;
  try { mql = window.matchMedia(query); } catch { return () => undefined; }
  const handler = (e: MediaQueryListEvent): void => cb(e.matches);
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}
