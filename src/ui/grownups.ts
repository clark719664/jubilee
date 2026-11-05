/**
 * For Grown-ups (§3.1 `#/grownups`, §10): every setting a parent might want, what is
 * stored on this device, how the dates are worked out, where the content comes from,
 * our privacy promises, and Reset everything (behind a typed confirmation).
 *
 * Every control is a real labeled form control (inputs, radios, a select) at least
 * 48 px tall. Settings save immediately through the Store; nothing leaves the device.
 */
import { clearPlayStorage, playStorageLines } from '../play/storage';
import type { AppContext, ViewFactory } from '../app/context';
import { NAME_MAX } from '../app/state';
import { HOLIDAYS } from '../content/registry';
import { loadContent } from '../content/loader';
import type { CustomHoliday, HolidayMeta } from '../content/types';
import { daysInMonth, isLeap, parseIso } from '../dates/civil';
import { REGIONS, type Region } from '../dates/rules';
import { TABLES, type CalendarKind, type TableId } from '../dates/tables/index';
import { applyScheme } from '../theme/apply';
import { COPY, VIEW_NAMES } from './copy';
import { h } from './dom';
import { icon } from './icons';

// ───────────────────────────────────────────────────────── pure helpers

export const REGION_NAMES: Record<Region, string> = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia', MX: 'Mexico', IN: 'India', FR: 'France',
  OTHER: 'Somewhere else',
};

/** The emoji a parent can pick for a custom day, each with a name for screen readers. */
export const CUSTOM_EMOJI: readonly (readonly [emoji: string, name: string])[] = [
  ['🎂', 'birthday cake'], ['🎈', 'balloon'], ['🎉', 'party popper'], ['🎁', 'present'], ['⭐', 'star'], ['🌈', 'rainbow'],
  ['🦄', 'unicorn'], ['🦖', 'dinosaur'], ['🚀', 'rocket'], ['⚽', 'football'], ['🐶', 'puppy'], ['🐱', 'kitten'],
  ['🌸', 'blossom'], ['🍕', 'pizza'], ['🏡', 'home'], ['💖', 'sparkly heart'],
];

export interface CustomInput {
  readonly name: string;
  readonly emoji: string;
  readonly month: string | number;
  readonly day: string | number;
  /** Optional birth year; '' for none. */
  readonly year: string | number;
}

export type CustomField = 'name' | 'emoji' | 'month' | 'day' | 'year';

export type CustomCheck =
  | { readonly ok: true; readonly value: Omit<CustomHoliday, 'id'>; readonly note?: string }
  | { readonly ok: false; readonly errors: Partial<Record<CustomField, string>> };

const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** The next year with a February 29, on or after `from`. */
export function nextLeapYear(from: number): number {
  let y = from;
  while (!isLeap(y)) y += 1;
  return y;
}

/**
 * Validates the custom-day form. Days are checked against a leap year so February 29 is
 * allowed (with a note: it only shows up in leap years); a birth year must be 1900…this
 * year, and a February 29 birthday needs a birth year that had one.
 */
