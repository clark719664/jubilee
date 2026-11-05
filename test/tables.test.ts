import { describe, expect, it } from 'vitest';
import { parseIso, toDayNumber, type IsoDate } from '../src/dates/civil';
import { TABLES, TABLE_IDS, coverageOk, dayOf, nextRowAfter, rowAfter, rowsInYear } from '../src/dates/tables/index';
import type { CalendarKind, TableId } from '../src/dates/tables/types';

const YEARS = Array.from({ length: 12 }, (_, i) => 2024 + i);

/** Days between consecutive rows that the calendar's arithmetic allows. */
const GAPS: Record<CalendarKind, readonly number[]> = {
  islamic: [354, 355],
  chinese: [353, 354, 355, 383, 384, 385],
  hebrew: [353, 354, 355, 383, 384, 385],
  hindu: [353, 354, 355, 356, 383, 384, 385, 386],
  astronomical: [365, 366],
};

/** Month/day windows (inclusive) the festival can fall in; Islamic dates cycle through the whole year. */
const WINDOWS: Partial<Record<TableId, readonly [from: number, to: number]>> = {
  'lunar-new-year': [121, 220],
  'mid-autumn': [907, 1008],
  'dragon-boat': [527, 626],
  diwali: [1017, 1115],
  holi: [227, 330],
  hanukkah: [1127, 1227],
  passover: [326, 425],
  'rosh-hashanah': [905, 1005],
  purim: [224, 326],
  nowruz: [320, 321],
};

/**
 * Spot checks hand-copied from a SECOND source (not from the spec and not from the primary
 * table source): timeanddate holiday pages, Hebcal, Wikipedia tables, Islamic Finder, the
 * USNO equinox table. Three rows per table: 2024, 2025, 2026.
 */
const SPOT: Record<TableId, readonly [IsoDate, IsoDate, IsoDate]> = {
  'lunar-new-year': ['2024-02-10', '2025-01-29', '2026-02-17'],
  'mid-autumn': ['2024-09-17', '2025-10-06', '2026-09-25'],
  'dragon-boat': ['2024-06-10', '2025-05-31', '2026-06-19'],
  diwali: ['2024-10-31', '2025-10-20', '2026-11-08'],
  holi: ['2024-03-25', '2025-03-14', '2026-03-04'],
  'rosh-hashanah': ['2024-10-03', '2025-09-23', '2026-09-12'],
  hanukkah: ['2024-12-26', '2025-12-15', '2026-12-05'],
  passover: ['2024-04-23', '2025-04-13', '2026-04-02'],
  purim: ['2024-03-24', '2025-03-14', '2026-03-03'],
  'ramadan-start': ['2024-03-11', '2025-03-01', '2026-02-18'],
  'eid-al-fitr': ['2024-04-10', '2025-03-30', '2026-03-20'],
  'eid-al-adha': ['2024-06-16', '2025-06-06', '2026-05-27'],
  nowruz: ['2024-03-20', '2025-03-21', '2026-03-21'],
};

const ZODIAC = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
const zodiacFor = (year: number): string => ZODIAC[(((year - 2020) % 12) + 12) % 12]!;

const md = (iso: string): number => Number(iso.slice(5, 7)) * 100 + Number(iso.slice(8, 10));
const yearOf = (iso: string): number => Number(iso.slice(0, 4));
const onlyRow = (id: TableId, year: number): number => {
  const rows = rowsInYear(id, year);
  expect(rows, `${id} ${year}`).toHaveLength(1);
  return dayOf(rows[0]!.date);
};

