/**
 * raster.ts — paints whole panels of the card into canvases: the editor's background layer, the
 * thumbnails in "My cards", the print sheet and "Save picture". Everything happens on this device:
 * scene layers and illustrated stickers are same-origin SVG files loaded with `Image()`, stickers and
 * strokes are painted from the card's JSON, and the picture is handed to the child as a download link
 * to a local blob. Nothing is uploaded.
 *
 * Panels: 'front', 'inside' (the right-hand page the child writes on), 'info' (the left-hand inside
 * page: what the greeting means and how to say it) and 'back' (a small "Made by …" mark).
 */
import { sceneFor, stickerUrl } from '../../art/index';
import type { Theme, ThemeId } from '../../theme/themes';
import { faceOf, PANEL_H, PANEL_W, type CardSpec } from './model';
import { CREAM, INK, mixHex, paintBackground, paintPaper, paintPill, paintPlaced, paintScene, paintStrokes, paintText, type StickerSources } from './paint';
import { layoutFront, layoutInfo, layoutInside, type InfoCopy, type InsideCopy, type Measure, type TextLine } from './text';

export type PanelKind = 'front' | 'inside' | 'info' | 'back';

export interface CardEnv {
  readonly theme: Theme;
  readonly holidayName: string;
  readonly holidayEmoji: string;
  readonly holidayTheme: ThemeId;
  readonly measure: Measure;
  readonly happy: string;
  readonly inside: InsideCopy;
  readonly info: InfoCopy;
  readonly back: { readonly made: string; readonly app: string };
  /** Emoji + theme for any holiday id (for sticker discs). */
  readonly holidayInfo: (id: string, emoji: string) => { emoji: string; theme: ThemeId };
  readonly earned: (id: string) => boolean;
}

export interface Assets {
  readonly scene: readonly HTMLImageElement[];
  readonly stickers: ReadonlyMap<string, HTMLImageElement>;
}

export const NO_ASSETS: Assets = { scene: [], stickers: new Map() };

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

/** Loads a same-origin image once; resolves null when it is missing or broken. */
export function loadImage(url: string): Promise<HTMLImageElement | null> {
  let p = imageCache.get(url);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
      img.onerror = () => resolve(null);
      img.src = url;
    });
    imageCache.set(url, p);
  }
  return p;
}

/** Scene layers for the card's background (when it is the scene) and illustrated stickers it uses. */
export async function loadAssets(card: CardSpec, extraHolidayIds: readonly string[] = []): Promise<Assets> {
  const layers = card.bg === 'scene' ? sceneFor(card.holidayId) ?? [] : [];
  const scene = (await Promise.all(layers.map((l) => loadImage(l.url)))).filter((i): i is HTMLImageElement => i !== null);
  const ids = new Set<string>([card.holidayId, ...extraHolidayIds]);
  for (const f of [card.front, card.inside]) for (const s of f.stickers) if (s.art.t === 'holiday') ids.add(s.art.h);
  const stickers = new Map<string, HTMLImageElement>();
  await Promise.all([...ids].map(async (id) => {
    const url = stickerUrl(id);
    const img = url ? await loadImage(url) : null;
    if (img) stickers.set(id, img);
  }));
  return { scene, stickers };
}

export function sourcesFor(env: CardEnv, assets: Assets): StickerSources {
  return {
    image: (id) => assets.stickers.get(id) ?? null,
    info: (id, emoji) => env.holidayInfo(id, emoji),
    earned: (id) => env.earned(id),
  };
}

function paintBack(ctx: CanvasRenderingContext2D, card: CardSpec, env: CardEnv, assets: Assets, k: number): void {
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);
  const src = sourcesFor(env, assets);
  paintPlaced(ctx, { id: 'back', art: { t: 'holiday', h: card.holidayId, e: env.holidayEmoji }, x: PANEL_W / 2, y: 520, s: 120, r: 0 }, src, k);
  const lines: TextLine[] = [
    { role: 'back', text: env.back.made, x: PANEL_W / 2, y: 610, size: 22, display: true, rtl: false },
    { role: 'back', text: env.back.app, x: PANEL_W / 2, y: 642, size: 16, display: false, rtl: false },
  ];
  paintText(ctx, lines, env.theme);
}