export function validateCustom(input: CustomInput, thisYear: number): CustomCheck {
  const errors: Partial<Record<CustomField, string>> = {};
  const name = input.name.trim();
  if (!name) errors.name = 'Give the day a name.';
  else if (name.length > NAME_MAX) errors.name = `Keep the name to ${NAME_MAX} letters or fewer.`;
  const emoji = input.emoji || '🎂';
  if (!CUSTOM_EMOJI.some(([e]) => e === emoji)) errors.emoji = 'Pick one of the pictures.';
  const month = Number(input.month);
  const day = Number(input.day);
  if (!Number.isInteger(month) || month < 1 || month > 12) errors.month = 'Pick a month.';
  if (!Number.isInteger(day) || day < 1) errors.day = 'Pick a day.';
  else if (!errors.month && day > daysInMonth(2024, month)) {
    errors.day = `${MONTH_EN[month - 1]} only has ${daysInMonth(2024, month)} days.`;
  }
  const yearText = String(input.year).trim();
  let year: number | undefined;
  if (yearText !== '') {
    year = Number(yearText);
    if (!/^\d{4}$/.test(yearText) || year < 1900 || year > thisYear) errors.year = `Use a year between 1900 and ${thisYear}, or leave it empty.`;
    else if (month === 2 && day === 29 && !isLeap(year)) errors.year = `February 29 didn’t happen in ${year}. Check the year?`;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const value: Omit<CustomHoliday, 'id'> = { name, emoji, month, day, ...(year !== undefined ? { year } : {}) };
  if (month === 2 && day === 29) {
    return { ok: true, value, note: `A February 29 day only shows up in leap years. The next one is ${nextLeapYear(thisYear)}.` };
  }
  return { ok: true, value };
}

const CALENDAR_NAMES: Record<CalendarKind, string> = {
  chinese: 'Chinese lunisolar calendar', hindu: 'Hindu lunisolar calendar', hebrew: 'Hebrew calendar',
  islamic: 'Islamic (Hijri) calendar', astronomical: 'the March equinox',
};

/** Holiday names that read each table (Chuseok shares Mid-Autumn's; Ramadan runs until Eid al-Fitr). */
export function tableUsers(metas: readonly HolidayMeta[]): Map<TableId, string[]> {
  const out = new Map<TableId, string[]>();
  const add = (id: TableId, name: string): void => {
    const list = out.get(id) ?? [];
    if (!list.includes(name)) list.push(name);
    out.set(id, list);
  };
  for (const m of metas) {
    if (m.rule.kind === 'table') add(m.rule.table, m.name);
    if (typeof m.days === 'object') add(m.days.untilTable, `${m.name} (its last day)`);
  }
  return out;
}

// ───────────────────────────────────────────────────────── view

const T = {
  save: 'Save',
  saved: 'Saved!',
  regionAuto: 'Let this device decide',
  regionFlag: 'This visit uses ?region={region} from the address, which wins over this setting.',
  customName: 'Name of the day',
  customEmoji: 'Picture',
  month: 'Month',
  day: 'Day',
  birthYear: 'Birth year (optional)',
  added: 'Added {name}!',
  turns: 'turns {age} in {year}',
  removed: 'Removed {name}',
  tablesOpen: 'The {n} calendar tables',
  exact: 'Exact date',
  sighting: 'Depends on the new moon being seen, so the app says “expected”',
  sourcesOpen: 'Sources for each holiday',
  settings: 'Settings',
  rules: 'The rules',
  loading: 'Loading…',
  promises: 'Our promises',
  reset: 'Type RESET to confirm',
  resetYes: 'Yes, forget everything',
  cancel: 'Cancel',
} as const;
const t = (s: string, vars: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

const COMPUTED_RULES: readonly string[] = [
  'Fixed dates, like Halloween on October 31.',
  'The nth weekday of a month, like the fourth Thursday of November for US Thanksgiving.',
  'The last weekday of a month, like Memorial Day.',
  'Easter by the Gregorian computus, and Orthodox Easter by the Julian one; Pancake Day is 47 days before Easter.',
  'Days counted from another holiday, like the Lantern Festival 14 days after Lunar New Year.',
  'Regional versions, like Mother’s Day in the UK, Mexico and France, and Canadian Thanksgiving.',
  'Days off moved from a weekend (shown as “Day off”, the countdown still aims at the real day).',
];

const PROMISES: readonly string[] = [
  'No accounts and no sign-in.',
  'No network after the page loads: nothing is sent anywhere.',
  'No ads, no tracking and no analytics.',
  'No links out of the app, no notifications, no streaks to lose.',
];

let fieldSeq = 0;
const uid = (base: string): string => `gu-${base}-${++fieldSeq}`;

function section(title: string, ...children: (Node | null)[]): HTMLElement {
  return h('section', { class: 'section' }, h('h2', { class: 'section-title' }, title), ...children);
}

function choiceGroup<V extends string>(
  legend: string, options: readonly { readonly value: V; readonly label: string }[], current: V, onChange: (v: V) => void,
): HTMLElement {
  const name = uid('choice');
  const row = h('div', { class: 'choice-row' });
  for (const o of options) {
    const input = h('input', { type: 'radio', name, value: o.value, checked: o.value === current });
    input.addEventListener('change', () => { if (input.checked) onChange(o.value); });
    row.append(h('label', { class: 'choice' }, input, h('span', {}, o.label)));
  }
  return h('fieldset', { class: 'choices' }, h('legend', { class: 'field-label' }, legend), row);
}

function field(label: string, control: HTMLElement, error?: HTMLElement): HTMLElement {
  const id = control.id || uid('f');
  control.id = id;
  return h('div', { class: 'field' }, h('label', { class: 'field-label', for: id }, label), control, error ?? null);
}

function settings(ctx: AppContext): HTMLElement {
  const p = ctx.store.progress;

  const nameInput = h('input', { type: 'text', autocomplete: 'off', maxlength: NAME_MAX, value: p.name ?? '' });
  const nameForm = h('form', { class: 'gu-inline', novalidate: true },
    field(COPY['grownups.name'], nameInput),
    h('button', { class: 'btn', type: 'submit' }, T.save),
  );
  nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    ctx.store.setName(nameInput.value);
    nameInput.value = ctx.store.progress.name ?? '';
    ctx.toast(T.saved, '✅');
  });

  const regionSelect = h('select', {},
    h('option', { value: '' }, T.regionAuto),
    ...REGIONS.map((r) => h('option', { value: r }, REGION_NAMES[r])),
  );
  regionSelect.value = p.region ?? '';
  regionSelect.addEventListener('change', () => {
    ctx.store.setRegion(regionSelect.value === '' ? undefined : (regionSelect.value as Region));
  });

  const everywhere = h('input', { type: 'checkbox', checked: p.everywhere });
  everywhere.addEventListener('change', () => ctx.store.setEverywhere(everywhere.checked));

  return section(T.settings, h('div', { class: 'form' },
    nameForm,
    field(COPY['grownups.region'], regionSelect),
    ctx.flags.region ? h('p', { class: 'help' }, t(T.regionFlag, { region: ctx.flags.region })) : null,
    h('label', { class: 'switch' }, everywhere, h('span', { class: 'field-label' }, COPY['grownups.everywhere'])),
    choiceGroup(COPY['grownups.motion'], [
      { value: 'auto', label: 'Auto' }, { value: 'on', label: 'On' }, { value: 'off', label: 'Off' },
    ] as const, p.motion, (v) => { ctx.store.setMotion(v); ctx.setMotion(null); }),
    choiceGroup(COPY['grownups.units'], [
      { value: 'us', label: COPY.unitsUs }, { value: 'metric', label: COPY.unitsMetric },
    ] as const, p.units, (v) => ctx.store.setUnits(v)),
    choiceGroup(COPY['grownups.scheme'], [
      { value: 'auto', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' },
    ] as const, p.scheme ?? 'auto', (v) => {
      const scheme = v === 'auto' ? undefined : v;
      ctx.store.setScheme(scheme);
      applyScheme(scheme);
      ctx.setTheme(null);
    }),
  ));
}

function customSection(ctx: AppContext, list: HTMLElement): HTMLElement {
  const thisYear = ctx.clock.today().y;
  const monthFmt = new Intl.DateTimeFormat(ctx.locale, { month: 'long' });
  const nameIn = h('input', { type: 'text', autocomplete: 'off', maxlength: NAME_MAX, placeholder: 'Maya’s birthday' });
  const monthSel = h('select', {}, ...MONTH_EN.map((_, i) => h('option', { value: i + 1 }, monthFmt.format(new Date(2024, i, 15, 12)))));
  const daySel = h('select', {});
  const yearIn = h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 4, placeholder: 'e.g. 2019' });
  const note = h('p', { class: 'help', 'aria-live': 'polite' });
  const errs: Record<CustomField, HTMLElement> = {
    name: h('p', { class: 'field-error', hidden: true }), emoji: h('p', { class: 'field-error', hidden: true }),
    month: h('p', { class: 'field-error', hidden: true }), day: h('p', { class: 'field-error', hidden: true }),
    year: h('p', { class: 'field-error', hidden: true }),
  };
  const controls: Partial<Record<CustomField, HTMLElement>> = { name: nameIn, month: monthSel, day: daySel, year: yearIn };

  const emojiName = uid('emoji');
  const emojiInputs = CUSTOM_EMOJI.map(([e, label], i) =>
    h('input', { type: 'radio', name: emojiName, value: e, checked: i === 0, 'aria-label': label }));
  const picker = h('fieldset', { class: 'choices' },
    h('legend', { class: 'field-label' }, T.customEmoji),
    h('div', { class: 'emoji-pick' }, ...emojiInputs.map((input, i) =>
      h('label', { class: 'choice', title: CUSTOM_EMOJI[i]![1] }, input, h('span', { class: 'emoji', 'aria-hidden': 'true' }, CUSTOM_EMOJI[i]![0])))),
    errs.emoji,
  );

  const fillDays = (): void => {
    const keep = daySel.value || '1';
    const n = daysInMonth(2024, Number(monthSel.value)); // a leap year, so February 29 is offered
    daySel.replaceChildren(...Array.from({ length: n }, (_, i) => h('option', { value: i + 1 }, String(i + 1))));
    daySel.value = Number(keep) <= n ? keep : String(n);
  };
  const updateNote = (): void => {
    note.textContent = monthSel.value === '2' && daySel.value === '29'
      ? `A February 29 day only shows up in leap years. The next one is ${nextLeapYear(thisYear)}.` : '';
  };
  monthSel.addEventListener('change', () => { fillDays(); updateNote(); });
  daySel.addEventListener('change', updateNote);
  fillDays();

  const showErrors = (errors: Partial<Record<CustomField, string>>): void => {
    for (const k of Object.keys(errs) as CustomField[]) {
      const msg = errors[k];
      errs[k].hidden = !msg;
      errs[k].textContent = msg ?? '';
      const c = controls[k];
      if (c) { if (msg) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid'); }
    }
  };

  const form = h('form', { class: 'form', novalidate: true },
    field(T.customName, nameIn, errs.name),
    picker,
    h('div', { class: 'gu-dates' }, field(T.month, monthSel, errs.month), field(T.day, daySel, errs.day)),
    field(T.birthYear, yearIn, errs.year),
    note,
    h('button', { class: 'btn', type: 'submit' }, icon('plus', 20), COPY['grownups.addCustom']),
  );
  for (const k of ['name', 'month', 'day', 'year'] as const) {
    const c = controls[k];
    const e = errs[k];
    e.id = `${c!.id}-err`;
    c!.setAttribute('aria-errormessage', e.id);
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emoji = emojiInputs.find((i) => i.checked)?.value ?? '';
    const res = validateCustom({ name: nameIn.value, emoji, month: monthSel.value, day: daySel.value, year: yearIn.value }, thisYear);
    if (!res.ok) {
      showErrors(res.errors);
      const first = (['name', 'month', 'day', 'year'] as const).find((k) => res.errors[k]);
      if (first) controls[first]?.focus();
      return;
    }
    showErrors({});
    const added = ctx.store.addCustom(res.value);
    ctx.toast(t(T.added, { name: added.name }), added.emoji);
    form.reset();
    fillDays();
    updateNote();
  });

  return section(COPY['grownups.custom'], list, form);
}

