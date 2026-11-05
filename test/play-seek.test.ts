import { describe, expect, it } from 'vitest';
import {
  ART_H, ART_W, MAX_ZOOM, MIN_SLOP, bandCenter, clampView, coverScale, coverView, cropFor, decay, easeOut, focusView,
  HINT_RADIUS, fxOpacity, hintCircle, hintDisc, hitTest, isVisible, lerpView, panBy, pinchView, refit, releaseVelocity, scaleLimits,
  screenToArt, artToScreen, tapSlop, wheelFactor, zoomAt, type Viewport,
} from '../src/play/seek/geometry';
import { EMPTY_SAVE, SEEK_KEY, parseSave, resumeFound, sceneProgress, seekStorage, withFound, withRoundDone } from '../src/play/seek/progress';
import { capital, say, thing } from '../src/play/seek/copy';
import { MIN_FINDABLES, resolveScene, setSeekSceneOverride, usableFindables } from '../src/play/seek/scene';

const PHONE: Viewport = { w: 390, h: 844, top: 76, bottom: 170 };
const DESK: Viewport = { w: 1280, h: 800, top: 80, bottom: 170 };
const close = (a: number, b: number, eps = 1e-6): void => { expect(Math.abs(a - b)).toBeLessThan(eps); };

describe('cover layout (object-fit: cover; object-position: 50% 100%)', () => {
  it('phone: height-limited, centered, shows the x 520–1080 safe zone', () => {
    const v = coverView(PHONE);
    close(v.s, 844 / 900);
    close(v.oy, 0);
    const left = screenToArt(v, { x: 0, y: 0 }).x;
    const right = screenToArt(v, { x: PHONE.w, y: 0 }).x;
    close((left + right) / 2, ART_W / 2);
    expect(left).toBeLessThan(600);
    expect(right).toBeGreaterThan(1000);
  });
  it('desktop: width-limited crops the top, bottom edge on the stage bottom', () => {
    const vp: Viewport = { w: 1600, h: 600, top: 0, bottom: 0 };
    const v = coverView(vp);
    close(v.s, 1);
    close(v.ox, 0);
    close(v.oy + ART_H * v.s, 600);
    close(screenToArt(v, { x: 0, y: 0 }).y, 300);
  });
  it('screen ↔ artboard round-trips', () => {
    const v = { s: 1.7, ox: -400, oy: -120 };
    const p = { x: 812.5, y: 433.25 };
    const back = artToScreen(v, screenToArt(v, p));
    close(back.x, p.x);
    close(back.y, p.y);
  });
});

