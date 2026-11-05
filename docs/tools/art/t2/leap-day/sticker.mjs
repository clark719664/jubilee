// Leap Day sticker ("Rare Hopper"): a bright green frog in a party hat leaps for joy, arms flung up and legs kicked
// wide, clean over a tear-off calendar page that reads 29 — the bonus day that comes once every four years. The
// badge is a lily pad, notch and all, with soft veins and little ripples. The frog breaks out of the top.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, capsule, circleD, inkUnder, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'leap-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#143a1a';

export function sticker() {
  setPrecision(10);
  const C0 = { x: 256, y: 284 };
  const R = 188;
  // the pond: a round badge of water with two notched lily pads and ripples
  const bd = circleD(C0.x, C0.y, 190);
  const lily = (x, y, r, rot) => { const q = (a) => P(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.5); return `M${P(x, y)}L${q(rot)}A${r} ${f(r * 0.5)} 0 1 1 ${q(rot + 0.5)}Z`; };
  const inside = [
    path('M90 250q30 -10 60 0M370 230q30 -10 60 0M200 150q40 -12 80 0', { fill: 'none', stroke: '#c8f0ff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.7 }),
    path(lily(118, 410, 70, -0.8) + lily(398, 418, 76, -2.6), { fill: '#4ab84a' }),
    path(lily(118, 410, 54, -0.8) + lily(398, 418, 60, -2.6), { fill: 'none', stroke: '#8ad86a', 'stroke-width': 3, opacity: 0.8 }),
  ].join('');
  const bg = badge(ID, { d: bd, cx: C0.x, cy: C0.y, c1: '#8ad8f4', c2: '#2a8ac8', ink: '#0a4a7a', stitch: '#e0f8ff', inside, inset: 0.9 });

  // ---- the calendar page
  const page = 'M178 330L338 318L348 452L188 464Z';
  const header = 'M178 330L338 318L341 356L181 368Z';
  // ---- the frog, leaping
  const F = { x: 256, y: 214 };
  const body = `M${P(F.x - 74, F.y + 10)}C${P(F.x - 80, F.y - 60)} ${P(F.x - 40, F.y - 76)} ${P(F.x, F.y - 76)}C${P(F.x + 40, F.y - 76)} ${P(F.x + 80, F.y - 60)} ${P(F.x + 74, F.y + 10)}C${P(F.x + 66, F.y + 66)} ${P(F.x + 30, F.y + 80)} ${P(F.x, F.y + 80)}C${P(F.x - 30, F.y + 80)} ${P(F.x - 66, F.y + 66)} ${P(F.x - 74, F.y + 10)}Z`;
  const eyes = `M${P(F.x - 74, F.y - 72)}a32 32 0 1 0 64 0a32 32 0 1 0 -64 0ZM${P(F.x + 10, F.y - 72)}a32 32 0 1 0 64 0a32 32 0 1 0 -64 0Z`;
  const arms = capsule(F.x - 92, F.y - 40, 40, 13, -50) + capsule(F.x + 92, F.y - 40, 40, 13, 50);
  const hands = `M${P(F.x - 140, F.y - 92)}a17 17 0 1 0 34 0a17 17 0 1 0 -34 0ZM${P(F.x + 106, F.y - 92)}a17 17 0 1 0 34 0a17 17 0 1 0 -34 0Z`;
  const legs = capsule(F.x - 72, F.y + 92, 52, 16, 135) + capsule(F.x + 72, F.y + 92, 52, 16, 45);
  const toe = (x, y) => `M${P(x - 9, y)}a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z`;
  const feet = [[-1, 1], [1, 1]].map(([sx]) => { const x = F.x + sx * 104, y = F.y + 124; return toe(x - 12 * sx, y + 10) + toe(x + 2 * sx, y + 16) + toe(x + 14 * sx, y + 8) + `M${P(x - 14, y - 6)}h28v14h-28z`; }).join('');
  const hat = `M${P(F.x - 24, F.y - 96)}L${P(F.x + 6, F.y - 166)}L${P(F.x + 30, F.y - 92)}Z`;
  const pom = `M${P(F.x - 6, F.y - 168)}a12 12 0 1 0 24 0a12 12 0 1 0 -24 0Z`;
  const heroSil = [page, legs, feet, arms, hands, body, eyes, hat, pom].map((d) => path(d)).join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-frog`, 0.4, 0.3, 0.8, [[0, '#b8f080'], [0.6, '#5ac83a'], [1, '#2a9a2a']]),
    lin(`${ID}-paper`, 0, 0, 0, 1, [[0, '#ffffff'], [1, '#e8ecf0']]),
    lin(`${ID}-hat`, 0, 0, 1, 1, [[0, '#ff8ac8'], [1, '#e83a8a']]),
  ];

  const art = G({},
    '\n<!-- the badge: a lily pad, notch and all -->\n',
    bg.art,
    sparkle(116, 158, 12, '#ffffff'), sparkle(420, 396, 10, '#fff4a0'), sparkle(412, 150, 8, '#ffffff'),
    '\n<!-- the calendar page and the leaping frog in a party hat: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(page, { fill: u('paper') }), path(header, { fill: '#e8243a' }),
    path('M206 336v-14M246 333v-14M286 330v-14M318 328v-14', { fill: 'none', stroke: '#8a8a9a', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    G({ transform: 'rotate(-4 262 410)' }, path('M206 392c0 -18 32 -18 32 0c0 12 -32 28 -32 48h34M296 402a16 16 0 1 0 0 2M296 400c0 24 -4 38 -26 42', { fill: 'none', stroke: '#2a2a3a', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })),
    path('M118 262q-20 30 -4 64M394 262q20 30 4 64', { fill: 'none', stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.85 }),
    path(legs, { fill: '#3aa83a' }), path(feet, { fill: '#3aa83a' }),
    path(arms, { fill: '#4ab83a' }), path(hands, { fill: '#4ab83a' }),
    path(body, { fill: u('frog') }),
    ellipse(F.x, F.y + 34, 46, 36, { fill: '#e8f8c0' }),
    path(`M${P(F.x - 50, F.y - 30)}q14 -24 40 -30`, { fill: 'none', stroke: '#ffffff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.6 }),
    path(eyes, { fill: u('frog') }),
    circle(F.x - 42, F.y - 74, 21, { fill: '#ffffff' }), circle(F.x + 42, F.y - 74, 21, { fill: '#ffffff' }),
    circle(F.x - 38, F.y - 72, 11, { fill: INK }), circle(F.x + 46, F.y - 72, 11, { fill: INK }),
    circle(F.x - 34, F.y - 77, 4, { fill: '#ffffff' }), circle(F.x + 50, F.y - 77, 4, { fill: '#ffffff' }),
    path(`M${P(F.x - 34, F.y - 14)}Q${P(F.x, F.y + 34)} ${P(F.x + 34, F.y - 14)}Z`, { fill: '#6b1f35', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }),
    path(`M${P(F.x - 16, F.y + 4)}Q${P(F.x, F.y - 6)} ${P(F.x + 16, F.y + 4)}Q${P(F.x, F.y + 18)} ${P(F.x - 16, F.y + 4)}Z`, { fill: '#ff7a8a' }),
    ellipse(F.x - 54, F.y - 12, 14, 8, { fill: '#ff9aa8', opacity: 0.7 }), ellipse(F.x + 54, F.y - 12, 14, 8, { fill: '#ff9aa8', opacity: 0.7 }),
    path(hat, { fill: u('hat') }), path(`M${P(F.x - 16, F.y - 110)}L${P(F.x + 26, F.y - 116)}M${P(F.x - 6, F.y - 134)}L${P(F.x + 18, F.y - 138)}`, { fill: 'none', stroke: '#ffd166', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    path(pom, { fill: '#ffd166' }),
  );
  return stickerDoc(ID, 'Leap Day sticker: a bright green frog in a party hat leaps for joy, arms up and legs kicked wide, over a tear-off calendar page that reads 29, on a lily-pad badge', defs, sil, art);
}
