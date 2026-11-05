// Rosh Hashanah — "A sweet new year in the orchard": sundown at the edge of an apple orchard as the new year begins.
// A girl on a ladder picks the reddest apple while her brother holds up the basket; on a picnic blanket mum helps
// the toddler dip an apple slice into the honey jar (a bee watches, hopefully), beside a round spiral challah and a
// split pomegranate; grandpa the beekeeper, in his veiled hat, lifts a dripping golden honeycomb frame from the
// painted hives; and on the knoll dad blows the long curling shofar towards the setting sun. The falling apples
// and honey pots are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, hedgehog, line, circD, ellD } from '../../kit/scenekit.mjs';

const ID = 'rosh-hashanah';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SKIN = { light: '#f0c8a8', fair: '#e4b08a', olive: '#c8946a', tan: '#b07a50', brown: '#8a5a3a' };
const GROUND = 700;

/** A little honey bee, facing left, at (x, y). */
const bee = (x, y, s = 1) => G({ transform: `translate(${f(x)} ${f(y)}) scale(${s})` },
  ellipse(2, -8, 6, 8, { fill: '#ffffff', opacity: 0.75, transform: 'rotate(-20 2 -8)' }), ellipse(8, -7, 5, 7, { fill: '#ffffff', opacity: 0.75, transform: 'rotate(20 8 -7)' }),
  ellipse(4, 0, 10, 7, { fill: '#ffc83a' }), path('M1 -6.6v13.2M7 -6v12', { fill: 'none', stroke: '#2a1a0a', 'stroke-width': 2.6 }),
  circle(-6, -1, 5, { fill: '#2a1a0a' }), circle(-7.4, -2.2, 1.2, { fill: '#ffffff' }), path('M14 0l4 0', { fill: 'none', stroke: '#2a1a0a', 'stroke-width': 1.6 }));

