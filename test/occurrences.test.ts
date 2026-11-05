import { describe, expect, it } from 'vitest';
import type { CustomHoliday, HolidayMeta } from '../src/content/types';
import { MONDAY, THURSDAY, formatIso, fromDayNumber, parseIso, type CivilDate } from '../src/dates/civil';
import { labelFor, candlesLit } from '../src/dates/countdown';
import {
  afterThat, allOccurrences, customToMeta, expand, happeningNow, isOnForRegion, nextOccurrence, nextThree, nextUp,
  occurrencesForYear, previousOccurrence, stackedToday, statusOf, withCustoms, type Occurrence, type Status,
} from '../src/dates/occurrences';
import { ruleContextFor, type DateRule } from '../src/dates/rules';

// ───────── fixture catalog (metas copied from spec §2; content lane owns the real registry) ─────────

function def(id: string, name: string, rule: DateRule, extra: Partial<HolidayMeta> = {}): HolidayMeta {
  return {
    id, name, emoji: '🎉', tagline: `${name}!`, tier: 1, tags: ['family'], traditions: ['secular'], rule,
    theme: 'silly', effect: 'confetti', sticker: { id: `${id}-sticker`, emoji: '⭐', label: name }, ...extra,
  };
}
const fixed = (month: number, day: number): DateRule => ({ kind: 'fixed', month, day });

const HANUKKAH_NAMES = ['First candle tonight!', 'Night 2', 'Night 3', 'Night 4', 'Night 5', 'Night 6', 'Night 7', 'Night 8', 'Last day of Hanukkah'];
const KWANZAA_NAMES = ['Umoja (Unity)', 'Kujichagulia (Self-Determination)', 'Ujima', 'Ujamaa', 'Nia', 'Kuumba', 'Imani'];

const METAS: readonly HolidayMeta[] = [
  def('christmas', 'Christmas', fixed(12, 25), { observedShift: 'us-federal', startOffset: -1, days: 2, mainDayOffset: 1, dayNames: ['Christmas Eve', 'Christmas Day'], priority: 10 }),
  def('hanukkah', 'Hanukkah', { kind: 'table', table: 'hanukkah' }, { beginsAtSundown: true, days: 8, mainDayOffset: 0, dayNames: HANUKKAH_NAMES, priority: 10 }),
  def('kwanzaa', 'Kwanzaa', fixed(12, 26), { days: 7, mainDayOffset: 0, dayNames: KWANZAA_NAMES, regions: ['US'], priority: 5 }),
  def('boxing-day', 'Boxing Day', fixed(12, 26), { tier: 2, regions: ['GB', 'CA', 'AU'], priority: 5 }),
  def('diwali', 'Diwali', { kind: 'table', table: 'diwali' }, { startOffset: -2, days: 5, mainDayOffset: 2, dayNames: ['Dhanteras', 'Naraka Chaturdashi (Choti Diwali)', 'Lakshmi Puja — Diwali!', 'Govardhan Puja', 'Bhai Dooj'], priority: 10 }),
  def('ramadan', 'Ramadan', { kind: 'table', table: 'ramadan-start' }, { tier: 2, days: { untilTable: 'eid-al-fitr' }, mainDayOffset: 0, priority: 10 }),
  def('eid-al-fitr', 'Eid al-Fitr', { kind: 'table', table: 'eid-al-fitr' }, { days: 3, mainDayOffset: 0, priority: 10 }),
  def('easter', 'Easter', { kind: 'easter', offset: 0, calendar: 'gregorian' }, { priority: 10 }),
  def('orthodox-easter', 'Orthodox Easter', { kind: 'easter', offset: 0, calendar: 'julian' }, { tier: 2, priority: 10 }),
  def('leap-day', 'Leap Day', fixed(2, 29), { tier: 2 }),
  def('lunar-new-year', 'Lunar New Year', { kind: 'table', table: 'lunar-new-year' }, { days: 15, mainDayOffset: 0, priority: 10 }),
  def('lantern-festival', 'Lantern Festival', { kind: 'relative', to: 'lunar-new-year', offset: 14 }, { tier: 2 }),
  def('halloween', 'Halloween', fixed(10, 31)),
  def('juneteenth', 'Juneteenth', fixed(6, 19), { observedShift: 'us-federal', regions: ['US'], priority: 10 }),
  def('canada-day', 'Canada Day', fixed(7, 1), { tier: 2, observedShift: 'next-monday', regions: ['CA'], priority: 10 }),
  def('independence-day-us', 'Independence Day', fixed(7, 4), { observedShift: 'us-federal', regions: ['US'], priority: 10 }),
  def('labor-day', 'Labor Day', { kind: 'nthWeekday', month: 9, weekday: MONDAY, n: 1 }, { tier: 2, regions: ['US'] }),
  def('grandparents-day', 'Grandparents Day', { kind: 'relative', to: 'labor-day', offset: 6 }, { tier: 2, regions: ['US'] }),
  def('pi-day', 'Pi Day', fixed(3, 14)),
  def('cinco-de-mayo', 'Cinco de Mayo', fixed(5, 5), { tier: 2, regions: ['US', 'MX'], priority: 10 }),
  def('childrens-day-japan', "Children's Day", fixed(5, 5), { tier: 2, priority: 5 }),
  def('thanksgiving', 'Thanksgiving', { kind: 'byRegion', variants: { CA: { kind: 'nthWeekday', month: 10, weekday: MONDAY, n: 2 } }, fallback: { kind: 'nthWeekday', month: 11, weekday: THURSDAY, n: 4 } }, { regions: ['US', 'CA'], priority: 5 }),
  def('purim', 'Purim', { kind: 'table', table: 'purim' }, { tier: 2, beginsAtSundown: true, days: 1, mainDayOffset: 1, dayNames: ['Megillah reading tonight', 'Purim day!'], priority: 10 }),
  def('pirate-day', 'Talk Like a Pirate Day', fixed(9, 19), { tier: 3, tags: ['silly'], priority: -10 }),
  def('happiness-day', 'International Day of Happiness', fixed(3, 20), { tier: 3, tags: ['silly'], priority: -10 }),
];
const byId = new Map(METAS.map((m) => [m.id, m]));
const meta = (id: string): HolidayMeta => byId.get(id)!;
const CTX = ruleContextFor(METAS);

