/**
 * print.ts — the story as a little printed booklet: two booklet pages side by side on each landscape
 * sheet (cover, every page, The End), a dotted line to cut along, page numbers to stack them by. Each
 * page shows its picture through the same camera as on screen, at a fixed 4:3 shape, with the words
 * below. The sheet lives only while the print dialog is open; @media print in story.css hides the rest.
 */
import type { SceneLayer } from '../../art/index';
import type { Theme } from '../../theme/themes';
import { applyTheme } from '../../theme/apply';
import { h } from '../../ui/dom';
import { COPY, fill } from './copy';
import { picture, type Picture } from './picture';
import { bookTitle, pageSentences, starring, type Who } from './text';
import type { Camera, StoryBook } from './types';

export interface PrintOptions {
  readonly book: StoryBook;
  readonly who: Who;
  readonly theme: Theme;
  readonly scene: readonly SceneLayer[] | null;
  readonly sticker: string | null;
  readonly emoji: string;
  readonly seed: number;
}

const PRINT_ASPECT = 4 / 3;
/** Some browsers never fire afterprint; the sheet is taken down this long after print() returns. */
const AFTER_MS = 2000;

/** Tears down the booklet that is up (or about to print), if any. Only one booklet exists at a time. */
let active: (() => void) | null = null;

/**
 * Builds the booklet and opens the print dialog once its pictures and fonts are ready. Returns a cancel
 * function (the activity calls it on close): before the dialog opens it stops the print altogether,
 * afterwards it just takes the sheet down. While a booklet is up, further taps build nothing and hand back
 * that booklet's own cancel, so a quick triple tap never queues three dialogs or stacks three copies, and
 * the caller always holds a cancel that really stops the print that is under way.
 */
export function printBooklet(o: PrintOptions): () => void {
  if (typeof window === 'undefined') return () => undefined;
  if (active) return active;
  // A sheet left behind by anything else (a hot reload, a crashed print) must never print twice.
  for (const old of document.querySelectorAll('.st-print')) old.remove();
  const pics: Picture[] = [];
  const pic = (camera: Camera, prop: string, side: 'left' | 'right'): HTMLElement => {
    const p = picture({ scene: o.scene, camera, sticker: o.sticker, emoji: o.emoji, prop, side, mood: o.theme.mood, seed: o.seed, moon: o.book.moon, aspect: PRINT_ASPECT });
    pics.push(p);
    return h('div', { class: 'st-print-pic' }, p.el);
  };
  const who = starring(o.who);
  const bookPages: HTMLElement[] = [
    h('section', { class: 'st-print-page is-cover' },
      pic(o.book.cover, '', 'right'),
      h('h1', { class: 'st-print-title' }, bookTitle(o.book, o.who)),
      h('p', { class: 'st-print-by' }, fill(COPY.starring, { who }))),
    ...o.book.pages.map((p, i) => h('section', { class: 'st-print-page' },
      pic(p.camera, p.prop, i % 2 === 0 ? 'left' : 'right'),
      h('p', { class: 'st-print-text' }, pageSentences(p, o.who).join(' ')),
      h('p', { class: 'st-print-num' }, fill(COPY.printPage, { n: i + 1 })))),
    h('section', { class: 'st-print-page is-end' },
      h('p', { class: 'st-print-end' }, COPY.theEnd),
      h('p', { class: 'st-print-by' }, fill(COPY.printMadeBy, { who })),
      h('p', { class: 'st-print-how' }, COPY.printHow)),
  ];
  const sheets: HTMLElement[] = [];
  for (let i = 0; i < bookPages.length; i += 2) {
    sheets.push(h('div', { class: 'st-print-sheet' },
      bookPages[i]!,
      h('span', { class: 'st-print-cut', 'aria-hidden': 'true' }),
      bookPages[i + 1] ?? h('section', { class: 'st-print-page is-blank' })));
  }
  const sheet = h('div', { class: 'st-print', 'aria-hidden': 'true' }, ...sheets);
  applyTheme(sheet, o.theme);
  document.body.append(sheet);
  document.documentElement.classList.add('st-printing');

  let done = false;
  const timers: number[] = [];
  const later = (ms: number): Promise<void> => new Promise((r) => { timers.push(window.setTimeout(r, ms)); });
  const cleanup = (): void => {
    if (done) return;
    done = true;
    if (active === cleanup) active = null;
    for (const t of timers) window.clearTimeout(t);
    window.removeEventListener('afterprint', cleanup);
    document.documentElement.classList.remove('st-printing');
    for (const p of pics) p.destroy();
    sheet.remove();
  };
  active = cleanup;

  void (async () => {
    // Scene layers are already cached from the reader; wait (briefly) until they are decoded so the
    // printed pictures are never blank.
    const imgs = [...sheet.querySelectorAll('img')];
    await Promise.race([
      Promise.all(imgs.map((i) => (typeof i.decode === 'function' ? i.decode().catch(() => undefined) : undefined))),
      later(1500),
    ]);
    if (done) return;
    if (document.fonts?.ready) await Promise.race([document.fonts.ready.catch(() => undefined), later(800)]);
    if (done) return;
    window.addEventListener('afterprint', cleanup);
    try { window.print(); } catch { cleanup(); return; }
    if (!done) timers.push(window.setTimeout(cleanup, AFTER_MS));
  })();
  return cleanup;
}
