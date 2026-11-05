/**
 * page.ts — the live coloring page: a sanitised SVG whose `data-fill` regions can be painted.
 *
 * Built from a CleanPage (sanitize.ts) with svg(), so nothing from the file is ever inserted as markup.
 * A region is every element carrying the same data-fill id (both eyes can be one region); a <g> region
 * paints the shapes inside it. Painting is "flood" style: a circle of the new color, clipped to the
 * shape, grows from where the finger landed, then the shape's own fill is set and the circle removed.
 * The line art stays on top the whole time (a stroke-only copy rides above the circle).
 *
 * Hover (mouse) previews the crayon on the shape; keyboard focus draws a glow outline around it. Both
 * live in one overlay group at the end of the SVG that never takes pointer events.
 */
import { svg } from '../../ui/dom';
import { BLANK, gradientId, paintFor, type Crayon } from './crayons';
import type { Box } from './geometry';
import type { Fills } from './history';
import type { CleanNode, CleanPage } from './sanitize';

export interface Region {
  readonly id: string;
  /** Elements carrying the data-fill id; the first one takes keyboard focus. */
  readonly roots: SVGGraphicsElement[];
  /** Shapes whose fill changes. */
  readonly targets: SVGGraphicsElement[];
}

const NO_FILL_TAGS = new Set(['line', 'g', 'svg']);
let pageCount = 0;

/** Magic-crayon gradients for a page's <defs>. */
export function gradientDefs(box: readonly Crayon[], prefix: string): SVGDefsElement {
  const defs = svg('defs', {});
  for (const c of box) {
    if (!c.gradient) continue;
    const id = gradientId(prefix, c.id);
    const g = c.gradient.type === 'radial'
      ? svg('radialGradient', { id, cx: '50%', cy: '45%', r: '65%' })
      : svg('linearGradient', { id, x1: '0', y1: '0', x2: '1', y2: '1' });
    for (const s of c.gradient.stops) g.append(svg('stop', { offset: s.offset, 'stop-color': s.color }));
    defs.append(g);
  }
  return defs;
}

interface Built {
  readonly el: SVGSVGElement;
  readonly regions: Map<string, Region>;
  /** Accumulated transform (ancestors + own) for every target, for the overlay copies. */
  readonly accum: Map<Element, string>;
  /** The fill each target had in the file (what the eraser restores). */
  readonly blank: Map<Element, string>;
}

function build(page: CleanPage, box: readonly Crayon[], prefix: string): Built {
  const regions = new Map<string, Region>();
  const accum = new Map<Element, string>();
  const blank = new Map<Element, string>();
  const walk = (n: CleanNode, acc: string, inRegion: string | null): SVGElement => {
    const el = svg(n.tag, { ...n.attrs });
    const t = n.attrs.transform;
    const myAcc = t ? `${acc} ${t}`.trim() : acc;
    const own = n.attrs['data-fill'] ?? null;
    const rid = own ?? inRegion;
    if (rid) {
      let r = regions.get(rid);
      if (!r) { r = { id: rid, roots: [], targets: [] }; regions.set(rid, r); }
      if (own) { r.roots.push(el as SVGGraphicsElement); el.classList.add('cp-region'); }
      const f = n.attrs.fill;
      if (!NO_FILL_TAGS.has(n.tag) && f !== 'none') {
        r.targets.push(el as SVGGraphicsElement);
        el.classList.add('cp-t');
        accum.set(el, myAcc);
        // Regions start white even if the file forgot a fill (an unfilled shape would paint black).
        const start = f && f !== 'currentColor' ? f : BLANK;
        blank.set(el, start);
        el.setAttribute('fill', start);
      }
    }
    for (const c of n.children) el.append(walk(c, myAcc, rid));
    return el;
  };
  const el = walk(page.root, '', null) as SVGSVGElement;
  el.insertBefore(gradientDefs(box, prefix), el.firstChild);
  return { el, regions, accum, blank };
}

/** A non-interactive copy of a page with fills applied (Fridge thumbnails, the printed sheet). */
export function staticPage(page: CleanPage, fills: Fills, box: readonly Crayon[], prefix = `cps${++pageCount}`): SVGSVGElement {
  const b = build(page, box, prefix);
  for (const [id, r] of b.regions) {
    const paint = fills[id] ? paintFor(fills[id], box, prefix) : null;
    for (const t of r.targets) t.setAttribute('fill', paint ?? b.blank.get(t) ?? BLANK);
  }
  for (const r of b.regions.values()) for (const el of r.roots) el.classList.remove('cp-region');
  b.el.setAttribute('class', 'cp-static');
  b.el.setAttribute('aria-hidden', 'true');
  b.el.setAttribute('focusable', 'false');
  return b.el;
}