function renderCustomList(ctx: AppContext, list: HTMLElement): void {
  const customs = ctx.store.progress.custom;
  const thisYear = ctx.clock.today().y;
  const dayFmt = new Intl.DateTimeFormat(ctx.locale, { day: 'numeric', month: 'long' });
  if (customs.length === 0) {
    list.replaceChildren(h('li', { class: 'custom-row muted' }, COPY['empty.custom']));
    return;
  }
  list.replaceChildren(...customs.map((c) => {
    const when = dayFmt.format(new Date(2024, c.month - 1, c.day, 12));
    const age = c.year === undefined ? '' : ` · ${t(T.turns, { age: Math.max(0, thisYear - c.year), year: thisYear })}`;
    return h('li', { class: 'custom-row' },
      h('span', { class: 'row' }, h('span', { class: 'emoji', 'aria-hidden': 'true', style: 'font-size:28px' }, c.emoji),
        h('span', {}, h('strong', {}, c.name), h('span', { class: 'small muted' }, ` · ${when}${age}`))),
      h('button', {
        class: 'btn btn-secondary', type: 'button', 'aria-label': `${COPY['grownups.remove']} ${c.name}`,
        onclick: () => { ctx.store.removeCustom(c.id); ctx.toast(t(T.removed, { name: c.name })); },
      }, COPY['grownups.remove']),
    );
  }));
}

