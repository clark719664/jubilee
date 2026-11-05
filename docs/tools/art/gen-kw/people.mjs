// people.mjs — the ART.md §13 people recipe for generators (a port of scratchpad/people/kit.py).
// Heads in head units (r = 1), scaled into place; hair is a crown that meets the face at the temples.
import { f, P, E, path, circle, ellipse, mix } from '../gen-xmas/lib.mjs';

const INK = '#2b1a4d';
const MOUTH = '#6b2b3a';

class Head {
  constructor(cx, cy, r) { this.cx = cx; this.cy = cy; this.r = r; }
  p(x, y) { return P(this.cx + x * this.r, this.cy + y * this.r); }
  L(v) { return f(v * this.r); }
}

/** The crown circle (centre (0, -d), radius R) sitting `pad` above the head, meeting the face at y_end. */
function crown(pad, yEnd) {
  const d = (pad * (2 + pad)) / (2 * (1 + pad) + 2 * yEnd);
  const R = 1 + pad - d;
  return { d, R, x: Math.sqrt(Math.max(0, 1 - yEnd * yEnd)) };
}

function cap(h, color, line, pad = 0.09, yEnd = 0.14) {
  const { R, x } = crown(pad, yEnd);
  let s = `M${h.p(-x, yEnd)}A${h.L(R)} ${h.L(R)} 0 1 1 ${h.p(x, yEnd)}`;
  for (const [c1, c2, e] of line) s += `C${h.p(...c1)} ${h.p(...c2)} ${h.p(...e)}`;
  return path(s + 'z', { fill: color });
}

export function features(h, gaze = 0, mouth = 'smile', blush = true) {
  const out = [];
  for (const sx of [-1, 1]) {
    const ex = sx * 0.34 + gaze;
    out.push(ellipse(h.cx + ex * h.r, h.cy + 0.08 * h.r, 0.115 * h.r, 0.15 * h.r, { fill: INK }));
    out.push(circle(h.cx + (ex - 0.035) * h.r, h.cy + 0.03 * h.r, 0.048 * h.r, { fill: '#fff' }));
  }
  if (blush) for (const sx of [-1, 1]) out.push(ellipse(h.cx + (sx * 0.56 + gaze * 0.4) * h.r, h.cy + 0.34 * h.r, 0.15 * h.r, 0.095 * h.r, { fill: '#ff8fb8', opacity: 0.55 }));
  const g = gaze * 0.5;
  if (mouth === 'smile') out.push(path(`M${h.p(-0.17 + g, 0.37)}Q${h.p(g, 0.56)} ${h.p(0.17 + g, 0.37)}`, { fill: 'none', stroke: MOUTH, 'stroke-width': Math.max(2, 0.12 * h.r), 'stroke-linecap': 'round' }));
  else if (mouth === 'open') {
    out.push(path(`M${h.p(-0.17 + g, 0.35)}Q${h.p(g, 0.37)} ${h.p(0.17 + g, 0.35)}Q${h.p(0.15 + g, 0.63)} ${h.p(g, 0.63)}Q${h.p(-0.15 + g, 0.63)} ${h.p(-0.17 + g, 0.35)}z`, { fill: MOUTH }));
    out.push(path(`M${h.p(-0.08 + g, 0.57)}Q${h.p(g, 0.49)} ${h.p(0.08 + g, 0.57)}Q${h.p(g, 0.62)} ${h.p(-0.08 + g, 0.57)}z`, { fill: '#ff7a8a' }));
  }
  return out.join('');
}

const lineSidePart = (part = -0.3, yEnd = 0.14) => { const x = Math.sqrt(1 - yEnd * yEnd); return [
  [[x - 0.06, -0.18], [0.62, -0.4], [0.2, -0.46]], [[-0.02, -0.49], [part + 0.08, -0.56], [part, -0.68]],
  [[part - 0.14, -0.52], [-0.72, -0.42], [-x + 0.04, -0.1]], [[-x + 0.01, -0.02], [-x, 0.06], [-x, yEnd]]]; };
