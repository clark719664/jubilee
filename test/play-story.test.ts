import { afterEach, describe, expect, it, vi } from 'vitest';
import diwaliContent from '../src/content/holidays/diwali';
import hanukkahContent from '../src/content/holidays/hanukkah';
import { byId } from '../src/content/registry';
import { BOOKS, bookFor } from '../src/play/story/books/index';
import { cameraWindow, insideArtboard, layerBox, panCamera, relTransform, viewFor } from '../src/play/story/camera';
import {
  FRIEND_INPUT_MAX, FRIEND_MAX, NAME_FALLBACK, NAME_MAX, SENTENCE_MAX, bookTitle, capWords, cleanFriend, cleanName,
  fillSentence, pageSentences, pageTemplate, splitSentences, starring, usesFriend, who, wordAt, wordSpans, type Who,
} from '../src/play/story/text';
import { ARTBOARD, type Camera } from '../src/play/story/types';
import { keepFor, sanitizeKeep } from '../src/play/story/text';
import { keepStory, keptItem, storyTitle, takeDownTap } from '../src/play/story/keep';
import { pictureCamera } from '../src/play/story/picture';
import { ReadAloud } from '../src/play/story/reader';
import { storyActivity } from '../src/play/story/index';
import { FRIDGE_CAP, Fridge } from '../src/play/fridge';

const TWELVE = [
  'christmas', 'hanukkah', 'diwali', 'eid-al-fitr', 'lunar-new-year', 'halloween', 'thanksgiving', 'holi',
  'day-of-the-dead', 'kwanzaa', 'nowruz', 'mid-autumn-festival',
];
const LONG = { name: 'W'.repeat(NAME_MAX), friend: 'W'.repeat(FRIEND_MAX) };
const WHO_CASES = [{}, { name: 'Maya' }, { friend: 'Sam' }, { name: 'Maya', friend: 'Sam' }, LONG, { name: LONG.name }];