export interface PaintOptions {
  /** Screen point the color pours from (else the shape's center). */
  readonly from?: { readonly x: number; readonly y: number };
  /** false = set instantly (reduced motion, undo, restore). */
  readonly animate: boolean;
  /** Start delay in ms (the Surprise! wave). */
  readonly delay?: number;
}

export class ColorPage {
  readonly el: SVGSVGElement;
  readonly prefix: string;
  readonly regions: Map<string, Region>;
  private readonly accum: Map<Element, string>;
  private readonly blank: Map<Element, string>;
  private readonly defs: SVGDefsElement;
  private readonly overlay: SVGGElement;
  private readonly pending = new Map<string, () => void>();
  private clipCount = 0;
  private alive = true;

  constructor(page: CleanPage, private readonly box: readonly Crayon[]) {
    this.prefix = `cp${++pageCount}`;
    const b = build(page, box, this.prefix);
    this.el = b.el;
    this.regions = b.regions;
    this.accum = b.accum;
    this.blank = b.blank;
    this.defs = this.el.querySelector('defs')!;
    this.overlay = svg('g', { class: 'cp-overlay', 'aria-hidden': 'true' });
    this.el.append(this.overlay);
    this.el.classList.add('cp-svg');
  }

  /** Region ids that actually have something to fill. */
  get ids(): string[] {
    return [...this.regions.values()].filter((r) => r.targets.length > 0).map((r) => r.id);
  }

  focusEl(id: string): SVGGraphicsElement | null {
    return this.regions.get(id)?.roots[0] ?? null;
  }

  /** Paint one region with a crayon id (null = back to white). */
  paint(id: string, crayon: string | null, opts: PaintOptions): void {
    const r = this.regions.get(id);
    if (!r) return;
    this.pending.get(id)?.();
    const value = (t: Element): string => (crayon ? paintFor(crayon, this.box, this.prefix) : this.blank.get(t) ?? BLANK);
    if (!opts.animate) {
      for (const t of r.targets) t.setAttribute('fill', value(t));
      return;
    }
    const finishers: (() => void)[] = [];
    const center = opts.from ?? this.centerOf(id);
    for (const t of r.targets) finishers.push(this.splash(t, value(t), center, opts.delay ?? 0));
    let done = false;
    const finish = (): void => {
      if (done) return;
      done = true;
      this.pending.delete(id);
      for (const f of finishers) f();
    };
    this.pending.set(id, finish);
  }

  /** Apply a whole fill map instantly (restore, undo, reopen). */
  setAll(fills: Fills): void {
    for (const id of this.regions.keys()) this.paint(id, fills[id] ?? null, { animate: false });
  }

  /** Finish every running splash now. */
  settle(): void {
    for (const f of [...this.pending.values()]) f();
  }

