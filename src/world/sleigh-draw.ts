/**
 * Santa's sleigh and three reindeer as a vector sprite. It is painted once per size into an
 * offscreen canvas, given Jubilee's white die-cut edge and soft shadow, then blitted every
 * frame, mirrored to face the way he flies and tilted a little along the trail. An
 * illustrated version can replace it (`setArt(url)`, the world art `sleigh.svg`), drawn
 * facing left like this one.
 *
 * The artboard is 240 × 112 units, facing left (west, the way Santa mostly flies): the
 * reindeer lead on the left, the sleigh with Santa and his sack is on the right.
 */
import { makeCanvas, stickerize } from './globe-paint';

export const SLEIGH_W = 240;
export const SLEIGH_H = 112;

const FUR = '#8a5532';
const BELLY = '#cf9a66';
const HOOF = '#4a2b18';
const ANTLER = '#f3dfb6';
const GOLD = '#f5c542';
const GOLD_DARK = '#c9921f';
const RED = '#e0303f';
const RED_DARK = '#a3182a';

function ellipse(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number, fill: string): void {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}

function stroke(c: CanvasRenderingContext2D, width: number, color: string, pts: readonly number[]): void {
  c.beginPath();
  c.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i]!, pts[i + 1]!);
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
}

/** One flying reindeer centred on its body at (x, y), facing left, legs stretched in a leap. */
function reindeer(c: CanvasRenderingContext2D, x: number, y: number, rudolph: boolean): void {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // Far legs first, a shade darker.
  stroke(c, 2.6, HOOF, [x - 7, y + 3, x - 15, y + 9, x - 21, y + 8]);
  stroke(c, 2.6, HOOF, [x + 8, y + 3, x + 16, y + 9, x + 22, y + 12]);
  // Tail.
  ellipse(c, x + 13.5, y - 3.5, 3.2, 2.2, -0.5, '#fff6e6');
  // Body and belly.
  ellipse(c, x, y, 13.5, 6.8, -0.06, FUR);
  ellipse(c, x - 1, y + 2.6, 10, 3.6, -0.06, BELLY);
  // Near legs.
  stroke(c, 2.8, FUR, [x - 9, y + 2, x - 17, y + 7, x - 23, y + 4]);
  stroke(c, 2.8, FUR, [x + 6, y + 3, x + 12, y + 11, x + 19, y + 14]);
  for (const [hx, hy] of [[x - 23, y + 4], [x + 19, y + 14], [x - 21, y + 8], [x + 22, y + 12]] as const) ellipse(c, hx, hy, 1.7, 1.5, 0, HOOF);
  // Neck and head.
  stroke(c, 6, FUR, [x - 8, y - 2, x - 13, y - 9]);
  ellipse(c, x - 16.5, y - 11, 6, 4.2, -0.28, FUR);
  ellipse(c, x - 21, y - 9.4, 3, 2.4, -0.2, BELLY);
  // Ear.
  ellipse(c, x - 12.4, y - 14.2, 3, 1.4, -0.9, FUR);
  // Antlers: a main beam with two tines each.
  c.lineWidth = 1.7;
  c.strokeStyle = ANTLER;
  c.beginPath();
  c.moveTo(x - 15, y - 14.4);
  c.quadraticCurveTo(x - 15, y - 21, x - 10.5, y - 25);
  c.moveTo(x - 14.4, y - 19);
  c.lineTo(x - 18.5, y - 22.5);
  c.moveTo(x - 12.6, y - 22.6);
  c.lineTo(x - 14, y - 27);
  c.moveTo(x - 17.6, y - 14.6);
  c.quadraticCurveTo(x - 19.5, y - 20.5, x - 16.5, y - 25.5);
  c.moveTo(x - 18.6, y - 19.6);
  c.lineTo(x - 22.4, y - 21.4);
  c.stroke();
  // Eye.
  ellipse(c, x - 17.8, y - 12.4, 1.1, 1.1, 0, '#2a1a10');
  // Harness with a golden bell.
  c.lineWidth = 1.8;
  c.strokeStyle = RED_DARK;
  c.beginPath();
  c.ellipse(x - 3, y, 2.2, 6.6, -0.06, 0, Math.PI * 2);
  c.stroke();
  ellipse(c, x - 3.4, y + 6.4, 1.9, 1.9, 0, GOLD);
  // Nose.
  if (rudolph) {
    const glow = c.createRadialGradient(x - 23.6, y - 9, 0, x - 23.6, y - 9, 9);
    glow.addColorStop(0, 'rgba(255, 70, 60, 0.75)');
    glow.addColorStop(1, 'rgba(255, 70, 60, 0)');
    c.fillStyle = glow;
    c.fillRect(x - 33, y - 19, 19, 19);
    ellipse(c, x - 23.6, y - 9, 2.6, 2.4, 0, '#ff2e3b');
    ellipse(c, x - 24.3, y - 9.8, 0.8, 0.7, 0, '#ffd0d0');
  } else {
    ellipse(c, x - 23.4, y - 9.2, 1.5, 1.3, 0, '#2a1a10');
  }
}

