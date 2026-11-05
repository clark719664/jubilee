/**
 * sparkle.ts — the little burst of four-pointed stars when a child finds the place. One burst per
 * answer (well under the 3-per-second flash limit), drawn as DOM stars so it sits above the globe
 * canvas without touching its render loop. Full motion: the stars fly out and spin on the spring
 * curve. Reduced: a still ring of stars that gently fades in place. Off: nothing.
 */
import type { MotionMode } from '../../effects/types';
import { svg } from '../../ui/dom';

const STAR = 'M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0 Z';

function star(color: string, size: number): SVGSVGElement {
  const el = svg('svg', { viewBox: '0 0 24 24', width: size, height: size, class: 'quiz-star', 'aria-hidden': 'true' },
    svg('path', { d: STAR, fill: color, stroke: '#1f1a3d', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }));
  return el;
}

/** Bursts at (x, y) in `host`'s coordinates; returns a disposer that removes any stars still flying. */
export function sparkle(host: HTMLElement, x: number, y: number, colors: readonly string[], motion: MotionMode): () => void {
  if (motion === 'off') return () => {};
  const n = motion === 'full' ? 12 : 8;
  const stars: SVGSVGElement[] = [];
  for (let i = 0; i < n; i++) {
    const size = (i % 3 === 0 ? 26 : 18) + (i % 2) * 4;
    const el = star(colors[i % colors.length] ?? '#ffd166', size);
    el.style.left = `${x - size / 2}px`;
    el.style.top = `${y - size / 2}px`;
    host.append(el);
    stars.push(el);
    const a = (i / n) * Math.PI * 2 + (i % 2) * 0.3;
    const r = motion === 'full' ? 54 + (i % 3) * 22 : 44;
    const dx = Math.cos(a) * r;
    const dy = Math.sin(a) * r;
    if (typeof el.animate !== 'function') { window.setTimeout(() => el.remove(), 700); continue; }
    const frames = motion === 'full'
      ? [
        { transform: 'translate(0,0) scale(.2) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx * 0.8}px,${dy * 0.8}px) scale(1.15) rotate(${90 + i * 12}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px,${dy + 14}px) scale(.6) rotate(${160 + i * 12}deg)`, opacity: 0 },
      ]
      : [
        { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 0 },
        { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 0 },
      ];
    el.animate(frames, { duration: motion === 'full' ? 900 : 1100, easing: motion === 'full' ? 'cubic-bezier(.2,.8,.2,1)' : 'ease-out', fill: 'forwards' })
      .onfinish = () => el.remove();
  }
  return () => { for (const s of stars) s.remove(); };
}
