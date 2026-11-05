// Orthodox Easter sticker ("Red Egg"): a glossy red Easter egg painted with gold folk patterns and a happy face,
// nestled in a braided tsoureki ring sprinkled with sesame. The badge is a quatrefoil, the four-lobed ornament of
// Byzantine tiles, in deep blue with tiny gold flowers. The bread ring breaks out at the bottom.
import { f, P, E, G, path, circle, ellipse, lin, rad, setPrecision } from '../../gen-xmas/lib.mjs';
import { badge, MARKS, tiled, inkUnder, face, sparkle, stickerDoc } from '../../kit/stickerkit.mjs';

const ID = 'orthodox-easter-st';
const u = (s) => `url(#${ID}-${s})`;
const INK = '#2a0a14';

/** A quatrefoil: four round lobes (offset `o`, radius `r`) about (cx, cy), traced as one outline. */
function quatrefoilD(cx, cy, o, r) {
  const half = (o * Math.SQRT2) / 2, h = Math.sqrt(r * r - half * half);
  const k = o / 2 + h * Math.SQRT1_2;                       // the outer crossing points sit at (cx ± k, cy ± k)
  const pt = (sx, sy) => P(cx + sx * k, cy + sy * k);
  return `M${pt(1, -1)}A${f(r)} ${f(r)} 0 0 1 ${pt(1, 1)}A${f(r)} ${f(r)} 0 0 1 ${pt(-1, 1)}A${f(r)} ${f(r)} 0 0 1 ${pt(-1, -1)}A${f(r)} ${f(r)} 0 0 1 ${pt(1, -1)}Z`;
}

