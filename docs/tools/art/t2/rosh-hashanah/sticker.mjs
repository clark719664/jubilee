// Rosh Hashanah sticker ("Sweet New Year"): a big shiny red apple, grinning, with golden honey drizzled over its top
// from a wooden honey dipper; a fat little bee buzzes up to taste it. The badge is a honeycomb hexagon, warm gold
// with a hex-cell pattern and honey running down from its top edge. The dipper and the bee break out of the badge.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, polyD, capsule, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'rosh-hashanah-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#4a1a0a';

/** Hex cell outlines filling a box (pointy sides left/right). */
function combD(x0, y0, x1, y1, s) {
  let d = '';
  const h = (s * Math.sqrt(3)) / 2;
  for (let row = 0, y = y0; y < y1; row++, y += h) for (let x = x0 + (row % 2) * s * 0.75; x < x1; x += s * 1.5) {
    d += `M${P(x - s / 2, y)}l${f(s / 4)} ${f(-h / 2)}h${f(s / 2)}l${f(s / 4)} ${f(h / 2)}l${f(-s / 4)} ${f(h / 2)}h${f(-s / 2)}z`;
  }
  return d;
}

/** An apple centred at (cx, cy), radius r, with the dimple at the top. */
const appleD = (cx, cy, r) => `M${P(cx, cy - r * 0.74)}C${P(cx - r * 0.28, cy - r * 1.02)} ${P(cx - r * 1.02, cy - r * 0.98)} ${P(cx - r * 1.02, cy - r * 0.12)}C${P(cx - r * 1.02, cy + r * 0.7)} ${P(cx - r * 0.46, cy + r * 1.02)} ${P(cx - r * 0.12, cy + r * 0.94)}Q${P(cx, cy + r * 0.9)} ${P(cx + r * 0.12, cy + r * 0.94)}C${P(cx + r * 0.46, cy + r * 1.02)} ${P(cx + r * 1.02, cy + r * 0.7)} ${P(cx + r * 1.02, cy - r * 0.12)}C${P(cx + r * 1.02, cy - r * 0.98)} ${P(cx + r * 0.28, cy - r * 1.02)} ${P(cx, cy - r * 0.74)}Z`;

