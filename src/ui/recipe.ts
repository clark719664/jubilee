/**
 * Recipes: the card on the Holiday World page and Step Mode (`#/h/:id/make/:recipeId`).
 *
 *   recipeCard(recipe, opts) → { el, start, setUnits(units) }
 *     emoji · minutes · serves · chef-hat difficulty · grown-up badge · allergen chips (or "No major allergens") ·
 *     may-contain + swaps · choking note · equipment · ingredient checklist with a Cups/Grams toggle · steps
 *   recipeView: ViewFactory<'recipe'> — a full-screen dialog over the page: one giant step per screen, a Done! stamp,
 *     hazards with the grown-up hand, a visual timer ring (vibrates when it ends, never beeps), "Taste test!" last,
 *     then "I made it!" → markRecipeDone + badge check + a confetti finish. Esc, the close button or browser Back
 *     close it; focus goes back to the recipe card's Start button. Print prints the recipe card, not the dialog.
 */
import type { AppContext, ViewFactory, ViewInstance } from '../app/context';
import type { Units } from '../app/format';
import { formatRoute } from '../app/router';
import { BADGE_THRESHOLDS } from '../app/stickers';
import { ALLERGEN_LABELS } from '../content/allergens';
import type { HolidayContent, HolidayId, HolidayMeta, Ingredient, Recipe, Step } from '../content/types';
import { EffectLayer } from '../effects/layer';
import { THEMES } from '../theme/themes';
import { ALLERGEN_NAMES, BADGES, COPY, DIFFICULTY_LABELS, allergenNote, fmt } from './copy';
import { adultHelpTag, checklist, disclosure, hazardChips, stepList } from './craft';
import { append, h, trapFocus, type Child } from './dom';
import { ALLERGEN_ICON, icon } from './icons';
import { mascot } from './mascot';
import {
  cachedContent, contentFor, ingredientParts, markStepModeOpener, setReturnFocus, takeStepModeOpener, timerView,
  timerWords, withTasteTest,
} from './sections';
import { minutesToText } from '../app/format';

// ───────────────────────────────────────────────────────── recipe card

export interface RecipeCardOptions {
  readonly holidayId: HolidayId;
  readonly units: Units;
  readonly onUnits: (units: Units) => void;
  /** The printable copy under Step Mode: always expanded, no buttons. */
  readonly print?: boolean;
}

export interface RecipeCard {
  readonly el: HTMLElement;
  /** The "Start Step Mode" link (focus returns here when Step Mode closes). */
  readonly start: HTMLAnchorElement | null;
  setUnits(units: Units): void;
}

function ingredientLine(ing: Ingredient | undefined, units: Units): Child[] {
  if (!ing) return [];
  const p = ingredientParts(ing, units);
  const allergens = ing.allergens ?? [];
  return [
    p.qty ? h('span', { class: 'ing-qty' }, p.qty, ' ') : null,
    p.item,
    p.note ? h('span', { class: 'muted' }, ` (${p.note})`) : null,
    p.optional ? h('span', { class: 'muted' }, ' — optional') : null,
    allergens.length > 0
      ? h('span', { class: 'ing-allergens' },
        ...allergens.map((a) => icon(ALLERGEN_ICON[a], 18)),
        h('span', { class: 'sr-only' }, ` (contains ${allergens.map((a) => ALLERGEN_NAMES[a]).join(', ')})`))
      : null,
  ];
}

function chefHats(level: 1 | 2 | 3): HTMLElement {
  return h('span', { class: 'chip chip-sm chef-hats' },
    h('span', { class: 'hats', 'aria-hidden': 'true' },
      ...[1, 2, 3].map((n) => h('span', { class: n <= level ? 'hat is-on' : 'hat' }, icon('chefHat', 18)))),
    DIFFICULTY_LABELS[level]);
}

