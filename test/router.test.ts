import { describe, expect, it } from 'vitest';
import { formatRoute, parseHash, parseQuery, Router, type Route, type RouterHost } from '../src/app/router';

describe('router: parseHash / formatRoute', () => {
  const shapes: Route[] = [
    { view: 'home' },
    { view: 'parade' },
    { view: 'parade', tag: 'lights' },
    { view: 'parade', tag: 'mine', sort: 'az' },
    { view: 'parade', sort: 'month' },
    { view: 'holiday', id: 'halloween' },
    { view: 'holiday', id: 'day-of-the-dead', section: 'make' },
    { view: 'recipe', id: 'halloween', recipeId: 'banana-ghosts' },
    { view: 'year' },
    { view: 'year', year: 2026 },
    { view: 'stickers' },
    { view: 'grownups' },
    { view: 'world' },
    { view: 'world', id: 'christmas' },
    { view: 'play', id: 'diwali', activity: 'doors' },
    { view: 'play', id: 'christmas', activity: 'wish' },
  ];

  it('round-trips every route shape', () => {
    for (const r of shapes) expect(parseHash(formatRoute(r))).toEqual(r);
  });

  it('formats the documented hash forms', () => {
    expect(formatRoute({ view: 'home' })).toBe('#/');
    expect(formatRoute({ view: 'parade', tag: 'lights', sort: 'az' })).toBe('#/holidays?tag=lights&sort=az');
    expect(formatRoute({ view: 'holiday', id: 'diwali', section: 'say' })).toBe('#/h/diwali?s=say');
    expect(formatRoute({ view: 'recipe', id: 'diwali', recipeId: 'ladoo' })).toBe('#/h/diwali/make/ladoo');
    expect(formatRoute({ view: 'year', year: 2030 })).toBe('#/year/2030');
    expect(formatRoute({ view: 'world' })).toBe('#/world');
    expect(formatRoute({ view: 'world', id: 'lunar-new-year' })).toBe('#/world/lunar-new-year');
    expect(formatRoute({ view: 'play', id: 'holi', activity: 'color' })).toBe('#/h/holi/play/color');
  });

  it('treats empty, "#", "#/" and unknown hashes as home', () => {
    for (const hash of ['', '#', '#/', '#/nope', '#/h', '#/h/x/y', '#/h/x/make', '#/stickers/extra', '#/holidays/extra', '#/h/bad id', '#/h/holi/play/nope', '#/h/holi/play'])
      expect(parseHash(hash)).toEqual({ view: 'home' });
  });

  it('drops invalid parade query values and keeps valid ones', () => {
    expect(parseHash('#/holidays?tag=lights&sort=az')).toEqual({ view: 'parade', tag: 'lights', sort: 'az' });
    expect(parseHash('#/holidays?tag=bogus&sort=soon')).toEqual({ view: 'parade', sort: 'soon' });
    expect(parseHash('#/holidays?sort=sideways')).toEqual({ view: 'parade' });
    expect(parseHash('#/holidays?tag=mine')).toEqual({ view: 'parade', tag: 'mine' });
  });

  it('validates sections and years', () => {
    expect(parseHash('#/h/holi?s=facts')).toEqual({ view: 'holiday', id: 'holi', section: 'facts' });
    expect(parseHash('#/h/holi?s=nope')).toEqual({ view: 'holiday', id: 'holi' });
    expect(parseHash('#/year/abcd')).toEqual({ view: 'year' });
    expect(parseHash('#/year/2026/')).toEqual({ view: 'year', year: 2026 });
    expect(parseHash('#/h/custom-abc123')).toEqual({ view: 'holiday', id: 'custom-abc123' });
    expect(parseHash('#/h/lunar%2Dnew%2Dyear')).toEqual({ view: 'holiday', id: 'lunar-new-year' });
  });

  it('world: an optional holiday id, junk falls back to the bare globe', () => {
    expect(parseHash('#/world')).toEqual({ view: 'world' });
    expect(parseHash('#/world/')).toEqual({ view: 'world' });
    expect(parseHash('#/world/diwali')).toEqual({ view: 'world', id: 'diwali' });
    expect(parseHash('#/world/bad id')).toEqual({ view: 'world' });
    expect(parseHash('#/world/a/b')).toEqual({ view: 'world' });
  });
});

