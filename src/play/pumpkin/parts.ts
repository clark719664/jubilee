/**
 * parts.ts — the Pumpkin Carver's parts and how a pumpkin is drawn. A pumpkin is a tiny record
 * (`PumpkinSpec`) the Fridge keeps as data; `drawPumpkin` rebuilds the same picture from it anywhere.
 * Everything is a friendly cut-out: the carved shapes are filled with `--cut` (dark soot when the pumpkin
 * is dark, warm candle-yellow when lit), and nothing here is ever scary.
 */
import { build, uid, type Spec } from '../spooky/draw';

export interface PumpkinSpec {
  readonly v: 1;
  readonly eyes: string;
  readonly nose: string;
  readonly mouth: string;
  readonly hat: string;
  readonly colour: string;
  readonly lit: boolean;
}

export interface Part {
  readonly id: string;
  readonly name: string;
}

export const EYES: readonly Part[] = [
  { id: 'round', name: 'Round eyes' }, { id: 'triangle', name: 'Triangle eyes' }, { id: 'happy', name: 'Happy eyes' },
  { id: 'star', name: 'Star eyes' }, { id: 'sleepy', name: 'Sleepy eyes' }, { id: 'oval', name: 'Big oval eyes' }, { id: 'heart', name: 'Heart eyes' },
];
export const NOSES: readonly Part[] = [
  { id: 'triangle', name: 'Triangle nose' }, { id: 'dot', name: 'Dot nose' }, { id: 'square', name: 'Square nose' },
  { id: 'nostrils', name: 'Two dots' }, { id: 'heart', name: 'Heart nose' }, { id: 'none', name: 'No nose' },
];
export const MOUTHS: readonly Part[] = [
  { id: 'smile', name: 'Smile' }, { id: 'grin', name: 'Grin' }, { id: 'teeth', name: 'Toothy smile' }, { id: 'zigzag', name: 'Zigzag' },
  { id: 'oh', name: 'Surprised “oh”' }, { id: 'tongue', name: 'Tongue out' }, { id: 'cat', name: 'Cat mouth' }, { id: 'laugh', name: 'Big laugh' },
];
export const HATS: readonly Part[] = [
  { id: 'none', name: 'No hat' }, { id: 'witch', name: 'Witch hat' }, { id: 'party', name: 'Party hat' },
  { id: 'crown', name: 'Crown' }, { id: 'bow', name: 'Bow' }, { id: 'bat', name: 'A little bat' },
];

export interface Colour extends Part {
  readonly base: string;
  readonly dark: string;
  readonly light: string;
}
export const COLOURS: readonly Colour[] = [
  { id: 'orange', name: 'Orange', base: '#ff8c1a', dark: '#d9650c', light: '#ffb454' },
  { id: 'white', name: 'White', base: '#f1ebdf', dark: '#cfc5b2', light: '#fffaf0' },
  { id: 'green', name: 'Green', base: '#82b650', dark: '#5f9239', light: '#aad676' },
  { id: 'blue', name: 'Blue-grey', base: '#8db0c9', dark: '#6b92ae', light: '#b9d4e6' },
  { id: 'pink', name: 'Pink', base: '#ff9db8', dark: '#e4738f', light: '#ffc2d3' },
];

export const DEFAULT_PUMPKIN: PumpkinSpec = { v: 1, eyes: 'triangle', nose: 'triangle', mouth: 'grin', hat: 'none', colour: 'orange', lit: false };

const ids = (list: readonly Part[]): readonly string[] => list.map((p) => p.id);
const oneOf = (v: unknown, list: readonly Part[], fallback: string): string => (typeof v === 'string' && ids(list).includes(v) ? v : fallback);

/** Reads a Fridge item's data back into a pumpkin (tolerates old or hand-edited data). */
export function sanitizePumpkin(data: unknown): PumpkinSpec {
  const o = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  return {
    v: 1,
    eyes: oneOf(o.eyes, EYES, DEFAULT_PUMPKIN.eyes),
    nose: oneOf(o.nose, NOSES, DEFAULT_PUMPKIN.nose),
    mouth: oneOf(o.mouth, MOUTHS, DEFAULT_PUMPKIN.mouth),
    hat: oneOf(o.hat, HATS, DEFAULT_PUMPKIN.hat),
    colour: oneOf(o.colour, COLOURS, DEFAULT_PUMPKIN.colour),
    lit: o.lit === true,
  };
}

