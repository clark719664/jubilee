#!/usr/bin/env node
// calendars.mjs — standalone, dependency-free holiday date computations used to cross-check the
// lookup tables in src/dates/tables (see docs/DATES.md §4 and §6).
// Usage: node docs/tools/calendars.mjs [startYear] [endYear]   (default 2024 2035)
// Sections: (1) date utilities, (2) Easter, (3) Hebrew calendar (Dershowitz & Reingold),
// (4) astronomy (Meeus: VSOP87-lite solar longitude, nutation, aberration, ch.27 equinoxes, ch.49 lunar phases),
// (5) Chinese calendar, Nowruz, tabular Islamic calendar, Hindu lunisolar (amanta) months, (6) main + self-tests.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const START_YEAR = Number(process.argv[2] ?? 2024), END_YEAR = Number(process.argv[3] ?? 2035);
const OUT_JSON = new URL('./computed.json', import.meta.url).pathname;

// ======================= (1) Date utilities =======================
// All integer "day numbers" are JDN (Julian Day Number, noon-based): 2000-01-01 = 2451545.
const floor = Math.floor;
const mod = (a, n) => ((a % n) + n) % n;
const pad = (n, w = 2) => String(n).padStart(w, '0');
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function gregorianToJdn(y, m, d) {
  const a = floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + floor((153 * mm + 2) / 5) + 365 * yy + floor(yy / 4) - floor(yy / 100) + floor(yy / 400) - 32045;
}
function julianToJdn(y, m, d) {
  const a = floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + floor((153 * mm + 2) / 5) + 365 * yy + floor(yy / 4) - 32083;
}
function jdnToGregorian(jdn) {
  const a = jdn + 32044, b = floor((4 * a + 3) / 146097), c = a - floor(146097 * b / 4);
  const d = floor((4 * c + 3) / 1461), e = c - floor(1461 * d / 4), m = floor((5 * e + 2) / 153);
  return { y: 100 * b + d - 4800 + floor(m / 10), m: m + 3 - 12 * floor(m / 10), d: e - floor((153 * m + 2) / 5) + 1 };
}
function isoFromJdn(jdn) { const g = jdnToGregorian(jdn); return `${g.y}-${pad(g.m)}-${pad(g.d)}`; }
function mmddFromJdn(jdn) { const g = jdnToGregorian(jdn); return `${pad(g.m)}-${pad(g.d)}`; }
function yearOfJdn(jdn) { return jdnToGregorian(jdn).y; }
function dowOfJdn(jdn) { return mod(jdn + 1, 7); } // 0 = Sunday
function dowName(jdn) { return DOW[dowOfJdn(jdn)]; }
// Instants are fractional Julian Dates (UT unless stated). JD 2451545.0 = 2000-01-01 12:00.
function localDateJdn(jd, tzHours) { return floor(jd + tzHours / 24 + 0.5); }
function localTimeOfDayHours(jd, tzHours) { const x = jd + tzHours / 24 + 0.5; return (x - floor(x)) * 24; }
function jdToIso(jd, tzHours = 0, label = 'UTC') {
  const x = jd + tzHours / 24 + 0.5;
  let jdn = floor(x), secs = Math.round((x - jdn) * 86400);
  if (secs >= 86400) { secs -= 86400; jdn += 1; }
  const g = jdnToGregorian(jdn);
  return `${g.y}-${pad(g.m)}-${pad(g.d)} ${pad(floor(secs / 3600))}:${pad(floor((secs % 3600) / 60))}:${pad(secs % 60)} ${label}`;
}
function hhmm(hours) { const s = Math.round(hours * 3600); return `${pad(floor(s / 3600))}:${pad(floor((s % 3600) / 60))}`; }

// ======================= (2) Easter =======================
function westernEaster(Y) { // Anonymous Gregorian algorithm (Meeus/Jones/Butcher) — exact
  const a = Y % 19, b = floor(Y / 100), c = Y % 100, d = floor(b / 4), e = b % 4;
  const f = floor((b + 8) / 25), g = floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = floor((a + 11 * h + 22 * l) / 451);
  const month = floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return gregorianToJdn(Y, month, day);
}
function orthodoxEaster(Y) { // Meeus Julian algorithm → Julian calendar date → Gregorian (= +13 days for 1900–2099)
  const a = Y % 4, b = Y % 7, c = Y % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  const julianJdn = julianToJdn(Y, month, day);
  const plus13 = gregorianToJdn(Y, month, day) + 13;
  if (julianJdn !== plus13) throw new Error(`Orthodox Easter ${Y}: Julian→Gregorian conversion mismatch`);
  return julianJdn;
}

// ======================= (3) Hebrew calendar (Dershowitz & Reingold, arithmetic) =======================
const RD_OFFSET = 1721425;            // JDN = R.D. + 1721425
const HEBREW_EPOCH_RD = -1373427;     // fixed-from-julian(-3761, October, 7)
function hebrewLeapYear(y) { return mod(7 * y + 1, 19) < 7; }
function lastMonthOfHebrewYear(y) { return hebrewLeapYear(y) ? 13 : 12; }
function hebrewCalendarElapsedDays(y) {
  const monthsElapsed = floor((235 * y - 234) / 19);
  const partsElapsed = 12084 + 13753 * monthsElapsed;             // molad parts (1/25920 day)
  let day = 29 * monthsElapsed + floor(partsElapsed / 25920);
  if (mod(3 * (day + 1), 7) < 3) day += 1;                        // dehiyyah: lo ADU rosh (+ molad-zaken folded in)
  return day;
}
function hebrewYearLengthCorrection(y) {                          // dehiyyot GaTaRaD / BeTU'TaKPaT
  const ny0 = hebrewCalendarElapsedDays(y - 1), ny1 = hebrewCalendarElapsedDays(y), ny2 = hebrewCalendarElapsedDays(y + 1);
  if (ny2 - ny1 === 356) return 2;
  if (ny1 - ny0 === 382) return 1;
  return 0;
}
function hebrewNewYearRd(y) { return HEBREW_EPOCH_RD + hebrewCalendarElapsedDays(y) + hebrewYearLengthCorrection(y); }
function daysInHebrewYear(y) { return hebrewNewYearRd(y + 1) - hebrewNewYearRd(y); }
function longMarheshvan(y) { return [355, 385].includes(daysInHebrewYear(y)); }
function shortKislev(y) { return [353, 383].includes(daysInHebrewYear(y)); }
function lastDayOfHebrewMonth(y, m) {
  if ([2, 4, 6, 10, 13].includes(m) || (m === 12 && !hebrewLeapYear(y)) || (m === 8 && !longMarheshvan(y)) || (m === 9 && shortKislev(y))) return 29;
  return 30;
}
// months: 1 Nisan … 6 Elul, 7 Tishrei, 8 Marheshvan, 9 Kislev, 10 Tevet, 11 Shevat, 12 Adar (Adar I in leap years), 13 Adar II
function hebrewToJdn(y, m, d) {
  let rd = hebrewNewYearRd(y) + d - 1;
  if (m < 7) {
    for (let mm = 7; mm <= lastMonthOfHebrewYear(y); mm++) rd += lastDayOfHebrewMonth(y, mm);
    for (let mm = 1; mm < m; mm++) rd += lastDayOfHebrewMonth(y, mm);
  } else {
    for (let mm = 7; mm < m; mm++) rd += lastDayOfHebrewMonth(y, mm);
  }
  return rd + RD_OFFSET;
}

