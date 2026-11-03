import { useEffect, useState } from 'react';

import { SETS_TO_WIN_MATCH, type Seat } from '../engine';
import type { Display } from './controller';

export type MomentKind = 'bust' | 'pazaak';

/** A one-shot table event; `id` changes per occurrence so its effect replays. */
export interface Moment {
  kind: MomentKind;
  id: number;
}

/** How long cleared cards stay on screen while they sweep off the table. */
export const LEAVE_MS = 520;
/** The deciding set's cards crumble away more slowly. */
export const CRUMBLE_MS = 2000;

interface Seen {
  totals: Display['totals'];
  tables: Display['tables'];
  moments: [Moment | null, Moment | null];
  leaving: Display['tables'] | null;
  /** The cleared set decided the match; carries the seat that won it. */
  decidedBy: Seat | null;
  nextId: number;
}

/**
 * Derives the table's big moments from consecutive displays: a seat going over 20,
 * a seat landing exactly on 20, and the cards cleared when a set ends.
 */
export function useTableMoments(display: Display) {
  const [seen, setSeen] = useState<Seen>(() => ({
    totals: display.totals,
    tables: display.tables,
    moments: [null, null],
    leaving: null,
    decidedBy: null,
    nextId: 1,
  }));

  if (seen.totals !== display.totals || seen.tables !== display.tables) {
    const moments: Seen['moments'] = [seen.moments[0], seen.moments[1]];
    let nextId = seen.nextId;
    for (const seat of [0, 1] as const) {
      const was = seen.totals[seat];
      const now = display.totals[seat];
      if (now === was) continue;
      if (now > 20 && was <= 20) moments[seat] = { kind: 'bust', id: nextId++ };
      else if (now === 20) moments[seat] = { kind: 'pazaak', id: nextId++ };
    }
    const cleared = display.tables.every((t) => t.length === 0) && seen.tables.some((t) => t.length > 0);
    const champion = display.scores.findIndex((s) => s >= SETS_TO_WIN_MATCH);
    setSeen({
      totals: display.totals,
      tables: display.tables,
      moments,
      leaving: cleared ? seen.tables : seen.leaving,
      decidedBy: cleared ? (champion === -1 ? null : (champion as Seat)) : seen.decidedBy,
      nextId,
    });
  }

  useEffect(() => {
    if (!seen.leaving) return;
    const timer = setTimeout(
      () => setSeen((s) => ({ ...s, leaving: null })),
      seen.decidedBy == null ? LEAVE_MS : CRUMBLE_MS,
    );
    return () => clearTimeout(timer);
  }, [seen.leaving, seen.decidedBy]);

  return { moments: seen.moments, leaving: seen.leaving, decidedBy: seen.decidedBy };
}

/** One finished set, as the table stood when it was cleared. */
export interface SetRecord {
  totals: [number, number];
  winner: Seat | null;
  /** Side-deck cards each seat had played onto the table. */
  sideCards: [number, number];
}

/**
 * Records every set of the current match from the display alone: a set ends when the
 * set number advances, and the scores that moved say who took it. A new match (the set
 * number going back) starts a fresh record.
 */
export function useMatchRecord(display: Display): SetRecord[] {
  const [record, setRecord] = useState<{ last: Display; sets: SetRecord[] }>(() => ({ last: display, sets: [] }));

  if (record.last !== display) {
    const last = record.last;
    let sets = record.sets;
    if (display.setNumber < last.setNumber) {
      sets = [];
    } else if (display.setNumber === last.setNumber + 1) {
      const winner = display.scores[0] > last.scores[0] ? 0 : display.scores[1] > last.scores[1] ? 1 : null;
      const side = (seat: Seat) => last.tables[seat].filter((c) => c.family !== 'main').length;
      sets = [...sets, { totals: last.totals, winner, sideCards: [side(0), side(1)] }];
    }
    setRecord({ last: display, sets });
  }

  return record.sets;
}
