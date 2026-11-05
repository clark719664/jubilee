/**
 * extra-night-lights.ts — painters for the candle-and-moon night presets (menorah, kinara, crescent),
 * split from extra-night.ts (which re-exports everything here). The geometry tables `MENORAH_CUPS` and
 * `KINARA_CUPS` are shared with the presets so candles and flames land exactly on the painted cups.
 */
import type { SpritePainter } from '../types';
import { shade, withAlpha } from './color';
import { TAU, circlePath, roundRectPath } from './shapes';

const GOLD = '#ffd166';

// ------------------------------------------------------------------ menorah (Hanukkah)

/** Cup centres of the nine-branch menorah (unit coords; index 4 is the raised shamash). */
export const MENORAH_CUPS: readonly (readonly [number, number])[] = Array.from({ length: 9 }, (_, i) => {
  const x = (i - 4) * 0.105;
  return [x, i === 4 ? -0.3 : -0.2] as const;
});

/** Golden menorah: eight arms as nested arcs, a central stem rising to the shamash, a stepped base. */
export const menorahBody: SpritePainter = (ctx, size, color) => {
  const s = size;
  const g = ctx.createLinearGradient(-s * 0.45, 0, s * 0.45, 0);
  g.addColorStop(0, shade(color, -0.25));
  g.addColorStop(0.45, shade(color, 0.35));
  g.addColorStop(1, shade(color, -0.3));
  ctx.strokeStyle = g;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, s * 0.022);
  ctx.beginPath();
  for (let j = 1; j <= 4; j++) {
    const r = j * 0.105 * s;
    ctx.moveTo(-r, -0.2 * s);
    ctx.arc(0, -0.2 * s, r, Math.PI, 0, true);
  }
  ctx.stroke();
  ctx.lineWidth = Math.max(2, s * 0.032);
  ctx.beginPath();
  ctx.moveTo(0, -0.3 * s);
  ctx.lineTo(0, 0.3 * s);
  ctx.stroke();
  ctx.fillStyle = g;
  for (const [cx, cy] of MENORAH_CUPS) {
    ctx.beginPath();
    ctx.moveTo((cx - 0.03) * s, (cy - 0.012) * s);
    ctx.lineTo((cx + 0.03) * s, (cy - 0.012) * s);
    ctx.lineTo((cx + 0.016) * s, (cy + 0.022) * s);
    ctx.lineTo((cx - 0.016) * s, (cy + 0.022) * s);
    ctx.closePath();
    ctx.fill();
  }
  // Knops on the stem, then the base.
  for (const y of [-0.1, 0.05, 0.2]) {
    ctx.beginPath();
    ctx.ellipse(0, y * s, 0.026 * s, 0.014 * s, 0, 0, TAU);
    ctx.fill();
  }
  roundRectPath(ctx, -0.1 * s, 0.29 * s, 0.2 * s, 0.04 * s, 0.01 * s);
  ctx.fill();
  roundRectPath(ctx, -0.17 * s, 0.33 * s, 0.34 * s, 0.05 * s, 0.015 * s);
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.35);
  ctx.fillRect(-0.16 * s, 0.335 * s, 0.32 * s, 0.01 * s);
};

/** Slim candle in `color` with a white spiral and a dark wick; spans ±size/2 vertically. */
export const menorahCandle: SpritePainter = (ctx, size, color) => {
  const h = size;
  const w = Math.max(3, size * 0.2);
  roundRectPath(ctx, -w / 2, -h * 0.42, w, h * 0.92, w * 0.3);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = withAlpha('#ffffff', 0.7);
  ctx.lineWidth = Math.max(0.8, w * 0.22);
  ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    const y = -h * 0.36 + k * h * 0.22;
    ctx.moveTo(-w / 2, y + h * 0.08);
    ctx.lineTo(w / 2, y);
  }
  ctx.stroke();
  ctx.fillStyle = withAlpha('#ffffff', 0.35);
  ctx.fillRect(-w * 0.35, -h * 0.4, w * 0.18, h * 0.88);
  ctx.strokeStyle = '#2a1a0a';
  ctx.lineWidth = Math.max(0.8, w * 0.14);
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.42);
  ctx.lineTo(0, -h * 0.5);
  ctx.stroke();
};

/** Dreidel letters in face order (nun, gimel, hei, shin) and what each means in the game. */
export const DREIDEL_LETTERS = ['נ', 'ג', 'ה', 'ש'] as const;

/** Dreidel with one big letter on the front face (`dreidelFace(k)` for k = 0..3). */
export function dreidelFace(k: number): SpritePainter {
  const letter = DREIDEL_LETTERS[k % 4]!;
  return (ctx, size, color) => {
    const s = size;
    const half = s * 0.25;
    ctx.fillStyle = shade(color, -0.35);
    roundRectPath(ctx, -s * 0.05, -s * 0.5, s * 0.1, s * 0.2, s * 0.03);
    ctx.fill();
    const g = ctx.createLinearGradient(-half, 0, half, 0);
    g.addColorStop(0, shade(color, 0.25));
    g.addColorStop(1, shade(color, -0.2));
    ctx.fillStyle = g;
    roundRectPath(ctx, -half, -s * 0.31, half * 2, s * 0.44, s * 0.04);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-half, s * 0.1);
    ctx.lineTo(half, s * 0.1);
    ctx.quadraticCurveTo(s * 0.1, s * 0.3, 0, s * 0.5);
    ctx.quadraticCurveTo(-s * 0.1, s * 0.3, -half, s * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(6, Math.round(s * 0.34))}px "Noto Sans Hebrew", "Arial Hebrew", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 0, -s * 0.09);
    ctx.fillStyle = withAlpha('#ffffff', 0.35);
    ctx.fillRect(-half * 0.8, -s * 0.29, half * 0.3, s * 0.38);
  };
}

