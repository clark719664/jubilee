// Indigenous Peoples' Day — "The Three Sisters": a golden October afternoon by a lake, honouring the first peoples of
// this land and what they have always grown. In a Three Sisters garden, tall corn holds up the climbing beans while
// broad squash leaves shade the soil; a girl hoists the biggest squash. Beside a log by the lakeshore a grandmother in a
// ribbon skirt, her grey braid over her shoulder, tells two children the story of the Three Sisters; a boy carries a
// basket of many-coloured flint corn, and more corn hangs in braids to dry on a wooden rack. A canoe glides on the
// lake, an eagle circles, a turtle suns on a rock and a deer watches from the trees. The falling leaves are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, line, circD, ellD } from '../../kit/scenekit.mjs';

const ID = 'indigenous-peoples-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SKIN = { a: '#b07a52', b: '#9a6440', c: '#c08860', d: '#8a5636' };
const HAIR = '#1a120e';
const GROUND = 690;
const FALL = ['#c8102e', '#e8641a', '#ffb703', '#d84a1a', '#f0a020'];
const CORN = ['#ffd166', '#c8102e', '#5a3a8a', '#f4f0e0', '#e8641a', '#3a2a5a'];

/** An ear of flint corn pointing along angle `deg`: husk leaves and rows of many-coloured kernels. */
function ear(x, y, len, deg, seed) {
  const R = rng(seed);
  const w = len * 0.26;
  let k = '';
  for (let i = 0; i < 6; i++) for (let j = -1; j <= 1; j++) {
    const u = len * (0.2 + i * 0.13), v = j * w * 0.5 * (1 - i * 0.08);
    k += circle(u, v, w * 0.22, { fill: CORN[Math.floor(R() * CORN.length)] });
  }
  return G({ transform: `translate(${f(x)} ${f(y)}) rotate(${f(deg)})` },
    path(`M0 0Q${f(len * 0.5)} ${f(-w * 1.1)} ${f(len)} 0Q${f(len * 0.5)} ${f(w * 1.1)} 0 0Z`, { fill: '#c8a050' }), k,
    path(`M0 0Q${f(len * 0.3)} ${f(-w * 0.9)} ${f(-len * 0.2)} ${f(-w * 1.4)}M0 0Q${f(len * 0.3)} ${f(w * 0.9)} ${f(-len * 0.24)} ${f(w * 1.2)}`, { fill: 'none', stroke: '#e0c070', 'stroke-width': w * 0.3, 'stroke-linecap': 'round' }));
}

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(9);
  let woods = '';
  const cols = {};
  for (let x = -20; x < 1640; x += 28 + R() * 20) { const c = FALL[Math.floor(R() * FALL.length)]; (cols[c] ??= []).push(circD(x, 588 - R() * 18, 20 + R() * 14)); }
  for (const [c, ds] of Object.entries(cols)) woods += path(ds.join(''), { fill: mix(c, '#7a3e3a', 0.35) });
  const defs = [
    lin(id('lake'), 0, 0, 0, 1, [[0, '#f0b060'], [0.5, '#c87a50'], [1, '#6a5a7a']]),
    rad(id('sun'), 0.5, 0.5, 0.5, [[0, '#fff0c0', 0.8], [0.4, '#ffc870', 0.3], [1, '#ffc870', 0]]),
  ];
  return compactSvg(doc(`Indigenous Peoples' Day · back: a low golden sun glowing behind far blue-violet mountains, a shore of autumn woods in red, orange and gold, and a calm lake catching the light; a deer at the woods' edge; kept low behind the copy`, defs, [
    C('the low autumn sun, a soft glow on the left'),
    circle(260, 520, 260, { fill: url('sun') }),
    C('far mountains'),
    path('M-20 560L120 486L230 530L380 450L520 520L640 470L800 540L960 480L1100 530L1240 462L1400 520L1520 476L1620 510V640H-20Z', { fill: '#6a5a8a' }),
    path('M-20 580L180 530L360 566L560 520L760 570L980 530L1180 566L1400 520L1620 560V640H-20Z', { fill: '#5a4a78' }),
    C('a shore of autumn woods'),
    woods,
    C('the lake'),
    path('M-20 600Q800 590 1620 600V700H-20Z', { fill: url('lake') }),
    line('M200 626h140M520 640h220M900 622h160M1180 648h200M80 660h120', '#fff0c0', 3, { opacity: 0.5 }),
    C('a deer watching from the woods\' edge'),
    G({ transform: 'translate(1256 600)' }, path('M-20 0v-22q0 -8 10 -10h22q10 0 12 -10l4 -12l8 2l-2 14q-2 8 -10 10l-2 28h-4v-18h-24v18z', { fill: '#8a5a3a' }), path('M26 -54l-6 -10M26 -54l4 -12M30 -50l10 -8', { fill: 'none', stroke: '#6a4228', 'stroke-width': 2.4, 'stroke-linecap': 'round' }), circle(28, -38, 1.6, { fill: '#1a1a1a' })),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('meadow'), 0, 0, 0, 1, [[0, '#b0a050'], [1, '#7a7a3a']]),
    lin(id('soil'), 0, 0, 0, 1, [[0, '#7a4a2a'], [1, '#5a341c']]),
    rad(id('squash'), 0.36, 0.32, 0.72, [[0, '#ffc060'], [0.6, '#f08a1a'], [1, '#c8601a']]),
    lin(id('log'), 0, 0, 0, 1, [[0, '#9a6a42'], [1, '#6a4428']]),
    rad(id('warm'), 0.5, 0.5, 0.5, [[0, '#ffe0a0', 0.4], [1, '#ffe0a0', 0]]),
  ];

  // ---- the meadow by the lakeshore
  out.push(C('the meadow by the lakeshore'));
  out.push(path(`M-20 ${GROUND - 14}Q500 ${GROUND - 30} 900 ${GROUND - 18}T1620 ${GROUND - 20}V920H-20Z`, { fill: url('meadow') }));
  out.push(ellipse(960, 800, 420, 120, { fill: url('warm') }));

  // ---- the eagle circling high on the left
  out.push(C('an eagle circling high over the trees'));
  out.push(G({ transform: 'translate(150 190) rotate(-6)' }, path('M0 0C-20 -10 -50 -14 -86 -6C-70 -2 -60 4 -52 4C-62 8 -70 14 -74 20C-50 14 -24 10 0 8C24 10 50 14 74 20C70 14 62 8 52 4C60 4 70 -2 86 -6C50 -14 20 -10 0 0Z', { fill: '#4a2e1a' }), ellipse(0, 4, 8, 14, { fill: '#4a2e1a' }), circle(0, -6, 6, { fill: '#f4f0e8' }), path('M0 18l-8 10h16z', { fill: '#f4f0e8' }), path('M3 -6l5 2l-5 1z', { fill: '#ffb020' })));
  ppl.eagle = [150, 194];

  // ---- the maple on the far left
  out.push(C('a maple in full autumn colour on the left'));
  {
    const t = bareTree(90, GROUND + 30, 300, 8, { lean: 0.06, depth: 5, spread: 0.6, trunk: 0.12 });
    out.push(path(t.d, { fill: '#5a3a24' }));
    const R = rng(2);
    const byCol = {};
    t.tips.forEach(([x, y]) => { for (let k = 0; k < 3; k++) { const c = FALL[Math.floor(R() * 4)]; (byCol[c] ??= []).push(circD(x + (R() - 0.5) * 36, y + (R() - 0.5) * 30, 16 + R() * 10)); } });
    for (const [c, ds] of Object.entries(byCol)) out.push(path(ds.join(''), { fill: c }));
  }

  // ---- the Three Sisters garden: corn, beans, squash
  out.push(C('the Three Sisters garden: tall corn holds up the climbing beans, broad squash leaves shade the soil'));
  {
    out.push(path('M250 742Q470 720 700 742L716 772Q470 790 236 772Z', { fill: url('soil') }));
    const stalks = [[300, 280], [370, 300], [440, 270], [510, 296], [590, 276], [660, 262]];
    let st = '', lv = '', beans = '', pods = '';
    stalks.forEach(([x, h], i) => {
      const top = 752 - h;
      st += `M${x} 752Q${x + 6} ${top + h / 2} ${x + 2} ${top}`;
      for (let k = 0; k < 4; k++) { const y = 740 - k * h * 0.22, s = k % 2 ? 1 : -1; lv += `M${x + 3} ${f(y)}q${s * 30} -20 ${s * 62} 6q${-s * 34} -8 ${-s * 62} -6z`; }
      // the bean vine spiralling up
      let b = `M${x} 752`;
      for (let y = 752; y > top + 30; y -= 26) b += `q${(Math.round(y / 26) % 2 ? 1 : -1) * 14} -13 0 -26`;
      beans += b;
      for (let k = 0; k < 3; k++) pods += `M${x + 8} ${f(720 - k * h * 0.26)}q6 14 2 30q-6 -14 -2 -30z`;
      ppl[`stalk${i}`] = [x, top];
    });
    out.push(line(st, '#8a9a3a', 7), path(lv, { fill: '#6a8a2a' }));
    out.push(line(beans, '#3a7a3a', 2.4), path(pods, { fill: '#5aa84a' }));
    // tassels and a few ripe ears
    let tas = '';
    for (const [x, h] of stalks) tas += `M${x + 2} ${752 - h}l-10 -18M${x + 2} ${752 - h}l2 -22M${x + 2} ${752 - h}l12 -16`;
    out.push(line(tas, '#e0c070', 3));
    out.push(ear(306, 590, 40, -60, 1), ear(446, 600, 42, -116, 2), ear(596, 596, 40, -64, 3));
    // squash leaves and squash on the ground
    let sl = '';
    for (const [x, y] of [[270, 760], [350, 770], [470, 766], [560, 772], [680, 764], [400, 750]]) sl += `M${x} ${y}c-30 -10 -40 -40 -10 -50c10 -10 30 -10 40 0c30 10 20 40 -10 50z`;
    out.push(path(sl, { fill: '#4a8a3a' }), line('M262 744l10 -30M342 754l10 -30M462 750l10 -30M672 748l10 -30', '#2a6a2a', 2));
    out.push(ellipse(330, 778, 30, 20, { fill: url('squash') }), path('M318 760q12 -6 24 0', { fill: 'none', stroke: '#c8601a', 'stroke-width': 2 }), ellipse(694, 782, 24, 16, { fill: '#5a8a3a' }), path('M676 778q18 -8 36 0', { fill: 'none', stroke: '#c8d070', 'stroke-width': 3 }), path('M432 784c0 -20 20 -24 30 -10c14 0 18 14 8 22c-10 8 -38 6 -38 -12z', { fill: '#ffd166' }));
  }

  // ---- the girl hoisting the biggest squash
  out.push(C('a girl in the garden hoists the biggest squash'));
  {
    const up = (s) => ({ sx: s, elbow: [s * 1.2, 0.5], hand: [s * 1.25, 1.0] });
    const g = figure({ x: 540, foot: 836, H: 124, heads: 2.8, skin: SKIN.a, hair: HAIR, style: 'side', top: '#2a8a8a', bottom: '#3a3a5a', shoe: '#6a3a1a', gaze: 0.2, mouth: 'open', arms: [up(-1), up(1)] });
    out.push(g.svg);
    // a long braid over her shoulder
    let br = '';
    for (let k = 0; k < 5; k++) br += ellD(540 - g.r * 1.02 + (k % 2) * 2, g.headY + g.r * 0.7 + k * g.r * 0.3, g.r * 0.18, g.r * 0.18);
    out.push(path(br, { fill: HAIR }));
    const [hx, hy] = g.hand(up(-1)), [hx2] = g.hand(up(1));
    const sx = (hx + hx2) / 2, sy = hy;
    out.push(ellipse(sx, sy, 50, 30, { fill: url('squash') }), path(`M${f(sx - 30)} ${f(sy - 22)}q-6 22 0 46M${f(sx)} ${f(sy - 30)}v60M${f(sx + 30)} ${f(sy - 22)}q6 22 0 46`, { fill: 'none', stroke: '#d8701a', 'stroke-width': 2.4 }), path(`M${f(sx + 46)} ${f(sy - 8)}l12 -8l4 6l-12 8z`, { fill: '#5a7a2a' }));
    out.push(circle(hx, hy, g.r * 0.34, { fill: SKIN.a }), circle(hx2, hy, g.r * 0.34, { fill: SKIN.a }));
    out.push(line(`M${f(sx - 70)} ${f(sy - 20)}l-14 -8M${f(sx + 70)} ${f(sy - 20)}l14 -8`, '#ffd166', 3.4));
    ppl.squash = [sx, sy];
  }

  // ---- grandmother on the log telling the story of the Three Sisters
  out.push(C('the focal point: beside a log by the shore a grandmother in a ribbon skirt, her grey braid over her shoulder, tells two children the story of the Three Sisters'));
  {
    out.push(path('M820 790q0 -26 26 -26h196q26 0 26 26t-26 26h-196q-26 0 -26 -26z', { fill: url('log') }), ellipse(1060, 790, 14, 24, { fill: '#c8a070' }), path('M1060 790m-8 0a8 14 0 1 0 16 0a8 14 0 1 0 -16 0', { fill: 'none', stroke: '#9a7048', 'stroke-width': 2 }));
    const tell = [{ sx: -1, elbow: [-0.9, 0.7], hand: [-1.6, 0.5] }, { sx: 1, elbow: [1.0, -0.1], hand: [1.3, -1.3] }];
    const gm = figure({ x: 950, foot: 790, H: 150, heads: 3.3, skin: SKIN.d, hair: '#d8d4d8', style: 'side', top: '#f4ece0', bottom: '#2a3a7a', shoe: '#6a3a1a', gaze: 0.5, mouth: 'open', arms: tell });
    out.push(gm.svg);
    // the ribbon skirt, from her waist over her knees to the ground, with its ribbon bands
    const tb = gm.torsoBot - gm.r * 0.4;
    out.push(path(`M${f(950 - gm.tw * 0.5)} ${f(tb)}H${f(950 + gm.tw * 0.5)}L${f(950 + gm.tw * 0.95)} 850H${f(950 - gm.tw * 0.95)}Z`, { fill: '#2a3a7a' }));
    out.push(path(`M${f(950 - gm.tw * 0.84)} 818H${f(950 + gm.tw * 0.84)}v6H${f(950 - gm.tw * 0.84)}z`, { fill: '#c8102e' }), path(`M${f(950 - gm.tw * 0.88)} 828H${f(950 + gm.tw * 0.88)}v6H${f(950 - gm.tw * 0.88)}z`, { fill: '#ffb703' }), path(`M${f(950 - gm.tw * 0.92)} 838H${f(950 + gm.tw * 0.92)}v6H${f(950 - gm.tw * 0.92)}z`, { fill: '#f4f0e8' }));
    out.push(path(`M${f(950 - gm.tw * 0.9)} 850h${f(gm.tw * 0.5)}v6h${f(-gm.tw * 0.5)}zM${f(950 + gm.tw * 0.4)} 850h${f(gm.tw * 0.5)}v6h${f(-gm.tw * 0.5)}z`, { fill: '#6a3a1a' }));
    let br = '';
    for (let k = 0; k < 7; k++) br += ellD(950 + gm.r * 1.02 + (k % 2) * 2, gm.headY + gm.r * 0.7 + k * gm.r * 0.3, gm.r * 0.18, gm.r * 0.18);
    out.push(path(br, { fill: '#d8d4d8' }), circle(950 + gm.r * 1.02, gm.headY + gm.r * 2.8, gm.r * 0.14, { fill: '#c8102e' }));
    // her open storytelling hands frame three little sprouts of story-light
    { const [tx, ty] = gm.hand(tell[1]); out.push(line(`M${f(tx - 14)} ${f(ty - 16)}l-6 -12M${f(tx)} ${f(ty - 20)}v-14M${f(tx + 14)} ${f(ty - 16)}l6 -12`, '#ffe9a3', 3, { opacity: 0.9 })); }
    ppl.grandma = [950, gm.headY + 40];
    // two children sitting cross-legged on the grass, listening
    const kid = (x, foot, H, skin, style, top, bottom, gaze, mouth) => {
      const k = figure({ x, foot, H, heads: 2.6, skin, hair: HAIR, style, top, bottom, shoe: '#4a2a1a', gaze, mouth, arms: [{ sx: -1, elbow: [-0.5, 1.0], hand: [0.1, 1.6] }, { sx: 1, elbow: [0.5, 1.0], hand: [-0.1, 1.6] }] });
      return k.svg + path(`M${f(x - k.tw * 1.05)} ${f(foot - 4)}q${f(k.tw * 1.05)} ${f(-k.r * 1.2)} ${f(k.tw * 2.1)} 0q${f(-k.tw * 1.05)} ${f(k.r * 0.6)} ${f(-k.tw * 2.1)} 0z`, { fill: bottom });
    };
    out.push(kid(800, 852, 80, SKIN.b, 'puffs', '#e8641a', '#3a4a6a', 0.6, 'smile'), kid(1110, 856, 84, SKIN.c, 'short', '#c8102e', '#4a4a3a', -0.6, 'open'));
    ppl.kids = [960, 820];
  }

  // ---- the boy with the basket of flint corn, the drying rack
  out.push(C('a boy carries a basket of many-coloured flint corn; braids of corn hang to dry on a wooden rack'));
  {
    out.push(line('M1300 820V600M1480 820V600M1290 604H1490', '#7a4e2e', 8));
    [1330, 1380, 1430].forEach((x, i) => {
      out.push(line(`M${x} 604v14`, '#c8a050', 3));
      for (let k = 0; k < 4; k++) out.push(ear(x + (k % 2 ? 8 : -8), 626 + k * 26, 30, 90 + (k % 2 ? -18 : 18), 10 + i * 4 + k));
    });
    ppl.rack = [1380, 680];
    const carry = { sx: -1, elbow: [-0.6, 0.9], hand: [0.2, 1.3] };
    const b = figure({ x: 1220, foot: 846, H: 120, heads: 2.7, skin: SKIN.b, hair: HAIR, style: 'short', top: '#5a3a8a', bottom: '#2a3a4a', shoe: '#ffffff', gaze: -0.4, mouth: 'smile', arms: [carry, { sx: 1, elbow: [0.5, 0.9], hand: [-0.1, 1.4] }] });
    out.push(b.svg);
    const [bx, by] = b.hand(carry);
    out.push(path(`M${f(bx - 30)} ${f(by - 14)}h70l-8 40h-54z`, { fill: '#c8945a' }), line(`M${f(bx - 28)} ${f(by - 2)}h66M${f(bx - 26)} ${f(by + 12)}h62`, '#9a6a3a', 2));
    out.push(ear(bx - 22, by - 14, 30, -70, 31), ear(bx - 2, by - 16, 32, -96, 32), ear(bx + 22, by - 14, 30, -116, 33));
    ppl.basket = [bx + 4, by];
  }

  // ---- the canoe on the lake, the turtle on its rock, the heron
  out.push(C('a canoe gliding on the lake; a turtle sunning on a rock; a heron in the shallows'));
  out.push(path('M1040 652q90 16 180 0q-10 14 -40 16h-100q-30 -2 -40 -16z', { fill: '#a8542a' }), line('M1046 654q84 12 168 0', '#e8a060', 2));
  out.push(path('M1104 650l2 -26a8 8 0 1 1 6 0l2 26zM1164 650l2 -24a7 7 0 1 1 6 0l2 24z', { fill: '#2a3a4a' }), line('M1092 632l30 30M1186 628l-20 34', '#8a5a2a', 3));
  ppl.canoe = [1130, 650];
  out.push(path('M1500 712q30 -26 70 -10q20 10 10 20q-40 8 -80 -10z', { fill: '#8a8478' }));
  out.push(G({ transform: 'translate(1536 696)' }, path('M-22 0q0 -18 22 -18q22 0 22 18z', { fill: '#5a7a3a' }), path('M-14 -4l6 -8l8 6l8 -6l6 8', { fill: 'none', stroke: '#3a5a2a', 'stroke-width': 2 }), path('M22 -6q10 -6 14 2q-4 6 -14 4z', { fill: '#7a9a4a' }), circle(32, -4, 1.4, { fill: '#1a1a1a' }), path('M-16 0v4M14 0v4', { fill: 'none', stroke: '#5a7a3a', 'stroke-width': 4, 'stroke-linecap': 'round' })));
  ppl.turtle = [1540, 690];
  out.push(G({ transform: 'translate(760 668)' }, line('M-2 0v20M4 0v20', '#6a6a7a', 2), ellipse(0, -6, 14, 9, { fill: '#a8b4c8' }), path('M-10 -10q-10 -20 -2 -32', { fill: 'none', stroke: '#a8b4c8', 'stroke-width': 5, 'stroke-linecap': 'round' }), circle(-12, -42, 5, { fill: '#a8b4c8' }), path('M-16 -42l-14 2l14 2z', { fill: '#e8a020' }), circle(-12, -43, 1.2, { fill: '#1a1a1a' })));
  ppl.heron = [756, 650];

  // ---- a monarch butterfly
  out.push(G({ transform: 'translate(700 560) rotate(14)' }, ellipse(-9, -6, 10, 8, { fill: '#f08a1a' }), ellipse(9, -6, 10, 8, { fill: '#f08a1a' }), ellipse(-6, 6, 7, 6, { fill: '#e8641a' }), ellipse(6, 6, 7, 6, { fill: '#e8641a' }), path('M-17 -6h16M1 -6h16M-9 -13v14M9 -13v14', { fill: 'none', stroke: '#2a1a0a', 'stroke-width': 1.2, opacity: 0.6 }), line('M0 -10v20', '#1a1a1a', 2.4)));
  ppl.monarch = [700, 560];

  return { svg: compactSvg(doc(`Indigenous Peoples' Day · mid. Concept: "the Three Sisters" on a golden October afternoon by a lake, honouring the first peoples of this land and what they have always grown. Focal point: beside a log by the shore a grandmother in a ribbon skirt, her grey braid over her shoulder, tells two children the story of the Three Sisters (x 780–1140, y 600–860). In the Three Sisters garden tall corn holds up the climbing beans and broad squash leaves shade the soil, and a girl hoists the biggest squash; a boy carries a basket of many-coloured flint corn and corn hangs in braids to dry on a wooden rack. A canoe on the lake, an eagle circling, a turtle on a rock, a heron, a monarch butterfly, a deer at the woods' edge. Light story: low golden sun from the left. The falling leaves are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  const leaf = (x, y, r, deg, c) => path(`M${f(-r)} 0Q0 ${f(-r * 0.8)} ${f(r)} 0Q0 ${f(r * 0.8)} ${f(-r)} 0Z`, { fill: c, transform: `translate(${f(x)} ${f(y)}) rotate(${deg})` });
  return compactSvg(doc(`Indigenous Peoples' Day · front: tall grass and fallen leaves in the bottom corners, a chipmunk with an acorn bottom right; the centre stays open`, [], [
    C('tall grass and fallen leaves, bottom left'),
    line('M14 900q6 -70 -8 -120M40 900q-2 -60 14 -104M66 900q4 -44 -10 -80', '#8a8a3a', 5),
    leaf(60, 880, 16, 20, '#c8102e'), leaf(110, 890, 14, -30, '#ffb703'), leaf(20, 860, 12, 60, '#e8641a'),
    C('a chipmunk with an acorn, bottom right'),
    G({ transform: 'translate(1480 872)' }, path('M-16 0q-4 -24 12 -30q18 -4 20 18q0 12 -8 12z', { fill: '#b07a4a' }), path('M-10 -6q2 -16 10 -20', { fill: 'none', stroke: '#3a2a1a', 'stroke-width': 3 }), circle(10, -30, 10, { fill: '#b07a4a' }), circle(14, -32, 1.6, { fill: '#1a1a1a' }), path('M4 -38l2 -6l4 4z', { fill: '#b07a4a' }), path('M-16 -6q-24 -10 -16 -34q10 10 6 30z', { fill: '#8a5a32' }), ellipse(20, -16, 5, 6, { fill: '#a8743e' }), path('M15 -21h10v-3h-10z', { fill: '#6a4428' })),
    leaf(1540, 884, 16, -20, '#d84a1a'), leaf(1580, 868, 13, 40, '#ffb703'),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'card', x: ppl.grandma[0], y: r(ppl.grandma[1]), r: 44, label: 'Make a thank-you card' },
      { activity: 'colour', x: r(ppl.squash[0]), y: r(ppl.squash[1]), r: 46, label: 'Colour the Three Sisters' },
      { activity: 'catch', x: ppl.stalk2[0], y: ppl.stalk2[1] + 60, r: 60, label: 'Catch corn and leaves' },
      { activity: 'memory', x: r(ppl.basket[0]), y: r(ppl.basket[1]), r: 36, label: 'Harvest memory game' },
      { activity: 'wish', x: ppl.canoe[0], y: ppl.canoe[1], r: 44, label: 'Make a wish for the land' },
    ],
    findables: [
      { id: 'turtle', label: 'a turtle on a rock', x: ppl.turtle[0], y: ppl.turtle[1], r: 24 },
      { id: 'eagle', label: 'an eagle', x: ppl.eagle[0], y: ppl.eagle[1], r: 40 },
      { id: 'heron', label: 'a heron', x: ppl.heron[0], y: ppl.heron[1], r: 22 },
      { id: 'monarch', label: 'a monarch butterfly', x: ppl.monarch[0], y: ppl.monarch[1], r: 18 },
      { id: 'deer', label: 'a deer in the trees', x: 1276, y: 574, r: 26 },
      { id: 'chipmunk', label: 'a chipmunk with an acorn', x: 1490, y: 852, r: 22 },
      { id: 'corn-braid', label: 'corn drying on a rack', x: ppl.rack[0], y: ppl.rack[1], r: 30 },
    ],
  };
}
