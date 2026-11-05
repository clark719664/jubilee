// Chuseok sticker ("Songpyeon Pals"): three half-moon songpyeon rice cakes, pink, white and green, with happy faces,
// snuggled on the bed of fresh pine needles they are steamed on, in front of a bright bojagi (Korean patchwork
// wrapping cloth) badge. A ripe persimmon breaks out of the top corner, the pine needles out of the bottom.
import { f, P, E, G, path, circle, ellipse, lin, rad, rng, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, roundPoly, starPts, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'chuseok-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#3a1a2a';

/** A half-moon songpyeon: a dome over a gently curved base, pinched seam along the top. */
const songD = (x, y, w, h) => `M${P(x - w, y)}C${P(x - w * 1.02, y - h * 1.32)} ${P(x + w * 1.02, y - h * 1.32)} ${P(x + w, y)}Q${P(x, y + h * 0.22)} ${P(x - w, y)}Z`;
const seamD = (x, y, w, h) => `M${P(x - w * 0.86, y - h * 0.22)}C${P(x - w * 0.82, y - h * 1.12)} ${P(x + w * 0.82, y - h * 1.12)} ${P(x + w * 0.86, y - h * 0.22)}`;

export function sticker() {
  setPrecision(10);
  const C0 = { x: 256, y: 252 };
  // the bojagi badge: a softly rounded square, tipped a little
  const sq = [[-180, -176], [180, -176], [180, 176], [-180, 176]].map(([x, y]) => {
    const a = (-4 * Math.PI) / 180;
    return [C0.x + x * Math.cos(a) - y * Math.sin(a), C0.y + x * Math.sin(a) + y * Math.cos(a)];
  });
  const bd = roundPoly(sq, 46);
  // patchwork: split the square into blocks, each its own color, with white seams
  const R = rng(17);
  const COLS = ['#ff7aa8', '#ffd040', '#3aaa8a', '#a86ad0', '#ff6a4a', '#5aa8e8', '#f4f0e0', '#8ac858'];
  const blocks = [];
  const split = (x0, y0, x1, y1, depth) => {
    const w = x1 - x0, h = y1 - y0;
    if (depth > 3 || (w < 120 && h < 120)) { blocks.push([x0, y0, x1, y1]); return; }
    if (w > h) { const m = x0 + w * (0.35 + R() * 0.3); split(x0, y0, m, y1, depth + 1); split(m, y0, x1, y1, depth + 1); }
    else { const m = y0 + h * (0.35 + R() * 0.3); split(x0, y0, x1, m, depth + 1); split(x0, m, x1, y1, depth + 1); }
  };
  split(40, 40, 472, 472, 0);
  const patches = blocks.map(([x0, y0, x1, y1], i) => path(`M${f(x0)} ${f(y0)}H${f(x1)}V${f(y1)}H${f(x0)}Z`, { fill: COLS[(i * 3 + 1) % COLS.length] })).join('');
  const seams = blocks.map(([x0, y0, x1, y1]) => `M${f(x0)} ${f(y0)}H${f(x1)}V${f(y1)}H${f(x0)}Z`).join('');
  const inside = [
    G({ transform: `rotate(-4 ${C0.x} ${C0.y})` }, patches, path(seams, { fill: 'none', stroke: '#ffffff', 'stroke-width': 5, 'stroke-dasharray': '9 6', opacity: 0.85 })),
  ].join('');
  const bg = badge(ID, { d: bd, cx: C0.x, cy: C0.y, c1: '#ffffff', c2: '#ffffff', ink: '#5a2a4a', stitch: '#ffffff', stitchOpacity: 0, inside, inset: 0.9 });

  // ---- the hero
  const bedD = `M64 442C72 414 150 404 256 404C362 404 440 414 448 442C448 464 362 472 256 472C150 472 64 464 64 442Z`;
  const W = { x: 118, y: 430, w: 86, h: 92 }, Gr = { x: 394, y: 430, w: 86, h: 92 }, Pk = { x: 256, y: 440, w: 132, h: 160 };
  const pers = 'M372 100C372 74 392 64 416 64C440 64 460 74 460 100C460 124 440 136 416 136C392 136 372 124 372 100Z';
  const calyx = roundPoly(starPts(416, 68, 34, 14, 4, -45), 8) + 'M411 62h10v-14h-10z' + 'M420 50C432 30 456 26 470 34C460 50 440 56 420 50Z';
  const heroSil = [bedD, songD(W.x, W.y, W.w, W.h), songD(Gr.x, Gr.y, Gr.w, Gr.h), songD(Pk.x, Pk.y, Pk.w, Pk.h), pers, calyx].map((d) => path(d)).join('');
  const sil = [bg.sil, heroSil].join('');

  // pine needles: little fans of strokes across the bed
  let needles = '';
  for (let k = 0; k < 17; k++) {
    const x = 80 + k * 22, y = 448 + (k % 2) * 8;
    for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) needles += `M${f(x)} ${f(y)}l${f(Math.sin(a) * 22)} ${f(-Math.cos(a) * 14)}`;
  }

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-pink`, 0.4, 0.3, 0.8, [[0, '#ffd8e4'], [0.6, '#ff9ab8'], [1, '#e8709a']]),
    rad(`${ID}-white`, 0.4, 0.3, 0.8, [[0, '#ffffff'], [0.7, '#f4efe4'], [1, '#d8d0c0']]),
    rad(`${ID}-green`, 0.4, 0.3, 0.8, [[0, '#e0f4c0'], [0.6, '#a8d878'], [1, '#78b050']]),
    rad(`${ID}-pers`, 0.38, 0.32, 0.75, [[0, '#ffb060'], [0.55, '#ff7a1a'], [1, '#d8501a']]),
    lin(`${ID}-bed`, 0, 0, 0, 1, [[0, '#4a9a4a'], [1, '#2a6a3a']]),
  ];

  const art = G({},
    '\n<!-- the badge: a bright bojagi patchwork cloth -->\n',
    bg.art,
    sparkle(92, 92, 12, '#ffffff'), sparkle(110, 300, 8, '#ffffff'),
    '\n<!-- three songpyeon on their pine-needle bed and a ripe persimmon: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(bedD, { fill: u('bed') }), path(needles, { fill: 'none', stroke: '#8ad08a', 'stroke-width': 2.6, 'stroke-linecap': 'round' }),
    path(pers, { fill: u('pers') }), path('M388 82q8 -14 22 -16', { fill: 'none', stroke: '#ffe0b0', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.8 }), path(calyx, { fill: '#7a7a2a' }), path('M424 47Q444 38 464 36', { fill: 'none', stroke: '#b8c860', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    ...[[W, 'white', '#c8bca8', 'shy'], [Gr, 'green', '#6a9a48', 'wink'], [Pk, 'pink', '#d8607a', 'joy']].map(([s, g, seam, expr]) => [
      path(songD(s.x, s.y, s.w, s.h), { fill: u(g), stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }),
      path(seamD(s.x, s.y, s.w, s.h), { fill: 'none', stroke: seam, 'stroke-width': s.w > 80 ? 4 : 3, 'stroke-dasharray': s.w > 80 ? '3 7' : '2 6', 'stroke-linecap': 'round' }),
      path(`M${P(s.x - s.w * 0.55, s.y - s.h * 0.62)}q${f(s.w * 0.2)} ${f(-s.h * 0.3)} ${f(s.w * 0.5)} ${f(-s.h * 0.34)}`, { fill: 'none', stroke: '#ffffff', 'stroke-width': s.w > 80 ? 9 : 6, 'stroke-linecap': 'round', opacity: 0.7 }),
      face(s.x, s.y - s.h * 0.32, s.w * 0.62, s.h * 0.24, expr, { ink: INK, cheek: '#ff7a9a' }),
    ].join('')),
  );
  return stickerDoc(ID, 'Chuseok sticker: three happy half-moon songpyeon rice cakes, pink, white and green, on their bed of pine needles, in front of a bright bojagi patchwork badge, with a ripe persimmon', defs, sil, art);
}
