/**
 * registry.ts — the app's way in to the skies. Each preset is its own chunk, fetched the first time a
 * screen asks for it; `loadedEffect` answers synchronously once it has arrived. (index.ts keeps the eager
 * `EFFECTS` table for tests and tools.)
 */
import type { EffectFactory, EffectId } from './types';

const LOADERS: Record<EffectId, () => Promise<EffectFactory>> = {
  snow: () => import('./fx/snow').then((m) => m.snow),
  confetti: () => import('./fx/confetti').then((m) => m.confetti),
  fireworks: () => import('./fx/fireworks').then((m) => m.fireworks),
  bats: () => import('./fx/bats').then((m) => m.bats),
  hearts: () => import('./fx/hearts').then((m) => m.hearts),
  holi: () => import('./fx/holi').then((m) => m.holi),
  lanterns: () => import('./fx/lanterns').then((m) => m.lanterns),
  diyas: () => import('./fx/diyas').then((m) => m.diyas),
  leaves: () => import('./fx/leaves').then((m) => m.leaves),
  shamrocks: () => import('./fx/shamrocks').then((m) => m.shamrocks),
  eggs: () => import('./fx/eggs').then((m) => m.eggs),
  menorah: () => import('./fx/menorah').then((m) => m.menorah),
  kinara: () => import('./fx/kinara').then((m) => m.kinara),
  petals: () => import('./fx/petals').then((m) => m.petals),
  crescent: () => import('./fx/crescent').then((m) => m.crescent),
  moon: () => import('./fx/moon').then((m) => m.moon),
  sabzeh: () => import('./fx/sabzeh').then((m) => m.sabzeh),
  'glyph-rain': () => import('./fx/glyph-rain').then((m) => m.glyphRain),
  balloons: () => import('./fx/balloons').then((m) => m.balloons),
  bubbles: () => import('./fx/bubbles').then((m) => m.bubbles),
  planes: () => import('./fx/planes').then((m) => m.planes),
};

const ready = new Map<EffectId, EffectFactory>();
const pending = new Map<EffectId, Promise<EffectFactory>>();

/** The preset's factory if its chunk has already arrived. */
export function loadedEffect(id: EffectId): EffectFactory | undefined {
  return ready.get(id);
}

/** Fetches a preset's chunk (once; a failed fetch is retried on the next call). */
export function loadEffect(id: EffectId): Promise<EffectFactory> {
  const have = ready.get(id);
  if (have) return Promise.resolve(have);
  let p = pending.get(id);
  if (!p) {
    p = LOADERS[id]().then((f) => {
      ready.set(id, f);
      pending.delete(id);
      return f;
    }, (err: unknown) => {
      pending.delete(id);
      throw err;
    });
    pending.set(id, p);
  }
  return p;
}
