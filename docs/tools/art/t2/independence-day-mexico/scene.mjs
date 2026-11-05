// Independence Day (Mexico) — "¡Viva México! in the square": the night of 15 September in a town square. Up on the
// town hall's balcony, under the big green, white and red flag, the mayor rings the old bell for the Grito; below,
// the crowd cheers: a girl in a china poblana dress waves a flag, a boy spins a wooden matraca rattle, dad lifts a
// paper cup of esquites, grandma holds a balloon bunch in the three colours; a churro cart steams beside a
// balloon seller. Green, white and red streamers cross low over the square. The fireworks are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { line, circD } from '../../kit/scenekit.mjs';

const ID = 'independence-day-mexico';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const GREEN = '#006847', RED = '#ce1126', WHITE = '#ffffff', LAMP = '#ffd98a';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const PLAZA = 740;

/** The Mexican flag (simplified emblem: a little eagle on a cactus in a wreath); top-left (x, y), width w. */
export function mexicoFlag(x, y, w) {
  const h = w * 4 / 7, b = w / 3, cx = x + w / 2, cy = y + h / 2, s = h * 0.18;
  return [
    path(`M${P(x, y)}h${f(b)}v${f(h)}h${f(-b)}z`, { fill: GREEN }),
    path(`M${P(x + b, y)}h${f(b)}v${f(h)}h${f(-b)}z`, { fill: WHITE }),
    path(`M${P(x + 2 * b, y)}h${f(b)}v${f(h)}h${f(-b)}z`, { fill: RED }),
    path(`M${P(cx - s, cy + s * 0.2)}q${f(s)} ${f(s * 1.1)} ${f(s * 2)} 0`, { fill: 'none', stroke: '#2a8a3a', 'stroke-width': f(s * 0.22) }),
    path(`M${P(cx - s * 0.5, cy)}c0 ${f(-s * 0.9)} ${f(s * 1.1)} ${f(-s * 0.9)} ${f(s * 1.0)} ${f(-s * 0.1)}l${f(-s * 0.2)} ${f(s * 0.5)}z`, { fill: '#8a5a2a' }),
    path(`M${P(cx - s * 0.1, cy + s * 0.5)}v${f(-s * 0.5)}`, { fill: 'none', stroke: '#3a8a3a', 'stroke-width': f(s * 0.3) }),
  ].join('');
}

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(9);
  let hills = '', wins = '';
  for (let x = -20; x < 1640;) { const w = 80 + R() * 60, top = 560 + R() * 50; hills += `M${P(x, 660)}V${f(top)}H${f(x + w)}V660Z`; wins += `M${P(x + w * 0.4, top + 14)}h10v12h-10Z`; x += w + 4; }
  return compactSvg(doc(`Independence Day (Mexico) · back: low houses climbing the hillside behind the square with lit windows, against the purple night`, [], [
    C('the town beyond the square'),
    path(hills, { fill: '#3a2a5a' }), path(wins, { fill: LAMP, opacity: 0.8 }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('plaza'), 0, 0, 0, 1, [[0, '#a8887a'], [1, '#88685a']]),
    lin(id('hall'), 0, 0, 0, 1, [[0, '#f0d8b0'], [1, '#d8b888']]),
    rad(id('lamp'), 0.5, 0.5, 0.5, [[0, '#fff3c4', 0.8], [0.35, LAMP, 0.35], [1, LAMP, 0]]),
    rad(id('win'), 0.5, 0.6, 0.75, [[0, '#fff3cf'], [0.5, '#ffd98a'], [1, '#f0a84a']]),
    lin(id('bell'), 0, 0, 1, 0, [[0, '#c8901e'], [0.5, '#ffd86a'], [1, '#a87010']]),
  ];

  // ---- the town hall: arcades below, the balcony with the bell, the flag (kept below the copy zone)
  out.push(C('the town hall: an arcade of arches below, a balcony with the old bell, the big flag hanging beside it'));
  out.push(path(`M440 ${PLAZA}V470H1160V${PLAZA}Z`, { fill: url('hall') }), path('M430 470H1170v-16H430Z', { fill: '#c8a878' }));
  { let arch = ''; for (let k = 0; k < 7; k++) { const x = 470 + k * 96; arch += `M${x} ${PLAZA}V${PLAZA - 70}a34 34 0 0 1 68 0V${PLAZA}Z`; } out.push(path(arch, { fill: url('win') }), path(arch, { fill: 'none', stroke: '#b8986a', 'stroke-width': 4 })); }
  for (const x of [480, 580, 1020, 1120]) out.push(path(`M${x - 22} 520h44v70h-44z`, { fill: url('win') }), path(`M${x} 520v70M${x - 22} 552h44`, { fill: 'none', stroke: '#8a6a4a', 'stroke-width': 3 }));
  // the balcony and the bell, with the mayor ringing it
  out.push(path('M700 600h200v14h-200zM706 614v20h188v-20z', { fill: '#5a4a3a' }), path('M716 614v20M736 614v20M756 614v20M776 614v20M796 614v20M816 614v20M836 614v20M856 614v20M876 614v20', { fill: 'none', stroke: '#2a2a2a', 'stroke-width': 3 }));
  out.push(path('M736 600V500a64 64 0 0 1 128 0V600Z', { fill: url('win') }));
  out.push(path('M790 506h20v-10h-20z', { fill: '#5a4a3a' }), path('M776 548q0 -40 24 -42q24 2 24 42z', { fill: url('bell') }), circle(800, 552, 6, { fill: '#a87010' }), line('M800 552l-26 30', '#c8a878', 3));
  out.push(line('M760 516l-14 -8M840 516l14 -8M760 540l-16 0M840 540l16 0', '#ffd86a', 3));
  ppl.bell = [800, 530];
  const ring = { sx: -1, elbow: [-0.6, 0.0], hand: [-0.2, -0.2] };
  const mayor = figure({ x: 852, foot: 600, H: 100, heads: 3.2, skin: SKIN.tan, hair: '#1a1210', style: 'short', top: '#2a2a3a', bottom: '#2a2a3a', gaze: -0.4, mouth: 'open', arms: [ring, { sx: 1, elbow: [0.6, -0.8], hand: [0.8, -2.0] }] });
  out.push(mayor.svg, path(`M${P(852 - mayor.tw * 0.5, mayor.torsoTop)}L${P(852 + mayor.tw * 0.5, mayor.torsoBot)}`, { fill: 'none', stroke: GREEN, 'stroke-width': 4 }), path(`M${P(852 - mayor.tw * 0.5, mayor.torsoTop + 6)}L${P(852 + mayor.tw * 0.5, mayor.torsoBot + 6)}`, { fill: 'none', stroke: RED, 'stroke-width': 4 }));
  out.push(path('M694 600h212v14H694z', { fill: '#5a4a3a' }));
  ppl.mayor = [852, mayor.headY];
  // the big flag on a pole from the balcony
  out.push(path('M920 600V440h6V600Z', { fill: '#d8dce4' }), G({}, mexicoFlag(926, 446, 140)));
  ppl.flag = [996, 486];

  // ---- the plaza floor and streamers
  out.push(C('the plaza, lamplit, and green-white-red paper streamers crossing low'));
  out.push(path(`M-20 ${PLAZA}H1620V920H-20Z`, { fill: url('plaza') }));
  { let t = ''; for (let y = PLAZA + 20; y < 920; y += 26 + (y - PLAZA) * 0.06) t += `M-20 ${f(y)}H1620`; out.push(line(t, '#7a5a4a', 1.6, { opacity: 0.5 })); }
  {
    const cols = [GREEN, WHITE, RED];
    const flags = ['', '', ''];
    let rope = '', n = 0;
    for (const [a, b] of [[[60, 470], [440, 500]], [[1160, 500], [1560, 470]]]) {
      const m = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 30];
      rope += `M${P(...a)}Q${P(...m)} ${P(...b)}`;
      for (let k = 1; k < 10; k++) { const t = k / 10, x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * m[0] + t * t * b[0], y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * m[1] + t * t * b[1]; flags[n % 3] += `M${P(x - 16, y)}h32v24l-6 -5l-5 5l-5 -5l-5 5l-5 -5l-6 5z`; n++; }
    }
    out.push(line(rope, '#e8e0d0', 1.6));
    flags.forEach((d, k) => out.push(path(d, { fill: cols[k] })));
  }
  for (const x of [400, 1200]) out.push(path(`M${x - 4} 860V620h8V860Z`, { fill: '#2a2a3a' }), path(`M${x - 14} 620h28l-6 -30h-16z`, { fill: '#fff3c4' }), circle(x, 606, 70, { fill: url('lamp') }));

  // ---- the churro cart and the balloon seller on the left
  out.push(C('a churro cart with a striped canopy and a balloon seller with green, white and red balloons'));
  out.push(path('M40 800v-80h170v80z', { fill: RED }), path('M30 720h190l-20 -40h-150z', { fill: WHITE }), path('M50 680l20 40M90 680l10 40M130 680l0 40M170 680l-10 40', { fill: 'none', stroke: GREEN, 'stroke-width': 10 }));
  out.push(circle(70, 810, 16, { fill: '#2a2a32' }), circle(180, 810, 16, { fill: '#2a2a32' }), path('M70 720l24 -40l6 2l-22 40zM110 720l18 -44l6 2l-16 42zM150 720l14 -46l6 2l-12 44z', { fill: '#d8943a' }));
  ppl.churros = [120, 700];
  {
    const sell = { sx: 1, elbow: [0.8, -0.6], hand: [1.1, -1.8] };
    const s = figure({ x: 290, foot: 860, H: 120, heads: 3.2, skin: SKIN.brown, hair: '#1a1210', style: 'short', top: '#ffffff', bottom: '#5a4a3a', gaze: 0.3, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.3, 1.8] }, sell] });
    out.push(s.svg);
    const h = s.hand(sell);
    const balloons = [[h[0] - 30, h[1] - 120, GREEN], [h[0], h[1] - 140, WHITE], [h[0] + 30, h[1] - 118, RED], [h[0] - 12, h[1] - 96, RED], [h[0] + 16, h[1] - 100, GREEN]];
    out.push(line(balloons.map(([x, y]) => `M${P(...h)}L${P(x, y + 20)}`).join(''), '#e8e0d0', 1.2));
    for (const [x, y, c] of balloons) out.push(ellipse(x, y, 18, 22, { fill: c }), path(`M${P(x - 3, y + 21)}h6l-3 5z`, { fill: c }), ellipse(x - 6, y - 8, 4, 7, { fill: '#ffffff', opacity: 0.5 }));
    out.push(circle(h[0], h[1], s.r * 0.34, { fill: SKIN.brown }));
    ppl.balloons = [h[0], h[1] - 120];
  }

  // ---- the cheering family in front (the focal point)
  out.push(C('the focal point: the family cheering ¡Viva! — a girl in a china poblana dress waves a flag, a boy spins a wooden matraca, dad holds a cup of esquites, grandma laughs'));
  {
    const cheer = (s) => ({ sx: s, elbow: [s * 0.9, -0.9], hand: [s * 1.2, -2.2] });
    // the girl in the china poblana dress
    const g = figure({ x: 660, foot: 870, H: 90, heads: 2.8, skin: SKIN.tan, hair: '#1a1210', style: 'bun', top: WHITE, bottom: RED, shoe: '#2a2a2a', gaze: 0.3, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, cheer(1)] });
    out.push(path(`M${P(660 - g.tw * 0.5, g.torsoBot - 8)}L${P(660 - g.tw * 1.3, 866)}H${f(660 + g.tw * 1.3)}L${P(660 + g.tw * 0.5, g.torsoBot - 8)}Z`, { fill: RED }), path(`M${P(660 - g.tw * 1.2, 856)}H${f(660 + g.tw * 1.2)}`, { fill: 'none', stroke: GREEN, 'stroke-width': 6 }));
    { let sq = ''; const R = rng(4); for (let k = 0; k < 10; k++) { const t = R(); sq += circD(660 + (R() - 0.5) * g.tw * (1 + t * 1.4), g.torsoBot + 2 + t * (862 - g.torsoBot - 14), 3); } out.push(path(sq, { fill: '#ffd166' })); }
    out.push(g.svg, path(`M${P(660 - g.tw * 0.5, g.torsoTop + 4)}q${f(g.tw * 0.5)} ${f(g.r * 0.6)} ${f(g.tw)} 0`, { fill: 'none', stroke: GREEN, 'stroke-width': 4 }));
    out.push(path(circD(660 + g.r * 0.8, g.headY - g.r * 0.7, g.r * 0.28), { fill: RED }), path(circD(660 + g.r * 0.5, g.headY - g.r * 0.9, g.r * 0.18), { fill: WHITE }));
    const gh = g.hand(cheer(1));
    out.push(line(`M${P(gh[0], gh[1] + 10)}V${f(gh[1] - 56)}`, '#d8c8a8', 3), G({}, mexicoFlag(gh[0], gh[1] - 56, 60)), circle(gh[0], gh[1], g.r * 0.36, { fill: SKIN.tan }));
    ppl.girlFlag = [gh[0] + 30, gh[1] - 40];
    // the boy with the matraca
    const spin = { sx: 1, elbow: [0.9, -0.8], hand: [1.3, -2.0] };
    const b = figure({ x: 780, foot: 872, H: 86, heads: 2.7, skin: SKIN.fair, hair: '#3a2214', style: 'short', top: GREEN, bottom: '#2a2a3a', shoe: RED, gaze: 0.2, mouth: 'open', arms: [cheer(-1), spin] });
    out.push(b.svg);
    const bh = b.hand(spin);
    out.push(path(`M${P(bh[0] - 3, bh[1])}v20h6v-20z`, { fill: '#8a5a2a' }), path(`M${P(bh[0] - 4, bh[1] - 26)}h40v24h-40z`, { fill: '#c8945a' }), path(`M${P(bh[0] + 4, bh[1] - 26)}v24M${P(bh[0] + 16, bh[1] - 26)}v24M${P(bh[0] + 28, bh[1] - 26)}v24`, { fill: 'none', stroke: RED, 'stroke-width': 4 }), circle(bh[0], bh[1], b.r * 0.36, { fill: SKIN.fair }));
    out.push(path(`M${P(bh[0] + 48, bh[1] - 30)}q14 10 0 24M${P(bh[0] + 56, bh[1] - 40)}q22 18 0 40`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.85 }));
    ppl.matraca = [bh[0] + 16, bh[1] - 14];
    // dad with esquites
    const cup = { sx: 1, elbow: [0.8, 0.2], hand: [1.2, -0.2] };
    const d = figure({ x: 900, foot: 866, H: 128, heads: 3.3, skin: SKIN.brown, hair: '#1a1210', style: 'short', top: '#ffffff', bottom: '#2a3a5a', gaze: -0.2, mouth: 'open', arms: [cheer(-1), cup] });
    out.push(d.svg);
    const dh = d.hand(cup);
    out.push(path(`M${P(dh[0] - 10, dh[1] - 22)}h22l-3 24h-16z`, { fill: '#ffffff' }), path(circD(dh[0] - 4, dh[1] - 24, 4) + circD(dh[0] + 4, dh[1] - 26, 4) + circD(dh[0], dh[1] - 30, 4), { fill: '#ffd86a' }), line(`M${P(dh[0] + 6, dh[1] - 30)}l6 -14`, '#e8e0d0', 2), circle(dh[0], dh[1], d.r * 0.34, { fill: SKIN.brown }));
    ppl.esquites = [dh[0], dh[1] - 20];
    // grandma laughing, rebozo shawl
    const gm = figure({ x: 1020, foot: 862, H: 116, heads: 3.2, skin: SKIN.tan, hair: '#dcd8e0', style: 'bun', top: '#8a3a6a', bottom: '#3a2a4a', gaze: -0.4, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.3, 1.8] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.8] }] });
    out.push(gm.svg, path(`M${P(1020 - gm.tw * 0.7, gm.torsoTop + 4)}q${f(gm.tw * 0.7)} ${f(gm.r * 1.4)} ${f(gm.tw * 1.4)} 0l-6 ${f(gm.r * 1.8)}q${f(-gm.tw * 0.6)} ${f(gm.r * 0.8)} ${f(-gm.tw * 1.2)} 0z`, { fill: '#2a8a8a' }));
    { let fr = ''; for (let k = 0; k < 8; k++) fr += `M${P(1020 - gm.tw * 0.6 + k * gm.tw * 0.16, gm.torsoTop + gm.r * 1.9)}v10`; out.push(line(fr, '#2a8a8a', 2)); }
  }

  // ---- a little dog in a tricolour bandana
  out.push(G({ transform: 'translate(1140 880)' }, ellipse(0, 2, 20, 4, { fill: '#000', opacity: 0.2 }), path('M-14 0c-2 -14 6 -22 16 -20c10 2 14 12 10 20z', { fill: '#e8c8a0' }), circle(-12, -20, 10, { fill: '#e8c8a0' }), path('M-18 -28l-4 -10l8 6zM-6 -28l4 -10l-8 6z', { fill: '#c8a878' }), circle(-15, -21, 1.6, { fill: '#1a1a1a' }), circle(-9, -21, 1.6, { fill: '#1a1a1a' }), path('M-20 -10l8 8l8 -8z', { fill: GREEN }), path('M-14 -10l2 4l2 -4z', { fill: WHITE }), path('M14 -4q10 -6 6 -16', { fill: 'none', stroke: '#e8c8a0', 'stroke-width': 4, 'stroke-linecap': 'round' })));
  ppl.dog = [1132, 864];

  return { svg: compactSvg(doc(`Independence Day (Mexico) · mid. Concept: "¡Viva México! in the square" on the night of 15 September. Focal point: the cheering family in front of the town hall (x 600–1080, y 440–880) — a girl in a china poblana dress waves a flag, a boy spins a wooden matraca rattle, dad holds a cup of esquites, grandma in a teal rebozo laughs — while up on the balcony the mayor rings the old bell for the Grito beside the big green, white and red flag. A churro cart and a balloon seller with balloons in the three colours on the left; a little dog in a bandana; green, white and red streamers cross low over the square; lamplight. The fireworks are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Independence Day (Mexico) · front: a pot of red geraniums bottom left and a potted cactus bottom right; the centre stays open`, [], [
    C('geraniums bottom left'),
    path('M10 900l10 -56h100l10 56z', { fill: '#c8643a' }),
    path(circD(36, 822, 22) + circD(76, 812, 26) + circD(110, 826, 20), { fill: '#2a6a3a' }), path(circD(34, 810, 9) + circD(74, 798, 10) + circD(108, 814, 8), { fill: '#ce1126' }),
    C('a potted cactus bottom right'),
    path('M1500 900l10 -50h90l10 50z', { fill: '#c8643a' }),
    path('M1540 852v-100q0 -14 14 -14t14 14v100zM1540 800h-18q-10 0 -10 -10v-26h10v20h18zM1568 790h16v-30h10v34q0 8 -8 8h-18z', { fill: '#3a8a4a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'wish', x: ppl.bell[0], y: ppl.bell[1], r: 44, label: 'Ring the bell and shout ¡Viva!' },
      { activity: 'colour', x: ppl.flag[0], y: ppl.flag[1], r: 50, label: 'Colour the flag' },
      { activity: 'dressup', x: r(ppl.girlFlag[0] - 40), y: r(ppl.girlFlag[1] + 80), r: 50, label: 'Dress up for the fiesta' },
      { activity: 'memory', x: ppl.churros[0], y: ppl.churros[1], r: 44, label: 'Match the fiesta treats' },
    ],
    findables: [
      { id: 'matraca', label: 'a matraca rattle', x: r(ppl.matraca[0]), y: r(ppl.matraca[1]), r: 20 },
      { id: 'esquites', label: 'a cup of esquites', x: r(ppl.esquites[0]), y: r(ppl.esquites[1]), r: 16 },
      { id: 'balloons', label: 'tricolour balloons', x: r(ppl.balloons[0]), y: r(ppl.balloons[1]), r: 40 },
      { id: 'dog', label: 'a dog in a bandana', x: ppl.dog[0], y: ppl.dog[1], r: 22 },
      { id: 'mayor', label: 'the mayor ringing the bell', x: r(ppl.mayor[0]), y: r(ppl.mayor[1]), r: 24 },
      { id: 'cactus', label: 'a cactus', x: 1554, y: 790, r: 30 },
      { id: 'churros', label: 'churros', x: 120, y: 700, r: 24 },
    ],
  };
}
