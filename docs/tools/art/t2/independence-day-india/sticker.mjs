// Independence Day (India) sticker: a smiling patang kite in saffron, white and green with the navy wheel at its
// heart soars out of a 24-point sunburst — one point for each spoke of the Ashoka Chakra — its ribbon tail fluttering
// and its string running down to a little wooden spool. The kite, the tail and the spool break out of the sunburst.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, burstD, roundPoly, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'independence-day-india-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#1a1a3a';
const SAFFRON = '#ff9933', GREEN = '#138808', NAVY = '#000080';

export function sticker() {
  setPrecision(10);
  const B = { cx: 256, cy: 262, r: 220 };
  const bd = burstD(B.cx, B.cy, 204, 178, 24, 6);
  const bg = badge(ID, { d: bd, cx: B.cx, cy: B.cy, c1: '#fff4d8', c2: '#ffd08a', tile: tiled(ID, B, 46, [MARKS.dot(3), MARKS.twinkle(6)]), patternFill: SAFFRON, patternOpacity: 0.45, ink: '#a8641a', stitch: '#ff9933', stitchOpacity: 0.6, inset: 0.86 });

  // ---- the kite: a diamond tilted a little, three bands, the wheel in the middle
  const K = { x: 236, y: 200, s: 132 };
  const kite = roundPoly([[K.x, K.y - K.s], [K.x + K.s * 0.82, K.y], [K.x, K.y + K.s], [K.x - K.s * 0.82, K.y]], 14);
  const KT = `rotate(-14 ${K.x} ${K.y})`;
  const tail = `M${K.x} ${K.y + K.s}c-30 34 30 50 0 86c-14 16 6 26 -6 40l12 6c14 -20 -6 -28 6 -46c30 -36 -30 -52 0 -86z`;
  const bows = `M${K.x - 26} ${K.y + K.s + 36}l26 10l-26 10zM${K.x + 26} ${K.y + K.s + 36}l-26 10l26 10zM${K.x - 30} ${K.y + K.s + 86}l26 10l-26 10zM${K.x + 22} ${K.y + K.s + 86}l-26 10l26 10z`;
  // ---- the spool, bottom right, and the string
  const SP = { x: 404, y: 400 };
  const spool = `M${SP.x - 34} ${SP.y - 26}h68v52h-68z`;

  const heroSil = [G({ transform: KT }, path(kite), path(tail), path(bows)), path(spool), path(`M${SP.x - 50} ${SP.y - 30}a50 12 0 1 0 100 0a50 12 0 1 0 -100 0ZM${SP.x - 50} ${SP.y + 30}a50 12 0 1 0 100 0a50 12 0 1 0 -100 0Z`)].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    E('clipPath', { id: `${ID}-kc` }, path(kite)),
    lin(`${ID}-wood`, 0, 0, 0, 1, [[0, '#d8a46a'], [1, '#a8743e']]),
  ];

  let spokes = '';
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; spokes += `M${K.x} ${K.y}L${P(K.x + Math.cos(a) * 26, K.y + Math.sin(a) * 26)}`; }

  const art = G({},
    '\n<!-- the badge: a 24-point sunburst, one point for each spoke of the wheel -->\n',
    bg.art,
    sparkle(90, 120, 12, '#ffffff'), sparkle(430, 120, 10, '#ffffff'),
    '\n<!-- the kite, its tail and the spool: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(`M${SP.x - 30} ${SP.y - 30}Q${SP.x - 120} ${SP.y - 140} ${K.x + 70} ${K.y + 110}`, { fill: 'none', stroke: '#5a3a1a', 'stroke-width': 3 }),
    G({ transform: KT },
      path(tail, { fill: SAFFRON }), path(bows, { fill: GREEN }),
      G({ 'clip-path': u('kc') },
        path(`M${K.x - 200} ${K.y - 300}H${K.x + 200}V${K.y - K.s / 3}H${K.x - 200}Z`, { fill: SAFFRON }),
        path(`M${K.x - 200} ${K.y - K.s / 3}H${K.x + 200}V${K.y + K.s / 3}H${K.x - 200}Z`, { fill: '#ffffff' }),
        path(`M${K.x - 200} ${K.y + K.s / 3}H${K.x + 200}V${K.y + 300}H${K.x - 200}Z`, { fill: GREEN }),
        path(`M${K.x - 90} ${K.y - 70}q40 -30 80 -26`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.6 })),
      path(`M${K.x} ${K.y - K.s}V${K.y + K.s}M${K.x - K.s * 0.82} ${K.y}Q${K.x} ${K.y - K.s * 0.5} ${K.x + K.s * 0.82} ${K.y}`, { fill: 'none', stroke: '#7a4a1a', 'stroke-width': 4 }),
      circle(K.x, K.y, 30, { fill: '#ffffff' }), circle(K.x, K.y, 28, { fill: 'none', stroke: NAVY, 'stroke-width': 4 }), path(spokes, { fill: 'none', stroke: NAVY, 'stroke-width': 1.8 }), circle(K.x, K.y, 5, { fill: NAVY }),
      face(K.x, K.y - 66, 52, 22, 'joy', { ink: INK, cheek: '#ff8a5a' })),
    // the spool
    path(spool, { fill: '#f4ece0' }),
    path(`M${SP.x - 34} ${SP.y - 14}h68M${SP.x - 34} ${SP.y}h68M${SP.x - 34} ${SP.y + 14}h68`, { fill: 'none', stroke: '#c8b8a0', 'stroke-width': 2 }),
    ellipse(SP.x, SP.y - 30, 50, 12, { fill: u('wood') }), ellipse(SP.x, SP.y + 30, 50, 12, { fill: u('wood') }),
    path(`M${SP.x - 6} ${SP.y + 40}v30h12v-30z`, { fill: '#a8743e' }),
  );
  return stickerDoc(ID, 'Independence Day (India) sticker: a smiling patang kite in saffron, white and green with the navy wheel at its heart soars out of a 24-point cream sunburst, its ribbon tail fluttering and its string running down to a little wooden spool', defs, sil, art);
}
