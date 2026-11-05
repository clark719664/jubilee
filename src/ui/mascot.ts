/**
 * Jubi, the star-lantern mascot: a five-point star with a little lantern loop
 * on top and a face whose mood follows the sleeps count. Inline SVG built with
 * `svg()`; the blink, bob and spin are CSS animations keyed off the classes
 * `.jubi`, `.jubi-eye`, `.jubi-sparkle` and `.is-spinning` (see styles.css).
 *
 *   mascot(mascotState(sleeps)) → SVGSVGElement
 *   spin(el)                    → one 5-tap spin (the hero wires the taps)
 */
import { svg } from './dom';

export type MascotState = 'sleepy' | 'curious' | 'excited' | 'party';
export const MASCOT_STATES: readonly MascotState[] = ['sleepy', 'curious', 'excited', 'party'];

/** >30 sleeps → sleepy, 4–30 → curious, 1–3 → excited, 0 (today) → party. */
export function mascotState(sleeps: number): MascotState {
  if (sleeps <= 0) return 'party';
  if (sleeps <= 3) return 'excited';
  if (sleeps <= 30) return 'curious';
  return 'sleepy';
}

const LABELS: Record<MascotState, string> = {
  sleepy: 'Jubi the star lantern, dozing',
  curious: 'Jubi the star lantern, peeking',
  excited: 'Jubi the star lantern, bouncing with excitement',
  party: 'Jubi the star lantern in a party hat',
};

/** Five-point star path centered at (50, 54), outer radius 40. */
function starPath(): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 40 : 17;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(54 + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

const STAR = starPath();

export function mascot(state: MascotState, size = 96): SVGSVGElement {
  const el = svg('svg', {
    viewBox: '0 0 100 100', width: size, height: size, class: `jubi jubi-${state}`, role: 'img', 'aria-label': LABELS[state],
  });
  // Soft glow halo, warmer the more excited Jubi is.
  const glowR = state === 'sleepy' ? 42 : state === 'curious' ? 46 : 50;
  el.append(svg('circle', { cx: 50, cy: 54, r: glowR, class: 'jubi-glow' }));
  // Lantern loop + cap on top of the star.
  el.append(svg('path', { d: 'M44 8c0-5 12-5 12 0', class: 'jubi-loop' }));
  el.append(svg('rect', { x: 43, y: 8, width: 14, height: 7, rx: 3, class: 'jubi-cap' }));
  // Body: outlined, sticker-like star.
  el.append(svg('path', { d: STAR, class: 'jubi-body' }));
  // Cheeks.
  el.append(svg('circle', { cx: 37, cy: 60, r: 4, class: 'jubi-cheek' }));
  el.append(svg('circle', { cx: 63, cy: 60, r: 4, class: 'jubi-cheek' }));
  // Eyes per state.
  if (state === 'sleepy') {
    el.append(svg('path', { d: 'M38 52q4 4 8 0', class: 'jubi-eye jubi-eye-closed' }));
    el.append(svg('path', { d: 'M54 52q4 4 8 0', class: 'jubi-eye jubi-eye-closed' }));
    el.append(svg('text', { x: 72, y: 34, class: 'jubi-zzz' }, 'z'));
    el.append(svg('text', { x: 80, y: 24, class: 'jubi-zzz jubi-zzz-2' }, 'z'));
  } else {
    const r = state === 'curious' ? 3.6 : 4.4;
    for (const cx of [42, 58]) {
      const g = svg('g', { class: 'jubi-eye' });
      g.append(svg('circle', { cx, cy: 52, r, class: 'jubi-pupil' }));
      g.append(svg('circle', { cx: cx + 1.4, cy: 50.6, r: 1.3, class: 'jubi-shine' }));
      el.append(g);
    }
    if (state === 'curious') el.append(svg('path', { d: 'M54 44q5-3 9 0', class: 'jubi-brow' }));
  }
  // Mouth per state.
  const mouth = state === 'sleepy' ? 'M45 64q5 2 10 0' : state === 'curious' ? 'M44 63q6 5 12 0' : 'M42 62q8 10 16 0z';
  el.append(svg('path', { d: mouth, class: `jubi-mouth${state === 'excited' || state === 'party' ? ' jubi-mouth-open' : ''}` }));
  // Party hat + sparkles.
  if (state === 'party') {
    el.append(svg('path', { d: 'M50 -2l12 24H38z', class: 'jubi-hat' }));
    el.append(svg('circle', { cx: 50, cy: -1, r: 3.5, class: 'jubi-pom' }));
    el.append(svg('path', { d: 'M40 14h20', class: 'jubi-hat-band' }));
  }
  if (state === 'excited' || state === 'party') {
    const spark = (x: number, y: number, s: number, i: number): SVGElement => svg('path', {
      d: `M${x} ${y - s}l${s * 0.35} ${s * 0.65}L${x + s} ${y}l-${s * 0.65} ${s * 0.35}L${x} ${y + s}l-${s * 0.35}-${s * 0.65}L${x - s} ${y}l${s * 0.65}-${s * 0.35}z`,
      class: `jubi-sparkle jubi-sparkle-${i}`,
    });
    el.append(spark(12, 30, 5, 1), spark(90, 40, 4, 2), spark(16, 84, 3.5, 3));
  }
  return el;
}

/** One quick spin (the hero calls this after 5 taps on the holiday emoji). Re-entrant: restarts the animation. */
export function spin(el: Element): void {
  el.classList.remove('is-spinning');
  // Force a reflow so re-adding the class restarts the animation.
  void (el as HTMLElement).getBoundingClientRect?.();
  el.classList.add('is-spinning');
  const done = (): void => { el.classList.remove('is-spinning'); el.removeEventListener('animationend', done); };
  el.addEventListener('animationend', done);
  window.setTimeout(done, 1200);
}
