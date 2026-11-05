import { describe, expect, it } from 'vitest';
import { CHOKING_WORDS, HAZARD_WORDS, allergensIn } from '../src/content/allergens';
import { CONTENT_LOADERS, hasContent, loadContent } from '../src/content/loader';
import { HOLIDAYS, HOLIDAY_IDS, SPAN_LENGTH, byId, priorityFor, silly, tier1, tier2 } from '../src/content/registry';
import { SILLY_CONTENT } from '../src/content/silly';
import type { Craft, Greeting, Hazard, HolidayContent, HolidayMeta, Recipe, Step, Tag } from '../src/content/types';
import { REGIONS, type DateRule } from '../src/dates/rules';
import type { TableId } from '../src/dates/tables/types';
import { EFFECT_IDS } from '../src/effects/types';
import { THEMES } from '../src/theme/themes';

// ───────── fixtures ─────────

// The TableId list is kept here as a const so this test never imports src/dates/tables/index.ts (another lane's file).
// `satisfies Record<TableId, true>` makes tsc fail if the TableId union and this list ever drift apart.
const TABLE_IDS = Object.keys({
  'lunar-new-year': true, 'mid-autumn': true, 'dragon-boat': true, diwali: true, holi: true,
  'rosh-hashanah': true, hanukkah: true, passover: true, purim: true,
  'ramadan-start': true, 'eid-al-fitr': true, 'eid-al-adha': true, nowruz: true,
} satisfies Record<TableId, true>) as readonly TableId[];

/** Every content file that exists today, keyed by holiday id (file name). `_`-prefixed files are templates/drafts. */
const FILES = import.meta.glob<{ default: HolidayContent }>('../src/content/holidays/*.ts', { eager: true });
const CONTENT = new Map<string, HolidayContent>();
for (const [path, mod] of Object.entries(FILES)) {
  const file = path.split('/').pop() ?? '';
  if (file.startsWith('_')) continue;
  CONTENT.set(file.replace(/\.ts$/, ''), mod.default);
}

const URL_WORDS = /http|www\.|\.com/i;
const LANG_TAG = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;
// Spec §13 regex verbatim; the \u0000 range start is what trips no-control-regex.
// eslint-disable-next-line no-control-regex
const NON_LATIN = /[^\u0000-ɏḀ-ỿ\s\p{P}\p{N}]/u;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ENDS_SENTENCE = /[.!?…]['"”’)]?$/;
/** "…end. Next" inside one story element means two sentences were squeezed into one slot (Dr./Jr./St. etc. excused). */
const MID_SENTENCE_BREAK = /(?<!\b(?:Dr|Mr|Mrs|Ms|St|Jr|Sr|Mt|No|vs))[.!?]['"”’)]?\s+[A-Z¡¿]/;
/** Step Mode ends on the taste test (spec §9.8); content owns the line so it can add a flourish after it. */
const TASTE_TEST = /^taste test!/i;
const HOT: readonly Hazard[] = ['heat', 'hot-liquid', 'electric'];
const ADULT_ONLY: readonly Hazard[] = ['heat', 'sharp', 'hot-liquid', 'electric'];

/** Visit every string in an object graph with a readable path, so a failure says where the offending text lives. */
function walkStrings(value: unknown, visit: (s: string, path: string) => void, path = '$'): void {
  if (typeof value === 'string') visit(value, path);
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, visit, `${path}[${i}]`));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) walkStrings(v, visit, `${path}.${k}`);
  }
}

function* leafRules(rule: DateRule): Generator<DateRule> {
  if (rule.kind === 'byRegion') {
    for (const v of Object.values(rule.variants)) if (v) yield* leafRules(v);
    yield* leafRules(rule.fallback);
  } else yield rule;
}

function expectedPriority(tags: readonly Tag[]): number {
  if (tags.includes('faith') || tags.includes('national')) return 10;
  if (tags.includes('family')) return 5;
  return tags.includes('silly') ? -10 : 0;
}

function stepOk(step: Step): boolean {
  return step.adult === true || (step.hazards?.length ?? 0) > 0 || typeof step.kidSafeOverride === 'string';
}

