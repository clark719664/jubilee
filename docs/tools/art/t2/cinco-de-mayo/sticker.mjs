// Cinco de Mayo sticker ("Fiesta"): a happy star piñata with seven striped tissue-paper cones and swinging
// streamers bursts out of a papel picado flag, the cut-paper banner of every fiesta, hot pink with cut-out flowers,
// hanging from its string. The piñata's cones and streamers break out of the flag.
import { f, P, E, G, path, circle, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, roundPoly, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'cinco-de-mayo-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#3a0a2a';
const RAINBOW = ['#e8243a', '#ff8a1a', '#ffd23a', '#2ab86a', '#2a8ad8', '#8a4ad8', '#ff5aa8'];

export function sticker() {
  setPrecision(10);
  // ---- badge: a papel picado flag with a zigzag bottom edge
  // the outline: top-left, top-right, down the right side, a zigzag back along the bottom, up the left side
  const pts = [[66, 96], [446, 96], [446, 400]];
  for (let k = 1; k < 12; k++) pts.push([446 - k * (380 / 12), k % 2 ? 436 : 404]);
  pts.push([66, 400]);
  const bd = roundPoly(pts, pts.map((_, i) => (i < 3 || i === pts.length - 1 ? 14 : 3)));
  const B = { cx: 256, cy: 250, r: 230 };
  const inside = path('M66 120h380', { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-dasharray': '4 8', opacity: 0.7 });
  const bg = badge(ID, { d: bd, cx: 256, cy: 250, c1: '#ff6ab8', c2: '#c81a7a', tile: tiled(ID, B, 52, [MARKS.flower(13), MARKS.diamond(7), MARKS.dot(4)]), patternFill: '#7a0a4a', patternOpacity: 0.55, ink: '#5a0a3a', stitch: '#ffffff', inside, inset: 0.86 });
  const string = 'M24 90Q256 70 488 90';

  // ---- the star piñata
  const S = { x: 256, y: 262, r: 64 };
  const cones = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 - Math.PI / 2, c = Math.cos(a), s = Math.sin(a), L = 150;
    cones.push(roundPoly([[S.x + c * (S.r - 8) - s * 26, S.y + s * (S.r - 8) + c * 26], [S.x + c * L, S.y + s * L], [S.x + c * (S.r - 8) + s * 26, S.y + s * (S.r - 8) - c * 26]], [4, 10, 4]));
  }
  const tips = Array.from({ length: 7 }, (_, k) => { const a = (k / 7) * Math.PI * 2 - Math.PI / 2; return [S.x + Math.cos(a) * 152, S.y + Math.sin(a) * 152]; });
  const ball = `M${S.x - S.r} ${S.y}a${S.r} ${S.r} 0 1 0 ${2 * S.r} 0a${S.r} ${S.r} 0 1 0 ${-2 * S.r} 0Z`;
  // streamers from the three lower cones
  const streamers = [3, 4].map((k) => { const [x, y] = tips[k]; return `M${P(x, y)}q-10 20 6 34q14 14 0 30`; }).join('');

  const heroSil = [...cones.map((d) => path(d)), path(ball), ...tips.map(([x, y]) => circle(x, y, 13))].join('');
  const sil = [bg.sil, path(string, { fill: 'none', stroke: '#000', 'stroke-width': 4 }), heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-ball`, 0.4, 0.35, 0.75, [[0, '#fff2a0'], [0.6, '#ffd23a'], [1, '#e8a010']]),
    ...cones.map((d, k) => E('clipPath', { id: `${ID}-c${k}` }, path(d))),
  ];

  // each cone striped in two rainbow colours, like crêpe-paper bands
  const coneArt = cones.map((d, k) => {
    const a = (k / 7) * Math.PI * 2 - Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    let bands = '';
    for (let j = 0; j < 5; j++) { const t = S.r + j * 18; bands += `M${P(S.x + c * t - s * 60, S.y + s * t + c * 60)}L${P(S.x + c * (t + 9) - s * 60, S.y + s * (t + 9) + c * 60)}L${P(S.x + c * (t + 9) + s * 60, S.y + s * (t + 9) - c * 60)}L${P(S.x + c * t + s * 60, S.y + s * t - c * 60)}Z`; }
    return path(d, { fill: RAINBOW[k] }) + G({ 'clip-path': `url(#${ID}-c${k})` }, path(bands, { fill: RAINBOW[(k + 3) % 7], opacity: 0.85 }));
  }).join('');

  const art = G({},
    '\n<!-- the badge: a hot-pink papel picado flag with cut-out flowers, hanging from its string -->\n',
    path(string, { fill: 'none', stroke: '#ffffff', 'stroke-width': 4 }),
    bg.art,
    sparkle(96, 150, 10, '#ffffff'), sparkle(420, 360, 9, '#ffe9a3'),
    '\n<!-- the piñata: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    coneArt,
    path(streamers, { fill: 'none', stroke: '#2ab86a', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    ...tips.map(([x, y], k) => circle(x, y, 13, { fill: RAINBOW[(k + 2) % 7] }) + circle(x - 4, y - 4, 4, { fill: '#ffffff', opacity: 0.7 })),
    path(ball, { fill: u('ball') }),
    path(`M${S.x - 50} ${S.y - 40}q20 -20 50 -22`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.7 }),
    face(S.x, S.y - 4, 50, 22, 'joy', { ink: INK, cheek: '#ff7a8a' }),
  );
  return stickerDoc(ID, 'Cinco de Mayo sticker: a happy star piñata with seven striped tissue-paper cones and swinging streamers bursts out of a hot-pink papel picado flag with cut-out flowers, hanging from its string', defs, sil, art);
}
