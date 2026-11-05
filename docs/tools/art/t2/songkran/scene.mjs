// Songkran — "The water festival street": a sunny Thai street on 13 April. A baby elephant sprays a sparkling arc
// of water from its trunk over two delighted children with water guns; teens in flowered shirts splash bowls of
// water from the back of a pickup with a big blue barrel; and beside the golden temple a girl gently pours
// scented water from a silver bowl over grandma's hands, the new-year blessing, with a jasmine garland. Puddles
// shine on the street. The water throws and splashes are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { line, circD } from '../../kit/scenekit.mjs';

const ID = 'songkran';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const GOLD = '#ffc83a', WATER = '#5ac8f0';
const STREET = 700;

/** A flowered shirt pattern over a figure's torso. */
const flowers = (x, top, tw, r, col) => path(
  circD(x - tw * 0.25, top + r * 0.8, r * 0.18) + circD(x + tw * 0.2, top + r * 1.3, r * 0.2) + circD(x - tw * 0.15, top + r * 1.9, r * 0.16) + circD(x + tw * 0.28, top + r * 0.6, r * 0.14),
  { fill: col });

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(8);
  let shops = '';
  let wins = '', awn = '';
  for (let x = 260; x < 1320;) { const w = 90 + R() * 70, top = 470 + R() * 30; shops += `M${P(x, 640)}V${f(top)}H${f(x + w)}V640Z`; for (let k = 0; k < 2; k++) wins += `M${P(x + 14 + k * (w - 44), top + 20)}h16v22h-16Z`; awn += `M${P(x + 6, 598)}h${f(w - 12)}l-8 16h${f(-(w - 28))}Z`; x += w + 4; }
  // the temple: three tiered roofs with golden finials, outside the copy zone on the right
  let roofs = '';
  for (let i = 0; i < 3; i++) { const y = 560 - i * 70, w = 300 - i * 70; roofs += `M${P(1460 - w / 2, y)}L${P(1460 - w / 2 + 40, y - 60)}H${f(1460 + w / 2 - 40)}L${P(1460 + w / 2, y)}Z`; }
  const finials = 'M1460 350l-6 -60h12zM1326 556q-14 -30 -2 -40q4 20 10 30zM1594 556q14 -30 2 -40q-4 20 -10 30zM1366 486q-12 -26 0 -34q2 16 8 26zM1554 486q12 -26 0 -34q-2 16 -8 26z';
  const defs = [lin(id('temple'), 0, 0, 0, 1, [[0, '#e8343a'], [1, '#a81a2a']]), rad(id('sunglow'), 0.5, 0.5, 0.5, [[0, '#fff6c0', 0.9], [0.4, '#ffe08a', 0.4], [1, '#ffe08a', 0]])];
  return compactSvg(doc(`Songkran · back: a sunny sky; low shophouses down the street and a golden-trimmed red temple roof on the right, outside the copy zone`, defs, [
    C('the shophouses down the street'),
    path(shops, { fill: '#a8d8e8' }),
    path(wins, { fill: '#7ab8d0' }),
    path(awn, { fill: '#ff8a7a', opacity: 0.8 }),
    C('a hot sun in the top-right corner and a few clouds top left, outside the copy zone'),
    circle(1480, 120, 120, { fill: url('sunglow') }), circle(1480, 120, 52, { fill: '#fff4a0' }),
    path('M40 150c-24 0 -30 -30 -6 -36c0 -26 36 -32 46 -12c14 -18 46 -10 44 16c22 -2 28 24 12 32zM200 90c-16 0 -20 -20 -4 -24c0 -18 24 -22 32 -8c10 -12 32 -6 30 10c14 0 18 16 8 22z', { fill: '#ffffff', opacity: 0.9 }),
    C('the temple'),
    path('M1330 640V560H1590V640Z', { fill: '#f4ece0' }),
    path(roofs, { fill: url('temple') }),
    path('M1310 560h300v8h-300zM1350 490h220v6h-220zM1390 420h140v6h-140z', { fill: GOLD }),
    path(finials, { fill: GOLD }),
    path('M1420 640v-60a40 40 0 0 1 80 0v60z', { fill: '#c8901e' }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('road'), 0, 0, 0, 1, [[0, '#a8a8b0'], [1, '#88889a']]),
    lin(id('elephant'), 0, 0, 0, 1, [[0, '#b8b0b8'], [1, '#8a8090']]),
    lin(id('barrel'), 0, 0, 1, 0, [[0, '#2a8ad8'], [0.5, '#5ab8f0'], [1, '#1a6ab8']]),
    lin(id('truck'), 0, 0, 0, 1, [[0, '#ffffff'], [1, '#d8dce4']]),
    lin(id('puddle'), 0, 0, 0, 1, [[0, '#bfeaff'], [1, '#7ac8e8']]),
    lin(id('silver'), 0, 0, 0, 1, [[0, '#f4f4f8'], [1, '#a8acb8']]),
  ];

  // ---- the street, wet and shining
  out.push(C('the wet street: puddles reflecting the sky'));
  out.push(path(`M-20 ${STREET - 60}H1620V920H-20Z`, { fill: url('road') }), path(`M-20 ${STREET - 60}H1620v8H-20Z`, { fill: '#c8c8d0' }));
  out.push(path('M140 860q120 -30 260 -6q40 16 -40 26q-120 10 -220 -20zM700 830q160 -24 300 0q30 14 -60 22q-160 8 -240 -22zM1160 870q100 -20 220 0q20 12 -40 18q-120 6 -180 -18z', { fill: url('puddle'), opacity: 0.85 }));
  out.push(line('M200 856h60M760 826h80M1210 866h50', '#ffffff', 3, { opacity: 0.8 }));

  // ---- palm trees at the left edge
  out.push(C('two palm trees on the left'));
  for (const [x, h, lean] of [[40, 360, 16], [130, 300, -10]]) {
    const top = [x + lean, STREET - 60 - h];
    out.push(path(`M${x - 8} ${STREET - 60}Q${x + lean * 0.4} ${STREET - 60 - h * 0.5} ${top[0] - 4} ${top[1]}h8Q${x + lean * 0.4 + 10} ${STREET - 60 - h * 0.5} ${x + 8} ${STREET - 60}Z`, { fill: '#8a6a4a' }));
    let fronds = '';
    for (let k = 0; k < 7; k++) { const a = Math.PI * (1.05 + k * 0.15), L = 90 + (k % 2) * 20; fronds += `M${P(...top)}Q${P(top[0] + Math.cos(a) * L * 0.6, top[1] + Math.sin(a) * L * 0.6 - 20)} ${P(top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L + 30)}`; }
    out.push(line(fronds, '#2a8a4a', 14));
  }

  // ---- the pickup with the barrel and the teens splashing
  out.push(C('a white pickup with a big blue water barrel; two teens in flowered shirts throw bowls of water from the back'));
  {
    const T = { x0: 200, x1: 560, base: 760 };
    out.push(ellipse(380, T.base + 4, 200, 10, { fill: '#000', opacity: 0.2 }));
    out.push(path(`M${T.x0} ${T.base - 30}V${T.base - 96}Q${T.x0} ${T.base - 104} ${T.x0 + 10} ${T.base - 104}H${T.x0 + 30}L${T.x0 + 66} ${T.base - 166}H${T.x0 + 138}V${T.base - 90}H${T.x1}V${T.base - 30}Z`, { fill: url('truck') }));
    out.push(path(`M${T.x0 + 40} ${T.base - 106}L${T.x0 + 70} ${T.base - 156}H${T.x0 + 126}V${T.base - 106}z`, { fill: '#9ad8f0' }), path(`M${T.x0 + 92} ${T.base - 156}v50`, { fill: 'none', stroke: '#e8e8f0', 'stroke-width': 4 }));
    out.push(path(`M${T.x0 - 4} ${T.base - 60}h14v14h-14z`, { fill: '#ffe08a' }), path(`M${T.x0 + 138} ${T.base - 90}V${T.base - 120}h8V${T.base - 90}z`, { fill: '#c8c8d4' }));
    out.push(path(`M${T.x0} ${T.base - 54}H${T.x1}v6H${T.x0}z`, { fill: '#e8343a' }));
    for (const x of [T.x0 + 70, T.x1 - 70]) out.push(circle(x, T.base - 30, 32, { fill: '#2a2a32' }), circle(x, T.base - 30, 14, { fill: '#b8bcc8' }));
    // the barrel in the bed
    out.push(path('M360 670v-80q0 -10 40 -10t40 10v80z', { fill: url('barrel') }), ellipse(400, 584, 40, 10, { fill: '#1a6ab8' }), ellipse(400, 586, 34, 7, { fill: '#9ae0ff' }), path('M360 610h80M360 650h80', { fill: 'none', stroke: '#1a5a98', 'stroke-width': 3 }));
    // the two teens
    const throwArm = { sx: 1, elbow: [1.0, -0.8], hand: [1.6, -1.6] };
    const t1 = figure({ x: 474, foot: 672, H: 104, heads: 3.0, skin: SKIN.tan, hair: '#1a1210', style: 'short', top: '#ff6a2a', bottom: '#2a5a8a', gaze: 0.5, mouth: 'open', arms: [{ sx: -1, elbow: [-0.8, 0.6], hand: [-1.2, 1.0] }, throwArm] });
    out.push(t1.svg, flowers(474, t1.torsoTop, t1.tw, t1.r, '#ffe03a'));
    const h1 = t1.hand(throwArm);
    out.push(path(`M${P(h1[0] - 16, h1[1] - 8)}q16 14 32 0z`, { fill: url('silver') }), circle(h1[0], h1[1], t1.r * 0.34, { fill: SKIN.tan }));
    out.push(path(circD(h1[0] + 30, h1[1] - 30, 8) + circD(h1[0] + 56, h1[1] - 40, 6) + circD(h1[0] + 80, h1[1] - 36, 7) + circD(h1[0] + 104, h1[1] - 20, 5) + circD(h1[0] + 44, h1[1] - 20, 5), { fill: WATER, opacity: 0.85 }));
    const t2 = figure({ x: 540, foot: 672, H: 98, heads: 3.0, skin: SKIN.light, hair: '#3a2214', style: 'bob', top: '#2ab8a8', bottom: '#2a5a8a', gaze: 0.5, mouth: 'open', arms: [{ sx: -1, elbow: [-0.8, -0.8], hand: [-1.0, -2.0] }, { sx: 1, elbow: [0.8, -0.8], hand: [1.0, -2.0] }] });
    out.push(t2.svg, flowers(540, t2.torsoTop, t2.tw, t2.r, '#ff8fb8'));
    out.push(path(`M${T.x0 + 146} ${T.base - 90}H${T.x1}v14H${T.x0 + 146}z`, { fill: '#e8e8f0' }));
    ppl.barrel = [400, 620];
    ppl.teens = [500, 600];
  }

  // ---- the baby elephant spraying water over two children
  out.push(C('the focal point: a baby elephant sprays a sparkling arc of water from its trunk over two delighted children with water guns'));
  {
    const ex = 790, ef = 826;
    const g = [];
    g.push(ellipse(0, 2, 110, 10, { fill: '#000', opacity: 0.2 }));
    const leg = (x, back) => path(`M${x - 18} -60V-6q0 6 6 6h24q6 0 6 -6V-60z`, { fill: back ? '#8a8090' : url('elephant') }) + path(`M${x - 14} -4h4M${x - 2} -4h4M${x + 10} -4h4`, { fill: 'none', stroke: '#f4ece0', 'stroke-width': 3, 'stroke-linecap': 'round' });
    g.push(leg(-50, true), leg(54, true));
    g.push(path('M-100 -90C-104 -150 -40 -176 20 -170C80 -166 112 -130 108 -90C104 -60 70 -50 0 -50C-60 -50 -96 -60 -100 -90Z', { fill: url('elephant') }));
    g.push(path('M104 -110q22 0 20 30', { fill: 'none', stroke: '#8a8090', 'stroke-width': 5, 'stroke-linecap': 'round' }), path('M120 -84l6 10l-10 -2z', { fill: '#5a5060' }));
    g.push(leg(-30, false), leg(74, false));
    // a saddle cloth with gold trim
    g.push(path('M-40 -168C-10 -176 40 -176 60 -166L56 -100Q10 -92 -36 -100Z', { fill: '#e8343a' }), path('M-36 -100Q10 -92 56 -100', { fill: 'none', stroke: GOLD, 'stroke-width': 5 }), path(circD(-20, -134, 5) + circD(10, -140, 5) + circD(38, -132, 5), { fill: GOLD }));
    // head, ear, eye, trunk raised high to the left, spraying
    g.push(circle(-110, -130, 50, { fill: url('elephant') }));
    g.push(path('M-96 -170C-60 -180 -40 -150 -48 -120C-56 -94 -82 -92 -94 -110Z', { fill: '#a89aa8' }), path('M-90 -160C-66 -164 -56 -144 -62 -124', { fill: 'none', stroke: '#ffb0c0', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.7 }));
    g.push(circle(-128, -140, 5, { fill: '#2a1a2a' }), circle(-129.5, -141.5, 1.6, { fill: '#ffffff' }), path('M-138 -150q8 -6 16 -2', { fill: 'none', stroke: '#5a5060', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    g.push(path('M-150 -116C-176 -120 -190 -150 -186 -190C-184 -214 -170 -232 -152 -240l8 14C-160 -220 -168 -206 -168 -186C-168 -160 -158 -140 -140 -134Z', { fill: url('elephant') }));
    g.push(path('M-160 -120q8 10 20 6', { fill: 'none', stroke: '#5a5060', 'stroke-width': 3, 'stroke-linecap': 'round' }), path('M-136 -104q10 6 18 0', { fill: 'none', stroke: '#5a3a4a', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    g.push(ellipse(-120, -112, 7, 4, { fill: '#ffb0c0', opacity: 0.6 }));
    // a jasmine garland round its neck
    g.push(path(Array.from({ length: 9 }, (_, k) => circD(-84 + k * 6, -92 + Math.sin((k / 8) * Math.PI) * 14, 5)).join(''), { fill: '#ffffff' }), circle(-60, -78, 6, { fill: '#e8343a' }));
    out.push(G({ transform: `translate(${ex} ${ef})` }, ...g));
    ppl.elephant = [ex - 40, ef - 130];
    // the arc of water from the trunk tip, falling on the children to the right
    const tip = [ex - 148, ef - 236];
    const arc = `M${P(...tip)}C${P(tip[0] + 60, tip[1] - 140)} ${P(tip[0] + 320, tip[1] - 170)} ${P(tip[0] + 400, tip[1] + 30)}`;
    out.push(path(arc, { fill: 'none', stroke: '#bfeaff', 'stroke-width': 16, 'stroke-linecap': 'round', opacity: 0.65 }), path(arc, { fill: 'none', stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': '18 14', opacity: 0.9 }));
    {
      const R = rng(4);
      let drops = '';
      for (let k = 0; k < 22; k++) { const t = 0.5 + R() * 0.55, x = tip[0] + 400 * t + (R() - 0.5) * 60, y = tip[1] - 170 * Math.sin(t * Math.PI) + 40 * t + (R() - 0.3) * 50; drops += `M${P(x, y - 7)}c4 5 5 9 0 11c-5 -2 -4 -6 0 -11z`; }
      out.push(path(drops, { fill: WATER }));
    }
    ppl.spray = [tip[0] + 200, tip[1] - 120];
    // the two children with water guns, laughing in the shower
    const aim = (s) => ({ sx: s, elbow: [s * 1.0, -0.2], hand: [s * 1.7, -0.6] });
    const k1 = figure({ x: 1020, foot: 856, H: 84, heads: 2.7, skin: SKIN.brown, hair: '#1a1210', style: 'curls', top: '#ffd23a', bottom: '#2a6ad8', shoe: '#ff6a9a', gaze: -0.5, mouth: 'open', arms: [aim(-1), { sx: 1, elbow: [0.8, -0.8], hand: [1.0, -2.0] }] });
    out.push(k1.svg, flowers(1020, k1.torsoTop, k1.tw, k1.r, '#ff4d6d'));
    const g1 = k1.hand(aim(-1));
    out.push(path(`M${P(g1[0] - 30, g1[1] - 8)}h34v10h-34zM${P(g1[0] - 4, g1[1] - 8)}v18h-8v-12z`, { fill: '#ff8a1a' }), path(`M${P(g1[0] - 12, g1[1] - 8)}v-14h14v14z`, { fill: '#5ab8f0' }), circle(g1[0], g1[1], k1.r * 0.36, { fill: SKIN.brown }));
    out.push(line(`M${P(g1[0] - 34, g1[1] - 4)}q-40 -10 -70 10`, WATER, 4, { 'stroke-dasharray': '6 6' }));
    const k2 = figure({ x: 1120, foot: 860, H: 76, heads: 2.6, skin: SKIN.fair, hair: '#1a1210', style: 'puffs', top: '#5ab8f0', bottom: '#ff6a9a', shoe: '#ffd23a', gaze: -0.4, mouth: 'open', arms: [{ sx: -1, elbow: [-0.8, -0.8], hand: [-1.0, -2.0] }, aim(1)] });
    out.push(k2.svg, flowers(1120, k2.torsoTop, k2.tw, k2.r, '#ffffff'));
    const g2 = k2.hand(aim(1));
    out.push(path(`M${P(g2[0] - 4, g2[1] - 8)}h34v10h-34zM${P(g2[0] + 4, g2[1] - 8)}v18h8v-12z`, { fill: '#8ad870' }), path(`M${P(g2[0] - 2, g2[1] - 8)}v-14h14v14z`, { fill: '#ff6a9a' }), circle(g2[0], g2[1], k2.r * 0.36, { fill: SKIN.fair }));
    // white powder smudges on their cheeks
    out.push(ellipse(1030, k1.headY + 6, 7, 4, { fill: '#ffffff', opacity: 0.8 }), ellipse(1112, k2.headY + 6, 6, 3.4, { fill: '#ffffff', opacity: 0.8 }));
    ppl.waterGun = [g1[0] - 14, g1[1] - 10];
    ppl.kids = [1070, k1.headY];
  }

  // ---- the blessing by the temple: a girl pours scented water over grandma's hands
  out.push(C('by the temple steps a girl gently pours scented water from a silver bowl over grandma\'s hands, the new-year blessing; jasmine garlands on a little table'));
  {
    // the chair and grandma, seated
    const gx = 1430, seat = 800;
    out.push(path(`M${gx - 40} ${seat}h80v10h-80zM${gx - 36} ${seat + 10}v52h8v-52zM${gx + 28} ${seat + 10}v52h8v-52zM${gx + 30} ${seat}V${seat - 90}h8V${seat}z`, { fill: '#8a5a3a' }));
    const cup = { sx: -1, elbow: [-0.8, 0.8], hand: [-1.3, 1.1] }, cup2 = { sx: 1, elbow: [-0.2, 1.0], hand: [-0.7, 1.1] };
    const gm = figure({ x: gx, foot: seat + 2, H: 104, heads: 3.1, skin: SKIN.tan, hair: '#e6e2ee', style: 'bun', top: '#9a5ad8', bottom: '#5a3a8a', gaze: -0.5, mouth: 'smile', arms: [cup, cup2] });
    out.push(gm.svg);
    out.push(path(`M${gx - 22} ${seat}h-36v12h36zM${gx + 4} ${seat}h-36v12h36z`, { fill: '#5a3a8a' }), path(`M${gx - 58} ${seat + 12}v46h12v-46zM${gx - 32} ${seat + 12}v46h12v-46z`, { fill: '#5a3a8a' }), path(`M${gx - 66} ${seat + 56}h24v8h-24zM${gx - 40} ${seat + 56}h24v8h-24z`, { fill: '#2a1a14' }));
    out.push(path(Array.from({ length: 11 }, (_, k) => circD(gx - 20 + k * 4, gm.torsoTop + 4 + Math.sin((k / 10) * Math.PI) * 18, 4)).join(''), { fill: '#ffffff' }), circle(gx, gm.torsoTop + 24, 5, { fill: '#ffb800' }));
    const gh = gm.hand(cup);
    out.push(circle(gh[0], gh[1], gm.r * 0.34, { fill: SKIN.tan }), circle(gm.hand(cup2)[0], gm.hand(cup2)[1], gm.r * 0.34, { fill: SKIN.tan }));
    // the girl with the silver bowl
    const pour = { sx: 1, elbow: [0.9, -0.2], hand: [1.5, -0.5] };
    const girl = figure({ x: 1300, foot: 860, H: 84, heads: 2.7, skin: SKIN.light, hair: '#1a1210', style: 'bun', top: '#ff8fb8', bottom: '#2a5a8a', shoe: '#ffffff', gaze: 0.5, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, pour] });
    out.push(girl.svg, flowers(1300, girl.torsoTop, girl.tw, girl.r, '#ffe03a'));
    const ph = girl.hand(pour);
    out.push(G({ transform: `translate(${P(ph[0] + 8, ph[1] - 6)}) rotate(30)` }, path('M-18 0q18 16 36 0z', { fill: url('silver') }), path('M-18 0h36', { fill: 'none', stroke: '#d8dce8', 'stroke-width': 3 })));
    out.push(line(`M${P(ph[0] + 22, ph[1] + 4)}q6 10 4 ${f(gh[1] - ph[1] - 4)}`, '#9ae0ff', 3), path(circD(gh[0] + 2, gh[1] + 8, 3) + circD(gh[0] - 6, gh[1] + 14, 2.4), { fill: WATER }), circle(ph[0], ph[1], girl.r * 0.36, { fill: SKIN.light }));
    out.push(path(circD(ph[0] + 20, ph[1] + 30, 3) + circD(ph[0] + 26, ph[1] + 40, 2.6), { fill: '#ffb0d0' }));
    ppl.blessing = [ph[0] + 20, ph[1]];
    // the table of garlands
    out.push(path('M1520 780h80v8h-80zM1528 788v70h6v-70zM1586 788v70h6v-70z', { fill: '#8a5a3a' }));
    for (const [x, c] of [[1540, '#ffffff'], [1576, '#fff4b0']]) out.push(path(Array.from({ length: 10 }, (_, k) => { const a = (k / 10) * Math.PI * 2; return circD(x + Math.cos(a) * 14, 770 + Math.sin(a) * 6, 4); }).join(''), { fill: c }), circle(x, 776, 5, { fill: '#e8343a' }));
    ppl.garland = [1558, 770];
  }

  return { svg: compactSvg(doc(`Songkran · mid. Concept: "the water festival street" on a sunny 13 April. Focal point: a baby elephant in a red saddle cloth and jasmine garland (x 600–920, y 560–830) spraying a sparkling arc of water from its raised trunk over two delighted children with water guns and white powder on their cheeks. On the left teens in flowered shirts throw bowls of water from the back of a white pickup with a big blue barrel, under palm trees; on the right, by the temple, a girl gently pours scented water from a silver bowl over grandma's hands, the new-year blessing, beside a table of jasmine garlands. Puddles shine on the street. Light story: bright midday sun, wet highlights. The water throws and splashes are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Songkran · front: a bucket and a water gun bottom left, a pot of orchids bottom right; the center stays open`, [], [
    C('a bucket and a water gun'),
    path('M20 900l8 -64h80l8 64z', { fill: '#2a8ad8' }), path('M24 838h88', { fill: 'none', stroke: '#1a6ab8', 'stroke-width': 5 }), ellipse(68, 838, 42, 8, { fill: '#9ae0ff' }),
    path('M126 880h60v14h-60zM150 894v20h12v-16z', { fill: '#ffd23a' }), path('M140 880v-14h18v14z', { fill: '#ff6a9a' }),
    C('a pot of orchids'),
    path('M1500 900l8 -54h92l8 54z', { fill: '#c8643a' }),
    path('M1520 846q-10 -40 4 -70M1560 846q4 -50 -6 -80M1590 846q10 -36 0 -64', { fill: 'none', stroke: '#3a8a3a', 'stroke-width': 4 }),
    path(circD(1524, 772, 10) + circD(1554, 762, 11) + circD(1590, 776, 10), { fill: '#d88aff' }), path(circD(1524, 772, 4) + circD(1554, 762, 4) + circD(1590, 776, 4), { fill: '#ffe03a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'catch', x: r(ppl.spray[0]), y: r(ppl.spray[1] + 40), r: 50, label: 'Catch the water splashes' },
      { activity: 'color', x: r(ppl.elephant[0]), y: r(ppl.elephant[1]), r: 60, label: 'Color the baby elephant' },
      { activity: 'card', x: r(ppl.blessing[0]), y: r(ppl.blessing[1]), r: 36, label: 'Send a Songkran blessing' },
      { activity: 'dressup', x: r(ppl.teens[0]), y: r(ppl.teens[1]), r: 50, label: 'Pick a flowery Songkran shirt' },
    ],
    findables: [
      { id: 'barrel', label: 'a big blue water barrel', x: ppl.barrel[0], y: ppl.barrel[1], r: 30 },
      { id: 'water-gun', label: 'an orange water gun', x: r(ppl.waterGun[0]), y: r(ppl.waterGun[1]), r: 18 },
      { id: 'garland', label: 'jasmine garlands', x: ppl.garland[0], y: ppl.garland[1], r: 24 },
      { id: 'temple', label: 'the temple roof', x: 1460, y: 470, r: 40 },
      { id: 'powder', label: 'white powder on a cheek', x: 1030, y: r(ppl.kids[1] + 6), r: 14 },
      { id: 'palm', label: 'a palm tree', x: 60, y: 300, r: 40 },
      { id: 'orchids', label: 'purple orchids', x: 1556, y: 770, r: 24 },
    ],
  };
}
