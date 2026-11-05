/**
 * extra-night.ts — sprite painters (and two tiny helpers) for the night presets: bats, lanterns, diyas,
 * menorah, kinara and crescent. Each preset registers the painters it needs in its constructor, guarded
 * by `sprites.has(name)`, under a `<preset>:` prefix so names never collide with other groups.
 *
 * Big scenery (rangoli rings here; the menorah and kinara in extra-night-lights.ts) is painted once at a
 * capped size and drawn with a scale, so a 1280 px hero never rasterizes a 2000 px canvas. Geometry
 * helpers (`branchY`) are shared with the presets so hanging bats sit exactly on the painted branch.
 */
import type { Budgeter } from '../particles';
import type { SpritePainter } from '../types';
import { shade, withAlpha } from './color';
import { TAU, circlePath, roundRectPath, starPath } from './shapes';

export * from './extra-night-lights';

const GOLD = '#ffd166';

// ------------------------------------------------------------------ helpers shared by the night presets

/**
 * `budget.frame(limit)` that sheds ambient particles first: kinds below `sceneryBelow` (candles,
 * lanterns, pumpkins, rangoli rings…) are only trimmed when the budget is smaller than the scenery.
 */
export function frameKeeping(budget: Budgeter, limit: number, sceneryBelow: number): number {
  const pool = budget.pool;
  const cap = Math.max(0, Math.min(Math.floor(limit), pool.capacity));
  for (let i = pool.count - 1; i >= 0 && pool.count > cap; i--) {
    if (pool.kind[i]! >= sceneryBelow) pool.kill(i);
  }
  return budget.frame(limit);
}

/** Quantises a layout size so resizing does not thrash the sprite cache. */
export function quantize(px: number, step = 8): number {
  return Math.max(step, Math.round(px / step) * step);
}

// ------------------------------------------------------------------ bats (Halloween)

/** Jack-o'-lantern: ribbed pumpkin in `color`, curly stem, a carved face lit warm yellow from inside. */
export const pumpkin: SpritePainter = (ctx, size, color) => {
  const s = size;
  const cy = s * 0.08;
  const ribs: readonly (readonly [number, number])[] = [[-0.25, 0.2], [0.25, 0.2], [-0.12, 0.25], [0.12, 0.25], [0, 0.27]];
  for (const [x, rx] of ribs) {
    const g = ctx.createRadialGradient(x * s - s * 0.06, cy - s * 0.12, s * 0.02, x * s, cy, s * 0.36);
    g.addColorStop(0, shade(color, 0.28));
    g.addColorStop(1, shade(color, -0.22));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x * s, cy, rx * s, s * 0.32, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = withAlpha(shade(color, -0.45), 0.45);
    ctx.lineWidth = Math.max(0.6, s * 0.012);
    ctx.stroke();
  }
  ctx.strokeStyle = '#4f7a28';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, s * 0.07);
  ctx.beginPath();
  ctx.moveTo(0, cy - s * 0.28);
  ctx.quadraticCurveTo(s * 0.02, cy - s * 0.4, s * 0.09, cy - s * 0.44);
  ctx.stroke();
  ctx.lineWidth = Math.max(0.8, s * 0.018);
  ctx.beginPath();
  ctx.arc(s * 0.13, cy - s * 0.36, s * 0.05, Math.PI, TAU * 0.95);
  ctx.stroke();
  // Carved face: one path, filled with a candle-lit gradient.
  ctx.beginPath();
  for (const dir of [-1, 1]) {
    ctx.moveTo(dir * s * 0.07, cy - s * 0.02);
    ctx.lineTo(dir * s * 0.2, cy - s * 0.02);
    ctx.lineTo(dir * s * 0.135, cy - s * 0.14);
    ctx.closePath();
  }
  ctx.moveTo(-s * 0.03, cy + s * 0.04);
  ctx.lineTo(s * 0.03, cy + s * 0.04);
  ctx.lineTo(0, cy - s * 0.01);
  ctx.closePath();
  ctx.moveTo(-s * 0.22, cy + s * 0.07);
  ctx.quadraticCurveTo(0, cy + s * 0.32, s * 0.22, cy + s * 0.07);
  ctx.lineTo(s * 0.13, cy + s * 0.12);
  ctx.lineTo(s * 0.09, cy + s * 0.07);
  ctx.lineTo(s * 0.04, cy + s * 0.13);
  ctx.lineTo(-s * 0.04, cy + s * 0.13);
  ctx.lineTo(-s * 0.09, cy + s * 0.07);
  ctx.lineTo(-s * 0.13, cy + s * 0.12);
  ctx.closePath();
  const lit = ctx.createRadialGradient(0, cy + s * 0.05, s * 0.02, 0, cy + s * 0.05, s * 0.26);
  lit.addColorStop(0, '#fff6c2');
  lit.addColorStop(0.6, '#ffd166');
  lit.addColorStop(1, '#ff9f1c');
  ctx.fillStyle = lit;
  ctx.fill();
};

