// scenekit.mjs — reusable scene pieces for the tier-2 holidays (1600×900 artboards, ART.md §2–§13).
import { f, P, mix, lighten, darken, rng, E, G, path, circle, ellipse, rect, use, lin, rad, smooth, roundPoly, sagPts } from '../gen-xmas/lib.mjs';

export const circD = (x, y, r) => `M${P(x - r, y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
export const ellD = (x, y, rx, ry) => `M${P(x - rx, y)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;
export const line = (d, stroke, w, a = {}) => path(d, { fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...a });

// ───────────────────────────────────────────── trees

/**
 * A bare (winter or late-autumn) tree as one path of tapered branch quads. `lean` tilts the trunk (radians),
 * `depth` the number of forks. Branches fork into two or three and thin out toward the twigs.
 */
export function bareTree(x, base, h, seed = 1, { lean = 0, depth = 6, spread = 0.46, trunk = 0.11 } = {}) {
  const R = rng(seed);
  let d = '';
  const tips = [];
  const branch = (x0, y0, ang, len, w, k) => {
    const x1 = x0 + Math.sin(ang) * len, y1 = y0 - Math.cos(ang) * len;
    const w1 = Math.max(1.6, w * 0.64);
    const px = Math.cos(ang), py = Math.sin(ang);
    d += `M${P(x0 - px * w / 2, y0 - py * w / 2)}L${P(x1 - px * w1 / 2, y1 - py * w1 / 2)}L${P(x1 + px * w1 / 2, y1 + py * w1 / 2)}L${P(x0 + px * w / 2, y0 + py * w / 2)}Z`;
    if (k >= depth || len < 10) { tips.push([x1, y1]); return; }
    const n = R() < 0.3 && k > 1 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const a = ang + t * spread * 2 + (R() - 0.5) * 0.28;
      branch(x1, y1, a, len * (0.66 + R() * 0.14), w1, k + 1);
    }
  };
  branch(x, base, lean, h * 0.34, h * trunk, 1);
  return { d, tips };
}

/** A conifer silhouette (for back layers): stacked rounded triangles. */
export function pineSil(x, base, h, w) {
  let d = '';
  for (let i = 0; i < 4; i++) {
    const t = i / 4, y = base - h * t * 0.86, hw = w * (1 - t * 0.7) / 2, th = h * 0.36;
    d += `M${P(x - hw, y)}Q${P(x, y + 8)} ${P(x + hw, y)}L${P(x, y - th)}Z`;
  }
  return d + `M${P(x - w * 0.06, base)}h${f(w * 0.12)}v8h${f(-w * 0.12)}Z`;
}

// ───────────────────────────────────────────── fire and light

/** The outline of a flame: `n` tongues between the base corners, rising to `h`. Seeded so layers line up. */
export function flameD(cx, base, w, h, seed = 3, n = 5) {
  const R = rng(seed);
  const pts = [[cx - w / 2, base]];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const mid = 1 - Math.abs(t - 0.5) * 1.5;                    // tallest in the middle
    const peakH = h * (0.45 + 0.55 * mid) * (0.82 + R() * 0.3);
    const px = cx - w / 2 + w * t + (R() - 0.5) * w * 0.05;
    if (i > 0) pts.push([cx - w / 2 + (w * i) / n, base - peakH * 0.38 - R() * h * 0.08]);
    pts.push([px + (R() - 0.5) * 18, base - peakH]);
  }
  pts.push([cx + w / 2, base]);
  // tongues: sharp tips, curvy flanks
  let d = `M${P(...pts[0])}`;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const up = by < ay;
    const c = up ? [ax + (bx - ax) * 0.1, ay + (by - ay) * 0.7] : [ax + (bx - ax) * 0.9, by + (ay - by) * 0.3];
    d += `Q${P(...c)} ${P(bx, by)}`;
  }
  return d + 'Z';
}

/** One licking flame tongue: a teardrop from a base `w` wide rising to a tip `h` up, leaning `lean`. */
export const tongueD = (x, base, w, h, lean = 0) => `M${P(x - w, base)}C${P(x - w, base - h * 0.42)} ${P(x - w * 0.3 + lean * 0.3, base - h * 0.68)} ${P(x + lean, base - h)}C${P(x + w * 0.35 + lean * 0.3, base - h * 0.66)} ${P(x + w, base - h * 0.42)} ${P(x + w, base)}Z`;

