/**
 * painters.ts — the catch game's own sprite painters (presents, sweets, mooncakes, the sleepy cloud…)
 * plus `stickerize`, which gives any painter Jubilee's die-cut look: a soft drop shadow, a thin ink rim
 * and a white paper border. Everything here runs once per (name, size, color) inside the shared sprite
 * cache, so the gradients and the 12-tap outline cost nothing per frame.
 *
 * Painters draw centered on the origin within about ±size/2, like every effects painter.
 */
import { PAINTERS, shade, withAlpha } from '../../effects/painters';
import { circlePath, heartPath, roundRectPath, starPath } from '../../effects/painters/shapes';
import { corn, pumpkin } from '../../effects/painters/extra-night';
import { clover4, daisy, poppy, tulip } from '../../effects/painters/extra-day';
import type { SpriteCache, SpritePainter } from '../../effects/types';

const TAU = Math.PI * 2;
const INK = '#1f1a3d';

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx2D = CanvasRenderingContext2D;

function blank(px: number): { c: AnyCanvas; g: Ctx2D } | null {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = px;
    c.height = px;
    const g = c.getContext('2d');
    return g ? { c, g } : null;
  }
  if (typeof OffscreenCanvas !== 'undefined') {
    const c = new OffscreenCanvas(px, px);
    const g = c.getContext('2d') as unknown as Ctx2D | null;
    return g ? { c, g } : null;
  }
  return null;
}

/** A silhouette of `src` filled with one color. */
function silhouette(src: AnyCanvas, px: number, color: string): AnyCanvas | null {
  const s = blank(px);
  if (!s) return null;
  s.g.drawImage(src, 0, 0);
  s.g.globalCompositeOperation = 'source-in';
  s.g.fillStyle = color;
  s.g.fillRect(0, 0, px, px);
  return s.c;
}

/**
 * Die-cut sticker treatment for any painter: drop shadow, ink rim, white border, then the art.
 * `ring` is the white border width as a fraction of the size.
 */
export function stickerize(paint: SpritePainter, ring = 0.06): SpritePainter {
  return (ctx, size, color) => {
    const px = (ctx.canvas as AnyCanvas).width;
    const t = ctx.getTransform();
    const art = blank(px);
    if (!art) { paint(ctx, size, color); return; }
    art.g.setTransform(t);
    paint(art.g, size, color);
    const white = silhouette(art.c, px, '#ffffff');
    const ink = silhouette(art.c, px, INK);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const k = t.a;
    const r = Math.max(1.5, size * ring) * k;
    const rim = r + Math.max(1, size * 0.022) * k;
    if (ink) {
      ctx.globalAlpha = 0.22;
      for (let a = 0; a < 12; a++) ctx.drawImage(ink, Math.cos(a / 12 * TAU) * r, Math.sin(a / 12 * TAU) * r + size * 0.07 * k);
      ctx.globalAlpha = 0.85;
      for (let a = 0; a < 16; a++) ctx.drawImage(ink, Math.cos(a / 16 * TAU) * rim, Math.sin(a / 16 * TAU) * rim);
    }
    ctx.globalAlpha = 1;
    if (white) for (let a = 0; a < 16; a++) ctx.drawImage(white, Math.cos(a / 16 * TAU) * r, Math.sin(a / 16 * TAU) * r);
    ctx.drawImage(art.c, 0, 0);
    ctx.restore();
  };
}

function gloss(ctx: Ctx2D, x: number, y: number, rx: number, ry: number, rot = -0.5, a = 0.45): void {
  ctx.fillStyle = withAlpha('#ffffff', a);
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.fill();
}

function ball(ctx: Ctx2D, r: number, color: string): void {
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, shade(color, 0.35));
  g.addColorStop(0.7, color);
  g.addColorStop(1, shade(color, -0.25));
  ctx.fillStyle = g;
  circlePath(ctx, 0, 0, r);
  ctx.fill();
}

