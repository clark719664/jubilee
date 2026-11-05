/**
 * color.ts — tiny colour helpers for sprite painters: parse `#rgb/#rrggbb/#rrggbbaa/rgb()/rgba()`,
 * lighten or darken, and apply alpha. Unparsable strings pass through unchanged so a painter never throws.
 */

export type Rgba = readonly [r: number, g: number, b: number, a: number];

export function parseColor(c: string): Rgba | null {
  const s = c.trim();
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    const two = (i: number): number => parseInt(hex[i]! + hex[i]!, 16);
    const pair = (i: number): number => parseInt(hex.slice(i, i + 2), 16);
    if (hex.length === 3 || hex.length === 4) {
      const out: Rgba = [two(0), two(1), two(2), hex.length === 4 ? two(3) / 255 : 1];
      return out.some((v) => Number.isNaN(v)) ? null : out;
    }
    if (hex.length === 6 || hex.length === 8) {
      const out: Rgba = [pair(0), pair(2), pair(4), hex.length === 8 ? pair(6) / 255 : 1];
      return out.some((v) => Number.isNaN(v)) ? null : out;
    }
    return null;
  }
  const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(s);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
  return null;
}

export function rgba(r: number, g: number, b: number, a: number): string {
  const q = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
  return `rgba(${q(r)},${q(g)},${q(b)},${Math.max(0, Math.min(1, a))})`;
}

/** The colour with its alpha multiplied by `a`. */
export function withAlpha(c: string, a: number): string {
  const p = parseColor(c);
  return p ? rgba(p[0], p[1], p[2], p[3] * a) : c;
}

/** Mixes toward white (k > 0) or black (k < 0); k in [-1, 1]. */
export function shade(c: string, k: number): string {
  const p = parseColor(c);
  if (!p) return c;
  const target = k > 0 ? 255 : 0;
  const m = Math.min(1, Math.abs(k));
  return rgba(p[0] + (target - p[0]) * m, p[1] + (target - p[1]) * m, p[2] + (target - p[2]) * m, p[3]);
}

/** Blends two colours; k = 0 → a, 1 → b. */
export function mixColor(a: string, b: string, k: number): string {
  const pa = parseColor(a);
  const pb = parseColor(b);
  if (!pa || !pb) return k < 0.5 ? a : b;
  return rgba(pa[0] + (pb[0] - pa[0]) * k, pa[1] + (pb[1] - pa[1]) * k, pa[2] + (pb[2] - pa[2]) * k, pa[3] + (pb[3] - pa[3]) * k);
}
