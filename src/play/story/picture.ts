/**
 * picture.ts — one page's picture: the holiday's illustrated scene seen through the page's camera, or,
 * while a holiday has no scene yet, a small sky-and-hills picture in the theme's colors with the
 * holiday's die-cut sticker (or its emoji on a theme disc) and the page's thing beside it.
 *
 * Planes keep the scene's order (the book's moon → back → mid → front). Each is laid out with percentages for
 * the final camera (crisp SVG at any zoom); a page turn animates each plane from the previous camera with its
 * own parallax depth (camera.ts panCamera), so the planes slide apart mid-turn and land in register.
 *
 * The fallback picture ignores the cameras: it is a plain wide shot (hills, sky, the book's moon) behind the
 * sticker and the page's thing, which are what change from page to page. Zooming its hills only filled the
 * box with dark slopes, so it never zooms or pans.
 */
import { PARALLAX, type SceneLayer } from '../../art/index';
import { mulberry32 } from '../../effects/rng';
import { h, svg } from '../../ui/dom';
import { layerStyle, panCamera, relTransform, viewFor } from './camera';
import { skySvg } from './sky';
import { ARTBOARD, type Camera, type StoryMoon } from './types';

export interface PictureOptions {
  readonly scene: readonly SceneLayer[] | null;
  readonly camera: Camera;
  readonly sticker: string | null;
  readonly emoji: string;
  /** The page's thing (fallback picture only). Empty on the cover. */
  readonly prop: string;
  readonly side: 'left' | 'right';
  readonly mood: 'day' | 'night';
  /** Seeds the fallback stars so every book has its own sky. */
  readonly seed: number;
  /** The book's own moon, behind every other plane. */
  readonly moon?: StoryMoon | undefined;
  /** A fixed box shape (width / height), e.g. for the printed booklet; omitted → measured live. */
  readonly aspect?: number;
}

export interface Picture {
  readonly el: HTMLElement;
  /** Pans every plane from `from` to this page's camera, nearer planes leading (parallax). */
  panFrom(from: Camera, ms: number): void;
  /** Ends any pan at once. */
  finish(): void;
  /** Re-reads the box shape (call after the picture is attached or resized). */
  layout(): void;
  destroy(): void;
}

interface Plane { readonly depth: number; readonly layer: HTMLElement | SVGSVGElement }

/** The fallback picture's one fixed view: the whole artboard. */
const WIDE: Camera = { x: ARTBOARD.w / 2, y: ARTBOARD.h / 2, zoom: 1 };
/** The moon plane's parallax depth: farther than the back layer. */
const SKY_DEPTH = 0.08;

let uid = 0;

/** The camera a picture shows: the page's own over a scene, the fallback picture's one wide shot otherwise. */
export function pictureCamera(hasScene: boolean, camera: Camera): Camera {
  return hasScene ? camera : WIDE;
}

// ───────── the fallback picture (no scene yet) ─────────

const SPARKLE = 'M0 -1 C .12 -.12 .12 -.12 1 0 C .12 .12 .12 .12 0 1 C -.12 .12 -.12 .12 -1 0 C -.12 -.12 -.12 -.12 0 -1 Z';

