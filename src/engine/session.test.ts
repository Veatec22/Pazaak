import { describe, expect, it } from 'vitest';

import { card, randomSideDeck } from './cards';
import { EndTurn, PazaakGame, PlayHandCard, Stand, type Action } from './engine';
import type { PazaakEvent } from './events';
import { SeededRng } from './rng';
import { MatchSession, actionFromDict, actionToDict } from './session';

function session(seed = 0, firstPlayer = 0): MatchSession {
  const rng = new SeededRng(seed);
  const game = new PazaakGame(randomSideDeck(rng), randomSideDeck(rng), { rng, firstPlayer });
  return new MatchSession(game);
}


interface Internals {
  autoAdvance(): PazaakEvent[];
  step(action: Action): PazaakEvent[];
}
const peek = (s: MatchSession) => s as unknown as Internals;



describe('action serialisation', () => {
  it.each<Action>([Stand(), EndTurn(), PlayHandCard(2, 1), PlayHandCard(0)])(
    'round-trips through dict (%o)',
    (action) => {
      expect(actionFromDict(actionToDict(action))).toEqual(action);
    },
  );

  it('action dicts are JSON serialisable', () => {
    expect(() => JSON.stringify(actionToDict(PlayHandCard(1, 0)))).not.toThrow();
  });
});



describe('per-seat snapshot', () => {
  it('is JSON serialisable and hides the opponent hand', () => {
    const state = session().stateFor(0);
    expect(() => JSON.stringify(state)).not.toThrow();
    expect(state.opponent).not.toHaveProperty('hand');
    expect(state.opponent).toHaveProperty('hand_size');
  });

  it('preserves opponent hand slot occupancy without revealing card codes', () => {
    const s = session();
    s.game.current = 1;
    s.game.players[1].hand = [card('+1'), card('+2'), card('+3'), card('+4')];

    s.apply(PlayHandCard(2));

    const state = s.stateFor(0);
    expect(state.opponent).not.toHaveProperty('hand');
    expect(state.opponent).toHaveProperty('hand_slots', [true, true, false, true]);
    expect(state.opponent.hand_size).toBe(3);
  });

  it('offers labelled legal actions on your turn', () => {
    const state = session().stateFor(0);
    expect(state.your_turn).toBe(true);
    const labels = state.legal_actions.map((a) => a.label);
    expect(labels).toContain('Stand');
    expect(labels).toContain('End Turn');
    expect(labels.some((l) => l.startsWith('Play'))).toBe(true);
  });

  it('shows no legal actions to the seat that is not to move', () => {
    expect(session(0, 0).stateFor(1).legal_actions).toHaveLength(0);
  });
});



describe('opening events', () => {
  it('show the starter draw when seat 0 starts', () => {
    const s = session(0, 0);
    const draws = s.openingEvents.filter((e) => e.type === 'draw');
    expect(draws[0]).toMatchObject({ type: 'draw', actor: 0 });
    expect(s.stateFor(0).your_turn).toBe(true);
  });

  it('start with seat 1 when it is the first player', () => {
    const s = session(0, 1);
    expect(s.current).toBe(1);
    expect(s.stateFor(1).your_turn).toBe(true);
    expect(s.openingEvents.some((e) => 'actor' in e && e.actor === 1)).toBe(true);
  });
});



describe('driving a turn', () => {
  it('accepts dict actions and returns events', () => {
    const events = session().apply({ type: 'end_turn' });
    expect(events.some((e) => e.type === 'end_turn' && e.actor === 0)).toBe(true);
  });

  it('emits a play event with the card label', () => {
    const s = session();
    s.game.players[0].hand = [card('+3')];
    s.game.players[0].playedThisTurn = false;
    const events = peek(s).step(PlayHandCard(0, 0));
    const play = events.find((e) => e.type === 'play');
    expect(play).toMatchObject({ type: 'play', card: '+3', actor: 0, family: 'plus' });
  });

  it('carries the family so flip cards can render two-tone art', () => {
    const s = session();
    s.game.players[0].hand = [card('±3')];
    s.game.players[0].playedThisTurn = false;
    const events = peek(s).step(PlayHandCard(0, 1));
    expect(events.find((e) => e.type === 'play')).toMatchObject({ card: '-3', family: 'flip' });
  });

  it('tags main-deck draws as draw with the main family', () => {
    const events = session().apply({ type: 'end_turn' });
    const oppDraw = events.find((e) => e.type === 'draw' && e.actor === 1);
    expect(oppDraw).toBeDefined();
    expect(oppDraw).toMatchObject({ family: 'main' });
    expect(/^-?\d+$/.test((oppDraw as { card: string }).card)).toBe(true);
  });
});



describe('auto-stand and set framing', () => {
  it('auto-stands the active seat sitting on a locked 20', () => {
    const s = session();
    s.game.players[0].table = [
      { label: '10', value: 10, family: 'main' },
      { label: '10', value: 10, family: 'main' },
    ];
    s.game.players[1].standing = true;
    s.game.current = 0;
    const events = peek(s).autoAdvance();
    expect(events.some((e) => e.type === 'stand' && e.actor === 0)).toBe(true);

    expect(events.some((e) => e.type === 'set_over' && e.winner === 0)).toBe(true);
  });

  it('set_over reports the absolute winner seat and reason', () => {
    const s = session();
    s.game.players[0].table = [
      { label: '10', value: 10, family: 'main' },
      { label: '10', value: 10, family: 'main' },
      { label: '5', value: 5, family: 'main' },
    ];
    const events = peek(s).step(EndTurn());
    const setOver = events.find((e) => e.type === 'set_over');
    expect(setOver).toMatchObject({ type: 'set_over', winner: 1, reason: 'bust' });
  });
});



describe('end to end', () => {
  it('reaches match_over exactly once when both seats take the first legal action', () => {
    const s = session(3);
    let matchOver = 0;
    for (let guard = 0; guard < 5000 && !s.isOver; guard++) {
      const seat = s.current!;
      const events = s.apply(s.stateFor(seat).legal_actions[0]);
      matchOver += events.filter((e) => e.type === 'match_over').length;
    }
    expect(s.isOver).toBe(true);
    expect(matchOver).toBe(1);
    expect([0, 1]).toContain(s.game.winner);
  });
});
