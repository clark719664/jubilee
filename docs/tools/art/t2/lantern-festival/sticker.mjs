// Lantern Festival sticker: a round red lantern with a happy face glows in front of the first full moon of the
// lunar year, a riddle slip and a gold tassel swinging under it, and a bowl of sweet tangyuan in the corner. The
// badge is the moon itself, warm cream with soft craters and tiny gold sparkles; the lantern's cap and tassel and
// the bowl break out of it.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, circleD, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'lantern-festival-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#4a0a10';

export function sticker() {
  setPrecision(10);
  const M = { cx: 256, cy: 250, r: 206 };
  const bd = circleD(M.cx, M.cy, M.r);
  const inside = [
    path(`M140 150a26 18 0 1 0 52 0a26 18 0 1 0 -52 0zM352 330a34 22 0 1 0 68 0a34 22 0 1 0 -68 0zM110 300a16 11 0 1 0 32 0a16 11 0 1 0 -32 0zM380 160a14 10 0 1 0 28 0a14 10 0 1 0 -28 0z`, { fill: '#f0d8a0', opacity: 0.7 }),
  ].join('');
  const bg = badge(ID, { d: bd, cx: M.cx, cy: M.cy, c1: '#fff6d8', c2: '#ffd88a', tile: tiled(ID, { cx: 256, cy: 250, r: 220 }, 46, [MARKS.twinkle(6), MARKS.dot(2.4)]), patternFill: '#e8a020', patternOpacity: 0.5, ink: '#a8641a', stitch: '#c8862a', stitchOpacity: 0.6, inside, inset: 0.88 });

  // ---- the lantern
  const L = { x: 248, y: 250, rx: 124, ry: 104 };
  const cap = `M${L.x - 52} ${L.y - L.ry - 4}h104v-24h-104zM${L.x - 6} ${L.y - L.ry - 28}v-34h12v34z`;
  const hook = `M${L.x - 14} ${L.y - L.ry - 62}a14 14 0 1 0 28 0a14 14 0 1 0 -28 0Z`;
  const body = `M${L.x - L.rx} ${L.y}a${L.rx} ${L.ry} 0 1 0 ${2 * L.rx} 0a${L.rx} ${L.ry} 0 1 0 ${-2 * L.rx} 0Z`;
  const bottom = `M${L.x - 52} ${L.y + L.ry + 4}h104v22h-104z`;
  const slip = `M${L.x - 22} ${L.y + L.ry + 26}h44v84l-22 -12l-22 12z`;
  const tassel = `M${L.x + 34} ${L.y + L.ry + 26}h20l8 80h-36z`;
  // ---- the bowl of tangyuan, bottom right
  const bowl = 'M330 410a70 20 0 0 0 140 0q-6 56 -70 60q-64 -4 -70 -60Z';

  const heroSil = [cap, hook, body, bottom, slip, tassel, bowl].map((d) => path(d)).join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-red`, 0.4, 0.35, 0.75, [[0, '#ff9a6a'], [0.45, '#f0283a'], [1, '#a80a1e']]),
    lin(`${ID}-gold`, 0, 0, 0, 1, [[0, '#ffe680'], [1, '#d8941a']]),
    rad(`${ID}-glow`, 0.5, 0.5, 0.5, [[0, '#ffb070', 0.6], [1, '#ffb070', 0]]),
    lin(`${ID}-bowl`, 0, 0, 0, 1, [[0, '#ffffff'], [1, '#d8e4f0']]),
    E('clipPath', { id: `${ID}-bc` }, path(body)),
  ];

  const art = G({},
    '\n<!-- the badge: the first full moon of the lunar year, warm cream with soft craters -->\n',
    bg.art,
    circle(L.x, L.y, 170, { fill: u('glow') }),
    sparkle(84, 110, 12, '#ffffff'), sparkle(430, 96, 10, '#ffffff'), sparkle(96, 380, 8, '#ffe9a3'),
    '\n<!-- the lantern and the bowl: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(hook, { fill: 'none', stroke: u('gold'), 'stroke-width': 7 }),
    path(cap, { fill: u('gold') }),
    path(body, { fill: u('red') }),
    G({ 'clip-path': u('bc') },
      path(`M${L.x - 80} ${L.y - L.ry}q-50 ${L.ry} 0 ${2 * L.ry}M${L.x - 30} ${L.y - L.ry}q-18 ${L.ry} 0 ${2 * L.ry}M${L.x + 30} ${L.y - L.ry}q18 ${L.ry} 0 ${2 * L.ry}M${L.x + 80} ${L.y - L.ry}q50 ${L.ry} 0 ${2 * L.ry}`, { fill: 'none', stroke: '#b8101e', 'stroke-width': 5 }),
      path(`M${L.x - 90} ${L.y - 60}q30 -30 70 -36`, { fill: 'none', stroke: '#ffc0a0', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.7 })),
    face(L.x, L.y - 4, 74, 32, 'sing', { ink: '#4a0a10', cheek: '#ffb0a0', mouth: '#5a0a10' }),
    path(bottom, { fill: u('gold') }),
    path(slip, { fill: '#fff4dc' }), path(`M${L.x - 8} ${L.y + L.ry + 40}v40M${L.x + 8} ${L.y + L.ry + 40}v26`, { fill: 'none', stroke: '#c8102e', 'stroke-width': 4, 'stroke-linecap': 'round' }),
    path(tassel, { fill: u('gold') }), path(`M${L.x + 38} ${L.y + L.ry + 40}l2 60M${L.x + 46} ${L.y + L.ry + 40}l2 62M${L.x + 54} ${L.y + L.ry + 40}l4 60`, { fill: 'none', stroke: '#c8861a', 'stroke-width': 2 }),
    // the bowl of tangyuan
    path(bowl, { fill: u('bowl') }),
    ellipse(400, 410, 70, 20, { fill: '#f6e6d8' }),
    circle(372, 404, 15, { fill: '#ffffff' }), circle(404, 400, 15, { fill: '#ffd0dc' }), circle(434, 408, 14, { fill: '#ffffff' }),
    path('M366 398a5 3 0 0 1 10 -2M398 394a5 3 0 0 1 10 -2', { fill: 'none', stroke: '#ffffff', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    path('M340 432q60 20 120 0', { fill: 'none', stroke: '#2a8ad8', 'stroke-width': 4 }),
  );
  return stickerDoc(ID, 'Lantern Festival sticker: a round red lantern with a singing face glows in front of the first full moon of the lunar year, a riddle slip and a gold tassel swinging under it, a bowl of tangyuan in the corner; the badge is the cream full moon with soft craters', defs, sil, art);
}
