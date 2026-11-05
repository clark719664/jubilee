/**
 * Dress up Jubi (activity id 'dressup') — the child styles Jubi, who then appears all over the app.
 *
 * Big Jubi stands on a podium in the holiday's scene (or its sky when the art is not drawn yet),
 * bobbing, blinking and watching the child's finger. Six slot tabs open drawers of big round items;
 * tapping one puts it on with a little drop/swing/pop and a sparkle, tapping it again takes it off.
 * Items for the holiday coming up (and the page this was opened from) sparkle and come first, but
 * everything is always there. "Dress for …" picks that holiday's look, "Surprise me" a random one,
 * and "Take a picture" sticks an instant photo on the Fridge (the outfit as data, never an image).
 * The outfit is kept under 'jubilee.jubi.v1' (not while pretending); other views read it with
 * `loadOutfit()` and draw it with `dressMascot()` / `dressedMascot()`.
 *
 * Keyboard: Tab between slot tabs, arrows through items, Enter/Space to wear; Esc goes back.
 * Motion: 'full' → drops, swings, squash and sparkles, eyes follow the pointer; otherwise items fade
 * in and Jubi holds still. Nothing flashes; the camera "flash" is one soft fade, full motion only.
 */
import './dressup.css';
import { sceneFor } from '../../art/index';
import { applyTheme } from '../../theme/apply';
import { h, trapFocus } from '../../ui/dom';
import { icon } from '../../ui/icons';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { itemById, type Slot } from './catalog';
import { COPY, fill } from './copy';
import { createDrawer } from './drawer';
import { describeOutfit, dressFor, isEmptyOutfit, loadOutfit, saveOutfit, surpriseOutfit, toggleItem, without, type Outfit } from './outfit';
import { captionDate, oldestOnFridge, pictureCard, savePicture, takeDown, type DressupPicture } from './picture';
import { seasonFor } from './season';
import { createStage } from './stage';

export { ITEMS, SLOTS, DENY_WORDS, itemById, itemsFor, type Item, type Slot } from './catalog';
export { dressMascot, dressedMascot, drawItem, DRESS_VIEWBOX } from './dress';
export { loadOutfit, saveOutfit, normalizeOutfit, dressFor, surpriseOutfit, describeOutfit, OUTFIT_KEY, type Outfit } from './outfit';
export { pictureCard, asPicture, type DressupPicture } from './picture';

export const dressupActivity: Activity = {
  id: 'dressup',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  // Jubi is always here, and every item is always available.
  available: () => true,
  mount: (env) => mountDressup(env),
};

