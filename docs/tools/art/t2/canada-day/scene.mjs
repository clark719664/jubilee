// Canada Day — "Fireworks over the lake": the evening of 1 July at a lakeside park. A family on a red-and-white
// plaid blanket on the grassy bank waits for the fireworks: a girl with a maple leaf painted on her cheek waves a
// flag, her brother in a red hockey jersey holds up a beavertail pastry, grandma has a maple leaf cookie. A red canoe
// is tied at the wooden dock, a loon floats on the lake, a beaver peeks out by its lodge, and a stone clock tower
// with a green copper roof rises across the water among dark pines. The fireworks are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { pineSil, bareTree, line, circD } from '../../kit/scenekit.mjs';

const ID = 'canada-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const RED = '#d62828', WHITE = '#ffffff';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const SHORE = 640, BANK = 760;

/** An 11-point maple leaf centered at (x, y), size s. */
export function mapleD(x, y, s) {
  const pts = [[0, -1], [0.18, -0.62], [0.42, -0.74], [0.36, -0.36], [0.82, -0.52], [0.7, -0.2], [0.92, -0.1], [0.5, 0.2], [0.58, 0.42], [0.08, 0.34], [0.06, 0.78], [-0.06, 0.78], [-0.08, 0.34], [-0.58, 0.42], [-0.5, 0.2], [-0.92, -0.1], [-0.7, -0.2], [-0.82, -0.52], [-0.36, -0.36], [-0.42, -0.74], [-0.18, -0.62]];
  return pts.map(([u, v], i) => `${i ? 'L' : 'M'}${P(x + u * s, y + v * s)}`).join('') + 'Z';
}

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(5);
  let pines = '';
  for (let x = -20; x < 1640; x += 26 + R() * 30) { const h = 50 + R() * 60; pines += pineSil(x, SHORE + 4, x > 300 && x < 1300 ? Math.min(h, 160) : h, h * 0.55); }
  const tower = 'M1424 640V420h56V640ZM1416 424l36 -60l36 60ZM1446 364v-24h6v24Z';
  const defs = [lin(id('glow'), 0, 0, 0, 1, [[0, '#ff8a6a', 0], [1, '#ffb88a', 0.5]])];
  return compactSvg(doc(`Canada Day · back: a warm glow low on the horizon of the red evening sky; dark pines along the far shore; a stone clock tower with a green copper roof on the right, outside the copy zone`, defs, [
    C('the last glow of the evening, low'),
    path('M-20 470H1620V640H-20Z', { fill: url('glow') }),
    C('the far shore pines and the clock tower'),
    path(pines, { fill: '#3a0a12' }),
    path(tower, { fill: '#c8b8a0' }), path('M1416 424l36 -60l36 60Z', { fill: '#4ab89a' }),
    circle(1452, 460, 14, { fill: '#fff6d8' }), line('M1452 460v-8M1452 460l6 4', '#3a2a2a', 2),
    path('M1436 520h10v20h-10zM1458 520h10v20h-10zM1436 570h10v20h-10zM1458 570h10v20h-10z', { fill: '#ffd98a' }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('lake'), 0, 0, 0, 1, [[0, '#3a2a5a'], [1, '#1a2a4a']]),
    lin(id('grass'), 0, 0, 0, 1, [[0, '#3a7a3a'], [1, '#2a5a2a']]),
    lin(id('wood'), 0, 0, 0, 1, [[0, '#a8744a'], [1, '#7a4e2a']]),
    lin(id('canoe'), 0, 0, 0, 1, [[0, '#ff4a4a'], [1, '#a81a1a']]),
  ];

  // ---- the lake, reflecting the fireworks glow
  out.push(C('the lake, with soft reflections of the evening glow'));
  out.push(path(`M-20 ${SHORE}H1620V920H-20Z`, { fill: url('lake') }));
  { const R = rng(9); let rip = ''; for (let i = 0; i < 40; i++) { const x = R() * 1600, y = SHORE + 14 + R() * 200; rip += `M${P(x, y)}h${f(20 + R() * 40)}`; } out.push(line(rip, '#ff9a8a', 2.4, { opacity: 0.4 })); }
  out.push(path('M1380 660h140v4h-140zM1400 672h100v3h-100z', { fill: '#ffd98a', opacity: 0.6 }));

  // ---- the loon and the beaver lodge
  out.push(C('a loon floating on the lake; a beaver peeking out beside its lodge of sticks'));
  out.push(G({ transform: 'translate(980 700)' }, ellipse(0, 4, 40, 4, { fill: '#ffffff', opacity: 0.25 }), path('M-30 0c0 -16 20 -22 40 -18l14 -2c6 0 8 6 4 10c4 8 -4 12 -14 12h-34c-6 0 -10 -2 -10 -2z', { fill: '#1a1a24' }), path('M-14 -6h4v4h-4zM-4 -8h4v4h-4zM6 -8h4v4h-4zM-10 -12h4v4h-4zM2 -14h4v4h-4z', { fill: '#ffffff' }), circle(26, -18, 8, { fill: '#1a1a24' }), path('M32 -18l12 2l-12 3z', { fill: '#2a2a2a' }), circle(28, -20, 1.8, { fill: '#e8243a' }), path('M20 -12h12', { fill: 'none', stroke: '#ffffff', 'stroke-width': 2, 'stroke-dasharray': '2 2' })));
  ppl.loon = [990, 684];
  out.push(path('M1200 700q60 -70 130 0z', { fill: '#5a3a22' }), line('M1210 696l30 -40M1240 696l20 -50M1280 696l-10 -50M1310 696l-30 -40M1230 680l70 -10M1220 690l90 -4', '#7a5030', 4));
  out.push(G({ transform: 'translate(1350 708)' }, path('M-16 0c-2 -16 4 -24 16 -24c12 0 18 8 16 24z', { fill: '#8a5a32' }), circle(-4, -26, 10, { fill: '#8a5a32' }), circle(-10, -32, 3, { fill: '#6a4022' }), circle(2, -32, 3, { fill: '#6a4022' }), circle(-8, -28, 1.6, { fill: '#1a1010' }), circle(0, -28, 1.6, { fill: '#1a1010' }), path('M-6 -22h4v5h-4z', { fill: '#ffffff' }), ellipse(24, 0, 14, 6, { fill: '#5a3a22', transform: 'rotate(-14 24 0)' })));
  ppl.beaver = [1346, 690];

  // ---- the dock and the red canoe
  out.push(C('a wooden dock with a red canoe tied up and a paddle across it'));
  out.push(path('M560 720h300v14h-300z', { fill: url('wood') }), line('M576 734v40M650 734v40M724 734v40M798 734v40M846 734v40', '#5a3a22', 8));
  { let planks = ''; for (let x = 560; x < 860; x += 30) planks += `M${x} 720v14`; out.push(line(planks, '#6a4422', 2)); }
  out.push(path('M600 770Q740 800 880 770L866 758H614Z', { fill: url('canoe') }), path('M614 758H866', { fill: 'none', stroke: '#ffe0c8', 'stroke-width': 4 }), path('M660 760v-6h6v6zM740 762v-6h6v6zM820 760v-6h6v6z', { fill: '#7a4e2a' }));
  out.push(line('M640 752l140 -4', '#c8945a', 5), ellipse(790, 748, 16, 6, { fill: '#c8945a' }), line('M600 768q-30 -20 -40 -40', '#e8d8b8', 2));
  ppl.canoe = [740, 770];

  // ---- the grassy bank in front
  out.push(C('the grassy bank'));
  out.push(path(`M-20 920V${BANK}Q300 ${BANK - 30} 560 ${BANK + 10}T1100 ${BANK + 20}T1620 ${BANK}V920Z`, { fill: url('grass') }));

  // ---- the maple tree on the left
  {
    const t = bareTree(130, BANK + 20, 440, 17, { lean: 0.03, depth: 5, spread: 0.55, trunk: 0.12 });
    out.push(path(t.d, { fill: '#4a3022' }));
    out.push(path(t.tips.map(([x, y]) => mapleD(x, y, 40)).join(''), { fill: '#3a8a3a' }));
    out.push(path(t.tips.filter((_, i) => i % 4 === 0).map(([x, y]) => mapleD(x + 10, y + 16, 26)).join(''), { fill: RED }));
  }

  // ---- string lights in red and white along the bank
  out.push(line('M300 800Q600 830 900 806', '#2a2a2a', 2));
  for (let k = 0; k < 14; k++) { const t = k / 13, x = 300 + 600 * t, y = 800 + Math.sin(t * Math.PI) * 18 - t * 4; out.push(circle(x, y + 6, 6, { fill: k % 2 ? WHITE : RED })); }

  // ---- the family on the plaid blanket
  out.push(C('the family on a red-and-white plaid blanket: a girl with a maple leaf painted on her cheek waves a flag, her brother in a red hockey jersey holds up a beavertail, grandma with a maple leaf cookie'));
  {
    out.push(path('M300 880L340 820H760L800 880Z', { fill: WHITE }));
    let plaid = '';
    for (let k = 0; k < 6; k++) plaid += `M${340 + k * 72} 820L${300 + k * 84} 880h22L${358 + k * 72} 820z`;
    out.push(path(plaid + 'M330 836H770v12H320zM312 860H788v12H306z', { fill: RED, opacity: 0.85 }));
    const cheer = (s) => ({ sx: s, elbow: [s * 0.9, -0.9], hand: [s * 1.2, -2.2] });
    // the girl waving the flag
    const g = figure({ x: 420, foot: 846, H: 86, heads: 2.7, skin: SKIN.light, hair: '#c8642a', style: 'puffs', top: WHITE, bottom: RED, shoe: WHITE, gaze: 0.3, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, cheer(1)] });
    out.push(g.svg, path(mapleD(420 + g.r * 0.5, g.headY + g.r * 0.3, g.r * 0.32), { fill: RED }));
    const gh = g.hand(cheer(1));
    out.push(line(`M${P(gh[0], gh[1] + 10)}V${f(gh[1] - 60)}`, '#d8c8a8', 3), path(`M${P(gh[0], gh[1] - 60)}h70v40h-70z`, { fill: WHITE }), path(`M${P(gh[0], gh[1] - 60)}h18v40h-18zM${P(gh[0] + 52, gh[1] - 60)}h18v40h-18z`, { fill: RED }), path(mapleD(gh[0] + 35, gh[1] - 40, 14), { fill: RED }), circle(gh[0], gh[1], g.r * 0.36, { fill: SKIN.light }));
    ppl.flag = [gh[0] + 35, gh[1] - 40];
    ppl.facepaint = [420 + g.r * 0.5, g.headY + g.r * 0.3];
    // the boy in the hockey jersey with a beavertail
    const hold = { sx: -1, elbow: [-0.9, -0.4], hand: [-1.2, -1.4] };
    const b = figure({ x: 560, foot: 850, H: 88, heads: 2.7, skin: SKIN.brown, hair: '#1a1210', style: 'curls', top: RED, bottom: '#2a2a3a', shoe: '#2a2a3a', gaze: -0.2, mouth: 'open', arms: [hold, { sx: 1, elbow: [0.6, 1.0], hand: [0.4, 1.9] }] });
    out.push(b.svg, path(`M${P(560 - b.tw * 0.5, b.torsoTop + b.r * 1.5)}h${f(b.tw)}v${f(b.r * 0.2)}h${f(-b.tw)}zM${P(560 - b.tw * 0.5, b.torsoTop + b.r * 1.9)}h${f(b.tw)}v${f(b.r * 0.2)}h${f(-b.tw)}z`, { fill: WHITE }), path(mapleD(560, b.torsoTop + b.r * 0.9, b.r * 0.34), { fill: WHITE }));
    const bh = b.hand(hold);
    out.push(ellipse(bh[0] - 4, bh[1] - 22, 16, 26, { fill: '#c8843a', transform: `rotate(-12 ${f(bh[0] - 4)} ${f(bh[1] - 22)})` }), ellipse(bh[0] - 4, bh[1] - 26, 10, 18, { fill: '#e8a868', transform: `rotate(-12 ${f(bh[0] - 4)} ${f(bh[1] - 26)})` }), path(`M${P(bh[0] - 10, bh[1] - 36)}l12 6M${P(bh[0] - 12, bh[1] - 26)}l12 6`, { fill: 'none', stroke: '#f8f0e0', 'stroke-width': 2.4 }), circle(bh[0], bh[1], b.r * 0.36, { fill: SKIN.brown }));
    ppl.beavertail = [bh[0] - 4, bh[1] - 24];
    // grandma with a maple leaf cookie
    const cookie = { sx: 1, elbow: [0.8, 0.2], hand: [1.3, 0.2] };
    const gm = figure({ x: 700, foot: 846, H: 116, heads: 3.2, skin: SKIN.fair, hair: '#e6e2ee', style: 'bun', top: '#2a5aa8', bottom: '#2a2a3a', gaze: -0.3, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.3, 1.8] }, cookie] });
    out.push(gm.svg);
    const ch = gm.hand(cookie);
    out.push(path(mapleD(ch[0] + 12, ch[1] - 10, 16), { fill: '#e8a868' }), path(mapleD(ch[0] + 12, ch[1] - 10, 10), { fill: '#f8d8a8' }), circle(ch[0], ch[1], gm.r * 0.34, { fill: SKIN.fair }));
    ppl.cookie = [ch[0] + 12, ch[1] - 10];
  }

  // ---- a dad and a toddler on his shoulders pointing at the sky, on the right
  out.push(C('a dad and his toddler, who points up at the sky'));
  {
    const d = figure({ x: 1140, foot: 868, H: 126, heads: 3.3, skin: SKIN.deep, hair: '#1a1210', style: 'short', top: '#ffffff', bottom: '#2a3a6a', gaze: 0.3, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.7, 1.0], hand: [-1.1, 1.8] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.9] }] });
    out.push(d.svg);
    const point = { sx: 1, elbow: [0.9, -0.9], hand: [1.3, -2.2] };
    const t = figure({ x: 1070, foot: 874, H: 64, heads: 2.4, skin: SKIN.deep, hair: '#1a1210', style: 'puffs', top: RED, bottom: '#2a3a6a', shoe: WHITE, gaze: 0.3, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.8] }, point] });
    out.push(t.svg);
    ppl.toddler = [1070, t.headY];
  }

  return { svg: compactSvg(doc(`Canada Day · mid. Concept: "fireworks over the lake" on the evening of 1 July. Focal point: the family on a red-and-white plaid blanket on the grassy bank (x 300–800, y 640–880) — a girl with a maple leaf painted on her cheek waves a flag, her brother in a red hockey jersey holds up a beavertail pastry, grandma has a maple leaf cookie — beside a wooden dock with a red canoe. A toddler beside her dad points up at the sky; a loon floats on the lake and a beaver peeks out by its lodge; a maple tree on the left; red and white string lights along the bank; a stone clock tower with a green copper roof across the water. Light story: the warm evening glow on the water. The fireworks are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Canada Day · front: tall grass and cattails in both bottom corners; the center stays open`, [], [
    C('grass and cattails bottom left'),
    path('M20 900q-4 -70 6 -120M44 900q4 -90 -4 -150M70 900q8 -60 18 -100', { fill: 'none', stroke: '#2a5a2a', 'stroke-width': 5 }),
    path('M40 752h10v-34h-10zM22 782h8v-28h-8z', { fill: '#6a3a1a' }),
    C('grass bottom right'),
    path('M1540 900q-6 -70 4 -120M1566 900q2 -90 -6 -140M1590 900q8 -60 16 -100', { fill: 'none', stroke: '#2a5a2a', 'stroke-width': 5 }),
    path('M1556 762h10v-34h-10z', { fill: '#6a3a1a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'dressup', x: r(ppl.facepaint[0]), y: r(ppl.facepaint[1]), r: 40, label: 'Paint a maple leaf on your cheek' },
      { activity: 'color', x: ppl.canoe[0], y: ppl.canoe[1], r: 50, label: 'Color the red canoe' },
      { activity: 'card', x: r(ppl.flag[0]), y: r(ppl.flag[1]), r: 36, label: 'Make a Canada Day card' },
      { activity: 'memory', x: r(ppl.cookie[0]), y: r(ppl.cookie[1]), r: 34, label: 'Match the Canada Day treats' },
    ],
    findables: [
      { id: 'loon', label: 'a loon on the lake', x: ppl.loon[0], y: ppl.loon[1], r: 22 },
      { id: 'beaver', label: 'a beaver by its lodge', x: ppl.beaver[0], y: ppl.beaver[1], r: 22 },
      { id: 'beavertail', label: 'a beavertail pastry', x: r(ppl.beavertail[0]), y: r(ppl.beavertail[1]), r: 20 },
      { id: 'tower', label: 'the clock tower', x: 1452, y: 470, r: 36 },
      { id: 'paddle', label: 'a canoe paddle', x: 720, y: 752, r: 22 },
      { id: 'red-leaf', label: 'a red maple leaf in the tree', x: 140, y: 420, r: 40 },
      { id: 'toddler', label: 'a toddler pointing at the sky', x: r(ppl.toddler[0]), y: r(ppl.toddler[1]), r: 22 },
    ],
  };
}
