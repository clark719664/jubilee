/**
 * Santa Mission Control: the dark, glowing flight panel on the World page. It is built once;
 * each refresh (once a second, a few times a second during the practice flight) only touches
 * the text, gauges and lists that changed. Everything comes from the clock the Santa tracker
 * runs on, so the practice flight replays it too. Off-season it stays hidden until then.
 *
 *   const mission = santaMission(deps);   host.append(mission.el);   mission.refresh();   mission.destroy();
 */
import './santa-mission.css';
import type { CivilDate } from '../dates/civil';
import type { MotionMode } from '../effects/types';
import { fill as fillText, list as listOf, plural, t as translate } from '../i18n/index';
import { WORLD_COPY, WORLD_COUNTS, durationClock, durationWords, wfmt } from '../world/copy';
import { CITIES, cityById, type City } from '../world/data/cities';
import {
  CRUISE_FT, REINDEER, TREAT_KEYS, comingUp, dialScale, flightLog, flightReport, homeInfo, liveStats, missionStage, preflight,
  reindeerRoster, treatsStorage, type MissionStage, type TreatKey, type Treats,
} from '../world/mission';
import { homeCityId, inSantaSeason, santaPosition, santaStatus } from '../world/santa';
import { santaWhere } from '../world/trackers';
import { cityForZone, formatClock, localDate } from '../world/zones';
import { h, svg } from './dom';

export interface MissionDeps {
  /** The clock the Santa tracker runs on: real time, or the practice flight's. */
  readonly clock: () => Date;
  readonly showing: () => boolean;
  /** The real device date: December decides whether the panel shows off the flight. */
  readonly today: () => CivilDate;
  readonly zone: string;
  readonly locale: string;
  readonly motion: MotionMode;
  readonly name?: string;
  readonly pretending: boolean;
  /** Turn the globe to the sleigh. */
  readonly onFind: (lon: number, lat: number) => void;
  /** Show the viewer's city on the globe. */
  readonly onHouse: (city: City) => void;
  /** Keep the camera on the sleigh (or let go). */
  readonly onFollow: (on: boolean) => void;
}

export interface SantaMission {
  readonly el: HTMLElement;
  refresh(): void;
  setMotion(motion: MotionMode): void;
  destroy(): void;
}

const CX = 120;
const CY = 112;
const R = 88;
const SWEEP_DEG = 270;
const START_DEG = -135;
/** In the practice flight, panel updates are held to twice a second. */
const SHOW_REFRESH_MS = 500;
const PRINT_CLEANUP_MS = 60_000;

let uid = 0;

const pt = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [+(CX + r * Math.sin(a)).toFixed(2), +(CY - r * Math.cos(a)).toFixed(2)];
};

