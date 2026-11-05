// Independence Day (Mexico) sticker: the old bell of the Grito, golden and happy, swings and rings — ¡din don! — with a
// green, white and red bow on its yoke, inside a laurel wreath like the one on the flag, tied at the bottom with a
// red ribbon. The badge is the wreath around a white disc. The bell and its bow break out of the top.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, circleD, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'independence-day-mexico-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#2a1a0a';
const GREEN = '#006847', RED = '#ce1126';

export function sticker() {
  setPrecision(10);
  const C0 = { x: 256, y: 276 };
  // the wreath: leaves round a ring, drawn as the badge's outline (a disc) with leaves painted inside the rim
  const bd = circleD(C0.x, C0.y, 196);
  // the laurel leaves: rotated ellipses round the rim, open at the top where the bell breaks out
  let leafEls = '';
  for (let k = 0; k < 26; k++) {
    const a = Math.PI / 2 + 0.4 + (k / 25) * (Math.PI * 2 - 0.8);
    const x = C0.x + Math.cos(a) * 168, y = C0.y + Math.sin(a) * 168, deg = (a * 180) / Math.PI + 90 + (k < 13 ? 35 : -35);
    leafEls += ellipse(x, y, 20, 9, { fill: k % 2 ? '#2a9a5a' : GREEN, transform: `rotate(${f(deg)} ${f(x)} ${f(y)})` });
  }
  const inside = [
    circle(C0.x, C0.y, 140, { fill: '#ffffff' }),
    leafEls,
    path(`M${C0.x - 30} ${C0.y + 170}l30 -16l30 16l-12 30l-18 -14l-18 14z`, { fill: RED }),
  ].join('');
  const bg = badge(ID, { d: bd, cx: C0.x, cy: C0.y, c1: '#d8f0e0', c2: '#9ad0b0', tile: tiled(ID, { cx: C0.x, cy: C0.y, r: 210 }, 40, [MARKS.dot(2.4)]), patternFill: GREEN, patternOpacity: 0.3, ink: '#0a3a2a', stitch: GREEN, inside, inset: 0.6 });

  // ---- the bell, swinging a little to the right
  const B = { x: 256, y: 250 };
  const BT = `rotate(12 ${B.x} ${B.y - 150})`;
  const bell = `M${B.x - 96} ${B.y + 70}C${B.x - 84} ${B.y + 40} ${B.x - 72} ${B.y - 10} ${B.x - 70} ${B.y - 60}C${B.x - 68} ${B.y - 120} ${B.x - 30} ${B.y - 140} ${B.x} ${B.y - 140}C${B.x + 30} ${B.y - 140} ${B.x + 68} ${B.y - 120} ${B.x + 70} ${B.y - 60}C${B.x + 72} ${B.y - 10} ${B.x + 84} ${B.y + 40} ${B.x + 96} ${B.y + 70}Z`;
  const lip = `M${B.x - 104} ${B.y + 64}h208v22h-208Z`;
  const clapper = `M${B.x - 16} ${B.y + 92}a16 16 0 1 0 32 0a16 16 0 1 0 -32 0Z`;
  const yoke = `M${B.x - 70} ${B.y - 186}h140v26h-140Z`;
  const bow = `M${B.x} ${B.y - 186}c-40 -30 -70 -10 -56 10c-30 10 -20 40 10 26c10 -10 30 -24 46 -36zM${B.x} ${B.y - 186}c40 -30 70 -10 56 10c30 10 20 40 -10 26c-10 -10 -30 -24 -46 -36z`;

  const heroSil = [G({ transform: BT }, path(bell), path(lip), path(clapper), path(`M${B.x - 8} ${B.y - 160}h16v20h-16z`), path(yoke), path(bow))].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    lin(`${ID}-gold`, 0, 0, 1, 0, [[0, '#c8901e'], [0.4, '#ffe680'], [0.7, '#ffc83a'], [1, '#a87010']]),
    lin(`${ID}-wood`, 0, 0, 0, 1, [[0, '#a8743e'], [1, '#7a4a22']]),
  ];

  const art = G({},
    '\n<!-- the badge: a white disc in a green laurel wreath tied with a red ribbon -->\n',
    bg.art,
    '\n<!-- ringing marks -->\n',
    path('M110 220q-24 30 -10 70M90 200q-36 46 -14 104M402 220q24 30 10 70M422 200q36 46 14 104', { fill: 'none', stroke: '#ffd166', 'stroke-width': 7, 'stroke-linecap': 'round' }),
    sparkle(110, 120, 10, '#ffd166'), sparkle(410, 130, 8, '#ffffff'),
    '\n<!-- the bell: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    G({ transform: BT },
      path(yoke, { fill: u('wood') }), path(`M${B.x - 8} ${B.y - 160}h16v20h-16z`, { fill: '#8a6a2a' }),
      path(clapper, { fill: '#8a6a2a' }),
      path(bell, { fill: u('gold') }),
      path(`M${B.x - 50} ${B.y - 80}q6 -40 36 -48`, { fill: 'none', stroke: '#fff6c8', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.8 }),
      path(lip, { fill: '#e8a020' }), path(`M${B.x - 96} ${B.y + 30}h192`, { fill: 'none', stroke: '#c8901e', 'stroke-width': 4 }),
      face(B.x, B.y - 30, 60, 26, 'sing', { ink: INK, cheek: '#ff9a6a' }),
      path(bow, { fill: GREEN }), path(`M${B.x - 28} ${B.y - 196}c-10 -6 -20 -4 -18 4c4 4 10 4 18 -4zM${B.x + 28} ${B.y - 196}c10 -6 20 -4 18 4c-4 4 -10 4 -18 -4z`, { fill: '#ffffff' }), circle(B.x, B.y - 186, 12, { fill: RED })),
  );
  return stickerDoc(ID, 'Independence Day (Mexico) sticker: the old bell of the Grito, golden and singing, swings and rings with a green, white and red bow on its wooden yoke, inside a green laurel wreath tied with a red ribbon', defs, sil, art);
}
