/**
 * scene.ts — which picture Seek & Find searches.
 *
 * A holiday qualifies once its illustrated scene has a `mid.svg` (findables are drawn there, never in the
 * effect layer) and its `scene.json` lists at least MIN_FINDABLES findables inside the artboard. Until the
 * art lands, `available()` is false and the hub simply does not show the activity.
 *
 * `setSeekSceneOverride` exists for the standalone demo and tests: it points every holiday at a fixture
 * scene. The app never calls it.
 */
import { sceneDataFor, sceneFor, type Findable, type SceneLayer } from '../../art/index';
import { ART_H, ART_W } from './geometry';

export const MIN_FINDABLES = 3;
export const MAX_FINDABLES = 12;

export interface SeekScene {
  readonly layers: readonly SceneLayer[];
  readonly findables: readonly Findable[];
}

let override: SeekScene | null = null;

/** Demo/test only: use this scene for every holiday (null restores the bundled art). */
export function setSeekSceneOverride(scene: SeekScene | null): void {
  override = scene;
}

/** Findables that are usable: inside the artboard, positive radius, unique ids, at most MAX_FINDABLES. */
export function usableFindables(list: readonly Findable[]): Findable[] {
  const seen = new Set<string>();
  const out: Findable[] = [];
  for (const f of list) {
    if (seen.has(f.id) || !(f.r > 0) || f.x < 0 || f.x > ART_W || f.y < 0 || f.y > ART_H || !f.label) continue;
    seen.add(f.id);
    out.push(f);
    if (out.length >= MAX_FINDABLES) break;
  }
  return out;
}

export function resolveScene(holidayId: string): SeekScene | null {
  // Silly days have no scene of their own, so they all share the silliest one.
  const id = sceneFor(holidayId) ? holidayId : 'april-fools-day';
  const layers = override ? override.layers : sceneFor(id);
  const findables = usableFindables(override ? override.findables : sceneDataFor(id).findables);
  if (!layers || !layers.some((l) => l.name === 'mid') || findables.length < MIN_FINDABLES) return null;
  return { layers, findables };
}
