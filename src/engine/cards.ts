














import type { Rng } from './rng';

export const MAIN_DECK_MIN = 1;
export const MAIN_DECK_MAX = 10;
export const WINNING_TOTAL = 20;
export const MAX_TABLE_CARDS = 9;
export const HAND_SIZE = 4;
export const SIDE_DECK_SIZE = 10;
export const SETS_TO_WIN_MATCH = 3;








export interface CardPlay {
  readonly label: string;
  readonly delta: number;
  readonly double: boolean;
  readonly tiebreak: boolean;
}

function play(label: string, opts: Partial<Omit<CardPlay, 'label'>> = {}): CardPlay {
  return { label, delta: opts.delta ?? 0, double: opts.double ?? false, tiebreak: opts.tiebreak ?? false };
}





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





export const FULL_COLLECTION: readonly SideCard[] = [
  ...[1, 2, 3, 4, 5, 6].map(plus),
  ...[1, 2, 3, 4, 5, 6].map(minus),
  ...[1, 2, 3, 4, 5, 6].map(flip),
  dual(1, 2),
  DOUBLE,
  TIEBREAK,
  dual(2, 4),
  dual(3, 6),
];

const BY_CODE = new Map(FULL_COLLECTION.map((c) => [c.code, c]));


export function card(code: string): SideCard {
  const c = BY_CODE.get(code);
  if (!c) throw new Error(`unknown card code ${code}`);
  return c;
}


const GOLD_FAMILIES = new Set(['double', 'tiebreak']);






export const DECK_COLLECTION: readonly SideCard[] = FULL_COLLECTION.filter((c) => !GOLD_FAMILIES.has(c.family));





export function randomSideDeck(rng: Rng): SideCard[] {
  return Array.from({ length: SIDE_DECK_SIZE }, () => DECK_COLLECTION[rng.randint(0, DECK_COLLECTION.length - 1)]);
}


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