function present(c: CanvasRenderingContext2D, x: number, y: number, s: number, box: string, ribbon: string): void {
  c.fillStyle = box;
  c.fillRect(x, y, s, s);
  c.fillStyle = ribbon;
  c.fillRect(x + s / 2 - 1, y, 2, s);
  c.fillRect(x, y + s / 2 - 1, s, 2);
  ellipse(c, x + s / 2 - 2, y - 1, 2.2, 1.4, -0.5, ribbon);
  ellipse(c, x + s / 2 + 2, y - 1, 2.2, 1.4, 0.5, ribbon);
}

/** Santa, his sack and the sleigh, with the runner curling up at the front. */
function sleigh(c: CanvasRenderingContext2D): void {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // The sack of presents, peeking over the backrest.
  ellipse(c, 216, 50, 14, 17, 0.15, '#7a4b2a');
  present(c, 204, 28, 10, '#3fb6a8', '#ffe9a3');
  present(c, 215, 23, 11, '#ffd166', RED);
  present(c, 226, 31, 8, '#ff6b9a', '#ffffff');
  ellipse(c, 214, 36, 13, 4, 0.1, '#5e3820');
  // Santa: coat, arm reaching for the reins, mitten.
  ellipse(c, 191, 58, 15, 16, 0, RED);
  ellipse(c, 191, 66, 15, 3, 0, '#2b2f45');
  stroke(c, 7, RED, [184, 52, 171, 57]);
  ellipse(c, 170, 57.5, 3.4, 3.8, 0, '#ffffff');
  ellipse(c, 166.2, 58, 3.4, 3.2, 0, '#2b2f45');
  // Head: face, beard, cheek, eye, nose.
  ellipse(c, 188, 33, 7.6, 7.6, 0, '#f6c7a6');
  c.beginPath();
  c.moveTo(180, 34);
  c.quadraticCurveTo(178.5, 46, 187, 49);
  c.quadraticCurveTo(196, 46, 195.5, 35);
  c.quadraticCurveTo(188, 39, 180, 34);
  c.fillStyle = '#ffffff';
  c.fill();
  ellipse(c, 184.6, 36.6, 3.4, 1.8, 0.2, '#ffffff');
  ellipse(c, 187.6, 33.5, 2, 1.5, 0, 'rgba(255, 120, 120, 0.55)');
  ellipse(c, 183.6, 31.4, 1, 1.1, 0, '#2a1a10');
  ellipse(c, 181.2, 34.4, 1.9, 1.6, 0, '#ee9b84');
  // Hat with a flopping tip and a pom-pom.
  c.beginPath();
  c.moveTo(179.5, 29);
  c.quadraticCurveTo(186, 13, 199, 15);
  c.quadraticCurveTo(205, 16, 206.5, 22);
  c.quadraticCurveTo(201, 19.5, 197, 22);
  c.lineTo(197, 28);
  c.closePath();
  c.fillStyle = RED;
  c.fill();
  ellipse(c, 207, 23.5, 3.6, 3.6, 0, '#ffffff');
  c.beginPath();
  c.roundRect(178, 25.5, 21, 5.4, 2.7);
  c.fillStyle = '#ffffff';
  c.fill();
  // The sleigh body: tall rounded back on the right, low prow on the left.
  const body = c.createLinearGradient(0, 40, 0, 92);
  body.addColorStop(0, RED);
  body.addColorStop(1, RED_DARK);
  c.beginPath();
  c.moveTo(214, 42);
  c.quadraticCurveTo(222, 33, 231, 38);
  c.quadraticCurveTo(238, 43, 235.5, 57);
  c.lineTo(231.5, 82);
  c.quadraticCurveTo(229.5, 90, 219, 90);
  c.lineTo(158, 90);
  c.bezierCurveTo(144, 90, 135.5, 80.5, 138.5, 70.5);
  c.bezierCurveTo(141, 62, 151, 60, 156, 64.5);
  c.quadraticCurveTo(160, 67.5, 165, 66.5);
  c.lineTo(206, 64.5);
  c.quadraticCurveTo(211, 63.5, 211, 56);
  c.closePath();
  c.fillStyle = body;
  c.fill();
  // Gold trim along the top edge and a scroll on the side.
  c.lineWidth = 2.2;
  c.strokeStyle = GOLD;
  c.beginPath();
  c.moveTo(138.5, 70.5);
  c.bezierCurveTo(141, 62, 151, 60, 156, 64.5);
  c.quadraticCurveTo(160, 67.5, 165, 66.5);
  c.lineTo(206, 64.5);
  c.quadraticCurveTo(211, 63.5, 211, 56);
  c.lineTo(214, 42);
  c.quadraticCurveTo(222, 33, 231, 38);
  c.stroke();
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(168, 80);
  c.bezierCurveTo(176, 72, 190, 86, 200, 78);
  c.bezierCurveTo(206, 73, 214, 76, 212, 82);
  c.stroke();
  ellipse(c, 168, 80, 2.2, 2.2, 0, GOLD);
  // Runner with struts, curling up into a spiral at the front.
  c.lineWidth = 3.2;
  c.strokeStyle = GOLD;
  stroke(c, 2.6, GOLD_DARK, [170, 90, 168, 99]);
  stroke(c, 2.6, GOLD_DARK, [221, 90, 223, 99]);
  c.lineWidth = 3.4;
  c.strokeStyle = GOLD;
  c.beginPath();
  c.moveTo(238, 99);
  c.lineTo(152, 99);
  c.bezierCurveTo(136, 99, 127, 91, 128.5, 82.5);
  c.bezierCurveTo(130, 74.5, 140, 74, 141.5, 80);
  c.bezierCurveTo(142.5, 84.5, 137.5, 86, 136, 82.5);
  c.stroke();
}

