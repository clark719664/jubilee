/**
 * art.ts — the bigger drawings Wish Post animates: the sky lantern, the diya, the hopes jar, the
 * thank-you leaf, the wish star, the envelope (built from parts so CSS 3D can fold it), the mailbox
 * and the gratitude tree. Same sticker style as the chips: closed shapes, 3-unit ink outline, every
 * part overlapping the part it hangs from. Respect rules: no face on the diya or any lamp.
 *
 * Gradient ids are unique per drawing (a counter), so many lanterns on one page never share or clash.
 */
import { svg } from '../../ui/dom';
import { chipIcon } from './chip-icons';
import type { IconId } from './skins';

const INK = '#2b2140';
let uidN = 0;
const uid = (p: string): string => `wish-${p}-${++uidN}`;
const base = (w = 3): Record<string, string | number> => ({ stroke: INK, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const P = (d: string, fill: string, w = 3, extra: Record<string, string | number> = {}): SVGPathElement => svg('path', { d, fill, ...base(w), ...extra });

function grad(id: string, stops: readonly (readonly [number, string, number?])[], radial: Record<string, string | number> | null = null, linear: Record<string, string | number> = { x1: 0, y1: 0, x2: 0, y2: 1 }): SVGElement {
  const g = radial ? svg('radialGradient', { id, ...radial }) : svg('linearGradient', { id, ...linear });
  for (const [o, c, a] of stops) g.append(svg('stop', { offset: o, 'stop-color': c, ...(a !== undefined ? { 'stop-opacity': a } : {}) }));
  return g;
}

function frame(viewBox: string, cls: string, label?: string): SVGSVGElement {
  return svg('svg', { viewBox, class: cls, ...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' }), focusable: 'false' });
}

/** Up to `n` chip pictures in a row, centered on (cx, cy), each `s` wide. */
function iconRow(icons: readonly IconId[], cx: number, cy: number, s: number, n: number): SVGElement {
  const g = svg('g', {});
  const list = icons.slice(0, n);
  const gap = s * 0.08;
  const total = list.length * s + (list.length - 1) * gap;
  list.forEach((id, i) => {
    const el = chipIcon(id, s);
    el.setAttribute('x', String(cx - total / 2 + i * (s + gap)));
    el.setAttribute('y', String(cy - s / 2));
    g.append(el);
  });
  return g;
}

/** Sky lantern (kongming style): warm paper body, rim, a small flame inside the opening. 120×160. */
export function lanternArt(icons: readonly IconId[] = [], hue = '#ff5a3c'): SVGSVGElement {
  const el = frame('0 0 120 160', 'wish-art wish-lantern');
  const body = uid('lb');
  const glow = uid('lg');
  el.append(svg('defs', {},
    grad(body, [[0, '#ffe6a8'], [0.45, '#ffb25c'], [1, hue]], { cx: 0.5, cy: 0.62, r: 0.7 }),
    grad(glow, [[0, '#ffd166', 0.75], [1, '#ffd166', 0]], { cx: 0.5, cy: 0.5, r: 0.5 }),
  ));
  el.append(svg('circle', { cx: 60, cy: 92, r: 64, fill: `url(#${glow})`, class: 'wish-glow' }));
  // Body: wider at the top, rounded shoulders, open at the bottom rim.
  el.append(P('M12 24 Q60 2 108 24 L96 128 Q60 138 24 128 Z', `url(#${body})`));
  el.append(P('M38 14 Q34 70 42 133 M82 14 Q86 70 78 133', 'none', 2, { opacity: 0.4 }));
  el.append(iconRow(icons, 60, 72, 28, 3));
  if (icons.length > 3) el.append(iconRow(icons.slice(3), 60, 102, 24, 2));
  // Rim and the little flame peeking out of the opening.
  el.append(P('M50 138 Q60 150 70 138 Q66 130 60 126 Q54 130 50 138 Z', '#ffd23f', 2.4));
  el.append(P('M28 126 Q60 138 92 126 L91 134 Q60 146 29 134 Z', '#c9562b'));
  return el;
}

/** Clay lamp (diya) with a flame and a soft glow; patterned, never a face. 160×130. */
export function diyaArt(): SVGSVGElement {
  const el = frame('0 0 160 130', 'wish-art wish-diya');
  const glow = uid('dg');
  const clay = uid('dc');
  el.append(svg('defs', {},
    grad(glow, [[0, '#fff1a8', 0.95], [0.4, '#ffb703', 0.45], [1, '#ffb703', 0]], { cx: 0.5, cy: 0.5, r: 0.5 }),
    grad(clay, [[0, '#f08a3c'], [1, '#b8461d']]),
  ));
  el.append(svg('circle', { cx: 80, cy: 40, r: 44, fill: `url(#${glow})`, class: 'wish-glow' }));
  el.append(P('M80 12 Q94 34 86 50 Q80 56 74 50 Q66 34 80 12 Z', '#ffb703'));
  el.append(P('M80 26 Q87 39 83 48 Q80 51 77 48 Q73 39 80 26 Z', '#fff1a8', 2));
  el.append(P('M14 62 Q80 52 146 62 Q140 104 80 112 Q20 104 14 62 Z', `url(#${clay})`));
  el.append(P('M14 62 Q80 74 146 62', 'none', 3));
  el.append(P('M30 86 Q38 80 46 86 Q54 92 62 86 Q70 80 78 86 Q86 92 94 86 Q102 80 110 86 Q118 92 126 86', 'none', 2.6, { stroke: '#ffd23f' }));
  for (const x of [40, 64, 96, 120]) el.append(svg('circle', { cx: x, cy: 97, r: 3.4, fill: '#ffd23f', ...base(1.6) }));
  el.append(P('M58 112 Q80 116 102 112 L98 120 Q80 124 62 120 Z', '#8c3313'));
  return el;
}

/** Glass hopes jar with a lid and rolled slips inside (`slips` colors, newest on top). 160×200. */
export function jarArt(slips: readonly string[] = []): SVGSVGElement {
  const el = frame('0 0 160 200', 'wish-art wish-jar');
  const glass = uid('jg');
  const glow = uid('jw');
  el.append(svg('defs', {},
    grad(glass, [[0, '#eaf7ff', 0.78], [0.45, '#d4efff', 0.42], [1, '#a9dcff', 0.72]], null, { x1: 0, y1: 0, x2: 1, y2: 0 }),
    grad(glow, [[0, '#ffd166', 0.6], [1, '#ffd166', 0]], { cx: 0.5, cy: 0.6, r: 0.5 }),
  ));
  el.append(svg('ellipse', { cx: 80, cy: 128, rx: 78, ry: 66, fill: `url(#${glow})`, class: 'wish-glow' }));
  // Slips stack from the bottom up in loose rows.
  const g = svg('g', { class: 'wish-jar-slips' });
  slips.slice(-21).forEach((c, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const x = 48 + col * 32 + (row % 2) * 12;
    const y = 166 - row * 18;
    const rot = ((i * 37) % 56) - 28;
    g.append(svg('rect', { x: x - 17, y: y - 7, width: 34, height: 14, rx: 7, fill: c, transform: `rotate(${rot} ${x} ${y})`, ...base(2.2) }));
    g.append(svg('path', { d: `M${x - 9} ${y} H${x + 9}`, stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.35, transform: `rotate(${rot} ${x} ${y})` }));
  });
  el.append(g);
  el.append(P('M34 40 Q30 52 26 64 Q18 86 18 128 Q18 188 80 188 Q142 188 142 128 Q142 86 134 64 Q130 52 126 40 Z', `url(#${glass})`));
  el.append(P('M34 54 Q30 92 32 150', 'none', 5, { stroke: '#ffffff', opacity: 0.8 }));
  el.append(svg('rect', { x: 30, y: 22, width: 100, height: 22, rx: 8, fill: '#ffd166', ...base() }));
  el.append(P('M38 33 H122', 'none', 2, { opacity: 0.5 }));
  return el;
}

const SLIP_COLORS = ['#ffd6e0', '#fff1a8', '#c8f0d8', '#d6e8ff', '#ffe0c2', '#e6d6ff'];
export function slipColor(i: number): string {
  return SLIP_COLORS[((i % SLIP_COLORS.length) + SLIP_COLORS.length) % SLIP_COLORS.length]!;
}

const LEAF_COLORS = ['#e8742c', '#d9442b', '#f2b134', '#b8541f', '#c9a227'];
export function leafColor(i: number): string {
  return LEAF_COLORS[((i % LEAF_COLORS.length) + LEAF_COLORS.length) % LEAF_COLORS.length]!;
}

/** A thank-you leaf (rounded maple) with a stem and veins; chips painted on it. 120×120. */
export function leafArt(color = '#e8742c', icons: readonly IconId[] = []): SVGSVGElement {
  const el = frame('0 0 120 120', 'wish-art wish-leaf');
  el.append(P('M60 104 Q58 112 52 116', 'none', 5));
  el.append(P('M60 104 Q58 112 52 116', 'none', 2.6, { stroke: '#7a4b2a' }));
  el.append(P('M60 8 Q66 22 74 20 Q84 14 92 18 Q88 30 94 36 Q106 38 112 46 Q100 54 102 62 Q106 74 98 80 Q86 76 80 84 Q74 96 60 106 Q46 96 40 84 Q34 76 22 80 Q14 74 18 62 Q20 54 8 46 Q14 38 26 36 Q32 30 28 18 Q36 14 46 20 Q54 22 60 8 Z', color));
  el.append(P('M60 104 V30 M60 72 L36 52 M60 72 L84 52 M60 88 L42 78 M60 88 L78 78', 'none', 2, { opacity: 0.35 }));
  el.append(iconRow(icons, 60, 56, 24, 2));
  return el;
}

/** A chunky wish star with a soft glow and a shine. 120×120. */
export function starArt(icons: readonly IconId[] = [], fill = '#ffd23f'): SVGSVGElement {
  const el = frame('0 0 120 120', 'wish-art wish-star');
  const glow = uid('sg');
  el.append(svg('defs', {}, grad(glow, [[0, '#fff6c2', 0.85], [1, '#fff6c2', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })));
  el.append(svg('circle', { cx: 60, cy: 62, r: 58, fill: `url(#${glow})`, class: 'wish-glow' }));
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 50 : 24;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(60 + r * Math.cos(a)).toFixed(1)} ${(64 + r * Math.sin(a)).toFixed(1)}`);
  }
  el.append(P(`M${pts.join('L')}Z`, fill, 4));
  el.append(P('M44 44 Q50 36 58 33 Q52 42 50 50 Z', '#ffffff', 0, { stroke: 'none', opacity: 0.6 }));
  el.append(iconRow(icons, 60, 68, 22, 2));
  return el;
}

/** Wax seal: a round blob with a star (santa) or a heart (love). 60×60. */
export function sealArt(kind: 'star' | 'heart'): SVGSVGElement {
  const el = frame('0 0 60 60', 'wish-seal');
  el.append(P('M30 4 Q38 6 44 8 Q52 14 54 22 Q58 30 54 38 Q52 46 44 52 Q36 58 30 56 Q22 58 14 52 Q6 46 6 38 Q2 30 6 22 Q8 14 16 8 Q22 4 30 4 Z', kind === 'heart' ? '#e0306f' : '#d62839'));
  el.append(svg('circle', { cx: 30, cy: 30, r: 16, fill: 'none', stroke: '#ffffff', 'stroke-width': 2, opacity: 0.45 }));
  el.append(kind === 'heart'
    ? P('M30 40 C21 33 20 26 25 24 C28 23 30 26 30 26 C30 26 32 23 35 24 C40 26 39 33 30 40 Z', '#ffd1e0', 2)
    : P('M30 18 L33.5 26 L42 26.5 L35.5 32 L37.5 40.5 L30 36 L22.5 40.5 L24.5 32 L18 26.5 L26.5 26 Z', '#ffe08a', 2));
  return el;
}

/** Envelope back (with its inside lining) and pocket front. The flap is separate so it can rotate. 240×160. */
export function envelopeBack(color: string, lining: string): SVGSVGElement {
  const el = frame('0 0 240 160', 'wish-env-svg');
  el.append(svg('rect', { x: 4, y: 4, width: 232, height: 152, rx: 12, fill: color, ...base() }));
  el.append(P('M8 10 L120 92 L232 10', lining, 0, { stroke: 'none' }));
  return el;
}

export function envelopePocket(color: string, shade: string): SVGSVGElement {
  const el = frame('0 0 240 160', 'wish-env-svg');
  el.append(P('M4 18 L108 96 Q120 104 132 96 L236 18 V144 Q236 156 224 156 H16 Q4 156 4 144 Z', color));
  el.append(P('M4 144 L96 82 M236 144 L144 82', 'none', 3, { stroke: shade }));
  return el;
}

export function envelopeFlap(color: string): SVGSVGElement {
  const el = frame('0 0 240 110', 'wish-env-svg');
  el.append(P('M4 4 H236 Q238 8 232 14 L132 92 Q120 100 108 92 L8 14 Q2 8 4 4 Z', color));
  return el;
}

/** The Christmas mailbox: rounded red box on a post, slot, and a flag that is up when a reply waits. 160×190. */
export function mailboxArt(flagUp: boolean): SVGSVGElement {
  const el = frame('0 0 184 190', `wish-art wish-mailbox${flagUp ? ' is-flag-up' : ''}`);
  const red = uid('pr');
  el.append(svg('defs', {}, grad(red, [[0, '#ff6b6b'], [1, '#c81d3c']], null, { x1: 0, y1: 0, x2: 1, y2: 0 })));
  el.append(svg('rect', { x: 68, y: 112, width: 24, height: 74, rx: 4, fill: '#7a4b2a', ...base() }));
  el.append(P('M54 184 H106', 'none', 5));
  // Flag arm pivots at its base (rotated down when there is no mail).
  const flag = svg('g', { class: 'wish-mailbox-flag', transform: flagUp ? '' : 'rotate(90 148 86)' });
  flag.append(svg('rect', { x: 136, y: 32, width: 9, height: 58, rx: 3.5, fill: '#ffd23f', ...base() }));
  flag.append(P('M143 34 H176 Q179 34 179 37 V53 Q179 56 176 56 H143 Z', '#ff4d5e'));
  el.append(flag);
  el.append(P('M18 116 V64 Q18 24 80 24 Q142 24 142 64 V116 Z', `url(#${red})`));
  el.append(P('M30 112 V66 Q30 36 80 36', 'none', 3, { stroke: '#ffffff', opacity: 0.45 }));
  el.append(svg('rect', { x: 50, y: 58, width: 60, height: 12, rx: 6, fill: '#3a1020', ...base() }));
  el.append(svg('rect', { x: 14, y: 110, width: 132, height: 10, rx: 4, fill: '#8f1028', ...base() }));
  el.append(svg('circle', { cx: 141, cy: 86, r: 5, fill: '#ffd23f', ...base(2.4) }));
  // A little star badge instead of any lettering.
  el.append(P('M80 80 L84.7 90 L95.5 90.7 L87.2 97.6 L89.8 108.2 L80 102.4 L70.2 108.2 L72.8 97.6 L64.5 90.7 L75.3 90 Z', '#ffd23f', 2.4));
  return el;
}

/** A tiny envelope icon for mailbox rows (letters and replies). 64×44. */
export function miniEnvelope(color: string, seal: 'star' | 'heart' | null): SVGSVGElement {
  const el = frame('0 0 64 44', 'wish-mini-env');
  el.append(svg('rect', { x: 2, y: 2, width: 60, height: 40, rx: 6, fill: color, ...base(2.4) }));
  el.append(P('M4 5 L32 26 L60 5', 'none', 2.4));
  if (seal) el.append(seal === 'heart'
    ? P('M32 33 C25 28 25 23 28.5 22.5 C30.5 22.3 32 24.5 32 24.5 C32 24.5 33.5 22.3 35.5 22.5 C39 23 39 28 32 33 Z', '#e0306f', 1.8)
    : svg('circle', { cx: 32, cy: 27, r: 6.5, fill: '#d62839', ...base(1.8) }));
  return el;
}

type Pt = readonly [number, number];
/** Main branches of the gratitude tree as quadratic curves (start on the trunk, control, tip), 320×260 board. */
const BRANCHES: readonly (readonly [Pt, Pt, Pt])[] = [
  [[152, 168], [116, 150], [88, 102]],
  [[156, 172], [142, 104], [126, 50]],
  [[166, 172], [180, 104], [198, 48]],
  [[168, 168], [208, 148], [236, 102]],
  [[150, 184], [106, 178], [58, 146]],
  [[170, 186], [218, 180], [264, 146]],
];
/** Twigs: [branch, t along it, dx, dy]. */
const TWIGS: readonly (readonly [number, number, number, number])[] = [[1, 0.52, -32, -18], [2, 0.52, 32, -18], [0, 0.48, -12, -40], [3, 0.48, 12, -40]];

const qAt = ([a, c, b]: readonly [Pt, Pt, Pt], t: number): Pt => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};
/** Leaves point away from the trunk (their stems toward it). */
const outward = (x: number, y: number): number => Math.round((Math.atan2(y - 176, x - 160) * 180) / Math.PI + 90);
const twigLines = TWIGS.map(([bi, t, dx, dy]) => { const p = qAt(BRANCHES[bi]!, t); return [p, [p[0] + dx, p[1] + dy] as Pt] as const; });

/**
 * Leaf anchors on the gratitude tree [x, y, rotation]: branch tips, twig tips, then spots part-way along
 * the branches. Every one sits on wood, so a leaf always touches its tree (no floating leaves at 3x).
 */
export const TREE_SPOTS: readonly (readonly [number, number, number])[] = [
  ...BRANCHES.map((br) => br[2]),
  ...twigLines.map((l) => l[1]),
  ...BRANCHES.map((br) => qAt(br, 0.68)),
].map(([x, y]) => [Math.round(x), Math.round(y), outward(x, y)] as const);

/** The gratitude tree: a flared trunk, six curving branches and four twigs. 320×260. */
export function treeArt(): SVGSVGElement {
  const el = frame('0 0 320 260', 'wish-art wish-tree');
  el.append(P('M24 254 Q160 230 296 254 Z', '#8fc46f'));
  const d = [
    ...BRANCHES.map(([a, c, b]) => `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`),
    ...twigLines.map(([p, q]) => `M${p[0].toFixed(1)} ${p[1].toFixed(1)} L${q[0].toFixed(1)} ${q[1].toFixed(1)}`),
  ].join(' ');
  // Order: branch ink, trunk fill (no top edge), trunk sides, branch wood. Branches grow out of the
  // trunk with no seam across their bases, even at 3x.
  const trunk = 'M124 252 Q144 236 146 200 Q147.5 182 149.5 166 L172.5 166 Q174 182 174 200 Q176 236 196 252';
  el.append(P(d, 'none', 15));
  el.append(P(`${trunk} Z`, '#94603a', 0, { stroke: 'none' }));
  el.append(P('M124 252 Q144 236 146 200 Q147.5 182 149.5 166 M172.5 166 Q174 182 174 200 Q176 236 196 252 M124 252 H196', 'none', 3));
  el.append(P(d, 'none', 9, { stroke: '#94603a' }));
  el.append(P('M156 176 Q154 204 150 236', 'none', 2.4, { opacity: 0.35 }));
  return el;
}

/** A postage stamp for the letter's corner: a little tree under a star. 70×84. */
export function stampArt(): SVGSVGElement {
  const el = frame('0 0 70 84', 'wish-stamp');
  // Perforated edge: a scalloped path, drawn as one closed shape.
  let d = 'M6 6';
  for (let x = 6; x < 64; x += 6) d += ` Q${x + 3} 10 ${x + 6} 6`;
  for (let y = 6; y < 78; y += 6) d += ` Q60 ${y + 3} 64 ${y + 6}`;
  for (let x = 64; x > 6; x -= 6) d += ` Q${x - 3} 74 ${x - 6} 78`;
  for (let y = 78; y > 6; y -= 6) d += ` Q10 ${y - 3} 6 ${y - 6}`;
  el.append(P(`${d} Z`, '#fffdf8', 2));
  el.append(svg('rect', { x: 13, y: 13, width: 44, height: 58, rx: 3, fill: '#1b5e45', ...base(2) }));
  el.append(P('M35 24 L48 52 H22 Z', '#3cc47c', 2));
  el.append(svg('rect', { x: 31, y: 52, width: 8, height: 9, rx: 1.5, fill: '#b07a4f', ...base(2) }));
  el.append(P('M35 15 L37 20 L42 20.3 L38 23.4 L39.3 28.4 L35 25.6 L30.7 28.4 L32 23.4 L28 20.3 L33 20 Z', '#ffd23f', 1.6));
  return el;
}