/**
 * A bonfire's flames: overlapping teardrop tongues, tallest in the middle, in layers from red-orange to a
 * white-hot core. Returns { back, front }: draw `back` (outer layers) behind the front logs and `front` (the bright
 * inner tongues) over them, so the fire burns among the logs.
 */
export function fire(cx, base, w, h, seed = 3, cols = ['#e8481e', '#ff8a1a', '#ffc83a', '#fff3c4']) {
  const R = rng(seed);
  const n = 7;
  const spec = Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n - 0.5;                       // −0.5 … 0.5
    const k = 1 - Math.abs(t) * 1.25;
    return { x: cx + t * w * 0.82, h: h * (0.42 + 0.58 * k) * (0.88 + R() * 0.2), w: w * 0.23 * (0.85 + R() * 0.3), lean: (R() - 0.5) * 30 + t * 30 };
  });
  const layer = (sc, li) => spec.map((s, i) => (li >= 2 && (i === 0 || i === n - 1)) ? '' : tongueD(cx + (s.x - cx) * (0.9 - li * 0.12), base, s.w * sc, s.h * sc, s.lean * sc)).join('');
  const back = path(layer(1, 0), { fill: cols[0] }) + path(layer(0.8, 1), { fill: cols[1] });
  const front = path(layer(0.58, 2), { fill: cols[2] }) + path(layer(0.32, 3), { fill: cols[3] });
  return { back, front };
}

/** A string of lights between two hooks, bulbs sampled from the same sagging curve. */
export function stringLights(x1, y1, x2, y2, sag, n, cols, { wire = '#2a1a1a', r = 5 } = {}) {
  const pts = sagPts(x1, y1, x2, y2, sag, n + 2).slice(1, -1);
  return line(`M${P(x1, y1)}Q${P((x1 + x2) / 2, (y1 + y2) / 2 + sag * 2)} ${P(x2, y2)}`, wire, 2.5)
    + pts.map(([x, y], i) => circle(x, y + r * 0.6, r * 2.4, { fill: cols[i % cols.length], opacity: 0.18 }) + rect(x - 1.6, y, 3.2, 4, { fill: wire }) + ellipse(x, y + r + 2, r * 0.75, r, { fill: cols[i % cols.length] })).join('');
}

// ───────────────────────────────────────────── clothes

/**
 * A knitted bobble hat for a head at (cx, cy) radius r: a dome over the crown down past the hairline, a ribbed
 * cuff (eyes stay below it) and a pompom on top. Draw after the head.
 */
export function bobbleHat(cx, cy, r, col, cuffCol = '#fff3d6', pomCol = cuffCol, tilt = 0) {
  const t = `rotate(${f(tilt)} ${f(cx)} ${f(cy)})`;
  const cuffY = cy - r * 0.38;
  const dome = `M${P(cx - r * 1.04, cuffY)}C${P(cx - r * 1.06, cy - r * 1.5)} ${P(cx + r * 1.06, cy - r * 1.5)} ${P(cx + r * 1.04, cuffY)}Z`;
  const cuff = `M${P(cx - r * 1.1, cuffY - r * 0.06)}Q${P(cx, cuffY - r * 0.2)} ${P(cx + r * 1.1, cuffY - r * 0.06)}L${P(cx + r * 1.08, cuffY + r * 0.3)}Q${P(cx, cuffY + r * 0.14)} ${P(cx - r * 1.08, cuffY + r * 0.3)}Z`;
  let ribs = '';
  for (let i = -4; i <= 4; i++) ribs += `M${P(cx + i * r * 0.24, cuffY - r * 0.08 + Math.abs(i) * r * 0.012)}v${f(r * 0.3)}`;
  return G({ transform: t },
    path(dome, { fill: col }),
    path(`M${P(cx - r * 0.5, cy - r * 1.1)}Q${P(cx - r * 0.2, cy - r * 1.28)} ${P(cx + r * 0.1, cy - r * 1.24)}`, { fill: 'none', stroke: lighten(col, 0.3), 'stroke-width': f(r * 0.12), 'stroke-linecap': 'round', opacity: 0.7 }),
    path(cuff, { fill: cuffCol }),
    path(ribs, { fill: 'none', stroke: darken(cuffCol, 0.14), 'stroke-width': f(Math.max(1.6, r * 0.06)), 'stroke-linecap': 'round' }),
    circle(cx, cy - r * 1.36, r * 0.34, { fill: pomCol }),
    circle(cx - r * 0.1, cy - r * 1.44, r * 0.12, { fill: '#ffffff', opacity: 0.6 }),
  );
}

