/**
 * books/index.ts — every picture book, keyed by holiday id. Books are small typed data, bundled with the
 * activity (no lazy chunks) so `available()` can answer synchronously and the book opens instantly offline.
 */
import type { StoryBook } from '../types';
import christmas from './christmas';
import dayOfTheDead from './day-of-the-dead';
import diwali from './diwali';
import eidAlFitr from './eid-al-fitr';
import halloween from './halloween';
import hanukkah from './hanukkah';
import holi from './holi';
import kwanzaa from './kwanzaa';
import lunarNewYear from './lunar-new-year';
import midAutumn from './mid-autumn-festival';
import nowruz from './nowruz';
import thanksgiving from './thanksgiving';

export const BOOKS: readonly StoryBook[] = [
  christmas, hanukkah, diwali, eidAlFitr, lunarNewYear, halloween, thanksgiving, holi, dayOfTheDead, kwanzaa, nowruz, midAutumn,
];

const BY_ID = new Map(BOOKS.map((b) => [b.id, b] as const));

export function bookFor(id: string): StoryBook | undefined {
  return BY_ID.get(id);
}
