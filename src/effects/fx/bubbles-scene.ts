/**
 * bubbles-scene.ts — the scenery painters behind the bubbles preset (split out to keep bubbles.ts readable):
 * the soap-bubble and pop sprites, the turning globe (Earth Day), dragon-boat crews (Dragon Boat) and
 * sprouts (Earth Day). Everything draws from pool fields the preset owns; nothing allocates per frame.
 */
import { withAlpha } from '../painters';
import { quant } from '../painters/extra-whimsy';
import { TAU, clamp, type ParticlePool } from '../particles';
import type { SpriteCache, SpritePainter } from '../types';

const LAND_COLORS = ['#3fae4f', '#6cc35a', '#e9c46a'] as const;
/** Continents on the globe: longitude, latitude (rad), size (share of the diameter), shape seed, colour. */
const LANDS: readonly (readonly [number, number, number, number, number])[] = [
  [0, 0.45, 0.42, 0, 0], [0.5, -0.35, 0.36, 1, 1], [1.5, 0.55, 0.5, 2, 0], [2.0, -0.15, 0.3, 3, 2],
  [2.9, 0.25, 0.44, 1, 1], [3.8, -0.5, 0.34, 0, 0], [4.6, 0.1, 0.4, 3, 1], [5.4, -0.2, 0.28, 2, 2],
];
const WISPS: readonly (readonly [number, number, number, number])[] = [
  [0.8, 0.2, 0.3, 2], [2.4, -0.4, 0.26, 0], [4.1, 0.5, 0.28, 3], [5.6, -0.05, 0.24, 1],
];
export const LAND_NAMES = ['bubbles:land0', 'bubbles:land1', 'bubbles:land2', 'bubbles:land3'] as const;
export const ROWERS = 8;

export function easeOut(k: number): number {
  const u = clamp(k, 0, 1);
  return 1 - (1 - u) * (1 - u) * (1 - u);
}

/** A soap bubble: clear middle, tinted rim with pastel interference arcs, a window highlight. */
export const iridescentBubble: SpritePainter = (ctx, size, color) => {
  const r = size / 2 - 1;
  const g = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r);
  g.addColorStop(0, withAlpha(color, 0.04));
  g.addColorStop(0.82, withAlpha(color, 0.13));
  g.addColorStop(1, withAlpha(color, 0.4));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.lineWidth = Math.max(1, size * 0.03);
  ctx.strokeStyle = withAlpha(color, 0.7);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, size * 0.045);
  for (const [c, a0, a1] of [['#ff9ad5', 0.3, 1.8], ['#7fe7ff', 2.5, 3.9], ['#fff3a0', 4.2, 5.2]] as const) {
    ctx.strokeStyle = withAlpha(c, 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, a0, a1);
    ctx.stroke();
  }
  ctx.fillStyle = withAlpha('#ffffff', 0.85);
  ctx.beginPath();
  ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.24, r * 0.11, -0.75, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-r * 0.08, -r * 0.64, r * 0.06, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#ffffff', 0.4);
  ctx.lineWidth = Math.max(0.75, size * 0.03);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.7, 0.35, 1.2);
  ctx.stroke();
};

/** The instant a bubble pops: a ring of eight short dashes flying outward. */
export const popBurst: SpritePainter = (ctx, size, color) => {
  const r = size / 2 - 1;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, size * 0.05);
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (k * TAU) / 8 + 0.2;
    ctx.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62);
    ctx.lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92);
  }
  ctx.stroke();
};

/** x offset of rower `r` along a boat of width `s`. */
export function rowerX(r: number, s: number): number {
  return -s * 0.28 + ((r + 0.5) / ROWERS) * s * 0.58;
}

/** A dragon boat at (x, y) tilted by `tilt`: paddles sweeping with stroke phase `ph`, the hull, then the crew. */
export function drawBoat(ctx: CanvasRenderingContext2D, sprites: SpriteCache, x: number, y: number, s: number, tilt: number, ph: number): void {
  const c = Math.cos(tilt);
  const sn = Math.sin(tilt);
  ctx.globalAlpha = 1;
  // Paddles: from each rower's shoulder down into the water, sweeping with the stroke.
  ctx.strokeStyle = '#7a4a22';
  ctx.lineWidth = Math.max(1.5, s * 0.008);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let r = 0; r < ROWERS; r++) {
    const rx = rowerX(r, s);
    const sweep = Math.sin(ph) * s * 0.045;
    const ax = rx + s * 0.005;
    const ay = -s * 0.06;
    const bx = rx + sweep + s * 0.02;
    const by = s * 0.075 + Math.max(0, Math.cos(ph)) * s * 0.01;
    ctx.moveTo(x + ax * c - ay * sn, y + ax * sn + ay * c);
    ctx.lineTo(x + bx * c - by * sn, y + bx * sn + by * c);
  }
  ctx.stroke();
  const paint = Math.min(384, s);
  sprites.draw(ctx, 'bubbles:boat', paint, '#d62828', x, y, tilt, s / paint, s / paint);
  const lean = Math.sin(ph) * 0.15;
  for (let r = 0; r < ROWERS; r++) {
    const rx = rowerX(r, s) + lean * s * 0.02;
    const by = -s * 0.04;
    const hy = -s * 0.075;
    sprites.draw(ctx, 'circle', quant(s * 0.04, 2), r % 2 === 0 ? '#ffd166' : '#ffb703', x + rx * c - by * sn, y + rx * sn + by * c, 0, 1, 1.2);
    sprites.draw(ctx, 'circle', quant(s * 0.028, 2), '#5a3825', x + rx * c - hy * sn, y + rx * sn + hy * c);
  }
}

