/**
 * reader.ts — "Read to me": the page read aloud in Jubilee's recorded voice (ui/voice.ts), or by the device's
 * own voice (SpeechSynthesis) for any line without a clip, only when the child taps the button. With neither
 * available the button is not shown at all. Sentences are spoken one utterance at a time so the page can light up the sentence being
 * read, and word boundaries (where the voice reports them) light up the word. Nothing is recorded or sent.
 *
 * Some locked-down or embedded webviews throw from speechSynthesis (getVoices, speak). Every call is guarded:
 * a voice that throws counts as no voice, so the button hides and page turns never break.
 */
import { speakableVoice } from '../../ui/greetings';
import { hasClip, playClip, stopClip, voiceReady } from '../../ui/voice';

export interface ReadState {
  readonly sentence: number;
  /** Word index inside the sentence, or -1 when the voice gives no word boundaries. */
  readonly word: number;
}

function synth(): SpeechSynthesis | null {
  try {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function' ? window.speechSynthesis : null;
  } catch {
    return null;
  }
}

/** The voice to read with, or null when there is none (or asking for one throws). */
function voiceFor(lang: string): SpeechSynthesisVoice | null {
  try {
    return synth() !== null ? speakableVoice(lang) : null;
  } catch {
    return null;
  }
}

/** The book's language for the voice: the reader's own English variant when they have one. */
export function bookLang(locale: string): string {
  return /^en(-|$)/i.test(locale) ? locale : 'en';
}

export class ReadAloud {
  private run = 0;
  private reading = false;

  constructor(
    private readonly lang: string,
    private readonly onState: (s: ReadState | null) => void,
  ) {}

  /** A matching voice exists right now (Chrome fills the list in late; see onVoicesChanged). */
  available(): boolean {
    return voiceReady() || voiceFor(this.lang) !== null;
  }

  get active(): boolean {
    return this.reading;
  }

  /** `spoken` is what the recordings say, which differs from `sentences` once a child has typed a name. */
  read(sentences: readonly string[], wordIndex: (sentence: number, charIndex: number) => number, spoken = sentences): void {
    const s = synth();
    const voice = voiceFor(this.lang);
    this.stop();
    if (sentences.length === 0) return;
    const run = ++this.run;
    this.reading = true;
    const say = (i: number): void => {
      if (run !== this.run) return;
      if (i >= sentences.length) { this.finish(run); return; }
      const line = spoken[i] ?? sentences[i]!;
      if (hasClip(line)) {
        this.onState({ sentence: i, word: -1 });
        playClip(line, (ok) => { if (run === this.run) { if (ok) say(i + 1); else device(i); } });
      } else device(i);
    };
    const device = (i: number): void => {
      if (!s || !voice) { say(i + 1); return; }
      try {
        const u = new SpeechSynthesisUtterance(sentences[i]!);
        u.voice = voice;
        u.lang = voice.lang;
        u.rate = 0.9;
        u.pitch = 1.05;
        u.onstart = () => { if (run === this.run) this.onState({ sentence: i, word: -1 }); };
        u.onboundary = (e) => {
          if (run !== this.run || e.name === 'sentence') return;
          this.onState({ sentence: i, word: wordIndex(i, e.charIndex) });
        };
        u.onend = () => say(i + 1);
        u.onerror = () => this.finish(run);
        s.speak(u);
      } catch {
        this.finish(run);
      }
    };
    say(0);
  }

  /** Stops at once (page turn, closing the book, tapping the button again). */
  stop(): void {
    const wasReading = this.reading;
    this.run++;
    this.reading = false;
    stopClip();
    if (wasReading) {
      try { synth()?.cancel(); } catch { /* nothing to stop */ }
      this.onState(null);
    }
  }

  private finish(run: number): void {
    if (run !== this.run) return;
    this.reading = false;
    this.onState(null);
  }
}
