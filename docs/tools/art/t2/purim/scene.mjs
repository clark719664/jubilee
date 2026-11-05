// Purim — "The costume parade": a street on Purim evening. Children in costumes parade across the middle spinning
// groggers: Queen Esther in a gold crown holding the scroll, a lion, a clown with a red nose and a little bumblebee,
// with dad dressed as a jolly king. On the left a girl hands a gift basket of hamantaschen, an orange and a juice box
// to the neighbor at his door; on the right a table is piled with hamantaschen and a grogger. The confetti is
// the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { stringLights, line, circD, terrace } from '../../kit/scenekit.mjs';

const ID = 'purim';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const NIGHT = '#2a1a6a';
const night = (c, k = 0.3) => mix(c, NIGHT, k);
const GOLD = '#ffc83a', LAMP = '#ffd98a';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const STREET = 770;

/** A hamantasch: a three-cornered cookie with a dab of filling. */
const tasch = (x, y, s, fill = '#6a1a4a', a = 0) => G({ transform: `translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(s)})` },
  path('M0 -14Q4 -14 13 4Q15 9 10 10H-10Q-15 9 -13 4Q-4 -14 0 -14Z', { fill: '#e8a850' }),
  path('M0 -8L7 5H-7Z', { fill }),
  path('M-3 -7q3 -2 6 0', { fill: 'none', stroke: '#f8d090', 'stroke-width': 1.6 }));

