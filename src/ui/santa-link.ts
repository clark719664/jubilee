/** The way into the Santa tracker from Home in December and from the Christmas page. */
import { formatRoute } from '../app/router';
import type { CivilDate } from '../dates/civil';
import { h } from './dom';

function words(today?: CivilDate): string {
  if (today?.m === 12 && today.d === 24) return 'Santa is flying tonight! Track him live';
  if (today?.m === 12 && today.d === 25) return 'See everywhere Santa went';
  return 'Watch Santa fly around the world on Christmas Eve';
}

export function santaLink(today?: CivilDate): HTMLElement {
  return h('a', { class: 'santa-link', href: formatRoute({ view: 'world' }) },
    h('span', { class: 'santa-link-emoji emoji', 'aria-hidden': 'true' }, '🎅'),
    h('span', { class: 'santa-link-text' }, h('b', {}, 'Santa tracker'), h('span', {}, words(today))));
}
