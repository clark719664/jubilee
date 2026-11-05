// Groundhog Day — "Will he see his shadow?": a snowy knoll on a bright February morning. The groundhog pops out
// of his tree-stump burrow, paws up, and spots his long blue shadow stretching across the snow (the sun is
// peeking out of the clouds in the corner). Round the little rope fence with bunting the town waits: a girl in a
// groundhog-ears hat holds up a sun sign, mum has a flask, grandpa in a top hat holds the scroll, a boy holds up
// a snowflake sign, another watches through binoculars. A cardinal in the bare tree, a rabbit by the pines, a
// sled and a snowman. The snowflakes are the effect's.
import { f, P, mix, lighten, darken, rng, E, G, C, path, circle, ellipse, lin, rad, doc, compactSvg, setPrecision } from '../../gen-xmas/lib.mjs';
import { figure } from '../../gen-kw/people.mjs';
import { bareTree, pineSil, bobbleHat, scarf, line, circD, terrace } from '../../kit/scenekit.mjs';

const ID = 'groundhog-day';
const id = (s) => `${ID}-${s}`;
const url = (s) => `url(#${ID}-${s})`;

const SNOW = '#f6fafd', SHADE = '#c8d8e8', FUR = '#8b5a2b';
const SKIN = { light: '#f0c4a0', fair: '#e8b48a', tan: '#c98a5a', brown: '#9a6440', deep: '#6b4028' };
const SUN = { x: 1468, y: 150 };

// ---- layout
const STUMP = { x: 800, top: 652, base: 742, rx: 72, ry: 18 };
const KNOLL = 'M440 800C520 700 640 640 800 636C960 640 1080 700 1160 800Z';

// ============================== back ==============================
export function back() {
  setPrecision(1);
  const town = terrace(-20, 300, 610, 4, { hMin: 40, hMax: 64, wMin: 50, wMax: 80 });
  let pines = '';
  const R = rng(9);
  for (let x = 300; x < 1600; x += 34 + R() * 40) { const h = 40 + R() * 40; pines += pineSil(x, 600 + R() * 10, h, h * 0.6); }
  let rays = '';
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2, a1 = a - 0.06, a2 = a + 0.06; rays += `M${P(SUN.x + Math.cos(a1) * 70, SUN.y + Math.sin(a1) * 70)}L${P(SUN.x + Math.cos(a) * (k % 2 ? 100 : 120), SUN.y + Math.sin(a) * (k % 2 ? 100 : 120))}L${P(SUN.x + Math.cos(a2) * 70, SUN.y + Math.sin(a2) * 70)}Z`; }
  const defs = [
    rad(id('sunglow'), 0.5, 0.5, 0.5, [[0, '#fff6c0', 0.95], [0.4, '#ffe08a', 0.4], [1, '#ffe08a', 0]]),
    rad(id('sun'), 0.4, 0.35, 0.7, [[0, '#fffbe0'], [0.6, '#ffe066'], [1, '#ffc23a']]),
    lin(id('far'), 0, 0, 0, 1, [[0, '#e4eef6'], [1, '#d0e0ec']]),
  ];
  return compactSvg(doc(`Groundhog Day · back: a pale February sky; the morning sun peeking out from behind a bank of clouds in the top-right corner; far snowy hills with rows of pines; a little town with a red barn and a church far away on the left`, defs, [
    C('the sun peeking out of the clouds, top right (outside the copy zone)'),
    circle(SUN.x, SUN.y, 190, { fill: url('sunglow') }),
    path(rays, { fill: '#ffd84a', opacity: 0.8 }),
    circle(SUN.x, SUN.y, 62, { fill: url('sun') }),
    path('M1310 236c-30 0 -40 -40 -6 -48c0 -34 46 -44 62 -16c20 -26 66 -16 64 18c30 -4 44 30 24 46z', { fill: '#ffffff' }),
    path('M1312 236h142', { fill: 'none', stroke: '#dce8f2', 'stroke-width': 6, 'stroke-linecap': 'round' }),
    path('M1500 110c-16 0 -20 -24 -2 -28c2 -20 30 -22 38 -6c14 -12 38 -2 34 16c18 0 22 18 8 18z', { fill: '#ffffff', opacity: 0.9 }),
    C('far hills, pines and the little town'),
    path('M-20 640V560Q260 520 560 552T1100 540T1620 548V640Z', { fill: url('far') }),
    path(pines, { fill: '#7a9aa8' }),
    path('M-20 660V600Q300 580 640 604T1300 596T1620 604V660Z', { fill: '#e8f0f6' }),
    path(town.d, { fill: '#9ab0c0' }),
    path('M230 610V560L262 536L294 560V610Z', { fill: '#c85040' }), path('M248 610v-24h28v24z', { fill: '#f4ece4' }),
    path('M120 610V548h20V610ZM116 550L130 506L144 550Z', { fill: '#9ab0c0' }),
  ], '0 0 1600 900'));
}

