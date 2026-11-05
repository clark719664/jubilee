// Martin Luther King Jr. Day — "A day of service": on a January morning a neighborhood paints a mural together on
// a long brick wall: a rising sun, a white dove with an olive branch, a circle of children of every skin tone
// holding hands and a border of rainbow handprints. A boy presses his painted hand on the wall, a girl on a step
// ladder paints the dove's wing, grandpa paints the hills with a roller from his wheelchair, a teen on a ladder
// sketches the next part. On the left a girl gives a scarf to the coat drive on the stoop; on the right a boy
// carries tins to the little free pantry. The day itself is the national day of service. The doves, hearts and
// raised fists drifting down are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, rect, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, scarf, bobbleHat, dog, line, circD } from '../../kit/scenekit.mjs';

const ID = 'mlk-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SKY = '#33334a';
const dusk = (c, k = 0.2) => mix(c, SKY, k);
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028', ebony: '#4a2a1a' };
const PAINT = ['#e8343a', '#ff8a1a', '#ffd23a', '#3ab86a', '#2a8ad8', '#8a5ad8', '#ff6aa8'];

// ---- layout
const WALL = { x0: 272, x1: 1328, top: 480, base: 776 };
const MURAL = { x0: 300, x1: 1112, top: 506, base: 760 };     // painted so far; the rest is still bare brick
const GROUND = 776;

