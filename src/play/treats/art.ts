/**
 * art.ts — Trick-or-Treat Street's drawings: six friendly door-answerers, six little houses and the bag.
 * Faces follow ART.md §13: one catchlight per eye, a smile, soft cheeks, no outlines.
 */
import { build, cheek, eye, type Spec } from '../spooky/draw';

const INK = '#2b1a4d';
const MOUTH = '#6b2b3a';

const smile = (x: number, y: number, w = 7): Spec => ['path', { d: `M${x - w} ${y}Q${x} ${y + w * 0.9} ${x + w} ${y}`, fill: 'none', stroke: MOUTH, 'stroke-width': 2.4, 'stroke-linecap': 'round' }];

/** A round face (center x, y; radius r) with eyes, cheeks and a smile. */
function face(x: number, y: number, r: number, skin: string): Spec[] {
  return [
    ['circle', { cx: x, cy: y, r, fill: skin }],
    ...eye(x - r * 0.38, y + r * 0.05, r * 0.17), ...eye(x + r * 0.38, y + r * 0.05, r * 0.17),
    cheek(x - r * 0.62, y + r * 0.4, r * 0.2), cheek(x + r * 0.62, y + r * 0.4, r * 0.2),
    smile(x, y + r * 0.42, r * 0.28),
  ];
}

