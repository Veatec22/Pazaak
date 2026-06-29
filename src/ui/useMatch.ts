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
  const [handDealAnimation, setHandDealAnimation] = useState(false);
  const [handSwapAnimation, setHandSwapAnimation] = useState(false);

  const sessionRef = useRef<MatchSession | null>(null);
  const startedRef = useRef(false);
  const perspectiveRef = useRef<Seat>(0);
  const swapAnimationTimeoutRef = useRef<number | null>(null);

  const settle = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.isOver) return;
    const seat = session.current!;
    if (!handDealAnimation && seat !== perspectiveRef.current) {
      if (swapAnimationTimeoutRef.current) window.clearTimeout(swapAnimationTimeoutRef.current);
      setHandSwapAnimation(true);
      swapAnimationTimeoutRef.current = window.setTimeout(() => {
        setHandSwapAnimation(false);
        swapAnimationTimeoutRef.current = null;
      }, 320);
    }
    perspectiveRef.current = seat;
    setPerspective(seat);
    setView(session.stateFor(seat));
    playPazaakSound('startturn');
  }, [handDealAnimation]);

  const start = useCallback(async () => {
    const rng = new SeededRng((Math.random() * 1e9) >>> 0);
    const game = new PazaakGame(randomSideDeck(rng), randomSideDeck(rng), { rng });
    const session = new MatchSession(game);
    sessionRef.current = session;
    resetDisplay();
    setBusy(true);
    setHandDealAnimation(true);
    const starter = session.current ?? 0;
    perspectiveRef.current = starter;
    setHandSwapAnimation(false);
    setPerspective(starter);
    setView(session.stateFor(starter));
    await new Promise<void>((r) => setTimeout(r, 650));
    setHandDealAnimation(false);
    await replay(session.openingEvents);
    settle();
    setBusy(false);
  }, [replay, resetDisplay, settle]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    primePazaakSounds();
    void start();
    return () => {
      if (swapAnimationTimeoutRef.current) {
        window.clearTimeout(swapAnimationTimeoutRef.current);
      }
    };
  }, [start]);

  const act = useCallback(
    (action: ActionDict) => {
      const session = sessionRef.current;
      if (!session || busy || finished) return;
      void (async () => {
        setBusy(true);
        const events = session.apply(action);
        if (action.type === 'play') setView(session.stateFor(perspective));
        await replay(events);
        settle();
        setBusy(false);
      })();
    },
    [busy, finished, replay, settle, perspective],
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
    handDealAnimation,
    handSwapAnimation,
    act,
    reset: () => void start(),
  };
}
