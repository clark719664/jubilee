/**
 * shapes.ts — geometric and nature sprite painters. Every painter draws centred on the origin within
 * roughly ±size/2 (strokes may overhang a little; the cache pads for it). Painters run once per
 * (name, size, colour) and are cached, so a few gradients and arcs here cost nothing per frame.
 */
import type { SpritePainter } from '../types';
import { shade, withAlpha } from './color';

export const TAU = Math.PI * 2;

export function circlePath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
}

export function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, points: number, outer: number, inner: number, rot = -Math.PI / 2): void {
  ctx.beginPath();
  for (let k = 0; k < points * 2; k++) {
    const r = k % 2 === 0 ? outer : inner;
    const a = rot + (k * Math.PI) / points;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function heartPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number): void {
  const x = cx - w / 2;
  const y = cy - h / 2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h * 0.25);
  ctx.bezierCurveTo(x + w / 2, y, x, y, x, y + h * 0.3);
  ctx.bezierCurveTo(x, y + h * 0.6, x + w / 2, y + h * 0.85, x + w / 2, y + h);
  ctx.bezierCurveTo(x + w / 2, y + h * 0.85, x + w, y + h * 0.6, x + w, y + h * 0.3);
  ctx.bezierCurveTo(x + w, y, x + w / 2, y, x + w / 2, y + h * 0.25);
  ctx.closePath();
}

export function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/** Soft radial disc: the only "glow" in Jubilee (never shadowBlur/filter). Draw it in the 'lighter' pass. */
export const glow: SpritePainter = (ctx, size, color) => {
  const r = size / 2;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, withAlpha(color, 1));
  g.addColorStop(0.25, withAlpha(color, 0.7));
  g.addColorStop(0.6, withAlpha(color, 0.2));
  g.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = g;
  circlePath(ctx, 0, 0, r);
  ctx.fill();
};

/** Crisp disc with a feathered rim: snow, dots, sparks. */
export const circle: SpritePainter = (ctx, size, color) => {
  const r = size / 2;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, withAlpha(color, 1));
  g.addColorStop(0.72, withAlpha(color, 1));
  g.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = g;
  circlePath(ctx, 0, 0, r);
  ctx.fill();
};

export const snowflake: SpritePainter = (ctx, size, color) => {
  const r = size / 2;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, size * 0.07);
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    const c = Math.cos(a);
    const s = Math.sin(a);
    ctx.moveTo(0, 0);
    ctx.lineTo(c * r, s * r);
    for (const f of [0.5, 0.78]) {
      const bx = c * r * f;
      const by = s * r * f;
      const bl = r * (f === 0.5 ? 0.3 : 0.2);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a + Math.PI / 3) * bl, by + Math.sin(a + Math.PI / 3) * bl);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a - Math.PI / 3) * bl, by + Math.sin(a - Math.PI / 3) * bl);
    }
  }
  ctx.stroke();
  ctx.fillStyle = color;
  circlePath(ctx, 0, 0, size * 0.08);
  ctx.fill();
};

export const confettiRect: SpritePainter = (ctx, size, color) => {
  const w = size;
  const h = size * 0.62;
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = withAlpha('#ffffff', 0.28);
  ctx.fillRect(-w / 2, -h / 2, w, h * 0.3);
  ctx.fillStyle = withAlpha('#000000', 0.12);
  ctx.fillRect(-w / 2, h / 2 - h * 0.2, w, h * 0.2);
};

export const confettiStreamer: SpritePainter = (ctx, size, color) => {
  const amp = size * 0.14;
  const ribbon = (dy: number): void => {
    ctx.beginPath();
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      const x = -size / 2 + t * size;
      const y = Math.sin(t * TAU * 1.5) * amp + dy;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  };
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.16);
  ribbon(0);
  ctx.stroke();
  ctx.strokeStyle = withAlpha('#ffffff', 0.35);
  ctx.lineWidth = Math.max(0.75, size * 0.05);
  ribbon(-size * 0.04);
  ctx.stroke();
};

