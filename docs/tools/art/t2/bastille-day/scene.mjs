// Bastille Day — "Le quatorze juillet by the river": a warm summer night in Paris. Along the riverside quay a
// family picnics on the stone wall with a baguette, cheese and strawberries; an accordionist plays by a lamp post
// while a couple of children dance; a girl waves a tricolour flag; a boy rides past on a bike with a baguette in its
// basket; a little white poodle in a bow sits up to beg. A café with a striped awning glows on the left, a houseboat
// is moored on the river, and the Eiffel Tower sparkles across the water on the right. The fireworks are the
// effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { line, circD } from '../../kit/scenekit.mjs';

const ID = 'bastille-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const BLUE = '#1f3fa8', RED = '#e63946', WHITE = '#ffffff', LAMP = '#ffd98a';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const QUAY = 760, RIVER = 640;

// ============================== back ==============================
export function back() {
  setPrecision(1);
  // the Eiffel Tower on the right, outside the copy zone, with sparkles
  const T = { x: 1460, base: 640, top: 150 };
  const leg = (s) => `M${T.x + s * 96} ${T.base}C${T.x + s * 60} ${T.base - 120} ${T.x + s * 30} ${T.base - 300} ${T.x + s * 10} ${T.top + 60}h${-s * 6}C${T.x + s * 14} ${T.base - 300} ${T.x + s * 38} ${T.base - 120} ${T.x + s * 66} ${T.base}Z`;
  const tower = leg(1) + leg(-1) + `M${T.x - 70} ${T.base - 110}h140v12h-140zM${T.x - 34} ${T.base - 290}h68v10h-68zM${T.x - 4} ${T.top + 60}v-60h8v60z` + `M${T.x - 56} ${T.base - 98}a56 50 0 0 1 112 0v-2h-12a44 40 0 0 0 -88 0h-12z`;
  let lattice = '';
  for (let y = T.base - 20; y > T.top + 70; y -= 30) { const w = 96 - ((T.base - y) / (T.base - T.top)) * 86; lattice += `M${f(T.x - w)} ${y}L${f(T.x + w * 0.6)} ${y - 30}M${f(T.x + w)} ${y}L${f(T.x - w * 0.6)} ${y - 30}`; }
  const R = rng(4);
  let sparks = '';
  for (let k = 0; k < 40; k++) { const t = R(), y = T.top + 60 + t * (T.base - T.top - 60), w = 10 + t * 80; sparks += circD(T.x + (R() - 0.5) * 2 * w, y, 2); }
  // the far bank roofs, low
  let roofs = '', wins = '';
  for (let x = 240; x < 1320;) { const w = 90 + R() * 60, top = 520 + R() * 30; roofs += `M${P(x, 640)}V${f(top)}l${f(w * 0.2)} -24h${f(w * 0.6)}l${f(w * 0.2)} 24V640Z`; for (let k = 0; k < 3; k++) wins += `M${P(x + 12 + k * (w - 30) / 2, top + 16)}h10v14h-10Z`; x += w + 4; }
  const defs = [rad(id('tglow'), 0.5, 0.6, 0.6, [[0, '#ffd98a', 0.35], [1, '#ffd98a', 0]])];
  return compactSvg(doc(`Bastille Day · back: the Eiffel Tower sparkling on the right across the river, outside the copy zone; a low row of Paris rooftops with mansard roofs and lit windows`, defs, [
    C('the Paris rooftops across the river'),
    path(roofs, { fill: '#2a3a6a' }), path(wins, { fill: LAMP, opacity: 0.85 }),
    C('the Eiffel Tower, sparkling'),
    ellipse(T.x, T.base - 200, 160, 260, { fill: url('tglow') }),
    path(tower, { fill: '#c8843a' }), path(lattice, { fill: 'none', stroke: '#e8a85a', 'stroke-width': 1.6, opacity: 0.8 }),
    path(sparks, { fill: '#fff6d8' }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('river'), 0, 0, 0, 1, [[0, '#1a3a7a'], [1, '#0e2050']]),
    lin(id('stone'), 0, 0, 0, 1, [[0, '#d8c8a8'], [1, '#b8a888']]),
    lin(id('quay'), 0, 0, 0, 1, [[0, '#a89a88'], [1, '#887a68']]),
    rad(id('lamp'), 0.5, 0.5, 0.5, [[0, '#fff3c4', 0.8], [0.35, LAMP, 0.35], [1, LAMP, 0]]),
    rad(id('win'), 0.5, 0.6, 0.75, [[0, '#fff3cf'], [0.5, '#ffd98a'], [1, '#f0a84a']]),
  ];

  // ---- the river with the tower's reflection
  out.push(C('the river, with golden reflections'));
  out.push(path(`M-20 ${RIVER}H1620V${QUAY}H-20Z`, { fill: url('river') }));
  { let r = ''; const R = rng(6); for (let i = 0; i < 26; i++) { const x = 1380 + R() * 160, y = RIVER + 10 + R() * 100; r += `M${P(x, y)}h${f(10 + R() * 26)}`; } for (let i = 0; i < 20; i++) { const x = R() * 1300, y = RIVER + 10 + R() * 100; r += `M${P(x, y)}h${f(14 + R() * 30)}`; } out.push(line(r, LAMP, 2.4, { opacity: 0.5 })); }
  // a houseboat moored in the river
  out.push(path('M940 690h300l-20 30H960Z', { fill: '#2a5a3a' }), path('M970 690v-40h220v40z', { fill: '#f4ece0' }), path('M990 660h30v20h-30zM1040 660h30v20h-30zM1090 660h30v20h-30zM1140 660h30v20h-30z', { fill: url('win') }), path('M962 650h236l-10 -12H972z', { fill: RED }), path('M1180 640v-26h4v26zM1184 614h20v12h-20z', { fill: BLUE }));
  ppl.boat = [1080, 670];

  // ---- the stone quay wall and the walk
  out.push(C('the stone quay: a wall along the river and the cobbled walk in front'));
  out.push(path(`M-20 ${QUAY}V720H1620V${QUAY}Z`, { fill: url('stone') }), path('M-20 720H1620v-8H-20Z', { fill: '#e8dcc0' }));
  out.push(path(`M-20 ${QUAY}H1620V920H-20Z`, { fill: url('quay') }));
  { let c = ''; for (let y = QUAY + 16; y < 920; y += 20 + (y - QUAY) * 0.06) for (let x = -10 + ((y / 20) % 2) * 20; x < 1620; x += 40) c += `M${P(x, y)}h30`; out.push(line(c, '#786a58', 2, { opacity: 0.5 })); }

  // ---- the café on the left with a striped awning, tricolour bunting
  out.push(C('a café on the left with a striped awning, lit windows and little round tables'));
  out.push(path('M-20 760V380H250V760Z', { fill: '#e8dcc8' }), path('M-20 380H250v-20H-20Z', { fill: '#4a5a7a' }));
  out.push(path('M10 560h220v200h-220z', { fill: url('win') }), path('M120 560v200M10 640h220', { fill: 'none', stroke: '#3a3a4a', 'stroke-width': 5 }));
  { let a = '', b = ''; for (let k = 0; k < 9; k++) { const x = -20 + k * 32; const d = `M${x} 510h32v40q-16 14 -32 0z`; if (k % 2) b += d; else a += d; } out.push(path(a, { fill: RED }), path(b, { fill: WHITE }), path('M-20 506h290v8h-290z', { fill: '#a81a2a' })); }
  for (const x of [60, 190]) out.push(ellipse(x, 800, 30, 7, { fill: '#2a2a3a' }), path(`M${x - 3} 800v50h6v-50zM${x - 20} 850h40v4h-40z`, { fill: '#2a2a3a' }), path(`M${x - 6} 794v-14h12v14z`, { fill: '#ffffff', opacity: 0.8 }));
  // tricolour bunting across the quay, below the copy zone
  {
    const cols = [BLUE, WHITE, RED];
    const flags = ['', '', ''];
    let rope = '', n = 0;
    for (const [a, b] of [[[250, 470], [760, 500]], [[760, 500], [1290, 470]]]) {
      const m = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 30];
      rope += `M${P(...a)}Q${P(...m)} ${P(...b)}`;
      for (let k = 1; k < 12; k++) { const t = k / 12, x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * m[0] + t * t * b[0], y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * m[1] + t * t * b[1]; flags[n % 3] += `M${P(x - 14, y)}h28l-14 24z`; n++; }
    }
    out.push(line(rope, '#e8e0d0', 2));
    flags.forEach((d, k) => out.push(path(d, { fill: cols[k] })));
  }

  // ---- the lamp post
  out.push(path('M700 860V600h8V860Z', { fill: '#1a2a2a' }), path('M688 600h32l-6 -36h-20z', { fill: '#fff3c4' }), path('M684 566h40l-6 -12h-28z', { fill: '#1a2a2a' }), circle(704, 584, 80, { fill: url('lamp') }), path('M690 860h28v-8h-28z', { fill: '#1a2a2a' }));

  // ---- the accordionist and two dancing children
  out.push(C('an accordionist in a striped shirt and beret plays by the lamp post; two children dance'));
  {
    const squeeze = { sx: -1, elbow: [-0.8, 0.6], hand: [-0.9, 1.0] }, squeeze2 = { sx: 1, elbow: [0.8, 0.6], hand: [0.9, 1.0] };
    const a = figure({ x: 790, foot: 856, H: 122, heads: 3.3, skin: SKIN.fair, hair: '#2a2a2a', style: 'short', top: WHITE, bottom: '#2a2a3a', gaze: -0.3, mouth: 'smile', arms: [squeeze, squeeze2] });
    out.push(a.svg);
    out.push(path(`M${P(790 - a.tw * 0.5, a.torsoTop + a.r * 0.6)}h${f(a.tw)}v5h${f(-a.tw)}zM${P(790 - a.tw * 0.5, a.torsoTop + a.r * 1.1)}h${f(a.tw)}v5h${f(-a.tw)}zM${P(790 - a.tw * 0.5, a.torsoTop + a.r * 1.6)}h${f(a.tw)}v5h${f(-a.tw)}z`, { fill: BLUE }));
    out.push(ellipse(790, a.headY - a.r * 0.8, a.r * 1.1, a.r * 0.36, { fill: '#2a2a3a' }), circle(790, a.headY - a.r * 1.1, a.r * 0.12, { fill: '#2a2a3a' }));
    const hl = a.hand(squeeze), hr = a.hand(squeeze2);
    out.push(path(`M${P(hl[0] - 10, hl[1] - 30)}h20v60h-20z`, { fill: RED }), path(`M${P(hr[0] - 10, hr[1] - 30)}h20v60h-20z`, { fill: RED }));
    let bellows = '';
    for (let x = hl[0] + 10; x < hr[0] - 10; x += 8) bellows += `M${f(x)} ${f(hl[1] - 26)}l4 28l-4 28`;
    out.push(path(`M${P(hl[0] + 10, hl[1] - 26)}H${f(hr[0] - 10)}v56H${f(hl[0] + 10)}z`, { fill: '#f4ece0' }), path(bellows, { fill: 'none', stroke: '#a89a88', 'stroke-width': 2 }));
    out.push(path(circD(hl[0] - 4, hl[1] - 16, 3) + circD(hl[0] - 4, hl[1] - 4, 3) + circD(hl[0] - 4, hl[1] + 8, 3), { fill: WHITE }));
    out.push(path('M860 600v-20l18 -4v20M856 602a5 4 0 1 0 8 0a5 4 0 1 0 -8 0zM874 598a5 4 0 1 0 8 0a5 4 0 1 0 -8 0zM740 620v-16M736 622a5 4 0 1 0 8 0a5 4 0 1 0 -8 0z', { fill: WHITE, stroke: WHITE, 'stroke-width': 2.4 }));
    ppl.accordion = [790, hl[1]];
    const twirl = (s) => ({ sx: s, elbow: [s * 0.9, -0.9], hand: [s * 1.2, -2.2] });
    const d1 = figure({ x: 900, foot: 862, H: 80, heads: 2.7, skin: SKIN.brown, hair: '#1a1210', style: 'puffs', top: RED, bottom: RED, shoe: WHITE, gaze: 0.4, mouth: 'open', arms: [{ sx: -1, elbow: [-1.0, 0.0], hand: [-1.8, -0.2] }, twirl(1)] });
    out.push(path(`M${P(900 - d1.tw * 0.5, d1.torsoBot - 6)}L${P(900 - d1.tw * 1.2, d1.torsoBot + 26)}H${f(900 + d1.tw * 1.2)}L${P(900 + d1.tw * 0.5, d1.torsoBot - 6)}Z`, { fill: RED }));
    out.push(d1.svg);
    const d2 = figure({ x: 990, foot: 862, H: 82, heads: 2.7, skin: SKIN.light, hair: '#e8b84a', style: 'short', top: BLUE, bottom: '#2a2a3a', shoe: '#2a2a2a', gaze: -0.4, mouth: 'open', arms: [{ sx: -1, elbow: [-1.0, 0.0], hand: [-1.8, -0.2] }, twirl(1)] });
    out.push(d2.svg);
    ppl.dancers = [945, d1.headY];
  }

  // ---- the picnic family on the quay wall
  out.push(C('a family picnicking on the quay: a baguette, cheese and strawberries on a checked cloth; a girl waves a tricolour flag'));
  {
    out.push(path('M300 860L330 800H580L610 860Z', { fill: WHITE }), path('M330 800L320 820H590L580 800ZM315 840L305 860H605L595 840Z', { fill: BLUE, opacity: 0.85 }));
    out.push(path('M360 814l90 -14l4 10l-90 14z', { fill: '#e8a050' }), path('M372 812l10 -2M392 808l10 -2M412 806l10 -2M432 802l10 -2', { fill: 'none', stroke: '#f8d098', 'stroke-width': 3 }));
    out.push(path('M480 824l40 -18l10 20z', { fill: '#ffe08a' }), path(circD(496, 818, 3) + circD(510, 816, 2.4), { fill: '#e8c060' }));
    out.push(ellipse(560, 828, 22, 6, { fill: WHITE }), path(circD(552, 822, 6) + circD(566, 822, 6) + circD(560, 816, 5), { fill: RED }));
    ppl.baguette = [410, 808];
    const mum = figure({ x: 380, foot: 806, H: 116, heads: 3.2, skin: SKIN.tan, hair: '#1a1210', style: 'bob', top: '#ffd23a', bottom: '#2a3a6a', gaze: 0.4, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.3, 1.8] }, { sx: 1, elbow: [0.8, 0.6], hand: [1.2, 1.0] }] });
    out.push(mum.svg);
    const wave = { sx: 1, elbow: [0.9, -0.8], hand: [1.2, -2.2] };
    const g = figure({ x: 520, foot: 846, H: 82, heads: 2.7, skin: SKIN.tan, hair: '#1a1210', style: 'bun', top: WHITE, bottom: BLUE, shoe: RED, gaze: 0.3, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, wave] });
    out.push(g.svg);
    const gh = g.hand(wave);
    out.push(line(`M${P(gh[0], gh[1] + 10)}V${f(gh[1] - 60)}`, '#d8c8a8', 3), path(`M${P(gh[0], gh[1] - 60)}h22v40h-22z`, { fill: BLUE }), path(`M${P(gh[0] + 22, gh[1] - 60)}h22v40h-22z`, { fill: WHITE }), path(`M${P(gh[0] + 44, gh[1] - 60)}h22v40h-22z`, { fill: RED }), circle(gh[0], gh[1], g.r * 0.36, { fill: SKIN.tan }));
    ppl.flag = [gh[0] + 33, gh[1] - 40];
  }

  // ---- the boy on a bike with a baguette in the basket, and the poodle
  out.push(C('a boy rides past on a bike with a baguette in its basket; a little white poodle with a bow sits up to beg'));
  {
    const bx = 1200, by = 852;
    const wheel = (x) => circle(x, by - 30, 30, { fill: 'none', stroke: '#2a2a2a', 'stroke-width': 5 }) + circle(x, by - 30, 4, { fill: '#8a8a9a' });
    out.push(ellipse(bx, by + 2, 100, 7, { fill: '#000', opacity: 0.22 }), wheel(bx - 56), wheel(bx + 56), line(`M${bx - 56} ${by - 30}L${bx - 10} ${by - 30}L${bx + 30} ${by - 80}L${bx + 56} ${by - 30}M${bx - 10} ${by - 30}L${bx - 26} ${by - 80}L${bx + 30} ${by - 80}M${bx + 30} ${by - 80}l-4 -20h20`, '#2a8ab8', 5));
    out.push(path(`M${bx + 34} ${by - 104}h40l-6 24h-28z`, { fill: '#c8945a' }), path(`M${bx + 44} ${by - 104}l26 -48l8 4l-24 46z`, { fill: '#e8a050' }));
    // the rider: sitting on the saddle (hips at the saddle), legs down to the pedals, hands on the handlebars
    const ride = { sx: 1, elbow: [1.2, 0.2], hand: [2.4, 0.4] }, ride2 = { sx: -1, elbow: [0.4, 0.6], hand: [1.6, 0.6], back: true };
    const b = figure({ x: bx - 30, foot: by - 52, H: 92, heads: 2.8, skin: SKIN.light, hair: '#c8642a', style: 'short', top: '#2ab86a', bottom: BLUE, shoe: '#2a2a2a', gaze: 0.5, mouth: 'open', arms: [ride2, ride] });
    out.push(path(`M${bx - 42} ${by - 84}h28v8h-28z`, { fill: '#2a2a2a' }));
    out.push(b.svg.replace(/^<ellipse[^>]*opacity="?\.?0?\.28"?[^>]*\/>/, ''));
    out.push(line(`M${bx - 36} ${by - 56}L${bx - 18} ${by - 30}M${bx - 22} ${by - 56}L${bx - 2} ${by - 36}`, BLUE, 9), path(`M${bx - 28} ${by - 30}h18v6h-18zM${bx - 10} ${by - 36}h18v6h-18z`, { fill: '#2a2a2a' }));
    ppl.bike = [bx, by - 60];
    const px = 1380, pf = 862;
    out.push(G({ transform: `translate(${px} ${pf})` }, ellipse(0, 2, 24, 4, { fill: '#000', opacity: 0.2 }), path(circD(0, -20, 16) + circD(0, -40, 14) + circD(-6, -60, 14) + circD(14, -6, 8) + circD(-14, -6, 8), { fill: WHITE }), path(circD(-18, -60, 7) + circD(6, -56, 7), { fill: '#f4ece0' }), circle(-10, -62, 2, { fill: '#1a1a1a' }), circle(-20, -56, 3, { fill: '#2a2a2a' }), path('M0 -74l8 -6l2 8zM0 -74l-6 -8l-2 8z', { fill: RED }), path(circD(12, -30, 6), { fill: WHITE })));
    ppl.poodle = [px - 6, pf - 50];
  }

  return { svg: compactSvg(doc(`Bastille Day · mid. Concept: "le quatorze juillet by the river" on a warm summer night in Paris. Focal point: the riverside quay (x 300–1100, y 560–870) where an accordionist in a striped shirt and beret plays by a lamp post while two children dance, and a family picnics with a baguette, cheese and strawberries, a girl waving a tricolour flag. A café with a red-and-white awning glows on the left; a boy rides past with a baguette in his bike basket; a little white poodle with a bow sits up to beg; a houseboat is moored on the river; tricolour bunting crosses the quay. The Eiffel Tower sparkles across the water on the right. Light story: lamplight and lit windows on a blue night. The fireworks are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Bastille Day · front: a pot of red geraniums bottom left and a bench end bottom right; the centre stays open`, [], [
    C('geraniums bottom left'),
    path('M10 900l10 -56h100l10 56z', { fill: '#c8643a' }),
    path(circD(36, 822, 22) + circD(76, 812, 26) + circD(110, 826, 20), { fill: '#2a6a3a' }), path(circD(34, 810, 9) + circD(74, 798, 10) + circD(108, 814, 8), { fill: '#e63946' }),
    C('the end of a park bench bottom right'),
    path('M1500 900v-70h12v70zM1500 830h120v12h-120zM1500 800h120v12h-120zM1500 770h120v12h-120z', { fill: '#2a5a3a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'memory', x: ppl.baguette[0], y: ppl.baguette[1], r: 44, label: 'Match the picnic treats' },
      { activity: 'card', x: r(ppl.flag[0]), y: r(ppl.flag[1]), r: 36, label: 'Make a tricolour card' },
      { activity: 'colour', x: r(ppl.dancers[0]), y: r(ppl.dancers[1] + 40), r: 50, label: 'Colour the dancers' },
      { activity: 'wish', x: 1460, y: 300, r: 60, label: 'Wish on the sparkling tower' },
    ],
    findables: [
      { id: 'poodle', label: 'a poodle with a bow', x: ppl.poodle[0], y: ppl.poodle[1], r: 24 },
      { id: 'bike-baguette', label: 'a baguette in a bike basket', x: r(ppl.bike[0] + 60), y: r(ppl.bike[1] - 60), r: 22 },
      { id: 'beret', label: 'a beret', x: 790, y: 720, r: 18 },
      { id: 'houseboat', label: 'a houseboat', x: ppl.boat[0], y: ppl.boat[1], r: 40 },
      { id: 'strawberries', label: 'strawberries', x: 560, y: 820, r: 18 },
      { id: 'cafe', label: 'the café awning', x: 120, y: 528, r: 40 },
      { id: 'notes', label: 'music notes', x: 868, y: 594, r: 20 },
    ],
  };
}