describe('the bookshelf', () => {
  it('has a book for each of the twelve holidays, each a real holiday id', () => {
    expect(BOOKS.map((b) => b.id).sort()).toEqual([...TWELVE].sort());
    for (const id of TWELVE) {
      expect(bookFor(id)?.id).toBe(id);
      expect(byId(id), id).toBeDefined();
    }
    expect(bookFor('easter')).toBeUndefined();
  });

  for (const book of BOOKS) {
    describe(book.id, () => {
      it('has 6–8 pages', () => {
        expect(book.pages.length).toBeGreaterThanOrEqual(6);
        expect(book.pages.length).toBeLessThanOrEqual(8);
      });

      it('has 1–2 sentences per page, each ≤ 180 characters with the longest names, and none without', () => {
        for (const w of WHO_CASES) {
          book.pages.forEach((p, i) => {
            const s = pageSentences(p, w);
            expect(s.length, `${book.id} p${i + 1}`).toBeGreaterThanOrEqual(1);
            expect(s.length, `${book.id} p${i + 1}: ${s.join(' | ')}`).toBeLessThanOrEqual(2);
            for (const x of s) expect(x.length, `${book.id} p${i + 1}: ${x}`).toBeLessThanOrEqual(SENTENCE_MAX);
          });
        }
      });

      it('renders with and without names: no braces left, the fallback reads naturally', () => {
        for (const w of WHO_CASES) {
          const all = [bookTitle(book, w), ...book.pages.flatMap((p) => pageSentences(p, w))];
          for (const s of all) {
            expect(s, s).not.toMatch(/[{}]/);
            expect(s, s).not.toMatch(/undefined|null|\ba friend\b/);
            expect(s, s).toMatch(/^[‘“'"(]*[\p{Lu}\d]/u);
          }
        }
        const anon = book.pages.flatMap((p) => pageSentences(p, {})).join(' ');
        expect(anon).toContain(NAME_FALLBACK);
        expect(bookTitle(book, {})).not.toContain('our hero');
        const named = book.pages.flatMap((p) => pageSentences(p, { name: 'Maya', friend: 'Sam' })).join(' ');
        expect(named).toContain('Maya');
        expect(named).toContain('Sam');
        expect(named).not.toContain(NAME_FALLBACK);
      });

      it('uses the name and offers the friend a part, with a solo page wherever the friend appears', () => {
        expect(book.pages.some((p) => p.text.includes('{name}'))).toBe(true);
        expect(book.pages.some((p) => usesFriend(p.text))).toBe(true);
        for (const p of book.pages) {
          for (const t of [p.text, p.solo ?? '', book.title]) {
            for (const m of t.matchAll(/\{(\w+)\}/g)) expect(['name', 'friend']).toContain(m[1]);
          }
          if (usesFriend(p.text)) {
            expect(p.solo, p.text).toBeDefined();
            expect(usesFriend(p.solo!)).toBe(false);
          } else {
            expect(p.solo, 'solo only where a friend appears').toBeUndefined();
          }
          expect(p.prop.length).toBeGreaterThan(0);
        }
      });

      it('has no URLs or markup', () => {
        const strings = [book.title, ...book.pages.flatMap((p) => [p.text, p.solo ?? '', p.prop])];
        for (const s of strings) expect(s, s).not.toMatch(/http|www\.|\.com|<|>/i);
      });

      it('keeps every camera inside the artboard, and the last page pulls back to the widest shot', () => {
        expect(insideArtboard(book.cover), 'cover').toBe(true);
        book.pages.forEach((p, i) => expect(insideArtboard(p.camera), `${book.id} p${i + 1} ${JSON.stringify(p.camera)}`).toBe(true));
        const lastZoom = book.pages[book.pages.length - 1]!.camera.zoom;
        expect(lastZoom).toBeLessThanOrEqual(1.25);
        for (const p of book.pages) expect(lastZoom).toBeLessThanOrEqual(p.camera.zoom);
      });

      it('never repeats the same shot on two pages in a row', () => {
        book.pages.forEach((p, i) => {
          const q = book.pages[i - 1];
          if (q) expect(JSON.stringify(p.camera), `${book.id} p${i + 1}`).not.toBe(JSON.stringify(q.camera));
        });
      });
    });
  }
});

describe('templates', () => {
  const page = { text: '{name} and {friend} fold dumplings. {friend} wins.', solo: '{name} folds dumplings.', camera: { x: 800, y: 450, zoom: 1 }, prop: '🥟' };

  it('switches to the solo page when no friend is coming', () => {
    expect(pageTemplate(page, { name: 'Maya' })).toBe(page.solo);
    expect(pageTemplate(page, { name: 'Maya', friend: 'Sam' })).toBe(page.text);
    expect(pageSentences(page, {})).toEqual(['Our hero folds dumplings.']);
    expect(pageSentences(page, { friend: 'Sam' })).toEqual(['Our hero and Sam fold dumplings.', 'Sam wins.']);
  });

  it('capitalises the fallback only at the start of a sentence', () => {
    expect(fillSentence('Then {name} sweeps.', {})).toBe('Then our hero sweeps.');
    expect(fillSentence('‘Hi,’ says {name}.', {})).toBe('‘Hi,’ says our hero.');
    expect(fillSentence('{name}’s cake.', {})).toBe('Our hero’s cake.');
  });

  it('splits sentences after closing quotes but not inside dialogue', () => {
    expect(splitSentences('A cat. ‘Hello!’ says {name}. {name} waves!')).toEqual(['A cat.', '‘Hello!’ says {name}.', '{name} waves!']);
    expect(splitSentences('One, two… two hundred!')).toEqual(['One, two… two hundred!']);
    expect(splitSentences('It says, ‘Come in.’ Knock, knock!')).toEqual(['It says, ‘Come in.’', 'Knock, knock!']);
  });

  it('titles use title-case fallback and the starring line names both', () => {
    const b = bookFor('diwali')!;
    expect(bookTitle(b, {})).toBe('Our Hero and the Row of Lamps');
    expect(bookTitle(b, { name: 'Maya' })).toBe('Maya and the Row of Lamps');
    expect(starring({ name: 'Maya', friend: 'Sam' })).toBe('Maya and Sam');
    expect(starring({})).toBe('Our Hero');
  });

  it('cleans a friend to one first name of letters, ≤ 20 characters', () => {
    expect(cleanFriend('  Sam ')).toBe('Sam');
    expect(cleanFriend('Mary Jo')).toBe('Mary');
    expect(cleanFriend('Zoë')).toBe('Zoë');
    expect(cleanFriend('Mary-Jo')).toBe('Mary-Jo');
    expect(cleanFriend('D’Andre')).toBe('D’Andre');
    expect(cleanFriend('<b>x</b>')).toBe('bxb');
    expect(cleanFriend('http://x.com')).toBe('httpxcom');
    expect(cleanFriend('12345')).toBe('');
    expect(cleanFriend('-Sam')).toBe('Sam');
    expect(cleanFriend('A'.repeat(40))).toHaveLength(FRIEND_MAX);
    expect(cleanFriend('李小龙')).toBe('李小龙');
  });

  it('who() omits empty keys', () => {
    expect(who(undefined, undefined)).toEqual({});
    expect(who('  ', '!!')).toEqual({});
    expect(who(' Maya ', 'Sam')).toEqual({ name: 'Maya', friend: 'Sam' });
    expect(Object.keys(who('Maya', ''))).toEqual(['name']);
    expect(cleanName('x'.repeat(40))).toHaveLength(NAME_MAX);
  });

  it('maps speech boundaries to words', () => {
    const s = 'Our hero sweeps the step.';
    const spans = wordSpans(s);
    expect(spans).toHaveLength(5);
    expect(wordAt(spans, 0)).toBe(0);
    expect(wordAt(spans, 4)).toBe(1);
    expect(wordAt(spans, 9)).toBe(2);
    expect(wordAt(spans, 100)).toBe(4);
  });
});

describe('cameras', () => {
  const cams: Camera[] = [{ x: 800, y: 450, zoom: 1 }, { x: 370, y: 640, zoom: 2.2 }, { x: 1290, y: 700, zoom: 2.6 }, { x: 120, y: 860, zoom: 2.2 }, { x: 1600, y: 0, zoom: 3 }];
  const aspects = [0.5, 0.75, 1, 1.33, 16 / 9, 2.4];

  it('the camera window is 16:9 and centred on the camera', () => {
    const w = cameraWindow({ x: 800, y: 600, zoom: 2 });
    expect(w).toEqual({ x0: 400, y0: 375, vw: 800, vh: 450 });
    expect(insideArtboard({ x: 1300, y: 600, zoom: 2 })).toBe(true);
    expect(insideArtboard({ x: 1700, y: 600, zoom: 2 })).toBe(false);
    expect(insideArtboard({ x: 800, y: -1, zoom: 2 })).toBe(false);
    expect(insideArtboard({ x: 800, y: 450, zoom: 0.9 })).toBe(false);
    expect(insideArtboard({ x: 800, y: 450, zoom: 3.5 })).toBe(false);
  });

  it('a box of any shape sees part of the window, never past the artboard', () => {
    for (const c of cams) {
      const win = cameraWindow(c);
      for (const a of aspects) {
        const v = viewFor(c, a);
        expect(v.vw / v.vh).toBeCloseTo(a, 6);
        expect(v.vw).toBeLessThanOrEqual(win.vw + 1e-6);
        expect(v.vh).toBeLessThanOrEqual(win.vh + 1e-6);
        expect(v.x0).toBeGreaterThanOrEqual(0);
        expect(v.y0).toBeGreaterThanOrEqual(0);
        expect(v.x0 + v.vw).toBeLessThanOrEqual(ARTBOARD.w + 1e-6);
        expect(v.y0 + v.vh).toBeLessThanOrEqual(ARTBOARD.h + 1e-6);
        // Covered: the layer box always overflows the picture box on every side.
        const b = layerBox(v);
        expect(b.left).toBeLessThanOrEqual(1e-9);
        expect(b.top).toBeLessThanOrEqual(1e-9);
        expect(b.left + b.width).toBeGreaterThanOrEqual(100 - 1e-9);
        expect(b.top + b.height).toBeGreaterThanOrEqual(100 - 1e-9);
      }
    }
  });

  it('every page of every book keeps the picture covered, with its subject in view, at phone and desktop shapes', () => {
    for (const book of BOOKS) {
      for (const c of [book.cover, ...book.pages.map((p) => p.camera)]) {
        for (const a of aspects) {
          const v = viewFor(c, a);
          expect(v.x0).toBeGreaterThanOrEqual(0);
          expect(v.y0).toBeGreaterThanOrEqual(0);
          expect(v.x0 + v.vw).toBeLessThanOrEqual(ARTBOARD.w + 1e-6);
          expect(v.y0 + v.vh).toBeLessThanOrEqual(ARTBOARD.h + 1e-6);
          expect(c.x).toBeGreaterThanOrEqual(v.x0);
          expect(c.x).toBeLessThanOrEqual(v.x0 + v.vw);
          expect(c.y).toBeGreaterThanOrEqual(v.y0);
          expect(c.y).toBeLessThanOrEqual(v.y0 + v.vh);
        }
      }
    }
  });

  it('a pan meets both cameras exactly and spreads the planes in between', () => {
    const a = cams[1]!;
    const b = cams[2]!;
    for (const d of [0.2, 0.5, 1]) {
      expect(panCamera(a, b, 0, d)).toEqual(a);
      const end = panCamera(a, b, 1, d);
      expect(end.x).toBeCloseTo(b.x, 6);
      expect(end.y).toBeCloseTo(b.y, 6);
      expect(end.zoom).toBeCloseTo(b.zoom, 6);
    }
    const mid = (d: number): number => panCamera(a, b, 0.5, d).x;
    expect(mid(1)).toBeGreaterThan(mid(0.5));
    expect(mid(0.5)).toBeGreaterThan(mid(0.2));
  });

  it('relTransform is the identity for the same view and scales by the zoom ratio', () => {
    const v = viewFor(cams[0]!, 1);
    expect(relTransform(v, v)).toBe('translate(0%, 0%) scale(1)');
    const near = viewFor({ x: 800, y: 450, zoom: 1 }, 16 / 9);
    const far = viewFor({ x: 800, y: 450, zoom: 2 }, 16 / 9);
    expect(relTransform(far, near)).toContain('scale(0.5)');
  });
});

describe('the Fridge and the activity', () => {
  it('keeps only the book and cleaned names, and reads them back safely', () => {
    expect(keepFor('diwali', { name: 'Maya', friend: 'Sam' })).toEqual({ bookId: 'diwali', name: 'Maya', friend: 'Sam' });
    expect(Object.keys(keepFor('diwali', {}))).toEqual(['bookId']);
    const has = (id: string): boolean => bookFor(id) !== undefined;
    expect(sanitizeKeep({ bookId: 'diwali', name: ' Maya ', friend: 'Sam <b>' }, has)).toEqual({ bookId: 'diwali', name: 'Maya', friend: 'Sam' });
    expect(sanitizeKeep({ bookId: 'easter' }, has)).toBeNull();
    expect(sanitizeKeep('nope', has)).toBeNull();
    expect(sanitizeKeep({ bookId: 'holi', name: 42 }, has)).toEqual({ bookId: 'holi' });
  });

  it('puts a story on the Fridge once, titled by holiday and friend; never while pretending', () => {
    const f = new Fridge({ storage: null });
    const today = { y: 2026, m: 11, d: 8 } as never;
    const w = { name: 'Maya', friend: 'Sam' };
    const res = keepStory(f, { holidayId: 'diwali', holiday: 'Diwali', bookId: 'diwali', who: w, today });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.item.kind).toBe('story');
      expect(res.item.title).toBe('Diwali story with Sam');
      expect(res.item.data).toEqual({ bookId: 'diwali', name: 'Maya', friend: 'Sam' });
      expect(res.item.made).toBe('2026-11-08');
    }
    expect(keptItem(f, 'diwali', w)).toBeDefined();
    expect(keptItem(f, 'diwali', { name: 'Maya' })).toBeUndefined();
    expect(storyTitle('Holi', {})).toBe('Holi story');
    const pretend = new Fridge({ storage: null, pretending: true });
    const r2 = keepStory(pretend, { holidayId: 'holi', holiday: 'Holi', bookId: 'holi', who: {}, today });
    expect(r2).toEqual({ ok: false, reason: 'pretending' });
  });

  it('is available exactly for the holidays with a book', () => {
    for (const id of TWELVE) expect(storyActivity.available(byId(id)!, {} as never)).toBe(true);
    for (const id of ['easter', 'valentines-day']) {
      const meta = byId(id);
      if (meta) expect(storyActivity.available(meta, {} as never)).toBe(false);
    }
    expect(storyActivity.id).toBe('story');
  });
});

