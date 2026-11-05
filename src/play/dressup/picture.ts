/**
 * picture.ts — "Take a picture": a die-cut instant photo of the dressed Jubi on the holiday sky, kept
 * on the Fridge as data (the outfit and the sky), never as an image. The Fridge view can rebuild the
 * same photo from the item with `pictureCard(item.data, …)`.
 *
 * Fridge item: { kind: 'dressup', holidayId, made: 'YYYY-MM-DD', title: 'Jubi in a Santa hat…',
 *                data: DressupPicture }
 */
import type { HolidayId } from '../../content/types';
import { formatIso, type CivilDate } from '../../dates/civil';
import { THEMES, type ThemeId } from '../../theme/themes';
import { h } from '../../ui/dom';
import type { MascotState } from '../../ui/mascot';
import { fridge, type AddResult, type FridgeItem } from '../fridge';
import { dressedMascot } from './dress';
import { normalizeOutfit, type Outfit } from './outfit';

export interface DressupPicture {
  readonly v: 1;
  readonly outfit: Outfit;
  /** The holiday sky behind Jubi. */
  readonly theme: ThemeId;
  readonly state: MascotState;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "22 October 2026" without touching Date (pretend days stay exact). */
export function captionDate(d: CivilDate): string {
  return `${d.d} ${MONTHS[d.m - 1] ?? ''} ${d.y}`;
}

/** Reads a Fridge item's data back into a picture (tolerates old or hand-edited data). */
export function asPicture(data: unknown): DressupPicture {
  const o = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const theme = typeof o.theme === 'string' && o.theme in THEMES ? (o.theme as ThemeId) : 'silly';
  const state = o.state === 'sleepy' || o.state === 'curious' || o.state === 'party' ? o.state : 'excited';
  return { v: 1, outfit: normalizeOutfit(o.outfit), theme, state };
}

/** The instant photo: a white die-cut frame, the holiday sky, the dressed Jubi and a caption. */
export function pictureCard(pic: DressupPicture, opts: { caption: string; size?: number; tilt?: number }): HTMLElement {
  const t = THEMES[pic.theme];
  const size = opts.size ?? 220;
  const jubi = dressedMascot(pic.state, size, pic.outfit);
  jubi.classList.add('dz-photo-jubi');
  jubi.setAttribute('aria-hidden', 'true');
  return h('figure', { class: 'dz-photo', style: `--tilt:${opts.tilt ?? -3}deg` },
    h('div', {
      class: 'dz-photo-sky',
      style: `background-image:radial-gradient(60% 55% at 50% 45%, ${t.glow}55, transparent 70%),linear-gradient(170deg, ${t.bg1}, ${t.bg2})`,
    }, jubi),
    h('figcaption', { class: 'dz-photo-cap' }, opts.caption),
  );
}

export interface SaveInput {
  readonly pretending: boolean;
  readonly holidayId: HolidayId;
  readonly today: CivilDate;
  readonly title: string;
  readonly picture: DressupPicture;
}

/** Puts the picture on the Fridge; the caller shows what happened (saved, pretending or full). */
export function savePicture(input: SaveInput): AddResult {
  return fridge(input.pretending).add<DressupPicture>({
    kind: 'dressup', holidayId: input.holidayId, made: formatIso(input.today), title: input.title, data: input.picture,
  });
}

/** The oldest few things on the Fridge, offered when it is full (never removed without asking). */
export function oldestOnFridge(pretending: boolean, n = 3): readonly FridgeItem[] {
  return [...fridge(pretending).list()].sort((a, b) => a.made.localeCompare(b.made)).slice(0, n);
}

export function takeDown(pretending: boolean, id: string): void {
  fridge(pretending).remove(id);
}
