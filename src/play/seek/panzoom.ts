/**
 * panzoom.ts — one-finger drag, two-finger pinch, inertia, wheel zoom and animated fly-to for the
 * Seek & Find picture. All the math lives in geometry.ts; this file only turns pointer events into views.
 *
 * Taps are recognised here (press + lift within TAP_MS, moved less than TAP_MOVE_PX, never part of a
 * pinch) and handed to `onTap` in stage px, so a drag that ends on a findable never counts as a find.
 */
import {
  TAP_MOVE_PX, TAP_MS, clampView, decay, easeOut, lerpView, pinchView, refit, releaseVelocity, wheelFactor, zoomAt,
  type Point, type Sample, type View, type Viewport,
} from './geometry';

export interface PanZoomOptions {
  readonly stage: HTMLElement;
  readonly measure: () => Viewport;
  readonly initial: (vp: Viewport) => View;
  readonly onChange: (v: View, vp: Viewport) => void;
  readonly onTap: (p: Point) => void;
  /** Reduced motion: no inertia, fly-tos jump. */
  readonly reduced: () => boolean;
}

interface Drag {
  readonly id: number;
  readonly start: Point;
  readonly view: View;
  readonly t: number;
  moved: boolean;
  samples: Sample[];
}

interface Pinch {
  readonly a: number;
  readonly b: number;
  readonly a0: Point;
  readonly b0: Point;
  readonly view: View;
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class PanZoom {
  private vp: Viewport;
  private v: View;
  private readonly o: PanZoomOptions;
  private readonly pts = new Map<number, Point>();
  private drag: Drag | null = null;
  private pinch: Pinch | null = null;
  /** Set once a gesture becomes a pinch, so lifting the last finger is never a tap. */
  private wasPinch = false;
  private raf = 0;
  private rect: DOMRect | null = null;
  private readonly off: (() => void)[] = [];

  constructor(o: PanZoomOptions) {
    this.o = o;
    this.vp = o.measure();
    this.v = clampView(o.initial(this.vp), this.vp);
    const st = o.stage;
    const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions): void => {
      st.addEventListener(type, fn as EventListener, opts);
      this.off.push(() => st.removeEventListener(type, fn as EventListener, opts));
    };
    on('pointerdown', (e) => this.down(e));
    on('pointermove', (e) => this.move(e));
    on('pointerup', (e) => this.up(e, false));
    on('pointercancel', (e) => this.up(e, true));
    on('lostpointercapture', (e) => { if (this.pts.has(e.pointerId)) this.up(e, true); });
    on('wheel', (e) => this.wheel(e), { passive: false });
    // Safari's own pinch gesture events would zoom the whole page; the stage handles pinches itself.
    on('gesturestart' as keyof HTMLElementEventMap, (e) => e.preventDefault(), { passive: false });
    this.emit();
  }

  get view(): View { return this.v; }
  get viewport(): Viewport { return this.vp; }

  /** Re-measure after a resize, keeping the same spot in the middle at the same zoom ratio. */
  resize(): void {
    const next = this.o.measure();
    if (next.w === this.vp.w && next.h === this.vp.h && next.top === this.vp.top && next.bottom === this.vp.bottom) return;
    this.v = refit(this.v, this.vp, next);
    this.vp = next;
    this.emit();
  }

  set(v: View): void {
    this.stopMotion();
    this.v = clampView(v, this.vp);
    this.emit();
  }

  /** Fly to a view (eased, ~420 ms) or jump there under reduced motion. Resolves when it arrives. */
  flyTo(target: View, ms = 460): Promise<void> {
    this.stopMotion();
    const to = clampView(target, this.vp);
    if (this.o.reduced() || ms <= 0) {
      this.v = to;
      this.emit();
      return Promise.resolve();
    }
    const from = this.v;
    const t0 = now();
    this.o.stage.classList.add('is-moving');
    return new Promise((resolve) => {
      const step = (): void => {
        const k = Math.min(1, (now() - t0) / ms);
        this.v = lerpView(from, to, easeOut(k));
        this.emit();
        if (k < 1) this.raf = requestAnimationFrame(step);
        else { this.raf = 0; this.o.stage.classList.remove('is-moving'); resolve(); }
      };
      this.raf = requestAnimationFrame(step);
    });
  }

  zoomBy(factor: number, anchor: Point, animate = true): Promise<void> {
    const target = zoomAt(this.v, this.vp, factor, anchor);
    return animate ? this.flyTo(target, 260) : (this.set(target), Promise.resolve());
  }

  destroy(): void {
    this.stopMotion();
    for (const f of this.off) f();
    this.off.length = 0;
  }

  // ── internals ──

