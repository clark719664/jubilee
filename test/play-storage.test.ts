import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PLAY_STORAGE, clearPlayStorage, playStorageLines } from '../src/play/storage';

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? sources(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('activity storage', () => {
  it('lists every jubilee.* localStorage key used anywhere in the app', () => {
    const used = new Set<string>();
    for (const f of sources(join(__dirname, '../src'))) {
      for (const m of readFileSync(f, 'utf8').matchAll(/'(jubilee\.[a-z]+\.v\d)'/g)) used.add(m[1]!);
    }
    const listed = new Set(PLAY_STORAGE.map((k) => k.key));
    for (const key of used) expect(listed.has(key), `${key} is listed for the grown-ups page`).toBe(true);
  });

  it('describes what is stored and clears it all', () => {
    const data = new Map<string, string>([
      ['jubilee.fridge.v1', JSON.stringify({ version: 1, items: [{}, {}, {}] })],
      ['jubilee.jubi.v1', JSON.stringify({ version: 1, outfit: { hat: 'santa-hat' } })],
    ]);
    const s = { getItem: (k: string) => data.get(k) ?? null, removeItem: (k: string) => void data.delete(k) };
    expect(playStorageLines(s)).toEqual(['Things your child made (cards, pages, letters): 3 saved', "Jubi's outfit: saved"]);
    clearPlayStorage(s);
    expect(data.size).toBe(0);
    expect(playStorageLines(null)).toEqual([]);
  });
});
