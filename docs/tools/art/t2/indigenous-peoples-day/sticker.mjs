// Indigenous Peoples' Day sticker ("The Three Sisters"): the three plants that many Indigenous peoples have grown
// together for thousands of years, as three friends: a tall ear of many-colored flint corn, beaming, with its husks
// open like arms; a round orange squash at its feet; and a bean pod whose vine curls up the corn. The badge is a
// sunrise over green hills and a lake. The corn's tassel breaks out of the top, the squash and bean out of the bottom.
import { f, P, E, G, path, circle, ellipse, lin, rad, rng, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, circleD, burstD, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'indigenous-peoples-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#3a1a0a';
const CORN = ['#ffd166', '#c8102e', '#6a3a9a', '#f4f0e0', '#e8641a', '#2a3a7a', '#ffb703'];

export function sticker() {
  setPrecision(10);
  const C0 = { x: 256, y: 268 };
  const bd = circleD(C0.x, C0.y, 196);
  const inside = [
    path(burstD(256, 316, 150, 104, 16, 6), { fill: '#ffe08a', opacity: 0.55 }),
    circle(256, 316, 92, { fill: '#fff0b0' }),
    path('M40 352C120 320 190 330 256 350C330 372 400 330 480 340V480H40Z', { fill: '#5aa85a' }),
    path('M40 396C140 380 220 392 300 404C380 416 430 400 480 396V480H40Z', { fill: '#3a8a8a' }),
    path('M110 414h70M300 424h90M200 440h60', { fill: 'none', stroke: '#bfe8e0', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.7 }),
  ].join('');
  const bg = badge(ID, { d: bd, cx: C0.x, cy: C0.y, c1: '#ff9a4a', c2: '#ffd070', ink: '#7a3a0a', stitch: '#fff4d8', inside, inset: 0.9 });

  // ---- the hero
  const cob = 'M256 78C312 78 330 160 330 236C330 312 300 372 256 372C212 372 182 312 182 236C182 160 200 78 256 78Z';
  const tassel = 'M256 82C250 60 236 46 220 38C238 40 250 50 256 62C262 50 274 40 292 38C276 46 262 60 256 82Z';
  const huskL = 'M256 404C200 400 150 360 126 286C120 266 124 236 136 222C150 270 190 320 256 352Z';
  const huskR = 'M256 404C312 400 362 360 386 286C392 266 388 236 376 222C362 270 322 320 256 352Z';
  const squash = 'M72 410C72 370 108 350 154 350C200 350 236 370 236 410C236 446 200 462 154 462C108 462 72 446 72 410Z';
  const sqStem = 'M146 352l-4 -24h18l-2 24z';
  const bean = circleD(336, 440, 24) + circleD(364, 416, 25) + circleD(392, 392, 24) + 'M404 376C412 362 420 352 430 348C428 362 420 380 408 392Z';
  const heroSil = [cob, tassel, huskL, huskR, squash, sqStem, bean].map((d) => path(d)).join('');
  const sil = [bg.sil, heroSil].join('');

  // kernels: offset rows of round kernels in many colors, clipped to the cob
  const R = rng(7);
  const byCol = {};
  for (let row = 0, y = 88; y < 372; row++, y += 17) for (let x = 186 + (row % 2) * 9; x < 330; x += 18) (byCol[CORN[Math.floor(R() * CORN.length)]] ??= []).push(`M${f(x - 8)} ${f(y)}a8 8 0 1 0 16 0a8 8 0 1 0 -16 0`);

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    lin(`${ID}-husk`, 0, 0, 0, 1, [[0, '#c8d880'], [1, '#7aa04a']]),
    rad(`${ID}-squash`, 0.36, 0.3, 0.75, [[0, '#ffc060'], [0.6, '#f08a1a'], [1, '#c8601a']]),
    lin(`${ID}-bean`, 0, 0, 1, 1, [[0, '#a8e070'], [1, '#4a9a3a']]),
    E('clipPath', { id: `${ID}-cc` }, path(cob)),
  ];

  const art = G({},
    '\n<!-- the badge: a sunrise over green hills and a lake -->\n',
    bg.art,
    sparkle(108, 150, 12, '#ffffff'), sparkle(410, 168, 9, '#fff4d8'),
    '\n<!-- the Three Sisters, corn, squash and bean: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(tassel, { fill: '#e8c060' }),
    path(cob, { fill: '#ffe8a0' }),
    G({ 'clip-path': u('cc') }, ...Object.entries(byCol).map(([c, ds]) => path(ds.join(''), { fill: c })),
      path('M214 120q10 -26 30 -30', { fill: 'none', stroke: '#ffffff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.6 })),
    // a soft cream patch behind the face so it reads on the kernels
    ellipse(256, 222, 56, 40, { fill: '#fff4d0' }),
    face(256, 214, 52, 22, 'joy', { ink: INK, cheek: '#ff9a7a' }),
    path(huskL, { fill: u('husk') }), path(huskR, { fill: u('husk') }),
    path('M250 396C200 380 160 340 142 270M262 396C312 380 352 340 370 270', { fill: 'none', stroke: '#5a8a3a', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.6 }),
    // the bean vine curling up the corn
    path('M360 400C400 360 330 340 350 300C368 266 330 250 340 220', { fill: 'none', stroke: '#3a8a3a', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    path('M340 222q12 -14 24 -4q-12 12 -24 4z', { fill: '#5aa84a' }),
    path(squash, { fill: u('squash') }), path(sqStem, { fill: '#6a8a2a' }),
    path('M112 360C100 400 104 440 118 456M154 352V462M196 360C208 400 204 440 190 456', { fill: 'none', stroke: '#d8701a', 'stroke-width': 3.4, 'stroke-linecap': 'round' }),
    path('M96 378q16 -18 40 -20', { fill: 'none', stroke: '#ffe0b0', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.7 }),
    face(154, 412, 44, 16, 'happy', { ink: INK, cheek: '#ff8a6a' }),
    path(bean, { fill: u('bean') }), path('M322 430q8 -12 20 -14M378 384q8 -12 20 -14', { fill: 'none', stroke: '#e0ffc0', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 }),
    face(364, 416, 28, 11, 'wink', { ink: INK, cheek: '#ff9a7a' }),
  );
  return stickerDoc(ID, "Indigenous Peoples' Day sticker: the Three Sisters as friends, a beaming ear of many-colored flint corn with its husks open like arms, a round orange squash and a bean pod whose vine curls up the corn, in front of a sunrise over green hills and a lake", defs, sil, art);
}
