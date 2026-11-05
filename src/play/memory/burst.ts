/**
 * burst.ts — the little celebration when a pair is found: a pop of the holiday's own effect sprites
 * (snowflakes for Christmas, marigolds for Diwali, bats for Halloween…) from the matched cards, and a
 * bigger shower when the board is finished. A small canvas overlay with its own sprite cache; the
 * loop only runs while particles are alive, so an idle board costs nothing.
 *
 * Motion: 'full' animates; 'reduced' draws one still, settled ring of sprites and fades it away (no
 * movement); 'off' draws nothing. Bursts are rate-limited by the game (one per pair, the finale spaces
 * its three pops ≥ 350 ms apart), so nothing ever flashes faster than 3 Hz.
 */
import { mulberry32 } from '../../effects/rng';
import { createSpriteCache, type SpriteCacheImpl } from '../../effects/sprites';
import type { EffectId, EffectParams, MotionMode } from '../../effects/types';
import type { Theme } from '../../theme/themes';

/** Sprite names (see effects/painters) that read as each effect, for the pair-pop. */
const SPRITES: Record<EffectId, readonly string[]> = {
  snow: ['snowflake', 'snowflake', 'star'],
  confetti: ['confettiRect', 'confettiStreamer', 'star'],
  fireworks: ['star', 'star8', 'circle'],
  bats: ['batA', 'batB', 'star'],
  hearts: ['heart', 'heart', 'star'],
  holi: ['circle', 'circle', 'star'],
  lanterns: ['lantern', 'coin', 'envelope'],
  diyas: ['flame', 'marigold', 'star'],
  leaves: ['leafMaple', 'leafOak', 'leafGinkgo'],
  shamrocks: ['shamrock', 'shamrock', 'coin'],
  eggs: ['eggPattern0', 'eggPattern1', 'eggPattern2', 'eggPattern3', 'petal'],
  menorah: ['star', 'dreidel', 'coin'],
  kinara: ['flame', 'star', 'circle'],
  petals: ['petal', 'blossom', 'marigold'],
  crescent: ['star8', 'crescent', 'star'],
  moon: ['star', 'lantern', 'moon'],
  sabzeh: ['blossom', 'goldfish', 'petal'],
  'glyph-rain': ['star', 'circle'],
  balloons: ['balloon', 'balloon', 'confettiRect'],
  bubbles: ['bubble', 'bubble', 'star'],
  planes: ['plane', 'cloud', 'star'],
};

/** The holiday's sprites; emoji/text glyphs from the effect params join in (π, 🐸, 🍎…). */
export function spritesFor(effect: EffectId, params: EffectParams | undefined): string[] {
  const base = [...(SPRITES[effect] ?? ['star'])];
  const glyphs = (params?.glyphs ?? []).filter((g) => g.length <= 4).slice(0, 3).map((g) => `glyph:${g}`);
  return glyphs.length > 0 ? [...glyphs, ...base.slice(0, 2)] : base;
}

/** Colors: the effect's own palette when it has one, else the theme's glow, accents and white. */
export function paletteFor(theme: Theme, params: EffectParams | undefined): string[] {
  return params?.palette && params.palette.length > 0 ? [...params.palette, theme.glow] : [theme.glow, theme.accent, theme.accent2, '#ffffff'];
}

interface Particle {
  name: string;
  color: string;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  age: number;
  life: number;
}

const GRAVITY = 620;
const DRAG = 0.9;
const MAX_ALIVE = 220;
const SIZES = [16, 20, 26];

export interface BurstOptions {
  readonly effect: EffectId;
  readonly params?: EffectParams;
  readonly theme: Theme;
  readonly motion: () => MotionMode;
  readonly seed?: number;
}

export class Burst {
  readonly canvas: HTMLCanvasElement;
  private readonly host: HTMLElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly sprites: SpriteCacheImpl;
  private readonly names: string[];
  private readonly colors: string[];
  private readonly motion: () => MotionMode;
  private readonly rand: () => number;
  private particles: Particle[] = [];
  private raf = 0;
  private last = 0;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private fade: Animation | null = null;

  constructor(host: HTMLElement, opts: BurstOptions) {
    this.host = host;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'mem-burst';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    this.sprites = createSpriteCache({ scale: 1 });
    this.names = spritesFor(opts.effect, opts.params);
    this.colors = paletteFor(opts.theme, opts.params);
    this.motion = opts.motion;
    this.rand = mulberry32(opts.seed ?? 7);
  }

