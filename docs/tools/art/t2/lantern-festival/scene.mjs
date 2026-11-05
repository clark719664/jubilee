// Lantern Festival — "Lantern riddles in the garden": the first full moon of the lunar year over a garden with a
// white wall and a round moon gate. Rows of red lanterns hang along the wall's eaves, each with a riddle slip
// fluttering under it; a boy points to a riddle he has solved, a girl pulls a rabbit lantern on wheels, a boy holds
// a carp lantern on a stick, and grandma ladles sweet tangyuan into bowls at a little stall. Behind the wall a
// golden dragon lantern weaves past on poles, its head peering through the moon gate. The rising sky lanterns
// are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { line, circD } from '../../kit/scenekit.mjs';

const ID = 'lantern-festival';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const NIGHT = '#5a0a14';
const night = (c, k = 0.3) => mix(c, NIGHT, k);
const GOLD = '#ffc83a';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };

// ---- layout
const WALL = { top: 600, base: 760 };
const GATE = { x: 800, y: 680, r: 150 };
const MOON = { x: 150, y: 150, r: 74 };

/** A round red lantern hanging from (x, y): s = body height. */
function lantern(x, y, s, slip = true) {
  const w = s * 0.62;
  return [
    circle(x, y + s * 0.5, s * 1.1, { fill: url('glow') }),
    path(`M${P(x - w * 0.36, y)}h${f(w * 0.72)}v${f(s * 0.1)}h${f(-w * 0.72)}z`, { fill: GOLD }),
    ellipse(x, y + s * 0.5, w, s * 0.42, { fill: url('lantern') }),
    path(`M${P(x - w * 0.5, y + s * 0.2)}q${f(-w * 0.2)} ${f(s * 0.3)} 0 ${f(s * 0.6)}M${P(x, y + s * 0.1)}v${f(s * 0.8)}M${P(x + w * 0.5, y + s * 0.2)}q${f(w * 0.2)} ${f(s * 0.3)} 0 ${f(s * 0.6)}`, { fill: 'none', stroke: '#a80a1a', 'stroke-width': f(s * 0.04) }),
    path(`M${P(x - w * 0.36, y + s * 0.88)}h${f(w * 0.72)}v${f(s * 0.1)}h${f(-w * 0.72)}z`, { fill: GOLD }),
    slip ? path(`M${P(x - s * 0.12, y + s * 1.02)}h${f(s * 0.24)}v${f(s * 0.62)}l${f(-s * 0.12)} ${f(-s * 0.08)}l${f(-s * 0.12)} ${f(s * 0.08)}z`, { fill: '#fff4dc' }) + path(`M${P(x - s * 0.06, y + s * 1.12)}v${f(s * 0.4)}M${P(x + s * 0.05, y + s * 1.12)}v${f(s * 0.3)}`, { fill: 'none', stroke: '#c8102e', 'stroke-width': f(s * 0.03) })
      : path(`M${P(x, y + s * 0.98)}v${f(s * 0.3)}`, { fill: 'none', stroke: GOLD, 'stroke-width': f(s * 0.06) }),
  ].join('');
}

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const defs = [
    rad(id('moonglow'), 0.5, 0.5, 0.5, [[0, '#fff6d8', 0.6], [0.5, '#ffe0a0', 0.2], [1, '#ffe0a0', 0]]),
    rad(id('moon'), 0.4, 0.35, 0.7, [[0, '#fffbe8'], [1, '#ffe6a8']]),
  ];
  // curved-eave rooftops beyond the wall, kept below the copy zone, and a pagoda outside it on the right
  let roofs = '', wins = '';
  const R = rng(6);
  for (let x = 240; x < 1340;) {
    const w = 90 + R() * 70, top = 470 + R() * 40;
    roofs += `M${P(x, 610)}V${f(top + 16)}Q${P(x - 14, top + 6)} ${P(x - 18, top)}Q${P(x + w / 2, top - 12)} ${P(x + w + 18, top)}Q${P(x + w + 14, top + 6)} ${P(x + w, top + 16)}V610Z`;
    if (R() < 0.7) wins += `M${P(x + w * 0.3, top + 30)}h12v16h-12Z`;
    x += w + 26;
  }
  let pagoda = '';
  for (let i = 0; i < 4; i++) { const y = 600 - i * 70, w = 150 - i * 24; pagoda += `M${P(1440 - w / 2 + 12, y)}V${f(y - 50)}H${f(1440 + w / 2 - 12)}V${f(y)}ZM${P(1440 - w / 2 - 14, y - 46)}Q${P(1440, y - 74)} ${P(1440 + w / 2 + 14, y - 46)}L${P(1440 + w / 2, y - 52)}Q${P(1440, y - 66)} ${P(1440 - w / 2, y - 52)}Z`; }
  pagoda += 'M1436 330V290h8v40Z';
  return compactSvg(doc(`Lantern Festival · back: the first full moon of the lunar year glowing in the top-left corner; curved-eave rooftops beyond the wall, kept low, and a pagoda on the right with lit windows`, defs, [
    C('the full moon, top left'),
    circle(MOON.x, MOON.y, MOON.r * 2.4, { fill: url('moonglow') }),
    circle(MOON.x, MOON.y, MOON.r, { fill: url('moon') }),
    path(`M${MOON.x - 30} ${MOON.y - 20}a12 9 0 1 0 24 0a12 9 0 1 0 -24 0zM${MOON.x + 14} ${MOON.y + 18}a16 11 0 1 0 32 0a16 11 0 1 0 -32 0zM${MOON.x - 20} ${MOON.y + 30}a8 6 0 1 0 16 0a8 6 0 1 0 -16 0z`, { fill: '#f0d8a0', opacity: 0.6 }),
    C('rooftops and the pagoda'),
    path(roofs + pagoda, { fill: night('#3a0a14', 0.1) }),
    path(wins + 'M1426 560h28v20h-28zM1428 490h24v18h-24zM1430 420h20v16h-20z', { fill: '#ffcf6a', opacity: 0.9 }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('wall'), 0, 0, 0, 1, [[0, '#f4ece6'], [1, '#e0d0c8']]),
    lin(id('ground'), 0, 0, 0, 1, [[0, '#8a3a2a'], [1, '#5a2018']]),
    rad(id('glow'), 0.5, 0.5, 0.5, [[0, '#ffd98a', 0.55], [0.4, '#ff9a4a', 0.22], [1, '#ff9a4a', 0]]),
    rad(id('lantern'), 0.4, 0.35, 0.7, [[0, '#ffb070'], [0.5, '#ff3a3a'], [1, '#c8101e']]),
    lin(id('dragon'), 0, 0, 0, 1, [[0, '#ffe066'], [1, '#ff9a1a']]),
    lin(id('roof'), 0, 0, 0, 1, [[0, '#2a5a4a'], [1, '#1a3a30']]),
    rad(id('pool'), 0.5, 0.5, 0.5, [[0, '#ffcf6a', 0.4], [1, '#ffcf6a', 0]]),
  ];

  // ---- the courtyard ground
  out.push(C('the courtyard: warm stone paving in lantern light'));
  out.push(path(`M-20 ${WALL.base}H1620V920H-20Z`, { fill: url('ground') }));
  { let pav = ''; for (let y = WALL.base + 20; y < 920; y += 28) pav += `M-20 ${y}H1620`; for (let x = -40; x < 1660; x += 90) pav += `M${x} ${WALL.base}L${f(800 + (x - 800) * 1.4)} 920`; out.push(line(pav, '#7a3022', 2, { opacity: 0.6 })); }
  out.push(ellipse(800, 830, 520, 70, { fill: url('pool') }));

  // ---- the dragon lantern weaving past behind the wall
  out.push(C('the golden dragon lantern weaving past behind the wall on poles, its head peering through the moon gate'));
  {
    const pts = [[1290, 556], [1220, 520], [1150, 556], [1080, 520], [1010, 556], [940, 540]];
    let body = `M${P(pts[0][0], pts[0][1] - 26)}`;
    for (let i = 1; i < pts.length; i++) body += `Q${P((pts[i - 1][0] + pts[i][0]) / 2, Math.min(pts[i - 1][1], pts[i][1]) - 40)} ${P(pts[i][0], pts[i][1] - 26)}`;
    for (let i = pts.length - 1; i > 0; i--) body += `L${P(pts[i][0], pts[i][1] + 26)}Q${P((pts[i - 1][0] + pts[i][0]) / 2, Math.min(pts[i - 1][1], pts[i][1]) + 10)} ${P(pts[i - 1][0], pts[i - 1][1] + 26)}`;
    body += 'Z';
    let poles = '';
    for (const [x, y] of pts.slice(0, 5)) poles += `M${x} ${y + 24}V${WALL.top + 4}`;
    out.push(line(poles, '#6a3a1a', 5));
    out.push(path(body, { fill: url('dragon') }));
    let scales = '';
    for (let i = 0; i < pts.length - 1; i++) { const [x, y] = pts[i]; scales += `M${x - 14} ${y}q14 -12 28 0M${x - 30} ${y + 8}q14 -12 28 0`; }
    out.push(line(scales, '#e87a1a', 3));
    let fin = '';
    for (let i = 0; i < pts.length - 1; i++) { const [x, y] = pts[i]; fin += `M${x - 12} ${y - 24}l12 -22l12 22z`; }
    out.push(path(fin, { fill: '#e8243a' }));
    // the tail
    out.push(path('M1290 530q40 -20 60 -60q-4 40 -20 60q24 -4 36 -20q-10 30 -40 42z', { fill: '#e8243a' }));
    ppl.dragon = [1150, 530];
  }

  // ---- the wall with its moon gate and green tiled coping
  out.push(C('the white garden wall with a round moon gate and a green tiled coping'));
  const gate = `M${GATE.x - GATE.r} ${GATE.y}a${GATE.r} ${GATE.r} 0 1 0 ${2 * GATE.r} 0a${GATE.r} ${GATE.r} 0 1 0 ${-2 * GATE.r} 0Z`;
  // the wall and the gate's ring stop at the ground: the circle's foot is the threshold
  defs.push(E('clipPath', { id: id('above') }, path(`M-40 0H1640V${WALL.base}H-40Z`)));
  out.push(G({ 'clip-path': url('above') }, path(`M-20 ${WALL.base}V${WALL.top}H1620V${WALL.base}Z` + gate, { fill: url('wall'), 'fill-rule': 'evenodd' })));
  out.push(path(`M-30 ${WALL.top + 6}H1630v-20Q800 ${WALL.top - 26} -30 ${WALL.top - 14}Z`, { fill: url('roof') }), path(`M-30 ${WALL.top + 6}H1630`, { fill: 'none', stroke: '#1a3a30', 'stroke-width': 6 }));
  { let t = ''; for (let x = -20; x < 1620; x += 24) t += `M${x} ${WALL.top - 10}v14`; out.push(line(t, '#3a7a62', 3)); }
  out.push(G({ 'clip-path': url('above') }, path(gate, { fill: 'none', stroke: '#c8b0a0', 'stroke-width': 12 }), path(gate, { fill: 'none', stroke: '#8a3a2a', 'stroke-width': 4 })));
  out.push(path(`M${GATE.x - 112} ${WALL.base}h224v8h-224z`, { fill: '#c8b0a0' }));
  // through the gate: a lantern-lit path and the dragon's head with its pearl
  out.push(G({ 'clip-path': url('gateclip') },
    path(`M${GATE.x - 160} 760L${GATE.x - 30} 600H${GATE.x + 30}L${GATE.x + 160} 760Z`, { fill: '#c86a4a', opacity: 0.6 }),
    lantern(GATE.x - 90, 580, 34, false), lantern(GATE.x + 90, 580, 34, false)));
  defs.push(E('clipPath', { id: id('gateclip') }, path(gate)));
  {
    const hx = 880, hy = 620;
    out.push(G({ transform: `translate(${hx} ${hy})` },
      line('M30 24V140', '#6a3a1a', 5),
      path('M60 -20C40 -50 -10 -54 -40 -30C-60 -16 -66 6 -56 20C-40 36 0 38 30 30C60 22 74 0 60 -20Z', { fill: url('dragon') }),
      path('M-56 20q-24 10 -40 4q14 -10 22 -26z', { fill: '#ffe066' }),
      path('M-62 6q-12 6 -24 2', { fill: 'none', stroke: '#e8243a', 'stroke-width': 4, 'stroke-linecap': 'round' }),
      path('M-30 -32c-6 -26 10 -40 24 -42c-6 12 -8 26 -6 40zM10 -40c4 -26 22 -34 36 -32c-10 10 -16 22 -18 36z', { fill: '#ffe066' }),
      path('M-40 -40c-20 -16 -34 -10 -40 0c12 -2 24 0 36 6zM0 -48c-8 -24 -26 -28 -36 -22c12 4 22 12 30 24z', { fill: '#e8243a' }),
      circle(-20, -12, 10, { fill: '#ffffff' }), circle(-22, -12, 5, { fill: '#2a1a14' }), circle(-24, -14, 1.6, { fill: '#ffffff' }),
      path('M-8 -28q-12 -6 -22 0', { fill: 'none', stroke: '#c85a0a', 'stroke-width': 3, 'stroke-linecap': 'round' }),
      path('M-50 6q8 6 16 0', { fill: 'none', stroke: '#c85a0a', 'stroke-width': 3, 'stroke-linecap': 'round' }),
      path('M-20 24q-20 26 -10 50M0 30q-6 30 10 46', { fill: 'none', stroke: '#e8243a', 'stroke-width': 4, 'stroke-linecap': 'round' })));
    // the pearl it chases
    out.push(line('M720 620V740', '#6a3a1a', 4), circle(720, 610, 22, { fill: '#fff6d8' }), circle(720, 610, 34, { fill: url('glow') }), path('M712 602a6 4 0 1 0 8 0', { fill: 'none', stroke: '#ffffff', 'stroke-width': 3 }));
    ppl.pearl = [720, 610];
  }

  // ---- lanterns with riddle slips hanging along the wall
  out.push(C('red lanterns hanging along the wall\'s eaves, each with a riddle slip'));
  {
    const at = [[90, 0], [210, 1], [330, 0], [450, 1], [560, 0], [1040, 0], [1150, 1], [1270, 0], [1390, 1], [1510, 0]];
    for (const [x, k] of at) out.push(line(`M${x} ${WALL.top + 4}v${k ? 24 : 8}`, '#3a1a14', 2), lantern(x, WALL.top + (k ? 28 : 12), 56));
    ppl.riddle = [330, WALL.top + 12 + 56 * 1.3];
    ppl.lanterns = [1150, WALL.top + 56];
  }

  // ---- the people
  out.push(C('in the courtyard: a boy pointing at a riddle he has solved, a girl pulling a rabbit lantern on wheels, mum with a toddler and a little lantern, a boy with a carp lantern, grandma ladling tangyuan at her stall'));
  {
    // the boy pointing at the riddle
    const point = { sx: -1, elbow: [-0.8, -0.8], hand: [-1.0, -2.2] };
    const b = figure({ x: 372, foot: 852, H: 84, heads: 2.7, skin: SKIN.fair, hair: '#1a1210', style: 'short', top: '#2a6ad8', bottom: '#2a2a3a', shoe: '#e8343a', gaze: -0.4, mouth: 'open', arms: [point, { sx: 1, elbow: [0.6, 1.0], hand: [0.4, 1.9] }] });
    out.push(b.svg);
    const ph = b.hand(point);
    out.push(path(`M${P(ph[0], ph[1])}l-4 -14`, { fill: 'none', stroke: SKIN.fair, 'stroke-width': 4, 'stroke-linecap': 'round' }));
    out.push(path(`M${P(ph[0] - 6, ph[1] - 36)}l-6 -8M${P(ph[0] + 8, ph[1] - 38)}l4 -10M${P(ph[0] - 18, ph[1] - 28)}l-10 -2`, { fill: 'none', stroke: '#ffe9a3', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    // mum and the toddler with a little lantern
    const mum = figure({ x: 214, foot: 850, H: 118, heads: 3.2, skin: SKIN.fair, hair: '#1a1210', style: 'bun', top: '#c8243a', bottom: '#2a2a3a', gaze: 0.4, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.1], hand: [-0.3, 2.0] }, { sx: 1, elbow: [0.8, 1.0], hand: [1.2, 1.6] }] });
    out.push(mum.svg);
    const tl = { sx: 1, elbow: [0.9, 0.2], hand: [1.4, -0.4] };
    const tod = figure({ x: 268, foot: 856, H: 58, heads: 2.4, skin: SKIN.fair, hair: '#1a1210', style: 'puffs', top: '#ffd23a', bottom: '#c8243a', shoe: '#c8243a', gaze: 0.3, mouth: 'open', arms: [{ sx: -1, elbow: [-0.7, 0.2], hand: [-1.2, -0.1] }, tl] });
    out.push(tod.svg);
    const th = tod.hand(tl);
    out.push(line(`M${P(...th)}l10 -20`, '#c8945a', 3), lantern(th[0] + 10, th[1] - 18, 24, false), circle(th[0], th[1], tod.r * 0.36, { fill: SKIN.fair }));
    // the girl pulling a rabbit lantern on wheels
    const pull = { sx: -1, elbow: [-0.9, 0.6], hand: [-1.6, 1.0] };
    const g = figure({ x: 560, foot: 856, H: 82, heads: 2.7, skin: SKIN.tan, hair: '#1a1210', style: 'bob', top: '#ff8fb8', bottom: '#5a3ab0', shoe: '#ffffff', gaze: 0.5, mouth: 'smile', arms: [pull, { sx: 1, elbow: [0.6, 1.0], hand: [0.4, 1.9] }] });
    const gh = g.hand(pull);
    const RB = { x: 470, y: 838 };
    out.push(circle(RB.x, RB.y - 30, 56, { fill: url('glow') }));
    out.push(path(`M${RB.x - 34} ${RB.y - 14}c-6 -30 16 -46 40 -42c22 -14 40 0 34 22c6 16 -6 26 -20 26h-40c-10 0 -14 -2 -14 -6z`, { fill: '#fff4f0' }), path(`M${RB.x + 30} ${RB.y - 52}c-4 -30 4 -44 12 -44c6 4 2 24 -6 44zM${RB.x + 44} ${RB.y - 48}c4 -28 16 -38 22 -36c2 6 -6 22 -16 36z`, { fill: '#fff4f0' }), path(`M${RB.x + 36} ${RB.y - 58}c0 -18 3 -26 6 -30M${RB.x + 50} ${RB.y - 54}c4 -16 8 -22 12 -26`, { fill: 'none', stroke: '#ff8fb8', 'stroke-width': 4, 'stroke-linecap': 'round' }));
    out.push(circle(RB.x + 52, RB.y - 30, 3.4, { fill: '#e8243a' }), path(`M${RB.x - 20} ${RB.y - 30}q16 -10 34 0`, { fill: 'none', stroke: '#ff8fb8', 'stroke-width': 3, opacity: 0.7 }), path(`M${RB.x - 36} ${RB.y - 22}q-12 -4 -14 6q8 6 14 0z`, { fill: '#fff4f0' }));
    out.push(circle(RB.x - 18, RB.y, 9, { fill: '#c8102e' }), circle(RB.x + 30, RB.y, 9, { fill: '#c8102e' }), circle(RB.x - 18, RB.y, 3, { fill: GOLD }), circle(RB.x + 30, RB.y, 3, { fill: GOLD }));
    out.push(line(`M${RB.x + 64} ${RB.y - 18}Q${P((RB.x + gh[0]) / 2 + 20, gh[1] + 30)} ${P(...gh)}`, '#ffd23a', 2));
    out.push(g.svg, circle(gh[0], gh[1], g.r * 0.36, { fill: SKIN.tan }));
    ppl.rabbit = [RB.x + 10, RB.y - 30];
    // the boy with the carp lantern on a stick
    const hold = { sx: 1, elbow: [0.9, -0.6], hand: [1.3, -1.8] };
    const c = figure({ x: 1000, foot: 852, H: 86, heads: 2.7, skin: SKIN.light, hair: '#3a2214', style: 'short', top: '#ffd23a', bottom: '#2a3a6a', shoe: '#2a2a3a', gaze: 0.4, mouth: 'open', arms: [{ sx: -1, elbow: [-0.6, 1.0], hand: [-0.4, 1.9] }, hold] });
    out.push(c.svg);
    const ch = c.hand(hold);
    const fx = ch[0] + 20, fy = ch[1] - 70;
    out.push(line(`M${P(...ch)}L${P(fx - 10, fy + 14)}`, '#c8945a', 4), circle(fx, fy, 60, { fill: url('glow') }));
    out.push(path(`M${fx - 44} ${fy}c20 -30 60 -30 80 0c-20 28 -60 28 -80 0zM${fx + 32} ${fy}l24 -22l-6 22l6 22z`, { fill: '#ff6a2a' }), path(`M${fx - 20} ${fy - 6}q10 -10 20 0q10 -10 20 0M${fx - 20} ${fy + 8}q10 -10 20 0q10 -10 20 0`, { fill: 'none', stroke: '#ffd23a', 'stroke-width': 2.4 }), circle(fx - 30, fy - 4, 5, { fill: '#ffffff' }), circle(fx - 31, fy - 4, 2.4, { fill: '#2a1a14' }), path(`M${fx - 4} ${fy - 20}l10 -16l6 16z`, { fill: '#ffd23a' }));
    out.push(circle(ch[0], ch[1], c.r * 0.36, { fill: SKIN.light }));
    ppl.carp = [fx, fy];
    // grandma's tangyuan stall
    const S = { x0: 1180, x1: 1400, top: 760 };
    const ladle = { sx: -1, elbow: [-0.9, -0.3], hand: [-0.6, -1.7] };
    const gm = figure({ x: 1320, foot: S.top + 70, H: 150, heads: 3.1, skin: SKIN.fair, hair: '#e6e2ee', style: 'elder', top: '#2a7a6a', bottom: '#2a2a3a', gaze: -0.3, mouth: 'smile', arms: [ladle, { sx: 1, elbow: [0.6, 1.0], hand: [0.3, 1.6] }] });
    out.push(gm.svg);
    out.push(path(`M${S.x0} ${S.top}h${S.x1 - S.x0}v14h-${S.x1 - S.x0}z`, { fill: '#8a2a1a' }), path(`M${S.x0 + 14} ${S.top + 14}v70h12v-70zM${S.x1 - 26} ${S.top + 14}v70h12v-70z`, { fill: '#6a1a10' }), path(`M${S.x0 + 4} ${S.top + 14}h${S.x1 - S.x0 - 8}v26h-${S.x1 - S.x0 - 8}z`, { fill: '#c8102e' }), path(`M${S.x0 + 4} ${S.top + 40}h${S.x1 - S.x0 - 8}`, { fill: 'none', stroke: GOLD, 'stroke-width': 3 }));
    out.push(path(`M1220 ${S.top}v-34q0 -8 8 -8h60q8 0 8 8v34z`, { fill: '#3a3a44' }), ellipse(1258, S.top - 42, 40, 8, { fill: '#5a5a66' }), ellipse(1258, S.top - 42, 34, 5, { fill: '#fff4e8' }));
    out.push(line('M1240 680c-6 -10 4 -16 -2 -26M1262 676c-6 -10 4 -16 -2 -26M1282 680c-6 -10 4 -16 -2 -26', '#ffffff', 2.4, { opacity: 0.6 }));
    const bowl = (x) => ellipse(x, S.top - 6, 22, 6, { fill: '#ffffff' }) + path(`M${x - 22} ${S.top - 6}q22 22 44 0z`, { fill: '#ffffff' }) + path(circD(x - 8, S.top - 8, 6) + circD(x + 6, S.top - 9, 6), { fill: '#fff6ee' }) + circle(x + 1, S.top - 12, 5, { fill: '#ffc8d8' }) + path(`M${x - 18} ${S.top + 2}q18 6 36 0`, { fill: 'none', stroke: '#2a8ad8', 'stroke-width': 2.4 });
    out.push(bowl(1336), bowl(1380));
    ppl.tangyuan = [1358, S.top - 10];
    const lh = gm.hand(ladle);
    out.push(line(`M${P(...lh)}L${P(lh[0] - 30, lh[1] + 12)}`, '#c8945a', 4), circle(lh[0], lh[1], gm.r * 0.34, { fill: SKIN.fair }));
    // a cat curled under the stall
    out.push(G({ transform: 'translate(1290 848)' }, ellipse(0, 0, 26, 12, { fill: '#f0a050' }), circle(-20, -8, 10, { fill: '#f0a050' }), path('M-26 -16l-2 -8l6 4zM-16 -17l2 -8l-6 4z', { fill: '#f0a050' }), path('M-24 -8q2 2 4 0M-18 -8q2 2 4 0', { fill: 'none', stroke: '#5a2a1a', 'stroke-width': 1.6, 'stroke-linecap': 'round' }), path('M24 2q10 -2 4 -12', { fill: 'none', stroke: '#f0a050', 'stroke-width': 5, 'stroke-linecap': 'round' })));
    ppl.cat = [1280, 840];
  }

  return { svg: compactSvg(doc(`Lantern Festival · mid. Concept: "lantern riddles in the garden" under the first full moon of the lunar year. Focal point: the moon gate in the white garden wall (x 650–950, y 530–760) with a golden dragon lantern peering through it, chasing a glowing pearl, its body weaving past behind the wall on poles; red lanterns with riddle slips hang along the eaves. In the courtyard a boy points at a riddle he has solved, mum and a toddler with a little lantern, a girl pulls a rabbit lantern on wheels, a boy holds up a carp lantern, and grandma ladles tangyuan at her stall with a cat curled underneath. Light story: lantern-red and gold glow on warm stone; the full moon in the top-left corner. The rising sky lanterns are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Lantern Festival · front: a potted kumquat tree bottom left and a stone lantern bottom right; the center stays open`, [], [
    C('a potted kumquat tree'),
    path('M10 900l10 -56h100l10 56z', { fill: '#2a5aa8' }), path('M18 856h104', { fill: 'none', stroke: '#ffd23a', 'stroke-width': 4 }),
    path(circD(40, 806, 30) + circD(90, 798, 34) + circD(66, 770, 30), { fill: '#2a7a3a' }),
    path(circD(36, 796, 7) + circD(62, 780, 7) + circD(92, 792, 7) + circD(78, 816, 7) + circD(50, 818, 6) + circD(104, 812, 6), { fill: '#ff9a1a' }),
    C('a stone lantern'),
    path('M1520 900v-30h80v30zM1534 870v-60h52v60zM1510 810l50 -30l50 30z', { fill: '#9a948a' }), path('M1542 862v-40h36v40z', { fill: '#ffcf6a' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'color', x: r(ppl.rabbit[0]), y: r(ppl.rabbit[1]), r: 44, label: 'Color the rabbit lantern' },
      { activity: 'card', x: r(ppl.riddle[0]), y: r(ppl.riddle[1]), r: 36, label: 'Write a lantern riddle' },
      { activity: 'memory', x: r(ppl.tangyuan[0]), y: r(ppl.tangyuan[1]), r: 40, label: 'Match the tangyuan' },
      { activity: 'wish', x: 150, y: 150, r: 64, label: 'Make a wish on the full moon' },
      { activity: 'catch', x: r(ppl.carp[0]), y: r(ppl.carp[1]), r: 44, label: 'Catch the floating lanterns' },
    ],
    findables: [
      { id: 'dragon', label: 'the golden dragon', x: 880, y: 610, r: 40 },
      { id: 'pearl', label: 'the dragon\'s pearl', x: ppl.pearl[0], y: ppl.pearl[1], r: 20 },
      { id: 'cat', label: 'a cat asleep under the stall', x: ppl.cat[0], y: ppl.cat[1], r: 20 },
      { id: 'kumquats', label: 'a kumquat tree', x: 66, y: 796, r: 30 },
      { id: 'pagoda', label: 'the pagoda', x: 1440, y: 420, r: 40 },
      { id: 'tail', label: 'the dragon\'s tail', x: 1320, y: 500, r: 24 },
      { id: 'toddler-lantern', label: 'a tiny lantern', x: 300, y: 790, r: 18 },
    ],
  };
}
