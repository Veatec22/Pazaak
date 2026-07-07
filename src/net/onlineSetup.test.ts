import { describe, expect, it } from 'vitest';

import { SIDE_DECK_SIZE } from '../engine';
import { SeededRng } from '../engine/rng';
import { resolveOnlineSideDecks } from './onlineSetup';

describe('resolveOnlineSideDecks', () => {
  it('uses each player builder deck and falls back to mixed when one is missing', () => {
    const hostCodes = Array.from({ length: SIDE_DECK_SIZE }, () => '±6');
    const { hostDeck, guestDeck } = resolveOnlineSideDecks(new SeededRng(2), 'builder', hostCodes, null);

    expect(hostDeck.map((c) => c.code)).toEqual(hostCodes);
    expect(guestDeck).toHaveLength(SIDE_DECK_SIZE);
    expect(guestDeck.map((c) => c.code)).not.toEqual(hostCodes);
  });

  it('uses the selected built-in pool for both players', () => {
    const { hostDeck, guestDeck } = resolveOnlineSideDecks(new SeededRng(3), 'flip', null, null);

    expect(hostDeck.every((c) => c.family === 'flip')).toBe(true);
    expect(guestDeck.every((c) => c.family === 'flip')).toBe(true);
  });
});
