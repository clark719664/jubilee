/**
 * play/types.ts — the contract every activity implements.
 *
 * An activity is a little place inside a holiday: a countdown-door board, a seek-and-find in the scene,
 * a coloring page, a card maker, the wish post, sticker memory, the catch game, dress-up Jubi, the globe
 * quiz, a picture-book story or a path puzzle. Each one is written once and skinned by the holiday it is
 * opened from (theme colors, scene art, stickers, effect sprites, content), so every holiday gets every
 * activity it has material for, forever. Routes: `#/h/:id/play/:activity`.
 *
 * Rules (from the competitive bar): one finger and keyboard both work; reduced motion has a variant;
 * nothing flashes above 3 Hz; nothing is ever lost, locked, timed out or judged; nothing leaves the
 * device (things the child makes go to the Fridge, see fridge.ts); no sound except words the child
 * taps to hear; every activity is fully usable offline.
 */
import type { AppContext } from '../app/context';
import type { HolidayContent, HolidayMeta } from '../content/types';
import type { Theme } from '../theme/themes';

export type ActivityId =
  | 'doors' | 'seek' | 'color' | 'card' | 'wish' | 'memory' | 'catch' | 'quiz' | 'dressup' | 'story' | 'path'
  // Holiday-only games (available() is true only for the holidays they are made for).
  | 'pumpkin' | 'treats' | 'monster' | 'potion' | 'peekaboo'
  | 'presents' | 'dreidel' | 'rangoli' | 'eggs' | 'lanterns' | 'fireworks';

export const ACTIVITY_IDS: readonly ActivityId[] = [
  'doors', 'seek', 'color', 'card', 'wish', 'memory', 'catch', 'quiz', 'dressup', 'story', 'path',
  'pumpkin', 'treats', 'monster', 'potion', 'peekaboo',
  'presents', 'dreidel', 'rangoli', 'eggs', 'lanterns', 'fireworks',
];

export interface PlayEnv {
  /** Clock (today/now, pretending), store, locale, motion, toast, announce, setTheme… */
  readonly ctx: AppContext;
  readonly meta: HolidayMeta;
  readonly content: HolidayContent;
  readonly theme: Theme;
  /** Return to the holiday page (also what Esc and Back do). */
  readonly close: () => void;
}

export interface ActivityInstance {
  /** Full-screen root the play view mounts. It owns its own h1. */
  readonly el: HTMLElement;
  destroy(): void;
}

export interface Activity {
  readonly id: ActivityId;
  /** Kid-facing name: "Seek & Find", "Make a card", "Wish Post"… */
  readonly title: string;
  readonly emoji: string;
  /** One line under the title on hotspot buttons. */
  readonly blurb: string;
  /** Whether this holiday has the material for it (scene art, greetings, stickers…). */
  available(meta: HolidayMeta, content: HolidayContent): boolean;
  mount(env: PlayEnv): ActivityInstance;
}
