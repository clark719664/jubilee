// Bonfire Night sticker: a glossy toffee apple in knitted mittens, waving one hand and holding up a fizzing sparkler,
// on a night-to-ember firework burst badge. The sparks and the toffee puddle break out of the badge.
import { f, P, mix, darken, lighten, E, G, path, circle, ellipse, use, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, burstD, MARKS, tiled, inkUnder, face, sparkle, capsule, circleD, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'bonfire-night-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#3a0a14';

export function sticker() {
  setPrecision(10);
  // ---- badge: an 18-point firework burst, night purple to bonfire ember
  const B = { cx: 256, cy: 246, r: 204 };
  const bd = burstD(B.cx, B.cy, 204, 184, 20, 8);
  // a row of bonfire flames along the bottom of the badge, glowing up into the night
  const tongues = [[66, 92], [100, 140], [134, 104], [168, 128], [204, 70], [256, 60], [308, 70], [344, 126], [378, 100], [412, 138], [446, 88]];
  const tongue = (x, hgt, w, base) => `M${P(x - w, base)}C${P(x - w, base - hgt * 0.45)} ${P(x - w * 0.25, base - hgt * 0.7)} ${P(x + w * 0.15, base - hgt)}C${P(x + w * 0.3, base - hgt * 0.62)} ${P(x + w, base - hgt * 0.45)} ${P(x + w, base)}Z`;
  const flames = tongues.map(([x, hgt]) => tongue(x, hgt, 30, 452)).join('') + 'M30 452H482V480H30Z';
  const cores = tongues.map(([x, hgt]) => tongue(x, hgt * 0.58, 15, 452)).join('');
  const inside = [
    ellipse(256, 430, 230, 120, { fill: `url(#${ID}-ember)` }),
    path(flames, { fill: `url(#${ID}-flame)` }),
    path(cores, { fill: '#ffe680' }),
  ].join('');
  const bg = badge(ID, { d: bd, cx: B.cx, cy: B.cy, c1: '#14215e', c2: '#5a2290', tile: tiled(ID, B, 64, [MARKS.firework(14), MARKS.firework(9), MARKS.twinkle(6)]), patternFill: '#ffd166', patternOpacity: 0.42, ink: '#0d0a2e', inside });
  // the hero, a touch smaller than the badge so the badge reads round it; anchored at the toffee puddle
  const HT = 'translate(248 462) scale(0.86) translate(-248 -462)';

  // ---- the toffee apple
  const AX = 248;
  const apple = `M${P(AX, 240)}C${P(AX - 18, 222)} ${P(AX - 58, 216)} ${P(AX - 88, 234)}C${P(AX - 128, 258)} ${P(AX - 136, 322)} ${P(AX - 118, 364)}C${P(AX - 98, 412)} ${P(AX - 48, 440)} ${P(AX, 432)}C${P(AX + 48, 440)} ${P(AX + 98, 412)} ${P(AX + 118, 364)}C${P(AX + 136, 322)} ${P(AX + 128, 258)} ${P(AX + 88, 234)}C${P(AX + 58, 216)} ${P(AX + 18, 222)} ${P(AX, 240)}Z`;
  // the toffee that ran down and set in a glossy puddle, with two drips joining it
  const puddle = `M${P(AX - 124, 444)}C${P(AX - 124, 430)} ${P(AX - 70, 424)} ${P(AX, 424)}C${P(AX + 70, 424)} ${P(AX + 124, 430)} ${P(AX + 124, 444)}C${P(AX + 124, 458)} ${P(AX + 70, 464)} ${P(AX, 464)}C${P(AX - 70, 464)} ${P(AX - 124, 458)} ${P(AX - 124, 444)}Z`;
  const stick = `M${P(AX + 2, 250)}L${P(AX + 12, 84)}Q${P(AX + 14, 72)} ${P(AX + 24, 74)}Q${P(AX + 32, 77)} ${P(AX + 30, 88)}L${P(AX + 22, 252)}Z`;
  // stubby arms in toffee red, then knitted mittens
  const armL = capsule(AX - 136, 318, 40, 14, 222);
  const armR = capsule(AX + 132, 300, 44, 14, -52);
  const mitL = { x: AX - 160, y: 288 }, mitR = { x: AX + 150, y: 266 };
  const mitten = (m, flip) => {
    const s = flip ? -1 : 1;
    return `M${P(m.x - 22 * s, m.y + 22)}C${P(m.x - 30 * s, m.y)} ${P(m.x - 22 * s, m.y - 26)} ${P(m.x, m.y - 26)}C${P(m.x + 20 * s, m.y - 26)} ${P(m.x + 26 * s, m.y - 6)} ${P(m.x + 22 * s, m.y + 22)}Z`
      + `M${P(m.x + 18 * s, m.y + 2)}C${P(m.x + 34 * s, m.y - 6)} ${P(m.x + 40 * s, m.y + 8)} ${P(m.x + 24 * s, m.y + 16)}Z`;
  };
  const cuff = (m) => `M${P(m.x - 24, m.y + 14)}h48v16q0 6-6 6h-36q-6 0-6-6Z`;

  // ---- the sparkler: a wire through the right mitten, a gray coated tip, a ball of sparks breaking out top right
  const SP = { x: 428, y: 148 };
  const wire = `M${P(mitR.x - 10, mitR.y + 44)}L${P(SP.x - 6, SP.y + 8)}`;
  let sparks = '';
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2 + 0.2; const L = k % 2 ? 26 : 40; sparks += capsule(SP.x + Math.cos(a) * L * 0.62, SP.y + Math.sin(a) * L * 0.62, L * 0.42, 2.6, (a * 180) / Math.PI); }

  const heroSil = [path(apple), path(puddle), path(stick), path(armL), path(armR), path(mitten(mitL, true)), path(mitten(mitR, false)), path(cuff(mitL)), path(cuff(mitR))].join('');
  const sil = [bg.sil, G({ transform: HT }, heroSil, circle(SP.x, SP.y, 44), path(wire, { fill: 'none', stroke: '#000', 'stroke-width': 8 }))].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-toffee`, 0.36, 0.3, 0.78, [[0, '#ff6a5a'], [0.45, '#e01f2e'], [1, '#8a0a1c']]),
    lin(`${ID}-puddle`, 0, 0, 0, 1, [[0, '#d9361e'], [1, '#8a1a10']]),
    lin(`${ID}-stick`, 0, 0, 1, 0, [[0, '#f3d9a8'], [1, '#c99a5a']]),
    lin(`${ID}-mitten`, 0, 0, 0, 1, [[0, '#ffa23a'], [1, '#e86a00']]),
    lin(`${ID}-flame`, 0, 0, 0, 1, [[0, '#ffb02a'], [0.5, '#ff6a1a'], [1, '#d8301a']], { gradientUnits: 'userSpaceOnUse', x1: 0, y1: 300, x2: 0, y2: 452 }),
    rad(`${ID}-ember`, 0.5, 0.75, 0.5, [[0, '#ff8a2a', 0.85], [0.6, '#ff5a1a', 0.35], [1, '#ff5a1a', 0]]),
    rad(`${ID}-glow`, 0.5, 0.5, 0.5, [[0, '#ffffff'], [0.25, '#fff3b0'], [0.6, '#ffd166', 0.55], [1, '#ff9a1a', 0]]),
    E('clipPath', { id: `${ID}-appleclip` }, path(apple)),
  ];

  const knit = (m) => path(`M${P(m.x - 14, m.y - 12)}v20M${P(m.x - 5, m.y - 18)}v26M${P(m.x + 4, m.y - 18)}v26M${P(m.x + 13, m.y - 12)}v20`, { fill: 'none', stroke: '#c45400', 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0.55 });

  const art = G({},
    '\n<!-- the badge: a firework burst from night purple to bonfire ember -->\n',
    bg.art,
    sparkle(96, 168, 16, '#ffd166'), sparkle(150, 96, 9, '#ffe9a3'),
    '\n<!-- the toffee apple: an ink outline traced from its silhouette, then the paint -->\n',
    `<g transform="${HT}">`,
    inkUnder(`${ID}-hero`, INK, 12),
    path(puddle, { fill: u('puddle') }),
    path(`M${P(AX - 96, 438)}q40-10 96-10t96 8`, { fill: 'none', stroke: '#ff8a6a', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.6 }),
    path(stick, { fill: u('stick') }),
    path(`M${P(AX + 13, 96)}L${P(AX + 8, 236)}`, { fill: 'none', stroke: '#fff4dc', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.7 }),
    path(apple, { fill: u('toffee') }),
    G({ 'clip-path': u('appleclip') },
      // the toffee is thicker at the bottom where it ran: a darker band with a glossy edge
      path(`M${P(AX - 140, 404)}C${P(AX - 80, 392)} ${P(AX - 30, 412)} ${P(AX, 400)}C${P(AX + 40, 388)} ${P(AX + 90, 410)} ${P(AX + 140, 396)}V460H${f(AX - 140)}Z`, { fill: '#7a0816', opacity: 0.45 }),
      ellipse(AX - 60, 264, 40, 20, { fill: '#ffffff', opacity: 0.35, transform: `rotate(-28 ${AX - 60} 264)` })),
    path(`M${P(AX - 92, 286)}C${P(AX - 102, 316)} ${P(AX - 98, 344)} ${P(AX - 84, 368)}`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.75 }),
    circle(AX - 70, 258, 7, { fill: '#ffffff', opacity: 0.9 }),
    path(armL, { fill: '#a80f22', stroke: INK, 'stroke-width': 4 }), path(armR, { fill: '#a80f22', stroke: INK, 'stroke-width': 4 }),
    face(AX, 330, 92, 32, 'joy', { ink: '#2a0610', mouth: '#3a0610', cheek: '#ff9db0' }),
    '\n<!-- knitted mittens: one waving, one gripping the sparkler (the wire shows above and below the grip) -->\n',
    path(wire, { fill: 'none', stroke: '#8a90a6', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    path(`M${P(mitR.x + 30, mitR.y - 52)}L${P(SP.x - 6, SP.y + 8)}`, { fill: 'none', stroke: '#4a4a5a', 'stroke-width': 9, 'stroke-linecap': 'round' }),
    path(mitten(mitL, true), { fill: u('mitten') }), path(cuff(mitL), { fill: '#fff3d6' }), knit(mitL),
    path(mitten(mitR, false), { fill: u('mitten') }), path(cuff(mitR), { fill: '#fff3d6' }), knit(mitR),
    '\n<!-- the sparks -->\n',
    circle(SP.x, SP.y, 44, { fill: u('glow') }),
    path(sparks, { fill: '#ffe066' }),
    circle(SP.x, SP.y, 9, { fill: '#ffffff' }),
    sparkle(SP.x - 38, SP.y - 30, 7, '#ffffff'), sparkle(SP.x + 30, SP.y + 34, 6, '#ffffff'),
    '</g>',
  );
  return stickerDoc(ID, 'Bonfire Night sticker: a glossy red toffee apple in knitted orange mittens, waving one hand and holding up a fizzing sparkler, on a firework-burst badge that glows from night purple to bonfire ember', defs, sil, art);
}
