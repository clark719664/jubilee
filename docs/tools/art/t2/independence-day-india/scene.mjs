// Independence Day (India) — "Kites over the rooftops": a bright 15 August morning on a city rooftop. The family
// flag flies from a pole on the parapet; a boy in a white kurta flies a saffron kite high on the right while his
// sister holds the big wooden spool (charkhi) and laughs; grandpa salutes the flag; mum brings a plate of orange
// jalebis and laddoos. Neighbours fly kites from the next rooftops, washing flaps on a line, a pigeon sits on the
// water tank, and a marigold garland hangs on the door. The fireworks and floating kites are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { line, circD } from '../../kit/scenekit.mjs';

const ID = 'independence-day-india';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SAFFRON = '#ff9933', GREEN = '#138808', NAVY = '#000080', WHITE = '#ffffff';
const SKIN = { fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const ROOF = 740;

/** The Indian flag: saffron, white and green bands with the navy Ashoka Chakra; top-left at (x, y), w wide. */
export function indiaFlag(x, y, w) {
  const h = w * 2 / 3, b = h / 3, cx = x + w / 2, cy = y + h / 2, r = b * 0.42;
  let spokes = '';
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; spokes += `M${P(cx, cy)}L${P(cx + Math.cos(a) * r, cy + Math.sin(a) * r)}`; }
  return [
    path(`M${P(x, y)}h${f(w)}v${f(b)}h${f(-w)}z`, { fill: SAFFRON }),
    path(`M${P(x, y + b)}h${f(w)}v${f(b)}h${f(-w)}z`, { fill: WHITE }),
    path(`M${P(x, y + 2 * b)}h${f(w)}v${f(b)}h${f(-w)}z`, { fill: GREEN }),
    circle(cx, cy, r, { fill: 'none', stroke: NAVY, 'stroke-width': f(Math.max(1, r * 0.14)) }),
    path(spokes, { fill: 'none', stroke: NAVY, 'stroke-width': f(Math.max(0.6, r * 0.06)) }),
  ].join('');
}

