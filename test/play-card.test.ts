import { describe, expect, it } from 'vitest';
import { HOLIDAYS, byId } from '../src/content/registry';
import { THEMES } from '../src/theme/themes';
import { decorFor, earnedIds, holidayStickerOrder, isDecorName, painterFor } from '../src/play/card/decor';
import {
  addSticker, addStroke, applyNudge, cardTitle, clampPlaced, clearStrokes, dropSpot, finishStroke, fromHandle, fromPinch, History,
  MAX_SIZE, MAX_STICKERS, MIN_SIZE, newCard, normDeg, nudgeFor, PANEL_H, PANEL_W, removeSticker, restack, sanitizeCard, simplify,
  updateSticker, type CardSpec, type Placed,
} from '../src/play/card/model';
import { deepInk, mixHex } from '../src/play/card/paint';
import { estimateMeasure, fit, isRtl, layoutFront, layoutInfo, layoutInside, wrap } from '../src/play/card/text';
import { COPY } from '../src/play/card/copy';
import { cardActivity } from '../src/play/card';
import { contrastRatio } from '../src/theme/contrast';

const base = (): CardSpec => newCard({ holidayId: 'christmas', bg: 'scene', greeting: { text: '¡Feliz Navidad!', lang: 'es', langName: 'Spanish', sayIt: 'feh-LEES', meaning: 'Happy Christmas' }, from: 'Maya' });
const star = { t: 'decor', p: 'star', c: '#ffd166' } as const;

