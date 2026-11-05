// Orthodox Easter — "Pascha morning in the village square": the sun is up after the midnight service. Two children
// knock their red eggs together (tsougrisma) — crack! — to see whose egg stays whole; grandma brings a basket of
// red eggs; a girl still holds her ribboned Easter candle from the night; a long table holds a braided tsoureki
// with a red egg baked in, bowls of red eggs and spring flowers. Whitewashed houses with blue shutters climb the
// hill, an olive tree shades the square, and the church with its blue dome rings its bell; doves wheel overhead.
// The hopping red and gold eggs are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, line, circD } from '../../kit/scenekit.mjs';

const ID = 'orthodox-easter';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const RED = '#c8102e', BLUE = '#2a6ac8', WHITE = '#fbf7f2';
const SQUARE = 720;

/** A red egg at (x, y), tilted. */
const egg = (x, y, s = 1, a = 0, col = RED) => G({ transform: `translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(s)})` },
  path('M0 -14C8 -14 11 -4 11 2C11 9 6 13 0 13C-6 13 -11 9 -11 2C-11 -4 -8 -14 0 -14Z', { fill: col }),
  ellipse(-4, -6, 3, 5, { fill: '#ffffff', opacity: 0.5, transform: 'rotate(-20 -4 -6)' }));