function mountDressup(env: PlayEnv): ActivityInstance {
  const { ctx, meta, theme } = env;
  const full = (): boolean => ctx.motion === 'full';
  const pretending = ctx.clock.pretending;
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number): void => {
    const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  };

  const season = seasonFor({
    metas: ctx.metas, customs: ctx.customs, today: ctx.clock.today(), region: ctx.region, everywhere: ctx.everywhere, page: meta,
  });
  let outfit: Outfit = loadOutfit();
  const turns = new Map<string, number>();

  // ── stage ──
  const stage = createStage({
    label: COPY.jubiLabel,
    motion: () => ctx.motion,
    sparkleColors: [theme.glow, theme.accent, '#ffffff', theme.accent2],
    onTap: () => {
      const line = COPY.giggles[Math.floor(Math.random() * COPY.giggles.length)]!;
      stage.mood('excited', 1300);
      stage.wiggle();
      stage.say(line);
      ctx.announce(line);
    },
  });

  // ── "Dress for …" chips ──
  const chips = h('div', { class: 'dz-chips' });
  for (const hol of season.holidays) {
    const label = hol === season.forToday && season.isToday ? fill(COPY.dressForToday, { holiday: hol.name }) : fill(COPY.dressFor, { holiday: hol.name });
    chips.append(h('button', { type: 'button', class: 'btn dz-chip', onclick: () => dressForHoliday(hol.id) },
      h('span', { class: 'dz-chip-emoji', 'aria-hidden': 'true' }, hol.emoji), h('span', {}, label)));
  }

  // ── drawer ──
  const drawer = createDrawer({
    season: season.holidays,
    onWear: (id) => wear(id),
    onSlot: () => undefined,
  });

  // ── actions ──
  const pictureBtn = h('button', { type: 'button', class: 'btn btn-lg dz-picture', onclick: () => takePicture() },
    h('span', { class: 'dz-cam', 'aria-hidden': 'true' }, '📸'), COPY.picture);
  const surpriseBtn = h('button', { type: 'button', class: 'btn btn-secondary dz-act', 'aria-label': COPY.surprise, onclick: () => surprise() },
    icon('shuffle', 22), h('span', { class: 'dz-act-text' }, COPY.surprise));
  const undressBtn = h('button', { type: 'button', class: 'btn btn-secondary dz-act', 'aria-label': COPY.undress, onclick: () => undress() },
    icon('close', 22), h('span', { class: 'dz-act-text' }, COPY.undress));
  const actions = h('div', { class: 'dz-actions' }, surpriseBtn, pictureBtn, undressBtn);

  // ── layout ──
  const scene = sceneFor(meta.id);
  const backdrop = h('div', { class: `dz-backdrop${scene ? ' has-scene' : ''}`, 'aria-hidden': 'true' },
    ...(scene ?? []).filter((l) => l.name !== 'front').map((l) => h('img', { class: `dz-layer dz-layer-${l.name}`, src: l.url, alt: '', draggable: false })));
  const header = h('header', { class: 'dz-head' },
    h('button', { type: 'button', class: 'btn btn-secondary btn-icon dz-close', 'aria-label': fill(COPY.close, { holiday: meta.name }), onclick: () => env.close() }, icon('close', 22)),
    h('div', { class: 'dz-titles' }, h('h1', { class: 'dz-h1', id: 'dz-h1' }, COPY.title), h('p', { class: 'dz-sub' }, COPY.sub)),
  );
  const left = h('div', { class: 'dz-left' }, stage.el, chips);
  const right = h('div', { class: 'dz-right' }, drawer.rail, drawer.panel, actions);
  const root = h('section', { class: 'dz sky', 'aria-labeledby': 'dz-h1', 'data-mood': theme.mood }, backdrop, header, h('div', { class: 'dz-body' }, left, right));
  applyTheme(root, theme);
  const syncMotion = (): void => { root.classList.toggle('dz-calm', !full()); };
  syncMotion();
  const offMotion = ctx.onMotionChange(syncMotion);

  const onMove = (e: PointerEvent): void => stage.lookAt(e.clientX, e.clientY);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerdown', onMove);

  // ── behavior ──
  function apply(next: Outfit, changed: Slot | null, quietSave = false): void {
    outfit = next;
    if (changed || !quietSave) saveOutfit(outfit, { pretending });
    stage.dress(outfit, changed);
    drawer.sync(outfit);
    undressBtn.disabled = isEmptyOutfit(outfit);
  }

  function wear(id: string): void {
    const it = itemById(id);
    if (!it) return;
    const on = outfit[it.slot] !== id;
    const next = toggleItem(outfit, id);
    if (on) {
      stage.mood('excited', 1500);
      apply(next, it.slot);
      if (it.says) stage.say(it.says);
      ctx.announce(fill(COPY.sayWear, { name: it.name.toLowerCase() }));
    } else {
      apply(next, null);
      ctx.announce(fill(COPY.sayOff, { name: it.name.toLowerCase() }));
    }
  }

  function changedSlots(a: Outfit, b: Outfit): Slot[] {
    return (['glow', 'pattern', 'neck', 'glasses', 'hat', 'held'] as const).filter((s) => a[s] !== b[s] && b[s] !== undefined);
  }

  /** Several items at once: each one lands a beat after the last (one at a time, never a flicker). */
  function applyMany(next: Outfit): void {
    const slots = changedSlots(outfit, next);
    stage.mood('excited', 1800);
    outfit = next;
    saveOutfit(outfit, { pretending });
    drawer.sync(outfit);
    undressBtn.disabled = isEmptyOutfit(outfit);
    if (!full() || slots.length === 0) { stage.dress(next, null); return; }
    let step: Outfit = next;
    for (const s0 of slots) step = without(step, s0);
    stage.dress(step, null);
    slots.forEach((s0, i) => later(() => {
      if (outfit !== next) return;
      step = { ...step, [s0]: next[s0] };
      stage.dress(step, s0);
    }, 80 + i * 170));
  }

  function dressForHoliday(id: string): void {
    const hol = season.holidays.find((m) => m.id === id);
    if (!hol) return;
    const turn = turns.get(id) ?? 0;
    turns.set(id, turn + 1);
    applyMany(dressFor(hol, outfit, turn));
    const line = itemById(outfit.hat)?.says ?? itemById(outfit.held)?.says ?? COPY.surpriseLines[0]!;
    stage.say(line);
    ctx.announce(fill(COPY.sayDressed, { holiday: hol.name }));
  }

  function surprise(): void {
    applyMany(surpriseOutfit((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0));
    stage.say(COPY.surpriseLines[Math.floor(Math.random() * COPY.surpriseLines.length)]!);
    ctx.announce(fill(COPY.saySurprise, { outfit: describeOutfit(outfit) }));
  }

  function undress(): void {
    apply({}, null);
    stage.mood('curious');
    stage.say(COPY.undressLine);
    ctx.announce(COPY.sayUndress);
  }

  // ── picture ──
  let dialog: HTMLElement | null = null;
  let untrap: (() => void) | null = null;

  function takePicture(): void {
    if (dialog) return;
    stage.mood('excited', 2400);
    stage.say(COPY.cheese);
    const snap = (): void => {
      if (full() && typeof root.animate === 'function') {
        const flash = h('div', { class: 'dz-flash', 'aria-hidden': 'true' });
        root.append(flash);
        flash.animate([{ opacity: 0 }, { opacity: 0.55, offset: 0.25 }, { opacity: 0 }], { duration: 520, easing: 'ease-out' }).onfinish = () => flash.remove();
      }
      showPicture();
    };
    if (full()) later(snap, 650); else snap();
  }

  function showPicture(): void {
    const today = ctx.clock.today();
    const name = ctx.store.progress.name;
    const pic: DressupPicture = { v: 1, outfit, theme: meta.theme, state: 'excited' };
    const who = name ? `${name}’s Jubi` : 'Jubi';
    const card = pictureCard(pic, { caption: fill(COPY.pictureCaption, { who, date: captionDate(today) }), size: 200 });
    const title = describeOutfit(outfit, meta.name);
    const status = h('div', { class: 'dz-status' });
    const done = h('button', { type: 'button', class: 'btn btn-lg dz-done-btn', onclick: () => closeDialog() }, COPY.keepDressing);
    const panel = h('div', { class: 'dz-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labeledby': 'dz-dialog-title' },
      h('div', { class: 'dz-dialog-card' },
        h('h2', { class: 'dz-dialog-title', id: 'dz-dialog-title' }, COPY.pictureTitle),
        card, status, h('div', { class: 'dz-dialog-actions' }, done)));
    dialog = panel;
    root.append(panel);
    untrap = trapFocus(panel);

    const save = (): void => {
      const res = savePicture({ pretending, holidayId: meta.id, today, title, picture: pic });
      if (res.ok) {
        status.replaceChildren(h('p', { class: 'dz-stamp' }, COPY.fridgeSaved), h('p', { class: 'dz-status-sub' }, COPY.fridgeSavedSub));
        ctx.announce(COPY.sayPicture);
        ctx.toast(COPY.fridgeSaved, '🧲');
      } else if (res.reason === 'pretending') {
        status.replaceChildren(h('p', { class: 'dz-stamp is-soft' }, COPY.fridgePretend), h('p', { class: 'dz-status-sub' }, COPY.fridgePretendSub));
        ctx.announce(COPY.sayPretend);
      } else {
        const choices = oldestOnFridge(pretending).map((it) => h('button', {
          type: 'button', class: 'btn btn-secondary dz-takedown',
          onclick: () => { takeDown(pretending, it.id); save(); done.focus({ preventScroll: true }); },
        }, fill(COPY.takeDown, { title: it.title })));
        status.replaceChildren(h('p', { class: 'dz-stamp is-soft' }, COPY.fridgeFull), h('p', { class: 'dz-status-sub' }, COPY.fridgeFullSub),
          h('div', { class: 'dz-takedowns' }, ...choices, h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => closeDialog() }, COPY.keepAll)));
        ctx.announce(COPY.sayFull);
      }
    };
    save();
    done.focus({ preventScroll: true });
  }

  function closeDialog(): void {
    untrap?.();
    untrap = null;
    dialog?.remove();
    dialog = null;
    pictureBtn.focus({ preventScroll: true });
  }

  const onKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    if (dialog) closeDialog(); else env.close();
  };
  root.addEventListener('keydown', onKey);

  drawer.select('hat');
  apply(outfit, null, true);
  if (full() && !isEmptyOutfit(outfit)) later(() => stage.say(COPY.giggles[3]!), 500);

  return {
    el: root,
    destroy() {
      for (const t of timers) window.clearTimeout(t);
      timers.clear();
      offMotion();
      untrap?.();
      stage.destroy();
      root.removeEventListener('keydown', onKey);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onMove);
    },
  };
}
