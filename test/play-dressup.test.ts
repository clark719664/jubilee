import { describe, expect, it, beforeEach } from 'vitest';
import { HOLIDAYS, byId } from '../src/content/registry';
import { civil } from '../src/dates/civil';
import { FACE_ART } from '../src/play/dressup/art-face';
import { HEAD_ART } from '../src/play/dressup/art-head';
import { HELD_ART } from '../src/play/dressup/art-held';
import { armHalf, GRIP } from '../src/play/dressup/art-kit';
import { DENY_WORDS, ITEMS, SLOTS, WEARABLE_SLOTS, itemById, itemsFor, SEASON_TAGS } from '../src/play/dressup/catalog';
import {
  OUTFIT_KEY, describeOutfit, dressFor, holidayItemCount, isEmptyOutfit, loadOutfit, normalizeOutfit, resetOutfitMemory,
  sameOutfit, saveOutfit, seasonScore, sortForSeason, surpriseOutfit, toggleItem, type OutfitStorage,
} from '../src/play/dressup/outfit';
import { asPicture, captionDate, savePicture } from '../src/play/dressup/picture';
import { seasonFor } from '../src/play/dressup/season';
import { COPY } from '../src/play/dressup/copy';

const FAITH = new Set(['christian', 'orthodox', 'jewish', 'muslim', 'hindu', 'sikh', 'buddhist']);
const ids = new Set(HOLIDAYS.map((m) => m.id));

function memStore(): OutfitStorage & { data: Map<string, string>; writes: number } {
  const data = new Map<string, string>();
  const s = {
    data, writes: 0,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { s.writes++; data.set(k, v); },
  };
  return s;
}

describe('catalogue', () => {
  it('has about forty wearable things plus glows and patterns, with unique ids', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    const things = ITEMS.filter((i) => i.slot !== 'glow' && i.slot !== 'pattern');
    expect(things.length).toBeGreaterThanOrEqual(40);
    for (const slot of SLOTS) expect(itemsFor(slot).length).toBeGreaterThanOrEqual(4);
  });

  it('draws every hat, glasses, neck and held item (and nothing else)', () => {
    const drawn = new Set([...Object.keys(HEAD_ART), ...Object.keys(FACE_ART), ...Object.keys(HELD_ART)]);
    for (const it of ITEMS) {
      if (it.slot === 'glow' || it.slot === 'pattern') expect(it.colours?.length).toBeGreaterThan(0);
      else expect(drawn.has(it.id), it.id).toBe(true);
    }
    for (const id of drawn) expect(itemById(id), id).toBeDefined();
    for (const id of Object.keys(HEAD_ART)) expect(itemById(id)?.slot).toBe('hat');
    for (const id of Object.keys(HELD_ART)) expect(itemById(id)?.slot).toBe('held');
  });

  it('tags items only with holidays that exist, and only with seasonal tags', () => {
    for (const it of ITEMS) {
      for (const h of it.holidays) expect(ids.has(h), `${it.id} → ${h}`).toBe(true);
      for (const t of it.tags ?? []) expect(SEASON_TAGS, `${it.id} tag ${t}`).toContain(t);
    }
  });

  it('gives every tier-1 holiday something to dress up in', () => {
    for (const m of HOLIDAYS.filter((h) => h.tier === 1)) expect(holidayItemCount(m), m.id).toBeGreaterThan(0);
  });

  it('has a kid-sized name and, for hats, says something when put on', () => {
    for (const it of ITEMS) {
      expect(it.name.length).toBeLessThanOrEqual(22);
      if (it.slot === 'hat') expect(it.says, it.id).toBeTruthy();
    }
  });
});

