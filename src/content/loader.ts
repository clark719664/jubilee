import { SILLY_CONTENT } from './silly';
import { loadHolidayText } from '../i18n/index';
import type { ContentLoader, HolidayContent, HolidayId } from './types';

/**
 * One lazy Vite chunk per tier-1/2 holiday: `./holidays/<id>.ts` default-exports its HolidayContent.
 * Files whose name starts with `_` (templates, drafts) are excluded by the glob and again below, belt and braces.
 */
const FILES = import.meta.glob<{ default: HolidayContent }>(['./holidays/*.ts', '!./holidays/_*.ts']);

/** './holidays/halloween.ts' → 'halloween'; undefined for anything that is not a plain content file. */
function idFromPath(path: string): HolidayId | undefined {
  const file = path.split('/').pop() ?? '';
  if (!file.endsWith('.ts') || file.startsWith('_')) return undefined;
  return file.slice(0, -'.ts'.length);
}

function build(): Record<HolidayId, ContentLoader> {
  const loaders: Record<HolidayId, ContentLoader> = {};
  // Silly days are tiny and ship inline; a real file for the same id (if one ever appears) wins below.
  for (const [id, content] of Object.entries(SILLY_CONTENT)) loaders[id] = () => Promise.resolve(content);
  for (const [path, load] of Object.entries(FILES)) {
    const id = idFromPath(path);
    if (id) loaders[id] = () => load().then((m) => m.default);
  }
  return loaders;
}

/** holidayId → loader. Keys are the content files that exist plus the inline silly days. */
export const CONTENT_LOADERS: Record<HolidayId, ContentLoader> = build();

export function hasContent(id: HolidayId): boolean {
  return Object.prototype.hasOwnProperty.call(CONTENT_LOADERS, id);
}

/** Rejects with a readable error for ids without content, so callers can show "coming soon" instead of crashing. */
export function loadContent(id: HolidayId): Promise<HolidayContent> {
  const loader = hasContent(id) ? CONTENT_LOADERS[id] : undefined;
  if (!loader) return Promise.reject(new Error(`No content for holiday "${id}"`));
  return Promise.all([loader(), loadHolidayText(id)]).then(([content]) => content);
}
