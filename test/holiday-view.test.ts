import { describe, expect, it } from 'vitest';
import { HOLIDAYS, byId, zodiacFor } from '../src/content/registry';
import { loadContent } from '../src/content/loader';
import type { HolidayMeta, Ingredient } from '../src/content/types';
import { parseIso, toDayNumber, type CivilDate } from '../src/dates/civil';
import { nextOccurrence, previousOccurrence, type Occurrence, type Status } from '../src/dates/occurrences';
import { BOOKS } from '../src/play/story/books';
import { ACTIVITY_IDS } from '../src/play/types';
import { matchVoice } from '../src/ui/greetings';
import {
  PLAY_LINKS, STORY_HOLIDAYS, playLinksFor, adventKey, adventVisible, checkedFor, checklistSummary, compactLines, dayPanel, doorState,
  emptyContent, formatTimer, headlineForName, heroModeFor, ingredientParts, initialSection,
  justCelebratedDays, markStepModeOpener, observedFor, otherUnits, playHref, ruleInWords, sectionDomId, sectionsFor, setChecked,
  setReturnFocus, sleepsUntilDoor, spanLines, stickerState, takeReturnFocus, takeStepModeOpener, timerView, timerWords,
  toggleChecked, withTasteTest, zodiacInfo,
} from '../src/ui/sections';

const day = (iso: string): CivilDate => {
  const c = parseIso(iso);
  if (!c) throw new Error(`bad fixture ${iso}`);
  return c;
};

function meta(id: string): HolidayMeta {
  const m = byId(id);
  if (!m) throw new Error(`no meta ${id}`);
  return m;
}

/** The current-or-next occurrence of a real registry holiday on a pinned day (US region). */
function at(id: string, iso: string): { meta: HolidayMeta; occ: Occurrence; status: Status; today: CivilDate } {
  const today = day(iso);
  const next = nextOccurrence(HOLIDAYS, id, today, 'US');
  if (!('occ' in next)) throw new Error(`${id} beyond coverage on ${iso}`);
  return { meta: meta(id), occ: next.occ, status: next.status, today };
}

function panelFor(id: string, iso: string) {
  const x = at(id, iso);
  return dayPanel(x.meta, x.occ, x.status, x.today);
}

describe('sections & pills', () => {
  it('shows every section a tier-1 holiday has, in pill order, Play first', async () => {
    expect(sectionsFor(meta('halloween'), await loadContent('halloween'))).toEqual(['play', 'story', 'make', 'craft', 'facts', 'say', 'dates', 'sticker']);
  });

  it('hides empty sections (a tier-2 holiday without recipes or crafts)', async () => {
    expect(sectionsFor(meta('ramadan'), await loadContent('ramadan'))).toEqual(['play', 'story', 'facts', 'say', 'dates', 'sticker']);
  });

  it('silly days are Play, a story and a fact only', async () => {
    expect(sectionsFor(meta('pirate-day'), await loadContent('pirate-day'))).toEqual(['play', 'story', 'facts']);
  });

  it('a custom day without content keeps Play, its tagline story, dates and sticker', () => {
    expect(sectionsFor({ tier: 2 }, emptyContent(['A special day']))).toEqual(['play', 'story', 'dates', 'sticker']);
  });

  it('?s= scrolls only to a section the page has', () => {
    expect(initialSection('make', ['story', 'make'])).toBe('make');
    expect(initialSection('make', ['story', 'facts'])).toBeNull();
    expect(initialSection(undefined, ['story'])).toBeNull();
    expect(initialSection('play', ['play', 'story'])).toBe('play');
    expect(initialSection('nonsense', ['play', 'story'])).toBeNull();
    expect(sectionDomId('say')).toBe('sec-say');
    expect(sectionDomId('play')).toBe('sec-play');
  });

  it('celebrates on the main day and the first sundown evening only', () => {
    expect(heroModeFor({ kind: 'upcoming', sleeps: 3 })).toBe('holiday');
    expect(heroModeFor({ kind: 'ongoing', day: 2, of: 2, sleepsToMain: 0, tonight: false })).toBe('celebrate');
    expect(heroModeFor({ kind: 'ongoing', day: 1, of: 9, sleepsToMain: 0, tonight: true })).toBe('celebrate');
    expect(heroModeFor({ kind: 'ongoing', day: 1, of: 2, sleepsToMain: 1, tonight: false })).toBe('holiday');
    expect(heroModeFor({ kind: 'ongoing', day: 4, of: 5, sleepsToMain: -1, tonight: false })).toBe('holiday');
    expect(heroModeFor({ kind: 'passed', daysAgo: 1 })).toBe('holiday');
  });

  it('christmas eve is still the holiday page; christmas day celebrates', () => {
    expect(heroModeFor(at('christmas', '2026-12-24').status)).toBe('holiday');
    expect(heroModeFor(at('christmas', '2026-12-25').status)).toBe('celebrate');
  });
});