/** A dove (flying left), centered at (x, y), wingspan about 140·s. */
const dove = (x, y, s, col = '#ffffff', shade = '#d8e0ee') => G({ transform: `translate(${f(x)} ${f(y)}) scale(${f(s)})` },
  path('M-6 4C14 -40 46 -58 72 -54C52 -40 40 -20 30 0Z', { fill: shade }),
  path('M-58 0C-46 -12 -26 -14 -8 -10C20 -6 46 0 66 14L84 8L78 24C50 34 0 32 -30 18C-42 12 -52 8 -58 0Z', { fill: col }),
  path('M-48 -2c-6 -12 0 -20 10 -20c8 0 12 6 12 12z', { fill: col }),
  path('M-48 -14l-12 4l12 2z', { fill: '#ffb84a' }), circle(-38, -14, 2.2, { fill: '#2a2a3a' }),
  path('M-14 -4C-6 -50 22 -76 52 -80C40 -60 32 -36 24 -6Z', { fill: col }),
  path('M-60 -8q-14 -6 -24 4M-72 -6q2 -8 8 -10M-76 0q-6 -4 -10 2', { fill: 'none', stroke: '#3a8a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }),
  path('M-72 -6c-6 -4 -10 0 -10 4c6 0 8 -2 10 -4zM-80 -2c-6 2 -6 8 -2 10c4 -4 4 -6 2 -10z', { fill: '#5ab84a' }));

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const defs = [
    lin(id('dawn'), 0, 0, 0, 1, [[0, '#ffc87a', 0], [0.45, '#ffa87a', 0.55], [1, '#ffd890', 1]]),
    rad(id('sun'), 0.5, 0.5, 0.5, [[0, '#fff3c4', 0.95], [0.3, '#ffd08a', 0.55], [1, '#ffb07a', 0]]),
  ];
  // low rooftops peeking over the wall (below the copy zone), taller ones at the sides
  let roofs = '';
  const R = rng(5);
  for (let x = 240; x < 1360; x += 70 + R() * 60) { const w = 60 + R() * 60, top = 440 + R() * 26; roofs += `M${P(x, 500)}V${f(top)}h${f(w)}V500Z`; if (R() < 0.4) roofs += `M${P(x + w * 0.3, top)}v-14h10v14z`; }
  return compactSvg(doc(`MLK Day · back: a slate morning sky warming to gold at the horizon behind the city, where the sun is coming up; low rooftops and chimneys over the wall; two doves flying in the corners`, defs, [
    C('the morning light warming the sky low down, below the copy zone'),
    path('M-20 436H1620V520H-20Z', { fill: url('dawn') }),
    ellipse(800, 500, 520, 66, { fill: url('sun') }),
    C('low rooftops and chimneys beyond the wall'),
    path(roofs, { fill: dusk('#6a4a5a', 0.25) }),
    C('two doves flying in the corners'),
    dove(160, 84, 0.62, '#f4f4fa', '#c8d0e0'), dove(1460, 96, 0.5, '#f4f4fa', '#c8d0e0'),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    E('pattern', { id: id('brick'), width: 48, height: 24, patternUnits: 'userSpaceOnUse' },
      rect(0, 0, 48, 24, { fill: '#a8503a' }),
      path('M1 1h46v10H1zM-23 13h46v10h-46zM25 13h46v10H25z', { fill: '#c0644a' }),
      path('M4 3h20', { fill: 'none', stroke: '#d8806a', 'stroke-width': 2, opacity: 0.6 })),
    lin(id('mural'), 0, 0, 0, 1, [[0, '#8ad0f8'], [0.6, '#ffe0b8'], [1, '#ffd0a0']]),
    rad(id('msun'), 0.5, 0.5, 0.5, [[0, '#fff6c0'], [0.6, '#ffd23a'], [1, '#ffb01a']]),
    lin(id('walk'), 0, 0, 0, 1, [[0, '#a8a8b8'], [1, '#88889a']]),
    rad(id('win'), 0.5, 0.6, 0.75, [[0, '#fff3cf'], [0.5, '#ffd98a'], [1, '#f0a84a']]),
    lin(id('stone'), 0, 0, 0, 1, [[0, '#8a5a4a'], [1, '#6a4038']]),
  ];

  // ---- the pavement
  out.push(C('the pavement: concrete slabs, a drop cloth under the painters'));
  out.push(path(`M-20 ${GROUND}H1620V920H-20Z`, { fill: url('walk') }));
  out.push(line('M-20 800H1620M-20 846H1620M120 776l-20 124M420 776l-12 124M720 776v124M1020 776l10 124M1320 776l18 124', '#9a9aac', 2));
  out.push(path('M420 790L1180 790L1210 860L400 860Z', { fill: '#eeeae0' }), path('M420 790L1180 790', { fill: 'none', stroke: '#d8d2c4', 'stroke-width': 3 }));
  {
    let drips = '';
    const R = rng(23);
    for (let i = 0; i < 18; i++) drips += circD(440 + R() * 740, 800 + R() * 54, 2 + R() * 4);
    for (const [k, c] of PAINT.entries()) out.push(path(drips.split('M').filter(Boolean).filter((_, i) => i % PAINT.length === k).map((d) => 'M' + d).join(''), { fill: c, opacity: 0.85 }));
  }

  // ---- the wall and the mural
  out.push(C('the long brick wall with its stone coping'));
  out.push(path(`M${WALL.x0} ${WALL.base}V${WALL.top}H${WALL.x1}V${WALL.base}Z`, { fill: url('brick') }));
  out.push(path(`M${WALL.x0 - 8} ${WALL.top - 12}H${WALL.x1 + 8}v14H${WALL.x0 - 8}Z`, { fill: '#c8bcb0' }));
  out.push(C('the mural: a rising sun, hills, a white dove with an olive branch, a ring of children holding hands, rainbow handprints'));
  const M = MURAL;
  const mClip = `M${M.x0 + 12} ${M.top}H${M.x1 - 12}q12 0 12 12V${M.base - 12}q0 12 -12 12H${M.x0 + 12}q-12 0 -12 -12V${M.top + 12}q0 -12 12 -12Z`;
  defs.push(E('clipPath', { id: id('mclip') }, path(mClip)));
  {
    const g = [path(mClip, { fill: url('mural') })];
    // the sun and its rays
    let rays = '';
    for (let k = 0; k < 11; k++) { const a = Math.PI + (k / 10) * Math.PI, a1 = a - 0.07, a2 = a + 0.07; rays += `M${P(560 + Math.cos(a1) * 112, 730 + Math.sin(a1) * 112)}L${P(560 + Math.cos(a) * 186, 730 + Math.sin(a) * 186)}L${P(560 + Math.cos(a2) * 112, 730 + Math.sin(a2) * 112)}Z`; }
    g.push(path(rays, { fill: '#ffd23a', opacity: 0.75 }), circle(560, 730, 100, { fill: url('msun') }));
    // rolling hills
    g.push(path(`M${M.x0} 714Q440 680 600 708T900 700T${M.x1} 712V${M.base}H${M.x0}Z`, { fill: '#5ac86a' }), path(`M${M.x0} 736Q500 716 700 734T${M.x1} 730V${M.base}H${M.x0}Z`, { fill: '#3aa858' }));
    // the ring of children holding hands, flat painted figures of every skin tone
    const tones = [SKIN.ebony, SKIN.light, SKIN.brown, SKIN.fair, SKIN.deep, SKIN.tan, SKIN.brown];
    const shirts = ['#e8343a', '#2a8ad8', '#ffb800', '#8a5ad8', '#ff6aa8', '#2ab8a8', '#ff8a1a'];
    let hands = '';
    for (let i = 0; i < 7; i++) {
      const x = 700 + i * 58, y = 744;
      g.push(circle(x, y - 46, 11, { fill: tones[i] }), path(`M${x - 12} ${y}v-26q0-10 12-10q12 0 12 10v26z`, { fill: shirts[i] }));
      if (i < 6) hands += `M${x + 10} ${y - 24}Q${x + 29} ${y - 14} ${x + 48} ${y - 24}`;
    }
    g.push(line(hands, '#7a4a2a', 5));
    // the dove
    g.push(dove(830, 600, 0.95));
    // a heart in the sky
    g.push(path('M1040 560c-14 -16 -36 -2 -24 14l24 22l24 -22c12 -16 -10 -30 -24 -14z', { fill: '#ff4d6d' }));
    out.push(G({ 'clip-path': url('mclip') }, ...g));
    // the handprint border along the top and down the left side
    const hand = (x, y, s, a) => `M${P(x, y)}` + [[-9, -6], [-5, -14], [0, -16], [5, -14], [10, -8]].map(([dx, dy], k) => `M${P(x + dx * s, y + dy * s)}m${f(-2.4 * s)} 0a${f(2.4 * s)} ${f(4 * s)} 0 1 0 ${f(4.8 * s)} 0a${f(2.4 * s)} ${f(4 * s)} 0 1 0 ${f(-4.8 * s)} 0`).join('') + `M${P(x - 8 * s, y - 4 * s)}q0 ${f(12 * s)} ${f(8 * s)} ${f(12 * s)}q${f(8 * s)} 0 ${f(8 * s)} ${f(-12 * s)}z`;
    const prints = Array.from({ length: PAINT.length }, () => '');
    let n = 0;
    for (let x = M.x0 + 30; x < M.x1 - 20; x += 46) prints[n++ % PAINT.length] += hand(x, M.top + 28, 1.1, 0);
    for (let y = M.top + 76; y < M.base - 40; y += 46) prints[n++ % PAINT.length] += hand(M.x0 + 26, y, 1.0, 0);
    prints.forEach((d, k) => out.push(path(d, { fill: PAINT[k], transform: k % 2 ? '' : undefined })));
    // the bare part, still to paint: a pencil sketch of more children and tape
    out.push(path(`M1128 520h180v236h-180z`, { fill: 'none', stroke: '#f4ece0', 'stroke-width': 3, 'stroke-dasharray': '10 8', opacity: 0.8 }));
    out.push(line('M1160 744v-26q0-10 12-10q12 0 12 10v26M1220 744v-26q0-10 12-10q12 0 12 10v26M1172 690a11 11 0 1 0 0.1 0M1232 690a11 11 0 1 0 0.1 0M1182 720q24 10 40 0', '#f4ece0', 2.6, { opacity: 0.85 }));
    ppl.mural = [700, 640];
    ppl.dove = [820, 590];
  }

  // ---- the stoop on the left: brownstone, a coat-drive box
  out.push(C('the brownstone on the left: a stoop with a coat-drive box and a paper heart in a window'));
  out.push(path(`M-20 ${GROUND}V150H272V${GROUND}Z`, { fill: url('stone') }));
  out.push(path('M-26 150H278v-22H-26Z', { fill: '#5a3a30' }), path('M-26 162H278v6H-26Z', { fill: '#4a2e28' }));
  for (const [x, y] of [[30, 220], [160, 220], [30, 400], [160, 400]]) out.push(path(`M${x} ${y}h76v110h-76z`, { fill: url('win') }), path(`M${x + 38} ${y}v110M${x} ${y + 50}h76`, { fill: 'none', stroke: '#f0e6dc', 'stroke-width': 4 }), path(`M${x - 6} ${y + 110}h88v8h-88z`, { fill: '#c8b0a0' }));
  out.push(path('M74 448c-8 -10 -22 -2 -15 9l15 13l15 -13c7 -11 -7 -19 -15 -9z', { fill: '#ff4d6d' }));       // a paper heart in the window
  out.push(path('M150 586h90v136h-90z', { fill: '#2a4a3a' }), path('M144 580h102v8h-102z', { fill: '#c8b0a0' }), circle(228, 660, 4, { fill: '#ffd166' }));
  out.push(path(`M120 ${GROUND}v-14h150v14zM132 ${GROUND - 14}v-14h138v14zM144 ${GROUND - 28}v-14h126v14z`, { fill: '#9a6a5a' }), path(`M120 ${GROUND - 14}h150M132 ${GROUND - 28}h138M144 ${GROUND - 42}h126`, { fill: 'none', stroke: '#b88a7a', 'stroke-width': 3 }));
  // the coat-drive box with folded coats and a heart
  out.push(path('M18 774v-64h96v64z', { fill: '#c8945a' }), path('M12 712h108l-8 -14h-92z', { fill: '#b07a42' }));
  out.push(path('M24 712q8 -22 26 -18q14 -2 18 18zM58 712q10 -26 30 -18q12 2 14 18z', { fill: '#2a8ad8' }), path('M40 704q12 -18 30 -10q10 6 8 14z', { fill: '#e8343a' }), path('M70 700q16 -14 28 -2l2 10h-30z', { fill: '#ffb800' }));
  out.push(path('M66 738c-8 -10 -22 -2 -15 9l15 13l15 -13c7 -11 -7 -19 -15 -9z', { fill: '#ff4d6d' }));
  ppl.box = [66, 730];
  // the girl giving a scarf
  {
    const gx = 196, gf = 846;
    const give = { sx: -1, elbow: [-1.0, 0.3], hand: [-1.9, -0.3] };
    const g = figure({ x: gx, foot: gf, H: 80, heads: 2.7, skin: SKIN.ebony, hair: '#1a1210', style: 'puffs', top: '#ff8a1a', bottom: '#2a3a6a', shoe: '#ff6aa8', gaze: -0.4, mouth: 'smile', arms: [give, { sx: 1, elbow: [0.6, 1.1], hand: [0.4, 2.0] }] });
    out.push(g.svg);
    const h = g.hand(give);
    out.push(path(`M${P(h[0] - 30, h[1] + 4)}q14 -10 30 -4v10q-16 -6 -30 4z`, { fill: '#8a5ad8' }), path(`M${P(h[0] - 30, h[1] + 4)}l-4 30h8l4 -26z`, { fill: '#8a5ad8' }), line(`M${P(h[0] - 34, h[1] + 34)}h10M${P(h[0] - 34, h[1] + 30)}h10`, '#c8a8ff', 1.6));
    out.push(circle(h[0], h[1], g.r * 0.36, { fill: SKIN.ebony }));
    ppl.scarf = [h[0] - 26, h[1] + 14];
  }

  // ---- the painters
  out.push(C('the painters: mum with a paint tray, a boy pressing his painted hand to the wall, a girl on a step ladder painting the dove, grandpa painting the hills with a roller from his wheelchair, a teen on a ladder sketching the next part'));
  {
    // mum with a tray and brush
    const mx = 470, mf = 848;
    const tray = { sx: -1, elbow: [-0.7, 1.0], hand: [0.3, 1.2] }, brush = { sx: 1, elbow: [1.0, 0.0], hand: [1.6, -1.0] };
    const mum = figure({ x: mx, foot: mf, H: 116, heads: 3.2, skin: SKIN.brown, hair: '#1a1210', style: 'bun', top: '#2ab8a8', bottom: '#3a3a5a', gaze: 0.4, mouth: 'smile', arms: [tray, brush] });
    out.push(mum.svg);
    const th = mum.hand(tray);
    out.push(path(`M${P(th[0] - 30, th[1] - 6)}h56l-6 12h-44z`, { fill: '#d8d8e0' }), path(circD(th[0] - 18, th[1] - 6, 6) + circD(th[0] - 4, th[1] - 6, 6) + circD(th[0] + 10, th[1] - 6, 6), { fill: '#ffd23a' }), circle(th[0] - 4, th[1] - 6, 5, { fill: '#e8343a' }), circle(th[0] + 10, th[1] - 6, 5, { fill: '#2a8ad8' }), circle(th[0], th[1], mum.r * 0.36, { fill: SKIN.brown }));
    const bh = mum.hand(brush);
    out.push(line(`M${P(bh[0], bh[1] + 6)}l10 -30`, '#c8945a', 4), path(`M${P(bh[0] + 8, bh[1] - 26)}l6 -12l6 4l-4 12z`, { fill: '#ff8a1a' }), circle(bh[0], bh[1], mum.r * 0.36, { fill: SKIN.brown }));
    ppl.tray = [th[0], th[1] - 6];

    // the boy pressing his hand on the wall
    const bx = 620, bf = 822;                                   // standing on an upturned crate
    const press = { sx: 1, elbow: [1.0, -1.0], hand: [1.1, -2.6] };
    out.push(path('M590 852v-30h60v30z', { fill: '#2a8ad8' }), path('M596 846h48M596 834h48M610 822v30M630 822v30', { fill: 'none', stroke: '#1a6ab8', 'stroke-width': 3 }));
    const boy = figure({ x: bx, foot: bf, H: 82, heads: 2.7, skin: SKIN.light, hair: '#c8642a', style: 'short', top: '#2a8ad8', bottom: '#2a3a6a', shoe: '#e8343a', gaze: 0.3, mouth: 'open', arms: [{ sx: -1, elbow: [-0.7, 1.0], hand: [-0.5, 1.9] }, press] });
    out.push(boy.svg);
    const ph = boy.hand(press);
    out.push(circle(ph[0], ph[1], boy.r * 0.42, { fill: '#3ab86a' }));
    ppl.handprint = [ph[0], ph[1]];

    // the girl on the step ladder, painting the dove
    const lx = 870;
    out.push(path(`M${lx - 30} 852L${lx - 18} 770h8L${lx - 22} 852zM${lx + 30} 852L${lx + 18} 770h-8L${lx + 22} 852z`, { fill: '#c8c8d4' }), path(`M${lx - 26} 820h52v8h-52zM${lx - 22} 796h44v8h-44zM${lx - 20} 770h40v8h-40z`, { fill: '#e0e0ea' }));
    const paintArm = { sx: -1, elbow: [-0.9, -0.9], hand: [-1.2, -2.2] };
    const girl = figure({ x: lx, foot: 770, H: 86, heads: 2.7, skin: SKIN.tan, hair: '#2a1a14', style: 'bob', top: '#ff6aa8', bottom: '#5a3ab0', shoe: '#ffd23a', gaze: -0.4, mouth: 'smile', arms: [paintArm, { sx: 1, elbow: [0.8, 0.9], hand: [0.5, 1.8] }] });
    out.push(girl.svg);
    const gh = girl.hand(paintArm);
    out.push(line(`M${P(gh[0], gh[1] + 6)}l-6 -30`, '#c8945a', 4), path(`M${P(gh[0] - 8, gh[1] - 24)}l-2 -12h8l2 12z`, { fill: '#ffffff' }), circle(gh[0], gh[1], girl.r * 0.36, { fill: SKIN.tan }));
    out.push(bobbleHat(lx, girl.headY, girl.r, '#ffd23a', '#ffffff', '#e8343a', 4));

    // grandpa in his wheelchair with a roller on a pole
    const wx = 1030, seat = 800;
    const roll = { sx: -1, elbow: [-1.0, -0.4], hand: [-1.6, -1.2] }, roll2 = { sx: 1, elbow: [0.4, 0.8], hand: [-0.2, 0.8] };
    out.push(ellipse(wx, 856, 62, 8, { fill: '#000', opacity: 0.2 }));
    out.push(path(`M${wx + 30} ${seat - 70}v74h-60`, { fill: 'none', stroke: '#3a3a4a', 'stroke-width': 7, 'stroke-linejoin': 'round' }));
    const gp = figure({ x: wx, foot: seat + 4, H: 96, heads: 3.0, skin: SKIN.deep, hair: '#dcd8e0', style: 'short', top: '#7a3a2a', bottom: '#3a3a4a', gaze: -0.4, mouth: 'smile', arms: [roll, roll2] });
    out.push(gp.svg);
    out.push(path(`M${wx + 10} ${seat - 6}H${wx - 34}v12H${wx + 10}z`, { fill: '#3a3a4a' }), path(`M${wx - 34} ${seat}v36h-10v-36z`, { fill: '#3a3a4a' }), path(`M${wx - 50} ${seat + 34}h22a6 6 0 0 1 0 10h-22z`, { fill: '#2a1a14' }));
    {
      const cx = wx + 6, cy = 816, rr = 38;
      let sp = '';
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; sp += `M${P(cx, cy)}L${P(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)}`; }
      out.push(circle(cx, cy, rr, { fill: 'none', stroke: '#2a2a3a', 'stroke-width': 7 }), circle(cx, cy, rr - 6, { fill: 'none', stroke: '#9aa0b0', 'stroke-width': 3 }), line(sp, '#9aa0b0', 2), circle(cx, cy, 5, { fill: '#5a5a6a' }), circle(wx - 40, 846, 9, { fill: '#2a2a3a' }));
    }
    const rh = gp.hand(roll);
    out.push(line(`M${P(rh[0] + 30, rh[1] + 40)}L${P(rh[0] - 30, rh[1] - 60)}`, '#c8945a', 5), path(`M${P(rh[0] - 52, rh[1] - 74)}h44v18h-44z`, { fill: '#3aa858' }), line(`M${P(rh[0] - 30, rh[1] - 56)}v-4`, '#5a5a6a', 3));
    out.push(circle(rh[0], rh[1], gp.r * 0.36, { fill: SKIN.deep }));
    ppl.grandpa = [wx, gp.headY];

    // the teen on a tall ladder sketching
    const tx = 1226;
    out.push(path(`M${tx - 34} 852L${tx - 18} 600h8L${tx - 26} 852zM${tx + 34} 852L${tx + 18} 600h-8L${tx + 26} 852z`, { fill: '#c8945a' }));
    let rungs = '';
    for (let y = 620; y < 852; y += 34) rungs += `M${tx - 30 + (852 - y) * 0} ${y}h60v6h-60z`;
    out.push(path(rungs, { fill: '#b07a42' }));
    const sketch = { sx: -1, elbow: [-0.8, -0.6], hand: [-1.4, -1.6] };
    const teen = figure({ x: tx, foot: 722, H: 112, heads: 3.1, skin: SKIN.fair, hair: '#1a1210', style: 'side', top: '#5a3ab0', bottom: '#2a2a3a', shoe: '#ffffff', gaze: -0.5, mouth: 'smile', arms: [sketch, { sx: 1, elbow: [0.6, 0.6], hand: [0.2, 1.2] }] });
    out.push(teen.svg);
    const sh = teen.hand(sketch);
    out.push(line(`M${P(sh[0], sh[1] + 4)}l-8 -18`, '#ffd23a', 4), circle(sh[0], sh[1], teen.r * 0.36, { fill: SKIN.fair }));
    ppl.teen = [tx, teen.headY];
  }

  // ---- paint pots on the drop cloth
  out.push(C('paint pots in every color on the drop cloth'));
  {
    const pots = [[560, 856, 0], [700, 862, 1], [742, 852, 2], [960, 866, 3], [1100, 856, 4], [1146, 864, 5], [400, 866, 6]];
    for (const [x, y, k] of pots) out.push(path(`M${x - 14} ${y}l-2 -26h32l-2 26z`, { fill: '#d8d8e0' }), ellipse(x, y - 26, 16, 5, { fill: PAINT[k] }), path(`M${x - 16} ${y - 20}h32`, { fill: 'none', stroke: '#b8b8c4', 'stroke-width': 2 }));
    ppl.pots = [742, 830];
  }

  // ---- the building on the right: a little free pantry box, a boy with tins, a dog
  out.push(C('the building on the right with a little free pantry box on a post; a boy carries a box of tins to it; a dog in a bandana'));
  out.push(path(`M1328 ${GROUND}V190H1620V${GROUND}Z`, { fill: url('brick') }), path('M1322 190H1626v-18H1322Z', { fill: '#c8bcb0' }));
  for (const [x, y] of [[1380, 250], [1510, 250], [1380, 430], [1510, 430]]) out.push(path(`M${x} ${y}h72v100h-72z`, { fill: url('win') }), path(`M${x + 36} ${y}v100M${x} ${y + 48}h72`, { fill: 'none', stroke: '#f0e6dc', 'stroke-width': 4 }), path(`M${x - 6} ${y + 100}h84v8h-84z`, { fill: '#c8bcb0' }));
  out.push(path(`M1460 ${GROUND}V700h8V${GROUND}Z`, { fill: '#5a3a2a' }), path('M1424 704h80v-64h-80z', { fill: '#2a8ad8' }), path('M1418 640h92l-46 -28z', { fill: '#e8343a' }), path('M1432 694h64v-44h-64z', { fill: '#cfe8ff' }), path('M1438 690h12v-16h-12zM1456 690h12v-20h-12zM1474 690h14v-14h-14z', { fill: '#e8a040' }));
  ppl.pantry = [1464, 670];
  {
    const cx = 1380, cf = 852;
    const carry = { sx: -1, elbow: [-0.6, 1.0], hand: [0.2, 1.1] }, carry2 = { sx: 1, elbow: [0.6, 1.0], hand: [-0.2, 1.1] };
    const c = figure({ x: cx, foot: cf, H: 84, heads: 2.7, skin: SKIN.brown, hair: '#1a1210', style: 'coils', top: '#3ab86a', bottom: '#2a3a6a', shoe: '#ffffff', gaze: 0.4, mouth: 'smile', arms: [carry, carry2] });
    out.push(c.svg);
    const h = c.hand(carry);
    out.push(path(`M${P(h[0] - 26, h[1] - 22)}h52v30h-52z`, { fill: '#c8945a' }), path(`M${P(h[0] - 20, h[1] - 22)}v-12h12v12zM${P(h[0] - 4, h[1] - 22)}v-14h12v14zM${P(h[0] + 12, h[1] - 22)}v-10h10v10z`, { fill: '#e8a040' }), path(`M${P(h[0] - 20, h[1] - 30)}h12M${P(h[0] - 4, h[1] - 32)}h12`, { fill: 'none', stroke: '#e8343a', 'stroke-width': 3 }));
    out.push(circle(h[0], h[1], c.r * 0.36, { fill: SKIN.brown }), circle(c.hand(carry2)[0], c.hand(carry2)[1], c.r * 0.36, { fill: SKIN.brown }));
    ppl.tins = [h[0], h[1] - 26];
  }
  out.push(dog(1500, 856, 0.85, '#d8a868', { coat: null, flip: -1 }), path('M1474 816q12 10 26 2l-4 12q-10 4 -20 -2z', { fill: '#e8343a' }));
  ppl.dog = [1500, 814];

  return { svg: compactSvg(doc(`MLK Day · mid. Concept: "a day of service": on a January morning a neighborhood paints a mural together on a long brick wall. Focal point: the mural (x 300–1110, y 506–760) — a rising sun, rolling hills, a white dove with an olive branch, a ring of children of every skin tone holding hands and a border of rainbow handprints — with the painters in front: mum with a paint tray, a boy pressing his green hand to the wall, a girl on a step ladder painting the dove, grandpa painting the hills with a roller from his wheelchair, a teen on a ladder sketching the next part. A coat-drive box on the brownstone stoop on the left with a girl giving a scarf; a little free pantry on the right with a boy carrying tins and a dog. Light story: the morning sun warms the horizon; lit windows. The drifting doves, hearts and fists are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`MLK Day · front: a planter with winter greens bottom left and a fire hydrant bottom right; the center stays open`, [], [
    C('a planter with winter greens and red berries'),
    path('M-10 900V840h120v60z', { fill: '#5a6a7a' }), path('M-14 840h128v-10h-128z', { fill: '#7a8a9a' }),
    path(circD(10, 818, 22) + circD(48, 806, 26) + circD(86, 820, 22), { fill: '#2a6a4a' }), path(circD(20, 808, 4) + circD(54, 796, 4) + circD(80, 810, 4) + circD(40, 818, 4), { fill: '#e8243a' }),
    C('a red fire hydrant'),
    path('M1566 900v-70q0 -24 24 -24t24 24v70z', { fill: '#d8343a' }), path('M1558 840h64v10h-64zM1582 806h16v-12h-16z', { fill: '#b8242a' }), circle(1590, 860, 8, { fill: '#b8242a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'color', x: ppl.mural[0], y: ppl.mural[1], r: 70, label: 'Help paint the mural' },
      { activity: 'wish', x: ppl.dove[0], y: ppl.dove[1], r: 50, label: 'Share your dream' },
      { activity: 'card', x: ppl.box[0], y: ppl.box[1], r: 44, label: 'Write a kind note' },
      { activity: 'memory', x: ppl.pots[0], y: ppl.pots[1], r: 40, label: 'Match the paint colors' },
    ],
    findables: [
      { id: 'handprint', label: 'a green painted hand', x: r(ppl.handprint[0]), y: r(ppl.handprint[1]), r: 16 },
      { id: 'scarf', label: 'a purple scarf for the coat drive', x: r(ppl.scarf[0]), y: r(ppl.scarf[1]), r: 18 },
      { id: 'heart', label: 'a paper heart in a window', x: 74, y: 456, r: 16 },
      { id: 'pantry', label: 'the little free pantry', x: ppl.pantry[0], y: ppl.pantry[1], r: 30 },
      { id: 'roller', label: 'a paint roller', x: r(ppl.grandpa[0] - 60), y: r(ppl.grandpa[1] - 30), r: 22 },
      { id: 'dog', label: 'a dog in a red bandana', x: ppl.dog[0], y: ppl.dog[1], r: 26 },
      { id: 'heart-mural', label: 'a red heart in the mural', x: 1040, y: 572, r: 18 },
    ],
  };
}