// ------------------------------------------------------------------ gifts and treats

/** Gift box with a ribbon cross and a two-loop bow (ribbon is gold, or white on gold boxes). */
export const present: SpritePainter = (ctx, size, color) => {
  const s = size;
  const w = s * 0.78;
  const hgt = s * 0.62;
  const top = -s * 0.2;
  const ribbon = /ffd166|ffb703|f4c430/i.test(color) ? '#ff4d5e' : '#ffd166';
  roundRectPath(ctx, -w / 2, top, w, hgt, s * 0.06);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = shade(color, -0.18);
  ctx.fillRect(-w / 2, top + hgt * 0.62, w, hgt * 0.38 - s * 0.04);
  // lid
  roundRectPath(ctx, -w / 2 - s * 0.04, top - s * 0.06, w + s * 0.08, s * 0.16, s * 0.04);
  ctx.fillStyle = shade(color, 0.12);
  ctx.fill();
  ctx.fillStyle = ribbon;
  ctx.fillRect(-s * 0.07, top - s * 0.06, s * 0.14, hgt + s * 0.06);
  ctx.fillRect(-w / 2, top + hgt * 0.38, w, s * 0.1);
  // bow
  ctx.fillStyle = ribbon;
  ctx.strokeStyle = shade(ribbon, -0.3);
  ctx.lineWidth = Math.max(1, s * 0.025);
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(dir * s * 0.13, top - s * 0.14, s * 0.13, s * 0.08, dir * -0.5, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  circlePath(ctx, 0, top - s * 0.1, s * 0.06);
  ctx.fill();
  gloss(ctx, -w * 0.3, top + hgt * 0.15, s * 0.05, s * 0.09, 0.2, 0.35);
};

/** Wrapped sweet: a glossy oval with twisted paper ends and a stripe. */
export const candy: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.fillStyle = shade(color, 0.15);
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(dir * s * 0.2, 0);
    ctx.lineTo(dir * s * 0.47, -s * 0.17);
    ctx.quadraticCurveTo(dir * s * 0.4, 0, dir * s * 0.47, s * 0.17);
    ctx.closePath();
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, -s * 0.2, 0, s * 0.2);
  g.addColorStop(0, shade(color, 0.3));
  g.addColorStop(1, shade(color, -0.2));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.27, s * 0.2, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#ffffff', 0.8);
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(-s * 0.08, -s * 0.18);
  ctx.quadraticCurveTo(s * 0.02, 0, -s * 0.06, s * 0.18);
  ctx.moveTo(s * 0.1, -s * 0.18);
  ctx.quadraticCurveTo(s * 0.18, 0, s * 0.1, s * 0.18);
  ctx.stroke();
  gloss(ctx, -s * 0.12, -s * 0.08, s * 0.06, s * 0.03, -0.3, 0.6);
};

export const candyCane: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.lineCap = 'round';
  const path = (): void => {
    ctx.beginPath();
    ctx.moveTo(s * 0.05, s * 0.42);
    ctx.lineTo(s * 0.05, -s * 0.12);
    ctx.arc(-s * 0.1, -s * 0.12, s * 0.15, 0, Math.PI, true);
    ctx.lineTo(-s * 0.25, -s * 0.02);
  };
  ctx.lineWidth = s * 0.15;
  ctx.strokeStyle = '#ffffff';
  path();
  ctx.stroke();
  ctx.setLineDash([s * 0.08, s * 0.08]);
  ctx.strokeStyle = color;
  path();
  ctx.stroke();
  ctx.setLineDash([]);
};