function paintInfo(ctx: CanvasRenderingContext2D, card: CardSpec, env: CardEnv, assets: Assets, k: number): void {
  paintPaper(ctx, env.theme, 3);
  const src = sourcesFor(env, assets);
  paintPlaced(ctx, { id: 'info', art: { t: 'holiday', h: card.holidayId, e: env.holidayEmoji }, x: PANEL_W / 2, y: 140, s: 150, r: -6 }, src, k);
  paintText(ctx, layoutInfo(card, env.holidayName, env.info, env.measure), env.theme);
}

/**
 * Paints one panel into `ctx`, which must already map panel units to pixels (k pixels per unit).
 * `parts` lets the editor paint only the layers under its live sticker elements.
 */
export function paintPanel(ctx: CanvasRenderingContext2D, kind: PanelKind, card: CardSpec, env: CardEnv, assets: Assets, k: number, parts: { stickers?: boolean; strokes?: boolean } = {}): void {
  const withStickers = parts.stickers ?? true;
  const withStrokes = parts.strokes ?? true;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, PANEL_W, PANEL_H);
  ctx.clip();
  if (kind === 'back') paintBack(ctx, card, env, assets, k);
  else if (kind === 'info') paintInfo(ctx, card, env, assets, k);
  else {
    const face = faceOf(card, kind);
    if (kind === 'front') {
      paintBackground(ctx, card.bg, env.theme);
      if (card.bg === 'scene') paintScene(ctx, assets.scene);
      const lay = layoutFront(card, env.holidayName, env.happy, env.measure);
      if (lay.pill) paintPill(ctx, lay.pill, env.theme);
      paintText(ctx, lay.lines, env.theme);
    } else {
      paintPaper(ctx, env.theme, 2);
      paintText(ctx, layoutInside(card, env.inside, env.measure), env.theme);
    }
    const src = sourcesFor(env, assets);
    if (withStickers) for (const s of face.stickers) paintPlaced(ctx, s, src, k);
    if (withStrokes) paintStrokes(ctx, face.strokes);
  }
  ctx.restore();
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** A whole panel as its own canvas at `k` pixels per unit. */
export function panelCanvas(kind: PanelKind, card: CardSpec, env: CardEnv, assets: Assets, k: number): HTMLCanvasElement {
  const c = makeCanvas(PANEL_W * k, PANEL_H * k);
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.setTransform(k, 0, 0, k, 0, 0);
    paintPanel(ctx, kind, card, env, assets, k);
  }
  return c;
}

/** The open card for "Save picture": front and inside side by side on the holiday's sky. */
export function spreadCanvas(card: CardSpec, env: CardEnv, assets: Assets, k = 2): HTMLCanvasElement {
  const pad = 40;
  const gap = 28;
  const W = pad * 2 + PANEL_W * 2 + gap;
  const H = pad * 2 + PANEL_H;
  const c = makeCanvas(W * k, H * k);
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, env.theme.bg1);
  g.addColorStop(1, env.theme.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (const [i, kind] of (['front', 'inside'] as const).entries()) {
    const x = pad + i * (PANEL_W + gap);
    ctx.fillStyle = mixHex(INK, env.theme.bg1, 0.35);
    ctx.globalAlpha = 0.45;
    ctx.fillRect(x + 8, pad + 10, PANEL_W, PANEL_H);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(x, pad);
    paintPanel(ctx, kind, card, env, assets, k);
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, pad, PANEL_W, PANEL_H);
  }
  return c;
}

function toBlob(c: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      c.toBlob((b) => resolve(b), 'image/png');
    } catch {
      // A tainted canvas (a browser that treats SVG images as cross-origin) throws: retry without art.
      resolve(null);
    }
  });
}

/** Rasterises the open card and hands it to the child as a local download. True when it worked. */
export async function savePicture(card: CardSpec, env: CardEnv, fileName: string): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  if (document.fonts?.ready) await document.fonts.ready.catch(() => undefined);
  const assets = await loadAssets(card);
  let blob = await toBlob(spreadCanvas(card, env, assets));
  if (!blob) blob = await toBlob(spreadCanvas(card, env, NO_ASSETS));
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return true;
}
