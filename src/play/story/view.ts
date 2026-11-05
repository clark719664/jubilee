/**
 * view.ts — the open picture book. One spread at a time: the picture (the holiday's scene through the
 * page's camera, or the fallback sky with the sticker) and the paper leaf with the words.
 *
 *   spread 0      the cover: title plate, "Starring …", "Who is coming with you?", Open the book
 *   spread 1..N   the story pages
 *   spread N+1    The End: put it on the Fridge, print a little book, read it again
 *
 * Turning: the big ‹ › buttons, a swipe across the book, ←/→ (also PageUp/PageDown, Home/End). With
 * full motion the scene pans to the next camera with its planes sliding apart (parallax) while the leaf
 * lifts and turns like paper; reduced motion cross-fades both; 'off' swaps at once. "Read to me" reads
 * the page aloud only when tapped, lighting up each sentence and word, and stops on every turn.
 */
import { sceneFor, stickerUrl } from '../../art/index';
import { applyTheme } from '../../theme/apply';
import { h } from '../../ui/dom';
import { onVoicesChanged } from '../../ui/greetings';
import { icon } from '../../ui/icons';
import { fridge } from '../fridge';
import type { ActivityInstance, PlayEnv } from '../types';
import { COPY, fill } from './copy';
import { fridgeFullDialog, keepStory, keptItem, type Dialog } from './keep';
import { coverLeaf, coverPlate, endLeaf, endPlate, pageLeaf, type CoverLeaf, type EndLeaf, type PageLeaf } from './leaf';
import { picture, type Picture } from './picture';
import { printBooklet } from './print';
import { loadVoice } from '../../ui/voice';
import { bookLang, ReadAloud, type ReadState } from './reader';
import { bookTitle, cleanFriend, pageSentences, starring, who, wordAt, wordSpans, type Who } from './text';
import type { Camera, StoryBook } from './types';

const PAN_MS = 820;
const TURN_MS = 620;
const FADE_MS = 300;
const SWIPE_PX = 48;
const END_CAMERA: Camera = { x: 800, y: 450, zoom: 1 };
const FS_MIN = 15;
/** The largest page text: big type for early readers wherever the paper has room (fitText shrinks it to fit). */
const FS_MAX = 44;

function seedOf(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  return x >>> 0;
}

