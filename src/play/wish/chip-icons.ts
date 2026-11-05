/**
 * chip-icons.ts — the little vector pictures on wish chips (bike, books, puppy, peace dove…).
 *
 * Every picture is drawn on a 48×48 board in Jubilee's sticker style: chunky closed shapes with a
 * 2-unit ink outline and round joins. Parts always overlap the shape they belong to (a wheel touches
 * its frame, an ear tucks under its head), so nothing floats apart or leaves a gap when the chip is
 * zoomed 3×. Colors are fixed (not the theme's) because chips sit on paper, on every sky.
 */
import { svg } from '../../ui/dom';
import type { IconId } from './skins';

const INK = '#2b2140';
const SW = 2;
const K = {
  red: '#ff5a5f', blue: '#4d8df7', sky: '#a8dcff', yellow: '#ffd23f', green: '#3cc47c', leaf: '#2fa866', orange: '#ff9f43',
  purple: '#9b6bff', pink: '#ff8fc7', rose: '#ff6fa3', brown: '#b07a4f', dark: '#7a4b2a', tan: '#f0c99a', gray: '#c9d3e0',
  white: '#ffffff', cream: '#fff6e0', skin1: '#f2c9a0', skin2: '#c68a5b', skin3: '#8d5a3b', silver: '#e6ebf2',
} as const;

