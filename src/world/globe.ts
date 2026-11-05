/**
 * The World view's spinnable globe (and flat map) on one canvas.
 *
 *   const globe = new Globe(canvas, { onSelect: (hit) => …, motion: 'full' });
 *   globe.setHighlight(new Set(['IN', 'NP']), '#ffb703');
 *   globe.spinTo(78, 22);                 // eased; snaps under reduced motion
 *   globe.start();                        // renders only when something changed or moves
 *
 * Input: drag to spin and let go mid-swipe to fling it (globe-camera.ts); wheel or pinch to
 * zoom (clamped; buttons and keys ease); tap to select. On the focused host, arrow keys turn
 * 15°, +/− zoom and Enter reports what is in the middle. The loop is requestAnimationFrame-
 * driven but idles: a frame is drawn only when the scene is dirty, the camera moves, a ticker
 * is installed (live trackers), or a pulse marker or the sleigh needs animating (≤ 30 fps).
 * It pauses when the page is hidden or the canvas scrolls out of view. DPR is capped at 2.
 */
import type { MotionMode } from '../effects/types';
import { RAD, type LonLat } from './geo';
import { GlobeCamera } from './globe-camera';
import { DEFAULT_COLORS, GlobeRenderer, type GlobeColors, type GlobeMarker, type GlobeMode } from './globe-draw';
import { countryAt } from './shapes';

export type { GlobeColors, GlobeMarker, GlobeMode };

export type GlobeHit =
  | { readonly kind: 'marker'; readonly marker: GlobeMarker; readonly index: number }
  | { readonly kind: 'country'; readonly iso: string; readonly name: string; readonly lon: number; readonly lat: number }
  | { readonly kind: 'ocean'; readonly lon: number; readonly lat: number }
  | { readonly kind: 'space' };

export interface GlobeOptions {
  readonly mode?: GlobeMode;
  readonly center?: LonLat;
  readonly colors?: Partial<GlobeColors>;
  readonly motion?: MotionMode;
  readonly maxDpr?: number;
  /** A tap or click (or Enter on the focused host, for the middle of the view). */
  readonly onSelect?: (hit: GlobeHit) => void;
  /** The child took hold of the globe (drag, pinch, wheel, keys): pause automatic cameras. */
  readonly onInteract?: () => void;
  /** Element that listens for keys (defaults to the canvas's parent). */
  readonly keyTarget?: HTMLElement;
}

const KEY_STEP = 15;
const TAP_SLOP = 8;
const TAP_MS = 700;
const GLOBE_FILL = 0.44;

interface Drag { x: number; y: number; sx: number; sy: number; t0: number; moved: number; started: boolean }

export class Globe {
  private readonly r = new GlobeRenderer(() => this.invalidate());
  private readonly cam = new GlobeCamera();
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly keyTarget: HTMLElement | null;
  private readonly maxDpr: number;
  private readonly onSelect: ((hit: GlobeHit) => void) | undefined;
  private readonly onInteract: (() => void) | undefined;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private ticker: ((ts: number) => void) | null = null;
  private hasPulse = false;
  private running = false;
  private onScreen = true;
  private dirty = true;
  private raf = 0;
  private lastTs = 0;
  private lastDraw = 0;
  private readonly born = typeof performance !== 'undefined' ? performance.now() : 0;
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private drag: Drag | null = null;
  private pinch: { dist: number; zoom: number } | null = null;
  private rect: DOMRect | null = null;
  private ro: ResizeObserver | null = null;
  private io: IntersectionObserver | null = null;

