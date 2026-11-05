/**
 * draw.ts — tiny declarative SVG: a drawing is a nested array `[tag, attrs, ...children]`, built with
 * createElementNS (never innerHTML). The Halloween games draw every character from these specs, so a
 * pumpkin, a monster or a ghost is plain data the Fridge can store and redraw.
 */
const NS = 'http://www.w3.org/2000/svg';

export type Attrs = Readonly<Record<string, string | number>>;
export type Spec = readonly [tag: string, attrs: Attrs, ...children: (Spec | string)[]];

export function build(spec: Spec): SVGElement {
  const [tag, attrs, ...kids] = spec;
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  for (const k of kids) el.append(typeof k === 'string' ? document.createTextNode(k) : build(k));
  return el;
}

/** An <svg> root with a viewBox, decorative by default (callers label the control around it). */
export function root(w: number, hgt: number, cls: string, ...kids: Spec[]): SVGSVGElement {
  const el = build(['svg', { viewBox: `0 0 ${w} ${hgt}`, class: cls, 'aria-hidden': 'true', focusable: 'false' }, ...kids]);
  return el as SVGSVGElement;
}

let ids = 0;
/** A document-unique id for gradients, so two drawings on one page never share (or lose) a definition. */
export function uid(prefix: string): string {
  ids += 1;
  return `${prefix}${ids}`;
}

/** `rot` degrees about (x, y), as a transform attribute value. */
export const at = (x: number, y: number, rot = 0, s = 1): string =>
  `translate(${x} ${y})${rot ? ` rotate(${rot})` : ''}${s !== 1 ? ` scale(${s})` : ''}`;

/** One eye with a catchlight, per ART.md §13 (a single white dot, up and to the left). */
export function eye(x: number, y: number, r: number, ink = '#2b1a4d'): Spec[] {
  return [
    ['ellipse', { cx: x, cy: y, rx: r * 0.8, ry: r, fill: ink }],
    ['circle', { cx: x - r * 0.25, cy: y - r * 0.35, r: r * 0.3, fill: '#fff' }],
  ];
}

export const cheek = (x: number, y: number, r: number): Spec => ['ellipse', { cx: x, cy: y, rx: r, ry: r * 0.62, fill: '#ff8fb8', opacity: 0.55 }];
