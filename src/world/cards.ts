/**
 * The World view's tracker cards as DOM: ☀️ day and night, 🌙 moon tonight, 🎆 the New Year
 * wave, 🎅 Santa and 🌍 right now around the world. Each card is built once and its text
 * nodes are refreshed once a second from the plain data in trackers.ts.
 *
 * Visibility: day/night, moon and "right now" always show. The wave card is live from 26
 * December to January 2 and during its pretend show; Santa is live 1–December 26, while he
 * flies, and during the replay. Outside their seasons both shrink to a teaser with the show
 * button and move to the end of the grid. While a show (or a real flight or wave) is on, a
 * one-line summary is also offered for the heads-up panel on the globe (`hud()`).
 */
import { t } from '../i18n/index';
import { formatShort, type CivilDate } from '../dates/civil';
import { COPY } from '../ui/copy';
import { h } from '../ui/dom';
import { WORLD_COPY, durationClock, durationWords, wfmt } from './copy';
import { CITIES, type City } from './data/cities';
import { inNewYearWindow, newYearTarget } from './midnight';
import { drawMoon } from './moon-draw';
import { inSantaSeason } from './santa';
import { SLEIGH_H, SLEIGH_W, paintSleigh } from './sleigh-draw';
import { celebratingNowCard, midnightCard, moonCard, santaCard, sunCard, type HolidaysOn, type LunarHint, type NowRow, type WorldHoliday } from './trackers';
import { formatClock, localClock, localDate } from './zones';

export interface CardDeps {
  readonly now: () => Date;
  readonly today: () => CivilDate;
  readonly locale: string;
  readonly name?: string;
}

export interface CardsOptions {
  readonly deps: CardDeps;
  readonly zone: string;
  readonly holidaysOn: HolidaysOn;
  readonly isBig: (id: string) => boolean;
  /** The clock a tracker runs on: real time, or its pretend show's. */
  readonly clock: (kind: 'wave' | 'santa') => Date;
  readonly showing: (kind: 'wave' | 'santa') => boolean;
  readonly onToggleShow: (kind: 'wave' | 'santa') => void;
  readonly onNight: (on: boolean) => void;
  readonly onCity: (city: City) => void;
  readonly lunarHint: () => LunarHint | null;
  /** Illustrated sleigh for the Santa card, if the art exists. */
  readonly sleighArt?: string | null;
  /** The postcard album: how many cards each tracker has sent, and opening it. */
  readonly album?: { readonly count: (kind: 'wave' | 'santa') => number; readonly open: (kind: 'wave' | 'santa') => void; readonly label: (n: number) => string; readonly aria: string };
}

/** What the globe's heads-up panel says about a running show or live tracker. */
export interface Hud {
  readonly kind: 'wave' | 'santa';
  readonly emoji: string;
  readonly title: string;
  readonly line: string;
  readonly show: boolean;
}

export interface TrackerCards {
  readonly grid: HTMLElement;
  /** The "show the night side" switch. */
  readonly night: boolean;
  /** Once a second. */
  refresh(): void;
  /** On a new day: seasonal cards first, the moon redrawn. */
  reorder(): void;
  /** A postcard went into the album: update the Album buttons' counts. */
  refreshAlbum(): void;
  /** The summary for the globe's heads-up panel, or null when nothing is live. */
  hud(): Hud | null;
  /** One line about the sleigh for the globe's bubble. */
  santaLine(): string;
  /** "over Japan" for the canvas label. */
  santaWhere(): string;
  /** "It's 9:41 PM on Thursday · 🍕 Pizza Day" for a city. */
  cityLine(city: City): string;
}

interface Card { readonly el: HTMLElement; readonly status: HTMLElement; readonly body: HTMLElement }

