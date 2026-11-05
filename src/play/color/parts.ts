/**
 * parts.ts — the drawn bits of Coloring: crayons, the eraser, a few tool icons the shared icon set
 * does not have, the Done stamp and its burst. Everything is built with svg()/h(); every shape sits
 * on or inside its neighbor's outline so the art holds up at 3× zoom (no floating bits, no gaps).
 */
import { h, svg } from '../../ui/dom';
import { mix, type Crayon, type Texture } from './crayons';

const INK = '#1f1a3d';

const STAR = (x: number, y: number, r: number): string =>
  `M${x} ${y - r}L${x + r * 0.3} ${y - r * 0.3}L${x + r} ${y}L${x + r * 0.3} ${y + r * 0.3}L${x} ${y + r}L${x - r * 0.3} ${y + r * 0.3}L${x - r} ${y}L${x - r * 0.3} ${y - r * 0.3}Z`;

/** The repeating tile of a texture. Glitter's flecks come from a fixed seed, so a saved picture never changes. */
function tile(t: Texture, size: number): SVGElement[] {
  const ink = t.flecks[0] ?? '#ffffff';
  const shape = (d: string, fill = ink): SVGElement => svg('path', { d, fill });
  const dot = (cx: number, cy: number, r: number, fill = ink): SVGElement => svg('circle', { cx, cy, r, fill });
  const q = size / 4;
  switch (t.type) {
    case 'dots': return [dot(q, q, q * 0.62), dot(q * 3, q * 3, q * 0.62)];
    case 'stripes': return [shape(`M0 0H${size}V${size / 2}H0Z`)];
    case 'diagonal': return [shape(`M0 ${size}L${size} 0V${size / 2}L${size / 2} ${size}Z M0 ${size / 2}V0H${size / 2}Z`)];
    case 'checks': return [shape(`M0 0H${size / 2}V${size / 2}H0Z M${size / 2} ${size / 2}H${size}V${size}H${size / 2}Z`)];
    case 'stars': return [shape(STAR(q, q, q * 0.85)), shape(STAR(q * 3, q * 3, q * 0.85))];
    case 'hearts': return [q, q * 3].map((c) => shape(`M${c} ${c + q * 0.7}C${c - q} ${c},${c - q * 0.6} ${c - q * 0.8},${c} ${c - q * 0.2}C${c + q * 0.6} ${c - q * 0.8},${c + q} ${c},${c} ${c + q * 0.7}Z`));
    case 'zigzag': return [svg('path', { d: `M0 ${q * 3}L${q * 2} ${q}L${size} ${q * 3}`, fill: 'none', stroke: ink, 'stroke-width': q * 0.9 })];
    default: {
      const out: SVGElement[] = [];
      let s = 12345;
      const rnd = (): number => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
      for (let i = 0; i < 64; i++) {
        const fill = i % 3 === 2 ? mix(t.base, '#000000', 0.22) : t.flecks[i % t.flecks.length] ?? '#ffffff';
        const x = Math.round(rnd() * size * 10) / 10, y = Math.round(rnd() * size * 10) / 10;
        out.push(i % 7 === 0 ? shape(STAR(x, y, 2.6 + rnd() * 3), t.flecks[0]) : dot(x, y, Math.round((0.7 + rnd() * 1.5) * 10) / 10, fill));
      }
      return out;
    }
  }
}

/** The <defs> entry behind a gradient or textured crayon; `scale` shrinks a texture's tile for the small crayon drawing. */
export function paintDef(c: Crayon, id: string, scale = 1): SVGElement | null {
  if (c.gradient) {
    const g = c.gradient.type === 'radial'
      ? svg('radialGradient', { id, cx: '50%', cy: '42%', r: '70%' })
      : svg('linearGradient', { id, x1: '0', y1: '0', x2: '0.4', y2: '1' });
    for (const s of c.gradient.stops) g.append(svg('stop', { offset: s.offset, 'stop-color': s.color }));
    return g;
  }
  if (!c.texture) return null;
  const size = c.texture.type === 'glitter' ? 90 : 40;
  return svg('pattern', { id, width: size, height: size, patternUnits: 'userSpaceOnUse', patternTransform: `scale(${scale})` },
    svg('rect', { width: size, height: size, fill: c.texture.base }), ...tile(c.texture, size));
}