export type Slot = 'eyes' | 'nose' | 'mouth' | 'hat' | 'colour';

export function withPart(spec: PumpkinSpec, slot: Slot, id: string): PumpkinSpec {
  return { ...spec, [slot]: id };
}

/** A random pumpkin for "Surprise me" (rand in [0, 1)). */
export function randomPumpkin(rand: () => number, lit = false): PumpkinSpec {
  const p = <T extends Part>(l: readonly T[]): string => l[Math.floor(rand() * l.length) % l.length]!.id;
  return { v: 1, eyes: p(EYES), nose: p(NOSES), mouth: p(MOUTHS), hat: p(HATS), colour: p(COLOURS), lit };
}

const MOUTH_WORD: Readonly<Record<string, string>> = {
  smile: 'smiley', grin: 'grinning', teeth: 'toothy', zigzag: 'zigzag', oh: 'surprised', tongue: 'silly', cat: 'whiskery', laugh: 'giggly',
};

/** "Grinning orange pumpkin": what the Fridge calls it. */
export function pumpkinTitle(spec: PumpkinSpec): string {
  const word = MOUTH_WORD[spec.mouth] ?? 'friendly';
  const colour = (COLOURS.find((c) => c.id === spec.colour) ?? COLOURS[0]!).name.toLowerCase();
  const t = `${word} ${colour} pumpkin`;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** For a screen reader. */
export function describePumpkin(spec: PumpkinSpec): string {
  const name = (list: readonly Part[], id: string): string => (list.find((p) => p.id === id)?.name ?? id).toLowerCase();
  const hat = spec.hat === 'none' ? '' : ` wearing ${name(HATS, spec.hat) === 'a little bat' ? 'a little bat' : `a ${name(HATS, spec.hat)}`}`;
  const nose = spec.nose === 'none' ? 'no nose' : name(NOSES, spec.nose);
  return `A ${spec.lit ? 'glowing ' : ''}${name(COLOURS, spec.colour)} jack-o’-lantern${hat}, with ${name(EYES, spec.eyes)}, ${nose} and a ${name(MOUTHS, spec.mouth)}`;
}

// ── drawing (a 200 × 220 board; the pumpkin sits low so hats have headroom) ──

const CUT = 'pk-cut';
const LINE = 'pk-cutline';
const cut = (tag: string, attrs: Record<string, string | number>): Spec => [tag, { class: CUT, ...attrs }];
const line = (d: string, w = 7): Spec => ['path', { class: LINE, d, 'stroke-width': w }];

function eyeShape(id: string): Spec {
  switch (id) {
    case 'round': return cut('circle', { r: 11 });
    case 'triangle': return cut('path', { d: 'M0-13L13 11H-13z' });
    case 'happy': return line('M-13 7Q0-12 13 7', 7);
    case 'star': return cut('path', { d: 'M0-14L4-4.5L14-4L6.5 3L9 13L0 7.5L-9 13L-6.5 3L-14-4L-4-4.5z' });
    case 'sleepy': return line('M-13-3Q0 12 13-3', 6);
    case 'oval': return cut('ellipse', { rx: 8, ry: 13 });
    default: return cut('path', { d: 'M0 13C-20-2-11-17 0-6C11-17 20-2 0 13z' });
  }
}

function noseShapes(id: string): Spec[] {
  switch (id) {
    case 'triangle': return [cut('path', { d: 'M0-8L9 8H-9z' })];
    case 'dot': return [cut('circle', { r: 6 })];
    case 'square': return [cut('rect', { x: -7, y: -7, width: 14, height: 14, rx: 3 })];
    case 'nostrils': return [cut('circle', { cx: -7, r: 3.6 }), cut('circle', { cx: 7, r: 3.6 })];
    case 'heart': return [cut('path', { d: 'M0 8C-12-2-7-10 0-4C7-10 12-2 0 8z' })];
    default: return [];
  }
}

const TOOTH = 'pk-tooth';

function mouthShapes(id: string, colour: Colour): Spec[] {
  const tooth = (d: string): Spec => ['path', { class: TOOTH, d, fill: colour.base }];
  switch (id) {
    case 'smile': return [line('M-36-6Q0 32 36-6', 8)];
    case 'grin': return [cut('path', { d: 'M-42-8Q0 14 42-8Q0 54-42-8z' }), tooth('M-22 0L-14 14L-6 3z'), tooth('M6 3L14 14L22 0z')];
    case 'teeth': return [cut('path', { d: 'M-44-8Q0 18 44-8Q0 58-44-8z' }), tooth('M-32-1L-26 10L-19 3z'), tooth('M-10 6L-4 17L2 8z'), tooth('M10 7L16 15L22 3z'), tooth('M-3 40L3 30L9 40z')];
    case 'zigzag': return [line('M-40 0L-26 12L-13-2L0 12L13-2L26 12L40 0', 7)];
    case 'oh': return [cut('ellipse', { cx: 0, cy: 6, rx: 13, ry: 17 })];
    case 'tongue': return [cut('path', { d: 'M-34-6Q0 22 34-6Q0 34-34-6z' }), ['path', { class: TOOTH, d: 'M-6 10C-6 26 8 26 8 10Q1 14-6 10z', fill: '#ff7a8a' }]];
    case 'cat': return [line('M-28 2Q-14 16 0 2Q14 16 28 2', 7)];
    default: return [cut('path', { d: 'M-38-8Q0-10 38-8Q40 30 0 36Q-40 30-38-8z' }), ['path', { class: TOOTH, d: 'M-14 30C-8 16 8 16 14 30Q0 38-14 30z', fill: '#ff7a8a' }]];
  }
}

function hatShapes(id: string): Spec[] {
  switch (id) {
    case 'witch': return [
      ['ellipse', { cx: 100, cy: 56, rx: 62, ry: 12, fill: '#2c1d48' }],
      ['path', { d: 'M62 54C70 30 82 14 96-2Q104-14 124-12Q110-6 112 6C116 22 122 40 138 54z', fill: '#3a2660' }],
      ['path', { d: 'M65 46Q100 56 136 46L138 54Q100 64 62 54z', fill: '#a8ff5e' }],
    ];
    case 'party': return [
      ['path', { d: 'M100-4L134 56H66z', fill: '#7c4dff' }],
      ['path', { d: 'M84 32L116 32L121 44H79z', fill: '#ffd166' }],
      ['circle', { cx: 100, cy: -6, r: 9, fill: '#ff5ea8' }],
      ['ellipse', { cx: 100, cy: 57, rx: 38, ry: 6, fill: '#5b34c8' }],
    ];
    case 'crown': return [
      ['path', { d: 'M64 56L58 12L82 32L100 6L118 32L142 12L136 56z', fill: '#ffcf3f' }],
      ['path', { d: 'M64 56L136 56L135 47L65 47z', fill: '#f0a010' }],
      ['circle', { cx: 100, cy: 36, r: 6, fill: '#ff5ea8' }], ['circle', { cx: 78, cy: 40, r: 4, fill: '#7cc4ff' }], ['circle', { cx: 122, cy: 40, r: 4, fill: '#7cc4ff' }],
    ];
    case 'bow': return [
      ['path', { d: 'M100 38C80 16 60 22 62 40C64 56 84 52 100 38z', fill: '#ff5ea8' }],
      ['path', { d: 'M100 38C120 16 140 22 138 40C136 56 116 52 100 38z', fill: '#ff5ea8' }],
      ['circle', { cx: 100, cy: 40, r: 9, fill: '#e03a86' }],
    ];
    case 'bat': return [
      ['path', { d: 'M100 36C92 28 80 24 68 30C74 32 76 38 74 44C80 40 86 42 90 48C94 44 98 44 100 48C102 44 106 44 110 48C114 42 120 40 126 44C124 38 126 32 132 30C120 24 108 28 100 36z', fill: '#2a1745' }],
      ['circle', { cx: 94, cy: 38, r: 3, fill: '#fff' }], ['circle', { cx: 106, cy: 38, r: 3, fill: '#fff' }],
      ['circle', { cx: 94.6, cy: 38.4, r: 1.5, fill: '#2a1745' }], ['circle', { cx: 106.6, cy: 38.4, r: 1.5, fill: '#2a1745' }],
      ['path', { d: 'M93 29L90 20L98 26zM107 29L110 20L102 26z', fill: '#2a1745' }],
    ];
    default: return [];
  }
}

/** A deeper shade of a #rrggbb colour (a lit pumpkin's body goes dusky so the glow stands out). */
function shade(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number): string => Math.round(v * 0.72).toString(16).padStart(2, '0');
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
}