const day = (s: string): CivilDate => {
  const c = parseIso(s);
  if (!c) throw new Error(`bad fixture ${s}`);
  return c;
};
const iso = (n: number): string => formatIso(fromDayNumber(n));
const ids = (occs: readonly Occurrence[]): string[] => occs.map((o) => o.holidayId);
const find = (occs: readonly Occurrence[], id: string): Occurrence => {
  const o = occs.find((x) => x.holidayId === id);
  if (!o) throw new Error(`no occurrence of ${id} in [${ids(occs).join(', ')}]`);
  return o;
};
const ongoing = (s: Status): Extract<Status, { kind: 'ongoing' }> => {
  if (s.kind !== 'ongoing') throw new Error(`expected ongoing, got ${s.kind}`);
  return s;
};
const found = (r: ReturnType<typeof nextOccurrence>): { occ: Occurrence; status: Status } => {
  if ('beyondCoverage' in r) throw new Error('expected an occurrence, got beyondCoverage');
  return r;
};

describe('expand', () => {
  it('builds spans from anchor, startOffset, eve and mainDayOffset', () => {
    const [xmas] = expand(meta('christmas'), 2024, 'US', CTX);
    expect([iso(xmas!.start), iso(xmas!.main), iso(xmas!.end), xmas!.year]).toEqual(['2024-12-24', '2024-12-25', '2024-12-25', 2024]);
    const [hk] = expand(meta('hanukkah'), 2024, 'US', CTX);
    expect([iso(hk!.start), iso(hk!.main), iso(hk!.end), hk!.beginsAtSundown]).toEqual(['2024-12-25', '2024-12-25', '2025-01-02', true]);
    const [hk27] = expand(meta('hanukkah'), 2027, 'US', CTX);
    expect([iso(hk27!.start), iso(hk27!.end), hk27!.year]).toEqual(['2027-12-24', '2028-01-01', 2027]);
    const [kw] = expand(meta('kwanzaa'), 2024, 'US', CTX);
    expect([iso(kw!.start), iso(kw!.end)]).toEqual(['2024-12-26', '2025-01-01']);
    const [dw] = expand(meta('diwali'), 2024, 'US', CTX);
    expect([iso(dw!.start), iso(dw!.main), iso(dw!.end), iso(dw!.alt!)]).toEqual(['2024-10-29', '2024-10-31', '2024-11-02', '2024-11-01']);
    const [lny] = expand(meta('lunar-new-year'), 2026, 'US', CTX);
    expect([iso(lny!.start), iso(lny!.end), lny!.note, lny!.approx]).toEqual(['2026-02-17', '2026-03-03', 'Year of the Horse', false]);
    const [eid] = expand(meta('eid-al-fitr'), 2026, 'US', CTX);
    expect([iso(eid!.start), iso(eid!.end), eid!.approx]).toEqual(['2026-03-20', '2026-03-22', true]);
  });

  it('observed is present only when the shift moved the day; the countdown target stays on main', () => {
    const [jul4] = expand(meta('independence-day-us'), 2026, 'US', CTX);
    expect(iso(jul4!.main)).toBe('2026-07-04');
    expect(iso(jul4!.observed!)).toBe('2026-07-03');
    const [jul4b] = expand(meta('independence-day-us'), 2025, 'US', CTX);
    expect('observed' in jul4b!).toBe(false);
    const [canada] = expand(meta('canada-day'), 2028, 'CA', CTX);
    expect(iso(canada!.observed!)).toBe('2028-07-03');
  });

  it('spans "until the next table row": Ramadan 2030 twice, and omitted past the last Eid row', () => {
    const r2030 = expand(meta('ramadan'), 2030, 'US', CTX);
    expect(r2030.map((o) => [iso(o.start), o.end - o.start + 1])).toEqual([['2030-01-05', 30], ['2030-12-26', 29]]);
    expect(expand(meta('ramadan'), 2034, 'US', CTX)).toHaveLength(1);
    // Ramadan 2035 ends with Eid al-Fitr 2035-12-01, which the table holds, so it is complete (30 days).
    expect(expand(meta('ramadan'), 2035, 'US', CTX).map((o) => [iso(o.start), o.end - o.start + 1])).toEqual([['2035-11-01', 30]]);
    // A span whose closing row lies past the table is omitted, never guessed: Eid al-Fitr 2035-12-01 has no later Eid al-Adha row.
    const runsOut = def('runs-out', 'Runs Out', { kind: 'table', table: 'eid-al-fitr' }, { days: { untilTable: 'eid-al-adha' } });
    expect(expand(runsOut, 2034, 'US', CTX).map((o) => o.end - o.start + 1)).toEqual([68]);
    expect(expand(runsOut, 2035, 'US', CTX)).toEqual([]);
    expect(expand(meta('leap-day'), 2025, 'US', CTX)).toEqual([]);
    expect(expand(meta('lunar-new-year'), 2036, 'US', CTX)).toEqual([]);
  });
});

