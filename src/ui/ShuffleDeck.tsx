import type { CSSProperties } from 'react';

import { CARD_BACK } from './cardArt';
import './shuffleDeck.css';

const CARDS = 5;

/**
 * A small deck of card backs standing in for a spinner. While waiting, the top card
 * lifts off and slides back in under the deck, one card after another. Once the other
 * player is in, it fans out like a hand ready to be dealt; `idle` leaves it squared.
 */
export function ShuffleDeck({
  state,
  size = 'small',
}: {
  state: 'shuffling' | 'ready' | 'idle';
  size?: 'small' | 'large';
}) {
  return (
    <span className={`pz-shuffle ${state} ${size}`} aria-hidden>
      {Array.from({ length: CARDS }, (_, i) => (
        <span
          key={i}
          className="pz-shuffle-card"
          style={
            {
              backgroundImage: `url(${CARD_BACK})`,
              '--i': i,
              '--fan': i - (CARDS - 1) / 2,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
