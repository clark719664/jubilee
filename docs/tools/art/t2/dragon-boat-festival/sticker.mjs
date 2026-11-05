// Dragon Boat Festival sticker ("Paddler"): a determined little green dragon with golden horns, a red mane, curly gold
// whiskers and a toothy grin peeks over a red festival drum, the boat's heartbeat, its paws on the rim and its
// skin ringed with gold studs; two drumsticks are crossed behind and a zongzi wrapped in a bamboo leaf sits at its
// foot. The badge is the drum. The dragon, the sticks and the zongzi break out of it.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, circleD, capsule, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'dragon-boat-festival-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#1a2a1a';
const GOLD = '#ffc83a';

export function sticker() {
  setPrecision(10);
  const D = { x: 256, y: 312, r: 156 };
  const bd = circleD(D.x, D.y, D.r);
  let studs = '';
  for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; studs += circleD(D.x + Math.cos(a) * (D.r - 18), D.y + Math.sin(a) * (D.r - 18), 6); }
  const inside = [
    circle(D.x, D.y, D.r - 34, { fill: '#f4e4c4' }),
    circle(D.x, D.y, D.r - 34, { fill: 'none', stroke: '#c8901e', 'stroke-width': 4 }),
    path(studs, { fill: GOLD }),
  ].join('');
  const B = { cx: D.x, cy: D.y, r: 200 };
  const bg = badge(ID, { d: bd, cx: D.x, cy: D.y, c1: '#ff4a4a', c2: '#a80a1e', tile: tiled(ID, B, 40, [MARKS.dot(3)]), patternFill: '#ffd166', patternOpacity: 0.0, ink: '#5a0a14', stitch: '#ffd166', inside, inset: 0.66 });

  // ---- drumsticks crossed behind
  const sticks = capsule(150, 120, 96, 8, 52) + capsule(372, 120, 96, 8, -52);
  const knobs = circleD(96, 52, 16) + circleD(426, 52, 16);
  // ---- the dragon, front-facing, peeking over the drum with its paws on the rim
  const HX = 256, HY = 214;
  const head = `M${HX - 104} ${HY + 10}C${HX - 110} ${HY - 70} ${HX - 50} ${HY - 104} ${HX} ${HY - 104}C${HX + 50} ${HY - 104} ${HX + 110} ${HY - 70} ${HX + 104} ${HY + 10}C${HX + 100} ${HY + 70} ${HX + 50} ${HY + 96} ${HX} ${HY + 96}C${HX - 50} ${HY + 96} ${HX - 100} ${HY + 70} ${HX - 104} ${HY + 10}Z`;
  const snout = `M${HX - 70} ${HY + 40}C${HX - 70} ${HY + 4} ${HX + 70} ${HY + 4} ${HX + 70} ${HY + 40}C${HX + 70} ${HY + 92} ${HX - 70} ${HY + 92} ${HX - 70} ${HY + 40}Z`;
  const horn = `M${HX - 50} ${HY - 92}C${HX - 70} ${HY - 140} ${HX - 100} ${HY - 150} ${HX - 120} ${HY - 140}C${HX - 96} ${HY - 130} ${HX - 84} ${HY - 116} ${HX - 80} ${HY - 84}ZM${HX + 50} ${HY - 92}C${HX + 70} ${HY - 140} ${HX + 100} ${HY - 150} ${HX + 120} ${HY - 140}C${HX + 96} ${HY - 130} ${HX + 84} ${HY - 116} ${HX + 80} ${HY - 84}Z`;
  const mane = `M${HX - 104} ${HY - 10}c-40 -10 -50 30 -30 50c-24 6 -20 40 6 40zM${HX + 104} ${HY - 10}c40 -10 50 30 30 50c24 6 20 40 -6 40z`;
  const whisker = `M${HX - 70} ${HY + 40}C${HX - 120} ${HY + 40} ${HX - 150} ${HY + 70} ${HX - 140} ${HY + 100}M${HX + 70} ${HY + 40}C${HX + 120} ${HY + 40} ${HX + 150} ${HY + 70} ${HX + 140} ${HY + 100}`;
  const paws = `M${HX - 100} ${HY + 110}a26 22 0 1 0 52 0a26 22 0 1 0 -52 0ZM${HX + 48} ${HY + 110}a26 22 0 1 0 52 0a26 22 0 1 0 -52 0Z`;
  // ---- the zongzi at the drum's foot
  const zong = 'M346 452L398 372L450 452Z';

  const heroSil = [path(sticks), path(knobs), path(mane), path(horn), path(head), path(paws), path(whisker, { fill: 'none', stroke: '#000', 'stroke-width': 8 }), path(zong)].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-dragon`, 0.4, 0.35, 0.8, [[0, '#7ae07a'], [0.6, '#2aa85a'], [1, '#1a7a3a']]),
    lin(`${ID}-stick`, 0, 0, 1, 0, [[0, '#e8c088'], [1, '#a8743e']]),
    lin(`${ID}-leaf`, 0, 0, 0, 1, [[0, '#7ac85a'], [1, '#3a8a3a']]),
  ];


  const art = G({},
    '\n<!-- the badge: a red festival drum, its pale skin ringed with gold studs -->\n',
    bg.art,
    sparkle(84, 300, 10, '#ffe9a3'), sparkle(440, 230, 9, '#ffffff'),
    '\n<!-- the drumsticks, the dragon and the zongzi: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(sticks, { fill: u('stick') }), path(knobs, { fill: '#c8102e' }),
    path(mane, { fill: '#e8243a' }), path(horn, { fill: GOLD }),
    path(head, { fill: u('dragon') }),
    path(`M${HX - 40} ${HY - 80}a10 10 0 0 0 20 0M${HX - 10} ${HY - 88}a10 10 0 0 0 20 0M${HX + 20} ${HY - 80}a10 10 0 0 0 20 0`, { fill: 'none', stroke: '#ffd166', 'stroke-width': 3, opacity: 0.85 }),
    path(snout, { fill: '#ffe680' }),
    ellipse(HX - 22, HY + 30, 7, 5, { fill: '#2a6a2a' }), ellipse(HX + 22, HY + 30, 7, 5, { fill: '#2a6a2a' }),
    path(`M${HX - 40} ${HY + 54}Q${HX} ${HY + 86} ${HX + 40} ${HY + 54}`, { fill: '#8a1a2a' }), path(`M${HX - 30} ${HY + 58}l6 8l6 -6l6 8l6 -8l6 8l6 -8l6 8l6 -8`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
    face(HX, HY - 30, 74, 30, 'determined', { ink: INK, cheek: '#ff9a7a', mouth: 'transparent' }).replace(/<path d="M[^"]*"[^>]*stroke-width="[0-9.]+"[^>]*fill="none"[^>]*\/>$/, ''),
    path(whisker, { fill: 'none', stroke: GOLD, 'stroke-width': 6, 'stroke-linecap': 'round' }),
    path(paws, { fill: u('dragon') }), path(`M${HX - 88} ${HY + 116}v8M${HX - 74} ${HY + 118}v8M${HX + 60} ${HY + 116}v8M${HX + 74} ${HY + 118}v8`, { fill: 'none', stroke: '#1a5a2a', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    // the zongzi
    path(zong, { fill: u('leaf') }),
    path('M368 422l60 0M380 402l36 0', { fill: 'none', stroke: '#e8d0a0', 'stroke-width': 5 }),
    path('M398 372l-20 60M398 372l20 60', { fill: 'none', stroke: '#2a7a3a', 'stroke-width': 3 }),
  );
  return stickerDoc(ID, 'Dragon Boat Festival sticker: a determined little green dragon with golden horns, a red mane and curly gold whiskers peeks over a red festival drum ringed with gold studs, its paws on the rim; two drumsticks crossed behind and a zongzi at its foot', defs, sil, art);
}
