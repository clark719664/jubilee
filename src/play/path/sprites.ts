/**
 * sprites.ts — the little vector things on the board: items to collect, obstacles and the goal, drawn in
 * the app's die-cut sticker style (chunky shapes, one dark ink outline, a white cut edge and a soft drop
 * shadow) so they sit happily next to the holiday stickers. Everything is built with svg() in a 100×100
 * box; the board scales them to the cell.
 *
 * Items have two looks: "lights" (diya, lantern, porch pumpkin) keep their place and light up when Jubi
 * reaches them (a `.pth-lit` layer and a `.pth-glow` halo the CSS fades in); "pickups" fly away (CSS on
 * `.is-done`). Respect rules from the art brief: no faces on sacred objects (the diya is a plain lamp);
 * faces only on the snowman and the jack-o'-lantern; no text or symbols on the red envelope.
 */
import { svg } from '../../ui/dom';
import type { BlockKind, GoalKind, ItemKind } from './skins';

const INK = '#2a1d3d';
const SW = 3;

type Attrs = Record<string, string | number>;
const line = (o: Attrs = {}): Attrs => ({ stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...o });

const P = (d: string, fill: string, o: Attrs = {}): SVGPathElement => svg('path', { d, fill, ...line(o) });
const C = (cx: number, cy: number, r: number, fill: string, o: Attrs = {}): SVGCircleElement => svg('circle', { cx, cy, r, fill, ...line(o) });
const E = (cx: number, cy: number, rx: number, ry: number, fill: string, o: Attrs = {}): SVGEllipseElement => svg('ellipse', { cx, cy, rx, ry, fill, ...line(o) });
const R = (x: number, y: number, w: number, h: number, rx: number, fill: string, o: Attrs = {}): SVGRectElement => svg('rect', { x, y, width: w, height: h, rx, fill, ...line(o) });
/** Interior detail: no outline. */
/** Interior detail: no ink outline (line-only details keep their own colored stroke). */
const d = (el: SVGElement): SVGElement => { if (el.getAttribute('fill') !== 'none') el.setAttribute('stroke', 'none'); el.setAttribute('data-cut', 'no'); return el; };

/** Recolors a clone of the silhouette (white cut edge or shadow); details without a fill drop out. */
function silhouette(parts: readonly SVGElement[], fill: string, widen: number, dy: number, opacity: number): SVGGElement {
  const g = svg('g', { 'aria-hidden': 'true', ...(dy ? { transform: `translate(0 ${dy})` } : {}), ...(opacity < 1 ? { opacity } : {}) });
  for (const part of parts) {
    if (part.getAttribute('data-cut') === 'no') continue;
    const k = part.cloneNode(true) as SVGElement;
    for (const el of [k, ...Array.from(k.querySelectorAll<SVGElement>('*'))]) {
      const hollow = el.getAttribute('fill') === 'none';
      if (hollow && el.getAttribute('stroke') === 'none') continue;
      // Outlines-only shapes (wicks, handles, strings) stay strokes, so their open curves never fill in.
      if (!hollow) el.setAttribute('fill', fill);
      el.setAttribute('stroke', fill);
      el.setAttribute('stroke-width', String(Number(el.getAttribute('stroke-width') ?? SW) + widen));
      el.setAttribute('stroke-linejoin', 'round');
      el.removeAttribute('stroke-dasharray');
      el.removeAttribute('opacity');
    }
    g.append(k);
  }
  return g;
}

/** Shadow + white cut edge + the art, as one group. */
function sticker(parts: readonly SVGElement[], cut = 9, shadow = true): SVGGElement {
  const g = svg('g', { class: 'pth-sticker' });
  if (shadow) g.append(silhouette(parts, '#000000', cut, 4, 0.16));
  if (cut > 0) g.append(silhouette(parts, '#ffffff', cut, 0, 1));
  g.append(svg('g', {}, ...parts));
  return g;
}

const box = (cls: string, ...children: SVGElement[]): SVGSVGElement =>
  svg('svg', { viewBox: '0 0 100 100', class: cls, 'aria-hidden': 'true', focusable: 'false', overflow: 'visible' }, ...children);

/** A soft round glow behind something that lights up (no hard edge: three stacked, fading discs). */
function glow(cx: number, cy: number, r: number, color: string): SVGGElement {
  return svg('g', { class: 'pth-glow' },
    svg('circle', { cx, cy, r, fill: color, opacity: 0.16 }),
    svg('circle', { cx, cy, r: r * 0.72, fill: color, opacity: 0.2 }),
    svg('circle', { cx, cy, r: r * 0.45, fill: color, opacity: 0.26 }));
}