/** A crayon standing up: sharpened tip, paper wrapper with a little label, a shine down one side. */
export function crayonArt(c: Crayon, uid: string): SVGSVGElement {
  const el = svg('svg', { viewBox: '0 0 40 100', class: 'cp-crayon-art', 'aria-hidden': 'true', focusable: 'false' });
  let body = c.color;
  const gid = `${uid}-g`;
  const def = paintDef(c, gid, 0.4);
  if (def) {
    el.append(svg('defs', {}, def));
    body = `url(#${gid})`;
  }
  const wrap = c.gradient ? mix(c.color, '#ffffff', 0.25) : mix(c.color, '#000000', 0.16);
  el.append(
    // Tip first, so the wrapper's top edge reads as the collar where the wax comes out of the paper.
    svg('path', { d: 'M9 33 L16.5 11 Q20 4.5 23.5 11 L31 33 Z', fill: body, stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
    svg('path', { d: 'M14.6 16.5 L17.2 10.6 Q18.4 8.6 19.6 9.4 L16.6 18 Z', fill: '#ffffff', opacity: 0.45 }),
    svg('rect', { x: 7, y: 31, width: 26, height: 64, rx: 5, fill: body, stroke: INK, 'stroke-width': 2.5 }),
    svg('rect', { x: 8.25, y: 45, width: 23.5, height: 36, fill: wrap }),
    svg('path', { d: 'M8.25 48.5 H31.75 M8.25 77.5 H31.75', stroke: INK, 'stroke-opacity': 0.35, 'stroke-width': 1.6 }),
    svg('ellipse', { cx: 20, cy: 63, rx: 7.5, ry: 9.5, fill: '#ffffff', stroke: INK, 'stroke-opacity': 0.35, 'stroke-width': 1.2 }),
    svg('path', { d: 'M15.5 63.5 q2.25 -3 4.5 0 t4.5 0', fill: 'none', stroke: INK, 'stroke-opacity': 0.5, 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
    svg('rect', { x: 10.5, y: 34, width: 4, height: 57, rx: 2, fill: '#ffffff', opacity: 0.32 }),
  );
  if (c.gradient) {
    // Two tiny sparkles on the wrapper say "magic" without words.
    for (const [x, y, r] of [[13, 52, 3.2], [27, 72, 2.6]] as const) {
      el.append(svg('path', { d: `M${x} ${y - r} L${x + r * 0.32} ${y - r * 0.32} L${x + r} ${y} L${x + r * 0.32} ${y + r * 0.32} L${x} ${y + r} L${x - r * 0.32} ${y + r * 0.32} L${x - r} ${y} L${x - r * 0.32} ${y - r * 0.32} Z`, fill: '#ffffff' }));
    }
  }
  return el;
}

/** A chunky pink block eraser with a blue paper sleeve, drawn in three-quarter view. */
export function eraserArt(): SVGSVGElement {
  const s = { stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' as const };
  return svg('svg', { viewBox: '0 0 84 100', class: 'cp-eraser-art', 'aria-hidden': 'true', focusable: 'false' },
    // Pink rubber: top, front and side faces share edges exactly.
    svg('path', { d: 'M8 46 L22 30 L76 30 L62 46 Z', fill: '#ffb3c8', ...s }),
    svg('path', { d: 'M8 46 L62 46 L62 88 L8 88 Z', fill: '#ff8fb1', ...s }),
    svg('path', { d: 'M62 46 L76 30 L76 72 L62 88 Z', fill: '#e8739a', ...s }),
    // Blue sleeve wraps the right half on all three faces.
    svg('path', { d: 'M36 46 L50 30 L76 30 L62 46 Z', fill: '#7cc4ff', ...s }),
    svg('path', { d: 'M36 46 L62 46 L62 88 L36 88 Z', fill: '#4aa3f0', ...s }),
    svg('path', { d: 'M62 46 L76 30 L76 72 L62 88 Z', fill: '#2f86d6', ...s }),
    svg('path', { d: 'M41 58 H57 M41 66 H53', stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.85 }),
    // Rubbed-off crumbs sit on the "table" line under the block.
    svg('path', { d: 'M12 94 H70', stroke: INK, 'stroke-opacity': 0.25, 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
    svg('rect', { x: 14, y: 52, width: 4, height: 30, rx: 2, fill: '#ffffff', opacity: 0.4 }),
  );
}

/** Line icons in the shared icon style (24-unit box, round caps, currentColor). */
const PATHS = {
  undo: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
  redo: ['m15 14 5-5-5-5', 'M20 9H9.5a5.5 5.5 0 0 0 0 11H13'],
  fit: ['M8 3H5a2 2 0 0 0-2 2v3', 'M21 8V5a2 2 0 0 0-2-2h-3', 'M3 16v3a2 2 0 0 0 2 2h3', 'M16 21h3a2 2 0 0 0 2-2v-3'],
  frame: ['M4 4h16v16H4z', 'm4 16 5-5 4 4 2-2 5 5', 'M15.5 9.5a1.5 1.5 0 1 0 0-.01'],
  wand: ['m15 4 1 2 2 1-2 1-1 2-1-2-2-1 2-1z', 'M3 21 13 11', 'M19 13l.6 1.4L21 15l-1.4.6L19 17l-.6-1.4L17 15l1.4-.6z'],
} as const;

export type ToolIcon = keyof typeof PATHS;

export function toolIcon(name: ToolIcon, size = 24): SVGSVGElement {
  const el = svg('svg', {
    viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: `icon icon-${name}`, 'aria-hidden': 'true', focusable: 'false',
  });
  for (const d of PATHS[name]) el.append(svg('path', { d }));
  return el;
}

/** The round "Done!" stamp that lands on the finished page. */
export function stampEl(text: string): HTMLElement {
  const ring = svg('svg', { viewBox: '0 0 120 120', class: 'cp-stamp-art', 'aria-hidden': 'true', focusable: 'false' },
    svg('circle', { cx: 60, cy: 60, r: 54, fill: 'currentColor', stroke: INK, 'stroke-width': 4 }),
    svg('circle', { cx: 60, cy: 60, r: 44, fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round' }),
    svg('path', { d: 'M60 14 l4.4 9 9.9 1.4 -7.2 7 1.7 9.8 -8.8 -4.6 -8.8 4.6 1.7 -9.8 -7.2 -7 9.9 -1.4 Z', fill: '#ffffff' }),
  );
  return h('div', { class: 'cp-stamp', 'aria-hidden': 'true' }, ring, h('span', { class: 'cp-stamp-text' }, text));
}

/**
 * A one-shot burst of little stars in the picture's own colors, flying out from (x, y) inside
 * `host`. Each star is one CSS animation (no loop), and the whole burst is removed after it ends.
 */
export function starBurst(host: HTMLElement, x: number, y: number, colors: readonly string[], count = 16): void {
  const layer = h('div', { class: 'cp-burst', 'aria-hidden': 'true' });
  layer.style.left = `${x}px`;
  layer.style.top = `${y}px`;
  const palette = colors.length ? colors : ['#ffd23f', '#ff7ab6', '#5ec8f2'];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (i % 2) * 0.2;
    const d = 90 + (i % 3) * 38;
    const star = svg('svg', { viewBox: '0 0 20 20', class: 'cp-burst-star' },
      svg('path', { d: 'M10 1 l2.6 5.6 6.1.7 -4.5 4.2 1.2 6 -5.4 -3 -5.4 3 1.2 -6 -4.5 -4.2 6.1 -.7 Z', fill: palette[i % palette.length]!, stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }),
    );
    star.style.setProperty('--dx', `${Math.cos(a) * d}px`);
    star.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    star.style.setProperty('--rot', `${(i % 2 ? 1 : -1) * (90 + i * 13)}deg`);
    star.style.setProperty('--delay', `${(i % 4) * 40}ms`);
    layer.append(star);
  }
  host.append(layer);
  window.setTimeout(() => layer.remove(), 1400);
}
