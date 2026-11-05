/**
 * art.ts — baskets, stack pieces and the basket's face, painted once per (kind, size, colour) into
 * small offscreen canvases (DPR-scaled) and blitted every frame. The face is the only thing drawn
 * live: two eyes that follow the nearest treat, a mouth that goes "o" when one is about to land,
 * a grin after a catch and surprised brows when a sleepy cloud boings off.
 */
import { shade, withAlpha } from '../../effects/painters';
import { circlePath, roundRectPath } from '../../effects/painters/shapes';
import type { BasketKind, PieceKind } from './skins';

const TAU = Math.PI * 2;
const INK = '#1f1a3d';
type Ctx2D = CanvasRenderingContext2D;

export interface Raster {
  readonly img: HTMLCanvasElement;
  /** Drawn size in CSS px and the anchor (bottom-centre for baskets, top-left for pieces) inside it. */
  readonly w: number;
  readonly h: number;
  readonly ax: number;
  readonly ay: number;
}

/** Small LRU-ish cache of rasters keyed by string. */
export class RasterCache {
  private map = new Map<string, Raster>();
  constructor(private scale: number, private readonly cap = 96) {}

  setScale(s: number): void {
    if (s === this.scale) return;
    this.scale = s;
    this.map.clear();
  }

  get(key: string, w: number, h: number, ax: number, ay: number, paint: (g: Ctx2D) => void): Raster | null {
    const hit = this.map.get(key);
    if (hit) return hit;
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * this.scale));
    c.height = Math.max(1, Math.ceil(h * this.scale));
    const g = c.getContext('2d');
    if (!g) return null;
    g.setTransform(this.scale, 0, 0, this.scale, ax * this.scale, ay * this.scale);
    paint(g);
    const r: Raster = { img: c, w, h, ax, ay };
    if (this.map.size >= this.cap) {
      const first = this.map.keys().next();
      if (!first.done) this.map.delete(first.value);
    }
    this.map.set(key, r);
    return r;
  }
}

// ------------------------------------------------------------------ baskets
// Coordinates: origin at the bottom-centre of the basket body; up is negative y. `w` is the mouth width.

function outline(g: Ctx2D, lw: number): void {
  g.lineJoin = 'round';
  g.lineWidth = lw;
  g.strokeStyle = INK;
  g.stroke();
}

function bodyPath(g: Ctx2D, kind: BasketKind, w: number, h: number): void {
  const top = -h * 0.82;
  g.beginPath();
  switch (kind) {
    case 'sleigh': {
      g.moveTo(-w * 0.5, top);
      g.lineTo(w * 0.42, top);
      g.quadraticCurveTo(w * 0.62, top - h * 0.05, w * 0.6, top - h * 0.32);
      g.quadraticCurveTo(w * 0.72, top - h * 0.2, w * 0.66, top + h * 0.2);
      g.quadraticCurveTo(w * 0.56, -h * 0.12, w * 0.3, -h * 0.12);
      g.lineTo(-w * 0.38, -h * 0.12);
      g.quadraticCurveTo(-w * 0.52, -h * 0.14, -w * 0.5, top);
      break;
    }
    case 'pail': {
      g.moveTo(-w * 0.5, top);
      g.bezierCurveTo(-w * 0.62, -h * 0.3, -w * 0.4, -h * 0.02, 0, 0);
      g.bezierCurveTo(w * 0.4, -h * 0.02, w * 0.62, -h * 0.3, w * 0.5, top);
      break;
    }
    case 'pouch': {
      g.moveTo(-w * 0.44, top);
      g.bezierCurveTo(-w * 0.66, -h * 0.4, -w * 0.46, 0, 0, 0);
      g.bezierCurveTo(w * 0.46, 0, w * 0.66, -h * 0.4, w * 0.44, top);
      break;
    }
    case 'bowl': {
      g.moveTo(-w * 0.52, top);
      g.bezierCurveTo(-w * 0.5, -h * 0.25, -w * 0.3, -h * 0.08, -w * 0.16, -h * 0.08);
      g.lineTo(-w * 0.2, 0);
      g.lineTo(w * 0.2, 0);
      g.lineTo(w * 0.16, -h * 0.08);
      g.bezierCurveTo(w * 0.3, -h * 0.08, w * 0.5, -h * 0.25, w * 0.52, top);
      break;
    }
    default: {
      g.moveTo(-w * 0.5, top);
      g.lineTo(-w * 0.4, -h * 0.06);
      g.quadraticCurveTo(-w * 0.39, 0, -w * 0.33, 0);
      g.lineTo(w * 0.33, 0);
      g.quadraticCurveTo(w * 0.39, 0, w * 0.4, -h * 0.06);
      g.lineTo(w * 0.5, top);
    }
  }
  g.closePath();
}

