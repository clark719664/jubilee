import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The page translates text it can find in its dictionary, which is built from string literals in the code. Text
 * built with template literals, concatenation or an English singular/plural choice never gets there, so it stays
 * English in every language. These checks keep such text out of the code (src/art, src/i18n and the generated
 * service worker in src/sw excepted).
 */
function files(dir = 'src'): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return ['art', 'i18n', 'sw'].includes(name) ? [] : files(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}

/** Source without comments, line breaks kept so positions still map to lines. */
const source = (p: string): string => readFileSync(p, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`\\/])\/\/[^\n]*/g, '$1');

/** Every template literal's fixed text (each ${…} becomes ␀), nested ones included, with where it starts. */
function templates(src: string): { text: string; at: number }[] {
  const out: { text: string; at: number }[] = [];
  type Frame = { kind: 'tpl'; text: string; at: number } | { kind: 'expr'; depth: number };
  const stack: Frame[] = [];
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    const top = stack[stack.length - 1];
    if (top?.kind === 'tpl') {
      if (ch === '\\') { top.text += src.slice(i, i + 2); i++; } else if (ch === '`') { out.push({ text: top.text, at: top.at }); stack.pop(); } else if (ch === '$' && src[i + 1] === '{') { top.text += '␀'; stack.push({ kind: 'expr', depth: 0 }); i++; } else top.text += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== ch && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      i = j;
    } else if (ch === '/' && /[=(,:!&|?{};[]\s*$/.test(src.slice(Math.max(0, i - 8), i)) && src[i + 1] !== '/') {
      // A regular expression literal: skip it, so quotes and backticks inside it are not read as strings.
      let j = i + 1;
      let inClass = false;
      while (j < src.length && src[j] !== '\n' && (inClass || src[j] !== '/')) { if (src[j] === '\\') j++; else if (src[j] === '[') inClass = true; else if (src[j] === ']') inClass = false; j++; }
      i = j;
    } else if (ch === '`') stack.push({ kind: 'tpl', text: '', at: i });
    else if (top?.kind === 'expr') {
      if (ch === '{') top.depth++;
      else if (ch === '}') { if (top.depth === 0) stack.pop(); else top.depth--; }
    }
  }
  return out;
}

const lineOf = (src: string, at: number): number => src.slice(0, at).split('\n').length;
/** Short words that only appear in sentences, never in class names, CSS or ids. */
const PROSE = /\b(the|and|of|to|for|with|from|you|your|my|this|that|not|yet|more|until|ago|soon|tonight|today|tomorrow|are|was|has|have|its|it|is|on|in|at|by|an|a|or|now|here|there|all|only|again|please|try|tap|press)\b/i;
const NOT_TEXT = /color-mix|gradient\(|\bpx\b|\bvar\(--|^\s*[.#[]|\b(?:left|top|width|height):|\bwght\b|^M[\d␀ ]/;

describe('no English built in code', () => {
  it('never picks an English singular or plural with a ternary; counts use plural()', () => {
    const hits: string[] = [];
    for (const p of files()) {
      source(p).split('\n').forEach((line, i) => {
        if (/\?\s*'([a-z]+)'\s*:\s*'\1e?s'|\?\s*'([a-z]+)e?s'\s*:\s*'\2'|\?\s*''\s*:\s*'e?s'|\?\s*'e?s'\s*:\s*''/.test(line)) hits.push(`${p}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(hits).toEqual([]);
  });

  it('never builds a sentence from English words inside a template literal', () => {
    const hits: string[] = [];
    for (const p of files()) {
      const src = source(p);
      for (const { text, at } of templates(src)) {
        const before = src.slice(Math.max(0, at - 40), at);
        if (/(?:Error|throw|console\.\w+)\(?\s*$|new \w*Error\(\s*$/.test(before) || NOT_TEXT.test(text)) continue;
        // Class names like "pth-card is-fresh" are code: drop hyphenated words before looking for a sentence.
        const prose = text.replace(/[\w␀]+(?:-[\w␀]*)+/g, ' ').replace(/␀/g, ' ').trim();
        const words = prose.match(/[A-Za-z][a-z']+/g) ?? [];
        if (words.length >= 2 && PROSE.test(prose) && /[A-Za-z] +[A-Za-z]/.test(prose)) hits.push(`${p}:${lineOf(src, at)}: \`${text.slice(0, 90)}\``);
      }
    }
    expect(hits).toEqual([]);
  });

  it('never glues English words onto a value with +', () => {
    const hits: string[] = [];
    for (const p of files()) {
      source(p).split('\n').forEach((line, i) => {
        if (/\+\s*'[^']*[A-Za-z]{2,} [A-Za-z][^']*'|'[^']*[A-Za-z]{2,} [A-Za-z][^']*'\s*\+/.test(line)) hits.push(`${p}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
