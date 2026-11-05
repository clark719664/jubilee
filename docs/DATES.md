# Dates: how Jubilee knows when a holiday is

This is the audit log for the date engine in `src/dates/`. It records where every lookup table
came from, what convention each row follows, when it was copied, how the rows were verified, and
how to extend the tables past 2035. The product rule behind all of it: **dates are right for
2024–2035, and nothing is approximated beyond that**. When a table runs out, the UI says
"My calendar for this holiday ends in 2035" rather than guessing.

## 1. Two kinds of holidays

| Kind | Examples | How the date is found | Tested by |
|---|---|---|---|
| Computed rules | Christmas, Thanksgiving, Easter, Pancake Day, Memorial Day, Lantern Festival | `resolveRule` in `src/dates/rules.ts`: `fixed`, `nthWeekday`, `lastWeekday`, `easter` (Gregorian or Julian), `relative`, `byRegion`, `custom` | `test/nth.test.ts`, `test/easter.test.ts`, `test/rules.test.ts` |
| Lookup tables | Lunar New Year, Diwali, Hanukkah, Ramadan, Nowruz … | `src/dates/tables/<id>.ts`, one row per occurrence, copied from a named source | `test/tables.test.ts`, `test/hebrew-oracle.test.ts`, `test/islamic-oracle.test.ts` |

Rules are computed for any year. Tables cover **2024–2035** inclusive (`coverage: { from: 2024, to: 2035 }`).

All arithmetic runs on integer day numbers (`src/dates/civil.ts`, Howard Hinnant's
`days_from_civil` / `civil_from_days`), never on `Date` milliseconds: a DST day is 23 or 25 hours
long, so `ms / 86_400_000` is wrong twice a year. `Date` appears only in `todayLocal(now)`,
`localMidnight(civil)`, `msUntilLocalMidnight(now)` and `Intl.DateTimeFormat`.

## 2. Why tables

- **Chinese lunisolar** months begin at astronomical new moons reckoned in UTC+8, and leap months are placed by solar terms. Computing this needs an ephemeris.
- **Hindu** festivals depend on the tithi at sunrise or at pradosh (dusk) and on adhik (leap) months, with regional variation. Two widely used days exist in some years, so rows carry an `alt`.
- **Hebrew** dates are arithmetic, but the postponement rules (dehiyyot) are easy to get subtly wrong. The app ships rows; the arithmetic lives in a *test-only* oracle that must reproduce every row.
- **Islamic** dates depend on sighting the new crescent and differ by country by about a day. Rows follow the Umm al-Qura calendar and are marked `confidence: 'sighting'`, which the UI renders as "expected".
- **Nowruz** depends on the exact instant of the March equinox in Tehran (UTC+3:30; Iran dropped DST in 2022).

## 3. The tables

All thirteen tables were copied on **2026-10-22** (`retrieved`). Rows are ordered lists, never
keyed by year, because a Gregorian year can hold 0, 1 or 2 of them (two Ramadan starts in 2030,
two Eid al-Fitr days in 2033).