  /** The region under a screen point, trying a small ring around it so a tap on a line still counts. */
  regionAt(x: number, y: number, slop = 10): string | null {
    const probe = (px: number, py: number): string | null => {
      if (typeof document.elementsFromPoint !== 'function') return null;
      for (const el of document.elementsFromPoint(px, py)) {
        if (!this.el.contains(el)) continue;
        const r = el.closest('[data-fill]');
        if (r && this.el.contains(r)) return r.getAttribute('data-fill');
      }
      return null;
    };
    const hit = probe(x, y);
    if (hit || slop <= 0) return hit;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const p = probe(x + Math.cos(a) * slop, y + Math.sin(a) * slop);
      if (p) return p;
    }
    return null;
  }

  /** Region bounding box in page (viewBox) units, measured from layout. */
  boxOf(id: string): Box | null {
    const r = this.regions.get(id);
    const ctm = this.el.getScreenCTM();
    if (!r || !ctm || r.targets.length === 0) return null;
    const inv = ctm.inverse();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const t of r.targets) {
      const b = t.getBoundingClientRect();
      for (const [cx, cy] of [[b.left, b.top], [b.right, b.bottom]] as const) {
        const p = new DOMPoint(cx, cy).matrixTransform(inv);
        x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
      }
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /** Screen-space center of a region. */
  centerOf(id: string): { x: number; y: number } {
    const r = this.regions.get(id);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const t of r?.targets ?? []) {
      const b = t.getBoundingClientRect();
      x0 = Math.min(x0, b.left); y0 = Math.min(y0, b.top); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom);
    }
    return Number.isFinite(x0) ? { x: (x0 + x1) / 2, y: (y0 + y1) / 2 } : { x: 0, y: 0 };
  }

  /**
   * Hover preview / focus ring for a region. `crayon` previews that crayon on the shape (undefined =
   * no preview); `ring` draws the glow outline used for keyboard focus.
   */
  highlight(id: string | null, crayon: string | null | undefined, ring: boolean): void {
    this.overlay.replaceChildren();
    const r = id ? this.regions.get(id) : undefined;
    if (!r) return;
    const copy = (t: SVGGraphicsElement, attrs: Record<string, string | number>): SVGElement => {
      const c = t.cloneNode(false) as SVGElement;
      for (const a of ['data-fill', 'class', 'tabindex', 'role', 'aria-label', 'transform']) c.removeAttribute(a);
      const acc = this.accum.get(t);
      if (acc) c.setAttribute('transform', acc);
      for (const [k, v] of Object.entries(attrs)) c.setAttribute(k, String(v));
      return c;
    };
    for (const t of r.targets) {
      if (crayon !== undefined) {
        this.overlay.append(copy(t, { fill: crayon ? paintFor(crayon, this.box, this.prefix) : BLANK, 'fill-opacity': crayon ? 0.55 : 0.8, stroke: 'none', class: 'cp-preview' }));
      }
    }
    for (const t of r.targets) {
      this.overlay.append(copy(t, { fill: 'none', stroke: '#ffd166', 'stroke-width': ring ? 14 : 9, 'stroke-opacity': ring ? 0.95 : 0.7, 'stroke-linejoin': 'round', class: ring ? 'cp-ring' : 'cp-hover' }));
      this.overlay.append(copy(t, { fill: 'none', stroke: '#1f1a3d', 'stroke-width': ring ? 4 : 3, 'stroke-linejoin': 'round' }));
    }
  }

  destroy(): void {
    this.alive = false;
    this.settle();
  }

  /** Grows a clipped circle of `value` from `from` (screen) over one target; returns its finisher. */
  private splash(t: SVGGraphicsElement, value: string, from: { x: number; y: number }, delay: number): () => void {
    const parent = t.parentNode as SVGGraphicsElement | null;
    const ctm = parent?.getScreenCTM?.();
    if (!parent || !ctm) { t.setAttribute('fill', value); return () => {}; }
    const inv = ctm.inverse();
    const c = new DOMPoint(from.x, from.y).matrixTransform(inv);
    const b = t.getBoundingClientRect();
    let R = 0;
    for (const [x, y] of [[b.left, b.top], [b.right, b.top], [b.left, b.bottom], [b.right, b.bottom]] as const) {
      const p = new DOMPoint(x, y).matrixTransform(inv);
      R = Math.max(R, Math.hypot(p.x - c.x, p.y - c.y));
    }
    const clipId = `${this.prefix}-clip-${++this.clipCount}`;
    const shape = t.cloneNode(false) as SVGElement;
    for (const a of ['data-fill', 'class', 'tabindex', 'role', 'aria-label', 'fill', 'stroke']) shape.removeAttribute(a);
    const clip = svg('clipPath', { id: clipId }, shape);
    this.defs.append(clip);
    const circle = svg('circle', { cx: c.x.toFixed(1), cy: c.y.toFixed(1), r: 0, fill: value, 'clip-path': `url(#${clipId})`, class: 'cp-splash' });
    // The line art rides above the pour: a stroke-only twin of the shape (same parent, same paint inheritance).
    const lines = t.cloneNode(false) as SVGElement;
    for (const a of ['data-fill', 'class', 'tabindex', 'role', 'aria-label']) lines.removeAttribute(a);
    lines.setAttribute('fill', 'none');
    lines.setAttribute('class', 'cp-splash');
    t.after(circle, lines);

    const duration = 380;
    let start = -1;
    let raf = 0;
    let finished = false;
    const finish = (): void => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      t.setAttribute('fill', value);
      circle.remove();
      lines.remove();
      clip.remove();
    };
    const step = (now: number): void => {
      if (!this.alive) { finish(); return; }
      if (start < 0) start = now + delay;
      const k = Math.max(0, Math.min(1, (now - start) / duration));
      // easeOutBack-ish: a quick pour that slightly overshoots, matching the app's springy feel.
      const e = 1 - Math.pow(1 - k, 3);
      circle.setAttribute('r', (R * 1.04 * e).toFixed(1));
      if (k >= 1) finish();
      else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return finish;
  }
}
