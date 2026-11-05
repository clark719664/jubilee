/**
 * Colour-in (activity id 'colour') — tap a shape on the holiday's own line-art page to fill it.
 *
 * Pages are bundled SVGs in src/art/colour/<holidayId>.svg (viewBox 0 0 800 800, fillable regions
 * carry data-fill="<regionId>"), sanitised and rebuilt from an allow-list before they touch the DOM
 * (sanitize.ts). The crayon box is 12 kid colours + 4 holiday colours + 2 magic gradients (crayons.ts).
 * Undo/redo, Surprise!, two-finger zoom, keyboard play, a draft that survives closing, Done → Fridge,
 * and Print (with colours or blank). See view.ts for the screen and the keyboard map.
 */
import { colourPageSource, hasColourPage } from '../../art/index';
import { THEMES } from '../../theme/themes';
import type { Activity } from '../types';
import { COPY } from './copy';
import { crayonBox } from './crayons';
import { staticPage } from './page';
import { parseColourPage } from './sanitize';
import { cleanFills, type ColourItemData } from './store';
import { mountColour, type ColourOptions, type PageSource } from './view';

export { COPY } from './copy';
export { crayonBox, holidayCrayons, KID_CRAYONS, paintFor, themeColours } from './crayons';
export { clampView, pinch, readingOrder, zoomAt } from './geometry';
export { commit, newDoc, paint, redo, replaceAll, undo } from './history';
export { parseColourPage, sanitizeTree } from './sanitize';
export { COLOUR_KEY, isColourData, type ColourItemData } from './store';
export { surpriseFills } from './surprise';
export { mountColour, type ColourOptions, type PageSource } from './view';

/** The bundled art (src/art/colour). */
export const ART_PAGES: PageSource = { has: hasColourPage, load: colourPageSource };

/** An activity over any page source (the demo and tests use a fixture page). */
export function createColourActivity(source: PageSource, extra: Omit<ColourOptions, 'source'> = {}): Activity {
  return {
    id: 'colour',
    title: COPY.title,
    emoji: COPY.emoji,
    blurb: COPY.blurb,
    available: (meta) => source.has(meta.id),
    mount: (env) => mountColour(env, { ...extra, source }),
  };
}

export const colourActivity: Activity = createColourActivity(ART_PAGES);

/**
 * A small, non-interactive picture of a saved Fridge item ('colour' kind), for the Fridge gallery.
 * Resolves to null when the page art is missing. The SVG has no size: style it with CSS.
 */
export async function colourThumb(data: ColourItemData, source: PageSource = ART_PAGES): Promise<SVGSVGElement | null> {
  const text = await source.load(data.pageId);
  const page = text ? parseColourPage(text) : null;
  if (!page) return null;
  const theme = THEMES[data.theme] ?? THEMES.silly;
  return staticPage(page, cleanFills(data.fills), crayonBox(theme, ''));
}