// ======================= (4) Astronomy (Meeus, Astronomical Algorithms) =======================
const DEG = Math.PI / 180;
const sinD = x => Math.sin(x * DEG), cosD = x => Math.cos(x * DEG);
const norm360 = x => mod(x, 360);
const J2000 = 2451545.0;
function deltaT(jd) { const y = 2000 + (jd - J2000) / 365.25; return 69.2 + 0.1 * (y - 2024); } // seconds; ~69–70 s for 2024–2035
function jdeToUt(jde) { return jde - deltaT(jde) / 86400; }

// VSOP87 (abbreviated, Meeus Appendix III / NREL SPA) — Earth heliocentric longitude L0..L5. A in 1e-8 rad, B rad, C rad/millennium.
const VSOP_L = [
  [[175347046,0,0],[3341656,4.6692568,6283.0758500],[34894,4.62610,12566.15170],[3497,2.7441,5753.3849],[3418,2.8289,3.5231],[3136,3.6277,77713.7715],[2676,4.4181,7860.4194],[2343,6.1352,3930.2097],[1324,0.7425,11506.7698],[1273,2.0371,529.6910],[1199,1.1096,1577.3435],[990,5.233,5884.927],[902,2.045,26.298],[857,3.508,398.149],[780,1.179,5223.694],[753,2.533,5507.553],[505,4.583,18849.228],[492,4.205,775.523],[357,2.920,0.067],[317,5.849,11790.629],[284,1.899,796.298],[271,0.315,10977.079],[243,0.345,5486.778],[206,4.806,2544.314],[205,1.869,5573.143],[202,2.458,6069.777],[156,0.833,213.299],[132,3.411,2942.463],[126,1.083,20.775],[115,0.645,0.980],[103,0.636,4694.003],[102,0.976,15720.839],[102,4.267,7.114],[99,6.21,2146.17],[98,0.68,155.42],[86,5.98,161000.69],[85,1.30,6275.96],[85,3.67,71430.70],[80,1.81,17260.15],[79,3.04,12036.46],[75,1.76,5088.63],[74,3.50,3154.69],[74,4.68,801.82],[70,0.83,9437.76],[62,3.98,8827.39],[61,1.82,7084.90],[57,2.78,6286.60],[56,4.39,14143.50],[56,3.47,6279.55],[52,0.19,12139.55],[52,1.33,1748.02],[51,0.28,5856.48],[49,0.49,1194.45],[41,5.37,8429.24],[41,2.40,19651.05],[39,6.17,10447.39],[37,6.04,10213.29],[37,2.57,1059.38],[36,1.71,2352.87],[36,1.78,6812.77],[33,0.59,17789.85],[30,0.44,83996.85],[30,2.74,1349.87],[25,3.16,4690.48]],
  [[628331966747,0,0],[206059,2.678235,6283.075850],[4303,2.6351,12566.1517],[425,1.590,3.523],[119,5.796,26.298],[109,2.966,1577.344],[93,2.59,18849.23],[72,1.14,529.69],[68,1.87,398.15],[67,4.41,5507.55],[59,2.89,5223.69],[56,2.17,155.42],[45,0.40,796.30],[36,0.47,775.52],[29,2.65,7.11],[21,5.34,0.98],[19,1.85,5486.78],[19,4.97,213.30],[17,2.99,6275.96],[16,0.03,2544.31],[16,1.43,2146.17],[15,1.21,10977.08],[12,2.83,1748.02],[12,3.26,5088.63],[12,5.27,1194.45],[12,2.08,4694.00],[11,0.77,553.57],[10,1.30,6286.60],[10,4.24,1349.87],[9,2.70,242.73],[9,5.64,951.72],[8,5.30,2352.87],[6,2.65,9437.76],[6,4.67,4690.48]],
  [[52919,0,0],[8720,1.0721,6283.0758],[309,0.867,12566.152],[27,0.05,3.52],[16,5.19,26.30],[16,3.68,155.42],[10,0.76,18849.23],[9,2.06,77713.77],[7,0.83,775.52],[5,4.66,1577.34],[4,1.03,7.11],[4,3.44,5573.14],[3,5.14,796.30],[3,6.05,5507.55],[3,1.19,242.73],[3,6.12,529.69],[3,0.31,398.15],[3,2.28,553.57],[2,4.38,5223.69],[2,3.75,0.98]],
  [[289,5.844,6283.076],[35,0,0],[17,5.49,12566.15],[3,5.20,155.42],[1,4.72,3.52],[1,5.30,18849.23],[1,5.97,242.73]],
  [[114,3.142,0],[8,4.13,6283.08],[1,3.84,12566.15]],
  [[1,3.14,0]],
];
function earthHeliocentricLongitude(jde) { // degrees, mean equinox of date (VSOP87 dynamical frame)
  const tau = (jde - J2000) / 365250;
  let sum = 0, tp = 1;
  for (const series of VSOP_L) {
    let s = 0;
    for (const [A, B, C] of series) s += A * Math.cos(B + C * tau);
    sum += s * tp; tp *= tau;
  }
  return norm360(sum / 1e8 / DEG);
}
function nutationLongitude(jde) { // Meeus ch.22 (low-accuracy form, 0.5"), degrees
  const T = (jde - J2000) / 36525;
  const Om = 125.04452 - 1934.136261 * T, L = 280.4665 + 36000.7698 * T, Lp = 218.3165 + 481267.8813 * T;
  return (-17.20 * sinD(Om) - 1.32 * sinD(2 * L) - 0.23 * sinD(2 * Lp) + 0.21 * sinD(2 * Om)) / 3600;
}
function sunDistanceAU(jde) { // Meeus ch.25 low accuracy — only used for aberration (-20.4898"/R)
  const T = (jde - J2000) / 36525;
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinD(M) + (0.019993 - 0.000101 * T) * sinD(2 * M) + 0.000289 * sinD(3 * M);
  return 1.000001018 * (1 - e * e) / (1 + e * cosD(M + C));
}
function apparentSolarLongitude(jde) { // degrees, apparent geocentric (true equinox of date)
  let theta = earthHeliocentricLongitude(jde) + 180;
  theta += -0.09033 / 3600;                        // FK5 frame correction
  theta += nutationLongitude(jde);                 // nutation in longitude
  theta += -20.4898 / 3600 / sunDistanceAU(jde);   // aberration
  return norm360(theta);
}
function lowPrecisionSolarLongitude(jde) { // Meeus ch.25 "low accuracy" (0.01°) — cross-check only
  const T = (jde - J2000) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinD(M) + (0.019993 - 0.000101 * T) * sinD(2 * M) + 0.000289 * sinD(3 * M);
  const Om = 125.04 - 1934.136 * T;
  return norm360(L0 + C - 0.00569 - 0.00478 * sinD(Om));
}
function solarLongitudeInstant(targetDeg, jdeGuess) { // JDE (TT) at which apparent solar longitude == targetDeg, nearest jdeGuess
  let jde = jdeGuess;
  for (let i = 0; i < 30; i++) {
    const diff = mod(targetDeg - apparentSolarLongitude(jde) + 180, 360) - 180;
    jde += diff / 0.98564736;
    if (Math.abs(diff) < 1e-9) break;
  }
  return jde;
}
// Meeus ch.27 equinox/solstice (years 1000–3000) — independent cross-check of the VSOP-based solver
const EQX_TERMS = [[485,324.96,1934.136],[203,337.23,32964.467],[199,342.08,20.186],[182,27.85,445267.112],[156,73.14,45036.886],[136,171.52,22518.443],[77,222.54,65928.934],[74,296.72,3034.906],[70,243.58,9037.513],[58,119.81,33718.147],[52,297.17,150.678],[50,21.02,2281.226],[45,247.54,29929.562],[44,325.15,31555.956],[29,60.93,4443.417],[18,155.12,67555.328],[17,288.79,4562.452],[16,198.04,62894.029],[14,199.76,31436.921],[12,95.39,14577.848],[12,287.11,31931.756],[12,320.81,34777.259],[9,227.73,1222.114],[8,15.45,16859.074]];
function meeusEquinoxSolstice(year, which) { // which: 0 = March eq, 1 = June sol, 2 = Sept eq, 3 = Dec sol → JDE
  const Y = (year - 2000) / 1000, Y2 = Y * Y, Y3 = Y2 * Y, Y4 = Y3 * Y;
  const jde0 = [
    2451623.80984 + 365242.37404 * Y + 0.05169 * Y2 - 0.00411 * Y3 - 0.00057 * Y4,
    2451716.56767 + 365241.62603 * Y + 0.00325 * Y2 + 0.00888 * Y3 - 0.00030 * Y4,
    2451810.21715 + 365242.01767 * Y - 0.11575 * Y2 + 0.00337 * Y3 + 0.00078 * Y4,
    2451900.05952 + 365242.74049 * Y - 0.06223 * Y2 - 0.00823 * Y3 + 0.00032 * Y4,
  ][which];
  const T = (jde0 - J2000) / 36525;
  const W = 35999.373 * T - 2.47;
  const dl = 1 + 0.0334 * cosD(W) + 0.0007 * cosD(2 * W);
  let S = 0; for (const [A, B, C] of EQX_TERMS) S += A * cosD(B + C * T);
  return jde0 + 0.00001 * S / dl;
}

