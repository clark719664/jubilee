/**
 * parts.ts — the Monster Maker's parts and how a monster is drawn. A monster is a tiny record
 * (`MonsterSpec`) the Fridge keeps as data; `drawMonster` rebuilds the picture anywhere. Every monster is
 * cuddly: round shapes, big shiny eyes with a catchlight, a smile somewhere, soft cheeks, friendly teeth.
 */
import { build, cheek, uid, type Spec } from '../spooky/draw';

export interface MonsterSpec {
  readonly v: 1;
  readonly body: string;
  readonly colour: string;
  readonly eyes: string;
  readonly mouth: string;
  readonly top: string;
  readonly pattern: string;
  readonly name: string;
}

export interface Part {
  readonly id: string;
  readonly name: string;
}

export const BODIES: readonly Part[] = [
  { id: 'blob', name: 'Blobby body' }, { id: 'tall', name: 'Tall body' }, { id: 'round', name: 'Round body' },
  { id: 'cube', name: 'Squarey body' }, { id: 'bean', name: 'Bean body' },
];
export const EYES: readonly Part[] = [
  { id: '1', name: 'One big eye' }, { id: '2', name: 'Two eyes' }, { id: '3', name: 'Three eyes' }, { id: '4', name: 'Four eyes' },
];
export const MOUTHS: readonly Part[] = [
  { id: 'smile', name: 'Big smile' }, { id: 'grin', name: 'Toothy grin' }, { id: 'oh', name: 'Surprised “oh”' }, { id: 'tongue', name: 'Tongue out' },
  { id: 'fangs', name: 'Friendly fangs' }, { id: 'buck', name: 'Buck teeth' }, { id: 'wavy', name: 'Wavy mouth' }, { id: 'tiny', name: 'Tiny smile' },
];
export const TOPS: readonly Part[] = [
  { id: 'none', name: 'Nothing on top' }, { id: 'horns', name: 'Little horns' }, { id: 'antennae', name: 'Antennae' },
  { id: 'ears', name: 'Floppy ears' }, { id: 'tuft', name: 'Hair tuft' }, { id: 'bumps', name: 'Soft bumps' },
];
export const PATTERNS: readonly Part[] = [
  { id: 'none', name: 'Plain' }, { id: 'spots', name: 'Spots' }, { id: 'stripes', name: 'Stripes' }, { id: 'belly', name: 'Tummy patch' },
];

export interface Colour extends Part {
  readonly base: string;
  readonly dark: string;
  readonly light: string;
}
export const COLOURS: readonly Colour[] = [
  { id: 'purple', name: 'Purple', base: '#9a62e0', dark: '#7a44bf', light: '#c4a0f5' },
  { id: 'lime', name: 'Lime', base: '#7cc94d', dark: '#5da535', light: '#b0e68a' },
  { id: 'teal', name: 'Teal', base: '#2fb8b0', dark: '#1f948d', light: '#7de0d8' },
  { id: 'pink', name: 'Pink', base: '#ff7eb8', dark: '#e0579a', light: '#ffb5d6' },
  { id: 'blue', name: 'Blue', base: '#5a8fff', dark: '#3b6fe0', light: '#9dbcff' },
  { id: 'orange', name: 'Orange', base: '#ff9a3d', dark: '#e07a1a', light: '#ffc58a' },
  { id: 'yellow', name: 'Yellow', base: '#ffd23f', dark: '#e0b11a', light: '#ffe688' },
  { id: 'berry', name: 'Berry', base: '#e5527a', dark: '#c2335b', light: '#f5909f' },
];

const FIRST = ['Gloo', 'Fuzz', 'Bloop', 'Snug', 'Zib', 'Mog', 'Pip', 'Wob', 'Nib', 'Flum', 'Bumble', 'Squee'] as const;
const LAST = ['bo', 'by', 'kins', 'zle', 'ly', 'oo', 'mo', 'wump', 'bert', 'sy'] as const;

/** A silly friendly name: "Fuzzbo", "Wobkins"… (rand in [0, 1)). */
export function monsterName(rand: () => number): string {
  return FIRST[Math.floor(rand() * FIRST.length) % FIRST.length]! + LAST[Math.floor(rand() * LAST.length) % LAST.length]!;
}

export const DEFAULT_MONSTER: MonsterSpec = { v: 1, body: 'blob', colour: 'purple', eyes: '2', mouth: 'smile', top: 'horns', pattern: 'belly', name: 'Gloobo' };

const oneOf = (v: unknown, list: readonly Part[], fallback: string): string => (typeof v === 'string' && list.some((p) => p.id === v) ? v : fallback);

