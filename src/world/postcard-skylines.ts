/**
 * One illustrated skyline per postcard city, drawn into the 560 × 320 picture (ground line y 262)
 * with the kit in postcard-art.ts. Each is INSPIRED by the city's landmarks: simplified, rounded
 * shapes with no logos, signs, flags, lettering, crosses, stars on towers or statues of people.
 *
 * Layout rules every skyline keeps (so the card's moon, stamp and postmark never collide):
 *  - the moon sits at about (88, 66): nothing taller than y 110 left of x 150;
 *  - the stamp covers the top-right corner: nothing above y 140 right of x 420;
 *  - the land or water reaches the bottom edge across the full width.
 */
import { C, E, GY, L, P, PIC_W, R, add, block, blocks, glowAt, ground, group, hills, lamps, lm, mix, palm, roundTree, spruce, swag, water, windows, type Art } from './postcard-art';

type Skyline = (a: Art) => void;

const r1 = (v: number): number => Math.round(v * 10) / 10;

// ───────────────────────────────────────────────────────── shared motifs

/** A slim needle tower with a lookout pod (Auckland, Seoul, Sydney). */
function needle(a: Art, x: number, base: number, top: number, podY: number, color: string, podColor: string, opts: { podW?: number; mast?: number } = {}): void {
  const pw = opts.podW ?? 26;
  P(a, `M${x - 7} ${base}L${x - 4} ${top + 30}H${x + 4}L${x + 7} ${base}Z`, color);
  // The pod: a fat rounded drum with a ring under it.
  R(a, x - pw / 2, podY - 9, pw, 18, podColor, 8);
  R(a, x - pw / 2 + 3, podY - 4, pw - 6, 4, a.pal.win, 2, { opacity: 0.9 });
  R(a, x - pw / 2 - 3, podY + 8, pw + 6, 5, color, 2.5);
  R(a, x - 5, top + 18, 10, 14, color, 3);
  L(a, `M${x} ${top + 20}V${top}`, color, 3);
  C(a, x, top, 2.5, '#ff6b6b');
}

/** A thin minaret with a balcony and a pointed cap (no crescent). */
function minaret(a: Art, x: number, base: number, top: number, color: string, w = 7): void {
  R(a, x - w / 2, top + 14, w, base - top - 12, color, 2);
  R(a, x - w / 2 - 2.5, top + 34, w + 5, 4, color, 2);
  R(a, x - w / 2 - 2, top + 16, w + 4, 3.5, color, 1.5);
  P(a, `M${x - w / 2} ${top + 15}L${x} ${top}L${x + w / 2} ${top + 15}Z`, color);
}

/** A half-dome on a drum. */
function dome(a: Art, cx: number, base: number, rw: number, rh: number, color: string, drum = 0): void {
  if (drum) R(a, cx - rw * 0.92, base - drum, rw * 1.84, drum + 1, color, 2);
  P(a, `M${r1(cx - rw)} ${r1(base - drum)}C${r1(cx - rw)} ${r1(base - drum - rh * 1.3)} ${r1(cx + rw)} ${r1(base - drum - rh * 1.3)} ${r1(cx + rw)} ${r1(base - drum)}Z`, color);
}

/** A sailboat (hull and two sails). */
function sailboat(a: Art, x: number, y: number, s: number, hull: string, sail: string): void {
  P(a, `M${x - 14 * s} ${y}H${x + 14 * s}L${x + 9 * s} ${y + 6 * s}H${x - 9 * s}Z`, hull);
  L(a, `M${x} ${y}V${y - 30 * s}`, hull, 2);
  P(a, `M${x + 2} ${y - 28 * s}L${x + 13 * s} ${y - 2}H${x + 2}Z`, sail);
  P(a, `M${x - 2} ${y - 22 * s}L${x - 10 * s} ${y - 2}H${x - 2}Z`, sail, { opacity: 0.85 });
}

/** A simple car or bus body with wheels, facing left. */
function vehicle(a: Art, x: number, base: number, w: number, h: number, body: string, opts: { roofRack?: boolean; stripe?: string; windows?: number; twoDeck?: boolean } = {}): void {
  R(a, x, base - h - 4, w, h, body, 6);
  const rows = opts.twoDeck ? 2 : 1;
  const n = opts.windows ?? Math.max(2, Math.floor(w / 14));
  for (let row = 0; row < rows; row++) {
    const wy = base - h - 4 + 4 + row * (h / 2);
    const wh = opts.twoDeck ? h / 2 - 9 : h * 0.38;
    for (let i = 0; i < n; i++) {
      const gw = (w - 8) / n;
      R(a, x + 4 + gw * i + 1.5, wy, gw - 3, wh, a.pal.win, 2, { opacity: 0.95 });
    }
  }
  if (opts.stripe) R(a, x, base - 12, w, 3.5, opts.stripe, 1.5);
  if (opts.roofRack) R(a, x + 6, base - h - 8, w - 12, 4, mix(body, '#000000', 0.3), 2);
  C(a, x + w * 0.2, base - 3, 5, '#1b1b2e');
  C(a, x + w * 0.8, base - 3, 5, '#1b1b2e');
  C(a, x + w * 0.2, base - 3, 2, '#9aa0b8');
  C(a, x + w * 0.8, base - 3, 2, '#9aa0b8');
  // Headlight glow at the front (left).
  glowAt(a, `hl${Math.round(x)}`, x - 6, base - 9, 16, 7, '#fff1b8', 0.6);
}

/** Lattice cross-bracing inside a trapezoid (towers). */
function lattice(a: Art, xl0: number, xr0: number, y0: number, xl1: number, xr1: number, y1: number, n: number, color: string, w = 1.6): void {
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 1) / n;
    const ya = y0 + (y1 - y0) * t0;
    const yb = y0 + (y1 - y0) * t1;
    const la = xl0 + (xl1 - xl0) * t0;
    const ra = xr0 + (xr1 - xr0) * t0;
    const lb = xl0 + (xl1 - xl0) * t1;
    const rb = xr0 + (xr1 - xr0) * t1;
    L(a, `M${r1(la)} ${r1(ya)}L${r1(rb)} ${r1(yb)}M${r1(ra)} ${r1(ya)}L${r1(lb)} ${r1(yb)}`, color, w);
  }
}

/** A long low bridge on piers across the picture. */
function longBridge(a: Art, x0: number, x1: number, deckY: number, color: string, piers: number, lights: boolean): void {
  R(a, x0, deckY, x1 - x0, 6, color, 2);
  for (let i = 0; i <= piers; i++) {
    const x = x0 + ((x1 - x0) * i) / piers;
    R(a, x - 2.5, deckY + 4, 5, GY - deckY + 4, color, 1);
  }
  if (lights) {
    for (let x = x0 + 12; x < x1; x += 26) {
      L(a, `M${x} ${deckY}V${deckY - 9}`, color, 2);
      C(a, x, deckY - 10, 2.5, a.pal.win);
    }
  }
}

/** A crenellated wall (Great Wall, Kremlin) along a smooth ridge. */
function crenellated(a: Art, x0: number, x1: number, y: number, h: number, color: string, merlon = 7, swallow = false): void {
  R(a, x0, y, x1 - x0, h, color, 1);
  for (let x = x0; x + merlon <= x1; x += merlon * 2) {
    if (swallow) P(a, `M${x} ${y + 1}V${y - 8}L${x + merlon / 2} ${y - 4}L${x + merlon} ${y - 8}V${y + 1}Z`, color);
    else R(a, x, y - 5, merlon, 6, color, 1);
  }
}

// ───────────────────────────────────────────────────────── the cities

