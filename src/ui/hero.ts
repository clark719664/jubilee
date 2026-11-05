/**
 * The shared hero (Home, the holiday page and Celebration Mode): the holiday's living sky you can poke,
 * its illustrated scene when it has one, a scrim so text always reads, Jubi the mascot, the name, the giant
 * counter (countdown.ts), the date in words, notes ('Year of the Horse', "expected — depends on the new
 * moon"), chips (the observed day off, "this one is rare!") and, on Home, the "Peek inside" button.
 *
 *   const hero = mountHero(ctx, { meta, occ, status, mode: 'home', showPeek: true, today });
 *   view.append(hero.el);   …   hero.destroy();      // in the view's destroy()
 *
 * The sky colors are the --h-* variables the VIEW sets with ctx.setTheme; the hero never sets a theme.
 *
 *   section.hero.hero-bleed.sky.is-pokeable[.has-scene][.has-lights][.is-celebrating]   aria-labeledby → h1
 *     div.hero-sky[role=button][tabindex=0]   EffectLayer host: tap/click or Space/Enter → burst
 *       div.hero-layers.is-behind              scene back.svg + mid.svg (decorative <img>s)
 *       canvas.hero-canvas                     role=img, aria-label = the effect's description
 *       div.hero-layers.is-front               scene front.svg, so snow falls behind the snowbank
 *     div.lights                               Christmas string lights (CSS)
 *     div.hero-scrim
 *     div.hero-body    taps fall through to the sky except on its links, buttons, the emoji and the number
 *       div.hero-copy  p.hero-kicker | p.hero-stacked · h1.hero-title (emoji + name) · p.hero-also ·
 *                      div.hero-count · p.hero-date · p.hero-note… · div.hero-chips · div.hero-extras
 *       div.hero-actions                       "Peek inside" (+ Celebration Mode's "See what's next")
 *     div.hero-mascot                          Jubi (tap the holiday emoji five times and Jubi spins)
 *
 * Without a scene the copy sits bottom-left over the sky, as it always has. With one (src/art: layers
 * share a 1600×900 artboard whose upper center is kept clear for words), the copy moves to the upper
 * center over a soft top-down scrim and the picture keeps its bottom; the layers drift a few pixels with
 * the pointer (nearer layers more), never under reduced motion.
 *
 * The effect starts once the hero is in the page and has a size (so the sky is prewarmed at its real size).
 * Motion follows ctx.motion live; the layer's own IntersectionObserver turns the intersection ratio into
 * the effect's intensity, so content scrolling over the hero calms it.
 */
import type { AppContext } from '../app/context';
import { formatRoute } from '../app/router';
import { PARALLAX, isForeground, sceneDataFor, sceneFor, type SceneLayer } from '../art/index';
import type { HolidayMeta } from '../content/types';
import { formatIso, formatLong, fromDayNumber, toDayNumber, type CivilDate, type DayNumber } from '../dates/civil';
import { candlesLit, closeness, spanProgress } from '../dates/countdown';
import { ageOn, type Occurrence, type Status } from '../dates/occurrences';
import type { Region } from '../dates/rules';
import { DESCRIBE } from '../effects/describe';
import { EffectLayer } from '../effects/layer';
import type { EffectParams, MotionMode, Stage } from '../effects/types';
import { THEMES } from '../theme/themes';
import { COPY, fmt, listJoin } from './copy';
import { mountCounter, nodes, replay, type CounterInstance } from './countdown';
import { heroNote } from './dates';
import { h } from './dom';
import { mascot, mascotState, spin, type MascotState } from './mascot';

export type HeroMode = 'home' | 'holiday' | 'celebrate';

export interface HeroProps {
  readonly meta: HolidayMeta;
  readonly occ: Occurrence;
  readonly status: Status;
  readonly mode: HeroMode;
  /** Same-day extras for the stacked copy ("Today is Christmas… and tonight Hanukkah begins!"). */
  readonly stacked?: readonly { readonly meta: HolidayMeta; readonly occ: Occurrence }[];
  /** The "Peek inside" button (Home). */
  readonly showPeek?: boolean;
  readonly today: CivilDate;
}

export interface HeroInstance {
  readonly el: HTMLElement;
  update(props: HeroProps): void;
  destroy(): void;
  /** Slot inside the hero body for extra content (Celebration Mode puts the greeting marquee here). */
  readonly extras: HTMLElement;
  /** The button row ("Peek inside"); callers may append more links. */
  readonly actions: HTMLElement;
  /** A poke at (x, y) in hero px, or at the middle of the sky. Ignored until the sky is running. */
  burst(x?: number, y?: number): void;
  /** Runs `cb` once the effect has started (immediately if it already has). */
  onReady(cb: () => void): void;
}

