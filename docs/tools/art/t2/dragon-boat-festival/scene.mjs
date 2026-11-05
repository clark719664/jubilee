// Dragon Boat Festival — "The race on the river": a sunny June day on a wide river. Two long dragon boats race neck
// and neck — a red dragon and a green one — paddlers digging in, a drummer at the bow of each beating the rhythm and
// a steerer at the stern; spray flies from the paddles. On the near bank a family cheers from a stone embankment:
// a girl waves a little dragon flag, grandma unwraps a zongzi from its bamboo leaf, a boy wears a colorful
// five-thread bracelet; a basket of zongzi tied with string sits by them. A stone arch bridge and a pagoda on the
// far bank, willows trailing in the water, a duck paddling. The bubbles, splashes and ripples are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { line, circD } from '../../kit/scenekit.mjs';

const ID = 'dragon-boat-festival';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440' };
const GOLD = '#ffc83a';
const FAR = 600, BANK = 790;

/** A dragon boat centered at x, waterline y, heading left; `col` the dragon's color; `s` scale. */
function boat(x, y, s, col, trim, seed) {
  const L = 560 * s, hgt = 34 * s;
  const R = rng(seed);
  const g = [];
  // the hull: long and low, scales painted along it
  g.push(path(`M${P(x - L / 2, y - hgt * 0.4)}Q${P(x - L / 2 + 10 * s, y + hgt * 0.6)} ${P(x - L / 2 + 40 * s, y + hgt * 0.6)}H${f(x + L / 2 - 30 * s)}Q${P(x + L / 2, y + hgt * 0.6)} ${P(x + L / 2 + 6 * s, y - hgt * 0.6)}L${P(x + L / 2 - 20 * s, y - hgt * 0.5)}H${f(x - L / 2 + 30 * s)}Z`, { fill: col }));
  let scales = '';
  for (let k = 0; k < 16; k++) { const sx = x - L / 2 + 60 * s + k * (L - 100 * s) / 16; scales += `M${P(sx, y - hgt * 0.2)}a${f(8 * s)} ${f(8 * s)} 0 0 0 ${f(16 * s)} 0`; }
  g.push(path(scales, { fill: 'none', stroke: trim, 'stroke-width': f(3 * s) }));
  g.push(path(`M${P(x - L / 2 + 30 * s, y - hgt * 0.5)}H${f(x + L / 2 - 20 * s)}`, { fill: 'none', stroke: GOLD, 'stroke-width': f(4 * s) }));
  // the dragon head at the bow (left), tail at the stern (right)
  const hx = x - L / 2, hy = y - hgt * 0.5;
  g.push(path(`M${P(hx + 20 * s, hy)}C${P(hx - 10 * s, hy - 30 * s)} ${P(hx - 30 * s, hy - 70 * s)} ${P(hx - 60 * s, hy - 74 * s)}C${P(hx - 84 * s, hy - 76 * s)} ${P(hx - 92 * s, hy - 56 * s)} ${P(hx - 80 * s, hy - 44 * s)}C${P(hx - 60 * s, hy - 40 * s)} ${P(hx - 40 * s, hy - 20 * s)} ${P(hx - 30 * s, hy + 10 * s)}Z`, { fill: col }));
  g.push(path(`M${P(hx - 60 * s, hy - 74 * s)}l-6 -22l14 14l8 -20l4 24z`, { fill: trim }), path(`M${P(hx - 84 * s, hy - 46 * s)}q-18 10 -24 30`, { fill: 'none', stroke: trim, 'stroke-width': f(4 * s), 'stroke-linecap': 'round' }));
  g.push(circle(hx - 66 * s, hy - 60 * s, 7 * s, { fill: '#ffffff' }), circle(hx - 68 * s, hy - 60 * s, 4 * s, { fill: '#1a1a1a' }), path(`M${P(hx - 92 * s, hy - 50 * s)}l12 4`, { fill: 'none', stroke: '#ffffff', 'stroke-width': f(3 * s) }));
  g.push(path(`M${P(x + L / 2 + 4 * s, y - hgt * 0.6)}q30 -20 20 -60q-4 30 -30 40z`, { fill: col }), path(`M${P(x + L / 2 + 14 * s, y - 50 * s)}l20 -20l-6 28z`, { fill: trim }));
  // the paddlers in two rows (we see the near row), a drummer at the bow, a steerer at the stern
  const n = 9;
  const shirts = [GOLD, '#ffffff'];
  for (let k = 0; k < n; k++) {
    const px = x - L / 2 + 110 * s + k * (L - 190 * s) / (n - 1), py = y - hgt * 0.5;
    const r = 11 * s, lean = -0.35;
    g.push(path(`M${P(px - 10 * s, py)}l${f(lean * 30 * s)} ${f(-34 * s)}h${f(20 * s)}l${f(-lean * 10 * s)} ${f(34 * s)}z`, { fill: shirts[k % 2] }));
    g.push(circle(px + lean * 34 * s + 2 * s, py - 42 * s, r, { fill: [SKIN.light, SKIN.tan, SKIN.brown, SKIN.fair][Math.floor(R() * 4)] }));
    g.push(path(`M${P(px + lean * 34 * s - 9 * s, py - 46 * s)}q${f(11 * s)} ${f(-10 * s)} ${f(22 * s)} 0z`, { fill: col }));
    g.push(path(circD(px + lean * 34 * s - 2 * s, py - 42 * s, 1.6 * s) + circD(px + lean * 34 * s + 5 * s, py - 42 * s, 1.6 * s), { fill: '#1a1a1a' }), path(`M${P(px + lean * 34 * s - 2 * s, py - 37 * s)}q${f(3 * s)} ${f(3 * s)} ${f(6 * s)} 0`, { fill: 'none', stroke: '#5a2a1a', 'stroke-width': f(1.4 * s), 'stroke-linecap': 'round' }));
    // the paddle: from the hands down into the water, angled back
    const a0 = [px - 4 * s, py - 24 * s], a1 = [px + 26 * s, y + 30 * s];
    g.push(line(`M${P(...a0)}L${P(...a1)}`, '#c8945a', 4 * s), path(`M${P(a1[0] - 6 * s, a1[1] - 4 * s)}l${f(10 * s)} ${f(18 * s)}l${f(8 * s)} ${f(-6 * s)}z`, { fill: '#a8743e' }));
    g.push(path(circD(a1[0] + 10 * s, y + 10 * s, 6 * s) + circD(a1[0] + 20 * s, y + 2 * s, 4 * s), { fill: '#ffffff', opacity: 0.9 }));
  }
  // drummer at the bow, sticks up
  const dx = x - L / 2 + 54 * s, dy = y - hgt * 0.5;
  g.push(ellipse(dx + 20 * s, dy - 14 * s, 18 * s, 10 * s, { fill: '#c8102e' }), ellipse(dx + 20 * s, dy - 20 * s, 18 * s, 6 * s, { fill: '#f4e8d0' }));
  g.push(path(`M${P(dx - 10 * s, dy)}v${f(-40 * s)}h${f(20 * s)}v${f(40 * s)}z`, { fill: '#ffffff' }), circle(dx, dy - 50 * s, 11 * s, { fill: SKIN.tan }), path(circD(dx - 4 * s, dy - 50 * s, 1.6 * s) + circD(dx + 4 * s, dy - 50 * s, 1.6 * s), { fill: '#1a1a1a' }), path(`M${P(dx - 10 * s, dy - 54 * s)}q${f(10 * s)} ${f(-10 * s)} ${f(20 * s)} 0z`, { fill: '#e8243a' }));
  g.push(line(`M${P(dx + 8 * s, dy - 36 * s)}l${f(18 * s)} ${f(-24 * s)}M${P(dx + 4 * s, dy - 30 * s)}l${f(22 * s)} ${f(-6 * s)}`, '#c8945a', 3 * s));
  // steerer at the stern with a long oar
  const sx = x + L / 2 - 30 * s;
  g.push(path(`M${P(sx - 10 * s, dy)}v${f(-46 * s)}h${f(20 * s)}v${f(46 * s)}z`, { fill: col }), circle(sx, dy - 56 * s, 11 * s, { fill: SKIN.fair }), path(circD(sx - 4 * s, dy - 56 * s, 1.6 * s) + circD(sx + 4 * s, dy - 56 * s, 1.6 * s), { fill: '#1a1a1a' }), path(`M${P(sx - 10 * s, dy - 60 * s)}q${f(10 * s)} ${f(-10 * s)} ${f(20 * s)} 0z`, { fill: '#2a2a2a' }));
  g.push(line(`M${P(sx + 4 * s, dy - 34 * s)}L${P(sx + 70 * s, y + 30 * s)}`, '#a8743e', 5 * s));
  // wake behind the stern
  g.push(path(`M${P(x + L / 2, y + 8 * s)}q30 6 60 0q30 -6 60 0M${P(x + L / 2 - 10 * s, y + 18 * s)}q40 6 80 0`, { fill: 'none', stroke: '#ffffff', 'stroke-width': f(3 * s), opacity: 0.8 }));
  return g.join('');
}

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const defs = [lin(id('hill'), 0, 0, 0, 1, [[0, '#4a9a7a'], [1, '#2a7a6a']]), lin(id('dusk'), 0, 0, 0, 1, [[0, '#ffb07a', 0], [0.6, '#ff9a7a', 0.35], [1, '#ffc88a', 0.8]])];
  let pagoda = '';
  for (let i = 0; i < 5; i++) { const y = 590 - i * 50, w = 110 - i * 16; pagoda += `M${P(1440 - w / 2 + 10, y)}V${f(y - 36)}H${f(1440 + w / 2 - 10)}V${f(y)}ZM${P(1440 - w / 2 - 12, y - 34)}Q${P(1440, y - 54)} ${P(1440 + w / 2 + 12, y - 34)}L${P(1440 + w / 2, y - 40)}Q${P(1440, y - 50)} ${P(1440 - w / 2, y - 40)}Z`; }
  pagoda += 'M1437 340v-34h6v34Z';
  return compactSvg(doc(`Dragon Boat Festival · back: first stars in the corners and a warm summer-evening glow on the horizon; soft green hills along the far bank, kept low; a five-storey pagoda on the right outside the copy zone`, defs, [
    C('first stars in the corners and a warm dusk glow low on the horizon'),
    path(Array.from({ length: 24 }, (_, k) => { const R = rng(31 + k); const left = k % 2 === 0; return `M${P(left ? 20 + R() * 260 : 1330 + R() * 260, 24 + R() * 220)}m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0`; }).join(''), { fill: '#fff6d8', opacity: 0.8 }),
    path('M-20 420H1620V600H-20Z', { fill: url('dusk') }),
    C('the far hills'),
    path(`M-20 ${FAR}V520Q200 470 460 500T900 486T1300 500T1620 480V${FAR}Z`, { fill: url('hill') }),
    C('the pagoda'),
    path(pagoda, { fill: '#c8343a' }),
    path('M1380 590h120v6h-120z', { fill: '#8a2a2a' }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('river'), 0, 0, 0, 1, [[0, '#5ab0d8'], [1, '#2a7ab0']]),
    lin(id('stone'), 0, 0, 0, 1, [[0, '#c8bca8'], [1, '#a89a88']]),
  ];

  // ---- the far bank, the river
  out.push(C('the far bank with a stone arch bridge, and the wide river'));
  out.push(path(`M-20 ${FAR}H1620v20H-20Z`, { fill: '#8ab87a' }));
  out.push(path(`M-20 ${FAR + 20}H1620V920H-20Z`, { fill: url('river') }));
  { let rip = ''; const R = rng(7); for (let i = 0; i < 30; i++) { const x = R() * 1600, y = FAR + 40 + R() * 160; rip += `M${P(x, y)}q14 -6 28 0`; } out.push(line(rip, '#ffffff', 2.4, { opacity: 0.5 })); }
  // the bridge on the left
  out.push(path(`M-20 ${FAR + 20}V550H340V${FAR + 20}H300Q300 560 160 560Q20 560 20 ${FAR + 20}Z`, { fill: url('stone') }), path('M-20 550H340v-10H-20Z', { fill: '#a89a88' }));
  out.push(path(`M20 ${FAR + 20}Q20 560 160 560Q300 560 300 ${FAR + 20}`, { fill: 'none', stroke: '#8a7a68', 'stroke-width': 4 }), path(`M20 ${FAR + 20}Q160 ${FAR + 70} 300 ${FAR + 20}`, { fill: 'none', stroke: '#2a6a98', 'stroke-width': 0 }));
  { let posts = ''; for (let x = -10; x < 340; x += 30) posts += `M${x} 540v-14h6v14z`; out.push(path(posts, { fill: '#a89a88' })); }
  // willows trailing on the right
  {
    out.push(path('M1580 620c-6 -60 -2 -120 10 -160h14c-8 40 -10 100 -8 160z', { fill: '#6a5a3a' }));
    let fronds = '';
    for (let k = 0; k < 14; k++) { const x = 1480 + k * 12; fronds += `M${x} ${440 + (k % 3) * 10}q${(k % 2 ? 10 : -10)} 80 ${(k % 2 ? 4 : -4)} ${170 + (k % 4) * 14}`; }
    out.push(line(fronds, '#5aa85a', 4));
  }

  // ---- the two racing boats (the focal point)
  out.push(C('the focal point: two dragon boats racing neck and neck, paddlers digging in, a drummer at each bow, spray flying'));
  out.push(boat(860, 670, 0.9, '#2aa85a', '#ffd23a', 3));
  out.push(boat(760, 760, 1.12, '#e8243a', '#ffd23a', 5));
  ppl.redBoat = [760, 720];
  ppl.greenBoat = [860, 640];
  ppl.drum = [760 - 560 * 1.12 / 2 + 54 * 1.12 + 20 * 1.12, 760 - 34 * 1.12 * 0.5 - 18];
  ppl.redHead = [760 - 560 * 1.12 / 2 - 66 * 1.12, 760 - 34 * 1.12 * 0.5 - 60 * 1.12];
  // a duck paddling out of the way
  out.push(G({ transform: 'translate(1290 700)' }, path('M-14 0c0 -10 8 -14 18 -12l6 -6l6 4l-6 6c4 8 -2 12 -10 12h-10c-2 0 -4 -2 -4 -4z', { fill: '#7a5a3a' }), circle(-10, -10, 7, { fill: '#2a7a4a' }), path('M-16 -10l-8 2l8 2z', { fill: '#ffb800' }), circle(-11, -12, 1.4, { fill: '#1a1a1a' }), path('M-20 4q20 6 40 0', { fill: 'none', stroke: '#ffffff', 'stroke-width': 2, opacity: 0.8 })));
  ppl.duck = [1286, 692];

  // ---- the near bank: a stone embankment with the family
  out.push(C('the near bank: a stone embankment where the family cheers; a basket of zongzi tied with string'));
  out.push(path(`M-20 920V${BANK}Q400 ${BANK - 14} 800 ${BANK}T1620 ${BANK - 10}V920Z`, { fill: url('stone') }));
  { let c = ''; for (let x = -10; x < 1620; x += 60) c += `M${x} ${BANK + 6}v26`; out.push(line(c + `M-20 ${BANK + 34}H1620`, '#8a7a68', 2.4, { opacity: 0.6 })); }
  {
    // grandma unwrapping a zongzi
    const unwrap = { sx: 1, elbow: [0.8, 0.6], hand: [1.2, 0.6] };
    const gm = figure({ x: 300, foot: 880, H: 118, heads: 3.2, skin: SKIN.fair, hair: '#e6e2ee', style: 'bun', top: '#2a7a8a', bottom: '#2a2a3a', gaze: 0.4, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.5, 1.0], hand: [0.2, 1.0] }, unwrap] });
    out.push(gm.svg);
    const h = gm.hand(unwrap);
    out.push(path(`M${P(h[0] - 8, h[1] - 6)}l18 -26l18 26z`, { fill: '#f4ecd8' }), path(`M${P(h[0] - 14, h[1] - 2)}l-14 -28l20 6zM${P(h[0] + 26, h[1] - 2)}l16 -26l-20 4z`, { fill: '#5a9a3a' }), circle(h[0], h[1], gm.r * 0.34, { fill: SKIN.fair }));
    ppl.zongzi = [h[0] + 10, h[1] - 14];
    // the basket of zongzi
    out.push(path('M380 880l6 -40h76l6 40z', { fill: '#c8945a' }), path('M386 840q38 -40 76 0', { fill: 'none', stroke: '#a86a30', 'stroke-width': 4 }));
    for (const [x, y] of [[400, 836], [424, 830], [448, 836]]) out.push(path(`M${x - 12} ${y}l12 -20l12 20z`, { fill: '#4a8a3a' }), line(`M${x - 8} ${y - 6}h16`, '#c8a070', 2));
    ppl.basket = [424, 850];
    // the girl waving a little dragon flag
    const wave = { sx: 1, elbow: [0.9, -0.8], hand: [1.2, -2.2] };
    const g = figure({ x: 540, foot: 884, H: 84, heads: 2.7, skin: SKIN.tan, hair: '#1a1210', style: 'bob', top: '#ff6a8a', bottom: '#2a5a8a', shoe: '#ffd23a', gaze: 0.2, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, wave] });
    out.push(g.svg);
    const gh = g.hand(wave);
    out.push(line(`M${P(gh[0], gh[1] + 8)}l6 -60`, '#c8945a', 3), path(`M${P(gh[0] + 6, gh[1] - 52)}l50 10l-50 22z`, { fill: GOLD }), path(`M${P(gh[0] + 16, gh[1] - 40)}q8 -8 16 0q-8 6 -16 0z`, { fill: '#e8243a' }), circle(gh[0], gh[1], g.r * 0.36, { fill: SKIN.tan }));
    ppl.flag = [gh[0] + 30, gh[1] - 42];
    // the boy with the five-thread bracelet, cheering
    const cheer = (s) => ({ sx: s, elbow: [s * 0.9, -0.9], hand: [s * 1.2, -2.2] });
    const b = figure({ x: 1060, foot: 880, H: 86, heads: 2.7, skin: SKIN.light, hair: '#1a1210', style: 'short', top: '#2a6ad8', bottom: '#2a2a3a', shoe: '#e8243a', gaze: -0.4, mouth: 'open', arms: [cheer(-1), cheer(1)] });
    out.push(b.svg);
    const bh = b.hand(cheer(1));
    const cols = ['#e8243a', '#ffd23a', '#2ab86a', '#2a6ad8', '#ffffff'];
    cols.forEach((c, k) => out.push(line(`M${P(bh[0] - 5, bh[1] + 8 + k * 2)}h10`, c, 2)));
    ppl.bracelet = [bh[0], bh[1] + 12];
    // dad with a camera
    const snap = { sx: -1, elbow: [-0.8, 0.0], hand: [-0.4, -0.6] }, snap2 = { sx: 1, elbow: [0.8, 0.0], hand: [0.4, -0.6] };
    const d = figure({ x: 1200, foot: 878, H: 124, heads: 3.3, skin: SKIN.brown, hair: '#1a1210', style: 'short', top: '#ffd23a', bottom: '#2a2a3a', gaze: -0.5, mouth: 'smile', arms: [snap, snap2] });
    out.push(d.svg);
    const ch = d.hand(snap);
    out.push(path(`M${P(ch[0] - 8, ch[1] - 18)}h40v24h-40z`, { fill: '#2a2a32' }), circle(ch[0] + 12, ch[1] - 6, 8, { fill: '#5a8ac8' }), circle(ch[0], ch[1], d.r * 0.34, { fill: SKIN.brown }), circle(d.hand(snap2)[0], d.hand(snap2)[1], d.r * 0.34, { fill: SKIN.brown }));
    ppl.camera = [ch[0] + 12, ch[1] - 6];
  }

  return { svg: compactSvg(doc(`Dragon Boat Festival · mid. Concept: "the race on the river" on a warm June evening. Focal point: two long dragon boats racing neck and neck (x 380–1200, y 560–800) — a red dragon and a green one — paddlers digging in, a drummer at each bow beating the rhythm, a steerer at each stern, spray flying from the paddles. On the near stone embankment a family cheers: grandma unwraps a zongzi from its bamboo leaf beside a basket of more, a girl waves a little dragon flag, a boy cheers with a five-thread bracelet on his wrist, dad takes a photo. A stone arch bridge on the left, willows on the right, a duck paddling out of the way, a pagoda on the far bank. Light story: a warm summer-evening glow on the water. The bubbles, splashes and ripples are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Dragon Boat Festival · front: tall reeds in both bottom corners; the center stays open`, [], [
    C('reeds bottom left'),
    path('M20 900q-6 -80 4 -140M44 900q2 -100 -8 -170M70 900q8 -70 20 -120', { fill: 'none', stroke: '#5a8a3a', 'stroke-width': 5 }),
    path('M20 760l-6 -30h12zM36 730l-6 -34h12z', { fill: '#8a5a2a' }),
    C('reeds bottom right'),
    path('M1540 900q-6 -80 4 -140M1566 900q2 -100 -8 -160M1590 900q8 -70 16 -120', { fill: 'none', stroke: '#5a8a3a', 'stroke-width': 5 }),
    path('M1544 760l-6 -30h12zM1558 740l-6 -34h12z', { fill: '#8a5a2a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'color', x: r(ppl.redBoat[0]), y: r(ppl.redBoat[1]), r: 70, label: 'Color the dragon boat' },
      { activity: 'memory', x: r(ppl.zongzi[0]), y: r(ppl.zongzi[1]), r: 36, label: 'Match the zongzi' },
      { activity: 'catch', x: r(ppl.greenBoat[0]), y: r(ppl.greenBoat[1]), r: 56, label: 'Catch the splashes' },
      { activity: 'card', x: r(ppl.flag[0]), y: r(ppl.flag[1]), r: 30, label: 'Make a dragon flag card' },
    ],
    findables: [
      { id: 'drum', label: 'the boat drum', x: r(ppl.drum[0]), y: r(ppl.drum[1]), r: 20 },
      { id: 'dragon-head', label: 'a dragon head', x: r(ppl.redHead[0]), y: r(ppl.redHead[1]), r: 24 },
      { id: 'duck', label: 'a duck getting out of the way', x: ppl.duck[0], y: ppl.duck[1], r: 20 },
      { id: 'basket', label: 'a basket of zongzi', x: ppl.basket[0], y: ppl.basket[1], r: 26 },
      { id: 'bracelet', label: 'a five-color bracelet', x: r(ppl.bracelet[0]), y: r(ppl.bracelet[1]), r: 14 },
      { id: 'camera', label: 'a camera', x: r(ppl.camera[0]), y: r(ppl.camera[1]), r: 18 },
      { id: 'pagoda', label: 'the pagoda', x: 1440, y: 480, r: 40 },
    ],
  };
}
