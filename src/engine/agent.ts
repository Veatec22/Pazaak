import { WINNING_TOTAL } from './cards';
import { type Action, PazaakGame, PlayHandCard, Stand, EndTurn } from './engine';

const STAND_THRESHOLD = 18;

/**
 * A direct port of `BasicAgent` heuristic decision maker from HK-47 agents.py.
 *
 * * if busting, play the hand card that lands closest to 20 (rescuing the turn);
 * * if a hand card would land exactly on 20, play it;
 * * stand on a safe high total, or once ahead of a standing opponent;
 * * otherwise draw again (end the turn).
 */
export function chooseBotAction(game: PazaakGame, player: number): Action {
  const me = game.players[player];
  const opp = game.players[1 - player];
  const total = me.total;

  const [bestPlay, bestTotal] = bestHandPlay(game, player);

  if (total > WINNING_TOTAL) {
    // Must fix the bust if we can; otherwise we have already lost the set.
    if (bestPlay !== null && bestTotal <= WINNING_TOTAL) {
      return bestPlay;
    }
    return Stand();
  }

  if (!me.playedThisTurn && bestPlay !== null && bestTotal === WINNING_TOTAL) {
    return bestPlay;
  }

  if (total === WINNING_TOTAL) {
    return Stand();
  }

  // If the opponent has stood, only keep risking it while we are behind or tied.
  if (opp.standing && total >= opp.total && total <= WINNING_TOTAL) {
    return Stand();
  }

  if (total >= STAND_THRESHOLD && !(opp.standing && opp.total > total)) {
    return Stand();
  }

  return EndTurn();
}

function bestHandPlay(game: PazaakGame, player: number): [PlayHandCard | null, number] {
  const me = game.players[player];
  if (me.playedThisTurn) {
    return [null, me.total];
  }

  let best: PlayHandCard | null = null;
  let bestTotal = me.total;
  let bestKey: [number, number] = [1, Math.abs(WINNING_TOTAL - me.total)]; // [busts?, distance-to-20]

  // Get legal actions
  const legal = game.legalActions();
  for (const action of legal) {
    if (action.kind !== 'play') {
      continue;
    }
    const card = me.hand[action.handIndex];
    const opt = card.options[action.optionIndex];

    // Double card logic: doubles the value of the last played card on table
    let delta = 0;
    if (opt.double) {
      delta = me.table.length > 0 ? me.table[me.table.length - 1].value : 0;
    } else {
      delta = opt.delta;
    }

    const result = me.total + delta;
    const busts = result > WINNING_TOTAL ? 1 : 0;
    const distance = Math.abs(WINNING_TOTAL - result);
    const key: [number, number] = [busts, distance];

    // Lexicographical comparison of keys: [busts, distance]
    if (key[0] < bestKey[0] || (key[0] === bestKey[0] && key[1] < bestKey[1])) {
      bestKey = key;
      best = action;
      bestTotal = result;
    }
  }

  return [best, bestTotal];
}
