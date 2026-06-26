/**
 * The pazaak rules engine: a self-contained, frontend-agnostic state machine.
 *
 * Direct port of `src/hk47_audio/pazaak/engine.py`. The engine owns the full game state
 * and enforces every rule; *drivers* (a hot-seat UI, the network session, tests) advance
 * it by reading `legalActions()` and calling `apply()`. Nothing here knows or cares who is
 * making the decisions, which keeps the same engine reusable across very different fronts.
 *
 * Rules modelled (KotOR II):
 *   - A **match** is first to SETS_TO_WIN_MATCH (3) set wins.
 *   - Each **set**, players alternate turns. A turn always begins by auto-drawing one
 *     main-deck card (1-10) face-up. The active player may then play at most one hand card,
 *     and finally either **stand** (lock the total) or **end the turn**. The bust check
 *     (> 20) happens when the turn ends, so a card drawn over 20 can still be rescued.
 *   - A player who fills the table with MAX_TABLE_CARDS (9) cards without busting wins the
 *     set immediately.
 *   - A set is won by the higher total ≤ 20, or when the opponent busts. Equal totals tie:
 *     the set is replayed for no one — unless exactly one player played a tie-breaker card.
 *   - First player of set 1 is random (or pinned). Thereafter the set's winner starts the
 *     next set; after a tie, whoever did *not* start the tied set does.
 *   - The four-card hand is dealt once at match start and is never refilled.
 */

import { HAND_SIZE, MAX_TABLE_CARDS, MainDeck, SETS_TO_WIN_MATCH, SIDE_DECK_SIZE, type SideCard, WINNING_TOTAL } from './cards';
import type { Rng } from './rng';
import { SeededRng } from './rng';

export enum Phase {
  PLAYER_DECISION = 'PLAYER_DECISION', // waiting for the current player to choose an action
  MATCH_OVER = 'MATCH_OVER',
}

export interface Stand {
  readonly kind: 'stand';
}
export interface EndTurn {
  readonly kind: 'end_turn';
}
export interface PlayHandCard {
  readonly kind: 'play';
  readonly handIndex: number;
  readonly optionIndex: number;
}

export type Action = Stand | EndTurn | PlayHandCard;

export const Stand = (): Stand => ({ kind: 'stand' });
export const EndTurn = (): EndTurn => ({ kind: 'end_turn' });
export const PlayHandCard = (handIndex: number, optionIndex = 0): PlayHandCard => ({
  kind: 'play',
  handIndex,
  optionIndex,
});

/** A face-up card on a player's table; `value` is its signed contribution. */
export interface TableCard {
  readonly label: string;
  readonly value: number;
}

export class PlayerState {
  table: TableCard[] = [];
  standing = false;
  playedThisTurn = false;
  tiebreaker = false;
  setsWon = 0;

  constructor(public hand: SideCard[]) {}

  get total(): number {
    return this.table.reduce((sum, c) => sum + c.value, 0);
  }
}

/** Outcome of a finished set; `winner` is `null` for a (replayed) tie. */
export interface SetResult {
  readonly setNumber: number;
  readonly winner: number | null;
  readonly totals: readonly [number, number];
  readonly reason: 'bust' | 'higher' | 'nine-cards' | 'tiebreak' | 'tie';
}

export interface PlayerView {
  total: number;
  table: [string, number][];
  hand: string[];
  hand_options: string[][];
  standing: boolean;
  played_this_turn: boolean;
  sets_won: number;
}

export interface OpponentView {
  total: number;
  table: [string, number][];
  hand_size: number;
  standing: boolean;
  sets_won: number;
}

export interface GameView {
  phase: string;
  set_number: number;
  your_turn: boolean;
  you: PlayerView;
  opponent: OpponentView;
}

/**
 * A full pazaak match. Construct with each player's 10-card side deck, then drive it via
 * `legalActions()` / `apply()` until `phase` is `MATCH_OVER`.
 */
export class PazaakGame {
  readonly rng: Rng;
  readonly mainDeck: MainDeck;
  readonly players: readonly [PlayerState, PlayerState];
  setNumber = 0;
  readonly history: SetResult[] = [];
  winner: number | null = null;
  phase = Phase.PLAYER_DECISION;
  current: number;
  private starter: number;

  constructor(
    sideDeckA: SideCard[],
    sideDeckB: SideCard[],
    opts: { rng?: Rng; firstPlayer?: number } = {},
  ) {
    if (sideDeckA.length !== SIDE_DECK_SIZE || sideDeckB.length !== SIDE_DECK_SIZE) {
      throw new Error(`each side deck must hold exactly ${SIDE_DECK_SIZE} cards`);
    }
    this.rng = opts.rng ?? new SeededRng();
    this.mainDeck = new MainDeck(this.rng);
    this.players = [
      new PlayerState(this.rng.sample(sideDeckA, HAND_SIZE)),
      new PlayerState(this.rng.sample(sideDeckB, HAND_SIZE)),
    ];
    this.starter = opts.firstPlayer ?? this.rng.randint(0, 1);
    this.current = this.starter;
    this.startSet(this.starter);
  }

  // -- driving API -------------------------------------------------------------

