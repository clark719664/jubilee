/**
 * particles.ts — particle storage and behaviours for Jubilee effects.
 *
 * Storage: `new ParticlePool(capacity)` is a struct-of-arrays pool. Nothing is allocated per frame:
 *   const i = pool.alloc();        // index, or -1 when the pool is full; every field reset to defaults
 *   pool.kill(i);                  // swap-remove — safe inside `forEach` or a reverse `for` loop
 *   for (let i = pool.count - 1; i >= 0; i--) { … }   // the idiomatic step loop (no closure per frame)
 *
 * Fields (Float32Array unless noted). Typed arrays read as `number | undefined` under
 * noUncheckedIndexedAccess, so write `pool.x[i]!` when reading and `pool.x[i] = v` when writing.
 *   x, y        position, CSS px             vx, vy     velocity, px/s
 *   size        nominal sprite size, px      rot, rotV  rotation (rad) and spin speed (rad/s)
 *   life        age in seconds (counts up)   maxLife    lifespan in seconds; 0 = immortal
 *   phase       oscillator angle used by sway/flutter/flame, or a per-particle offset for twinkle
 *   depth       0..1 parallax hint (far → near)          alpha   0..1 draw opacity
 *   aux         spare scalar for the preset's own use (ground target, flutter frequency, burst type…)
 *   kind, color Uint8Array: what the particle is / index into the preset's colour table
 *
 * Behaviours are plain functions `(pool, i, dt, …)` called per particle inside the preset's step loop:
 *   forces (change velocity)   gravity(g, terminal)   drag(k)   wander(jitter, rand)
 *   drift  (change position)   wind(wx)   sway(amp, freq)   flutter(amp, freq)   rise(speed)
 *   state                      spin(speed)   flame(flicker, rand)   twinkle(freq, depth, base)   settle(groundY)
 * then `integrate(pool, i, dt)` applies velocity and ages the particle; `expired` / `offscreen` decide death.
 * `sway` and `flutter` both advance `phase` — use one or the other for a given particle.
 *
 * Emitters: `spawnEdge(pool, edge, w, h, count, rand, init, x?, y?)` spawns `count` particles now;
 * `Emitter.due(rate, dt)` converts a per-second rate into whole particles with a fractional carry, so
 * spawn rates are frame-rate independent; `Budgeter` keeps `pool.count <= input.budget`.
 */

export const TAU = Math.PI * 2;

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

/** Uniform random in [lo, hi). */
export function range(rand: () => number, lo: number, hi: number): number {
  return lo + (hi - lo) * rand();
}

export class ParticlePool {
  readonly capacity: number;
  count = 0;

  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly size: Float32Array;
  readonly rot: Float32Array;
  readonly rotV: Float32Array;
  readonly life: Float32Array;
  readonly maxLife: Float32Array;
  readonly phase: Float32Array;
  readonly depth: Float32Array;
  readonly alpha: Float32Array;
  readonly aux: Float32Array;
  readonly kind: Uint8Array;
  readonly color: Uint8Array;

  private readonly floats: readonly Float32Array[];

  constructor(capacity: number) {
    this.capacity = Math.max(1, Math.floor(capacity));
    const f = (): Float32Array => new Float32Array(this.capacity);
    this.x = f(); this.y = f(); this.vx = f(); this.vy = f(); this.size = f(); this.rot = f(); this.rotV = f();
    this.life = f(); this.maxLife = f(); this.phase = f(); this.depth = f(); this.alpha = f(); this.aux = f();
    this.kind = new Uint8Array(this.capacity);
    this.color = new Uint8Array(this.capacity);
    this.floats = [this.x, this.y, this.vx, this.vy, this.size, this.rot, this.rotV, this.life, this.maxLife, this.phase, this.depth, this.alpha, this.aux];
  }

  get full(): boolean {
    return this.count >= this.capacity;
  }

