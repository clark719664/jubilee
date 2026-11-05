// New Year's Day — "The first sunrise": dawn on 1 January at the seaside. The first sun of the year lifts out of
// the sea; four brave dippers in silly hats (a Santa hat, a Viking helmet, a flowery swim cap and a party hat)
// whoop in the icy waves while a dog barks at them from the shore. On the beach a dad holds a big towel ready and
// a child in a dinosaur-hood towel sips cocoa; a row of bright beach huts with bunting on the right, a lighthouse
// on the headland on the left, a seagull on the groyne, a message in a bottle and a crab on the sand.
// The confetti is the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { dog, line, circD } from '../../kit/scenekit.mjs';

const ID = 'new-years-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

// ---- palette: a dark night sky giving way to a pink-gold dawn on the horizon
const NIGHT = '#141428';
const DAWN = '#ff9a7a';
const GOLD = '#ffc85a';
const dawn = (c, k = 0.2) => mix(c, DAWN, k);
const cool = (c, k = 0.25) => mix(c, NIGHT, k);
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };

// ---- layout
const HORIZON = 612;
const SUN = { x: 800, r: 104 };
const SHORE = 742;                      // where the waves meet the sand (roughly; the foam line wobbles)
const DIP = 726;                        // the waterline round the dippers
const HUTS = { x0: 1176, base: 778, w: 84, n: 5 };

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(4);
  let stars = '';
  for (let i = 0; i < 26; i++) { const left = i % 2 === 0; stars += circD(left ? 16 + R() * 270 : 1320 + R() * 270, 20 + R() * 250, 1 + R() * 1.4); }
  const defs = [
    rad(id('dawn'), 0.5, 0.5, 0.5, [[0, '#ffd28a', 0.95], [0.25, '#ff9a7a', 0.75], [0.6, '#b86aa0', 0.35], [1, '#b86aa0', 0]]),
    lin(id('band'), 0, 0, 0, 1, [[0, '#b86aa0', 0], [0.6, '#e88a8a', 0.3], [1, '#ffb48a', 0.65]]),
    rad(id('sun'), 0.5, 0.6, 0.6, [[0, '#fff6d0'], [0.55, '#ffe08a'], [1, '#ffb84a']]),
    rad(id('halo'), 0.5, 0.5, 0.5, [[0, '#fff0b0', 0.7], [0.4, '#ffd28a', 0.3], [1, '#ffd28a', 0]]),
    lin(id('sea'), 0, 0, 0, 1, [[0, '#6a5a8a'], [0.4, '#3a4a7a'], [1, '#24486a']]),
    rad(id('beam'), 1, 0.5, 1, [[0, '#fff3c4', 0.5], [1, '#fff3c4', 0]]),
  ];
  // the glittering path of sunlight on the sea
  let glitter = '';
  for (let i = 0; i < 26; i++) { const y = HORIZON + 6 + i * 5 + i * i * 0.2, w = 18 + i * 4 + R() * 20, x = SUN.x - w / 2 + (R() - 0.5) * (20 + i * 6); glitter += `M${P(x, y)}h${f(w)}v2.4h${f(-w)}Z`; }
  return compactSvg(doc(`New Year's Day · back: the night sky fading to a pink-gold dawn; the first sun of the year rising out of a calm sea with a glittering path of light; a far headland with a lighthouse and its beam on the left; a few last stars in the corners`, defs, [
    C('the last stars, in the corners only'),
    path(stars, { fill: '#fff6d8', opacity: 0.8 }),
    C('the dawn glow on the horizon (kept below the copy zone)'),
    path(`M-20 432H1620V${HORIZON}H-20Z`, { fill: url('band') }),
    ellipse(800, HORIZON, 1100, 180, { fill: url('dawn') }),
    C('the rising sun and its halo'),
    circle(SUN.x, HORIZON, SUN.r * 1.9, { fill: url('halo') }),
    path(`M${SUN.x - SUN.r} ${HORIZON}a${SUN.r} ${SUN.r} 0 0 1 ${2 * SUN.r} 0Z`, { fill: url('sun') }),
    C('the sea, with the sun\'s glittering path'),
    path(`M-20 ${HORIZON}H1620V780H-20Z`, { fill: url('sea') }),
    path(`M-20 ${HORIZON}H1620v3H-20Z`, { fill: '#ffd28a', opacity: 0.7 }),
    path(glitter, { fill: GOLD, opacity: 0.85 }),
    C('far islands on the right'),
    path(`M1280 ${HORIZON}q40 -26 90 -20q30 -14 60 4q20 6 30 16Z`, { fill: cool('#4a3a6a', 0.3) }),
    C('the headland and lighthouse on the left, its beam sweeping out to sea'),
    path(`M-20 ${HORIZON + 40}V560Q60 540 140 548Q220 552 262 580Q290 600 312 ${HORIZON + 40}Z`, { fill: cool('#3a2a4a', 0.2) }),
    path('M146 436L-20 372V488Z', { fill: url('beam') }),
    path('M132 556L140 452H160L168 556Z', { fill: '#f4eee8' }),
    path('M134 528h32l1 12h-34zM137 488h26l1 12h-28z', { fill: '#d62838' }),
    path('M136 452h28v-6h-28zM140 446v-16h20v16z', { fill: '#2a2a3a' }),
    path('M142 444v-12h16v12z', { fill: '#fff3c4' }),
    path('M136 430q14 -16 28 0z', { fill: '#d62838' }),
    circle(150, 438, 16, { fill: url('halo') }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('sand'), 0, 0, 0, 1, [[0, '#e8c4a8'], [1, '#c89a80']]),
    lin(id('wave'), 0, 0, 0, 1, [[0, '#4a6a92'], [1, '#2e5476']]),
    lin(id('ring'), 0, 0, 0, 1, [[0, '#ffe066'], [1, '#ffb800']]),
    lin(id('bottle'), 0, 0, 1, 0, [[0, '#4ab88a', 0.85], [1, '#2a8a6a', 0.85]]),
    rad(id('rim'), 0.5, 0.5, 0.5, [[0, '#ffd28a', 0.5], [1, '#ffd28a', 0]]),
  ];

  // ---- the near sea, the groyne, the waves
  out.push(C('the near sea with long waves rolling in; a wooden groyne runs out on the left with a seagull on the tallest post'));
  out.push(path(`M-20 690C300 684 600 694 900 688S1400 682 1620 688V820H-20Z`, { fill: url('wave') }));
  {
    let crests = '';
    for (const [y, a] of [[700, 0], [716, 40], [734, 80]]) { crests += `M-20 ${y}`; for (let x = -20; x < 1620; x += 80) crests += `q20 ${-6 - (x + a) % 3} 40 0t40 0`; }
    out.push(line(crests, '#ffffff', 2.4, { opacity: 0.35 }));
  }
  {
    let posts = '', caps = '';
    for (let i = 0; i < 7; i++) { const x = 276 + i * 34, top = 700 - (6 - i) * 0 - i * 6 + 30, base = 770 - i * 6; posts += `M${x} ${base}V${top - (6 - i) * 6}h14V${base}Z`; caps += `M${x - 1} ${top - (6 - i) * 6}h16v4h-16Z`; }
    out.push(path(posts, { fill: dawn('#5a3a2a', 0.1) }), path(caps, { fill: dawn('#8a5a3a', 0.2) }));
    // the seagull, on the tallest post
    const gx = 283, gy = 694;
    out.push(G({ transform: `translate(${gx} ${gy})` },
      path('M-14 0c-2-10 6-16 16-14l10 -2c-2 6-6 10-10 12c-4 6-12 6-16 4z', { fill: '#f4f4f0' }),
      path('M2 -14c6-4 18-2 22 6c-8-2-16-2-22-6z', { fill: '#8a90a0' }),
      circle(-10, -16, 7, { fill: '#f4f4f0' }), path('M-16 -16l-8 2l8 2z', { fill: '#ffb800' }), circle(-12, -18, 1.4, { fill: '#1a1a1a' }),
      line('M-6 2v6M0 2v6', '#ffb800', 2)));
    ppl.gull = [gx - 4, gy - 10];
  }

  // ---- the dippers, waist deep (figures first, then the water in front of them)
  out.push(C('four brave New Year dippers in silly hats, arms up, whooping in the icy waves'));
  const up = (s, k = 1) => ({ sx: s, elbow: [s * 0.9, -0.8 * k], hand: [s * 1.3, -2.2 * k] });
  const dippers = [
    { x: 600, H: 112, skin: SKIN.fair, hair: '#c8642a', style: 'bob', top: '#e8243a', arms: [up(-1), up(1)], mouth: 'open', hat: 'santa' },
    { x: 712, H: 122, skin: SKIN.brown, hair: '#1a1210', style: 'short', top: '#2a6aaa', arms: [up(-1, 0.6), { sx: 1, elbow: [1.2, 0.4], hand: [2.2, 0.2] }], mouth: 'open', hat: 'viking' },
    { x: 836, H: 84, skin: SKIN.tan, hair: '#2a1a14', style: 'puffs', top: '#ff8fb8', arms: [up(-1), up(1)], mouth: 'open', hat: 'cap', ring: true },
    { x: 948, H: 116, skin: SKIN.light, hair: '#dcd8e0', style: 'short', top: '#ffffff', arms: [{ sx: -1, elbow: [-0.8, 1.0], hand: [-0.2, 1.6] }, { sx: 1, elbow: [0.8, 1.0], hand: [0.2, 1.6] }], mouth: 'open', hat: 'party', stripes: true },
  ];
  for (const d of dippers) {
    const fg = figure({ x: d.x, foot: DIP + (d.ring ? 18 : 40), H: d.H, heads: 3.0, skin: d.skin, hair: d.hair, style: d.style, top: d.top, bottom: '#2a3050', mouth: d.mouth, gaze: (800 - d.x) / 600, arms: d.arms, sleeves: false });
    out.push(fg.svg);
    const { r, headY: hy, torsoTop, tw } = fg;
    if (d.stripes) out.push(path(`M${P(d.x - tw / 2, torsoTop + r * 0.6)}h${f(tw)}v${f(r * 0.24)}h${f(-tw)}zM${P(d.x - tw / 2, torsoTop + r * 1.1)}h${f(tw)}v${f(r * 0.24)}h${f(-tw)}z`, { fill: '#d62838' }));
    if (d.hat === 'santa') out.push(path(`M${P(d.x - r * 1.02, hy - r * 0.4)}C${P(d.x - r * 0.9, hy - r * 1.6)} ${P(d.x + r * 0.6, hy - r * 1.9)} ${P(d.x + r * 1.7, hy - r * 1.2)}C${P(d.x + r * 1.0, hy - r * 1.1)} ${P(d.x + r * 0.9, hy - r * 0.8)} ${P(d.x + r * 1.02, hy - r * 0.4)}Z`, { fill: '#e8243a' }),
      path(`M${P(d.x - r * 1.12, hy - r * 0.26)}Q${P(d.x, hy - r * 0.62)} ${P(d.x + r * 1.12, hy - r * 0.26)}L${P(d.x + r * 1.08, hy - r * 0.58)}Q${P(d.x, hy - r * 0.94)} ${P(d.x - r * 1.08, hy - r * 0.58)}Z`, { fill: '#ffffff' }), circle(d.x + r * 1.74, hy - r * 1.1, r * 0.3, { fill: '#ffffff' }));
    if (d.hat === 'viking') out.push(path(`M${P(d.x - r * 1.04, hy - r * 0.34)}C${P(d.x - r * 1.0, hy - r * 1.36)} ${P(d.x + r * 1.0, hy - r * 1.36)} ${P(d.x + r * 1.04, hy - r * 0.34)}Z`, { fill: '#9aa4b4' }),
      path(`M${P(d.x - r * 1.08, hy - r * 0.3)}h${f(r * 2.16)}v${f(-r * 0.24)}h${f(-r * 2.16)}z`, { fill: '#c8a040' }),
      path(`M${P(d.x - r * 0.9, hy - r * 0.8)}C${P(d.x - r * 1.6, hy - r * 0.9)} ${P(d.x - r * 1.9, hy - r * 1.6)} ${P(d.x - r * 1.6, hy - r * 2.1)}C${P(d.x - r * 1.5, hy - r * 1.6)} ${P(d.x - r * 1.2, hy - r * 1.3)} ${P(d.x - r * 0.8, hy - r * 1.14)}ZM${P(d.x + r * 0.9, hy - r * 0.8)}C${P(d.x + r * 1.6, hy - r * 0.9)} ${P(d.x + r * 1.9, hy - r * 1.6)} ${P(d.x + r * 1.6, hy - r * 2.1)}C${P(d.x + r * 1.5, hy - r * 1.6)} ${P(d.x + r * 1.2, hy - r * 1.3)} ${P(d.x + r * 0.8, hy - r * 1.14)}Z`, { fill: '#fff4e0' }));
    if (d.hat === 'cap') out.push(path(`M${P(d.x - r * 1.06, hy - r * 0.1)}C${P(d.x - r * 1.1, hy - r * 1.4)} ${P(d.x + r * 1.1, hy - r * 1.4)} ${P(d.x + r * 1.06, hy - r * 0.1)}Q${P(d.x, hy - r * 0.5)} ${P(d.x - r * 1.06, hy - r * 0.1)}Z`, { fill: '#ffd166' }),
      path(circD(d.x - r * 0.5, hy - r * 0.8, r * 0.26) + circD(d.x + r * 0.2, hy - r * 1.02, r * 0.26) + circD(d.x + r * 0.76, hy - r * 0.6, r * 0.26), { fill: '#ff6a9a' }),
      path(circD(d.x - r * 0.5, hy - r * 0.8, r * 0.1) + circD(d.x + r * 0.2, hy - r * 1.02, r * 0.1) + circD(d.x + r * 0.76, hy - r * 0.6, r * 0.1), { fill: '#ffffff' }));
    if (d.hat === 'party') out.push(path(`M${P(d.x - r * 0.7, hy - r * 0.62)}L${P(d.x + r * 0.2, hy - r * 2.3)}L${P(d.x + r * 0.84, hy - r * 0.5)}Z`, { fill: '#5b3df5' }),
      line(`M${P(d.x - r * 0.4, hy - r * 1.1)}l${f(r * 1.0)} ${f(r * 0.16)}M${P(d.x - r * 0.08, hy - r * 1.7)}l${f(r * 0.6)} ${f(r * 0.1)}`, '#ffd166', f(r * 0.16)),
      circle(d.x + r * 0.2, hy - r * 2.34, r * 0.24, { fill: '#ffd166' }));
    d.r = r; d.hy = hy; d.fg = fg;
  }
  ppl.santa = [dippers[0].x, dippers[0].hy - 20];
  ppl.dippers = [dippers[0].x + 20, DIP - 56];
  // the water in front of them: a wavy band with foam rings round each dipper and big splashes
  out.push(path(`M440 ${DIP}q30 -10 60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0V830H440Z`, { fill: url('wave') }));
  {
    let foam = '';
    for (const d of dippers) foam += `M${P(d.x - 42, DIP + 2)}q21 -12 42 -4q21 -8 42 4q-21 10 -42 4q-21 6 -42 -4z`;
    out.push(path(foam, { fill: '#ffffff', opacity: 0.85 }));
    let drops = '';
    const drop = (x, y, s, a) => { const c = Math.cos(a), si = Math.sin(a), p = (u, v) => P(x + u * c - v * si, y + u * si + v * c); return `M${p(0, -8 * s)}C${p(5 * s, -2 * s)} ${p(5 * s, 5 * s)} ${p(0, 5 * s)}C${p(-5 * s, 5 * s)} ${p(-5 * s, -2 * s)} ${p(0, -8 * s)}Z`; };
    const Rd = rng(9);
    for (const d of dippers) for (const deg of [-158, -136, -44, -22]) { const a = (deg * Math.PI) / 180, L = 52 + Rd() * 16; drops += drop(d.x + Math.cos(a) * L, DIP - 2 + Math.sin(a) * L * 0.7, 0.9 + Rd() * 0.5, a + Math.PI / 2); }
    out.push(path(drops, { fill: '#e6f4ff', opacity: 0.9 }));
  }
  // the duck rubber ring round the little one
  {
    const k = dippers[2], x = k.x, y = DIP - 2;
    out.push(path(`M${P(x - 46, y)}a46 14 0 1 0 92 0a46 14 0 1 0 -92 0Zm22 -2a24 6 0 1 0 48 0a24 6 0 1 0 -48 0Z`, { fill: url('ring'), 'fill-rule': 'evenodd' }));
    out.push(path(`M${P(x + 36, y - 6)}c-2-20 8-30 20-26c8 4 8 14 2 20z`, { fill: '#ffd23a' }), path(`M${P(x + 62, y - 26)}l12 2l-10 6z`, { fill: '#ff8a1a' }), circle(x + 54, y - 26, 2.2, { fill: '#1a1a1a' }));
    ppl.ring = [x + 52, y - 22];
  }

  // ---- the beach, the shoreline foam, footprints from the huts into the sea
  out.push(C('the sand, a lacy line of foam where the waves run up, footprints running from the huts into the sea'));
  out.push(path(`M-20 ${SHORE}C200 734 420 752 600 746S1000 738 1200 750S1500 744 1620 740V920H-20Z`, { fill: url('sand') }));
  out.push(path(`M-20 ${SHORE}C200 734 420 752 600 746S1000 738 1200 750S1500 744 1620 740`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.85, 'stroke-dasharray': '60 8 24 6' }));
  out.push(path(`M-20 ${SHORE + 8}C200 744 420 760 600 754S1000 748 1200 760S1500 752 1620 750V${SHORE + 26}C1400 770 1000 760 600 772S200 760 -20 768Z`, { fill: '#b88a70', opacity: 0.35 }));
  out.push(ellipse(800, 760, 420, 26, { fill: url('rim') }));
  {
    let prints = '';
    for (let i = 0; i < 14; i++) { const t = i / 13, x = 1180 - t * 300, y = 800 - t * 44 + (i % 2 ? 6 : -4); prints += `M${P(x, y)}a5 3 0 1 0 10 0a5 3 0 1 0-10 0Z`; }
    out.push(path(prints, { fill: '#a87a62', opacity: 0.5 }));
  }

  // ---- the beach huts with bunting
  out.push(C('a row of bright beach huts with striped doors and bunting'));
  {
    const cols = ['#ff8fb8', '#6ac8e0', '#ffd166', '#8ad870', '#b89aff'];
    let bunt = '', buntCols = ['', '', '', '', ''];
    for (let i = 0; i < HUTS.n; i++) {
      const x = HUTS.x0 + i * (HUTS.w + 6), w = HUTS.w, b = HUTS.base + i * 2, top = b - 96, peak = top - 30;
      const col = dawn(cols[i], 0.14);
      out.push(path(`M${P(x, b)}V${f(top)}L${P(x + w / 2, peak)}L${P(x + w, top)}V${f(b)}Z`, { fill: col }));
      out.push(path(`M${P(x - 6, top + 4)}L${P(x + w / 2, peak - 4)}L${P(x + w + 6, top + 4)}`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 7, 'stroke-linejoin': 'round' }));
      out.push(path(`M${P(x + w / 2 - 22, b)}V${f(top + 18)}h44V${f(b)}Z`, { fill: darken(col, 0.12) }));
      out.push(line(`M${P(x + w / 2 - 11, top + 20)}V${f(b)}M${P(x + w / 2, top + 20)}V${f(b)}M${P(x + w / 2 + 11, top + 20)}V${f(b)}`, lighten(col, 0.35), 3));
      out.push(circle(x + w / 2 - 10, top - 6, 7, { fill: '#fff3c4' }), circle(x + w / 2 - 10, top - 6, 7, { fill: 'none', stroke: '#ffffff', 'stroke-width': 2.4 }));
      out.push(path(`M${P(x - 4, b)}h${f(w + 8)}v8h${f(-(w + 8))}z`, { fill: '#8a6a52' }));
      if (i < HUTS.n - 1) {
        const x1 = x + w / 2, x2 = x + w + 6 + w / 2, y = peak + 2;
        for (let k = 1; k < 5; k++) { const t = k / 5, fx = x1 + (x2 - x1) * t, fy = y + Math.sin(t * Math.PI) * 16; buntCols[(i + k) % 5] += `M${P(fx - 6, fy)}h12l-6 12z`; }
        bunt += `M${P(x1, y)}Q${P((x1 + x2) / 2, y + 32)} ${P(x2, y)}`;
      }
    }
    out.push(line(bunt, '#ffffff', 1.6, { opacity: 0.8 }));
    for (let k = 0; k < 5; k++) out.push(path(buntCols[k], { fill: ['#ff4d6d', '#ffd166', '#4ab8e8', '#8ad870', '#ff8fb8'][k] }));
    ppl.huts = [HUTS.x0 + 2 * (HUTS.w + 6) + HUTS.w / 2, HUTS.base - 60];
  }

  // ---- the dog barking at the dippers from the water's edge
  out.push(C('the dog at the water\'s edge, barking at the dippers'));
  out.push(dog(1086, 790, 0.92, '#e8b060', { flip: -1 }));
  out.push(line('M1040 736l-10 -6M1040 744l-14 0M1040 752l-10 6', '#ffffff', 2.4, { opacity: 0.85 }));
  ppl.dog = [1080, 756];

  // ---- the family on the beach: dad with a big towel held open, a child in a dinosaur-hood towel with cocoa
  out.push(C('dad holding a big striped towel open for the dippers, and a child wrapped in a green dinosaur-hood towel with a mug of cocoa'));
  {
    const dx = 420, df = 838;
    const armL = { sx: -1, elbow: [-1.3, -0.3], hand: [-2.3, -1.3] }, armR = { sx: 1, elbow: [1.3, -0.3], hand: [2.3, -1.3] };
    const dadF = figure({ x: dx, foot: df, H: 112, heads: 3.2, skin: SKIN.deep, hair: '#1a1210', style: 'short', top: '#2a4a6a', bottom: '#3a3a44', gaze: 0.5, arms: [armL, armR] });
    const hl = dadF.hand(armL), hr = dadF.hand(armR);
    // the towel: hanging between his hands, stripes
    const towel = `M${P(hl[0] - 4, hl[1])}L${P(hr[0] + 4, hr[1])}L${P(hr[0] + 8, hr[1] + 110)}Q${P(dx, hr[1] + 118)} ${P(hl[0] - 8, hl[1] + 110)}Z`;
    defs.push(E('clipPath', { id: id('towel') }, path(towel)));
    out.push(path(towel, { fill: '#ffd166' }));
    let st = ''; for (let y = hl[1] + 10; y < hl[1] + 110; y += 22) st += `M${P(hl[0] - 20, y)}H${f(hr[0] + 20)}v10H${f(hl[0] - 20)}Z`;
    out.push(G({ 'clip-path': url('towel') }, path(st, { fill: '#ff6a5a' })));
    out.push(path(`M${P(hl[0] - 4, hl[1])}L${P(hr[0] + 4, hr[1])}`, { fill: 'none', stroke: '#fff4e0', 'stroke-width': 4 }));
    out.push(dadF.svg);                                                          // in front of the towel he holds open behind him
    out.push(circle(hl[0], hl[1], dadF.r * 0.36, { fill: SKIN.deep }), circle(hr[0], hr[1], dadF.r * 0.36, { fill: SKIN.deep }));
    ppl.towel = [dx, hl[1] + 50];

    const kx = 512, kf = 846;
    const mug = { sx: -1, elbow: [-0.4, 1.2], hand: [0.5, 0.9] }, mug2 = { sx: 1, elbow: [0.4, 1.2], hand: [-0.5, 0.9] };
    const kid = figure({ x: kx, foot: kf, H: 78, heads: 2.6, skin: SKIN.light, hair: '#e8b84a', style: 'short', top: '#3aa860', bottom: '#3aa860', shoe: '#3a7a40', gaze: 0.2, arms: [mug, mug2] });
    out.push(kid.svg);
    // the dinosaur hood: a green hood round the face with soft spikes and a toothy brim
    const r = kid.r, hy = kid.headY;
    out.push(path(`M${P(kx - r * 1.2, hy + r * 0.6)}C${P(kx - r * 1.5, hy - r * 1.3)} ${P(kx + r * 1.5, hy - r * 1.3)} ${P(kx + r * 1.2, hy + r * 0.6)}L${P(kx + r * 0.92, hy + r * 0.5)}C${P(kx + r * 1.0, hy - r * 0.7)} ${P(kx - r * 1.0, hy - r * 0.7)} ${P(kx - r * 0.92, hy + r * 0.5)}Z`, { fill: '#3aa860' }));
    out.push(path(`M${P(kx - r * 0.9, hy - r * 0.7)}l${f(r * 0.1)} ${f(-r * 0.5)}l${f(r * 0.3)} ${f(r * 0.3)}l${f(r * 0.2)} ${f(-r * 0.6)}l${f(r * 0.3)} ${f(r * 0.5)}l${f(r * 0.3)} ${f(-r * 0.55)}l${f(r * 0.25)} ${f(r * 0.55)}l${f(r * 0.3)} ${f(-r * 0.4)}l${f(r * 0.1)} ${f(r * 0.5)}Z`, { fill: '#8ad870' }));
    out.push(path(`M${P(kx - r * 0.86, hy - r * 0.52)}l${f(r * 0.24)} ${f(r * 0.24)}l${f(r * 0.24)} ${f(-r * 0.2)}l${f(r * 0.24)} ${f(r * 0.22)}l${f(r * 0.24)} ${f(-r * 0.2)}l${f(r * 0.24)} ${f(r * 0.22)}l${f(r * 0.24)} ${f(-r * 0.2)}l${f(r * 0.28)} ${f(r * 0.24)}`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 2.6, 'stroke-linejoin': 'round' }));
    const mh = kid.hand(mug);
    out.push(path(`M${P(mh[0] - 8, mh[1] - 14)}h16v14q0 5-5 5h-6q-5 0-5-5z`, { fill: '#ff6a9a' }), circle(mh[0], mh[1], r * 0.36, { fill: SKIN.light }));
    out.push(line(`M${P(mh[0] - 2, mh[1] - 18)}c-6-6 4-10-2-16M${P(mh[0] + 4, mh[1] - 18)}c-4-6 4-8 0-14`, '#ffffff', 2.2, { opacity: 0.75 }));
    ppl.kid = [kx, hy];
  }

  // ---- little things on the sand: a message in a bottle, a crab, shells, a dropped party hat
  out.push(C('a message in a bottle, a crab, shells and pebbles, a dropped party hat'));
  {
    const bx = 688, by = 832;
    out.push(G({ transform: `translate(${bx} ${by}) rotate(-14)` },
      ellipse(0, 10, 34, 5, { fill: '#000', opacity: 0.15 }),
      path('M-30 -8h36q10 0 14 4h10v8h-10q-4 4 -14 4h-36q-6 0 -6-8t6-8z', { fill: url('bottle') }),
      path('M-24 -4h26v8h-26z', { fill: '#fff4dc' }), line('M-20 -1h18M-20 2h14', '#c8a070', 1.4),
      path('M30 -4h8v8h-8z', { fill: '#b8885a' }), path('M-28 -6h30', { fill: 'none', stroke: '#ffffff', 'stroke-width': 2, opacity: 0.6 })));
    ppl.bottle = [bx, by];
    const cx = 924, cy = 860;
    out.push(G({ transform: `translate(${cx} ${cy})` },
      ellipse(0, 4, 18, 3, { fill: '#000', opacity: 0.15 }),
      line('M-12 0l-8 6M-10 2l-6 8M12 0l8 6M10 2l6 8', '#d84a2a', 2.6),
      line('M-12 -6l-10 -12M12 -6l10 -12', '#d84a2a', 3),
      path('M-26 -24c-4 4 0 10 4 8l-2-4zM26 -24c4 4 0 10-4 8l2-4z', { fill: '#e85a3a' }), circle(-22, -20, 5, { fill: '#e85a3a' }), circle(22, -20, 5, { fill: '#e85a3a' }),
      path('M-14 0c0-10 6-14 14-14s14 4 14 14z', { fill: '#e85a3a' }),
      line('M-5 -14v-6M5 -14v-6', '#d84a2a', 2), circle(-5, -21, 2.6, { fill: '#ffffff' }), circle(5, -21, 2.6, { fill: '#ffffff' }), circle(-5, -21, 1.3, { fill: '#1a1a1a' }), circle(5, -21, 1.3, { fill: '#1a1a1a' })));
    ppl.crab = [cx, cy - 10];
    out.push(G({ transform: 'translate(1032 852) rotate(64)' }, path('M-12 0L0 -30L12 0Z', { fill: '#ff4d6d' }), line('M-6 -10h12M-3 -20h6', '#ffd166', 3), circle(0, -32, 4, { fill: '#ffd166' })));
    ppl.hat = [1024, 846];
    let shells = '';
    const Rs = rng(17);
    for (let i = 0; i < 16; i++) { const x = 40 + Rs() * 1520, y = 790 + Rs() * 100; if (Math.abs(x - 800) < 120 && y < 820) continue; shells += `M${P(x - 4, y)}a4 3 0 1 0 8 0a4 3 0 1 0-8 0Z`; }
    out.push(path(shells, { fill: '#f4e6dc', opacity: 0.9 }));
    out.push(G({ transform: 'translate(1290 856)' }, path('M-12 0a12 12 0 0 1 24 0z', { fill: '#ffb8a8' }), line('M0 0l-8 -9M0 0l0 -11M0 0l8 -9', '#e88a7a', 1.6)));
    ppl.shell = [1290, 850];
  }

  return { svg: compactSvg(doc(`New Year's Day · mid. Concept: "the first sunrise": dawn on 1 January at the seaside. Focal point: four brave dippers in silly hats (a Santa hat, a Viking helmet, a flowery swim cap in a duck ring, a party hat) whooping waist-deep in the icy waves (x 540–1010, y 560–760), right in front of the first sun of the year rising out of the sea; the dog barks at them from the shore. Dad holds a big striped towel open on the beach, a child in a dinosaur-hood towel sips cocoa; a row of bright beach huts with bunting on the right, a groyne with a seagull on the left; a message in a bottle, a crab, shells and a dropped party hat on the sand. Light story: the rising sun is the key light, its pink-gold glow on the horizon and a glittering path on the sea; everything else is cool dawn. The confetti is the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`New Year's Day · front: pebbly sand banks with marram grass in both bottom corners; the center stays open`, [], [
    C('a sandbank with marram grass on the left'),
    path('M-20 900V842Q80 818 190 836T320 900Z', { fill: '#c8987c' }),
    path('M-20 900V868Q90 854 210 874T320 900Z', { fill: '#a87a62' }),
    path('M30 846q-6-50 -20-74M44 842q4-56 24-80M58 846q10-40 38-58M18 844q-14-30 -34-40M74 846q20-30 50-36', { fill: 'none', stroke: '#8a9a5a', 'stroke-width': 4, 'stroke-linecap': 'round' }),
    C('a sandbank with grass on the right'),
    path('M1620 900V840Q1520 820 1420 838T1290 900Z', { fill: '#c8987c' }),
    path('M1620 900V864Q1500 852 1380 874T1290 900Z', { fill: '#a87a62' }),
    path('M1540 842q-4-50 -24-74M1556 840q6-56 30-78M1572 842q14-36 40-50', { fill: 'none', stroke: '#8a9a5a', 'stroke-width': 4, 'stroke-linecap': 'round' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'wish', x: 800, y: 548, r: 52, label: 'Make a wish on the first sunrise' },
      { activity: 'dressup', x: r(ppl.dippers[0]), y: r(ppl.dippers[1]), r: 52, label: 'Pick a silly hat for the dip' },
      { activity: 'color', x: r(ppl.huts[0]), y: r(ppl.huts[1]), r: 70, label: 'Color in the beach huts' },
      { activity: 'card', x: ppl.bottle[0], y: ppl.bottle[1], r: 34, label: 'Write a message for the bottle' },
      { activity: 'catch', x: r(ppl.towel[0]), y: r(ppl.towel[1]), r: 46, label: 'Catch the splashes in the towel' },
    ],
    findables: [
      { id: 'gull', label: 'a seagull on the groyne', x: ppl.gull[0], y: ppl.gull[1], r: 18 },
      { id: 'duck-ring', label: 'a duck rubber ring', x: r(ppl.ring[0]), y: r(ppl.ring[1]), r: 18 },
      { id: 'dog', label: 'a dog barking at the sea', x: ppl.dog[0], y: ppl.dog[1], r: 30 },
      { id: 'crab', label: 'a crab on the sand', x: ppl.crab[0], y: ppl.crab[1], r: 20 },
      { id: 'party-hat', label: 'a dropped party hat', x: ppl.hat[0], y: ppl.hat[1], r: 18 },
      { id: 'shell', label: 'a pink scallop shell', x: ppl.shell[0], y: ppl.shell[1], r: 16 },
      { id: 'dino-hood', label: 'a dinosaur hood', x: r(ppl.kid[0]), y: r(ppl.kid[1]), r: 20 },
    ],
  };
}
