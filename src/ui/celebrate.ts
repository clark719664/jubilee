/**
 * Celebration Mode (§9.3, §9.4): Home on the holiday itself. The hero switches to its celebrating face —
 * "IT'S TODAY!" (or "Tonight at sundown!") wobbling in big letters and the sky at double density — and
 * around it:
 *   · a confetti cannon, once per (holiday, year, day) via ctx.celebrateOnce: a short-lived overlay canvas
 *     fires from both bottom corners (holidays whose own sky is confetti just fire their own cannon);
 *   · tap anywhere on the sky to pop (the hero's sky is the tap target);
 *   · the holiday's sticker peeling off its backing sheet onto the shelf (Store.earnSticker, which keeps
 *     nothing while pretending);
 *   · "See what's next" — the following holiday.
 * Reduced motion: one still confetti frame, the sticker simply appears.
 */
import type { AppContext } from '../app/context';
import { pluralSleeps } from '../app/format';
import { formatRoute } from '../app/router';
import { stickerLabel } from '../content/registry';
import type { HolidayMeta } from '../content/types';
import { formatIso, type CivilDate } from '../dates/civil';
import type { Occurrence, Status, Upcoming } from '../dates/occurrences';
import { EffectLayer } from '../effects/layer';
import type { Theme } from '../theme/themes';
import { THEMES } from '../theme/themes';
import { COPY, fmt, VIEW_NAMES } from './copy';
import { h } from './dom';
import { mountHero, seedFor, type HeroInstance } from './hero';
import { icon } from './icons';

const CANNON_FADE_MS = 4200;
const CANNON_GONE_MS = 5200;

export interface CelebrationProps {
  readonly meta: HolidayMeta;
  readonly occ: Occurrence;
  readonly status: Status;
  readonly today: CivilDate;
  readonly stacked?: readonly { readonly meta: HolidayMeta; readonly occ: Occurrence }[];
  /** The following holiday, for "See what's next". */
  readonly next?: { readonly meta: HolidayMeta; readonly upcoming: Upcoming };
}

export interface CelebrationInstance {
  readonly hero: HeroInstance;
  /** The sticker's backing sheet, placed under the hero by the view. */
  readonly sheet: HTMLElement;
  destroy(): void;
}

// ───────────────────────────────────────────────────────── pure helpers (tested)

/** The cannon fires once per holiday, year and day. */
export function cannonKey(holidayId: string, year: number, today: CivilDate): string {
  return `cannon:${holidayId}:${year}:${formatIso(today)}`;
}

/** "You earned a sticker: Boo!" — without a doubled "!!" when the label already ends in punctuation. */
export function earnedText(label: string): string {
  return fmt('stickerEarned', { label }).replace(/([!?.…])!$/, '$1');
}

/** "in 8 sleeps" for the next holiday, or its day label while it is already on. */
export function nextWhen(u: Upcoming): string {
  const s = u.status;
  if (s.kind === 'upcoming') return fmt('inSleeps', { sleeps: pluralSleeps(s.sleeps) });
  if (s.kind === 'ongoing' && s.sleepsToMain > 0) return fmt('inSleeps', { sleeps: pluralSleeps(s.sleepsToMain) });
  return COPY.itsToday;
}

// ───────────────────────────────────────────────────────── DOM

function stickerSheet(meta: HolidayMeta, occ: Occurrence, fresh: boolean): HTMLElement {
  const label = stickerLabel(meta, occ.year);
  const titleId = `sheet-${meta.id}-${occ.year}`;
  return h('section', { class: 'celebrate-sheet card', 'aria-labelledby': titleId },
    h('div', { class: 'celebrate-backing', 'aria-hidden': 'true' },
      h('span', { class: `sticker is-earned${fresh ? ' is-new' : ''}` },
        h('span', { class: 'sticker-emoji' }, meta.sticker.emoji),
        h('span', { class: 'sticker-label' }, label),
      ),
    ),
    h('div', { class: 'celebrate-sheet-text' },
      h('h2', { class: 'h3', id: titleId }, earnedText(label)),
      h('a', { class: 'btn btn-secondary', href: formatRoute({ view: 'stickers' }) }, icon('stickers', 20), VIEW_NAMES.stickers),
    ),
  );
}

