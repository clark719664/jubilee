/**
 * view.ts — mounts Seek & Find: the holiday scene full-screen over its sky, pan/zoom, the strip of
 * mystery cards, finds, misses, hints, keyboard search and the finish card.
 *
 *   .seek.sky                      the holiday sky gradient (theme --h-* vars)
 *     .seek-stage                  pointer + keyboard surface (role=application)
 *       .seek-plane (back, mid)    1600×900 artboard, CSS-transformed by the current View
 *       canvas.seek-fx             the holiday's ambient effect, fading out as the child zooms in
 *       .seek-plane (front)        foreground framing
 *       .seek-marks                screen-space stamps, ripples, sparkles, the hint glow, the keyboard aim
 *     header.seek-top              back, title + count, hint, zoom − +
 *     .seek-strip                  the cards to find
 *     .seek-done                   the finish card (dialog)
 */
import { stickerUrl } from '../../art/index';
import { formatIso } from '../../dates/civil';
import { EffectLayer } from '../../effects/layer';
import type { MotionMode } from '../../effects/types';
import { h, trapFocus } from '../../ui/dom';
import { speak } from '../../ui/greetings';
import { icon } from '../../ui/icons';
import type { ActivityInstance, PlayEnv } from '../types';
import { CHEERS, COPY, capital, say, thing } from './copy';
import {
  artToScreen, bandCentre, cssTransform, startView, focusView, fxOpacity, hintCircle, hintDisc, hitTest, isVisible,
  panBy, scaleLimits, screenToArt, tapSlop, type Point, type View, type Viewport,
} from './geometry';
import { PanZoom, type PanZoomOptions } from './panzoom';
import { buildCard, buildStamp, cheer, confetti, place, popOut, ripple, sparkle, type CardParts } from './parts';
import { resumeFound, sceneProgress, seekStorage, withFound, withRoundDone } from './progress';
import type { SeekScene } from './scene';

const AIM_STEP = 45;
const AIM_MARGIN = 30;
const ZOOM_STEP = 1.5;