describe('names', () => {
  it('cuts a long name after its last whole word, never mid-word', () => {
    expect(cleanName('Ana Sofia Lopez Garcia Hernandez')).toBe('Ana Sofia Lopez Garcia');
    expect(cleanName('Mary-Elizabeth-Josephine-Smith')).toBe('Mary-Elizabeth-Josephine');
    expect(cleanName('  Maya   Rose ')).toBe('Maya Rose');
    expect(cleanName('Ana Sofia Lopez Garcia Ro')).toBe('Ana Sofia Lopez Garcia');
    expect(cleanName('x'.repeat(40))).toHaveLength(NAME_MAX);
    expect(cleanFriend('Bartholomew-Alexander-Christopher')).toBe('Bartholomew');
    expect(cleanFriend('Anne-Marie')).toBe('Anne-Marie');
    expect(capWords('Jo Ann Smith', 24)).toBe('Jo Ann Smith');
    expect(capWords('Jean--Paul-Alexandre', 7)).toBe('Jean');
  });

  it('lets the friend field take a long name whole (the book caps it, the field never cuts it while typing)', () => {
    expect(FRIEND_INPUT_MAX).toBeGreaterThanOrEqual(2 * FRIEND_MAX);
    const typed = 'Bartholomew-Alexander-Christopher';
    expect(typed.length).toBeLessThanOrEqual(FRIEND_INPUT_MAX);
    expect(starring(who('Maya', typed))).toBe('Maya and Bartholomew');
  });

  it('every page fits with real long names too, and without a name never says "our hero" twice', () => {
    const cases: Who[] = [{ name: 'Ana Sofia Lopez Garcia', friend: 'Anne-Marie-Louise' }, { name: cleanName('Ana Sofia Lopez Garcia Hernandez')! }];
    for (const book of BOOKS) {
      book.pages.forEach((p, i) => {
        for (const w of cases) for (const s of pageSentences(p, w)) expect(s.length, `${book.id} p${i + 1}: ${s}`).toBeLessThanOrEqual(SENTENCE_MAX);
        const anon = pageSentences(p, {}).join(' ');
        expect((anon.match(/our hero/gi) ?? []).length, `${book.id} p${i + 1}: ${anon}`).toBeLessThanOrEqual(1);
      });
    }
  });
});