const lineBangs = (yEnd = 0.14, depth = 0.3) => { const x = Math.sqrt(1 - yEnd * yEnd); return [
  [[x - 0.02, -0.12], [0.78, -depth + 0.02], [0.46, -depth]], [[0.2, -depth - 0.03], [-0.2, -depth - 0.03], [-0.46, -depth]],
  [[-0.78, -depth + 0.02], [-x + 0.02, -0.12], [-x, yEnd]]]; };
const lineCurly = (yEnd = 0.14) => { const x = Math.sqrt(1 - yEnd * yEnd); return [
  [[x - 0.04, -0.12], [0.8, -0.3], [0.58, -0.32]], [[0.5, -0.46], [0.28, -0.46], [0.2, -0.36]], [[0.08, -0.48], [-0.12, -0.48], [-0.2, -0.36]],
  [[-0.28, -0.46], [-0.5, -0.46], [-0.58, -0.32]], [[-0.8, -0.3], [-x + 0.04, -0.12], [-x, yEnd]]]; };
const lineShort = (yEnd = 0.02) => { const x = Math.sqrt(1 - yEnd * yEnd); return [
  [[x - 0.04, -0.2], [0.7, -0.44], [0.3, -0.5]], [[0.0, -0.54], [-0.3, -0.5], [-0.42, -0.62]], [[-0.58, -0.48], [-x + 0.06, -0.3], [-x, yEnd]]]; };

const PUFFS = [[-122, 0.98, 0.34], [-96, 1.04, 0.37], [-68, 1.04, 0.38], [-40, 1.03, 0.38], [-13, 1.03, 0.38], [13, 1.03, 0.38], [40, 1.03, 0.38], [68, 1.04, 0.38], [96, 1.04, 0.37], [122, 0.98, 0.34]];
const onCircle = (R, deg) => { const a = (deg * Math.PI) / 180; return [R * Math.sin(a), -R * Math.cos(a)]; };

const STYLES = {
  side: (h, c) => ['', cap(h, c, lineSidePart())],
  bun: (h, c, tie = '#ffd166') => {
    const [bx, by, br] = [-0.06, -1.04, 0.44];
    const behind = circle(h.cx + bx * h.r, h.cy + by * h.r, br * h.r, { fill: c })
      + path(`M${h.p(bx - 0.26, by - 0.06)}Q${h.p(bx - 0.14, by - 0.36)} ${h.p(bx + 0.16, by - 0.3)}Q${h.p(bx - 0.08, by - 0.24)} ${h.p(bx - 0.26, by - 0.06)}z`, { fill: mix(c, '#ffffff', 0.18) });
    const [t0, t1] = [(-17 + bx * 40) * Math.PI / 180, (13 + bx * 40) * Math.PI / 180]; const R = 1.03;
    const tieP = path(`M${h.p(R * Math.sin(t0), -R * Math.cos(t0))}A${h.L(R)} ${h.L(R)} 0 0 1 ${h.p(R * Math.sin(t1), -R * Math.cos(t1))}`, { fill: 'none', stroke: tie, 'stroke-width': Math.max(2, 0.14 * h.r), 'stroke-linecap': 'round' });
    return [behind, cap(h, c, lineSidePart()) + tieP];
  },
  bob: (h, c) => {
    const d = `M${h.p(-0.84, 0.88)}Q${h.p(-1.14, 0.86)} ${h.p(-1.15, 0.5)}L${h.p(-1.15, 0.05)}A${h.L(1.15)} ${h.L(1.15)} 0 0 1 ${h.p(1.15, 0.05)}L${h.p(1.15, 0.5)}Q${h.p(1.14, 0.86)} ${h.p(0.84, 0.88)}Q${h.p(0.6, 0.88)} ${h.p(0.62, 0.6)}L${h.p(-0.62, 0.6)}Q${h.p(-0.6, 0.88)} ${h.p(-0.84, 0.88)}z`;
    return [path(d, { fill: c }), cap(h, c, lineBangs(), 0.13, 0.14)];
  },
  short: (h, c) => ['', cap(h, c, lineShort(), 0.08, 0.02)],
  curls: (h, c) => [PUFFS.map(([deg, rr, s]) => { const [x, y] = onCircle(rr, deg); return circle(h.cx + x * h.r, h.cy + y * h.r, s * h.r, { fill: c }); }).join(''), cap(h, c, lineCurly(), 0.12, 0.14)],
  /** Two puffs (afro puffs) tied high either side. */
  puffs: (h, c, tie = '#ffd166') => {
    let behind = '';
    for (const sx of [-1, 1]) { behind += circle(h.cx + sx * 0.78 * h.r, h.cy - 0.82 * h.r, 0.46 * h.r, { fill: c }); behind += path(`M${h.p(sx * 0.5, -0.62)}Q${h.p(sx * 0.62, -0.82)} ${h.p(sx * 0.42, -0.9)}`, { fill: 'none', stroke: tie, 'stroke-width': Math.max(2, 0.12 * h.r), 'stroke-linecap': 'round' }); }
    return [behind, cap(h, c, lineCurly(), 0.12, 0.14)];
  },
  /** Close coils: a cap of small circles plus a curly hairline. */
  coils: (h, c) => [PUFFS.map(([deg, rr, s]) => { const [x, y] = onCircle(rr * 0.96, deg); return circle(h.cx + x * h.r, h.cy + y * h.r, s * 0.8 * h.r, { fill: c }); }).join(''), cap(h, c, lineCurly(), 0.08, 0.14)],
  /** Grey/white hair pulled up: bun style with white. */
  elder: (h, c) => STYLES.bun(h, c, '#d62828'),
};

