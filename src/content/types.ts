import type { DateRule, HolidayId, ObservedShift, Region } from '../dates/rules';
import type { TableId } from '../dates/tables/types';
import type { EffectId, EffectParams } from '../effects/types';
import type { ThemeId } from '../theme/themes';

export type { HolidayId };

export type Tier = 1 | 2 | 3;
export type Tag = 'lights' | 'sweets' | 'spooky' | 'spring' | 'silly' | 'family' | 'national' | 'faith' | 'harvest' | 'new-year' | 'world';
export const TAGS: readonly Tag[] = ['lights', 'sweets', 'spooky', 'spring', 'silly', 'family', 'national', 'faith', 'harvest', 'new-year', 'world'];

export type Tradition = 'christian' | 'orthodox' | 'jewish' | 'muslim' | 'hindu' | 'sikh' | 'buddhist' | 'east-asian' | 'persian' | 'mexican' | 'african-american' | 'irish' | 'secular' | 'civic';

export type Allergen = 'milk' | 'egg' | 'wheat' | 'gluten' | 'peanut' | 'tree-nut' | 'soy' | 'sesame' | 'fish' | 'shellfish';
export const ALLERGENS: readonly Allergen[] = ['milk', 'egg', 'wheat', 'gluten', 'peanut', 'tree-nut', 'soy', 'sesame', 'fish', 'shellfish'];

export type Hazard = 'heat' | 'sharp' | 'hot-liquid' | 'electric' | 'small-parts' | 'hot-glue' | 'raw-egg' | 'choking' | 'candle';
export type AdultHelp = 'none' | 'some' | 'needed';
export type Unit = 'cup' | 'tbsp' | 'tsp' | 'oz' | 'lb' | 'g' | 'ml' | 'piece' | 'pinch' | 'slice' | 'can' | 'sheet';

export interface Measure { readonly qty: number; readonly unit: Unit }

export interface Ingredient {
  readonly item: string;
  /** One of `us` / `metric` is enough; the other is derived by format.ts. */
  readonly us?: Measure;
  readonly metric?: Measure;
  readonly note?: string;
  readonly optional?: boolean;
  readonly allergens?: readonly Allergen[];
}

export interface Step {
  readonly text: string;
  readonly adult?: boolean;
  readonly hazards?: readonly Hazard[];
  readonly timerMinutes?: number;
  readonly tip?: string;
  /** Reason the hazard-keyword lint may ignore this step (e.g. "scissors" in a figure of speech). */
  readonly kidSafeOverride?: string;
}

export interface Recipe {
  readonly id: string;
  readonly title: string;
  readonly emoji: string;
  readonly blurb: string;
  readonly minutes: number;
  readonly serves: number;
  readonly difficulty: 1 | 2 | 3;
  readonly adultHelp: AdultHelp;
  readonly noHeat: boolean;
  /** REQUIRED; [] is a positive statement ("no major allergens"). */
  readonly allergens: readonly Allergen[];
  readonly mayContain?: readonly Allergen[];
  readonly swaps?: readonly { readonly avoid: Allergen; readonly use: string }[];
  /** Required when ingredients include whole nuts, popcorn, hard candy, grapes or marshmallows. */
  readonly chokingNote?: string;
  readonly equipment: readonly string[];
  readonly ingredients: readonly Ingredient[];
  readonly steps: readonly Step[];
  readonly tip?: string;
}

export interface Material { readonly item: string; readonly qty?: string; readonly optional?: boolean; readonly substitute?: string }

export interface Craft {
  readonly id: string;
  readonly title: string;
  readonly emoji: string;
  readonly blurb: string;
  readonly minutes: number;
  /** 1 = tidy, 3 = very messy. */
  readonly mess: 1 | 2 | 3;
  readonly adultHelp: AdultHelp;
  readonly hazards: readonly Hazard[];
  readonly materials: readonly Material[];
  readonly steps: readonly Step[];
  readonly learn?: string;
}

export interface Fact {
  readonly text: string;
  readonly wow?: boolean;
  /** 9–12 wording. */
  readonly bigKids?: boolean;
}

export interface Greeting {
  /** BCP-47, e.g. 'hi', 'zh-Hans', 'yue'. */
  readonly lang: string;
  readonly langName: string;
  /** Native script. */
  readonly text: string;
  /** Romanisation; required when `text` is not Latin script. */
  readonly roman?: string;
  /** Kid respelling: "nah-mas-TAY". */
  readonly sayIt: string;
  readonly meaning: string;
}

export interface Sticker {
  readonly id: string;
  readonly emoji: string;
  readonly label: string;
  /** Trusted inline SVG, bundled with the app. */
  readonly svg?: string;
}

export interface AdventDoor { readonly day: number; readonly kind: 'fact' | 'craft' | 'joke'; readonly text: string }

/**
 * Countdown door behind one of the last sleeps before a holiday (Christmas keeps its 24 advent doors).
 * `sleeps` is how many sleeps before the main day the door opens (12 … 1). 'say' teaches a greeting
 * (text is the instruction; the greeting itself comes from `greetings[greeting]`); 'seek' and 'color'
 * open the scene's Seek & Find or the holiday's coloring page.
 */
export type DoorKind = 'fact' | 'joke' | 'craft' | 'say' | 'seek' | 'color';
export interface CountdownDoor {
  readonly sleeps: number;
  readonly kind: DoorKind;
  readonly text: string;
  /** Index into `greetings` for 'say' doors. */
  readonly greeting?: number;
}

export interface HolidayMeta {
  readonly id: HolidayId;
  readonly name: string;
  readonly alsoCalled?: readonly string[];
  readonly emoji: string;
  readonly tagline: string;
  readonly tier: Tier;
  readonly tags: readonly Tag[];
  readonly traditions: readonly Tradition[];
  /** undefined = everywhere. */
  readonly regions?: readonly Region[];
  readonly rule: DateRule;
  /** Negative: the span starts before the rule's anchor (Diwali −2). */
  readonly startOffset?: number;
  /** Default 1. Ramadan = until the next eid-al-fitr row (exclusive). */
  readonly days?: number | { readonly untilTable: TableId };
  /** Default 0. Index of the headline day within the span. */
  readonly mainDayOffset?: number;
  /** Prepends the eve to the span. */
  readonly beginsAtSundown?: boolean;
  /** Length = span length when present. */
  readonly dayNames?: readonly string[];
  /** Default 'none'. */
  readonly observedShift?: ObservedShift;
  /** Same-day tie-break, default 0 (faith/national 10, family 5, silly −10). */
  readonly priority?: number;
  readonly theme: ThemeId;
  readonly effect: EffectId;
  readonly effectParams?: EffectParams;
  readonly sticker: Sticker;
}

export interface HolidayContent {
  /** 1 sentence (tier 3) / 2–4 (tier 2) / 3–5 (tier 1); kid-level, present tense. */
  readonly story: readonly string[];
  readonly facts: readonly Fact[];
  readonly greetings: readonly Greeting[];
  readonly recipes: readonly Recipe[];
  readonly crafts: readonly Craft[];
  /** Christmas only, exactly 24. */
  readonly advent?: readonly AdventDoor[];
  /** Tier-1 holidays except Christmas: 12 countdown doors, sleeps 12..1, one per sleep. */
  readonly doors?: readonly CountdownDoor[];
  readonly parentNote?: string;
  /** Plain-text citations, no URLs. */
  readonly sources?: readonly string[];
}

export type ContentLoader = () => Promise<HolidayContent>;

export interface CustomHoliday {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly month: number;
  readonly day: number;
  readonly year?: number;
}
