/**
 * Jubilee — holiday tracker for kids. Bootstrap (spec §12):
 *   load Progress → Clock (?today=) → settings → Router → shell → mount the view
 *   for the route → MidnightTicker → fatal fallback.
 *
 * Views come from the registry in ./ui/views.ts; every route change destroys
 * the previous view and mounts the next one into the shell's #view.
 */
import { currentLang, initLang, localeFor } from './i18n/index';
import './ui/styles.css';
import { localClock, MidnightTicker, parseTodayFlag, pretendClock } from './app/clock';
import { registerOffline } from './sw/template';
import { createContext, type ViewInstance } from './app/context';
import { browserHost, parseQuery, Router, type Route } from './app/router';
import { detectRegion, prefersDarkScheme, prefersReducedMotion } from './app/settings';
import { browserStorage, load, Store } from './app/state';
import { HOLIDAYS } from './content/registry';
import { formatLong } from './dates/civil';
import { applyScheme, effectiveScheme, setMetaThemeColor, SHELL_SKY } from './theme/apply';
import { COPY, fmt, VIEW_NAMES } from './ui/copy';
import { clear, h } from './ui/dom';
import { mountShell, type Shell } from './ui/shell';
import { createView, preloadViews, tabFor } from './ui/views';
import { loadVoice } from './ui/voice';

function errorCard(err: unknown): HTMLElement {
  return h('section', { class: 'fatal' },
    h('div', { class: 'card card-pad stack fatal-card' },
      h('h1', { class: 'h1' }, COPY['error.title']),
      h('p', { class: 'lead' }, COPY['error.body']),
      h('pre', { class: 'fatal-pre' }, err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err)),
    ),
  );
}

function fatal(root: HTMLElement, err: unknown): void {
  root.replaceChildren(errorCard(err));
}

function boot(root: HTMLElement): void {
  void loadVoice();
  // ── flags, clock, settings ──
  const flags = parseQuery(location.search);
  const pretend = parseTodayFlag(new URLSearchParams(location.search).get('today'));
  const clock = pretend ? pretendClock(pretend) : localClock();
  const locale = localeFor(currentLang());
  const detectedRegion = detectRegion(navigator.language);

  // ── progress ──
  const storage = browserStorage();
  const store = new Store(load(storage, flags.region ?? detectedRegion), {
    storage, pretending: clock.pretending, defaultRegion: detectedRegion,
  });

  // ── color scheme (grown-ups override; the OS otherwise) ──
  let scheme = store.progress.scheme;
  applyScheme(scheme);
  const shellColor = (): void => {
    if (!root.hasAttribute('data-theme-id')) setMetaThemeColor(SHELL_SKY[effectiveScheme(prefersDarkScheme())]);
  };
  shellColor();
  store.subscribe((p) => {
    if (p.scheme === scheme) return;
    scheme = p.scheme;
    applyScheme(scheme);
    shellColor();
  });

  // ── router, context, shell (the shell owns the page's one live region) ──
  let shell: Shell | null = null;
  const announce = (text: string): void => shell?.announce(text);
  const router = new Router(browserHost(() => shell?.view ?? null, announce));
  const ctx = createContext({
    clock, store, router, flags, detectedRegion, locale, metas: HOLIDAYS, themeRoot: root,
    prefersReduced: prefersReducedMotion(),
    toast: (text, emoji) => shell?.showToast(text, emoji),
    announce,
  });
  shell = mountShell(root, ctx);
  const mounted = shell;
  if (clock.pretending) mounted.setPretend(fmt('pretend', { date: formatLong(clock.today(), locale, { year: true }) }));

  // ── views ──
  let current: ViewInstance | null = null;
  const render = (route: Route = router.current): void => {
    try { current?.destroy?.(); } catch (err) { console.error(err); }
    current = null;
    clear(mounted.view);
    try {
      current = createView(ctx, route);
      mounted.view.append(current.el);
    } catch (err) {
      console.error(err);
      ctx.setTheme(null);
      mounted.view.append(errorCard(err));
    }
    mounted.setActive(tabFor(route));
    document.title = `${VIEW_NAMES[route.view]} · Jubilee`;
  };
  router.onChange((route) => render(route));
  router.start();
  // The globe, year wheel, sticker book and grown-ups page are separate chunks; fetch them once the first screen is up.
  const idle = (fn: () => void): void => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 4000 });
    else setTimeout(fn, 1500);
  };
  idle(preloadViews);

  // ── today's bookkeeping ──
  store.markOpenDay(clock.today());
  ctx.checkBadges();

  // ── midnight: counters roll over while the tablet sits on the kitchen counter ──
  const ticker = new MidnightTicker(clock, (today) => {
    store.markOpenDay(today);
    ctx.checkBadges();
    render();
  });
  ticker.start();
}

function main(): void {
  const root = document.getElementById('app');
  if (!root) return;
  try {
    boot(root);
  } catch (err) {
    console.error(err);
    fatal(root, err);
  }
}

void initLang().then(main);
registerOffline(import.meta.env.PROD, '../');