/** Allergen chips, the trace or "no major allergens" line, and the choking note: always visible. */
function allergenBlock(recipe: Recipe): HTMLElement[] {
  const may = recipe.mayContain ?? [];
  const out: HTMLElement[] = [];
  if (recipe.allergens.length > 0) {
    out.push(h('div', { class: 'allergens', role: 'list', 'aria-label': 'Allergens' },
      ...recipe.allergens.map((a) => h('span', { class: 'chip chip-sm chip-allergen', role: 'listitem' }, icon(ALLERGEN_ICON[a], 18), ALLERGEN_LABELS[a]))));
  }
  const note = allergenNote(recipe.allergens, may);
  if (note) out.push(h('p', { class: 'allergen-note' }, note));
  if (recipe.chokingNote) out.push(h('p', { class: 'choking' }, icon('choking', 20), recipe.chokingNote));
  return out;
}

function swapsBlock(recipe: Recipe): HTMLElement | null {
  if (!recipe.swaps || recipe.swaps.length === 0) return null;
  return h('div', { class: 'swaps' },
    h('strong', {}, 'Swaps'),
    h('ul', { class: 'swap-list' }, ...recipe.swaps.map((s) => h('li', {}, fmt('swap', { avoid: ALLERGEN_NAMES[s.avoid], use: s.use })))),
  );
}

export function recipeCard(recipe: Recipe, opts: RecipeCardOptions): RecipeCard {
  const key = `${opts.holidayId}/${recipe.id}`;
  let units = opts.units;
  const unitButtons = (['us', 'metric'] as const).map((u) => h('button', {
    type: 'button', 'aria-pressed': String(u === units), onclick: () => opts.onUnits(u),
  }, u === 'us' ? COPY.unitsUs : COPY.unitsMetric));
  const ingredients = checklist(`${key}/ingredients`, recipe.ingredients.length, (i) => ingredientLine(recipe.ingredients[i], units));

  const body = h('div', { class: 'recipe-body' },
    swapsBlock(recipe),
    h('h4', { class: 'h3 sub-title' }, 'You need'),
    h('ul', { class: 'equipment' }, ...recipe.equipment.map((e) => h('li', {}, e))),
    h('div', { class: 'row wrap sub-row' },
      h('h4', { class: 'h3 sub-title grow' }, 'Ingredients'),
      opts.print ? null : h('div', { class: 'segmented units-toggle', role: 'group', 'aria-label': 'Measurements' }, ...unitButtons),
    ),
    ingredients.el,
    h('p', { class: 'allergen-note' }, COPY.checkLabels),
    h('h4', { class: 'h3 sub-title' }, 'Steps'),
    stepList(recipe.steps),
    recipe.tip ? h('p', { class: 'step-tip recipe-tip' }, h('span', { 'aria-hidden': 'true' }, '💡 '), recipe.tip) : null,
  );

  let start: HTMLAnchorElement | null = null;
  let actions: HTMLElement | null = null;
  if (!opts.print) {
    start = h('a', {
      class: 'btn recipe-start', href: formatRoute({ view: 'recipe', id: opts.holidayId, recipeId: recipe.id }),
      onclick: () => markStepModeOpener(opts.holidayId, recipe.id, Date.now()),
    }, icon('play', 20), 'Start Step Mode');
    const more = disclosure(key, 'Ingredients & steps', 'Hide ingredients & steps', body);
    actions = h('div', { class: 'btn-group' }, start, more.button);
  }

  const el = h('article', { class: 'recipe', id: `recipe-${recipe.id}`, 'aria-labeledby': `recipe-${recipe.id}-title` },
    h('div', { class: 'recipe-head rh-grid' },
      h('span', { class: 'recipe-emoji', 'aria-hidden': 'true' }, recipe.emoji),
      h('h3', { class: 'h3', id: `recipe-${recipe.id}-title` }, recipe.title),
      h('p', { class: 'recipe-blurb' }, recipe.blurb),
    ),
    h('div', { class: 'recipe-meta' },
      h('span', { class: 'chip chip-sm' }, icon('timer', 18), minutesToText(recipe.minutes)),
      h('span', { class: 'chip chip-sm' }, fmt('serves', { n: recipe.serves })),
      chefHats(recipe.difficulty),
      recipe.noHeat ? h('span', { class: 'chip chip-sm' }, icon('check', 18), COPY.noHeat) : null,
      recipe.adultHelp === 'needed' ? null : adultHelpTag(recipe.adultHelp),
    ),
    recipe.adultHelp === 'needed' ? adultHelpTag('needed') : null,
    ...allergenBlock(recipe),
    actions,
    body,
  );

  return {
    el, start,
    setUnits(next) {
      if (next === units) return;
      units = next;
      unitButtons.forEach((b, i) => b.setAttribute('aria-pressed', String((i === 0 ? 'us' : 'metric') === units)));
      ingredients.refresh();
    },
  };
}

