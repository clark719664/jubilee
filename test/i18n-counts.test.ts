import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fill, LANGUAGES, learn, plural, type PluralEntry, type PluralForms } from '../src/i18n/index';

/** Every count in the code, written { one: '…', other: '…' }: the same pattern docs/tools/i18n/collect.ts collects. */
function countsInCode(dir = 'src'): PluralForms[] {
  const out: PluralForms[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (name !== 'art') out.push(...countsInCode(p)); continue; }
    if (!p.endsWith('.ts')) continue;
    for (const m of readFileSync(p, 'utf8').matchAll(/\{\s*one:\s*'((?:[^'\\\n]|\\.)+)',\s*other:\s*'((?:[^'\\\n]|\\.)+)'\s*,?\s*\}/g)) {
      out.push({ one: m[1]!.replace(/\\'/g, "'"), other: m[2]!.replace(/\\'/g, "'") });
    }
  }
  return out;
}

const COUNTS = countsInCode();
const SAMPLES = [0, 1, 2, 3, 5, 11, 21, 22, 100, 1.5];

describe('counts in every language', () => {
  it('finds the counts in the code', () => {
    expect(COUNTS.length).toBeGreaterThan(20);
  });

  for (const { code } of LANGUAGES.filter((l) => l.code !== 'en')) {
    it(`${code}: every count has each plural form the language needs, so none shows in English`, () => {
      const ui = JSON.parse(readFileSync(`public/i18n/${code}/ui.json`, 'utf8')) as Record<string, string | PluralEntry>;
      learn(ui, code);
      const rules = new Intl.PluralRules(code);
      const missing: string[] = [];
      for (const forms of COUNTS) {
        const entry = ui[forms.other];
        if (!entry || typeof entry === 'string') { missing.push(forms.other); continue; }
        for (const n of SAMPLES) {
          const form = entry[rules.select(n)];
          if (!form) { missing.push(`${forms.other} [${rules.select(n)}]`); continue; }
          const shown = n.toLocaleString(`${code}-u-nu-latn`);
          expect(plural(n, forms)).toBe(fill(form, { n: shown }));
        }
      }
      expect([...new Set(missing)]).toEqual([]);
    });
  }
});
