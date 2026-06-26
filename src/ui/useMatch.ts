import { useCallback, useEffect, useRef, useState } from 'react';

import { MatchSession, PazaakGame, randomSideDeck, SeededRng } from '../engine';
import type { ActionDict, Seat, SeatState } from '../engine';
import type { MatchController } from './controller';
import { useReplay } from './replay';
import { playPazaakSound, primePazaakSounds } from './sounds';





export function useMatch(): MatchController {
  const { display, banner, finished, replay, resetDisplay } = useReplay(null);
  const [view, setView] = useState<SeatState | null>(null);
  const [perspective, setPerspective] = useState<Seat>(0);
  const [busy, setBusy] = useState(true);

  const sessionRef = useRef<MatchSession | null>(null);
  const startedRef = useRef(false);

  const settle = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.isOver) return;
    const seat = session.current!;
    setPerspective(seat);
    setView(session.stateFor(seat));
    playPazaakSound('startturn');
  }, []);

  const start = useCallback(async () => {
    const rng = new SeededRng((Math.random() * 1e9) >>> 0);
    const game = new PazaakGame(randomSideDeck(rng), randomSideDeck(rng), { rng });
    const session = new MatchSession(game);
    sessionRef.current = session;
    resetDisplay();
    setView(null);
    setBusy(true);
    await replay(session.openingEvents);
    settle();
    setBusy(false);
  }, [replay, resetDisplay, settle]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    primePazaakSounds();
    void start();
  }, [start]);

  const act = useCallback(
    (action: ActionDict) => {
      const session = sessionRef.current;
      if (!session || busy || finished) return;
      void (async () => {
        setBusy(true);
        setView(null);
        const events = session.apply(action);
        await replay(events);
        settle();
        setBusy(false);
      })();
    },
    [busy, finished, replay, settle],
  );

  return {
    display,
    view,
    mySeat: perspective,
    activeSeat: finished ? null : perspective,
    banner,
    busy,
    finished,
    status: '',
    online: false,
    act,
    reset: () => void start(),
  };
}
