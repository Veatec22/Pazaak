import { describe, expect, it } from 'vitest';

import { SIDE_DECK_SIZE } from './cards';
import { aiDeck, CAMPAIGN_LENGTH, CAMPAIGN_TIERS, DIFFICULTY_POOL, deckFromPool, playerDeck, POOLS } from './decks';
import { SeededRng } from './rng';

const FORBIDDEN = new Set(['dual', 'double', 'tiebreak']); // duals + gold are removed everywhere

describe('player pools', () => {
  it('contain only plus/minus/flip — never duals or gold', () => {
    for (const cards of Object.values(POOLS)) {
      expect(cards.every((c) => !FORBIDDEN.has(c.family))).toBe(true);
    }
  });

  it('have the expected sizes', () => {
    expect(POOLS.classic).toHaveLength(12); // +1..+6, -1..-6
    expect(POOLS.flip).toHaveLength(6); //     ±1..±6
    expect(POOLS.mix).toHaveLength(18);
  });

  it('flip pool is all flip; classic is plus/minus only', () => {
    expect(POOLS.flip.every((c) => c.family === 'flip')).toBe(true);
    expect(POOLS.classic.every((c) => c.family === 'plus' || c.family === 'minus')).toBe(true);
  });
});

describe('player deck', () => {
  it('draws 10 cards from the difficulty pool', () => {
    const rng = new SeededRng(1);
    for (const d of ['easy', 'normal', 'hard', 'hardcore'] as const) {
      const deck = playerDeck(rng, d);
      expect(deck).toHaveLength(SIDE_DECK_SIZE);
      const pool = new Set(POOLS[DIFFICULTY_POOL[d]].map((c) => c.code));
      expect(deck.every((c) => pool.has(c.code))).toBe(true);
    }
  });

  it('maps difficulties to the right pools', () => {
    expect(DIFFICULTY_POOL).toEqual({ easy: 'flip', normal: 'mix', hard: 'classic', hardcore: 'classic' });
  });

  it('deckFromPool never yields a forbidden family', () => {
    const rng = new SeededRng(5);
    for (let i = 0; i < 100; i++) {
      for (const c of deckFromPool(rng, 'mix')) expect(FORBIDDEN.has(c.family)).toBe(false);
    }
  });
});

describe('campaign AI tiers', () => {
  it('has 5 tiers, each a legal 10-card deck with no duals/gold', () => {
    expect(CAMPAIGN_LENGTH).toBe(5);
    CAMPAIGN_TIERS.forEach((_, i) => {
      const deck = aiDeck(i);
      expect(deck).toHaveLength(SIDE_DECK_SIZE);
      expect(deck.every((c) => !FORBIDDEN.has(c.family))).toBe(true);
    });
  });

  it('ramps up flip density from VeryEasy to VeryHard', () => {
    const flips = CAMPAIGN_TIERS.map((t) => aiDeck(CAMPAIGN_TIERS.indexOf(t)).filter((c) => c.family === 'flip').length);
    expect(flips[0]).toBe(0); // VeryEasy: pure classic
    expect(flips[4]).toBe(10); // VeryHard: all flips
    // monotonic non-decreasing flip count
    for (let i = 1; i < flips.length; i++) expect(flips[i]).toBeGreaterThanOrEqual(flips[i - 1]);
  });
});
