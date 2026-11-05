import { beforeAll, describe, expect, it } from 'vitest';
import { CONTENT_LOADERS } from '../src/content/loader';
import { HOLIDAYS, byId } from '../src/content/registry';
import type { HolidayContent } from '../src/content/types';
import { mulberry32 } from '../src/effects/rng';
import { hoursPhrase, isDayHour, isNightHour, newYearPair, newYearReference, nightPair, quizCities } from '../src/play/quiz/clocks';
import { COPY } from '../src/play/quiz/copy';
import { countryLabel, countryPhrase, countryPhraseStart, PLACES, WELL_KNOWN } from '../src/play/quiz/places';
import {
  EVERYTHING, LIST_SIZE, ROUND_LENGTH, SILLY, answerLine, buildRound, celebratedOutlined, celebratingCountries, factCandidates, greetDistractors, greetQuestions,
  hasHolidayRound, isRight, listChoices, mixHolidays, newYearQuestion, nightQuestion, placeQuestions, usableGreetings,
  type MapQuestion, type Question,
} from '../src/play/quiz/questions';
import { mainRings, silhouettePath } from '../src/play/quiz/silhouette';
import { quizActivity } from '../src/play/quiz/index';
import { CELEBRATED } from '../src/world/data/celebrated';
import { COUNTRY_NAMES } from '../src/world/data/countries';
import { localClock, offsetMinutes } from '../src/world/zones';

const contents = new Map<string, HolidayContent>();
const NOW = new Date(Date.UTC(2026, 9, 22, 15, 30));

beforeAll(async () => {
  for (const [id, load] of Object.entries(CONTENT_LOADERS)) contents.set(id, await load());
});

const mapQs = (qs: readonly Question[]): MapQuestion[] => qs.filter((q): q is MapQuestion => q.kind === 'map');

/** Everything a child reads: prompts, reveals, card text, list labels. */
function texts(q: Question): string[] {
  if (q.kind === 'map') return [q.prompt, q.reveal, ...q.choices.map((c) => c.label)];
  if (q.kind === 'fact') return q.truth ? [] : [q.text, q.back];
  // The greeting itself is another language: only the holiday names are checked.
  return q.options.map((o) => o.name);
}

