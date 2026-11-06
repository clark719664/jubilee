import { svg } from '../../ui/dom';

export interface DreidelArt {
  readonly svg: SVGSVGElement;
  face(glyph: string): void;
}

export function drawDreidel(): DreidelArt {
  const text = svg('text', { x: 100, y: 128, 'text-anchor': 'middle', 'font-size': 62, 'font-weight': 700, fill: '#1d3f91', class: 'dd-face', lang: 'he' });
  const body = svg('g', { class: 'dd-body' },
    svg('path', { d: 'M46 150H154L100 232Z', fill: '#2f5fc4', stroke: '#1d3f91', 'stroke-width': 5, 'stroke-linejoin': 'round' }),
    svg('rect', { x: 46, y: 66, width: 108, height: 90, rx: 14, fill: '#3f74e0', stroke: '#1d3f91', 'stroke-width': 5 }),
    svg('rect', { x: 62, y: 78, width: 76, height: 66, rx: 9, fill: '#fffdf8' }),
    text);
  const el = svg('svg', { viewBox: '0 0 200 240', class: 'dd-art', 'aria-hidden': 'true', focusable: 'false' },
    svg('ellipse', { cx: 100, cy: 234, rx: 38, ry: 6, fill: 'rgba(0,0,0,.22)' }),
    svg('rect', { x: 94, y: 14, width: 12, height: 56, rx: 6, fill: '#ffd24a', stroke: '#b8860b', 'stroke-width': 4 }),
    svg('circle', { cx: 100, cy: 14, r: 10, fill: '#ffd24a', stroke: '#b8860b', 'stroke-width': 4 }),
    body);
  return { svg: el, face: (glyph) => { text.textContent = glyph; } };
}
