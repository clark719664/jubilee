/**
 * art-face.ts — glasses (lenses centred on Jubi's eyes at (42, 52) and (58, 52), tinted so the eyes
 * still show through) and neck things (just under the mouth, y ≥ 66, wrapping the body edge to edge).
 */
import { c, flat, flower, g, heartD, INK, line, p, starD, stick } from './art-kit';

const L = { x: 42, y: 52 };
const R = { x: 58, y: 52 };

/** Short temple arms from each lens back onto the body. */
function temples(xl: number, xr: number, colour: string): SVGGElement {
  return g({}, stick(`M${xl} 50.4L29.5 49.2`, colour, 1.6), stick(`M${xr} 50.4L70.5 49.2`, colour, 1.6));
}

function heartGlasses(): SVGGElement {
  const lens = (x: number): SVGPathElement => p(heartD(x, 51.4, 6.4), '#ff4d6d', { 'fill-opacity': 0.32, 'stroke-width': 2.6 });
  return g({},
    temples(34, 66, '#ff4d6d'),
    lens(L.x), lens(R.x),
    stick('M47.6 49.2Q50 47.6 52.4 49.2', '#ff4d6d', 1.6),
    flat('M37.5 48.2q1-2.6 3.6-2.4', 'none', { stroke: '#fff', 'stroke-width': 1.3, 'stroke-linecap': 'round', opacity: 0.9 }),
    flat('M53.5 48.2q1-2.6 3.6-2.4', 'none', { stroke: '#fff', 'stroke-width': 1.3, 'stroke-linecap': 'round', opacity: 0.9 }),
  );
}

function starGlasses(): SVGGElement {
  const lens = (x: number, rot: number): SVGPathElement => p(starD(x, 52.6, 9.6, 5.4, rot), '#ffc43d', { 'fill-opacity': 0.34, 'stroke-width': 2.4 });
  return g({},
    temples(33.4, 66.6, '#ffc43d'),
    lens(L.x - 0.6, -8), lens(R.x + 0.6, 8),
    flat('M70 41l0.9 2 2 0.9-2 0.9-0.9 2-0.9-2-2-0.9 2-0.9Z', '#fff', { stroke: INK, 'stroke-width': 0.8 }),
  );
}

function roundGlasses(): SVGGElement {
  const tort = '#8a4b26';
  return g({},
    temples(35.2, 64.8, tort),
    c(L.x, L.y, 6.9, '#bfe6ff', { 'fill-opacity': 0.25, stroke: tort, 'stroke-width': 2.4 }),
    c(R.x, R.y, 6.9, '#bfe6ff', { 'fill-opacity': 0.25, stroke: tort, 'stroke-width': 2.4 }),
    c(L.x, L.y, 8.1, 'none', { 'stroke-width': 0.9 }),
    c(R.x, R.y, 8.1, 'none', { 'stroke-width': 0.9 }),
    stick('M48.8 50.6Q50 49 51.2 50.6', tort, 1.6),
    flat('M37.6 49.5q1.2-2.6 3.8-2.8', 'none', { stroke: '#fff', 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: 0.85 }),
    flat('M53.6 49.5q1.2-2.6 3.8-2.8', 'none', { stroke: '#fff', 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: 0.85 }),
  );
}

function sunglasses(): SVGGElement {
  const lens = (x: number): SVGPathElement => p(`M${x - 7.6} 47.6H${x + 7.6}V51.6Q${x + 7.6} 58.6 ${x} 58.6Q${x - 7.6} 58.6 ${x - 7.6} 51.6Z`, '#2b2540');
  return g({},
    temples(34.4, 65.6, '#2b2540'),
    lens(L.x), lens(R.x),
    p('M32.8 46.4H67.2V48.8H32.8Z', '#2b2540', { 'stroke-width': 1.6 }),
    flat('M36.6 50L40.4 50L36.6 55Z', '#8f86c4', { opacity: 0.9 }),
    flat('M52.6 50L56.4 50L52.6 55Z', '#8f86c4', { opacity: 0.9 }),
  );
}

function rainbowGlasses(): SVGGElement {
  const rings = ['#9b6bff', '#4cc9f0', '#5ed27a', '#ffd23f', '#ff5e7e'];
  const lens = (x: number): SVGGElement => {
    const out = g({}, c(x, 52, 9.4, 'none', { 'stroke-width': 1 }));
    rings.forEach((col, i) => out.append(c(x, 52, 8.4 - i * 0.95, 'none', { stroke: col, 'stroke-width': 1.15 })));
    out.append(c(x, 52, 3.6 + 0.6, '#fff', { 'fill-opacity': 0.12, 'stroke-width': 0.9 }));
    return out;
  };
  return g({},
    temples(32.6, 67.4, '#ff5e7e'),
    lens(L.x - 0.4), lens(R.x + 0.4),
    stick('M50 49.4V49.6', '#ffd23f', 1.4),
  );
}

// ── neck ──

function scarf(): SVGGElement {
  const band = 'M30.5 65.6Q50 74.5 69.5 65.6L70.6 72.2Q50 81.6 29.4 72.2Z';
  const stripes = [36, 43, 50, 57, 64].map((x) => {
    const y0 = 66.2 + 7.6 * (1 - ((x - 50) / 20) ** 2) * 0.55;
    return `M${x - 1.6} ${(y0 - 0.2).toFixed(1)}l-0.6 ${(7.2).toFixed(1)}`;
  }).join('');
  return g({},
    p('M59 72.5L61.6 88.6L69.4 87L65.6 71.2Z', '#e8364f'),
    line('M60.8 84.6L68.6 83.1', '#fff', 1.8),
    line('M61.6 88.6L61.3 91.2M64.2 88.1L64.1 90.8M66.8 87.6L67 90.2M69.4 87L69.8 89.6', INK, 1.4),
    p(band, '#e8364f'),
    line(stripes, '#fff', 2.2),
  );
}

