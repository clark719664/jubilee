// St Nicholas Day sticker: a cheerful red boot left out overnight and found stuffed with treats (a mandarin, gold
// chocolate coins, a candy cane and a carrot for the horse), standing in the snow on a stepped-gable house badge
// with lit windows and snow on every step. The treats and the snow break out of the badge.
import { f, P, E, G, path, circle, ellipse, use, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, roundPoly, MARKS, tiled, inkUnder, face, sparkle, capsule, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'st-nicholas-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#2a0f14';
const SNOW = '#f4f9fc';

export function sticker() {
  setPrecision(10);
  // ---- badge: a stepped gable, night blue, with a round attic window and two lit windows
  const X0 = 60, X1 = 452, BOT = 452, EAVE = 236, RUN = 44, SH = 50;
  const pts = [[X0, BOT], [X0, EAVE]];
  for (let i = 0; i < 3; i++) pts.push([X0 + RUN * (i + 1), EAVE - SH * i], [X0 + RUN * (i + 1), EAVE - SH * (i + 1)]);
  for (let i = 2; i >= 0; i--) pts.push([X1 - RUN * (i + 1), EAVE - SH * (i + 1)], [X1 - RUN * (i + 1), EAVE - SH * i]);
  pts.push([X1, EAVE], [X1, BOT]);
  const bd = roundPoly(pts, 7);
  // snow caps on every ledge (the flat tops of the steps and the crown)
  let caps = '';
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    if (a[1] !== b[1] || b[0] <= a[0]) continue;
    caps += `M${P(a[0] - 4, a[1] + 3)}Q${P(a[0] - 4, a[1] - 9)} ${P(a[0] + 8, a[1] - 9)}H${f(b[0] - 8)}Q${P(b[0] + 4, b[1] - 9)} ${P(b[0] + 4, b[1] + 3)}Z`;
  }
  const win = (x, y, w, h) => [
    ellipse(x + w / 2, y + h / 2, w * 1.1, h * 0.9, { fill: u('halo') }),
    path(`M${P(x, y)}h${w}v${h}h${-w}Z`, { fill: u('glass') }),
    path(`M${P(x + w / 2, y)}v${h}M${P(x, y + h * 0.45)}h${w}`, { fill: 'none', stroke: '#f4efe4', 'stroke-width': 4 }),
    path(`M${P(x, y)}h${w}v${h}h${-w}Z`, { fill: 'none', stroke: '#f4efe4', 'stroke-width': 5 }),
    path(`M${P(x - 6, y + h)}q${f(w / 2 + 6)} -10 ${f(w + 12)} 0v6h${f(-(w + 12))}Z`, { fill: SNOW }),
  ].join('');
  const inside = [
    win(84, 296, 44, 58), win(352, 262, 52, 66),
    circle(256, 136, 30, { fill: u('halo') }), circle(256, 136, 20, { fill: u('glass') }), circle(256, 136, 20, { fill: 'none', stroke: '#f4efe4', 'stroke-width': 5 }),
  ].join('');
  const B = { cx: 256, cy: 270, r: 232 };
  const bg = badge(ID, { d: bd, cx: 256, cy: 280, c1: '#16305e', c2: '#2f5f96', tile: tiled(ID, B, 62, [MARKS.snowflake(13), MARKS.twinkle(6), MARKS.snowflake(9)]), patternFill: '#ffffff', patternOpacity: 0.2, ink: '#0b1a36', inside, inset: 0.9 });

  // ---- the boot, toe pointing right
  const boot = 'M150 262V440Q150 458 168 458H392Q416 458 414 430C412 398 372 382 334 370Q306 360 306 336V262Z';
  const sole = 'M144 446H404Q422 446 420 460Q418 472 400 472H160Q144 472 144 458Z';
  let cuff = 'M136 262Q136 238 160 238H296Q320 238 320 262V278';
  for (let i = 0; i < 6; i++) cuff += `a15.33 12 0 0 1 -30.67 0`;
  cuff += 'Z';
  const snow = 'M106 462C106 446 180 440 280 440C380 440 456 446 456 462C456 476 380 478 280 478C180 478 106 476 106 462Z';
  // ---- the treats, drawn before the cuff so it hides their bottoms
  const caneShaft = capsule(176, 206, 66, 8, 90);
  const caneHook = 'M184 150A30 30 0 0 0 124 150V166A8 8 0 0 0 140 166V150A14 14 0 0 1 168 150Z';
  const carrot = 'M266 170Q284 158 302 168L288 270H276Z';
  const leaves = [capsule(276, 136, 30, 6, -110), capsule(292, 132, 32, 6, -78), capsule(310, 146, 26, 6, -45)];
  const orange = [212, 236, 36];
  const coins = [[256, 238, 21], [302, 232, 18]];

  const heroSil = [
    path(snow), path(boot), path(sole), path(cuff), path(caneShaft), path(caneHook), path(carrot), ...leaves.map((d) => path(d)),
    circle(...orange), ...coins.map(([x, y, r]) => circle(x, y, r)),
  ].join('');
  const sil = [bg.sil, path(caps), heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-halo`, 0.5, 0.5, 0.5, [[0, '#ffe9a3', 0.5], [1, '#ffe9a3', 0]]),
    rad(`${ID}-glass`, 0.5, 0.6, 0.75, [[0, '#fff3cf'], [0.5, '#ffd98a'], [1, '#f0a84a']]),
    lin(`${ID}-boot`, 0, 0, 1, 0, [[0, '#ff5a3c'], [0.6, '#d8301e'], [1, '#a81e14']]),
    lin(`${ID}-cuff`, 0, 0, 0, 1, [[0, '#ffffff'], [1, '#dfe8f2']]),
    rad(`${ID}-orange`, 0.36, 0.32, 0.75, [[0, '#ffc14a'], [0.55, '#ff8a1a'], [1, '#d8600a']]),
    rad(`${ID}-coin`, 0.36, 0.3, 0.8, [[0, '#fff2a8'], [0.5, '#ffcf3a'], [1, '#c8901e']]),
    lin(`${ID}-carrot`, 0, 0, 1, 0, [[0, '#ffa040'], [1, '#e8640e']]),
    lin(`${ID}-snow`, 0, 0, 0, 1, [[0, '#ffffff'], [1, '#d4e2ee']]),
    E('clipPath', { id: `${ID}-caneclip` }, path(caneShaft), path(caneHook)),
    E('clipPath', { id: `${ID}-bootclip` }, path(boot)),
  ];

  // candy-cane stripes: diagonal bands clipped to the cane
  let stripes = '';
  for (let y = 110; y < 290; y += 22) stripes += `M110 ${y}l90 -40v10l-90 40Z`;
  const coin = ([x, y, r]) => [
    circle(x, y, r, { fill: u('coin') }),
    circle(x, y, r * 0.68, { fill: 'none', stroke: '#c8901e', 'stroke-width': 2.4 }),
    path(`M${P(x, y - r * 0.38)}l${f(r * 0.12)} ${f(r * 0.26)}l${f(r * 0.28)} 0l${f(-r * 0.22)} ${f(r * 0.17)}l${f(r * 0.09)} ${f(r * 0.28)}l${f(-r * 0.27)} ${f(-r * 0.16)}l${f(-r * 0.27)} ${f(r * 0.16)}l${f(r * 0.09)} ${f(-r * 0.28)}l${f(-r * 0.22)} ${f(-r * 0.17)}l${f(r * 0.28)} 0Z`, { fill: '#e8a820' }),
    ellipse(x - r * 0.4, y - r * 0.4, r * 0.22, r * 0.12, { fill: '#ffffff', opacity: 0.8, transform: `rotate(-40 ${f(x - r * 0.4)} ${f(y - r * 0.4)})` }),
  ].join('');

  const art = G({},
    '\n<!-- the badge: a stepped-gable house at night, lit windows, snow on every step -->\n',
    bg.art,
    path(caps, { fill: SNOW, stroke: '#0b1a36', 'stroke-width': 3 }),
    sparkle(96, 196, 11, '#ffe9a3'), sparkle(420, 214, 8, '#ffe9a3'),
    '\n<!-- the boot and its treats: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 12),
    path(snow, { fill: u('snow') }),
    path('M140 452q140 -12 296 0', { fill: 'none', stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.9 }),
    // the candy cane
    path(caneShaft, { fill: '#ffffff' }), path(caneHook, { fill: '#ffffff' }),
    G({ 'clip-path': u('caneclip') }, path(stripes, { fill: '#e8243a' })),
    // the carrot for the horse, leaves first
    G({ fill: '#3aa04a' }, ...leaves.map((d) => path(d))),
    path(carrot, { fill: u('carrot') }),
    path('M274 196l10 2M278 224l8 2M280 250l6 1', { fill: 'none', stroke: '#c8500a', 'stroke-width': 2.6, 'stroke-linecap': 'round' }),
    // the mandarin and the coins
    circle(...orange, { fill: u('orange') }),
    path('M204 202q8 -14 22 -12q-6 12 -22 12z', { fill: '#3aa04a' }), circle(212, 203, 3, { fill: '#8a5a1a' }),
    ellipse(198, 222, 9, 6, { fill: '#ffffff', opacity: 0.5, transform: 'rotate(-35 198 222)' }),
    coin(coins[0]), coin(coins[1]),
    '\n<!-- the boot: red leather, a white knitted cuff, laces, a shiny toe, a happy face -->\n',
    path(boot, { fill: u('boot') }),
    G({ 'clip-path': u('bootclip') },
      ellipse(372, 416, 30, 16, { fill: '#ffffff', opacity: 0.3, transform: 'rotate(-12 372 416)' }),
      path('M150 430H420V460H150Z', { fill: '#7a1410', opacity: 0.35 })),
    path(capsule(166, 340, 52, 6, 90), { fill: '#ffffff', opacity: 0.45 }),
    path(sole, { fill: '#4a2418' }),
    path('M300 300l18 10M318 300l-18 10M308 328l18 10M326 328l-18 10', { fill: 'none', stroke: '#fff4e6', 'stroke-width': 3.6, 'stroke-linecap': 'round' }),
    path(cuff, { fill: u('cuff') }),
    path('M156 252V270M180 252V272M204 252V272M228 252V272M252 252V272M276 252V272M300 252V270', { fill: 'none', stroke: '#c8d6e6', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    face(226, 350, 62, 26, 'starry', { ink: INK, cheek: '#ff9db0' }),
    sparkle(340, 196, 10, '#ffffff'), sparkle(150, 106, 7, '#ffe9a3'),
  );
  return stickerDoc(ID, 'St Nicholas Day sticker: a cheerful red boot with a white knitted cuff and starry eyes, stuffed with a mandarin, gold chocolate coins, a candy cane and a carrot for the horse, standing in the snow on a night-blue stepped-gable house badge with lit windows and snow on every step', defs, sil, art);
}
