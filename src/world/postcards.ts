/**
 * Draws a tracker postcard as one SVG (built with svg(), never innerHTML):
 *
 *   ┌───────────────────────────────────────┐  die-cut card: cream paper, ink outline, hard shadow
 *   │ ┌───────────────────────────── stamp ┐│  the picture: a sky set by local time (night for
 *   │ │  moon + sleigh / fireworks  postmark││  Santa and the wave), the city's skyline
 *   │ │        city skyline                 ││  (postcard-skylines.ts) and, in snowy cities, snow
 *   │ └─────────────────────────────────────┘│
 *   │ POSTCARD FROM TOKYO                    │  the local greeting, its romanisation, a kid
 *   │ メリークリスマス                         │  respelling and its meaning, then the fact
 *   │ Merī Kurisumasu · say “meh-REE …”      │
 *   │ - - - - - - - - - - - - - - - - - - -  │
 *   │ In Japan, Christmas Eve means …        │
 *   └───────────────────────────────────────┘
 *
 * Layout is pure (`layoutPostcard`) so the tests can check it; text is wrapped with a
 * conservative width estimate per script, because SVG text does not wrap by itself.
 */
import type { City } from './data/cities';
import { countryName } from './data/countries';
import type { PostcardCity } from './data/postcards';
import type { PostcardKind } from './album';
import { C, E, GY, L, P, PIC_H, PIC_W, R, add, glowAt, group, linear, mix, paletteFor, radial, seeded, snowfall, stars, type Art } from './postcard-art';
import { drawGenericSkyline, drawSkyline } from './postcard-skylines';
import { hhmm, localClock } from './zones';
import { svg } from '../ui/dom';

export interface PostcardView {
  readonly kind: PostcardKind;
  readonly city: City;
  readonly card: PostcardCity;
  /** Epoch ms of the visit: the postmark and the sky's local time. */
  readonly at: number;
}

export const CARD_W = 600;
const PAD = 20;
const TEXT_X = 30;
const TEXT_W = CARD_W - TEXT_X * 2;
const INK = '#1f1a3d';
const MUTED = '#5a5577';
const PAPER = '#fffaf0';
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// ───────────────────────────────────────────────────────── text measuring

/** Rough advance width of one character in ems (generous, so wrapped lines never overflow). */
function charEm(ch: string): number {
  const c = ch.codePointAt(0) ?? 32;
  if (c === 32) return 0.3;
  if ((c >= 0x0e31 && c <= 0x0e3a && c !== 0x0e32 && c !== 0x0e33) || (c >= 0x0e47 && c <= 0x0e4e)) return 0; // Thai marks
  if (c >= 0x0300 && c <= 0x036f) return 0; // combining accents
  if ((c >= 0x1100 && c <= 0x11ff) || (c >= 0x2e80 && c <= 0x9fff) || (c >= 0xac00 && c <= 0xd7af) || (c >= 0xff00 && c <= 0xffef)) return 1.02;
  if (c >= 0x0e00 && c <= 0x0e7f) return 0.62;
  if (c >= 0x0980 && c <= 0x09ff) return (c >= 0x09bc && c <= 0x09d7) ? 0.32 : 0.72;
  if (c >= 0x0600 && c <= 0x06ff) return 0.5;
  if ('il.,:;!|\'’‘`'.includes(ch)) return 0.3;
  if ('fjrt()[]“”"-'.includes(ch)) return 0.42;
  if ('mwMW'.includes(ch)) return 0.88;
  if (/[A-Z]/.test(ch) || (c >= 0x0391 && c <= 0x03a9) || (c >= 0x0410 && c <= 0x042f)) return 0.68;
  return 0.56;
}

/** Estimated width of `s` at `size` units (bold adds a little). */
export function textWidth(s: string, size: number, bold = false, spacing = 0): number {
  let w = 0;
  for (const ch of s) w += charEm(ch) + spacing / size;
  return w * size * (bold ? 1.06 : 1);
}

/** Greedy word wrap to `width` (a word longer than the line is split by characters). */
export function wrapText(s: string, size: number, width: number, bold = false): string[] {
  const words = s.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(next, size, bold) <= width) { line = next; continue; }
    if (line) lines.push(line);
    if (textWidth(word, size, bold) <= width) { line = word; continue; }
    // A very long word (or unspaced script): break it by characters.
    let part = '';
    for (const ch of word) {
      if (textWidth(part + ch, size, bold) > width && part) { lines.push(part); part = ''; }
      part += ch;
    }
    line = part;
  }
  if (line) lines.push(line);
  return lines;
}