describe('clamping and zoom', () => {
  it('limits: min fits the whole artboard between the bars, max is 4× cover', () => {
    const lim = scaleLimits(PHONE);
    close(lim.cover, coverScale(PHONE));
    close(lim.max, lim.cover * MAX_ZOOM);
    close(lim.min, 390 / 1600);
  });
  it('never shows a gap at the sides', () => {
    const v = clampView({ s: coverScale(DESK), ox: 500, oy: 0 }, DESK);
    close(v.ox, 0);
    const v2 = clampView({ s: coverScale(DESK), ox: -5000, oy: 0 }, DESK);
    close(v2.ox + ART_W * v2.s, DESK.w);
  });
  it('lets the bottom of the picture rise above the strip, and no further', () => {
    const v = panBy(coverView(PHONE), PHONE, 0, -1000);
    close(v.oy + ART_H * v.s, PHONE.h - PHONE.bottom);
    const up = panBy(coverView(PHONE), PHONE, 0, 1000);
    close(up.oy, PHONE.top);
  });
  it('centers the picture when zoomed out smaller than the room', () => {
    const v = clampView({ s: 0.01, ox: 0, oy: 0 }, PHONE);
    const lim = scaleLimits(PHONE);
    close(v.s, lim.min);
    close(v.ox, (PHONE.w - ART_W * v.s) / 2);
    close(v.oy + (ART_H * v.s) / 2, (PHONE.top + PHONE.h - PHONE.bottom) / 2);
  });
  it('zoomAt keeps the artboard point under the anchor', () => {
    const v = coverView(DESK);
    const anchor = { x: 700, y: 400 };
    const a0 = screenToArt(v, anchor);
    const z = zoomAt(v, DESK, 2, anchor);
    const a1 = screenToArt(z, anchor);
    close(z.s, v.s * 2);
    close(a1.x, a0.x, 1e-6);
    close(a1.y, a0.y, 1e-6);
  });
  it('zoom is clamped to the limits', () => {
    const lim = scaleLimits(DESK);
    close(zoomAt(coverView(DESK), DESK, 100, { x: 10, y: 10 }).s, lim.max);
    close(zoomAt(coverView(DESK), DESK, 0.001, { x: 10, y: 10 }).s, lim.min);
  });
  it('pinch: scale follows finger distance, the midpoint keeps its spot', () => {
    const start = coverView(DESK);
    const a0 = { x: 500, y: 400 }, b0 = { x: 700, y: 400 };
    const a1 = { x: 450, y: 420 }, b1 = { x: 850, y: 420 };
    const v = pinchView(start, DESK, a0, b0, a1, b1);
    close(v.s, start.s * 2);
    const artMid = screenToArt(start, { x: 600, y: 400 });
    const now = artToScreen(v, artMid);
    close(now.x, 650, 1e-6);
    close(now.y, 420, 1e-6);
  });
  it('wheel down zooms out, up zooms in, and huge deltas are tamed', () => {
    expect(wheelFactor(100, false)).toBeLessThan(1);
    expect(wheelFactor(-100, false)).toBeGreaterThan(1);
    close(wheelFactor(10000, false), wheelFactor(240, false));
    expect(wheelFactor(-10, true)).toBeGreaterThan(wheelFactor(-10, false));
  });
  it('focusView centers a spot in the band (when the clamp allows)', () => {
    const p = { x: 800, y: 500 };
    const v = focusView(DESK, p, coverScale(DESK) * 2);
    const s = artToScreen(v, p);
    const c = bandCenter(DESK);
    close(s.x, c.x, 1e-6);
    close(s.y, c.y, 1e-6);
    expect(isVisible(v, DESK, p)).toBe(true);
  });
  it('focusView near an edge stays clamped instead of showing a gap', () => {
    const v = focusView(DESK, { x: 10, y: 890 }, coverScale(DESK) * 2);
    close(v.ox, 0);
    expect(v.oy + ART_H * v.s).toBeGreaterThanOrEqual(DESK.h - DESK.bottom - 1e-6);
  });
  it('refit keeps the same spot in the middle at the same zoom ratio after a resize', () => {
    const v = focusView(DESK, { x: 900, y: 600 }, coverScale(DESK) * 2);
    const to: Viewport = { w: 1024, h: 700, top: 80, bottom: 170 };
    const r = refit(v, DESK, to);
    close(r.s / coverScale(to), 2, 1e-9);
    const mid = screenToArt(r, bandCenter(to));
    close(mid.x, 900, 1e-6);
    close(mid.y, 600, 1e-6);
  });
});

describe('hit-testing (in artboard units)', () => {
  const items = [
    { id: 'cat', x: 720, y: 600, r: 34 },
    { id: 'kite', x: 1120, y: 420, r: 40 },
    { id: 'owl', x: 760, y: 610, r: 30 },
  ];
  it('a tap inside r finds it; slop makes a near-miss count', () => {
    expect(hitTest(items, { x: 1120, y: 420 }, 0, new Set())).toEqual({ id: 'kite', already: false });
    expect(hitTest(items, { x: 1120 + 40 + 10, y: 420 }, 0, new Set())).toBeNull();
    expect(hitTest(items, { x: 1120 + 40 + 10, y: 420 }, 12, new Set())).toEqual({ id: 'kite', already: false });
  });
  it('a tap on empty sky is a miss', () => {
    expect(hitTest(items, { x: 100, y: 100 }, tapSlop(1), new Set())).toBeNull();
  });
  it('overlapping: the nearest (relative to size) wins, and unfound beats found', () => {
    expect(hitTest(items, { x: 725, y: 600 }, 10, new Set())?.id).toBe('cat');
    expect(hitTest(items, { x: 755, y: 608 }, 10, new Set())?.id).toBe('owl');
    expect(hitTest(items, { x: 725, y: 600 }, 30, new Set(['cat']))).toEqual({ id: 'owl', already: false });
    expect(hitTest([items[0]!], { x: 720, y: 600 }, 0, new Set(['cat']))).toEqual({ id: 'cat', already: true });
  });
  it('slop is about half a fingertip in screen px, generous when zoomed out, floored when zoomed in', () => {
    expect(tapSlop(0.25)).toBeGreaterThan(tapSlop(1));
    close(tapSlop(1000), MIN_SLOP);
    // At the phone cover scale a fingertip-wide wobble (≈13 px) is covered.
    const s = coverScale(PHONE);
    expect(tapSlop(s) * s).toBeGreaterThanOrEqual(13);
  });
  it('a tap on the phone screen maps through the transform to the right findable', () => {
    const v = coverView(PHONE);
    const screen = artToScreen(v, { x: 720, y: 600 });
    const hit = hitTest(items, screenToArt(v, { x: screen.x + 8, y: screen.y - 8 }), tapSlop(v.s), new Set());
    expect(hit?.id).toBe('cat');
    const zoomed = zoomAt(v, PHONE, 3, { x: 200, y: 400 });
    const s2 = artToScreen(zoomed, { x: 760, y: 610 });
    expect(hitTest(items, screenToArt(zoomed, s2), tapSlop(zoomed.s), new Set())?.id).toBe('owl');
  });
});

