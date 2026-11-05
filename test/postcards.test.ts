import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  albumEntries, albums, albumStorage, albumTitle, EMPTY_ALBUM, parseAlbum, pickPostcard, POSTCARD_KEY, postcardsReached,
  resetAlbumMemory, santaArrivals, waveArrivals, withCard,
} from '../src/world/album';
import { CITIES, type City } from '../src/world/data/cities';
import { POSTCARDS, postcardFor } from '../src/world/data/postcards';
import type { Globe } from '../src/world/globe';
import { LiveLayers } from '../src/world/live';
import { arrivalOrder, utcDayStart } from '../src/world/midnight';
import { layoutPostcard, textWidth, CARD_W, type PostcardView } from '../src/world/postcards';
import { skylineIds } from '../src/world/postcard-skylines';
import { nightness, paletteFor } from '../src/world/postcard-art';
import { santaRoute } from '../src/world/santa';
import { PLAY_STORAGE } from '../src/play/storage';

const city = (id: string): City => {
  const c = CITIES.find((x) => x.id === id);
  if (!c) throw new Error(`no city ${id}`);
  return c;
};

/** Latin script (with accents, ʻokina and the like) needs no romanization. */
const LATIN = /^[\p{Script=Latin}\p{Script=Common}\p{Mn}ʻʼ’]*$/u;

describe('postcard data lint', () => {
  it('covers at least the 28 headline cities, each once, each a real city', () => {
    const must = ['kiritimati', 'auckland', 'sydney', 'tokyo', 'seoul', 'beijing', 'manila', 'jakarta', 'bangkok', 'kolkata', 'dubai', 'nairobi',
      'moscow', 'istanbul', 'cairo', 'athens', 'paris', 'london', 'reykjavik', 'lagos', 'rio', 'buenos-aires', 'mexico-city', 'new-york',
      'chicago', 'los-angeles', 'anchorage', 'honolulu'];
    const ids = POSTCARDS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of must) expect(ids, id).toContain(id);
    for (const id of ids) expect(CITIES.some((c) => c.id === id), id).toBe(true);
  });

  it('every greeting is complete, and non-Latin scripts have a romanization', () => {
    for (const p of POSTCARDS) {
      for (const side of [p.christmas, p.newYear]) {
        const g = side.greeting;
        expect(g.text.trim(), p.id).not.toBe('');
        expect(g.sayIt.trim(), p.id).not.toBe('');
        expect(g.meaning.trim(), p.id).not.toBe('');
        expect(g.langName.trim(), p.id).not.toBe('');
        if (!LATIN.test(g.text)) expect(g.roman, `${p.id}: ${g.text}`).toBeTruthy();
        if (g.roman) expect(LATIN.test(g.roman), `${p.id}: ${g.roman}`).toBe(true);
      }
    }
  });

  it('facts are short, end like sentences, and nothing has a URL', () => {
    for (const p of POSTCARDS) {
      for (const side of [p.christmas, p.newYear]) {
        expect(side.fact.length, `${p.id}: ${side.fact}`).toBeLessThanOrEqual(220);
        expect(side.fact, p.id).toMatch(/[.!?]$/);
      }
      const all = JSON.stringify(p);
      expect(all, p.id).not.toMatch(/https?:|www\.|\.(com|org|net)\b/i);
      expect(p.skyline.length, p.id).toBeGreaterThan(20);
    }
  });

  it('every postcard city has its own drawn skyline', () => {
    const drawn = new Set(skylineIds());
    for (const p of POSTCARDS) expect(drawn.has(p.id), p.id).toBe(true);
    for (const id of drawn) expect(postcardFor(id), id).toBeDefined();
  });

  it('the album key is listed for the grown-ups page', () => {
    expect(PLAY_STORAGE.map((k) => k.key)).toContain(POSTCARD_KEY);
  });
});

describe('postcard picture and layout', () => {
  it('the sky is night at Santa time, day at noon, dusk in between', () => {
    expect(nightness(0.5)).toBe(1);
    expect(nightness(12)).toBe(0);
    expect(nightness(18.5)).toBeGreaterThan(0.3);
    expect(nightness(18.5)).toBeLessThan(0.6);
    expect(paletteFor(0).skyTop).not.toBe(paletteFor(12).skyTop);
  });

  it('every line of every card fits inside the card', () => {
    for (const p of POSTCARDS) {
      for (const kind of ['christmas', 'newyear'] as const) {
        const c = city(p.id);
        const v: PostcardView = { kind, city: c, card: p, at: Date.UTC(2026, 11, 24, 12) };
        const lay = layoutPostcard(v);
        for (const line of lay.lines) {
          expect(textWidth(line.text, line.size, line.role === 'greeting' || line.role === 'label'), `${p.id} ${line.text}`).toBeLessThanOrEqual(CARD_W - 60 + 1);
        }
        expect(lay.lines.some((l) => l.role === 'fact')).toBe(true);
        expect(lay.height).toBeGreaterThan(400);
        expect(lay.height).toBeLessThan(900);
      }
    }
  });

  it('the postmark shows the local time and date', () => {
    const tokyo = city('tokyo');
    const v: PostcardView = { kind: 'christmas', city: tokyo, card: postcardFor('tokyo')!, at: Date.UTC(2026, 11, 24, 15, 24) };
    expect(layoutPostcard(v).postmark).toEqual({ city: 'TOKYO', time: '0:24', date: '25 DEC 2026' });
  });
});