function lintSteps(steps: readonly Step[], label: string): void {
  expect(steps.length, `${label}: needs steps`).toBeGreaterThan(0);
  for (const [i, step] of steps.entries()) {
    const at = `${label} step ${i + 1}`;
    expect(step.text.trim().length, `${at}: empty text`).toBeGreaterThan(0);
    if (HAZARD_WORDS.test(step.text)) expect(stepOk(step), `${at}: mentions a hazard word; needs adult, hazards or kidSafeOverride`).toBe(true);
    if (step.timerMinutes !== undefined) expect(step.timerMinutes, `${at}: timerMinutes`).toBeGreaterThan(0);
  }
}

function lintGreeting(g: Greeting, label: string): void {
  expect(g.lang, `${label}: lang tag`).toMatch(LANG_TAG);
  for (const key of ['langName', 'text', 'sayIt', 'meaning'] as const) expect(g[key].trim().length, `${label}: ${key}`).toBeGreaterThan(0);
  if (NON_LATIN.test(g.text)) expect(typeof g.roman, `${label}: non-Latin text needs roman`).toBe('string');
}

function lintRecipe(r: Recipe, label: string): void {
  expect(r.id, `${label}: id`).toMatch(KEBAB);
  expect(Array.isArray(r.allergens), `${label}: allergens must be an array ([] is fine)`).toBe(true);
  expect(r.minutes, `${label}: minutes`).toBeGreaterThan(0);
  expect(r.serves, `${label}: serves`).toBeGreaterThan(0);
  expect(r.equipment.length, `${label}: equipment`).toBeGreaterThan(0);
  expect(r.ingredients.length, `${label}: ingredients`).toBeGreaterThan(0);
  const declared = new Set([...r.allergens, ...(r.mayContain ?? [])]);
  let chokingRisk = false;
  for (const ing of r.ingredients) {
    const text = `${ing.item} ${ing.note ?? ''}`;
    for (const a of allergensIn(text)) expect(declared.has(a), `${label}: "${ing.item}" suggests ${a}; declare it in allergens or mayContain`).toBe(true);
    for (const a of ing.allergens ?? []) expect(declared.has(a), `${label}: "${ing.item}" lists ${a} but the recipe does not`).toBe(true);
    expect(ing.us !== undefined || ing.metric !== undefined, `${label}: "${ing.item}" needs a us or metric measure`).toBe(true);
    for (const m of [ing.us, ing.metric]) if (m) expect(m.qty, `${label}: "${ing.item}" qty`).toBeGreaterThan(0);
    if (CHOKING_WORDS.test(text)) chokingRisk = true;
  }
  if (chokingRisk) expect(typeof r.chokingNote, `${label}: choking-risk ingredient needs chokingNote`).toBe('string');
  lintSteps(r.steps, label);
  for (const [i, step] of r.steps.entries()) {
    const at = `${label} step ${i + 1}`;
    if (step.hazards?.some((h) => ADULT_ONLY.includes(h))) expect(step.adult, `${at}: heat/sharp/hot-liquid/electric steps are adult steps`).toBe(true);
    if (r.noHeat) expect(step.hazards?.some((h) => HOT.includes(h)) ?? false, `${at}: noHeat recipe has a heat hazard`).toBe(false);
  }
  if (r.noHeat) expect(r.adultHelp, `${label}: noHeat recipes never need a grown-up for everything`).not.toBe('needed');
  const lastStep = r.steps[r.steps.length - 1];
  expect(lastStep?.text ?? '', `${label}: the last step must start with "Taste test!"`).toMatch(TASTE_TEST);
  for (const [i, step] of r.steps.slice(0, -1).entries()) expect(TASTE_TEST.test(step.text), `${label} step ${i + 1}: only the last step is the taste test`).toBe(false);
}