/** Friendly ghost: wavy hem, big eyes, rosy cheeks. */
export const ghost: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, s * 0.36);
  ctx.lineTo(-s * 0.3, -s * 0.08);
  ctx.arc(0, -s * 0.08, s * 0.3, Math.PI, 0);
  ctx.lineTo(s * 0.3, s * 0.36);
  for (let k = 0; k < 4; k++) {
    const x0 = s * 0.3 - (k * s * 0.6) / 4;
    ctx.quadraticCurveTo(x0 - s * 0.075, s * (k % 2 === 0 ? 0.48 : 0.28), x0 - s * 0.15, s * 0.36);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -s * 0.4, 0, s * 0.45);
  g.addColorStop(0, color);
  g.addColorStop(1, withAlpha(color, 0.75));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = '#2a1840';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(dir * s * 0.1, -s * 0.1, s * 0.045, s * 0.07, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  circlePath(ctx, -s * 0.085, -s * 0.13, s * 0.016);
  ctx.fill();
  circlePath(ctx, s * 0.115, -s * 0.13, s * 0.016);
  ctx.fill();
  ctx.fillStyle = withAlpha('#ff8fb8', 0.6);
  circlePath(ctx, -s * 0.17, -s * 0.0, s * 0.04);
  ctx.fill();
  circlePath(ctx, s * 0.17, -s * 0.0, s * 0.04);
  ctx.fill();
  ctx.fillStyle = '#2a1840';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.04, s * 0.035, s * 0.045, 0, 0, TAU);
  ctx.fill();
};

/** Speech bubble saying "boo!" (text painted once into the cache, never per frame). */
export const booBubble: SpritePainter = (ctx, size, color) => {
  const s = size;
  roundRectPath(ctx, -s * 0.46, -s * 0.24, s * 0.92, s * 0.4, s * 0.16);
  ctx.moveTo(s * 0.22, s * 0.12);
  ctx.lineTo(s * 0.4, s * 0.32);
  ctx.lineTo(s * 0.06, s * 0.15);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.max(6, Math.round(s * 0.26))}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('boo!', 0, -s * 0.03);
};

/** Height of the gnarled branch at u ∈ [-0.5, 0.5] of its length (unit coords), shared with the bats. */
export function branchY(u: number): number {
  return 0.06 * Math.sin((u + 0.5) * 5.2) - 0.05 * (u + 0.5);
}

/** A bare branch reaching in from the left edge; the thick end is at -size/2. */
export const branch: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.fillStyle = color;
  ctx.beginPath();
  const N = 24;
  for (let k = 0; k <= N; k++) {
    const u = -0.5 + k / N;
    const half = 0.035 * (1 - (u + 0.5) * 0.85);
    if (k === 0) ctx.moveTo(u * s, (branchY(u) - half) * s);
    else ctx.lineTo(u * s, (branchY(u) - half) * s);
  }
  for (let k = N; k >= 0; k--) {
    const u = -0.5 + k / N;
    const half = 0.035 * (1 - (u + 0.5) * 0.85);
    ctx.lineTo(u * s, (branchY(u) + half) * s);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const twigs: readonly (readonly [number, number, number, number])[] = [
    [-0.3, -1, 0.12, 0.022], [-0.1, 1, 0.09, 0.016], [0.08, -1, 0.1, 0.014], [0.26, -1, 0.07, 0.01], [0.33, 1, 0.06, 0.009],
  ];
  for (const [u, dir, len, wdt] of twigs) {
    const x = u * s;
    const y = branchY(u) * s;
    ctx.lineWidth = Math.max(1, wdt * s);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len * s * 0.3, y + dir * len * s * 0.5, x + len * s * 0.8, y + dir * len * s);
    ctx.stroke();
  }
};

