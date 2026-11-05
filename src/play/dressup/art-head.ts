/**
 * art-head.ts — hats, headbands and hair clips, drawn on Jubi's 100×100 artboard (see art-kit.ts).
 *
 * Hats sit on the top point with the brim around y 29 and always cover the point's tip, so nothing of
 * the star pokes through; headbands hug the point between its outlines (bandD) so their ends never
 * hang in the air; clips sit on the left edge of the point, half over the outline, like a real clip.
 */
import { armHalf, bandD, c, e, flat, flower, g, heartD, INK, line, p, stick, twinkleD } from './art-kit';

const RED = '#e8364f';
const RED_DARK = '#b81f3a';
const FUR = '#fffaf2';
const GOLD = '#ffc43d';
const GREEN = '#2fae66';
const GREEN_DARK = '#1d7d49';

function santaHat(): SVGGElement {
  return g({ transform: 'rotate(-6 50 28)' },
    p('M58.6 13.6Q63 14 69 22L64.4 27Z', RED_DARK),
    p('M36 27Q38 9 54 6Q67 4 74 19L69 22Q63 14 59 14Q62 19 64 27Z', RED),
    flat('M40 24Q42 12 52 9Q46 14 45 24Z', '#ff6b7f', { opacity: 0.8 }),
    c(73, 21, 4.8, FUR),
    p('M33 24.5Q50 20.5 67 24.5L67.5 30.5Q50 27 32.5 30.5Z', FUR),
    flat('M36 28.6Q50 26 64 28.6', 'none', { stroke: '#e7ddcf', 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
  );
}

function elfHat(): SVGGElement {
  return g({},
    p('M37 27C40 15 50 5 66 -3C62 8 59 18 63 27Z', GREEN),
    flat('M41 24C44 15 51 8 59 3C53 10 49 17 46 24Z', '#5fd38f', { opacity: 0.7 }),
    c(66.5, -3.5, 3.6, GOLD),
    line('M64.6 -3.5h3.8', INK, 1.3),
    p('M34 23.5L66 23.5L66 29.5L62 33L58 29.5L54 33L50 29.5L46 33L42 29.5L38 33L34 29.5Z', RED),
  );
}

function antlers(): SVGGElement {
  const brown = '#9a5b2e';
  const L = 'M45.2 29Q40 22 36 13M39.2 19.5Q34 19.5 30 16M37.3 15.8Q38 10 41 7';
  const R = 'M54.8 29Q60 22 64 13M60.8 19.5Q66 19.5 70 16M62.7 15.8Q62 10 59 7';
  return g({},
    stick(L, '#c98552', 3.2),
    stick(R, '#c98552', 3.2),
    p(bandD(27.5, 32), brown),
    c(43, 30.5, 2.8, '#7cd36b', { 'stroke-width': 1.6 }),
    c(57, 30.5, 2.8, RED, { 'stroke-width': 1.6 }),
  );
}

function witchHat(): SVGGElement {
  return g({ transform: 'rotate(-4 50 28)' },
    e(50, 28.5, 23, 5, '#3b2466'),
    p('M38.5 28L47 7Q50 -1 61 -4Q55 2 54.5 9L61.5 28Z', '#4b2d80'),
    flat('M42 26L48.5 9Q50 4 53 2Q50 7 49.5 12L45 26Z', '#6a45a8', { opacity: 0.85 }),
    p('M39.8 23.5L60.2 23.5L61.4 28L38.6 28Z', '#ff8c1a'),
    p('M47.5 22.6h5v6.3h-5Z', GOLD, { 'stroke-width': 1.6 }),
    flat('M68 6l1.1 2.4 2.4 1.1-2.4 1.1-1.1 2.4-1.1-2.4-2.4-1.1 2.4-1.1Z', '#a8ff5e'),
  );
}

function paperCrown(): SVGGElement {
  return g({ transform: 'rotate(-7 50 27)' },
    p('M36.5 31L36.5 17L43.5 23.5L50 12.5L56.5 23.5L63.5 17L63.5 31Z', '#ff5e7e'),
    flat('M39 28.6L61 28.6', 'none', { stroke: '#ffb3c2', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    c(36.5, 16.5, 1.9, GOLD, { 'stroke-width': 1.4 }),
    c(50, 12, 1.9, GOLD, { 'stroke-width': 1.4 }),
    c(63.5, 16.5, 1.9, GOLD, { 'stroke-width': 1.4 }),
    line('M43.5 23.5L43.5 31M56.5 23.5L56.5 31', '#d63f63', 1.2),
  );
}

function partyHat(): SVGGElement {
  return g({ transform: 'rotate(8 50 29)' },
    p('M38 29L50 1.5L62 29Z', '#22b8a6'),
    flat('M45.6 12.1L52.2 6.6L54.4 11.6L44.3 15.1Z', '#ffd166'),
    flat('M42.6 19L56.2 15.7L58.3 20.5L41.3 22Z', '#ff8fb8'),
    line('M38 29L50 1.5L62 29', INK, 2.2),
    c(50, 1.5, 3.9, '#ff8fb8'),
    p('M36.5 29.5Q39 26 41.5 29.5Q44 26 46.5 29.5Q49 26 51.5 29.5Q54 26 56.5 29.5Q59 26 61.5 29.5Q64 26 63.5 31.5L36.5 31.5Z', FUR, { 'stroke-width': 1.8 }),
  );
}

function flowerCrown(): SVGGElement {
  const vine = 'M33 31Q50 22 67 31';
  return g({},
    stick(vine, '#3d9b55', 2.4),
    flat('M37.5 26.5q-4-4 0.5-6.5q2.8 3.3-0.5 6.5Z', '#5cc26f', { stroke: INK, 'stroke-width': 1.4 }),
    flat('M62.5 26.5q4-4-0.5-6.5q-2.8 3.3 0.5 6.5Z', '#5cc26f', { stroke: INK, 'stroke-width': 1.4 }),
    flower(35, 30, 6.4, '#ff8fb8', GOLD, 10),
    flower(43, 25.6, 7, '#fff4c2', '#ff9f1c', -8),
    flower(50, 23.8, 7.6, '#c3a6ff', GOLD, 0),
    flower(57, 25.6, 7, '#ffd166', '#ff6b4a', 12),
    flower(65, 30, 6.4, '#ff8fb8', GOLD, -6),
  );
}

function topHat(): SVGGElement {
  return g({ transform: 'rotate(-9 50 29)' },
    e(50, 29, 15.5, 3.8, '#2b2540'),
    p('M41 28.5L40 8.5Q50 6 60 8.5L59 28.5Q50 30.5 41 28.5Z', '#3a3256'),
    e(50, 8.5, 10, 2.4, '#4c4370'),
    p('M40.7 22L59.3 22L59.1 26.5Q50 28 40.9 26.5Z', '#e8364f', { 'stroke-width': 1.8 }),
    flat('M43 25V11.5', 'none', { stroke: '#5a5180', 'stroke-width': 2, 'stroke-linecap': 'round' }),
  );
}

function leprechaunHat(): SVGGElement {
  return g({ transform: 'rotate(-6 50 29)' },
    e(50, 29, 18, 4.2, GREEN_DARK),
    p('M40.5 28.5L37.5 7Q50 4.5 62.5 7L59.5 28.5Q50 30.5 40.5 28.5Z', GREEN),
    e(50, 7, 12.5, 2.6, '#47c47d'),
    p('M39.6 20.5L60.4 20.5L59.8 25.5Q50 27 40.2 25.5Z', INK, { 'stroke-width': 1.4 }),
    p('M46 19h8v8.2h-8Z', GOLD, { 'stroke-width': 1.6 }),
    flat('M48.2 21.2h3.6v3.8h-3.6Z', INK),
    flat('M58 9.5q2.2-1.8 3.6 0.4q-0.6 2.6-3.6 0.6Z', '#7ae0a0'),
  );
}

function beanie(): SVGGElement {
  const ribs = [40, 45, 50, 55, 60].map((x) => `M${x} 25Q${x + (x - 50) * 0.08} 16 ${50 + (x - 50) * 0.45} 10.5`).join('');
  const pom = g({});
  for (let i = 0; i < 9; i++) {
    const a = (i * 40 * Math.PI) / 180;
    pom.append(c(50 + Math.cos(a) * 4.2, 5.5 + Math.sin(a) * 4.2, 2.6, FUR, { 'stroke-width': 1.6 }));
  }
  pom.append(c(50, 5.5, 4.4, FUR, { stroke: 'none' }));
  return g({ transform: 'rotate(-5 50 30)' },
    pom,
    p('M35 26Q34 9 50 9Q66 9 65 26Z', '#e8364f'),
    line(ribs, RED_DARK, 1.3),
    p('M33.5 23.5Q50 20 66.5 23.5L66.5 31Q50 28 33.5 31Z', FUR),
    line('M37 27.4L37 24.4M41 26.5L41 23.4M45 26L45 22.8M50 25.8L50 22.6M55 26L55 22.8M59 26.5L59 23.4M63 27.4L63 24.4', '#e2d6c4', 1.3),
  );
}

function sunHat(): SVGGElement {
  return g({ transform: 'rotate(-5 50 28)' },
    e(50, 28, 25, 5.6, '#f2c76e'),
    flat('M30 28.5Q50 32 70 28.5', 'none', { stroke: '#d9a94a', 'stroke-width': 1.3, 'stroke-dasharray': '2 2.4' }),
    p('M38.5 28Q38 12.5 50 12.5Q62 12.5 61.5 28Z', '#f7d488'),
    p('M38.6 22.5Q50 20.5 61.4 22.5L61.5 27.5Q50 25.6 38.5 27.5Z', '#ff5e7e', { 'stroke-width': 1.8 }),
    flower(61.5, 24.5, 6.4, FUR, GOLD, 15),
    flat('M42 21Q42.5 15.5 47 14.5', 'none', { stroke: '#fff1c4', 'stroke-width': 1.8, 'stroke-linecap': 'round' }),
  );
}

function bunnyEars(): SVGGElement {
  const ear = (x: number, rot: number): SVGGElement => g({ transform: `rotate(${rot} ${x} 29)` },
    p(`M${x - 4.6} 29C${x - 6.5} 18 ${x - 5.5} 4 ${x} 3C${x + 5.5} 4 ${x + 6.5} 18 ${x + 4.6} 29Z`, FUR),
    flat(`M${x - 2} 26C${x - 3.2} 18 ${x - 2.8} 9 ${x} 8C${x + 2.8} 9 ${x + 3.2} 18 ${x + 2} 26Z`, '#ffb3cf'),
  );
  return g({},
    ear(45.5, -16),
    ear(54.5, 14),
    p(bandD(26.5, 31), '#ff8fb8'),
    flat(`M${50 - armHalf(27.6)} 27.8Q50 28.8 ${50 + armHalf(27.6)} 27.8`, 'none', { stroke: '#ffd1e2', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
  );
}

function lionHeadband(): SVGGElement {
  const pom = g({});
  for (let i = 0; i < 10; i++) {
    const a = (i * 36 * Math.PI) / 180;
    pom.append(c(50 + Math.cos(a) * 5.4, 19.4 + Math.sin(a) * 5.4, 2.9, i % 2 ? GOLD : '#ff6b3d', { 'stroke-width': 1.5 }));
  }
  pom.append(c(50, 19.4, 5.6, '#ff6b3d', { 'stroke-width': 1.6 }), c(50, 19.4, 2.4, GOLD, { stroke: 'none' }));
  // Gold scallops along the band's lower edge, kept inside the outline.
  const scallops: string[] = [];
  const y = 31.4;
  const half = armHalf(y) + 0.4;
  for (let i = 0; i < 4; i++) {
    const x0 = 50 - half + (i * 2 * half) / 4;
    const x1 = x0 + (2 * half) / 4;
    scallops.push(`M${x0.toFixed(2)} ${y}Q${((x0 + x1) / 2).toFixed(2)} ${y + 2.4} ${x1.toFixed(2)} ${y}`);
  }
  return g({},
    pom,
    p(bandD(24.6, 33), '#d61f2c'),
    line(scallops.join(''), GOLD, 1.5),
    line(`M${50 - armHalf(27) - 0.4} 27.4Q50 28.6 ${50 + armHalf(27) + 0.4} 27.4`, GOLD, 1.5),
    c(50, 29.6, 1.8, GOLD, { 'stroke-width': 1.2 }),
  );
}

function gradCap(): SVGGElement {
  return g({ transform: 'rotate(-6 50 22)' },
    p('M39 21L39 29.5Q50 33.5 61 29.5L61 21Z', '#2c3a78'),
    p('M28 18L50 9.5L72 18L50 26.5Z', '#3d4fa0'),
    flat('M33 18L50 11.5L56 13.8', 'none', { stroke: '#6a7ad0', 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
    c(50, 18, 1.7, GOLD, { 'stroke-width': 1.2 }),
    line('M50 18L69 19.5L69.5 28', GOLD, 1.6),
    p('M67.6 27.5h3.8l0.6 5.2h-5Z', GOLD, { 'stroke-width': 1.4 }),
  );
}

function pirateHat(): SVGGElement {
  return g({ transform: 'rotate(-5 50 26)' },
    p('M30 27Q31 9 50 9Q69 9 70 27Q60 21.5 50 24.5Q40 21.5 30 27Z', '#2b2540'),
    line('M31.5 25.6Q40.5 21 50 23.6Q59.5 21 68.5 25.6', GOLD, 1.6),
    p('M58 11Q66 4 74 6Q69 9 66 14Z', RED, { 'stroke-width': 1.6 }),
    c(50, 16, 3.6, FUR, { 'stroke-width': 1.6 }),
    flat('M48.6 15.4a0.9 0.9 0 1 0 0.01 0ZM51.4 15.4a0.9 0.9 0 1 0 0.01 0Z', INK),
    line('M46 21L54 17.8M54 21L46 17.8', FUR, 1.5),
  );
}

function chefHat(): SVGGElement {
  return g({ transform: 'rotate(-4 50 27)' },
    p('M39.5 23C31 22 31.5 9.5 41 10.5C42 2.5 58 2.5 59 10.5C68.5 9.5 69 22 60.5 23Z', FUR),
    line('M44 21Q43.5 15 45.5 12M55.5 21Q56.5 15 54.5 12', '#e2d6c4', 1.4),
    p('M39.6 21.5L60.4 21.5L60.4 30.5Q50 32 39.6 30.5Z', FUR),
    line('M44.5 22.5V30.6M50 22.5V31M55.5 22.5V30.6', '#e2d6c4', 1.3),
  );
}

function beeBoppers(): SVGGElement {
  const ball = (x: number, y: number): SVGGElement => g({},
    c(x, y, 4.2, GOLD),
    flat(`M${x - 3.9} ${y + 0.4}h7.8`, 'none', { stroke: INK, 'stroke-width': 1.8 }),
    c(x - 1.4, y - 1.6, 0.9, '#fff', { stroke: 'none' }),
  );
  return g({},
    stick('M45.5 28Q41 21 43 17Q45 13 40 9.5Q37 7.5 36.5 6', INK, 1.4),
    stick('M54.5 28Q59 21 57 17Q55 13 60 9.5Q63 7.5 63.5 6', INK, 1.4),
    ball(36, 5.5),
    ball(64, 5.5),
    p(bandD(26.5, 31), '#2b2540'),
  );
}

function shamrockClip(): SVGGElement {
  const leaf = (rot: number): SVGPathElement => p(heartD(0, -4.6, 3.4), '#3cc173', { transform: `rotate(${rot})`, 'stroke-width': 1.7 });
  return g({ transform: 'translate(42.6 29.2) rotate(-18)' },
    line('M0 1Q0.8 4.4 2.6 6', GREEN_DARK, 1.8),
    leaf(0), leaf(120), leaf(240),
    c(0, 0, 1.1, '#2a9d5c', { stroke: 'none' }),
  );
}

function marigoldClip(): SVGGElement {
  const out = g({ transform: 'translate(42.4 29.4)' },
    p('M-1 4q-6 1-7 6q5 0.6 7-6Z', '#3d9b55', { 'stroke-width': 1.5 }),
    p('M1 4.4q5 2.6 4.8 7q-4.6-1-4.8-7Z', '#3d9b55', { 'stroke-width': 1.5 }),
  );
  for (let ring = 0; ring < 2; ring++) {
    const n = ring === 0 ? 12 : 8;
    const rr = ring === 0 ? 4.6 : 2.6;
    for (let i = 0; i < n; i++) {
      const a = ((i * 360) / n + ring * 20) * (Math.PI / 180);
      out.append(c(Math.cos(a) * rr, Math.sin(a) * rr, ring === 0 ? 2.5 : 2.2, ring === 0 ? '#ff9f1c' : '#ffb84d', { 'stroke-width': ring === 0 ? 1.4 : 1.1 }));
    }
  }
  out.append(c(0, 0, 1.6, '#d9661a', { 'stroke-width': 1.1 }));
  return out;
}

function heartBow(): SVGGElement {
  return g({ transform: 'translate(42.2 29) rotate(-14)' },
    p('M0 0L-8.2 -5.2Q-10 0 -8.2 5.2Z', '#ff4d7d'),
    p('M0 0L8.2 -5.2Q10 0 8.2 5.2Z', '#ff4d7d'),
    flat('M-2.2 -0.8L-6.6 -3.4Q-7.4 -1.4 -7 0.4Z', '#ff9ab8'),
    flat('M2.2 -0.8L6.6 -3.4Q7.4 -1.4 7 0.4Z', '#ff9ab8'),
    p(heartD(0, 0.2, 2.2), '#e8264f', { 'stroke-width': 1.6 }),
  );
}

/** Small decorative twinkle used by a few hats (exported for the in-season badge too). */
export function twinkle(x: number, y: number, s: number, fill = '#fff'): SVGPathElement {
  return flat(twinkleD(x, y, s), fill, { stroke: INK, 'stroke-width': 1 });
}

/** Brimmed hats a touch bigger and lower, so they sit on Jubi's point instead of balancing on it. */
const perched = (make: () => SVGGElement, k = 1.16, drop = 2.6) => (): SVGGElement =>
  g({ transform: `translate(50 ${29 + drop}) scale(${k}) translate(-50 -29)` }, make());
/** Clips a little bigger, scaled about where they clip on. */
const clipped = (make: () => SVGGElement) => (): SVGGElement =>
  g({ transform: 'translate(42.5 29.5) scale(1.35) translate(-42.5 -29.5)' }, make());

export const HEAD_ART: Readonly<Record<string, () => SVGGElement>> = {
  'santa-hat': perched(santaHat),
  'elf-hat': perched(elfHat),
  antlers,
  'witch-hat': perched(witchHat, 1.12),
  'paper-crown': perched(paperCrown),
  'party-hat': perched(partyHat),
  'flower-crown': flowerCrown,
  'top-hat': perched(topHat),
  'leprechaun-hat': perched(leprechaunHat),
  beanie: perched(beanie),
  'sun-hat': perched(sunHat, 1.1),
  'bunny-ears': bunnyEars,
  'lion-headband': lionHeadband,
  'grad-cap': perched(gradCap, 1.12),
  'pirate-hat': perched(pirateHat, 1.12),
  'chef-hat': perched(chefHat),
  'bee-boppers': beeBoppers,
  'shamrock-clip': clipped(shamrockClip),
  'marigold-clip': clipped(marigoldClip),
  'heart-bow': clipped(heartBow),
};
