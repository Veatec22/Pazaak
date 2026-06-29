















import { WINNING_TOTAL } from './cards';
import {
  type Action,
  EndTurn,
  type GameView,
  PazaakGame,
  Phase,
  PlayHandCard,
  Stand,
  type TableCard,
} from './engine';
import type { PazaakEvent, Seat } from './events';

const AUTO_ADVANCE_GUARD = 1000;

export interface ActionDict {
  type: 'stand' | 'end_turn' | 'play';
  hand_index?: number;
  option_index?: number;
}

export function actionFromDict(data: ActionDict): Action {
  switch (data.type) {
    case 'stand':
      return Stand();
    case 'end_turn':
      return EndTurn();
    case 'play':
      if (data.hand_index == null) throw new Error('play action requires hand_index');
      return PlayHandCard(data.hand_index, data.option_index ?? 0);
    default:
      throw new Error(`unknown action ${JSON.stringify(data)}`);
  }
}

export function actionToDict(action: Action): ActionDict {
  switch (action.kind) {
    case 'stand':
      return { type: 'stand' };
    case 'end_turn':
      return { type: 'end_turn' };
    case 'play':
      return { type: 'play', hand_index: action.handIndex, option_index: action.optionIndex };
  }
}


export interface LabelledAction extends ActionDict {
  label: string;
}


export interface SeatState extends GameView {
  match_score: { you: number; opponent: number };
  legal_actions: LabelledAction[];
  winner: Seat | null;
  over: boolean;
}

export class MatchSession {
  readonly game: PazaakGame;

  readonly openingEvents: PazaakEvent[];

  constructor(game: PazaakGame) {
    this.game = game;
    this.openingEvents = this.computeOpeningEvents();
  }

  get isOver(): boolean {
    return this.game.phase === Phase.MATCH_OVER;
  }


  get current(): Seat | undefined {
    return this.isOver ? undefined : (this.game.current as Seat);
  }





  apply(action: Action | ActionDict): PazaakEvent[] {
    if (this.isOver) throw new Error('the match is over');
    const act = 'kind' in action ? action : actionFromDict(action);
    let events = this.step(act);
    events = events.concat(this.autoAdvance());
    return events;
  }


  stateFor(seat: Seat): SeatState {
    const view = this.game.viewFor(seat);
    return {
      ...view,
      match_score: {
        you: this.game.players[seat].setsWon,
        opponent: this.game.players[1 - seat].setsWon,
      },
      legal_actions: view.your_turn ? this.legalActionDicts(seat) : [],
      winner: this.game.winner as Seat | null,
      over: this.isOver,
    };
  }



  private legalActionDicts(seat: Seat): LabelledAction[] {
    const me = this.game.players[seat];
    return this.game.legalActions().map((action): LabelledAction => {
      const d = actionToDict(action);
      let label: string;
      if (action.kind === 'stand') {
        label = 'Stand';
      } else if (action.kind === 'end_turn') {
        label = 'End Turn';
      } else {
        const card = me.hand[action.handIndex]!;
        const opt = card.options[action.optionIndex];
        label = card.code === opt.label ? `Play ${card.code}` : `Play ${card.code} as ${opt.label}`;
      }
      return { ...d, label };
    });
  }


  private tables(): [TableCard[], TableCard[]] {
    return [[...this.game.players[0].table], [...this.game.players[1].table]];
  }

  private computeOpeningEvents(): PazaakEvent[] {
    const events: PazaakEvent[] = [];
    this.tables().forEach((table, p) => {
      for (const card of table) events.push(this.cardEvent(p as Seat, card));
    });
    return events.concat(this.autoAdvance());
  }






  private autoAdvance(): PazaakEvent[] {
    const events: PazaakEvent[] = [];
    for (let i = 0; i < AUTO_ADVANCE_GUARD; i++) {
      if (this.isOver) return events;
      if (this.shouldAutostand()) {
        events.push(...this.step(Stand()));
      } else {
        return events;
      }
    }
    throw new Error('auto-advance failed to yield the turn');
  }

  private shouldAutostand(): boolean {
    const me = this.game.players[this.game.current];
    return !me.standing && me.total === WINNING_TOTAL;
  }


  private step(action: Action): PazaakEvent[] {
    const actor = this.game.current as Seat;
    const before = this.tables();
    const histBefore = this.game.history.length;
    this.game.apply(action);
    const after = this.tables();

    const events: PazaakEvent[] = [];
    if (action.kind === 'stand') events.push({ type: 'stand', actor });
    else if (action.kind === 'end_turn') events.push({ type: 'end_turn', actor });

    if (this.game.history.length > histBefore) {

      for (const result of this.game.history.slice(histBefore)) {
        events.push({
          type: 'set_over',
          winner: result.winner as Seat | null,
          reason: result.reason,
          totals: [result.totals[0], result.totals[1]],
        });
      }
      if (this.isOver) {
        events.push({ type: 'match_over', winner: this.game.winner as Seat });
      } else {

        const starter = this.game.current as Seat;
        events.push(this.cardEvent(starter, after[starter][after[starter].length - 1]));
      }
    } else {
      for (const p of [0, 1] as const) {
        for (const card of after[p].slice(before[p].length)) {
          events.push(this.cardEvent(p, card));
        }
      }
    }
    return events;
  }

  private cardEvent(player: Seat, card: TableCard): PazaakEvent {
    const isDraw = card.family === 'main';
    return {
      type: isDraw ? 'draw' : 'play',
      actor: player,
      card: card.label,
      total: this.game.players[player].total,
      family: card.family,
    };
  }
}
