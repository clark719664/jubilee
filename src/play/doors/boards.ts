/**
 * doors/boards.ts — the holiday skins, drawn with `svg()` and CSS (no art files needed).
 *
 *   advent     Christmas: a wooden advent calendar under a snowy village roofline
 *   niches     Diwali: arched niches in a palace wall under a marigold-and-mango-leaf toran, diyas inside
 *   house      Hanukkah: a blue house, 8 windows upstairs and 4 down
 *   lanterns   Eid / Ramadan: a string of lanterns under a moon that waxes from crescent to full
 *   haunted    Halloween: a friendly haunted house whose windows glow
 *   envelopes  Lunar New Year: a wall of red envelopes under two hanging lanterns
 *   eggs       Easter: eggs in the grass
 *   doors      everything else: numbered doors in the holiday's own colors under bunting
 *
 * Respect rules (ART_BRIEF): no faces on diyas, crescents or menorahs (pumpkins may smile), no text, no
 * flags, no religious figures. Colors come from the holiday theme (`--h-*`) wherever the skin allows.
 */
import { svg } from '../../ui/dom';
import { mulberry32 } from '../../effects/rng';
import type { Skin } from './logic';

let uid = 0;
const nextId = (p: string): string => `${p}-${++uid}`;

const deco = (cls: string, viewBox: string, aspect: string, ...children: SVGElement[]): SVGSVGElement =>
  svg('svg', { class: `dr-deco-svg ${cls}`, viewBox, preserveAspectRatio: aspect, 'aria-hidden': 'true', focusable: 'false' }, ...children);

// ───────── Christmas: snowy village roofline ─────────

function village(): SVGSVGElement {
  const rand = mulberry32(1225);
  const parts: SVGElement[] = [];
  const bodies = ['#8b4a2b', '#a65d34', '#7a3f24', '#b86b3c'];
  const xs = [10, 92, 168, 252, 470, 552, 634, 712];
  xs.forEach((x, i) => {
    const w = 64 + Math.round(rand() * 14);
    const hgt = 30 + Math.round(rand() * 16);
    const base = 96;
    const top = base - hgt;
    const roof = 22 + Math.round(rand() * 8);
    parts.push(svg('rect', { x, y: top, width: w, height: hgt, fill: bodies[i % bodies.length]!, rx: 2 }));
    parts.push(svg('polygon', { points: `${x - 6},${top + 2} ${x + w / 2},${top - roof} ${x + w + 6},${top + 2}`, fill: '#5b2c1a' }));
    // Snow cap: a thinner roof with drips.
    parts.push(svg('path', { d: `M${x - 7} ${top + 1} L${x + w / 2} ${top - roof - 3} L${x + w + 7} ${top + 1} L${x + w - 4} ${top + 5} Q${x + w * 0.75} ${top - roof * 0.3} ${x + w / 2} ${top - roof + 7} Q${x + w * 0.3} ${top - roof * 0.2} ${x + 6} ${top + 6} Z`, fill: '#ffffff' }));
    const win = '#ffd166';
    parts.push(svg('rect', { x: x + 10, y: top + 9, width: 12, height: 12, rx: 2, fill: win }));
    parts.push(svg('rect', { x: x + w - 22, y: top + 9, width: 12, height: 12, rx: 2, fill: win }));
    parts.push(svg('rect', { x: x + w / 2 - 6, y: base - 18, width: 12, height: 18, rx: 6, fill: '#3b1a10' }));
    if (i % 3 === 0) parts.push(svg('rect', { x: x + w - 18, y: top - roof * 0.6, width: 9, height: 16, fill: '#5b2c1a' }));
  });
  // The big tree in the middle, with its star.
  const tx = 400;
  parts.push(svg('polygon', { points: `${tx - 70},96 ${tx},28 ${tx + 70},96`, fill: '#1b6b45' }));
  parts.push(svg('polygon', { points: `${tx - 54},64 ${tx},6 ${tx + 54},64`, fill: '#238a57' }));
  parts.push(svg('path', { d: `M${tx - 60} 80 Q${tx} 98 ${tx + 60} 76`, stroke: '#ffd166', 'stroke-width': 3, fill: 'none', 'stroke-dasharray': '2 9', 'stroke-linecap': 'round' }));
  parts.push(svg('path', { d: `M${tx - 40} 52 Q${tx} 66 ${tx + 40} 48`, stroke: '#ff4d5e', 'stroke-width': 3, fill: 'none', 'stroke-dasharray': '2 9', 'stroke-linecap': 'round' }));
  parts.push(svg('path', { class: 'dr-twinkle', d: `M${tx} -8 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1z`, fill: '#ffd166', stroke: '#fff4c2', 'stroke-width': 2 }));
  // Snowy ground.
  parts.push(svg('path', { d: 'M0 92 Q60 84 120 92 T240 90 T360 93 T480 89 T600 93 T720 89 T800 92 V100 H0 Z', fill: '#ffffff' }));
  return deco('dr-village', '0 -12 800 112', 'xMidYMax slice', ...parts);
}