// ============================== mid ==============================
export function mid() {
  setPrecision(1);
  const out = [];
  const ppl = {};
  const defs = [
    lin(id('snow'), 0, 0, 0, 1, [[0, '#ffffff'], [1, '#dce8f2']]),
    lin(id('knoll'), 0, 0, 0, 1, [[0, '#ffffff'], [1, '#e4eef6']]),
    lin(id('bark'), 0, 0, 1, 0, [[0, '#8a5a3a'], [0.5, '#a8744a'], [1, '#6a4028']]),
    rad(id('rings'), 0.5, 0.5, 0.5, [[0, '#f0d0a0'], [1, '#c89a68']]),
    lin(id('fur'), 0, 0, 0, 1, [[0, '#a06a36'], [1, '#7a4a22']]),
  ];

  // ---- the snowfield and the knoll
  out.push(C('the snowfield and the knoll in the middle'));
  out.push(path('M-20 700C300 680 600 690 800 700S1300 690 1620 680V920H-20Z', { fill: url('snow') }));
  out.push(path(KNOLL, { fill: url('knoll') }), path('M440 800C520 700 640 640 800 636C960 640 1080 700 1160 800', { fill: 'none', stroke: SHADE, 'stroke-width': 3, opacity: 0.6 }));

  // ---- the groundhog's long shadow: the sun is up and to the right, so it falls down and to the left
  out.push(C('the groundhog\'s long blue shadow stretching away from the sun across the snow'));
  out.push(path(`M${STUMP.x - 40} ${STUMP.base - 2}C${STUMP.x - 120} ${STUMP.base + 4} ${STUMP.x - 200} ${STUMP.base + 26} ${STUMP.x - 268} ${STUMP.base + 40}C${STUMP.x - 300} ${STUMP.base + 46} ${STUMP.x - 316} ${STUMP.base + 40} ${STUMP.x - 300} ${STUMP.base + 30}l-12 -14l22 6C${STUMP.x - 240} ${STUMP.base + 4} ${STUMP.x - 140} ${STUMP.base - 16} ${STUMP.x + 30} ${STUMP.base - 14}Z`, { fill: '#5a78a8', opacity: 0.55 }));
  ppl.shadow = [STUMP.x - 250, STUMP.base + 30];

  // ---- the rope fence with bunting round the knoll
  out.push(C('a little rope fence with bunting round the knoll'));
  {
    const posts = [[470, 792], [600, 742], [1000, 742], [1130, 792]];
    let p = '', caps = '';
    for (const [x, y] of posts) { p += `M${x - 5} ${y}v-60h10v60z`; caps += `M${x - 8} ${y - 60}q8 -10 16 0z`; }
    out.push(path(p, { fill: '#8a5a3a' }), path(caps, { fill: SNOW }));
    const cols = ['#e8343a', '#ffd23a', '#2a8ad8', '#3ab86a'];
    const flags = cols.map(() => '');
    let rope = '', n = 0;
    for (let i = 0; i < posts.length - 1; i++) {
      if (i === 1) continue;                                                  // the gap in front of the stump stays open
      const [x1, y1] = posts[i], [x2, y2] = posts[i + 1];
      const a = [x1, y1 - 54], b = [x2, y2 - 54], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 22];
      rope += `M${P(...a)}Q${P(...m)} ${P(...b)}`;
      for (let k = 1; k < 6; k++) { const t = k / 6, x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * m[0] + t * t * b[0], y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * m[1] + t * t * b[1]; flags[n++ % 4] += `M${P(x - 6, y)}h12l-6 13z`; }
    }
    out.push(line(rope, '#c8a070', 2.4));
    flags.forEach((d, k) => out.push(path(d, { fill: cols[k] })));
  }

  // ---- the stump burrow and the groundhog popping out
  out.push(C('the focal point: the groundhog pops out of his tree-stump burrow, paws up, eyes wide, looking back at his shadow'));
  {
    const S = STUMP;
    out.push(ellipse(S.x, S.base + 4, S.rx + 16, 10, { fill: '#9ab0c8', opacity: 0.4 }));
    out.push(path(`M${S.x - S.rx} ${S.top}V${S.base}q${S.rx} 16 ${2 * S.rx} 0V${S.top}Z`, { fill: url('bark') }));
    out.push(line(`M${S.x - 50} ${S.top + 16}v60M${S.x - 22} ${S.top + 20}v66M${S.x + 12} ${S.top + 18}v70M${S.x + 44} ${S.top + 14}v58`, '#6a4028', 3, { opacity: 0.6 }));
    out.push(path(`M${S.x - S.rx - 10} ${S.base}q10 -20 26 -8l4 14zM${S.x + S.rx + 10} ${S.base}q-10 -20 -26 -8l-4 14z`, { fill: '#7a4a2a' }));
    out.push(path(`M${S.x - 30} ${S.base}v-34a30 30 0 0 1 60 0v34z`, { fill: '#3a2414' }), path(`M${S.x - 30} ${S.base}v-34a30 30 0 0 1 60 0v34`, { fill: 'none', stroke: '#c89a68', 'stroke-width': 4 }));
    out.push(ellipse(S.x, S.top, S.rx, S.ry, { fill: url('rings') }));
    out.push(path(`M${S.x - S.rx + 6} ${S.top - 4}q${S.rx - 6} -18 ${2 * S.rx - 12} 0`, { fill: 'none', stroke: SNOW, 'stroke-width': 6, 'stroke-linecap': 'round' }));
    // the groundhog: body rising out of the stump's hollow top
    const gx = S.x, gy = S.top;
    const g = [];
    g.push(ellipse(gx, gy + 2, 40, 10, { fill: '#3a2414' }));
    g.push(path(`M${gx - 34} ${gy + 4}C${gx - 40} ${gy - 40} ${gx - 30} ${gy - 70} ${gx} ${gy - 72}C${gx + 30} ${gy - 70} ${gx + 40} ${gy - 40} ${gx + 34} ${gy + 4}Z`, { fill: url('fur') }));
    g.push(path(`M${gx - 20} ${gy + 4}C${gx - 22} ${gy - 30} ${gx - 14} ${gy - 46} ${gx} ${gy - 46}C${gx + 14} ${gy - 46} ${gx + 22} ${gy - 30} ${gx + 20} ${gy + 4}Z`, { fill: '#e8c89a' }));
    // paws up in surprise
    g.push(path(`M${gx - 30} ${gy - 30}q-20 -10 -22 -34`, { fill: 'none', stroke: FUR, 'stroke-width': 12, 'stroke-linecap': 'round' }), path(`M${gx + 30} ${gy - 30}q20 -10 22 -34`, { fill: 'none', stroke: FUR, 'stroke-width': 12, 'stroke-linecap': 'round' }));
    g.push(path(circD(gx - 52, gy - 66, 8) + circD(gx + 52, gy - 66, 8), { fill: '#6a3a1a' }), line(`M${gx - 58} ${gy - 70}l-2 -6M${gx - 52} ${gy - 72}v-6M${gx - 46} ${gy - 70}l2 -6M${gx + 58} ${gy - 70}l2 -6M${gx + 52} ${gy - 72}v-6M${gx + 46} ${gy - 70}l-2 -6`, '#3a2414', 2));
    // head
    const hy = gy - 92;
    g.push(circle(gx - 26, hy - 22, 9, { fill: FUR }), circle(gx + 26, hy - 22, 9, { fill: FUR }), circle(gx - 26, hy - 22, 4.5, { fill: '#c89a68' }), circle(gx + 26, hy - 22, 4.5, { fill: '#c89a68' }));
    g.push(ellipse(gx, hy, 34, 30, { fill: url('fur') }));
    g.push(ellipse(gx, hy + 12, 20, 14, { fill: '#e8c89a' }));
    g.push(ellipse(gx - 13, hy - 6, 6.6, 8, { fill: '#2a1a14' }), ellipse(gx + 13, hy - 6, 6.6, 8, { fill: '#2a1a14' }), circle(gx - 15, hy - 9, 2.4, { fill: '#ffffff' }), circle(gx + 11, hy - 9, 2.4, { fill: '#ffffff' }));
    g.push(path(`M${gx - 22} ${hy - 18}l10 -4M${gx + 22} ${hy - 18}l-10 -4`, { fill: 'none', stroke: '#4a2a14', 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
    g.push(ellipse(gx, hy + 4, 6, 4.4, { fill: '#3a2014' }));
    g.push(ellipse(gx, hy + 16, 6, 5, { fill: '#7a2a2a' }), path(`M${gx - 5} ${hy + 10}h10v8h-10z`, { fill: '#ffffff' }), path(`M${gx} ${hy + 10}v8`, { fill: 'none', stroke: '#d8d0c8', 'stroke-width': 1.2 }));
    g.push(line(`M${gx - 14} ${hy + 8}l-16 -2M${gx - 14} ${hy + 12}l-16 4M${gx + 14} ${hy + 8}l16 -2M${gx + 14} ${hy + 12}l16 4`, '#4a2a14', 1.4, { opacity: 0.7 }));
    g.push(ellipse(gx - 22, hy + 8, 6, 3.4, { fill: '#ff8a8a', opacity: 0.5 }), ellipse(gx + 22, hy + 8, 6, 3.4, { fill: '#ff8a8a', opacity: 0.5 }));
    out.push(...g);
    // the stump's front lip over the groundhog's middle
    out.push(path(`M${S.x - S.rx} ${S.top}a${S.rx} ${S.ry} 0 0 0 ${2 * S.rx} 0v6a${S.rx} ${S.ry} 0 0 1 ${-2 * S.rx} 0z`, { fill: '#a8744a' }));
    out.push(path(`M${S.x - S.rx + 4} ${S.top + 8}a${S.rx - 4} ${S.ry - 2} 0 0 0 ${2 * S.rx - 8} 0`, { fill: 'none', stroke: SNOW, 'stroke-width': 7, 'stroke-linecap': 'round' }));
    ppl.groundhog = [gx, hy];
  }

  // ---- the crowd: left, a girl with a sun sign and mum with a flask
  out.push(C('the crowd on the left: a girl in a groundhog-ears hat holding up a sun sign, mum with a flask'));
  const sign = (hx, hy, kind) => {
    const g = [line(`M${P(hx, hy + 30)}V${f(hy - 50)}`, '#a8744a', 5), path(`M${P(hx - 34, hy - 112)}h68v64h-68z`, { fill: '#ffffff' }), path(`M${P(hx - 34, hy - 112)}h68v64h-68z`, { fill: 'none', stroke: '#c8d0dc', 'stroke-width': 3 })];
    if (kind === 'sun') {
      let r = '';
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; r += `M${P(hx + Math.cos(a) * 18, hy - 80 + Math.sin(a) * 18)}L${P(hx + Math.cos(a) * 26, hy - 80 + Math.sin(a) * 26)}`; }
      g.push(line(r, '#ffb81a', 4), circle(hx, hy - 80, 13, { fill: '#ffd23a' }));
    } else {
      let r = '';
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; r += `M${P(hx, hy - 80)}L${P(hx + Math.cos(a) * 24, hy - 80 + Math.sin(a) * 24)}M${P(hx + Math.cos(a) * 14, hy - 80 + Math.sin(a) * 14)}l${f(Math.cos(a + 0.8) * 7)} ${f(Math.sin(a + 0.8) * 7)}M${P(hx + Math.cos(a) * 14, hy - 80 + Math.sin(a) * 14)}l${f(Math.cos(a - 0.8) * 7)} ${f(Math.sin(a - 0.8) * 7)}`; }
      g.push(line(r, '#4aa8f0', 3.6));
    }
    return g.join('');
  };
  {
    const gx = 376, gf = 852;
    const hold = { sx: 1, elbow: [0.9, -0.2], hand: [1.3, -1.4] };
    const girl = figure({ x: gx, foot: gf, H: 80, heads: 2.7, skin: SKIN.fair, hair: '#c8642a', style: 'bob', top: '#e8343a', bottom: '#2a3a6a', shoe: '#2a2a3a', gaze: 0.5, mouth: 'open', arms: [{ sx: -1, elbow: [-0.7, 1.0], hand: [-0.5, 1.9] }, hold] });
    const h = girl.hand(hold);
    out.push(sign(h[0], h[1], 'sun'));
    out.push(girl.svg, scarf(gx, girl.torsoTop - 1, girl.r * 1.8, '#ffd23a', -1));
    // the groundhog-ears hat
    const r = girl.r, hy = girl.headY;
    out.push(path(`M${P(gx - r * 1.06, hy - r * 0.2)}C${P(gx - r * 1.1, hy - r * 1.5)} ${P(gx + r * 1.1, hy - r * 1.5)} ${P(gx + r * 1.06, hy - r * 0.2)}Q${P(gx, hy - r * 0.6)} ${P(gx - r * 1.06, hy - r * 0.2)}Z`, { fill: FUR }));
    out.push(circle(gx - r * 0.78, hy - r * 1.0, r * 0.3, { fill: FUR }), circle(gx + r * 0.78, hy - r * 1.0, r * 0.3, { fill: FUR }), circle(gx - r * 0.78, hy - r * 1.0, r * 0.15, { fill: '#e8c89a' }), circle(gx + r * 0.78, hy - r * 1.0, r * 0.15, { fill: '#e8c89a' }));
    out.push(circle(h[0], h[1], r * 0.36, { fill: SKIN.fair }));
    ppl.sunSign = [h[0], h[1] - 80];
    ppl.ears = [gx, hy - r];
    const mx = 280, mf = 848;
    const cup = { sx: 1, elbow: [0.6, 1.1], hand: [0.2, 1.4] };
    const mum = figure({ x: mx, foot: mf, H: 116, heads: 3.2, skin: SKIN.fair, hair: '#5a3a22', style: 'side', top: '#2a6a8a', bottom: '#3a3a4a', gaze: 0.5, mouth: 'smile', arms: [{ sx: -1, elbow: [-0.6, 1.1], hand: [-0.3, 2.0] }, cup] });
    out.push(mum.svg, scarf(mx, mum.torsoTop - 2, mum.r * 1.7, '#e8343a', 1), bobbleHat(mx, mum.headY, mum.r, '#2ab8a8', '#ffffff', '#ffffff', -6));
    const ch = mum.hand(cup);
    out.push(path(`M${P(ch[0] - 8, ch[1] - 18)}h16v18h-16z`, { fill: '#e8343a' }), circle(ch[0], ch[1], mum.r * 0.34, { fill: SKIN.fair }));
  }

  // ---- the crowd: right, grandpa in a top hat with a scroll, a boy with a snowflake sign, a girl with binoculars
  out.push(C('the crowd on the right: grandpa in a top hat reading the scroll, a boy holding up a snowflake sign, a girl with binoculars'));
  {
    const gx = 1218, gf = 846;
    const scrollA = { sx: -1, elbow: [-0.9, 1.0], hand: [-0.7, 1.4] }, scrollB = { sx: 1, elbow: [0.9, 1.0], hand: [0.7, 1.4] };
    const gp = figure({ x: gx, foot: gf, H: 118, heads: 3.3, skin: SKIN.deep, hair: '#dcd8e0', style: 'short', top: '#2a2a3a', bottom: '#2a2a3a', gaze: -0.5, mouth: 'open', arms: [scrollA, scrollB] });
    out.push(gp.svg, scarf(gx, gp.torsoTop - 2, gp.r * 1.7, '#c8102e', -1));
    const r = gp.r, hy = gp.headY;
    out.push(path(`M${P(gx - r * 1.5, hy - r * 0.62)}h${f(r * 3)}v${f(-r * 0.2)}h${f(-r * 3)}z`, { fill: '#1a1a24' }), path(`M${P(gx - r * 0.9, hy - r * 0.8)}v${f(-r * 1.6)}h${f(r * 1.8)}v${f(r * 1.6)}z`, { fill: '#1a1a24' }), path(`M${P(gx - r * 0.9, hy - r * 1.1)}h${f(r * 1.8)}v${f(-r * 0.24)}h${f(-r * 1.8)}z`, { fill: '#c8102e' }));
    const a = gp.hand(scrollA), b = gp.hand(scrollB);
    out.push(path(`M${P(a[0] - 4, a[1] - 26)}H${f(b[0] + 4)}v34H${f(a[0] - 4)}z`, { fill: '#fff4dc' }), path(`M${P(a[0] - 8, a[1] - 30)}v42M${P(b[0] + 8, b[1] - 30)}v42`, { fill: 'none', stroke: '#c8a070', 'stroke-width': 7, 'stroke-linecap': 'round' }), line(`M${P(a[0] + 4, a[1] - 18)}h${f(b[0] - a[0] - 8)}M${P(a[0] + 4, a[1] - 10)}h${f(b[0] - a[0] - 16)}M${P(a[0] + 4, a[1] - 2)}h${f(b[0] - a[0] - 12)}`, '#c8b090', 2));
    out.push(circle(a[0], a[1], r * 0.34, { fill: SKIN.deep }), circle(b[0], b[1], r * 0.34, { fill: SKIN.deep }));
    ppl.tophat = [gx, hy - r * 1.6];
    const bx = 1110, bf = 856;
    const hold = { sx: -1, elbow: [-0.9, -0.2], hand: [-1.3, -1.4] };
    const boy = figure({ x: bx, foot: bf, H: 78, heads: 2.7, skin: SKIN.tan, hair: '#1a1210', style: 'curls', top: '#2a8ad8', bottom: '#2a3a6a', shoe: '#e8343a', gaze: -0.5, mouth: 'open', arms: [hold, { sx: 1, elbow: [0.7, 1.0], hand: [0.5, 1.9] }] });
    const h = boy.hand(hold);
    out.push(sign(h[0], h[1], 'snow'));
    out.push(boy.svg, bobbleHat(bx, boy.headY, boy.r, '#ff8a1a', '#ffffff', '#ffffff', 6), circle(h[0], h[1], boy.r * 0.36, { fill: SKIN.tan }));
    ppl.snowSign = [h[0], h[1] - 80];
    const kx = 1330, kf = 852;
    const kH = 74, kr = kH / 5.2, khy = kf - kH + kr, ksy = khy + 1.8 * kr;
    const bc = [kx - 3, khy + 1];
    const toHand = (sx, x, y) => { const hx = (x - (kx + sx * kr * 1.9 * 0.46)) / kr, hy = (y - ksy) / kr; return { sx, elbow: [hx * 0.5 + sx * 0.5, hy * 0.5 + 0.6], hand: [hx, hy] }; };
    const bino = toHand(-1, bc[0] - 11, bc[1] + 9), bino2 = toHand(1, bc[0] + 11, bc[1] + 9);
    const kid = figure({ x: kx, foot: kf, H: kH, heads: 2.6, skin: SKIN.light, hair: '#e8b84a', style: 'puffs', top: '#8a5ad8', bottom: '#2a3a6a', shoe: '#ffd23a', gaze: -0.4, mouth: 'smile', arms: [bino, bino2] });
    out.push(kid.svg);
    out.push(path(`M${P(bc[0] - 13, bc[1] - 7)}h11v14h-11zM${P(bc[0] + 2, bc[1] - 7)}h11v14h-11z`, { fill: '#2a2a3a' }), path(`M${P(bc[0] - 3, bc[1] - 3)}h6v6h-6z`, { fill: '#2a2a3a' }), circle(bc[0] - 7.5, bc[1], 4.4, { fill: '#7ab0e0' }), circle(bc[0] + 7.5, bc[1], 4.4, { fill: '#7ab0e0' }), circle(bc[0] - 9, bc[1] - 1.6, 1.4, { fill: '#ffffff' }), circle(bc[0] + 6, bc[1] - 1.6, 1.4, { fill: '#ffffff' }));
    out.push(circle(bc[0] - 11, bc[1] + 9, kr * 0.36, { fill: SKIN.light }), circle(bc[0] + 11, bc[1] + 9, kr * 0.36, { fill: SKIN.light }));
    const bh = [bc[0], bc[1] + 16];
    ppl.binoculars = [bh[0], bh[1] - 16];
  }

  // ---- the bare tree with a cardinal, a sled, a snowman; pines with a rabbit on the right
  out.push(C('a bare tree with a cardinal and a sled on the left; snowy pines with a rabbit on the right'));
  {
    const t = bareTree(110, 760, 400, 3, { lean: 0.03, depth: 6, spread: 0.44 });
    out.push(path(t.d, { fill: '#5a4a44' }));
    let caps = '';
    for (const [x, y] of t.tips.filter((_, i) => i % 2 === 0)) caps += `M${P(x - 6, y + 3)}q6 -7 12 0z`;
    out.push(path(caps, { fill: SNOW }));
    const cx = 168, cy = 520;
    out.push(G({ transform: `translate(${cx} ${cy})` }, path('M-12 0c-4-14 4-22 14-18c8 3 9 12 4 18z', { fill: '#d62828' }), path('M-8 -14l-2 -12l8 8z', { fill: '#d62828' }), path('M-10 -12l-6 2l6 3z', { fill: '#ff9a1a' }), circle(-5, -14, 1.6, { fill: '#1a1010' }), path('M-9 -16l6 4', { fill: 'none', stroke: '#2a1010', 'stroke-width': 2 }), path('M6 -4l11 -3l-7 7z', { fill: '#a81a1a' })));
    ppl.cardinal = [cx, cy - 10];
    out.push(G({ transform: 'translate(180 790) rotate(-4)' }, ellipse(0, 6, 54, 5, { fill: '#000', opacity: 0.1 }), line('M-54 0H44q14 0 16 -14', '#c8102e', 5), path('M-50 -18h96v10h-96z', { fill: '#c8945a' }), line('M-34 -8v8M28 -8v8', '#8a5a3a', 5)));
    ppl.sled = [180, 776];
    let p = '';
    for (const [x, h, w] of [[1440, 240, 130], [1530, 300, 150], [1600, 220, 120]]) p += pineSil(x, 764, h, w);
    out.push(path(p, { fill: '#2a6a4a' }));
    let snowTips = '';
    for (const [x, h, w] of [[1440, 240, 130], [1530, 300, 150], [1600, 220, 120]]) for (let i = 0; i < 4; i++) { const tt = i / 4, y = 764 - h * tt * 0.86, hw = (w * (1 - tt * 0.7)) / 2; snowTips += `M${P(x - hw, y)}Q${P(x, y + 8)} ${P(x + hw, y)}L${P(x + hw * 0.78, y - 7)}Q${P(x, y)} ${P(x - hw * 0.78, y - 7)}Z`; }
    out.push(path(snowTips, { fill: SNOW }));
    const rx = 1468, ry = 790;
    out.push(G({ transform: `translate(${rx} ${ry})` }, ellipse(0, 2, 20, 4, { fill: '#000', opacity: 0.1 }), path('M-16 0c-4 -16 6 -24 18 -22c10 2 14 12 10 22z', { fill: '#ffffff' }), circle(-12, -22, 10, { fill: '#ffffff' }), path('M-16 -30c-4 -14 -2 -22 2 -22c4 0 4 10 2 22zM-8 -30c0 -14 4 -20 8 -18c2 4 -2 12 -6 18z', { fill: '#ffffff' }), path('M-15 -34c-1 -8 0 -12 1 -12M-7 -34c1 -6 3 -10 4 -10', { fill: 'none', stroke: '#ffb0c0', 'stroke-width': 2, 'stroke-linecap': 'round' }), circle(-15, -23, 1.8, { fill: '#2a1a2a' }), circle(-21, -19, 1.6, { fill: '#ff8aa0' }), circle(14, -6, 5, { fill: '#ffffff' })));
    ppl.rabbit = [rx - 8, ry - 24];
    // a little snowman by the knoll
    const sx = 560, sf = 820;
    out.push(ellipse(sx, sf + 2, 28, 5, { fill: '#000', opacity: 0.1 }), circle(sx, sf - 22, 24, { fill: SNOW }), circle(sx, sf - 60, 17, { fill: SNOW }), path(`M${sx - 24} ${sf - 22}a24 24 0 0 0 48 0a24 28 0 0 1 -48 0z`, { fill: SHADE, opacity: 0.6 }));
    out.push(path(`M${sx + 2} ${sf - 58}l16 3l-16 3z`, { fill: '#ff8a1a' }), circle(sx - 6, sf - 64, 2.2, { fill: '#1a1a1a' }), circle(sx + 6, sf - 64, 2.2, { fill: '#1a1a1a' }), path(`M${sx - 18} ${sf - 46}q18 6 36 0v7q-18 6 -36 0z`, { fill: '#3ab86a' }), path(`M${sx - 12} ${sf - 76}h24v-4h-24zM${sx - 8} ${sf - 80}v-14h16v14z`, { fill: '#2a2a3a' }));
    ppl.snowman = [sx, sf - 62];
  }

  return { svg: compactSvg(doc(`Groundhog Day · mid. Concept: "will he see his shadow?" on a bright February morning. Focal point: the groundhog popping out of his tree-stump burrow on a snowy knoll (x 700–900, y 520–760), paws up and eyes wide, his long blue shadow stretching away across the snow (the sun peeks out top right). Round the little rope fence with bunting the town waits: on the left a girl in a groundhog-ears hat holds up a sun sign and mum has a flask; on the right grandpa in a top hat reads the scroll, a boy holds up a snowflake sign, a girl watches through binoculars. A bare tree with a cardinal and a sled on the left; snowy pines with a rabbit on the right; a little snowman by the knoll. Light story: bright, cool morning light from the top right; blue shadows on the snow. The snowflakes are the effect's.`, defs, out)), ppl };
}

