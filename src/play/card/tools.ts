/**
 * tools.ts — the tool dock under (phone) or beside (wide screens) the card: five tabs with big, labeled
 * buttons. Stickers · Words · Draw · Background · Finish. Tabs follow the WAI tabs pattern (arrows move
 * between tabs); every control is a real button or input at least 48 px tall.
 */
import { sceneFor } from '../../art/index';
import type { Greeting, HolidayMeta } from '../../content/types';
import type { Theme } from '../../theme/themes';
import { h } from '../../ui/dom';
import { speak, speakableVoice } from '../../ui/greetings';
import { icon, type IconName } from '../../ui/icons';
import { COPY, fill } from './copy';
import type { DecorChoice } from './decor';
import { artEl } from './face';
import { glyph } from './glyphs';
import { BG_IDS, TEXT_MAX, WORDS_AT, PANEL_H, PANEL_W, type BgId, type CardGreeting, type CardSpec, type StickerArt, type WordsAt } from './model';
import { paintBackground, paintScene } from './paint';
import type { Assets, CardEnv } from './raster';

export type TabId = 'stickers' | 'words' | 'draw' | 'bg' | 'done';
const TABS: readonly { id: TabId; label: string; icon: IconName }[] = [
  { id: 'stickers', label: COPY.tabStickers, icon: 'stickers' },
  { id: 'words', label: COPY.tabWords, icon: 'heart' },
  { id: 'draw', label: COPY.tabDraw, icon: 'sparkle' },
  { id: 'bg', label: COPY.tabBack, icon: 'map' },
  { id: 'done', label: COPY.tabDone, icon: 'gift' },
];

export interface ToolsCtl {
  card(): CardSpec;
  addSticker(art: StickerArt, label: string): void;
  setGreeting(g: CardGreeting | null): void;
  setWordsAt(w: WordsAt): void;
  setText(field: 'to' | 'message' | 'from', value: string, commit: boolean): void;
  showInside(): void;
  showFront(): void;
  pen(): { on: boolean; color: string; width: number };
  setPen(change: { on?: boolean; color?: string; width?: number }): void;
  clearDrawing(): void;
  setBg(bg: BgId): void;
  toFridge(): void;
  print(): void;
  savePicture(): void;
  myCards(): void;
  newCard(): void;
  editingSaved(): boolean;
}

export interface StickerSet {
  readonly decor: readonly DecorChoice[];
  readonly holidays: readonly { readonly meta: HolidayMeta; readonly earned: boolean }[];
}

export const penColors = (t: Theme): string[] => {
  const out: string[] = [];
  for (const c of [t.accent2, t.accent, t.glow, '#1f1a3d', '#ffffff', '#2bb673', '#5b8def', '#ff8fb8']) {
    const k = c.toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(k) && !out.includes(k)) out.push(k);
    if (out.length === 6) break;
  }
  return out;
};

export class Tools {
  readonly el: HTMLElement;
  private readonly tabs = new Map<TabId, HTMLButtonElement>();
  private readonly panels = new Map<TabId, HTMLElement>();
  private tab: TabId = 'stickers';
  private stickerSet: 'holiday' | 'all' = 'holiday';
  private readonly greetBtns: { b: HTMLButtonElement; g: CardGreeting | null }[] = [];
  private readonly whereBtns = new Map<WordsAt, HTMLButtonElement>();
  private readonly inputs: Record<'to' | 'message' | 'from', HTMLInputElement | HTMLTextAreaElement>;
  private readonly penBtn: HTMLButtonElement;
  private readonly swatches: { b: HTMLButtonElement; c: string }[] = [];
  private readonly widthBtns: { b: HTMLButtonElement; w: number }[] = [];
  private readonly bgBtns = new Map<BgId, HTMLButtonElement>();
  private readonly fridgeBtn: HTMLButtonElement;
  private readonly bgThumbs: { c: HTMLCanvasElement; bg: BgId }[] = [];

