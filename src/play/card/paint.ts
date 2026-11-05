/**
 * paint.ts — Canvas 2D painting shared by the editor (background and pen canvases) and the rasteriser
 * (print sheet, saved picture). Every function draws in PANEL UNITS: the caller sets a transform so that
 * one unit maps to however many device pixels it wants. Nothing here touches the DOM.
 */
import { mulberry32 } from '../../effects/rng';
import { contrastRatio } from '../../theme/contrast';
import type { Theme, ThemeId } from '../../theme/themes';
import { THEMES } from '../../theme/themes';
import { PAINT_FILL, painterFor } from './decor';
import { PANEL_H, PANEL_W, type BgId, type Placed, type Stroke } from './model';
import { canvasFont, type Pill, type TextLine } from './text';

type Ctx = CanvasRenderingContext2D;

export const INK = '#1f1a3d';
export const CREAM = '#fffaf0';
const GOLD = '#ffd166';

/** A theme colour dark enough to read on cream paper (the inside of the card). */
export function deepInk(theme: Theme): string {
  for (const c of [theme.accent2, theme.accent, theme.bg1, theme.bg2]) if (/^#[0-9a-f]{6}$/i.test(c) && contrastRatio(c, CREAM) >= 4.5) return c;
  return INK;
}

/** Mixes two #rrggbb colours (k = 0 → a). */
export function mixHex(a: string, b: string, k: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number): number => {
    const x = (pa >> s) & 255;
    const y = (pb >> s) & 255;
    return Math.round(x + (y - x) * k);
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

const lum = (hex: string): number => {
  const v = parseInt(hex.slice(1), 16);
  return (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255;
};

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

function skyGradient(ctx: Ctx, theme: Theme): void {
  // 170° like the app's sky: mostly top → bottom with a slight lean.
  const g = ctx.createLinearGradient(PANEL_W * 0.42, 0, PANEL_W * 0.58, PANEL_H);
  g.addColorStop(0, theme.bg1);
  g.addColorStop(1, theme.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);
}

function glowPool(ctx: Ctx, color: string, x: number, y: number, r: number, a: number): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  const hex = /^#[0-9a-f]{6}$/i.test(color) ? color : GOLD;
  g.addColorStop(0, `${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}`);
  g.addColorStop(1, `${hex}00`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function fourPoint(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function starField(ctx: Ctx, theme: Theme, seed: number, n: number, glow: string): void {
  const rnd = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const x = rnd() * PANEL_W;
    const y = rnd() * PANEL_H * 0.92;
    const big = rnd() < 0.14;
    ctx.globalAlpha = 0.45 + rnd() * 0.55;
    ctx.fillStyle = rnd() < 0.5 ? '#ffffff' : glow;
    if (big) fourPoint(ctx, x, y, 6 + rnd() * 6);
    else { ctx.beginPath(); ctx.arc(x, y, 1.2 + rnd() * 1.8, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  void theme;
}

/** The front background (the scene's own layers, when chosen, are drawn on top by the caller). */
export function paintBackground(ctx: Ctx, bg: BgId, theme: Theme): void {
  ctx.save();
  switch (bg) {
    case 'scene':
      skyGradient(ctx, theme);
      glowPool(ctx, theme.glow, PANEL_W * 0.5, PANEL_H * 0.2, 300, 0.28);
      if (theme.mood === 'night') starField(ctx, theme, 7, 40, theme.glow);
      break;
    case 'sky': {
      skyGradient(ctx, theme);
      glowPool(ctx, theme.glow, PANEL_W * 0.78, PANEL_H * 0.12, 260, 0.35);
      if (theme.mood === 'night') starField(ctx, theme, 11, 90, theme.glow);
      else {
        const rnd = mulberry32(5);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 46; i++) { ctx.globalAlpha = 0.25 + rnd() * 0.35; ctx.beginPath(); ctx.arc(rnd() * PANEL_W, rnd() * PANEL_H, 3 + rnd() * 7, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      // A soft hill of the accent colour along the bottom gives stickers somewhere to stand.
      ctx.fillStyle = mixHex(theme.bg2, '#ffffff', theme.mood === 'night' ? 0.12 : 0.55);
      ctx.beginPath();
      ctx.moveTo(0, PANEL_H);
      ctx.lineTo(0, PANEL_H - 90);
      ctx.bezierCurveTo(PANEL_W * 0.3, PANEL_H - 150, PANEL_W * 0.62, PANEL_H - 60, PANEL_W, PANEL_H - 120);
      ctx.lineTo(PANEL_W, PANEL_H);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'confetti': {
      ctx.fillStyle = theme.mood === 'night' ? theme.bg1 : '#fffaf0';
      ctx.fillRect(0, 0, PANEL_W, PANEL_H);
      const colors = [theme.accent, theme.accent2, theme.glow, '#5b8def', '#2bb673', '#ff8fb8'].filter((c) => /^#[0-9a-f]{6}$/i.test(c) && c.toLowerCase() !== '#ffffff');
      const rnd = mulberry32(23);
      for (let i = 0; i < 150; i++) {
        ctx.save();
        ctx.translate(rnd() * PANEL_W, rnd() * PANEL_H);
        ctx.rotate(rnd() * Math.PI);
        ctx.fillStyle = colors[i % colors.length]!;
        ctx.globalAlpha = 0.85;
        const k = rnd();
        if (k < 0.45) ctx.fillRect(-7, -3.5, 14, 7);
        else if (k < 0.8) { ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.lineWidth = 4; ctx.strokeStyle = ctx.fillStyle; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-3, -8, 2, 0); ctx.quadraticCurveTo(7, 8, 12, 0); ctx.stroke(); }
        ctx.restore();
      }
      break;
    }
    case 'stripes': {
      const a = /^#ffffff$/i.test(theme.accent2) ? theme.accent : theme.accent2;
      const light = mixHex(a, '#ffffff', 0.82);
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, PANEL_W, PANEL_H);
      ctx.fillStyle = mixHex(a, '#ffffff', 0.35);
      ctx.save();
      ctx.translate(PANEL_W / 2, PANEL_H / 2);
      ctx.rotate(-Math.PI / 4);
      for (let x = -900; x < 900; x += 64) ctx.fillRect(x, -900, 30, 1800);
      ctx.restore();
      break;
    }
    case 'stars': {
      const top = mixHex(lum(theme.bg1) < 0.35 ? theme.bg1 : '#141a3a', '#000000', 0.25);
      const g = ctx.createLinearGradient(0, 0, 0, PANEL_H);
      g.addColorStop(0, top);
      g.addColorStop(1, mixHex(lum(theme.bg2) < 0.45 ? theme.bg2 : '#2b2a5c', '#000000', 0.05));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, PANEL_W, PANEL_H);
      glowPool(ctx, theme.glow, PANEL_W * 0.25, PANEL_H * 0.85, 280, 0.25);
      starField(ctx, theme, 31, 160, theme.glow);
      break;
    }
    case 'dots': {
      const base = /^#ffffff$/i.test(theme.accent) ? theme.accent2 : theme.accent;
      ctx.fillStyle = mixHex(base, '#ffffff', 0.15);
      ctx.fillRect(0, 0, PANEL_W, PANEL_H);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.85;
      for (let row = 0; row * 40 < PANEL_H + 40; row++) {
        for (let col = 0; col * 48 < PANEL_W + 48; col++) {
          ctx.beginPath();
          ctx.arc(col * 48 + (row % 2) * 24, row * 40, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'paper':
      paintPaper(ctx, theme, 1);
      break;
  }
  ctx.restore();
}

/** Cream paper with a theme-sky band top and bottom and a dashed stitched border. */
export function paintPaper(ctx: Ctx, theme: Theme, seed: number): void {
  ctx.save();
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);
  const band = (y: number, h: number): void => {
    const g = ctx.createLinearGradient(0, y, PANEL_W, y + h);
    g.addColorStop(0, theme.bg1);
    g.addColorStop(1, theme.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, y, PANEL_W, h);
    const rnd = mulberry32(seed * 97 + y);
    ctx.fillStyle = theme.glow;
    for (let x = 14; x < PANEL_W; x += 26) {
      ctx.globalAlpha = 0.55 + rnd() * 0.4;
      ctx.beginPath();
      ctx.arc(x, y + h / 2, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  band(0, 26);
  band(PANEL_H - 26, 26);
  ctx.strokeStyle = deepInk(theme);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  rr(ctx, 22, 44, PANEL_W - 44, PANEL_H - 88, 18);
  ctx.stroke();
  ctx.restore();
}

/** Scene layers (1600×900, bottom-anchored, covering the panel height, centred). */
export function sceneRect(): { x: number; y: number; w: number; h: number } {
  const h = PANEL_H;
  const w = (1600 / 900) * h;
  return { x: (PANEL_W - w) / 2, y: 0, w, h };
}

export function paintScene(ctx: Ctx, layers: readonly CanvasImageSource[]): void {
  const r = sceneRect();
  for (const img of layers) ctx.drawImage(img, r.x, r.y, r.w, r.h);
}

export function paintStrokes(ctx: Ctx, strokes: readonly Stroke[], live?: Stroke | null): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of live ? [...strokes, live] : strokes) {
    const p = s.p;
    if (p.length < 2) continue;
    ctx.strokeStyle = s.c;
    ctx.fillStyle = s.c;
    ctx.lineWidth = s.w;
    if (p.length <= 4 && Math.hypot((p[2] ?? p[0]!) - p[0]!, (p[3] ?? p[1]!) - p[1]!) < 0.5) {
      ctx.beginPath();
      ctx.arc(p[0]!, p[1]!, s.w / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(p[0]!, p[1]!);
    // Smooth through midpoints so simplified strokes stay round instead of turning into polylines.
    for (let i = 2; i + 3 < p.length; i += 2) {
      const mx = (p[i]! + p[i + 2]!) / 2;
      const my = (p[i + 1]! + p[i + 3]!) / 2;
      ctx.quadraticCurveTo(p[i]!, p[i + 1]!, mx, my);
    }
    ctx.lineTo(p[p.length - 2]!, p[p.length - 1]!);
    ctx.stroke();
  }
  ctx.restore();
}

export interface TextStyle { readonly fill: string; readonly halo: string | null; readonly haloW: number }

/** Colours for each kind of line: front words are die-cut sticker lettering; inside words are ink on paper. */
export function styleFor(role: TextLine['role'], theme: Theme): TextStyle {
  switch (role) {
    case 'name': return { fill: theme.accentInk, halo: null, haloW: 0 };
    case 'greet': return { fill: '#ffffff', halo: INK, haloW: 0.16 };
    case 'roman': return { fill: '#ffffff', halo: INK, haloW: 0.26 };
    case 'to': case 'from': case 'info': return { fill: deepInk(theme), halo: null, haloW: 0 };
    case 'msg': case 'info-say': return { fill: INK, halo: null, haloW: 0 };
    case 'info-title': case 'back': return { fill: '#5a5577', halo: null, haloW: 0 };
  }
}

export function paintPill(ctx: Ctx, pill: Pill, theme: Theme): void {
  ctx.save();
  rr(ctx, pill.x, pill.y + 4, pill.w, pill.h, pill.h / 2);
  ctx.fillStyle = INK;
  ctx.fill();
  rr(ctx, pill.x, pill.y, pill.w, pill.h, pill.h / 2);
  ctx.fillStyle = theme.accent;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
}

/**
 * The ink "die-cut" behind a line of sticker lettering: the text stroked and filled in ink, with every
 * enclosed hole (the counters of a, d, o, 新…) filled solid, so no specks of background show through at
 * any zoom. Painted at the target pixel scale on its own canvas.
 */
function haloCanvas(l: TextLine, lw: number, scale: number, color: string): { c: HTMLCanvasElement; w: number; h: number } | null {
  if (typeof document === 'undefined') return null;
  const m = document.createElement('canvas').getContext('2d');
  if (!m) return null;
  m.font = canvasFont(l.size, l.display);
  const w = m.measureText(l.text).width + lw * 2 + 8;
  const h = l.size * 1.7 + lw * 2;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * scale));
  c.height = Math.max(1, Math.ceil(h * scale));
  const x = c.getContext('2d', { willReadFrequently: true });
  if (!x) return null;
  x.setTransform(scale, 0, 0, scale, 0, 0);
  x.font = canvasFont(l.size, l.display);
  x.direction = l.rtl ? 'rtl' : 'ltr';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.lineJoin = 'round';
  x.lineWidth = lw;
  x.strokeStyle = color;
  x.fillStyle = color;
  x.strokeText(l.text, w / 2, h / 2);
  x.fillText(l.text, w / 2, h / 2);
  fillHoles(x, c.width, c.height, color);
  return { c, w, h };
}

/** Flood-fills the outside from the border; whatever the flood cannot reach is a hole and becomes solid. */
function fillHoles(x: CanvasRenderingContext2D, W: number, H: number, color: string): void {
  let img: ImageData;
  try { img = x.getImageData(0, 0, W, H); } catch { return; }
  const a = img.data;
  const outside = new Uint8Array(W * H);
  const stack: number[] = [];
  const push = (i: number): void => { if (!outside[i] && a[i * 4 + 3]! < 160) { outside[i] = 1; stack.push(i); } };
  for (let i = 0; i < W; i++) { push(i); push((H - 1) * W + i); }
  for (let j = 0; j < H; j++) { push(j * W); push(j * W + W - 1); }
  while (stack.length > 0) {
    const i = stack.pop()!;
    const px = i % W;
    if (px > 0) push(i - 1);
    if (px < W - 1) push(i + 1);
    if (i >= W) push(i - W);
    if (i < W * (H - 1)) push(i + W);
  }
  const v = parseInt(color.slice(1), 16);
  let changed = false;
  for (let i = 0; i < W * H; i++) {
    if (outside[i] || a[i * 4 + 3] === 255) continue;
    a[i * 4] = (v >> 16) & 255; a[i * 4 + 1] = (v >> 8) & 255; a[i * 4 + 2] = v & 255; a[i * 4 + 3] = 255;
    changed = true;
  }
  if (changed) x.putImageData(img, 0, 0);
}

export function paintText(ctx: Ctx, lines: readonly TextLine[], theme: Theme): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const t = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
  const scale = t ? Math.max(0.5, Math.hypot(t.a, t.b)) : 1;
  for (const l of lines) {
    const st = styleFor(l.role, theme);
    ctx.font = canvasFont(l.size, l.display);
    ctx.direction = l.rtl ? 'rtl' : 'ltr';
    if (st.halo) {
      const lw = l.size * st.haloW * 2;
      const halo = haloCanvas(l, lw, scale, st.halo);
      if (halo) {
        // A soft drop under the lettering, like the die-cut stickers, then the ink die-cut itself.
        ctx.globalAlpha = 0.28;
        ctx.drawImage(halo.c, l.x - halo.w / 2, l.y - halo.h / 2 + l.size * 0.08, halo.w, halo.h);
        ctx.globalAlpha = 1;
        ctx.drawImage(halo.c, l.x - halo.w / 2, l.y - halo.h / 2, halo.w, halo.h);
      } else {
        ctx.strokeStyle = st.halo;
        ctx.lineWidth = lw;
        ctx.strokeText(l.text, l.x, l.y);
      }
    }
    ctx.fillStyle = st.fill;
    ctx.fillText(l.text, l.x, l.y);
  }
  ctx.restore();
}

// ───────────────────────────────────────────────────────────── stickers

export interface HolidayArtInfo { readonly emoji: string; readonly theme: ThemeId }

/** A holiday sticker's emoji disc: that holiday's own sky colours, a white die-cut rim, an ink outline. */
export function paintEmojiDisc(ctx: Ctx, size: number, info: HolidayArtInfo, gold: boolean): void {
  const t = THEMES[info.theme];
  const r = size * 0.42;
  ctx.save();
  ctx.fillStyle = 'rgba(31,26,61,.22)';
  ctx.beginPath(); ctx.arc(0, size * 0.035, r + size * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = gold ? GOLD : '#ffffff';
  ctx.beginPath(); ctx.arc(0, 0, r + size * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = size * 0.018;
  ctx.strokeStyle = gold ? '#b8860b' : INK;
  ctx.stroke();
  // A ring in that holiday's own sky colours around a pale centre, so the emoji reads on every theme.
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, t.bg1);
  g.addColorStop(1, t.bg2);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = size * 0.014;
  ctx.strokeStyle = INK;
  ctx.stroke();
  const inner = r * 0.8;
  const pale = /^#[0-9a-f]{6}$/i.test(t.glow) ? mixHex(t.glow, '#ffffff', 0.72) : '#fff8e6';
  const pg = ctx.createRadialGradient(-inner * 0.3, -inner * 0.35, inner * 0.1, 0, 0, inner);
  pg.addColorStop(0, '#ffffff');
  pg.addColorStop(1, pale);
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(0, 0, inner, 0, Math.PI * 2); ctx.fill();
  ctx.font = `${Math.round(size * 0.46)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(info.emoji, 0, size * 0.03);
  ctx.restore();
}

export interface StickerSources {
  /** Illustrated sticker image for a holiday id, when loaded. */
  image(holidayId: string): CanvasImageSource | null;
  info(holidayId: string, emoji: string): HolidayArtInfo;
  earned(holidayId: string): boolean;
}

/**
 * A decoration painted alone on its own square canvas of `px` device pixels. Painters are drawn in
 * isolation because a few cut holes with 'destination-out' (the crescent, papel picado), which would
 * punch through the card if they were painted straight onto it.
 */
export function decorCanvas(name: string, color: string, px: number): HTMLCanvasElement | null {
  const painter = painterFor(name);
  if (!painter || typeof document === 'undefined') return null;
  const side = Math.max(8, Math.min(2048, Math.round(px)));
  const make = (): [HTMLCanvasElement, CanvasRenderingContext2D] | null => {
    const c = document.createElement('canvas');
    c.width = side;
    c.height = side;
    const x = c.getContext('2d');
    return x ? [c, x] : null;
  };
  const art = make();
  const sil = make();
  const out = make();
  if (!art || !sil || !out) return null;
  art[1].setTransform(1, 0, 0, 1, side / 2, side / 2);
  painter(art[1], side * PAINT_FILL, color);
  // Die-cut sticker look (ART_BRIEF): the silhouette grown by a white border, with a soft drop under it,
  // so a red lantern still reads on a red sky.
  const r = Math.max(1.5, side * 0.035);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    sil[1].drawImage(art[0], Math.cos(a) * r, Math.sin(a) * r);
  }
  sil[1].drawImage(art[0], 0, 0);
  sil[1].globalCompositeOperation = 'source-in';
  sil[1].fillStyle = '#ffffff';
  sil[1].fillRect(0, 0, side, side);
  const o = out[1];
  // The drop: the silhouette in ink, faint, a little lower. Painted first, then covered by the border.
  o.drawImage(sil[0], 0, side * 0.02);
  o.globalCompositeOperation = 'source-in';
  o.fillStyle = 'rgba(31,26,61,.2)';
  o.fillRect(0, 0, side, side);
  o.globalCompositeOperation = 'source-over';
  o.drawImage(sil[0], 0, 0);
  o.drawImage(art[0], 0, 0);
  return out[0];
}

/** Paints one placed sticker (centred, rotated, at its box size). `pxPerUnit` sizes decoration rasters. */
export function paintPlaced(ctx: Ctx, p: Placed, src: StickerSources, pxPerUnit = 2): void {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((p.r * Math.PI) / 180);
  if (p.art.t === 'decor') {
    const c = decorCanvas(p.art.p, p.art.c, p.s * pxPerUnit);
    if (c) ctx.drawImage(c, -p.s / 2, -p.s / 2, p.s, p.s);
  } else {
    const img = src.image(p.art.h);
    const gold = src.earned(p.art.h);
    if (img) {
      if (gold) {
        ctx.fillStyle = GOLD;
        ctx.beginPath(); ctx.arc(0, 0, p.s * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.drawImage(img, -p.s * 0.46, -p.s * 0.46, p.s * 0.92, p.s * 0.92);
    } else paintEmojiDisc(ctx, p.s, src.info(p.art.h, p.art.e), gold);
  }
  ctx.restore();
}
