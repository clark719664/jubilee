// St Nicholas Day — "Boots on the doorstep": a snowy old-town street of stepped-gable houses on the eve of
// 6 December. Three children's boots wait on a doorstep, stuffed with oranges, chocolate coins and a carrot for
// the horse; two children peek from the lit window above; St Nicholas, in his red cloak and mitre with a golden
// crook, waves up at them, his white horse beside him. The snowfall is the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, rect, use, lin, rad, doc, compactSvg, setPrecision, blanket } from '../../gen-xmas/lib.mjs';
import { head } from '../../gen-kw/people.mjs';
import { line, circD, ellD } from '../../kit/scenekit.mjs';

const ID = 'st-nicholas-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const NIGHT = '#0c2a22';
const night = (c, k = 0.24) => mix(c, NIGHT, k);
const SNOW = '#eef6f8', SNOW_SH = '#c4d8e4';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440' };

// ---- layout
const BASE = 800;                      // where the house fronts meet the pavement
const KERB = 822;                      // pavement edge; the snowy street below
/** Stepped-gable houses: x0, x1, wall top (eave), step count, step height, wall color, trim, door x or null. */
const HOUSES = [
  { x0: -24, x1: 252, top: 392, steps: 4, sh: 34, wall: '#9a3a2a', trim: '#f0e6d2', door: 120 },
  { x0: 252, x1: 604, top: 520, steps: 3, sh: 28, wall: '#d8c49a', trim: '#ffffff', door: 330 },
  { x0: 604, x1: 996, top: 528, steps: 3, sh: 30, wall: '#4a6e8e', trim: '#f4efe4', door: 800, focal: true },
  { x0: 996, x1: 1304, top: 522, steps: 3, sh: 27, wall: '#c8902a', trim: '#fff6e0', door: null },
  { x0: 1304, x1: 1624, top: 372, steps: 4, sh: 34, wall: '#8a4a5a', trim: '#f0e6d2', door: 1470 },
];
const DOOR = { x: 800, w: 76, top: 664, step: 786 };
const BOOTS = [{ x: 756, s: 0.9, col: '#b84a2a' }, { x: 802, s: 1.08, col: '#6a3a22' }, { x: 848, s: 0.84, col: '#2a5a8a' }];
const NICK = { x: 990, foot: 838 };
const HORSE = { x: 1206, foot: 846 };

/** The stepped outline of a gable: from the left wall top, up the steps to the ridge, and down again. */
function stepPts(h) {
  const { x0, x1, top, steps, sh } = h;
  const w = x1 - x0, mid = (x0 + x1) / 2, crown = w * 0.2;       // the flat top is a fifth of the width
  const run = (w / 2 - crown / 2) / steps;
  const pts = [[x0, top]];
  for (let i = 0; i < steps; i++) { const x = x0 + run * (i + 1) - run * 0.5; pts.push([x, top - sh * i], [x, top - sh * (i + 1)]); }
  pts.push([mid - crown / 2, top - sh * steps], [mid + crown / 2, top - sh * steps]);
  for (let i = steps - 1; i >= 0; i--) { const x = x1 - run * (i + 1) + run * 0.5; pts.push([x, top - sh * (i + 1)], [x, top - sh * i]); }
  pts.push([x1, top]);
  return pts;
}
/** The flat ledges of a stepped gable (where snow settles). */
function ledges(h) {
  const p = stepPts(h);
  const out = [];
  for (let i = 1; i < p.length; i++) if (p[i][1] === p[i - 1][1] && p[i][0] > p[i - 1][0]) out.push([p[i - 1][0], p[i][0], p[i][1]]);
  return out;
}