  /** Returns a fresh index with default field values, or -1 when the pool is full. */
  alloc(): number {
    if (this.count >= this.capacity) return -1;
    const i = this.count++;
    this.x[i] = 0; this.y[i] = 0; this.vx[i] = 0; this.vy[i] = 0; this.size[i] = 8; this.rot[i] = 0; this.rotV[i] = 0;
    this.life[i] = 0; this.maxLife[i] = 0; this.phase[i] = 0; this.depth[i] = 1; this.alpha[i] = 1; this.aux[i] = 0;
    this.kind[i] = 0; this.color[i] = 0;
    return i;
  }

  /** Swap-removes particle `i`: the last particle moves into slot `i`. */
  kill(i: number): void {
    const last = this.count - 1;
    if (i < 0 || i > last) return;
    if (i !== last) {
      for (const a of this.floats) a[i] = a[last]!;
      this.kind[i] = this.kind[last]!;
      this.color[i] = this.color[last]!;
    }
    this.count = last;
  }

  /** Visits every alive particle from newest to oldest, so `kill(i)` inside `fn` is safe. */
  forEach(fn: (i: number) => void): void {
    for (let i = this.count - 1; i >= 0; i--) fn(i);
  }

  clear(): void {
    this.count = 0;
  }

  /** True when both pools hold identical particles (tests: determinism). */
  equals(other: ParticlePool): boolean {
    if (other.count !== this.count) return false;
    for (let k = 0; k < this.floats.length; k++) {
      const a = this.floats[k]!;
      const b = other.floats[k]!;
      for (let i = 0; i < this.count; i++) if (a[i] !== b[i]) return false;
    }
    for (let i = 0; i < this.count; i++) {
      if (this.kind[i] !== other.kind[i] || this.color[i] !== other.color[i]) return false;
    }
    return true;
  }

  /** True when every field of every alive particle is a finite number (tests: still frames). */
  finite(): boolean {
    for (const a of this.floats) {
      for (let i = 0; i < this.count; i++) if (!Number.isFinite(a[i])) return false;
    }
    return true;
  }
}

// ------------------------------------------------------------------ behaviours (forces)

/** Accelerates downwards by `g` px/s², never faster than `terminal`. */
export function gravity(pool: ParticlePool, i: number, dt: number, g: number, terminal = Infinity): void {
  const vy = pool.vy[i]! + g * dt;
  pool.vy[i] = vy > terminal ? terminal : vy;
}

/** Exponential velocity damping: k = 1 halves the speed in about 0.7 s. */
export function drag(pool: ParticlePool, i: number, dt: number, k: number): void {
  const f = Math.max(0, 1 - k * dt);
  pool.vx[i]! *= f;
  pool.vy[i]! *= f;
}

/** Random acceleration of up to ±jitter px/s² on both axes. */
export function wander(pool: ParticlePool, i: number, dt: number, jitter: number, rand: () => number): void {
  pool.vx[i]! += (rand() * 2 - 1) * jitter * dt;
  pool.vy[i]! += (rand() * 2 - 1) * jitter * dt;
}

// ------------------------------------------------------------------ behaviours (drift)

/** Constant sideways drift of `wx` px/s, independent of the particle's own velocity. */
export function wind(pool: ParticlePool, i: number, dt: number, wx: number): void {
  pool.x[i]! += wx * dt;
}

/** Sideways oscillation of ±amp px at `freq` Hz. Advances `phase`. */
export function sway(pool: ParticlePool, i: number, dt: number, amp: number, freq: number): void {
  const w = TAU * freq;
  const ph = pool.phase[i]! + w * dt;
  pool.phase[i] = ph;
  pool.x[i]! += Math.cos(ph) * amp * w * dt;
}

/**
 * Tumbling-card flutter: sways like `sway` and falls a little slower while flat. Advances `phase`;
 * draw the sprite with scaleX = |cos(phase)| to fake the flip without save/rotate/restore.
 */
export function flutter(pool: ParticlePool, i: number, dt: number, amp: number, freq: number): void {
  const w = TAU * freq;
  const ph = pool.phase[i]! + w * dt;
  pool.phase[i] = ph;
  const c = Math.cos(ph);
  pool.x[i]! += c * amp * w * dt;
  pool.y[i]! += (0.5 - Math.abs(c)) * amp * 0.6 * w * dt;
}