  private emit(): void {
    this.o.onChange(this.v, this.vp);
  }

  private stopMotion(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.o.stage.classList.remove('is-moving');
  }

  private local(e: PointerEvent | WheelEvent): Point {
    const r = this.rect ?? this.o.stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private down(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.stopMotion();
    if (this.pts.size === 0) {
      this.rect = this.o.stage.getBoundingClientRect();
      this.wasPinch = false;
    }
    const p = this.local(e);
    this.pts.set(e.pointerId, p);
    try { this.o.stage.setPointerCapture(e.pointerId); } catch { /* capture is a nicety */ }
    if (this.pts.size === 1) {
      this.drag = { id: e.pointerId, start: p, view: this.v, t: now(), moved: false, samples: [{ t: now(), x: p.x, y: p.y }] };
    } else if (this.pts.size === 2) {
      const [[a, a0], [b, b0]] = [...this.pts.entries()] as [[number, Point], [number, Point]];
      this.pinch = { a, b, a0, b0, view: this.v };
      this.drag = null;
      this.wasPinch = true;
    }
    this.o.stage.classList.add('is-grabbing');
  }

  private move(e: PointerEvent): void {
    if (!this.pts.has(e.pointerId)) return;
    const p = this.local(e);
    this.pts.set(e.pointerId, p);
    if (this.pinch) {
      const a1 = this.pts.get(this.pinch.a);
      const b1 = this.pts.get(this.pinch.b);
      if (!a1 || !b1) return;
      this.v = pinchView(this.pinch.view, this.vp, this.pinch.a0, this.pinch.b0, a1, b1);
      this.emit();
      return;
    }
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    const dx = p.x - d.start.x;
    const dy = p.y - d.start.y;
    if (!d.moved && Math.hypot(dx, dy) < TAP_MOVE_PX) return;
    d.moved = true;
    d.samples.push({ t: now(), x: p.x, y: p.y });
    if (d.samples.length > 12) d.samples.shift();
    this.v = clampView({ s: d.view.s, ox: d.view.ox + dx, oy: d.view.oy + dy }, this.vp);
    this.emit();
  }

  private up(e: PointerEvent, cancelled: boolean): void {
    if (!this.pts.has(e.pointerId)) return;
    const p = this.local(e);
    this.pts.delete(e.pointerId);
    const d = this.drag;
    if (this.pinch) {
      // One finger left after a pinch: carry on as a drag from here, never a tap.
      this.pinch = null;
      const rest = [...this.pts.entries()][0];
      this.drag = rest ? { id: rest[0], start: rest[1], view: this.v, t: now(), moved: true, samples: [] } : null;
    } else if (d && d.id === e.pointerId) {
      this.drag = null;
      if (!cancelled && !d.moved && !this.wasPinch && now() - d.t <= TAP_MS) {
        this.o.onTap(p);
      } else if (!cancelled && d.moved && !this.o.reduced()) {
        d.samples.push({ t: now(), x: p.x, y: p.y });
        this.glide(releaseVelocity(d.samples));
      }
    }
    if (this.pts.size === 0) {
      this.rect = null;
      this.o.stage.classList.remove('is-grabbing');
    }
  }

  private glide(vel: { vx: number; vy: number }): void {
    let { vx, vy } = vel;
    if (Math.hypot(vx, vy) < 60) return;
    let last = now();
    this.o.stage.classList.add('is-moving');
    const step = (): void => {
      const t = now();
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const before = this.v;
      this.v = clampView({ s: before.s, ox: before.ox + vx * dt, oy: before.oy + vy * dt }, this.vp);
      // Hitting an edge kills that axis so the picture does not stick to the wall.
      if (Math.abs(this.v.ox - before.ox) < Math.abs(vx * dt) * 0.5) vx = 0;
      if (Math.abs(this.v.oy - before.oy) < Math.abs(vy * dt) * 0.5) vy = 0;
      this.emit();
      const next = decay(vx, vy, dt);
      vx = next.vx;
      vy = next.vy;
      if (next.moving) this.raf = requestAnimationFrame(step);
      else this.stopMotion();
    };
    this.raf = requestAnimationFrame(step);
  }

  private wheel(e: WheelEvent): void {
    e.preventDefault();
    this.stopMotion();
    const p = this.local(e);
    if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
      // Mouse wheel or trackpad pinch (ctrl+wheel) zooms about the cursor.
      this.v = zoomAt(this.v, this.vp, wheelFactor(e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY, e.ctrlKey), p);
    } else {
      this.v = clampView({ s: this.v.s, ox: this.v.ox - e.deltaX, oy: this.v.oy }, this.vp);
    }
    this.emit();
  }
}