type Part = SVGElement;
const base = { stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const P = (d: string, fill: string, extra: Record<string, string | number> = {}): Part => svg('path', { d, fill, ...base, ...extra });
const C = (cx: number, cy: number, r: number, fill: string): Part => svg('circle', { cx, cy, r, fill, ...base });
const E = (cx: number, cy: number, rx: number, ry: number, fill: string, rot = 0): Part =>
  svg('ellipse', { cx, cy, rx, ry, fill, ...base, ...(rot ? { transform: `rotate(${rot} ${cx} ${cy})` } : {}) });
const R = (x: number, y: number, w: number, hh: number, rx: number, fill: string): Part => svg('rect', { x, y, width: w, height: hh, rx, fill, ...base });
/** An outlined stroke: ink underneath, color on top (bike frames, necks, stems). */
const S = (d: string, color: string, w: number): Part[] => [
  svg('path', { d, fill: 'none', stroke: INK, 'stroke-width': w + SW * 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  svg('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
];
/** Ink-only detail line (smiles, whiskers). */
const L = (d: string, w = SW): Part => svg('path', { d, fill: 'none', stroke: INK, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
/** A solid ink dot (eyes, noses) with no outline. */
const D = (cx: number, cy: number, r: number, fill: string = INK): Part => svg('circle', { cx, cy, r, fill });
/** A shine: unoutlined pale shape, always inside its body. */
const shine = (d: string): Part => svg('path', { d, fill: '#ffffff', opacity: 0.55 });

function starPath(cx: number, cy: number, n: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

const HEART = 'M24 41 C10 32 6 25 6 18 C6 12 11 8 16 8 C20 8 23 11 24 14 C25 11 28 8 32 8 C37 8 42 12 42 18 C42 25 38 32 24 41 Z';

const DRAW: Record<IconId, () => Part[]> = {
  bike: () => [
    C(12, 32, 8.5, K.white), D(12, 32, 2.2), C(36, 32, 8.5, K.white), D(36, 32, 2.2),
    ...S('M12 32 L19 20 H33 L36 32 M19 20 L24 32 L33 20 M24 32 H12', K.red, 3),
    ...S('M33 20 L31 13 H36', K.blue, 2.6),
    ...S('M18.5 20 L17.5 16.5', K.dark, 2),
    P('M13 16.5 Q13 14 16 14 H22 Q24 14 23.5 16 Q23 17.5 21 17.5 H14.5 Q13 17.5 13 16.5 Z', K.dark),
    C(24, 32, 2.6, K.yellow),
  ],
  books: () => [
    R(7, 31, 34, 9, 2, K.blue), R(33, 33, 6, 5, 1, K.cream),
    R(10, 22.5, 29, 9, 2, K.red), R(12, 24.5, 6, 5, 1, K.cream),
    R(8, 14, 31, 9, 2, K.green), R(31, 16, 6, 5, 1, K.cream),
    L('M14 35.5 H27'), L('M22 27 H33'), L('M13 18.5 H25'),
  ],
  puppy: () => [
    E(24, 27, 13.5, 12.5, K.tan),
    E(11.5, 24, 5, 9.5, K.brown, 14), E(36.5, 24, 5, 9.5, K.brown, -14),
    E(29, 22, 5, 4, K.cream), D(19, 25, 2.2), D(29.5, 24.5, 2.2), D(19.7, 24.3, 0.7, '#fff'), D(30.2, 23.8, 0.7, '#fff'),
    P('M27 34 Q27 39 24 39 Q21 39 21 34 Z', K.rose),
    E(24, 30.5, 3.4, 2.4, INK),
    L('M24 32.5 V34 M20 34 Q22 36 24 34 Q26 36 28 34'),
  ],
  kitten: () => [
    P('M12 22 L12.5 7 L23 15 Z', K.orange), P('M36 22 L35.5 7 L25 15 Z', K.orange),
    P('M14 18 L14.5 11 L19 15 Z', K.pink, { 'stroke-width': 1.4 }), P('M34 18 L33.5 11 L29 15 Z', K.pink, { 'stroke-width': 1.4 }),
    E(24, 27, 14, 12.5, K.orange),
    P('M20 16.5 Q24 19 28 16.5', 'none', { 'stroke-width': 1.6 }),
    D(18.5, 26, 2.3), D(29.5, 26, 2.3), D(19.2, 25.3, 0.8, '#fff'), D(30.2, 25.3, 0.8, '#fff'),
    P('M22 30 H26 L24 32.4 Z', K.pink, { 'stroke-width': 1.4 }),
    L('M24 32.4 Q22 35 20 33.5 M24 32.4 Q26 35 28 33.5', 1.6),
    L('M11 29 L17 30 M11 33 L17 32 M37 29 L31 30 M37 33 L31 32', 1.4),
  ],
  art: () => [
    P('M24 9 C36 9 44 16 43 25 C42 32 35 32 33 35 C31 38 33 42 27 42 C15 42 5 35 5 25 C5 16 13 9 24 9 Z', K.tan),
    C(17, 30, 3.2, K.cream),
    C(14, 21, 3.6, K.red), C(22, 16, 3.6, K.yellow), C(31, 17, 3.6, K.blue), C(36, 25, 3.4, K.green),
    ...S('M44 7 L29 30', K.dark, 3),
    P('M29 30 L25 37 Q24 39 26.5 37.5 L32 32 Z', K.purple),
  ],
  blocks: () => [
    R(6, 26, 17, 16, 3, K.red), R(25, 26, 17, 16, 3, K.blue), R(15.5, 10, 17, 16, 3, K.yellow),
    C(14.5, 34, 4, K.white), P('M33.5 29.5 L38.5 38.5 H28.5 Z', K.white), P(starPath(24, 18.4, 5, 5.2, 2.3), K.white),
  ],
  teddy: () => [
    C(14, 12, 6, K.brown), C(34, 12, 6, K.brown), C(14, 12, 2.8, K.tan), C(34, 12, 2.8, K.tan),
    C(12, 35, 4.6, K.brown), C(36, 35, 4.6, K.brown), C(17.5, 43, 4.2, K.brown), C(30.5, 43, 4.2, K.brown),
    E(24, 36, 11, 9, K.brown), E(24, 37, 6, 5, K.tan),
    C(24, 20, 11, K.brown), E(24, 24, 5.5, 4.2, K.tan),
    E(24, 22.4, 2.4, 1.7, INK), L('M24 24 V25.6 M21.5 25.6 Q24 27.6 26.5 25.6', 1.6),
    D(19.5, 18, 1.9), D(28.5, 18, 1.9),
    P('M18 29.5 L24 31.5 L30 29.5 L30 33 L24 31.5 L18 33 Z', K.red, { 'stroke-width': 1.6 }),
  ],
  ball: () => [
    C(24, 24, 17, K.red),
    P('M10.1 16 Q24 25 37.9 16 L40.6 21 Q24 31 7.4 21 Z', K.white, { 'stroke-width': 1.6 }),
    P('M8.3 30 Q24 38 39.7 30 L37.9 32 Q35 36.5 33 37.6 Q24 41 15 37.6 Q12 36 10 32.5 Z', K.yellow, { 'stroke-width': 1.6 }),
    C(24, 24, 17, 'none'),
    shine('M13 13 Q17 9 22 8.6 Q18 11 15 15 Z'),
  ],
  robot: () => [
    ...S('M24 11 V6', K.gray, 2), C(24, 5, 2.8, K.red),
    R(5.5, 29, 7, 11, 3.5, K.gray), R(35.5, 29, 7, 11, 3.5, K.gray),
    R(16, 39, 6, 6, 2, K.gray), R(26, 39, 6, 6, 2, K.gray),
    R(11, 25, 26, 16, 4, K.blue),
    R(12, 10, 24, 16, 5, K.silver),
    C(19, 17, 3.6, K.sky), C(29, 17, 3.6, K.sky), D(19, 17, 1.5), D(29, 17, 1.5),
    R(19, 21.4, 10, 2.6, 1.3, K.white),
    P('M24 37 C19 33.5 19 30 21.5 30 C23 30 24 31.3 24 31.3 C24 31.3 25 30 26.5 30 C29 30 29 33.5 24 37 Z', K.pink, { 'stroke-width': 1.5 }),
  ],
  dino: () => [
    R(13, 32, 6, 10, 2.5, K.green), R(26, 32, 6, 10, 2.5, K.green),
    P('M14 23 L16 17.5 L19 22 Z M20 21 L22.5 15.5 L25.5 20.5 Z M26.5 21 L29 16.5 L31 22 Z', K.orange, { 'stroke-width': 1.6 }),
    P('M12 30 Q6 36 2.5 37.5 Q9 39 15 35 Z', K.green),
    ...S('M29 28 Q34 22 36 13', K.green, 6),
    E(22, 30, 13, 9, K.green),
    E(38.5, 12, 6.8, 4.8, K.green),
    D(40, 10.6, 1.6), L('M41 14 Q43 14.6 44.5 13.4', 1.5),
    E(22, 33, 7, 3.6, '#bdf0c9'),
  ],
  doll: () => [
    C(14.5, 15, 4.4, K.orange), C(33.5, 15, 4.4, K.orange),
    ...S('M17 27 L10 33 M31 27 L38 33', K.skin1, 3),
    R(18.5, 37, 4.4, 8, 2, K.skin1), R(25.1, 37, 4.4, 8, 2, K.skin1),
    P('M24 22 Q30 22 33 30 L37 40 Q24 43 11 40 L15 30 Q18 22 24 22 Z', K.pink),
    L('M14 37 Q24 40 34 37', 1.5),
    C(24, 15, 8.5, K.skin1),
    P('M15.6 14 Q16 6 24 6 Q32 6 32.4 14 Q28.5 10 24 10.5 Q19.5 10 15.6 14 Z', K.orange),
    D(21, 16, 1.5), D(27, 16, 1.5), D(19.5, 19, 1.5, K.pink), D(28.5, 19, 1.5, K.pink),
    L('M22 19.4 Q24 21 26 19.4', 1.5),
  ],
  guitar: () => {
    const g = svg('g', { transform: 'rotate(-28 24 26)' });
    g.append(
      R(21.5, 2, 5, 17, 1.8, K.dark), R(20, 0.5, 8, 6, 2, K.brown),
      P('M24 12.5 C29.5 12.5 32 15.5 31 20 C30.3 23 34.5 25 34.5 32 C34.5 40 29.5 45 24 45 C18.5 45 13.5 40 13.5 32 C13.5 25 17.7 23 17 20 C16 15.5 18.5 12.5 24 12.5 Z', K.orange),
      C(24, 27, 3.8, K.dark),
      R(19.5, 36, 9, 3, 1.4, K.dark),
      L('M23 6 V36.5 M25 6 V36.5', 0.9),
    );
    return [g];
  },
  kite: () => [
    ...S('M24 37 Q19 41 25 42.5 Q31 44 27 47', K.white, 1.4),
    P('M25 42.5 L20.5 40 L21 45 Z M25 42.5 L29.5 40 L29 45 Z', K.red, { 'stroke-width': 1.5 }),
    P('M24 4 L24 20 L10 20 Z', K.red), P('M24 4 L38 20 L24 20 Z', K.yellow),
    P('M10 20 L24 20 L24 37 Z', K.blue), P('M24 20 L38 20 L24 37 Z', K.green),
    P('M24 4 L38 20 L24 37 L10 20 Z', 'none', { 'stroke-width': 2.4 }),
  ],
  puzzle: () => [
    P('M10 14 H19 C18 7 29 7 28 14 H37 V22 C44 21 44 32 37 31 V40 H28 C29 34 18 34 19 40 H10 V31 C16 32 16 21 10 22 Z', K.purple),
    shine('M13 17 H18 V19 H13 Z'),
  ],
  train: () => [
    C(14, 8.5, 3.8, K.white), C(19.5, 5, 3, K.white),
    R(10.5, 11, 7, 10, 1.5, K.dark),
    R(25, 12, 15, 18, 2, K.red), R(23, 8.5, 19, 4.5, 2, K.dark), R(28.5, 15.5, 8, 7, 1.5, K.sky),
    R(7, 19, 20, 11, 4, K.blue), R(4, 28, 38, 7, 2, K.dark),
    P('M4 30 L1 35 H5 Z', K.yellow, { 'stroke-width': 1.6 }),
    C(13, 37, 5.2, K.gray), C(33, 37, 5.2, K.gray), C(23, 38, 3.6, K.gray),
    D(13, 37, 1.6), D(33, 37, 1.6), D(23, 38, 1.2),
    C(9, 24, 2, K.yellow),
  ],
  rocket: () => [
    P('M18.5 33 Q24 47 29.5 33 Z', K.orange), P('M21 33 Q24 41 27 33 Z', K.yellow, { 'stroke-width': 1.4 }),
    P('M17.5 24 L9 36 L18 34 Z', K.red), P('M30.5 24 L39 36 L30 34 Z', K.red),
    P('M24 3 C32 9 33.5 21 31 34 H17 C14.5 21 16 9 24 3 Z', K.silver),
    P('M24 3 C28 6 30.3 9.5 31.5 14 H16.5 C17.7 9.5 20 6 24 3 Z', K.red),
    C(24, 22, 4.6, K.sky), shine('M21.5 20.5 Q23 18.7 25 18.8 Q23 20 22.5 22 Z'),
    R(20.5, 30.5, 7, 3.5, 1.5, K.gray),
  ],
  sled: () => [
    ...S('M4 36 H37 Q44 36 43.5 29 Q43 26.5 40.5 26.5', K.gray, 2.4),
    R(12, 28, 3.6, 8, 1.2, K.dark), R(31, 28, 3.6, 8, 1.2, K.dark),
    R(7, 22, 32, 7, 2.5, K.red), L('M12 25.5 H34', 1.5),
    ...S('M7 25 Q3 20 6 16', K.yellow, 1.6),
  ],
  snow: () => [
    C(24, 34, 11, K.white), C(24, 18.5, 7.8, K.white),
    R(15, 10, 18, 3.4, 1.6, INK), R(18.5, 2.5, 11, 8.5, 1.5, INK), R(18.5, 7.5, 11, 2.4, 0, K.red),
    P('M15.5 24 H32.5 Q34 24 34 25.6 Q34 27 32.5 27 H27.5 L29 33 H25 L24 27 H15.5 Q14 27 14 25.6 Q14 24 15.5 24 Z', K.red),
    P('M24 19.2 L31 21 L24 21.8 Z', K.orange, { 'stroke-width': 1.3 }),
    D(21, 17, 1.4), D(27, 17, 1.4),
    D(24, 31.5, 1.4), D(24, 36, 1.4), D(24, 40.5, 1.4),
  ],
  grandma: () => [
    C(24, 7, 4.5, K.gray),
    P('M9 46 Q9 30 24 30 Q39 30 39 46 Z', K.purple),
    L('M24 31 V46', 1.5),
    C(24, 19, 9.5, K.skin2),
    P('M14.5 18 Q14.5 8.5 24 8.5 Q33.5 8.5 33.5 18 Q29.5 12.6 24 13 Q18.5 12.6 14.5 18 Z', K.gray),
    C(20, 19.5, 3.1, '#ffffff'), C(28, 19.5, 3.1, '#ffffff'), L('M23.1 19.5 H24.9', 1.6),
    D(20, 19.8, 1.1), D(28, 19.8, 1.1),
    L('M21 24.5 Q24 26.8 27 24.5', 1.6), D(17.5, 23.5, 1.4, K.rose), D(30.5, 23.5, 1.4, K.rose),
    P('M33 40 C29.5 37.4 29.5 35 31.3 35 C32.3 35 33 35.9 33 35.9 C33 35.9 33.7 35 34.7 35 C36.5 35 36.5 37.4 33 40 Z', K.rose, { 'stroke-width': 1.4 }),
  ],
  dove: () => [
    ...S('M44 20 Q42 27 37 31', K.leaf, 1.5),
    E(41, 26, 3.2, 1.7, K.green, -40), E(38.5, 30.5, 3.2, 1.7, K.green, 20),
    P('M12 26 L2.5 21 L5 31 Z', K.white),
    E(22, 28, 14, 8.5, K.white, -8),
    P('M41 17 L46 19.6 L41 21.5 Z', K.orange, { 'stroke-width': 1.5 }),
    C(35, 19, 6.8, K.white),
    P('M14 27 Q18 12 31 15 Q27 21 25 31 Q19 32 14 27 Z', K.white),
    L('M18 25 Q21 21 25 20 M18.5 28.5 Q22 25 25.5 24.5', 1.4),
    D(37, 17.8, 1.4),
  ],
  home: () => [
    R(30, 9, 6, 11, 1.2, K.dark),
    R(10.5, 21, 27, 21, 2, K.yellow),
    P('M6 23.5 L24 7 L42 23.5 Q42 25.5 40 25 L24 11.5 L8 25 Q6 25.5 6 23.5 Z', K.red),
    R(20.5, 30, 8, 12, 2, K.brown), D(26.5, 36.5, 1),
    P('M15.5 34 C11.5 31 11.5 27.5 13.6 27.5 C14.8 27.5 15.5 28.6 15.5 28.6 C15.5 28.6 16.2 27.5 17.4 27.5 C19.5 27.5 19.5 31 15.5 34 Z', K.rose, { 'stroke-width': 1.5 }),
    R(30.5, 27.5, 5.5, 5.5, 1, K.sky),
  ],
  friends: () => [
    P('M3 46 Q3 31 15 31 Q25 31 27 41 L27 46 Z', K.green),
    P('M45 46 Q45 31 33 31 Q23 31 21 41 L21 46 Z', K.blue),
    C(15, 20, 8.6, K.skin3), C(9.5, 15, 4.2, INK), C(14, 11.5, 4.4, INK), C(19.5, 12.5, 4, INK),
    C(15, 21, 7.4, K.skin3),
    C(33, 20, 8.6, K.skin1),
    P('M24.6 18.5 Q25 10.5 33 10.5 Q41 10.5 41.4 18.5 Q37 14.5 33 15.2 Q28.5 14.5 24.6 18.5 Z', K.yellow),
    D(12.5, 21, 1.4), D(17.5, 21, 1.4), L('M12.6 24.5 Q15 26.4 17.4 24.5', 1.5),
    D(30.5, 21, 1.4), D(35.5, 21, 1.4), L('M30.6 24.5 Q33 26.4 35.4 24.5', 1.5),
    P('M24 43 C18.5 39 18.5 35 21.3 35 C22.8 35 24 36.6 24 36.6 C24 36.6 25.2 35 26.7 35 C29.5 35 29.5 39 24 43 Z', K.red, { 'stroke-width': 1.5 }),
  ],
  planet: () => [
    C(24, 24, 17.5, K.blue),
    P('M13 15 Q18 9.5 25 12 Q28 16 23 19.5 Q20 25 14.5 22.5 Q10.5 19 13 15 Z', K.green, { 'stroke-width': 1.6 }),
    P('M29 26 Q35 22.5 38 27.5 Q38.5 33.5 32.5 36.5 Q27.5 35.5 28.5 30.5 Z', K.green, { 'stroke-width': 1.6 }),
    P('M13.5 31 Q18 29.5 19.5 33.5 Q17.5 37.5 14 35.5 Z', K.green, { 'stroke-width': 1.6 }),
    D(20, 27, 1.6), D(28, 21.5, 1.6), L('M21.5 31 Q25.5 32.5 28.5 28.5', 1.6),
    shine('M14 10 Q19 6.5 25 6.8 Q19 8.5 16 11.5 Z'),
  ],
  hug: () => [
    P(HEART, K.rose),
    ...S('M8.2 26 Q13 34 21 29', K.skin1, 3.6), ...S('M39.8 26 Q35 34 27 29', K.skin1, 3.6),
    C(21.5, 28.6, 2.8, K.skin1), C(26.5, 28.6, 2.8, K.skin1),
    L('M15.5 19 Q18 16.5 20.5 19 M27.5 19 Q30 16.5 32.5 19', 1.7),
    D(14, 23.4, 1.6, '#ffd0e2'), D(34, 23.4, 1.6, '#ffd0e2'),
    L('M21.5 22 Q24 24 26.5 22', 1.6),
  ],
  sun: () => [
    P(starPath(24, 24, 12, 21, 13), K.orange),
    C(24, 24, 12.5, K.yellow),
    D(20, 22, 1.6), D(28, 22, 1.6), L('M19.5 27 Q24 31 28.5 27', 1.7),
    D(17.2, 26.5, 1.6, K.rose), D(30.8, 26.5, 1.6, K.rose),
  ],
  apple: () => [
    ...S('M24 15 Q23.5 9 26.5 5.5', K.dark, 2),
    P('M26 9.5 Q31 3.5 38 6.5 Q33 12 26 9.5 Z', K.green, { 'stroke-width': 1.6 }),
    P('M24 14.5 C18 9.5 7.5 12 7.5 23.5 C7.5 35 15 43 20 43 C22 43 23 42 24 42 C25 42 26 43 28 43 C33 43 40.5 35 40.5 23.5 C40.5 12 30 9.5 24 14.5 Z', K.red),
    shine('M13 19 Q15 15 19 14.5 Q16 18 15.5 23 Q13 22 13 19 Z'),
  ],
  giggle: () => [
    C(24, 24, 18, K.yellow),
    L('M14.5 20 Q17.5 15.5 20.5 20 M27.5 20 Q30.5 15.5 33.5 20', 2.2),
    P('M14 26.5 H34 Q33.5 38.5 24 38.5 Q14.5 38.5 14 26.5 Z', INK),
    P('M18.6 34.6 Q24 30.5 29.4 34.6 Q27.5 37.4 24 37.4 Q20.5 37.4 18.6 34.6 Z', K.rose, { stroke: 'none' }),
    D(11.5, 26, 2.2, K.rose), D(36.5, 26, 2.2, K.rose),
  ],
  pie: () => [
    P('M7 27 C9 14 39 14 41 27 Z', '#f2b45f'),
    L('M17 20.5 L19.5 23.5 M24 18.5 V22.5 M31 20.5 L28.5 23.5', 1.7),
    P('M4 26 H44 L39.5 39 Q39 40.5 37.5 40.5 H10.5 Q9 40.5 8.5 39 Z', K.red),
    P('M4 26 Q6.5 30 9 26 Q11.5 30 14 26 Q16.5 30 19 26 Q21.5 30 24 26 Q26.5 30 29 26 Q31.5 30 34 26 Q36.5 30 39 26 Q41.5 30 44 26 Z', '#f2b45f', { 'stroke-width': 1.6 }),
    L('M11 34 H37', 1.4),
  ],
  rainbow: () => [
    svg('path', { d: 'M9 40 V38 A15 15 0 0 1 39 38 V40', fill: 'none', stroke: INK, 'stroke-width': 19 }),
    svg('path', { d: 'M3.5 40 V38 A20.5 20.5 0 0 1 44.5 38 V40', fill: 'none', stroke: K.red, 'stroke-width': 3.4 }),
    svg('path', { d: 'M7 40 V38 A17 17 0 0 1 41 38 V40', fill: 'none', stroke: K.orange, 'stroke-width': 3.4 }),
    svg('path', { d: 'M10.5 40 V38 A13.5 13.5 0 0 1 37.5 38 V40', fill: 'none', stroke: K.yellow, 'stroke-width': 3.4 }),
    svg('path', { d: 'M14 40 V38 A10 10 0 0 1 34 38 V40', fill: 'none', stroke: K.green, 'stroke-width': 3.4 }),
    P('M1 45 Q-1 38 4.5 37 Q5.5 31 11 32 Q16 30 18 35.5 Q22.5 36.5 20.5 45 Z', K.white),
    P('M27.5 45 Q25.5 36.5 30 35.5 Q32 30 37 32 Q42.5 31 43.5 37 Q49 38 47 45 Z', K.white),
  ],
  flower: () => [
    ...S('M24 26 V45', K.leaf, 2.6),
    E(30, 37, 6, 3, K.green, -30), E(18, 39, 5, 2.6, K.green, 30),
    C(24, 10, 6.4, K.pink), C(31.6, 15.5, 6.4, K.pink), C(28.7, 24.5, 6.4, K.pink), C(19.3, 24.5, 6.4, K.pink), C(16.4, 15.5, 6.4, K.pink),
    C(24, 18, 5.4, K.yellow),
  ],
};

/** The picture for a chip, as an SVG that scales to its box. Decorative: the chip carries the label. */
export function chipIcon(id: IconId, size = 48): SVGSVGElement {
  const el = svg('svg', { viewBox: '0 0 48 48', width: size, height: size, class: 'wish-icon', 'aria-hidden': 'true', focusable: 'false' });
  for (const part of DRAW[id]()) el.append(part);
  return el;
}

export const ICON_IDS = Object.keys(DRAW) as IconId[];