export function mountStory(env: PlayEnv, book: StoryBook): ActivityInstance {
  const { ctx, meta, theme } = env;
  const scene = sceneFor(meta.id);
  const sticker = stickerUrl(meta.id);
  const seed = seedOf(book.id);
  const total = book.pages.length;
  const last = total + 1;
  const name = ctx.store.progress.name;
  let friend = '';
  let w: Who = who(name, undefined);
  let idx = 0;
  const motion = (): 'full' | 'reduced' | 'off' => ctx.motion;
  // Ids are per instance: during a route transition two books can be on the page at once.
  const uid = Math.random().toString(36).slice(2, 8);
  const h1Id = `st-h1-${uid}`;
  const hintId = `st-hint-${uid}`;
  // Every listener this instance adds outside its own leaves goes through one signal, aborted in destroy().
  const listeners = new AbortController();
  const { signal } = listeners;

  // ── chrome ──
  // The page group already says "Page 3 of 8"; the visual counter would only add "three slash eight".
  const counter = h('span', { class: 'st-counter', 'aria-hidden': 'true' });
  const header = h('header', { class: 'st-head' },
    h('button', { type: 'button', class: 'btn btn-secondary btn-icon st-close', 'aria-label': fill(COPY.close, { holiday: meta.name }), onclick: () => env.close() }, icon('close', 22)),
    h('div', { class: 'st-titles' },
      h('h1', { class: 'st-h1', id: h1Id }, COPY.title),
      h('p', { class: 'st-sub' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, meta.emoji), ' ', meta.name)),
    counter);

  const picWrap = h('div', { class: 'st-picwrap' });
  const leafWrap = h('div', { class: 'st-leafwrap' });
  const book$ = h('div', { class: 'st-book', 'aria-describedby': hintId }, picWrap, leafWrap);
  const hint = h('p', { class: 'sr-only', id: hintId }, COPY.swipeHint);

  const prevBtn = h('button', { type: 'button', class: 'btn st-turn st-prev', 'aria-label': COPY.prev, onclick: () => go(idx - 1) }, icon('arrowLeft', 30));
  const nextBtn = h('button', { type: 'button', class: 'btn st-turn st-next', 'aria-label': COPY.next, onclick: () => go(idx + 1) }, icon('arrowRight', 30));
  const readText = h('span', {}, COPY.readToMe);
  // The label says the state ("Read to me" / "Stop reading"), so there is no aria-pressed as well: a screen
  // reader would say "Stop reading, toggle button, pressed".
  const readBtn = h('button', { type: 'button', class: 'btn btn-secondary st-read', hidden: true, onclick: () => toggleRead() }, icon('speaker', 22), readText);
  const dots = h('ol', { class: 'st-dots', 'aria-hidden': 'true' }, ...Array.from({ length: last + 1 }, () => h('li')));
  const nav = h('nav', { class: 'st-nav', 'aria-label': COPY.navLabel }, prevBtn, h('div', { class: 'st-mid' }, dots, readBtn), nextBtn);

  const root = h('section', { class: 'st sky', 'aria-labeledby': h1Id }, header, h('div', { class: 'st-main' }, book$), nav, hint);
  applyTheme(root, theme);
  root.classList.toggle('has-scene', scene !== null);
  const syncMotion = (): void => { root.dataset.motion = motion(); };
  syncMotion();
  const offMotion = ctx.onMotionChange(() => syncMotion());

  // ── read to me ──
  let current: PageLeaf | null = null;
  const reader = new ReadAloud(bookLang(ctx.locale), (s) => showReading(s));
  const syncReadBtn = (): void => {
    readBtn.hidden = !(current && reader.available());
    readBtn.classList.toggle('is-reading', reader.active);
    readText.textContent = reader.active ? COPY.stopReading : COPY.readToMe;
  };
  let offVoices: () => void = () => undefined;
  try { offVoices = onVoicesChanged(syncReadBtn); } catch { /* speech that throws: the button just stays hidden */ }
  void loadVoice().then(() => syncReadBtn());

  function toggleRead(): void {
    if (reader.active) { reader.stop(); syncReadBtn(); return; }
    const page = book.pages[idx - 1];
    if (!page || !current) return;
    const sentences = pageSentences(page, w);
    const spans = sentences.map(wordSpans);
    const recorded = pageSentences(page, who(undefined, undefined));
    reader.read(sentences, (si, ch) => wordAt(spans[si] ?? [], ch), recorded.length === sentences.length ? recorded : sentences);
    syncReadBtn();
  }

  function showReading(s: ReadState | null): void {
    if (current) {
      for (const el of current.sentences) el.classList.remove('is-reading');
      for (const ws of current.words) for (const el of ws) el.classList.remove('is-word');
      if (s) {
        current.sentences[s.sentence]?.classList.add('is-reading');
        if (s.word >= 0) current.words[s.sentence]?.[s.word]?.classList.add('is-word');
      }
    }
    syncReadBtn();
  }

  // ── spreads ──
  let pic: Picture | null = null;
  let plate: HTMLElement | null = null;
  let leafEl: HTMLElement | null = null;
  let cover: CoverLeaf | null = null;
  let end: EndLeaf | null = null;
  let cplate: ReturnType<typeof coverPlate> | null = null;
  const running = new Set<Animation>();

  const cameraAt = (i: number): Camera => (i === 0 ? book.cover : i === last ? END_CAMERA : book.pages[i - 1]!.camera);

  function makePicture(i: number): Picture {
    const page = book.pages[i - 1];
    return picture({ scene, camera: cameraAt(i), sticker, emoji: meta.emoji, prop: page?.prop ?? '', side: i % 2 === 1 ? 'left' : 'right', mood: theme.mood, seed, moon: book.moon });
  }

  function makeLeaf(i: number): HTMLElement {
    current = null;
    cover = null;
    end = null;
    if (i === 0) {
      cover = coverLeaf(meta.name, bookTitle(book, w), starring(w), friend, () => go(1));
      cover.input.addEventListener('input', syncCover);
      return cover.el;
    }
    if (i === last) {
      end = endLeaf(starring(w), { onFridge: toFridge, onPrint: print, onAgain: () => go(1) });
      const f = fridge(ctx.clock.pretending);
      end.setKept(keptItem(f, book.id, w) !== undefined);
      return end.el;
    }
    const page = book.pages[i - 1]!;
    current = pageLeaf(pageSentences(page, w), i, total);
    return current.el;
  }

  /** The cover's title, "Starring …" and button, as the friend's name is typed (or cleared). */
  function syncCover(): void {
    if (!cover) return;
    const f = cleanFriend(cover.input.value);
    const ww = who(name, f);
    cover.update(bookTitle(book, ww), starring(ww), f);
    cplate?.setTitle(bookTitle(book, ww));
  }

  function makePlate(i: number): HTMLElement | null {
    cplate = null;
    if (i === 0) { cplate = coverPlate(bookTitle(book, w), meta.emoji); return cplate.el; }
    return i === last ? endPlate() : null;
  }

  /**
   * Text as large as fits: the biggest whole-pixel size (15 px at least, about a tenth of the line's width and
   * never above 44 px) whose words fit their box, found by halving. Each try is measured synchronously, which is why story.css turns transitions off on the text:
   * under reduced motion the app gives every property a near-zero transition, and a transitioning font-size
   * would still measure at its old value until the next frame.
   */
  function fitText(): void {
    const el = leafEl;
    const box = el?.querySelector<HTMLElement>('.st-text-box');
    const text = box?.querySelector<HTMLElement>('.st-text');
    if (!el || !box || !text || box.clientHeight <= 0) return;
    const fits = (px: number): boolean => {
      el.style.setProperty('--st-fs', `${px}px`);
      return box.scrollHeight <= box.clientHeight;
    };
    let lo = FS_MIN;
    let hi = Math.floor(Math.max(19, Math.min(FS_MAX, box.clientWidth / 10)));
    if (fits(hi)) return;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (fits(mid)) lo = mid;
      else hi = mid;
    }
    el.style.setProperty('--st-fs', `${lo}px`);
  }

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => fitText()) : null;
  ro?.observe(leafWrap);
  // The display font may arrive after the first page is measured; measure again when it has.
  void document.fonts?.ready?.then(() => { if (!signal.aborted) fitText(); }, () => undefined);

  function track(a: Animation, done: () => void): void {
    running.add(a);
    const end2 = (): void => { running.delete(a); done(); };
    a.finished.then(end2, end2);
  }

  /** Lands any turn still in flight, so a quick second tap turns from where the book really is. */
  function settle(): void {
    for (const a of [...running]) a.finish();
    running.clear();
    pic?.finish();
  }

  function render(i: number, from: number | null): void {
    const dir = from === null ? 0 : i > from ? 1 : -1;
    const m = from === null ? 'off' : motion();
    const canAnimate = typeof root.animate === 'function';

    // Picture: the new camera's picture replaces the old one; it pans (full) or cross-fades (reduced).
    const oldPic = pic;
    const oldPlate = plate;
    pic = makePicture(i);
    plate = makePlate(i);
    picWrap.prepend(pic.el);
    if (plate) picWrap.append(plate);
    pic.layout();
    if (oldPic) {
      if (m === 'reduced' && canAnimate) {
        oldPic.el.classList.add('is-leaving');
        picWrap.append(oldPic.el);
        if (oldPlate) oldPlate.remove();
        track(oldPic.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: 'ease-out', fill: 'forwards' }), () => { oldPic.destroy(); oldPic.el.remove(); });
      } else {
        oldPic.destroy();
        oldPic.el.remove();
        oldPlate?.remove();
        if (m === 'full' && from !== null) pic.panFrom(cameraAt(from), PAN_MS);
      }
    }
    if (plate && m === 'full' && canAnimate) {
      track(plate.animate([{ transform: 'translateY(-24px) scale(.7) rotate(-4deg)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 520, delay: 260, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }), () => undefined);
    }

    // Leaf: forward lifts the old leaf off to the left; back lays the new one down over the old.
    const oldLeaf = leafEl;
    leafEl = makeLeaf(i);
    if (!oldLeaf || m === 'off' || !canAnimate) {
      oldLeaf?.remove();
      leafWrap.append(leafEl);
    } else {
      oldLeaf.inert = true;
      const drop = (): void => { oldLeaf.remove(); };
      if (m === 'reduced') {
        leafWrap.append(leafEl);
        track(leafEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: 'ease-out' }), drop);
      } else if (dir > 0) {
        leafWrap.insertBefore(leafEl, oldLeaf);
        oldLeaf.classList.add('is-turning');
        const shade = oldLeaf.querySelector<HTMLElement>('.st-leaf-shade');
        if (shade) track(shade.animate([{ opacity: 0 }, { opacity: 0.55 }], { duration: TURN_MS, easing: 'ease-in', fill: 'forwards' }), () => undefined);
        track(oldLeaf.animate([
          { transform: 'perspective(2000px) rotateY(0deg)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
          { transform: 'perspective(2000px) rotateY(-38deg) skewY(-1.5deg)', boxShadow: '-18px 10px 30px rgba(0,0,0,.22)', offset: 0.45 },
          { transform: 'perspective(2000px) rotateY(-96deg) skewY(-3deg)', boxShadow: '-30px 10px 40px rgba(0,0,0,0)' },
        ], { duration: TURN_MS, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' }), drop);
      } else {
        leafWrap.append(leafEl);
        leafEl.classList.add('is-turning');
        const shade = leafEl.querySelector<HTMLElement>('.st-leaf-shade');
        if (shade) track(shade.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: TURN_MS, easing: 'ease-out' }), () => undefined);
        const el = leafEl;
        track(el.animate([
          { transform: 'perspective(2000px) rotateY(-96deg) skewY(-3deg)' },
          { transform: 'perspective(2000px) rotateY(-38deg) skewY(-1.5deg)', offset: 0.55 },
          { transform: 'perspective(2000px) rotateY(0deg)' },
        ], { duration: TURN_MS, easing: 'cubic-bezier(.2,.8,.2,1)' }), () => { el.classList.remove('is-turning'); drop(); });
      }
    }
    root.dataset.spread = i === 0 ? 'cover' : i === last ? 'end' : 'page';
    fitText();
    syncChrome();
  }

  function syncChrome(): void {
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === last;
    counter.textContent = idx === 0 ? COPY.coverLabel : idx === last ? COPY.endLabel : `${idx} / ${total}`;
    [...dots.children].forEach((d, k) => d.classList.toggle('is-on', k === idx));
    nextBtn.classList.toggle('is-open', idx === 0);
    syncReadBtn();
  }

  function announceSpread(): void {
    if (idx === 0) ctx.announce(fill(COPY.sayCover, { title: bookTitle(book, w), starring: fill(COPY.starring, { who: starring(w) }) }));
    else if (idx === last) ctx.announce(COPY.sayEnd);
    else ctx.announce(fill(COPY.sayPage, { n: idx, total, text: pageSentences(book.pages[idx - 1]!, w).join(' ') }));
  }

  function go(to: number): void {
    if (to < 0 || to > last || to === idx) return;
    const active = document.activeElement;
    const focusWasInLeaf = !!leafEl && leafEl.contains(active);
    if (idx === 0 && cover) {
      // The friend's name is only read when the book opens; it is never stored unless the story is kept.
      friend = cleanFriend(cover.input.value);
      w = who(name, friend);
    }
    reader.stop();
    settle();
    const from = idx;
    idx = to;
    render(to, from);
    announceSpread();
    // Keep the keyboard where the child is: a disabled turn button hands focus to the other one, a
    // button that vanished with its leaf hands it to the next-page button or The End's heading.
    if (active === prevBtn && prevBtn.disabled) nextBtn.focus({ preventScroll: true });
    else if ((active === nextBtn && nextBtn.disabled) || (focusWasInLeaf && to === last)) end?.title.focus({ preventScroll: true });
    else if (focusWasInLeaf) (to === 0 ? cover?.input : nextBtn)?.focus({ preventScroll: true });
  }

  // ── The End: Fridge and print ──
  let dlg: Dialog | null = null;

  function toFridge(): void {
    if (!end) return;
    const f = fridge(ctx.clock.pretending);
    if (keptItem(f, book.id, w)) { ctx.toast(COPY.fridgeSaved, '🧲'); return; }
    const res = keepStory(f, { holidayId: meta.id, holiday: meta.name, bookId: book.id, who: w, today: ctx.clock.today() });
    if (res.ok) {
      end.setKept(true);
      ctx.toast(COPY.fridgeSaved, '🧲');
      if (motion() === 'full' && typeof end.fridgeBtn.animate === 'function') {
        end.fridgeBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12) rotate(-2deg)' }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    } else if (res.reason === 'pretending') {
      end.note.textContent = COPY.fridgePretend;
      end.note.hidden = false;
      ctx.announce(COPY.fridgePretend);
    } else {
      dlg = fridgeFullDialog(root, f.list(), (it) => { dlg = null; f.remove(it.id); toFridge(); }, () => {
        dlg = null;
        ctx.toast(COPY.fridgeNotKept, '🧲');
      });
    }
  }

  let cancelPrint: (() => void) | null = null;
  function print(): void {
    cancelPrint = printBooklet({ book, who: w, theme, scene, sticker, emoji: meta.emoji, seed });
  }

  // ── keys and swipes ──
  const onKey = (e: KeyboardEvent): void => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement | null;
    const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
    if (e.key === 'Escape') {
      if (dlg) return;
      e.preventDefault();
      if (reader.active) { reader.stop(); return; }
      // Children press Esc to clear a field: in the friend's name it empties the field first, and only an Esc
      // with nothing typed there leaves the book, so a name being typed is never lost to one key.
      if (cover && t === cover.input && cover.input.value !== '') {
        cover.input.value = '';
        syncCover();
        return;
      }
      env.close();
      return;
    }
    if (typing || dlg) return;
    const to = e.key === 'ArrowRight' || e.key === 'PageDown' ? idx + 1
      : e.key === 'ArrowLeft' || e.key === 'PageUp' ? idx - 1
        : e.key === 'Home' ? 0 : e.key === 'End' ? last : null;
    if (to === null) return;
    e.preventDefault();
    go(to);
  };
  // Listen on the document so the arrows work before anything inside the book has focus; keys aimed at
  // something outside the activity (another dialog, the shell) are left alone.
  const onDocKey = (e: KeyboardEvent): void => {
    const t = e.target as Node | null;
    if (t && t !== document.body && t !== document.documentElement && !root.contains(t)) return;
    onKey(e);
  };
  document.addEventListener('keydown', onDocKey, { signal });

  let swipe: { id: number; x: number; y: number } | null = null;
  book$.addEventListener('pointerdown', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('input, button, a, label')) return;
    swipe = { id: e.pointerId, x: e.clientX, y: e.clientY };
  }, { signal });
  const endSwipe = (e: PointerEvent): void => {
    if (!swipe || e.pointerId !== swipe.id) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? idx + 1 : idx - 1);
  };
  book$.addEventListener('pointerup', endSwipe, { signal });
  book$.addEventListener('pointercancel', () => { swipe = null; }, { signal });

  render(0, null);
  // Nothing is announced until a page turns, so say the cover once the activity is on screen: the title
  // plate over the picture is decorative, and this is how a screen reader hears whose book it is.
  const sayCover = window.setTimeout(() => { if (idx === 0) announceSpread(); }, 350);

  return {
    el: root,
    destroy() {
      listeners.abort();
      window.clearTimeout(sayCover);
      cancelPrint?.();
      reader.stop();
      settle();
      dlg?.close();
      offVoices();
      offMotion();
      ro?.disconnect();
      pic?.destroy();
    },
  };
}
