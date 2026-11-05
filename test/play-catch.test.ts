import { describe, expect, it } from 'vitest';
import { HOLIDAYS, byId } from '../src/content/registry';
import { ARCADE_KEY, ArcadeMemory, bestKey, type ArcadeStorage } from '../src/play/catch/best';
import {
  BOUNCING, CatchGame, FALLING, GOOD, MAX_ITEMS, OOPS, ROUND_SECONDS, SPECIAL, type CatchEvent,
} from '../src/play/catch/catch-engine';
import { FULL_MOON_HOLIDAYS } from '../src/play/catch/backdrop';
import { COPY, fill } from '../src/play/catch/copy';
import { knownSprite } from '../src/play/catch/painters';
import { PIECE_ASPECT, SKINS, defaultSkin, skinFor, skinSprites } from '../src/play/catch/skins';
import { HEIGHT_MILESTONES, MAX_PIECES, StackGame, type StackEvent } from '../src/play/catch/stack-engine';
import { THEMES } from '../src/theme/themes';

const STEP = 1 / 60;

function memStorage(seed: Record<string, string> = {}): ArcadeStorage & { data: Record<string, string>; writes: number } {
  const data = { ...seed };
  return {
    data,
    writes: 0,
    getItem(k) { return k in data ? data[k]! : null; },
    setItem(k, v) { this.writes++; data[k] = v; },
  };
}

function catchGame(opts: Partial<{ easy: boolean; reduced: boolean; seed: number }> = {}): CatchGame {
  const g = new CatchGame({ easy: opts.easy ?? false, reduced: opts.reduced ?? false, seed: opts.seed ?? 7, goodKinds: 4, oopsKinds: 2 });
  g.resize(390, 700);
  return g;
}

/** A helpful bot: always steers the basket under the lowest treat that is still falling. */
function botStep(g: CatchGame): void {
  let best: { x: number; y: number } | null = null;
  for (const it of g.items) {
    if (it.active && it.state === FALLING && it.cls !== OOPS && (!best || it.y > best.y)) best = it;
  }
  g.setTarget(best ? best.x : g.w / 2);
  g.step(STEP);
}

function stackGame(opts: Partial<{ easy: boolean; reduced: boolean; seed: number }> = {}): StackGame {
  const g = new StackGame({ easy: opts.easy ?? false, reduced: opts.reduced ?? false, seed: opts.seed ?? 3, aspect: PIECE_ASPECT.present, colors: 4 });
  g.resize(390, 700);
  return g;
}

/** Steps until the falling piece has landed (or left). */
function settle(g: StackGame): void {
  for (let i = 0; i < 240 && g.fallActive; i++) g.step(STEP);
}

/** Holds the ribbon piece exactly over `x` (world) and drops it. */
function dropAt(g: StackGame, x: number): void {
  for (let i = 0; i < 120 && !g.hangReady; i++) g.step(STEP);
  g.dragTo(g.w / 2 + x);
  g.endDrag();
  expect(g.drop()).toBe(true);
  settle(g);
}

// ---------------------------------------------------------------------------------------- memory

