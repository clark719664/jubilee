/**
 * dress.ts — puts an outfit on a Jubi made by `mascot()` without touching mascot.ts.
 *
 *   dressMascot(mascot('curious', 120), loadOutfit())   → the overlay <g> (already attached)
 *   dressedMascot('party', 120, outfit)                  → a new dressed Jubi, viewBox widened to fit
 *
 * Layers, back to front, on Jubi's own 100×100 artboard:
 *   glow (replaces .jubi-glow) → body → pattern (clipped to the star, outline redrawn) → cheeks/face
 *   → overlay: neck, glasses, hat, held item.
 * A hat hides the lantern cap and loop (and the party-state hat) so the point never pokes through;
 * a held item hides the sparkle that would sit on it. Calling it again re-dresses (it removes its own
 * layers first), so callers can re-dress the same element whenever the outfit changes.
 */
import type { MascotState } from '../../ui/mascot';
import { mascot } from '../../ui/mascot';
import { svg } from '../../ui/dom';
import { FACE_ART } from './art-face';
import { HEAD_ART } from './art-head';
import { HELD_ART } from './art-held';
import { g, heartD, INK, starD } from './art-kit';
import { itemById, type Slot } from './catalog';
import type { Outfit } from './outfit';

/** A viewBox with room for tall hats, balloons and the held item (Jubi stays centred). */
export const DRESS_VIEWBOX = '-14 -18 128 128';

/** Jubi's star outline (same maths as mascot.ts), used when the element has no .jubi-body. */
function starOutline(): string {
  return starD(50, 54, 40, 17);
}

let uid = 0;

/** The item's drawing as a group, or null for an unknown id. */
export function drawItem(id: string): SVGGElement | null {
  const it = itemById(id);
  if (!it) return null;
  if (it.slot === 'glow') return drawGlow(id);
  if (it.slot === 'pattern') return drawPattern(id, starOutline());
  const make = HEAD_ART[id] ?? FACE_ART[id] ?? HELD_ART[id];
  if (!make) return null;
  const el = make();
  el.setAttribute('class', `dz-item dz-item-${it.slot}`);
  el.setAttribute('data-item', id);
  return el;
}

/** The halo behind Jubi in the glow's colours (rings blur together into one soft glow). */
export function drawGlow(id: string): SVGGElement | null {
  const it = itemById(id);
  if (!it || it.slot !== 'glow') return null;
  const cols = it.colours ?? ['#ffd166'];
  const out = g({ class: 'dz-glow', 'data-item': id });
  const outer = 51;
  if (cols.length <= 2) {
    out.append(svg('circle', { cx: 50, cy: 54, r: outer, fill: cols[1] ?? cols[0]!, opacity: 0.55, class: 'jubi-glow', style: `fill:${cols[1] ?? cols[0]!};opacity:.5` }));
    out.append(svg('circle', { cx: 50, cy: 54, r: outer - 9, fill: cols[0]!, class: 'jubi-glow', style: `fill:${cols[0]!};opacity:.7` }));
  } else {
    // Rainbow: violet outside, red inside, like a real one seen around a light.
    const n = cols.length;
    for (let i = 0; i < n; i++) {
      const col = cols[n - 1 - i]!;
      out.append(svg('circle', { cx: 50, cy: 54, r: outer - i * 3.2, fill: col, class: 'jubi-glow', style: `fill:${col};opacity:.62` }));
    }
  }
  return out;
}