  constructor(private readonly canvas: HTMLCanvasElement, opts: GlobeOptions = {}) {
    this.ctx = canvas.getContext('2d');
    this.keyTarget = opts.keyTarget ?? canvas.parentElement;
    this.maxDpr = opts.maxDpr ?? 2;
    this.onSelect = opts.onSelect;
    this.onInteract = opts.onInteract;
    this.cam.motion = opts.motion ?? 'full';
    this.r.animate = this.cam.motion === 'full';
    if (opts.mode) { this.r.mode = opts.mode; this.cam.mode = opts.mode; }
    if (opts.center) this.cam.setCenter(opts.center.lon, opts.center.lat);
    if (opts.colors) this.r.setColors({ ...DEFAULT_COLORS, ...opts.colors });
    this.r.setTime(new Date());

    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onCancel);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.keyTarget?.addEventListener('keydown', this.onKey);
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(canvas.parentElement ?? canvas);
    }
    if (typeof IntersectionObserver !== 'undefined') {
      this.io = new IntersectionObserver((entries) => {
        this.onScreen = entries.some((e) => e.isIntersecting);
        if (this.onScreen) this.invalidate();
      });
      this.io.observe(canvas);
    }
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  // ───────────────────────────────────────────────────── scene

  get mode(): GlobeMode { return this.r.mode; }

  setMode(mode: GlobeMode): void {
    if (mode === this.r.mode) return;
    this.r.mode = mode;
    this.cam.mode = mode;
    this.cam.stopGlide();
    this.invalidate();
  }

  setColors(colors: Partial<GlobeColors>): void {
    this.r.setColors({ ...DEFAULT_COLORS, ...colors });
    this.invalidate();
  }

  setHighlight(isos: Iterable<string> | null, color?: string): void {
    this.r.setHighlight(new Set(isos ?? []), color);
    this.invalidate();
  }

  /** Outlines one country (a tapped one); null clears. */
  setSelected(iso: string | null): void {
    this.r.selected = iso;
    this.invalidate();
  }

  setMarkers(markers: readonly GlobeMarker[]): void {
    this.r.markers = markers;
    this.hasPulse = markers.some((m) => m.pulse === true || m.sprite === 'sleigh');
    this.invalidate();
  }

  setTrail(points: readonly LonLat[] | null): void {
    this.r.setTrail(points);
    this.invalidate();
  }

  setTrailHead(lon: number, lat: number): void {
    this.r.setTrailHead(lon, lat);
    this.invalidate();
  }

  /** An illustrated sleigh (world art, facing left) in place of the vector one; null reverts. */
  setSleighArt(url: string | null): void {
    this.r.overlay.sleigh.setArt(url);
    this.invalidate();
  }

  setNight(on: boolean): void {
    this.r.night = on;
    this.invalidate();
  }

  setTime(date: Date): void {
    this.r.setTime(date);
    this.invalidate();
  }

  /** Midnight wave: tint everything east of `meridian` up to the date line (null = off). */
  setNewDay(meridian: number | null): void {
    this.r.setNewDay(meridian);
    this.invalidate();
  }

  setLights(points: readonly { lon: number; lat: number; pop: number }[]): void {
    this.r.setLights(points);
    this.invalidate();
  }

  /** The canvas's accessible description. */
  setLabel(text: string): void {
    if (this.canvas.getAttribute('aria-label') !== text) this.canvas.setAttribute('aria-label', text);
  }

  /** Called every frame while set (live trackers); keep it cheap. */
  setTicker(fn: ((ts: number) => void) | null): void {
    this.ticker = fn;
    this.schedule();
  }

  setMotion(motion: MotionMode): void {
    this.cam.motion = motion;
    this.r.animate = motion === 'full';
    if (motion !== 'full') this.cam.settle();
    this.invalidate();
  }

  invalidate(): void {
    this.dirty = true;
    this.schedule();
  }

  // ───────────────────────────────────────────────────── camera

  getCenter(): LonLat { return this.cam.center(); }

  setCenter(lon: number, lat: number): void {
    this.cam.setCenter(lon, lat);
    this.invalidate();
  }

  /** Eased turn to a point (snaps under reduced motion). */
  spinTo(lon: number, lat: number, ms = 1200): void {
    this.cam.spinTo(lon, lat, ms);
    this.invalidate();
  }

  /** Keeps easing the camera toward a moving point (Santa); a drag or `spinTo` cancels it. */
  followTo(lon: number, lat: number): void {
    this.cam.followTo(lon, lat);
    this.invalidate();
  }

  stopFollow(): void { this.cam.stopFollow(); }

  autoRotate(degPerSec: number): void {
    this.cam.autoRotate(degPerSec);
    this.schedule();
  }

  getZoom(): number { return this.cam.zoom(); }

  /** Jumps straight to a zoom (pinch, wheel). */
  setZoom(z: number): void {
    this.cam.setZoom(z);
    this.invalidate();
  }

  /** Eases to a new zoom (buttons, keys); jumps under reduced motion. */
  zoomBy(f: number): void {
    this.cam.zoomBy(f);
    this.invalidate();
  }

  // ───────────────────────────────────────────────────── lifecycle

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w < 2 || h < 2) return;
    const dpr = Math.min(this.maxDpr, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    if (w === this.w && h === this.h && dpr === this.dpr) return;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.r.setSize(w, h, dpr);
    // Resizing clears the canvas: repaint now rather than show a blank frame.
    if (this.running) this.draw(performance.now()); else this.dirty = true;
  }

  /** Draws one frame now (optionally moving the sun to `now` first). */
  render(now?: Date): void {
    if (now) this.r.setTime(now);
    this.draw(typeof performance !== 'undefined' ? performance.now() : 0);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.resize();
    this.invalidate();
  }

  stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  destroy(): void {
    this.stop();
    this.ticker = null;
    this.canvas.removeEventListener('pointerdown', this.onDown);
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerup', this.onUp);
    this.canvas.removeEventListener('pointercancel', this.onCancel);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.keyTarget?.removeEventListener('keydown', this.onKey);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.ro?.disconnect();
    this.io?.disconnect();
  }

  /** What is under a canvas point (CSS px): a marker, a country, the sea, or space. */
  hitTest(x: number, y: number): GlobeHit {
    this.sync();
    const ms = this.r.markers;
    const p = { x: 0, y: 0, visible: false };
    for (let i = ms.length - 1; i >= 0; i--) {
      const m = ms[i]!;
      const size = m.size ?? (m.sprite === 'sleigh' ? 80 : m.sprite === 'sun' ? 34 : m.emoji ? 26 : 10);
      if (this.r.mode === 'globe') {
        this.r.ortho.project(m.lon, m.lat, p);
        if (!p.visible) continue;
      } else this.r.flat.project(m.lon, m.lat, p);
      if (Math.hypot(p.x - x, p.y - y) <= size / 2 + 8) return { kind: 'marker', marker: m, index: i };
    }
    const ll = this.r.mode === 'globe' ? this.r.ortho.unproject(x, y) : this.r.flat.unproject(x, y);
    if (!ll) return { kind: 'space' };
    const c = countryAt(ll.lon, ll.lat);
    if (c && c.iso) return { kind: 'country', iso: c.iso, name: c.name, lon: ll.lon, lat: ll.lat };
    return { kind: 'ocean', lon: ll.lon, lat: ll.lat };
  }

  // ───────────────────────────────────────────────────── loop

  private schedule(): void {
    if (this.raf || !this.running || !this.onScreen || (typeof document !== 'undefined' && document.hidden)) return;
    this.raf = requestAnimationFrame(this.frame);
  }

  private readonly frame = (ts: number): void => {
    this.raf = 0;
    if (!this.running) return;
    const dt = this.lastTs ? Math.min(0.1, (ts - this.lastTs) / 1000) : 1 / 60;
    this.lastTs = ts;
    let moving = this.cam.step(ts, dt);
    if (this.ticker) { this.ticker(ts); moving = true; }
    if (moving) this.dirty = true;
    const pulsing = this.hasPulse && this.cam.motion === 'full';
    if (this.dirty || (pulsing && ts - this.lastDraw > 33)) this.draw(ts);
    if (moving || pulsing) this.schedule();
  };

  /** Pushes the camera into the projections (clamping the flat map so it never leaves the canvas). */
  private sync(): void {
    const c = this.cam;
    if (this.r.mode === 'globe') {
      this.r.ortho.setScale(Math.min(this.w, this.h) * GLOBE_FILL * c.zoomGlobe);
      this.r.ortho.setCenter(c.lon, c.lat);
    } else {
      const s = Math.min(this.w / 360, this.h / 180) * c.zoomMap;
      const maxLat = Math.max(0, 90 - this.h / (2 * s));
      c.mapLat = Math.max(-maxLat, Math.min(maxLat, c.mapLat));
      this.r.flat.setScale(s);
      this.r.flat.setCenter(c.lon, c.mapLat);
    }
  }

  private draw(ts: number): void {
    const ctx = this.ctx;
    this.dirty = false;
    this.lastDraw = ts;
    if (!ctx || this.w < 2 || this.h < 2) return;
    this.sync();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.r.draw(ctx, (ts - this.born) / 1000);
  }

  // ───────────────────────────────────────────────────── input

  private local(e: PointerEvent | WheelEvent): { x: number; y: number } {
    const r = this.rect ?? this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private grabbed(): void {
    this.cam.grab();
    this.onInteract?.();
  }

  private readonly onDown = (e: PointerEvent): void => {
    if (e.button !== undefined && e.button > 0) return;
    this.rect = this.canvas.getBoundingClientRect();
    const p = this.local(e);
    this.pointers.set(e.pointerId, p);
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* synthetic events in tests */ }
    if (this.pointers.size === 1) {
      this.drag = { x: p.x, y: p.y, sx: p.x, sy: p.y, t0: e.timeStamp, moved: 0, started: false };
      this.cam.beginDrag(e.timeStamp);
    } else if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinch = { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y) || 1, zoom: this.getZoom() };
      if (this.drag) this.drag.moved = TAP_SLOP + 1;
    }
  };

  private readonly onMove = (e: PointerEvent): void => {
    if (!this.pointers.has(e.pointerId)) return;
    const p = this.local(e);
    this.pointers.set(e.pointerId, p);
    if (this.pinch && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y) || 1;
      this.setZoom(this.pinch.zoom * (d / this.pinch.dist));
      this.grabbed();
      return;
    }
    const d = this.drag;
    if (!d) return;
    const dx = p.x - d.x;
    const dy = p.y - d.y;
    d.moved += Math.abs(dx) + Math.abs(dy);
    if (d.moved <= TAP_SLOP) return;
    if (!d.started) { d.started = true; this.grabbed(); }
    d.x = p.x;
    d.y = p.y;
    this.sync();
    // Globe: the point under the finger stays under the finger (at the center of the disc).
    const k = this.r.mode === 'globe' ? RAD / this.r.ortho.scale : 1 / this.r.flat.scale;
    this.cam.dragBy(-dx * k, dy * k, e.timeStamp);
    this.invalidate();
  };

  private readonly onUp = (e: PointerEvent): void => {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.delete(e.pointerId);
    try { this.canvas.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    if (this.pointers.size < 2) this.pinch = null;
    if (this.pointers.size > 0) return;
    const d = this.drag;
    this.drag = null;
    if (!d) return;
    if (d.moved <= TAP_SLOP && e.timeStamp - d.t0 < TAP_MS) {
      this.cam.release(e.timeStamp, false);
      this.onSelect?.(this.hitTest(d.sx, d.sy));
      return;
    }
    // Fling: keep spinning with the drag's last speed, gliding to a stop.
    this.cam.release(e.timeStamp, d.started);
    this.schedule();
  };

  private readonly onCancel = (e: PointerEvent): void => {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0) {
      this.drag = null;
      this.pinch = null;
      this.cam.release(e.timeStamp, false);
    }
  };

  private readonly onWheel = (e: WheelEvent): void => {
    const step = e.deltaMode === 1 ? 0.05 : 0.0018;
    const z = this.getZoom();
    this.cam.setZoom(z * Math.exp(-e.deltaY * step));
    // At the limits the wheel scrolls the page as usual.
    if (Math.abs(this.getZoom() - z) < 1e-4) return;
    e.preventDefault();
    this.grabbed();
    this.invalidate();
  };

  private readonly onKey = (e: KeyboardEvent): void => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const c = this.getCenter();
    switch (e.key) {
      case 'ArrowLeft': this.grabbed(); this.spinTo(c.lon - KEY_STEP, c.lat, 350); break;
      case 'ArrowRight': this.grabbed(); this.spinTo(c.lon + KEY_STEP, c.lat, 350); break;
      case 'ArrowUp': this.grabbed(); this.spinTo(c.lon, c.lat + KEY_STEP, 350); break;
      case 'ArrowDown': this.grabbed(); this.spinTo(c.lon, c.lat - KEY_STEP, 350); break;
      case '+': case '=': this.grabbed(); this.zoomBy(1.5); break;
      case '-': case '_': this.grabbed(); this.zoomBy(1 / 1.5); break;
      case 'Enter': case ' ':
        if (e.target !== this.keyTarget) return;
        this.onSelect?.(this.hitTest(this.w / 2, this.h / 2));
        break;
      default: return;
    }
    e.preventDefault();
  };

  private readonly onVisibility = (): void => {
    if (!document.hidden) this.invalidate();
  };
}