/** Inside of the basket and its handle: drawn behind the pile. */
export function paintBasketBack(g: Ctx2D, kind: BasketKind, w: number, h: number, color: string): void {
  const top = -h * 0.82;
  const lw = Math.max(2.5, w * 0.022);
  if (kind === 'basket' || kind === 'pail') {
    g.beginPath();
    g.moveTo(-w * 0.42, top);
    g.bezierCurveTo(-w * 0.42, top - h * 0.95, w * 0.42, top - h * 0.95, w * 0.42, top);
    g.lineCap = 'round';
    g.lineWidth = w * 0.075;
    g.strokeStyle = INK;
    g.stroke();
    g.lineWidth = w * 0.045;
    g.strokeStyle = kind === 'pail' ? '#2b2b2b' : shade(color, -0.1);
    g.stroke();
  }
  if (kind === 'pouch') {
    // Gathered silk above the drawstring.
    g.beginPath();
    g.moveTo(-w * 0.44, top);
    g.quadraticCurveTo(-w * 0.52, top - h * 0.28, -w * 0.3, top - h * 0.22);
    g.quadraticCurveTo(0, top - h * 0.34, w * 0.3, top - h * 0.22);
    g.quadraticCurveTo(w * 0.52, top - h * 0.28, w * 0.44, top);
    g.closePath();
    g.fillStyle = shade(color, -0.12);
    g.fill();
    outline(g, lw);
  }
  g.beginPath();
  g.ellipse(0, top, w * 0.48, h * 0.16, 0, 0, TAU);
  g.fillStyle = shade(color, -0.55);
  g.fill();
  outline(g, lw);
}

