/**
 * extra-day.ts — sprite painters for the "day" presets (hearts, holi, shamrocks, eggs, petals).
 * Each preset registers the ones it needs under its own prefix (`holi:splash0`, `eggs:grass`, …) in its
 * constructor, guarded by `sprites.has(name)`. Like every painter they draw centred on the origin within
 * about ±size/2 and run once per (name, size, colour), so gradients and loops here cost nothing per frame.
 */
import type { SpritePainter } from '../types';
import { shade, withAlpha } from './color';
import { TAU, circlePath, heartPath } from './shapes';

const GOLD = '#ffd166';

/** Tiny deterministic generator for painter-time irregularity (splats), independent of the effect RNG. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ------------------------------------------------------------------ hearts

/** The heartbeat heart: glossy gradient body, a white sticker rim and a soft highlight. */
export const bigHeart: SpritePainter = (ctx, size, color) => {
  const s = size;
  heartPath(ctx, 0, s * 0.02, s * 0.94, s * 0.86);
  const g = ctx.createRadialGradient(-s * 0.2, -s * 0.2, s * 0.04, 0, 0, s * 0.62);
  g.addColorStop(0, shade(color, 0.42));
  g.addColorStop(0.55, color);
  g.addColorStop(1, shade(color, -0.22));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = withAlpha('#ffffff', 0.9);
  ctx.lineWidth = Math.max(2, s * 0.035);
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = withAlpha('#ffffff', 0.55);
  ctx.beginPath();
  ctx.ellipse(-s * 0.22, -s * 0.16, s * 0.1, s * 0.055, -0.65, 0, TAU);
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.4);
  circlePath(ctx, -s * 0.09, -s * 0.24, s * 0.028);
  ctx.fill();
};

// ------------------------------------------------------------------ holi

/** Gulal splat: a lumpy blob with a soft core and a few flung droplets. Three seeds give three shapes. */
function splash(seed: number): SpritePainter {
  return (ctx, size, color) => {
    const rnd = lcg(seed);
    const R = size * 0.36;
    const a1 = rnd() * TAU;
    const a2 = rnd() * TAU;
    const a3 = rnd() * TAU;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.25);
    g.addColorStop(0, withAlpha(color, 0.95));
    g.addColorStop(0.6, withAlpha(color, 0.75));
    g.addColorStop(1, withAlpha(color, 0.25));
    ctx.fillStyle = g;
    ctx.beginPath();
    const N = 96;
    for (let k = 0; k <= N; k++) {
      const th = (k / N) * TAU;
      const r = R * (0.82 + 0.12 * Math.sin(3 * th + a1) + 0.08 * Math.sin(5 * th + a2) + 0.06 * Math.sin(11 * th + a3));
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = withAlpha(color, 0.8);
    for (let k = 0; k < 7; k++) {
      const a = rnd() * TAU;
      const d = R * (1.12 + 0.3 * rnd());
      circlePath(ctx, Math.cos(a) * d, Math.sin(a) * d, size * (0.018 + 0.03 * rnd()));
      ctx.fill();
    }
  };
}

export const holiSplash0 = splash(11);
export const holiSplash1 = splash(29);
export const holiSplash2 = splash(47);

// ------------------------------------------------------------------ shamrocks

/** Lucky four-leaf clover. */
export const clover4: SpritePainter = (ctx, size, color) => {
  const leaf = size * 0.44;
  ctx.fillStyle = color;
  for (let k = 0; k < 4; k++) {
    ctx.save();
    ctx.rotate((k * TAU) / 4 + Math.PI / 4);
    heartPath(ctx, 0, -leaf * 0.5, leaf, leaf * 0.95);
    ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = withAlpha('#ffffff', 0.4);
  ctx.lineWidth = Math.max(0.5, size * 0.03);
  ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * TAU) / 4 - Math.PI / 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * size * 0.34, Math.sin(a) * size * 0.34);
  }
  ctx.stroke();
  ctx.strokeStyle = shade(color, -0.25);
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, size * 0.04);
  ctx.quadraticCurveTo(size * 0.12, size * 0.3, size * 0.06, size * 0.5);
  ctx.stroke();
};

