/**
 * Pazaak card model and the authentic KotOR II card data.
 *
 * Two decks feed a game of pazaak:
 *
 *   - the **main deck** — a shared pool of value cards 1-10 (four of each) that every
 *     turn deals one face-up card onto the active player's table, and
 *   - a player's **side deck** — ten cards picked before the match, from which four are
 *     drawn into the *hand* and played by choice (once each) over the whole match.
 *
 * Direct port of `src/hk47_audio/pazaak/cards.py`. The card codes, values and families
 * are kept byte-for-byte identical so the TS engine emits the same event stream as the
 * Python `PazaakSession` — see the parity tests.
 */

import type { Rng } from './rng';

export const MAIN_DECK_MIN = 1;
export const MAIN_DECK_MAX = 10;
export const WINNING_TOTAL = 20;
export const MAX_TABLE_CARDS = 9;
export const HAND_SIZE = 4;
export const SIDE_DECK_SIZE = 10;
export const SETS_TO_WIN_MATCH = 3;

/**
 * One concrete effect a side card can have when played.
 *
 * `delta` is the signed value contributed to the table total. `double` instead doubles
 * the value of the last card already on the table (adding a copy of it). `tiebreak`
 * marks the play as a tie-breaker: it also wins any tied set this round.
 */
export interface CardPlay {
  readonly label: string;
  readonly delta: number;
  readonly double: boolean;
  readonly tiebreak: boolean;
}

function play(label: string, opts: Partial<Omit<CardPlay, 'label'>> = {}): CardPlay {
  return { label, delta: opts.delta ?? 0, double: opts.double ?? false, tiebreak: opts.tiebreak ?? false };
}

/**
 * A hand card and the set of plays it offers. `code` is a stable label
 * (e.g. `"+3"`, `"±3"`, `"2&4"`, `"D"`, `"T"`).
 */
export interface SideCard {
  readonly code: string;
  readonly family: string;
  readonly options: readonly CardPlay[];
}

const plus = (n: number): SideCard => ({ code: `+${n}`, family: 'plus', options: [play(`+${n}`, { delta: n })] });

const minus = (n: number): SideCard => ({ code: `-${n}`, family: 'minus', options: [play(`-${n}`, { delta: -n })] });

const flip = (n: number): SideCard => ({
  code: `±${n}`,
  family: 'flip',
  options: [play(`+${n}`, { delta: n }), play(`-${n}`, { delta: -n })],
});

const dual = (a: number, b: number): SideCard => {
  const options: CardPlay[] = [];
  for (const v of [a, b]) {
    for (const s of [1, -1]) {
      options.push(play(`${s > 0 ? '+' : '-'}${v}`, { delta: s * v }));
    }
  }
  return { code: `${a}&${b}`, family: 'dual', options };
};

const DOUBLE: SideCard = { code: 'D', family: 'double', options: [play('D', { double: true })] };

const TIEBREAK: SideCard = {
  code: 'T',
  family: 'tiebreak',
  options: [play('+1T', { delta: 1, tiebreak: true }), play('-1T', { delta: -1, tiebreak: true })],
};

/**
 * The full set of 23 collectible side-deck cards, in the game's own item order
 * (g_i_pazcard_001..023): +1..+6, -1..-6, ±1..±6, then the five special "gold" cards.
 */
export const FULL_COLLECTION: readonly SideCard[] = [
  ...[1, 2, 3, 4, 5, 6].map(plus),
  ...[1, 2, 3, 4, 5, 6].map(minus),
  ...[1, 2, 3, 4, 5, 6].map(flip),
  dual(1, 2), // g_i_pazcard_019  "+/- 1/2"
  DOUBLE, //     g_i_pazcard_020  "Double"
  TIEBREAK, //   g_i_pazcard_021  "Tie Breaker"
  dual(2, 4), // g_i_pazcard_022  "Flip 2&4"
  dual(3, 6), // g_i_pazcard_023  "Flip 3&6"
];

const BY_CODE = new Map(FULL_COLLECTION.map((c) => [c.code, c]));

/** Look up a side card by its code, e.g. `card("±3")` or `card("D")`. */
export function card(code: string): SideCard {
  const c = BY_CODE.get(code);
  if (!c) throw new Error(`unknown card code ${code}`);
  return c;
}

/** Card families rendered as gold — "Double" and "Tie-Breaker". Eliminated from this game. */
const GOLD_FAMILIES = new Set(['double', 'tiebreak']);

/**
 * The pool decks are actually built from: the full collection minus the gold cards. The
 * Double/Tie-Breaker mechanics stay supported in the engine, but no deck ever contains them,
 * so they never appear in play.
 */
export const DECK_COLLECTION: readonly SideCard[] = FULL_COLLECTION.filter((c) => !GOLD_FAMILIES.has(c.family));

/**
 * A legal 10-card side deck sampled (with the duplicates the game allows) from the playable
 * collection (no gold cards). Good enough for a default opponent; curated decks can be passed in.
 */
export function randomSideDeck(rng: Rng): SideCard[] {
  return Array.from({ length: SIDE_DECK_SIZE }, () => DECK_COLLECTION[rng.randint(0, DECK_COLLECTION.length - 1)]);
}

/** The shared 1-10 value deck both players draw from, reshuffled when exhausted. */
export class MainDeck {
  private cards: number[] | null = null;

  constructor(
    private readonly rng: Rng,
    private readonly copies = 4,
  ) {}

  private refill(): void {
    const cards: number[] = [];
    for (let v = MAIN_DECK_MIN; v <= MAIN_DECK_MAX; v++) {
      for (let i = 0; i < this.copies; i++) cards.push(v);
    }
    this.rng.shuffle(cards);
    this.cards = cards;
  }

  draw(): number {
    if (!this.cards || this.cards.length === 0) this.refill();
    return this.cards!.pop()!;
  }

  get remaining(): number {
    return this.cards ? this.cards.length : 0;
  }
}
