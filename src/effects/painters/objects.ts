/**
 * objects.ts — festive object painters: leaves, lanterns, eggs, balloon, dreidel, red envelope,
 * paper plane and pie. Each draws centred on the origin within about ±size/2.
 */
import type { SpritePainter } from '../types';
import { shade, withAlpha } from './color';
import { TAU, circlePath, roundRectPath } from './shapes';

const GOLD = '#ffd166';

/** Polar outline: `radius(theta)` with theta = 0 pointing up, sampled every 2°. */
function polarPath(ctx: CanvasRenderingContext2D, radius: (theta: number) => number, xScale = 1): void {
  const N = 180;
  ctx.beginPath();
  for (let k = 0; k <= N; k++) {
    const th = -Math.PI + (k / N) * TAU;
    const r = radius(th);
    const x = Math.sin(th) * r * xScale;
    const y = -Math.cos(th) * r;
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function veins(ctx: CanvasRenderingContext2D, size: number, color: string, angles: readonly number[], reach: number): void {
  ctx.strokeStyle = withAlpha(shade(color, -0.45), 0.7);
  ctx.lineWidth = Math.max(0.6, size * 0.03);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const a of angles) {
    ctx.moveTo(0, size * 0.1);
    ctx.lineTo(Math.sin(a) * reach, size * 0.1 - Math.cos(a) * reach);
  }
  ctx.moveTo(0, size * 0.1);
  ctx.lineTo(0, size * 0.55);
  ctx.stroke();
}

export const leafMaple: SpritePainter = (ctx, size, color) => {
  const R = size * 0.5;
  polarPath(ctx, (th) => {
    const lobe = Math.pow(Math.abs(Math.cos(2.5 * th)), 0.55);
    const notch = Math.pow(Math.max(0, -Math.cos(th)), 6);
    return R * (0.42 + 0.58 * lobe) * (1 - 0.45 * notch);
  });
  ctx.fillStyle = color;
  ctx.fill();
  veins(ctx, size, color, [-1.45, -0.72, 0, 0.72, 1.45], R * 0.8);
};

export const leafOak: SpritePainter = (ctx, size, color) => {
  const R = size * 0.5;
  polarPath(ctx, (th) => {
    const lobe = 0.5 + 0.5 * Math.cos(9 * th);
    const taper = 0.75 + 0.25 * Math.cos(th);
    return R * (0.68 + 0.22 * lobe) * taper;
  }, 0.62);
  ctx.fillStyle = color;
  ctx.fill();
  veins(ctx, size, color, [-0.9, -0.5, 0.5, 0.9], R * 0.55);
};

export const leafGinkgo: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.32);
  ctx.lineTo(-s * 0.46, -s * 0.05);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.45, -s * 0.04, -s * 0.3);
  ctx.lineTo(0, -s * 0.18);
  ctx.lineTo(s * 0.04, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.3, -s * 0.45, s * 0.46, -s * 0.05);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = withAlpha('#ffffff', 0.35);
  ctx.lineWidth = Math.max(0.5, s * 0.02);
  ctx.beginPath();
  for (let k = -4; k <= 4; k++) {
    if (k === 0) continue;
    const a = k * 0.17;
    ctx.moveTo(0, s * 0.3);
    ctx.lineTo(Math.sin(a) * s * 0.42, s * 0.3 - Math.cos(a) * s * 0.6);
  }
  ctx.stroke();
  ctx.strokeStyle = shade(color, -0.3);
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.lineTo(s * 0.02, s * 0.5);
  ctx.stroke();
};

/** Chinese hanging lantern: barrel body in `color`, gold caps, short hanger and tassel. */
export const lantern: SpritePainter = (ctx, size, color) => {
  const s = size;
  const g = ctx.createLinearGradient(-s * 0.4, 0, s * 0.4, 0);
  g.addColorStop(0, shade(color, -0.25));
  g.addColorStop(0.35, shade(color, 0.15));
  g.addColorStop(1, shade(color, -0.3));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-s * 0.26, -s * 0.3);
  ctx.quadraticCurveTo(-s * 0.5, 0, -s * 0.26, s * 0.3);
  ctx.lineTo(s * 0.26, s * 0.3);
  ctx.quadraticCurveTo(s * 0.5, 0, s * 0.26, -s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = withAlpha(shade(color, -0.4), 0.5);
  ctx.lineWidth = Math.max(0.6, s * 0.02);
  ctx.beginPath();
  for (const f of [-0.6, -0.2, 0.2, 0.6]) {
    ctx.moveTo(f * s * 0.28, -s * 0.3);
    ctx.quadraticCurveTo(f * s * 0.46, 0, f * s * 0.28, s * 0.3);
  }
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.fillRect(-s * 0.2, -s * 0.38, s * 0.4, s * 0.09);
  ctx.fillRect(-s * 0.2, s * 0.29, s * 0.4, s * 0.09);
  ctx.fillRect(-s * 0.03, s * 0.38, s * 0.06, s * 0.12);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.lineTo(0, -s * 0.38);
  ctx.stroke();
};

