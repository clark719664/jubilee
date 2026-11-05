// Eid al-Adha — "Sharing the feast": a courtyard on Eid evening, everyone in their best new clothes. Round a
// low sofra under a shady fig tree the family share big dishes of rice, flatbread, dates and maamoul; grandpa gives
// a shiny coin of Eidi to the littlest; a boy and his sister carry a covered tray of food out through the gate to the
// neighbor, who waves from her door. Beyond the low wall a toddler pats a woolly lamb beside its mother in a little
// meadow; bunting with crescents and stars crosses the courtyard; the mosque's green dome and minaret rise behind.
// The moon, the stars, the lattice and the hanging lanterns are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, line, circD } from '../../kit/scenekit.mjs';

const ID = 'eid-al-adha';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const GOLD = '#ffc83a', GREEN = '#1a8a6a';
const YARD = 720;

/** A hijab over a figure's head. */
function hijab(fg, x, col) {
  const r = fg.r, hy = fg.headY;
  const outer = `M${P(x - r * 1.18, fg.torsoTop + r * 0.5)}C${P(x - r * 1.3, hy + r * 0.2)} ${P(x - r * 1.28, hy - r * 1.28)} ${P(x, hy - r * 1.3)}C${P(x + r * 1.28, hy - r * 1.28)} ${P(x + r * 1.3, hy + r * 0.2)} ${P(x + r * 1.18, fg.torsoTop + r * 0.5)}Z`;
  const face = `M${P(x - r * 0.8, hy + r * 0.05)}a${f(r * 0.8)} ${f(r * 0.9)} 0 1 0 ${f(r * 1.6)} 0a${f(r * 0.8)} ${f(r * 0.9)} 0 1 0 ${f(-r * 1.6)} 0Z`;
  return path(outer + face, { fill: col, 'fill-rule': 'evenodd' });
}
/** A kufi cap. */
const kufi = (x, hy, r, col) => path(`M${P(x - r * 0.95, hy - r * 0.45)}C${P(x - r * 0.9, hy - r * 1.25)} ${P(x + r * 0.9, hy - r * 1.25)} ${P(x + r * 0.95, hy - r * 0.45)}Z`, { fill: col }) + path(`M${P(x - r * 0.9, hy - r * 0.6)}h${f(r * 1.8)}`, { fill: 'none', stroke: GOLD, 'stroke-width': f(r * 0.1) });

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(4);
  let houses = '', wins = '';
  for (let x = 250; x < 1300;) { const w = 80 + R() * 70, top = 480 + R() * 40; houses += `M${P(x, 640)}V${f(top)}H${f(x + w)}V640Z`; wins += `M${P(x + w * 0.3, top + 20)}h12v16h-12Z`; x += w + 6; }
  const defs = [lin(id('dome'), 0, 0, 0, 1, [[0, '#3ac89a'], [1, GREEN]])];
  return compactSvg(doc(`Eid al-Adha · back: the evening sky (the effect draws its moon and stars); sand-colored houses with flat roofs and lit windows kept low; the mosque's green dome and slender minaret on the right, outside the copy zone`, defs, [
    C('the town'),
    path(houses, { fill: '#c8b090' }), path(wins, { fill: '#ffd98a', opacity: 0.9 }),
    C('the mosque'),
    path('M1330 640V520H1560V640Z', { fill: '#f4ead8' }), path('M1350 520a95 90 0 0 1 190 0Z', { fill: url('dome') }), path('M1441 432v-22h8v22zM1436 414q9 -18 18 0q-9 -8 -18 0z', { fill: GOLD }),
    path('M1570 640V330h24V640Z', { fill: '#f4ead8' }), path('M1566 334l16 -46l16 46z', { fill: url('dome') }), path('M1564 420h36v8h-36zM1564 520h36v8h-36z', { fill: '#d8c8a8' }),
    path('M1420 640v-50a25 25 0 0 1 50 0v50z', { fill: '#8a6a4a' }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('tiles'), 0, 0, 0, 1, [[0, '#e8d4b8'], [1, '#c8b090']]),
    lin(id('wall'), 0, 0, 0, 1, [[0, '#f4e4cc'], [1, '#e0ccae']]),
    lin(id('wood'), 0, 0, 0, 1, [[0, '#a8743e'], [1, '#7a4e26']]),
    lin(id('meadow'), 0, 0, 0, 1, [[0, '#9ad07a'], [1, '#6ab05a']]),
    lin(id('rug'), 0, 0, 1, 0, [[0, '#a8243a'], [0.5, '#c8384a'], [1, '#a8243a']]),
  ];

  // ---- the courtyard floor and its low wall with a gate
  out.push(C('the courtyard: patterned tiles, a low wall with an arched gate on the right and a little meadow beyond'));
  out.push(path(`M1180 ${YARD - 40}H1620V${YARD + 40}H1180Z`, { fill: url('meadow') }));
  out.push(path(`M-20 ${YARD}H1620V920H-20Z`, { fill: url('tiles') }));
  { let t = ''; for (let y = YARD + 24; y < 920; y += 30 + (y - YARD) * 0.08) t += `M-20 ${f(y)}H1620`; for (let x = -40; x < 1660; x += 70) t += `M${x} ${YARD}L${f(800 + (x - 800) * 1.5)} 920`; out.push(line(t, '#b89a78', 1.6, { opacity: 0.6 })); }
  out.push(path(`M-20 ${YARD}V600H1080V${YARD}ZM1220 ${YARD}V600H1300V${YARD}Z`, { fill: url('wall') }), path('M-20 600H1080v-8H-20ZM1220 600h80v-8h-80Z', { fill: '#d8c4a4' }));
  { let tiles = ''; for (let x = 0; x < 1080; x += 40) tiles += `M${x + 20} 620l10 10l-10 10l-10 -10z`; out.push(path(tiles, { fill: '#2a8ab8', opacity: 0.7 })); }
  out.push(path(`M1080 ${YARD}V600a70 60 0 0 1 140 0V${YARD}`, { fill: 'none', stroke: '#d8c4a4', 'stroke-width': 12 }));

  // ---- the fig tree giving shade, and bunting with crescents and stars
  out.push(C('a big fig tree on the left; bunting with crescents and stars, low across the courtyard'));
  {
    const t = bareTree(120, YARD, 400, 9, { lean: 0.04, depth: 5, spread: 0.55, trunk: 0.13 });
    out.push(path(t.d, { fill: '#7a5a3a' }));
    let leaves = '';
    for (const [x, y] of t.tips) leaves += circD(x, y, 34);
    out.push(path(leaves, { fill: '#4a9a4a' }), path(t.tips.filter((_, i) => i % 2 === 0).map(([x, y]) => circD(x + 8, y + 10, 5)).join(''), { fill: '#7a3a6a' }));
    const cols = ['#1a8a6a', GOLD, '#ffffff', '#2a6ad8'];
    const flags = cols.map(() => '');
    let rope = '', n = 0;
    for (const [a, b] of [[[260, 480], [700, 512]], [[700, 512], [1080, 486]]]) {
      const m = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 30];
      rope += `M${P(...a)}Q${P(...m)} ${P(...b)}`;
      for (let k = 1; k < 9; k++) { const t2 = k / 9, x = (1 - t2) * (1 - t2) * a[0] + 2 * (1 - t2) * t2 * m[0] + t2 * t2 * b[0], y = (1 - t2) * (1 - t2) * a[1] + 2 * (1 - t2) * t2 * m[1] + t2 * t2 * b[1]; flags[n % 4] += `M${P(x - 14, y)}h28l-14 26z`; n++; }
    }
    out.push(line(rope, '#8a6a4a', 2));
    flags.forEach((d, k) => out.push(path(d, { fill: cols[k] })));
  }

  // ---- the family round the low sofra
  out.push(C('the family round a low sofra on a red rug: grandpa in a kufi gives the littlest a coin of Eidi, grandma in a hijab, mum, dad'));
  {
    const seat = 836;
    out.push(path('M280 900L330 780H960L1010 900Z', { fill: url('rug') }), path('M296 892L340 790H950L994 892', { fill: 'none', stroke: GOLD, 'stroke-width': 4, 'stroke-dasharray': '10 6' }));
    const sitter = (x, o) => figure({ x, foot: seat, H: o.H ?? 140, heads: o.heads ?? 3.2, skin: o.skin, hair: o.hair, style: o.style ?? 'short', top: o.top, bottom: o.top, gaze: o.gaze ?? 0, mouth: o.mouth ?? 'smile', arms: o.arms });
    const coin = { sx: 1, elbow: [0.9, 0.6], hand: [1.6, 0.7] };
    const gp = sitter(420, { skin: SKIN.brown, hair: '#dcd8e0', top: '#ffffff', gaze: 0.5, arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.2, 1.6] }, coin] });
    out.push(gp.svg, kufi(420, gp.headY, gp.r, '#ffffff'));
    out.push(path(`M${P(420 - gp.r * 0.7, gp.headY + gp.r * 0.3)}Q${P(420, gp.headY + gp.r * 1.5)} ${P(420 + gp.r * 0.7, gp.headY + gp.r * 0.3)}Q${P(420, gp.headY + gp.r * 0.8)} ${P(420 - gp.r * 0.7, gp.headY + gp.r * 0.3)}Z`, { fill: '#e8e4ec' }));
    const ch = gp.hand(coin);
    out.push(circle(ch[0] + 6, ch[1] - 8, 7, { fill: GOLD }), circle(ch[0] + 6, ch[1] - 8, 4, { fill: 'none', stroke: '#c8901e', 'stroke-width': 1.6 }), circle(ch[0], ch[1], gp.r * 0.34, { fill: SKIN.brown }));
    out.push(path(`M${P(ch[0] - 6, ch[1] - 28)}l-6 -6M${P(ch[0] + 6, ch[1] - 32)}v-8M${P(ch[0] + 18, ch[1] - 28)}l6 -6`, { fill: 'none', stroke: '#ffe9a3', 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
    ppl.coin = [ch[0] + 6, ch[1] - 8];
    const gm = sitter(650, { skin: SKIN.fair, hair: '#e6e2ee', top: '#1a8a6a', gaze: -0.2, arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.2, 1.6] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.2, 1.6] }] });
    out.push(gm.svg, hijab(gm, 650, '#f4ecd8'));
    const mum = sitter(780, { skin: SKIN.tan, hair: '#1a1210', top: '#8a4ad8', gaze: 0.2, arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.2, 1.6] }, { sx: 1, elbow: [0.8, 0.6], hand: [1.2, 0.9] }] });
    out.push(mum.svg, hijab(mum, 780, '#ff8a5a'));
    const dad = sitter(900, { H: 146, skin: SKIN.tan, hair: '#1a1210', top: '#2a5aa8', gaze: -0.4, arms: [{ sx: -1, elbow: [-0.8, 0.6], hand: [-1.2, 0.9] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.2, 1.6] }] });
    out.push(dad.svg, kufi(900, dad.headY, dad.r, '#2a2a3a'), path(`M${P(900 - dad.r * 0.7, dad.headY + dad.r * 0.3)}Q${P(900, dad.headY + dad.r * 1.3)} ${P(900 + dad.r * 0.7, dad.headY + dad.r * 0.3)}Q${P(900, dad.headY + dad.r * 0.8)} ${P(900 - dad.r * 0.7, dad.headY + dad.r * 0.3)}Z`, { fill: '#1a1210' }));
    // the low sofra with the dishes
    out.push(path('M340 800h620v14H340zM360 814v26h16v-26zM924 814v26h16v-26z', { fill: url('wood') }));
    const dish = (x, w, inner) => ellipse(x, 794, w, 10, { fill: '#ffffff' }) + inner;
    out.push(dish(420, 50, path('M384 792q36 -36 72 0z', { fill: '#f4d080' }) + path(circD(404, 782, 5) + circD(424, 776, 5) + circD(440, 784, 5), { fill: '#a85a2a' }) + path('M396 778l4 -4M432 776l4 -4', { fill: 'none', stroke: '#3aa85a', 'stroke-width': 3 })));
    out.push(dish(540, 40, ellipse(540, 790, 32, 7, { fill: '#e8c088' }) + ellipse(530, 786, 24, 5, { fill: '#f0d0a0' })));
    out.push(dish(650, 34, path(circD(636, 788, 6) + circD(650, 786, 6) + circD(664, 788, 6) + circD(643, 780, 5) + circD(657, 780, 5), { fill: '#6a2a1a' })));
    out.push(dish(760, 40, path(circD(744, 788, 8) + circD(762, 786, 8) + circD(780, 788, 8) + circD(754, 778, 7) + circD(772, 778, 7), { fill: '#e8b870' }) + path(circD(744, 786, 2) + circD(762, 784, 2) + circD(780, 786, 2), { fill: '#ffffff' })));
    out.push(path('M860 800v-30q0 -6 6 -6h24q6 0 6 6v30z', { fill: '#d8a020' }), path('M896 776q12 2 10 12q-2 8 -10 8', { fill: 'none', stroke: '#d8a020', 'stroke-width': 4 }), path('M870 764l-6 -8h20', { fill: 'none', stroke: '#d8a020', 'stroke-width': 3 }));
    // the littlest, standing to take the coin
    const reach = { sx: -1, elbow: [-0.8, -0.2], hand: [-1.3, -0.4] };
    const tod = figure({ x: 540, foot: 884, H: 70, heads: 2.4, skin: SKIN.brown, hair: '#1a1210', style: 'puffs', top: '#ff8fb8', bottom: '#ff8fb8', shoe: '#ffd23a', gaze: -0.5, mouth: 'open', arms: [reach, { sx: 1, elbow: [0.8, -0.6], hand: [1.0, -1.4] }] });
    out.push(tod.svg);
    ppl.feast = [650, 790];
    ppl.dates = [650, 784];
  }

  // ---- the children carrying food to the neighbor (sharing)
  out.push(C('a boy and his sister carry a covered tray of food out through the gate to the neighbor, who waves from her door'));
  {
    const carry = (s) => ({ sx: s, elbow: [s * 0.7, 1.0], hand: [s * 0.4, 1.4] });
    const b = figure({ x: 1100, foot: 858, H: 86, heads: 2.7, skin: SKIN.light, hair: '#1a1210', style: 'short', top: '#ffffff', bottom: '#2a2a3a', shoe: '#2a1a14', gaze: 0.5, mouth: 'smile', arms: [carry(-1), carry(1)] });
    const g = figure({ x: 1180, foot: 862, H: 80, heads: 2.7, skin: SKIN.light, hair: '#3a2214', style: 'bob', top: '#ffd23a', bottom: '#2a6ad8', shoe: '#ffffff', gaze: 0.5, mouth: 'smile', arms: [carry(-1), carry(1)] });
    out.push(b.svg, kufi(1100, b.headY, b.r, '#1a8a6a'), g.svg);
    const bh = b.hand(carry(1)), gh = g.hand(carry(-1));
    const ty = Math.min(bh[1], gh[1]) - 6;
    out.push(path(`M${P(bh[0] - 30, ty)}H${f(gh[0] + 30)}v8H${f(bh[0] - 30)}z`, { fill: '#c8a050' }), path(`M${P(bh[0] - 20, ty)}a${f((gh[0] - bh[0] + 40) / 2)} 30 0 0 1 ${f(gh[0] - bh[0] + 40)} 0z`, { fill: '#d8dce8' }), circle((bh[0] + gh[0]) / 2, ty - 30, 5, { fill: '#a8b0c0' }));
    out.push(line(`M${P((bh[0] + gh[0]) / 2 - 20, ty - 46)}c-6 -10 4 -16 -2 -26M${P((bh[0] + gh[0]) / 2 + 10, ty - 44)}c-6 -10 4 -16 -2 -26`, '#ffffff', 2.4, { opacity: 0.7 }));
    for (const [p, fg, sk] of [[b.hand(carry(-1)), b, SKIN.light], [bh, b, SKIN.light], [gh, g, SKIN.light], [g.hand(carry(1)), g, SKIN.light]]) out.push(circle(p[0], p[1], fg.r * 0.36, { fill: sk }));
    ppl.tray = [(bh[0] + gh[0]) / 2, ty - 16];
    // the neighbor at her door, beyond the gate
    out.push(path('M1360 720V560h140V720Z', { fill: '#f4e4cc' }), path('M1350 560h160l-80 -40z', { fill: '#c86a3a' }), path('M1400 720v-100a30 30 0 0 1 60 0v100z', { fill: '#2a6ad8' }));
    const wave = { sx: -1, elbow: [-0.9, -0.6], hand: [-1.2, -1.8] };
    const nb = figure({ x: 1430, foot: 722, H: 110, heads: 3.2, skin: SKIN.deep, hair: '#1a1210', style: 'bun', top: '#ff8a1a', bottom: '#ff8a1a', gaze: -0.5, mouth: 'smile', arms: [wave, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.8] }] });
    out.push(nb.svg, hijab(nb, 1430, '#2ab8a8'));
    ppl.neighbor = [1430, nb.headY];
  }

  // ---- the lamb and its mother in the meadow, a toddler patting the lamb
  out.push(C('in the little meadow beyond the gate a toddler pats a woolly lamb beside its mother'));
  {
    const sheep = (x, y, s, flip = 1) => G({ transform: `translate(${x} ${y}) scale(${s * flip} ${s})` },
      ellipse(0, 4, 34, 5, { fill: '#000', opacity: 0.12 }),
      path('M-20 -4v6M-8 -2v6M10 -2v6M22 -4v6', { fill: 'none', stroke: '#3a3a40', 'stroke-width': 4, 'stroke-linecap': 'round' }),
      path('M-30 -10c-10 0 -12 -14 -4 -18c-4 -12 10 -20 18 -12c4 -12 22 -12 26 0c12 -6 22 4 18 14c10 4 8 18 -4 18z', { fill: '#fbf7f0' }),
      ellipse(-34, -22, 10, 13, { fill: '#3a3a40', transform: 'rotate(18 -34 -22)' }), path('M-42 -30q-10 -2 -10 6q8 0 10 -6zM-28 -32q8 -6 10 2q-6 2 -10 -2z', { fill: '#3a3a40' }),
      circle(-37, -24, 2.2, { fill: '#ffffff' }), circle(-37, -24, 1.1, { fill: '#1a1a1a' }), path('M-40 -36c4 -6 10 -6 12 0c-4 -2 -8 -2 -12 0z', { fill: '#fbf7f0' }));
    out.push(sheep(1270, 708, 1.1, -1), sheep(1330, 716, 0.75, -1));
    const pat = { sx: 1, elbow: [0.8, -0.2], hand: [1.3, -0.2] };
    const t = figure({ x: 1248, foot: 726, H: 50, heads: 2.3, skin: SKIN.fair, hair: '#c8642a', style: 'short', top: '#5ab8e8', bottom: '#2a5aa8', shoe: '#e8343a', gaze: 0.5, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 0.8], hand: [-0.4, 1.6] }, pat] });
    out.push(t.svg);
    ppl.lamb = [1330, 696];
  }

  return { svg: compactSvg(doc(`Eid al-Adha · mid. Concept: "sharing the feast" on Eid evening, everyone in their best new clothes. Focal point: the family round a low sofra on a red rug under a fig tree (x 280–1010, y 620–900) sharing big dishes of rice, flatbread, dates and maamoul and a brass jug; grandpa in a white kufi gives the littlest a shiny coin of Eidi. On the right a boy and his sister carry a covered tray of food out through the gate to the neighbor, who waves from her blue door; beyond the low tiled wall a toddler pats a woolly lamb beside its mother in a little meadow. Bunting with crescents and stars crosses the courtyard; the mosque's green dome and minaret rise behind. Light story: a warm glow from the lantern and lit windows under the evening sky. The moon, stars, lattice and hanging lanterns are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Eid al-Adha · front: a brass lantern on the tiles bottom left and a pot of jasmine bottom right; the center stays open`, [
    rad(id('fglow'), 0.5, 0.5, 0.5, [[0, '#ffd98a', 0.5], [1, '#ffd98a', 0]]),
  ], [
    C('a brass lantern'),
    circle(70, 850, 60, { fill: url('fglow') }), path('M50 900v-60h40v60zM44 840h52l-10 -16h-32z', { fill: '#c8901e' }), path('M56 894v-48h28v48z', { fill: '#ffe08a' }),
    C('a pot of jasmine'),
    path('M1490 900l10 -54h100l10 54z', { fill: '#2a8ab8' }),
    path(circD(1516, 822, 22) + circD(1552, 812, 26) + circD(1588, 826, 22), { fill: '#3a8a4a' }),
    path(circD(1508, 812, 5) + circD(1530, 826, 5) + circD(1550, 800, 5) + circD(1572, 818, 5) + circD(1592, 810, 5), { fill: '#ffffff' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'card', x: r(ppl.tray[0]), y: r(ppl.tray[1]), r: 40, label: 'Send an Eid card to the neighbors' },
      { activity: 'memory', x: ppl.feast[0], y: ppl.feast[1], r: 56, label: 'Match the Eid feast' },
      { activity: 'color', x: ppl.lamb[0], y: ppl.lamb[1], r: 36, label: 'Color the woolly lamb' },
      { activity: 'dressup', x: r(ppl.neighbor[0]), y: r(ppl.neighbor[1] + 30), r: 46, label: 'Dress up in Eid best clothes' },
    ],
    findables: [
      { id: 'coin', label: 'a shiny coin of Eidi', x: r(ppl.coin[0]), y: r(ppl.coin[1]), r: 14 },
      { id: 'dates', label: 'a bowl of dates', x: ppl.dates[0], y: ppl.dates[1], r: 20 },
      { id: 'figs', label: 'figs on the tree', x: 140, y: 420, r: 40 },
      { id: 'jug', label: 'a brass jug', x: 878, y: 784, r: 18 },
      { id: 'dome', label: 'the green dome', x: 1445, y: 480, r: 40 },
      { id: 'lamb', label: 'a little lamb', x: ppl.lamb[0], y: ppl.lamb[1], r: 22 },
      { id: 'lantern', label: 'a brass lantern', x: 70, y: 864, r: 26 },
    ],
  };
}
