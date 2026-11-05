/**
 * logic.ts — Cauldron Colors' color mixing, with no DOM. Drops of red, yellow and blue mix the way
 * paint does (red + yellow = orange, yellow + blue = green, red + blue = purple, all three = brown) by
 * blending the corners of a red-yellow-blue color cube; white drops lighten and night ink darkens.
 * Every mix has a friendly name, and the orders friends ask for are all makeable in a few drops.
 */
export type Drop = 'red' | 'yellow' | 'blue' | 'white' | 'ink';
export const DROPS: readonly Drop[] = ['red', 'yellow', 'blue', 'white', 'ink'];
export type Mix = Readonly<Record<Drop, number>>;
export type Rgb = readonly [number, number, number];

/** The cauldron holds this many drops; then "Pour it out" starts fresh (nothing is lost, just full). */
export const MAX_DROPS = 12;

export const EMPTY: Mix = { red: 0, yellow: 0, blue: 0, white: 0, ink: 0 };
export const totalDrops = (m: Mix): number => DROPS.reduce((n, d) => n + m[d], 0);

export function addDrop(m: Mix, d: Drop): Mix {
  return totalDrops(m) >= MAX_DROPS ? m : { ...m, [d]: m[d] + 1 };
}

export function mixFrom(drops: readonly Drop[]): Mix {
  return drops.reduce<Mix>((m, d) => addDrop(m, d), EMPTY);
}

// Corners of the RYB cube, index = r·4 + y·2 + b (each 0 or 1), as 0–1 RGB.
const CUBE: readonly Rgb[] = [
  [1, 1, 1], [0.16, 0.37, 0.85], [1, 0.86, 0.12], [0.1, 0.7, 0.3],
  [0.93, 0.12, 0.2], [0.55, 0.15, 0.75], [1, 0.5, 0.05], [0.35, 0.22, 0.12],
];
const WATER: Rgb = [0.6, 0.84, 0.91];
const INK: Rgb = [0.12, 0.06, 0.22];

export function mixColor(m: Mix): Rgb {
  const p = m.red + m.yellow + m.blue;
  if (totalDrops(m) === 0) return WATER;
  let base: Rgb;
  if (p === 0) base = [1, 1, 1];
  else {
    const top = Math.max(m.red, m.yellow, m.blue);
    const r = m.red / top;
    const y = m.yellow / top;
    const b = m.blue / top;
    const out = [0, 0, 0];
    for (let i = 0; i < 8; i++) {
      const w = (i & 4 ? r : 1 - r) * (i & 2 ? y : 1 - y) * (i & 1 ? b : 1 - b);
      for (let k = 0; k < 3; k++) out[k]! += w * CUBE[i]![k]!;
    }
    base = [out[0]!, out[1]!, out[2]!];
  }
  const white = m.white / (m.white + Math.max(p, 0.0001));
  let c: Rgb = p === 0 && m.white === 0 ? base : [base[0] + (1 - base[0]) * white, base[1] + (1 - base[1]) * white, base[2] + (1 - base[2]) * white];
  if (m.ink > 0) {
    const k = m.ink / (m.ink + p + m.white);
    c = [c[0] + (INK[0] - c[0]) * k, c[1] + (INK[1] - c[1]) * k, c[2] + (INK[2] - c[2]) * k];
  }
  return c;
}

export function hex(c: Rgb): string {
  return `#${c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function hsl(c: Rgb): { h: number; s: number; l: number } {
  const [r, g, b] = c;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d < 1e-6) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s, l };
}

/** A friendly name for a color: "Orange", "Light blue", "Pink", "Midnight"… */
export function colorName(c: Rgb): string {
  const { h, s, l } = hsl(c);
  if (l < 0.16) return 'Midnight';
  if (s < 0.12) return l > 0.86 ? 'White' : l < 0.3 ? 'Dark gray' : 'Gray';
  const red = h < 14 || h >= 340;
  if (red && l > 0.7) return 'Pink';
  if (h >= 290 && h < 340 && l > 0.72) return 'Pink';
  let name: string;
  if (red) name = 'Red';
  else if (h < 42) name = l < 0.4 && s < 0.7 ? 'Brown' : 'Orange';
  else if (h < 68) name = l < 0.38 ? 'Brown' : 'Yellow';
  else if (h < 100) name = 'Lime';
  else if (h < 165) name = 'Green';
  else if (h < 200) name = 'Teal';
  else if (h < 258) name = 'Blue';
  else if (h < 300) name = 'Purple';
  else name = l < 0.6 ? 'Raspberry' : 'Pink';
  if (l > 0.76 && name !== 'Pink' && name !== 'Yellow' && name !== 'Lime') return `Light ${name.toLowerCase()}`;
  if (name === 'Brown' && l > 0.5) return 'Orange';
  return name;
}

export const nameOf = (m: Mix): string => (totalDrops(m) === 0 ? 'Water' : colorName(mixColor(m)));

export interface Order {
  readonly color: string;
  readonly recipe: readonly Drop[];
  readonly ask: string;
}

/** What friends ask for; each recipe really makes that color (a test checks). */
export const ORDERS: readonly Order[] = [
  { color: 'Orange', recipe: ['red', 'yellow'], ask: 'an orange potion, like a pumpkin' },
  { color: 'Green', recipe: ['yellow', 'blue'], ask: 'a green potion, like slime' },
  { color: 'Purple', recipe: ['red', 'blue'], ask: 'a purple potion, like a grape' },
  { color: 'Pink', recipe: ['red', 'white', 'white'], ask: 'a pink potion, like candy floss' },
  { color: 'Light blue', recipe: ['blue', 'white', 'white'], ask: 'a light blue potion, like the sky' },
  { color: 'Brown', recipe: ['red', 'yellow', 'blue'], ask: 'a brown potion, like chocolate' },
  { color: 'Yellow', recipe: ['yellow'], ask: 'a yellow potion, like the sun' },
  { color: 'Red', recipe: ['red'], ask: 'a red potion, like a ripe apple' },
  { color: 'Blue', recipe: ['blue'], ask: 'a blue potion, like the sea' },
];

export function nextOrder(rand: () => number, last: string | null): Order {
  const pool = ORDERS.filter((o) => o.color !== last);
  return pool[Math.floor(rand() * pool.length) % pool.length]!;
}

/** "Try red and yellow." */
export function hintFor(o: Order): string {
  const counts = new Map<Drop, number>();
  for (const d of o.recipe) counts.set(d, (counts.get(d) ?? 0) + 1);
  const label: Readonly<Record<Drop, string>> = { red: 'red', yellow: 'yellow', blue: 'blue', white: 'white', ink: 'night ink' };
  const parts = [...counts].map(([d, n]) => (n > 1 ? `${n} ${label[d]}` : `1 ${label[d]}`));
  return `Try ${parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]}.`;
}