/** Pot of gold: a black cauldron (size = its width) brimming with a heap of `color` coins. */
export const potOfGold: SpritePainter = (ctx, size, color) => {
  const s = size;
  const heap = [[-0.26, -0.1], [-0.12, -0.17], [0.03, -0.2], [0.17, -0.15], [0.28, -0.08], [-0.05, -0.27], [0.1, -0.29], [-0.18, -0.24]] as const;
  for (const [x, y] of heap) {
    const g = ctx.createRadialGradient((x - 0.03) * s, (y - 0.03) * s, s * 0.01, x * s, y * s, s * 0.09);
    g.addColorStop(0, shade(color, 0.5));
    g.addColorStop(1, shade(color, -0.12));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x * s, y * s, s * 0.09, s * 0.065, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = withAlpha(shade(color, -0.4), 0.6);
    ctx.lineWidth = Math.max(0.6, s * 0.008);
    ctx.stroke();
  }
  const body = ctx.createLinearGradient(-s * 0.42, 0, s * 0.42, 0);
  body.addColorStop(0, '#2b2b33');
  body.addColorStop(0.35, '#4a4a58');
  body.addColorStop(1, '#141418');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, -s * 0.06);
  ctx.bezierCurveTo(-s * 0.52, s * 0.18, -s * 0.34, s * 0.34, 0, s * 0.34);
  ctx.bezierCurveTo(s * 0.34, s * 0.34, s * 0.52, s * 0.18, s * 0.4, -s * 0.06);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1b1b22';
  ctx.fillRect(-s * 0.3, s * 0.3, s * 0.07, s * 0.1);
  ctx.fillRect(s * 0.23, s * 0.3, s * 0.07, s * 0.1);
  ctx.fillStyle = '#3c3c48';
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.06, s * 0.44, s * 0.07, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#ffffff', 0.25);
  ctx.lineWidth = Math.max(1, s * 0.015);
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.06, s * 0.42, s * 0.055, 0, Math.PI * 1.05, Math.PI * 1.6);
  ctx.stroke();
  ctx.fillStyle = withAlpha('#ffffff', 0.12);
  ctx.beginPath();
  ctx.ellipse(-s * 0.22, s * 0.12, s * 0.05, s * 0.12, 0.3, 0, TAU);
  ctx.fill();
};

// ------------------------------------------------------------------ eggs

/** A tuft of grass blades (size = height), rooted at the bottom of the sprite box. */
export const grassTuft: SpritePainter = (ctx, size, color) => {
  const s = size;
  const blades = [[-0.36, 0.62, -0.22], [-0.2, 0.86, -0.1], [-0.05, 1, 0.02], [0.1, 0.78, 0.14], [0.26, 0.92, 0.22], [0.4, 0.6, 0.3]] as const;
  const base = s * 0.5;
  for (let k = 0; k < blades.length; k++) {
    const [x, hgt, lean] = blades[k]!;
    const g = ctx.createLinearGradient(0, base, 0, base - hgt * s);
    g.addColorStop(0, shade(color, -0.3));
    g.addColorStop(1, shade(color, k % 2 === 0 ? 0.25 : 0.1));
    ctx.fillStyle = g;
    const bx = x * s;
    const w = s * 0.075;
    ctx.beginPath();
    ctx.moveTo(bx - w, base);
    ctx.quadraticCurveTo(bx + lean * s * 0.3, base - hgt * s * 0.55, bx + lean * s, base - hgt * s);
    ctx.quadraticCurveTo(bx + lean * s * 0.3 + w * 0.6, base - hgt * s * 0.5, bx + w, base);
    ctx.closePath();
    ctx.fill();
  }
};