describe('respect rules', () => {
  it('never names a religious garment, sacred object or figure', () => {
    for (const it of ITEMS) {
      const words = `${it.id} ${it.name}`.toLowerCase().split(/[^a-z]+/);
      const text = ` ${words.join(' ')} `;
      for (const w of DENY_WORDS) expect(text.includes(` ${w} `), `${it.id} contains "${w}"`).toBe(false);
    }
  });

  it('explains every wearable tagged with a faith holiday as folk or festive', () => {
    for (const it of ITEMS.filter((i) => WEARABLE_SLOTS.includes(i.slot))) {
      const faith = it.holidays.filter((h) => byId(h)?.traditions.some((t) => FAITH.has(t)));
      if (faith.length > 0) expect(it.respect, `${it.id} is worn for ${faith.join(', ')}`).toBeTruthy();
    }
  });

  it('keeps sacred lamps faceless and religious symbols off garments', () => {
    // The diya is held, never worn; nothing worn is a crescent, menorah, cross or kinara.
    expect(itemById('diya')?.slot).toBe('held');
    for (const it of ITEMS.filter((i) => WEARABLE_SLOTS.includes(i.slot))) {
      expect(it.holidays.includes('eid-al-fitr') || it.holidays.includes('ramadan') || it.holidays.includes('eid-al-adha'), it.id).toBe(false);
    }
  });
});

describe('art geometry', () => {
  it('holds things at Jubi\'s right arm tip and hugs the top point with headbands', () => {
    expect(Math.hypot(GRIP.x - 88, GRIP.y - 41.6)).toBeLessThan(GRIP.r + 1.5);
    expect(armHalf(14)).toBe(0);
    expect(armHalf(40.25)).toBeCloseTo(10, 1);
  });
});

describe('outfit', () => {
  beforeEach(() => resetOutfitMemory());

  it('keeps only known ids in their own slot', () => {
    expect(normalizeOutfit({ hat: 'santa-hat', glasses: 'santa-hat', neck: 'nope', held: 7, glow: 'glow-rose' })).toEqual({ hat: 'santa-hat', glow: 'glow-rose' });
    expect(normalizeOutfit(null)).toEqual({});
    expect(normalizeOutfit('hat')).toEqual({});
  });

  it('puts things on and takes them off again', () => {
    let o = toggleItem({}, 'santa-hat');
    expect(o).toEqual({ hat: 'santa-hat' });
    o = toggleItem(o, 'witch-hat');
    expect(o.hat).toBe('witch-hat');
    o = toggleItem(o, 'witch-hat');
    expect(isEmptyOutfit(o)).toBe(true);
    expect('hat' in o).toBe(false);
    expect(toggleItem(o, 'unknown')).toBe(o);
  });

  it('saves under its own key and loads it back', () => {
    const s = memStore();
    expect(saveOutfit({ hat: 'party-hat', held: 'balloon' }, { pretending: false, storage: s })).toBe(true);
    expect(JSON.parse(s.data.get(OUTFIT_KEY)!)).toEqual({ version: 1, outfit: { hat: 'party-hat', held: 'balloon' } });
    expect(loadOutfit(s)).toEqual({ hat: 'party-hat', held: 'balloon' });
  });

  it('writes nothing while pretending, but keeps the look for the session', () => {
    const s = memStore();
    saveOutfit({ hat: 'witch-hat' }, { pretending: true, storage: s });
    expect(s.writes).toBe(0);
    expect(loadOutfit(s)).toEqual({ hat: 'witch-hat' });
    resetOutfitMemory();
    expect(loadOutfit(s)).toEqual({});
  });

  it('survives broken or missing storage', () => {
    const broken: OutfitStorage = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('full'); } };
    expect(loadOutfit(broken)).toEqual({});
    expect(saveOutfit({ hat: 'beanie' }, { pretending: false, storage: broken })).toBe(false);
    expect(loadOutfit(broken)).toEqual({ hat: 'beanie' });
    resetOutfitMemory();
    const junk = memStore();
    junk.data.set(OUTFIT_KEY, '{nope');
    expect(loadOutfit(junk)).toEqual({});
    expect(loadOutfit(null)).toEqual({});
  });

  it('describes a look for the Fridge', () => {
    expect(describeOutfit({ hat: 'santa-hat', neck: 'scarf' })).toBe('Jubi in a santa hat and a stripy scarf');
    expect(describeOutfit({ hat: 'elf-hat', glasses: 'heart-glasses', held: 'present' })).toBe('Jubi in an elf hat and heart glasses and more');
    expect(describeOutfit({}, 'Diwali')).toBe('Jubi on Diwali');
  });
});

