// Three Kings Day — "The Kings' parade": the evening of 5 January in a whitewashed town square. A camel in a
// tasselled blanket, led by a page, pulls a golden float carrying the Three Kings (Melchior, Caspar and
// Balthasar), who wave and toss wrapped sweets to the crowd. Children catch them in upside-down umbrellas and on
// dad's shoulders; three shoes and a bundle of hay for the camels wait on a balcony; at the café a family shares
// a rosca de reyes and the little one wearing the paper crown holds up the tiny charm. The guiding star shines
// in the corner. The falling stars and crowns are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { stringLights, line, circD } from '../../kit/scenekit.mjs';

const ID = 'three-kings-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const NIGHT = '#1a1a4a';
const night = (c, k = 0.3) => mix(c, NIGHT, k);
const GOLD = '#ffc83a', LAMP = '#ffd98a';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };

// ---- layout
const STREET = 760;                      // the far kerb of the square
const FLOAT = { x0: 600, x1: 1040, top: 704, base: 796 };
const KINGS = [
  { x: 702, skin: SKIN.fair, hair: '#f2f0ec', beard: '#f6f4f0', robe: '#c8243a', cape: '#7a1a6a', crown: 'gold', name: 'Melchior' },
  { x: 822, skin: SKIN.tan, hair: '#6a3a1a', beard: '#7a4a22', robe: '#1f7a7a', cape: '#2a4aa8', crown: 'tall', name: 'Caspar' },
  { x: 942, skin: SKIN.deep, hair: '#1a1210', beard: '#1a1210', robe: '#6a3ab0', cape: '#e8a020', crown: 'turban', name: 'Balthasar' },
];
const CAMEL = { x: 470, foot: 812 };
const STAR = { x: 1470, y: 126 };

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(6);
  let stars = '';
  for (let i = 0; i < 24; i++) { const left = i % 2 === 0; stars += circD(left ? 20 + R() * 260 : 1320 + R() * 260, 24 + R() * 260, 1 + R() * 1.4); }
  // a hill town of whitewashed houses with terracotta roofs, stacked up the slope; kept below the copy zone
  let walls = '', roofs = '', wins = '';
  const Rh = rng(12);
  for (const [x0, x1, base, hMin, hMax] of [[260, 1340, 640, 40, 70], [300, 1300, 600, 30, 50]]) {
    for (let x = x0; x < x1;) {
      const w = 60 + Rh() * 70, h = hMin + Rh() * (hMax - hMin), top = base - h;
      if (top < 452) { x += w; continue; }
      walls += `M${P(x, base)}V${f(top)}H${f(x + w)}V${f(base)}Z`;
      roofs += `M${P(x - 4, top + 2)}L${P(x + w * 0.5, top - 14)}L${P(x + w + 4, top + 2)}Z`;
      if (Rh() < 0.75) wins += `M${P(x + w * 0.3, top + 14)}h8v12h-8Z`;
      if (Rh() < 0.5) wins += `M${P(x + w * 0.62, top + 16)}h8v12h-8Z`;
      x += w + 2;
    }
  }
  const defs = [
    rad(id('star'), 0.5, 0.5, 0.5, [[0, '#ffffff'], [0.12, '#fff3c4', 0.95], [0.4, '#ffd98a', 0.35], [1, '#ffd98a', 0]]),
    rad(id('winglow'), 0.5, 0.5, 0.5, [[0, LAMP, 0.5], [1, LAMP, 0]]),
    lin(id('hill'), 0, 0, 0, 1, [[0, night('#3a3a6a', 0.2)], [1, night('#2a2a5a', 0.1)]]),
  ];
  const ray = (a, L, w) => { const c = Math.cos(a), s = Math.sin(a); return `M${P(STAR.x - s * w, STAR.y + c * w)}L${P(STAR.x + c * L, STAR.y + s * L)}L${P(STAR.x + s * w, STAR.y - c * w)}Z`; };
  let rays = '';
  for (let k = 0; k < 8; k++) rays += ray((k * Math.PI) / 4 - Math.PI / 2, k % 2 ? 40 : 86, k % 2 ? 4 : 7);
  return compactSvg(doc(`Three Kings Day · back: stars in the corners and the bright guiding star top right with long rays; a hill town of whitewashed houses with terracotta roofs and lit windows, kept low, below the copy zone`, defs, [
    C('a few stars in the corners and the guiding star'),
    path(stars, { fill: '#fff6d8', opacity: 0.8 }),
    circle(STAR.x, STAR.y, 120, { fill: url('star') }),
    path(rays, { fill: '#fff3c4' }),
    circle(STAR.x, STAR.y, 9, { fill: '#ffffff' }),
    C('the hill and its town'),
    path('M-20 700V600Q300 560 700 590T1620 570V700Z', { fill: url('hill') }),
    path(walls, { fill: night('#e8e2f4', 0.5) }),
    path(roofs, { fill: night('#c8643a', 0.45) }),
    path(wins, { fill: LAMP, opacity: 0.9 }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('square'), 0, 0, 0, 1, [[0, '#6a5a7a'], [1, '#4a3a5a']]),
    lin(id('wall'), 0, 0, 0, 1, [[0, '#f0e8f2'], [1, '#d8cce0']]),
    lin(id('gold'), 0, 0, 0, 1, [[0, '#ffe08a'], [1, '#d8941a']]),
    lin(id('float'), 0, 0, 0, 1, [[0, '#8a1a4a'], [1, '#5a0a3a']]),
    rad(id('lamp'), 0.5, 0.5, 0.5, [[0, '#fff3c4', 0.8], [0.35, LAMP, 0.35], [1, LAMP, 0]]),
    rad(id('pool'), 0.5, 0.5, 0.5, [[0, LAMP, 0.45], [1, LAMP, 0]]),
    rad(id('win'), 0.5, 0.6, 0.75, [[0, '#fff3cf'], [0.5, '#ffd98a'], [1, '#f0a84a']]),
    lin(id('camel'), 0, 0, 0, 1, [[0, '#e0b070'], [1, '#c08848']]),
  ];

  // ---- the square: cobbles, a kerb, pools of lamplight
  out.push(C('the square: cobbles, the kerb, pools of warm light'));
  out.push(path(`M-20 ${STREET}H1620V920H-20Z`, { fill: url('square') }));
  {
    const R = rng(3);
    let cob = '';
    for (let row = 0; row < 9; row++) { const y = STREET + 14 + row * 16 + row * row * 0.6, h = 8 + row; for (let x = -10 + (row % 2) * 14; x < 1620; x += 26 + row * 2) cob += `M${P(x + R() * 4, y)}h${f(16 + row * 1.6)}q4 0 4 ${f(h / 2)}t-4 ${f(h / 2)}h${f(-(16 + row * 1.6))}q-4 0 -4 ${f(-h / 2)}t4 ${f(-h / 2)}z`; }
    out.push(path(cob, { fill: '#7a6a8a', opacity: 0.55 }));
  }
  out.push(path(`M-20 ${STREET}H1620v8H-20Z`, { fill: '#8a7a9a' }));
  out.push(ellipse(820, 820, 380, 60, { fill: url('pool') }));

  // ---- the house on the left: whitewashed, a blue door, a balcony with three shoes and hay for the camels
  out.push(C('the house on the left: white walls, a blue door, geraniums, and a balcony where three shoes and a bundle of hay wait for the Kings'));
  out.push(path(`M-20 ${STREET}V180L130 120L300 176V${STREET}Z`, { fill: url('wall') }));
  out.push(path('M-26 184L130 112L306 180', { fill: 'none', stroke: night('#c8643a', 0.15), 'stroke-width': 16, 'stroke-linejoin': 'round' }));
  out.push(path(`M60 ${STREET}V636a40 40 0 0 1 80 0V${STREET}Z`, { fill: '#2a5aa8' }), path(`M54 ${STREET}V636a46 46 0 0 1 92 0V${STREET}`, { fill: 'none', stroke: '#e8c070', 'stroke-width': 6 }));
  out.push(circle(124, 700, 4, { fill: GOLD }));
  // windows with shutters and light
  for (const [x, y] of [[60, 260], [190, 260], [190, 640]]) out.push(path(`M${x} ${y}h60v84h-60z`, { fill: url('win') }), path(`M${x - 18} ${y}h16v84h-16zM${x + 62} ${y}h16v84h-16z`, { fill: '#2a7a6a' }), path(`M${x + 30} ${y}v84M${x} ${y + 40}h60`, { fill: 'none', stroke: '#f4ecf6', 'stroke-width': 4 }));
  // the balcony
  out.push(path('M30 486h232v80h-232z', { fill: url('win') }), path('M30 486h232v80h-232z', { fill: 'none', stroke: '#f4ecf6', 'stroke-width': 6 }));
  out.push(path('M146 486v80', { fill: 'none', stroke: '#f4ecf6', 'stroke-width': 5 }));
  out.push(path('M16 566h260v10h-260z', { fill: '#5a4a6a' }));
  {
    let rail = 'M16 520h260';
    for (let x = 24; x <= 268; x += 14) rail += `M${x} 520v46`;
    // three children's shoes on the balcony floor, and a bundle of hay
    const shoe = (x, col) => path(`M${x} 566v-18q0-6 6-6h10q6 0 6 6v6h10q8 0 8 8v4z`, { fill: col }) + path(`M${x + 2} 548h18`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 2, opacity: 0.6 });
    out.push(shoe(44, '#e8343a'), shoe(84, '#2a8ad8'), shoe(124, '#ffb800'));
    out.push(path('M180 566q8-34 34-30q22-8 34 6q8 10 2 24z', { fill: '#e8c050' }), line('M188 560l-6 -20M200 558l0 -24M214 556l6 -22M228 558l10 -18M240 560l12 -12', '#c89a30', 2.4), path('M196 554q30 8 52 0', { fill: 'none', stroke: '#8a4a2a', 'stroke-width': 3 }));
    out.push(line(rail, '#2a2a3a', 4));
    ppl.shoes = [104, 548];
    ppl.hay = [222, 548];
    // a cat on the balcony rail
    out.push(G({ transform: 'translate(250 520)' }, path('M-12 0c-2-14 4-22 12-22c8 0 12 8 12 22z', { fill: '#e8a050' }), circle(0, -26, 8, { fill: '#e8a050' }), path('M-6 -32l-1 -7l5 4zM6 -32l1 -7l-5 4z', { fill: '#e8a050' }), path('M12 -2q14 4 12 18', { fill: 'none', stroke: '#e8a050', 'stroke-width': 4, 'stroke-linecap': 'round' }), circle(-3, -27, 1.4, { fill: '#2a2a1a' }), circle(3, -27, 1.4, { fill: '#2a2a1a' })));
    ppl.cat = [250, 498];
  }
  // geraniums in pots by the door
  out.push(path(`M166 ${STREET}l4 -30h28l4 30zM12 ${STREET}l4 -30h28l4 30z`, { fill: '#c8643a' }), path(circD(176, 724, 9) + circD(192, 718, 10) + circD(184, 708, 8) + circD(22, 724, 9) + circD(38, 718, 10) + circD(30, 708, 8), { fill: '#2a8a4a' }), path(circD(178, 712, 5) + circD(192, 706, 6) + circD(24, 712, 5) + circD(38, 706, 6), { fill: '#ff3a5a' }));

  // ---- the café on the right: a striped awning, a table with the rosca de reyes
  out.push(C('the café on the right: a striped awning, lit windows, a table with the rosca de reyes and hot chocolate'));
  out.push(path(`M1300 ${STREET}V200L1460 150L1620 196V${STREET}Z`, { fill: url('wall') }));
  out.push(path('M1294 204L1460 142L1626 200', { fill: 'none', stroke: night('#c8643a', 0.15), 'stroke-width': 16, 'stroke-linejoin': 'round' }));
  for (const [x, y] of [[1350, 280], [1500, 280]]) out.push(path(`M${x} ${y}h64v88h-64z`, { fill: url('win') }), path(`M${x - 18} ${y}h16v88h-16zM${x + 66} ${y}h16v88h-16z`, { fill: '#a83a3a' }), path(`M${x + 32} ${y}v88M${x} ${y + 40}h64`, { fill: 'none', stroke: '#f4ecf6', 'stroke-width': 4 }));
  out.push(path(`M1330 ${STREET}V560h260V${STREET}Z`, { fill: url('win') }), path(`M1330 ${STREET}V560h260V${STREET}M1460 560V${STREET}M1330 640h260`, { fill: 'none', stroke: '#5a3a3a', 'stroke-width': 6 }));
  {
    let aw = '', awR = '';
    for (let i = 0; i < 10; i++) { const x = 1306 + i * 31; (i % 2 ? aw += '' : null); const d = `M${x} 500h31v40q-15.5 14 -31 0z`; if (i % 2) awR += d; else aw += d; }
    out.push(path(aw, { fill: '#ffffff' }), path(awR, { fill: '#d62838' }), path('M1300 494h320v10h-320z', { fill: '#a81c2a' }));
  }
  // the table, the rosca de reyes, hot chocolate
  const T = { x: 1290, y: 800 };
  out.push(path(`M${T.x - 70} ${T.y}h140v10h-140zM${T.x - 6} ${T.y + 10}h12v54h-12zM${T.x - 34} ${T.y + 62}h68v6h-68z`, { fill: '#5a3a2a' }));
  out.push(ellipse(T.x, T.y - 8, 56, 16, { fill: '#c87a3a' }), ellipse(T.x, T.y - 12, 54, 13, { fill: '#e8a050' }), ellipse(T.x, T.y - 12, 26, 6, { fill: '#5a3a2a' }));
  out.push(path(circD(T.x - 36, T.y - 16, 4) + circD(T.x - 14, T.y - 22, 3.6) + circD(T.x + 18, T.y - 22, 4) + circD(T.x + 40, T.y - 14, 3.6) + circD(T.x - 4, T.y - 4, 3.6), { fill: '#e8243a' }), path(circD(T.x - 26, T.y - 20, 3.4) + circD(T.x + 6, T.y - 24, 3) + circD(T.x + 30, T.y - 20, 3.4) + circD(T.x - 40, T.y - 8, 3), { fill: '#2a9a4a' }), path(`M${T.x - 46} ${T.y - 12}q46 -18 92 0`, { fill: 'none', stroke: '#fff4dc', 'stroke-width': 3, 'stroke-dasharray': '6 5' }));
  out.push(path(`M${T.x + 52} ${T.y - 24}h18v18q0 4 -4 4h-10q-4 0 -4 -4z`, { fill: '#ffffff' }), path(`M${T.x + 52} ${T.y - 22}h18v4h-18z`, { fill: '#6a3a1a' }), line(`M${T.x + 58} ${T.y - 30}c-4 -6 4 -10 0 -16`, '#ffffff', 2, { opacity: 0.7 }));
  ppl.rosca = [T.x, T.y - 14];
  // grandma and the little one in the paper crown, holding up the charm
  {
    const gx = 1386, gf = 850;
    const gr = figure({ x: gx, foot: gf, H: 104, heads: 3.2, skin: SKIN.brown, hair: '#e6e2ee', style: 'elder', top: '#2a7a6a', bottom: '#3a2a4a', gaze: -0.4, mouth: 'open',
      arms: [{ sx: -1, elbow: [-0.9, 0.6], hand: [-1.8, 0.4] }, { sx: 1, elbow: [0.6, 1.2], hand: [0.3, 2.1] }] });
    out.push(gr.svg);
    const kx = 1200, kf = 852;
    const charm = { sx: 1, elbow: [0.8, -0.8], hand: [1.1, -2.0] };
    const k = figure({ x: kx, foot: kf, H: 70, heads: 2.6, skin: SKIN.tan, hair: '#2a1a14', style: 'curls', top: '#ffb800', bottom: '#2a3a6a', shoe: '#e8343a', gaze: 0.3, mouth: 'open',
      arms: [{ sx: -1, elbow: [-0.7, 1.0], hand: [-0.4, 1.9] }, charm] });
    out.push(k.svg);
    const r = k.r, hy = k.headY;
    out.push(path(`M${P(kx - r * 0.98, hy - r * 0.42)}L${P(kx - r * 0.98, hy - r * 1.22)}L${P(kx - r * 0.65, hy - r * 0.86)}L${P(kx - r * 0.33, hy - r * 1.32)}L${P(kx, hy - r * 0.86)}L${P(kx + r * 0.33, hy - r * 1.32)}L${P(kx + r * 0.65, hy - r * 0.86)}L${P(kx + r * 0.98, hy - r * 1.22)}L${P(kx + r * 0.98, hy - r * 0.42)}Q${P(kx, hy - r * 0.62)} ${P(kx - r * 0.98, hy - r * 0.42)}Z`, { fill: GOLD }));
    const ch = k.hand(charm);
    out.push(circle(ch[0], ch[1] - 12, 6, { fill: '#fff4e0' }), path(`M${P(ch[0] - 5, ch[1] - 8)}h10v10h-10z`, { fill: '#fff4e0' }), circle(ch[0], ch[1], r * 0.36, { fill: SKIN.tan }));
    out.push(path(`M${P(ch[0] - 12, ch[1] - 26)}l-6 -6M${P(ch[0], ch[1] - 30)}v-8M${P(ch[0] + 12, ch[1] - 26)}l6 -6`, { fill: 'none', stroke: '#ffe9a3', 'stroke-width': 2.6, 'stroke-linecap': 'round' }));
    ppl.charm = [ch[0], ch[1] - 12];
  }

  // ---- string lights across the square
  out.push(C('string lights across the square'));
  out.push(stringLights(300, 470, 1300, 476, 50, 22, ['#ffd166', '#ff6a7a', '#7ad0ff', '#9be08a'], { wire: '#2a2a3a', r: 5 }));

  // ---- the street lamp
  out.push(C('a street lamp'));
  out.push(path(`M1124 ${STREET + 40}V560h8V${STREET + 40}Z`, { fill: '#2a2a3a' }), path('M1112 560h32l-6 -36h-20z', { fill: '#fff3c4' }), path('M1108 526h40l-6 -10h-28z', { fill: '#2a2a3a' }), circle(1128, 544, 70, { fill: url('lamp') }));

  // ---- the camel and the page who leads it
  out.push(C('the camel in a red tasselled blanket with a gift chest, led by a page; golden traces to the float'));
  {
    const { x, foot } = CAMEL, s = 1.1;
    const g = [];
    g.push(ellipse(0, 2, 84, 8, { fill: '#000', opacity: 0.25 }));
    const leg = (lx, back) => path(`M${lx - 8} -96C${lx - 8} -70 ${lx - 6} -56 ${lx - 7} -48q-3 6 0 12L${lx - 6} -6h12L${lx + 5} -36q3 -6 0 -12C${lx + 6} -58 ${lx + 8} -72 ${lx + 8} -96Z`, { fill: back ? '#b07838' : url('camel') }) + path(`M${lx - 10} 0q0 -8 10 -8t10 8z`, { fill: '#6a4a2a' });
    g.push(leg(-38, true), leg(42, true));
    g.push(path('M-70 -110C-74 -132 -50 -146 -30 -148C-14 -186 24 -188 36 -150C60 -150 80 -132 76 -106C72 -84 40 -80 0 -80C-40 -80 -66 -88 -70 -110Z', { fill: url('camel') }));
    g.push(path('M58 -128q22 8 20 34q-6 -12 -18 -18z', { fill: '#b07838' }));
    g.push(leg(-50, false), leg(30, false));
    // the neck and head, reaching forward (left)
    g.push(path('M-56 -128C-80 -132 -100 -150 -106 -176C-110 -194 -120 -204 -136 -204C-150 -204 -160 -196 -162 -186C-164 -176 -156 -170 -146 -170C-134 -170 -128 -168 -124 -156C-118 -128 -100 -100 -64 -94Z', { fill: url('camel') }));
    g.push(path('M-160 -188q-8 6 -6 14q6 4 14 2', { fill: '#c08848' }), path('M-163 -180q6 2 10 0', { fill: 'none', stroke: '#6a4a2a', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    g.push(path('M-130 -204l4 -10l6 8z', { fill: '#c08848' }));
    g.push(ellipse(-142, -192, 3.4, 4, { fill: '#2b1a1a' }), path('M-148 -197q5 -5 11 -2', { fill: 'none', stroke: '#2b1a1a', 'stroke-width': 1.8, 'stroke-linecap': 'round' }), path('M-147 -198l-2 -4M-143 -199l-1 -4M-139 -198l1 -4', { fill: 'none', stroke: '#2b1a1a', 'stroke-width': 1.4, 'stroke-linecap': 'round' }));
    // the bridle, the blanket with tassels, the chest
    g.push(path('M-150 -186q14 4 22 -12M-128 -176l60 30', { fill: 'none', stroke: '#e8243a', 'stroke-width': 3.4, 'stroke-linecap': 'round' }));
    g.push(path('M-46 -150C-30 -170 30 -172 50 -148L58 -104Q8 -92 -42 -104Z', { fill: '#c8102e' }), path('M-42 -104Q8 -92 58 -104', { fill: 'none', stroke: GOLD, 'stroke-width': 5 }));
    { let t = ''; for (let i = 0; i < 8; i++) { const tx = -38 + i * 13, ty = -100 + Math.abs(i - 3.5) * 1.6; t += `M${tx - 3} ${ty}h6l-1 12h-4z`; } g.push(path(t, { fill: GOLD })); }
    g.push(path('M-20 -168h44v-26h-44z', { fill: '#7a3a1a' }), path('M-24 -194h52v-10q-26 -12 -52 0z', { fill: '#9a4a22' }), path('M-20 -186h44M2 -194v26', { fill: 'none', stroke: GOLD, 'stroke-width': 4 }), circle(2, -180, 4, { fill: GOLD }));
    out.push(G({ transform: `translate(${x} ${foot}) scale(${s})` }, ...g));
    ppl.camel = [x - 150 * s, foot - 190 * s];
    // golden traces from the blanket back to the float
    out.push(line(`M${x + 60} ${foot - 118}Q${(x + FLOAT.x0) / 2 + 30} ${foot - 90} ${FLOAT.x0 + 4} ${FLOAT.top + 24}`, GOLD, 4));
    // the page, leading the camel by the bridle rope
    const lead = { sx: 1, elbow: [0.9, 0.4], hand: [1.6, -0.3] };
    const pg = figure({ x: 268, foot: 820, H: 92, heads: 2.9, skin: SKIN.light, hair: '#c8642a', style: 'short', top: '#2a6ad8', bottom: '#f4ecd8', shoe: '#2a1a3a', gaze: 0.4, mouth: 'smile',
      arms: [{ sx: -1, elbow: [-0.6, 1.1], hand: [-0.4, 2.0] }, lead] });
    out.push(pg.svg);
    out.push(path(`M${P(268 - pg.r * 1.05, pg.headY - pg.r * 0.3)}C${P(268 - pg.r, pg.headY - pg.r * 1.3)} ${P(268 + pg.r, pg.headY - pg.r * 1.3)} ${P(268 + pg.r * 1.05, pg.headY - pg.r * 0.3)}Z`, { fill: '#e8243a' }), path(`M${P(268 + pg.r * 0.6, pg.headY - pg.r * 1.0)}q14 -16 22 -8q-10 2 -16 12z`, { fill: '#ffffff' }));
    const lh = pg.hand(lead);
    out.push(line(`M${P(...lh)}Q${P((lh[0] + x - 140 * s) / 2, lh[1] + 30)} ${P(x - 140 * s, foot - 176 * s)}`, '#e8243a', 2.6));
    ppl.page = [268, pg.headY];
  }

  // ---- the float with the Three Kings
  out.push(C('the golden float: big spoked wheels, a star on a pole at the front; the Three Kings stand in it, waving and tossing sweets'));
  const throwArm = (s) => ({ sx: s, elbow: [s * 1.0, -0.7], hand: [s * 1.5, -2.0] });
  const waveArm = (s) => ({ sx: s, elbow: [s * 1.1, -0.2], hand: [s * 1.9, -1.0] });
  const hands = [];
  for (const [i, k] of KINGS.entries()) {
    const arms = i === 1 ? [waveArm(-1), throwArm(1)] : i === 0 ? [throwArm(-1), { sx: 1, elbow: [0.8, 1.0], hand: [0.6, 1.8] }] : [{ sx: -1, elbow: [-0.8, 1.0], hand: [-0.6, 1.8] }, throwArm(1)];
    const kf = figure({ x: k.x, foot: FLOAT.top + 40, H: 132, heads: 3.4, skin: k.skin, hair: k.hair, style: 'short', top: k.robe, bottom: k.robe, gaze: i === 0 ? -0.4 : i === 2 ? 0.4 : -0.1, mouth: 'smile', arms });
    // the cape behind the shoulders
    out.push(path(`M${P(k.x - kf.tw * 0.62, kf.torsoTop + 4)}C${P(k.x - kf.tw * 0.9, kf.torsoTop + 40)} ${P(k.x - kf.tw * 0.9, FLOAT.top)} ${P(k.x - kf.tw * 0.86, FLOAT.top + 10)}H${f(k.x + kf.tw * 0.86)}C${P(k.x + kf.tw * 0.9, FLOAT.top)} ${P(k.x + kf.tw * 0.9, kf.torsoTop + 40)} ${P(k.x + kf.tw * 0.62, kf.torsoTop + 4)}Z`, { fill: k.cape }));
    out.push(kf.svg);
    const r = kf.r, hy = kf.headY;
    // a gold-trimmed robe front and a collar
    out.push(path(`M${P(k.x - 3, kf.torsoTop + 6)}V${FLOAT.top + 10}h6V${kf.torsoTop + 6}z`, { fill: GOLD }));
    out.push(path(`M${P(k.x - kf.tw * 0.5, kf.torsoTop + 2)}q${f(kf.tw * 0.5)} ${f(r * 0.5)} ${f(kf.tw)} 0v${f(r * 0.24)}q${f(-kf.tw * 0.5)} ${f(r * 0.5)} ${f(-kf.tw)} 0z`, { fill: GOLD }));
    // the beard, under the smile
    const bl = i === 0 ? 1.9 : 1.2;
    out.push(path(`M${P(k.x - r * 0.9, hy + r * 0.05)}C${P(k.x - r * 0.95, hy + r * 0.9)} ${P(k.x - r * 0.4, hy + r * bl)} ${P(k.x, hy + r * (bl + 0.1))}C${P(k.x + r * 0.4, hy + r * bl)} ${P(k.x + r * 0.95, hy + r * 0.9)} ${P(k.x + r * 0.9, hy + r * 0.05)}C${P(k.x + r * 0.7, hy + r * 0.5)} ${P(k.x + r * 0.4, hy + r * 0.72)} ${P(k.x, hy + r * 0.72)}C${P(k.x - r * 0.4, hy + r * 0.72)} ${P(k.x - r * 0.7, hy + r * 0.5)} ${P(k.x - r * 0.9, hy + r * 0.05)}Z`, { fill: k.beard }));
    out.push(path(`M${P(k.x - r * 0.42, hy + r * 0.36)}q${f(r * 0.22)} ${f(-r * 0.16)} ${f(r * 0.42)} ${f(-r * 0.02)}q${f(r * 0.2)} ${f(-r * 0.14)} ${f(r * 0.42)} ${f(r * 0.02)}q${f(-r * 0.2)} ${f(r * 0.14)} ${f(-r * 0.42)} ${f(r * 0.06)}q${f(-r * 0.2)} ${f(r * 0.08)} ${f(-r * 0.42)} ${f(-r * 0.06)}z`, { fill: k.beard }));
    // crowns
    if (k.crown === 'gold') {
      out.push(path(`M${P(k.x - r * 0.95, hy - r * 0.5)}V${f(hy - r * 1.1)}L${P(k.x - r * 0.6, hy - r * 0.8)}L${P(k.x - r * 0.3, hy - r * 1.5)}L${P(k.x, hy - r * 0.9)}L${P(k.x + r * 0.3, hy - r * 1.5)}L${P(k.x + r * 0.6, hy - r * 0.8)}L${P(k.x + r * 0.95, hy - r * 1.1)}V${f(hy - r * 0.5)}Z`, { fill: url('gold') }));
      out.push(path(circD(k.x - r * 0.5, hy - r * 0.64, r * 0.1) + circD(k.x + r * 0.5, hy - r * 0.64, r * 0.1), { fill: '#2a8ad8' }), circle(k.x, hy - r * 0.64, r * 0.13, { fill: '#e8243a' }));
    } else if (k.crown === 'tall') {
      out.push(path(`M${P(k.x - r * 0.9, hy - r * 0.5)}L${P(k.x - r * 0.9, hy - r * 1.3)}L${P(k.x - r * 0.45, hy - r * 0.95)}L${P(k.x, hy - r * 2.0)}L${P(k.x + r * 0.45, hy - r * 0.95)}L${P(k.x + r * 0.9, hy - r * 1.3)}L${P(k.x + r * 0.9, hy - r * 0.5)}Z`, { fill: url('gold') }));
      out.push(circle(k.x, hy - r * 1.3, r * 0.14, { fill: '#2ad8a8' }), circle(k.x, hy - r * 2.04, r * 0.12, { fill: '#ffffff' }));
    } else {
      out.push(path(`M${P(k.x - r * 1.1, hy - r * 0.3)}C${P(k.x - r * 1.3, hy - r * 1.6)} ${P(k.x + r * 1.3, hy - r * 1.6)} ${P(k.x + r * 1.1, hy - r * 0.3)}Q${P(k.x, hy - r * 0.7)} ${P(k.x - r * 1.1, hy - r * 0.3)}Z`, { fill: '#fff4e0' }));
      out.push(path(`M${P(k.x - r * 1.0, hy - r * 0.7)}q${f(r)} ${f(-r * 0.5)} ${f(r * 2)} ${f(-r * 0.2)}M${P(k.x - r * 0.9, hy - r * 1.0)}q${f(r)} ${f(-r * 0.4)} ${f(r * 1.8)} ${f(-r * 0.1)}`, { fill: 'none', stroke: '#e8d0b0', 'stroke-width': 2.4 }));
      out.push(path(`M${P(k.x - r * 1.12, hy - r * 0.42)}Q${P(k.x, hy - r * 0.86)} ${P(k.x + r * 1.12, hy - r * 0.42)}v${f(-r * 0.2)}Q${P(k.x, hy - r * 1.06)} ${P(k.x - r * 1.12, hy - r * 0.62)}z`, { fill: url('gold') }));
      out.push(circle(k.x, hy - r * 0.92, r * 0.18, { fill: '#e8243a' }), path(`M${P(k.x, hy - r * 1.06)}q${f(r * 0.3)} ${f(-r * 0.8)} ${f(r * 0.9)} ${f(-r * 1.0)}q${f(-r * 0.3)} ${f(r * 0.5)} ${f(-r * 0.9)} ${f(r * 1.0)}z`, { fill: '#ffffff' }));
    }
    const hand = arms.find((a) => a.hand[1] < -1.5);
    if (hand) hands.push(kf.hand(hand));
    ppl[`king${i}`] = [k.x, hy];
  }
  // the float's body in front of the Kings' legs
  {
    const { x0, x1, top, base } = FLOAT;
    out.push(path(`M${x0} ${top + 4}Q${x0 - 20} ${top - 30} ${x0 + 6} ${top - 40}Q${x0 + 10} ${top - 20} ${x0 + 30} ${top}H${x1 - 30}Q${x1 - 10} ${top - 20} ${x1 - 6} ${top - 40}Q${x1 + 20} ${top - 30} ${x1} ${top + 4}V${base}H${x0}Z`, { fill: url('float') }));
    out.push(path(`M${x0} ${top}H${x1}v12H${x0}Z`, { fill: url('gold') }), path(`M${x0} ${base - 12}H${x1}v12H${x0}Z`, { fill: url('gold') }));
    let stars = '';
    for (let x = x0 + 40; x < x1 - 20; x += 56) { const cy = (top + base) / 2 + 2; let d = ''; for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5 - Math.PI / 2, rr = k % 2 ? 7 : 16; d += `${k ? 'L' : 'M'}${P(x + Math.cos(a) * rr, cy + Math.sin(a) * rr)}`; } stars += d + 'Z'; }
    out.push(path(stars, { fill: GOLD }));
    // the wheels
    const wheel = (cx) => { const cy = base + 6, rr = 42; let spokes = ''; for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; spokes += `M${P(cx, cy)}L${P(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)}`; } return circle(cx, cy, rr, { fill: 'none', stroke: url('gold'), 'stroke-width': 9 }) + line(spokes, '#d8941a', 4) + circle(cx, cy, 9, { fill: GOLD }); };
    out.push(ellipse((x0 + x1) / 2, base + 50, 260, 10, { fill: '#000', opacity: 0.25 }));
    out.push(wheel(x0 + 70), wheel(x1 - 70));
    // the star on a pole at the front
    out.push(line(`M${x0 + 10} ${top - 30}V${top - 168}`, '#d8941a', 5));
    { let d = ''; for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5 - Math.PI / 2, rr = k % 2 ? 12 : 28; d += `${k ? 'L' : 'M'}${P(x0 + 10 + Math.cos(a) * rr, top - 186 + Math.sin(a) * rr)}`; } out.push(circle(x0 + 10, top - 186, 54, { fill: url('lamp') }), path(d + 'Z', { fill: '#fff3c4' })); }
    ppl.star = [x0 + 10, top - 186];
  }

  // ---- the children catching sweets
  out.push(C('children catching sweets: a boy with an upside-down umbrella, a girl on her dad\'s shoulders reaching up'));
  {
    // the boy with the upturned umbrella
    const bx = 392, bf = 868;
    const hold = { sx: 1, elbow: [1.2, 0.0], hand: [2.0, -1.2] }, hold2 = { sx: -1, elbow: [-0.9, 0.6], hand: [-0.6, 1.6] };
    const b = figure({ x: bx, foot: bf, H: 76, heads: 2.6, skin: SKIN.brown, hair: '#1a1210', style: 'short', top: '#e8343a', bottom: '#2a3a6a', shoe: '#ffb800', gaze: 0.4, mouth: 'open', arms: [hold2, hold] });
    out.push(b.svg);
    const uh = b.hand(hold);
    const ux = uh[0] + 34, uy = uh[1] - 46;                // held out to the side, above the crowd
    let rim = `M${P(ux - 54, uy)}`;
    for (let i = 0; i < 6; i++) rim += `q9 -8 18 0`;
    out.push(path(`M${P(ux - 54, uy)}Q${P(ux - 30, uy + 46)} ${P(ux, uy + 50)}Q${P(ux + 30, uy + 46)} ${P(ux + 54, uy)}Z`, { fill: '#2a8ad8' }), path(`M${P(ux, uy + 50)}L${P(ux - 30, uy + 4)}M${P(ux, uy + 50)}L${P(ux + 30, uy + 4)}M${P(ux, uy + 50)}V${f(uy)}`, { fill: 'none', stroke: '#1a6ab8', 'stroke-width': 2.4 }));
    out.push(path(rim + `Q${P(ux + 30, uy + 10)} ${P(ux, uy + 10)}Q${P(ux - 30, uy + 10)} ${P(ux - 54, uy)}Z`, { fill: '#5ab0f0' }));
    out.push(line(`M${P(ux, uy + 50)}L${P(uh[0], uh[1])}`, '#3a3a4a', 3));
    out.push(circle(uh[0], uh[1], b.r * 0.36, { fill: SKIN.brown }), circle(b.hand(hold2)[0], b.hand(hold2)[1], b.r * 0.36, { fill: SKIN.brown }));
    ppl.umbrella = [ux, uy];
    // the girl on dad's shoulders
    const dx = 548, df = 872;
    const dad = figure({ x: dx, foot: df, H: 116, heads: 3.2, skin: SKIN.fair, hair: '#3a2a1a', style: 'short', top: '#3a5a3a', bottom: '#2a2a3a', gaze: 0.3, arms: [{ sx: -1, elbow: [-0.9, 0.2], hand: [-1.3, -1.6] }, { sx: 1, elbow: [0.9, 0.2], hand: [1.3, -1.6] }] });
    out.push(dad.svg);
    const g = figure({ x: dx - 62, foot: 868, H: 72, heads: 2.6, skin: SKIN.fair, hair: '#e8b84a', style: 'bob', top: '#ff8fb8', bottom: '#2a3a6a', shoe: '#ffffff', gaze: 0.4, mouth: 'open', arms: [throwArm(-1), throwArm(1)] });
    out.push(g.svg);
    ppl.girl = [dx - 62, g.headY];
    // flying sweets: arcs from the Kings' hands down to the children
    const candy = (x, y, a, col) => G({ transform: `translate(${P(x, y)}) rotate(${f(a)})` }, path('M-6 0a6 5 0 1 0 12 0a6 5 0 1 0 -12 0zM-6 0l-7 -5v10zM6 0l7 -5v10z', { fill: col }), path('M-3 -2h6', { fill: 'none', stroke: '#ffffff', 'stroke-width': 1.6, opacity: 0.8 }));
    const cols = ['#ff4d6d', '#ffd166', '#4ab8e8', '#8ad870', '#c88aff'];
    const Rc = rng(8);
    const targets = [[ux, uy - 20], [dx - 62, g.headY - 50], [1210, 700], [ux - 20, uy - 90]];
    let arcs = '';
    for (const [i, h] of hands.entries()) {
      const t = targets[i % targets.length];
      const mx = (h[0] + t[0]) / 2, my = Math.min(h[1], t[1]) - 120;
      arcs += `M${P(...h)}Q${P(mx, my)} ${P(...t)}`;
      for (let k = 1; k < 5; k++) { const s = k / 5, x = (1 - s) * (1 - s) * h[0] + 2 * (1 - s) * s * mx + s * s * t[0], y = (1 - s) * (1 - s) * h[1] + 2 * (1 - s) * s * my + s * s * t[1]; out.push(candy(x, y, Rc() * 180, cols[(i + k) % 5])); }
    }
    out.push(line(arcs, '#ffffff', 1.6, { opacity: 0.35, 'stroke-dasharray': '3 8' }));
    out.push(candy(ux - 16, uy + 2, 20, '#ffd166'), candy(ux + 10, uy + 4, -30, '#ff4d6d'), candy(ux + 26, uy, 60, '#8ad870'));
  }

  return { svg: compactSvg(doc(`Three Kings Day · mid. Concept: "the Kings' parade" on the evening of 5 January in a whitewashed town square. Focal point: the golden float with the Three Kings (Melchior with a long white beard and a jewelled crown, Caspar with a tall crown, Balthasar with a turban crown and a white feather) waving and tossing wrapped sweets (x 590–1060, y 520–860), pulled by a camel in a red tasselled blanket led by a page. Children catch the sweets in an upside-down umbrella and from dad's shoulders; three shoes and hay for the camels wait on a balcony with a cat; at the café the little one in the paper crown holds up the charm from the rosca de reyes while grandma laughs. The guiding star shines top right. Light story: warm lamplight, the float's star and lit windows against an indigo night. The falling stars and crowns are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Three Kings Day · front: a geranium pot and a lantern in the bottom corners; the center stays open`, [], [
    C('a big pot of geraniums, bottom left'),
    path('M-10 900l8 -70h96l8 70z', { fill: '#b8582e' }), path('M-6 834h104v-10h-104z', { fill: '#d8743e' }),
    path(circD(10, 812, 22) + circD(46, 800, 26) + circD(82, 814, 22) + circD(30, 780, 18) + circD(66, 782, 18), { fill: '#2a7a4a' }),
    path(circD(14, 800, 9) + circD(50, 784, 10) + circD(84, 800, 9) + circD(34, 770, 8) + circD(66, 768, 8), { fill: '#ff3a5a' }),
    C('a lantern on a post, bottom right'),
    path('M1560 900V820h10V900Z', { fill: '#2a2a3a' }), path('M1546 820h38l-6 -40h-26z', { fill: '#fff3c4' }), path('M1542 782h46l-8 -12h-30z', { fill: '#2a2a3a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'dressup', x: r(ppl.king1[0]), y: r(ppl.king1[1] + 20), r: 56, label: 'Dress up as one of the Kings' },
      { activity: 'catch', x: r(ppl.umbrella[0]), y: r(ppl.umbrella[1] + 10), r: 44, label: 'Catch the sweets in the umbrella' },
      { activity: 'color', x: r(ppl.camel[0] + 80), y: r(ppl.camel[1] + 90), r: 56, label: 'Color in the camel' },
      { activity: 'card', x: ppl.shoes[0], y: ppl.shoes[1], r: 40, label: 'Leave a note in the shoes' },
      { activity: 'wish', x: 1470, y: 126, r: 56, label: 'Make a wish on the star' },
    ],
    findables: [
      { id: 'hay', label: 'hay for the camels', x: ppl.hay[0], y: ppl.hay[1], r: 22 },
      { id: 'cat', label: 'a cat on the balcony', x: ppl.cat[0], y: ppl.cat[1], r: 18 },
      { id: 'charm', label: 'the tiny charm from the rosca', x: r(ppl.charm[0]), y: r(ppl.charm[1]), r: 16 },
      { id: 'rosca', label: 'the rosca de reyes', x: ppl.rosca[0], y: ppl.rosca[1], r: 26 },
      { id: 'float-star', label: 'the star on the float', x: ppl.star[0], y: ppl.star[1], r: 24 },
      { id: 'feather', label: 'a white feather in a crown', x: r(ppl.king2[0] + 14), y: r(ppl.king2[1] - 40), r: 18 },
      { id: 'page', label: 'the page leading the camel', x: r(ppl.page[0]), y: r(ppl.page[1]), r: 22 },
    ],
  };
}
