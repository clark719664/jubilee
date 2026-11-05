// stickerkit.mjs — Sticker 2.0: every sticker is a collectible badge.
//
//   [die-cut white border + soft shadow around the union of badge and hero]
//   badge   — a holiday-specific shape (burst, scallop, arch, heart…), a two-tone enamel fill, a holiday pattern
//             clipped inside, a bevel (light top, dark bottom), a stitched inner ring and a thin ink rim
//   hero    — the holiday's character or object, larger than the badge so it breaks out of it, with a dark ink
//             outline traced from its own silhouette (reads crisply at 40 px)
//   extras  — sparkles, a prop, a little scene element
//
// Faces are optional and come from an expression library, so no two stickers wear the same face.
import { f, P, mix, lighten, darken, E, G, path, circle, ellipse, use, lin, rad, doc, roundPoly, starPts, smooth, rng, compactSvg } from '../gen-xmas/lib.mjs';

export const PLUM = '#2b1a4d';
export const CHEEK = '#ff8fb8';

// ───────────────────────────────────────────── shapes (closed path data)

export const circleD = (cx, cy, r) => `M${P(cx - r, cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
export const ellD = (cx, cy, rx, ry) => `M${P(cx - rx, cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;

/** A scalloped disc: n round bumps on a circle of radius r. `flat` > 1 makes the bumps shallower. */
export function scallopD(cx, cy, r, n, flat = 1, rot = -90) {
  const pts = Array.from({ length: n }, (_, i) => { const a = ((rot + (360 * i) / n) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  const chord = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
  const rb = (chord / 2) * flat;
  let d = `M${P(...pts[0])}`;
  for (let i = 1; i <= n; i++) d += `A${f(rb)} ${f(rb)} 0 0 1 ${P(...pts[i % n])}`;
  return d + 'Z';
}

/** A starburst with rounded tips: n points between radius R (tips) and r (valleys). */
export const burstD = (cx, cy, R, r, n, round = 8, rot = -90) => roundPoly(starPts(cx, cy, R, r, n, rot), round);

/** A rounded regular polygon (6 = hexagon, 8 = octagon). */
export function polyD(cx, cy, r, n, round = 18, rot = -90) {
  return roundPoly(Array.from({ length: n }, (_, i) => { const a = ((rot + (360 * i) / n) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }), round);
}

/** A tombstone arch: straight sides, semicircular top, rounded bottom corners. */
export function archD(x, y, w, h, round = 26) {
  const r = w / 2;
  return `M${P(x, y + r)}A${f(r)} ${f(r)} 0 0 1 ${P(x + w, y + r)}V${f(y + h - round)}Q${P(x + w, y + h)} ${P(x + w - round, y + h)}H${f(x + round)}Q${P(x, y + h)} ${P(x, y + h - round)}Z`;
}

/** A heart with its point at the bottom, `w` wide. */
export function heartD(cx, cy, w) {
  const s = w / 2;
  return `M${P(cx, cy + s * 0.95)}C${P(cx - s * 0.35, cy + s * 0.62)} ${P(cx - s * 1.02, cy + s * 0.2)} ${P(cx - s * 1.0, cy - s * 0.3)}C${P(cx - s * 0.98, cy - s * 0.82)} ${P(cx - s * 0.42, cy - s * 1.0)} ${P(cx, cy - s * 0.58)}C${P(cx + s * 0.42, cy - s * 1.0)} ${P(cx + s * 0.98, cy - s * 0.82)} ${P(cx + s * 1.0, cy - s * 0.3)}C${P(cx + s * 1.02, cy + s * 0.2)} ${P(cx + s * 0.35, cy + s * 0.62)} ${P(cx, cy + s * 0.95)}Z`;
}

/** A shield: flat top with rounded corners, curving to a point. */
export function shieldD(cx, top, w, h) {
  const x0 = cx - w / 2, x1 = cx + w / 2, r = 26;
  return `M${P(x0, top + r)}Q${P(x0, top)} ${P(x0 + r, top)}H${f(x1 - r)}Q${P(x1, top)} ${P(x1, top + r)}V${f(top + h * 0.5)}C${P(x1, top + h * 0.78)} ${P(cx + w * 0.22, top + h * 0.9)} ${P(cx, top + h)}C${P(cx - w * 0.22, top + h * 0.9)} ${P(x0, top + h * 0.78)} ${P(x0, top + h * 0.5)}Z`;
}

/** An onion dome / lantern arch (pointed top), as on a mosque window. */
export function domeArchD(x, y, w, h) {
  const cx = x + w / 2, shoulder = y + w * 0.62;
  return `M${P(x, y + h - 24)}V${f(shoulder)}C${P(x, y + w * 0.3)} ${P(cx - w * 0.12, y + w * 0.16)} ${P(cx, y)}C${P(cx + w * 0.12, y + w * 0.16)} ${P(x + w, y + w * 0.3)} ${P(x + w, shoulder)}V${f(y + h - 24)}Q${P(x + w, y + h)} ${P(x + w - 24, y + h)}H${f(x + 24)}Q${P(x, y + h)} ${P(x, y + h - 24)}Z`;
}

/** A smooth organic blob (seeded). */
export function blobD(cx, cy, r, seed = 1, n = 9, wobble = 0.08) {
  const R = rng(seed);
  const pts = Array.from({ length: n }, (_, i) => { const a = (Math.PI * 2 * i) / n; const k = 1 + (R() * 2 - 1) * wobble; return [cx + r * k * Math.cos(a), cy + r * k * Math.sin(a)]; });
  return smooth(pts, true);
}

// ───────────────────────────────────────────── patterns (one path each, clipped to the badge)

const pts4 = (x, y, r) => `M${P(x, y - r)}Q${P(x, y)} ${P(x + r, y)}Q${P(x, y)} ${P(x, y + r)}Q${P(x, y)} ${P(x - r, y)}Q${P(x, y)} ${P(x, y - r)}Z`;
/** A four-point sparkle with concave sides. */
export const sparkleD = pts4;

export const PATTERNS = {
  /** an even dot grid, offset every other row */
  dots: (b, s = 34, r = 4) => grid(b, s, (x, y) => circleD(x, y, r)),
  /** little four-point stars */
  twinkles: (b, s = 46, r = 8) => grid(b, s, (x, y, i) => pts4(x, y, r * (i % 3 === 0 ? 1.3 : 0.8))),
  /** five-point stars */
  stars: (b, s = 52, r = 9) => grid(b, s, (x, y) => roundPoly(starPts(x, y, r, r * 0.45, 5), 1.5)),
  /** a ring of firework bursts: a dot and eight short rays */
  fireworks: (b, s = 74) => grid(b, s, (x, y, i) => burstMark(x, y, 9 + (i % 2) * 5)),
  /** six-armed snowflakes made of capsules */
  snowflakes: (b, s = 64) => grid(b, s, (x, y, i) => flake(x, y, 9 + (i % 2) * 4)),
  /** sun rays from the badge centre */
  rays: (b, n = 20) => { let d = ''; const R = 400; for (let i = 0; i < n; i++) { const a0 = (Math.PI * 2 * i) / n, a1 = a0 + Math.PI / n; d += `M${P(b.cx, b.cy)}L${P(b.cx + R * Math.cos(a0), b.cy + R * Math.sin(a0))}L${P(b.cx + R * Math.cos(a1), b.cy + R * Math.sin(a1))}Z`; } return d; },
  /** diagonal stripes */
  stripes: (b, s = 30, w = 12) => { let d = ''; for (let k = -600; k < 600; k += s) d += `M${P(b.cx + k, b.cy - 300)}l${f(w)} 0l-600 600l${f(-w)} 0Z`; return d; },
  /** zigzag bands */
  zigzag: (b, s = 44, amp = 10, w = 7) => { let d = ''; for (let y = b.cy - 260; y < b.cy + 260; y += s) { let top = `M${P(b.cx - 280, y)}`, bot = ''; const xs = []; for (let x = b.cx - 280; x <= b.cx + 280; x += 22) xs.push(x); xs.forEach((x, i) => { top += `L${P(x, y + (i % 2 ? amp : -amp))}`; }); [...xs].reverse().forEach((x, j) => { const i = xs.length - 1 - j; bot += `L${P(x, y + (i % 2 ? amp : -amp) + w)}`; }); d += top + bot + 'Z'; } return d; },
  /** hearts */
  hearts: (b, s = 56, w = 18) => grid(b, s, (x, y) => heartD(x, y, w)),
  /** confetti: little rotated capsules */
  confetti: (b, s = 40) => grid(b, s, (x, y, i) => capsule(x, y, 12, 4.5, (i * 47) % 180)),
  /** waves */
  waves: (b, s = 34, w = 6) => { let d = ''; for (let y = b.cy - 260; y < b.cy + 260; y += s) { let p = `M${P(b.cx - 280, y)}`; for (let x = b.cx - 280; x < b.cx + 280; x += 40) p += `q10 -10 20 0t20 0`; d += p + `v${f(w)}`; for (let x = b.cx + 280; x > b.cx - 280; x -= 40) d += `q-10 -10 -20 0t-20 0`; d += 'Z'; } return d; },
  /** a checkerboard of small diamonds */
  diamonds: (b, s = 36, r = 7) => grid(b, s, (x, y) => `M${P(x, y - r)}l${f(r)} ${f(r)}l${f(-r)} ${f(r)}l${f(-r)} ${f(-r)}Z`),
  /** crescents */
  crescents: (b, s = 60, r = 10) => grid(b, s, (x, y) => `M${P(x + r * 0.3, y - r)}A${f(r)} ${f(r)} 0 1 0 ${P(x + r * 0.3, y + r)}A${f(r * 0.78)} ${f(r * 0.78)} 0 1 1 ${P(x + r * 0.3, y - r)}Z`),
  /** concentric rings round the centre (a ripple) */
  rings: (b, s = 30, w = 7) => { let d = ''; for (let r = s; r < 340; r += s) d += circleD(b.cx, b.cy, r + w / 2) + circleD(b.cx, b.cy, r - w / 2).replace(/a([\d.]+) ([\d.]+) 0 1 0/g, 'a$1 $2 0 1 1'); return d; },
  /** four-petal flowers */
  petals: (b, s = 56, r = 8) => grid(b, s, (x, y) => [0, 1, 2, 3].map((k) => ellD(x + Math.cos((k * Math.PI) / 2) * r, y + Math.sin((k * Math.PI) / 2) * r, r * 0.7, r * 0.7)).join('')),
  /** leaves */
  leaves: (b, s = 58, r = 12) => grid(b, s, (x, y, i) => leaf(x, y, r, (i * 61) % 360)),
};

function grid(b, s, mark) {
  // Only marks that can show inside the badge (b.r is its outer radius; 230 covers any badge on the artboard).
  const R = (b.r ?? 230) + s * 0.6;
  let d = '', i = 0;
  for (let row = 0, y = b.cy - R; y < b.cy + R; y += s * 0.87, row++) {
    for (let x = b.cx - R + (row % 2 ? s / 2 : 0); x < b.cx + R; x += s) { if (Math.hypot(x - b.cx, y - b.cy) <= R) d += mark(x, y, i++); }
  }
  return d;
}
function burstMark(x, y, r) {
  let d = circleD(x, y, r * 0.22);
  for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; d += capsule(x + Math.cos(a) * r * 0.68, y + Math.sin(a) * r * 0.68, r * 0.34, r * 0.13, (a * 180) / Math.PI); }
  return d;
}
function flake(x, y, r) {
  let d = circleD(x, y, r * 0.18);
  for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; d += capsule(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.5, r * 0.11, (a * 180) / Math.PI); }
  return d;
}
/** A capsule centred at (x, y), half-length l, half-width w, rotated `deg`. */
export function capsule(x, y, l, w, deg) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const L = l - w;
  const p = (u, v) => [x + u * c - v * s, y + u * s + v * c];
  return `M${P(...p(-L, -w))}L${P(...p(L, -w))}A${f(w)} ${f(w)} 0 0 1 ${P(...p(L, w))}L${P(...p(-L, w))}A${f(w)} ${f(w)} 0 0 1 ${P(...p(-L, -w))}Z`;
}
function leaf(x, y, r, deg) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const p = (u, v) => P(x + u * c - v * s, y + u * s + v * c);
  return `M${p(-r, 0)}Q${p(0, -r * 0.7)} ${p(r, 0)}Q${p(0, r * 0.7)} ${p(-r, 0)}Z`;
}

/**
 * A tiled pattern: each mark variant is drawn once at the origin and placed with <use> on an offset grid inside the
 * badge. `marks` are path data centred on (0, 0). Much smaller than one long path when a mark has many parts.
 */
export const MARKS = {
  firework: (r) => burstMark(0, 0, r),
  snowflake: (r) => flake(0, 0, r),
  star: (r) => roundPoly(starPts(0, 0, r, r * 0.45, 5), 1.5),
  twinkle: (r) => pts4(0, 0, r),
  heart: (w) => heartD(0, 0, w),
  dot: (r) => circleD(0, 0, r),
  crescent: (r) => `M${P(r * 0.3, -r)}A${f(r)} ${f(r)} 0 1 0 ${P(r * 0.3, r)}A${f(r * 0.78)} ${f(r * 0.78)} 0 1 1 ${P(r * 0.3, -r)}Z`,
  flower: (r) => [0, 1, 2, 3, 4].map((k) => ellD(Math.cos((k * 2 * Math.PI) / 5 - Math.PI / 2) * r * 0.62, Math.sin((k * 2 * Math.PI) / 5 - Math.PI / 2) * r * 0.62, r * 0.42, r * 0.42)).join('') + circleD(0, 0, r * 0.3),
  shamrock: (r) => [0, 1, 2].map((k) => heartD(Math.cos((k * 2 * Math.PI) / 3 - Math.PI / 2) * r * 0.5, Math.sin((k * 2 * Math.PI) / 3 - Math.PI / 2) * r * 0.5, r * 0.9)).join(''),
  leaf: (r) => leaf(0, 0, r, -35),
  diamond: (r) => `M0 ${f(-r)}L${f(r)} 0L0 ${f(r)}L${f(-r)} 0Z`,
};
export function tiled(ID, b, s, marks) {
  const defs = marks.map((d, i) => path(d, { id: `${ID}-pm${i}` }));
  let uses = '';
  grid(b, s, (x, y, i) => { uses += use(`${ID}-pm${i % marks.length}`, { x: f(x), y: f(y) }); return ''; });
  return { defs, uses };
}

// ───────────────────────────────────────────── badge

/**
 * The enamel badge behind the hero. `d` is its outline; `c1`/`c2` the top/bottom enamel colours; `pattern` a path
 * clipped inside it. Returns { defs, art, d } — `d` joins the die-cut silhouette.
 */
export function badge(ID, { d, cx, cy, c1, c2, pattern = '', tile = null, patternFill = '#ffffff', patternOpacity = 0.16, stitch = '#ffffff', stitchOpacity = 0.55, inset = 0.88, ink, inside = '' }) {
  const dark = ink ?? darken(c2, 0.45);
  const k = inset;
  const back = (s) => `${ID}-${s}`;
  // The outline is drawn once and reused: fill, clip, shine, bevel, stitched ring, rim and the die-cut silhouette.
  const bd = (a = {}) => use(back('bd'), a);
  const defs = [
    path(d, { id: back('bd') }),
    lin(back('bg'), 0, 0, 0, 1, [[0, c1], [1, c2]]),
    E('clipPath', { id: back('bclip') }, bd()),
    lin(back('bev'), 0, 0, 0, 1, [[0, '#ffffff', 0.5], [0.45, '#ffffff', 0], [0.6, '#000000', 0], [1, '#000000', 0.3]]),
    rad(back('shine'), 0.32, 0.22, 0.7, [[0, '#ffffff', 0.32], [1, '#ffffff', 0]]),
    ...(tile ? tile.defs : []),
  ];
  const art = [
    bd({ fill: `url(#${back('bg')})` }),
    G({ 'clip-path': `url(#${back('bclip')})` },
      pattern ? path(pattern, { fill: patternFill, opacity: patternOpacity }) : '',
      tile ? G({ fill: patternFill, opacity: patternOpacity }, tile.uses) : '',
      inside,
      bd({ fill: `url(#${back('shine')})` }),
      bd({ fill: 'none', stroke: `url(#${back('bev')})`, 'stroke-width': 22 }),
    ),
    // the stitched inner ring: the outline scaled about the centre
    G({ transform: `translate(${f(cx)} ${f(cy)}) scale(${k}) translate(${f(-cx)} ${f(-cy)})` },
      bd({ fill: 'none', stroke: stitch, 'stroke-width': f(4 / k), 'stroke-dasharray': `${f(10 / k)} ${f(9 / k)}`, 'stroke-linecap': 'round', opacity: stitchOpacity })),
    bd({ fill: 'none', stroke: dark, 'stroke-width': 6, 'stroke-linejoin': 'round' }),
  ].join('');
  return { defs, art, d, sil: bd() };
}

/** A dark ink outline traced from a silhouette symbol (drawn under the hero's paint). */
export const inkUnder = (silId, ink, w = 12) => use(silId, { fill: ink, stroke: ink, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });

// ───────────────────────────────────────────── faces

/**
 * A face: eyes `gap` apart (centres at cx ± gap/2), `s` = eye height.
 * expr: happy · joy · wink · gasp · sleepy · cheeky · starry · proud · shy · sing · determined
 */
export function face(cx, cy, gap, s, expr = 'happy', o = {}) {
  const ink = o.ink ?? PLUM;
  const cheek = o.cheek ?? CHEEK;
  const MOUTH = o.mouth ?? '#6b1f35';
  const TONGUE = o.tongue ?? '#ff7a8a';
  const look = o.look ?? 0;                       // −1…1: eyes glance left/right
  const lx = cx - gap / 2, rx = cx + gap / 2;
  const w = s * 0.62;                             // eye width
  const sw = Math.max(3, s * 0.2);                // stroke for line eyes and mouths
  const line = (d, extra = {}) => path(d, { fill: 'none', stroke: ink, 'stroke-width': f(sw), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra });
  const open = (x, big = 1) => {
    const ex = x + look * w * 0.25;
    return ellipse(ex, cy, (w / 2) * big, (s / 2) * big, { fill: ink })
      + circle(ex - w * 0.16 * big, cy - s * 0.2 * big, s * 0.17 * big, { fill: '#ffffff' })
      + circle(ex + w * 0.16 * big, cy + s * 0.18 * big, s * 0.07 * big, { fill: '#ffffff' });
  };
  const starEye = (x) => ellipse(x, cy, w / 2 * 1.1, s / 2 * 1.1, { fill: ink }) + path(roundPoly(starPts(x - w * 0.08, cy - s * 0.1, s * 0.26, s * 0.11, 5), 0.8), { fill: '#ffe066' }) + circle(x + w * 0.2, cy + s * 0.22, s * 0.06, { fill: '#ffffff' });
  const happy = (x) => line(`M${P(x - w * 0.6, cy + s * 0.12)}Q${P(x, cy - s * 0.5)} ${P(x + w * 0.6, cy + s * 0.12)}`);
  const shut = (x) => line(`M${P(x - w * 0.6, cy - s * 0.05)}Q${P(x, cy + s * 0.35)} ${P(x + w * 0.6, cy - s * 0.05)}`);
  const my = cy + s * 0.95;                        // mouth line
  const mw = gap * 0.32;                           // mouth half-width
  const mouths = {
    smile: () => line(`M${P(cx - mw, my)}Q${P(cx, my + mw * 0.9)} ${P(cx + mw, my)}`),
    grin: () => path(`M${P(cx - mw * 1.1, my - mw * 0.1)}Q${P(cx, my + mw * 1.6)} ${P(cx + mw * 1.1, my - mw * 0.1)}Z`, { fill: MOUTH })
      + path(`M${P(cx - mw * 0.55, my + mw * 0.55)}Q${P(cx, my + mw * 0.15)} ${P(cx + mw * 0.55, my + mw * 0.55)}Q${P(cx, my + mw * 0.95)} ${P(cx - mw * 0.55, my + mw * 0.55)}Z`, { fill: TONGUE }),
    o: () => ellipse(cx, my + mw * 0.3, mw * 0.42, mw * 0.55, { fill: MOUTH }),
    tongue: () => line(`M${P(cx - mw, my)}Q${P(cx, my + mw * 0.8)} ${P(cx + mw, my)}`) + path(`M${P(cx + mw * 0.05, my + mw * 0.32)}q${f(mw * 0.15)} ${f(mw * 0.75)} ${f(mw * 0.5)} ${f(mw * 0.05)}`, { fill: TONGUE }),
    cat: () => line(`M${P(cx - mw, my)}q${f(mw / 2)} ${f(mw * 0.55)} ${f(mw)} 0q${f(mw / 2)} ${f(mw * 0.55)} ${f(mw)} 0`),
    tiny: () => line(`M${P(cx - mw * 0.55, my)}Q${P(cx, my + mw * 0.5)} ${P(cx + mw * 0.55, my)}`),
    sing: () => ellipse(cx, my + mw * 0.35, mw * 0.5, mw * 0.68, { fill: MOUTH }) + ellipse(cx, my + mw * 0.68, mw * 0.3, mw * 0.2, { fill: TONGUE }),
    flat: () => line(`M${P(cx - mw * 0.6, my + mw * 0.2)}Q${P(cx, my + mw * 0.4)} ${P(cx + mw * 0.6, my + mw * 0.1)}`),
  };
  const E2 = {
    happy: [open, open, 'smile'], joy: [happy, happy, 'grin'], wink: [happy, open, 'tongue'], gasp: [(x) => open(x, 1.15), (x) => open(x, 1.15), 'o'],
    sleepy: [shut, shut, 'tiny'], cheeky: [open, open, 'cat'], starry: [starEye, starEye, 'grin'], proud: [happy, happy, 'smile'],
    shy: [open, open, 'tiny'], sing: [happy, happy, 'sing'], determined: [open, open, 'flat'],
  }[expr];
  let out = E2[0](lx) + E2[1](rx) + mouths[E2[2]]();
  if (expr === 'determined') out += line(`M${P(lx - w * 0.6, cy - s * 0.85)}L${P(lx + w * 0.5, cy - s * 0.65)}M${P(rx + w * 0.6, cy - s * 0.85)}L${P(rx - w * 0.5, cy - s * 0.65)}`);
  if (o.cheeks !== false) {
    const cr = s * (expr === 'shy' ? 0.5 : 0.38);
    out += ellipse(lx - w * 0.55, cy + s * 0.7, cr * 1.3, cr * 0.8, { fill: cheek, opacity: 0.7 }) + ellipse(rx + w * 0.55, cy + s * 0.7, cr * 1.3, cr * 0.8, { fill: cheek, opacity: 0.7 });
  }
  return out;
}

// ───────────────────────────────────────────── finishing

/** A soft four-point sparkle with a white core. */
export const sparkle = (x, y, r, fill = '#ffe9a3') => path(pts4(x, y, r), { fill }) + path(pts4(x, y, r * 0.45), { fill: '#ffffff' });

/** A glossy highlight: a curved capsule streak. */
export const gloss = (d, o = 0.55) => path(d, { fill: '#ffffff', opacity: o });

/**
 * The sticker document. `sil` is the union silhouette (badge outline + hero shapes), already in 512 space.
 * Die-cut: border stroke 40 (white), hairline 43 at 0.1, shadow 40 at 0.2 shifted 6 plus 48 at 0.08 shifted 10.
 */
export function stickerDoc(ID, concept, defs, sil, art) {
  return compactSvg(stickerDocRaw(ID, concept, defs, sil, art));
}
function stickerDocRaw(ID, concept, defs, sil, art) {
  const silId = `${ID}-sil`;
  const edge = (w) => ({ 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  return doc(concept, [...defs, E('g', { id: silId }, sil)], [
    '\n<!-- die-cut: soft two-step drop shadow, hairline edge, white border -->\n',
    use(silId, { transform: 'translate(0 10)', fill: '#1a1030', stroke: '#1a1030', ...edge(48), opacity: 0.08 }),
    use(silId, { transform: 'translate(0 6)', fill: '#1a1030', stroke: '#1a1030', ...edge(40), opacity: 0.2 }),
    use(silId, { fill: PLUM, stroke: PLUM, ...edge(43), opacity: 0.1 }),
    use(silId, { fill: '#fff', stroke: '#fff', ...edge(40) }),
    '\n<!-- the art -->\n',
    art,
  ], '0 0 512 512');
}

export { f, P, mix, lighten, darken, E, G, path, circle, ellipse, use, lin, rad, roundPoly, starPts, smooth, rng };
