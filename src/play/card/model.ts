/**
 * model.ts — the card as data, and every pure operation on it (no DOM, unit-tested in Node).
 *
 * A card is a folded sheet with two faces the child designs: the FRONT (background, a greeting in the
 * holiday's own languages, stickers, drawing) and the INSIDE (To / a message / From, stickers, drawing).
 * Every face shares one portrait panel of 500 × 700 units (close to both A6 and half-Letter), so the
 * same numbers drive the editor, the thumbnails, the printed sheet and the saved picture.
 *
 * The whole card is a small JSON object — that is what goes on the Fridge (never pixels) and what the
 * undo history snapshots. `sanitizeCard` accepts anything (an old Fridge item, garbage) and returns a
 * valid card or null, so a reopened card can never break the editor.
 */

export const PANEL_W = 500;
export const PANEL_H = 700;
/** Sticker box side, in panel units. */
export const MIN_SIZE = 44;
export const MAX_SIZE = 380;
export const DEFAULT_SIZE = 132;
export const MAX_STICKERS = 40;
export const MAX_STROKES = 120;
export const MAX_POINTS = 600;
export const TEXT_MAX = { to: 24, from: 24, message: 120 } as const;

export type FaceId = 'front' | 'inside';
export const FACES: readonly FaceId[] = ['front', 'inside'];

export type BgId = 'scene' | 'sky' | 'confetti' | 'stripes' | 'stars' | 'dots' | 'paper';
export const BG_IDS: readonly BgId[] = ['scene', 'sky', 'confetti', 'stripes', 'stars', 'dots', 'paper'];

export type WordsAt = 'top' | 'middle' | 'bottom';
export const WORDS_AT: readonly WordsAt[] = ['top', 'middle', 'bottom'];

/** What a placed sticker shows: a vector decoration painted by an effects painter, or a holiday's sticker. */
export type StickerArt =
  | { readonly t: 'decor'; readonly p: string; readonly c: string }
  | { readonly t: 'holiday'; readonly h: string; readonly e: string };

export interface Placed {
  readonly id: string;
  readonly art: StickerArt;
  /** Centre, in panel units. */
  readonly x: number;
  readonly y: number;
  /** Box side, in panel units. */
  readonly s: number;
  /** Degrees, clockwise. */
  readonly r: number;
}

export interface Stroke {
  readonly c: string;
  readonly w: number;
  /** Flat x,y pairs in panel units, one decimal. */
  readonly p: readonly number[];
}

export interface Face {
  readonly stickers: readonly Placed[];
  readonly strokes: readonly Stroke[];
}

/** A snapshot of the chosen greeting, so a saved card reads the same even if the content changes. */
export interface CardGreeting {
  readonly text: string;
  readonly lang: string;
  readonly langName: string;
  readonly roman?: string;
  readonly sayIt?: string;
  readonly meaning?: string;
}

export interface CardSpec {
  readonly v: 1;
  readonly holidayId: string;
  readonly bg: BgId;
  /** null → "Happy <holiday>!" in English. */
  readonly greeting: CardGreeting | null;
  readonly wordsAt: WordsAt;
  readonly to: string;
  readonly from: string;
  readonly message: string;
  readonly front: Face;
  readonly inside: Face;
}

const EMPTY_FACE: Face = { stickers: [], strokes: [] };

export function newCard(opts: { holidayId: string; bg: BgId; greeting: CardGreeting | null; from?: string; front?: readonly Placed[] }): CardSpec {
  return {
    v: 1,
    holidayId: opts.holidayId,
    bg: opts.bg,
    greeting: opts.greeting,
    wordsAt: 'top',
    to: '',
    from: cleanText(opts.from ?? '', TEXT_MAX.from),
    message: '',
    front: { stickers: opts.front ?? [], strokes: [] },
    inside: EMPTY_FACE,
  };
}

// ───────────────────────────────────────────────────────────── numbers

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const round1 = (v: number): number => Math.round(v * 10) / 10;

/** Normalises an angle to (-180, 180]. */
export function normDeg(d: number): number {
  let a = d % 360;
  if (a <= -180) a += 360;
  if (a > 180) a -= 360;
  return round1(a);
}

/** Keeps at least a quarter of a sticker on the panel, so nothing can be lost off the edge. */
export function clampPlaced(p: Placed): Placed {
  const s = clamp(p.s, MIN_SIZE, MAX_SIZE);
  const m = s / 4;
  return { ...p, s: round1(s), x: round1(clamp(p.x, -m, PANEL_W + m)), y: round1(clamp(p.y, -m, PANEL_H + m)), r: normDeg(p.r) };
}

// ───────────────────────────────────────────────────────────── faces & stickers

export function faceOf(card: CardSpec, face: FaceId): Face {
  return face === 'front' ? card.front : card.inside;
}