/** Front of the basket: body, weave/trim, rim. The face is drawn live on top. */
export function paintBasketFront(g: Ctx2D, kind: BasketKind, w: number, h: number, color: string): void {
  const top = -h * 0.82;
  const lw = Math.max(2.5, w * 0.022);
  if (kind === 'sleigh') {
    // Runners first, so the body overlaps them.
    g.beginPath();
    g.moveTo(-w * 0.46, h * 0.02);
    g.lineTo(w * 0.5, h * 0.02);
    g.quadraticCurveTo(w * 0.7, h * 0.02, w * 0.68, -h * 0.18);
    g.lineCap = 'round';
    g.lineWidth = w * 0.06;
    g.strokeStyle = INK;
    g.stroke();
    g.lineWidth = w * 0.032;
    g.strokeStyle = '#ffd166';
    g.stroke();
    for (const x of [-0.3, 0.25]) {
      g.fillStyle = INK;
      g.fillRect(x * w - w * 0.02, -h * 0.14, w * 0.04, h * 0.16);
    }
  }
  bodyPath(g, kind, w, h);
  const grad = g.createLinearGradient(0, top, 0, 0);
  grad.addColorStop(0, shade(color, 0.18));
  grad.addColorStop(1, shade(color, -0.2));
  g.fillStyle = grad;
  g.fill();
  g.save();
  bodyPath(g, kind, w, h);
  g.clip();
  if (kind === 'basket') {
    g.strokeStyle = withAlpha(shade(color, -0.4), 0.45);
    g.lineWidth = Math.max(1.5, h * 0.05);
    for (let y = top + h * 0.16; y < 0; y += h * 0.17) {
      g.beginPath();
      for (let x = -w * 0.6; x <= w * 0.6; x += w * 0.08) {
        const yy = y + ((Math.round((x + w) / (w * 0.08)) % 2) ? h * 0.025 : -h * 0.025);
        if (x === -w * 0.6) g.moveTo(x, yy);
        else g.lineTo(x, yy);
      }
      g.stroke();
    }
    g.fillStyle = withAlpha('#ffffff', 0.12);
    for (let x = -w * 0.6; x <= w * 0.6; x += w * 0.16) g.fillRect(x, top, w * 0.06, h);
  } else if (kind === 'sleigh') {
    g.strokeStyle = '#ffd166';
    g.lineWidth = Math.max(2, h * 0.05);
    g.beginPath();
    g.moveTo(-w * 0.5, top + h * 0.14);
    g.lineTo(w * 0.62, top + h * 0.14);
    g.stroke();
    g.fillStyle = withAlpha('#ffd166', 0.9);
    for (let x = -0.36; x < 0.5; x += 0.2) {
      circlePath(g, x * w, -h * 0.24, h * 0.035);
      g.fill();
    }
  } else if (kind === 'pail') {
    g.strokeStyle = withAlpha(shade(color, -0.4), 0.5);
    g.lineWidth = Math.max(1.5, w * 0.012);
    for (const x of [-0.28, 0, 0.28]) {
      g.beginPath();
      g.moveTo(x * w, top);
      g.quadraticCurveTo(x * w * 1.2, -h * 0.4, x * w * 0.8, 0);
      g.stroke();
    }
  } else if (kind === 'pouch') {
    g.fillStyle = withAlpha('#ffd166', 0.55);
    for (let i = 0; i < 7; i++) {
      const x = ((i % 4) - 1.5) * w * 0.22 + (i >= 4 ? w * 0.11 : 0);
      const y = i >= 4 ? -h * 0.2 : -h * 0.44;
      circlePath(g, x, y, h * 0.06);
      g.fill();
    }
  } else if (kind === 'bowl') {
    g.strokeStyle = withAlpha('#ffffff', 0.5);
    g.lineWidth = Math.max(1.5, h * 0.04);
    g.beginPath();
    g.moveTo(-w * 0.6, top + h * 0.22);
    for (let x = -0.6; x <= 0.6; x += 0.06) g.lineTo(x * w, top + h * 0.22 + (Math.round(x / 0.06) % 2 ? h * 0.05 : -h * 0.02));
    g.stroke();
  }
  // Soft highlight down the left side.
  g.fillStyle = withAlpha('#ffffff', 0.18);
  g.beginPath();
  g.ellipse(-w * 0.32, top + h * 0.38, w * 0.05, h * 0.26, 0.15, 0, TAU);
  g.fill();
  g.restore();
  bodyPath(g, kind, w, h);
  outline(g, lw);
  // Rim.
  if (kind !== 'pouch') {
    roundRectPath(g, -w * 0.53, top - h * 0.08, w * 1.06, h * 0.16, h * 0.08);
    g.fillStyle = kind === 'sleigh' ? '#ffd166' : kind === 'pail' ? '#2b2b2b' : shade(color, 0.12);
    g.fill();
    outline(g, lw);
  } else {
    g.beginPath();
    g.moveTo(-w * 0.46, top);
    g.quadraticCurveTo(0, top + h * 0.08, w * 0.46, top);
    g.lineWidth = h * 0.08;
    g.strokeStyle = '#ffd166';
    g.stroke();
    circlePath(g, w * 0.3, top + h * 0.12, h * 0.07);
    g.fillStyle = '#ffd166';
    g.fill();
    outline(g, lw * 0.7);
  }
}

