// Bastille Day sticker: a cheerful little Eiffel Tower wearing a red beret, with a happy face on its first platform,
// stands on a French cockade — the round blue, white and red rosette — while firework sparkles burst around its top.
// The badge is the cockade. The tower's spire and the sparkles break out of it.
import { f, P, E, G, path, circle, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, scallopD, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'bastille-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#1a1a3a';
const BLUE = '#1f3fa8', RED = '#e63946';

export function sticker() {
  setPrecision(10);
  // ---- badge: a cockade — a pleated outer ring of red, then white, then blue
  const C0 = { x: 256, y: 286 };
  const bd = scallopD(C0.x, C0.y, 170, 36, 0.55);
  const inside = [
    circle(C0.x, C0.y, 128, { fill: '#ffffff' }),
    circle(C0.x, C0.y, 78, { fill: `url(#${ID}-blue)` }),
    path(Array.from({ length: 36 }, (_, k) => { const a = (k / 36) * Math.PI * 2; return `M${P(C0.x + Math.cos(a) * 132, C0.y + Math.sin(a) * 132)}L${P(C0.x + Math.cos(a) * 172, C0.y + Math.sin(a) * 172)}`; }).join(''), { fill: 'none', stroke: '#a81a2a', 'stroke-width': 2, opacity: 0.5 }),
  ].join('');
  const bg = badge(ID, { d: bd, cx: C0.x, cy: C0.y, c1: '#ff5a64', c2: '#b81a2a', tile: tiled(ID, { cx: C0.x, cy: C0.y, r: 200 }, 40, [MARKS.dot(0.1)]), patternFill: '#ffffff', patternOpacity: 0, ink: '#5a0a14', stitch: '#ffffff', inside, inset: 0.9 });

  // ---- the tower
  const X = 256, BASE = 408, TOP = 62;
  const legs = `M${X - 110} ${BASE}C${X - 70} ${BASE - 80} ${X - 40} ${BASE - 200} ${X - 18} ${TOP + 90}H${X + 18}C${X + 40} ${BASE - 200} ${X + 70} ${BASE - 80} ${X + 110} ${BASE}H${X + 70}C${X + 50} ${BASE - 50} ${X + 30} ${BASE - 70} ${X} ${BASE - 70}C${X - 30} ${BASE - 70} ${X - 50} ${BASE - 50} ${X - 70} ${BASE}Z`;
  const spire = `M${X - 18} ${TOP + 92}L${X - 6} ${TOP + 10}h12L${X + 18} ${TOP + 92}ZM${X - 3} ${TOP + 12}V${TOP - 20}h6V${TOP + 12}Z`;
  const deck1 = `M${X - 90} ${BASE - 110}h180v22h-180Z`;
  const deck2 = `M${X - 44} ${BASE - 230}h88v16h-88Z`;
  const beret = `M${X - 32} ${TOP + 104}C${X - 50} ${TOP + 72} ${X + 50} ${TOP + 66} ${X + 34} ${TOP + 100}Z`;

  const heroSil = [legs, spire, deck1, deck2, beret].map((d) => path(d)).join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-blue`, 0.4, 0.35, 0.75, [[0, '#5a7ae8'], [1, BLUE]]),
    lin(`${ID}-iron`, 0, 0, 1, 0, [[0, '#a8643a'], [0.5, '#d8945a'], [1, '#a8643a']]),
  ];

  let lattice = '';
  for (let y = BASE - 20; y > TOP + 100; y -= 26) { const t = (BASE - y) / (BASE - TOP), w = 100 - t * 86; lattice += `M${f(X - w)} ${y}L${f(X + w * 0.5)} ${y - 26}M${f(X + w)} ${y}L${f(X - w * 0.5)} ${y - 26}`; }

  const art = G({},
    '\n<!-- the badge: a French cockade of red, white and blue -->\n',
    bg.art,
    sparkle(110, 120, 14, '#ffd166'), sparkle(410, 110, 12, '#ffffff'), sparkle(430, 200, 8, '#7cc4ff'), sparkle(84, 230, 8, '#ff8a9a'),
    path('M140 70l-12 -16M150 100l-20 -4M376 72l12 -16M366 100l20 -4', { fill: 'none', stroke: '#ffd166', 'stroke-width': 4, 'stroke-linecap': 'round' }),
    '\n<!-- the tower: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(legs, { fill: u('iron') }),
    path(lattice, { fill: 'none', stroke: '#7a4422', 'stroke-width': 2.4, opacity: 0.7 }),
    path(spire, { fill: u('iron') }),
    path(deck1, { fill: '#8a4e2a' }), path(deck2, { fill: '#8a4e2a' }),
    path(beret, { fill: RED }), circle(X + 2, TOP + 74, 5, { fill: RED }),
    face(X, BASE - 150, 48, 20, 'joy', { ink: INK, cheek: '#ff9a8a' }),
  );
  return stickerDoc(ID, 'Bastille Day sticker: a cheerful little Eiffel Tower wearing a red beret, with a happy face, stands on a red, white and blue French cockade while firework sparkles burst around its top', defs, sil, art);
}