describe('statusOf and labels', () => {
  it('upcoming / ongoing / passed with sundown and main offsets', () => {
    const [hk] = expand(meta('hanukkah'), 2024, 'US', CTX);
    expect(statusOf(hk!, day('2024-12-24'))).toEqual({ kind: 'upcoming', sleeps: 1 });
    expect(statusOf(hk!, day('2024-12-25'))).toEqual({ kind: 'ongoing', day: 1, of: 9, sleepsToMain: 0, tonight: true });
    expect(statusOf(hk!, day('2024-12-28'))).toEqual({ kind: 'ongoing', day: 4, of: 9, sleepsToMain: -3, tonight: false });
    expect(statusOf(hk!, day('2025-01-02'))).toEqual({ kind: 'ongoing', day: 9, of: 9, sleepsToMain: -8, tonight: false });
    expect(statusOf(hk!, day('2025-01-03'))).toEqual({ kind: 'passed', daysAgo: 1 });
    expect(labelFor(statusOf(hk!, day('2024-12-25')), meta('hanukkah'))).toBe('First candle tonight!');
    expect(labelFor(statusOf(hk!, day('2024-12-28')), meta('hanukkah'))).toBe('Night 4');
    expect(candlesLit(hk!, day('2024-12-28'), 8)).toBe(4);
    expect(candlesLit(hk!, day('2025-01-02'), 8)).toBe(8);
    expect(candlesLit(hk!, day('2024-12-20'), 8)).toBe(0);
    expect(labelFor(statusOf(hk!, day('2025-01-02')), meta('hanukkah'))).toBe('Last day of Hanukkah');
  });

  it('Purim: the eve is "tonight" with one sleep left to the main day', () => {
    const [purim] = expand(meta('purim'), 2026, 'US', CTX);
    expect([iso(purim!.start), iso(purim!.main), iso(purim!.end)]).toEqual(['2026-03-02', '2026-03-03', '2026-03-03']);
    const eve = ongoing(statusOf(purim!, day('2026-03-02')));
    expect(eve).toEqual({ kind: 'ongoing', day: 1, of: 2, sleepsToMain: 1, tonight: true });
    expect(labelFor(eve, meta('purim'))).toBe('Megillah reading tonight');
    expect(labelFor(statusOf(purim!, day('2026-03-03')), meta('purim'))).toBe('Purim day!');
    expect(ids(nextUp(METAS, [], day('2026-03-02'), 'US', false).map((u) => u.occ))[0]).toBe('purim');
  });
});