// ============================== back ==============================
export function back() {
  setPrecision(1);
  // whitewashed houses climbing the hill, kept below the copy zone, with blue doors and shutters
  const R = rng(14);
  let walls = '', blues = '';
  for (const [y0, n] of [[560, 10], [610, 12]]) {
    for (let i = 0; i < n; i++) {
      const x = 260 + i * (1040 / n) + R() * 20, w = 60 + R() * 40, h = 40 + R() * 30, top = Math.max(y0 - h, 452);
      walls += `M${P(x, y0 + 30)}V${f(top)}H${f(x + w)}V${f(y0 + 30)}Z`;
      blues += `M${P(x + w * 0.2, top + 12)}h10v12h-10ZM${P(x + w * 0.62, top + 12)}h10v12h-10Z`;
    }
  }
  const defs = [lin(id('hill'), 0, 0, 0, 1, [[0, '#d8c8a8'], [1, '#c8b090']])];
  return compactSvg(doc(`Orthodox Easter · back: the morning sky over a hillside village of whitewashed houses with blue doors and shutters, kept below the copy zone; a strip of blue sea on the far left`, defs, [
    C('a strip of sea on the far left'),
    path('M-20 560H300V600H-20Z', { fill: '#5ab0e0' }), path('M-20 568h320', { fill: 'none', stroke: '#ffffff', 'stroke-width': 2, opacity: 0.6 }),
    C('the hill and its village'),
    path('M-20 700V590Q300 560 640 576T1300 560T1620 570V700Z', { fill: url('hill') }),
    path(walls, { fill: WHITE }),
    path(blues, { fill: BLUE }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('paving'), 0, 0, 0, 1, [[0, '#e8dccc'], [1, '#c8b8a4']]),
    lin(id('dome'), 0, 0, 0, 1, [[0, '#4a8ae0'], [1, '#1a4aa8']]),
    lin(id('cloth'), 0, 0, 0, 1, [[0, '#ffffff'], [1, '#e4ecf8']]),
    rad(id('flame'), 0.5, 0.6, 0.6, [[0, '#ffffff'], [0.4, '#ffe08a'], [1, '#ff9a2a']]),
    rad(id('glow'), 0.5, 0.5, 0.5, [[0, '#ffe9a3', 0.6], [1, '#ffe9a3', 0]]),
    lin(id('bread'), 0, 0, 0, 1, [[0, '#e8a050'], [1, '#b06a28']]),
  ];

  // ---- the square
  out.push(C('the village square: pale paving with a pebble pattern'));
  out.push(path(`M-20 ${SQUARE}H1620V920H-20Z`, { fill: url('paving') }));
  { let peb = ''; const R = rng(2); for (let i = 0; i < 90; i++) peb += circD(R() * 1600, SQUARE + 20 + R() * 180, 2 + R() * 3); out.push(path(peb, { fill: '#b8a890', opacity: 0.55 })); }
  out.push(path('M560 760q240 -40 480 0q-240 30 -480 0z', { fill: '#d8c8b4', opacity: 0.7 }));

  // ---- the church on the right: white walls, a blue dome, a bell tower with a ringing bell
  out.push(C('the church on the right: white walls, a blue dome and a bell tower with its bell ringing'));
  out.push(path(`M1320 ${SQUARE}V520H1600V${SQUARE}Z`, { fill: WHITE }), path(`M1340 520a120 110 0 0 1 240 0Z`, { fill: url('dome') }), path('M1456 410v-26h8v26zM1446 396h28v-6h-28z', { fill: '#ffd166' }));
  out.push(path(`M1316 520h288v10h-288z`, { fill: '#e8e0d8' }));
  out.push(path(`M1430 ${SQUARE}v-80a30 30 0 0 1 60 0v80z`, { fill: BLUE }), path(`M1356 560a20 20 0 0 1 40 0v50h-40zM1524 560a20 20 0 0 1 40 0v50h-40z`, { fill: '#9ad0f0' }));
  // the bell tower to the left of the church
  out.push(path(`M1300 ${SQUARE}V340h-70V${SQUARE}Z`, { fill: WHITE }), path('M1226 340l39 -40l39 40z', { fill: url('dome') }), path('M1262 300v-20h6v20zM1255 288h20v-5h-20z', { fill: '#ffd166' }));
  out.push(path('M1244 360a21 21 0 0 1 42 0v50h-42z', { fill: '#8ab8e0' }));
  out.push(G({ transform: 'translate(1265 372) rotate(18)' }, path('M-14 22q0 -30 14 -32q14 2 14 32z', { fill: '#ffc83a' }), circle(0, 26, 4, { fill: '#a87810' })));
  out.push(line('M1226 380l-14 -6M1226 396l-16 2M1304 380l14 -6M1304 396l16 2', '#ffd166', 3));
  ppl.bell = [1265, 380];

  // ---- the olive tree on the left
  out.push(C('an old olive tree shading the square'));
  {
    const t = bareTree(150, SQUARE + 10, 380, 21, { lean: 0.05, depth: 5, spread: 0.55, trunk: 0.14 });
    out.push(path(t.d, { fill: '#7a6a5a' }));
    const R = rng(7);
    let leaves = '';
    for (const [x, y] of t.tips) for (let k = 0; k < 3; k++) leaves += `M${P(x + (R() - 0.5) * 40, y + (R() - 0.5) * 30)}m-14 0q14 -8 28 0q-14 8 -28 0z`;
    out.push(path(leaves, { fill: '#7a9a6a' }));
    let olives = '';
    for (const [x, y] of t.tips.filter((_, i) => i % 3 === 0)) olives += circD(x + 6, y + 8, 3);
    out.push(path(olives, { fill: '#3a4a2a' }));
  }

  // ---- doves over the square, outside the copy zone
  out.push(path('M180 120c10 -10 24 -10 30 0c6 -14 20 -18 30 -10c-12 2 -20 10 -24 18c-10 -4 -22 -6 -36 -8zM1420 200c10 -10 24 -10 30 0c6 -14 20 -18 30 -10c-12 2 -20 10 -24 18c-10 -4 -22 -6 -36 -8z', { fill: '#ffffff' }));

  // ---- the table with tsoureki, bowls of red eggs and flowers
  out.push(C('a long table: a braided tsoureki with a red egg baked in, bowls of red eggs, a jug of flowers'));
  {
    const T = { x0: 300, x1: 620, top: 742 };
    out.push(path(`M${T.x0} ${T.top}H${T.x1}v40H${T.x0}Z`, { fill: url('cloth') }), path(`M${T.x0} ${T.top + 34}H${T.x1}`, { fill: 'none', stroke: BLUE, 'stroke-width': 5, 'stroke-dasharray': '14 10' }), path(`M${T.x0 + 20} ${T.top + 40}v60h12v-60zM${T.x1 - 32} ${T.top + 40}v60h12v-60z`, { fill: '#8a6a4a' }));
    out.push(path(`M340 ${T.top}c0 -20 20 -24 30 -16c10 -14 30 -14 40 0c10 -10 30 -6 30 16z`, { fill: url('bread') }), path(`M356 ${T.top - 10}q20 -10 40 0q20 -12 36 2`, { fill: 'none', stroke: '#f8d8a0', 'stroke-width': 3, opacity: 0.8 }), egg(390, T.top - 18, 0.9, 0));
    ppl.tsoureki = [390, T.top - 12];
    out.push(ellipse(500, T.top - 4, 40, 9, { fill: '#ffffff' }));
    for (const [x, y, a] of [[480, -12, -10], [500, -16, 6], [520, -12, 14], [490, -24, -4], [510, -26, 10]]) out.push(egg(x, T.top + y, 0.85, a));
    ppl.bowl = [500, T.top - 14];
    out.push(path(`M576 ${T.top}l4 -30h18l4 30z`, { fill: BLUE }), line(`M584 ${T.top - 30}q-10 -24 -14 -36M592 ${T.top - 30}q4 -26 10 -38`, '#3a8a3a', 3), path(circD(570, T.top - 70, 8) + circD(602, T.top - 72, 8) + circD(586, T.top - 82, 7), { fill: '#ff8ab0' }));
  }

  // ---- grandma with the basket of red eggs
  out.push(C('grandma in a headscarf bringing a basket of red eggs'));
  {
    const carry = { sx: 1, elbow: [0.9, 0.6], hand: [1.3, 0.9] };
    const gm = figure({ x: 690, foot: 852, H: 118, heads: 3.2, skin: SKIN.fair, hair: '#2a2a2a', style: 'bun', top: '#2a2a4a', bottom: '#2a2a3a', gaze: 0.5, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.3, 1.8] }, carry] });
    out.push(gm.svg);
    const r = gm.r, hy = gm.headY;
    out.push(path(`M${P(690 - r * 1.1, hy + r * 0.2)}C${P(690 - r * 1.3, hy - r * 1.4)} ${P(690 + r * 1.3, hy - r * 1.4)} ${P(690 + r * 1.1, hy + r * 0.2)}L${P(690 + r * 0.9, hy + r * 0.1)}Q${P(690, hy - r * 0.8)} ${P(690 - r * 0.9, hy + r * 0.1)}Z`, { fill: '#5a3a6a' }), path(`M${P(690 + r * 0.9, hy + r * 0.2)}l${f(r * 0.4)} ${f(r * 0.8)}l${f(-r * 0.3)} ${f(r * 0.1)}z`, { fill: '#5a3a6a' }));
    const h = gm.hand(carry);
    out.push(path(`M${P(h[0] - 30, h[1] - 6)}h60l-8 32h-44z`, { fill: '#c8945a' }), path(`M${P(h[0] - 30, h[1] - 6)}q30 -44 60 0`, { fill: 'none', stroke: '#a86a30', 'stroke-width': 4 }));
    for (const [dx, a] of [[-16, -10], [0, 4], [16, 12], [-6, -4]]) out.push(egg(h[0] + dx, h[1] - 10 - (dx === -6 ? 10 : 0), 0.8, a));
    out.push(circle(h[0], h[1], r * 0.34, { fill: SKIN.fair }));
    ppl.basket = [h[0], h[1] - 10];
  }

  // ---- the two children cracking eggs (the focal point)
  out.push(C('the focal point: two children knock their red eggs together — crack! — the girl\'s egg stays whole and she cheers'));
  {
    const knockL = { sx: 1, elbow: [1.0, -0.2], hand: [1.7, -0.6] }, knockR = { sx: -1, elbow: [-1.0, -0.2], hand: [-1.7, -0.6] };
    const boy = figure({ x: 800, foot: 856, H: 88, heads: 2.7, skin: SKIN.tan, hair: '#1a1210', style: 'curls', top: '#2a6ac8', bottom: '#2a3a5a', shoe: '#e8343a', gaze: 0.5, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, knockL] });
    const girl = figure({ x: 920, foot: 856, H: 86, heads: 2.7, skin: SKIN.light, hair: '#3a2214', style: 'bob', top: '#ffffff', bottom: RED, shoe: '#ffd166', gaze: -0.5, mouth: 'open', arms: [knockR, { sx: 1, elbow: [0.8, -0.8], hand: [1.1, -2.0] }] });
    out.push(boy.svg, girl.svg);
    out.push(path(`M${P(920 - girl.tw * 0.5, girl.torsoTop + girl.r * 1.4)}h${f(girl.tw)}v${f(girl.r * 0.3)}h${f(-girl.tw)}z`, { fill: RED }), path(circD(920, girl.torsoTop + girl.r * 0.6, 3), { fill: BLUE }));
    const hb = boy.hand(knockL), hg = girl.hand(knockR);
    // the boy's egg cracked, the girl's whole
    out.push(egg(hb[0] + 10, hb[1] - 10, 1.2, 70), path(`M${P(hb[0] + 18, hb[1] - 18)}l6 4l-4 4l6 4`, { fill: 'none', stroke: '#fff4e0', 'stroke-width': 2.4 }));
    out.push(egg(hg[0] - 10, hg[1] - 10, 1.2, -70));
    out.push(circle(hb[0], hb[1], boy.r * 0.36, { fill: SKIN.tan }), circle(hg[0], hg[1], girl.r * 0.36, { fill: SKIN.light }));
    const mid = [(hb[0] + hg[0]) / 2, (hb[1] + hg[1]) / 2 - 12];
    out.push(line(`M${P(mid[0], mid[1] - 22)}v-14M${P(mid[0] - 18, mid[1] - 16)}l-10 -8M${P(mid[0] + 18, mid[1] - 16)}l10 -8`, '#ff8a1a', 3.4));
    out.push(path(circD(mid[0] - 12, mid[1] + 18, 3) + circD(mid[0] - 4, mid[1] + 26, 2.4), { fill: RED }));
    ppl.crack = mid;
    ppl.winner = [920, girl.headY];
  }

  // ---- the girl with the ribboned Easter candle
  out.push(C('a girl holding her ribboned Easter candle from the night service, still alight'));
  {
    const hold = { sx: 1, elbow: [0.7, 0.6], hand: [0.6, 0.4] };
    const c = figure({ x: 1090, foot: 858, H: 82, heads: 2.7, skin: SKIN.brown, hair: '#1a1210', style: 'puffs', top: '#ffd166', bottom: '#2a6ac8', shoe: '#ffffff', gaze: -0.3, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, hold] });
    out.push(c.svg);
    const h = c.hand(hold);
    out.push(path(`M${P(h[0] - 4, h[1] + 20)}V${f(h[1] - 70)}h8V${f(h[1] + 20)}z`, { fill: '#ffffff' }), path(`M${P(h[0] + 4, h[1] - 30)}q14 10 6 30q-8 -14 -6 -30zM${P(h[0] - 4, h[1] - 30)}q-14 10 -6 30q8 -14 6 -30z`, { fill: '#5ab8f0' }), circle(h[0], h[1] - 34, 7, { fill: '#ffffff' }), circle(h[0], h[1] - 34, 3, { fill: '#ff6a9a' }));
    out.push(circle(h[0], h[1] - 82, 20, { fill: url('glow') }), path(`M${P(h[0], h[1] - 90)}c-5 7 -5 12 0 14c5 -2 5 -7 0 -14z`, { fill: url('flame') }));
    out.push(circle(h[0], h[1], c.r * 0.36, { fill: SKIN.brown }));
    ppl.candle = [h[0], h[1] - 50];
  }

  // ---- a cat on the church steps
  out.push(G({ transform: 'translate(1520 716)' }, path('M-14 0c-2-16 4-24 14-24c10 0 14 8 14 24z', { fill: '#f0a050' }), circle(0, -28, 9, { fill: '#f0a050' }), path('M-7 -34l-1 -8l6 5zM7 -34l1 -8l-6 5z', { fill: '#f0a050' }), path('M14 -2q16 -2 14 -16', { fill: 'none', stroke: '#f0a050', 'stroke-width': 4, 'stroke-linecap': 'round' }), circle(-3, -29, 1.6, { fill: '#2a2a1a' }), circle(3, -29, 1.6, { fill: '#2a2a1a' })));
  ppl.cat = [1520, 694];

  return { svg: compactSvg(doc(`Orthodox Easter · mid. Concept: "Pascha morning in the village square" after the midnight service. Focal point: two children knocking their red eggs together (x 760–980, y 720–860) — crack! — the boy's egg breaks and the girl's stays whole. Grandma in a headscarf brings a basket of red eggs; a long table holds a braided tsoureki with a red egg baked in, a bowl of red eggs and spring flowers; a girl holds her ribboned Easter candle, still alight. An old olive tree on the left, a white church with a blue dome and a bell tower ringing its bell on the right, a cat on the steps, doves overhead, a hillside village with blue shutters behind. Light story: clear morning light. The hopping red and gold eggs are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Orthodox Easter · front: whitewashed pots of red geraniums in both bottom corners; the center stays open`, [], [
    C('a pot of geraniums bottom left'),
    path('M10 900l10 -56h100l10 56z', { fill: WHITE }), path('M20 852h100', { fill: 'none', stroke: BLUE, 'stroke-width': 5 }),
    path(circD(40, 820, 24) + circD(80, 810, 28) + circD(112, 826, 20), { fill: '#3a7a3a' }), path(circD(36, 806, 9) + circD(74, 794, 10) + circD(108, 812, 8) + circD(58, 822, 8), { fill: '#e8243a' }),
    C('a pot of geraniums bottom right'),
    path('M1480 900l10 -56h100l10 56z', { fill: WHITE }), path('M1490 852h100', { fill: 'none', stroke: BLUE, 'stroke-width': 5 }),
    path(circD(1510, 820, 24) + circD(1550, 808, 28) + circD(1584, 824, 22), { fill: '#3a7a3a' }), path(circD(1508, 806, 9) + circD(1548, 792, 10) + circD(1582, 810, 8), { fill: '#e8243a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'catch', x: r(ppl.crack[0]), y: r(ppl.crack[1]), r: 44, label: 'Crack the red eggs' },
      { activity: 'color', x: r(ppl.basket[0]), y: r(ppl.basket[1]), r: 40, label: 'Color an Easter egg' },
      { activity: 'card', x: r(ppl.candle[0]), y: r(ppl.candle[1]), r: 36, label: 'Make a Pascha card' },
      { activity: 'memory', x: r(ppl.bowl[0]), y: r(ppl.bowl[1]), r: 40, label: 'Match the Easter treats' },
    ],
    findables: [
      { id: 'bell', label: 'the ringing bell', x: ppl.bell[0], y: ppl.bell[1], r: 20 },
      { id: 'tsoureki', label: 'the braided Easter bread', x: ppl.tsoureki[0], y: ppl.tsoureki[1], r: 24 },
      { id: 'cat', label: 'a cat on the church steps', x: ppl.cat[0], y: ppl.cat[1], r: 18 },
      { id: 'dove', label: 'a white dove', x: 210, y: 116, r: 24 },
      { id: 'dome', label: 'the blue dome', x: 1460, y: 470, r: 40 },
      { id: 'olives', label: 'olives on the tree', x: 150, y: 420, r: 40 },
      { id: 'cracked-egg', label: 'a cracked egg', x: r(ppl.crack[0] - 20), y: r(ppl.crack[1] + 12), r: 16 },
    ],
  };
}
