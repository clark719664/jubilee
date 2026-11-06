/**
 * Lists every English string a child or parent can see, for translation (i18n/translate.py).
 *   npx vite-node docs/tools/i18n/collect.ts <strings.json>
 * Writes [{ s: text, g: group }]: group "ui" loads at start, "h/<id>" with that holiday.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sceneDataFor } from '../../../src/art/index';
import { loadContent } from '../../../src/content/loader';
import { HOLIDAYS } from '../../../src/content/registry';
import { autoBook } from '../../../src/play/story/auto';
import { bookFor } from '../../../src/play/story/books/index';

const SKIP_KEYS = new Set(['id', 'lang', 'roman', 'sayIt', 'emoji', 'icon', 'unit', 'kind', 'hazards', 'adult', 'adultHelp', 'theme', 'effect', 'tags', 'traditions', 'greeting']);
const out = new Map<string, string>();
const worthy = (s: string): boolean => /\p{L}{2}/u.test(s) && !/^[a-z0-9_-]+$/.test(s) && !/^(#|url\(|M\d|\.\/|\/)/.test(s);
const add = (s: string, group: string): void => {
  const t = s.trim();
  if (!worthy(t)) return;
  if (!out.has(t) || group === 'ui') out.set(t, group);
};

function walk(v: unknown, group: string, key = ''): void {
  if (SKIP_KEYS.has(key)) return;
  if (typeof v === 'string') add(v, group);
  else if (Array.isArray(v)) for (const x of v) walk(x, group, key);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, group, k);
}

for (const m of HOLIDAYS) {
  add(m.name, 'ui');
  add(m.tagline, 'ui');
  const group = `h/${m.id}`;
  const content = await loadContent(m.id);
  const { greetings, ...rest } = content;
  walk(rest, group);
  for (const g of greetings) { add(g.meaning, group); add(g.langName, group); }
  const book = bookFor(m.id) ?? autoBook(m, content);
  add(book.title, group);
  for (const p of book.pages) { add(p.text, group); if (p.solo) add(p.solo, group); }
  const scene = sceneDataFor(m.id);
  for (const f of [...scene.findables, ...scene.hotspots]) add(f.label, group);
}

// Every other visible string lives in code as a quoted literal.
const NOT_TEXT = /^(?:[a-z-]+(?:[ .:][a-z-]+)*|.*\b(?:px|rgb|var\(|http|svg|\.ts)\b.*|[^\p{L}]*)$/u;
function scan(dir: string): void {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (!/content|art|dates|sw|effects$/.test(name)) scan(p); continue; }
    if (!p.endsWith('.ts')) continue;
    const src = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/^import .*$/gm, '');
    for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)+)'|"((?:[^"\\\n]|\\.)+)"|`((?:[^`\\\n$]|\\.)+)`/g)) {
      const s = (m[1] ?? m[2] ?? m[3] ?? '').replace(/\\(['"`])/g, '$1');
      if ((/[A-Z]/.test(s) || /^[{a-z][^ ]* .*[a-z] .*[a-z]/.test(s)) && /[a-z]/.test(s) && !NOT_TEXT.test(s) && !/[<>=]|^on[A-Z]|\(\)|=>/.test(s)) add(s, 'ui');
    }
  }
}
scan('src');
const page = readFileSync('index.html', 'utf8').replace(/<head>[\s\S]*<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '');
for (const m of page.matchAll(/>([^<>]*[A-Za-z][^<>]*)</g)) add(m[1]!.replace(/&amp;/g, '&').replace(/\s+/g, ' '), 'ui');
for (const m of page.matchAll(/\balt="([^"]+)"/g)) add(m[1]!, 'ui');

const list = [...out].map(([s, g]) => ({ s, g }));
writeFileSync(process.argv[2]!, JSON.stringify(list));
const ui = list.filter((l) => l.g === 'ui');
const words = (a: typeof list): number => a.reduce((n, l) => n + l.s.split(/\s+/).length, 0);
console.log(`${list.length} strings, ${words(list)} words; ui ${ui.length} strings, ${words(ui)} words`);
