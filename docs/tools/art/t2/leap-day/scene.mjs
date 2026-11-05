// Leap Day — "Leapfrog at the pond": the bonus day at a thawing pond, the first green of the year showing through the
// last patches of snow. On the bank three friends play leapfrog — one crouches, one vaults clean over with legs
// flung wide, one cheers and waits a turn; on the right a little one in a frog raincoat hops along with the frogs,
// past a big tear-off calendar standing open at 29. In the pond frogs sit on lily pads (one in a party hat, it's
// a bonus day after all), tadpoles wriggle, snowdrops and crocuses push up round the edge, a robin sings in the
// budding tree and a hare leaps across the far meadow. The hopping frogs are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure, head } from '../../gen-kw/people.mjs';
import { bareTree, line, circD, ellD } from '../../kit/scenekit.mjs';

const ID = 'leap-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SKIN = { a: '#f0c8a8', b: '#c8946a', c: '#8a5a3a', d: '#e4b08a' };
const HAIR = '#2a1a14';
const GROUND = 700;

/** A frog sitting, facing front, at (x, y) (bottom centre), scale s. */
const frog = (x, y, s = 1, col = '#4aa84a', hat = false) => G({ transform: `translate(${f(x)} ${f(y)}) scale(${f(s)})` },
  ellipse(0, -2, 26, 6, { fill: '#000', opacity: 0.2 }),
  path('M-24 0c-6 -10 -2 -18 8 -18M24 0c6 -10 2 -18 -8 -18', { fill: 'none', stroke: darken(col, 0.15), 'stroke-width': 8, 'stroke-linecap': 'round' }),
  path('M-20 -4C-22 -22 -12 -30 0 -30C12 -30 22 -22 20 -4Z', { fill: col }),
  ellipse(0, -10, 12, 8, { fill: '#e0f4b0' }),
  circle(-10, -30, 8, { fill: col }), circle(10, -30, 8, { fill: col }),
  circle(-10, -31, 4.6, { fill: '#ffffff' }), circle(10, -31, 4.6, { fill: '#ffffff' }), circle(-9.4, -30.4, 2.4, { fill: '#1a1a1a' }), circle(10.6, -30.4, 2.4, { fill: '#1a1a1a' }),
  path('M-8 -20q8 6 16 0', { fill: 'none', stroke: '#1a3a1a', 'stroke-width': 2, 'stroke-linecap': 'round' }),
  circle(-14, -18, 3, { fill: '#ff9aa8', opacity: 0.6 }), circle(14, -18, 3, { fill: '#ff9aa8', opacity: 0.6 }),
  path('M-12 0h8M4 0h8', { fill: 'none', stroke: darken(col, 0.15), 'stroke-width': 4, 'stroke-linecap': 'round' }),
  hat ? path('M-6 -36l8 -26l8 26z', { fill: '#ff5aa8' }) + path('M-4 -42l12 -4M-1 -50l8 -3', { fill: 'none', stroke: '#ffd166', 'stroke-width': 2.4 }) + circle(2, -62, 4, { fill: '#ffd166' }) : '');