/** Golden reins from Santa's mitten through every harness to the lead reindeer. */
function reins(c: CanvasRenderingContext2D, deer: readonly (readonly [number, number])[]): void {
  c.lineWidth = 1.4;
  c.strokeStyle = GOLD;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(166, 58);
  let px = 166;
  let py = 58;
  for (let i = deer.length - 1; i >= 0; i--) {
    const [x, y] = deer[i]!;
    const hx = x - 3;
    const hy = y - 2;
    c.quadraticCurveTo((px + hx) / 2, Math.max(py, hy) + 5, hx, hy);
    px = hx;
    py = hy;
  }
  c.stroke();
}

/** Paints the whole sprite in artboard units (the caller scales). */
export function paintSleigh(c: CanvasRenderingContext2D): void {
  const deer: readonly (readonly [number, number])[] = [[34, 49], [76, 56], [117, 62]];
  for (let i = deer.length - 1; i >= 0; i--) reindeer(c, deer[i]![0], deer[i]![1], i === 0);
  reins(c, deer);
  sleigh(c);
  // A little magic dust behind the runner.
  for (const [x, y, r] of [[230, 104, 1.6], [240, 99, 1.2], [234, 92, 0.9]] as const) ellipse(c, x, y, r, r, 0, '#fff4cc');
}

/** The sprite as a sticker, cached per size, with an optional illustrated replacement. */
export class SleighSprite {
  private sticker: HTMLCanvasElement | null = null;
  private key = '';
  private art: HTMLImageElement | null = null;
  private artReady = false;
  private artUrl: string | null = null;

  constructor(private readonly onReady: () => void = () => {}) {}

  /** Swaps in illustrated art (an SVG/PNG URL, facing left); null goes back to the vector sprite. */
  setArt(url: string | null): void {
    if (url === this.artUrl) return;
    this.artUrl = url;
    this.art = null;
    this.artReady = false;
    this.key = '';
    if (!url || typeof Image === 'undefined') return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (this.artUrl !== url) return;
      this.art = img;
      this.artReady = true;
      this.key = '';
      this.onReady();
    };
    img.src = url;
  }

  private build(width: number, dpr: number): HTMLCanvasElement | null {
    const k = (width / SLEIGH_W) * dpr;
    const useArt = this.artReady && this.art !== null;
    const aspect = useArt && this.art!.naturalWidth > 0 ? this.art!.naturalHeight / this.art!.naturalWidth : SLEIGH_H / SLEIGH_W;
    const pw = Math.ceil(width * dpr) + 4;
    const ph = Math.ceil(width * aspect * dpr) + 4;
    const raw = makeCanvas(pw, ph);
    const c = raw?.getContext('2d');
    if (!raw || !c) return null;
    if (useArt) {
      c.drawImage(this.art!, 2, 2, pw - 4, ph - 4);
      return raw;
    }
    c.setTransform(k, 0, 0, k, 2, 2);
    paintSleigh(c);
    return stickerize(raw, Math.max(1.5, 2.2 * dpr * (width / 120)), Math.max(1, 2 * dpr));
  }

  /** Draws it centred at (x, y), `width` CSS px wide, rotated by `angle`, mirrored when `flip`. */
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, angle: number, flip: boolean, dpr: number): void {
    const w = Math.round(width);
    const key = `${w}|${dpr}|${this.artReady ? 'art' : 'vector'}`;
    if (key !== this.key) {
      this.key = key;
      this.sticker = this.build(w, dpr);
    }
    const s = this.sticker;
    if (!s) return;
    const sw = s.width / dpr;
    const sh = s.height / dpr;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(s, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }
}