// ───────────────────────────────────────────────────────── layout

export interface TextLine {
  readonly text: string;
  readonly y: number;
  readonly size: number;
  readonly role: 'label' | 'greeting' | 'roman' | 'say' | 'meaning' | 'fact';
}

export interface PostcardLayout {
  readonly height: number;
  readonly lines: readonly TextLine[];
  readonly dividerY: number;
  readonly postmark: { readonly city: string; readonly time: string; readonly date: string };
}

/** The card's words, in the order they are read. */
export function postcardWords(v: PostcardView): { label: string; greeting: string; roman: string | null; say: string; meaning: string; fact: string } {
  const side = v.kind === 'christmas' ? v.card.christmas : v.card.newYear;
  const g = side.greeting;
  return {
    label: `Postcard from ${v.city.name}`,
    greeting: g.text,
    roman: g.roman ?? null,
    say: `Say it: ${g.sayIt}`,
    meaning: `${g.langName}: “${g.meaning}”`,
    fact: side.fact,
  };
}

export function postmarkFor(v: PostcardView): { city: string; time: string; date: string } {
  const lc = localClock(v.city.tz, new Date(v.at));
  return { city: v.city.name.toUpperCase(), time: hhmm(lc.h, lc.min), date: `${lc.d} ${MONTHS[lc.m - 1]} ${lc.y}` };
}

export function layoutPostcard(v: PostcardView): PostcardLayout {
  const w = postcardWords(v);
  const lines: TextLine[] = [];
  let y = PAD + PIC_H + 40;
  lines.push({ text: w.label.toUpperCase(), y, size: 17, role: 'label' });
  y += 12;
  // The greeting: as big as fits on one line (44 → 30), else wrapped at 30.
  let gs = 46;
  while (gs > 30 && textWidth(w.greeting, gs, true) > TEXT_W) gs -= 2;
  for (const t of wrapText(w.greeting, gs, TEXT_W, true)) { y += gs * 1.1; lines.push({ text: t, y, size: gs, role: 'greeting' }); }
  y += 6;
  const small = (text: string, size: number, role: TextLine['role']): void => {
    for (const t of wrapText(text, size, TEXT_W)) { y += size * 1.3; lines.push({ text: t, y, size, role }); }
  };
  if (w.roman) small(w.roman, 22, 'roman');
  small(w.say, 20, 'say');
  small(w.meaning, 19, 'meaning');
  y += 18;
  const dividerY = y;
  y += 8;
  for (const t of wrapText(w.fact, 23, TEXT_W)) { y += 31; lines.push({ text: t, y, size: 23, role: 'fact' }); }
  y += 28;
  return { height: Math.round(y), lines, dividerY, postmark: postmarkFor(v) };
}

/** What a screen reader hears for the card. */
export function postcardLabel(v: PostcardView): string {
  const w = postcardWords(v);
  const pm = postmarkFor(v);
  const country = countryName(v.city.country);
  const roman = w.roman ? ` (${w.roman})` : '';
  return `${w.label}, ${country}. ${w.greeting}${roman}. ${w.say}. ${w.meaning}. ${w.fact} Postmarked ${pm.time} on ${pm.date}.`;
}

// ───────────────────────────────────────────────────────── drawing

let uidSeq = 0;

