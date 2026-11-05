/**
 * panels.ts — the little cards that pop up over the page: Print, My pictures, "On the Fridge!" and
 * "The Fridge is full". One modal at a time, focus trapped inside, Esc or the close button returns
 * focus to wherever it was. Springs up from below (reduced motion: fades).
 */
import { h, trapFocus } from '../../ui/dom';
import { icon } from '../../ui/icons';

export interface PanelSpec {
  readonly title: string;
  readonly body: readonly (Node | string)[];
  readonly actions?: readonly HTMLElement[];
  readonly closeLabel: string;
  /** Extra class for layout (e.g. the wide pictures drawer). */
  readonly variant?: string;
  readonly onClose?: () => void;
}

export interface Panel {
  readonly el: HTMLElement;
  close(): void;
}

let panelCount = 0;

export function openPanel(host: HTMLElement, spec: PanelSpec): Panel {
  const id = `cp-panel-${++panelCount}`;
  const back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const closeBtn = h('button', { type: 'button', class: 'btn btn-secondary btn-icon cp-panel-x', 'aria-label': spec.closeLabel }, icon('close', 22));
  const card = h('div', { class: `cp-panel-card ${spec.variant ?? ''}`.trim(), role: 'dialog', 'aria-modal': 'true', 'aria-labeledby': `${id}-t` },
    closeBtn,
    h('h2', { class: 'cp-panel-title', id: `${id}-t` }, spec.title),
    h('div', { class: 'cp-panel-body' }, ...spec.body),
    spec.actions?.length ? h('div', { class: 'cp-panel-actions' }, ...spec.actions) : null,
  );
  const el = h('div', { class: 'cp-panel' }, h('div', { class: 'cp-panel-scrim' }), card);
  let open = true;
  const untrap = trapFocus(card);
  const close = (): void => {
    if (!open) return;
    open = false;
    untrap();
    el.remove();
    spec.onClose?.();
    back?.focus({ preventScroll: true });
  };
  closeBtn.addEventListener('click', close);
  el.querySelector('.cp-panel-scrim')?.addEventListener('click', close);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  });
  host.append(el);
  const firstAction = spec.actions?.[0];
  (firstAction ?? closeBtn).focus({ preventScroll: true });
  return { el, close };
}
