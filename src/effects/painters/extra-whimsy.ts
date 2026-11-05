/**
 * extra-whimsy.ts — sprite painters (and two tiny helpers) for the whimsy presets: moon, sabzeh,
 * glyph-rain, balloons, bubbles and planes. Each preset registers what it needs in its constructor,
 * guarded by `sprites.has(name)`, under a `<preset>:` prefix so names never collide with other groups.
 *
 * Painters draw centred on the origin within about ±size/2 and run once per (name, size, colour), so
 * gradients and a few dozen arcs here cost nothing per frame. Big scenery (the moon, the globe, the
 * cake) is painted at a capped, quantised size and drawn with a scale.
 */
import type { Budgeter } from '../particles';
import type { SpritePainter } from '../types';
import { mixColor, shade, withAlpha } from './color';
import { TAU, circlePath, roundRectPath } from './shapes';

const GOLD = '#ffd166';
const INK = '#1f1a3d';

// ------------------------------------------------------------------ helpers shared by the whimsy presets

/**
 * `budget.frame(limit)` that sheds ambient particles first: kinds below `sceneryBelow` (the moon, grass
 * clumps, candle flames, the globe…) are only trimmed when the budget is smaller than the scenery.
 */
export function frameScenery(budget: Budgeter, limit: number, sceneryBelow: number): number {
  const pool = budget.pool;
  const cap = Math.max(0, Math.min(Math.floor(limit), pool.capacity));
  for (let i = pool.count - 1; i >= 0 && pool.count > cap; i--) {
    if (pool.kind[i]! >= sceneryBelow) pool.kill(i);
  }
  return budget.frame(limit);
}

/** Quantises a layout size so resizing does not thrash the sprite cache. */
export function quant(px: number, step = 8): number {
  return Math.max(step, Math.round(px / step) * step);
}

/** Tiny deterministic hash → [0, 1) for painters (they have no RNG and must paint the same every time). */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ------------------------------------------------------------------ moon (Mid-Autumn, Chuseok)

/** The harvest moon: warm disc, soft maria, a faint limb darkening. `color` is the bright face. */
export const moonDisc: SpritePainter = (ctx, size, color) => {
  const r = size / 2;
  const g = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.05, 0, 0, r);
  g.addColorStop(0, shade(color, 0.55));
  g.addColorStop(0.55, color);
  g.addColorStop(0.92, shade(color, -0.08));
  g.addColorStop(1, shade(color, -0.18));
  ctx.fillStyle = g;
  circlePath(ctx, 0, 0, r);
  ctx.fill();
  const maria: readonly (readonly [number, number, number, number])[] = [
    [-0.38, -0.22, 0.26, 0.2], [0.05, -0.42, 0.18, 0.12], [0.36, -0.05, 0.2, 0.26], [-0.12, 0.38, 0.22, 0.14], [0.28, 0.45, 0.12, 0.08],
  ];
  for (const [x, y, rx, ry] of maria) {
    const m = ctx.createRadialGradient(x * r, y * r, 0, x * r, y * r, Math.max(rx, ry) * r);
    m.addColorStop(0, withAlpha(shade(color, -0.3), 0.32));
    m.addColorStop(1, withAlpha(shade(color, -0.3), 0));
    ctx.fillStyle = m;
    ctx.beginPath();
    ctx.ellipse(x * r, y * r, rx * r, ry * r, x * 2, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = withAlpha(shade(color, -0.35), 0.18);
  for (let k = 0; k < 9; k++) {
    const a = hash(k) * TAU;
    const d = 0.25 + 0.6 * hash(k + 20);
    circlePath(ctx, Math.cos(a) * d * r, Math.sin(a) * d * r, (0.03 + 0.04 * hash(k + 40)) * r);
    ctx.fill();
  }
};

/** The jade rabbit: a sitting silhouette facing left with its mortar (the pestle is drawn separately). */
export const moonRabbit: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(s * 0.1, s * 0.14, s * 0.22, s * 0.2, -0.2, 0, TAU);
  ctx.fill();
  circlePath(ctx, -s * 0.1, -s * 0.1, s * 0.13);
  ctx.fill();
  for (const [x, a, l] of [[-0.08, -0.35, 0.22], [0.0, -0.15, 0.24]] as const) {
    ctx.beginPath();
    ctx.ellipse(x * s + Math.sin(a) * l * s * 0.5, -s * 0.2 - Math.cos(a) * l * s * 0.5, s * 0.045, l * s * 0.55, a, 0, TAU);
    ctx.fill();
  }
  circlePath(ctx, s * 0.31, s * 0.24, s * 0.06);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-s * 0.2, s * 0.06, s * 0.06, s * 0.035, 0.6, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.06, s * 0.34, s * 0.14, s * 0.04, 0, 0, TAU);
  ctx.fill();
  // Mortar: a little bowl on a foot.
  ctx.beginPath();
  ctx.moveTo(-s * 0.48, s * 0.12);
  ctx.lineTo(-s * 0.24, s * 0.12);
  ctx.quadraticCurveTo(-s * 0.25, s * 0.3, -s * 0.31, s * 0.3);
  ctx.lineTo(-s * 0.29, s * 0.37);
  ctx.lineTo(-s * 0.43, s * 0.37);
  ctx.lineTo(-s * 0.41, s * 0.3);
  ctx.quadraticCurveTo(-s * 0.47, s * 0.3, -s * 0.48, s * 0.12);
  ctx.closePath();
  ctx.fill();
};