/** Basket raster sizes: generous room above for the handle. */
export function basketBox(w: number, h: number): { bw: number; bh: number; ax: number; ay: number } {
  const bw = w * 1.5;
  const bh = h * 2.3;
  return { bw, bh, ax: bw / 2, ay: h * 0.2 + h * 1.95 };
}

export interface FaceState {
  readonly look: number;
  readonly expecting: number;
  readonly happy: number;
  readonly surprised: number;
  /** 0..1 eyelid, 1 = closed. */
  readonly blink: number;
}

/** The basket's face, drawn live (centre at x, y; s = basket width). */
export function drawFace(g: Ctx2D, x: number, y: number, s: number, f: FaceState, dark: boolean): void {
  const ink = dark ? '#1a0b2e' : INK;
  const eyeR = s * 0.055;
  const gap = s * 0.13;
  const lx = f.look * eyeR * 0.45;
  for (const side of [-1, 1]) {
    const ex = x + side * gap;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.ellipse(ex, y, eyeR, eyeR * (1.15 + f.surprised * 0.2) * (1 - f.blink * 0.9), 0, 0, TAU);
    g.fill();
    g.lineWidth = Math.max(1.5, s * 0.012);
    g.strokeStyle = ink;
    g.stroke();
    if (f.blink < 0.6) {
      g.fillStyle = ink;
      circlePath(g, ex + lx, y + eyeR * 0.15 - f.happy * eyeR * 0.1, eyeR * 0.55);
      g.fill();
      g.fillStyle = '#ffffff';
      circlePath(g, ex + lx - eyeR * 0.2, y - eyeR * 0.15, eyeR * 0.18);
      g.fill();
    }
    if (f.surprised > 0.05) {
      g.beginPath();
      g.moveTo(ex - eyeR, y - eyeR * 1.9 - f.surprised * eyeR * 0.4);
      g.quadraticCurveTo(ex, y - eyeR * 2.4 - f.surprised * eyeR * 0.5, ex + eyeR, y - eyeR * 1.9 - f.surprised * eyeR * 0.4);
      g.lineCap = 'round';
      g.lineWidth = Math.max(1.5, s * 0.014);
      g.stroke();
    }
  }
  // Cheeks.
  g.fillStyle = withAlpha('#ff6b8b', 0.45);
  for (const side of [-1, 1]) {
    g.beginPath();
    g.ellipse(x + side * gap * 1.65, y + eyeR * 1.2, eyeR * 0.7, eyeR * 0.45, 0, 0, TAU);
    g.fill();
  }
  // Mouth: "o" when something is about to land, a big grin after a catch, a little smile otherwise.
  const my = y + eyeR * 1.9;
  g.strokeStyle = ink;
  g.fillStyle = ink;
  g.lineCap = 'round';
  g.lineWidth = Math.max(1.5, s * 0.016);
  const o = Math.max(f.expecting, f.surprised);
  if (f.happy > 0.15) {
    g.beginPath();
    g.moveTo(x - eyeR * 1.3, my - eyeR * 0.2);
    g.quadraticCurveTo(x, my + eyeR * 1.8 * Math.min(1, f.happy + 0.3), x + eyeR * 1.3, my - eyeR * 0.2);
    g.closePath();
    g.fill();
    g.fillStyle = '#ff6b8b';
    g.beginPath();
    g.ellipse(x, my + eyeR * 0.55, eyeR * 0.5, eyeR * 0.28, 0, 0, TAU);
    g.fill();
  } else if (o > 0.25) {
    g.beginPath();
    g.ellipse(x, my + eyeR * 0.2, eyeR * (0.35 + o * 0.25), eyeR * (0.4 + o * 0.45), 0, 0, TAU);
    g.fill();
  } else {
    g.beginPath();
    g.arc(x, my - eyeR * 0.4, eyeR * 0.9, 0.2 * Math.PI, 0.8 * Math.PI);
    g.stroke();
  }
}

