/**
 * kinara-order.ts — which Kwanzaa candles are lit tonight. Shared by the kinara sky (fx/kinara) and the
 * holiday page's candle row, kept apart so the page doesn't pull the whole effect into its chunk.
 */

/** Candle positions (0 = leftmost) in lighting order: black center, then red and green alternating outward. */
export const LIGHTING_ORDER: readonly number[] = [3, 2, 4, 1, 5, 0, 6];

/** True when the candle at position `slot` is lit on a night with `n` candles. */
export function kinaraLit(slot: number, n: number): boolean {
  const k = Math.min(7, Math.max(0, Math.round(Number.isFinite(n) ? n : 7)));
  return LIGHTING_ORDER.indexOf(slot) < k;
}