export const heart: SpritePainter = (ctx, size, color) => {
  heartPath(ctx, 0, size * 0.02, size, size * 0.92);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.35);
  ctx.beginPath();
  ctx.ellipse(-size * 0.22, -size * 0.2, size * 0.1, size * 0.06, -0.6, 0, TAU);
  ctx.fill();
};

export const star: SpritePainter = (ctx, size, color) => {
  starPath(ctx, 0, 0, 5, size / 2, size * 0.21);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(0.5, size * 0.06);
  ctx.stroke();
};

/** Eight-pointed star in rub el hizb proportions (two overlapping squares). */
export const star8: SpritePainter = (ctx, size, color) => {
  starPath(ctx, 0, 0, 8, size / 2, size * 0.5 * 0.765);
  ctx.fillStyle = color;
  ctx.fill();
  starPath(ctx, 0, 0, 8, size * 0.33, size * 0.33 * 0.765);
  ctx.strokeStyle = withAlpha('#ffffff', 0.45);
  ctx.lineWidth = Math.max(0.75, size * 0.04);
  ctx.stroke();
};

export const petal: SpritePainter = (ctx, size, color) => {
  const h = size;
  const w = size * 0.6;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.bezierCurveTo(w * 0.55, -h * 0.35, w * 0.55, h * 0.25, 0, h / 2);
  ctx.bezierCurveTo(-w * 0.55, h * 0.25, -w * 0.55, -h * 0.35, 0, -h / 2);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, shade(color, 0.35));
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = withAlpha('#ffffff', 0.3);
  ctx.lineWidth = Math.max(0.5, size * 0.04);
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.4);
  ctx.lineTo(0, h * 0.4);
  ctx.stroke();
};

/** Pompom marigold: three rings of small petals. */
export const marigold: SpritePainter = (ctx, size, color) => {
  const rings: readonly (readonly [number, number, string])[] = [
    [0.42, 14, shade(color, -0.1)], [0.29, 10, color], [0.16, 7, shade(color, 0.2)],
  ];
  for (const [rf, n, c] of rings) {
    ctx.fillStyle = c;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + rf;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * size * rf, Math.sin(a) * size * rf, size * 0.1, size * 0.07, a, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = shade(color, 0.45);
  circlePath(ctx, 0, 0, size * 0.08);
  ctx.fill();
};

export const blossom: SpritePainter = (ctx, size, color) => {
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * TAU) / 5;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * size * 0.27, Math.sin(a) * size * 0.27, size * 0.2, size * 0.15, a, 0, TAU);
    ctx.fill();
    ctx.fillStyle = withAlpha('#ffffff', 0.25);
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * size * 0.3, Math.sin(a) * size * 0.3, size * 0.09, size * 0.05, a, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd166';
  circlePath(ctx, 0, 0, size * 0.1);
  ctx.fill();
  ctx.fillStyle = shade('#ffd166', -0.3);
  for (let k = 0; k < 5; k++) {
    const a = (k * TAU) / 5;
    circlePath(ctx, Math.cos(a) * size * 0.06, Math.sin(a) * size * 0.06, size * 0.02);
    ctx.fill();
  }
};

export const bubble: SpritePainter = (ctx, size, color) => {
  const r = size / 2 - 1;
  circlePath(ctx, 0, 0, r);
  ctx.fillStyle = withAlpha(color, 0.1);
  ctx.fill();
  ctx.strokeStyle = withAlpha(color, 0.7);
  ctx.lineWidth = Math.max(1, size * 0.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0.2, 1.6);
  ctx.strokeStyle = withAlpha(color, 0.35);
  ctx.lineWidth = Math.max(0.75, size * 0.06);
  ctx.stroke();
  ctx.fillStyle = withAlpha('#ffffff', 0.85);
  ctx.beginPath();
  ctx.ellipse(-r * 0.4, -r * 0.42, r * 0.2, r * 0.12, -0.75, 0, TAU);
  ctx.fill();
};

