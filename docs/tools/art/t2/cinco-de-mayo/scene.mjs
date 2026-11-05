// Cinco de Mayo — "Fiesta in the plaza": a warm evening in a town square of pink, yellow and turquoise houses. A
// folklórico dancer swirls her rainbow-ribboned skirt in front of a blue-and-white talavera fountain; a mariachi
// trio in wide sombreros plays guitar, trumpet and violin; a blindfolded boy swings at a star piñata while his
// friends cheer and sweets fly; an elote cart steams on the corner. Low strings of papel picado cross the square
// (the big banner swaying at the top, and the confetti, are the effect's).
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { line, circD } from '../../kit/scenekit.mjs';

const ID = 'cinco-de-mayo';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const NIGHT = '#3a1a5a';
const night = (c, k = 0.25) => mix(c, NIGHT, k);
const LAMP = '#ffd98a';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const RAINBOW = ['#e8243a', '#ff8a1a', '#ffd23a', '#2ab86a', '#2a8ad8', '#8a4ad8', '#ff5aa8'];
const PLAZA = 720;

/** A wide sombrero on a head at (cx, cy) radius r. */
const sombrero = (cx, cy, r, col, trim) => [
  ellipse(cx, cy - r * 0.62, r * 2.2, r * 0.42, { fill: col }),
  path(`M${P(cx - r * 0.82, cy - r * 0.66)}C${P(cx - r * 0.8, cy - r * 1.8)} ${P(cx + r * 0.8, cy - r * 1.8)} ${P(cx + r * 0.82, cy - r * 0.66)}Z`, { fill: col }),
  path(`M${P(cx - r * 0.82, cy - r * 0.86)}Q${P(cx, cy - r * 1.02)} ${P(cx + r * 0.82, cy - r * 0.86)}`, { fill: 'none', stroke: trim, 'stroke-width': f(r * 0.16) }),
  ellipse(cx, cy - r * 0.62, r * 2.2, r * 0.42, { fill: 'none', stroke: trim, 'stroke-width': f(r * 0.1) }),
].join('');

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const cols = ['#ff8ab0', '#ffd23a', '#3ac8c8', '#ff9a5a', '#a8e05a', '#c88aff'];
  const R = rng(5);
  let houses = '';
  const fronts = cols.map(() => '');
  let wins = '';
  for (let x = 240, k = 0; x < 1300; k++) {
    const w = 110 + R() * 60, top = 470 + R() * 30;
    fronts[k % cols.length] += `M${P(x, 660)}V${f(top)}H${f(x + w)}V660Z`;
    wins += `M${P(x + 20, top + 30)}h20v30h-20ZM${P(x + w - 40, top + 30)}h20v30h-20Z`;
    x += w + 4;
  }
  const defs = [rad(id('winglow'), 0.5, 0.5, 0.5, [[0, LAMP, 0.5], [1, LAMP, 0]])];
  return compactSvg(doc(`Cinco de Mayo · back: the plaza's far side of pink, yellow, turquoise and orange houses with lit windows, kept low, and a church with twin bell towers on the right, against the purple evening`, defs, [
    C('the far side of the plaza'),
    fronts.map((d, k) => path(d, { fill: night(cols[k], 0.35) })).join(''),
    path(wins, { fill: LAMP, opacity: 0.85 }),
    C('the church with twin towers on the right'),
    path('M1330 660V500H1590V660ZM1330 500V320h60V500ZM1530 500V320h60V500Z', { fill: night('#f0d8b0', 0.3) }),
    path('M1326 320l34 -60l34 60zM1526 320l34 -60l34 60zM1400 500q60 -60 120 0z', { fill: night('#e8a050', 0.3) }),
    path('M1440 660v-80a20 20 0 0 1 40 0v80zM1350 360h20v30h-20zM1550 360h20v30h-20z', { fill: night('#5a3a2a', 0.2) }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('plaza'), 0, 0, 0, 1, [[0, '#c8a888'], [1, '#a88868']]),
    rad(id('pool'), 0.5, 0.5, 0.5, [[0, LAMP, 0.45], [1, LAMP, 0]]),
    lin(id('tile'), 0, 0, 0, 1, [[0, '#ffffff'], [1, '#e0e8f4']]),
    lin(id('water'), 0, 0, 0, 1, [[0, '#8ad8f8'], [1, '#3aa8e0']]),
  ];

  // ---- the plaza floor
  out.push(C('the plaza: terracotta paving in a warm pool of light'));
  out.push(path(`M-20 ${PLAZA - 60}H1620V920H-20Z`, { fill: url('plaza') }));
  { let t = ''; for (let y = PLAZA - 40; y < 920; y += 26 + (y - PLAZA) * 0.08) t += `M-20 ${f(y)}H1620`; for (let x = -40; x < 1660; x += 80) t += `M${x} ${PLAZA - 60}L${f(800 + (x - 800) * 1.5)} 920`; out.push(line(t, '#987858', 1.6, { opacity: 0.6 })); }
  out.push(ellipse(800, 800, 560, 90, { fill: url('pool') }));

  // ---- low strings of papel picado across the plaza
  out.push(C('low strings of papel picado across the plaza'));
  {
    const flags = RAINBOW.map(() => '');
    let rope = '', n = 0;
    for (const [a, b] of [[[230, 470], [800, 500]], [[800, 500], [1320, 470]]]) {
      const m = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 30];
      rope += `M${P(...a)}Q${P(...m)} ${P(...b)}`;
      for (let k = 1; k < 12; k++) { const t = k / 12, x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * m[0] + t * t * b[0], y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * m[1] + t * t * b[1]; flags[n++ % 7] += `M${P(x - 18, y)}h36v26l-6 -5l-6 5l-6 -5l-6 5l-6 -5l-6 5z`; }
    }
    out.push(line(rope, '#ffffff', 1.6, { opacity: 0.8 }));
    flags.forEach((d, k) => out.push(path(d, { fill: RAINBOW[k], opacity: 0.92 })));
  }

  // ---- the talavera fountain behind the dancer
  out.push(C('a blue-and-white talavera-tiled fountain'));
  {
    out.push(path('M620 760v-60h360v60z', { fill: url('tile') }), path('M612 704h376v-10h-376z', { fill: '#2a5aa8' }));
    let tiles = '';
    for (let x = 630; x < 970; x += 30) tiles += `M${x + 15} 714l10 10l-10 10l-10 -10z`;
    out.push(path(tiles, { fill: '#2a5aa8' }), path(Array.from({ length: 11 }, (_, k) => circD(645 + k * 30, 724, 3)).join(''), { fill: '#ffd23a' }));
    out.push(ellipse(800, 694, 180, 14, { fill: url('water') }));
    out.push(path('M784 694v-70h32v70z', { fill: url('tile') }), ellipse(800, 624, 50, 10, { fill: '#2a5aa8' }), path('M800 614q-30 -30 -50 10M800 614q30 -30 50 10M800 614v-30', { fill: 'none', stroke: '#bfeaff', 'stroke-width': 4, 'stroke-linecap': 'round' }));
  }

  // ---- the elote cart on the left
  out.push(C('an elote cart with a striped umbrella, steaming'));
  {
    out.push(path('M60 790v-90h170v90z', { fill: '#2ab86a' }), path('M70 700h150v-12h-150z', { fill: '#e8e8f0' }), circle(90, 800, 18, { fill: '#2a2a32' }), circle(200, 800, 18, { fill: '#2a2a32' }));
    out.push(path('M145 688V520h6V688Z', { fill: '#8a8a9a' }), path('M60 540q85 -60 176 0z', { fill: '#ffffff' }), path('M60 540q22 -30 44 -38l2 38zM148 502q22 6 44 38h-44z', { fill: '#e8243a' }));
    for (const x of [96, 128, 160, 192]) out.push(path(`M${x - 6} 688v-28q6 -10 12 0v28z`, { fill: '#ffd23a' }), path(`M${x - 6} 688q-6 -14 6 -18M${x + 6} 688q6 -14 -6 -18`, { fill: 'none', stroke: '#8ad86a', 'stroke-width': 3 }));
    out.push(line('M110 650c-6 -10 4 -16 -2 -26M150 650c-6 -10 4 -16 -2 -26', '#ffffff', 2.4, { opacity: 0.6 }));
    ppl.elote = [144, 670];
  }

  // ---- the piñata game
  out.push(C('the piñata: a star piñata on a rope, a blindfolded boy swinging a stick, friends cheering, sweets flying'));
  {
    const px = 470, py = 560;
    out.push(line(`M300 470Q${px} ${py - 60} ${px + 10} ${py - 40}`, '#e8d0a0', 2.4));
    let pts = '', cones = '';
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2 - Math.PI / 2, c = Math.cos(a), s = Math.sin(a); cones += `M${P(px + c * 26 - s * 12, py + s * 26 + c * 12)}L${P(px + c * 70, py + s * 70)}L${P(px + c * 26 + s * 12, py + s * 26 - c * 12)}Z`; pts += circD(px + c * 72, py + s * 72, 6); }
    out.push(path(cones, { fill: '#ff5aa8' }), circle(px, py, 34, { fill: '#ffd23a' }), path(pts, { fill: '#ffffff' }));
    out.push(path(`M${px - 34} ${py}h68M${px - 28} ${py - 16}h56M${px - 28} ${py + 16}h56`, { fill: 'none', stroke: '#ff8a1a', 'stroke-width': 4 }));
    let tails = '';
    for (const k of [2, 3, 4]) { const a = (k / 7) * Math.PI * 2 - Math.PI / 2; tails += `M${P(px + Math.cos(a) * 72, py + Math.sin(a) * 72)}q-6 20 4 40`; }
    out.push(line(tails, '#2ab86a', 4));
    ppl.pinata = [px, py];
    // sweets flying out
    const sweets = [[520, 520, '#e8243a'], [560, 570, '#2a8ad8'], [430, 600, '#ffd23a'], [540, 620, '#8a4ad8']];
    for (const [x, y, c] of sweets) out.push(G({ transform: `translate(${x} ${y}) rotate(${(x + y) % 90})` }, path('M-6 0a6 5 0 1 0 12 0a6 5 0 1 0 -12 0zM-6 0l-7 -5v10zM6 0l7 -5v10z', { fill: c })));
    // the blindfolded boy swinging the stick
    const swing = { sx: 1, elbow: [1.0, -1.0], hand: [1.3, -2.2] };
    const b = figure({ x: 420, foot: 852, H: 86, heads: 2.7, skin: SKIN.tan, hair: '#1a1210', style: 'short', top: '#ff8a1a', bottom: '#2a3a6a', shoe: '#2a2a3a', gaze: 0, mouth: 'open', arms: [{ sx: -1, elbow: [-0.8, 0.0], hand: [-1.4, -0.4] }, swing] });
    out.push(b.svg);
    out.push(path(`M${P(420 - b.r * 1.0, b.headY - b.r * 0.32)}h${f(b.r * 2)}v${f(b.r * 0.36)}h${f(-b.r * 2)}z`, { fill: '#e8243a' }), path(`M${P(420 + b.r * 0.9, b.headY - b.r * 0.2)}l${f(b.r * 0.6)} ${f(b.r * 0.3)}l${f(-b.r * 0.1)} ${f(b.r * 0.2)}z`, { fill: '#e8243a' }));
    const sh = b.hand(swing);
    out.push(line(`M${P(sh[0], sh[1] + 8)}l30 -70`, '#c8945a', 6), circle(sh[0], sh[1], b.r * 0.36, { fill: SKIN.tan }));
    out.push(line(`M${P(sh[0] + 12, sh[1] - 82)}q-16 0 -26 14M${P(sh[0] - 2, sh[1] - 60)}q-12 2 -18 12`, '#ffffff', 3, { opacity: 0.7 }));
    ppl.stick = [sh[0] + 20, sh[1] - 40];
    // friends cheering
    const cheer = (s) => ({ sx: s, elbow: [s * 0.9, -0.9], hand: [s * 1.2, -2.2] });
    const g1 = figure({ x: 300, foot: 858, H: 78, heads: 2.7, skin: SKIN.brown, hair: '#1a1210', style: 'puffs', top: '#2ab8a8', bottom: '#ff5aa8', shoe: '#ffffff', gaze: 0.4, mouth: 'open', arms: [cheer(-1), cheer(1)] });
    const g2 = figure({ x: 560, foot: 860, H: 74, heads: 2.6, skin: SKIN.light, hair: '#c8642a', style: 'bob', top: '#ffd23a', bottom: '#2a5aa8', shoe: '#e8243a', gaze: -0.4, mouth: 'open', arms: [cheer(-1), { sx: 1, elbow: [0.6, 1.0], hand: [0.4, 1.9] }] });
    out.push(g1.svg, g2.svg);
  }

  // ---- the folklórico dancer, swirling her skirt (the focal point)
  out.push(C('the focal point: a folklórico dancer swirls her wide rainbow-ribboned skirt, holding its edges out like wings, a big flower in her hair'));
  {
    const dx = 800, df = 858;
    const holdL = { sx: -1, elbow: [-1.2, 0.2], hand: [-2.4, 0.2] }, holdR = { sx: 1, elbow: [1.2, -0.4], hand: [2.4, -1.0] };
    const d = figure({ x: dx, foot: df, H: 120, heads: 3.2, skin: SKIN.tan, hair: '#1a1210', style: 'bun', top: '#ffffff', bottom: '#e8243a', shoe: '#2a1a14', gaze: 0.3, mouth: 'smile', arms: [holdL, holdR] });
    const hl = d.hand(holdL), hr = d.hand(holdR);
    // the skirt: a huge swirling fan from waist to the held edges, in rainbow bands
    const waist = [dx, d.torsoBot - 6];
    const hem = `M${P(hl[0], hl[1])}C${P(hl[0] - 30, hl[1] + 90)} ${P(dx - 120, df + 6)} ${P(dx, df + 4)}C${P(dx + 140, df + 2)} ${P(hr[0] + 40, hr[1] + 110)} ${P(hr[0], hr[1])}`;
    const skirt = `M${P(...waist)}L${P(hl[0], hl[1])}${hem.slice(hem.indexOf('C'))}Z`;
    defs.push(E('clipPath', { id: id('skirt') }, path(skirt)));
    out.push(d.svg);                                                 // the skirt goes over her legs
    out.push(path(skirt, { fill: RAINBOW[0] }));
    // rainbow bands: the highest band first, so each lower band paints over the one above it
    out.push(G({ 'clip-path': url('skirt') }, ...RAINBOW.slice(1).map((c, k) => path(`M${dx - 260} ${f(df + 30 - (k + 1) * 22)}Q${dx} ${f(df - 40 - (k + 1) * 22)} ${dx + 260} ${f(df + 10 - (k + 1) * 26)}V${df + 60}H${dx - 260}Z`, { fill: c })).reverse()));
    out.push(path(hem, { fill: 'none', stroke: '#ffffff', 'stroke-width': 5, 'stroke-dasharray': '2 8', 'stroke-linecap': 'round' }));
    out.push(path(`M${P(dx - 16, df - 4)}h12v6h-12zM${P(dx + 4, df - 4)}h12v6h-12z`, { fill: '#2a1a14' }));
    out.push(path(`M${P(dx - d.tw * 0.5, d.torsoTop + 4)}q${f(d.tw * 0.5)} ${f(d.r * 0.6)} ${f(d.tw)} 0`, { fill: 'none', stroke: '#e8243a', 'stroke-width': 4 }));
    out.push(path(circD(dx + d.r * 0.7, d.headY - d.r * 0.7, d.r * 0.32), { fill: '#ff5aa8' }), circle(dx + d.r * 0.7, d.headY - d.r * 0.7, d.r * 0.12, { fill: '#ffd23a' }), path(`M${P(dx + d.r * 0.4, d.headY - d.r * 0.5)}q-8 6 -4 14M${P(dx + d.r, d.headY - d.r * 0.5)}q8 6 4 14`, { fill: 'none', stroke: '#2ab86a', 'stroke-width': 3 }));
    out.push(circle(hl[0], hl[1], d.r * 0.34, { fill: SKIN.tan }), circle(hr[0], hr[1], d.r * 0.34, { fill: SKIN.tan }));
    out.push(line(`M${dx - 214} 790q-14 20 -6 44M${dx + 240} 740q24 30 14 64`, '#ffffff', 3, { opacity: 0.6 }));
    ppl.dancer = [dx, d.headY + 40];
    ppl.skirt = [dx + 120, df - 40];
  }

  // ---- the mariachi trio on the right
  out.push(C('a mariachi trio in black charro suits with silver buttons and wide sombreros: guitar, trumpet and violin'));
  {
    const suit = '#1a1a24';
    const player = (x, foot, skin, opts) => {
      const fg = figure({ x, foot, H: 124, heads: 3.3, skin, hair: '#1a1210', style: 'short', top: suit, bottom: suit, gaze: opts.gaze, mouth: opts.mouth ?? 'smile', arms: opts.arms });
      const r = fg.r;
      return { fg, svg: fg.svg + path(Array.from({ length: 4 }, (_, k) => circD(x - fg.tw * 0.3, fg.torsoTop + r * (0.6 + k * 0.5), 2.4) + circD(x + fg.tw * 0.3, fg.torsoTop + r * (0.6 + k * 0.5), 2.4)).join(''), { fill: '#d8dce8' }) + path(`M${P(x - r * 0.4, fg.torsoTop + 4)}l${f(r * 0.4)} ${f(r * 0.3)}l${f(r * 0.4)} ${f(-r * 0.3)}l${f(-r * 0.4)} ${f(r * 0.6)}z`, { fill: '#e8243a' }) + sombrero(x, fg.headY, r, opts.hat, '#d8dce8') };
    };
    // guitar
    const strum = { sx: 1, elbow: [0.6, 0.8], hand: [0.2, 1.2] }, neck = { sx: -1, elbow: [-1.0, 0.0], hand: [-1.8, -0.2] };
    const p1 = player(1080, 852, SKIN.brown, { gaze: -0.3, arms: [neck, strum], hat: '#3a2a1a' });
    out.push(p1.svg);
    const g = p1.fg;
    out.push(G({ transform: `translate(${1090} ${g.torsoTop + g.r * 1.7}) rotate(22)` }, path('M-80 -6h60v12h-60z', { fill: '#5a3a1a' }), path('M-90 -10h14v20h-14z', { fill: '#3a2a1a' }), path('M-24 -26c20 -14 40 0 40 10c14 -6 34 4 32 22c-2 18 -20 24 -32 16c0 10 -20 24 -40 10z', { fill: '#e8a050' }), circle(8, 0, 9, { fill: '#3a2014' }), line('M-80 -2h96M-80 2h96', '#f4ece0', 1)));
    out.push(circle(g.hand(neck)[0], g.hand(neck)[1], g.r * 0.34, { fill: SKIN.brown }), circle(g.hand(strum)[0], g.hand(strum)[1], g.r * 0.34, { fill: SKIN.brown }));
    ppl.guitar = [1080, g.torsoTop + g.r * 1.6];
    // trumpet
    const blow = { sx: -1, elbow: [-0.8, 0.2], hand: [-0.8, -0.2] }, blow2 = { sx: 1, elbow: [0.6, 0.2], hand: [-0.2, -0.5] };
    const p2 = player(1210, 848, SKIN.fair, { gaze: -0.4, mouth: 'open', arms: [blow, blow2], hat: '#e8d8b0' });
    out.push(p2.svg);
    const tg = p2.fg;
    const tm = [1204, tg.headY + tg.r * 0.5], tRot = `rotate(-14 ${f(tm[0])} ${f(tm[1])})`;
    out.push(G({ transform: tRot }, path(`M${1210 - 6} ${tg.headY + tg.r * 0.5}h-60v8h60zM${1210 - 66} ${tg.headY + tg.r * 0.5 - 8}l-26 -10v36l26 -10z`, { fill: '#ffd23a' }), circle(1210 - 40, tg.headY + tg.r * 0.5 + 4, 5, { fill: '#e8b800' })));
    out.push(circle(tg.hand(blow)[0], tg.hand(blow)[1], tg.r * 0.34, { fill: SKIN.fair }));
    ppl.trumpet = [1210 - 70, tg.headY + tg.r * 0.5 + 18];
    // violin
    const fiddle = { sx: -1, elbow: [-0.8, -0.2], hand: [-0.3, -0.4] }, bow = { sx: 1, elbow: [1.1, 0.2], hand: [1.6, -0.4] };
    const p3 = player(1340, 852, SKIN.deep, { gaze: -0.4, arms: [fiddle, bow], hat: '#5a1a2a' });
    out.push(p3.svg);
    const vg = p3.fg;
    out.push(G({ transform: `translate(${1340 - 18} ${vg.headY + vg.r * 1.8}) rotate(30)` }, path('M-12 -24c10 -6 24 -6 24 6c-6 4 -6 8 0 12c0 14 -14 18 -24 10z', { fill: '#a85a2a' }), path('M-2 -26v-26h4v26z', { fill: '#3a2014' })));
    const bh = vg.hand(bow);
    out.push(line(`M${P(bh[0], bh[1])}l-70 22`, '#e8d8b0', 3), circle(bh[0], bh[1], vg.r * 0.34, { fill: SKIN.deep }), circle(vg.hand(fiddle)[0], vg.hand(fiddle)[1], vg.r * 0.34, { fill: SKIN.deep }));
    // music notes
    out.push(path('M1150 520v-24l18 -4v24M1146 522a5 4 0 1 0 8 0a5 4 0 1 0 -8 0zM1164 518a5 4 0 1 0 8 0a5 4 0 1 0 -8 0zM1290 540v-22M1286 542a5 4 0 1 0 8 0a5 4 0 1 0 -8 0z', { fill: '#ffffff', stroke: '#ffffff', 'stroke-width': 2.4 }));
  }

  return { svg: compactSvg(doc(`Cinco de Mayo · mid. Concept: "fiesta in the plaza" on a warm evening. Focal point: a folklórico dancer (x 600–1000, y 600–860) swirling her wide rainbow-ribboned skirt in front of a blue-and-white talavera fountain. On the left a blindfolded boy swings at a star piñata while two friends cheer and sweets fly, beside an elote cart with a striped umbrella; on the right a mariachi trio in black charro suits with silver buttons and wide sombreros plays guitar, trumpet and violin. Low strings of papel picado cross the plaza; pink, yellow and turquoise houses and a twin-towered church behind. Light story: warm lamplight in the square against a purple evening. The big papel-picado banner and the confetti are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Cinco de Mayo · front: a talavera pot with an agave bottom left and a pot of marigolds bottom right; the centre stays open`, [], [
    C('a talavera pot with an agave'),
    path('M10 900l10 -60h100l10 60z', { fill: '#ffffff' }), path('M24 856h92M28 876h84', { fill: 'none', stroke: '#2a5aa8', 'stroke-width': 4 }),
    path('M70 840l-50 -60l60 50zM70 840l-10 -90l20 90zM70 840l50 -70l-40 70zM70 840l-70 -20l70 10zM70 840l74 -14l-70 22z', { fill: '#5aa87a' }),
    C('a pot of marigolds'),
    path('M1480 900l10 -54h100l10 54z', { fill: '#c8643a' }),
    path(circD(1504, 830, 16) + circD(1540, 818, 18) + circD(1576, 832, 16), { fill: '#ff9a1a' }), path(circD(1504, 830, 7) + circD(1540, 818, 8) + circD(1576, 832, 7), { fill: '#ffd23a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'catch', x: ppl.pinata[0], y: ppl.pinata[1], r: 56, label: 'Catch the piñata sweets' },
      { activity: 'dressup', x: r(ppl.dancer[0]), y: r(ppl.dancer[1]), r: 56, label: 'Dress up for the fiesta' },
      { activity: 'colour', x: r(ppl.skirt[0]), y: r(ppl.skirt[1]), r: 44, label: 'Colour the dancing skirt' },
      { activity: 'memory', x: r(ppl.guitar[0]), y: r(ppl.guitar[1]), r: 44, label: 'Match the mariachi instruments' },
    ],
    findables: [
      { id: 'elote', label: 'corn on the cob', x: ppl.elote[0], y: ppl.elote[1], r: 26 },
      { id: 'trumpet', label: 'a golden trumpet', x: r(ppl.trumpet[0]), y: r(ppl.trumpet[1]), r: 24 },
      { id: 'blindfold', label: 'a red blindfold', x: 420, y: 760, r: 18 },
      { id: 'fountain', label: 'the tiled fountain', x: 800, y: 720, r: 40 },
      { id: 'stick', label: 'the piñata stick', x: r(ppl.stick[0]), y: r(ppl.stick[1]), r: 22 },
      { id: 'flower', label: 'a flower in the dancer\'s hair', x: 812, y: 730, r: 16 },
      { id: 'towers', label: 'the church towers', x: 1460, y: 330, r: 40 },
    ],
  };
}
