// Children's Day (Japan) — "Carp in the sky": a bright May morning in a family garden. A tall koinobori pole flies
// a family of carp streamers that swell and ripple in the wind — the black father, the red mother and the blue
// child — under a five-colored fukinagashi and a spinning arrow-wheel. On the engawa of the house a little boy wears
// a folded-paper samurai helmet, his sister holds up kashiwa-mochi wrapped in oak leaves, grandpa sets the small
// kabuto helmet on its stand; purple irises bloom by the pond where real carp swim under a red arched bridge, and
// Mount Fuji rises far away. The little carp swimming free across the sky are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { line, circD } from '../../kit/scenekit.mjs';

const ID = 'childrens-day-japan';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440' };
const GROUND = 700;
const POLE = { x: 1400, top: 150, base: 770 };   // outside the copy zone; the carp fly low, below it

/** A carp streamer tied at (x, y), body streaming out to the left, `len` long, rippling by `phase`. */
function carp(x, y, len, body, belly, phase) {
  const h = len * 0.2;
  const wave = (t) => Math.sin(t * Math.PI * 2.2 + phase) * h * 0.28 * t;
  let top = '', bot = '';
  const N = 10;
  for (let i = 0; i <= N; i++) {
    const t = i / N, xx = x - len * t, w = h * (1 - t * 0.35) * (t < 0.08 ? 0.9 : 1);
    top += `${i ? 'L' : 'M'}${P(xx, y - w + wave(t))}`;
    bot = `L${P(xx, y + w + wave(t))}` + bot;
  }
  const tx = x - len, ty = y + wave(1);
  const tail = `M${P(tx + 4, ty - h * 0.6)}L${P(tx - h * 1.1, ty - h * 1.3)}Q${P(tx - h * 0.6, ty)} ${P(tx - h * 1.1, ty + h * 1.3)}L${P(tx + 4, ty + h * 0.6)}Z`;
  const outline = top + bot + 'Z';
  // scales: rows of arcs along the body
  let scales = '';
  for (let i = 2; i < 9; i++) { const t = i / N, xx = x - len * t; for (const dy of [-0.45, 0, 0.45]) scales += `M${P(xx + h * 0.22, y + dy * h + wave(t) - h * 0.16)}a${f(h * 0.22)} ${f(h * 0.22)} 0 0 0 0 ${f(h * 0.32)}`; }
  return [
    path(tail, { fill: body }),
    path(outline, { fill: body }),
    path(`M${P(x - len * 0.1, y + h * 0.3 + wave(0.1))}L${P(x - len * 0.9, y + h * 0.4 + wave(0.9))}`, { fill: 'none', stroke: belly, 'stroke-width': f(h * 0.5), 'stroke-linecap': 'round', opacity: 0.9 }),
    path(scales, { fill: 'none', stroke: belly, 'stroke-width': f(Math.max(2, h * 0.06)), opacity: 0.8 }),
    // the mouth ring and the big eye
    ellipse(x, y, h * 0.18, h * 0.95, { fill: '#ffffff', stroke: '#2a2a2a', 'stroke-width': 3 }),
    circle(x - h * 0.75, y - h * 0.15 + wave(0.05), h * 0.32, { fill: '#ffffff' }), circle(x - h * 0.75, y - h * 0.15 + wave(0.05), h * 0.18, { fill: '#2a2a2a' }), circle(x - h * 0.8, y - h * 0.2 + wave(0.05), h * 0.06, { fill: '#ffffff' }),
    path(`M${P(x - h * 1.3, y - h + wave(0.1))}Q${P(x - h * 1.5, y + wave(0.1))} ${P(x - h * 1.3, y + h + wave(0.1))}`, { fill: 'none', stroke: belly, 'stroke-width': 4 }),
  ].join('');
}

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const defs = [
    lin(id('fuji'), 0, 0, 0, 1, [[0, '#ffffff'], [0.3, '#e8eef8'], [0.32, '#8aa8d0'], [1, '#6a88b8']]),
    rad(id('sun'), 0.5, 0.5, 0.5, [[0, '#fff8d8', 0.95], [0.4, '#fff0b0', 0.4], [1, '#fff0b0', 0]]),
  ];
  return compactSvg(doc(`Children's Day (Japan) · back: a clear May sky with the sun in the top-left corner and a few soft clouds; Mount Fuji rising far away on the left, snow-capped, kept below the copy zone; green hills`, defs, [
    C('the sun and two clouds, in the corners'),
    circle(140, 120, 120, { fill: url('sun') }), circle(140, 120, 46, { fill: '#fffbe8' }),
    path('M1380 140c-24 0 -30 -30 -6 -36c0 -26 36 -32 46 -12c14 -18 46 -10 44 16c22 -2 28 24 12 32z', { fill: '#ffffff', opacity: 0.9 }),
    C('Mount Fuji, far away'),
    path('M60 640L300 456L540 640Z', { fill: url('fuji') }),
    path('M220 518l20 14l14 -12l18 16l16 -14l18 12l22 -20L300 456Z', { fill: '#ffffff' }),
    C('green hills'),
    path('M-20 700V610Q300 580 640 610T1300 596T1620 604V700Z', { fill: '#8ac87a' }),
    path('M-20 700V640Q400 624 800 646T1620 632V700Z', { fill: '#6ab86a' }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('lawn'), 0, 0, 0, 1, [[0, '#7ac86a'], [1, '#4aa850']]),
    lin(id('pond'), 0, 0, 0, 1, [[0, '#7ad0e8'], [1, '#3a98c8']]),
    lin(id('wood'), 0, 0, 0, 1, [[0, '#c89a6a'], [1, '#9a6a3a']]),
    lin(id('roof'), 0, 0, 0, 1, [[0, '#5a6a7a'], [1, '#3a4a5a']]),
    lin(id('pole'), 0, 0, 1, 0, [[0, '#d8c8a8'], [0.5, '#fff4dc'], [1, '#b8a888']]),
  ];

  // ---- the lawn and the pond
  out.push(C('the garden lawn and a pond with real carp under a red arched bridge'));
  out.push(path(`M-20 ${GROUND}H1620V920H-20Z`, { fill: url('lawn') }));
  out.push(ellipse(820, 820, 300, 54, { fill: url('pond') }), ellipse(820, 820, 300, 54, { fill: 'none', stroke: '#a8a098', 'stroke-width': 8 }));
  out.push(path('M700 820q20 -10 40 0M860 830q20 -10 40 0', { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, opacity: 0.7 }));
  for (const [x, y, c, a] of [[760, 830, '#ff8a1a', 10], [880, 812, '#ffffff', -14], [820, 840, '#e8343a', 4]]) out.push(G({ transform: `translate(${x} ${y}) rotate(${a})` }, path('M-14 0q14 -8 28 0q-14 8 -28 0zM14 0l8 -6v12z', { fill: c }), circle(-8, -1, 1.6, { fill: '#2a2a2a' })));
  ppl.pond = [820, 828];
  out.push(path('M620 812Q820 700 1020 812', { fill: 'none', stroke: '#d8243a', 'stroke-width': 14 }), path('M630 790Q820 680 1010 790', { fill: 'none', stroke: '#d8243a', 'stroke-width': 6 }));
  { let posts = ''; for (let k = 0; k <= 8; k++) { const t = k / 8, x = 630 + 380 * t, y = 790 - Math.sin(t * Math.PI) * 76; posts += `M${f(x)} ${f(y)}V${f(y + 22 - Math.sin(t * Math.PI) * 6)}`; } out.push(line(posts, '#d8243a', 5)); }
  // irises by the pond
  {
    let leaves = '', petals = '';
    for (const [x, y] of [[540, 830], [568, 822], [1060, 824], [1090, 832], [1118, 820]]) { leaves += `M${x} ${y}q-6 -40 -2 -70M${x + 6} ${y}q8 -36 4 -62`; petals += `M${x - 2} ${y - 72}q-14 -4 -12 10q10 2 12 -10zM${x - 2} ${y - 72}q14 -4 12 10q-10 2 -12 -10zM${x - 2} ${y - 72}q-4 -18 0 -22q4 4 0 22z`; }
    out.push(line(leaves, '#3a8a4a', 4), path(petals, { fill: '#7a4ad8' }));
    ppl.iris = [1090, 760];
  }

  // ---- the house on the left: an engawa veranda, sliding shoji screens, a tiled roof
  out.push(C('the house on the left: a tiled roof, sliding shoji screens and a wooden engawa veranda'));
  out.push(path(`M-20 ${GROUND + 20}V470H460V${GROUND + 20}Z`, { fill: '#f4ece0' }));
  out.push(path('M-40 476L40 436H440L500 476Z', { fill: url('roof') }), path('M-40 476H500v10H-40Z', { fill: '#2a3a4a' }));
  { let shoji = ''; for (let x = 20; x < 440; x += 100) { shoji += `M${x} 500h90v190h-90z`; } out.push(path(shoji, { fill: '#fffaf0' })); let grid = ''; for (let x = 20; x < 440; x += 100) { for (let k = 1; k < 3; k++) grid += `M${x + k * 30} 500v190`; for (let k = 1; k < 6; k++) grid += `M${x} ${500 + k * 32}h90`; grid += `M${x} 500h90v190h-90z`; } out.push(line(grid, '#a87a4a', 3)); }
  out.push(path(`M-20 ${GROUND}H480v20H-20Z`, { fill: url('wood') }), path(`M10 ${GROUND + 20}v40h12v-40zM420 ${GROUND + 20}v40h12v-40z`, { fill: '#7a5030' }));
  // the kabuto display: a small samurai helmet on a stand
  out.push(path('M326 700h80v-10h-80z', { fill: '#2a2a2a' }), path('M336 690q0 -40 30 -44q30 4 30 44z', { fill: '#2a3a5a' }), path('M328 692q38 -12 76 0', { fill: 'none', stroke: '#d8a020', 'stroke-width': 5 }), path('M366 646l-24 -26l18 4l6 -10l6 10l18 -4z', { fill: '#ffc83a' }));
  ppl.kabuto = [366, 660];

  // ---- the family on the engawa
  out.push(C('on the engawa: a little boy in a folded-paper samurai helmet holding a toy sword, his sister holding up kashiwa-mochi, grandpa in a yukata'));
  {
    const sword = { sx: 1, elbow: [0.9, -0.6], hand: [1.3, -1.8] };
    const b = figure({ x: 140, foot: GROUND, H: 82, heads: 2.6, skin: SKIN.light, hair: '#1a1210', style: 'short', top: '#2a6ad8', bottom: '#2a2a3a', shoe: '#ffffff', gaze: 0.5, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, sword] });
    out.push(b.svg);
    const r = b.r, hy = b.headY;
    out.push(path(`M${P(140 - r * 1.3, hy - r * 0.3)}L${P(140, hy - r * 1.9)}L${P(140 + r * 1.3, hy - r * 0.3)}Z`, { fill: '#e8243a' }), path(`M${P(140 - r * 1.3, hy - r * 0.3)}l${f(-r * 0.3)} ${f(r * 0.5)}h${f(r * 3.2)}l${f(-r * 0.3)} ${f(-r * 0.5)}z`, { fill: '#c8102e' }), path(`M${P(140 - r * 0.5, hy - r * 1.3)}l${f(-r * 0.4)} ${f(-r * 0.7)}M${P(140 + r * 0.5, hy - r * 1.3)}l${f(r * 0.4)} ${f(-r * 0.7)}`, { fill: 'none', stroke: '#ffd23a', 'stroke-width': 4, 'stroke-linecap': 'round' }));
    const sh = b.hand(sword);
    out.push(line(`M${P(sh[0], sh[1] + 6)}l10 -60`, '#d8dce8', 5), path(`M${P(sh[0] - 8, sh[1] - 2)}h16v6h-16z`, { fill: '#ffd23a' }), circle(sh[0], sh[1], r * 0.36, { fill: SKIN.light }));
    ppl.helmet = [140, hy - r];
    const mochi = { sx: 1, elbow: [0.8, -0.4], hand: [1.2, -1.2] };
    const g = figure({ x: 240, foot: GROUND, H: 86, heads: 2.7, skin: SKIN.fair, hair: '#1a1210', style: 'bob', top: '#ff8fb8', bottom: '#ff8fb8', shoe: '#ffffff', gaze: 0.5, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, mochi] });
    out.push(g.svg, path(`M${P(240 - g.tw * 0.5, g.torsoBot - 16)}h${f(g.tw)}v8h${f(-g.tw)}z`, { fill: '#ffd23a' }));
    const mh = g.hand(mochi);
    out.push(path(`M${P(mh[0] - 16, mh[1] - 8)}q16 -26 32 0q-16 10 -32 0z`, { fill: '#5a9a4a' }), path(`M${P(mh[0] - 10, mh[1] - 8)}q10 -14 20 0z`, { fill: '#fff8ec' }), path(`M${P(mh[0], mh[1] - 22)}v14`, { fill: 'none', stroke: '#3a7a3a', 'stroke-width': 2 }), circle(mh[0], mh[1], g.r * 0.36, { fill: SKIN.fair }));
    ppl.mochi = [mh[0], mh[1] - 12];
    const gp = figure({ x: 430, foot: GROUND, H: 112, heads: 3.2, skin: SKIN.fair, hair: '#dcd8e0', style: 'short', top: '#3a5a8a', bottom: '#3a5a8a', gaze: -0.4, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.8, 0.6], hand: [-1.2, 0.6] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.8] }] });
    out.push(gp.svg, path(`M${P(430 - gp.tw * 0.5, gp.torsoTop + 2)}l${f(gp.tw * 0.5)} ${f(gp.r * 1.2)}l${f(gp.tw * 0.5)} ${f(-gp.r * 1.2)}`, { fill: 'none', stroke: '#f4ece0', 'stroke-width': 4 }), path(`M${P(430 - gp.tw * 0.5, gp.torsoBot - 30)}h${f(gp.tw)}v10h${f(-gp.tw)}z`, { fill: '#2a2a3a' }));
  }

  // ---- the koinobori pole (the focal point)
  out.push(C('the focal point: the tall koinobori pole with its spinning arrow-wheel, the five-colored fukinagashi and a family of carp streamers rippling in the wind: the black father, the red mother and the blue child'));
  {
    const { x, top, base } = POLE;
    out.push(ellipse(x, base + 2, 40, 6, { fill: '#000', opacity: 0.2 }));
    out.push(path(`M${x - 8} ${base}V${top}h16V${base}Z`, { fill: url('pole') }));
    out.push(line(`M${x} ${top + 4}L${x - 120} ${base}M${x} ${top + 4}L${x + 150} ${base}`, '#c8b8a0', 1.6, { opacity: 0.7 }));
    // the arrow-wheel at the top
    let spokes = '';
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; spokes += `M${x} ${top - 18}L${P(x + Math.cos(a) * 30, top - 18 + Math.sin(a) * 30)}`; }
    out.push(line(spokes, '#d8a020', 4), circle(x, top - 18, 8, { fill: '#ffd23a' }), path(`M${x - 6} ${top - 30}l6 -22l6 22z`, { fill: '#ffd23a' }));
    // the fukinagashi: five ribbons streaming left
    const ribbon = ['#2a6ad8', '#e8243a', '#ffffff', '#ffd23a', '#2a2a2a'];
    for (let k = 0; k < 5; k++) { const y = top + 16 + k * 10; out.push(path(`M${x} ${y}q-30 ${k * 3 - 6} -54 ${k * 4}q-24 ${-k * 3 + 8} -46 ${k * 4 - 4}v10q22 ${-k * 3 + 8} 46 ${-k * 4 + 4}q24 ${k * 3 - 6} 54 ${-k * 4}z`, { fill: ribbon[k] })); }
    // the carp, biggest at the top
    out.push(line(`M${x} ${top + 70}V470`, '#c8b8a0', 2));
    out.push(carp(x - 6, 478, 400, '#2a2a3a', '#ffd23a', 0.2));
    out.push(carp(x - 6, 572, 340, '#e8243a', '#ffffff', 1.4));
    out.push(carp(x - 6, 652, 270, '#2a8ad8', '#bfeaff', 2.6));
    ppl.pole = [x, top];
    ppl.blackCarp = [x - 200, 478];
    ppl.blueCarp = [x - 140, 652];
  }

  // ---- a girl on the lawn flying a little carp on a stick, and a dog
  out.push(C('a little girl running on the lawn with a small carp streamer on a stick'));
  {
    const run = { sx: 1, elbow: [0.9, -0.8], hand: [1.3, -2.0] };
    const k = figure({ x: 1230, foot: 860, H: 72, heads: 2.6, skin: SKIN.tan, hair: '#1a1210', style: 'puffs', top: '#ffd23a', bottom: '#2a6ad8', shoe: '#e8243a', gaze: -0.3, mouth: 'open', arms: [{ sx: -1, elbow: [-0.9, 0.4], hand: [-1.2, 1.0] }, run] });
    out.push(k.svg);
    const h = k.hand(run);
    out.push(line(`M${P(h[0], h[1] + 10)}l6 -60`, '#c8945a', 4), carp(h[0] + 6, h[1] - 50, 90, '#ff8a1a', '#ffe08a', 0.8), circle(h[0], h[1], k.r * 0.36, { fill: SKIN.tan }));
    ppl.littleCarp = [h[0] - 30, h[1] - 50];
  }

  return { svg: compactSvg(doc(`Children's Day (Japan) · mid. Concept: "carp in the sky" on a bright May morning in a family garden. Focal point: the tall koinobori pole (x 700–1220, y 80–760) with its spinning arrow-wheel, the five-colored fukinagashi and a family of carp streamers rippling in the wind — the black father, the red mother and the blue child. On the engawa of the house on the left a little boy in a folded-paper samurai helmet holds a toy sword, his sister holds up kashiwa-mochi wrapped in an oak leaf, grandpa in a yukata sits by the small kabuto helmet on its stand. Real carp swim in the pond under a red arched bridge with purple irises; a girl runs with a little orange carp on a stick. Mount Fuji rises far away. Light story: clear spring sunshine. The little carp swimming free are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Children's Day (Japan) · front: a stone lantern bottom left and irises bottom right; the center stays open`, [], [
    C('a stone lantern'),
    path('M40 900v-30h80v30zM56 870v-50h48v50zM30 820l50 -30l50 30z', { fill: '#a8a098' }), path('M62 862v-34h36v34z', { fill: '#fff4c8' }),
    C('irises'),
    path('M1520 900q-4 -60 -14 -100M1550 900q4 -70 0 -120M1580 900q10 -60 16 -96', { fill: 'none', stroke: '#3a8a4a', 'stroke-width': 5 }),
    path('M1502 798q-16 -6 -14 10q12 4 14 -10zM1502 798q16 -6 14 10q-12 4 -14 -10zM1550 778q-16 -6 -14 10q12 4 14 -10zM1550 778q16 -6 14 10q-12 4 -14 -10zM1596 802q-16 -6 -14 10q12 4 14 -10zM1596 802q16 -6 14 10q-12 4 -14 -10z', { fill: '#7a4ad8' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'color', x: r(ppl.blackCarp[0]), y: r(ppl.blackCarp[1]), r: 60, label: 'Color a carp streamer' },
      { activity: 'dressup', x: r(ppl.helmet[0]), y: r(ppl.helmet[1] + 30), r: 44, label: 'Fold a samurai helmet' },
      { activity: 'catch', x: r(ppl.littleCarp[0]), y: r(ppl.littleCarp[1]), r: 44, label: 'Catch the flying carp' },
      { activity: 'memory', x: r(ppl.mochi[0]), y: r(ppl.mochi[1]), r: 36, label: 'Match the Children\'s Day treats' },
    ],
    findables: [
      { id: 'kabuto', label: 'the little samurai helmet', x: ppl.kabuto[0], y: ppl.kabuto[1], r: 24 },
      { id: 'pond-carp', label: 'carp in the pond', x: ppl.pond[0], y: ppl.pond[1], r: 40 },
      { id: 'iris', label: 'purple irises', x: ppl.iris[0], y: ppl.iris[1], r: 30 },
      { id: 'fuji', label: 'Mount Fuji', x: 300, y: 540, r: 40 },
      { id: 'wheel', label: 'the spinning wheel on the pole', x: ppl.pole[0], y: ppl.pole[1] - 18, r: 24 },
      { id: 'blue-carp', label: 'the little blue carp', x: r(ppl.blueCarp[0]), y: r(ppl.blueCarp[1]), r: 36 },
      { id: 'bridge', label: 'the red bridge', x: 820, y: 730, r: 40 },
    ],
  };
}