function storeSection(ctx: AppContext, list: HTMLElement): HTMLElement {
  return section(COPY['grownups.store'],
    ctx.store.storageOk ? null : h('p', { class: 'lead' }, COPY['grownups.storageOff']),
    ctx.clock.pretending ? h('p', { class: 'help' }, COPY.pretendNoSave) : null,
    list,
  );
}

function datesSection(): HTMLElement {
  const users = tableUsers(HOLIDAYS);
  const cards = (Object.keys(TABLES) as TableId[]).map((id) => {
    const tb = TABLES[id];
    const retrieved = parseIso(tb.retrieved);
    return h('li', { class: 'gu-table' },
      h('h4', { class: 'h3' }, (users.get(id) ?? [id]).join(', ')),
      h('dl', {},
        h('dt', {}, 'Calendar'), h('dd', {}, CALENDAR_NAMES[tb.calendar]),
        h('dt', {}, 'How we count'), h('dd', {}, tb.convention),
        h('dt', {}, 'Source'), h('dd', {}, `${tb.source}${retrieved ? ` (checked ${tb.retrieved})` : ''}`),
        h('dt', {}, 'Years'), h('dd', {}, `${tb.coverage.from} to ${tb.coverage.to}`),
        h('dt', {}, 'Confidence'), h('dd', {}, tb.confidence === 'sighting' ? T.sighting : T.exact),
      ),
    );
  });
  return section(COPY['grownups.dates'],
    h('p', { class: 'prose' }, COPY['grownups.datesText']),
    h('details', { class: 'gu-details' }, h('summary', {}, T.rules), h('ul', { class: 'gu-bullets' }, ...COMPUTED_RULES.map((r) => h('li', {}, r)))),
    h('details', { class: 'gu-details' }, h('summary', {}, t(T.tablesOpen, { n: cards.length })), h('ul', { class: 'gu-tables' }, ...cards)),
    sourcesFold(),
  );
}