describe('Play links', () => {

  it('links every activity in a fixed order, all real activity ids', () => {
    expect(PLAY_LINKS.map((p) => p.id)).toEqual(['doors', 'seek', 'color', 'card', 'wish', 'memory', 'catch', 'dressup', 'quiz', 'path', 'story']);
    for (const p of PLAY_LINKS) {
      expect(ACTIVITY_IDS).toContain(p.id);
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.emoji.length).toBeGreaterThan(0);
    }
    expect(playHref('halloween', 'doors')).toBe('#/h/halloween/play/doors');
    // Story Time only links where a book exists, and the list stays in step with the books.
    expect([...STORY_HOLIDAYS].sort()).toEqual(BOOKS.map((b) => b.id).sort());
    expect(playLinksFor('christmas').map((p) => p.id)).toContain('story');
    expect(playLinksFor('pi-day').map((p) => p.id)).not.toContain('story');
    expect(playLinksFor('pi-day').length).toBe(PLAY_LINKS.length - 1);
    expect(playHref('custom-ab12', 'card')).toBe('#/h/custom-ab12/play/card');
  });

});

describe('per-day panel copy', () => {
  it('Hanukkah night 4 lights 4 candles (spec §5.8)', () => {
    const p = panelFor('hanukkah', '2024-12-28');
    expect(p?.headline).toBe('Night 4 of 8 — tonight we light 4 candles');
    expect(p?.candles).toEqual({ lit: 4, of: 8 });
  });

  it('Hanukkah eve is night 1, keeping the day name as the detail', () => {
    const p = panelFor('hanukkah', '2024-12-25');
    expect(p?.headline).toBe('Night 1 of 8 — tonight we light 1 candle');
    expect(p?.detail).toBe('First candle tonight!');
  });

  it("Hanukkah's last day says so, with all eight candles", () => {
    const p = panelFor('hanukkah', '2025-01-02');
    expect(p?.headline).toBe('Last day of Hanukkah');
    expect(p?.candles).toEqual({ lit: 8, of: 8 });
  });

  it('Kwanzaa names the principle of the day and counts the kinara candles', () => {
    const p = panelFor('kwanzaa', '2024-12-28');
    expect(p?.headline).toBe("Day 3 of 7 — today's principle is Ujima (Working Together)");
    expect(p?.candles).toEqual({ lit: 3, of: 7 });
    expect(p?.detail).toBe('3 candles glow on the kinara tonight.');
  });

  it('Diwali names the day and counts sleeps to the big day (spec §5.8)', () => {
    const p = panelFor('diwali', '2025-10-18');
    expect(p?.headline).toBe('Today is Dhanteras');
    expect(p?.detail).toBe('2 sleeps until Lakshmi Puja — Diwali!');
    const main = panelFor('diwali', '2026-11-08');
    expect(main?.headline).toBe('Today is Lakshmi Puja — Diwali!');
    expect(main?.detail).toBe('Day 3 of 5');
  });

  it('Ramadan says day N of M and shows progress through the month', () => {
    const p = panelFor('ramadan', '2030-12-30');
    expect(p?.headline).toBe('Ramadan — Day 5 of 29');
    expect(p?.progress).toBeCloseTo(4 / 28, 6);
  });

  it('day names about tonight stand alone; numbered days carry the holiday name', () => {
    expect(panelFor('passover', '2026-04-01')?.headline).toBe('First seder tonight!');
    expect(panelFor('nowruz', '2026-03-25')?.headline).toBe('Nowruz — Day 5');
    expect(panelFor('christmas', '2026-12-24')?.headline).toBe('Today is Christmas Eve');
    expect(panelFor('christmas', '2026-12-24')?.detail).toBe('1 sleep until Christmas Day');
    expect(headlineForName('Megillah reading tonight', 'Purim')).toBe('Megillah reading tonight');
    expect(headlineForName('Day 1', 'Rosh Hashanah')).toBe('Rosh Hashanah — Day 1');
  });

  it('no panel for single-day holidays, nor before a multi-day one starts (Dates lists its days)', () => {
    expect(panelFor('halloween', '2026-10-31')).toBeNull();
    expect(panelFor('diwali', '2026-10-24')).toBeNull();
  });

  it('long spans keep the ends, the main day, today and real names', () => {
    const x = at('nowruz', '2026-03-25');
    const lines = compactLines(spanLines(x.meta, x.occ, x.today));
    expect(lines.map((l) => l.name)).toEqual(['Nowruz!', 'Day 5', 'Sizdah Bedar — picnic day!']);
    const r = at('ramadan', '2030-12-30');
    expect(compactLines(spanLines(r.meta, r.occ, r.today)).map((l) => l.index)).toEqual([0, 4, 28]);
  });
});

