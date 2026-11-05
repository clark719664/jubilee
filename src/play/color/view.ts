/**
 * view.ts — the Coloring screen: the page on a taped-down sheet, the crayon box, the tools.
 *
 * Layout: phones stack header / sheet / tools / crayon box; wide screens put the box beside the sheet.
 * DOM order is header → tools → crayons → page so a keyboard child picks a crayon first, then Tabs
 * into the page, where Tab walks the shapes top-left to bottom-right and Enter fills.
 *
 * Every change is one undoable step (history.ts) and is kept as a draft straight away (store.ts),
 * so closing mid-picture loses nothing; Done puts the picture on the Fridge. Motion 'full' pours
 * color from the finger, ripples a Surprise! across the page and slams the Done stamp; anything else
 * fills instantly and fades the stamp in.
 */
import './color.css';
import { formatIso, formatShort, parseIso } from '../../dates/civil';
import { applyTheme } from '../../theme/apply';
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { mascot } from '../../ui/mascot';
import { fridge, type Fridge, type FridgeItem } from '../fridge';
import type { ActivityInstance, PlayEnv } from '../types';
import { COPY, fill, regionName } from './copy';
import { crayonBox, crayonDrawers, ERASER, solidFor } from './crayons';
import { IDENTITY, MAX_ZOOM, readingOrder, reveal, zoomAt, type View } from './geometry';
import { attachGestures } from './gesture';
import { canRedo, canUndo, diffRegions, filledCount, newDoc, paint, redo, replaceAll, undo, type Doc, type Fills } from './history';
import { ColorPage, staticPage } from './page';
import { openPanel, type Panel } from './panels';
import { crayonArt, eraserArt, stampEl, starBurst, toolIcon } from './parts';
import { parseColorPage, type CleanPage } from './sanitize';
import { cleanFills, colorStorage, isColorData, itemData, withDraft, type ColorItemData, type ColorStorage } from './store';
import { surpriseFills } from './surprise';

export interface PageSource {
  has(id: string): boolean;
  load(id: string): Promise<string | null>;
  /** Every page a holiday has; absent means one page named after the holiday. */
  pages?(id: string): readonly string[];
}

export interface ColorOptions {
  /** Where pages come from (the art bundle by default; the demo and tests pass a fixture). */
  readonly source: PageSource;
  readonly pageId?: string;
  readonly storage?: ColorStorage;
  readonly fridge?: Fridge;
  /** Seed for Surprise! (random per visit by default). */
  readonly seed?: number;
}

/** Remembered for the session so the next page opens with the crayon the child was using. */
let lastCrayon: string | null = null;
const WAVE_MS = 700;

