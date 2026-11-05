// Eid al-Adha sticker ("Sharing Heart"): a fluffy little lamb with a happy face hugs a big red heart, curled up in
// the hollow of a crescent moon; a small lantern hangs from the moon's upper tip. The badge is the crescent itself,
// green-teal with tiny gold stars. The lamb, the heart and the lantern break out of the moon.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, heartD, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'eid-al-adha-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#2a1a2a';

export function sticker() {
  setPrecision(10);
  // ---- badge: a crescent, opening to the right (outer circle minus an offset inner circle, traced as one outline)
  const O = { x: 236, y: 256, r: 210 }, I = { x: 330, y: 226, r: 172 };
  // the two circles cross where both distance conditions hold; solve for the crossing points
  const dx = I.x - O.x, dy = I.y - O.y, d = Math.hypot(dx, dy);
  const a = (O.r * O.r - I.r * I.r + d * d) / (2 * d), hh = Math.sqrt(O.r * O.r - a * a);
  const mx = O.x + (a * dx) / d, my = O.y + (a * dy) / d;
  const p1 = [mx + (hh * dy) / d, my - (hh * dx) / d], p2 = [mx - (hh * dy) / d, my + (hh * dx) / d];
  const bd = `M${P(...p1)}A${O.r} ${O.r} 0 1 0 ${P(...p2)}A${I.r} ${I.r} 0 1 1 ${P(...p1)}Z`;
  const B = { cx: 236, cy: 256, r: 220 };
  const bg = badge(ID, { d: bd, cx: 200, cy: 256, c1: '#2ab88a', c2: '#0a5a5a', tile: tiled(ID, B, 40, [MARKS.star(7), MARKS.dot(2.6), MARKS.twinkle(5)]), patternFill: '#ffd166', patternOpacity: 0.65, ink: '#033a3a', inset: 0.84 });

  // ---- the lantern hanging from the upper tip
  const LX = p1[0] - 6, LY = p1[1] + 6;
  const lantern = `M${LX - 16} ${LY + 40}h32l-4 46h-24zM${LX - 12} ${LY + 32}h24l-4 -10h-16z`;
  // ---- the lamb in the hollow, hugging the heart
  const L = { x: 330, y: 330 };
  let wool = '';
  for (let k = 0; k < 12; k++) { const t = (k / 12) * Math.PI * 2; wool += `M${P(L.x + Math.cos(t) * 74 - 24, L.y + 26 + Math.sin(t) * 52)}a24 24 0 1 0 48 0a24 24 0 1 0 -48 0Z`; }
  const body = `M${L.x - 80} ${L.y + 26}a80 60 0 1 0 160 0a80 60 0 1 0 -160 0Z`;
  const head = `M${L.x - 48} ${L.y - 50}a48 44 0 1 0 96 0a48 44 0 1 0 -96 0Z`;
  let tuft = '';
  for (let k = 0; k < 5; k++) tuft += `M${P(L.x - 30 + k * 15 - 12, L.y - 92)}a12 12 0 1 0 24 0a12 12 0 1 0 -24 0Z`;
  const ears = `M${L.x - 46} ${L.y - 62}c-34 -10 -48 10 -40 22c14 4 30 -4 40 -22zM${L.x + 46} ${L.y - 62}c34 -10 48 10 40 22c-14 4 -30 -4 -40 -22z`;
  const heart = heartD(L.x, L.y + 30, 96);
  const legs = `M${L.x - 52} ${L.y + 70}h26v40h-26zM${L.x + 26} ${L.y + 70}h26v40h-26z`;

  const heroSil = [path(lantern), path(`M${LX} ${LY}v32`, { fill: 'none', stroke: '#000', 'stroke-width': 4 }), path(legs), path(wool), path(body), path(ears), path(head), path(tuft), path(heart)].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-wool`, 0.45, 0.35, 0.75, [[0, '#ffffff'], [1, '#e8e2ea']]),
    rad(`${ID}-heart`, 0.38, 0.32, 0.8, [[0, '#ff7a8a'], [0.55, '#e8243a'], [1, '#a8102a']]),
    rad(`${ID}-glass`, 0.5, 0.5, 0.6, [[0, '#fff6c8'], [1, '#ffb83a']]),
    rad(`${ID}-glow`, 0.5, 0.5, 0.5, [[0, '#ffe08a', 0.6], [1, '#ffe08a', 0]]),
  ];

  const art = G({},
    '\n<!-- the badge: a green-teal crescent moon with tiny gold stars -->\n',
    bg.art,
    sparkle(440, 120, 12, '#ffe9a3'), sparkle(470, 200, 7, '#ffffff'), sparkle(60, 120, 8, '#ffe9a3'),
    '\n<!-- the lamb, its heart and the lantern: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    circle(LX, LY + 62, 40, { fill: u('glow') }),
    path(`M${LX} ${LY}v32`, { fill: 'none', stroke: '#c8901e', 'stroke-width': 3 }),
    path(lantern, { fill: '#d8a020' }), path(`M${LX - 12} ${LY + 44}h24l-3 38h-18z`, { fill: u('glass') }),
    path(legs, { fill: '#3a3a44' }),
    path(wool, { fill: u('wool') }), path(body, { fill: u('wool') }),
    path(ears, { fill: '#3a3a44' }), path(`M${L.x - 52} ${L.y - 58}c-18 -4 -26 6 -24 12c8 2 16 -2 24 -12zM${L.x + 52} ${L.y - 58}c18 -4 26 6 24 12c-8 2 -16 -2 -24 -12z`, { fill: '#ffb0c0' }),
    path(head, { fill: '#4a4a54' }),
    path(tuft, { fill: u('wool') }),
    face(L.x, L.y - 50, 40, 18, 'happy', { ink: '#1a1a24', cheek: '#ff9db0' }),
    ellipse(L.x, L.y - 30, 10, 6, { fill: '#ff9db0' }),
    path(heart, { fill: u('heart') }),
    path(`M${L.x - 30} ${L.y + 6}q10 -12 24 -6`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.7 }),
    // two woolly arms hugging the heart
    path(`M${L.x - 60} ${L.y + 20}a18 18 0 1 0 36 0a18 18 0 1 0 -36 0zM${L.x + 24} ${L.y + 20}a18 18 0 1 0 36 0a18 18 0 1 0 -36 0z`, { fill: u('wool') }),
  );
  return stickerDoc(ID, 'Eid al-Adha sticker: a fluffy little lamb with a happy face hugs a big red heart, curled in the hollow of a green-teal crescent moon with tiny gold stars, a little lantern glowing from the moon\'s upper tip', defs, sil, art);
}
