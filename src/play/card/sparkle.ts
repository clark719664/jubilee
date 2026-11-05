/**
 * sparkle.ts — a small burst of the effects engine's own stars and sparkles when a card goes on the
 * Fridge (full motion only; the caller skips it otherwise). Twelve sprites fly out and fade in about
 * 0.9 s: one burst, no flashing.
 */
import { h } from '../../ui/dom';
import { decorCanvas } from './paint';

export function burst(host: HTMLElement, x: number, y: number, colors: readonly string[]): number[] {
  const timers: number[] = [];
  const n = 12;
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  for (let i = 0; i < n; i++) {
    const size = 22 + (i % 3) * 10;
    const c = decorCanvas(i % 2 === 0 ? 'star' : 'sparkle', colors[i % colors.length] ?? '#ffd166', size * dpr);
    if (!c) continue;
    const el = h('span', { class: 'cm-burst', 'aria-hidden': 'true', style: `left:${x}px;top:${y}px;width:${size}px;height:${size}px` }, c);
    host.append(el);
    const a = (i / n) * Math.PI * 2 + 0.3;
    const d = 120 + (i % 4) * 34;
    const anim = el.animate([
      { transform: 'translate(-50%,-50%) scale(.3) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1) rotate(${i % 2 ? 160 : -160}deg)`, opacity: 1, offset: 0.65 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.1}px), calc(-50% + ${Math.sin(a) * d * 1.1 + 30}px)) scale(.8) rotate(${i % 2 ? 200 : -200}deg)`, opacity: 0 },
    ], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    anim.onfinish = () => el.remove();
    timers.push(window.setTimeout(() => el.remove(), 1200));
  }
  return timers;
}