/** Ramadan fanous: glass body lit in `color`, brass dome, finial, base and ring. */
export const fanous: SpritePainter = (ctx, size, color) => {
  const s = size;
  const metal = GOLD;
  const dark = shade(metal, -0.45);
  const frame = (): void => {
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, -s * 0.18);
    ctx.lineTo(s * 0.22, -s * 0.18);
    ctx.lineTo(s * 0.28, s * 0.22);
    ctx.lineTo(-s * 0.28, s * 0.22);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, -s * 0.2, 0, s * 0.3);
  g.addColorStop(0, shade(color, 0.3));
  g.addColorStop(1, color);
  frame();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.35);
  ctx.beginPath();
  ctx.ellipse(0, s * 0.02, s * 0.1, s * 0.14, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(0.75, s * 0.03);
  ctx.beginPath();
  ctx.moveTo(-s * 0.09, -s * 0.18);
  ctx.lineTo(-s * 0.11, s * 0.22);
  ctx.moveTo(s * 0.09, -s * 0.18);
  ctx.lineTo(s * 0.11, s * 0.22);
  ctx.stroke();
  frame();
  ctx.strokeStyle = metal;
  ctx.lineWidth = Math.max(1, s * 0.04);
  ctx.stroke();
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.moveTo(-s * 0.24, -s * 0.18);
  ctx.quadraticCurveTo(0, -s * 0.38, s * 0.24, -s * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-s * 0.03, -s * 0.42, s * 0.06, s * 0.08);
  ctx.fillRect(-s * 0.3, s * 0.22, s * 0.6, s * 0.06);
  ctx.beginPath();
  ctx.moveTo(-s * 0.08, s * 0.28);
  ctx.lineTo(s * 0.08, s * 0.28);
  ctx.lineTo(0, s * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = metal;
  ctx.lineWidth = Math.max(1, s * 0.035);
  circlePath(ctx, 0, -s * 0.46, s * 0.04);
  ctx.stroke();
};

function eggPath(ctx: CanvasRenderingContext2D, s: number): void {
  const w = s * 0.78;
  const h = s;
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.bezierCurveTo(w * 0.55, -h / 2, w / 2, h * 0.05, w / 2, h * 0.15);
  ctx.bezierCurveTo(w / 2, h * 0.45, w * 0.25, h / 2, 0, h / 2);
  ctx.bezierCurveTo(-w * 0.25, h / 2, -w / 2, h * 0.45, -w / 2, h * 0.15);
  ctx.bezierCurveTo(-w / 2, h * 0.05, -w * 0.55, -h / 2, 0, -h / 2);
  ctx.closePath();
}

/** Decorated egg: 0 bands, 1 dots, 2 zigzag, 3 diagonal stripes. */
function egg(pattern: 0 | 1 | 2 | 3): SpritePainter {
  return (ctx, size, color) => {
    const s = size;
    const w = s * 0.78;
    const h = s;
    eggPath(ctx, s);
    const g = ctx.createRadialGradient(-w * 0.2, -h * 0.15, s * 0.05, 0, 0, s * 0.6);
    g.addColorStop(0, shade(color, 0.25));
    g.addColorStop(1, shade(color, -0.1));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    eggPath(ctx, s);
    ctx.clip();
    const light = withAlpha('#ffffff', 0.8);
    const dark = withAlpha(shade(color, -0.45), 0.7);
    if (pattern === 0) {
      ctx.fillStyle = light;
      ctx.fillRect(-w, -h * 0.14, 2 * w, h * 0.08);
      ctx.fillRect(-w, h * 0.14, 2 * w, h * 0.08);
      ctx.fillStyle = dark;
      ctx.fillRect(-w, -h * 0.02, 2 * w, h * 0.04);
    } else if (pattern === 1) {
      ctx.fillStyle = light;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          circlePath(ctx, c * w * 0.24 + (r % 2) * w * 0.12, r * h * 0.18, s * 0.045);
          ctx.fill();
        }
      }
    } else if (pattern === 2) {
      ctx.strokeStyle = light;
      ctx.lineWidth = Math.max(1, s * 0.05);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) {
        const x = -w * 0.6 + k * w * 0.15;
        const y = (k % 2 === 0 ? -1 : 1) * h * 0.06;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = dark;
      ctx.fillRect(-w, -h * 0.26, 2 * w, h * 0.035);
      ctx.fillRect(-w, h * 0.2, 2 * w, h * 0.035);
    } else {
      ctx.strokeStyle = light;
      ctx.lineWidth = Math.max(1, s * 0.06);
      ctx.beginPath();
      for (let k = -4; k <= 4; k++) {
        ctx.moveTo(-w + k * w * 0.28, h);
        ctx.lineTo(w + k * w * 0.28, -h);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = withAlpha('#ffffff', 0.45);
    ctx.beginPath();
    ctx.ellipse(-w * 0.2, -h * 0.22, s * 0.07, s * 0.12, 0.4, 0, TAU);
    ctx.fill();
  };
}

export const eggPattern0 = egg(0);
export const eggPattern1 = egg(1);
export const eggPattern2 = egg(2);
export const eggPattern3 = egg(3);

/** Balloon without its string (draw the string from the effect so it can wiggle). */
export const balloon: SpritePainter = (ctx, size, color) => {
  const s = size;
  const rx = s * 0.36;
  const ry = s * 0.43;
  const cy = -s * 0.05;
  const g = ctx.createRadialGradient(-rx * 0.35, cy - ry * 0.35, s * 0.03, 0, cy, ry * 1.1);
  g.addColorStop(0, shade(color, 0.45));
  g.addColorStop(0.5, color);
  g.addColorStop(1, shade(color, -0.25));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, cy - ry);
  ctx.bezierCurveTo(rx * 1.35, cy - ry, rx * 1.1, cy + ry * 0.75, 0, cy + ry);
  ctx.bezierCurveTo(-rx * 1.1, cy + ry * 0.75, -rx * 1.35, cy - ry, 0, cy - ry);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(color, -0.2);
  ctx.beginPath();
  ctx.moveTo(0, cy + ry - s * 0.01);
  ctx.lineTo(-s * 0.05, cy + ry + s * 0.07);
  ctx.lineTo(s * 0.05, cy + ry + s * 0.07);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.5);
  ctx.beginPath();
  ctx.ellipse(-rx * 0.4, cy - ry * 0.45, s * 0.06, s * 0.11, 0.5, 0, TAU);
  ctx.fill();
};

