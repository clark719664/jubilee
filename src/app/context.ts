/**
 * AppContext — the one object every view receives.
 *
 *   type ViewFactory<V> = (ctx: AppContext, route: RouteOf<V>) => { el: HTMLElement; destroy?(): void }
 *
 * What a view gets from `ctx`:
 *   clock        today()/now(); `clock.pretending` is true under `?today=`
 *   store        Progress owner: `store.progress` (immutable snapshot), earnSticker/awardBadge/markVisited/
 *                markRecipeDone/markOpenDay/bumpFacts/setName…setScheme/addCustom/removeCustom/openAdvent/reset/subscribe
 *   router       `router.navigate(route)`, `router.current`; tabs and tiles are plain <a href="#/…"> links
 *   flags        parsed `?today= ?region= ?motion=`
 *   region       effective region (flag > saved > detected)         — live getter
 *   motion       'full' | 'reduced' | 'off' after the Sparkle toggle  — live getter
 *   units        'us' | 'metric'                                    — live getter
 *   customs      the child's birthdays/custom days                  — live getter
 *   everywhere   grown-ups "count down to holidays from everywhere"  — live getter
 *   prefersReduced  OS reduced-motion preference (live)
 *   locale       navigator.language for Intl formatting
 *   metas        every HolidayMeta from the registry (customs are NOT included; see metaOf/allMetas)
 *   metaOf(id)   registry meta or a synthesised meta for a custom holiday
 *   allMetas()   registry metas + custom metas (for parade/year/stickers)
 *   toast(text, emoji?)        small bottom toast ("You earned a sticker!")
 *   announce(text)             polite screen-reader announcement through the shell's single live region
 *   setTheme(theme | null)     sets --h-* on the app root (600 ms sky fade), data-pattern, meta theme-color;
 *                              null returns to the shell sky. Call it in every view (null for non-holiday views).
 *   celebrateOnce(key)         true the first time a key is seen this session (confetti cannons, gags)
 *   setMotion(mode | null)     session override from the Sparkle toggle (null = back to the resolved setting)
 *   onMotionChange(cb)         subscribe; returns a disposer. The EffectLayer listens here.
 *   checkBadges()              evaluates badge rules, awards new ones via the store, toasts them, returns the ids
 *
 * The view's `destroy()` runs before the next view mounts: dispose EffectLayers, timers and subscriptions there.
 */
import type { CustomHoliday, HolidayId, HolidayMeta } from '../content/types';
import { ageOn, customToMeta, withCustoms } from '../dates/occurrences';
import type { Region } from '../dates/rules';
import type { MotionMode } from '../effects/types';
import type { Theme } from '../theme/themes';
import { applyTheme, effectiveScheme, setMetaThemeColor, SHELL_SKY } from '../theme/apply';
import { BADGES, fmt } from '../ui/copy';
import type { Clock } from './clock';
import type { Units } from './format';
import type { QueryFlags, Route, Router } from './router';
import { prefersDarkScheme, resolveMotion, watchMedia } from './settings';
import type { BadgeId, Store } from './state';
import { evaluateBadges, traditionsVisited } from './stickers';

export interface ViewInstance {
  readonly el: HTMLElement;
  destroy?(): void;
}

export type RouteOf<V extends Route['view']> = Extract<Route, { readonly view: V }>;
export type ViewFactory<V extends Route['view'] = Route['view']> = (ctx: AppContext, route: RouteOf<V>) => ViewInstance;
export type ViewRegistry = { readonly [V in Route['view']]: ViewFactory<V> };

export interface AppContext {
  readonly clock: Clock;
  readonly store: Store;
  readonly router: Router;
  readonly flags: QueryFlags;
  readonly locale: string;
  readonly metas: readonly HolidayMeta[];
  readonly region: Region;
  readonly motion: MotionMode;
  readonly units: Units;
  readonly customs: readonly CustomHoliday[];
  readonly everywhere: boolean;
  readonly prefersReduced: boolean;
  metaOf(id: HolidayId): HolidayMeta | undefined;
  allMetas(): readonly HolidayMeta[];
  toast(text: string, emoji?: string): void;
  announce(text: string): void;
  setTheme(theme: Theme | null): void;
  celebrateOnce(key: string): boolean;
  setMotion(mode: MotionMode | null): void;
  onMotionChange(cb: (mode: MotionMode) => void): () => void;
  checkBadges(): BadgeId[];
}