describe('album storage (jubilee.postcards.v1)', () => {
  afterEach(() => resetAlbumMemory());

  const fake = (): { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; data: Map<string, string>; writes: number } => {
    const data = new Map<string, string>();
    const s = { data, writes: 0, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { s.writes++; data.set(k, v); } };
    return s;
  };

  it('parses tolerantly: junk, unknown cities, bad keys and values are dropped', () => {
    expect(parseAlbum(null)).toEqual(EMPTY_ALBUM);
    expect(parseAlbum('{nope')).toEqual(EMPTY_ALBUM);
    expect(parseAlbum('[1,2]')).toEqual(EMPTY_ALBUM);
    const raw = JSON.stringify({ v: 1, cards: { 'christmas:2026:tokyo': 5, 'christmas:2026:atlantis': 5, 'easter:2026:paris': 5, 'newyear:2027:paris': 'x', 'newyear:2027:london': -1 } });
    expect(parseAlbum(raw).cards).toEqual({ 'christmas:2026:tokyo': 5 });
  });

  it('keeps the first visit when the same card comes again, and groups albums newest first', () => {
    let s = withCard(EMPTY_ALBUM, { kind: 'christmas', year: 2025, cityId: 'tokyo', at: 100 });
    s = withCard(s, { kind: 'christmas', year: 2025, cityId: 'tokyo', at: 999 });
    s = withCard(s, { kind: 'newyear', year: 2026, cityId: 'auckland', at: 300 });
    s = withCard(s, { kind: 'christmas', year: 2025, cityId: 'paris', at: 200 });
    s = withCard(s, { kind: 'christmas', year: 2025, cityId: 'atlantis', at: 200 });
    expect(albumEntries(s, 'christmas').map((e) => [e.cityId, e.at])).toEqual([['tokyo', 100], ['paris', 200]]);
    expect(albums(s).map((g) => albumTitle(g.kind, g.year))).toEqual(['Postcards from New Year 2026', 'Postcards from Christmas Eve 2025']);
  });

  it('saves to its own key, and survives a reload', () => {
    const st = fake();
    const a = albumStorage(false, st);
    expect(a.add({ kind: 'christmas', year: 2026, cityId: 'london', at: 1 })).toBe(true);
    expect(a.add({ kind: 'christmas', year: 2026, cityId: 'london', at: 2 })).toBe(false);
    expect([...st.data.keys()]).toEqual([POSTCARD_KEY]);
    expect(albumStorage(false, st).read().cards).toEqual({ 'christmas:2026:london': 1 });
  });

  it('writes nothing while pretending, but remembers the cards for the visit', () => {
    const st = fake();
    const a = albumStorage(true, st);
    expect(a.add({ kind: 'newyear', year: 2027, cityId: 'sydney', at: 5 })).toBe(true);
    expect(st.writes).toBe(0);
    expect(albumStorage(true, st).read().cards).toEqual({ 'newyear:2027:sydney': 5 });
  });

  it('a storage that throws never breaks the tracker', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('full'); } };
    const a = albumStorage(false, broken);
    expect(a.read()).toEqual(EMPTY_ALBUM);
    expect(a.add({ kind: 'christmas', year: 2026, cityId: 'cairo', at: 9 })).toBe(true);
    expect(a.read().cards).toEqual({ 'christmas:2026:cairo': 9 });
    expect(albumStorage(false, null).read().cards).toEqual({ 'christmas:2026:cairo': 9 });
  });
});

