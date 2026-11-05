/**
 * read.ts — reading a kept wish or Santa's reply in a dialog, and printing it.
 *
 * Santa's reply first arrives as a sealed red envelope; a tap (or Enter) breaks the seal, the flap
 * swings open and the letter slides up (full motion), or the letter simply appears (reduced motion).
 * Printing clones the paper into a print-only sheet so @media print shows the letter and nothing else.
 */
import type { MotionMode } from '../../effects/types';
import { h, trapFocus } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { envelopeBack, envelopeFlap, envelopePocket, sealArt } from './art';
import { COPY } from './copy';

export interface ReadDialog {
  readonly el: HTMLElement;
  close(): void;
}

export function printPaper(paper: HTMLElement): void {
  const sheet = h('div', { class: 'wish-print-sheet' }, paper.cloneNode(true));
  document.body.append(sheet);
  document.documentElement.classList.add('wish-printing');
  const cleanup = (): void => {
    document.documentElement.classList.remove('wish-printing');
    sheet.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  try {
    window.print();
  } catch {
    cleanup();
    return;
  }
  // Some browsers never fire afterprint; tidy up shortly after the dialog returns either way.
  window.setTimeout(cleanup, 1500);
}

export interface ReadOptions {
  readonly host: HTMLElement;
  readonly title: string;
  readonly paper: HTMLElement;
  readonly printLabel: string;
  readonly motion: () => MotionMode;
  /** Santa's reply: start with the sealed envelope. */
  readonly sealed?: boolean;
  readonly onClose: () => void;
}

export function readDialog(opts: ReadOptions): ReadDialog {
  const full = (): boolean => opts.motion() === 'full';
  const titleId = 'wish-read-title';
  const closeBtn = h('button', { type: 'button', class: 'btn btn-secondary wish-read-back', onclick: () => close() }, icon('arrowLeft', 20), COPY.back);
  const printBtn = h('button', { type: 'button', class: 'btn wish-read-print', onclick: () => printPaper(opts.paper) }, icon('print', 20), opts.printLabel);
  const body = h('div', { class: 'wish-read-body' });
  const card = h('div', { class: 'wish-read-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
    h('h2', { class: 'sr-only', id: titleId }, opts.title),
    body,
    h('div', { class: 'wish-read-actions' }, closeBtn, printBtn));
  const el = h('div', { class: 'wish-read' }, card);
  const untrap = trapFocus(card);
  let closed = false;

  const showPaper = (): void => {
    body.replaceChildren(opts.paper);
    printBtn.hidden = false;
    if (full() && typeof opts.paper.animate === 'function') {
      opts.paper.animate([{ transform: 'translateY(40px) scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  };

  if (opts.sealed) {
    printBtn.hidden = true;
    const flap = h('div', { class: 'wish-env-flap is-front is-closed' }, envelopeFlap('#e85566'));
    const seal = h('div', { class: 'wish-env-seal is-on' }, sealArt('star'));
    const peek = h('div', { class: 'wish-peek' });
    const env = h('button', {
      type: 'button', class: 'wish-env wish-env-santa', 'aria-label': `${COPY.replyReady} ${COPY.replyTap}`,
      onclick: () => void open(),
    },
    h('div', { class: 'wish-env-back' }, envelopeBack('#d62839', '#ffd166')), peek,
    h('div', { class: 'wish-env-pocket' }, envelopePocket('#e63946', '#b81d2c')), flap, seal);
    const from = h('p', { class: 'wish-read-from' }, COPY.replyFrom);
    body.append(h('div', { class: 'wish-sealed' }, env, from, h('p', { class: 'wish-read-tap' }, COPY.replyTap)));
    let opening = false;
    const open = async (): Promise<void> => {
      if (opening) return;
      opening = true;
      if (full() && typeof seal.animate === 'function') {
        await seal.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.3) rotate(20deg)', opacity: 0 }], { duration: 300, fill: 'forwards' }).finished.catch(() => {});
        flap.classList.remove('is-front');
        await flap.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(180deg)' }], { duration: 420, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished.catch(() => {});
        await peek.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-70%)' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).finished.catch(() => {});
      }
      if (closed) return;
      showPaper();
      closeBtn.focus({ preventScroll: true });
    };
    queueMicrotask(() => env.focus({ preventScroll: true }));
  } else {
    showPaper();
    queueMicrotask(() => closeBtn.focus({ preventScroll: true }));
  }

  opts.host.append(el);

  function close(): void {
    if (closed) return;
    closed = true;
    untrap();
    el.remove();
    opts.onClose();
  }

  return { el, close };
}