function card(lead: string | Node, title: string, extra = ''): Card {
  const status = h('p', { class: 'tracker-status' });
  const body = h('div', { class: 'tracker-lines' });
  const icon = typeof lead === 'string' ? h('span', { class: 'tracker-emoji emoji', 'aria-hidden': 'true' }, lead) : lead;
  const el = h('article', { class: `tracker-card is-rich${extra ? ` ${extra}` : ''}`, 'aria-label': title },
    h('div', { class: 'tracker-head' }, icon, h('h3', { class: 'tracker-title' }, title)),
    status,
    body);
  return { el, status, body };
}

function setText(el: HTMLElement, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

function holidayText(list: readonly WorldHoliday[]): string {
  return list.map((x) => `${x.emoji} ${t(x.name)}`).join(', ');
}

/** The Santa card's picture: the illustrated sleigh if there is one, else the vector sprite. */
function sleighPicture(art: string | null | undefined): HTMLElement {
  if (art) return h('img', { class: 'tracker-sleigh', src: art, alt: '', width: 120, height: 56 });
  const c = h('canvas', { class: 'tracker-sleigh', width: 240, height: 112, 'aria-hidden': 'true' });
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.setTransform(240 / SLEIGH_W, 0, 0, 112 / SLEIGH_H, 0, 0);
    paintSleigh(ctx);
  }
  return c;
}

