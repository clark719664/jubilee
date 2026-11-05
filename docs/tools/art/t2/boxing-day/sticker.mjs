// Boxing Day sticker: "the box is the best present" — a cheeky cardboard box with a winking face, one flap
// waving like an arm and a paper cracker crown on its head, sitting in torn wrapping paper with a red bow, on a
// Christmas-cracker-shaped badge (red with gold stars and gold bands). The box and the paper break out of it.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, roundPoly, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'boxing-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#3a1e0e';

export function sticker() {
  setPrecision(10);
  // ---- badge: a Christmas cracker lying across the sticker, pinched necks and zigzag-cut ends
  const pts = [
    [150, 172], [362, 172], [394, 222], [472, 150], [458, 182], [474, 214], [458, 246], [474, 278], [458, 310], [472, 362], [394, 290], [362, 340],
    [150, 340], [118, 290], [40, 362], [54, 330], [38, 298], [54, 266], [38, 234], [54, 202], [40, 150], [118, 222],
  ];
  const bd = roundPoly(pts, 7);
  const inside = [
    // gold bands where the paper is twisted, and a soft shine along the tube
    path('M140 150h22v214h-22zM350 150h22v214h-22z', { fill: '#ffd166' }),
    path('M140 150h22v214h-22zM350 150h22v214h-22z', { fill: 'none', stroke: '#c8901e', 'stroke-width': 3 }),
    path('M162 196H350', { fill: 'none', stroke: '#ffffff', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.22 }),
  ].join('');
  const B = { cx: 256, cy: 256, r: 230 };
  const bg = badge(ID, { d: bd, cx: 256, cy: 256, c1: '#ff3a4e', c2: '#a8102a', tile: tiled(ID, B, 56, [MARKS.star(11), MARKS.dot(4), MARKS.star(7)]), patternFill: '#ffd166', patternOpacity: 0.5, ink: '#5a0814', inside, inset: 0.86 });

  // ---- the box, in three-quarter view
  const front = 'M172 240H318V422H172Z';
  const side = 'M318 240L362 214V396L318 422Z';
  const hole = 'M172 240L216 214H362L318 240Z';
  const backFlap = 'M216 214L362 214L354 158L226 160Z';
  const waveFlap = 'M172 240L216 214L170 138L126 166Z';          // the left flap, flung up like a waving arm
  const sideFlap = 'M318 240L362 214L428 238L384 266Z';
  // ---- the paper crown on the back flap, tilted
  const crown = 'M232 166L232 120L254 140L276 108L298 138L320 104L336 132L350 122L348 162Q290 150 232 166Z';
  // ---- torn wrapping paper and a bow at its feet
  const paperL = 'M118 446L146 410L192 418L214 400L236 430L222 456L176 462Z';
  const paperR = 'M298 440L322 404L362 398L392 418L412 404L428 440L396 462L340 460Z';
  const bow = 'M396 410C372 384 352 398 372 412C352 424 368 440 396 418C420 444 438 428 418 414C438 398 420 384 396 410Z';

  const heroSil = [front, side, hole, backFlap, waveFlap, sideFlap, crown, paperL, paperR, bow].map((d) => path(d)).join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    lin(`${ID}-front`, 0, 0, 0, 1, [[0, '#e8b47a'], [1, '#c8884a']]),
    lin(`${ID}-side`, 0, 0, 0, 1, [[0, '#c08048'], [1, '#9a6030']]),
    lin(`${ID}-flap`, 0, 0, 0, 1, [[0, '#f0c48a'], [1, '#d09858']]),
    lin(`${ID}-crown`, 0, 0, 0, 1, [[0, '#ffe680'], [1, '#ffb800']]),
    lin(`${ID}-paperG`, 0, 0, 0, 1, [[0, '#3aa860'], [1, '#22804a']]),
    lin(`${ID}-paperB`, 0, 0, 0, 1, [[0, '#4a8ae8'], [1, '#2a62c0']]),
    E('clipPath', { id: `${ID}-pl` }, path(paperL)),
    E('clipPath', { id: `${ID}-pr` }, path(paperR)),
    rad(`${ID}-cheek`, 0.5, 0.5, 0.5, [[0, '#ff8a8a', 0.7], [1, '#ff8a8a', 0]]),
  ];

  // dots on the green paper, stripes on the blue
  let dots = '';
  for (let x = 120; x < 240; x += 16) for (let y = 402; y < 466; y += 16) dots += `M${P(x + ((y / 16) % 2) * 8, y)}a3 3 0 1 0 6 0a3 3 0 1 0-6 0Z`;
  let stripes = '';
  for (let x = 290; x < 440; x += 18) stripes += `M${x} 470l30 -80h7l-30 80z`;

  const art = G({},
    '\n<!-- the badge: a red Christmas cracker with gold stars and gold bands at the twists -->\n',
    bg.art,
    sparkle(88, 128, 12, '#ffe9a3'), sparkle(440, 110, 9, '#ffe9a3'), sparkle(452, 392, 7, '#ffffff'),
    '\n<!-- the box: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 12),
    // wrapping paper and the bow
    path(paperL, { fill: u('paperG') }), G({ 'clip-path': u('pl') }, path(dots, { fill: '#ffffff', opacity: 0.85 })),
    path(paperR, { fill: u('paperB') }), G({ 'clip-path': u('pr') }, path(stripes, { fill: '#ffffff', opacity: 0.8 })),
    // the inside, the flaps
    path(hole, { fill: '#6a3c1a' }),
    path(backFlap, { fill: u('flap') }), path('M226 160L354 158', { fill: 'none', stroke: '#fff0d4', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8 }),
    path(crown, { fill: u('crown') }), path('M236 158Q290 146 346 152', { fill: 'none', stroke: '#fff6c0', 'stroke-width': 4, 'stroke-linecap': 'round' }),
    path(side, { fill: u('side') }),
    path(sideFlap, { fill: '#b8783e' }), path('M368 228L414 244', { fill: 'none', stroke: '#e0a868', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    path(waveFlap, { fill: u('flap') }), path('M180 222L146 166', { fill: 'none', stroke: '#fff0d4', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 }),
    // motion marks by the waving flap
    path('M112 140q-10 14 -6 30M100 128q-16 18 -10 44', { fill: 'none', stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.85 }),
    // the front: packing tape, printed arrows, a crease, the face
    path(front, { fill: u('front') }),
    path('M172 240H318v12H172Z', { fill: '#f4d8a8', opacity: 0.9 }),
    path('M276 404v-18h-6l10-12l10 12h-6v18zM298 404v-18h-6l10-12l10 12h-6v18z', { fill: '#8a5228' }),
    path('M186 400l18 -6M184 386l12 -4', { fill: 'none', stroke: '#a8703a', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.7 }),
    path('M318 240V422', { fill: 'none', stroke: '#f4d8a8', 'stroke-width': 3, opacity: 0.6 }),
    face(245, 318, 60, 28, 'wink', { ink: INK, cheek: '#ff8a8a', mouth: '#6b1f1a' }),
    // the bow on top of the paper
    path(bow, { fill: '#e8243a' }), circle(396, 412, 7, { fill: '#c8102e' }),
    path('M392 418q-8 18 -20 24M400 418q6 18 18 22', { fill: 'none', stroke: '#e8243a', 'stroke-width': 5, 'stroke-linecap': 'round' }),
  );
  return stickerDoc(ID, 'Boxing Day sticker: a cheeky cardboard box with a winking face, one flap waving like an arm and a yellow paper cracker crown on its head, sitting in torn wrapping paper with a red bow, on a red Christmas-cracker-shaped badge with gold stars and gold bands', defs, sil, art);
}
