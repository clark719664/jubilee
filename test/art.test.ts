/**
 * Every bundled illustration is plain, self-contained vector art: no scripts, no external references,
 * no embedded rasters or fonts, an artboard the hero can rely on, and a size budget so the app stays
 * light. This runs over whatever art exists; holidays without art fall back to the emoji.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOLIDAYS } from '../src/content/registry';
import { illustratedIds, sceneDataFor, sceneFor, stickerUrl } from '../src/art/index';

const ART = join(__dirname, '../src/art');

function svgFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...svgFiles(p));
    else if (name.endsWith('.svg')) out.push(p.replaceAll('\\', '/'));
  }
  return out;
}

const FORBIDDEN = /<(script|foreignObject|image|text|tspan|a|iframe|style[^>]*@import|link)\b/i;
const EXTERNAL = /(href|src)\s*=\s*["'](?!#)|url\(\s*["']?(?!#)/i;
const BUDGET_KB: Record<string, number> = { back: 40, mid: 60, front: 30, sticker: 30, world: 40, color: 130 };

function kind(path: string): string {
  if (path.includes('/stickers/')) return 'sticker';
  if (path.includes('/world/')) return 'world';
  if (path.includes('/color/')) return 'color';
  const m = /\/(back|mid|front)\.svg$/.exec(path);
  return m ? m[1]! : 'other';
}

const files = svgFiles(ART);

describe('art files', () => {
  it('lives where the loader expects it', () => {
    for (const f of files) {
      const rel = f.slice(ART.length + 1);
      expect(rel, rel).toMatch(/^(scenes\/[a-z0-9-]+\/(back|mid|front)|stickers\/[a-z0-9-]+|world\/[a-z0-9-]+|color\/[a-z0-9-]+)\.svg$/);
    }
  });

  for (const f of files) {
    const rel = f.slice(ART.length + 1);
    it(`${rel} is safe, self-contained and within budget`, () => {
      const src = readFileSync(f, 'utf8');
      expect(src, 'root <svg> with the SVG namespace').toMatch(/<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      expect(FORBIDDEN.test(src), 'no script, text, raster, link or foreignObject').toBe(false);
      const withoutNs = src.replace(/xmlns(:\w+)?="[^"]*"/g, '');
      expect(EXTERNAL.test(withoutNs), 'only #fragment references').toBe(false);
      expect(/on[a-z]+\s*=/i.test(withoutNs), 'no event-handler attributes').toBe(false);
      const k = kind(f);
      if (k === 'back' || k === 'mid' || k === 'front') expect(src, 'scene artboard').toMatch(/viewBox="0 0 1600 900"/);
      if (k === 'sticker') expect(src, 'sticker artboard').toMatch(/viewBox="0 0 512 512"/);
      if (k === 'color') {
        expect(src, 'coloring artboard').toMatch(/viewBox="0 0 800 800"/);
        expect((src.match(/data-fill="/g) ?? []).length, 'coloring regions').toBeGreaterThanOrEqual(5);
      }
      expect(tagBalance(src), 'well-formed: every tag closes in order').toBe('ok');
      const kb = Buffer.byteLength(src) / 1024;
      expect(kb, `${rel} is ${kb.toFixed(1)} KB`).toBeLessThanOrEqual(BUDGET_KB[k] ?? 40);
    });
  }

  it('only illustrates holidays that exist', () => {
    const ids = new Set(HOLIDAYS.map((h) => h.id));
    const { scenes, stickers } = illustratedIds();
    const extraScenes = new Set(['north-pole', 'new-year-midnight']);
    for (const id of scenes) expect(ids.has(id) || extraScenes.has(id), `scene for unknown holiday ${id}`).toBe(true);
    for (const id of stickers) expect(ids.has(id), `sticker for unknown holiday ${id}`).toBe(true);
  });

  it('Seek & Find names say what to look for, never where it is', () => {
    const where = /\b(in|on|at|by|under|from|over|against|through|behind|near|beside)\b/i;
    const wearing = /\bin (a |an )?[\w -]*(bandana|coat|hat|crown|glasses)$/i;
    for (const id of illustratedIds().scenes) {
      const labels = sceneDataFor(id).findables.map((f) => f.label);
      for (const label of labels) if (!wearing.test(label)) expect(label, `${id}: "${label}" gives the spot away`).not.toMatch(where);
      expect(new Set(labels).size, `${id}: every name is different`).toBe(labels.length);
    }
  });

  it('scene.json hotspots and findables sit on the artboard', () => {
    for (const id of illustratedIds().scenes) {
      const data = sceneDataFor(id);
      for (const p of [...data.hotspots, ...data.findables]) {
        expect(p.x, `${id} ${p.label}`).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1600);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(900);
        expect(p.r).toBeGreaterThan(8);
        expect(p.label.length).toBeGreaterThan(1);
      }
      expect(new Set(data.findables.map((f) => f.id)).size, `${id} findable ids unique`).toBe(data.findables.length);
      // The optional effect stage: every point and ellipse on the artboard, sizes positive.
      const st = data.stage;
      if (!st) continue;
      const onBoard = (x: number, y: number, what: string): void => {
        expect(x, `${id} stage ${what} x`).toBeGreaterThanOrEqual(0);
        expect(x, `${id} stage ${what} x`).toBeLessThanOrEqual(1600);
        expect(y, `${id} stage ${what} y`).toBeGreaterThanOrEqual(0);
        expect(y, `${id} stage ${what} y`).toBeLessThanOrEqual(900);
      };
      for (const [k, e] of [['floor', st.floor], ['water', st.water]] as const) {
        if (!e) continue;
        onBoard(e.x - e.rx, e.y - e.ry, k);
        onBoard(e.x + e.rx, e.y + e.ry, k);
        expect(e.rx > 0 && e.ry > 0, `${id} stage ${k} size`).toBe(true);
      }
      if (st.dish) {
        onBoard(st.dish.x - st.dish.rx, st.dish.y, 'dish');
        onBoard(st.dish.x + st.dish.rx, st.dish.y, 'dish');
        expect(st.dish.rx, `${id} stage dish size`).toBeGreaterThan(0);
      }
      for (const w of st.wicks ?? []) {
        expect(w, `${id} stage wick`).toHaveLength(2);
        onBoard(w[0], w[1], 'wick');
      }
    }
  });

  it('exposes scenes and stickers through the loader', () => {
    for (const id of illustratedIds().scenes) expect(sceneFor(id)?.length ?? 0).toBeGreaterThan(0);
    for (const id of illustratedIds().stickers) expect(stickerUrl(id)).toBeTruthy();
  });
});

/** 'ok' when every element closes in order (a browser shows nothing at all for a malformed SVG), else the first problem. */
function tagBalance(src: string): string {
  const body = src.replace(/<!--[\s\S]*?-->/g, '');
  const stack: string[] = [];
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
    const [, close, name, , self] = m;
    if (self) continue;
    if (!close) { stack.push(name!); continue; }
    const top = stack.pop();
    if (top !== name) return `</${name}> closes <${top ?? 'nothing'}> at ${m.index}`;
  }
  return stack.length === 0 ? 'ok' : `<${stack[stack.length - 1]}> never closes`;
}
