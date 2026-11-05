// Labor Day — "The thank-you picnic": the last long weekend of summer at the town park. Neighbours have put on a
// picnic for the people who keep the town running: a girl hands a heart card to the mail carrier; a boy in a toy
// hard hat brings a cup of lemonade to a nurse in scrubs and a builder in a hard hat; a firefighter lets a toddler
// try on the big helmet beside the red fire engine; dad flips burgers on the grill. A picnic table with watermelon,
// corn and a jug of lemonade, a striped pavilion, a crane far off over the trees. The confetti is the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { dog, line, circD } from '../../kit/scenekit.mjs';

const ID = 'labor-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const RED = '#d62828', YELLOW = '#ffc83a';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const LAWN = 700;

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(3);
  let trees = '';
  for (let x = -20; x < 1640; x += 70 + R() * 50) trees += circD(x, 620 + R() * 20, 50 + R() * 30);
  const crane = 'M1460 640V380h12V640ZM1440 640h52v-10h-52zM1466 380h-150v10h190v-10zM1326 390v60h4v-60zM1318 450h20v14h-20z';
  const defs = [rad(id('sun'), 0.5, 0.5, 0.5, [[0, '#fff8d0', 0.95], [0.4, '#ffe08a', 0.4], [1, '#ffe08a', 0]])];
  return compactSvg(doc(`Labor Day · back: a late-summer sun in the top-left corner and two clouds; a row of round park trees, kept low; a construction crane far off on the right, outside the copy zone`, defs, [
    C('the sun and two clouds'),
    circle(130, 120, 130, { fill: url('sun') }), circle(130, 120, 44, { fill: '#fffbe0' }),
    path('M1380 140c-24 0 -30 -30 -6 -36c0 -26 36 -32 46 -12c14 -18 46 -10 44 16c22 -2 28 24 12 32z', { fill: '#ffffff', opacity: 0.9 }),
    C('a crane far off'),
    path(crane, { fill: '#e8a020' }),
    C('the park trees'),
    path(trees, { fill: '#6aa84a' }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('lawn'), 0, 0, 0, 1, [[0, '#8ad06a'], [1, '#5aa84a']]),
    lin(id('truck'), 0, 0, 0, 1, [[0, '#ff4a4a'], [1, '#b81a1a']]),
    lin(id('wood'), 0, 0, 0, 1, [[0, '#c8945a'], [1, '#9a6a3a']]),
  ];

  out.push(C('the park lawn and a path'));
  out.push(path(`M-20 ${LAWN - 40}H1620V920H-20Z`, { fill: url('lawn') }));
  out.push(path('M1000 920Q1100 760 1300 700H1360Q1180 780 1100 920Z', { fill: '#e8d8b0', opacity: 0.7 }));

  // ---- the striped pavilion on the left
  out.push(C('a picnic pavilion with a striped roof'));
  out.push(path('M30 700V500h10V700ZM330 700V500h10V700Z', { fill: '#f4ece0' }));
  { let a = '', b = ''; for (let k = 0; k < 8; k++) { const x = 10 + k * 44; const d = `M${x} 500l22 -60l22 60z`; if (k % 2) b += d; else a += d; } out.push(path('M0 500L185 420L370 500Z', { fill: '#ffffff' }), path(a, { fill: '#2a8ad8', opacity: 0.9 })); }
  out.push(path('M-6 500h382v10H-6z', { fill: '#1a6ab8' }));

  // ---- the fire engine on the right
  out.push(C('a red fire engine parked on the right with its ladder and a gleaming bell'));
  {
    const x0 = 1220, base = 760;
    out.push(ellipse(1400, base + 4, 200, 10, { fill: '#000', opacity: 0.2 }));
    out.push(path(`M${x0} ${base - 20}V${base - 130}h240v-40h120v170z`, { fill: url('truck') }), path(`M${x0 + 250} ${base - 160}h60v40h-70z`, { fill: '#9ad8f0' }));
    out.push(path(`M${x0} ${base - 70}h340v8h-340z`, { fill: '#ffffff' }), path(`M${x0 + 20} ${base - 120}h200v30h-200z`, { fill: '#c8102e' }));
    out.push(line(`M${x0 + 10} ${base - 140}L${x0 + 230} ${base - 160}M${x0 + 10} ${base - 128}L${x0 + 230} ${base - 148}`, '#d8dce4', 5), line(Array.from({ length: 9 }, (_, k) => `M${x0 + 20 + k * 24} ${base - 140 - k * 2}v12`).join(''), '#d8dce4', 3));
    for (const x of [x0 + 60, x0 + 280]) out.push(circle(x, base - 20, 30, { fill: '#2a2a32' }), circle(x, base - 20, 12, { fill: '#c8ccd8' }));
    out.push(circle(x0 + 330, base - 110, 12, { fill: YELLOW }), circle(x0 + 290, base - 176, 8, { fill: '#5ab8f0' }));
    ppl.truck = [x0 + 140, base - 100];
  }

  // ---- the firefighter with the toddler in the big helmet
  out.push(C('a firefighter in her yellow coat lets a toddler try on the big red helmet'));
  {
    const ff = figure({ x: 1180, foot: 862, H: 126, heads: 3.3, skin: SKIN.brown, hair: '#1a1210', style: 'bun', top: '#e8b020', bottom: '#2a2a3a', gaze: -0.4, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.7, 0.8], hand: [-1.1, 1.4] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.8] }] });
    out.push(ff.svg, path(`M${P(1180 - ff.tw * 0.5, ff.torsoTop + ff.r * 1.2)}h${f(ff.tw)}v6h${f(-ff.tw)}zM${P(1180 - ff.tw * 0.5, ff.torsoBot - 14)}h${f(ff.tw)}v6h${f(-ff.tw)}z`, { fill: '#d8e4f0' }));
    const t = figure({ x: 1100, foot: 870, H: 58, heads: 2.3, skin: SKIN.fair, hair: '#e8b84a', style: 'short', top: '#5ab8e8', bottom: '#2a5aa8', shoe: RED, gaze: 0.2, mouth: 'open', arms: [{ sx: -1, elbow: [-0.8, -0.4], hand: [-1.0, -1.2] }, { sx: 1, elbow: [0.8, -0.4], hand: [1.0, -1.2] }] });
    out.push(t.svg);
    const r = t.r, hy = t.headY;
    out.push(path(`M${P(1100 - r * 1.7, hy - r * 0.1)}C${P(1100 - r * 1.6, hy - r * 0.6)} ${P(1100 + r * 1.6, hy - r * 0.6)} ${P(1100 + r * 1.9, hy)}C${P(1100 + r * 1.2, hy - r * 0.2)} ${P(1100 - r * 1.2, hy - r * 0.2)} ${P(1100 - r * 1.7, hy - r * 0.1)}Z`, { fill: '#b81a1a' }), path(`M${P(1100 - r * 1.1, hy - r * 0.3)}C${P(1100 - r * 1.1, hy - r * 1.7)} ${P(1100 + r * 1.1, hy - r * 1.7)} ${P(1100 + r * 1.1, hy - r * 0.3)}Z`, { fill: RED }), path(`M${P(1100 - r * 0.3, hy - r * 1.4)}h${f(r * 0.6)}v${f(r * 0.6)}h${f(-r * 0.6)}z`, { fill: YELLOW }));
    ppl.helmet = [1100, hy - r];
  }

  // ---- the picnic table and the grill
  out.push(C('a picnic table with watermelon, corn and a jug of lemonade; dad flips burgers on the grill'));
  {
    out.push(path('M420 790h300v14h-300zM440 804l-14 60h12l14 -60zM700 804l14 60h-12l-14 -60zM400 830h340v8H400z', { fill: url('wood') }));
    out.push(path('M420 782h300v8h-300z', { fill: '#ffffff' }), path('M420 782h300v8h-300z', { fill: 'none', stroke: RED, 'stroke-width': 0 }));
    { let chk = ''; for (let x = 420; x < 720; x += 20) chk += `M${x} 782h10v8h-10z`; out.push(path(chk, { fill: RED })); }
    for (const [x, a] of [[450, -8], [490, 6], [530, -4]]) out.push(G({ transform: `translate(${x} 780) rotate(${a})` }, path('M-18 0a18 18 0 0 1 36 0z', { fill: '#3a9a3a' }), path('M-15 0a15 15 0 0 1 30 0z', { fill: '#ff4a5a' }), path(circD(-6, -6, 1.6) + circD(4, -8, 1.6) + circD(8, -3, 1.6), { fill: '#1a1a1a' })));
    out.push(path('M570 778l40 -10l2 6l-40 10z', { fill: YELLOW }), path('M570 778l-6 -4M612 770l6 -6', { fill: 'none', stroke: '#8ad06a', 'stroke-width': 4 }));
    out.push(path('M650 782v-40q0 -8 8 -8h20q8 0 8 8v40z', { fill: '#fff6a8', opacity: 0.85 }), path('M686 750q12 2 10 14q-2 8 -10 8', { fill: 'none', stroke: '#e8e0c8', 'stroke-width': 4 }), path(circD(664, 756, 5) + circD(674, 766, 5), { fill: '#ffe03a' }));
    ppl.table = [570, 776];
    // the grill
    out.push(path('M820 760a46 30 0 0 1 92 0z', { fill: '#2a2a32' }), path('M820 760h92v8h-92zM836 768l-14 80h8l14 -80zM896 768l14 80h-8l-14 -80z', { fill: '#3a3a42' }));
    out.push(path(circD(846, 754, 10) + circD(872, 752, 10) + circD(896, 756, 9), { fill: '#7a3a1a' }));
    out.push(line('M850 730c-6 -10 4 -16 -2 -26M880 728c-6 -10 4 -16 -2 -26', '#ffffff', 2.4, { opacity: 0.6 }));
    const flip = { sx: -1, elbow: [-0.9, 0.2], hand: [-1.5, 0.2] };
    const dad = figure({ x: 960, foot: 860, H: 126, heads: 3.3, skin: SKIN.tan, hair: '#3a2a1a', style: 'short', top: '#2a6aa8', bottom: '#5a5a6a', gaze: -0.5, mouth: 'smile', arms: [flip, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.8] }] });
    out.push(dad.svg, path(`M${P(960 - dad.tw * 0.4, dad.torsoTop + 6)}h${f(dad.tw * 0.8)}V${f(dad.torsoBot + 20)}h${f(-dad.tw * 0.8)}z`, { fill: '#ffffff' }), path(`M${P(960 - dad.tw * 0.4, dad.torsoTop + 6)}h${f(dad.tw * 0.8)}`, { fill: 'none', stroke: RED, 'stroke-width': 4 }));
    const fh = dad.hand(flip);
    out.push(line(`M${P(...fh)}L${P(fh[0] - 40, fh[1] - 10)}`, '#8a8a9a', 4), path(`M${P(fh[0] - 52, fh[1] - 18)}h16v12h-16z`, { fill: '#8a8a9a' }), circle(fh[0], fh[1], dad.r * 0.34, { fill: SKIN.tan }));
    ppl.grill = [866, 750];
  }

  // ---- the girl with the heart card for the mail carrier, under the pavilion
  out.push(C('under the pavilion a girl hands a heart card to the mail carrier, who has his bag over his shoulder'));
  {
    const give = { sx: 1, elbow: [0.9, 0.0], hand: [1.6, -0.3] };
    const g = figure({ x: 190, foot: 862, H: 82, heads: 2.7, skin: SKIN.deep, hair: '#1a1210', style: 'puffs', top: '#ff8fb8', bottom: '#2a3a6a', shoe: '#ffd166', gaze: 0.5, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, give] });
    out.push(g.svg);
    const gh = g.hand(give);
    out.push(path(`M${P(gh[0] - 4, gh[1] - 30)}h34v26h-34z`, { fill: '#ffffff' }), path(`M${P(gh[0] + 13, gh[1] - 10)}c-10 -8 -12 -16 -4 -18c2 0 4 2 4 4c0 -2 2 -4 4 -4c8 2 6 10 -4 18z`, { fill: RED }), circle(gh[0], gh[1], g.r * 0.36, { fill: SKIN.deep }));
    ppl.card = [gh[0] + 13, gh[1] - 17];
    const take = { sx: -1, elbow: [-0.9, 0.2], hand: [-1.5, 0.0] };
    const mc = figure({ x: 316, foot: 860, H: 128, heads: 3.3, skin: SKIN.light, hair: '#c8642a', style: 'short', top: '#7a9ac8', bottom: '#2a3a6a', gaze: -0.5, mouth: 'smile', arms: [take, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.8] }] });
    out.push(mc.svg);
    const r = mc.r, hy = mc.headY;
    out.push(path(`M${P(316 - r * 1.0, hy - r * 0.4)}C${P(316 - r * 1.0, hy - r * 1.3)} ${P(316 + r * 1.0, hy - r * 1.3)} ${P(316 + r * 1.0, hy - r * 0.4)}Z`, { fill: '#2a3a6a' }), path(`M${P(316 - r * 1.04, hy - r * 0.42)}h${f(-r * 0.8)}`, { fill: 'none', stroke: '#2a3a6a', 'stroke-width': f(r * 0.18), 'stroke-linecap': 'round' }));
    out.push(path(`M${P(316 - mc.tw * 0.5, mc.torsoTop)}L${P(316 + mc.tw * 0.5, mc.torsoBot)}`, { fill: 'none', stroke: '#6a4422', 'stroke-width': 6 }), path(`M${P(316 + mc.tw * 0.2, mc.torsoBot - 16)}h44v40h-44z`, { fill: '#8a5a32' }), path(`M${P(316 + mc.tw * 0.2 + 6, mc.torsoBot - 26)}h14v16h-14zM${P(316 + mc.tw * 0.2 + 22, mc.torsoBot - 22)}h14v12h-14z`, { fill: '#ffffff' }));
    out.push(circle(mc.hand(take)[0], mc.hand(take)[1], r * 0.36, { fill: SKIN.light }));
    ppl.mailbag = [316 + mc.tw * 0.2 + 22, mc.torsoBot];
  }

  // ---- the boy in a toy hard hat bringing lemonade to the nurse and the builder
  out.push(C('a boy in a yellow toy hard hat brings a cup of lemonade to a nurse in blue scrubs and a builder in an orange vest and hard hat'));
  {
    const cup = { sx: 1, elbow: [0.9, 0.0], hand: [1.6, -0.4] };
    const b = figure({ x: 720, foot: 870, H: 80, heads: 2.7, skin: SKIN.brown, hair: '#1a1210', style: 'short', top: '#2ab86a', bottom: '#2a3a6a', shoe: '#ffffff', gaze: 0.5, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, cup] });
    out.push(b.svg);
    const r = b.r, hy = b.headY;
    out.push(path(`M${P(720 - r * 1.05, hy - r * 0.35)}C${P(720 - r * 1.0, hy - r * 1.35)} ${P(720 + r * 1.0, hy - r * 1.35)} ${P(720 + r * 1.05, hy - r * 0.35)}Z`, { fill: YELLOW }), path(`M${P(720 - r * 1.3, hy - r * 0.35)}h${f(r * 2.6)}v${f(r * 0.18)}h${f(-r * 2.6)}z`, { fill: '#e8a010' }), path(`M${P(720, hy - r * 1.1)}v${f(r * 0.7)}`, { fill: 'none', stroke: '#e8a010', 'stroke-width': 3 }));
    const ch = b.hand(cup);
    out.push(path(`M${P(ch[0] - 6, ch[1] - 20)}h14l-2 20h-10z`, { fill: '#fff6a8' }), circle(ch[0], ch[1], r * 0.36, { fill: SKIN.brown }));
    ppl.lemonade = [ch[0], ch[1] - 10];
    const nurse = figure({ x: 820, foot: 868, H: 122, heads: 3.3, skin: SKIN.fair, hair: '#1a1210', style: 'bob', top: '#5ab8c8', bottom: '#5ab8c8', gaze: -0.5, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.7, 0.6], hand: [-1.0, 1.0] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.8] }] });
    out.push(nurse.svg, path(`M${P(820 - nurse.tw * 0.3, nurse.torsoTop + 2)}l${f(nurse.tw * 0.3)} ${f(nurse.r * 0.6)}l${f(nurse.tw * 0.3)} ${f(-nurse.r * 0.6)}`, { fill: 'none', stroke: '#3a8a9a', 'stroke-width': 3 }), path(`M${P(820 + nurse.tw * 0.1, nurse.torsoTop + nurse.r * 0.9)}c0 10 10 14 14 6`, { fill: 'none', stroke: '#2a2a3a', 'stroke-width': 2.4 }));
    ppl.nurse = [820, nurse.headY];
  }

  // ---- a dog with a frisbee
  out.push(dog(1030, 878, 0.8, '#c8894a', { flip: -1 }), ellipse(1004, 846, 14, 5, { fill: '#ff4a8a' }));
  ppl.dog = [1024, 840];

  return { svg: compactSvg(doc(`Labor Day · mid. Concept: "the thank-you picnic" on the last long weekend of summer at the town park. Focal point: the picnic (x 100–1250, y 600–880) the neighbours put on for the people who keep the town running — under a striped pavilion a girl hands a heart card to the mail carrier; a boy in a yellow toy hard hat brings lemonade to a nurse in blue scrubs; dad in an apron flips burgers on the grill beside a picnic table with watermelon, corn and a jug of lemonade; a firefighter in her yellow coat lets a toddler try on the big red helmet beside the red fire engine; a dog with a frisbee. A crane far off over the round park trees. Light story: warm late-summer sun. The confetti is the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Labor Day · front: a red wagon bottom left and sunflowers bottom right; the centre stays open`, [], [
    C('a red wagon with a watermelon'),
    path('M-10 870h100v-26H-10z', { fill: '#d62828' }), circle(8, 876, 12, { fill: '#2a2a32' }), circle(74, 876, 12, { fill: '#2a2a32' }), path('M90 860l30 -16', { fill: 'none', stroke: '#3a3a42', 'stroke-width': 5 }),
    ellipse(40, 840, 30, 20, { fill: '#3a9a3a' }), path('M14 836q26 -12 52 0', { fill: 'none', stroke: '#6ac86a', 'stroke-width': 4 }),
    C('sunflowers'),
    path('M1530 900v-120M1570 900v-150', { fill: 'none', stroke: '#3a8a3a', 'stroke-width': 6 }),
    path(circD(1530, 780, 26) + circD(1570, 750, 30), { fill: '#ffc83a' }), path(circD(1530, 780, 11) + circD(1570, 750, 13), { fill: '#6a3a1a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'card', x: r(ppl.card[0]), y: r(ppl.card[1]), r: 34, label: 'Make a thank-you card' },
      { activity: 'dressup', x: r(ppl.helmet[0]), y: r(ppl.helmet[1]), r: 36, label: 'Try on a work hat' },
      { activity: 'memory', x: ppl.table[0], y: ppl.table[1], r: 50, label: 'Match the picnic food' },
      { activity: 'colour', x: ppl.truck[0], y: ppl.truck[1], r: 70, label: 'Colour the fire engine' },
    ],
    findables: [
      { id: 'lemonade', label: 'a cup of lemonade', x: r(ppl.lemonade[0]), y: r(ppl.lemonade[1]), r: 16 },
      { id: 'mailbag', label: 'the mail bag', x: r(ppl.mailbag[0]), y: r(ppl.mailbag[1]), r: 24 },
      { id: 'burgers', label: 'burgers on the grill', x: ppl.grill[0], y: ppl.grill[1], r: 24 },
      { id: 'frisbee', label: 'a pink frisbee', x: 1004, y: 846, r: 16 },
      { id: 'crane', label: 'a crane far away', x: 1340, y: 400, r: 40 },
      { id: 'bell', label: 'the fire engine bell', x: 1550, y: 650, r: 18 },
      { id: 'watermelon', label: 'watermelon slices', x: 490, y: 772, r: 24 },
    ],
  };
}