// Meeus ch.49 — lunar phases with full periodic terms. phase: 0 = new moon, 0.5 = full moon. Returns JDE (TT).
function moonPhaseJde(kInt, phase) {
  const k = kInt + phase, T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T4;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = norm360(2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3);
  const Mp = norm360(201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4);
  const F = norm360(160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4);
  const Om = norm360(124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3);
  const nm = phase === 0;
  let c = (nm ? -0.40720 : -0.40614) * sinD(Mp)
    + (nm ? 0.17241 : 0.17302) * E * sinD(M)
    + (nm ? 0.01608 : 0.01614) * sinD(2 * Mp)
    + (nm ? 0.01039 : 0.01043) * sinD(2 * F)
    + (nm ? 0.00739 : 0.00734) * E * sinD(Mp - M)
    - (nm ? 0.00514 : 0.00515) * E * sinD(Mp + M)
    + (nm ? 0.00208 : 0.00209) * E * E * sinD(2 * M)
    - 0.00111 * sinD(Mp - 2 * F) - 0.00057 * sinD(Mp + 2 * F) + 0.00056 * E * sinD(2 * Mp + M)
    - 0.00042 * sinD(3 * Mp) + 0.00042 * E * sinD(M + 2 * F) + 0.00038 * E * sinD(M - 2 * F)
    - 0.00024 * E * sinD(2 * Mp - M) - 0.00017 * sinD(Om) - 0.00007 * sinD(Mp + 2 * M)
    + 0.00004 * sinD(2 * Mp - 2 * F) + 0.00004 * sinD(3 * M) + 0.00003 * sinD(Mp + M - 2 * F)
    + 0.00003 * sinD(2 * Mp + 2 * F) - 0.00003 * sinD(Mp + M + 2 * F) + 0.00003 * sinD(Mp - M + 2 * F)
    - 0.00002 * sinD(Mp - M - 2 * F) - 0.00002 * sinD(3 * Mp + M) + 0.00002 * sinD(4 * Mp);
  const A = [299.77 + 0.107408 * k - 0.009173 * T2, 251.88 + 0.016321 * k, 251.83 + 26.651886 * k, 349.42 + 36.412478 * k,
    84.66 + 18.206239 * k, 141.74 + 53.303771 * k, 207.14 + 2.453732 * k, 154.84 + 7.306860 * k, 34.52 + 27.261239 * k,
    207.19 + 0.121824 * k, 291.34 + 1.844379 * k, 161.72 + 24.198154 * k, 239.56 + 25.513099 * k, 331.55 + 3.592518 * k];
  const Ac = [0.000325, 0.000165, 0.000164, 0.000126, 0.000110, 0.000062, 0.000060, 0.000056, 0.000047, 0.000042, 0.000040, 0.000037, 0.000035, 0.000023];
  for (let i = 0; i < 14; i++) c += Ac[i] * sinD(A[i]);
  return jde + c;
}
// Tables of all new/full moons 2021–2038 (UT instants), sorted.
function buildPhaseTable(phase) {
  const out = [];
  for (let k = floor((2021 - 2000) * 12.3685); k <= Math.ceil((2038 - 2000) * 12.3685); k++) {
    const jde = moonPhaseJde(k, phase), jdUt = jdeToUt(jde);
    out.push({ k, jde, jdUt });
  }
  return out.sort((a, b) => a.jdUt - b.jdUt);
}
const NEW_MOONS = buildPhaseTable(0);
const FULL_MOONS = buildPhaseTable(0.5);

