/**
 * Card Maker (activity id 'card') — a folded card the child designs and keeps.
 *
 * FRONT: the holiday's illustrated scene (or a sky, confetti, stripes, stars, dots or paper), a hello in
 * one of the holiday's own languages (native script big, romanization small) under a name pill, and
 * stickers: the holiday's vector decorations from the effects painters and every holiday's die-cut
 * sticker (earned ones wear a gold edge; nothing is locked). INSIDE: "Dear …", a message and "Love from
 * …" (pre-filled with the child's name), more stickers, and a pen on both faces.
 *
 * Out: Print (two-sided, folded; print.ts), Save picture (rasterized on the device; raster.ts) and the
 * Fridge (the card's JSON, reopenable and editable; shelf.ts). Undo/redo for every change. Every action
 * has a keyboard path (see stage.ts for sticker and pen keys); Ctrl+Z / Ctrl+Y undo and redo anywhere
 * outside a text field; Escape lets go of a sticker, stops the pen, then goes back.
 *
 * Motion: full → the cover swings open like a book, stickers pop on with a spring, a sparkle burst when
 * the card goes on the Fridge. Reduced/off → faces cross-fade, stickers appear in place, no burst.
 */
import './card.css';
import { sceneFor } from '../../art/index';
import { formatIso } from '../../dates/civil';
import { applyTheme } from '../../theme/apply';
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { fridge, type FridgeItem } from '../fridge';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { COPY, fill } from './copy';
import { decorFor, earnedIds, holidayStickerOrder } from './decor';
import { glyph } from './glyphs';
import {
  addSticker, addStroke, cardTitle, clearStrokes, findSticker, History, newCard, removeSticker, restack, updateSticker,
  type CardGreeting, type CardSpec, type FaceId, type Placed, type StickerArt,
} from './model';
import { printCard } from './print';
import { loadAssets, savePicture, type CardEnv } from './raster';
import { fridgeFullDialog, myCardsDialog, type Dialog } from './shelf';
import { burst } from './sparkle';
import { Stage, type StageCtl } from './stage';
import { penColors, Tools, type ToolsCtl } from './tools';
import { canvasMeasure, estimateMeasure } from './text';

export { BG_IDS, PANEL_H, PANEL_W, sanitizeCard, simplify, type CardSpec } from './model';
export { decorFor, painterFor } from './decor';

/** The card the child was making on each holiday this session, so leaving and coming back loses nothing. */
const drafts = new Map<string, { card: CardSpec; fridgeId: string | null }>();

export const cardActivity: Activity = {
  id: 'card',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  // Every holiday can make a card: no greetings → "Happy <holiday>!", no scene → the theme's sky.
  available: (meta) => meta.name.length > 0,
  mount: (env) => mountCard(env),
};

function starterCard(env: PlayEnv, decorKeys: readonly { p: string; c: string }[]): CardSpec {
  const { meta, content, ctx } = env;
  const g = content.greetings[0];
  let greeting: CardGreeting | null = null;
  if (g) {
    const o: { text: string; lang: string; langName: string; roman?: string; sayIt?: string; meaning?: string } = { text: g.text, lang: g.lang, langName: g.langName, sayIt: g.sayIt, meaning: g.meaning };
    if (g.roman) o.roman = g.roman;
    greeting = o;
  }
  const front: Placed[] = [];
  let card = newCard({ holidayId: meta.id, bg: sceneFor(meta.id) ? 'scene' : 'sky', greeting, ...(ctx.store.progress.name ? { from: ctx.store.progress.name } : {}), front });
  // A sticker or three to show what stickers do (one tap on "Take off" removes them).
  // On the scene the holiday sticker tucks into a corner; on a plain sky it is the star of the card.
  const big = card.bg !== 'scene';
  card = addSticker(card, 'front', { t: 'holiday', h: meta.id, e: meta.sticker.emoji }, big ? { x: 262, y: 500, s: 210, r: -5 } : { x: 400, y: 596, s: 130, r: 8 }, 'starter-1').card;
  const [a, b] = decorKeys;
  if (a) card = addSticker(card, 'front', { t: 'decor', ...a }, { x: 78, y: 352, s: 96, r: -12 }, 'starter-2').card;
  if (b) card = addSticker(card, 'front', { t: 'decor', ...b }, { x: 430, y: 330, s: 80, r: 14 }, 'starter-3').card;
  return card;
}

