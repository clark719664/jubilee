// Ramadan — "Iftar on the rooftop": the sun has just set and the fast is over. On a whitewashed rooftop a family
// sits round a low table spread with dates, water, lentil soup, samosas and flatbread under strings of glowing
// fanous lanterns; grandma offers the dates. Across the gap a neighbor passes over a plate of sweet qatayef; two
// children with little lanterns aim a telescope at the sky to look for the moon. Minarets and domes against the
// last light. The moon, the stars and the lattice are the effect's (the sky is left open for them).
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, rect, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { stringLights, line, circD } from '../../kit/scenekit.mjs';

const ID = 'ramadan';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const NIGHT = '#0a3040';
const night = (c, k = 0.3) => mix(c, NIGHT, k);
const LAMP = '#ffcf6a';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };

// ---- layout
const ROOF = 742;                       // the rooftop floor line (top of the parapet in front is lower, in the front layer)
const TABLE = { x0: 470, x1: 1110, top: 778, h: 26 };

/** A hijab over a figure's head: a soft hood round the face that drapes to the shoulders. */
function hijab(fg, x, col) {
  const r = fg.r, hy = fg.headY;
  const outer = `M${P(x - r * 1.18, fg.torsoTop + r * 0.5)}C${P(x - r * 1.3, hy + r * 0.2)} ${P(x - r * 1.28, hy - r * 1.28)} ${P(x, hy - r * 1.3)}C${P(x + r * 1.28, hy - r * 1.28)} ${P(x + r * 1.3, hy + r * 0.2)} ${P(x + r * 1.18, fg.torsoTop + r * 0.5)}Z`;
  const face = `M${P(x - r * 0.8, hy + r * 0.05)}a${f(r * 0.8)} ${f(r * 0.9)} 0 1 0 ${f(r * 1.6)} 0a${f(r * 0.8)} ${f(r * 0.9)} 0 1 0 ${f(-r * 1.6)} 0Z`;
  return path(outer + face, { fill: col, 'fill-rule': 'evenodd' }) + path(`M${P(x - r * 0.84, hy - r * 0.5)}Q${P(x, hy - r * 1.05)} ${P(x + r * 0.84, hy - r * 0.5)}`, { fill: 'none', stroke: lighten(col, 0.25), 'stroke-width': f(r * 0.1), 'stroke-linecap': 'round', opacity: 0.8 });
}