// ── items ────────────────────────────────────────────────────────────────

export const LIGHTS: ReadonlySet<ItemKind> = new Set(['diya', 'lantern', 'pumpkin']);

function present(): SVGElement[] {
  return [
    R(24, 46, 52, 38, 5, '#e94a5a'),
    d(R(29, 50, 10, 30, 3, '#ff7b88')),
    R(20, 36, 60, 14, 4, '#ff6b7a'),
    d(R(45, 36, 10, 48, 0, '#ffd166')), P('M45 36v48M55 36v48', 'none'),
    P('M50 36C44 22 28 22 34 32C37 36 44 36 50 36Z', '#ffd166'),
    P('M50 36C56 22 72 22 66 32C63 36 56 36 50 36Z', '#ffd166'),
    C(50, 35, 4.5, '#ffb703'),
    d(R(24, 39, 12, 4, 2, '#ffffff', { opacity: 0.5 })),
  ];
}

function diya(): SVGElement[] {
  return [
    P('M14 56C16 78 34 86 52 86C70 86 82 76 86 62L93 55C94 53 93 51 91 51C86 53 80 56 74 57C56 61 32 61 14 56Z', '#d9792b'),
    d(C(28, 72, 2.6, '#ffd166')), d(C(39, 77, 2.6, '#ffd166')), d(C(51, 79, 2.6, '#ffd166')), d(C(63, 77, 2.6, '#ffd166')), d(C(74, 71, 2.6, '#ffd166')),
    d(P('M24 66C36 72 62 73 78 64', 'none', { stroke: '#b85f1c', 'stroke-width': 2.5 })),
    E(46, 57, 32, 7, '#f4a24c'),
    d(E(46, 57, 25, 4.2, '#7a3d12')),
    d(P('M90 52L91.5 48.5', 'none', { stroke: INK, 'stroke-width': 3 })),
  ];
}
function diyaLit(): SVGElement[] {
  return [
    P('M91.5 49C84 44 86 32 92 20C98 32 100 44 91.5 49Z', '#ffb703'),
    d(P('M92 47C89 43 89 37 92 31C95 37 95 43 92 47Z', '#fff4b0')),
  ];
}

function egg(): SVGElement[] {
  const outline = 'M50 12C70 12 82 42 82 62C82 82 68 92 50 92C32 92 18 82 18 62C18 42 30 12 50 12Z';
  return [
    P(outline, '#8fd3ff'),
    d(P('M18.2 62L18.6 57L26 50L34 57L42 50L50 57L58 50L66 57L74 50L81.4 57L81.8 62C81.8 82 68 91.8 50 91.8C32 91.8 18.2 82 18.2 62Z', '#ff8fb8')),
    d(C(34, 72, 3.4, '#ffd166')), d(C(50, 76, 3.4, '#ffd166')), d(C(66, 72, 3.4, '#ffd166')),
    d(C(42, 84, 2.6, '#ffffff')), d(C(58, 84, 2.6, '#ffffff')),
    P(outline, 'none'),
    d(E(38, 32, 6, 10, '#ffffff', { opacity: 0.55, transform: 'rotate(20 38 32)' })),
  ];
}

function envelope(): SVGElement[] {
  return [
    R(27, 14, 46, 72, 7, '#e3242b'),
    d(R(32, 52, 36, 29, 4, '#c81d24')),
    P('M27 24Q50 50 73 24V21Q73 14 66 14H34Q27 14 27 21Z', '#b9151d'),
    C(50, 44, 9, '#ffd166'),
    d(C(50, 44, 4, '#f0a91b')),
    d(R(31, 18, 5, 14, 2.5, '#ffffff', { opacity: 0.35 })),
  ];
}

function porch(): SVGElement[] {
  return [
    R(14, 66, 72, 20, 4, '#a0643a'),
    R(10, 58, 80, 11, 4, '#c98450'),
    d(P('M20 76h12M44 78h14M68 75h10', 'none', { stroke: '#7a4626', 'stroke-width': 2.5, 'stroke-linecap': 'round' })),
    // A faint pumpkin waiting on the crate ("a pumpkin goes here"), inside the sticker's cut edge; the lit
    // pumpkin covers it exactly when Jubi gets there.
    svg('g', { opacity: 0.38 }, ...pumpkinShape()),
  ];
}
/** The pumpkin's body and stem, without the carved face. */
function pumpkinShape(): SVGElement[] {
  return [
    P('M50 30C49 24 50 18 54 14', 'none', { stroke: '#4f7a24', 'stroke-width': 6 }),
    E(36, 44, 15, 15, '#f07c12'),
    E(64, 44, 15, 15, '#f07c12'),
    E(50, 44, 15, 16, '#ff8c1a'),
  ];
}
function pumpkin(): SVGElement[] {
  return [
    ...pumpkinShape(),
    d(P('M41 40L46 35L48 42ZM59 40L54 35L52 42Z', '#ffe08a')),
    d(P('M40 49Q50 57 60 49Q58 54 54 55L52 52L50 55L48 52L46 55Q42 54 40 49Z', '#ffe08a')),
  ];
}