// ------------------------------------------------------------------ kinara (Kwanzaa)

/** Holder tops of the seven-branch kinara (unit coords; index 3 is the centre). */
export const KINARA_CUPS: readonly (readonly [number, number])[] = Array.from({ length: 7 }, (_, i) => {
  const d = Math.abs(i - 3) / 3;
  return [(i - 3) * 0.13, -0.02 - 0.06 * (1 - d * d)] as const;
});

/** A rounded-rect sub-path added to the current path (roundRectPath starts a new path, which we must not). */
function roundRectSub(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Cardboard-craft kinara: a curved wooden bar with seven holders, flat colours and a white sticker edge. */
export const kinaraBody: SpritePainter = (ctx, size, color) => {
  const s = size;
  const path = (): void => {
    ctx.beginPath();
    ctx.moveTo(-0.46 * s, 0.0 * s);
    ctx.quadraticCurveTo(0, -0.14 * s, 0.46 * s, 0.0 * s);
    ctx.lineTo(0.44 * s, 0.09 * s);
    ctx.quadraticCurveTo(0, 0.0 * s, -0.44 * s, 0.09 * s);
    ctx.closePath();
    for (const [cx, cy] of KINARA_CUPS) {
      roundRectSub(ctx, (cx - 0.035) * s, cy * s, 0.07 * s, 0.07 * s, 0.012 * s);
    }
    roundRectSub(ctx, -0.32 * s, 0.07 * s, 0.07 * s, 0.13 * s, 0.015 * s);
    roundRectSub(ctx, 0.25 * s, 0.07 * s, 0.07 * s, 0.13 * s, 0.015 * s);
    roundRectSub(ctx, -0.4 * s, 0.19 * s, 0.8 * s, 0.05 * s, 0.02 * s);
  };
  path();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, s * 0.022);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = withAlpha(shade(color, -0.5), 0.5);
  ctx.lineWidth = Math.max(0.6, s * 0.006);
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    ctx.moveTo(-0.4 * s, (0.035 + k * 0.016) * s);
    ctx.quadraticCurveTo(0, (-0.08 + k * 0.016) * s, 0.4 * s, (0.035 + k * 0.016) * s);
  }
  ctx.stroke();
  // A little kente strip painted on the base.
  const kente = ['#d62828', '#ffd166', '#1f7a4f', '#111111'];
  for (let k = 0; k < 16; k++) {
    ctx.fillStyle = kente[k % 4]!;
    ctx.fillRect((-0.38 + k * 0.0475) * s, 0.2 * s, 0.0475 * s, 0.03 * s);
  }
};

/** Kwanzaa candle in `color` with a white sticker outline (so the black candle reads on a dark sky). */
export const kinaraCandle: SpritePainter = (ctx, size, color) => {
  const h = size;
  const w = Math.max(4, size * 0.26);
  roundRectPath(ctx, -w / 2, -h * 0.42, w, h * 0.92, w * 0.25);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.5, w * 0.16);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.28);
  ctx.fillRect(-w * 0.3, -h * 0.38, w * 0.18, h * 0.84);
  ctx.strokeStyle = '#2a1a0a';
  ctx.lineWidth = Math.max(0.8, w * 0.1);
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.42);
  ctx.lineTo(0, -h * 0.5);
  ctx.stroke();
};

