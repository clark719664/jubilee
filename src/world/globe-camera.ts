/**
 * Where the globe looks and how it moves between frames: eased spins, following a moving
 * point (Santa), flings that glide to a stop, slow auto-rotation and eased zoom. Pure state
 * and maths (no DOM), so `Globe` is only about input, the loop and drawing.
 *
 * A fling uses the drag's last ~100 ms of camera positions, not one jittery pointer event,
 * and decays exponentially (velocity falls to 1/e in GLIDE_S seconds): it feels like a real
 * ball spinning down. Under reduced motion every move snaps and nothing glides.
 */
import type { MotionMode } from '../effects/types';
import { normLon, type LonLat } from './geo';

export type CameraMode = 'globe' | 'map';

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 8;
/** The globe never tips past this latitude, so north stays up. */
export const MAX_LAT = 85;
const GLIDE_S = 0.6;
const MAX_SPIN = 360;
const SAMPLES = 8;

interface Spin { lon0: number; lat0: number; dLon: number; dLat: number; t0: number; ms: number }

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function clampZoom(z: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
}

function clampViewLat(lat: number): number {
  return Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
}

export class GlobeCamera {
  mode: CameraMode = 'globe';
  motion: MotionMode = 'full';
  lon = 0;
  /** Globe tilt (clamped) and the map's vertical pan are kept apart: switching modes keeps both. */
  lat = 15;
  mapLat = 0;
  zoomGlobe = 1;
  zoomMap = 1;
  /** A finger is on the canvas: automatic cameras wait. */
  dragging = false;
  private goalGlobe = 1;
  private goalMap = 1;
  private velLon = 0;
  private velLat = 0;
  private autoDps = 0;
  private spin: Spin | null = null;
  private follow: LonLat | null = null;
  private readonly samples = new Float64Array(SAMPLES * 3);
  private sampleN = 0;

  get gliding(): boolean { return this.velLon !== 0 || this.velLat !== 0; }

  center(): LonLat {
    return { lon: this.lon, lat: this.mode === 'globe' ? this.lat : this.mapLat };
  }

  private setLat(lat: number): void {
    if (this.mode === 'globe') this.lat = clampViewLat(lat); else this.mapLat = lat;
  }

  setCenter(lon: number, lat: number): void {
    this.spin = null;
    this.follow = null;
    this.lon = normLon(lon);
    this.setLat(lat);
  }

  /** Eased turn to a point (snaps under reduced motion or with ms ≤ 0). */
  spinTo(lon: number, lat: number, ms: number): void {
    this.follow = null;
    this.stopGlide();
    const target = this.mode === 'globe' ? clampViewLat(lat) : lat;
    if (this.motion !== 'full' || ms <= 0) { this.setCenter(lon, target); return; }
    const lat0 = this.center().lat;
    this.spin = { lon0: this.lon, lat0, dLon: normLon(lon - this.lon), dLat: target - lat0, t0: -1, ms };
  }

  /** Keeps easing toward a moving point; a grab or `spinTo` cancels it. */
  followTo(lon: number, lat: number): void {
    if (this.motion !== 'full') { this.setCenter(lon, lat); return; }
    this.follow = { lon, lat };
  }

  stopFollow(): void { this.follow = null; }

  autoRotate(degPerSec: number): void { this.autoDps = degPerSec; }

  /** The child took hold: spins and follows stop where they are. */
  grab(): void {
    this.spin = null;
    this.follow = null;
  }

  stopGlide(): void {
    this.velLon = 0;
    this.velLat = 0;
  }

  /** Reduced motion: finish anything in flight at once. */
  settle(): void {
    this.stopGlide();
    const s = this.spin;
    if (s) {
      this.lon = normLon(s.lon0 + s.dLon);
      this.setLat(s.lat0 + s.dLat);
      this.spin = null;
    }
    this.zoomGlobe = this.goalGlobe;
    this.zoomMap = this.goalMap;
  }

  /** The zoom being aimed for in the current mode. */
  zoom(): number {
    return this.mode === 'globe' ? this.goalGlobe : this.goalMap;
  }

  /** Jumps straight to a zoom (pinch, wheel). */
  setZoom(z: number): void {
    const v = clampZoom(z);
    if (this.mode === 'globe') { this.zoomGlobe = v; this.goalGlobe = v; } else { this.zoomMap = v; this.goalMap = v; }
  }

  /** Eases to a new zoom (buttons, keys); jumps under reduced motion. */
  zoomBy(f: number): void {
    const v = clampZoom(this.zoom() * f);
    if (this.motion !== 'full') { this.setZoom(v); return; }
    if (this.mode === 'globe') this.goalGlobe = v; else this.goalMap = v;
  }