/** A light readability lint for a seven-year-old: short sentences, no long words, nothing judging. */
function readable(s: string): string[] {
  const problems: string[] = [];
  // A dash is a breath, like a full stop, when read aloud.
  const sentences = s.split(/(?<=[.!?])\s+|\s+—\s+/);
  for (const t of sentences) {
    const words = t.split(/\s+/).filter(Boolean);
    if (words.length > 24) problems.push(`long sentence (${words.length} words): ${t}`);
  }
  for (const w of s.split(/[^A-Za-zÀ-ÿ']+/)) if (w.length > 13) problems.push(`long word: ${w}`);
  if (/\b(wrong|incorrect|fail|failed|lose|lost|score|points|lives|oops)\b/i.test(s)) problems.push(`judging word: ${s}`);
  if (/http|www\.|\.com/i.test(s)) problems.push(`link: ${s}`);
  return problems;
}

describe('places table (the answer-key lint)', () => {
  it('every answer is an outlined country that CELEBRATED lists for that holiday', () => {
    for (const p of PLACES) {
      expect(byId(p.holiday), p.holiday).toBeDefined();
      const c = CELEBRATED[p.holiday];
      expect(c, p.holiday).toBeDefined();
      for (const iso of p.answers) {
        expect(COUNTRY_NAMES[iso], `${p.holiday} ${iso} outlined`).toBeDefined();
        expect(c!.countries, `${p.holiday} → ${iso}`).toContain(iso);
      }
      if (p.kind !== 'doing') expect(p.answers.length, p.prompt).toBeGreaterThan(0);
    }
  });

  it('prompts and reveals read well for a seven-year-old', () => {
    for (const p of PLACES) {
      expect(p.prompt.length, p.prompt).toBeLessThanOrEqual(120);
      expect(/[?.!]$/.test(p.prompt), p.prompt).toBe(true);
      expect(readable(p.prompt), p.prompt).toEqual([]);
      if (p.reveal) {
        expect(p.reveal.length, p.reveal).toBeLessThanOrEqual(140);
        expect(readable(p.reveal), p.reveal).toEqual([]);
      }
    }
  });

  it('every tier-1 holiday with a map entry gets at least two place questions', () => {
    for (const m of HOLIDAYS.filter((x) => x.tier === 1 && CELEBRATED[x.id])) {
      if (m.id === 'new-years-day' || m.id === 'pi-day') continue;
      const n = placeQuestions(m, mulberry32(1)).length;
      expect(n, m.id).toBeGreaterThanOrEqual(m.id === 'new-years-eve' || m.id === 'juneteenth' || m.id === 'independence-day-us' || m.id === 'kwanzaa' || m.id === 'thanksgiving' || m.id === 'st-patricks-day' || m.id === 'mothers-day' || m.id === 'fathers-day' || m.id === 'earth-day' || m.id === 'easter' ? 1 : 2);
    }
  });

  it('friendly names: full words and the right article', () => {
    expect(countryLabel('CD')).toBe('DR Congo');
    expect(countryLabel('US')).toBe('USA');
    expect(countryPhrase('US')).toBe('the USA');
    expect(countryPhraseStart('US')).toBe('The USA');
    expect(countryPhrase('NP')).toBe('Nepal');
    for (const iso of Object.keys(COUNTRY_NAMES)) expect(countryLabel(iso), iso).not.toMatch(/\.$|\. /);
    for (const iso of WELL_KNOWN) expect(COUNTRY_NAMES[iso], iso).toBeDefined();
  });
});

describe('generated rounds', () => {
  const scopes = [...HOLIDAYS.map((m) => m.id), EVERYTHING];

  it(`every scope gives ${ROUND_LENGTH} distinct questions, and every map answer is valid`, () => {
    for (const scope of scopes) {
      for (let seed = 1; seed <= 12; seed++) {
        const round = buildRound({ scope, metas: HOLIDAYS, contents, now: NOW, rand: mulberry32(seed * 7919 + scope.length) });
        expect(round.length, scope).toBe(ROUND_LENGTH);
        expect(new Set(round.map((q) => q.key)).size, `${scope} unique`).toBe(ROUND_LENGTH);
        for (const q of mapQs(round)) {
          if (!q.any) {
            expect(q.answers.length, q.key).toBeGreaterThan(0);
            expect(q.answers, q.key).toContain(q.primary);
          }
          for (const iso of q.answers) {
            expect(COUNTRY_NAMES[iso], `${q.key} ${iso}`).toBeDefined();
            if (q.holiday) expect(celebratingCountries(q.holiday), `${q.key} → ${iso}`).toContain(iso);
          }
          expect(q.choices.some((c) => isRight(q, c.iso)), `${q.key} list has a right answer`).toBe(true);
          expect(new Set(q.choices.map((c) => c.iso)).size, `${q.key} list unique`).toBe(q.choices.length);
          for (const c of q.choices) expect(COUNTRY_NAMES[c.iso], c.iso).toBeDefined();
        }
        for (const q of round) for (const t of texts(q)) expect(readable(t), `${scope}: ${t}`).toEqual([]);
      }
    }
  });

  it('Easter questions count Orthodox Easter countries (Greece keeps Easter too)', () => {
    const easter = byId('easter')!;
    const doing = placeQuestions(easter, mulberry32(3)).find((q) => q.place === 'doing')!;
    expect(isRight(doing, 'GR')).toBe(true);
    expect(isRight(doing, 'RU')).toBe(true);
    expect(isRight(doing, 'FR')).toBe(true);
    expect(isRight(doing, 'CN')).toBe(false);
    // Christmas already lists the Orthodox countries; the sibling map adds nothing it should not.
    expect(celebratingCountries('christmas')).toEqual(CELEBRATED.christmas!.countries.filter((x, i, a) => a.indexOf(x) === i));
  });

  it('a holiday round is about that holiday', () => {
    for (const id of ['diwali', 'songkran', 'day-of-the-dead', 'eid-al-fitr', 'christmas', 'halloween']) {
      const round = buildRound({ scope: id, metas: HOLIDAYS, contents, now: NOW, rand: mulberry32(5) });
      const geo = mapQs(round).filter((q) => q.view === 'globe');
      expect(geo.length, id).toBeGreaterThanOrEqual(2);
      for (const q of geo) expect(q.holiday).toBe(id);
      const cards = round.filter((q) => q.kind !== 'map');
      expect(cards.length, id).toBeGreaterThanOrEqual(1);
      // Globe and cards take turns: never three map questions in a row.
      const kinds = round.map((q) => (q.kind === 'map' ? 'm' : 'c')).join('');
      expect(kinds, id).not.toContain('mmm');
    }
  });

  it('the plain question covers everyone who celebrates; the curated "doing" narrows it', () => {
    const songkran = placeQuestions(byId('songkran')!, mulberry32(1)).find((q) => q.place === 'doing')!;
    expect(songkran.prompt).toContain('water fights');
    expect([...songkran.answers].sort()).toEqual(['KH', 'LA', 'MM', 'TH']);
    const christmas = placeQuestions(byId('christmas')!, mulberry32(1)).find((q) => q.key.endsWith(':plain'))!;
    expect(christmas.answers).toEqual(celebratedOutlined('christmas'));
    const earth = placeQuestions(byId('earth-day')!, mulberry32(1))[0]!;
    expect(earth.any).toBe(true);
    expect(isRight(earth, 'BR')).toBe(true);
  });

  it('seeded: the same seed replays the same round, different seeds rarely repeat', () => {
    const sig = (seed: number, scope: string): string =>
      buildRound({ scope, metas: HOLIDAYS, contents, now: NOW, rand: mulberry32(seed) }).map((q) => q.key).join('|');
    expect(sig(42, 'diwali')).toBe(sig(42, 'diwali'));
    const mix = new Set(Array.from({ length: 40 }, (_, i) => sig(i + 1, EVERYTHING)));
    expect(mix.size).toBeGreaterThanOrEqual(38);
    const diwali = new Set(Array.from({ length: 40 }, (_, i) => sig(i + 1, 'diwali')));
    expect(diwali.size).toBeGreaterThanOrEqual(25);
  });

  it('recently seen questions go to the back of the queue', () => {
    const first = buildRound({ scope: 'christmas', metas: HOLIDAYS, contents, now: NOW, rand: mulberry32(3) });
    const avoid = new Set(first.map((q) => q.key));
    const second = buildRound({ scope: 'christmas', metas: HOLIDAYS, contents, now: NOW, rand: mulberry32(4), avoid });
    const repeats = second.filter((q) => avoid.has(q.key) && q.kind === 'fact' && q.truth);
    expect(repeats.length).toBe(0);
  });

  it('a silly day without places of its own still gets a full Everything round', () => {
    const silly = HOLIDAYS.find((m) => m.tier === 3)!;
    expect(hasHolidayRound(silly)).toBe(false);
    const round = buildRound({ scope: silly.id, metas: HOLIDAYS, contents, now: NOW, rand: mulberry32(9) });
    expect(round.length).toBe(ROUND_LENGTH);
    expect(mixHolidays(HOLIDAYS).length).toBeGreaterThan(30);
  });

  it('wrong taps get a gentle line, right taps a cheer', () => {
    const q = placeQuestions(byId('day-of-the-dead')!, mulberry32(1)).find((x) => x.place === 'began')!;
    expect(answerLine(q, 'MX', 'Yes!')).toBe('Yes! Mexico!');
    expect(answerLine(q, 'BR', 'Yes!')).toBe("That's Brazil. Here's Mexico!");
    const kw = placeQuestions(byId('kwanzaa')!, mulberry32(1)).find((x) => x.place === 'began')!;
    expect(answerLine(kw, 'CA', 'Yes!')).toBe("That's Canada. Here's the USA!");
  });
});

describe('list fallback', () => {
  it(`offers ${LIST_SIZE} big buttons with a right answer, well-known places first`, () => {
    for (let s = 1; s < 60; s++) {
      const rand = mulberry32(s);
      const nepal = listChoices(['NP'], false, rand);
      expect(nepal.length).toBe(LIST_SIZE);
      expect(nepal.map((c) => c.iso)).toContain('NP');
      const xmas = listChoices(celebratedOutlined('christmas'), false, rand);
      expect(xmas.length).toBe(LIST_SIZE);
      expect(xmas.filter((c) => celebratedOutlined('christmas').includes(c.iso)).length).toBe(2);
    }
  });
});

describe('time questions', () => {
  it('New Year: the first city really reaches midnight first, by whole or half hours', () => {
    const ref = newYearReference(2026);
    for (let s = 1; s <= 80; s++) {
      const p = newYearPair(mulberry32(s), 2026)!;
      expect(p).not.toBeNull();
      const d = offsetMinutes(p.first.tz, ref) - offsetMinutes(p.second.tz, ref);
      expect(d).toBe(p.minutes);
      expect(d).toBeGreaterThanOrEqual(180);
      expect(d % 30).toBe(0);
      expect(p.first.country).not.toBe(p.second.country);
      expect(COUNTRY_NAMES[p.first.country]).toBeDefined();
      expect(COUNTRY_NAMES[p.second.country]).toBeDefined();
    }
    const q = newYearQuestion(mulberry32(2), NOW)!;
    expect(q.view).toBe('map');
    expect(q.pins.length).toBe(2);
    expect(q.choices.map((c) => c.iso)).toContain(q.primary);
  });

  it('night: the night city is between 8 pm and 5 am, the day one between 9 am and 5 pm', () => {
    for (let hour = 0; hour < 24; hour += 3) {
      const now = new Date(Date.UTC(2026, 0, 15, hour, 10));
      for (let s = 1; s <= 10; s++) {
        const p = nightPair(mulberry32(s + hour), now)!;
        expect(p, `${hour}h`).not.toBeNull();
        expect(isNightHour(localClock(p.night.tz, now).h)).toBe(true);
        expect(isDayHour(localClock(p.day.tz, now).h)).toBe(true);
      }
    }
    const q = nightQuestion(mulberry32(1), NOW)!;
    expect(q.reveal).toContain('{nightTime}');
  });

  it('only cities a child can tap', () => {
    for (const c of quizCities()) expect(COUNTRY_NAMES[c.country], c.id).toBeDefined();
  });

  it('hours read naturally', () => {
    expect(hoursPhrase(60)).toBe('one hour');
    expect(hoursPhrase(480)).toBe('8 hours');
    expect(hoursPhrase(330)).toBe('5 and a half hours');
  });
});

describe('cards', () => {
  it('real fact cards come from the holiday, short enough to read', () => {
    const facts = factCandidates('diwali', contents.get('diwali'));
    expect(facts.length).toBeGreaterThan(0);
    for (const f of facts) {
      expect(f.truth).toBe(true);
      expect(contents.get('diwali')!.facts.map((x) => x.text)).toContain(f.text);
      expect(f.text.length).toBeLessThanOrEqual(170);
    }
  });

  it("Jubi's jokes are plainly silly and never about anyone's holiday", () => {
    const names = HOLIDAYS.flatMap((m) => [m.name, ...(m.alsoCalled ?? [])]).filter((n) => n.length > 4);
    for (const s of SILLY) {
      for (const n of names) expect(s.text.includes(n), `${s.text} / ${n}`).toBe(false);
      expect(readable(s.text)).toEqual([]);
      expect(readable(s.back)).toEqual([]);
    }
  });

  it('greetings: the answer is the holiday, the other two can never say the same thing', () => {
    let count = 0;
    for (const m of HOLIDAYS.filter((x) => x.tier !== 3)) {
      for (const q of greetQuestions(m, HOLIDAYS, contents, mulberry32(1))) {
        count++;
        expect(q.options.length).toBe(3);
        expect(q.options.map((o) => o.id)).toContain(m.id);
        expect(new Set(q.options.map((o) => o.id)).size).toBe(3);
        expect(contents.get(m.id)!.greetings).toContain(q.greeting);
        const shown = (q.greeting.roman ?? q.greeting.text).toLowerCase();
        expect(shown).not.toContain(m.name.toLowerCase());
        for (const o of q.options.filter((x) => x.id !== m.id)) {
          const other = contents.get(o.id);
          if (other) for (const g of other.greetings) expect((g.roman ?? g.text).toLowerCase(), `${m.id} vs ${o.id}`).not.toBe(shown);
          expect(byId(o.id)!.traditions.some((t) => t !== 'secular' && t !== 'civic' && m.traditions.includes(t)), `${m.id}/${o.id}`).toBe(false);
        }
      }
    }
    expect(count).toBeGreaterThan(40);
  });

  it('greetings that give the answer away are skipped', () => {
    const d = usableGreetings(byId('diwali')!, contents.get('diwali')).map((x) => x.display);
    expect(d).not.toContain('Shubh Deepavali');
    expect(d).toContain('Saal Mubarak');
    // "Saal Mubarak" means Happy New Year, so no New Year holiday may sit beside it.
    const g = contents.get('diwali')!.greetings.find((x) => x.roman === 'Saal Mubarak')!;
    for (const m of greetDistractors(byId('diwali')!, g, HOLIDAYS, contents)) expect(m.tags).not.toContain('new-year');
    const eid = greetDistractors(byId('eid-al-fitr')!, contents.get('eid-al-fitr')!.greetings[0]!, HOLIDAYS, contents).map((m) => m.id);
    expect(eid).not.toContain('eid-al-adha');
    expect(eid).not.toContain('ramadan');
    const easter = contents.get('easter')!.greetings.find((x) => x.roman === 'Christos Anesti')!;
    expect(greetDistractors(byId('easter')!, easter, HOLIDAYS, contents).map((m) => m.id)).not.toContain('orthodox-easter');
  });
});

describe('silhouettes', () => {
  it('every outlined country draws inside its box', () => {
    for (const iso of Object.keys(COUNTRY_NAMES)) {
      const d = silhouettePath(iso, 48, 4);
      expect(d.length, iso).toBeGreaterThan(10);
      const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      for (const n of nums) { expect(n, iso).toBeGreaterThanOrEqual(3.9); expect(n, iso).toBeLessThanOrEqual(44.1); }
    }
    expect(silhouettePath('ZZ')).toBe('');
  });

  it('far-off pieces are left out, nearby islands kept', () => {
    expect(mainRings('US').length).toBe(1);
    expect(mainRings('JP').length).toBeGreaterThanOrEqual(3);
  });
});

describe('activity', () => {
  it('is available wherever the World map knows the holiday', () => {
    expect(quizActivity.id).toBe('quiz');
    expect(quizActivity.title).toBe(COPY.title);
    const diwali = byId('diwali')!;
    expect(quizActivity.available(diwali, contents.get('diwali')!)).toBe(true);
    const custom = { ...diwali, id: 'custom-birthday' };
    expect(quizActivity.available(custom, contents.get('diwali')!)).toBe(false);
  });
});
