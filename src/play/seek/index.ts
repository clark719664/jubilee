/**
 * Seek & Find — spot the hidden details in a holiday's illustrated scene.
 *
 * One engine for every holiday: the scene's layers come from `sceneFor(id)`, the things to find from
 * `sceneDataFor(id).findables` ({id, label, x, y, r} in the 1600×900 artboard, drawn in mid.svg). The
 * picture opens exactly as the hero frames it, then the child drags, pinches, wheels or presses + and −
 * to look around, and taps what they spot. Misses are a soft ripple, never a penalty; the Hint button
 * glows softly somewhere around the thing; keyboard players steer a ring with the arrows and press Enter.
 * Nothing gives a location away: names say what, not where (a test holds them to it), a card keeps its
 * crop of the picture hidden until found, and a hint is only ever a wide pool of light.
 * Progress lives in its own key `jubilee.seek.v1` (see progress.ts); nothing is written while pretending.
 */
import type { HolidayContent, HolidayMeta } from '../../content/types';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { h } from '../../ui/dom';
import { COPY, say } from './copy';
import { resolveScene } from './scene';
import { mountSeek } from './view';
import './seek.css';

export { setSeekSceneOverride, resolveScene, type SeekScene } from './scene';
export { SEEK_KEY } from './progress';

export const seekActivity: Activity = {
  id: 'seek',
  title: COPY.title,
  emoji: '🔍',
  blurb: COPY.blurb,
  available(meta: HolidayMeta, _content: HolidayContent): boolean {
    return resolveScene(meta.id) !== null;
  },
  mount(env: PlayEnv): ActivityInstance {
    const scene = resolveScene(env.meta.id);
    return scene ? mountSeek(env, scene) : mountPainting(env);
  },
};

/** Opened before the art exists (the hub should not offer it, but never crash): a gentle note and a way back. */
function mountPainting(env: PlayEnv): ActivityInstance {
  const back = h('button', { class: 'btn btn-lg', type: 'button' }, say('back', { holiday: env.meta.name }));
  back.addEventListener('click', () => env.close());
  const el = h('section', { class: 'seek seek-empty sky' },
    h('div', { class: 'card card-pad seek-empty-card' },
      h('span', { class: 'seek-done-emoji emoji', 'aria-hidden': 'true' }, env.meta.emoji),
      h('h1', { class: 'h2' }, COPY.title),
      h('p', {}, say('painting', { holiday: env.meta.name })),
      back));
  return { el, destroy() { /* nothing to release */ } };
}
