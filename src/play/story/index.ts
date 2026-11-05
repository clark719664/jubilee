/**
 * Story Time (activity id 'story') — a personalized read-along picture book for twelve big holidays.
 *
 * The child's saved first name stars in the book ("our hero" when there is none) and a friend can come
 * along: a first name typed on the cover, used only while the book is open and kept only if the child
 * puts the story on the Fridge (kind 'story': { bookId, name?, friend? }). Each page pans across the
 * holiday's illustrated scene (or its sticker on the theme sky until the scene is drawn); "Read to me"
 * uses the device's own voice only when tapped. The End offers the Fridge and a printable booklet.
 *
 * Books: books/<holidayId>.ts (typed data, linted by test/play-story.test.ts). View: view.ts.
 */
import './story.css';
import type { Activity } from '../types';
import { autoBook } from './auto';
import { bookFor } from './books/index';
import { COPY } from './copy';
import { mountStory } from './view';

export { BOOKS, bookFor } from './books/index';
export { keepFor, sanitizeKeep } from './text';
export type { StoryBook, StoryKeep } from './types';

export const storyActivity: Activity = {
  id: 'story',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  available: (meta, content) => bookFor(meta.id) !== undefined || autoBook(meta, content).pages.length > 0,
  mount: (env) => mountStory(env, bookFor(env.meta.id) ?? autoBook(env.meta, env.content)),
};