export function trackerCards(o: CardsOptions): TrackerCards {
  const { deps, zone } = o;
  let night = true;
  const weekday = new Intl.DateTimeFormat(deps.locale, { weekday: 'long' });
  const dayName = (c: CivilDate): string => weekday.format(new Date(c.y, c.m - 1, c.d, 12));

  // ── ☀️ day and night ──
  const sun = card('☀️', WORLD_COPY.sunTitle);
  const nightBox = h('input', { type: 'checkbox', checked: true, onchange: () => { night = nightBox.checked; o.onNight(night); } });
  sun.body.append(h('label', { class: 'switch' }, nightBox, WORLD_COPY.nightToggle));

  // ── 🌙 moon tonight ──
  const moonCanvas = h('canvas', { class: 'tracker-moon', role: 'img', width: 192, height: 192 });
  const moon = card(moonCanvas, WORLD_COPY.moonTitle, 'is-moon');
  const moonHint = h('p', { class: 'tracker-hint' });
  moon.body.append(moonHint);
  let moonDrawnAt = 0;

  // ── 🎆 the New Year wave ──
  const wave = card('🎆', COPY['world.newYear']);
  const waveYour = h('p', { class: 'tracker-big' });
  const waveJust = h('p', { class: 'tracker-cheer' });
  const waveSub = h('h4', { class: 'tracker-sub' }, WORLD_COPY.waveNext);
  const waveList = h('ol', { class: 'tracker-list' });
  const waveButton = h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => o.onToggleShow('wave') });
  const albumButton = (kind: 'wave' | 'santa'): HTMLButtonElement | null => (o.album
    ? h('button', { type: 'button', class: 'btn btn-secondary tracker-album', 'aria-label': o.album.aria, onclick: () => o.album?.open(kind) }, o.album.label(0))
    : null);
  const waveAlbum = albumButton('wave');
  wave.body.append(waveYour, waveJust, waveSub, waveList, h('div', { class: 'tracker-actions' }, waveButton, waveAlbum));
  let waveHud: Hud | null = null;

  // ── 🎅 Santa ──
  const santa = card(sleighPicture(o.sleighArt), COPY['world.santa'], 'is-santa');
  const santaPresents = h('p', { class: 'tracker-presents' });
  const santaLines = h('ul', { class: 'tracker-bullets' });
  const santaButton = h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => o.onToggleShow('santa') });
  const santaAlbum = albumButton('santa');
  santa.body.append(santaPresents, santaLines, h('div', { class: 'tracker-actions' }, santaButton, santaAlbum));
  let lastSanta = '';
  let lastWhere = 'at the North Pole';
  let santaHud: Hud | null = null;

  // ── 🌍 right now ──
  const nowCard = card('🌍', WORLD_COPY.nowTitle, 'is-wide');
  const cityGrid = h('ul', { class: 'city-grid' });
  nowCard.body.append(cityGrid);
  const rows = new Map<string, { time: HTMLElement; when: HTMLElement; hols: HTMLElement; key: string }>();

  const grid = h('div', { class: 'tracker-grid' });

  function refreshSun(now: Date): void {
    const s = sunCard(now, CITIES);
    setText(sun.status, s.detail || s.status);
  }

  function refreshMoon(now: Date): void {
    const m = moonCard(now, o.lunarHint());
    setText(moon.status, m.status);
    setText(moonHint, m.hint ?? '');
    moonHint.hidden = !m.hint;
    moonCanvas.setAttribute('aria-label', m.status);
    const ctx = moonCanvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      ctx.clearRect(0, 0, 96, 96);
      drawMoon(ctx, 48, 48, 33, m.phase.fraction, m.waxing);
    }
    moonDrawnAt = now.getTime();
  }

  function refreshWave(today: CivilDate): void {
    const showing = o.showing('wave');
    const live = showing || inNewYearWindow(today);
    wave.el.classList.toggle('is-off', !live);
    wave.el.classList.toggle('is-live', live);
    setText(waveButton, showing ? WORLD_COPY.waveShowStop : WORLD_COPY.waveShow);
    for (const el of [waveYour, waveJust, waveSub, waveList]) el.hidden = !live;
    if (!live) { setText(wave.status, ''); waveHud = null; return; }
    const now = o.clock('wave');
    const c = midnightCard(now, CITIES, zone, newYearTarget(today), deps.name);
    setText(wave.status, c.status);
    setText(waveYour, c.yourText);
    const just = c.latest && now.getTime() - c.latest.at.getTime() < 15 * 60_000
      ? wfmt('waveJustNow', { city: `${c.latest.city.name} ${c.latest.city.emoji ?? ''}`.trim() })
      : '';
    setText(waveJust, just);
    waveJust.hidden = !just;
    waveSub.hidden = c.next.length === 0;
    waveList.replaceChildren(...c.next.map((a, i) => h('li', { class: i === 0 ? 'is-next' : '' },
      h('span', {}, `${a.city.emoji ?? '📍'} ${a.city.name}`),
      h('span', { class: 'tracker-count' }, durationClock(a.msUntil)))));
    const first = c.next[0];
    waveHud = {
      kind: 'wave', emoji: '🎆', title: c.status, show: showing,
      line: just || (first ? wfmt('waveMidnightNext', { city: first.city.name, time: first.msUntil > 86_400_000 ? durationWords(first.msUntil) : durationClock(first.msUntil) }) : c.yourText),
    };
  }

  function refreshSanta(today: CivilDate): void {
    const showing = o.showing('santa');
    const now = o.clock('santa');
    const c = santaCard(now, CITIES, zone, showing ? localDate(zone, now) : today, deps.name);
    const live = showing || inSantaSeason(today) || c.status.phase === 'flying';
    santa.el.classList.toggle('is-off', !live);
    santa.el.classList.toggle('is-live', c.status.phase === 'flying');
    setText(santa.status, c.headline);
    setText(santaPresents, c.presents ?? '');
    santaPresents.hidden = !c.presents;
    const key = c.lines.join('|');
    if (key !== lastSanta) {
      lastSanta = key;
      santaLines.replaceChildren(...c.lines.map((l) => h('li', {}, l)));
    }
    setText(santaButton, showing ? WORLD_COPY.santaReplayStop : WORLD_COPY.santaReplay);
    lastWhere = c.where;
    santaHud = c.status.phase === 'flying'
      ? { kind: 'santa', emoji: '🎅', title: c.headline, line: c.presents ?? c.lines[0] ?? '', show: showing }
      : null;
  }

  function cityRow(r: NowRow): HTMLElement {
    const time = h('span', { class: 'city-time' });
    const when = h('span', { class: 'city-when' });
    const hols = h('span', { class: 'city-hols' });
    rows.set(r.city.id, { time, when, hols, key: '' });
    return h('li', {}, h('button', { type: 'button', class: 'city', onclick: () => o.onCity(r.city) },
      h('span', { class: 'city-flag emoji', 'aria-hidden': 'true' }, r.city.emoji ?? '📍'),
      h('span', { class: 'city-name' }, r.city.name), time, when, hols));
  }

  function refreshNow(now: Date, today: CivilDate): void {
    const r = celebratingNowCard(now, CITIES, o.holidaysOn, { locale: deps.locale, today, isBig: o.isBig });
    setText(nowCard.status, r.headline ?? '');
    nowCard.status.hidden = !r.headline;
    if (rows.size === 0) cityGrid.replaceChildren(...r.rows.map(cityRow));
    for (const row of r.rows) {
      const ref = rows.get(row.city.id);
      if (!ref) continue;
      setText(ref.time, `${row.day ? '☀️' : '🌙'} ${row.time}`);
      setText(ref.when, row.shift > 0 ? WORLD_COPY.nowTomorrow : row.shift < 0 ? WORLD_COPY.nowYesterday : '');
      const key = row.holidays.map((x) => x.id).join(',');
      if (key !== ref.key) {
        ref.key = key;
        const shown = row.holidays.slice(0, 3);
        ref.hols.replaceChildren(...shown.map((x) => h('span', { title: x.name }, x.emoji)));
        if (row.holidays.length > shown.length) ref.hols.append(h('span', { class: 'small' }, `+${row.holidays.length - shown.length}`));
        ref.hols.setAttribute('aria-label', row.holidays.length ? holidayText(row.holidays) : WORLD_COPY.nowNothing);
      }
    }
  }

  function reorder(): void {
    const today = deps.today();
    const santaLive = inSantaSeason(today) || o.showing('santa');
    const waveLive = inNewYearWindow(today) || o.showing('wave');
    // Live seasonal cards lead; the grid packs densely, so a lone live card shares its row.
    const order = [
      ...(santaLive ? [santa.el] : []), ...(waveLive ? [wave.el] : []),
      nowCard.el, sun.el, moon.el,
      ...(santaLive ? [] : [santa.el]), ...(waveLive ? [] : [wave.el]),
    ];
    grid.replaceChildren(...order);
    refreshMoon(deps.now());
  }

  function refreshAlbum(): void {
    if (!o.album) return;
    for (const [b, kind] of [[waveAlbum, 'wave'], [santaAlbum, 'santa']] as const) if (b) setText(b, o.album.label(o.album.count(kind)));
  }

  function refresh(): void {
    const now = deps.now();
    const today = deps.today();
    refreshSun(now);
    refreshNow(now, today);
    refreshWave(today);
    refreshSanta(today);
    if (now.getTime() - moonDrawnAt > 10 * 60_000 || now.getTime() < moonDrawnAt) refreshMoon(now);
  }

  reorder();
  refresh();
  refreshAlbum();

  return {
    grid,
    get night() { return night; },
    refresh,
    refreshAlbum,
    reorder,
    hud: () => {
      // A running show wins; then a real flight; then the real wave.
      for (const x of [santaHud, waveHud]) if (x?.show) return x;
      return santaHud ?? waveHud;
    },
    santaLine: () => [santa.status.textContent ?? '', santaPresents.hidden ? '' : santaPresents.textContent ?? ''].filter(Boolean).join(' · '),
    santaWhere: () => lastWhere,
    cityLine(city) {
      const now = deps.now();
      const lc = localClock(city.tz, now);
      const hs = o.holidaysOn({ y: lc.y, m: lc.m, d: lc.d });
      const vars = { time: formatClock(city.tz, now, deps.locale), day: dayName(lc), date: formatShort(lc, deps.locale) };
      return hs.length ? wfmt('cityNowHolidays', { ...vars, holidays: holidayText(hs) }) : wfmt('cityNow', vars);
    },
  };
}
