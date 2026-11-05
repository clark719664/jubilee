/**
 * art-held.ts — things Jubi holds in the round mitten at the right arm tip (GRIP, (84, 44)).
 *
 * Three ways of holding, so nothing floats: raised on a stick or string that runs into the mitten
 * (the mitten is drawn over it), hanging from a handle that loops through the mitten, or resting on
 * top of the mitten (the mitten is drawn first). Items stay within x ≤ 106 so a dressed Jubi fits
 * DRESS_VIEWBOX. The diya has no face (respect rule for sacred objects).
 */
import { c, e, flat, flower, g, GRIP, hand, heartD, INK, line, p, starD, stick, twinkleD } from './art-kit';

const WOOD = '#b0703a';
const GOLD = '#ffc43d';

/** Props are drawn at a comfortable working size, then grown about the grip so they read next to Jubi. */
const grow = (k: number, ...kids: SVGElement[]): SVGGElement =>
  g({ transform: `translate(${GRIP.x} ${GRIP.y}) scale(${k}) translate(${-GRIP.x} ${-GRIP.y})` }, ...kids);
/** Raised: draw the stick/string first, the mitten over it. */
const raised = (...kids: SVGElement[]): SVGGElement => g({ 'data-hold': 'raise' }, grow(1.16, ...kids), hand());
/** Resting on the mitten: mitten first. */
const resting = (...kids: SVGElement[]): SVGGElement => g({ 'data-hold': 'rest' }, hand(), grow(1.4, ...kids));
/** Hanging from a handle through the mitten. */
const hanging = (handle: SVGElement, ...kids: SVGElement[]): SVGGElement => g({ 'data-hold': 'hang' }, grow(1.26, ...kids, handle), hand());