export const dreidel: SpritePainter = (ctx, size, color) => {
  const s = size;
  const half = s * 0.24;
  ctx.fillStyle = shade(color, -0.3);
  ctx.fillRect(-s * 0.06, -s * 0.5, s * 0.12, s * 0.2);
  ctx.fillStyle = color;
  ctx.fillRect(-half, -s * 0.3, half * 2, s * 0.42);
  ctx.fillStyle = withAlpha('#000000', 0.18);
  ctx.fillRect(0, -s * 0.3, half, s * 0.42);
  ctx.fillStyle = shade(color, -0.1);
  ctx.beginPath();
  ctx.moveTo(-half, s * 0.12);
  ctx.lineTo(half, s * 0.12);
  ctx.lineTo(0, s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = withAlpha('#000000', 0.18);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.12);
  ctx.lineTo(half, s * 0.12);
  ctx.lineTo(0, s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.3);
  ctx.fillRect(-half, -s * 0.3, half * 2, s * 0.04);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.max(6, Math.round(s * 0.24))}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('נ', -half * 0.5, -s * 0.08);
  ctx.fillText('ג', half * 0.5, -s * 0.08);
};

/** Red envelope (hongbao) with a gold seal. */
export const envelope: SpritePainter = (ctx, size, color) => {
  const s = size;
  const w = s * 0.62;
  const h = s * 0.92;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, s * 0.05);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = shade(color, -0.18);
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2 + s * 0.05);
  ctx.lineTo(w / 2, -h / 2 + s * 0.05);
  ctx.lineTo(w / 2, -h * 0.3);
  ctx.quadraticCurveTo(0, -h * 0.12, -w / 2, -h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = GOLD;
  circlePath(ctx, 0, -h * 0.12, s * 0.11);
  ctx.fill();
  ctx.fillStyle = shade(GOLD, -0.35);
  circlePath(ctx, 0, -h * 0.12, s * 0.05);
  ctx.fill();
  ctx.strokeStyle = withAlpha(GOLD, 0.8);
  ctx.lineWidth = Math.max(0.75, s * 0.025);
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, h * 0.2);
  ctx.lineTo(w * 0.3, h * 0.2);
  ctx.moveTo(-w * 0.3, h * 0.3);
  ctx.lineTo(w * 0.3, h * 0.3);
  ctx.stroke();
};