describe('card model', () => {
  it('adds, moves, restacks and removes stickers immutably', () => {
    const a = base();
    const r1 = addSticker(a, 'front', star, undefined, 'one');
    const r2 = addSticker(r1.card, 'front', { t: 'holiday', h: 'diwali', e: '🪔' }, { x: 100, y: 100 }, 'two');
    expect(a.front.stickers).toHaveLength(0);
    expect(r2.card.front.stickers.map((s) => s.id)).toEqual(['one', 'two']);
    const moved = updateSticker(r2.card, 'front', 'one', { x: 10, y: 20 });
    expect(moved.front.stickers[0]).toMatchObject({ x: 10, y: 20 });
    expect(restack(moved, 'front', 'one', 1).front.stickers.map((s) => s.id)).toEqual(['two', 'one']);
    expect(restack(moved, 'front', 'two', -Infinity).front.stickers.map((s) => s.id)).toEqual(['two', 'one']);
    expect(removeSticker(moved, 'front', 'two').front.stickers).toHaveLength(1);
    expect(moved.inside.stickers).toHaveLength(0);
  });

  it('caps stickers per face and keeps them on the card', () => {
    let c = base();
    for (let i = 0; i < MAX_STICKERS + 3; i++) c = addSticker(c, 'inside', star, undefined, `s${i}`).card;
    expect(c.inside.stickers).toHaveLength(MAX_STICKERS);
    expect(addSticker(c, 'inside', star).placed).toBeNull();
    const p = clampPlaced({ id: 'x', art: star, x: -999, y: 9999, s: 9999, r: 725 });
    expect(p.s).toBe(MAX_SIZE);
    expect(p.x).toBeGreaterThanOrEqual(-MAX_SIZE / 4);
    expect(p.y).toBeLessThanOrEqual(PANEL_H + MAX_SIZE / 4);
    expect(p.r).toBe(5);
    expect(clampPlaced({ ...p, s: 1 }).s).toBe(MIN_SIZE);
  });

  it('spreads new stickers out instead of stacking them', () => {
    const spots = Array.from({ length: 8 }, (_, i) => dropSpot(i));
    const keys = new Set(spots.map((s) => `${Math.round(s.x / 10)},${Math.round(s.y / 10)}`));
    expect(keys.size).toBe(8);
    for (const s of spots) { expect(s.x).toBeGreaterThan(0); expect(s.x).toBeLessThan(PANEL_W); }
  });

  it('maps keys to nudges (arrows, +/-, R)', () => {
    const p: Placed = { id: 'a', art: star, x: 200, y: 200, s: 100, r: 0 };
    expect(applyNudge(p, nudgeFor('ArrowLeft', false)!).x).toBe(192);
    expect(applyNudge(p, nudgeFor('ArrowDown', true)!).y).toBe(240);
    expect(applyNudge(p, nudgeFor('+', false)!).s).toBeCloseTo(112, 0);
    expect(applyNudge(p, nudgeFor('-', false)!).s).toBeCloseTo(89.3, 0);
    expect(applyNudge(p, nudgeFor('r', false)!).r).toBe(15);
    expect(applyNudge(p, nudgeFor('R', true)!).r).toBe(-15);
    expect(nudgeFor('x', false)).toBeNull();
  });

  it('turns and resizes from the corner handle and from a pinch', () => {
    // Handle straight down-right of centre at distance d: size d·√2, angle 0.
    const h = fromHandle(100, 100, 150, 150);
    expect(h.s).toBeCloseTo(100, 0);
    expect(h.r).toBeCloseTo(0, 5);
    expect(fromHandle(100, 100, 50, 150).r).toBeCloseTo(90, 5);
    const start: Placed = { id: 'a', art: star, x: 200, y: 200, s: 100, r: 0 };
    const out = fromPinch(start, { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 200 });
    expect(out.s).toBeCloseTo(200, 0);
    expect(out.r).toBeCloseTo(90, 0);
    expect(normDeg(-190)).toBe(170);
  });

  it('simplifies strokes and keeps their ends', () => {
    const flat: number[] = [];
    for (let i = 0; i <= 100; i++) flat.push(i, 50);
    const s = simplify(flat);
    expect(s).toEqual([0, 50, 100, 50]);
    const zig = [0, 0, 10, 10, 20, 0, 30, 10];
    expect(simplify(zig)).toEqual(zig);
    const dot = finishStroke([40, 40], '#ff0000', 8)!;
    expect(dot.p.length).toBe(4);
    expect(finishStroke([], '#ff0000', 8)).toBeNull();
    const c = addStroke(base(), 'front', dot);
    expect(c.front.strokes).toHaveLength(1);
    expect(clearStrokes(c, 'front').front.strokes).toHaveLength(0);
  });

  it('undoes and redoes snapshots', () => {
    const h = new History(1);
    h.commit(2); h.commit(3);
    expect(h.undo()).toBe(2);
    expect(h.undo()).toBe(1);
    expect(h.undo()).toBeNull();
    expect(h.redo()).toBe(2);
    h.commit(9);
    expect(h.canRedo).toBe(false);
    h.replace(10);
    expect(h.undo()).toBe(2);
  });

  it('sanitizes Fridge data: keeps a good card, drops junk, strips links', () => {
    const good = addSticker(base(), 'front', star, undefined, 'k').card;
    const round = sanitizeCard(JSON.parse(JSON.stringify({ ...good, to: 'Gran http://evil.example', front: { ...good.front, strokes: [{ c: '#123456', w: 6, p: [1, 2, 3, 4, 5] }] } })), isDecorName)!;
    expect(round.front.stickers[0]?.id).toBe('k');
    expect(round.to).toBe('Gran ');
    expect(round.front.strokes[0]?.p).toEqual([1, 2, 3, 4]);
    expect(sanitizeCard({ v: 2 })).toBeNull();
    expect(sanitizeCard('nope')).toBeNull();
    const junk = sanitizeCard({ v: 1, holidayId: 'christmas', bg: 'lava', front: { stickers: [{ art: { t: 'decor', p: 'nope', c: '#fff' }, x: 1, y: 1, s: 1, r: 0 }, { id: 'a', art: { t: 'decor', p: 'star', c: 'red' }, x: 1, y: 1, s: 1, r: 0 }] } }, isDecorName)!;
    expect(junk.bg).toBe('sky');
    expect(junk.front.stickers).toHaveLength(0);
    expect(junk.greeting).toBeNull();
  });

  it('titles cards for the gallery', () => {
    const tpl = { forWho: COPY.cardFor, plain: COPY.cardPlain };
    expect(cardTitle(base(), 'Christmas', tpl)).toBe('Christmas card');
    expect(cardTitle({ ...base(), to: 'Grandma' }, 'Christmas', tpl)).toBe('Card for Grandma');
  });
});