// ======================= (5a) Chinese calendar (Beijing time, UTC+8) =======================
const CN_TZ = 8;
function solarTermUt(longitude, year) { // UT instant when apparent solar longitude == `longitude`, in (approximately) Gregorian `year`
  let doy = 79 + norm360(longitude) * 365.2422 / 360;       // Mar 20 ≈ day 79
  if (doy > 366) doy -= 365.2422;
  const guess = gregorianToJdn(year, 1, 1) + doy - 1;
  return jdeToUt(solarLongitudeInstant(longitude, guess));
}
function decemberSolsticeUt(year) { return jdeToUt(solarLongitudeInstant(270, gregorianToJdn(year, 12, 21) + 0.5)); }
function newMoonOnOrBefore(dateJdn, tz) { let best = null; for (const nm of NEW_MOONS) { if (localDateJdn(nm.jdUt, tz) <= dateJdn) best = nm; else break; } return best; }
function newMoonsInRange(fromJdn, toJdn, tz) { return NEW_MOONS.filter(nm => { const d = localDateJdn(nm.jdUt, tz); return d >= fromJdn && d < toJdn; }); }
function majorSolarTermsInRange(fromJdn, toJdn, tz) { // zhongqi = solar longitude multiple of 30°, as local dates
  const out = [];
  for (let y = yearOfJdn(fromJdn) - 1; y <= yearOfJdn(toJdn) + 1; y++) {
    for (let L = 0; L < 360; L += 30) {
      const ut = solarTermUt(L, y), d = localDateJdn(ut, tz);
      if (d >= fromJdn && d < toJdn && !out.some(t => Math.abs(t.jdUt - ut) < 1)) out.push({ longitude: L, date: d, jdUt: ut });
    }
  }
  return out.sort((a, b) => a.jdUt - b.jdUt);
}
// Months of the sui (solstice-to-solstice year) that contains Chinese New Year of Gregorian year Y.
function chineseYear(Y) {
  const s1ut = decemberSolsticeUt(Y - 1), s2ut = decemberSolsticeUt(Y);
  const s1 = localDateJdn(s1ut, CN_TZ), s2 = localDateJdn(s2ut, CN_TZ);
  const m11 = localDateJdn(newMoonOnOrBefore(s1, CN_TZ).jdUt, CN_TZ);          // month 11 contains the winter solstice
  const nextM11 = localDateJdn(newMoonOnOrBefore(s2, CN_TZ).jdUt, CN_TZ);
  const starts = newMoonsInRange(m11, nextM11, CN_TZ).map(nm => localDateJdn(nm.jdUt, CN_TZ));
  const leapSui = starts.length === 13;
  const terms = majorSolarTermsInRange(m11, nextM11, CN_TZ);
  const months = [];
  let num = 11, leapAssigned = false;
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i], end = i + 1 < starts.length ? starts[i + 1] : nextM11;
    const zhongqi = terms.filter(t => t.date >= start && t.date < end).map(t => t.longitude);
    if (i === 0) { months.push({ num: 11, leap: false, start, end, zhongqi }); continue; }
    if (leapSui && !leapAssigned && zhongqi.length === 0) { months.push({ num, leap: true, start, end, zhongqi }); leapAssigned = true; }
    else { num = num === 12 ? 1 : num + 1; months.push({ num, leap: false, start, end, zhongqi }); }
  }
  if (leapSui && !leapAssigned) throw new Error(`Chinese year ${Y}: 13-month sui but no month without zhongqi`);
  const month = n => months.find(m => m.num === n && !m.leap);
  return { year: Y, solstice1: s1, solstice2: s2, leapSui, leapMonth: months.find(m => m.leap)?.num ?? null, months,
    newYear: month(1).start, lantern: month(1).start + 14, dragonBoat: month(5).start + 4, midAutumn: month(8).start + 14,
    qingmingUt: solarTermUt(15, Y) };
}

// ======================= (5b) Nowruz (March equinox, Tehran UTC+3:30) =======================
function nowruz(Y) {
  const eqUt = solarTermUt(0, Y);
  const ch27Ut = jdeToUt(meeusEquinoxSolstice(Y, 0));
  const date = localDateJdn(eqUt, 3.5), hour = localTimeOfDayHours(eqUt, 3.5);
  return { equinoxUt: eqUt, ch27Ut, tehranDate: date, tehranHour: hour, date: hour < 12 ? date : date + 1, diffSeconds: (eqUt - ch27Ut) * 86400 };
}