/** Constant upward drift of `speed` px/s. */
export function rise(pool: ParticlePool, i: number, dt: number, speed: number): void {
  pool.y[i]! -= speed * dt;
}

// ------------------------------------------------------------------ behaviours (state)

/** Rotates by the particle's own `rotV`, scaled by `speed`. */
export function spin(pool: ParticlePool, i: number, dt: number, speed = 1): void {
  pool.rot[i]! += pool.rotV[i]! * speed * dt;
}

/**
 * Sets alpha = base × (1 − depth × (0.5 + 0.5·sin(2π·freq·life + phase))) and returns it.
 * Uses `life` as its clock and `phase` as a per-particle offset, so it combines with sway.
 * Keep freq ≤ 2.5 Hz: nothing in Jubilee may flash faster than 3 Hz.
 */
export function twinkle(pool: ParticlePool, i: number, freq: number, depth: number, base = 1): number {
  const a = base * (1 - depth * (0.5 + 0.5 * Math.sin(TAU * freq * pool.life[i]! + pool.phase[i]!)));
  pool.alpha[i] = a;
  return a;
}

/**
 * Candle flicker: alpha wanders in [1 − flicker/2, 1] at roughly 1–2 Hz with a little noise.
 * Advances `phase`; `Math.sin(pool.phase[i])` makes a good lean angle for the flame tip.
 */
export function flame(pool: ParticlePool, i: number, dt: number, flicker: number, rand: () => number): void {
  const ph = pool.phase[i]! + (7 + 5 * rand()) * dt;
  pool.phase[i] = ph;
  pool.alpha[i] = 1 - flicker * (0.35 * (0.5 + 0.5 * Math.sin(ph)) + 0.15 * rand());
}

/** Stops the particle on the ground line; returns true once it is resting there. */
export function settle(pool: ParticlePool, i: number, groundY: number): boolean {
  if (pool.y[i]! < groundY) return false;
  pool.y[i] = groundY;
  pool.vx[i] = 0;
  pool.vy[i] = 0;
  pool.rotV[i] = 0;
  return true;
}

// ------------------------------------------------------------------ integration & lifetime

/** Applies velocity and ages the particle. Call once per step, after the forces and drifts. */
export function integrate(pool: ParticlePool, i: number, dt: number): void {
  pool.x[i]! += pool.vx[i]! * dt;
  pool.y[i]! += pool.vy[i]! * dt;
  pool.life[i]! += dt;
}

/** True when a mortal particle has outlived `maxLife`. */
export function expired(pool: ParticlePool, i: number): boolean {
  const m = pool.maxLife[i]!;
  return m > 0 && pool.life[i]! >= m;
}

/** True when the particle is more than `margin` px outside the w×h canvas. */
export function offscreen(pool: ParticlePool, i: number, w: number, h: number, margin = 32): boolean {
  const x = pool.x[i]!;
  const y = pool.y[i]!;
  return x < -margin || x > w + margin || y < -margin || y > h + margin;
}

/**
 * 0..1 opacity envelope: ramps up over the first `fadeIn` seconds and, for mortal particles,
 * down over the last `fadeOut` seconds. Fireworks and glows must use fadeIn ≥ 0.3 (no flashing).
 */
export function envelope(pool: ParticlePool, i: number, fadeIn: number, fadeOut: number): number {
  const life = pool.life[i]!;
  const max = pool.maxLife[i]!;
  let a = fadeIn > 0 ? Math.min(1, life / fadeIn) : 1;
  if (max > 0 && fadeOut > 0) a = Math.min(a, Math.max(0, (max - life) / fadeOut));
  return a;
}

// ------------------------------------------------------------------ emitters

export type Edge = 'top' | 'bottom' | 'left' | 'right' | 'area' | 'point';

/** Initialises a freshly allocated particle: set size, velocity, kind, colour, lifetime… */
export type ParticleInit = (pool: ParticlePool, i: number, rand: () => number) => void;