// ------------------------------------------------------------------ lanterns (Lantern Festival)

/** Sky lantern (kongming): paper body glowing from the flame inside, warmest at the bottom. */
export const skyLantern: SpritePainter = (ctx, size, color) => {
  const s = size;
  const top = -s * 0.36;
  const bot = s * 0.3;
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, bot);
  ctx.lineTo(-s * 0.28, top + s * 0.08);
  ctx.quadraticCurveTo(-s * 0.28, top, -s * 0.18, top);
  ctx.lineTo(s * 0.18, top);
  ctx.quadraticCurveTo(s * 0.28, top, s * 0.28, top + s * 0.08);
  ctx.lineTo(s * 0.2, bot);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, shade(color, -0.15));
  g.addColorStop(0.55, shade(color, 0.25));
  g.addColorStop(1, '#fff3c4');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = withAlpha(shade(color, -0.4), 0.35);
  ctx.lineWidth = Math.max(0.6, s * 0.015);
  ctx.beginPath();
  for (const f of [-0.5, 0, 0.5]) {
    ctx.moveTo(f * s * 0.36, top + s * 0.02);
    ctx.lineTo(f * s * 0.26, bot);
  }
  ctx.stroke();
  ctx.fillStyle = withAlpha(shade(color, -0.5), 0.6);
  ctx.beginPath();
  ctx.ellipse(0, bot, s * 0.2, s * 0.04, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff8dc';
  ctx.beginPath();
  ctx.ellipse(0, bot - s * 0.02, s * 0.05, s * 0.07, 0, 0, TAU);
  ctx.fill();
};

// ------------------------------------------------------------------ diyas (Diwali)

/** Clay oil lamp: terracotta bowl in `color`, gold oil, painted dots and a little foot. Flame sits at y = -0.12·size. */
export const diya: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.fillStyle = shade(color, -0.25);
  ctx.beginPath();
  ctx.ellipse(0, s * 0.26, s * 0.16, s * 0.05, 0, 0, TAU);
  ctx.fill();
  const g = ctx.createLinearGradient(0, -s * 0.05, 0, s * 0.26);
  g.addColorStop(0, shade(color, 0.15));
  g.addColorStop(1, shade(color, -0.3));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-s * 0.46, -s * 0.04);
  ctx.quadraticCurveTo(-s * 0.4, s * 0.26, 0, s * 0.26);
  ctx.quadraticCurveTo(s * 0.4, s * 0.26, s * 0.46, -s * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(color, 0.3);
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.04, s * 0.46, s * 0.09, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c98a1a';
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.035, s * 0.38, s * 0.06, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let k = -3; k <= 3; k++) {
    circlePath(ctx, k * s * 0.1, s * 0.08 + Math.abs(k) * Math.abs(k) * s * -0.006, s * 0.022);
    ctx.fill();
  }
  ctx.fillStyle = GOLD;
  for (let k = -2; k <= 2; k++) {
    const x = k * s * 0.13;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.035, s * 0.15);
    ctx.lineTo(x, s * 0.2);
    ctx.lineTo(x + s * 0.035, s * 0.15);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#3a2208';
  ctx.lineWidth = Math.max(0.8, s * 0.025);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.05);
  ctx.lineTo(0, -s * 0.1);
  ctx.stroke();
};

const RANGOLI = ['#ff4d9d', '#ffb703', '#ff7b00', '#2ec4b6', '#ffffff', '#9b5de5', '#06d6a0'] as const;

function rc(k: number): string {
  return RANGOLI[k % RANGOLI.length]!;
}

/** A petal from radius r0 to r1 along angle `a`, `w` wide. */
function petalPath(ctx: CanvasRenderingContext2D, a: number, r0: number, r1: number, w: number): void {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const px = -s;
  const py = c;
  const m = (r0 + r1) / 2;
  ctx.moveTo(c * r0, s * r0);
  ctx.quadraticCurveTo(c * m + px * w, s * m + py * w, c * r1, s * r1);
  ctx.quadraticCurveTo(c * m - px * w, s * m - py * w, c * r0, s * r0);
  ctx.closePath();
}

