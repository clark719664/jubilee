/**
 * print.ts — the printable card: one landscape sheet, two pages (print both sides, flipping on the short
 * edge), then fold along the dotted line.
 *
 *   page 1 (outside):  [ back  |  front  ]
 *   page 2 (inside):   [ info  | inside  ]
 *
 * Turning a landscape sheet over on its short edge puts the back of the FRONT panel on the left of page
 * 2, so the info page ("what the greeting means") is the inside of the cover and the child's message is
 * the right-hand page, as in a shop-bought card. Panels are rasterised locally at ~300 dpi for an A6 /
 * half-Letter card; the dedicated @media print layout (card.css) hides everything else.
 */
import { h } from '../../ui/dom';
import type { CardSpec } from './model';
import { loadAssets, panelCanvas, type CardEnv, type PanelKind } from './raster';

const PRINT_K = 2.6;

function panel(kind: PanelKind, card: CardSpec, env: CardEnv, assets: Awaited<ReturnType<typeof loadAssets>>): HTMLElement {
  const c = panelCanvas(kind, card, env, assets, PRINT_K);
  c.className = 'cm-print-canvas';
  return h('div', { class: `cm-print-panel cm-print-${kind}` }, c);
}

function page(left: HTMLElement, right: HTMLElement): HTMLElement {
  return h('div', { class: 'cm-print-page' },
    h('div', { class: 'cm-print-spread' }, left, right,
      h('span', { class: 'cm-fold cm-fold-top', 'aria-hidden': 'true' }),
      h('span', { class: 'cm-fold cm-fold-bottom', 'aria-hidden': 'true' })));
}

let printing = false;

export async function printCard(card: CardSpec, env: CardEnv): Promise<void> {
  if (printing || typeof window === 'undefined') return;
  printing = true;
  try {
    if (document.fonts?.ready) await document.fonts.ready.catch(() => undefined);
    const assets = await loadAssets(card);
    const sheet = h('div', { class: 'cm-print', 'aria-hidden': 'true' },
      page(panel('back', card, env, assets), panel('front', card, env, assets)),
      page(panel('info', card, env, assets), panel('inside', card, env, assets)));
    document.body.append(sheet);
    document.documentElement.classList.add('cm-printing');
    let done = false;
    const cleanup = (): void => {
      if (done) return;
      done = true;
      document.documentElement.classList.remove('cm-printing');
      sheet.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    try { window.print(); } catch { cleanup(); return; }
    // Some browsers never fire afterprint; tidy up shortly after the dialog returns either way.
    window.setTimeout(cleanup, 2000);
  } finally {
    printing = false;
  }
}