/** The pestle the rabbit pounds with: a stick with a round head. */
export const moonPestle: SpritePainter = (ctx, size, color) => {
  ctx.fillStyle = color;
  roundRectPath(ctx, -size * 0.07, -size * 0.5, size * 0.14, size * 0.86, size * 0.07);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, size * 0.36, size * 0.13, size * 0.12, 0, 0, TAU);
  ctx.fill();
};

/** A soft cloud bank, lit along its top edge; `color` is the lit tone. Width = size, height ≈ 0.4·size. */
export const softCloud: SpritePainter = (ctx, size, color) => {
  const s = size;
  const puffs: readonly (readonly [number, number, number])[] = [
    [-0.33, 0.06, 0.13], [-0.17, -0.03, 0.18], [0.03, -0.08, 0.21], [0.22, -0.01, 0.16], [0.37, 0.06, 0.11], [0.0, 0.08, 0.2],
  ];
  const g = ctx.createLinearGradient(0, -s * 0.28, 0, s * 0.2);
  g.addColorStop(0, shade(color, 0.35));
  g.addColorStop(0.55, color);
  g.addColorStop(1, withAlpha(shade(color, -0.22), 0.8));
  ctx.fillStyle = g;
  ctx.beginPath();
  for (const [x, y, r] of puffs) {
    ctx.moveTo((x + r) * s, y * s);
    ctx.arc(x * s, y * s, r * s, 0, TAU);
  }
  ctx.fill();
};

/** Round paper lantern glowing from inside: ribbed body in `color`, gold caps, red tassel. Height = size. */
export const roundLantern: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.strokeStyle = shade(GOLD, -0.3);
  ctx.lineWidth = Math.max(1, s * 0.025);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.lineTo(0, -s * 0.38);
  ctx.stroke();
  const g = ctx.createRadialGradient(0, s * 0.04, s * 0.02, 0, 0, s * 0.4);
  g.addColorStop(0, shade(color, 0.75));
  g.addColorStop(0.45, shade(color, 0.25));
  g.addColorStop(1, shade(color, -0.2));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.37, s * 0.34, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = withAlpha(shade(color, -0.35), 0.45);
  ctx.lineWidth = Math.max(0.6, s * 0.018);
  ctx.beginPath();
  for (const f of [0.35, 0.7]) {
    ctx.ellipse(0, 0, s * 0.37 * f, s * 0.34, 0, 0, TAU);
  }
  ctx.moveTo(0, -s * 0.34);
  ctx.lineTo(0, s * 0.34);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  roundRectPath(ctx, -s * 0.15, -s * 0.39, s * 0.3, s * 0.08, s * 0.03);
  ctx.fill();
  roundRectPath(ctx, -s * 0.15, s * 0.31, s * 0.3, s * 0.08, s * 0.03);
  ctx.fill();
  ctx.strokeStyle = '#e8202a';
  ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.beginPath();
  for (const dx of [-0.04, 0, 0.04]) {
    ctx.moveTo(dx * s * 0.5, s * 0.39);
    ctx.lineTo(dx * s, s * 0.52);
  }
  ctx.stroke();
};