  legalActions(): Action[] {
    if (this.phase === Phase.MATCH_OVER) return [];
    const me = this.players[this.current];
    const actions: Action[] = [Stand(), EndTurn()];
    if (!me.playedThisTurn) {
      me.hand.forEach((c, i) => {
        c.options.forEach((_, j) => actions.push(PlayHandCard(i, j)));
      });
    }
    return actions;
  }

  apply(action: Action): void {
    if (this.phase === Phase.MATCH_OVER) throw new Error('the match is over');
    if (action.kind === 'play') {
      this.playHandCard(action);
    } else {
      if (action.kind === 'stand') this.players[this.current].standing = true;
      this.endTurn();
    }
  }

  // -- turn / set mechanics ----------------------------------------------------

  private startSet(starter: number): void {
    for (const p of this.players) {
      p.table = [];
      p.standing = false;
      p.playedThisTurn = false;
      p.tiebreaker = false;
    }
    this.setNumber += 1;
    this.starter = starter;
    this.beginTurn(starter);
  }

  private beginTurn(player: number): void {
    this.current = player;
    const me = this.players[player];
    me.playedThisTurn = false;
    const value = this.mainDeck.draw();
    me.table.push({ label: String(value), value });
    if (!this.checkFullTable(player)) {
      this.phase = Phase.PLAYER_DECISION;
    }
  }

  private playHandCard(action: PlayHandCard): void {
    const me = this.players[this.current];
    if (me.playedThisTurn) throw new Error('only one hand card may be played per turn');
    const card = me.hand[action.handIndex];
    const play = card.options[action.optionIndex];
    if (play.double) {
      const doubled = me.table.length ? me.table[me.table.length - 1].value : 0;
      me.table.push({ label: 'x2', value: doubled });
    } else {
      me.table.push({ label: play.label, value: play.delta });
    }
    if (play.tiebreak) me.tiebreaker = true;
    me.hand.splice(action.handIndex, 1);
    me.playedThisTurn = true;
    this.checkFullTable(this.current);
  }

  private endTurn(): void {
    const me = this.players[this.current];
    me.playedThisTurn = false;
    if (me.total > WINNING_TOTAL) {
      // bust: opponent takes the set
      this.endSet(1 - this.current, 'bust');
      return;
    }
    this.advance();
  }

  private advance(): void {
    const opp = 1 - this.current;
    if (!this.players[opp].standing) {
      this.beginTurn(opp);
    } else if (!this.players[this.current].standing) {
      this.beginTurn(this.current); // opponent has stood; keep drawing
    } else {
      this.resolveStandoff();
    }
  }

  /** If `player` now holds 9 cards the set resolves at once. Returns true if so. */
  private checkFullTable(player: number): boolean {
    const me = this.players[player];
    if (me.table.length < MAX_TABLE_CARDS) return false;
    if (me.total > WINNING_TOTAL) {
      this.endSet(1 - player, 'bust');
    } else {
      this.endSet(player, 'nine-cards');
    }
    return true;
  }

  private resolveStandoff(): void {
    const a = this.players[0].total;
    const b = this.players[1].total;
    if (a > b) {
      this.endSet(0, 'higher');
    } else if (b > a) {
      this.endSet(1, 'higher');
    } else {
      const tb0 = this.players[0].tiebreaker;
      const tb1 = this.players[1].tiebreaker;
      if (tb0 && !tb1) this.endSet(0, 'tiebreak');
      else if (tb1 && !tb0) this.endSet(1, 'tiebreak');
      else this.endSet(null, 'tie');
    }
  }

  private endSet(winner: number | null, reason: SetResult['reason']): void {
    this.history.push({
      setNumber: this.setNumber,
      winner,
      totals: [this.players[0].total, this.players[1].total],
      reason,
    });
    let nextStarter: number;
    if (winner !== null) {
      this.players[winner].setsWon += 1;
      if (this.players[winner].setsWon >= SETS_TO_WIN_MATCH) {
        this.winner = winner;
        this.phase = Phase.MATCH_OVER;
        return;
      }
      nextStarter = winner;
    } else {
      nextStarter = 1 - this.starter; // non-starter of the tied set starts next
    }
    this.startSet(nextStarter);
  }

  // -- inspection --------------------------------------------------------------

  /**
   * A fair snapshot for `player`: full own state, but only the *size* of the opponent's
   * hand. The host sends each peer only their own view so an unplayed hand never reaches
   * the opponent's DOM.
   */
  viewFor(player: number): GameView {
    const me = this.players[player];
    const opp = this.players[1 - player];
    return {
      phase: this.phase,
      set_number: this.setNumber,
      your_turn: this.current === player && this.phase === Phase.PLAYER_DECISION,
      you: {
        total: me.total,
        table: me.table.map((c) => [c.label, c.value]),
        hand: me.hand.map((c) => c.code),
        hand_options: me.hand.map((c) => c.options.map((o) => o.label)),
        standing: me.standing,
        played_this_turn: me.playedThisTurn,
        sets_won: me.setsWon,
      },
      opponent: {
        total: opp.total,
        table: opp.table.map((c) => [c.label, c.value]),
        hand_size: opp.hand.length,
        standing: opp.standing,
        sets_won: opp.setsWon,
      },
    };
  }
}
