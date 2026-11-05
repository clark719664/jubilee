import { describe, expect, it } from 'vitest';
import { HOLIDAYS } from '../src/content/registry';
import { civil } from '../src/dates/civil';
import type { FridgeItem } from '../src/play/fridge';
import { TREE_SPOTS } from '../src/play/wish/art';
import { ICON_IDS } from '../src/play/wish/chip-icons';
import { COPY } from '../src/play/wish/copy';
import {
  asLetter, asReply, canSend, cleanText, emptyDraft, kept, KIND_MAX, makeLetter, replyReady, takeDownCandidates, TEXT_BODY_MAX, TEXT_MAX, toggleChip,
  type WishLetter,
} from '../src/play/wish/letter';
import { salutationOf } from '../src/play/wish/paper';
import {
  allTemplates, ASIDES, CLOSINGS, hashString, KIND_GENTLE, KIND_SAID, kindQuote, NEWS, OPENINGS, seedFor, WISHES_ONE, WISHES_TWO, WISHES_WORDS, wordCount, writeReply,
} from '../src/play/wish/reply';
import { HOPE_CHIPS, LOVE_CHIPS, SANTA_CHIPS, SKIN_IDS, THANKS_CHIPS, hasReply, skinById, skinFor, skinOf } from '../src/play/wish/skins';

const santa = skinOf('christmas');
const letter = (over: Partial<WishLetter> = {}): WishLetter => ({
  v: 1, type: 'letter', skin: 'santa', chips: ['bike', 'puppy'], text: 'Hello Santa! I like snow.', kind: 'helping my brother', name: 'Maya', year: 2026, ...over,
});
const item = (data: unknown, over: Partial<FridgeItem> = {}): FridgeItem => ({ id: 'f-1', kind: 'wish', holidayId: 'christmas', made: '2026-12-01', title: 'x', data, ...over });

describe('skins', () => {
  it('maps the brief\'s holidays to their skins and everything else to the wish star', () => {
    expect(skinFor('christmas')).toBe('santa');
    for (const id of ['lantern-festival', 'mid-autumn-festival', 'chuseok']) expect(skinFor(id)).toBe('lantern');
    expect(skinFor('diwali')).toBe('diya');
    for (const id of ['new-years-eve', 'new-years-day', 'lunar-new-year', 'nowruz', 'rosh-hashanah']) expect(skinFor(id)).toBe('jar');
    expect(skinFor('thanksgiving')).toBe('leaf');
    for (const id of ['valentines-day', 'mothers-day', 'mothers-day-fr', 'fathers-day']) expect(skinFor(id)).toBe('love');
    for (const id of ['halloween', 'easter', 'eid-al-fitr', 'hanukkah', 'st-nicholas-day', 'custom-birthday']) expect(skinFor(id)).toBe('star');
  });

  it('every registry holiday gets a skin with chips', () => {
    for (const m of HOLIDAYS) {
      const s = skinOf(m.id);
      expect(SKIN_IDS).toContain(s.id);
      expect(s.chips.length).toBeGreaterThanOrEqual(12);
    }
  });

  it('only Santa writes back (no reply from any religious figure)', () => {
    expect(SKIN_IDS.filter(hasReply)).toEqual(['santa']);
  });

  it('has 24 Christmas wish chips with unique ids and drawn icons', () => {
    expect(SANTA_CHIPS).toHaveLength(24);
    for (const set of [SANTA_CHIPS, HOPE_CHIPS, THANKS_CHIPS, LOVE_CHIPS]) {
      expect(new Set(set.map((c) => c.id)).size).toBe(set.length);
      for (const c of set) expect(ICON_IDS).toContain(c.icon);
    }
    for (const want of ['bike', 'books', 'puppy', 'art', 'snow', 'grandma', 'peace']) expect(SANTA_CHIPS.map((c) => c.id)).toContain(want);
  });

  it('love notes get quick "To" picks and a grammatical salutation', () => {
    const love = skinOf('mothers-day');
    expect(love.toPicks).toContain('Mom');
    expect(salutationOf(love, { to: 'Mom' })).toBe('Dear Mom,');
    expect(salutationOf(love, { to: 'My family' })).toBe('To my family,');
    expect(salutationOf(love, {})).toBe('Dear you,');
    expect(salutationOf(santa, {})).toBe('Dear Santa,');
  });

  it('never says a wish was emailed or sent over the internet', () => {
    const words = [...Object.values(COPY).filter((v) => typeof v === 'string'), ...SKIN_IDS.flatMap((id) => Object.values(skinById(id)).filter((v) => typeof v === 'string'))].join(' ');
    expect(words).not.toMatch(/e-?mail|internet|online|upload|server|http|www\./i);
    expect(words).not.toMatch(/\bsent\b/i);
  });
});

