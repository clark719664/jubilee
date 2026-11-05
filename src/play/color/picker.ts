/**
 * picker.ts — the wall of pages shown when a holiday has more than one coloring page. Choosing one
 * mounts the normal coloring screen; its Back button returns here.
 */
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import type { ActivityInstance, PlayEnv } from '../types';
import { COPY, fill } from './copy';
import { colorStorage } from './store';
import { mountColor, type ColorOptions } from './view';

export function mountPicker(env: PlayEnv, pages: readonly string[], opts: ColorOptions): ActivityInstance {
  const root = h('div', { class: 'cp-pages' });
  let open: ActivityInstance | null = null;
  let gone = false;

  const list = (): HTMLElement => {
    const drafts = (opts.storage ?? colorStorage(env.ctx.clock.pretending)).read().drafts;
    const grid = h('ul', { class: 'cp-pick-grid' });
    pages.forEach((pageId, i) => {
      const img = h('img', { class: 'cp-pick-img', alt: '', decoding: 'async' });
      const started = Object.keys(drafts[pageId]?.fills ?? {}).length > 0;
      const button = h('button', {
        type: 'button', class: 'cp-pick-page', 'aria-label': fill(COPY.pickOne, { n: i + 1, total: pages.length }),
        onclick: () => choose(pageId),
      }, img, started ? h('span', { class: 'cp-pick-started' }, COPY.pickStarted) : null);
      grid.append(h('li', {}, button));
      void opts.source.load(pageId).then((text) => {
        if (text && !gone) img.src = `data:image/svg+xml,${encodeURIComponent(text)}`;
      });
    });
    const label = fill(COPY.backTo, { holiday: env.meta.name });
    return h('section', { class: 'cp-pick sky' },
      h('header', { class: 'cp-pick-top' },
        h('button', { type: 'button', class: 'btn btn-icon', 'aria-label': label, title: label, onclick: () => env.close() }, icon('back')),
        h('div', {},
          h('p', { class: 'cp-pick-holiday' }, env.meta.name),
          h('h1', { class: 'h2' }, fill(COPY.pickTitle, { n: pages.length })))),
      grid);
  };

  const showList = (): void => {
    open?.destroy();
    open = null;
    root.replaceChildren(list());
  };

  function choose(pageId: string): void {
    open = mountColor({ ...env, close: showList }, { ...opts, pageId });
    root.replaceChildren(open.el);
  }

  showList();
  return {
    el: root,
    destroy() {
      gone = true;
      open?.destroy();
    },
  };
}