  /** A pop of `count` sprites from (x, y) in host CSS px. */
  pop(x: number, y: number, count = 22, power = 1): void {
    const mode = this.motion();
    if (mode === 'off' || !this.ctx) return;
    this.resize();
    const r = this.rand;
    if (mode === 'reduced') {
      // One settled ring, no movement, then a slow fade.
      this.particles = [];
      for (let k = 0; k < Math.min(count, 12); k++) {
        const a = (k / Math.min(count, 12)) * Math.PI * 2 + r() * 0.4;
        const d = 34 + r() * 30 * power;
        this.particles.push(this.make(x + Math.cos(a) * d, y + Math.sin(a) * d, 0, 0, 0.2));
      }
      this.draw();
      this.fadeOut();
      return;
    }
    this.fade?.cancel();
    this.fade = null;
    this.canvas.style.opacity = '1';
    for (let k = 0; k < count && this.particles.length < MAX_ALIVE; k++) {
      const a = -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.7;
      const speed = (190 + r() * 260) * power;
      this.particles.push(this.make(x, y, Math.cos(a) * speed, Math.sin(a) * speed - 80 * power, 0.9 + r() * 0.7));
    }
    this.schedule();
  }

  /** The finale: three pops across the board (≥ 350 ms apart) and a gentle shower from the top. */
  finale(): number[] {
    const timers: number[] = [];
    this.resize();
    const { w, h } = this;
    const spots: [number, number][] = [[w * 0.5, h * 0.55], [w * 0.22, h * 0.4], [w * 0.78, h * 0.4]];
    spots.forEach(([x, y], k) => {
      timers.push(window.setTimeout(() => this.pop(x, y, 34, 1.35), k * 380));
    });
    if (this.motion() === 'full') {
      timers.push(window.setTimeout(() => {
        for (let k = 0; k < 40 && this.particles.length < MAX_ALIVE; k++) {
          this.particles.push(this.make(this.rand() * w, -20 - this.rand() * 120, (this.rand() - 0.5) * 60, 40 + this.rand() * 80, 2.2 + this.rand() * 0.8));
        }
        this.schedule();
      }, 1200));
    }
    return timers;
  }

  destroy(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.fade?.cancel();
    this.particles = [];
    this.sprites.clear();
    this.canvas.remove();
  }

  private make(x: number, y: number, vx: number, vy: number, life: number): Particle {
    const r = this.rand;
    return {
      name: this.names[Math.floor(r() * this.names.length)] ?? 'star',
      color: this.colors[Math.floor(r() * this.colors.length)] ?? '#ffffff',
      size: SIZES[Math.floor(r() * SIZES.length)] ?? 20,
      x, y, vx, vy,
      rot: r() * Math.PI * 2,
      vr: (r() - 0.5) * 7,
      age: 0,
      life,
    };
  }

  private resize(): void {
    const rect = this.host.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w === this.w && h === this.h && dpr === this.dpr) return;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.sprites.setScale(dpr);
  }

  private schedule(): void {
    if (this.raf) return;
    this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  private readonly frame = (now: number): void => {
    this.raf = 0;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    const drag = Math.pow(DRAG, dt * 6);
    for (const p of this.particles) {
      p.age += dt;
      p.vx *= drag;
      p.vy = p.vy * drag + GRAVITY * dt * (p.life > 2 ? 0.08 : 1);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.life && p.y < this.h + 60);
    this.draw();
    if (this.particles.length > 0) this.raf = requestAnimationFrame(this.frame);
  };

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const k = this.dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    for (const p of this.particles) {
      const t = p.age / p.life;
      // Pop in over the first 120 ms, fade over the last 35 % of life.
      const grow = Math.min(1, 0.45 + p.age / 0.12 * 0.55);
      ctx.globalAlpha = t > 0.65 ? Math.max(0, (1 - t) / 0.35) : 1;
      this.sprites.draw(ctx, p.name, p.size, p.color, p.x, p.y, p.rot, grow, grow);
    }
    ctx.globalAlpha = 1;
  }

  private fadeOut(): void {
    this.fade?.cancel();
    this.canvas.style.opacity = '1';
    if (typeof this.canvas.animate !== 'function') return;
    // A slow opacity fade only (no movement), the reduced-motion stand-in for the pop.
    this.fade = this.canvas.animate([{ opacity: 1 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 1400, easing: 'ease-out', fill: 'forwards' });
    this.fade.onfinish = () => { this.particles = []; this.draw(); };
  }
}
