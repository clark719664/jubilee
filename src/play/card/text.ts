/**
 * text.ts — where the words go on each panel, as plain numbers (panel units), so the editor's DOM, the
 * printed sheet and the saved picture all put every line in exactly the same place.
 *
 * The caller passes `measure(text, px, display)`, the width of a line in a given font size: a canvas
 * `measureText` in the browser (see `canvasMeasure`), a simple estimate in tests. Long greetings shrink,
 * then wrap onto a second line, never overflow the card.
 */
import { PANEL_H, PANEL_W, type CardSpec } from './model';

export type Measure = (text: string, px: number, display: boolean) => number;

export type LineRole = 'name' | 'greet' | 'roman' | 'to' | 'msg' | 'from' | 'info-title' | 'info' | 'info-say' | 'back';

export interface TextLine {
  readonly role: LineRole;
  readonly text: string;
  /** Centre of the line, in panel units. */
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly display: boolean;
  readonly rtl: boolean;
  readonly lang?: string;
}

export interface Pill { readonly x: number; readonly y: number; readonly w: number; readonly h: number }

export interface FrontLayout {
  readonly lines: readonly TextLine[];
  readonly pill: Pill | null;
}

export const FONT_DISPLAY = "Fredoka, ui-rounded, 'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif";
export const FONT_BODY = "ui-rounded, 'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif";

export const canvasFont = (px: number, display: boolean): string => `700 ${Math.max(1, Math.round(px * 10) / 10)}px ${display ? FONT_DISPLAY : FONT_BODY}`;

const RTL = /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufefc]/;
export const isRtl = (s: string): boolean => RTL.test(s);

/** A browser measure backed by one shared canvas (null outside the browser). */
export function canvasMeasure(): Measure | null {
  if (typeof document === 'undefined') return null;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return null;
  return (text, px, display) => {
    ctx.font = canvasFont(px, display);
    return ctx.measureText(text).width;
  };
}

/** Rough measure for tests and as a fallback: average glyph ≈ 0.56 em, CJK ≈ 1 em. */
export const estimateMeasure: Measure = (text, px) => {
  let w = 0;
  for (const ch of text) w += /[\u3000-\u9fff\uac00-\ud7af]/.test(ch) ? 1 : 0.56;
  return w * px;
};

