/**
 * Craft cards for the Holiday World page, plus the DOM pieces recipes share with them: step lists with grown-up
 * markers and hazard chips, big-checkbox checklists, the mess splats and the "Let's make it" disclosure.
 *
 *   craftCard(craft, { holidayId }) → <article.craft> (mess splats, hazards, adult help, materials checklist, steps, learn line)
 *   stepList(steps) · hazardChips(hazards, adult) · checklist(key, items, render) · disclosure(label, body, key)
 */
import { minutesToText } from '../app/format';
import { HAZARD_LABELS } from '../content/allergens';
import type { AdultHelp, Craft, HolidayId, Hazard, Material, Step } from '../content/types';
import { fill } from '../i18n/index';
import { ADULT_HELP_LABELS, COPY, MESS_LABELS, fmt } from './copy';
import { append, h, svg, type Child } from './dom';
import { HAZARD_ICON, icon } from './icons';
import { checkedFor, checklistSummary, setChecked, toggleChecked } from './sections';

// ───────────────────────────────────────────────────────── shared pieces

/** "⚠ Hot oven or stove" chips, led by a grown-up hand when the step needs an adult. */
export function hazardChips(hazards: readonly Hazard[] | undefined, adult: boolean, cls = 'step-hazards'): HTMLElement | null {
  const list = hazards ?? [];
  if (!adult && list.length === 0) return null;
  return h('div', { class: cls },
    adult ? h('span', { class: 'chip chip-sm chip-adult' }, icon('adultHand', 18), 'Grown-up step') : null,
    ...list.map((hz) => h('span', { class: 'chip chip-sm chip-hazard' }, icon(HAZARD_ICON[hz], 18), HAZARD_LABELS[hz])),
  );
}

/** Numbered steps; grown-up steps get the sun-colored number, the hand chip and their hazard names. */
export function stepList(steps: readonly Step[]): HTMLOListElement {
  return h('ol', { class: 'steps' }, ...steps.map((s, i) => h('li', { class: s.adult ? 'step is-adult' : 'step' },
    h('span', { class: 'step-num', 'aria-hidden': 'true' }, String(i + 1)),
    h('div', { class: 'step-main' },
      h('p', { class: 'step-text' }, s.text),
      hazardChips(s.hazards, s.adult === true),
      s.timerMinutes ? h('span', { class: 'chip chip-sm step-timer', 'aria-label': fill('Timer: {time}', { time: minutesToText(s.timerMinutes) }) },
        icon('timer', 18), minutesToText(s.timerMinutes)) : null,
      s.tip ? h('p', { class: 'step-tip' }, h('span', { 'aria-hidden': 'true' }, '💡 '), s.tip) : null,
    ),
  )));
}

/** The recipe/craft-level grown-up line: a loud badge when an adult is needed, a quiet chip otherwise. */
export function adultHelpTag(help: AdultHelp): HTMLElement {
  return help === 'needed'
    ? h('p', { class: 'adult-badge' }, icon('adultHand', 20), COPY.grownUpNeeded)
    : h('span', { class: 'chip chip-sm' }, icon(help === 'some' ? 'adultHand' : 'check', 18), ADULT_HELP_LABELS[help]);
}

export interface Checklist {
  readonly el: HTMLElement;
  /** Re-renders every row label (the units toggle changes quantities). */
  refresh(): void;
}

/**
 * Big-checkbox list whose ticks live in session memory under `key` (so Step Mode and Back keep them).
 * `render(i)` returns the row's label content; it is called again on `refresh()`.
 */
export function checklist(key: string, count: number, render: (i: number) => Child[], cls = 'ingredients'): Checklist {
  let checked = checkedFor(key);
  const summary = h('p', { class: 'small muted checklist-summary', 'aria-live': 'polite' }, checklistSummary(checked.size, count));
  const labels: HTMLElement[] = [];
  const rows: HTMLElement[] = [];
  for (let i = 0; i < count; i++) {
    const id = `${key.replace(/[^\w-]/g, '-')}-${i}`;
    const input = h('input', { type: 'checkbox', class: 'ing-check', id, checked: checked.has(i) });
    const label = h('span', { class: 'ing-label' }, ...render(i));
    const row = h('label', { class: checked.has(i) ? 'ing is-checked' : 'ing', for: id }, input, label);
    input.addEventListener('change', () => {
      checked = toggleChecked(checked, i);
      setChecked(key, checked);
      row.classList.toggle('is-checked', checked.has(i));
      summary.textContent = checklistSummary(checked.size, count);
    });
    labels.push(label);
    rows.push(row);
  }
  return {
    el: h('div', { class: 'checklist' }, summary, h('div', { class: cls }, ...rows)),
    refresh: () => labels.forEach((label, i) => { label.replaceChildren(); append(label, render(i)); }),
  };
}