  constructor(private readonly meta: HolidayMeta, private readonly theme: Theme, greetings: readonly Greeting[], private readonly set: StickerSet,
    private readonly env: CardEnv, private readonly ctl: ToolsCtl) {
    const list = h('div', { class: 'cm-tabs', role: 'tablist', 'aria-label': COPY.tools });
    for (const t of TABS) {
      const b = h('button', { type: 'button', class: 'cm-tab', role: 'tab', id: `cm-tab-${t.id}`, 'aria-controls': `cm-panel-${t.id}`, 'aria-selected': 'false', tabindex: -1, onclick: () => this.show(t.id, true) },
        icon(t.icon, 22), h('span', { class: 'cm-tab-text' }, t.label));
      this.tabs.set(t.id, b);
      list.append(b);
    }
    list.addEventListener('keydown', (e) => this.onTabKey(e));

    this.inputs = {
      to: h('input', { type: 'text', class: 'input', id: 'cm-to', maxlength: TEXT_MAX.to, autocomplete: 'off', placeholder: COPY.toPlaceholder }),
      message: h('textarea', { class: 'input cm-msg', id: 'cm-message', maxlength: TEXT_MAX.message, rows: 2, placeholder: COPY.messagePlaceholder }),
      from: h('input', { type: 'text', class: 'input', id: 'cm-from', maxlength: TEXT_MAX.from, autocomplete: 'off', placeholder: COPY.fromPlaceholder }),
    };
    for (const k of ['to', 'message', 'from'] as const) {
      const el = this.inputs[k];
      el.addEventListener('input', () => ctl.setText(k, el.value, false));
      el.addEventListener('change', () => ctl.setText(k, el.value, true));
      el.addEventListener('focus', () => ctl.showInside());
    }

    this.penBtn = h('button', { type: 'button', class: 'btn btn-lg cm-pen-toggle', 'aria-pressed': 'false', onclick: () => ctl.setPen({ on: !ctl.pen().on }) });
    this.fridgeBtn = h('button', { type: 'button', class: 'btn btn-lg cm-fridge', onclick: () => ctl.toFridge() });

    this.panels.set('stickers', this.stickersPanel());
    this.panels.set('words', this.wordsPanel(greetings));
    this.panels.set('draw', this.drawPanel());
    this.panels.set('bg', this.bgPanel());
    this.panels.set('done', this.donePanel());
    const body = h('div', { class: 'cm-panels' });
    for (const [id, p] of this.panels) {
      p.id = `cm-panel-${id}`;
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labeledby', `cm-tab-${id}`);
      p.classList.add('cm-panel');
      p.hidden = true;
      body.append(p);
    }
    this.el = h('div', { class: 'cm-dock' }, list, body);
    this.show('stickers', false);
  }

  get current(): TabId { return this.tab; }

  show(id: TabId, focus: boolean): void {
    this.tab = id;
    for (const [k, b] of this.tabs) {
      const on = k === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      this.panels.get(k)!.hidden = !on;
    }
    if (focus) this.tabs.get(id)?.focus({ preventScroll: true });
    if (id !== 'draw' && this.ctl.pen().on) this.ctl.setPen({ on: false });
    if (id === 'bg') this.paintBgThumbs();
    this.el.setAttribute('data-tab', id);
  }

