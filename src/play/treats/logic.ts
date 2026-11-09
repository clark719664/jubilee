/**
 * logic.ts — Trick-or-Treat Street's rules, with no DOM: who answers the door, which two treats they
 * offer, and the bag. Nothing here can go wrong: there are no points against the child, no timer, and
 * the bag never fills up for good.
 */
import { plural } from '../../i18n/index';
export interface Treat {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
}

export const TREATS: readonly Treat[] = [
  { id: 'candy', name: 'Candy', emoji: '🍬' }, { id: 'lolly', name: 'Lollipop', emoji: '🍭' }, { id: 'choc', name: 'Chocolate', emoji: '🍫' },
  { id: 'cookie', name: 'Cookie', emoji: '🍪' }, { id: 'cupcake', name: 'Cupcake', emoji: '🧁' }, { id: 'apple', name: 'Toffee apple', emoji: '🍎' },
  { id: 'popcorn', name: 'Popcorn', emoji: '🍿' }, { id: 'donut', name: 'Doughnut', emoji: '🍩' },
];

export interface Visitor {
  readonly id: string;
  readonly name: string;
  /** What they say at the door. */
  readonly line: string;
  /** What they say when a treat is picked. */
  readonly thanks: string;
}

export const VISITORS: readonly Visitor[] = [
  { id: 'ghost', name: 'a friendly ghost', line: 'Boo! …I mean, happy Halloween!', thanks: 'Ooh, good pick! Wooo-hoo!' },
  { id: 'witch', name: 'a kind witch', line: 'Happy Halloween, dearie! Pick a treat!', thanks: 'Hee hee! Enjoy it!' },
  { id: 'cat', name: 'a black cat', line: 'Meow! I mean… trick or treat!', thanks: 'Purrrr-fect choice!' },
  { id: 'bat', name: 'a fluffy bat', line: 'Squeak! Happy Halloween!', thanks: 'Flap-tastic!' },
  { id: 'mummy', name: 'a cozy mummy', line: 'Unwrap a treat, little one!', thanks: 'Wrap it up and enjoy!' },
  { id: 'kid', name: 'a pumpkin kid', line: 'I love your costume! Pick one!', thanks: 'Yum! That’s my favorite too!' },
];

export const HOUSES = 6;

export function pickVisitor(rand: () => number, last: string | null): Visitor {
  const pool = VISITORS.filter((v) => v.id !== last);
  return pool[Math.floor(rand() * pool.length) % pool.length]!;
}

/** Two different treats to choose between. */
export function pickOffer(rand: () => number): readonly [Treat, Treat] {
  const a = Math.floor(rand() * TREATS.length) % TREATS.length;
  let b = Math.floor(rand() * (TREATS.length - 1)) % (TREATS.length - 1);
  if (b >= a) b += 1;
  return [TREATS[a]!, TREATS[b]!];
}

export type Bag = Readonly<Record<string, number>>;

export const addToBag = (bag: Bag, id: string): Bag => ({ ...bag, [id]: (bag[id] ?? 0) + 1 });

export const bagTotal = (bag: Bag): number => Object.values(bag).reduce((n, v) => n + v, 0);

/** The bag sorted for counting: most first, ties in treat order. */
export function bagSummary(bag: Bag): readonly { readonly treat: Treat; readonly count: number }[] {
  return TREATS.filter((t) => (bag[t.id] ?? 0) > 0)
    .map((t) => ({ treat: t, count: bag[t.id]! }))
    .sort((a, b) => b.count - a.count);
}

/** "You have 7 treats!" in words a counting game can read out. */
export function countLine(total: number): string {
  if (total === 0) return 'Your bag is empty. Knock on a door!';
  return plural(total, { one: 'You have {n} treat!', other: 'You have {n} treats!' });
}

/** A cheer at a few round numbers (never a limit). */
export function milestone(total: number): string | null {
  if (total === 5) return 'High five! 5 treats!';
  if (total === 10) return 'Wow, 10 treats! Your bag is getting heavy!';
  if (total === 20) return '20 treats! You are the best trick-or-treater!';
  return null;
}