/** A scarf wrapped at the neck with one tail hanging. */
export function scarf(cx, y, w, col, side = 1) {
  return path(`M${P(cx - w / 2, y)}q${f(w / 2)} ${f(w * 0.22)} ${f(w)} 0v${f(w * 0.28)}q${f(-w / 2)} ${f(w * 0.2)} ${f(-w)} 0Z`, { fill: col })
    + path(`M${P(cx + side * w * 0.22, y + w * 0.2)}l${f(side * w * 0.12)} ${f(w * 0.62)}l${f(-side * w * 0.28)} ${f(w * 0.04)}l${f(side * w * 0.02)} ${f(-w * 0.6)}Z`, { fill: darken(col, 0.08) });
}

// ───────────────────────────────────────────── critters (each drawn standing, with a contact shadow)

/** A friendly dog sitting, facing left (flip = 1 faces right). `coat` adds a little winter coat. */
export function dog(x, foot, s = 1, col = '#c8894a', { coat = null, flip = -1 } = {}) {
  const t = `translate(${f(x)} ${f(foot)}) scale(${f(s * flip)} ${f(s)})`;
  const dark = darken(col, 0.25);
  return G({ transform: t },
    ellipse(0, 1, 34, 6, { fill: '#000', opacity: 0.25 }),
    path('M18 0c4-22 6-38-6-48c-12-8-30-4-34 10c-4 14 2 30 4 38z', { fill: col }),                    // body
    path('M22 -6q16-2 16-16', { fill: 'none', stroke: col, 'stroke-width': 7, 'stroke-linecap': 'round' }),   // tail
    path('M-14 0v-16M-4 0v-16', { fill: 'none', stroke: col, 'stroke-width': 9, 'stroke-linecap': 'round' }), // front legs
    coat ? path('M-20 -40c8-6 26-8 34 0l4 22c-12 6-28 6-40 0z', { fill: coat }) : '',
    circle(-16, -54, 18, { fill: col }),                                                                 // head
    path('M-26 -66c-10 2-14 16-8 26c4-4 8-14 8-26z', { fill: dark }),                                    // ear
    path('M-4 -68c8 0 12 14 6 24c-4-4-8-12-6-24z', { fill: dark }),
    ellipse(-30, -48, 9, 7, { fill: lighten(col, 0.3) }),                                                // muzzle
    circle(-36, -50, 3.6, { fill: '#2b1a1a' }),
    ellipse(-19, -58, 2.8, 3.4, { fill: '#2b1a4d' }), circle(-20, -59.4, 1.1, { fill: '#fff' }),
    path('M-30 -42q4 4 8 0', { fill: 'none', stroke: '#6b2b3a', 'stroke-width': 2, 'stroke-linecap': 'round' }),
  );
}

/** A hedgehog peeking out, facing left. */
export function hedgehog(x, foot, s = 1) {
  let spines = '';
  for (let i = 0; i < 9; i++) { const a = -2.6 + i * 0.3; spines += `M${P(Math.cos(a) * 20, -12 + Math.sin(a) * 16)}l${f(Math.cos(a) * 9)} ${f(Math.sin(a) * 9)}`; }
  return G({ transform: `translate(${f(x)} ${f(foot)}) scale(${f(s)})` },
    ellipse(2, 1, 26, 4, { fill: '#000', opacity: 0.25 }),
    path('M24 0c2-18-10-30-26-30c-14 0-24 10-26 22l-6 6q2 3 8 2z', { fill: '#6b4a32' }),
    path(spines, { fill: 'none', stroke: '#3a2618', 'stroke-width': 2.6, 'stroke-linecap': 'round' }),
    path('M-28 -8l-8 6q3 3 10 2z', { fill: '#d9b48a' }),
    circle(-34, -3, 2.6, { fill: '#2b1a1a' }),
    circle(-22, -12, 2.2, { fill: '#2b1a4d' }), circle(-22.8, -12.8, 0.8, { fill: '#fff' }),
  );
}