  private onTabKey(e: KeyboardEvent): void {
    const ids = TABS.map((t) => t.id);
    const i = ids.indexOf(this.tab);
    let j = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % ids.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + ids.length) % ids.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = ids.length - 1;
    else return;
    e.preventDefault();
    this.show(ids[j]!, true);
  }

  focusInput(field: 'to' | 'message' | 'from'): void {
    this.show('words', false);
    this.inputs[field].focus();
  }

  // ─────────────────────────────────────────── stickers

  private stickersPanel(): HTMLElement {
    const grid = h('div', { class: 'cm-grid', role: 'group' });
    const seg = h('div', { class: 'segmented cm-seg' });
    const segBtns: Record<'holiday' | 'all', HTMLButtonElement> = {
      holiday: h('button', { type: 'button', 'aria-pressed': 'true', onclick: () => pick('holiday') }, fill(COPY.stickersHoliday, { holiday: this.meta.name })),
      all: h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => pick('all') }, COPY.stickersAll),
    };
    seg.append(segBtns.holiday, segBtns.all);
    const dpr = Math.min(3, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    const px = Math.round(64 * dpr);
    const fillGrid = (): void => {
      const items: HTMLElement[] = [];
      const add = (art: StickerArt, label: string, earned: boolean): void => {
        items.push(h('button', { type: 'button', class: `cm-pick${earned ? ' is-earned' : ''}`, 'aria-label': fill(COPY.addSticker, { label }) + (earned ? `, ${COPY.earned}` : ''), title: label, onclick: () => this.ctl.addSticker(art, label) },
          artEl(art, px, this.env)));
      };
      if (this.stickerSet === 'holiday') {
        add({ t: 'holiday', h: this.meta.id, e: this.meta.sticker.emoji }, this.meta.sticker.label, this.env.earned(this.meta.id));
        for (const d of this.set.decor) add({ t: 'decor', p: d.p, c: d.c }, d.label, false);
      } else {
        for (const x of this.set.holidays) add({ t: 'holiday', h: x.meta.id, e: x.meta.sticker.emoji }, x.meta.sticker.label || x.meta.name, x.earned);
      }
      grid.setAttribute('aria-label', this.stickerSet === 'holiday' ? fill(COPY.stickersHoliday, { holiday: this.meta.name }) : COPY.stickersAll);
      grid.replaceChildren(...items);
    };
    const pick = (k: 'holiday' | 'all'): void => {
      this.stickerSet = k;
      segBtns.holiday.setAttribute('aria-pressed', String(k === 'holiday'));
      segBtns.all.setAttribute('aria-pressed', String(k === 'all'));
      fillGrid();
    };
    fillGrid();
    return h('div', {}, seg, grid, h('p', { class: 'cm-help cm-hint' }, COPY.stickersHint));
  }

  // ─────────────────────────────────────────── words

  private wordsPanel(greetings: readonly Greeting[]): HTMLElement {
    const list = h('div', { class: 'cm-greets', role: 'group', 'aria-label': COPY.greetingTitle });
    const opts: (CardGreeting | null)[] = greetings.map((g) => {
      const o: { text: string; lang: string; langName: string; roman?: string; sayIt?: string; meaning?: string } = { text: g.text, lang: g.lang, langName: g.langName, sayIt: g.sayIt, meaning: g.meaning };
      if (g.roman) o.roman = g.roman;
      return o;
    });
    opts.push(null);
    for (const g of opts) {
      const text = g?.text ?? fill(COPY.greetingHappy, { holiday: this.meta.name });
      const b = h('button', { type: 'button', class: 'cm-greet', 'aria-pressed': 'false', onclick: () => this.ctl.setGreeting(g) },
        h('span', { class: 'cm-greet-text', lang: g?.lang ?? 'en', dir: 'auto' }, text),
        g?.roman ? h('span', { class: 'cm-greet-roman' }, g.roman) : null,
        h('span', { class: 'cm-greet-lang' }, g?.langName ?? COPY.english));
      this.greetBtns.push({ b, g });
      const row = h('div', { class: 'cm-greet-row' }, b);
      if (g && speakableVoice(g.lang)) {
        row.append(h('button', { type: 'button', class: 'btn btn-secondary btn-icon cm-hear', 'aria-label': fill(COPY.hearLabel, { text: g.text }), title: COPY.hear, onclick: () => speak(g.text, g.lang) }, icon('speaker', 22)));
      }
      list.append(row);
    }
    const where = h('div', { class: 'segmented cm-seg', role: 'group', 'aria-label': COPY.wordsWhere });
    for (const w of WORDS_AT) {
      const b = h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => this.ctl.setWordsAt(w) }, COPY[w]);
      this.whereBtns.set(w, b);
      where.append(b);
    }
    const field = (k: 'to' | 'message' | 'from', label: string): HTMLElement =>
      h('div', { class: 'field' }, h('label', { class: 'field-label', for: this.inputs[k].id }, label), this.inputs[k]);
    const ideas = h('div', { class: 'cm-ideas', role: 'group', 'aria-label': COPY.ideas },
      ...COPY.messageIdeas.map((m) => h('button', { type: 'button', class: 'chip chip-sm cm-idea', onclick: () => { this.inputs.message.value = m; this.ctl.setText('message', m, true); } }, m)));
    return h('div', { class: 'cm-words' },
      h('h2', { class: 'cm-h' }, COPY.greetingTitle), list,
      h('h3', { class: 'cm-h cm-h-sm' }, COPY.wordsWhere), where,
      h('h2', { class: 'cm-h' }, COPY.insideTitle),
      field('to', COPY.to), field('message', COPY.message), ideas, field('from', COPY.from));
  }

  // ─────────────────────────────────────────── draw

  private drawPanel(): HTMLElement {
    const cols = penColors(this.theme);
    const sw = h('div', { class: 'cm-swatches', role: 'group', 'aria-label': COPY.penColor });
    cols.forEach((c, i) => {
      const b = h('button', { type: 'button', class: 'cm-swatch', style: `--c:${c}`, 'aria-pressed': 'false', 'aria-label': fill(COPY.colorN, { n: i + 1 }), onclick: () => this.ctl.setPen({ color: c, on: true }) });
      this.swatches.push({ b, c });
      sw.append(b);
    });
    const widths = h('div', { class: 'segmented cm-seg' });
    for (const [w, label] of [[6, COPY.thin], [16, COPY.thick]] as const) {
      const b = h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => this.ctl.setPen({ width: w, on: true }) }, h('span', { class: 'cm-dot', style: `--w:${w}` }), label);
      this.widthBtns.push({ b, w });
      widths.append(b);
    }
    return h('div', { class: 'cm-draw' },
      this.penBtn,
      h('p', { class: 'cm-help' }, COPY.penHelp),
      sw, widths,
      h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => this.ctl.clearDrawing() }, icon('close', 20), COPY.clearDrawing));
  }

  // ─────────────────────────────────────────── backgrounds

  private bgPanel(): HTMLElement {
    const grid = h('div', { class: 'cm-bgs', role: 'group', 'aria-label': COPY.bgTitle });
    const hasScene = sceneFor(this.meta.id) !== null;
    for (const bg of BG_IDS) {
      if (bg === 'scene' && !hasScene) continue;
      const label = fill(COPY.bg[bg] ?? bg, { holiday: this.meta.name });
      const c = h('canvas', { class: 'cm-bg-thumb', 'aria-hidden': 'true' });
      this.bgThumbs.push({ c, bg });
      const b = h('button', { type: 'button', class: 'cm-bg', 'aria-pressed': 'false', onclick: () => this.ctl.setBg(bg) }, c, h('span', { class: 'cm-bg-label' }, label));
      this.bgBtns.set(bg, b);
      grid.append(b);
    }
    return h('div', {}, h('h2', { class: 'cm-h' }, COPY.bgTitle), grid);
  }

  private thumbsPainted = false;
  private assets: Assets | null = null;

  setAssets(a: Assets): void {
    this.assets = a;
    this.thumbsPainted = false;
    if (this.tab === 'bg') this.paintBgThumbs();
  }

  private paintBgThumbs(): void {
    if (this.thumbsPainted) return;
    this.thumbsPainted = true;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const k = (84 / PANEL_W) * dpr;
    for (const { c, bg } of this.bgThumbs) {
      c.width = Math.round(PANEL_W * k);
      c.height = Math.round(PANEL_H * k);
      const ctx = c.getContext('2d');
      if (!ctx) continue;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      paintBackground(ctx, bg, this.theme);
      if (bg === 'scene' && this.assets) paintScene(ctx, this.assets.scene);
    }
  }

  // ─────────────────────────────────────────── finish

  private donePanel(): HTMLElement {
    const btn = (cls: string, ic: IconName | SVGSVGElement, label: string, fn: () => void): HTMLButtonElement =>
      h('button', { type: 'button', class: `btn ${cls}`, onclick: fn }, typeof ic === 'string' ? icon(ic, 22) : ic, label);
    this.fridgeBtn.prepend(icon('heart', 24));
    return h('div', { class: 'cm-done' },
      h('h2', { class: 'cm-h' }, COPY.finishTitle),
      this.fridgeBtn,
      h('div', { class: 'cm-done-row' },
        btn('btn-secondary', 'print', COPY.print, () => this.ctl.print()),
        btn('btn-secondary', glyph('frame', 22), COPY.savePicture, () => this.ctl.savePicture())),
      h('p', { class: 'cm-help' }, COPY.printHelp),
      h('div', { class: 'cm-done-row' },
        btn('btn-ghost', 'stickers', COPY.myCards, () => this.ctl.myCards()),
        btn('btn-ghost', 'plus', COPY.newCard, () => this.ctl.newCard())));
  }

  /** Reflect the card and pen state in every pressed button and input. */
  sync(): void {
    const card = this.ctl.card();
    for (const { b, g } of this.greetBtns) b.setAttribute('aria-pressed', String((g?.text ?? null) === (card.greeting?.text ?? null)));
    for (const [w, b] of this.whereBtns) b.setAttribute('aria-pressed', String(w === card.wordsAt));
    for (const k of ['to', 'message', 'from'] as const) {
      const el = this.inputs[k];
      if (document.activeElement !== el && el.value !== card[k]) el.value = card[k];
    }
    const pen = this.ctl.pen();
    this.penBtn.setAttribute('aria-pressed', String(pen.on));
    this.penBtn.replaceChildren(icon(pen.on ? 'check' : 'sparkle', 22), pen.on ? COPY.drawOff : COPY.drawOn);
    for (const { b, c } of this.swatches) b.setAttribute('aria-pressed', String(c === pen.color));
    for (const { b, w } of this.widthBtns) b.setAttribute('aria-pressed', String(w === pen.width));
    for (const [bg, b] of this.bgBtns) b.setAttribute('aria-pressed', String(bg === card.bg));
    const label = this.ctl.editingSaved() ? COPY.fridgeUpdate : COPY.fridge;
    const text = this.fridgeBtn.lastChild;
    if (text?.nodeType === Node.TEXT_NODE) text.textContent = label; else this.fridgeBtn.append(label);
  }
}
