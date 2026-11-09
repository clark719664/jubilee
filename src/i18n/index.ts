/**
 * i18n — the app's languages. English is written in the code; every other language is a dictionary
 * of English string → translation in public/i18n/<code>/ (ui.json at start, h/<holiday>.json with that
 * holiday), made by docs/tools/i18n. A watcher translates text as it reaches the page, so screens need
 * no changes; code calls t() only where text bypasses the page, such as canvases and speech.
 */
export interface Language {
  readonly code: string;
  /** The language's name in itself, which is how a speaker looks for it. */
  readonly name: string;
  readonly rtl?: boolean;
}

export const LANGUAGES: readonly Language[] = [
  { code: 'en', name: 'English' }, { code: 'es', name: 'Español' }, { code: 'zh', name: '中文' }, { code: 'hi', name: 'हिन्दी' },
  { code: 'ar', name: 'العربية', rtl: true }, { code: 'fr', name: 'Français' }, { code: 'bn', name: 'বাংলা' }, { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' }, { code: 'ur', name: 'اردو', rtl: true }, { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'de', name: 'Deutsch' }, { code: 'ja', name: '日本語' }, { code: 'tr', name: 'Türkçe' }, { code: 'vi', name: 'Tiếng Việt' },
  { code: 'ko', name: '한국어' }, { code: 'ta', name: 'தமிழ்' }, { code: 'te', name: 'తెలుగు' }, { code: 'mr', name: 'मराठी' }, { code: 'tl', name: 'Tagalog' },
];

const KEY = 'jubilee.lang';
const dict = new Map<string, string>();
let templates: { re: RegExp; to: string; slots: string[] }[] = [];
const memo = new Map<string, string | null>();
/** Text this module wrote. The watcher sees it arrive, and must never translate it a second time. */
const produced = new Set<string>();

export function currentLang(): string {
  try {
    const saved = localStorage.getItem(KEY);
    return saved && LANGUAGES.some((l) => l.code === saved) ? saved : 'en';
  } catch {
    return 'en';
  }
}

export function setLang(code: string): void {
  try { localStorage.setItem(KEY, code); } catch { /* the choice lasts this visit only */ }
  location.reload();
}

/** The app's Intl locale: American English unless another language is chosen. */
export const localeFor = (code: string): string => (code === 'en' ? 'en-US' : code);

const root = (): string => (/\/app\/?$/.test(location.pathname) ? '../' : './');

export function learn(entries: Record<string, string>): void {
  memo.clear();
  for (const [from, to] of Object.entries(entries)) {
    dict.set(from, to);
    // A template needs real words around its slots, or it would match every string on the page.
    if (!from.includes('{') || from.replace(/\{\w+\}/g, '').replace(/[^\p{L}]/gu, '').length < 3) continue;
    const slots = [...from.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
    const source = from.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{\w+\\?\}/g, '(.+?)');
    templates.push({ re: new RegExp(`^${source}$`), to, slots });
  }
}

async function fetchDict(path: string): Promise<void> {
  try {
    const res = await fetch(`${root()}i18n/${currentLang()}/${path}`);
    if (res.ok) learn(await res.json() as Record<string, string>);
  } catch { /* offline with nothing cached: this text stays in English */ }
}

/** A slot's value; lists like "milk, wheat and soy" translate item by item, so allergen notes stay correct. */
const slotText = (value: string): string => dict.get(value) ?? value.split(/(, | and )/).map((part) => dict.get(part) ?? part).join('');

/** Translates one string, or returns it unchanged. Filled-in templates ("3 of 8 found") translate too. */
export function t(text: string): string {
  if (dict.size === 0) return text;
  const key = text.trim();
  if (key.length < 2 || produced.has(key)) return text;
  const hit = memo.get(key);
  if (hit !== undefined) return hit === null ? text : text.replace(key, hit);
  let found = dict.get(key) ?? null;
  if (found === null) {
    for (const tpl of templates) {
      const m = tpl.re.exec(key);
      if (!m) continue;
      found = tpl.to;
      tpl.slots.forEach((slot, i) => { found = found!.replace(`{${slot}}`, slotText(m[i + 1]!)); });
      break;
    }
  }
  if (found === null) {
    // Quotes, brackets and emoji around known text: translate what's inside.
    const inner = key.replace(/^[\s“"‘'(（\p{Extended_Pictographic}\uFE0F]+|[\s”"’')）.…]+$/gu, '');
    if (inner !== key && inner.length > 1) {
      const done = t(inner);
      if (done !== inner) found = key.replace(inner, done);
    }
  }
  if (found === null && import.meta.env.DEV) ((globalThis as { i18nMisses?: Set<string> }).i18nMisses ??= new Set()).add(key);
  memo.set(key, found);
  if (found !== null) produced.add(found);
  return found === null ? text : text.replace(key, found);
}

const ATTRS = ['aria-label', 'title', 'placeholder', 'alt'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT']);

function translateNode(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;
    if (!parent || SKIP.has(parent.tagName) || parent.closest('[translate="no"]')) return;
    const now = node.nodeValue ?? '';
    const next = t(now);
    if (next !== now) node.nodeValue = next;
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  if (SKIP.has(el.tagName) || el.getAttribute('translate') === 'no') return;
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v) {
      const next = t(v);
      if (next !== v) el.setAttribute(a, next);
    }
  }
  for (const c of Array.from(el.childNodes)) translateNode(c);
}

/** Sets the page's language and direction, loads the shared dictionary and starts the watcher. */
export async function initLang(): Promise<void> {
  const code = currentLang();
  document.documentElement.lang = code === 'en' ? 'en-US' : code;
  if (code === 'en') return;
  templates = [];
  if (LANGUAGES.find((l) => l.code === code)?.rtl) document.documentElement.dir = 'rtl';
  await fetchDict('ui.json');
  translateNode(document.documentElement);
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'attributes' || r.type === 'characterData') translateNode(r.target);
      else r.addedNodes.forEach(translateNode);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

/** Loads a holiday's own text; called as its content loads. */
export const loadHolidayText = (id: string): Promise<void> => (currentLang() === 'en' ? Promise.resolve() : fetchDict(`h/${id}.json`));