// ======================= (5c) Tabular Islamic calendar (30-year cycle, leap years 2,5,7,10,13,16,18,21,24,26,29; epoch 16 July 622 Julian) =======================
const ISLAMIC_EPOCH_RD = 227015; // = JDN 1948440 = 16 July 622 (Julian), Friday
function islamicLeapYear(y) { return mod(14 + 11 * y, 30) < 11; }
function islamicToJdn(y, m, d) { return ISLAMIC_EPOCH_RD - 1 + (y - 1) * 354 + floor((3 + 11 * y) / 30) + 29 * (m - 1) + floor(m / 2) + d + RD_OFFSET; }
function nearestNewMoon(jdn) { let best = null; for (const nm of NEW_MOONS) { if (!best || Math.abs(nm.jdUt - jdn) < Math.abs(best.jdUt - jdn)) best = nm; } return best; }
function meccaSunsetUt(dateJdn) { // UT (JD) of sunset at Mecca (21.4225 N, 39.8262 E) on the given date; Meeus ch.28 equation of time
  const jde = dateJdn + 0.0 + deltaT(dateJdn) / 86400; // ~12:00 UTC of that date
  const T = (jde - J2000) / 36525;
  const eps = 23.439291 - 0.0130042 * T, y = Math.tan(eps / 2 * DEG) ** 2;
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T), M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const Erad = y * sinD(2 * L0) - 2 * e * sinD(M) + 4 * e * y * sinD(M) * cosD(2 * L0) - 0.5 * y * y * sinD(4 * L0) - 1.25 * e * e * sinD(2 * M);
  const Emin = Erad / DEG * 4;                                         // equation of time, minutes
  const lam = apparentSolarLongitude(jde), dec = Math.asin(sinD(eps) * sinD(lam)) / DEG;
  const phi = 21.4225, lon = 39.8262;
  const cosH0 = (sinD(-0.8333) - sinD(phi) * sinD(dec)) / (cosD(phi) * cosD(dec));
  const H0 = Math.acos(Math.max(-1, Math.min(1, cosH0))) / DEG;
  const transitUtHours = 12 - lon / 15 - Emin / 60;
  return dateJdn - 0.5 + (transitUtHours + H0 / 15) / 24;             // JD (UT); dateJdn - 0.5 = 00:00 UT of that date
}
function islamicObservance(hy, m, d) { // tabular date + nearest astronomical new moon + Umm al-Qura-style heuristic
  const jdn = islamicToJdn(hy, m, d);
  const monthStart = islamicToJdn(hy, m, 1);
  const nm = nearestNewMoon(monthStart);
  const meccaDate = localDateJdn(nm.jdUt, 3), meccaHour = localTimeOfDayHours(nm.jdUt, 3);
  // Umm al-Qura: the month begins the day after the (Mecca) evening on which the conjunction preceded sunset AND the moon set after the sun.
  // Heuristic here: conjunction before Mecca sunset that day -> month starts next day; otherwise the day after. (Ignores the moonset test,
  // which can occasionally fail for a very young moon, so this is still +-1 day.)
  const sunsetUt = meccaSunsetUt(meccaDate);
  const beforeSunset = nm.jdUt < sunsetUt;
  const uaqMonthStart = beforeSunset ? meccaDate + 1 : meccaDate + 2;
  return { jdn, hy, nm, monthStartTabular: monthStart, uaqGuess: uaqMonthStart + (d - 1), meccaHour, meccaSunset: jdToIso(sunsetUt, 3, "AST").slice(11, 16), beforeSunset };
}

// ======================= (5d) Hindu lunisolar (amanta months named by the sidereal sankranti they contain; IST UTC+5:30) =======================
const IN_TZ = 5.5;
function lahiriAyanamsa(jd) { const yr = 2000 + (jd - J2000) / 365.25; return 23.853 + 0.013969 * (yr - 2000); } // ≈ 24°11' in 2024
function sankrantiUt(siderealDeg, year) { // UT instant when sidereal (Lahiri) solar longitude == siderealDeg, in Gregorian `year`
  let doy = 79 + norm360(siderealDeg + 24.2) * 365.2422 / 360;
  if (doy > 366) doy -= 365.2422;
  let jde = gregorianToJdn(year, 1, 1) + doy - 1;
  for (let i = 0; i < 3; i++) jde = solarLongitudeInstant(norm360(siderealDeg + lahiriAyanamsa(jde)), jde);
  return jdeToUt(jde);
}
// Amanta month containing the sankranti into sidereal sign `siderealDeg` (0 = Mesha → Chaitra, 30 = Vrishabha → Vaisakha, 180 = Tula → Ashwina, 330 = Meena → Phalguna)
function amantaMonth(siderealDeg, year) {
  const t = sankrantiUt(siderealDeg, year);
  let a = null, b = null;
  for (const nm of NEW_MOONS) { if (nm.jdUt <= t) a = nm; else { b = nm; break; } }
  const fullMoon = FULL_MOONS.find(f => f.jdUt > a.jdUt && f.jdUt < b.jdUt);
  return { sankrantiUt: t, startNM: a, endNM: b, fullMoon };
}
const PRADOSH_THRESHOLD_H = 18.5; // IST; sunset in N. India ≈ 17:30–18:30 → tithi must prevail into Pradosh Kaal to count for that evening
function diwali(Y) { // Lakshmi Puja: Amavasya ending amanta Ashwina (= purnimanta Kartika Amavasya), evening with Amavasya during Pradosh
  const m = amantaMonth(180, Y), nm = m.endNM;
  const d = localDateJdn(nm.jdUt, IN_TZ), h = localTimeOfDayHours(nm.jdUt, IN_TZ);
  return { nm, istDate: d, istHour: h, date: h >= PRADOSH_THRESHOLD_H ? d : d - 1, ambiguous: h >= 17 && h <= 19.5, taskRuleDate: h >= 17.75 ? d : d - 1 };
}
function holi(Y) { // Holika Dahan on the evening with Phalguna Purnima during Pradosh; Rangwali Holi the next day
  const m = amantaMonth(330, Y), fm = m.fullMoon;
  const d = localDateJdn(fm.jdUt, IN_TZ), h = localTimeOfDayHours(fm.jdUt, IN_TZ);
  const holikaDahan = h >= PRADOSH_THRESHOLD_H ? d : d - 1;
  return { fm, istDate: d, istHour: h, date: holikaDahan + 1, holikaDahan, ambiguous: h >= 17 && h <= 19.5, taskRuleDate: d + 1 };
}
function vesak(Y) { // Vaisakha Purnima (Buddha Purnima): full moon of amanta Vaisakha. India (udaya tithi): the date on which Purnima prevails at sunrise (~05:45 IST)
  const m = amantaMonth(30, Y), fm = m.fullMoon;
  const d = localDateJdn(fm.jdUt, IN_TZ), h = localTimeOfDayHours(fm.jdUt, IN_TZ);
  const udayaDate = h >= 5.75 ? d : d - 1;
  return { fm, istDate: d, istHour: h, date: udayaDate, udayaCaveat: h < 5.75, monthStart: m.startNM, monthEnd: m.endNM };
}