describe('seasons', () => {
  const halloween = byId('halloween')!;
  const christmas = byId('christmas')!;

  it('scores exact holidays above shared tags', () => {
    expect(seasonScore(itemById('witch-hat')!, halloween)).toBe(3);
    expect(seasonScore(itemById('santa-hat')!, halloween)).toBe(0);
  });

  it('puts the next holiday\'s things first, then the page\'s, then the rest', () => {
    const hats = sortForSeason('hat', [halloween, christmas]).map((r) => r.item.id);
    expect(hats[0]).toBe('witch-hat');
    expect(hats.indexOf('santa-hat')).toBeLessThan(hats.indexOf('party-hat'));
    expect(hats.length).toBe(itemsFor('hat').length);
  });

  it('finds Halloween as "for today" on 22 October and keeps the page holiday in season', () => {
    const s = seasonFor({ metas: HOLIDAYS, customs: [], today: civil(2026, 10, 22), region: 'US', everywhere: false, page: christmas });
    expect(s.forToday?.id).toBe('halloween');
    expect(s.isToday).toBe(false);
    expect(s.holidays.map((m) => m.id)).toEqual(['halloween', 'christmas']);
  });

  it('dresses for the day itself on Christmas Day', () => {
    const s = seasonFor({ metas: HOLIDAYS, customs: [], today: civil(2026, 12, 25), region: 'US', everywhere: false, page: christmas });
    expect(s.forToday?.id).toBe('christmas');
    expect(s.isToday).toBe(true);
    expect(s.holidays.length).toBe(1);
  });

  it('dresses for a holiday, cycles looks, and keeps the child\'s pattern', () => {
    const a = dressFor(christmas, { pattern: 'dots' });
    expect(a.hat).toBe('santa-hat');
    expect(a.pattern).toBe('dots');
    expect(a.glow).toBeDefined();
    const b = dressFor(christmas, {}, 1);
    expect(b.hat).toBe('elf-hat');
    expect(sameOutfit(dressFor(christmas, {}, 0), dressFor(christmas, {}, 0))).toBe(true);
    for (const m of HOLIDAYS.filter((h) => h.tier === 1)) {
      const o = dressFor(m, {});
      expect(isEmptyOutfit(o), m.id).toBe(false);
      expect(normalizeOutfit(o)).toEqual(o);
    }
  });

  it('surprises with a valid look that always has a hat and something to hold', () => {
    for (let seed = 1; seed < 60; seed++) {
      const o = surpriseOutfit(seed);
      expect(o.hat && o.held).toBeTruthy();
      expect(normalizeOutfit(o)).toEqual(o);
    }
    expect(surpriseOutfit(42)).toEqual(surpriseOutfit(42));
  });
});

describe('pictures', () => {
  it('reads Fridge data back safely', () => {
    expect(asPicture({ outfit: { hat: 'santa-hat', held: 'bad' }, theme: 'christmas', state: 'party' }))
      .toEqual({ v: 1, outfit: { hat: 'santa-hat' }, theme: 'christmas', state: 'party' });
    expect(asPicture(null)).toEqual({ v: 1, outfit: {}, theme: 'silly', state: 'excited' });
    expect(asPicture({ theme: 'nope', state: 'angry' }).theme).toBe('silly');
  });

  it('captions with the pretend-safe civil date', () => {
    expect(captionDate(civil(2026, 10, 22))).toBe('22 October 2026');
  });

  it('keeps nothing on the Fridge while pretending', () => {
    const res = savePicture({ pretending: true, holidayId: 'christmas', today: civil(2026, 12, 1), title: 'Jubi', picture: asPicture({}) });
    expect(res).toEqual({ ok: false, reason: 'pretending' });
  });

  it('stores the outfit as data with a dressup kind', () => {
    const res = savePicture({ pretending: false, holidayId: 'halloween', today: civil(2026, 10, 31), title: 'Jubi in a witch hat', picture: asPicture({ outfit: { hat: 'witch-hat' }, theme: 'halloween' }) });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.item.kind).toBe('dressup');
      expect(res.item.made).toBe('2026-10-31');
      expect(res.item.data).toEqual({ v: 1, outfit: { hat: 'witch-hat' }, theme: 'halloween', state: 'excited' });
    }
  });
});

describe('copy', () => {
  it('never says sent, emailed, uploaded or wrong, and has no links', () => {
    const all = JSON.stringify(COPY).toLowerCase();
    for (const w of ['sent', 'email', 'upload', 'wrong', 'http', 'www.', '.com', 'locked']) expect(all.includes(w), w).toBe(false);
  });
});