describe('the fact-checked pages stay right', () => {
  const read = (id: string, n: number, w: Who = { name: 'Maya', friend: 'Sam' }): string => pageSentences(bookFor(id)!.pages[n - 1]!, w).join(' ');
  const solo = (id: string, n: number): string => read(id, n, { name: 'Maya' });

  it('Hanukkah: shamash, then the blessings, then the first candle; one day of oil lasting eight; one dreidel letter; gelt', () => {
    const p2 = read('hanukkah', 2);
    expect(p2.indexOf('lights the shamash')).toBeGreaterThanOrEqual(0);
    expect(p2.indexOf('lights the shamash')).toBeLessThan(p2.indexOf('blessings'));
    expect(p2.indexOf('blessings')).toBeLessThan(p2.indexOf('first candle'));
    expect(read('hanukkah', 5)).toMatch(/enough for just one day.*eight whole days/);
    for (const t of [read('hanukkah', 4), solo('hanukkah', 4)]) {
      expect(t).toContain('the letter it lands on: nun, gimel, hei or shin');
      expect(t).toContain('gelt');
    }
    // The greeting is spelt as on the holiday page, and Maya (not the greeting) is the one who says it.
    const p8 = read('hanukkah', 8);
    expect(p8).toContain('Maya says ‘Chag Sameach!’, which means ‘happy holiday’.');
    expect(hanukkahContent.greetings.map((g) => g.roman)).toContain('Chag Sameach');
  });

  it('Christmas: a count-free year of sleeps, and carols', () => {
    const p8 = read('christmas', 8);
    expect(p8).not.toMatch(/three hundred|sixty/);
    expect(p8).toContain('a year of sleeps');
    expect(p8).toContain('carols');
  });

  it('Halloween: a grown-up goes trick-or-treating too', () => {
    for (const n of [4, 6]) expect(read('halloween', n)).toMatch(/\bMum\b|\bDad\b|grown-up/);
  });

  it('Diwali: friends giggle together, the bell has no made-up count, and ladoo is spelt as on the holiday page', () => {
    expect(read('diwali', 7)).toContain('Sam and Maya cover their ears and giggle');
    expect(read('diwali', 6)).not.toMatch(/\btimes\b/);
    const sweets = [read('diwali', 2), solo('diwali', 2)].join(' ');
    expect(sweets).toContain('ladoo');
    expect(sweets).not.toMatch(/laddoo/i);
    expect(JSON.stringify(diwaliContent)).toContain('ladoo');
  });

  it('Mid-Autumn: the moon saying is a saying, and the Jade Rabbit pounds medicine (no teapot)', () => {
    expect(read('mid-autumn-festival', 1)).toContain('when people say the moon is at its roundest');
    const book = bookFor('mid-autumn-festival')!;
    const all = book.pages.flatMap((p) => [p.text, p.solo ?? '', p.prop]).join(' ');
    expect(all).not.toMatch(/teapot|🫖/);
    expect(read('mid-autumn-festival', 6)).toContain('pounding medicine');
  });

  it('Holi: somebody says ‘Bura na mano, Holi hai!’, and the pink ears are left over from the colours', () => {
    expect(read('holi', 4)).toContain('Sam sneaks up, pats pink powder on Maya’s cheeks and laughs, ‘Bura na mano, Holi hai!’');
    expect(solo('holi', 4)).toContain('laughs, ‘Bura na mano, Holi hai!’');
    expect(read('holi', 7)).toContain('still pink');
  });

  it('the names families use: Day of the Dead, Tết and Seollal, Tết Trung Thu', () => {
    expect(read('day-of-the-dead', 1)).toContain('Día de Muertos, Mexico’s Day of the Dead');
    expect(read('lunar-new-year', 1)).toMatch(/Chinese New Year, Tết or Seollal/);
    expect(read('mid-autumn-festival', 1)).toContain('Tết Trung Thu');
  });

  it('Nowruz: about two weeks for the sabzeh; day 13 says hello to spring, not to the new year', () => {
    expect(read('nowruz', 2)).toMatch(/^Two weeks ago/);
    expect(read('nowruz', 8)).not.toMatch(/new year/i);
  });

  it('placeholders never send the wrong message: no Halloween skull on the ofrenda, no black heart for unity', () => {
    expect(bookFor('day-of-the-dead')!.pages.map((p) => p.prop)).not.toContain('💀');
    expect(bookFor('kwanzaa')!.pages.map((p) => p.prop)).not.toContain('🖤');
  });
});

