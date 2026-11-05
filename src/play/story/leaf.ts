/**
 * leaf.ts — the paper half of each spread: the cover (who is starring, "Who is coming with you?", Open
 * the book), a story page (its sentences, each word its own span so "Read to me" can light it up) and
 * The End (Fridge, print, read again). Also the die-cut title plates laid over the picture.
 *
 * Every leaf is a labelled group ("Page 3 of 8") so a screen reader hears where it is; the pictures are
 * decorative (the words tell the story), and page turns are announced through ctx.announce by the view.
 */
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { mascot } from '../../ui/mascot';
import { COPY, fill } from './copy';
import { FRIEND_INPUT_MAX, wordSpans } from './text';

export interface PageLeaf {
  readonly el: HTMLElement;
  /** One element per sentence, and inside each one element per word. */
  readonly sentences: readonly HTMLElement[];
  readonly words: readonly (readonly HTMLElement[])[];
}

function leaf(kind: string, label: string, ...body: HTMLElement[]): HTMLElement {
  return h('div', { class: `st-leaf is-${kind}`, role: 'group', 'aria-roledescription': 'page', 'aria-label': label },
    h('span', { class: 'st-leaf-shade', 'aria-hidden': 'true' }),
    h('div', { class: 'st-leaf-in' }, ...body));
}

export function pageLeaf(sentences: readonly string[], n: number, total: number): PageLeaf {
  const sentEls: HTMLElement[] = [];
  const wordEls: HTMLElement[][] = [];
  const text = h('p', { class: 'st-text' });
  sentences.forEach((s, si) => {
    const words: HTMLElement[] = [];
    const el = h('span', { class: 'st-sent' });
    let at = 0;
    for (const w of wordSpans(s)) {
      if (w.start > at) el.append(s.slice(at, w.start));
      const word = h('span', { class: 'st-word' }, s.slice(w.start, w.end));
      words.push(word);
      el.append(word);
      at = w.end;
    }
    if (si > 0) text.append(' ');
    text.append(el);
    sentEls.push(el);
    wordEls.push(words);
  });
  const el = leaf('page', fill(COPY.pageOf, { n, total }),
    h('div', { class: 'st-text-box' }, text),
    h('span', { class: 'st-folio', 'aria-hidden': 'true' }, String(n)));
  return { el, sentences: sentEls, words: wordEls };
}

export interface CoverLeaf {
  readonly el: HTMLElement;
  readonly input: HTMLInputElement;
  /** Updates the title, "Starring …" and the button as the friend's name is typed. */
  update(title: string, starringText: string, friend: string): void;
}

export function coverLeaf(holiday: string, title: string, starringText: string, friend: string, onOpen: () => void): CoverLeaf {
  // The title plate over the picture is decorative; the book's title is this leaf's heading.
  const titleEl = h('h2', { class: 'sr-only' }, title);
  const starringEl = h('p', { class: 'st-starring' }, fill(COPY.starring, { who: starringText }));
  const inputId = `st-friend-${Math.random().toString(36).slice(2, 7)}`;
  const helpId = `${inputId}-help`;
  const input = h('input', {
    id: inputId, class: 'st-friend-input', type: 'text', value: friend, maxLength: FRIEND_INPUT_MAX, autocomplete: 'off',
    autocapitalize: 'words', placeholder: COPY.friendPlaceholder, enterKeyHint: 'go', 'aria-describedby': helpId,
  });
  input.spellcheck = false;
  const openText = h('span', {}, COPY.start);
  const open = h('button', { type: 'submit', class: 'btn btn-lg st-open' }, icon('play', 24), openText);
  const form = h('form', { class: 'st-friend', autocomplete: 'off' },
    h('label', { class: 'st-friend-label', for: inputId }, COPY.friendLabel),
    input,
    h('p', { class: 'st-friend-help', id: helpId }, COPY.friendHelp),
    open);
  form.addEventListener('submit', (e) => { e.preventDefault(); onOpen(); });
  const el = leaf('cover', COPY.coverLabel,
    titleEl,
    h('p', { class: 'st-kicker' }, `${COPY.title} · ${holiday}`),
    starringEl,
    form);
  return {
    el, input,
    update(t, s, f) {
      titleEl.textContent = t;
      starringEl.textContent = fill(COPY.starring, { who: s });
      openText.textContent = f ? fill(COPY.startWith, { friend: f }) : COPY.start;
    },
  };
}

export interface EndLeaf {
  readonly el: HTMLElement;
  readonly title: HTMLElement;
  readonly fridgeBtn: HTMLButtonElement;
  readonly note: HTMLElement;
  /**
   * Shows the Fridge button as done ("On the Fridge"). It stays a working button (a tap says again where the
   * story is), so it is never aria-disabled: the label carries the state.
   */
  setKept(kept: boolean): void;
}

export function endLeaf(starringText: string, handlers: { onFridge(): void; onPrint(): void; onAgain(): void }): EndLeaf {
  const title = h('h2', { class: 'st-end-title', tabindex: -1 }, COPY.youMadeIt);
  const fridgeText = h('span', {}, COPY.fridge);
  const fridgeIcon = h('span', { class: 'st-btn-icon', 'aria-hidden': 'true' }, icon('heart', 22));
  const fridgeBtn = h('button', { type: 'button', class: 'btn st-act st-act-fridge', onclick: () => handlers.onFridge() }, fridgeIcon, fridgeText);
  const note = h('p', { class: 'st-end-note', hidden: true });
  const el = leaf('end', COPY.endLabel,
    title,
    h('p', { class: 'st-starring' }, fill(COPY.endSub, { who: starringText })),
    h('div', { class: 'st-end-actions' },
      fridgeBtn,
      h('button', { type: 'button', class: 'btn btn-secondary st-act', onclick: () => handlers.onPrint() }, icon('print', 22), COPY.print),
      h('button', { type: 'button', class: 'btn btn-secondary st-act', onclick: () => handlers.onAgain() }, icon('arrowLeft', 22), COPY.readAgain)),
    note);
  return {
    el, title, fridgeBtn, note,
    setKept(kept) {
      fridgeText.textContent = kept ? COPY.fridgeAgain : COPY.fridge;
      fridgeIcon.replaceChildren(icon(kept ? 'check' : 'heart', 22));
      fridgeBtn.classList.toggle('is-kept', kept);
    },
  };
}

/** The die-cut title plate over the cover picture. */
export function coverPlate(title: string, emoji: string): { el: HTMLElement; setTitle(t: string): void } {
  const t = h('span', { class: 'st-plate-title' }, title);
  const el = h('div', { class: 'st-plate is-cover', 'aria-hidden': 'true' },
    h('span', { class: 'st-plate-emoji emoji' }, emoji), t);
  return { el, setTitle: (s) => { t.textContent = s; } };
}

/** "The End" over the last picture, Jubi in a party hat and a ring of little stars that pop once. */
export function endPlate(): HTMLElement {
  const stars = Array.from({ length: 8 }, (_v, k) => h('span', { class: 'st-pop-star', style: `--k:${k}` }));
  return h('div', { class: 'st-plate is-end', 'aria-hidden': 'true' },
    h('span', { class: 'st-pop' }, ...stars),
    h('span', { class: 'st-plate-jubi' }, mascot('party', 72)),
    h('span', { class: 'st-plate-title' }, COPY.theEnd));
}