const SKYLINES: Record<string, Skyline> = {
  kiritimati(a) {
    const p = a.pal;
    // Far: the long low arm of the atoll across the lagoon.
    P(a, `M-4 248Q140 238 300 244T564 240V262H-4Z`, p.far);
    for (const [x, h] of [[60, 26], [90, 32], [150, 22], [330, 30], [372, 24], [420, 28], [500, 22]] as const) palm(a, x, 246, h, 4, p.far2);
    water(a, 252);
    // Outrigger canoe on the lagoon: the hull, two booms reaching out to the float behind it.
    const cx = 300;
    const wood = lm(a, '#6b4630');
    E(a, cx - 2, 271, 30, 3.5, wood);
    L(a, `M${cx - 18} 284L${cx - 16} 271M${cx + 14} 283L${cx + 12} 271`, wood, 3);
    P(a, `M${cx - 34} 280Q${cx} 288 ${cx + 36} 278L${cx + 30} 286Q${cx} 293 ${cx - 28} 287Z`, lm(a, '#8a5a3c'));
    E(a, cx, 293, 34, 3, mix(a.pal.water2, '#000000', 0.2), { opacity: 0.5 });
    // Sand bar and huts on short stilts at the water's edge.
    for (const hx of [400, 452]) {
      L(a, `M${hx + 4} 290V304M${hx + 30} 290V304`, lm(a, '#6b4630'), 3);
      R(a, hx, 274, 34, 17, lm(a, '#9a7048'), 2);
      P(a, `M${hx - 6} 277L${hx + 17} 256L${hx + 40} 277Z`, lm(a, '#c99a5a'), { stroke: lm(a, '#c99a5a'), 'stroke-width': 3, 'stroke-linejoin': 'round' });
      R(a, hx + 13, 280, 9, 10, p.win, 1.5);
    }
    P(a, `M-4 296Q120 268 250 292T564 286V324H-4Z`, lm(a, '#e8c98f'));
    P(a, `M-4 306Q140 290 280 304T564 300V324H-4Z`, lm(a, '#d4b07a'));
    palm(a, 60, 300, 150, 40, p.near);
    palm(a, 150, 296, 118, -22, mix(p.near, p.mid, 0.4));
    palm(a, 520, 296, 112, -30, p.near);
    // A frigatebird gliding: long bent wings and a forked tail.
    P(a, `M300 96Q318 84 332 98Q346 84 364 96Q348 92 336 104L340 112L332 106L326 112L328 104Q316 92 300 96Z`, p.near);
  },

  auckland(a) {
    const p = a.pal;
    // The island volcano: a long, low, perfectly even cone.
    P(a, `M-4 252Q60 250 120 214Q160 192 200 214Q260 250 330 252V262H-4Z`, p.far);
    blocks(a, 250, 560, 252, 30, 60, p.mid2, { wMin: 14, wMax: 28 });
    needle(a, 340, 252, 36, 104, lm(a, '#c9d3e8'), lm(a, '#e8eef9'), { podW: 30 });
    block(a, 380, 252, 26, 92, p.mid, { cap: 'ledge' });
    block(a, 296, 252, 22, 78, p.mid);
    water(a, 252, [340, 392]);
    sailboat(a, 120, 284, 1, lm(a, '#e8eef9'), lm(a, '#ffffff'));
    sailboat(a, 210, 300, 0.8, lm(a, '#e8eef9'), lm(a, '#f2e6c8'));
    // Pōhutukawa on the shore: dark crown studded with red flowers.
    P(a, `M420 324Q470 296 564 300V324Z`, p.near);
    R(a, 497, 250, 8, 54, mix(p.near, '#5a3a2a', 0.5), 3);
    for (const [cx, cy, r] of [[500, 238, 30], [470, 250, 22], [532, 250, 22], [484, 222, 18], [520, 222, 18]] as const) C(a, cx, cy, r, mix(p.near, '#2e5a3a', 0.55));
    for (let i = 0; i < 26; i++) C(a, 456 + a.rnd() * 88, 210 + a.rnd() * 56, 2.6, lm(a, '#e8323c'));
  },

  sydney(a) {
    const p = a.pal;
    blocks(a, 230, 560, 236, 24, 64, p.far2, { wMin: 14, wMax: 26 });
    // The tower with a golden lookout, behind the bridge.
    const tx = 338;
    R(a, tx - 5, 80, 10, 160, lm(a, '#b9c2d8'), 2);
    R(a, tx - 14, 90, 28, 20, lm(a, '#e8b04a'), 7);
    R(a, tx - 10, 96, 20, 4, p.win, 2);
    R(a, tx - 3, 66, 6, 24, lm(a, '#b9c2d8'), 2);
    L(a, `M${tx} 66V52`, lm(a, '#b9c2d8'), 2.5);
    // The arch bridge: a steel arch with hangers, a deck, and stone pylons at each end.
    const x0 = 250;
    const x1 = 540;
    const deck = 214;
    const steel = lm(a, '#5a6a8c');
    P(a, `M${x0 + 18} ${deck}Q${(x0 + x1) / 2} 112 ${x1 - 18} ${deck}`, 'none', { stroke: steel, 'stroke-width': 10, 'stroke-linecap': 'round' });
    P(a, `M${x0 + 30} ${deck}Q${(x0 + x1) / 2} 138 ${x1 - 30} ${deck}`, 'none', { stroke: steel, 'stroke-width': 5, 'stroke-linecap': 'round' });
    for (let i = 1; i < 12; i++) {
      const t = i / 12;
      const x = x0 + 18 + (x1 - x0 - 36) * t;
      const y = (1 - t) * (1 - t) * deck + 2 * (1 - t) * t * 112 + t * t * deck;
      L(a, `M${r1(x)} ${r1(y + 4)}V${deck}`, steel, 1.8);
    }
    R(a, x0 - 10, deck - 2, x1 - x0 + 30, 7, steel, 2);
    for (const px of [x0 - 6, x1 - 14]) {
      R(a, px, 176, 22, 250 - 176, lm(a, '#c8b48c'), 3);
      R(a, px + 6, 186, 10, 16, mix(lm(a, '#c8b48c'), '#000000', 0.25), 3);
    }
    for (let x = x0 + 22; x < x1 - 14; x += 22) C(a, x, deck + 1, 2.5, p.win);
    water(a, 246, [180, 395, 470]);
    // The opera house: overlapping white shell-sails on a broad stone podium.
    const base = 252;
    R(a, 40, base - 6, 210, 14, lm(a, '#d8c8a8'), 3);
    const shell = lm(a, '#f4f1ea');
    const shade = lm(a, '#d7dbe6');
    const sails: [number, number, number, boolean][] = [[70, 52, 92, false], [118, 56, 116, true], [164, 48, 92, true], [210, 34, 64, true]];
    for (const [sx, w, h, right] of sails) {
      const tipX = right ? sx + w * 0.35 : sx - w * 0.2;
      P(a, `M${sx - w / 2} ${base - 6}Q${sx - w / 2 + 2} ${base - h * 0.7} ${tipX} ${base - h}Q${sx + w / 2 - 4} ${base - h * 0.55} ${sx + w / 2} ${base - 6}Z`, shell);
      P(a, `M${sx - w / 2 + w * 0.25} ${base - 6}Q${sx - w * 0.05} ${base - h * 0.5} ${tipX} ${base - h}Q${sx + w / 2 - 4} ${base - h * 0.55} ${sx + w / 2} ${base - 6}Z`, shade, { opacity: 0.6 });
      L(a, `M${sx - w / 2 + 6} ${base - 8}Q${sx} ${base - h * 0.45} ${tipX} ${base - h + 6}`, mix(shade, '#8a90a8', 0.4), 1.6, { opacity: 0.6 });
    }
    glowAt(a, 'ophalo', 140, base - 4, 120, 14, p.win, 0.5);
  },

  tokyo(a) {
    const p = a.pal;
    // Mount Fuji, far and hazy, with its snowcap.
    P(a, `M-4 240Q70 232 130 180Q172 140 186 136Q200 134 214 138Q232 146 280 190Q330 234 420 242V262H-4Z`, p.far);
    P(a, `M152 162Q172 142 186 136Q200 134 214 138Q232 146 250 164Q236 158 226 166Q214 156 202 168Q190 156 178 166Q166 158 152 162Z`, mix(p.snow, p.far, 0.25));
    blocks(a, 0, 560, 262, 26, 70, p.mid2, { wMin: 16, wMax: 32 });
    // The lattice tower: splayed legs, two lookout decks, a slim mast.
    const tx = 330;
    const red = lm(a, '#ff5a36');
    const white = lm(a, '#f4ece4');
    P(a, `M${tx - 44} 262L${tx - 10} 120H${tx + 10}L${tx + 44} 262H${tx + 30}Q${tx} 214 ${tx - 30} 262Z`, red);
    lattice(a, tx - 38, tx + 38, 252, tx - 11, tx + 11, 124, 7, mix(red, '#000000', 0.25), 1.4);
    R(a, tx - 22, 180, 44, 12, white, 3);
    R(a, tx - 18, 183, 36, 4, p.win, 2);
    R(a, tx - 11, 150, 22, 6, white, 2);
    P(a, `M${tx - 10} 120L${tx - 6} 76H${tx + 6}L${tx + 10} 120Z`, red);
    R(a, tx - 13, 104, 26, 9, white, 3);
    R(a, tx - 4, 52, 8, 26, white, 2);
    L(a, `M${tx} 54V34`, red, 3);
    C(a, tx, 33, 2.5, '#ff6b6b');
    // Five-storey pagoda: storeys narrowing upward, each under a wide tiled roof with upswept eaves.
    const px = 96;
    const wood = lm(a, '#8c3a2e');
    const roof = lm(a, '#3e4262');
    const roofTop = mix(roof, '#ffffff', 0.18);
    for (let i = 0; i < 5; i++) {
      const by = 262 - i * 22;
      const bw = 30 - i * 3.5;
      R(a, px - bw / 2, by - 20, bw, 22, wood, 2);
      R(a, px - bw / 2 + 5, by - 14, bw - 10, 6, p.win, 2, { opacity: 0.85 });
      const rw = bw / 2 + 14;
      const ry = by - 20;
      P(a, `M${r1(px - rw - 5)} ${ry - 7}Q${r1(px - rw + 4)} ${ry + 1} ${r1(px - bw / 2 - 2)} ${ry}H${r1(px + bw / 2 + 2)}Q${r1(px + rw - 4)} ${ry + 1} ${r1(px + rw + 5)} ${ry - 7}Q${r1(px + rw - 6)} ${ry - 8} ${r1(px + bw / 2 - 2)} ${ry - 13}H${r1(px - bw / 2 + 2)}Q${r1(px - rw + 6)} ${ry - 8} ${r1(px - rw - 5)} ${ry - 7}Z`, roof);
      L(a, `M${r1(px - bw / 2 + 2)} ${ry - 12}H${r1(px + bw / 2 - 2)}`, roofTop, 2.5);
    }
    const gold = lm(a, '#d9a441');
    R(a, px - 2.5, 128, 5, 30, gold, 2);
    for (let i = 0; i < 4; i++) R(a, px - 5, 134 + i * 5, 10, 2.5, gold, 1);
    // The river in front, with the tower's lights shimmering in it.
    water(a, 266, [330, 96]);
    P(a, `M-4 262H564V268H-4Z`, mix(p.near, p.mid, 0.3));
  },

  seoul(a) {
    const p = a.pal;
    // The wooded mountain with the slim tower on top.
    hills(a, [[220, 262], [270, 220], [320, 184], [356, 172], [410, 186], [480, 226], [564, 248]], mix(p.far, '#2e4a5a', 0.35));
    needle(a, 356, 176, 56, 98, lm(a, '#d8deec'), lm(a, '#eef1f8'), { podW: 24 });
    blocks(a, 250, 560, 262, 30, 76, p.mid2, { wMin: 14, wMax: 28 });
    blocks(a, 0, 120, 262, 24, 60, p.mid2, { wMin: 14, wMax: 28 });
    // A palace gate: stone base with an arched opening, two sweeping tiled roofs.
    const gx = 160;
    const stone = lm(a, '#a49e94');
    R(a, gx - 70, 222, 140, 40, stone, 3);
    P(a, `M${gx - 16} 262V242Q${gx} 226 ${gx + 16} 242V262Z`, mix(p.near, '#000000', 0.2));
    glowAt(a, 'gate', gx, 250, 26, 14, p.win, 0.45);
    const wood = lm(a, '#9a3a2e');
    R(a, gx - 52, 196, 104, 26, wood, 2);
    windows(a, gx - 46, 200, 92, 16, 6, 1, { size: 8, tall: 9 });
    const tile = lm(a, '#3a4450');
    P(a, `M${gx - 84} 196Q${gx - 70} 192 ${gx - 60} 184H${gx + 60}Q${gx + 70} 192 ${gx + 84} 196Q${gx + 74} 182 ${gx + 66} 176H${gx - 66}Q${gx - 74} 182 ${gx - 84} 196Z`, tile);
    R(a, gx - 40, 160, 80, 18, wood, 2);
    P(a, `M${gx - 66} 162Q${gx - 54} 158 ${gx - 46} 150H${gx + 46}Q${gx + 54} 158 ${gx + 66} 162Q${gx + 58} 146 ${gx + 50} 140Q${gx} 134 ${gx - 50} 140Q${gx - 58} 146 ${gx - 66} 162Z`, tile);
    ground(a, 262, mix(p.near, p.mid, 0.45));
    water(a, 276, [356, 470]);
    P(a, `M-4 276H564V280H-4Z`, mix(p.near, p.mid, 0.3));
  },

  beijing(a) {
    const p = a.pal;
    // The Great Wall on far hills, with watchtowers.
    hills(a, [[-4, 214], [60, 196], [130, 206], [200, 188], [280, 204], [360, 192], [440, 210], [564, 198]], p.far);
    // The wall follows a smooth curve through the midpoints of these points; watchtowers stand on it.
    const wall = mix(p.far, '#c8b8a0', 0.25);
    const wp: [number, number][] = [[-4, 206], [60, 190], [130, 198], [200, 184], [280, 196], [360, 186], [440, 200], [564, 190]];
    const mids = wp.slice(1).map((q, i): [number, number] => [(wp[i]![0] + q[0]) / 2, (wp[i]![1] + q[1]) / 2]);
    let wd = `M${wp[0]![0]} ${wp[0]![1]}`;
    for (let i = 1; i < wp.length - 1; i++) wd += `Q${wp[i]![0]} ${wp[i]![1]} ${r1(mids[i]![0])} ${r1(mids[i]![1])}`;
    wd += `L${wp[wp.length - 1]![0]} ${wp[wp.length - 1]![1]}`;
    L(a, wd, wall, 5);
    for (const i of [1, 3, 5, 6]) {
      const [x, y] = mids[i]!;
      R(a, x - 7, y - 12, 14, 16, wall, 1.5);
      R(a, x - 9, y - 15, 18, 4, wall, 1);
    }
    blocks(a, 400, 560, 262, 40, 108, p.mid2, { wMin: 16, wMax: 30 });
    blocks(a, 0, 150, 262, 30, 70, p.mid2, { wMin: 16, wMax: 30 });
    // The round temple hall: white marble terraces, red walls, three stacked blue roofs.
    const tx = 270;
    const marble = lm(a, '#e9e4dc');
    R(a, tx - 104, 248, 208, 14, marble, 3);
    R(a, tx - 88, 236, 176, 13, marble, 3);
    R(a, tx - 72, 225, 144, 12, marble, 3);
    for (let x = tx - 100; x <= tx + 100; x += 10) R(a, x, 244, 3, 5, mix(marble, '#8a8070', 0.4), 1);
    const red = lm(a, '#b8322a');
    const blue = lm(a, '#2f5aa8');
    const gold = lm(a, '#e2b04a');
    const tiers: [number, number, number][] = [[200, 58, 22], [154, 46, 18], [114, 34, 14]];
    for (const [y, w, h] of tiers) {
      R(a, tx - w * 0.7, y, w * 1.4, h + 6, red, 2);
      windows(a, tx - w * 0.6, y + 4, w * 1.2, h - 2, 5, 1, { size: 4, tall: h - 8 });
      P(a, `M${tx - w - 8} ${y + 2}Q${tx - w * 0.5} ${y - h * 0.9} ${tx} ${y - h * 1.5}Q${tx + w * 0.5} ${y - h * 0.9} ${tx + w + 8} ${y + 2}Q${tx} ${y - 4} ${tx - w - 8} ${y + 2}Z`, blue);
      L(a, `M${tx - w - 6} ${y + 1}Q${tx} ${y - 5} ${tx + w + 6} ${y + 1}`, gold, 2.5);
    }
    P(a, `M${tx - 4} 94Q${tx} 72 ${tx + 4} 94Z`, gold);
    C(a, tx, 82, 5, gold);
    ground(a, 262, p.near);
    for (let x = 10; x < 560; x += 64) roundTree(a, x, 300, 12, mix(p.near, '#2e4a3a', 0.45));
  },

  manila(a) {
    const p = a.pal;
    blocks(a, 0, 560, 236, 20, 70, p.far2, { wMin: 14, wMax: 26 });
    water(a, 236, [80, 470]);
    // The promenade.
    ground(a, 262, mix(p.near, p.mid, 0.25));
    R(a, -4, 262, 568, 5, mix(p.mid, '#ffffff', 0.15), 0);
    // An old stone church front with two bell towers (domed, no cross).
    const cx = 130;
    const stone = lm(a, '#b9a888');
    R(a, cx - 40, 168, 80, 96, stone, 3);
    P(a, `M${cx - 40} 170Q${cx} 130 ${cx + 40} 170Z`, stone);
    for (const bx of [cx - 56, cx + 40]) {
      R(a, bx, 140, 16, 124, stone, 2);
      R(a, bx + 3, 152, 10, 14, mix(p.near, '#000000', 0.2), 5);
      dome(a, bx + 8, 140, 10, 12, lm(a, '#8a7a6a'));
    }
    P(a, `M${cx - 14} 264V226Q${cx} 210 ${cx + 14} 226V264Z`, mix(p.near, '#000000', 0.25));
    glowAt(a, 'door', cx, 252, 30, 18, p.win, 0.5);
    C(a, cx, 186, 11, p.win, { opacity: 0.85 });
    // Palms with a string of parol star lanterns hung between their trunks.
    palm(a, 300, 266, 150, -14, p.near);
    palm(a, 416, 266, 104, 8, p.near);
    swag(a, 296, 172, 422, 180, 16, mix(p.near, '#000000', 0.2), 3, (x, y) => {
      L(a, `M${r1(x)} ${r1(y)}V${r1(y + 6)}`, mix(p.near, '#000000', 0.2), 2.5);
      const s = 11;
      const cy = y + 6 + s;
      let d = '';
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 === 0 ? s : s * 0.48;
        d += `${i ? 'L' : 'M'}${r1(x + Math.cos(ang) * rr)} ${r1(cy + Math.sin(ang) * rr)}`;
      }
      glowAt(a, `parol${Math.round(x)}`, x, cy, 22, 22, '#ffcf5a', 0.5);
      P(a, `${d}Z`, lm(a, x < 340 ? '#ff4d6d' : x < 380 ? '#ffd166' : '#5ad1ff'), { stroke: '#fff4d6', 'stroke-width': 1.5, 'stroke-linejoin': 'round' });
      L(a, `M${r1(x - 3)} ${r1(cy + s * 0.5)}L${r1(x - 5)} ${r1(cy + s + 8)}M${r1(x + 3)} ${r1(cy + s * 0.5)}L${r1(x + 5)} ${r1(cy + s + 8)}`, '#fff4d6', 2.5);
    });
    // A jeepney: long, bright, with a roof rack.
    vehicle(a, 330, 302, 120, 30, lm(a, '#e8a53a'), { roofRack: true, stripe: lm(a, '#d6336c'), windows: 7 });
    palm(a, 520, 324, 110, -10, p.near);
  },

  jakarta(a) {
    const p = a.pal;
    blocks(a, 330, 560, 262, 40, 110, p.mid2, { wMin: 16, wMax: 30 });
    // A great dome with a slim tower beside it.
    const white = lm(a, '#e6e9f0');
    R(a, 30, 214, 130, 48, white, 3);
    windows(a, 38, 222, 114, 30, 8, 2, { size: 6 });
    dome(a, 95, 214, 54, 34, lm(a, '#cdd3e0'), 6);
    minaret(a, 182, 262, 120, white, 9);
    // The tall monument: a wide stepped platform, a tapering shaft and a golden flame.
    const mx = 290;
    const stone = lm(a, '#efece6');
    R(a, mx - 80, 246, 160, 16, stone, 3);
    P(a, `M${mx - 60} 248L${mx - 40} 226H${mx + 40}L${mx + 60} 248Z`, stone);
    P(a, `M${mx - 11} 228L${mx - 5} 84H${mx + 5}L${mx + 11} 228Z`, stone);
    P(a, `M${mx - 5} 228L${mx - 2} 84H${mx + 5}L${mx + 11} 228Z`, mix(stone, '#9aa0b8', 0.3));
    R(a, mx - 12, 80, 24, 7, lm(a, '#c9c4bc'), 2);
    glowAt(a, 'flame', mx, 64, 34, 34, '#ffcf5a', 0.6);
    P(a, `M${mx - 10} 81Q${mx - 12} 64 ${mx - 2} 54Q${mx - 2} 62 ${mx + 2} 60Q${mx + 1} 50 ${mx + 6} 44Q${mx + 14} 60 ${mx + 10} 81Z`, lm(a, '#ffc23a'));
    ground(a, 262, p.near);
    R(a, -4, 276, 568, 22, mix(p.near, p.mid, 0.3));
    lamps(a, [40, 220, 360, 500], 276);
    palm(a, 120, 312, 120, 10, p.near);
    palm(a, 440, 312, 104, -12, p.near);
    palm(a, 540, 316, 90, 6, p.near);
  },

  bangkok(a) {
    const p = a.pal;
    blocks(a, 360, 560, 236, 40, 86, p.far2, { wMin: 16, wMax: 28 });
    R(a, 340, 234, 228, 20, mix(p.far2, p.near, 0.35));
    // The patterned temple spire (prang) with two smaller ones.
    const stone = lm(a, '#d8d2c6');
    const prang = (x: number, base: number, h: number, w: number): void => {
      const tiers = 7;
      for (let i = 0; i < tiers; i++) {
        const t = i / tiers;
        const bw = w * (1 - t * 0.78);
        const by = base - h * t * 0.86;
        P(a, `M${r1(x - bw / 2)} ${r1(by)}Q${r1(x - bw / 2 - 2)} ${r1(by - h * 0.07)} ${r1(x - bw * 0.42)} ${r1(by - h * 0.12)}H${r1(x + bw * 0.42)}Q${r1(x + bw / 2 + 2)} ${r1(by - h * 0.07)} ${r1(x + bw / 2)} ${r1(by)}Z`, i % 2 ? stone : mix(stone, '#b8a890', 0.35));
        for (let k = -2; k <= 2; k++) C(a, x + k * bw * 0.17, by - h * 0.06, 1.8, lm(a, k % 2 ? '#e86a5a' : '#5aa0d8'), { opacity: 0.85 });
      }
      L(a, `M${x} ${base - h * 0.88}V${base - h}`, lm(a, '#e2b04a'), 3);
    };
    prang(120, 246, 90, 40);
    prang(300, 246, 90, 40);
    prang(210, 246, 196, 74);
    R(a, 70, 244, 280, 10, stone, 2);
    water(a, 252, [210, 120]);
    // Golden temple roofs across the river.
    const gold = lm(a, '#d9a441');
    const red = lm(a, '#a8322a');
    R(a, 380, 246, 104, 9, stone, 2);
    R(a, 386, 214, 92, 34, red, 2);
    windows(a, 392, 222, 80, 18, 5, 1, { size: 7, tall: 12 });
    P(a, `M376 216L432 172L488 216Z`, gold);
    P(a, `M390 200L432 160L474 200Z`, mix(gold, red, 0.35));
    L(a, `M376 216Q370 210 372 204M488 216Q494 210 492 204M432 162V154`, gold, 3);
    // A long-tail boat with its upswept bow.
    P(a, `M380 288H500Q514 286 520 270Q512 284 504 292H392Z`, lm(a, '#7a4a32'));
    L(a, `M392 290L370 282`, lm(a, '#4a3a2e'), 2.5);
    R(a, 420, 277, 50, 13, lm(a, '#d95a3a'), 4);
    L(a, `M425 278V268M465 278V268M420 268H470`, lm(a, '#4a3a2e'), 2.5);
  },

  kolkata(a) {
    const p = a.pal;
    // The white memorial hall with a great dome and corner cupolas.
    const marble = lm(a, '#eeeae4');
    R(a, 20, 206, 170, 40, marble, 3);
    windows(a, 28, 214, 154, 24, 9, 1, { size: 6, tall: 14 });
    dome(a, 105, 206, 38, 30, marble, 12);
    C(a, 105, 160, 4, lm(a, '#e2b04a'));
    L(a, `M105 162V150`, lm(a, '#e2b04a'), 2.5);
    for (const cx of [34, 176]) { R(a, cx - 9, 188, 18, 18, marble, 2); dome(a, cx, 188, 10, 9, marble); }
    // The cantilever steel bridge: two tall truss pylons and a deep truss across.
    const steel = lm(a, '#6a7a9a');
    const deck = 232;
    const xa = 262;
    const xb = 500;
    for (const x of [xa, xb]) {
      P(a, `M${x - 16} ${deck + 4}L${x - 6} 132H${x + 6}L${x + 16} ${deck + 4}Z`, 'none', { stroke: steel, 'stroke-width': 4, 'stroke-linejoin': 'round' });
      lattice(a, x - 14, x + 14, deck, x - 7, x + 7, 136, 6, steel, 2);
    }
    // Upper chords from pylon tops to the middle and to the shores.
    L(a, `M210 ${deck}L${xa - 6} 136M${xa + 6} 136Q381 192 ${xb - 6} 136M${xb + 6} 136L564 ${deck - 20}`, steel, 4);
    L(a, `M210 ${deck}H564`, steel, 5);
    for (let x = 220; x < 560; x += 14) {
      const t = x < xa ? (x - 210) / (xa - 210) : x < xb ? 0 : 1;
      const top = x < xa ? deck - t * 96 : x < xb ? 136 + Math.sin(((x - xa) / (xb - xa)) * Math.PI) * 52 + 4 : 136 + ((x - xb) / 64) * 76;
      L(a, `M${x} ${deck}L${x + 7} ${r1(Math.min(deck - 4, top + 4))}`, steel, 2);
    }
    for (let x = 220; x < 560; x += 24) C(a, x, deck + 3, 2, p.win);
    water(a, 246, [380, 520]);
    // Stone piers under the pylons and the abutment at the shore end; the hall's terrace.
    const pier = mix(lm(a, '#8a8478'), p.near, 0.3);
    for (const x of [xa, xb]) R(a, x - 18, deck + 4, 36, 252 - deck, pier, 3);
    R(a, 202, deck - 2, 18, 254 - deck, pier, 2);
    R(a, 12, 242, 190, 10, mix(marble, '#8a8070', 0.4), 2);
    E(a, 107, 254, 100, 4, '#000000', { opacity: 0.25 });
    // Embankment road with a yellow taxi.
    P(a, `M-4 284H564V324H-4Z`, p.near);
    R(a, -4, 284, 568, 4, mix(p.near, '#ffffff', 0.18));
    vehicle(a, 60, 312, 64, 22, lm(a, '#f2c230'), { windows: 3 });
  },

  dubai(a) {
    const p = a.pal;
    // Golden dunes far away on the left.
    P(a, `M-4 236Q50 214 110 230Q160 244 210 228Q250 216 300 240V262H-4Z`, mix(p.far, '#c8a060', 0.3));
    blocks(a, 150, 420, 262, 40, 110, p.mid2, { wMin: 14, wMax: 26 });
    // The tallest tower: a needle that steps in as it rises.
    const tx = 280;
    const glass = lm(a, '#c9d4e8');
    const steps: [number, number][] = [[262, 22], [212, 18], [168, 14], [126, 10.5], [92, 7.5], [64, 5]];
    for (let i = 0; i < steps.length; i++) {
      const [y, hw] = steps[i]!;
      const top = steps[i + 1]?.[0] ?? 40;
      P(a, `M${tx - hw} ${y}L${tx - hw * 0.86} ${top}H${tx + hw * 0.86}L${tx + hw} ${y}Z`, glass);
      L(a, `M${tx} ${y}V${top}`, mix(glass, '#7a86a8', 0.35), 1.6);
    }
    P(a, `M${tx - 3} 42L${tx} 16L${tx + 3} 42Z`, glass);
    for (let y = 70; y < 258; y += 9) C(a, tx - 2, y, 1.4, p.win, { opacity: 0.9 });
    water(a, 262, [280, 470]);
    // The sail-shaped hotel on its own island: a tall mast-like spine and a billowing sail.
    const sx = 466;
    const hotel = lm(a, '#f2f4f8');
    R(a, sx - 38, 254, 78, 9, lm(a, '#d8d2c6'), 3);
    glowAt(a, 'sail', sx + 4, 224, 44, 40, '#8ab4ff', 0.28);
    P(a, `M${sx - 24} 256V178Q${sx + 28} 184 ${sx + 34} 256Z`, hotel);
    P(a, `M${sx - 24} 256Q${sx + 4} 226 ${sx + 34} 256Z`, lm(a, '#d6dbe8'));
    for (let i = 1; i < 5; i++) L(a, `M${sx - 24} ${178 + i * 15}Q${sx + 4 + i * 4} ${184 + i * 15} ${r1(sx + 10 + i * 5)} ${r1(196 + i * 12)}`, lm(a, '#c8d0e2'), 2, { opacity: 0.8 });
    R(a, sx - 30, 168, 6, 90, lm(a, '#c8cdd8'), 3);
    // A wooden dhow: curved hull, a mast, and a lateen sail hanging from its slanted yard.
    const wood = lm(a, '#8a5a3c');
    P(a, `M60 290H160Q172 288 178 276Q170 292 158 298H72Q60 296 54 286Z`, wood);
    L(a, `M110 291V236`, lm(a, '#5a3e2c'), 3.5);
    L(a, `M74 262L150 222`, lm(a, '#5a3e2c'), 3);
    P(a, `M78 262L148 225Q140 260 118 286L110 286Q96 272 78 262Z`, lm(a, '#efe2c4'));
  },

  nairobi(a) {
    const p = a.pal;
    blocks(a, 160, 520, 236, 40, 100, p.mid2, { wMin: 16, wMax: 28 });
    // The round tower with a flat saucer cap, and the cone-roofed hall beside it.
    const tx = 330;
    const terracotta = lm(a, '#c86a4a');
    R(a, tx - 17, 86, 34, 152, terracotta, 4);
    for (let y = 96; y < 230; y += 10) R(a, tx - 13, y, 26, 4, p.win, 2, { opacity: 0.85 });
    R(a, tx - 30, 76, 60, 10, lm(a, '#d8d2c6'), 5);
    R(a, tx - 24, 70, 48, 7, lm(a, '#d8d2c6'), 3.5);
    L(a, `M${tx} 70V58`, lm(a, '#d8d2c6'), 2.5);
    P(a, `M370 238L398 186L426 238Z`, terracotta);
    R(a, 366, 234, 64, 6, terracotta, 2);
    // The park in front: grass, flat-topped acacias and a giraffe.
    const grass = mix(p.near, '#3e5a2a', 0.42);
    hills(a, [[-4, 244], [120, 236], [260, 246], [400, 238], [564, 244]], grass);
    const acacia = (x: number, base: number, h: number, w: number): void => {
      L(a, `M${x} ${base}Q${x + 2} ${base - h * 0.5} ${x - 6} ${base - h + 6}M${x + 1} ${base - h * 0.45}Q${x + 10} ${base - h * 0.7} ${x + 14} ${base - h + 6}`, p.near, 4);
      P(a, `M${x - w / 2} ${base - h + 6}Q${x - w / 2 + 4} ${base - h - 8} ${x} ${base - h - 10}Q${x + w / 2 - 4} ${base - h - 8} ${x + w / 2} ${base - h + 6}Q${x} ${base - h + 2} ${x - w / 2} ${base - h + 6}Z`, p.near);
    };
    acacia(470, 270, 80, 110);
    acacia(40, 262, 54, 70);
    ground(a, 286, mix(grass, p.near, 0.35));
    // The giraffe, facing right: patched coat, long neck, ossicones, a tufted tail.
    const gx = 170;
    const gb = 300;
    const coat = lm(a, '#d99a52');
    const patch = lm(a, '#8f5328');
    const hoof = mix(patch, '#000000', 0.4);
    E(a, gx, gb + 1, 40, 4, '#000000', { opacity: 0.3 });
    for (const lx of [gx - 22, gx - 13, gx + 15, gx + 24]) {
      L(a, `M${lx} ${gb - 46}V${gb - 2}`, lx < gx ? mix(coat, patch, 0.25) : coat, 5);
      L(a, `M${lx} ${gb - 4}V${gb}`, hoof, 5.5);
    }
    L(a, `M${gx - 29} ${gb - 62}Q${gx - 38} ${gb - 50} ${gx - 35} ${gb - 34}`, coat, 2.5);
    E(a, gx - 35, gb - 32, 3, 5, patch);
    P(a, `M${gx - 30} ${gb - 50}Q${gx - 33} ${gb - 72} ${gx - 8} ${gb - 74}L${gx + 22} ${gb - 70}Q${gx + 33} ${gb - 64} ${gx + 28} ${gb - 48}Q${gx} ${gb - 41} ${gx - 30} ${gb - 50}Z`, coat);
    P(a, `M${gx + 12} ${gb - 66}L${gx + 34} ${gb - 124}L${gx + 46} ${gb - 120}L${gx + 30} ${gb - 58}Z`, coat, { 'stroke-linejoin': 'round', stroke: coat, 'stroke-width': 2 });
    L(a, `M${gx + 12} ${gb - 68}L${gx + 33} ${gb - 122}`, patch, 3);
    P(a, `M${gx + 33} ${gb - 126}Q${gx + 42} ${gb - 137} ${gx + 60} ${gb - 126}Q${gx + 64} ${gb - 119} ${gx + 57} ${gb - 117}L${gx + 41} ${gb - 115}Q${gx + 31} ${gb - 117} ${gx + 33} ${gb - 126}Z`, coat);
    L(a, `M${gx + 38} ${gb - 130}L${gx + 36} ${gb - 139}M${gx + 44} ${gb - 131}L${gx + 44} ${gb - 140}`, patch, 2.5);
    C(a, gx + 36, gb - 140, 2.5, patch);
    C(a, gx + 44, gb - 141, 2.5, patch);
    E(a, gx + 33, gb - 129, 4.5, 2.5, coat, { transform: `rotate(-20 ${gx + 33} ${gb - 129})` });
    C(a, gx + 47, gb - 126, 1.8, '#2a1a12');
    for (const [x, y, w, h] of [[-20, -66, 11, 8], [-6, -66, 10, 9], [8, -64, 9, 8], [-14, -55, 10, 7], [2, -54, 11, 7], [16, -56, 7, 7], [22, -80, 6, 7], [28, -98, 5, 6], [34, -112, 4, 5]] as const) {
      R(a, gx + x, gb + y, w, h, patch, 2.5);
    }
  },

  moscow(a) {
    const p = a.pal;
    blocks(a, 420, 560, 236, 30, 70, p.far2, { wMin: 14, wMax: 26 });
    // The fortress wall with swallow-tail merlons and a pointed gate tower (no star).
    const brick = lm(a, '#a8352e');
    crenellated(a, -4, 150, 226, 40, brick, 8, true);
    R(a, 40, 186, 40, 80, brick, 2);
    R(a, 36, 182, 48, 8, brick, 2);
    R(a, 46, 156, 28, 28, brick, 2);
    C(a, 60, 170, 9, lm(a, '#efe6d0'));
    L(a, `M60 170V164M60 170L64 172`, '#3a2a2a', 2);
    P(a, `M44 158L60 130L76 158Z`, lm(a, '#3e6b4a'), { stroke: lm(a, '#3e6b4a'), 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    L(a, `M60 130V122`, lm(a, '#e2b04a'), 2.5);
    P(a, `M52 266V246Q60 236 68 246V266Z`, mix(p.near, '#000000', 0.2));
    // The cathedral: a red body, a tall tent spire and bright striped onion domes.
    const body = lm(a, '#c0473a');
    R(a, 190, 196, 230, 70, body, 3);
    windows(a, 198, 206, 214, 20, 10, 1, { size: 6, tall: 12 });
    P(a, `M286 198L300 76L314 198Z`, lm(a, '#e6dccc'));
    R(a, 284, 196, 32, 10, body, 2);
    const onion = (x: number, base: number, w: number, h: number, c1: string, c2: string, drumH: number): void => {
      R(a, x - w * 0.36, base - drumH, w * 0.72, drumH + 2, body, 2);
      R(a, x - w * 0.24, base - drumH + 6, w * 0.48, 6, p.win, 2, { opacity: 0.85 });
      const top = base - drumH;
      const d = `M${r1(x - w * 0.36)} ${top}Q${r1(x - w * 0.62)} ${r1(top - h * 0.42)} ${r1(x - w * 0.18)} ${r1(top - h * 0.78)}Q${x} ${r1(top - h * 0.9)} ${x} ${r1(top - h)}Q${x} ${r1(top - h * 0.9)} ${r1(x + w * 0.18)} ${r1(top - h * 0.78)}Q${r1(x + w * 0.62)} ${r1(top - h * 0.42)} ${r1(x + w * 0.36)} ${top}Z`;
      P(a, d, lm(a, c1));
      for (let i = -1; i <= 1; i++) L(a, `M${r1(x + i * w * 0.2)} ${top}Q${r1(x + i * w * 0.32)} ${r1(top - h * 0.45)} ${x} ${r1(top - h * 0.92)}`, lm(a, c2), 3.5);
      L(a, `M${x} ${r1(top - h)}V${r1(top - h - 7)}`, lm(a, '#e2b04a'), 2.5);
      if (a.snowy) P(a, `M${r1(x - w * 0.28)} ${r1(top - h * 0.62)}Q${x} ${r1(top - h * 0.78)} ${r1(x + w * 0.28)} ${r1(top - h * 0.62)}Q${x} ${r1(top - h * 0.7)} ${r1(x - w * 0.28)} ${r1(top - h * 0.62)}Z`, p.snow, { opacity: 0.9 });
    };
    onion(300, 82, 22, 22, '#e2b04a', '#c8902a', 0);
    onion(226, 196, 34, 38, '#2f8a5a', '#f2e6c8', 40);
    onion(374, 196, 34, 38, '#2f6ad8', '#f2f4f8', 40);
    onion(262, 196, 30, 34, '#d8402e', '#f2e6c8', 70);
    onion(338, 196, 30, 34, '#e8a53a', '#2f8a5a', 70);
    ground(a, 262);
    spruce(a, 470, 300, 50, mix(p.near, '#1f3a2e', 0.5));
    spruce(a, 510, 304, 40, mix(p.near, '#1f3a2e', 0.5));
    spruce(a, 160, 302, 44, mix(p.near, '#1f3a2e', 0.5));
  },

  istanbul(a) {
    const p = a.pal;
    blocks(a, 0, 560, 230, 14, 36, p.far2, { wMin: 12, wMax: 22 });
    // The great mosque: a cascade of domes and half-domes, four slim minarets.
    const stone = lm(a, '#c9ccd8');
    const lead = lm(a, '#8a92b0');
    const cx = 250;
    R(a, cx - 110, 214, 220, 40, stone, 3);
    windows(a, cx - 102, 222, 204, 24, 12, 1, { size: 6, tall: 12 });
    for (const dx of [-86, 86]) dome(a, cx + dx, 214, 18, 12, lead, 4);
    for (const dx of [-56, 56]) dome(a, cx + dx, 208, 28, 18, lead, 10);
    R(a, cx - 44, 180, 88, 36, mix(stone, lead, 0.35), 3);
    windows(a, cx - 36, 190, 72, 14, 6, 1, { size: 5, tall: 9 });
    dome(a, cx, 182, 50, 36, lead, 14);
    L(a, `M${cx} 136V124`, lm(a, '#e2b04a'), 2.5);
    for (const dx of [-122, -96, 96, 122]) minaret(a, cx + dx, 254, dx === -122 || dx === 122 ? 130 : 112, stone, 8);
    // The round stone tower with a cone roof, across the water.
    const gx = 470;
    const tower = lm(a, '#c8b89a');
    R(a, gx - 16, 190, 32, 54, tower, 3);
    windows(a, gx - 12, 198, 24, 36, 2, 3, { size: 5, tall: 8 });
    R(a, gx - 19, 184, 38, 8, tower, 3);
    P(a, `M${gx - 18} 186L${gx} 160L${gx + 18} 186Z`, lm(a, '#5a6a8a'), { stroke: lm(a, '#5a6a8a'), 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    blocks(a, 400, 560, 244, 14, 34, p.mid, { wMin: 14, wMax: 22 });
    water(a, 254, [250, 470]);
    // A ferry crossing the strait.
    R(a, 300, 278, 110, 12, lm(a, '#f2f4f8'), 4);
    R(a, 316, 266, 74, 13, lm(a, '#e2e6ee'), 4);
    windows(a, 320, 268, 66, 8, 7, 1, { size: 6, tall: 5 });
    R(a, 346, 258, 10, 10, lm(a, '#3a3a50'), 2);
    P(a, `M296 288H414L404 296H306Z`, lm(a, '#2a3a6a'));
  },

  cairo(a) {
    const p = a.pal;
    // The pyramids on the desert's edge: a lit face and a shadow face.
    const sand = mix(p.far, '#c8a060', 0.35);
    const pyramid = (x: number, base: number, h: number): void => {
      P(a, `M${x - h * 0.95} ${base}L${x} ${base - h}L${x + h * 0.95} ${base}Z`, sand);
      P(a, `M${x} ${base - h}L${x + h * 0.95} ${base}H${x + h * 0.15}Z`, mix(sand, '#000000', 0.18));
    };
    pyramid(70, 236, 62);
    pyramid(150, 236, 46);
    pyramid(200, 236, 28);
    R(a, -4, 234, 568, 6, sand);
    blocks(a, 230, 560, 252, 26, 60, p.mid2, { wMin: 14, wMax: 26 });
    // Domes and minarets on a hill.
    const stone = lm(a, '#d8c8a8');
    R(a, 380, 206, 110, 46, stone, 3);
    windows(a, 388, 214, 94, 26, 6, 1, { size: 6, tall: 12 });
    dome(a, 435, 206, 30, 22, lm(a, '#a8a8b8'), 8);
    for (const mx of [392, 478]) minaret(a, mx, 252, 150, stone, 7);
    // The lotus tower: a slim lattice shaft that opens into a crown.
    const tx = 300;
    const tc = lm(a, '#e2c890');
    P(a, `M${tx - 10} 252L${tx - 8} 100H${tx + 8}L${tx + 10} 252Z`, tc);
    for (let y = 108; y < 248; y += 12) L(a, `M${tx - 8} ${y}L${tx + 8} ${y + 12}M${tx + 8} ${y}L${tx - 8} ${y + 12}`, mix(tc, '#6a5a3a', 0.45), 2);
    P(a, `M${tx - 8} 102Q${tx - 22} 84 ${tx - 18} 66H${tx + 18}Q${tx + 22} 84 ${tx + 8} 102Z`, tc);
    R(a, tx - 20, 64, 40, 6, tc, 3);
    R(a, tx - 14, 80, 28, 6, p.win, 3);
    L(a, `M${tx} 64V48`, tc, 2.5);
    water(a, 262, [300, 435]);
    // A felucca with its big slanted sail.
    P(a, `M90 292H170Q178 290 182 282Q176 296 166 298H96Z`, lm(a, '#7a5a3a'));
    // The sail hangs from a long yard that crosses the short mast near its top.
    L(a, `M130 293V244`, lm(a, '#5a3e2c'), 3.5);
    L(a, `M104 284L166 214`, lm(a, '#5a3e2c'), 3);
    P(a, `M106 282L164 217Q160 258 134 288H112Z`, lm(a, '#f2ead8'));
    // A grassy bank on the near shore for the palm.
    P(a, `M430 324Q462 300 564 296V324Z`, mix(p.near, '#2e4a2a', 0.3));
    palm(a, 520, 312, 112, -12, p.near);
  },

  athens(a) {
    const p = a.pal;
    // The rocky hill and its temple sit a little low and right, clear of the moon and the sleigh.
    const doneHill = group(a, { transform: 'translate(16 26)' });
    const rock = mix(p.mid, '#8a7a6a', 0.35);
    P(a, `M-4 262Q30 250 60 210Q80 186 120 180H380Q420 182 440 206Q470 242 564 252V262Z`, rock);
    P(a, `M60 210Q80 186 120 180H380Q420 182 440 206Q400 196 360 200H140Q100 198 60 210Z`, mix(rock, '#ffffff', 0.12));
    // The temple: steps, a row of columns, a beam and a low pediment.
    const marble = lm(a, '#f0e8d8');
    const tx = 250;
    R(a, tx - 104, 172, 208, 8, marble, 2);
    R(a, tx - 96, 166, 192, 7, marble, 2);
    for (let i = 0; i < 8; i++) {
      const x = tx - 86 + i * 24.5;
      R(a, x, 120, 12, 47, marble, 2);
      R(a, x - 2, 118, 16, 4, marble, 1);
      L(a, `M${x + 4} 124V164`, mix(marble, '#b8a888', 0.4), 2);
    }
    glowAt(a, 'cella', tx, 144, 90, 24, p.win, 0.35);
    R(a, tx - 98, 106, 196, 14, marble, 2);
    for (let x = tx - 92; x < tx + 92; x += 12) R(a, x, 109, 6, 6, mix(marble, '#b8a888', 0.35), 1);
    P(a, `M${tx - 102} 107L${tx} 84L${tx + 102} 107Z`, marble);
    P(a, `M${tx - 84} 104L${tx} 88L${tx + 84} 104Z`, mix(marble, '#b8a888', 0.3));
    doneHill();
    // White houses at the foot of the hill and olive trees.
    ground(a, 262, p.near);
    let x = 10;
    while (x < 560) {
      const w = 26 + a.rnd() * 22;
      const h = 22 + a.rnd() * 24;
      R(a, x, 262 - h, w, h + 2, lm(a, '#e8e2d8'), 2);
      R(a, x + w * 0.3, 262 - h + 6, 8, 9, a.rnd() < 0.7 ? p.win : p.winOff, 2);
      x += w + 4;
    }
    const olive = mix(p.near, '#6a7a5a', 0.45);
    roundTree(a, 90, 310, 16, olive);
    roundTree(a, 300, 314, 14, olive);
    roundTree(a, 480, 310, 18, olive);
  },

  paris(a) {
    const p = a.pal;
    blocks(a, 0, 560, 222, 16, 40, p.far2, { wMin: 16, wMax: 30, win: false });
    // The iron lattice tower: four legs meeting in a great arch, two decks, a slim top.
    const tx = 300;
    const iron = lm(a, '#a87a4a');
    const dark = mix(iron, '#000000', 0.25);
    P(a, `M${tx - 70} 262Q${tx - 40} 200 ${tx - 26} 160H${tx + 26}Q${tx + 40} 200 ${tx + 70} 262H${tx + 50}Q${tx} 196 ${tx - 50} 262Z`, iron);
    lattice(a, tx - 62, tx + 62, 252, tx - 28, tx + 28, 168, 5, dark, 1.4);
    R(a, tx - 34, 156, 68, 9, iron, 2);
    R(a, tx - 30, 159, 60, 3, p.win, 1.5);
    P(a, `M${tx - 24} 156Q${tx - 16} 120 ${tx - 12} 96H${tx + 12}Q${tx + 16} 120 ${tx + 24} 156Z`, iron);
    lattice(a, tx - 21, tx + 21, 154, tx - 12, tx + 12, 100, 4, dark, 1.3);
    R(a, tx - 16, 92, 32, 7, iron, 2);
    P(a, `M${tx - 10} 94Q${tx - 5} 60 ${tx - 3} 34H${tx + 3}Q${tx + 5} 60 ${tx + 10} 94Z`, iron);
    lattice(a, tx - 8, tx + 8, 92, tx - 3, tx + 3, 40, 5, dark, 1.2);
    L(a, `M${tx} 34V20`, iron, 2.5);
    glowAt(a, 'beacon', tx, 22, 18, 18, '#fff1c9', 0.6);
    // Rooftops: pale stone fronts, grey slate mansards, chimney pots.
    let x = -6;
    while (x < 566) {
      const w = 54 + a.rnd() * 30;
      if (x + w > 220 && x < 380) { x = 380; continue; }
      const top = 216 + a.rnd() * 16;
      const stone = lm(a, '#d8cdb8');
      R(a, x, top, w, 262 - top + 2, stone, 1);
      windows(a, x + 4, top + 6, w - 8, 262 - top - 12, Math.round(w / 12), 2, { size: 5, tall: 9 });
      P(a, `M${x - 2} ${top + 1}L${x + 8} ${top - 20}H${x + w - 8}L${x + w + 2} ${top + 1}Z`, lm(a, '#5a6a88'));
      for (let k = 1; k < Math.floor(w / 18); k++) R(a, x + k * 18 - 3, top - 16, 7, 8, a.pal.win, 1.5, { opacity: a.rnd() < 0.6 ? 0.9 : 0.25 });
      for (const cx of [x + 12, x + w - 18]) { R(a, cx, top - 30, 8, 12, lm(a, '#b86a4a'), 1.5); R(a, cx + 1.5, top - 34, 5, 5, lm(a, '#b86a4a'), 1); }
      x += w + 2;
    }
    water(a, 262, [300, 120, 470]);
    // A stone bridge with round arches.
    const bridge = lm(a, '#cbbfa6');
    let d = 'M-4 270H564V286';
    for (let bx = 564; bx > -4; bx -= 70) d += `H${bx - 10}Q${bx - 35} 270 ${bx - 60} 286`;
    d += 'H-4Z';
    P(a, d, bridge);
    for (let lx = 30; lx < 560; lx += 70) { L(a, `M${lx} 270V258`, bridge, 2.5); C(a, lx, 256, 3, p.win); }
  },

  london(a) {
    const p = a.pal;
    blocks(a, 0, 560, 224, 16, 38, p.far2, { wMin: 14, wMax: 26 });
    // The observation wheel: rim, spokes and little capsules.
    const wx = 330;
    const wy = 170;
    const wr = 66;
    const steel = lm(a, '#d8deea');
    add(a, 'circle', { cx: wx, cy: wy, r: wr, fill: 'none', stroke: steel, 'stroke-width': 4 });
    add(a, 'circle', { cx: wx, cy: wy, r: wr - 8, fill: 'none', stroke: steel, 'stroke-width': 2 });
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      L(a, `M${wx} ${wy}L${r1(wx + Math.cos(ang) * (wr - 8))} ${r1(wy + Math.sin(ang) * (wr - 8))}`, steel, 2);
      E(a, wx + Math.cos(ang) * wr, wy + Math.sin(ang) * wr, 5.5, 4.5, lm(a, '#a8d8ff'), { stroke: steel, 'stroke-width': 1.5 });
    }
    C(a, wx, wy, 6, steel);
    L(a, `M${wx} ${wy}L${wx - 40} 246M${wx} ${wy}L${wx - 22} 246`, steel, 4);
    // Parliament's long front and the tall clock tower.
    const stone = lm(a, '#d8c08a');
    R(a, 20, 196, 170, 50, stone, 2);
    for (let x = 22; x < 188; x += 12) { R(a, x, 188, 5, 10, stone, 1); P(a, `M${x} 189L${x + 2.5} 182L${x + 5} 189Z`, stone); }
    windows(a, 26, 204, 158, 34, 12, 2, { size: 5, tall: 10 });
    const tx = 214;
    R(a, tx - 14, 92, 28, 156, stone, 2);
    windows(a, tx - 10, 150, 20, 90, 2, 6, { size: 4, tall: 9 });
    R(a, tx - 17, 86, 34, 34, stone, 3);
    C(a, tx, 103, 12, lm(a, '#fff4d0'));
    add(a, 'circle', { cx: tx, cy: 103, r: 12, fill: 'none', stroke: mix(stone, '#5a4a2a', 0.5), 'stroke-width': 2 });
    L(a, `M${tx} 103V95M${tx} 103L${tx + 6} 106`, '#3a2e1e', 2);
    glowAt(a, 'clock', tx, 103, 30, 30, '#fff1c9', 0.5);
    R(a, tx - 12, 74, 24, 13, stone, 2);
    P(a, `M${tx - 13} 75L${tx} 40L${tx + 13} 75Z`, lm(a, '#5a6a88'));
    L(a, `M${tx} 42V30`, lm(a, '#e2b04a'), 2.5);
    water(a, 248, [214, 330]);
    // Embankment road with a red double-decker bus.
    R(a, -4, 274, 568, 50, p.near);
    R(a, -4, 274, 568, 4, mix(p.near, '#ffffff', 0.2));
    for (let x = 20; x < 560; x += 60) { L(a, `M${x} 274V246`, mix(p.near, '#000000', 0.1), 2.5); C(a, x, 244, 4, p.win); glowAt(a, `lamp${x}`, x, 244, 14, 14, p.win, 0.45); }
    vehicle(a, 380, 312, 90, 44, lm(a, '#d8322a'), { twoDeck: true, windows: 5 });
  },

  reykjavik(a) {
    const p = a.pal;
    // The flat-topped mountain across the bay.
    P(a, `M-4 232Q40 226 80 204Q110 190 200 188H330Q380 190 420 208Q470 228 564 230V262H-4Z`, mix(p.far, p.snow, 0.25));
    P(a, `M80 204Q110 190 200 188H330Q380 190 420 208Q380 200 340 202Q300 196 260 202Q200 196 150 202Q110 198 80 204Z`, mix(p.snow, p.far, 0.15));
    // The church: stepped columns rising on both sides to a tall central tower.
    const cx = 270;
    const concrete = lm(a, '#e2e4ea');
    const shade = mix(concrete, '#8a90a8', 0.35);
    R(a, cx - 14, 54, 28, 210, concrete, 2);
    P(a, `M${cx - 14} 56L${cx} 30L${cx + 14} 56Z`, concrete);
    L(a, `M${cx} 32V22`, concrete, 2.5);
    R(a, cx - 6, 78, 12, 18, p.win, 5, { opacity: 0.9 });
    for (let i = 0; i < 6; i++) {
      const h = 160 - i * 22;
      for (const side of [-1, 1]) {
        const x = side < 0 ? cx - 14 - (i + 1) * 9 : cx + 14 + i * 9;
        R(a, x, 262 - h, 9, h + 2, i % 2 ? concrete : shade, 1.5);
      }
    }
    R(a, cx - 36, 236, 72, 28, concrete, 2);
    P(a, `M${cx - 9} 264V246Q${cx} 236 ${cx + 9} 246V264Z`, mix(p.near, '#000000', 0.2));
    glowAt(a, 'door', cx, 256, 22, 12, p.win, 0.5);
    // Colourful little houses with snowy roofs.
    ground(a, 262);
    const colours = ['#d8402e', '#2f6ad8', '#e8a53a', '#3a9a6a', '#f2e6c8', '#8a4aa8'];
    let x = -6;
    let i = 0;
    while (x < 566) {
      if (x > 200 && x < 340) { x = 344; continue; }
      const w = 30 + a.rnd() * 14;
      const h = 22 + a.rnd() * 10;
      const base = 290 + a.rnd() * 8;
      const c = lm(a, colours[i++ % colours.length]!);
      R(a, x, base - h, w, h + 2, c, 1.5);
      R(a, x + w * 0.3, base - h + 6, 7, 9, p.win, 1.5);
      P(a, `M${x - 3} ${base - h + 1}L${x + w / 2} ${base - h - 16}L${x + w + 3} ${base - h + 1}Z`, lm(a, '#3a3a50'));
      P(a, `M${x - 4} ${base - h + 2}L${x + w / 2} ${base - h - 17}L${x + w + 4} ${base - h + 2}L${x + w + 1} ${base - h + 4}L${x + w / 2} ${base - h - 12}L${x - 1} ${base - h + 4}Z`, p.snow);
      x += w + 6;
    }
    R(a, -4, 300, 568, 24, p.snow);
  },

  lagos(a) {
    const p = a.pal;
    blocks(a, 0, 196, 222, 40, 84, p.mid2, { wMin: 16, wMax: 30 });
    blocks(a, 197, 560, 222, 50, 120, p.mid2, { wMin: 16, wMax: 30 });
    block(a, 250, 222, 30, 150, p.mid, { cap: 'antenna' });
    block(a, 330, 222, 26, 130, p.mid, { cap: 'ledge' });
    water(a, 222);
    // The very long bridge across the lagoon.
    longBridge(a, -4, 564, 238, lm(a, '#8a94b0'), 14, true);
    // The shore road: palms and a yellow minibus.
    P(a, `M-4 276H564V324H-4Z`, p.near);
    R(a, -4, 276, 568, 4, mix(p.near, '#ffffff', 0.18));
    palm(a, 60, 280, 120, 18, p.near);
    palm(a, 500, 280, 108, -16, p.near);
    vehicle(a, 220, 314, 84, 32, lm(a, '#f2c230'), { stripe: lm(a, '#1f1f2e'), windows: 5 });
  },

  rio(a) {
    const p = a.pal;
    // The tall sharp peak far behind the bay (just the mountain).
    P(a, `M-4 236Q60 222 116 178Q138 148 150 140Q160 138 168 150Q196 190 244 220Q290 238 340 240V262H-4Z`, p.far);
    // A row of lit beachfront flats along the bay.
    blocks(a, -4, 250, 252, 14, 30, p.mid2, { wMin: 14, wMax: 24 });
    // The rounded granite mountain and its smaller neighbour, linked by a cable car.
    const rock = mix(p.mid, '#6a6a7a', 0.25);
    P(a, `M232 262Q244 230 270 218Q292 210 310 226Q324 240 332 262Z`, mix(rock, p.near, 0.2));
    P(a, `M326 262Q328 206 352 172Q372 150 392 154Q412 160 424 196Q434 230 440 262Z`, rock);
    P(a, `M352 172Q372 150 392 154Q378 160 368 180Q360 200 362 236Q348 208 352 172Z`, mix(rock, '#ffffff', 0.12));
    const wire = mix(p.near, '#000000', 0.2);
    L(a, `M286 216L376 160`, wire, 2);
    C(a, 286, 216, 3.5, wire);
    C(a, 376, 160, 3.5, wire);
    L(a, `M327 191V197`, wire, 2);
    R(a, 319, 196, 16, 11, lm(a, '#ffd166'), 3);
    R(a, 322, 199, 10, 4, p.win, 1.5);
    water(a, 250, [100, 380]);
    // The beach promenade with its wave pattern, and palms.
    P(a, `M-4 280Q140 270 280 280T564 276V324H-4Z`, lm(a, '#e8d4a8'));
    R(a, -4, 296, 568, 28, lm(a, '#f2ece0'));
    let d = 'M-4 306';
    for (let x = -4; x < 564; x += 24) d += `Q${x + 6} 298 ${x + 12} 306T${x + 24} 306`;
    L(a, d, lm(a, '#2a2a3a'), 3.5);
    let d2 = 'M-4 316';
    for (let x = -4; x < 564; x += 24) d2 += `Q${x + 6} 308 ${x + 12} 316T${x + 24} 316`;
    L(a, d2, lm(a, '#2a2a3a'), 3.5);
    palm(a, 70, 300, 140, 20, p.near);
    palm(a, 200, 300, 118, -10, p.near);
    palm(a, 520, 302, 104, -14, p.near);
  },

  'buenos-aires'(a) {
    const p = a.pal;
    // The domed palace on the left.
    const stone = lm(a, '#d8d2c6');
    R(a, 20, 196, 150, 66, stone, 2);
    windows(a, 28, 206, 134, 44, 8, 2, { size: 6, tall: 12 });
    R(a, 70, 168, 50, 30, stone, 2);
    dome(a, 95, 168, 26, 26, lm(a, '#7a9aa8'), 6);
    L(a, `M95 136V124`, lm(a, '#e2b04a'), 2.5);
    blocks(a, 170, 560, 262, 40, 110, p.mid2, { wMin: 16, wMax: 30 });
    // The obelisk in the middle of the wide avenue.
    const ox = 290;
    const white = lm(a, '#f2f0ea');
    P(a, `M${ox - 13} 262L${ox - 8} 62H${ox + 8}L${ox + 13} 262Z`, white);
    P(a, `M${ox - 8} 62L${ox} 44L${ox + 8} 62Z`, white);
    P(a, `M${ox} 44L${ox + 8} 62L${ox + 13} 262H${ox + 3}Z`, mix(white, '#9aa0b8', 0.3));
    R(a, ox - 3, 70, 6, 8, p.win, 1.5);
    glowAt(a, 'obelisk', ox, 252, 40, 14, p.win, 0.5);
    // The wide plaza, and the avenue running towards us.
    ground(a, 262, p.near);
    lamps(a, [196, 384], 266, 28);
    P(a, `M240 262H340L564 324H-4Z`, mix(p.near, p.mid, 0.25));
    for (const t of [0.15, 0.5, 0.85]) L(a, `M${r1(240 + 100 * t)} 266L${r1(-4 + 568 * t)} 324`, '#f2f0ea', 2.5, { 'stroke-dasharray': '10 10', opacity: 0.5 });
    // Brightly painted houses by the old port.
    const colours = ['#e8a53a', '#2f6ad8', '#d8402e', '#3a9a6a', '#f2c230'];
    let x = 420;
    let i = 0;
    while (x < 566) {
      const w = 34;
      const h = 36 + (i % 2) * 10;
      R(a, x, 300 - h, w, h + 30, lm(a, colours[i % colours.length]!), 1.5);
      R(a, x + 6, 300 - h + 8, 8, 10, p.win, 1.5);
      R(a, x + 20, 300 - h + 8, 8, 10, p.win, 1.5);
      R(a, x - 2, 300 - h - 4, w + 4, 5, lm(a, '#5a5a6a'), 1.5);
      x += w;
      i++;
    }
    roundTree(a, 40, 318, 16, mix(p.near, '#2e4a3a', 0.45));
  },

  'mexico-city'(a) {
    const p = a.pal;
    // The snowy volcano far away, with a little wisp of steam.
    P(a, `M-4 236Q60 226 110 190Q140 168 156 166H176Q192 168 222 192Q270 226 330 232V262H-4Z`, p.far);
    P(a, `M130 182Q146 168 156 166H176Q190 168 204 180Q194 176 184 182Q174 174 164 182Q152 174 130 182Z`, mix(p.snow, p.far, 0.2));
    P(a, `M160 168Q156 156 166 150Q160 140 172 136Q182 138 178 148Q190 152 184 162Q182 168 176 168Z`, mix(p.far, '#ffffff', 0.35), { opacity: 0.6 });
    blocks(a, 260, 560, 262, 40, 100, p.mid2, { wMin: 16, wMax: 30 });
    // The skyscraper with its antenna.
    const glass = lm(a, '#9ab0d0');
    R(a, 372, 176, 40, 86, glass, 2);
    windows(a, 376, 182, 32, 74, 4, 7, { size: 5, tall: 7 });
    R(a, 378, 166, 28, 12, glass, 2);
    R(a, 384, 158, 16, 10, glass, 2);
    L(a, `M392 158V140`, glass, 2.5);
    // The tall column with a golden top, on its stepped base in a roundabout.
    const cx = 240;
    const stone = lm(a, '#e6e0d4');
    R(a, cx - 46, 248, 92, 14, stone, 3);
    R(a, cx - 30, 222, 60, 28, stone, 2);
    R(a, cx - 8, 92, 16, 132, stone, 3);
    for (let y = 104; y < 220; y += 22) R(a, cx - 10, y, 20, 4, mix(stone, '#b8a888', 0.4), 2);
    R(a, cx - 12, 86, 24, 8, stone, 2);
    glowAt(a, 'angel', cx, 70, 30, 30, '#ffcf5a', 0.55);
    P(a, `M${cx - 9} 87Q${cx - 16} 72 ${cx - 6} 60Q${cx - 4} 70 ${cx} 70Q${cx - 2} 58 ${cx + 4} 50Q${cx + 16} 66 ${cx + 9} 87Z`, lm(a, '#f2c230'));
    // Colourful low houses in front.
    ground(a, 262, p.near);
    const colours = ['#d6336c', '#2f9ac8', '#e8a53a', '#3a9a6a', '#8a4aa8'];
    let x = -4;
    let i = 0;
    while (x < 566) {
      const w = 40 + a.rnd() * 20;
      const h = 24 + a.rnd() * 14;
      R(a, x, 300 - h, w, h + 26, lm(a, colours[i++ % colours.length]!), 2);
      R(a, x + 8, 300 - h + 7, 8, 10, p.win, 1.5);
      R(a, x + w - 16, 300 - h + 7, 8, 10, p.win, 1.5);
      x += w + 2;
    }
  },

  'new-york'(a) {
    const p = a.pal;
    blocks(a, 150, 560, 236, 50, 120, p.mid2, { wMin: 14, wMax: 26 });
    // The stepped skyscraper with a tall spire.
    const ex = 250;
    const stone = lm(a, '#c8c0b0');
    R(a, ex - 30, 126, 60, 112, stone, 2);
    R(a, ex - 22, 92, 44, 36, stone, 2);
    R(a, ex - 14, 70, 28, 24, stone, 2);
    R(a, ex - 8, 54, 16, 18, stone, 2);
    windows(a, ex - 26, 132, 52, 100, 6, 10, { size: 4, tall: 6 });
    windows(a, ex - 18, 98, 36, 26, 4, 3, { size: 4, tall: 6 });
    P(a, `M${ex - 5} 56L${ex} 22L${ex + 5} 56Z`, stone);
    glowAt(a, 'esb', ex, 74, 34, 30, '#ffd59a', 0.4);
    // The tower with a stacked sunburst crown.
    const cx = 350;
    const steel = lm(a, '#d8dce8');
    R(a, cx - 20, 120, 40, 118, stone, 2);
    windows(a, cx - 16, 126, 32, 106, 4, 11, { size: 4, tall: 6 });
    for (let i = 0; i < 5; i++) {
      const w = 18 - i * 3.5;
      const y = 120 - i * 11;
      P(a, `M${cx - w} ${y}Q${cx - w} ${y - 13} ${cx} ${y - 15}Q${cx + w} ${y - 13} ${cx + w} ${y}Z`, steel);
      for (let k = -1; k <= 1; k++) P(a, `M${cx + k * w * 0.5 - 2} ${y - 2}L${cx + k * w * 0.5} ${y - 8}L${cx + k * w * 0.5 + 2} ${y - 2}Z`, p.win);
    }
    L(a, `M${cx} 66V48`, steel, 2.5);
    water(a, 236, [250, 350, 470]);
    // The stone bridge: a tower with two pointed arches, and its cables.
    const bx = 90;
    const granite = lm(a, '#b8a890');
    R(a, -4, 230, 568, 7, mix(p.near, p.mid, 0.4), 2);
    R(a, bx - 30, 132, 60, 140, granite, 3);
    for (const ax of [bx - 18, bx + 6]) P(a, `M${ax} 236V172Q${ax + 6} 158 ${ax + 12} 172V236Z`, mix(p.near, '#000000', 0.15));
    R(a, bx - 34, 128, 68, 8, granite, 2);
    E(a, bx, 272, 38, 3.5, mix(p.water, '#ffffff', 0.25), { opacity: 0.7 });
    // Main cables: one runs off to the left shore, the other sags to the deck mid-span and
    // rises again toward the far tower out of the picture; hangers drop from it to the deck.
    const cable = mix(granite, '#ffffff', 0.25);
    const c0: [number, number] = [bx + 28, 136];
    const c1: [number, number] = [330, 299];
    const c2: [number, number] = [566, 170];
    L(a, `M${bx - 28} 136Q${bx - 80} 214 -4 228M${c0[0]} ${c0[1]}Q${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]}`, cable, 2.5);
    for (let k = 1; k < 20; k++) {
      const t = k / 20;
      const x = (1 - t) * (1 - t) * c0[0] + 2 * (1 - t) * t * c1[0] + t * t * c2[0];
      const y = (1 - t) * (1 - t) * c0[1] + 2 * (1 - t) * t * c1[1] + t * t * c2[1];
      if (y < 224) L(a, `M${r1(x)} ${r1(y)}V230`, cable, 2);
    }
    for (let x = 0; x < 560; x += 20) C(a, x, 233, 1.8, p.win);
  },

  chicago(a) {
    const p = a.pal;
    blocks(a, 120, 560, 240, 50, 120, p.mid2, { wMin: 14, wMax: 26 });
    // The black stepped tower of bundled tubes with two antennas.
    const black = lm(a, '#2a2a38');
    const sx = 250;
    R(a, sx - 30, 120, 60, 122, black, 2);
    R(a, sx - 30, 92, 40, 30, black, 2);
    R(a, sx - 10, 68, 20, 26, black, 2);
    windows(a, sx - 26, 126, 52, 108, 6, 12, { size: 4, tall: 5 });
    windows(a, sx - 26, 96, 32, 22, 4, 2, { size: 4, tall: 5 });
    L(a, `M${sx - 5} 68V26M${sx + 5} 68V32`, black, 3);
    C(a, sx - 5, 25, 2.5, '#ff6b6b');
    C(a, sx + 5, 31, 2.5, '#ff6b6b');
    // The tapering tower with criss-cross bracing.
    const hx = 360;
    P(a, `M${hx - 26} 242L${hx - 17} 102H${hx + 17}L${hx + 26} 242Z`, black);
    lattice(a, hx - 24, hx + 24, 236, hx - 17, hx + 17, 106, 4, mix(black, '#ffffff', 0.25), 1.6);
    L(a, `M${hx - 7} 102V62M${hx + 7} 102V62`, black, 3);
    if (a.snowy) for (const [x, y, w] of [[sx - 30, 120, 60], [sx - 30, 92, 40], [sx - 10, 68, 20]] as const) R(a, x - 1.5, y - 2.5, w + 3, 5, p.snow, 2.5);
    water(a, 252, [250, 360]);
    // A low bridge over the river with lamps.
    R(a, -4, 244, 568, 8, mix(p.near, p.mid, 0.3), 2);
    for (let x = 30; x < 560; x += 60) { L(a, `M${x} 244V232`, p.near, 2.5); C(a, x, 230, 3, p.win); }
    // The snowy bank in front.
    P(a, `M-4 292Q140 280 280 290T564 286V324H-4Z`, p.snow);
    P(a, `M-4 300Q160 292 300 300T564 296V324H-4Z`, p.snowShade, { opacity: 0.5 });
    spruce(a, 60, 296, 46, mix(p.near, '#1f3a2e', 0.5));
    spruce(a, 500, 294, 52, mix(p.near, '#1f3a2e', 0.5));
  },

  'los-angeles'(a) {
    const p = a.pal;
    // Mountains far behind.
    hills(a, [[-4, 200], [90, 176], [190, 196], [300, 170], [410, 188], [564, 176]], p.far);
    blocks(a, 380, 560, 252, 40, 100, p.mid2, { wMin: 16, wMax: 28 });
    // The hill with the white observatory and its three domes.
    hills(a, [[-4, 252], [70, 214], [160, 184], [250, 182], [330, 214], [400, 252]], mix(p.mid, '#4a5a3a', 0.3));
    const white = lm(a, '#eceae4');
    const copper = lm(a, '#7aa8a0');
    R(a, 150, 162, 110, 24, white, 2);
    windows(a, 156, 168, 98, 12, 7, 1, { size: 5, tall: 8 });
    R(a, 186, 146, 38, 18, white, 2);
    dome(a, 205, 146, 22, 18, copper, 4);
    for (const dx of [160, 250]) { R(a, dx - 10, 150, 20, 14, white, 2); dome(a, dx, 150, 11, 10, copper, 2); }
    glowAt(a, 'obs', 205, 176, 70, 16, p.win, 0.4);
    ground(a, 262, p.near);
    // The freeway at the foot of the hill: white headlights one way, red tail lights the other.
    R(a, -4, 272, 568, 26, mix(p.near, p.mid, 0.25));
    L(a, 'M-4 285H564', mix(p.near, '#ffffff', 0.25), 2, { 'stroke-dasharray': '10 12', opacity: 0.6 });
    L(a, 'M-4 279H564', '#fff4d6', 3, { 'stroke-dasharray': '16 30 6 40', opacity: 0.85 });
    L(a, 'M8 292H564', '#ff5a5a', 3, { 'stroke-dasharray': '14 34 8 26', opacity: 0.85 });
    // Tall skinny fan palms: a slim trunk and a round crown of fronds that droop at the tips.
    for (const [x, h] of [[330, 150], [372, 172], [414, 128], [520, 112]] as const) {
      const top = 300 - h;
      P(a, `M${x - 3} 300L${x - 1.5} ${top + 4}H${x + 1.5}L${x + 3} 300Z`, p.near);
      for (let i = 0; i < 11; i++) {
        const ang = Math.PI * (0.95 + (i / 10) * 1.1);
        const len = 17 + (i % 2) * 4;
        const ex = x + Math.cos(ang) * len;
        const ey = top + Math.sin(ang) * len * 0.75 + 8;
        const nx = -Math.sin(ang) * 3.5;
        const ny = Math.cos(ang) * 3.5;
        const mx = (x + ex) / 2;
        const my = (top + ey) / 2 - 3;
        P(a, `M${x} ${top}Q${r1(mx + nx)} ${r1(my + ny)} ${r1(ex)} ${r1(ey)}Q${r1(mx - nx)} ${r1(my - ny)} ${x} ${top + 2}Z`, p.near);
      }
      C(a, x, top + 1, 4, p.near);
    }
    R(a, -4, 298, 568, 26, mix(p.near, '#000000', 0.15));
  },

  anchorage(a) {
    const p = a.pal;
    // Big snowy mountains: one ridge, and a snow cap on each peak that follows its two slopes.
    const ridge: [number, number][] = [[-4, 222], [60, 160], [100, 186], [170, 120], [240, 190], [300, 150], [360, 196], [420, 170], [470, 196], [564, 158]];
    P(a, `M${ridge.map(([x, y]) => `${x} ${y}`).join('L')}V262H-4Z`, p.far);
    const capFill = mix(p.snow, p.far, 0.2);
    for (const i of [1, 3, 5, 7]) {
      const [px, py] = ridge[i]!;
      const [lx0, ly0] = ridge[i - 1]!;
      const [rx0, ry0] = ridge[i + 1]!;
      const k = 0.42;
      const lx = px + (lx0 - px) * k;
      const ly = py + (ly0 - py) * k;
      const rx = px + (rx0 - px) * k;
      const ry = py + (ry0 - py) * k;
      const dip = (ly + ry) / 2 - py;
      P(a, `M${px} ${py}L${r1(rx)} ${r1(ry)}L${r1(px + (rx - px) * 0.55)} ${r1(py + dip * 0.7)}L${r1(px + (rx - px) * 0.2)} ${r1(py + dip * 0.95)}L${r1(px - (px - lx) * 0.3)} ${r1(py + dip * 0.68)}L${r1(px - (px - lx) * 0.62)} ${r1(py + dip * 0.92)}L${r1(lx)} ${r1(ly)}Z`, capFill, { stroke: capFill, 'stroke-width': 2, 'stroke-linejoin': 'round' });
    }
    blocks(a, 150, 400, 262, 30, 84, p.mid2, { wMin: 16, wMax: 28 });
    block(a, 240, 262, 34, 104, p.mid, { cap: 'ledge' });
    ground(a, 262);
    for (const [x, h] of [[40, 70], [90, 52], [440, 64], [480, 80], [530, 56]] as const) spruce(a, x, 300, h, mix(p.near, '#1f3a2e', 0.5));
    R(a, -4, 304, 568, 20, p.snow);
    // A moose wandering past, facing left: humped shoulders, long legs, a droopy nose,
    // a dewlap and broad palm-shaped antlers.
    const mx = 336;
    const mb = 306;
    const fur = lm(a, '#5a3a26');
    const dark = mix(fur, '#000000', 0.35);
    const antler = lm(a, '#d8c29a');
    E(a, mx - 4, mb + 1, 40, 4, '#000000', { opacity: 0.18 });
    for (const lx of [mx - 22, mx - 13, mx + 14, mx + 22]) {
      L(a, `M${lx} ${mb - 36}V${mb - 2}`, lx < mx ? fur : mix(fur, '#000000', 0.15), 5);
      L(a, `M${lx} ${mb - 4}V${mb}`, dark, 5.5);
    }
    P(a, `M${mx - 28} ${mb - 34}Q${mx - 32} ${mb - 58} ${mx - 12} ${mb - 64}Q${mx + 4} ${mb - 66} ${mx + 18} ${mb - 58}Q${mx + 30} ${mb - 52} ${mx + 28} ${mb - 36}Q${mx} ${mb - 30} ${mx - 28} ${mb - 34}Z`, fur);
    L(a, `M${mx + 28} ${mb - 50}L${mx + 32} ${mb - 46}`, fur, 3);
    P(a, `M${mx - 22} ${mb - 62}Q${mx - 34} ${mb - 62} ${mx - 42} ${mb - 56}L${mx - 56} ${mb - 48}Q${mx - 62} ${mb - 44} ${mx - 58} ${mb - 38}Q${mx - 52} ${mb - 35} ${mx - 46} ${mb - 39}L${mx - 30} ${mb - 44}Q${mx - 24} ${mb - 46} ${mx - 18} ${mb - 50}Z`, fur);
    P(a, `M${mx - 37} ${mb - 46}Q${mx - 38} ${mb - 36} ${mx - 34} ${mb - 34}Q${mx - 31} ${mb - 40} ${mx - 31} ${mb - 46}Z`, fur);
    C(a, mx - 57, mb - 42, 1.6, dark);
    C(a, mx - 44, mb - 53, 1.8, '#1a120c');
    E(a, mx - 30, mb - 63, 5, 2.5, fur, { transform: `rotate(-30 ${mx - 30} ${mb - 63})` });
    P(a, `M${mx - 36} ${mb - 60}Q${mx - 50} ${mb - 64} ${mx - 54} ${mb - 76}L${mx - 49} ${mb - 73}L${mx - 47} ${mb - 80}L${mx - 43} ${mb - 74}L${mx - 39} ${mb - 80}L${mx - 37} ${mb - 72}Q${mx - 34} ${mb - 66} ${mx - 32} ${mb - 61}Z`, antler, { stroke: antler, 'stroke-width': 1.5, 'stroke-linejoin': 'round' });
    P(a, `M${mx - 31} ${mb - 61}Q${mx - 20} ${mb - 66} ${mx - 15} ${mb - 77}L${mx - 19} ${mb - 74}L${mx - 21} ${mb - 80}L${mx - 25} ${mb - 74}L${mx - 28} ${mb - 79}L${mx - 30} ${mb - 71}Z`, mix(antler, '#000000', 0.12), { stroke: mix(antler, '#000000', 0.12), 'stroke-width': 1.5, 'stroke-linejoin': 'round' });
  },

  honolulu(a) {
    const p = a.pal;
    // The crater headland: a long rise to a sharp rim over the sea.
    P(a, `M250 250Q300 232 350 206Q400 178 440 170Q462 168 476 184Q500 214 530 236Q548 248 564 250V262H250Z`, mix(p.far, '#4a5a3a', 0.25));
    P(a, `M350 206Q400 178 440 170Q462 168 476 184Q452 182 420 196Q390 206 350 206Z`, mix(p.far, '#ffffff', 0.12));
    blocks(a, 100, 192, 250, 26, 56, p.mid2, { wMin: 14, wMax: 24 });
    blocks(a, 238, 320, 250, 30, 70, p.mid2, { wMin: 14, wMax: 24 });
    // The harbour clock tower with its pyramid roof.
    const tx = 215;
    const stone = lm(a, '#ece4d4');
    R(a, tx - 16, 140, 32, 112, stone, 2);
    windows(a, tx - 12, 176, 24, 70, 2, 5, { size: 5, tall: 8 });
    R(a, tx - 19, 136, 38, 30, stone, 2);
    C(a, tx, 151, 9, lm(a, '#fff4d0'));
    L(a, `M${tx} 151V145M${tx} 151L${tx + 5} 153`, '#3a2e1e', 1.8);
    glowAt(a, 'clock', tx, 151, 22, 22, '#fff1c9', 0.5);
    P(a, `M${tx - 20} 137L${tx} 114L${tx + 20} 137Z`, lm(a, '#5a8a7a'));
    L(a, `M${tx} 116V104`, stone, 2.5);
    water(a, 250, [215, 300]);
    // Gentle waves, the beach, palms and surfboards.
    for (let i = 0; i < 3; i++) L(a, `M-4 ${272 + i * 8}Q60 ${266 + i * 8} 120 ${272 + i * 8}T240 ${272 + i * 8}T360 ${272 + i * 8}T480 ${272 + i * 8}T600 ${272 + i * 8}`, mix(p.water, '#ffffff', 0.35), 2.5, { opacity: 0.5 });
    P(a, `M-4 298Q140 288 280 296T564 292V324H-4Z`, lm(a, '#e8d4a8'));
    palm(a, 30, 302, 150, 26, p.near);
    palm(a, 470, 300, 124, -22, p.near);
    palm(a, 530, 304, 96, 10, p.near);
    for (const [x, c] of [[380, '#ff6b6b'], [398, '#5ad1ff'], [416, '#ffd166']] as const) {
      P(a, `M${x - 6} 306Q${x - 7} 268 ${x} 256Q${x + 7} 268 ${x + 6} 306Z`, lm(a, c));
      L(a, `M${x} 262V302`, mix(lm(a, c), '#ffffff', 0.5), 1.6);
    }
  },
};

/** Draws a city's skyline (the far plane, landmarks, foreground) into the art group. */
export function drawSkyline(a: Art, cityId: string): boolean {
  const fn = SKYLINES[cityId];
  if (!fn) return false;
  fn(a);
  return true;
}

/** Cities that have a drawn skyline (for the tests). */
export function skylineIds(): string[] {
  return Object.keys(SKYLINES);
}

/** A generic snowy-rooftop skyline for cities without their own card art. */
export function drawGenericSkyline(a: Art): void {
  blocks(a, -4, PIC_W + 4, 262, 30, 110, a.pal.mid2, { wMin: 18, wMax: 40 });
  ground(a, 262, a.pal.near);
  hills(a, [[-4, 290], [140, 280], [280, 292], [420, 282], [564, 288]], a.snowy ? a.pal.snow : a.pal.near);
}
