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

/** A count's English wording. Translations keep every form their language needs, by Intl.PluralRules category. */
export interface PluralForms { readonly one: string; readonly other: string }
/** A translated count: Russian has one/few/many/other, Arabic zero through other, Japanese only other. */
export type PluralEntry = Partial<Record<Intl.LDMLPluralRule, string>>;
type Entry = string | PluralEntry;

const KEY = 'jubilee.lang';
const dict = new Map<string, Entry>();
let active = 'en';
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

/** Adds translations; `lang` says whose they are when it isn't the chosen language (tests, previews). */
export function learn(entries: Record<string, Entry>, lang?: string): void {
  if (lang) active = lang;
  memo.clear();
  for (const [from, to] of Object.entries(entries)) {
    dict.set(from, to);
    if (typeof to !== 'string' || !from.includes('{')) continue;
    const slots = [...from.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
    const words = from.replace(/\{\w+\}/g, ' ').match(/\p{L}+/gu) ?? [];
    // A greeting kept as written ("{name} Mubarak") must not have its holiday name translated; "{view} · Jubilee" may.
    if (to === from && !words.every((w) => /^Jubi(lee)?$/.test(w))) continue;
    // A scrap of a sentence cut at a bracket or quote ("Happy {name} (literally 'good year") matches the wrong text.
    const count = (ch: string): number => from.split(ch).length - 1;
    if (count('(') !== count(')') || count('“') !== count('”') || count('"') % 2 === 1) continue;
    // A template needs real words around its slots, or it would match every string on the page; "{a} and {b}" would
    // rewrite any sentence with "and" in it. A slot glued to letters ("{name}day") is a scrap of a word, not a template.
    if (words.join('').length < 3 || /^\{\w+\}\s*(?:and|or|&|to|,)\s*\{\w+\}[.!]?$/.test(from) || /\p{L}\{\w+\}|\{\w+\}\p{L}/u.test(from)) continue;
    const source = from.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{\w+\\?\}/g, '(.+?)');
    templates.push({ re: new RegExp(`^${source}$`), to, slots });
  }
}

/** Slots that always hold a number; a template only matches when they do. */
const NUMBER_SLOTS = new Set(['n', 'total', 'max', 'count', 'k', 'pct', 'km', 'mi', 'kmh', 'm', 'lo', 'hi', 'done', 'have', 'need', 'pairs', 'of',
  'step', 'ring', 'year', 'day', 'night', 'lit', 'left', 'cols', 'rows', 'door', 'you', 'jubi', 'pot', 'age', 'cap']);
/** Slots that hold a name or a thing; a whole sentence never fits in one. */
const NAME_SLOTS = new Set(['name', 'holiday', 'city', 'country', 'place', 'thing', 'item', 'items', 'color', 'shape', 'noun', 'who', 'friend',
  'title', 'label', 'card', 'bottle', 'month', 'weekday']);
const fits = (slot: string, value: string): boolean => (NUMBER_SLOTS.has(slot) ? /^[\d\s.,½¼¾%+-]+$/.test(value)
  : !NAME_SLOTS.has(slot) || (value.length <= 48 && !/[;!?]|[.:]\s/.test(value) && value.split('(').length === value.split(')').length));

async function fetchDict(path: string): Promise<void> {
  try {
    const res = await fetch(`${root()}i18n/${currentLang()}/${path}`);
    if (res.ok) learn(await res.json() as Record<string, Entry>);
  } catch { /* offline with nothing cached: this text stays in English */ }
}

const plain = (key: string): string | undefined => {
  const hit = dict.get(key);
  return typeof hit === 'string' ? hit : undefined;
};

/** "milk, wheat and soy" in the reader's language, its "and" included. English keeps no comma before "and". */
function joinList(items: readonly string[]): string {
  if (active === 'en' || items.length < 2) return items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  return new Intl.ListFormat(localeFor(active), { type: 'conjunction' }).format(items);
}

const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** A word as the code uses it ("the barrel", "candle") is often listed differently ("Barrel", "a candle"). */
function lookup(value: string): string | undefined {
  const bare = value.replace(/^(?:a|an|the) /i, '');
  for (const v of [value, capital(value), bare, capital(bare), `a ${value}`, `an ${value}`, `the ${value}`]) {
    const hit = plain(v);
    if (hit !== undefined) return hit;
  }
  return undefined;
}

/** A slot's value, translated whole if it can be; a list of known words ("milk, wheat and soy") translates item by item. */
function slotText(value: string): string {
  const own = lookup(value);
  if (own !== undefined) return own;
  const whole = t(value);
  if (whole !== value) return whole;
  const items = value.split(/, | and /);
  if (items.length < 2 || items.some((item) => lookup(item) === undefined)) return value;
  return joinList(items.map((item) => lookup(item)!));
}

/**
 * Marks a table of words readers see ("dot", "upper middle") so docs/tools/i18n collects them; the collector skips
 * other single lowercase words, which are usually ids and class names. Returns the value unchanged.
 */
export const visible = <T>(value: T): T => value;

/** Fills {slots} in English text. Keep the template a literal in the code, so docs/tools/i18n collects it. */
export function fill(template: string, vars: Readonly<Record<string, string | number>> = {}): string {
  return template.replace(/\{(\w+)\}/g, (slot, name: string) => (name in vars ? String(vars[name]) : slot));
}

