// Passover — "The seder on the veranda": a spring evening, the family's seder table set under a pergola hung with
// blossom and string lights. On the white cloth: the seder plate, the stack of matzah under its embroidered cover,
// Elijah's silver cup, the candles, cups of grape juice, a bowl of salt water and open Haggadahs. Grandpa leads the
// reading, the youngest girl stands on her chair to ask the Four Questions, and the family listens; a boy hunts
// for the afikoman with a torch while its napkin peeks out from under a cushion; a child holds the garden gate open
// for Elijah. The full moon rises pale in the corner. The falling petals are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, stringLights, line, circD } from '../../kit/scenekit.mjs';

const ID = 'passover';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const BLOSSOM = ['#ffd6e6', '#ffb8d0', '#ffffff'];
const TABLE = { x0: 380, x1: 1220, top: 792 };
const FLOOR = 720;

/** A kippah on a head at (cx, cy) radius r. */
const kippah = (cx, cy, r, col) => path(`M${P(cx - r * 0.62, cy - r * 0.78)}Q${P(cx, cy - r * 1.24)} ${P(cx + r * 0.62, cy - r * 0.78)}Q${P(cx, cy - r * 0.92)} ${P(cx - r * 0.62, cy - r * 0.78)}Z`, { fill: col });

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(9);
  const tree = (x, base, h, seed) => {
    const t = bareTree(x, base, h, seed, { lean: 0, depth: 5, spread: 0.52 });
    let bloom = '';
    for (const [tx, ty] of t.tips) bloom += circD(tx, ty, 26 + R() * 10);
    return path(t.d, { fill: '#7a5a4a' }) + path(bloom, { fill: '#ffd0e0' });
  };
  const defs = [rad(id('moon'), 0.5, 0.5, 0.5, [[0, '#fffbe8', 0.95], [0.4, '#fff6d8', 0.5], [1, '#fff6d8', 0]])];
  return compactSvg(doc(`Passover · back: a pale spring evening; the full moon rising pale in the top-right corner; soft green hills; two blossoming trees at the sides, outside the copy zone`, defs, [
    C('the pale full moon, top right'),
    circle(1460, 130, 90, { fill: url('moon') }), circle(1460, 130, 44, { fill: '#fffaf0' }),
    C('soft hills'),
    path('M-20 640V560Q300 520 700 556T1620 540V640Z', { fill: '#b8dca8' }),
    path('M-20 660V600Q400 580 800 604T1620 590V660Z', { fill: '#a0cc90' }),
    C('blossoming trees at the sides'),
    tree(140, 660, 420, 4), tree(1480, 660, 380, 6),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('deck'), 0, 0, 0, 1, [[0, '#d8b88a'], [1, '#b8946a']]),
    lin(id('wood'), 0, 0, 0, 1, [[0, '#a8784a'], [1, '#7a5030']]),
    lin(id('cloth'), 0, 0, 0, 1, [[0, '#ffffff'], [1, '#e4ecf4']]),
    lin(id('silver'), 0, 0, 1, 0, [[0, '#e8ecf4'], [0.5, '#ffffff'], [1, '#a8b0c0']]),
    rad(id('flame'), 0.5, 0.6, 0.6, [[0, '#ffffff'], [0.4, '#ffe08a'], [1, '#ff9a2a']]),
    rad(id('glow'), 0.5, 0.5, 0.5, [[0, '#ffe9a3', 0.6], [1, '#ffe9a3', 0]]),
  ];

  // ---- the veranda deck
  out.push(C('the wooden veranda deck'));
  out.push(path(`M-20 ${FLOOR}H1620V920H-20Z`, { fill: url('deck') }));
  { let b = ''; for (let y = FLOOR + 22; y < 920; y += 24 + (y - FLOOR) * 0.08) b += `M-20 ${f(y)}H1620`; out.push(line(b, '#a8845a', 2, { opacity: 0.6 })); }

  // ---- the pergola: posts, a beam, vines with blossom, string lights
  out.push(C('the pergola: two posts and a beam wound with blossoming vines and string lights'));
  out.push(path(`M300 ${FLOOR + 10}V470h26V${FLOOR + 10}ZM1274 ${FLOOR + 10}V470h26V${FLOOR + 10}Z`, { fill: url('wood') }), path('M280 452h1040v22H280Z', { fill: url('wood') }));
  {
    const R = rng(3);
    let vine = 'M290 474', bloom = ['', '', ''];
    for (let x = 300; x < 1310; x += 40) vine += `q20 ${f(14 + R() * 10)} 40 0`;
    for (let k = 0; k < 44; k++) { const x = 290 + R() * 1030, y = 448 + R() * 34; bloom[k % 3] += circD(x, y, 5 + R() * 4); }
    for (let k = 0; k < 14; k++) { const x = R() < 0.5 ? 300 + R() * 26 : 1274 + R() * 26, y = 480 + R() * 220; bloom[k % 3] += circD(x, y, 5 + R() * 3); }
    out.push(line(vine + 'M313 474q-20 120 6 240M1287 474q20 120 -6 240', '#3a8a4a', 4));
    bloom.forEach((d, k) => out.push(path(d, { fill: BLOSSOM[k] })));
    out.push(stringLights(330, 486, 1270, 486, 40, 18, ['#fff3c4'], { wire: '#5a4a3a', r: 6 }));
  }

  // ---- the family seated behind the table
  out.push(C('the family behind the table: grandpa in a kippah leads the reading, grandma, the youngest girl stands on her chair to ask the Four Questions, dad, mum'));
  {
    const seat = 840;                                        // their laps are below the tabletop
    const sitter = (x, o) => figure({ x, foot: seat, H: o.H ?? 136, heads: o.heads ?? 3.1, skin: o.skin, hair: o.hair, style: o.style ?? 'short', top: o.top, bottom: o.top, gaze: o.gaze ?? 0, mouth: o.mouth ?? 'smile', arms: o.arms });
    const book = { sx: -1, elbow: [-0.6, 1.0], hand: [0.2, 1.3] }, book2 = { sx: 1, elbow: [0.6, 1.0], hand: [-0.2, 1.3] };
    const gp = sitter(500, { skin: SKIN.fair, hair: '#dcd8e0', top: '#ffffff', gaze: 0.4, mouth: 'open', arms: [book, book2] });
    out.push(gp.svg, kippah(500, gp.headY, gp.r, '#2a4a8a'));
    out.push(path(`M${P(500 - gp.r * 0.7, gp.headY + gp.r * 0.3)}Q${P(500, gp.headY + gp.r * 1.5)} ${P(500 + gp.r * 0.7, gp.headY + gp.r * 0.3)}Q${P(500, gp.headY + gp.r * 0.8)} ${P(500 - gp.r * 0.7, gp.headY + gp.r * 0.3)}Z`, { fill: '#e8e4ec' }));
    const bh = gp.hand(book);
    out.push(path(`M${P(bh[0] - 2, bh[1] - 26)}h40v30h-40zM${P(bh[0] - 42, bh[1] - 26)}h40v30h-40z`, { fill: '#2a5a8a' }), path(`M${P(bh[0] - 38, bh[1] - 22)}h36v22h-36zM${P(bh[0] + 2, bh[1] - 22)}h36v22h-36z`, { fill: '#fff8ec' }));
    const gm = sitter(620, { skin: SKIN.fair, hair: '#e6e2ee', style: 'elder', top: '#5a8a6a', gaze: 0.5, arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.2, 1.6] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.2, 1.6] }] });
    out.push(gm.svg);
    // the youngest girl standing on her chair (her chair's back shows behind her)
    out.push(path('M850 792V650h10V792ZM910 792V650h10V792ZM850 650h70v10h-70z', { fill: url('wood') }));
    const ask = { sx: -1, elbow: [-0.7, 0.4], hand: [-0.2, 0.2] }, ask2 = { sx: 1, elbow: [0.7, 0.4], hand: [0.2, 0.2] };
    const girl = figure({ x: 885, foot: 756, H: 104, heads: 2.7, skin: SKIN.tan, hair: '#3a2214', style: 'bob', top: '#ff8fb8', bottom: '#5a3ad8', shoe: '#ffffff', gaze: -0.2, mouth: 'open', arms: [ask, ask2] });
    out.push(girl.svg);
    const qh = girl.hand(ask);
    out.push(path(`M${P(qh[0] - 4, qh[1] - 28)}h30v32h-30zM${P(qh[0] - 34, qh[1] - 28)}h30v32h-30z`, { fill: '#c8243a' }), path(`M${P(qh[0] - 30, qh[1] - 24)}h26v24h-26zM${P(qh[0], qh[1] - 24)}h26v24h-26z`, { fill: '#fff8ec' }), line(`M${P(qh[0] - 26, qh[1] - 16)}h18M${P(qh[0] - 26, qh[1] - 8)}h14M${P(qh[0] + 4, qh[1] - 16)}h18M${P(qh[0] + 4, qh[1] - 8)}h12`, '#a8a0b0', 1.6));
    out.push(line(`M${P(885 - 34, girl.headY - 34)}l-8 -8M${P(885, girl.headY - 44)}v-10M${P(885 + 34, girl.headY - 34)}l8 -8`, '#ffd166', 3));
    ppl.questions = [885, girl.headY];
    const dad = sitter(1010, { H: 142, skin: SKIN.brown, hair: '#1a1210', top: '#3a5aa8', gaze: -0.4, arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.2, 1.6] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.2, 1.6] }] });
    out.push(dad.svg, kippah(1010, dad.headY, dad.r, '#ffffff'));
    const mum = sitter(1130, { skin: SKIN.light, hair: '#c8642a', style: 'side', top: '#8a3ab0', gaze: -0.5, arms: [{ sx: -1, elbow: [-0.8, 0.8], hand: [-1.0, 1.2] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.2, 1.6] }] });
    out.push(mum.svg);
  }

  // ---- the table and the seder
  out.push(C('the table: a white cloth with a blue runner; the seder plate, the matzah under its cover, Elijah\'s cup, candles, cups, salt water, a vase of spring flowers'));
  {
    const T = TABLE;
    out.push(path(`M${T.x0} ${T.top}H${T.x1}v60H${T.x0}Z`, { fill: url('cloth') }), path(`M${T.x0} ${T.top + 58}H${T.x1}v6H${T.x0}Z`, { fill: '#d0dae8' }), path(`M${T.x0 + 260} ${T.top}h80v64h-80z`, { fill: '#2a5aa8', opacity: 0.85 }));
    out.push(path(`M${T.x0 + 30} ${T.top + 64}v70h14v-70zM${T.x1 - 44} ${T.top + 64}v70h14v-70z`, { fill: url('wood') }));
    // the candles
    for (const x of [664, 700]) { out.push(path(`M${x - 8} ${T.top}h16l-4 -10h-8z`, { fill: url('silver') }), path(`M${x - 4} ${T.top - 10}v-40h8v40z`, { fill: '#ffffff' }), circle(x, T.top - 60, 22, { fill: url('glow') }), path(`M${x} ${T.top - 66}c-6 8 -6 14 0 16c6 -2 6 -8 0 -16z`, { fill: url('flame') })); }
    // the seder plate
    const S = { x: 800, y: T.top - 10 };
    out.push(ellipse(S.x, S.y, 74, 18, { fill: url('silver') }), ellipse(S.x, S.y - 2, 64, 13, { fill: '#ffffff' }));
    const dish = (x, y, c, top = '') => ellipse(x, y, 13, 4, { fill: '#e8eef8' }) + top + '';
    out.push(dish(S.x - 40, S.y - 4, '', ellipse(S.x - 40, S.y - 10, 8, 10, { fill: '#fff6e8' })));                                          // egg
    out.push(dish(S.x - 14, S.y - 8, '', path(`M${S.x - 22} ${S.y - 10}q8 -12 18 -4l6 -6l4 4l-6 6q2 8 -10 8z`, { fill: '#f4e8d8' })));         // shank bone
    out.push(dish(S.x + 14, S.y - 8, '', path(circD(S.x + 10, S.y - 12, 6) + circD(S.x + 18, S.y - 13, 5), { fill: '#a8603a' })));            // charoset
    out.push(dish(S.x + 40, S.y - 4, '', path(`M${S.x + 32} ${S.y - 6}q6 -16 12 -2q4 -14 10 0z`, { fill: '#5ac85a' })));                         // karpas
    out.push(dish(S.x - 2, S.y + 4, '', path(`M${S.x - 10} ${S.y + 2}q10 -14 20 0z`, { fill: '#8ad86a' })));                                   // lettuce
    ppl.plate = [S.x, S.y - 6];
    // the matzah stack under its embroidered cover
    out.push(path(`M${T.x0 + 120} ${T.top}h110v-20h-110z`, { fill: '#e8c890' }), path(`M${T.x0 + 116} ${T.top - 20}h118v-10q-59 -12 -118 0z`, { fill: '#ffffff' }), path(`M${T.x0 + 130} ${T.top - 26}q45 -6 90 0`, { fill: 'none', stroke: '#2a5aa8', 'stroke-width': 3 }), circle(T.x0 + 175, T.top - 30, 4, { fill: '#ffd166' }));
    out.push(line(`M${T.x0 + 124} ${T.top - 6}h102M${T.x0 + 124} ${T.top - 13}h102`, '#c8a060', 1.6));
    ppl.matzah = [T.x0 + 175, T.top - 16];
    // Elijah's cup
    out.push(path(`M940 ${T.top}h30l-6 -8h-18zM951 ${T.top - 8}v-14h8v14zM934 ${T.top - 22}h42q0 -34 -21 -38q-21 4 -21 38z`, { fill: url('silver') }), path(`M940 ${T.top - 36}q15 -6 30 0`, { fill: 'none', stroke: '#a8b0c0', 'stroke-width': 2 }), ellipse(955, T.top - 56, 18, 4, { fill: '#7a1a3a' }));
    ppl.elijah = [955, T.top - 40];
    // cups of grape juice, the salt water, the flowers
    for (const x of [470, 560, 740, 1050, 1150]) out.push(path(`M${x - 8} ${T.top}h16l-2 -4h-12zM${x - 2} ${T.top - 4}v-8h4v8zM${x - 9} ${T.top - 12}h18l-3 -18h-12z`, { fill: '#e8f0f8', opacity: 0.9 }), path(`M${x - 8} ${T.top - 18}h16l-2 -10h-12z`, { fill: '#7a1a4a' }));
    out.push(ellipse(1100, T.top - 4, 16, 5, { fill: '#e8eef8' }), ellipse(1100, T.top - 6, 12, 3, { fill: '#cfe8ff' }));
    out.push(path(`M1170 ${T.top}l4 -26h14l4 26z`, { fill: '#9ad8f0', opacity: 0.8 }), line(`M1176 ${T.top - 26}q-10 -30 -16 -44M1184 ${T.top - 26}q2 -30 8 -46`, '#3a8a3a', 3), path(circD(1160, T.top - 72, 9) + circD(1192, T.top - 74, 9) + circD(1176, T.top - 84, 8), { fill: '#ffd166' }));
  }

  // ---- the afikoman hunt: a boy with a torch, the napkin peeking from under a cushion
  out.push(C('the afikoman hunt: a boy with a torch searches under the bench; the afikoman\'s napkin peeks out from under a cushion'));
  {
    out.push(path(`M60 ${FLOOR + 80}h220v14h-220zM70 ${FLOOR + 94}v40h12v-40zM258 ${FLOOR + 94}v40h12v-40z`, { fill: url('wood') }));
    out.push(path(`M80 ${FLOOR + 80}q0 -26 40 -26h50q40 0 40 26z`, { fill: '#e8a040' }), path(`M150 ${FLOOR + 66}l-24 18l30 4z`, { fill: '#ffffff' }), path(`M134 ${FLOOR + 76}l12 2`, { fill: 'none', stroke: '#2a5aa8', 'stroke-width': 2 }));
    ppl.afikoman = [142, FLOOR + 76];
    const torch = { sx: -1, elbow: [-1.0, 0.4], hand: [-1.8, 0.6] };
    const b = figure({ x: 340, foot: 862, H: 76, heads: 2.7, skin: SKIN.fair, hair: '#1a1210', style: 'curls', top: '#ffb800', bottom: '#2a3a6a', shoe: '#e8343a', gaze: -0.6, mouth: 'open', arms: [torch, { sx: 1, elbow: [0.6, 1.0], hand: [0.4, 1.9] }] });
    out.push(b.svg, kippah(340, b.headY, b.r, '#2a8a6a'));
    const th = b.hand(torch);
    out.push(path(`M${P(th[0] - 22, th[1] - 6)}h22v12h-22z`, { fill: '#3a3a4a' }), path(`M${P(th[0] - 22, th[1] - 6)}L${P(th[0] - 120, th[1] - 40)}V${f(th[1] + 50)}L${P(th[0] - 22, th[1] + 6)}Z`, { fill: '#fff6c0', opacity: 0.35 }), circle(th[0], th[1], b.r * 0.36, { fill: SKIN.fair }));
    ppl.torch = [th[0] - 30, th[1]];
  }

  // ---- the garden gate held open for Elijah
  out.push(C('a child holds the garden gate open for Elijah'));
  {
    out.push(path(`M1360 ${FLOOR + 140}V640h12V${FLOOR + 140}ZM1530 ${FLOOR + 140}V640h12V${FLOOR + 140}Z`, { fill: url('wood') }));
    out.push(path(`M1372 650l90 -24v150l-90 24z`, { fill: '#c8a070' }), line('M1372 680l90 -24M1372 720l90 -24M1372 760l90 -24', '#a8804a', 3));
    const hold = { sx: 1, elbow: [0.9, 0.0], hand: [1.6, -0.3] };
    const k = figure({ x: 1430, foot: 858, H: 80, heads: 2.7, skin: SKIN.deep, hair: '#1a1210', style: 'puffs', top: '#2ab8a8', bottom: '#2a3a6a', shoe: '#ffd23a', gaze: 0.5, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, hold] });
    out.push(k.svg, circle(k.hand(hold)[0], k.hand(hold)[1], k.r * 0.36, { fill: SKIN.deep }));
    ppl.gate = [1440, 700];
  }
  // ---- the cat under the table
  out.push(G({ transform: 'translate(1000 878)' }, ellipse(0, 0, 26, 12, { fill: '#9a9aa8' }), circle(-22, -8, 10, { fill: '#9a9aa8' }), path('M-28 -16l-2 -8l6 4zM-18 -17l2 -8l-6 4z', { fill: '#9a9aa8' }), path('M-26 -8q2 2 4 0M-20 -8q2 2 4 0', { fill: 'none', stroke: '#2a2a3a', 'stroke-width': 1.6, 'stroke-linecap': 'round' }), path('M24 2q12 -2 6 -14', { fill: 'none', stroke: '#9a9aa8', 'stroke-width': 5, 'stroke-linecap': 'round' })));
  ppl.cat = [990, 870];

  return { svg: compactSvg(doc(`Passover · mid. Concept: "the seder on the veranda" on a spring evening. Focal point: the seder table under a pergola of blossom and string lights (x 380–1220, y 600–800) — the seder plate with its egg, shank bone, charoset, parsley and lettuce, the matzah under an embroidered cover, Elijah's silver cup, two candles, cups of grape juice, salt water and spring flowers — with the family behind it: grandpa in a kippah leads the reading from the Haggadah, grandma listens, the youngest girl stands on her chair to ask the Four Questions, dad and mum. In front a boy hunts for the afikoman with a torch while its napkin peeks out from under a cushion on the bench; on the right a child holds the garden gate open for Elijah; a cat dozes under the table. Light story: candlelight and string lights on a pale spring evening; the full moon rising. The falling petals are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Passover · front: pots of spring flowers in both bottom corners; the center stays open`, [], [
    C('a pot of tulips bottom left'),
    path('M10 900l10 -50h90l10 50z', { fill: '#c8643a' }),
    path('M40 850q-6 -40 4 -70M64 850q2 -50 -4 -80M90 850q8 -40 0 -66', { fill: 'none', stroke: '#3a8a3a', 'stroke-width': 4 }),
    path('M34 784q10 -26 20 0q-10 10 -20 0zM50 774q10 -26 20 0q-10 10 -20 0zM80 786q10 -26 20 0q-10 10 -20 0z', { fill: '#ff6a8a' }),
    C('a pot of daisies bottom right'),
    path('M1490 900l10 -50h90l10 50z', { fill: '#5a8ad8' }),
    path(circD(1520, 830, 14) + circD(1556, 820, 16) + circD(1586, 832, 14), { fill: '#ffffff' }), path(circD(1520, 830, 5) + circD(1556, 820, 6) + circD(1586, 832, 5), { fill: '#ffd166' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'memory', x: ppl.plate[0], y: ppl.plate[1], r: 50, label: 'Match the seder plate' },
      { activity: 'seek', x: r(ppl.torch[0]), y: r(ppl.torch[1]), r: 40, label: 'Hunt for the afikoman' },
      { activity: 'card', x: ppl.elijah[0], y: ppl.elijah[1], r: 30, label: 'Make a Passover card' },
      { activity: 'color', x: r(ppl.questions[0]), y: r(ppl.questions[1] + 30), r: 46, label: 'Color the seder table' },
    ],
    findables: [
      { id: 'afikoman', label: 'the hidden afikoman', x: ppl.afikoman[0], y: ppl.afikoman[1], r: 18 },
      { id: 'elijah-cup', label: 'Elijah\'s cup', x: ppl.elijah[0], y: ppl.elijah[1], r: 20 },
      { id: 'egg', label: 'the egg on the seder plate', x: ppl.plate[0] - 40, y: ppl.plate[1] - 4, r: 14 },
      { id: 'matzah', label: 'the matzah', x: ppl.matzah[0], y: ppl.matzah[1], r: 26 },
      { id: 'cat', label: 'a cat under the table', x: ppl.cat[0], y: ppl.cat[1], r: 22 },
      { id: 'gate', label: 'the gate open for Elijah', x: ppl.gate[0], y: ppl.gate[1], r: 40 },
      { id: 'moon', label: 'the full moon', x: 1460, y: 130, r: 40 },
    ],
  };
}
