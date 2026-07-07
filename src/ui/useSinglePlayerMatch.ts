import { useCallback, useEffect, useRef, useState } from 'react';

import { aiDeck, CAMPAIGN_LENGTH, type CardPool, chooseBotAction, MatchSession, PazaakGame, SeededRng } from '../engine';
import { sideDeckForPool } from '../deckBuilder/customDeck';
import type { ActionDict, SeatState } from '../engine';
import type { MatchController } from './controller';
import { useReplay } from './replay';
import { playPazaakSound, primePazaakSounds } from './sounds';

export const BOT_DELAY_MS = 350;
const DEAL_PAUSE_MS = 650;

export interface SinglePlayerOptions {
    pool: CardPool;
    tierIndex: number;
    onResult: (won: boolean) => void;
}

export function useSinglePlayerMatch(opts: Partial<SinglePlayerOptions> = {}): MatchController {

  const { display, banner, finished, replay, resetDisplay } = useReplay(0);
  const [view, setView] = useState<SeatState | null>(null);
  const [busy, setBusy] = useState(true);

  const sessionRef = useRef<MatchSession | null>(null);
  const startedRef = useRef(false);
  const botTimeoutRef = useRef<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const resultFiredRef = useRef(false);
  const settleRef = useRef<() => void>(() => {});

  const runBotTurn = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || session.isOver) return;


    await new Promise<void>((resolve) => {
      botTimeoutRef.current = window.setTimeout(resolve, BOT_DELAY_MS);
    });

    if (session.isOver) return;

    const botAction = chooseBotAction(session.game, 1);
    const events = session.apply(botAction);
    if (botAction.kind === 'play') setView(session.stateFor(0));
    await replay(events);
    settleRef.current();
  }, [replay]);

  const settle = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;

    if (session.isOver) {
      setView(session.stateFor(0));
      setBusy(false);
      if (!resultFiredRef.current) {
        resultFiredRef.current = true;
        optsRef.current.onResult?.(session.game.winner === 0);
      }
      return;
    }

    const currentSeat = session.current!;
    setView(session.stateFor(0));

    if (currentSeat === 1) {

      setBusy(true);
      void runBotTurn();
    } else {

      setBusy(false);
      playPazaakSound('startturn');
    }
  }, [runBotTurn]);
  settleRef.current = settle;

  const start = useCallback(async () => {
    if (botTimeoutRef.current) {
      window.clearTimeout(botTimeoutRef.current);
    }
    const rng = new SeededRng((Math.random() * 1e9) >>> 0);
    const pool = optsRef.current.pool ?? 'mix';
    const tier = optsRef.current.tierIndex ?? rng.randint(0, CAMPAIGN_LENGTH - 1);
    const game = new PazaakGame(sideDeckForPool(rng, pool), aiDeck(tier), { rng });
    const session = new MatchSession(game);
    sessionRef.current = session;
    resultFiredRef.current = false;

    resetDisplay();
    setBusy(true);
    setView(session.stateFor(0));
    await new Promise<void>((r) => setTimeout(r, DEAL_PAUSE_MS));
    await replay(session.openingEvents);
    settle();
  }, [replay, resetDisplay, settle]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    primePazaakSounds();
    void start();

    return () => {
      if (botTimeoutRef.current) {
        window.clearTimeout(botTimeoutRef.current);
      }
    };
  }, [start]);

  const act = useCallback(
    (action: ActionDict) => {
      const session = sessionRef.current;
      if (!session || busy || finished || session.current !== 0) return;

      void (async () => {
        setBusy(true);
        const events = session.apply(action);
        if (action.type === 'play') setView(session.stateFor(0));
        await replay(events);
        settle();
      })();
    },
    [busy, finished, replay, settle],
  );

  return {
    display,
    view,
    mySeat: 0,
    activeSeat: finished ? null : (sessionRef.current?.current ?? 0),
    banner,
    busy,
    finished,
    status: '',
    online: false,
    vsBot: true,
    act,
    reset: () => void start(),
  };
}
