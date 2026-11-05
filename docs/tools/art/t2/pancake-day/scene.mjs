// Pancake Day — "The pancake race": a village street on Shrove Tuesday evening. Three racers dash for the finish
// with frying pans: a girl in an apron flips her pancake sky-high as she runs, grandma in an apron and headscarf
// keeps up, a boy in a chef's hat brings up the rear; a dog leaps for a pancake that got away. A boy rings the
// pancake bell, two neighbors hold the finish ribbon by the church, and the crowd cheers by a stall stacked with
// pancakes, lemons and sugar; a girl waves a carnival mask. The confetti and the papel-picado banner are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, rect, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { scarf, dog, line, circD, terrace } from '../../kit/scenekit.mjs';

const ID = 'pancake-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const NIGHT = '#3a1a5a';
const night = (c, k = 0.3) => mix(c, NIGHT, k);
const LAMP = '#ffd98a';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const STREET = 770;

/** A pancake seen at an angle: a golden disc with browned spots. */
const pancake = (x, y, rx, ry, tilt = 0) => G({ transform: `rotate(${f(tilt)} ${f(x)} ${f(y)})` },
  ellipse(x, y + ry * 0.3, rx, ry, { fill: '#c8862a' }), ellipse(x, y, rx, ry, { fill: '#f0b85a' }),
  path(circD(x - rx * 0.4, y - ry * 0.1, rx * 0.12) + circD(x + rx * 0.3, y + ry * 0.2, rx * 0.1) + circD(x + rx * 0.05, y - ry * 0.35, rx * 0.08), { fill: '#d8943a' }));

