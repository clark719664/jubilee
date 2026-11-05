/**
 * sky.ts — the book's own moon, a full-artboard SVG plane that sits behind the scene's back layer.
 *
 * Scenes never draw the sky (docs/ART.md): on the holiday page the moon is painted by the effect canvas,
 * which the story does not run. So a book whose words point at the moon ("a silver crescent as thin as a
 * fingernail", "the roundest moon") carries one in its data, and it pans with the scene's farthest plane.
 * The full moon matches the Mid-Autumn effect (warm face, soft maria, the Jade Rabbit at its mortar).
 */
import { svg } from '../../ui/dom';
import { ARTBOARD, type StoryMoon } from './types';

const FACE = '#ffe9a8';
const HALO = '#fff1b8';
const SILVER = '#f7f2de';
const RABBIT = '#a8742a';

let uid = 0;

/** Same tiny hash as the effect painters, so craters land in the same places on every render. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const f = (n: number): string => (Math.round(n * 10) / 10).toString();
const deg = (rad: number): string => f((rad * 180) / Math.PI);

function ellipse(cx: number, cy: number, rx: number, ry: number, rot = 0, attrs: Record<string, string | number> = {}): SVGEllipseElement {
  return svg('ellipse', { cx: f(cx), cy: f(cy), rx: f(rx), ry: f(ry), ...(rot ? { transform: `rotate(${deg(rot)} ${f(cx)} ${f(cy)})` } : {}), ...attrs });
}

/** The Jade Rabbit sitting left-facing at its mortar, pestle raised (moonRabbit + moonPestle as SVG). */
function rabbit(x: number, y: number, s: number): SVGGElement {
  const g = svg('g', { fill: RABBIT, opacity: 0.3 });
  g.append(
    ellipse(x + s * 0.1, y + s * 0.14, s * 0.22, s * 0.2, -0.2),
    svg('circle', { cx: f(x - s * 0.1), cy: f(y - s * 0.1), r: f(s * 0.13) }),
  );
  for (const [ex, a, l] of [[-0.08, -0.35, 0.22], [0, -0.15, 0.24]] as const) {
    g.append(ellipse(x + ex * s + Math.sin(a) * l * s * 0.5, y - s * 0.2 - Math.cos(a) * l * s * 0.5, s * 0.045, l * s * 0.55, a));
  }
  g.append(
    svg('circle', { cx: f(x + s * 0.31), cy: f(y + s * 0.24), r: f(s * 0.06) }),
    ellipse(x - s * 0.2, y + s * 0.06, s * 0.06, s * 0.035, 0.6),
    ellipse(x + s * 0.06, y + s * 0.34, s * 0.14, s * 0.04),
    svg('path', {
      d: `M${f(x - s * 0.48)} ${f(y + s * 0.12)} L${f(x - s * 0.24)} ${f(y + s * 0.12)} Q${f(x - s * 0.25)} ${f(y + s * 0.3)} ${f(x - s * 0.31)} ${f(y + s * 0.3)}`
        + ` L${f(x - s * 0.29)} ${f(y + s * 0.37)} L${f(x - s * 0.43)} ${f(y + s * 0.37)} L${f(x - s * 0.41)} ${f(y + s * 0.3)}`
        + ` Q${f(x - s * 0.47)} ${f(y + s * 0.3)} ${f(x - s * 0.48)} ${f(y + s * 0.12)} Z`,
    }),
  );
  // The pestle, mid-pound.
  const p = s * 0.34;
  const px = x - s * 0.31;
  const py = y - s * 0.1;
  const pestle = svg('g', { transform: `rotate(${deg(-0.35)} ${f(px)} ${f(py)})` },
    svg('rect', { x: f(px - p * 0.07), y: f(py - p * 0.5), width: f(p * 0.14), height: f(p * 0.86), rx: f(p * 0.07) }),
    ellipse(px, py + p * 0.36, p * 0.13, p * 0.12));
  g.append(pestle);
  return g;
}

export function skySvg(moon: StoryMoon): SVGSVGElement {
  const id = `st-sky${++uid}`;
  const { x, y, r } = moon;
  const root = svg('svg', { viewBox: `0 0 ${ARTBOARD.w} ${ARTBOARD.h}`, preserveAspectRatio: 'none', class: 'st-layer st-sky', 'aria-hidden': 'true', focusable: 'false' });
  const halo = svg('radialGradient', { id: `${id}-halo` },
    svg('stop', { offset: 0, 'stop-color': HALO, 'stop-opacity': moon.kind === 'full' ? 0.5 : 0.32 }),
    svg('stop', { offset: 0.45, 'stop-color': HALO, 'stop-opacity': moon.kind === 'full' ? 0.16 : 0.1 }),
    svg('stop', { offset: 1, 'stop-color': HALO, 'stop-opacity': 0 }));
  const defs = svg('defs', {}, halo);
  root.append(defs);
  root.append(svg('circle', { cx: f(x), cy: f(y), r: f(r * (moon.kind === 'full' ? 2.3 : 2.6)), fill: `url(#${id}-halo)` }));

  if (moon.kind === 'crescent') {
    // A waxing crescent just after sunset: a thin lit edge on the right, the rest of the disc dark.
    const mask = svg('mask', { id: `${id}-m`, maskUnits: 'userSpaceOnUse', x: f(x - r * 2), y: f(y - r * 2), width: f(r * 4), height: f(r * 4) },
      svg('circle', { cx: f(x), cy: f(y), r: f(r), fill: '#fff' }),
      svg('circle', { cx: f(x - r * 0.34), cy: f(y - r * 0.1), r: f(r * 0.98), fill: '#000' }));
    defs.append(mask);
    root.append(svg('circle', { cx: f(x), cy: f(y), r: f(r), fill: SILVER, mask: `url(#${id}-m)` }));
    return root;
  }

  const face = svg('radialGradient', { id: `${id}-face`, cx: 0.5, cy: 0.5, r: 0.5, fx: 0.375, fy: 0.35 },
    svg('stop', { offset: 0, 'stop-color': '#fff8e0' }),
    svg('stop', { offset: 0.55, 'stop-color': FACE }),
    svg('stop', { offset: 0.92, 'stop-color': '#f4d88e' }),
    svg('stop', { offset: 1, 'stop-color': '#e9c878' }));
  defs.append(face);
  root.append(svg('circle', { cx: f(x), cy: f(y), r: f(r), fill: `url(#${id}-face)` }));
  const maria = svg('g', { fill: '#c49a4c', opacity: 0.2 });
  for (const [mx, my, rx, ry] of [[-0.38, -0.22, 0.26, 0.2], [0.05, -0.42, 0.18, 0.12], [0.36, -0.05, 0.2, 0.26], [-0.12, 0.38, 0.22, 0.14], [0.28, 0.45, 0.12, 0.08]] as const) {
    maria.append(ellipse(x + mx * r, y + my * r, rx * r, ry * r, mx * 2));
  }
  for (let k = 0; k < 9; k++) {
    const a = hash(k) * Math.PI * 2;
    const d = 0.25 + 0.6 * hash(k + 20);
    maria.append(svg('circle', { cx: f(x + Math.cos(a) * d * r), cy: f(y + Math.sin(a) * d * r), r: f((0.03 + 0.04 * hash(k + 40)) * r) }));
  }
  root.append(maria);
  if (moon.rabbit) root.append(rabbit(x + r * 0.08, y + r * 0.16, r * 0.76));
  return root;
}
