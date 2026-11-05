/**
 * crayons.ts — the crayon box: 12 kid colors, 4 crayons taken from the holiday's theme, 2 "magic"
 * gradient crayons built from the theme glow, and the big sets in crayon-sets.ts. Pure data + color maths (no DOM), so tests can check
 * that every theme gets four distinct holiday crayons and two working magic ones.
 *
 * A fill is stored as a crayon id ('k-red', 't-2', 'm-1'), never as a color, so a saved picture is a
 * few hundred bytes and reopens with the same crayons. `paintFor` turns an id into an SVG paint: a hex
 * color, or `url(#<prefix>-m-1)` for a magic crayon whose gradient lives in the page's <defs>.
 */
import type { Theme } from '../../theme/themes';
import { BLENDS, GLITTERS, PATTERNS, SHADES, SHINIES } from './crayon-sets';
import { COPY, fill } from './copy';

export type CrayonKind = 'kid' | 'theme' | 'magic' | 'shade' | 'blend' | 'glitter' | 'shiny' | 'pattern';

export interface GradientStop { readonly offset: number; readonly color: string }

/** A repeating fill: sparkles for glitter, or a printed pattern whose first fleck is its ink. */
export interface Texture {
  readonly type: 'glitter' | 'dots' | 'stripes' | 'diagonal' | 'checks' | 'stars' | 'hearts' | 'zigzag';
  readonly base: string;
  readonly flecks: readonly string[];
}

export interface Crayon {
  readonly id: string;
  readonly kind: CrayonKind;
  /** Spoken and tooltip name. */
  readonly name: string;
  /** Solid color (for magic crayons: the middle stop, used for the hover preview and thumbnails). */
  readonly color: string;
  /** Magic crayons only. */
  readonly gradient?: { readonly type: 'linear' | 'radial'; readonly stops: readonly GradientStop[] };
  readonly texture?: Texture;
}

export const ERASER = 'eraser';
export const BLANK = '#ffffff';

export const KID_CRAYONS: readonly Crayon[] = [
  { id: 'k-red', kind: 'kid', name: 'Red', color: '#e63946' },
  { id: 'k-orange', kind: 'kid', name: 'Orange', color: '#ff8c1a' },
  { id: 'k-yellow', kind: 'kid', name: 'Sunshine yellow', color: '#ffd23f' },
  { id: 'k-lime', kind: 'kid', name: 'Lime green', color: '#8bd346' },
  { id: 'k-green', kind: 'kid', name: 'Leafy green', color: '#2a9d4b' },
  { id: 'k-sky', kind: 'kid', name: 'Sky blue', color: '#5ec8f2' },
  { id: 'k-blue', kind: 'kid', name: 'Blue', color: '#3166d6' },
  { id: 'k-purple', kind: 'kid', name: 'Purple', color: '#8a5cf5' },
  { id: 'k-pink', kind: 'kid', name: 'Pink', color: '#ff7ab6' },
  { id: 'k-peach', kind: 'kid', name: 'Peach', color: '#ffc8a2' },
  { id: 'k-brown', kind: 'kid', name: 'Brown', color: '#9a6236' },
  { id: 'k-charcoal', kind: 'kid', name: 'Charcoal', color: '#3b3a4a' },
];

// ── color maths ──

export interface Rgb { readonly r: number; readonly g: number; readonly b: number }
export interface Hsl { readonly h: number; readonly s: number; readonly l: number }

export function hexToRgb(hex: string): Rgb {
  let s = hex.trim().replace('#', '');
  if (s.length === 3 || s.length === 4) s = s.slice(0, 3).split('').map((c) => c + c).join('');
  const n = parseInt(s.slice(0, 6), 16);
  if (!Number.isFinite(n)) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const c = (v: number): string => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function toHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgb(hex);
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return { h: h * 60, s, l };
}

/** Straight-line distance in RGB (0…441): "do these two look like the same crayon?" */
export function distance(a: string, b: string): number {
  const x = hexToRgb(a), y = hexToRgb(b);
  return Math.hypot(x.r - y.r, x.g - y.g, x.b - y.b);
}