export const cloud: SpritePainter = (ctx, size, color) => {
  const s = size;
  const puffs: readonly (readonly [number, number, number])[] = [[-0.26, 0.08, 0.19], [-0.04, -0.08, 0.26], [0.24, 0.04, 0.2]];
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const [x, y, r] of puffs) {
    ctx.moveTo((x + r) * s, y * s);
    ctx.arc(x * s, y * s, r * s, 0, TAU);
  }
  ctx.rect(-s * 0.3, s * 0.08, s * 0.6, s * 0.19);
  ctx.fill();
  ctx.fillStyle = withAlpha('#000000', 0.06);
  ctx.fillRect(-s * 0.3, s * 0.2, s * 0.6, s * 0.07);
};

export const moon: SpritePainter = (ctx, size, color) => {
  const r = size / 2;
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  g.addColorStop(0, shade(color, 0.3));
  g.addColorStop(1, shade(color, -0.08));
  ctx.fillStyle = g;
  circlePath(ctx, 0, 0, r);
  ctx.fill();
  ctx.fillStyle = withAlpha(shade(color, -0.35), 0.35);
  const craters: readonly (readonly [number, number, number])[] = [[-0.35, -0.1, 0.16], [0.2, -0.38, 0.1], [0.3, 0.25, 0.2], [-0.1, 0.42, 0.09], [0.05, 0.05, 0.07]];
  for (const [cx, cy, cr] of craters) {
    circlePath(ctx, cx * r, cy * r, cr * r);
    ctx.fill();
  }
};

export const crescent: SpritePainter = (ctx, size, color) => {
  const r = size / 2;
  circlePath(ctx, 0, 0, r);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  circlePath(ctx, r * 0.45, -r * 0.15, r * 0.82);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
};

export const flame: SpritePainter = (ctx, size, color) => {
  const h = size;
  const w = size * 0.55;
  const tear = (sx: number, sy: number, dy: number): void => {
    ctx.beginPath();
    ctx.moveTo(0, (-h / 2) * sy + dy);
    ctx.bezierCurveTo(w * 0.5 * sx, -h * 0.1 * sy + dy, w * 0.55 * sx, h * 0.3 * sy + dy, 0, (h / 2) * sy + dy);
    ctx.bezierCurveTo(-w * 0.55 * sx, h * 0.3 * sy + dy, -w * 0.5 * sx, -h * 0.1 * sy + dy, 0, (-h / 2) * sy + dy);
    ctx.closePath();
  };
  tear(1, 1, 0);
  ctx.fillStyle = color;
  ctx.fill();
  tear(0.55, 0.6, h * 0.15);
  ctx.fillStyle = shade(color, 0.55);
  ctx.fill();
  tear(0.28, 0.3, h * 0.25);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
};

export const coin: SpritePainter = (ctx, size, color) => {
  const r = size / 2;
  circlePath(ctx, 0, 0, r);
  ctx.fillStyle = color;
  ctx.fill();
  circlePath(ctx, 0, 0, r * 0.8);
  ctx.strokeStyle = shade(color, -0.3);
  ctx.lineWidth = Math.max(0.75, size * 0.06);
  ctx.stroke();
  starPath(ctx, 0, 0, 5, r * 0.45, r * 0.2);
  ctx.fillStyle = shade(color, -0.3);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.9, Math.PI * 1.1, Math.PI * 1.55);
  ctx.strokeStyle = withAlpha('#ffffff', 0.6);
  ctx.lineWidth = Math.max(0.75, size * 0.07);
  ctx.stroke();
};

export const shamrock: SpritePainter = (ctx, size, color) => {
  const leaf = size * 0.48;
  ctx.fillStyle = color;
  for (let k = 0; k < 3; k++) {
    ctx.save();
    ctx.rotate((k * TAU) / 3);
    heartPath(ctx, 0, -leaf * 0.5, leaf, leaf * 0.95);
    ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = withAlpha('#ffffff', 0.3);
  ctx.lineWidth = Math.max(0.5, size * 0.03);
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI / 2 + (k * TAU) / 3;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * size * 0.36, Math.sin(a) * size * 0.36);
  }
  ctx.stroke();
  ctx.strokeStyle = shade(color, -0.25);
  ctx.lineWidth = Math.max(1, size * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, size * 0.05);
  ctx.quadraticCurveTo(size * 0.1, size * 0.3, size * 0.08, size * 0.5);
  ctx.stroke();
};
