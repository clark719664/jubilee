/**
 * send.ts — the moment a wish leaves: an overlay over the holiday sky where the paper turns into the
 * skin's token and goes on its way.
 *
 *   santa  the letter folds in thirds (CSS 3D), slides into an envelope, the flap closes, a star seal
 *          pops on, Jubi swoops in and they fly off toward the North Pole in a trail of snowflakes
 *   love   the same fold with a heart seal; the envelope hops twice and tucks itself into "My love notes"
 *   lantern the lantern glows and drifts up and away, swaying
 *   diya   the lamp glows and a little light floats up to become a star
 *   jar    the paper rolls into a slip and plinks into the hopes jar
 *   leaf   the leaf flutters down onto the gratitude tree
 *   star   the wish star floats up to twinkle with the others
 *
 * Reduced motion (and 'off'): no travel and no 3D; the end state cross-fades in and stays. A tap or
 * Enter/Space/Esc skips straight to the end. Nothing here says a wish was emailed or sent online.
 */
import type { SceneLayer } from '../../art/index';
import type { MotionMode } from '../../effects/types';
import { h } from '../../ui/dom';
import { mascot } from '../../ui/mascot';
import {
  diyaArt, envelopeBack, envelopeFlap, envelopePocket, jarArt, lanternArt, leafArt, leafColor, sealArt, slipColor, starArt, TREE_SPOTS, treeArt,
} from './art';
import { chipIcon } from './chip-icons';
import type { WishLetter } from './letter';
import { chipsOf, salutationOf } from './paper';
import type { Skin } from './skins';
import { Sparkle } from './sparkle';
import type { EffectId } from '../../effects/types';
import type { Theme } from '../../theme/themes';

export interface FlightOptions {
  readonly root: HTMLElement;
  readonly skin: Skin;
  readonly letter: WishLetter;
  readonly motion: () => MotionMode;
  /** Wishes of this holiday already kept (slips in the jar, leaves on the tree, stars in the sky). */
  readonly previous: number;
  readonly scene: readonly SceneLayer[] | null;
  readonly effect: EffectId;
  readonly theme: Theme;
  /** Where a love note tucks itself away (the "My love notes" button). */
  readonly keepTarget: HTMLElement | null;
}

export interface Flight {
  readonly overlay: HTMLElement;
  readonly done: Promise<void>;
  skip(): void;
  destroy(): void;
}

const SPRING = 'cubic-bezier(.2,.8,.2,1)';

/** The holiday's scene (back, mid, front) bottom-anchored, or a soft hill when there is no art yet. */
export function sceneBackdrop(scene: readonly SceneLayer[] | null, cls: string): HTMLElement {
  const wrap = h('div', { class: `wish-scene ${cls}`, 'aria-hidden': 'true' });
  if (scene && scene.length > 0) {
    for (const l of scene) wrap.append(h('img', { class: `wish-scene-layer is-${l.name}`, src: l.url, alt: '', decoding: 'async', draggable: false }));
  } else {
    wrap.append(h('div', { class: 'wish-hill' }), h('div', { class: 'wish-hill is-near' }));
  }
  return wrap;
}