/** Reads a Fridge item's data back into a monster (tolerates old or hand-edited data). */
export function sanitizeMonster(data: unknown): MonsterSpec {
  const o = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 24) : DEFAULT_MONSTER.name;
  return {
    v: 1, body: oneOf(o.body, BODIES, 'blob'), colour: oneOf(o.colour, COLOURS, 'purple'), eyes: oneOf(o.eyes, EYES, '2'),
    mouth: oneOf(o.mouth, MOUTHS, 'smile'), top: oneOf(o.top, TOPS, 'none'), pattern: oneOf(o.pattern, PATTERNS, 'none'), name,
  };
}

export type Slot = 'body' | 'colour' | 'eyes' | 'mouth' | 'top' | 'pattern';
export const withPart = (spec: MonsterSpec, slot: Slot, id: string): MonsterSpec => ({ ...spec, [slot]: id });

export function randomMonster(rand: () => number): MonsterSpec {
  const p = <T extends Part>(l: readonly T[]): string => l[Math.floor(rand() * l.length) % l.length]!.id;
  return { v: 1, body: p(BODIES), colour: p(COLOURS), eyes: p(EYES), mouth: p(MOUTHS), top: p(TOPS), pattern: p(PATTERNS), name: monsterName(rand) };
}

export function monsterTitle(spec: MonsterSpec): string {
  return `${spec.name} the monster`;
}

export function describeMonster(spec: MonsterSpec): string {
  const name = (list: readonly Part[], id: string): string => (list.find((p) => p.id === id)?.name ?? id).toLowerCase();
  const top = spec.top === 'none' ? '' : `, with ${name(TOPS, spec.top)}`;
  const pat = spec.pattern === 'none' ? '' : ` and ${name(PATTERNS, spec.pattern)}`;
  return `${spec.name}, a ${name(COLOURS, spec.colour)} monster with a ${name(BODIES, spec.body)}, ${name(EYES, spec.eyes)} and a ${name(MOUTHS, spec.mouth)}${top}${pat}`;
}

// ── drawing (a 200 × 240 board; feet at y ≈ 212) ──

interface Shape {
  readonly d: string;
  /** Top of the head where horns and ears attach, and how wide the head is there. */
  readonly topY: number;
  readonly topHalf: number;
}
const SHAPES: Readonly<Record<string, Shape>> = {
  blob: { d: 'M40 202C20 162 28 92 68 72C100 58 140 68 160 102C184 142 176 192 150 206C120 216 70 216 40 202z', topY: 64, topHalf: 30 },
  tall: { d: 'M58 208C50 160 54 112 64 88C72 62 128 62 136 88C146 112 150 160 142 208C120 216 80 216 58 208z', topY: 66, topHalf: 28 },
  round: { d: 'M100 70C146 70 172 102 172 140C172 184 142 212 100 212C58 212 28 184 28 140C28 102 54 70 100 70z', topY: 72, topHalf: 36 },
  cube: { d: 'M66 76H134Q162 76 162 104V182Q162 212 134 212H66Q38 212 38 182V104Q38 76 66 76z', topY: 76, topHalf: 38 },
  bean: { d: 'M52 200C34 154 44 98 86 80C124 64 168 90 162 142C158 182 132 212 100 212C80 212 62 208 52 200z', topY: 70, topHalf: 30 },
};

const CHEEKS = (y: number): Spec[] => [cheek(58, y, 11), cheek(142, y, 11)];

function eyeSpec(cx: number, cy: number, r: number): Spec[] {
  return [
    ['circle', { cx, cy, r, fill: '#fff' }],
    ['circle', { cx: cx + r * 0.1, cy: cy + r * 0.12, r: r * 0.52, fill: '#2b1a4d' }],
    ['circle', { cx: cx - r * 0.12, cy: cy - r * 0.18, r: r * 0.2, fill: '#fff' }],
  ];
}

function eyesSpec(id: string): Spec[] {
  switch (id) {
    case '1': return eyeSpec(100, 112, 24);
    case '3': return [...eyeSpec(66, 116, 14), ...eyeSpec(134, 116, 14), ...eyeSpec(100, 98, 16)];
    case '4': return [...eyeSpec(64, 112, 11), ...eyeSpec(88, 104, 11), ...eyeSpec(112, 104, 11), ...eyeSpec(136, 112, 11)];
    default: return [...eyeSpec(76, 112, 17), ...eyeSpec(124, 112, 17)];
  }
}

const INK = '#4a1f3d';
const TOOTH = '#fffdf5';