// ───────────────────────────────────────────────────────── Step Mode

interface TimerState { readonly totalMs: number; elapsed: number; startedAt: number | null; rang: boolean }

interface StepModeHandle {
  readonly el: HTMLElement;
  focusTitle(): void;
  destroy(): void;
}

const ADVANCE_MS = { full: 650, calm: 280 } as const;

function stepMode(ctx: AppContext, meta: HolidayMeta, recipe: Recipe, close: () => void): StepModeHandle {
  const steps = withTasteTest<Step>(recipe.steps, (text) => ({ text }));
  const total = steps.length;
  const timers = new Map<number, TimerState>();
  const doneSteps = new Set<number>();
  let index = 0;
  let busy = false;
  let finished = false;
  let advance = 0;
  let ticker = 0;
  let confetti: EffectLayer | null = null;
  let stopMotion: (() => void) | null = null;

  const titleId = `sm-title-${recipe.id}`;
  const title = h('h1', { class: 'stepmode-title', id: titleId, tabindex: -1 },
    h('span', { class: 'emoji', 'aria-hidden': 'true' }, recipe.emoji), ' ', recipe.title);
  const count = h('span', { class: 'stepmode-count' });
  const bar = h('i', {});
  const progress = h('div', {
    class: 'stepmode-progress', role: 'progressbar', 'aria-label': 'Steps done', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': 0,
  }, bar);
  const head = h('div', { class: 'stepmode-head sm-head sky' },
    h('button', { class: 'btn btn-icon btn-secondary', type: 'button', 'aria-label': COPY.close, onclick: close }, icon('close', 22)),
    h('div', { class: 'grow sm-titles' }, h('p', { class: 'sm-kicker' }, `${meta.name} · Step mode`), title),
    h('button', { class: 'btn btn-icon btn-secondary', type: 'button', 'aria-label': COPY.printRecipe, onclick: () => window.print() }, icon('print', 22)),
    h('div', { class: 'sm-progress-row' }, progress, count),
  );
  const body = h('div', { class: 'stepmode-body' });
  const back = h('button', { class: 'btn btn-secondary btn-lg', type: 'button', onclick: () => go(index - 1) }, icon('arrowLeft', 22), COPY.back);
  const nextLabel = h('span', {});
  const next = h('button', { class: 'btn btn-lg sm-next', type: 'button', onclick: () => complete() }, nextLabel, icon('check', 22));
  const nav = h('div', { class: 'stepmode-nav' }, back, next);
  const el = h('div', { class: 'stepmode', role: 'dialog', 'aria-modal': 'true', 'aria-labeledby': titleId }, head, body, nav);

  const calm = (): boolean => ctx.motion !== 'full';

  // ── timers: wall-clock arithmetic, so a backgrounded tab still finishes on time ──
  const timerOf = (i: number): TimerState | null => {
    const minutes = steps[i]?.timerMinutes;
    if (!minutes) return null;
    let t = timers.get(i);
    if (!t) { t = { totalMs: minutes * 60_000, elapsed: 0, startedAt: null, rang: false }; timers.set(i, t); }
    return t;
  };
  const elapsedOf = (t: TimerState, now: number): number => t.elapsed + (t.startedAt === null ? 0 : now - t.startedAt);
  let timerButton: HTMLButtonElement | null = null;
  let timerText: HTMLElement | null = null;
  let timerSub: HTMLElement | null = null;

  const paintTimer = (): void => {
    const t = timerOf(index);
    if (!t || !timerButton || !timerText || !timerSub) return;
    const view = timerView(t.totalMs, elapsedOf(t, Date.now()));
    timerButton.style.setProperty('--p', view.progress.toFixed(4));
    timerButton.classList.toggle('is-done', t.rang);
    timerText.textContent = view.label;
    timerSub.textContent = t.rang ? COPY.timerDone : t.startedAt !== null ? 'Tap to pause' : view.progress > 0 ? 'Paused · tap to go' : 'Tap to start';
    timerButton.setAttribute('aria-label', t.rang
      ? `${COPY.timerDone}. Tap to reset the timer.`
      : t.startedAt !== null ? `Timer running, ${timerWords(view.remainingMs)}. Tap to pause.` : `Start ${minutesToText(t.totalMs / 60_000)} timer`);
  };

  const tick = (): void => {
    const now = Date.now();
    let running = false;
    for (const [i, t] of timers) {
      if (t.startedAt === null) continue;
      if (elapsedOf(t, now) >= t.totalMs) {
        t.elapsed = t.totalMs;
        t.startedAt = null;
        t.rang = true;
        // No sound, ever: a buzz where the device can, and words on screen.
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate([300, 120, 300]);
        ctx.toast(COPY.timerDone, '⏰');
        ctx.announce(`${COPY.timerDone} (${fmt('stepOf', { n: i + 1, of: total })})`);
      } else {
        running = true;
      }
    }
    paintTimer();
    if (!running && ticker) { window.clearInterval(ticker); ticker = 0; }
  };

  const toggleTimer = (): void => {
    const t = timerOf(index);
    if (!t) return;
    const now = Date.now();
    if (t.rang) { t.rang = false; t.elapsed = 0; t.startedAt = null; }
    else if (t.startedAt === null) {
      t.startedAt = now;
      ctx.announce(`Timer started: ${minutesToText(t.totalMs / 60_000)}`);
      if (!ticker) ticker = window.setInterval(tick, 250);
    } else { t.elapsed += now - t.startedAt; t.startedAt = null; }
    paintTimer();
  };

  // ── rendering ──
  const paintProgress = (): void => {
    bar.style.setProperty('--p', `${Math.round((doneSteps.size / total) * 100)}%`);
    progress.setAttribute('aria-valuenow', String(doneSteps.size));
    count.textContent = fmt('stepOf', { n: index + 1, of: total });
  };

  const render = (): void => {
    const step = steps[index];
    if (!step) return;
    const last = index === total - 1;
    timerButton = null; timerText = null; timerSub = null;
    const t = timerOf(index);
    if (t) {
      timerText = h('span', { class: 'timer-text' });
      timerSub = h('span', { class: 'timer-sub' });
      timerButton = h('button', { class: 'timer timer-btn', type: 'button', onclick: toggleTimer },
        h('span', { class: 'timer-ring' }, icon('timer', 22), timerText, timerSub));
    }
    body.replaceChildren();
    append(body, [
      h('div', { class: 'stepmode-num', 'aria-hidden': 'true' }, String(index + 1)),
      h('p', { class: 'stepmode-step' }, step.text),
      hazardChips(step.hazards, step.adult === true, 'stepmode-hazards'),
      step.tip ? h('p', { class: 'step-tip sm-tip' }, h('span', { 'aria-hidden': 'true' }, '💡 '), step.tip) : null,
      timerButton,
      h('div', { class: doneSteps.has(index) ? 'stamp is-stamped' : 'stamp', 'aria-hidden': 'true' }, COPY.done),
    ]);
    paintTimer();
    back.disabled = index === 0;
    nextLabel.textContent = last ? COPY.iMadeIt : COPY.done;
    paintProgress();
  };

  const go = (i: number): void => {
    if (finished || i < 0 || i >= total || i === index) return;
    window.clearTimeout(advance);
    busy = false;
    index = i;
    render();
    const step = steps[index];
    ctx.announce(`${fmt('stepOf', { n: index + 1, of: total })}. ${step?.adult ? 'Grown-up step. ' : ''}${step?.text ?? ''}`);
  };

  const stamp = (): void => {
    const s = body.querySelector<HTMLElement>('.stamp');
    if (!s) return;
    s.classList.remove('is-stamped');
    void s.offsetWidth; // restart the slam animation
    s.classList.add('is-stamped');
  };

  const complete = (): void => {
    if (busy || finished) return;
    doneSteps.add(index);
    stamp();
    paintProgress();
    busy = true;
    const last = index === total - 1;
    advance = window.setTimeout(() => {
      busy = false;
      if (last) finish(); else go(index + 1);
    }, calm() ? ADVANCE_MS.calm : ADVANCE_MS.full);
  };

  const finish = (): void => {
    finished = true;
    // "I made it!" finishes the recipe, even when some steps were skipped with the arrows: the bar fills up.
    for (let i = 0; i < total; i++) doneSteps.add(i);
    ctx.store.markRecipeDone(meta.id, recipe.id);
    ctx.toast(COPY.iMadeIt, recipe.emoji);
    ctx.checkBadges();
    const have = Math.min(ctx.store.progress.recipesDone.length, BADGE_THRESHOLDS.littleChefRecipes);
    const need = BADGE_THRESHOLDS.littleChefRecipes;
    const chef = BADGES['little-chef'];
    const canvas = h('canvas', { class: 'stepmode-canvas', 'aria-hidden': 'true' });
    const meterFill = h('i', {});
    meterFill.style.setProperty('--p', `${Math.round((have / need) * 100)}%`);
    body.classList.add('stepmode-finish', 'sky');
    body.replaceChildren(canvas, h('div', { class: 'finish-inner' },
      h('span', { class: 'recipe-emoji finish-emoji', 'aria-hidden': 'true' }, recipe.emoji),
      h('h2', { class: 'h1' }, 'You made it!'),
      h('p', { class: 'lead' }, recipe.title),
      h('div', { class: 'chef-meter' },
        h('span', { class: 'chef-meter-hat', 'aria-hidden': 'true' }, icon('chefHat', 28)),
        h('div', { class: 'grow' },
          h('p', { class: 'chef-meter-label' }, have >= need ? `${chef.emoji} ${chef.name} badge: it's yours!` : `${chef.name}: ${have} of ${need} recipes`),
          h('div', { class: 'meter', role: 'progressbar', 'aria-label': chef.name, 'aria-valuemin': 0, 'aria-valuemax': need, 'aria-valuenow': have }, meterFill),
        ),
      ),
    ));
    nav.replaceChildren(
      h('button', { class: 'btn btn-secondary btn-lg', type: 'button', onclick: restart }, icon('shuffle', 22), 'Make it again'),
      h('button', { class: 'btn btn-lg', type: 'button', onclick: close }, icon('home', 22), `Back to ${meta.name}`),
    );
    paintProgress();
    count.textContent = COPY.iMadeIt;
    ctx.announce(`You made it! ${recipe.title}.`);
    // The confetti finish: a burst on top of the holiday's own colors (one still frame when motion is calm).
    confetti = new EffectLayer(canvas, body, { seed: 7 });
    confetti.setMotion(ctx.motion);
    confetti.setEffect('confetti', { density: 1.5 }, THEMES[meta.theme]);
    confetti.start();
    confetti.burst(body.clientWidth / 2, body.clientHeight * 0.35);
    stopMotion = ctx.onMotionChange((mode) => confetti?.setMotion(mode));
  };

  function restart(): void {
    stopMotion?.(); stopMotion = null;
    confetti?.destroy(); confetti = null;
    finished = false;
    doneSteps.clear();
    index = 0;
    body.classList.remove('stepmode-finish', 'sky');
    nav.replaceChildren(back, next);
    render();
    title.focus({ preventScroll: true });
  }

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (finished || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') go(index + 1);
    else if (e.key === 'ArrowLeft') go(index - 1);
  };
  document.addEventListener('keydown', onKey);
  const releaseTrap = trapFocus(el);
  render();

  return {
    el,
    focusTitle: () => {
      if (!el.contains(document.activeElement)) title.focus({ preventScroll: true });
    },
    destroy: () => {
      document.removeEventListener('keydown', onKey);
      releaseTrap();
      window.clearTimeout(advance);
      if (ticker) window.clearInterval(ticker);
      stopMotion?.();
      confetti?.destroy();
      confetti = null;
    },
  };
}