/** The sleigh and reindeer, small and in colour, flying left past the moon. */
function sleigh(a: Art, x: number, y: number, s: number): void {
  const done = group(a, { transform: `translate(${x} ${y}) scale(${s})` });
  const deer = '#9a6a48';
  const antler = '#e8c9a0';
  const harness = '#e2b04a';
  for (const dx of [0, 34]) {
    // Galloping legs, body, neck and head, antlers.
    L(a, `M${dx + 6} 22L${dx - 2} 28M${dx + 9} 22L${dx + 3} 29M${dx + 20} 22L${dx + 28} 27M${dx + 17} 22L${dx + 23} 29`, deer, 2.5);
    E(a, dx + 13, 18, 11, 5.5, deer);
    P(a, `M${dx + 5} 17Q${dx + 1} 12 ${dx + 1} 8L${dx + 6} 9Q${dx + 7} 13 ${dx + 10} 15Z`, deer);
    E(a, dx + 1, 8, 4.5, 3, deer);
    L(a, `M${dx + 2} 6L${dx + 5} 0M${dx + 3.5} 3L${dx + 8} 2M${dx} 6L${dx - 2} 1`, antler, 2);
    C(a, dx - 2.5, 8.5, 1.4, '#3a2a22');
  }
  L(a, `M14 16L36 16M48 16L70 21`, harness, 1.6);
  // The sleigh: curled runner, red body, Santa and his sack.
  L(a, `M64 34H104Q110 34 110 28M64 34Q58 34 58 29`, harness, 2.5);
  L(a, `M72 30V34M98 30V34`, harness, 2);
  P(a, `M66 18H104Q108 18 107 23L104 30H74Q66 30 64 22Q64 18 66 18Z`, '#d8322a');
  R(a, 66, 18, 40, 3.5, harness, 1.5);
  C(a, 98, 11, 7.5, '#8a5a3c');
  C(a, 84, 13, 7, '#d8322a');
  C(a, 83, 4.5, 4.5, '#f2c8a8');
  P(a, `M79 6Q83 12 87 6Q86 10 83 11Q80 10 79 6Z`, '#ffffff');
  P(a, `M79 3Q83 -4 90 0L88 3Z`, '#d8322a');
  C(a, 90.5, 0.5, 2, '#ffffff');
  done();
}

/** A firework burst: tapering rays and sparks around a soft glow. */
function burst(a: Art, cx: number, cy: number, r: number, color: string, n = 14): void {
  glowAt(a, `fw${Math.round(cx)}`, cx, cy, r * 1.3, r * 1.3, color, 0.45);
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + 0.2;
    const x0 = cx + Math.cos(ang) * r * 0.3;
    const y0 = cy + Math.sin(ang) * r * 0.3;
    const x1 = cx + Math.cos(ang) * r;
    const y1 = cy + Math.sin(ang) * r;
    L(a, `M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`, color, 2.6);
    C(a, cx + Math.cos(ang) * r * 1.16, cy + Math.sin(ang) * r * 1.16, 2, '#fff6d8');
  }
  C(a, cx, cy, 3, '#fff6d8');
}

/** Green curtains of northern lights. */
function aurora(a: Art): void {
  const fill = linear(a, 'aurora', [[0, '#7affc8', 0], [0.45, '#5af0a8', 0.55], [1, '#3ad0a0', 0]]);
  P(a, 'M100 40Q200 10 300 44T520 30L540 120Q420 90 300 126T120 112Z', fill, { opacity: 0.75 });
  P(a, 'M200 80Q300 54 400 86T560 70V150Q460 120 380 150T210 140Z', fill, { opacity: 0.5 });
}

function picture(a: Art, v: PostcardView, hour: number): void {
  const p = a.pal;
  R(a, -2, -2, PIC_W + 4, PIC_H + 4, linear(a, 'sky', [[0, p.skyTop], [0.72, p.skyBottom], [1, mix(p.skyBottom, p.glow, 0.35)]]));
  glowAt(a, 'cityglow', PIC_W / 2, GY - 10, PIC_W * 0.8, 70, p.glow, 0.32 * (0.4 + 0.6 * p.night));
  const moon = { x: 88, y: 66, r: 28 };
  stars(a, 46, { x: moon.x, y: moon.y, r: 50 });
  if (v.card.id === 'reykjavik' || v.card.id === 'anchorage') aurora(a);
  if (v.kind === 'christmas') {
    if (p.night > 0.4) {
      E(a, moon.x, moon.y, 70, 70, radial(a, 'moonglow', [[0, '#fff1c9', 0.5], [0.4, '#fff1c9', 0.18], [1, '#fff1c9', 0]]));
      C(a, moon.x, moon.y, moon.r, '#fff4d6');
      C(a, moon.x - 9, moon.y - 6, 6, '#efe2bf');
      C(a, moon.x + 8, moon.y + 9, 4.5, '#efe2bf');
      C(a, moon.x + 11, moon.y - 10, 3, '#efe2bf');
    } else {
      C(a, moon.x, moon.y, 22, '#fff1b0', { opacity: 0.9 });
    }
    sleigh(a, 70, 80, 0.95);
  } else {
    burst(a, 92, 70, 34, '#ffd166');
    burst(a, 214, 52, 26, '#ff7eb6', 12);
    burst(a, 318, 44, 22, '#7ad7ff', 12);
  }
  if (!drawSkyline(a, v.card.id)) drawGenericSkyline(a);
  if (v.card.climate === 'snowy') snowfall(a, 70);
  void hour;
}

