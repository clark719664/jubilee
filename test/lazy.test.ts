/**
 * lazy.test.ts — the chunks the app fetches on demand resolve to the same things the eager tables hold:
 * every sky preset, and every activity the holiday page links to.
 */
import { describe, expect, it } from 'vitest';
import { EFFECTS } from '../src/effects';
import { loadEffect, loadedEffect } from '../src/effects/registry';
import type { EffectId } from '../src/effects/types';
import { hasActivity, loadActivity } from '../src/play';
import { ACTIVITY_IDS } from '../src/play/types';
import { PLAY_LINKS } from '../src/ui/sections';

describe('lazy chunks', () => {
  it('fetches every sky preset once, the same factory as the eager table', async () => {
    for (const id of Object.keys(EFFECTS) as EffectId[]) {
      const first = loadEffect(id);
      expect(loadEffect(id)).toBe(first);
      expect(await first).toBe(EFFECTS[id]);
      expect(loadedEffect(id)).toBe(EFFECTS[id]);
    }
  });

  it('has a chunk for every activity the holiday page links to, and nothing for the ones still being built', async () => {
    for (const link of PLAY_LINKS) expect(hasActivity(link.id)).toBe(true);
    for (const id of ACTIVITY_IDS) {
      const activity = await loadActivity(id);
      expect(activity === undefined).toBe(!hasActivity(id));
      if (activity) expect(activity.id).toBe(id);
    }
  });
});