/** A grogger held at (x, y): the handle, the spinning ratchet arm and its whirr lines. */
const grogger = (x, y, a = -30) => G({ transform: `translate(${f(x)} ${f(y)})` },
  path('M-3 0v20h6V0z', { fill: '#8a5a3a' }),
  G({ transform: `rotate(${a})` }, path('M-4 -4h34v10h-34z', { fill: '#e8343a' }), path('M-2 -4h4v10h-4zM10 -4h4v10h-4zM22 -4h4v10h-4z', { fill: GOLD })),
  path('M-26 -18q-8 14 0 26M30 -28q12 6 14 18M-20 -30q8 -8 20 -10', { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.85 }));

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const town = terrace(-30, 1640, 650, 33, { hMin: 80, hMax: 120, wMin: 110, wMax: 160 });
  const wins = town.windows;
  const defs = [rad(id('winglow'), 0.5, 0.5, 0.5, [[0, LAMP, 0.5], [1, LAMP, 0]])];
  return compactSvg(doc(`Purim · back: a terrace of houses with chimneys and lit windows along the far side of the street against the purple evening sky`, defs, [
    C('the far terrace'),
    path(town.d, { fill: night('#4a3a8a', 0.3) }),
    wins.map(([x, y, w, h]) => ellipse(x + w / 2, y + h / 2, w * 1.3, h * 1.1, { fill: url('winglow') })).join(''),
    path(wins.map(([x, y, w, h]) => `M${P(x, y)}h${f(w)}v${f(h)}h${f(-w)}Z`).join(''), { fill: LAMP, opacity: 0.85 }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('road'), 0, 0, 0, 1, [[0, '#6a5a9a'], [1, '#4a3a7a']]),
    lin(id('house'), 0, 0, 0, 1, [[0, '#f0e0d0'], [1, '#d8c4b4']]),
    rad(id('win'), 0.5, 0.6, 0.75, [[0, '#fff3cf'], [0.5, '#ffd98a'], [1, '#f0a84a']]),
    rad(id('pool'), 0.5, 0.5, 0.5, [[0, LAMP, 0.45], [1, LAMP, 0]]),
    lin(id('gold'), 0, 0, 0, 1, [[0, '#ffe680'], [1, '#d8941a']]),
    lin(id('basket'), 0, 0, 0, 1, [[0, '#d8a060'], [1, '#a86a30']]),
  ];

  // ---- the street
  out.push(C('the street and pavement, pools of warm light'));
  out.push(path(`M-20 ${STREET - 120}H1620V920H-20Z`, { fill: url('road') }), path(`M-20 ${STREET - 120}H1620v10H-20Z`, { fill: '#8a7aba' }));
  out.push(ellipse(780, 830, 480, 70, { fill: url('pool') }));

  // ---- the neighbor's house on the left, door open
  out.push(C('the neighbor\'s house on the left: an open door with a warm hall, a mezuzah, a window with paper decorations'));
  out.push(path('M-20 650V250L130 170L290 250V650Z', { fill: url('house') }), path('M-26 254L130 162L296 254', { fill: 'none', stroke: night('#6a3a5a', 0.1), 'stroke-width': 14 }));
  out.push(path('M30 300h80v90h-80zM170 300h80v90h-80z', { fill: url('win') }), path('M70 300v90M30 344h80M210 300v90M170 344h80', { fill: 'none', stroke: '#f4ecd8', 'stroke-width': 4 }));
  {
    const cols = ['#ff4d6d', '#ffd23a', '#5ab8e8', '#8ad870'];
    for (const x0 of [32, 172]) for (let k = 0; k < 5; k++) out.push(path(`M${x0 + 4 + k * 15} 312h12l-6 12z`, { fill: cols[k % 4] }));
    out.push(path('M34 312q36 10 72 0M174 312q36 10 72 0', { fill: 'none', stroke: '#ffffff', 'stroke-width': 1.4 }));
  }
  out.push(path('M120 650V470h110V650Z', { fill: url('win') }), path('M118 650V470h4V650ZM228 650V470h4V650Z', { fill: '#5a3a2a' }), path('M118 466h114v8h-114z', { fill: '#5a3a2a' }));
  out.push(path('M236 520l8 -4v30l-8 4z', { fill: GOLD }));
  // the neighbor grandpa in the doorway, receiving the basket
  {
    const take = { sx: 1, elbow: [0.8, 0.4], hand: [1.4, 0.4] };
    const gp = figure({ x: 176, foot: 650, H: 116, heads: 3.2, skin: SKIN.fair, hair: '#dcd8e0', style: 'short', top: '#3a5a8a', bottom: '#2a2a3a', gaze: 0.5, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.3, 1.8] }, take] });
    out.push(gp.svg);
    out.push(path(`M${P(176 - gp.r * 0.9, gp.headY - gp.r * 0.5)}C${P(176 - gp.r * 0.8, gp.headY - gp.r * 1.2)} ${P(176 + gp.r * 0.8, gp.headY - gp.r * 1.2)} ${P(176 + gp.r * 0.9, gp.headY - gp.r * 0.5)}Z`, { fill: '#2a2a5a' }));
    const h = gp.hand(take);
    out.push(circle(h[0], h[1], gp.r * 0.34, { fill: SKIN.fair }));
    ppl.door = [176, gp.headY];
    // the girl handing over the gift basket
    const give = { sx: -1, elbow: [-0.9, 0.0], hand: [-1.6, -0.3] };
    const g = figure({ x: 330, foot: 700, H: 86, heads: 2.7, skin: SKIN.brown, hair: '#1a1210', style: 'puffs', top: '#2ab8a8', bottom: '#2a3a6a', shoe: '#ff6aa8', gaze: -0.5, mouth: 'smile', arms: [give, { sx: 1, elbow: [0.6, 1.0], hand: [0.4, 1.9] }] });
    out.push(g.svg);
    const gh = g.hand(give);
    const bx = gh[0] - 30, by = gh[1] + 4;
    out.push(path(`M${P(bx - 34, by - 18)}h68l-8 34h-52z`, { fill: url('basket') }), path(`M${P(bx - 34, by - 18)}q34 -50 68 0`, { fill: 'none', stroke: '#a86a30', 'stroke-width': 4 }));
    out.push(tasch(bx - 16, by - 22, 0.9), tasch(bx + 2, by - 26, 0.9, '#c8102e'), circle(bx + 20, by - 26, 10, { fill: '#ff9a1a' }), path(`M${P(bx - 26, by - 36)}h12v18h-12z`, { fill: '#5ab8e8' }));
    out.push(path(`M${P(bx - 8, by - 50)}c-14 -12 -20 4 -8 8c-12 6 0 16 8 4c8 12 20 2 8 -4c12 -4 6 -20 -8 -8z`, { fill: '#e8343a' }));
    out.push(path(`M${P(bx - 30, by - 6)}h60M${P(bx - 28, by + 4)}h56`, { fill: 'none', stroke: '#a86a30', 'stroke-width': 2 }), circle(gh[0], gh[1], g.r * 0.36, { fill: SKIN.brown }));
    ppl.basket = [bx, by - 20];
  }

  // ---- string lights across the street, below the copy zone
  out.push(C('string lights across the street'));
  out.push(stringLights(290, 470, 1320, 470, 56, 24, ['#ffd166', '#ff6a9a', '#7ad0ff', '#c8a0ff'], { wire: '#2a1a4a', r: 5 }));

  // ---- the parade
  out.push(C('the focal point: the costume parade — Queen Esther in a gold crown with the scroll, a lion spinning a grogger, a clown with a red nose, a little bumblebee and dad as a jolly king'));
  {
    // dad, the jolly king, at the back of the parade
    const kx = 1060;
    const cheer = (s) => ({ sx: s, elbow: [s * 0.9, -0.9], hand: [s * 1.2, -2.2] });
    const king = figure({ x: kx, foot: 850, H: 124, heads: 3.3, skin: SKIN.tan, hair: '#1a1210', style: 'short', top: '#c8243a', bottom: '#2a2a3a', gaze: -0.4, mouth: 'open', arms: [cheer(-1), { sx: 1, elbow: [0.7, 1.0], hand: [0.4, 1.8] }] });
    out.push(path(`M${P(kx - king.tw * 0.6, king.torsoTop)}L${P(kx - king.tw * 0.9, 846)}H${f(kx + king.tw * 0.9)}L${P(kx + king.tw * 0.6, king.torsoTop)}Z`, { fill: '#6a2aa8' }));
    out.push(king.svg);
    const r = king.r, hy = king.headY;
    out.push(path(`M${P(kx - king.tw * 0.5, king.torsoTop + 2)}h${f(king.tw)}v${f(r * 0.3)}h${f(-king.tw)}z`, { fill: '#ffffff' }), path(circD(kx - 8, king.torsoTop + 6, 2.4) + circD(kx + 8, king.torsoTop + 6, 2.4), { fill: '#1a1a1a' }));
    out.push(path(`M${P(kx - r * 0.95, hy - r * 0.5)}V${f(hy - r * 1.2)}L${P(kx - r * 0.5, hy - r * 0.85)}L${P(kx, hy - r * 1.45)}L${P(kx + r * 0.5, hy - r * 0.85)}L${P(kx + r * 0.95, hy - r * 1.2)}V${f(hy - r * 0.5)}Z`, { fill: url('gold') }), circle(kx, hy - r * 0.68, r * 0.12, { fill: '#e8243a' }));
    out.push(path(`M${P(kx - r * 0.7, hy + r * 0.3)}Q${P(kx, hy + r * 1.4)} ${P(kx + r * 0.7, hy + r * 0.3)}Q${P(kx, hy + r * 0.8)} ${P(kx - r * 0.7, hy + r * 0.3)}Z`, { fill: '#1a1210' }));
    ppl.king = [kx, hy];
    // the bumblebee toddler
    const bx = 950;
    const bee = figure({ x: bx, foot: 856, H: 60, heads: 2.4, skin: SKIN.light, hair: '#e8b84a', style: 'short', top: '#ffd23a', bottom: '#2a2a2a', shoe: '#2a2a2a', gaze: -0.3, mouth: 'open', arms: [{ sx: -1, elbow: [-0.8, -0.4], hand: [-1.2, -1.2] }, { sx: 1, elbow: [0.8, -0.4], hand: [1.2, -1.2] }] });
    out.push(path(`M${P(bx - 4, bee.torsoTop + 6)}c-30 -20 -36 6 -6 14zM${P(bx + 4, bee.torsoTop + 6)}c30 -20 36 6 6 14z`, { fill: '#e8f4ff', opacity: 0.9 }));
    out.push(bee.svg);
    out.push(path(`M${P(bx - bee.tw / 2, bee.torsoTop + bee.r * 0.7)}h${f(bee.tw)}v${f(bee.r * 0.3)}h${f(-bee.tw)}zM${P(bx - bee.tw / 2, bee.torsoTop + bee.r * 1.35)}h${f(bee.tw)}v${f(bee.r * 0.3)}h${f(-bee.tw)}z`, { fill: '#2a2a2a' }));
    out.push(line(`M${P(bx - 6, bee.headY - bee.r)}q-6 -14 -12 -18M${P(bx + 6, bee.headY - bee.r)}q6 -14 12 -18`, '#2a2a2a', 2.4), circle(bx - 18, bee.headY - bee.r - 18, 4, { fill: '#2a2a2a' }), circle(bx + 18, bee.headY - bee.r - 18, 4, { fill: '#2a2a2a' }));
    ppl.bee = [bx, bee.headY];
    // the clown
    const cx = 850;
    const spin = { sx: 1, elbow: [0.9, -0.8], hand: [1.2, -2.0] };
    const clown = figure({ x: cx, foot: 852, H: 86, heads: 2.7, skin: SKIN.fair, hair: '#ff6a2a', style: 'curls', top: '#ffffff', bottom: '#2a6ad8', shoe: '#e8343a', gaze: -0.3, mouth: 'open', arms: [{ sx: -1, elbow: [-0.7, 1.0], hand: [-0.4, 1.9] }, spin] });
    out.push(clown.svg);
    out.push(path(circD(cx - 8, clown.torsoTop + clown.r * 0.9, 4) + circD(cx + 7, clown.torsoTop + clown.r * 1.5, 4) + circD(cx - 6, clown.torsoTop + clown.r * 2.1, 4) + circD(cx + 9, clown.torsoTop + clown.r * 0.7, 3.4), { fill: '#e8343a' }));
    let ruff = '';
    for (let k = 0; k < 7; k++) { const a = Math.PI + (k / 6) * Math.PI; ruff += circD(cx + Math.cos(a) * clown.r * 0.9, clown.torsoTop + 2 - Math.sin(a) * clown.r * 0.2, clown.r * 0.24); }
    out.push(path(ruff, { fill: '#ffd23a' }));
    out.push(circle(cx, clown.headY + clown.r * 0.15, clown.r * 0.2, { fill: '#e8243a' }), path(`M${P(cx - clown.r * 0.5, clown.headY - clown.r * 0.75)}L${P(cx + clown.r * 0.15, clown.headY - clown.r * 2.2)}L${P(cx + clown.r * 0.7, clown.headY - clown.r * 0.6)}Z`, { fill: '#5ab8e8' }), circle(cx + clown.r * 0.15, clown.headY - clown.r * 2.26, clown.r * 0.2, { fill: '#ffd23a' }));
    const ch = clown.hand(spin);
    out.push(grogger(ch[0], ch[1] - 18, -40), circle(ch[0], ch[1], clown.r * 0.36, { fill: SKIN.fair }));
    ppl.grogger = [ch[0] + 10, ch[1] - 24];
    // the lion
    const lx = 730;
    const roar = { sx: 1, elbow: [1.0, -0.6], hand: [1.4, -1.8] };
    const lion = figure({ x: lx, foot: 850, H: 86, heads: 2.7, skin: SKIN.deep, hair: '#1a1210', style: 'short', top: '#e8a030', bottom: '#c8802a', shoe: '#8a5a2a', gaze: -0.2, mouth: 'open', arms: [{ sx: -1, elbow: [-0.9, -0.4], hand: [-1.4, -1.2] }, roar] });
    let mane = '';
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; mane += circD(lx + Math.cos(a) * lion.r * 1.1, lion.headY + Math.sin(a) * lion.r * 1.1, lion.r * 0.42); }
    out.push(path(mane, { fill: '#c8601a' }));
    out.push(lion.svg);
    out.push(circle(lx - lion.r * 0.8, lion.headY - lion.r * 0.95, lion.r * 0.28, { fill: '#e8a030' }), circle(lx + lion.r * 0.8, lion.headY - lion.r * 0.95, lion.r * 0.28, { fill: '#e8a030' }));
    out.push(line(`M${P(lx - lion.r * 0.3, lion.headY + lion.r * 0.3)}l${f(-lion.r * 0.5)} ${f(-lion.r * 0.1)}M${P(lx - lion.r * 0.3, lion.headY + lion.r * 0.42)}l${f(-lion.r * 0.5)} ${f(lion.r * 0.1)}M${P(lx + lion.r * 0.3, lion.headY + lion.r * 0.3)}l${f(lion.r * 0.5)} ${f(-lion.r * 0.1)}M${P(lx + lion.r * 0.3, lion.headY + lion.r * 0.42)}l${f(lion.r * 0.5)} ${f(lion.r * 0.1)}`, '#2a1a14', 1.6));
    out.push(path(`M${P(lx + lion.tw * 0.4, lion.torsoBot - 4)}q30 6 34 -20`, { fill: 'none', stroke: '#e8a030', 'stroke-width': 5, 'stroke-linecap': 'round' }), circle(lx + lion.tw * 0.4 + 34, lion.torsoBot - 26, 6, { fill: '#c8601a' }));
    const lh = lion.hand(roar);
    out.push(grogger(lh[0], lh[1] - 18, -20), circle(lh[0], lh[1], lion.r * 0.36, { fill: SKIN.deep }));
    ppl.lion = [lx, lion.headY];
    // Queen Esther, leading the parade, holding up the scroll
    const qx = 590;
    const scroll = { sx: 1, elbow: [0.9, -0.5], hand: [1.3, -1.6] };
    const q = figure({ x: qx, foot: 852, H: 96, heads: 2.9, skin: SKIN.light, hair: '#3a2214', style: 'side', top: '#5a3ad8', bottom: '#5a3ad8', shoe: '#ffd23a', gaze: 0.3, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.7, 0.9], hand: [-0.6, 1.8] }, scroll] });
    out.push(q.svg);
    out.push(path(`M${P(qx - q.tw * 0.5, q.torsoBot - 8)}L${P(qx - q.tw * 0.95, 852)}H${f(qx + q.tw * 0.95)}L${P(qx + q.tw * 0.5, q.torsoBot - 8)}Z`, { fill: '#6a4ae8' }), path(`M${P(qx - q.tw * 0.9, 846)}H${f(qx + q.tw * 0.9)}`, { fill: 'none', stroke: GOLD, 'stroke-width': 5 }));
    const qr = q.r, qhy = q.headY;
    out.push(path(`M${P(qx - qr * 0.9, qhy - qr * 0.55)}V${f(qhy - qr * 1.15)}L${P(qx - qr * 0.45, qhy - qr * 0.85)}L${P(qx, qhy - qr * 1.4)}L${P(qx + qr * 0.45, qhy - qr * 0.85)}L${P(qx + qr * 0.9, qhy - qr * 1.15)}V${f(qhy - qr * 0.55)}Z`, { fill: url('gold') }), path(circD(qx - qr * 0.45, qhy - qr * 0.68, qr * 0.1) + circD(qx + qr * 0.45, qhy - qr * 0.68, qr * 0.1), { fill: '#e8243a' }), circle(qx, qhy - qr * 0.7, qr * 0.13, { fill: '#2ad8a8' }));
    const sh = q.hand(scroll);
    out.push(path(`M${P(sh[0] - 4, sh[1] - 34)}h24v44h-24z`, { fill: '#fff4dc' }), path(`M${P(sh[0] - 8, sh[1] - 38)}v52M${P(sh[0] + 24, sh[1] - 38)}v52`, { fill: 'none', stroke: '#8a5a3a', 'stroke-width': 7, 'stroke-linecap': 'round' }), line(`M${P(sh[0], sh[1] - 26)}h16M${P(sh[0], sh[1] - 18)}h12M${P(sh[0], sh[1] - 10)}h16`, '#b8a080', 1.6), circle(sh[0], sh[1], q.r * 0.36, { fill: SKIN.light }));
    ppl.queen = [qx, qhy];
    ppl.scroll = [sh[0] + 8, sh[1] - 14];
  }

  // ---- the hamantaschen table on the right
  out.push(C('a table on the right piled with hamantaschen, a jug of juice and a spare grogger'));
  {
    const T = { x0: 1240, x1: 1500, top: 760 };
    out.push(path(`M${T.x0} ${T.top}h${T.x1 - T.x0}v12h-${T.x1 - T.x0}z`, { fill: '#8a5a3a' }), path(`M${T.x0 + 14} ${T.top + 12}v76h12v-76zM${T.x1 - 26} ${T.top + 12}v76h12v-76z`, { fill: '#6a4028' }));
    out.push(path(`M${T.x0 - 4} ${T.top}h${T.x1 - T.x0 + 8}v26h-${T.x1 - T.x0 + 8}z`, { fill: '#ffffff', opacity: 0.95 }), path(`M${T.x0 - 4} ${T.top + 22}h${T.x1 - T.x0 + 8}`, { fill: 'none', stroke: '#5a8ad8', 'stroke-width': 4 }));
    out.push(ellipse(1320, T.top - 4, 58, 10, { fill: '#e8e0f0' }));
    const fills = ['#6a1a4a', '#c8102e', '#ffb800', '#3a1a1a'];
    let k = 0;
    for (const [x, y] of [[1290, -10], [1312, -12], [1334, -10], [1350, -8], [1300, -24], [1324, -26], [1346, -22], [1312, -38], [1334, -38], [1322, -52]]) out.push(tasch(x, T.top + y, 1.1, fills[k++ % 4]));
    out.push(path(`M1400 ${T.top}v-40q0 -8 8 -8h14q8 0 8 8v40z`, { fill: '#ffb03a', opacity: 0.9 }), path(`M1430 ${T.top - 36}q12 2 10 14q-2 8 -10 8`, { fill: 'none', stroke: '#ffb03a', 'stroke-width': 4 }));
    out.push(grogger(1470, T.top - 22, 10));
    ppl.tasch = [1322, T.top - 26];
  }

  return { svg: compactSvg(doc(`Purim · mid. Concept: "the costume parade" on a street on Purim evening. Focal point: the parade crossing the middle (x 540–1110, y 620–860) — Queen Esther in a gold crown holding up the scroll, a lion and a clown spinning groggers, a little bumblebee, dad as a jolly king in a purple cape. On the left a girl hands a gift basket of hamantaschen, an orange and a juice box to the neighbor at his open door; on the right a table piled with hamantaschen, a jug of juice and a spare grogger. Light story: string lights and lit windows against a purple evening. The confetti is the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Purim · front: a bunch of balloons tied to a post bottom left and a gift basket bottom right; the center stays open`, [], [
    C('balloons on a post'),
    path('M40 900V760h10V900Z', { fill: '#5a4a6a' }),
    path('M45 760q-20 -40 -30 -90M45 760q0 -50 10 -110M45 760q20 -40 40 -80', { fill: 'none', stroke: '#ffffff', 'stroke-width': 2, opacity: 0.8 }),
    path(circD(14, 650, 26) + circD(56, 620, 28) + circD(88, 664, 24), { fill: '#ff4d6d' }), circle(56, 620, 28, { fill: '#ffd23a' }), circle(88, 664, 24, { fill: '#5ab8e8' }),
    C('a gift basket'),
    path('M1500 900l10 -60h96l10 60z', { fill: '#c8945a' }), path('M1510 842q48 -60 96 0', { fill: 'none', stroke: '#a86a30', 'stroke-width': 5 }),
    path('M1530 842a12 12 0 1 0 24 0a12 12 0 1 0 -24 0z', { fill: '#ff9a1a' }), path('M1560 842l10 -20l10 20z', { fill: '#e8a850' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'dressup', x: r(ppl.queen[0]), y: r(ppl.queen[1] + 30), r: 50, label: 'Pick a Purim costume' },
      { activity: 'card', x: r(ppl.basket[0]), y: r(ppl.basket[1]), r: 40, label: 'Send a Purim gift card' },
      { activity: 'memory', x: ppl.tasch[0], y: ppl.tasch[1], r: 48, label: 'Match the hamantaschen' },
      { activity: 'color', x: r(ppl.lion[0]), y: r(ppl.lion[1] + 30), r: 46, label: 'Color the costume parade' },
    ],
    findables: [
      { id: 'grogger', label: 'a spinning grogger', x: r(ppl.grogger[0]), y: r(ppl.grogger[1]), r: 22 },
      { id: 'bee', label: 'a little bumblebee', x: r(ppl.bee[0]), y: r(ppl.bee[1]), r: 22 },
      { id: 'scroll', label: 'the scroll of Esther', x: r(ppl.scroll[0]), y: r(ppl.scroll[1]), r: 20 },
      { id: 'crown', label: 'the king\'s crown', x: r(ppl.king[0]), y: r(ppl.king[1] - 30), r: 20 },
      { id: 'orange', label: 'an orange in the gift basket', x: r(ppl.basket[0] + 20), y: r(ppl.basket[1] - 6), r: 14 },
      { id: 'mezuzah', label: 'the mezuzah on the door', x: 240, y: 534, r: 14 },
      { id: 'balloons', label: 'three balloons', x: 56, y: 640, r: 40 },
    ],
  };
}