function nextLink(next: { readonly meta: HolidayMeta; readonly upcoming: Upcoming }): HTMLElement {
  const when = nextWhen(next.upcoming);
  return h('a', {
    class: 'btn btn-secondary hero-next', href: formatRoute({ view: 'holiday', id: next.meta.id }),
    'aria-label': `${COPY.seeWhatsNext}: ${next.meta.name}, ${when}`,
  }, COPY.seeWhatsNext, h('span', { class: 'emoji', 'aria-hidden': 'true' }, next.meta.emoji), icon('arrowRight', 20));
}

/**
 * The confetti cannon over a sky that is not confetti itself: its own canvas and EffectLayer (no input),
 * fired once from both bottom corners and faded out after a few seconds. Reduced motion: one still frame
 * of confetti that stays. Returns a disposer.
 */
function confettiCannon(ctx: AppContext, host: HTMLElement, theme: Theme, seed: number): () => void {
  const canvas = h('canvas', { class: 'hero-confetti', 'aria-hidden': 'true' });
  const scrim = host.querySelector('.hero-scrim');
  host.insertBefore(canvas, scrim ? scrim.nextSibling : host.firstChild);
  const layer = new EffectLayer(canvas, host, { input: false, seed });
  canvas.removeAttribute('role');
  let disposed = false;
  let raf = 0;
  let frames = 0;
  const timers: number[] = [];
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    for (const id of timers) window.clearTimeout(id);
    stopMotion();
    layer.destroy();
    canvas.remove();
  };
  // A Sparkle toggle mid-celebration simply clears the cannon.
  const stopMotion = ctx.onMotionChange(() => dispose());
  const fire = (): void => {
    raf = 0;
    if (disposed) return;
    if (!host.isConnected || host.clientWidth === 0 || host.clientHeight === 0) {
      if (++frames < 240) raf = requestAnimationFrame(fire);
      return;
    }
    layer.resize();
    layer.setMotion(ctx.motion);
    // Intensity 0 keeps the confetti's ambient rain to a trickle: this layer is only here for the shot.
    layer.setIntensity(0);
    layer.setEffect('confetti', { variant: 'cannon', density: 2 }, theme);
    layer.start();
    // Decoration only: the hero's own sky carries the description for screen readers.
    canvas.setAttribute('aria-hidden', 'true');
    canvas.removeAttribute('role');
    if (ctx.motion !== 'full') return;
    layer.burst(host.clientWidth / 2, host.clientHeight * 0.35);
    timers.push(window.setTimeout(() => canvas.classList.add('is-fading'), CANNON_FADE_MS));
    timers.push(window.setTimeout(dispose, CANNON_GONE_MS));
  };
  raf = requestAnimationFrame(fire);
  return dispose;
}

export function mountCelebration(ctx: AppContext, props: CelebrationProps): CelebrationInstance {
  const { meta, occ, status, today } = props;
  const hero = mountHero(ctx, {
    meta, occ, status, today, mode: 'celebrate', showPeek: true, ...(props.stacked ? { stacked: props.stacked } : {}),
  });
  if (props.next) hero.actions.append(nextLink(props.next));

  // The sticker peels onto the shelf; the Store ignores repeats and keeps nothing while pretending.
  const fresh = ctx.store.earnSticker(meta.id, occ.year, today);
  const sheet = stickerSheet(meta, occ, fresh);

  // One cannon per holiday, year and day.
  let stopCannon: (() => void) | null = null;
  if (ctx.motion !== 'off' && ctx.celebrateOnce(cannonKey(meta.id, occ.year, today))) {
    if (meta.effect === 'confetti') hero.onReady(() => hero.burst());
    else stopCannon = confettiCannon(ctx, hero.el, THEMES[meta.theme], seedFor(`${meta.id}:cannon`));
  }

  return {
    hero,
    sheet,
    destroy() {
      stopCannon?.();
      hero.destroy();
    },
  };
}