/** A frying pan held at (hx, hy), pan center `dx` along the handle, tilted `deg`. */
const pan = (hx, hy, dx, deg) => G({ transform: `translate(${f(hx)} ${f(hy)}) rotate(${f(deg)})` },
  path(`M0 -4h${f(dx - 26)}v8H0z`, { fill: '#3a2a22' }),
  ellipse(dx, 0, 30, 9, { fill: '#2a2a32' }), ellipse(dx, -2, 26, 6, { fill: '#4a4a56' }));

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const town = terrace(-30, 1640, 640, 21, { hMin: 70, hMax: 110, wMin: 100, wMax: 150 });
  const R = rng(2);
  // keep the copy zone clear: no rooftop above y 452 between x 300 and 1300
  const wins = town.windows.filter(() => R() < 0.85);
  const defs = [rad(id('winglow'), 0.5, 0.5, 0.5, [[0, LAMP, 0.5], [1, LAMP, 0]])];
  return compactSvg(doc(`Pancake Day · back: a terrace of village houses with chimneys and lit windows along the far side of the street, against the carnival-purple evening sky`, defs, [
    C('the far terrace'),
    path(town.d, { fill: night('#5a3a6a', 0.25) }),
    wins.map(([x, y, w, h]) => ellipse(x + w / 2, y + h / 2, w * 1.3, h * 1.1, { fill: url('winglow') })).join(''),
    path(wins.map(([x, y, w, h]) => `M${P(x, y)}h${f(w)}v${f(h)}h${f(-w)}Z`).join(''), { fill: LAMP, opacity: 0.85 }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('road'), 0, 0, 0, 1, [[0, '#7a6a8a'], [1, '#5a4a6a']]),
    lin(id('front'), 0, 0, 0, 1, [[0, '#f0e4d4'], [1, '#d8c8b4']]),
    rad(id('lamp'), 0.5, 0.5, 0.5, [[0, '#fff3c4', 0.8], [0.35, LAMP, 0.35], [1, LAMP, 0]]),
    rad(id('win'), 0.5, 0.6, 0.75, [[0, '#fff3cf'], [0.5, '#ffd98a'], [1, '#f0a84a']]),
    lin(id('stone'), 0, 0, 0, 1, [[0, '#c8b8a0'], [1, '#a89880']]),
  ];

  // ---- the street
  out.push(C('the street: tarmac, a kerb, a chalked start line and a finish line'));
  out.push(path(`M-20 ${STREET - 130}H1620V920H-20Z`, { fill: url('road') }));
  out.push(path(`M-20 ${STREET - 130}H1620v10H-20Z`, { fill: '#8a7a9a' }));
  out.push(line('M120 660L60 900M1180 660L1260 900', '#ffffff', 5, { 'stroke-dasharray': '18 12', opacity: 0.8 }));

  // ---- the church on the right, where the race ends
  out.push(C('the old stone church on the right, where the race finishes'));
  out.push(path('M1300 660V300L1380 230L1460 300V660Z', { fill: url('stone') }), path('M1460 660V380H1620V660Z', { fill: url('stone') }));
  out.push(path('M1294 304L1380 224L1466 304', { fill: 'none', stroke: '#8a7a68', 'stroke-width': 10 }));
  out.push(path('M1350 660V560a30 30 0 0 1 60 0V660Z', { fill: '#5a3a2a' }), path('M1352 400a28 28 0 0 1 56 0v60h-56z', { fill: url('win') }), path('M1380 372v88M1352 420h56', { fill: 'none', stroke: '#8a7a68', 'stroke-width': 4 }));
  out.push(circle(1380, 310, 24, { fill: '#f4ecd8' }), line('M1380 310v-16M1380 310l10 6', '#3a2a22', 3));
  for (const x of [1490, 1560]) out.push(path(`M${x} 560a20 20 0 0 1 40 0v50h-40z`, { fill: url('win') }));

  // ---- the house on the left with the pancake stall in front
  out.push(C('the cottage on the left and the pancake stall: a tower of pancakes, lemons, a sugar shaker, a jug of batter'));
  out.push(path('M-20 660V300L120 220L280 300V660Z', { fill: url('front') }), path('M-26 304L120 214L286 304', { fill: 'none', stroke: night('#8a4a3a', 0.1), 'stroke-width': 14 }));
  out.push(path('M40 360h70v80h-70zM170 360h70v80h-70z', { fill: url('win') }), path('M75 360v80M40 400h70M205 360v80M170 400h70', { fill: 'none', stroke: '#f4ecd8', 'stroke-width': 4 }));
  out.push(path('M90 660V540h80V660Z', { fill: '#2a5a8a' }), circle(156, 604, 4, { fill: '#ffd166' }));
  {
    // the stall
    out.push(path('M160 720h250v14h-250z', { fill: '#8a5a3a' }), path('M176 734v76h12v-76zM382 734v76h12v-76z', { fill: '#6a4028' }));
    out.push(path('M160 720h250v-8h-250z', { fill: '#ffffff' }), path('M160 720l10 18h20l10 -18h20l10 18h20l10 -18h20l10 18h20l10 -18h20l10 18h20l10 -18h20l10 18h20l10 -18z', { fill: '#e8343a' }));
    let stack = '';
    for (let i = 0; i < 9; i++) stack += ellipse(232, 706 - i * 9, 40 - (i % 2) * 2, 8, { fill: i % 2 ? '#f0b85a' : '#e0a048' });
    out.push(ellipse(232, 712, 48, 8, { fill: '#ffffff' }), stack, path('M206 626q26 -10 52 0q-4 8 -26 10q-22 -2 -26 -10z', { fill: '#fff4dc' }), circle(232, 616, 6, { fill: '#e83a4a' }));
    out.push(path(circD(300, 704, 12) + circD(324, 708, 12) + circD(312, 694, 12), { fill: '#ffe03a' }), path('M296 700q4 -6 8 0', { fill: 'none', stroke: '#ffffff', 'stroke-width': 2 }));
    out.push(path('M352 712v-34q0 -10 10 -10h8q10 0 10 10v34z', { fill: '#ffffff' }), path('M356 668h20v-8h-20z', { fill: '#b8b8c8' }), path('M362 664h2M368 664h2M374 664h2', { fill: 'none', stroke: '#6a6a7a', 'stroke-width': 2 }));
    ppl.stack = [232, 660];
    ppl.lemons = [312, 700];
  }

  // ---- bunting between the cottage and the church, below the copy zone
  out.push(C('bunting zig-zagging across the street, low'));
  {
    const cols = ['#ff4d6d', '#ffd23a', '#4ab8e8', '#8ad870', '#c88aff'];
    const flags = cols.map(() => '');
    let rope = '';
    const spans = [[[280, 470], [800, 520]], [[800, 520], [1300, 470]]];
    let n = 0;
    for (const [a, b] of spans) {
      const m = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 34];
      rope += `M${P(...a)}Q${P(...m)} ${P(...b)}`;
      for (let k = 1; k < 12; k++) { const t = k / 12, x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * m[0] + t * t * b[0], y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * m[1] + t * t * b[1]; flags[n++ % 5] += `M${P(x - 9, y)}h18l-9 20z`; }
    }
    out.push(line(rope, '#ffffff', 2, { opacity: 0.8 }));
    flags.forEach((d, k) => out.push(path(d, { fill: cols[k] })));
  }

  // ---- the street lamp
  out.push(path('M1080 660V470h8V660Z', { fill: '#2a2a3a' }), path('M1068 470h32l-6 -34h-20z', { fill: '#fff3c4' }), path('M1064 438h40l-6 -10h-28z', { fill: '#2a2a3a' }), circle(1084, 456, 70, { fill: url('lamp') }));

  // ---- the crowd on the left: a family cheering, a girl with a carnival mask
  out.push(C('the crowd on the left: a dad cheering with his arms up and a girl waving a carnival mask on a stick'));
  {
    const cheer = (s) => ({ sx: s, elbow: [s * 0.9, -0.9], hand: [s * 1.2, -2.2] });
    const dad = figure({ x: 440, foot: 852, H: 118, heads: 3.2, skin: SKIN.deep, hair: '#1a1210', style: 'short', top: '#3a6a3a', bottom: '#2a2a3a', gaze: 0.5, mouth: 'open', arms: [cheer(-1), cheer(1)] });
    out.push(dad.svg, scarf(440, dad.torsoTop - 2, dad.r * 1.7, '#ffd23a', 1));
    const wave = { sx: 1, elbow: [1.0, -0.6], hand: [1.4, -2.0] };
    const g = figure({ x: 346, foot: 860, H: 78, heads: 2.7, skin: SKIN.light, hair: '#e8b84a', style: 'puffs', top: '#c83ab0', bottom: '#2a3a6a', shoe: '#ffd23a', gaze: 0.5, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, wave] });
    out.push(g.svg);
    const h = g.hand(wave);
    out.push(line(`M${P(h[0], h[1] + 10)}l6 -40`, '#c8945a', 3), G({ transform: `translate(${P(h[0] + 8, h[1] - 44)}) rotate(-12)` }, path('M-26 0c0 -14 12 -18 26 -10c14 -8 26 -4 26 10c0 12 -12 16 -26 8c-14 8 -26 4 -26 -8z', { fill: '#ffd23a' }), path('M-16 -2a6 4 0 1 0 12 0a6 4 0 1 0 -12 0zM4 -2a6 4 0 1 0 12 0a6 4 0 1 0 -12 0z', { fill: '#3a1a5a' }), path('M-24 -8c-10 -18 -4 -30 6 -32c-2 10 -2 20 -6 32zM24 -8c10 -18 4 -30 -6 -32c2 10 2 20 6 32z', { fill: '#3ab86a' })), circle(h[0], h[1], g.r * 0.36, { fill: SKIN.light }));
    ppl.mask = [h[0] + 8, h[1] - 44];
  }

  // ---- the racers, dashing left to right
  out.push(C('the focal point: the racers dashing for the finish — a girl in an apron flips her pancake sky-high, grandma in an apron and headscarf, a boy in a chef\'s hat; a dog leaps for a pancake that got away'));
  {
    // motion lines and dust puffs behind the runners
    out.push(line('M566 806h-30M566 822h-44M724 812h-34M724 828h-44M890 808h-32M890 824h-40', '#ffffff', 3, { opacity: 0.55 }));
    out.push(path(circD(536, 836, 10) + circD(552, 830, 7) + circD(744, 846, 9) + circD(760, 840, 6) + circD(950, 842, 9), { fill: '#d8c8e0', opacity: 0.6 }));
    // the boy in a chef's hat, at the back
    const run = (s, k = 1) => ({ sx: s, elbow: [s * 0.9 * k, 0.6], hand: [s * 0.4 * k, 1.3] });
    const panArm = { sx: 1, elbow: [1.0, 0.0], hand: [1.8, -0.4] };
    const boy = figure({ x: 600, foot: 846, H: 84, heads: 2.7, skin: SKIN.tan, hair: '#1a1210', style: 'short', top: '#2a8ad8', bottom: '#2a3a6a', shoe: '#e8343a', gaze: 0.6, mouth: 'open', arms: [run(-1), panArm] });
    out.push(boy.svg);
    const r0 = boy.r, h0 = boy.headY;
    out.push(path(`M${P(600 - r0 * 0.9, h0 - r0 * 0.5)}h${f(r0 * 1.8)}v${f(-r0 * 0.5)}h${f(-r0 * 1.8)}z`, { fill: '#ffffff' }), path(`M${P(600 - r0 * 1.0, h0 - r0 * 1.0)}c${f(-r0 * 0.3)} ${f(-r0 * 1.0)} ${f(r0 * 0.6)} ${f(-r0 * 1.4)} ${f(r0 * 1.0)} ${f(-r0 * 0.9)}c${f(r0 * 0.4)} ${f(-r0 * 0.7)} ${f(r0 * 1.4)} ${f(-r0 * 0.3)} ${f(r0 * 1.0)} ${f(r0 * 0.9)}z`, { fill: '#ffffff' }));
    const bh = boy.hand(panArm);
    out.push(pan(bh[0], bh[1], 48, -6), pancake(bh[0] + 48, bh[1] - 12, 20, 5, -6), circle(bh[0], bh[1], boy.r * 0.36, { fill: SKIN.tan }));
    // grandma in an apron and headscarf
    const gx = 760;
    const gran = figure({ x: gx, foot: 852, H: 110, heads: 3.1, skin: SKIN.fair, hair: '#e6e2ee', style: 'bun', top: '#2a6a8a', bottom: '#2a2a3a', shoe: '#2a1a14', gaze: 0.6, mouth: 'open', arms: [run(-1), panArm] });
    out.push(gran.svg);
    out.push(path(`M${P(gx - gran.tw * 0.42, gran.torsoTop + gran.r * 0.4)}h${f(gran.tw * 0.84)}V${f(gran.torsoBot + 6)}h${f(-gran.tw * 0.84)}z`, { fill: '#ffffff' }), path(`M${P(gx - gran.tw * 0.42, gran.torsoBot - 6)}h${f(gran.tw * 0.84)}`, { fill: 'none', stroke: '#e8343a', 'stroke-width': 3, 'stroke-dasharray': '4 4' }));
    const gr = gran.r, ghy = gran.headY;
    out.push(path(`M${P(gx - gr * 1.1, ghy - gr * 0.1)}C${P(gx - gr * 1.2, ghy - gr * 1.4)} ${P(gx + gr * 1.2, ghy - gr * 1.4)} ${P(gx + gr * 1.1, ghy - gr * 0.1)}L${P(gx + gr * 0.9, ghy - gr * 0.3)}Q${P(gx, ghy - gr * 0.9)} ${P(gx - gr * 0.9, ghy - gr * 0.3)}Z`, { fill: '#e8343a' }), path(`M${P(gx - gr * 1.1, ghy - gr * 0.2)}l${f(-gr * 0.5)} ${f(gr * 0.6)}l${f(gr * 0.4)} ${f(gr * 0.2)}z`, { fill: '#e8343a' }), path(circD(gx - gr * 0.5, ghy - gr * 0.9, gr * 0.1) + circD(gx + gr * 0.2, ghy - gr * 1.0, gr * 0.1) + circD(gx + gr * 0.7, ghy - gr * 0.6, gr * 0.1), { fill: '#ffffff' }));
    const gh = gran.hand(panArm);
    out.push(pan(gh[0], gh[1], 54, -10), pancake(gh[0] + 54, gh[1] - 22, 22, 6, -10), circle(gh[0], gh[1], gran.r * 0.34, { fill: SKIN.fair }));
    // the girl in front, flipping her pancake sky-high
    const fx = 930;
    const flip = { sx: 1, elbow: [1.0, -0.8], hand: [1.6, -1.8] };
    const girl = figure({ x: fx, foot: 850, H: 90, heads: 2.8, skin: SKIN.brown, hair: '#1a1210', style: 'curls', top: '#ffb800', bottom: '#5a3ab0', shoe: '#ffffff', gaze: 0.5, mouth: 'open', arms: [run(-1), flip] });
    out.push(girl.svg);
    out.push(path(`M${P(fx - girl.tw * 0.42, girl.torsoTop + girl.r * 0.4)}h${f(girl.tw * 0.84)}V${f(girl.torsoBot + 6)}h${f(-girl.tw * 0.84)}z`, { fill: '#ffffff' }), path(circD(fx - 6, girl.torsoTop + girl.r * 1.2, 3) + circD(fx + 7, girl.torsoTop + girl.r * 1.6, 3) + circD(fx - 3, girl.torsoTop + girl.r * 2.0, 3), { fill: '#e8343a' }));
    const fh = girl.hand(flip);
    out.push(pan(fh[0], fh[1], 50, -32), circle(fh[0], fh[1], girl.r * 0.36, { fill: SKIN.brown }));
    // the pancake flying high, with a swoosh
    const PX = fh[0] + 70, PY = 476;
    out.push(line(`M${P(fh[0] + 40, fh[1] - 34)}Q${P(fh[0] + 24, PY + 40)} ${P(PX - 26, PY + 12)}`, '#ffffff', 4, { opacity: 0.7, 'stroke-dasharray': '8 8' }));
    out.push(pancake(PX, PY, 34, 12, 24));
    out.push(path(`M${P(PX - 46, PY - 26)}l-10 -8M${P(PX + 44, PY - 30)}l10 -10M${P(PX + 4, PY - 36)}v-12`, { fill: 'none', stroke: '#ffe9a3', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    ppl.flip = [PX, PY];
    ppl.racer = [fx, girl.headY];
    // the dog leaping for a pancake that got away
    out.push(pancake(1036, 772, 18, 5, 30));
    out.push(G({ transform: 'translate(1080 820) rotate(-16)' }, dog(0, 0, 0.9, '#f4f4f0', { coat: null, flip: -1 }).replace('<g', '<g')));
    out.push(path(circD(1064, 774, 6) + circD(1092, 770, 5), { fill: '#3a2a22', opacity: 0.0 }));
    ppl.dog = [1070, 776];
  }

  // ---- the finish: two neighbors with the ribbon, the boy with the pancake bell
  out.push(C('the finish: two neighbors hold the ribbon; a boy rings the pancake bell'));
  {
    const wave = { sx: -1, elbow: [-1.0, -0.8], hand: [-1.3, -2.1] };
    const cheer = (s) => ({ sx: s, elbow: [s * 0.9, -0.9], hand: [s * 1.2, -2.2] });
    const a = figure({ x: 1150, foot: 846, H: 112, heads: 3.2, skin: SKIN.light, hair: '#c8642a', style: 'side', top: '#e8343a', bottom: '#2a2a3a', gaze: -0.5, mouth: 'open', arms: [wave, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.8] }] });
    const b = figure({ x: 1262, foot: 846, H: 116, heads: 3.2, skin: SKIN.brown, hair: '#1a1210', style: 'bun', top: '#2ab8a8', bottom: '#2a2a3a', gaze: -0.5, mouth: 'open', arms: [cheer(-1), cheer(1)] });
    out.push(b.svg, a.svg);
    // a checkered flag for the winner
    const ha = a.hand(wave);
    let chk = '';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) chk += `M${f(ha[0] - 2 - 14 * (i + 1))} ${f(ha[1] - 46 + 12 * j)}h14v12h-14z`;
    out.push(line(`M${P(ha[0], ha[1] + 10)}V${f(ha[1] - 48)}`, '#6a4028', 4), path(`M${f(ha[0] - 58)} ${f(ha[1] - 46)}h56v36h-56z`, { fill: '#ffffff' }), path(chk, { fill: '#1a1a24' }), circle(ha[0], ha[1], a.r * 0.36, { fill: SKIN.light }));
    ppl.ribbon = [ha[0] - 30, ha[1] - 28];
    const ring = { sx: 1, elbow: [1.0, -0.8], hand: [1.3, -2.0] };
    const kid = figure({ x: 1420, foot: 856, H: 80, heads: 2.7, skin: SKIN.deep, hair: '#1a1210', style: 'coils', top: '#ffd23a', bottom: '#2a3a6a', shoe: '#e8343a', gaze: -0.4, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, ring] });
    out.push(kid.svg);
    const kh = kid.hand(ring);
    out.push(line(`M${P(...kh)}v-14`, '#6a4028', 6), path(`M${P(kh[0] - 16, kh[1] - 14)}q0 -30 16 -32q16 2 16 32z`, { fill: '#e8b830' }), circle(kh[0], kh[1] - 10, 4, { fill: '#a87810' }), path(`M${P(kh[0] - 26, kh[1] - 40)}l-8 -6M${P(kh[0] + 26, kh[1] - 40)}l8 -6M${P(kh[0], kh[1] - 54)}v-8`, { fill: 'none', stroke: '#ffe9a3', 'stroke-width': 3, 'stroke-linecap': 'round' }), circle(kh[0], kh[1], kid.r * 0.36, { fill: SKIN.deep }));
    ppl.bell = [kh[0], kh[1] - 30];
  }

  return { svg: compactSvg(doc(`Pancake Day · mid. Concept: "the pancake race" on a village street on Shrove Tuesday evening. Focal point: the racers dashing left to right (x 560–1000, y 460–860) — a girl in an apron flips her pancake sky-high as she runs, grandma in an apron and red headscarf keeps up, a boy in a chef's hat brings up the rear — and a dog leaps for a pancake that got away. A boy rings the pancake bell and two neighbors hold the finish ribbon by the old stone church on the right; on the left a dad cheers and a girl waves a carnival mask by a stall stacked with pancakes, lemons and a sugar shaker. Light story: lamplight and lit windows against a carnival-purple evening. The confetti and the papel-picado banner are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Pancake Day · front: a crate of eggs and lemons bottom left, a milk churn bottom right; the center stays open`, [], [
    C('a crate of eggs and lemons'),
    path('M-10 900v-60h150v60z', { fill: '#a8743e' }), path('M-10 860h150M-10 880h150', { fill: 'none', stroke: '#7a4a22', 'stroke-width': 3 }),
    path(circD(20, 834, 14) + circD(48, 830, 14) + circD(76, 834, 14), { fill: '#fff4e0' }), path(circD(104, 832, 15) + circD(124, 838, 13), { fill: '#ffe03a' }),
    C('a milk churn'),
    path('M1520 900v-90q0 -14 14 -18h52q14 4 14 18v90z', { fill: '#b8c0cc' }), path('M1540 792v-16h40v16z', { fill: '#9aa2b0' }), path('M1520 840h80', { fill: 'none', stroke: '#9aa2b0', 'stroke-width': 6 }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'catch', x: r(ppl.flip[0]), y: r(ppl.flip[1]), r: 44, label: 'Catch the flipping pancakes' },
      { activity: 'color', x: r(ppl.racer[0]), y: r(ppl.racer[1] + 40), r: 50, label: 'Color in the pancake race' },
      { activity: 'memory', x: ppl.stack[0], y: ppl.stack[1], r: 44, label: 'Match the pancake toppings' },
      { activity: 'dressup', x: r(ppl.mask[0]), y: r(ppl.mask[1]), r: 34, label: 'Make a carnival mask' },
    ],
    findables: [
      { id: 'dog', label: 'a dog after a pancake', x: ppl.dog[0], y: ppl.dog[1], r: 30 },
      { id: 'bell', label: 'the pancake bell', x: r(ppl.bell[0]), y: r(ppl.bell[1]), r: 20 },
      { id: 'lemons', label: 'three lemons', x: ppl.lemons[0], y: ppl.lemons[1], r: 20 },
      { id: 'chef-hat', label: 'a chef\'s hat', x: 600, y: 742, r: 20 },
      { id: 'clock', label: 'the church clock', x: 1380, y: 310, r: 24 },
      { id: 'flag', label: 'the checkered flag', x: r(ppl.ribbon[0]), y: r(ppl.ribbon[1]), r: 24 },
      { id: 'cherry', label: 'a cherry on the pancake tower', x: 232, y: 616, r: 14 },
    ],
  };
}