// ------------------------------------------------------------------ sabzeh (Nowruz)

/** A red ribbon bow (the sabzeh is tied with one). */
export const ribbonBow: SpritePainter = (ctx, size, color) => {
  const s = size;
  const dark = shade(color, -0.3);
  ctx.fillStyle = dark;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(dir * s * 0.04, s * 0.04);
    ctx.lineTo(dir * s * 0.22, s * 0.46);
    ctx.lineTo(dir * s * 0.14, s * 0.4);
    ctx.lineTo(dir * s * 0.08, s * 0.48);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = color;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(dir * s * 0.2, -s * 0.36, dir * s * 0.52, -s * 0.2, dir * s * 0.44, s * 0.02);
    ctx.bezierCurveTo(dir * s * 0.38, s * 0.2, dir * s * 0.16, s * 0.12, 0, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = withAlpha('#ffffff', 0.3);
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(dir * s * 0.26, -s * 0.12, s * 0.08, s * 0.03, dir * -0.5, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = shade(color, -0.12);
  roundRectPath(ctx, -s * 0.08, -s * 0.08, s * 0.16, s * 0.16, s * 0.05);
  ctx.fill();
};

// ------------------------------------------------------------------ glyph-rain (Pi Day, Leap Day…)

const CHALK_FONT = '"Chalkboard SE", "Comic Sans MS", "Segoe Print", ui-rounded, system-ui, sans-serif';

/**
 * Chalk lettering: the text in `color` with grain rubbed out of it (no outline, unlike `glyph:`).
 * `fontK` is the font size as a share of the sprite size: keep it small for long text (formulas) so the
 * words fit the square sprite.
 */
export function chalkText(text: string, fontK = 0.78): SpritePainter {
  return (ctx, size, color) => {
    ctx.font = `700 ${Math.max(4, Math.round(size * fontK))}px ${CHALK_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.92;
    ctx.fillText(text, 0, size * fontK * 0.05);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';
    const n = Math.round(size * 1.6 * Math.min(4, 0.78 / fontK));
    const dot = Math.max(0.6, size * fontK * 0.032);
    for (let k = 0; k < n; k++) {
      ctx.fillRect((hash(k * 3 + text.length) - 0.5) * size * 1.3, (hash(k * 3 + 1) - 0.5) * size, dot, dot);
    }
    ctx.globalCompositeOperation = 'source-over';
  };
}

/** An eraser smudge on a chalkboard: a few overlapping soft streaks. Width = size. */
export const chalkSmudge: SpritePainter = (ctx, size, color) => {
  for (let k = 0; k < 5; k++) {
    const y = (hash(k + 5) - 0.5) * size * 0.25;
    const x = (hash(k + 9) - 0.5) * size * 0.2;
    const g = ctx.createRadialGradient(x, y, 0, x, y, size * 0.4);
    g.addColorStop(0, withAlpha(color, 0.22));
    g.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.4, size * 0.09, (hash(k) - 0.5) * 0.25, 0, TAU);
    ctx.fill();
  }
};

/** A lily pad seen at a slant (drawn squashed by the effect): a notched disc with veins. */
export const lilyPad: SpritePainter = (ctx, size, color) => {
  const r = size / 2 - 1;
  ctx.fillStyle = shade(color, -0.25);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, r * 0.06, r, -1.25, -1.25 + TAU - 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r * 0.94, -1.25, -1.25 + TAU - 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = withAlpha(shade(color, 0.4), 0.5);
  ctx.lineWidth = Math.max(0.75, size * 0.025);
  ctx.beginPath();
  for (let k = 1; k < 8; k++) {
    const a = -1.25 + (k / 8) * (TAU - 0.5);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
  }
  ctx.stroke();
};

// ------------------------------------------------------------------ balloons (birthdays, Children's Day)

/** A two-tier birthday cake on a plate; `color` is the frosting. Width = size. Candles go on top. */
export const cake: SpritePainter = (ctx, size, color) => {
  const s = size;
  const sponge = '#f6d7a7';
  ctx.fillStyle = withAlpha('#ffffff', 0.9);
  ctx.beginPath();
  ctx.ellipse(0, s * 0.33, s * 0.5, s * 0.06, 0, 0, TAU);
  ctx.fill();
  const tier = (w: number, top: number, h: number): void => {
    ctx.fillStyle = sponge;
    roundRectPath(ctx, -w / 2, top, w, h, s * 0.03);
    ctx.fill();
    ctx.fillStyle = withAlpha('#000000', 0.08);
    ctx.fillRect(w / 2 - w * 0.18, top + h * 0.2, w * 0.18, h * 0.8);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-w / 2, top + s * 0.02);
    ctx.quadraticCurveTo(-w / 2, top, -w / 2 + s * 0.02, top);
    ctx.lineTo(w / 2 - s * 0.02, top);
    ctx.quadraticCurveTo(w / 2, top, w / 2, top + s * 0.02);
    const drips = 7;
    for (let k = drips; k >= 0; k--) {
      const x = -w / 2 + (k / drips) * w;
      const d = h * (0.28 + 0.3 * hash(k + w));
      ctx.lineTo(x, top + d);
      if (k > 0) ctx.quadraticCurveTo(x - w / drips / 2, top + h * 0.18, x - w / drips, top + h * (0.28 + 0.3 * hash(k - 1 + w)));
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = withAlpha('#ffffff', 0.35);
    ctx.fillRect(-w / 2 + s * 0.03, top + s * 0.012, w * 0.5, s * 0.012);
  };
  tier(s * 0.86, s * 0.06, s * 0.26);
  tier(s * 0.58, -s * 0.16, s * 0.22);
  const sprinkles = ['#ff4d5e', '#5b3df5', '#2a9d8f', '#ffb703', '#ffffff'];
  for (let k = 0; k < 26; k++) {
    const lower = k % 2 === 0;
    const w = lower ? s * 0.78 : s * 0.5;
    const top = lower ? s * 0.06 : -s * 0.16;
    const h = lower ? s * 0.26 : s * 0.22;
    ctx.fillStyle = sprinkles[k % sprinkles.length]!;
    const x = (hash(k * 2) - 0.5) * w;
    const y = top + h * (0.45 + 0.45 * hash(k * 2 + 1));
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.012, s * 0.005, hash(k) * 3, 0, TAU);
    ctx.fill();
  }
};

/** A striped birthday candle (no flame); height = size. */
export const stripedCandle: SpritePainter = (ctx, size, color) => {
  const w = size * 0.2;
  const h = size;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, w * 0.3);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.save();
  roundRectPath(ctx, -w / 2, -h / 2, w, h, w * 0.3);
  ctx.clip();
  ctx.strokeStyle = withAlpha('#ffffff', 0.85);
  ctx.lineWidth = w * 0.35;
  ctx.beginPath();
  for (let y = -h / 2 - w; y < h / 2 + w; y += w * 1.1) {
    ctx.moveTo(-w, y + w);
    ctx.lineTo(w, y - w);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.75, w * 0.12);
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);
  ctx.lineTo(0, -h / 2 - size * 0.08);
  ctx.stroke();
};

/** Yaguruma: the spinning arrow-wheel at the top of a koinobori pole. */
export const arrowWheel: SpritePainter = (ctx, size, color) => {
  const r = size / 2 - 1;
  const colors = [color, '#ffffff', '#1f5fbf', GOLD, '#2a9d8f', '#ffffff'];
  for (let k = 0; k < 6; k++) {
    const a = (k * TAU) / 6;
    ctx.fillStyle = colors[k]!;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a + 0.75) * r * 0.75, Math.sin(a + 0.75) * r * 0.75);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = GOLD;
  circlePath(ctx, 0, 0, r * 0.16);
  ctx.fill();
};

// ------------------------------------------------------------------ bubbles (Earth Day, Songkran, Dragon Boat)

/** The globe's ocean: a lit sphere in `color`. */
export const ocean: SpritePainter = (ctx, size, color) => {
  const r = size / 2 - 1;
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.05, 0, 0, r);
  g.addColorStop(0, shade(color, 0.45));
  g.addColorStop(0.6, color);
  g.addColorStop(1, shade(color, -0.25));
  ctx.fillStyle = g;
  circlePath(ctx, 0, 0, r);
  ctx.fill();
};

/** A continent-ish blob built from overlapping lobes; `seed` picks the shape. */
export function landBlob(seed: number): SpritePainter {
  return (ctx, size, color) => {
    const s = size;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const x = (hash(seed * 13 + k) - 0.5) * s * 0.55;
      const y = (hash(seed * 7 + k + 3) - 0.5) * s * 0.65;
      const r = s * (0.12 + 0.12 * hash(seed * 5 + k + 9));
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
    ctx.fill();
    ctx.fillStyle = withAlpha(shade(color, 0.35), 0.55);
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const x = (hash(seed * 13 + k) - 0.5) * s * 0.45;
      const y = (hash(seed * 7 + k + 3) - 0.5) * s * 0.5;
      const r = s * 0.06;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
    ctx.fill();
  };
}

/** Night-side shading and a specular glint laid over the globe (draw source-over on top of it). */
export const sphereShade: SpritePainter = (ctx, size, color) => {
  const r = size / 2 - 1;
  const g = ctx.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.2, -r * 0.1, -r * 0.1, r * 1.25);
  g.addColorStop(0, withAlpha(color, 0));
  g.addColorStop(0.6, withAlpha(color, 0.12));
  g.addColorStop(1, withAlpha(color, 0.6));
  ctx.fillStyle = g;
  circlePath(ctx, 0, 0, r);
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.45);
  ctx.beginPath();
  ctx.ellipse(-r * 0.42, -r * 0.48, r * 0.16, r * 0.08, -0.7, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#ffffff', 0.35);
  ctx.lineWidth = Math.max(1, size * 0.012);
  circlePath(ctx, 0, 0, r - ctx.lineWidth / 2);
  ctx.stroke();
};

/** A fresh green leaf with a midrib, pointing up. */
export const greenLeaf: SpritePainter = (ctx, size, color) => {
  const h = size;
  const w = size * 0.5;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.bezierCurveTo(-w, h * 0.15, -w * 0.6, -h * 0.35, 0, -h / 2);
  ctx.bezierCurveTo(w * 0.6, -h * 0.35, w, h * 0.15, 0, h / 2);
  ctx.closePath();
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, shade(color, 0.2));
  g.addColorStop(1, shade(color, -0.15));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = withAlpha(shade(color, 0.5), 0.7);
  ctx.lineWidth = Math.max(0.6, size * 0.04);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.48);
  ctx.quadraticCurveTo(w * 0.08, 0, 0, -h * 0.4);
  ctx.stroke();
};

/** A water drop pointing along +x (rotate it to the velocity): round head, tapering tail, glint. */
export const waterDrop: SpritePainter = (ctx, size, color) => {
  const s = size;
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, 0);
  ctx.quadraticCurveTo(-s * 0.05, -s * 0.24, s * 0.18, -s * 0.22);
  ctx.arc(s * 0.2, 0, s * 0.22, -Math.PI / 2, Math.PI / 2);
  ctx.quadraticCurveTo(-s * 0.05, s * 0.24, -s * 0.5, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(-s * 0.5, 0, s * 0.42, 0);
  g.addColorStop(0, withAlpha(color, 0.15));
  g.addColorStop(0.6, withAlpha(color, 0.85));
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.85);
  ctx.beginPath();
  ctx.ellipse(s * 0.24, -s * 0.08, s * 0.07, s * 0.04, 0.3, 0, TAU);
  ctx.fill();
};

/** A ripple ring (draw it squashed vertically for a water surface). */
export const rippleRing: SpritePainter = (ctx, size, color) => {
  const r = size / 2 - 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.2, size * 0.025);
  circlePath(ctx, 0, 0, r);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(color, 0.45);
  circlePath(ctx, 0, 0, r * 0.78);
  ctx.stroke();
};

/** A dragon boat heading left: red-and-gold hull with scales, dragon head, curled tail, drum. Width = size. */
export const dragonBoat: SpritePainter = (ctx, size, color) => {
  const s = size;
  const gold = GOLD;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, -s * 0.02);
  ctx.lineTo(s * 0.4, -s * 0.02);
  ctx.quadraticCurveTo(s * 0.44, s * 0.06, s * 0.36, s * 0.07);
  ctx.lineTo(-s * 0.36, s * 0.07);
  ctx.quadraticCurveTo(-s * 0.44, s * 0.06, -s * 0.4, -s * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = gold;
  ctx.lineWidth = Math.max(1, s * 0.008);
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, -s * 0.015);
  ctx.lineTo(s * 0.4, -s * 0.015);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(gold, 0.7);
  ctx.beginPath();
  for (let k = 0; k < 22; k++) {
    const x = -s * 0.36 + k * s * 0.034;
    ctx.moveTo(x + s * 0.016, s * 0.022);
    ctx.arc(x, s * 0.022, s * 0.016, 0, Math.PI);
  }
  ctx.stroke();
  // Head: neck rising at the bow, snout forward, a horn, an eye and a flowing gold mane.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-s * 0.36, 0);
  ctx.quadraticCurveTo(-s * 0.42, -s * 0.06, -s * 0.4, -s * 0.12);
  ctx.quadraticCurveTo(-s * 0.44, -s * 0.15, -s * 0.5, -s * 0.13);
  ctx.lineTo(-s * 0.5, -s * 0.1);
  ctx.quadraticCurveTo(-s * 0.45, -s * 0.09, -s * 0.44, -s * 0.06);
  ctx.quadraticCurveTo(-s * 0.4, -s * 0.02, -s * 0.33, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, -s * 0.13);
  ctx.quadraticCurveTo(-s * 0.36, -s * 0.15, -s * 0.33, -s * 0.11);
  ctx.quadraticCurveTo(-s * 0.36, -s * 0.12, -s * 0.38, -s * 0.07);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  circlePath(ctx, -s * 0.43, -s * 0.125, s * 0.009);
  ctx.fill();
  ctx.fillStyle = INK;
  circlePath(ctx, -s * 0.432, -s * 0.125, s * 0.005);
  ctx.fill();
  // Tail curl at the stern.
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.018;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s * 0.38, 0);
  ctx.quadraticCurveTo(s * 0.47, -s * 0.03, s * 0.45, -s * 0.09);
  ctx.quadraticCurveTo(s * 0.43, -s * 0.12, s * 0.41, -s * 0.09);
  ctx.stroke();
  // Drum in the middle.
  ctx.fillStyle = '#8b1a1a';
  ctx.fillRect(-s * 0.02, -s * 0.06, s * 0.04, s * 0.04);
  ctx.fillStyle = '#f6d7a7';
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.06, s * 0.02, s * 0.006, 0, 0, TAU);
  ctx.fill();
};

// ------------------------------------------------------------------ planes (Father's Day)

/** A folded paper airplane seen from slightly above, nose to the right. */
export const paperPlane: SpritePainter = (ctx, size, color) => {
  const s = size;
  const poly = (pts: readonly number[], fill: string): void => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0]! * s, pts[1]! * s);
    for (let k = 2; k < pts.length; k += 2) ctx.lineTo(pts[k]! * s, pts[k + 1]! * s);
    ctx.closePath();
    ctx.fill();
  };
  poly([0.5, 0.02, -0.45, -0.36, -0.3, 0.02], shade(color, 0.12));
  poly([0.5, 0.02, -0.3, 0.02, -0.42, 0.2], shade(color, -0.12));
  poly([0.5, 0.02, -0.3, 0.02, -0.36, 0.12], shade(color, -0.3));
  poly([0.5, 0.02, -0.45, -0.36, -0.12, -0.12], withAlpha('#ffffff', 0.35));
  ctx.strokeStyle = withAlpha(mixColor(color, INK, 0.5), 0.35);
  ctx.lineWidth = Math.max(0.6, s * 0.018);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(s * 0.5, s * 0.02);
  ctx.lineTo(-s * 0.45, -s * 0.36);
  ctx.lineTo(-s * 0.3, s * 0.02);
  ctx.lineTo(-s * 0.42, s * 0.2);
  ctx.closePath();
  ctx.moveTo(s * 0.5, s * 0.02);
  ctx.lineTo(-s * 0.3, s * 0.02);
  ctx.stroke();
};
