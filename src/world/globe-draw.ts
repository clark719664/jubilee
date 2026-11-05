/**
 * Painting for the World view's globe and flat map (Canvas 2D in CSS pixels; the caller
 * sets the dpr transform). Back to front on the globe:
 *
 *   space → atmosphere → ocean (gradient + the sun's glint) → graticule → shallows → coasts →
 *   land → celebrating countries → lakes → limb shading → sunlight and night (multiply) with
 *   twilight → celebrating countries relit → city lights → new-day veil and midnight line →
 *   limb haze → Santa's trail → markers → labels
 *
 * The flat map follows the same order without the sphere effects. Everything expensive is
 * cached: the sky and the atmosphere are offscreen canvases (globe-paint.ts), sunlight is a
 * small texture (night-draw.ts), stickers and pills are sprites (globe-overlay.ts), outlines
 * are typed arrays (shapes.ts) clipped into reused PolyBuffers. After warm-up a frame
 * allocates next to nothing.
 */
import { mixColor, withAlpha } from '../effects/painters/color';
import { lonlatToVec3, type LonLat, type MVec3 } from './geo';
import { SpaceBackdrop, graticule, paintAtmosphere } from './globe-paint';
import { TrailLayer } from './globe-trail';
import { Overlay, type GlobeMarker, type SceneView } from './globe-overlay';
import { NightShade } from './night-draw';
import { DEFAULT_COLORS, type GlobeColors } from './palette';
import { Equirectangular, Orthographic, PolyBuffer, clipLineInto, clipRingInto, mapRingInto, type Projected } from './projection';
import { isEverywhere, prepareShapes, type PreparedRing, type PreparedWorld } from './shapes';
import { subsolarPoint, sunVector, type SubsolarPoint } from './sun';

export type { GlobeColors } from './palette';
export { DEFAULT_COLORS } from './palette';
export type { GlobeMarker } from './globe-overlay';
export type GlobeMode = 'globe' | 'map';

const TAU = Math.PI * 2;
const scratch: MVec3 = [0, 0, 0];

export class GlobeRenderer implements SceneView {
  readonly ortho = new Orthographic(0, 15);
  readonly flat = new Equirectangular(0, 0);
  readonly overlay: Overlay;
  mode: GlobeMode = 'globe';
  colors: GlobeColors = DEFAULT_COLORS;
  private highlightColor = DEFAULT_COLORS.highlight;
  /**
   * The countries actually painted in the highlight colour. A holiday the whole planet shares
   * (New Year, Earth Day…) leaves the land natural: one colour everywhere tells a child nothing,
   * and the note already says "everywhere".
   */
  private lit: ReadonlySet<string> = new Set();
  selected: string | null = null;
  markers: readonly GlobeMarker[] = [];
  night = true;
  /** Pulses, the sleigh's bob (false under reduced motion). */
  animate = true;

  private readonly world: PreparedWorld = prepareShapes();
  private readonly grid = graticule();
  private readonly land = new PolyBuffer();
  private readonly hl = new PolyBuffer();
  private readonly sel = new PolyBuffer();
  readonly lines = new PolyBuffer();
  readonly tmp: Projected = { x: 0, y: 0, visible: false };
  private readonly tmp2: Projected = { x: 0, y: 0, visible: false };
  private readonly shade = new NightShade();
  private readonly offsets = [0, 0, 0];

  private w = 1;
  private h = 1;
  private dpr = 1;
  private readonly space = new SpaceBackdrop();
  private glow: HTMLCanvasElement | null = null;
  private glowR = 0;
  private oceanFill: CanvasGradient | null = null;
  private landFill: CanvasGradient | null = null;
  private limbFill: CanvasGradient | null = null;
  private hazeFill: CanvasGradient | null = null;
  private fillKey = '';
  private lakeFill = mixColor(DEFAULT_COLORS.ocean1, DEFAULT_COLORS.shallows, 0.25);
  private lakeLine = withAlpha(DEFAULT_COLORS.shallows, 0.6);
  private veil = withAlpha(DEFAULT_COLORS.newDay, 0.07);
  private mapOcean: CanvasGradient | null = null;
  private mapKey = '';

