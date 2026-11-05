/**
 * silhouette.ts — a country's outline as a small SVG path, for the "Choose from a list" buttons and
 * the passport stamps. Drawn from the same Natural Earth rings as the globe, so the shape on the
 * button is the shape the child just saw light up (and no flags: the art rules keep other
 * countries' flags out of the app).
 *
 * The main landmass is the largest ring; other rings join it when they are at least 2.5% of its size
 * and within 25° of it (Japan's islands, the UK and Northern Ireland), so far-off pieces such as
 * Alaska or French Guiana do not shrink the drawing to a speck. Longitudes are squeezed by
 * cos(latitude), the same as a map at that latitude, so Norway is not twice as wide as it should be.
 * Pure: tested in Node.
 */
import { COUNTRIES } from '../../world/data/countries';

interface Ring { readonly pts: readonly number[]; readonly area: number; readonly cx: number; readonly cy: number }

function ringOf(raw: readonly number[]): Ring {
  let a = 0;
  let cx = 0;
  let cy = 0;
  const n = raw.length / 2;
  for (let i = 0; i < n; i++) {
    const x0 = raw[2 * i]! / 10;
    const y0 = raw[2 * i + 1]! / 10;
    const j = (i + 1) % n;
    const x1 = raw[2 * j]! / 10;
    const y1 = raw[2 * j + 1]! / 10;
    const k = x0 * y1 - x1 * y0;
    a += k;
    cx += (x0 + x1) * k;
    cy += (y0 + y1) * k;
  }
  const area = Math.abs(a / 2);
  if (Math.abs(a) < 1e-9) return { pts: raw, area: 0, cx: (raw[0] ?? 0) / 10, cy: (raw[1] ?? 0) / 10 };
  return { pts: raw, area, cx: cx / (3 * a), cy: cy / (3 * a) };
}

function lonGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** The rings that make the recognisable shape of a country. */
export function mainRings(iso: string): number[][] {
  const shape = COUNTRIES.find((c) => c.iso === iso);
  if (!shape || shape.rings.length === 0) return [];
  const rings = shape.rings.map(ringOf);
  const big = rings.reduce((m, r) => (r.area > m.area ? r : m), rings[0]!);
  return rings
    .filter((r) => r === big || (r.area >= big.area * 0.025 && lonGap(r.cx, big.cx) <= 25 && Math.abs(r.cy - big.cy) <= 25))
    .map((r) => [...r.pts]);
}

/** An SVG path `d` filling a `size`×`size` box with `pad` around it, or '' when the code has no outline. */
export function silhouettePath(iso: string, size = 48, pad = 4): string {
  const rings = mainRings(iso);
  if (rings.length === 0) return '';
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let latSum = 0, count = 0;
  for (const r of rings) for (let i = 1; i < r.length; i += 2) { latSum += r[i]! / 10; count++; }
  const k = Math.max(0.2, Math.cos(((latSum / Math.max(1, count)) * Math.PI) / 180));
  const xs = (lon: number): number => lon * k;
  for (const r of rings) {
    for (let i = 0; i < r.length; i += 2) {
      const x = xs(r[i]! / 10);
      const y = -r[i + 1]! / 10;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const span = Math.max(maxX - minX, maxY - minY, 1e-6);
  const s = (size - 2 * pad) / span;
  const ox = pad + (size - 2 * pad - (maxX - minX) * s) / 2;
  const oy = pad + (size - 2 * pad - (maxY - minY) * s) / 2;
  const f = (v: number): string => (Math.round(v * 10) / 10).toString();
  return rings.map((r) => {
    let d = '';
    for (let i = 0; i < r.length; i += 2) {
      const x = ox + (xs(r[i]! / 10) - minX) * s;
      const y = oy + (-r[i + 1]! / 10 - minY) * s;
      d += `${i === 0 ? 'M' : 'L'}${f(x)} ${f(y)}`;
    }
    return `${d}Z`;
  }).join('');
}