export function withFace(card: CardSpec, face: FaceId, next: Face): CardSpec {
  return face === 'front' ? { ...card, front: next } : { ...card, inside: next };
}

let uidCounter = 0;
/** Short id for a placed sticker (unique within a card; collisions across sessions do not matter). */
export function uid(seed = Date.now()): string {
  uidCounter = (uidCounter + 1) % 1e6;
  return `s${(seed % 1e9).toString(36)}${uidCounter.toString(36)}`;
}

/**
 * Where the next sticker lands: near the middle, nudged along a little spiral so a row of taps fans out
 * instead of stacking every sticker on the same spot.
 */
export function dropSpot(count: number): { x: number; y: number } {
  const a = count * 2.399963; // golden angle
  const r = count === 0 ? 0 : 46 + 22 * Math.sqrt(count);
  return { x: round1(clamp(PANEL_W / 2 + Math.cos(a) * r, 70, PANEL_W - 70)), y: round1(clamp(PANEL_H * 0.56 + Math.sin(a) * r, 90, PANEL_H - 90)) };
}

export function addSticker(card: CardSpec, face: FaceId, art: StickerArt, at?: { x: number; y: number; s?: number; r?: number }, id = uid()): { card: CardSpec; placed: Placed | null } {
  const f = faceOf(card, face);
  if (f.stickers.length >= MAX_STICKERS) return { card, placed: null };
  const spot = at ?? dropSpot(f.stickers.length);
  const placed = clampPlaced({ id, art, x: spot.x, y: spot.y, s: at?.s ?? DEFAULT_SIZE, r: at?.r ?? 0 });
  return { card: withFace(card, face, { ...f, stickers: [...f.stickers, placed] }), placed };
}

export function updateSticker(card: CardSpec, face: FaceId, id: string, change: Partial<Omit<Placed, 'id' | 'art'>>): CardSpec {
  const f = faceOf(card, face);
  if (!f.stickers.some((p) => p.id === id)) return card;
  return withFace(card, face, { ...f, stickers: f.stickers.map((p) => (p.id === id ? clampPlaced({ ...p, ...change }) : p)) });
}

export function removeSticker(card: CardSpec, face: FaceId, id: string): CardSpec {
  const f = faceOf(card, face);
  return withFace(card, face, { ...f, stickers: f.stickers.filter((p) => p.id !== id) });
}

/** Moves a sticker one step up (+1) or down (−1) the pile, or to the very top/bottom (±Infinity). */
export function restack(card: CardSpec, face: FaceId, id: string, by: number): CardSpec {
  const f = faceOf(card, face);
  const i = f.stickers.findIndex((p) => p.id === id);
  if (i < 0) return card;
  const j = clamp(by === Infinity ? f.stickers.length - 1 : by === -Infinity ? 0 : i + by, 0, f.stickers.length - 1);
  if (i === j) return card;
  const list = f.stickers.slice();
  const [p] = list.splice(i, 1);
  list.splice(j, 0, p!);
  return withFace(card, face, { ...f, stickers: list });
}

export function findSticker(card: CardSpec, face: FaceId, id: string): Placed | undefined {
  return faceOf(card, face).stickers.find((p) => p.id === id);
}

// ───────────────────────────────────────────────────────────── keyboard nudges

export interface Nudge { readonly dx?: number; readonly dy?: number; readonly scale?: number; readonly turn?: number }

/** The keyboard map for a selected sticker. Returns null for keys it does not handle. */
export function nudgeFor(key: string, shift: boolean): Nudge | null {
  const step = shift ? 40 : 8;
  switch (key) {
    case 'ArrowLeft': return { dx: -step };
    case 'ArrowRight': return { dx: step };
    case 'ArrowUp': return { dy: -step };
    case 'ArrowDown': return { dy: step };
    case '+': case '=': return { scale: 1.12 };
    case '-': case '_': return { scale: 1 / 1.12 };
    case 'r': return { turn: 15 };
    case 'R': return { turn: -15 };
    default: return null;
  }
}

export function applyNudge(p: Placed, n: Nudge): Placed {
  return clampPlaced({ ...p, x: p.x + (n.dx ?? 0), y: p.y + (n.dy ?? 0), s: p.s * (n.scale ?? 1), r: p.r + (n.turn ?? 0) });
}

// ───────────────────────────────────────────────────────────── gestures

/**
 * One-finger corner handle: the sticker's new size and angle from where the handle is dragged to,
 * relative to the sticker's centre. The handle sits on the box corner (at 45°), so the box side is the
 * pointer distance × √2 and the angle is the pointer's angle minus 45°.
 */
export function fromHandle(cx: number, cy: number, px: number, py: number): { s: number; r: number } {
  const dx = px - cx;
  const dy = py - cy;
  const dist = Math.hypot(dx, dy);
  return { s: round1(clamp(dist * Math.SQRT2, MIN_SIZE, MAX_SIZE)), r: normDeg((Math.atan2(dy, dx) * 180) / Math.PI - 45) };
}

