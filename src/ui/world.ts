/**
 * The World view, "Around the world": a globe a child can spin, holiday chips that light up
 * the countries celebrating, and live trackers (day and night, tonight's moon, the New Year
 * wave, Santa, and what time and holiday it is in twelve cities). Everything is computed on
 * the device: no tiles, no fonts, no network.
 *
 *   const world = mountWorld(host, deps);   world.selectHoliday('diwali');   world.destroy();
 *
 * Text refreshes once a second on a timer (four times a second during a pretend show); the
 * globe redraws only when something changed, except during the two shows, which animate
 * every frame (or step with the text under reduced motion). The live layers (sun, wave,
 * Santa) live in world/live.ts.
 */
import './world.css';
import type { ViewFactory } from '../app/context';
import type { HolidayMeta } from '../content/types';
import { pluralSleeps } from '../app/format';
import { worldArtUrl } from '../art/index';
import { diffDays, fromDayNumber, toDayNumber, type CivilDate } from '../dates/civil';
import { allOccurrences, happeningNow } from '../dates/occurrences';
import type { MotionMode } from '../effects/types';
import { THEMES, type Theme } from '../theme/themes';
import { albumStorage, postcardsReached } from '../world/album';
import { trackerCards, type TrackerCards } from '../world/cards';
import { WORLD_COPY, wfmt } from '../world/copy';
import { CELEBRATED, holidaysCelebratedIn } from '../world/data/celebrated';
import { CITIES, flagEmoji, type City } from '../world/data/cities';
import { countryName } from '../world/data/countries';
import { Globe, type GlobeHit, type GlobeMarker } from '../world/globe';
import { LiveLayers, type ShowKind } from '../world/live';
import { globePalette, type GlobeColors } from '../world/palette';
import { countryAt, countryCenter, isEverywhere } from '../world/shapes';
import { lunarHintFor, memoHolidays, type WorldHoliday } from '../world/trackers';
import { deviceZone } from '../world/zones';
import { COPY, fmt } from './copy';
import { h } from './dom';
import { icon } from './icons';
import { albumCount, albumDialog, kindOf, postcardShow, POSTCARD_COPY, type PostcardShow } from './postcard-show';

export type { WorldHoliday };

export interface WorldDeps {
  readonly now: () => Date;
  readonly today: () => CivilDate;
  readonly metas: readonly HolidayMeta[];
  readonly holidaysOn: (civil: CivilDate) => readonly WorldHoliday[];
  readonly locale: string;
  readonly motion: MotionMode;
  readonly theme: Theme;
  readonly navigate: (hash: string) => void;
  readonly name?: string;
  /** Next headline day of a holiday: orders the chips soonest-first and finds the moon card's hint. */
  readonly nextMain?: (id: string) => CivilDate | null;
  /** Holiday to light up first (#/world/:id); otherwise today's holidays, else the soonest. */
  readonly initial?: string | null;
  /** The device's IANA zone (defaults to Intl's; screenshots pin it). */
  readonly zone?: string;
  /** `?today=` is on: postcards are kept in memory only. */
  readonly pretending?: boolean;
}

export interface WorldInstance {
  destroy(): void;
  selectHoliday(id: string | null): void;
  setMotion(motion: MotionMode): void;
}

interface Selection {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly countries: readonly string[];
  readonly note: string;
  readonly focus: { lon: number; lat: number } | null;
  readonly palette: GlobeColors;
}

const TODAY = 'today';

