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

/**
 * The single shape `Board` renders, whatever drives it — the local hot-seat session or a
 * networked host/guest. `view` is the snapshot for the *local* seat (its hand + legal
 * actions); `display` is the public board (absolute seat indices). `mySeat` is which column
 * is "you" (always the active seat in hot-seat, the fixed local seat online).
 */
export interface MatchController {
  display: Display;
  view: SeatState | null;
  mySeat: Seat;
  activeSeat: Seat | null;
  banner: Banner | null;
  busy: boolean;
  finished: boolean;
  /** Connection / waiting status, shown under the title. Empty for plain hot-seat. */
  status: string;
  /** Whether the opponent column should be labelled (online) vs neutral (hot-seat). */
  online: boolean;
  /** Online link state; drives the connecting / disconnected overlays. Hot-seat omits it. */
  connection?: 'connecting' | 'connected' | 'disconnected';
  act: (action: ActionDict) => void;
  /** Offered when a rematch can be started from this client (hot-seat / host). */
  reset?: () => void;
}