function hillsSvg(kind: 'back' | 'mid' | 'front', mood: 'day' | 'night', seed: number): SVGSVGElement {
  const id = `st-g${++uid}`;
  const root = svg('svg', { viewBox: `0 0 ${ARTBOARD.w} ${ARTBOARD.h}`, preserveAspectRatio: 'none', class: 'st-layer st-hills', 'aria-hidden': 'true', focusable: 'false' });
  const grad = svg('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 },
    svg('stop', { offset: 0, class: `st-stop-${kind}-a` }), svg('stop', { offset: 1, class: `st-stop-${kind}-b` }));
  root.append(svg('defs', {}, grad));
  if (kind === 'back') {
    if (mood === 'night') {
      const rand = mulberry32(seed);
      for (let i = 0; i < 22; i++) {
        // Spread across the width in bands so no two stars clump; smaller and dimmer toward the hills.
        const x = (i + 0.15 + rand() * 0.7) * (ARTBOARD.w / 22);
        const y = 40 + rand() * 470;
        const r = 7 + rand() * 9 - (y / 520) * 3;
        root.append(svg('path', { d: SPARKLE, class: 'st-star', transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${r.toFixed(1)})`, opacity: (0.55 + rand() * 0.45).toFixed(2) }));
      }
    } else {
      root.append(svg('circle', { cx: 330, cy: 190, r: 150, class: 'st-sun-glow' }), svg('circle', { cx: 330, cy: 190, r: 78, class: 'st-sun' }));
    }
    root.append(svg('path', { d: 'M0 610 C 180 540 380 548 560 600 C 760 656 920 572 1110 560 C 1300 548 1460 600 1600 586 L1600 900 L0 900 Z', fill: `url(#${id})` }));
  } else if (kind === 'mid') {
    root.append(svg('path', { d: 'M0 716 C 220 668 440 676 640 712 C 860 752 1060 680 1280 690 C 1420 696 1520 716 1600 708 L1600 900 L0 900 Z', fill: `url(#${id})` }));
  } else {
    root.append(svg('path', { d: 'M0 820 C 260 786 560 790 820 808 C 1100 828 1360 792 1600 802 L1600 900 L0 900 Z', fill: `url(#${id})` }));
  }
  return root;
}

function heroArt(o: PictureOptions): HTMLElement {
  const main = o.sticker
    ? h('img', { class: 'st-hero-sticker', src: o.sticker, alt: '', draggable: false, decoding: 'async' })
    : h('span', { class: 'st-hero-disc' }, h('span', { class: 'st-hero-emoji emoji' }, o.emoji));
  return h('div', { class: `st-hero is-${o.side}`, 'aria-hidden': 'true' },
    h('span', { class: 'st-hero-shadow' }),
    h('span', { class: 'st-hero-main' }, main),
    o.prop ? h('span', { class: 'st-hero-prop' }, h('span', { class: 'st-prop-emoji emoji' }, o.prop)) : null);
}

// ───────── the picture ─────────

export function picture(o: PictureOptions): Picture {
  const hasScene = !!o.scene && o.scene.length > 0;
  const camera = pictureCamera(hasScene, o.camera);
  const box = h('div', { class: `st-pic${hasScene ? ' has-scene' : ' is-fallback'}`, 'aria-hidden': 'true' });
  const planes: Plane[] = [];
  const add = (name: string, depth: number, layer: HTMLElement | SVGSVGElement): void => {
    const plane = h('div', { class: `st-plane is-${name}` }, layer);
    box.append(plane);
    planes.push({ depth, layer });
  };
  if (o.moon) add('sky', SKY_DEPTH, skySvg(o.moon));
  if (o.scene && hasScene) {
    for (const l of o.scene) add(l.name, PARALLAX[l.name], h('img', { class: 'st-layer', src: l.url, alt: '', decoding: 'async', draggable: false }));
  } else {
    add('back', PARALLAX.back, hillsSvg('back', o.mood, o.seed));
    add('mid', PARALLAX.mid, hillsSvg('mid', o.mood, o.seed));
    add('front', PARALLAX.front, hillsSvg('front', o.mood, o.seed));
    box.append(heroArt(o));
  }

  let aspect = 0;
  const running = new Set<Animation>();

  const layout = (): void => {
    const w = box.clientWidth;
    const hh = box.clientHeight;
    if (w <= 0 || hh <= 0) return;
    const a = w / hh;
    if (Math.abs(a - aspect) < 0.002) return;
    aspect = a;
    const style = layerStyle(viewFor(camera, a));
    for (const p of planes) p.layer.setAttribute('style', style);
  };

  if (o.aspect !== undefined && o.aspect > 0) {
    // Fixed shape (print): lay out once, no observer.
    aspect = o.aspect;
    const style = layerStyle(viewFor(camera, o.aspect));
    for (const p of planes) p.layer.setAttribute('style', style);
  }
  const ro = o.aspect === undefined && typeof ResizeObserver === 'function' ? new ResizeObserver(layout) : null;
  ro?.observe(box);

  return {
    el: box,
    layout,
    panFrom(from, ms) {
      layout();
      if (!hasScene || aspect <= 0 || typeof box.animate !== 'function') return;
      const to = viewFor(camera, aspect);
      for (const p of planes) {
        const frames: Keyframe[] = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
          offset: t,
          transform: relTransform(to, viewFor(panCamera(from, camera, t, p.depth), aspect)),
        }));
        const anim = p.layer.animate(frames, { duration: ms, easing: 'cubic-bezier(.3,.7,.2,1)' });
        running.add(anim);
        const done = (): void => { running.delete(anim); };
        anim.finished.then(done, done);
      }
    },
    finish() {
      for (const a of [...running]) a.finish();
      running.clear();
    },
    destroy() {
      ro?.disconnect();
      for (const a of running) a.cancel();
      running.clear();
    },
  };
}