function lantern(): SVGElement[] {
  return [
    P('M50 14V22', 'none', { 'stroke-width': 3.5 }),
    R(40, 22, 20, 8, 3, '#ffd166'),
    E(50, 52, 28, 23, '#b8424a'),
    d(P('M50 29.5C40 36 40 68 50 74.5M50 29.5C60 36 60 68 50 74.5', 'none', { stroke: '#7e2a31', 'stroke-width': 2.5 })),
    R(40, 73, 20, 8, 3, '#ffd166'),
    P('M50 81V90', 'none', { stroke: '#ffd166', 'stroke-width': 4 }),
  ];
}
function lanternLit(): SVGElement[] {
  return [
    E(50, 52, 28, 23, '#ff4d4d'),
    d(E(50, 54, 17, 14, '#ffd166', { opacity: 0.85 })),
    d(P('M50 29.5C40 36 40 68 50 74.5M50 29.5C60 36 60 68 50 74.5', 'none', { stroke: '#c81d24', 'stroke-width': 2.5 })),
    d(E(40, 44, 4, 7, '#ffffff', { opacity: 0.5 })),
  ];
}

function coin(): SVGElement[] {
  return [
    C(50, 54, 27, '#ffcf3f'),
    d(C(50, 54, 19, '#f5b524')),
    C(50, 54, 19, 'none', { stroke: '#d9961a', 'stroke-width': 2.5 }),
    d(P('M37 45A16 16 0 0 1 50 37', 'none', { stroke: '#fff4c2', 'stroke-width': 4 })),
  ];
}

function flower(): SVGElement[] {
  const petals: SVGElement[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    petals.push(C(50 + Math.cos(a) * 20, 52 + Math.sin(a) * 20, 11, '#ff9f1c'));
  }
  const inner: SVGElement[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    inner.push(d(C(50 + Math.cos(a) * 10, 52 + Math.sin(a) * 10, 8, '#ffb703')));
  }
  return [...petals, C(50, 52, 17, '#ffb703'), ...inner, C(50, 52, 7, '#e0700f')];
}

function heart(): SVGElement[] {
  return [
    P('M50 86C26 68 14 54 14 38C14 26 23 18 33 18C41 18 47 23 50 30C53 23 59 18 67 18C77 18 86 26 86 38C86 54 74 68 50 86Z', '#ff4d6d'),
    d(E(30, 34, 6, 9, '#ffffff', { opacity: 0.5, transform: 'rotate(35 30 34)' })),
  ];
}

function apple(): SVGElement[] {
  return [
    P('M50 32C50 24 52 18 56 14', 'none', { stroke: '#6b3e1e', 'stroke-width': 5 }),
    P('M53 22C60 12 72 12 78 16C72 24 62 26 53 22Z', '#4caf50'),
    P('M50 32C38 22 16 26 18 52C20 76 36 90 50 84C64 90 80 76 82 52C84 26 62 22 50 32Z', '#e63946'),
    d(E(32, 46, 5, 9, '#ffffff', { opacity: 0.45, transform: 'rotate(20 32 46)' })),
  ];
}

function star(): SVGElement[] {
  return [
    P('M50 12C53 34 60 44 84 50C60 56 53 66 50 88C47 66 40 56 16 50C40 44 47 34 50 12Z', '#ffe17a'),
    d(C(50, 50, 6, '#fff6c8')),
  ];
}

const ITEM_ART: Record<ItemKind, () => SVGElement[]> = { present, diya, egg, envelope, pumpkin: porch, lantern, coin, flower, heart, apple, star };
const ITEM_LIT: Partial<Record<ItemKind, () => SVGElement[]>> = { diya: diyaLit, lantern: lanternLit, pumpkin };
const GLOW_AT: Partial<Record<ItemKind, readonly [number, number, number]>> = { diya: [90, 40, 30], lantern: [50, 52, 46], pumpkin: [50, 44, 40] };