/** A body pattern clipped to Jubi's star, with the outline drawn again on top so the edge stays crisp. */
export function drawPattern(id: string, outline: string): SVGGElement | null {
  const it = itemById(id);
  if (!it || it.slot !== 'pattern') return null;
  const cols = it.colours ?? ['#ffffff'];
  const clipId = `dz-clip-${++uid}`;
  const clip = svg('clipPath', { id: clipId });
  clip.append(svg('path', { d: outline }));
  const art = g({ 'clip-path': `url(#${clipId})` });
  if (id === 'stripes') {
    const s = g({ transform: 'rotate(-32 50 54)' });
    for (let x = -30, i = 0; x < 130; x += 9, i++) s.append(svg('rect', { x, y: -20, width: 4.2, height: 150, fill: cols[i % 2]!, opacity: i % 2 ? 0.55 : 0.7 }));
    art.append(s);
  } else if (id === 'dots') {
    for (let y = 12, row = 0; y < 92; y += 8.4, row++) {
      for (let x = 8 + (row % 2) * 5; x < 94; x += 10) art.append(svg('circle', { cx: x, cy: y, r: 2.5, fill: cols[(row + Math.round(x / 10)) % 2]!, opacity: 0.85 }));
    }
  } else if (id === 'stars') {
    for (let y = 16, row = 0; y < 92; y += 11, row++) {
      for (let x = 10 + (row % 2) * 6.5; x < 94; x += 13) art.append(svg('path', { d: starD(x, y, 3.4, 1.5, row * 12), fill: cols[row % 2]!, opacity: 0.9 }));
    }
  } else if (id === 'rainbow') {
    const band = 74 / cols.length;
    cols.forEach((col, i) => art.append(svg('rect', { x: 0, y: 14 + i * band, width: 100, height: band + 0.4, fill: col, opacity: 0.62 })));
  } else if (id === 'hearts') {
    for (let y = 18, row = 0; y < 92; y += 11, row++) {
      for (let x = 10 + (row % 2) * 6.5; x < 94; x += 13) art.append(svg('path', { d: heartD(x, y, 2.6), fill: cols[(row + 1) % 2]!, opacity: 0.85 }));
    }
  }
  const out = g({ class: 'dz-pattern', 'data-item': id }, clip, art);
  out.append(svg('path', { d: outline, fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  return out;
}

const HIDE = 'data-dz-hidden';

function hide(root: Element, selector: string): void {
  for (const el of root.querySelectorAll<SVGElement>(selector)) {
    el.setAttribute(HIDE, el.style.display);
    el.style.display = 'none';
  }
}

function undress(root: SVGSVGElement): void {
  for (const el of root.querySelectorAll('[data-dz]')) el.remove();
  for (const el of root.querySelectorAll<SVGElement>(`[${HIDE}]`)) {
    el.style.display = el.getAttribute(HIDE) ?? '';
    el.removeAttribute(HIDE);
  }
  root.classList.remove('jubi-dressed');
}

/** Draw order of the overlay (back to front). */
const OVERLAY: readonly Slot[] = ['neck', 'glasses', 'hat', 'held'];

/**
 * Dresses a Jubi SVG from `mascot(state, size)` in place and returns the overlay group (neck,
 * glasses, hat and held item). Safe to call repeatedly; an empty outfit just undresses.
 */
export function dressMascot(el: SVGSVGElement, outfit: Outfit): SVGGElement {
  undress(el);
  const overlay = g({ class: 'dz-overlay', 'data-dz': 'overlay' });
  const body = el.querySelector<SVGPathElement>('.jubi-body');
  const outline = body?.getAttribute('d') ?? starOutline();

  if (outfit.glow) {
    const glow = drawGlow(outfit.glow);
    if (glow) {
      glow.setAttribute('data-dz', 'glow');
      const old = el.querySelector('.jubi-glow');
      hide(el, ':scope > .jubi-glow');
      el.insertBefore(glow, old ?? el.firstChild);
    }
  }
  if (outfit.pattern) {
    const pat = drawPattern(outfit.pattern, outline);
    if (pat) {
      pat.setAttribute('data-dz', 'pattern');
      if (body) body.after(pat);
      else el.append(pat);
    }
  }
  for (const slot of OVERLAY) {
    const id = outfit[slot];
    if (!id) continue;
    const art = drawItem(id);
    // A plain wrapper per slot, so callers can animate it without fighting the item's own transform.
    if (art) overlay.append(g({ class: 'dz-slot', 'data-slot': slot }, art));
  }
  const hat = itemById(outfit.hat);
  if (hat) {
    // Any hat or clip replaces the party-state hat; real hats also hide the lantern cap and loop.
    hide(el, '.jubi-hat, .jubi-pom, .jubi-hat-band');
    if (hat.coversTop) hide(el, '.jubi-cap, .jubi-loop');
  }
  if (outfit.held) hide(el, '.jubi-sparkle-2');
  // The raised brow would sit on the frames.
  if (outfit.glasses) hide(el, '.jubi-brow');
  el.append(overlay);
  el.classList.add('jubi-dressed');
  return overlay;
}

/** A new Jubi wearing the outfit, with a viewBox wide enough for every item. */
export function dressedMascot(state: MascotState, size: number, outfit: Outfit): SVGSVGElement {
  const el = mascot(state, size);
  dressMascot(el, outfit);
  el.setAttribute('viewBox', DRESS_VIEWBOX);
  return el;
}
