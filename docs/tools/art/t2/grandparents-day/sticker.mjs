// Grandparents Day sticker ("Big Hug"): a big, cosy hand-knitted red heart with a happy face, wearing a pair of
// round grandma-and-grandpa glasses, two wooden knitting needles poking out of its ball of yarn tail; it sits in an
// ornate gold oval picture frame — the kind on grandma's mantelpiece — with a warm sepia photo-backdrop. The needles
// and the yarn break out of the frame.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, heartD, MARKS, tiled, inkUnder, face, sparkle, capsule, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'grandparents-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#4a1a10';

/** A scalloped oval: a scallopD squashed vertically by k. */
function ovalScallop(cx, cy, r, n, k) {
  const pt = (a, m = 1) => [cx + Math.cos(a) * r * k * m, cy + Math.sin(a) * r * m];
  let d = `M${P(...pt(-Math.PI / 2))}`;
  for (let i = 1; i <= n; i++) {
    const a0 = -Math.PI / 2 + ((i - 1) / n) * Math.PI * 2, a1 = -Math.PI / 2 + (i / n) * Math.PI * 2;
    d += `Q${P(...pt((a0 + a1) / 2, 1.09))} ${P(...pt(a1))}`;
  }
  return d + 'Z';
}

export function sticker() {
  setPrecision(10);
  const C0 = { x: 256, y: 258 };
  const bd = ovalScallop(C0.x, C0.y, 200, 30, 0.86);
  const inside = [
    ellipse(C0.x, C0.y, 148, 178, { fill: `url(#${ID}-photo)` }),
    ellipse(C0.x, C0.y, 148, 178, { fill: 'none', stroke: '#8a5a1a', 'stroke-width': 5 }),
  ].join('');
  const B = { cx: C0.x, cy: C0.y, r: 230 };
  const bg = badge(ID, { d: bd, cx: C0.x, cy: C0.y, c1: '#ffe080', c2: '#c8901e', tile: tiled(ID, B, 36, [MARKS.flower(9), MARKS.dot(3)]), patternFill: '#8a5a1a', patternOpacity: 0.35, ink: '#6a3a0a', stitch: '#fff4c8', inside, inset: 0.92 });

  // ---- the knitted heart and its glasses
  const H = { x: 256, y: 266, w: 250 };
  const heart = heartD(H.x, H.y, H.w);
  const needles = capsule(330, 120, 80, 6, -60) + capsule(372, 140, 80, 6, -30);
  const knobs = 'M352 50a12 12 0 1 0 24 0a12 12 0 1 0 -24 0ZM420 92a12 12 0 1 0 24 0a12 12 0 1 0 -24 0Z';
  const yarn = 'M340 400a42 42 0 1 0 84 0a42 42 0 1 0 -84 0Z';
  const strand = 'M300 360C320 400 330 420 352 418';

  const heroSil = [path(needles), path(knobs), path(heart), path(yarn)].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-photo`, 0.5, 0.4, 0.75, [[0, '#fff0d8'], [1, '#e8c8a0']]),
    rad(`${ID}-knit`, 0.4, 0.35, 0.8, [[0, '#ff6a6a'], [0.6, '#e02a3a'], [1, '#a80a1e']]),
    lin(`${ID}-wood`, 0, 0, 1, 0, [[0, '#e8b878'], [1, '#a8743e']]),
    E('clipPath', { id: `${ID}-hc` }, path(heart)),
  ];

  // knit stitches: rows of little Vs inside the heart
  let knit = '';
  for (let y = H.y - 110; y < H.y + 130; y += 18) for (let x = H.x - 130 + ((y / 18) % 2) * 9; x < H.x + 130; x += 18) knit += `M${f(x)} ${f(y)}l6 9l6 -9`;

  const art = G({},
    '\n<!-- the badge: an ornate gold oval picture frame with a warm sepia backdrop -->\n',
    bg.art,
    sparkle(120, 120, 10, '#ffffff'), sparkle(410, 360, 8, '#ffffff'),
    '\n<!-- the knitted heart, its glasses, the needles and the yarn: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(needles, { fill: u('wood') }), path(knobs, { fill: '#2a8ab8' }),
    path(heart, { fill: u('knit') }),
    G({ 'clip-path': u('hc') }, path(knit, { fill: 'none', stroke: '#b81a2a', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.7 }),
      path('M170 170q30 -40 70 -36', { fill: 'none', stroke: '#ffb0a8', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.7 })),
    path(strand, { fill: 'none', stroke: '#e02a3a', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    path(yarn, { fill: u('knit') }), path('M352 384q30 -6 56 20M348 404q34 -8 62 18M356 424q26 -4 44 10', { fill: 'none', stroke: '#b81a2a', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    face(H.x, H.y - 4, 72, 26, 'happy', { ink: INK, cheek: '#ffb0a0' }),
    // the round glasses over the eyes
    circle(H.x - 36, H.y - 4, 28, { fill: '#ffffff', opacity: 0.25 }), circle(H.x + 36, H.y - 4, 28, { fill: '#ffffff', opacity: 0.25 }),
    circle(H.x - 36, H.y - 4, 28, { fill: 'none', stroke: '#c8901e', 'stroke-width': 6 }), circle(H.x + 36, H.y - 4, 28, { fill: 'none', stroke: '#c8901e', 'stroke-width': 6 }),
    path(`M${H.x - 8} ${H.y - 6}q8 -8 16 0M${H.x - 64} ${H.y - 10}l-24 -6M${H.x + 64} ${H.y - 10}l24 -6`, { fill: 'none', stroke: '#c8901e', 'stroke-width': 5, 'stroke-linecap': 'round' }),
  );
  return stickerDoc(ID, 'Grandparents Day sticker: a cosy hand-knitted red heart with a happy face, wearing round gold glasses, with knitting needles and a ball of yarn, in an ornate gold oval picture frame with a warm sepia backdrop', defs, sil, art);
}
