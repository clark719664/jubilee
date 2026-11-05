/**
 * layout.ts — fits a cols × rows board of cards into the space on screen, turning it sideways on wide
 * screens (a 3×4 board is 4 across on a laptop), so the whole board is visible without scrolling and
 * every card is as big as it can be. The orientation is chosen once per deal; later resizes only
 * rescale the cards, so a rotated tablet never shuffles where the child remembers a sticker. Pure.
 */
export interface Fit {
  readonly cols: number;
  readonly rows: number;
  readonly cardW: number;
  readonly cardH: number;
  readonly gap: number;
}

/** Card height ÷ width: a little taller than wide, like a trading card. */
export const CARD_ASPECT = 1.22;
/** Big enough for a finger even when the space is tiny (the page scrolls rather than shrinking further). */
export const MIN_CARD = 56;
export const MAX_CARD = 190;

export function gapFor(width: number): number {
  return width < 480 ? 8 : 14;
}

/** Cards may stretch up to this tall (÷ width) to use a tall phone screen instead of leaving it empty. */
export const MAX_ASPECT = 1.42;

/** Card size for a fixed cols × rows inside width × height. */
export function sizeBoard(cols: number, rows: number, width: number, height: number, aspect = CARD_ASPECT): Fit {
  const gap = gapFor(width);
  const byW = (width - gap * (cols - 1)) / cols;
  const cellH = (height - gap * (rows - 1)) / rows;
  const w = Math.max(MIN_CARD, Math.min(MAX_CARD, Math.floor(Math.min(byW, cellH / aspect))));
  const hgt = Math.max(Math.round(w * aspect), Math.min(Math.round(w * MAX_ASPECT), Math.floor(cellH)));
  return { cols, rows, cardW: w, cardH: hgt, gap };
}

/** Portrait (cols × rows) or sideways (rows × cols), whichever gives clearly bigger cards. */
export function fitBoard(cols: number, rows: number, width: number, height: number, aspect = CARD_ASPECT): Fit {
  const upright = sizeBoard(cols, rows, width, height, aspect);
  const sideways = sizeBoard(rows, cols, width, height, aspect);
  return sideways.cardW > upright.cardW * 1.08 ? sideways : upright;
}
