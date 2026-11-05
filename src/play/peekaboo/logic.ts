/**
 * logic.ts — Peekaboo Ghosts' rules, with no DOM. Eight little ghosts hide behind eight things in the
 * yard, one at a time; the child finds each by tapping where it peeks out. Nothing is timed or lost: a
 * tap on an empty spot just says so, a ghost waits as long as it takes, and a gentle hint rises if the
 * child is stuck. Finding all eight ends the round; "Play again" hides them anew.
 */
export interface Place {
  readonly id: string;
  /** What is there ("the old tree"), for the line when nobody is behind it. */
  readonly name: string;
}

export const PLACES: readonly Place[] = [
  { id: 'window', name: 'the window' }, { id: 'tombstone', name: 'the stone' }, { id: 'bush', name: 'the bush' }, { id: 'pumpkin', name: 'the pumpkin' },
  { id: 'tree', name: 'the tree stump' }, { id: 'barrel', name: 'the barrel' }, { id: 'door', name: 'the door' }, { id: 'hay', name: 'the haystack' },
];

export interface Hat {
  readonly id: string;
  readonly name: string;
}
/** Each ghost wears something different, so every find is somebody new. */
export const GHOSTS: readonly Hat[] = [
  { id: 'bow', name: 'a bow' }, { id: 'witch', name: 'a witch hat' }, { id: 'glasses', name: 'round glasses' }, { id: 'crown', name: 'a crown' },
  { id: 'flower', name: 'a flower' }, { id: 'scarf', name: 'a stripy scarf' }, { id: 'party', name: 'a party hat' }, { id: 'plain', name: 'nothing but a smile' },
];

export const GHOST_COUNT = GHOSTS.length;

/** Where the next ghost peeks out: never where the last one was. */
export function nextPlace(rand: () => number, last: number | null, n = PLACES.length): number {
  if (n <= 1) return 0;
  const pool: number[] = [];
  for (let i = 0; i < n; i++) if (i !== last) pool.push(i);
  return pool[Math.floor(rand() * pool.length) % pool.length]!;
}

export interface Round {
  readonly found: number;
  /** The place a ghost is peeking from now, or null between ghosts. */
  readonly at: number | null;
  readonly last: number | null;
}

export const newRound = (): Round => ({ found: 0, at: null, last: null });
export const isDone = (r: Round): boolean => r.found >= GHOST_COUNT;

export function hide(r: Round, rand: () => number): Round {
  if (r.at !== null || isDone(r)) return r;
  return { ...r, at: nextPlace(rand, r.last) };
}

/** A tap on place `i`: it counts if a ghost is there. */
export function tap(r: Round, i: number): { readonly round: Round; readonly hit: boolean } {
  if (r.at === null || r.at !== i) return { round: r, hit: false };
  return { round: { found: r.found + 1, at: null, last: i }, hit: true };
}

export const EMPTY_LINES: readonly string[] = ['Nobody here, just {place}!', 'Hmm, only {place}.', 'Not here! Try somewhere else.', 'Peekaboo! …nope, {place}.'];
export const FOUND_LINES: readonly string[] = ['Peekaboo! You found me!', 'Hee hee! You’re good at this!', 'Oh no, you spotted me!', 'Boo! …I mean, hello!', 'Found me again!', 'You’re a ghost-finder!'];
