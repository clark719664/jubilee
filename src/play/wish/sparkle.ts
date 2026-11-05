/**
 * sparkle.ts — the glitter that follows a flying wish: a trail of the holiday's own effect sprites
 * (snowflakes behind Santa's letter, marigolds behind the diya light, hearts behind a love note) and a
 * soft pop where it lands or vanishes. One small canvas over the activity with the shared sprite cache;
 * the loop runs only while sparkles are alive.
 *
 * Motion: 'full' animates; 'reduced' draws one still ring that fades (no travel); 'off' draws nothing.
 * Pops are spaced by the caller (≥ 350 ms), so nothing flashes faster than 3 Hz.
 */
import { mulberry32 } from '../../effects/rng';
import { createSpriteCache, type SpriteCacheImpl } from '../../effects/sprites';
import type { EffectId, MotionMode } from '../../effects/types';
import type { Theme } from '../../theme/themes';
import type { SkinId } from './skins';

/** Sprites (effects/painters names) per skin, joined by the holiday effect's own first sprite. */
const SKIN_SPRITES: Record<SkinId, readonly string[]> = {
  santa: ['snowflake', 'star', 'star'],
  lantern: ['star', 'glow', 'star8'],
  diya: ['flame', 'marigold', 'star'],
  jar: ['star', 'confettiRect', 'star8'],
  leaf: ['leafMaple', 'leafOak', 'star'],
  love: ['heart', 'heart', 'star'],
  star: ['star', 'star8', 'circle'],
};

const EFFECT_SPRITE: Partial<Record<EffectId, string>> = {
  snow: 'snowflake', hearts: 'heart', leaves: 'leafMaple', diyas: 'marigold', lanterns: 'lantern', moon: 'lantern', eggs: 'petal',
  petals: 'petal', shamrocks: 'shamrock', bats: 'batA', balloons: 'balloon', bubbles: 'bubble', crescent: 'star8', menorah: 'star',
  sabzeh: 'blossom', planes: 'plane', kinara: 'flame',
};

export function sparkleSprites(skin: SkinId, effect: EffectId): string[] {
  const own = EFFECT_SPRITE[effect];
  return own && !SKIN_SPRITES[skin].includes(own) ? [...SKIN_SPRITES[skin], own] : [...SKIN_SPRITES[skin]];
}

interface Spark { name: string; color: string; size: number; x: number; y: number; vx: number; vy: number; rot: number; vr: number; age: number; life: number }

const MAX = 180;

export class Sparkle {
  readonly canvas: HTMLCanvasElement;
  private readonly host: HTMLElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly sprites: SpriteCacheImpl;
  private readonly names: string[];
  private readonly colors: string[];
  private readonly motion: () => MotionMode;
  private readonly rand = mulberry32(2026);
  private sparks: Spark[] = [];
  private raf = 0;
  private last = 0;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private fade: Animation | null = null;

  constructor(host: HTMLElement, skin: SkinId, effect: EffectId, theme: Theme, motion: () => MotionMode) {
    this.host = host;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'wish-sparkle';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    this.sprites = createSpriteCache({ scale: 1 });
    this.names = sparkleSprites(skin, effect);
    this.colors = [theme.glow, theme.accent, '#ffffff', theme.accent2];
    this.motion = motion;
  }

  /** A few sparkles shed at (x, y) in host px, drifting down behind a moving thing. */
  trail(x: number, y: number, n = 2): void {
    if (this.motion() !== 'full' || !this.ctx) return;
    this.resize();
    for (let k = 0; k < n && this.sparks.length < MAX; k++) {
      const r = this.rand;
      this.sparks.push(this.make(x + (r() - 0.5) * 24, y + (r() - 0.5) * 16, (r() - 0.5) * 40, 20 + r() * 50, 0.8 + r() * 0.7, 10 + Math.floor(r() * 3) * 4));
    }
    this.schedule();
  }

  /** A soft pop of sparkles from (x, y). */
  pop(x: number, y: number, count = 24): void {
    const mode = this.motion();
    if (mode === 'off' || !this.ctx) return;
    this.resize();
    const r = this.rand;
    if (mode === 'reduced') {
      this.sparks = [];
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        this.sparks.push(this.make(x + Math.cos(a) * 46, y + Math.sin(a) * 46, 0, 0, 1, 18));
      }
      this.draw();
      this.fadeOut();
      return;
    }
    this.fade?.cancel();
    this.fade = null;
    this.canvas.style.opacity = '1';
    for (let k = 0; k < count && this.sparks.length < MAX; k++) {
      const a = r() * Math.PI * 2;
      const sp = 90 + r() * 200;
      this.sparks.push(this.make(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 60, 0.9 + r() * 0.8, 14 + Math.floor(r() * 3) * 5));
    }
    this.schedule();
  }

  destroy(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.fade?.cancel();
    this.sparks = [];
    this.sprites.clear();
    this.canvas.remove();
  }

  private make(x: number, y: number, vx: number, vy: number, life: number, size: number): Spark {
    const r = this.rand;
    return {
      name: this.names[Math.floor(r() * this.names.length)] ?? 'star',
      color: this.colors[Math.floor(r() * this.colors.length)] ?? '#ffffff',
      size, x, y, vx, vy, rot: r() * Math.PI * 2, vr: (r() - 0.5) * 5, age: 0, life,
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
    const drag = Math.pow(0.9, dt * 6);
    for (const p of this.sparks) {
      p.age += dt;
      p.vx *= drag;
      p.vy = p.vy * drag + 160 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    this.sparks = this.sparks.filter((p) => p.age < p.life);
    this.draw();
    if (this.sparks.length > 0) this.raf = requestAnimationFrame(this.frame);
  };

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    for (const p of this.sparks) {
      const t = p.age / p.life;
      const grow = Math.min(1, 0.4 + (p.age / 0.15) * 0.6);
      ctx.globalAlpha = t > 0.6 ? Math.max(0, (1 - t) / 0.4) : 1;
      this.sprites.draw(ctx, p.name, p.size, p.color, p.x, p.y, p.rot, grow, grow);
    }
    ctx.globalAlpha = 1;
  }

  private fadeOut(): void {
    this.fade?.cancel();
    this.canvas.style.opacity = '1';
    if (typeof this.canvas.animate !== 'function') return;
    this.fade = this.canvas.animate([{ opacity: 1 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 1400, easing: 'ease-out', fill: 'forwards' });
    this.fade.onfinish = () => { this.sparks = []; this.draw(); };
  }
}
