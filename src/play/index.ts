/**
 * play/index.ts — the activity registry. Each activity is written once and skinned by the holiday it
 * opens from; `#/h/:id/play/:activity` mounts it through src/ui/play.ts. Every activity is its own chunk,
 * fetched when a child opens it. Activities still being built are simply absent here (the play view then
 * shows a friendly "coming soon" card).
 */
import type { Activity, ActivityId } from './types';

const LOADERS: Partial<Record<ActivityId, () => Promise<Activity>>> = {
  doors: () => import('./doors').then((m) => m.doorsActivity),
  seek: () => import('./seek').then((m) => m.seekActivity),
  color: () => import('./color').then((m) => m.colorActivity),
  memory: () => import('./memory').then((m) => m.memoryActivity),
  dressup: () => import('./dressup').then((m) => m.dressupActivity),
  card: () => import('./card').then((m) => m.cardActivity),
  wish: () => import('./wish').then((m) => m.wishActivity),
  catch: () => import('./catch').then((m) => m.catchActivity),
  quiz: () => import('./quiz').then((m) => m.quizActivity),
  path: () => import('./path').then((m) => m.pathActivity),
  story: () => import('./story').then((m) => m.storyActivity),
  // Halloween-only games (the holiday page links them through its own "Halloween games" row).
  pumpkin: () => import('./pumpkin').then((m) => m.pumpkinActivity),
  monster: () => import('./monster').then((m) => m.monsterActivity),
  treats: () => import('./treats').then((m) => m.treatsActivity),
  potion: () => import('./potion').then((m) => m.potionActivity),
  peekaboo: () => import('./peekaboo').then((m) => m.peekabooActivity),
  // One signature game for other big holidays, linked the same way.
  presents: () => import('./presents').then((m) => m.presentsActivity),
  dreidel: () => import('./dreidel').then((m) => m.dreidelActivity),
  rangoli: () => import('./rangoli').then((m) => m.rangoliActivity),
  eggs: () => import('./eggs').then((m) => m.eggsActivity),
  lanterns: () => import('./lanterns').then((m) => m.lanternsActivity),
  fireworks: () => import('./fireworks').then((m) => m.fireworksActivity),
};

/** Whether `id` is built (cheap: no chunk is fetched). */
export function hasActivity(id: ActivityId): boolean {
  return LOADERS[id] !== undefined;
}

/** Fetches an activity's chunk; undefined when it isn't built yet. */
export function loadActivity(id: ActivityId): Promise<Activity | undefined> {
  const load = LOADERS[id];
  return load ? load() : Promise.resolve(undefined);
}