describe('letters', () => {
  it('cleans and caps free text at 600 characters in all', () => {
    expect(TEXT_BODY_MAX + KIND_MAX).toBe(TEXT_MAX);
    expect(TEXT_MAX).toBe(600);
    expect(cleanText('  hi \r\n\n\n\n there  ', 99)).toBe('hi\n\nthere');
    expect(cleanText(42, 10)).toBe('');
    const l = makeLetter(santa, { chips: ['bike', 'nope', 'bike'], text: 'x'.repeat(900), kind: 'k'.repeat(300), to: '' }, 2026, ' Maya ');
    expect(l.text.length + l.kind.length).toBeLessThanOrEqual(TEXT_MAX);
    expect(l.chips).toEqual(['bike']);
    expect(l.name).toBe('Maya');
    expect('to' in l).toBe(false);
  });

  it('drops the kindness line on skins that have none, and omits a missing name', () => {
    const l = makeLetter(skinOf('halloween'), { chips: ['peace'], text: 'hi', kind: 'sneaky', to: '' }, 2026, undefined);
    expect(l.kind).toBe('');
    expect('name' in l).toBe(false);
  });

  it('toggles chips in pick order and respects the cap without losing anything', () => {
    let chips: string[] = [];
    for (const id of ['a', 'b', 'c', 'd']) chips = toggleChip(chips, id, 4).chips;
    const full = toggleChip(chips, 'e', 4);
    expect(full.full).toBe(true);
    expect(full.chips).toEqual(['a', 'b', 'c', 'd']);
    expect(toggleChip(chips, 'b', 4).chips).toEqual(['a', 'c', 'd']);
  });

  it('can send once there is a picture or a few letters', () => {
    const d = emptyDraft();
    expect(canSend(d)).toBe(false);
    expect(canSend({ ...d, text: '   ' })).toBe(false);
    expect(canSend({ ...d, chips: ['bike'] })).toBe(true);
    expect(canSend({ ...d, text: 'hi' })).toBe(true);
  });

  it('reads Fridge data defensively', () => {
    expect(asLetter(null)).toBeNull();
    expect(asLetter({ type: 'letter', skin: 'pirate', chips: [], year: 2026 })).toBeNull();
    expect(asLetter({ type: 'letter', skin: 'santa', chips: [1], year: 2026 })).toBeNull();
    expect(asLetter(letter())?.chips).toEqual(['bike', 'puppy']);
    expect(asReply({ type: 'reply', letterId: 'x', paragraphs: ['a'] })?.paragraphs).toEqual(['a']);
  });

  it('keeps only this holiday\'s wishes, letters apart from replies', () => {
    const items = [
      item(letter(), { id: 'a' }),
      item(writeReply(letter(), 'a'), { id: 'b' }),
      item(letter(), { id: 'c', holidayId: 'diwali' }),
      item({ junk: true }, { id: 'd' }),
      item(letter(), { id: 'e', kind: 'card' }),
    ];
    const k = kept(items, 'christmas');
    expect(k.letters.map((l) => l.item.id)).toEqual(['a']);
    expect(k.replies.map((r) => r.item.id)).toEqual(['b']);
  });

  it('offers the oldest Fridge items to take down, never deleting by itself', () => {
    const items = [item(1, { id: 'n', made: '2026-05-01' }), item(1, { id: 'o', made: '2025-01-01' }), item(1, { id: 'm', made: '2026-01-01' })];
    expect(takeDownCandidates(items, 2).map((i) => i.id)).toEqual(['o', 'm']);
    expect(items).toHaveLength(3);
  });
});

