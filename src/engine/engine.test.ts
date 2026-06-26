import { describe, expect, it } from 'vitest';

import { DECK_COLLECTION, FULL_COLLECTION, MainDeck, card, randomSideDeck } from './cards';
import { EndTurn, PazaakGame, Phase, PlayHandCard, type Action, type TableCard } from './engine';
import { SeededRng } from './rng';



interface Internals {
  beginTurn(player: number): void;
  startSet(starter: number): void;
  resolveStandoff(): void;
  starter: number;
}
const peek = (g: PazaakGame) => g as unknown as Internals;
const pinMainDeck = (g: PazaakGame, cards: number[]) => {
  (g.mainDeck as unknown as { cards: number[] | null }).cards = cards;
};
const tc = (value: number, label = String(value)): TableCard => ({ label, value, family: 'main' });

function game(seed = 0, firstPlayer: number | null = 0): PazaakGame {
  const rng = new SeededRng(seed);
  return new PazaakGame(randomSideDeck(rng), randomSideDeck(rng), {
    rng,
    firstPlayer: firstPlayer ?? undefined,
  });
}



describe('card model', () => {
  it('is the authentic 23 cards', () => {
    expect(FULL_COLLECTION).toHaveLength(23);
    const families = FULL_COLLECTION.map((c) => c.family);
    const count = (f: string) => families.filter((x) => x === f).length;
    expect(count('plus')).toBe(6);
    expect(count('minus')).toBe(6);
    expect(count('flip')).toBe(6);
    expect(count('dual')).toBe(3);
    expect(count('double')).toBe(1);
    expect(count('tiebreak')).toBe(1);
  });

  it('flip card offers both signs', () => {
    const opts = new Set(card('±3').options.map((o) => `${o.label}:${o.delta}`));
    expect(opts).toEqual(new Set(['+3:3', '-3:-3']));
  });

  it('dual card offers four plays', () => {
    const opts = new Set(card('2&4').options.map((o) => `${o.label}:${o.delta}`));
    expect(opts).toEqual(new Set(['+2:2', '-2:-2', '+4:4', '-4:-4']));
  });

  it('double and tiebreak flags', () => {
    expect(card('D').options[0].double).toBe(true);
    expect(card('T').options.every((o) => o.tiebreak)).toBe(true);
    expect(new Set(card('T').options.map((o) => o.delta))).toEqual(new Set([1, -1]));
  });

  it('excludes the gold cards (Double / Tie-Breaker) from the deck pool', () => {
    expect(DECK_COLLECTION).toHaveLength(21);
    expect(DECK_COLLECTION.some((c) => c.family === 'double' || c.family === 'tiebreak')).toBe(false);

    expect(card('D').family).toBe('double');
  });

  it('never deals a gold card into a random side deck', () => {
    const rng = new SeededRng(7);
    for (let i = 0; i < 200; i++) {
      for (const c of randomSideDeck(rng)) {
        expect(c.family === 'double' || c.family === 'tiebreak').toBe(false);
      }
    }
  });

  it('main deck is four of each 1-10 and reshuffles', () => {
    const deck = new MainDeck(new SeededRng(1));
    const drawn = Array.from({ length: 40 }, () => deck.draw()).sort((a, b) => a - b);
    const expected = Array.from({ length: 10 }, (_, i) => i + 1).flatMap((v) => [v, v, v, v]);
    expect(drawn).toEqual(expected);
    expect(deck.remaining).toBe(0);
    deck.draw();
    expect(deck.remaining).toBe(39);
  });
});



describe('engine setup', () => {
  it('deals four-card hands and starts a turn', () => {
    const g = game();
    expect(g.players.every((p) => p.hand.length === 4)).toBe(true);
    expect(g.setNumber).toBe(1);
    expect(g.current).toBe(0);
    expect(g.players[0].table).toHaveLength(1);
    expect(g.players[1].table).toHaveLength(0);
  });

  it('side deck must be ten cards', () => {
    expect(() => new PazaakGame(Array(9).fill(card('+1')), Array(10).fill(card('+1')))).toThrow();
  });

  it('only one hand card per turn', () => {
    const g = game();
    g.players[0].playedThisTurn = true;
    expect(g.legalActions().some((a: Action) => a.kind === 'play')).toBe(false);
  });
});