  private sub: SubsolarPoint = subsolarPoint(new Date());
  private readonly sun: MVec3 = [1, 0, 0];
  private lights: Float32Array = new Float32Array(0);
  private lightSize: Float32Array = new Float32Array(0);

  private readonly trail = new TrailLayer();

  private newDay: number | null = null;
  private newDayRing: Float32Array | null = null;
  private meridian: Float32Array | null = null;

  /** Traces the land (and highlighted land) outlines: the clip for the sunset glow. */
  private readonly traceLand = (ctx: CanvasRenderingContext2D): void => {
    Overlay.trace(ctx, this.land, true);
    Overlay.trace(ctx, this.hl, true);
  };

  /** `onArt` runs when an illustrated sleigh finishes loading (the caller redraws). */
  constructor(onArt: () => void = () => {}) {
    this.overlay = new Overlay(onArt);
    this.shade.setColors(DEFAULT_COLORS);
    sunVector(new Date(), this.sun);
  }

  /** The countries to light up, in `color` (kept when omitted). */
  setHighlight(isos: ReadonlySet<string>, color?: string): void {
    if (color) this.highlightColor = color;
    this.lit = isEverywhere(isos) ? new Set() : isos;
  }

  setSize(w: number, h: number, dpr: number): void {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    if (dpr !== this.dpr) { this.dpr = dpr; this.glowR = 0; }
    this.overlay.setScale(dpr);
    this.ortho.setSize(this.w, this.h);
    this.flat.setSize(this.w, this.h);
  }

  setColors(c: GlobeColors): void {
    this.colors = c;
    this.shade.setColors(c);
    this.overlay.setInk(c.ink);
    this.lakeFill = mixColor(c.ocean1, c.shallows, 0.25);
    this.lakeLine = withAlpha(c.shallows, 0.6);
    this.veil = withAlpha(c.newDay, 0.07);
    this.glowR = 0;
    this.fillKey = '';
    this.mapKey = '';
  }

  /** City lights for the night side: positions plus a size from population. */
  setLights(points: readonly { lon: number; lat: number; pop: number }[]): void {
    this.lights = new Float32Array(points.length * 3);
    this.lightSize = new Float32Array(points.length);
    points.forEach((p, i) => {
      const v = lonlatToVec3(p.lon, p.lat, scratch);
      this.lights[3 * i] = v[0]; this.lights[3 * i + 1] = v[1]; this.lights[3 * i + 2] = v[2];
      this.lightSize[i] = 5 + Math.min(7, Math.log2(1 + p.pop * 4) * 1.3);
    });
  }

  /** Moves the sun (the light texture rebuilds lazily on the next frame). */
  setTime(date: Date): void {
    this.sub = subsolarPoint(date);
    sunVector(date, this.sun);
  }

  get subsolar(): SubsolarPoint { return this.sub; }

  /** Santa's glowing trail through `points` (the stops so far); null clears it. */
  setTrail(points: readonly LonLat[] | null): void {
    this.trail.set(points);
  }

  /** The live end of the trail, from its last stop to the sleigh at (lon, lat). */
  setTrailHead(lon: number, lat: number): void {
    this.trail.head(lon, lat);
  }

  /**
   * Tints the region that has reached the new day: from `meridian` east to the date line
   * (180°). null, or a meridian at the ends of the range, turns it off.
   */
  setNewDay(meridian: number | null): void {
    if (meridian === null || meridian >= 179.9 || meridian <= -179.9) {
      this.newDay = null; this.newDayRing = null; this.meridian = null; return;
    }
    if (this.newDay !== null && Math.abs(meridian - this.newDay) < 0.05) return;
    this.newDay = meridian;
    // Anticlockwise from outside: north along the date line, then south along the meridian.
    const ring: number[] = [];
    const line: number[] = [];
    for (let lat = -88; lat <= 88; lat += 4) { const v = lonlatToVec3(180, lat, scratch); ring.push(v[0], v[1], v[2]); }
    for (let lat = 88; lat >= -88; lat -= 4) {
      const v = lonlatToVec3(meridian, lat, scratch);
      ring.push(v[0], v[1], v[2]);
      line.push(v[0], v[1], v[2]);
    }
    this.newDayRing = new Float32Array(ring);
    this.meridian = new Float32Array(line);
  }