// ============================== back ==============================
export function back() {
  setPrecision(1);
  // a far row of gables and a church tower peeping over the low houses in the middle
  let d = '';
  const R = rng(3);
  for (let x = 240; x < 1380; x += 86 + R() * 40) {
    const w = 70 + R() * 50, top = 470 + R() * 40;
    d += `M${P(x, 640)}V${f(top)}L${P(x + w / 2, top - 36 - R() * 14)}L${P(x + w, top)}V640Z`;
  }
  // stars and a crescent moon only where the copy zone (x 300–1300, y < 430) isn't
  const R3 = rng(21);
  let stars = '', twinkles = '';
  for (let i = 0; i < 26; i++) {
    const left = i % 2 === 0, x = left ? 20 + R3() * 250 : 1330 + R3() * 250, y = 24 + R3() * (left ? 190 : 170);
    if (!left && Math.hypot(x - 1470, y - 96) < 60) continue;
    if (i % 5 === 0) twinkles += `M${P(x, y - 7)}q1 6 7 7q-6 1-7 7q-1-6-7-7q6-1 7-7Z`;
    else stars += circD(x, y, 1.2 + R3() * 1.4);
  }
  const defs = [rad(id('moonglow'), 0.5, 0.5, 0.5, [[0, '#fff6d8', 0.4], [1, '#fff6d8', 0]])];
  const R2 = rng(8);
  let wins = '';
  for (let i = 0; i < 9; i++) { const x = 300 + R2() * 1000, y = 500 + R2() * 60; wins += `M${P(x, y)}h9v12h-9Z`; }
  return compactSvg(doc(`St Nicholas Day · back: stars and a crescent moon in the corners, a far row of gabled roofs with a few lit windows, low snowy hills; tinted toward the night-green sky`, defs, [
    C('low snowy hills'),
    path('M-20 650Q320 600 700 624T1620 610V700H-20Z', { fill: '#2a6a58' }),
    C('stars and a crescent moon, kept to the corners'),
    path(stars, { fill: '#fff6d8', opacity: 0.85 }), path(twinkles, { fill: '#fff6d8' }),
    circle(1470, 96, 70, { fill: url('moonglow') }),
    path('M1494 60A42 42 0 1 0 1494 132A34 34 0 1 1 1494 60Z', { fill: '#fff3c8' }),
    C('far gables'),
    path(d, { fill: '#1e5242' }),
    path(wins, { fill: '#ffd98a', opacity: 0.75 }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    rad(id('win'), 0.5, 0.62, 0.75, [[0, '#fff3cf'], [0.45, '#ffd98a'], [1, '#f0a84a']]),
    rad(id('halo'), 0.5, 0.5, 0.5, [[0, '#ffe9a3', 0.42], [0.4, '#ffe9a3', 0.16], [1, '#ffe9a3', 0]]),
    rad(id('lamp'), 0.5, 0.5, 0.5, [[0, '#fff3c4', 0.85], [0.3, '#ffd98a', 0.4], [1, '#ffd98a', 0]]),
    lin(id('street'), 0, 0, 0, 1, [[0, '#dce8ee'], [1, '#b8cad6']]),
    lin(id('robe'), 0, 0, 1, 0, [[0, '#e8343a'], [1, '#a8101e']]),
    lin(id('gold'), 0, 0, 0, 1, [[0, '#ffe08a'], [1, '#d8a020']]),
    lin(id('horse'), 0, 0, 0, 1, [[0, '#ffffff'], [1, '#d8dde6']]),
  ];
  // shared window symbols: lit glass, a cross bar, a stone frame, shutters; recolored by currentColor (the trim)
  const SYM = new Map();
  const win = (x, y, w, h, trim, shutter) => {
    const key = `w${w}x${h}${shutter ? 's' : ''}`;
    if (!SYM.has(key)) {
      SYM.set(key, E('g', { id: id(key) },
        ellipse(w / 2, h * 0.55, w * 1.4, h * 0.9, { fill: url('halo') }),
        shutter ? path(`M-${f(w * 0.42)} 0h${f(w * 0.4)}v${f(h)}h-${f(w * 0.4)}ZM${f(w + 2)} 0h${f(w * 0.4)}v${f(h)}h-${f(w * 0.4)}Z`, { fill: '#2f6a4a' }) : '',
        shutter ? path(`M-${f(w * 0.3)} ${f(h * 0.25)}h${f(w * 0.16)}M-${f(w * 0.3)} ${f(h * 0.5)}h${f(w * 0.16)}M-${f(w * 0.3)} ${f(h * 0.75)}h${f(w * 0.16)}M${f(w + 2 + w * 0.12)} ${f(h * 0.25)}h${f(w * 0.16)}M${f(w + 2 + w * 0.12)} ${f(h * 0.5)}h${f(w * 0.16)}M${f(w + 2 + w * 0.12)} ${f(h * 0.75)}h${f(w * 0.16)}`, { fill: 'none', stroke: '#1f4a34', 'stroke-width': 2.5 }) : '',
        rect(0, 0, w, h, { rx: 3, fill: url('win') }),
        path(`M${f(w / 2)} 2V${f(h - 2)}M2 ${f(h * 0.45)}H${f(w - 2)}`, { fill: 'none', stroke: 'currentColor', 'stroke-width': 3 }),
        rect(0, 0, w, h, { rx: 3, fill: 'none', stroke: 'currentColor', 'stroke-width': 4 }),
        rect(-4, h, w + 8, 6, { rx: 2, fill: 'currentColor' }),
        path(`M-2 ${f(h + 1)}q${f(w / 2 + 2)} -8 ${f(w + 4)} 0v-3h${f(-(w + 4))}Z`, { fill: SNOW }),
      ));
    }
    return use(id(key), { x: f(x), y: f(y), color: trim });
  };

  // ---- the pavement and street
  out.push(C('the snowy street and pavement; hoofprints and bootprints lead in from the right'));
  out.push(path(`M-20 ${BASE}H1620V920H-20Z`, { fill: url('street') }));
  out.push(path(`M-20 ${KERB}H1620v8H-20Z`, { fill: SNOW_SH }));
  // pools of light from the windows and the lamp on the snow
  out.push(ellipse(DOOR.x, 830, 260, 40, { fill: url('halo') }), ellipse(560, 830, 140, 30, { fill: url('lamp'), opacity: 0.6 }));
  // hoofprints (horseshoes) and St Nicholas's bootprints, evenly spaced
  {
    let hoof = '', boot = '';
    for (let i = 0; i < 6; i++) { const x = HORSE.x + 110 + i * 62, y = 868 + (i % 2) * 14; hoof += `M${P(x - 7, y + 4)}a7 6 0 1 1 14 0h-4a3 3 0 1 0-6 0z`; }
    for (let i = 0; i < 5; i++) { const x = NICK.x + 60 + i * 44, y = 850 + (i % 2) * 12; boot += `M${P(x - 6, y)}q0-6 6-6h6q5 0 5 5t-5 5h-6q-6 0-6-4zm-4 0q-4 0-4-3t4-3z`; }
    out.push(path(hoof, { fill: '#9fb4c4' }), path(boot, { fill: '#a8bccb' }));
  }

  // ---- the houses
  out.push(C('the houses: stepped gables with stone coping, lit windows with shutters, snow on every step'));
  const Rr = rng(5);
  for (const h of HOUSES) {
    const pts = stepPts(h);
    const wall = night(h.wall, 0.22);
    const facade = `M${P(h.x0, BASE)}` + pts.map((p) => `L${P(...p)}`).join('') + `L${P(h.x1, BASE)}Z`;
    out.push(path(facade, { fill: wall }));
    // a lit edge on the side facing the focal door, a shadow on the other
    out.push(path(`M${P(h.x0, BASE)}V${f(h.top)}h10V${BASE}Z`, { fill: '#000', opacity: 0.16 }));
    // stone coping along the steps
    out.push(path(pts.map((p, i) => `${i ? 'L' : 'M'}${P(p[0], p[1] - 3)}`).join(''), { fill: 'none', stroke: h.trim, 'stroke-width': 7, 'stroke-linejoin': 'miter' }));
    // snow on every ledge, cool white, with a soft rounded top
    for (const [a, b, y] of ledges(h)) out.push(path(`M${P(a - 3, y - 4)}q${f((b - a) / 2 + 3)} -${f(8 + Rr() * 3)} ${f(b - a + 6)} 0v4h${f(-(b - a + 6))}Z`, { fill: SNOW }));
    // a band at each floor
    const floors = h.top < 450 ? [h.top + 130, h.top + 260] : [h.top + 120];
    for (const y of floors) out.push(path(`M${P(h.x0, y)}H${f(h.x1)}v6H${f(h.x0)}Z`, { fill: h.trim, opacity: 0.7 }));
    // a round attic window in the gable
    const mid = (h.x0 + h.x1) / 2;
    out.push(circle(mid, h.top - h.sh * (h.steps - 1) + 4, 13, { fill: url('win') }), circle(mid, h.top - h.sh * (h.steps - 1) + 4, 13, { fill: 'none', stroke: h.trim, 'stroke-width': 4 }));
    // windows (the focal house's middle window above the door is drawn separately, with the children in it)
    const cols = Math.max(2, Math.round((h.x1 - h.x0) / 130));
    const rows = h.top < 450 ? [h.top + 40, h.top + 170, h.top + 300] : [h.top + 22, h.top + 150];
    for (const [ri, y] of rows.entries()) for (let c = 0; c < cols; c++) {
      const x = h.x0 + ((c + 0.5) * (h.x1 - h.x0)) / cols - 26;
      if (y + 70 > BASE - 6) continue;
      if (h.door !== null && Math.abs(x + 26 - h.door) < 70 && y + 70 > BASE - 150) continue;
      if (h.focal && ri === 0 && Math.abs(x + 26 - DOOR.x) < 70) continue;
      out.push(win(x, y, 52, 68, h.trim, true));
    }
  }

  // ---- the doors of the side houses
  out.push(C('the side doors'));
  for (const h of HOUSES) {
    if (h.door === null || h.focal) continue;
    out.push(path(`M${P(h.door - 30, BASE)}V${BASE - 96}a30 30 0 0 1 60 0V${BASE}Z`, { fill: '#2a3a2a' }), path(`M${P(h.door - 34, BASE)}V${BASE - 96}a34 34 0 0 1 68 0V${BASE}`, { fill: 'none', stroke: h.trim, 'stroke-width': 5 }));
    out.push(circle(h.door + 16, BASE - 46, 3, { fill: '#ffd166' }));
  }

  // ---- the focal door, its wreath, the step and the window above with the children
  out.push(C('the focal door: green, arched, a wreath with a red bow, a stone step'));
  const D = DOOR;
  out.push(ellipse(D.x, D.step + 4, 92, 8, { fill: '#000', opacity: 0.2 }));
  out.push(path(`M${P(D.x - D.w / 2, D.step)}V${D.top + D.w / 2}a${D.w / 2} ${D.w / 2} 0 0 1 ${D.w} 0V${D.step}Z`, { fill: '#1f6a4a' }));
  out.push(path(`M${P(D.x - D.w / 2 - 6, D.step)}V${D.top + D.w / 2}a${D.w / 2 + 6} ${D.w / 2 + 6} 0 0 1 ${D.w + 12} 0V${D.step}`, { fill: 'none', stroke: '#f4efe4', 'stroke-width': 7 }));
  out.push(path(`M${P(D.x - 26, D.step - 8)}V${D.top + 48}h22V${D.step - 8}ZM${P(D.x + 4, D.step - 8)}V${D.top + 48}h22V${D.step - 8}Z`, { fill: 'none', stroke: '#175a3c', 'stroke-width': 3 }));
  out.push(circle(D.x + 22, D.top + 78, 3.4, { fill: '#ffd166' }));
  // the wreath, hung on a nail
  out.push(circle(D.x, D.top + 30, 2.6, { fill: '#5a5a5a' }), circle(D.x, D.top + 46, 17, { fill: 'none', stroke: '#2a7a3a', 'stroke-width': 9 }));
  out.push(path(`M${P(D.x - 3, D.top + 32)}q3 4 6 0`, { fill: 'none', stroke: '#c8102e', 'stroke-width': 3 }));
  { let berries = ''; for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; berries += circD(D.x + Math.cos(a) * 17, D.top + 46 + Math.sin(a) * 17, 2.6); } out.push(path(berries, { fill: '#e8343a' })); }
  out.push(path(`M${P(D.x - 9, D.top + 60)}l9 -4l9 4l-4 10l-5 -6l-5 6z`, { fill: '#c8102e' }));
  // the stone step
  out.push(path(`M${P(D.x - 74, D.step)}h148v14h-148Z`, { fill: '#c8c0b4' }), path(`M${P(D.x - 76, D.step - 3)}q76 -6 152 0v4h-152Z`, { fill: SNOW }));
  // the window above the door, with two children peeking out (clipped to the glass, drawn before the frame)
  const WW = { x: D.x - 44, y: 552, w: 88, h: 74 };
  defs.push(E('clipPath', { id: id('peek') }, rect(WW.x, WW.y, WW.w, WW.h, { rx: 3 })));
  out.push(ellipse(D.x, WW.y + 40, 120, 70, { fill: url('halo') }));
  out.push(rect(WW.x, WW.y, WW.w, WW.h, { rx: 3, fill: url('win') }));
  out.push(G({ 'clip-path': url('peek') },
    head(D.x - 20, WW.y + 52, 15, SKIN.fair, '#e8b84a', 'bob', { gaze: 0.2, mouth: 'open' }),
    head(D.x + 22, WW.y + 56, 14, SKIN.brown, '#1a1210', 'puffs', { gaze: 0.28 }),
    path(`M${P(WW.x, WW.y + WW.h - 8)}h${WW.w}v8h${-WW.w}Z`, { fill: '#8a6a4a' })));
  out.push(path(`M${P(D.x, WW.y + 2)}V${WW.y + WW.h - 2}`, { fill: 'none', stroke: '#f4efe4', 'stroke-width': 3 }));
  out.push(rect(WW.x, WW.y, WW.w, WW.h, { rx: 3, fill: 'none', stroke: '#f4efe4', 'stroke-width': 5 }));
  out.push(path(`M${P(WW.x - 6, WW.y + WW.h)}h${WW.w + 12}v7h${-(WW.w + 12)}Z`, { fill: '#f4efe4' }), path(`M${P(WW.x - 6, WW.y + WW.h + 1)}q${WW.w / 2 + 6} -9 ${WW.w + 12} 0v-3h${-(WW.w + 12)}Z`, { fill: SNOW }));
  ppl.window = [D.x, WW.y + WW.h / 2];

  // ---- the boots on the step, stuffed with treats
  out.push(C('three children\'s boots on the step, stuffed with an orange, chocolate coins, a candy cane and a carrot for the horse'));
  const boot = (b, i) => {
    const { x, s, col } = b;
    const y = D.step;
    const g = [];
    // treats first, so the boot's cuff hides their bottoms
    if (i === 0) g.push(circle(x + 2, y - 54 * s, 11 * s, { fill: '#ff9a1a' }), path(`M${P(x + 2, y - 65 * s)}l3 -5`, { fill: 'none', stroke: '#2a7a3a', 'stroke-width': 2.6 }), line(`M${P(x - 8, y - 46 * s)}V${y - 74 * s}a6 6 0 0 1 12 0`, '#ffffff', 5));
    if (i === 1) g.push(path(`M${P(x - 6, y - 50 * s)}L${P(x + 4, y - 92 * s)}l7 3l-6 40z`, { fill: '#ff8a1a' }), path(`M${P(x + 4, y - 92 * s)}l-6 -12m6 12l4 -14m-4 14l10 -8`, { fill: 'none', stroke: '#2a8a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }), circle(x + 10, y - 54 * s, 8 * s, { fill: '#ffd166' }), circle(x + 10, y - 54 * s, 5 * s, { fill: 'none', stroke: '#c8901e', 'stroke-width': 1.6 }));
    if (i === 2) g.push(circle(x - 4, y - 50 * s, 8 * s, { fill: '#ffd166' }), circle(x + 6, y - 54 * s, 8 * s, { fill: '#ffd166' }), circle(x - 4, y - 50 * s, 5 * s, { fill: 'none', stroke: '#c8901e', 'stroke-width': 1.6 }), circle(x + 6, y - 54 * s, 5 * s, { fill: 'none', stroke: '#c8901e', 'stroke-width': 1.6 }));
    // the boot: shaft and foot, a turned-down cuff, laces
    g.push(path(`M${P(x - 14 * s, y - 48 * s)}V${y - 12 * s}q0 12 12 12h${f(38 * s)}q8 0 8 -8q0 -12 -14 -14l-10 -2V${y - 48 * s}Z`, { fill: col }));
    g.push(path(`M${P(x - 16 * s, y - 52 * s)}h${f(34 * s)}v10h${f(-34 * s)}Z`, { fill: lighten(col, 0.25) }));
    g.push(path(`M${P(x - 14 * s, y)}h${f(58 * s)}`, { fill: 'none', stroke: '#2a1a14', 'stroke-width': 4 }));
    g.push(line(`M${P(x + 2 * s, y - 36 * s)}l8 4M${P(x + 2 * s, y - 28 * s)}l8 4M${P(x + 2 * s, y - 20 * s)}l8 4`, '#fff4e6', 2));
    return g.join('');
  };
  out.push(BOOTS.map(boot).join(''));
  ppl.carrot = [BOOTS[1].x + 4, D.step - 80];
  // a mouse sniffing at the last boot (findable)
  out.push(G({ transform: `translate(${BOOTS[2].x + 60} ${D.step})` },
    ellipse(0, 1, 12, 3, { fill: '#000', opacity: 0.2 }), path('M10 0c0-10-6-14-14-12c-6 2-8 8-6 12z', { fill: '#9a8a8a' }), circle(-8, -10, 4, { fill: '#b8a8a8' }),
    circle(-11, -3, 1.6, { fill: '#2b1a1a' }), circle(-6, -6, 1.3, { fill: '#2b1a4d' }), path('M10 -2q8 0 8 -8', { fill: 'none', stroke: '#9a8a8a', 'stroke-width': 1.8, 'stroke-linecap': 'round' })));
  ppl.mouse = [BOOTS[2].x + 56, D.step - 6];

  // ---- the street lamp with a robin
  out.push(C('a street lamp with snow on its cap and a robin on the arm'));
  const L = { x: 560, top: 610 };
  out.push(ellipse(L.x, BASE + 30, 18, 4, { fill: '#000', opacity: 0.25 }));
  out.push(path(`M${L.x - 4} ${BASE + 30}V${L.top + 30}h8V${BASE + 30}Z`, { fill: '#1f2a2a' }), path(`M${L.x - 10} ${BASE + 30}h20v-10h-20Z`, { fill: '#1f2a2a' }));
  out.push(circle(L.x, L.top + 10, 44, { fill: url('lamp') }));
  out.push(path(`M${L.x - 14} ${L.top + 30}l-4 -30h36l-4 30Z`, { fill: '#fff3c4' }), path(`M${L.x - 20} ${L.top}h40l-8 -12h-24Z`, { fill: '#1f2a2a' }), path(`M${L.x - 16} ${L.top + 30}h32v4h-32Z`, { fill: '#1f2a2a' }));
  out.push(path(`M${L.x - 22} ${L.top - 10}q22 -14 44 0v4h-44Z`, { fill: SNOW }));
  out.push(path(`M${L.x + 4} ${L.top + 52}h34v4h-34Z`, { fill: '#1f2a2a' }));                                    // a little arm
  out.push(G({ transform: `translate(${L.x + 30} ${L.top + 52})` }, path('M-8 0c-4-12 4-18 12-14c6 3 6 10 2 14z', { fill: '#7a5a3a' }), path('M-6 -3c0-6 4-8 8-6c2 3 0 6-4 7z', { fill: '#e8501e' }), circle(-2, -12, 1.4, { fill: '#1a1010' }), path('M-6 -11l-4 1l4 1z', { fill: '#e8a030' }), path('M6 -4l8 -2l-6 6z', { fill: '#5a4028' })));
  ppl.robin = [L.x + 30, L.top + 44];

  // ---- a little snowman on the pavement and a sled against the wall
  out.push(C('a small snowman the children built, and a wooden sled leaning on the wall'));
  const SM = { x: 420, foot: 830 };
  out.push(ellipse(SM.x, SM.foot + 2, 34, 6, { fill: '#000', opacity: 0.18 }), circle(SM.x, SM.foot - 26, 28, { fill: SNOW }), circle(SM.x, SM.foot - 70, 20, { fill: SNOW }));
  out.push(path(`M${P(SM.x - 18, SM.foot - 80)}h36v6h-36z`, { fill: '#1a1a1a' }), path(`M${P(SM.x - 12, SM.foot - 80)}v-18h24v18z`, { fill: '#1a1a1a' }));
  out.push(path(`M${P(SM.x + 2, SM.foot - 68)}l18 4l-18 3z`, { fill: '#ff8a1a' }), circle(SM.x - 7, SM.foot - 74, 2.4, { fill: '#1a1a1a' }), circle(SM.x + 8, SM.foot - 74, 2.4, { fill: '#1a1a1a' }));
  out.push(path(`M${P(SM.x - 20, SM.foot - 52)}q20 8 40 0v8q-20 8-40 0z`, { fill: '#c8102e' }));
  out.push(line(`M${P(SM.x - 24, SM.foot - 34)}L${P(SM.x - 52, SM.foot - 58)}l-4 -12m4 12l-12 -2M${P(SM.x + 24, SM.foot - 34)}L${P(SM.x + 50, SM.foot - 48)}l10 -10m-10 10l12 4`, '#5a3a22', 3.4));
  out.push(circle(SM.x, SM.foot - 34, 3, { fill: '#1a1a1a' }), circle(SM.x, SM.foot - 22, 3, { fill: '#1a1a1a' }));
  ppl.snowman = [SM.x, SM.foot - 50];
  out.push(G({ transform: `translate(222 ${BASE + 4}) rotate(8)` },
    ellipse(0, 0, 40, 5, { fill: '#000', opacity: 0.2 }),
    line('M-26 0V-108q0-16 14-16M26 0V-108q0-16 14-16', '#b8202a', 7),
    line('M-26 -12h52M26 -12', '#8a1620', 4),
    path('M-36 -34h72v15h-72zM-36 -62h72v15h-72zM-36 -90h72v15h-72z', { fill: '#c8864a' }),
    path('M-36 -22h72v3h-72zM-36 -50h72v3h-72zM-36 -78h72v3h-72z', { fill: '#9a5a2a' }),
    path('M-38 -91q38 -8 76 0v4h-76z', { fill: SNOW }),
    line('M-26 -118q26 40 52 0', '#e8d0a0', 3)));
  ppl.sled = [222, BASE - 60];
  // a cat on a windowsill of the cream house (findable) and a paper star in a yellow-house window
  out.push(G({ transform: 'translate(500 640)' }, path('M-12 0c-2-14 4-22 12-22c8 0 12 8 12 22z', { fill: '#2a2a2a' }), circle(0, -26, 8, { fill: '#2a2a2a' }), path('M-6 -32l-1 -7l5 4zM6 -32l1 -7l-5 4z', { fill: '#2a2a2a' }), path('M12 -2q12 0 10 -12', { fill: 'none', stroke: '#2a2a2a', 'stroke-width': 4, 'stroke-linecap': 'round' }), circle(-3, -27, 1.4, { fill: '#c8e86a' }), circle(3, -27, 1.4, { fill: '#c8e86a' })));
  ppl.cat = [500, 618];

  // ---- St Nicholas, waving up at the children
  out.push(C('St Nicholas: a red cloak over a white robe, a tall mitre, a long white beard, a golden crook in one hand, waving with the other'));
  const N = NICK;
  const H = 136, r = 14, hy = N.foot - H + r + 22;             // head center (the mitre adds height above)
  out.push(ellipse(N.x, N.foot + 2, 50, 8, { fill: '#000', opacity: 0.25 }));
  // the crook: drawn first, held in his right hand (gripped: the staff shows above and below the fist)
  const crookX = N.x + 44;
  out.push(path(`M${crookX - 3} ${N.foot}V${hy - 30}h6V${N.foot}Z`, { fill: url('gold') }));
  out.push(path(`M${crookX} ${hy - 30}c0-26 30-30 30-6c0 14-16 16-18 6`, { fill: 'none', stroke: url('gold'), 'stroke-width': 7, 'stroke-linecap': 'round' }));
  // white robe hem under the cloak, then the cloak
  out.push(path(`M${P(N.x - 34, N.foot - 4)}h68v-26h-68Z`, { fill: '#f4f4f0' }));
  out.push(path(`M${P(N.x - 16, hy + 20)}C${P(N.x - 30, hy + 60)} ${P(N.x - 46, N.foot - 40)} ${P(N.x - 50, N.foot - 8)}H${f(N.x - 8)}L${P(N.x, hy + 40)}L${P(N.x + 8, N.foot - 8)}H${f(N.x + 50)}C${P(N.x + 46, N.foot - 40)} ${P(N.x + 30, hy + 60)} ${P(N.x + 16, hy + 20)}Z`, { fill: url('robe') }));
  out.push(path(`M${P(N.x - 8, N.foot - 8)}L${P(N.x, hy + 40)}L${P(N.x + 8, N.foot - 8)}`, { fill: 'none', stroke: url('gold'), 'stroke-width': 6, 'stroke-linejoin': 'round' }));
  out.push(path(`M${P(N.x - 50, N.foot - 10)}h42M${P(N.x + 8, N.foot - 10)}h42`, { fill: 'none', stroke: url('gold'), 'stroke-width': 5 }));
  // shoes
  out.push(ellipse(N.x - 14, N.foot - 2, 12, 5, { fill: '#3a1a14' }), ellipse(N.x + 14, N.foot - 2, 12, 5, { fill: '#3a1a14' }));
  // right arm down to the crook; left arm raised, waving
  out.push(path(`M${P(N.x + 22, hy + 30)}Q${P(N.x + 40, hy + 60)} ${P(crookX, hy + 76)}`, { fill: 'none', stroke: '#c8162a', 'stroke-width': 13, 'stroke-linecap': 'round' }));
  out.push(circle(crookX, hy + 76, 6.4, { fill: SKIN.fair }));
  out.push(path(`M${P(N.x - 22, hy + 30)}Q${P(N.x - 42, hy + 14)} ${P(N.x - 46, hy - 14)}`, { fill: 'none', stroke: '#c8162a', 'stroke-width': 13, 'stroke-linecap': 'round' }));
  out.push(path(`M${P(N.x - 50, hy - 16)}c-6-10 0-18 6-14l4 6c2-8 8-6 8 0c0 8-6 14-12 14z`, { fill: SKIN.fair }));
  // head, beard and mitre
  out.push(head(N.x, hy, r, SKIN.fair, '#f4f4f0', 'short', { gaze: -0.3, mouth: 'smile' }));
  out.push(path(`M${P(N.x - 13, hy + 2)}C${P(N.x - 18, hy + 30)} ${P(N.x - 8, hy + 46)} ${P(N.x, hy + 50)}C${P(N.x + 8, hy + 46)} ${P(N.x + 18, hy + 30)} ${P(N.x + 13, hy + 2)}Q${P(N.x + 6, hy + 12)} ${P(N.x, hy + 10)}Q${P(N.x - 6, hy + 12)} ${P(N.x - 13, hy + 2)}Z`, { fill: '#f8f8f4' }));
  out.push(path(`M${P(N.x - 10, hy + 7)}q5 -5 10 -1q5 -4 10 1q-5 4 -10 1q-5 3 -10 -1z`, { fill: '#e8e8e0' }));
  out.push(ellipse(N.x - 2, hy + 3, 3, 2.4, { fill: '#e8a07a' }));
  const mt = hy - r * 0.45;                                   // the mitre sits low over the brow (overlaps the head ≥ 10)
  out.push(path(`M${P(N.x - 15, mt)}C${P(N.x - 18, mt - 30)} ${P(N.x - 8, mt - 44)} ${P(N.x, mt - 52)}C${P(N.x + 8, mt - 44)} ${P(N.x + 18, mt - 30)} ${P(N.x + 15, mt)}Z`, { fill: url('robe') }));
  out.push(path(`M${P(N.x - 15, mt)}h30v-6h-30z`, { fill: url('gold') }), path(`M${P(N.x, mt - 6)}V${mt - 48}`, { fill: 'none', stroke: url('gold'), 'stroke-width': 4 }));
  out.push(path(`M${P(N.x - 7, mt - 28)}h14M${P(N.x, mt - 36)}v16`, { fill: 'none', stroke: '#fff3c4', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  ppl.nick = [N.x, hy + 30];

  // ---- the white horse, standing patiently
  out.push(C('St Nicholas\'s white horse with a red saddle cloth, facing him'));
  const Hx = HORSE.x, Hf = HORSE.foot;
  const legs = [[-46, -3], [-30, 4], [36, -2], [52, 5]];
  out.push(ellipse(Hx, Hf + 2, 92, 10, { fill: '#000', opacity: 0.22 }));
  const leg = (x, col, w = 1) => path(`M${P(x - 9 * w, Hf - 88)}C${P(x - 9 * w, Hf - 62)} ${P(x - 6, Hf - 50)} ${P(x - 6, Hf - 42)}q-2 5 0 10L${P(x - 5, Hf - 12)}h11L${P(x + 6, Hf - 32)}q2-5 0-10C${P(x + 6, Hf - 52)} ${P(x + 9 * w, Hf - 62)} ${P(x + 9 * w, Hf - 88)}Z`, { fill: col })
    + path(`M${P(x - 8, Hf - 4)}q-2-12 8-14q10 2 8 14z`, { fill: mix(col, '#ffffff', 0.5) }) + ellipse(x, Hf - 3, 8.5, 4, { fill: '#5a5060' });
  for (const [dx] of legs.slice(1, 3)) out.push(leg(Hx + dx, '#cfd5e0'));
  out.push(path(`M${P(Hx + 60, Hf - 120)}c26 6 32 34 24 60c-4-14-10-30-26-40z`, { fill: '#c8ccd8' }));            // tail
  out.push(path(`M${P(Hx - 66, Hf - 112)}C${P(Hx - 70, Hf - 140)} ${P(Hx - 30, Hf - 150)} ${P(Hx + 10, Hf - 148)}C${P(Hx + 50, Hf - 150)} ${P(Hx + 74, Hf - 134)} ${P(Hx + 70, Hf - 104)}C${P(Hx + 66, Hf - 80)} ${P(Hx + 40, Hf - 76)} ${P(Hx, Hf - 76)}C${P(Hx - 40, Hf - 76)} ${P(Hx - 64, Hf - 86)} ${P(Hx - 66, Hf - 112)}Z`, { fill: url('horse') }));
  out.push(path(`M${P(Hx - 44, Hf - 86)}C${P(Hx - 20, Hf - 80)} ${P(Hx + 24, Hf - 80)} ${P(Hx + 46, Hf - 88)}`, { fill: 'none', stroke: '#c4cad8', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.7 }));  // belly shade
  for (const [dx] of [legs[0], legs[3]]) out.push(leg(Hx + dx, '#eef0f4', 1.1));
  // saddle cloth
  out.push(path(`M${P(Hx - 22, Hf - 146)}q30 -6 56 0l4 48q-32 8 -64 0z`, { fill: '#c8102e' }), path(`M${P(Hx - 22, Hf - 102)}q32 8 64 0`, { fill: 'none', stroke: '#ffd166', 'stroke-width': 4 }));
  // neck and head, reaching toward St Nicholas
  out.push(path(`M${P(Hx - 40, Hf - 140)}C${P(Hx - 60, Hf - 170)} ${P(Hx - 76, Hf - 196)} ${P(Hx - 90, Hf - 210)}L${P(Hx - 112, Hf - 184)}C${P(Hx - 100, Hf - 160)} ${P(Hx - 86, Hf - 128)} ${P(Hx - 66, Hf - 104)}Z`, { fill: url('horse') }));
  out.push(path(`M${P(Hx - 82, Hf - 220)}C${P(Hx - 100, Hf - 228)} ${P(Hx - 126, Hf - 212)} ${P(Hx - 138, Hf - 190)}C${P(Hx - 146, Hf - 176)} ${P(Hx - 142, Hf - 160)} ${P(Hx - 130, Hf - 157)}C${P(Hx - 120, Hf - 154)} ${P(Hx - 110, Hf - 162)} ${P(Hx - 102, Hf - 170)}C${P(Hx - 94, Hf - 178)} ${P(Hx - 86, Hf - 188)} ${P(Hx - 78, Hf - 198)}Z`, { fill: '#ffffff' }));
  out.push(path(`M${P(Hx - 90, Hf - 214)}l-2 -16l10 12z`, { fill: '#e8eaf0' }));                                     // ear
  out.push(path(`M${P(Hx - 86, Hf - 212)}C${P(Hx - 66, Hf - 190)} ${P(Hx - 52, Hf - 166)} ${P(Hx - 40, Hf - 142)}`, { fill: 'none', stroke: '#c8ccd8', 'stroke-width': 10, 'stroke-linecap': 'round' }));   // mane
  out.push(ellipse(Hx - 131, Hf - 170, 10, 9, { fill: '#ebe6ee', transform: `rotate(-30 ${Hx - 131} ${Hf - 170})` }));   // soft muzzle
  out.push(path(`M${P(Hx - 92, Hf - 216)}c-10 -2 -18 6 -16 16c4-6 8-8 14-8z`, { fill: '#c8ccd8' }));                // forelock
  out.push(ellipse(Hx - 108, Hf - 198, 3.2, 3.8, { fill: '#2b1a4d' }), circle(Hx - 109, Hf - 199.5, 1.2, { fill: '#fff' }));
  out.push(ellipse(Hx - 132, Hf - 172, 3, 2, { fill: '#8a7a8a' }));
  out.push(path(`M${P(Hx - 134, Hf - 166)}q6 4 12 2`, { fill: 'none', stroke: '#8a7a8a', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  out.push(path(`M${P(Hx - 112, Hf - 200)}q-10 14 -24 22`, { fill: 'none', stroke: '#c8102e', 'stroke-width': 3 }));    // bridle
  ppl.horse = [Hx, Hf - 110];
  // a chocolate coin dropped in the snow by the horse (findable)
  out.push(circle(Hx - 160, Hf + 18, 8, { fill: '#ffd166' }), circle(Hx - 160, Hf + 18, 5, { fill: 'none', stroke: '#c8901e', 'stroke-width': 1.6 }));
  ppl.coin = [Hx - 160, Hf + 18];

  return { svg: compactSvg(doc(`St Nicholas Day · mid. Concept: an old-town street of stepped-gable houses on the snowy eve of 6 December. Focal point: the green front door (x 620–980, y 550–800) with three children's boots on its step, stuffed with an orange, chocolate coins, a candy cane and a carrot for the horse, and two children peeking from the lit window above it. St Nicholas in his red cloak and mitre waves up at them, his golden crook in his other hand; his white horse stands beside him. A street lamp with a robin, a small snowman and a sled on the left; hoofprints and bootprints lead in from the right. Light story: lamp-gold light from the windows and the street lamp pools on the snow; everything else is cool night. The snowfall is the effect's.`, [...defs, ...SYM.values()], out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  const R = rng(14);
  // snowbanks in both bottom corners with a little fence and a lantern
  const bank = (pts) => blanket(pts, 0, 60, R, 20, 0.2, 0.0);
  return compactSvg(doc(`St Nicholas Day · front: snowbanks with a few fence posts in both bottom corners; the center stays open`, [], [
    C('a snowbank on the left with fence posts'),
    path('M-20 900V842Q60 818 150 832T300 870L320 900Z', { fill: '#ffffff' }),
    path('M-20 900V860Q90 846 200 868T320 900Z', { fill: '#d8e6ee' }),
    path('M30 860v-56h12v56zM100 852v-60h12v60zM170 858v-50h12v50z', { fill: '#4a3424' }),
    path('M24 806q12-10 24 0zM94 794q12-10 24 0zM164 810q12-10 24 0z', { fill: '#ffffff' }),
    C('a snowbank on the right'),
    path('M1620 900V836Q1520 816 1420 834T1270 880L1250 900Z', { fill: '#ffffff' }),
    path('M1620 900V858Q1500 846 1380 868T1250 900Z', { fill: '#d8e6ee' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  return {
    hotspots: [
      { activity: 'doors', x: DOOR.x, y: DOOR.top + 50, r: 36, label: 'Open a countdown door' },
      { activity: 'card', x: BOOTS[1].x, y: DOOR.step - 28, r: 32, label: 'Leave a card in a boot' },
      { activity: 'wish', x: ppl.window[0], y: ppl.window[1], r: 44, label: 'Wave to the children at the window' },
      { activity: 'dressup', x: Math.round(ppl.nick[0]), y: Math.round(ppl.nick[1] + 30), r: 46, label: 'Dress up for St Nicholas Day' },
      { activity: 'color', x: Math.round(ppl.horse[0]), y: Math.round(ppl.horse[1]), r: 64, label: 'Color in the white horse' },
    ],
    findables: [
      { id: 'carrot', label: 'a carrot for the horse in a boot', x: Math.round(ppl.carrot[0]), y: Math.round(ppl.carrot[1]), r: 16 },
      { id: 'mouse', label: 'a mouse sniffing the boots', x: ppl.mouse[0], y: ppl.mouse[1], r: 18 },
      { id: 'robin', label: 'a robin on the lamp post', x: ppl.robin[0], y: ppl.robin[1], r: 18 },
      { id: 'snowman', label: 'a little snowman', x: ppl.snowman[0], y: ppl.snowman[1], r: 32 },
      { id: 'sled', label: 'a sled against the wall', x: ppl.sled[0], y: ppl.sled[1], r: 30 },
      { id: 'window-cat', label: 'a cat on a windowsill', x: ppl.cat[0], y: ppl.cat[1], r: 20 },
      { id: 'coin', label: 'a chocolate coin in the snow', x: ppl.coin[0], y: ppl.coin[1], r: 16 },
    ],
  };
}