describe('the moon the words talk about', () => {
  // Eid and Mid-Autumn scenes leave the moon to the holiday page's effect, so these books draw their own. Every
  // page whose words mention the moon is listed: `shows` must have it in view, `hides` must not (on Eid p1 the
  // family is still looking for the crescent; it is found on p2), `figurative` is a moon of speech (the
  // mooncake's yolk, "a little moon inside a moon").
  const MOON_PAGES: Readonly<Record<string, { readonly shows: readonly number[]; readonly hides: readonly number[]; readonly figurative: readonly number[] }>> = {
    'eid-al-fitr': { shows: [2, 8], hides: [1], figurative: [] },
    'mid-autumn-festival': { shows: [1, 5, 6, 7, 8], hides: [], figurative: [3] },
  };
  // Real picture boxes: tall phones in portrait ≈ 0.83, phone landscape 0.85–1.15, tablets ≈ 1.3, wide windows 16:9.
  const ASPECTS = [0.8, 0.88, 1, 1.15, 1.33, 16 / 9];

  it('only those books draw a moon, in the sky and inside the artboard', () => {
    expect(BOOKS.filter((b) => b.moon).map((b) => b.id).sort()).toEqual(Object.keys(MOON_PAGES).sort());
    for (const b of BOOKS) {
      if (!b.moon) continue;
      const { x, y, r } = b.moon;
      expect(x - r).toBeGreaterThan(0);
      expect(x + r).toBeLessThan(ARTBOARD.w);
      expect(y - r).toBeGreaterThan(0);
      // The sky: above the scene's skyline (docs/ART.md keeps y 0–430 empty in the middle).
      expect(y + r).toBeLessThan(430);
    }
  });

  it('every page that mentions the moon is listed', () => {
    for (const [id, { shows, hides, figurative }] of Object.entries(MOON_PAGES)) {
      bookFor(id)!.pages.forEach((p, i) => {
        if (/\bmoon\b/i.test(`${p.text} ${p.solo ?? ''}`)) expect([...shows, ...hides, ...figurative], `${id} p${i + 1}`).toContain(i + 1);
      });
    }
  });

  it('shows the moon well inside the picture on the pages about it, and keeps it out where it is not found yet', () => {
    for (const [id, { shows, hides }] of Object.entries(MOON_PAGES)) {
      const book = bookFor(id)!;
      const { x, y, r } = book.moon!;
      for (const a of ASPECTS) {
        for (const n of shows) {
          const v = viewFor(book.pages[n - 1]!.camera, a);
          const inset = Math.min(x - v.x0, v.x0 + v.vw - x, y - v.y0, v.y0 + v.vh - y);
          expect(inset, `${id} p${n} at ${a.toFixed(2)}`).toBeGreaterThanOrEqual(r / 2);
        }
        for (const n of hides) {
          const v = viewFor(book.pages[n - 1]!.camera, a);
          const seen = x + r > v.x0 && x - r < v.x0 + v.vw && y + r > v.y0 && y - r < v.y0 + v.vh;
          expect(seen, `${id} p${n} at ${a.toFixed(2)}`).toBe(false);
        }
      }
    }
  });
});