/** The stamp in the corner: a perforated edge and a little Christmas tree or firework. */
function stamp(a: Art, kind: PostcardKind): void {
  const x = 470;
  const y = 30;
  const w = 90;
  const h = 108;
  const done = group(a, { transform: `rotate(5 ${x + w / 2} ${y + h / 2})` });
  const maskId = `${a.uid}-perf`;
  const mask = svg('mask', { id: maskId });
  mask.append(svg('rect', { x: x - 4, y: y - 4, width: w + 8, height: h + 8, fill: '#fff' }));
  for (let i = 0; i <= 9; i++) {
    for (const yy of [y, y + h]) mask.append(svg('circle', { cx: x + (w * i) / 9, cy: yy, r: 3.6, fill: '#000' }));
  }
  for (let i = 0; i <= 11; i++) {
    for (const xx of [x, x + w]) mask.append(svg('circle', { cx: xx, cy: y + (h * i) / 11, r: 3.6, fill: '#000' }));
  }
  a.defs.append(mask);
  R(a, x + 3, y + 4, w, h, '#000', 0, { opacity: 0.25 });
  R(a, x, y, w, h, '#fffdf6', 0, { mask: `url(#${maskId})` });
  const panel = kind === 'christmas' ? '#b8233a' : '#2b3a8f';
  R(a, x + 9, y + 9, w - 18, h - 18, panel, 4);
  const cx = x + w / 2;
  if (kind === 'christmas') {
    R(a, cx - 4, y + 78, 8, 12, '#7a4a32', 1.5);
    for (const [ty, tw, th] of [[80, 30, 22], [64, 24, 20], [48, 17, 18]] as const) {
      P(a, `M${cx - tw} ${y + ty}Q${cx} ${y + ty + 4} ${cx + tw} ${y + ty}L${cx + 2} ${y + ty - th}Q${cx} ${y + ty - th - 2} ${cx - 2} ${y + ty - th}Z`, '#2f9a5a');
    }
    for (const [bx, by, c] of [[cx - 12, 74, '#ffd166'], [cx + 10, 70, '#7ad7ff'], [cx - 4, 58, '#ff7eb6'], [cx + 6, 50, '#ffd166']] as const) C(a, bx, y + by, 3, c);
    let d = '';
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? 8 : 3.5;
      d += `${i ? 'L' : 'M'}${(cx + Math.cos(ang) * rr).toFixed(1)} ${(y + 26 + Math.sin(ang) * rr).toFixed(1)}`;
    }
    P(a, `${d}Z`, '#ffd166', { 'stroke-linejoin': 'round' });
  } else {
    burst(a, cx, y + 46, 22, '#ffd166', 12);
    burst(a, cx - 16, y + 80, 10, '#ff7eb6', 8);
    burst(a, cx + 18, y + 76, 9, '#7ad7ff', 8);
  }
  done();
}

/**
 * The round postmark with the city, the local time and the date. It overlaps the stamp's lower
 * left corner, and its wavy cancel lines run across the stamp (never over the landmark).
 */
function postmark(a: Art, pm: { city: string; time: string; date: string }): void {
  const cx = 452;
  const cy = 142;
  const ink = '#fff3d6';
  const done = group(a, { opacity: 0.92, transform: `rotate(-8 ${cx} ${cy})` });
  for (let i = 0; i < 3; i++) {
    const yy = cy - 22 + i * 12;
    let d = `M${cx + 44} ${yy}`;
    for (let x = cx + 44; x < 566; x += 20) d += 'q5 -5 10 0t10 0';
    L(a, d, ink, 2.5);
  }
  add(a, 'circle', { cx, cy, r: 41, fill: 'rgba(20,16,50,0.35)', stroke: ink, 'stroke-width': 3 });
  add(a, 'circle', { cx, cy, r: 34, fill: 'none', stroke: ink, 'stroke-width': 1.5 });
  const font = 'font-family:var(--font-display, ui-rounded, system-ui, sans-serif);font-weight:700';
  const citySize = Math.max(7, Math.min(10.5, 58 / (pm.city.length * 0.68)));
  const t1 = add(a, 'text', { x: cx, y: cy - 12, 'text-anchor': 'middle', fill: ink, 'font-size': citySize.toFixed(1), style: `${font};letter-spacing:0.5px` });
  t1.textContent = pm.city;
  const t2 = add(a, 'text', { x: cx, y: cy + 8, 'text-anchor': 'middle', fill: ink, 'font-size': 21, style: font });
  t2.textContent = pm.time;
  const t3 = add(a, 'text', { x: cx, y: cy + 22, 'text-anchor': 'middle', fill: ink, 'font-size': 9, style: font });
  t3.textContent = pm.date;
  done();
}