/** A lily pad with its notch, at (x, y). */
const pad = (x, y, rx, ry, rot = 0) => path(`M${f(x)} ${f(y)}L${P(x + rx * Math.cos(rot), y + ry * Math.sin(rot))}A${f(rx)} ${f(ry)} 0 1 1 ${P(x + rx * Math.cos(rot + 0.5), y + ry * Math.sin(rot + 0.5))}Z`, { fill: '#5aa84a' });

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(4);
  let trees = '';
  for (const [x, h] of [[120, 130], [380, 90], [1180, 100], [1460, 140], [1540, 110]]) trees += bareTree(x, 610, h, Math.floor(R() * 50), { depth: 5, spread: 0.55, trunk: 0.08 }).d;
  return compactSvg(doc(`Leap Day · back: soft green hills of early spring with a few bare budding trees and the last streaks of snow, a little cottage, a hare leaping across the far meadow; low behind the copy`, [], [
    C('far hills'),
    path('M-20 560C160 520 340 526 520 548C700 570 880 576 1060 560C1240 544 1420 524 1620 540V700H-20Z', { fill: '#4a8a5a' }),
    path('M-20 600C220 580 440 590 660 604C880 618 1100 612 1320 596C1460 588 1560 590 1620 594V700H-20Z', { fill: '#5a9a5a' }),
    C('the last streaks of snow'),
    path('M120 588q60 -8 120 0q-60 6 -120 0zM760 600q80 -8 160 0q-80 6 -160 0zM1280 590q50 -6 100 0q-50 5 -100 0z', { fill: '#eef4f0', opacity: 0.8 }),
    C('bare trees just coming into bud'),
    path(trees, { fill: '#3a5a3a' }),
    C('a little cottage'),
    path('M1300 600v-34h50v34zM1294 568l31 -22l31 22z', { fill: '#e8e0d0' }), path('M1294 568l31 -22l31 22z', { fill: '#a85a3a' }), path('M1318 600v-16h12v16z', { fill: '#5a3a2a' }), path('M1338 576h8v8h-8z', { fill: '#ffd98a' }),
    C('a hare leaping across the far meadow'),
    G({ transform: 'translate(560 596) rotate(-14)' }, path('M-18 0q4 -12 20 -12q14 0 18 8l10 -2l-4 6q-6 6 -18 6h-20z', { fill: '#a8845a' }), path('M20 -10l6 -16l4 2l-4 14zM16 -10l2 -16l4 0l-2 16z', { fill: '#a8845a' }), path('M-18 0l-14 6M-6 4l-8 10', { fill: 'none', stroke: '#a8845a', 'stroke-width': 4, 'stroke-linecap': 'round' }), circle(-20, -4, 4, { fill: '#f4f0e8' })),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('grass'), 0, 0, 0, 1, [[0, '#8ac85a'], [1, '#5a9a3a']]),
    lin(id('pond'), 0, 0, 0, 1, [[0, '#7ac8d8'], [1, '#3a8aa8']]),
    lin(id('paper'), 0, 0, 0, 1, [[0, '#ffffff'], [1, '#eef0f0']]),
  ];

  // ---- the bank and the pond
  out.push(C('the grassy bank and the pond'));
  out.push(path(`M-20 ${GROUND - 20}Q600 ${GROUND - 36} 1100 ${GROUND - 20}T1620 ${GROUND - 24}V920H-20Z`, { fill: url('grass') }));
  out.push(path('M420 760C420 712 560 690 760 692C960 694 1060 716 1060 760C1060 808 940 836 740 836C540 836 420 808 420 760Z', { fill: url('pond') }));
  out.push(line('M500 744h80M640 800h120M860 730h90M900 790h60', '#c8f0f4', 3, { opacity: 0.7 }));
  // tadpoles
  let tad = '';
  for (const [x, y] of [[600, 780], [624, 790], [612, 768]]) tad += `M${x} ${y}a4 3 0 1 0 8 0a4 3 0 1 0 -8 0M${x + 8} ${y}q6 -3 10 2`;
  out.push(path(tad, { fill: '#2a3a2a', stroke: '#2a3a2a', 'stroke-width': 1.4 }));
  ppl.tadpoles = [612, 780];

  // ---- lily pads and the frogs
  out.push(C('lily pads with frogs; one wears a party hat, it\'s a bonus day'));
  out.push(pad(540, 738, 44, 16, -0.3), pad(700, 760, 56, 20, 0.2), pad(880, 744, 50, 18, -0.6), pad(960, 800, 38, 14, 0.4), pad(800, 808, 34, 12, 1));
  out.push(path('M560 728a7 7 0 1 0 14 0a7 7 0 1 0 -14 0', { fill: '#ffb0c8' }), circle(567, 728, 3, { fill: '#ffe066' }));
  out.push(frog(700, 762, 1.1, '#4aa84a', true), frog(880, 746, 0.9, '#6ab84a'), frog(960, 802, 0.7, '#3a9a5a'));
  ppl.partyFrog = [700, 730]; ppl.pondFrog = [880, 730];
  // a frog mid-leap from pad to pad, with its arc
  out.push(line('M560 720q60 -90 120 -40', '#ffffff', 3, { 'stroke-dasharray': '2 9', opacity: 0.8 }));
  out.push(G({ transform: 'translate(640 660) rotate(20)' }, path('M-16 0C-18 -14 -8 -20 4 -20C16 -20 22 -12 20 0Z', { fill: '#5ab84a' }), circle(10, -20, 6, { fill: '#5ab84a' }), circle(11, -21, 3, { fill: '#ffffff' }), circle(11.6, -21, 1.6, { fill: '#1a1a1a' }), path('M-14 0l-20 10l-6 -2M-10 2l-14 14l-6 0M14 0l10 12', { fill: 'none', stroke: '#3a9a3a', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })));

  // ---- snowdrops and crocuses round the pond
  out.push(C('snowdrops and crocuses pushing up round the pond, the last snow melting'));
  {
    out.push(path('M380 820q40 -14 80 0q-40 10 -80 0zM1060 820q50 -12 100 0q-50 8 -100 0z', { fill: '#f4f8f4' }));
    let stems = '', drops = '', cro = '', croIn = '';
    for (const [x, y] of [[396, 806], [414, 800], [1080, 806], [1100, 798], [1124, 808]]) { stems += `M${x} ${y + 16}v-18q0 -6 6 -8`; drops += `M${x + 6} ${y - 10}c-6 2 -6 12 0 16c6 -4 6 -14 0 -16z`; }
    for (const [x, y, c] of [[360, 790, '#a86ad8'], [440, 780, '#ffd166'], [1040, 784, '#a86ad8'], [1160, 790, '#ffffff'], [1010, 800, '#ffd166']]) { stems += `M${x} ${y + 24}v-14`; cro += path(`M${x - 7} ${y}c0 -14 4 -18 7 -18c3 0 7 4 7 18c-2 6 -12 6 -14 0z`, { fill: c }); croIn += `M${x} ${y - 12}v8`; }
    out.push(line(stems, '#3a8a3a', 2.4), path(drops, { fill: '#ffffff' }), cro, line(croIn, '#ff8a1a', 2));
    ppl.crocus = [440, 784];
  }

  // ---- leapfrog on the bank
  out.push(C('three friends play leapfrog: one crouches, one vaults clean over with legs flung wide, one cheers and waits a turn'));
  {
    // the vaulter, behind and above: arms down on the crouching back, legs flung out wide (drawn first)
    const vx = 196, vfoot = 742, vH = 112, push = (s) => ({ sx: s, elbow: [s * 0.5, 1.0], hand: [s * 0.1, 1.9] });
    const vr = vH / 5.6, vtb = vfoot - vH * 0.28, vtw = vr * 1.9;
    for (const sx of [-1, 1]) {
      const hip = [vx + sx * vtw * 0.3, vtb - 6], knee = [vx + sx * 46, vtb - 2], toe = [vx + sx * 78, vtb + 10];
      out.push(path(`M${P(...hip)}Q${P(...knee)} ${P(...toe)}`, { fill: 'none', stroke: '#2a5aa8', 'stroke-width': vr * 0.5, 'stroke-linecap': 'round' }));
      out.push(ellipse(toe[0] + sx * 6, toe[1] + 2, 10, 6, { fill: '#ff5a5a', transform: `rotate(${sx * 20} ${f(toe[0] + sx * 6)} ${f(toe[1] + 2)})` }));
    }
    const v = figure({ x: vx, foot: vfoot, H: vH, heads: 2.8, skin: SKIN.b, hair: HAIR, style: 'curls', top: '#ffd166', bottom: 'none', shoe: 'none', gaze: 0.2, mouth: 'open', arms: [push(-1), push(1)] });
    out.push(v.svg);
    out.push(line(`M${f(vx - 80)} ${f(vtb - 70)}q-10 20 0 40M${f(vx + 80)} ${f(vtb - 70)}q10 20 0 40`, '#ffffff', 3, { opacity: 0.8 }));
    ppl.vaulter = [vx, v.headY];
    // the crouching friend in front, hands on knees, head tucked
    const cx = 200, cy = 760;
    out.push(ellipse(cx, 802, 46, 7, { fill: '#000', opacity: 0.2 }));
    out.push(line(`M${cx - 22} 770L${cx - 26} 798M${cx + 4} 772L${cx + 4} 798`, '#3a3a5a', 11));
    out.push(path(`M${cx - 38} 798h18v6h-18zM${cx - 6} 798h18v6h-18z`, { fill: '#2a2a2a' }));
    out.push(path(`M${cx - 40} ${cy + 6}C${cx - 44} ${cy - 30} ${cx + 30} ${cy - 40} ${cx + 38} ${cy - 4}C${cx + 40} ${cy + 12} ${cx - 36} ${cy + 22} ${cx - 40} ${cy + 6}Z`, { fill: '#e8243a' }));
    out.push(line(`M${cx + 24} ${cy - 6}L${cx + 14} ${cy + 22}`, '#e8243a', 11), circle(cx + 13, cy + 24, 6, { fill: SKIN.a }));
    out.push(head(cx + 46, cy - 6, 16, SKIN.a, '#c8742a', 'short', { gaze: 0.6, mouth: 'smile' }));
    ppl.crouch = [cx, cy - 20];
    // the friend waiting a turn, cheering
    const cheer = (s) => ({ sx: s, elbow: [s * 0.8, -0.6], hand: [s * 0.9, -1.8] });
    out.push(figure({ x: 320, foot: 806, H: 116, heads: 2.8, skin: SKIN.c, hair: HAIR, style: 'puffs', top: '#5a3aa8', bottom: '#ff8ac8', shoe: '#ffffff', gaze: -0.6, mouth: 'open', arms: [cheer(-1), cheer(1)] }).svg);
  }

  // ---- the big tear-off calendar standing open at 29
  out.push(C('a big tear-off calendar on an easel, standing open at 29'));
  {
    const x0 = 1180, y0 = 520, w = 150, h = 170;
    out.push(line(`M${x0 + 20} ${y0 + h}L${x0 + 6} 790M${x0 + w - 20} ${y0 + h}L${x0 + w - 6} 790M${x0 + w / 2} ${y0 + 20}L${x0 + w / 2 + 30} 784`, '#8a5a32', 7));
    out.push(path(`M${x0} ${y0}h${w}v${h}h-${w}z`, { fill: url('paper') }), path(`M${x0} ${y0}h${w}v40h-${w}z`, { fill: '#e8243a' }));
    out.push(path(`M${x0 + 18} ${y0 - 8}v14M${x0 + 50} ${y0 - 8}v14M${x0 + 100} ${y0 - 8}v14M${x0 + 132} ${y0 - 8}v14`, { fill: 'none', stroke: '#8a8a9a', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    // "29", drawn as strokes
    out.push(path(`M${x0 + 30} ${y0 + 82}c0 -22 40 -22 40 0c0 16 -40 34 -40 58h42M${x0 + 118} ${y0 + 94}a20 20 0 1 0 0 2M${x0 + 118} ${y0 + 92}c0 30 -6 46 -32 50`, { fill: 'none', stroke: '#2a2a3a', 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    out.push(path(`M${x0 + 40} ${y0 + 20}h70`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-dasharray': '14 10' }));
    // the torn-off 28 fluttering away
    out.push(path(`M${x0 + w + 20} ${y0 - 40}l60 -10l8 50l-60 10z`, { fill: '#ffffff', opacity: 0.9 }), path(`M${x0 + w + 22} ${y0 - 40}l60 -10l2 12l-60 10z`, { fill: '#e8243a', opacity: 0.9 }));
    // a sparkle: one bonus day!
    out.push(path(`M${x0 - 20} ${y0 + 10}l6 -16l6 16l16 6l-16 6l-6 16l-6 -16l-16 -6z`, { fill: '#ffd166' }));
    ppl.calendar = [x0 + w / 2, y0 + h / 2];
  }

  // ---- the little one in a frog raincoat, hopping
  out.push(C('a little one in a frog raincoat hops along with the frogs'));
  {
    const hop = (s) => ({ sx: s, elbow: [s * 0.8, -0.2], hand: [s * 1.4, -1.0] });
    const k = figure({ x: 1420, foot: 800, H: 100, heads: 2.5, skin: SKIN.d, hair: '#8a4a1a', style: 'bob', top: '#5ab84a', bottom: '#5ab84a', shoe: '#ffd166', gaze: -0.3, mouth: 'open', arms: [hop(-1), hop(1)] });
    out.push(ellipse(1420, 850, 30, 6, { fill: '#000', opacity: 0.2 }), k.svg);
    // the hood with frog eyes
    out.push(path(`M${f(1420 - k.r * 1.1)} ${f(k.headY + k.r * 0.4)}C${f(1420 - k.r * 1.3)} ${f(k.headY - k.r * 1.4)} ${f(1420 + k.r * 1.3)} ${f(k.headY - k.r * 1.4)} ${f(1420 + k.r * 1.1)} ${f(k.headY + k.r * 0.4)}L${f(1420 + k.r * 0.9)} ${f(k.headY + k.r * 0.2)}C${f(1420 + k.r * 0.9)} ${f(k.headY - k.r * 0.9)} ${f(1420 - k.r * 0.9)} ${f(k.headY - k.r * 0.9)} ${f(1420 - k.r * 0.9)} ${f(k.headY + k.r * 0.2)}Z`, { fill: '#5ab84a' }));
    out.push(circle(1420 - k.r * 0.6, k.headY - k.r * 1.0, k.r * 0.4, { fill: '#5ab84a' }), circle(1420 + k.r * 0.6, k.headY - k.r * 1.0, k.r * 0.4, { fill: '#5ab84a' }), circle(1420 - k.r * 0.6, k.headY - k.r * 1.04, k.r * 0.24, { fill: '#ffffff' }), circle(1420 + k.r * 0.6, k.headY - k.r * 1.04, k.r * 0.24, { fill: '#ffffff' }), circle(1420 - k.r * 0.56, k.headY - k.r * 1.02, k.r * 0.12, { fill: '#1a1a1a' }), circle(1420 + k.r * 0.64, k.headY - k.r * 1.02, k.r * 0.12, { fill: '#1a1a1a' }));
    out.push(line('M1380 840q-20 -40 -60 -30M1460 840q20 -30 50 -20', '#ffffff', 3, { opacity: 0.7, 'stroke-dasharray': '2 8' }));
    ppl.hopper = [1420, k.headY + 20];
  }

  // ---- the budding tree with the robin, a snail
  out.push(C('a budding tree with a singing robin on the right'));
  {
    const t = bareTree(1560, GROUND + 20, 300, 12, { lean: -0.08, depth: 5, spread: 0.55, trunk: 0.1 });
    out.push(path(t.d, { fill: '#5a4a3a' }));
    out.push(path(t.tips.map(([x, y]) => circD(x, y, 5)).join(''), { fill: '#a8e070' }), path(t.tips.filter((_, i) => i % 3 === 0).map(([x, y]) => circD(x + 4, y + 4, 4)).join(''), { fill: '#ffb0c8' }));
    const [rx, ry] = t.tips[Math.floor(t.tips.length * 0.3)];
    out.push(G({ transform: `translate(${f(rx - 6)} ${f(ry + 22)})` }, ellipse(0, 0, 12, 9, { fill: '#7a5a3a' }), ellipse(-3, 3, 7, 6, { fill: '#e8642a' }), circle(-9, -6, 6, { fill: '#7a5a3a' }), path('M-15 -7l-6 1l6 2z', { fill: '#ffb020' }), circle(-10, -7, 1.3, { fill: '#1a1a1a' }), path('M10 -2l10 -6l-2 8z', { fill: '#5a3a2a' })));
    out.push(path(`M${f(rx - 30)} ${f(ry + 4)}l-6 -6M${f(rx - 32)} ${f(ry + 14)}h-8`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
    ppl.robin = [rx - 8, ry + 20];
  }
  out.push(G({ transform: 'translate(1000 860)' }, path('M-20 0h34q6 0 6 -6q0 -4 -4 -4l-4 -10l-2 10z', { fill: '#c8a888' }), circle(-4, -12, 12, { fill: '#e8a04a' }), path('M-4 -12m-6 0a6 6 0 1 1 6 6', { fill: 'none', stroke: '#a8642a', 'stroke-width': 2 })));
  ppl.snail = [996, 850];

  return { svg: compactSvg(doc(`Leap Day · mid. Concept: "leapfrog at the pond" on the bonus day, the first green of the year showing through the last snow. Focal points: three friends playing leapfrog on the bank, one vaulting clean over another with legs flung wide (x 120–380, y 600–810), and the pond with frogs on lily pads, one in a party hat and one mid-leap (x 420–1060, y 640–840). A big tear-off calendar on an easel stands open at 29 as the 28 flutters away; a little one in a frog raincoat hops along; snowdrops and crocuses, tadpoles, a robin singing in a budding tree, a snail. Light story: soft fresh early-spring light. The hopping frogs are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Leap Day · front: reeds and cattails in the bottom corners; the centre stays open`, [], [
    C('reeds and cattails, bottom left'),
    line('M20 900q-4 -80 6 -140M48 900q4 -60 -8 -110M76 900q2 -50 14 -86', '#4a8a3a', 5),
    path('M20 760q6 0 6 8v30q0 6 -6 6q-6 0 -6 -6v-30q0 -8 6 -8z', { fill: '#7a4a2a' }),
    C('reeds and cattails, bottom right'),
    line('M1580 900q4 -80 -6 -140M1552 900q-4 -60 8 -110M1524 900q-2 -50 -14 -86', '#4a8a3a', 5),
    path('M1580 760q6 0 6 8v30q0 6 -6 6q-6 0 -6 -6v-30q0 -8 6 -8z', { fill: '#7a4a2a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'wish', x: ppl.calendar[0], y: ppl.calendar[1], r: 70, label: 'Make a leap day wish' },
      { activity: 'catch', x: 760, y: 770, r: 70, label: 'Catch the hopping frogs' },
      { activity: 'colour', x: ppl.partyFrog[0], y: ppl.partyFrog[1], r: 36, label: 'Colour the party frog' },
      { activity: 'card', x: r(ppl.vaulter[0]), y: r(ppl.vaulter[1] + 40), r: 50, label: 'Make a leap day card' },
      { activity: 'memory', x: ppl.crocus[0], y: ppl.crocus[1], r: 36, label: 'Spring memory game' },
    ],
    findables: [
      { id: 'tadpoles', label: 'tadpoles', x: ppl.tadpoles[0], y: ppl.tadpoles[1], r: 18 },
      { id: 'robin', label: 'a singing robin', x: r(ppl.robin[0]), y: r(ppl.robin[1]), r: 18 },
      { id: 'snail', label: 'a snail', x: ppl.snail[0], y: ppl.snail[1], r: 18 },
      { id: 'hare', label: 'a leaping hare', x: 560, y: 590, r: 22 },
      { id: 'frog-coat', label: 'a frog raincoat', x: ppl.hopper[0], y: ppl.hopper[1], r: 30 },
      { id: 'pond-frog', label: 'a frog on a lily pad', x: ppl.pondFrog[0], y: ppl.pondFrog[1], r: 22 },
      { id: 'snowdrop', label: 'snowdrops', x: 1100, y: 800, r: 18 },
    ],
  };
}
