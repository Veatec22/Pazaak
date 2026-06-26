import { useCallback, useEffect, useRef, useState } from 'react';

import { aiDeck, CAMPAIGN_LENGTH, chooseBotAction, MatchSession, PazaakGame, playerDeck, SeededRng } from '../engine';
import type { ActionDict, Difficulty, SeatState } from '../engine';
import type { MatchController } from './controller';
import { useReplay } from './replay';
import { playPazaakSound, primePazaakSounds } from './sounds';

const BOT_DELAY_MS = 800;

export interface SinglePlayerOptions {
  /** Which pool the player's deck is drawn from. Default: 'normal' (flip + classic). */
  difficulty: Difficulty;
  /** Which campaign tier the AI plays (0..CAMPAIGN_LENGTH-1). Default: random. */
  tierIndex: number;
  /** Called once when the match ends, with whether the human (seat 0) won. */
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

  const start = useCallback(async () => {
    if (botTimeoutRef.current) {
      window.clearTimeout(botTimeoutRef.current);
    }
    const rng = new SeededRng((Math.random() * 1e9) >>> 0);
    const difficulty = optsRef.current.difficulty ?? 'normal';
    const tier = optsRef.current.tierIndex ?? rng.randint(0, CAMPAIGN_LENGTH - 1);
    const game = new PazaakGame(playerDeck(rng, difficulty), aiDeck(tier), { rng });
    const session = new MatchSession(game);
    sessionRef.current = session;
    resultFiredRef.current = false;

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