// ======================= (6) Main: entries, self-tests, table, JSON =======================
const entries = [];
const details = { chineseYears: [], nowruz: [], islamic: [], hindu: [], equinoxCrossCheck: [] };
const addEntry = (id, year, jdn, confidence, note) => entries.push({ id, year, date: isoFromJdn(jdn), confidence, note });
const utc = jd => jdToIso(jd, 0, 'UTC');

for (let Y = START_YEAR; Y <= END_YEAR; Y++) {
  // --- Easter ---
  addEntry('easter', Y, westernEaster(Y), 'high', 'Western Easter, anonymous Gregorian algorithm (exact).');
  addEntry('orthodox-easter', Y, orthodoxEaster(Y), 'high', 'Orthodox Easter, Meeus Julian algorithm; Julian date + 13 days (exact for 1900-2099).');
  // --- Hebrew (arithmetic calendar, exact). Hebrew year Y+3761 begins in autumn of Y; Y+3760 covers spring of Y ---
  const hyA = Y + 3761, hyS = Y + 3760;
  addEntry('rosh-hashanah', Y, hebrewToJdn(hyA, 7, 1), 'high', `1 Tishrei ${hyA} (exact, Dershowitz-Reingold arithmetic calendar). Holiday begins at sundown the previous evening.`);
  addEntry('yom-kippur', Y, hebrewToJdn(hyA, 7, 10), 'high', `10 Tishrei ${hyA} (exact). Begins at sundown the previous evening.`);
  addEntry('hanukkah', Y, hebrewToJdn(hyA, 9, 25), 'high', `25 Kislev ${hyA}, first day of Hanukkah (exact). First candle is lit at nightfall the previous evening.`);
  const adar = hebrewLeapYear(hyS) ? 13 : 12;
  addEntry('purim', Y, hebrewToJdn(hyS, adar, 14), 'high', `14 ${adar === 13 ? 'Adar II' : 'Adar'} ${hyS} (exact; ${hebrewLeapYear(hyS) ? 'leap year' : 'common year'}). Begins at sundown the previous evening.`);
  addEntry('passover', Y, hebrewToJdn(hyS, 1, 15), 'high', `15 Nisan ${hyS}, first day of Passover (exact). Seder is on the previous evening.`);
  // --- Chinese ---
  const cy = chineseYear(Y);
  const cnNote = `Astronomical Chinese calendar (Beijing UTC+8; Meeus ch.49 new moons, VSOP87-lite solar terms). ${cy.leapSui ? `Leap month ${cy.leapMonth} in this sui.` : 'No leap month in this sui.'}`;
  addEntry('lunar-new-year', Y, cy.newYear, 'high', `Month 1 day 1. ${cnNote}`);
  addEntry('lantern-festival', Y, cy.lantern, 'high', `Month 1 day 15 (New Year + 14 days). ${cnNote}`);
  addEntry('qingming', Y, localDateJdn(cy.qingmingUt, CN_TZ), 'high', `Solar longitude 15° at ${jdToIso(cy.qingmingUt, 8, 'CST')} (= ${utc(cy.qingmingUt)}).`);
  addEntry('dragon-boat', Y, cy.dragonBoat, 'high', `Month 5 day 5. ${cnNote}`);
  addEntry('mid-autumn', Y, cy.midAutumn, 'high', `Month 8 day 15. ${cnNote}`);
  details.chineseYears.push({ year: Y, winterSolsticeBefore: isoFromJdn(cy.solstice1), winterSolsticeAfter: isoFromJdn(cy.solstice2), leapSui: cy.leapSui, leapMonth: cy.leapMonth,
    months: cy.months.map(m => ({ month: m.num, leap: m.leap, start: isoFromJdn(m.start), days: m.end - m.start, zhongqi: m.zhongqi })) });
  // --- Nowruz ---
  const nz = nowruz(Y);
  addEntry('nowruz', Y, nz.date, 'high', `March equinox ${utc(nz.equinoxUt)} = ${jdToIso(nz.equinoxUt, 3.5, 'IRST')} (Tehran); ${nz.tehranHour < 12 ? 'before' : 'after'} noon Tehran → Nowruz ${nz.tehranHour < 12 ? 'same day' : 'next day'}. Meeus ch.27 cross-check differs by ${nz.diffSeconds.toFixed(0)} s.`);
  details.nowruz.push({ year: Y, equinoxUtc: utc(nz.equinoxUt), equinoxTehran: jdToIso(nz.equinoxUt, 3.5, 'IRST'), ch27Utc: utc(nz.ch27Ut), date: isoFromJdn(nz.date) });
  details.equinoxCrossCheck.push({ year: Y, vsopMinusCh27Seconds: +nz.diffSeconds.toFixed(1) });
  // --- Islamic (tabular; all Hijri dates falling in Gregorian year Y) ---
  for (let hy = 1444; hy <= 1460; hy++) {
    for (const [id, m, d, label] of [['ramadan-start', 9, 1, '1 Ramadan'], ['eid-al-fitr', 10, 1, '1 Shawwal'], ['eid-al-adha', 12, 10, '10 Dhu al-Hijjah']]) {
      const o = islamicObservance(hy, m, d);
      if (yearOfJdn(o.jdn) !== Y) continue;
      const note = `${label} ${hy} AH, tabular (Kuwaiti) calendar: APPROXIMATE, actual Umm al-Qura/observed date may differ by ±1 day. Nearest astronomical new moon to tabular month start (${isoFromJdn(o.monthStartTabular)}): ${utc(o.nm.jdUt)} = ${jdToIso(o.nm.jdUt, 3, 'AST')} Mecca. Mecca sunset that day ${o.meccaSunset} AST (conjunction ${o.beforeSunset ? "before" : "after"} sunset). Heuristic Umm al-Qura-style date: ${isoFromJdn(o.uaqGuess)}${o.uaqGuess === o.jdn ? ' (agrees)' : ' (differs from tabular)'}.`;
      addEntry(id, Y, o.jdn, 'medium', note);
      details.islamic.push({ id, year: Y, hijriYear: hy, tabular: isoFromJdn(o.jdn), newMoonUtc: utc(o.nm.jdUt), newMoonMecca: jdToIso(o.nm.jdUt, 3, 'AST'), uaqHeuristic: isoFromJdn(o.uaqGuess) });
    }
  }
  // --- Hindu ---
  const dw = diwali(Y);
  addEntry('diwali', Y, dw.date, 'medium', `Lakshmi Puja / Diwali: Amavasya ending amanta Ashwina (Kartika Amavasya). New moon ${utc(dw.nm.jdUt)} = ${jdToIso(dw.nm.jdUt, 5.5, 'IST')}; new moon ${dw.istHour >= PRADOSH_THRESHOLD_H ? 'after' : 'before'} ~18:30 IST so Amavasya ${dw.istHour >= PRADOSH_THRESHOLD_H ? 'prevails during Pradosh that evening' : 'prevailed during Pradosh the previous evening'}.${dw.ambiguous ? ' AMBIGUOUS: instant within ~1.5 h of sunset; regional panchangs may differ by a day.' : ''} Day-of-instant rule (IST date) would give ${isoFromJdn(dw.istDate)}.`);
  const hl = holi(Y);
  addEntry('holi', Y, hl.date, 'medium', `Rangwali Holi = day after Holika Dahan (${isoFromJdn(hl.holikaDahan)}), the evening with Phalguna Purnima during Pradosh. Full moon ${utc(hl.fm.jdUt)} = ${jdToIso(hl.fm.jdUt, 5.5, 'IST')}.${hl.ambiguous ? ' AMBIGUOUS: full moon within ~1.5 h of sunset; sources may differ by a day.' : ''} Naive 'day after full-moon day' rule would give ${isoFromJdn(hl.taskRuleDate)}.`);
  const vs = vesak(Y);
  addEntry('vesak', Y, vs.date, 'medium', `Vaisakha Purnima (Buddha Purnima / Vesak): full moon of amanta Vaisakha (${isoFromJdn(localDateJdn(vs.monthStart.jdUt, 5.5))} to ${isoFromJdn(localDateJdn(vs.monthEnd.jdUt, 5.5) - 1)}), ${utc(vs.fm.jdUt)} = ${jdToIso(vs.fm.jdUt, 5.5, 'IST')}.${vs.udayaCaveat ? ` Full moon is before sunrise IST, so by the udaya-tithi convention (India) Buddha Purnima is ${isoFromJdn(vs.date)}; the calendar date of the full-moon instant is ${isoFromJdn(vs.istDate)} (used by some countries).` : ""} Some countries (Sri Lanka, SE Asia) fix Vesak by their own lunar rules; may differ by a day or month.`);
  details.hindu.push({ year: Y, diwali: isoFromJdn(dw.date), diwaliNewMoonIst: jdToIso(dw.nm.jdUt, 5.5, 'IST'), holi: isoFromJdn(hl.date), holiFullMoonIst: jdToIso(hl.fm.jdUt, 5.5, 'IST'), vesak: isoFromJdn(vs.date), vesakFullMoonIst: jdToIso(vs.fm.jdUt, 5.5, 'IST') });
}

