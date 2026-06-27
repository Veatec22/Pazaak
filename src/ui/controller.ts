import type { ReactNode } from 'react';

import type { ActionDict, Seat, SeatState } from '../engine';

export interface DisplayCard {
  key: string;
  label: string;
  family: string;
}

export interface Display {
  tables: [DisplayCard[], DisplayCard[]];
  totals: [number, number];
  standing: [boolean, boolean];
  scores: [number, number];
  setNumber: number;
}

export interface Banner {
  text: string;
  kind: 'set' | 'match';
}

export const EMPTY_DISPLAY: Display = {
  tables: [[], []],
  totals: [0, 0],
  standing: [false, false],
  scores: [0, 0],
  setNumber: 1,
};







export interface MatchController {
  display: Display;
  view: SeatState | null;
  mySeat: Seat;
  activeSeat: Seat | null;
  banner: Banner | null;
  busy: boolean;
  finished: boolean;

  status: string;

  online: boolean;

  vsBot?: boolean;

  connection?: 'connecting' | 'connected' | 'disconnected';
  act: (action: ActionDict) => void;

  reset?: () => void;

  /**
   * Custom call-to-action(s) for the match-over banner, replacing the default "Play again".
   * Lets the single-player wrappers inject Next / Retry / Menu buttons.
   */
  endSlot?: ReactNode;
}