/** Paper plane pointing right. */
export const plane: SpritePainter = (ctx, size, color) => {
  const s = size;
  const tri = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, fill: string): void => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x1 * s, y1 * s);
    ctx.lineTo(x2 * s, y2 * s);
    ctx.lineTo(x3 * s, y3 * s);
    ctx.closePath();
    ctx.fill();
  };
  tri(0.5, 0, -0.5, -0.3, -0.22, 0, shade(color, 0.2));
  tri(0.5, 0, -0.22, 0, -0.5, 0.3, shade(color, -0.2));
  tri(0.5, 0, -0.22, 0, -0.3, 0.12, shade(color, -0.35));
  ctx.strokeStyle = withAlpha('#ffffff', 0.5);
  ctx.lineWidth = Math.max(0.5, s * 0.02);
  ctx.beginPath();
  ctx.moveTo(s * 0.5, 0);
  ctx.lineTo(-s * 0.22, 0);
  ctx.stroke();
};

/** Lattice-top pie seen from above; `color` is the filling. */
export const pie: SpritePainter = (ctx, size, color) => {
  const r = size / 2 - 1;
  const crust = '#e0a458';
  circlePath(ctx, 0, 0, r);
  ctx.fillStyle = crust;
  ctx.fill();
  circlePath(ctx, 0, 0, r * 0.78);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.save();
  circlePath(ctx, 0, 0, r * 0.78);
  ctx.clip();
  ctx.strokeStyle = crust;
  ctx.lineWidth = Math.max(1.5, size * 0.09);
  ctx.beginPath();
  for (const f of [-0.6, 0, 0.6]) {
    ctx.moveTo(f * r, -r);
    ctx.lineTo(f * r, r);
    ctx.moveTo(-r, f * r);
    ctx.lineTo(r, f * r);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = shade(crust, -0.3);
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.beginPath();
  for (let k = 0; k < 16; k++) {
    const a = (k * TAU) / 16;
    ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
    ctx.lineTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98);
  }
  ctx.stroke();
  ctx.fillStyle = withAlpha('#ffffff', 0.25);
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.25, r * 0.12, -0.7, 0, TAU);
  ctx.fill();
};

/**
 * Papel picado pennant: a paper rectangle (0.8·size wide, size tall) hanging from its top edge, with a
 * scalloped hem and punched-out flower, diamonds and dots (the sky shows through the holes).
 */
export const papelPicado: SpritePainter = (ctx, size, color) => {
  const w = size * 0.8;
  const h = size;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const hem = y0 + h * 0.82;
  const scallops = 4;
  const r = w / (2 * scallops);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0 + w, y0);
  ctx.lineTo(x0 + w, hem);
  for (let k = scallops - 1; k >= 0; k--) ctx.arc(x0 + (k + 0.5) * 2 * r, hem, r, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.18);
  ctx.fillRect(x0, y0, w, h * 0.08);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000000';
  const cy = y0 + h * 0.42;
  circlePath(ctx, 0, cy, w * 0.09);
  ctx.fill();
  for (let k = 0; k < 6; k++) {
    const a = (k * TAU) / 6;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * w * 0.22, cy + Math.sin(a) * w * 0.22, w * 0.085, w * 0.05, a, 0, TAU);
    ctx.fill();
  }
  for (const dx of [-0.33, 0.33]) {
    ctx.beginPath();
    ctx.moveTo(dx * w, y0 + h * 0.12);
    ctx.lineTo(dx * w + w * 0.06, y0 + h * 0.18);
    ctx.lineTo(dx * w, y0 + h * 0.24);
    ctx.lineTo(dx * w - w * 0.06, y0 + h * 0.18);
    ctx.closePath();
    ctx.fill();
  }
  for (let k = -2; k <= 2; k++) {
    circlePath(ctx, k * w * 0.17, y0 + h * 0.68, w * 0.035);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
};
