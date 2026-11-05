/**
 * art/index.ts — the illustrated holiday art: layered hero scenes and die-cut stickers.
 *
 * Scenes live in `scenes/<holidayId>/{back,mid,front}.svg` (any subset; a tier-2 scene may be a single
 * `mid.svg`). Every layer shares one 1600×900 artboard with a transparent sky, so the holiday's CSS sky
 * gradient and the canvas effect show through. The hero stacks them bottom-anchored with
 * `object-fit: cover; object-position: 50% 100%`:
 *
 *   sky gradient → back.svg → mid.svg → effect canvas → front.svg → text scrim + copy
 *
 * so snow falls in front of the houses but behind the snowbank. Layers drift a little with the pointer
 * (parallax, off under reduced motion). Stickers live in `stickers/<holidayId>.svg` (512×512 die-cut
 * illustration with its own white border) and replace the emoji in the sticker book, parade tiles and
 * the celebration peel. Files are bundled by Vite as same-origin assets (CSP `img-src 'self' data:`).
 */
import type { Stage } from '../effects/types';

export type LayerName = 'back' | 'mid' | 'front';

export interface SceneLayer {
  readonly name: LayerName;
  readonly url: string;
  /** Parallax strength 0..1 (back moves least). */
  readonly depth: number;
}

const LAYER_ORDER: readonly LayerName[] = ['back', 'mid', 'front'];
export const PARALLAX: Readonly<Record<LayerName, number>> = { back: 0.2, mid: 0.5, front: 1 };

const sceneFiles = import.meta.glob('./scenes/*/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const stickerFiles = import.meta.glob('./stickers/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

const SCENES = new Map<string, SceneLayer[]>();
for (const [path, url] of Object.entries(sceneFiles)) {
  const m = /^\.\/scenes\/([a-z0-9-]+)\/(back|mid|front)\.svg$/.exec(path);
  if (!m) continue;
  const id = m[1]!;
  const name = m[2] as LayerName;
  const list = SCENES.get(id) ?? [];
  list.push({ name, url, depth: PARALLAX[name] });
  SCENES.set(id, list);
}
for (const list of SCENES.values()) list.sort((a, b) => LAYER_ORDER.indexOf(a.name) - LAYER_ORDER.indexOf(b.name));

/**
 * Per-scene interaction data in `scenes/<id>/scene.json`, in 1600×900 artboard units:
 * - `hotspots`: where activities live in the picture (the postbox → Wish Post, the easel → Colour-in…).
 *   Phone-visible hotspots sit inside x 520–1080; the hero falls back to a button row when a scene has none.
 * - `findables`: 5–8 hidden details for Seek & Find, each drawn in mid.svg (never in the effect layer).
 */
export interface Hotspot { readonly activity: string; readonly x: number; readonly y: number; readonly r: number; readonly label: string }
export interface Findable { readonly id: string; readonly label: string; readonly x: number; readonly y: number; readonly r: number }
export interface SceneData {
  readonly hotspots: readonly Hotspot[];
  readonly findables: readonly Findable[];
  /** Where the scene leaves room for its hero effect (a floor patch, its own candles' wicks…); see effects/stage.ts. */
  readonly stage?: Stage;
}

const sceneData = import.meta.glob('./scenes/*/scene.json', { import: 'default', eager: true }) as Record<string, SceneData>;

/** Hotspots and findables for a holiday's scene, or empty lists. */
export function sceneDataFor(id: string): SceneData {
  return sceneData[`./scenes/${id}/scene.json`] ?? { hotspots: [], findables: [] };
}

/** Colouring pages in `colour/<id>.svg`: line art whose fillable regions carry `data-fill` ids. */
const colourFiles = import.meta.glob('./colour/*.svg', { query: '?raw', import: 'default', eager: false }) as Record<string, () => Promise<string>>;

/** Raw SVG source of a holiday's colouring page (bundled, test-checked), or null. Loaded on demand. */
export async function colourPageSource(id: string): Promise<string | null> {
  const load = colourFiles[`./colour/${id}.svg`];
  return load ? load() : null;
}

export function hasColourPage(id: string): boolean {
  return `./colour/${id}.svg` in colourFiles;
}

const worldFiles = import.meta.glob('./world/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

const STICKERS = new Map<string, string>();
for (const [path, url] of Object.entries(stickerFiles)) {
  const m = /^\.\/stickers\/([a-z0-9-]+)\.svg$/.exec(path);
  if (m) STICKERS.set(m[1]!, url);
}

/** Layers for a holiday's hero, back to front, or null when the holiday has no illustrated scene. */
export function sceneFor(id: string): readonly SceneLayer[] | null {
  return SCENES.get(id) ?? null;
}

/** The layers drawn in front of the effect canvas (only `front`). */
export function isForeground(layer: SceneLayer): boolean {
  return layer.name === 'front';
}

/** Illustrated sticker URL, or null (callers fall back to the emoji). */
export function stickerUrl(id: string): string | null {
  return STICKERS.get(id) ?? null;
}

/** World-view art (Santa's sleigh, globe markers, …) by file name without extension, or null. */
export function worldArtUrl(name: string): string | null {
  return worldFiles[`./world/${name}.svg`] ?? null;
}

/** Ids with art, for tests and the grown-ups credits. */
export function illustratedIds(): { readonly scenes: readonly string[]; readonly stickers: readonly string[] } {
  return { scenes: [...SCENES.keys()].sort(), stickers: [...STICKERS.keys()].sort() };
}