const VISITOR_ART: Readonly<Record<string, readonly Spec[]>> = {
  ghost: [
    ['path', { d: 'M24 112V62C24 36 40 20 60 20S96 36 96 62V112Q90 122 83 112Q76 122 69 112Q62 122 55 112Q48 122 41 112Q34 122 24 112z', fill: '#f6f0ff' }],
    ['path', { d: 'M82 28C92 36 96 48 96 62V112Q90 122 84 113C88 90 90 52 82 28z', fill: '#ddd2f2' }],
    ['path', { d: 'M24 70Q10 64 10 78Q14 84 26 82z', fill: '#f6f0ff' }], ['path', { d: 'M96 70Q110 64 110 78Q106 84 94 82z', fill: '#f6f0ff' }],
    ...eye(47, 58, 7), ...eye(73, 58, 7), ['ellipse', { cx: 60, cy: 76, rx: 4.5, ry: 6, fill: INK }], cheek(38, 72, 6), cheek(82, 72, 6),
  ],
  witch: [
    ['path', { d: 'M30 132Q30 96 60 94Q90 96 90 132z', fill: '#6b3fd9' }],
    ['circle', { cx: 60, cy: 70, r: 22, fill: '#f0c9a8' }],
    ['path', { d: 'M34 66Q36 46 60 44Q84 46 86 66Q76 56 60 58Q44 56 34 66z', fill: '#2a1a14' }],
    ...eye(51, 72, 3.6), ...eye(69, 72, 3.6), cheek(44, 80, 4.5), cheek(76, 80, 4.5), smile(60, 82, 6),
    ['ellipse', { cx: 60, cy: 52, rx: 36, ry: 7, fill: '#2c1d48' }],
    ['path', { d: 'M42 50C48 32 56 18 66 4Q72-2 82 2Q72 6 74 14C78 26 80 38 80 50z', fill: '#3a2660' }],
    ['path', { d: 'M42 46Q60 54 80 46V51Q60 59 42 51z', fill: '#a8ff5e' }],
  ],
  cat: [
    ['path', { d: 'M88 118C108 116 110 92 100 84', fill: 'none', stroke: '#2a1745', 'stroke-width': 8, 'stroke-linecap': 'round' }],
    ['path', { d: 'M30 122C26 96 36 80 60 80S94 96 90 122z', fill: '#2a1745' }],
    ['path', { d: 'M32 56L36 28L52 42zM88 56L84 28L68 42z', fill: '#2a1745' }],
    ['path', { d: 'M37 50L39 37L47 44zM83 50L81 37L73 44z', fill: '#ff8fb8' }],
    ['circle', { cx: 60, cy: 62, r: 29, fill: '#2a1745' }],
    ['ellipse', { cx: 48, cy: 62, rx: 6.5, ry: 7.5, fill: '#d8f25a' }], ['ellipse', { cx: 72, cy: 62, rx: 6.5, ry: 7.5, fill: '#d8f25a' }],
    ['ellipse', { cx: 48, cy: 63, rx: 2, ry: 6, fill: '#2a1745' }], ['ellipse', { cx: 72, cy: 63, rx: 2, ry: 6, fill: '#2a1745' }],
    ['circle', { cx: 46, cy: 59, r: 2, fill: '#fff' }], ['circle', { cx: 70, cy: 59, r: 2, fill: '#fff' }],
    ['path', { d: 'M56 72L64 72L60 77z', fill: '#ff8fb8' }], smile(60, 78, 5),
    ['path', { d: 'M30 74L14 70M30 80L14 82M90 74L106 70M90 80L106 82', fill: 'none', stroke: '#6b5a8a', 'stroke-width': 1.5, 'stroke-linecap': 'round' }],
  ],
  bat: [
    ['path', { d: 'M60 46C44 30 24 28 6 40C16 44 18 56 14 68C26 62 34 66 40 78C46 70 54 70 60 78C66 70 74 70 80 78C86 66 94 62 106 68C102 56 104 44 114 40C96 28 76 30 60 46z', fill: '#4b2c7a' }],
    ['path', { d: 'M44 60C44 48 52 40 60 40S76 48 76 60C76 78 70 94 60 94S44 78 44 60z', fill: '#2a1745' }],
    ['path', { d: 'M46 48L42 28L56 40zM74 48L78 28L64 40z', fill: '#2a1745' }],
    ...eye(54, 60, 6), ...eye(66, 60, 6), cheek(48, 70, 4), cheek(72, 70, 4), smile(60, 72, 5),
    ['path', { d: 'M54 92L50 104L60 96zM66 92L70 104L60 96z', fill: '#2a1745' }],
  ],
  mummy: [
    ['rect', { x: 32, y: 54, width: 56, height: 66, rx: 22, fill: '#efe6cf' }],
    ['circle', { cx: 60, cy: 52, r: 26, fill: '#efe6cf' }],
    ['path', { d: 'M34 96L86 90M36 108L84 104M38 120L82 118M40 44L80 56', fill: 'none', stroke: '#cdbfa0', 'stroke-width': 5, 'stroke-linecap': 'round' }],
    ['rect', { x: 36, y: 46, width: 48, height: 17, rx: 8, fill: '#2b1a4d' }],
    ...eye(50, 54, 5), ...eye(70, 54, 5),
    cheek(42, 70, 5), cheek(78, 70, 5), smile(60, 72, 6),
    ['path', { d: 'M32 84Q14 80 14 96Q22 100 32 98z', fill: '#efe6cf' }], ['path', { d: 'M88 84Q106 80 106 96Q98 100 88 98z', fill: '#efe6cf' }],
  ],
  kid: [
    ['ellipse', { cx: 60, cy: 104, rx: 38, ry: 30, fill: '#ff8c1a' }],
    ['path', { d: 'M40 104Q60 130 80 104', fill: 'none', stroke: '#e0640c', 'stroke-width': 3 }],
    ...face(60, 62, 24, '#b97a52'),
    ['path', { d: 'M34 58Q36 36 60 34Q84 36 86 58Q74 46 60 48Q46 46 34 58z', fill: '#2a1a14' }],
    ['path', { d: 'M56 36C54 26 58 20 66 18L68 24C64 26 64 30 66 36z', fill: '#5a8a2a' }],
  ],
};

export function drawVisitor(id: string): SVGSVGElement {
  return build(['svg', { viewBox: '0 0 120 140', class: 'tt-visitor-svg', 'aria-hidden': 'true', focusable: 'false' }, ...(VISITOR_ART[id] ?? VISITOR_ART.ghost!)]) as SVGSVGElement;
}

