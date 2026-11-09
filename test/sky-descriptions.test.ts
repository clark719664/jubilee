import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SKY_DESCRIPTIONS } from '../src/ui/sky-descriptions';

const sources = ['src/effects/describe.ts', ...readdirSync('src/effects/fx').map((f) => `src/effects/fx/${f}`)];

describe('sky descriptions for translation', () => {
  it('lists every canvas aria-label written in src/effects', () => {
    const found = sources.flatMap((p) => {
      const text = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      return [...text.matchAll(/^\s+(?:'[\w-]+'|\w+): '([^']+)',/gm), ...text.matchAll(/readonly describe(?:: string)? = '([^']+)'/g)].map((m) => m[1]!);
    });
    expect(found.length).toBeGreaterThan(20);
    expect(found.filter((s) => !SKY_DESCRIPTIONS.includes(s))).toEqual([]);
  });
});