export function sticker() {
  setPrecision(10);
  const C0 = { x: 256, y: 262 };
  const bd = polyD(C0.x, C0.y, 212, 6, 30, -90);
  const comb = path(combD(30, 40, 490, 490, 34), { fill: 'none', stroke: '#c8820a', 'stroke-width': 4, opacity: 0.5 });
  // honey running down from the badge's top edge
  const runny = 'M20 30H492V128C470 128 466 150 456 150C446 150 444 120 420 120C396 120 400 176 384 176C368 176 372 128 340 128C312 128 316 146 300 146C284 146 286 120 256 120C226 120 230 160 212 160C194 160 196 126 168 126C140 126 146 186 128 186C110 186 114 130 90 130C66 130 64 150 50 150C36 150 34 128 20 128Z';
  const inside = [comb, path(runny, { fill: u('runny') }), path('M60 66H452', { fill: 'none', stroke: '#fff4c0', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.5 })].join('');
  const bg = badge(ID, { d: bd, cx: C0.x, cy: C0.y, c1: '#ffe8a0', c2: '#ffc040', ink: '#8a4a0a', stitch: '#fff4c0', inside, inset: 0.86 });

  // ---- the hero: apple, dipper, bee
  const A = { x: 238, y: 314, r: 132 };
  const apple = appleD(A.x, A.y, A.r);
  const stem = capsule(A.x + 6, A.y - A.r * 0.86, 40, 7, -12);
  const leaf = `M${P(A.x + 12, A.y - A.r * 0.92)}C${P(A.x + 30, A.y - A.r * 1.3)} ${P(A.x + 90, A.y - A.r * 1.3)} ${P(A.x + 108, A.y - A.r * 1.12)}C${P(A.x + 80, A.y - A.r * 0.88)} ${P(A.x + 40, A.y - A.r * 0.84)} ${P(A.x + 12, A.y - A.r * 0.92)}Z`;
  const handle = capsule(428, 86, 54, 12, -42);
  const dipper = 'M332 168C318 154 322 128 342 116L384 92C404 82 426 92 432 112C438 132 428 148 412 158L372 180C356 188 342 182 332 168Z';
  const drop = `M${P(352, 196)}C${P(360, 210)} ${P(366, 220)} ${P(358, 228)}C${P(350, 234)} ${P(342, 226)} ${P(346, 216)}Z`;
  const bee = 'M50 120a38 30 0 1 0 76 0a38 30 0 1 0 -76 0ZM80 98a14 22 0 1 1 22 -12ZM104 94a12 20 0 1 1 22 0Z';
  const heroSil = [apple, stem, leaf, handle, dipper, drop, bee].map((d) => path(d)).join('');
  const sil = [bg.sil, heroSil].join('');

  // honey drizzled over the apple's top, with drips
  const cap = `M${P(A.x - A.r * 1.1, A.y - A.r * 1.2)}H${f(A.x + A.r * 1.1)}V${f(A.y - A.r * 0.5)}C${P(A.x + A.r * 0.9, A.y - A.r * 0.5)} ${P(A.x + A.r * 0.82, A.y - A.r * 0.2)} ${P(A.x + A.r * 0.72, A.y - A.r * 0.2)}C${P(A.x + A.r * 0.6, A.y - A.r * 0.2)} ${P(A.x + A.r * 0.62, A.y - A.r * 0.52)} ${P(A.x + A.r * 0.4, A.y - A.r * 0.52)}C${P(A.x + A.r * 0.2, A.y - A.r * 0.52)} ${P(A.x + A.r * 0.24, A.y - A.r * 0.4)} ${P(A.x + A.r * 0.06, A.y - A.r * 0.42)}C${P(A.x - A.r * 0.14, A.y - A.r * 0.44)} ${P(A.x - A.r * 0.2, A.y - A.r * 0.08)} ${P(A.x - A.r * 0.34, A.y - A.r * 0.08)}C${P(A.x - A.r * 0.48, A.y - A.r * 0.08)} ${P(A.x - A.r * 0.46, A.y - A.r * 0.5)} ${P(A.x - A.r * 0.66, A.y - A.r * 0.5)}C${P(A.x - A.r * 0.86, A.y - A.r * 0.5)} ${P(A.x - A.r * 0.84, A.y - A.r * 0.3)} ${P(A.x - A.r * 1.1, A.y - A.r * 0.34)}Z`;

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-apple`, 0.36, 0.3, 0.78, [[0, '#ff7a6a'], [0.5, '#e8243a'], [1, '#a80a1e']]),
    lin(`${ID}-runny`, 0, 0, 0, 1, [[0, '#f09a10'], [1, '#d87a08']]),
    lin(`${ID}-honey`, 0, 0, 0, 1, [[0, '#ffe080'], [1, '#ffaa1a']]),
    lin(`${ID}-wood`, 0, 0, 1, 1, [[0, '#e8b878'], [1, '#a8743e']]),
    rad(`${ID}-bee`, 0.4, 0.35, 0.75, [[0, '#ffe680'], [1, '#ffb800']]),
    E('clipPath', { id: `${ID}-ac` }, path(apple)),
    E('clipPath', { id: `${ID}-bc` }, path('M50 120a38 30 0 1 0 76 0a38 30 0 1 0 -76 0Z')),
  ];

  const art = G({},
    '\n<!-- the badge: a honeycomb hexagon with honey running down from its top edge -->\n',
    bg.art,
    sparkle(84, 396, 12, '#ffffff'), sparkle(440, 330, 9, '#fff4c0'),
    '\n<!-- the apple, the honey dipper and the bee: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(stem, { fill: '#6a3a1a' }), path(leaf, { fill: '#4aa84a' }), path(`M${P(A.x + 18, A.y - A.r * 0.93)}Q${P(A.x + 60, A.y - A.r * 1.12)} ${P(A.x + 100, A.y - A.r * 1.1)}`, { fill: 'none', stroke: '#2a7a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    path(apple, { fill: u('apple') }),
    G({ 'clip-path': u('ac') },
      path(cap, { fill: u('honey') }),
      path(`M${P(A.x - A.r * 0.7, A.y - A.r * 0.72)}q${f(A.r * 0.3)} ${f(-A.r * 0.16)} ${f(A.r * 0.6)} ${f(-A.r * 0.1)}`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.75 }),
      path(`M${P(A.x - A.r * 0.82, A.y + A.r * 0.1)}q${f(-A.r * 0.02)} ${f(A.r * 0.3)} ${f(A.r * 0.2)} ${f(A.r * 0.5)}`, { fill: 'none', stroke: '#ff9a8a', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.6 })),
    face(A.x, A.y + A.r * 0.14, 76, 30, 'joy', { ink: INK, cheek: '#ff9a8a' }),
    // the honey dipper and a falling drop
    path(handle, { fill: u('wood') }), path(dipper, { fill: u('honey') }),
    path('M344 128l36 -22M342 146l52 -30M354 162l44 -26', { fill: 'none', stroke: '#c8780a', 'stroke-width': 4, 'stroke-linecap': 'round' }),
    path(drop, { fill: u('honey') }),
    // the bee
    path('M80 98a14 22 0 1 1 22 -12ZM104 94a12 20 0 1 1 22 0Z', { fill: '#e4f2ff' }),
    path('M50 120a38 30 0 1 0 76 0a38 30 0 1 0 -76 0Z', { fill: u('bee') }),
    G({ 'clip-path': u('bc') }, path('M84 80v80M104 80v80', { fill: 'none', stroke: '#3a2a1a', 'stroke-width': 9 })),
    face(68, 120, 24, 11, 'happy', { ink: INK, cheek: '#ff9a6a' }),
  );
  return stickerDoc(ID, 'Rosh Hashanah sticker: a big grinning red apple with honey drizzled over its top from a wooden honey dipper, and a little bee buzzing up to taste it, on a honeycomb hexagon badge with honey running down its top edge', defs, sil, art);
}
