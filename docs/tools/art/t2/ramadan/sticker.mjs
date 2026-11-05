// Ramadan sticker ("Crescent Spotter"): a glowing fanous lantern with a cheeky face, its colored glass panels lit
// from inside, hangs beside a golden crescent moon, on an eight-pointed star badge (the star of Islamic art) in
// deep night teal with tiny gold stars. The moon and the lantern's ring break out of the star.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, burstD, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'ramadan-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#2a1a08';

export function sticker() {
  setPrecision(10);
  const B = { cx: 256, cy: 262, r: 232 };
  const bd = burstD(B.cx, B.cy, 234, 166, 8, 10, -90 + 22.5);
  const bg = badge(ID, { d: bd, cx: B.cx, cy: B.cy, c1: '#14607e', c2: '#06283d', tile: tiled(ID, B, 44, [MARKS.star(6), MARKS.dot(2.4), MARKS.twinkle(4)]), patternFill: '#ffd166', patternOpacity: 0.6, ink: '#03141f', inset: 0.86,
    inside: circle(272, 262, 150, { fill: `url(#${ID}-glow)` }) });

  // ---- the crescent moon, top left
  const moon = 'M150 70A84 84 0 1 0 214 214A66 66 0 1 1 150 70Z';
  // ---- the fanous lantern
  const X = 286;
  const ring = `M${X - 16} 104a16 16 0 1 0 32 0a16 16 0 1 0 -32 0Z`;
  const cap = `M${X - 52} 168Q${X - 46} 124 ${X} 118Q${X + 46} 124 ${X + 52} 168Z`;
  const band = `M${X - 62} 168H${X + 62}V190H${X - 62}Z`;
  const glass = `M${X - 62} 190L${X - 84} 270L${X - 62} 350H${X + 62}L${X + 84} 270L${X + 62} 190Z`;
  const foot = `M${X - 62} 350H${X + 62}V370H${X - 62}Z`;
  const point = `M${X - 50} 370L${X} 420L${X + 50} 370Z`;
  const drop = `M${X - 8} 424a8 8 0 1 0 16 0a8 8 0 1 0 -16 0Z`;

  const heroSil = [moon, ring, cap, band, glass, foot, point, drop].map((d) => path(d)).join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-glow`, 0.5, 0.5, 0.5, [[0, '#ffd98a', 0.75], [0.45, '#ffb84a', 0.3], [1, '#ffb84a', 0]]),
    lin(`${ID}-gold`, 0, 0, 0, 1, [[0, '#ffe680'], [1, '#c8861a']]),
    rad(`${ID}-glass`, 0.5, 0.45, 0.65, [[0, '#fff6c8'], [0.5, '#ffd23a'], [1, '#ff9a2a']]),
    lin(`${ID}-moon`, 0, 0, 1, 1, [[0, '#fff6c8'], [1, '#ffcf4a']]),
    E('clipPath', { id: `${ID}-gc` }, path(glass)),
  ];

  const art = G({},
    '\n<!-- the badge: an eight-pointed star in night teal with tiny gold stars and the lantern\'s glow -->\n',
    bg.art,
    sparkle(410, 128, 12, '#fff3c4'), sparkle(110, 360, 9, '#fff3c4'), sparkle(430, 400, 7, '#ffffff'),
    '\n<!-- the moon and the lantern: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(moon, { fill: u('moon') }),
    path('M108 110Q90 160 112 204', { fill: 'none', stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.6 }),
    path(ring, { fill: 'none', stroke: u('gold'), 'stroke-width': 8 }),
    path(cap, { fill: u('gold') }), path(`M${X - 30} 160Q${X - 26} 136 ${X} 132`, { fill: 'none', stroke: '#fff2b0', 'stroke-width': 4, 'stroke-linecap': 'round' }),
    path(band, { fill: '#d8961a' }),
    path(glass, { fill: u('glass') }),
    G({ 'clip-path': u('gc') },
      path(`M${X - 90} 190H${X - 30}V350H${X - 90}Z`, { fill: '#ff5a7a', opacity: 0.45 }),
      path(`M${X + 30} 190H${X + 90}V350H${X + 30}Z`, { fill: '#3ad8b8', opacity: 0.45 })),
    path(`M${X - 30} 190V350M${X + 30} 190V350M${X - 84} 270H${X - 62}M${X + 62} 270H${X + 84}`, { fill: 'none', stroke: '#c8861a', 'stroke-width': 5 }),
    path(`M${X - 62} 190L${X - 84} 270L${X - 62} 350H${X + 62}L${X + 84} 270L${X + 62} 190Z`, { fill: 'none', stroke: '#c8861a', 'stroke-width': 5 }),
    face(X, 262, 50, 24, 'cheeky', { ink: '#5a2a00', cheek: '#ff8a5a' }),
    path(foot, { fill: '#d8961a' }),
    path(point, { fill: u('gold') }),
    path(drop, { fill: '#ff5a7a' }),
    circle(X - 48, 210, 6, { fill: '#ffffff', opacity: 0.7 }),
  );
  return stickerDoc(ID, 'Ramadan sticker: a glowing fanous lantern with a cheeky face and colored glass panels hangs beside a golden crescent moon, on an eight-pointed star badge in deep night teal with tiny gold stars', defs, sil, art);
}