function paperLantern(): SVGGElement {
  return raised(
    stick('M84 44L90.5 12Q91.4 8.6 95.6 9.4', WOOD, 2.2),
    line('M96.4 9.6V16.6', INK, 1.4),
    p('M93 16.4h6.8v2.6h-6.8Z', GOLD, { 'stroke-width': 1.6 }),
    e(96.4, 26, 8.6, 7.8, '#e8263a'),
    flat('M91.4 21.6Q89.6 26 91.4 30.4', 'none', { stroke: '#ff7b6b', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    line('M96.4 18.4Q92 26 96.4 33.6M96.4 18.4Q100.8 26 96.4 33.6', '#a8121f', 1.2),
    p('M93 33.2h6.8v2.6h-6.8Z', GOLD, { 'stroke-width': 1.6 }),
    line('M96.4 35.8V42.4', '#ff9f1c', 2.4),
    line('M94.9 40.4V43.4M97.9 40.4V43.4', '#ff9f1c', 1.4),
  );
}

function fanous(): SVGGElement {
  return hanging(
    line('M84 44V50.2', INK, 1.6),
    c(84, 50.8, 1.4, GOLD, { 'stroke-width': 1.1 }),
    p('M76.4 59.4Q78 52 84 52Q90 52 91.6 59.4Z', GOLD),
    p('M77 59.4H91L90 71.4H78Z', '#2a9d8f'),
    flat('M80.2 60.6H83.2V70.2H80.8Z', '#ffe9a3', { opacity: 0.9 }),
    flat('M84.8 60.6H87.8L87.2 70.2H84.8Z', '#ff8fb8', { opacity: 0.85 }),
    line('M84 59.4V71.4M77.2 63.4H90.8M77.6 67.4H90.4', '#d99a1a', 1.2),
    line('M77 59.4H91L90 71.4H78Z', INK, 2.2),
    p('M77.6 71.4H90.4L88 75.4H80Z', GOLD),
    c(84, 76.6, 1.3, GOLD, { 'stroke-width': 1.1 }),
  );
}

function diya(): SVGGElement {
  return resting(
    p('M75.6 35.6Q77 44.2 86 44.2Q94.4 44.2 97.2 37.6L101.4 33.6Q93 34.6 86 34.8Q80 34.8 75.6 35.6Z', '#d9622b'),
    flat('M77.6 37Q86 38.2 96.4 36.4', 'none', { stroke: '#7a2f12', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    line('M80.6 40.4h.01M85 41.4h.01M89.4 40.8h.01', GOLD, 2),
    p('M99 23Q103.4 28.4 99.8 32.6Q95.4 29.6 99 23Z', GOLD, { 'stroke-width': 1.7 }),
    flat('M99.4 27.2Q101 29.6 99.8 31.2Q98.2 30 99.4 27.2Z', '#ff7a1a'),
  );
}

function dreidel(): SVGGElement {
  return hanging(
    stick('M84 44V50.6', '#2a62c9', 2.4),
    p('M77.4 50.4H90.6V62.4H77.4Z', '#3a86ff'),
    p('M77.4 62.4H90.6L84 70.8Z', '#2a62c9'),
    flat('M79.6 52.4H83.4V60.4H79.6Z', '#7fb6ff', { opacity: 0.8 }),
    flat(twinkleD(86.8, 56.4, 2.8), GOLD, { stroke: INK, 'stroke-width': 1 }),
  );
}

function balloon(): SVGGElement {
  return raised(
    line('M93.4 15.4Q88 22 92.6 29Q96.4 36 85.4 42.6', INK, 1.2),
    p('M93.4 13.6Q84.4 12.4 84.6 3.2Q85 -6.2 93.4 -6.2Q101.8 -6.2 102.2 3.2Q102.4 12.4 93.4 13.6Z', '#ff5e7e'),
    p('M91.6 13.4L95.2 13.4L96 16L90.8 16Z', '#e8364f', { 'stroke-width': 1.4 }),
    flat('M88.6 -1.4Q89.4 -4.2 92 -4.4', 'none', { stroke: '#fff', 'stroke-width': 1.8, 'stroke-linecap': 'round', opacity: 0.9 }),
  );
}

function pumpkinPail(): SVGGElement {
  return hanging(
    line('M75.4 58.6Q75 44 84 44Q93 44 92.6 58.6', INK, 1.9),
    stick('M87.4 57L89 49.6', '#fff', 1.1),
    c(89.2, 49, 2.8, '#7ae0a0', { 'stroke-width': 1.5 }),
    c(80.4, 55.4, 2.6, '#ff5ec4', { 'stroke-width': 1.5 }),
    p('M73.6 64.6Q73.4 56.8 79 56.6Q84 55.4 89 56.6Q94.6 56.8 94.4 64.6Q94.4 73.4 84 73.6Q73.6 73.4 73.6 64.6Z', '#ff8c1a'),
    line('M79.6 57.2Q77.4 65 80 73M88.4 57.2Q90.6 65 88 73', '#d96a0f', 1.3),
    e(84, 57.4, 6.4, 1.8, '#c45a0a', { 'stroke-width': 1.6 }),
    flat('M77.6 61.6L81.4 61.6L79.5 64.4ZM86.6 61.6L90.4 61.6L88.5 64.4Z', INK),
    flat('M77.6 66.4Q84 72.4 90.4 66.4Q88 67.2 87.2 68.4L86 67.2L84.6 68.8L83.2 67.2L81.8 68.6L80.6 67.4Q79.8 67 77.6 66.4Z', INK),
  );
}

function pinwheel(): SVGGElement {
  const cols = ['#ff5e7e', '#ffd23f', '#22b8a6', '#9b6bff'];
  // The spin runs on an inner group so the CSS rotation never replaces the positioning transform.
  const blades = g({ class: 'dz-spin' });
  cols.forEach((col, i) => blades.append(p('M0 0L0 -10.4Q7.6 -9.6 8 -2Z', col, { transform: `rotate(${i * 90})`, 'stroke-width': 1.8 })));
  blades.append(c(0, 0, 1.7, '#fff', { 'stroke-width': 1.3 }));
  return raised(stick('M84 44L93.6 10.4', '#5ed27a', 2), g({ transform: 'translate(93.6 10.4)' }, blades));
}

function kite(): SVGGElement {
  return raised(
    line('M95.4 14.6Q86.6 22 92.4 30.2Q96.4 36.6 85.2 42.6', INK, 1.1),
    line('M95.4 14.6Q100.6 19 98.2 23.4Q96 27.8 101.4 31', '#ff5e7e', 1.4),
    p('M95.4 -8.2L104.4 2.8L95.4 14.6L86.4 2.8Z', '#ff8c1a'),
    flat('M95.4 -8.2L104.4 2.8L95.4 2.8Z', '#22b8a6'),
    flat('M95.4 14.6L86.4 2.8L95.4 2.8Z', '#22b8a6'),
    line('M95.4 -8.2L95.4 14.6M86.4 2.8L104.4 2.8', INK, 1.1),
    line('M95.4 -8.2L104.4 2.8L95.4 14.6L86.4 2.8Z', INK, 2.2),
  );
}

function paperPlane(): SVGGElement {
  return raised(
    p('M87.4 40.4L104.4 25.6L91.4 47.6Z', '#cfe3f5'),
    p('M77.6 34.6L104.4 25.6L87.4 40.4Z', '#f4fbff'),
    line('M82.6 37.6L104.4 25.6', '#9ab7d3', 1.1),
  );
}

function present(): SVGGElement {
  return resting(
    p('M76.4 29.6H95.2V40.2H76.4Z', '#e8364f'),
    p('M83.8 29.6H87.8V40.2H83.8Z', GOLD, { 'stroke-width': 1.6 }),
    p('M75.4 26.4H96.2V30.4H75.4Z', '#ff5e7e', { 'stroke-width': 1.8 }),
    p('M83.6 26.4H88V30.4H83.6Z', GOLD, { 'stroke-width': 1.4 }),
    p('M85.8 26.4Q79.6 18.6 78.6 23.2Q78.2 26.4 85.8 26.4Z', GOLD, { 'stroke-width': 1.6 }),
    p('M85.8 26.4Q92 18.6 93 23.2Q93.4 26.4 85.8 26.4Z', GOLD, { 'stroke-width': 1.6 }),
  );
}

function mooncake(): SVGGElement {
  const edge: string[] = [];
  for (let i = 0; i < 12; i++) {
    const a0 = (i * 30 * Math.PI) / 180;
    const a1 = ((i + 1) * 30 * Math.PI) / 180;
    const am = (a0 + a1) / 2;
    edge.push(`${i === 0 ? 'M' : 'L'}${(86 + Math.cos(a0) * 8.4).toFixed(2)} ${(32.4 + Math.sin(a0) * 8.4).toFixed(2)}`,
      `Q${(86 + Math.cos(am) * 9.8).toFixed(2)} ${(32.4 + Math.sin(am) * 9.8).toFixed(2)} ${(86 + Math.cos(a1) * 8.4).toFixed(2)} ${(32.4 + Math.sin(a1) * 8.4).toFixed(2)}`);
  }
  return resting(
    p(`${edge.join('')}Z`, '#d9963f'),
    c(86, 32.4, 6, '#e8ab55', { 'stroke-width': 1.4 }),
    line('M86 28.4V36.4M82 32.4H90M83.2 29.6L88.8 35.2M88.8 29.6L83.2 35.2', '#c98030', 1.1),
    c(86, 32.4, 1.6, '#c98030', { stroke: 'none' }),
    flat('M80.8 28.4Q82 26.4 84.4 25.8', 'none', { stroke: '#ffe2a8', 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
  );
}

function redEnvelope(): SVGGElement {
  return raised(
    p('M79.2 18.6H94.8V45.4H79.2Z', '#e8263a'),
    p('M79.2 18.6L87 26.4L94.8 18.6Z', '#c81f2e', { 'stroke-width': 1.8 }),
    c(87, 33.6, 4.2, GOLD, { 'stroke-width': 1.8 }),
    flat('M85.4 32h3.2v3.2h-3.2Z', '#c81f2e'),
    line('M81.6 41.4H92.4', '#ffc43d', 1.4),
  );
}

function paintbrush(): SVGGElement {
  return raised(
    stick('M80 51.6L93.2 18.4', '#3a86ff', 2.6),
    p('M91.2 18L95.8 19.8L97.4 15.6L92.8 13.8Z', '#c9ccd8', { 'stroke-width': 1.6 }),
    p('M92.8 13.8L97.4 15.6Q99.4 8.6 97.2 4.6Q93.4 7.6 92.8 13.8Z', '#ff5ec4', { 'stroke-width': 1.8 }),
    c(101.2, 10.2, 1.5, '#ff5ec4', { 'stroke-width': 1.1 }),
  );
}

function colourBowl(): SVGGElement {
  return resting(
    p('M77.8 33.6Q78.6 27 83 28.4Q84.4 24.6 88 27.2Q91.8 25.6 93.4 30.4Q95.6 31 94.6 34Z', '#ff5ec4', { 'stroke-width': 1.8 }),
    p('M84.2 33.4Q84.4 29.2 88.2 29Q92 29.4 92.2 33.4Z', '#ffd23f', { 'stroke-width': 1.6 }),
    p('M78.6 33.6Q79.4 30.2 82.4 30.4Q85 30.8 85.2 33.6Z', '#22b8a6', { 'stroke-width': 1.6 }),
    p('M76 33.2H96Q95.4 41.8 86 41.8Q76.6 41.8 76 33.2Z', '#e8a23a'),
    line('M78.6 36.6Q86 38.4 93.4 36.6', '#fff2c4', 1.3),
    c(99.6, 25.4, 1.4, '#ff5ec4', { stroke: 'none', class: 'dz-puff' }),
    c(101.6, 30.6, 1.1, '#22b8a6', { stroke: 'none', class: 'dz-puff' }),
    c(97.4, 21.2, 1, '#ffd23f', { stroke: 'none', class: 'dz-puff' }),
  );
}

function umbrella(): SVGGElement {
  return raised(
    stick('M84 51.2Q84 55 80.6 55Q78.4 55 78.4 52.8', '#7b4dff', 2),
    stick('M84 51.2V8', INK, 1.4),
    p('M68.6 9.4Q70 -6.2 86 -6.6Q102 -6.2 103.4 9.4Q99.6 6.6 95.6 9.4Q91.4 6.4 86 9.4Q80.6 6.4 76.4 9.4Q72.4 6.6 68.6 9.4Z', '#7b4dff'),
    flat('M86 -6.6Q80.6 -2 76.4 9.4Q80.6 6.4 86 9.4Z', '#b39bff'),
    flat('M86 -6.6Q91.4 -2 95.6 9.4Q91.4 6.4 86 9.4Z', '#b39bff'),
    line('M86 -6.6Q80.6 -2 76.4 9.4M86 -6.6Q91.4 -2 95.6 9.4M86 -6.6V9.4', INK, 1.2),
    c(86, -7.4, 1.5, GOLD, { 'stroke-width': 1.1 }),
  );
}

function magicWand(): SVGGElement {
  return raised(
    stick('M80.6 50.4L94.8 17.4', '#2b2540', 2.4),
    stick('M93.4 20.6L94.8 17.4', '#fff', 2.4),
    p(starD(96.2, 12.4, 7.6, 3.5, 8), GOLD, { class: 'dz-twinkle' }),
    flat(twinkleD(104.4, 4.4, 2.4), '#fff', { stroke: INK, 'stroke-width': 0.9, class: 'dz-twinkle' }),
    flat(twinkleD(87.4, 4.6, 1.8), '#fff', { stroke: INK, 'stroke-width': 0.9, class: 'dz-twinkle' }),
  );
}

function eggBasket(): SVGGElement {
  return hanging(
    line('M74.6 58.4Q74.2 43.6 84 43.6Q93.8 43.6 93.4 58.4', '#a86a2e', 2.4),
    e(77.8, 56.4, 3.4, 4.2, '#9fd8ff', { 'stroke-width': 1.6, transform: 'rotate(-14 77.8 56.4)' }),
    e(84.2, 55.4, 3.6, 4.6, '#ff8fb8', { 'stroke-width': 1.6 }),
    e(90.4, 56.4, 3.4, 4.2, '#ffe066', { 'stroke-width': 1.6, transform: 'rotate(14 90.4 56.4)' }),
    line('M81.6 55.2l1.3-1.2 1.3 1.2 1.3-1.2 1.3 1.2', '#fff', 1.1),
    flat('M74 58.8q2-2.6 3.6 0q1.8-2.6 3.6 0q1.8-2.6 3.6 0q1.8-2.6 3.6 0q1.8-2.6 3.6 0q1.6-2.4 2.4 0Z', '#5ed27a', { stroke: INK, 'stroke-width': 1.2 }),
    p('M73.2 58.8H94.8L92 72.2Q84 75.6 76 72.2Z', '#d4954f'),
    line('M74.4 63.2H93.6M75.4 67.6H92.6M79.6 59V73.4M84 59V74.2M88.4 59V73.4', '#a86a2e', 1.1),
  );
}

function flowerBunch(): SVGGElement {
  return raised(
    line('M84 44L81.6 26M84 44L89.6 20.4M84 44L95.6 27.2', '#3d9b55', 1.8),
    p('M87.4 27.6q4.4-3 6.6 0.6q-3.6 2.4-6.6-0.6Z', '#5cc26f', { 'stroke-width': 1.3 }),
    flower(89.6, 18.8, 8, '#fff', '#ffd23f', 8),
    p('M78 26.6Q77.6 19.6 81.6 19.4Q85.6 19.6 85.2 26.6Q81.6 28.6 78 26.6Z', '#e8364f', { 'stroke-width': 1.8 }),
    line('M79.8 20.6L81.6 23.6L83.4 20.6', '#b81f3a', 1.1),
    c(96, 26.8, 4, '#ff8fb8', { 'stroke-width': 1.8 }),
    line('M94.4 26.4q1.6-1.8 3.2 0q-1.6 1.6-1.6 0', '#e0608f', 1.1),
    p('M77.4 39.6L80.4 31.2L90.6 31.2L88.4 39.6Q83 41.8 77.4 39.6Z', '#e7c79c', { 'stroke-width': 1.8 }),
    line('M79.2 34.6Q85 35.8 89.8 34.4', '#c7a273', 1.1),
  );
}

function heartLolly(): SVGGElement {
  return raised(
    stick('M84 44L91.2 18.6', '#fff', 1.8),
    p(heartD(92.4, 12.4, 8.2), '#ff3d6e'),
    flat(`M88.2 11.4q3.2-4.2 7.6-1.2q1.8 3.6-2 5.4q-2.4 0.4-2.8-1.8`, 'none', { stroke: '#ffd0dd', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
  );
}

/** Waffle lines that start and end on the cone's two edges, so none crosses its outline. */
function coneHatch(): string {
  const L = (t: number): string => `${(79 + 7.4 * t).toFixed(2)} ${(30.4 + 17.2 * t).toFixed(2)}`;
  const R = (t: number): string => `${(93.4 - 7 * t).toFixed(2)} ${(30.4 + 17.2 * t).toFixed(2)}`;
  const out: string[] = [];
  for (const t of [0.08, 0.32, 0.56]) out.push(`M${L(t)}L${R(t + 0.3)}`, `M${R(t)}L${L(t + 0.3)}`);
  return out.join('');
}

function iceCream(): SVGGElement {
  return raised(
    p('M79 30.4H93.4L86.4 47.6Z', '#e9b26a'),
    line(coneHatch(), '#c98a3e', 1.1),
    c(86.2, 26.4, 7.4, '#ff8fb8'),
    p('M79 27.6Q78.6 31.6 81.4 31.2Q82.4 33.8 84.4 31.8Q86.6 33.6 87.8 31.6Q90.4 33.6 91.2 31Q93.8 31.4 93.4 27.6Z', '#ff8fb8', { 'stroke-width': 1.8 }),
    c(86.4, 17.2, 5.8, '#8ee3c8'),
    c(86.8, 10.6, 2.6, '#e8264f', { 'stroke-width': 1.6 }),
    line('M87.6 8.2Q88.6 5.6 91 5', INK, 1.1),
    flat('M82.6 23.4Q83.6 21.4 85.6 21', 'none', { stroke: '#fff', 'stroke-width': 1.4, 'stroke-linecap': 'round', opacity: 0.9 }),
  );
}

/** A maple leaf pointing up, centred at (cx, cy), about 22 units across. */
function leafD(cx: number, cy: number, k: number): string {
  const pts = [[0, -12], [2.6, -6.4], [6.8, -8.4], [5.8, -3.2], [11, -3.6], [7.6, 0.6], [9.4, 4], [3.6, 3.4], [1, 7.4]];
  const right = pts.map(([x, y]) => `${(cx + x! * k).toFixed(2)},${(cy + y! * k).toFixed(2)}`);
  const left = pts.slice(1).reverse().map(([x, y]) => `${(cx - x! * k).toFixed(2)},${(cy + y! * k).toFixed(2)}`);
  return `M${right.join('L')}L${left.join('L')}Z`;
}

function autumnLeaf(): SVGGElement {
  return raised(
    stick('M84 44L91.4 27.4', '#8a4b26', 1.6),
    g({ transform: 'rotate(16 92 19)' },
      p(leafD(92, 19, 0.95), '#ff7a1a'),
      flat(leafD(92, 19, 0.55), '#ffa24a'),
      line('M92 25.4V10.6M92 21.4L86.4 17.2M92 21.4L97.6 17.2M92 24L88.4 24.4M92 24L95.6 24.4', '#c4420f', 1.1)),
  );
}

function fruitBasket(): SVGGElement {
  return hanging(
    line('M74.6 58.4Q74.2 43.6 84 43.6Q93.8 43.6 93.4 58.4', '#8a5a2b', 2.4),
    c(78.6, 56, 4.4, '#ff9f1c', { 'stroke-width': 1.7 }),
    c(85, 54.6, 4.6, '#7cd36b', { 'stroke-width': 1.7 }),
    line('M85 50.2Q85.4 48.4 86.8 47.8', INK, 1.2),
    c(89.6, 57.2, 2.2, '#9b6bff', { 'stroke-width': 1.3 }),
    c(92.2, 55.6, 2.2, '#9b6bff', { 'stroke-width': 1.3 }),
    c(91.6, 59.2, 2.2, '#9b6bff', { 'stroke-width': 1.3 }),
    p('M73.2 58.8H94.8L92 72.2Q84 75.6 76 72.2Z', '#c98b4b'),
    line('M73.8 62.4Q84 64.4 94.2 62.4', '#e2b27a', 1.6),
    line('M76.8 66.6L79 70.6M81.2 66.8L83.4 71.4M85.6 66.8L87.8 71.4M90 66.6L91.4 69.4', '#8a5a2b', 1.2),
  );
}

export const HELD_ART: Readonly<Record<string, () => SVGGElement>> = {
  'paper-lantern': paperLantern,
  fanous,
  diya,
  dreidel,
  balloon,
  'pumpkin-pail': pumpkinPail,
  pinwheel,
  kite,
  'paper-plane': paperPlane,
  present,
  mooncake,
  'red-envelope': redEnvelope,
  paintbrush,
  'colour-bowl': colourBowl,
  umbrella,
  'magic-wand': magicWand,
  'egg-basket': eggBasket,
  'flower-bunch': flowerBunch,
  'heart-lolly': heartLolly,
  'ice-cream': iceCream,
  'autumn-leaf': autumnLeaf,
  'fruit-basket': fruitBasket,
};

/** The grip, exported for the overlay's "wave the item" animation origin. */
export const HOLD_ORIGIN = `${GRIP.x}px ${GRIP.y}px`;
