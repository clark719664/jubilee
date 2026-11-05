// Chuseok — "Ganggangsullae under the harvest moon": a moonlit courtyard of a family hanok in the countryside.
// In the madang a family in bright hanbok hold hands in a ring and dance ganggangsullae (the girls' saekdong
// sleeves are rainbow-striped); on the wooden maru, in front of glowing paper doors, grandma and her granddaughter
// pinch half-moon songpyeon on a little round soban table; a red-and-blue silk lantern hangs from the curling eave
// and two pairs of white rubber shoes wait on the step. Behind the stone wall: golden rice paddies and layered blue
// mountains. On the right a bare persimmon tree heavy with orange fruit, a magpie, crocks of kimchi and soy sauce on
// their stone terrace, and a white Jindo dog. The moon is the effect's (upper right, kept clear).
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, dog, line, circD, ellD } from '../../kit/scenekit.mjs';

const ID = 'chuseok';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SKIN = { light: '#f3d2b4', fair: '#ecc29c', warm: '#e0ad84' };
const HAIR = '#1a1418';
const YARD = 680;
const SAEK = ['#e8243a', '#ffc83a', '#3aa85a', '#2a6ad8', '#ff8ac8'];

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(11);
  let village = '';
  for (const [x, w] of [[470, 46], [530, 38], [1250, 44], [1310, 36], [1370, 40]]) village += `M${x - w} 600q${w} -10 ${w * 2} 0l-6 -10q${-(w - 6)} -12 ${-(w * 2 - 12)} 0z`;
  let lights = '';
  for (const [x, y] of [[452, 606], [520, 607], [1236, 606], [1300, 607], [1366, 606]]) lights += circD(x, y, 2.6);
  let paddy = '';
  for (let k = 0; k < 4; k++) paddy += `M-20 ${622 + k * 14}Q800 ${612 + k * 14 + R() * 6} 1620 ${624 + k * 14}`;
  const defs = [
    rad(id('moonwash'), 0.5, 0.5, 0.5, [[0, '#fff4c2', 0.2], [0.5, '#fff4c2', 0.07], [1, '#fff4c2', 0]]),
    lin(id('paddy'), 0, 0, 0, 1, [[0, '#8a7a3a'], [1, '#6a5e2e']]),
  ];
  return compactSvg(doc(`Chuseok · back: moonlight washing three layered ink-blue mountain ranges, kept low behind the copy; two far hanok hamlets with tiny lit windows; golden rice paddies in moonlight. The moon is the effect's.`, defs, [
    C('moonlight washing the hills (the moon itself is the effect\'s)'),
    ellipse(1120, 560, 720, 240, { fill: url('moonwash') }),
    C('three layered mountain ranges, palest furthest'),
    path('M-20 520C80 470 160 452 240 470C320 488 360 470 440 500C560 540 700 556 820 552C960 548 1060 520 1160 490C1260 460 1360 440 1460 452C1540 462 1580 480 1620 490V700H-20Z', { fill: '#3a5288' }),
    path('M-20 560C100 530 200 520 300 540C420 560 520 580 640 584C780 588 900 576 1020 560C1140 544 1260 520 1380 522C1480 524 1560 540 1620 548V700H-20Z', { fill: '#2e4476' }),
    path('M-20 590C140 576 300 584 460 594C640 604 820 606 1000 600C1180 594 1380 584 1620 588V700H-20Z', { fill: '#243a66' }),
    C('far hamlets with lit windows'),
    path(village, { fill: '#1a2a4a' }), path(lights, { fill: '#ffd98a' }),
    C('golden rice paddies under the moon'),
    path('M-20 612Q800 600 1620 612V700H-20Z', { fill: url('paddy') }),
    line(paddy, '#a8944a', 2, { opacity: 0.6 }),
  ], '0 0 1600 900'));
}

/** A girl's or woman's hanbok over a figure: a high-waisted bell chima, the jeogori's white collar and goreum bow,
 *  and (saekdong) rainbow-striped sleeves on the given arms. */