export function fly(opts: FlightOptions): Flight {
  const { skin, letter } = opts;
  const full = opts.motion() === 'full';
  const icons = chipsOf(skin, letter.chips).map((c) => c.icon);
  const running = new Set<Animation>();
  const waiters = new Map<number, () => void>();
  let skipping = !full;
  let raf = 0;

  const stage = h('div', { class: 'wish-flystage', 'data-skin': skin.id });
  const overlay = h('div', { class: 'wish-fly', 'data-skin': skin.id, role: 'presentation' },
    sceneBackdrop(opts.scene, 'is-fly'), stage);
  const sparkle = new Sparkle(overlay, skin.id, opts.effect, opts.theme, opts.motion);
  overlay.append(sparkle.canvas);
  opts.root.append(overlay);

  function anim(el: Element, frames: Keyframe[], o: KeyframeAnimationOptions): Promise<void> {
    if (typeof el.animate !== 'function') return Promise.resolve();
    const a = el.animate(frames, { fill: 'forwards', easing: SPRING, ...o });
    running.add(a);
    if (skipping) a.finish();
    return a.finished.then(() => { running.delete(a); }, () => { running.delete(a); });
  }
  const wait = (ms: number): Promise<void> => (skipping ? Promise.resolve() : new Promise((res) => {
    const t = window.setTimeout(() => { waiters.delete(t); res(); }, ms);
    waiters.set(t, res);
  }));
  const flushWaits = (): void => {
    for (const [t, res] of waiters) { window.clearTimeout(t); res(); }
    waiters.clear();
  };
  const center = (el: Element): { x: number; y: number } => {
    const r = el.getBoundingClientRect();
    const o = overlay.getBoundingClientRect();
    return { x: r.left - o.left + r.width / 2, y: r.top - o.top + r.height / 2 };
  };
  /** Sheds a trail behind `el` until stopped. */
  const trail = (el: Element): (() => void) => {
    if (!full) return () => {};
    let on = true;
    let n = 0;
    const tick = (): void => {
      if (!on) return;
      if (++n % 3 === 0) { const c = center(el); sparkle.trail(c.x, c.y + 10); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { on = false; cancelAnimationFrame(raf); };
  };

  const done = (async () => {
    await anim(overlay, [{ opacity: 0 }, { opacity: 1 }], { duration: full ? 320 : 200, easing: 'ease-out' });
    switch (skin.id) {
      case 'santa': case 'love': await envelopeFlight(); break;
      case 'lantern': await lanternFlight(); break;
      case 'diya': await diyaFlight(); break;
      case 'jar': await jarFlight(); break;
      case 'leaf': await leafFlight(); break;
      default: await starFlight();
    }
  })();

  // ── santa + love: fold, envelope, seal, away ──
  async function envelopeFlight(): Promise<void> {
    const love = skin.id === 'love';
    const env = h('div', { class: 'wish-env' },
      h('div', { class: 'wish-env-back' }, envelopeBack(love ? '#ffc2d6' : '#fff1d6', love ? '#ff6fa3' : '#3cc47c')));
    const fold = foldedLetter();
    const pocket = h('div', { class: 'wish-env-pocket' }, envelopePocket(love ? '#ffd1df' : '#fff6e6', love ? '#f39cb8' : '#e8d6b0'));
    const flap = h('div', { class: 'wish-env-flap' }, envelopeFlap(love ? '#ffb3cb' : '#ffeccc'));
    const seal = h('div', { class: 'wish-env-seal' }, sealArt(love ? 'heart' : 'star'));
    env.append(fold.el, pocket, flap, seal);
    const jubi = h('div', { class: 'wish-jubi' }, mascot('excited', 84));
    const carrier = h('div', { class: 'wish-carrier' }, env, jubi);
    stage.append(carrier);

    if (!full) {
      fold.el.classList.add('is-folded', 'is-in');
      flap.classList.add('is-closed');
      seal.classList.add('is-on');
      if (love) jubi.remove(); else jubi.classList.add('is-on');
      sparkleAt(seal);
      return;
    }
    await anim(fold.el, [{ transform: 'translateY(-30px) scale(.82)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420 });
    await wait(150);
    await anim(fold.bottom, [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(178deg)' }], { duration: 460, easing: 'cubic-bezier(.5,0,.3,1)' });
    await anim(fold.top, [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-178deg)' }], { duration: 460, easing: 'cubic-bezier(.5,0,.3,1)' });
    fold.el.classList.add('is-folded');
    await anim(fold.el, [{ transform: 'none' }, { transform: 'translateY(var(--drop)) scale(.96)' }], { duration: 520 });
    fold.el.classList.add('is-in');
    flap.classList.add('is-front');
    await anim(flap, [{ transform: 'rotateX(180deg)' }, { transform: 'rotateX(0deg)' }], { duration: 420, easing: 'cubic-bezier(.4,0,.2,1)' });
    flap.classList.add('is-closed');
    seal.classList.add('is-on');
    await anim(seal, [{ transform: 'translate(-50%,-50%) scale(0) rotate(-40deg)' }, { transform: 'translate(-50%,-50%) scale(1.25) rotate(8deg)', offset: 0.6 }, { transform: 'translate(-50%,-50%) scale(1) rotate(0)' }], { duration: 380 });
    sparkleAt(seal);
    await anim(env, [{ transform: 'rotate(0)' }, { transform: 'rotate(-4deg) scale(1.04)', offset: 0.3 }, { transform: 'rotate(3deg)', offset: 0.65 }, { transform: 'rotate(0)' }], { duration: 520 });
    const vw = overlay.clientWidth;
    const vh = overlay.clientHeight;
    if (love) {
      jubi.remove();
      for (let k = 0; k < 2; k++) {
        await anim(carrier, [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(4px) scale(1.06,.9)', offset: 0.18 }, { transform: 'translateY(-70px) scale(.96,1.05)', offset: 0.55 }, { transform: 'translateY(0) scale(1,1)' }], { duration: 560, easing: 'ease-in-out' });
        sparkleAt(seal, 14);
      }
      const t = opts.keepTarget?.getBoundingClientRect();
      const c = carrier.getBoundingClientRect();
      const dx = t ? t.left + t.width / 2 - (c.left + c.width / 2) : vw * 0.4;
      const dy = t ? t.top + t.height / 2 - (c.top + c.height / 2) : -vh * 0.5;
      const stop = trail(env);
      await anim(carrier, [{ transform: 'none', opacity: 1 }, { transform: `translate(${dx * 0.4}px,${dy * 0.4 - 60}px) scale(.7) rotate(-8deg)`, offset: 0.5 }, { transform: `translate(${dx}px,${dy}px) scale(.12) rotate(6deg)`, opacity: 0.2 }], { duration: 1100, easing: 'cubic-bezier(.5,0,.3,1)' });
      stop();
      opts.keepTarget?.classList.add('is-bump');
      return;
    }
    await anim(jubi, [{ transform: `translate(${-vw * 0.6}px, -80px) rotate(-30deg)`, opacity: 0 }, { transform: 'translate(10px,-6px) rotate(8deg)', opacity: 1, offset: 0.75 }, { transform: 'none', opacity: 1 }], { duration: 700 });
    await wait(200);
    const stop = trail(env);
    await anim(carrier, [
      { transform: 'none', opacity: 1 },
      { transform: `translate(${vw * 0.08}px,-30px) rotate(-6deg) scale(.95)`, offset: 0.15 },
      { transform: `translate(${vw * 0.3}px,${-vh * 0.3}px) rotate(-14deg) scale(.6)`, offset: 0.55 },
      { transform: `translate(${vw * 0.62}px,${-vh * 0.72}px) rotate(-18deg) scale(.18)`, opacity: 0 },
    ], { duration: 2000, easing: 'cubic-bezier(.45,0,.4,1)' });
    stop();
    const end = center(stage);
    sparkle.pop(end.x + vw * 0.42, Math.max(40, end.y - vh * 0.62), 18);
  }

  /** The letter as three panels that fold (front: the paper; back: plain paper). */
  function foldedLetter(): { el: HTMLElement; top: HTMLElement; bottom: HTMLElement } {
    const face = (cls: string, ...kids: (Node | null)[]): HTMLElement => h('div', { class: `wish-panel ${cls}` },
      h('div', { class: 'wish-face is-front' }, ...kids.filter((k): k is Node => k !== null)), h('div', { class: 'wish-face is-back' }));
    const lines = (): HTMLElement => h('div', { class: 'wish-face-lines' });
    const top = face('is-top', h('p', { class: 'wish-face-hello' }, salutationOf(skin, letter)), lines());
    const mid = face('is-mid', icons.length > 0 ? h('div', { class: 'wish-face-icons' }, ...icons.slice(0, 4).map((i) => chipIcon(i, 34))) : lines(), lines());
    const bottom = face('is-bottom', lines(), h('p', { class: 'wish-face-sign' }, `${skin.signoff} ${letter.name ?? 'me'}`));
    return { el: h('div', { class: 'wish-fold' }, top, mid, bottom), top, bottom };
  }

  function sparkleAt(el: Element, n = 22): void {
    const c = center(el);
    sparkle.pop(c.x, c.y, n);
  }

  // ── lantern: glow, sway, rise ──
  async function lanternFlight(): Promise<void> {
    const lantern = h('div', { class: 'wish-token is-lantern' }, lanternArt(icons));
    stage.append(lantern);
    if (!full) { lantern.classList.add('is-lit', 'is-risen'); sparkleAt(lantern, 12); return; }
    await anim(lantern, [{ transform: 'scale(.4) rotate(-8deg)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 520 });
    lantern.classList.add('is-lit');
    await wait(700);
    const vh = overlay.clientHeight;
    const stop = trail(lantern);
    await anim(lantern, [
      { transform: 'translate(0,0) rotate(0) scale(1)' },
      { transform: `translate(26px,${-vh * 0.22}px) rotate(4deg) scale(.86)`, offset: 0.3 },
      { transform: `translate(-22px,${-vh * 0.5}px) rotate(-4deg) scale(.62)`, offset: 0.65 },
      { transform: `translate(14px,${-vh * 0.8}px) rotate(2deg) scale(.32)`, opacity: 0.9 },
    ], { duration: 3600, easing: 'cubic-bezier(.4,0,.6,1)' });
    stop();
    lantern.classList.add('is-far');
  }

  // ── diya: glow, a light floats up ──
  async function diyaFlight(): Promise<void> {
    const diya = h('div', { class: 'wish-token is-diya' }, diyaArt());
    const orb = h('div', { class: 'wish-orb', 'aria-hidden': 'true' });
    stage.append(diya, orb);
    if (!full) { diya.classList.add('is-lit'); orb.classList.add('is-up'); sparkleAt(diya, 12); return; }
    await anim(diya, [{ transform: 'translateY(30px) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520 });
    diya.classList.add('is-lit');
    await wait(800);
    const vh = overlay.clientHeight;
    await anim(orb, [{ transform: 'translate(-50%,0) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-10px) scale(1)', opacity: 1 }], { duration: 400 });
    const stop = trail(orb);
    await anim(orb, [
      { transform: 'translate(-50%,-10px) scale(1)' },
      { transform: `translate(calc(-50% + 30px),${-vh * 0.25}px) scale(.9)`, offset: 0.4 },
      { transform: `translate(calc(-50% - 10px),${-vh * 0.5}px) scale(.6)` },
    ], { duration: 2400, easing: 'cubic-bezier(.4,0,.6,1)' });
    stop();
    orb.classList.add('is-star');
    sparkleAt(orb, 16);
  }

  // ── jar: roll up, plink in ──
  async function jarFlight(): Promise<void> {
    const before = Array.from({ length: opts.previous }, (_, i) => slipColor(i));
    const jarBox = h('div', { class: 'wish-token is-jar' }, jarArt(before));
    const slip = h('div', { class: 'wish-slip', style: `--slip:${slipColor(opts.previous)}` },
      icons.length > 0 ? h('div', { class: 'wish-slip-icons' }, ...icons.slice(0, 3).map((i) => chipIcon(i, 30))) : null);
    stage.append(jarBox, slip);
    const land = (): void => {
      jarBox.replaceChildren(jarArt([...before, slipColor(opts.previous)]));
      slip.remove();
    };
    if (!full) { land(); sparkleAt(jarBox, 12); return; }
    await anim(jarBox, [{ transform: 'translateY(40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480 });
    await anim(slip, [{ transform: 'translate(-50%,0) scale(.6) rotate(-6deg)', opacity: 0 }, { transform: 'translate(-50%,0) scale(1)', opacity: 1 }], { duration: 420 });
    await wait(350);
    await anim(slip, [{ transform: 'translate(-50%,0) scale(1)' }, { transform: 'translate(-50%,0) scale(.42,.22) rotate(-4deg)', borderRadius: '40px' }], { duration: 420 });
    const j = jarBox.getBoundingClientRect();
    const s = slip.getBoundingClientRect();
    const dy = j.top + j.height * 0.2 - (s.top + s.height / 2);
    await anim(slip, [
      { transform: 'translate(-50%,0) scale(.42,.22) rotate(-4deg)' },
      { transform: `translate(calc(-50% + 40px),${dy * 0.35 - 50}px) scale(.38,.2) rotate(60deg)`, offset: 0.45 },
      { transform: `translate(-50%,${dy}px) scale(.3,.16) rotate(180deg)`, opacity: 0.2 },
    ], { duration: 700, easing: 'cubic-bezier(.5,0,.6,1)' });
    land();
    await anim(jarBox, [{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg) scale(1.03,.97)', offset: 0.25 }, { transform: 'rotate(4deg)', offset: 0.6 }, { transform: 'rotate(0)' }], { duration: 560 });
    sparkleAt(jarBox, 20);
  }

  // ── leaf: flutter onto the tree ──
  async function leafFlight(): Promise<void> {
    const tree = h('div', { class: 'wish-token is-tree' }, treeArt());
    for (let i = 0; i < Math.min(opts.previous, TREE_SPOTS.length); i++) tree.append(treeLeaf(i));
    const n = opts.previous % TREE_SPOTS.length;
    const leaf = h('div', { class: 'wish-flyleaf' }, leafArt(leafColor(opts.previous), icons));
    stage.append(tree, leaf);
    const target = treeLeaf(n);
    if (!full) { leaf.remove(); tree.append(target); sparkleAt(target, 10); return; }
    await anim(tree, [{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480 });
    await anim(leaf, [{ transform: 'scale(.4) rotate(-20deg)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 460 });
    await wait(400);
    tree.append(target);
    target.style.visibility = 'hidden';
    const a = leaf.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const k = b.width / a.width;
    const rot = TREE_SPOTS[n]?.[2] ?? 0;
    const stop = trail(leaf);
    await anim(leaf, [
      { transform: 'translate(0,0) rotate(0) scale(1)' },
      { transform: `translate(${dx * 0.25 + 60}px,${dy * 0.3}px) rotate(30deg) scale(${0.85})`, offset: 0.3 },
      { transform: `translate(${dx * 0.6 - 50}px,${dy * 0.65}px) rotate(-25deg) scale(${(k + 1) / 2.2})`, offset: 0.65 },
      { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(${k})` },
    ], { duration: 2000, easing: 'ease-in-out' });
    stop();
    target.style.visibility = '';
    leaf.remove();
    await anim(target, [{ transform: `rotate(${rot}deg) scale(1)` }, { transform: `rotate(${rot + 10}deg) scale(1.15)`, offset: 0.4 }, { transform: `rotate(${rot}deg) scale(1)` }], { duration: 480 });
    sparkleAt(target, 18);
  }

  function treeLeaf(i: number): HTMLElement {
    const [x, y, rot] = TREE_SPOTS[i % TREE_SPOTS.length]!;
    return h('div', { class: 'wish-treeleaf', style: `left:${(x / 320) * 100}%;top:${(y / 260) * 100}%;transform:rotate(${rot}deg)` }, leafArt(leafColor(i)));
  }

  // ── star: float up and twinkle ──
  async function starFlight(): Promise<void> {
    for (let i = 0; i < Math.min(opts.previous, 18); i++) overlay.insertBefore(skyStar(i), stage);
    const star = h('div', { class: 'wish-token is-star' }, starArt(icons));
    stage.append(star);
    if (!full) { star.classList.add('is-up'); sparkleAt(star, 12); return; }
    await anim(star, [{ transform: 'scale(.3) rotate(-30deg)', opacity: 0 }, { transform: 'scale(1.1) rotate(6deg)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 560 });
    await wait(500);
    const vh = overlay.clientHeight;
    const stop = trail(star);
    await anim(star, [{ transform: 'none' }, { transform: `translate(20px,${-vh * 0.2}px) scale(.8) rotate(10deg)`, offset: 0.4 }, { transform: `translate(0,${-vh * 0.42}px) scale(.42) rotate(0)` }], { duration: 2200, easing: 'cubic-bezier(.4,0,.4,1)' });
    stop();
    star.classList.add('is-twinkle');
    sparkleAt(star, 18);
  }

  function skyStar(i: number): HTMLElement {
    // Spread old stars over the upper sky with a golden-angle walk (stable per index).
    const x = 8 + ((i * 61.8) % 84);
    const y = 6 + ((i * 37.3) % 30);
    return h('div', { class: 'wish-skystar', style: `left:${x}%;top:${y}%;--d:${(i % 5) * 0.4}s` }, starArt([]));
  }

  return {
    overlay,
    done,
    skip() {
      if (skipping) return;
      skipping = true;
      flushWaits();
      for (const a of running) a.finish();
    },
    destroy() {
      skipping = true;
      flushWaits();
      cancelAnimationFrame(raf);
      for (const a of running) a.cancel();
      sparkle.destroy();
      overlay.remove();
    },
  };
}
