// New Year's Day sticker: "the first page of a brand-new year" — a tear-off calendar page (binder rings on top,
// a red header with a big 1) whose page is a pink-gold dawn; the first sun of the year rises out of the sea on it,
// wearing a party hat and tooting a party blower. The sun's rays, the hat and the waves break out of the page.
import { f, P, E, G, path, circle, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, roundPoly, MARKS, tiled, inkUnder, face, sparkle, capsule, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'new-years-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#4a1a10';

export function sticker() {
  setPrecision(10);
  // ---- badge: a calendar page with a red header showing a big 1
  const X0 = 78, X1 = 434, Y0 = 92, Y1 = 446;
  const bd = roundPoly([[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], 30);
  const one = 'M330 112L350 104H362V166H344V126L330 132Z';
  const inside = [
    path(`M${X0 - 10} ${Y0 - 10}H${X1 + 10}V176H${X0 - 10}Z`, { fill: u('header') }),
    path(`M${X0} 176H${X1}`, { fill: 'none', stroke: '#8a0a1c', 'stroke-width': 4 }),
    path(`M${X0} 182H${X1}`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-dasharray': '2 8', opacity: 0.7 }),   // the perforation
    path(one, { fill: '#ffffff' }),
  ].join('');
  const B = { cx: 256, cy: 300, r: 220 };
  const bg = badge(ID, { d: bd, cx: 256, cy: 268, c1: '#ffd8b0', c2: '#ff9a8a', tile: tiled(ID, B, 52, [MARKS.diamond(6), MARKS.twinkle(7), MARKS.dot(3.5)]), patternFill: '#ffffff', patternOpacity: 0.4, ink: '#7a1a2a', inside, inset: 0.9 });
  // binder rings over the top edge
  const rings = capsule(176, 92, 26, 9, 90) + capsule(336, 92, 26, 9, 90);

  // ---- the sun, rising out of the sea
  const S = { x: 256, y: 352, r: 98 };
  let rays = '';
  for (let k = 0; k < 14; k++) {
    const deg = (k / 14) * 360 - 90;
    if (deg > 20 && deg < 160) continue;                 // the lower rays are under the sea
    const a = deg * (Math.PI / 180), a1 = a - 0.11, a2 = a + 0.11, R0 = S.r + 6, R1 = S.r + (k % 2 ? 40 : 58);
    rays += roundPoly([[S.x + Math.cos(a1) * R0, S.y + Math.sin(a1) * R0], [S.x + Math.cos(a) * R1, S.y + Math.sin(a) * R1], [S.x + Math.cos(a2) * R0, S.y + Math.sin(a2) * R0]], 6);
  }
  // the sea: two wave bands across the bottom, wider than the page
  let sea = 'M56 418';
  for (let x = 56; x < 456; x += 50) sea += 'q12.5 -14 25 0t25 0';
  sea += 'V470Q256 482 56 470Z';
  let crest = 'M70 444';
  for (let x = 70; x < 440; x += 46) crest += 'q11.5 -10 23 0t23 0';
  // the party hat, tilted on the sun's head, and a party blower
  const hat = 'M196 270L232 156L282 258Q240 280 196 270Z';
  const blower = capsule(298, 368, 36, 7, -8);

  const heroSil = [path(rays), circle(S.x, S.y, S.r), path(hat), circle(234, 150, 13), path(blower), circle(340, 352, 18), path(sea)].join('');
  const sil = [bg.sil, path(rings, { fill: '#000' }), heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    lin(`${ID}-header`, 0, 0, 0, 1, [[0, '#ff4a5a'], [1, '#c8102e']]),
    rad(`${ID}-sun`, 0.4, 0.34, 0.75, [[0, '#fff6c8'], [0.5, '#ffd23a'], [1, '#ff9a1a']]),
    lin(`${ID}-rays`, 0, 0, 0, 1, [[0, '#ffd23a'], [1, '#ff8a2a']]),
    lin(`${ID}-sea`, 0, 0, 0, 1, [[0, '#4a8ae0'], [1, '#2a5ab0']]),
    lin(`${ID}-hat`, 0, 0, 1, 0, [[0, '#7a5af8'], [1, '#4a2ad0']]),
    lin(`${ID}-ring`, 0, 0, 1, 0, [[0, '#d8dce6'], [0.5, '#ffffff'], [1, '#9aa0b0']]),
    E('clipPath', { id: `${ID}-hatclip` }, path(hat)),
  ];

  const art = G({},
    '\n<!-- the badge: a calendar page, a red header with a big 1, a dawn-pink page with confetti -->\n',
    bg.art,
    '\n<!-- the binder rings over the top edge -->\n',
    path(rings, { fill: u('ring'), stroke: '#4a4a5a', 'stroke-width': 4 }),
    sparkle(112, 226, 12, '#ffffff'), sparkle(404, 216, 9, '#ffffff'),
    '\n<!-- the sun: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(rays, { fill: u('rays') }),
    circle(S.x, S.y, S.r, { fill: u('sun') }),
    path(`M${P(S.x - 64, S.y - 54)}a86 86 0 0 1 58 -36`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.6 }),
    face(S.x - 6, S.y - 22, 66, 30, 'happy', { ink: '#5a2a10', cheek: '#ff7a5a', cheeks: true }),
    // the party blower in its mouth: striped tube, curled tip
    path(blower, { fill: '#ff4d9d' }),
    path('M272 362l8 -1v14l-8 1zM294 359l8 -1v14l-8 1zM316 356l8 -1v14l-8 1z', { fill: '#ffd166' }),
    path('M330 352c18 -8 26 8 14 16c-8 4 -12 -4 -6 -6', { fill: 'none', stroke: '#ff4d9d', 'stroke-width': 9, 'stroke-linecap': 'round' }),
    // the party hat
    path(hat, { fill: u('hat') }),
    G({ 'clip-path': u('hatclip') }, path('M190 236l100 10v10l-100 -10zM204 196l80 8v10l-80 -8z', { fill: '#ffd166' })),
    circle(234, 150, 13, { fill: '#ffd166' }), circle(230, 146, 4, { fill: '#ffffff', opacity: 0.8 }),
    // the sea, with crests and a glint of sunlight
    path(sea, { fill: u('sea') }),
    path(crest, { fill: 'none', stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.85 }),
    path('M206 432h100v5h-100zM226 452h60v5h-60z', { fill: '#ffd23a', opacity: 0.9 }),
  );
  return stickerDoc(ID, 'New Year\'s Day sticker: a tear-off calendar page with binder rings and a red header showing a big 1; on its dawn-pink page the first sun of the year rises out of the sea wearing a purple party hat and tooting a party blower', defs, sil, art);
}