describe('the fallback picture (no scene yet)', () => {
  it('ignores the page cameras and shows one wide shot of the whole artboard', () => {
    const wide = { x: ARTBOARD.w / 2, y: ARTBOARD.h / 2, zoom: 1 };
    for (const p of bookFor('kwanzaa')!.pages) expect(pictureCamera(false, p.camera)).toEqual(wide);
    const page = bookFor('christmas')!.pages[1]!;
    expect(pictureCamera(true, page.camera)).toBe(page.camera);
    // Wide means the stars and the hills both show: the whole height for a square box, never a 2.6× crop.
    const v = viewFor(pictureCamera(false, page.camera), 1);
    expect(v.vh).toBe(ARTBOARD.h);
  });
});

describe('a full Fridge', () => {
  const today = { y: 2026, m: 11, d: 8 } as never;
  const fill = (f: Fridge): void => {
    for (let i = 0; i < FRIDGE_CAP; i++) f.add({ id: `x${i}`, kind: i % 2 ? 'card' : 'colour', holidayId: 'diwali', made: '2026-10-01', title: `Thing ${i}`, data: {} });
  };

  it('takes a thing down only on a second tap on the same row', () => {
    expect(takeDownTap(null, 'a')).toEqual({ asking: 'a', remove: null });
    expect(takeDownTap('a', 'a')).toEqual({ asking: null, remove: 'a' });
    expect(takeDownTap('a', 'b')).toEqual({ asking: 'b', remove: null });
    expect(takeDownTap('b', 'a')).toEqual({ asking: 'a', remove: null });
  });

  it('a first tap removes nothing; the second makes room and the story goes up', () => {
    const f = new Fridge({ storage: null });
    fill(f);
    const opts = { holidayId: 'diwali', holiday: 'Diwali', bookId: 'diwali', who: { name: 'Maya' }, today };
    expect(keepStory(f, opts)).toEqual({ ok: false, reason: 'full' });
    let asking: string | null = null;
    const tap = (id: string): void => {
      const step = takeDownTap(asking, id);
      asking = step.asking;
      if (step.remove) f.remove(step.remove);
    };
    tap('x3');
    tap('x7');
    expect(f.list()).toHaveLength(FRIDGE_CAP);
    tap('x7');
    expect(f.list()).toHaveLength(FRIDGE_CAP - 1);
    expect(f.get('x7')).toBeUndefined();
    expect(f.get('x3')).toBeDefined();
    expect(keepStory(f, opts).ok).toBe(true);
    expect(keptItem(f, 'diwali', { name: 'Maya' })).toBeDefined();
  });
});