/** Celebration Mode doubles the effect's particles. */
export const CELEBRATE_DENSITY = 2;
const RAMADAN_ID = 'ramadan';
const FOOLS_ID = 'april-fools-day';
const LEAP_ID = 'leap-day';
const SECRET_TAPS = 5;
const TAP_WINDOW_MS = 2500;
const FLIP_DELAY_MS = 700;
const FLIP_MS = 2200;
const LIGHT_COLORS = ['#ff4d5e', '#ffd166', '#34d399', '#7cc4ff', '#ff7ad9'] as const;
const LIGHT_COUNT = 15;
/** A scene with no `stage` in its scene.json (one shared object, so the effect sees no change between updates). */
const NO_STAGE: Stage = Object.freeze({});

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// ───────────────────────────────────────────────────────── pure helpers (tested)

/** Sleeps left to the headline day (0 once it has come). */
export function sleepsToMain(status: Status): number {
  if (status.kind === 'upcoming') return status.sleeps;
  if (status.kind === 'ongoing') return Math.max(0, status.sleepsToMain);
  return 0;
}

/** Jubi's mood: sleepy far out, curious, excited at three sleeps, party hat on the day (sleepy after it). */
export function mascotSleeps(status: Status): number {
  return status.kind === 'passed' ? Number.POSITIVE_INFINITY : sleepsToMain(status);
}

/**
 * The effect's params for tonight: the registry's own params plus the per-night ones — menorah and kinara
 * candles lit on this civil day, diyas and sabzeh growing and the Mid-Autumn moon filling as the day nears,
 * Ramadan's crescent waxing through the month, the birthday cake's candles = age — and double density in
 * Celebration Mode.
 */
export function effectParamsFor(
  meta: HolidayMeta, occ: Occurrence, status: Status, today: CivilDate, mode: HeroMode, age?: number,
): EffectParams {
  const p: Mutable<EffectParams> = { ...(meta.effectParams ?? {}) };
  const near = closeness(sleepsToMain(status));
  switch (meta.effect) {
    case 'menorah': p.candles = candlesLit(occ, today, 8); break;
    case 'kinara': p.candles = candlesLit(occ, today, 7); break;
    case 'diyas': case 'sabzeh': p.growth = near; break;
    case 'moon': p.moonPhase = near; break;
    case 'crescent':
      if (meta.id === RAMADAN_ID) p.moonPhase = status.kind === 'ongoing' ? spanProgress(occ, today) : 0;
      break;
    case 'balloons':
      if (age !== undefined) p.candles = age;
      break;
    default: break;
  }
  if (mode === 'celebrate') p.density = (meta.effectParams?.density ?? 1) * CELEBRATE_DENSITY;
  return p;
}

export interface StackedItem { readonly name: string; readonly occ: Occurrence }

/**
 * The stacked hero line when more than one holiday lands today: "Today is Christmas… and tonight Hanukkah
 * begins!", "Today is Easter and Orthodox Easter!", or null for a single holiday.
 */
export function stackedCopy(items: readonly StackedItem[], today: DayNumber): string | null {
  if (items.length < 2) return null;
  const tonight = (o: Occurrence): boolean => o.beginsAtSundown && o.start === today;
  const day = items.filter((i) => !tonight(i.occ)).map((i) => i.name);
  const eve = items.filter((i) => tonight(i.occ)).map((i) => i.name);
  if (day.length > 0 && eve.length > 0) return fmt('stackedToday', { a: listJoin(day), b: listJoin(eve) });
  return eve.length > 0 ? fmt('ribbon.tonight', { name: listJoin(eve) }) : fmt('ribbon.today', { name: listJoin(day) });
}

/** The observed day off, when it moved and applies here (US federal shifts only for the US). */
export function observedDayOff(meta: Pick<HolidayMeta, 'observedShift'>, occ: Occurrence, region: Region): DayNumber | null {
  if (occ.observed === undefined) return null;
  if ((meta.observedShift ?? 'none') === 'us-federal' && region !== 'US') return null;
  return occ.observed;
}

/** A stable seed per holiday, so each sky replays the same way (FNV-1a). */
export function seedFor(id: string): number {
  let x = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    x ^= id.charCodeAt(i);
    x = Math.imul(x, 0x01000193);
  }
  return (x >>> 0) || 1;
}