/** A list of things ("a hat, a scarf and boots") in the reader's language; each item should already be translated or translatable. */
export function list(items: readonly string[]): string {
  if (active === 'en') return joinList(items);
  const text = joinList(items.map((item) => slotText(item)));
  produced.add(text);
  return text;
}

const rules = new Map<string, Intl.PluralRules>();
const ruleFor = (code: string): Intl.PluralRules => {
  let r = rules.get(code);
  if (!r) rules.set(code, (r = new Intl.PluralRules(localeFor(code))));
  return r;
};

/**
 * A count in words, "3 lanterns", for the reader's language. English chooses one/other by Intl.PluralRules; a
 * translation chooses among all of its own categories, so Russian, Arabic and Japanese all come out right.
 * {n} is the count, in Latin digits; pass vars.n to show it differently ("1½").
 */
export function plural(n: number, forms: PluralForms, vars: Readonly<Record<string, string | number>> = {}): string {
  const values: Record<string, string | number> = { n: n.toLocaleString(`${localeFor(active)}-u-nu-latn`), ...vars };
  const own = active === 'en' ? undefined : dict.get(forms.other);
  if (own === undefined || typeof own === 'string') {
    // Kitchen English reads a part of one as singular: "½ cup".
    return fill(ruleFor('en').select(n) === 'one' || (n > 0 && n < 1) ? forms.one : forms.other, values);
  }
  for (const [k, v] of Object.entries(values)) if (typeof v === 'string' && k !== 'n') values[k] = slotText(v);
  const text = fill(own[ruleFor(active).select(n)] ?? own.other ?? forms.other, values);
  produced.add(text);
  return text;
}

/**
 * Sentences joined for a screen reader ("Found the star! 3 more to find.") translate one by one: first only when
 * every sentence is known (a template slot could otherwise swallow the sentence before it), later as a last try.
 */
function bySentence(key: string, every: boolean): string | null {
  const sentences = key.split(/(?<=[.!?…])\s+(?=\S)/);
  if (sentences.length < 2) return null;
  // Split in two at each sentence break, so a known pair of sentences ("Tap here. Then wait.") stays together.
  for (let i = 1; i < sentences.length; i++) {
    const head = sentences.slice(0, i).join(' ');
    const tail = sentences.slice(i).join(' ');
    const [h, tl] = [t(head), t(tail)];
    if (every ? h !== head && tl !== tail : h !== head || tl !== tail) return `${h} ${tl}`;
  }
  return null;
}

/** Quotes, brackets and emoji around known text: translates what's inside. */
function inner(key: string): string | null {
  // One matching pair first, so a meaning that ends in ")" keeps it: “Happy Christmas (Navidad means birth)”.
  for (const [open, close] of [['“', '”'], ['"', '"'], ['‘', '’'], ['(', ')'], ['（', '）']] as const) {
    if (key.length > 2 && key.startsWith(open) && key.endsWith(close)) {
      const core = key.slice(1, -1);
      const done = t(core);
      if (done !== core) return `${open}${done}${close}`;
    }
  }
  const core = key.replace(/^[\s“"‘'(（\p{Extended_Pictographic}️]+|[\s”"’')）.…]+$/gu, '');
  if (core === key || core.length < 2) return null;
  const done = t(core);
  return done === core ? null : key.replace(core, done);
}

/** Translates one string, or returns it unchanged. Filled-in templates ("3 of 8 found") translate too. */
export function t(text: string): string {
  if (dict.size === 0) return text;
  const key = text.trim();
  if (key.length < 2 || produced.has(key)) return text;
  const hit = memo.get(key);
  if (hit !== undefined) return hit === null ? text : text.replace(key, hit);
  let found = plain(key) ?? bySentence(key, true);
  // Text in quotes or brackets (“Best wishes for Diwali”) is translated whole before any template gets a try.
  if (found === null && /^[“"‘(（]/.test(key)) found = inner(key);
  if (found === null) {
    // Several templates can fit ("{holiday} green" and "{holiday} pine green"): take the one whose slots hold words we
    // know, then the one with the most fixed text.
    let best = -1;
    for (const tpl of templates) {
      const m = tpl.re.exec(key);
      if (!m || !tpl.slots.every((slot, i) => fits(slot, m[i + 1]!))) continue;
      const values = m.slice(1);
      const known = values.filter((v) => /^[\d.,\s½¼¾]+$/.test(v) || lookup(v) !== undefined).length;
      const score = known * 1000 + key.length - values.join('').length;
      if (score <= best) continue;
      best = score;
      let filled = tpl.to;
      tpl.slots.forEach((slot, i) => { filled = filled.replace(`{${slot}}`, slotText(values[i]!)); });
      found = filled;
    }
  }
  if (found === null) found = inner(key);
  if (found === null) found = bySentence(key, false);
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
  if (el.getAttribute('translate') === 'no' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
  // A text box's own text is what the child typed, but its placeholder and label are ours.
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v) {
      const next = t(v);
      if (next !== v) el.setAttribute(a, next);
    }
  }
  if (SKIP.has(el.tagName)) return;
  for (const c of Array.from(el.childNodes)) translateNode(c);
}

/** Sets the page's language and direction, loads the shared dictionary and starts the watcher. */
export async function initLang(): Promise<void> {
  const code = currentLang();
  document.documentElement.lang = code === 'en' ? 'en-US' : code;
  active = code;
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