/** Ear of corn (muhindi): kernels in `color`, green husk leaves curling from the base. */
export const corn: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.fillStyle = '#5c9e31';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.46);
    ctx.quadraticCurveTo(dir * s * 0.34, s * 0.2, dir * s * 0.2, -s * 0.22);
    ctx.quadraticCurveTo(dir * s * 0.12, s * 0.12, 0, s * 0.3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.04, s * 0.15, s * 0.42, 0, 0, TAU);
  const g = ctx.createLinearGradient(-s * 0.15, 0, s * 0.15, 0);
  g.addColorStop(0, shade(color, 0.25));
  g.addColorStop(1, shade(color, -0.2));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = withAlpha(shade(color, -0.35), 0.55);
  for (let r = 0; r < 9; r++) {
    const y = -s * 0.36 + r * s * 0.08;
    const half = Math.sqrt(Math.max(0, 1 - ((y + s * 0.04) / (s * 0.42)) ** 2)) * s * 0.15;
    for (let c = -1; c <= 1; c++) {
      circlePath(ctx, c * half * 0.55, y, s * 0.018);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#3f7a22';
  ctx.beginPath();
  ctx.moveTo(0, s * 0.5);
  ctx.quadraticCurveTo(s * 0.22, s * 0.36, s * 0.08, -s * 0.02);
  ctx.quadraticCurveTo(s * 0.06, s * 0.3, -s * 0.04, s * 0.42);
  ctx.closePath();
  ctx.fill();
};

/** One square kente tile (fills ±size/2 and a hair more, so tiles butt without seams). */
export const kente: SpritePainter = (ctx, size, color) => {
  const s = size;
  const o = -s / 2 - 0.5;
  const w = s + 1;
  const row = (y: number, h: number, c: string): void => {
    ctx.fillStyle = c;
    ctx.fillRect(o, o + y * w, w, h * w);
  };
  row(0, 1, '#111111');
  row(0.06, 0.2, color);
  row(0.74, 0.2, color);
  const blocks = ['#d62828', '#1f7a4f', '#d62828', '#1f7a4f'];
  for (let k = 0; k < 4; k++) {
    ctx.fillStyle = blocks[k]!;
    ctx.fillRect(o + k * 0.25 * w + 0.03 * w, o + 0.32 * w, 0.19 * w, 0.36 * w);
  }
  ctx.fillStyle = color;
  for (let k = 0; k < 4; k++) {
    const x = o + k * 0.25 * w + 0.125 * w;
    ctx.beginPath();
    ctx.moveTo(x - 0.06 * w, o + 0.5 * w);
    ctx.lineTo(x, o + 0.38 * w);
    ctx.lineTo(x + 0.06 * w, o + 0.5 * w);
    ctx.lineTo(x, o + 0.62 * w);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < 8; k++) ctx.fillRect(o + (k + 0.4) * 0.125 * w, o + 0.13 * w, 0.03 * w, 0.06 * w);
};

// ------------------------------------------------------------------ crescent (Ramadan, Eid)

/**
 * Moon lit on the right by fraction `f` (0 new → 1 full), with a faint earthshine on the dark side.
 * Register one per quantised phase: `crescent:moon<k>` with f = k / 24.
 */
export function phaseMoon(f: number): SpritePainter {
  const lit = Math.min(1, Math.max(0.03, f));
  return (ctx, size, color) => {
    const r = size / 2;
    ctx.fillStyle = withAlpha(color, 0.1);
    circlePath(ctx, 0, 0, r);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    const rx = r * Math.abs(1 - 2 * lit);
    if (lit < 0.5) ctx.ellipse(0, 0, rx, r, 0, Math.PI / 2, -Math.PI / 2, true);
    else ctx.ellipse(0, 0, rx, r, 0, Math.PI / 2, Math.PI * 1.5, false);
    ctx.closePath();
    const g = ctx.createRadialGradient(r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, shade(color, 0.45));
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.fill();
  };
}

/** Domes-and-minarets silhouette in `color`, standing on the bottom edge of the sprite. */
export const skyline: SpritePainter = (ctx, size, color) => {
  const s = size;
  const b = s * 0.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.rect(-0.5 * s, b - 0.12 * s, s, 0.12 * s);
  ctx.rect(-0.2 * s, b - 0.26 * s, 0.4 * s, 0.26 * s);
  ctx.moveTo(-0.17 * s, b - 0.26 * s);
  ctx.bezierCurveTo(-0.2 * s, b - 0.42 * s, -0.04 * s, b - 0.47 * s, 0, b - 0.52 * s);
  ctx.bezierCurveTo(0.04 * s, b - 0.47 * s, 0.2 * s, b - 0.42 * s, 0.17 * s, b - 0.26 * s);
  ctx.closePath();
  ctx.rect(-0.006 * s, b - 0.58 * s, 0.012 * s, 0.07 * s);
  for (const x of [-0.36, 0.36]) {
    ctx.rect((x - 0.025) * s, b - 0.5 * s, 0.05 * s, 0.5 * s);
    ctx.rect((x - 0.04) * s, b - 0.4 * s, 0.08 * s, 0.025 * s);
    ctx.moveTo((x - 0.025) * s, b - 0.5 * s);
    ctx.lineTo(x * s, b - 0.6 * s);
    ctx.lineTo((x + 0.025) * s, b - 0.5 * s);
    ctx.closePath();
  }
  for (const x of [-0.27, 0.27]) {
    ctx.moveTo((x - 0.07) * s, b - 0.12 * s);
    ctx.quadraticCurveTo(x * s, b - 0.27 * s, (x + 0.07) * s, b - 0.12 * s);
    ctx.closePath();
  }
  ctx.fill();
  ctx.fillStyle = withAlpha(GOLD, 0.55);
  for (const x of [-0.1, 0, 0.1]) {
    ctx.beginPath();
    ctx.moveTo((x - 0.025) * s, b - 0.04 * s);
    ctx.lineTo((x - 0.025) * s, b - 0.14 * s);
    ctx.quadraticCurveTo(x * s, b - 0.19 * s, (x + 0.025) * s, b - 0.14 * s);
    ctx.lineTo((x + 0.025) * s, b - 0.04 * s);
    ctx.closePath();
    ctx.fill();
  }
};