describe('router: parseQuery', () => {
  it('accepts valid flags', () => {
    expect(parseQuery('?today=2030-10-31&region=GB&motion=off')).toEqual({ today: { y: 2030, m: 10, d: 31 }, region: 'GB', motion: 'off' });
    expect(parseQuery('today=2024-01-01')).toEqual({ today: { y: 2024, m: 1, d: 1 } });
    expect(parseQuery('?region=gb&motion=ON')).toEqual({ region: 'GB', motion: 'on' });
  });

  it('rejects dates outside 2024–2035, impossible dates and junk', () => {
    expect(parseQuery('?today=2023-12-31')).toEqual({});
    expect(parseQuery('?today=2036-01-01')).toEqual({});
    expect(parseQuery('?today=2025-02-30')).toEqual({});
    expect(parseQuery('?today=yesterday')).toEqual({});
    expect(parseQuery('?today=2025-1-1')).toEqual({});
    expect(parseQuery('?region=XX&motion=maybe')).toEqual({});
    expect(parseQuery('')).toEqual({});
  });
});

/** In-memory stand-in for location/history/window so the Router runs under Node. */
function fakeHost(initial = '') {
  let hash = initial;
  let y = 0;
  let listener: (() => void) | null = null;
  const log: string[] = [];
  const host: RouterHost = {
    getHash: () => hash,
    push: (h) => { hash = h; listener?.(); },
    replace: (h) => { hash = h; },
    listen: (cb) => { listener = cb; return () => { listener = null; }; },
    scrollY: () => y,
    scrollTo: (to) => { y = to; log.push(`scroll:${to}`); },
    settle: (route) => { log.push(`settle:${route.view}`); },
  };
  return {
    host, log,
    get hash() { return hash; },
    setScroll(v: number) { y = v; },
    /** Simulate the browser Back button: the hash changes without navigate(). */
    browserBack(to: string) { hash = to; listener?.(); },
  };
}

describe('router: Router', () => {
  it('emits the initial route on start without scrolling or settling', () => {
    const f = fakeHost('#/stickers');
    const r = new Router(f.host);
    const seen: string[] = [];
    r.onChange((route, nav) => seen.push(`${route.view}:${nav.initial ? 'initial' : 'later'}`));
    r.start();
    expect(r.current).toEqual({ view: 'stickers' });
    expect(seen).toEqual(['stickers:initial']);
    expect(f.log).toEqual([]);
  });

  it('normalizes an unknown hash to #/ on start', () => {
    const f = fakeHost('#/what');
    const r = new Router(f.host);
    r.start();
    expect(f.hash).toBe('#/');
    expect(r.current).toEqual({ view: 'home' });
  });

  it('forward navigation scrolls to top, settles, and back restores scroll', () => {
    const f = fakeHost('#/');
    const r = new Router(f.host);
    const seen: string[] = [];
    r.onChange((route, nav) => seen.push(`${route.view}${nav.back ? ':back' : ''}`));
    r.start();
    f.setScroll(420);
    r.navigate({ view: 'holiday', id: 'halloween' });
    expect(f.hash).toBe('#/h/halloween');
    expect(r.current).toEqual({ view: 'holiday', id: 'halloween' });
    expect(f.log).toEqual(['scroll:0', 'settle:holiday']);
    f.setScroll(900);
    f.browserBack('#/');
    expect(seen).toEqual(['home', 'holiday', 'home:back']);
    expect(f.log.at(-2)).toBe('scroll:420');
    expect(f.log.at(-1)).toBe('settle:home');
    // Forward again to the holiday page restores nothing: a fresh visit starts at the top.
    r.navigate({ view: 'holiday', id: 'halloween' });
    expect(f.log.at(-2)).toBe('scroll:0');
  });

  it('replace does not grow the back stack', () => {
    const f = fakeHost('#/');
    const r = new Router(f.host);
    r.start();
    r.navigate({ view: 'parade' });
    r.navigate({ view: 'parade', tag: 'lights' }, { replace: true });
    expect(f.hash).toBe('#/holidays?tag=lights');
    expect(r.current).toEqual({ view: 'parade', tag: 'lights' });
    const seen: string[] = [];
    r.onChange((_route, nav) => seen.push(nav.back ? 'back' : 'fwd'));
    f.browserBack('#/');
    expect(seen).toEqual(['back']);
    expect(r.current).toEqual({ view: 'home' });
  });

  it('navigating to the current route just scrolls to the top', () => {
    const f = fakeHost('#/year');
    const r = new Router(f.host);
    r.start();
    let changes = 0;
    r.onChange(() => { changes += 1; });
    r.navigate({ view: 'year' });
    expect(changes).toBe(0);
    expect(f.log).toEqual(['scroll:0']);
  });
});