  /** Paints one frame; `t` in seconds drives the pulses and the sleigh's bob. */
  draw(ctx: CanvasRenderingContext2D, t: number): void {
    this.paintBackground(ctx);
    if (this.mode === 'globe') this.drawGlobe(ctx, t);
    else this.drawMap(ctx, t);
  }

  // ───────────────────────────────────────────────────── shared pieces

  private paintBackground(ctx: CanvasRenderingContext2D): void {
    const p = this.mode === 'globe' ? this.ortho : this.flat;
    this.space.draw(ctx, this.w, this.h, this.dpr, this.colors, p.centerLon, p.centerLat);
  }

  private fillBuf(ctx: CanvasRenderingContext2D, buf: PolyBuffer, fill: string | CanvasGradient, stroke: string | null, width: number): void {
    if (buf.count === 0) return;
    ctx.beginPath();
    Overlay.trace(ctx, buf, true);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = width;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  /**
   * Shallow water hugging the coasts, a crisp coastline, the land with thin paper-seam
   * borders, then the celebrating countries glowing in the theme colour with a white edge.
   * The coastline is stroked before the fill so the fill hides it along shared borders.
   */
  private paintLand(ctx: CanvasRenderingContext2D, lw: number, landFill: string | CanvasGradient): void {
    const col = this.colors;
    if (this.land.count + this.hl.count === 0) return;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    Overlay.trace(ctx, this.land, true);
    Overlay.trace(ctx, this.hl, true);
    ctx.strokeStyle = col.shallows;
    ctx.globalAlpha = 0.14;
    ctx.lineWidth = lw * 10;
    ctx.stroke();
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = lw * 4.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = lw * 2.2;
    ctx.strokeStyle = col.coastLine;
    ctx.stroke();
    this.fillBuf(ctx, this.land, landFill, col.landLine, lw * 0.85);
    if (this.hl.count === 0) return;
    ctx.beginPath();
    Overlay.trace(ctx, this.hl, true);
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = lw * (this.mode === 'globe' ? 6.5 : 4);
    ctx.strokeStyle = this.highlightColor;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.highlightColor;
    ctx.fill();
    ctx.lineWidth = lw * 1.7;
    ctx.strokeStyle = col.highlightLine;
    ctx.stroke();
  }

  /**
   * Celebrating countries shine through the night like lanterns: a 'color' blend gives the
   * darkened land back the theme's hue (deep amber, not khaki), a screen lifts it a little,
   * and a soft glow and the white edge go on top. Then the tapped outline.
   */
  private relight(ctx: CanvasRenderingContext2D, lw: number): void {
    if (this.hl.count > 0) {
      ctx.beginPath();
      Overlay.trace(ctx, this.hl, true);
      ctx.fillStyle = this.highlightColor;
      ctx.globalCompositeOperation = 'color';
      ctx.fill();
      // Lift them a little so they glow in the dark (barely changes the day side).
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.34;
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.14;
      ctx.lineJoin = 'round';
      ctx.lineWidth = lw * (this.mode === 'globe' ? 7 : 4);
      ctx.strokeStyle = this.highlightColor;
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.lineWidth = lw * 1.7;
      ctx.strokeStyle = this.colors.highlightLine;
      ctx.stroke();
    }
    this.outlineSelected(ctx);
  }

  /** The tapped country: a white die-cut edge with an ink line inside it. */
  private outlineSelected(ctx: CanvasRenderingContext2D): void {
    if (this.sel.count === 0) return;
    ctx.beginPath();
    Overlay.trace(ctx, this.sel, true);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = this.colors.ink;
    ctx.stroke();
  }

  /** Projects a point into `out`; returns its opacity (0 = behind the globe or off the map). */
  private place(lon: number, lat: number, out: Projected): number {
    if (this.mode === 'globe') {
      const v = lonlatToVec3(lon, lat, scratch);
      this.ortho.projectVec(v[0], v[1], v[2], out);
      return Math.max(0, Math.min(1, (this.ortho.depth(v[0], v[1], v[2]) - 0.02) / 0.12));
    }
    this.flat.project(lon, lat, out);
    return out.x >= -40 && out.x <= this.w + 40 && out.y >= -40 && out.y <= this.h + 40 ? 1 : 0;
  }

  private drawMarkers(ctx: CanvasRenderingContext2D, t: number): void {
    const tmp = this.tmp;
    let labels = 0;
    for (const m of this.markers) {
      const alpha = this.place(m.lon, m.lat, tmp);
      if (alpha <= 0) continue;
      const x = tmp.x;
      const y = tmp.y;
      ctx.globalAlpha = alpha;
      if (m.sprite === 'sleigh') {
        const scale = this.mode === 'globe' ? this.ortho.scale : this.flat.scale * 57;
        const width = m.size ?? Math.max(78, Math.min(150, scale * 0.4));
        let dx = 0;
        let dy = 0;
        if (m.toward) {
          this.place(m.toward.lon, m.toward.lat, this.tmp2);
          dx = this.tmp2.x - x;
          dy = this.tmp2.y - y;
          const W = this.flat.wrapWidth();
          if (this.mode === 'map' && Math.abs(dx) > W / 2) dx -= Math.sign(dx) * W;
        }
        this.overlay.sleighAt(ctx, x, y, width, dx, dy, t, this.animate, this.colors.trail);
        if (m.label && this.overlay.label(ctx, m.label, x, y, width * 0.3, this.w, labels)) labels++;
        continue;
      }
      if (m.sprite === 'sun') {
        // The sun scales with the planet so it never swamps a phone-sized map.
        const s = m.size ?? (this.mode === 'globe' ? Math.max(24, Math.min(36, this.ortho.scale * 0.1)) : Math.max(18, Math.min(32, this.flat.scale * 7)));
        this.overlay.sunAt(ctx, x, y, s);
        continue;
      }
      const size = m.size ?? (m.emoji ? 26 : 10);
      if (m.pulse) this.overlay.pulse(ctx, x, y, size, t, this.animate, (m.lon + 180) / 360, alpha, m.dot ?? '#ffffff');
      this.overlay.marker(ctx, m, x, y, size, this.highlightColor);
      if (m.label && this.overlay.label(ctx, m.label, x, y, size / 2, this.w, labels)) labels++;
    }
    ctx.globalAlpha = 1;
  }

  // ───────────────────────────────────────────────────── globe

  private paintGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number): void {
    if (!this.glow || R / this.glowR > 1.2 || R / this.glowR < 0.83) {
      this.glowR = R;
      this.glow = paintAtmosphere(R, this.dpr, this.colors.atmosphere);
    }
    if (!this.glow) return;
    const half = (this.glow.width / this.dpr / 2) * (R / this.glowR);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(this.glow, cx - half, cy - half, half * 2, half * 2);
    ctx.globalCompositeOperation = 'source-over';
  }