export function sticker() {
  setPrecision(10);
  const bd = quatrefoilD(256, 252, 92, 112);
  const B = { cx: 256, cy: 252, r: 220 };
  const bg = badge(ID, { d: bd, cx: 256, cy: 252, c1: '#2a5ac8', c2: '#12286e', tile: tiled(ID, B, 44, [MARKS.flower(8), MARKS.dot(2.6), MARKS.diamond(5)]), patternFill: '#ffc83a', patternOpacity: 0.5, ink: '#0a1440', stitch: '#ffd166', stitchOpacity: 0.7, inset: 0.86,
    inside: circle(256, 240, 150, { fill: `url(#${ID}-halo)` }) });

  // ---- the egg
  const EG = { x: 256, y: 232, rx: 90, ry: 116 };
  const eggD = `M${EG.x} ${EG.y - EG.ry}C${EG.x + EG.rx * 0.7} ${EG.y - EG.ry} ${EG.x + EG.rx} ${EG.y - EG.ry * 0.2} ${EG.x + EG.rx} ${EG.y + EG.ry * 0.25}C${EG.x + EG.rx} ${EG.y + EG.ry * 0.75} ${EG.x + EG.rx * 0.55} ${EG.y + EG.ry} ${EG.x} ${EG.y + EG.ry}C${EG.x - EG.rx * 0.55} ${EG.y + EG.ry} ${EG.x - EG.rx} ${EG.y + EG.ry * 0.75} ${EG.x - EG.rx} ${EG.y + EG.ry * 0.25}C${EG.x - EG.rx} ${EG.y - EG.ry * 0.2} ${EG.x - EG.rx * 0.7} ${EG.y - EG.ry} ${EG.x} ${EG.y - EG.ry}Z`;
  // ---- the braided bread ring: bumps round an ellipse; back half behind the egg, front half in front
  const RG = { x: 256, y: 352, rx: 156, ry: 58 };
  // twisted strands: overlapping ovals that lean one way along the ring, like a braid
  const bump = (a, k) => {
    const x = RG.x + Math.cos(a) * RG.rx, y = RG.y + Math.sin(a) * RG.ry;
    const tan = (Math.atan2(Math.cos(a) * RG.ry, -Math.sin(a) * RG.rx) * 180) / Math.PI + (k % 2 ? 38 : -38);
    const c = Math.cos((tan * Math.PI) / 180), si = Math.sin((tan * Math.PI) / 180), rx = 30, ry = 17;
    return `M${P(x - c * rx, y - si * rx)}A${rx} ${ry} ${f(tan)} 1 0 ${P(x + c * rx, y + si * rx)}A${rx} ${ry} ${f(tan)} 1 0 ${P(x - c * rx, y - si * rx)}Z`;
  };
  let back = '', front = '';
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; if (Math.sin(a) < 0) back += bump(a, k); else front += bump(a, k); }

  const heroSil = [path(back + front), path(eggD)].join('');
  const sil = [bg.sil, heroSil].join('');

  const defs = [
    ...bg.defs,
    E('g', { id: `${ID}-hero` }, heroSil),
    rad(`${ID}-halo`, 0.5, 0.5, 0.5, [[0, '#ffe08a', 0.45], [1, '#ffe08a', 0]]),
    rad(`${ID}-egg`, 0.38, 0.3, 0.8, [[0, '#ff6a6a'], [0.5, '#d8102e'], [1, '#8a0a1a']]),
    rad(`${ID}-bread`, 0.4, 0.3, 0.8, [[0, '#ffd890'], [0.6, '#e8a050'], [1, '#b06a28']]),
    E('clipPath', { id: `${ID}-ec` }, path(eggD)),
  ];

  let sesame = '';
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2 + 0.2; if (Math.sin(a) > 0) { const x = RG.x + Math.cos(a) * RG.rx, y = RG.y + Math.sin(a) * RG.ry; sesame += `M${P(x - 6, y - 6)}l3 -2M${P(x + 6, y - 4)}l3 2M${P(x, y + 4)}l2 3`; } }

  const art = G({},
    '\n<!-- the badge: a Byzantine quatrefoil in deep blue with tiny gold flowers -->\n',
    bg.art,
    sparkle(96, 130, 12, '#ffe08a'), sparkle(420, 120, 10, '#ffe08a'), sparkle(430, 380, 7, '#ffffff'),
    '\n<!-- the bread ring and the egg: an ink outline traced from the silhouette, then the paint -->\n',
    inkUnder(`${ID}-hero`, INK, 11),
    path(back, { fill: u('bread') }),
    path(eggD, { fill: u('egg') }),
    G({ 'clip-path': u('ec') },
      // gold folk patterns: two bands of zigzag and dots, little flowers
      path(`M${EG.x - 100} ${EG.y + 38}l14 -14l14 14l14 -14l14 14l14 -14l14 14l14 -14l14 14l14 -14l14 14l14 -14l14 14l14 -14l14 14`, { fill: 'none', stroke: '#ffd166', 'stroke-width': 4, 'stroke-linejoin': 'round' }),
      path(`M${EG.x - 100} ${EG.y - 78}h200M${EG.x - 100} ${EG.y - 68}h200M${EG.x - 100} ${EG.y + 50}h200`, { fill: 'none', stroke: '#ffd166', 'stroke-width': 3 }),
      path(Array.from({ length: 9 }, (_, k) => `M${EG.x - 88 + k * 22} ${EG.y + 64}a4 4 0 1 0 8 0a4 4 0 1 0 -8 0`).join(''), { fill: '#ffd166' }),
      path(`M${EG.x - 54} ${EG.y + 92}a10 10 0 1 0 20 0a10 10 0 1 0 -20 0zM${EG.x + 34} ${EG.y + 92}a10 10 0 1 0 20 0a10 10 0 1 0 -20 0z`, { fill: '#ffd166' }),
      ellipse(EG.x - 40, EG.y - 74, 18, 30, { fill: '#ffffff', opacity: 0.4, transform: `rotate(-24 ${EG.x - 40} ${EG.y - 74})` })),
    face(EG.x, EG.y - 30, 58, 24, 'happy', { ink: '#3a0a10', cheek: '#ffb0a0' }),
    path(front, { fill: u('bread') }),
    path(sesame, { fill: 'none', stroke: '#fff4dc', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
  );
  return stickerDoc(ID, 'Orthodox Easter sticker: a glossy red Easter egg painted with gold folk patterns and a happy face nestles in a braided tsoureki ring sprinkled with sesame, on a deep-blue Byzantine quatrefoil badge with tiny gold flowers', defs, sil, art);
}