const ears = (h, skin) => [-1, 1].map((sx) => circle(h.cx + sx * 0.97 * h.r, h.cy + 0.12 * h.r, 0.19 * h.r, { fill: skin })).join('');

/** A head: hair behind, face, hair in front, extras (a hat drawn by the caller goes after). */
export function head(cx, cy, r, skin, hair, style, { gaze = 0, mouth = 'smile', before = '', after = '' } = {}) {
  const h = new Head(cx, cy, r);
  const [behind, front] = STYLES[style](h, hair);
  const e = style === 'short' ? ears(h, skin) : '';
  return behind + e + circle(cx, cy, r, { fill: skin }) + features(h, gaze, mouth) + before + front + after;
}

/** A headwrap (gele-style): a wrapped band round the hairline with a knot on top; hair is hidden. */
export function headwrap(cx, cy, r, color, knot = color) {
  const h = new Head(cx, cy, r);
  const { R, x } = crown(0.14, 0.12);
  const wrap = path(`M${h.p(-x, 0.12)}A${h.L(R)} ${h.L(R)} 0 1 1 ${h.p(x, 0.12)}C${h.p(0.7, -0.3)} ${h.p(0.3, -0.42)} ${h.p(0, -0.42)}C${h.p(-0.3, -0.42)} ${h.p(-0.7, -0.3)} ${h.p(-x, 0.12)}z`, { fill: color });
  const knotP = path(`M${h.p(-0.1, -1.1)}C${h.p(-0.6, -1.5)} ${h.p(-0.4, -1.75)} ${h.p(0.05, -1.45)}C${h.p(0.5, -1.75)} ${h.p(0.7, -1.4)} ${h.p(0.2, -1.1)}z`, { fill: knot });
  const fold = path(`M${h.p(-0.9, -0.42)}Q${h.p(0, -0.72)} ${h.p(0.9, -0.42)}`, { fill: 'none', stroke: mix(color, '#000000', 0.22), 'stroke-width': Math.max(2, 0.09 * h.r), 'stroke-linecap': 'round' });
  return knotP + wrap + fold;
}

/**
 * A standing figure: torso, arms as tapered tubes with round hands, legs with shoes, a contact shadow.
 * `x` is the centre, `foot` the ground y, `H` the height to the top of the head; the head is r = H/(heads*2).
 * arms: [{ sx, elbow: [dx, dy], hand: [dx, dy] }] in units relative to the shoulder.
 */