  /** Gradients for the disc, rebuilt only when its size, place or palette changes. */
  private fills(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number): void {
    const c = this.colors;
    const key = `${cx.toFixed(1)}|${cy.toFixed(1)}|${R.toFixed(1)}|${c.ocean1}|${c.ocean2}|${c.land}|${c.land2}|${c.atmosphere}`;
    if (key === this.fillKey && this.oceanFill) return;
    this.fillKey = key;
    const lx = cx - R * 0.32;
    const ly = cy - R * 0.36;
    const o = ctx.createRadialGradient(lx, ly, R * 0.04, cx, cy, R * 1.02);
    o.addColorStop(0, c.ocean1);
    o.addColorStop(1, c.ocean2);
    this.oceanFill = o;
    const l = ctx.createRadialGradient(lx, ly, 0, cx, cy, R);
    l.addColorStop(0, c.land);
    l.addColorStop(0.55, c.land);
    l.addColorStop(1, c.land2);
    this.landFill = l;
    const limb = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R);
    limb.addColorStop(0, 'rgba(2, 8, 32, 0)');
    limb.addColorStop(0.7, 'rgba(2, 8, 32, 0.07)');
    limb.addColorStop(1, 'rgba(2, 8, 32, 0.32)');
    this.limbFill = limb;
    const haze = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R);
    haze.addColorStop(0, withAlpha(c.atmosphere, 0));
    haze.addColorStop(0.65, withAlpha(c.atmosphere, 0.1));
    haze.addColorStop(1, withAlpha(c.atmosphere, 0.55));
    this.hazeFill = haze;
  }

  private disc(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, op: GlobalCompositeOperation = 'source-over'): void {
    ctx.globalCompositeOperation = op;
    ctx.beginPath();
    ctx.arc(this.w / 2, this.h / 2, this.ortho.scale, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  /** The sun's reflection on the sea: halfway between the sun and the viewer, gone once the sun is behind. */
  private glint(ctx: CanvasRenderingContext2D): void {
    const o = this.ortho;
    const s = this.sun;
    const c = o.c;
    const sc = s[0] * c[0] + s[1] * c[1] + s[2] * c[2];
    if (sc < -0.2) return;
    let hx = s[0] + c[0], hy = s[1] + c[1], hz = s[2] + c[2];
    const len = Math.hypot(hx, hy, hz) || 1;
    hx /= len; hy /= len; hz /= len;
    o.projectVec(hx, hy, hz, this.tmp);
    const k = Math.min(1, (sc + 0.2) / 0.7);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.42 * k;
    this.overlay.soft(ctx, this.tmp.x, this.tmp.y, o.scale * 0.95, '#ffffff');
    ctx.globalAlpha = 0.28 * k;
    this.overlay.soft(ctx, this.tmp.x, this.tmp.y, o.scale * 0.28, '#ffffff');
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private clipInto(buf: PolyBuffer, ring: PreparedRing): void {
    const c = this.ortho.c;
    const cap = ring.cap;
    // Skip rings whose whole bounding cap is on the far side.
    if (cap[0]! * c[0] + cap[1]! * c[1] + cap[2]! * c[2] < -cap[4]!) return;
    // cos(radius) > 0: the ring fits in less than a hemisphere, so no rim walk is longer than π.
    clipRingInto(ring.vec, this.ortho, buf, this.tmp, cap[3]! > 0 ? Math.PI : Math.PI * 2);
  }

  private drawGlobe(ctx: CanvasRenderingContext2D, t: number): void {
    const o = this.ortho;
    const cx = this.w / 2;
    const cy = this.h / 2;
    const R = o.scale;
    const col = this.colors;
    this.paintGlow(ctx, cx, cy, R);
    this.fills(ctx, cx, cy, R);
    this.disc(ctx, this.oceanFill ?? col.ocean1);
    this.glint(ctx);

    this.lines.reset();
    for (const line of this.grid) clipLineInto(line, o, this.lines, false, this.tmp);
    ctx.beginPath();
    Overlay.trace(ctx, this.lines, false);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = col.graticule;
    ctx.stroke();

    this.land.reset();
    this.hl.reset();
    this.sel.reset();
    for (const country of this.world.countries) {
      const buf = this.lit.has(country.iso) ? this.hl : this.land;
      for (const ring of country.rings) this.clipInto(buf, ring);
      if (country.iso === this.selected) for (const ring of country.rings) this.clipInto(this.sel, ring);
    }
    const lw = Math.max(0.6, Math.min(1.25, R / 300));
    this.paintLand(ctx, lw, this.landFill ?? col.land);
    this.lines.reset();
    for (const lake of this.world.lakes) this.clipInto(this.lines, lake);
    this.fillBuf(ctx, this.lines, this.lakeFill, this.lakeLine, lw * 0.8);
    this.outlineSelected(ctx);
    this.disc(ctx, this.limbFill ?? 'transparent');

    if (this.night) {
      this.shade.paintGlobe(ctx, o, this.sun, this.dpr, this.traceLand);
      this.relight(ctx, lw);
      this.overlay.cityLights(ctx, this, this.lights, this.lightSize, this.sun, this.colors.lights);
    }

    if (this.newDayRing && this.newDay !== null) {
      this.lines.reset();
      clipRingInto(this.newDayRing, o, this.lines, this.tmp);
      ctx.globalCompositeOperation = 'screen';
      ctx.beginPath();
      Overlay.trace(ctx, this.lines, true);
      ctx.fillStyle = this.veil;
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    if (this.meridian) {
      this.lines.reset();
      clipLineInto(this.meridian, o, this.lines, false, this.tmp);
      ctx.beginPath();
      Overlay.trace(ctx, this.lines, false);
      this.overlay.glowStroke(ctx, col.newDay, 3.2, '#fff4cc', 1, 10);
    }

    this.disc(ctx, this.hazeFill ?? 'transparent', 'screen');
    this.trail.draw(ctx, this, this.colors.trail, t, this.animate);
    this.drawMarkers(ctx, t);
  }

  // ───────────────────────────────────────────────────── flat map

  private drawMap(ctx: CanvasRenderingContext2D, t: number): void {
    const f = this.flat;
    const col = this.colors;
    const W = f.wrapWidth();
    const offsets = this.offsets;
    offsets[0] = -W; offsets[1] = 0; offsets[2] = W;
    f.projectRaw(0, 90, this.tmp);
    const top = this.tmp.y;
    f.projectRaw(0, -90, this.tmp);
    const bottom = this.tmp.y;

    const key = `${top.toFixed(1)}|${bottom.toFixed(1)}|${col.ocean1}|${col.ocean2}`;
    if (!this.mapOcean || key !== this.mapKey) {
      this.mapKey = key;
      const g = ctx.createLinearGradient(0, top, 0, bottom);
      g.addColorStop(0, col.ocean2);
      g.addColorStop(0.5, col.ocean1);
      g.addColorStop(1, col.ocean2);
      this.mapOcean = g;
    }
    const ocean = this.mapOcean;
    ctx.fillStyle = ocean;
    ctx.fillRect(0, Math.max(0, top), this.w, Math.min(this.h, bottom) - Math.max(0, top));

    ctx.beginPath();
    for (let lon = -180; lon < 180; lon += 30) {
      for (const off of offsets) {
        f.projectRaw(lon, 0, this.tmp);
        const x = this.tmp.x + off;
        if (x < -1 || x > this.w + 1) continue;
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
      }
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      f.projectRaw(0, lat, this.tmp);
      ctx.moveTo(0, this.tmp.y);
      ctx.lineTo(this.w, this.tmp.y);
    }
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = col.graticule;
    ctx.stroke();

    this.land.reset();
    this.hl.reset();
    this.sel.reset();
    for (const country of this.world.countries) {
      const buf = this.lit.has(country.iso) ? this.hl : this.land;
      const picked = country.iso === this.selected;
      for (const ring of country.rings) {
        for (const off of offsets) {
          mapRingInto(ring.lonlat, ring.bbox, f, off, buf, this.tmp);
          if (picked) mapRingInto(ring.lonlat, ring.bbox, f, off, this.sel, this.tmp);
        }
      }
    }
    const lw = Math.max(0.6, Math.min(1.2, f.scale / 3.5));
    this.paintLand(ctx, lw, col.land);
    this.lines.reset();
    for (const lake of this.world.lakes) for (const off of offsets) mapRingInto(lake.lonlat, lake.bbox, f, off, this.lines, this.tmp);
    this.fillBuf(ctx, this.lines, this.lakeFill, this.lakeLine, lw * 0.8);
    this.outlineSelected(ctx);

    if (this.night) {
      this.shade.paintMap(ctx, f, this.sun, offsets, top, bottom, this.traceLand);
      this.relight(ctx, lw);
      this.overlay.cityLights(ctx, this, this.lights, this.lightSize, this.sun, this.colors.lights);
    }
    if (this.newDay !== null) {
      f.projectRaw(this.newDay, 0, this.tmp);
      const x0 = this.tmp.x;
      f.projectRaw(180, 0, this.tmp);
      const x1 = this.tmp.x;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = this.veil;
      for (const off of offsets) ctx.fillRect(x0 + off, top, x1 - x0, bottom - top);
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      for (const off of offsets) { ctx.moveTo(x0 + off, top); ctx.lineTo(x0 + off, bottom); }
      this.overlay.glowStroke(ctx, col.newDay, 3.2, '#fff4cc', 1, 10);
    }

    this.trail.draw(ctx, this, this.colors.trail, t, this.animate);
    this.drawMarkers(ctx, t);
  }
}