function hanbok(fig, x, foot, { chima, jeogori, goreum, arms = [], saek = false, pants = false }) {
  const r = fig.r, tw = fig.tw;
  const out = [];
  if (!pants) {
    const top = fig.torsoTop + r * 0.8;
    out.push(path(`M${P(x - tw * 0.48, top)}C${P(x - tw * 0.62, top + r)} ${P(x - tw * 0.95, foot - r * 0.8)} ${P(x - tw * 0.98, foot - 2)}Q${P(x, foot + r * 0.22)} ${P(x + tw * 0.98, foot - 2)}C${P(x + tw * 0.95, foot - r * 0.8)} ${P(x + tw * 0.62, top + r)} ${P(x + tw * 0.48, top)}Z`, { fill: chima }));
    out.push(path(`M${P(x - tw * 0.2, top + r * 0.5)}Q${P(x - tw * 0.3, foot - r)} ${P(x - tw * 0.4, foot - 4)}M${P(x + tw * 0.25, top + r * 0.6)}Q${P(x + tw * 0.4, foot - r)} ${P(x + tw * 0.55, foot - 6)}`, { fill: 'none', stroke: darken(chima, 0.18), 'stroke-width': r * 0.08, 'stroke-linecap': 'round' }));
  }
  // the sleeves, redrawn over the chima (striped for saekdong)
  for (const a of arms) {
    if (a.back) continue;
    const s = [x + a.sx * tw * 0.46, fig.shoulderY];
    const e = [s[0] + a.elbow[0] * r, s[1] + a.elbow[1] * r], hd = [s[0] + a.hand[0] * r, s[1] + a.hand[1] * r];
    const d = `M${P(...s)}Q${P(...e)} ${P(...hd)}`;
    out.push(path(d, { fill: 'none', stroke: jeogori, 'stroke-width': r * 0.62, 'stroke-linecap': 'round' }));
    if (saek) SAEK.forEach((c, k) => out.push(path(d, { fill: 'none', stroke: c, 'stroke-width': r * 0.62, 'stroke-dasharray': `${f(r * 0.16)} ${f(r * 0.64)}`, 'stroke-dashoffset': f(-k * r * 0.16 - r * 0.6) })));
    out.push(path(`M${P(hd[0] - (hd[0] - e[0]) * 0.12, hd[1] - (hd[1] - e[1]) * 0.12)}l0 0`, { fill: 'none', stroke: '#ffffff', 'stroke-width': r * 0.66, 'stroke-linecap': 'round' }));
    out.push(circle(hd[0], hd[1], r * 0.34, { fill: a.skin }));
  }
  // the white dongjeong collar and the goreum bow
  const ny = fig.torsoTop;
  out.push(path(`M${P(x - r * 0.45, ny)}L${P(x + r * 0.15, ny + r * 0.75)}`, { fill: 'none', stroke: '#ffffff', 'stroke-width': r * 0.16, 'stroke-linecap': 'round' }));
  out.push(path(`M${P(x + r * 0.15, ny + r * 0.7)}c${f(r * 0.35)} ${f(-r * 0.25)} ${f(r * 0.55)} ${f(r * 0.05)} ${f(r * 0.2)} ${f(r * 0.2)}zM${P(x + r * 0.15, ny + r * 0.72)}l${f(r * 0.08)} ${f(r * 0.9)}l${f(r * 0.18)} ${f(-r * 0.05)}z`, { fill: goreum }));
  return out.join('');
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('madang'), 0, 0, 0, 1, [[0, '#8a7c62'], [1, '#6a5c48']]),
    lin(id('roof'), 0, 0, 0, 1, [[0, '#2a3248'], [1, '#3e4a64']]),
    lin(id('wood'), 0, 0, 0, 1, [[0, '#a8744a'], [1, '#7a4e2e']]),
    rad(id('door'), 0.5, 0.55, 0.7, [[0, '#fff6d8'], [0.6, '#ffe2a0'], [1, '#f0b860']]),
    rad(id('warm'), 0.5, 0.5, 0.5, [[0, '#ffd98a', 0.4], [1, '#ffd98a', 0]]),
    rad(id('onggi'), 0.35, 0.3, 0.75, [[0, '#9a5a32'], [0.6, '#6a3a1e'], [1, '#4a2614']]),
    rad(id('persimmon'), 0.38, 0.32, 0.7, [[0, '#ffb04a'], [1, '#e8641a']]),
    E('clipPath', { id: id('rc') }, path('M-30 472Q200 500 452 446L430 440Q300 438 160 408H-30Z')),
  ];

  // ---- the madang: the packed-earth courtyard, a lighter trodden ring where the family dance
  out.push(C('the madang: a packed-earth courtyard, a lighter trodden ring where the family dance'));
  out.push(path(`M-20 ${YARD - 10}H1620V920H-20Z`, { fill: url('madang') }));
  out.push(path(ellD(800, 790, 290, 56), { fill: '#a89a78', opacity: 0.5 }));
  out.push(ellipse(220, 720, 360, 120, { fill: url('warm') }));

  // ---- the stone wall with its little tiled cap
  out.push(C('a low stone wall with a tiled cap round the courtyard'));
  {
    const R = rng(4);
    let stones = '';
    for (let y = 624; y < 682; y += 18) for (let x = 440 + (y % 36 ? 0 : 14); x < 1620; x += 26 + R() * 8) stones += ellD(x, y + 6, 12 + R() * 3, 8);
    out.push(path('M440 612H1620V688H440Z', { fill: '#c8bca0' }), path(stones, { fill: '#8a8270' }));
    out.push(path('M432 616Q1000 600 1628 610V598Q1000 588 432 604Z', { fill: '#2a3248' }), line('M436 604Q1000 590 1624 600', '#c8ccd8', 2.4));
  }

  // ---- the persimmon tree, bare but heavy with fruit, and a magpie
  out.push(C('a bare persimmon tree heavy with orange fruit; a magpie on a branch'));
  {
    const t = bareTree(1440, 712, 300, 9, { lean: -0.04, depth: 6, spread: 0.6, trunk: 0.1 });
    out.push(path(t.d, { fill: '#4a3626' }));
    const R = rng(3);
    let fruit = '', leaves = '';
    t.tips.forEach(([x, y], i) => {
      if (i % 3 !== 1) fruit += circD(x + R() * 6 - 3, y + 8, 11);
      if (i % 4 === 0) leaves += `M${P(x, y)}q10 -10 18 2q-10 8 -18 -2z`;
    });
    out.push(path(leaves, { fill: '#b8642a' }), path(fruit, { fill: url('persimmon') }));
    ppl.persimmon = t.tips[Math.floor(t.tips.length / 2)];
    // the magpie: black head and back, white belly, a long blue-black tail
    const mx = 1336, my = 520;
    out.push(G({ transform: `translate(${mx} ${my})` },
      path('M20 2l40 10l-2 6l-40 -8z', { fill: '#1a2a4a' }),
      ellipse(0, 0, 22, 13, { fill: '#1a1a24' }), path('M-14 4q14 12 30 0q-6 10 -16 10q-10 0 -14 -10z', { fill: '#f4f4f0' }),
      path('M-2 -6q14 -2 22 6q-12 4 -22 -6z', { fill: '#2a4a8a' }), circle(-18, -8, 9, { fill: '#1a1a24' }),
      path('M-26 -9l-10 3l10 2z', { fill: '#1a1a24' }), circle(-20, -10, 1.8, { fill: '#ffffff' }),
      line('M-4 12l-2 8M4 12l2 8', '#1a1a24', 2)));
    ppl.magpie = [mx, my];
  }

  // ---- crocks of kimchi and soy sauce on their stone terrace (jangdokdae)
  out.push(C('onggi crocks of kimchi and soy sauce on their stone terrace'));
  {
    out.push(path('M1140 728h220v-16q-110 -10 -220 0z', { fill: '#9a927e' }), path('M1140 728h220v10h-220z', { fill: '#7a725e' }));
    for (const [x, s] of [[1180, 1], [1240, 1.25], [1306, 1.05], [1214, 0.7]]) {
      const w = 26 * s, h = 46 * s, b = 716;
      out.push(path(`M${P(x - w * 0.55, b)}C${P(x - w * 1.15, b - h * 0.4)} ${P(x - w * 0.9, b - h)} ${P(x - w * 0.5, b - h)}H${f(x + w * 0.5)}C${P(x + w * 0.9, b - h)} ${P(x + w * 1.15, b - h * 0.4)} ${P(x + w * 0.55, b)}Z`, { fill: url('onggi') }));
      out.push(path(`M${P(x - w * 0.62, b - h - 4)}q${f(w * 0.62)} ${f(-h * 0.24)} ${f(w * 1.24)} 0z`, { fill: '#5a2e18' }), circle(x, b - h - h * 0.12, 3.5 * s, { fill: '#5a2e18' }));
      out.push(path(`M${P(x - w * 0.6, b - h * 0.62)}q${f(w * 0.3)} ${f(-6 * s)} ${f(w * 0.6)} 0`, { fill: 'none', stroke: '#c88a5a', 'stroke-width': 2, opacity: 0.6 }));
    }
    ppl.crocks = [1240, 690];
  }

  // ---- the hanok on the left: stone base, wooden posts, glowing paper doors, the curling tiled roof
  out.push(C('the family hanok: a stone base, wooden posts, glowing paper lattice doors, a curling tiled roof'));
  {
    out.push(path('M-20 690h470l10 34H-20Z', { fill: '#a89a84' }), line('M-20 706H456M80 690v34M200 690v34M330 690v34', '#7a6e5c', 2));
    out.push(path('M-20 512H436V660H-20Z', { fill: '#5a3a24' }));
    let lat = '';
    for (const [x0, x1] of [[10, 160], [180, 300], [320, 420]]) {
      out.push(path(`M${x0} 528H${x1}V648H${x0}Z`, { fill: url('door') }));
      for (let x = x0 + 15; x < x1; x += 15) lat += `M${x} 528V648`;
      for (let y = 543; y < 648; y += 15) lat += `M${x0} ${y}H${x1}`;
    }
    out.push(line(lat, '#a8744a', 1.6, { opacity: 0.85 }));
    out.push(path('M-20 650H446V672H-20Z', { fill: url('wood') }), line('M-20 654H446', '#d8a878', 2));
    out.push(path('M0 500h14v190H0zM166 500h14v190h-14zM304 500h14v190h-14zM428 492h14v198h-14z', { fill: '#8a5a34' }));
    out.push(path('M-20 494Q200 512 446 480V500Q200 528 -20 512Z', { fill: '#6a4428' }));
    // rafter ends under the eave
    let raft = '';
    for (let x = 0; x < 440; x += 18) raft += circD(x, 494 + Math.sin((x / 440) * Math.PI) * 6 - (x / 440) * 14, 3);
    out.push(path(raft, { fill: '#b8946a' }));
    // the roof
    out.push(path('M-30 472Q200 500 452 446L430 440Q300 438 160 408H-30Z', { fill: url('roof') }));
    let tiles = '';
    for (let x = -20; x < 450; x += 13) tiles += `M${x} 400Q${x + 4} 450 ${x + 2} 520`;
    out.push(G({ 'clip-path': url('rc') }, line(tiles, '#1e2438', 3.4), line('M-30 470Q200 498 452 444', '#4e5a78', 5)));
    out.push(path('M-30 398H150Q168 396 178 384L182 394Q172 412 152 414H-30Z', { fill: '#1e2438' }), line('M-30 412H152Q170 410 180 396', '#e8e4dc', 3));
    // the silk lantern (cheongsachorong): blue top, red body, glowing
    out.push(circle(388, 548, 34, { fill: '#ffd98a', opacity: 0.25 }), line('M388 496v26', '#2a2a2a', 2));
    out.push(path('M374 522h28l4 10h-36z', { fill: '#2a4ab8' }), path('M370 532h36l-2 32h-32z', { fill: '#e8243a' }), path('M376 534h24v28h-24z', { fill: '#ff8a6a', opacity: 0.5 }), path('M372 564h32l-4 8h-24z', { fill: '#2a4ab8' }), line('M380 572v12M388 572v14M396 572v12', '#ffc83a', 2));
    ppl.lantern = [388, 548];
    // two pairs of white rubber shoes (gomusin) on the step
    const shoe = (x, y) => path(`M${x} ${y}C${x} ${y - 8} ${x + 6} ${y - 10} ${x + 12} ${y - 10}H${x + 22}C${x + 27} ${y - 10} ${x + 31} ${y - 12} ${x + 35} ${y - 17}C${x + 33} ${y - 7} ${x + 29} ${y} ${x + 22} ${y}Z`, { fill: '#f6f6f2' }) + ellipse(x + 15, y - 9, 8, 2.4, { fill: '#c8ccd4' });
    out.push(shoe(26, 718), shoe(60, 720), shoe(104, 718), shoe(138, 720));
    ppl.shoes = [84, 710];
  }

  // ---- grandma and her granddaughter pinch songpyeon on the maru
  out.push(C('grandma and her granddaughter, in hanbok, pinch half-moon songpyeon on a little round soban table'));
  {
    const pinch = { sx: 1, elbow: [0.8, 1.0], hand: [1.3, 1.6] };
    const gm = figure({ x: 150, foot: 696, H: 116, heads: 3.2, skin: SKIN.warm, hair: '#e2dee8', style: 'bun', top: '#b8a0d8', bottom: '#5a3a7a', gaze: 0.5, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.4, 1.1], hand: [0.2, 1.7] }, pinch] });
    out.push(gm.svg, hanbok(gm, 150, 696, { chima: '#5a3a7a', jeogori: '#b8a0d8', goreum: '#7a3a9a', arms: [{ ...pinch, skin: SKIN.warm }] }));
    const hold = { sx: -1, elbow: [-0.7, 0.5], hand: [-1.1, -0.2] };
    const g = figure({ x: 300, foot: 698, H: 96, heads: 2.8, skin: SKIN.light, hair: HAIR, style: 'side', top: '#ffc83a', bottom: '#e8243a', gaze: -0.4, mouth: 'open', arms: [hold, { sx: 1, elbow: [0.5, 1.1], hand: [0.2, 1.7] }] });
    out.push(g.svg, hanbok(g, 300, 698, { chima: '#e8243a', jeogori: '#ffc83a', goreum: '#e8243a', saek: true, arms: [{ ...hold, skin: SKIN.light }] }));
    // a songpyeon held up proudly
    const gh = g.hand(hold);
    out.push(path(`M${P(gh[0] - 10, gh[1] - 8)}a10 8 0 0 1 20 0z`, { fill: '#ff9ab8' }));
    // the soban table and its plate of songpyeon
    out.push(ellipse(226, 662, 92, 18, { fill: '#8a2a1a' }), path('M150 664v26h10v-22M292 664v26h10v-22', { fill: '#6a1e12' }), ellipse(226, 658, 92, 16, { fill: '#a8382a' }));
    out.push(ellipse(214, 654, 46, 10, { fill: '#f4f0e8' }));
    let sp = '';
    const cols = ['#ffffff', '#ff9ab8', '#a8d878', '#ffd86a', '#ffffff', '#c89ad8'];
    cols.forEach((c, k) => { const x = 184 + (k % 3) * 22, y = 652 - Math.floor(k / 3) * 8; sp += path(`M${x - 10} ${y}a10 8 0 0 1 20 0z`, { fill: c }); });
    out.push(sp, ellipse(262, 652, 16, 7, { fill: '#e8e0d0' }), ellipse(262, 650, 12, 4, { fill: '#f8f4ec' }));
    ppl.songpyeon = [214, 650];
  }

  // ---- the chestnut basket by the step
  out.push(path('M456 724l6 -22h50l6 22z', { fill: '#c8945a' }), line('M462 712h50', '#a8743e', 2), path(circD(472, 700, 7) + circD(488, 696, 7) + circD(504, 700, 7) + circD(480, 690, 6) + circD(496, 690, 6), { fill: '#6a3a1e' }), path('M466 698l4 -4M482 694l4 -4M498 698l4 -4', { fill: 'none', stroke: '#c88a5a', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  ppl.chestnuts = [488, 704];

  // ---- the focal point: the family's ganggangsullae ring
  out.push(C('the focal point: the family hold hands in a ring and dance ganggangsullae under the moon; the girls wear rainbow-striped saekdong sleeves'));
  {
    // an open ring seen from the front: the ends curve back and up, so it reads as a circle turning
    const cx = 800, cy = 800, step = 112;
    const ring = [
      { k: -2, H: 158, skin: SKIN.fair, style: 'bun', chima: '#2a6ad8', jeogori: '#ffd0e0', goreum: '#c8245a', mouth: 'smile', gaze: 0.3 },
      { k: -1, H: 112, skin: SKIN.warm, style: 'short', jeogori: '#3aa85a', bottom: '#f0e8d0', pants: true, mouth: 'open', gaze: 0.2 },
      { k: 0, H: 120, skin: SKIN.light, style: 'puffs', chima: '#ff6a9a', jeogori: '#ffffff', goreum: '#e8243a', saek: true, mouth: 'open', gaze: 0 },
      { k: 1, H: 150, skin: SKIN.light, style: 'side', chima: '#7a3a9a', jeogori: '#a8e0c8', goreum: '#7a3a9a', mouth: 'smile', gaze: -0.3 },
      { k: 2, H: 118, skin: SKIN.fair, style: 'bob', chima: '#ffc83a', jeogori: '#ff8ac8', goreum: '#2a6ad8', saek: true, mouth: 'open', gaze: -0.2 },
    ];
    for (const d of ring) {
      d.x = cx + d.k * step * (1 - Math.abs(d.k) * 0.04); d.foot = cy - d.k * d.k * 9;
      d.H *= 1 - Math.abs(d.k) * 0.03;
      const r = d.H / (2.8 * 2);
      d.r = r; d.sy = d.foot - d.H + r + r * 1.35 + r * 0.45; d.tw = r * 1.9; d.arms = [];
    }
    // each pair of neighbors holds hands at a point between their shoulders, arms swung low in a V
    for (let k = 0; k + 1 < ring.length; k++) {
      const A = ring[k], B = ring[k + 1];
      const m = [(A.x + A.tw * 0.46 + B.x - B.tw * 0.46) / 2, Math.max(A.sy, B.sy) + Math.min(A.r, B.r) * 1.1];
      const arm = (F, sx) => {
        const hx = (m[0] - (F.x + sx * F.tw * 0.46)) / F.r, hy = (m[1] - F.sy) / F.r;
        return { sx, elbow: [hx * 0.55, hy * 0.5 + 0.35], hand: [hx, hy] };
      };
      A.arms.push(arm(A, 1)); B.arms.push(arm(B, -1));
    }
    // the two ends swing their free hands up
    ring[0].arms.push({ sx: -1, elbow: [-0.8, -0.3], hand: [-1.1, -1.4] });
    ring[4].arms.push({ sx: 1, elbow: [0.8, -0.3], hand: [1.1, -1.4] });
    const order = [...ring].sort((p, q) => p.foot - q.foot);
    for (const d of order) {
      const fig = figure({ x: d.x, foot: d.foot, H: d.H, heads: 2.8, skin: d.skin, hair: HAIR, style: d.style, top: d.jeogori, bottom: d.pants ? d.bottom : d.chima, shoe: d.pants ? '#2a3248' : '#ffffff', gaze: d.gaze, mouth: d.mouth, arms: d.arms });
      out.push(fig.svg, hanbok(fig, d.x, d.foot, { ...d, arms: d.arms.map((a) => ({ ...a, skin: d.skin })) }));
      if (d.pants) out.push(path(`M${P(d.x - d.tw * 0.5, fig.torsoTop + d.r * 1.4)}h${f(d.tw)}v${f(d.r * 0.9)}h${f(-d.tw)}z`, { fill: '#2a4ab8' }), circle(d.x + d.r * 0.2, fig.torsoTop + d.r * 1.7, d.r * 0.14, { fill: '#ffc83a' }));
      d.headY = fig.headY;
    }
    ppl.ring = [cx, cy - 30];
    ppl.mom = [ring[0].x, ring[0].headY + 50];
  }

  // ---- the white Jindo dog and a rabbit by the wall
  out.push(dog(1060, 836, 0.95, '#f4efe6', { flip: 1 }), path('M1040 790l-6 -12l10 6z', { fill: '#f4efe6' }));
  ppl.dog = [1060, 806];
  out.push(G({ transform: 'translate(1104 716)' }, ellipse(0, 0, 14, 11, { fill: '#f4f4f4' }), circle(-12, -8, 8, { fill: '#f4f4f4' }), ellipse(-14, -22, 3, 10, { fill: '#f4f4f4' }), ellipse(-8, -22, 3, 10, { fill: '#f4f4f4', transform: 'rotate(14 -8 -22)' }), ellipse(-14, -22, 1.4, 6, { fill: '#ffb0c0' }), circle(-15, -9, 1.6, { fill: '#2a1a1a' }), circle(13, 2, 4, { fill: '#ffffff' })));
  ppl.rabbit = [1096, 710];

  return { svg: compactSvg(doc(`Chuseok · mid. Concept: "ganggangsullae under the harvest moon" in the moonlit courtyard of a family hanok. Focal point: the family in bright hanbok holding hands in a ring dance (x 560–1040, y 600–830), the girls in rainbow-striped saekdong sleeves. On the maru in front of glowing paper doors, grandma and her granddaughter pinch half-moon songpyeon at a little round soban table; a red-and-blue silk lantern hangs from the curling tiled eave, white rubber shoes wait on the step, a basket of chestnuts. On the right a bare persimmon tree heavy with fruit with a magpie, onggi crocks on their stone terrace, a white Jindo dog; a white rabbit by the stone wall. Light story: cool moonlight from the upper right (the moon is the effect's), warm lamplight from the hanok on the left.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  const cosmos = (x, y, r, c) => {
    let d = '';
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; d += `M${P(x, y)}l${f(Math.cos(a - 0.22) * r)} ${f(Math.sin(a - 0.22) * r)}l${f(Math.cos(a + 0.22) * r * 0.5 - Math.cos(a - 0.22) * r * 0.5)} ${f(Math.sin(a + 0.22) * r * 0.5 - Math.sin(a - 0.22) * r * 0.5)}z`; }
    return path(d, { fill: c, stroke: c, 'stroke-width': r * 0.3, 'stroke-linejoin': 'round' }) + circle(x, y, r * 0.22, { fill: '#ffc83a' });
  };
  return compactSvg(doc(`Chuseok · front: autumn cosmos in pink, white and magenta in the bottom corners, a red dragonfly; the center stays open`, [], [
    C('cosmos stems and flowers, bottom left'),
    line('M30 900q10 -60 0 -110M70 900q-6 -50 14 -90M120 900q6 -40 -6 -70', '#3a6a3a', 3.4),
    cosmos(30, 790, 22, '#ff8ac8'), cosmos(84, 810, 18, '#ffffff'), cosmos(114, 830, 16, '#d0408a'),
    C('cosmos, bottom right'),
    line('M1560 900q-10 -70 4 -120M1520 900q6 -50 -10 -84M1490 900q-4 -30 8 -56', '#3a6a3a', 3.4),
    cosmos(1564, 780, 22, '#ffffff'), cosmos(1510, 816, 18, '#ff8ac8'), cosmos(1498, 844, 15, '#d0408a'),
    C('a red dragonfly'),
    G({ transform: 'translate(1520 728) rotate(-12)' }, line('M0 0h30', '#e8402a', 4), ellipse(10, -6, 12, 4, { fill: '#ffffff', opacity: 0.6 }), ellipse(10, 6, 12, 4, { fill: '#ffffff', opacity: 0.6 }), circle(-2, 0, 4, { fill: '#e8402a' })),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'wish', x: r(ppl.ring[0]), y: r(ppl.ring[1]), r: 70, label: 'Make a wish on the harvest moon' },
      { activity: 'dressup', x: r(ppl.mom[0]), y: r(ppl.mom[1]), r: 40, label: 'Dress up in hanbok' },
      { activity: 'color', x: r(ppl.songpyeon[0]), y: r(ppl.songpyeon[1]), r: 36, label: 'Color the songpyeon' },
      { activity: 'card', x: 86, y: 588, r: 40, label: 'Make a Chuseok card' },
      { activity: 'catch', x: r(ppl.persimmon[0]), y: r(ppl.persimmon[1]), r: 44, label: 'Catch persimmons' },
      { activity: 'memory', x: ppl.crocks[0], y: ppl.crocks[1], r: 40, label: 'Harvest memory game' },
    ],
    findables: [
      { id: 'magpie', label: 'a magpie', x: ppl.magpie[0], y: ppl.magpie[1], r: 26 },
      { id: 'rabbit', label: 'a white rabbit', x: ppl.rabbit[0], y: ppl.rabbit[1], r: 22 },
      { id: 'jindo', label: 'a white Jindo dog', x: ppl.dog[0], y: ppl.dog[1], r: 30 },
      { id: 'shoes', label: 'white rubber shoes', x: ppl.shoes[0], y: ppl.shoes[1], r: 22 },
      { id: 'chestnuts', label: 'a basket of chestnuts', x: ppl.chestnuts[0], y: ppl.chestnuts[1], r: 22 },
      { id: 'lantern', label: 'a silk lantern', x: ppl.lantern[0], y: ppl.lantern[1] + 30, r: 18 },
      { id: 'dragonfly', label: 'a red dragonfly', x: 1534, y: 726, r: 18 },
    ],
  };
}
