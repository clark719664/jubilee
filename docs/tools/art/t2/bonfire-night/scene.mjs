// Bonfire Night — "Bonfire on the village green": a roaring bonfire inside a roped ring on a November night,
// a dad and a girl writing loops with a sparkler, a boy in a bobble hat with a toffee apple, grandma with a
// steaming hot chocolate and their dog in a coat; a striped toffee-apple stall under a string of lights on the
// left, a bench under a bare tree on the right, a terrace and a church spire behind. The fireworks are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, rect, use, lin, rad, blur, doc, smooth, sagPts, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, pineSil, fire, stringLights, bobbleHat, scarf, dog, hedgehog, owl, foxPeek, terrace, line, circD, ellD } from '../../kit/scenekit.mjs';

const ID = 'bonfire-night';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

// ---- palette: November night, firelit
const NIGHT = '#170a1c';
const FIRE = '#ff8a2a';
const lit = (c, k = 0.25) => mix(c, FIRE, k);
const night = (c, k = 0.3) => mix(c, NIGHT, k);
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };

// ---- layout
export const BONFIRE = { x: 800, base: 772, w: 280, h: 282 };
const GROUND = 664;                       // the green meets the far houses
const FENCE = { y: 806, posts: [604, 694, 906, 996], rope: 758 };
const STALL = { x0: 214, x1: 470, top: 566, counter: 694, base: 778 };
const BENCH = { x0: 1316, x1: 1470, seat: 790 };

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const houses = terrace(-30, 1190, GROUND, 11, { hMin: 64, hMax: 108, wMin: 96, wMax: 140 });
  const R = rng(4);
  const wins = houses.windows.filter(() => R() < 0.8);
  const church = [
    `M1290 ${GROUND}V600L1356 560L1422 600V${GROUND}Z`,                                   // nave with a pitched roof
    `M1420 ${GROUND}V552H1474V${GROUND}Z`,                                                // tower
    'M1414 556L1447 386L1480 556Z',                                                       // spire
    `M1474 ${GROUND}V610H1560V${GROUND}Z`,                                                // vestry
  ].join('');
  const trees = [pineSil(1200, GROUND + 2, 90, 52), pineSil(1240, GROUND + 2, 70, 40), pineSil(1590, GROUND + 2, 96, 56), pineSil(-4, GROUND + 4, 84, 50)].join('');
  const defs = [
    rad(id('glow'), 0.5, 0.62, 0.5, [[0, '#ff9a3a', 0.55], [0.45, '#ff7a2a', 0.22], [1, '#ff7a2a', 0]]),
    rad(id('winglow'), 0.5, 0.5, 0.5, [[0, '#ffcf7a', 0.5], [1, '#ffcf7a', 0]]),
    blur(id('smoke'), 14),
  ];
  return compactSvg(doc(`Bonfire Night · back: a terrace of houses with lit windows, a church spire and dark pines on the skyline, low hills, the bonfire's glow on the horizon and its smoke drifting away to the right`, defs, [
    C('the bonfire\'s glow on the horizon, behind everything'),
    ellipse(800, 660, 640, 300, { fill: url('glow') }),
    C('low hills'),
    path(`M-20 ${GROUND + 6}Q300 618 640 640T1240 630T1620 626V${GROUND + 20}H-20Z`, { fill: '#2a1426' }),
    C('the terrace, the church and the pines'),
    path(houses.d, { fill: '#2f1729' }),
    path(church, { fill: '#2a1424' }),
    path(trees, { fill: '#22101e' }),
    C('lit windows'),
    wins.map(([x, y, w, h]) => ellipse(x + w / 2, y + h / 2, w * 1.4, h * 1.2, { fill: url('winglow') })).join(''),
    path(wins.map(([x, y, w, h]) => `M${P(x, y)}h${f(w)}v${f(h)}h${f(-w)}Z`).join(''), { fill: '#ffcf7a', opacity: 0.9 }),
    C('smoke drifting up and away to the right, soft'),
    G({ filter: url('smoke'), opacity: 0.28 },
      circle(812, 548, 46, { fill: '#a89aa8' }), circle(856, 512, 52, { fill: '#a89aa8' }), circle(918, 484, 58, { fill: '#9a8a9a' }),
      circle(1000, 468, 60, { fill: '#8a7a8a' }), circle(1086, 462, 54, { fill: '#7a6a7a' }), circle(1160, 466, 44, { fill: '#6a5a6a' })),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const defs = [
    lin(id('grass'), 0, 0, 0, 1, [[0, '#3a2a24'], [0.45, '#2a2a1e'], [1, '#1a1a12']]),
    rad(id('pool'), 0.5, 0.42, 0.5, [[0, '#ffb04a', 0.62], [0.45, '#ff8a2a', 0.26], [1, '#ff8a2a', 0]]),
    rad(id('halo'), 0.5, 0.6, 0.5, [[0, '#ffd166', 0.6], [0.5, '#ff9a3a', 0.24], [1, '#ff9a3a', 0]]),
    rad(id('spark'), 0.5, 0.5, 0.5, [[0, '#ffffff'], [0.3, '#fff3b0'], [0.7, '#ffd166', 0.5], [1, '#ffd166', 0]]),
    lin(id('log'), 0, 0, 1, 0, [[0, '#5a3a24'], [1, '#2e1c10']]),
    lin(id('awning'), 0, 0, 0, 1, [[0, '#e8343a'], [1, '#b81e2a']]),
    lin(id('wood'), 0, 0, 0, 1, [[0, '#9a6a3a'], [1, '#6a4422']]),
  ];
  const ppl = { marks: {} };

  // ---- the green
  out.push(C('the green: dark November grass, firelit in a big pool round the bonfire'));
  out.push(path(`M-20 ${GROUND + 2}Q420 650 800 656T1620 650V920H-20Z`, { fill: url('grass') }));
  out.push(ellipse(BONFIRE.x, 800, 560, 150, { fill: url('pool') }));
  // grass tufts across the green, lighter where the fire lights them
  {
    const R = rng(9); let d = '', dl = '';
    for (let i = 0; i < 60; i++) {
      const x = -10 + R() * 1620, y = 690 + R() * 200; if (Math.abs(x - BONFIRE.x) < 150 && y < 790) continue;
      const tuft = `M${P(x - 6, y)}q2-9 0-14q4 6 6 14zm8 0q-1-11 3-16q0 9 1 16z`;
      if (Math.abs(x - BONFIRE.x) < 420) dl += tuft; else d += tuft;
    }
    out.push(path(d, { fill: '#3a3a26' }), path(dl, { fill: '#6a5a2e' }));
  }

  // ---- the left tree with the owl
  out.push(C('a bare November tree on the left, lit on the side that faces the fire; an owl on a low branch'));
  const tl = bareTree(118, 708, 560, 21, { lean: 0.05, depth: 6, spread: 0.5 });
  out.push(path(tl.d, { fill: '#2e1e16' }));
  out.push(path('M134 486q30-6 64-22l3 6q-34 18-66 24z', { fill: '#2e1e16' }));               // the owl's branch
  out.push(owl(186, 470, 0.95));
  ppl.marks.owl = [186, 448];

  // ---- the toffee-apple stall
  out.push(C('the toffee-apple stall: striped awning, a string of lights, a counter of toffee apples, a stallholder'));
  const S = STALL;
  out.push(ellipse((S.x0 + S.x1) / 2, S.base + 4, 150, 12, { fill: '#000', opacity: 0.3 }));
  out.push(path(`M${S.x0 + 8} ${S.base}V${S.top + 10}M${S.x1 - 8} ${S.base}V${S.top + 10}`, { fill: 'none', stroke: '#4a3020', 'stroke-width': 9, 'stroke-linecap': 'round' }));
  const keeper = figure({ x: 344, foot: S.counter + 18, H: 94, heads: 3.1, skin: SKIN.brown, hair: '#2a1a14', style: 'short', top: '#2f6a8a', bottom: '#2a2a3a',
    arms: [{ sx: -1, elbow: [-0.9, 1.0], hand: [-0.2, 1.6] }, { sx: 1, elbow: [1.2, 0.4], hand: [2.0, -0.6] }] });
  out.push(keeper.svg);
  out.push(bobbleHat(344, keeper.headY, keeper.r, '#e8343a', '#ffffff', '#ffffff', -6));
  // the counter in front of him
  out.push(path(`M${S.x0 - 6} ${S.counter}h${S.x1 - S.x0 + 12}v12h${-(S.x1 - S.x0 + 12)}Z`, { fill: '#b88a52' }));
  out.push(path(`M${S.x0} ${S.counter + 12}h${S.x1 - S.x0}V${S.base}H${S.x0}Z`, { fill: url('wood') }));
  out.push(path([0, 1, 2, 3].map((i) => `M${S.x0 + 6} ${S.counter + 26 + i * 18}h${S.x1 - S.x0 - 12}`).join(''), { fill: 'none', stroke: '#5a3a1e', 'stroke-width': 2.5, opacity: 0.6 }));
  // toffee apples standing on the counter, each on its stick
  const apples = [];
  for (let i = 0; i < 7; i++) {
    const x = S.x0 + 26 + i * 34, y = S.counter - 13;
    apples.push([x, y]);
    out.push(line(`M${P(x + 1, y - 10)}l2 -20`, '#e8d0a0', 3.2));
    out.push(circle(x, y, 13, { fill: '#c8162a' }), ellipse(x, y + 11, 16, 4, { fill: '#a81f1a' }));
    out.push(circle(x - 5, y - 5, 3.6, { fill: '#ffffff', opacity: 0.75 }));
  }
  ppl.marks.apples = [(S.x0 + S.x1) / 2, S.counter - 16];
  // the awning: red and white stripes with a scalloped edge
  const aw = { y0: S.top, y1: S.top + 46 };
  let stripes = '';
  for (let x = S.x0 - 16, i = 0; x < S.x1 + 16; x += 30, i++) if (i % 2 === 0) stripes += `M${x} ${aw.y0}h30V${aw.y1}h-30Z`;
  out.push(path(`M${S.x0 - 16} ${aw.y0}L${S.x0 + 10} ${aw.y0 - 30}H${S.x1 - 10}L${S.x1 + 16} ${aw.y0}V${aw.y1}H${S.x0 - 16}Z`, { fill: '#fff4e6' }));
  out.push(path(`M${S.x0 + 10} ${aw.y0 - 30}H${S.x1 - 10}L${S.x1 + 16} ${aw.y0}H${S.x0 - 16}Z`, { fill: '#c8162a' }));
  out.push(path(stripes, { fill: url('awning') }));
  let scallop = `M${S.x0 - 16} ${aw.y1}`;
  for (let x = S.x0 - 16; x < S.x1 + 16; x += 30) scallop += `q15 22 30 0`;
  out.push(path(scallop + 'Z', { fill: '#c8162a' }));
  // a cat asleep on the awning roof (findable)
  out.push(G({ transform: `translate(300 ${aw.y0 - 30})` },
    path('M-22 0c0-14 8-22 22-22c14 0 22 8 22 22z', { fill: '#3a3a4a' }), circle(16, -14, 9, { fill: '#3a3a4a' }),
    path('M10 -21l2-8l5 6zM20 -21l4-7l2 8z', { fill: '#3a3a4a' }), path('M12 -14q3 2 6 0', { fill: 'none', stroke: '#c8c8d8', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    path('M-22 -2q-14 2-12 -12', { fill: 'none', stroke: '#3a3a4a', 'stroke-width': 6, 'stroke-linecap': 'round' })));
  ppl.marks.cat = [304, aw.y0 - 42];
  // the string of lights from the awning to the tree
  out.push(stringLights(S.x0 - 12, aw.y0 - 4, 150, 590, 30, 6, ['#ffd166', '#ff8fb8', '#7ad3f0', '#a8e06a']));
  out.push(circle(150, 590, 3.5, { fill: '#2e1e16' }));

  // ---- the hedgehog in a leaf pile (findable)
  out.push(C('a leaf pile with a hedgehog peeking out (a nod to checking bonfires for hedgehogs)'));
  {
    const R = rng(31); let d = '';
    const cols = ['#c86a2a', '#e8a030', '#a8401a', '#d88a3a'];
    const leaves = [];
    for (let i = 0; i < 26; i++) { const a = R() * Math.PI, rr = R(); leaves.push([506 + Math.cos(a) * 46 * rr, 846 - Math.sin(a) * 26 * rr, cols[i % 4], R() * 180]); }
    out.push(ellipse(506, 850, 56, 8, { fill: '#000', opacity: 0.25 }));
    out.push(path('M450 850q8-34 56-38q48 4 56 38z', { fill: '#8a4a1e' }));
    out.push(hedgehog(470, 852, 0.9));
    for (const [x, y, c, a] of leaves) out.push(path(`M${P(x - 9, y)}q9-7 18 0q-9 7-18 0z`, { fill: c, transform: `rotate(${f(a)} ${f(x)} ${f(y)})` }));
    ppl.marks.hedgehog = [462, 840];
  }

  // ---- the bonfire
  out.push(C('the bonfire (focal): a teepee of logs on a ring of ash, roaring flames, a halo of light and rising embers'));
  const B = BONFIRE;
  out.push(ellipse(B.x, B.base - 120, 300, 260, { fill: url('halo') }));
  out.push(ellipse(B.x, B.base + 4, 170, 22, { fill: '#2a1a12' }), ellipse(B.x, B.base, 150, 16, { fill: '#5a3018' }));
  const apex = [B.x, B.base - 214];
  const logBase = [-112, -76, -36, 8, 48, 86, 118];
  const logs = (list, col) => list.map((dx, i) => { const x0 = B.x + dx, y0 = B.base + 2; const ax = apex[0] + (dx * 0.08), ay = apex[1] + (i % 2) * 10; const a = Math.atan2(ay - y0, ax - x0); const w = 9 + (i % 3) * 2; const px = -Math.sin(a) * w, py = Math.cos(a) * w;
    return path(`M${P(x0 + px, y0 + py)}L${P(ax + px * 0.8, ay + py * 0.8)}Q${P(ax - Math.cos(a) * -4, ay)} ${P(ax - px * 0.8, ay - py * 0.8)}L${P(x0 - px, y0 - py)}Z`, { fill: col }); }).join('');
  const flames = fire(B.x, B.base - 6, B.w, B.h, 5);
  out.push(flames.back);
  out.push(logs(logBase, url('log')));                                                         // the teepee shows through the outer flames
  out.push(line(logBase.map((dx) => `M${P(B.x + dx * 0.98, B.base - 4)}L${P(apex[0] + dx * 0.1, apex[1] + 22)}`).join(''), '#ff9a3a', 2.6, { opacity: 0.55 }));
  out.push(flames.front);
  // three logs in front of the flames' foot, lit on top
  out.push(path(`M${B.x - 120} ${B.base - 2}l76-34l6 12l-76 32z`, { fill: '#4a2c18' }), path(`M${B.x + 124} ${B.base - 4}l-80-30l-4 12l80 30z`, { fill: '#3e2414' }));
  out.push(path(`M${B.x - 60} ${B.base + 6}h124l2 -14h-128z`, { fill: '#5a3a22' }));
  out.push(line(`M${B.x - 118} ${B.base - 10}l70-30M${B.x + 122} ${B.base - 12}l-74-28M${B.x - 58} ${B.base - 6}h120`, '#ffb04a', 3, { opacity: 0.7 }));
  // embers rising (small, below the copy zone)
  {
    const R = rng(12); let d = '';
    for (let i = 0; i < 26; i++) { const x = B.x + (R() - 0.5) * 260, y = 460 + R() * 160; d += circD(x, y, 1.6 + R() * 2); }
    out.push(path(d, { fill: '#ffd166', opacity: 0.85 }));
  }

  // ---- the rope ring: posts and a sagging rope in front of the fire
  out.push(C('the safety rope: posts and a sagging rope round the fire'));
  const F = FENCE;
  for (const x of F.posts) out.push(ellipse(x, F.y + 2, 12, 4, { fill: '#000', opacity: 0.3 }), path(`M${x - 5} ${F.y}V${F.rope - 14}q5-6 10 0V${F.y}Z`, { fill: '#c8a06a' }), path(`M${x + 1} ${F.y}V${F.rope - 12}`, { fill: 'none', stroke: lit('#e8c88a', 0.3), 'stroke-width': 2.5 }));
  for (let i = 0; i < F.posts.length - 1; i++) {
    const a = F.posts[i], b = F.posts[i + 1];
    if (b - a > 150) continue;                                                               // the gap in front of the fire is open
    out.push(line(`M${a} ${F.rope - 8}Q${(a + b) / 2} ${F.rope + 16} ${b} ${F.rope - 8}`, '#e8d8b0', 3.4));
  }
  out.push(line(`M${F.posts[1]} ${F.rope - 8}Q${(F.posts[1] + F.posts[2]) / 2} ${F.rope - 2} ${F.posts[2]} ${F.rope - 8}`, '#e8d8b0', 3.4));
  // a lost red mitten on the last post (findable)
  out.push(path(`M${F.posts[3] - 9} ${F.rope - 14}c-2-14 2-22 10-22c8 0 12 8 10 22z`, { fill: '#d62828' }), path(`M${F.posts[3] - 10} ${F.rope - 18}h20v6h-20z`, { fill: '#fff4e6' }));
  ppl.marks.mitten = [F.posts[3], F.rope - 26];

  // ---- the sparkler bucket (findable): sand and a few spent sparklers
  out.push(C('a bucket of sand for the spent sparklers'));
  out.push(ellipse(700, 858, 24, 5, { fill: '#000', opacity: 0.3 }), path('M680 822h40l-4 36h-32z', { fill: '#7a8aa6' }), ellipse(700, 822, 20, 5, { fill: '#d8b878' }));
  out.push(line('M694 820l-6-24M704 820l4-26M710 820l12-20', '#5a5a66', 2.5));
  out.push(path('M680 822q20 6 40 0', { fill: 'none', stroke: '#9aaac6', 'stroke-width': 2.5 }));
  ppl.marks.bucket = [700, 830];

  // ---- the left family: dad and a girl writing loops with a sparkler
  out.push(C('dad and a girl in a bobble hat; she writes a loop of light with her sparkler'));
  const dadX = 562, girlX = 626;
  const dad = figure({ x: dadX, foot: 846, H: 98, heads: 3.2, skin: SKIN.fair, hair: '#5a3a22', style: 'short', top: '#2a4a7a', bottom: '#2a2a3a', gaze: 0.2,
    arms: [{ sx: -1, elbow: [-0.6, 1.2], hand: [-0.3, 2.2] }, { sx: 1, elbow: [0.9, 1.2], hand: [1.9, 2.0] }] });
  out.push(dad.svg);
  out.push(scarf(dadX, dad.torsoTop - 2, dad.r * 1.7, '#e8a030'));
  const dadHand = dad.hand({ sx: 1, elbow: [0.9, 1.2], hand: [1.9, 2.0] });
  const gH = 68, gHeads = 2.7, gr = gH / (gHeads * 2), gTorsoTop = 850 - gH + gr + gr * 1.35, gtw = gr * 1.9;
  const gShoulderL = [girlX - gtw * 0.46, gTorsoTop + gr * 0.45];
  const toDad = [(dadHand[0] - gShoulderL[0]) / gr, (dadHand[1] - gShoulderL[1]) / gr];
  const girl = figure({ x: girlX, foot: 850, H: gH, heads: gHeads, skin: SKIN.tan, hair: '#2a1a14', style: 'bob', top: '#d62828', bottom: '#2a3a6a', shoe: '#ffc23a', gaze: 0.25, mouth: 'open',
    arms: [{ sx: -1, elbow: [toDad[0] * 0.5, toDad[1] * 0.5 + 0.4], hand: toDad }, { sx: 1, elbow: [1.1, -0.4], hand: [1.9, -2.1] }],
    hat: '' });
  out.push(girl.svg);
  out.push(bobbleHat(girlX, girl.headY, girl.r, '#2f8a5a', '#fff4e6', '#fff4e6', 6));
  // the sparkler: wire through her fist, a fizzing tip, and the loop she has drawn in the air
  const gh = girl.hand({ sx: 1, elbow: [1.1, -0.4], hand: [1.9, -2.1] });
  const tip = [gh[0] + 24, gh[1] - 50];
  out.push(line(`M${P(gh[0] - 4, gh[1] + 9)}L${P(...tip)}`, '#8a90a6', 3));
  out.push(line(`M${P(gh[0] + 12, gh[1] - 24)}L${P(...tip)}`, '#4a4a5a', 5));
  out.push(circle(gh[0], gh[1], girl.r * 0.36, { fill: SKIN.tan }));                            // her fist over the wire
  const loop = `M${P(...tip)}c30-18 62 -8 56 20c-6 26-46 30-52 6c-6-20 18-40 48-36c30 4 40 24 34 40`;
  out.push(line(loop, '#ffd166', 4, { 'stroke-dasharray': '2 9', opacity: 0.95 }));
  out.push(line(loop, '#fff3b0', 1.6, { opacity: 0.6 }));
  out.push(circle(tip[0], tip[1], 26, { fill: url('spark') }));
  { let d = ''; for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; const L = k % 2 ? 12 : 20; d += `M${P(tip[0] + Math.cos(a) * 5, tip[1] + Math.sin(a) * 5)}L${P(tip[0] + Math.cos(a) * L, tip[1] + Math.sin(a) * L)}`; } out.push(line(d, '#fff3b0', 2.2)); }
  ppl.tip = tip;

  // ---- the right family: a boy with a toffee apple, grandma with hot chocolate, the dog
  out.push(C('a boy in a bobble hat holding up a toffee apple, grandma with a steaming mug, their dog in a tartan coat'));
  const boyX = 972, granX = 1044;
  const boyArm = { sx: -1, elbow: [-0.9, 0.9], hand: [-0.5, -0.4] };
  const boy = figure({ x: boyX, foot: 852, H: 66, heads: 2.7, skin: SKIN.light, hair: '#c8642a', style: 'short', top: '#2f8a5a', bottom: '#2a3a6a', shoe: '#e8343a', gaze: -0.22, mouth: 'open',
    arms: [boyArm, { sx: 1, elbow: [0.8, 1.2], hand: [0.4, 2.1] }] });
  out.push(boy.svg);
  out.push(scarf(boyX, boy.torsoTop - 1, boy.r * 1.8, '#ffd166', -1));
  out.push(bobbleHat(boyX, boy.headY - boy.r * 0.2, boy.r, '#e8343a', '#ffffff', '#ffffff', -8));
  const bh = boy.hand(boyArm);
  out.push(line(`M${P(bh[0], bh[1] + 8)}l-2 -26`, '#e8d0a0', 3.2));
  out.push(circle(bh[0] - 2, bh[1] - 26, 11, { fill: '#c8162a' }), circle(bh[0] - 6, bh[1] - 30, 3, { fill: '#fff', opacity: 0.75 }));
  out.push(circle(bh[0], bh[1], boy.r * 0.36, { fill: SKIN.light }));
  ppl.boy = [boyX, boy.headY + 10];
  const mugArmL = { sx: -1, elbow: [-0.5, 1.4], hand: [0.6, 1.0] }, mugArmR = { sx: 1, elbow: [0.5, 1.4], hand: [-0.4, 1.0] };
  const gran = figure({ x: granX, foot: 846, H: 92, heads: 3.1, skin: SKIN.fair, hair: '#e6e2ee', style: 'elder', top: '#8a3a6a', bottom: '#3a2a4a', gaze: -0.18,
    arms: [mugArmL, mugArmR] });
  out.push(gran.svg);
  out.push(scarf(granX, gran.torsoTop - 2, gran.r * 1.8, '#2f8a8a'));
  const mh = gran.hand(mugArmL);
  const mug = [mh[0] + 2, mh[1] - 6];
  out.push(path(`M${P(mug[0] - 9, mug[1] - 10)}h18v16q0 5-5 5h-8q-5 0-5-5z`, { fill: '#f2f2ea' }), path(`M${P(mug[0] + 9, mug[1] - 6)}q7 0 7 6t-7 6`, { fill: 'none', stroke: '#f2f2ea', 'stroke-width': 3 }));
  out.push(path(`M${P(mug[0] - 9, mug[1] - 4)}h18v4h-18z`, { fill: '#d62828' }));
  out.push(circle(mh[0], mh[1], gran.r * 0.34, { fill: SKIN.fair }), circle(gran.hand(mugArmR)[0], gran.hand(mugArmR)[1], gran.r * 0.34, { fill: SKIN.fair }));
  ppl.mug = mug;
  out.push(dog(1112, 852, 0.9, '#c8894a', { coat: '#c8352f', flip: -1 }));
  ppl.dog = [1112, 820];

  // ---- the right tree, the bench and the fox
  out.push(C('a bare tree on the right with a bench under it; a fox peeks over the bench'));
  const tr = bareTree(1512, 712, 540, 44, { lean: -0.06, depth: 6, spread: 0.48 });
  out.push(path(tr.d, { fill: '#2a1a14' }));
  const Bn = BENCH;
  out.push(foxPeek(1424, Bn.seat - 42, 0.9));
  ppl.marks.fox = [1412, Bn.seat - 62];
  out.push(ellipse((Bn.x0 + Bn.x1) / 2, 846, 90, 8, { fill: '#000', opacity: 0.28 }));
  out.push(path(`M${Bn.x0 + 12} 846V${Bn.seat}M${Bn.x1 - 12} 846V${Bn.seat}`, { fill: 'none', stroke: '#2a2a32', 'stroke-width': 7 }));
  out.push(path(`M${Bn.x0} ${Bn.seat - 6}h${Bn.x1 - Bn.x0}v12h${-(Bn.x1 - Bn.x0)}Z`, { fill: '#8a5a32' }));
  out.push(path(`M${Bn.x0} ${Bn.seat - 50}h${Bn.x1 - Bn.x0}v10h${-(Bn.x1 - Bn.x0)}ZM${Bn.x0} ${Bn.seat - 30}h${Bn.x1 - Bn.x0}v10h${-(Bn.x1 - Bn.x0)}Z`, { fill: '#7a4e2a' }));
  out.push(path(`M${Bn.x0 + 12} ${Bn.seat - 54}V${Bn.seat - 6}M${Bn.x1 - 12} ${Bn.seat - 54}V${Bn.seat - 6}`, { fill: 'none', stroke: '#2a2a32', 'stroke-width': 6 }));

  ppl.left = { dad: [dadX, dad.headY], girl: [girlX, girl.headY] };
  return { svg: compactSvg(doc(`Bonfire Night · mid. Concept: a village green on the 5th of November. Focal point: the bonfire inside its roped ring (x 620–980, y 460–800). A dad and a girl writing loops of light with a sparkler on the left of it; a boy in a bobble hat holding up a toffee apple, grandma with a steaming hot chocolate and their dog in a tartan coat on the right; a striped toffee-apple stall under a string of lights on the far left, a bench under a bare tree on the far right. Light story: the fire is the only big light; it pools warm orange on the grass and lights the sides of things that face it; everything else is cool night. The fireworks in the sky are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  const R = rng(17);
  let grass = '', leaves = '';
  const tuft = (x, y, h) => `M${P(x - 9, y)}q3-${f(h * 0.6)} 0-${f(h)}q7 ${f(h * 0.5)} 9 ${f(h)}zm10 0q-2-${f(h * 0.8)} 5-${f(h * 1.1)}q-1 ${f(h * 0.6)} 1 ${f(h * 1.1)}zm10 0q1-${f(h * 0.5)} 9-${f(h * 0.8)}q-5 ${f(h * 0.4)}-3 ${f(h * 0.8)}z`;
  for (let i = 0; i < 16; i++) grass += tuft(-10 + R() * 300, 905 - R() * 30, 30 + R() * 40);
  for (let i = 0; i < 16; i++) grass += tuft(1320 + R() * 300, 905 - R() * 30, 30 + R() * 40);
  for (let i = 0; i < 6; i++) grass += tuft(560 + R() * 480, 908, 14 + R() * 10);
  const cols = ['#a8401a', '#c86a2a', '#7a3a14'];
  const lv = cols.map(() => '');
  for (let i = 0; i < 18; i++) { const side = i % 2, x = side ? 1340 + R() * 240 : 20 + R() * 240, y = 880 + R() * 22, a = R() * 3.14; const k = i % 3;
    lv[k] += `M${P(x - Math.cos(a) * 12, y - Math.sin(a) * 6)}Q${P(x, y - 10)} ${P(x + Math.cos(a) * 12, y + Math.sin(a) * 6)}Q${P(x, y + 10)} ${P(x - Math.cos(a) * 12, y - Math.sin(a) * 6)}Z`; }
  // a pair of wellies, bottom right
  const welly = (x) => `M${P(x, 900)}V${f(846)}q0-6 6-6h18q6 0 6 6v34h14q8 0 8 8v12z`;
  return compactSvg(doc(`Bonfire Night · front: dark grass tufts and fallen leaves in both bottom corners; the center stays open`, [], [
    C('dark grass in both corners and a few low tufts along the bottom'),
    path(grass, { fill: '#141410' }),
    C('fallen leaves'),
    lv.map((d, k) => path(d, { fill: cols[k] })).join(''),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const B = BONFIRE;
  return {
    hotspots: [
      { activity: 'wish', x: Math.round(ppl.tip[0] + 20), y: Math.round(ppl.tip[1] + 6), r: 40, label: 'Make a wish on a sparkler' },
      { activity: 'color', x: B.x, y: B.base - 130, r: 74, label: 'Color in the bonfire' },
      { activity: 'dressup', x: Math.round(ppl.boy[0]), y: Math.round(ppl.boy[1] + 34), r: 42, label: 'Dress up for Bonfire Night' },
      { activity: 'card', x: Math.round(ppl.mug[0]), y: Math.round(ppl.mug[1] - 4), r: 32, label: 'Make a cozy hot-chocolate card' },
      { activity: 'memory', x: Math.round(ppl.marks.apples[0]), y: Math.round(ppl.marks.apples[1]), r: 60, label: 'Toffee apple memory game' },
    ],
    findables: [
      { id: 'hedgehog', label: 'a hedgehog in a pile of leaves', x: ppl.marks.hedgehog[0], y: ppl.marks.hedgehog[1], r: 22 },
      { id: 'owl', label: 'an owl in the tree', x: ppl.marks.owl[0], y: ppl.marks.owl[1], r: 24 },
      { id: 'fox', label: 'a fox peeking over the bench', x: ppl.marks.fox[0], y: ppl.marks.fox[1], r: 26 },
      { id: 'mitten', label: 'a lost red mitten on a post', x: ppl.marks.mitten[0], y: ppl.marks.mitten[1], r: 18 },
      { id: 'stall-cat', label: 'a cat asleep on the stall roof', x: ppl.marks.cat[0], y: ppl.marks.cat[1], r: 24 },
      { id: 'sand-bucket', label: 'a bucket of sand for sparklers', x: ppl.marks.bucket[0], y: ppl.marks.bucket[1], r: 24 },
      { id: 'dog-coat', label: 'a dog in a tartan coat', x: ppl.dog[0], y: ppl.dog[1], r: 28 },
    ],
  };
}
