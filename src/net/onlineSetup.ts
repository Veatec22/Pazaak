import { sideDeckForPool } from '../deckBuilder/customDeck';
import type { CardPool, Rng, SideCard } from '../engine';

export interface OnlineSideDecks {
  hostDeck: SideCard[];
  guestDeck: SideCard[];
}

export function resolveOnlineSideDecks(
  rng: Rng,
  mode: CardPool,
  hostCustomDeck: string[] | null,
  guestCustomDeck: string[] | null,
): OnlineSideDecks {
  return {
    hostDeck: sideDeckForPool(rng, mode, hostCustomDeck),
    guestDeck: sideDeckForPool(rng, mode, guestCustomDeck),
  };
}
