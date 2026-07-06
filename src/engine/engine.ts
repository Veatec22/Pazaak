






















import { dealHand, MAX_TABLE_CARDS, MainDeck, SETS_TO_WIN_MATCH, SIDE_DECK_SIZE, type SideCard, WINNING_TOTAL } from './cards';
import type { Rng } from './rng';
import { SeededRng } from './rng';

export enum Phase {
  PLAYER_DECISION = 'PLAYER_DECISION',
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






export interface TableCard {
  readonly label: string;
  readonly value: number;
  readonly family: string;
}

export class PlayerState {
  table: TableCard[] = [];
  standing = false;
  playedThisTurn = false;
  setsWon = 0;

  constructor(public hand: (SideCard | null)[]) {}

  get total(): number {
    return this.table.reduce((sum, c) => sum + c.value, 0);
  }
}


export interface SetResult {
  readonly setNumber: number;
  readonly winner: number | null;
  readonly totals: readonly [number, number];
  readonly reason: 'bust' | 'higher' | 'nine-cards' | 'tie';
}


export type TableCardTuple = [string, number, string];

interface PlayerView {
  total: number;
  table: TableCardTuple[];
  hand: (string | null)[];
  hand_options: string[][];
  standing: boolean;
  played_this_turn: boolean;
  sets_won: number;
}

interface OpponentView {
  total: number;
  table: TableCardTuple[];
  hand_slots: boolean[];
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
      new PlayerState(dealHand(this.rng, sideDeckA)),
      new PlayerState(dealHand(this.rng, sideDeckB)),
    ];
    this.starter = opts.firstPlayer ?? this.rng.randint(0, 1);
    this.current = this.starter;
    this.startSet(this.starter);
  }



  legalActions(): Action[] {
    if (this.phase === Phase.MATCH_OVER) return [];
    const me = this.players[this.current];
    const actions: Action[] = [Stand(), EndTurn()];
    if (!me.playedThisTurn) {
      me.hand.forEach((c, i) => {
        if (!c) return;
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



  private startSet(starter: number): void {
    for (const p of this.players) {
      p.table = [];
      p.standing = false;
      p.playedThisTurn = false;
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
    me.table.push({ label: String(value), value, family: 'main' });
    if (!this.checkFullTable(player)) {
      this.phase = Phase.PLAYER_DECISION;
    }
  }

  private playHandCard(action: PlayHandCard): void {
    const me = this.players[this.current];
    if (me.playedThisTurn) throw new Error('only one hand card may be played per turn');
    const card = me.hand[action.handIndex];
    if (!card) throw new Error('that hand slot is empty');
    const play = card.options[action.optionIndex];
    me.table.push({ label: play.label, value: play.delta, family: card.family });
    me.hand[action.handIndex] = null;
    me.playedThisTurn = true;
    this.checkFullTable(this.current);
  }

  private endTurn(): void {
    const me = this.players[this.current];
    me.playedThisTurn = false;
    if (me.total > WINNING_TOTAL) {

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
      this.beginTurn(this.current);
    } else {
      this.resolveStandoff();
    }
  }


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
      this.endSet(null, 'tie');
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
      nextStarter = 1 - this.starter;
    }
    this.startSet(nextStarter);
  }








  viewFor(player: number): GameView {
    const me = this.players[player];
    const opp = this.players[1 - player];
    return {
      phase: this.phase,
      set_number: this.setNumber,
      your_turn: this.current === player && this.phase === Phase.PLAYER_DECISION,
      you: {
        total: me.total,
        table: me.table.map((c) => [c.label, c.value, c.family] as TableCardTuple),
        hand: me.hand.map((c) => (c ? c.code : null)),
        hand_options: me.hand.map((c) => (c ? c.options.map((o) => o.label) : [])),
        standing: me.standing,
        played_this_turn: me.playedThisTurn,
        sets_won: me.setsWon,
      },
      opponent: {
        total: opp.total,
        table: opp.table.map((c) => [c.label, c.value, c.family] as TableCardTuple),
        hand_slots: opp.hand.map((c) => c != null),
        hand_size: opp.hand.reduce((n, c) => (c ? n + 1 : n), 0),
        standing: opp.standing,
        sets_won: opp.setsWon,
      },
    };
  }
}
