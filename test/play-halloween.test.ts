/**
 * play-halloween.test.ts — the five Halloween games' rules and data (no DOM): Pumpkin Carver and Monster
 * Maker records, Trick-or-Treat's doors and pail, Cauldron Colors' color mixing, Peekaboo's round, and
 * the way they are registered and linked.
 */
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/effects/rng';
import { byId } from '../src/content/registry';
import { hasActivity, loadActivity } from '../src/play';
import {
  BODIES, COLORS as MCOLORS, EYES as MEYES, MOUTHS as MMOUTHS, PATTERNS, TOPS, describeMonster, monsterName, monsterTitle, randomMonster, sanitizeMonster,
} from '../src/play/monster/parts';
import { GHOSTS, GHOST_COUNT, PLACES, hide, isDone, newRound, nextPlace, tap } from '../src/play/peekaboo/logic';
import {
  DROPS, MAX_DROPS, ORDERS, addDrop, colorName, hex, hintFor, mixColor, mixFrom, nameOf, nextOrder, totalDrops,
} from '../src/play/potion/logic';
import {
  COLORS, DEFAULT_PUMPKIN, EYES, HATS, MOUTHS, NOSES, describePumpkin, pumpkinTitle, randomPumpkin, sanitizePumpkin, withPart,
} from '../src/play/pumpkin/parts';
import { shuffled } from '../src/play/spooky/kit';
import {
  HOUSES, TREATS, VISITORS, addToBag, bagSummary, bagTotal, countLine, milestone, pickOffer, pickVisitor,
} from '../src/play/treats/logic';
import { ACTIVITY_IDS } from '../src/play/types';
import { HOLIDAY_GAMES, PLAY_LINKS, holidayGamesFor } from '../src/ui/sections';

const ids = (l: readonly { id: string }[]): string[] => l.map((p) => p.id);

describe('Pumpkin Carver', () => {
  it('reads any data back as a valid pumpkin', () => {
    expect(sanitizePumpkin(undefined)).toEqual(DEFAULT_PUMPKIN);
    expect(sanitizePumpkin('nope')).toEqual(DEFAULT_PUMPKIN);
    const p = sanitizePumpkin({ eyes: 'star', nose: 'bogus', mouth: 'teeth', hat: 'crown', color: 'pink', lit: true });
    expect(p).toEqual({ v: 1, eyes: 'star', nose: DEFAULT_PUMPKIN.nose, mouth: 'teeth', hat: 'crown', color: 'pink', lit: true });
  });

  it('random pumpkins are valid, seeded and varied', () => {
    const a = randomPumpkin(mulberry32(5));
    expect(a).toEqual(randomPumpkin(mulberry32(5)));
    expect(sanitizePumpkin(a)).toEqual(a);
    const seen = new Set<string>();
    for (let s = 0; s < 40; s++) seen.add(JSON.stringify(randomPumpkin(mulberry32(s))));
    expect(seen.size).toBeGreaterThan(30);
    expect(randomPumpkin(mulberry32(1), true).lit).toBe(true);
  });

  it('has plenty to choose from, with unique ids, and names things for the Fridge', () => {
    for (const list of [EYES, NOSES, MOUTHS, HATS, COLORS]) expect(new Set(ids(list)).size).toBe(list.length);
    expect(EYES.length).toBeGreaterThanOrEqual(6);
    expect(MOUTHS.length).toBeGreaterThanOrEqual(6);
    expect(pumpkinTitle(DEFAULT_PUMPKIN)).toBe('Grinning orange pumpkin');
    const p = withPart(DEFAULT_PUMPKIN, 'hat', 'witch');
    expect(p.hat).toBe('witch');
    expect(describePumpkin({ ...p, lit: true })).toContain('glowing orange jack-o’-lantern wearing a witch hat');
  });
});

describe('Monster Maker', () => {
  it('reads any data back as a valid monster', () => {
    const m = sanitizeMonster({ body: 'cube', color: 'nope', eyes: '3', mouth: 'tongue', top: 'ears', pattern: 'spots', name: '  Zibby  ' });
    expect(m).toMatchObject({ body: 'cube', color: 'purple', eyes: '3', mouth: 'tongue', top: 'ears', pattern: 'spots', name: 'Zibby' });
    expect(sanitizeMonster(null).name.length).toBeGreaterThan(0);
    expect(sanitizeMonster({ name: 'x'.repeat(100) }).name.length).toBeLessThanOrEqual(24);
  });

  it('names are friendly and seeded, random monsters valid', () => {
    expect(monsterName(mulberry32(3))).toBe(monsterName(mulberry32(3)));
    const m = randomMonster(mulberry32(9));
    expect(sanitizeMonster(m)).toEqual(m);
    expect(monsterTitle(m)).toBe(`${m.name} the monster`);
    expect(describeMonster(m)).toContain(m.name);
    for (const list of [BODIES, MEYES, MMOUTHS, TOPS, PATTERNS, MCOLORS]) expect(new Set(ids(list)).size).toBe(list.length);
  });
});