// ───────────────────────────────────────────────────────── the Step Mode route

function missingRecipe(meta: HolidayMeta): HTMLElement {
  return h('section', { class: 'placeholder' },
    h('div', { class: 'card card-pad stack center' },
      mascot('curious', 110),
      h('h1', { class: 'h1' }, 'That recipe is hiding'),
      h('p', { class: 'lead' }, `We can't find it, but ${meta.name} has other things to make.`),
      h('a', { class: 'btn', href: formatRoute({ view: 'holiday', id: meta.id, section: 'make' }) }, icon('back', 20), meta.name),
    ),
  );
}

function loadingOverlay(meta: HolidayMeta): HTMLElement {
  return h('div', { class: 'stepmode', role: 'dialog', 'aria-modal': 'true', 'aria-labeledby': 'sm-loading-title' },
    h('div', { class: 'stepmode-head sm-head sky' }, h('p', { class: 'sm-kicker grow' }, meta.name)),
    h('div', { class: 'stepmode-body' }, mascot('curious', 110), h('h1', { class: 'stepmode-title', id: 'sm-loading-title', tabindex: -1 }, 'Getting the kitchen ready…')),
    h('div', { class: 'stepmode-nav' }),
  );
}

export const recipeView: ViewFactory<'recipe'> = (ctx, route): ViewInstance => {
  const meta = ctx.metaOf(route.id);
  if (!meta) {
    ctx.setTheme(null);
    return { el: h('section', { class: 'placeholder' }, h('div', { class: 'card card-pad stack center' },
      mascot('curious', 110), h('h1', { class: 'h1' }, 'That holiday is hiding'), h('p', { class: 'lead' }, COPY['error.holiday']),
      h('a', { class: 'btn', href: formatRoute({ view: 'parade' }) }, icon('all', 20), 'All holidays'))) };
  }
  ctx.setTheme(THEMES[meta.theme]);
  const fromPage = takeStepModeOpener(meta.id, route.recipeId, Date.now());
  const root = document.documentElement;
  const el = h('div', { class: 'stepmode-page' });
  let mode: StepModeHandle | null = null;
  let destroyed = false;
  let closing = false;

  const close = (): void => {
    if (closing || destroyed) return;
    closing = true;
    if (fromPage) history.back();
    else ctx.router.navigate({ view: 'holiday', id: meta.id, section: 'make' }, { replace: true });
  };

  const show = (content: HolidayContent): void => {
    if (destroyed) return;
    const recipe = content.recipes.find((r) => r.id === route.recipeId);
    if (!recipe) {
      root.classList.remove('is-stepmode');
      el.replaceChildren(missingRecipe(meta));
      return;
    }
    const printable = recipeCard(recipe, { holidayId: meta.id, units: ctx.units, onUnits: (u) => ctx.store.setUnits(u), print: true });
    mode = stepMode(ctx, meta, recipe, close);
    el.replaceChildren(h('div', { class: 'stepmode-under' }, printable.el), mode.el);
    root.classList.add('is-stepmode');
    // After the router has settled (it focuses the view's h1 on navigation; nothing does on a deep link).
    window.setTimeout(() => mode?.focusTitle(), 0);
  };

  const cached = cachedContent(meta.id);
  if (cached) show(cached);
  else {
    el.append(loadingOverlay(meta));
    root.classList.add('is-stepmode');
    contentFor(meta).then(show, () => {
      if (destroyed) return;
      root.classList.remove('is-stepmode');
      el.replaceChildren(missingRecipe(meta));
    });
  }

  return {
    el,
    destroy: () => {
      destroyed = true;
      mode?.destroy();
      mode = null;
      root.classList.remove('is-stepmode');
      setReturnFocus(meta.id, route.recipeId, Date.now());
      ctx.setTheme(null);
    },
  };
};
