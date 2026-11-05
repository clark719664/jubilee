/**
 * paper.ts — a finished wish or Santa's reply drawn as paper, for reading again and for printing.
 * The live, editable paper lives in compose.ts; this is the same look, read-only.
 */
import { h } from '../../ui/dom';
import { chipIcon } from './chip-icons';
import { COPY } from './copy';
import type { WishLetter, WishReply } from './letter';
import { chipById, skinById, type Skin, type WishChip } from './skins';
import { stampArt } from './art';

export function chipsOf(skin: Skin, ids: readonly string[]): WishChip[] {
  return ids.map((id) => chipById(skin, id)).filter((x) => x !== undefined);
}

/** The salutation line, with the love note's "To". */
export function salutationOf(skin: Skin, letter: Pick<WishLetter, 'to'>): string {
  if (skin.id === 'love') {
    // "Dear Mom," but "To my family," (never "Dear My family,").
    if (!letter.to) return `${skin.salutation} you,`;
    return /^my\b/i.test(letter.to) ? `To ${letter.to[0]!.toLowerCase()}${letter.to.slice(1)},` : `${skin.salutation} ${letter.to},`;
  }
  return skin.salutation;
}

/** Paragraphs of text keep the child's line breaks. */
function textBlock(text: string, cls: string): HTMLElement[] {
  return text.split(/\n+/).filter(Boolean).map((line) => h('p', { class: cls }, line));
}

export function letterPaper(letter: WishLetter, extraClass = ''): HTMLElement {
  const skin = skinById(letter.skin);
  const chips = chipsOf(skin, letter.chips);
  return h('article', { class: `wish-paper is-static ${extraClass}`, 'data-skin': skin.id },
    skin.id === 'santa' ? h('div', { class: 'wish-paper-stamp', 'aria-hidden': 'true' }, stampArt()) : null,
    h('p', { class: 'wish-salutation' }, salutationOf(skin, letter)),
    chips.length > 0 ? h('p', { class: 'wish-lead' }, skin.listLead) : null,
    chips.length > 0 ? h('ul', { class: 'wish-list is-static' },
      ...chips.map((c) => h('li', { class: 'wish-sticker' }, chipIcon(c.icon, 56), h('span', { class: 'wish-sticker-label' }, c.label)))) : null,
    ...textBlock(letter.text, 'wish-written'),
    letter.kind && skin.kindLabel ? h('p', { class: 'wish-kind-static' }, h('span', { class: 'wish-kind-lead' }, skin.kindLabel), ' ', letter.kind) : null,
    h('p', { class: 'wish-sign' }, skin.signoff, h('br'), h('span', { class: 'wish-sign-name' }, letter.name ?? COPY.me)),
  );
}

export function replyPaper(reply: WishReply, name: string | undefined, extraClass = ''): HTMLElement {
  return h('article', { class: `wish-paper wish-reply is-static ${extraClass}`, 'data-skin': 'santa' },
    h('div', { class: 'wish-reply-head' },
      h('p', { class: 'wish-reply-from' }, COPY.replyFrom),
      h('p', { class: 'wish-reply-to' }, name ? COPY.replyTo.replace('{name}', name) : COPY.replyToYou),
    ),
    h('div', { class: 'wish-paper-stamp', 'aria-hidden': 'true' }, stampArt()),
    h('p', { class: 'wish-salutation' }, reply.greeting),
    ...reply.paragraphs.map((p) => h('p', { class: 'wish-reply-p' }, p)),
    h('p', { class: 'wish-sign' }, reply.signoff, h('br'), h('span', { class: 'wish-sign-name wish-santa-sign' }, COPY.santa)),
    reply.ps ? h('p', { class: 'wish-reply-ps' }, reply.ps) : null,
  );
}
