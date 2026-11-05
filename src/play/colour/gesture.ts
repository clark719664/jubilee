/**
 * gesture.ts — fingers, mouse and wheel on the page viewport.
 *
 * One finger that lifts without travelling is a TAP (fill). Two fingers PINCH and PAN together, and a
 * gesture that ever had two fingers never fills anything, so zooming on a phone cannot colour by
 * accident. One finger (or mouse) dragging pans when zoomed in. The wheel zooms at the pointer
 * (ctrl+wheel and trackpad pinch too); a trackpad two-finger scroll pans when zoomed. All the maths
 * lives in geometry.ts.
 */
import { clampView, panBy, pinch, zoomAt, type Pt, type View } from './geometry';

export interface GestureHost {
  /** The element pointer events land on (it must have touch-action: none). */
  readonly el: HTMLElement;
  size(): { w: number; h: number };
  view(): View;
  setView(v: View): void;
  tap(clientX: number, clientY: number): void;
  hover(clientX: number, clientY: number): void;
  leave(): void;
}

/** Travel (CSS px) beyond which a press is a drag, not a tap. */
export const TAP_SLOP = 12;
/** A press held longer than this is not a tap (a resting palm, a long think). */
export const TAP_MAX_MS = 900;

export function attachGestures(host: GestureHost): () => void {
  const { el } = host;
  const pts = new Map<number, Pt>();
  let mode: 'idle' | 'tap' | 'pan' | 'pinch' | 'spent' = 'idle';
  let first: { id: number; x: number; y: number; t: number } | null = null;
  let startView: View = host.view();
  let pinchStart: { a: Pt; b: Pt; ids: [number, number] } | null = null;

  const local = (e: PointerEvent | WheelEvent): Pt => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { el.setPointerCapture(e.pointerId); } catch { /* capture is a nicety */ }
    pts.set(e.pointerId, local(e));
    if (pts.size === 1) {
      mode = 'tap';
      first = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
      startView = host.view();
    } else if (pts.size === 2) {
      const [[ia, a], [ib, b]] = [...pts.entries()] as [[number, Pt], [number, Pt]];
      mode = 'pinch';
      pinchStart = { a, b, ids: [ia, ib] };
      startView = host.view();
    }
  };

  const move = (e: PointerEvent): void => {
    if (!pts.has(e.pointerId)) {
      if (e.pointerType === 'mouse' && e.buttons === 0) host.hover(e.clientX, e.clientY);
      return;
    }
    const p = local(e);
    pts.set(e.pointerId, p);
    const { w, h } = host.size();
    if (mode === 'tap' && first && Math.hypot(e.clientX - first.x, e.clientY - first.y) > TAP_SLOP) {
      mode = host.view().s > 1.001 ? 'pan' : 'spent';
      startView = host.view();
    }
    if (mode === 'pan' && first) {
      host.setView(panBy(startView, e.clientX - first.x, e.clientY - first.y, w, h));
    } else if (mode === 'pinch' && pinchStart) {
      const a1 = pts.get(pinchStart.ids[0]);
      const b1 = pts.get(pinchStart.ids[1]);
      if (a1 && b1) host.setView(pinch(startView, pinchStart.a, pinchStart.b, a1, b1, w, h));
    }
  };

  const up = (e: PointerEvent): void => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    const quick = first !== null && performance.now() - first.t < TAP_MAX_MS;
    if (mode === 'tap' && first && first.id === e.pointerId && e.type === 'pointerup' && quick) host.tap(e.clientX, e.clientY);
    if (pts.size === 0) { mode = 'idle'; first = null; pinchStart = null; }
    else if (mode === 'pinch') mode = 'spent';
  };

  const wheel = (e: WheelEvent): void => {
    e.preventDefault();
    const { w, h } = host.size();
    const v = host.view();
    const p = local(e);
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? h : 1;
    const dx = e.deltaX * unit, dy = e.deltaY * unit;
    // Trackpads scroll with fractional or sideways deltas; mouse wheels click in whole vertical steps.
    const trackpadScroll = !e.ctrlKey && (dx !== 0 || !Number.isInteger(dy)) && v.s > 1.001;
    if (trackpadScroll) host.setView(panBy(v, -dx, -dy, w, h));
    else host.setView(zoomAt(v, Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)), p.x, p.y, w, h));
  };

  const leave = (e: PointerEvent): void => { if (e.pointerType === 'mouse') host.leave(); };
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { const { w, h } = host.size(); host.setView(clampView(host.view(), w, h)); }) : null;
  ro?.observe(el);

  // A tap must not move keyboard focus into the shapes (that would draw the keyboard ring).
  const noFocus = (e: MouseEvent): void => e.preventDefault();
  el.addEventListener('mousedown', noFocus);
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', leave);
  el.addEventListener('wheel', wheel, { passive: false });
  return () => {
    ro?.disconnect();
    el.removeEventListener('mousedown', noFocus);
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
    el.removeEventListener('pointerleave', leave);
    el.removeEventListener('wheel', wheel);
  };
}
