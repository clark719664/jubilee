// lib.mjs — tiny SVG authoring kit for Jubilee art (numbers, colours, paths, elements).
let PREC = 10;
/** Coordinate precision: 1 → whole numbers, 10 → one decimal. */
export const setPrecision = (p) => { PREC = p; };
export const f = (n) => { let v = Math.round(n * PREC) / PREC; if (Object.is(v, -0)) v = 0; return String(v); };
export const P = (x, y) => `${f(x)} ${f(y)}`;

// ---------- colour ----------
export function rgb(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function hex(a) { return '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); }
export const lighten = (c, t) => mix(c, '#ffffff', t);
export const darken = (c, t) => mix(c, '#000000', t);
export function hsl(c) {
  const [r, g, b] = rgb(c).map((v) => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  return [h * 360, s, l];
}
export function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360; const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const k = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return hex([k(h + 1 / 3), k(h), k(h - 1 / 3)].map((v) => v * 255));
}
export function sat(c, k) { const [h, s, l] = hsl(c); return fromHsl(h, Math.max(0, Math.min(1, s * k)), l); }

// ---------- rng ----------
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- elements ----------
// SVG attributes that are genuinely camelCase (everything else, e.g. strokeWidth, is written kebab-case)
const CAMEL = new Set(['viewBox', 'gradientUnits', 'gradientTransform', 'patternUnits', 'patternContentUnits', 'patternTransform', 'stdDeviation', 'preserveAspectRatio', 'clipPathUnits', 'maskUnits', 'maskContentUnits', 'spreadMethod', 'filterUnits']);
const kebab = (k) => (CAMEL.has(k) ? k : k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()));
// Paint/style numbers keep two decimals whatever the coordinate precision (an opacity of .22 must never become 0).
const STYLE_NUM = new Set(['opacity', 'fill-opacity', 'stroke-opacity', 'stop-opacity', 'offset', 'stroke-width', 'stdDeviation', 'stroke-miterlimit']);
const fs = (n) => { let v = Math.round(n * 100) / 100; if (Object.is(v, -0)) v = 0; return String(v).replace(/^(-?)0\./, '$1.'); }; // .22, not 0.22
export function attrs(o) {
  return Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => { const name = k.includes(':') ? k : kebab(k); return ` ${name}="${typeof v === 'number' ? (STYLE_NUM.has(name) ? fs(v) : f(v)) : v}"`; }).join('');
}
export const E = (tag, a = {}, ...kids) => { const k = kids.flat(Infinity).filter(Boolean).join(''); return k ? `<${tag}${attrs(a)}>${k}</${tag}>` : `<${tag}${attrs(a)}/>`; };
export const G = (a, ...kids) => E('g', a, ...kids);
export const C = (text) => `\n<!-- ${text} -->\n`;
export const path = (d, a = {}) => E('path', { d, ...a });
export const circle = (cx, cy, r, a = {}) => E('circle', { cx, cy, r, ...a });
export const ellipse = (cx, cy, rx, ry, a = {}) => E('ellipse', { cx, cy, rx, ry, ...a });
export const rect = (x, y, width, height, a = {}) => E('rect', { x, y, width, height, ...a });
export const use = (id, a = {}) => E('use', { 'xlink:href': '#' + id, ...a });

export function stops(list) {
  return list.map(([o, c, op]) => E('stop', { offset: o === 0 ? undefined : o, 'stop-color': c, 'stop-opacity': op === undefined || op === 1 ? undefined : op })).join('');
}
// Gradient geometry keeps two decimals whatever the coordinate precision: bounding-box values like 0.5 must never
// round to 1 (that moved a whole glow to the corner of its shape).
const g2 = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? fs(v) : v]));
// Attributes equal to the SVG defaults are left out (x1=y1=y2=0, x2=1 on a linear gradient; cx=cy=r=0.5 on a radial
// one; stop offset 0) — they were a third of a scene's <defs>. User-space gradients always write every value.
const dropDefaults = (o, defs, a) => (a.gradientUnits === 'userSpaceOnUse' ? o : Object.fromEntries(Object.entries(o).filter(([k, v]) => defs[k] !== v)));
export const lin = (id, x1, y1, x2, y2, list, a = {}) => E('linearGradient', { id, ...g2(dropDefaults({ x1, y1, x2, y2 }, { x1: 0, y1: 0, x2: 1, y2: 0 }, a)), ...g2(a) }, stops(list));
export const rad = (id, cx, cy, r, list, a = {}) => E('radialGradient', { id, ...g2(dropDefaults({ cx, cy, r }, { cx: 0.5, cy: 0.5, r: 0.5 }, a)), ...g2(a) }, stops(list));
export const blur = (id, sd, a = {}) => E('filter', { id, x: '-50%', y: '-50%', width: '200%', height: '200%', ...a }, E('feGaussianBlur', { stdDeviation: sd }));