describe('stacked and happening-now days', () => {
  it('2024-12-25: Christmas main day + Hanukkah begins tonight', () => {
    const stacked = stackedToday(METAS, [], day('2024-12-25'), 'US');
    expect(ids(stacked)).toEqual(['christmas', 'hanukkah']);
    expect(ongoing(statusOf(find(stacked, 'hanukkah'), day('2024-12-25'))).tonight).toBe(true);
    expect(ongoing(statusOf(find(stacked, 'christmas'), day('2024-12-25'))).sleepsToMain).toBe(0);
  });

  it('2024-12-26: Hanukkah night 2, Kwanzaa day 1 (Umoja), Boxing Day; all regions', () => {
    const now = happeningNow(METAS, [], day('2024-12-26'), 'US');
    expect(ids(now).sort()).toEqual(['boxing-day', 'hanukkah', 'kwanzaa']);
    expect(ids(now)[0]).toBe('hanukkah'); // priority 10 first, then names
    expect(ids(now).slice(1)).toEqual(['boxing-day', 'kwanzaa']);
    expect(labelFor(statusOf(find(now, 'hanukkah'), day('2024-12-26')), meta('hanukkah'))).toBe('Night 2');
    expect(labelFor(statusOf(find(now, 'kwanzaa'), day('2024-12-26')), meta('kwanzaa'))).toBe('Umoja (Unity)');
    expect(ids(happeningNow(METAS, [], day('2024-12-26'), 'OTHER')).sort()).toEqual(['boxing-day', 'hanukkah', 'kwanzaa']);
  });

  it('2024-12-28: Hanukkah day 4; 2024-12-30: Kwanzaa day 5 (Nia) ending 2025-01-01; 2025-01-02: last day of Hanukkah', () => {
    const d28 = ongoing(statusOf(find(happeningNow(METAS, [], day('2024-12-28'), 'US'), 'hanukkah'), day('2024-12-28')));
    expect([d28.day, d28.of]).toEqual([4, 9]);
    const kw = find(happeningNow(METAS, [], day('2024-12-30'), 'US'), 'kwanzaa');
    expect(iso(kw.end)).toBe('2025-01-01');
    expect(labelFor(statusOf(kw, day('2024-12-30')), meta('kwanzaa'))).toBe('Nia');
    // Early January: expansion of the previous year keeps Kwanzaa and Hanukkah visible.
    const jan1 = happeningNow(METAS, [], day('2025-01-01'), 'US');
    expect(labelFor(statusOf(find(jan1, 'kwanzaa'), day('2025-01-01')), meta('kwanzaa'))).toBe('Imani');
    const jan2 = happeningNow(METAS, [], day('2025-01-02'), 'US');
    expect(ids(jan2)).toEqual(['hanukkah']);
    expect(labelFor(statusOf(jan2[0]!, day('2025-01-02')), meta('hanukkah'))).toBe('Last day of Hanukkah');
  });

  it('2025-04-20: Easter and Orthodox Easter stacked; 2026-03-03: Lunar New Year day 15 + Lantern Festival', () => {
    expect(ids(stackedToday(METAS, [], day('2025-04-20'), 'US'))).toEqual(['easter', 'orthodox-easter']);
    const now = happeningNow(METAS, [], day('2026-03-03'), 'US');
    // Purim 2026 (main day) and Ramadan 2026 (18 Feb – 19 Mar) are also on; priority 10 first, by name, then the rest.
    expect(ids(now)).toEqual(['lunar-new-year', 'purim', 'ramadan', 'lantern-festival']);
    expect(ongoing(statusOf(find(now, 'lunar-new-year'), day('2026-03-03')))).toMatchObject({ day: 15, of: 15 });
    expect(ongoing(statusOf(find(now, 'lantern-festival'), day('2026-03-03')))).toMatchObject({ day: 1, of: 1, sleepsToMain: 0 });
  });

  it('2025-10-18: Diwali ongoing day 1 (Dhanteras) with 2 sleeps to the main day, and it is the hero', () => {
    const hero = nextUp(METAS, [], day('2025-10-18'), 'US', false)[0]!;
    expect(hero.occ.holidayId).toBe('diwali');
    expect(hero.status).toEqual({ kind: 'ongoing', day: 1, of: 5, sleepsToMain: 2, tonight: false });
    expect(labelFor(hero.status, meta('diwali'))).toBe('Dhanteras');
    expect(iso(hero.occ.alt!)).toBe('2025-10-21');
  });

  it('2030-12-30: the second Ramadan of 2030, day 5 of 29', () => {
    const r = find(happeningNow(METAS, [], day('2030-12-30'), 'US'), 'ramadan');
    expect(iso(r.start)).toBe('2030-12-26');
    expect(ongoing(statusOf(r, day('2030-12-30')))).toMatchObject({ day: 5, of: 29 });
    expect(occurrencesForYear(METAS, 'ramadan', 2030, 'US').map((o) => iso(o.start))).toEqual(['2030-01-05', '2030-12-26']);
  });
});