describe('motion helpers', () => {
  it('inertia decays and stops', () => {
    let v = { vx: 1200, vy: -300, moving: true };
    let steps = 0;
    while (v.moving && steps < 1000) { v = decay(v.vx, v.vy, 1 / 60); steps++; }
    expect(v.moving).toBe(false);
    expect(v.vx).toBe(0);
    expect(steps).toBeLessThan(120);
  });
  it('release velocity uses the last 100 ms and is capped', () => {
    const samples = [{ t: 0, x: 0, y: 0 }, { t: 500, x: 10, y: 0 }, { t: 550, x: 30, y: 0 }, { t: 600, x: 50, y: 0 }];
    const v = releaseVelocity(samples);
    close(v.vx, 400, 1e-6);
    close(v.vy, 0);
    const fast = releaseVelocity([{ t: 0, x: 0, y: 0 }, { t: 20, x: 400, y: 0 }]);
    close(Math.hypot(fast.vx, fast.vy), 3000, 1e-6);
    expect(releaseVelocity([])).toEqual({ vx: 0, vy: 0 });
  });
  it('ease and lerp hit their ends', () => {
    close(easeOut(0), 0);
    close(easeOut(1), 1);
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
    const a = { s: 1, ox: 0, oy: 0 }, b = { s: 4, ox: -100, oy: 50 };
    expect(lerpView(a, b, 0)).toEqual(a);
    const end = lerpView(a, b, 1);
    close(end.s, 4);
    close(lerpView(a, b, 0.5).s, 2);
  });
  it('ambient effect fades out as the child zooms away from the hero framing', () => {
    close(fxOpacity(coverView(DESK), DESK), 1);
    close(fxOpacity(zoomAt(coverView(DESK), DESK, 2, { x: 0, y: 0 }), DESK), 0);
  });
});

describe('cards and hints', () => {
  it('the card crop centers the findable in the thumbnail', () => {
    const f = { x: 720, y: 600, r: 34 };
    const c = cropFor(f, 64);
    const k = c.width / ART_W;
    close(c.height / ART_H, k);
    close(c.left + f.x * k, 32, 1e-9);
    close(c.top + f.y * k, 32, 1e-9);
    expect(64 / k).toBeGreaterThanOrEqual(2 * f.r);
  });
  it('the hint glow covers the findable but its middle never does', () => {
    const f = { x: 500, y: 500, r: 30 };
    for (let seed = 1; seed < 20; seed++) {
      const c = hintCircle(f, seed);
      const d = Math.hypot(c.x - f.x, c.y - f.y);
      expect(c.r).toBeGreaterThanOrEqual(HINT_RADIUS);
      expect(d).toBeGreaterThan(f.r);
      expect(c.r).toBeGreaterThanOrEqual(d + f.r);
    }
  });
});

describe('hint disc on screen', () => {
  const f = { x: 800, y: 600, r: 24 };
  const c = hintCircle(f, 3);
  it('at the opening framing on a big screen it is the hint circle, off-center from the thing', () => {
    const v = coverView(DESK);
    const g = hintDisc(v, DESK, c, f);
    close(g.d, c.r * 2 * v.s);
    const p = artToScreen(v, c);
    close(g.x, p.x);
    close(g.y, p.y);
  });
  it('zoomed right in it is capped to the band but still never centered on the thing', () => {
    const lim = scaleLimits(PHONE);
    const v = focusView(PHONE, f, lim.max);
    const g = hintDisc(v, PHONE, c, f);
    const thingR = f.r * v.s;
    expect(g.d).toBeLessThanOrEqual(Math.max(0.9 * Math.min(PHONE.w, PHONE.h - PHONE.top - PHONE.bottom), f.r * 4.6 * v.s) + 1e-6);
    const p = artToScreen(v, f);
    const off = Math.hypot(g.x - p.x, g.y - p.y);
    expect(off).toBeGreaterThan(thingR);
    expect(g.d / 2).toBeGreaterThanOrEqual(off + thingR - 1e-6);
  });
});

