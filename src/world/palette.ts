/**
 * The globe's colors for a holiday theme. A globe always floats in deep space, so the
 * backdrop is a dark indigo that takes the theme's sky as soft nebula clouds; the countries
 * that celebrate are painted in the theme color that stands out best against blue sea and
 * pastel land; and the land, the night side, the atmosphere and Santa's trail take a gentle
 * tint of the theme, so the planet and the page read as one picture. Pure: tested in Node.
 */
import { mixColor, parseColor } from '../effects/painters/color';
import { THEMES, type Theme } from '../theme/themes';

export interface GlobeColors {
  /** Backdrop gradient, top-left to bottom-right. */
  readonly space1: string;
  readonly space2: string;
  /** Soft color clouds in the backdrop. */
  readonly nebula1: string;
  readonly nebula2: string;
  /** Sunlit water at the center of the disc, deep water at the limb. */
  readonly ocean1: string;
  readonly ocean2: string;
  /** The pale glow of shallow water hugging every coast. */
  readonly shallows: string;
  readonly land: string;
  /** A slightly deeper land tone toward the limb. */
  readonly land2: string;
  /** Borders between countries. */
  readonly landLine: string;
  /** The coastline itself. */
  readonly coastLine: string;
  readonly highlight: string;
  readonly highlightLine: string;
  /** Multiply tint for the night side (light enough to keep colors, dark enough to read as night). */
  readonly night: string;
  readonly twilight: string;
  readonly lights: string;
  readonly newDay: string;
  readonly graticule: string;
  readonly atmosphere: string;
  readonly trail: string;
  readonly ink: string;
}

export const DEFAULT_COLORS: GlobeColors = {
  space1: '#070a1f',
  space2: '#121a46',
  nebula1: '#5b3df5',
  nebula2: '#ff8fb8',
  ocean1: '#4cb3f2',
  ocean2: '#0e2f7e',
  shallows: '#a6ecff',
  land: '#b5e09a',
  land2: '#8fc77e',
  landLine: 'rgba(40, 96, 62, 0.42)',
  coastLine: 'rgba(24, 74, 70, 0.75)',
  highlight: '#ffd166',
  highlightLine: '#ffffff',
  night: '#3a55c4',
  twilight: '#ff9a5c',
  lights: '#ffd27a',
  newDay: '#ffd166',
  graticule: 'rgba(255, 255, 255, 0.10)',
  atmosphere: '#7fd3ff',
  trail: '#ffe9a3',
  ink: '#1f1a3d',
};

const OCEAN: readonly (readonly [number, number, number])[] = [[76, 179, 242], [14, 47, 126]];
const LAND: readonly [number, number, number] = [181, 224, 154];

function rgb(c: string): readonly [number, number, number] | null {
  const p = parseColor(c);
  return p ? [p[0], p[1], p[2]] : null;
}

function far(p: readonly [number, number, number], q: readonly [number, number, number], min: number): boolean {
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) >= min;
}

/** The theme color that stands out best on blue sea and green land (never white: outlines are white). */
export function highlightFor(theme: Theme): string {
  for (const c of [theme.accent, theme.accent2, theme.glow]) {
    const p = rgb(c);
    if (!p || (p[0] > 230 && p[1] > 230 && p[2] > 230)) continue;
    if (OCEAN.every((o) => far(p, o, 110)) && far(p, LAND, 80)) return c;
  }
  return '#ffd166';
}

/** The full palette for a theme (day themes borrow the New Year's night sky for space). */
export function globePalette(theme: Theme): GlobeColors {
  const sky = theme.mood === 'night' ? theme : THEMES.newyear;
  const warm = theme.mood === 'night' ? theme.glow : theme.accent;
  return {
    ...DEFAULT_COLORS,
    space1: mixColor('#05071a', sky.bg1, 0.3),
    space2: mixColor('#0d1340', sky.bg2, 0.34),
    nebula1: theme.mood === 'night' ? theme.bg2 : theme.accent,
    nebula2: theme.accent2,
    land: mixColor(DEFAULT_COLORS.land, theme.accent2, 0.08),
    land2: mixColor(DEFAULT_COLORS.land2, theme.bg1, 0.1),
    highlight: highlightFor(theme),
    night: mixColor(DEFAULT_COLORS.night, sky.bg1, 0.22),
    atmosphere: mixColor(DEFAULT_COLORS.atmosphere, theme.glow, 0.18),
    trail: mixColor('#fff4cc', warm, 0.35),
  };
}