export const lollipop: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.fillStyle = '#fff4e6';
  roundRectPath(ctx, -s * 0.035, 0, s * 0.07, s * 0.48, s * 0.03);
  ctx.fill();
  ctx.save();
  ctx.translate(0, -s * 0.12);
  ball(ctx, s * 0.3, color);
  ctx.strokeStyle = withAlpha('#ffffff', 0.85);
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.beginPath();
  for (let a = 0; a < 3.2 * TAU; a += 0.25) {
    const r = (a / (3.2 * TAU)) * s * 0.26;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (a === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
};

export const candyCorn: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.42);
  ctx.quadraticCurveTo(s * 0.34, s * 0.2, s * 0.3, s * 0.34);
  ctx.quadraticCurveTo(0, s * 0.44, -s * 0.3, s * 0.34);
  ctx.quadraticCurveTo(-s * 0.34, s * 0.2, 0, -s * 0.42);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#fff4e6';
  ctx.fillRect(-s, -s, 2 * s, 2 * s);
  ctx.fillStyle = color;
  ctx.fillRect(-s, -s * 0.12, 2 * s, s * 0.3);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(-s, s * 0.18, 2 * s, s);
  ctx.restore();
  gloss(ctx, -s * 0.08, -s * 0.1, s * 0.04, s * 0.12, 0.3, 0.45);
};

/** Laddoo: a round sweet with little speckles. */
export const laddoo: SpritePainter = (ctx, size, color) => {
  const r = size * 0.4;
  ball(ctx, r, color);
  ctx.fillStyle = withAlpha(shade(color, -0.35), 0.6);
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4;
    const d = r * (0.25 + ((i * 37) % 10) / 14);
    circlePath(ctx, Math.cos(a) * d, Math.sin(a) * d, size * 0.022);
    ctx.fill();
  }
  ctx.fillStyle = '#5bbf6a';
  circlePath(ctx, 0, -r * 0.92, size * 0.05);
  ctx.fill();
};

/** Barfi / kaju katli: a diamond sweet with silver leaf. */
export const barfi: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.fillStyle = shade(color, -0.2);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.36); ctx.lineTo(s * 0.44, s * 0.02); ctx.lineTo(0, s * 0.42); ctx.lineTo(-s * 0.44, s * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.4); ctx.lineTo(s * 0.44, -s * 0.04); ctx.lineTo(0, s * 0.34); ctx.lineTo(-s * 0.44, -s * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.75);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.28); ctx.lineTo(s * 0.3, -s * 0.04); ctx.lineTo(0, s * 0.2); ctx.lineTo(-s * 0.3, -s * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = withAlpha('#c9d1d9', 0.9);
  ctx.fillRect(-s * 0.08, -s * 0.1, s * 0.16, s * 0.1);
};

/** Sufganiyah: a sugared jelly doughnut. */
export const sufganiyah: SpritePainter = (ctx, size, color) => {
  const s = size;
  const g = ctx.createRadialGradient(-s * 0.1, -s * 0.15, s * 0.05, 0, 0, s * 0.42);
  g.addColorStop(0, '#f6c27a');
  g.addColorStop(1, '#c97b2c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.03, s * 0.42, s * 0.34, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.85);
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39;
    const d = s * 0.32 * Math.sqrt(((i * 53) % 22) / 22);
    circlePath(ctx, Math.cos(a) * d, Math.sin(a) * d * 0.7 - s * 0.05, s * 0.025);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(s * 0.02, -s * 0.12, s * 0.11, s * 0.07, 0, 0, TAU);
  ctx.fill();
};

/** Mooncake: fluted golden-brown cake with a pressed flower. */
export const mooncake: SpritePainter = (ctx, size, color) => {
  const s = size;
  const r = s * 0.42;
  ctx.fillStyle = shade(color, -0.12);
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * TAU;
    const rr = r * (1 + 0.06 * Math.cos(a * 12));
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.fill();
  ball(ctx, r * 0.84, color);
  ctx.strokeStyle = shade(color, -0.35);
  ctx.lineWidth = Math.max(1, s * 0.03);
  circlePath(ctx, 0, 0, r * 0.62);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3, r * 0.16, r * 0.08, a, 0, TAU);
    ctx.stroke();
  }
};