// ============================== front ==============================
export function front() {
  setPrecision(1);
  return compactSvg(doc(`Groundhog Day · front: snowbanks in both bottom corners with dry grass poking through; the centre stays open`, [], [
    C('a snowbank on the left'),
    path('M-20 900V846Q70 824 170 838T300 880L316 900Z', { fill: '#ffffff' }),
    path('M-20 900V866Q90 852 200 872T316 900Z', { fill: '#dce8f2' }),
    path('M40 846q-4 -30 -16 -44M54 842q4 -34 18 -50M66 846q8 -24 26 -34', { fill: 'none', stroke: '#b8a070', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    C('a snowbank on the right'),
    path('M1620 900V840Q1520 820 1420 838T1290 900Z', { fill: '#ffffff' }),
    path('M1620 900V864Q1500 852 1380 874T1290 900Z', { fill: '#dce8f2' }),
  ], '0 0 1600 900'));
}

// ============================== scene.json ==============================
export function sceneData(ppl) {
  const r = (v) => Math.round(v);
  return {
    hotspots: [
      { activity: 'colour', x: ppl.groundhog[0], y: r(ppl.groundhog[1] + 40), r: 56, label: 'Colour in the groundhog' },
      { activity: 'wish', x: 1468, y: 150, r: 60, label: 'Wish for an early spring' },
      { activity: 'dressup', x: r(ppl.tophat[0]), y: r(ppl.tophat[1] + 40), r: 50, label: 'Try on the top hat' },
      { activity: 'card', x: r(ppl.sunSign[0]), y: r(ppl.sunSign[1]), r: 40, label: 'Make a weather sign' },
    ],
    findables: [
      { id: 'shadow', label: 'the groundhog\'s shadow', x: r(ppl.shadow[0]), y: r(ppl.shadow[1]), r: 30 },
      { id: 'cardinal', label: 'a red cardinal in the tree', x: ppl.cardinal[0], y: ppl.cardinal[1], r: 16 },
      { id: 'rabbit', label: 'a white rabbit by the pines', x: ppl.rabbit[0], y: ppl.rabbit[1], r: 20 },
      { id: 'binoculars', label: 'a pair of binoculars', x: r(ppl.binoculars[0]), y: r(ppl.binoculars[1]), r: 16 },
      { id: 'sled', label: 'a red sled', x: ppl.sled[0], y: ppl.sled[1], r: 26 },
      { id: 'snowflake-sign', label: 'a snowflake sign', x: r(ppl.snowSign[0]), y: r(ppl.snowSign[1]), r: 24 },
      { id: 'ears', label: 'a hat with groundhog ears', x: r(ppl.ears[0]), y: r(ppl.ears[1]), r: 16 },
    ],
  };
}
