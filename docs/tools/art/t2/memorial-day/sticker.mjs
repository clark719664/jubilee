// Memorial Day sticker ("Poppy"): a big red remembrance poppy with a gentle, thankful face, two green leaves and a
// little flag tucked beside its stem, on a rosette badge — a round star-spangled medallion in deep blue with a
// ruffled ribbon edge and two tails, the kind pinned on for a day of remembering. The poppy breaks out of it.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, scallopD, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'memorial-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#2a0a14';
const RED = '#d8243a', BLUE = '#1a2a6a';

export function sticker() {
  setPrecision(10);
  // ---- badge: a rosette (a ruffled disc) with two ribbon tails behind
  const bd = scallopD(256, 230, 178, 30, 0.6);
  const tails = 'M196 360L156 466L198 448L222 474L246 380ZM316 360L356 466L314 448L290 474L266 380Z';
  const B = { cx: 256, cy: 230, r: 200 };
  const inside = [circle(256, 230, 140, { fill: 'none', stroke: '#ffffff', 'stroke-width': 4, opacity: 0.5 })].join('');
  const bg = badge(ID, { d: bd, cx: 256, cy: 230, c1: '#3a5ac8', c2: BLUE, tile: tiled(ID, B, 40, [MARKS.star(8), MARKS.star(5)]), patternFill: '#ffffff', patternOpacity: 0.55, ink: '#0a1240', inside, inset: 0.86 });

  // ---- the poppy: four round petals, a dark center, a stem with leaves, a little flag
  const C0 = { x: 256, y: 222 };
  const petal = (a, r) => `M${P(C0.x + Math.cos(a) * r * 0.66 - r, C0.y + Math.sin(a) * r * 0.66)}a${f(r)} ${f(r * 0.9)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r * 0.9)} 0 1 0 ${f(-2 * r)} 0Z`;
  const petals = [-Math.PI / 4, Math.PI / 4, (3 * Math.PI) / 4, (-3 * Math.PI) / 4].map((a) => petal(a, 74)).join('');
  // the creases between the petals
  const creases = [0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a) => `M${P(C0.x + Math.cos(a) * 44, C0.y + Math.sin(a) * 44)}L${P(C0.x + Math.cos(a) * 84, C0.y + Math.sin(a) * 84)}`).join('');
  const stem = 'M250 300q-6 76 2 160h12q-8 -84 -2 -160z';
  const leafL = 'M252 400c-40 -6 -72 -36 -76 -70c34 4 66 30 76 70z';
  const leafR = 'M264 432c40 -4 70 -30 76 -64c-34 2 -64 26 -76 64z';
  const flag = 'M384 300v-150h6v150zM390 150h66v44h-66z';

  const heroSil = [path(stem), path(leafL), path(leafR), path(flag), path(petals)].join('');
  const sil = [path(tails), bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-petal`, 0.42, 0.38, 0.7, [[0, '#ff6a6a'], [0.6, RED], [1, '#9a0a1e']]),
    lin(`${ID}-tail`, 0, 0, 0, 1, [[0, '#3a5ac8'], [1, BLUE]]),
  ];

  let stripes = '';
  for (let k = 0; k < 4; k++) stripes += `M390 ${150 + k * 11}h66v5.5h-66z`;

  const art = G({},
    '\n<!-- the rosette: two ribbon tails, then the star-spangled medallion -->\n',
    path(tails, { fill: u('tail') }), path('M200 372l-30 80M312 372l30 80', { fill: 'none', stroke: '#ffffff', 'stroke-width': 4, opacity: 0.5 }),
    bg.art,
    sparkle(90, 110, 11, '#ffffff'), sparkle(430, 120, 9, '#ffffff'),
    '\n<!-- the poppy, its leaves and the little flag: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(stem, { fill: '#3a8a3a' }), path(leafL, { fill: '#4aa84a' }), path(leafR, { fill: '#4aa84a' }),
    path('M244 386c-24 -10 -42 -28 -50 -46M272 420c22 -8 40 -24 50 -42', { fill: 'none', stroke: '#2a6a2a', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    path('M384 300v-150h6v150z', { fill: '#e8e0d0' }),
    path('M390 150h66v44h-66z', { fill: '#ffffff' }), path(stripes, { fill: RED }), path('M390 150h28v23h-28z', { fill: BLUE }),
    path(petals, { fill: u('petal') }),
    path(creases, { fill: 'none', stroke: '#8a0a1a', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 }),
    path('M190 160q24 -30 60 -26M330 180q14 26 4 54', { fill: 'none', stroke: '#ffb0a0', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.7 }),
    circle(C0.x, C0.y, 44, { fill: '#2a1a1a' }),
    path(Array.from({ length: 10 }, (_, k) => { const a = (k / 10) * Math.PI * 2; return `M${P(C0.x + Math.cos(a) * 40, C0.y + Math.sin(a) * 40)}a4 4 0 1 0 0.1 0`; }).join(''), { fill: '#4a3a2a' }),
    face(C0.x, C0.y - 4, 34, 15, 'proud', { ink: '#fff4e0', cheek: '#ff7a8a' }),
  );
  return stickerDoc(ID, 'Memorial Day sticker: a big red remembrance poppy with a gentle, thankful face, green leaves and a little flag beside its stem, on a deep-blue star-spangled rosette with a ruffled edge and two ribbon tails', defs, sil, art);
}