describe('Lunar New Year zodiac', () => {
  it('matches the registry cycle and gives names in three languages', () => {
    for (let y = 2024; y <= 2035; y++) expect(zodiacInfo(y).animal).toBe(zodiacFor(y));
    expect(zodiacInfo(2026)).toMatchObject({ animal: 'Horse', emoji: '🐎', zh: '马', ko: '말', vi: 'Ngựa' });
    expect(zodiacInfo(2035).viNote).toMatch(/Cat/);
  });
});

describe('advent doors', () => {
  it('the strip shows from 1 to 24 December only', () => {
    expect(adventVisible(day('2026-11-30'))).toBe(false);
    expect(adventVisible(day('2026-12-01'))).toBe(true);
    expect(adventVisible(day('2026-12-24'))).toBe(true);
    expect(adventVisible(day('2026-12-25'))).toBe(false);
  });

  it("today's and earlier doors open; later doors wait", () => {
    const today = day('2026-12-08');
    expect(doorState(8, today, {})).toBe('ready');
    expect(doorState(1, today, {})).toBe('ready');
    expect(doorState(9, today, {})).toBe('locked');
    expect(doorState(3, today, { [adventKey(2026, 3)]: true })).toBe('opened');
    expect(doorState(3, day('2027-12-08'), { [adventKey(2026, 3)]: true })).toBe('ready');
    expect(doorState(1, day('2026-11-30'), {})).toBe('locked');
    expect(sleepsUntilDoor(12, today)).toBe(4);
    expect(adventKey(2026, 24)).toBe('2026-24');
  });
});

describe('timers', () => {
  it('formats whole seconds, rounding up', () => {
    expect(formatTimer(600_000)).toBe('10:00');
    expect(formatTimer(599_001)).toBe('10:00');
    expect(formatTimer(59_000)).toBe('0:59');
    expect(formatTimer(0)).toBe('0:00');
    expect(formatTimer(-5)).toBe('0:00');
    expect(formatTimer(3_600_000)).toBe('1:00:00');
    expect(formatTimer(3_661_000)).toBe('1:01:01');
  });

  it('progress runs 0 → 1 and the timer is done at zero', () => {
    expect(timerView(600_000, 0)).toEqual({ remainingMs: 600_000, progress: 0, done: false, label: '10:00' });
    expect(timerView(600_000, 300_000)).toMatchObject({ progress: 0.5, done: false, label: '5:00' });
    expect(timerView(600_000, 700_000)).toEqual({ remainingMs: 0, progress: 1, done: true, label: '0:00' });
    expect(timerView(0, 0).done).toBe(true);
  });

  it('speaks the remaining time in words', () => {
    expect(timerWords(599_000)).toBe('9 minutes 59 seconds left');
    expect(timerWords(3_600_000)).toBe('1 hour left');
    expect(timerWords(61_000)).toBe('1 minute 1 second left');
    expect(timerWords(0)).toBe('0 seconds left');
  });
});