describe('ArcadeMemory (jubilee.arcade.v1)', () => {
  it('keeps one best per holiday, mode and Easy, and reports a new best only when beaten', () => {
    const s = memStorage();
    const m = new ArcadeMemory({ storage: s });
    expect(m.best('christmas', 'catch', false)).toBe(0);
    expect(m.submit('christmas', 'catch', false, 12)).toBe(true);
    expect(m.submit('christmas', 'catch', false, 9)).toBe(false);
    expect(m.submit('christmas', 'catch', false, 12)).toBe(false);
    expect(m.submit('christmas', 'catch', true, 5)).toBe(true);
    expect(m.submit('christmas', 'stack', false, 0)).toBe(false);
    expect(m.best('christmas', 'catch', false)).toBe(12);
    expect(m.best('christmas', 'catch', true)).toBe(5);
    expect(m.best('diwali', 'catch', false)).toBe(0);
    const again = new ArcadeMemory({ storage: s });
    expect(again.best('christmas', 'catch', false)).toBe(12);
    expect(JSON.parse(s.data[ARCADE_KEY]!).best.christmas[bestKey('catch', true)]).toBe(5);
  });

  it('remembers the last mode and the Easy switch', () => {
    const s = memStorage();
    new ArcadeMemory({ storage: s }).setPrefs('stack', true);
    const m = new ArcadeMemory({ storage: s });
    expect(m.mode).toBe('stack');
    expect(m.easy).toBe(true);
  });

  it('never writes while the app is pretending a date', () => {
    const s = memStorage();
    const m = new ArcadeMemory({ storage: s, pretending: true });
    expect(m.submit('halloween', 'catch', false, 30)).toBe(true);
    m.setPrefs('stack', true);
    expect(s.writes).toBe(0);
    expect(m.best('halloween', 'catch', false)).toBe(30);
  });

  it('survives broken, blocked or junk storage', () => {
    const throwing: ArcadeStorage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } };
    const m = new ArcadeMemory({ storage: throwing });
    expect(m.submit('easter', 'stack', false, 4)).toBe(true);
    expect(m.best('easter', 'stack', false)).toBe(4);
    expect(new ArcadeMemory({ storage: memStorage({ [ARCADE_KEY]: '{nope' }) }).best('easter', 'stack', false)).toBe(0);
    const junk = memStorage({ [ARCADE_KEY]: JSON.stringify({ version: 1, best: { easter: { stack: -3, catch: 'x', 'catch-easy': 7.8 }, bad: 4 }, mode: 'dance', easy: 'yes' }) });
    const j = new ArcadeMemory({ storage: junk });
    expect(j.best('easter', 'stack', false)).toBe(0);
    expect(j.best('easter', 'catch', true)).toBe(7);
    expect(j.mode).toBe('catch');
    expect(j.easy).toBe(false);
    expect(new ArcadeMemory({ storage: null }).best('x', 'catch', false)).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------- catch

describe('CatchGame', () => {
  it('preallocates its items and never grows the pool', () => {
    const g = catchGame();
    g.start(1);
    for (let i = 0; i < 60 * ROUND_SECONDS; i++) botStep(g);
    expect(g.items.length).toBe(MAX_ITEMS);
  });

  it('a round lasts 45 s and ends exactly once, with a soft end event', () => {
    const g = catchGame();
    const events: CatchEvent[] = [];
    g.listener = (ev) => { events.push(ev); };
    g.start(2);
    for (let i = 0; i < 60 * 44; i++) g.step(STEP);
    expect(g.over).toBe(false);
    for (let i = 0; i < 60 * 3; i++) g.step(STEP);
    expect(g.over).toBe(true);
    expect(g.progress).toBe(1);
    expect(events.filter((e) => e === 'end')).toHaveLength(1);
  });

  it('is playable: a child who follows the treats catches plenty', () => {
    const g = catchGame();
    g.start(11);
    for (let i = 0; i < 60 * ROUND_SECONDS; i++) botStep(g);
    expect(g.caught).toBeGreaterThan(25);
    expect(g.score).toBeGreaterThanOrEqual(g.caught);
  });

  it('is the same round for the same seed', () => {
    const a = catchGame();
    const b = catchGame();
    a.start(42);
    b.start(42);
    for (let i = 0; i < 60 * 20; i++) { botStep(a); botStep(b); }
    expect(a.score).toBe(b.score);
    expect(a.items.map((it) => it.x)).toEqual(b.items.map((it) => it.x));
  });

  it('sleepy oops things only bounce off: no points lost, nothing taken away', () => {
    const g = catchGame({ seed: 5 });
    g.start(5);
    let bounced = 0;
    let scoreBefore = 0;
    g.listener = (ev, _x, _y, item) => {
      if (ev === 'bounce') {
        bounced++;
        expect(item?.cls).toBe(OOPS);
        expect(item?.state).toBe(BOUNCING);
        expect(g.score).toBe(scoreBefore);
      }
      if (ev === 'catch') expect(item?.cls).not.toBe(OOPS);
    };
    // Sit under everything that falls, oops things included.
    for (let i = 0; i < 60 * ROUND_SECONDS; i++) {
      scoreBefore = g.score;
      let low: { x: number; y: number } | null = null;
      for (const it of g.items) if (it.active && it.state === FALLING && (!low || it.y > low.y)) low = it;
      g.setTarget(low ? low.x : g.w / 2);
      g.step(STEP);
      expect(g.score).toBeGreaterThanOrEqual(scoreBefore);
    }
    expect(bounced).toBeGreaterThan(0);
  });

  it('golden specials are worth 3 and come along during a round', () => {
    const g = catchGame();
    g.start(9);
    let specials = 0;
    g.listener = (ev, _x, _y, item) => { if (ev === 'catch' && item?.cls === SPECIAL) specials++; };
    let goods = 0;
    for (let i = 0; i < 60 * ROUND_SECONDS; i++) botStep(g);
    for (const it of g.items) if (it.cls === GOOD) goods++;
    expect(goods).toBeGreaterThanOrEqual(0);
    expect(specials).toBeGreaterThan(0);
    expect(g.score).toBe(g.caught + specials * 2);
  });

  it('moves the basket with a finger target and with the arrow keys, inside the screen', () => {
    const g = catchGame();
    g.start(1);
    g.setTarget(40);
    for (let i = 0; i < 60; i++) g.step(STEP);
    expect(g.basketX).toBeLessThan(g.basketW / 2 + 6);
    g.setTarget(Number.NaN);
    g.setKey(1);
    for (let i = 0; i < 90; i++) g.step(STEP);
    expect(g.basketX).toBeCloseTo(g.w - g.basketW / 2, 0);
    g.setKey(-1);
    for (let i = 0; i < 20; i++) g.step(STEP);
    expect(g.basketX).toBeLessThan(g.w - g.basketW / 2);
  });

  it('Easy is a bigger basket and slower drops; reduced motion falls slower too', () => {
    const plain = catchGame();
    const easy = catchGame({ easy: true });
    const calm = catchGame({ reduced: true });
    plain.start(1); easy.start(1); calm.start(1);
    expect(easy.basketW).toBeGreaterThan(plain.basketW * 1.3);
    expect(easy.speedMul()).toBeLessThan(plain.speedMul());
    expect(calm.speedMul()).toBeLessThan(plain.speedMul());
    // The gentle ramp: faster at the end of the round, but never more than 1.6×.
    for (let i = 0; i < 60 * 44; i++) plain.step(STEP);
    expect(plain.speedMul()).toBeGreaterThan(1.4);
    expect(plain.speedMul()).toBeLessThanOrEqual(1.6);
  });

  it('the demo behind the start card plays itself and counts nothing', () => {
    const g = catchGame();
    g.demo();
    for (let i = 0; i < 60 * 15; i++) g.step(STEP);
    expect(g.score).toBe(0);
    expect(g.over).toBe(false);
    expect(g.activeCount()).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------- stack

describe('StackGame', () => {
  it('a piece dropped over the middle lands, and a bullseye counts as perfect', () => {
    const g = stackGame();
    const events: StackEvent[] = [];
    g.listener = (ev) => { events.push(ev); };
    g.start(1);
    dropAt(g, 0);
    expect(g.count).toBe(1);
    expect(g.score).toBe(1);
    expect(events).toContain('perfect');
    dropAt(g, g.pieces[0]!.x);
    expect(g.count).toBe(2);
  });

  it('a piece dropped past the edge slides off with a giggle; the tower stays', () => {
    const g = stackGame();
    const events: StackEvent[] = [];
    g.listener = (ev) => { events.push(ev); };
    g.start(2);
    dropAt(g, 0);
    dropAt(g, g.pieces[0]!.x);
    const before = g.count;
    dropAt(g, g.pieces[before - 1]!.x + g.pieces[before - 1]!.w * 0.5 + g.hangW * 0.5 + 4);
    for (let i = 0; i < 120; i++) g.step(STEP);
    expect(g.count).toBe(before);
    expect(events.some((e) => e === 'slide' || e === 'miss')).toBe(true);
  });

  it('a wobble only ever takes the top piece: the tower never collapses', () => {
    const g = stackGame({ seed: 8 });
    g.start(8);
    let maxLossAtOnce = 0;
    for (let n = 0; n < 30; n++) {
      const top = g.count > 0 ? g.pieces[g.count - 1]! : null;
      const off = top ? top.x + (n % 2 ? 1 : -1) * top.w * 0.42 : 0;
      const before = g.count;
      dropAt(g, off);
      for (let i = 0; i < 90; i++) g.step(STEP);
      maxLossAtOnce = Math.max(maxLossAtOnce, before - g.count);
      if (g.over) break;
    }
    expect(maxLossAtOnce).toBeLessThanOrEqual(1);
    expect(Math.abs(g.theta)).toBeLessThanOrEqual(0.08);
  });

  it('cheers at friendly heights and ends after 45 s', () => {
    const g = stackGame();
    const heights: number[] = [];
    let ends = 0;
    g.listener = (ev, _x, _y, n) => { if (ev === 'milestone') heights.push(n); if (ev === 'end') ends++; };
    g.start(4);
    for (let n = 0; n < 12; n++) dropAt(g, g.count > 0 ? g.pieces[g.count - 1]!.x : 0);
    expect(g.count).toBe(12);
    expect(heights).toEqual(HEIGHT_MILESTONES.filter((m) => m <= 12));
    for (let i = 0; i < 60 * 50; i++) g.step(STEP);
    expect(ends).toBe(1);
    expect(g.drop()).toBe(false);
    expect(g.count).toBeLessThanOrEqual(MAX_PIECES);
  });

  it('Easy swings slower, gives wider pieces and pulls near-misses toward the middle', () => {
    const g = stackGame({ easy: true });
    const plain = stackGame();
    expect(g.baseW).toBeGreaterThan(plain.baseW);
    g.start(6);
    dropAt(g, 0);
    const base = g.pieces[0]!;
    dropAt(g, base.x + base.w * 0.3);
    expect(g.count).toBe(2);
    expect(Math.abs(g.pieces[1]!.x - base.x)).toBeLessThan(base.w * 0.3 * 0.5);
  });

  it('the camera climbs with the tower so the ribbon always has room', () => {
    const g = stackGame();
    g.start(4);
    for (let n = 0; n < 16; n++) dropAt(g, g.count > 0 ? g.pieces[g.count - 1]!.x : 0);
    for (let i = 0; i < 120; i++) g.step(STEP);
    expect(g.camY).toBeGreaterThan(0);
    expect(g.screenY(g.top)).toBeGreaterThan(g.hangScreenY + 100);
  });

  it('the demo builds a little tower and starts over, counting nothing', () => {
    const g = stackGame();
    g.demo();
    let maxCount = 0;
    for (let i = 0; i < 60 * 20; i++) { g.step(STEP); maxCount = Math.max(maxCount, g.count); }
    expect(maxCount).toBeGreaterThan(0);
    expect(g.score).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------- skins

describe('skins', () => {
  it('every holiday gets a playable skin whose sprites all exist', () => {
    for (const meta of HOLIDAYS) {
      const theme = THEMES[meta.theme];
      const skin = skinFor(meta, theme);
      expect(skin.items.length, meta.id).toBeGreaterThan(0);
      expect(skin.oops.length, meta.id).toBeGreaterThan(0);
      expect(skin.pieceColors.length, meta.id).toBeGreaterThan(0);
      expect(PIECE_ASPECT[skin.piece], meta.id).toBeGreaterThan(0);
      for (const s of skinSprites(skin)) expect(knownSprite(s), `${meta.id}: ${s}`).toBe(true);
      for (const c of [skin.basketColor, skin.ground, ...skin.pieceColors, ...skin.items.map((d) => d.color)]) {
        expect(c, `${meta.id} colour`).toMatch(/^#[0-9a-f]{6}$/i);
      }
      expect(skin.catchNoun.length).toBeGreaterThan(0);
      expect(skin.stackNoun.length).toBeGreaterThan(0);
    }
  });

  it('every hand-made skin is for a real holiday', () => {
    for (const id of Object.keys(SKINS)) expect(byId(id), id).toBeDefined();
  });

  it('nothing sacred falls or gets caught', () => {
    const sacred = /diya|menorah|kinara|candle|crescent|cross|scripture|torah|quran|bible|deity|idol/i;
    for (const meta of HOLIDAYS) {
      for (const s of skinSprites(skinFor(meta, THEMES[meta.theme]))) expect(s, meta.id).not.toMatch(sacred);
    }
    for (const g of ['🕎', '🪔', '☪️', '✝️', '🕯️', '📿']) {
      for (const meta of HOLIDAYS) expect(skinSprites(skinFor(meta, THEMES[meta.theme]))).not.toContain(`glyph:${g}`);
    }
  });

  it('a hand-made skin overrides the theme default; silly days fall back to it', () => {
    const xmas = byId('christmas')!;
    expect(skinFor(xmas, THEMES[xmas.theme]).basket).toBe('sleigh');
    const silly = HOLIDAYS.find((m) => m.tier === 3 && !(m.id in SKINS));
    if (silly) expect(skinFor(silly, THEMES[silly.theme])).toEqual(defaultSkin(silly, THEMES[silly.theme]));
  });
});

describe('backdrop', () => {
  it('only shows a full moon where one belongs (never on new-moon Diwali or crescent Eid)', () => {
    for (const id of FULL_MOON_HOLIDAYS) expect(byId(id), id).toBeDefined();
    for (const id of ['diwali', 'eid-al-fitr', 'eid-al-adha', 'ramadan', 'christmas']) expect(FULL_MOON_HOLIDAYS.has(id)).toBe(false);
  });
});

describe('copy', () => {
  it('fills templates and never judges', () => {
    expect(fill(COPY.caught, { n: 3, noun: 'eggs' })).toBe('You caught 3 eggs!');
    expect(fill('{a} {b}', { a: 1 })).toBe('1 {b}');
    const all = JSON.stringify(COPY).toLowerCase();
    for (const bad of ['wrong', 'fail', 'lose', 'lost', 'game over', 'naughty', 'too slow', 'http', 'www.']) expect(all).not.toContain(bad);
  });
});