/** Mix two colors (t = 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a), y = hexToRgb(b);
  return rgbToHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t });
}

/** Hue distance in degrees (0…180). */
export function hueGap(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/** A plain color word for a theme crayon's name: "Christmas gold", "Diwali pink". */
export function colorWord(hex: string): string {
  const { h, s, l } = toHsl(hex);
  if (l > 0.93) return 'white';
  if (l < 0.13) return 'black';
  if (s < 0.14) return l > 0.6 ? 'silver' : 'gray';
  if ((h < 45 || h >= 345) && l < 0.32 && s < 0.75) return 'brown';
  if (h < 14 || h >= 345) return l > 0.75 ? 'pink' : 'red';
  if (h < 40) return l < 0.45 ? 'brown' : l > 0.8 ? 'peach' : 'orange';
  if (h < 52) return 'gold';
  if (h < 68) return l > 0.8 ? 'cream' : 'yellow';
  if (h < 160) return l < 0.3 ? 'pine green' : 'green';
  if (h < 195) return 'teal';
  if (h < 250) return l < 0.3 ? 'navy' : 'blue';
  if (h < 290) return l > 0.75 ? 'lilac' : 'purple';
  return l > 0.7 ? 'pink' : 'magenta';
}

// ── the holiday's own crayons ──

/** Too close to white to be a crayon of its own (the eraser already makes white). */
const NEAR_WHITE = 34;
/** Two theme crayons closer than this look the same in the box. */
const SAME = 44;

/** Four distinct colors from the theme, in a stable order; padded with tints when a theme is sparse. */
export function themeColors(theme: Theme): string[] {
  const picked: string[] = [];
  const consider = (c: string): void => {
    if (picked.length >= 4) return;
    if (distance(c, BLANK) < NEAR_WHITE) return;
    if (picked.some((p) => distance(p, c) < SAME)) return;
    picked.push(c);
  };
  // Night skies can be almost black; lift them a little so they still read as a color on paper.
  const lift = (c: string): string => (toHsl(c).l < 0.2 ? mix(c, '#ffffff', 0.22) : c);
  for (const c of [theme.accent, theme.accent2, theme.glow, theme.bg2, theme.bg1, theme.ink, theme.accentInk]) consider(lift(c));
  // Sparse themes (white accents on a white-ish sky): lighter and deeper variants of what we have.
  const base = picked[0] ?? theme.accent;
  for (const t of [0.35, 0.55, 0.2]) consider(mix(base, '#000000', t));
  for (const t of [0.45, 0.65]) consider(mix(base, '#ffffff', t));
  for (const c of ['#e63946', '#3166d6', '#2a9d4b', '#ffd23f']) consider(c);
  return picked.slice(0, 4);
}

/** Distinct theme colors for the magic gradients, glow first. */
function magicStops(theme: Theme): [string, string, string] {
  const out: string[] = [theme.glow];
  for (const c of [theme.accent2, theme.accent, theme.bg2, theme.bg1, '#ff7ab6', '#5ec8f2']) {
    if (out.length >= 3) break;
    if (out.every((o) => distance(o, c) >= SAME)) out.push(c);
  }
  return [out[0]!, out[1]!, out[2] ?? mix(out[1]!, '#000000', 0.3)];
}

/** The holiday's 4 theme crayons + 2 magic crayons. */
export function holidayCrayons(theme: Theme, holidayName: string): Crayon[] {
  const theme4: Crayon[] = themeColors(theme).map((c, i) => ({
    id: `t-${i + 1}`, kind: 'theme', name: fill(COPY.themeCrayon, { holiday: holidayName, color: colorWord(c) }), color: c,
  }));
  const [g, a, b] = magicStops(theme);
  // A white glow (day themes) would make a white-on-white core: glow from white into a pale accent instead.
  const whiteGlow = distance(g, BLANK) < NEAR_WHITE;
  const core = whiteGlow ? BLANK : mix(g, BLANK, 0.55);
  const mid = whiteGlow ? mix(a, BLANK, 0.45) : g;
  const magic: Crayon[] = [
    {
      id: 'm-1', kind: 'magic', name: COPY.magicGlow, color: mid,
      gradient: { type: 'radial', stops: [{ offset: 0, color: core }, { offset: 0.55, color: mid }, { offset: 1, color: a }] },
    },
    {
      id: 'm-2', kind: 'magic', name: COPY.magicSwirl, color: a,
      gradient: { type: 'linear', stops: [{ offset: 0, color: g }, { offset: 0.5, color: a }, { offset: 1, color: b }] },
    },
  ];
  const sparkle: Crayon = {
    id: 'g-holiday', kind: 'glitter', name: fill(COPY.holidayGlitter, { holiday: holidayName }), color: a,
    texture: { type: 'glitter', base: a, flecks: [BLANK, mix(g, BLANK, 0.4), mix(a, BLANK, 0.6)] },
  };
  return [...theme4, ...magic, sparkle];
}

/** The whole box in display order: holiday crayons first (they are what makes the page feel festive). */
export function crayonBox(theme: Theme, holidayName: string): Crayon[] {
  return [...holidayCrayons(theme, holidayName), ...KID_CRAYONS, ...SHADES, ...BLENDS, ...GLITTERS, ...SHINIES, ...PATTERNS];
}

export interface Drawer { readonly id: string; readonly name: string; readonly crayons: readonly Crayon[] }

/** The box sorted into drawers, so a phone never has to show 150 crayons at once. */
export function crayonDrawers(box: readonly Crayon[]): Drawer[] {
  const of = (...kinds: CrayonKind[]): Crayon[] => box.filter((c) => kinds.includes(c.kind));
  return [
    { id: 'holiday', name: COPY.drawerHoliday, crayons: [...of('theme', 'magic'), ...box.filter((c) => c.id === 'g-holiday')] },
    { id: 'basics', name: COPY.drawerBasics, crayons: of('kid') },
    { id: 'mixed', name: COPY.drawerMixed, crayons: of('shade') },
    { id: 'blends', name: COPY.drawerBlends, crayons: of('blend') },
    { id: 'glitter', name: COPY.drawerGlitter, crayons: of('glitter').filter((c) => c.id !== 'g-holiday') },
    { id: 'shiny', name: COPY.drawerShiny, crayons: of('shiny') },
    { id: 'patterns', name: COPY.drawerPatterns, crayons: of('pattern') },
  ];
}

export function gradientId(prefix: string, crayonId: string): string {
  return `${prefix}-${crayonId}`;
}

/** SVG paint for a stored crayon id (unknown ids and the eraser paint white). */
export function paintFor(crayonId: string | null | undefined, box: readonly Crayon[], prefix: string): string {
  if (!crayonId || crayonId === ERASER) return BLANK;
  const c = box.find((k) => k.id === crayonId);
  if (!c) return BLANK;
  return c.gradient || c.texture ? `url(#${gradientId(prefix, c.id)})` : c.color;
}

/** Solid stand-in for a crayon (previews, contrast, the stamp burst). */
export function solidFor(crayonId: string | null | undefined, box: readonly Crayon[]): string {
  if (!crayonId || crayonId === ERASER) return BLANK;
  return box.find((k) => k.id === crayonId)?.color ?? BLANK;
}
