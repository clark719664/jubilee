// Songkran sticker ("Splash Master"): a happy baby elephant in a red saddle cloth and a jasmine garland sprays a
// fountain of water from its raised trunk, droplets flying everywhere. The badge is a big water drop, sky blue to
// deep blue with tiny drops and jasmine flowers. The spray breaks out of the drop.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, MARKS, tiled, inkUnder, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'songkran-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#1a2a4a';
const GOLD = '#ffc83a';

export function sticker() {
  setPrecision(10);
  // ---- badge: a big water drop
  const bd = 'M256 34C318 120 430 222 430 318A174 160 0 1 1 82 318C82 222 194 120 256 34Z';
  const B = { cx: 256, cy: 300, r: 220 };
  const drop = (r) => `M0 ${f(-r)}c${f(r * 0.5)} ${f(r * 0.7)} ${f(r * 0.7)} ${f(r * 1.0)} ${f(r * 0.7)} ${f(r * 1.3)}a${f(r * 0.7)} ${f(r * 0.7)} 0 1 1 ${f(-r * 1.4)} 0c0 ${f(-r * 0.3)} ${f(r * 0.2)} ${f(-r * 0.6)} ${f(r * 0.7)} ${f(-r * 1.3)}z`;
  const bg = badge(ID, { d: bd, cx: 256, cy: 300, c1: '#8ae0ff', c2: '#2a7ad8', tile: tiled(ID, B, 46, [drop(6), MARKS.flower(7), MARKS.dot(2.6)]), patternFill: '#ffffff', patternOpacity: 0.55, ink: '#0a3a7a', inset: 0.88 });

  // ---- the elephant, facing left, trunk raised (the scene's shapes, scaled)
  const T = 'translate(318 460) scale(1.08)';
  const leg = (x) => `M${x - 18} -60V-6q0 6 6 6h24q6 0 6 -6V-60z`;
  const body = 'M-100 -90C-104 -150 -40 -176 20 -170C80 -166 112 -130 108 -90C104 -60 70 -50 0 -50C-60 -50 -96 -60 -100 -90Z';
  const head = 'M-160 -130a50 50 0 1 0 100 0a50 50 0 1 0 -100 0Z';
  const ear = 'M-96 -170C-60 -180 -40 -150 -48 -120C-56 -94 -82 -92 -94 -110Z';
  const trunk = 'M-150 -116C-176 -120 -190 -150 -186 -190C-184 -214 -170 -232 -152 -240l8 14C-160 -220 -168 -206 -168 -186C-168 -160 -158 -140 -140 -134Z';
  const tail = 'M104 -110q22 0 20 30';
  // the fountain from the trunk tip, arcing up and over to the right
  const tip = [318 + -148 * 1.08, 460 + -236 * 1.08];
  const arc = `M${P(...tip)}C${P(tip[0] + 10, tip[1] - 140)} ${P(tip[0] + 240, tip[1] - 160)} ${P(tip[0] + 290, tip[1] - 20)}`;

  const heroSil = [G({ transform: T }, path(leg(-50)), path(leg(54)), path(leg(-30)), path(leg(74)), path(body), path(head), path(ear), path(trunk), path(tail, { fill: 'none', stroke: '#000', 'stroke-width': 5 })), path(arc, { fill: 'none', stroke: '#000', 'stroke-width': 18, 'stroke-linecap': 'round' })].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    lin(`${ID}-skin`, 0, 0, 0, 1, [[0, '#c8c0d0'], [1, '#8a8098']]),
  ];

  let drops = '';
  for (const [x, y, r] of [[300, 40, 9], [340, 60, 7], [372, 90, 8], [400, 128, 6], [262, 46, 6], [418, 160, 7], [236, 70, 5], [430, 196, 5]]) drops += `M${x} ${y - r}c${f(r * 0.6)} ${f(r * 0.7)} ${f(r * 0.7)} ${f(r * 1.1)} 0 ${f(r * 1.7)}c${f(-r * 0.7)} ${f(-r * 0.6)} ${f(-r * 0.6)} ${f(-r * 1.0)} 0 ${f(-r * 1.7)}z`;

  const art = G({},
    '\n<!-- the badge: a big water drop, sky blue to deep blue, with tiny drops and jasmine flowers -->\n',
    bg.art,
    path('M150 200q-30 60 -20 120', { fill: 'none', stroke: '#ffffff', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.55 }),
    sparkle(120, 360, 10, '#ffffff'), sparkle(400, 400, 8, '#ffffff'),
    '\n<!-- the elephant and its fountain: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(arc, { fill: 'none', stroke: '#c8f0ff', 'stroke-width': 14, 'stroke-linecap': 'round' }),
    path(arc, { fill: 'none', stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': '14 12' }),
    path(drops, { fill: '#e8faff' }),
    G({ transform: T },
      path(leg(-50), { fill: '#8a8098' }), path(leg(54), { fill: '#8a8098' }),
      path(body, { fill: u('skin') }),
      path(tail, { fill: 'none', stroke: '#8a8098', 'stroke-width': 5, 'stroke-linecap': 'round' }),
      path(leg(-30), { fill: u('skin') }), path(leg(74), { fill: u('skin') }),
      path('M-44 -4h4M-32 -4h4M-20 -4h4M60 -4h4M72 -4h4M84 -4h4', { fill: 'none', stroke: '#f4ece0', 'stroke-width': 3, 'stroke-linecap': 'round' }),
      path('M-40 -168C-10 -176 40 -176 60 -166L56 -100Q10 -92 -36 -100Z', { fill: '#e8343a' }), path('M-36 -100Q10 -92 56 -100', { fill: 'none', stroke: GOLD, 'stroke-width': 5 }),
      path('M-20 -134a5 5 0 1 0 10 0a5 5 0 1 0 -10 0zM10 -140a5 5 0 1 0 10 0a5 5 0 1 0 -10 0zM36 -132a5 5 0 1 0 10 0a5 5 0 1 0 -10 0z', { fill: GOLD }),
      path(head, { fill: u('skin') }),
      path(ear, { fill: '#a89aa8' }), path('M-90 -160C-66 -164 -56 -144 -62 -124', { fill: 'none', stroke: '#ffb0c0', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.8 }),
      path(trunk, { fill: u('skin') }),
      path('M-176 -170h8M-178 -184h8M-176 -198h8', { fill: 'none', stroke: '#8a8098', 'stroke-width': 2, 'stroke-linecap': 'round' }),
      // a happy closed eye, a blush, a smile
      path('M-136 -142q8 -8 16 0', { fill: 'none', stroke: INK, 'stroke-width': 3.4, 'stroke-linecap': 'round' }),
      ellipse(-118, -120, 8, 5, { fill: '#ff9db0', opacity: 0.8 }),
      path('M-138 -106q10 8 20 0', { fill: 'none', stroke: '#5a3a4a', 'stroke-width': 3, 'stroke-linecap': 'round' }),
      // the jasmine garland
      path(Array.from({ length: 9 }, (_, k) => `M${-88 + k * 6} ${-92 + Math.sin((k / 8) * Math.PI) * 14}m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0`).join(''), { fill: '#ffffff' }),
      circle(-64, -78, 6, { fill: '#e8343a' })),
  );
  return stickerDoc(ID, 'Songkran sticker: a happy baby elephant in a red saddle cloth and a jasmine garland sprays a fountain of water from its raised trunk, droplets flying, on a big water-drop badge in sky blue with tiny drops and jasmine flowers', defs, sil, art);
}
