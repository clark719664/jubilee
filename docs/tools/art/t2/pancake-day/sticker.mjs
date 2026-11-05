// Pancake Day sticker: a delighted pancake with a melting pat of butter and drips of syrup flips high out of a
// frying pan, with a wedge of lemon spinning beside it. The badge is the frying pan itself: a round cast-iron pan
// with a long handle, sprinkled with sugar. The pancake and the lemon break out of the pan.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, capsule, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'pancake-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#3a1e0a';

export function sticker() {
  setPrecision(10);
  // ---- badge: the frying pan, a round pan with a long handle out to the bottom right
  const PAN = { cx: 226, cy: 300, r: 168 };
  const bd = `M${PAN.cx - PAN.r} ${PAN.cy}a${PAN.r} ${PAN.r} 0 1 0 ${2 * PAN.r} 0a${PAN.r} ${PAN.r} 0 1 0 ${-2 * PAN.r} 0Z` + capsule(420, 428, 66, 22, 38);
  const inside = [
    circle(PAN.cx, PAN.cy, PAN.r - 22, { fill: '#2a2a34' }),
    path(`M${PAN.cx - PAN.r + 30} ${PAN.cy - 30}A${PAN.r - 30} ${PAN.r - 30} 0 0 1 ${PAN.cx + 40} ${PAN.cy - PAN.r + 32}`, { fill: 'none', stroke: '#8a8a9a', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.6 }),
    path(capsule(450, 452, 26, 8, 38), { fill: '#6a4a3a' }),
  ].join('');
  const B = { cx: 226, cy: 300, r: 220 };
  const bg = badge(ID, { d: bd, cx: PAN.cx, cy: PAN.cy, c1: '#6a6a7a', c2: '#2a2a36', tile: tiled(ID, B, 40, [MARKS.dot(2.6), MARKS.twinkle(4), MARKS.dot(1.8)]), patternFill: '#ffffff', patternOpacity: 0.45, ink: '#14141c', inside, inset: 0.9 });

  // ---- the pancake, flipping high, tilted
  const PC = { x: 234, y: 168, rx: 136, ry: 58, t: -10 };
  const T = `rotate(${PC.t} ${PC.x} ${PC.y})`;
  const disc = `M${PC.x - PC.rx} ${PC.y}a${PC.rx} ${PC.ry} 0 1 0 ${2 * PC.rx} 0a${PC.rx} ${PC.ry} 0 1 0 ${-2 * PC.rx} 0Z`;
  const edge = `M${PC.x - PC.rx} ${PC.y}a${PC.rx} ${PC.ry} 0 0 0 ${2 * PC.rx} 0v16a${PC.rx} ${PC.ry} 0 0 1 ${-2 * PC.rx} 0Z`;
  const syrup = `M${PC.x - 70} ${PC.y + 40}q-4 26 6 40q10 -14 4 -40zM${PC.x + 30} ${PC.y + 54}q-2 34 8 50q10 -18 4 -50zM${PC.x + 100} ${PC.y + 30}q0 20 8 28q8 -12 2 -28z`;
  const L = { x: 422, y: 96, r: 38 };
  const lemon = `M${L.x - L.r} ${L.y}a${L.r} ${L.r} 0 1 0 ${2 * L.r} 0a${L.r} ${L.r} 0 1 0 ${-2 * L.r} 0Z`;

  const heroSil = [G({ transform: T }, path(disc), path(edge), path(syrup)), path(lemon)].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-pancake`, 0.42, 0.38, 0.7, [[0, '#ffe08a'], [0.6, '#f6c05a'], [1, '#e0943a']]),
    lin(`${ID}-edge`, 0, 0, 0, 1, [[0, '#d8862a'], [1, '#a85a1a']]),
    lin(`${ID}-syrup`, 0, 0, 0, 1, [[0, '#c86a1a'], [1, '#8a3a0a']]),
  ];

  // a lemon wedge: a slice of a circle with segments
  const LC = { x: 378, y: 74 };
  const art = G({},
    '\n<!-- the badge: a cast-iron frying pan with a long handle, sprinkled with sugar -->\n',
    bg.art,
    '\n<!-- motion arcs: the pancake has just been flipped out of the pan -->\n',
    path('M120 330q-20 -60 10 -110M352 320q24 -50 4 -100', { fill: 'none', stroke: '#ffffff', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-dasharray': '2 16', opacity: 0.9 }),
    sparkle(96, 120, 12, '#ffffff'), sparkle(456, 220, 9, '#ffffff'),
    '\n<!-- the pancake and the lemon: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    G({ transform: T },
      path(edge, { fill: u('edge') }),
      path(disc, { fill: u('pancake') }),
      path(`M${PC.x - 90} ${PC.y - 22}a10 6 0 1 0 20 0a10 6 0 1 0 -20 0zM${PC.x + 60} ${PC.y + 24}a12 7 0 1 0 24 0a12 7 0 1 0 -24 0zM${PC.x - 40} ${PC.y + 34}a8 5 0 1 0 16 0a8 5 0 1 0 -16 0zM${PC.x + 80} ${PC.y - 28}a9 5 0 1 0 18 0a9 5 0 1 0 -18 0z`, { fill: '#e0a048' }),
      path(syrup, { fill: u('syrup') }),
      path(`M${PC.x - 80} ${PC.y - 30}q40 -24 90 -26`, { fill: 'none', stroke: '#fff6d0', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.7 })),
    // the butter pat, melting
    G({ transform: 'translate(-4 -22)' },
      path('M222 120l40 -10l26 18l-38 12z', { fill: '#fff2a0' }), path('M222 120l28 20v8l-28 -18z', { fill: '#f0d870' }), path('M250 140l38 -12v6l-38 14z', { fill: '#ffe680' }),
      path('M236 146q-6 16 4 20q8 -8 2 -20', { fill: '#fff2a0' })),
    face(200, 176, 56, 24, 'joy', { ink: '#5a2a00', cheek: '#ff8a5a' }),
    // the lemon wedge
    path(lemon, { fill: '#ffd21a' }), circle(L.x, L.y, L.r - 7, { fill: '#fff6a8' }),
    path(Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI * 2; return `M${L.x} ${L.y}L${f(L.x + Math.cos(a) * (L.r - 8))} ${f(L.y + Math.sin(a) * (L.r - 8))}`; }).join(''), { fill: 'none', stroke: '#ffd21a', 'stroke-width': 3 }),
    circle(L.x, L.y, 4, { fill: '#fff6d8' }),
  );
  return stickerDoc(ID, 'Pancake Day sticker: a delighted pancake with a melting pat of butter and drips of syrup flips high out of a cast-iron frying pan, a wedge of lemon spinning beside it; the pan is the badge, sprinkled with sugar', defs, sil, art);
}
