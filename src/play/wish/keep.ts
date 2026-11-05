/**
 * keep.ts — where this holiday's wishes are kept on the device: Santa's postbox (letters and the
 * replies that arrive the next morning), the lantern sky, the wish lights, the hopes jar, the
 * gratitude tree, the love notes, the wish sky. The picture shows every wish; the list under it is
 * the keyboard and screen-reader way to open each one.
 */
import type { SceneLayer } from '../../art/index';
import { formatLong, parseIso } from '../../dates/civil';
import { h } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { mascot } from '../../ui/mascot';
import {
  diyaArt, jarArt, lanternArt, leafArt, leafColour, miniEnvelope, postboxArt, slipColour, starArt, TREE_SPOTS, treeArt,
} from './art';
import { chipIcon } from './chip-icons';
import { COPY, fill } from './copy';
import type { KeptLetter, KeptReply } from './letter';
import { chipsOf } from './paper';
import { sceneBackdrop } from './send';
import type { Skin } from './skins';

export type ReplyState = 'ready' | 'opened' | 'waiting' | 'pretend';

export interface KeepOptions {
  readonly skin: Skin;
  readonly letters: readonly KeptLetter[];
  readonly replies: readonly KeptReply[];
  readonly replyState: (l: KeptLetter) => ReplyState;
  readonly locale: string;
  readonly scene: readonly SceneLayer[] | null;
  readonly onRead: (l: KeptLetter) => void;
  readonly onReply: (l: KeptLetter) => void;
  readonly onWrite: () => void;
}

function dateOf(iso: string, locale: string): string {
  const c = parseIso(iso);
  return c ? formatLong(c, locale) : iso;
}

function firstWords(s: string, n = 8): string {
  const words = s.split(/\s+/).filter(Boolean);
  return words.length > n ? `${words.slice(0, n).join(' ')}…` : words.join(' ');
}

export function keepView(o: KeepOptions): HTMLElement {
  const { skin, letters } = o;
  const santa = skin.id === 'santa';
  const anyReady = santa && letters.some((l) => o.replyState(l) === 'ready');

  // ── the picture ──
  const pic = h('div', { class: 'wish-keep-art', 'data-skin': skin.id });
  const tokenBtn = (l: KeptLetter, art: Element, style = ''): HTMLElement =>
    h('button', { type: 'button', class: 'wish-keep-token', tabindex: '-1', 'aria-hidden': 'true', style, onclick: () => o.onRead(l) }, art);
  if (santa) {
    pic.append(h('div', { class: 'wish-keep-postbox' }, postboxArt(anyReady)));
  } else if (skin.id === 'jar') {
    pic.append(h('div', { class: 'wish-keep-jar' }, jarArt(letters.map((_, i) => slipColour(i)))));
  } else if (skin.id === 'leaf') {
    const tree = h('div', { class: 'wish-keep-tree' }, treeArt());
    letters.slice(0, TREE_SPOTS.length).forEach((l, i) => {
      const [x, y, rot] = TREE_SPOTS[i]!;
      tree.append(tokenBtn(l, leafArt(leafColour(i)), `left:${(x / 320) * 100}%;top:${(y / 260) * 100}%;--rot:${rot}deg`));
    });
    pic.append(tree);
  } else {
    pic.append(sceneBackdrop(o.scene, 'is-keep'));
    const sky = h('div', { class: 'wish-keep-sky' });
    letters.slice(-14).forEach((l, i) => {
      const x = 10 + ((i * 61.8) % 80);
      const y = 8 + ((i * 41.3) % 46);
      const icons = chipsOf(skin, l.letter.chips).map((c) => c.icon);
      const art = skin.id === 'lantern' ? lanternArt(icons.slice(0, 1)) : skin.id === 'love' ? miniEnvelope('#ffc2d6', 'heart') : skin.id === 'diya' ? starArt([], '#ffe08a') : starArt([]);
      sky.append(tokenBtn(l, art, `left:${x}%;top:${y}%;--d:${(i % 5) * 0.5}s`));
    });
    if (skin.id === 'diya') sky.append(h('div', { class: 'wish-keep-diya' }, diyaArt()));
    pic.append(sky);
  }

  // ── the list ──
  const rows = letters.slice().reverse().map((l) => {
    const n = letters.indexOf(l) + 1;
    const chips = chipsOf(skin, l.letter.chips);
    const label = santa ? skin.itemTitle : fill(COPY.wishN, { n });
    const words = firstWords(l.letter.text) || (chips.length ? chips.map((c) => c.label).join(', ') : '');
    const read = h('button', { type: 'button', class: 'wish-row', onclick: () => o.onRead(l) },
      h('span', { class: 'wish-row-art' }, santa || skin.id === 'love' ? miniEnvelope(santa ? '#fff1d6' : '#ffc2d6', santa ? 'star' : 'heart') : chipIcon(chips[0]?.icon ?? 'sun', 40)),
      h('span', { class: 'wish-row-text' },
        h('span', { class: 'wish-row-title' }, l.letter.to ? `${label}: ${l.letter.to}` : label),
        h('span', { class: 'wish-row-date' }, fill(COPY.letterOn, { date: dateOf(l.item.made, o.locale) })),
        words ? h('span', { class: 'wish-row-words' }, words) : null),
      h('span', { class: 'wish-row-icons', 'aria-hidden': 'true' }, ...chips.slice(0, 4).map((c) => chipIcon(c.icon, 28))));
    if (!santa) return h('li', {}, read);
    const st = o.replyState(l);
    const reply = st === 'ready' || st === 'opened'
      ? h('button', { type: 'button', class: `wish-row wish-row-reply${st === 'ready' ? ' is-new' : ''}`, onclick: () => o.onReply(l) },
        h('span', { class: 'wish-row-art' }, miniEnvelope('#e63946', 'star')),
        h('span', { class: 'wish-row-text' }, h('span', { class: 'wish-row-title' }, COPY.replyReady), h('span', { class: 'wish-row-date' }, COPY.replyTap)))
      : h('p', { class: 'wish-row-wait' }, mascot('sleepy', 40), st === 'pretend' ? COPY.replyPretend : COPY.replyLater);
    return h('li', { class: 'wish-row-pair' }, read, reply);
  });

  return h('section', { class: 'wish-keep', 'aria-labelledby': 'wish-keep-title' },
    h('h2', { class: 'wish-keep-title', id: 'wish-keep-title' }, skin.keepTitle),
    anyReady ? h('p', { class: 'wish-keep-ready' }, COPY.replyWaiting) : null,
    pic,
    letters.length > 0
      ? h('ul', { class: 'wish-rows' }, ...rows)
      : h('div', { class: 'wish-keep-empty' }, mascot('curious', 72), h('p', {}, skin.keepEmpty)),
    h('div', { class: 'wish-keep-actions' },
      h('button', { type: 'button', class: 'btn btn-lg wish-keep-write', onclick: () => o.onWrite() }, icon('plus', 22), skin.another)),
  );
}