/** The turning Earth: atmosphere glow, ocean, continents and cloud wisps clipped to the disc, shading. */
export function drawGlobe(ctx: CanvasRenderingContext2D, sprites: SpriteCache, cx: number, cy: number, d: number, spinA: number): void {
  if (d < 4) return;
  const r = d / 2;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.4;
  const halo = quant(Math.min(d * 1.5, 700), 32);
  sprites.draw(ctx, 'glow', halo, '#9be7ff', cx, cy, 0, (d * 1.5) / halo, (d * 1.5) / halo);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  const paint = Math.min(384, quant(d, 16));
  sprites.draw(ctx, 'bubbles:ocean', paint, '#1c7ed6', cx, cy, 0, d / paint, d / paint);
  // One clip per frame (not per particle) keeps the continents on the disc.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, 0, TAU);
  ctx.clip();
  for (let k = 0; k < LANDS.length; k++) {
    const [lon, lat, size, seed, color] = LANDS[k]!;
    onGlobe(ctx, sprites, cx, cy, r, lon + spinA, lat, size * d, LAND_NAMES[seed]!, LAND_COLORS[color]!, 1);
  }
  for (let k = 0; k < WISPS.length; k++) {
    const [lon, lat, size, seed] = WISPS[k]!;
    onGlobe(ctx, sprites, cx, cy, r, lon + spinA * 1.35, lat, size * d, LAND_NAMES[seed]!, '#ffffff', 0.5);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  sprites.draw(ctx, 'bubbles:shade', paint, '#06213a', cx, cy, 0, d / paint, d / paint);
}

/** A feature at longitude `a`, latitude `lat`: foreshortened toward the limb, fading on the far side. */
function onGlobe(
  ctx: CanvasRenderingContext2D, sprites: SpriteCache, cx: number, cy: number, r: number, a: number, lat: number, size: number, name: string,
  color: string, alpha: number,
): void {
  const c = Math.cos(a);
  if (c <= 0) return;
  const cl = Math.cos(lat);
  const x = cx + r * Math.sin(a) * cl * 0.95;
  const y = cy - r * Math.sin(lat) * 0.95;
  const paint = Math.min(192, quant(size, 16));
  const k = size / paint;
  ctx.globalAlpha = alpha * clamp(c * 1.8, 0, 1);
  sprites.draw(ctx, name, paint, color, x, y, 0, k * Math.max(0.12, c) * (0.6 + 0.4 * cl), k * (0.7 + 0.3 * cl));
}

/** Sprouts (particles of `kind`): a soil mound, a curving stem (one path), and leaves unfurling at the top. */
export function drawSprouts(
  ctx: CanvasRenderingContext2D, sprites: SpriteCache, pool: ParticlePool, kind: number, t: number, h: number, grow: number,
): void {
  for (let i = 0; i < pool.count; i++) {
    if (pool.kind[i] !== kind) continue;
    ctx.globalAlpha = 1;
    sprites.draw(ctx, 'circle', quant(pool.size[i]! * 0.7, 4), '#6b4423', pool.x[i]!, pool.y[i]! + 2, 0, 1, 0.32);
  }
  ctx.strokeStyle = '#3fae4f';
  ctx.lineCap = 'round';
  ctx.lineWidth = clamp(h * 0.008, 3, 6);
  ctx.beginPath();
  for (let i = 0; i < pool.count; i++) {
    if (pool.kind[i] !== kind) continue;
    const g = easeOut(pool.life[i]! / grow);
    const H = pool.size[i]! * g;
    const lean = (pool.rot[i]! + 0.05 * Math.sin(t * 1.4 + pool.phase[i]!)) * H;
    const x = pool.x[i]!;
    const y = pool.y[i]!;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - lean * 0.4, y - H * 0.55, x + lean, y - H);
  }
  ctx.stroke();
  for (let i = 0; i < pool.count; i++) {
    if (pool.kind[i] !== kind) continue;
    const g = easeOut(pool.life[i]! / grow);
    const leafG = easeOut((pool.life[i]! - 0.4) / (grow - 0.4));
    if (leafG <= 0.02) continue;
    const H = pool.size[i]! * g;
    const sway = 0.05 * Math.sin(t * 1.4 + pool.phase[i]!);
    const tx = pool.x[i]! + (pool.rot[i]! + sway) * H;
    const ty = pool.y[i]! - H;
    const ls = quant(pool.size[i]! * 0.42, 4);
    const open = 0.35 + 0.65 * leafG;
    for (let side = -1; side <= 1; side += 2) {
      const a = side * (0.25 + 0.75 * leafG) + sway;
      sprites.draw(ctx, 'bubbles:leaf', ls, side < 0 ? '#3fae4f' : '#6cc35a', tx + Math.sin(a) * ls * 0.42 * open, ty - Math.cos(a) * ls * 0.42 * open, a, leafG, leafG);
    }
  }
}
