/**
 * creatures.ts — animal sprite painters (bats, goldfish, frog, turkey, groundhog, koinobori carp).
 * All face right where it matters; flip with scaleX = -1 in SpriteCache.draw to face left.
 */
import type { SpritePainter } from '../types';
import { shade, withAlpha } from './color';
import { TAU, circlePath } from './shapes';

const INK = '#1f1a3d';

/** Bat with wings up (A) or down (B): a two-frame flap. */
function bat(up: boolean): SpritePainter {
  return (ctx, size, color) => {
    const s = size;
    // Trailing-edge points of one wing: tip, two finger tips, body join (unit coordinates).
    const pts: readonly (readonly [number, number])[] = up
      ? [[0.5, -0.28], [0.34, -0.06], [0.16, 0.1], [0, 0.18]]
      : [[0.5, 0.14], [0.36, 0.26], [0.18, 0.3], [0, 0.2]];
    const lead: readonly [number, number] = up ? [0.22, -0.4] : [0.25, -0.08];
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const dir of [1, -1]) {
      ctx.moveTo(0, -s * 0.12);
      ctx.quadraticCurveTo(dir * lead[0] * s, lead[1] * s, dir * pts[0]![0] * s, pts[0]![1] * s);
      for (let k = 1; k < pts.length; k++) {
        const [px, py] = pts[k - 1]!;
        const [qx, qy] = pts[k]!;
        // Control point pulled toward the wing interior so the membrane sags between the fingers.
        ctx.quadraticCurveTo(dir * ((px + qx) / 2 - 0.03) * s, ((py + qy) / 2 - 0.09) * s, dir * qx * s, qy * s);
      }
      ctx.closePath();
    }
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, s * 0.02, s * 0.1, s * 0.17, 0, 0, TAU);
    ctx.fill();
    circlePath(ctx, 0, -s * 0.14, s * 0.09);
    ctx.fill();
    for (const dir of [1, -1]) {
      ctx.beginPath();
      ctx.moveTo(dir * s * 0.09, -s * 0.17);
      ctx.lineTo(dir * s * 0.07, -s * 0.3);
      ctx.lineTo(dir * s * 0.01, -s * 0.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#ffd166';
    circlePath(ctx, -s * 0.035, -s * 0.15, s * 0.02);
    ctx.fill();
    circlePath(ctx, s * 0.035, -s * 0.15, s * 0.02);
    ctx.fill();
  };
}

export const batA = bat(true);
export const batB = bat(false);

export const goldfish: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.fillStyle = shade(color, 0.15);
  ctx.beginPath();
  ctx.moveTo(-s * 0.22, 0);
  ctx.quadraticCurveTo(-s * 0.42, -s * 0.3, -s * 0.5, -s * 0.22);
  ctx.quadraticCurveTo(-s * 0.38, -s * 0.02, -s * 0.5, s * 0.22);
  ctx.quadraticCurveTo(-s * 0.42, s * 0.3, -s * 0.22, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, -s * 0.16);
  ctx.quadraticCurveTo(0, -s * 0.36, s * 0.1, -s * 0.17);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(-s * 0.02, 0, s * 0.3, s * 0.19, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.25);
  ctx.beginPath();
  ctx.ellipse(0, s * 0.06, s * 0.2, s * 0.08, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  circlePath(ctx, s * 0.17, -s * 0.05, s * 0.06);
  ctx.fill();
  ctx.fillStyle = INK;
  circlePath(ctx, s * 0.185, -s * 0.05, s * 0.03);
  ctx.fill();
};

export const frog: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.fillStyle = shade(color, -0.12);
  for (const dir of [1, -1]) {
    ctx.beginPath();
    ctx.ellipse(dir * s * 0.38, s * 0.3, s * 0.12, s * 0.08, -dir * 0.4, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.12, s * 0.42, s * 0.28, 0, 0, TAU);
  ctx.fill();
  circlePath(ctx, -s * 0.22, -s * 0.17, s * 0.15);
  ctx.fill();
  circlePath(ctx, s * 0.22, -s * 0.17, s * 0.15);
  ctx.fill();
  ctx.fillStyle = shade(color, 0.4);
  ctx.beginPath();
  ctx.ellipse(0, s * 0.2, s * 0.26, s * 0.14, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  circlePath(ctx, -s * 0.22, -s * 0.18, s * 0.1);
  ctx.fill();
  circlePath(ctx, s * 0.22, -s * 0.18, s * 0.1);
  ctx.fill();
  ctx.fillStyle = INK;
  circlePath(ctx, -s * 0.2, -s * 0.17, s * 0.05);
  ctx.fill();
  circlePath(ctx, s * 0.24, -s * 0.17, s * 0.05);
  ctx.fill();
  ctx.strokeStyle = shade(color, -0.45);
  ctx.lineWidth = Math.max(1, s * 0.04);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, -s * 0.02, s * 0.2, 0.25, Math.PI - 0.25);
  ctx.stroke();
  ctx.fillStyle = withAlpha('#ff8fb8', 0.6);
  circlePath(ctx, -s * 0.26, s * 0.05, s * 0.05);
  ctx.fill();
  circlePath(ctx, s * 0.26, s * 0.05, s * 0.05);
  ctx.fill();
};