/**
 * The whole postcard as an <svg> with role="img" and a full spoken label. Width is CSS-driven
 * (it scales to its container); the viewBox is 600 wide and as tall as the text needs.
 */
export function drawPostcard(v: PostcardView): SVGSVGElement {
  const uid = `pc${++uidSeq}`;
  const lay = layoutPostcard(v);
  const H = lay.height;
  const el = svg('svg', { viewBox: `-4 -4 ${CARD_W + 14} ${H + 14}`, role: 'img', 'aria-label': postcardLabel(v), class: 'postcard-svg' });
  const title = svg('title');
  title.textContent = `${postcardWords(v).label}: ${postcardWords(v).greeting}`;
  const desc = svg('desc');
  desc.textContent = v.card.skyline;
  const defs = svg('defs');
  const root = svg('g');
  el.append(title, desc, defs, root);
  const lc = localClock(v.city.tz, new Date(v.at));
  const hour = lc.h + lc.min / 60;
  const a: Art = { g: root, defs, uid, pal: paletteFor(hour), rnd: seeded(`${v.card.id}:${v.kind}`), snowy: v.card.climate === 'snowy' };

  // The die-cut card: hard ink shadow, cream paper, ink outline.
  R(a, 6, 6, CARD_W, H, INK, 26);
  R(a, 0, 0, CARD_W, H, PAPER, 26, { stroke: INK, 'stroke-width': 4 });

  // The picture, clipped to a rounded window.
  const clipId = `${uid}-clip`;
  const clip = svg('clipPath', { id: clipId });
  clip.append(svg('rect', { x: 0, y: 0, width: PIC_W, height: PIC_H, rx: 16 }));
  defs.append(clip);
  const donePic = group(a, { transform: `translate(${PAD} ${PAD})`, 'clip-path': `url(#${clipId})` });
  picture(a, v, hour);
  donePic();
  R(a, PAD, PAD, PIC_W, PIC_H, 'none', 16, { stroke: INK, 'stroke-width': 3 });

  stamp(a, v.kind);
  postmark(a, lay.postmark);

  // The words.
  const display = 'font-family:var(--font-display, ui-rounded, system-ui, sans-serif)';
  const body = 'font-family:var(--font-body, ui-rounded, system-ui, sans-serif)';
  const accent = v.kind === 'christmas' ? '#b8233a' : '#4a35c8';
  const lang = (v.kind === 'christmas' ? v.card.christmas : v.card.newYear).greeting.lang;
  for (const line of lay.lines) {
    const attrs: Record<string, string | number> = { x: TEXT_X, y: line.y.toFixed(1), 'font-size': line.size };
    switch (line.role) {
      case 'label': Object.assign(attrs, { fill: accent, style: `${display};font-weight:700;letter-spacing:2px` }); break;
      case 'greeting': Object.assign(attrs, { fill: INK, style: `${display};font-weight:700`, lang }); break;
      case 'roman': Object.assign(attrs, { fill: INK, style: `${body};font-style:italic;font-weight:600` }); break;
      case 'say': Object.assign(attrs, { fill: MUTED, style: `${body};font-weight:600` }); break;
      case 'meaning': Object.assign(attrs, { fill: MUTED, style: body }); break;
      case 'fact': Object.assign(attrs, { fill: INK, style: body }); break;
    }
    add(a, 'text', attrs).textContent = line.text;
  }
  L(a, `M${TEXT_X} ${lay.dividerY}H${CARD_W - TEXT_X}`, mix(INK, PAPER, 0.7), 2.5, { 'stroke-dasharray': '2 9' });
  return el;
}
