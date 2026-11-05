// Labor Day sticker ("Hard Worker"): a cheerful yellow hard hat with a big grin sits on a crossed hammer and wrench,
// the tools of everyone who builds and fixes things, on a blue cog-wheel badge sprinkled with tiny stars. The hat
// and the tools break out of the cog.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, capsule, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'labor-day-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#1a2a3a';

/** A cog: n square-ish teeth on a disc of radius r, teeth out to R. */
function cogD(cx, cy, r, R, n) {
  let d = '';
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2, w = (Math.PI * 2) / n;
    const pts = [[r, a0], [r, a0 + w * 0.18], [R, a0 + w * 0.26], [R, a0 + w * 0.56], [r, a0 + w * 0.64]];
    for (const [rr, a] of pts) d += `${d ? 'L' : 'M'}${P(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)}`;
  }
  return d + 'Z';
}

export function sticker() {
  setPrecision(10);
  const C0 = { x: 256, y: 268 };
  const bd = cogD(C0.x, C0.y, 176, 206, 12);
  const B = { cx: C0.x, cy: C0.y, r: 220 };
  const inside = circle(C0.x, C0.y, 40, { fill: 'none', stroke: '#ffffff', 'stroke-width': 0 });
  const bg = badge(ID, { d: bd, cx: C0.x, cy: C0.y, c1: '#4a8ae8', c2: '#1a4aa8', tile: tiled(ID, B, 44, [MARKS.star(7), MARKS.dot(3)]), patternFill: '#ffffff', patternOpacity: 0.4, ink: '#0a2060', inside, inset: 0.82 });

  // ---- the tools, crossed behind the hat
  const hammerH = capsule(256, 300, 170, 12, 40);
  const hammerHead = 'M120 120l60 -50l34 40l-60 50z';
  const wrenchH = capsule(256, 300, 160, 13, -40);
  // the wrench's open jaw: a ring of radius 42 with a notch cut toward the top right
  const jaw = (() => {
    const cx = 388, cy = 118, r = 42, dir = -Math.PI / 4, half = 15;
    const d = Math.asin(half / r), a1 = dir + d, a2 = dir - d;
    const pt = (a, rr) => P(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    const inner = (s) => P(cx + Math.cos(dir) * 6 + Math.cos(dir + Math.PI / 2) * half * s, cy + Math.sin(dir) * 6 + Math.sin(dir + Math.PI / 2) * half * s);
    return `M${pt(a1, r)}A${r} ${r} 0 1 1 ${pt(a2, r)}L${inner(-1)}L${inner(1)}Z`;
  })();
  const wrenchHead = jaw;
  // ---- the hard hat
  const dome = 'M128 300C128 196 186 140 256 140C326 140 384 196 384 300Z';
  const brim = 'M96 300h320q14 0 14 14v8q0 14 -14 14H96q-14 0 -14 -14v-8q0 -14 14 -14Z';
  const ridge = 'M240 140h32v160h-32Z';

  const heroSil = [hammerH, hammerHead, wrenchH, wrenchHead, dome, brim].map((d) => path(d)).join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-hat`, 0.38, 0.3, 0.8, [[0, '#fff2a0'], [0.5, '#ffc83a'], [1, '#e8960a']]),
    lin(`${ID}-steel`, 0, 0, 1, 1, [[0, '#e8ecf4'], [1, '#8a92a4']]),
    lin(`${ID}-handle`, 0, 0, 1, 0, [[0, '#c8844a'], [1, '#8a4a22']]),
    E('clipPath', { id: `${ID}-dc` }, path(dome)),
  ];

  const art = G({},
    '\n<!-- the badge: a blue cog wheel sprinkled with tiny stars -->\n',
    bg.art,
    sparkle(80, 360, 11, '#ffffff'), sparkle(440, 380, 9, '#ffe9a3'),
    '\n<!-- the tools and the hard hat: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(hammerH, { fill: u('handle') }), path(hammerHead, { fill: u('steel') }),
    path(wrenchH, { fill: u('steel') }), path(wrenchHead, { fill: u('steel') }),
    path(dome, { fill: u('hat') }),
    G({ 'clip-path': u('dc') }, path(ridge, { fill: '#ffe066' }), path('M150 240q40 -80 100 -92', { fill: 'none', stroke: '#ffffff', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.6 })),
    path('M240 140h32', { fill: 'none', stroke: '#e8a010', 'stroke-width': 3 }),
    path(brim, { fill: '#ffb800' }), path('M100 306h312', { fill: 'none', stroke: '#fff2a0', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8 }),
    face(256, 236, 64, 28, 'joy', { ink: INK, cheek: '#ff9a6a' }),
  );
  return stickerDoc(ID, 'Labor Day sticker: a cheerful yellow hard hat with a big grin sits on a crossed hammer and wrench, on a blue cog-wheel badge sprinkled with tiny stars', defs, sil, art);
}