/** A little owl perched (feet on the branch at y). */
export function owl(x, y, s = 1, col = '#8a6a4a') {
  return G({ transform: `translate(${f(x)} ${f(y)}) scale(${f(s)})` },
    path('M-14 0c-4-14-2-30 14-32c16 2 18 18 14 32z', { fill: col }),
    path('M-10 -28l-4-10l10 6zM10 -28l4-10l-10 6z', { fill: col }),
    path('M-8 0c-2-8 0-14 8-15c8 1 10 7 8 15z', { fill: lighten(col, 0.35) }),
    circle(-6, -22, 6, { fill: '#fff4d6' }), circle(6, -22, 6, { fill: '#fff4d6' }),
    circle(-6, -22, 3, { fill: '#2b1a4d' }), circle(6, -22, 3, { fill: '#2b1a4d' }),
    circle(-7, -23, 1, { fill: '#fff' }), circle(5, -23, 1, { fill: '#fff' }),
    path('M-2 -17l2 4l2-4z', { fill: '#e8a030' }),
    path('M-6 0v3M6 0v3', { fill: 'none', stroke: '#e8a030', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
  );
}

/** A fox peeking over something (just head and shoulders), facing left. */
export function foxPeek(x, y, s = 1) {
  return G({ transform: `translate(${f(x)} ${f(y)}) scale(${f(s)})` },
    path('M-20 0c0-14 6-24 18-26l14-14l4 18c6 6 6 14 4 22z', { fill: '#d86a2a' }),
    path('M-22 -6c-6 2-12 0-14-4c6-2 12-4 18-4z', { fill: '#fff4e6' }),
    path('M-4 -24l-6-16l12 10zM10 -30l4-18l6 16z', { fill: '#d86a2a' }),
    path('M-2 -28l-3-8l6 5z', { fill: '#2a1a14' }),
    circle(-37, -10, 3, { fill: '#2b1a1a' }),
    ellipse(-14, -18, 2.6, 3.2, { fill: '#2b1a4d' }), circle(-15, -19.2, 1, { fill: '#fff' }),
  );
}

// ───────────────────────────────────────────── buildings (back-layer silhouettes)

/** A terrace of houses as a silhouette with chimneys and lit windows. Returns { d, windows: [[x, y, w, h]] }. */
export function terrace(x0, x1, base, seed = 5, { hMin = 70, hMax = 120, wMin = 90, wMax = 140 } = {}) {
  const R = rng(seed);
  let d = '';
  const windows = [];
  for (let x = x0; x < x1;) {
    const w = wMin + R() * (wMax - wMin), h = hMin + R() * (hMax - hMin);
    const roof = base - h, peak = roof - 26 - R() * 18;
    const gable = R() < 0.4;
    d += gable ? `M${P(x, base)}V${f(roof)}L${P(x + w / 2, peak)}L${P(x + w, roof)}V${f(base)}Z` : `M${P(x, base)}V${f(roof)}L${P(x + 14, peak + 10)}H${f(x + w - 14)}L${P(x + w, roof)}V${f(base)}Z`;
    // chimney stack with pots
    const cx = x + w * (0.25 + R() * 0.5);
    const cTop = (gable ? peak + 10 : peak + 10) - 22;
    d += `M${P(cx - 9, peak + 16)}V${f(cTop)}H${f(cx + 9)}V${f(peak + 16)}Z` + `M${P(cx - 6, cTop)}v-6h4v6zM${P(cx + 2, cTop)}v-6h4v6z`;
    for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) if (R() < 0.62) windows.push([x + w * (0.22 + col * 0.38), roof + 18 + row * 34, 14, 18]);
    x += w;
  }
  return { d, windows };
}

export { f, P, mix, lighten, darken, rng, E, G, path, circle, ellipse, rect, use, lin, rad, smooth, roundPoly, sagPts };
