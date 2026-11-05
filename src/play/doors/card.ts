/**
 * doors/card.ts — what is behind a door: a fact, a joke (riddle first, "Tell me!" for the answer), a tiny
 * craft step, a greeting to say (native text, romanization, kid respelling, and "Hear it" only when the
 * device has a voice for that language), or a button into Seek & Find / Coloring.
 */
import type { HolidayMeta } from '../../content/types';
import { h } from '../../ui/dom';
import { greetingCard, onVoicesChanged } from '../../ui/greetings';
import { icon } from '../../ui/icons';
import { splitJoke, type BoardDoor } from './logic';
import { COPY, KIND_EMOJI, KIND_TITLE, fill } from './copy';

export interface CardHooks {
  /** Whether the holiday has a Seek & Find scene / a coloring page to jump into. */
  readonly canSeek: boolean;
  readonly canColor: boolean;
  /** Leave the doors for another activity ('seek' | 'color'). */
  go(activity: 'seek' | 'color'): void;
  close(): void;
  /** Screen-reader note (the joke's answer, …). */
  announce(text: string): void;
}

export interface DoorCard {
  readonly el: HTMLElement;
  /** Element to focus when the card opens. */
  readonly focus: HTMLElement;
  dispose(): void;
}

export function doorCard(door: BoardDoor, meta: HolidayMeta, hooks: CardHooks, headingId: string): DoorCard {
  const disposers: (() => void)[] = [];
  const body: HTMLElement[] = [];

  switch (door.kind) {
    case 'joke': {
      const joke = splitJoke(door.text);
      if (!joke) { body.push(h('p', { class: 'dr-card-text' }, door.text)); break; }
      const answer = h('p', { class: 'dr-card-answer', hidden: true }, joke.answer);
      const tell = h('button', { type: 'button', class: 'btn btn-lg dr-tell' }, COPY.tellMe);
      tell.addEventListener('click', () => {
        answer.hidden = false;
        tell.hidden = true;
        hooks.announce(joke.answer);
        answer.setAttribute('tabindex', '-1');
        answer.focus();
      });
      body.push(h('p', { class: 'dr-card-text' }, joke.ask), tell, answer);
      break;
    }
    case 'say': {
      body.push(h('p', { class: 'dr-card-text dr-card-text-sm' }, door.text));
      if (door.greeting) {
        const card = greetingCard(door.greeting);
        card.el.classList.add('dr-greeting');
        body.push(card.el);
        disposers.push(onVoicesChanged(() => card.refreshVoice()));
      }
      break;
    }
    case 'seek':
    case 'color': {
      body.push(h('p', { class: 'dr-card-text' }, door.text));
      const can = door.kind === 'seek' ? hooks.canSeek : hooks.canColor;
      if (can) {
        const go = h('button', { type: 'button', class: 'btn btn-lg dr-go' },
          h('span', { 'aria-hidden': 'true' }, KIND_EMOJI[door.kind]), door.kind === 'seek' ? COPY.playSeek : COPY.playColor, icon('arrowRight', 22));
        go.addEventListener('click', () => hooks.go(door.kind === 'seek' ? 'seek' : 'color'));
        body.push(go);
      } else {
        body.push(h('p', { class: 'dr-card-note' }, COPY.stillPainting));
      }
      break;
    }
    case 'craft':
      body.push(h('p', { class: 'dr-card-text' }, door.text), h('p', { class: 'dr-card-note' }, COPY.craftNote));
      break;
    case 'fact':
      body.push(h('p', { class: 'dr-card-text' }, door.text));
      break;
  }

  const done = h('button', { type: 'button', class: 'btn btn-lg dr-done' }, COPY.backToDoors);
  done.addEventListener('click', () => hooks.close());
  const x = h('button', { type: 'button', class: 'btn btn-secondary btn-icon dr-x', 'aria-label': COPY.closeCard }, icon('close', 22));
  x.addEventListener('click', () => hooks.close());

  const el = h('div', { class: `card dr-card dr-card-${door.kind}`, role: 'dialog', 'aria-modal': 'true', 'aria-labeledby': headingId },
    x,
    h('div', { class: 'dr-card-medal', 'aria-hidden': 'true' }, h('span', { class: 'emoji' }, KIND_EMOJI[door.kind])),
    h('p', { class: 'dr-card-kicker' }, fill(COPY.doorN, { n: door.n }), ' · ', meta.name),
    h('h2', { class: 'h2 dr-card-title', id: headingId }, KIND_TITLE[door.kind]),
    ...body,
    h('div', { class: 'dr-card-actions' }, done),
  );
  const focus = body.find((b) => b.classList.contains('dr-tell')) ?? done;
  return { el, focus, dispose: () => { for (const d of disposers) d(); } };
}