/** Two-finger pinch: scale and turn by how the pair changed since the gesture began. */
export function fromPinch(start: Placed, a0: { x: number; y: number }, b0: { x: number; y: number }, a1: { x: number; y: number }, b1: { x: number; y: number }): Placed {
  const d0 = Math.hypot(b0.x - a0.x, b0.y - a0.y) || 1;
  const d1 = Math.hypot(b1.x - a1.x, b1.y - a1.y);
  const ang0 = Math.atan2(b0.y - a0.y, b0.x - a0.x);
  const ang1 = Math.atan2(b1.y - a1.y, b1.x - a1.x);
  const mid0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
  const mid1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };
  return clampPlaced({ ...start, x: start.x + mid1.x - mid0.x, y: start.y + mid1.y - mid0.y, s: start.s * (d1 / d0), r: start.r + ((ang1 - ang0) * 180) / Math.PI });
}

// ───────────────────────────────────────────────────────────── strokes

/** Ramer–Douglas–Peucker on flat [x0,y0,x1,y1,…] pairs; keeps the end points. */
export function simplify(flat: readonly number[], epsilon = 1.2): number[] {
  const n = Math.floor(flat.length / 2);
  if (n <= 2) return flat.slice(0, n * 2).map(round1);
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length > 0) {
    const [a, b] = stack.pop()!;
    const ax = flat[a * 2]!, ay = flat[a * 2 + 1]!, bx = flat[b * 2]!, by = flat[b * 2 + 1]!;
    const len = Math.hypot(bx - ax, by - ay);
    let worst = -1;
    let worstD = epsilon;
    for (let i = a + 1; i < b; i++) {
      const px = flat[i * 2]!, py = flat[i * 2 + 1]!;
      const d = len === 0 ? Math.hypot(px - ax, py - ay) : Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
      if (d > worstD) { worstD = d; worst = i; }
    }
    if (worst >= 0) {
      keep[worst] = 1;
      stack.push([a, worst], [worst, b]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(round1(flat[i * 2]!), round1(flat[i * 2 + 1]!));
  return out;
}

/** Finishes a raw stroke: simplified, clamped to the panel, capped in length. Null when it is empty. */
export function finishStroke(raw: readonly number[], c: string, w: number): Stroke | null {
  if (raw.length < 2) return null;
  const pts = raw.length === 2 ? [raw[0]!, raw[1]!, raw[0]! + 0.1, raw[1]!] : raw;
  const clamped: number[] = [];
  for (let i = 0; i + 1 < pts.length; i += 2) clamped.push(clamp(pts[i]!, -10, PANEL_W + 10), clamp(pts[i + 1]!, -10, PANEL_H + 10));
  const p = simplify(clamped).slice(0, MAX_POINTS * 2);
  return p.length >= 2 ? { c, w: clamp(round1(w), 2, 40), p } : null;
}

export function addStroke(card: CardSpec, face: FaceId, stroke: Stroke): CardSpec {
  const f = faceOf(card, face);
  const strokes = [...f.strokes, stroke].slice(-MAX_STROKES);
  return withFace(card, face, { ...f, strokes });
}

export function clearStrokes(card: CardSpec, face: FaceId): CardSpec {
  const f = faceOf(card, face);
  return f.strokes.length === 0 ? card : withFace(card, face, { ...f, strokes: [] });
}

// ───────────────────────────────────────────────────────────── text

/** Trims, collapses whitespace, removes control characters and anything that looks like a link. */
export function cleanText(s: string, max: number): string {
  // eslint-disable-next-line no-control-regex
  const flat = s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ');
  return flat.replace(/https?:\/\/\S*/gi, '').replace(/www\.\S*/gi, '').slice(0, max);
}

// ───────────────────────────────────────────────────────────── undo / redo

/** Snapshot history: `commit` after each finished change (end of a drag, not every frame). */
export class History<T> {
  private past: T[] = [];
  private future: T[] = [];
  constructor(private present: T, private readonly cap = 80) {}

  get current(): T { return this.present; }
  get canUndo(): boolean { return this.past.length > 0; }
  get canRedo(): boolean { return this.future.length > 0; }

  commit(next: T): void {
    if (next === this.present) return;
    this.past.push(this.present);
    if (this.past.length > this.cap) this.past.shift();
    this.present = next;
    this.future = [];
  }

  /** Replaces the present without an undo step (live drag frames). */
  replace(next: T): void { this.present = next; }

  undo(): T | null {
    const prev = this.past.pop();
    if (prev === undefined) return null;
    this.future.push(this.present);
    this.present = prev;
    return prev;
  }

  redo(): T | null {
    const next = this.future.pop();
    if (next === undefined) return null;
    this.past.push(this.present);
    this.present = next;
    return next;
  }

  reset(next: T): void {
    this.past = [];
    this.future = [];
    this.present = next;
  }
}

// ───────────────────────────────────────────────────────────── validation (Fridge items)

const COLOR = /^#[0-9a-f]{6}$/i;
const SLUG = /^[a-z0-9-]{1,64}$/;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const str = (v: unknown, max: number): string => (typeof v === 'string' ? cleanText(v, max) : '');

function sanitizeArt(v: unknown, decorOk: (p: string) => boolean): StickerArt | null {
  if (!isObj(v)) return null;
  if (v.t === 'decor' && typeof v.p === 'string' && decorOk(v.p) && typeof v.c === 'string' && COLOR.test(v.c)) return { t: 'decor', p: v.p, c: v.c };
  if (v.t === 'holiday' && typeof v.h === 'string' && SLUG.test(v.h) && typeof v.e === 'string' && v.e.length <= 16) return { t: 'holiday', h: v.h, e: v.e };
  return null;
}

function sanitizeFace(v: unknown, decorOk: (p: string) => boolean): Face {
  if (!isObj(v)) return EMPTY_FACE;
  const stickers: Placed[] = [];
  const seen = new Set<string>();
  for (const s of Array.isArray(v.stickers) ? v.stickers.slice(0, MAX_STICKERS) : []) {
    if (!isObj(s) || !num(s.x) || !num(s.y) || !num(s.s) || !num(s.r)) continue;
    const art = sanitizeArt(s.art, decorOk);
    if (!art) continue;
    let id = typeof s.id === 'string' && /^[\w-]{1,32}$/.test(s.id) ? s.id : uid();
    while (seen.has(id)) id = uid();
    seen.add(id);
    stickers.push(clampPlaced({ id, art, x: s.x, y: s.y, s: s.s, r: s.r }));
  }
  const strokes: Stroke[] = [];
  for (const k of Array.isArray(v.strokes) ? v.strokes.slice(-MAX_STROKES) : []) {
    if (!isObj(k) || typeof k.c !== 'string' || !COLOR.test(k.c) || !num(k.w) || !Array.isArray(k.p)) continue;
    const p = k.p.filter(num).slice(0, MAX_POINTS * 2);
    if (p.length % 2 === 1) p.pop();
    if (p.length >= 2) strokes.push({ c: k.c, w: clamp(k.w, 2, 40), p: p.map((n) => round1(clamp(n, -10, Math.max(PANEL_W, PANEL_H) + 10))) });
  }
  return { stickers, strokes };
}

function sanitizeGreeting(v: unknown): CardGreeting | null {
  if (!isObj(v) || typeof v.text !== 'string' || !v.text.trim()) return null;
  const g: { text: string; lang: string; langName: string; roman?: string; sayIt?: string; meaning?: string } = {
    text: str(v.text, 80), lang: typeof v.lang === 'string' && /^[A-Za-z0-9-]{2,20}$/.test(v.lang) ? v.lang : 'en', langName: str(v.langName, 40),
  };
  const roman = str(v.roman, 80);
  const sayIt = str(v.sayIt, 80);
  const meaning = str(v.meaning, 160);
  if (roman) g.roman = roman;
  if (sayIt) g.sayIt = sayIt;
  if (meaning) g.meaning = meaning;
  return g;
}

/** A valid CardSpec from anything, or null when it is not recognisably a card. */
export function sanitizeCard(v: unknown, decorOk: (p: string) => boolean = () => true): CardSpec | null {
  if (!isObj(v) || v.v !== 1 || typeof v.holidayId !== 'string' || !SLUG.test(v.holidayId)) return null;
  return {
    v: 1,
    holidayId: v.holidayId,
    bg: (BG_IDS as readonly unknown[]).includes(v.bg) ? (v.bg as BgId) : 'sky',
    greeting: sanitizeGreeting(v.greeting),
    wordsAt: (WORDS_AT as readonly unknown[]).includes(v.wordsAt) ? (v.wordsAt as WordsAt) : 'top',
    to: str(v.to, TEXT_MAX.to),
    from: str(v.from, TEXT_MAX.from),
    message: str(v.message, TEXT_MAX.message),
    front: sanitizeFace(v.front, decorOk),
    inside: sanitizeFace(v.inside, decorOk),
  };
}

/** Gallery title: "Card for Grandma" or "Christmas card". */
export function cardTitle(card: CardSpec, holidayName: string, tpl: { forWho: string; plain: string }): string {
  const to = card.to.trim();
  return (to ? tpl.forWho.replace('{to}', to) : tpl.plain.replace('{holiday}', holidayName)).slice(0, 60);
}

/** True when the child has made any change worth keeping beyond a blank starter card. */
export function isSameCard(a: CardSpec, b: CardSpec): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
