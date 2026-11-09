/**
 * Fact flip cards: trading-card style buttons (aria-pressed = flipped), keyboard-native because they are real
 * <button>s. `wow` facts sparkle, `bigKids` facts carry a small tag, and the first flip of each card in a session
 * counts toward the Fact Finder badge (`store.bumpFacts` + `checkBadges`). Sources sit in a closed <details>
 * underneath for grown-ups.
 */
import type { AppContext } from '../app/context';
import type { Fact, HolidayId } from '../content/types';
import { fill } from '../i18n/index';
import { h } from './dom';
import { icon } from './icons';

/** Cards already flipped this session (`${holidayId}:${index}`): each counts once toward Fact Finder. */
const FLIPPED = new Set<string>();

const FRONT_EMOJI = ['💡', '🔍', '🌟', '🧠', '🎲', '🪄'] as const;

export function factCard(ctx: AppContext, holidayId: HolidayId, fact: Fact, index: number): HTMLButtonElement {
  const key = `${holidayId}:${index}`;
  const front = h('span', { class: 'flip-face flip-front' },
    h('span', { class: 'flip-emoji', 'aria-hidden': 'true' }, FRONT_EMOJI[index % FRONT_EMOJI.length]),
    h('span', { class: 'flip-title' }, fact.wow ? fill('Wow fact #{n}', { n: index + 1 }) : fill('Fact #{n}', { n: index + 1 })),
    fact.bigKids ? h('span', { class: 'flip-tag' }, 'Big kids') : null,
    h('span', { class: 'flip-hint', 'aria-hidden': 'true' }, icon('shuffle', 18)),
  );
  const back = h('span', { class: 'flip-face flip-back', 'aria-hidden': 'true' },
    fact.bigKids ? h('span', { class: 'flip-tag' }, 'Big kids') : null,
    h('span', { class: 'flip-text' }, fact.text),
  );
  const card = h('button', {
    class: `flip flip-fit${fact.wow ? ' flip-wow' : ''}`, type: 'button', 'aria-pressed': 'false',
  }, h('span', { class: 'flip-inner' }, front, back));
  card.addEventListener('click', () => {
    const flipped = !card.classList.contains('is-flipped');
    card.classList.toggle('is-flipped', flipped);
    card.setAttribute('aria-pressed', String(flipped));
    // Only the visible face is read out, so the button's name follows the flip.
    front.setAttribute('aria-hidden', String(flipped));
    back.setAttribute('aria-hidden', String(!flipped));
    if (flipped) ctx.announce(fact.text);
    if (flipped && !FLIPPED.has(key)) {
      FLIPPED.add(key);
      ctx.store.bumpFacts();
      ctx.checkBadges();
    }
  });
  return card;
}

export function factsGrid(ctx: AppContext, holidayId: HolidayId, facts: readonly Fact[]): HTMLElement {
  return h('div', { class: 'facts' }, ...facts.map((f, i) => factCard(ctx, holidayId, f, i)));
}
