/**
 * stage.ts — the quiz's globe: the World view's Globe on its own canvas, plus what a quiz needs on
 * top of it (zoom buttons, a crosshair and "In the middle: India" label for keyboard players, a
 * one-line hint bubble, sparkles).
 *
 *   const stage = new QuizStage({ motion, onPick: (iso, at) => …, onSea: () => …, onPin: … });
 *   stage.ask(question, palette);        // camera, mode and markers for a new question
 *   stage.showRight(iso, holidayEmoji);  // lights the country in the holiday accent, sparkle
 *   stage.showAnswer(question, tapped);  // gently turns to the right place and lights it
 *
 * Keyboard (on the focused globe): arrows turn it 15°, + and − zoom, Enter or Space picks the
 * country under the crosshair. Under reduced motion every turn is a cut (the Globe snaps).
 */
import type { MotionMode } from '../../effects/types';
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { CELEBRATED } from '../../world/data/celebrated';
import { lonDelta, normLon } from '../../world/geo';
import { Globe, type GlobeHit, type GlobeMarker } from '../../world/globe';
import type { GlobeColors } from '../../world/palette';
import { countryCenter } from '../../world/shapes';
import { COPY, fill } from './copy';
import { countryLabel } from './places';
import type { MapQuestion } from './questions';
import { sparkle } from './sparkle';

export interface StageOptions {
  readonly motion: MotionMode;
  /** A country (or a city pin's country) was picked; `at` is where, in stage px, when known. */
  readonly onPick: (iso: string, at: { x: number; y: number } | null) => void;
  /** The child tapped the sea or picked empty space with the keyboard. */
  readonly onMiss: (where: 'sea' | 'space') => void;
  /** The country in the middle changed after keyboard turns (for the screen reader). */
  readonly onMiddle?: (text: string) => void;
}

const MIDDLE_MS = 420;

export class QuizStage {
  readonly el: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly globe: Globe;
  private readonly middle: HTMLElement;
  private readonly hint: HTMLElement;
  private readonly zoomBox: HTMLElement;
  private motion: MotionMode;
  private q: MapQuestion | null = null;
  private palette: GlobeColors | null = null;
  private lastTap: { x: number; y: number } | null = null;
  private middleTimer = 0;
  private hintTimer = 0;
  private sparkles: (() => void)[] = [];
  private touched = false;

  constructor(private readonly opts: StageOptions) {
    this.motion = opts.motion;
    this.canvas = h('canvas', { class: 'quiz-canvas', role: 'img', 'aria-label': COPY.spinHint });
    this.middle = h('span', { class: 'quiz-middle', 'aria-hidden': 'true' }, COPY.middleNone);
    this.hint = h('span', { class: 'quiz-hint', 'aria-hidden': 'true' }, COPY.spinHint);
    const zoomIn = h('button', { type: 'button', class: 'btn btn-secondary btn-icon', 'aria-label': COPY.zoomIn, onclick: () => this.zoom(1.5) }, icon('plus', 22));
    const zoomOut = h('button', { type: 'button', class: 'btn btn-secondary btn-icon', 'aria-label': COPY.zoomOut, onclick: () => this.zoom(1 / 1.5) }, icon('minus', 22));
    this.zoomBox = h('div', { class: 'quiz-zoom' }, zoomIn, zoomOut);
    this.el = h('div', {
      class: 'quiz-globe', tabindex: 0, role: 'group', 'aria-roledescription': 'globe', 'aria-label': COPY.hostLabel,
    }, this.canvas, h('span', { class: 'quiz-cross', 'aria-hidden': 'true' }), this.middle, this.hint, this.zoomBox);

    this.globe = new Globe(this.canvas, {
      motion: this.motion,
      keyTarget: this.el,
      onSelect: (hit) => this.onSelect(hit),
      onInteract: () => this.interacted(),
    });
    this.globe.setNight(false);
    // Remember where a finger landed, so the sparkle bursts from the fingertip.
    this.canvas.addEventListener('pointerdown', this.onDown);
    this.el.addEventListener('keydown', this.onKey);
  }

  start(): void { this.globe.start(); }

  stop(): void { this.globe.stop(); }

  setMotion(m: MotionMode): void {
    this.motion = m;
    this.globe.setMotion(m);
  }