describe('card words layout', () => {
  it('wraps without leaving punctuation alone on a line', () => {
    const lines = wrap('Joyeux Noël !', 200, 60, true, estimateMeasure);
    expect(lines.every((l) => l !== '!')).toBe(true);
    expect(wrap('¡Feliz Navidad!', 100, 60, true, estimateMeasure)[0]).toMatch(/^¡/);
  });

  it('fits long greetings inside the panel', () => {
    const r = fit('Selamat Hari Raya Aidilfitri Maaf Zahir dan Batin', PANEL_W - 64, 78, 34, 2, true, estimateMeasure);
    expect(r.lines.length).toBeLessThanOrEqual(2);
    for (const l of r.lines) expect(estimateMeasure(l, r.px, true)).toBeLessThanOrEqual(PANEL_W - 64 + 0.01);
  });

  it('places the front words at the top, middle or bottom and inside the panel', () => {
    for (const wordsAt of ['top', 'middle', 'bottom'] as const) {
      const lay = layoutFront({ ...base(), wordsAt, greeting: { text: '恭喜发财', lang: 'zh-Hans', langName: 'Mandarin', roman: 'Gongxi facai' } }, 'Lunar New Year', COPY.greetingHappy, estimateMeasure);
      expect(lay.pill).not.toBeNull();
      for (const l of lay.lines) { expect(l.y - l.size / 2).toBeGreaterThanOrEqual(0); expect(l.y + l.size / 2).toBeLessThanOrEqual(PANEL_H); }
      expect(lay.lines.map((l) => l.role)).toEqual(['name', 'greet', 'roman']);
    }
    const english = layoutFront({ ...base(), greeting: null }, 'Pi Day', COPY.greetingHappy, estimateMeasure);
    expect(english.pill).toBeNull();
    expect(english.lines[0]?.text).toBe('Happy Pi Day!');
  });

  it('lays out the inside and the info page', () => {
    const inside = layoutInside({ ...base(), to: 'Grandma', message: 'I love you!' }, { dear: COPY.dear, love: COPY.love }, estimateMeasure);
    expect(inside.map((l) => l.role)).toEqual(['to', 'msg', 'from']);
    expect(inside[0]?.text).toBe('Dear Grandma,');
    expect(layoutInside({ ...base(), from: '' }, { dear: COPY.dear, love: COPY.love }, estimateMeasure)).toHaveLength(0);
    const info = layoutInfo(base(), 'Christmas', { title: COPY.infoTitle, means: COPY.infoMeans, sayIt: COPY.infoSay, happy: COPY.greetingHappy }, estimateMeasure);
    expect(info.some((l) => l.text.includes('feh-LEES'))).toBe(true);
    expect(isRtl('عيد مبارك')).toBe(true);
    expect(isRtl('Eid Mubarak')).toBe(false);
  });
});

describe('card decorations and stickers', () => {
  it('gives every holiday a set of real, distinct decorations', () => {
    for (const m of HOLIDAYS) {
      const d = decorFor(m, THEMES[m.theme]);
      expect(d.length, m.id).toBeGreaterThanOrEqual(4);
      expect(new Set(d.map((x) => x.key)).size).toBe(d.length);
      for (const x of d) { expect(painterFor(x.p), x.p).not.toBeNull(); expect(x.c).toMatch(/^#[0-9a-f]{6}$/); expect(x.label.length).toBeGreaterThan(0); }
    }
  });

  it('puts sacred objects only on their own holiday', () => {
    const sacred: Record<string, string[]> = { menorahBody: ['hanukkah'], kinaraBody: ['kwanzaa'], kinaraCandle: ['kwanzaa'], diya: ['diwali'], crescent: ['eid-al-fitr', 'eid-al-adha', 'ramadan'] };
    for (const m of HOLIDAYS) {
      for (const d of decorFor(m, THEMES[m.theme])) {
        const ok = sacred[d.p];
        if (ok) expect(ok, `${d.p} on ${m.id}`).toContain(m.id);
      }
    }
  });

  it('knows earned stickers and orders the sticker sheet', () => {
    const earned = earnedIds({ 'diwali:2025': '2025-10-20', 'lunar-new-year:2026': '2026-02-17' });
    expect([...earned].sort()).toEqual(['diwali', 'lunar-new-year']);
    const order = holidayStickerOrder(HOLIDAYS, 'christmas', earned).map((m) => m.id);
    expect(order[0]).toBe('christmas');
    expect(order.slice(1, 3).sort()).toEqual(['diwali', 'lunar-new-year']);
    expect(order).toHaveLength(HOLIDAYS.length);
  });

  it('rejects unknown painter names and odd glyphs', () => {
    expect(isDecorName('star')).toBe(true);
    expect(isDecorName('glyph:🥞')).toBe(true);
    expect(isDecorName('glyph:')).toBe(false);
    expect(isDecorName('constructor')).toBe(false);
  });
});

describe('card colours', () => {
  it('finds a readable ink for the inside of every theme', () => {
    for (const t of Object.values(THEMES)) expect(contrastRatio(deepInk(t).slice(0, 7), '#fffaf0'), t.id).toBeGreaterThanOrEqual(4.5);
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});

describe('card activity', () => {
  it('is available for every holiday', () => {
    const empty = { story: [], facts: [], greetings: [], recipes: [], crafts: [] };
    for (const id of ['christmas', 'pi-day', 'pirate-day']) expect(cardActivity.available(byId(id)!, empty)).toBe(true);
    expect(cardActivity.id).toBe('card');
  });
});
