// Memorial Day — "Flowers on the green": a quiet, thankful evening on the town green at the end of May. Beside a
// simple stone memorial with a wreath of red poppies, a girl lays a bunch of flowers and her grandpa, a veteran in
// his cap, stands tall with his hand on his heart; small flags line the path; the flag on the pole flies at
// half-staff. A boy in the town band carries his drum; a family has spread a picnic blanket under the oak; fireflies
// blink in the dusk; a row of white houses with porches and bunting faces the green. The slow red petals are the
// effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, dog, line, circD } from '../../kit/scenekit.mjs';

const ID = 'memorial-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const NIGHT = '#0b1e4a';
const night = (c, k = 0.3) => mix(c, NIGHT, k);
const RED = '#c8243a', BLUE = '#2a3a8a', LAMP = '#ffd98a';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const GREEN = 700;

/** A small stick flag stuck in the grass at (x, y). */
const stickFlag = (x, y, s = 1) => G({ transform: `translate(${f(x)} ${f(y)}) scale(${f(s)})` },
  path('M-1 0v-46h2v46z', { fill: '#e8e0d0' }),
  path('M1 -46h30v20h-30z', { fill: '#ffffff' }), path('M1 -46h30v3h-30zM1 -40h30v3h-30zM1 -34h30v3h-30zM1 -28h30v2h-30z', { fill: RED }), path('M1 -46h13v11h-13z', { fill: BLUE }));

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(8);
  let stars = '';
  for (let i = 0; i < 26; i++) { const left = i % 2 === 0; stars += circD(left ? 20 + R() * 260 : 1330 + R() * 260, 24 + R() * 250, 1 + R() * 1.3); }
  const defs = [lin(id('dusk'), 0, 0, 0, 1, [[0, '#ff9a7a', 0], [0.6, '#e88a8a', 0.35], [1, '#ffb88a', 0.75]])];
  return compactSvg(doc(`Memorial Day · back: a few first stars in the corners and the last warm light of dusk low on the horizon; trees along the far side of the green`, defs, [
    C('first stars, in the corners'),
    path(stars, { fill: '#fff6d8', opacity: 0.8 }),
    C('the last light of dusk, low'),
    path('M-20 440H1620V640H-20Z', { fill: url('dusk') }),
    C('the far trees'),
    path(Array.from({ length: 16 }, (_, k) => circD(-20 + k * 110, 600 + (k % 3) * 8, 60 + (k % 2) * 16)).join(''), { fill: night('#2a5a3a', 0.4) }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('grass'), 0, 0, 0, 1, [[0, night('#5aa85a', 0.25)], [1, night('#3a8a4a', 0.3)]]),
    lin(id('stone'), 0, 0, 1, 0, [[0, '#c8c4bc'], [0.5, '#e8e4dc'], [1, '#a8a49c']]),
    rad(id('win'), 0.5, 0.6, 0.75, [[0, '#fff3cf'], [0.5, '#ffd98a'], [1, '#f0a84a']]),
    rad(id('lamp'), 0.5, 0.5, 0.5, [[0, '#fff3c4', 0.8], [0.35, LAMP, 0.35], [1, LAMP, 0]]),
    rad(id('fly'), 0.5, 0.5, 0.5, [[0, '#f8ffb0', 0.95], [1, '#f8ffb0', 0]]),
  ];

  // ---- the row of white houses with porches across the street
  out.push(C('a row of white clapboard houses with porches and bunting across the street'));
  {
    const R = rng(3);
    for (let x = 230; x < 1340;) {
      const w = 170 + R() * 50, top = 520 + R() * 20;
      out.push(path(`M${P(x, 660)}V${f(top)}L${P(x + w / 2, top - 50)}L${P(x + w, top)}V660Z`, { fill: night('#f4f0e8', 0.35) }));
      out.push(path(`M${P(x + 20, top + 20)}h34v40h-34zM${P(x + w - 54, top + 20)}h34v40h-34z`, { fill: url('win') }));
      out.push(path(`M${P(x - 4, 620)}h${f(w + 8)}v6h${f(-(w + 8))}z`, { fill: night('#e8e0d0', 0.3) }), path(`M${P(x + 10, 626)}v34M${P(x + w - 10, 626)}v34`, { fill: 'none', stroke: night('#e8e0d0', 0.3), 'stroke-width': 4 }));
      let bunt = '';
      for (let k = 0; k < 5; k++) bunt += `M${P(x + 10 + k * (w - 20) / 5, 626)}q${f((w - 20) / 10)} 14 ${f((w - 20) / 5)} 0z`;
      out.push(path(bunt, { fill: RED, opacity: 0.85 }), path(`M${P(x + 10, 626)}H${f(x + w - 10)}`, { fill: 'none', stroke: BLUE, 'stroke-width': 3 }));
      x += w + 30;
    }
  }

  // ---- the green
  out.push(C('the town green and a path to the memorial'));
  out.push(path(`M-20 ${GREEN - 40}H1620V920H-20Z`, { fill: url('grass') }));
  out.push(path('M760 920L780 720H820L840 920Z', { fill: night('#d8ccb0', 0.25) }));
  { const flags = []; for (let k = 0; k < 4; k++) { flags.push(stickFlag(740 - k * 6, 760 + k * 40, 0.9 + k * 0.08), stickFlag(860 + k * 6, 760 + k * 40, 0.9 + k * 0.08)); } out.push(...flags); }
  ppl.path = [800, 820];

  // ---- the flagpole at half-staff
  out.push(C('the flagpole, its flag at half-staff'));
  out.push(path('M1052 700V330h8V700Z', { fill: '#d8dce4' }), circle(1056, 326, 7, { fill: '#ffd166' }));
  out.push(G({ transform: 'translate(1060 470)' }, path('M0 0q40 8 80 0t80 0v84q-40 8 -80 0t-80 0z', { fill: '#ffffff' }),
    path('M0 0q40 8 80 0t80 0v12q-40 8 -80 0t-80 0zM0 24q40 8 80 0t80 0v12q-40 8 -80 0t-80 0zM0 48q40 8 80 0t80 0v12q-40 8 -80 0t-80 0zM0 72q40 8 80 0t80 0v12q-40 8 -80 0t-80 0z', { fill: RED }),
    path('M0 0q32 6 64 2v46q-32 4 -64 -2z', { fill: BLUE }), path(Array.from({ length: 9 }, (_, k) => circD(8 + (k % 3) * 20, 10 + Math.floor(k / 3) * 13, 2.4)).join(''), { fill: '#ffffff' })));
  ppl.flag = [1140, 512];

  // ---- the stone memorial with its poppy wreath
  out.push(C('a simple stone memorial with a wreath of red poppies, its step lined with flowers'));
  {
    out.push(path('M720 720h160v-16h-160z', { fill: '#a8a49c' }), path('M740 704V560l60 -40l60 40V704Z', { fill: url('stone') }), path('M760 600h80M760 616h60', { fill: 'none', stroke: '#9a968e', 'stroke-width': 4 }));
    out.push(circle(800, 512, 10, { fill: '#d8d4cc' }));
    let wreath = '';
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; wreath += circD(800 + Math.cos(a) * 30, 650 + Math.sin(a) * 30, 9); }
    out.push(circle(800, 650, 30, { fill: 'none', stroke: '#2a6a3a', 'stroke-width': 10 }), path(wreath, { fill: RED }), path(Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2; return circD(800 + Math.cos(a) * 30, 650 + Math.sin(a) * 30, 3); }).join(''), { fill: '#1a1a1a' }));
    out.push(path('M790 676l-6 18h12zM810 676l6 18h-12z', { fill: RED }));
    ppl.wreath = [800, 650];
  }

  // ---- the girl laying flowers and her grandpa saluting with his hand on his heart
  out.push(C('a girl kneels to lay a bunch of flowers at the memorial; her grandpa, a veteran in his cap, stands with his hand on his heart'));
  {
    const lay = { sx: 1, elbow: [0.9, 0.6], hand: [1.6, 1.0] };
    const g = figure({ x: 680, foot: 760, H: 80, heads: 2.7, skin: SKIN.brown, hair: '#1a1210', style: 'puffs', top: '#ffffff', bottom: BLUE, shoe: RED, gaze: 0.5, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, lay] });
    out.push(g.svg);
    const h = g.hand(lay);
    out.push(line(`M${P(h[0] - 4, h[1])}l26 -6M${P(h[0] - 4, h[1])}l24 4M${P(h[0] - 4, h[1])}l28 -1`, '#3a8a4a', 3), path(circD(h[0] + 26, h[1] - 8, 6) + circD(h[0] + 24, h[1] + 4, 6) + circD(h[0] + 30, h[1] - 2, 6), { fill: '#ff6a8a' }), circle(h[0] + 30, h[1] - 2, 2.6, { fill: '#ffd166' }), circle(h[0], h[1], g.r * 0.36, { fill: SKIN.brown }));
    ppl.flowers = [h[0] + 26, h[1] - 2];
    const heart = { sx: 1, elbow: [0.5, 0.7], hand: [-0.4, 0.5] };
    const gp = figure({ x: 590, foot: 770, H: 128, heads: 3.3, skin: SKIN.brown, hair: '#dcd8e0', style: 'short', top: '#4a5a3a', bottom: '#2a2a3a', gaze: 0.5, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.5, 1.0], hand: [-0.3, 1.9] }, heart] });
    out.push(gp.svg);
    const r = gp.r, hy = gp.headY;
    out.push(path(`M${P(590 - r * 1.0, hy - r * 0.4)}C${P(590 - r * 1.0, hy - r * 1.3)} ${P(590 + r * 1.0, hy - r * 1.3)} ${P(590 + r * 1.0, hy - r * 0.4)}Z`, { fill: '#3a4a2a' }), path(`M${P(590 - r * 1.04, hy - r * 0.42)}h${f(r * 2.6)}`, { fill: 'none', stroke: '#2a3a1a', 'stroke-width': f(r * 0.18), 'stroke-linecap': 'round' }), circle(590 - r * 0.3, hy - r * 0.8, r * 0.14, { fill: '#ffd166' }));
    out.push(circle(590 - gp.tw * 0.18, gp.torsoTop + r * 0.6, 5, { fill: RED }), path(`M${P(590 - gp.tw * 0.3, gp.torsoTop + r * 0.9)}h10v6h-10z`, { fill: '#ffd166' }));
    out.push(circle(gp.hand(heart)[0], gp.hand(heart)[1], r * 0.36, { fill: SKIN.brown }));
    ppl.grandpa = [590, hy];
  }

  // ---- the boy from the town band with his drum, and a dog
  out.push(C('a boy from the town band in his white cap carries his drum; a dog sits beside him'));
  {
    const sticks = { sx: -1, elbow: [-0.7, 0.4], hand: [-0.4, 1.0] }, sticks2 = { sx: 1, elbow: [0.7, 0.4], hand: [0.4, 1.0] };
    const b = figure({ x: 960, foot: 860, H: 88, heads: 2.7, skin: SKIN.fair, hair: '#c8642a', style: 'short', top: BLUE, bottom: '#ffffff', shoe: '#1a1a1a', gaze: -0.4, mouth: 'smile', arms: [sticks, sticks2] });
    out.push(b.svg);
    const r = b.r, hy = b.headY;
    out.push(path(`M${P(960 - r * 0.95, hy - r * 0.45)}V${f(hy - r * 1.2)}h${f(r * 1.9)}V${f(hy - r * 0.45)}z`, { fill: '#ffffff' }), path(`M${P(960 - r * 1.0, hy - r * 0.5)}h${f(r * 2.2)}v${f(r * 0.2)}h${f(-r * 2.2)}z`, { fill: '#1a1a1a' }), circle(960, hy - r * 0.9, r * 0.16, { fill: '#ffd166' }));
    out.push(path(`M${P(960 - b.tw * 0.5, b.torsoTop)}l${f(b.tw)} ${f(b.r * 2)}`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 4 }));
    const dy = b.torsoBot + 6;
    out.push(ellipse(960, dy - 12, 34, 9, { fill: '#f4ece0' }), path(`M926 ${dy - 12}v26a34 9 0 0 0 68 0v-26`, { fill: RED }), path(`M926 ${dy - 6}l12 18l12 -18l12 18l12 -18l12 18l12 -18`, { fill: 'none', stroke: '#ffd166', 'stroke-width': 2.4 }), ellipse(960, dy - 12, 34, 9, { fill: 'none', stroke: '#d8d0c0', 'stroke-width': 3 }));
    const s1 = b.hand(sticks), s2 = b.hand(sticks2);
    out.push(line(`M${P(...s1)}l14 -18M${P(...s2)}l-14 -18`, '#e8d0a0', 4), circle(s1[0], s1[1], r * 0.36, { fill: SKIN.fair }), circle(s2[0], s2[1], r * 0.36, { fill: SKIN.fair }));
    ppl.drum = [960, dy - 4];
    out.push(dog(1050, 862, 0.85, '#2a2a2a', { flip: -1 }));
    out.push(path('M1022 818q12 8 24 0l-4 10q-8 4 -16 0z', { fill: RED }));
    ppl.dog = [1050, 820];
  }

  // ---- the oak with the family picnic
  out.push(C('a big oak on the left with a family picnic on a blanket beneath it'));
  {
    const t = bareTree(170, 760, 440, 13, { lean: 0.04, depth: 5, spread: 0.55, trunk: 0.13 });
    out.push(path(t.d, { fill: night('#5a4a3a', 0.2) }));
    out.push(path(t.tips.map(([x, y]) => circD(x, y, 40)).join(''), { fill: night('#3a7a3a', 0.35) }));
    out.push(path('M150 860L190 790H470L510 860Z', { fill: '#ffffff' }), path('M190 790L180 808H480L470 790ZM170 825L160 843H500L490 825Z', { fill: RED }), path('M230 790L210 860M300 790L290 860M370 790L370 860M440 790L450 860', { fill: 'none', stroke: RED, 'stroke-width': 10, opacity: 0.6 }));
    out.push(path(`M${232} 806h60l-6 30h-48z`, { fill: '#c8945a' }), path('M232 806q30 -40 60 0', { fill: 'none', stroke: '#a86a30', 'stroke-width': 4 }));
    out.push(ellipse(380, 830, 26, 7, { fill: '#ffffff' }), path(circD(370, 824, 6) + circD(386, 822, 6), { fill: RED }), ellipse(440, 820, 20, 6, { fill: '#ffffff' }), path('M428 816q12 -12 24 0z', { fill: '#e8a050' }));
    const mum = figure({ x: 300, foot: 800, H: 112, heads: 3.2, skin: SKIN.light, hair: '#c8642a', style: 'side', top: '#5ab8e8', bottom: '#2a3a6a', gaze: 0.5, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.3, 1.8] }, { sx: 1, elbow: [0.8, 0.8], hand: [1.2, 1.2] }] });
    out.push(mum.svg);
    const wave = { sx: 1, elbow: [0.9, -0.8], hand: [1.2, -2.0] };
    const k = figure({ x: 420, foot: 812, H: 70, heads: 2.6, skin: SKIN.light, hair: '#e8b84a', style: 'short', top: RED, bottom: BLUE, shoe: '#ffffff', gaze: 0.5, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.8] }, wave] });
    out.push(k.svg);
    const kh = k.hand(wave);
    out.push(stickFlag(kh[0], kh[1] + 10, 0.8), circle(kh[0], kh[1], k.r * 0.36, { fill: SKIN.light }));
    ppl.picnic = [330, 820];
  }

  // ---- a street lamp and fireflies
  out.push(path('M1240 860V640h8V860Z', { fill: '#2a2a3a' }), path('M1228 640h32l-6 -36h-20z', { fill: '#fff3c4' }), path('M1224 606h40l-6 -10h-28z', { fill: '#2a2a3a' }), circle(1244, 624, 70, { fill: url('lamp') }));
  { const R = rng(19); for (let k = 0; k < 16; k++) { const x = 100 + R() * 1400, y = 700 + R() * 150; out.push(circle(x, y, 9, { fill: url('fly') }), circle(x, y, 2, { fill: '#fbffd0' })); } }
  ppl.lamp = [1244, 624];

  return { svg: compactSvg(doc(`Memorial Day · mid. Concept: "flowers on the green", a quiet, thankful evening at the end of May. Focal point: a simple stone memorial with a wreath of red poppies (x 560–880, y 500–780) where a girl kneels to lay a bunch of flowers while her grandpa, a veteran in his cap, stands with his hand on his heart; small flags line the path; the flag on the pole flies at half-staff. A boy from the town band carries his red drum with a dog beside him; a family has a picnic under the oak; fireflies blink; white houses with porches and bunting face the green. Light story: the last warm dusk on the horizon, lit windows and a street lamp. The slow red petals are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Memorial Day · front: red poppies in the grass in both bottom corners; the centre stays open`, [], [
    C('poppies bottom left'),
    path('M20 900q-4 -50 6 -90M60 900q4 -60 -6 -110M100 900q6 -40 14 -76', { fill: 'none', stroke: '#2a6a3a', 'stroke-width': 4 }),
    path(circD(26, 806, 18) + circD(54, 788, 20) + circD(114, 820, 16), { fill: RED }), path(circD(26, 806, 5) + circD(54, 788, 6) + circD(114, 820, 5), { fill: '#1a1a1a' }),
    C('poppies bottom right'),
    path('M1520 900q-6 -50 4 -86M1560 900q4 -60 -4 -104M1590 900q8 -40 12 -70', { fill: 'none', stroke: '#2a6a3a', 'stroke-width': 4 }),
    path(circD(1524, 810, 18) + circD(1556, 792, 20) + circD(1600, 826, 16), { fill: RED }), path(circD(1524, 810, 5) + circD(1556, 792, 6) + circD(1600, 826, 5), { fill: '#1a1a1a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'card', x: r(ppl.flowers[0]), y: r(ppl.flowers[1]), r: 36, label: 'Make a thank-you card' },
      { activity: 'colour', x: ppl.wreath[0], y: ppl.wreath[1], r: 40, label: 'Colour the poppy wreath' },
      { activity: 'wish', x: ppl.flag[0], y: ppl.flag[1], r: 50, label: 'A moment to remember' },
      { activity: 'memory', x: ppl.picnic[0], y: ppl.picnic[1], r: 44, label: 'Match the picnic treats' },
    ],
    findables: [
      { id: 'drum', label: 'a red drum', x: ppl.drum[0], y: ppl.drum[1], r: 26 },
      { id: 'dog', label: 'a dog in a bandana', x: ppl.dog[0], y: ppl.dog[1], r: 24 },
      { id: 'cap', label: 'grandpa\'s cap', x: r(ppl.grandpa[0]), y: r(ppl.grandpa[1] - 20), r: 18 },
      { id: 'basket', label: 'a picnic basket', x: 262, y: 818, r: 22 },
      { id: 'lamp', label: 'the street lamp', x: ppl.lamp[0], y: ppl.lamp[1], r: 24 },
      { id: 'little-flag', label: 'a little flag', x: 744, y: 740, r: 18 },
      { id: 'firefly', label: 'a firefly', x: 1380, y: 760, r: 30 },
    ],
  };
}