export const turkey: SpritePainter = (ctx, size, color) => {
  const s = size;
  const feathers = ['#c8102e', '#f28c28', '#ffd166', '#f28c28', '#c8102e'];
  for (let k = 0; k < 5; k++) {
    const a = Math.PI + (k + 0.5) * (Math.PI / 5);
    ctx.fillStyle = feathers[k]!;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * s * 0.22, s * 0.08 + Math.sin(a) * s * 0.22, s * 0.24, s * 0.1, a, 0, TAU);
    ctx.fill();
    ctx.fillStyle = withAlpha('#000000', 0.15);
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * s * 0.36, s * 0.08 + Math.sin(a) * s * 0.36, s * 0.1, s * 0.07, a, 0, TAU);
    ctx.fill();
  }
  const g = ctx.createRadialGradient(-s * 0.06, s * 0.06, s * 0.05, 0, s * 0.14, s * 0.3);
  g.addColorStop(0, shade(color, 0.25));
  g.addColorStop(1, shade(color, -0.15));
  ctx.fillStyle = g;
  circlePath(ctx, 0, s * 0.14, s * 0.28);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(s * 0.08, 0, s * 0.1, s * 0.14, 0.4, 0, TAU);
  ctx.fill();
  circlePath(ctx, s * 0.14, -s * 0.1, s * 0.13);
  ctx.fill();
  ctx.fillStyle = '#c8102e';
  ctx.beginPath();
  ctx.ellipse(s * 0.22, 0, s * 0.04, s * 0.08, 0.3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f28c28';
  ctx.beginPath();
  ctx.moveTo(s * 0.25, -s * 0.12);
  ctx.lineTo(s * 0.37, -s * 0.07);
  ctx.lineTo(s * 0.25, -s * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  circlePath(ctx, s * 0.17, -s * 0.13, s * 0.04);
  ctx.fill();
  ctx.fillStyle = INK;
  circlePath(ctx, s * 0.18, -s * 0.13, s * 0.02);
  ctx.fill();
  ctx.strokeStyle = '#f28c28';
  ctx.lineWidth = Math.max(1, s * 0.04);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.08, s * 0.4);
  ctx.lineTo(-s * 0.1, s * 0.5);
  ctx.moveTo(s * 0.06, s * 0.4);
  ctx.lineTo(s * 0.08, s * 0.5);
  ctx.stroke();
};

/** Groundhog peeking up: its flat bottom sits at +size/2, so place it on the ground line. */
export const groundhog: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-s * 0.36, s * 0.5);
  ctx.lineTo(-s * 0.36, s * 0.05);
  ctx.quadraticCurveTo(-s * 0.36, -s * 0.4, 0, -s * 0.4);
  ctx.quadraticCurveTo(s * 0.36, -s * 0.4, s * 0.36, s * 0.05);
  ctx.lineTo(s * 0.36, s * 0.5);
  ctx.closePath();
  ctx.fill();
  for (const dir of [1, -1]) {
    ctx.fillStyle = color;
    circlePath(ctx, dir * s * 0.26, -s * 0.3, s * 0.08);
    ctx.fill();
    ctx.fillStyle = shade(color, 0.35);
    circlePath(ctx, dir * s * 0.26, -s * 0.3, s * 0.04);
    ctx.fill();
  }
  ctx.fillStyle = shade(color, 0.4);
  ctx.beginPath();
  ctx.ellipse(0, s * 0.02, s * 0.17, s * 0.12, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, s * 0.36, s * 0.2, s * 0.16, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = INK;
  circlePath(ctx, -s * 0.12, -s * 0.12, s * 0.035);
  ctx.fill();
  circlePath(ctx, s * 0.12, -s * 0.12, s * 0.035);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.03, s * 0.04, s * 0.03, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  circlePath(ctx, -s * 0.11, -s * 0.13, s * 0.012);
  ctx.fill();
  circlePath(ctx, s * 0.13, -s * 0.13, s * 0.012);
  ctx.fill();
  ctx.fillRect(-s * 0.035, s * 0.04, s * 0.03, s * 0.05);
  ctx.fillRect(s * 0.005, s * 0.04, s * 0.03, s * 0.05);
  ctx.fillStyle = shade(color, -0.1);
  for (const dir of [1, -1]) {
    ctx.beginPath();
    ctx.ellipse(dir * s * 0.2, s * 0.44, s * 0.1, s * 0.06, 0, 0, TAU);
    ctx.fill();
  }
};

/** Carp streamer, mouth ring at the left, forked tail at the right. */
export const koinobori: SpritePainter = (ctx, size, color) => {
  const s = size;
  const body = (): void => {
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.17);
    ctx.quadraticCurveTo(s * 0.1, -s * 0.2, s * 0.5, -s * 0.14);
    ctx.lineTo(s * 0.36, 0);
    ctx.lineTo(s * 0.5, s * 0.14);
    ctx.quadraticCurveTo(s * 0.1, s * 0.2, -s * 0.5, s * 0.17);
    ctx.closePath();
  };
  body();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  ctx.strokeStyle = withAlpha(shade(color, -0.3), 0.6);
  ctx.lineWidth = Math.max(0.75, s * 0.025);
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 6; k++) {
      const cx = -s * 0.2 + k * s * 0.11 + (row % 2) * s * 0.055;
      const cy = -s * 0.12 + row * s * 0.12;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.06, 0, Math.PI);
      ctx.stroke();
    }
  }
  ctx.fillStyle = withAlpha('#ffffff', 0.35);
  ctx.fillRect(s * 0.3, -s * 0.2, s * 0.05, s * 0.4);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.beginPath();
  ctx.ellipse(-s * 0.48, 0, s * 0.03, s * 0.165, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  circlePath(ctx, -s * 0.34, -s * 0.03, s * 0.07);
  ctx.fill();
  ctx.fillStyle = INK;
  circlePath(ctx, -s * 0.33, -s * 0.03, s * 0.035);
  ctx.fill();
};