describe('Santa\'s reply', () => {
  it('arrives from the next morning by the device date, never while pretending', () => {
    expect(replyReady('2026-12-01', civil(2026, 12, 1), false)).toBe(false);
    expect(replyReady('2026-12-01', civil(2026, 12, 2), false)).toBe(true);
    expect(replyReady('2025-12-31', civil(2026, 1, 1), false)).toBe(true);
    expect(replyReady('2026-12-01', civil(2026, 12, 9), true)).toBe(false);
    expect(replyReady('garbage', civil(2026, 12, 9), false)).toBe(false);
  });

  it('has at least 30 paragraph templates across the slots', () => {
    const paragraphs = [OPENINGS, WISHES_TWO, WISHES_ONE, WISHES_WORDS, KIND_SAID, KIND_GENTLE, NEWS, CLOSINGS].reduce((n, l) => n + l.length, 0);
    expect(paragraphs).toBeGreaterThanOrEqual(30);
    for (const slot of [OPENINGS, NEWS, CLOSINGS]) expect(slot.length).toBeGreaterThanOrEqual(6);
  });

  it('follows the house rules: no judging, no promises, nothing about shops or the internet', () => {
    const all = allTemplates().join('\n');
    expect(all).not.toMatch(/naughty|nice list|\bcoal\b|good enough|been good|behave|promise|guarantee|you will get|you'll get|I will bring|I'll bring|will deliver|\bbuy\b|\bshops?\b|money|price|e-?mail|internet|online|http|www\./i);
    expect(all).toMatch(/see what the elves can do/);
  });

  it('is the same every time for the same letter (seeded by the letter and the year)', () => {
    expect(writeReply(letter(), 'a')).toEqual(writeReply(letter(), 'a'));
    expect(seedFor(letter())).not.toBe(seedFor(letter({ year: 2027 })));
    expect(hashString('abc')).toBe(hashString('abc'));
  });

  it('mentions the child\'s wishes and name, and their kindness in their own words', () => {
    const r = writeReply(letter({ chips: ['bike', 'books'] }), 'a');
    const text = [r.greeting, ...r.paragraphs].join(' ');
    expect(text).toMatch(/a bike|some new books/);
    expect(text).toContain('Maya');
    expect(text).toContain("I've been kind by helping my brother.");
    expect(r.ps.startsWith('P.S.')).toBe(true);
    expect(r.signoff.length).toBeGreaterThan(0);
  });

  it('handles a letter with no chips, no name and no kindness line gently', () => {
    const noName: WishLetter = { v: 1, type: 'letter', skin: 'santa', chips: [], text: 'one two three', kind: '', year: 2026 };
    const r = writeReply(noName, 'a');
    const text = [r.greeting, ...r.paragraphs].join(' ');
    expect(text).not.toContain('undefined');
    expect(text).not.toMatch(/\{\w+\}/);
    expect(text).toMatch(/3 words|Thank you for writing to me in your own words/);
    expect(r.greeting).not.toContain('Maya');
  });

  it('adds the careful aside for big wishes like a puppy', () => {
    const r = writeReply(letter({ chips: ['puppy'] }), 'a');
    expect(r.paragraphs).toContain(ASIDES.puppy);
  });

  it('varies between siblings (different letters get different replies)', () => {
    const kids = ['Maya', 'Leo', 'Sam', 'Ava', 'Noor', 'Kai', 'Zoe', 'Ben'];
    const texts = new Set(kids.map((name, i) => {
      const r = writeReply(letter({ name, text: `I love ${name.toLowerCase()} things ${i}`, chips: [SANTA_CHIPS[i]!.id, SANTA_CHIPS[i + 5]!.id] }), String(i));
      return r.paragraphs.join('|').replaceAll(name, '');
    }));
    expect(texts.size).toBe(kids.length);
    const openings = new Set(kids.map((name) => writeReply(letter({ name, text: `hi from ${name}` }), 'x').paragraphs[0]));
    expect(openings.size).toBeGreaterThan(2);
  });

  it('quotes the kindness line as a whole sentence', () => {
    expect(kindQuote('helping my mom')).toBe("I've been kind by helping my mom.");
    expect(kindQuote('Sharing my toys!')).toBe("I've been kind by sharing my toys!");
    expect(kindQuote('i fed the cat')).toBe('I fed the cat.');
    expect(kindQuote('   ')).toBe('');
    expect(wordCount('Hi, Santa! 🎄 ok')).toBe(3);
  });
});

describe('gratitude tree', () => {
  it('has a leaf spot on wood for every leaf it shows', () => {
    expect(TREE_SPOTS.length).toBeGreaterThanOrEqual(16);
    for (const [x, y] of TREE_SPOTS) {
      expect(x).toBeGreaterThan(20);
      expect(x).toBeLessThan(300);
      expect(y).toBeGreaterThan(20);
      expect(y).toBeLessThan(200);
    }
  });
});