describe('rule paths', () => {
  it('bust hands the set to the opponent who then starts', () => {
    const g = game();
    g.players[0].table = [tc(10), tc(10), tc(5)];
    g.apply(EndTurn());
    const result = g.history[g.history.length - 1];
    expect(result.winner).toBe(1);
    expect(result.reason).toBe('bust');
    expect(g.players[1].setsWon).toBe(1);
    expect(g.setNumber).toBe(2);
    expect(g.current).toBe(1);
    expect(g.players[1].table).toHaveLength(1);
  });

  it('nine cards without busting wins the set', () => {
    const g = game();
    g.players[0].table = Array.from({ length: 8 }, () => tc(2));
    pinMainDeck(g, [3]);
    peek(g).beginTurn(0);
    const result = g.history[g.history.length - 1];
    expect(result.winner).toBe(0);
    expect(result.reason).toBe('nine-cards');
  });

  it('equal totals tie and replay for no score', () => {
    const g = game();
    g.players[0].table = [tc(9)];
    g.players[1].table = [tc(9)];
    g.players[0].standing = true;
    g.players[1].standing = true;
    peek(g).resolveStandoff();
    const last = g.history[g.history.length - 1];
    expect(last.winner).toBeNull();
    expect(last.reason).toBe('tie');
    expect(g.players[0].setsWon).toBe(0);
    expect(g.players[1].setsWon).toBe(0);
    expect(g.setNumber).toBe(2);
  });

  it('tiebreaker card wins an otherwise tied set', () => {
    const g = game();
    g.players[0].table = [tc(9)];
    g.players[1].table = [tc(9)];
    g.players[0].standing = g.players[1].standing = true;
    g.players[1].tiebreaker = true;
    peek(g).resolveStandoff();
    const last = g.history[g.history.length - 1];
    expect(last.winner).toBe(1);
    expect(last.reason).toBe('tiebreak');
  });

  it('tie makes the non-starter begin the next set', () => {
    const g = game(0, 0);
    g.players[0].table = [tc(9)];
    g.players[1].table = [tc(9)];
    g.players[0].standing = g.players[1].standing = true;
    peek(g).resolveStandoff();
    expect(g.current).toBe(1);
  });

  it('higher total wins when both stand', () => {
    const g = game();
    g.players[0].table = [tc(18)];
    g.players[1].table = [tc(20)];
    g.players[0].standing = g.players[1].standing = true;
    peek(g).resolveStandoff();
    const last = g.history[g.history.length - 1];
    expect(last.winner).toBe(1);
    expect(last.reason).toBe('higher');
  });

  it('hand is not refilled between sets', () => {
    const g = game();
    g.players[0].hand.pop();
    const before = [...g.players[0].hand];
    peek(g).startSet(0);
    expect(g.players[0].hand).toEqual(before);
  });

  it('plays a flip card with the chosen option', () => {
    const g = game();
    g.players[0].hand = [card('±3'), card('+1'), card('+1'), card('+1')];
    g.players[0].table = [tc(5)];
    g.players[0].playedThisTurn = false;
    g.apply(PlayHandCard(0, 1));
    expect(g.players[0].total).toBe(2);
  });

  it('double card copies the last table card', () => {
    const g = game();
    g.players[0].hand = [card('D'), card('+1'), card('+1'), card('+1')];
    g.players[0].table = [tc(7)];
    g.players[0].playedThisTurn = false;
    g.apply(PlayHandCard(0, 0));
    expect(g.players[0].total).toBe(14);
    expect(g.players[0].table[g.players[0].table.length - 1].label).toBe('x2');
  });
});



function playRandomMatch(seed: number): PazaakGame {
  const rng = new SeededRng(seed);
  const g = new PazaakGame(randomSideDeck(rng), randomSideDeck(rng), { rng });
  for (let i = 0; i < 100000 && g.phase !== Phase.MATCH_OVER; i++) {
    const actions = g.legalActions();
    g.apply(actions[rng.randint(0, actions.length - 1)]);
  }
  return g;
}

describe('full games', () => {
  for (let seed = 0; seed < 40; seed++) {
    it(`random match terminates with a valid winner (seed ${seed})`, () => {
      const g = playRandomMatch(seed);
      expect(g.phase).toBe(Phase.MATCH_OVER);
      expect([0, 1]).toContain(g.winner);
      expect(g.players[g.winner!].setsWon).toBe(3);
    });
  }
});