/** One item, 100×100. Lights carry their lit layer; the CSS reveals it on `.is-done`. */
export function itemSprite(kind: ItemKind): SVGSVGElement {
  const lit = ITEM_LIT[kind];
  const at = GLOW_AT[kind];
  const kids: SVGElement[] = [];
  if (at) kids.push(glow(at[0], at[1], at[2], '#ffd166'));
  kids.push(sticker(ITEM_ART[kind]()));
    // Lit layers sit on the base sticker: the pumpkin gets its own cut edge; the lantern glow fits the lantern exactly.
  if (lit) kids.push(svg('g', { class: 'pth-lit' }, sticker(lit(), kind === 'pumpkin' ? 8 : kind === 'diya' ? 6 : 0, false)));
  return box(`pth-sprite pth-item-art pth-${kind}`, ...kids);
}

// ── obstacles ────────────────────────────────────────────────────────────

function snowman(): SVGElement[] {
  return [
    C(50, 68, 21, '#f4f8ff'),
    d(P('M33 74C38 84 60 86 68 76', 'none', { stroke: '#cfdcf2', 'stroke-width': 5 })),
    C(50, 40, 15, '#f4f8ff'),
    R(38, 10, 24, 17, 3, '#3a2d52'),
    R(32, 25, 36, 5, 2.5, '#3a2d52'),
    d(R(38, 21, 24, 4, 0, '#e94a5a')),
    P('M37 52C44 57 56 57 63 52L64 58C56 62 44 62 36 58Z', '#e94a5a'),
    P('M58 56L66 70L60 71Z', '#e94a5a'),
    d(C(45, 38, 2.4, INK)), d(C(55, 38, 2.4, INK)),
    d(P('M50 42L60 45L50 47Z', '#ff8c1a')),
    d(C(50, 66, 2.4, INK)), d(C(50, 75, 2.4, INK)),
  ];
}

function pine(): SVGElement[] {
  return [
    R(44, 74, 12, 14, 2, '#7a4a2a'),
    P('M50 40L80 78H20Z', '#2f8f5b'),
    P('M50 26L74 60H26Z', '#38a169'),
    P('M50 10L68 42H32Z', '#48b878'),
    d(P('M50 16L58 32H46Z', '#ffffff', { opacity: 0.25 })),
  ];
}

function bush(): SVGElement[] {
  return [
    P('M16 82C8 82 8 64 20 62C18 46 34 40 42 48C46 34 66 34 68 48C80 42 92 56 84 66C94 70 90 84 80 82Z', '#3fa34d'),
    d(P('M22 76C34 80 66 80 80 76', 'none', { stroke: '#2e7d3a', 'stroke-width': 4 })),
    d(C(34, 58, 3.6, '#ff8fb8')), d(C(56, 50, 3.6, '#ffd166')), d(C(70, 64, 3.6, '#ff8fb8')), d(C(46, 68, 3.6, '#ffffff')),
    d(E(36, 52, 6, 3.5, '#ffffff', { opacity: 0.3 })),
  ];
}

function hay(): SVGElement[] {
  return [
    R(14, 42, 72, 44, 9, '#e9b949'),
    d(P('M22 54h56M20 64h60M22 74h56', 'none', { stroke: '#c99a2e', 'stroke-width': 2.5 })),
    R(30, 42, 7, 44, 2, '#8a5a2b'),
    R(63, 42, 7, 44, 2, '#8a5a2b'),
    d(P('M18 44L14 36M28 43L27 34M50 42L52 33M74 43L78 35', 'none', { stroke: '#e9b949', 'stroke-width': 3 })),
  ];
}

function rock(): SVGElement[] {
  return [
    P('M14 84C10 66 22 46 40 42C48 30 70 32 76 46C90 52 92 74 86 84Z', '#9aa0b5'),
    d(P('M30 54C40 46 56 44 66 50', 'none', { stroke: '#c3c8d8', 'stroke-width': 5 })),
    d(P('M58 66L66 74M40 70L46 64', 'none', { stroke: '#7a8098', 'stroke-width': 3 })),
  ];
}

function pot(): SVGElement[] {
  const blooms: SVGElement[] = [];
  for (const [x, y, r] of [[36, 36, 10], [64, 36, 10], [50, 28, 11], [42, 46, 8], [58, 46, 8]] as const) {
    blooms.push(C(x, y, r, '#ff9f1c'));
    blooms.push(d(C(x, y, r * 0.45, '#ffd166')));
  }
  return [
    P('M30 56C34 48 66 48 70 56Z', '#3f8f3a'),
    ...blooms,
    P('M24 52H76L68 86H32Z', '#c8642e'),
    R(20, 50, 60, 10, 4, '#e07c3e'),
    d(P('M34 70h32', 'none', { stroke: '#ffd166', 'stroke-width': 3, 'stroke-dasharray': '1 6' })),
  ];
}