describe('nextOccurrence, nextThree, previousOccurrence', () => {
  it('2033-01-01: Eid al-Fitr in 1 sleep, and the next three include the second 2033 Eid', () => {
    const r = found(nextOccurrence(METAS, 'eid-al-fitr', day('2033-01-01'), 'US'));
    expect(iso(r.occ.main)).toBe('2033-01-02');
    expect(r.status).toEqual({ kind: 'upcoming', sleeps: 1 });
    expect(nextThree(METAS, 'eid-al-fitr', day('2033-01-01'), 'US').map((o) => iso(o.main))).toEqual(['2033-12-23', '2034-12-12', '2035-12-01']);
    expect(occurrencesForYear(METAS, 'eid-al-fitr', 2033, 'US').map((o) => iso(o.main))).toEqual(['2033-01-02', '2033-12-23']);
  });

  it('2026-07-04: Independence Day is today, observed on the 3rd', () => {
    const r = found(nextOccurrence(METAS, 'independence-day-us', day('2026-07-04'), 'US'));
    expect([iso(r.occ.main), iso(r.occ.observed!)]).toEqual(['2026-07-04', '2026-07-03']);
    expect(ongoing(r.status).sleepsToMain).toBe(0);
    expect(labelFor(r.status, meta('independence-day-us'))).toBe("IT'S TODAY!");
  });

  it('2025-02-28: Leap Day next in 2028, 1096 sleeps, and three more every four years', () => {
    const r = found(nextOccurrence(METAS, 'leap-day', day('2025-02-28'), 'US'));
    expect(iso(r.occ.main)).toBe('2028-02-29');
    expect(r.status).toEqual({ kind: 'upcoming', sleeps: 1096 });
    expect(nextThree(METAS, 'leap-day', day('2025-02-28'), 'US').map((o) => o.year)).toEqual([2032, 2036, 2040]);
    expect(ids(nextUp(METAS, [], day('2025-02-28'), 'US', false).map((u) => u.occ))).toContain('leap-day');
  });

  it('2035-12-30: Lunar New Year (and Ramadan 2035) are beyond coverage; nothing is approximated', () => {
    expect(nextOccurrence(METAS, 'lunar-new-year', day('2035-12-30'), 'US')).toEqual({ beyondCoverage: true });
    expect(nextOccurrence(METAS, 'lantern-festival', day('2035-12-30'), 'US')).toEqual({ beyondCoverage: true });
    expect(iso(found(nextOccurrence(METAS, 'ramadan', day('2035-10-01'), 'US')).occ.main)).toBe('2035-11-01');
    expect(nextOccurrence(METAS, 'ramadan', day('2035-12-15'), 'US')).toEqual({ beyondCoverage: true });
    expect(nextOccurrence(METAS, 'no-such-holiday', day('2026-01-01'), 'US')).toEqual({ beyondCoverage: true });
    expect(nextThree(METAS, 'lunar-new-year', day('2034-01-01'), 'US').map((o) => o.year)).toEqual([2035]);
    expect(found(nextOccurrence(METAS, 'halloween', day('2035-12-30'), 'US')).occ.year).toBe(2036); // computed rules never run out
  });

  it('passed this year → next year, with a "just celebrated" ribbon for a week', () => {
    const next = found(nextOccurrence(METAS, 'halloween', day('2026-11-01'), 'US'));
    expect(next.occ.year).toBe(2027);
    expect(next.status).toEqual({ kind: 'upcoming', sleeps: 364 });
    const prev = previousOccurrence(METAS, 'halloween', day('2026-11-01'), 'US')!;
    expect(prev.year).toBe(2026);
    expect(statusOf(prev, day('2026-11-01'))).toEqual({ kind: 'passed', daysAgo: 1 });
    expect(labelFor(statusOf(prev, day('2026-11-01')), meta('halloween'))).toBe('we just celebrated!');
    expect(statusOf(prev, day('2026-11-09'))).toEqual({ kind: 'passed', daysAgo: 9 });
    expect(previousOccurrence(METAS, 'halloween', day('2026-10-31'), 'US')!.year).toBe(2025);
  });

  it('DST does not change sleeps: 2026-03-07 → Pi Day = 7; 2026-10-25 → Halloween = 6', () => {
    expect(found(nextOccurrence(METAS, 'pi-day', day('2026-03-07'), 'US')).status).toEqual({ kind: 'upcoming', sleeps: 7 });
    expect(found(nextOccurrence(METAS, 'halloween', day('2026-10-25'), 'US')).status).toEqual({ kind: 'upcoming', sleeps: 6 });
  });
});

