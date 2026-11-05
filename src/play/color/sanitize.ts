/**
 * sanitize.ts — turns a bundled coloring page (raw SVG text from src/art/color) into a clean tree.
 *
 * The page arrives as text, so it is parsed with DOMParser('image/svg+xml') and then REBUILT from an
 * allow-list: only plain shapes and groups survive, and only geometry/paint attributes whose values
 * match strict patterns. No <script>, <style>, <image>, <use>, <foreignObject>, <text>, links, event
 * handlers, style attributes, ids, classes or url(...) references can get through, so even a bad art
 * file cannot run code or reach the network. The pure half (sanitizeTree) works on a tiny element
 * description so Node tests can exercise it without a DOM; the browser half converts a parsed
 * document into that description and builds the result with svg().
 */
import { svg } from '../../ui/dom';

/** A parsed element, independent of any DOM. Text nodes are not represented (they are dropped). */
export interface XNode {
  readonly tag: string;
  /** Namespace URI; anything other than SVG is dropped. Omitted = SVG (handy for tests). */
  readonly ns?: string;
  readonly attrs: Readonly<Record<string, string>>;
  readonly children: readonly XNode[];
}

/** A sanitised element: allow-listed tag, allow-listed attributes with checked values. */
export interface CleanNode {
  readonly tag: CleanTag;
  readonly attrs: Readonly<Record<string, string>>;
  readonly children: readonly CleanNode[];
}

export interface CleanPage {
  readonly root: CleanNode;
  /** Distinct region ids (data-fill) in document order. */
  readonly regions: readonly string[];
  /** How many elements or attributes were thrown away (for tests and the console). */
  readonly dropped: number;
}

export const SVG_NS = 'http://www.w3.org/2000/svg';
export const PAGE_VIEWBOX = '0 0 800 800';

export const ALLOWED_TAGS = ['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line'] as const;
export type CleanTag = typeof ALLOWED_TAGS[number];

export const ALLOWED_ATTRS = [
  'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'points', 'x1', 'y1', 'x2', 'y2',
  'transform', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'viewBox', 'data-fill',
] as const;

/** Guards against absurd files: the real pages have a few hundred elements. */
export const MAX_NODES = 5000;
export const MAX_DEPTH = 24;
const MAX_VALUE = 40000;

const NUM = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;
const LENGTH = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?(px|%)?$/i;
const PATH = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\-\s]*$/;
const POINTS = /^[0-9eE.,+\-\s]*$/;
const TRANSFORM = /^(\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\(\s*[-+0-9eE.,\s]*\)\s*,?)*\s*$/;
const COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8}|none|currentColor|[a-z]{3,20}|rgba?\(\s*[0-9.,%\s]+\))$/i;
const REGION = /^[a-z0-9][a-z0-9_-]{0,47}$/i;
const VIEWBOX = /^\s*[-+]?[\d.]+(e[-+]?\d+)?([\s,]+[-+]?[\d.]+(e[-+]?\d+)?){3}\s*$/i;
const ENUMS: Readonly<Record<string, readonly string[]>> = {
  'stroke-linecap': ['butt', 'round', 'square'],
  'stroke-linejoin': ['miter', 'round', 'bevel', 'arcs', 'miter-clip'],
  'fill-rule': ['nonzero', 'evenodd'],
};
const NUMERIC = new Set(['cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2']);
const TAGS = new Set<string>(ALLOWED_TAGS);
const ATTRS = new Set<string>(ALLOWED_ATTRS);