function snowDrift(): SVGSVGElement {
  return deco('dr-drift', '0 0 800 40', 'none',
    svg('path', { d: 'M0 18 Q50 4 100 16 T200 14 T300 18 T400 10 T500 18 T600 12 T700 18 T800 12 V40 H0 Z', fill: '#ffffff' }),
    svg('path', { d: 'M0 28 Q80 20 160 28 T320 26 T480 30 T640 24 T800 28 V40 H0 Z', fill: '#e6f1fb' }));
}

// ───────── Diwali: toran garland and rangoli ─────────

function toran(): SVGSVGElement {
  const parts: SVGElement[] = [svg('path', { d: 'M0 8 H800', stroke: '#ffd166', 'stroke-width': 4 })];
  for (let x = 10, i = 0; x < 800; x += 26, i++) {
    if (i % 2 === 0) {
      parts.push(svg('path', { d: `M${x} 8 q-9 18 0 40 q9 -22 0 -40z`, fill: i % 4 === 0 ? '#2a9d3f' : '#3cb45a', stroke: '#14532d', 'stroke-width': 1.5 }));
    } else {
      parts.push(svg('line', { x1: x, y1: 8, x2: x, y2: 20, stroke: '#ffd166', 'stroke-width': 2 }));
      parts.push(svg('circle', { cx: x, cy: 26, r: 9, fill: i % 4 === 1 ? '#ff9f1c' : '#ffb703' }));
      parts.push(svg('circle', { cx: x, cy: 26, r: 4, fill: '#e85d04' }));
    }
  }
  return deco('dr-toran', '0 0 800 52', 'xMidYMin slice', ...parts);
}

function rangoli(): SVGSVGElement {
  const parts: SVGElement[] = [];
  const colors = ['#ff4d9d', '#ffb703', '#2ec4b6', '#ff7a00', '#9b5de5'];
  for (let ring = 4; ring >= 0; ring--) {
    const r = 14 + ring * 12;
    const petals = 8 + ring * 4;
    for (let k = 0; k < petals; k++) {
      const a = (k / petals) * Math.PI;
      const cx = 100 + Math.cos(Math.PI + a) * r;
      const cy = 64 + Math.sin(Math.PI + a) * r;
      parts.push(svg('circle', { cx: Math.round(cx * 10) / 10, cy: Math.round(cy * 10) / 10, r: 4 + ring * 0.6, fill: colors[ring % colors.length]! }));
    }
  }
  parts.push(svg('circle', { cx: 100, cy: 64, r: 10, fill: '#ffd166' }));
  return deco('dr-rangoli', '0 0 200 64', 'xMidYMax meet', ...parts);
}

