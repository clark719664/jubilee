import { describe, expect, it } from 'vitest';
import { regionName } from '../src/play/color/copy';
import {
  BLANK, KID_CRAYONS, colorWord, crayonBox, distance, paintFor, solidFor, themeColors, toHsl,
} from '../src/play/color/crayons';
import { clampView, IDENTITY, MAX_ZOOM, pinch, readingOrder, reveal, zoomAt } from '../src/play/color/geometry';
import { canRedo, canUndo, commit, diffRegions, filledCount, MAX_UNDO, newDoc, paint, redo, replaceAll, undo } from '../src/play/color/history';
import { attrOk, countNodes, MAX_DEPTH, MAX_NODES, PAGE_VIEWBOX, sanitizeTree, SVG_NS, type CleanNode, type XNode } from '../src/play/color/sanitize';
import { cleanFills, COLOR_KEY, colorStorage, isColorData, itemData, parseSave, withDraft } from '../src/play/color/store';
import { groupOf, surpriseFills, surprisePalette } from '../src/play/color/surprise';
import { THEMES, THEME_IDS } from '../src/theme/themes';

/** A tiny XML reader for tests (elements + attributes only), so the sanitizer can be fed real-looking files. */
function parseXml(src: string): XNode {
  const stripped = src.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  const re = /<(\/?)([\w:-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
  const root: { tag: string; attrs: Record<string, string>; children: XNode[]; ns?: string } = { tag: '#doc', attrs: {}, children: [] };
  const stack: typeof root[] = [root];
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped))) {
    const [, close, tag, attrText, self] = m;
    if (close) { stack.pop(); continue; }
    const attrs: Record<string, string> = {};
    for (const a of attrText!.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]!] = a[2] ?? a[3] ?? '';
    const parentNs = stack[stack.length - 1]!.ns;
    const ns = attrs.xmlns ?? parentNs ?? SVG_NS;
    const node = { tag: tag!, attrs, children: [] as XNode[], ns };
    stack[stack.length - 1]!.children.push(node);
    if (!self) stack.push(node);
  }
  return root.children[0]!;
}

const PAGE = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" onload="alert(1)">
  <!-- a test page -->
  <style>rect { fill: red }</style>
  <script>alert('x')</script>
  <g stroke="#1f1a3d" stroke-width="6" stroke-linejoin="round" class="art" id="lines">
    <rect data-fill="sky" x="8" y="8" width="784" height="784" rx="28" fill="#ffffff"/>
    <polygon data-fill="star-1" points="10,10 20,30 30,10" fill="#fff"/>
    <polygon data-fill="star-2" points="110,10 120,30 130,10" fill="#fff" onclick="steal()"/>
    <path data-fill="roof" d="M 196 412 L 330 296 L 464 412 Z" fill="url(http://evil/x.svg#a)" style="fill:red"/>
    <g data-fill="lantern" transform="translate(10, 20) rotate(5)">
      <rect x="0" y="0" width="40" height="56" fill="#fff"/>
      <path d="M 0 0 L 40 0" fill="none"/>
    </g>
    <circle data-fill="star-1" cx="400" cy="400" r="20" fill="#fff"/>
    <foreignObject width="10" height="10"><rect data-fill="hidden" width="5" height="5"/></foreignObject>
    <a href="javascript:alert(1)"><circle data-fill="link" cx="1" cy="1" r="1"/></a>
    <image href="http://example.org/x.png" width="10" height="10"/>
    <use href="#lines"/>
    <text x="0" y="0">Hi</text>
    <svg viewBox="0 0 10 10"><rect data-fill="nested" width="1" height="1"/></svg>
    <path d="javascript:alert(1)" data-fill="bad-d"/>
    <line x1="0" y1="0" x2="10" y2="10" xlink:href="#x"/>
  </g>