function mountCard(env: PlayEnv): ActivityInstance {
  const { ctx, meta, content, theme } = env;
  const full = (): boolean => ctx.motion === 'full';
  const earned = earnedIds(ctx.store.progress.stickers);
  const decor = decorFor(meta, theme);
  const decorLabel = new Map(decor.map((d) => [d.key, d.label]));
  const metaOf = (id: string) => (id === meta.id ? meta : ctx.metaOf(id));
  const name = ctx.store.progress.name;
  const cardEnv: CardEnv = {
    theme,
    holidayName: meta.name,
    holidayEmoji: meta.sticker.emoji,
    holidayTheme: meta.theme,
    measure: canvasMeasure() ?? estimateMeasure,
    happy: COPY.greetingHappy,
    inside: { dear: COPY.dear, love: COPY.love },
    info: { title: COPY.infoTitle, means: COPY.infoMeans, sayIt: COPY.infoSay, happy: COPY.greetingHappy },
    back: { made: name ? fill(COPY.backMade, { name }) : COPY.backMadePlain, app: COPY.backApp },
    holidayInfo: (id, emoji) => {
      const m = metaOf(id);
      return m ? { emoji: m.sticker.emoji || emoji, theme: m.theme } : { emoji, theme: meta.theme };
    },
    earned: (id) => earned.has(id),
  };
  const labelOf = (p: Placed): string => {
    if (p.art.t === 'decor') return decorLabel.get(`${p.art.p}|${p.art.c}`) ?? p.art.p.replace(/^glyph:/, '').replace(/([A-Z])/g, ' $1').toLowerCase();
    const m = metaOf(p.art.h);
    return m?.sticker.label || m?.name || p.art.e;
  };

  // ── state ──
  const draft = drafts.get(meta.id);
  const history = new History<CardSpec>(draft?.card ?? starterCard(env, decor.slice(0, 2)));
  let fridgeId: string | null = draft?.fridgeId ?? null;
  let face: FaceId = 'front';
  let selected: string | null = null;
  const pens = penColors(theme);
  const pen = { on: false, color: pens[0] ?? '#1f1a3d', width: 7 };
  let textEditing = false;
  let dlg: Dialog | null = null;
  const timers = new Set<number>();
  const card = (): CardSpec => history.current;
  const keepDraft = (): void => { drafts.set(meta.id, { card: card(), fridgeId }); };

  // ── chrome ──
  const undoBtn = h('button', { type: 'button', class: 'btn btn-secondary btn-icon', 'aria-label': COPY.undo, title: COPY.undo, onclick: () => undo() }, glyph('undo', 22));
  const redoBtn = h('button', { type: 'button', class: 'btn btn-secondary btn-icon', 'aria-label': COPY.redo, title: COPY.redo, onclick: () => redo() }, glyph('redo', 22));
  const faceBtns: Record<FaceId, HTMLButtonElement> = {
    front: h('button', { type: 'button', 'aria-pressed': 'true', onclick: () => setFace('front') }, COPY.front),
    inside: h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => setFace('inside') }, COPY.inside),
  };
  const header = h('header', { class: 'cm-head' },
    h('button', { type: 'button', class: 'btn btn-secondary btn-icon', 'aria-label': fill(COPY.close, { holiday: meta.name }), onclick: () => env.close() }, icon('close', 22)),
    h('h1', { class: 'cm-h1', id: 'cm-h1' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, meta.emoji), ' ', COPY.title),
    h('div', { class: 'segmented cm-faces', role: 'group', 'aria-label': COPY.title }, faceBtns.front, faceBtns.inside),
    h('div', { class: 'cm-undo' }, undoBtn, redoBtn));

  const stageCtl: StageCtl = {
    card,
    face: () => face,
    selected: () => selected,
    select: (id, quiet) => select(id, quiet),
    commitSticker: (f, p) => commit(updateSticker(card(), f, p.id, { x: p.x, y: p.y, s: p.s, r: p.r })),
    removeSelected: () => removeSelected(),
    restackSelected: (by) => { if (selected) commit(restack(card(), face, selected, by)); },
    commitStroke: (f, s) => commit(addStroke(card(), f, s)),
    pen: () => pen,
    penOff: () => setPen({ on: false }),
    labelFor: (p) => fill(COPY.stickerLabel, { label: labelOf(p) }),
    announce: (t) => ctx.announce(t),
    motion: full,
    onGhost: (field) => tools.focusInput(field),
  };
  const stage = new Stage(cardEnv, stageCtl);

  const selBtn = (g: Parameters<typeof glyph>[0], label: string, fn: () => void): HTMLButtonElement =>
    h('button', { type: 'button', class: 'btn btn-secondary cm-sel-btn', 'aria-label': label, title: label, onclick: fn }, glyph(g, 22), h('span', { class: 'cm-sel-text' }, label));
  const nudgeSel = (change: (p: Placed) => Partial<Placed>): void => {
    const p = selected ? findSticker(card(), face, selected) : undefined;
    if (p) commit(updateSticker(card(), face, p.id, change(p)));
  };
  const selbar = h('div', { class: 'cm-selbar', role: 'toolbar', 'aria-label': COPY.stickerHelp, hidden: true },
    selBtn('smaller', COPY.smaller, () => nudgeSel((p) => ({ s: p.s / 1.15 }))),
    selBtn('bigger', COPY.bigger, () => nudgeSel((p) => ({ s: p.s * 1.15 }))),
    selBtn('turnLeft', COPY.turnLeft, () => nudgeSel((p) => ({ r: p.r - 15 }))),
    selBtn('turnRight', COPY.turnRight, () => nudgeSel((p) => ({ r: p.r + 15 }))),
    selBtn('layers', COPY.toTop, () => { if (selected) commit(restack(card(), face, selected, Infinity)); }),
    selBtn('bin', COPY.remove, () => removeSelected()));
  stage.el.append(selbar);

  const toolsCtl: ToolsCtl = {
    card,
    addSticker: (art, label) => add(art, label),
    setGreeting: (g) => { commit({ ...card(), greeting: g }); setFace('front'); ctx.announce(fill(COPY.sayGreeting, { text: g?.text ?? fill(COPY.greetingHappy, { holiday: meta.name }) })); },
    setWordsAt: (w) => { commit({ ...card(), wordsAt: w }); setFace('front'); },
    setText: (field, value, done) => setText(field, value, done),
    showInside: () => setFace('inside'),
    showFront: () => setFace('front'),
    pen: () => pen,
    setPen: (c) => setPen(c),
    clearDrawing: () => commit(clearStrokes(card(), face)),
    setBg: (bg) => { commit({ ...card(), bg }); setFace('front'); ctx.announce(fill(COPY.sayBg, { bg: fill(COPY.bg[bg] ?? bg, { holiday: meta.name }) })); },
    toFridge: () => toFridge(),
    print: () => { void printCard(card(), cardEnv); },
    savePicture: () => { void picture(); },
    myCards: () => openMyCards(),
    newCard: () => { fridgeId = null; commit(starterCard(env, decor.slice(0, 2))); select(null); setFace('front'); },
    editingSaved: () => fridgeId !== null && fridge(ctx.clock.pretending).get(fridgeId) !== undefined,
  };
  const allHolidays = holidayStickerOrder(ctx.allMetas(), meta.id, earned).map((m) => ({ meta: m, earned: earned.has(m.id) }));
  const tools = new Tools(meta, theme, content.greetings, { decor, holidays: allHolidays }, cardEnv, toolsCtl);

  const root = h('section', { class: 'cm sky', 'aria-labeledby': 'cm-h1' }, header, h('div', { class: 'cm-main' }, stage.el, tools.el));
  applyTheme(root, theme);
  const syncMotion = (): void => { root.classList.toggle('cm-calm', !full()); };
  syncMotion();
  const offMotion = ctx.onMotionChange(syncMotion);

  // ── state changes ──
  function render(force = false): void {
    stage.render(card(), selected, force);
    tools.sync();
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
    selbar.hidden = selected === null || pen.on;
  }

  let assetsKey = '';
  function refreshAssets(): void {
    const c = card();
    const key = `${c.bg}|${[...c.front.stickers, ...c.inside.stickers].map((s) => (s.art.t === 'holiday' ? s.art.h : '')).join(',')}`;
    if (key === assetsKey) return;
    assetsKey = key;
    void loadAssets(c).then((a) => { stage.setAssets(a); tools.setAssets(a); });
  }

  function commit(next: CardSpec): void {
    if (next === card()) return;
    const prevWords = card();
    history.commit(next);
    if (selected && !findSticker(next, face, selected)) selected = null;
    keepDraft();
    render();
    refreshAssets();
    if (prevWords.greeting !== next.greeting || prevWords.to !== next.to || prevWords.message !== next.message || prevWords.from !== next.from) stage.paintInfo();
  }

  function undo(): void {
    if (!history.undo()) return;
    if (selected && !findSticker(card(), face, selected)) selected = null;
    keepDraft();
    render();
    refreshAssets();
    stage.paintInfo();
    ctx.announce(COPY.sayUndo);
  }

  function redo(): void {
    if (!history.redo()) return;
    if (selected && !findSticker(card(), face, selected)) selected = null;
    keepDraft();
    render();
    refreshAssets();
    stage.paintInfo();
    ctx.announce(COPY.sayRedo);
  }

  function select(id: string | null, quiet = false): void {
    if (selected === id) return;
    selected = id;
    render();
    if (id && !quiet) stage.focusSelected();
  }

  function setFace(f: FaceId): void {
    if (face === f) return;
    face = f;
    selected = null;
    faceBtns.front.setAttribute('aria-pressed', String(f === 'front'));
    faceBtns.inside.setAttribute('aria-pressed', String(f === 'inside'));
    stage.showFace(f);
    render();
    ctx.announce(fill(COPY.sayFace, { face: f === 'front' ? COPY.frontLabel.toLowerCase() : COPY.insideLabel.toLowerCase() }));
  }

  function add(art: StickerArt, label: string): void {
    if (pen.on) setPen({ on: false });
    const res = addSticker(card(), face, art);
    if (!res.placed) { ctx.toast(COPY.stickerFull, '🧲'); return; }
    commit(res.card);
    select(res.placed.id, true);
    const el = stage.faceView(face).stickerEl(res.placed.id);
    if (el && full() && typeof el.animate === 'function') {
      el.animate([{ transform: 'translate(-50%,-50%) rotate(calc(var(--r) * 1deg)) scale(.2)', opacity: 0 }, { transform: 'translate(-50%,-50%) rotate(calc(var(--r) * 1deg)) scale(1.15)', opacity: 1, offset: 0.6 }, { transform: 'translate(-50%,-50%) rotate(calc(var(--r) * 1deg)) scale(1)' }],
        { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    ctx.announce(fill(COPY.sayAdded, { label }));
  }

  function removeSelected(): void {
    const p = selected ? findSticker(card(), face, selected) : undefined;
    if (!p) return;
    const label = labelOf(p);
    const hadFocus = root.contains(document.activeElement) && document.activeElement !== document.body;
    selected = null;
    commit(removeSticker(card(), face, p.id));
    // Keep keyboard focus on the card (the sticker that had it is gone), so Ctrl+Z still brings it back.
    if (hadFocus) stage.faceView(face).el.focus({ preventScroll: true });
    ctx.announce(fill(COPY.sayRemoved, { label }));
  }

  function setText(field: 'to' | 'message' | 'from', value: string, done: boolean): void {
    const next = { ...card(), [field]: value } as CardSpec;
    if (!textEditing) { history.commit(next); textEditing = true; } else history.replace(next);
    if (done) textEditing = false;
    keepDraft();
    render();
    stage.paintInfo();
  }

  function setPen(change: { on?: boolean; color?: string; width?: number }): void {
    if (change.color) pen.color = change.color;
    if (change.width) pen.width = change.width;
    if (change.on !== undefined) pen.on = change.on;
    if (pen.on) selected = null;
    render();
    if (change.on === true) stage.focusPen();
  }

  // ── outputs ──
  async function picture(): Promise<void> {
    ctx.toast(COPY.saving, '🖼️');
    const ok = await savePicture(card(), cardEnv, fill(COPY.pictureFile, { holiday: meta.id }));
    ctx.toast(ok ? COPY.savedPicture : COPY.saveFailed, ok ? '✨' : '🖨️');
  }

  function toFridge(): void {
    const f = fridge(ctx.clock.pretending);
    const title = cardTitle(card(), meta.name, { forWho: COPY.cardFor, plain: COPY.cardPlain });
    if (fridgeId && f.get(fridgeId)) {
      if (f.update(fridgeId, card(), title)) { celebrate(); ctx.toast(COPY.fridgeUpdated, '🧲'); }
      else ctx.toast(COPY.fridgePretend, '🖨️');
      return;
    }
    const res = f.add<CardSpec>({ kind: 'card', holidayId: meta.id, made: formatIso(ctx.clock.today()), title, data: card() });
    if (res.ok) {
      fridgeId = res.item.id;
      keepDraft();
      tools.sync();
      celebrate();
      ctx.toast(COPY.fridgeSaved, '🧲');
    } else if (res.reason === 'pretending') ctx.toast(COPY.fridgePretend, '🖨️');
    else {
      dlg = fridgeFullDialog(root, f.list(), (it: FridgeItem) => { f.remove(it.id); toFridge(); }, () => { dlg = null; });
    }
  }

  function celebrate(): void {
    if (!full()) return;
    const r = root.getBoundingClientRect();
    const b = stage.el.getBoundingClientRect();
    for (const t of burst(root, b.left - r.left + b.width / 2, b.top - r.top + b.height / 2, [theme.glow, theme.accent, theme.accent2, '#ffffff'])) timers.add(t);
  }

  function openMyCards(): void {
    const items = fridge(ctx.clock.pretending).list('card').filter((i) => i.holidayId === meta.id);
    dlg = myCardsDialog(root, items, cardEnv, (it, c) => {
      fridgeId = it.id;
      history.commit(c);
      selected = null;
      keepDraft();
      render(true);
      refreshAssets();
      stage.paintInfo();
      setFace('front');
    }, () => { dlg = null; });
  }

  // ── keys ──
  const onKey = (e: KeyboardEvent): void => {
    const t = e.target as HTMLElement;
    const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA';
    if ((e.ctrlKey || e.metaKey) && !typing) {
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); return; }
    }
    if (e.key !== 'Escape' || dlg) return;
    e.preventDefault();
    if (pen.on) setPen({ on: false });
    else if (selected) select(null);
    else env.close();
  };
  root.addEventListener('keydown', onKey);

  // ── go ──
  tools.sync();
  stage.showFace('front');
  render(true);
  refreshAssets();
  requestAnimationFrame(() => { stage.layout(); render(true); });
  if (document.fonts?.ready) void document.fonts.ready.then(() => { render(true); stage.paintInfo(); });

  return {
    el: root,
    destroy() {
      keepDraft();
      for (const t of timers) window.clearTimeout(t);
      dlg?.close();
      stage.destroy();
      offMotion();
      root.removeEventListener('keydown', onKey);
    },
  };
}