/** Medjool date. */
export const date: SpritePainter = (ctx, size, color) => {
  const s = size;
  const g = ctx.createLinearGradient(-s * 0.3, -s * 0.2, s * 0.3, s * 0.2);
  g.addColorStop(0, shade(color, 0.25));
  g.addColorStop(1, shade(color, -0.25));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.42, s * 0.22, -0.3, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = withAlpha(shade(color, -0.45), 0.6);
  ctx.lineWidth = Math.max(0.8, s * 0.02);
  ctx.beginPath();
  ctx.moveTo(-s * 0.25, -s * 0.02); ctx.quadraticCurveTo(0, s * 0.06, s * 0.2, -s * 0.12);
  ctx.moveTo(-s * 0.15, s * 0.1); ctx.quadraticCurveTo(s * 0.05, s * 0.12, s * 0.25, 0);
  ctx.stroke();
  gloss(ctx, -s * 0.12, -s * 0.08, s * 0.1, s * 0.035, -0.3, 0.4);
};

/** Maamoul: a domed cookie with a pressed star-and-ring pattern. */
export const maamoul: SpritePainter = (ctx, size, color) => {
  const s = size;
  const r = s * 0.4;
  ball(ctx, r, color);
  ctx.strokeStyle = shade(color, -0.3);
  ctx.lineWidth = Math.max(1, s * 0.025);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25);
    ctx.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
    ctx.stroke();
  }
  ctx.fillStyle = withAlpha('#ffffff', 0.55);
  circlePath(ctx, 0, 0, r * 0.18);
  ctx.fill();
};

/** Mandarin orange with a leaf. */
export const tangerine: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.save();
  ctx.translate(0, s * 0.04);
  ball(ctx, s * 0.38, color);
  ctx.fillStyle = withAlpha(shade(color, -0.3), 0.5);
  for (let i = 0; i < 9; i++) {
    circlePath(ctx, Math.cos(i * 2.2) * s * 0.22, Math.sin(i * 2.2) * s * 0.2, s * 0.012);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#2f9e44';
  ctx.beginPath();
  ctx.ellipse(s * 0.12, -s * 0.36, s * 0.16, s * 0.07, -0.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#5c3a1a';
  ctx.fillRect(-s * 0.02, -s * 0.38, s * 0.04, s * 0.08);
};

export const apple: SpritePainter = (ctx, size, color) => {
  const s = size;
  const g = ctx.createRadialGradient(-s * 0.15, -s * 0.12, s * 0.04, 0, s * 0.05, s * 0.42);
  g.addColorStop(0, shade(color, 0.35));
  g.addColorStop(1, shade(color, -0.25));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.24);
  ctx.bezierCurveTo(s * 0.32, -s * 0.42, s * 0.52, -s * 0.02, s * 0.28, s * 0.32);
  ctx.bezierCurveTo(s * 0.16, s * 0.46, s * 0.04, s * 0.38, 0, s * 0.36);
  ctx.bezierCurveTo(-s * 0.04, s * 0.38, -s * 0.16, s * 0.46, -s * 0.28, s * 0.32);
  ctx.bezierCurveTo(-s * 0.52, -s * 0.02, -s * 0.32, -s * 0.42, 0, -s * 0.24);
  ctx.fill();
  ctx.strokeStyle = '#5c3a1a';
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.22);
  ctx.quadraticCurveTo(s * 0.02, -s * 0.36, s * 0.07, -s * 0.42);
  ctx.stroke();
  ctx.fillStyle = '#3fae49';
  ctx.beginPath();
  ctx.ellipse(s * 0.16, -s * 0.34, s * 0.12, s * 0.055, -0.4, 0, TAU);
  ctx.fill();
  gloss(ctx, -s * 0.18, -s * 0.06, s * 0.05, s * 0.1, 0.3, 0.4);
};