// ---------- Self-tests ----------
const tests = [];
const T = (name, actual, expected) => tests.push({ name, actual, expected, pass: actual === expected });
const get = (id, year) => entries.filter(e => e.id === id && e.year === year).map(e => e.date).join('/');
T('1 Tishrei 5785', isoFromJdn(hebrewToJdn(5785, 7, 1)), '2024-10-03');
T('15 Nisan 5784', isoFromJdn(hebrewToJdn(5784, 1, 15)), '2024-04-23');
T('25 Kislev 5785', isoFromJdn(hebrewToJdn(5785, 9, 25)), '2024-12-26');
for (let hy = 5784; hy <= 5796; hy++) {
  T(`RH ${hy} not Sun/Wed/Fri`, [0, 3, 5].includes(dowOfJdn(hebrewToJdn(hy, 7, 1))), false);
  T(`YK ${hy} not Fri/Sun`, [5, 0].includes(dowOfJdn(hebrewToJdn(hy, 7, 10))), false);
  T(`Pesach ${hy} not Mon/Wed/Fri`, [1, 3, 5].includes(dowOfJdn(hebrewToJdn(hy, 1, 15))), false);
}
T('LNY 2024', get('lunar-new-year', 2024), '2024-02-10');
T('LNY 2025', get('lunar-new-year', 2025), '2025-01-29');
T('LNY 2026', get('lunar-new-year', 2026), '2026-02-17');
T('Mid-Autumn 2024', get('mid-autumn', 2024), '2024-09-17');
T('Mid-Autumn 2025', get('mid-autumn', 2025), '2025-10-06');
T('Dragon Boat 2024', get('dragon-boat', 2024), '2024-06-10');
T('Dragon Boat 2025', get('dragon-boat', 2025), '2025-05-31');
T('Qingming 2024', get('qingming', 2024), '2024-04-04');
T('Qingming 2025', get('qingming', 2025), '2025-04-04');
T('Meeus ex.49.a new moon 1977 JDE', moonPhaseJde(-283, 0).toFixed(5), '2443192.65118');
T('Meeus ex.27.a June solstice 1962 JDE (ch.27)', meeusEquinoxSolstice(1962, 1).toFixed(5), '2437837.39245');
T('Meeus ex.25.b apparent solar longitude 1992-10-13 (±0.001°)', Math.abs(apparentSolarLongitude(2448908.5) - 199.9061) < 0.001, true);
T('Easter 2024', get('easter', 2024), '2024-03-31');
T('Orthodox Easter 2024', get('orthodox-easter', 2024), '2024-05-05');
T('1 Ramadan 1445 tabular', isoFromJdn(islamicToJdn(1445, 9, 1)), '2024-03-11');
const maxEqDiff = Math.max(...details.equinoxCrossCheck.map(x => Math.abs(x.vsopMinusCh27Seconds)));
T('VSOP vs Meeus ch.27 March equinox agree within 60 s (all years)', maxEqDiff < 60, true);
const chineseTestsPass = tests.filter(t => /LNY|Mid-Autumn|Dragon Boat|Qingming/.test(t.name)).every(t => t.pass);
const hebrewTestsPass = tests.filter(t => /Tishrei|Nisan|Kislev|RH |YK |Pesach/.test(t.name)).every(t => t.pass);
if (!chineseTestsPass) for (const e of entries) if (['lunar-new-year', 'lantern-festival', 'qingming', 'dragon-boat', 'mid-autumn'].includes(e.id)) e.confidence = 'medium';
if (!hebrewTestsPass) for (const e of entries) if (['rosh-hashanah', 'yom-kippur', 'hanukkah', 'purim', 'passover'].includes(e.id)) e.confidence = 'low';
if (maxEqDiff >= 60) for (const e of entries) if (e.id === 'nowruz') e.confidence = 'medium';

