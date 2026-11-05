/**
 * play.ts — the full-screen host for activities (`#/h/:id/play/:activity`).
 *
 * It resolves the holiday, applies its theme, loads its content, checks the activity has the material
 * it needs, and mounts it with a PlayEnv whose `close()` returns to the holiday page. While an activity
 * is open the shell's chrome (top bar, tab bar, footer) steps aside via `html.is-playing`, so games get
 * the whole screen; Back and Esc still work because `close()` is just a hash change.
 */
import type { ViewFactory } from '../app/context';
import { loadContent } from '../content/loader';
import { hasActivity, loadActivity } from '../play';
import type { ActivityInstance } from '../play/types';
import { THEMES } from '../theme/themes';
import { focusHeading, h } from './dom';
import { mascot } from './mascot';

function card(title: string, body: string, href: string, label: string): HTMLElement {
  return h('section', { class: 'placeholder' },
    h('div', { class: 'card card-pad stack center' },
      mascot('curious', 120),
      h('h1', { class: 'h1' }, title),
      h('p', { class: 'lead muted' }, body),
      h('a', { class: 'btn', href }, label),
    ),
  );
}

export const playView: ViewFactory<'play'> = (ctx, route) => {
  const meta = ctx.metaOf(route.id);
  const back = `#/h/${encodeURIComponent(route.id)}`;
  if (!meta) {
    ctx.setTheme(null);
    return { el: card("We couldn't find that holiday", 'Try picking one from the list of all holidays.', '#/holidays', 'See all holidays') };
  }
  const theme = THEMES[meta.theme];
  ctx.setTheme(theme);
  if (!hasActivity(route.activity)) {
    return { el: card(`${meta.emoji} Coming soon!`, 'The elves are still building this one. Try another game for now.', `${back}?s=play`, `Back to ${meta.name}`) };
  }

  const root = h('section', { class: 'play-host', 'aria-busy': 'true' },
    h('div', { class: 'card card-pad center' }, h('p', { class: 'lead muted' }, 'Getting the game ready…')),
  );
  document.documentElement.classList.add('is-playing');
  let instance: ActivityInstance | null = null;
  let disposed = false;

  Promise.all([loadActivity(route.activity), loadContent(route.id)]).then(([activity, content]) => {
    if (disposed) return;
    if (!activity || !activity.available(meta, content)) {
      const title = activity ? `${activity.emoji} Not for ${meta.name} yet` : `${meta.emoji} Coming soon!`;
      const body = activity ? `${activity.title} needs pictures this holiday doesn't have yet. Try another game!` : 'The elves are still building this one. Try another game for now.';
      root.replaceChildren(card(title, body, `${back}?s=play`, `Back to ${meta.name}`));
      root.removeAttribute('aria-busy');
      return;
    }
    instance = activity.mount({ ctx, meta, content, theme, close: () => { location.hash = back; } });
    root.replaceChildren(instance.el);
    root.removeAttribute('aria-busy');
    // The router focused the view's h1 before the game had loaded. Finish its job, so keyboard and screen-reader
    // users start inside the game (and Esc reaches it), unless the game has already put focus somewhere itself.
    const active = document.activeElement;
    if (!active || active === document.body) focusHeading(root);
  }).catch(() => {
    if (disposed) return;
    root.replaceChildren(card('Oops, that one tripped over its shoelaces', 'Something went wrong loading this game. Please try again.', back, `Back to ${meta.name}`));
    root.removeAttribute('aria-busy');
  });

  return {
    el: root,
    destroy() {
      disposed = true;
      instance?.destroy();
      document.documentElement.classList.remove('is-playing');
    },
  };
};