  /** Starts a drag at time `t` (ms). */
  beginDrag(t: number): void {
    this.dragging = true;
    this.stopGlide();
    this.sampleN = 0;
    this.sample(t);
  }

  /** Moves by a drag step (degrees) at time `t`. */
  dragBy(dLon: number, dLat: number, t: number): void {
    this.lon = normLon(this.lon + dLon);
    this.setLat(this.center().lat + dLat);
    this.sample(t);
  }

  /** Lets go at time `t`: glide on with the drag's last speed when `fling` and motion allow. */
  release(t: number, fling: boolean): void {
    this.dragging = false;
    if (!fling || this.motion !== 'full') { this.stopGlide(); return; }
    [this.velLon, this.velLat] = this.releaseVelocity(t);
  }

  private sample(t: number): void {
    const i = (this.sampleN % SAMPLES) * 3;
    this.samples[i] = t;
    this.samples[i + 1] = this.lon;
    this.samples[i + 2] = this.center().lat;
    this.sampleN++;
  }

  /** Release velocity (deg/s) from the drag's last ~100 ms; zero if the finger had come to rest. */
  private releaseVelocity(now: number): [number, number] {
    const n = Math.min(this.sampleN, SAMPLES);
    if (n < 2) return [0, 0];
    const newest = ((this.sampleN - 1) % SAMPLES) * 3;
    const tN = this.samples[newest]!;
    if (now - tN > 70) return [0, 0];
    let oldest = newest;
    for (let k = 1; k < n; k++) {
      const idx = ((this.sampleN - 1 - k) % SAMPLES) * 3;
      if (tN - this.samples[idx]! > 100) break;
      oldest = idx;
    }
    const dt = (tN - this.samples[oldest]!) / 1000;
    if (dt < 0.012) return [0, 0];
    const vLon = normLon(this.samples[newest + 1]! - this.samples[oldest + 1]!) / dt;
    const vLat = (this.samples[newest + 2]! - this.samples[oldest + 2]!) / dt;
    return [Math.max(-MAX_SPIN, Math.min(MAX_SPIN, vLon)), Math.max(-MAX_SPIN, Math.min(MAX_SPIN, vLat))];
  }

  /** Advances one frame (`ts` ms, `dt` s); returns true while anything is still moving. */
  step(ts: number, dt: number): boolean {
    let moving = false;
    const lat0 = this.center().lat;
    if (this.spin) {
      const s = this.spin;
      if (s.t0 < 0) s.t0 = ts;
      const k = Math.min(1, (ts - s.t0) / s.ms);
      const e = easeInOut(k);
      this.lon = normLon(s.lon0 + s.dLon * e);
      this.setLat(s.lat0 + s.dLat * e);
      if (k >= 1) this.spin = null;
      moving = true;
    } else if (this.follow && !this.dragging) {
      const f = this.follow;
      const k = 1 - Math.exp(-dt * 2.5);
      const dLon = normLon(f.lon - this.lon);
      const dLat = f.lat - lat0;
      this.lon = normLon(this.lon + dLon * k);
      this.setLat(lat0 + dLat * k);
      moving = Math.abs(dLon) + Math.abs(dLat) > 0.02;
    }

    if (!this.dragging && this.gliding) {
      this.lon = normLon(this.lon + this.velLon * dt);
      this.setLat(this.center().lat + this.velLat * dt);
      // Hitting the tilt stop ends the vertical glide instead of fighting it.
      if (this.mode === 'globe' && Math.abs(this.lat) >= MAX_LAT) this.velLat = 0;
      const decay = Math.exp(-dt / GLIDE_S);
      this.velLon *= decay;
      this.velLat *= decay;
      if (Math.abs(this.velLon) + Math.abs(this.velLat) < 1) this.stopGlide();
      moving = true;
    }

    if (this.autoDps !== 0 && this.motion === 'full' && !this.dragging && !this.spin && !this.follow && !this.gliding) {
      this.lon = normLon(this.lon + this.autoDps * dt);
      moving = true;
    }

    const kz = 1 - Math.exp(-dt * 14);
    if (this.zoomGlobe !== this.goalGlobe) {
      this.zoomGlobe += (this.goalGlobe - this.zoomGlobe) * kz;
      if (Math.abs(this.goalGlobe - this.zoomGlobe) < 0.002) this.zoomGlobe = this.goalGlobe;
      moving = true;
    }
    if (this.zoomMap !== this.goalMap) {
      this.zoomMap += (this.goalMap - this.zoomMap) * kz;
      if (Math.abs(this.goalMap - this.zoomMap) < 0.002) this.zoomMap = this.goalMap;
      moving = true;
    }
    return moving;
  }
}
