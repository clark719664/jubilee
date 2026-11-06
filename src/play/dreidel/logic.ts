export const START_COINS = 10;

export type Who = 'you' | 'jubi';
export type LetterId = 'nun' | 'gimel' | 'hei' | 'shin';

export interface Letter {
  readonly id: LetterId;
  readonly glyph: string;
  readonly name: string;
}

export const LETTERS: readonly Letter[] = [
  { id: 'nun', glyph: 'נ', name: 'Nun' },
  { id: 'gimel', glyph: 'ג', name: 'Gimel' },
  { id: 'hei', glyph: 'ה', name: 'Hei' },
  { id: 'shin', glyph: 'ש', name: 'Shin' },
];

export interface Game {
  readonly you: number;
  readonly jubi: number;
  readonly pot: number;
  /** Whoever ran out of coins; the game is over once this is set. */
  readonly out: Who | null;
}

export interface Turn {
  readonly game: Game;
  readonly gained: number;
  readonly paid: number;
}

export const other = (who: Who): Who => (who === 'you' ? 'jubi' : 'you');

export const newGame = (): Game => ({ you: START_COINS, jubi: START_COINS, pot: 0, out: null });

export const isOver = (g: Game): boolean => g.out !== null;

export function spinLetter(rand: () => number): Letter {
  return LETTERS[Math.floor(rand() * LETTERS.length) % LETTERS.length]!;
}

/** Gimel takes it all, Hei takes half rounded up. */
export function potShare(pot: number, id: LetterId): number {
  if (id === 'gimel') return pot;
  if (id === 'hei') return Math.ceil(pot / 2);
  return 0;
}

/** Everyone puts one coin in; if someone has none to put in, the game ends. */
export function ante(g: Game): Game {
  if (g.out) return g;
  if (g.you < 1) return { ...g, out: 'you' };
  if (g.jubi < 1) return { ...g, out: 'jubi' };
  return { ...g, you: g.you - 1, jubi: g.jubi - 1, pot: g.pot + 2 };
}

export function play(g: Game, who: Who, id: LetterId): Turn {
  if (g.out) return { game: g, gained: 0, paid: 0 };
  const mine = g[who];
  if (id === 'shin') {
    if (mine < 1) return { game: { ...g, out: who }, gained: 0, paid: 0 };
    const left = mine - 1;
    return { game: { ...g, [who]: left, pot: g.pot + 1, out: left === 0 ? who : null }, gained: 0, paid: 1 };
  }
  const gained = potShare(g.pot, id);
  return { game: { ...g, [who]: mine + gained, pot: g.pot - gained }, gained, paid: 0 };
}
