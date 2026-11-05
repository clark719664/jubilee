// Boxing Day — "The box is the best present": a snowy hillside walk at dusk on 26 December. Two children in
// Christmas-cracker paper crowns whoosh down the slope in yesterday's cardboard box; another hauls a wooden sled
// back up. On the path below, mum in her new Christmas jumper points up at them, grandad holds a ball up for the
// eager dog, and a snowman wears a paper crown too. A dry-stone wall with a five-bar gate, a robin and a red
// postbox on the left; a frozen pond with a skidding duck on the right; a village and its church far away.
// The snowfall is the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, pineSil, bobbleHat, scarf, dog, owl, foxPeek, terrace, line, circD } from '../../kit/scenekit.mjs';

const ID = 'boxing-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

// ---- palette: snow at dusk under the Christmas night-green sky, a pale last light on the horizon
const SKY = '#14503c';
const dusk = (c, k = 0.3) => mix(c, SKY, k);
const SNOW = '#eef4f6', SHADE = '#b6c8d4', GLOW = '#c8f0dc', LAMP = '#ffd98a';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };

// ---- layout
/** The sledging slope: a cubic from the meadow (left) up to the crest (right). x rises with t, so it is a function of x. */
const SLOPE = [[600, 772], [820, 742], [1100, 540], [1420, 500]];
const bez = (t) => {
  const u = 1 - t, w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [0, 1].map((k) => SLOPE.reduce((s, p, i) => s + w[i] * p[k], 0));
};
const tAt = (x) => { let lo = 0, hi = 1; for (let i = 0; i < 32; i++) { const m = (lo + hi) / 2; if (bez(m)[0] < x) lo = m; else hi = m; } return lo; };
const hillAt = (x) => bez(tAt(x))[1];
const slopeDeg = (x) => (Math.atan2(hillAt(x + 4) - hillAt(x - 4), 8) * 180) / Math.PI;
const MEADOW = 'M-20 776C200 766 420 770 620 778S1100 794 1620 782V920H-20Z';
const WALL = { x0: -20, x1: 540, top: 716, base: 784 };
const GATE = { x0: 150, x1: 290 };
const BOX = { x: 850 };
const POST = { x: 478, y: 724 };
const POND = { cx: 1400, cy: 846, rx: 168, ry: 26 };