function sourcesFold(): HTMLElement {
  const body = h('div', { class: 'gu-sources' }, h('p', { class: 'help' }, T.loading));
  const details = h('details', { class: 'gu-details' }, h('summary', {}, T.sourcesOpen), body);
  let loaded = false;
  details.addEventListener('toggle', () => {
    if (!details.open || loaded) return;
    loaded = true;
    const metas = HOLIDAYS.filter((m) => m.tier !== 3);
    void Promise.all(metas.map((m) => loadContent(m.id).then((c) => ({ m, sources: c.sources ?? [] }), () => ({ m, sources: [] as readonly string[] }))))
      .then((rows) => {
        body.replaceChildren(...rows.filter((r) => r.sources.length > 0).map((r) =>
          h('div', { class: 'gu-source' }, h('h4', { class: 'h3' }, `${r.m.emoji} ${r.m.name}`),
            h('ul', { class: 'gu-bullets small' }, ...r.sources.map((s) => h('li', {}, s))))));
      });
  });
  return details;
}

function resetSection(ctx: AppContext, onReset: () => void): HTMLElement {
  const panel = h('div', { class: 'stack', hidden: true });
  const open = h('button', { class: 'btn btn-danger', type: 'button', 'aria-expanded': 'false' }, COPY['grownups.reset']);
  const typed = h('input', { type: 'text', autocomplete: 'off' });
  const yes = h('button', { class: 'btn btn-danger', type: 'button', disabled: true }, T.resetYes);
  const cancel = h('button', { class: 'btn btn-secondary', type: 'button' }, T.cancel);
  const close = (): void => { panel.hidden = true; open.hidden = false; open.setAttribute('aria-expanded', 'false'); typed.value = ''; yes.disabled = true; open.focus(); };
  open.addEventListener('click', () => { panel.hidden = false; open.hidden = true; open.setAttribute('aria-expanded', 'true'); typed.focus(); });
  typed.addEventListener('input', () => { yes.disabled = typed.value.trim().toLowerCase() !== 'reset'; });
  cancel.addEventListener('click', close);
  yes.addEventListener('click', () => {
    if (typed.value.trim().toLowerCase() !== 'reset') return;
    ctx.store.reset();
    clearPlayStorage();
    applyScheme(undefined);
    ctx.setMotion(null);
    ctx.setTheme(null);
    ctx.toast(COPY['grownups.resetDone'], '✨');
    onReset();
  });
  panel.append(
    h('p', { class: 'lead' }, COPY['grownups.resetConfirm']),
    field(T.reset, typed),
    h('div', { class: 'btn-group' }, yes, cancel),
  );
  const s = section(COPY['grownups.reset'], open, panel);
  s.classList.add('danger-zone');
  return s;
}

const grownups: ViewFactory<'grownups'> = (ctx) => {
  ctx.setTheme(null);
  const el = h('section', { class: 'grownups' });
  const storeList = h('ul', { class: 'store-list' });
  const customList = h('ul', { class: 'custom-list' });

  const refresh = (): void => {
    const lines = [...ctx.store.whatWeStore(), ...playStorageLines()];
    storeList.replaceChildren(...(lines.length > 0 ? lines : [COPY['grownups.storeNone']]).map((l) => {
      const i = l.indexOf(': ');
      return i > 0 ? h('li', {}, h('span', {}, l.slice(0, i)), h('strong', {}, l.slice(i + 2))) : h('li', {}, l);
    }));
    renderCustomList(ctx, customList);
  };

  const build = (): void => {
    el.replaceChildren(
      h('h1', { class: 'h1' }, VIEW_NAMES.grownups),
      settings(ctx),
      customSection(ctx, customList),
      storeSection(ctx, storeList),
      datesSection(),
      section(T.promises, h('ul', { class: 'gu-promises' }, ...PROMISES.map((p) => h('li', {}, icon('check', 22), h('span', {}, p))))),
      resetSection(ctx, () => {
        build();
        el.querySelector<HTMLElement>('h1')?.setAttribute('tabindex', '-1');
        el.querySelector<HTMLElement>('h1')?.focus();
      }),
    );
    refresh();
  };

  build();
  const unsubscribe = ctx.store.subscribe(refresh);
  return { el, destroy: unsubscribe };
};

export const grownupsView = grownups;
