// Grandparents Day — "Stories on the porch": a golden early-September afternoon at grandma and grandpa's cottage.
// On the porch swing grandma shows her granddaughter an old photo album; in the vegetable patch grandpa and his
// grandson, in matching straw hats, lift a giant prize tomato; a kitten tangles a ball of yarn from grandma's
// knitting basket; tall sunflowers, an apple tree with a basket of picked apples, a birdhouse and a sleepy old dog.
// The floating hearts are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, dog, line, circD } from '../../kit/scenekit.mjs';

const ID = 'grandparents-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const YARD = 720;

/** A straw hat on a head at (cx, cy) radius r. */
const strawHat = (cx, cy, r, band) => ellipse(cx, cy - r * 0.62, r * 1.7, r * 0.34, { fill: '#e8c870' }) + path(`M${P(cx - r * 0.86, cy - r * 0.66)}C${P(cx - r * 0.84, cy - r * 1.6)} ${P(cx + r * 0.84, cy - r * 1.6)} ${P(cx + r * 0.86, cy - r * 0.66)}Z`, { fill: '#f0d488' }) + path(`M${P(cx - r * 0.86, cy - r * 0.82)}Q${P(cx, cy - r * 0.98)} ${P(cx + r * 0.86, cy - r * 0.82)}`, { fill: 'none', stroke: band, 'stroke-width': f(r * 0.18) });

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(6);
  let hedge = '';
  for (let x = -20; x < 1640; x += 60 + R() * 40) hedge += circD(x, 640 + R() * 12, 44 + R() * 20);
  const defs = [rad(id('sun'), 0.5, 0.5, 0.5, [[0, '#fff4d0', 0.95], [0.4, '#ffd8a0', 0.4], [1, '#ffd8a0', 0]])];
  return compactSvg(doc(`Grandparents Day · back: a warm golden afternoon sun in the top-right corner; soft rolling fields and a hedge, kept low`, defs, [
    C('the afternoon sun, top right'),
    circle(1470, 130, 130, { fill: url('sun') }), circle(1470, 130, 44, { fill: '#fffaf0' }),
    C('fields and a hedge'),
    path('M-20 660V590Q300 560 640 584T1300 570T1620 580V660Z', { fill: '#c8d890' }),
    path(hedge, { fill: '#7aa860' }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('lawn'), 0, 0, 0, 1, [[0, '#9ad07a'], [1, '#6ab05a']]),
    lin(id('siding'), 0, 0, 0, 1, [[0, '#fff4e8'], [1, '#f0dcc8']]),
    lin(id('wood'), 0, 0, 0, 1, [[0, '#b8845a'], [1, '#8a5a32']]),
    lin(id('soil'), 0, 0, 0, 1, [[0, '#8a5a3a'], [1, '#6a4028']]),
    rad(id('win'), 0.5, 0.6, 0.75, [[0, '#fff3cf'], [0.5, '#ffd98a'], [1, '#f0a84a']]),
  ];

  // ---- the lawn
  out.push(C('the lawn'));
  out.push(path(`M-20 ${YARD - 40}H1620V920H-20Z`, { fill: url('lawn') }));

  // ---- the cottage on the left with its porch and swing
  out.push(C('the cottage on the left: white siding, a blue door, a porch with a hanging swing'));
  out.push(path(`M-20 ${YARD}V470L210 340L440 470V${YARD}Z`, { fill: url('siding') }), path('M-30 474L210 330L450 474', { fill: 'none', stroke: '#c84a3a', 'stroke-width': 20, 'stroke-linejoin': 'round' }));
  { let s = ''; for (let y = 490; y < YARD; y += 16) s += `M-20 ${y}H440`; out.push(line(s, '#e8d4c0', 1.6)); }
  out.push(path('M40 500h70v80h-70z', { fill: url('win') }), path('M75 500v80M40 540h70', { fill: 'none', stroke: '#ffffff', 'stroke-width': 4 }), path('M30 500h10v80h-10zM110 500h10v80h-10z', { fill: '#5a8ac8' }));
  out.push(path(`M150 ${YARD}V560h70V${YARD}Z`, { fill: '#5a8ac8' }), circle(208, 640, 4, { fill: '#ffd166' }));
  // porch roof and posts, swing
  out.push(path('M120 520H460v-16H110Z', { fill: '#c84a3a' }), path(`M130 520V${YARD}h10V520ZM440 520V${YARD}h10V520Z`, { fill: '#ffffff' }), path(`M110 ${YARD}h360v14H110Z`, { fill: url('wood') }));
  out.push(line('M262 520v132M398 520v132', '#8a7a6a', 2.4), path('M250 600h160v8h-160zM252 600v52M408 600v52', { fill: url('wood') }));
  ppl.swing = [330, 640];

  // ---- grandma and her granddaughter on the swing with the photo album
  out.push(C('grandma and her granddaughter on the swing, looking at an old photo album together'));
  {
    const seat = 690;
    const book = { sx: 1, elbow: [0.7, 1.2], hand: [1.3, 2.3] };
    const gm = figure({ x: 290, foot: seat, H: 118, heads: 3.2, skin: SKIN.fair, hair: '#e6e2ee', style: 'bun', top: '#8a4ab0', bottom: '#5a3a7a', gaze: 0.4, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.5, 1.0], hand: [-0.1, 1.5] }, book] });
    out.push(gm.svg);
    out.push(path(`M${P(290 - gm.r * 0.5, gm.headY - gm.r * 0.05)}a${f(gm.r * 0.3)} ${f(gm.r * 0.3)} 0 1 0 ${f(gm.r * 0.6)} 0a${f(gm.r * 0.3)} ${f(gm.r * 0.3)} 0 1 0 ${f(-gm.r * 0.6)} 0zM${P(290 + gm.r * 0.14, gm.headY - gm.r * 0.05)}a${f(gm.r * 0.3)} ${f(gm.r * 0.3)} 0 1 0 ${f(gm.r * 0.6)} 0a${f(gm.r * 0.3)} ${f(gm.r * 0.3)} 0 1 0 ${f(-gm.r * 0.6)} 0z`, { fill: 'none', stroke: '#8a6a4a', 'stroke-width': 2.4 }));
    const g = figure({ x: 372, foot: seat + 4, H: 100, heads: 2.8, skin: SKIN.brown, hair: '#1a1210', style: 'puffs', top: '#ffd166', bottom: '#2a5aa8', shoe: '#ff6a9a', gaze: -0.3, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 0.8], hand: [-1.0, 0.6] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.4, 1.6] }] });
    out.push(g.svg);
    const bh = gm.hand(book);
    out.push(path(`M${P(bh[0] - 6, bh[1] - 30)}h40v30h-40zM${P(bh[0] + 34, bh[1] - 30)}h40v30h-40z`, { fill: '#7a3a2a' }), path(`M${P(bh[0] - 2, bh[1] - 26)}h34v22h-34zM${P(bh[0] + 38, bh[1] - 26)}h34v22h-34z`, { fill: '#f8f0e0' }));
    out.push(path(`M${P(bh[0] + 2, bh[1] - 22)}h14v12h-14zM${P(bh[0] + 18, bh[1] - 20)}h12v14h-12zM${P(bh[0] + 42, bh[1] - 22)}h26v16h-26z`, { fill: '#c8a888' }));
    ppl.album = [bh[0] + 34, bh[1] - 16];
    // the swing seat in front of their laps, so they sit on it with their legs dangling
    out.push(path('M246 654h168v12h-168z', { fill: url('wood') }), path('M246 654h168', { fill: 'none', stroke: '#d8a878', 'stroke-width': 2 }));
  }

  // ---- the knitting basket and the kitten with the yarn
  out.push(C('grandma\'s knitting basket on the porch; a kitten tangles a ball of yarn'));
  out.push(path('M440 714l6 -30h54l6 30z', { fill: '#c8945a' }), circle(460, 680, 12, { fill: '#5ab8e8' }), circle(484, 682, 11, { fill: '#ff8a9a' }), line('M468 672l24 -26M476 674l26 -20', '#c8c8d0', 3));
  out.push(line('M484 692q40 40 80 36q30 -4 40 20', '#ff8a9a', 2.4), circle(612, 752, 13, { fill: '#ff8a9a' }), path('M604 746q8 6 16 0M602 756q10 4 20 -2', { fill: 'none', stroke: '#e86a7a', 'stroke-width': 1.6 }));
  out.push(G({ transform: 'translate(580 768)' }, path('M-14 0c-2 -14 4 -22 14 -22c10 0 14 8 14 22z', { fill: '#f0a050' }), circle(-12, -24, 9, { fill: '#f0a050' }), path('M-18 -30l-2 -8l6 4zM-8 -32l2 -8l-6 4z', { fill: '#f0a050' }), circle(-15, -25, 1.6, { fill: '#2a2a1a' }), circle(-9, -25, 1.6, { fill: '#2a2a1a' }), path('M14 -4q14 -4 10 -20', { fill: 'none', stroke: '#f0a050', 'stroke-width': 4, 'stroke-linecap': 'round' }), path('M-20 -8l-6 8M-8 -6l-2 8', { fill: 'none', stroke: '#f0a050', 'stroke-width': 4, 'stroke-linecap': 'round' })));
  ppl.kitten = [572, 748];

  // ---- the apple tree with a basket of apples
  out.push(C('an apple tree with a basket of picked apples beneath it'));
  {
    const t = bareTree(820, YARD + 10, 250, 21, { lean: 0.02, depth: 5, spread: 0.55, trunk: 0.12 });
    out.push(path(t.d, { fill: '#7a5a3a' }));
    out.push(path(t.tips.map(([x, y]) => circD(x, y, 32)).join(''), { fill: '#5aa84a' }));
    out.push(path(t.tips.filter((_, i) => i % 2 === 0).map(([x, y]) => circD(x + 10, y + 14, 8)).join(''), { fill: '#e8243a' }));
    out.push(path('M870 740l6 -30h60l6 30z', { fill: '#c8945a' }), path(circD(888, 708, 10) + circD(908, 704, 10) + circD(928, 708, 10) + circD(898, 696, 9) + circD(918, 694, 9), { fill: '#e8243a' }));
    ppl.apples = [908, 708];
    // a birdhouse on the trunk with a bird
    out.push(path('M806 600h28v26h-28z', { fill: '#5ab8e8' }), path('M802 602l18 -16l18 16z', { fill: '#c84a3a' }), circle(820, 612, 5, { fill: '#2a2a3a' }), path('M836 594c6 -8 16 -6 16 2l-6 4z', { fill: '#ffb800' }), circle(846, 594, 1.4, { fill: '#1a1a1a' }));
    ppl.birdhouse = [820, 606];
  }

  // ---- the vegetable patch with grandpa and grandson lifting a giant tomato
  out.push(C('the focal point: in the vegetable patch grandpa and his grandson, in matching straw hats, lift a giant prize tomato together'));
  {
    out.push(path('M1000 800h420v40h-420z', { fill: url('wood') }), path('M1008 790h404v12h-404z', { fill: url('soil') }));
    let plants = '', toms = '';
    for (let x = 1030; x < 1400; x += 44) { plants += `M${x} 790q-14 -30 -4 -60M${x} 790q14 -26 6 -50`; toms += circD(x - 6, 750, 7) + circD(x + 8, 762, 6); }
    out.push(line(plants, '#3a8a3a', 5), path(toms, { fill: '#e8243a' }), line('M1030 800v-70M1118 800v-70M1206 800v-70M1294 800v-70M1382 800v-70', '#c8a070', 3));
    const lift = (s) => ({ sx: s, elbow: [s * 0.7, 0.6], hand: [s * 0.2, 0.4] });
    const gp = figure({ x: 1150, foot: 870, H: 128, heads: 3.3, skin: SKIN.deep, hair: '#dcd8e0', style: 'short', top: '#3a7a5a', bottom: '#3a4a6a', gaze: 0.4, mouth: 'open', arms: [lift(-1), { sx: 1, elbow: [0.9, 0.2], hand: [1.6, 0.6] }] });
    out.push(gp.svg, strawHat(1150, gp.headY, gp.r, '#c84a3a'));
    const b = figure({ x: 1270, foot: 874, H: 80, heads: 2.6, skin: SKIN.deep, hair: '#1a1210', style: 'short', top: '#ff8a1a', bottom: '#2a3a6a', shoe: '#ffffff', gaze: -0.4, mouth: 'open', arms: [{ sx: -1, elbow: [-0.9, 0.0], hand: [-1.8, -0.2] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.4, 1.8] }] });
    out.push(b.svg, strawHat(1270, b.headY, b.r, '#2a6ad8'));
    const tx = (gp.hand({ sx: 1, elbow: [0.9, 0.2], hand: [1.6, 0.6] })[0] + b.hand({ sx: -1, elbow: [-0.9, 0.0], hand: [-1.8, -0.2] })[0]) / 2;
    const ty = gp.hand({ sx: 1, elbow: [0.9, 0.2], hand: [1.6, 0.6] })[1] - 22;
    out.push(circle(tx, ty, 34, { fill: '#e8243a' }), path(`M${P(tx - 12, ty - 30)}l12 -10l12 10l-12 -4z`, { fill: '#3a8a3a' }), ellipse(tx - 12, ty - 12, 8, 12, { fill: '#ffffff', opacity: 0.4, transform: `rotate(-30 ${f(tx - 12)} ${f(ty - 12)})` }));
    out.push(path(`M${P(tx - 50, ty - 50)}l-10 -10M${P(tx, ty - 60)}v-14M${P(tx + 50, ty - 50)}l10 -10`, { fill: 'none', stroke: '#ffb800', 'stroke-width': 3.4, 'stroke-linecap': 'round' }));
    ppl.tomato = [tx, ty];
    // a blue ribbon rosette on the tomato
    out.push(circle(tx + 22, ty + 18, 8, { fill: '#2a6ad8' }), path(`M${P(tx + 18, ty + 24)}l-4 14l6 -4l4 6l2 -14z`, { fill: '#2a6ad8' }));
    // a watering can
    out.push(path('M1440 870v-34h44v34zM1484 846l26 -20l4 6l-22 20zM1446 836q16 -24 32 0', { fill: '#5ab8e8' }));
    ppl.can = [1462, 852];
  }

  // ---- the sleepy old dog and the sunflowers
  out.push(dog(700, 870, 0.9, '#c8a878', { flip: 1 }), path('M676 820q8 -4 14 0', { fill: 'none', stroke: '#2a1a1a', 'stroke-width': 2 }));
  ppl.dog = [700, 830];
  {
    let st = '';
    for (const [x, h] of [[1500, 260], [1540, 300], [1580, 240]]) st += `M${x} 860v-${h}`;
    out.push(line(st, '#3a8a3a', 7));
    for (const [x, h] of [[1500, 260], [1540, 300], [1580, 240]]) { const y = 860 - h; let pet = ''; for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; pet += `M${P(x, y)}m${f(Math.cos(a) * 18 - 8)} ${f(Math.sin(a) * 18)}a8 6 ${f((a * 180) / Math.PI)} 1 0 16 0a8 6 0 1 0 -16 0`; } out.push(path(pet, { fill: '#ffc83a' }), circle(x, y, 14, { fill: '#6a3a1a' })); }
  }

  return { svg: compactSvg(doc(`Grandparents Day · mid. Concept: "stories on the porch" on a golden early-September afternoon at grandma and grandpa's cottage. Focal point: grandpa and his grandson in matching straw hats lifting a giant prize tomato with a blue ribbon in the vegetable patch (x 1000–1420, y 560–880), and grandma on the porch swing showing her granddaughter an old photo album. A kitten tangles yarn from grandma's knitting basket; an apple tree with a birdhouse and a basket of picked apples; a sleepy old dog on the lawn; tall sunflowers; a blue watering can. Light story: warm golden afternoon sun. The floating hearts are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Grandparents Day · front: a rose bush bottom left and a garden gnome bottom right; the centre stays open`, [], [
    C('a rose bush bottom left'),
    path(circD(20, 860, 40) + circD(80, 850, 44) + circD(130, 872, 34), { fill: '#3a8a3a' }),
    path(circD(20, 840, 10) + circD(70, 826, 11) + circD(116, 848, 10) + circD(50, 866, 9), { fill: '#ff6a8a' }),
    C('a garden gnome'),
    path('M1530 900v-40h40v40z', { fill: '#2a6ad8' }), circle(1550, 846, 14, { fill: '#f0c4a0' }), path('M1534 840l16 -40l16 40z', { fill: '#e8243a' }), path('M1538 852q12 20 24 0q-4 18 -12 22q-8 -4 -12 -22z', { fill: '#ffffff' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'card', x: r(ppl.album[0]), y: r(ppl.album[1]), r: 36, label: 'Make a card for Grandma and Grandpa' },
      { activity: 'colour', x: r(ppl.tomato[0]), y: r(ppl.tomato[1]), r: 46, label: 'Colour the prize tomato' },
      { activity: 'memory', x: ppl.apples[0], y: ppl.apples[1], r: 30, label: 'Match the garden treats' },
      { activity: 'wish', x: ppl.swing[0], y: ppl.swing[1], r: 50, label: 'Ask for a story' },
    ],
    findables: [
      { id: 'kitten', label: 'a kitten with yarn', x: ppl.kitten[0], y: ppl.kitten[1], r: 20 },
      { id: 'birdhouse', label: 'a birdhouse', x: ppl.birdhouse[0], y: ppl.birdhouse[1], r: 20 },
      { id: 'dog', label: 'a sleepy old dog', x: ppl.dog[0], y: ppl.dog[1], r: 30 },
      { id: 'can', label: 'a watering can', x: ppl.can[0], y: ppl.can[1], r: 22 },
      { id: 'ribbon', label: 'the blue prize ribbon', x: r(ppl.tomato[0] + 22), y: r(ppl.tomato[1] + 22), r: 14 },
      { id: 'gnome', label: 'a garden gnome', x: 1550, y: 840, r: 24 },
      { id: 'glasses', label: 'grandma\'s glasses', x: 290, y: 600, r: 14 },
    ],
  };
}
