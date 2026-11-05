/**
 * types.ts — the shape of a picture book. Books are plain typed data (books/<holidayId>.ts), linted by
 * test/play-story.test.ts: 6–8 pages, 1–2 sentences a page, every sentence ≤ 180 characters with the
 * longest names, no URLs, every camera inside the artboard.
 *
 * Text templates: `{name}` is the child's optional first name (Progress.name); without one the book says
 * "our hero" (capitalized at the start of a sentence). `{friend}` is a first name the child may type before
 * reading ("Who is coming with you?"); a page that uses it carries `solo`, the same page for reading alone.
 */
import type { HolidayId } from '../../content/types';

/** Scene artboard (ART_BRIEF): every layer of every scene shares it. */
export const ARTBOARD = { w: 1600, h: 900 } as const;
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;

/**
 * Where a page looks in the holiday's scene, in artboard units: the point the page is about (the snowman,
 * the menorah window) and how close to get. The picture box shows a window of its own shape around that
 * point, at most 1600/zoom wide and 900/zoom tall, slid back inside the artboard when the point is near an
 * edge (camera.ts viewFor), so a box of any shape keeps the subject in view and never shows past the art.
 */
export interface Camera {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export interface StoryPage {
  /** One or two sentences; may use {name} and {friend}. */
  readonly text: string;
  /** Required when `text` uses {friend}: the page when the child reads alone (may use {name}). */
  readonly solo?: string;
  readonly camera: Camera;
  /** The page's thing, shown large while the holiday has no illustrated scene yet. */
  readonly prop: string;
}

/**
 * The book's own moon, drawn behind the scene's back layer (scenes never draw the sky: on the holiday page the
 * moon comes from the effect canvas, which the story does not run). Artboard units; `r` is the disc radius.
 * If a scene ever draws its own moon, drop this from the book.
 */
export interface StoryMoon {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly kind: 'full' | 'crescent';
  /** The Jade Rabbit with its mortar and pestle on the moon's face (Mid-Autumn). */
  readonly rabbit?: boolean;
}

export interface StoryBook {
  readonly id: HolidayId;
  /** Cover title; may use {name}. */
  readonly title: string;
  readonly cover: Camera;
  readonly moon?: StoryMoon;
  readonly pages: readonly StoryPage[];
}

/** What the Fridge keeps for a story (kind 'story'): enough to re-read it, never the text itself. */
export interface StoryKeep {
  readonly bookId: string;
  readonly name?: string;
  readonly friend?: string;
}
