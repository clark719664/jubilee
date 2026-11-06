/**
 * logic.ts — Rangoli Maker's geometry and fill rules, with no DOM. A design is five rings of shapes laid
 * out with 8-fold rotational symmetry. A "group" is one shape and its seven rotated twins; filling a group
 * fills all eight at once, so anything the child makes is symmetric. Undo and Clear keep snapshots, so
 * nothing is ever lost.
 */
export const FOLDS = 8;
export const RING_COUNT = 5;
/** Half-size of the square view box the design is drawn in. */
export const VIEW = 102;
export const DISC_RADIUS = 100;

export type ShapeKind = 'petal' | 'dot' | 'diamond';

export interface RingSpec {
  readonly kind: ShapeKind;
  /** Shapes per eighth of the circle (1 or 2). */
  readonly per: 1 | 2;
  /** Turn the whole ring half a step so its shapes sit between the neighbors' shapes. */
  readonly shift: boolean;
}

export interface Layout {
  readonly id: string;
  readonly name: string;
  readonly rings: readonly RingSpec[];
}

export const LAYOUTS: readonly Layout[] = [
  {
    id: 'lotus', name: 'Lotus', rings: [
      { kind: 'petal', per: 1, shift: false }, { kind: 'petal', per: 1, shift: true }, { kind: 'dot', per: 2, shift: false },
      { kind: 'petal', per: 1, shift: true }, { kind: 'diamond', per: 2, shift: false },
    ],
  },
  {
    id: 'star', name: 'Star', rings: [
      { kind: 'diamond', per: 1, shift: false }, { kind: 'dot', per: 1, shift: true }, { kind: 'diamond', per: 2, shift: false },
      { kind: 'dot', per: 1, shift: true }, { kind: 'petal', per: 2, shift: false },
    ],
  },
  {
    id: 'garden', name: 'Garden', rings: [
      { kind: 'dot', per: 1, shift: false }, { kind: 'diamond', per: 1, shift: true }, { kind: 'petal', per: 2, shift: false },
      { kind: 'dot', per: 2, shift: true }, { kind: 'petal', per: 1, shift: false },
    ],
  },
];

export const DEFAULT_LAYOUT = LAYOUTS[0]!.id;

export interface Swatch {
  readonly id: string;
  readonly name: string;
  readonly hex: string;
}

export const SWATCHES: readonly Swatch[] = [
  { id: 'marigold', name: 'Marigold', hex: '#ffb300' }, { id: 'saffron', name: 'Saffron', hex: '#ff6f00' },
  { id: 'rose', name: 'Rose', hex: '#ff4f8b' }, { id: 'magenta', name: 'Magenta', hex: '#c2185b' },
  { id: 'violet', name: 'Violet', hex: '#8e44e0' }, { id: 'blue', name: 'Blue', hex: '#2f6fe4' },
  { id: 'teal', name: 'Teal', hex: '#00b8a9' }, { id: 'green', name: 'Green', hex: '#43a047' },
  { id: 'lime', name: 'Lime', hex: '#b8e000' }, { id: 'cream', name: 'Cream', hex: '#fff3c4' },
];

const RADII = [15, 32, 50, 68, 86] as const;
const LENGTHS = [8, 10, 11, 12, 13] as const;

export interface Member {
  /** Degrees clockwise from straight up. */
  readonly angle: number;
}

export interface Group {
  readonly id: string;
  readonly ring: number;
  readonly index: number;
  readonly kind: ShapeKind;
  /** SVG path for the shape placed at the top of the design (empty for dots, which use `dot`). */
  readonly path: string;
  /** Circle drawn at the top for a dot: [cy, r]. */
  readonly dot: readonly [number, number] | null;
  readonly members: readonly Member[];
}

const r1 = (n: number): number => Math.round(n * 100) / 100;

export function shapePath(kind: ShapeKind, radius: number, len: number, hw: number): string {
  const top = -(radius + len);
  const bottom = -(radius - len);
  if (kind === 'diamond') return `M0 ${r1(top)}L${r1(hw)} ${-radius}L0 ${r1(bottom)}L${r1(-hw)} ${-radius}Z`;
  return `M0 ${r1(bottom)}Q${r1(hw * 2)} ${-radius} 0 ${r1(top)}Q${r1(-hw * 2)} ${-radius} 0 ${r1(bottom)}Z`;
}

export function layoutById(id: string): Layout {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0]!;
}

export function groupId(ring: number, index: number): string {
  return `${ring}-${index}`;
}

export function buildGroups(layout: Layout): readonly Group[] {
  const out: Group[] = [];
  layout.rings.forEach((spec, ring) => {
    const radius = RADII[ring]!;
    const scale = spec.per === 2 ? 0.8 : 1;
    const len = LENGTHS[ring]! * scale;
    const hw = len * 0.5;
    const step = 360 / FOLDS;
    for (let index = 0; index < spec.per; index++) {
      const base = (spec.shift ? step / 2 : 0) + (index - (spec.per - 1) / 2) * (step / spec.per);
      const members = Array.from({ length: FOLDS }, (_, k) => ({ angle: r1((((base + k * step) % 360) + 360) % 360) }));
      const isDot = spec.kind === 'dot';
      out.push({
        id: groupId(ring, index), ring, index, kind: spec.kind,
        path: isDot ? '' : shapePath(spec.kind, radius, len, hw),
        dot: isDot ? [-radius, r1(len * 0.62)] : null,
        members,
      });
    }
  });
  return out;
}

export type Fills = Readonly<Record<string, string>>;

export interface Design {
  readonly layout: string;
  readonly fills: Fills;
  /** Earlier fills, newest last. */
  readonly past: readonly Fills[];
}

export const HISTORY_LIMIT = 100;

export function newDesign(layout: string = DEFAULT_LAYOUT): Design {
  return { layout: layoutById(layout).id, fills: {}, past: [] };
}

function remember(d: Design): readonly Fills[] {
  return [...d.past, d.fills].slice(-HISTORY_LIMIT);
}

/** Pours `color` into a whole symmetric group. Painting the color it already has changes nothing. */
export function paint(d: Design, group: string, color: string): Design {
  if (!buildGroups(layoutById(d.layout)).some((g) => g.id === group)) return d;
  if (d.fills[group] === color) return d;
  return { ...d, fills: { ...d.fills, [group]: color }, past: remember(d) };
}

export function undo(d: Design): Design {
  const last = d.past[d.past.length - 1];
  if (!last) return d;
  return { ...d, fills: last, past: d.past.slice(0, -1) };
}

export function canUndo(d: Design): boolean {
  return d.past.length > 0;
}

export function clear(d: Design): Design {
  if (Object.keys(d.fills).length === 0) return d;
  return { ...d, fills: {}, past: remember(d) };
}

/** Switching layouts keeps the colors that still have a place to go. */
export function setLayout(d: Design, layout: string): Design {
  const next = layoutById(layout);
  if (next.id === d.layout) return d;
  const ids = new Set(buildGroups(next).map((g) => g.id));
  const fills = Object.fromEntries(Object.entries(d.fills).filter(([id]) => ids.has(id)));
  return { layout: next.id, fills, past: remember(d) };
}

export function filledCount(d: Design): number {
  return Object.keys(d.fills).length;
}