  /** Sets up the globe for a new question. */
  ask(q: MapQuestion, palette: GlobeColors): void {
    this.q = q;
    this.palette = palette;
    for (const s of this.sparkles) s();
    this.sparkles = [];
    this.globe.setColors(palette);
    this.globe.setMode(q.view);
    this.globe.setNight(false);
    this.globe.setNewDay(null);
    this.globe.setSelected(null);
    this.globe.setHighlight(null);
    this.globe.setMarkers(q.pins.map((p) => ({ id: p.iso, lon: p.lon, lat: p.lat, emoji: q.place === 'new-year' ? '🎆' : '📍', label: p.label, size: 34 })));
    this.globe.setZoom(1);
    const start = this.startView(q);
    if (q.view === 'map') this.globe.setZoom(start.zoom);
    if (this.motion === 'full' && q.view === 'globe') this.globe.spinTo(start.lon, start.lat, 900);
    else this.globe.setCenter(start.lon, start.lat);
    this.el.classList.toggle('is-map', q.view === 'map');
    this.canvas.setAttribute('aria-label', q.prompt);
    this.showHint(this.touched ? null : COPY.spinHint);
    this.updateMiddleSoon();
  }

  /** Where the camera starts: over the celebrating countries, or a spin away from a named one. */
  private startView(q: MapQuestion): { lon: number; lat: number; zoom: number } {
    if (q.view === 'map') {
      const [a, b] = q.pins;
      if (!a || !b) return { lon: 0, lat: 0, zoom: 1 };
      // Fit both pins (with room for their labels): zoom so their gap spans about two thirds of the map.
      const gap = Math.abs(lonDelta(a.lon, b.lon));
      const mid = normLon(a.lon + lonDelta(a.lon, b.lon) / 2);
      const zoom = Math.max(1, Math.min(2.2, 240 / Math.max(40, gap + 50)));
      return { lon: mid, lat: (a.lat + b.lat) / 2, zoom };
    }
    const focus = CELEBRATED[q.holiday]?.focus;
    const centre = countryCenter(q.primary);
    if (q.place === 'doing' || q.any) {
      if (focus) return { lon: focus[0], lat: focus[1], zoom: 1 };
      return centre ? { lon: centre.lon, lat: centre.lat, zoom: 1 } : { lon: 0, lat: 20, zoom: 1 };
    }
    const lon = normLon((centre?.lon ?? 0) + q.startOffset);
    return { lon, lat: 18, zoom: 1 };
  }

  /**
   * The child found it: the country lit in the holiday accent and outlined, a sticker on it, a
   * sparkle where they tapped. `lit` adds the other right answers ("and here are all the others").
   */
  showRight(iso: string, emoji: string, at: { x: number; y: number } | null, lit: readonly string[] = [iso]): void {
    const p = this.palette;
    this.globe.setHighlight(lit.includes(iso) ? lit : [...lit, iso], p?.highlight);
    this.globe.setSelected(iso);
    const c = this.centreOf(iso);
    const markers: GlobeMarker[] = [...this.pinMarkers()];
    if (c && this.q?.view === 'globe') markers.push({ lon: c.lon, lat: c.lat, emoji, label: countryLabel(iso), size: 36, pulse: true });
    this.globe.setMarkers(markers);
    if (!at && c && this.q?.view === 'globe') this.globe.spinTo(c.lon, c.lat, 700);
    const point = at ?? { x: this.el.clientWidth / 2, y: this.el.clientHeight / 2 };
    this.sparkles.push(sparkle(this.el, point.x, point.y, [p?.highlight ?? '#ffd166', '#ffffff', p?.trail ?? '#ffe9a3'], this.motion));
    this.showHint(null);
  }

  /** A different place was picked: gently turn to the right one and light it (and every other right one). */
  showAnswer(q: MapQuestion, tapped: string, emoji: string, now: Date | null): void {
    const lit = q.view === 'map' ? [q.primary] : q.answers;
    this.globe.setHighlight(lit, this.palette?.highlight);
    this.globe.setSelected(q.primary);
    const markers: GlobeMarker[] = [...this.pinMarkers()];
    const c = this.centreOf(q.primary);
    const t = this.centreOf(tapped);
    if (q.view === 'globe') {
      if (t && tapped !== q.primary) markers.push({ lon: t.lon, lat: t.lat, dot: '#ffffff', label: countryLabel(tapped), size: 12 });
      if (c) markers.push({ lon: c.lon, lat: c.lat, emoji, label: countryLabel(q.primary), size: 36, pulse: true });
    }
    this.globe.setMarkers(markers);
    if (now && q.place === 'night') { this.globe.setTime(now); this.globe.setNight(true); }
    if (q.view === 'globe' && c) this.globe.spinTo(c.lon, c.lat, 1100);
    this.showHint(null);
  }