export function doc(comment, defs, body, viewBox = '0 0 1600 900') {
  return compactSvg(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${viewBox}">\n<!-- ${comment} -->\n<defs>${defs.join('')}</defs>${body.join('')}\n</svg>\n`);
}

// ---------- geometry ----------
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerpP = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** Catmull-Rom spline through points as cubic Béziers. */
export function smooth(pts, closed = false, k = 1 / 6, move = true) {
  const n = pts.length; const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = move ? `M${P(...pts[0])}` : `L${P(...pts[0])}`; const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${P(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k)} ${P(p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k)} ${P(...p2)}`;
  }
  return closed ? d + 'Z' : d;
}

/** Polygon with every corner rounded (radius per corner or one radius). */
export function roundPoly(pts, r, open = false) {
  const n = pts.length; let d = '';
  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    if (open && (i === 0 || i === n - 1)) { d += (i === 0 ? 'M' : 'L') + P(...p1); continue; }
    const p0 = pts[(i - 1 + n) % n], p2 = pts[(i + 1) % n]; const rr = Array.isArray(r) ? r[i] : r;
    if (!rr) { d += (d ? 'L' : 'M') + P(...p1); continue; }
    const d1 = dist(p1, p0), d2 = dist(p1, p2); const t1 = Math.min(rr, d1 / 2) / d1, t2 = Math.min(rr, d2 / 2) / d2;
    const a = lerpP(p1, p0, t1), b = lerpP(p1, p2, t2);
    d += (d ? 'L' : 'M') + P(...a) + 'Q' + P(...p1) + ' ' + P(...b);
  }
  return open ? d : d + 'Z';
}

export function starPts(cx, cy, R, r, n = 5, rot = -90) {
  const out = []; for (let i = 0; i < 2 * n; i++) { const a = ((rot + (i * 180) / n) * Math.PI) / 180; const rad2 = i % 2 ? r : R; out.push([cx + rad2 * Math.cos(a), cy + rad2 * Math.sin(a)]); } return out;
}

/** Points along a quadratic sag between two anchors (a hanging wire). */
export function sagPts(x1, y1, x2, y2, sag, n) {
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + sag * 2; const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n; const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2; const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2; out.push([x, y]); }
  return out;
}
export function sagPath(x1, y1, x2, y2, sag) { return `M${P(x1, y1)}Q${P((x1 + x2) / 2, (y1 + y2) / 2 + sag * 2)} ${P(x2, y2)}`; }

/** Rounded rectangle path. */
export function rrect(x, y, w, h, r) { return roundPoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r); }
/** Rectangle with a semicircular (or elliptical) top. */
export function archRect(x, y, w, h, rTop = w / 2) {
  return `M${P(x, y + h)}L${P(x, y + rTop)}A${P(w / 2, rTop)} 0 0 1 ${P(x + w, y + rTop)}L${P(x + w, y + h)}Z`;
}
/** Closed ground/hill path: a smooth top line through pts, then straight down to `bottom`. */
export function hill(pts, bottom = 905) {
  const first = pts[0], last = pts[pts.length - 1];
  return smooth(pts) + `L${P(last[0], bottom)}L${P(first[0], bottom)}Z`;
}
/** Snow cap with soft drips hanging under a line from (x1,y1) to (x2,y2). */
export function dripEdge(x1, y1, x2, y2, depth, n, seed = 1, thick = 10) {
  const R = rng(seed); const pts = [];
  pts.push([x1, y1 - thick]);
  pts.push([x2, y2 - thick]);
  // underside with drips, right to left
  const under = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n; const x = lerp(x2, x1, t), y = lerp(y2, y1, t);
    const drip = i % 2 === 1 ? depth * (0.55 + 0.6 * R()) : depth * 0.15;
    under.push([x, y + drip]);
  }
  return { top: pts, under };
}

// ---------- polylines ----------
export function plLength(pl) { let s = 0; for (let i = 1; i < pl.length; i++) s += dist(pl[i - 1], pl[i]); return s; }
/** Point and upward unit normal at fraction t of a polyline's length. */
export function plAt(pl, t) {
  const total = plLength(pl); let want = t * total;
  for (let i = 1; i < pl.length; i++) {
    const a = pl[i - 1], b = pl[i]; const l = dist(a, b);
    if (want <= l || i === pl.length - 1) { const u = l ? Math.min(1, want / l) : 0; const ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l; let nx = uy, ny = -ux; if (ny > 0 || (ny === 0 && nx > 0)) { nx = -nx; ny = -ny; } return [[lerp(a[0], b[0], u), lerp(a[1], b[1], u)], [nx, ny]]; }
    want -= l;
  }
  return [pl[pl.length - 1], [0, -1]];
}
/** A soft snow blanket draped over a roof line: top lifted by `lift`, an irregular drippy hem `thick` below. */
export function blanket(edge, lift, thick, R, step = 14, k = 0.17, drip = 0.34, dripK = 1) {
  const n = Math.max(4, Math.round(plLength(edge) / step));
  const top = [], hem = []; let last = -9;
  for (let i = 0; i <= n; i++) {
    const [p] = plAt(edge, i / n);
    top.push([p[0], p[1] - lift]);
    const end = i === 0 || i === n;
    let th = thick * (0.72 + 0.28 * R());
    if (!end && i - last > 2 && R() < drip) { th *= 1 + (0.45 + R() * 0.5) * dripK; last = i; }
    if (end) th = thick * 0.4;
    hem.push([p[0], p[1] + th]);
  }
  return smooth([...top, ...hem.reverse()], true, k);
}

// ---------- path compaction (absolute → relative, adaptive rounding, no drift) ----------
const ARGN = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
function num(v) {
  const a = Math.abs(v); let r = a >= 20 ? Math.round(v) : Math.round(v * 10) / 10;
  if (Object.is(r, -0)) r = 0; let s = String(r); if (s.startsWith('0.')) s = s.slice(1); else if (s.startsWith('-0.')) s = '-' + s.slice(2); return s;
}
function joinNums(arr) { let out = ''; for (const s of arr) { if (!out) out = s; else if (s[0] === '-' || (s[0] === '.' && /\.\d*$/.test(out))) out += s; else out += ' ' + s; } return out; }
export function compactPath(d) {
  // Tracks the EXACT pen position (ex, ey) next to the written one (cx, cy): every delta is written as
  // round(exactTarget - written), so rounding never drifts and a closed loop (+23.5 then -23.5) closes exactly
  // (it used to write +24 then -23 and leave a flat chord on every marigold petal). Each subpath starts where it
  // was written, so the error is at most a 0.5 shift of one subpath, never a gap.
  const toks = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, ex = 0, ey = 0, esx = 0, esy = 0, out = '', first = true, cmd = '';
  const take = () => parseFloat(toks[i++]);
  const emit = (c, nums) => { out += c + joinNums(nums); };
  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) cmd = toks[i++];
    const lc = cmd.toLowerCase(), rel = cmd === lc;
    if (lc === 'z') { out += 'z'; cx = sx; cy = sy; ex = esx; ey = esy; continue; }
    const n = ARGN[lc]; const a = []; for (let k = 0; k < n; k++) a.push(take());
    if (lc === 'm') {
      const x = rel ? ex + a[0] : a[0], y = rel ? ey + a[1] : a[1];
      if (first) { const X = Number(num(Math.round(x))), Y = Number(num(Math.round(y))); emit('M', [num(X), num(Y)]); cx = X; cy = Y; }
      else { const dx = Number(num(x - cx)), dy = Number(num(y - cy)); emit('m', [num(dx), num(dy)]); cx += dx; cy += dy; }
      // snap the exact pen to the written start, so a loop drawn with relative moves closes on what was written
      ex = cx; ey = cy; sx = cx; sy = cy; esx = ex; esy = ey; first = false; cmd = rel ? 'l' : 'L'; continue;
    }
    first = false;
    if (lc === 'h') { const x = rel ? ex + a[0] : a[0]; const dx = Number(num(x - cx)); emit('h', [num(dx)]); cx += dx; ex = x; continue; }
    if (lc === 'v') { const y = rel ? ey + a[0] : a[0]; const dy = Number(num(y - cy)); emit('v', [num(dy)]); cy += dy; ey = y; continue; }
    if (lc === 'a') { const x = rel ? ex + a[5] : a[5], y = rel ? ey + a[6] : a[6]; const dx = Number(num(x - cx)), dy = Number(num(y - cy)); emit('a', [num(a[0]), num(a[1]), num(a[2]), String(a[3]), String(a[4]), num(dx), num(dy)]); cx += dx; cy += dy; ex = x; ey = y; continue; }
    // coordinate pairs (l, c, s, q, t): all relative to the segment start
    const pairs = []; for (let k = 0; k < n; k += 2) pairs.push([rel ? ex + a[k] : a[k], rel ? ey + a[k + 1] : a[k + 1]]);
    const nums = []; let nx = cx, ny = cy;
    pairs.forEach(([x, y], k) => { const dx = Number(num(x - cx)), dy = Number(num(y - cy)); nums.push(num(dx), num(dy)); if (k === pairs.length - 1) { nx = cx + dx; ny = cy + dy; } });
    emit(lc, nums); cx = nx; cy = ny; [ex, ey] = pairs[pairs.length - 1];
  }
  return out;
}
export function compactSvg(svg) { return svg.replace(/ d="([^"]+)"/g, (_, d) => ` d="${compactPath(d)}"`); }

// ---------- trees ----------
/** Half-width of a tree tier [apexY, bottomY, halfW] at height y (the straight-edge approximation of tierPath). */
export function tierHalf([ay, by, hw], y) {
  const mid = ay + (by - ay) * 0.5;
  if (y <= ay) return 0;
  return y <= mid ? (hw * 0.5 * (y - ay)) / (mid - ay) : hw * 0.5 + (hw * 0.5 * Math.min(y - mid, by - mid)) / (by - mid);
}
/**
 * Garlands that wrap round a tree: each swag runs from beyond one edge of its tier to beyond the other, so once the
 * wires are clipped to the tree they enter and leave at the silhouette (no wire ever ends on the branches or in the
 * air). `swags` = [[tierIndex, yLeft, yRight, sag]], each inside the band of its tier that the tier above leaves
 * showing. Returns the wire path (clip it to the tree) and the bulb points that sit well inside the tier.
 */
export function treeGarlands(cx, tiers, swags, step = 18, margin = 14) {
  let wires = ''; const bulbs = [], lines = [];
  for (const [i, yL, yR, sag] of swags) {
    const t = tiers[i]; const xL = cx - tierHalf(t, yL) - 24, xR = cx + tierHalf(t, yR) + 24;
    const n = Math.max(4, Math.round((xR - xL) / step));
    const pts = sagPts(xL, yL, xR, yR, sag, n);
    wires += smooth(pts); lines.push(sagPts(xL, yL, xR, yR, sag, 60));
    pts.forEach(([x, y], k) => { if (Math.abs(x - cx) < tierHalf(t, y) - margin) bulbs.push([x, y, k]); });
  }
  return { wires, bulbs, lines };
}

/**
 * Scatter baubles over a tiered fir without collisions: each band (the part of a tier the tier above leaves
 * showing) gets `per[i]` baubles, picked in seeded-random order from (a) the bough tips of the tier above (they
 * hang on a thread from the tip) and (b) points on the band itself (they hang from a loop on a branch). A pick
 * must clear every bulb, every garland wire and every other bauble, and stay inside its band.
 * Returns [x, y, r, kind, hangY] — hangY is the bough tip a thread runs up to, or null for a loop.
 */
export function placeBaubles({ cx, tiers, tipsOf, notchY, garland, per, seed, r = 14, colours = ['r', 'g', 's'], edge = 18, gap = 18, wire = 3 }) {
  const R = rng(seed); const out = [];
  const near = (x, y, k) => out.filter(([ox, oy, , ok]) => ok === k && Math.hypot(x - ox, y - oy) < 110).length;
  const wirePts = garland.lines.flat();
  const ok = (x, y, rr) => garland.bulbs.every(([bx, by]) => Math.hypot(x - bx, y - by) >= rr + 9 && Math.hypot(x - bx, y - rr - 4 - by) >= 10)
    && wirePts.every(([wx, wy]) => Math.hypot(x - wx, y - wy) >= rr + wire)
    && out.every(([ox, oy, or]) => Math.hypot(x - ox, y - oy) >= rr + or + gap);
  tiers.forEach((t, i) => {
    if (!per[i]) return;
    const cands = [];
    const top = i === 0 ? t[0] + (t[1] - t[0]) * 0.45 : null;
    if (i > 0) for (const [x, y] of tipsOf(i - 1)) if (Math.abs(x - cx) < tierHalf(t, y + 5 + r) - r - edge) cands.push([x, y + 5 + r, y]);
    for (let y = (i === 0 ? top : tiers[i - 1][1] + 26) + r; y < t[1] + 4; y += 5) {
      const half = tierHalf(t, y) - r - edge;
      for (let x = cx - half; x <= cx + half; x += 6) if (y + r + 3 < notchY(i, x)) cands.push([x, y, null]);
    }
    const order = cands.map((c) => [R(), c]).sort((a, b) => a[0] - b[0]).map(([, c]) => c);
    let n = 0;
    for (const [x, y, hang] of order) {
      if (n >= per[i]) break;
      // the colour least used nearby, so neighbours differ
      const nearest = out.reduce((m, o) => (Math.hypot(x - o[0], y - o[1]) < (m ? Math.hypot(x - m[0], y - m[1]) : 1e9) ? o : m), null);
      const kind = [...colours].sort((a, b) => (nearest && a === nearest[3]) - (nearest && b === nearest[3]) || near(x, y, a) - near(x, y, b) || colours.indexOf(a) - colours.indexOf(b))[0]; const rr = kind === 's' ? r * 0.8 : r;
      const yy = hang === null ? y : y - (r - rr);
      if (!ok(x, yy, rr)) continue;
      out.push([x, yy, rr, kind, hang]); n++;
    }
  });
  return out;
}

// ---------- quadratic helpers ----------
/** Point at t on the quadratic P0–C–P2. */
export const qAt = (p0, c, p2, t) => [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p2[1]];
/** Control point of the piece of the quadratic P0–C–P2 between t0 and t1 (its blossom). */
export const qCtrl = (p0, c, p2, t0, t1) => [0, 1].map((k) => (1 - t0) * (1 - t1) * p0[k] + ((1 - t0) * t1 + t0 * (1 - t1)) * c[k] + t0 * t1 * p2[k]);

// ---------- fir tiers ----------
/**
 * One tier of a fir, built from exact curves: concave sides from a rounded apex down to a bough tip at each
 * corner, then a hem of drooping bough tips (scallops meeting in small V notches) back to the other corner — a
 * fir, not a saucer. `t` = [apexY, cornerY, halfWidth]; `n` scallops; `seed` sets the jitter, so the same seed
 * gives the same tier (the lit hem and the body drawn 7 above it always match); `dy` shifts the whole tier.
 * The hem's notches sit `sag` lower in the middle than at the corners; each tip droops `droop` below its notches.
 */
export function firTier(cx, t, n, seed, dy = 0, o = {}) { return firTierGeom(cx, t, n, seed, dy, o).d; }
/** firTier's geometry: the path `d` and the lowest point of every bough tip (`tips`, right to left). */
export function firTierGeom(cx, [ay, by, hw], n, seed, dy = 0, { sag = 9, droop = 8 } = {}) {
  const R = rng(seed);
  const ap = [cx, ay + dy], rm = [cx + hw * 0.5, ay + (by - ay) * 0.5 + dy], rc = [cx + hw, by + dy];
  const lm = [cx - hw * 0.5, rm[1]], lc = [cx - hw, by + dy];
  const N = [rc];
  for (let j = 1; j < n; j++) { const u = 1 - (2 * j) / n + (R() - 0.5) * (0.6 / n); N.push([cx + hw * u, by + dy + sag * (1 - u * u)]); }
  N.push(lc);
  const K = N.slice(0, -1).map((p, j) => { const q = N[j + 1]; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + 2 * droop * (0.8 + R() * 0.45)]; });
  const cut = (p, q, r) => lerpP(p, q, Math.min(r, dist(p, q) / 2) / dist(p, q));
  const tau = 0.22;
  let d = `M${P(...cut(ap, lm, 8))}Q${P(...ap)} ${P(...cut(ap, rm, 8))}L${P(...cut(rm, ap, 34))}Q${P(...rm)} ${P(...cut(rm, rc, 34))}`;
  // right corner: a small rounding into the first bough tip
  d += `L${P(...cut(rc, rm, 7))}Q${P(...rc)} ${P(...qAt(N[0], K[0], N[1], tau))}Q${P(...qCtrl(N[0], K[0], N[1], tau, 1))} ${P(...N[1])}`;
  for (let j = 1; j < n - 1; j++) d += `Q${P(...K[j])} ${P(...N[j + 1])}`;
  const j = n - 1;
  d += `Q${P(...qCtrl(N[j], K[j], N[j + 1], 0, 1 - tau))} ${P(...qAt(N[j], K[j], N[j + 1], 1 - tau))}Q${P(...lc)} ${P(...cut(lc, lm, 7))}`;
  d += `L${P(...cut(lm, lc, 34))}Q${P(...lm)} ${P(...cut(lm, ap, 34))}Z`;
  return { d, tips: K.map((k, i) => qAt(N[i], k, N[i + 1], 0.5)), notch: (x) => { const u = Math.max(-1, Math.min(1, (x - cx) / hw)); return by + dy + sag * (1 - u * u); } };
}
/** Lowest point of a fir tier's hem (for placing what hangs below it). */
export const firHemY = ([, by], { sag = 9, droop = 8 } = {}) => by + sag + droop * 1.25;
