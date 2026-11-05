/**
 * Lists every line the app can say in Jot's voice, for the recording run (voice/record.py).
 *   npx vite-node docs/tools/voice/collect.ts <lines.json>
 */
import { writeFileSync } from 'node:fs';
import { sceneDataFor } from '../../../src/art/index';
import { loadContent } from '../../../src/content/loader';
import { HOLIDAYS } from '../../../src/content/registry';
import { autoBook } from '../../../src/play/story/auto';
import { bookFor } from '../../../src/play/story/books/index';
import { bookTitle, pageSentences, who } from '../../../src/play/story/text';
import { COPY as SEEK, say, thing } from '../../../src/play/seek/copy';
import { COPY as MONSTER } from '../../../src/play/monster/index';
import { COPY as PEEKABOO } from '../../../src/play/peekaboo/index';
import { COPY as POTION } from '../../../src/play/potion/index';
import { COPY as PUMPKIN } from '../../../src/play/pumpkin/index';
import { COPY as TREATS } from '../../../src/play/treats/index';
import { clipId } from '../../../src/ui/voice';

void SEEK;
const lines = new Set<string>();
const w = who(undefined, undefined);

for (const meta of HOLIDAYS) {
  const content = await loadContent(meta.id);
  const book = bookFor(meta.id) ?? (content ? autoBook(meta, content) : undefined);
  if (book) {
    lines.add(bookTitle(book, w));
    for (const page of book.pages) for (const s of pageSentences(page, w)) lines.add(s);
  }
  for (const f of sceneDataFor(meta.id).findables) lines.add(say('lookFor', { thing: thing(f.label) }));
}

const strings = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : []);
for (const copy of [MONSTER, PEEKABOO, POTION, PUMPKIN, TREATS]) {
  for (const v of Object.values(copy as Record<string, unknown>)) for (const s of strings(v)) if (!s.includes('{') && /\s/.test(s)) lines.add(s);
}

const list = [...lines].map((text) => ({ id: clipId(text), text }));
if (new Set(list.map((l) => l.id)).size !== list.length) throw new Error('clip id collision');
writeFileSync(process.argv[2]!, JSON.stringify(list));
console.log(list.length, 'lines,', list.reduce((n, l) => n + l.text.length, 0), 'characters');
