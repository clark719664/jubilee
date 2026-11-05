/**
 * voice.ts — Jubilee's narrator: Supertonic 3 speaker 1, the voice Jot uses, recorded ahead of time
 * (docs/tools/voice) because the model is far too big for a phone's browser. Each line is a small
 * clip in public/voice, played from the site (a phone browser needs ranged audio, which the offline
 * worker can't serve). Lines with no clip, or any line while offline, use the device's own voice.
 */
let known: Set<string> | null = null;
let loading: Promise<Set<string>> | null = null;
let current: HTMLAudioElement | null = null;

/** The clip name for a line: FNV-1a of its text, so the app and the recording run always agree. */
export function clipId(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return `${(h >>> 0).toString(16).padStart(8, '0')}-${text.length}`;
}

const base = (): string => new URL('../voice/', document.baseURI).href;

/** Loads the list of recorded lines once; on any failure the app just uses the device voice. */
export function loadVoice(): Promise<Set<string>> {
  loading ??= fetch(`${base()}index.json`)
    .then((r) => (r.ok ? r.json() as Promise<string[]> : []))
    .catch(() => [] as string[])
    .then((ids) => { known = new Set(ids); return known; });
  return loading;
}

/** Languages the recorded voice speaks natively; the rest use the device's voice, then a recorded "say it" guide. */
const NATIVE = new Set(['en', 'ar', 'de', 'el', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'tr', 'vi']);

export const speaksNatively = (lang: string): boolean => NATIVE.has(lang.split('-')[0] ?? lang);

/** The clip key of a greeting, which is recorded per language. */
export const greetingLine = (text: string, lang: string): string => `${lang}|${text}`;

export const voiceReady = (): boolean => (known?.size ?? 0) > 0;

export function hasClip(text: string): boolean {
  return known?.has(clipId(text)) ?? false;
}

export function stopClip(): void {
  if (!current) return;
  current.onended = current.onerror = null;
  current.pause();
  current = null;
}

/** Plays a recorded line. Calls `done` when it ends; false means there was no clip to play. */
export function playClip(text: string, done?: (ok: boolean) => void): boolean {
  if (!hasClip(text) || typeof Audio === 'undefined') return false;
  stopClip();
  const audio = new Audio(`${base()}${clipId(text)}.m4a`);
  current = audio;
  audio.onended = () => { if (current === audio) current = null; done?.(true); };
  audio.onerror = () => { if (current === audio) current = null; done?.(false); };
  void audio.play().catch(() => done?.(false));
  return true;
}
