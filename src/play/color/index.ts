/**
 * Color-in (activity id 'color') — tap a shape on the holiday's own line-art page to fill it.
 *
 * Pages are bundled SVGs in src/art/color/<holidayId>.svg (viewBox 0 0 800 800, fillable regions
 * carry data-fill="<regionId>"), sanitised and rebuilt from an allow-list before they touch the DOM
 * (sanitize.ts). The crayon box is 12 kid colors + 4 holiday colors + 2 magic gradients (crayons.ts).
 * Undo/redo, Surprise!, two-finger zoom, keyboard play, a draft that survives closing, Done → Fridge,
 * and Print (with colors or blank). See view.ts for the screen and the keyboard map.
 */
import { colorPageSource, hasColorPage } from '../../art/index';
import { THEMES } from '../../theme/themes';
import type { Activity } from '../types';
import { COPY } from './copy';
import { crayonBox } from './crayons';
import { staticPage } from './page';
import { parseColorPage } from './sanitize';
import { cleanFills, type ColorItemData } from './store';
import { mountColor, type ColorOptions, type PageSource } from './view';

export { COPY } from './copy';
export { crayonBox, holidayCrayons, KID_CRAYONS, paintFor, themeColors } from './crayons';
export { clampView, pinch, readingOrder, zoomAt } from './geometry';
export { commit, newDoc, paint, redo, replaceAll, undo } from './history';
export { parseColorPage, sanitizeTree } from './sanitize';
export { COLOR_KEY, isColorData, type ColorItemData } from './store';
export { surpriseFills } from './surprise';
export { mountColor, type ColorOptions, type PageSource } from './view';

/** The bundled art (src/art/color). */
export const ART_PAGES: PageSource = { has: hasColorPage, load: colorPageSource };

/** An activity over any page source (the demo and tests use a fixture page). */
export function createColorActivity(source: PageSource, extra: Omit<ColorOptions, 'source'> = {}): Activity {
  return {
    id: 'color',
    title: COPY.title,
    emoji: COPY.emoji,
    blurb: COPY.blurb,
    available: (meta) => source.has(meta.id),
    mount: (env) => mountColor(env, { ...extra, source }),
  };
}

export const colorActivity: Activity = createColorActivity(ART_PAGES);

/**
 * A small, non-interactive picture of a saved Fridge item ('color' kind), for the Fridge gallery.
 * Resolves to null when the page art is missing. The SVG has no size: style it with CSS.
 */
export async function colorThumb(data: ColorItemData, source: PageSource = ART_PAGES): Promise<SVGSVGElement | null> {
  const text = await source.load(data.pageId);
  const page = text ? parseColorPage(text) : null;
  if (!page) return null;
  const theme = THEMES[data.theme] ?? THEMES.silly;
  return staticPage(page, cleanFills(data.fills), crayonBox(theme, ''));
}
