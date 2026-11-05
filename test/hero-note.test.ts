/**
 * hero-note.test.ts — the hero keeps only a short date note; long grown-up explanations move to "How we know".
 */
import { describe, expect, it } from 'vitest';
import { heroNote } from '../src/ui/dates';

describe('heroNote', () => {
  it('keeps a short note and drops a bracketed aside', () => {
    expect(heroNote('Year of the Horse')).toBe('Year of the Horse');
    expect(heroNote('Year of the Goat (Korea celebrates Seollal on 7 February: the new moon falls at 23:56 Beijing time)')).toBe('Year of the Goat');
  });

  it('leaves long explanations to the grown-ups', () => {
    expect(heroNote('Contested: the full-moon tithi runs from the evening of 21 March into the afternoon of the 22nd')).toBeNull();
    expect(heroNote(undefined)).toBeNull();
    expect(heroNote('')).toBeNull();
  });
});