describe('nextUp (hero rotation)', () => {
  const heroIds = (today: string, region: 'US' | 'GB' | 'CA' | 'OTHER', everywhere = false): string[] =>
    ids(nextUp(METAS, [], day(today), region, everywhere).map((u) => u.occ));

  it('respects regions unless "everywhere" is on, and never promotes silly days', () => {
    expect(heroIds('2026-06-10', 'GB')).not.toContain('juneteenth');
    expect(heroIds('2026-06-10', 'US')).toContain('juneteenth');
    expect(heroIds('2026-06-10', 'GB', true)).toContain('juneteenth');
    expect(heroIds('2026-06-10', 'CA')[0]).toBe('canada-day');
    expect(heroIds('2026-06-10', 'US')).not.toContain('canada-day');
    expect(heroIds('2026-06-10', 'OTHER', true)).toContain('canada-day');
    expect(heroIds('2026-09-18', 'US')).not.toContain('pirate-day');
    expect(ids(happeningNow(METAS, [], day('2026-09-19'), 'US'))).toContain('pirate-day');
    expect(isOnForRegion(meta('juneteenth'), 'GB', false)).toBe(false);
    expect(isOnForRegion(meta('halloween'), 'GB', false)).toBe(true);
  });

  it('sorts by main day, then start, then priority, then name', () => {
    const may = nextUp(METAS, [], day('2026-05-01'), 'US', false);
    expect(ids(may.map((u) => u.occ)).slice(0, 2)).toEqual(['cinco-de-mayo', 'childrens-day-japan']);
    expect(may[0]!.status).toEqual({ kind: 'upcoming', sleeps: 4 });
    const dec = nextUp(METAS, [], day('2024-12-20'), 'US', false);
    expect(ids(dec.map((u) => u.occ)).slice(0, 3)).toEqual(['christmas', 'hanukkah', 'kwanzaa']);
    for (let i = 1; i < dec.length; i++) expect(dec[i]!.occ.main).toBeGreaterThanOrEqual(dec[i - 1]!.occ.main);
  });

  it('keeps an ongoing holiday as hero until its main day has passed, then moves on', () => {
    expect(heroIds('2024-12-25', 'US')[0]).toBe('christmas');
    expect(heroIds('2024-12-26', 'US')[0]).toBe('kwanzaa'); // Christmas and Hanukkah's main days are behind us
    expect(heroIds('2024-12-27', 'US')[0]).not.toBe('kwanzaa');
    const after = afterThat(nextUp(METAS, [], day('2024-12-20'), 'US', false));
    expect(after.map((u) => u.occ.holidayId)).toEqual(['hanukkah', 'kwanzaa', 'lunar-new-year']);
    expect(afterThat([])).toEqual([]);
  });

  it('Thanksgiving follows the region: Canada in October, US in November', () => {
    expect(iso(found(nextOccurrence(METAS, 'thanksgiving', day('2026-10-01'), 'CA')).occ.main)).toBe('2026-10-12');
    expect(iso(found(nextOccurrence(METAS, 'thanksgiving', day('2026-10-01'), 'US')).occ.main)).toBe('2026-11-26');
    expect(iso(found(nextOccurrence(METAS, 'grandparents-day', day('2026-09-01'), 'US')).occ.main)).toBe('2026-09-13');
  });
});