/** Honeycomb hexes filling a box. */
function combD(x0, y0, x1, y1, s) {
  let d = '';
  const h = s * Math.sqrt(3) / 2;
  for (let row = 0, y = y0 + h; y < y1; row++, y += h) for (let x = x0 + s * 0.6 + (row % 2) * s * 0.75; x < x1 - s * 0.4; x += s * 1.5) {
    d += `M${P(x - s / 2, y)}l${f(s / 4)} ${f(-h / 2)}h${f(s / 2)}l${f(s / 4)} ${f(h / 2)}l${f(-s / 4)} ${f(h / 2)}h${f(-s / 2)}z`;
  }
  return d;
}

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(5);
  let rows = '';
  for (let k = 0; k < 16; k++) { const x = 360 + k * 62 + R() * 10, y = 604 + Math.sin(k * 0.7) * 8; rows += circD(x, y - 16, 20 + R() * 5) + circD(x + 12, y - 10, 14); }
  const defs = [
    rad(id('sun'), 0.5, 0.5, 0.5, [[0, '#fff0b0', 0.95], [0.25, '#ffc860', 0.5], [1, '#ff8a3a', 0]]),
    lin(id('far'), 0, 0, 0, 1, [[0, '#a8486a'], [1, '#7a3a5a']]),
  ];
  return compactSvg(doc(`Rosh Hashanah · back: the sun setting low behind the hills on the right; soft plum and rose hills, kept low behind the copy, with a far row of round orchard trees`, defs, [
    C('the setting sun, low on the right, behind the hills'),
    circle(1380, 560, 300, { fill: url('sun') }), circle(1380, 566, 70, { fill: '#fff4c8' }),
    C('a skein of birds flying home into the sunset'),
    path('M1340 320q8 -8 16 0q8 -8 16 0M1386 300q7 -7 14 0q7 -7 14 0M1300 344q7 -7 14 0q7 -7 14 0M1428 282q6 -6 12 0q6 -6 12 0', { fill: 'none', stroke: '#5a1e2a', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    C('far hills, rose and plum'),
    path('M-20 560C140 520 300 520 460 548C620 576 780 586 940 576C1100 566 1240 538 1400 556C1500 566 1560 580 1620 586V720H-20Z', { fill: url('far') }),
    path('M-20 610C200 592 420 600 640 612C860 624 1080 620 1300 606C1440 598 1540 602 1620 608V720H-20Z', { fill: '#6a3a50' }),
    C('a far row of orchard trees'),
    path(rows, { fill: '#7a3e5c' }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('grass'), 0, 0, 0, 1, [[0, '#8ab04a'], [1, '#5a8a3a']]),
    lin(id('knoll'), 0, 0, 0, 1, [[0, '#9ab85a'], [1, '#6a9a44']]),
    rad(id('apple'), 0.35, 0.3, 0.7, [[0, '#ff6a5a'], [1, '#c8102e']]),
    rad(id('honey'), 0.4, 0.35, 0.75, [[0, '#ffe08a'], [0.6, '#ffb020'], [1, '#d88a10']]),
    rad(id('glow'), 0.5, 0.5, 0.5, [[0, '#ffd27a', 0.45], [1, '#ffd27a', 0]]),
    lin(id('wood'), 0, 0, 0, 1, [[0, '#c8945a'], [1, '#9a6a3a']]),
  ];

  // ---- the meadow, the knoll on the right, the warm light from the sunset
  out.push(C('the meadow at the orchard\'s edge, a knoll on the right against the sunset'));
  out.push(path(`M-20 ${GROUND - 20}Q600 ${GROUND - 40} 1100 ${GROUND - 24}T1620 ${GROUND - 30}V920H-20Z`, { fill: url('grass') }));
  out.push(path('M1230 920C1260 760 1340 668 1460 652C1540 644 1600 650 1620 656V920Z', { fill: url('knoll') }));
  out.push(ellipse(1360, 700, 380, 140, { fill: url('glow') }));

  // ---- the apple tree with its ladder, the girl picking and her brother with the basket
  out.push(C('a big apple tree; a girl on the ladder picks the reddest apple, her brother holds up the basket'));
  {
    const t = bareTree(170, GROUND + 50, 330, 14, { lean: 0.05, depth: 5, spread: 0.62, trunk: 0.12 });
    out.push(path(t.d, { fill: '#6a4a30' }));
    out.push(path(t.tips.map(([x, y]) => circD(x, y, 40)).join(''), { fill: '#4a8a3a' }));
    out.push(path(t.tips.map(([x, y]) => circD(x - 8, y - 10, 26)).join(''), { fill: '#64a448' }));
    const apples = t.tips.filter((_, i) => i % 2 === 0).map(([x, y], i) => circD(x + (i % 3 - 1) * 14, y + 14, 9)).join('');
    out.push(path(apples, { fill: url('apple') }));
    ppl.tree = [170, 470];
    // a bird in the branches
    const [bx, by] = t.tips[Math.floor(t.tips.length * 0.2)];
    out.push(G({ transform: `translate(${f(bx + 10)} ${f(by + 30)})` }, ellipse(0, 0, 11, 8, { fill: '#5a8ad8' }), circle(-8, -5, 6, { fill: '#5a8ad8' }), path('M-14 -6l-6 2l6 2z', { fill: '#ffb020' }), circle(-9, -6, 1.3, { fill: '#1a1a1a' }), ellipse(-2, 3, 6, 4, { fill: '#ffd8b0' }), path('M10 -2l10 -4l-2 8z', { fill: '#3a6ab8' })));
    ppl.bird = [bx + 6, by + 28];
    // the ladder
    out.push(line('M300 760L250 470M352 760L304 470', '#a8743e', 8), line([0, 1, 2, 3, 4, 5].map((k) => { const y = 740 - k * 50; const t0 = (760 - y) / 290; return `M${f(300 - 50 * t0)} ${y}H${f(352 - 48 * t0)}`; }).join(''), '#a8743e', 6));
    // the girl on the ladder, reaching up for an apple
    const reach = { sx: -1, elbow: [-0.6, -1.0], hand: [-0.9, -2.2] };
    const g = figure({ x: 300, foot: 594, H: 116, heads: 2.8, skin: SKIN.olive, hair: '#3a2014', style: 'curls', top: '#ff8a3a', bottom: '#2a5aa8', shoe: '#e8243a', gaze: -0.5, mouth: 'open', arms: [reach, { sx: 1, elbow: [0.6, 0.8], hand: [0.1, 1.4] }] });
    out.push(g.svg);
    const gh = g.hand(reach);
    out.push(circle(gh[0] - 2, gh[1] - 10, 13, { fill: url('apple') }), path(`M${P(gh[0] - 2, gh[1] - 22)}l2 -8M${P(gh[0], gh[1] - 26)}q8 -6 14 -2q-6 6 -14 2z`, { fill: '#3a8a3a', stroke: '#5a3a1a', 'stroke-width': 1.6 }));
    ppl.girl = [gh[0], gh[1] - 10];
    // the brother below, holding the basket up
    const hold = (s) => ({ sx: s, elbow: [s * 0.6, 0.9], hand: [s * 0.1, 0.9] });
    const b = figure({ x: 400, foot: 790, H: 108, heads: 2.7, skin: SKIN.olive, hair: '#3a2014', style: 'short', top: '#3aa86a', bottom: '#4a3a2a', shoe: '#ffffff', gaze: -0.6, mouth: 'open', arms: [hold(-1), hold(1)] });
    out.push(b.svg);
    const bh = b.hand(hold(-1));
    out.push(path(`M${P(bh[0] - 6, bh[1] - 4)}h${f(b.tw * 0.92 + 24)}l-8 30h${f(-(b.tw * 0.92 + 8))}z`, { fill: url('wood') }), path(circD(bh[0] + 10, bh[1] - 8, 10) + circD(bh[0] + 28, bh[1] - 10, 10) + circD(bh[0] + 46, bh[1] - 8, 10), { fill: url('apple') }), line(`M${P(bh[0] - 2, bh[1] + 8)}h${f(b.tw * 0.92 + 18)}M${P(bh[0], bh[1] + 18)}h${f(b.tw * 0.92 + 10)}`, '#8a5a2a', 2));
    ppl.basket = [bh[0] + 26, bh[1] + 6];
    // a hedgehog sniffing a fallen apple, with a worm peeking out of it
    out.push(hedgehog(110, 806, 1), circle(60, 800, 12, { fill: url('apple') }), path('M54 792q-2 -10 6 -12q6 0 6 6', { fill: 'none', stroke: '#ff9ab0', 'stroke-width': 5, 'stroke-linecap': 'round' }), circle(59, 781, 1.2, { fill: '#2a1a1a' }));
    ppl.hedgehog = [110, 790]; ppl.worm = [60, 790];
  }

  // ---- the picnic blanket: mum and the toddler dip apple in honey, a round challah, a pomegranate
  out.push(C('the focal point: on a picnic blanket mum helps the toddler dip an apple slice into the honey jar; a round spiral challah, a split pomegranate, a plate of apple slices; a bee watches hopefully'));
  {
    out.push(path('M520 760L960 744L1010 846L480 862Z', { fill: '#3a7ac8' }));
    let check = '';
    for (let k = 1; k < 6; k++) { check += `M${f(520 - k * 7.6)} ${f(760 + k * 17)}L${f(960 + k * 10)} ${f(744 + k * 17)}`; check += `M${f(520 + k * 73)} ${f(760 - k * 2.7)}L${f(480 + k * 88)} ${f(862 - k * 2.7)}`; }
    out.push(line(check, '#ffffff', 6, { opacity: 0.55 }));
    // mum, kneeling
    const help = { sx: 1, elbow: [0.9, 0.9], hand: [1.6, 1.3] };
    const m = figure({ x: 610, foot: 800, H: 136, heads: 3.1, skin: SKIN.light, hair: '#6a3a1a', style: 'bob', top: '#e8607a', bottom: '#4a2a5a', gaze: 0.4, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.2, 1.7] }, help] });
    { const tb = m.torsoBot; out.push(m.svg, path(`M574 ${f(tb - 6)}Q670 ${f(tb - 10)} 676 ${f(tb + 20)}Q674 ${f(tb + 38)} 640 ${f(tb + 38)}H580Q562 ${f(tb + 18)} 574 ${f(tb - 6)}Z`, { fill: '#5a3a6a' }), line(`M590 ${f(tb + 4)}Q650 ${f(tb + 2)} 664 ${f(tb + 16)}`, '#7a5a8a', 3)); }
    // the toddler, sitting, dipping a slice
    const dip = { sx: 1, elbow: [0.8, 0.5], hand: [1.5, 0.7] };
    const t = figure({ x: 720, foot: 812, H: 84, heads: 2.4, skin: SKIN.light, hair: '#b8742a', style: 'puffs', top: '#ffd166', bottom: '#ffd166', gaze: 0.6, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 0.6], hand: [-0.6, 1.2] }, dip] });
    out.push(t.svg, ellipse(726, t.torsoBot + 10, 32, 14, { fill: '#ffd166' }));
    const th = t.hand(dip);
    // the honey jar with its dipper
    const jx = th[0] + 26, jy = 806;
    out.push(path(`M${f(jx - 24)} ${jy}q-6 -24 4 -40h40q10 16 4 40z`, { fill: url('honey') }), path(`M${f(jx - 20)} ${jy - 40}h40v-10h-40z`, { fill: '#5a8ad8' }), path(`M${f(jx - 16)} ${jy - 30}q2 14 0 26`, { fill: 'none', stroke: '#fff4c8', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8 }));
    out.push(path(`M${f(jx - 16)} ${jy - 26}h32v14h-32z`, { fill: '#ffffff', opacity: 0.85 }), path(`M${f(jx - 6)} ${jy - 18}a6 5 0 1 1 12 0a6 5 0 1 1 -12 0z`, { fill: '#e8243a' }));
    out.push(line(`M${f(jx + 6)} ${jy - 50}l16 -40`, '#c8945a', 4), circle(jx + 24, jy - 94, 6, { fill: '#c8945a' }));
    // the apple slice with a golden drip
    out.push(path(`M${P(th[0] - 6, th[1] - 10)}a12 12 0 0 1 22 6l-22 -6z`, { fill: '#fff4dc', stroke: '#c8102e', 'stroke-width': 3 }), path(`M${P(th[0] + 10, th[1] - 2)}q2 10 0 14a3 3 0 1 0 4 0q-2 -6 -2 -14z`, { fill: '#ffb020' }));
    ppl.honey = [jx, jy - 24];
    out.push(bee(th[0] + 30, th[1] - 52, 1.1), line(`M${P(th[0] + 52, th[1] - 48)}q20 10 12 26q-8 14 10 20`, '#2a1a0a', 1.6, { 'stroke-dasharray': '3 5', opacity: 0.6 }));
    ppl.bee = [th[0] + 34, th[1] - 52];
    // the round spiral challah
    out.push(ellipse(850, 800, 54, 26, { fill: '#c8782a' }), path('M850 800m-44 0a44 20 0 1 1 88 0a34 15 0 1 1 -68 0a24 10 0 1 1 48 0a14 6 0 1 1 -28 0', { fill: 'none', stroke: '#e8a04a', 'stroke-width': 9, 'stroke-linecap': 'round' }), path('M820 788q30 -14 60 0', { fill: 'none', stroke: '#ffd08a', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.6 }));
    ppl.challah = [850, 796];
    // the split pomegranate and a plate of apple slices
    out.push(circle(930, 822, 20, { fill: '#b8102e' }), path('M940 816a12 12 0 1 1 0.1 0z', { fill: '#ffd0c8' }), path(circD(936, 812, 2.4) + circD(944, 814, 2.4) + circD(940, 822, 2.4) + circD(948, 822, 2.4), { fill: '#e8243a' }), path('M924 802l-4 -8l8 4z', { fill: '#8a0a1e' }));
    ppl.pomegranate = [930, 822];
    out.push(ellipse(560, 836, 36, 12, { fill: '#ffffff' }), path('M536 834a10 10 0 0 1 18 0zM552 832a10 10 0 0 1 18 0zM566 836a10 10 0 0 1 18 0z', { fill: '#fff4dc', stroke: '#c8102e', 'stroke-width': 2 }));
    // a ladybug on the blanket
    out.push(circle(990, 836, 6, { fill: '#e8243a' }), circle(985, 833, 2.6, { fill: '#1a1a1a' }), line('M990 830v12', '#1a1a1a', 1.2));
    ppl.ladybug = [990, 836];
  }

  // ---- grandpa the beekeeper and the painted hives
  out.push(C('grandpa the beekeeper, in a veiled hat, lifts a dripping golden honeycomb frame from the painted hives'));
  {
    const hive = (x, base, col) => path(`M${x - 34} ${base}v-72h68v72z`, { fill: col }) + path(`M${x - 40} ${base - 72}h80v-10h-80z`, { fill: darken(col, 0.2) }) + path(`M${x - 34} ${base - 36}h68`, { fill: 'none', stroke: darken(col, 0.15), 'stroke-width': 2 }) + path(`M${x - 10} ${base - 6}h20v-4h-20z`, { fill: '#2a1a0a' }) + path(`M${x - 34} ${base}v10M${x + 34} ${base}v10`, { fill: 'none', stroke: '#6a4a2a', 'stroke-width': 5 });
    out.push(hive(1060, 730, '#f4f0e0'), hive(1150, 726, '#7ab8e8'), hive(1240, 732, '#ffd166'));
    ppl.hives = [1150, 690];
    const lift = (s) => ({ sx: s, elbow: [s * 0.7, 0.9], hand: [s * 0.5, 0.5] });
    const gp = figure({ x: 1150, foot: 852, H: 160, heads: 3.4, skin: SKIN.tan, hair: '#e8e4e0', style: 'elder', top: '#f4f2ea', bottom: '#f4f2ea', shoe: '#5a4a3a', gaze: -0.3, mouth: 'open', arms: [lift(-1), lift(1)] });
    out.push(gp.svg);
    // the veiled hat: brim, crown and a see-through mesh
    const hx = 1150, hy = gp.headY, r = gp.r;
    out.push(path(`M${P(hx - r * 1.05, hy - r * 0.2)}V${f(hy + r * 1.05)}H${f(hx + r * 1.05)}V${f(hy - r * 0.2)}Z`, { fill: '#ffffff', opacity: 0.28 }));
    let mesh = '';
    for (let k = -4; k <= 4; k++) mesh += `M${f(hx + k * r * 0.24)} ${f(hy - r * 0.2)}v${f(r * 1.25)}`;
    out.push(line(mesh, '#ffffff', 0.9, { opacity: 0.5 }));
    out.push(ellipse(hx, hy - r * 0.62, r * 1.5, r * 0.3, { fill: '#f4f2ea' }), path(`M${P(hx - r * 0.8, hy - r * 0.66)}C${P(hx - r * 0.78, hy - r * 1.5)} ${P(hx + r * 0.78, hy - r * 1.5)} ${P(hx + r * 0.8, hy - r * 0.66)}Z`, { fill: '#ffffff' }));
    // the honeycomb frame, raised high and dripping
    const [lx, ly] = gp.hand(lift(-1)), [rx] = gp.hand(lift(1));
    const fx0 = lx - 16, fx1 = rx + 16, fy0 = ly - 4, fy1 = ly + 62;
    out.push(path(`M${f(fx0)} ${f(fy0)}H${f(fx1)}V${f(fy1)}H${f(fx0)}Z`, { fill: '#a8743e' }), path(`M${f(fx0 + 6)} ${f(fy0 + 6)}H${f(fx1 - 6)}V${f(fy1 - 6)}H${f(fx0 + 6)}Z`, { fill: url('honey') }));
    out.push(path(combD(fx0 + 6, fy0 + 6, fx1 - 6, fy1 - 6, 11), { fill: 'none', stroke: '#c88a10', 'stroke-width': 1.4 }));
    out.push(path(`M${f(fx0 + 20)} ${f(fy1)}q2 6 0 8a3 3 0 1 0 5 0q-2 -2 -2 -8zM${f(fx1 - 30)} ${f(fy1)}q2 4 0 6a3 3 0 1 0 5 0q-2 -2 -2 -6z`, { fill: '#ffb020' }));
    out.push(circle(lx, ly, r * 0.34, { fill: SKIN.tan }), circle(rx, ly, r * 0.34, { fill: SKIN.tan }));
    ppl.comb = [(fx0 + fx1) / 2, (fy0 + fy1) / 2];
    out.push(bee(fx1 + 30, fy0 - 10, 0.8), bee(fx0 - 26, fy0 + 20, 0.7), bee(1240, 640, 0.7), bee(1072, 610, 0.6));
  }

  // ---- dad on the knoll blowing the long curling shofar towards the sunset
  out.push(C('on the knoll dad blows the long curling shofar towards the setting sun'));
  {
    const blow = { sx: 1, elbow: [0.9, -0.1], hand: [1.3, -0.9] };
    const d = figure({ x: 1350, foot: 690, H: 176, heads: 3.4, skin: SKIN.fair, hair: '#2a1a14', style: 'short', top: '#2a4a8a', bottom: '#3a3a4a', gaze: 0.6, mouth: 'o', arms: [{ sx: -1, elbow: [-0.2, -0.6], hand: [0.6, -1.0] }, blow] });
    out.push(d.svg);
    const r = d.r, hx = 1350, hy = d.headY;
    out.push(path(`M${P(hx - r * 0.62, hy - r * 0.78)}Q${P(hx, hy - r * 1.24)} ${P(hx + r * 0.62, hy - r * 0.78)}Q${P(hx, hy - r * 0.92)} ${P(hx - r * 0.62, hy - r * 0.78)}Z`, { fill: '#ffffff' }));
    // the shofar: a long tapering curl from the mouth out to the right
    const m = [hx + r * 0.42, hy + r * 0.45];
    const sh = `M${P(m[0], m[1] - 3)}C${P(m[0] + 40, m[1] - 4)} ${P(m[0] + 70, m[1] + 30)} ${P(m[0] + 110, m[1] + 10)}C${P(m[0] + 140, m[1] - 6)} ${P(m[0] + 140, m[1] - 50)} ${P(m[0] + 116, m[1] - 70)}L${P(m[0] + 140, m[1] - 82)}C${P(m[0] + 168, m[1] - 50)} ${P(m[0] + 160, m[1] + 14)} ${P(m[0] + 116, m[1] + 30)}C${P(m[0] + 70, m[1] + 46)} ${P(m[0] + 40, m[1] + 6)} ${P(m[0], m[1] + 3)}Z`;
    out.push(path(sh, { fill: '#e8c890', stroke: '#8a5a2a', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }));
    out.push(ellipse(m[0] + 128, m[1] - 76, 13, 5, { fill: '#5a3a1a', transform: `rotate(-50 ${f(m[0] + 128)} ${f(m[1] - 76)})` }));
    out.push(line(`M${P(m[0] + 156, m[1] - 104)}q14 -10 10 -26M${P(m[0] + 176, m[1] - 92)}q20 -8 20 -30M${P(m[0] + 170, m[1] - 120)}q8 -12 2 -24`, '#fff4c8', 3.4, { opacity: 0.9 }));
    ppl.shofar = [m[0] + 100, m[1] - 20];
  }

  // ---- a butterfly and a snail
  out.push(G({ transform: 'translate(960 640) rotate(-10)' }, ellipse(-8, -6, 9, 7, { fill: '#ff8a3a' }), ellipse(8, -6, 9, 7, { fill: '#ff8a3a' }), ellipse(-6, 6, 6, 5, { fill: '#ffc83a' }), ellipse(6, 6, 6, 5, { fill: '#ffc83a' }), line('M0 -10v20', '#2a1a0a', 2.4)));
  ppl.butterfly = [960, 640];
  out.push(G({ transform: 'translate(1290 856)' }, path('M-20 0h34q6 0 6 -6q0 -4 -4 -4l-4 -10l-2 10z', { fill: '#c8a888' }), circle(-4, -12, 12, { fill: '#c8743a' }), path('M-4 -12m-6 0a6 6 0 1 1 6 6', { fill: 'none', stroke: '#8a4a1a', 'stroke-width': 2 })));
  ppl.snail = [1286, 846];

  return { svg: compactSvg(doc(`Rosh Hashanah · mid. Concept: "a sweet new year in the orchard" at sundown as the new year begins. Focal point: on a blue checked picnic blanket mum helps the toddler dip an apple slice into the honey jar, a bee watching hopefully, beside a round spiral challah, a split pomegranate and a plate of apple slices (x 480–1010, y 640–870). A girl on a ladder picks the reddest apple from a big apple tree while her brother holds up the basket; grandpa the beekeeper in a veiled hat lifts a dripping honeycomb frame by three painted hives; on the knoll dad in a kippah blows a long curling shofar towards the setting sun. A hedgehog, a worm in a fallen apple, a bird, a butterfly, a ladybug and a snail. Light story: warm low sunset light from the right. The falling apples and honey pots are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Rosh Hashanah · front: tall grass and little white flowers in the bottom corners; the center stays open`, [], [
    C('tall grass, bottom left'),
    line('M10 900q4 -60 -10 -110M34 900q0 -50 14 -96M56 900q-4 -40 -16 -70M80 900q6 -36 18 -60', '#4a7a2a', 5),
    path(circD(48, 804, 6) + circD(98, 840, 5), { fill: '#ffffff' }), path(circD(48, 804, 2.2) + circD(98, 840, 2), { fill: '#ffc83a' }),
    C('tall grass, bottom right'),
    line('M1590 900q-4 -60 10 -110M1566 900q0 -50 -14 -96M1544 900q4 -40 16 -70M1520 900q-6 -36 -18 -60', '#4a7a2a', 5),
    path(circD(1552, 804, 6) + circD(1502, 840, 5), { fill: '#ffffff' }), path(circD(1552, 804, 2.2) + circD(1502, 840, 2), { fill: '#ffc83a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'wish', x: r(ppl.shofar[0]), y: r(ppl.shofar[1]), r: 56, label: 'Blow the shofar and make a wish' },
      { activity: 'card', x: r(ppl.honey[0]), y: r(ppl.honey[1]), r: 32, label: 'Make a sweet new year card' },
      { activity: 'catch', x: ppl.tree[0], y: ppl.tree[1], r: 70, label: 'Catch apples and honey' },
      { activity: 'color', x: r(ppl.comb[0]), y: r(ppl.comb[1]), r: 44, label: 'Color the honeycomb' },
      { activity: 'memory', x: ppl.challah[0], y: ppl.challah[1], r: 40, label: 'Sweet treats memory game' },
    ],
    findables: [
      { id: 'bee', label: 'a hopeful bee', x: r(ppl.bee[0]), y: r(ppl.bee[1]), r: 18 },
      { id: 'hedgehog', label: 'a hedgehog', x: ppl.hedgehog[0], y: ppl.hedgehog[1], r: 24 },
      { id: 'worm', label: 'a worm in an apple', x: ppl.worm[0], y: ppl.worm[1], r: 16 },
      { id: 'bird', label: 'a bluebird', x: r(ppl.bird[0]), y: r(ppl.bird[1]), r: 18 },
      { id: 'pomegranate', label: 'a pomegranate', x: ppl.pomegranate[0], y: ppl.pomegranate[1], r: 20 },
      { id: 'ladybug', label: 'a ladybug', x: ppl.ladybug[0], y: ppl.ladybug[1], r: 14 },
      { id: 'snail', label: 'a snail', x: ppl.snail[0], y: ppl.snail[1], r: 18 },
    ],
  };
}
