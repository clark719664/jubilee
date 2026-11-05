// Passover sticker: a cheerful square of matzah, toasty stripes and rows of little holes, stands on a blue-and-white
// seder plate beside Elijah's silver cup of grape juice and a sprig of parsley. The badge is the plate itself:
// porcelain white with a scalloped rim, a blue ring and tiny blue flowers. The cup and the parsley break out of it.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, scallopD, roundPoly, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'passover-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#2a2a4a';

export function sticker() {
  setPrecision(10);
  const bd = scallopD(256, 256, 190, 26, 0.5);
  const inside = [
    circle(256, 256, 160, { fill: 'none', stroke: '#2a5aa8', 'stroke-width': 8 }),
    circle(256, 256, 144, { fill: 'none', stroke: '#5a8ad8', 'stroke-width': 3, 'stroke-dasharray': '6 8' }),
  ].join('');
  const bg = badge(ID, { d: bd, cx: 256, cy: 262, c1: '#ffffff', c2: '#d8e4f4', tile: tiled(ID, { cx: 256, cy: 262, r: 220 }, 48, [MARKS.flower(8), MARKS.dot(2.4)]), patternFill: '#3a6ac8', patternOpacity: 0.35, ink: '#2a4a8a', stitch: '#5a8ad8', stitchOpacity: 0.5, inside, inset: 0.92 });

  // ---- the matzah: a tilted square
  const M = { x: 236, y: 270, s: 108, a: -8 };
  const square = roundPoly([[M.x - M.s, M.y - M.s], [M.x + M.s, M.y - M.s], [M.x + M.s, M.y + M.s], [M.x - M.s, M.y + M.s]], 14);
  const MT = `rotate(${M.a} ${M.x} ${M.y})`;
  // ---- Elijah's cup, right
  const cup = 'M380 300q0 -60 44 -66q44 6 44 66q0 26 -34 30v34h20l8 14h-76l8 -14h20v-34q-34 -4 -34 -30Z';
  // ---- parsley, bottom left
  const parsley = 'M92 392c-8 -24 12 -38 26 -28c4 -20 30 -20 32 -2c18 -8 32 6 22 22c14 6 6 28 -10 26c-4 16 -26 18 -32 4c-16 6 -34 -6 -26 -20c-14 -4 -16 -14 -12 -2z';

  const heroSil = [G({ transform: MT }, path(square)), path(cup), path(parsley), path('M150 430l34 -34', { fill: 'none', stroke: '#000', 'stroke-width': 8 })].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-matzah`, 0.42, 0.38, 0.75, [[0, '#fbe6b0'], [0.6, '#f0cc84'], [1, '#d8a458']]),
    lin(`${ID}-silver`, 0, 0, 1, 0, [[0, '#d8dce8'], [0.45, '#ffffff'], [1, '#9aa2b4']]),
    lin(`${ID}-juice`, 0, 0, 0, 1, [[0, '#a83a7a'], [1, '#5a0a3a']]),
    E('clipPath', { id: `${ID}-mc` }, path(square)),
  ];

  // toasty stripes and rows of little holes
  let holes = '';
  for (let r = -3; r <= 3; r++) for (let c = -4; c <= 4; c++) holes += `M${f(M.x + c * 22 - 2)} ${f(M.y + r * 28 + (r % 2 ? 0 : 11))}a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0`;
  let stripes = '';
  for (let r = -3; r <= 3; r++) stripes += `M${M.x - M.s} ${M.y + r * 28 - 4}q${M.s} -8 ${2 * M.s} 0v5q-${M.s} -8 -${2 * M.s} 0z`;

  const art = G({},
    '\n<!-- the badge: a porcelain seder plate with a scalloped rim, a blue ring and tiny blue flowers -->\n',
    bg.art,
    sparkle(410, 140, 11, '#ffd166'), sparkle(110, 150, 8, '#ffd166'),
    '\n<!-- the matzah, the cup and the parsley: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    G({ transform: MT },
      path(square, { fill: u('matzah') }),
      G({ 'clip-path': u('mc') }, path(stripes, { fill: '#c8843a', opacity: 0.45 }), path(holes, { fill: '#a86a2a', opacity: 0.7 }),
        path(`M${M.x - 70} ${M.y - 96}q40 -10 90 -6`, { fill: 'none', stroke: '#fff4d8', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.7 })),
      face(M.x, M.y + 4, 62, 28, 'shy', { ink: '#5a2a00', cheek: '#ff9a8a' })),
    // the cup
    path(cup, { fill: u('silver') }),
    ellipse(424, 248, 38, 9, { fill: u('juice') }),
    path('M394 270q4 -24 22 -30', { fill: 'none', stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.8 }),
    path('M392 300q32 10 64 0', { fill: 'none', stroke: '#a8b0c4', 'stroke-width': 3 }),
    circle(424, 284, 6, { fill: '#5a8ad8' }),
    // the parsley
    path('M150 430l34 -34', { fill: 'none', stroke: '#3a8a3a', 'stroke-width': 6, 'stroke-linecap': 'round' }),
    path(parsley, { fill: '#4ab84a' }),
    path('M112 380q18 -6 30 8M128 362q12 8 14 22', { fill: 'none', stroke: '#2a8a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }),
  );
  return stickerDoc(ID, 'Passover sticker: a cheerful square of matzah with toasty stripes and rows of little holes stands on a blue-and-white seder plate beside Elijah\'s silver cup of grape juice and a sprig of parsley; the plate is the badge', defs, sil, art);
}
