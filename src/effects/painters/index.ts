/**
 * painters/index.ts — the built-in sprite painters by name. `createSpriteCache()` registers all of
 * them; presets reference sprites by these names (plus `glyph:<text>` for emoji/text, which the cache
 * registers lazily). Add a painter here when a preset needs a new shape.
 */
import type { SpritePainter } from '../types';
import { batA, batB, frog, goldfish, groundhog, koinobori, turkey } from './creatures';
import {
  balloon, dreidel, eggPattern0, eggPattern1, eggPattern2, eggPattern3, envelope, fanous, lantern,
  leafGinkgo, leafMaple, leafOak, papelPicado, pie, plane,
} from './objects';
import {
  blossom, bubble, circle, cloud, coin, confettiRect, confettiStreamer, crescent, flame, glow, heart,
  marigold, moon, petal, shamrock, snowflake, star, star8,
} from './shapes';

export { mixColor, parseColor, rgba, shade, withAlpha } from './color';
export { circlePath, heartPath, roundRectPath, starPath } from './shapes';

export const PAINTERS: Readonly<Record<string, SpritePainter>> = {
  glow, circle, snowflake, confettiRect, confettiStreamer, heart, star, star8, petal, marigold, blossom,
  bubble, cloud, moon, crescent, flame, coin, shamrock,
  batA, batB, goldfish, frog, turkey, groundhog, koinobori,
  leafMaple, leafOak, leafGinkgo, lantern, fanous, eggPattern0, eggPattern1, eggPattern2, eggPattern3,
  balloon, dreidel, envelope, plane, pie, papelPicado,
};

export const PAINTER_NAMES: readonly string[] = Object.keys(PAINTERS);