export function mountWorld(host: HTMLElement, deps: WorldDeps): WorldInstance {
  const zone = deps.zone ?? deviceZone();
  const holidaysOn = memoHolidays(deps.holidaysOn);
  const byId = new Map(deps.metas.map((m) => [m.id, m] as const));
  const isBig = (id: string): boolean => (byId.get(id)?.tier ?? 3) !== 3;
  let motion = deps.motion;
  let today = deps.today();
  let mode: 'globe' | 'map' = 'globe';
  let current: Selection | null = null;
  let pinned: City | null = null;

  const link = (hash: string, text: string, cls: string): HTMLAnchorElement =>
    h('a', { class: cls, href: hash, onclick: (e: Event) => { e.preventDefault(); deps.navigate(hash); } }, text);

  // ── stage ──
  const canvas = h('canvas', { role: 'img', 'aria-label': COPY['world.title'] });
  /** Once a child drags, zooms or taps, the globe stops spinning by itself. */
  let touched = false;
  const bubble = h('div', { class: 'world-bubble', role: 'status', 'aria-live': 'polite', hidden: true });
  const zoomIn = h('button', { type: 'button', class: 'btn btn-secondary btn-icon', 'aria-label': WORLD_COPY.zoomIn, onclick: () => { globe.zoomBy(1.5); quiet(); } }, icon('plus', 22));
  const zoomOut = h('button', { type: 'button', class: 'btn btn-secondary btn-icon', 'aria-label': WORLD_COPY.zoomOut, onclick: () => { globe.zoomBy(1 / 1.5); quiet(); } }, icon('minus', 22));
  const stage = h('div', {
    class: 'world-canvas', tabindex: 0, role: 'group', 'aria-roledescription': 'globe',
    'aria-label': `${WORLD_COPY.hostLabel}. ${WORLD_COPY.canvasHelp}`,
  }, canvas, h('div', { class: 'world-zoom' }, zoomIn, zoomOut), bubble);
  // Heads-up panel on the globe while a show (or the real flight or wave) is on.
  const hudEmoji = h('span', { class: 'world-hud-emoji emoji', 'aria-hidden': 'true' });
  const hudTitle = h('strong', {});
  const hudLine = h('span', {});
  const hudStop = h('button', {
    type: 'button', class: 'btn btn-secondary world-hud-stop',
    onclick: () => { const k = live.showing; if (k) toggleShow(k); },
  }, WORLD_COPY.hudStop);
  const hud = h('div', { class: 'world-hud', hidden: true }, hudEmoji, h('div', { class: 'world-hud-body' }, hudTitle, hudLine), hudStop);
  stage.append(hud);

  const sleighArt = worldArtUrl('sleigh');
  const globe = new Globe(canvas, {
    motion,
    onSelect: (hit) => onHit(hit),
    onInteract: () => quiet(),
  });
  globe.setLights(CITIES);
  if (sleighArt) globe.setSleighArt(sleighArt);

  // Tracker postcards: every headline city Santa or midnight reaches sends one (see postcard-show.ts).
  const album = albumStorage(deps.pretending ?? false);
  let postcards: PostcardShow | null = null;
  const live = new LiveLayers({
    globe, cities: CITIES, zone, now: () => deps.now(), onMarkers: () => pushMarkers(),
    onArrive: (kind, reached, year) => postcards?.push(kind, postcardsReached(reached), year),
  });

  // ── header, mode toggle, holiday chips, note ──
  const modeButtons = (['globe', 'map'] as const).map((m) => h('button', {
    type: 'button', 'aria-pressed': String(m === mode), onclick: () => setMode(m),
  }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, m === 'globe' ? '🌍' : '🗺️'), ` ${m === 'globe' ? COPY['world.globe'] : COPY['world.flat']}`));
  const chipRow = h('div', { class: 'chips', role: 'group', 'aria-label': WORLD_COPY.where });
  const note = h('div', { class: 'world-note', 'aria-live': 'polite' });

  const cards: TrackerCards = trackerCards({
    deps, zone, holidaysOn, isBig,
    clock: (kind) => live.clock(kind),
    showing: (kind) => live.showing === kind,
    onToggleShow: (kind) => toggleShow(kind),
    onNight: (on) => { globe.setNight(on); renderLabel(); },
    onCity: (c) => pinCity(c),
    lunarHint: () => (deps.nextMain ? lunarHintFor(deps.metas, deps.nextMain, today) : null),
    sleighArt,
    album: {
      count: (kind) => albumCount(album.read(), kindOf(kind)),
      open: (kind) => { albumDialog(document.body, album.read(), kindOf(kind), deps.pretending ?? false); },
      label: (n) => (n > 0 ? `${POSTCARD_COPY.album} (${n})` : POSTCARD_COPY.album),
      aria: POSTCARD_COPY.albumAria,
    },
  });
  postcards = postcardShow({
    stage, globe, live, album,
    motion: () => motion,
    onCollect: () => cards.refreshAlbum(),
    quiet: () => { globe.autoRotate(0); touched = true; },
  });

  host.replaceChildren(h('section', { class: 'world' },
    h('div', { class: 'world-top' },
      h('h1', { class: 'h1' }, COPY['world.title']),
      h('div', { class: 'segmented', role: 'group', 'aria-label': COPY['world.globe'] }, ...modeButtons),
    ),
    h('section', { class: 'world-where', 'aria-label': WORLD_COPY.where }, chipRow, note),
    h('div', { class: 'world-stage' }, stage),
    h('h2', { class: 'h2' }, COPY['world.trackers']),
    cards.grid,
  ));

  // ── selections ──
  function todayHolidays(): WorldHoliday[] {
    return holidaysOn(today).filter((x) => isBig(x.id) && CELEBRATED[x.id] !== undefined);
  }

  function sleepsTo(id: string): number {
    const d = deps.nextMain?.(id);
    return d ? diffDays(today, d) : 99_999;
  }

  function chipHolidays(): HolidayMeta[] {
    return deps.metas
      .filter((m) => m.tier !== 3 && CELEBRATED[m.id] !== undefined)
      .map((m) => ({ m, k: sleepsTo(m.id) }))
      .sort((a, b) => a.k - b.k || a.m.name.localeCompare(b.m.name))
      .map((x) => x.m);
  }

  function focusOf(id: string): { lon: number; lat: number } | null {
    const c = CELEBRATED[id];
    if (!c) return null;
    if (c.focus) return { lon: c.focus[0], lat: c.focus[1] };
    const first = c.countries[0];
    return first ? countryCenter(first) : null;
  }

  function resolve(id: string): Selection | null {
    if (id === TODAY) {
      const hs = todayHolidays();
      const first = hs[0];
      if (!first) return null;
      // A whole-planet holiday (New Year's Eve) would swallow the rest: color the specific ones.
      const lists = hs.map((x) => CELEBRATED[x.id]?.countries ?? []);
      const specific = lists.filter((l) => !isEverywhere(l));
      const countries = new Set<string>();
      for (const l of specific.length > 0 ? specific : lists) for (const c of l) countries.add(c);
      const meta = byId.get(first.id);
      return {
        id, name: WORLD_COPY.todayChip, emoji: '🌍', countries: [...countries],
        note: wfmt('todayList', { list: hs.map((x) => `${x.emoji} ${x.name}`).join(', ') }),
        focus: focusOf(first.id), palette: globePalette(meta ? THEMES[meta.theme] : deps.theme),
      };
    }
    const meta = byId.get(id);
    const c = CELEBRATED[id];
    if (!meta || !c) return null;
    return { id, name: meta.name, emoji: meta.emoji, countries: c.countries, note: c.note, focus: focusOf(id), palette: globePalette(THEMES[meta.theme]) };
  }

  function whenText(id: string): string | null {
    const d = deps.nextMain?.(id);
    if (!d) return null;
    const n = diffDays(today, d);
    if (n < 0) return WORLD_COPY.happening;
    return n === 0 ? WORLD_COPY.isToday : wfmt('inSleeps', { sleeps: pluralSleeps(n) });
  }

  function buildChips(): void {
    const items: { id: string; emoji: string; label: string }[] = [];
    if (todayHolidays().length > 0) items.push({ id: TODAY, emoji: '🌍', label: WORLD_COPY.todayChip });
    for (const m of chipHolidays()) items.push({ id: m.id, emoji: m.emoji, label: m.name });
    chipRow.replaceChildren(...items.map((it) => h('button', {
      type: 'button', class: 'chip', 'data-id': it.id, 'aria-pressed': String(it.id === current?.id),
      onclick: () => select(it.id, true),
    }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, it.emoji), it.label)));
  }

  function renderNote(sel: Selection): void {
    const names = sel.countries.map(countryName).sort((a, b) => a.localeCompare(b));
    const when = sel.id === TODAY ? null : whenText(sel.id);
    note.replaceChildren(
      h('div', { class: 'world-note-head' },
        h('span', { class: 'world-note-title' }, `${sel.emoji} ${sel.name}`),
        when ? h('span', { class: 'world-note-when' }, when) : null),
      h('p', {}, sel.note),
      h('details', { class: 'world-places' },
        h('summary', {}, fmt('world.celebratedIn', { n: names.length })),
        h('p', { class: 'small' }, names.join(', '))),
    );
    if (sel.id !== TODAY) note.append(link(`#/h/${encodeURIComponent(sel.id)}`, wfmt('peek', { name: sel.name }), 'btn btn-secondary'));
  }

  /** Lights the selection's countries, except during a show, which has the globe to itself. */
  function paintHighlight(): void {
    if (current && live.showing === null) globe.setHighlight(current.countries, current.palette.highlight);
    else globe.setHighlight(null);
  }

  function select(id: string | null, user: boolean): void {
    const sel = (id ? resolve(id) : null) ?? resolve(TODAY) ?? resolve(chipHolidays()[0]?.id ?? '');
    if (!sel) return;
    current = sel;
    for (const b of chipRow.querySelectorAll<HTMLButtonElement>('button')) {
      const on = b.dataset['id'] === sel.id;
      b.setAttribute('aria-pressed', String(on));
      if (on && user) b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: motion === 'full' ? 'smooth' : 'auto' });
    }
    globe.setColors(sel.palette);
    paintHighlight();
    renderNote(sel);
    if (user) {
      quiet();
      hideBubble();
      if (sel.focus && live.showing === null) globe.spinTo(sel.focus.lon, mode === 'globe' ? sel.focus.lat : 0, 1400);
    }
    renderLabel();
  }

  /** Where the current selection wants the camera (a function, so TypeScript reads `current` fresh). */
  function focusNow(): { lon: number; lat: number } | null {
    return current?.focus ?? null;
  }

  // ── the globe's info bubble ──
  function hideBubble(): void {
    bubble.hidden = true;
    globe.setSelected(null);
  }

  function showBubble(emoji: string, title: string, text: string, chips: readonly WorldHoliday[] = []): void {
    bubble.replaceChildren(
      h('span', { class: 'world-bubble-emoji emoji', 'aria-hidden': 'true' }, emoji),
      h('div', { class: 'world-bubble-body' },
        h('strong', {}, title),
        h('span', {}, text)),
      h('button', { type: 'button', class: 'btn btn-secondary btn-icon', 'aria-label': WORLD_COPY.close, onclick: hideBubble }, icon('close', 18)),
      chips.length > 0
        ? h('div', { class: 'world-bubble-chips' }, ...chips.map((c) => h('button', {
          type: 'button', class: 'chip chip-sm', onclick: () => select(c.id, true),
        }, `${c.emoji} ${c.name}`)))
        : '',
    );
    bubble.hidden = false;
  }

  function onHit(hit: GlobeHit): void {
    quiet();
    if (hit.kind === 'country') {
      globe.setSelected(hit.iso);
      const hs = holidaysCelebratedIn(hit.iso)
        .filter((id) => isBig(id) && byId.has(id))
        .sort((a, b) => sleepsTo(a) - sleepsTo(b))
        .map((id) => byId.get(id)!)
        .map((m) => ({ id: m.id, name: m.name, emoji: m.emoji }));
      const name = countryName(hit.iso);
      showBubble(flagEmoji(hit.iso) ?? '🗺️', name, hs.length > 0 ? WORLD_COPY.countryHolidays : wfmt('countryNone', { name }), hs.slice(0, 10));
    } else if (hit.kind === 'marker') {
      const m = hit.marker;
      if (m.id === 'santa') showBubble('🎅', COPY['world.santa'], cards.santaLine());
      else if (m.id === 'sun') showBubble('☀️', WORLD_COPY.legendSun, WORLD_COPY.sunHere);
      else if (m.id?.startsWith('city:') || m.id?.startsWith('wave:')) {
        const city = CITIES.find((c) => m.id === `city:${c.id}` || m.id === `wave:${c.id}`);
        if (city) showBubble(city.emoji ?? '📍', city.name, cards.cityLine(city));
      }
    } else if (hit.kind === 'ocean') {
      globe.setSelected(null);
      showBubble('🌊', WORLD_COPY.oceanTitle, WORLD_COPY.ocean);
    } else {
      globe.setSelected(null);
      showBubble('✨', WORLD_COPY.spaceTitle, WORLD_COPY.space);
    }
  }

  function pinCity(c: City): void {
    pinned = c;
    pushMarkers();
    quiet();
    globe.spinTo(c.lon, mode === 'globe' ? c.lat : 0, 1200);
    showBubble(c.emoji ?? '📍', c.name, cards.cityLine(c));
    stage.scrollIntoView({ block: 'nearest', behavior: motion === 'full' ? 'smooth' : 'auto' });
  }

  function pushMarkers(): void {
    const list: GlobeMarker[] = live.markers();
    if (pinned) list.splice(1, 0, { id: `city:${pinned.id}`, lon: pinned.lon, lat: pinned.lat, dot: '#ff4d9d', size: 12, label: pinned.name });
    globe.setMarkers(list);
  }

  // ── camera & mode ──
  function quiet(): void {
    globe.autoRotate(0);
    touched = true;
    live.pauseFollow();
  }

  function setMode(m: 'globe' | 'map'): void {
    if (m === mode) return;
    mode = m;
    modeButtons.forEach((b, i) => b.setAttribute('aria-pressed', String((i === 0 ? 'globe' : 'map') === m)));
    stage.classList.toggle('is-map', m === 'map');
    globe.setMode(m);
    if (m === 'map') globe.setCenter(globe.getCenter().lon, 0);
    renderLabel();
  }

  // ── the pretend shows ──
  const frame = (): void => live.sync(today);

  function toggleShow(kind: ShowKind): void {
    const running = live.toggle(kind, today);
    globe.setTicker(running && motion === 'full' ? frame : null);
    paintHighlight();
    live.sync(today);
    pushMarkers();
    if (running) {
      hideBubble();
      const p = kind === 'santa' ? { lon: -160, lat: 15 } : { lon: -168, lat: -8 };
      globe.spinTo(p.lon, mode === 'globe' ? p.lat : 0, 1200);
      stage.scrollIntoView({ block: 'nearest', behavior: motion === 'full' ? 'smooth' : 'auto' });
    } else {
      const f = focusNow();
      if (f) globe.spinTo(f.lon, mode === 'globe' ? f.lat : 0, 1200);
    }
    cards.refresh();
    renderHud();
    renderLabel();
  }

  function renderHud(): void {
    const x = cards.hud();
    hud.hidden = x === null;
    if (!x) return;
    if (hudEmoji.textContent !== x.emoji) hudEmoji.textContent = x.emoji;
    if (hudTitle.textContent !== x.title) hudTitle.textContent = x.title;
    if (hudLine.textContent !== x.line) hudLine.textContent = x.line;
    hudStop.hidden = !x.show;
  }

  // ── accessible label ──
  function renderLabel(): void {
    const c = globe.getCenter();
    const place = countryAt(c.lon, c.lat)?.name ?? WORLD_COPY.theSea;
    const parts = [mode === 'globe' ? wfmt('globeAria', { place }) : WORLD_COPY.mapAria];
    if (current && live.showing === null) {
      parts.push(current.id === TODAY ? WORLD_COPY.ariaToday : wfmt('ariaHighlight', { n: current.countries.length, name: current.name }));
    }
    if (cards.night) parts.push(WORLD_COPY.ariaNight);
    if (live.santa) parts.push(wfmt('ariaSanta', { where: cards.santaWhere() }));
    if (live.wave) parts.push(wfmt('ariaWave', { n: live.arrived, total: CITIES.length, year: today.m === 1 ? today.y : today.y + 1 }));
    globe.setLabel(`${parts.join(', ')}.`);
  }

  // ── once a second ──
  function tick(): void {
    const t = deps.today();
    if (t.y !== today.y || t.m !== today.m || t.d !== today.d) {
      today = t;
      buildChips();
      select(current?.id ?? null, false);
      cards.reorder();
    }
    if (!(live.showing && motion === 'full')) live.sync(today);
    cards.refresh();
    renderHud();
    renderLabel();
  }

  stage.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (postcards?.dismiss()) e.preventDefault();
    else if (!bubble.hidden) { hideBubble(); e.preventDefault(); }
  });

  // ── first frame ──
  buildChips();
  select(deps.initial ?? null, false);
  buildChips();
  live.sync(today);
  pushMarkers();
  // On Christmas Eve the camera starts on the sleigh, in New Year week on the wave; otherwise on the holiday.
  const start = live.santaNow() ?? live.waveNow() ?? focusNow() ?? { lon: 0, lat: 15 };
  globe.setCenter(start.lon + (motion === 'full' ? 70 : 0), start.lat);
  renderHud();
  renderLabel();
  globe.start();
  if (motion === 'full') {
    globe.spinTo(start.lon, start.lat, 1800);
    window.setTimeout(() => { if (!touched && live.showing === null) globe.autoRotate(-3); }, 2000);
  }
  // Text refreshes once a second, four times a second during a show (its clock runs 600× fast).
  let beats = 0;
  const timer = window.setInterval(() => {
    beats++;
    if (live.showing !== null || beats % 4 === 0) tick();
  }, 250);

  return {
    destroy(): void {
      window.clearInterval(timer);
      postcards?.destroy();
      globe.destroy();
    },
    selectHoliday(id: string | null): void {
      select(id, true);
    },
    setMotion(m: MotionMode): void {
      motion = m;
      globe.setMotion(m);
      globe.setTicker(live.showing && m === 'full' ? frame : null);
    },
  };
}