function lintCraft(c: Craft, label: string): void {
  expect(c.id, `${label}: id`).toMatch(KEBAB);
  expect(Array.isArray(c.hazards), `${label}: hazards must be an array`).toBe(true);
  expect(c.minutes, `${label}: minutes`).toBeGreaterThan(0);
  expect([1, 2, 3]).toContain(c.mess);
  expect(c.materials.length, `${label}: materials`).toBeGreaterThan(0);
  const materials = c.materials.map((m) => m.item).join(' ');
  if (/scissors|craft knife|needle/i.test(materials)) expect(c.hazards, `${label}: scissors ⇒ 'sharp'`).toContain('sharp');
  if (/hot glue/i.test(materials)) expect(c.hazards, `${label}: hot glue ⇒ 'hot-glue'`).toContain('hot-glue');
  lintSteps(c.steps, label);
  if (c.steps.some((s) => (s.hazards?.length ?? 0) > 0) || c.hazards.length > 0) expect(c.adultHelp, `${label}: hazards need adultHelp`).not.toBe('none');
}

function lintStory(story: readonly string[], min: number, max: number, label: string): void {
  expect(story.length, `${label}: story sentences`).toBeGreaterThanOrEqual(min);
  expect(story.length, `${label}: story sentences`).toBeLessThanOrEqual(max);
  for (const [i, s] of story.entries()) {
    expect(s.length, `${label}: story[${i}] length`).toBeGreaterThan(0);
    expect(s.length, `${label}: story[${i}] ≤ 260 chars`).toBeLessThanOrEqual(260);
    expect(s, `${label}: story[${i}] must end with punctuation`).toMatch(ENDS_SENTENCE);
    expect(MID_SENTENCE_BREAK.test(s), `${label}: story[${i}] holds more than one sentence`).toBe(false);
  }
}

function lintNoUrls(value: unknown, label: string): void {
  walkStrings(value, (s, path) => expect(URL_WORDS.test(s), `${label} ${path}: contains http / www. / .com`).toBe(false));
}

function lintCommon(c: HolidayContent, meta: HolidayMeta): void {
  const label = meta.id;
  for (const [i, f] of c.facts.entries()) {
    expect(f.text.trim().length, `${label}: facts[${i}]`).toBeGreaterThan(0);
    expect(f.text.length, `${label}: facts[${i}] ≤ 300 chars`).toBeLessThanOrEqual(300);
  }
  for (const [i, g] of c.greetings.entries()) lintGreeting(g, `${label} greetings[${i}]`);
  for (const [i, r] of c.recipes.entries()) lintRecipe(r, `${label} recipe "${r.id}"[${i}]`);
  for (const [i, k] of c.crafts.entries()) lintCraft(k, `${label} craft "${k.id}"[${i}]`);
  expect(new Set(c.recipes.map((r) => r.id)).size, `${label}: recipe ids unique`).toBe(c.recipes.length);
  expect(new Set(c.crafts.map((k) => k.id)).size, `${label}: craft ids unique`).toBe(c.crafts.length);
  for (const [i, s] of (c.sources ?? []).entries()) {
    expect(s.trim().length, `${label}: sources[${i}]`).toBeGreaterThan(0);
    expect(/:\/\/|[<>]/.test(s), `${label}: sources[${i}] must be plain text`).toBe(false);
  }
  if (meta.id !== 'christmas') expect(c.advent, `${label}: advent is Christmas-only`).toBeUndefined();
  lintNoUrls(c, label);
}

// ───────── registry ─────────

