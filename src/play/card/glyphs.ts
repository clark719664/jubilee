/**
 * glyphs.ts — the few extra 24×24 stroke icons the Card Maker needs (undo/redo, turn, layers, bin,
 * pen, card). Same style as ui/icons.ts (currentColor, round caps, aria-hidden); kept here so this
 * activity does not edit the shared icon set.
 */
import { svg } from '../../ui/dom';

const PATHS = {
  undo: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
  redo: ['M15 14l5-5-5-5', 'M20 9H9.5a5.5 5.5 0 0 0 0 11H13'],
  turnLeft: ['M3 4v6h6', 'M4 10a8 8 0 1 1 2.3 7'],
  turnRight: ['M21 4v6h-6', 'M20 10a8 8 0 1 0-2.3 7'],
  layers: ['M12 3 3 8l9 5 9-5-9-5z', 'M3 13l9 5 9-5'],
  bin: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13', 'M10 11v6', 'M14 11v6'],
  pen: ['M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4z', 'M14 7l3 3'],
  card: ['M4 4h7v16H4z', 'M11 4l9 2v16l-9-2'],
  frame: ['M4 4h16v16H4z', 'M4 15l5-5 4 4 3-3 4 4'],
  smaller: ['M5 12h14'],
  bigger: ['M12 5v14', 'M5 12h14'],
} as const;

export type GlyphName = keyof typeof PATHS;

export function glyph(name: GlyphName, size = 24): SVGSVGElement {
  const el = svg('svg', {
    viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor',
    'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: `icon cm-glyph-${name}`, 'aria-hidden': 'true', focusable: 'false',
  });
  for (const d of PATHS[name]) el.append(svg('path', { d }));
  return el;
}
