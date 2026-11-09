/**
 * "Say it": greeting cards with the native text large (and its `lang` attribute), the romanization, a kid
 * respelling in a speech bubble and the meaning. The only sound Jubilee ever makes is a greeting the child
 * tapped: "Hear it" appears only when the browser has a voice for that language (SpeechSynthesis, feature-detected
 * per language; voices often load late, so cards listen for `voiceschanged`).
 *
 *   speakableVoice(lang) → SpeechSynthesisVoice | null     (exported for the home lane's morning hello)
 *   speak(text, lang) → boolean                           (true when an utterance was queued)
 *   matchVoice(voices, lang)                              (pure; tests run it on fake voice lists)
 */
import { greetingLine, hasClip, playClip, speaksNatively } from './voice';
import type { Greeting } from '../content/types';
import { t as translate } from '../i18n/index';
import { COPY } from './copy';
import { h } from './dom';
import { icon } from './icons';

export interface VoiceLike { readonly lang: string; readonly name?: string; readonly default?: boolean; readonly localService?: boolean }

/** Legacy codes some platforms still report (Android: iw for Hebrew; Filipino voices for Tagalog). */
const ALIASES: Readonly<Record<string, readonly string[]>> = { he: ['iw'], yi: ['ji'], id: ['in'], tl: ['fil'], fil: ['tl'] };

const norm = (tag: string): string => tag.trim().replace(/_/g, '-').toLowerCase();

/** Script subtags map to the regions whose voices read them (zh-Hans → mainland/Singapore, zh-Hant → Taiwan/Hong Kong). */
const SCRIPT_REGIONS: Readonly<Record<string, readonly string[]>> = { hans: ['cn', 'sg'], hant: ['tw', 'hk', 'mo'] };

/**
 * The best voice for a BCP-47 tag, or null. A voice qualifies only when its language starts with the tag's
 * primary subtag (so a Cantonese `yue` greeting is never read by a Mandarin voice); among those an exact tag
 * wins, then the right region/script, then a local default voice.
 */
export function matchVoice<V extends VoiceLike>(voices: readonly V[], lang: string): V | null {
  const want = norm(lang);
  const [primary = '', second = ''] = want.split('-');
  if (!primary) return null;
  const primaries = new Set([primary, ...(ALIASES[primary] ?? [])]);
  const regions = SCRIPT_REGIONS[second] ?? (second.length === 2 ? [second] : []);
  let best: V | null = null;
  let bestScore = -1;
  for (const v of voices) {
    const tag = norm(v.lang);
    const [vp = '', vr = ''] = tag.split('-');
    if (!primaries.has(vp)) continue;
    let score = 1;
    if (tag === want) score += 8;
    if (vr && regions.includes(vr)) score += 4;
    if (v.localService) score += 1;
    if (v.default) score += 1;
    if (score > bestScore) { best = v; bestScore = score; }
  }
  return best;
}

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function' ? window.speechSynthesis : null;
}

/** A voice that can say this language on this device, or null (then no "Hear it" button is shown). */
export function speakableVoice(lang: string): SpeechSynthesisVoice | null {
  const s = synth();
  return s ? matchVoice(s.getVoices(), lang) : null;
}

/** Says `text` once, slowly, in a matching voice. False when there is no such voice (nothing is played). */
export function speak(text: string, lang: string): boolean {
  const line = greetingLine(text, lang);
  if (speaksNatively(lang) && (playClip(line) || (lang.startsWith('en') && playClip(text)))) return true;
  const s = synth();
  const voice = s ? matchVoice(s.getVoices(), lang) : null;
  if (!s || !voice) return playClip(line);
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.85;
  s.speak(u);
  return true;
}

/** Whether a "Hear it" button can do anything for this line: a recording or a device voice. */
export function canHear(text: string, lang: string): boolean {
  return hasClip(greetingLine(text, lang)) || speakableVoice(lang) !== null;
}

/** Calls `cb` when the browser's voice list changes (Chrome fills it in asynchronously). Returns a disposer. */
export function onVoicesChanged(cb: () => void): () => void {
  const s = synth();
  if (!s) return () => undefined;
  s.addEventListener('voiceschanged', cb);
  return () => s.removeEventListener('voiceschanged', cb);
}

/** 'hi' → 'hi-Latn' for the romanized line, so screen readers do not read it with a Hindi voice. */
function latnTag(lang: string): string {
  return `${lang.split('-')[0] ?? lang}-Latn`;
}

export interface GreetingCard { readonly el: HTMLElement; refreshVoice(): void }

export function greetingCard(g: Greeting): GreetingCard {
  const hear = h('button', { class: 'btn btn-secondary btn-icon greeting-speak hidden', type: 'button', 'aria-label': `${translate(COPY.hearIt)}: ${g.text}` },
    icon('speaker', 20));
  hear.addEventListener('click', () => { speak(g.text, g.lang); });
  const el = h('article', { class: 'greeting' },
    h('p', { class: 'greeting-lang' }, g.langName),
    h('p', { class: 'greeting-text', lang: g.lang, dir: 'auto', translate: 'no' }, g.text),
    g.roman ? h('p', { class: 'greeting-roman', lang: latnTag(g.lang), translate: 'no' }, g.roman) : null,
    h('p', { class: 'greeting-say', translate: 'no' }, g.sayIt),
    h('p', { class: 'greeting-meaning' }, `“${g.meaning}”`),
    hear,
  );
  const refreshVoice = (): void => { hear.classList.toggle('hidden', !canHear(g.text, g.lang)); };
  refreshVoice();
  return { el, refreshVoice };
}

/** The Say-it grid; the returned disposer stops listening for late-loading voices. */
export function greetingsGrid(greetings: readonly Greeting[]): { el: HTMLElement; destroy(): void } {
  const cards = greetings.map(greetingCard);
  const stop = onVoicesChanged(() => cards.forEach((c) => c.refreshVoice()));
  return { el: h('div', { class: 'greetings' }, ...cards.map((c) => c.el)), destroy: stop };
}