function arc(r: number, from = START_DEG, to = START_DEG + SWEEP_DEG): string {
  const [x1, y1] = pt(from, r);
  const [x2, y2] = pt(to, r);
  return `M${x1} ${y1} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

function setText(el: Element, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

function formats(locale: string): { n: Intl.NumberFormat; big: Intl.NumberFormat } {
  try {
    return { n: new Intl.NumberFormat(locale), big: new Intl.NumberFormat(locale, { notation: 'compact', compactDisplay: 'long', maximumFractionDigits: 1 }) };
  } catch {
    return { n: new Intl.NumberFormat('en-US'), big: new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'long', maximumFractionDigits: 1 }) };
  }
}

interface Tile { readonly el: HTMLElement; readonly value: HTMLElement; readonly sub: HTMLElement }

function tile(icon: string, label: string, extra = ''): Tile {
  const value = h('b', { class: 'mc-value' });
  const sub = h('span', { class: 'mc-sub' });
  const el = h('div', { class: `mc-tile${extra ? ` ${extra}` : ''}` },
    h('span', { class: 'mc-label' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, icon), label),
    value, sub);
  return { el, value, sub };
}

export function santaMission(deps: MissionDeps): SantaMission {
  const { zone, locale } = deps;
  const { n: nf, big } = formats(locale);
  const id = `mc${++uid}`;
  let motion = deps.motion;
  let scaleKey = '';
  let lastDraw = -Infinity;
  let following = false;
  let printTimer = 0;
  let printSheet: HTMLElement | null = null;
  let cleanPrint: (() => void) | null = null;
  const lastCache = { needle: '', fill: '', aria: '' };
  const real = treatsStorage(deps.pretending);
  const practice = treatsStorage(true);
  const treatsFor = () => (deps.showing() ? practice : real);
  const homeFor = (year: number, t: Date): City => cityById(homeCityId(zone, year)) ?? cityForZone(zone, t);

  // ── header ──
  const light = h('span', { class: 'mc-light', 'aria-hidden': 'true' });
  const stageText = h('span', { class: 'mc-stage' });
  const whereText = h('p', { class: 'mc-where' });
  const head = h('header', { class: 'mc-head' },
    light,
    h('div', { class: 'mc-head-text' }, h('h2', { class: 'mc-title' }, WORLD_COPY.missionTitle), stageText),
    h('span', { class: 'mc-sleigh emoji', 'aria-hidden': 'true' }, '🛷'));

  // ── speedometer ──
  const ticks = svg('g', { class: 'mc-ticks' });
  const needle = svg('g', { class: 'mc-needle' },
    svg('polygon', { points: `${CX},${CY - R + 8} ${CX + 4.5},${CY} ${CX - 4.5},${CY}`, class: 'mc-needle-blade' }),
    svg('circle', { cx: CX, cy: CY, r: 3, class: 'mc-needle-dot' }));
  const fill = svg('path', { d: arc(R), pathLength: 100, class: 'mc-arc-fill', stroke: `url(#${id}-g)` });
  const dial = svg('svg', { class: 'mc-dial-svg', viewBox: '0 0 240 190', role: 'img', focusable: 'false' },
    svg('defs', {},
      svg('linearGradient', { id: `${id}-g`, gradientUnits: 'userSpaceOnUse', x1: 30, y1: 0, x2: 210, y2: 0 },
        svg('stop', { offset: '0', 'stop-color': '#4ee1ff' }),
        svg('stop', { offset: '.55', 'stop-color': '#5dffb0' }),
        svg('stop', { offset: '.85', 'stop-color': '#ffc857' }),
        svg('stop', { offset: '1', 'stop-color': '#ff6bd6' })),
      svg('radialGradient', { id: `${id}-b`, cx: '50%', cy: '58%', r: '55%' },
        svg('stop', { offset: '0', 'stop-color': '#1b2a6b' }),
        svg('stop', { offset: '1', 'stop-color': '#070b24' })),
      svg('linearGradient', { id: `${id}-s`, gradientUnits: 'userSpaceOnUse', x1: CX, y1: CY, x2: pt(32, 80)[0], y2: pt(32, 80)[1] },
        svg('stop', { offset: '0', 'stop-color': '#4ee1ff', 'stop-opacity': '0' }),
        svg('stop', { offset: '1', 'stop-color': '#4ee1ff', 'stop-opacity': '.34' }))),
    svg('circle', { cx: CX, cy: CY, r: R + 14, fill: `url(#${id}-b)`, class: 'mc-dial-bg' }),
    svg('circle', { cx: CX, cy: CY, r: R + 14, class: 'mc-dial-rim' }),
    svg('circle', { cx: CX, cy: CY, r: 58, class: 'mc-dial-guide' }),
    svg('circle', { cx: CX, cy: CY, r: 30, class: 'mc-dial-guide' }),
    svg('path', { d: `M${CX} ${CY} L${pt(0, 80)[0]} ${pt(0, 80)[1]} A80 80 0 0 1 ${pt(32, 80)[0]} ${pt(32, 80)[1]} Z`, fill: `url(#${id}-s)`, class: 'mc-sweep' }),
    svg('path', { d: arc(R), class: 'mc-arc-track', pathLength: 100 }),
    fill, ticks, needle,
    svg('circle', { cx: CX, cy: CY, r: 8, class: 'mc-hub' }));
  const kmhValue = h('b', { class: 'mc-kmh' });
  const mphValue = h('span', { class: 'mc-mph' });
  const dialBox = h('div', { class: 'mc-dial' }, dial,
    h('div', { class: 'mc-read' }, kmhValue, h('span', { class: 'mc-unit' }, WORLD_COPY.missionKmh), mphValue));

  function drawScale(max: number, step: number): void {
    const key = `${max}|${step}`;
    if (key === scaleKey) return;
    scaleKey = key;
    const majors = Math.round(max / step);
    const parts: SVGElement[] = [];
    for (let i = 0; i <= majors * 5; i++) {
      const major = i % 5 === 0;
      const deg = START_DEG + (SWEEP_DEG * i) / (majors * 5);
      const [x1, y1] = pt(deg, R - (major ? 10 : 5));
      const [x2, y2] = pt(deg, R + 1);
      parts.push(svg('line', { x1, y1, x2, y2, class: major ? 'mc-tick is-major' : 'mc-tick' }));
      if (major) {
        const [tx, ty] = pt(deg, R - 21);
        const v = (i / 5) * step;
        parts.push(svg('text', { x: tx, y: ty + 3, class: 'mc-tick-label', 'text-anchor': 'middle' }, v === 0 ? '0' : v >= 1000 ? `${v / 1000}k` : String(v)));
      }
    }
    ticks.replaceChildren(...parts);
  }

  // ── gauge tiles ──
  const altitude = tile('☁️', WORLD_COPY.missionAltitude, 'is-long');
  const cruise = h('span', { class: 'mc-sub mc-sub-soft' }, wfmt('missionCruise', { lo: nf.format(CRUISE_FT.min), hi: nf.format(CRUISE_FT.max) }));
  altitude.el.append(cruise);
  const distance = tile('🧭', WORLD_COPY.missionDistance, 'is-long');
  const stops = tile('📍', WORLD_COPY.missionStops);
  const presents = tile('🎁', WORLD_COPY.missionPresents, 'is-wide');
  const bagBar = h('i', { class: 'mc-bar-fill' });
  const bagText = h('span', { class: 'mc-sub' });
  presents.el.append(h('div', { class: 'mc-bar', 'aria-hidden': 'true' }, bagBar), bagText);
  const cookies = tile('🍪', WORLD_COPY.missionCookies);
  const carrots = tile('🥕', WORLD_COPY.missionCarrots);
  const zones = tile('🌐', WORLD_COPY.missionZones);
  for (const t of [cookies, carrots]) setText(t.sub, WORLD_COPY.missionGuess);
  const tiles = h('div', { class: 'mc-tiles' }, altitude.el, distance.el, stops.el, zones.el, presents.el, cookies.el, carrots.el);

  // ── buttons ──
  const followButton = h('button', { type: 'button', class: 'mc-btn', 'aria-pressed': 'false', onclick: () => setFollow(!following) },
    h('span', { class: 'emoji', 'aria-hidden': 'true' }, '🎯'), h('span', { class: 'mc-btn-text' }, WORLD_COPY.missionFollow));
  const findButton = h('button', { type: 'button', class: 'mc-btn', onclick: () => { const p = santaPosition(current().route, current().t); deps.onFind(p.lon, Math.min(p.lat, 62)); } },
    h('span', { class: 'emoji', 'aria-hidden': 'true' }, '🛷'), h('span', { class: 'mc-btn-text' }, WORLD_COPY.missionFind));
  const houseButton = h('button', { type: 'button', class: 'mc-btn', onclick: () => deps.onHouse(current().home) },
    h('span', { class: 'emoji', 'aria-hidden': 'true' }, '🏠'), h('span', { class: 'mc-btn-text' }, WORLD_COPY.missionHouse));
  const actions = h('div', { class: 'mc-actions' }, findButton, houseButton, followButton);

  function setFollow(on: boolean): void {
    following = on;
    followButton.setAttribute('aria-pressed', String(on));
    setText(followButton.querySelector('.mc-btn-text')!, on ? WORLD_COPY.missionFollowing : WORLD_COPY.missionFollow);
    deps.onFollow(on);
  }

  // ── distance to your house ──
  const homeLabel = h('h3', { class: 'mc-h' }, WORLD_COPY.missionHome);
  const homeBig = h('p', { class: 'mc-home-big' });
  const homeEta = h('p', { class: 'mc-home-eta' });
  const bedtime = h('div', { class: 'mc-bedtime', role: 'status', hidden: true },
    h('span', { class: 'emoji', 'aria-hidden': 'true' }, '🌙'),
    h('div', {}, h('b', {}, WORLD_COPY.missionBedtime), h('span', {})));
  const bedtimeText = bedtime.querySelector('span:last-child')!;
  const homeBox = h('section', { class: 'mc-block mc-home' }, homeLabel, homeBig, homeEta, bedtime);

  // ── before takeoff ──
  const countdown = h('p', { class: 'mc-countdown' });
  const jobsDone = h('p', { class: 'mc-sub' });
  const jobList = h('ul', { class: 'mc-jobs' });
  let jobsKey = -1;
  const preBox = h('section', { class: 'mc-block mc-pre' },
    h('h3', { class: 'mc-h' }, WORLD_COPY.missionTakeoff), countdown,
    h('h3', { class: 'mc-h' }, WORLD_COPY.missionPreflight), jobsDone, jobList);

  // ── after landing ──
  const reportBody = h('div', { class: 'mc-report-body' });
  const printButton = h('button', { type: 'button', class: 'mc-btn', onclick: () => printReport() },
    h('span', { class: 'emoji', 'aria-hidden': 'true' }, '🖨️'), h('span', { class: 'mc-btn-text' }, WORLD_COPY.missionPrint));
  const reportBox = h('section', { class: 'mc-block mc-report' },
    h('h3', { class: 'mc-h' }, WORLD_COPY.missionReport), reportBody, printButton);
  let reportKey = '';

  // ── flight log, coming up ──
  const logList = h('ol', { class: 'mc-list' });
  const logEmpty = h('p', { class: 'mc-sub' }, WORLD_COPY.missionLogEmpty);
  const nextList = h('ol', { class: 'mc-list' });
  const nextEmpty = h('p', { class: 'mc-sub' }, WORLD_COPY.missionNextEmpty);
  let logKey = '';
  let nextKey = '';
  let nextEtas: HTMLElement[] = [];
  const lists = h('div', { class: 'mc-cols' },
    h('section', { class: 'mc-block' }, h('h3', { class: 'mc-h' }, WORLD_COPY.missionLog), logList, logEmpty, h('p', { class: 'mc-fine' }, WORLD_COPY.missionLogTime)),
    h('section', { class: 'mc-block' }, h('h3', { class: 'mc-h' }, WORLD_COPY.missionNext), nextList, nextEmpty));

  // ── reindeer ──
  const deer = REINDEER.map((name) => {
    const mood = h('span', { class: 'mc-deer-mood' });
    const badge = h('span', { class: 'mc-deer-lead', hidden: true }, WORLD_COPY.missionLead);
    const li = h('li', { class: 'mc-deer' },
      h('span', { class: 'mc-deer-icon emoji', 'aria-hidden': 'true' }, '🦌'),
      h('span', { class: 'mc-deer-text' }, h('b', { class: 'mc-deer-name' }, name), mood), badge);
    return { li, mood, badge };
  });
  const deerList = h('ul', { class: 'mc-deer-list' }, ...deer.map((d) => d.li));
  const deerBox = h('section', { class: 'mc-block' }, h('h3', { class: 'mc-h' }, WORLD_COPY.missionReindeer), deerList);
  let deerDrawn = 0;

  // ── treats ──
  const TREAT_WORDS: Record<TreatKey, string> = { cookies: 'cookies', milk: 'milk', carrots: 'carrots' };
  const treatLabels: Record<TreatKey, readonly [string, string]> = {
    cookies: ['🍪', WORLD_COPY.missionCookiesTreat],
    milk: ['🥛', WORLD_COPY.missionMilkTreat],
    carrots: ['🥕', WORLD_COPY.missionCarrotsTreat],
  };
  const treatButtons = TREAT_KEYS.map((key) => {
    const b = h('button', { type: 'button', class: 'mc-treat', 'aria-pressed': 'false', onclick: () => onTreat(key) },
      h('span', { class: 'mc-treat-icon emoji', 'aria-hidden': 'true' }, treatLabels[key][0]), h('span', {}, treatLabels[key][1]));
    return [key, b] as const;
  });
  const treatNote = h('p', { class: 'mc-treat-note', role: 'status' });
  const treatsBox = h('section', { class: 'mc-block mc-treats' },
    h('h3', { class: 'mc-h' }, WORLD_COPY.missionTreats), h('p', { class: 'mc-sub' }, WORLD_COPY.missionTreatsHelp),
    h('div', { class: 'mc-treat-row' }, ...treatButtons.map(([, b]) => b)), treatNote);

  function onTreat(key: TreatKey): void {
    const { route, visited } = current();
    if (visited) return;
    const store = treatsFor();
    store.set(route.year, key, !store.read(route.year)[key]);
    refresh(true);
  }

  const el = h('section', { class: 'mc', 'aria-label': WORLD_COPY.missionAria, hidden: true },
    head, whereText,
    h('div', { class: 'mc-board' }, dialBox, tiles),
    actions, homeBox, preBox, reportBox, lists, deerBox, treatsBox);
  el.dataset['stage'] = 'pre';
  el.classList.toggle('is-animated', motion === 'full');

  // ── the latest numbers, for the buttons ──
  let latest: { route: ReturnType<typeof santaStatus>['route']; t: number; home: City; visited: boolean } | null = null;
  function current(): NonNullable<typeof latest> {
    if (!latest) {
      const now = deps.clock();
      const route = santaStatus(now, CITIES, zone).route;
      latest = { route, t: now.getTime(), home: homeFor(route.year, now), visited: false };
    }
    return latest;
  }

  function stageWords(stage: MissionStage): string {
    return stage === 'pre' ? WORLD_COPY.missionStagePre : stage === 'flying' ? WORLD_COPY.missionStageFlying : WORLD_COPY.missionStageLanded;
  }

  function reportNode(name: string | undefined, city: City, report: ReturnType<typeof flightReport>): HTMLElement {
    const row = (label: string, value: string): HTMLElement => h('div', { class: 'mc-rep-row' }, h('dt', {}, label), h('dd', {}, value));
    return h('div', { class: 'mc-rep' },
      name ? h('p', { class: 'mc-rep-name' }, wfmt('missionReportFor', { name })) : null,
      h('dl', { class: 'mc-rep-list' },
        row(WORLD_COPY.missionRepDistance, `${nf.format(report.distanceKm)} km (${plural(report.distanceMi, WORLD_COUNTS.missionMiles, { n: nf.format(report.distanceMi) })})`),
        row(WORLD_COPY.missionRepStops, nf.format(report.stops)),
        row(WORLD_COPY.missionRepPresents, nf.format(report.presents)),
        row(WORLD_COPY.missionRepTop, `${nf.format(report.topKmh)} ${translate(WORLD_COPY.missionKmh)} (${translate(fillText('{n} mph', { n: nf.format(report.topMph) }))})`),
        row(WORLD_COPY.missionRepTime, durationWords(report.flightMs))),
      report.homeAt === null ? null : h('p', { class: 'mc-rep-home' }, wfmt('missionRepHome', { city: city.name, time: formatClock(city.tz, new Date(report.homeAt), locale) })),
      h('p', { class: 'mc-rep-thanks' }, `🎄 ${WORLD_COPY.missionRepThanks}`));
  }

  function printReport(): void {
    const { route, home } = current();
    printSheet?.remove();
    window.clearTimeout(printTimer);
    const sheet = h('div', { class: 'santa-print' },
      h('h1', {}, `🎅 ${WORLD_COPY.missionReport}`),
      reportNode(deps.name, home, flightReport(route, home)));
    printSheet = sheet;
    document.body.append(sheet);
    document.body.classList.add('is-printing-santa');
    const clean = (): void => {
      window.removeEventListener('afterprint', clean);
      window.clearTimeout(printTimer);
      sheet.remove();
      if (printSheet === sheet) printSheet = null;
      document.body.classList.remove('is-printing-santa');
    };
    cleanPrint = clean;
    window.addEventListener('afterprint', clean);
    printTimer = window.setTimeout(clean, PRINT_CLEANUP_MS);
    window.print();
  }

  function paintDial(kmh: number, max: number): void {
    const frac = Math.min(1, kmh / max);
    const needleCss = `rotate(${(START_DEG + SWEEP_DEG * frac).toFixed(1)}deg)`;
    if (needleCss !== lastCache.needle) { lastCache.needle = needleCss; needle.style.transform = needleCss; }
    const dash = `${(frac * 100).toFixed(1)} 100`;
    if (dash !== lastCache.fill) { lastCache.fill = dash; fill.style.strokeDasharray = dash; }
    const aria = plural(Math.round(kmh), WORLD_COUNTS.missionDialAria, { kmh: nf.format(kmh) });
    if (aria !== lastCache.aria) { lastCache.aria = aria; dial.setAttribute('aria-label', aria); }
  }

  function treatState(year: number, visited: boolean): void {
    const treats: Treats = treatsFor().read(year);
    for (const [key, b] of treatButtons) {
      const on = treats[key];
      if (b.getAttribute('aria-pressed') !== String(on)) b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('is-locked', visited);
      b.setAttribute('aria-disabled', String(visited));
    }
    const given = TREAT_KEYS.filter((k) => treats[k]).map((k) => TREAT_WORDS[k]);
    const list = listOf(given);
    setText(treatNote, visited ? (given.length > 0 ? wfmt('missionTreatsAte', { list }) : WORLD_COPY.missionTreatsNone) : given.length > 0 ? WORLD_COPY.missionTreatsWait : '');
    treatNote.hidden = treatNote.textContent === '';
  }

  function refresh(force = false): void {
    const nowDate = deps.clock();
    const showing = deps.showing();
    const perf = performance.now();
    if (showing && !force && perf - lastDraw < SHOW_REFRESH_MS) return;
    const status = santaStatus(nowDate, CITIES, zone);
    const route = status.route;
    const t = nowDate.getTime();
    const stage = missionStage(route, t);
    const visible = showing || stage === 'flying' || inSantaSeason(deps.today());
    el.hidden = !visible;
    if (!visible) return;
    lastDraw = perf;

    const home = homeFor(route.year, nowDate);
    const stats = liveStats(route, status, t);
    const info = homeInfo(route, status, t, home);
    latest = { route, t, home, visited: info.stage === 'visited' };

    if (el.dataset['stage'] !== stage) el.dataset['stage'] = stage;
    for (const [box, on] of [[preBox, stage === 'pre'], [reportBox, stage === 'landed']] as const) if (box.hidden === on) box.hidden = !on;
    setText(stageText, stageWords(stage));
    setText(whereText, stage === 'flying' ? (santaWhere(status) === 'over the sea' && status.from.city ? wfmt('santaJustLeft', { city: status.from.city.name }) : santaWhere(status).replace(/^./, (c) => c.toUpperCase())) : '');
    whereText.hidden = stage !== 'flying';

    // dial and tiles
    const { max, step } = dialScale(stats.dialMaxKmh);
    drawScale(max, step);
    paintDial(stats.speedKmh, max);
    setText(kmhValue, nf.format(stats.speedKmh));
    setText(mphValue, wfmt('missionMph', { mph: nf.format(stats.speedMph) }));
    setText(altitude.value, wfmt('missionFt', { n: nf.format(stats.altitudeFt) }));
    setText(altitude.sub, plural(stats.altitudeM, WORLD_COUNTS.missionAltitudeSub, { m: nf.format(stats.altitudeM) }));
    setText(distance.value, wfmt('missionDistanceSub', { km: nf.format(stats.distanceKm) }));
    setText(distance.sub, plural(stats.distanceMi, WORLD_COUNTS.missionMiles, { n: nf.format(stats.distanceMi) }));
    setText(stops.value, wfmt('missionStopsOf', { done: nf.format(stats.stopsDone), total: nf.format(stats.stopsTotal) }));
    setText(presents.value, big.format(stats.presents));
    setText(bagText, wfmt('missionBagLeft', { pct: stats.percentLeft }));
    const bag = `${(stats.bagLeft * 100).toFixed(1)}%`;
    if (bagBar.style.width !== bag) bagBar.style.width = bag;
    setText(cookies.value, nf.format(stats.cookies));
    setText(carrots.value, nf.format(stats.carrots));
    setText(zones.value, nf.format(stats.zonesCrossed));

    // distance to your house
    const place = deps.name ? wfmt('missionHomeName', { name: deps.name }) : WORLD_COPY.missionHome;
    setText(homeLabel, place);
    setText(homeBig, plural(info.distanceMi, WORLD_COUNTS.missionAway, { km: nf.format(info.distanceKm), mi: nf.format(info.distanceMi) }));
    const arrival = info.at === null ? '' : formatClock(home.tz, new Date(info.at), locale);
    setText(homeEta, info.stage === 'visited' ? wfmt('missionHomeVisited', { city: home.name, time: arrival }) : info.at === null ? '' : wfmt('missionHomeEta', { city: home.name, time: durationWords(info.etaMs) }));
    const close = info.stage === 'close' && stage === 'flying';
    bedtime.hidden = !close;
    if (close) setText(bedtimeText, wfmt('missionBedtimeText', { time: durationWords(info.etaMs) }));
    el.classList.toggle('is-close', close);

    // before takeoff
    if (stage === 'pre') {
      const ms = route.departs - t;
      setText(countdown, ms > 2 * 86_400_000 ? durationWords(ms) : durationClock(ms));
      const list = preflight(showing ? localDate(zone, nowDate) : deps.today());
      if (list.done !== jobsKey) {
        jobsKey = list.done;
        setText(jobsDone, plural(list.jobs.length, WORLD_COUNTS.missionPreflightDone, { n: list.done, total: list.jobs.length }));
        jobList.replaceChildren(...list.jobs.map((j) => h('li', { class: j.done ? 'is-done' : '' },
          h('label', {}, h('input', { type: 'checkbox', checked: j.done, disabled: true }), h('span', {}, j.text)))));
      }
    }

    // after landing
    if (stage === 'landed') {
      const key = `${route.year}|${home.id}|${deps.name ?? ''}`;
      if (key !== reportKey) {
        reportKey = key;
        reportBody.replaceChildren(reportNode(deps.name, home, flightReport(route, home)));
      }
    }

    // flight log and coming up
    const log = flightLog(route, t, locale);
    const lk = log.map((e) => e.city.id).join();
    if (lk !== logKey) {
      logKey = lk;
      logList.replaceChildren(...log.map((e) => h('li', {},
        h('span', { class: 'mc-flag emoji', 'aria-hidden': 'true' }, e.city.emoji ?? '📍'),
        h('span', { class: 'mc-city' }, e.city.name), h('span', { class: 'mc-when' }, e.time))));
      logEmpty.hidden = log.length > 0;
    }
    const next = comingUp(route, t, locale);
    const nk = next.map((e) => e.city.id).join();
    if (nk !== nextKey) {
      nextKey = nk;
      nextEtas = next.map(() => h('span', { class: 'mc-when' }));
      nextList.replaceChildren(...next.map((e, i) => h('li', { class: i === 0 ? 'is-next' : '' },
        h('span', { class: 'mc-flag emoji', 'aria-hidden': 'true' }, e.city.emoji ?? '📍'),
        h('span', { class: 'mc-city' }, e.city.name), nextEtas[i]!)));
      nextEmpty.hidden = next.length > 0;
    }
    next.forEach((e, i) => { const n = nextEtas[i]; if (n) setText(n, fillText(translate(WORLD_COPY.missionEta), { time: durationWords(e.etaMs) })); });

    // reindeer: moods change by leg, so hold the roster to once a second
    if (force || perf - deerDrawn >= 1000 || deerDrawn === 0) {
      deerDrawn = perf;
      reindeerRoster(route, t).forEach((r, i) => {
        const d = deer[i]!;
        setText(d.mood, r.mood);
        d.badge.hidden = !r.lead;
        d.li.classList.toggle('is-lead', r.lead);
      });
    }

    treatState(route.year, info.stage === 'visited');
  }

  return {
    el,
    refresh: () => refresh(),
    setMotion(m): void {
      motion = m;
      el.classList.toggle('is-animated', m === 'full');
    },
    destroy(): void {
      cleanPrint?.();
      if (following) deps.onFollow(false);
    },
  };
}