describe('read to me on devices whose speech misbehaves', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  class FakeUtterance {
    voice: unknown = null;
    lang = '';
    rate = 1;
    pitch = 1;
    onstart: (() => void) | null = null;
    onboundary: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(readonly text: string) {}
  }

  it('a voice list that throws means no button and no error', () => {
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    vi.stubGlobal('window', { speechSynthesis: { getVoices: () => { throw new Error('blocked'); }, speak: () => undefined, cancel: () => undefined } });
    const states: unknown[] = [];
    const r = new ReadAloud('en-US', (s) => states.push(s));
    expect(r.available()).toBe(false);
    expect(() => r.read(['Hello.'], () => -1)).not.toThrow();
    expect(r.active).toBe(false);
  });

  it('speak() that throws ends the reading instead of breaking the page', () => {
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    const cancel = vi.fn();
    vi.stubGlobal('window', { speechSynthesis: { getVoices: () => [{ lang: 'en-US', name: 'Test', localService: true, default: true }], speak: () => { throw new Error('nope'); }, cancel } });
    const states: unknown[] = [];
    const r = new ReadAloud('en-US', (s) => states.push(s));
    expect(r.available()).toBe(true);
    expect(() => r.read(['Hello there.'], () => -1)).not.toThrow();
    expect(r.active).toBe(false);
    expect(states.at(-1)).toBeNull();
  });

  it('with a working voice it reads, and stops at once', () => {
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    const spoken: string[] = [];
    const cancel = vi.fn();
    vi.stubGlobal('window', { speechSynthesis: { getVoices: () => [{ lang: 'en-GB', name: 'Test' }], speak: (u: FakeUtterance) => { spoken.push(u.text); }, cancel } });
    const r = new ReadAloud('en-US', () => undefined);
    r.read(['One.', 'Two.'], () => -1);
    expect(r.active).toBe(true);
    expect(spoken).toEqual(['One.']);
    r.stop();
    expect(r.active).toBe(false);
    expect(cancel).toHaveBeenCalled();
  });

  it('no speech at all: no button', () => {
    vi.stubGlobal('window', {});
    expect(new ReadAloud('en', () => undefined).available()).toBe(false);
  });
});