/** A paper cracker crown on a head at (cx, cy) radius r. */
const crown = (cx, cy, r, col, tilt = 0) => G({ transform: `rotate(${tilt} ${f(cx)} ${f(cy)})` },
  path(`M${P(cx - 0.98 * r, cy - 0.42 * r)}L${P(cx - 0.98 * r, cy - 1.22 * r)}L${P(cx - 0.65 * r, cy - 0.86 * r)}L${P(cx - 0.33 * r, cy - 1.32 * r)}L${P(cx, cy - 0.86 * r)}L${P(cx + 0.33 * r, cy - 1.32 * r)}L${P(cx + 0.65 * r, cy - 0.86 * r)}L${P(cx + 0.98 * r, cy - 1.22 * r)}L${P(cx + 0.98 * r, cy - 0.42 * r)}Q${P(cx, cy - 0.62 * r)} ${P(cx - 0.98 * r, cy - 0.42 * r)}Z`, { fill: col }),
  path(`M${P(cx - 0.9 * r, cy - 0.56 * r)}Q${P(cx, cy - 0.74 * r)} ${P(cx + 0.9 * r, cy - 0.56 * r)}`, { fill: 'none', stroke: lighten(col, 0.4), 'stroke-width': f(Math.max(1.4, r * 0.08)), opacity: 0.8 }));

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(3);
  // stars only in the corners, clear of the copy zone (x 300–1300, y < 430)
  let stars = '';
  for (let i = 0; i < 22; i++) { const left = i % 2 === 0; stars += circD(left ? 20 + R() * 250 : 1330 + R() * 250, 24 + R() * 230, 1.1 + R() * 1.3); }
  const village = terrace(-30, 300, 652, 9, { hMin: 44, hMax: 60, wMin: 54, wMax: 80 });
  const church = 'M206 652V572H238V652ZM202 574L222 502L242 574ZM238 652V610H296V652Z';
  let pines = '';
  for (const [x, h] of [[360, 40], [392, 52], [420, 36], [980, 44], [1012, 58], [1046, 40], [1180, 46], [1208, 34]]) pines += pineSil(x, 600 + R() * 8, h, h * 0.6);
  const defs = [
    rad(id('glow'), 0.5, 0.5, 0.5, [[0, GLOW, 0.5], [0.55, GLOW, 0.2], [1, GLOW, 0]]),
    rad(id('winglow'), 0.5, 0.5, 0.5, [[0, LAMP, 0.5], [1, LAMP, 0]]),
  ];
  const wins = village.windows.filter(([, y]) => y < 636);
  return compactSvg(doc(`Boxing Day · back: the last pale light on the horizon, far snowy hills with dark pines, a village with lit windows and a church spire far away on the left, a few stars in the corners`, defs, [
    C('a few stars in the corners'),
    path(stars, { fill: '#fff6d8', opacity: 0.8 }),
    C('the last light of the day, low on the horizon'),
    ellipse(800, 650, 1000, 210, { fill: url('glow') }),
    C('far hills and pines'),
    path('M-20 604C200 566 420 584 640 594S1100 566 1360 584S1560 576 1620 572V700H-20Z', { fill: dusk(SNOW, 0.58) }),
    path(pines, { fill: dusk('#0c2a22', 0.3) }),
    path('M-20 652C300 624 600 662 900 644S1400 624 1620 642V720H-20Z', { fill: dusk(SNOW, 0.44) }),
    C('the village and its church'),
    path(village.d + church, { fill: dusk('#1a3a32', 0.2) }),
    wins.map(([x, y, w, h]) => ellipse(x + w / 2, y + h / 2, w * 1.2, h, { fill: url('winglow') })).join(''),
    path(wins.map(([x, y]) => `M${P(x, y)}h8v10h-8Z`).join('') + 'M216 590h12v16h-12Z', { fill: LAMP, opacity: 0.9 }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('field'), 0, 0, 0, 1, [[0, dusk(SNOW, 0.3)], [1, dusk(SNOW, 0.16)]]),
    lin(id('hill'), 0, 0, 0, 1, [[0, '#f4faf6'], [0.5, '#dfe9ee'], [1, '#c8d6e0']], { gradientUnits: 'userSpaceOnUse', x1: 0, y1: 500, x2: 0, y2: 800 }),
    lin(id('meadow'), 0, 0, 0, 1, [[0, '#e6eef2'], [1, '#c4d4de']]),
    lin(id('box'), 0, 0, 0, 1, [[0, '#d8a066'], [1, '#b47a42']]),
    lin(id('ice'), 0, 0, 0, 1, [[0, '#d4ecf4'], [1, '#8ab8d0']]),
    lin(id('wood'), 0, 0, 0, 1, [[0, '#a8784a'], [1, '#7a5030']]),
    rad(id('lastlight'), 0.7, 0.2, 0.7, [[0, GLOW, 0.4], [1, GLOW, 0]]),
  ];

  // ---- the middle field behind the wall, two sheep, the old tree
  out.push(C('the field behind the wall, an old bare tree with an owl, two sheep'));
  out.push(path('M-20 672C200 652 420 664 640 682S900 700 960 700V800H-20Z', { fill: url('field') }));
  const tree = bareTree(70, 760, 420, 7, { lean: 0.04, depth: 6, spread: 0.42 });
  out.push(path(tree.d, { fill: dusk('#3a2e2a', 0.2) }));
  out.push(owl(76, 626, 0.9, '#9a7a5a'));
  ppl.owl = [76, 610];
  const sheep = (x, y, s, flip = 1) => G({ transform: `translate(${f(x)} ${f(y)}) scale(${f(s * flip)} ${f(s)})` },
    path('M-24 0c-8 0-12-10-6-16c-4-10 6-18 14-12c4-10 18-10 22 0c10-4 18 4 14 12c8 4 6 16-4 16z', { fill: '#f6f3ea' }),
    path('M-10 -4c2 4 10 4 12 0M6 -6c2 4 8 4 10 0', { fill: 'none', stroke: '#d8d2c4', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    ellipse(-28, -14, 9, 12, { fill: '#2a2a30', transform: 'rotate(18 -28 -14)' }),
    path('M-36 -24c-8 0-10 4-6 6c4 0 6-2 6-6zM-22 -24c6-2 10 2 6 5c-4 0-6-2-6-5z', { fill: '#2a2a30' }),
    circle(-31, -16, 2, { fill: '#ffffff' }), circle(-31, -16, 1, { fill: '#1a1a1a' }));
  out.push(sheep(330, 712, 1, 1), sheep(398, 720, 0.82, -1));
  ppl.sheep = [330, 700];

  // ---- the hill on the right, its crest pines, the fox, the sled tracks
  out.push(C('the sledging hill: lit by the last light at the crest, pines and a peeking fox on top'));
  const [a, b, c2, d2] = SLOPE;
  out.push(path(`M520 792L${P(...a)}C${P(...b)} ${P(...c2)} ${P(...d2)}S1600 492 1640 500V900H520Z`, { fill: url('hill') }));
  out.push(path(`M${P(...a)}C${P(...b)} ${P(...c2)} ${P(...d2)}S1600 492 1640 500`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 5, opacity: 0.8 }));
  out.push(ellipse(1460, 520, 260, 80, { fill: url('lastlight') }));
  out.push(foxPeek(1452, 503, 0.9));
  out.push(path('M1396 520C1404 498 1440 494 1470 500C1490 504 1500 512 1506 520Z', { fill: '#f4faf6' }));            // a drift the fox peeks over
  ppl.fox = [1430, 486];
  let crestPines = '';
  for (const [x, h, w] of [[1496, 150, 84], [1560, 186, 100], [1612, 140, 80]]) crestPines += pineSil(x, 506, h, w);
  out.push(path(crestPines, { fill: dusk('#1e4a38', 0.15) }));
  { let snowTips = ''; for (const [x, h, w] of [[1496, 150, 84], [1560, 186, 100], [1612, 140, 80]]) for (let i = 0; i < 4; i++) { const t = i / 4, y = 506 - h * t * 0.86, hw = (w * (1 - t * 0.7)) / 2; snowTips += `M${P(x - hw, y)}Q${P(x, y + 8)} ${P(x + hw, y)}L${P(x + hw * 0.78, y - 7)}Q${P(x, y)} ${P(x - hw * 0.78, y - 7)}Z`; } out.push(path(snowTips, { fill: SNOW, opacity: 0.85 })); }
  // the box's tracks: two grooves from the crest down to the box, and a spray of snow behind it
  const t0 = tAt(BOX.x + 70);
  const groove = (dy) => { let d = ''; for (let t = t0; t <= 0.985; t += 0.03) { const [x, y] = bez(t); d += `${d ? 'L' : 'M'}${P(x, y + dy)}`; } return d; };
  out.push(line(groove(10) + groove(20), SHADE, 3));

  // ---- the kid hauling a wooden sled back up, near the crest
  out.push(C('a girl hauling a wooden sled back up the hill for another go'));
  {
    const kx = 1320, kf = hillAt(1320) + 4;
    const pull = { sx: -1, elbow: [-0.9, 0.6], hand: [-1.8, 1.2], back: true };
    const k = figure({ x: kx, foot: kf, H: 56, heads: 2.6, skin: SKIN.deep, hair: '#1a1210', style: 'puffs', top: '#7a3ab0', bottom: '#2a2a4a', shoe: '#e8343a', gaze: -0.3, mouth: 'open',
      arms: [pull, { sx: 1, elbow: [0.7, 1.1], hand: [0.5, 2.0] }] });
    const sx = 1252, sy = hillAt(1252), deg = slopeDeg(1252);
    out.push(G({ transform: `translate(${P(sx, sy)}) rotate(${f(deg)})` },
      ellipse(0, 2, 34, 4, { fill: '#000', opacity: 0.18 }),
      line('M-30 0H24q12 0 14-12', '#b8202a', 4),
      path('M-28 -14h50v8h-50z', { fill: url('wood') }), line('M-20 -6v6M14 -6v6', '#7a5030', 4)));
    const hd = k.hand(pull);
    out.push(line(`M${P(sx + 30, sy - 12)}Q${P((sx + hd[0]) / 2, Math.max(sy, hd[1]) + 6)} ${P(...hd)}`, '#e8d0a0', 2.2));
    out.push(k.svg, scarf(kx, k.torsoTop - 1, k.r * 1.8, '#ffd166', 1));
    ppl.hauler = [kx, k.headY];
  }

  // ---- the stone wall with its gate, the robin, the mitten on the gatepost, the postbox
  out.push(C('a dry-stone wall with snow along the top, a five-bar gate, a robin, a lost mitten and a red postbox'));
  out.push(path(`M${WALL.x0} ${WALL.top + 4}H${GATE.x0}V${WALL.base}H${WALL.x0}ZM${GATE.x1} ${WALL.top + 4}H${WALL.x1}q10 0 12 14l4 ${WALL.base - WALL.top - 18}H${GATE.x1}Z`, { fill: dusk('#4a5560', 0.2) }));
  {
    const R = rng(31);
    let stones = '', lights = '';
    for (let row = 0; row < 4; row++) {
      const y = WALL.top + 7 + row * 16;
      let x = WALL.x0 + (row % 2) * 14;
      while (x < WALL.x1 - 6) {
        const w = Math.min(22 + R() * 18, WALL.x1 + 6 - x);
        if (!(x + w > GATE.x0 - 2 && x < GATE.x1 + 2) && w > 8) {
          stones += `M${P(x + 4, y)}h${f(w - 8)}q4 0 4 4v6q0 4-4 4h${f(-(w - 8))}q-4 0-4-4v-6q0-4 4-4z`;
          lights += `M${P(x + 4, y + 2)}h${f(w * 0.4)}`;
        }
        x += w + 3;
      }
    }
    out.push(path(stones, { fill: dusk('#8a96a4', 0.18) }), line(lights, '#b8c4d0', 2, { opacity: 0.6 }));
    let snowTop = '';
    for (const [x0, x1] of [[WALL.x0, GATE.x0], [GATE.x1, WALL.x1 + 8]]) {
      snowTop += `M${P(x0, WALL.top + 10)}`;
      const n = Math.max(1, Math.round((x1 - x0) / 40)), step = (x1 - x0) / n;
      for (let i = 0; i < n; i++) snowTop += `q${f(step / 2)} ${f(-12 - R() * 4)} ${f(step)} 0`;
      snowTop += `v6H${f(x0)}Z`;
    }
    out.push(path(snowTop, { fill: SNOW }));
  }
  // the gate: two posts, five bars and a brace
  {
    const { x0, x1 } = GATE, top = 712, bot = 780;
    out.push(path(`M${x0 - 4} 790V694h16v96ZM${x1 - 12} 790V694h16v96Z`, { fill: url('wood') }));
    let bars = '';
    for (let i = 0; i < 5; i++) bars += `M${x0 + 12} ${top + i * 16}H${x1 - 12}v7H${x0 + 12}Z`;
    out.push(path(bars, { fill: '#a8784a' }), line(`M${x0 + 16} ${bot - 8}L${x1 - 16} ${top + 6}`, '#8a5a34', 7));
    out.push(path(`M${x0 + 10} ${top + 1}q${(x1 - x0) / 2 - 10} -8 ${x1 - x0 - 20} 0v3H${x0 + 10}Z`, { fill: SNOW }));
    out.push(path(`M${x0 - 6} 696q10-10 20 0zM${x1 - 14} 696q10-10 20 0z`, { fill: SNOW }));
    // a lost red mitten pushed onto the left post
    out.push(G({ transform: `translate(${x0 + 4} 690) rotate(-8)` }, path('M-9 0v-18q0-9 9-9q9 0 9 9v18z', { fill: '#d62828' }), path('M9 -12q8-2 8 6q0 4-8 4z', { fill: '#d62828' }), path('M-10 -2h20v6h-20z', { fill: '#fff4e6' })));
    ppl.mitten = [x0 + 4, 676];
    // the robin on the top bar
    const rx = 238, ry = top;
    out.push(G({ transform: `translate(${rx} ${ry})` },
      path('M-12 0c-4-14 4-22 14-18c8 3 9 12 4 18z', { fill: '#7a5a3a' }), path('M-8 -4c0-8 5-10 10-7c2 4 0 8-5 9z', { fill: '#e8501e' }),
      circle(-6, -16, 1.6, { fill: '#1a1010' }), path('M-11 -15l-5 1l5 1.6z', { fill: '#e8a030' }), path('M6 -4l11 -3l-7 7z', { fill: '#5a4028' }),
      line('M-4 0v3M2 0v3', '#5a4028', 1.4)));
    ppl.robin = [rx, ry - 10];
  }
  // the postbox set into the wall
  out.push(path(`M${POST.x - 17} 774V${POST.y + 12}q0-14 17-14q17 0 17 14V774Z`, { fill: '#c8162a' }));
  out.push(path(`M${POST.x - 11} ${POST.y + 18}h22v4h-22z`, { fill: '#2a0a0e' }), circle(POST.x, POST.y + 34, 3.2, { fill: '#ffd166' }));
  out.push(path(`M${POST.x - 19} ${POST.y + 4}q19-16 38 0v4q-19-12-38 0z`, { fill: SNOW }));
  ppl.post = [POST.x, POST.y + 24];

  // ---- the snowy meadow in front, the path and its footprints
  out.push(C('the snowy meadow in front, a trodden path with footprints'));
  out.push(path(MEADOW, { fill: url('meadow') }));
  out.push(path('M-20 778C200 768 420 772 620 780S1100 796 1620 784', { fill: 'none', stroke: '#ffffff', 'stroke-width': 4, opacity: 0.85 }));
  out.push(path('M-20 840C300 822 700 852 1000 846S1400 830 1620 838V858C1400 852 1000 868 700 870S300 846 -20 860Z', { fill: SHADE, opacity: 0.35 }));
  {
    let prints = '';
    for (let x = 20; x < 1180; x += 28) { const y = 846 + Math.sin(x / 140) * 6 + ((x / 28) % 2 ? 5 : -3); prints += `M${P(x, y)}a5 3 0 1 0 10 0a5 3 0 1 0-10 0Z`; }
    out.push(path(prints, { fill: SHADE, opacity: 0.55 }));
  }
  // a holly bush by the gate
  {
    const R = rng(12);
    let leaves = '', berries = '';
    const holly = (x, y, a) => { const c = Math.cos(a), s2 = Math.sin(a), q = (u, v) => P(x + u * c - v * s2, y + u * s2 + v * c);
      return `M${q(-12, 0)}L${q(-8, -5)}L${q(-4, -3)}L${q(0, -7)}L${q(4, -3)}L${q(8, -5)}L${q(12, 0)}L${q(8, 5)}L${q(4, 3)}L${q(0, 7)}L${q(-4, 3)}L${q(-8, 5)}Z`; };
    const bush = circD(104, 772, 24) + circD(132, 760, 28) + circD(160, 774, 22) + circD(124, 784, 26);
    for (let i = 0; i < 18; i++) { const a = R() * Math.PI * 2, rr = 8 + R() * 22; leaves += holly(130 + Math.cos(a) * rr * 1.3, 768 + Math.sin(a) * rr * 0.8, R() * Math.PI); }
    for (let i = 0; i < 4; i++) { const x = 108 + R() * 50, y = 752 + R() * 28; berries += circD(x, y, 3.6) + circD(x + 6, y + 2, 3.6) + circD(x + 2, y + 6, 3.6); }
    out.push(path(bush, { fill: '#1e4a30' }), path(leaves, { fill: '#2f7a46' }), path(berries, { fill: '#e8243a' }));
  }

  // ---- the frozen pond with a skidding duck and reeds
  out.push(C('a frozen pond: a duck skids across the ice; reeds at the edge'));
  out.push(ellipse(POND.cx, POND.cy + 4, POND.rx + 10, POND.ry + 6, { fill: '#ffffff' }));
  out.push(ellipse(POND.cx, POND.cy, POND.rx, POND.ry, { fill: url('ice') }));
  out.push(line(`M${POND.cx - 120} ${POND.cy - 6}l60 -4M${POND.cx - 40} ${POND.cy + 8}l70 -6M${POND.cx + 60} ${POND.cy - 10}l50 -2`, '#ffffff', 3, { opacity: 0.7 }));
  out.push(line(`M${POND.cx + 4} ${POND.cy + 2}h-60M${POND.cx - 2} ${POND.cy + 10}h-44`, '#ffffff', 2, { opacity: 0.8, 'stroke-dasharray': '6 6' }));
  {
    const dx = POND.cx - 80, dy = POND.cy + 4;          // on the left of the pond, clear of the mascot's corner
    out.push(G({ transform: `translate(${dx} ${dy}) rotate(-6)` },
      ellipse(0, 2, 22, 3, { fill: '#000', opacity: 0.15 }),
      path('M-18 -4c0-14 14-20 28-14l10-2l-4 8c4 8-4 14-12 14h-16c-4 0-6-2-6-6z', { fill: '#ffffff' }),
      path('M-4 -14c6-4 14-2 16 4c-6 0-12 0-16-4z', { fill: '#e8eef2' }),
      circle(-12, -22, 10, { fill: '#ffffff' }), path('M-20 -22l-12 2l12 4z', { fill: '#ff9a1a' }), circle(-13, -25, 1.8, { fill: '#1a1a1a' }),
      line('M-6 2l-10 6M4 2l8 6', '#ff9a1a', 3)));
    ppl.duck = [dx - 6, dy - 14];
  }
  {
    let reeds = '';
    for (let i = 0; i < 7; i++) { const x = POND.cx - POND.rx + 4 + i * 7; reeds += `M${x} ${POND.cy + 4}q${(i % 2 ? 4 : -4)} -24 ${(i % 3) - 1} -${34 + (i % 3) * 8}`; }
    out.push(line(reeds, dusk('#8a6a3a', 0.15), 2.6), path(`M${POND.cx - POND.rx + 12} ${POND.cy - 36}h5v14h-5zM${POND.cx - POND.rx + 26} ${POND.cy - 46}h5v14h-5z`, { fill: '#6a4426' }));
  }

  // ---- the snowman in a paper crown
  out.push(C('a snowman wearing a paper cracker crown and a striped scarf'));
  {
    const sx = 1150, sf = 820;
    out.push(ellipse(sx, sf + 2, 36, 6, { fill: '#000', opacity: 0.15 }), circle(sx, sf - 28, 30, { fill: SNOW }), circle(sx, sf - 76, 21, { fill: SNOW }));
    out.push(path(`M${sx - 30} ${sf - 28}a30 30 0 0 0 60 0a30 34 0 0 1 -60 0z`, { fill: SHADE, opacity: 0.5 }));
    out.push(crown(sx, sf - 76, 21, '#ffd166', -8));
    out.push(path(`M${sx + 3} ${sf - 74}l20 4l-20 4z`, { fill: '#ff8a1a' }), circle(sx - 7, sf - 81, 2.6, { fill: '#1a1a1a' }), circle(sx + 9, sf - 81, 2.6, { fill: '#1a1a1a' }));
    out.push(path(`M${sx - 9} ${sf - 66}q9 6 18 0`, { fill: 'none', stroke: '#1a1a1a', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 5' }));
    out.push(path(`M${sx - 22} ${sf - 58}q22 8 44 0v9q-22 8 -44 0z`, { fill: '#2f8a5a' }), path(`M${sx + 10} ${sf - 52}l6 26h-10l-2 -24z`, { fill: '#2f8a5a' }));
    out.push(line(`M${sx - 14} ${sf - 56}v8M${sx - 2} ${sf - 54}v8M${sx + 10} ${sf - 54}v8`, '#ffffff', 3));
    out.push(line(`M${sx - 28} ${sf - 40}l-30 -20l-4 -12m4 12l-14 0M${sx + 28} ${sf - 40}l28 -18l10 -10m-10 10l12 2`, '#5a3a22', 3.4));
    out.push(circle(sx, sf - 36, 3, { fill: '#1a1a1a' }), circle(sx, sf - 22, 3, { fill: '#1a1a1a' }));
    ppl.snowman = [sx, sf - 80];
  }

  // ---- the family on the path: mum points up at the box, grandad holds the ball up for the dog
  out.push(C('mum in her new Christmas jumper and a paper crown, pointing up at the box; grandad in a flat cap with a flask cup, holding a ball up for the dog'));
  {
    const point = { sx: 1, elbow: [1.0, -0.5], hand: [1.7, -1.9] };
    const mum = figure({ x: 352, foot: 848, H: 100, heads: 3.2, skin: SKIN.brown, hair: '#1a1210', style: 'curls', top: '#c8243a', bottom: '#2a3050', shoe: '#5a3a22', gaze: 0.35, mouth: 'open',
      arms: [{ sx: -1, elbow: [-0.6, 1.2], hand: [-0.4, 2.2] }, point] });
    out.push(mum.svg);
    // the jumper: a white zigzag band, snowflake dots and a ribbed hem
    const jt = mum.torsoTop, jw = mum.tw, jx = 352, rr = mum.r;
    let zig = `M${P(jx - jw / 2, jt + rr * 1.0)}`;
    for (let i = 0; i < 6; i++) zig += `l${f(jw / 12)} ${f(-rr * 0.32)}l${f(jw / 12)} ${f(rr * 0.32)}`;
    out.push(line(zig, '#ffffff', 2.6), path(circD(jx - jw * 0.22, jt + rr * 1.7, 2.2) + circD(jx + jw * 0.2, jt + rr * 1.55, 2.2) + circD(jx, jt + rr * 2.1, 2.2), { fill: '#ffffff' }));
    out.push(path(`M${P(jx - jw / 2, mum.torsoBot - 6)}h${f(jw)}v6h${f(-jw)}z`, { fill: '#a81c30' }));
    out.push(crown(jx, mum.headY - 2, mum.r, '#ffd166', 6));
    ppl.mum = [jx, jt + rr];

    const cup = { sx: -1, elbow: [-0.7, 1.1], hand: [-0.1, 1.8] }, ball = { sx: 1, elbow: [1.0, -0.4], hand: [1.4, -2.0] };
    const gx = 452;
    const gd = figure({ x: gx, foot: 846, H: 98, heads: 3.2, skin: SKIN.fair, hair: '#dcd8e0', style: 'short', top: '#5a6a3a', bottom: '#3a3a44', gaze: 0.4,
      arms: [cup, ball] });
    out.push(gd.svg, scarf(gx, gd.torsoTop - 2, gd.r * 1.7, '#c8243a', -1));
    // a tweed flat cap, peak forward
    const hr = gd.r, hy = gd.headY;
    out.push(path(`M${P(gx - hr * 1.04, hy - hr * 0.32)}C${P(gx - hr * 1.0, hy - hr * 1.2)} ${P(gx + hr * 0.9, hy - hr * 1.24)} ${P(gx + hr * 1.04, hy - hr * 0.5)}L${P(gx + hr * 1.5, hy - hr * 0.36)}Q${P(gx + hr * 1.2, hy - hr * 0.16)} ${P(gx + hr * 0.9, hy - hr * 0.26)}Q${P(gx, hy - hr * 0.5)} ${P(gx - hr * 1.04, hy - hr * 0.32)}Z`, { fill: '#7a6a52' }));
    out.push(line(`M${P(gx - hr * 0.7, hy - hr * 0.9)}q${f(hr * 0.8)} ${f(-hr * 0.3)} ${f(hr * 1.5)} ${f(-hr * 0.04)}`, '#9a8a6e', 2, { opacity: 0.8 }));
    const ch = gd.hand(cup);
    out.push(path(`M${P(ch[0] - 7, ch[1] - 14)}h14l-2 14h-10z`, { fill: '#c8ccd4' }), circle(ch[0], ch[1], gd.r * 0.34, { fill: SKIN.fair }));
    out.push(line(`M${P(ch[0] - 2, ch[1] - 18)}c-6-6 4-10-2-16M${P(ch[0] + 4, ch[1] - 18)}c-4-6 4-8 0-14`, '#ffffff', 2.2, { opacity: 0.7 }));
    const bh = gd.hand(ball);
    out.push(circle(bh[0] + 2, bh[1] - 9, 7, { fill: '#d8ec4a' }), path(`M${P(bh[0] - 4, bh[1] - 13)}q6 4 12 0`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 1.6 }), circle(bh[0], bh[1], gd.r * 0.34, { fill: SKIN.fair }));
    ppl.ball = [bh[0], bh[1] - 8];
    out.push(dog(552, 852, 0.95, '#2e2622', { coat: '#2f6a8a', flip: -1 }));
    out.push(line('M512 776q-6 -8 -2 -14M520 772q2 -10 8 -12', '#ffffff', 2, { opacity: 0.7 }));      // an eager little wag of breath
    ppl.dog = [548, 810];
  }

  // ---- the cardboard box sled: two children in paper crowns, arms up, whooshing down
  out.push(C('the focal point: two children in paper crowns whoosh down the hill in a big cardboard box, arms up, scarves flying, snow spraying behind'));
  {
    const bx = BOX.x, by = hillAt(bx) + 6, deg = slopeDeg(bx);
    const g = [];
    g.push(ellipse(0, 4, 74, 7, { fill: '#000', opacity: 0.18 }));
    // spray and speed lines behind (uphill, +x)
    g.push(path(circD(78, -8, 11) + circD(96, -18, 8) + circD(110, -6, 6) + circD(90, -32, 6) + circD(118, -24, 4) + circD(70, -24, 5), { fill: '#ffffff' }));
    g.push(line('M112 -46h40M124 -62h34M108 -78h30', '#ffffff', 3, { opacity: 0.75 }));
    // the inside of the box and its back flap (behind the children)
    g.push(path('M-62 -48L-52 -62H76L62 -48Z', { fill: '#7a4e26' }));
    g.push(path('M-50 -60L-40 -94H82L74 -60Z', { fill: '#c08a52' }), path('M-40 -94H82', { fill: 'none', stroke: '#e0b07a', 'stroke-width': 3 }));
    // the children
    const up = (s) => ({ sx: s, elbow: [s * 0.9, -0.9], hand: [s * 1.2, -2.3] });
    const kA = figure({ x: -24, foot: -8, H: 80, heads: 2.6, skin: SKIN.light, hair: '#c8642a', style: 'short', top: '#2f8a5a', bottom: '#2a3a6a', gaze: -0.3, mouth: 'open', arms: [up(-1), up(1)] });
    const kB = figure({ x: 28, foot: -12, H: 78, heads: 2.6, skin: SKIN.tan, hair: '#2a1a14', style: 'bob', top: '#e8a030', bottom: '#2a3a6a', gaze: -0.3, mouth: 'open', arms: [up(-1), { sx: 1, elbow: [1.0, -0.6], hand: [1.6, -1.6] }] });
    // scarves streaming back (uphill)
    g.push(path(`M${P(30, kB.torsoTop + 2)}c20 -4 34 6 56 -2l-2 10c-20 6 -34 -2 -54 2z`, { fill: '#d62828' }));
    g.push(kB.svg, crown(28, kB.headY, kB.r, '#ff8fb8', 8));
    g.push(path(`M${P(-20, kA.torsoTop + 2)}c22 -6 40 4 64 -4l-2 10c-22 6 -40 -2 -62 2z`, { fill: '#2f6aaa' }));
    g.push(kA.svg, crown(-24, kA.headY, kA.r, '#ffd166', -6));
    // the box's front face, with tape and printed arrows; the side flaps flopped open
    g.push(path('M-62 -48L-94 -64L-90 -72L-52 -62Z', { fill: '#b47a42' }), path('M62 -48L92 -58L100 -66L76 -62Z', { fill: '#b47a42' }));
    g.push(path('M-62 0V-48H62V0Z', { fill: url('box') }));
    g.push(path('M-62 -48H62v8H-62Z', { fill: '#e8c890', opacity: 0.85 }), path('M-6 -40h12V0h-12Z', { fill: '#e8c890', opacity: 0.6 }));
    g.push(path('M26 -12v-14l-5 0l8-8l8 8h-5v14zM44 -12v-14l-5 0l8-8l8 8h-5v14z', { fill: '#7a4a22' }));
    g.push(line('M-50 -14l12 -4M-52 -24l10 -3', '#8a5a2e', 2, { opacity: 0.6 }));
    g.push(path('M-62 0V-48', { fill: 'none', stroke: '#e0b07a', 'stroke-width': 3 }));
    out.push(G({ transform: `translate(${P(bx, by)}) rotate(${f(deg * 0.85)}) scale(1.22)` }, ...g));
    ppl.box = [bx, by - 70];
  }

  return { svg: compactSvg(doc(`Boxing Day · mid. Concept: "the box is the best present": a snowy hillside walk at dusk on 26 December. Focal point: two children in Christmas-cracker paper crowns whooshing down the slope in yesterday's big cardboard box (about x 760–960, y 560–760), arms up, scarves streaming, snow spraying behind. A girl hauls a wooden sled back up near the crest; mum in a new Christmas jumper points up at them, grandad holds a ball up for the eager dog; a snowman wears a paper crown too. A dry-stone wall with a five-bar gate, a robin, a lost mitten and a red postbox on the left, sheep and an old tree with an owl behind; a frozen pond with a skidding duck on the right; a fox peeks from the crest pines. Light story: the last pale light of the day on the horizon catches the crest; the rest is cool blue snow. The snowfall is the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Boxing Day · front: snowbanks in both bottom corners, a bramble with berries on the left; the centre stays open`, [], [
    C('a snowbank on the left with a bare bramble'),
    path('M-20 900V846Q70 824 170 838T300 880L316 900Z', { fill: '#ffffff' }),
    path('M-20 900V866Q90 852 200 872T316 900Z', { fill: '#d8e6ee' }),
    line('M40 846q10 -40 40 -56M60 824q-20 -14 -24 -36M80 790q16 -6 26 4', '#4a2a2a', 3),
    path(circD(106, 794, 4) + circD(36, 788, 4) + circD(84, 788, 3.4), { fill: '#c8102e' }),
    C('a snowbank on the right'),
    path('M1620 900V858Q1560 846 1500 860T1430 900Z', { fill: '#ffffff' }),
    path('M1620 900V876Q1540 868 1470 886L1450 900Z', { fill: '#d8e6ee' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'colour', x: r(ppl.box[0]), y: r(ppl.box[1]), r: 64, label: 'Colour in the cardboard-box sledge' },
      { activity: 'dressup', x: r(ppl.mum[0]), y: r(ppl.mum[1]), r: 44, label: 'Dress up in a Christmas jumper' },
      { activity: 'card', x: ppl.post[0], y: ppl.post[1], r: 30, label: 'Post a thank-you card' },
      { activity: 'catch', x: r(ppl.dog[0]), y: r(ppl.dog[1]), r: 40, label: 'Play catch with the dog' },
      { activity: 'wish', x: r(ppl.hauler[0]), y: r(ppl.hauler[1]), r: 34, label: 'Wish for more snow' },
    ],
    findables: [
      { id: 'robin', label: 'a robin on the gate', x: ppl.robin[0], y: ppl.robin[1], r: 18 },
      { id: 'mitten', label: 'a lost red mitten', x: ppl.mitten[0], y: ppl.mitten[1], r: 16 },
      { id: 'sheep', label: 'a woolly sheep', x: ppl.sheep[0], y: ppl.sheep[1], r: 24 },
      { id: 'owl', label: 'an owl in the old tree', x: ppl.owl[0], y: ppl.owl[1], r: 20 },
      { id: 'fox', label: 'a fox peeking from the pines', x: ppl.fox[0], y: ppl.fox[1], r: 22 },
      { id: 'duck', label: 'a duck skidding on the ice', x: r(ppl.duck[0]), y: r(ppl.duck[1]), r: 22 },
      { id: 'snowman-crown', label: 'a snowman in a paper crown', x: ppl.snowman[0], y: ppl.snowman[1], r: 24 },
    ],
  };
}