describe('registry', () => {
  it('has 76 metas: 22 tier-1, 30 tier-2, 24 tier-3', () => {
    expect(HOLIDAYS.length).toBe(76);
    expect(tier1().length).toBe(22);
    expect(tier2().length).toBe(30);
    expect(silly().length).toBe(24);
    expect(HOLIDAY_IDS).toEqual(HOLIDAYS.map((m) => m.id));
  });

  it('ids and sticker ids are unique, kebab-case and linked', () => {
    expect(new Set(HOLIDAYS.map((m) => m.id)).size).toBe(HOLIDAYS.length);
    expect(new Set(HOLIDAYS.map((m) => m.sticker.id)).size).toBe(HOLIDAYS.length);
    for (const m of HOLIDAYS) {
      expect(m.id).toMatch(KEBAB);
      expect(m.sticker.id).toBe(`${m.id}-sticker`);
      expect(byId(m.id)).toBe(m);
    }
    expect(byId('nope')).toBeUndefined();
  });

  it.each(HOLIDAYS.map((m) => [m.id, m] as const))('%s: names, tags, theme and effect resolve', (_id, m) => {
    expect(m.name.trim().length).toBeGreaterThan(0);
    expect(m.emoji.trim().length).toBeGreaterThan(0);
    expect(m.tagline.trim().length).toBeGreaterThan(0);
    expect(m.tagline.length, 'tagline ≤ 60 chars').toBeLessThanOrEqual(60);
    expect(m.tags.length).toBeGreaterThan(0);
    expect(m.traditions.length).toBeGreaterThan(0);
    expect(m.sticker.emoji.trim().length).toBeGreaterThan(0);
    expect(m.sticker.label.trim().length).toBeGreaterThan(0);
    expect(Object.keys(THEMES)).toContain(m.theme);
    expect(EFFECT_IDS).toContain(m.effect);
    for (const g of m.effectParams?.glyphs ?? []) expect(g.length).toBeGreaterThan(0);
  });

  it.each(HOLIDAYS.map((m) => [m.id, m] as const))('%s: rule references resolve', (_id, m) => {
    if (m.rule.kind === 'byRegion') for (const r of Object.keys(m.rule.variants)) expect(REGIONS).toContain(r);
    for (const rule of leafRules(m.rule)) {
      switch (rule.kind) {
        case 'fixed':
          expect(rule.month).toBeGreaterThanOrEqual(1); expect(rule.month).toBeLessThanOrEqual(12);
          expect(rule.day).toBeGreaterThanOrEqual(1); expect(rule.day).toBeLessThanOrEqual(31);
          break;
        case 'nthWeekday':
          expect([1, 2, 3, 4]).toContain(rule.n);
          expect(rule.weekday).toBeGreaterThanOrEqual(0); expect(rule.weekday).toBeLessThanOrEqual(6);
          break;
        case 'lastWeekday':
          expect(rule.weekday).toBeGreaterThanOrEqual(0); expect(rule.weekday).toBeLessThanOrEqual(6);
          break;
        case 'relative':
          expect(rule.to).not.toBe(m.id);
          expect(byId(rule.to), `relative.to "${rule.to}"`).toBeDefined();
          break;
        case 'table':
          expect(TABLE_IDS).toContain(rule.table);
          break;
        case 'custom':
          expect(rule.id).toBe('mothers-day-fr');
          break;
        case 'easter':
          expect(['gregorian', 'julian']).toContain(rule.calendar);
          break;
        default:
          throw new Error(`nested byRegion in ${m.id}`);
      }
    }
    if (typeof m.days === 'object') expect(TABLE_IDS).toContain(m.days.untilTable);
  });

  it.each(HOLIDAYS.map((m) => [m.id, m] as const))('%s: span fields agree', (_id, m) => {
    const span = SPAN_LENGTH(m);
    if (m.startOffset !== undefined || m.mainDayOffset !== undefined) expect(m.days, 'days must be explicit with startOffset/mainDayOffset').toBeDefined();
    if (typeof m.days === 'number') expect(m.days).toBeGreaterThanOrEqual(1);
    if (m.dayNames) {
      expect(span, 'dayNames need a numeric span').not.toBe('untilTable');
      expect(m.dayNames.length, 'dayNames.length == span length').toBe(span);
      for (const n of m.dayNames) expect(n.trim().length).toBeGreaterThan(0);
    }
    const main = m.mainDayOffset ?? 0;
    expect(main).toBeGreaterThanOrEqual(0);
    if (typeof span === 'number') expect(main, 'mainDayOffset < span').toBeLessThan(span);
    if (m.startOffset !== undefined) expect(m.startOffset).toBeLessThanOrEqual(0);
  });

  it.each(HOLIDAYS.map((m) => [m.id, m] as const))('%s: regions and priority follow the rules', (_id, m) => {
    if (m.regions) {
      expect(m.regions.length).toBeGreaterThan(0);
      for (const r of m.regions) expect(REGIONS).toContain(r);
    }
    expect(m.priority ?? 0).toBe(expectedPriority(m.tags));
    expect(priorityFor(m.tags)).toBe(expectedPriority(m.tags));
  });

  it('tier-3 silly days are uniform: silly tag, silly theme, confetti glyphs, one day, everywhere', () => {
    for (const m of silly()) {
      expect(m.tags).toEqual(['silly']);
      expect(m.theme).toBe('silly');
      expect(m.effect).toBe('confetti');
      expect(m.effectParams?.glyphs?.length ?? 0).toBeGreaterThan(0);
      expect(m.regions).toBeUndefined();
      expect(SPAN_LENGTH(m)).toBe(1);
    }
  });

  it('spec spans: Hanukkah 9, Passover 9, Rosh Hashanah 3, Purim 2, Diwali 5 (main 2), Chuseok 3 (main 1), Ramadan untilTable', () => {
    const span = (id: string) => SPAN_LENGTH(byId(id)!);
    expect(span('hanukkah')).toBe(9);
    expect(span('passover')).toBe(9);
    expect(span('rosh-hashanah')).toBe(3);
    expect(span('purim')).toBe(2);
    expect(span('diwali')).toBe(5);
    expect(byId('diwali')!.mainDayOffset).toBe(2);
    expect(byId('diwali')!.startOffset).toBe(-2);
    expect(span('chuseok')).toBe(3);
    expect(byId('chuseok')!.mainDayOffset).toBe(1);
    expect(span('ramadan')).toBe('untilTable');
    expect(span('lunar-new-year')).toBe(15);
    expect(span('kwanzaa')).toBe(7);
    expect(span('nowruz')).toBe(13);
  });

  it('metas contain no URLs', () => {
    lintNoUrls(HOLIDAYS, 'registry');
  });
});