/** A diamond patang kite at (x, y), size s, tilted a, colours c1/c2. */
const kite = (x, y, s, a, c1, c2) => G({ transform: `translate(${f(x)} ${f(y)}) rotate(${f(a)})` },
  path(`M0 ${f(-s)}L${f(s * 0.8)} 0L0 ${f(s)}L${f(-s * 0.8)} 0Z`, { fill: c1 }),
  path(`M0 ${f(-s)}L${f(s * 0.8)} 0L0 0Z`, { fill: c2 }),
  path(`M0 ${f(-s)}V${f(s)}M${f(-s * 0.8)} 0Q0 ${f(-s * 0.5)} ${f(s * 0.8)} 0`, { fill: 'none', stroke: '#5a3a1a', 'stroke-width': f(Math.max(1, s * 0.05)) }),
  path(`M0 ${f(s)}l${f(-s * 0.2)} ${f(s * 0.3)}h${f(s * 0.4)}z`, { fill: c2 }));

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(4);
  const cols = ['#f4d0a0', '#e8b8c8', '#c8e0d8', '#f0e0b0', '#d8c8e8'];
  const fronts = cols.map(() => '');
  let wins = '', tanks = '';
  for (let x = -20, k = 0; x < 1640; k++) {
    const w = 90 + R() * 80, top = (x > 260 && x < 1310 ? 470 : 420) + R() * 50;
    fronts[k % cols.length] += `M${P(x, 660)}V${f(top)}H${f(x + w)}V660Z`;
    for (let j = 0; j < 2; j++) wins += `M${P(x + 14 + j * (w - 40), top + 24)}h14v20h-14Z`;
    if (R() < 0.4) tanks += `M${P(x + w * 0.5, top)}v-18h24v18z`;
    x += w + 2;
  }
  const defs = [rad(id('sun'), 0.5, 0.5, 0.5, [[0, '#fff8d0', 0.95], [0.4, '#ffe08a', 0.4], [1, '#ffe08a', 0]])];
  return compactSvg(doc(`Independence Day (India) · back: a bright morning sun in the top-left corner; a jumble of pastel city rooftops with water tanks and windows, kept low; two kites high in the corners`, defs, [
    C('the sun'),
    circle(130, 120, 130, { fill: url('sun') }), circle(130, 120, 44, { fill: '#fffbe0' }),
    C('kites far off in the corners'),
    kite(1460, 140, 22, 12, GREEN, WHITE), kite(1530, 230, 16, -14, SAFFRON, '#ffd166'), kite(250, 260, 14, 8, '#e8343a', '#ffd166'),
    line('M1460 162q-40 200 -120 400M1530 246q-20 180 -60 340M250 274q40 160 70 300', '#8a7a6a', 1, { opacity: 0.6 }),
    C('the city rooftops'),
    fronts.map((d, k) => path(d, { fill: cols[k] })).join(''),
    path(wins, { fill: '#8a6a5a', opacity: 0.5 }), path(tanks, { fill: '#3a3a4a' }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('roof'), 0, 0, 0, 1, [[0, '#e8c8a0'], [1, '#c8a880']]),
    lin(id('wall'), 0, 0, 0, 1, [[0, '#f8e0b8'], [1, '#e8c898']]),
    lin(id('tank'), 0, 0, 1, 0, [[0, '#2a2a3a'], [0.5, '#4a4a5a'], [1, '#2a2a3a']]),
  ];

  // ---- the stairwell hut on the left with a marigold garland on its door, and the water tank with a pigeon
  out.push(C('the stairwell hut on the left with a marigold garland on its door; a black water tank with a pigeon'));
  out.push(path(`M-20 ${ROOF}V540H230V${ROOF}Z`, { fill: url('wall') }), path('M-30 540H240v-14H-30Z', { fill: '#c8843a' }));
  out.push(path(`M80 ${ROOF}V610a40 40 0 0 1 80 0V${ROOF}Z`, { fill: '#2a6aa8' }));
  { let mg = ''; for (let k = 0; k < 13; k++) { const t = k / 12, x = 70 + t * 100, y = 580 + Math.sin(t * Math.PI) * 26; mg += circD(x, y, 7); } out.push(path(mg, { fill: SAFFRON }), path(circD(70, 600, 6) + circD(170, 600, 6) + circD(70, 616, 6) + circD(170, 616, 6), { fill: '#ffb800' })); }
  ppl.garland = [120, 600];
  out.push(path('M30 540v-60q0 -14 40 -14t40 14v60z', { fill: url('tank') }), ellipse(70, 466, 40, 10, { fill: '#4a4a5a' }));
  out.push(G({ transform: 'translate(70 456)' }, path('M-14 0c-2 -10 6 -16 16 -14l10 -2l-4 6c4 6 -2 10 -10 10z', { fill: '#8a8aa0' }), circle(-10, -10, 7, { fill: '#7a7a90' }), path('M-16 -10l-6 2l6 2z', { fill: '#e8a030' }), circle(-11, -12, 1.4, { fill: '#e8243a' }), path('M-8 -4q4 2 8 0', { fill: 'none', stroke: '#4ab88a', 'stroke-width': 2 })));
  ppl.pigeon = [64, 444];

  // ---- the rooftop floor and parapet
  out.push(C('the rooftop terrace and its low parapet'));
  out.push(path(`M-20 ${ROOF}H1620V920H-20Z`, { fill: url('roof') }));
  { let t = ''; for (let y = ROOF + 24; y < 920; y += 30 + (y - ROOF) * 0.08) t += `M-20 ${f(y)}H1620`; out.push(line(t, '#b8946a', 1.6, { opacity: 0.6 })); }
  out.push(path(`M230 ${ROOF}V690H1620V${ROOF}Z`, { fill: '#f0d8b0' }), path('M230 690H1620v-8H230Z', { fill: '#d8b888' }));
  { let j = ''; for (let x = 250; x < 1620; x += 40) j += `M${x} 700h24v28h-24z`; out.push(path(j, { fill: '#e0c098' })); }

  // ---- the flagpole on the parapet with the flag
  out.push(C('the flag flying from a pole on the parapet'));
  out.push(path('M796 690V446h8V690Z', { fill: '#d8dce4' }), circle(800, 442, 6, { fill: '#ffd166' }));
  out.push(G({}, indiaFlag(804, 452, 150)));
  out.push(path('M954 436q14 34 0 100', { fill: 'none', stroke: '#ffffff', 'stroke-width': 0 }));
  ppl.flag = [880, 502];

  // ---- the washing line on the right with clothes flapping
  out.push(line('M1240 520L1600 560', '#8a7a6a', 2), path('M1250 560V690h6V560ZM1590 560V690h6V560Z', { fill: '#8a7a6a' }));
  for (const [x, c, w] of [[1290, SAFFRON, 50], [1370, WHITE, 40], [1440, GREEN, 54], [1520, '#e8343a', 40]]) { const y = 520 + (x - 1240) * 0.11; out.push(path(`M${x} ${f(y)}h${w}l-4 60q-${w / 2 - 4} 8 -${w - 8} 0z`, { fill: c })); }
  ppl.washing = [1400, 570];

  // ---- the kite flyers: a boy with the saffron kite, his sister with the spool
  out.push(C('the focal point: a boy in a white kurta flies a saffron kite high on the right while his sister holds the big wooden spool and laughs'));
  {
    const fly = { sx: 1, elbow: [0.9, -0.9], hand: [1.3, -2.1] };
    const b = figure({ x: 1080, foot: 856, H: 96, heads: 2.9, skin: SKIN.brown, hair: '#1a1210', style: 'short', top: WHITE, bottom: WHITE, shoe: '#5a3a22', gaze: 0.5, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 0.6], hand: [-0.4, 1.2] }, fly] });
    out.push(b.svg);
    const bh = b.hand(fly);
    out.push(circle(bh[0], bh[1], b.r * 0.36, { fill: SKIN.brown }));
    // the kite string up to the kite, high and to the right, below the copy zone at the edge
    const K = [1420, 380];
    out.push(line(`M${P(...bh)}Q${P(bh[0] + 200, bh[1] - 60)} ${P(K[0] - 10, K[1] + 26)}`, '#5a4a3a', 1.6));
    out.push(kite(K[0], K[1], 40, 16, SAFFRON, '#ffd166'));
    ppl.kite = K;
    // the sister with the charkhi spool
    const spool = { sx: 1, elbow: [0.8, 0.4], hand: [1.3, 0.2] }, spool2 = { sx: -1, elbow: [-0.2, 0.8], hand: [0.6, 0.4] };
    const g = figure({ x: 960, foot: 860, H: 82, heads: 2.7, skin: SKIN.brown, hair: '#1a1210', style: 'puffs', top: GREEN, bottom: SAFFRON, shoe: '#ffd166', gaze: 0.5, mouth: 'open', arms: [spool2, spool] });
    out.push(g.svg);
    const sh = g.hand(spool);
    out.push(path(`M${P(sh[0] - 6, sh[1] - 24)}h12v48h-12z`, { fill: '#a8743e' }), ellipse(sh[0], sh[1] - 24, 22, 8, { fill: '#c8945a' }), ellipse(sh[0], sh[1] + 24, 22, 8, { fill: '#c8945a' }), path(`M${P(sh[0] - 18, sh[1] - 20)}h36v40h-36z`, { fill: '#f4ece0', opacity: 0.85 }), line(`M${P(sh[0] - 18, sh[1] - 12)}h36M${P(sh[0] - 18, sh[1] - 2)}h36M${P(sh[0] - 18, sh[1] + 8)}h36`, '#c8b8a0', 1.4));
    out.push(line(`M${P(sh[0] + 18, sh[1] - 10)}Q${P(1020, 760)} ${P(bh[0] - 20, bh[1] + 30)}`, '#5a4a3a', 1.2, { opacity: 0.7 }));
    out.push(circle(sh[0], sh[1], g.r * 0.36, { fill: SKIN.brown }), circle(g.hand(spool2)[0], g.hand(spool2)[1], g.r * 0.36, { fill: SKIN.brown }));
    ppl.spool = [sh[0], sh[1]];
  }

  // ---- grandpa saluting the flag, mum with the sweets
  out.push(C('grandpa in a white kurta and a cap salutes the flag; mum in a green sari brings a plate of jalebis and laddoos'));
  {
    const salute = { sx: 1, elbow: [1.0, -0.6], hand: [0.6, -1.6] };
    const gp = figure({ x: 700, foot: 852, H: 126, heads: 3.3, skin: SKIN.tan, hair: '#dcd8e0', style: 'short', top: WHITE, bottom: WHITE, gaze: 0.4, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.4, 1.0], hand: [-0.2, 1.9] }, salute] });
    out.push(gp.svg);
    const r = gp.r, hy = gp.headY;
    out.push(path(`M${P(700 - r * 0.9, hy - r * 0.5)}l${f(r * 0.1)} ${f(-r * 0.6)}h${f(r * 1.6)}l${f(r * 0.1)} ${f(r * 0.6)}z`, { fill: WHITE }), path(`M${P(700 - r * 0.6, hy + r * 0.4)}q${f(r * 0.6)} ${f(r * 0.3)} ${f(r * 1.2)} 0`, { fill: 'none', stroke: '#e8e4ec', 'stroke-width': f(r * 0.24), 'stroke-linecap': 'round' }));
    out.push(circle(gp.hand(salute)[0], gp.hand(salute)[1], r * 0.36, { fill: SKIN.tan }));
    ppl.salute = [700, hy];
    const plate = { sx: 1, elbow: [0.8, 0.6], hand: [1.3, 0.6] };
    const m = figure({ x: 520, foot: 852, H: 120, heads: 3.2, skin: SKIN.fair, hair: '#1a1210', style: 'bun', top: GREEN, bottom: GREEN, gaze: 0.5, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.4, 1.0], hand: [-0.2, 1.9] }, plate] });
    out.push(path(`M${P(520 - m.tw * 0.5, m.torsoTop)}L${P(520 + m.tw * 0.5, m.torsoBot)}L${P(520 + m.tw * 0.8, 850)}H${f(520 - m.tw * 0.8)}L${P(520 - m.tw * 0.5, m.torsoBot)}Z`, { fill: GREEN }));
    out.push(m.svg, path(`M${P(520 - m.tw * 0.5, m.torsoTop + 4)}L${P(520 + m.tw * 0.5, m.torsoBot)}`, { fill: 'none', stroke: SAFFRON, 'stroke-width': 8 }));
    const ph = m.hand(plate);
    out.push(ellipse(ph[0] + 16, ph[1] - 4, 34, 8, { fill: '#d8dce4' }), path(`M${P(ph[0] - 4, ph[1] - 12)}a10 10 0 1 1 14 4a6 6 0 1 0 -4 -6`, { fill: 'none', stroke: '#ff8a1a', 'stroke-width': 5 }), path(circD(ph[0] + 26, ph[1] - 12, 8) + circD(ph[0] + 40, ph[1] - 10, 8), { fill: '#ffb83a' }), circle(ph[0], ph[1], m.r * 0.34, { fill: SKIN.fair }));
    ppl.sweets = [ph[0] + 16, ph[1] - 10];
  }

  // ---- a neighbour flying a green kite from the next rooftop, left
  out.push(C('a neighbour boy on the stairwell roof flies a green kite, up in the corner'));
  {
    const fly = { sx: 1, elbow: [0.9, -0.9], hand: [1.3, -2.1] };
    const n = figure({ x: 176, foot: 528, H: 70, heads: 2.6, skin: SKIN.deep, hair: '#1a1210', style: 'curls', top: '#2a6ad8', bottom: '#2a2a3a', shoe: WHITE, gaze: 0.2, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 0.8], hand: [-0.4, 1.6] }, fly] });
    out.push(n.svg);
    const nh = n.hand(fly);
    out.push(line(`M${P(...nh)}Q${P(nh[0] + 40, nh[1] - 140)} ${P(250, 300)}`, '#5a4a3a', 1.4), kite(256, 284, 26, -10, GREEN, WHITE));
    ppl.greenKite = [256, 284];
  }

  return { svg: compactSvg(doc(`Independence Day (India) · mid. Concept: "kites over the rooftops" on a bright 15 August morning. Focal point: the family on their rooftop terrace (x 480–1460, y 380–860) — a boy in a white kurta flies a saffron kite high on the right while his sister holds the big wooden charkhi spool and laughs; grandpa in a white kurta and cap salutes the flag flying from a pole on the parapet; mum in a green sari with a saffron border brings a plate of jalebis and laddoos. A neighbour boy flies a green kite from the stairwell roof; a marigold garland on the blue door, a pigeon on the water tank, washing in saffron, white and green flapping on a line. Light story: bright morning sun. The fireworks and floating kites are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Independence Day (India) · front: a pot of marigolds bottom left and a tulsi planter bottom right; the centre stays open`, [], [
    C('marigolds bottom left'),
    path('M10 900l10 -56h100l10 56z', { fill: '#c8643a' }),
    path(circD(36, 822, 20) + circD(74, 812, 24) + circD(110, 826, 20), { fill: '#2a6a3a' }), path(circD(34, 812, 11) + circD(72, 800, 12) + circD(108, 816, 10) + circD(56, 826, 9), { fill: SAFFRON }),
    C('a tulsi planter bottom right'),
    path('M1490 900v-60h110v60z', { fill: '#e8c898' }), path('M1490 850h110', { fill: 'none', stroke: '#c8843a', 'stroke-width': 6 }),
    path(circD(1520, 822, 18) + circD(1550, 806, 22) + circD(1580, 822, 18), { fill: '#3a8a3a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'catch', x: ppl.kite[0], y: ppl.kite[1], r: 50, label: 'Catch the flying kites' },
      { activity: 'colour', x: ppl.flag[0], y: ppl.flag[1], r: 50, label: 'Colour the flag' },
      { activity: 'memory', x: r(ppl.sweets[0]), y: r(ppl.sweets[1]), r: 36, label: 'Match the sweets' },
      { activity: 'card', x: r(ppl.spool[0]), y: r(ppl.spool[1]), r: 30, label: 'Make an Independence Day card' },
    ],
    findables: [
      { id: 'pigeon', label: 'a pigeon on the water tank', x: ppl.pigeon[0], y: ppl.pigeon[1], r: 18 },
      { id: 'garland', label: 'a marigold garland', x: ppl.garland[0], y: ppl.garland[1], r: 26 },
      { id: 'green-kite', label: 'a green kite', x: ppl.greenKite[0], y: ppl.greenKite[1], r: 24 },
      { id: 'washing', label: 'washing on the line', x: ppl.washing[0], y: ppl.washing[1], r: 40 },
      { id: 'salute', label: 'grandpa\'s salute', x: r(ppl.salute[0]), y: r(ppl.salute[1]), r: 22 },
      { id: 'chakra', label: 'the wheel on the flag', x: 879, y: 502, r: 16 },
      { id: 'sun', label: 'the morning sun', x: 130, y: 120, r: 44 },
    ],
  };
}