  /** Night question: shade the night side for the reveal even when the child picked right. */
  showNight(now: Date): void {
    this.globe.setTime(now);
    this.globe.setNight(true);
  }

  /** Turns to a country picked from the list, then reports where it is on screen (the middle). */
  focusCountry(iso: string): void {
    const c = this.centreOf(iso);
    if (c && this.q?.view === 'globe') this.globe.spinTo(c.lon, c.lat, 600);
  }

  say(text: string): void {
    this.showHint(text, 2600);
  }

  focus(): void { this.el.focus({ preventScroll: true }); }

  destroy(): void {
    window.clearTimeout(this.middleTimer);
    window.clearTimeout(this.hintTimer);
    for (const s of this.sparkles) s();
    this.canvas.removeEventListener('pointerdown', this.onDown);
    this.el.removeEventListener('keydown', this.onKey);
    this.globe.destroy();
  }

  // ───────────────────────────────────────────── internals

  private pinMarkers(): GlobeMarker[] {
    const q = this.q;
    if (!q) return [];
    return q.pins.map((p) => ({ id: p.iso, lon: p.lon, lat: p.lat, emoji: q.place === 'new-year' ? '🎆' : '📍', label: p.label, size: 34 }));
  }

  private centreOf(iso: string): { lon: number; lat: number } | null {
    const pin = this.q?.pins.find((p) => p.iso === iso);
    if (pin) return { lon: pin.lon, lat: pin.lat };
    return countryCenter(iso);
  }

  private zoom(f: number): void {
    this.globe.zoomBy(f);
    this.interacted();
  }

  private interacted(): void {
    if (!this.touched) { this.touched = true; this.showHint(null); }
  }

  private showHint(text: string | null, ms = 0): void {
    window.clearTimeout(this.hintTimer);
    if (text === null) { this.hint.classList.remove('is-on'); return; }
    this.hint.textContent = text;
    this.hint.classList.add('is-on');
    if (ms > 0) this.hintTimer = window.setTimeout(() => this.hint.classList.remove('is-on'), ms);
  }

  private readonly onDown = (e: PointerEvent): void => {
    const r = this.el.getBoundingClientRect();
    this.lastTap = { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  private readonly onKey = (e: KeyboardEvent): void => {
    if (e.key.startsWith('Arrow') || e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_') {
      this.interacted();
      this.updateMiddleSoon();
    }
    if (e.key === 'Enter' || e.key === ' ') this.lastTap = null;
  };

  private updateMiddleSoon(): void {
    window.clearTimeout(this.middleTimer);
    this.middleTimer = window.setTimeout(() => {
      const w = this.el.clientWidth;
      const hgt = this.el.clientHeight;
      if (w < 2 || hgt < 2) return;
      const hit = this.globe.hitTest(w / 2, hgt / 2);
      const text = hit.kind === 'country' ? fill(COPY.middle, { name: countryLabel(hit.iso) })
        : hit.kind === 'marker' ? fill(COPY.middle, { name: hit.marker.label ?? '' })
          : hit.kind === 'ocean' ? COPY.middleSea : COPY.middleNone;
      if (this.middle.textContent !== text) {
        this.middle.textContent = text;
        if (document.activeElement === this.el) this.opts.onMiddle?.(text);
      }
    }, MIDDLE_MS);
  }

  private onSelect(hit: GlobeHit): void {
    const at = this.lastTap;
    this.lastTap = null;
    if (hit.kind === 'marker') {
      const iso = hit.marker.id ?? '';
      if (iso) this.opts.onPick(iso, at);
      return;
    }
    if (hit.kind === 'country') { this.opts.onPick(hit.iso, at); return; }
    this.opts.onMiss(hit.kind === 'ocean' ? 'sea' : 'space');
  }
}