// ------------------------------------------------------------------ stack pieces
// Painted at (0, 0) = top-left, size w × h; a little room is left around for the outline.

export const PIECE_PAD = 4;

export function paintPiece(g: Ctx2D, kind: PieceKind, w: number, h: number, color: string): void {
  const lw = Math.max(2, Math.min(3, h * 0.08));
  const r = Math.min(h * 0.3, 12);
  const body = (rad = r): void => roundRectPath(g, 0, 0, w, h, rad);
  const fill = (c: string): void => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, shade(c, 0.18));
    grad.addColorStop(1, shade(c, -0.16));
    g.fillStyle = grad;
    g.fill();
  };
  const stroke = (): void => { g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); };
  switch (kind) {
    case 'present': {
      body(6); fill(color); stroke();
      const rib = /ffd166|ffb703|f4c430/i.test(color) ? '#ff4d5e' : '#ffd166';
      g.fillStyle = rib;
      g.fillRect(w / 2 - h * 0.12, lw / 2, h * 0.24, h - lw);
      g.fillRect(lw / 2, h * 0.38, w - lw, h * 0.2);
      g.fillStyle = withAlpha('#ffffff', 0.25);
      g.fillRect(lw, lw, w - 2 * lw, h * 0.14);
      break;
    }
    case 'mooncake': {
      body(h * 0.4); fill(color); stroke();
      g.strokeStyle = withAlpha(shade(color, -0.4), 0.7);
      g.lineWidth = Math.max(1, lw * 0.6);
      for (let x = w * 0.12; x < w * 0.9; x += w * 0.13) {
        g.beginPath();
        g.ellipse(x + w * 0.05, h * 0.5, w * 0.035, h * 0.22, 0, 0, TAU);
        g.stroke();
      }
      g.fillStyle = withAlpha('#ffffff', 0.25);
      g.fillRect(h * 0.4, h * 0.12, w - h * 0.8, h * 0.1);
      break;
    }
    case 'latke': {
      g.beginPath();
      const n = 22;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = t * w;
        const y = (i % 2 ? 0.06 : -0.02) * h;
        if (i === 0) g.moveTo(0, h * 0.4);
        g.lineTo(x, y + h * 0.05);
      }
      g.lineTo(w, h * 0.6);
      for (let i = n; i >= 0; i--) g.lineTo((i / n) * w, h * (i % 2 ? 0.96 : 1.02));
      g.closePath();
      fill(color);
      stroke();
      g.fillStyle = withAlpha('#7a4a14', 0.35);
      for (let i = 0; i < 9; i++) {
        circlePath(g, ((i * 37) % 97) / 97 * w * 0.9 + w * 0.05, h * (0.3 + ((i * 13) % 5) / 10), h * 0.07);
        g.fill();
      }
      break;
    }
    case 'book': {
      body(4); g.fillStyle = '#fff8e6'; g.fill(); stroke();
      roundRectPath(g, 0, 0, w, h * 0.3, 4); fill(color); stroke();
      roundRectPath(g, 0, h * 0.7, w, h * 0.3, 4); fill(color); stroke();
      g.strokeStyle = withAlpha('#c9b98f', 0.9);
      g.lineWidth = 1;
      for (let y = h * 0.38; y < h * 0.66; y += 3) { g.beginPath(); g.moveTo(w * 0.04, y); g.lineTo(w * 0.96, y); g.stroke(); }
      g.fillStyle = '#ffd166';
      g.fillRect(w * 0.1, h * 0.08, w * 0.18, h * 0.12);
      break;
    }
    case 'pie': {
      g.beginPath();
      g.moveTo(w * 0.06, h * 0.25);
      g.lineTo(w * 0.94, h * 0.25);
      g.lineTo(w * 0.86, h);
      g.lineTo(w * 0.14, h);
      g.closePath();
      g.fillStyle = '#d9d9e3';
      g.fill();
      stroke();
      roundRectPath(g, 0, 0, w, h * 0.42, h * 0.2);
      g.fillStyle = '#e9b26b';
      g.fill();
      stroke();
      g.fillStyle = color;
      for (let x = w * 0.12; x < w * 0.9; x += w * 0.16) { circlePath(g, x + w * 0.04, h * 0.21, h * 0.08); g.fill(); }
      break;
    }
    case 'cake': {
      // A layer cake: sponge, a cream stripe, and pastel icing with drips. Everything stays inside
      // the piece's box (no cherry on top) so stacked layers sit flush with no floating bits.
      const sponge = '#f3c98b';
      body(8); fill(sponge); stroke();
      g.save(); body(8); g.clip();
      g.fillStyle = '#fff8ec';
      g.fillRect(0, h * 0.6, w, h * 0.12);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(w, 0);
      g.lineTo(w, h * 0.3);
      const drips = Math.max(4, Math.round(w / 34));
      for (let i = drips; i > 0; i--) {
        const x1 = (i / drips) * w;
        const x0 = ((i - 1) / drips) * w;
        const deep = i % 2 ? 0.5 : 0.4;
        g.quadraticCurveTo((x0 + x1) / 2, h * (deep + 0.06), x0, h * 0.3);
      }
      g.closePath();
      fill(color);
      g.fillStyle = withAlpha('#ffffff', 0.35);
      g.fillRect(w * 0.06, h * 0.08, w * 0.88, h * 0.07);
      const dots = ['#ff4d5e', '#5b8def', '#ffd166', '#2a9d8f'];
      for (let i = 0; i < Math.round(w / 18); i++) {
        g.fillStyle = dots[i % dots.length]!;
        const x = ((i * 53) % 97) / 97 * w * 0.86 + w * 0.07;
        const y = h * (0.16 + ((i * 7) % 3) * 0.04);
        roundRectPath(g, x - 3, y - 1.2, 6, 2.4, 1.2);
        g.fill();
      }
      g.restore();
      body(8); stroke();
      break;
    }
    case 'bar': {
      g.beginPath();
      g.moveTo(w * 0.08, 0); g.lineTo(w * 0.92, 0); g.lineTo(w, h); g.lineTo(0, h); g.closePath();
      fill(color); stroke();
      g.strokeStyle = withAlpha(shade(color, -0.4), 0.6);
      g.lineWidth = Math.max(1, lw * 0.6);
      for (let x = w * 0.25; x < w; x += w * 0.25) { g.beginPath(); g.moveTo(x, h * 0.15); g.lineTo(x, h * 0.85); g.stroke(); }
      g.fillStyle = withAlpha('#ffffff', 0.35);
      g.fillRect(w * 0.12, h * 0.14, w * 0.76, h * 0.12);
      break;
    }
    case 'pancake': {
      body(h * 0.5); fill(color); stroke();
      g.fillStyle = withAlpha('#ffe8b0', 0.8);
      g.fillRect(h * 0.4, h * 0.18, w - h * 0.8, h * 0.18);
      break;
    }
    case 'macaron': {
      roundRectPath(g, 0, 0, w, h * 0.42, h * 0.21); fill(color); stroke();
      roundRectPath(g, 0, h * 0.58, w, h * 0.42, h * 0.21); fill(color); stroke();
      g.fillStyle = '#fff8ec';
      g.fillRect(w * 0.06, h * 0.42, w * 0.88, h * 0.16);
      g.strokeStyle = INK; g.lineWidth = Math.max(1, lw * 0.6);
      g.strokeRect(w * 0.06, h * 0.42, w * 0.88, h * 0.16);
      break;
    }
  }
}
