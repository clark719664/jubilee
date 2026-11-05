/**
 * art.ts — Peekaboo Ghosts' drawings: a little ghost with eight different things to wear, and the eight
 * things in the yard it hides behind. Each hiding spot is 120 × 130: a back layer, the ghost peeking
 * (drawn separately so it can rise and fall), and a front layer that covers its lower half.
 */
import { build, cheek, eye, type Spec } from '../spooky/draw';

const GHOST_BODY = 'M-22 44V-6C-22-22-12-32 0-32S22-22 22-6V44Q18 52 13 44Q9 52 4 44Q0 52-4 44Q-9 52-13 44Q-18 52-22 44z';

function accessory(id: string): Spec[] {
  switch (id) {
    case 'bow': return [['path', { d: 'M0-30C-10-42-22-38-20-30C-18-22-8-24 0-30zM0-30C10-42 22-38 20-30C18-22 8-24 0-30z', fill: '#ff5ea8' }], ['circle', { cx: 0, cy: -30, r: 4.5, fill: '#e03a86' }]];
    case 'witch': return [['ellipse', { cx: 0, cy: -26, rx: 26, ry: 5, fill: '#2c1d48' }], ['path', { d: 'M-14-27C-10-40-4-48 4-56Q8-60 14-57Q8-54 9-48C11-42 12-34 14-27z', fill: '#3a2660' }], ['path', { d: 'M-14-30Q0-25 14-30V-27Q0-22-14-27z', fill: '#a8ff5e' }]];
    case 'glasses': return [['circle', { cx: -9, cy: -4, r: 8.5, fill: 'none', stroke: '#7a48b8', 'stroke-width': 2.4 }], ['circle', { cx: 9, cy: -4, r: 8.5, fill: 'none', stroke: '#7a48b8', 'stroke-width': 2.4 }], ['path', { d: 'M-0.5-4h1', stroke: '#7a48b8', 'stroke-width': 2.4 }]];
    case 'crown': return [['path', { d: 'M-14-28L-17-44L-8-36L0-48L8-36L17-44L14-28z', fill: '#ffcf3f' }], ['circle', { cx: 0, cy: -34, r: 2.6, fill: '#ff5ea8' }]];
    case 'flower': return [...[0, 72, 144, 216, 288].map((a): Spec => ['ellipse', { cx: 0, cy: -9, rx: 4.5, ry: 7, fill: '#ff8fb8', transform: `translate(14 -26) rotate(${a})` }]), ['circle', { cx: 14, cy: -26, r: 4, fill: '#ffd166' }]];
    case 'scarf': return [['path', { d: 'M-22 18Q0 28 22 18V28Q0 38-22 28z', fill: '#e5484d' }], ['path', { d: 'M-8 18H0L0 28H-8zM10 18H18L18 28H10z', fill: '#fff', opacity: 0.55 }], ['path', { d: 'M12 30L12 46L20 46L19 30z', fill: '#e5484d' }]];
    case 'party': return [['path', { d: 'M0-52L13-28H-13z', fill: '#7c4dff' }], ['path', { d: 'M-6-38H6L9-32H-9z', fill: '#ffd166' }], ['circle', { cx: 0, cy: -53, r: 4.5, fill: '#ff5ea8' }]];
    default: return [];
  }
}

/** A ghost centered on (0, 0): its head top at y -32, feet at y 44. */
export function ghostSpec(hat: string): Spec {
  return ['g', {},
    ['path', { d: GHOST_BODY, fill: '#f6f0ff' }],
    ['path', { d: 'M12-24C20-16 22-6 22-4V44Q19 50 15 45C18 24 19-6 12-24z', fill: '#ddd2f2' }],
    ['path', { d: 'M-22 6Q-36 2-34 16Q-30 22-22 18z', fill: '#f6f0ff' }], ['path', { d: 'M22 6Q36 2 34 16Q30 22 22 18z', fill: '#f6f0ff' }],
    ...eye(-9, -4, 5), ...eye(9, -4, 5), ['ellipse', { cx: 0, cy: 12, rx: 3.6, ry: 4.6, fill: '#2b1a4d' }], cheek(-15, 8, 4.4), cheek(15, 8, 4.4),
    ...accessory(hat)];
}