function dotsRing(ctx: CanvasRenderingContext2D, n: number, r: number, dr: number, color: string, offset = 0): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    const a = offset + (k * TAU) / n;
    ctx.moveTo(Math.cos(a) * r + dr, Math.sin(a) * r);
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, dr, 0, TAU);
  }
  ctx.fill();
}

/**
 * Rangoli ring `k` of 5: each ring is its own sprite (sized to its outer diameter) holding one band of an
 * 8-fold pattern, so the preset can reveal rings one by one as `growth` rises. `color` is the lead hue.
 */
export function rangoliRing(k: number): SpritePainter {
  return (ctx, size, color) => {
    const ro = size / 2;
    const ri = (ro * k) / (k + 1);
    const band = ro - ri;
    const mid = (ri + ro) / 2;
    if (k === 0) {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let p = 0; p < 8; p++) petalPath(ctx, (p * TAU) / 8, ro * 0.2, ro * 0.95, ro * 0.3);
      ctx.fill();
      ctx.fillStyle = rc(1);
      ctx.beginPath();
      for (let p = 0; p < 8; p++) petalPath(ctx, (p * TAU) / 8 + TAU / 16, ro * 0.2, ro * 0.7, ro * 0.18);
      ctx.fill();
      ctx.fillStyle = rc(1);
      circlePath(ctx, 0, 0, ro * 0.3);
      ctx.fill();
      ctx.fillStyle = rc(2);
      circlePath(ctx, 0, 0, ro * 0.17);
      ctx.fill();
      dotsRing(ctx, 8, ro * 0.6, ro * 0.05, '#ffffff');
      return;
    }
    ctx.lineWidth = Math.max(1, band * 0.05);
    ctx.strokeStyle = withAlpha('#ffffff', 0.85);
    circlePath(ctx, 0, 0, ri + band * 0.06);
    ctx.stroke();
    const n = k % 2 === 1 ? 8 : 16;
    const lead = k === 1 ? rc(2) : k === 2 ? rc(3) : k === 3 ? color : rc(1);
    const second = k === 1 ? rc(1) : k === 2 ? rc(6) : k === 3 ? rc(5) : rc(2);
    if (k === 3) {
      // Scalloped lotus arcs.
      ctx.fillStyle = lead;
      ctx.beginPath();
      for (let p = 0; p < 8; p++) {
        const a = (p * TAU) / 8;
        ctx.moveTo(Math.cos(a - 0.36) * (ri + band * 0.1), Math.sin(a - 0.36) * (ri + band * 0.1));
        ctx.quadraticCurveTo(Math.cos(a) * (ro * 1.05), Math.sin(a) * (ro * 1.05), Math.cos(a + 0.36) * (ri + band * 0.1), Math.sin(a + 0.36) * (ri + band * 0.1));
        ctx.closePath();
      }
      ctx.fill();
      ctx.fillStyle = second;
      ctx.beginPath();
      for (let p = 0; p < 8; p++) petalPath(ctx, (p * TAU) / 8, ri + band * 0.15, ri + band * 0.7, band * 0.18);
      ctx.fill();
      dotsRing(ctx, 8, ri + band * 0.55, band * 0.06, '#ffffff', TAU / 16);
    } else {
      ctx.fillStyle = lead;
      ctx.beginPath();
      for (let p = 0; p < n; p++) petalPath(ctx, (p * TAU) / n, ri + band * 0.12, ro * 0.97, band * (n === 8 ? 0.4 : 0.22));
      ctx.fill();
      ctx.fillStyle = second;
      ctx.beginPath();
      for (let p = 0; p < n; p++) petalPath(ctx, (p * TAU) / n, ri + band * 0.22, ri + band * 0.62, band * (n === 8 ? 0.18 : 0.1));
      ctx.fill();
      dotsRing(ctx, n, mid + band * 0.05, band * 0.055, '#ffffff', Math.PI / n);
    }
    dotsRing(ctx, n * 2, ro - band * 0.04, Math.max(0.8, band * 0.035), withAlpha('#ffffff', 0.9));
  };
}

/** Small four-point sparkle for twinkles and bursts. */
export const sparkle: SpritePainter = (ctx, size, color) => {
  starPath(ctx, 0, 0, 4, size / 2, size * 0.12);
  ctx.fillStyle = color;
  ctx.fill();
};
