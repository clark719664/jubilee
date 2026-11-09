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
const worthy = (s: string): boolean => /\p{L}{2}/u.test(s) && !/^[a-z0-9_-]+$/.test(s) && !/^[a-z]+(?:[A-Z][a-z0-9]*)+$/.test(s) && !/^(#|url\(|M\d|\.\/|\/)/.test(s);
const add = (s: string, group: string, marked = false): void => {
  const t = s.trim();
  if (marked ? !/\p{L}{2}/u.test(t) || t.startsWith('#') : !worthy(t)) return;
  // Text two holidays share (an allergen, a language name) loads with every page.
  const had = out.get(t);
  out.set(t, had === undefined || had === group ? group : 'ui');
};

function walk(v: unknown, group: string, key = ''): void {
  if (SKIP_KEYS.has(key)) return;
  if (typeof v === 'string') add(v, group);
  else if (Array.isArray(v)) for (const x of v) walk(x, group, key);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, group, k);
}

/** Every string under a dayNames or sticker key ("Christmas Eve", "Night 2", "Big Hug"), wherever the holiday keeps it. */
function dayNames(v: unknown, under = false): void {
  if (typeof v === 'string') { if (under) add(v, 'ui'); } else if (Array.isArray(v)) v.forEach((x) => dayNames(x, under));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) dayNames(x, under || k === 'dayNames' || k === 'sticker');
}

// Allergen chips show on every recipe, whatever holiday first listed the word.
const allergens = (JSON.parse(readFileSync('docs/tools/i18n/overrides.json', 'utf8')) as { words: string[] }).words;
for (const w of [...allergens, 'eggs']) { add(w, 'ui', true); add(w.charAt(0).toUpperCase() + w.slice(1), 'ui', true); }

for (const m of HOLIDAYS) {
  add(m.name, 'ui');
  add(m.tagline, 'ui');
  dayNames(m);
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
const PHRASE = /\b(?:until|is|are|was|a|an|the|for|of|to|yet|not|you|your|see|next|with|and|or|in|on|at|by|from|it|this|that|has|have|all|only|more|still|again|here|there)\b/;
const NOT_TEXT = /^(?:[a-z-]+(?:[ .:][a-z-]+)*|.*\b(?:px|rgb|var\(|http|svg|\.ts)\b.*|[^\p{L}]*)$/u;
/** Counts, written { one: '…', other: '…' } in the code: English "other" form → "one" form. */
const plurals = new Map<string, string>();
function scan(dir: string): void {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (!/content|art|sw|effects|i18n$/.test(name)) scan(p); continue; }
    if (!p.endsWith('.ts')) continue;
    const src = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/^import .*$/gm, '');
    for (const m of src.matchAll(/\{\s*one:\s*'((?:[^'\\\n]|\\.)+)',\s*other:\s*'((?:[^'\\\n]|\\.)+)'\s*,?\s*\}/g)) {
      plurals.set(m[2]!.replace(/\\'/g, "'"), m[1]!.replace(/\\'/g, "'"));
    }
    // Tables marked visible(...) hold words readers see, even single lowercase ones ("dot", "upper middle").
    for (const m of src.matchAll(/\bvisible\(([\s\S]*?)\)(?:\s*as const)?[;,\n]/g)) {
      for (const w of m[1]!.matchAll(/:\s*'((?:[^'\\\n]|\\.)+)'|[[,(]\s*'((?:[^'\\\n]|\\.)+)'/g)) add((w[1] ?? w[2]!).replace(/\\'/g, "'"), 'ui', true);
    }
    for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)+)'|"((?:[^"\\\n]|\\.)+)"|`((?:[^`\\\n$]|\\.)+)`/g)) {
      const s = (m[1] ?? m[2] ?? m[3] ?? '').replace(/\\(['"`])/g, '$1');
      const wordy = /[A-Z]/.test(s) || /^[{a-z][^ ]* .*[a-z] .*[a-z]/.test(s) || (/\{\w+\}/.test(s) && /\p{L}{2}/u.test(s.replace(/\{\w+\}/g, '')));
      // Lowercase words in a row look like class names, unless they read as a phrase ("window is lit").
      const phrase = /^[a-z][a-z' ]*[a-z][.!?…]?$/.test(s) && / /.test(s) && PHRASE.test(s);
      // Shouted text ("IT'S TODAY!") has no lowercase letter at all.
      const shout = /^[A-Z][A-Z' ]*[A-Z][.!?…]*$/.test(s) && / /.test(s);
      if ((wordy || phrase) && (/[a-z]/.test(s) || shout) && (phrase || !NOT_TEXT.test(s)) && !/[<>=]|^on[A-Z]|\(\)|=>/.test(s)) add(s, 'ui');
    }
  }
}
scan('src');
const html = readFileSync('index.html', 'utf8');
for (const m of html.matchAll(/<title>([^<]+)<\/title>/g)) add(m[1]!.replace(/&amp;/g, '&'), 'ui');
const page = html.replace(/<head>[\s\S]*<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '');
for (const m of page.matchAll(/>([^<>]*[A-Za-z][^<>]*)</g)) add(m[1]!.replace(/&amp;/g, '&').replace(/\s+/g, ' '), 'ui');
for (const m of page.matchAll(/\balt="([^"]+)"/g)) add(m[1]!, 'ui');

const list: { s: string; g: string; one?: string }[] = [...out].map(([s, g]) => ({ s, g }));
for (const [other, one] of plurals) {
  for (const form of [other, one]) {
    const at = list.findIndex((l) => l.s === form);
    if (at >= 0) list.splice(at, 1);
  }
  list.push({ s: other, g: 'ui', one });
}
writeFileSync(process.argv[2]!, JSON.stringify(list));
console.log(`${plurals.size} counts with plural forms`);
const ui = list.filter((l) => l.g === 'ui');
const words = (a: typeof list): number => a.reduce((n, l) => n + l.s.split(/\s+/).length, 0);
console.log(`${list.length} strings, ${words(list)} words; ui ${ui.length} strings, ${words(ui)} words`);