export interface ContextOptions {
  readonly clock: Clock;
  readonly store: Store;
  readonly router: Router;
  readonly flags: QueryFlags;
  readonly detectedRegion: Region;
  readonly prefersReduced: boolean;
  readonly locale: string;
  readonly metas: readonly HolidayMeta[];
  /** Element that receives the --h-* variables (the app root, so the tab bar can tint itself). */
  readonly themeRoot: HTMLElement;
  readonly toast: (text: string, emoji?: string) => void;
  readonly announce: (text: string) => void;
}

/**
 * A birthday or custom day as a tier-2 HolidayMeta (§2.4). The dates engine owns the shape
 * (`customToMeta`), so the hero, parade and year view all agree; these are the app-side names.
 */
export const customMeta = (c: CustomHoliday, inYear?: number): HolidayMeta => customToMeta(c, inYear);

/** Candles on the cake for a custom day with a birth year, in a given occurrence year. */
export const customAge = (c: CustomHoliday, year: number): number | undefined => ageOn(c, year);

export function createContext(opts: ContextOptions): AppContext {
  const { clock, store, router, flags, locale, metas, themeRoot } = opts;
  const byId = new Map(metas.map((m) => [m.id, m] as const));
  const motionListeners = new Set<(mode: MotionMode) => void>();
  const celebrated = new Set<string>();
  let override: MotionMode | null = null;
  let reduced = opts.prefersReduced;
  let lastMotion: MotionMode | null = null;

  const currentMotion = (): MotionMode => override ?? resolveMotion(flags.motion, store.progress.motion, reduced);

  const syncMotion = (): void => {
    const mode = currentMotion();
    themeRoot.setAttribute('data-motion', mode);
    if (mode === lastMotion) return;
    lastMotion = mode;
    for (const cb of motionListeners) cb(mode);
  };

  // A Grown-ups change to the motion setting or the OS preference flips the live value too.
  store.subscribe(syncMotion);
  watchMedia('(prefers-reduced-motion: reduce)', (matches) => { reduced = matches; syncMotion(); });
  syncMotion();

  const ctx: AppContext = {
    clock, store, router, flags, locale, metas,
    get region() { return flags.region ?? store.progress.region ?? opts.detectedRegion; },
    get motion() { return currentMotion(); },
    get units() { return store.progress.units; },
    get customs() { return store.progress.custom; },
    get everywhere() { return store.progress.everywhere; },
    get prefersReduced() { return reduced; },
    metaOf(id) {
      const meta = byId.get(id);
      if (meta) return meta;
      const custom = store.progress.custom.find((c) => c.id === id);
      return custom ? customMeta(custom) : undefined;
    },
    allMetas() {
      return withCustoms(metas, store.progress.custom);
    },
    toast: opts.toast,
    announce: opts.announce,
    setTheme(theme) {
      applyTheme(themeRoot, theme);
      setMetaThemeColor(theme ? theme.bg1 : SHELL_SKY[effectiveScheme(prefersDarkScheme())]);
    },
    celebrateOnce(key) {
      if (celebrated.has(key)) return false;
      celebrated.add(key);
      return true;
    },
    setMotion(mode) {
      override = mode;
      syncMotion();
    },
    onMotionChange(cb) {
      motionListeners.add(cb);
      return () => { motionListeners.delete(cb); };
    },
    checkBadges() {
      const p = store.progress;
      const today = clock.today();
      const fresh = evaluateBadges(p, today, traditionsVisited(p, metas));
      for (const id of fresh) {
        store.awardBadge(id, today);
        opts.toast(fmt('badgeEarned', { name: BADGES[id].name }), BADGES[id].emoji);
      }
      return fresh;
    },
  };
  return ctx;
}