describe('progress (jubilee.seek.v1)', () => {
  const ids = ['cat', 'kite', 'owl', 'duck'];
  it('parses junk as a fresh start and drops bad entries', () => {
    expect(parseSave(null)).toEqual(EMPTY_SAVE);
    expect(parseSave('{nope')).toEqual(EMPTY_SAVE);
    expect(parseSave('[]')).toEqual(EMPTY_SAVE);
    const p = parseSave(JSON.stringify({ v: 1, scenes: { christmas: { found: ['cat', 3, 'cat', 'BAD ID'], done: '2026-12-25', rounds: 2 }, 'Bad Id': {} } }));
    expect(p.scenes).toEqual({ christmas: { found: ['cat'], done: '2026-12-25', rounds: 2 } });
  });
  it('remembers a round in progress and resumes it', () => {
    let s = withFound(EMPTY_SAVE, 'christmas', ['cat', 'owl', 'ghost'], ids);
    expect(sceneProgress(s, 'christmas').found).toEqual(['cat', 'owl']);
    s = parseSave(JSON.stringify(s));
    expect(resumeFound(s, 'christmas', ids)).toEqual(['cat', 'owl']);
    expect(resumeFound(s, 'christmas', ['cat'])).toEqual([]);
  });
  it('a finished round keeps the first day, counts rounds and starts fresh next time', () => {
    let s = withFound(EMPTY_SAVE, 'diwali', ids, ids);
    s = withRoundDone(s, 'diwali', '2026-11-08');
    s = withRoundDone(s, 'diwali', '2026-11-09');
    expect(sceneProgress(s, 'diwali')).toEqual({ found: [], done: '2026-11-08', rounds: 2 });
    expect(resumeFound(s, 'diwali', ids)).toEqual([]);
  });
  it('never writes while pretending, and survives a throwing storage', () => {
    const store = new Map<string, string>();
    const fake = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); } };
    const pretend = seekStorage(true, fake);
    const s = withRoundDone(EMPTY_SAVE, 'easter', '2026-04-05');
    expect(pretend.write(s)).toBe(false);
    expect(store.has(SEEK_KEY)).toBe(false);
    expect(sceneProgress(pretend.read(), 'easter').rounds).toBe(1);
    const real = seekStorage(false, fake);
    expect(real.write(s)).toBe(true);
    expect(sceneProgress(seekStorage(false, fake).read(), 'easter').done).toBe('2026-04-05');
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); } };
    const b = seekStorage(false, broken);
    expect(b.read()).toEqual(EMPTY_SAVE);
    expect(b.write(s)).toBe(false);
    expect(sceneProgress(b.read(), 'easter').rounds).toBe(1);
  });
});

describe('words', () => {
  it('fills slots and handles articles', () => {
    expect(say('count', { n: 2, total: 6 })).toBe('2 of 6 found');
    expect(thing('a sleepy cat')).toBe('sleepy cat');
    expect(thing('The kite')).toBe('kite');
    expect(capital(thing('an owl'))).toBe('Owl');
  });
});

describe('scene selection', () => {
  const layers = [{ name: 'mid' as const, url: '/mid.svg', depth: 0.5 }];
  const f = (id: string, x = 100, y = 100) => ({ id, label: id, x, y, r: 20 });
  it('drops findables outside the artboard, duplicates and zero radii', () => {
    const list = usableFindables([f('a'), f('a'), f('b', 1700), { ...f('c'), r: 0 }, f('d', 1600, 900)]);
    expect(list.map((x) => x.id)).toEqual(['a', 'd']);
  });
  it('needs a mid layer and enough findables; the demo override applies to every holiday', () => {
    setSeekSceneOverride({ layers, findables: [f('a'), f('b')] });
    expect(resolveScene('christmas')).toBeNull();
    setSeekSceneOverride({ layers, findables: Array.from({ length: MIN_FINDABLES }, (_, i) => f(`x${i}`)) });
    expect(resolveScene('christmas')?.findables).toHaveLength(MIN_FINDABLES);
    expect(resolveScene('diwali')).not.toBeNull();
    setSeekSceneOverride({ layers: [{ name: 'back', url: '/b.svg', depth: 0.2 }], findables: Array.from({ length: 5 }, (_, i) => f(`x${i}`)) });
    expect(resolveScene('christmas')).toBeNull();
    setSeekSceneOverride(null);
  });
});