export function mountSeek(env: PlayEnv, scene: SeekScene): ActivityInstance {
  const { ctx, meta, theme } = env;
  const items = scene.findables;
  const ids = items.map((f) => f.id);
  const byId = new Map(items.map((f) => [f.id, f] as const));
  const storage = seekStorage(ctx.clock.pretending);
  let save = storage.read();
  const before = sceneProgress(save, meta.id);
  const found = new Set<string>(resumeFound(save, meta.id, ids));
  const midUrl = scene.layers.find((l) => l.name === 'mid')?.url ?? null;
  const reduced = (): boolean => ctx.motion !== 'full';
  const colours = [theme.glow, theme.accent, theme.accent2, '#ffffff'];
  const disposers: (() => void)[] = [];
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number): void => {
    const t = window.setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
  };

  // ── picture ──
  const plane = (names: readonly string[]): HTMLElement => {
    const el = h('div', { class: 'seek-plane', 'aria-hidden': 'true' });
    for (const layer of scene.layers) {
      if (!names.includes(layer.name)) continue;
      const img = h('img', { class: `seek-layer seek-layer-${layer.name}`, src: layer.url, alt: '', decoding: 'async' });
      img.setAttribute('draggable', 'false');
      el.append(img);
    }
    return el;
  };
  const behind = plane(['back', 'mid']);
  const front = plane(['front']);
  const canvas = h('canvas', { class: 'seek-fx', 'aria-hidden': 'true' });
  const marks = h('div', { class: 'seek-marks', 'aria-hidden': 'true' });
  const aim = h('span', { class: 'seek-aim' });
  const glow = h('span', { class: 'seek-glow', hidden: true });
  marks.append(glow, aim);
  const stage = h('div', {
    class: 'seek-stage', tabindex: 0, role: 'application', 'aria-roledescription': 'picture',
    'aria-label': say('stage', { holiday: meta.name }),
  }, behind, canvas, front, marks);

  // ── chrome ──
  const countText = h('span', { class: 'seek-count-text' });
  const dots = h('span', { class: 'seek-dots', 'aria-hidden': 'true' }, ...items.map(() => h('i')));
  const title = h('h1', { class: 'seek-title', id: `seek-title-${meta.id}` }, COPY.title);
  const hintBtn = h('button', { class: 'btn seek-hint', type: 'button', hidden: found.size >= items.length }, icon('sparkle'), COPY.hint);
  const zoomOut = h('button', { class: 'btn btn-icon seek-round', type: 'button', 'aria-label': COPY.zoomOut }, icon('minus'));
  const zoomIn = h('button', { class: 'btn btn-icon seek-round', type: 'button', 'aria-label': COPY.zoomIn }, icon('plus'));
  const back = h('button', { class: 'btn btn-icon seek-round', type: 'button', 'aria-label': say('back', { holiday: meta.name }) }, icon('back'));
  const top = h('header', { class: 'seek-top' },
    back,
    h('div', { class: 'seek-heading' }, h('span', { class: 'seek-kicker' }, meta.name), title),
    h('span', { class: 'seek-spacer' }),
    h('span', { class: 'seek-zoom' }, zoomOut, zoomIn),
  );
  const ribbon = before.done
    ? h('p', { class: 'seek-ribbon' }, h('span', { class: 'seek-ribbon-star', 'aria-hidden': 'true' }, '⭐'), COPY.ribbon)
    : null;
  const coach = h('p', { class: 'seek-coach', 'aria-hidden': 'true' }, h('span', { class: 'seek-coach-hand' }, '👆'), COPY.coach);

  const cards = new Map<string, CardParts>();
  const list = h('ul', { class: 'seek-cards' });
  items.forEach((f, i) => {
    const card = buildCard(f, midUrl, i);
    cards.set(f.id, card);
    list.append(card.li);
  });
  const strip = h('nav', { class: 'seek-strip', 'aria-label': COPY.findHeading },
    h('div', { class: 'seek-strip-head' },
      h('p', { class: 'seek-strip-title', 'aria-hidden': 'true' }, COPY.findHeading),
      h('span', { class: 'seek-count' }, dots, countText),
      h('span', { class: 'seek-spacer' }),
      hintBtn),
    list);

  const root = h('section', { class: 'seek sky', 'data-motion': ctx.motion, 'aria-labelledby': title.id },
    stage, top, ...(ribbon ? [ribbon] : []), coach, strip);

  // ── state ──
  let selected: string | null = null;
  let aimAt: Point | null = null;
  let hint: { id: string; x: number; y: number; r: number } | null = null;
  let hintCount = 0;
  let cheerIndex = (meta.id.length * 7) % CHEERS.length;
  let finished = false;
  let doneEl: HTMLElement | null = null;
  const stamps = new Map<string, HTMLElement>();

  // ── ambient effect (between mid and front, exactly as on the hero) ──
  let fx: EffectLayer | null = null;
  try {
    fx = new EffectLayer(canvas, stage, { input: false, seed: 11, maxDpr: 1.5 });
    // The picture is drawn: an empty stage ('scene mode') keeps the effect to its ambient sparkle, no set pieces on top of the art.
    fx.setEffect(meta.effect, { ...(meta.effectParams ?? {}), stage: {} }, theme);
    fx.setMotion(ctx.motion);
    fx.setIntensity(0.75);
  } catch {
    fx = null;
    canvas.hidden = true;
  }

  // ── viewport + pan/zoom ──
  const measure = (): Viewport => {
    const r = stage.getBoundingClientRect();
    const w = Math.max(1, r.width || window.innerWidth);
    const hh = Math.max(1, r.height || window.innerHeight);
    const topH = Math.min(hh * 0.3, top.getBoundingClientRect().bottom - r.top + 4);
    const bottomH = Math.min(hh * 0.4, r.bottom - strip.getBoundingClientRect().top);
    return { w, h: hh, top: Math.max(0, topH), bottom: Math.max(0, bottomH) };
  };

  const render = (v: View, vp: Viewport): void => {
    const t = cssTransform(v);
    behind.style.transform = t;
    front.style.transform = t;
    canvas.style.opacity = String(fxOpacity(v, vp));
    for (const [id, el] of stamps) {
      const f = byId.get(id);
      if (!f) continue;
      const p = artToScreen(v, f);
      place(el, p.x, p.y, Math.max(44, f.r * 2 * v.s + 12));
    }
    if (hint) {
      const target = byId.get(hint.id);
      const g = hintDisc(v, vp, hint, target ?? hint);
      place(glow, g.x, g.y, g.d);
    }
    const c = aimAt ?? bandCentre(vp);
    place(aim, c.x, c.y);
    const lim = scaleLimits(vp);
    zoomIn.disabled = v.s >= lim.max - 1e-6;
    zoomOut.disabled = v.s <= lim.min + 1e-6;
  };

  const pz = new PanZoomLazy();

  // ── finds ──
  const refreshCount = (): void => {
    countText.textContent = say('count', { n: found.size, total: items.length });
    dots.querySelectorAll('i').forEach((dot, i) => dot.classList.toggle('is-on', i < found.size));
  };

  const persist = (): void => {
    save = withFound(save, meta.id, found, ids);
    storage.write(save);
  };

  const addStamp = (id: string, fresh: boolean): void => {
    if (stamps.has(id)) return;
    const el = buildStamp();
    if (fresh) el.classList.add('is-new');
    stamps.set(id, el);
    marks.insertBefore(el, glow);
    const card = cards.get(id);
    if (card) {
      card.button.classList.add('is-found');
      if (fresh) card.button.classList.add('is-new');
      card.button.setAttribute('aria-label', say('cardFound', { thing: capital(thing(byId.get(id)?.label ?? '')) }));
    }
  };

  const markFound = (id: string): void => {
    const f = byId.get(id);
    if (!f || found.has(id)) return;
    found.add(id);
    addStamp(id, true);
    render(pz.get().view, pz.get().viewport);
    persist();
    refreshCount();
    if (hint && hint.id === id) clearHint();
    if (selected === id) setSelected(null);
    const v = pz.get().view;
    const p = artToScreen(v, f);
    if (!reduced()) {
      if (midUrl) popOut(marks, midUrl, f, v.s, v.ox, v.oy);
      sparkle(marks, p.x, p.y, colours);
      fx?.burst(p.x, p.y);
    }
    const cheerText = CHEERS[cheerIndex++ % CHEERS.length] ?? CHEERS[0];
    cheer(marks, p.x, p.y - Math.max(30, f.r * v.s), cheerText);
    const left = items.length - found.size;
    ctx.announce(`${say('found', { thing: thing(f.label) })} ${left === 0 ? '' : left === 1 ? COPY.leftOne : say('left', { n: left })}`.trim());
    hintBtn.hidden = left === 0;
    if (left === 0) later(finish, reduced() ? 400 : 1100);
  };

  const onTap = (pt: Point): void => {
    hideCoach();
    if (finished && doneEl) return;
    const v = pz.get().view;
    const art = screenToArt(v, pt);
    const hit = hitTest(items, art, tapSlop(v.s), found);
    if (hit && !hit.already) {
      markFound(hit.id);
    } else if (hit) {
      const el = stamps.get(hit.id);
      if (el && !reduced()) {
        el.classList.remove('is-wiggle');
        void el.offsetWidth;
        el.classList.add('is-wiggle');
      }
      ctx.announce(say('already', { thing: thing(byId.get(hit.id)?.label ?? '') }));
    } else {
      ripple(marks, pt.x, pt.y);
    }
  };

  // ── hints ──
  const clearHint = (): void => {
    hint = null;
    glow.hidden = true;
    glow.classList.remove('is-on');
  };
  const showHint = (): void => {
    if (hint) return;
    const target = (selected && !found.has(selected) ? byId.get(selected) : undefined) ?? items.find((f) => !found.has(f.id));
    if (!target) return;
    const c = hintCircle(target, ++hintCount);
    hint = { id: target.id, ...c };
    const { view, viewport } = pz.get();
    const go = isVisible(view, viewport, target, 60) ? Promise.resolve() : pz.get().flyTo(focusView(viewport, c, view.s));
    void go.then(() => {
      glow.hidden = false;
      glow.classList.remove('is-on');
      void glow.offsetWidth;
      glow.classList.add('is-on');
      render(pz.get().view, pz.get().viewport);
      later(() => { if (hint && hint.id === target.id) clearHint(); }, 4200);
    });
    ctx.announce(COPY.hintSay);
  };

  // ── cards: picking one says its name and points the Hint at it ──
  const setSelected = (id: string | null): void => {
    selected = id;
    for (const [cid, card] of cards) card.button.classList.toggle('is-selected', cid === id);
  };
  list.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('.seek-card');
    const id = btn?.dataset.id;
    if (!btn || !id) return;
    hideCoach();
    if (found.has(id)) {
      const f = byId.get(id);
      if (f) void pz.get().flyTo(focusView(pz.get().viewport, f, pz.get().view.s));
      return;
    }
    setSelected(id);
    btn.classList.remove('is-bounce');
    void btn.offsetWidth;
    btn.classList.add('is-bounce');
    const lookFor = say('lookFor', { thing: thing(byId.get(id)?.label ?? '') });
    speak(lookFor, 'en');
    ctx.announce(lookFor);
  });

  // Arrows steer the ring; at the edge of the visible band it pushes the picture along instead.
  const moveAim = (dx: number, dy: number): void => {
    const { view, viewport } = pz.get();
    const from = aimAt ?? bandCentre(viewport);
    const x = from.x + dx;
    const y = from.y + dy;
    aimAt = {
      x: Math.min(viewport.w - AIM_MARGIN, Math.max(AIM_MARGIN, x)),
      y: Math.min(viewport.h - viewport.bottom - AIM_MARGIN, Math.max(viewport.top + AIM_MARGIN, y)),
    };
    pz.get().set(panBy(view, viewport, aimAt.x - x, aimAt.y - y));
    render(pz.get().view, viewport);
  };

  // ── stage keys: arrows steer the ring, Enter or Space picks what is in it, + − zoom, 0 back to the whole scene ──
  stage.addEventListener('keydown', (e) => {
    const { viewport } = pz.get();
    let move: readonly [number, number] | null = null;
    if (e.key === 'ArrowLeft') move = [-AIM_STEP, 0];
    else if (e.key === 'ArrowRight') move = [AIM_STEP, 0];
    else if (e.key === 'ArrowUp') move = [0, -AIM_STEP];
    else if (e.key === 'ArrowDown') move = [0, AIM_STEP];
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); void pz.get().zoomBy(ZOOM_STEP, bandCentre(viewport)); return; }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); void pz.get().zoomBy(1 / ZOOM_STEP, bandCentre(viewport)); return; }
    else if (e.key === '0') { e.preventDefault(); void pz.get().flyTo(startView(viewport)); return; }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(aimAt ?? bandCentre(viewport)); return; }
    if (move) { e.preventDefault(); hideCoach(); moveAim(move[0], move[1]); }
  });

  // Esc anywhere else goes back to the holiday page (the overlays handle their own Esc first).
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    env.close();
  });

  zoomIn.addEventListener('click', () => { hideCoach(); void pz.get().zoomBy(ZOOM_STEP, bandCentre(pz.get().viewport)); });
  zoomOut.addEventListener('click', () => { hideCoach(); void pz.get().zoomBy(1 / ZOOM_STEP, bandCentre(pz.get().viewport)); });
  hintBtn.addEventListener('click', showHint);
  back.addEventListener('click', () => env.close());

  // ── coach mark ──
  let coachShown = true;
  const hideCoach = (): void => {
    if (!coachShown) return;
    coachShown = false;
    coach.classList.add('is-leaving');
    later(() => coach.remove(), 400);
  };
  // Seasoned seekers (a finished or resumed round) do not need the how-to.
  if (before.done || found.size > 0) { coachShown = false; coach.remove(); } else later(hideCoach, 6500);

  // ── finish ──
  const finish = (): void => {
    if (finished) return;
    finished = true;
    hintBtn.hidden = true;
    clearHint();
    save = withRoundDone(save, meta.id, formatIso(ctx.clock.today()));
    storage.write(save);
    const rounds = sceneProgress(save, meta.id).rounds ?? 1;
    void pz.get().flyTo(startView(pz.get().viewport), 600);
    showDone(rounds);
  };

  const showDone = (rounds: number): void => {
    const sticker = stickerUrl(meta.id);
    const art = sticker
      ? h('img', { class: 'seek-done-sticker', src: sticker, alt: '' })
      : h('span', { class: 'seek-done-emoji emoji', 'aria-hidden': 'true' }, meta.emoji);
    const recap = h('ul', { class: 'seek-recap', 'aria-hidden': 'true' },
      ...items.map((f, i) => {
        const c = buildCard(f, midUrl, i);
        c.button.classList.add('is-found');
        c.button.tabIndex = -1;
        return h('li', {}, c.button.querySelector('.seek-thumb') ?? '');
      }));
    const againBtn = h('button', { class: 'btn btn-secondary', type: 'button' }, icon('shuffle'), COPY.again);
    const admireBtn = h('button', { class: 'btn btn-ghost seek-admire', type: 'button' }, COPY.admire);
    const homeBtn = h('button', { class: 'btn btn-lg', type: 'button' }, say('back', { holiday: meta.name }));
    const titleId = `seek-done-${meta.id}`;
    const card = h('div', { class: 'seek-done-card card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
      h('div', { class: 'seek-done-art' }, art, h('span', { class: 'seek-done-stamp' }, COPY.stampWord)),
      h('h2', { class: 'h2 seek-done-title', id: titleId }, COPY.done),
      h('p', { class: 'seek-done-body' }, say('doneBody', { holiday: meta.name })),
      rounds > 1 ? h('p', { class: 'seek-done-rounds' }, '⭐ ', say('doneRounds', { n: rounds })) : null,
      recap,
      h('div', { class: 'seek-done-actions' }, homeBtn, againBtn, admireBtn));
    const overlay = h('div', { class: 'seek-done' }, card);
    doneEl = overlay;
    root.append(overlay);
    if (!reduced()) confetti(overlay, colours, found.size * 97 + rounds);
    const untrap = trapFocus(card);
    const close = (): void => { untrap(); overlay.remove(); doneEl = null; };
    homeBtn.addEventListener('click', () => env.close());
    againBtn.addEventListener('click', () => { close(); playAgain(); });
    admireBtn.addEventListener('click', () => { close(); stage.focus({ preventScroll: true }); });
    overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); stage.focus({ preventScroll: true }); } });
    later(() => homeBtn.focus({ preventScroll: true }), 50);
    ctx.announce(`${COPY.done} ${say('doneBody', { holiday: meta.name })}`);
  };

  const playAgain = (): void => {
    finished = false;
    found.clear();
    for (const el of stamps.values()) el.remove();
    stamps.clear();
    for (const card of cards.values()) {
      card.button.classList.remove('is-found', 'is-new');
      const f = byId.get(card.button.dataset.id ?? '');
      if (f) card.button.setAttribute('aria-label', say('card', { thing: thing(f.label) }));
    }
    setSelected(null);
    refreshCount();
    hintBtn.hidden = found.size >= items.length;
    void pz.get().flyTo(startView(pz.get().viewport));
    cards.get(ids[0] ?? '')?.button.focus({ preventScroll: true });
  };

  // ── motion follows the Sparkle toggle / grown-ups setting live ──
  const applyMotion = (mode: MotionMode): void => {
    root.setAttribute('data-motion', mode);
    fx?.setMotion(mode);
  };
  disposers.push(ctx.onMotionChange(applyMotion));

  // ── start once the root is in the document (sizes are real) ──
  const start = (): void => {
    pz.init({
      stage,
      measure,
      initial: startView,
      onChange: render,
      onTap,
      reduced,
    });
    for (const id of found) addStamp(id, false);
    refreshCount();
    render(pz.get().view, pz.get().viewport);
    fx?.start();
    hintBtn.hidden = found.size >= items.length;
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => pz.get().resize()) : null;
    ro?.observe(stage);
    ro?.observe(strip);
    if (ro) disposers.push(() => ro.disconnect());
  };
  let raf = requestAnimationFrame(function wait() {
    if (root.isConnected) { raf = 0; start(); } else raf = requestAnimationFrame(wait);
  });

  return {
    el: root,
    destroy() {
      if (raf) cancelAnimationFrame(raf);
        for (const t of timers) window.clearTimeout(t);
      timers.clear();
      for (const d of disposers) d();
      pz.destroy();
      fx?.destroy();
    },
  };
}

/** Holds the PanZoom once the stage is in the document (sizes are only real then). */

class PanZoomLazy {
  private pz: PanZoom | null = null;
  init(o: PanZoomOptions): void { this.pz = new PanZoom(o); }
  get(): PanZoom {
    if (!this.pz) throw new Error('Seek & Find stage is not mounted yet');
    return this.pz;
  }
  destroy(): void { this.pz?.destroy(); this.pz = null; }
}
