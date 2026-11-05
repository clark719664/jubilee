/**
 * backdrop.ts — the far-away landscape behind the arcade for holidays that have no illustrated scene
 * yet: a moon (night) or sun (day), a few soft clouds, and two rolling hill bands in the theme's
 * colours. It is painted once per size into its own canvas (no per-frame cost) and is quiet on purpose:
 * nothing in it moves or falls, so it can never be mistaken for a catchable item. When the holiday's
 * scene art lands (`sceneFor`), the scene layers replace this entirely.
 */
import { mixColor, withAlpha } from '../../effects/painters';
import { circlePath } from '../../effects/painters/shapes';
import { mulberry32 } from '../../effects/rng';
import type { Theme } from '../../theme/themes';

const TAU = Math.PI * 2;

/**
 * Night skies show a full moon only where a full moon belongs to the day (Mid-Autumn, Chuseok, the
 * Lantern Festival on the first full moon, and Halloween's storybook moon). Diwali falls on a new-moon
 * night and Eid begins at a thin crescent, so a stock full moon would be wrong there: they get none.
 */
export const FULL_MOON_HOLIDAYS: ReadonlySet<string> = new Set(['mid-autumn-festival', 'chuseok', 'lantern-festival', 'halloween']);

export interface BackdropOptions {
  readonly theme: Theme;
  readonly holidayId: string;
  /** Ground colour of the play field, so the near hill melts into it. */
  readonly ground: string;
  /** CSS px of the stage and the screen y of the ground line. */
  readonly w: number;
  readonly h: number;
  readonly groundY: number;
  readonly dpr: number;
  /** Seed so the clouds sit in the same places every time for this holiday. */
  readonly seed: number;
}

/** One rolling hill line from x = 0 to w, peaks seeded; closed down to the bottom of the canvas. */
function hill(g: CanvasRenderingContext2D, w: number, h: number, top: number, amp: number, waves: number, phase: number): void {
  g.beginPath();
  g.moveTo(0, h + 2);
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = top - amp * (0.55 * Math.sin(t * waves * TAU + phase) + 0.45 * Math.sin(t * waves * 1.7 * TAU + phase * 2.3));
    g.lineTo(t * w, y);
  }
  g.lineTo(w, h + 2);
  g.closePath();
}

/** A puffy cloud: overlapping bumps on a rounded flat base, all in ONE path so it fills as a single
 * shape (no seams or overlaps that show when zoomed). circlePath starts a new path, so arcs are added here. */
function cloud(g: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const bump = (bx: number, by: number, r: number): void => {
    g.moveTo(x + bx * s + r * s, y + by * s);
    g.arc(x + bx * s, y + by * s, r * s, 0, TAU);
  };
  g.beginPath();
  bump(-0.3, 0.04, 0.2);
  bump(-0.06, -0.08, 0.28);
  bump(0.22, -0.02, 0.22);
  bump(0.4, 0.08, 0.14);
  // The flat base spans the outer bumps exactly, so its corners hide inside them (older Safari has no roundRect).
  g.rect(x - 0.3 * s, y, 0.7 * s, 0.22 * s);
  g.fill('nonzero');
}

export function paintBackdrop(canvas: HTMLCanvasElement, o: BackdropOptions): void {
  const { theme, w, h, dpr } = o;
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  const g = canvas.getContext('2d');
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  const night = theme.mood === 'night';
  const rand = mulberry32(o.seed);

  // Moon or sun, high up and soft (no sticker rim, part-transparent) so it never reads as a treat.
  const r = Math.max(32, Math.min(70, Math.min(w, h) * 0.095));
  const orb = !night || FULL_MOON_HOLIDAYS.has(o.holidayId);
  const cx = w * (o.seed % 2 ? 0.8 : 0.2);
  const cy = Math.max(r * 1.6, h * 0.16);
  const halo = g.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 3.2);
  halo.addColorStop(0, withAlpha(night ? '#fff4c2' : '#fff7d6', night ? 0.28 : 0.45));
  halo.addColorStop(1, withAlpha(night ? '#fff4c2' : '#fff7d6', 0));
  if (orb) {
    g.fillStyle = halo;
    g.fillRect(cx - r * 3.4, cy - r * 3.4, r * 6.8, r * 6.8);
    g.globalAlpha = night ? 0.7 : 0.75;
    g.fillStyle = night ? '#fff4c2' : '#ffe27a';
    circlePath(g, cx, cy, r);
    g.fill();
    g.globalAlpha = 1;
  }
  if (orb && night) {
    // Two soft craters, inside the disc so nothing floats when zoomed.
    g.fillStyle = withAlpha('#e8d48a', 0.55);
    circlePath(g, cx - r * 0.3, cy - r * 0.15, r * 0.2); g.fill();
    circlePath(g, cx + r * 0.25, cy + r * 0.3, r * 0.13); g.fill();
  }

  // Clouds: pale on day skies, a faint tint of the glow on night skies.
  g.fillStyle = night ? withAlpha(mixColor(theme.bg2, '#ffffff', 0.35), 0.22) : withAlpha('#ffffff', 0.75);
  const clouds = w > 700 ? 4 : 3;
  for (let i = 0; i < clouds; i++) {
    const s = (night ? 70 : 84) + rand() * 50;
    const x = ((i + 0.3 + rand() * 0.4) / clouds) * w;
    const y = h * (0.22 + rand() * 0.26);
    cloud(g, x, y, s);
  }

  // Far and near hills. Colours step from the sky toward the ground so the scene reads as depth.
  const top = o.groundY;
  const far = mixColor(theme.bg2, o.ground, night ? 0.35 : 0.3);
  const near = mixColor(theme.bg2, o.ground, night ? 0.65 : 0.6);
  g.fillStyle = withAlpha(far, night ? 0.85 : 0.7);
  hill(g, w, h, top - Math.min(150, h * 0.2), Math.min(40, h * 0.05), w > 700 ? 1.6 : 1.1, rand() * TAU);
  g.fill();
  g.fillStyle = near;
  hill(g, w, h, top - Math.min(70, h * 0.09), Math.min(24, h * 0.03), w > 700 ? 2.2 : 1.4, rand() * TAU);
  g.fill();
}