/** A clay diya with its flame (no face, ever). The flame shows only once the niche is open. */
export function diya(): SVGSVGElement {
  return svg('svg', { class: 'dr-diya', viewBox: '0 0 60 56', 'aria-hidden': 'true', focusable: 'false' },
    svg('circle', { class: 'dr-diya-halo', cx: 30, cy: 22, r: 20, fill: '#ffd166', opacity: 0.35 }),
    svg('path', { class: 'dr-flame', d: 'M30 4 C38 14 38 24 30 30 C22 24 22 14 30 4 Z', fill: '#ffb703' }),
    svg('path', { class: 'dr-flame', d: 'M30 13 C34 19 34 24 30 28 C26 24 26 19 30 13 Z', fill: '#fff4c2' }),
    svg('path', { d: 'M4 32 Q30 30 56 32 Q52 50 30 52 Q8 50 4 32 Z', fill: '#c4622d' }),
    svg('path', { d: 'M4 32 Q30 38 56 32', stroke: '#ffb703', 'stroke-width': 3, fill: 'none' }),
    svg('circle', { cx: 18, cy: 42, r: 2.5, fill: '#ffd166' }), svg('circle', { cx: 30, cy: 45, r: 2.5, fill: '#ffd166' }), svg('circle', { cx: 42, cy: 42, r: 2.5, fill: '#ffd166' }));
}

// ───────── Eid / Ramadan: the waxing moon and a skyline ─────────

export interface MoonArt { readonly el: SVGSVGElement; set(fill: number): void }