/** Holi gulal ball: a powdery color puff with a dusty halo. */
export const colorBall: SpritePainter = (ctx, size, color) => {
  const s = size;
  const halo = ctx.createRadialGradient(0, 0, s * 0.25, 0, 0, s * 0.5);
  halo.addColorStop(0, withAlpha(color, 0.5));
  halo.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = halo;
  circlePath(ctx, 0, 0, s * 0.5);
  ctx.fill();
  ball(ctx, s * 0.34, color);
  ctx.fillStyle = withAlpha('#ffffff', 0.5);
  for (let i = 0; i < 10; i++) {
    circlePath(ctx, Math.cos(i * 2.5) * s * 0.2, Math.sin(i * 2.5) * s * 0.2, s * 0.02);
    ctx.fill();
  }
};

/** A water drop (Songkran, Earth Day). */
export const drop: SpritePainter = (ctx, size, color) => {
  const s = size;
  const g = ctx.createLinearGradient(-s * 0.2, -s * 0.4, s * 0.2, s * 0.4);
  g.addColorStop(0, shade(color, 0.45));
  g.addColorStop(1, shade(color, -0.15));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.44);
  ctx.bezierCurveTo(s * 0.12, -s * 0.2, s * 0.32, 0, s * 0.32, s * 0.14);
  ctx.arc(0, s * 0.14, s * 0.32, 0, Math.PI);
  ctx.bezierCurveTo(-s * 0.32, 0, -s * 0.12, -s * 0.2, 0, -s * 0.44);
  ctx.fill();
  gloss(ctx, -s * 0.12, s * 0.08, s * 0.05, s * 0.11, 0.2, 0.6);
};

/** Hamantasch: a three-cornered cookie with a jammy center. */
export const hamantasch: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.fillStyle = '#e8b56a';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i / 3) * TAU;
    const b = a + TAU / 6;
    ctx.lineTo(Math.cos(a) * s * 0.46, Math.sin(a) * s * 0.46);
    ctx.quadraticCurveTo(Math.cos(b) * s * 0.18, Math.sin(b) * s * 0.18, Math.cos(a + TAU / 3) * s * 0.46, Math.sin(a + TAU / 3) * s * 0.46);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i / 3) * TAU;
    ctx.lineTo(Math.cos(a) * s * 0.17, Math.sin(a) * s * 0.17);
  }
  ctx.closePath();
  ctx.fill();
};

/** Hearts with a shine (Valentine's, Mother's Day). */
export const shinyHeart: SpritePainter = (ctx, size, color) => {
  const s = size;
  const g = ctx.createLinearGradient(0, -s * 0.4, 0, s * 0.4);
  g.addColorStop(0, shade(color, 0.3));
  g.addColorStop(1, shade(color, -0.15));
  ctx.fillStyle = g;
  heartPath(ctx, 0, s * 0.02, s * 0.86, s * 0.8);
  ctx.fill();
  gloss(ctx, -s * 0.2, -s * 0.12, s * 0.07, s * 0.12, 0.6, 0.55);
};

/** The golden "special" item: a fat star with a smile-free shine. */
export const goldStar: SpritePainter = (ctx, size, color) => {
  const s = size;
  const g = ctx.createRadialGradient(-s * 0.1, -s * 0.12, s * 0.05, 0, 0, s * 0.5);
  g.addColorStop(0, shade(color, 0.55));
  g.addColorStop(1, shade(color, -0.12));
  ctx.fillStyle = g;
  ctx.lineJoin = 'round';
  starPath(ctx, 0, s * 0.03, 5, s * 0.48, s * 0.24);
  ctx.fill();
  ctx.strokeStyle = shade(color, -0.3);
  ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.stroke();
  gloss(ctx, -s * 0.12, -s * 0.1, s * 0.05, s * 0.1, 0.5, 0.6);
};

