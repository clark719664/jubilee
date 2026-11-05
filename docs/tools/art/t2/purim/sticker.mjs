// Purim sticker ("Noisemaker"): a happy hamantasch, the three-cornered Purim cookie with a plum-jam middle, spins a
// red grogger so hard it whirrs, on a round party splat in Purim purple scattered with confetti. The cookie's top
// corner and the grogger break out of the splat.
import { f, P, E, G, path, circle, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, blobD, roundPoly, capsule, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'purim-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#3a1a08';

export function sticker() {
  setPrecision(10);
  // ---- badge: a round party splat with a soft wobbly edge
  const bd = blobD(256, 262, 206, 7, 11, 0.07);
  const B = { cx: 256, cy: 220, r: 230 };
  const bg = badge(ID, { d: bd, cx: 256, cy: 230, c1: '#7a5af8', c2: '#3a1aa8', tile: tiled(ID, B, 44, [MARKS.diamond(6), MARKS.dot(3.4), MARKS.twinkle(5), MARKS.star(6)]), patternFill: '#ffd166', patternOpacity: 0.6, ink: '#1a0a5a', inset: 0.84 });

  // ---- the hamantasch: a rounded triangle with folded edges and a jam middle
  const cookie = roundPoly([[248, 52], [386, 318], [110, 318]], 34);
  const folds = roundPoly([[248, 122], [332, 282], [164, 282]], 20);
  const jam = roundPoly([[248, 132], [286, 200], [210, 200]], 10);
  const arm = capsule(372, 248, 34, 13, -48);
  const G0 = { x: 404, y: 188 };
  const handle = capsule(G0.x, G0.y + 30, 22, 7, 90);
  const ratchet = `M${G0.x - 6} ${G0.y - 8}h70v26h-70z`;

  const heroSil = [path(cookie), path(arm), path(handle), G({ transform: `rotate(-24 ${G0.x} ${G0.y})` }, path(ratchet))].join('');
  const DOWN = { transform: 'translate(0 40)' };              // the hero sits low in the splat
  const sil = [bg.sil, G(DOWN, heroSil)].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-dough`, 0.45, 0.4, 0.7, [[0, '#ffd890'], [0.6, '#f0b050'], [1, '#c87a2a']]),
    lin(`${ID}-fold`, 0, 0, 0, 1, [[0, '#f8c870'], [1, '#e09a40']]),
    rad(`${ID}-jam`, 0.4, 0.35, 0.7, [[0, '#c8408a'], [1, '#5a0a3a']]),
  ];

  const art = G({},
    '\n<!-- the badge: a round party splat in Purim purple with confetti -->\n',
    bg.art,
    sparkle(96, 150, 12, '#ffe9a3'), sparkle(150, 380, 8, '#ffffff'),
    '\n<!-- the hamantasch and its grogger: an ink outline traced from the silhouette, then the paint -->\n',
    G(DOWN,
    inkUnder(`${ID}-hero`, INK, 11),
    path(arm, { fill: '#e8a850' }),
    path(handle, { fill: '#8a5a3a' }),
    G({ transform: `rotate(-24 ${G0.x} ${G0.y})` },
      path(ratchet, { fill: '#e8343a' }),
      path(`M${G0.x + 6} ${G0.y - 8}h8v26h-8zM${G0.x + 26} ${G0.y - 8}h8v26h-8zM${G0.x + 46} ${G0.y - 8}h8v26h-8z`, { fill: '#ffd23a' })),
    circle(G0.x, G0.y + 6, 7, { fill: '#5a3a2a' }),
    path(`M${G0.x - 40} ${G0.y - 52}q30 -30 70 -16M${G0.x + 70} ${G0.y - 20}q20 22 6 50M${G0.x - 52} ${G0.y - 30}q4 -20 18 -30`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round' }),
    path(cookie, { fill: u('dough') }),
    path(folds, { fill: u('fold') }),
    path(jam, { fill: u('jam') }),
    path('M234 150q12 -8 22 0', { fill: 'none', stroke: '#ff9ad0', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8 }),
    path('M150 300q-10 -40 20 -90M346 300q8 -30 -8 -66', { fill: 'none', stroke: '#fff0c0', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.7 }),
    face(248, 238, 56, 26, 'joy', { ink: '#5a2a00', cheek: '#ff8a7a' })),
  );
  return stickerDoc(ID, 'Purim sticker: a happy hamantasch, the three-cornered Purim cookie with a plum-jam middle, spins a red grogger so hard it whirrs, on a round purple party-splat badge scattered with confetti', defs, sil, art);
}