describe('every table', () => {
  it('has the shape the spec demands', () => {
    expect(TABLE_IDS).toHaveLength(13);
    for (const id of TABLE_IDS) {
      const t = TABLES[id];
      expect(t.id).toBe(id);
      expect(parseIso(t.retrieved)).not.toBeNull();
      expect(t.source.length).toBeGreaterThan(10);
      expect(t.convention.length).toBeGreaterThan(10);
      expect(t.coverage).toEqual({ from: 2024, to: 2035 });
      expect(['exact', 'sighting']).toContain(t.confidence);
      for (const s of [t.source, t.convention]) expect(s).not.toMatch(/http|www\.|\.com/);
    }
  });

  it('has valid, strictly ascending rows inside coverage, with valid alt days within 2 days', () => {
    for (const id of TABLE_IDS) {
      let prev = -Infinity;
      for (const row of TABLES[id].rows) {
        const c = parseIso(row.date);
        expect(c, `${id} ${row.date}`).not.toBeNull();
        const n = toDayNumber(c!);
        expect(n, `${id} ${row.date} ascending`).toBeGreaterThan(prev);
        prev = n;
        expect(c!.y).toBeGreaterThanOrEqual(TABLES[id].coverage.from);
        expect(c!.y).toBeLessThanOrEqual(TABLES[id].coverage.to);
        if (row.alt !== undefined) {
          const a = parseIso(row.alt);
          expect(a, `${id} alt ${row.alt}`).not.toBeNull();
          expect(Math.abs(toDayNumber(a!) - n)).toBeLessThanOrEqual(2);
          expect(toDayNumber(a!)).not.toBe(n);
        }
        if (row.note !== undefined) expect(row.note).not.toMatch(/http|www\.|\.com/);
      }
    }
  });

  it('has at least one row in every covered year; Ramadan 2030 and Eid al-Fitr 2033 have two', () => {
    for (const id of TABLE_IDS) {
      for (const y of YEARS) expect(rowsInYear(id, y).length, `${id} ${y}`).toBeGreaterThanOrEqual(1);
    }
    expect(rowsInYear('ramadan-start', 2030).map((r) => r.date)).toEqual(['2030-01-05', '2030-12-26']);
    expect(rowsInYear('eid-al-fitr', 2033).map((r) => r.date)).toEqual(['2033-01-02', '2033-12-23']);
    expect(TABLES['ramadan-start'].rows).toHaveLength(13);
    expect(TABLES['eid-al-fitr'].rows).toHaveLength(13);
    expect(TABLES['eid-al-adha'].rows).toHaveLength(12);
    for (const id of TABLE_IDS) {
      if (TABLES[id].calendar !== 'islamic') expect(TABLES[id].rows, id).toHaveLength(12);
    }
  });

  it('steps between rows by the gaps its calendar allows', () => {
    for (const id of TABLE_IDS) {
      const rows = TABLES[id].rows;
      for (let i = 1; i < rows.length; i++) {
        const gap = dayOf(rows[i]!.date) - dayOf(rows[i - 1]!.date);
        expect(GAPS[TABLES[id].calendar], `${id}: ${rows[i - 1]!.date} → ${rows[i]!.date} = ${gap}`).toContain(gap);
      }
    }
  });

  it('stays inside its month/day window', () => {
    for (const id of TABLE_IDS) {
      const w = WINDOWS[id];
      if (!w) continue;
      for (const row of TABLES[id].rows) {
        expect(md(row.date), `${id} ${row.date}`).toBeGreaterThanOrEqual(w[0]);
        expect(md(row.date), `${id} ${row.date}`).toBeLessThanOrEqual(w[1]);
      }
    }
  });

  it('matches the hand-copied spot checks for 2024, 2025 and 2026', () => {
    for (const id of TABLE_IDS) {
      const [a, b, c] = SPOT[id];
      expect(rowsInYear(id, 2024).map((r) => r.date), id).toContain(a);
      expect(rowsInYear(id, 2025).map((r) => r.date), id).toContain(b);
      expect(rowsInYear(id, 2026).map((r) => r.date), id).toContain(c);
    }
  });

  it('labels sighting-based tables and only those', () => {
    for (const id of TABLE_IDS) {
      expect(TABLES[id].confidence, id).toBe(TABLES[id].calendar === 'islamic' ? 'sighting' : 'exact');
    }
  });

  it('covers at least a year past the current year, so tables are extended early', () => {
    // The one deliberate wall-clock read in the suite: it is the alarm that tells maintainers to
    // extend the tables (see docs/DATES.md) before the UI would ever say "my calendar ends".
    const currentYear = new Date().getFullYear();
    for (const id of TABLE_IDS) expect(coverageOk(id, currentYear), `${id} coverage`).toBe(true);
    expect(coverageOk('nowruz', 2034)).toBe(true);
    expect(coverageOk('nowruz', 2035)).toBe(false);
  });
});