/** Is `value` acceptable for attribute `name` on `tag`? (Names outside the allow-list never are.) */
export function attrOk(tag: string, name: string, value: string): boolean {
  if (!ATTRS.has(name) || value.length > MAX_VALUE) return false;
  const v = value.trim();
  // Belt and braces: nothing that could reference or script anything, whatever the pattern says.
  if (/url\s*\(|javascript:|data:|expression|[<>"'`;{}\\]/i.test(v)) return false;
  if (NUMERIC.has(name)) return NUM.test(v);
  switch (name) {
    case 'width': case 'height': return LENGTH.test(v) && !v.startsWith('-');
    case 'stroke-width': return LENGTH.test(v) && !v.startsWith('-');
    case 'd': return PATH.test(v);
    case 'points': return POINTS.test(v);
    case 'transform': return TRANSFORM.test(v);
    case 'fill': case 'stroke': return COLOR.test(v);
    case 'data-fill': return REGION.test(v);
    case 'viewBox': return tag === 'svg' && VIEWBOX.test(v);
    default: return ENUMS[name]?.includes(v) ?? false;
  }
}

/**
 * Rebuilds `root` from the allow-list. Returns null when the root is not an <svg>. Disallowed
 * elements are dropped with everything inside them (a shape inside a <a> or <foreignObject> is not
 * trusted either). Nested <svg> elements are dropped too: a page is one artboard.
 */
export function sanitizeTree(root: XNode): CleanPage | null {
  if (!isSvg(root) || root.tag !== 'svg') return null;
  let budget = MAX_NODES;
  let dropped = 0;
  const regions: string[] = [];
  const seen = new Set<string>();

  const cleanAttrs = (node: XNode): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [name, value] of Object.entries(node.attrs)) {
      if (attrOk(node.tag, name, value)) out[name] = value.trim();
      else dropped++;
    }
    return out;
  };

  const walk = (node: XNode, depth: number): CleanNode | null => {
    if (budget <= 0 || depth > MAX_DEPTH || !isSvg(node) || !TAGS.has(node.tag) || (depth > 0 && node.tag === 'svg')) {
      dropped++;
      return null;
    }
    budget--;
    const attrs = cleanAttrs(node);
    // A path or polygon whose geometry was refused has nothing left to draw: drop it (and its region).
    if ((node.tag === 'path' && node.attrs.d !== undefined && attrs.d === undefined)
      || ((node.tag === 'polygon' || node.tag === 'polyline') && node.attrs.points !== undefined && attrs.points === undefined)) {
      dropped++;
      return null;
    }
    const region = attrs['data-fill'];
    if (region !== undefined && !seen.has(region)) { seen.add(region); regions.push(region); }
    const children: CleanNode[] = [];
    for (const c of node.children) {
      const k = walk(c, depth + 1);
      if (k) children.push(k);
    }
    return { tag: node.tag as CleanTag, attrs, children };
  };

  const clean = walk(root, 0);
  if (!clean) return null;
  // The root keeps only its viewBox (the page is sized by CSS), defaulting to the 800×800 artboard.
  const viewBox = clean.attrs.viewBox ?? PAGE_VIEWBOX;
  const rootAttrs: Record<string, string> = { viewBox };
  for (const k of ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'] as const) {
    const v = clean.attrs[k];
    if (v !== undefined) rootAttrs[k] = v;
  }
  return { root: { tag: 'svg', attrs: rootAttrs, children: clean.children }, regions, dropped };
}

function isSvg(n: XNode): boolean {
  return n.ns === undefined || n.ns === SVG_NS;
}

/** Counts elements in a clean tree (tests, budgets). */
export function countNodes(n: CleanNode): number {
  return 1 + n.children.reduce((s, c) => s + countNodes(c), 0);
}

// ── browser half ──

/** Parsed DOM element → XNode (elements only; depth-capped so a hostile file cannot blow the stack). */
export function toXNode(el: Element, depth = 0): XNode {
  const attrs: Record<string, string> = {};
  for (const a of Array.from(el.attributes)) {
    // Namespaced attributes (xlink:href, xml:space…) are never allowed; keep them out by name.
    attrs[a.prefix ? `${a.prefix}:${a.localName}` : a.localName] = a.value;
  }
  const children = depth > MAX_DEPTH ? [] : Array.from(el.children).map((c) => toXNode(c, depth + 1));
  return { tag: el.localName, ns: el.namespaceURI ?? '', attrs, children };
}

/** Raw SVG text → clean page, or null when it does not parse or is not an SVG. */
export function parseColorPage(text: string): CleanPage | null {
  if (typeof DOMParser === 'undefined') return null;
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (doc.getElementsByTagName('parsererror').length > 0) return null;
  return sanitizeTree(toXNode(doc.documentElement));
}

/** Clean tree → live SVG elements, built with svg() (attributes only, never markup). */
export function buildSvg(node: CleanNode, onEl?: (el: SVGElement, node: CleanNode) => void): SVGElement {
  const el = svg(node.tag, { ...node.attrs });
  onEl?.(el, node);
  for (const c of node.children) el.append(buildSvg(c, onEl));
  return el;
}
