// Canada Day sticker ("Maple Leaf"): a cheerful beaver in a red-and-white toque, buck teeth and all, waves a little
// Canadian flag, its flat tail swishing out behind. The badge is a big red maple leaf scattered with tiny white
// leaves. The beaver's tail and the flag break out of the leaf.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, roundPoly, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';
import { mapleD } from './scene.mjs';

const ID = 'canada-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#3a1a0a';
const RED = '#d62828';

export function sticker() {
  setPrecision(10);
  // ---- badge: a big maple leaf with softened points
  const raw = mapleD(256, 262, 230);
  const pts = [...raw.matchAll(/[ML]([-\d.]+) ([-\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const bd = roundPoly(pts, 10);
  const B = { cx: 256, cy: 262, r: 230 };
  const bg = badge(ID, { d: bd, cx: 256, cy: 262, c1: '#ff4a4a', c2: '#a8101e', tile: tiled(ID, B, 52, [mapleD(0, 0, 9), mapleD(0, 0, 5)]), patternFill: '#ffffff', patternOpacity: 0.35, ink: '#5a0a12', inset: 0.84 });

  // ---- the beaver, sitting up
  const X = 236, Y = 300;
  const tail = `M${X + 50} ${Y + 90}C${X + 120} ${Y + 80} ${X + 190} ${Y + 110} ${X + 214} ${Y + 150}C${X + 190} ${Y + 176} ${X + 110} ${Y + 170} ${X + 50} ${Y + 130}Z`;
  const body = `M${X - 80} ${Y + 60}C${X - 84} ${Y - 10} ${X - 40} ${Y - 40} ${X} ${Y - 40}C${X + 40} ${Y - 40} ${X + 84} ${Y - 10} ${X + 80} ${Y + 60}C${X + 76} ${Y + 130} ${X + 40} ${Y + 150} ${X} ${Y + 150}C${X - 40} ${Y + 150} ${X - 76} ${Y + 130} ${X - 80} ${Y + 60}Z`;
  const head = `M${X - 70} ${Y - 70}a70 62 0 1 0 140 0a70 62 0 1 0 -140 0Z`;
  const ears = `M${X - 70} ${Y - 106}a16 16 0 1 0 32 0a16 16 0 1 0 -32 0ZM${X + 38} ${Y - 106}a16 16 0 1 0 32 0a16 16 0 1 0 -32 0Z`;
  const toque = `M${X - 66} ${Y - 92}C${X - 64} ${Y - 172} ${X + 64} ${Y - 172} ${X + 66} ${Y - 92}Z`;
  const pom = `M${X - 20} ${Y - 168}a20 20 0 1 0 40 0a20 20 0 1 0 -40 0Z`;
  const arm = `M${X + 54} ${Y + 10}C${X + 90} ${Y - 10} ${X + 110} ${Y - 50} ${X + 112} ${Y - 80}l20 4C${X + 130} ${Y - 40} ${X + 110} ${Y + 10} ${X + 64} ${Y + 40}Z`;
  const pole = `M${X + 118} ${Y - 70}V${Y - 210}h6V${Y - 70}Z`;
  const flag = `M${X + 124} ${Y - 210}h96v56h-96Z`;
  const feet = `M${X - 60} ${Y + 150}a26 12 0 1 0 52 0a26 12 0 1 0 -52 0ZM${X + 8} ${Y + 150}a26 12 0 1 0 52 0a26 12 0 1 0 -52 0Z`;

  const heroSil = [tail, body, feet, arm, pole, flag, head, ears, toque, pom].map((d) => path(d)).join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-fur`, 0.45, 0.35, 0.75, [[0, '#c88a52'], [1, '#8a5a2e']]),
    lin(`${ID}-tail`, 0, 0, 1, 0, [[0, '#6a4a3a'], [1, '#4a2e22']]),
    E('clipPath', { id: `${ID}-tc` }, path(tail)),
  ];

  let hatch = '';
  for (let x = X + 40; x < X + 230; x += 16) hatch += `M${x} ${Y + 70}l40 100M${x + 40} ${Y + 70}l-40 100`;

  const art = G({},
    '\n<!-- the badge: a big red maple leaf scattered with tiny white leaves -->\n',
    bg.art,
    sparkle(110, 150, 11, '#ffffff'), sparkle(420, 160, 9, '#ffffff'),
    '\n<!-- the beaver: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(tail, { fill: u('tail') }), G({ 'clip-path': u('tc') }, path(hatch, { fill: 'none', stroke: '#8a6a5a', 'stroke-width': 2.4, opacity: 0.7 })),
    path(body, { fill: u('fur') }),
    path(`M${X - 44} ${Y + 40}C${X - 44} ${Y - 4} ${X + 44} ${Y - 4} ${X + 44} ${Y + 40}C${X + 44} ${Y + 110} ${X - 44} ${Y + 110} ${X - 44} ${Y + 40}Z`, { fill: '#e8c08a' }),
    path(feet, { fill: '#5a3a22' }),
    path(pole, { fill: '#e8e0d0' }),
    path(flag, { fill: '#ffffff' }), path(`M${X + 124} ${Y - 210}h24v56h-24zM${X + 196} ${Y - 210}h24v56h-24z`, { fill: RED }), path(mapleD(X + 172, Y - 180, 18), { fill: RED }),
    path(arm, { fill: u('fur') }), circle(X + 121, Y - 74, 13, { fill: '#8a5a2e' }),
    path(ears, { fill: '#8a5a2e' }),
    path(head, { fill: u('fur') }),
    ellipse(X, Y - 40, 40, 28, { fill: '#e8c08a' }),
    ellipse(X, Y - 54, 13, 9, { fill: '#2a1a1a' }),
    path(`M${X - 13} ${Y - 40}h26v24h-26z`, { fill: '#ffffff' }), path(`M${X} ${Y - 40}v24`, { fill: 'none', stroke: '#d8d0c8', 'stroke-width': 2 }),
    face(X, Y - 82, 54, 22, 'happy', { ink: '#1a1010', cheek: '#ff9a8a', mouth: 'transparent', cheeks: true }).replace(/<path d="M[^"]*Q[^"]*" fill="none"[^>]*\/>$/, ''),
    path(`M${X - 44} ${Y - 48}l-30 -4M${X - 44} ${Y - 40}l-30 6M${X + 44} ${Y - 48}l30 -4M${X + 44} ${Y - 40}l30 6`, { fill: 'none', stroke: '#5a3a22', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    path(toque, { fill: RED }), path(`M${X - 68} ${Y - 98}h136v-20q-68 -10 -136 0z`, { fill: '#ffffff' }), path(`M${X - 46} ${Y - 132}h92`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 8 }),
    path(pom, { fill: '#ffffff' }),
  );
  return stickerDoc(ID, 'Canada Day sticker: a cheerful beaver in a red-and-white toque, buck teeth and all, waves a little Canadian flag, its flat tail swishing out behind, on a big red maple-leaf badge scattered with tiny white leaves', defs, sil, art);
}
