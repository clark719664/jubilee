// Three Kings Day sticker ("Crown Finder"): a proud golden crown with jewels and a happy face pops up out of the
// middle of a rosca de reyes (the ring-shaped Kings' bread with candied fruit and sugar paste), on a big rounded
// five-point star badge in night indigo with tiny gold stars: the guiding star. The rosca breaks out at the bottom.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, burstD, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'three-kings-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#3a1a08';

export function sticker() {
  setPrecision(10);
  // ---- badge: the guiding star
  const B = { cx: 256, cy: 262, r: 236 };
  const bd = burstD(B.cx, B.cy, 232, 128, 5, 26);
  const bg = badge(ID, { d: bd, cx: B.cx, cy: B.cy, c1: '#2a2a8a', c2: '#5a2a9a', tile: tiled(ID, B, 48, [MARKS.star(7), MARKS.twinkle(5), MARKS.dot(2.4)]), patternFill: '#ffd166', patternOpacity: 0.55, ink: '#120a3a', inset: 0.86 });

  // ---- the crown: a tall body with five points, a jewelled band at the bottom
  const crown = 'M166 312L162 196L198 226L214 150L240 212L256 120L272 212L298 150L314 226L350 196L346 312Z';
  const band = 'M160 296Q256 278 352 296V330Q256 312 160 330Z';
  const tips = [[162, 196, 11], [214, 150, 12], [256, 120, 13], [298, 150, 12], [350, 196, 11]];
  // ---- the rosca: an oval ring of bread; its front half is drawn over the crown
  const R = { cx: 256, cy: 370, rx: 176, ry: 64, hx: 96, hy: 26, hcy: 356 };
  const ring = `M${R.cx - R.rx} ${R.cy}a${R.rx} ${R.ry} 0 1 0 ${2 * R.rx} 0a${R.rx} ${R.ry} 0 1 0 ${-2 * R.rx} 0ZM${R.cx - R.hx} ${R.hcy}a${R.hx} ${R.hy} 0 1 0 ${2 * R.hx} 0a${R.hx} ${R.hy} 0 1 0 ${-2 * R.hx} 0Z`;
  const front = `M${R.cx - R.rx} ${R.cy}A${R.rx} ${R.ry} 0 0 0 ${R.cx + R.rx} ${R.cy}L${R.cx + R.hx} ${R.hcy}A${R.hx} ${R.hy} 0 0 1 ${R.cx - R.hx} ${R.hcy}Z`;
  const outer = `M${R.cx - R.rx} ${R.cy}a${R.rx} ${R.ry} 0 1 0 ${2 * R.rx} 0a${R.rx} ${R.ry} 0 1 0 ${-2 * R.rx} 0Z`;

  const CT = { transform: 'translate(0 36)' };           // the crown stands down inside the ring's hole
  const heroSil = [G(CT, path(crown), path(band), ...tips.map(([x, y, r]) => circle(x, y, r))), path(outer)].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    lin(`${ID}-gold`, 0, 0, 0, 1, [[0, '#ffe680'], [0.55, '#ffc21a'], [1, '#e08a00']]),
    lin(`${ID}-band`, 0, 0, 0, 1, [[0, '#ffd23a'], [1, '#c87a00']]),
    rad(`${ID}-bread`, 0.5, 0.35, 0.7, [[0, '#f0b060'], [0.7, '#c87a32'], [1, '#9a5220']]),
    lin(`${ID}-hole`, 0, 0, 0, 1, [[0, '#5a2a10'], [1, '#8a4a20']]),
  ];

  // candied fruit strips and sugar-paste stripes across the front of the ring
  const fruit = (x, y, a, col) => ellipse(x, y, 12, 5, { fill: col, transform: `rotate(${a} ${x} ${y})` });
  const paste = (x, y, a) => path(`M${f(x - 18)} ${f(y)}q18 -10 36 0v8q-18 -10 -36 0z`, { fill: '#fff4dc', transform: `rotate(${a} ${x} ${y})` });

  const art = G({},
    '\n<!-- the badge: the guiding star, night indigo with tiny gold stars -->\n',
    bg.art,
    sparkle(88, 150, 12, '#ffe9a3'), sparkle(430, 140, 10, '#ffe9a3'), sparkle(406, 260, 7, '#ffffff'),
    '\n<!-- the crown and the rosca: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 12),
    // the ring, with the hole (the crown stands in it)
    path(ring, { fill: u('bread'), 'fill-rule': 'evenodd' }),
    ellipse(R.cx, R.hcy, R.hx, R.hy, { fill: u('hole') }),
    // the crown
    G(CT,
    path(crown, { fill: u('gold') }),
    path('M184 214L188 292M330 214L326 292', { fill: 'none', stroke: '#fff2a8', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.7 }),
    ...tips.map(([x, y, r], i) => circle(x, y, r, { fill: i === 2 ? '#e8243a' : '#ffe680' })),
    circle(252, 116, 4, { fill: '#ffffff', opacity: 0.85 }),
    face(256, 246, 64, 28, 'proud', { ink: '#5a2a00', cheek: '#ff8a5a' }),
    path(band, { fill: u('band') }),
    ellipse(256, 308, 15, 11, { fill: '#e8243a' }), ellipse(206, 310, 10, 8, { fill: '#2a8ad8' }), ellipse(306, 310, 10, 8, { fill: '#2ab86a' }),
    circle(252, 304, 4, { fill: '#ffffff', opacity: 0.8 }), circle(203, 307, 3, { fill: '#ffffff', opacity: 0.8 }), circle(303, 307, 3, { fill: '#ffffff', opacity: 0.8 })),
    // the front half of the ring over the crown's foot, with its toppings
    path(front, { fill: u('bread') }),
    path(`M${R.cx - R.rx + 20} ${R.cy + 6}Q${R.cx} ${R.cy + 76} ${R.cx + R.rx - 20} ${R.cy + 6}`, { fill: 'none', stroke: '#7a3a12', 'stroke-width': 5, opacity: 0.35 }),
    paste(130, 392, 30), paste(220, 418, 6), paste(318, 414, -10), paste(396, 384, -32),
    fruit(170, 410, 20, '#e8243a'), fruit(268, 420, -4, '#2ab86a'), fruit(358, 404, -24, '#ffb800'), fruit(108, 368, 70, '#2ab86a'), fruit(404, 360, -70, '#e8243a'),
  );
  return stickerDoc(ID, 'Three Kings Day sticker: a proud golden crown with jewels and a happy face pops up out of the middle of a rosca de reyes decorated with candied fruit and sugar paste, on a rounded five-point star badge in night indigo with tiny gold stars', defs, sil, art);
}
