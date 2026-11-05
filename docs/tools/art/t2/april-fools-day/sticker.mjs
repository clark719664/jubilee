// April Fools' Day sticker ("Just Kidding"): a winking jack-in-the-box clown boings out of a red box on a wobbly
// spring, in a jester hat with bells and a frilly collar. The badge is a comic speech bubble in bright yellow with
// halftone dots. The clown's hat and the box break out of the bubble.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, roundPoly, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'april-fools-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#2a1030';

export function sticker() {
  setPrecision(10);
  // ---- badge: a comic speech bubble with a tail at the bottom left
  const pts = [[48, 84], [464, 84], [464, 372], [176, 372], [88, 448], [118, 372], [48, 372]];
  const bd = roundPoly(pts, [46, 46, 46, 8, 6, 8, 46]);
  const B = { cx: 256, cy: 230, r: 230 };
  const bg = badge(ID, { d: bd, cx: 256, cy: 228, c1: '#fff06a', c2: '#ffb21a', tile: tiled(ID, B, 32, [MARKS.dot(5.4)]), patternFill: '#ff7a1a', patternOpacity: 0.3, ink: '#8a3a00', stitch: '#ffffff', inset: 0.9 });

  // ---- the box and the spring
  const box = 'M232 360h132v116h-132z';
  const lid = 'M232 360l-36 -40h132l36 40z';
  let spring = 'M298 360';
  for (let i = 0; i < 5; i++) spring += `q26 -9 0 -18q-26 -9 0 -18`;
  // ---- the clown
  const H = { x: 298, y: 178, r: 62 };
  const head = `M${H.x - H.r} ${H.y}a${H.r} ${H.r} 0 1 0 ${2 * H.r} 0a${H.r} ${H.r} 0 1 0 ${-2 * H.r} 0Z`;
  const hat = `M${H.x - 66} ${H.y - 30}L${H.x - 108} ${H.y - 104}L${H.x - 30} ${H.y - 66}L${H.x} ${H.y - 124}L${H.x + 30} ${H.y - 66}L${H.x + 108} ${H.y - 104}L${H.x + 66} ${H.y - 30}Q${H.x} ${H.y - 54} ${H.x - 66} ${H.y - 30}Z`;
  const bells = [[H.x - 108, H.y - 104], [H.x, H.y - 124], [H.x + 108, H.y - 104]];
  let ruff = '';
  for (let k = 0; k < 9; k++) { const a = Math.PI * (0.1 + (k / 8) * 0.8); ruff += `M${P(H.x + Math.cos(a) * 58, H.y + 56 + Math.sin(a) * 14)}a20 16 0 1 0 0.1 0Z`; }

  const heroSil = [path(box), path(lid), path(spring, { fill: 'none', stroke: '#000', 'stroke-width': 10 }), path(ruff), path(head), path(hat), ...bells.map(([x, y]) => circle(x, y, 13))].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    lin(`${ID}-box`, 0, 0, 1, 0, [[0, '#ff4a4a'], [1, '#c8102e']]),
    rad(`${ID}-skin`, 0.4, 0.35, 0.75, [[0, '#ffffff'], [1, '#ffe0d0']]),
    lin(`${ID}-hatL`, 0, 0, 0, 1, [[0, '#5ab8ff'], [1, '#2a6ad8']]),
    lin(`${ID}-hatR`, 0, 0, 0, 1, [[0, '#9a6aff'], [1, '#5a2ad8']]),
  ];

  const art = G({},
    '\n<!-- the badge: a comic speech bubble, bright yellow with halftone dots -->\n',
    bg.art,
    path('M86 150q-14 30 -6 60M444 260q14 -30 6 -60', { fill: 'none', stroke: '#ffffff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.85 }),
    sparkle(110, 300, 12, '#ffffff'), sparkle(420, 330, 9, '#ffffff'),
    '\n<!-- the jack-in-the-box: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(lid, { fill: '#a80a1e' }),
    path(spring, { fill: 'none', stroke: '#d0d4e0', 'stroke-width': 7, 'stroke-linecap': 'round' }),
    path(box, { fill: u('box') }),
    path('M298 382l9 20l22 3l-16 15l4 22l-19 -11l-19 11l4 -22l-16 -15l22 -3z', { fill: '#ffd23a' }),
    path('M240 368h116', { fill: 'none', stroke: '#ff9a9a', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8 }),
    path(ruff, { fill: '#ffffff' }),
    path(head, { fill: u('skin') }),
    path(hat, { fill: u('hatL') }),
    path(`M${H.x} ${H.y - 124}L${H.x + 30} ${H.y - 66}L${H.x + 108} ${H.y - 104}L${H.x + 66} ${H.y - 30}Q${H.x + 30} ${H.y - 44} ${H.x} ${H.y - 46}Z`, { fill: u('hatR') }),
    ...bells.map(([x, y]) => circle(x, y, 13, { fill: '#ffd23a' }) + circle(x - 4, y - 4, 4, { fill: '#ffffff', opacity: 0.8 })),
    path(`M${H.x - 30} ${H.y - 10}l-12 -10M${H.x + 30} ${H.y - 10}l12 -10`, { fill: 'none', stroke: '#5ab8ff', 'stroke-width': 0 }),
    face(H.x, H.y - 4, 50, 22, 'wink', { ink: INK, cheek: '#ff8aa0', tongue: '#ff6a8a' }),
    circle(H.x, H.y + 10, 12, { fill: '#e8243a' }), circle(H.x - 4, H.y + 6, 4, { fill: '#ffffff', opacity: 0.8 }),
  );
  return stickerDoc(ID, 'April Fools\' Day sticker: a winking jack-in-the-box clown with a red nose, a jester hat with bells and a frilly collar boings out of a red box on a spring, on a bright yellow comic speech-bubble badge with halftone dots', defs, sil, art);
}
