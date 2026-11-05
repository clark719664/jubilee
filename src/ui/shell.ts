/**
 * The app shell around every view:
 *
 *   <a.skip-link>                         "Skip to content" (focuses #view, never changes the hash)
 *   <div.pretend-banner>                  shown under ?today= with a "Back to today" link
 *   <header.topbar>                       wordmark · desktop nav (Next/All/World/Year/Stickers) · Sparkle toggle
 *   <main#view.view tabindex=-1>          the view mount; views append one element here
 *   <footer.footer>                       the "For grown-ups" link
 *   <nav.tabbar>                          phone bottom tabs, five of them (<720 px, 56 px + safe area)
 *   <div.toast-host>                      stacked toasts (role=status)
 *   <div.live.sr-only aria-live=polite>   polite live region (shell.announce)
 *
 *   mountShell(root, ctx) → { view, setActive(tab), setPretend(text|null), showToast(text, emoji?), announce(text), destroy() }
 *
 * Tabs are real <a href="#/…"> links with aria-current="page" on the active one;
 * the active tint comes from --h-accent so it follows the current holiday.
 */
import type { AppContext } from '../app/context';
import { formatRoute, type Route } from '../app/router';
import { COPY, TAB_LABELS, type TabId } from './copy';
import { h, svg } from './dom';
import { icon, type IconName } from './icons';

export interface Shell {
  readonly root: HTMLElement;
  readonly view: HTMLElement;
  setActive(tab: TabId | null): void;
  setPretend(text: string | null): void;
  showToast(text: string, emoji?: string): void;
  announce(text: string): void;
  destroy(): void;
}

export const TABS: readonly { readonly id: TabId; readonly route: Route; readonly icon: IconName }[] = [
  { id: 'next', route: { view: 'home' }, icon: 'next' },
  { id: 'all', route: { view: 'parade' }, icon: 'all' },
  { id: 'world', route: { view: 'world' }, icon: 'world' },
  { id: 'year', route: { view: 'year' }, icon: 'year' },
  { id: 'stickers', route: { view: 'stickers' }, icon: 'stickers' },
];

const TOAST_MS = 3200;
const TOAST_MAX = 3;

/** The wordmark's little star-lantern, matching the favicon. */
function wordmarkMark(): SVGSVGElement {
  const el = svg('svg', { viewBox: '0 0 32 32', width: 30, height: 30, class: 'wordmark-mark', 'aria-hidden': 'true' });
  el.append(
    svg('rect', { width: 32, height: 32, rx: 9, class: 'wm-bg' }),
    svg('path', { d: 'M9 24 L16 6 L23 24 Z', class: 'wm-star' }),
    svg('circle', { cx: 16, cy: 5, r: 2.5, class: 'wm-dot' }),
    svg('circle', { cx: 7, cy: 9, r: 1.6, class: 'wm-dot wm-dot-2' }),
    svg('circle', { cx: 26, cy: 11, r: 1.6, class: 'wm-dot wm-dot-3' }),
    svg('circle', { cx: 24, cy: 27, r: 1.4, class: 'wm-dot wm-dot-4' }),
  );
  return el;
}

function tabLink(tab: (typeof TABS)[number], cls: string): HTMLAnchorElement {
  const pill = h('span', { class: `${cls}-pill` }, icon(tab.icon, cls === 'tab' ? 26 : 22));
  return h('a', { class: cls, href: formatRoute(tab.route), 'data-tab': tab.id }, pill, h('span', { class: `${cls}-label` }, TAB_LABELS[tab.id]));
}

export function mountShell(root: HTMLElement, ctx: AppContext): Shell {
  root.classList.add('app');
  const view = h('main', { id: 'view', class: 'view', tabindex: -1 });

  const skip = h('a', {
    class: 'skip-link', href: '#view',
    onclick: (e: Event) => { e.preventDefault(); view.focus({ preventScroll: false }); },
  }, COPY.skipToContent);

  // The emoji sits inside the text span so the two wrap together on narrow phones.
  const pretendWords = document.createTextNode('');
  const pretendText = h('span', { class: 'pretend-text' }, h('span', { class: 'pretend-emoji', 'aria-hidden': 'true' }, '🎭'), pretendWords);
  const backToToday = h('a', { class: 'pretend-back', href: '#/' }, COPY.pretendBack);
  const pretend = h('div', { class: 'pretend-banner', role: 'status', hidden: true }, pretendText, backToToday);

  const navLinks = TABS.map((t) => tabLink(t, 'navlink'));
  const tabLinks = TABS.map((t) => tabLink(t, 'tab'));

  const sparkle = h('button', {
    class: 'sparkle-toggle', type: 'button', 'aria-pressed': String(ctx.motion === 'full'),
    'aria-label': COPY.sparkle,
    onclick: () => ctx.setMotion(ctx.motion === 'full' ? 'reduced' : 'full'),
  }, icon('sparkle', 22), h('span', { class: 'sparkle-label' }, COPY.sparkle));
  const stopMotion = ctx.onMotionChange((mode) => { sparkle.setAttribute('aria-pressed', String(mode === 'full')); });

  const header = h('header', { class: 'topbar' },
    h('a', { class: 'wordmark', href: '#/' }, wordmarkMark(), h('span', { class: 'wordmark-text' }, 'Jubilee')),
    h('nav', { class: 'topnav', 'aria-label': 'Main' }, ...navLinks),
    sparkle,
  );

  const footer = h('footer', { class: 'footer' },
    h('a', { class: 'footer-link', href: '#/grownups' }, icon('lock', 18), ' ', COPY.forGrownUps),
  );

  const tabbar = h('nav', { class: 'tabbar', 'aria-label': 'Main' }, ...tabLinks);
  const toastHost = h('div', { class: 'toast-host' });
  const live = h('div', { class: 'live sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });

  root.replaceChildren(skip, pretend, header, view, footer, tabbar, toastHost, live);

  const setActive = (tab: TabId | null): void => {
    for (const a of [...navLinks, ...tabLinks]) {
      if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  };

  const setPretend = (text: string | null): void => {
    pretend.hidden = text === null;
    pretendWords.data = text ?? '';
    if (text !== null) {
      // Drop only the ?today flag so region/motion previews survive the jump back.
      const url = new URL(location.href);
      url.searchParams.delete('today');
      backToToday.href = url.toString();
    }
  };

  const showToast = (text: string, emoji?: string): void => {
    const toast = h('div', { class: 'toast', role: 'status' },
      emoji ? h('span', { class: 'toast-emoji', 'aria-hidden': 'true' }, emoji) : null,
      h('span', { class: 'toast-text' }, text),
    );
    toastHost.append(toast);
    while (toastHost.childElementCount > TOAST_MAX) toastHost.firstElementChild?.remove();
    window.setTimeout(() => {
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), 300);
    }, TOAST_MS);
  };

  const announce = (text: string): void => {
    live.textContent = '';
    window.setTimeout(() => { live.textContent = text; }, 30);
  };

  return {
    root, view, setActive, setPretend, showToast, announce,
    destroy: () => { stopMotion(); root.replaceChildren(); },
  };
}
