/** Minimal DOM builder so the UI stays dependency-free but readable. Never innerHTML. */
export type Child = Node | string | number | null | undefined | false;

export type Attrs = Partial<Record<string, string | number | boolean | EventListener>>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  applyAttrs(el, attrs);
  append(el, children);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** SVG element builder (attributes are always set as attributes). */
export function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...children: (Node | string)[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  for (const c of children) el.append(c instanceof Node ? c : document.createTextNode(c));
  return el;
}

export function applyAttrs(el: Element, attrs: Attrs): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class') {
      el.className = String(value);
    } else if (key === 'style' || key.startsWith('data-') || key.startsWith('aria-') || key === 'role' || key === 'tabindex' || key === 'for' || key === 'lang') {
      el.setAttribute(key, value === true ? '' : String(value));
    } else if (key in el && typeof value !== 'boolean') {
      (el as unknown as Record<string, unknown>)[key] = value;
    } else {
      el.setAttribute(key, value === true ? '' : String(value));
    }
  }
}

export function append(el: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function clear(el: Element): void {
  el.replaceChildren();
}

/** Text fragment helper for mixed content: frag('Hello ', strong, '!') */
export function frag(...children: Child[]): DocumentFragment {
  const f = document.createDocumentFragment();
  append(f, children);
  return f;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Traps Tab focus inside `root`; returns a disposer. Esc is left to the caller. */
export function trapFocus(root: HTMLElement): () => void {
  const onKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab') return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement);
    if (items.length === 0) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  root.addEventListener('keydown', onKey);
  return () => root.removeEventListener('keydown', onKey);
}

let liveRegion: HTMLElement | null = null;

/** Polite screen-reader announcement via a single shared live region. */
export function announce(text: string): void {
  if (!liveRegion) {
    liveRegion = h('div', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = '';
  // Re-set on the next tick so identical consecutive messages are re-announced.
  window.setTimeout(() => { if (liveRegion) liveRegion.textContent = text; }, 30);
}

/** Moves focus to the first heading in `view` without scrolling it into the middle of the page. */
export function focusHeading(view: HTMLElement): void {
  const heading = view.querySelector<HTMLElement>('h1');
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}