describe('which stop sends which card', () => {
  const route = santaRoute(2026, CITIES, '');

  it('Santa: moving onto leg k means stop k was just reached; the first sync replays nothing', () => {
    expect(santaArrivals(route.stops, -2, 5)).toEqual([]);
    const k = route.stops.findIndex((s) => s.city?.id === 'tokyo');
    expect(k).toBeGreaterThan(0);
    const got = santaArrivals(route.stops, k - 1, k);
    expect(got.map((a) => a.city.id)).toEqual(['tokyo']);
    expect(got[0]!.at).toBe(route.stops[k]!.at);
    expect(pickPostcard(got)?.card.id).toBe('tokyo');
  });

  it('Santa: every headline city on the route sends exactly one card over the whole night', () => {
    const sent: string[] = [];
    for (let leg = 1; leg < route.stops.length; leg++) for (const p of postcardsReached(santaArrivals(route.stops, leg - 1, leg))) sent.push(p.city.id);
    expect(sent.sort()).toEqual(POSTCARDS.map((p) => p.id).sort());
  });

  it('a city without a postcard sends nothing; a giant step (a sleeping tab) sends only the latest card', () => {
    expect(postcardsReached([{ city: city('apia'), at: 1 }])).toEqual([]);
    const many = ['tokyo', 'seoul', 'beijing', 'manila', 'jakarta', 'bangkok'].map((id, i) => ({ city: city(id), at: i }));
    expect(postcardsReached(many).map((p) => p.city.id)).toEqual(['bangkok']);
    expect(postcardsReached(many.slice(0, 2)).map((p) => p.city.id)).toEqual(['tokyo', 'seoul']);
  });

  it('the New Year wave: the arrived count moving from 3 to 5 sends cities 3 and 4', () => {
    const target = { y: 2027, m: 1, d: 1 };
    const order = arrivalOrder(CITIES, new Date(utcDayStart(target)), target);
    const cities = order.map((o) => o.city);
    const times = order.map((o) => o.at.getTime());
    expect(waveArrivals(cities, times, -1, 4)).toEqual([]);
    const got = waveArrivals(cities, times, 3, 5);
    expect(got.map((a) => a.city.id)).toEqual([cities[3]!.id, cities[4]!.id]);
    expect(got[1]!.at).toBe(times[4]);
    expect(cities[0]!.id).toBe('kiritimati');
    expect(pickPostcard(waveArrivals(cities, times, 0, 1))?.card.id).toBe('kiritimati');
  });
});

describe('LiveLayers reports arrivals and holds the show clock', () => {
  afterEach(() => vi.restoreAllMocks());

  const noop = (): void => {};
  const fakeGlobe = { setNewDay: noop, followTo: noop, setTrail: noop, setTrailHead: noop, invalidate: noop, setTime: noop } as unknown as Globe;

  it('the replay sends Santa’s stops in order; holding the clock stops the sleigh', () => {
    let t = 1_000;
    vi.spyOn(performance, 'now').mockImplementation(() => t);
    const got: { kind: string; ids: string[]; year: number }[] = [];
    const live = new LiveLayers({
      globe: fakeGlobe, cities: CITIES, zone: 'Europe/London', now: () => new Date(Date.UTC(2026, 9, 22)), onMarkers: noop,
      onArrive: (kind, reached, year) => got.push({ kind, ids: reached.map((r) => r.city.id), year }),
    });
    const today = { y: 2026, m: 10, d: 22 };
    expect(live.toggle('santa', today)).toBe('santa');
    live.sync(today);
    expect(got).toEqual([]);
    // Ten minutes of the night pass every real second: step a second at a time for 40 s.
    for (let i = 0; i < 40; i++) { t += 1000; live.sync(today); }
    expect(got.length).toBeGreaterThan(3);
    expect(got.every((g) => g.kind === 'santa' && g.year === 2025)).toBe(true);
    const flat = got.flatMap((g) => g.ids);
    expect(flat[0]).toBe('kiritimati');
    // Held: nothing moves however long the card stays up.
    live.hold(true);
    const before = live.clock('santa').getTime();
    const n = got.length;
    for (let i = 0; i < 20; i++) { t += 1000; live.sync(today); }
    expect(live.clock('santa').getTime()).toBe(before);
    expect(got.length).toBe(n);
    // Released: it carries on from exactly where it stood.
    live.hold(false);
    expect(live.clock('santa').getTime()).toBe(before);
    t += 1000;
    live.sync(today);
    expect(live.clock('santa').getTime()).toBeGreaterThan(before);
  });

  it('the New Year show sends the wave, starting with Kiritimati', () => {
    let t = 50_000;
    vi.spyOn(performance, 'now').mockImplementation(() => t);
    const got: string[] = [];
    let year = 0;
    const live = new LiveLayers({
      globe: fakeGlobe, cities: CITIES, zone: 'Europe/London', now: () => new Date(Date.UTC(2026, 9, 22)), onMarkers: noop,
      onArrive: (kind, reached, y) => { expect(kind).toBe('wave'); year = y; got.push(...reached.map((r) => r.city.id)); },
    });
    const today = { y: 2026, m: 10, d: 22 };
    live.toggle('wave', today);
    live.sync(today);
    for (let i = 0; i < 30; i++) { t += 1000; live.sync(today); }
    expect(got[0]).toBe('kiritimati');
    expect(year).toBe(2027);
  });
});
