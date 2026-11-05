import { describe, expect, it } from 'vitest';
import { allergenNote, BADGES, COPY, fmt, hazardSentence, listJoin, milestoneCopy, TAB_LABELS, VIEW_NAMES } from '../src/ui/copy';

/** The keys spec §14 says must exist. */
const SPEC_KEYS = [
  'milestone.100', 'milestone.50', 'milestone.10', 'milestone.3', 'milestone.1', 'milestone.0', 'tonight', 'dayOf', 'nightOf',
  'lastDay', 'justCelebrated', 'nextIn', 'beyondCoverage', 'expected', 'altDay', 'pretend', 'dayOff', 'ribbon.today',
  'seeYouNextYear', 'noAllergens', 'checkLabels', 'grownUpNeeded', 'tasteTest', 'notYet', 'rare',
  'justKidding', 'stackedToday',
] as const;

describe('copy', () => {
  it('has every §14 key with the documented wording', () => {
    for (const k of SPEC_KEYS) expect(typeof COPY[k], k).toBe('string');
    expect(COPY['milestone.100']).toBe("A hundred sleeps! That's a lot of pancakes.");
    expect(COPY.beyondCoverage).toBe('My calendar for this holiday ends in 2035');
    expect(COPY.dayOf).toBe('Day {day} of {of}');
    expect(COPY.stackedToday).toBe('Today is {a}… and tonight {b} begins!');
  });

  it('never contains links or shaming words', () => {
    for (const v of Object.values(COPY)) {
      expect(v).not.toMatch(/http|www\.|\.com\b/i);
      expect(v).not.toMatch(/\bstreak\b|\blocked\b/i);
    }
  });

  it('fmt fills placeholders and leaves unknown ones visible', () => {
    expect(fmt('dayOf', { day: 3, of: 8 })).toBe('Day 3 of 8');
    expect(fmt('pretend', { date: 'Thursday, 31 October 2030' })).toBe("Pretending it's Thursday, 31 October 2030");
    expect(fmt('notYet')).toBe('Not yet! {n} more sleeps');
  });

  it('milestone copy only on milestones', () => {
    expect(milestoneCopy(100)).toBe(COPY['milestone.100']);
    expect(milestoneCopy(0)).toBe("IT'S TODAY!");
    expect(milestoneCopy(7)).toBeNull();
  });

  it('names every view, every tab and every badge', () => {
    expect(Object.keys(VIEW_NAMES).sort()).toEqual(['grownups', 'holiday', 'home', 'parade', 'play', 'recipe', 'stickers', 'world', 'year']);
    expect(Object.keys(TAB_LABELS)).toEqual(['next', 'all', 'world', 'year', 'stickers']);
    expect(Object.keys(BADGES).sort()).toEqual(['early-bird', 'fact-finder', 'first-footer', 'little-chef', 'world-traveler']);
    expect(BADGES['first-footer'].description).toMatch(/New Year/);
  });

  it('allergen and hazard sentences', () => {
    expect(allergenNote([])).toBe('No major allergens');
    expect(allergenNote(['milk', 'wheat', 'gluten'])).toBeNull();
    expect(allergenNote(['milk'], ['peanut'])).toBe('May contain peanuts');
    expect(hazardSentence(['heat'], true)).toBe('Grown-up step: hot oven or stove');
    expect(hazardSentence([], true)).toBe('Grown-up step');
    expect(hazardSentence(['small-parts'])).toBe('Careful: small parts');
    expect(hazardSentence([])).toBe('');
    expect(listJoin(['a'])).toBe('a');
    expect(listJoin(['a', 'b'])).toBe('a and b');
  });
});
