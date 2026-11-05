// Children's Day (Japan) sticker ("Carp Streamer"): a happy koinobori carp streamer, red with gold scales and a
// big eye, swims across an open folding fan (a sensu) painted with sky blue and white waves; its tail ripples out
// past the fan's edge and its mouth ring is tied to a little pole with a spinning wheel. The carp and the pole break
// out of the fan.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'childrens-day-japan-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#2a1a2a';

/** An open fan: an annular sector about the pivot (cx, cy), radii r0..r1, from angle a0 to a1 (degrees, 0 = right). */
function fanD(cx, cy, r0, r1, a0, a1) {
  const pt = (r, a) => P(cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180));
  return `M${pt(r0, a0)}L${pt(r1, a0)}A${f(r1)} ${f(r1)} 0 0 1 ${pt(r1, a1)}L${pt(r0, a1)}A${f(r0)} ${f(r0)} 0 0 0 ${pt(r0, a0)}Z`;
}

export function sticker() {
  setPrecision(10);
  const F = { cx: 256, cy: 466, r0: 54, r1: 230, a0: -172, a1: -8 };
  const bd = fanD(F.cx, F.cy, F.r0, F.r1, F.a0, F.a1);
  // the fan's ribs and a band of waves near the top
  let ribs = '';
  for (let k = 1; k < 12; k++) { const a = ((F.a0 + (k / 12) * (F.a1 - F.a0)) * Math.PI) / 180; ribs += `M${P(F.cx + Math.cos(a) * F.r0, F.cy + Math.sin(a) * F.r0)}L${P(F.cx + Math.cos(a) * F.r1, F.cy + Math.sin(a) * F.r1)}`; }
  let waves = '';
  for (let k = 0; k < 9; k++) { const a = F.a0 + 12 + k * 17.5, r = 186; const x = F.cx + r * Math.cos((a * Math.PI) / 180), y = F.cy + r * Math.sin((a * Math.PI) / 180); waves += `M${P(x - 18, y + 8)}q4 -20 20 -18q14 2 10 14q-6 -8 -12 0z`; }
  const inside = [
    path(ribs, { fill: 'none', stroke: '#ffffff', 'stroke-width': 2, opacity: 0.4 }),
    path(waves, { fill: '#ffffff', opacity: 0.85 }),
  ].join('');
  const B = { cx: 256, cy: 380, r: 230 };
  const bg = badge(ID, { d: bd, cx: F.cx, cy: 380, c1: '#5ab8f8', c2: '#2a6ad8', tile: tiled(ID, B, 46, [MARKS.dot(3), MARKS.twinkle(5)]), patternFill: '#ffffff', patternOpacity: 0.5, ink: '#0a2a6a', inside, inset: 0.92 });

  // ---- the little pole on the right with its wheel
  const PX = 446;
  const pole = `M${PX - 5} 470V96h10V470Z`;
  const wheel = `M${PX - 22} 90a22 22 0 1 0 44 0a22 22 0 1 0 -44 0Z`;
  // ---- the carp, tied at the pole, body streaming out to the left in a ripple
  const H = 62, X0 = PX - 6, Y0 = 212, LEN = 316;
  const wave = (t) => Math.sin(t * Math.PI * 2 + 0.6) * 26 * t;
  let top = '', bot = '';
  for (let i = 0; i <= 12; i++) { const t = i / 12, x = X0 - LEN * t, w = H * (1 - t * 0.3); top += `${i ? 'L' : 'M'}${P(x, Y0 - w + wave(t))}`; bot = `L${P(x, Y0 + w + wave(t))}` + bot; }
  const body = top + bot + 'Z';
  const tx = X0 - LEN, ty = Y0 + wave(1);
  const tail = `M${P(tx + 6, ty - 38)}L${P(tx - 60, ty - 80)}Q${P(tx - 34, ty)} ${P(tx - 60, ty + 80)}L${P(tx + 6, ty + 38)}Z`;

  const heroSil = [path(pole), path(wheel), path(body), path(tail)].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    lin(`${ID}-carp`, 0, 0, 0, 1, [[0, '#ff5a5a'], [1, '#c8102e']]),
    lin(`${ID}-pole`, 0, 0, 1, 0, [[0, '#d8c8a8'], [0.5, '#fff4dc'], [1, '#b8a888']]),
    E('clipPath', { id: `${ID}-cc` }, path(body)),
  ];

  let scales = '';
  for (let i = 2; i < 11; i++) { const t = i / 12, x = X0 - LEN * t; for (const dy of [-34, 0, 34]) scales += `M${P(x + 12, Y0 + dy + wave(t) - 10)}a14 14 0 0 0 0 22`; }
  let spokes = '';
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; spokes += `M${PX} 90L${P(PX + Math.cos(a) * 20, 90 + Math.sin(a) * 20)}`; }

  const art = G({},
    '\n<!-- the badge: an open folding fan painted sky blue with white waves -->\n',
    bg.art,
    sparkle(80, 330, 10, '#ffffff'), sparkle(436, 330, 8, '#ffffff'), sparkle(150, 70, 9, '#ffe9a3'),
    '\n<!-- the carp streamer and its pole: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(pole, { fill: u('pole') }),
    path(spokes, { fill: 'none', stroke: '#d8a020', 'stroke-width': 4 }), circle(PX, 90, 8, { fill: '#ffd23a' }),
    path(tail, { fill: '#c8102e' }), path(`M${P(tx - 26, ty - 46)}Q${P(tx - 12, ty)} ${P(tx - 26, ty + 46)}`, { fill: 'none', stroke: '#ffb0a0', 'stroke-width': 4, opacity: 0.8 }),
    path(body, { fill: u('carp') }),
    G({ 'clip-path': u('cc') },
      path(`M${P(X0, Y0 + 30)}C${P(X0 - 120, Y0 + 60)} ${P(X0 - 240, Y0 + 30)} ${P(X0 - LEN, Y0 + 60)}V${f(Y0 + 120)}H${f(X0)}Z`, { fill: '#ffffff', opacity: 0.9 }),
      path(scales, { fill: 'none', stroke: '#ffd23a', 'stroke-width': 4, 'stroke-linecap': 'round' })),
    // the mouth ring and the face
    ellipse(X0, Y0, 14, H, { fill: '#ffffff', stroke: INK, 'stroke-width': 5 }),
    circle(X0 - 54, Y0 - 16, 26, { fill: '#ffffff' }), circle(X0 - 56, Y0 - 16, 15, { fill: '#2a1a2a' }), circle(X0 - 62, Y0 - 22, 5, { fill: '#ffffff' }),
    path(`M${P(X0 - 96, Y0 - 56)}Q${P(X0 - 110, Y0)} ${P(X0 - 96, Y0 + 56)}`, { fill: 'none', stroke: '#ffd23a', 'stroke-width': 5 }),
    path(`M${P(X0 - 46, Y0 + 26)}q10 10 22 0`, { fill: 'none', stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round' }),
    ellipse(X0 - 80, Y0 + 14, 10, 6, { fill: '#ff9db0', opacity: 0.8 }),
  );
  return stickerDoc(ID, 'Children\'s Day (Japan) sticker: a happy red koinobori carp streamer with gold scales and a big eye swims across an open folding fan painted sky blue with white waves, its tail rippling past the edge and its mouth ring tied to a little pole with a spinning wheel', defs, sil, art);
}