// ------------------------------------------------------------------ oops items (they only bounce off)

/** A sleepy little cloud with closed eyes and a "z". */
export const sleepyCloud: SpritePainter = (ctx, size, color) => {
  const s = size;
  const puffs: readonly (readonly [number, number, number])[] = [[-0.24, 0.06, 0.2], [-0.02, -0.1, 0.26], [0.24, 0.04, 0.2]];
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const [x, y, r] of puffs) {
    ctx.moveTo((x + r) * s, y * s);
    ctx.arc(x * s, y * s, r * s, 0, TAU);
  }
  roundRectPath(ctx, -s * 0.42, s * 0.02, s * 0.84, s * 0.24, s * 0.12);
  ctx.fill();
  ctx.fillStyle = withAlpha('#6b7a99', 0.18);
  ctx.fillRect(-s * 0.36, s * 0.16, s * 0.72, s * 0.08);
  ctx.strokeStyle = '#4a4f6a';
  ctx.lineWidth = Math.max(1, s * 0.035);
  ctx.lineCap = 'round';
  for (const x of [-0.12, 0.12]) {
    ctx.beginPath();
    ctx.arc(x * s, s * 0.04, s * 0.06, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  ctx.fillStyle = withAlpha('#ff8fb8', 0.55);
  for (const x of [-0.24, 0.24]) {
    circlePath(ctx, x * s, s * 0.12, s * 0.045);
    ctx.fill();
  }
  ctx.fillStyle = '#4a4f6a';
  ctx.font = `700 ${Math.round(s * 0.2)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('z', s * 0.3, -s * 0.28);
};

/** A smooth gray pebble with a tiny dozing face. */
export const pebble: SpritePainter = (ctx, size, color) => {
  const s = size;
  const g = ctx.createRadialGradient(-s * 0.12, -s * 0.14, s * 0.04, 0, 0, s * 0.42);
  g.addColorStop(0, shade(color, 0.35));
  g.addColorStop(1, shade(color, -0.2));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.04, s * 0.4, s * 0.3, 0.12, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = shade(color, -0.55);
  ctx.lineWidth = Math.max(1, s * 0.035);
  ctx.lineCap = 'round';
  for (const x of [-0.11, 0.11]) {
    ctx.beginPath();
    ctx.moveTo((x - 0.05) * s, s * 0.04);
    ctx.lineTo((x + 0.05) * s, s * 0.04);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, s * 0.1, s * 0.04, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
};

// ------------------------------------------------------------------ registry

/** Item painters owned by this activity (all get the sticker treatment on registration). */
export const ITEM_PAINTERS: Readonly<Record<string, SpritePainter>> = {
  present, candy, candyCane, lollipop, candyCorn, laddoo, barfi, sufganiyah, mooncake, date, maamoul,
  tangerine, apple, colorBall, drop, hamantasch, shinyHeart, goldStar, sleepyCloud, pebble,
  pumpkin, corn, clover4, tulip, daisy, poppy,
};

/** Cache name for a skin sprite: glyphs pass through; painters get a `catch:` sticker version. */
export function spriteName(sprite: string): string {
  return sprite.startsWith('glyph:') ? sprite : `catch:${sprite}`;
}

/** Registers the sticker version of every sprite a skin uses (idempotent). */
export function registerSprites(cache: SpriteCache, sprites: readonly string[]): void {
  for (const sprite of sprites) {
    if (sprite.startsWith('glyph:')) continue;
    const name = spriteName(sprite);
    if (cache.has(name)) continue;
    const base = ITEM_PAINTERS[sprite] ?? PAINTERS[sprite];
    if (base) cache.register(name, stickerize(base));
  }
}

/** True when a sprite name resolves to something drawable (tests and the skin lint). */
export function knownSprite(sprite: string): boolean {
  return sprite.startsWith('glyph:') || sprite in ITEM_PAINTERS || sprite in PAINTERS;
}