// ---------- Table ----------
const IDS = ['lunar-new-year', 'lantern-festival', 'qingming', 'dragon-boat', 'mid-autumn', 'holi', 'diwali', 'ramadan-start', 'eid-al-fitr', 'eid-al-adha', 'rosh-hashanah', 'yom-kippur', 'hanukkah', 'purim', 'passover', 'nowruz', 'vesak', 'orthodox-easter', 'easter'];
const years = []; for (let y = START_YEAR; y <= END_YEAR; y++) years.push(y);
console.log('\nHOLIDAY DATES 2024-2035 (MM-DD; two dates separated by "/" when a holiday occurs twice in one Gregorian year)\n');
console.log('holiday'.padEnd(18) + 'conf  ' + years.map(y => String(y).padEnd(12)).join(''));
console.log('-'.repeat(18 + 6 + 12 * years.length));
for (const id of IDS) {
  const conf = entries.find(e => e.id === id).confidence.slice(0, 4);
  const cells = years.map(y => entries.filter(e => e.id === id && e.year === y).map(e => e.date.slice(5)).join('/').padEnd(12));
  console.log(id.padEnd(18) + conf.padEnd(6) + cells.join(''));
}
console.log('\nChinese years:');
for (const c of details.chineseYears) console.log(`  ${c.year}: solstice ${c.winterSolsticeBefore} → ${c.winterSolsticeAfter}, ${c.leapSui ? 'LEAP month ' + c.leapMonth : 'no leap month'}; months: ` + c.months.map(m => `${m.leap ? 'L' : ''}${m.month}@${m.start.slice(5)}`).join(' '));
console.log('\nNowruz / March equinox:');
for (const n of details.nowruz) console.log(`  ${n.year}: ${n.equinoxUtc} | Tehran ${n.equinoxTehran} | ch.27 ${n.ch27Utc} → Nowruz ${n.date}`);
console.log('\nIslamic (tabular vs. nearest new moon vs. Umm al-Qura heuristic):');
for (const i of details.islamic) console.log(`  ${i.year} ${i.id.padEnd(14)} ${i.hijriYear} AH tabular ${i.tabular} | new moon ${i.newMoonUtc} (${i.newMoonMecca}) | UaQ-heuristic ${i.uaqHeuristic}${i.uaqHeuristic !== i.tabular ? '  <-- differs' : ''}`);
console.log('\nHindu (instants in IST):');
for (const h of details.hindu) console.log(`  ${h.year}: Holi ${h.holi} (FM ${h.holiFullMoonIst}) | Vesak ${h.vesak} (FM ${h.vesakFullMoonIst}) | Diwali ${h.diwali} (NM ${h.diwaliNewMoonIst})`);
console.log('\nSELF-TESTS:');
let failed = 0;
for (const t of tests) { if (!t.pass) failed++; if (!t.pass || !/not (Sun|Fri|Mon)/.test(t.name)) console.log(`  ${t.pass ? 'PASS' : 'FAIL'}  ${t.name}: ${t.actual}${t.pass ? '' : ' (expected ' + t.expected + ')'}`); }
console.log(`  ${tests.length - failed}/${tests.length} passed (weekday-rule checks for 5784-5796 are counted but only printed on failure)`);

// ---------- JSON ----------
const output = { generatedAt: new Date().toISOString(), years: [START_YEAR, END_YEAR], selfTests: { passed: tests.length - failed, total: tests.length, failures: tests.filter(t => !t.pass) },
  methods: { easter: 'anonymous Gregorian algorithm', orthodoxEaster: 'Meeus Julian algorithm + 13 days', hebrew: 'Dershowitz & Reingold arithmetic calendar', chinese: 'Meeus ch.49 lunar phases + VSOP87-lite apparent solar longitude, Beijing UTC+8, D&R sui/leap-month rule', nowruz: 'March equinox (VSOP87-lite, cross-checked with Meeus ch.27), Tehran noon rule', islamic: 'tabular 30-year cycle (type II leap years), epoch 16 July 622 Julian', hindu: 'amanta months named by contained sidereal (Lahiri) sankranti; tithi-at-Pradosh heuristics' },
  entries, details };
mkdirSync(dirname(OUT_JSON), { recursive: true });
writeFileSync(OUT_JSON, JSON.stringify(output, null, 2));
console.log(`\nWrote ${entries.length} entries to ${OUT_JSON}`);
process.exitCode = failed ? 1 : 0;