describe('allOccurrences', () => {
  it('is deduped, sorted by start and covers the neighbouring years', () => {
    const all = allOccurrences(METAS, [], day('2026-06-15'), 'US');
    const keys = new Set(all.map((o) => `${o.holidayId}:${o.start}`));
    expect(keys.size).toBe(all.length);
    for (let i = 1; i < all.length; i++) expect(all[i]!.start).toBeGreaterThanOrEqual(all[i - 1]!.start);
    expect(all.filter((o) => o.holidayId === 'halloween').map((o) => o.year)).toEqual([2025, 2026, 2027]);
    expect(all.filter((o) => o.holidayId === 'leap-day').map((o) => o.year)).toEqual([2028]);
    expect(all.filter((o) => o.holidayId === 'eid-al-fitr').map((o) => iso(o.main))).toEqual(['2025-03-30', '2026-03-20', '2027-03-09']);
  });
});

describe('custom holidays', () => {
  const birthday: CustomHoliday = { id: 'custom-abc', name: "Maya's Birthday", emoji: '🎈', month: 7, day: 9, year: 2019 };
  const noYear: CustomHoliday = { id: 'custom-def', name: 'Gotcha Day', emoji: '🐶', month: 2, day: 1 };

  it('customToMeta sets the birthday theme, balloons with candles = age, tier 2, family, priority 5', () => {
    const m = customToMeta(birthday, 2026);
    expect(m).toMatchObject({ id: 'custom-abc', tier: 2, tags: ['family'], priority: 5, theme: 'birthday', effect: 'balloons', effectParams: { candles: 7 }, rule: { kind: 'fixed', month: 7, day: 9 } });
    expect(m.sticker).toMatchObject({ emoji: '🎂', label: 'Birthday Star' });
    expect('effectParams' in customToMeta(birthday)).toBe(false);
    expect('effectParams' in customToMeta(noYear, 2026)).toBe(false);
    expect(withCustoms(METAS, [birthday])).toHaveLength(METAS.length + 1);
  });

  it('joins the hero rotation and happening-now like any tier-2 holiday', () => {
    const up = nextUp(METAS, [birthday], day('2026-07-05'), 'US', false);
    expect(up[0]!.occ.holidayId).toBe('custom-abc');
    expect(up[0]!.status).toEqual({ kind: 'upcoming', sleeps: 4 });
    expect(ids(happeningNow(METAS, [birthday], day('2026-07-09'), 'US'))).toContain('custom-abc');
    expect(ids(stackedToday(METAS, [birthday], day('2026-07-09'), 'US'))).toEqual(['custom-abc']);
    const r = found(nextOccurrence(withCustoms(METAS, [birthday]), 'custom-abc', day('2026-07-10'), 'US'));
    expect(r.occ.year).toBe(2027);
  });
});