function mouthSpec(id: string): Spec[] {
  switch (id) {
    case 'grin': return [
      ['path', { d: 'M62 148Q100 150 138 148Q134 184 100 186Q66 184 62 148z', fill: INK }],
      ['path', { d: 'M66 149H134L132 158H68z', fill: TOOTH }],
      ['path', { d: 'M72 176Q100 190 128 176L126 184Q100 192 74 184z', fill: TOOTH }],
    ];
    case 'oh': return [['ellipse', { cx: 100, cy: 164, rx: 13, ry: 17, fill: INK }], ['ellipse', { cx: 100, cy: 171, rx: 8, ry: 7, fill: '#ff7a8a' }]];
    case 'tongue': return [
      ['path', { d: 'M68 152Q100 186 132 152Q100 160 68 152z', fill: INK }],
      ['path', { d: 'M90 163C90 184 112 184 112 163Q101 168 90 163z', fill: '#ff7a8a' }],
    ];
    case 'fangs': return [
      ['path', { d: 'M66 152Q100 184 134 152Q100 160 66 152z', fill: INK }],
      ['path', { d: 'M76 156L82 170L88 159z', fill: TOOTH }], ['path', { d: 'M112 159L118 170L124 156z', fill: TOOTH }],
    ];
    case 'buck': return [
      ['path', { d: 'M70 152Q100 176 130 152Q100 162 70 152z', fill: INK }],
      ['rect', { x: 91, y: 158, width: 9, height: 14, rx: 2.5, fill: TOOTH }], ['rect', { x: 101, y: 158, width: 9, height: 14, rx: 2.5, fill: TOOTH }],
    ];
    case 'wavy': return [['path', { d: 'M66 160Q76 148 86 160T106 160T126 160T136 156', fill: 'none', stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' }]];
    case 'tiny': return [['path', { d: 'M88 158Q100 168 112 158', fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round' }]];
    default: return [['path', { d: 'M64 150Q100 188 136 150', fill: 'none', stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round' }]];
  }
}

function topSpec(id: string, s: Shape, c: Colour): Spec[] {
  const x0 = 100 - s.topHalf;
  const x1 = 100 + s.topHalf;
  const y = s.topY;
  switch (id) {
    case 'horns': return [
      ['path', { d: `M${x0 - 2} ${y + 10}C${x0 - 10} ${y - 12} ${x0 - 4} ${y - 24} ${x0 + 4} ${y - 28}C${x0 + 6} ${y - 14} ${x0 + 14} ${y - 4} ${x0 + 16} ${y + 6}z`, fill: '#ffe7a8' }],
      ['path', { d: `M${x1 + 2} ${y + 10}C${x1 + 10} ${y - 12} ${x1 + 4} ${y - 24} ${x1 - 4} ${y - 28}C${x1 - 6} ${y - 14} ${x1 - 14} ${y - 4} ${x1 - 16} ${y + 6}z`, fill: '#ffe7a8' }],
    ];
    case 'antennae': return [
      ['path', { d: `M${x0 + 12} ${y + 6}Q${x0} ${y - 14} ${x0 + 6} ${y - 30}M${x1 - 12} ${y + 6}Q${x1} ${y - 14} ${x1 - 6} ${y - 30}`, fill: 'none', stroke: c.dark, 'stroke-width': 5, 'stroke-linecap': 'round' }],
      ['circle', { cx: x0 + 6, cy: y - 32, r: 9, fill: '#ffd166' }], ['circle', { cx: x1 - 6, cy: y - 32, r: 9, fill: '#ffd166' }],
    ];
    case 'ears': return [
      ['path', { d: `M${x0 + 6} ${y + 10}C${x0 - 22} ${y - 4} ${x0 - 22} ${y - 40} ${x0 + 2} ${y - 36}C${x0 + 14} ${y - 30} ${x0 + 18} ${y - 6} ${x0 + 22} ${y + 6}z`, fill: c.dark }],
      ['path', { d: `M${x1 - 6} ${y + 10}C${x1 + 22} ${y - 4} ${x1 + 22} ${y - 40} ${x1 - 2} ${y - 36}C${x1 - 14} ${y - 30} ${x1 - 18} ${y - 6} ${x1 - 22} ${y + 6}z`, fill: c.dark }],
      ['path', { d: `M${x0 + 4} ${y - 2}C${x0 - 8} ${y - 12} ${x0 - 6} ${y - 28} ${x0 + 2} ${y - 26}C${x0 + 8} ${y - 22} ${x0 + 10} ${y - 8} ${x0 + 12} ${y}z`, fill: '#ff9fc0' }],
      ['path', { d: `M${x1 - 4} ${y - 2}C${x1 + 8} ${y - 12} ${x1 + 6} ${y - 28} ${x1 - 2} ${y - 26}C${x1 - 8} ${y - 22} ${x1 - 10} ${y - 8} ${x1 - 12} ${y}z`, fill: '#ff9fc0' }],
    ];
    case 'tuft': return [['path', { d: `M84 ${y + 8}C80 ${y - 10} 90 ${y - 24} 100 ${y - 30}C98 ${y - 18} 108 ${y - 22} 112 ${y - 34}C122 ${y - 18} 122 ${y - 4} 116 ${y + 8}z`, fill: c.dark }]];
    case 'bumps': return [
      ['circle', { cx: 82, cy: y + 4, r: 11, fill: c.light }], ['circle', { cx: 100, cy: y - 4, r: 13, fill: c.light }], ['circle', { cx: 118, cy: y + 4, r: 11, fill: c.light }],
    ];
    default: return [];
  }
}

function patternSpec(id: string, clip: string, c: Colour): Spec[] {
  switch (id) {
    case 'spots': return [['g', { 'clip-path': `url(#${clip})`, fill: c.dark, opacity: 0.55 },
      ['circle', { cx: 56, cy: 150, r: 9 }], ['circle', { cx: 150, cy: 132, r: 7 }], ['circle', { cx: 140, cy: 184, r: 11 }], ['circle', { cx: 62, cy: 192, r: 6 }], ['circle', { cx: 100, cy: 84, r: 6 }], ['circle', { cx: 112, cy: 200, r: 5 }]]];
    case 'stripes': return [['g', { 'clip-path': `url(#${clip})`, fill: c.dark, opacity: 0.4 },
      ['rect', { x: 20, y: 184, width: 170, height: 9 }], ['rect', { x: 20, y: 200, width: 170, height: 9 }], ['rect', { x: 20, y: 168, width: 170, height: 9 }]]];
    case 'belly': return [['ellipse', { cx: 100, cy: 192, rx: 34, ry: 22, fill: c.light, opacity: 0.85 }]];
    default: return [];
  }
}

export function monsterSpec(spec: MonsterSpec): Spec {
  const c = COLOURS.find((x) => x.id === spec.colour) ?? COLOURS[0]!;
  const s = SHAPES[spec.body] ?? SHAPES.blob!;
  const clip = uid('mmclip');
  const arm = (side: 1 | -1): Spec => ['g', {},
    ['path', { d: `M${100 + side * 62} 160Q${100 + side * 88} 150 ${100 + side * 90} ${126}`, fill: 'none', stroke: c.dark, 'stroke-width': 13, 'stroke-linecap': 'round' }],
    ['circle', { cx: 100 + side * 90, cy: 122, r: 9, fill: c.dark }]];
  return ['g', { class: 'mm-art' },
    ['defs', {}, ['clipPath', { id: clip }, ['path', { d: s.d }]]],
    ['ellipse', { cx: 100, cy: 218, rx: 66, ry: 8, fill: '#000', opacity: 0.2 }],
    ...topSpec(spec.top, s, c),
    arm(-1), arm(1),
    ['ellipse', { cx: 76, cy: 214, rx: 17, ry: 8, fill: c.dark }], ['ellipse', { cx: 124, cy: 214, rx: 17, ry: 8, fill: c.dark }],
    ['path', { d: s.d, fill: c.base }],
    ['ellipse', { cx: 68, cy: 100, rx: 8, ry: 14, fill: '#fff', opacity: 0.22, transform: 'rotate(24 68 100)' }],
    ...patternSpec(spec.pattern, clip, c),
    ...CHEEKS(spec.eyes === '1' ? 140 : 138),
    ...eyesSpec(spec.eyes),
    ...mouthSpec(spec.mouth)];
}

export function drawMonster(spec: MonsterSpec, view = '0 0 200 240'): SVGSVGElement {
  return build(['svg', { viewBox: view, class: 'mm-svg', 'aria-hidden': 'true', focusable: 'false' }, monsterSpec(spec)]) as SVGSVGElement;
}

const VIEWS: Readonly<Partial<Record<Slot, string>>> = { eyes: '36 80 128 66', mouth: '40 134 120 66' };

/** A button face for one part: the monster with only that part changed (zoomed in for eyes and mouth). */
export function partPreview(spec: MonsterSpec, slot: Slot, id: string): SVGSVGElement {
  return drawMonster(withPart(spec, slot, id), VIEWS[slot]);
}