// ───────── coverage (expected red until every content author has delivered) ─────────

describe('coverage', () => {
  it.each([...tier1(), ...tier2()].map((m) => [m.id, m.tier] as const))('%s (tier %i) has a content file', (id) => {
    expect(CONTENT.has(id), `missing src/content/holidays/${id}.ts`).toBe(true);
  });
});

// ───────── content files ─────────

describe('content files', () => {
  it('only belong to tier-1/2 holidays', () => {
    for (const id of CONTENT.keys()) {
      const meta = byId(id);
      expect(meta, `orphan content file: ${id}`).toBeDefined();
      expect(meta!.tier, `${id}: tier-3 content lives in silly.ts`).not.toBe(3);
      expect(hasContent(id)).toBe(true);
      expect(CONTENT_LOADERS[id]).toBeDefined();
    }
  });

  const files = [...CONTENT.entries()].map(([id, c]) => [id, c, byId(id)] as const).filter((row): row is readonly [string, HolidayContent, HolidayMeta] => row[2] !== undefined);

  it.each(files)('%s meets its tier requirements', (id, c, meta) => {
    if (meta.tier === 1) {
      lintStory(c.story, 3, 5, id);
      expect(c.facts.length, 'tier-1: 4–6 facts').toBeGreaterThanOrEqual(4);
      expect(c.facts.length, 'tier-1: 4–6 facts').toBeLessThanOrEqual(6);
      expect(c.facts.some((f) => f.wow), 'tier-1: at least one wow fact').toBe(true);
      expect(c.facts.some((f) => f.bigKids), 'tier-1: at least one bigKids fact').toBe(true);
      expect(c.greetings.length, 'tier-1: ≥ 3 greetings').toBeGreaterThanOrEqual(3);
      expect(c.recipes.length, 'tier-1: ≥ 2 recipes').toBeGreaterThanOrEqual(2);
      expect(c.recipes.some((r) => r.noHeat), 'tier-1: ≥ 1 noHeat recipe').toBe(true);
      expect(c.recipes[0]?.noHeat, 'tier-1: the noHeat recipe comes first').toBe(true);
      expect(c.crafts.length, 'tier-1: ≥ 1 craft').toBeGreaterThanOrEqual(1);
    } else {
      lintStory(c.story, 2, 4, id);
      expect(c.facts.length, 'tier-2: 2–3 facts').toBeGreaterThanOrEqual(2);
      expect(c.facts.length, 'tier-2: 2–3 facts').toBeLessThanOrEqual(3);
      expect(c.greetings.length, 'tier-2: ≥ 1 greeting').toBeGreaterThanOrEqual(1);
    }
  });

  it.each(files)('%s passes the recipe, craft, greeting, source and no-URL lint', (_id, c, meta) => {
    lintCommon(c, meta);
  });

  it('every tier-1 holiday except Christmas has countdown doors (Christmas has its advent)', () => {
    for (const meta of HOLIDAYS.filter((m) => m.tier === 1 && m.id !== 'christmas')) {
      expect(CONTENT.get(meta.id)?.doors?.length ?? 0, `${meta.id} has 12 countdown doors`).toBe(12);
    }
  });

  it('countdown doors, where present, are 12 doors for the last 12 sleeps', () => {
    for (const [id, c] of CONTENT) {
      if (!c.doors) continue;
      expect(id, `${id}: doors are for tier-1 holidays other than Christmas`).not.toBe('christmas');
      expect(c.doors.length, `${id}: 12 doors`).toBe(12);
      expect([...c.doors].map((d) => d.sleeps).sort((a, b) => b - a), `${id}: one door per sleep 12..1`).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
      const kinds = new Set(c.doors.map((d) => d.kind));
      expect(kinds.size, `${id}: at least four kinds of door`).toBeGreaterThanOrEqual(4);
      for (const d of c.doors) {
        expect(['fact', 'joke', 'craft', 'say', 'seek', 'colour'], `${id} door ${d.sleeps}`).toContain(d.kind);
        expect(d.text.length, `${id} door ${d.sleeps} text`).toBeGreaterThan(10);
        expect(d.text.length, `${id} door ${d.sleeps} ≤ 240 chars`).toBeLessThanOrEqual(240);
        if (d.kind === 'say') {
          expect(d.greeting, `${id} door ${d.sleeps}: say doors point at a greeting`).toBeDefined();
          expect(c.greetings[d.greeting!], `${id} door ${d.sleeps}: greeting exists`).toBeDefined();
        } else {
          expect(d.greeting, `${id} door ${d.sleeps}: only say doors carry a greeting`).toBeUndefined();
        }
      }
    }
  });

  it('christmas ships 24 advent doors (days 1..24; 12 facts, 8 jokes, 4 crafts)', () => {
    const c = CONTENT.get('christmas');
    if (!c) return; // coverage block reports the missing file
    expect(c.advent).toBeDefined();
    expect(c.advent!.length).toBe(24);
    expect(c.advent!.map((d) => d.day)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    const kinds = { fact: 0, joke: 0, craft: 0 };
    for (const door of c.advent!) {
      expect(door.text.trim().length).toBeGreaterThan(0);
      kinds[door.kind] += 1;
    }
    expect(kinds).toEqual({ fact: 12, joke: 8, craft: 4 });
  });
});

// ───────── silly days (inline content) ─────────

describe('silly content', () => {
  it('covers exactly the 24 tier-3 ids', () => {
    expect(Object.keys(SILLY_CONTENT).sort()).toEqual(silly().map((m) => m.id).sort());
  });

  it.each(silly().map((m) => [m.id, m] as const))('%s: one sentence, one fact, nothing else', (id, meta) => {
    const c = SILLY_CONTENT[id]!;
    lintStory(c.story, 1, 1, id);
    expect(c.facts.length).toBe(1);
    expect(c.greetings).toEqual([]);
    expect(c.recipes).toEqual([]);
    expect(c.crafts).toEqual([]);
    lintCommon(c, meta);
  });

  it('loader serves silly content inline and rejects unknown ids', async () => {
    for (const m of silly()) {
      expect(hasContent(m.id)).toBe(true);
      await expect(loadContent(m.id)).resolves.toBe(SILLY_CONTENT[m.id]);
    }
    expect(hasContent('not-a-holiday')).toBe(false);
    await expect(loadContent('not-a-holiday')).rejects.toThrow(/No content for holiday "not-a-holiday"/);
    expect(hasContent('toString'), 'prototype keys are not content').toBe(false);
  });

  it('loader resolves every content file lazily to the same object the eager glob saw', async () => {
    for (const [id, c] of CONTENT) await expect(loadContent(id)).resolves.toEqual(c);
  });
});