/** The nearest scene layer drifts up to this far across (px) with the pointer; up and down, half as far. */
export const PARALLAX_PX = 12;

/** Every scene shares a 1600×900 artboard whose top 430 units are sky kept clear for the words. */
export const ARTBOARD = { w: 1600, h: 900, sky: 430 } as const;
/** Breathing room between the last line of copy and the picture's sky line. */
const SKY_MARGIN = 14;

/**
 * The smallest hero height whose scene keeps the copy (ending `copyBottom` px from the top) in the picture's
 * sky. The layers cover the hero bottom-anchored, so the artboard is drawn A = max(H, W·900/1600) tall and
 * its sky line sits at H − A·(1 − 430/900): a hero tall enough to be height-bound needs H ≥ bottom / (430/900);
 * a wide one (width-bound, top cropped) needs H ≥ bottom + W·(900/1600)·(1 − 430/900).
 */
export function sceneFitHeight(width: number, copyBottom: number): number {
  if (!(width > 0) || !(copyBottom > 0)) return 0;
  const below = 1 - ARTBOARD.sky / ARTBOARD.h;
  const drawn = (width * ARTBOARD.h) / ARTBOARD.w;
  const bottom = copyBottom + SKY_MARGIN;
  const tall = bottom / (1 - below);
  return Math.ceil(tall >= drawn ? tall : bottom + below * drawn);
}

export interface Box { readonly left: number; readonly top: number; readonly width: number; readonly height: number }

/** Where a point sits over a box: −1 at the left/top edge, 0 in the middle, 1 at the right/bottom (clamped). */
export function pointerRatio(x: number, y: number, box: Box): { readonly nx: number; readonly ny: number } {
  const ratio = (v: number, start: number, size: number): number =>
    size > 0 && Number.isFinite(v) ? Math.min(1, Math.max(-1, ((v - start) / size) * 2 - 1)) : 0;
  return { nx: ratio(x, box.left, box.width), ny: ratio(y, box.top, box.height) };
}

/**
 * How far a scene layer drifts for the pointer at (nx, ny): away from the pointer, as if looking through a
 * window, by depth × 12 px across and half that up and down (back 0.2, mid 0.5, front 1).
 */
export function layerShift(nx: number, ny: number, depth: number): { readonly x: number; readonly y: number } {
  const d = Number.isFinite(depth) ? Math.min(1, Math.max(0, depth)) : 0;
  const px = (v: number): number => Math.round(v * 10) / 10 || 0;
  return { x: px(-nx * d * PARALLAX_PX), y: px((-ny * d * PARALLAX_PX) / 2) };
}

// ───────────────────────────────────────────────────────── DOM

let heroSeq = 0;

interface LayerImg { readonly img: HTMLImageElement; readonly depth: number }

/** A decorative scene layer: bottom-anchored, untouchable, faded in once decoded (and dropped if missing). */
function layerImg(layer: SceneLayer, onMissing: () => void): HTMLImageElement {
  const img = h('img', { class: 'hero-layer', src: layer.url, alt: '', decoding: 'async', 'data-layer': layer.name });
  img.draggable = false;
  const shown = (): void => { img.classList.add('is-loaded'); };
  if (img.complete && img.naturalWidth > 0) shown();
  else {
    img.addEventListener('load', shown, { once: true });
    img.addEventListener('error', () => { img.remove(); onMissing(); }, { once: true });
  }
  return img;
}

function skyLabel(meta: HolidayMeta): string {
  return `Poke the sky: ${DESCRIBE[meta.effect].toLowerCase()}`;
}

function stringLights(): HTMLElement {
  const el = h('div', { class: 'lights', 'aria-hidden': 'true' });
  for (let i = 0; i < LIGHT_COUNT; i++) {
    const bulb = h('i');
    bulb.style.setProperty('--i', String(i));
    bulb.style.setProperty('--c', LIGHT_COLORS[i % LIGHT_COLORS.length]!);
    el.append(bulb);
  }
  return el;
}