describe('Trick-or-Treat Street', () => {
  it('six houses, a different visitor each knock, two different treats', () => {
    expect(HOUSES).toBe(6);
    const rand = mulberry32(2);
    let last: string | null = null;
    for (let i = 0; i < 60; i++) {
      const v = pickVisitor(rand, last);
      expect(v.id).not.toBe(last);
      last = v.id;
      const [a, b] = pickOffer(rand);
      expect(a.id).not.toBe(b.id);
    }
    expect(new Set(ids(VISITORS)).size).toBe(VISITORS.length);
    expect(new Set(ids(TREATS)).size).toBe(TREATS.length);
  });

  it('the pail counts, sorts and never limits', () => {
    let bag = {};
    for (const id of ['candy', 'cookie', 'candy', 'donut', 'candy', 'cookie']) bag = addToBag(bag, id);
    expect(bagTotal(bag)).toBe(6);
    expect(bagSummary(bag).map((r) => [r.treat.id, r.count])).toEqual([['candy', 3], ['cookie', 2], ['donut', 1]]);
    expect(countLine(0)).toContain('empty');
    expect(countLine(1)).toBe('You have 1 treat!');
    expect(countLine(7)).toBe('You have 7 treats!');
    expect(milestone(5)).toContain('5');
    expect(milestone(6)).toBeNull();
    for (let i = 0; i < 100; i++) bag = addToBag(bag, 'candy');
    expect(bagTotal(bag)).toBe(106);
  });
});

describe('Cauldron Colors', () => {
  it('mixes like paint', () => {
    expect(nameOf(mixFrom([]))).toBe('Water');
    expect(nameOf(mixFrom(['red', 'yellow']))).toBe('Orange');
    expect(nameOf(mixFrom(['yellow', 'blue']))).toBe('Green');
    expect(nameOf(mixFrom(['red', 'blue']))).toBe('Purple');
    expect(nameOf(mixFrom(['red', 'yellow', 'blue']))).toBe('Brown');
    expect(nameOf(mixFrom(['red', 'white', 'white']))).toBe('Pink');
    expect(nameOf(mixFrom(['blue', 'white', 'white']))).toBe('Light blue');
    expect(nameOf(mixFrom(['ink']))).toBe('Midnight');
    expect(nameOf(mixFrom(['white']))).toBe('White');
  });

  it('every order can be made, and the hint says how', () => {
    for (const o of ORDERS) {
      expect(nameOf(mixFrom(o.recipe)), o.color).toBe(o.color);
      expect(hintFor(o).startsWith('Try ')).toBe(true);
    }
    expect(hintFor(ORDERS[0]!)).toBe('Try 1 red and 1 yellow.');
    const rand = mulberry32(4);
    let last: string | null = null;
    for (let i = 0; i < 40; i++) {
      const o = nextOrder(rand, last);
      expect(o.color).not.toBe(last);
      last = o.color;
    }
  });

  it('holds a dozen drops, then stays full; colors are valid hex', () => {
    let m = mixFrom([]);
    for (let i = 0; i < 30; i++) m = addDrop(m, DROPS[i % DROPS.length]!);
    expect(totalDrops(m)).toBe(MAX_DROPS);
    expect(addDrop(m, 'red')).toBe(m);
    for (const d of DROPS) expect(hex(mixColor(mixFrom([d])))).toMatch(/^#[0-9a-f]{6}$/);
    expect(colorName([0.5, 0.5, 0.5])).toBe('Gray');
  });
});

describe('Peekaboo Ghosts', () => {
  it('a ghost never hides where the last one did', () => {
    const rand = mulberry32(8);
    let last: number | null = null;
    for (let i = 0; i < 200; i++) {
      const p = nextPlace(rand, last);
      expect(p).not.toBe(last);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(PLACES.length);
      last = p;
    }
    expect(nextPlace(rand, 0, 1)).toBe(0);
  });

  it('a round: tap the wrong place and nothing happens; eight finds end it', () => {
    const rand = mulberry32(6);
    let r = hide(newRound(), rand);
    expect(r.at).not.toBeNull();
    expect(hide(r, rand)).toBe(r);
    const wrong = (r.at! + 1) % PLACES.length;
    expect(tap(r, wrong)).toEqual({ round: r, hit: false });
    let hits = 0;
    while (!isDone(r)) {
      const res = tap(r, r.at!);
      expect(res.hit).toBe(true);
      r = hide(res.round, rand);
      hits++;
    }
    expect(hits).toBe(GHOST_COUNT);
    expect(r.at).toBeNull();
    expect(tap(r, 0).hit).toBe(false);
    expect(new Set(ids(GHOSTS)).size).toBe(GHOST_COUNT);
    expect(new Set(ids(PLACES)).size).toBe(PLACES.length);
  });

  it('shuffled keeps everyone, in a seeded order', () => {
    const a = shuffled([1, 2, 3, 4, 5], mulberry32(1));
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(a).toEqual(shuffled([1, 2, 3, 4, 5], mulberry32(1)));
  });
});

describe('the Halloween games are wired up', () => {
  const GAMES = ['pumpkin', 'treats', 'monster', 'potion', 'peekaboo'] as const;

  it('are registered chunks that only Halloween offers', async () => {
    const halloween = byId('halloween')!;
    const other = byId('christmas')!;
    for (const id of GAMES) {
      expect(ACTIVITY_IDS).toContain(id);
      expect(hasActivity(id)).toBe(true);
      const a = await loadActivity(id);
      expect(a?.id).toBe(id);
      expect(a?.title.length).toBeGreaterThan(0);
      expect(a?.available(halloween, undefined as never)).toBe(true);
      expect(a?.available(other, undefined as never)).toBe(false);
    }
  });

  it('get their own row on the Halloween page and nowhere else', () => {
    expect(ids(holidayGamesFor('halloween')!.links)).toEqual([...GAMES]);
    expect(holidayGamesFor('thanksgiving')).toBeUndefined();
    expect(HOLIDAY_GAMES.filter((g) => g.links.some((l) => (GAMES as readonly string[]).includes(l.id))).length).toBe(1);
    // Not mixed into the everyday activities every holiday links.
    for (const g of GAMES) expect(ids(PLAY_LINKS)).not.toContain(g);
  });
});
