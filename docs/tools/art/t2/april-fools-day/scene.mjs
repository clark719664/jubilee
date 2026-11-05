// April Fools' Day — "The giggliest garden": a back garden on the evening of 1 April, full of gentle tricks. Dad
// sits down on the bench with his tea and lands on a whoopee cushion (puff!) while a giggling girl sticks a paper
// fish on his back ("poisson d'avril!"). A boy and the dog both wear fake glasses with big noses and mustaches,
// a jack-in-the-box springs up in front of a startled toddler, the garden gnome stands on his head, the washing
// line has a pair of pants pegged upside down, and on the table a fake spider sits beside a "cake" that is
// really a sponge. The confetti (which falls up at first) is the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, dog, line, circD, terrace } from '../../kit/scenekit.mjs';

const ID = 'april-fools-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const NIGHT = '#3a1a5a';
const night = (c, k = 0.3) => mix(c, NIGHT, k);
const LAMP = '#ffd98a';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const LAWN = 700;

/** Fake glasses with a big nose and a mustache, on a head at (cx, cy) radius r. */
const groucho = (cx, cy, r) => [
  path(`M${P(cx - r * 0.72, cy - r * 0.12)}a${f(r * 0.28)} ${f(r * 0.28)} 0 1 0 ${f(r * 0.56)} 0a${f(r * 0.28)} ${f(r * 0.28)} 0 1 0 ${f(-r * 0.56)} 0ZM${P(cx + r * 0.16, cy - r * 0.12)}a${f(r * 0.28)} ${f(r * 0.28)} 0 1 0 ${f(r * 0.56)} 0a${f(r * 0.28)} ${f(r * 0.28)} 0 1 0 ${f(-r * 0.56)} 0Z`, { fill: 'none', stroke: '#1a1a24', 'stroke-width': f(r * 0.1) }),
  path(`M${P(cx - r * 0.16, cy - r * 0.12)}h${f(r * 0.32)}`, { fill: 'none', stroke: '#1a1a24', 'stroke-width': f(r * 0.08) }),
  path(`M${P(cx - r * 0.74, cy - r * 0.5)}q${f(r * 0.3)} ${f(-r * 0.2)} ${f(r * 0.56)} 0M${P(cx + r * 0.18, cy - r * 0.5)}q${f(r * 0.3)} ${f(-r * 0.2)} ${f(r * 0.56)} 0`, { fill: 'none', stroke: '#1a1a24', 'stroke-width': f(r * 0.14), 'stroke-linecap': 'round' }),
  ellipse(cx, cy + r * 0.2, r * 0.22, r * 0.3, { fill: '#f0a090' }),
  path(`M${P(cx - r * 0.5, cy + r * 0.52)}q${f(r * 0.25)} ${f(-r * 0.24)} ${f(r * 0.5)} ${f(-r * 0.06)}q${f(r * 0.25)} ${f(-r * 0.18)} ${f(r * 0.5)} ${f(r * 0.06)}q${f(-r * 0.25)} ${f(r * 0.16)} ${f(-r * 0.5)} ${f(r * 0.08)}q${f(-r * 0.25)} ${f(r * 0.1)} ${f(-r * 0.5)} ${f(-r * 0.08)}z`, { fill: '#1a1a24' }),
].join('');

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const town = terrace(-30, 1640, 600, 41, { hMin: 70, hMax: 110, wMin: 110, wMax: 170 });
  const defs = [rad(id('winglow'), 0.5, 0.5, 0.5, [[0, LAMP, 0.5], [1, LAMP, 0]])];
  return compactSvg(doc(`April Fools' Day · back: the backs of the neighboring houses with lit windows over the garden fence, against the purple evening sky`, defs, [
    C('the neighbors\' houses'),
    path(town.d, { fill: night('#5a3a7a', 0.25) }),
    town.windows.map(([x, y, w, h]) => ellipse(x + w / 2, y + h / 2, w * 1.3, h * 1.1, { fill: url('winglow') })).join(''),
    path(town.windows.map(([x, y, w, h]) => `M${P(x, y)}h${f(w)}v${f(h)}h${f(-w)}Z`).join(''), { fill: LAMP, opacity: 0.85 }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('lawn'), 0, 0, 0, 1, [[0, '#4a8a4a'], [1, '#2a6a3a']]),
    lin(id('fence'), 0, 0, 0, 1, [[0, '#c89a6a'], [1, '#a87a4a']]),
    rad(id('pool'), 0.5, 0.5, 0.5, [[0, LAMP, 0.4], [1, LAMP, 0]]),
    lin(id('bench'), 0, 0, 0, 1, [[0, '#8a5a3a'], [1, '#6a4028']]),
    rad(id('lamp'), 0.5, 0.5, 0.5, [[0, '#fff3c4', 0.8], [0.35, LAMP, 0.35], [1, LAMP, 0]]),
  ];

  // ---- the fence and the lawn
  out.push(C('the garden fence and the lawn'));
  {
    let boards = '';
    for (let x = -20; x < 1620; x += 40) boards += `M${x} ${LAWN}V${612 + ((x / 40) % 2) * 6}l18 -10l18 10V${LAWN}Z`;
    out.push(path(boards, { fill: url('fence') }), path(`M-20 640H1620v10H-20ZM-20 680H1620v10H-20Z`, { fill: '#a87a4a' }));
  }
  out.push(path(`M-20 ${LAWN}H1620V920H-20Z`, { fill: url('lawn') }));
  { const R = rng(5); let g = ''; for (let i = 0; i < 70; i++) { const x = R() * 1600, y = LAWN + 20 + R() * 180; g += `M${P(x, y)}l3 -10l3 10`; } out.push(path(g, { fill: 'none', stroke: '#6aaa5a', 'stroke-width': 2, opacity: 0.6 })); }
  out.push(ellipse(800, 800, 520, 80, { fill: url('pool') }));

  // ---- the tree with googly eyes on the trunk and the washing line
  out.push(C('a tree with googly eyes stuck on its trunk; the washing line with socks and a pair of pants pegged upside down'));
  {
    const t = bareTree(1460, 720, 380, 11, { lean: -0.03, depth: 5, spread: 0.5 });
    out.push(path(t.d, { fill: '#5a3a2a' }));
    let leaves = '';
    for (const [x, y] of t.tips) leaves += circD(x, y, 22);
    out.push(path(leaves, { fill: '#3a8a4a', opacity: 0.95 }));
    out.push(circle(1448, 610, 13, { fill: '#ffffff' }), circle(1474, 606, 15, { fill: '#ffffff' }), circle(1452, 616, 6, { fill: '#1a1a24' }), circle(1468, 600, 7, { fill: '#1a1a24' }));
    ppl.eyes = [1462, 608];
    out.push(line('M300 470Q700 520 1440 520', '#e8e0f0', 2));
    const peg = (x, y) => path(`M${x - 2} ${y - 6}h4v12h-4z`, { fill: '#ffd23a' });
    const along = (x) => 470 + (x - 300) / 1140 * 50 + Math.sin(((x - 300) / 1140) * Math.PI) * 26;
    for (const [x, col] of [[400, '#ff6a6a'], [470, '#5ab8e8'], [1240, '#ffd23a']]) { const y = along(x); out.push(path(`M${x - 10} ${y}v34q0 8 8 8h14v-10h-8v-32z`, { fill: col }), peg(x - 4, y)); }
    const tx = 1100, ty = along(tx);
    out.push(path(`M${tx - 40} ${ty}h80l-6 26h-68z`, { fill: '#2a5aa8' }), path(`M${tx - 34} ${ty + 26}l-4 -0h30l4 70h-28zM${tx + 34} ${ty + 26}h-30l-4 70h28z`, { fill: '#2a5aa8' }), path(`M${tx - 38} ${ty + 90}l2 -84M${tx + 38} ${ty + 90}l-2 -84`, { fill: 'none', stroke: '#1a4a8a', 'stroke-width': 2 }));
    out.push(path(`M${tx - 30} ${ty + 96}h22v-6h-22zM${tx + 8} ${ty + 96}h22v-6h-22z`, { fill: '#1a4a8a' }), peg(tx - 30, ty + 92), peg(tx + 30, ty + 92));
    ppl.pants = [tx, ty + 50];
  }

  // ---- the bench, dad on the whoopee cushion, the girl with the paper fish
  out.push(C('the focal point: dad sits down on the bench with his tea and lands on a whoopee cushion — puff! — while a giggling girl sticks a paper fish on his back'));
  {
    const B = { x0: 640, x1: 900, seat: 760 };
    out.push(path(`M${B.x0} ${B.seat}h${B.x1 - B.x0}v12h-${B.x1 - B.x0}z`, { fill: url('bench') }), path(`M${B.x0 + 10} ${B.seat - 70}h${B.x1 - B.x0 - 20}v12h-${B.x1 - B.x0 - 20}zM${B.x0 + 10} ${B.seat - 46}h${B.x1 - B.x0 - 20}v12h-${B.x1 - B.x0 - 20}z`, { fill: url('bench') }));
    out.push(path(`M${B.x0 + 14} ${B.seat + 12}v64h10v-64zM${B.x1 - 24} ${B.seat + 12}v64h10v-64zM${B.x0 + 14} ${B.seat}V${B.seat - 74}h8V${B.seat}zM${B.x1 - 22} ${B.seat}V${B.seat - 74}h8V${B.seat}z`, { fill: '#4a2a18' }));
    // the girl behind the bench, sticking the paper fish on dad's back
    const stick = { sx: 1, elbow: [1.0, 0.2], hand: [1.7, 0.2] };
    const g = figure({ x: 660, foot: 760, H: 86, heads: 2.7, skin: SKIN.light, hair: '#c8642a', style: 'bob', top: '#ff6aa8', bottom: '#2a3a6a', shoe: '#ffd23a', gaze: 0.6, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 0.6], hand: [-0.2, 0.9] }, stick] });
    out.push(g.svg);
    const gh = g.hand(stick);
    // dad, sitting: legs forward over the seat edge
    const dx = 790, dseat = B.seat - 2;
    const tea = { sx: 1, elbow: [1.0, -0.2], hand: [1.4, -1.0] }, startle = { sx: -1, elbow: [-1.1, -0.6], hand: [-1.6, -1.6] };
    const dad = figure({ x: dx, foot: dseat + 4, H: 100, heads: 3.0, skin: SKIN.brown, hair: '#1a1210', style: 'short', top: '#3a7a5a', bottom: '#2a3a5a', gaze: -0.2, mouth: 'open', arms: [startle, tea] });
    // the whoopee cushion squashed under him, and its puff
    out.push(path(`M${dx - 44} ${dseat}q44 -16 88 0q-44 14 -88 0z`, { fill: '#ff6a9a' }), path(`M${dx + 40} ${dseat - 4}l18 -6l2 10z`, { fill: '#ff6a9a' }));
    out.push(path(`M${dx + 70} ${dseat - 30}c10 -10 24 -6 24 6c10 -4 20 6 12 16c8 8 -2 20 -14 14c-6 10 -22 8 -24 -2c-12 2 -16 -14 -6 -20c-6 -8 0 -18 8 -14z`, { fill: '#ffffff', opacity: 0.9 }));
    out.push(line(`M${dx + 60} ${dseat - 14}l-12 -4M${dx + 58} ${dseat - 4}h-14`, '#ffffff', 3, { opacity: 0.8 }));
    ppl.cushion = [dx + 90, dseat - 24];
    out.push(dad.svg);
    out.push(path(`M${dx - 22} ${dseat}h-40v14h40zM${dx + 22} ${dseat}h40v14h-40z`, { fill: '#2a3a5a' }), path(`M${dx - 62} ${dseat + 14}v52h14v-52zM${dx + 48} ${dseat + 14}v52h14v-52z`, { fill: '#2a3a5a' }), path(`M${dx - 74} ${dseat + 62}h28v10h-28zM${dx + 46} ${dseat + 62}h28v10h-28z`, { fill: '#2a1a14' }));
    // the paper fish on his back, the girl's hand on it
    out.push(G({ transform: `translate(${f(gh[0] + 14)} ${f(gh[1] + 4)}) rotate(-10)` }, path('M-22 0c10 -14 30 -14 40 0c-10 14 -30 14 -40 0zM16 0l14 -10v20z', { fill: '#5ad8e8' }), circle(-12, -2, 2.6, { fill: '#1a1a24' }), path('M-2 -6q6 6 0 12M6 -6q6 6 0 12', { fill: 'none', stroke: '#2a8ab8', 'stroke-width': 2 })));
    out.push(circle(gh[0], gh[1], g.r * 0.36, { fill: SKIN.light }));
    ppl.fish = [gh[0] + 14, gh[1] + 4];
    // the tea flying out of his cup
    const th = dad.hand(tea);
    out.push(path(`M${P(th[0] - 8, th[1] - 16)}h16v14q0 4 -4 4h-8q-4 0 -4 -4z`, { fill: '#ffffff' }), path(`M${P(th[0] + 8, th[1] - 12)}q8 0 6 8`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 3 }), circle(th[0], th[1], dad.r * 0.34, { fill: SKIN.brown }));
    out.push(path(circD(th[0] + 4, th[1] - 30, 4) + circD(th[0] + 14, th[1] - 40, 3) + circD(th[0] - 6, th[1] - 38, 3), { fill: '#c8864a' }));
    // giggle marks over the girl
    out.push(line(`M${P(660 - 30, g.headY - 30)}l-8 -8M${P(660, g.headY - 40)}v-10M${P(660 + 28, g.headY - 30)}l8 -8`, '#ffe9a3', 3));
    ppl.dad = [dx, dad.headY];
  }

  // ---- the boy and the dog in fake glasses
  out.push(C('a boy and the dog both wearing fake glasses with big noses and mustaches'));
  {
    const bx = 520, bf = 852;
    const b = figure({ x: bx, foot: bf, H: 86, heads: 2.7, skin: SKIN.tan, hair: '#1a1210', style: 'curls', top: '#ffb800', bottom: '#2a3a6a', shoe: '#e8343a', gaze: 0, mouth: 'smile', arms: [{ sx: -1, elbow: [-1.0, 0.0], hand: [-0.6, -0.8] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.4, 1.9] }] });
    out.push(b.svg, groucho(bx, b.headY, b.r));
    ppl.glasses = [bx, b.headY];
    out.push(dog(390, 856, 0.95, '#c8894a', { flip: 1 }));
    // the dog's glasses, on its head (dog faces right: head at x + 16·s)
    // its fake glasses: one lens round its eye, one just in front, a big pink nose over its own and a mustache
    out.push(path('M365 799a7 7 0 1 0 14 0a7 7 0 1 0 -14 0zM349 800a7 7 0 1 0 14 0a7 7 0 1 0 -14 0z', { fill: 'none', stroke: '#1a1a24', 'stroke-width': 2.4 }), path('M363 800h2', { fill: 'none', stroke: '#1a1a24', 'stroke-width': 2 }));
    out.push(ellipse(352, 808, 6, 7, { fill: '#f0a090' }), path('M342 816q6 -5 12 -1q6 -4 12 1q-6 4 -12 1q-6 3 -12 -1z', { fill: '#1a1a24' }));
    ppl.dog = [370, 812];
  }

  // ---- the jack-in-the-box and the startled toddler
  out.push(C('a jack-in-the-box springing up in front of a startled toddler'));
  {
    const jx = 1020, jb = 846;
    out.push(path(`M${jx - 34} ${jb}v-60h68v60z`, { fill: '#e8343a' }), path(`M${jx - 34} ${jb - 60}l-20 -30h68l20 30z`, { fill: '#c8243a' }), path(`M${jx - 24} ${jb - 30}h48M${jx} ${jb - 52}v44`, { fill: 'none', stroke: '#ffd23a', 'stroke-width': 5 }), path(`M${jx + 34} ${jb - 34}h14v-6h-14z`, { fill: '#8a8a9a' }));
    let spring = `M${jx} ${jb - 62}`;
    for (let i = 0; i < 6; i++) spring += `q16 -6 0 -12q-16 -6 0 -12`;
    out.push(path(spring, { fill: 'none', stroke: '#c8c8d8', 'stroke-width': 4 }));
    const hy = jb - 62 - 144 - 20;
    out.push(circle(jx, hy, 24, { fill: '#fff0e0' }), path(`M${jx - 26} ${hy - 6}l-14 -30l26 14l14 -26l14 26l26 -14l-14 30z`, { fill: '#5ab8e8' }), circle(jx - 40, hy - 36, 5, { fill: '#ffd23a' }), circle(jx + 40, hy - 36, 5, { fill: '#ffd23a' }), circle(jx, hy - 42, 5, { fill: '#ffd23a' }));
    out.push(circle(jx - 8, hy - 4, 3, { fill: '#1a1a24' }), circle(jx + 8, hy - 4, 3, { fill: '#1a1a24' }), circle(jx, hy + 6, 5, { fill: '#e8243a' }), path(`M${jx - 10} ${hy + 12}q10 10 20 0`, { fill: 'none', stroke: '#1a1a24', 'stroke-width': 2.4, 'stroke-linecap': 'round' }), path(`M${jx - 26} ${hy + 18}q26 14 52 0`, { fill: 'none', stroke: '#ff8a8a', 'stroke-width': 6, 'stroke-linecap': 'round' }));
    out.push(line(`M${jx - 50} ${hy + 30}l-14 6M${jx + 50} ${hy + 30}l14 6M${jx - 40} ${hy - 60}l-10 -10M${jx + 40} ${hy - 60}l10 -10`, '#ffffff', 3, { opacity: 0.85 }));
    ppl.jack = [jx, hy];
    const t = figure({ x: 1110, foot: 856, H: 60, heads: 2.4, skin: SKIN.deep, hair: '#1a1210', style: 'puffs', top: '#8ad870', bottom: '#2a3a6a', shoe: '#ffd23a', gaze: -0.6, mouth: 'open', arms: [{ sx: -1, elbow: [-0.8, -0.6], hand: [-1.0, -1.6] }, { sx: 1, elbow: [0.8, -0.6], hand: [1.0, -1.6] }] });
    out.push(t.svg);
  }

  // ---- the upside-down gnome in the flower bed, and the table with the sponge cake and the fake spider
  out.push(C('the garden gnome standing on his head in the flower bed; on a little table a "cake" that is really a sponge, and a fake spider'));
  {
    const R = rng(3);
    let flowers = '', stems = '';
    for (let i = 0; i < 12; i++) { const x = 1210 + i * 24 + R() * 8, y = 770 - R() * 30; stems += `M${P(x, 800)}L${P(x, y)}`; flowers += circD(x, y, 7); }
    out.push(path('M1190 806q140 -30 300 0v20h-300z', { fill: '#5a3a2a' }), line(stems, '#3a8a3a', 3), path(flowers, { fill: '#ffd23a' }));
    // the gnome, upside down: hat on the soil, boots in the air
    const gx = 1340, gy = 800;
    // the gnome, upside down: his pointy hat stuck in the soil, beard pointing up, boots kicking in the air
    out.push(path(`M${gx - 16} ${gy - 26}L${gx} ${gy + 4}L${gx + 16} ${gy - 26}Z`, { fill: '#e8343a' }));
    out.push(circle(gx, gy - 38, 14, { fill: '#f0c4a0' }), circle(gx - 5, gy - 40, 2, { fill: '#1a1a24' }), circle(gx + 5, gy - 40, 2, { fill: '#1a1a24' }), circle(gx, gy - 34, 3.4, { fill: '#ff9a8a' }));
    out.push(path(`M${gx - 14} ${gy - 44}Q${gx} ${gy - 80} ${gx + 14} ${gy - 44}Z`, { fill: '#ffffff' }));
    out.push(path(`M${gx - 16} ${gy - 70}v-40h32v40z`, { fill: '#2a6ad8' }), path(`M${gx - 18} ${gy - 106}h36v6h-36z`, { fill: '#3a2a22' }));
    out.push(path(`M${gx - 14} ${gy - 106}v-18h10v18zM${gx + 4} ${gy - 106}v-18h10v18z`, { fill: '#2a5a3a' }), path(`M${gx - 18} ${gy - 124}h16v-8h-16zM${gx + 2} ${gy - 124}h16v-8h-16z`, { fill: '#3a2a22' }));
    out.push(line(`M${gx - 16} ${gy - 90}l-14 14M${gx + 16} ${gy - 90}l14 14`, '#2a6ad8', 6), circle(gx - 32, gy - 74, 4, { fill: '#f0c4a0' }), circle(gx + 32, gy - 74, 4, { fill: '#f0c4a0' }));
    out.push(line(`M${gx - 30} ${gy - 120}l-8 -6M${gx + 30} ${gy - 120}l8 -6`, '#ffffff', 2.4, { opacity: 0.8 }));
    ppl.gnome = [gx, gy - 60];
    // the table
    const T = { x0: 220, x1: 330, top: 760 };
    out.push(path(`M${T.x0} ${T.top}h${T.x1 - T.x0}v10h-${T.x1 - T.x0}z`, { fill: '#ffffff' }), path(`M${T.x0 + 10} ${T.top + 10}v80h8v-80zM${T.x1 - 18} ${T.top + 10}v80h8v-80z`, { fill: '#8a5a3a' }));
    out.push(path(`M${T.x0 + 16} ${T.top}v-30h50v30z`, { fill: '#ffd23a' }), path(`M${T.x0 + 16} ${T.top - 30}h50v-8q-25 -8 -50 0z`, { fill: '#ffffff' }), path(circD(T.x0 + 28, T.top - 16, 3) + circD(T.x0 + 44, T.top - 10, 4) + circD(T.x0 + 56, T.top - 20, 3) + circD(T.x0 + 34, T.top - 6, 2.4), { fill: '#e8b800' }), circle(T.x0 + 40, T.top - 42, 5, { fill: '#e8243a' }));
    ppl.sponge = [T.x0 + 40, T.top - 20];
    const sx = T.x1 - 22, sy = T.top - 6;
    out.push(ellipse(sx, sy, 8, 6, { fill: '#1a1a24' }), circle(sx - 8, sy - 2, 4, { fill: '#1a1a24' }), line(`M${sx - 4} ${sy}l-8 8l-4 2M${sx} ${sy + 2}l-4 10l-4 0M${sx + 4} ${sy + 2}l4 10l4 0M${sx + 6} ${sy}l8 8l4 2M${sx - 4} ${sy - 4}l-8 -6M${sx + 6} ${sy - 4}l8 -6`, '#1a1a24', 2));
    out.push(circle(sx - 10, sy - 3, 1.4, { fill: '#ffffff' }), circle(sx - 7, sy - 4, 1.4, { fill: '#ffffff' }));
    ppl.spider = [sx, sy];
  }

  // ---- a garden lamp
  out.push(path('M580 852V660h6V852Z', { fill: '#2a2a3a' }), path('M570 660h26l-4 -26h-18z', { fill: '#fff3c4' }), circle(583, 648, 50, { fill: url('lamp') }));

  return { svg: compactSvg(doc(`April Fools' Day · mid. Concept: "the giggliest garden" on the evening of 1 April. Focal point: the bench (x 600–960, y 640–840) where dad sits down with his tea on a whoopee cushion — puff! — while a giggling girl sticks a paper fish on his back ("poisson d'avril!"). A boy and the dog both wear fake glasses with big noses and mustaches; a jack-in-the-box springs up in front of a startled toddler; the garden gnome stands on his head in the flower bed; the washing line has socks and a pair of pants pegged upside down; a tree has googly eyes; on a little table a "cake" is really a sponge and a fake spider waits beside it. Light story: a garden lamp and lit windows against a purple evening. The confetti, which falls up at first, is the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`April Fools' Day · front: bushes in both bottom corners, one with googly eyes; the center stays open`, [], [
    C('a bush bottom left'),
    path(circD(10, 880, 50) + circD(80, 870, 46) + circD(130, 890, 36), { fill: '#2a6a3a' }),
    C('a bush bottom right with googly eyes'),
    path(circD(1520, 876, 50) + circD(1590, 864, 52) + circD(1460, 896, 36), { fill: '#2a6a3a' }),
    circle(1540, 850, 12, { fill: '#ffffff' }), circle(1568, 846, 14, { fill: '#ffffff' }), circle(1544, 854, 5, { fill: '#1a1a24' }), circle(1562, 842, 6, { fill: '#1a1a24' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'dressup', x: r(ppl.glasses[0]), y: r(ppl.glasses[1]), r: 40, label: 'Try on the silly glasses' },
      { activity: 'card', x: r(ppl.fish[0]), y: r(ppl.fish[1]), r: 30, label: 'Make an April fish' },
      { activity: 'color', x: r(ppl.jack[0]), y: r(ppl.jack[1] + 60), r: 50, label: 'Color the jack-in-the-box' },
      { activity: 'memory', x: r(ppl.dad[0]), y: r(ppl.dad[1] + 40), r: 50, label: 'Match the silly tricks' },
    ],
    findables: [
      { id: 'cushion', label: 'a whoopee cushion', x: r(ppl.cushion[0]), y: r(ppl.cushion[1]), r: 24 },
      { id: 'gnome', label: 'a gnome on his head', x: ppl.gnome[0], y: ppl.gnome[1], r: 24 },
      { id: 'pants', label: 'pants upside down', x: r(ppl.pants[0]), y: r(ppl.pants[1]), r: 30 },
      { id: 'spider', label: 'a fake spider', x: r(ppl.spider[0]), y: r(ppl.spider[1]), r: 16 },
      { id: 'sponge', label: 'a cake that is really a sponge', x: ppl.sponge[0], y: ppl.sponge[1], r: 22 },
      { id: 'tree-eyes', label: 'a tree with googly eyes', x: ppl.eyes[0], y: ppl.eyes[1], r: 20 },
      { id: 'dog-glasses', label: 'a dog in silly glasses', x: ppl.dog[0], y: ppl.dog[1], r: 26 },
    ],
  };
}
