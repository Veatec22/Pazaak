import { useCallback, useEffect, useRef, useState } from 'react';

import { MatchSession, PazaakGame, randomSideDeck, SeededRng, chooseBotAction } from '../engine';
import type { ActionDict, SeatState } from '../engine';
import type { MatchController } from './controller';
import { useReplay } from './replay';
import { playPazaakSound, primePazaakSounds } from './sounds';

const BOT_DELAY_MS = 800;





export function useSinglePlayerMatch(): MatchController {

  const { display, banner, finished, replay, resetDisplay } = useReplay(0);
  const [view, setView] = useState<SeatState | null>(null);
  const [busy, setBusy] = useState(true);

  const sessionRef = useRef<MatchSession | null>(null);
  const startedRef = useRef(false);
  const botTimeoutRef = useRef<number | null>(null);

  const runBotTurn = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || session.isOver) return;


    await new Promise<void>((resolve) => {
      botTimeoutRef.current = window.setTimeout(resolve, BOT_DELAY_MS);
    });

    if (session.isOver) return;

    const botAction = chooseBotAction(session.game, 1);
    const events = session.apply(botAction);
    await replay(events);
    settle();
  }, [replay]);

  const settle = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;

    if (session.isOver) {
      setView(session.stateFor(0));
      setBusy(false);
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

  const start = useCallback(async () => {
    if (botTimeoutRef.current) {
      window.clearTimeout(botTimeoutRef.current);
    }
    const rng = new SeededRng((Math.random() * 1e9) >>> 0);
    const game = new PazaakGame(randomSideDeck(rng), randomSideDeck(rng), { rng });
    const session = new MatchSession(game);
    sessionRef.current = session;

    resetDisplay();
    setView(null);
    setBusy(true);

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
        setView(null);
        const events = session.apply(action);
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