/**
 * The registry entry for #/world and #/world/:id: builds WorldDeps from the app context
 * (clock, catalog, region, locale, motion) and mounts the view; `route.id` preselects a holiday.
 */
export const worldView: ViewFactory<'world'> = (ctx, route) => {
  ctx.setTheme(null);
  const today = ctx.clock.today();
  const all = ctx.allMetas();
  // One expansion gives every holiday's next headline day (chips soonest-first, the moon card's hint).
  const t = toDayNumber(today);
  const next = new Map<string, CivilDate>();
  for (const occ of allOccurrences(ctx.metas, [], today, ctx.region)) {
    if (occ.end >= t && !next.has(occ.holidayId)) next.set(occ.holidayId, fromDayNumber(occ.main));
  }
  const focus = route.id === undefined ? undefined : ctx.metaOf(route.id);
  const name = ctx.store.progress.name;
  const el = h('div', { class: 'world-host' });
  const world = mountWorld(el, {
    now: () => ctx.clock.now(),
    today: () => ctx.clock.today(),
    metas: ctx.metas,
    holidaysOn: (civil) => happeningNow(all, [], civil, ctx.region).flatMap((occ) => {
      const m = ctx.metaOf(occ.holidayId);
      return m ? [{ id: m.id, name: m.name, emoji: m.emoji }] : [];
    }),
    nextMain: (id) => next.get(id) ?? null,
    locale: ctx.locale,
    motion: ctx.motion,
    theme: focus ? THEMES[focus.theme] : THEMES.newyear,
    navigate: (hash) => { location.hash = hash; },
    initial: route.id ?? null,
    pretending: ctx.clock.pretending,
    ...(name ? { name } : {}),
  });
  const offMotion = ctx.onMotionChange((m) => world.setMotion(m));
  return {
    el,
    destroy: () => { offMotion(); world.destroy(); },
  };
};
