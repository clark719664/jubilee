/**
 * surprise.ts — "Surprise!": colors the whole page with a harmonious random palette, seeded so the
 * same seed always gives the same picture (tests, and so Undo/Redo are exact).
 *
 * How it stays pretty instead of random noise:
 *  1. A palette of ~5 crayons: two from the holiday (theme crayons) plus kid crayons whose hues sit
 *     in a color-wheel scheme (analogous, complementary or triad) around a theme hue; sometimes a
 *     magic crayon for sparkle.
 *  2. Regions are grouped by name ("star-1", "star-2" → "star"), so families match: all the stars
 *     shine together, all the windows glow together.
 *  3. Names that mean something get a sensible crayon most of the time (sky → blue, leaf → green,
 *     flame → yellow…), so a surprise house still looks like a house.
 */
import { mulberry32 } from '../../effects/rng';
import { hueGap, toHsl, type Crayon } from './crayons';
import type { Fills } from './history';

/** Region-name words → crayons that suit them (kid crayon ids; 'theme'/'magic' mean "one of those"). */
export const HINTS: readonly (readonly [RegExp, readonly string[]])[] = [
  [/sky|night|space/, ['k-blue', 'k-sky', 'theme', 'k-purple']],
  [/star|sun|flame|fire|light|glow|candle|bulb|spark|moon|coin|gold|crown/, ['k-yellow', 'm-1', 'k-orange']],
  [/snow|cloud|ice|frost|mist/, ['k-sky', 'k-peach', 'k-purple']],
  [/tree|leaf|leaves|grass|hill|bush|hedge|shamrock|clover|stem|vine|holly|garland|wreath/, ['k-green', 'k-lime']],
  [/trunk|wood|log|door|fence|post|branch|basket|sled|stick|pole|bark/, ['k-brown', 'k-orange']],
  [/roof|heart|berry|apple|rose|cherry|ribbon|bow/, ['k-red', 'k-pink', 'theme']],
  [/window|glass|pane|lamp|lantern/, ['k-yellow', 'm-1', 'k-orange']],
  [/water|sea|river|lake|pond|wave|rain|drop|fish/, ['k-blue', 'k-sky']],
  [/pumpkin|carrot|orange|marigold|fox|leaf-fall/, ['k-orange']],
  [/path|road|ground|sand|dirt|floor|mud|step/, ['k-peach', 'k-brown']],
  [/cat|dog|bunny|rabbit|bear|owl|bird|animal/, ['k-brown', 'k-peach', 'k-charcoal']],
  [/present|gift|box|parcel|balloon|egg|bauble|ornament|kite|flag|envelope/, ['theme', 'k-pink', 'k-purple', 'k-red', 'k-sky']],
  [/skin|face|hand/, ['k-peach', 'k-brown']],
  [/hat|scarf|coat|mitten|boot|sock|dress|shirt/, ['k-red', 'k-blue', 'k-purple', 'theme']],
];

const SCHEMES: readonly (readonly number[])[] = [
  [0, 30, -30, 60],       // analogous
  [0, 180, 150, -150],    // complementary + split
  [0, 120, 240, 60],      // triad
];

/** "star-12" → "star", "window_left" → "window_left", "Lantern-Glass-2" → "lantern-glass". */
export function groupOf(region: string): string {
  return region.toLowerCase().replace(/[-_ ]*\d+$/, '') || region.toLowerCase();
}

/** The palette for one surprise: crayon ids, holiday crayons first. */
export function surprisePalette(box: readonly Crayon[], seed: number): string[] {
  const rnd = mulberry32(seed);
  const themes = box.filter((c) => c.kind === 'theme');
  const kids = box.filter((c) => c.kind === 'kid' && toHsl(c.color).s > 0.35);
  const magic = box.filter((c) => c.kind === 'magic');
  const pick = <T>(xs: readonly T[]): T | undefined => xs[Math.floor(rnd() * xs.length)];

  const out: string[] = [];
  const add = (id: string | undefined): void => { if (id && !out.includes(id)) out.push(id); };
  // Two holiday crayons, preferring the most colorful ones (a dark sky color makes a poor fill).
  const lively = [...themes].sort((a, b) => toHsl(b.color).s - toHsl(a.color).s);
  add(lively[0]?.id);
  add(pick(lively.slice(1, 3))?.id);
  const anchor = lively[0] ? toHsl(lively[0].color).h : rnd() * 360;
  const scheme = pick(SCHEMES) ?? SCHEMES[0]!;
  for (const offset of scheme) {
    const want = (anchor + offset + (rnd() - 0.5) * 24 + 360) % 360;
    const near = [...kids].filter((k) => !out.includes(k.id)).sort((a, b) => hueGap(toHsl(a.color).h, want) - hueGap(toHsl(b.color).h, want));
    add(near[0]?.id);
  }
  if (magic.length && rnd() < 0.6) add(pick(magic)?.id);
  return out;
}

/**
 * A full set of fills for `regions` (every region gets a crayon). Deterministic in `seed`.
 * `box` is the whole crayon box; returned ids are always from it.
 */
export function surpriseFills(regions: readonly string[], box: readonly Crayon[], seed: number): Fills {
  const rnd = mulberry32(seed ^ 0x5bd1e995);
  const palette = surprisePalette(box, seed);
  const ids = new Set(box.map((c) => c.id));
  const themeIds = box.filter((c) => c.kind === 'theme').map((c) => c.id);
  const magicIds = box.filter((c) => c.kind === 'magic').map((c) => c.id);
  const resolve = (want: string): string | undefined => {
    if (want === 'theme') return themeIds[Math.floor(rnd() * themeIds.length)];
    if (want === 'm-1' || want === 'm-2') return magicIds.includes(want) ? want : undefined;
    return ids.has(want) ? want : undefined;
  };

  // Groups in first-seen order, so neighbors on the page (usually neighbors in the file) differ.
  const groups = new Map<string, string[]>();
  for (const r of regions) {
    const g = groupOf(r);
    const list = groups.get(g) ?? [];
    list.push(r);
    groups.set(g, list);
  }

  const fills: Record<string, string> = {};
  let cursor = Math.floor(rnd() * Math.max(1, palette.length));
  let last = '';
  for (const [group, members] of groups) {
    const hint = HINTS.find(([re]) => re.test(group));
    let color: string | undefined;
    if (hint && rnd() < 0.85) color = resolve(hint[1][Math.floor(rnd() * hint[1].length)]!);
    if (!color) {
      color = palette[cursor % palette.length];
      cursor++;
      if (color === last && palette.length > 1) { color = palette[cursor % palette.length]; cursor++; }
    }
    color ??= box[0]?.id ?? 'k-red';
    // Big families alternate with a second color so a row of stars or baubles looks festive.
    const second = members.length >= 4 ? palette[(cursor + 1) % palette.length] : undefined;
    members.forEach((m, i) => { fills[m] = second && second !== color && i % 2 === 1 ? second : color!; });
    last = color;
  }
  return fills;
}
