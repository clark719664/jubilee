// Groundhog Day sticker ("Shadow Spotter"): a wide-eyed groundhog pops out of his snowy burrow, paws up, and spots
// his own long shadow on the snow. The badge is an arched window of February sky: pale blue with tiny snowflakes,
// the sun peeking from behind a cloud in the top corner. The snow mound breaks out at the bottom.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, archD, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'groundhog-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#3a2210';

export function sticker() {
  setPrecision(10);
  const bd = archD(78, 44, 356, 400, 34);
  const B = { cx: 256, cy: 250, r: 230 };
  // the sun behind a cloud, top right, inside the arch
  let rays = '';
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, a1 = a - 0.1, a2 = a + 0.1; rays += `M${P(352 + Math.cos(a1) * 40, 150 + Math.sin(a1) * 40)}L${P(352 + Math.cos(a) * 62, 150 + Math.sin(a) * 62)}L${P(352 + Math.cos(a2) * 40, 150 + Math.sin(a2) * 40)}Z`; }
  const inside = [
    path(rays, { fill: '#ffd23a', opacity: 0.9 }),
    circle(352, 150, 36, { fill: `url(#${ID}-sun)` }),
    path('M262 196c-22 0 -28 -30 -4 -34c0 -24 34 -30 44 -10c14 -18 46 -10 44 14c22 -2 30 22 14 30z', { fill: '#ffffff' }),
  ].join('');
  const bg = badge(ID, { d: bd, cx: 256, cy: 244, c1: '#a8d8ff', c2: '#e8f6ff', tile: tiled(ID, B, 50, [MARKS.snowflake(10), MARKS.dot(3), MARKS.twinkle(5)]), patternFill: '#ffffff', patternOpacity: 0.75, ink: '#2a5a8a', inside, inset: 0.88 });

  // ---- the snow mound and the burrow hole, the shadow, the groundhog
  const mound = 'M40 470C40 410 120 366 256 362C392 366 472 410 472 470Q256 488 40 470Z';
  const hole = 'M196 392a60 18 0 1 0 120 0a60 18 0 1 0 -120 0Z';
  const shadow = 'M210 404C160 410 110 424 76 444C62 452 66 462 82 458C120 448 170 430 222 418Z';
  const G0 = { x: 256, y: 392 };
  const body = `M${G0.x - 52} ${G0.y + 4}C${G0.x - 60} ${G0.y - 60} ${G0.x - 44} ${G0.y - 104} ${G0.x} ${G0.y - 106}C${G0.x + 44} ${G0.y - 104} ${G0.x + 60} ${G0.y - 60} ${G0.x + 52} ${G0.y + 4}Z`;
  const hy = G0.y - 138;
  const headD = `M${G0.x - 54} ${hy}a54 48 0 1 0 108 0a54 48 0 1 0 -108 0Z`;
  const ears = `M${G0.x - 56} ${hy - 34}a15 15 0 1 0 30 0a15 15 0 1 0 -30 0ZM${G0.x + 26} ${hy - 34}a15 15 0 1 0 30 0a15 15 0 1 0 -30 0Z`;
  const armL = `M${G0.x - 44} ${G0.y - 48}q-34 -14 -40 -58`;
  const armR = `M${G0.x + 44} ${G0.y - 48}q34 -14 40 -58`;
  const paws = `M${G0.x - 96} ${G0.y - 108}a13 13 0 1 0 26 0a13 13 0 1 0 -26 0ZM${G0.x + 70} ${G0.y - 108}a13 13 0 1 0 26 0a13 13 0 1 0 -26 0Z`;

  const heroSil = [path(mound), path(body), path(headD), path(ears), path(armL, { fill: 'none', stroke: '#000', 'stroke-width': 20, 'stroke-linecap': 'round' }), path(armR, { fill: 'none', stroke: '#000', 'stroke-width': 20, 'stroke-linecap': 'round' }), path(paws)].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-sun`, 0.4, 0.35, 0.7, [[0, '#fffbe0'], [0.6, '#ffe066'], [1, '#ffc23a']]),
    lin(`${ID}-fur`, 0, 0, 0, 1, [[0, '#b07a42'], [1, '#7a4a22']]),
    lin(`${ID}-snow`, 0, 0, 0, 1, [[0, '#ffffff'], [1, '#d4e4f2']]),
  ];

  const art = G({},
    '\n<!-- the badge: an arched window of February sky with the sun peeking out from a cloud -->\n',
    bg.art,
    sparkle(124, 132, 12, '#ffffff'), sparkle(160, 92, 7, '#ffffff'),
    '\n<!-- the groundhog in his snowy burrow: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(mound, { fill: u('snow') }),
    path('M70 452Q256 430 442 452', { fill: 'none', stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round' }),
    path(shadow, { fill: '#6a88b8', opacity: 0.55 }),
    path(hole, { fill: '#4a2a14' }),
    path(body, { fill: u('fur') }),
    path(`M${G0.x - 30} ${G0.y + 4}C${G0.x - 34} ${G0.y - 40} ${G0.x - 22} ${G0.y - 66} ${G0.x} ${G0.y - 66}C${G0.x + 22} ${G0.y - 66} ${G0.x + 34} ${G0.y - 40} ${G0.x + 30} ${G0.y + 4}Z`, { fill: '#ecc898' }),
    path(armL, { fill: 'none', stroke: '#8b5a2b', 'stroke-width': 18, 'stroke-linecap': 'round' }), path(armR, { fill: 'none', stroke: '#8b5a2b', 'stroke-width': 18, 'stroke-linecap': 'round' }),
    path(paws, { fill: '#6a3a1a' }),
    path(ears, { fill: '#8b5a2b' }), circle(G0.x - 41, hy - 34, 7, { fill: '#d8a878' }), circle(G0.x + 41, hy - 34, 7, { fill: '#d8a878' }),
    path(headD, { fill: u('fur') }),
    ellipse(G0.x, hy + 18, 30, 22, { fill: '#ecc898' }),
    face(G0.x, hy - 6, 42, 22, 'gasp', { ink: '#2a1a10', cheek: '#ff9a8a', mouth: '#6a2020' }),
    ellipse(G0.x, hy + 8, 8, 6, { fill: '#3a2014' }),
    path(`M${G0.x - 7} ${hy + 30}h14v12h-14z`, { fill: '#ffffff' }), path(`M${G0.x} ${hy + 30}v12`, { fill: 'none', stroke: '#d8d0c8', 'stroke-width': 1.6 }),
    // the front lip of the burrow over his tummy
    path(`M196 392a60 18 0 0 0 120 0v8a60 18 0 0 1 -120 0z`, { fill: '#ffffff' }),
  );
  return stickerDoc(ID, 'Groundhog Day sticker: a wide-eyed groundhog with buck teeth pops out of his snowy burrow, paws up, spotting his long blue shadow on the snow, on an arched February-sky badge with tiny snowflakes and the sun peeking from behind a cloud', defs, sil, art);
}