/** A small icon of a ghost for the tray (found = in color, not yet = a faint outline). */
export function ghostIcon(hat: string, found: boolean): SVGSVGElement {
  return build(['svg', { viewBox: '-40 -62 80 120', class: `pb-icon${found ? ' is-found' : ''}`, 'aria-hidden': 'true', focusable: 'false' }, ghostSpec(hat)]) as SVGSVGElement;
}

const g = (...kids: Spec[]): Spec => ['g', {}, ...kids];

interface SpotArt {
  readonly back: Spec;
  readonly front: Spec;
}

export const SPOTS: Readonly<Record<string, SpotArt>> = {
  window: {
    back: g(['rect', { x: 8, y: 14, width: 104, height: 110, rx: 8, fill: '#6b5aa8' }], ['rect', { x: 22, y: 26, width: 76, height: 84, rx: 6, fill: '#ffcf70' }]),
    front: g(['path', { d: 'M60 26V110M22 68H98', stroke: '#6b5aa8', 'stroke-width': 4 }], ['rect', { x: 18, y: 22, width: 84, height: 92, rx: 8, fill: 'none', stroke: '#d5c8b9', 'stroke-width': 6 }],
      ['rect', { x: 14, y: 108, width: 92, height: 14, rx: 5, fill: '#d5c8b9' }], ['path', { d: 'M22 26Q34 60 26 108H22z', fill: '#c0392b', opacity: 0.85 }], ['path', { d: 'M98 26Q86 60 94 108H98z', fill: '#c0392b', opacity: 0.85 }]),
  },
  tombstone: {
    back: g(['ellipse', { cx: 60, cy: 120, rx: 52, ry: 8, fill: '#000', opacity: 0.2 }]),
    front: g(['path', { d: 'M26 124V68Q26 36 60 36T94 68V124z', fill: '#9a96ab' }], ['path', { d: 'M34 124V70Q34 46 60 46', fill: 'none', stroke: '#bcb8cc', 'stroke-width': 4, 'stroke-linecap': 'round' }],
      ['path', { d: 'M52 62h16M60 54v24', stroke: '#6f6b82', 'stroke-width': 4, 'stroke-linecap': 'round' }], ['ellipse', { cx: 60, cy: 124, rx: 44, ry: 8, fill: '#4a8a3a' }]),
  },
  bush: {
    back: g(),
    front: g(['circle', { cx: 32, cy: 94, r: 28, fill: '#3f8f4a' }], ['circle', { cx: 88, cy: 94, r: 28, fill: '#3f8f4a' }], ['circle', { cx: 60, cy: 80, r: 34, fill: '#4fa85a' }], ['circle', { cx: 44, cy: 70, r: 6, fill: '#7ccf84', opacity: 0.6 }], ['rect', { x: 10, y: 112, width: 100, height: 12, rx: 6, fill: '#2f6f3a' }]),
  },
  pumpkin: {
    back: g(),
    front: g(['ellipse', { cx: 36, cy: 94, rx: 26, ry: 32, fill: '#e0640c' }], ['ellipse', { cx: 84, cy: 94, rx: 26, ry: 32, fill: '#e0640c' }], ['ellipse', { cx: 60, cy: 92, rx: 30, ry: 36, fill: '#ff8c1a' }],
      ['path', { d: 'M56 58C54 50 58 46 66 44L68 50C64 52 64 56 66 60z', fill: '#5a8a2a' }], ['path', { d: 'M46 86L52 78L58 88zM64 88L70 78L76 86zM48 100Q60 112 72 100Q70 106 60 106Q50 106 48 100z', fill: '#34140a' }]),
  },
  tree: {
    back: g(['path', { d: 'M20 124Q18 84 34 50M100 124Q102 84 86 50', fill: 'none', stroke: '#3a2a22', 'stroke-width': 3, opacity: 0 }]),
    front: g(['path', { d: 'M24 126C30 100 26 78 22 60C34 66 40 56 46 44C52 52 68 52 74 44C80 56 86 66 98 60C94 78 90 100 96 126z', fill: '#6b4430' }],
      ['path', { d: 'M36 120C38 96 36 80 34 66', fill: 'none', stroke: '#8a5a3c', 'stroke-width': 4, 'stroke-linecap': 'round' }], ['ellipse', { cx: 60, cy: 126, rx: 44, ry: 6, fill: '#4a8a3a' }],
      ['circle', { cx: 78, cy: 96, r: 7, fill: '#3a2a22' }]),
  },
  barrel: {
    back: g(),
    front: g(['path', { d: 'M24 120C14 100 14 70 24 52H96C106 70 106 100 96 120z', fill: '#a8703a' }], ['path', { d: 'M20 66Q60 74 100 66M18 86Q60 94 102 86M20 106Q60 114 100 106', fill: 'none', stroke: '#5a3a1a', 'stroke-width': 5 }],
      ['path', { d: 'M34 56V118M60 54V120M86 56V118', stroke: '#8a5a2a', 'stroke-width': 2.4, opacity: 0.6 }], ['ellipse', { cx: 60, cy: 52, rx: 36, ry: 7, fill: '#c28a50' }]),
  },
  door: {
    back: g(['rect', { x: 20, y: 18, width: 80, height: 108, rx: 8, fill: '#6b5aa8' }], ['path', { d: 'M30 126V50Q30 26 60 26T90 50V126z', fill: '#ffcf70' }]),
    front: g(['path', { d: 'M26 126V50Q26 22 60 22T94 50V126', fill: 'none', stroke: '#d5c8b9', 'stroke-width': 6 }], ['path', { d: 'M30 126V50Q30 30 52 28L52 120z', fill: '#8a5a3c' }],
      ['rect', { x: 14, y: 120, width: 92, height: 8, rx: 4, fill: '#d5c8b9' }], ['circle', { cx: 46, cy: 84, r: 3, fill: '#ffe7a8' }]),
  },
  hay: {
    back: g(),
    front: g(['path', { d: 'M8 124C10 90 30 62 60 58C90 62 110 90 112 124z', fill: '#e8c04a' }], ['path', { d: 'M24 118L36 86M44 118L54 76M64 118L70 74M84 118L82 82M100 118L90 90', stroke: '#c9a02a', 'stroke-width': 3, 'stroke-linecap': 'round' }],
      ['path', { d: 'M20 100L8 96M96 102L112 98', stroke: '#e8c04a', 'stroke-width': 3, 'stroke-linecap': 'round' }]),
  },
};

/** Where the ghost's middle sits behind each thing, so its eyes just clear the top. */
export const PEEK_Y: Readonly<Record<string, number>> = { window: 72, tombstone: 32, bush: 38, pumpkin: 46, tree: 40, barrel: 40, door: 74, hay: 50 };

export interface SpotEls {
  readonly svg: SVGSVGElement;
  readonly ghost: SVGGElement;
}

/** One hiding spot with a (hidden) ghost wearing `hat` between its back and front layers. */
export function drawSpot(place: string, hat: string): SpotEls {
  const art = SPOTS[place] ?? SPOTS.bush!;
  const svg = build(['svg', { viewBox: '0 -16 120 146', class: 'pb-spot-svg', 'aria-hidden': 'true', focusable: 'false' },
    art.back,
    ['g', { class: 'pb-ghost', style: `--cy:${PEEK_Y[place] ?? 44}px` }, ['g', { class: 'pb-ghost-in' }, ghostSpec(hat)]],
    art.front]) as SVGSVGElement;
  return { svg, ghost: svg.querySelector('.pb-ghost-in') as SVGGElement };
}