/**
 * Spawns up to `count` particles now. Edge spawns pick a random spot along that edge, call `init`,
 * then nudge the particle outward by its `size` so it starts fully off-screen. `area` spawns anywhere
 * in w×h; `point` spawns at (x, y). Returns how many were spawned (fewer when the pool fills).
 * New particles occupy the last slots: `for (let i = pool.count - n; i < pool.count; i++)`.
 */
export function spawnEdge(
  pool: ParticlePool, edge: Edge, w: number, h: number, count: number, rand: () => number, init: ParticleInit, x = 0, y = 0,
): number {
  let n = 0;
  for (; n < count; n++) {
    const i = pool.alloc();
    if (i < 0) break;
    switch (edge) {
      case 'top': pool.x[i] = rand() * w; pool.y[i] = 0; break;
      case 'bottom': pool.x[i] = rand() * w; pool.y[i] = h; break;
      case 'left': pool.x[i] = 0; pool.y[i] = rand() * h; break;
      case 'right': pool.x[i] = w; pool.y[i] = rand() * h; break;
      case 'area': pool.x[i] = rand() * w; pool.y[i] = rand() * h; break;
      case 'point': pool.x[i] = x; pool.y[i] = y; break;
    }
    init(pool, i, rand);
    const m = pool.size[i]!;
    if (edge === 'top') pool.y[i]! -= m;
    else if (edge === 'bottom') pool.y[i]! += m;
    else if (edge === 'left') pool.x[i]! -= m;
    else if (edge === 'right') pool.x[i]! += m;
  }
  return n;
}

/**
 * Turns a per-second spawn rate into whole particles. The fractional remainder is carried to the
 * next frame, so 10/s yields exactly 10 particles per second at any frame rate. One Emitter per
 * particle stream (flakes and crystals are two emitters).
 */
export class Emitter {
  carry = 0;

  /** Number of particles due this frame for `rate` per second. */
  due(rate: number, dt: number): number {
    this.carry += Math.max(0, rate) * dt;
    const n = Math.floor(this.carry);
    this.carry -= n;
    return n;
  }

  /** `due` + `spawnEdge`, clamped to `room` (surplus is dropped, not carried, so there is no catch-up burst). */
  spawn(
    pool: ParticlePool, edge: Edge, w: number, h: number, rate: number, dt: number, rand: () => number, init: ParticleInit,
    room = Infinity, x = 0, y = 0,
  ): number {
    const n = Math.min(this.due(rate, dt), room);
    return n > 0 ? spawnEdge(pool, edge, w, h, n, rand, init, x, y) : 0;
  }

  reset(): void {
    this.carry = 0;
  }
}

/** Spawn rate that keeps a stream of particles living `lifetime` seconds at `fill` × budget. */
export function steadyRate(budget: number, lifetime: number, fill = 0.85): number {
  return lifetime > 0 ? (budget * fill) / lifetime : 0;
}

/**
 * Keeps the pool within `input.budget`. Call `frame(input.budget)` first thing in `step`, then size
 * every spawn with `take(wanted)`; `frame` also trims surplus particles after a budget drop.
 */
export class Budgeter {
  limit: number;

  constructor(readonly pool: ParticlePool) {
    this.limit = pool.capacity;
  }

  /** Sets this frame's limit (clamped to the pool capacity), trims any surplus and returns the room left. */
  frame(budget: number): number {
    this.limit = Math.max(0, Math.min(Math.floor(budget), this.pool.capacity));
    while (this.pool.count > this.limit) this.pool.kill(this.pool.count - 1);
    return this.room();
  }

  /** Particles that may still be spawned this frame. */
  room(): number {
    return Math.max(0, this.limit - this.pool.count);
  }

  /** Clamps `wanted` to the room left, keeping `reserve` slots free for other layers. */
  take(wanted: number, reserve = 0): number {
    return Math.max(0, Math.min(Math.floor(wanted), this.room() - reserve));
  }
}
