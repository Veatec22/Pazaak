/**
 * The public event stream a board replays to animate a match.
 *
 * Ported from the event-reconstruction logic in `src/hk47_audio/pazaak/session.py`, but
 * made **player-neutral**: actors and winners are absolute seat indices (0 / 1), not the
 * single-player "you" / "opponent" framing. This is the host-authoritative broadcast —
 * both peers receive the same public events; only the per-player `viewFor` snapshot
 * (which hides the opponent's hand) differs. Each client localises 0/1 onto its own seat.
 */

export type Seat = 0 | 1;

export type SetReason = 'bust' | 'higher' | 'nine-cards' | 'tiebreak' | 'tie';

export type PazaakEvent =
  | { type: 'draw'; actor: Seat; card: string; total: number }
  | { type: 'play'; actor: Seat; card: string; total: number }
  | { type: 'stand'; actor: Seat }
  | { type: 'end_turn'; actor: Seat }
  | { type: 'set_over'; winner: Seat | null; reason: SetReason; totals: [number, number] }
  | { type: 'match_over'; winner: Seat };