export function mountColor(env: PlayEnv, opts: ColorOptions): ActivityInstance {
  const { ctx, meta, theme } = env;
  const pageId = opts.pageId ?? meta.id;
  const full = (): boolean => ctx.motion === 'full';
  const box = crayonBox(theme, meta.name);
  const store = opts.storage ?? colorStorage(ctx.clock.pretending);
  const shelf = (): Fridge => opts.fridge ?? fridge(ctx.clock.pretending);
  const drawers = crayonDrawers(box);
  let selected = lastCrayon && (lastCrayon === ERASER || box.some((c) => c.id === lastCrayon)) ? lastCrayon : box[0]!.id;
  let drawer = drawers.find((d) => d.crayons.some((c) => c.id === selected)) ?? drawers[0]!;
  let crayonIds = [ERASER, ...drawer.crayons.map((c) => c.id)];
  let seed = opts.seed ?? Math.floor(Math.random() * 0x7fffffff);
  const nameOf = (id: string | null): string => (id === null || id === ERASER ? COPY.eraser : box.find((c) => c.id === id)?.name ?? COPY.eraser);
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number): void => {
    const t = window.setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
  };

  // ── header ──
  const btn = (cls: string, label: string, onclick: () => void, ...kids: (Node | string)[]): HTMLButtonElement =>
    h('button', { type: 'button', class: `btn ${cls}`, 'aria-label': label, title: label, onclick }, ...kids);
  const mineCount = h('span', { class: 'cp-count' });
  const mineBtn = btn('btn-secondary cp-hbtn', COPY.mine, () => showMine(), toolIcon('frame', 22), h('span', { class: 'cp-hbtn-text' }, COPY.mine), mineCount);
  const printBtn = btn('btn-secondary cp-hbtn', COPY.print, () => showPrint(), icon('print', 22), h('span', { class: 'cp-hbtn-text' }, COPY.print));
  const header = h('header', { class: 'cp-head' },
    btn('btn-secondary btn-icon cp-close', fill(COPY.close, { holiday: meta.name }), () => env.close(), icon('close', 22)),
    h('div', { class: 'cp-titles' }, h('h1', { class: 'cp-h1', id: 'cp-h1' }, COPY.title), h('p', { class: 'cp-sub' }, fill(COPY.sub, { holiday: meta.name }))),
    h('div', { class: 'cp-hactions' }, mineBtn, printBtn),
  );

  // ── tools ──
  const undoBtn = btn('btn-secondary btn-icon cp-tool', COPY.undo, () => step('undo'), toolIcon('undo', 24));
  const redoBtn = btn('btn-secondary btn-icon cp-tool', COPY.redo, () => step('redo'), toolIcon('redo', 24));
  const surpriseBtn = btn('btn-secondary cp-tool cp-surprise', COPY.surpriseLabel, () => surprise(), toolIcon('wand', 24), h('span', {}, COPY.surprise));
  const doneBtn = btn('cp-tool cp-done', COPY.doneLabel, () => done(), icon('check', 24), h('span', {}, COPY.done));
  const tools = h('div', { class: 'cp-tools' }, undoBtn, redoBtn, surpriseBtn, doneBtn);

  // ── crayon box (a radio group: one tab stop, arrows move) ──
  const crayonEls = new Map<string, HTMLButtonElement>();
  const crayonBtn = (id: string, label: string, art: SVGSVGElement, cls: string): HTMLButtonElement => {
    const b = h('button', { type: 'button', role: 'radio', class: `cp-crayon ${cls}`, 'aria-label': label, title: label, 'aria-checked': 'false', tabindex: -1, onclick: () => pick(id) }, art);
    crayonEls.set(id, b);
    return b;
  };
  const boxEl = h('div', { class: 'cp-box', role: 'radiogroup', 'aria-label': COPY.crayonBox });
  const drawerTabs = new Map<string, HTMLButtonElement>();
  const openDrawer = (id: string): void => {
    drawer = drawers.find((d) => d.id === id) ?? drawer;
    crayonIds = [ERASER, ...drawer.crayons.map((c) => c.id)];
    crayonEls.clear();
    boxEl.replaceChildren(
      crayonBtn(ERASER, COPY.eraserLabel, eraserArt(), 'cp-eraser'),
      ...drawer.crayons.map((c) => crayonBtn(c.id, c.name, crayonArt(c, `cpc-${c.id}`), `cp-k-${c.kind}`)),
    );
    boxEl.scrollTop = 0;
    for (const [tid, tab] of drawerTabs) tab.setAttribute('aria-pressed', String(tid === drawer.id));
  };
  const drawerRow = h('div', { class: 'cp-drawers', role: 'group', 'aria-label': COPY.crayonBox }, ...drawers.map((d) => {
    const tab = h('button', { type: 'button', class: 'cp-drawer', 'aria-pressed': 'false', onclick: () => { openDrawer(d.id); pick(selected); } }, d.name);
    drawerTabs.set(d.id, tab);
    return tab;
  }));
  openDrawer(drawer.id);
  boxEl.addEventListener('keydown', (e) => {
    const i = crayonIds.indexOf(selected);
    const to = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1
      : e.key === 'Home' ? 0 : e.key === 'End' ? crayonIds.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    pick(crayonIds[(to + crayonIds.length) % crayonIds.length]!, true);
  });
  const side = h('div', { class: 'cp-side' }, tools, drawerRow, boxEl, h('p', { class: 'cp-hint' }, COPY.crayonsHint));

  // ── the sheet ──
  const paper = h('div', { class: 'cp-paper' }, h('div', { class: 'cp-loading' }, mascot('curious', 96)));
  const viewport = h('div', { class: 'cp-viewport' }, paper);
  const zoomBtns = {
    in: btn('btn-secondary btn-icon cp-zbtn', COPY.zoomIn, () => zoomBy(1.6), icon('plus', 22)),
    out: btn('btn-secondary btn-icon cp-zbtn', COPY.zoomOut, () => zoomBy(1 / 1.6), icon('minus', 22)),
    fit: btn('btn-secondary btn-icon cp-zbtn', COPY.zoomReset, () => setView(IDENTITY, true), toolIcon('fit', 22)),
  };
  const stamp = stampEl(COPY.stamp);
  const frame = h('div', { class: 'cp-frame' }, h('div', { class: 'cp-tape', 'aria-hidden': 'true' }), viewport, stamp,
    h('div', { class: 'cp-zoom' }, zoomBtns.in, zoomBtns.out, zoomBtns.fit));
  const note = h('p', { class: 'cp-note', role: 'status', hidden: true });
  const stage = h('div', { class: 'cp-stage' }, frame, note);
  const main = h('div', { class: 'cp-main' }, side, stage);
  const root = h('section', { class: 'cp sky', 'aria-labeledby': 'cp-h1' }, header, main);
  applyTheme(root, theme);
  const syncMotion = (): void => { root.classList.toggle('cp-calm', !full()); };
  syncMotion();
  const offMotion = ctx.onMotionChange(syncMotion);

  // ── state ──
  let clean: CleanPage | null = null;
  let page: ColorPage | null = null;
  let ids: string[] = [];
  let order: string[] = [];
  let current: string | null = null;
  let hoverId: string | null = null;
  let doc: Doc = newDoc();
  let itemId: string | null = null;
  let savedFills: Fills | null = null;
  let view: View = IDENTITY;
  let panel: Panel | null = null;
  let wasAllFilled = false;
  let draftTimer: number | null = null;
  let offGestures: (() => void) | null = null;
  let printSheet: HTMLElement | null = null;
  let destroyed = false;

  function pick(id: string, focus = false): void {
    selected = id;
    lastCrayon = id;
    for (const [cid, el] of crayonEls) {
      const on = cid === id;
      el.setAttribute('aria-checked', String(on));
      el.tabIndex = on ? 0 : -1;
    }
    if (crayonEls.size > 0 && !crayonEls.has(id)) crayonEls.get(ERASER)?.setAttribute('tabindex', '0');
    const el = crayonEls.get(id);
    if (focus) el?.focus({ preventScroll: true });
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    root.style.setProperty('--cp-sel', solidFor(id, box));
    refreshHighlight();
  }

  function say(text: string): void { ctx.announce(text); }

  function showNote(text: string, ms = 3800): void {
    note.textContent = text;
    note.hidden = false;
    note.classList.remove('is-in');
    void note.offsetWidth;
    note.classList.add('is-in');
    later(() => { if (note.textContent === text) note.hidden = true; }, ms);
  }

  // ── view (zoom/pan) ──
  const size = (): { w: number; h: number } => ({ w: viewport.clientWidth || 1, h: viewport.clientHeight || 1 });
  function setView(v: View, animate = false): void {
    view = v;
    paper.classList.toggle('cp-glide', animate && full());
    paper.style.transform = v.s === 1 && v.tx === 0 && v.ty === 0 ? '' : `translate(${v.tx}px, ${v.ty}px) scale(${v.s})`;
    zoomBtns.in.disabled = v.s >= MAX_ZOOM - 0.001;
    zoomBtns.out.disabled = v.s <= 1.001;
    zoomBtns.fit.disabled = v.s <= 1.001;
    root.classList.toggle('is-zoomed', v.s > 1.001);
  }
  function zoomBy(f: number): void {
    const { w, h: hh } = size();
    setView(zoomAt(view, f, w / 2, hh / 2, w, hh), true);
  }

  // ── painting ──
  function regionLabel(id: string): string {
    const c = doc.fills[id];
    return c ? fill(COPY.regionFilled, { name: regionName(id), color: nameOf(c) }) : fill(COPY.regionBlank, { name: regionName(id) });
  }

  function apply(next: Doc, how: { from?: { x: number; y: number }; animate: boolean; wave?: boolean }): void {
    if (!page) return;
    const changed = diffRegions(doc.fills, next.fills);
    doc = next;
    const rank = how.wave ? new Map(order.map((id, i) => [id, i])) : null;
    const gap = rank ? Math.min(28, WAVE_MS / Math.max(1, changed.length)) : 0;
    for (const id of changed) {
      page.paint(id, doc.fills[id] ?? null, {
        animate: how.animate,
        ...(how.from ? { from: how.from } : {}),
        ...(rank ? { delay: (rank.get(id) ?? 0) * gap } : {}),
      });
      page.focusEl(id)?.setAttribute('aria-label', regionLabel(id));
    }
    if (changed.length) stamp.classList.remove('is-on');
    syncTools();
    queueDraft();
    const all = ids.length > 0 && filledCount(doc.fills, ids) === ids.length;
    if (all && !wasAllFilled) {
      showNote(COPY.allDone);
      doneBtn.classList.remove('is-nudged');
      void doneBtn.offsetWidth;
      doneBtn.classList.add('is-nudged');
    }
    wasAllFilled = all;
  }

  function fillRegion(id: string, from?: { x: number; y: number }): void {
    const crayon = selected === ERASER ? null : selected;
    if ((doc.fills[id] ?? null) === crayon) return;
    apply(paint(doc, id, crayon), { animate: full(), ...(from ? { from } : {}) });
    say(crayon ? fill(COPY.filled, { name: regionName(id), color: nameOf(crayon) }) : fill(COPY.erased, { name: regionName(id) }));
    const el = crayonEls.get(selected);
    if (el && full()) { el.classList.remove('is-used'); void el.offsetWidth; el.classList.add('is-used'); }
  }

  function step(dir: 'undo' | 'redo'): void {
    const next = dir === 'undo' ? undo(doc) : redo(doc);
    if (next === doc) return;
    page?.settle();
    apply(next, { animate: false });
    say(dir === 'undo' ? COPY.undone : COPY.redone);
  }

  function surprise(): void {
    if (!page) return;
    page.settle();
    apply(replaceAll(doc, ids, surpriseFills(ids, box, seed++)), { animate: full(), wave: true });
    say(COPY.surprised);
    if (full()) { surpriseBtn.classList.remove('is-magic'); void surpriseBtn.offsetWidth; surpriseBtn.classList.add('is-magic'); }
  }

  function syncTools(): void {
    undoBtn.disabled = !canUndo(doc);
    redoBtn.disabled = !canRedo(doc);
    const mine = myItems().length;
    mineCount.textContent = mine ? String(mine) : '';
    mineBtn.setAttribute('aria-label', mine ? fill(COPY.mineCount, { n: mine }) : COPY.mine);
  }

  // ── drafts and the Fridge ──
  function queueDraft(): void {
    if (draftTimer !== null) window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(flushDraft, 250);
  }
  function flushDraft(): void {
    if (draftTimer !== null) { window.clearTimeout(draftTimer); draftTimer = null; }
    store.write(withDraft(store.read(), pageId, { fills: doc.fills, ...(itemId ? { itemId } : {}) }));
  }

  const madeOn = (iso: string): string => { const d = parseIso(iso); return d ? formatShort(d, ctx.locale) : iso; };

  function myItems(): FridgeItem<ColorItemData>[] {
    return shelf().list('color').filter((i): i is FridgeItem<ColorItemData> => isColorData(i.data) && i.data.pageId === pageId);
  }

  const known = (f: Fills): Fills => {
    const ok = new Set(ids);
    const crayons = new Set(box.map((c) => c.id));
    return Object.fromEntries(Object.entries(cleanFills(f)).filter(([k, v]) => ok.has(k) && crayons.has(v)));
  };

  function load(fills: Fills, item: string | null): void {
    page?.settle();
    doc = newDoc(known(fills));
    itemId = item;
    savedFills = item ? doc.fills : null;
    page?.setAll(doc.fills);
    for (const id of ids) page?.focusEl(id)?.setAttribute('aria-label', regionLabel(id));
    stamp.classList.toggle('is-on', item !== null);
    wasAllFilled = ids.length > 0 && filledCount(doc.fills, ids) === ids.length;
    syncTools();
    flushDraft();
  }

  const unsaved = (): boolean => Object.keys(doc.fills).length > 0 && (savedFills === null || diffRegions(savedFills, doc.fills).length > 0);

  /** Put the picture on the Fridge (or update it). Returns false only when the Fridge is full. */
  function keep(): 'saved' | 'updated' | 'pretend' | 'full' {
    const data = itemData(pageId, theme.id, doc.fills);
    const f = shelf();
    if (ctx.clock.pretending) return 'pretend';
    if (itemId && f.get(itemId)) {
      f.update(itemId, data);
      savedFills = doc.fills;
      flushDraft();
      return 'updated';
    }
    const res = f.add<ColorItemData>({ kind: 'color', holidayId: meta.id, made: formatIso(ctx.clock.today()), title: fill(COPY.itemTitle, { holiday: meta.name }), data });
    if (!res.ok) return res.reason === 'full' ? 'full' : 'pretend';
    itemId = res.item.id;
    savedFills = doc.fills;
    flushDraft();
    syncTools();
    return 'saved';
  }

  function done(): void {
    if (!page) return;
    page.settle();
    const result = keep();
    if (result === 'full') { showFull(() => done()); return; }
    slamStamp();
    const actions = [
      btn('btn-lg', COPY.keepGoing, () => panel?.close(), toolIcon('wand', 22), h('span', {}, COPY.keepGoing)),
      btn('btn-secondary', COPY.freshPage, () => { panel?.close(); load({}, null); }, h('span', {}, COPY.freshPage)),
      btn('btn-secondary', fill(COPY.backTo, { holiday: meta.name }), () => env.close(), h('span', {}, fill(COPY.backTo, { holiday: meta.name }))),
    ];
    const title = result === 'pretend' ? COPY.pretendTitle : result === 'updated' ? COPY.updatedTitle : COPY.savedTitle;
    const body = result === 'pretend' ? COPY.pretendBody : COPY.savedBody;
    later(() => {
      if (destroyed) return;
      panel = openPanel(root, { title, closeLabel: COPY.mineClose, body: [h('div', { class: 'cp-panel-jubi' }, mascot('party', 104)), h('p', {}, body)], actions, onClose: () => { panel = null; } });
    }, full() ? 650 : 0);
    say(title);
  }

  function slamStamp(): void {
    stamp.classList.remove('is-on');
    void stamp.offsetWidth;
    stamp.classList.add('is-on');
    if (!full()) return;
    const used = [...new Set(Object.values(doc.fills))].map((c) => solidFor(c, box)).slice(0, 6);
    later(() => {
      const f = frame.getBoundingClientRect();
      const s = stamp.getBoundingClientRect();
      starBurst(frame, s.left - f.left + s.width / 2, s.top - f.top + s.height / 2, used);
    }, 260);
  }

  function showFull(retry: () => void): void {
    const f = shelf();
    const oldest = f.list().slice(0, 6);
    const rows = oldest.map((it) => h('li', { class: 'cp-full-row' },
      h('span', { class: 'cp-full-name' }, it.title, h('small', {}, madeOn(it.made))),
      btn('btn-secondary', fill(COPY.takeDownLabel, { title: it.title }), () => { f.remove(it.id); panel?.close(); retry(); }, h('span', {}, COPY.takeDown)),
    ));
    panel = openPanel(root, { title: COPY.fullTitle, closeLabel: COPY.mineClose, body: [h('p', {}, COPY.fullBody), h('ul', { class: 'cp-full-list' }, ...rows)], onClose: () => { panel = null; } });
  }

  /** Before switching pictures, make sure the current one is kept. */
  function ensureKept(then: () => void): void {
    if (!unsaved()) { then(); return; }
    const r = keep();
    if (r === 'full') { showFull(() => ensureKept(then)); return; }
    then();
  }

  function showMine(): void {
    if (!clean) return;
    const items = myItems();
    const tiles = items.map((it, i) => {
      const thumb = staticPage(clean!, it.id === itemId ? doc.fills : known(it.data.fills), box);
      return h('li', {}, btn(`cp-thumb${it.id === itemId ? ' is-current' : ''}`, fill(COPY.mineOpen, { n: i + 1 }), () => {
        panel?.close();
        if (it.id === itemId) return;
        ensureKept(() => load(it.data.fills, it.id));
      }, thumb, h('span', { class: 'cp-thumb-date' }, madeOn(it.made))));
    });
    const fresh = btn('btn-secondary', COPY.mineNew, () => { panel?.close(); ensureKept(() => load({}, null)); }, icon('plus', 22), h('span', {}, COPY.mineNew));
    panel = openPanel(root, {
      title: fill(COPY.mineTitle, { holiday: meta.name }), closeLabel: COPY.mineClose, variant: 'cp-panel-wide',
      body: items.length ? [h('ul', { class: 'cp-thumbs' }, ...tiles)] : [h('p', {}, COPY.mineEmpty)],
      actions: [fresh], onClose: () => { panel = null; },
    });
  }

  // ── print ──
  function makeSheet(blank: boolean): void {
    printSheet?.remove();
    if (!clean) return;
    printSheet = h('div', { class: 'cp-print-sheet', 'aria-hidden': 'true' },
      staticPage(clean, blank ? {} : doc.fills, box),
      h('p', { class: 'cp-print-caption' }, fill(COPY.printCaption, { holiday: meta.name })));
    document.body.append(printSheet);
    document.documentElement.classList.add('cp-printing');
  }
  function clearSheet(): void {
    printSheet?.remove();
    printSheet = null;
    document.documentElement.classList.remove('cp-printing');
  }
  const beforePrint = (): void => { if (!printSheet) makeSheet(false); };
  window.addEventListener('beforeprint', beforePrint);
  window.addEventListener('afterprint', clearSheet);
  function showPrint(): void {
    const go = (blank: boolean): void => { panel?.close(); makeSheet(blank); window.print(); };
    panel = openPanel(root, {
      title: COPY.printTitle, closeLabel: COPY.printCancel,
      body: [],
      actions: [
        btn('btn-lg', COPY.printColors, () => go(false), icon('print', 22), h('span', {}, COPY.printColors)),
        btn('btn-secondary', COPY.printBlank, () => go(true), h('span', {}, COPY.printBlank)),
      ],
      onClose: () => { panel = null; },
    });
  }

  // ── keyboard ──
  function focusRegion(id: string): void {
    if (!page) return;
    const prev = current ? page.focusEl(current) : null;
    const el = page.focusEl(id);
    if (!el) return;
    prev?.setAttribute('tabindex', '-1');
    el.setAttribute('tabindex', '0');
    current = id;
    el.focus({ preventScroll: true });
  }

  function onPageKey(e: KeyboardEvent): void {
    const id = (e.target as Element).getAttribute?.('data-fill');
    if (!id || !page) return;
    const i = order.indexOf(id);
    const go = (j: number): void => { e.preventDefault(); focusRegion(order[(j + order.length) % order.length]!); };
    switch (e.key) {
      case 'Tab': {
        const j = e.shiftKey ? i - 1 : i + 1;
        if (j >= 0 && j < order.length) go(j);
        return;
      }
      case 'ArrowRight': case 'ArrowDown': go(i + 1); return;
      case 'ArrowLeft': case 'ArrowUp': go(i - 1); return;
      case 'Home': go(0); return;
      case 'End': go(order.length - 1); return;
      case 'Enter': case ' ': e.preventDefault(); fillRegion(id); return;
      case 'Delete': case 'Backspace':
        e.preventDefault();
        if (doc.fills[id]) { apply(paint(doc, id, null), { animate: full() }); say(fill(COPY.erased, { name: regionName(id) })); }
        return;
    }
  }

  function onRootKey(e: KeyboardEvent): void {
    if (panel || e.altKey) return;
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key;
    if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); step(e.shiftKey ? 'redo' : 'undo'); return; }
    if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); step('redo'); return; }
    if (mod) return;
    const i = crayonIds.indexOf(selected);
    if (k === '[' || k === ']') {
      e.preventDefault();
      const next = crayonIds[(i + (k === ']' ? 1 : -1) + crayonIds.length) % crayonIds.length]!;
      pick(next);
      say(next === ERASER ? COPY.pickedEraser : fill(COPY.picked, { color: nameOf(next) }));
    } else if (/^[1-9]$/.test(k)) {
      const c = box[Number(k) - 1];
      if (c) { pick(c.id); say(fill(COPY.picked, { color: c.name })); }
    } else if (k === 'e' || k === 'E') {
      pick(ERASER);
      say(COPY.pickedEraser);
    } else if (k === '+' || k === '=') { e.preventDefault(); zoomBy(1.6); }
    else if (k === '-' || k === '_') { e.preventDefault(); zoomBy(1 / 1.6); }
    else if (k === '0') { setView(IDENTITY, true); }
    else if (k === 'Escape') { e.preventDefault(); env.close(); }
  }
  root.addEventListener('keydown', onRootKey);

  function refreshHighlight(): void {
    if (!page) return;
    const focused = current && page.el.contains(document.activeElement) ? current : null;
    const id = focused ?? hoverId;
    page.highlight(id, id ? (selected === ERASER ? null : selected) : undefined, focused !== null);
  }

  // ── start ──
  function start(c: CleanPage): void {
    clean = c;
    page = new ColorPage(c, box);
    ids = page.ids;
    order = ids.slice();
    page.el.setAttribute('role', 'group');
    page.el.setAttribute('tabindex', '-1');
    page.el.setAttribute('aria-label', fill(COPY.page, { holiday: meta.name }));
    for (const id of ids) {
      const el = page.focusEl(id);
      if (!el) continue;
      el.setAttribute('tabindex', '-1');
      el.setAttribute('role', 'button');
    }
    paper.replaceChildren(page.el);
    const p = page;
    p.el.addEventListener('keydown', onPageKey);
    p.el.addEventListener('focusin', (e) => {
      const id = (e.target as Element).getAttribute?.('data-fill');
      if (!id) return;
      current = id;
      refreshHighlight();
      if (view.s > 1.001) {
        const b = p.boxOf(id);
        const vb = p.el.viewBox.baseVal;
        const { w, h: hh } = size();
        if (b && vb.width > 0) {
          const k = w / vb.width;
          setView(reveal(view, { x: (b.x - vb.x) * k, y: (b.y - vb.y) * k, w: b.w * k, h: b.h * k }, w, hh), true);
        }
      }
    });
    p.el.addEventListener('focusout', () => { window.setTimeout(refreshHighlight, 0); });
    offGestures = attachGestures({
      el: viewport,
      size,
      view: () => view,
      setView: (v) => setView(v),
      tap: (x, y) => { const id = p.regionAt(x, y); if (id) fillRegion(id, { x, y }); },
      hover: (x, y) => { const id = p.regionAt(x, y, 0); if (id !== hoverId) { hoverId = id; refreshHighlight(); } },
      leave: () => { hoverId = null; refreshHighlight(); },
    });

    // Restore: an explicit Fridge item (…/play/color?item=<id>), else this page's draft.
    const wanted = /[?&]item=([A-Za-z0-9_-]+)/.exec(location.hash)?.[1];
    const fromFridge = wanted ? myItems().find((i) => i.id === wanted) : undefined;
    const draft = store.read().drafts[pageId];
    if (fromFridge) load(fromFridge.data.fills, fromFridge.id);
    else if (draft) {
      const item = draft.itemId ? myItems().find((i) => i.id === draft.itemId) : undefined;
      load(draft.fills, item ? item.id : null);
      if (item) savedFills = known(item.data.fills);
      stamp.classList.toggle('is-on', item !== undefined && !unsaved());
      if (Object.keys(doc.fills).length) { showNote(COPY.welcomeBack); say(COPY.welcomeBack); }
    } else load({}, null);

    // Reading order needs layout; until then document order is a fine stand-in.
    requestAnimationFrame(() => {
      if (destroyed) return;
      const boxes = ids.map((id) => ({ id, ...(p.boxOf(id) ?? { x: 0, y: 0, w: 0, h: 0 }) }));
      order = readingOrder(boxes);
      const first = order[0];
      if (first) { p.focusEl(first)?.setAttribute('tabindex', '0'); current = null; }
    });
  }

  function failed(): void {
    paper.replaceChildren(h('div', { class: 'cp-loading cp-failed' }, mascot('sleepy', 96), h('p', {}, COPY.failed),
      btn('', fill(COPY.backTo, { holiday: meta.name }), () => env.close(), h('span', {}, fill(COPY.backTo, { holiday: meta.name })))));
  }

  pick(selected);
  setView(IDENTITY);
  syncTools();
  opts.source.load(pageId).then((text) => {
    if (destroyed) return;
    const parsed = text ? parseColorPage(text) : null;
    if (parsed && parsed.regions.length > 0) start(parsed);
    else failed();
  }).catch(() => { if (!destroyed) failed(); });

  return {
    el: root,
    destroy() {
      destroyed = true;
      if (draftTimer !== null && page) flushDraft();
      for (const t of timers) window.clearTimeout(t);
      timers.clear();
      panel?.close();
      offGestures?.();
      offMotion();
      page?.destroy();
      clearSheet();
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', clearSheet);
      root.removeEventListener('keydown', onRootKey);
    },
  };
}