/** Greedy word wrap; a single word longer than the line is kept whole (the size loop shrinks it). */
export function wrap(text: string, maxW: number, px: number, display: boolean, measure: Measure): string[] {
  // Never break before closing punctuation (French "Joyeux Noël !") or after an opening ¡ / ¿.
  const words = text.trim().replace(/\s+(?=[!?:;»)])/g, '\u00a0').replace(/([¡¿«(])\s+/g, '$1\u00a0').split(/[ \t\n\r]+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let cur = words[0]!;
  for (const w of words.slice(1)) {
    const next = `${cur} ${w}`;
    if (measure(next, px, display) <= maxW) cur = next;
    else { lines.push(cur); cur = w; }
  }
  lines.push(cur);
  return lines;
}

/** The biggest size (stepping down) at which the text fits in `maxLines` lines of `maxW`. */
export function fit(text: string, maxW: number, maxPx: number, minPx: number, maxLines: number, display: boolean, measure: Measure): { lines: string[]; px: number } {
  for (let px = maxPx; px >= minPx; px -= 2) {
    const lines = wrap(text, maxW, px, display, measure);
    if (lines.length <= maxLines && lines.every((l) => measure(l, px, display) <= maxW)) return { lines, px };
  }
  // Still too long at the smallest size: squeeze into the allowed lines (the renderer never overflows the panel).
  const lines = wrap(text, maxW, minPx, display, measure);
  const kept = lines.slice(0, maxLines);
  if (lines.length > maxLines) kept[maxLines - 1] = lines.slice(maxLines - 1).join(' ');
  let px = minPx;
  for (const l of kept) {
    const w = measure(l, px, display);
    if (w > maxW) px = Math.max(10, (px * maxW) / w);
  }
  return { lines: kept, px };
}

export function greetingText(card: CardSpec, holidayName: string, happyTpl: string): string {
  return card.greeting?.text ?? happyTpl.replace('{holiday}', holidayName);
}

/** Front words: a name pill, the greeting in its own script (big) and its romanisation (small). */
export function layoutFront(card: CardSpec, holidayName: string, happyTpl: string, measure: Measure): FrontLayout {
  const text = greetingText(card, holidayName, happyTpl);
  const g = card.greeting;
  const showPill = g !== null && !text.toLowerCase().includes(holidayName.toLowerCase());
  const maxW = PANEL_W - 64;
  // One line when it still reads big; otherwise two bigger lines.
  const one = fit(text, maxW, 78, 58, 1, true, measure);
  const greet = one.lines.length === 1 && measure(one.lines[0]!, one.px, true) <= maxW ? one : fit(text, maxW, 78, 34, 2, true, measure);
  const lineH = greet.px * 1.08;
  const roman = g?.roman ? fit(g.roman, maxW, 28, 18, 1, false, measure) : null;
  const pillPx = 24;
  const pillH = 46;
  const pillW = showPill ? Math.min(maxW, measure(holidayName, pillPx, true) + 44) : 0;
  const gap = 12;
  const total = (showPill ? pillH + gap : 0) + greet.lines.length * lineH + (roman ? gap * 0.6 + roman.px * 1.2 : 0);
  const top = card.wordsAt === 'top' ? 40 : card.wordsAt === 'middle' ? (PANEL_H - total) / 2 : PANEL_H - 44 - total;
  const lines: TextLine[] = [];
  let y = top;
  let pill: Pill | null = null;
  const cx = PANEL_W / 2;
  if (showPill) {
    pill = { x: cx - pillW / 2, y, w: pillW, h: pillH };
    lines.push({ role: 'name', text: holidayName, x: cx, y: y + pillH / 2, size: pillPx, display: true, rtl: false });
    y += pillH + gap;
  }
  for (const l of greet.lines) {
    lines.push({ role: 'greet', text: l, x: cx, y: y + lineH / 2, size: greet.px, display: true, rtl: isRtl(l), lang: g?.lang ?? 'en' });
    y += lineH;
  }
  if (roman) {
    y += gap * 0.6;
    lines.push({ role: 'roman', text: roman.lines[0] ?? '', x: cx, y: y + roman.px * 0.6, size: roman.px, display: false, rtl: false });
  }
  return { lines, pill };
}

export interface InsideCopy { readonly dear: string; readonly love: string }

/** Inside right: "Dear …," at the top, the message in the middle, "Love from …" at the bottom. */
export function layoutInside(card: CardSpec, copy: InsideCopy, measure: Measure): TextLine[] {
  const cx = PANEL_W / 2;
  const maxW = PANEL_W - 90;
  const lines: TextLine[] = [];
  if (card.to.trim()) {
    const t = fit(copy.dear.replace('{to}', card.to.trim()), maxW, 44, 26, 1, true, measure);
    lines.push({ role: 'to', text: t.lines[0] ?? '', x: cx, y: 118, size: t.px, display: true, rtl: isRtl(card.to) });
  }
  if (card.message.trim()) {
    const m = fit(card.message.trim(), maxW, 50, 26, 5, true, measure);
    const lh = m.px * 1.22;
    let y = 350 - (m.lines.length * lh) / 2 + lh / 2;
    for (const l of m.lines) {
      lines.push({ role: 'msg', text: l, x: cx, y, size: m.px, display: true, rtl: isRtl(l) });
      y += lh;
    }
  }
  if (card.from.trim()) {
    const f = fit(copy.love.replace('{from}', card.from.trim()), maxW, 40, 24, 2, true, measure);
    const lh = f.px * 1.15;
    let y = 600 - ((f.lines.length - 1) * lh) / 2;
    for (const l of f.lines) {
      lines.push({ role: 'from', text: l, x: cx, y, size: f.px, display: true, rtl: isRtl(l) });
      y += lh;
    }
  }
  return lines;
}

export interface InfoCopy { readonly title: string; readonly means: string; readonly sayIt: string; readonly happy: string }

/** Inside left (print and wide screens): what the greeting means and how to say it. */
export function layoutInfo(card: CardSpec, holidayName: string, copy: InfoCopy, measure: Measure): TextLine[] {
  const cx = PANEL_W / 2;
  const maxW = PANEL_W - 110;
  const g = card.greeting;
  const lines: TextLine[] = [];
  const text = g?.text ?? copy.happy.replace('{holiday}', holidayName);
  const big = fit(text, maxW, 46, 24, 2, true, measure);
  let y = 300 - (big.lines.length - 1) * big.px * 0.55;
  lines.push({ role: 'info-title', text: copy.title, x: cx, y: 238, size: 22, display: false, rtl: false });
  y = Math.max(y, 290);
  for (const l of big.lines) {
    lines.push({ role: 'info', text: l, x: cx, y, size: big.px, display: true, rtl: isRtl(l), lang: g?.lang ?? 'en' });
    y += big.px * 1.1;
  }
  if (g?.sayIt) {
    const s = fit(copy.sayIt.replace('{say}', g.sayIt), maxW, 24, 16, 2, false, measure);
    y += 10;
    for (const l of s.lines) { lines.push({ role: 'info-say', text: l, x: cx, y, size: s.px, display: false, rtl: false }); y += s.px * 1.25; }
  }
  if (g?.meaning || g?.langName) {
    const sentence = copy.means.replace('{lang}', g.langName || '').replace('{meaning}', g.meaning || holidayName);
    const s = fit(sentence, maxW, 22, 15, 4, false, measure);
    y += 14;
    for (const l of s.lines) { lines.push({ role: 'info-title', text: l, x: cx, y, size: s.px, display: false, rtl: false }); y += s.px * 1.3; }
  }
  return lines;
}