describe('ingredient checklist & units', () => {
  it('toggles immutably and summarises', () => {
    const a = new Set<number>();
    const b = toggleChecked(a, 2);
    expect([...a]).toEqual([]);
    expect([...b]).toEqual([2]);
    expect([...toggleChecked(b, 2)]).toEqual([]);
    expect(checklistSummary(3, 11)).toBe('3 of 11 ready');
    expect(checklistSummary(11, 11)).toBe('Everything is ready!');
    expect(checklistSummary(0, 0)).toBe('0 of 0 ready');
  });

  it('remembers ticks per recipe for the session', () => {
    setChecked('test/recipe/ingredients', new Set([0, 3]));
    expect([...checkedFor('test/recipe/ingredients')].sort()).toEqual([0, 3]);
    expect(checkedFor('test/other/ingredients').size).toBe(0);
  });

  it('switches between cups and grams, deriving the missing side', () => {
    const flour: Ingredient = { item: 'all-purpose flour', us: { qty: 3, unit: 'cup' }, metric: { qty: 360, unit: 'g' }, note: 'sifted' };
    expect(ingredientParts(flour, 'us')).toEqual({ qty: '3 cups', item: 'all-purpose flour', note: 'sifted', optional: false });
    expect(ingredientParts(flour, 'metric').qty).toBe('360 g');
    expect(ingredientParts({ item: 'milk', us: { qty: 1, unit: 'cup' } }, 'metric').qty).toBe('240 ml');
    expect(ingredientParts({ item: 'juice', metric: { qty: 120, unit: 'ml' }, optional: true }, 'us')).toMatchObject({ qty: '½ cup', optional: true });
    expect(ingredientParts({ item: 'bananas', us: { qty: 2, unit: 'piece' } }, 'metric').qty).toBe('2');
    expect(otherUnits('us')).toBe('metric');
    expect(otherUnits('metric')).toBe('us');
  });

  it('Step Mode always ends on Taste test!', async () => {
    expect(withTasteTest([{ text: 'Mix.' }], (text) => ({ text })).map((s) => s.text)).toEqual(['Mix.', 'Taste test!']);
    expect(withTasteTest([{ text: 'Taste test! Yum.' }], (text) => ({ text }))).toHaveLength(1);
    const christmas = await loadContent('christmas');
    for (const r of christmas.recipes) expect(withTasteTest(r.steps, (text) => ({ text }))).toHaveLength(r.steps.length);
  });
});

describe('dates helpers', () => {
  it('shows the day-off chip only where the shift applies', () => {
    const july4 = at('independence-day-us', '2026-06-01');
    expect(observedFor(july4.meta, july4.occ, 'US')).toBe(toDayNumber(day('2026-07-03')));
    expect(observedFor(july4.meta, july4.occ, 'GB')).toBeNull();
    const canada = at('canada-day', '2028-06-01');
    expect(observedFor(canada.meta, canada.occ, 'CA')).toBe(toDayNumber(day('2028-07-03')));
    expect(observedFor(canada.meta, canada.occ, 'US')).toBeNull();
    const halloween = at('halloween', '2026-10-01');
    expect(observedFor(halloween.meta, halloween.occ, 'US')).toBeNull();
  });

  it('"we just celebrated" lasts seven days after the span ends', () => {
    const prev = previousOccurrence(HOLIDAYS, 'halloween', day('2026-11-01'), 'US');
    expect(justCelebratedDays(prev, day('2026-11-01'))).toBe(1);
    expect(justCelebratedDays(prev, day('2026-11-07'))).toBe(7);
    expect(justCelebratedDays(prev, day('2026-11-08'))).toBeNull();
    expect(justCelebratedDays(undefined, day('2026-11-01'))).toBeNull();
  });

  it('describes computed rules in words', () => {
    const nameOf = (id: string): string | undefined => byId(id)?.name;
    expect(ruleInWords(meta('thanksgiving').rule, 'US', nameOf, 'en-US')).toBe('the fourth Thursday of November');
    expect(ruleInWords(meta('thanksgiving').rule, 'CA', nameOf, 'en-US')).toBe('the second Monday of October');
    expect(ruleInWords(meta('memorial-day').rule, 'US', nameOf, 'en-US')).toBe('the last Monday of May');
    expect(ruleInWords(meta('halloween').rule, 'US', nameOf, 'en-US')).toBe('October 31 every year');
    expect(ruleInWords(meta('halloween').rule, 'GB', nameOf, 'en-GB')).toBe('31 October every year');
    expect(ruleInWords(meta('leap-day').rule, 'US', nameOf, 'en-US')).toBe('29 February, which only exists in leap years');
    expect(ruleInWords(meta('pancake-day').rule, 'GB', nameOf, 'en-GB')).toBe('47 days before Easter Sunday');
    expect(ruleInWords(meta('mothers-day').rule, 'GB', nameOf, 'en-GB')).toBe('21 days before Easter Sunday');
    expect(ruleInWords(meta('mothers-day').rule, 'FR', nameOf, 'fr')).toMatch(/^the last Sunday of May, or the first Sunday of June/i);
    expect(ruleInWords(meta('lantern-festival').rule, 'US', nameOf, 'en-US')).toBe('14 days after Lunar New Year');
    expect(ruleInWords(meta('easter').rule, 'US', nameOf, 'en-US')).toMatch(/first Sunday after the first full moon of spring/);
    expect(ruleInWords(meta('orthodox-easter').rule, 'US', nameOf, 'en-US')).toMatch(/Julian calendar/);
  });

});

