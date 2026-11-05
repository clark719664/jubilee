/**
 * index.ts — the eager effect table for tests and tools (the app fetches presets one at a time through
 * registry.ts). `EFFECTS[id](sprites)` builds a fresh Effect; `DESCRIBE[id]` is the canvas aria-label. All 21 presets are real; `PENDING_PRESETS` stays (empty) so tests can assert that
 * nothing falls back to the generic rain.
 */
import { balloons } from './fx/balloons';
import { bats } from './fx/bats';
import { bubbles } from './fx/bubbles';
import { confetti } from './fx/confetti';
import { crescent } from './fx/crescent';
import { diyas } from './fx/diyas';
import { eggs } from './fx/eggs';
import { fireworks } from './fx/fireworks';
import { glyphRain } from './fx/glyph-rain';
import { hearts } from './fx/hearts';
import { holi } from './fx/holi';
import { kinara } from './fx/kinara';
import { lanterns } from './fx/lanterns';
import { leaves } from './fx/leaves';
import { menorah } from './fx/menorah';
import { moon } from './fx/moon';
import { petals } from './fx/petals';
import { planes } from './fx/planes';
import { sabzeh } from './fx/sabzeh';
import { shamrocks } from './fx/shamrocks';
import { snow } from './fx/snow';
import type { EffectFactory, EffectId } from './types';

export { DESCRIBE } from './describe';

/** Presets still served by the generic rain (none left; fx/generic.ts remains as a fallback building block). */
export const PENDING_PRESETS: readonly EffectId[] = [];

export const EFFECTS: Record<EffectId, EffectFactory> = {
  snow,
  confetti,
  fireworks,
  bats,
  hearts,
  holi,
  lanterns,
  diyas,
  leaves,
  shamrocks,
  eggs,
  menorah,
  kinara,
  petals,
  crescent,
  moon,
  sabzeh,
  'glyph-rain': glyphRain,
  balloons,
  bubbles,
  planes,
};
