import { beforeEach, describe, expect, it } from 'vitest';

import { SIDE_DECK_SIZE } from '../engine';
import { SeededRng } from '../engine/rng';
import {
  CUSTOM_DECK_STORAGE_KEY,
  deckFromCodes,
  loadCustomDeckCodes,
  normalizeDeckCodes,
  saveCustomDeckCodes,
  sideDeckForPool,
} from './customDeck';

describe('custom deck persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('accepts exactly ten valid cards and keeps duplicates', () => {
    const codes = Array.from({ length: SIDE_DECK_SIZE }, () => '±6');

    expect(normalizeDeckCodes(codes)).toEqual(codes);
    expect(deckFromCodes(codes).map((c) => c.code)).toEqual(codes);
  });

  it('rejects incomplete or invalid saved decks', () => {
    expect(normalizeDeckCodes(['+1', '+2'])).toBeNull();
    expect(normalizeDeckCodes(Array.from({ length: SIDE_DECK_SIZE }, () => 'bogus'))).toBeNull();

    localStorage.setItem(CUSTOM_DECK_STORAGE_KEY, JSON.stringify(['+1']));
    expect(loadCustomDeckCodes()).toBeNull();
  });

  it('saves and loads a valid custom deck', () => {
    const codes = ['+1', '+1', '+2', '+2', '-3', '-3', '±4', '±4', '±6', '±6'];

    saveCustomDeckCodes(codes);

    expect(loadCustomDeckCodes()).toEqual(codes);
  });

  it('uses builder deck when saved and mixed fallback otherwise', () => {
    const rng = new SeededRng(1);
    const custom = Array.from({ length: SIDE_DECK_SIZE }, () => '±6');

    expect(sideDeckForPool(rng, 'builder').map((c) => c.code)).not.toEqual(custom);

    saveCustomDeckCodes(custom);

    expect(sideDeckForPool(rng, 'builder').map((c) => c.code)).toEqual(custom);
  });
});