export interface HouseLook {
  readonly wall: string;
  readonly roof: string;
  readonly door: string;
}

export const LOOKS: readonly HouseLook[] = [
  { wall: '#7d6bb8', roof: '#3b2a63', door: '#ff8c1a' },
  { wall: '#6ba58a', roof: '#2f5a48', door: '#9b59d9' },
  { wall: '#d99a56', roof: '#6b3a22', door: '#3a8fd9' },
  { wall: '#8aa0d9', roof: '#34407a', door: '#e0527a' },
  { wall: '#c07aa6', roof: '#6a2f5a', door: '#5cb85c' },
  { wall: '#d9b957', roof: '#7a5a1f', door: '#7a4a2e' },
];

/** One little house (120 × 150): a glowing window, a number plate, a pumpkin on the step and a door that can open. */
export function drawHouse(n: number, look: HouseLook, open: boolean): SVGSVGElement {
  return build(['svg', { viewBox: '0 0 120 150', class: `tt-house-svg${open ? ' is-open' : ''}`, 'aria-hidden': 'true', focusable: 'false' },
    ['ellipse', { cx: 60, cy: 144, rx: 54, ry: 6, fill: '#000', opacity: 0.25 }],
    ['rect', { x: 14, y: 62, width: 92, height: 80, rx: 6, fill: look.wall }],
    ['path', { d: 'M4 68L60 14L116 68z', fill: look.roof }],
    ['rect', { x: 78, y: 26, width: 12, height: 22, fill: look.roof }],
    ['rect', { x: 22, y: 78, width: 24, height: 22, rx: 4, fill: '#ffd36b' }],
    ['path', { d: 'M34 78v22M22 89h24', stroke: look.wall, 'stroke-width': 2.5, fill: 'none' }],
    ['path', { d: 'M62 142V100Q62 84 76 84T90 100V142z', fill: open ? '#ffb347' : look.door }],
    ...(open ? [['path', { d: 'M62 142V100Q62 84 76 84T90 100V142z', fill: '#ffdc8a', opacity: 0.6 }] as Spec, ['path', { d: 'M62 142V100Q62 84 68 84L74 90V142z', fill: look.door }] as Spec]
      : [['circle', { cx: 84, cy: 116, r: 2.6, fill: '#ffe7a8' }] as Spec]),
    ['circle', { cx: 28, cy: 130, r: 9, fill: '#ff8c1a' }], ['path', { d: 'M28 121v-4', stroke: '#5a8a2a', 'stroke-width': 3, 'stroke-linecap': 'round' }],
    ['path', { d: 'M24 128l3 3 3-3M25 134h6', stroke: '#34140a', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }],
    ['circle', { cx: 14 + 46, cy: 56, r: 9, fill: '#fffdf8' }],
    ['text', { x: 60, y: 60, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: INK, 'font-family': 'Fredoka, ui-rounded, system-ui, sans-serif' }, String(n)],
  ]) as SVGSVGElement;
}

/** The trick-or-treat bag: a little pumpkin pail. */
export function drawPail(): SVGSVGElement {
  return build(['svg', { viewBox: '0 0 80 80', class: 'tt-pail-svg', 'aria-hidden': 'true', focusable: 'false' },
    ['path', { d: 'M14 36Q40-6 66 36', fill: 'none', stroke: '#2a1a14', 'stroke-width': 4, 'stroke-linecap': 'round' }],
    ['path', { d: 'M8 34H72L66 70Q40 80 14 70z', fill: '#ff8c1a' }],
    ['ellipse', { cx: 40, cy: 34, rx: 32, ry: 8, fill: '#a8450a' }],
    ['path', { d: 'M26 50L32 44L38 52zM44 52L50 44L56 50zM28 60Q40 68 52 60Q50 66 40 66Q30 66 28 60z', fill: '#34140a' }],
  ]) as SVGSVGElement;
}
