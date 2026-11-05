/**
 * Paints the moon as it looks tonight: the lit part from the real illuminated fraction,
 * on the right while it grows (waxing) and on the left while it shrinks, as seen from
 * the northern hemisphere. The terminator is a half-ellipse whose width is |1 − 2f|·r,
 * which is exactly what a lit sphere looks like from far away.
 */

export interface MoonColors {
  readonly lit: string;
  readonly dark: string;
  readonly glow: string;
  readonly crater: string;
}

export const MOON_COLORS: MoonColors = {
  lit: '#fff4c2',
  dark: '#2e3358',
  glow: 'rgba(255, 244, 194, 0.35)',
  crater: 'rgba(196, 170, 110, 0.35)',
};

/** Craters as (x, y, r) in units of the moon's radius. */
const CRATERS: readonly (readonly [number, number, number])[] = [
  [-0.32, -0.28, 0.17], [0.28, -0.42, 0.11], [0.36, 0.18, 0.2], [-0.12, 0.38, 0.13], [-0.5, 0.12, 0.09], [0.05, -0.05, 0.08],
];

function litPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fraction: number): void {
  const f = Math.min(1, Math.max(0, fraction));
  const k = 1 - 2 * f;
  ctx.beginPath();
  // Bright limb: the right half-circle, top to bottom.
  ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
  // Terminator back up: bulging right for a crescent, left for a gibbous moon.
  ctx.ellipse(cx, cy, Math.max(0.001, Math.abs(k) * r), r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
  ctx.closePath();
}

/** Draws the moon centred at (cx, cy) with radius r (CSS px; set the dpr transform first). */
export function drawMoon(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fraction: number, waxing: boolean, colors: MoonColors = MOON_COLORS,
): void {
  ctx.save();
  const halo = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.45);
  halo.addColorStop(0, colors.glow);
  halo.addColorStop(1, 'rgba(255, 244, 194, 0)');
  ctx.fillStyle = halo;
  ctx.globalAlpha = 0.25 + 0.75 * fraction;
  ctx.fillRect(cx - r * 1.5, cy - r * 1.5, r * 3, r * 3);
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = colors.dark;
  ctx.fill();

  ctx.save();
  if (!waxing) {
    // Mirror so the lit side is on the left while the moon shrinks.
    ctx.translate(2 * cx, 0);
    ctx.scale(-1, 1);
  }
  litPath(ctx, cx, cy, r, fraction);
  ctx.fillStyle = colors.lit;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = colors.crater;
  for (const [x, y, cr] of CRATERS) {
    ctx.beginPath();
    ctx.arc(cx + (waxing ? x : -x) * r, cy + y * r, cr * r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1.5, r * 0.06);
  ctx.strokeStyle = 'rgba(31, 26, 61, 0.9)';
  ctx.stroke();
  ctx.restore();
}
