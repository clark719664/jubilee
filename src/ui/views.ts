/**
 * View registry: one factory per route view. The view agents replace the
 * entries below with the real views (home, parade, holiday, recipe, year,
 * stickers, grownups, world); `createView` dispatches with the narrowed route type.
 *
 * A view factory is `(ctx: AppContext, route: RouteOf<V>) => { el: HTMLElement; destroy?(): void }`.
 * Every view must call `ctx.setTheme(theme | null)` and render exactly one <h1>.
 *
 * Home (home.ts) and the Parade (parade.ts) own their heroes, EffectLayers and
 * timers and dispose them in destroy().
 */
import type { AppContext, ViewFactory, ViewInstance, ViewRegistry } from '../app/context';
import type { Route } from '../app/router';
import { COPY, type TabId } from './copy';
import { focusHeading, h } from './dom';
import { homeView } from './home';
import { paradeView } from './parade';
import { holidayView } from './holiday';
import { recipeView } from './recipe';
import { playView } from './play';

/**
 * A view whose code lives in its own chunk (the globe, the year wheel, the sticker book, the grown-ups
 * page). Once the chunk is in, the view mounts synchronously like any other, so scroll restore and
 * heading focus behave the same; `preloadViews()` fetches every chunk while the browser is idle, so in
 * practice only a cold deep link ever sees the brief empty slot.
 */
interface LazyView<V extends Route['view']> extends ViewFactory<V> {
  preload(): Promise<unknown>;
}

function lazy<V extends Route['view']>(load: () => Promise<ViewFactory<V>>): LazyView<V> {
  let ready: ViewFactory<V> | null = null;
  let pending: Promise<ViewFactory<V>> | null = null;
  const fetch = (): Promise<ViewFactory<V>> => (pending ??= load().then((f) => (ready = f), (err: unknown) => {
    pending = null; // let the next visit try again (a flaky connection before the offline cache filled)
    throw err;
  }));
  const factory = ((ctx, route) => {
    if (ready) return ready(ctx, route);
    const slot = h('div', { class: 'view-slot', 'aria-busy': 'true' });
    let inner: ViewInstance | null = null;
    let gone = false;
    fetch().then((f) => {
      if (gone) return;
      inner = f(ctx, route);
      slot.replaceChildren(inner.el);
      slot.removeAttribute('aria-busy');
      // The router already tried to focus an h1 that wasn't there yet; finish its job unless the child has moved on.
      const active = document.activeElement;
      if (!active || active === document.body || slot.contains(active)) focusHeading(slot);
    }).catch((err: unknown) => {
      if (gone) return;
      console.error(err);
      ctx.setTheme(null);
      slot.replaceChildren(h('section', { class: 'placeholder' },
        h('div', { class: 'card card-pad stack center' },
          h('h1', { class: 'h1' }, COPY['error.load.title']),
          h('p', { class: 'lead muted' }, COPY['error.load.body']),
          h('button', { class: 'btn', type: 'button', onclick: () => location.reload() }, 'Try again'))));
      slot.removeAttribute('aria-busy');
    });
    return { el: slot, destroy() { gone = true; inner?.destroy?.(); } };
  }) as LazyView<V>;
  factory.preload = fetch;
  return factory;
}

const world = lazy<'world'>(() => import('./world').then((m) => m.worldView));
const year = lazy<'year'>(() => import('./year').then((m) => m.yearView));
const stickers = lazy<'stickers'>(() => import('./stickers').then((m) => m.stickersView));
const grownups = lazy<'grownups'>(() => import('./grownups').then((m) => m.grownupsView));

/** Fetch every lazy view's chunk (call once the first screen has painted). Failures are left for the visit to retry. */
export function preloadViews(): void {
  for (const v of [world, year, stickers, grownups]) v.preload().catch(() => undefined);
}

export const VIEWS: ViewRegistry = {
  home: homeView,
  parade: paradeView,
  holiday: holidayView,
  recipe: recipeView,
  year,
  stickers,
  grownups,
  world,
  play: playView,
};

export function createView(ctx: AppContext, route: Route): ViewInstance {
  switch (route.view) {
    case 'home': return VIEWS.home(ctx, route);
    case 'parade': return VIEWS.parade(ctx, route);
    case 'holiday': return VIEWS.holiday(ctx, route);
    case 'recipe': return VIEWS.recipe(ctx, route);
    case 'year': return VIEWS.year(ctx, route);
    case 'stickers': return VIEWS.stickers(ctx, route);
    case 'grownups': return VIEWS.grownups(ctx, route);
    case 'world': return VIEWS.world(ctx, route);
    case 'play': return VIEWS.play(ctx, route);
  }
}

/** Which bottom tab a route lights up (holiday pages belong to "All"). */
export function tabFor(route: Route): TabId | null {
  switch (route.view) {
    case 'home': return 'next';
    case 'parade': case 'holiday': case 'recipe': case 'play': return 'all';
    case 'world': return 'world';
    case 'year': return 'year';
    case 'stickers': return 'stickers';
    case 'grownups': return null;
  }
}
