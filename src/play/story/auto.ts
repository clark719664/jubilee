/**
 * auto.ts — a picture book for any holiday without a hand-written one, told from the holiday's own
 * story and facts. The camera visits the scene's real details, so each page looks at something new.
 */
import { sceneDataFor } from '../../art/index';
import type { HolidayContent, HolidayMeta } from '../../content/types';
import { fill } from '../../i18n/index';
import type { Camera, StoryBook, StoryPage } from './types';

const MAX_PAGES = 8;
const MAX_CHARS = 180;

function sentences(text: string): string[] {
  const out: string[] = [];
  for (const s of text.split(/(?<=[.!?]["'’”]?)(?<!\b(?:Dr|Mr|Mrs|Ms|St|Mt)\.)\s+/)) {
    const line = s.trim();
    if (line.length > 0 && line.length <= MAX_CHARS) out.push(line);
  }
  return out;
}

export function autoBook(meta: HolidayMeta, content: HolidayContent): StoryBook {
  const lines = [...content.story.flatMap(sentences), ...content.facts.flatMap((f) => sentences(f.text))].slice(0, MAX_PAGES);
  const data = sceneDataFor(meta.id);
  const spots = [...data.findables, ...data.hotspots];
  const camera = (i: number): Camera => {
    const s = spots[i * 2 % Math.max(1, spots.length)];
    return s ? { x: s.x, y: s.y, zoom: 1.8 + (i % 3) * 0.3 } : { x: 800, y: 500, zoom: 1 };
  };
  const pages: StoryPage[] = lines.map((text, i) => ({ text, camera: camera(i), prop: meta.emoji }));
  return { id: meta.id, title: fill('{name} and {holiday}', { holiday: meta.name }), cover: { x: 800, y: 560, zoom: 1.25 }, pages };
}