export function figure({ x, foot, H, heads = 2.7, skin, hair, style, top, bottom, shoe = '#2a1a14', gaze = 0, mouth = 'smile', arms = [], hat = '', wrap = null, sleeves = true }) {
  const r = H / (heads * 2);
  const headY = foot - H + r;
  const neckTop = headY + r * 0.86;
  const torsoTop = headY + r * 1.35;
  const torsoBot = foot - H * 0.28;
  const tw = r * 1.9;
  const legW = r * 0.5;
  const out = [];
  out.push(ellipse(x, foot + 2, tw * 0.95, r * 0.28, { fill: '#000', opacity: 0.28 }));
  // legs and shoes
  for (const sx of [-1, 1]) {
    out.push(path(`M${P(x + sx * tw * 0.3, torsoBot - 6)}L${P(x + sx * tw * 0.32, foot - 4)}`, { fill: 'none', stroke: bottom, 'stroke-width': legW, 'stroke-linecap': 'round' }));
    out.push(path(`M${P(x + sx * tw * 0.32 - legW * 0.6, foot)}h${f(legW * 1.25)}a${f(legW * 0.3)} ${f(legW * 0.3)} 0 0 1 0 ${f(legW * 0.6)}h${f(-legW * 1.25)}a${f(legW * 0.3)} ${f(legW * 0.3)} 0 0 1 0 ${f(-legW * 0.6)}z`, { fill: shoe }));
  }
  // back arm(s) drawn before the torso when they reach behind
  const armP = (a) => {
    const sy = torsoTop + r * 0.45; const s = [x + a.sx * tw * 0.46, sy];
    const e = [s[0] + a.elbow[0] * r, s[1] + a.elbow[1] * r]; const hd = [s[0] + a.hand[0] * r, s[1] + a.hand[1] * r];
    const sleeve = sleeves ? path(`M${P(...s)}Q${P(...e)} ${P(...hd)}`, { fill: 'none', stroke: top, 'stroke-width': r * 0.62, 'stroke-linecap': 'round' }) : '';
    const fore = path(`M${P(...e)}L${P(...hd)}`, { fill: 'none', stroke: skin, 'stroke-width': r * 0.5, 'stroke-linecap': 'round' });
    return sleeve + (sleeves ? '' : fore) + circle(hd[0], hd[1], r * 0.34, { fill: skin });
  };
  for (const a of arms) if (a.back) out.push(armP(a));
  // neck and torso
  out.push(path(`M${P(x - r * 0.26, neckTop)}h${f(r * 0.52)}v${f(torsoTop - neckTop + 4)}h${f(-r * 0.52)}z`, { fill: mix(skin, '#000000', 0.12) }));
  out.push(path(`M${P(x - tw / 2, torsoTop + r * 0.3)}q0 ${f(-r * 0.3)} ${f(r * 0.3)} ${f(-r * 0.3)}h${f(tw - r * 0.6)}q${f(r * 0.3)} 0 ${f(r * 0.3)} ${f(r * 0.3)}v${f(torsoBot - torsoTop - r * 0.3)}q0 ${f(r * 0.3)} ${f(-r * 0.3)} ${f(r * 0.3)}h${f(-(tw - r * 0.6))}q${f(-r * 0.3)} 0 ${f(-r * 0.3)} ${f(-r * 0.3)}z`, { fill: top }));
  for (const a of arms) if (!a.back) out.push(armP(a));
  // head
  if (wrap) out.push(circle(x, headY, r, { fill: skin }) + features(new Head(x, headY, r), gaze, mouth) + headwrap(x, headY, r, wrap.color, wrap.knot));
  else out.push(head(x, headY, r, skin, hair, style, { gaze, mouth, after: hat }));
  return { svg: out.join(''), r, headY, torsoTop, torsoBot, tw, shoulderY: torsoTop + r * 0.45, hand: (a) => { const sy = torsoTop + r * 0.45; return [x + a.sx * tw * 0.46 + a.hand[0] * r, sy + a.hand[1] * r]; } };
}