describe('sticker state', () => {
  const diwali = at('diwali', '2026-11-06');
  it('earned for the occurrence under way', () => {
    expect(stickerState('diwali', { 'diwali:2026': '2026-11-06' }, diwali.occ, undefined, diwali.today))
      .toEqual({ kind: 'earned', year: 2026, on: '2026-11-06' });
  });
  it("last year's sticker still shows while the next one is coming", () => {
    const soon = at('diwali', '2026-10-24');
    const prev = previousOccurrence(HOLIDAYS, 'diwali', soon.today, 'US');
    expect(stickerState('diwali', { 'diwali:2025': '2025-10-20' }, soon.occ, prev, soon.today)).toMatchObject({ kind: 'earned', year: 2025 });
  });
  it('a silhouette waits for the next one (see you next year)', () => {
    const later = at('halloween', '2026-11-02');
    const state = stickerState('halloween', {}, later.occ, undefined, later.today);
    expect(state).toMatchObject({ kind: 'waiting', nextYear: true });
    expect(stickerState('x', {}, null, undefined, later.today)).toEqual({ kind: 'unknown' });
  });
});

describe('Step Mode hand-off', () => {
  it('knows when Step Mode was opened from its holiday page', () => {
    markStepModeOpener('christmas', 'gingerbread-cookies', 1000);
    expect(takeStepModeOpener('christmas', 'gingerbread-cookies', 1200)).toBe(true);
    expect(takeStepModeOpener('christmas', 'gingerbread-cookies', 1300)).toBe(false);
    markStepModeOpener('christmas', 'gingerbread-cookies', 1000);
    expect(takeStepModeOpener('christmas', 'gingerbread-cookies', 3000)).toBe(false);
    markStepModeOpener('christmas', 'gingerbread-cookies', 1000);
    expect(takeStepModeOpener('christmas', 'snowman-marshmallow-pops', 1100)).toBe(false);
  });

  it('returns focus to the recipe card once, on the right holiday', () => {
    setReturnFocus('christmas', 'gingerbread-cookies', 5000);
    expect(takeReturnFocus('hanukkah', 5100)).toBeNull();
    setReturnFocus('christmas', 'gingerbread-cookies', 5000);
    expect(takeReturnFocus('christmas', 5100)).toBe('gingerbread-cookies');
    expect(takeReturnFocus('christmas', 5200)).toBeNull();
    setReturnFocus('christmas', 'gingerbread-cookies', 5000);
    expect(takeReturnFocus('christmas', 9000)).toBeNull();
  });
});

describe('greeting voices', () => {
  const voices = [{ lang: 'en-US' }, { lang: 'zh-HK' }, { lang: 'zh-CN' }, { lang: 'es-ES' }, { lang: 'es-MX' }, { lang: 'iw-IL' }, { lang: 'fil-PH' }, { lang: 'ko_KR' }];
  it('needs a voice whose language starts with the primary subtag', () => {
    expect(matchVoice(voices, 'zh-Hans')?.lang).toBe('zh-CN');
    expect(matchVoice(voices, 'yue')).toBeNull();
    expect(matchVoice(voices, 'es-MX')?.lang).toBe('es-MX');
    expect(matchVoice([{ lang: 'es-ES' }], 'es-MX')?.lang).toBe('es-ES');
    expect(matchVoice(voices, 'he')?.lang).toBe('iw-IL');
    expect(matchVoice(voices, 'tl')?.lang).toBe('fil-PH');
    expect(matchVoice(voices, 'ko')?.lang).toBe('ko_KR');
    expect(matchVoice(voices, 'prs')).toBeNull();
    expect(matchVoice([], 'fr')).toBeNull();
  });
});