/** A fanous lantern hanging from (x, y) by its ring; s = height. */
function fanous(x, y, s, glass) {
  const w = s * 0.42;
  return [
    circle(x, y + s * 0.55, s * 0.9, { fill: url('glow') }),
    path(`M${P(x - w * 0.3, y + s * 0.14)}L${P(x - w * 0.5, y + s * 0.3)}H${f(x + w * 0.5)}L${P(x + w * 0.3, y + s * 0.14)}Z`, { fill: '#c8901e' }),
    path(`M${P(x - w * 0.5, y + s * 0.3)}L${P(x - w * 0.58, y + s * 0.72)}L${P(x, y + s * 0.86)}L${P(x + w * 0.58, y + s * 0.72)}L${P(x + w * 0.5, y + s * 0.3)}Z`, { fill: glass }),
    path(`M${P(x, y + s * 0.3)}V${f(y + s * 0.86)}M${P(x - w * 0.54, y + s * 0.5)}H${f(x + w * 0.54)}`, { fill: 'none', stroke: '#c8901e', 'stroke-width': f(s * 0.04) }),
    path(`M${P(x - w * 0.3, y + s * 0.86)}h${f(w * 0.6)}l${f(-w * 0.3)} ${f(s * 0.14)}z`, { fill: '#c8901e' }),
    circle(x, y + s * 0.07, s * 0.07, { fill: 'none', stroke: '#c8901e', 'stroke-width': f(s * 0.035) }),
  ].join('');
}

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const R = rng(4);
  let roofs = '', wins = '';
  for (const [x0, x1, base, hMin, hMax] of [[-20, 1640, 660, 50, 110]]) {
    for (let x = x0; x < x1;) {
      const w = 70 + R() * 90, h = hMin + R() * (hMax - hMin), top = base - h;
      const inZone = x + w > 300 && x < 1300;
      const t = inZone ? Math.max(top, 470) : top;
      roofs += `M${P(x, base)}V${f(t)}H${f(x + w)}V${f(base)}Z`;
      for (let k = 0; k < 3; k++) if (R() < 0.45) wins += `M${P(x + 12 + k * (w - 30) / 2, t + 16 + R() * 20)}h9v13h-9Z`;
      x += w + 2;
    }
  }
  // two minarets and a dome, outside the copy zone
  const mosque = 'M1340 660V520Q1340 440 1420 420Q1500 440 1500 520V660ZM1416 424v-26h8v26zM1508 660V330h26V660ZM1504 334l17 -48l17 48ZM176 660V350h24V660ZM172 354l16 -44l16 44Z';
  const balconies = 'M1502 420h38v8h-38zM1502 520h38v8h-38zM170 430h36v8h-36zM170 520h36v8h-36z';
  const defs = [
    lin(id('dusk'), 0, 0, 0, 1, [[0, '#f0a07a', 0], [0.5, '#e88a7a', 0.35], [1, '#ffb27a', 0.85]]),
    rad(id('winglow'), 0.5, 0.5, 0.5, [[0, LAMP, 0.5], [1, LAMP, 0]]),
  ];
  return compactSvg(doc(`Ramadan · back: the last warm light of sunset low on the horizon (below the copy zone); a town of flat roofs with lit windows, two slender minarets and a dome; the upper sky stays open for the effect's moon and stars`, defs, [
    C('the last light of sunset, low'),
    path('M-20 440H1620V660H-20Z', { fill: url('dusk') }),
    C('the town: flat roofs, a dome and two minarets'),
    path(roofs + mosque, { fill: night('#2a4a5a', 0.15) }),
    path(balconies, { fill: night('#3a6a7a', 0.1) }),
    path('M1416 398a4 4 0 1 0 8 0a4 4 0 1 0 -8 0zM1521 282a4 4 0 1 0 0.1 0zM188 306a4 4 0 1 0 0.1 0z', { fill: '#ffd166' }),
    path(wins, { fill: LAMP, opacity: 0.85 }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('floor'), 0, 0, 0, 1, [[0, '#c8b8a8'], [1, '#a89888']]),
    lin(id('wall'), 0, 0, 0, 1, [[0, '#f4ece2'], [1, '#d8ccc0']]),
    rad(id('glow'), 0.5, 0.5, 0.5, [[0, '#ffd98a', 0.6], [0.4, '#ffcf6a', 0.25], [1, '#ffcf6a', 0]]),
    rad(id('pool'), 0.5, 0.5, 0.5, [[0, LAMP, 0.45], [1, LAMP, 0]]),
    lin(id('wood'), 0, 0, 0, 1, [[0, '#8a5a3a'], [1, '#5a3a22']]),
    lin(id('rug'), 0, 0, 1, 0, [[0, '#a8243a'], [0.5, '#c83a4a'], [1, '#a8243a']]),
  ];

  // ---- the rooftop floor, the rug, the warm pool of light
  out.push(C('our rooftop: a tiled floor, a patterned rug, a warm pool of lantern light'));
  out.push(path(`M-20 ${ROOF}H1620V920H-20Z`, { fill: url('floor') }));
  {
    let tiles = '';
    for (let y = ROOF + 18; y < 920; y += 26 + (y - ROOF) * 0.1) tiles += `M-20 ${f(y)}H1620`;
    for (let x = -40; x < 1660; x += 80) tiles += `M${x} ${ROOF}L${f(800 + (x - 800) * 1.5)} 920`;
    out.push(line(tiles, '#b8a898', 1.6, { opacity: 0.7 }));
  }
  out.push(ellipse(790, 810, 460, 70, { fill: url('pool') }));
  out.push(path('M400 870L460 760H1120L1180 870Z', { fill: url('rug') }), path('M418 860L470 770H1110L1162 860Z', { fill: 'none', stroke: '#ffcf6a', 'stroke-width': 4, 'stroke-dasharray': '10 6' }));
  {
    let fringe = '';
    for (let x = 404; x < 1180; x += 10) fringe += `M${x} 870v10`;
    out.push(line(fringe, '#f4e0c0', 2.4));
  }

  // ---- the neighbors' rooftop on the left, lower, across a gap
  out.push(C('the neighbors\' rooftop on the left: a parapet, a potted palm, a water tank; the neighbor boy passes over a plate of qatayef'));
  out.push(path(`M-20 ${ROOF}V640H330V${ROOF}Z`, { fill: url('wall') }), path('M-20 640H330', { fill: 'none', stroke: '#c8b8a8', 'stroke-width': 4 }));
  { let cren = ''; for (let x = -20; x < 330; x += 34) cren += `M${x} 640v-14h20v14z`; out.push(path(cren, { fill: '#f4ece2' })); }
  out.push(path('M40 640v-70h80v70z', { fill: '#5a7a8a' }), path('M34 572h92v-10h-92z', { fill: '#4a6a7a' }), path('M60 562v-12h40v12z', { fill: '#4a6a7a' }));
  out.push(path('M196 640l6 -40h40l6 40z', { fill: '#c8643a' }), path('M222 602c-30 -20 -50 -10 -60 6c20 -10 40 -8 60 -6zM222 602c-10 -36 6 -56 22 -60c-14 14 -18 34 -22 60zM222 602c30 -26 56 -20 66 -4c-22 -8 -44 -4 -66 4zM222 602c-24 -40 -52 -40 -66 -28c22 2 44 12 66 28z', { fill: '#2a8a5a' }));
  {
    const nx = 300, nf = 640;
    const pass = { sx: 1, elbow: [1.2, -0.2], hand: [2.4, -0.8] };
    const nb = figure({ x: nx, foot: nf, H: 84, heads: 2.7, skin: SKIN.tan, hair: '#1a1210', style: 'short', top: '#2a8a6a', bottom: '#f4f0e8', gaze: 0.6, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, pass] });
    out.push(nb.svg);
    out.push(path(`M${P(nx - nb.r * 0.98, nb.headY - nb.r * 0.36)}C${P(nx - nb.r, nb.headY - nb.r * 1.25)} ${P(nx + nb.r, nb.headY - nb.r * 1.25)} ${P(nx + nb.r * 0.98, nb.headY - nb.r * 0.36)}Z`, { fill: '#ffffff' }));
    const h = nb.hand(pass);
    out.push(ellipse(h[0] + 10, h[1] - 6, 30, 7, { fill: '#e8e0f0' }), path(`M${P(h[0] - 10, h[1] - 10)}q6 -12 14 0zM${P(h[0] + 4, h[1] - 10)}q6 -12 14 0zM${P(h[0] + 18, h[1] - 10)}q6 -12 14 0z`, { fill: '#e8a860' }), circle(h[0], h[1], nb.r * 0.36, { fill: SKIN.tan }));
    ppl.qatayef = [h[0] + 10, h[1] - 12];
    // a cat on the parapet
    out.push(G({ transform: 'translate(150 626)' }, path('M-14 0c-2-16 4-24 14-24c10 0 14 8 14 24z', { fill: '#3a3a44' }), circle(0, -28, 9, { fill: '#3a3a44' }), path('M-7 -34l-1 -8l6 5zM7 -34l1 -8l-6 5z', { fill: '#3a3a44' }), path('M14 -2q16 -2 14 -16', { fill: 'none', stroke: '#3a3a44', 'stroke-width': 4, 'stroke-linecap': 'round' }), circle(-3, -29, 1.6, { fill: '#c8e86a' }), circle(3, -29, 1.6, { fill: '#c8e86a' })));
    ppl.cat = [150, 604];
  }

  // ---- strings of fanous lanterns over our rooftop
  out.push(C('strings of fanous lanterns across our rooftop, glowing'));
  out.push(line('M360 470Q600 540 840 486Q1060 444 1300 500', '#2a2a3a', 2));
  {
    const glass = ['#ff8a5a', '#ffd23a', '#5ad8b8', '#ff6a9a', '#8ab8ff'];
    const at = (t) => { const a = [360, 470], m = [600, 540], b = [840, 486]; const a2 = [840, 486], m2 = [1060, 444], b2 = [1300, 500]; const [p0, p1, p2, u] = t < 0.5 ? [a, m, b, t * 2] : [a2, m2, b2, (t - 0.5) * 2]; return [(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0], (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1]]; };
    for (let k = 1; k < 10; k++) { const [x, y] = at(k / 10); const drop = 14 + (k % 3) * 18; out.push(line(`M${P(x, y)}v${drop}`, '#2a2a3a', 1.6), fanous(x, y + drop, 44 + (k % 2) * 10, glass[k % 5])); }
    ppl.lanterns = at(0.5);
  }
  // our rooftop's back parapet behind the family, with a lattice screen
  out.push(path(`M330 ${ROOF}V672H1300V${ROOF}Z`, { fill: url('wall') }));
  {
    let lat = '';
    for (let x = 360; x < 1290; x += 40) lat += `M${x} 684l20 20l-20 20l-20 -20z`;
    out.push(path(lat, { fill: 'none', stroke: '#c8b0a0', 'stroke-width': 2.4 }));
  }

  // ---- the family round the low table
  out.push(C('the family round the low table: grandma offers the dates, dad pours water, mum in a blue hijab, two children, one breaking the fast with a date'));
  {
    const seat = 800;
    const sitter = (x, opts) => figure({ x, foot: seat, H: opts.H ?? 108, heads: opts.heads ?? 3.1, skin: opts.skin, hair: opts.hair, style: opts.style ?? 'short', top: opts.top, bottom: opts.top, gaze: opts.gaze ?? 0, mouth: opts.mouth ?? 'smile', arms: opts.arms });
    const offer = { sx: 1, elbow: [0.9, 0.6], hand: [1.6, 0.9] };
    const gran = sitter(560, { skin: SKIN.fair, hair: '#e6e2ee', style: 'bun', top: '#5a3a8a', gaze: 0.4, arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.2, 1.6] }, offer] });
    out.push(gran.svg, hijab(gran, 560, '#e8e0f4'));
    const pour = { sx: -1, elbow: [-0.8, 0.6], hand: [-1.4, 0.9] };
    const dad = sitter(706, { H: 118, skin: SKIN.brown, hair: '#1a1210', top: '#f4f0e8', gaze: 0.1, arms: [pour, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.6] }] });
    out.push(dad.svg, path(`M${P(706 - dad.r * 0.98, dad.headY - dad.r * 0.36)}C${P(706 - dad.r, dad.headY - dad.r * 1.25)} ${P(706 + dad.r, dad.headY - dad.r * 1.25)} ${P(706 + dad.r * 0.98, dad.headY - dad.r * 0.36)}Z`, { fill: '#ffffff' }));
    out.push(path(`M${P(706 - dad.r * 0.7, dad.headY + dad.r * 0.3)}Q${P(706, dad.headY + dad.r * 1.4)} ${P(706 + dad.r * 0.7, dad.headY + dad.r * 0.3)}Q${P(706, dad.headY + dad.r * 0.8)} ${P(706 - dad.r * 0.7, dad.headY + dad.r * 0.3)}Z`, { fill: '#1a1210' }));
    const date = { sx: 1, elbow: [0.8, -0.3], hand: [0.6, -1.0] };
    const kid1 = sitter(830, { H: 84, heads: 2.7, skin: SKIN.brown, hair: '#1a1210', style: 'curls', top: '#ffb800', gaze: 0, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.3, 1.6] }, date] });
    out.push(kid1.svg);
    const dh = kid1.hand(date);
    out.push(ellipse(dh[0], dh[1] - 8, 5, 8, { fill: '#6a2a1a' }), circle(dh[0], dh[1], kid1.r * 0.36, { fill: SKIN.brown }));
    ppl.date = [dh[0], dh[1] - 8];
    const mum = sitter(950, { H: 112, skin: SKIN.tan, hair: '#1a1210', top: '#2a6aa8', gaze: -0.2, arms: [{ sx: -1, elbow: [-0.7, 0.7], hand: [-1.2, 1.0] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.6] }] });
    out.push(mum.svg, hijab(mum, 950, '#3a8ad8'));
    const kid2 = sitter(1062, { H: 80, heads: 2.6, skin: SKIN.tan, hair: '#3a2214', style: 'bob', top: '#ff6a9a', gaze: -0.4, mouth: 'open', arms: [{ sx: -1, elbow: [-0.7, 0.4], hand: [-1.2, 0.6] }, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.6] }] });
    out.push(kid2.svg);
    // grandma's plate of dates, dad's jug
    const oh = gran.hand(offer);
    out.push(ellipse(oh[0] + 14, oh[1] - 4, 28, 7, { fill: '#c8a060' }), path(circD(oh[0] + 2, oh[1] - 10, 5) + circD(oh[0] + 14, oh[1] - 12, 5) + circD(oh[0] + 26, oh[1] - 10, 5), { fill: '#6a2a1a' }), circle(oh[0], oh[1], gran.r * 0.34, { fill: SKIN.fair }));
    ppl.dates = [oh[0] + 14, oh[1] - 8];
    const ph = dad.hand(pour);
    out.push(path(`M${P(ph[0] - 4, ph[1] - 30)}c-14 0 -16 20 -10 30h22c6 -10 4 -30 -12 -30zM${P(ph[0] - 2, ph[1] - 30)}l-4 -8h10z`, { fill: '#c8901e' }), circle(ph[0], ph[1], dad.r * 0.34, { fill: SKIN.brown }));
  }
  // the low table and the iftar spread
  {
    const T = TABLE;
    out.push(path(`M${T.x0} ${T.top}H${T.x1}v${T.h}H${T.x0}Z`, { fill: url('wood') }), path(`M${T.x0 + 10} ${T.top + T.h}v16h14v-16zM${T.x1 - 24} ${T.top + T.h}v16h14v-16z`, { fill: '#4a2a18' }));
    out.push(path(`M${T.x0 - 6} ${T.top}H${T.x1 + 6}v-6H${T.x0 - 6}Z`, { fill: '#f4ece2' }));
    const dish = (x, w, col, top = '') => ellipse(x, T.top - 8, w, w * 0.26, { fill: '#ffffff' }) + ellipse(x, T.top - 9, w * 0.8, w * 0.18, { fill: col }) + top;
    out.push(dish(540, 40, '#e8a040', path('M520 766q20 -8 40 0', { fill: 'none', stroke: '#ffd890', 'stroke-width': 3, opacity: 0.8 })));                              // lentil soup
    out.push(dish(640, 44, '#6a2a1a', path(circD(626, 762, 6) + circD(640, 760, 6) + circD(654, 762, 6) + circD(633, 756, 5) + circD(647, 755, 5), { fill: '#7a3a22' })));      // dates
    out.push(path('M760 770v-34q0 -8 8 -8h12q8 0 8 8v34z', { fill: '#a8d8f0', opacity: 0.85 }), path('M790 742q12 2 10 14q-2 8 -10 8', { fill: 'none', stroke: '#a8d8f0', 'stroke-width': 4 }));                           // water jug
    out.push(path('M814 770v-18h12v18zM834 770v-18h12v18z', { fill: '#cfeaff', opacity: 0.9 }));
    out.push(dish(900, 48, '#e8c070', path('M874 764l14 -12l14 12zM896 764l14 -12l14 12z', { fill: '#d89a40' })));                                                         // samosas
    out.push(dish(1010, 42, '#f0d8a0', ellipse(1010, 762, 26, 6, { fill: '#e8c088' })));                                                                                      // flatbread
    out.push(dish(1080, 30, '#e83a4a', path(circD(1070, 762, 6) + circD(1084, 760, 6), { fill: '#ffb83a' })));                                                                // fruit
    ppl.table = [790, T.top - 14];
  }

  // ---- the children with lanterns and a telescope on the right
  out.push(C('two children on the right with little lanterns, aiming a telescope at the sky to look for the moon'));
  {
    const tx = 1330, tf = 852;
    out.push(line(`M${tx - 36} ${tf}L${tx} ${tf - 70}L${tx + 36} ${tf}M${tx} ${tf - 70}V${tf}`, '#3a3a4a', 4));
    out.push(G({ transform: `translate(${tx} ${tf - 74}) rotate(-34)` }, path('M-40 -10h96v20h-96z', { fill: '#2a6aa8' }), path('M56 -13h14v26h-14z', { fill: '#1a4a7a' }), path('M-48 -7h10v14h-10z', { fill: '#1a1a2a' }), path('M-30 -10h6v20h-6zM20 -10h6v20h-6z', { fill: '#ffd166' })));
    ppl.telescope = [tx + 30, tf - 110];
    const look = { sx: -1, elbow: [-0.7, -0.2], hand: [-1.2, -0.6] };
    const g = figure({ x: 1262, foot: 856, H: 82, heads: 2.7, skin: SKIN.light, hair: '#3a2214', style: 'bun', top: '#8a5ad8', bottom: '#2a3a6a', shoe: '#ffd23a', gaze: 0.5, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, { sx: 1, elbow: [0.9, -0.2], hand: [1.4, -0.9] }] });
    out.push(g.svg);
    const lx = 1440, lf = 856;
    const hold = { sx: -1, elbow: [-0.9, 0.2], hand: [-1.5, 0.4] };
    const b = figure({ x: lx, foot: lf, H: 78, heads: 2.7, skin: SKIN.deep, hair: '#1a1210', style: 'short', top: '#3ab86a', bottom: '#2a3a6a', shoe: '#e8343a', gaze: -0.4, mouth: 'smile', arms: [hold, { sx: 1, elbow: [0.6, 1.0], hand: [0.4, 1.9] }] });
    out.push(b.svg);
    const bh = b.hand(hold);
    out.push(line(`M${P(...bh)}v10`, '#2a2a3a', 1.6), fanous(bh[0], bh[1] + 8, 40, '#ffd23a'), circle(bh[0], bh[1], b.r * 0.36, { fill: SKIN.deep }));
    ppl.lantern = [bh[0], bh[1] + 30];
  }

  return { svg: compactSvg(doc(`Ramadan · mid. Concept: "iftar on the rooftop": the sun has just set and the fast is over. Focal point: the family round a low table (x 470–1110, y 640–810) spread with dates, water, lentil soup, samosas, flatbread and fruit — grandma in a lilac hijab offers the dates, dad pours water, a child breaks the fast with a date, mum in a blue hijab, a little girl — under strings of glowing fanous lanterns. On the neighbors' lower rooftop on the left a boy passes over a plate of qatayef and a cat sits on the parapet; on the right two children with a little lantern aim a telescope at the sky to look for the moon. Light story: lantern-gold from above and the last warm light of sunset on the horizon; the upper sky is left open for the effect's moon and stars.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Ramadan · front: cushions and a brass lantern bottom left, a potted plant bottom right; the center stays open`, [
    rad(id('fglow'), 0.5, 0.5, 0.5, [[0, '#ffd98a', 0.55], [1, '#ffd98a', 0]]),
  ], [
    C('floor cushions and a brass lantern'),
    path('M-20 900V842q60 -20 130 -4q24 10 20 62z', { fill: '#2a6aa8' }), path('M60 900v-44q50 -14 100 0q14 10 10 44z', { fill: '#e8a020' }),
    circle(196, 856, 60, { fill: url('fglow') }), path('M180 900v-44h32v44zM176 856h40l-8 -12h-24z', { fill: '#c8901e' }), path('M184 896v-36h24v36z', { fill: '#ffe08a' }),
    C('a potted plant'),
    path('M1520 900l8 -52h84l8 52z', { fill: '#c8643a' }), path(circD(1546, 830, 24) + circD(1584, 820, 28) + circD(1616, 836, 22), { fill: '#2a7a4a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'wish', x: r(ppl.telescope[0]), y: r(ppl.telescope[1]), r: 44, label: 'Look for the new moon' },
      { activity: 'color', x: r(ppl.lanterns[0]), y: r(ppl.lanterns[1] + 50), r: 50, label: 'Color a fanous lantern' },
      { activity: 'card', x: r(ppl.qatayef[0]), y: r(ppl.qatayef[1]), r: 36, label: 'Make a Ramadan card for the neighbors' },
      { activity: 'memory', x: ppl.table[0], y: ppl.table[1], r: 56, label: 'Match the iftar treats' },
    ],
    findables: [
      { id: 'cat', label: 'a cat on the wall', x: ppl.cat[0], y: ppl.cat[1], r: 18 },
      { id: 'date', label: 'a date for breaking the fast', x: r(ppl.date[0]), y: r(ppl.date[1]), r: 14 },
      { id: 'plate', label: 'grandma\'s plate of dates', x: r(ppl.dates[0]), y: r(ppl.dates[1]), r: 20 },
      { id: 'lantern', label: 'a little yellow lantern', x: r(ppl.lantern[0]), y: r(ppl.lantern[1]), r: 20 },
      { id: 'jug', label: 'a jug of water', x: 776, y: 750, r: 18 },
      { id: 'palm', label: 'a potted palm', x: 222, y: 604, r: 24 },
      { id: 'samosas', label: 'a plate of samosas', x: 900, y: 762, r: 20 },
    ],
  };
}