export function mountHero(ctx: AppContext, initial: HeroProps): HeroInstance {
  let props = initial;
  let destroyed = false;
  let started = false;
  const ready: (() => void)[] = [];
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number): void => {
    const id = window.setTimeout(() => { timers.delete(id); if (!destroyed) fn(); }, ms);
    timers.add(id);
  };

  const titleId = `hero-title-${++heroSeq}`;
  const canvas = h('canvas', { class: 'hero-canvas' });
  // The illustrated scene sandwiches the effect: back + mid behind the canvas, front in front of it.
  const behind = h('div', { class: 'hero-layers is-behind', 'aria-hidden': 'true' });
  const inFront = h('div', { class: 'hero-layers is-front', 'aria-hidden': 'true' });
  const sky = h('div', { class: 'hero-sky', role: 'button', tabindex: 0, 'aria-label': skyLabel(props.meta) }, behind, canvas, inFront);
  const scrim = h('div', { class: 'hero-scrim', 'aria-hidden': 'true' });

  // ── head: kicker/stacked line, the title (emoji + name), "Also called…" ──
  const emoji = h('span', { class: 'hero-emoji emoji', 'aria-hidden': 'true' }, props.meta.emoji);
  const nameEl = h('span', { class: 'hero-name' }, props.meta.name);
  const title = h('h1', { class: 'hero-title', id: titleId }, emoji, nameEl);
  const head = h('div', { class: 'hero-slot' });

  // ── counter, info, extras, actions ──
  const burst = (x?: number, y?: number): void => {
    if (!started) return;
    layer.burst(x ?? sky.clientWidth / 2, y ?? sky.clientHeight * 0.42);
  };
  const counter: CounterInstance = mountCounter(ctx, props, {
    onMidnight: () => {
      // The confetti cannon at 00:00:00 (bursts are rate-limited to three a second by the layer).
      burst();
      later(() => burst(sky.clientWidth * 0.28, sky.clientHeight * 0.4), 380);
      later(() => burst(sky.clientWidth * 0.72, sky.clientHeight * 0.4), 760);
    },
  });
  const info = h('div', { class: 'hero-slot' });
  const extras = h('div', { class: 'hero-extras' });
  const actions = h('div', { class: 'hero-actions' });
  let peek: HTMLElement | null = null;

  // The words travel together (bottom-left over a bare sky, upper center over a scene); the buttons follow.
  const copy = h('div', { class: 'hero-copy' }, head, counter.el, info, extras);
  const body = h('div', { class: 'hero-body' }, copy, actions);
  const mascotHost = h('div', { class: 'hero-mascot' });
  const el = h('section', { class: 'hero hero-bleed sky is-pokeable', 'aria-labeledby': titleId }, sky, scrim, body, mascotHost);
  let lights: HTMLElement | null = null;
  let jubi: SVGSVGElement | null = null;
  let jubiState: MascotState | null = null;
  let sceneOf: string | null = null;
  let layers: LayerImg[] = [];

  const ageFor = (p: HeroProps): number | undefined => {
    const custom = ctx.customs.find((c) => c.id === p.meta.id);
    return custom ? ageOn(custom, p.occ.year) : undefined;
  };
  // Scene mode: while the illustrated scene is showing, the effect gets its stage (and drops its bare-sky set pieces).
  const paramsOf = (p: HeroProps): EffectParams => {
    const base = effectParamsFor(p.meta, p.occ, p.status, p.today, p.mode, ageFor(p));
    return layers.length > 0 && sceneOf === p.meta.id ? { ...base, stage: sceneDataFor(p.meta.id).stage ?? NO_STAGE } : base;
  };

  const renderHead = (): void => {
    const p = props;
    const t = toDayNumber(p.today);
    const stacked = stackedCopy(
      [{ name: p.meta.name, occ: p.occ }, ...(p.stacked ?? []).map((s) => ({ name: s.meta.name, occ: s.occ }))], t,
    );
    emoji.textContent = p.meta.emoji;
    nameEl.textContent = p.meta.name;
    head.replaceChildren(...nodes(stacked !== null && h('p', { class: 'hero-stacked' }, stacked), title));
  };

  const renderInfo = (): void => {
    const p = props;
    const t = toDayNumber(p.today);
    const dateDay = p.status.kind === 'ongoing' && p.status.sleepsToMain <= 0 ? t : p.occ.main;
    const note = (text: string): HTMLElement => h('p', { class: 'hero-note' }, text);
    const chips: HTMLElement[] = [];
    const off = observedDayOff(p.meta, p.occ, ctx.region);
    if (off !== null) chips.push(h('span', { class: 'chip chip-sm' }, fmt('dayOff', { date: formatLong(fromDayNumber(off), ctx.locale) })));
    if (p.meta.id === LEAP_ID) chips.push(h('span', { class: 'chip chip-sm' }, `🐸 ${COPY.rare}`));
    info.replaceChildren(...nodes(
      h('p', { class: 'hero-date' }, formatLong(fromDayNumber(dateDay), ctx.locale)),
      // Only a short note ("Year of the Goat"); long explanations and other calendars' days are in the Dates section.
      heroNote(p.occ.note) !== null && note(heroNote(p.occ.note)!),
      p.occ.approx && note(COPY.expected),
      chips.length > 0 && h('div', { class: 'hero-chips' }, ...chips),
    ));
  };

  const renderPeek = (): void => {
    if (props.showPeek === true) {
      const a = h('a', { class: 'btn hero-cta', href: formatRoute({ view: 'holiday', id: props.meta.id }) }, COPY.peekInside);
      if (peek) peek.replaceWith(a);
      else actions.prepend(a);
      peek = a;
    } else if (peek) {
      peek.remove();
      peek = null;
    }
  };

  const renderMascot = (): void => {
    const state = mascotState(mascotSleeps(props.status));
    if (state === jubiState) return;
    jubiState = state;
    jubi = mascot(state, 120);
    mascotHost.replaceChildren(jubi);
  };

  const renderLights = (): void => {
    const want = props.meta.id === 'christmas';
    if (want && !lights) {
      lights = stringLights();
      sky.after(lights);
    } else if (!want && lights) {
      lights.remove();
      lights = null;
    }
    el.classList.toggle('has-lights', want);
  };

  /** The holiday's illustrated scene (none yet for most holidays: the sky alone is today's look). */
  const renderScene = (): void => {
    if (sceneOf === props.meta.id) return;
    sceneOf = props.meta.id;
    const scene = sceneFor(props.meta.id) ?? [];
    // A layer that fails to load is dropped; with none left the hero goes back to today's look.
    const missing = (): void => {
      layers = layers.filter((l) => l.img.isConnected);
      el.classList.toggle('has-scene', layers.length > 0);
      fit();
      // Back to the bare sky: the effect brings its own set pieces back.
      if (layers.length === 0 && started) layer.setParams(paramsOf(props));
    };
    layers = scene.map((l) => ({ img: layerImg(l, missing), depth: l.depth }));
    behind.replaceChildren(...layers.filter((_, i) => !isForeground(scene[i]!)).map((l) => l.img));
    inFront.replaceChildren(...layers.filter((_, i) => isForeground(scene[i]!)).map((l) => l.img));
    el.classList.toggle('has-scene', layers.length > 0);
    fit();
  };

  /** With a scene the hero grows until the picture's sky holds every line of copy (celebrations run long). */
  const fit = (): void => {
    if (destroyed) return;
    const need = layers.length === 0 ? 0 : sceneFitHeight(el.clientWidth, body.offsetTop + copy.offsetTop + copy.offsetHeight);
    const value = need > 0 ? `${need}px` : '';
    if (el.style.getPropertyValue('--scene-fit') !== value) el.style.setProperty('--scene-fit', value);
  };
  const fitWatch = typeof ResizeObserver === 'function' ? new ResizeObserver(() => fit()) : null;
  fitWatch?.observe(copy);
  fitWatch?.observe(el);

  const render = (): void => {
    el.classList.toggle('is-celebrating', props.mode === 'celebrate');
    sky.setAttribute('aria-label', skyLabel(props.meta));
    renderScene();
    renderHead();
    renderInfo();
    renderPeek();
    renderMascot();
    renderLights();
  };
  render();

  // ── parallax: the scene's layers lean away from the pointer (a finger while it presses), nearer ones more ──
  let lean = { nx: 0, ny: 0 };
  let leanFrame = 0;
  const applyLean = (): void => {
    leanFrame = 0;
    for (const { img, depth } of layers) {
      const s = layerShift(lean.nx, lean.ny, depth);
      img.style.transform = s.x === 0 && s.y === 0 ? '' : `translate3d(${s.x}px, ${s.y}px, 0)`;
    }
    // The effect draws on the art (flames on its wicks, a rangoli on its floor), so it leans with the mid layer.
    const m = layerShift(lean.nx, lean.ny, layers.length > 0 ? PARALLAX.mid : 0);
    canvas.style.transform = m.x === 0 && m.y === 0 ? '' : `translate3d(${m.x}px, ${m.y}px, 0)`;
  };
  const leanTo = (nx: number, ny: number): void => {
    lean = { nx, ny };
    if (!leanFrame) leanFrame = requestAnimationFrame(applyLean);
  };
  const onLean = (e: PointerEvent): void => {
    if (layers.length === 0 || ctx.motion !== 'full') return;
    // A finger only leans the picture while it presses, so scrolling past never jiggles it.
    if (e.pointerType === 'touch' && e.type === 'pointermove' && e.buttons === 0) return;
    const r = pointerRatio(e.clientX, e.clientY, el.getBoundingClientRect());
    leanTo(r.nx, r.ny);
  };
  const settle = (): void => { if (lean.nx !== 0 || lean.ny !== 0) leanTo(0, 0); };
  el.addEventListener('pointermove', onLean);
  el.addEventListener('pointerdown', onLean);
  el.addEventListener('pointerleave', settle);
  el.addEventListener('pointercancel', settle);
  el.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') settle(); });

  // ── the secret: tap the holiday emoji five times and Jubi spins ──
  let taps: number[] = [];
  emoji.addEventListener('click', () => {
    replay(emoji, 'is-popping');
    const now = performance.now();
    taps = taps.filter((at) => now - at < TAP_WINDOW_MS);
    taps.push(now);
    if (taps.length >= SECRET_TAPS) {
      taps = [];
      if (jubi) spin(jubi);
    }
  });
  emoji.addEventListener('animationend', () => emoji.classList.remove('is-popping'));

  // ── the living sky ──
  const layer = new EffectLayer(canvas, sky, { seed: seedFor(props.meta.id) });
  const syncSky = (mode: MotionMode): void => {
    // With motion off there is nothing to poke: the sky leaves the tab order and the accessibility tree.
    sky.tabIndex = mode === 'off' ? -1 : 0;
    if (mode === 'off') sky.setAttribute('aria-hidden', 'true');
    else sky.removeAttribute('aria-hidden');
  };
  syncSky(ctx.motion);
  layer.setMotion(ctx.motion);
  const stopMotion = ctx.onMotionChange((mode) => {
    layer.setMotion(mode);
    syncSky(mode);
    if (mode !== 'full') settle();
  });

  /** April Fools': the hero turns upside-down for two seconds on the first visit of the day, then "just kidding". */
  const maybeFlip = (): void => {
    const p = props;
    if (p.meta.id !== FOOLS_ID || p.status.kind !== 'ongoing' || ctx.motion !== 'full') return;
    if (!ctx.celebrateOnce(`fools:${formatIso(p.today)}`)) return;
    later(() => {
      el.classList.add('flipped');
      later(() => {
        el.classList.remove('flipped');
        ctx.toast(COPY.justKidding, '🤡');
      }, FLIP_MS);
    }, FLIP_DELAY_MS);
  };

  let raf = 0;
  let sizeWatch: ResizeObserver | null = null;
  const boot = (): void => {
    if (destroyed || started || !el.isConnected || sky.clientWidth === 0 || sky.clientHeight === 0) return;
    started = true;
    sizeWatch?.disconnect();
    sizeWatch = null;
    cancelAnimationFrame(raf);
    layer.resize();
    layer.setMotion(ctx.motion);
    layer.setIntensity(1);
    layer.setEffect(props.meta.effect, paramsOf(props), THEMES[props.meta.theme]);
    layer.start();
    for (const cb of ready.splice(0)) cb();
    maybeFlip();
  };
  // Start when the hero lands in the page with a real size: a ResizeObserver, with a frame loop as backup.
  if (typeof ResizeObserver === 'function') {
    sizeWatch = new ResizeObserver(() => boot());
    sizeWatch.observe(sky);
  }
  let frames = 0;
  const poll = (): void => {
    boot();
    if (!started && !destroyed && ++frames < 240) raf = requestAnimationFrame(poll);
  };
  raf = requestAnimationFrame(poll);

  return {
    el,
    extras,
    actions,
    burst,
    onReady(cb) {
      if (started) cb();
      else ready.push(cb);
    },
    update(next) {
      const prev = props;
      props = next;
      render();
      counter.update(next);
      if (!started) return;
      const swap = next.meta.id !== prev.meta.id || next.meta.effect !== prev.meta.effect || next.meta.theme !== prev.meta.theme;
      if (swap) layer.setEffect(next.meta.effect, paramsOf(next), THEMES[next.meta.theme], 'crossfade');
      else layer.setParams(paramsOf(next));
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(leanFrame);
      sizeWatch?.disconnect();
      fitWatch?.disconnect();
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
      stopMotion();
      counter.destroy();
      layer.destroy();
    },
  };
}
