/**
 * cards.ts — the two non-globe questions, as die-cut cards on the holiday sky.
 *
 *   factCard: "True or silly?" A trading card with the statement on the front and two big buttons.
 *             Picking one flips the card (a cross-fade under reduced motion) to show the answer.
 *   greetCard: a greeting in big letters (romanised, with the native script and language under it)
 *             and three holidays to choose from.
 *
 * Both report the child's pick once; the view shows the answer line and the Next button.
 */
import { h } from '../../ui/dom';
import { COPY, fill } from './copy';
import type { FactQuestion, GreetQuestion } from './questions';

export interface CardView {
  readonly el: HTMLElement;
  /** The first control to focus. */
  readonly first: HTMLElement;
}

export interface FactPick { readonly saidTrue: boolean }

export function factCard(q: FactQuestion, from: { name: string; emoji: string } | null, onPick: (p: FactPick) => void): CardView & { flip(saidTrue: boolean): void } {
  const kicker = from ? fill(COPY.factFrom, { holiday: from.name }) : COPY.factAsk;
  const emoji = from?.emoji ?? '🤔';
  const yes = h('button', { type: 'button', class: 'btn btn-lg quiz-tf quiz-tf-true', onclick: () => choose(true) },
    h('span', { class: 'emoji', 'aria-hidden': 'true' }, '👍'), COPY.factTrue);
  const no = h('button', { type: 'button', class: 'btn btn-lg btn-secondary quiz-tf quiz-tf-silly', onclick: () => choose(false) },
    h('span', { class: 'emoji', 'aria-hidden': 'true' }, '🤪'), COPY.factSilly);
  const backHead = h('p', { class: 'quiz-fact-verdict' });
  const backText = h('p', { class: 'quiz-fact-back-text' });
  const front = h('div', { class: 'quiz-fact-face quiz-fact-front' },
    h('p', { class: 'quiz-fact-kicker' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, emoji), ` ${COPY.factAsk}`),
    h('p', { class: 'quiz-fact-text' }, q.text),
    from ? h('p', { class: 'quiz-fact-from' }, kicker) : null);
  const back = h('div', { class: 'quiz-fact-face quiz-fact-back', 'aria-hidden': 'true' },
    h('span', { class: 'quiz-fact-badge', 'aria-hidden': 'true' }, q.truth ? '🌟' : '🤪'), backHead, backText);
  const card = h('div', { class: 'quiz-fact-card' }, h('div', { class: 'quiz-fact-inner' }, front, back));
  const buttons = h('div', { class: 'quiz-tf-row' }, yes, no);
  const el = h('div', { class: 'quiz-card-stage quiz-fact' }, card, buttons);
  let done = false;

  function flip(saidTrue: boolean): void {
    backHead.textContent = q.truth ? (saidTrue ? COPY.factTrueYes : COPY.factTrueNo) : (saidTrue ? COPY.factSillyNo : COPY.factSillyYes);
    backText.textContent = q.truth ? q.text : q.back;
    card.classList.add('is-flipped');
    back.removeAttribute('aria-hidden');
    front.setAttribute('aria-hidden', 'true');
    (saidTrue ? yes : no).classList.add('is-picked');
    yes.disabled = true;
    no.disabled = true;
  }

  function choose(saidTrue: boolean): void {
    if (done) return;
    done = true;
    flip(saidTrue);
    onPick({ saidTrue });
  }

  return { el, first: yes, flip };
}

export function greetCard(q: GreetQuestion, onPick: (id: string, button: HTMLElement) => void): CardView & { settle(picked: string): void } {
  const g = q.greeting;
  const native = g.text !== q.display ? h('p', { class: 'quiz-greet-native', lang: g.lang }, g.text) : null;
  const options = q.options.map((o) => h('button', {
    type: 'button', class: 'quiz-option', 'data-id': o.id,
    onclick: (e: Event) => choose(o.id, e.currentTarget as HTMLElement),
  }, h('span', { class: 'quiz-option-emoji emoji', 'aria-hidden': 'true' }, o.emoji), h('span', { class: 'quiz-option-name' }, o.name)));
  const el = h('div', { class: 'quiz-card-stage quiz-greet' },
    h('div', { class: 'quiz-greet-card' },
      h('p', { class: 'quiz-greet-kicker' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, '💬'), ` ${COPY.greetAsk}`),
      h('p', { class: 'quiz-greet-text', lang: g.roman ? `${g.lang.split('-')[0] ?? g.lang}-Latn` : g.lang }, q.display),
      native,
      h('p', { class: 'quiz-greet-lang' }, fill(COPY.greetLang, { lang: g.langName })),
    ),
    h('div', { class: 'quiz-options', role: 'group', 'aria-label': COPY.greetAsk }, ...options),
  );
  let done = false;

  function settle(picked: string): void {
    for (const b of options) {
      const id = b.getAttribute('data-id');
      b.classList.toggle('is-right', id === q.holiday);
      b.classList.toggle('is-picked', id === picked && id !== q.holiday);
      b.setAttribute('aria-disabled', 'true');
    }
  }

  function choose(id: string, button: HTMLElement): void {
    if (done) return;
    done = true;
    settle(id);
    onPick(id, button);
  }

  return { el, first: options[0]!, settle };
}