function bowTie(): SVGGElement {
  const dots = 'M42.6 69.4h.01M44.6 73.2h.01M42.8 77h.01M57.4 69.4h.01M55.4 73.2h.01M57.2 77h.01';
  return g({},
    p('M50 72.6L40 66.8Q38.4 72.6 40 78.4Z', '#3a86ff'),
    p('M50 72.6L60 66.8Q61.6 72.6 60 78.4Z', '#3a86ff'),
    line(dots, '#fff', 2.2),
    p('M47.4 69.6H52.6V75.6H47.4Z', '#2a62c9', { rx: 1 }),
  );
}

function lei(): SVGGElement {
  const out = g({});
  const cols = ['#ff8fb8', '#ffd166', '#fff4f8', '#ff6b8f', '#c3a6ff', '#ffd166', '#ff8fb8', '#fff4f8', '#ff6b8f'];
  // Flowers along the curve from (31, 66) through (50, 79) to (69, 66).
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const x = (1 - t) ** 2 * 31 + 2 * (1 - t) * t * 50 + t ** 2 * 69;
    const y = (1 - t) ** 2 * 66 + 2 * (1 - t) * t * 92 + t ** 2 * 66;
    out.append(flower(x, y, 6, cols[i]!, i % 2 ? '#ff9f1c' : '#ffd166', i * 23));
  }
  return out;
}

function medal(): SVGGElement {
  return g({},
    p('M40.4 65.6L45.8 65.6L51.6 79.2L47.6 80.6Z', '#3a86ff', { 'stroke-width': 1.8 }),
    p('M59.6 65.6L54.2 65.6L48.4 79.2L52.4 80.6Z', '#e8364f', { 'stroke-width': 1.8 }),
    c(50, 84.4, 6.6, '#ffc43d'),
    c(50, 84.4, 4.6, 'none', { stroke: '#d99a1a', 'stroke-width': 1.2 }),
    flat(starD(50, 84.6, 3.4, 1.5), '#fff2c4'),
  );
}

function snowflakeNecklace(): SVGGElement {
  const arms: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 * Math.PI) / 180;
    const x = 50 + Math.sin(a) * 6;
    const y = 80.6 - Math.cos(a) * 6;
    const bx = 50 + Math.sin(a) * 3.6;
    const by = 80.6 - Math.cos(a) * 3.6;
    const s1 = a + 0.75;
    const s2 = a - 0.75;
    arms.push(`M50 80.6L${x.toFixed(2)} ${y.toFixed(2)}`,
      `M${bx.toFixed(2)} ${by.toFixed(2)}l${(Math.sin(s1) * 2.2).toFixed(2)} ${(-Math.cos(s1) * 2.2).toFixed(2)}`,
      `M${bx.toFixed(2)} ${by.toFixed(2)}l${(Math.sin(s2) * 2.2).toFixed(2)} ${(-Math.cos(s2) * 2.2).toFixed(2)}`);
  }
  const d = arms.join('');
  const beads = g({});
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    const x = (1 - t) ** 2 * 33 + 2 * (1 - t) * t * 50 + t ** 2 * 67;
    const y = (1 - t) ** 2 * 66 + 2 * (1 - t) * t * 82 + t ** 2 * 66;
    if (Math.abs(x - 50) > 4) beads.append(c(x, y, 1.3, '#dff4ff', { 'stroke-width': 1 }));
  }
  return g({},
    line('M33 66Q50 82 67 66', '#b9c7d8', 1.4),
    beads,
    line(d, INK, 3.6),
    line(d, '#e6f6ff', 1.7),
    c(50, 80.6, 1.6, '#9fd8ff', { 'stroke-width': 1 }),
  );
}

function tinsel(): SVGGElement {
  const d = 'M30.6 66Q50 82 69.4 66';
  return g({},
    line(d, INK, 8.6),
    line(d, '#ffc43d', 6.2),
    line(d, '#fff2b0', 2.2, { 'stroke-dasharray': '0.4 2.6' }),
    line(d, '#e89b12', 1.4, { 'stroke-dasharray': '0.3 3.1', 'stroke-dashoffset': 1.4, transform: 'translate(0 1.8)' }),
    flat('M50 69.6l1.1 2.4 2.4 1.1-2.4 1.1-1.1 2.4-1.1-2.4-2.4-1.1 2.4-1.1Z', '#fff', { stroke: INK, 'stroke-width': 0.8 }),
  );
}

function bandana(): SVGGElement {
  const dots = 'M44 71h.01M50 72.6h.01M56 71h.01M47 76.4h.01M53 76.4h.01M50 81h.01';
  return g({},
    p('M30.8 65.6Q50 72.6 69.2 65.6L50 87Z', '#e8364f'),
    line(dots, '#fff', 2.1),
    p('M66.4 66.4q4.6-1.6 6.4 1.6q-3 1.4-6.4-1.6Z', '#c81f3a', { 'stroke-width': 1.6 }),
  );
}

export const FACE_ART: Readonly<Record<string, () => SVGGElement>> = {
  'heart-glasses': heartGlasses,
  'star-glasses': starGlasses,
  'round-glasses': roundGlasses,
  sunglasses,
  'rainbow-glasses': rainbowGlasses,
  scarf,
  'bow-tie': bowTie,
  lei,
  medal,
  'snowflake-necklace': snowflakeNecklace,
  tinsel,
  bandana,
};