</svg>`;

const tags = (n: CleanNode): string[] => [n.tag, ...n.children.flatMap(tags)];
const allAttrs = (n: CleanNode): Record<string, string>[] => [n.attrs, ...n.children.flatMap(allAttrs)];

describe('color sanitizer', () => {
  const page = sanitizeTree(parseXml(PAGE))!;

  it('keeps only allow-listed shapes and groups', () => {
    expect(page).not.toBeNull();
    const t = new Set(tags(page.root));
    for (const bad of ['style', 'script', 'foreignObject', 'a', 'image', 'use', 'text']) expect(t.has(bad), bad).toBe(false);
    expect(tags(page.root).filter((x) => x === 'svg')).toHaveLength(1);
    expect([...t].every((x) => ['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line'].includes(x))).toBe(true);
  });

  it('lists regions in document order, once each, and none from dropped subtrees', () => {
    expect(page.regions).toEqual(['sky', 'star-1', 'star-2', 'roof', 'lantern']);
  });

  it('drops handlers, styles, ids, classes, links and url() paints', () => {
    for (const a of allAttrs(page.root)) {
      for (const k of Object.keys(a)) expect(k.startsWith('on') || ['style', 'class', 'id', 'href', 'xlink:href', 'xmlns', 'width', 'height'].includes(k) && a === page.root.attrs, k).toBe(false);
      for (const v of Object.values(a)) expect(v).not.toMatch(/url\(|javascript:|http/);
    }
    const roof = page.root.children[0]!.children.find((c) => c.attrs['data-fill'] === 'roof')!;
    expect(roof.attrs.fill).toBeUndefined();
    expect(roof.attrs.d).toBe('M 196 412 L 330 296 L 464 412 Z');
    expect(page.dropped).toBeGreaterThan(5);
  });

  it('gives the root only a viewBox and inheritable paint', () => {
    expect(page.root.attrs).toEqual({ viewBox: '0 0 800 800' });
    const g = page.root.children[0]!;
    expect(g.attrs).toEqual({ stroke: '#1f1a3d', 'stroke-width': '6', 'stroke-linejoin': 'round' });
    const lantern = g.children.find((c) => c.attrs['data-fill'] === 'lantern')!;
    expect(lantern.attrs.transform).toBe('translate(10, 20) rotate(5)');
    expect(lantern.children).toHaveLength(2);
  });

  it('defaults a missing viewBox and refuses non-SVG roots or namespaces', () => {
    expect(sanitizeTree({ tag: 'svg', attrs: {}, children: [] })!.root.attrs.viewBox).toBe(PAGE_VIEWBOX);
    expect(sanitizeTree({ tag: 'html', attrs: {}, children: [] })).toBeNull();
    expect(sanitizeTree({ tag: 'svg', ns: 'http://www.w3.org/1999/xhtml', attrs: {}, children: [] })).toBeNull();
    const mixed = sanitizeTree({ tag: 'svg', attrs: {}, children: [{ tag: 'rect', ns: 'http://www.w3.org/1999/xhtml', attrs: { 'data-fill': 'x' }, children: [] }] })!;
    expect(mixed.regions).toEqual([]);
  });

  it('caps depth and size', () => {
    let deep: XNode = { tag: 'rect', attrs: { 'data-fill': 'bottom' }, children: [] };
    for (let i = 0; i < MAX_DEPTH + 5; i++) deep = { tag: 'g', attrs: {}, children: [deep] };
    const d = sanitizeTree({ tag: 'svg', attrs: {}, children: [deep] })!;
    expect(d.regions).toEqual([]);
    const wide = sanitizeTree({ tag: 'svg', attrs: {}, children: Array.from({ length: MAX_NODES + 50 }, (_, i) => ({ tag: 'circle', attrs: { 'data-fill': `c${i}`, r: '1' }, children: [] })) })!;
    expect(countNodes(wide.root)).toBeLessThanOrEqual(MAX_NODES);
  });

  it('checks attribute values strictly', () => {
    expect(attrOk('rect', 'x', '12.5')).toBe(true);
    expect(attrOk('rect', 'x', '12px')).toBe(false);
    expect(attrOk('rect', 'width', '50%')).toBe(true);
    expect(attrOk('rect', 'width', '-5')).toBe(false);
    expect(attrOk('path', 'd', 'M0 0L10 10z')).toBe(true);
    expect(attrOk('path', 'd', 'M0 0 <script>')).toBe(false);
    expect(attrOk('g', 'transform', 'matrix(1 0 0 1 5 5) scale(2)')).toBe(true);
    expect(attrOk('g', 'transform', 'translate(expression(alert(1)))')).toBe(false);
    expect(attrOk('rect', 'fill', 'rgb(10, 20, 30)')).toBe(true);
    expect(attrOk('rect', 'fill', 'url(#a)')).toBe(false);
    expect(attrOk('rect', 'fill', 'red;background:url(x)')).toBe(false);
    expect(attrOk('rect', 'data-fill', 'roof-2')).toBe(true);
    expect(attrOk('rect', 'data-fill', 'a b')).toBe(false);
    expect(attrOk('rect', 'viewBox', '0 0 1 1')).toBe(false);
    expect(attrOk('svg', 'viewBox', '0 0 800 800')).toBe(true);
    expect(attrOk('rect', 'stroke-linecap', 'round')).toBe(true);
    expect(attrOk('rect', 'stroke-linecap', 'pointy')).toBe(false);
    expect(attrOk('rect', 'onclick', 'x')).toBe(false);
    expect(attrOk('rect', 'style', 'fill:red')).toBe(false);
  });
});

describe('crayon box', () => {
  it('has 12 kid crayons, 4 holiday crayons, 2 magic ones and the big sets, all with unique ids', () => {
    expect(KID_CRAYONS).toHaveLength(12);
    const box = crayonBox(THEMES.christmas, 'Christmas');
    expect(new Set(box.map((c) => c.id)).size).toBe(box.length);
    expect(box.filter((c) => c.kind === 'theme').map((c) => c.name)).toContain('Christmas gold');
    expect(box.filter((c) => c.kind === 'magic')).toHaveLength(2);
  });

  it.each(THEME_IDS)('gives %s four distinct, non-white holiday crayons and working magic', (id) => {
    const cols = themeColors(THEMES[id]);
    expect(cols).toHaveLength(4);
    for (const c of cols) expect(distance(c, BLANK)).toBeGreaterThanOrEqual(34);
    for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) expect(distance(cols[i]!, cols[j]!)).toBeGreaterThanOrEqual(30);
    for (const m of crayonBox(THEMES[id], 'X').filter((c) => c.kind === 'magic')) {
      expect(m.gradient!.stops).toHaveLength(3);
      expect(new Set(m.gradient!.stops.map((s) => s.color)).size).toBe(3);
    }
  });

  it('turns crayon ids into paints', () => {
    const box = crayonBox(THEMES.diwali, 'Diwali');
    expect(paintFor('k-red', box, 'p')).toBe('#e63946');
    expect(paintFor('m-1', box, 'p')).toBe('url(#p-m-1)');
    expect(paintFor('eraser', box, 'p')).toBe(BLANK);
    expect(paintFor('nope', box, 'p')).toBe(BLANK);
    expect(paintFor(null, box, 'p')).toBe(BLANK);
    expect(solidFor('m-2', box)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('names colors in plain words', () => {
    expect(colorWord('#ffd166')).toBe('gold');
    expect(colorWord('#e63946')).toBe('red');
    expect(colorWord('#1f5fbf')).toBe('blue');
    expect(colorWord('#2a9d4b')).toBe('green');
    expect(toHsl('#ffffff').l).toBe(1);
  });
});

describe('history (undo/redo)', () => {
  it('records fills, skips no-ops and walks back exactly', () => {
    let d = newDoc();
    d = paint(d, 'sky', 'k-blue');
    d = paint(d, 'sky', 'k-blue');
    expect(d.undo).toHaveLength(1);
    d = paint(d, 'roof', 'k-red');
    d = paint(d, 'sky', null);
    expect(d.fills).toEqual({ roof: 'k-red' });
    d = undo(d);
    expect(d.fills).toEqual({ sky: 'k-blue', roof: 'k-red' });
    d = undo(d); d = undo(d);
    expect(d.fills).toEqual({});
    expect(canUndo(d)).toBe(false);
    expect(undo(d)).toBe(d);
    d = redo(d);
    expect(d.fills).toEqual({ sky: 'k-blue' });
    expect(canRedo(d)).toBe(true);
    d = paint(d, 'door', 'k-brown');
    expect(canRedo(d)).toBe(false);
  });

  it('makes a whole surprise one step', () => {
    let d = paint(newDoc(), 'sky', 'k-blue');
    d = replaceAll(d, ['sky', 'roof', 'door'], { sky: 'k-sky', roof: 'k-red', door: 'k-brown' });
    expect(d.fills).toEqual({ sky: 'k-sky', roof: 'k-red', door: 'k-brown' });
    d = undo(d);
    expect(d.fills).toEqual({ sky: 'k-blue' });
    d = replaceAll(d, ['sky'], {});
    expect(d.fills).toEqual({});
  });

  it('caps the undo stack and reports differences', () => {
    let d = newDoc();
    for (let i = 0; i < MAX_UNDO + 20; i++) d = commit(d, { r: i % 2 ? 'k-red' : 'k-blue' });
    expect(d.undo).toHaveLength(MAX_UNDO);
    expect(diffRegions({ a: 'x', b: 'y' }, { a: 'x', c: 'z' }).sort()).toEqual(['b', 'c']);
    expect(filledCount({ a: 'x' }, ['a', 'b'])).toBe(1);
  });
});

describe('surprise', () => {
  const box = crayonBox(THEMES.christmas, 'Christmas');
  const ids = box.map((c) => c.id);
  const regions = ['sky', 'moon', 'star-1', 'star-2', 'star-3', 'cloud-1', 'cloud-2', 'hill-back', 'roof', 'wall', 'door', 'window-1', 'window-2', 'tree-1', 'tree-2', 'trunk', 'thing'];

  it('colors every region with real crayons, deterministically', () => {
    const a = surpriseFills(regions, box, 42);
    expect(Object.keys(a).sort()).toEqual([...regions].sort());
    for (const v of Object.values(a)) expect(ids).toContain(v);
    expect(surpriseFills(regions, box, 42)).toEqual(a);
    const variety = new Set([1, 2, 3, 4, 5, 6].map((s) => JSON.stringify(surpriseFills(regions, box, s))));
    expect(variety.size).toBeGreaterThan(3);
  });

  it('keeps families together and suits meaningful names', () => {
    let skyBlue = 0, treeGreen = 0;
    for (let s = 1; s <= 40; s++) {
      const f = surpriseFills(regions, box, s);
      expect(f['star-1']).toBe(f['star-2']);
      expect(f['window-1']).toBe(f['window-2']);
      if (['k-blue', 'k-sky'].includes(f.sky!)) skyBlue++;
      if (['k-green', 'k-lime'].includes(f['tree-1']!)) treeGreen++;
    }
    expect(skyBlue).toBeGreaterThan(15);
    expect(treeGreen).toBeGreaterThan(25);
  });

  it('builds a palette led by the holiday', () => {
    const p = surprisePalette(box, 7);
    expect(p.length).toBeGreaterThanOrEqual(4);
    expect(p[0]!.startsWith('t-')).toBe(true);
    expect(new Set(p).size).toBe(p.length);
    expect(groupOf('star-12')).toBe('star');
    expect(groupOf('Lantern-Glass-2')).toBe('lantern-glass');
  });
});

describe('zoom, pan and reading order', () => {
  const W = 400, H = 400;
  it('clamps scale and keeps the paper covering the viewport', () => {
    expect(clampView({ s: 0.5, tx: 30, ty: -10 }, W, H)).toEqual(IDENTITY);
    expect(clampView({ s: 9, tx: 0, ty: 0 }, W, H).s).toBe(MAX_ZOOM);
    expect(clampView({ s: 2, tx: -1000, ty: 50 }, W, H)).toEqual({ s: 2, tx: -400, ty: 0 });
    expect(clampView({ s: NaN, tx: NaN, ty: 0 }, W, H)).toEqual(IDENTITY);
  });

  it('zooms about the pointer', () => {
    const v = zoomAt(IDENTITY, 2, 100, 300, W, H);
    expect(v.s).toBe(2);
    // The paper point under (100, 300) is still under it.
    expect((100 - v.tx) / v.s).toBeCloseTo(100);
    expect((300 - v.ty) / v.s).toBeCloseTo(300);
    expect(zoomAt(v, 0.1, 0, 0, W, H)).toEqual(IDENTITY);
  });

  it('pinches and pans with two fingers in one motion', () => {
    const v = pinch(IDENTITY, { x: 150, y: 200 }, { x: 250, y: 200 }, { x: 100, y: 200 }, { x: 300, y: 200 }, W, H);
    expect(v.s).toBeCloseTo(2);
    expect((200 - v.tx) / v.s).toBeCloseTo(200);
    const moved = pinch(v, { x: 100, y: 200 }, { x: 300, y: 200 }, { x: 80, y: 180 }, { x: 280, y: 180 }, W, H);
    expect(moved.s).toBeCloseTo(2);
    expect(moved.tx - v.tx).toBeCloseTo(-20);
    expect(moved.ty - v.ty).toBeCloseTo(-20);
  });

  it('reveals a box the keyboard moved to', () => {
    const v = { s: 2, tx: 0, ty: 0 };
    const r = reveal(v, { x: 300, y: 300, w: 40, h: 40 }, W, H);
    const right = r.tx + r.s * 340;
    expect(right).toBeLessThanOrEqual(W);
    expect(r.tx + r.s * 300).toBeGreaterThanOrEqual(0);
    expect(reveal(v, { x: 10, y: 10, w: 20, h: 20 }, W, H)).toEqual(v);
  });

  it('orders regions top-left to bottom-right in rows', () => {
    const order = readingOrder([
      { id: 'sky', x: 0, y: 0, w: 800, h: 800 },
      { id: 'moon', x: 600, y: 80, w: 100, h: 100 },
      { id: 'star', x: 100, y: 60, w: 40, h: 40 },
      { id: 'door', x: 300, y: 540, w: 60, h: 110 },
      { id: 'roof', x: 200, y: 300, w: 260, h: 110 },
      { id: 'tree', x: 520, y: 350, w: 170, h: 240 },
    ]);
    expect(order).toEqual(['sky', 'star', 'moon', 'roof', 'tree', 'door']);
  });
});

describe('saving', () => {
  const memory = (): Storage & { data: Map<string, string>; writes: number } => {
    const data = new Map<string, string>();
    const s = {
      data, writes: 0,
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => { s.writes++; data.set(k, v); },
      removeItem: (k: string) => { s.writes++; data.delete(k); },
    };
    return s as unknown as Storage & { data: Map<string, string>; writes: number };
  };

  it('parses tolerantly and keeps only well-formed fills', () => {
    expect(parseSave(null).drafts).toEqual({});
    expect(parseSave('{oops').drafts).toEqual({});
    const s = parseSave(JSON.stringify({ v: 1, drafts: { christmas: { fills: { sky: 'k-blue', roof: 'red', 'bad id!': 'k-red' }, itemId: 'f-1' }, 'Bad Key!': { fills: {} } } }));
    expect(s.drafts).toEqual({ christmas: { fills: { sky: 'k-blue' }, itemId: 'f-1' } });
    expect(cleanFills(['k-red'])).toEqual({});
  });

  it('drops empty drafts and never writes while pretending', () => {
    let save = withDraft(parseSave(null), 'diwali', { fills: { sky: 'k-blue' } });
    expect(Object.keys(save.drafts)).toEqual(['diwali']);
    save = withDraft(save, 'diwali', { fills: {} });
    expect(save.drafts).toEqual({});

    const real = memory();
    const store = colorStorage(false, real);
    expect(store.write(withDraft(store.read(), 'easter', { fills: { egg: 'k-pink' } }))).toBe(true);
    expect(JSON.parse(real.data.get(COLOR_KEY)!).drafts.easter.fills.egg).toBe('k-pink');
    expect(colorStorage(false, real).read().drafts.easter!.fills).toEqual({ egg: 'k-pink' });

    const pretend = memory();
    const p = colorStorage(true, pretend);
    expect(p.write(withDraft(p.read(), 'easter', { fills: { egg: 'k-pink' } }))).toBe(false);
    expect(pretend.writes).toBe(0);
    expect(p.read().drafts.easter!.fills).toEqual({ egg: 'k-pink' });
  });

  it('shapes Fridge data as { v, pageId, theme, fills }', () => {
    const d = itemData('christmas', 'christmas', { sky: 'k-blue' });
    expect(d).toEqual({ v: 1, pageId: 'christmas', theme: 'christmas', fills: { sky: 'k-blue' } });
    expect(isColorData(d)).toBe(true);
    expect(isColorData({ v: 2, pageId: 'x', theme: 'christmas', fills: {} })).toBe(false);
    expect(JSON.stringify(d).length).toBeLessThan(200);
  });

  it('speaks region names', () => {
    expect(regionName('star-2')).toBe('star 2');
    expect(regionName('lantern_glass')).toBe('lantern glass');
  });
});
