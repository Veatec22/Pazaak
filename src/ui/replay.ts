import { useCallback, useState } from 'react';

import type { PazaakEvent, Seat, SeatState, TableCardTuple } from '../engine';
import { type Banner, type Display, type DisplayCard, EMPTY_DISPLAY } from './controller';
import { playPazaakSound } from './sounds';
import { useI18n } from '../net/useI18n';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
let cardSeq = 0;







function snapshotToDisplay(state: SeatState, mySeat: Seat): Display {
  const toCards = (cards: TableCardTuple[]): DisplayCard[] =>
    cards.map(([label, , family]) => ({ key: `c${cardSeq++}`, label, family }));
  const other = (1 - mySeat) as Seat;
  const tables: [DisplayCard[], DisplayCard[]] = [[], []];
  tables[mySeat] = toCards(state.you.table);
  tables[other] = toCards(state.opponent.table);
  const totals: [number, number] = [0, 0];
  totals[mySeat] = state.you.total;
  totals[other] = state.opponent.total;
  const standing: [boolean, boolean] = [false, false];
  standing[mySeat] = state.you.standing;
  standing[other] = state.opponent.standing;
  const scores: [number, number] = [0, 0];
  scores[mySeat] = state.match_score.you;
  scores[other] = state.match_score.opponent;
  return { tables, totals, standing, scores, setNumber: state.set_number };
}










export function useReplay(mySeat: Seat | null) {
  const [display, setDisplay] = useState<Display>(EMPTY_DISPLAY);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [finished, setFinished] = useState(false);
  const { t } = useI18n();

  const appendCard = useCallback((actor: Seat, label: string, total: number, family: string) => {
    setDisplay((d) => {
      const tables: [DisplayCard[], DisplayCard[]] = [d.tables[0], d.tables[1]];
      tables[actor] = [...tables[actor], { key: `c${cardSeq++}`, label, family }];
      const totals: [number, number] = [d.totals[0], d.totals[1]];
      totals[actor] = total;
      return { ...d, tables, totals };
    });
  }, []);

  const resetDisplay = useCallback(() => {
    setDisplay(EMPTY_DISPLAY);
    setBanner(null);
    setFinished(false);
  }, []);

  const replay = useCallback(
    async (events: PazaakEvent[]) => {
      for (const ev of events) {
        switch (ev.type) {
          case 'draw':
            appendCard(ev.actor, ev.card, ev.total, ev.family);
            playPazaakSound(ev.total > 20 ? 'warnbust' : 'drawmain');
            await sleep(420);
            break;
          case 'play':
            appendCard(ev.actor, ev.card, ev.total, ev.family);
            playPazaakSound('playside');
            await sleep(420);
            break;
          case 'stand':
            setDisplay((d) => {
              const standing: [boolean, boolean] = [d.standing[0], d.standing[1]];
              standing[ev.actor] = true;
              return { ...d, standing };
            });
            await sleep(220);
            break;
          case 'end_turn':
            await sleep(140);
            break;
          case 'set_over': {
            const winner = ev.winner;
            const tie = winner == null;
            const iWon = mySeat != null && winner === mySeat;
            await sleep(280);
            if (tie) playPazaakSound('drawmain');
            else if (mySeat == null) playPazaakSound('winset');
            else playPazaakSound(iWon ? 'winset' : 'loseset');
            setBanner({ kind: 'set', text: setBannerText(t, ev.winner, ev.totals, mySeat) });
            await sleep(1500);
            setDisplay((d) => ({
              tables: [[], []],
              totals: [0, 0],
              standing: [false, false],
              scores: [d.scores[0] + (winner === 0 ? 1 : 0), d.scores[1] + (winner === 1 ? 1 : 0)],
              setNumber: d.setNumber + 1,
            }));
            setBanner(null);
            await sleep(240);
            break;
          }
          case 'match_over': {
            const iWon = mySeat != null && ev.winner === mySeat;
            playPazaakSound(mySeat == null || iWon ? 'winmatch' : 'losematch');
            setBanner({ kind: 'match', text: matchBannerText(t, ev.winner, mySeat) });
            setFinished(true);
            break;
          }
        }
      }
    },
    [appendCard, mySeat, t],
  );


  const showSnapshot = useCallback(
    (state: SeatState) => {
      setDisplay(snapshotToDisplay(state, mySeat ?? 0));
      setBanner(null);
      setFinished(state.over);
    },
    [mySeat],
  );

  return { display, banner, finished, replay, resetDisplay, showSnapshot, setBanner, setFinished };
}

function setBannerText(
  t: (key: string, params?: Record<string, string | number>) => string,
  winner: Seat | null,
  totals: [number, number],
  mySeat: Seat | null,
): string {
  if (winner == null) {
    return t('tie_set', { mine: totals[0], theirs: totals[1] });
  }
  if (mySeat == null) {
    return t('player_wins_set', {
      player: winner + 1,
      mine: totals[winner],
      theirs: totals[1 - winner],
    });
  }
  const mine = totals[mySeat];
  const theirs = totals[1 - mySeat];
  return winner === mySeat
    ? t('you_win_set', { mine, theirs })
    : t('opponent_wins_set', { mine, theirs });
}

function matchBannerText(
  t: (key: string, params?: Record<string, string | number>) => string,
  winner: Seat,
  mySeat: Seat | null,
): string {
  if (mySeat == null) {
    return t('player_wins_match', { player: winner + 1 });
  }
  return winner === mySeat ? t('you_win_match') : t('opponent_wins_match');
}