/** Top half of a cracked egg with a zigzag rim. */
export const eggHalf: SpritePainter = (ctx, size, color) => {
  const s = size;
  const w = s * 0.78;
  ctx.beginPath();
  ctx.moveTo(-w / 2, s * 0.05);
  ctx.bezierCurveTo(-w / 2, -s * 0.2, -w * 0.4, -s * 0.48, 0, -s * 0.48);
  ctx.bezierCurveTo(w * 0.4, -s * 0.48, w / 2, -s * 0.2, w / 2, s * 0.05);
  const teeth = 6;
  for (let k = 1; k <= teeth; k++) {
    const x = w / 2 - (k / teeth) * w;
    const y = k % 2 === 1 ? s * 0.16 : s * 0.04;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(-w * 0.2, -s * 0.25, s * 0.04, 0, 0, s * 0.55);
  g.addColorStop(0, shade(color, 0.3));
  g.addColorStop(1, shade(color, -0.1));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = withAlpha('#ffffff', 0.85);
  ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.lineJoin = 'round';
  ctx.stroke();
};

/** Bunny ears peeking up (size = height); `color` is the pink inner ear. */
export const bunnyEars: SpritePainter = (ctx, size, color) => {
  const s = size;
  const ear = (dx: number, lean: number): void => {
    ctx.save();
    ctx.translate(dx * s, s * 0.5);
    ctx.rotate(lean);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.48, s * 0.13, s * 0.48, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = withAlpha('#3a2a4a', 0.18);
    ctx.lineWidth = Math.max(1, s * 0.015);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.46, s * 0.065, s * 0.36, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  };
  ear(-0.13, -0.18);
  ear(0.13, 0.22);
};

// ------------------------------------------------------------------ petals

/** Remembrance poppy, seen from above: four round petals and a dark centre. */
export const poppy: SpritePainter = (ctx, size, color) => {
  const s = size;
  for (let k = 0; k < 4; k++) {
    const a = (k * TAU) / 4 + 0.4;
    const g = ctx.createRadialGradient(0, 0, s * 0.05, Math.cos(a) * s * 0.18, Math.sin(a) * s * 0.18, s * 0.3);
    g.addColorStop(0, shade(color, -0.3));
    g.addColorStop(0.5, color);
    g.addColorStop(1, shade(color, 0.12));
    ctx.fillStyle = g;
    circlePath(ctx, Math.cos(a) * s * 0.19, Math.sin(a) * s * 0.19, s * 0.27);
    ctx.fill();
  }
  ctx.fillStyle = '#1a1414';
  circlePath(ctx, 0, 0, s * 0.11);
  ctx.fill();
  ctx.fillStyle = withAlpha('#3a3a3a', 0.9);
  for (let k = 0; k < 8; k++) {
    const a = (k * TAU) / 8;
    circlePath(ctx, Math.cos(a) * s * 0.14, Math.sin(a) * s * 0.14, s * 0.02);
    ctx.fill();
  }
};

/** Daisy: a ring of long `color` petals and a golden centre. */
export const daisy: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.fillStyle = color;
  for (let k = 0; k < 14; k++) {
    const a = (k * TAU) / 14;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * s * 0.26, Math.sin(a) * s * 0.26, s * 0.2, s * 0.065, a, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = withAlpha(shade(color, -0.35), 0.35);
  ctx.lineWidth = Math.max(0.5, s * 0.01);
  for (let k = 0; k < 14; k++) {
    const a = (k * TAU) / 14;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * s * 0.12, Math.sin(a) * s * 0.12);
    ctx.lineTo(Math.cos(a) * s * 0.4, Math.sin(a) * s * 0.4);
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(-s * 0.03, -s * 0.03, s * 0.01, 0, 0, s * 0.12);
  g.addColorStop(0, '#fff1a8');
  g.addColorStop(1, '#f2a516');
  ctx.fillStyle = g;
  circlePath(ctx, 0, 0, s * 0.12);
  ctx.fill();
};

/** Tulip cup seen from the side (size = height), opening upward. */
export const tulip: SpritePainter = (ctx, size, color) => {
  const s = size;
  const g = ctx.createLinearGradient(0, -s * 0.45, 0, s * 0.35);
  g.addColorStop(0, shade(color, 0.3));
  g.addColorStop(1, shade(color, -0.2));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(-s * 0.36, s * 0.3, -s * 0.38, -s * 0.1, -s * 0.3, -s * 0.42);
  ctx.lineTo(-s * 0.15, -s * 0.2);
  ctx.lineTo(0, -s * 0.45);
  ctx.lineTo(s * 0.15, -s * 0.2);
  ctx.lineTo(s * 0.3, -s * 0.42);
  ctx.bezierCurveTo(s * 0.38, -s * 0.1, s * 0.36, s * 0.3, 0, s * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = withAlpha(shade(color, -0.35), 0.45);
  ctx.lineWidth = Math.max(0.75, s * 0.025);
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, -s * 0.12);
  ctx.quadraticCurveTo(-s * 0.08, s * 0.15, 0, s * 0.33);
  ctx.moveTo(s * 0.12, -s * 0.12);
  ctx.quadraticCurveTo(s * 0.08, s * 0.15, 0, s * 0.33);
  ctx.stroke();
  ctx.fillStyle = withAlpha('#ffffff', 0.3);
  ctx.beginPath();
  ctx.ellipse(-s * 0.16, -s * 0.02, s * 0.04, s * 0.14, 0.15, 0, TAU);
  ctx.fill();
};

/** Almond leaf with a midrib, pointing up. */
export const springLeaf: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.bezierCurveTo(s * 0.3, -s * 0.3, s * 0.28, s * 0.25, 0, s * 0.45);
  ctx.bezierCurveTo(-s * 0.28, s * 0.25, -s * 0.3, -s * 0.3, 0, -s * 0.5);
  ctx.closePath();
  const g = ctx.createLinearGradient(-s * 0.3, 0, s * 0.3, 0);
  g.addColorStop(0, shade(color, 0.18));
  g.addColorStop(1, shade(color, -0.15));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = withAlpha('#ffffff', 0.45);
  ctx.lineWidth = Math.max(0.6, s * 0.03);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.4);
  ctx.lineTo(0, s * 0.5);
  for (const f of [-0.2, 0, 0.2]) {
    ctx.moveTo(0, f * s);
    ctx.lineTo(s * 0.14, f * s - s * 0.12);
    ctx.moveTo(0, f * s);
    ctx.lineTo(-s * 0.14, f * s - s * 0.12);
  }
  ctx.stroke();
};