/** A moon that waxes from a thin crescent (fill ≈ 0.1) to full (1). */
export function moon(fill: number): MoonArt {
  const id = nextId('dr-moon');
  const shadow = svg('circle', { cx: 50, cy: 50, r: 41, fill: '#000' });
  const el = svg('svg', { class: 'dr-moon', viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false' },
    svg('defs', {}, svg('mask', { id }, svg('rect', { x: 0, y: 0, width: 100, height: 100, fill: '#fff' }), shadow)),
    svg('circle', { cx: 50, cy: 50, r: 46, style: 'fill: var(--h-glow)', opacity: 0.18 }),
    svg('circle', { cx: 50, cy: 50, r: 40, fill: '#fff4c2', mask: `url(#${id})` }));
  const set = (f: number): void => {
    // The shadow slides off to the left as the moon fills; at 1 it has gone completely.
    const off = Math.max(0, Math.min(1, f)) * 84;
    shadow.setAttribute('cx', String(Math.round((50 + off) * 10) / 10));
  };
  set(fill);
  return { el, set };
}

function skyline(): SVGSVGElement {
  const d = 'M0 60 V44 H40 V30 Q60 12 80 30 V44 H120 V20 L126 8 L132 20 V44 H180 V36 Q200 26 220 36 V44 H300 V26 Q340 -4 380 26 V44 '
    + 'H420 V12 L426 0 L432 12 V44 H470 V34 Q490 20 510 34 V44 H590 V28 Q620 6 650 28 V44 H700 V18 L706 6 L712 18 V44 H760 V36 Q780 26 800 36 V60 Z';
  return deco('dr-skyline', '0 0 800 60', 'xMidYMax slice', svg('path', { d, fill: 'rgba(0, 0, 0, .28)' }));
}

// ───────── Halloween: friendly haunted roofline and pumpkins ─────────

function hauntedRoof(): SVGSVGElement {
  const wall = '#4a2a72';
  const roof = '#2b1450';
  const edge = '#6b3a99';
  return deco('dr-roof-haunted', '0 0 800 140', 'xMidYMax slice',
    svg('circle', { cx: 548, cy: 34, r: 24, fill: '#fff4c2', opacity: 0.95 }),
    svg('polygon', { points: '196,140 286,72 376,140', fill: roof, stroke: edge, 'stroke-width': 4, 'stroke-linejoin': 'round' }),
    svg('polygon', { points: '424,140 514,66 604,140', fill: roof, stroke: edge, 'stroke-width': 4, 'stroke-linejoin': 'round' }),
    svg('rect', { x: 556, y: 70, width: 16, height: 36, fill: roof, stroke: edge, 'stroke-width': 3, transform: 'rotate(8 564 88)' }),
    svg('circle', { class: 'dr-glow-window', cx: 286, cy: 116, r: 10, fill: '#a8ff5e' }),
    svg('circle', { class: 'dr-glow-window', cx: 514, cy: 112, r: 10, fill: '#c77dff' }),
    svg('rect', { x: 345, y: 50, width: 110, height: 90, fill: wall, stroke: edge, 'stroke-width': 4 }),
    svg('polygon', { points: '330,54 400,0 470,54', fill: roof, stroke: edge, 'stroke-width': 4, 'stroke-linejoin': 'round' }),
    svg('circle', { class: 'dr-glow-window', cx: 400, cy: 90, r: 18, fill: '#ff8c1a' }),
    svg('path', { d: 'M382 90 H418 M400 72 V108', stroke: wall, 'stroke-width': 4 }),
    // A small friendly bat.
    svg('path', { class: 'dr-bat', d: 'M236 40 q8 -10 16 -2 q4 -8 8 0 q4 -8 8 0 q8 -8 16 2 q-10 -2 -14 6 q-6 -4 -10 2 q-4 -6 -10 -2 q-4 -8 -14 -6z', fill: '#140a24' }));
}

/** A vertical fill that fades out at the bottom, so ground strips melt into the page instead of ending on a hard edge. */
function fadeDown(color: string, from = 0.55): { readonly defs: SVGElement; readonly fill: string } {
  const id = nextId('dr-fade');
  return {
    defs: svg('defs', {}, svg('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 },
      svg('stop', { offset: 0, 'stop-color': color }), svg('stop', { offset: from, 'stop-color': color }), svg('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 }))),
    fill: `url(#${id})`,
  };
}

function pumpkins(): SVGSVGElement {
  const lawn = fadeDown('#2a5a2a');
  const parts: SVGElement[] = [lawn.defs, svg('path', { d: 'M0 40 Q200 26 400 36 T800 34 V60 H0 Z', fill: lawn.fill })];
  const one = (x: number, s: number): void => {
    parts.push(svg('ellipse', { cx: x, cy: 40, rx: 22 * s, ry: 16 * s, fill: '#ff8c1a' }));
    parts.push(svg('ellipse', { cx: x, cy: 40, rx: 8 * s, ry: 16 * s, fill: '#f07800' }));
    parts.push(svg('rect', { x: x - 2.5 * s, y: 40 - 21 * s, width: 5 * s, height: 7 * s, rx: 2, fill: '#3a5a1a' }));
    // A gentle smile (pumpkins may have faces; these are friendly).
    parts.push(svg('path', { d: `M${x - 9 * s} ${40 + 3 * s} q${9 * s} ${8 * s} ${18 * s} 0`, stroke: '#4a1a00', 'stroke-width': 2.5 * s, fill: 'none', 'stroke-linecap': 'round' }));
    parts.push(svg('circle', { cx: x - 7 * s, cy: 40 - 4 * s, r: 2.6 * s, fill: '#4a1a00' }));
    parts.push(svg('circle', { cx: x + 7 * s, cy: 40 - 4 * s, r: 2.6 * s, fill: '#4a1a00' }));
  };
  one(150, 1); one(220, 0.7); one(400, 1.15); one(590, 0.8); one(660, 1);
  return deco('dr-pumpkins', '0 0 800 60', 'xMidYMax slice', ...parts);
}

// ───────── Lunar New Year: hanging lanterns ─────────

function hangingLanterns(): SVGSVGElement {
  const parts: SVGElement[] = [svg('path', { d: 'M0 4 Q400 24 800 4', stroke: '#ffd166', 'stroke-width': 3, fill: 'none' })];
  for (const x of [190, 400, 610]) {
    parts.push(svg('line', { x1: x, y1: 10, x2: x, y2: 22, stroke: '#ffd166', 'stroke-width': 2 }));
    parts.push(svg('rect', { x: x - 14, y: 20, width: 28, height: 7, rx: 2, fill: '#ffd166' }));
    parts.push(svg('ellipse', { cx: x, cy: 46, rx: 30, ry: 22, fill: '#e01b24' }));
    parts.push(svg('path', { d: `M${x} 24 V68 M${x - 15} 27 Q${x - 26} 46 ${x - 15} 66 M${x + 15} 27 Q${x + 26} 46 ${x + 15} 66`, stroke: '#ffb703', 'stroke-width': 1.6, fill: 'none', opacity: 0.8 }));
    parts.push(svg('rect', { x: x - 14, y: 65, width: 28, height: 7, rx: 2, fill: '#ffd166' }));
    parts.push(svg('path', { class: 'dr-tassel', d: `M${x} 72 V88 M${x - 4} 76 V90 M${x + 4} 76 V90`, stroke: '#ffd166', 'stroke-width': 2 }));
  }
  return deco('dr-hanging', '0 0 800 92', 'xMidYMin slice', ...parts);
}

// ───────── Easter: bunting, grass and flowers ─────────

function bunting(colors: readonly string[]): SVGSVGElement {
  const parts: SVGElement[] = [svg('path', { d: 'M0 4 Q400 30 800 4', stroke: 'currentColor', 'stroke-width': 2.5, fill: 'none', opacity: 0.6 })];
  for (let i = 0, x = 6; x < 790; x += 40, i++) {
    const y = 4 + 26 * (1 - ((x - 400) / 400) ** 2) * 0.97;
    const y2 = 4 + 26 * (1 - ((x + 30 - 400) / 400) ** 2) * 0.97;
    parts.push(svg('polygon', { points: `${x},${y.toFixed(1)} ${x + 30},${y2.toFixed(1)} ${x + 15},${(Math.max(y, y2) + 30).toFixed(1)}`, style: `fill: ${colors[i % colors.length]!}` }));
  }
  return deco('dr-bunting', '0 0 800 64', 'xMidYMin slice', ...parts);
}

function meadow(): SVGSVGElement {
  const rand = mulberry32(4242);
  const lawn = fadeDown('#5cbf5c', 0.6);
  const parts: SVGElement[] = [lawn.defs, svg('path', { d: 'M0 26 Q100 14 200 24 T400 22 T600 24 T800 20 V50 H0 Z', fill: lawn.fill })];
  let d = '';
  for (let x = 0; x < 800; x += 7) {
    const hgt = 8 + rand() * 12;
    d += `M${x} 30 q2 ${-hgt / 2} ${2 + rand() * 3} ${-hgt} `;
  }
  parts.push(svg('path', { d, stroke: '#3fa34d', 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }));
  const petals = ['#ff8fb8', '#ffd166', '#b69cff', '#ffffff'];
  for (let i = 0; i < 14; i++) {
    const x = 20 + i * 57 + rand() * 20;
    const y = 22 + rand() * 14;
    const c = petals[i % petals.length]!;
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      parts.push(svg('circle', { cx: (x + Math.cos(a) * 4).toFixed(1), cy: (y + Math.sin(a) * 4).toFixed(1), r: 3.4, fill: c }));
    }
    parts.push(svg('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 2.4, fill: '#ffb703' }));
  }
  return deco('dr-meadow', '0 0 800 50', 'xMidYMax slice', ...parts);
}

// ───────── assembly ─────────

export interface SkinArt {
  /** Drawn above the doors (roofline, garland, moon…). */
  readonly top: Element[];
  /** Drawn below the doors (snow, rangoli, pumpkins…). */
  readonly bottom: Element[];
  /** Lantern board only: set the moon's fullness 0..1. */
  readonly moon?: MoonArt;
}

export function skinArt(skin: Skin, moonFill: number): SkinArt {
  switch (skin) {
    case 'advent': return { top: [village()], bottom: [snowDrift()] };
    case 'niches': return { top: [toran()], bottom: [rangoli()] };
    case 'house': return { top: [], bottom: [] };
    case 'lanterns': {
      const m = moon(moonFill);
      return { top: [m.el], bottom: [skyline()], moon: m };
    }
    case 'haunted': return { top: [hauntedRoof()], bottom: [pumpkins()] };
    case 'envelopes': return { top: [hangingLanterns()], bottom: [] };
    case 'eggs': return { top: [bunting(['#ff8fb8', '#ffd166', '#9be7d3', '#b69cff', '#7cc4ff'])], bottom: [meadow()] };
    case 'doors': return { top: [bunting(['var(--h-accent)', 'var(--h-glow)', 'var(--h-accent2)'])], bottom: [] };
  }
}

/** Per-door art inside the opening (shown when the door swings open). */
export function insideArt(skin: Skin): Element | null {
  return skin === 'niches' ? diya() : null;
}