/** Expanded "Let's make it" panels survive Step Mode round trips and re-renders within a session. */
const OPEN = new Set<string>();

/** A toggle button plus a body that is collapsed by default (always expanded in print). */
export function disclosure(key: string, closedLabel: string, openLabel: string, body: HTMLElement): { button: HTMLButtonElement; body: HTMLElement; open(): void } {
  const id = `more-${key.replace(/[^\w-]/g, '-')}`;
  body.id = id;
  body.classList.add('more-body');
  const text = h('span', {});
  const button = h('button', { class: 'btn btn-secondary more-toggle', type: 'button', 'aria-controls': id }, icon('chevron', 20), text);
  const set = (open: boolean): void => {
    if (open) OPEN.add(key); else OPEN.delete(key);
    button.setAttribute('aria-expanded', String(open));
    body.classList.toggle('is-collapsed', !open);
    text.textContent = open ? openLabel : closedLabel;
  };
  button.addEventListener('click', () => set(!OPEN.has(key)));
  set(OPEN.has(key));
  return { button, body, open: () => set(true) };
}

// ───────────────────────────────────────────────────────── mess splats

function splat(on: boolean): SVGSVGElement {
  const el = svg('svg', { viewBox: '0 0 24 24', width: 22, height: 22, class: on ? 'splat is-on' : 'splat', 'aria-hidden': 'true', focusable: 'false' });
  for (const [cx, cy, r] of [[12, 12.5, 6.2], [4.5, 6, 2], [19.5, 7.5, 1.7], [18.5, 19, 2.2], [5, 18.5, 1.5], [12, 3, 1.2]] as const) {
    el.append(svg('circle', { cx, cy, r }));
  }
  return el;
}

/** Mess level 1–3 as paint splats, with the words for everyone who does not read splats. */
export function messMeter(level: 1 | 2 | 3): HTMLElement {
  return h('span', { class: 'chip chip-sm mess' },
    h('span', { class: 'splats' }, splat(true), splat(level >= 2), splat(level >= 3)),
    fmt('mess', { level: MESS_LABELS[level] }));
}

// ───────────────────────────────────────────────────────── craft card

function materialLine(m: Material): Child[] {
  return [
    m.qty ? h('span', { class: 'ing-qty' }, m.qty, ' ') : null,
    m.item,
    m.optional ? h('span', { class: 'muted' }, ' (if you have it)') : null,
    m.substitute ? h('span', { class: 'muted' }, ' — ', fill('or {item}', { item: m.substitute })) : null,
  ];
}

export interface CraftCardOptions {
  readonly holidayId: HolidayId;
}

export function craftCard(craft: Craft, opts: CraftCardOptions): HTMLElement {
  const key = `${opts.holidayId}/${craft.id}`;
  const materials = checklist(`${key}/materials`, craft.materials.length, (i) => {
    const m = craft.materials[i];
    return m ? materialLine(m) : [];
  }, 'materials');
  const body = h('div', { class: 'recipe-body' },
    h('h4', { class: 'h3 sub-title' }, 'You need'),
    materials.el,
    h('h4', { class: 'h3 sub-title' }, 'Steps'),
    stepList(craft.steps),
  );
  const more = disclosure(key, 'Show me how', 'Hide the steps', body);
  return h('article', { class: 'craft', id: `craft-${craft.id}`, 'aria-labeledby': `craft-${craft.id}-title` },
    h('div', { class: 'recipe-head rh-grid' },
      h('span', { class: 'recipe-emoji', 'aria-hidden': 'true' }, craft.emoji),
      h('h3', { class: 'h3', id: `craft-${craft.id}-title` }, craft.title),
      h('p', { class: 'recipe-blurb' }, craft.blurb),
    ),
    h('div', { class: 'recipe-meta' },
      h('span', { class: 'chip chip-sm' }, icon('timer', 18), fmt('takes', { time: minutesToText(craft.minutes) })),
      messMeter(craft.mess),
      adultHelpTag(craft.adultHelp),
    ),
    hazardChips(craft.hazards, false, 'allergens'),
    craft.learn ? h('p', { class: 'craft-learn' }, h('strong', {}, 'What we learn: '), craft.learn) : null,
    h('div', { class: 'btn-group' }, more.button),
    more.body,
  );
}