| Table id | Calendar | Convention (what the row's date is) | Primary source | Confidence |
|---|---|---|---|---|
| `lunar-new-year` | chinese | 1st day of the 1st lunar month; `note` = "Year of the <animal>" | Hong Kong Observatory, Gregorian-Lunar Calendar Conversion Table | exact |
| `mid-autumn` | chinese | 15th day of the 8th lunar month (Chuseok reuses it; identical to KASI through at least 2030) | Hong Kong Observatory | exact |
| `dragon-boat` | chinese | 5th day of the 5th lunar month | Hong Kong Observatory | exact |
| `diwali` | hindu | Lakshmi Puja day, New Delhi; `alt` = other widely used day (2024, 2025, 2035) | Drik Panchang | exact |
| `holi` | hindu | Rangwali Holi / Dhulandi, New Delhi; `alt` in 2026 | Drik Panchang | exact |
| `rosh-hashanah` | hebrew | **first full day** (1 Tishrei); the eve is derived by `beginsAtSundown` | Hebcal | exact |
| `hanukkah` | hebrew | **first full day** (25 Kislev); the first candle is lit the evening before | Hebcal | exact |
| `passover` | hebrew | **first full day** (15 Nisan); the first seder is the evening before | Hebcal | exact |
| `purim` | hebrew | Purim day (14 Adar, or 14 Adar II in a leap year) | Hebcal | exact |
| `ramadan-start` | islamic | first day of fasting (1 Ramadan); 13 rows, two in 2030 | Umm al-Qura calendar | sighting |
| `eid-al-fitr` | islamic | 1 Shawwal; 13 rows, two in 2033 | Umm al-Qura calendar | sighting |
| `eid-al-adha` | islamic | 10 Dhu al-Hijjah; 12 rows (AH 1445–1456) | Umm al-Qura calendar | sighting |
| `nowruz` | astronomical | March equinox instant converted to UTC+3:30: before 12:00 → that day, else the next day | USNO / timeanddate equinox instants | exact |

The sundown convention matters: Hebrew tables store the first *full* day. The holiday metadata
sets `beginsAtSundown: true`, and the engine prepends the eve to the span, so Hanukkah 2024 runs
from the eve of 25 December (first candle) to 2 January 2025 (day 9 of the span, "Last day of
Hanukkah"), with `main` on the eve.

## 4. How the rows were verified

Every row passes all of these in `test/tables.test.ts` on every run:

1. **Shape** — valid `retrieved`, non-empty `source` and `convention`, coverage exactly 2024–2035, strictly ascending rows, every `alt` within two days of its row.
2. **Every covered year has a row**; 2030 has two `ramadan-start` rows and 2033 two `eid-al-fitr` rows (asserted explicitly).
3. **Legal gaps between consecutive rows** per calendar: Islamic {354, 355}; Chinese and Hebrew {353, 354, 355, 383, 384, 385}; Hindu {353…356} ∪ {383…386}; astronomical {365, 366}. A typo in a month or day fails here.
4. **Month/day windows**: Lunar New Year 21 Jan–20 Feb, Mid-Autumn 7 Sep–8 Oct, Dragon Boat 27 May–26 Jun, Diwali 17 Oct–15 Nov, Holi 27 Feb–30 Mar, Hanukkah 27 Nov–27 Dec, Passover 26 Mar–25 Apr, Rosh Hashanah 5 Sep–5 Oct, Purim 24 Feb–26 Mar, Nowruz 20–21 Mar.
5. **Cross-table invariants**: Passover → Rosh Hashanah = 163 days; Rosh Hashanah → Hanukkah ∈ {83, 84}; Purim → Passover = 30; each Ramadan start → next Eid al-Fitr ∈ {29, 30}; each Eid al-Fitr → next Eid al-Adha ∈ {67, 68, 69}; Lunar New Year → Mid-Autumn ∈ {219…222} ∪ {249…252} and → Dragon Boat ∈ {120…124} ∪ {150…154}; Holi → Diwali ∈ {219…222} ∪ {248…252}. The zodiac `note` on every Lunar New Year row matches the 12-year cycle (2020 = Rat).
6. **Spot checks from a second source** (three rows per table, 2024–2026, hand-copied into the test file, not from the primary source and not from the spec).
7. **Coverage alarm**: `coverageOk(id, currentYear)` must hold, i.e. `coverage.to >= currentYear + 1`. This is the only wall-clock read in the suite and it is deliberate: it starts failing on 1 January 2035, a year before the tables run out.

Two oracles add independent arithmetic checks:

- `test/oracles/hebrew.ts` implements the Hebrew calendar after Dershowitz & Reingold (molad, elapsed days with the folded dehiyyot, year-length corrections, variable Cheshvan/Kislev, leap years via `(7y + 1) mod 19 < 7`). `test/hebrew-oracle.test.ts` requires every Rosh Hashanah, Hanukkah, Passover and Purim row to **equal** 1 Tishrei, 25 Kislev, 15 Nisan and 14 Adar (II).
- `test/oracles/islamic.ts` implements the tabular Islamic calendar (30-year cycle, 11 leap years). `test/islamic-oracle.test.ts` requires every Ramadan, Eid al-Fitr and Eid al-Adha row to be **within two days** of 1 Ramadan, 1 Shawwal and 10 Dhu al-Hijjah for AH 1445–1457 (sighting calendars legitimately differ from the arithmetic one by a day or two).

Computed rules are pinned by fixtures: Gregorian and Orthodox Easter 2024–2035 (plus 1943, 1954,
2000, 2049, 2076), Thanksgiving, Mother's/Father's Day, Memorial Day, MLK Day, Labor Day and the
silly nth-weekday days 2024–2035, French Mother's Day including the Pentecost shift (2034-06-04),
observed-day shifts, Lantern Festival = Lunar New Year + 14 for all twelve years.

### Independent astronomical cross-check (October 2026)

Before the tables were committed, every row was reconciled against four independently produced
recall tables and a dependency-free calculator, `docs/tools/calendars.mjs` (Meeus lunar phases and
solar longitude → Chinese months with leap-month placement; Dershowitz–Reingold Hebrew calendar;
Gregorian and Julian computus; Meeus equinox → the Tehran-noon Nowruz rule; the tabular Islamic
calendar as a ±1-day cross-check). Its 58 self-tests pass, and all 144 exact-calendar entries
(Chinese, Hebrew, Easter, Nowruz) agree across every source. The Umm al-Qura rows differ from the
tabular calendar by +1 day in 14 cases, as expected for a sighting-based calendar; the margins are
narrowest for Eid al-Fitr 2027–2029 and Eid al-Adha 2027 (moonset 5–11 minutes after sunset in
Mecca), so those years are the most likely to be announced a day later.

Known regional differences recorded as `alt` rows: Holi 2027 (23 March here, with 22 March as the
alternative; the tithi configuration matches 2023, when Holika Dahan moved to the second evening —
low confidence), Diwali 2024/2025/2035 (the Lakshmi Puja day vs the following day), Lunar New Year
2027 and 2028 (Korea's Seollal falls a day later because the new moon is just before midnight in
Beijing), and Holi 2026. Chuseok shares the Mid-Autumn table in every year through 2035.

## 5. Spans, status and countdowns (the engine's conventions)

- `expand(meta, year, region, ctx)` turns each resolved date into an `Occurrence`: `start = anchor + startOffset − eve`, `end = start + eve + days − 1`, `main = start + mainDayOffset`, `year = year of main` (the sticker key). `observed` is present only when an `observedShift` actually moved the day; the countdown always targets `main`.
- A span declared as `days: { untilTable }` (Ramadan → next Eid al-Fitr, exclusive) is **omitted** when the closing row lies past the table, rather than guessed. With the current rows every Ramadan through 2035 is closed by an Eid al-Fitr row, so nothing is omitted today; the safeguard exists for uneven extensions.
- `statusOf(occ, today)`: `upcoming { sleeps = main − today }`, `ongoing { day, of, sleepsToMain, tonight }` (`sleepsToMain` is 0 on the main day and negative afterwards; `tonight` = sundown holiday on its eve), `passed { daysAgo }` counted from the last day of the span.
- `nextOccurrence` returns the first occurrence whose span has not ended, scanning up to four years ahead (Leap Day). Nothing found means a table ran out → `{ beyondCoverage: true }`.
- `nextUp` (hero rotation) takes tier 1–2 holidays and custom days that are on for the region (or everything when "everywhere" is on) with `main >= today`, sorted by `(main, start, −priority, name)`. Silly days (tier 3) only ever reach `happeningNow`.
- `nextThree` lists the three occurrences **after** the current one, for the Dates section; fewer come back near the end of coverage.
- Sleeps are `main − today` in day numbers, so DST never changes them (7 sleeps from 7 March 2026 to Pi Day). The New Year's Eve clock uses `localMidnight(next day) − now`, so a 23- or 25-hour day shows its real wall-clock remainder.
- `MidnightTicker` re-arms at local midnight (+500 ms), re-checks every 60 s and on `visibilitychange` / `pageshow`, because mobile browsers suspend timers.

`npm test` runs the whole suite twice, in `America/New_York` and in `Pacific/Kiritimati` (UTC+14,
no DST), via `test/setup.ts`, which pins `process.env.TZ` before any `Date` is created.

## 6. Extending the tables past 2035

Run `node docs/tools/calendars.mjs 2036 2047` for the exact calendars and to get phase-anchored
candidates for the Hindu and Islamic rows, then confirm the sighting-based rows against the
published Umm al-Qura calendar and a panchang before adding them.

Do this during 2034 at the latest; the coverage alarm (§4.7) will fail the test suite on
1 January 2035 to remind you.

1. For each table in `src/dates/tables/`, copy the next year's rows from the **primary source** named in its `source` field, in that table's convention (first full day for Hebrew holidays; Lakshmi Puja day for Diwali; first day of fasting for Ramadan; equinox-in-Tehran rule for Nowruz). Append them in ascending order. Remember that Islamic tables need a row per Islamic year, so a Gregorian year may need two rows (or, for Eid al-Adha, the AH year whose Dhu al-Hijjah falls in that Gregorian year).
2. Add the Lunar New Year `note` ("Year of the Dragon" for 2036) and any Diwali/Holi `alt` days the source lists.
3. Update `retrieved` to the copy date and `coverage.to` to the new last year, on every table (all thirteen must agree, because the engine's `?today=` range and the UI copy assume one end year).
4. In `test/tables.test.ts`, extend `YEARS` and add the new year to the cross-table checks (they iterate over `YEARS`, so this is automatic) and add spot-check rows from a **second** source.
5. Run `npm test`. The gap, window, cross-table and oracle checks will catch a mistyped row; the Hebrew oracle must match exactly, the Islamic oracle within two days.
6. Update `TODAY_FLAG_YEARS` in `src/app/clock.ts`, the "supported years" copy on the Grown-ups page, and the year switcher clamp in the Year view.
7. Record the extension in this file.

If a source changes a convention (for example a different reference city for Diwali), note it
here and keep the table's `convention` string in step; the content lane's `parentNote` strings
describe the convention to parents in plain words.