describe('cross-table invariants', () => {
  it('Hebrew: Passover → Rosh Hashanah = 163, Rosh Hashanah → Hanukkah ∈ {83, 84}, Purim → Passover = 30', () => {
    for (const y of YEARS) {
      expect(onlyRow('rosh-hashanah', y) - onlyRow('passover', y), `passover→rosh ${y}`).toBe(163);
      expect([83, 84], `rosh→hanukkah ${y}`).toContain(onlyRow('hanukkah', y) - onlyRow('rosh-hashanah', y));
      expect(onlyRow('passover', y) - onlyRow('purim', y), `purim→passover ${y}`).toBe(30);
    }
  });

  it('Islamic: Ramadan lasts 29 or 30 days; Eid al-Fitr → Eid al-Adha ∈ {67, 68, 69}', () => {
    for (const row of TABLES['ramadan-start'].rows) {
      const start = dayOf(row.date);
      expect([29, 30], `ramadan ${row.date}`).toContain(nextRowAfter('eid-al-fitr', start) - start);
    }
    for (const row of TABLES['eid-al-fitr'].rows) {
      const fitr = dayOf(row.date);
      const adha = rowAfter('eid-al-adha', fitr);
      if (!adha) continue; // Dhu al-Hijjah 1457 is beyond coverage
      expect([67, 68, 69], `fitr ${row.date} → adha ${adha.date}`).toContain(dayOf(adha.date) - fitr);
    }
  });

  it('Chinese: Mid-Autumn and Dragon Boat sit a fixed number of lunar months after New Year', () => {
    for (const y of YEARS) {
      const lny = onlyRow('lunar-new-year', y);
      const midAutumn = onlyRow('mid-autumn', y) - lny;
      const dragonBoat = onlyRow('dragon-boat', y) - lny;
      expect((midAutumn >= 219 && midAutumn <= 222) || (midAutumn >= 249 && midAutumn <= 252), `mid-autumn ${y} = ${midAutumn}`).toBe(true);
      expect((dragonBoat >= 120 && dragonBoat <= 124) || (dragonBoat >= 150 && dragonBoat <= 154), `dragon-boat ${y} = ${dragonBoat}`).toBe(true);
    }
  });

  it('Hindu: Holi → Diwali ∈ {219..222} ∪ {248..252}', () => {
    for (const y of YEARS) {
      const gap = onlyRow('diwali', y) - onlyRow('holi', y);
      expect((gap >= 219 && gap <= 222) || (gap >= 248 && gap <= 252), `holi→diwali ${y} = ${gap}`).toBe(true);
    }
  });

  it('Lunar New Year notes name the zodiac animal of the year', () => {
    for (const row of TABLES['lunar-new-year'].rows) {
      expect(row.note).toMatch(new RegExp(`^Year of the ${zodiacFor(yearOf(row.date))}`));
    }
    expect(zodiacFor(2024)).toBe('Dragon');
    expect(zodiacFor(2035)).toBe('Rabbit');
  });
});

describe('index helpers', () => {
  it('rowsInYear, rowAfter and nextRowAfter', () => {
    expect(rowsInYear('hanukkah', 2024).map((r) => r.date)).toEqual(['2024-12-26']);
    expect(rowsInYear('hanukkah', 2036)).toEqual([]);
    const ramadan2030b = dayOf('2030-12-26');
    expect(rowAfter('eid-al-fitr', ramadan2030b)?.date).toBe('2031-01-24');
    expect(nextRowAfter('eid-al-fitr', ramadan2030b) - ramadan2030b).toBe(29);
    // Strictly after: a row on the given day is not "after" it.
    expect(rowAfter('eid-al-fitr', dayOf('2031-01-24'))?.date).toBe('2032-01-14');
    expect(rowAfter('eid-al-fitr', dayOf('2035-12-01'))).toBeUndefined();
    expect(() => nextRowAfter('eid-al-fitr', dayOf('2035-12-01'))).toThrow(/coverage/);
    expect(() => dayOf('2025-02-30' as IsoDate)).toThrow();
  });
});