function lanternPost(): SVGElement[] {
  return [
    R(34, 80, 30, 8, 3, '#5a2a1a'),
    R(45, 18, 8, 64, 2, '#7a3a22'),
    R(45, 18, 30, 6, 2, '#7a3a22'),
    P('M70 24V32', 'none', { 'stroke-width': 3 }),
    R(63, 31, 14, 5, 2, '#ffd166'),
    E(70, 47, 13, 12, '#e3242b'),
    d(P('M70 35.5C65 39 65 55 70 58.5M70 35.5C75 39 75 55 70 58.5', 'none', { stroke: '#b9151d', 'stroke-width': 2 })),
    R(63, 57, 14, 5, 2, '#ffd166'),
    P('M70 62V70', 'none', { stroke: '#ffd166', 'stroke-width': 3.5 }),
  ];
}

const BLOCK_ART: Record<BlockKind, () => SVGElement[]> = { snowman, pine, bush, hay, rock, pot, lanternPost };

export function blockSprite(kind: BlockKind): SVGSVGElement {
  return box(`pth-sprite pth-block-art pth-${kind}`, sticker(BLOCK_ART[kind]()));
}

// ── goals ────────────────────────────────────────────────────────────────

function house(snowy: boolean): SVGElement[] {
  const parts: SVGElement[] = [
    R(64, 18, 11, 24, 2, '#a0523a'),
    R(22, 46, 56, 40, 3, '#ffe9c7'),
    P('M12 52L50 16L88 52Z', '#c8442e'),
    P('M41 86V68A9 9 0 0 1 59 68V86Z', '#7a3e1e'),
    d(C(55, 76, 1.8, '#ffd166')),
    R(26, 56, 11, 11, 2, '#ffd166'),
    R(63, 56, 11, 11, 2, '#ffd166'),
  ];
  if (snowy) {
    // Snow on the ridge and along the eaves, with the red roof showing between.
    parts.push(P('M30 35L50 16L70 35C66 38 63 34 59 37C55 40 52 35 48 38C44 41 40 36 36 39C33 40 31 38 30 35Z', '#ffffff'));
    parts.push(P('M12 52L16 48.2C20 51 24 49 28 51C24 54 18 55 12 52ZM88 52L84 48.2C80 51 76 49 72 51C76 54 82 55 88 52Z', '#ffffff'));
    parts.push(P('M63 18H76V22C72 24 66 24 63 22Z', '#ffffff'));
    parts.push(C(50, 62, 5.5, 'none', { stroke: '#2f8f5b', 'stroke-width': 4 }));
    parts.push(d(C(50, 67.5, 2, '#e94a5a')));
  }
  return parts;
}

function gate(): SVGElement[] {
  // A moon gate: a round opening glowing with the light of the garden beyond.
  return [
    R(14, 40, 72, 48, 2, '#f4e1c1'),
    C(50, 66, 19, '#ffe7a8'),
    d(C(50, 70, 12, '#fff4cf')),
    d(P('M42 80C46 75 54 75 58 80Z', '#e8c27a')),
    P('M6 42C20 38 30 30 50 28C70 30 80 38 94 42L90 46H10Z', '#2f6f5e'),
    d(P('M20 40h60', 'none', { stroke: '#4f9a84', 'stroke-width': 3 })),
    d(C(24, 56, 3, '#e3242b')), d(C(76, 56, 3, '#e3242b')),
  ];
}

function basket(): SVGElement[] {
  return [
    P('M22 52C22 22 78 22 78 52', 'none', { stroke: '#8a5a2b', 'stroke-width': 7 }),
    P('M22 52C22 22 78 22 78 52', 'none', { stroke: '#c98a4b', 'stroke-width': 3, 'data-cut': 'no' }),
    E(40, 50, 8, 10, '#ff8fb8'), E(58, 48, 8, 10, '#8fd3ff'), E(50, 52, 7, 9, '#ffd166'),
    P('M14 52H86L78 86H22Z', '#c98a4b'),
    d(P('M20 62H80M23 72H77', 'none', { stroke: '#a06a35', 'stroke-width': 3 })),
    d(P('M30 52V86M42 52V86M54 52V86M66 52V86', 'none', { stroke: '#a06a35', 'stroke-width': 2, 'stroke-dasharray': '4 6' })),
    R(12, 48, 76, 8, 4, '#d9a066'),
  ];
}

export function goalSprite(kind: GoalKind): SVGSVGElement {
  const art = kind === 'gate' ? gate() : kind === 'basket' ? basket() : house(kind === 'snowHouse');
  return box(`pth-sprite pth-goal-art pth-${kind}`, sticker(art));
}
