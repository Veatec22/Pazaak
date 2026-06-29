









export type Seat = 0 | 1;

type SetReason = 'bust' | 'higher' | 'nine-cards' | 'tie';

export type PazaakEvent =
  | { type: 'draw'; actor: Seat; card: string; total: number; family: string }
  | { type: 'play'; actor: Seat; card: string; total: number; family: string }
  | { type: 'stand'; actor: Seat }
  | { type: 'end_turn'; actor: Seat }
  | { type: 'set_over'; winner: Seat | null; reason: SetReason; totals: [number, number] }
  | { type: 'match_over'; winner: Seat };