/** The board is 200 wide × 220 tall; the pumpkin's middle is (100, 140). */
export function pumpkinSpec(spec: PumpkinSpec): Spec {
  const c = COLOURS.find((x) => x.id === spec.colour) ?? COLOURS[0]!;
  const gid = uid('pkglow');
  const body = (cx: number, rx: number, ry: number, fillc: string): Spec => ['ellipse', { cx, cy: 140, rx, ry, fill: fillc }];
  const face: Spec = ['g', { class: 'pk-face' },
    ['g', { transform: 'translate(70 124) rotate(-6)' }, eyeShape(spec.eyes)],
    ['g', { transform: 'translate(130 124) rotate(6) scale(-1 1)' }, eyeShape(spec.eyes)],
    ['g', { transform: 'translate(100 146)' }, ...noseShapes(spec.nose)],
    ['g', { transform: 'translate(100 166)' }, ...mouthShapes(spec.mouth, c)]];
  return ['g', { class: `pk-art${spec.lit ? ' is-lit' : ''}`, style: `--cut:${spec.lit ? '#ffd45a' : '#34140a'}` },
    ['defs', {}, ['radialGradient', { id: gid, cx: 0.5, cy: 0.5, r: 0.5 },
      ['stop', { offset: 0, 'stop-color': '#fff2b0', 'stop-opacity': 0.9 }], ['stop', { offset: 1, 'stop-color': '#ffb02e', 'stop-opacity': 0 }]]],
    ['ellipse', { cx: 100, cy: 205, rx: 70, ry: 9, fill: '#000', opacity: 0.18 }],
    // the stem, then the ribs from the outside in
    ['path', { d: 'M92 82C90 66 94 54 104 50L114 56C108 62 108 72 112 84z', fill: '#6b8e3a' }],
    body(54, 40, 62, spec.lit ? shade(c.dark) : c.dark), body(146, 40, 62, spec.lit ? shade(c.dark) : c.dark),
    body(76, 44, 66, spec.lit ? c.dark : c.base), body(124, 44, 66, spec.lit ? c.dark : c.base), body(100, 46, 68, spec.lit ? c.base : c.light),
    ['path', { d: 'M100 92C112 100 124 112 122 128', fill: 'none', stroke: c.dark, 'stroke-width': 2, opacity: 0.35, 'stroke-linecap': 'round' }],
    ['ellipse', { cx: 62, cy: 108, rx: 9, ry: 20, fill: '#fff', opacity: 0.22, transform: 'rotate(18 62 108)' }],
    ['path', { d: 'M110 58C122 50 134 54 132 64C130 72 122 70 124 64', fill: 'none', stroke: '#5a8a2a', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: spec.hat === 'none' ? 1 : 0 }],
    ...(spec.lit ? [['ellipse', { class: 'pk-glow', cx: 100, cy: 146, rx: 62, ry: 54, fill: `url(#${gid})` }] as Spec] : []),
    face,
    ...hatShapes(spec.hat)];
}

/** A finished pumpkin as an <svg> (used by the game, its option buttons and the Fridge). */
export function drawPumpkin(spec: PumpkinSpec, view = '0 -20 200 240'): SVGSVGElement {
  return build(['svg', { viewBox: view, class: 'pk-svg', 'aria-hidden': 'true', focusable: 'false' }, pumpkinSpec(spec)]) as SVGSVGElement;
}

/** Where each part sits on the board, so its button can zoom in on it. */
const VIEWS: Readonly<Partial<Record<Slot, string>>> = {
  eyes: '28 96 144 62', nose: '58 118 84 62', mouth: '44 138 112 68',
};

/** A small button face for one part: the pumpkin with just that part changed, zoomed in on it. */
export function partPreview(spec: PumpkinSpec, slot: Slot, id: string): SVGSVGElement {
  const s = withPart(spec, slot, id);
  return drawPumpkin({ ...s, lit: false }, VIEWS[slot]);
}
