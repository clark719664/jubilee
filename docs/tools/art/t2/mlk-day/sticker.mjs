// MLK Day sticker ("Dream Big"): a white dove with an olive branch in its beak flies out of a dream cloud with a
// rainbow across it, two little hearts trailing behind. The cloud is the badge: sky blue warming to dawn peach,
// with tiny hearts and twinkles. The dove's wing and branch break out of the cloud.
import { f, P, E, G, path, circle, lin, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, heartD, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'mlk-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#1e2a4a';

/** A cloud: n round bumps on an ellipse. */
function cloudD(cx, cy, rx, ry, n, puff = 0.64) {
  const pts = Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
  let d = `M${P(...pts[0])}`;
  for (let i = 1; i <= n; i++) { const [a, b] = [pts[i - 1], pts[i % n]]; const rb = Math.hypot(b[0] - a[0], b[1] - a[1]) * puff; d += `A${f(rb)} ${f(rb)} 0 0 1 ${P(...b)}`; }
  return d + 'Z';
}

export function sticker() {
  setPrecision(10);
  const B = { cx: 256, cy: 266, r: 230 };
  const bd = cloudD(256, 268, 186, 132, 10);
  // a rainbow arc inside the cloud
  const bands = ['#ff5a5a', '#ffa03a', '#ffd84a', '#5ac86a', '#4aa8f0', '#9a6ae8'];
  const inside = bands.map((c, i) => { const r = 196 - i * 16; return path(`M${256 - r} 420A${r} ${r} 0 0 1 ${256 + r} 420`, { fill: 'none', stroke: c, 'stroke-width': 16, opacity: 0.85 }); }).join('');
  const bg = badge(ID, { d: bd, cx: 256, cy: 268, c1: '#9adcff', c2: '#ffd6b0', tile: tiled(ID, B, 50, [heartD(0, 0, 12), MARKS.twinkle(6), MARKS.dot(3)]), patternFill: '#ffffff', patternOpacity: 0.6, ink: '#2a4a8a', inside, inset: 0.88 });

  // ---- the dove, flying left: the same shapes as the scene's mural dove, scaled up
  const T = 'translate(266 292) scale(1.8)';
  const farWing = 'M-6 4C14 -40 46 -58 72 -54C52 -40 40 -20 30 0Z';
  const body = 'M-58 0C-46 -12 -26 -14 -8 -10C20 -6 46 0 66 14L84 8L78 24C50 34 0 32 -30 18C-42 12 -52 8 -58 0Z';
  const headD = 'M-48 -2c-6 -12 0 -22 12 -22c10 0 14 8 14 14z';
  const nearWing = 'M-14 -4C-6 -54 22 -80 54 -84C42 -62 34 -38 26 -6Z';
  const beak = 'M-47 -14l-13 4l13 3z';
  const branch = 'M-58 -10q-16 -6 -28 6M-72 -8q2 -10 10 -12M-80 -2q-6 -6 -12 2';
  const leaves = 'M-72 -8c-8 -6 -13 0 -13 5c8 0 10 -2 13 -5zM-82 -2c-8 2 -8 10 -3 13c5 -5 5 -8 3 -13zM-64 -16c-2 -8 4 -12 9 -10c-2 6 -5 9 -9 10z';
  const hearts = heartD(414, 380, 30) + heartD(452, 340, 20);

  const heroSil = [G({ transform: T }, path(farWing), path(body), path(headD), path(nearWing), path(beak), path(branch, { fill: 'none', stroke: '#000', 'stroke-width': 4 }), path(leaves)), path(hearts)].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    lin(`${ID}-dove`, 0, 0, 0, 1, [[0, '#ffffff'], [1, '#e2e8f4']]),
    lin(`${ID}-wing`, 0, 0, 1, 1, [[0, '#ffffff'], [1, '#d4dcee']]),
  ];

  const art = G({},
    '\n<!-- the badge: a dream cloud, sky blue warming to dawn peach, with a rainbow and tiny hearts -->\n',
    bg.art,
    sparkle(100, 150, 12, '#ffffff'), sparkle(420, 170, 9, '#ffffff'), sparkle(128, 392, 8, '#fff3c4'),
    '\n<!-- the dove: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(hearts, { fill: '#ff4d6d' }),
    path('M406 370q5 -7 12 -4', { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
    G({ transform: T },
      path(farWing, { fill: '#c8d2e6' }),
      path(body, { fill: u('dove') }),
      path('M-30 16C0 26 40 26 70 14', { fill: 'none', stroke: '#d0d8ea', 'stroke-width': 2, 'stroke-linecap': 'round' }),
      path(headD, { fill: '#ffffff' }),
      path(nearWing, { fill: u('wing') }),
      path('M2 -30q14 -26 34 -40M8 -14q14 -22 30 -32', { fill: 'none', stroke: '#c8d2e6', 'stroke-width': 2, 'stroke-linecap': 'round' }),
      path(beak, { fill: '#ffb84a' }),
      path(branch, { fill: 'none', stroke: '#3a7a3a', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
      path(leaves, { fill: '#5ab84a' })),
    face(203, 272, 18, 9, 'happy', { ink: '#2a2a4a', cheek: '#ff9db0', cheeks: false }),
    circle(196, 279, 4, { fill: '#ffb0c0', opacity: 0.8 }),
  );
  return stickerDoc(ID, 'MLK Day sticker: a white dove with an olive branch in its beak flies out of a dream cloud with a rainbow across it, two red hearts trailing behind, on a sky-blue to dawn-peach cloud badge with tiny hearts', defs, sil, art);
}