/** Little ofrenda candle (size = height); the flame is drawn on top by the effect. */
export const candle: SpritePainter = (ctx, size, color) => {
  const s = size;
  const w = s * 0.34;
  const top = -s * 0.22;
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, shade(color, -0.12));
  g.addColorStop(0.4, shade(color, 0.2));
  g.addColorStop(1, shade(color, -0.25));
  ctx.fillStyle = g;
  ctx.fillRect(-w / 2, top, w, s * 0.7);
  ctx.fillStyle = shade(color, 0.3);
  ctx.beginPath();
  ctx.ellipse(0, top, w / 2, w * 0.18, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-w * 0.28, top + s * 0.06, w * 0.09, s * 0.07, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = Math.max(1, s * 0.025);
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.lineTo(0, top - s * 0.07);
  ctx.stroke();
  ctx.fillStyle = withAlpha(GOLD, 0.25);
  ctx.fillRect(-w / 2, top + s * 0.18, w, s * 0.05);
};

// ------------------------------------------------------------------ text

/**
 * A short label (digit, "×") in a plain rounded system font with a white sticker outline. Glyph sprites
 * use the emoji font stack, where colour fonts paint digits as grey keycap glyphs; these stay in `color`.
 */
export function labelPainter(text: string): SpritePainter {
  return (ctx, size, color) => {
    ctx.font = `700 ${Math.max(4, Math.round(size * 0.86))}px ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(text, 0, size * 0.04);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, size * 0.04);
  };
}
